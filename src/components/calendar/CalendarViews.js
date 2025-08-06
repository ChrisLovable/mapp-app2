import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { getCalendarDays, getMonthDays, getWeekDays, getDayHours, getEventTypeColor, getEventsForDate, getEventsByTypeForDate, getEventsForDateAndHour, formatEventTime, formatEventDate } from '../../utils/calendarUtils';
export const MonthView = ({ currentDate, events, onDayClick, onEventClick, renderEventBlock }) => {
    const days = getCalendarDays(currentDate);
    return (_jsxs("div", { className: "calendar-month-view", children: [_jsx("div", { className: "mb-4 text-center rounded-lg", style: {
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                    padding: '10px'
                }, children: _jsx("div", { className: "text-white font-bold", style: { fontSize: '18px' }, children: currentDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                    }) }) }), _jsx("div", { className: "grid grid-cols-7 gap-1 mb-2", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (_jsx("div", { className: "text-center text-white font-bold p-2", style: { fontSize: '14px' }, children: day }, day))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: days.map((day, index) => {
                    const dayEvents = getEventsForDate(events, day.date);
                    const eventsByType = getEventsByTypeForDate(events, day.date);
                    return (_jsxs("div", { className: `min-h-[120px] p-2 border border-gray-700 cursor-pointer transition-colors ${day.isToday ? 'bg-blue-600' : day.isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900'} hover:bg-gray-700`, onClick: () => onDayClick(day.date), children: [_jsx("div", { className: `text-sm font-bold mb-1 ${day.isToday ? 'text-white' : day.isCurrentMonth ? 'text-white' : 'text-gray-500'}`, children: day.dayNumber }), _jsxs("div", { className: "space-y-1", children: [Object.entries(eventsByType).slice(0, 3).map(([type, typeEvents]) => (_jsx("div", { className: "text-xs p-1 rounded cursor-pointer", style: {
                                            backgroundColor: getEventTypeColor(type),
                                            color: 'white'
                                        }, onClick: (e) => {
                                            e.stopPropagation();
                                            if (typeEvents.length > 0) {
                                                onEventClick(typeEvents[0]);
                                            }
                                        }, children: typeEvents.length > 1 ? `${typeEvents.length} ${type}` : typeEvents[0]?.title || type }, type))), dayEvents.length > 3 && (_jsxs("div", { className: "text-xs text-gray-400", children: ["+", dayEvents.length - 3, " more"] }))] })] }, index));
                }) })] }));
};
export const WeekView = ({ currentDate, events, onDayClick, onEventClick, renderEventBlock }) => {
    const weekDays = getWeekDays(currentDate);
    const hours = getDayHours();
    return (_jsxs("div", { className: "calendar-week-view", children: [_jsx("div", { className: "mb-4 text-center rounded-lg", style: {
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                    padding: '10px'
                }, children: _jsx("div", { className: "text-white font-bold", style: { fontSize: '16px' }, children: formatEventDate(currentDate) }) }), _jsxs("div", { className: "grid grid-cols-8 gap-1", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "h-12" }), " ", hours.map((hour) => (_jsx("div", { className: "h-20 text-white text-xs p-1 border-b border-gray-700", children: hour === 12 ? '12:00' : hour > 12 ? `${hour}:00` : `${hour}:00` }, hour)))] }), weekDays.map((day) => {
                        const dayEvents = getEventsForDate(events, day.date);
                        return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "h-12 p-2 text-center cursor-pointer hover:bg-gray-700 transition-colors", style: {
                                        background: day.isToday ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'rgba(0, 0, 0, 0.8)',
                                        border: '1px solid #666'
                                    }, onClick: () => onDayClick(day.date), children: [_jsx("div", { className: "text-white font-bold text-sm", children: day.date.toLocaleDateString('en-US', { weekday: 'short' }) }), _jsx("div", { className: "text-white text-xs", children: day.date.getDate() })] }), hours.map((hour) => {
                                    const hourEvents = getEventsForDateAndHour(events, day.date, hour);
                                    return (_jsx("div", { className: "h-20 border-b border-gray-700 relative hover:bg-gray-800 transition-colors cursor-pointer", style: { border: '1px solid #666' }, onClick: () => {
                                            const newDate = new Date(day.date);
                                            newDate.setHours(hour, 0, 0, 0);
                                            onDayClick(newDate);
                                        }, children: hourEvents.map((event) => (_jsx("div", { className: "absolute left-1 right-1 z-10 rounded-md overflow-hidden shadow-lg", style: {
                                                top: '2px',
                                                height: 'calc(100% - 4px)',
                                                minHeight: '20px',
                                                maxHeight: 'calc(100% - 4px)'
                                            }, children: renderEventBlock(event, true) }, event.id))) }, hour));
                                })] }, day.date.toISOString()));
                    })] })] }));
};
export const DayView = ({ currentDate, events, onDayClick, onEventClick, renderEventBlock }) => {
    const hours = getDayHours();
    return (_jsxs("div", { className: "calendar-day-view", style: { border: '2px solid white', borderRadius: '8px', padding: '10px' }, children: [_jsx("div", { className: "mb-2 text-center rounded-lg", style: {
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                    padding: '5px'
                }, children: _jsx("div", { className: "text-white font-bold", style: { fontSize: '15px' }, children: currentDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) }) }), _jsx("div", { className: "day-timeline rounded-lg overflow-hidden", children: hours.map((hour) => {
                    const hourEvents = getEventsForDateAndHour(events, currentDate, hour);
                    return (_jsxs("div", { className: "timeline-hour p-3 border-b border-gray-700 flex items-center h-20 hover:bg-gray-800 transition-colors group", style: { border: '1px solid #666' }, children: [_jsx("div", { className: "text-white text-sm font-bold text-center flex items-center justify-center", style: { width: '50px', marginLeft: '-10px' }, children: _jsx("div", { children: hour === 12 ? '12:00' : hour > 12 ? `${hour}:00` : `${hour}:00` }) }), _jsxs("div", { className: "flex-1 ml-4 cursor-pointer hover:bg-gray-700 transition-colors p-3 rounded h-full flex items-center relative", onClick: () => {
                                    const newDate = new Date(currentDate);
                                    newDate.setHours(hour, 0, 0, 0);
                                    onDayClick(newDate);
                                }, children: [_jsxs("div", { className: "absolute top-2 left-2 text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity", children: [hour, ":00"] }), hourEvents.map((event) => (_jsx("div", { className: "w-full", children: renderEventBlock(event) }, event.id)))] })] }, hour));
                }) })] }));
};
