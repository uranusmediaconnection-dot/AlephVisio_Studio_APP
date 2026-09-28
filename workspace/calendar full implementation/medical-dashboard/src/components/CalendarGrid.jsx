import React, { useMemo, useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfDay,
  eachHourOfInterval,
  addHours
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import useCalendarStore from '../store/useCalendarStore';
import Dashboard from './Dashboard';

const CalendarGrid = () => {
  const currentDate = useCalendarStore(s => s.currentDate);
  const view = useCalendarStore(s => s.view);
  const events = useCalendarStore(s => s.events);
  const addEvent = useCalendarStore(s => s.addEvent);

  const [selectedDay, setSelectedDay] = useState(null);

  // Month View Logic
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Week View Logic
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Hours for Day/Week View
  const hours = useMemo(() => {
    const start = startOfDay(new Date());
    const end = addHours(start, 23);
    return eachHourOfInterval({ start, end });
  }, []);

  const renderMonthView = () => (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-white/10">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="py-2 text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200 dark:border-white/10 last:border-0">
            {day}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden">
        {monthDays.slice(0, 35).map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
          
          return (
            <div 
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`border-r border-b border-gray-200 dark:border-white/10 p-1 flex flex-col group transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''}`}
            >
              <div className="flex justify-center mb-1">
                <span className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                  isToday 
                    ? 'bg-accent-blue text-white' 
                    : isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="text-[11px] px-2 py-0.5 rounded bg-accent-blue text-white truncate font-medium shadow-sm"
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-[#202124] z-20">
        <div className="w-16 border-r border-gray-200 dark:border-white/10 shrink-0" />
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map(day => (
            <div key={day.toString()} className="py-4 text-center border-r border-gray-200 dark:border-white/10 last:border-0">
              <p className="text-[11px] font-bold text-gray-500 uppercase">{format(day, 'EEE')}</p>
              <p className={`text-2xl font-medium mt-1 w-12 h-12 flex items-center justify-center rounded-full mx-auto ${isSameDay(day, new Date()) ? 'bg-accent-blue text-white' : ''}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex relative">
        <div className="w-16 border-r border-gray-200 dark:border-white/10 shrink-0 flex flex-col">
          {hours.map(hour => (
            <div key={hour.toString()} className="h-12 -mt-2 text-[10px] text-gray-400 text-right pr-2">
              {format(hour, 'h aa')}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 relative">
          {weekDays.map((_, i) => (
            <div key={i} className="border-r border-gray-200 dark:border-white/10 last:border-0 relative">
              {hours.map((_, j) => (
                <div key={j} className="h-12 border-b border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5" />
              ))}
            </div>
          ))}
          
          {/* Mock Current Time Indicator */}
          <div className="absolute left-0 right-0 h-px bg-accent-red z-10 pointer-events-none top-[15%]" />
        </div>
      </div>
    </div>
  );

  const renderDayView = () => (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-[#202124] z-20">
        <div className="w-16 border-r border-gray-200 dark:border-white/10 shrink-0" />
        <div className="flex-1 py-4 text-center">
          <p className="text-[11px] font-bold text-gray-500 uppercase">{format(currentDate, 'EEEE')}</p>
          <p className={`text-2xl font-medium mt-1 w-12 h-12 flex items-center justify-center rounded-full mx-auto ${isSameDay(currentDate, new Date()) ? 'bg-accent-blue text-white' : ''}`}>
            {format(currentDate, 'd')}
          </p>
        </div>
      </div>

      <div className="flex relative">
        <div className="w-16 border-r border-gray-200 dark:border-white/10 shrink-0 flex flex-col">
          {hours.map(hour => (
            <div key={hour.toString()} className="h-20 -mt-2 text-[10px] text-gray-400 text-right pr-2">
              {format(hour, 'h aa')}
            </div>
          ))}
        </div>
        <div className="flex-1 relative">
          {hours.map((_, j) => (
            <div 
              key={j} 
              onClick={() => setSelectedDay(currentDate)}
              className="h-20 border-b border-gray-100 dark:border-white/5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" 
            />
          ))}
          
          {/* Day Events */}
          {events.filter(e => isSameDay(new Date(e.date), currentDate)).map(event => (
            <div 
              key={event.id}
              className="absolute left-2 right-2 p-2 rounded bg-accent-blue/90 text-white text-xs font-medium shadow-sm border border-white/20"
              style={{ 
                top: `${new Date(event.date).getHours() * 80 + (new Date(event.date).getMinutes() / 60) * 80}px`,
                height: '60px'
              }}
            >
              <p className="font-bold">{event.title}</p>
              <p className="opacity-80 text-[10px]">{format(new Date(event.date), 'h:mm aa')}</p>
            </div>
          ))}

          {/* Current Time Indicator */}
          {isSameDay(currentDate, new Date()) && (
            <div 
              className="absolute left-0 right-0 h-px bg-accent-red z-10 pointer-events-none"
              style={{ top: `${new Date().getHours() * 80 + (new Date().getMinutes() / 60) * 80}px` }}
            >
              <div className="w-3 h-3 bg-accent-red rounded-full -ml-1.5 -mt-1.5 shadow-sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));
    return (
      <div className="h-full overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-4 gap-x-12 gap-y-16">
          {months.map(month => (
            <div key={month.toString()} className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest ml-2">{format(month, 'MMMM')}</h3>
              <div className="grid grid-cols-7 text-[10px]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} className="text-center text-gray-400 font-bold py-1">{d}</div>
                ))}
                {(() => {
                  const start = startOfWeek(startOfMonth(month));
                  const end = endOfWeek(endOfMonth(month));
                  const days = eachDayOfInterval({ start, end });
                  return days.map((day, i) => (
                    <div 
                      key={i} 
                      className={`text-center py-1.5 rounded-full transition-colors ${
                        isSameDay(day, new Date()) ? 'bg-accent-blue text-white font-bold' :
                        !isSameMonth(day, month) ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                  ));
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderScheduleView = () => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    return (
      <div className="h-full overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-12">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-20 opacity-30 italic">No upcoming events</div>
          ) : (
            sortedEvents.map((event, i) => (
              <div key={event.id} className="flex gap-8 group">
                <div className="w-24 shrink-0 text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(new Date(event.date), 'EEE')}</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{format(new Date(event.date), 'd')}</p>
                </div>
                <div className="flex-1 pb-12 border-l-2 border-gray-100 dark:border-white/5 pl-8 relative group-last:border-transparent">
                  <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-accent-blue border-4 border-white dark:border-[#202124] group-hover:scale-125 transition-transform" />
                  <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-transparent hover:border-accent-blue/20 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold">{event.title}</h3>
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue">
                        {format(new Date(event.date), 'h:mm aa')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Andromeda Medical Dashboard • General Appointment</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {view === 'dashboard' && <Dashboard />}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
      {view === 'year' && renderYearView()}
      {view === 'schedule' && renderScheduleView()}

      {/* Quick Add Modal */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[450px] bg-white dark:bg-[#3c4043] rounded-xl shadow-2xl overflow-hidden p-8"
            >
              <h2 className="text-xl font-medium mb-6">Add Event</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const title = e.target.title.value;
                if (!title) return;
                addEvent({ title, date: selectedDay });
                setSelectedDay(null);
              }}>
                <input 
                  autoFocus
                  name="title"
                  placeholder="Add title" 
                  className="w-full text-2xl border-b-2 border-accent-blue outline-none pb-2 mb-6 dark:bg-transparent"
                />
                <div className="flex justify-between items-center text-sm text-gray-600 mb-8">
                  <span>{format(selectedDay, 'EEEE, MMMM d')}</span>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setSelectedDay(null)} className="px-6 py-2 rounded font-medium hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-accent-blue text-white rounded font-medium shadow-md hover:bg-blue-600 transition-colors">Save</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarGrid;
