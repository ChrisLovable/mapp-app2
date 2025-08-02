import React from 'react';
import type { CalendarEvent, CalendarDay } from '../../types/calendar';
import { getCalendarDays, getMonthDays, getWeekDays, getDayHours, getEventTypeColor, getEventsForDate, getEventsByTypeForDate, getEventsForDateAndHour, formatEventTime, formatEventDate } from '../../utils/calendarUtils';

interface CalendarViewsProps {
  currentView: 'month' | 'week' | 'day';
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  renderEventBlock: (event: CalendarEvent, isWeekView?: boolean) => React.ReactNode;
}

export const MonthView: React.FC<CalendarViewsProps> = ({
  currentDate,
  events,
  onDayClick,
  onEventClick,
  renderEventBlock
}) => {
  const days = getCalendarDays(currentDate);

  return (
    <div className="calendar-month-view">
      {/* Month Header */}
      <div className="mb-4 text-center rounded-lg" style={{ 
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))', 
        padding: '10px' 
      }}>
        <div className="text-white font-bold" style={{ fontSize: '18px' }}>
          {currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          })}
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-white font-bold p-2" style={{ fontSize: '14px' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(events, day.date);
          const eventsByType = getEventsByTypeForDate(events, day.date);
          
          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-700 cursor-pointer transition-colors ${
                day.isToday ? 'bg-blue-600' : day.isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900'
              } hover:bg-gray-700`}
              onClick={() => onDayClick(day.date)}
            >
              <div className={`text-sm font-bold mb-1 ${
                day.isToday ? 'text-white' : day.isCurrentMonth ? 'text-white' : 'text-gray-500'
              }`}>
                {day.dayNumber}
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {Object.entries(eventsByType).slice(0, 3).map(([type, typeEvents]) => (
                  <div
                    key={type}
                    className="text-xs p-1 rounded cursor-pointer"
                    style={{ 
                      backgroundColor: getEventTypeColor(type),
                      color: 'white'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeEvents.length > 0) {
                        onEventClick(typeEvents[0]);
                      }
                    }}
                  >
                    {typeEvents.length > 1 ? `${typeEvents.length} ${type}` : typeEvents[0]?.title || type}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const WeekView: React.FC<CalendarViewsProps> = ({
  currentDate,
  events,
  onDayClick,
  onEventClick,
  renderEventBlock
}) => {
  const weekDays = getWeekDays(currentDate);
  const hours = getDayHours();

  return (
    <div className="calendar-week-view">
      {/* Week Header */}
      <div className="mb-4 text-center rounded-lg" style={{ 
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))', 
        padding: '10px' 
      }}>
        <div className="text-white font-bold" style={{ fontSize: '16px' }}>
          {formatEventDate(currentDate)}
        </div>
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-8 gap-1">
        {/* Time Column */}
        <div className="space-y-1">
          <div className="h-12"></div> {/* Header spacer */}
          {hours.map((hour) => (
            <div key={hour} className="h-20 text-white text-xs p-1 border-b border-gray-700">
              {hour === 12 ? '12:00' : hour > 12 ? `${hour}:00` : `${hour}:00`}
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {weekDays.map((day) => {
          const dayEvents = getEventsForDate(events, day.date);
          
          return (
            <div key={day.date.toISOString()} className="space-y-1">
              {/* Day Header */}
              <div 
                className="h-12 p-2 text-center cursor-pointer hover:bg-gray-700 transition-colors"
                style={{ 
                  background: day.isToday ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid #666'
                }}
                onClick={() => onDayClick(day.date)}
              >
                <div className="text-white font-bold text-sm">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-white text-xs">
                  {day.date.getDate()}
                </div>
              </div>

              {/* Time Slots */}
              {hours.map((hour) => {
                const hourEvents = getEventsForDateAndHour(events, day.date, hour);
                
                return (
                  <div
                    key={hour}
                    className="h-20 border-b border-gray-700 relative hover:bg-gray-800 transition-colors cursor-pointer"
                    style={{ border: '1px solid #666' }}
                    onClick={() => {
                      const newDate = new Date(day.date);
                      newDate.setHours(hour, 0, 0, 0);
                      onDayClick(newDate);
                    }}
                  >
                    {/* Events in this hour */}
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 z-10 rounded-md overflow-hidden shadow-lg"
                        style={{
                          top: '2px',
                          height: 'calc(100% - 4px)',
                          minHeight: '20px',
                          maxHeight: 'calc(100% - 4px)'
                        }}
                      >
                        {renderEventBlock(event, true)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DayView: React.FC<CalendarViewsProps> = ({
  currentDate,
  events,
  onDayClick,
  onEventClick,
  renderEventBlock
}) => {
  const hours = getDayHours();

  return (
    <div className="calendar-day-view" style={{ border: '2px solid white', borderRadius: '8px', padding: '10px' }}>
      {/* Day Header */}
      <div className="mb-2 text-center rounded-lg" style={{ 
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))', 
        padding: '5px' 
      }}>
        <div className="text-white font-bold" style={{ fontSize: '15px' }}>
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Day Timeline */}
      <div className="day-timeline rounded-lg overflow-hidden">
        {hours.map((hour) => {
          const hourEvents = getEventsForDateAndHour(events, currentDate, hour);
          
          return (
            <div
              key={hour}
              className="timeline-hour p-3 border-b border-gray-700 flex items-center h-20 hover:bg-gray-800 transition-colors group"
              style={{ border: '1px solid #666' }}
            >
              <div className="text-white text-sm font-bold text-center flex items-center justify-center" style={{ width: '50px', marginLeft: '-10px' }}>
                <div>
                  {hour === 12 ? '12:00' : hour > 12 ? `${hour}:00` : `${hour}:00`}
                </div>
              </div>
              <div 
                className="flex-1 ml-4 cursor-pointer hover:bg-gray-700 transition-colors p-3 rounded h-full flex items-center relative"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setHours(hour, 0, 0, 0);
                  onDayClick(newDate);
                }}
              >
                {/* Hour indicator on hover */}
                <div className="absolute top-2 left-2 text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {hour}:00
                </div>
                
                {/* Events */}
                {hourEvents.map((event) => (
                  <div key={event.id} className="w-full">
                    {renderEventBlock(event)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 