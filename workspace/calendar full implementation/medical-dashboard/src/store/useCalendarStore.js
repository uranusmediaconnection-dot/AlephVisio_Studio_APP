import { create } from 'zustand';
import { 
  addDays, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  format, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek
} from 'date-fns';

const initialState = {
  currentDate: new Date(),
  view: 'dashboard', // 'dashboard' | 'day' | 'week' | 'month' | 'year' | 'schedule'
  events: [
    {
      id: '1',
      title: 'Andromeda Kickoff',
      date: new Date(),
      color: '#1a73e8',
      type: 'event'
    }
  ],
  isSidebarOpen: true,
  debugMode: false,
  logs: [],
};

const useCalendarStore = create((set, get) => ({
  ...initialState,

  // Actions
  reset: () => set(initialState),
  setCurrentDate: (date) => set({ currentDate: date }),
  
  today: () => set({ currentDate: new Date() }),
  
  next: () => {
    const { view, currentDate } = get();
    if (view === 'month') set({ currentDate: addMonths(currentDate, 1) });
    else if (view === 'week') set({ currentDate: addWeeks(currentDate, 1) });
    else set({ currentDate: addDays(currentDate, 1) });
  },

  prev: () => {
    const { view, currentDate } = get();
    if (view === 'month') set({ currentDate: subMonths(currentDate, 1) });
    else if (view === 'week') set({ currentDate: subWeeks(currentDate, 1) });
    else set({ currentDate: subDays(currentDate, 1) });
  },

  setView: (view) => set({ view }),
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  addEvent: (event) => {
    const newEvent = {
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      ...event,
    };
    set((state) => ({ events: [...state.events, newEvent] }));
    get().addLog(`Event added: ${newEvent.title}`);
  },

  deleteEvent: (id) => {
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },

  addLog: (message) => {
    const log = { timestamp: new Date().toISOString(), message };
    set((state) => ({ logs: [log, ...state.logs].slice(0, 50) }));
  },

  clearLogs: () => set({ logs: [] }),
  toggleDebug: () => set((state) => ({ debugMode: !state.debugMode })),
}));

export default useCalendarStore;
