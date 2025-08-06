import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { SpeechToTextButton } from '../SpeechToTextButton';
import { format, addMinutes, parseISO } from 'date-fns';
import CustomDatePicker from '../CustomDatePicker';
import Select from 'react-select';
// Reusable Modal Header Component
const ModalHeader = ({ title, onClose }) => (_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
        border: '2px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
        filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
        transform: 'translateZ(5px)'
    }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                transform: 'translateZ(3px)'
            }, children: title }), onClose && (_jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" }))] }));
const TimePicker = ({ value, onChange }) => {
    const handleTimeChange = (e) => {
        console.log('🕐 TimePicker onChange:', e.target.value);
        onChange(e.target.value);
    };
    console.log('🕐 TimePicker value:', value);
    return (_jsx("input", { type: "time", value: value || '', onChange: handleTimeChange, className: "w-full px-4 py-3 bg-black border-2 border-white rounded-xl text-white focus:outline-none focus:border-white transition-all" }));
};
export const EventForm = ({ formData, setFormData, editingFormData, setEditingFormData, selectedEvent, isEditing, onSave, onCancel, onDelete, showDeleteConfirm, onDeleteConfirm, onDeleteCancel, sttHandlers }) => {
    const currentData = isEditing ? editingFormData : formData;
    const setCurrentData = isEditing ? setEditingFormData : setFormData;
    // Options for form fields
    const durationOptions = [
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 45, label: '45 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' },
        { value: 180, label: '3 hours' },
        { value: 240, label: '4 hours' },
        { value: 300, label: '5 hours' },
        { value: 360, label: '6 hours' },
        { value: 480, label: '8 hours' },
        { value: 720, label: '12 hours' },
        { value: 1440, label: '1 day' }
    ];
    const reminderOptions = [
        { value: 0, label: 'No reminder' },
        { value: 5, label: '5 minutes before' },
        { value: 10, label: '10 minutes before' },
        { value: 15, label: '15 minutes before' },
        { value: 30, label: '30 minutes before' },
        { value: 60, label: '1 hour before' },
        { value: 120, label: '2 hours before' },
        { value: 1440, label: '1 day before' },
        { value: 2880, label: '2 days before' },
        { value: 10080, label: '1 week before' }
    ];
    const eventTypeOptions = [
        { value: 'meeting', label: 'Meeting' },
        { value: 'reminder', label: 'Reminder' },
        { value: 'task', label: 'Task' },
        { value: 'personal', label: 'Personal' },
        { value: 'work', label: 'Work' },
        { value: 'health', label: 'Health' },
        { value: 'social', label: 'Social' },
        { value: 'conference-call', label: 'Conference Call' },
        { value: 'appointment', label: 'Appointment' }
    ];
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        return { value: time, label: time };
    });
    return (_jsx("div", { className: "fixed inset-0 z-[1050] flex items-center justify-center bg-black bg-opacity-70", children: _jsxs("div", { className: "relative rounded-2xl bg-black px-4 pb-6 w-full max-w-[85vw] max-h-[90vh] flex flex-col", style: { boxSizing: 'border-box', minHeight: '80vh', minWidth: '85vw', border: '2px solid white' }, children: [_jsx(ModalHeader, { title: selectedEvent ? 'Edit Event' : 'Schedule New Event', onClose: onCancel }), _jsx("div", { className: "overflow-y-auto flex-1 px-2 pt-0 pb-4", children: _jsxs("form", { onSubmit: (e) => { e.preventDefault(); onSave(); }, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Title *" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: currentData.title, onChange: (e) => setCurrentData({ ...currentData, title: e.target.value }), className: "w-full px-4 py-3 bg-black border-2 border-white rounded-xl text-white focus:outline-none focus:border-white transition-all", placeholder: "Enter event title", required: true }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: isEditing ? sttHandlers.handleTitleSTTResult : sttHandlers.handleTitleSTTResult, onStart: isEditing ? sttHandlers.handleTitleSTTStart : sttHandlers.handleTitleSTTStart, isListening: sttHandlers.isListening === 'title' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Description" }), _jsxs("div", { className: "relative", children: [_jsx("textarea", { value: currentData.description, onChange: (e) => setCurrentData({ ...currentData, description: e.target.value }), className: "w-full px-4 py-3 bg-black border-2 border-white rounded-xl text-white focus:outline-none focus:border-white transition-all resize-none", placeholder: "Enter event description", rows: 3 }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-3", onResult: isEditing ? sttHandlers.handleEditDescriptionSTTResult : sttHandlers.handleDescriptionSTTResult, onStart: isEditing ? sttHandlers.handleEditDescriptionSTTStart : sttHandlers.handleDescriptionSTTStart, isListening: sttHandlers.isListening === (isEditing ? 'editDescription' : 'description') })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Date *" }), _jsxs("div", { className: "relative", children: [_jsx(CustomDatePicker, { selected: new Date(currentData.start), onChange: (date) => {
                                                            if (date) {
                                                                const newDate = new Date(date);
                                                                const currentTime = new Date(currentData.start);
                                                                newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                                                                setCurrentData({ ...currentData, start: newDate.toISOString() });
                                                            }
                                                        }, className: "w-full px-4 py-3 bg-black border-2 border-white rounded-xl text-white focus:outline-none focus:border-white transition-all" }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: sttHandlers.handleDateSTTResult, onStart: sttHandlers.handleDateSTTStart, isListening: sttHandlers.isListening === 'date' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Time *" }), _jsxs("div", { className: "relative", children: [_jsx(TimePicker, { value: format(new Date(currentData.start), 'HH:mm'), onChange: (time) => {
                                                            const [hours, minutes] = time.split(':').map(Number);
                                                            const newDate = new Date(currentData.start);
                                                            newDate.setHours(hours, minutes);
                                                            setCurrentData({ ...currentData, start: newDate.toISOString() });
                                                        } }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: sttHandlers.handleTimeSTTResult, onStart: sttHandlers.handleTimeSTTStart, isListening: sttHandlers.isListening === 'time' })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Duration" }), _jsxs("div", { className: "relative", children: [_jsx(Select, { value: durationOptions.find(option => option.value === currentData.duration), onChange: (option) => setCurrentData({ ...currentData, duration: option?.value || 60 }), options: durationOptions, className: "text-black", placeholder: "Select duration" }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: sttHandlers.handleDurationSTTResult, onStart: sttHandlers.handleDurationSTTStart, isListening: sttHandlers.isListening === 'duration' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "All Day" }), _jsxs("div", { className: "relative", children: [_jsxs("label", { className: "flex items-center space-x-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: currentData.allDay, onChange: (e) => setCurrentData({ ...currentData, allDay: e.target.checked }), className: "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-white", children: "All day event" })] }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: sttHandlers.handleAllDaySTTResult, onStart: sttHandlers.handleAllDaySTTStart, isListening: sttHandlers.isListening === 'allDay' })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Event Type" }), _jsxs("div", { className: "relative", children: [_jsx(Select, { value: eventTypeOptions.find(option => option.value === currentData.event_type), onChange: (option) => setCurrentData({ ...currentData, event_type: option?.value || 'meeting' }), options: eventTypeOptions, className: "text-black", placeholder: "Select event type" }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: sttHandlers.handleEventTypeSTTResult, onStart: sttHandlers.handleEventTypeSTTStart, isListening: sttHandlers.isListening === 'eventType' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Reminder" }), _jsxs("div", { className: "relative", children: [_jsx(Select, { value: reminderOptions.find(option => option.value === currentData.reminder_minutes), onChange: (option) => setCurrentData({ ...currentData, reminder_minutes: option?.value || 0 }), options: reminderOptions, className: "text-black", placeholder: "Select reminder" }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: sttHandlers.handleReminderSTTResult, onStart: sttHandlers.handleReminderSTTStart, isListening: sttHandlers.isListening === 'reminder' })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Location" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: currentData.location, onChange: (e) => setCurrentData({ ...currentData, location: e.target.value }), className: "w-full px-4 py-3 bg-black border-2 border-white rounded-xl text-white focus:outline-none focus:border-white transition-all", placeholder: "Enter location" }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: isEditing ? sttHandlers.handleEditLocationSTTResult : sttHandlers.handleLocationSTTResult, onStart: isEditing ? sttHandlers.handleEditLocationSTTStart : sttHandlers.handleLocationSTTStart, isListening: sttHandlers.isListening === (isEditing ? 'editLocation' : 'location') })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-white font-semibold text-sm", children: "Attendees" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: Array.isArray(currentData.attendees) ? currentData.attendees.join(', ') : currentData.attendees, onChange: (e) => setCurrentData({ ...currentData, attendees: e.target.value }), className: "w-full px-4 py-3 bg-black border-2 border-white rounded-xl text-white focus:outline-none focus:border-white transition-all", placeholder: "Enter attendees (comma separated)" }), _jsx(SpeechToTextButton, { className: "absolute right-3 top-1/2 transform -translate-y-1/2", onResult: isEditing ? sttHandlers.handleEditAttendeesSTTResult : sttHandlers.handleAttendeesSTTResult, onStart: isEditing ? sttHandlers.handleEditAttendeesSTTStart : sttHandlers.handleAttendeesSTTStart, isListening: sttHandlers.isListening === (isEditing ? 'editAttendees' : 'attendees') })] })] }), _jsxs("div", { className: "flex justify-between items-center pt-4", children: [_jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { type: "submit", className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: isEditing ? 'Update Event' : 'Create Event' }), _jsx("button", { type: "button", onClick: onCancel, className: "px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors", children: "Cancel" })] }), isEditing && (_jsx("button", { type: "button", onClick: onDelete, className: "px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", children: "Delete Event" }))] })] }) }), showDeleteConfirm && (_jsx("div", { className: "fixed inset-0 z-[1060] flex items-center justify-center bg-black bg-opacity-80", children: _jsxs("div", { className: "bg-black border-2 border-white rounded-xl p-6 max-w-md mx-4", children: [_jsx("h3", { className: "text-white text-lg font-bold mb-4", children: "Confirm Delete" }), _jsx("p", { className: "text-white mb-6", children: "Are you sure you want to delete this event? This action cannot be undone." }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: onDeleteCancel, className: "px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors", children: "Cancel" }), _jsx("button", { onClick: onDeleteConfirm, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", children: "Delete" })] })] }) }))] }) }));
};
