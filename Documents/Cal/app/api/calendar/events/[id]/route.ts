import { NextResponse, type NextRequest } from "next/server";
import { validateEventInput } from "@/lib/calendar-validation";
import { deleteDemoEvent, updateDemoEvent } from "@/lib/demo";
import { toDisplayEvent, toGoogleEventRequest } from "@/lib/event-mapping";
import { getCalendarClient } from "@/lib/google";
import { getRouteAuth } from "@/lib/route-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { CalendarEventRow } from "@/types/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOwnedEvent(id: string, userId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;
  return data as CalendarEventRow;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const auth = await getRouteAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const validation = validateEventInput(await req.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  if (auth.isDemo) {
    const updated = updateDemoEvent(auth.userId, id, validation.value);
    if (!updated) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ event: toDisplayEvent(updated) });
  }

  const existing = await getOwnedEvent(id, auth.userId);
  if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const supabaseAdmin = getSupabaseAdmin();

  try {
    if (existing.google_event_id) {
      const calendar = getCalendarClient(auth.googleToken);
      await calendar.events.update({
        calendarId: "primary",
        eventId: existing.google_event_id,
        requestBody: toGoogleEventRequest(validation.value)
      });
    }

    const { data, error } = await supabaseAdmin
      .from("calendar_events")
      .update({
        ...validation.value,
        google_status: "confirmed",
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .eq("user_id", auth.userId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: "Failed to update event." }, { status: 500 });

    return NextResponse.json({ event: toDisplayEvent(data as CalendarEventRow) });
  } catch (error) {
    console.error("Update event failed", error);
    return NextResponse.json({ error: "Failed to update Google Calendar event." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await getRouteAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (auth.isDemo) {
    const deleted = deleteDemoEvent(auth.userId, id);
    if (!deleted) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  }

  const existing = await getOwnedEvent(id, auth.userId);
  if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const supabaseAdmin = getSupabaseAdmin();

  try {
    if (existing.google_event_id) {
      const calendar = getCalendarClient(auth.googleToken);
      await calendar.events.delete({
        calendarId: "primary",
        eventId: existing.google_event_id
      });
    }

    const { error } = await supabaseAdmin
      .from("calendar_events")
      .update({
        google_status: "cancelled",
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .eq("user_id", auth.userId);

    if (error) return NextResponse.json({ error: "Failed to delete event." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete event failed", error);
    return NextResponse.json({ error: "Failed to delete Google Calendar event." }, { status: 500 });
  }
}
