"use client";

import { Calendar, Clock, LogOut, Plus, RefreshCw } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { MiniCalendar } from "@/app/components/MiniCalendar";
import type { DisplayEvent } from "@/app/components/types";

const fullDate = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

export function Sidebar({
  currentDate,
  selectedDate,
  events,
  session,
  syncing,
  onAddEvent,
  onDateSelect,
  onSync
}: {
  currentDate: Date;
  selectedDate: string;
  events: DisplayEvent[];
  session: Session;
  syncing: boolean;
  onAddEvent: () => void;
  onDateSelect: (date: string) => void;
  onSync: () => void;
}) {
  const upcoming = events
    .filter((event) => event.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .slice(0, 6);

  return (
    <aside className="glass hidden w-80 shrink-0 flex-col border-r border-[color:var(--border)] lg:flex">
      <div className="flex items-center gap-3 border-b border-[color:var(--border)] px-6 py-5">
        <div className="btn-primary animate-glow-pulse flex h-11 w-11 items-center justify-center rounded-2xl text-white">
          <Calendar size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold leading-none text-[color:var(--text-primary)]">Aura</h1>
          <p className="text-xs font-medium text-[color:var(--text-muted)]">Calendar</p>
        </div>
      </div>

      <div className="space-y-3 border-b border-[color:var(--border)] px-6 py-5">
        <button
          onClick={onAddEvent}
          className="btn-primary focus-ring flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          <Plus size={18} />
          New Event
        </button>
        <button
          onClick={onSync}
          disabled={syncing}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] px-4 py-3 text-sm font-semibold text-[color:var(--text-secondary)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={17} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing" : "Sync Now"}
        </button>
      </div>

      <MiniCalendar
        key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
        currentDate={currentDate}
        selectedDate={selectedDate}
        events={events}
        onDateSelect={onDateSelect}
      />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <h2 className="mb-3 text-xs font-semibold uppercase text-[color:var(--text-muted)]">Upcoming</h2>
        <div className="space-y-3">
          {upcoming.map((event) => (
            <div key={event.id} className="rounded-xl p-3 transition hover:bg-white/5">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-[color:var(--accent)]">
                <Clock size={13} />
                {fullDate(event.date)}
              </div>
              <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{event.title}</p>
              <p className="truncate text-xs text-[color:var(--text-muted)]">{event.location || "No location"}</p>
            </div>
          ))}
          {upcoming.length === 0 && <div className="rounded-2xl bg-white/5 py-8 text-center text-sm text-[color:var(--text-muted)]">No upcoming events</div>}
        </div>
      </div>

      <div className="border-t border-[color:var(--border)] p-5">
        <div className="flex items-center gap-3">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-10 w-10 rounded-full bg-[color:var(--bg-tertiary)]" />
          ) : (
            <div className="btn-primary flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white">
              {session.user.name?.slice(0, 2).toUpperCase() ?? "CH"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{session.user.name}</p>
            <p className="truncate text-xs text-[color:var(--text-muted)]">{session.user.email}</p>
          </div>
          <button onClick={() => signOut()} className="rounded-xl p-2 text-[color:var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>

    </aside>
  );
}
