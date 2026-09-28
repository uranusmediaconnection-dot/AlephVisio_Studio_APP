import { NextResponse, type NextRequest } from "next/server";
import { validateEventInput } from "@/lib/calendar-validation";
import { createDemoEvent, getDemoEvents } from "@/lib/demo";
import { mapGoogleEventToDbEvent, toDisplayEvent, toGoogleEventRequest } from "@/lib/event-mapping";
import { getCalendarClient } from "@/lib/google";
import { getRouteAuth } from "@/lib/route-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { CalendarEventRow } from "@/types/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toIsoBound = (value: string | null, fallback: Date): string => {
  if (!value) return fallback.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
};

export async function GET(req: NextRequest) {
  const auth = await getRouteAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 1);
  const defaultEnd = new Date(now);
  defaultEnd.setMonth(defaultEnd.getMonth() + 3);

  const startAt = toIsoBound(searchParams.get("startDate"), defaultStart);
  const endAt = toIsoBound(searchParams.get("endDate"), defaultEnd);

  if (auth.isDemo) {
    return NextResponse.json({
      events: getDemoEvents(auth.userId, startAt, endAt).map(toDisplayEvent)
    });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .select("*")
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .gte("end_at", startAt)
    .lte("start_at", endAt)
    .order("start_at", { ascending: true });

  if (error) return NextResponse.json({ error: "Failed to fetch events." }, { status: 500 });

  return NextResponse.json({ events: (data as CalendarEventRow[]).map(toDisplayEvent) });
}

export async function POST(req: NextRequest) {
  const auth = await getRouteAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const validation = validateEventInput(await req.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  if (auth.isDemo) {
    const event = createDemoEvent(auth.userId, validation.value);
    return NextResponse.json({ event: toDisplayEvent(event) }, { status: 201 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    const calendar = getCalendarClient(auth.googleToken);
    const googleEvent = await calendar.events.insert({
      calendarId: "primary",
      requestBody: toGoogleEventRequest(validation.value)
    });
    const mapped = mapGoogleEventToDbEvent(googleEvent.data, auth.userId);
    const row = {
      ...mapped,
      title: validation.value.title,
      description: validation.value.description,
      location: validation.value.location,
      start_at: validation.value.start_at,
      end_at: validation.value.end_at,
      all_day: validation.value.all_day,
      color: validation.value.color
    };

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: "Failed to save event." }, { status: 500 });

    return NextResponse.json({ event: toDisplayEvent(data as CalendarEventRow) }, { status: 201 });
  } catch (error) {
    console.error("Create event failed", error);
    return NextResponse.json({ error: "Failed to create Google Calendar event." }, { status: 500 });
  }
}
