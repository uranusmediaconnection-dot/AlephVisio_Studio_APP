import React, { useState, useEffect, startTransition } from 'react';

// `ViewTransition` / `addTransitionType` only exist in React's experimental /
// canary releases. Fall back gracefully so the app still renders on stable React
// instead of crashing with a blank page on a missing export.
const ViewTransition = React.ViewTransition ?? (({ children }) => <>{children}</>);
const addTransitionType = React.addTransitionType ?? (() => {});
import useCalendarStore from './store/useCalendarStore';
import { 
  List, 
  CaretLeft, 
  CaretRight, 
  MagnifyingGlass, 
  Question, 
  Gear, 
  DotsNine,
  Plus,
  CaretDown
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarGrid from './components/CalendarGrid';
import DebugPanel from './components/DebugPanel';
import MiniCalendar from './components/MiniCalendar';

const App = () => {
  const currentDate = useCalendarStore(s => s.currentDate);
  const view = useCalendarStore(s => s.view);
  const setView = useCalendarStore(s => s.setView);
  const next = useCalendarStore(s => s.next);
  const prev = useCalendarStore(s => s.prev);
  const today = useCalendarStore(s => s.today);
  const isSidebarOpen = useCalendarStore(s => s.isSidebarOpen);
  const toggleSidebar = useCalendarStore(s => s.toggleSidebar);
  const addLog = useCalendarStore(s => s.addLog);

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const handleViewChange = (newView) => {
    startTransition(() => {
      setView(newView);
      addLog(`View changed to ${newView}`);
    });
  };

  const handleNext = () => {
    startTransition(() => {
      try { addTransitionType('nav-forward'); } catch (e) {}
      next();
    });
  };

  const handlePrev = () => {
    startTransition(() => {
      try { addTransitionType('nav-back'); } catch (e) {}
      prev();
    });
  };

  const handleToday = () => {
    startTransition(() => {
      today();
    });
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#202124] transition-colors duration-300">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={toggleSidebar} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <List size={20} />
          </button>
          <div className="flex items-center gap-2 ml-1 cursor-pointer">
            <img src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_12_2x.png" alt="logo" className="w-8 h-8" />
            <span className="text-[22px] text-[#5f6368] dark:text-[#e8eaed] font-medium tracking-tight">Andromeda</span>
          </div>
          
          <div className="flex items-center ml-12 gap-1">
            <button 
              onClick={handleToday}
              className="px-4 py-1.5 border border-gray-300 dark:border-white/20 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mr-4"
            >
              Today
            </button>
            <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <CaretLeft size={16} weight="bold" />
            </button>
            <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <CaretRight size={16} weight="bold" />
            </button>
            <h2 className="text-xl text-[#3c4043] dark:text-[#e8eaed] ml-4 font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 mr-4 w-[500px]">
            <MagnifyingGlass size={20} className="text-gray-500" />
            <input type="text" placeholder="Search" className="bg-transparent border-none outline-none ml-3 w-full text-sm" />
          </div>
          
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"><Question size={22} /></button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <Gear size={22} />
            </button>
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-white/20 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                <span className="text-sm font-medium capitalize">{view}</span>
                <CaretDown size={12} weight="bold" />
              </div>
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#3c4043] shadow-xl border border-gray-100 dark:border-white/10 rounded-md py-2 w-48 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[100]">
                {['dashboard', 'day', 'week', 'month', 'year', 'schedule'].map(v => (
                  <div 
                    key={v}
                    onClick={() => handleViewChange(v)}
                    className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer capitalize"
                  >
                    {v}
                  </div>
                ))}
              </div>
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ml-2"><DotsNine size={22} /></button>
            <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-white font-bold ml-2 cursor-pointer shadow-sm">
              S
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`shrink-0 border-r border-gray-200 dark:border-white/10 transition-all duration-300 overflow-hidden flex flex-col ${isSidebarOpen ? 'w-64 p-4 pr-6' : 'w-0'}`}
        >
          <button className="flex items-center gap-3 px-5 py-4 rounded-[28px] bg-white dark:bg-[#3c4043] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow mb-6 ml-1 active:scale-95 group">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <path fill="#34A853" d="M16 16v14h4V20z" />
              <path fill="#4285F4" d="M30 16H20v4h14z" />
              <path fill="#FBBC05" d="M6 16v4h10v-4z" />
              <path fill="#EA4335" d="M20 16V6h-4v10z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-[#e8eaed]">Create</span>
            <CaretDown size={10} weight="bold" className="ml-2 text-gray-400" />
          </button>

          <div className="flex flex-col gap-8">
            <MiniCalendar />
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-md px-3 py-2">
                <MagnifyingGlass size={16} className="text-gray-500" />
                <input type="text" placeholder="Search for people" className="bg-transparent border-none outline-none ml-3 w-full text-xs" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between group cursor-pointer">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">My Calendars</h3>
                  <CaretDown size={12} weight="bold" className="text-gray-400 group-hover:text-gray-600" />
                </div>
                <div className="flex items-center gap-3 px-2 cursor-pointer">
                  <div className="w-4 h-4 rounded-sm bg-accent-blue border border-white dark:border-gray-800" />
                  <span className="text-xs font-medium text-[#3c4043] dark:text-[#e8eaed]">Andromeda</span>
                </div>
                <div className="flex items-center gap-3 px-2 cursor-pointer">
                  <div className="w-4 h-4 rounded-sm bg-accent-green border border-white dark:border-gray-800" />
                  <span className="text-xs font-medium text-[#3c4043] dark:text-[#e8eaed]">Birthdays</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* View Grid */}
        <main className="flex-1 overflow-hidden relative">
          <ViewTransition 
            key={view + currentDate.toDateString()}
            enter={{ 'nav-forward': 'slide-from-right', 'nav-back': 'slide-from-left', default: 'fade-in' }}
            exit={{ 'nav-forward': 'slide-to-left', 'nav-back': 'slide-to-right', default: 'fade-out' }}
            default="none"
          >
            <CalendarGrid />
          </ViewTransition>
        </main>
      </div>

      <DebugPanel />
    </div>
  );
};

export default App;
