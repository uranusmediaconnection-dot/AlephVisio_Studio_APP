import type { CalendarEventInput, CalendarEventRow, EventColor } from "@/types/calendar";

// ---------------------------------------------------------------------------
// Demo mode: lets the full calendar be exercised without Google OAuth or
// Supabase credentials. Enable with DEMO_MODE=true (server) and
// NEXT_PUBLIC_DEMO_MODE=true (client, shows the demo button on the landing).
// Data lives in memory and resets when the dev server restarts.
// ---------------------------------------------------------------------------

export const DEMO_USER_ID = "demo-user";

export const isDemoModeEnabled = (): boolean => process.env.DEMO_MODE === "true";

const store = new Map<string, CalendarEventRow[]>();
let seeded = false;
let idCounter = 0;

const at = (dayOffset: number, hour: number, minute = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const seedEvent = (
  userId: string,
  title: string,
  start_at: string,
  end_at: string,
  color: EventColor,
  extra?: Partial<CalendarEventRow>
): CalendarEventRow => {
  idCounter += 1;
  const now = new Date().toISOString();
  return {
    id: `demo_${idCounter}`,
    user_id: userId,
    google_event_id: null,
    google_status: null,
    title,
    description: null,
    location: null,
    start_at,
    end_at,
    all_day: false,
    color,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    ...extra
  };
};

const seed = (): void => {
  if (seeded) return;
  seeded = true;
  const userId = DEMO_USER_ID;
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const local = (d: Date): string => d.toISOString();

  store.set(userId, [
    seedEvent(userId, "Team standup", at(0, 9, 30), at(0, 10, 0), "blue", {
      location: "Zoom",
      description: "Daily sync with the product team."
    }),
    seedEvent(userId, "Design review", at(0, 14, 0), at(0, 15, 30), "purple", {
      location: "Room A"
    }),
    seedEvent(userId, "Lunch with Sarah", at(1, 12, 30), at(1, 13, 30), "pink", {
      location: "Downtown cafe"
    }),
    seedEvent(userId, "Sprint planning", at(2, 10, 0), at(2, 11, 30), "blue", {
      location: "Board room"
    }),
    seedEvent(userId, "Dentist appointment", at(3, 16, 0), at(3, 17, 0), "teal"),
    seedEvent(userId, "Product demo", at(5, 11, 0), at(5, 12, 0), "green", {
      location: "Main stage",
      description: "Feature launch demo for stakeholders."
    }),
    seedEvent(userId, "Flight to Berlin", at(7, 8, 15), at(7, 10, 40), "orange", {
      location: "SKP Terminal 1"
    }),
    seedEvent(
      userId,
      "Quarterly offsite",
      local(new Date(year, month, Math.min(day + 9, 28))),
      local(new Date(year, month, Math.min(day + 9, 28))),
      "red",
      { all_day: true, location: "Lake Ohrid" }
    ),
    seedEvent(userId, "Code review", at(-1, 15, 0), at(-1, 16, 0), "blue"),
    seedEvent(userId, "Retrospective", at(-3, 16, 0), at(-3, 17, 0), "green", {
      location: "Room B"
    })
  ]);
};

const rowsFor = (userId: string): CalendarEventRow[] => {
  seed();
  return store.get(userId) ?? [];
};

const overlaps = (row: CalendarEventRow, startIso: string, endIso: string): boolean =>
  row.start_at <= endIso && row.end_at >= startIso;

export function getDemoEvents(userId: string, startIso?: string, endIso?: string): CalendarEventRow[] {
  const rows = rowsFor(userId).filter((row) => row.deleted_at === null);
  const filtered =
    startIso && endIso ? rows.filter((row) => overlaps(row, startIso, endIso)) : rows;
  return [...filtered].sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export function createDemoEvent(
  userId: string,
  input: Required<CalendarEventInput>
): CalendarEventRow {
  seed();
  idCounter += 1;
  const now = new Date().toISOString();
  const row: CalendarEventRow = {
    id: `demo_${Date.now()}_${idCounter}`,
    user_id: userId,
    google_event_id: null,
    google_status: "confirmed",
    title: input.title,
    description: input.description,
    location: input.location,
    start_at: input.start_at,
    end_at: input.end_at,
    all_day: input.all_day,
    color: input.color,
    deleted_at: null,
    created_at: now,
    updated_at: now
  };
  store.set(userId, [...rowsFor(userId), row]);
  return row;
}

export function updateDemoEvent(
  userId: string,
  id: string,
  input: Required<CalendarEventInput>
): CalendarEventRow | null {
  const rows = rowsFor(userId);
  const index = rows.findIndex((row) => row.id === id && row.deleted_at === null);
  if (index === -1) return null;
  const updated: CalendarEventRow = {
    ...rows[index],
    ...input,
    google_status: "confirmed",
    updated_at: new Date().toISOString()
  };
  const next = [...rows];
  next[index] = updated;
  store.set(userId, next);
  return updated;
}

export function deleteDemoEvent(userId: string, id: string): boolean {
  const rows = rowsFor(userId);
  const index = rows.findIndex((row) => row.id === id && row.deleted_at === null);
  if (index === -1) return false;
  const next = [...rows];
  next[index] = {
    ...next[index],
    google_status: "cancelled",
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  store.set(userId, next);
  return true;
}
