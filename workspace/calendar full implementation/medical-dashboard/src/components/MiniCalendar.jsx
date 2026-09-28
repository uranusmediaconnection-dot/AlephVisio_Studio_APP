import React, { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import useCalendarStore from '../store/useCalendarStore';

const MiniCalendar = () => {
  // NOTE: previously this used `new Date()` on every render (which defeats the
  // useMemo cache and disconnects the widget from the app). It now follows the
  // shared store date and its nav buttons / day clicks actually work.
  const currentDate = useCalendarStore(s => s.currentDate);
  const setCurrentDate = useCalendarStore(s => s.setCurrentDate);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between px-2 mb-3">
        <span className="text-sm font-medium text-[#3c4043] dark:text-[#e8eaed]">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Previous month"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Next month"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={`${d}-${i}`} className="text-[10px] font-medium text-gray-500">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center gap-y-1">
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, currentDate);
          const isCurrMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => setCurrentDate(day)}
              className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-full mx-auto cursor-pointer transition-colors ${
                isToday ? 'bg-accent-blue text-white font-bold' :
                isSelected ? 'bg-accent-blue/15 text-accent-blue font-bold' :
                isCurrMonth ? 'text-[#3c4043] dark:text-[#e8eaed] hover:bg-gray-100 dark:hover:bg-white/5' : 'text-gray-300'
              }`}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
