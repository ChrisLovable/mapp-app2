import { useState } from 'react';
import type { FormData, EditingFormData } from '../types/calendar';

interface UseCalendarSTTProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  editingFormData: EditingFormData;
  setEditingFormData: (data: EditingFormData) => void;
  setCurrentDate: (date: Date) => void;
  setShowEventForm: (show: boolean) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useCalendarSTT = ({
  formData,
  setFormData,
  editingFormData,
  setEditingFormData,
  setCurrentDate,
  setShowEventForm,
  showNotification
}: UseCalendarSTTProps) => {
  const [isListening, setIsListening] = useState<string | null>(null);

  // STT Result Handlers
  const handleTitleSTTResult = (text: string) => {
    console.log('🎤 Title STT Result:', text);
    setFormData({ ...formData, title: text });
    showNotification('Title updated via voice!', 'success');
  };

  const handleAttendeesSTTResult = (text: string) => {
    console.log('🎤 Attendees STT Result:', text);
    setFormData({ ...formData, attendees: text });
    showNotification('Attendees updated via voice!', 'success');
  };

  const handleDescriptionSTTResult = (text: string) => {
    console.log('🎤 Description STT Result:', text);
    setFormData({ ...formData, description: text });
    showNotification('Description updated via voice!', 'success');
  };

  const handleLocationSTTResult = (text: string) => {
    console.log('🎤 Location STT Result:', text);
    setFormData({ ...formData, location: text });
    showNotification('Location updated via voice!', 'success');
  };

  // Edit modal STT results
  const handleEditDescriptionSTTResult = (text: string) => {
    console.log('🎤 Edit Description STT Result:', text);
    setEditingFormData({ ...editingFormData, description: text });
    showNotification('Description updated via voice!', 'success');
  };

  const handleEditLocationSTTResult = (text: string) => {
    console.log('🎤 Edit Location STT Result:', text);
    setEditingFormData({ ...editingFormData, location: text });
    showNotification('Location updated via voice!', 'success');
  };

  const handleEditAttendeesSTTResult = (text: string) => {
    console.log('🎤 Edit Attendees STT Result:', text);
    setEditingFormData({ ...editingFormData, attendees: text });
    showNotification('Attendees updated via voice!', 'success');
  };

  // STT Start Handlers
  const handleTitleSTTStart = () => {
    setIsListening('title');
    showNotification('Listening for title...', 'info');
  };

  const handleAttendeesSTTStart = () => {
    setIsListening('attendees');
    showNotification('Listening for attendees...', 'info');
  };

  const handleDescriptionSTTStart = () => {
    setIsListening('description');
    showNotification('Listening for description...', 'info');
  };

  const handleLocationSTTStart = () => {
    setIsListening('location');
    showNotification('Listening for location...', 'info');
  };

  const handleEditDescriptionSTTStart = () => {
    setIsListening('editDescription');
    showNotification('Listening for description...', 'info');
  };

  const handleEditLocationSTTStart = () => {
    setIsListening('editLocation');
    showNotification('Listening for location...', 'info');
  };

  const handleEditAttendeesSTTStart = () => {
    setIsListening('editAttendees');
    showNotification('Listening for attendees...', 'info');
  };

  // Date and Time STT Handlers
  const handleDateSTTStart = () => {
    setIsListening('date');
    showNotification('Listening for date...', 'info');
  };

  const handleTimeSTTStart = () => {
    setIsListening('time');
    showNotification('Listening for time...', 'info');
  };

  const handleDurationSTTStart = () => {
    setIsListening('duration');
    showNotification('Listening for duration...', 'info');
  };

  const handleReminderSTTStart = () => {
    setIsListening('reminder');
    showNotification('Listening for reminder...', 'info');
  };

  const handleEventTypeSTTStart = () => {
    setIsListening('eventType');
    showNotification('Listening for event type...', 'info');
  };

  const handleAllDaySTTStart = () => {
    setIsListening('allDay');
    showNotification('Listening for all day...', 'info');
  };

  // Complex STT Result Handlers
  const handleDateSTTResult = (text: string) => {
    console.log('🎤 Date STT Result:', text);
    
    const parseSpecificDate = (text: string) => {
      const lowerText = text.toLowerCase();
      
      // Today
      if (lowerText.includes('today')) {
        const today = new Date();
        setCurrentDate(today);
        setFormData({ ...formData, start: today.toISOString() });
        showNotification('Date set to today!', 'success');
        return;
      }
      
      // Tomorrow
      if (lowerText.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setCurrentDate(tomorrow);
        setFormData({ ...formData, start: tomorrow.toISOString() });
        showNotification('Date set to tomorrow!', 'success');
        return;
      }
      
      // Next week
      if (lowerText.includes('next week')) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setCurrentDate(nextWeek);
        setFormData({ ...formData, start: nextWeek.toISOString() });
        showNotification('Date set to next week!', 'success');
        return;
      }
      
      // Specific day of week
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < days.length; i++) {
        if (lowerText.includes(days[i])) {
          const getNextDayOfWeek = (dayName: string) => {
            const today = new Date();
            const currentDay = today.getDay();
            const targetDay = days.indexOf(dayName);
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd <= 0) daysToAdd += 7;
            const nextDay = new Date(today);
            nextDay.setDate(today.getDate() + daysToAdd);
            return nextDay;
          };
          
          const nextDay = getNextDayOfWeek(days[i]);
          setCurrentDate(nextDay);
          setFormData({ ...formData, start: nextDay.toISOString() });
          showNotification(`Date set to next ${days[i]}!`, 'success');
          return;
        }
      }
      
      // This week day
      for (let i = 0; i < days.length; i++) {
        if (lowerText.includes(`this ${days[i]}`)) {
          const getThisWeekDay = (dayName: string) => {
            const today = new Date();
            const currentDay = today.getDay();
            const targetDay = days.indexOf(dayName);
            let daysToAdd = targetDay - currentDay;
            if (daysToAdd < 0) daysToAdd += 7;
            const thisWeekDay = new Date(today);
            thisWeekDay.setDate(today.getDate() + daysToAdd);
            return thisWeekDay;
          };
          
          const thisWeekDay = getThisWeekDay(days[i]);
          setCurrentDate(thisWeekDay);
          setFormData({ ...formData, start: thisWeekDay.toISOString() });
          showNotification(`Date set to this ${days[i]}!`, 'success');
          return;
        }
      }
      
      // Specific date patterns
      const datePatterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})/, // MM/DD (current year)
      ];
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          let year, month, day;
          
          if (match.length === 4) {
            if (pattern.source.includes('YYYY')) {
              [, month, day, year] = match;
            } else {
              [, year, month, day] = match;
            }
          } else {
            // MM/DD format - use current year
            [, month, day] = match;
            year = new Date().getFullYear();
          }
          
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            setCurrentDate(date);
            setFormData({ ...formData, start: date.toISOString() });
            showNotification(`Date set to ${date.toLocaleDateString()}!`, 'success');
            return;
          }
        }
      }
      
      showNotification('Could not parse date. Please try again.', 'error');
    };
    
    parseSpecificDate(text);
  };

  const handleTimeSTTResult = (text: string) => {
    console.log('🎤 Time STT Result:', text);
    
    const parseTime = (text: string) => {
      const lowerText = text.toLowerCase();
      
      // 12-hour format patterns
      const timePatterns = [
        /(\d{1,2}):(\d{2})\s*(am|pm)/i, // 3:30 PM
        /(\d{1,2})\s*(am|pm)/i, // 3 PM
        /(\d{1,2}):(\d{2})/, // 15:30 (24-hour)
        /(\d{1,2})/, // 15 (hour only)
      ];
      
      for (const pattern of timePatterns) {
        const match = lowerText.match(pattern);
        if (match) {
          let hour = parseInt(match[1]);
          let minute = match[2] ? parseInt(match[2]) : 0;
          
          // Handle AM/PM
          if (match[3]) {
            const isPM = match[3].toLowerCase() === 'pm';
            if (isPM && hour !== 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
          }
          
          // Validate time
          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            setFormData({ ...formData, start: timeString });
            showNotification(`Time set to ${timeString}!`, 'success');
            return;
          }
        }
      }
      
      showNotification('Could not parse time. Please try again.', 'error');
    };
    
    parseTime(text);
  };

  const handleDurationSTTResult = (text: string) => {
    console.log('🎤 Duration STT Result:', text);
    
    const parseDuration = (text: string) => {
      const lowerText = text.toLowerCase();
      
      // Extract numbers
      const numbers = lowerText.match(/\d+/g);
      if (!numbers) {
        showNotification('Could not parse duration. Please try again.', 'error');
        return;
      }
      
      const duration = parseInt(numbers[0]);
      
      if (lowerText.includes('hour') || lowerText.includes('hr')) {
        setFormData({ ...formData, duration: duration * 60 });
        showNotification(`Duration set to ${duration} hour(s)!`, 'success');
      } else if (lowerText.includes('minute') || lowerText.includes('min')) {
        setFormData({ ...formData, duration: duration });
        showNotification(`Duration set to ${duration} minute(s)!`, 'success');
      } else {
        // Default to minutes
        setFormData({ ...formData, duration: duration });
        showNotification(`Duration set to ${duration} minute(s)!`, 'success');
      }
    };
    
    parseDuration(text);
  };

  const handleReminderSTTResult = (text: string) => {
    console.log('🎤 Reminder STT Result:', text);
    
    const parseReminder = (text: string) => {
      const lowerText = text.toLowerCase();
      
      // Extract numbers
      const numbers = lowerText.match(/\d+/g);
      if (!numbers) {
        showNotification('Could not parse reminder. Please try again.', 'error');
        return;
      }
      
      const reminder = parseInt(numbers[0]);
      
      if (lowerText.includes('hour') || lowerText.includes('hr')) {
        setFormData({ ...formData, reminder_minutes: reminder * 60 });
        showNotification(`Reminder set to ${reminder} hour(s)!`, 'success');
      } else if (lowerText.includes('minute') || lowerText.includes('min')) {
        setFormData({ ...formData, reminder_minutes: reminder });
        showNotification(`Reminder set to ${reminder} minute(s)!`, 'success');
      } else {
        // Default to minutes
        setFormData({ ...formData, reminder_minutes: reminder });
        showNotification(`Reminder set to ${reminder} minute(s)!`, 'success');
      }
    };
    
    parseReminder(text);
  };

  const handleEventTypeSTTResult = (text: string) => {
    console.log('🎤 Event Type STT Result:', text);
    
    const lowerText = text.toLowerCase();
    const eventTypes = [
      'meeting', 'reminder', 'task', 'personal', 'work', 
      'health', 'social', 'conference-call', 'appointment'
    ];
    
    for (const eventType of eventTypes) {
      if (lowerText.includes(eventType)) {
        setFormData({ ...formData, event_type: eventType });
        showNotification(`Event type set to ${eventType}!`, 'success');
        return;
      }
    }
    
    showNotification('Could not parse event type. Please try again.', 'error');
  };

  const handleAllDaySTTResult = (text: string) => {
    console.log('🎤 All Day STT Result:', text);
    
    const lowerText = text.toLowerCase();
    const isAllDay = lowerText.includes('all day') || lowerText.includes('all-day') || 
                     lowerText.includes('yes') || lowerText.includes('true') ||
                     lowerText.includes('full day') || lowerText.includes('entire day');
    
    setFormData({ ...formData, allDay: isAllDay });
    showNotification(`All day set to ${isAllDay}!`, 'success');
  };

  return {
    isListening,
    setIsListening,
    handleTitleSTTResult,
    handleAttendeesSTTResult,
    handleDescriptionSTTResult,
    handleLocationSTTResult,
    handleEditDescriptionSTTResult,
    handleEditLocationSTTResult,
    handleEditAttendeesSTTResult,
    handleTitleSTTStart,
    handleAttendeesSTTStart,
    handleDescriptionSTTStart,
    handleLocationSTTStart,
    handleEditDescriptionSTTStart,
    handleEditLocationSTTStart,
    handleEditAttendeesSTTStart,
    handleDateSTTStart,
    handleTimeSTTStart,
    handleDurationSTTStart,
    handleReminderSTTStart,
    handleEventTypeSTTStart,
    handleAllDaySTTStart,
    handleDateSTTResult,
    handleTimeSTTResult,
    handleDurationSTTResult,
    handleReminderSTTResult,
    handleEventTypeSTTResult,
    handleAllDaySTTResult
  };
}; 