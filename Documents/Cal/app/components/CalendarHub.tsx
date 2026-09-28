"use client";

import { Calendar, ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EventCard } from "@/app/components/EventCard";
import { EventModal } from "@/app/components/EventModal";
import { Sidebar } from "@/app/components/Sidebar";
import { StatsBar } from "@/app/components/StatsBar";
import { Toast, type ToastMessage } from "@/app/components/Toast";
import type { DisplayEvent } from "@/app/components/types";
import type { CalendarEventInput } from "@/types/calendar";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const dayStr = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fullDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

const getCalendarCells = (year: number, month: number, events: DisplayEvent[]) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const today = dayStr(new Date());
  const cells: Array<{ day: number; dateStr: string; other: boolean; today: boolean; events: DisplayEvent[] }> = [];

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const day = prevMonthDays - i;
    const date = new Date(year, month - 1, day);
    const dateKey = dayStr(date);
    cells.push({ day, dateStr: dateKey, other: true, today: false, events: events.filter((event) => event.date === dateKey) });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = dayStr(date);
    cells.push({ day, dateStr: dateKey, other: false, today: dateKey === today, events: events.filter((event) => event.date === dateKey) });
  }

  const remaining = cells.length <= 35 ? 35 - cells.length : 42 - cells.length;
  for (let day = 1; day <= remaining; day += 1) {
    const date = new Date(year, month + 1, day);
    const dateKey = dayStr(date);
    cells.push({ day, dateStr: dateKey, other: true, today: false, events: events.filter((event) => event.date === dateKey) });
  }

  return cells;
};

