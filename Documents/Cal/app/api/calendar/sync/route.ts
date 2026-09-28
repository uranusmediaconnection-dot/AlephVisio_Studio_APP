import { NextResponse, type NextRequest } from "next/server";
import type { calendar_v3 } from "googleapis";
import { getDemoEvents } from "@/lib/demo";
import { mapGoogleEventToDbEvent, toDisplayEvent } from "@/lib/event-mapping";
import { getCalendarClient } from "@/lib/google";
import { getRouteAuth } from "@/lib/route-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { CalendarEventRow } from "@/types/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const calendarId = "primary";

const syncWindow = () => {
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setMonth(timeMin.getMonth() - 6);
  const timeMax = new Date(now);
  timeMax.setMonth(timeMax.getMonth() + 12);
  return { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() };
};

async function getSyncToken(userId: string): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("calendar_sync_state")
    .select("next_sync_token")
    .eq("user_id", userId)
    .eq("calendar_id", calendarId)
    .maybeSingle();

  return data?.next_sync_token ?? null;
}

async function saveSyncState(userId: string, nextSyncToken: string | null, lastError: string | null) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("calendar_sync_state").upsert(
    {
      user_id: userId,
      calendar_id: calendarId,
      next_sync_token: nextSyncToken,
      last_synced_at: new Date().toISOString(),
      last_error: lastError,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,calendar_id" }
  );
}

async function listGoogleEvents(
  calendar: calendar_v3.Calendar,
  syncToken: string | null
): Promise<{ items: calendar_v3.Schema$Event[]; nextSyncToken: string | null }> {
  const items: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;
  const window = syncWindow();

  do {
    const res = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      pageToken,
      showDeleted: true,
      singleEvents: false,
      syncToken: syncToken ?? undefined,
      timeMin: syncToken ? undefined : window.timeMin,
      timeMax: syncToken ? undefined : window.timeMax
    });

    items.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
    nextSyncToken = res.data.nextSyncToken ?? nextSyncToken;
  } while (pageToken);

  return { items, nextSyncToken };
}

export async function POST(req: NextRequest) {
  const auth = await getRouteAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (auth.isDemo) {
    const events = getDemoEvents(auth.userId);
    return NextResponse.json({
      events: events.map(toDisplayEvent),
      nextSyncToken: null,
      synced: events.length
    });
  }

  const calendar = getCalendarClient(auth.googleToken);
  let syncToken = await getSyncToken(auth.userId);

  try {
    let result: { items: calendar_v3.Schema$Event[]; nextSyncToken: string | null };

    try {
      result = await listGoogleEvents(calendar, syncToken);
    } catch (error) {
      const status = (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
      if (status !== 410) throw error;
      syncToken = null;
      result = await listGoogleEvents(calendar, null);
    }

    const rows = result.items.map((event) => mapGoogleEventToDbEvent(event, auth.userId));
    const supabaseAdmin = getSupabaseAdmin();

    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("calendar_events").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    }

    await saveSyncState(auth.userId, result.nextSyncToken, null);

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .eq("user_id", auth.userId)
      .is("deleted_at", null)
      .order("start_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      events: (data as CalendarEventRow[]).map(toDisplayEvent),
      nextSyncToken: result.nextSyncToken,
      synced: rows.length
    });
  } catch (error) {
    console.error("Calendar sync failed", error);
    await saveSyncState(auth.userId, syncToken, "Sync failed");
    return NextResponse.json({ error: "Sync failed." }, { status: 500 });
  }
}
