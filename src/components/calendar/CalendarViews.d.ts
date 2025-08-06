import React from 'react';
import type { CalendarEvent } from '../../types/calendar';
interface CalendarViewsProps {
    currentView: 'month' | 'week' | 'day';
    currentDate: Date;
    events: CalendarEvent[];
    onDayClick: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    renderEventBlock: (event: CalendarEvent, isWeekView?: boolean) => React.ReactNode;
}
export declare const MonthView: React.FC<CalendarViewsProps>;
export declare const WeekView: React.FC<CalendarViewsProps>;
export declare const DayView: React.FC<CalendarViewsProps>;
export {};
