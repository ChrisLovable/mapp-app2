import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
export const getCalendarDays = (currentDate) => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    // Get the first day of the month and the last day
    const firstDay = start.getDay();
    const lastDay = end.getDate();
    // Calculate the start date for the calendar grid (previous month's days)
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - firstDay);
    // Calculate the end date for the calendar grid (next month's days)
    const endDate = new Date(end);
    const remainingDays = 42 - (firstDay + lastDay); // 6 rows * 7 days = 42
    endDate.setDate(endDate.getDate() + remainingDays);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.map(date => ({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: isToday(date)
    }));
};
export const getMonthDays = (currentDate) => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    return days.map(date => ({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: true,
        isToday: isToday(date)
    }));
};
export const getWeekDays = (currentDate) => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        days.push({
            date,
            dayNumber: date.getDate(),
            isCurrentMonth: true,
            isToday: isToday(date)
        });
    }
    return days;
};
export const getDayHours = () => {
    return Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM
};
export const getEventTypeColor = (eventType) => {
    switch (eventType.toLowerCase()) {
        case 'meeting':
            return '#3B82F6'; // Blue
        case 'reminder':
            return '#F59E0B'; // Yellow
        case 'task':
            return '#8B5CF6'; // Purple
        case 'personal':
            return '#10B981'; // Green
        case 'work':
            return '#EF4444'; // Red
        case 'health':
            return '#06B6D4'; // Cyan
        case 'social':
            return '#EC4899'; // Pink
        case 'conference-call':
            return '#8B5CF6'; // Purple
        case 'appointment':
            return '#10B981'; // Green
        default:
            return '#6B7280'; // Gray
    }
};
export const getEventsForDate = (events, date) => {
    return events.filter(event => {
        const eventDate = new Date(event.start);
        return isSameDay(eventDate, date);
    });
};
export const getEventsByTypeForDate = (events, date) => {
    const eventsForDate = getEventsForDate(events, date);
    const eventsByType = {};
    eventsForDate.forEach(event => {
        if (!eventsByType[event.event_type]) {
            eventsByType[event.event_type] = [];
        }
        eventsByType[event.event_type].push(event);
    });
    return eventsByType;
};
export const getEventsForDateAndHour = (events, date, hour) => {
    return events.filter(event => {
        const eventDate = new Date(event.start);
        const eventHour = eventDate.getHours();
        return isSameDay(eventDate, date) && eventHour === hour;
    });
};
export const formatEventTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
export const formatEventDate = (date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
export const calculateEventDuration = (start, end) => {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
};