export function CalendarHub() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dayStr(new Date()));
  const [currentView, setCurrentView] = useState<"month" | "day" | "agenda">("month");
  const [modalEvent, setModalEvent] = useState<DisplayEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3500);
  }, []);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const fetchEvents = useCallback(async () => {
    if (status !== "authenticated") return;

    const start = new Date(currentYear, currentMonth, 1);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(currentYear, currentMonth + 1, 0);
    end.setMonth(end.getMonth() + 1);
    setLoading(true);

    try {
      const res = await fetch(`/api/calendar/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = (await res.json()) as { events: DisplayEvent[] };
      setEvents(data.events ?? []);
    } catch {
      addToast("Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, currentMonth, currentYear, status]);

  useEffect(() => {
    // Authenticated calendar data is loaded from the API when the visible month changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchEvents();
  }, [fetchEvents]);

  const calendarCells = useMemo(() => getCalendarCells(currentYear, currentMonth, events), [currentYear, currentMonth, events]);
  const selectedEvents = events.filter((event) => event.date === selectedDate).sort((a, b) => a.start_at.localeCompare(b.start_at));

  const navigateMonth = (dir: number) => {
    const next = new Date(currentYear, currentMonth + dir, 1);
    setCurrentDate(next);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(dayStr(today));
  };

  const openNewEvent = () => {
    setModalEvent(null);
    setIsModalOpen(true);
  };

  const openEvent = (event: DisplayEvent) => {
    setModalEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalEvent(null);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const parsed = new Date(`${date}T00:00:00`);
    setCurrentDate(parsed);
  };

  const saveEvent = async (payload: CalendarEventInput) => {
    try {
      const res = await fetch(modalEvent ? `/api/calendar/events/${encodeURIComponent(modalEvent.id)}` : "/api/calendar/events", {
        method: modalEvent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await res.json()) as { event?: DisplayEvent; error?: string };
      if (!res.ok || !data.event) throw new Error(data.error ?? "Save failed");

      setEvents((prev) => (modalEvent ? prev.map((event) => (event.id === modalEvent.id ? data.event! : event)) : [...prev, data.event!]));
      addToast(modalEvent ? "Event updated" : "Event created");
      closeModal();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Save failed", "error");
    }
  };

  const deleteEvent = async () => {
    if (!modalEvent) return;

    try {
      const res = await fetch(`/api/calendar/events/${encodeURIComponent(modalEvent.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setEvents((prev) => prev.filter((event) => event.id !== modalEvent.id));
      addToast("Event deleted");
      closeModal();
    } catch {
      addToast("Delete failed", "error");
    }
  };

  const syncEvents = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = (await res.json()) as { events?: DisplayEvent[]; synced?: number; error?: string };
      if (!res.ok || !data.events) throw new Error(data.error ?? "Sync failed");
      setEvents(data.events);
      addToast(`Synced ${data.synced ?? 0} Google events`);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Sync failed", "error");
    } finally {
      setSyncing(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[color:var(--bg-primary)] text-[color:var(--text-secondary)]">
        <Loader2 className="mr-3 animate-spin" size={20} />
        Loading CalendarHub
      </main>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[color:var(--bg-primary)] p-6">
        <section className="glass-elevated w-full max-w-md rounded-[2rem] p-8 text-center">
          <div className="btn-primary mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl text-white">
            <Calendar className="text-white" size={30} />
          </div>
          <h1 className="font-display text-5xl font-semibold leading-none text-[color:var(--text-primary)]">Aura</h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">Sign in with Google to sync events into your private calendar workspace.</p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="focus-ring mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-tertiary)] px-4 py-3 text-sm font-semibold text-[color:var(--text-secondary)] transition hover:bg-white/10"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-emerald-500 to-red-500 text-[10px] font-black text-white">
              G
            </span>
            Sign in with Google
          </button>
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
            <>
              <button
                onClick={() => signIn("demo", { callbackUrl: "/" })}
                className="btn-primary focus-ring mt-3 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Explore the demo workspace
              </button>
              <p className="mt-3 text-xs leading-5 text-[color:var(--text-muted)]">
                No Google account needed. Demo data is kept in memory and resets when the server restarts.
              </p>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      <Sidebar
        currentDate={currentDate}
        selectedDate={selectedDate}
        events={events}
        session={session}
        syncing={syncing}
        onAddEvent={openNewEvent}
        onDateSelect={handleDateSelect}
        onSync={syncEvents}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] bg-[color:var(--bg-secondary)]/95 px-5 py-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={goToToday} className="focus-ring rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--text-secondary)] transition hover:bg-white/10">
              Today
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => navigateMonth(-1)} className="focus-ring rounded-xl p-2 text-[color:var(--text-secondary)] transition hover:bg-white/10">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => navigateMonth(1)} className="focus-ring rounded-xl p-2 text-[color:var(--text-secondary)] transition hover:bg-white/10">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="min-w-0">
              <h2 className="font-display truncate text-4xl font-semibold leading-none text-[color:var(--text-primary)]">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="truncate text-sm text-[color:var(--text-muted)]">{fullDate(selectedDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-[color:var(--bg-tertiary)] p-1 sm:flex">
              {(["day", "month", "agenda"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                    currentView === view
                      ? "bg-[color:var(--bg-elevated)] text-[color:var(--accent)] shadow-[var(--shadow-sm)]"
                      : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
            <button onClick={() => addToast("Search can be wired to Supabase filters next")} className="focus-ring rounded-xl bg-[color:var(--bg-tertiary)] p-2.5 text-[color:var(--text-secondary)] transition hover:text-[color:var(--accent)]">
              <Search size={18} />
            </button>
            <button onClick={openNewEvent} className="btn-primary focus-ring rounded-xl p-2.5 text-white lg:hidden">
              <Plus size={18} />
            </button>
          </div>
        </header>

        <StatsBar events={events} />

        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
          <div className="grid grid-cols-7 rounded-t-3xl border border-b-0 border-[color:var(--border)] bg-[color:var(--bg-secondary)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-4 text-center text-xs font-semibold uppercase text-[color:var(--text-muted)]">
                {day}
              </div>
            ))}
          </div>
          <div className="relative grid flex-1 grid-cols-7 grid-rows-5 gap-px overflow-hidden rounded-b-3xl border border-[color:var(--border)] bg-[color:var(--border)]">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-sm font-semibold text-[color:var(--text-secondary)] backdrop-blur-sm">
                <Loader2 className="mr-2 animate-spin" size={18} />
                Loading events
              </div>
            )}
            {calendarCells.map((cell) => (
              <button
                key={cell.dateStr}
                onClick={() => handleDateSelect(cell.dateStr)}
                className={`calendar-cell flex min-h-[7rem] flex-col overflow-hidden p-2 text-left transition ${
                  cell.other ? "bg-[color:var(--bg-primary)] text-[color:var(--text-muted)]" : "bg-[color:var(--bg-secondary)]"
                } ${cell.today ? "today-cell" : ""} ${selectedDate === cell.dateStr ? "selected-cell" : ""}`}
              >
                <span
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    cell.today ? "bg-[image:var(--gradient-accent)] text-white shadow-md" : "text-[color:var(--text-primary)]"
                  } ${cell.other ? "text-[color:var(--text-muted)]" : ""}`}
                >
                  {cell.day}
                </span>
                <span className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                  {cell.events.slice(0, 3).map((event) => (
                    <EventCard key={event.id} event={event} onClick={openEvent} compact />
                  ))}
                  {cell.events.length > 3 && <span className="pl-1 text-[10px] font-semibold text-[color:var(--text-muted)]">+{cell.events.length - 3} more</span>}
                </span>
              </button>
            ))}
          </div>

          {(currentView === "day" || currentView === "agenda") && (
            <div className="mt-4 rounded-3xl bg-[color:var(--bg-secondary)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[color:var(--text-primary)]">{currentView === "day" ? fullDate(selectedDate) : "Selected Agenda"}</h3>
                <button onClick={openNewEvent} className="focus-ring rounded-xl bg-[color:var(--accent)]/20 px-3 py-2 text-sm font-semibold text-[color:var(--accent)] transition hover:bg-[color:var(--accent)]/30">
                  Add Event
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {selectedEvents.map((event) => (
                  <EventCard key={event.id} event={event} onClick={openEvent} />
                ))}
                {selectedEvents.length === 0 && (
                  <p className="rounded-2xl bg-[color:var(--bg-tertiary)] px-4 py-8 text-center text-sm font-semibold text-[color:var(--text-muted)]">No events on this date</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {isModalOpen && <EventModal event={modalEvent} selectedDate={selectedDate} onClose={closeModal} onDelete={deleteEvent} onSave={saveEvent} />}

      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))} />
        ))}
      </div>
    </main>
  );
}
