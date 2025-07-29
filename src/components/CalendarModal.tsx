import React, { useState, useEffect, useRef } from 'react';
import { SpeechToTextButton } from './SpeechToTextButton';
import { format, addMinutes, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import CustomDatePicker from './CustomDatePicker';
import Select from 'react-select';
import type { SingleValue } from 'react-select';



// Custom Time Picker Component
interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🕐 TimePicker onChange:', e.target.value);
    onChange(e.target.value);
  };

  console.log('🕐 TimePicker value:', value);

  return (
    <input
      type="time"
      value={value || ''}
      onChange={handleTimeChange}
      className="w-full px-4 py-3 bg-black border-2 border-[var(--favourite-blue)] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
    />
  );
};

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  event_type: string;
  location?: string;
  attendees?: string[];
  reminder_minutes: number;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputText?: string;
}

// Add type definition for duration options
type DurationOption = { value: number; label: string };

// Add type definition for reminder options
type ReminderOption = { value: number; label: string };

// Add type definition for event type options
type EventTypeOption = { value: string; label: string };

// Add type definition for time options
type TimeOption = { value: string; label: string };

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, inputText }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSavedEventsModal, setShowSavedEventsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [currentView, setCurrentView] = useState('month');

  // Function to parse input text using OpenAI
  const parseInputText = async (text: string) => {
    if (!text || !text.trim()) return null;

    try {
      console.log('🤖 Sending text to OpenAI for parsing:', text);
      
      const response = await fetch('/api/parse-calendar-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ OpenAI parsed data:', data);
      console.log('🕐 Parsed time value:', data.time);

      // Convert OpenAI response to our form data format
      const parsedData = {
        title: data.title || '',
        description: data.description || '',
        start: data.date && data.time ? 
          `${data.date}T${data.time}` : 
          new Date().toISOString().slice(0, 16),
        allDay: data.allDay || false,
        event_type: data.eventType || 'meeting',
        location: data.location || '',
        attendees: data.attendees || '',
        reminder_minutes: 15,
        duration: data.duration || 60
      };

      console.log('🕐 Final parsedData.start:', parsedData.start);
      console.log('🕐 Final parsedData.start.split("T")[1]:', parsedData.start.split('T')[1]);

      return parsedData;
    } catch (error) {
      console.error('❌ Error parsing text with OpenAI:', error);
      return null;
    }
  };

  // Parse input text and populate form when modal opens with text
  useEffect(() => {
    const parseAndPopulate = async () => {
      if (isOpen && inputText && inputText.trim() && !selectedEvent) {
        console.log('🔍 Parsing input text for calendar event:', inputText);
        const parsedData = await parseInputText(inputText);
        if (parsedData) {
          console.log('✅ Parsed calendar data:', parsedData);
          setFormData(parsedData);
          setShowEventForm(true); // Automatically show the form when text is parsed
          console.log('🎯 Form should now be visible with parsed data');
        } else {
          console.log('❌ No calendar data could be parsed from text');
        }
      }
    };

    parseAndPopulate();
  }, [isOpen, inputText, selectedEvent]);

  // Populate form when editing an existing event
  useEffect(() => {
    if (selectedEvent) {
      setFormData({
        title: selectedEvent.title,
        description: selectedEvent.description || '',
        start: selectedEvent.start,
        allDay: selectedEvent.allDay,
        event_type: selectedEvent.event_type,
        location: selectedEvent.location || '',
        attendees: selectedEvent.attendees ? selectedEvent.attendees.join(', ') : '',
        reminder_minutes: selectedEvent.reminder_minutes,
        duration: 60 // Default duration, could be calculated from start/end times
      });
    }
  }, [selectedEvent]);

  // Handle title speech-to-text result
  const handleTitleSTTResult = (text: string) => {
    setFormData(prev => ({ ...prev, title: text }));
  };

  // Handle attendees speech-to-text result
  const handleAttendeesSTTResult = (text: string) => {
    setFormData(prev => ({ ...prev, attendees: text }));
  };

  // Handle description speech-to-text result
  const handleDescriptionSTTResult = (text: string) => {
    setFormData(prev => ({ ...prev, description: text }));
  };

  // Handle location speech-to-text result
  const handleLocationSTTResult = (text: string) => {
    setFormData(prev => ({ ...prev, location: text }));
  };

  // Handle edit modal STT results
  const handleEditDescriptionSTTResult = (text: string) => {
    if (selectedEvent) {
      setSelectedEvent({...selectedEvent, description: text});
    }
  };

  const handleEditLocationSTTResult = (text: string) => {
    if (selectedEvent) {
      setSelectedEvent({...selectedEvent, location: text});
    }
  };

  const handleEditAttendeesSTTResult = (text: string) => {
    if (selectedEvent) {
      setSelectedEvent({...selectedEvent, attendees: text.split(',').map(s => s.trim()).filter(s => s)});
    }
  };

  // STT handlers that clear fields first before processing speech
  const handleTitleSTTStart = () => {
    setFormData(prev => ({ ...prev, title: '' }));
  };

  const handleAttendeesSTTStart = () => {
    setFormData(prev => ({ ...prev, attendees: '' }));
  };

  const handleDescriptionSTTStart = () => {
    setFormData(prev => ({ ...prev, description: '' }));
  };

  const handleLocationSTTStart = () => {
    setFormData(prev => ({ ...prev, location: '' }));
  };

  const handleEditDescriptionSTTStart = () => {
    if (selectedEvent) {
      setSelectedEvent({...selectedEvent, description: ''});
    }
  };

  const handleEditLocationSTTStart = () => {
    if (selectedEvent) {
      setSelectedEvent({...selectedEvent, location: ''});
    }
  };

  const handleEditAttendeesSTTStart = () => {
    if (selectedEvent) {
      setSelectedEvent({...selectedEvent, attendees: []});
    }
  };

  // Additional onStart handlers for other fields
  const handleDateSTTStart = () => {
    // Clear the date field by setting it to today
    const today = new Date();
    const currentStart = formData.start ? new Date(formData.start) : new Date();
    const newStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), currentStart.getHours(), currentStart.getMinutes());
    
    setFormData(prev => ({ 
      ...prev, 
      start: newStart.toISOString().slice(0, 16)
    }));
  };

  const handleTimeSTTStart = () => {
    // Clear the time field by setting it to current time
    const currentDate = formData.start ? formData.start.split('T')[0] : new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    const newStart = `${currentDate}T${currentTime}`;
    
    setFormData(prev => ({ 
      ...prev, 
      start: newStart
    }));
  };

  const handleDurationSTTStart = () => {
    // Clear the duration field by setting it to default (60 minutes)
    setFormData(prev => ({ ...prev, duration: 60 }));
  };

  const handleReminderSTTStart = () => {
    // Clear the reminder field by setting it to default (15 minutes)
    setFormData(prev => ({ ...prev, reminder_minutes: 15 }));
  };

  const handleEventTypeSTTStart = () => {
    // Clear the event type field by setting it to default
            setFormData(prev => ({ ...prev, event_type: 'meeting' }));
  };

  const handleAllDaySTTStart = () => {
    // Clear the all day field by setting it to false
    setFormData(prev => ({ ...prev, allDay: false }));
  };

  const handleDateSTTResult = (text: string) => {
    console.log('Date STT result:', text);
    const textLower = text.toLowerCase();
    const today = new Date();
    let targetDate = new Date(today);

    // Helper function to parse specific date formats
    const parseSpecificDate = (text: string) => {
      // Match patterns like "January 15th", "Jan 15", "15th January", "1/15", "01/15"
      const patterns = [
        // "January 15th" or "Jan 15th"
        /(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?/i,
        // "15th January" or "15 January"
        /(\d{1,2})(?:st|nd|rd|th)?\s+(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|october|oct|november|nov|december|dec)/i,
        // "1/15" or "01/15" (MM/DD format)
        /(\d{1,2})\/(\d{1,2})/,
        // "15/1" or "15/01" (DD/MM format)
        /(\d{1,2})\/(\d{1,2})/,
        // "2024-01-15" or "2024/01/15"
        /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
        // "01-15" or "01/15" (current year assumed)
        /(\d{1,2})[-/](\d{1,2})/
      ];

      const monthNames: { [key: string]: number } = {
        'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
        'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
        'august': 7, 'aug': 7, 'september': 8, 'sept': 8, 'october': 9, 'oct': 9,
        'november': 10, 'nov': 10, 'december': 11, 'dec': 11
      };

      for (let i = 0; i < patterns.length; i++) {
        const match = text.match(patterns[i]);
        if (match) {
          let month, day, year = today.getFullYear();

          if (i === 0) {
            // "January 15th" format
            month = monthNames[match[1].toLowerCase()];
            day = parseInt(match[2]);
          } else if (i === 1) {
            // "15th January" format
            day = parseInt(match[1]);
            month = monthNames[match[2].toLowerCase()];
          } else if (i === 2) {
            // "1/15" format (MM/DD)
            month = parseInt(match[1]) - 1;
            day = parseInt(match[2]);
          } else if (i === 3) {
            // "15/1" format (DD/MM)
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
          } else if (i === 4) {
            // "2024-01-15" format
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            day = parseInt(match[3]);
          } else if (i === 5) {
            // "01-15" format (current year)
            month = parseInt(match[1]) - 1;
            day = parseInt(match[2]);
          }

          if (month !== undefined && day !== undefined) {
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
      }
      return null;
    };

    // Helper function to get next occurrence of a day of week
    const getNextDayOfWeek = (dayName: string) => {
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());
      if (targetDay === -1) return null;

      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week
      
      const result = new Date(today);
      result.setDate(today.getDate() + daysToAdd);
      return result;
    };

    // Helper function to get this week's occurrence of a day
    const getThisWeekDay = (dayName: string) => {
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());
      if (targetDay === -1) return null;

      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0) daysToAdd += 7; // This week
      
      const result = new Date(today);
      result.setDate(today.getDate() + daysToAdd);
      return result;
    };

    // Try to parse specific date first
    const specificDate = parseSpecificDate(textLower);
    if (specificDate) {
      targetDate = specificDate;
    } else {
      // Parse relative dates
      if (textLower.includes('today')) {
        targetDate = new Date(today);
      } else if (textLower.includes('tomorrow')) {
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + 1);
      } else if (textLower.includes('yesterday')) {
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() - 1);
      } else if (textLower.includes('next week')) {
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + 7);
      } else if (textLower.includes('last week') || textLower.includes('previous week')) {
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() - 7);
      } else if (textLower.includes('this weekend')) {
        const saturday = getNextDayOfWeek('saturday');
        if (saturday) targetDate = saturday;
      } else if (textLower.includes('next month')) {
        targetDate = new Date(today);
        targetDate.setMonth(today.getMonth() + 1);
      } else if (textLower.includes('last month') || textLower.includes('previous month')) {
        targetDate = new Date(today);
        targetDate.setMonth(today.getMonth() - 1);
      } else if (textLower.includes('next year')) {
        targetDate = new Date(today);
        targetDate.setFullYear(today.getFullYear() + 1);
      } else if (textLower.includes('last year') || textLower.includes('previous year')) {
        targetDate = new Date(today);
        targetDate.setFullYear(today.getFullYear() - 1);
      } else {
        // Handle "next [day]" patterns
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (const day of daysOfWeek) {
          if (textLower.includes(`next ${day}`)) {
            const nextDay = getNextDayOfWeek(day);
            if (nextDay) targetDate = nextDay;
            break;
          }
        }

        // Handle "this [day]" patterns
        if (targetDate.getTime() === today.getTime()) {
          for (const day of daysOfWeek) {
            if (textLower.includes(`this ${day}`)) {
              const thisWeekDay = getThisWeekDay(day);
              if (thisWeekDay) targetDate = thisWeekDay;
              break;
            }
          }
        }

        // Handle "in X days/weeks/months" patterns
        const daysMatch = textLower.match(/in (\d+) days?/);
        if (daysMatch) {
          const daysToAdd = parseInt(daysMatch[1]);
          targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysToAdd);
        } else {
          const weeksMatch = textLower.match(/in (\d+) weeks?/);
          if (weeksMatch) {
            const weeksToAdd = parseInt(weeksMatch[1]);
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() + (weeksToAdd * 7));
          } else {
            const monthsMatch = textLower.match(/in (\d+) months?/);
            if (monthsMatch) {
              const monthsToAdd = parseInt(monthsMatch[1]);
              targetDate = new Date(today);
              targetDate.setMonth(today.getMonth() + monthsToAdd);
            } else {
              const yearsMatch = textLower.match(/in (\d+) years?/);
              if (yearsMatch) {
                const yearsToAdd = parseInt(yearsMatch[1]);
                targetDate = new Date(today);
                targetDate.setFullYear(today.getFullYear() + yearsToAdd);
              }
            }
          }
        }

        // Handle "X days ago" patterns
        const daysAgoMatch = textLower.match(/(\d+) days? ago/);
        if (daysAgoMatch) {
          const daysToSubtract = parseInt(daysAgoMatch[1]);
          targetDate = new Date(today);
          targetDate.setDate(today.getDate() - daysToSubtract);
        } else {
          const weeksAgoMatch = textLower.match(/(\d+) weeks? ago/);
          if (weeksAgoMatch) {
            const weeksToSubtract = parseInt(weeksAgoMatch[1]);
            targetDate = new Date(today);
            targetDate.setDate(today.getDate() - (weeksToSubtract * 7));
          } else {
            const monthsAgoMatch = textLower.match(/(\d+) months? ago/);
            if (monthsAgoMatch) {
              const monthsToSubtract = parseInt(monthsAgoMatch[1]);
              targetDate = new Date(today);
              targetDate.setMonth(today.getMonth() - monthsToSubtract);
            }
          }
        }
      }
    }

    // Update formData with the new date
    const currentStart = formData.start ? new Date(formData.start) : new Date();
    const newStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), currentStart.getHours(), currentStart.getMinutes());
    
    setFormData(prev => ({ 
      ...prev, 
      start: newStart.toISOString().slice(0, 16)
    }));
  };

  const handleTimeSTTResult = (text: string) => {
    console.log('Time STT result:', text);
    const textLower = text.toLowerCase();
    let timeString = '';

    // Parse time expressions
    if (textLower.includes('morning')) {
      timeString = '09:00';
    } else if (textLower.includes('afternoon')) {
      timeString = '14:00';
    } else if (textLower.includes('evening')) {
      timeString = '18:00';
    } else if (textLower.includes('noon')) {
      timeString = '12:00';
    } else if (textLower.includes('midnight')) {
      timeString = '00:00';
    } else {
      // Try to parse specific times like "2:30", "14:30", "2 PM", etc.
      const timeMatch = textLower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3];

        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }

        timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }

    if (timeString) {
      const currentDate = formData.start ? formData.start.split('T')[0] : new Date().toISOString().split('T')[0];
      const newStart = `${currentDate}T${timeString}`;
      
      setFormData(prev => ({ 
        ...prev, 
        start: newStart
      }));
    }
  };

  const handleDurationSTTResult = (text: string) => {
    console.log('Duration STT result:', text);
    const textLower = text.toLowerCase();
    let durationMinutes = 60; // default

    // Parse duration expressions
    if (textLower.includes('15 minutes') || textLower.includes('quarter hour')) {
      durationMinutes = 15;
    } else if (textLower.includes('30 minutes') || textLower.includes('half hour')) {
      durationMinutes = 30;
    } else if (textLower.includes('1 hour') || textLower.includes('one hour')) {
      durationMinutes = 60;
    } else if (textLower.includes('1.5 hours') || textLower.includes('one and a half hours')) {
      durationMinutes = 90;
    } else if (textLower.includes('2 hours')) {
      durationMinutes = 120;
    } else if (textLower.includes('3 hours')) {
      durationMinutes = 180;
    } else if (textLower.includes('4 hours')) {
      durationMinutes = 240;
    } else if (textLower.includes('6 hours')) {
      durationMinutes = 360;
    } else if (textLower.includes('all day')) {
      durationMinutes = 1440;
    } else {
      // Try to parse specific durations like "45 minutes", "2 hours", etc.
      const durationMatch = textLower.match(/(\d+)\s*(minutes?|hours?|hrs?)/);
      if (durationMatch) {
        const amount = parseInt(durationMatch[1]);
        const unit = durationMatch[2];
        if (unit.startsWith('minute')) {
          durationMinutes = amount;
        } else if (unit.startsWith('hour')) {
          durationMinutes = amount * 60;
        }
      }
    }

    setFormData(prev => ({ ...prev, duration: durationMinutes }));
  };

  const handleReminderSTTResult = (text: string) => {
    console.log('Reminder STT result:', text);
    const textLower = text.toLowerCase();
    let reminderMinutes = 15; // default

    // Parse reminder expressions
    if (textLower.includes('5 minutes')) {
      reminderMinutes = 5;
    } else if (textLower.includes('10 minutes')) {
      reminderMinutes = 10;
    } else if (textLower.includes('15 minutes')) {
      reminderMinutes = 15;
    } else if (textLower.includes('30 minutes')) {
      reminderMinutes = 30;
    } else if (textLower.includes('1 hour')) {
      reminderMinutes = 60;
    } else if (textLower.includes('no reminder') || textLower.includes('no notification')) {
      reminderMinutes = 0;
    } else {
      // Try to parse specific reminders like "20 minutes", "2 hours", etc.
      const reminderMatch = textLower.match(/(\d+)\s*(minutes?|hours?|hrs?)/);
      if (reminderMatch) {
        const amount = parseInt(reminderMatch[1]);
        const unit = reminderMatch[2];
        if (unit.startsWith('minute')) {
          reminderMinutes = amount;
        } else if (unit.startsWith('hour')) {
          reminderMinutes = amount * 60;
        }
      }
    }

    setFormData(prev => ({ ...prev, reminder_minutes: reminderMinutes }));
  };

  const handleEventTypeSTTResult = (text: string) => {
    console.log('Event Type STT result:', text);
    const textLower = text.toLowerCase();
          let eventType = 'meeting'; // default

    // Parse event type expressions
    if (textLower.includes('meeting') || textLower.includes('in person')) {
              eventType = 'meeting';
    } else if (textLower.includes('call') || textLower.includes('conference') || textLower.includes('zoom') || textLower.includes('video')) {
      eventType = 'conference-call';
    } else if (textLower.includes('appointment') || textLower.includes('doctor') || textLower.includes('dentist')) {
      eventType = 'appointment';
    } else if (textLower.includes('reminder') || textLower.includes('task') || textLower.includes('todo')) {
      eventType = 'reminder';
    }

    setFormData(prev => ({ ...prev, event_type: eventType }));
  };

  const handleAllDaySTTResult = (text: string) => {
    console.log('All Day STT result:', text);
    const textLower = text.toLowerCase();
    
    // Parse all day expressions
    const isAllDay = textLower.includes('all day') || 
                    textLower.includes('all-day') || 
                    textLower.includes('full day') || 
                    textLower.includes('whole day') ||
                    textLower.includes('yes') ||
                    textLower.includes('true');

    setFormData(prev => ({ ...prev, allDay: isAllDay }));
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  
  // Duration options for the React Select
  const durationOptions: DurationOption[] = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' },
    { value: 360, label: '6 hours' },
    { value: 1440, label: 'All day' }
  ];

  // Reminder options for the React Select
  const reminderOptions: ReminderOption[] = [
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' }
  ];

  // Event type options for the React Select
  const eventTypeOptions: EventTypeOption[] = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'task', label: 'Task' },
    { value: 'personal', label: 'Personal' },
    { value: 'work', label: 'Work' },
    { value: 'health', label: 'Health' },
    { value: 'social', label: 'Social' }
  ];

  // Time options for the React Select (30-minute increments from 07:00 to 20:00)
  const timeOptions: TimeOption[] = [
    { value: '07:00', label: '7:00 AM' },
    { value: '07:30', label: '7:30 AM' },
    { value: '08:00', label: '8:00 AM' },
    { value: '08:30', label: '8:30 AM' },
    { value: '09:00', label: '9:00 AM' },
    { value: '09:30', label: '9:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '12:30', label: '12:30 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '13:30', label: '1:30 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '14:30', label: '2:30 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '15:30', label: '3:30 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '16:30', label: '4:30 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '17:30', label: '5:30 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '18:30', label: '6:30 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '19:30', label: '7:30 PM' },
    { value: '20:00', label: '8:00 PM' }
  ];

  // Shared styles for all Select components
  const selectStyles = {
    container: (base: any) => ({ ...base, width: '100%', zIndex: 1050 }),
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: 16,
      border: state.isFocused ? '2px solid #2563eb' : '2px solid var(--favourite-blue)',
      background: '#111',
      color: '#fff',
                              boxShadow: 'none',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      minHeight: 44,
      transition: 'border 0.2s, box-shadow 0.2s',
    }),
    menu: (base: any) => ({
      ...base,
      background: '#181a1b',
      borderRadius: 12,
      marginTop: 2,
      zIndex: 1100,
      boxShadow: '0 4px 24px 0 #2563eb99',
      color: '#fff',
    }),
    option: (base: any, state: any) => ({
      ...base,
      background: state.isSelected
        ? 'linear-gradient(90deg, #2563eb 60%, #00fff7 100%)'
        : state.isFocused
        ? 'rgba(37,99,235,0.3)'
        : 'transparent',
      color: state.isSelected || state.isFocused ? '#fff' : '#fff',
      fontWeight: state.isSelected ? 700 : 500,
      borderRadius: 8,
      padding: '10px 16px',
      cursor: 'pointer',
      transition: 'background 0.2s',
    }),
    singleValue: (base: any) => ({ ...base, color: '#fff' }),
    placeholder: (base: any) => ({ ...base, color: '#60a5fa', fontWeight: 500 }),
    dropdownIndicator: (base: any, state: any) => ({
      ...base,
      color: '#fff',
      opacity: 0.8,
      fontSize: '1.2rem',
      paddingRight: 10,
      transition: 'color 0.2s',
    }),
    clearIndicator: (base: any) => ({ ...base, color: '#60a5fa' }),
    indicatorSeparator: (base: any) => ({ ...base, display: 'none' }),
    input: (base: any) => ({ ...base, color: '#fff' }),
    menuList: (base: any) => ({ ...base, background: 'transparent', padding: 0 }),
    menuPortal: (base: any) => ({ ...base, zIndex: 11000 }),
  };

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    allDay: false,
    event_type: 'meeting',
    location: '',
    attendees: '',
    reminder_minutes: 15,
    duration: 60
  });

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('📝 FormData updated:', formData);
  }, [formData]);

  // Event types and their colors
  const eventTypes = {
    'meeting': { label: 'Meeting', color: '#3B82F6' },
    'reminder': { label: 'Reminder', color: '#F59E0B' },
    'task': { label: 'Task', color: '#8B5CF6' },
    'personal': { label: 'Personal', color: '#10B981' },
    'work': { label: 'Work', color: '#EF4444' },
    'health': { label: 'Health', color: '#06B6D4' },
    'social': { label: 'Social', color: '#EC4899' }
  };

  // Load events from database
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedEvents = data?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start_time,
        end: event.end_time,
        allDay: event.all_day,
        event_type: event.event_type,
        location: event.location,
        attendees: event.attendees,
        // priority field removed - not used in form
        reminder_minutes: event.reminder_minutes
      })) || [];

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save event to database
  const saveEvent = async (eventData: any) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';

      // Calculate end time based on duration
      const startTime = new Date(eventData.start);
      const endTime = new Date(startTime.getTime() + (eventData.duration * 60 * 1000)); // Convert minutes to milliseconds

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          user_id: userId,
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.start,
          end_time: endTime.toISOString(),
          all_day: eventData.allDay,
          event_type: eventData.event_type,
          location: eventData.location,
          attendees: eventData.attendees ? eventData.attendees.split(',').map((a: string) => a.trim()) : [],
          reminder_minutes: eventData.reminder_minutes
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Event saved successfully:', data);

      // Schedule reminder notification
      if (eventData.reminder_minutes > 0) {
        scheduleReminder(data, eventData.reminder_minutes);
      }

      await loadEvents();
      setShowEventForm(false);
      setSelectedEvent(null);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event. Please try again.');
    }
  };

  // Update event
  const updateEvent = async (eventId: string, updates: any) => {
    try {
      // Calculate end time based on duration
      const startTime = new Date(updates.start);
      const endTime = new Date(startTime.getTime() + (updates.duration * 60 * 1000)); // Convert minutes to milliseconds

      const { error } = await supabase
        .from('calendar_events')
        .update({
          title: updates.title,
          description: updates.description,
          start_time: updates.start,
          end_time: endTime.toISOString(),
          all_day: updates.allDay,
          event_type: updates.event_type,
          location: updates.location,
          attendees: updates.attendees ? updates.attendees.split(',').map((a: string) => a.trim()) : [],
          reminder_minutes: updates.reminder_minutes
        })
        .eq('id', eventId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Event updated successfully');
      await loadEvents();
      setShowEventForm(false);
      setSelectedEvent(null);
      resetForm();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event. Please try again.');
    }
  };

  // Delete event
  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await loadEvents();
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Schedule reminder notification
  const scheduleReminder = (event: any, reminderMinutes: number) => {
    const reminderTime = new Date(event.start_time);
    reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes);
    
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();
    
    if (delay > 0) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Calendar Reminder', {
            body: `${event.title} starts in ${reminderMinutes} minutes`,
            icon: '/favicon.ico'
          });
        }
      }, delay);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = [];
    
    if (!formData.title || formData.title.trim() === '') {
      missingFields.push('Meeting Name');
    }
    
    if (!formData.start || formData.start.trim() === '') {
      missingFields.push('Start Time');
    }
    
    if (!formData.duration || formData.duration <= 0) {
      missingFields.push('Duration');
    }
    
    if (missingFields.length > 0) {
      const message = `Please complete all required fields:\n\n${missingFields.join('\n')}`;
      
      // Create a styled modal for validation message
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]';
      modal.innerHTML = `
        <div class="bg-black border-2 border-[var(--favourite-blue)] rounded-2xl p-6 max-w-md mx-4 text-white">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white">⚠️ Required Fields Missing</h3>
            <button class="text-white hover:text-gray-300 text-2xl font-bold" onclick="this.closest('.fixed').remove()">×</button>
          </div>
          <div class="mb-4">
            <p class="text-white mb-3">Please complete the following required fields:</p>
            <ul class="list-disc list-inside space-y-1">
              ${missingFields.map(field => `<li class="text-white">${field}</li>`).join('')}
            </ul>
          </div>
          <div class="flex justify-end">
            <button class="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm" onclick="this.closest('.fixed').remove()">
              OK
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      return;
    }
    
    if (selectedEvent) {
      // Update existing event
      updateEvent(selectedEvent.id, formData);
    } else {
      // Create new event
    saveEvent(formData);
    }
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    // For now, just show the event details in an alert
    alert(`Event: ${event.title}\nTime: ${new Date(event.start).toLocaleString()}\nDescription: ${event.description || 'No description'}`);
  };



  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start: '',
      allDay: false,
      event_type: 'meeting',
      location: '',
      attendees: '',
      reminder_minutes: 15,
      duration: 60
    });
  };

  // Custom Calendar Helper Functions
  const getCalendarDays = () => {
    if (currentView === 'month') {
      return getMonthDays();
    } else if (currentView === 'week') {
      return getWeekDays();
    } else if (currentView === 'day') {
      return getDayHours();
    }
    return getMonthDays();
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday-based week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Get the number of days in the month
    const daysInMonth = lastDay.getDate();
    
    // Get the number of days in the previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNumber = daysInPrevMonth - i;
      const date = new Date(year, month - 1, dayNumber);
      days.push({
        dayNumber,
        date,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const today = new Date();
      days.push({
        dayNumber: i,
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        dayNumber: i,
        date,
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  };

  const getWeekDays = () => {
    const today = new Date(currentDate);
    const dayOfWeek = today.getDay();
    // Convert to Monday-based week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
    const mondayBasedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - mondayBasedDayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        dayNumber: date.getDate(),
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    return days;
  };

  const getDayHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const date = new Date(currentDate);
      date.setHours(i, 0, 0, 0);
      hours.push({
        hour: i,
        date,
        isCurrentHour: date.getHours() === new Date().getHours() && 
                      date.toDateString() === new Date().toDateString()
      });
    }
    return hours;
  };

  const handleDayClick = (date: Date) => {
    // Format the date for the form
    const formattedDate = date.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      start: formattedDate,
      end: formattedDate
    }));
    setShowEventForm(true);
  };

  // Event rendering functions
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Get events grouped by type for a specific date
  const getEventsByTypeForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const grouped = dayEvents.reduce((acc, event) => {
      const type = event.event_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
    return grouped;
  };

  // Get color for event type
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
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
      default:
        return '#6B7280'; // Gray
    }
  };

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      const eventHour = eventDate.getHours();
      return eventDate.toDateString() === date.toDateString() && eventHour === hour;
    });
  };

  const renderEventBlock = (event: CalendarEvent, isWeekView = false) => {
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
    const eventColor = getEventTypeColor(event.event_type);
    
    return (
      <div
        key={event.id}
        className="event-block h-full w-full p-2 text-xs text-white rounded cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
        style={{ backgroundColor: eventColor }}
        onClick={() => handleEventClick(event)}
      >
        <div className="font-bold truncate text-white">{event.title}</div>
        {isWeekView && (
          <div className="text-xs opacity-90 mt-1">
            {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
            {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {!isWeekView && (
          <div className="text-xs opacity-75">
            {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
            {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    );
  };

  // Load events on mount
  useEffect(() => {
    if (isOpen) {
      loadEvents();
      requestNotificationPermission();
      
      // Add sample events for testing if no events exist
      if (events.length === 0) {
        const today = new Date();
        const sampleEvents = [
          {
            id: '1',
            title: 'Team Meeting',
            description: 'Weekly team sync',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
            allDay: false,
            event_type: 'meeting',
            location: 'Conference Room A',
            attendees: ['John', 'Jane', 'Mike'],
            color: '#3B82F6',
            priority: 'medium',
            reminder_minutes: 15,
            is_completed: false
          },
          {
            id: '2',
            title: 'Client Call',
            description: 'Review project progress',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString(),
            allDay: false,
            event_type: 'conference-call',
            location: 'Zoom',
            attendees: ['Client', 'Team Lead'],
            color: '#8B5CF6',
            priority: 'high',
            reminder_minutes: 30,
            is_completed: false
          },
          {
            id: '3',
            title: 'Doctor Appointment',
            description: 'Annual checkup',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0).toISOString(),
            allDay: false,
            event_type: 'appointment',
            location: 'Medical Center',
            attendees: [],
            color: '#10B981',
            priority: 'medium',
            reminder_minutes: 10,
            is_completed: false
          }
        ];
        setEvents(sampleEvents);
      }
    }
  }, [isOpen]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 glassy-rainbow-btn z-[9999]">
      <div className="w-full h-full bg-black text-white" style={{ padding: '10px', display: 'flex', flexDirection: 'column' }}>
        {/* Sticky Top Section */}
        <div className="sticky top-0 z-10 bg-black pb-4" style={{ marginBottom: '20px' }}>
          {/* Header */}
          <div className="relative px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)', marginBottom: '5px' }}>
            <h2 className="text-xl font-bold text-white">Calendar</h2>
            <button
              onClick={onClose}
              className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
              style={{ background: '#111', border: 'none', outline: 'none' }}
            >
              ×
            </button>
          </div>
          
          {/* Current Date Display */}
          <div className="text-center mb-2">
            <div className="text-white" style={{ fontSize: '11px' }}>
              <span className="font-bold">
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
              <span className="font-normal">
                {', ' + new Date().toLocaleDateString('en-US', { 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          {/* Add New Entry and Saved Events Buttons */}
          <div className="flex justify-center mb-4 gap-4">
            <button
              onClick={() => setShowEventForm(true)}
              className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 hover:scale-105"
              style={{ 
                background: '#111',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
                fontSize: '15px'
              }}
            >
              Add New Entry
            </button>
            <button
              onClick={() => setShowSavedEventsModal(true)}
              className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 hover:scale-105"
              style={{ 
                background: '#111',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
                fontSize: '15px'
              }}
            >
              Saved Events
            </button>
          </div>

          {/* View Selector and Navigation */}
          <div className="flex flex-col items-center mb-4 gap-3" style={{ marginTop: '-10px' }}>
          {/* View Selector */}
          <div className="flex gap-2">
            {[
              { key: 'month', label: 'Month' },
              { key: 'week', label: 'Week' },
              { key: 'day', label: 'Day' }
            ].map(view => (
              <button
                key={view.key}
                onClick={() => setCurrentView(view.key)}
                className={`px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm ${
                  currentView === view.key
                    ? 'border-2 border-white'
                    : ''
                }`}
                
              >
                {view.label}
              </button>
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex gap-2" style={{ marginTop: '-5px' }}>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else if (currentView === 'day') {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setCurrentDate(newDate);
              }}
              className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
            >
              ←
            </button>
            <button
              onClick={() => {
                setCurrentDate(new Date());
              }}
              className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else if (currentView === 'day') {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setCurrentDate(newDate);
              }}
              className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
            >
              →
            </button>
          </div>
        </div>

        {/* Scrollable Calendar Content */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {/* Custom Calendar */}
          <div className="rounded-2xl bg-black bg-opacity-80" style={{ padding: '10px', marginTop: '-20px' }}>
          <div className="calendar-container">
            {/* Calendar Header */}
            <div className="calendar-header mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col items-center">
                </div>
              </div>
            </div>

            {/* Calendar Content */}
            {currentView === 'month' && (
              <div className="calendar-month-view" style={{ border: '2px solid var(--favourite-blue)', borderRadius: '8px', padding: '10px' }}>
                {/* Month Title Row */}
                <div className="text-center mb-2 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)', padding: '5px' }}>
                  <h3 className="text-white font-bold text-lg">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                
                {/* Event Type Legend */}
                <div className="flex flex-wrap justify-center gap-2 mb-2 p-2 bg-gray-800 rounded">
                  {[
                    { type: 'meeting', label: 'Meeting' },
                    { type: 'work', label: 'Work' },
                    { type: 'health', label: 'Health' },
                    { type: 'social', label: 'Social' },
                    { type: 'personal', label: 'Personal' }
                  ].map(({ type, label }) => (
                    <div key={type} className="flex items-center space-x-1">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: getEventTypeColor(type) }}
                      />
                      <span className="text-xs text-white">{label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Month Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Day Headers */}
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <div key={index} className="text-center p-2 border-b border-gray-700" style={{ backgroundColor: 'var(--favourite-blue)' }}>
                      <div className="text-white font-bold text-sm">{day}</div>
                    </div>
                  ))}
                  
                  {/* Month Days */}
                  {getCalendarDays().map((day: any, index) => {
                    const eventsByType = getEventsByTypeForDate(day.date);
                    const totalEvents = getEventsForDate(day.date).length;
                    
                    return (
                    <div
                      key={index}
                        className={`calendar-day p-2 text-center cursor-pointer transition-colors border border-gray-700 min-h-[80px] ${
                        day.isCurrentMonth
                          ? 'text-white hover:bg-white hover:text-black'
                          : 'text-gray-400 bg-gray-800'
                      } ${
                        day.isToday ? 'bg-blue-600 text-white' : ''
                      }`}
                      onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
                    >
                      <div className="text-sm font-bold mb-1">{day.dayNumber}</div>
                        
                        {/* Event Type Blocks with Counts */}
                        <div className="event-type-blocks space-y-1">
                          {Object.entries(eventsByType).map(([eventType, events]) => (
                            <div
                              key={eventType}
                              className="flex items-center justify-center rounded px-1 py-0.5 text-xs font-bold text-white shadow-sm"
                              style={{ 
                                backgroundColor: getEventTypeColor(eventType),
                                minWidth: '24px'
                              }}
                            >
                              <span className="mr-1">{eventType.charAt(0).toUpperCase()}</span>
                              <span>{events.length}</span>
                            </div>
                          ))}
                      </div>
                        
                        {/* Total Events Count */}
                        {totalEvents > 0 && (
                          <div className="text-xs text-gray-300 mt-1">
                            {totalEvents} event{totalEvents !== 1 ? 's' : ''}
                    </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentView === 'week' && (
              <div className="calendar-week-view" style={{ border: '2px solid var(--favourite-blue)', borderRadius: '8px' }}>
                {/* Week Headers */}
                <div className="grid grid-cols-8 gap-0 rounded-t-lg overflow-hidden">
                  {/* Time Header */}
                  <div className="text-center" style={{ width: '50px', backgroundColor: 'var(--favourite-blue)', border: '1px solid black', padding: '5px' }}>
                    <div className="text-white font-bold text-sm"></div>
                  </div>
                  
                  {/* Day Headers */}
                  {getCalendarDays().map((day: any, index) => (
                    <div key={index} className="text-center" style={{ 
                      backgroundColor: day.isToday ? '#10B981' : 'var(--favourite-blue)',
                      border: '1px solid black',
                      borderLeft: day.isToday ? '2px solid #10B981' : '1px solid black',
                      borderRight: day.isToday ? '2px solid #10B981' : '1px solid black',
                      borderTop: day.isToday ? '2px solid #10B981' : '1px solid black',
                      borderTopLeftRadius: day.isToday ? '10px' : '0',
                      borderTopRightRadius: day.isToday ? '10px' : '0',
                      padding: '5px'
                    }}>
                      <div className="text-white font-bold text-sm mb-1">
                        {day.date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                      </div>
                      <div className="text-white text-sm font-semibold">
                        {day.dayNumber}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week Grid */}
                <div className="grid grid-cols-8 gap-0 rounded-b-lg overflow-hidden">
                  {/* Time Column */}
                  <div className="time-column" style={{ width: '50px', backgroundColor: 'var(--favourite-blue)' }}>
                    {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
                      <div key={hour} className="text-white text-xs p-2 h-16 flex items-center justify-center" style={{ 
                        backgroundColor: 'var(--favourite-blue)', 
                        border: '1px solid black'
                      }}>
                        <div className="text-center flex items-center justify-center h-full" style={{ marginLeft: '-10px' }}>
                          <div className="font-bold">
                            {hour === 12 ? '12:00' : hour > 12 ? `${hour}:00` : `${hour}:00`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Day Columns */}
                  {getCalendarDays().map((day: any, dayIndex) => (
                    <div key={dayIndex} className="day-column bg-black" style={{ 
                      borderLeft: day.isToday ? '2px solid #10B981' : '1px solid #666',
                      borderRight: day.isToday ? '2px solid #10B981' : '1px solid #666',
                      borderBottom: day.isToday ? '2px solid #10B981' : '1px solid #666',
                      borderBottomLeftRadius: day.isToday ? '10px' : '0',
                      borderBottomRightRadius: day.isToday ? '10px' : '0'
                    }}>
                      {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => {
                        const eventsInSlot = getEventsForDateAndHour(day.date, hour);
                        return (
                          <div
                            key={hour}
                            className="border-b border-gray-700 h-16 relative cursor-pointer hover:bg-gray-800 transition-colors group"
                            style={{ 
                              border: '1px solid #666'
                            }}
                            onClick={() => {
                              const newDate = new Date(day.date);
                              newDate.setHours(hour, 0, 0, 0);
                              handleDayClick(newDate);
                            }}
                          >
                            {/* Hour indicator on hover */}
                            <div className="absolute top-1 left-1 text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              {hour}:00
                            </div>
                            
                            {/* Events */}
                            {eventsInSlot.map((event, eventIndex) => {
                              const startTime = new Date(event.start);
                              const endTime = new Date(event.end);
                              const startHour = startTime.getHours();
                              const startMinute = startTime.getMinutes();
                              const endHour = endTime.getHours();
                              const endMinute = endTime.getMinutes();
                              
                              // Calculate position and height
                              const topOffset = (startMinute / 60) * 100;
                              const duration = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60;
                              const height = Math.max((duration / 1) * 100, 25); // 1 hour = 100% height
                              
                              return (
                                <div
                                  key={event.id}
                                  className="absolute left-1 right-1 z-10 rounded-md overflow-hidden shadow-lg"
                                  style={{
                                    top: `${topOffset}%`,
                                    height: `${height}%`,
                                    minHeight: '20px',
                                    maxHeight: 'calc(100% - 4px)'
                                  }}
                                >
                                  {renderEventBlock(event, true)}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'day' && (
              <div className="calendar-day-view" style={{ border: '2px solid var(--favourite-blue)', borderRadius: '8px', padding: '10px' }}>
                {/* Day Header */}
                <div className="mb-2 text-center rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)', padding: '5px' }}>
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
                  {Array.from({ length: 17 }, (_, i) => i + 7).map((hour) => (
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
                          handleDayClick(newDate);
                        }}
                      >
                        {/* Hour indicator on hover */}
                        <div className="absolute top-2 left-2 text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {hour}:00
                        </div>
                        
                        {/* Events */}
                        {getEventsForDateAndHour(currentDate, hour).map((event) => (
                          <div key={event.id} className="w-full">
                            {renderEventBlock(event)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>

          </div>
        </div>

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black bg-opacity-70">
            <div className="relative rounded-2xl bg-black px-4 pb-6 w-full max-w-[90vw] max-h-[90vh] flex flex-col glassy-rainbow-btn" style={{ boxSizing: 'border-box', minHeight: '80vh', minWidth: '90vw' }}>

              {/* Event Form Content */}
              <div className="relative bg-[var(--favourite-blue)] rounded-t-2xl rounded-b-2xl p-4 mb-2 mt-2 -mx-2">
                <h3 className="text-lg font-bold text-center text-white">
                  {selectedEvent ? 'Edit Event' : 'Schedule New Event'}
                </h3>
              <button
                  onClick={() => {
                    setShowEventForm(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
              >
                ×
              </button>
              </div>
              
              <div className="overflow-y-auto flex-1 px-2 pt-0 pb-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="mb-1">
                  <label className="block text-sm mb-1 text-white text-left">Title *</label>
                  <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-black border-2 border-[var(--favourite-blue)] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <SpeechToTextButton
                      onResult={handleTitleSTTResult}
                      onStart={handleTitleSTTStart}
                      onError={(error) => alert(error)}
                      size="md"
                      className="px-4 py-3"
                    />
                  </div>
                </div>

                <div className="mb-1">
                  <label className="block text-sm mb-1 text-white text-left" style={{ fontSize: '0.875rem' }}>Description</label>
                  <div className="flex gap-2">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-black border-2 border-[var(--favourite-blue)] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                      style={{ fontSize: '0.7rem' }}
                      rows={2}
                      placeholder="Enter event description..."
                    />
                    <SpeechToTextButton
                      onResult={handleDescriptionSTTResult}
                      onStart={handleDescriptionSTTStart}
                      onError={(error) => alert(error)}
                      size="md"
                      className="px-4 py-3"
                    />
                  </div>
                </div>

                <div className="mb-1">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-1 text-white text-left">Date *</label>
                  <CustomDatePicker
                    value={formData.start ? new Date(formData.start) : new Date()}
                    onChange={(date) => {
                          // Get the current time from formData.start or use current time
                          const currentTime = formData.start ? formData.start.split('T')[1]?.slice(0, 5) : new Date().toTimeString().slice(0, 5);
                      
                          // Create new datetime by combining the new date with the current time
                          const newStart = `${date.toISOString().split('T')[0]}T${currentTime}`;
                      
                      setFormData(prev => ({ 
                        ...prev, 
                            start: newStart
                      }));
                    }}
                  />
                </div>
                      <div className="flex-1">
                      <label className="block text-sm mb-1 text-white text-left">Start Time *</label>
                      <Select
                        className="w-full"
                        value={timeOptions.find(opt => opt.value === (formData.start ? formData.start.split('T')[1]?.slice(0, 5) : '')) || null}
                        onChange={(option: SingleValue<TimeOption>) => {
                          if (option) {
                            console.log('🕐 Time Select onChange - new time:', option.value);
                            console.log('🕐 Time Select onChange - current formData.start:', formData.start);
                            
                            // Get the current date part
                            const currentDate = formData.start ? formData.start.split('T')[0] : new Date().toISOString().split('T')[0];
                            console.log('🕐 Time Select onChange - currentDate:', currentDate);
                            
                            // Create the new start datetime by combining date and time
                            const newStart = `${currentDate}T${option.value}`;
                            console.log('🕐 Time Select onChange - newStart:', newStart);
                            
                            setFormData(prev => ({ 
                              ...prev, 
                              start: newStart
                            }));
                          }
                        }}
                        options={timeOptions}
                        placeholder=""
                          isClearable={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                          components={{
                            DropdownIndicator: (props) => (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%',
                                paddingRight: 10,
                                color: '#fff',
                                opacity: 0.8,
                                fontSize: '1.2rem',
                              }}>
                                ▼
                              </div>
                            )
                          }}
                        styles={selectStyles}
                      />
                    </div>
                  </div>
                      </div>
                    
                <div className="mb-1">
                  <label className="text-white text-sm mb-1 text-left" style={{ marginLeft: '-220px' }}>Duration</label>
                      <Select
                    className="w-full"
                    value={durationOptions.find(opt => opt.value === formData.duration) || null}
                    onChange={(option: SingleValue<DurationOption>) => {
                          if (option) {
                      setFormData(prev => ({ ...prev, duration: option.value }));
                          }
                        }}
                    options={durationOptions}
                        placeholder=""
                        isClearable={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        
                        components={{
                          DropdownIndicator: (props) => (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              paddingRight: 10,
                              color: '#fff',
                              opacity: 0.8,
                              fontSize: '1.2rem',
                            }}>
                              ▼
                            </div>
                          )
                        }}
                    styles={selectStyles}
                  />
                  </div>



                <div className="mb-1">
                  <label className="text-white text-sm mb-1 text-left" style={{ marginLeft: '-210px' }}>Reminder</label>
                  <div className="flex gap-2">
                    <Select
                      className="w-full"
                      value={reminderOptions.find(opt => opt.value === formData.reminder_minutes) || null}
                      onChange={(option: SingleValue<ReminderOption>) => {
                        if (option) {
                          setFormData(prev => ({ ...prev, reminder_minutes: option.value }));
                        }
                      }}
                      options={reminderOptions}
                      placeholder=""
                      isClearable={false}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      
                      components={{
                        DropdownIndicator: (props) => (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                            paddingRight: 10,
                            color: '#fff',
                            opacity: 0.8,
                            fontSize: '1.2rem',
                          }}>
                            ▼
                          </div>
                        )
                      }}
                      styles={{
                        container: (base: any) => ({ ...base, width: '100%', zIndex: 1050 }),
                        control: (base: any, state: any) => ({
                          ...base,
                          borderRadius: 16,
                          border: state.isFocused ? '2px solid #2563eb' : '2px solid var(--favourite-blue)',
                          background: '#111',
                          color: '#fff',
                          boxShadow: 'none',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          minHeight: 44,
                          transition: 'border 0.2s, box-shadow 0.2s',
                        }),
                        menu: (base: any) => ({
                          ...base,
                          background: '#181a1b',
                          borderRadius: 12,
                          marginTop: 2,
                          zIndex: 1100,
                          boxShadow: '0 4px 24px 0 #2563eb99',
                          color: '#fff',
                        }),
                        option: (base: any, state: any) => ({
                          ...base,
                          background: state.isSelected
                            ? 'linear-gradient(90deg, #2563eb 60%, #00fff7 100%)'
                            : state.isFocused
                            ? 'rgba(37,99,235,0.3)'
                            : 'transparent',
                          color: state.isSelected || state.isFocused ? '#fff' : '#fff',
                          fontWeight: state.isSelected ? 700 : 500,
                          borderRadius: 8,
                          padding: '10px 16px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }),
                        singleValue: (base: any) => ({ ...base, color: '#fff' }),
                        placeholder: (base: any) => ({ ...base, color: '#60a5fa', fontWeight: 500 }),
                        dropdownIndicator: (base: any, state: any) => ({
                          ...base,
                          color: '#fff',
                          opacity: 0.8,
                          fontSize: '1.2rem',
                          paddingRight: 10,
                          transition: 'color 0.2s',
                        }),
                        clearIndicator: (base: any) => ({ ...base, color: '#60a5fa' }),
                        indicatorSeparator: (base: any) => ({ ...base, display: 'none' }),
                        input: (base: any) => ({ ...base, color: '#fff' }),
                        menuList: (base: any) => ({ ...base, background: 'transparent', padding: 0 }),
                        menuPortal: (base: any) => ({ ...base, zIndex: 11000 }),
                      }}
                    />
                  </div>
                  </div>

                <div className="mb-1">
                  <label className="block text-sm mb-1 text-white text-left">Event Type</label>
                    <Select
                    className="w-full"
                    value={eventTypeOptions.find(opt => opt.value === formData.event_type) || null}
                    onChange={(option: SingleValue<EventTypeOption>) => {
                        if (option) {
                        setFormData(prev => ({ ...prev, event_type: option.value }));
                        }
                      }}
                    options={eventTypeOptions}
                    placeholder=""
                      isClearable={false}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      
                      components={{
                        DropdownIndicator: (props) => (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                            paddingRight: 10,
                            color: '#fff',
                            opacity: 0.8,
                            fontSize: '1.2rem',
                          }}>
                            ▼
                          </div>
                        )
                      }}
                    styles={selectStyles}
                  />
                </div>



                <div className="mb-1">
                  <label className="block text-sm mb-1 text-white text-left">Location / Meeting link</label>
                  <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-black border-2 border-[var(--favourite-blue)] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                    style={{ fontSize: '0.8rem' }}
                  />
                    <SpeechToTextButton
                      onResult={handleLocationSTTResult}
                      onStart={handleLocationSTTStart}
                      onError={(error) => alert(error)}
                      size="md"
                      className="px-4 py-3"
                    />
                  </div>
                </div>

                <div className="mb-1">
                                      <label className="block text-sm mb-1 text-white text-left">Attendees</label>
                  <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.attendees}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                    placeholder="john@example.com, jane@example.com"
                      className="flex-1 px-4 py-3 bg-black border-2 border-[var(--favourite-blue)] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all"
                      style={{ fontSize: '0.8rem' }}
                    />
                    <SpeechToTextButton
                      onResult={handleAttendeesSTTResult}
                      onStart={handleAttendeesSTTStart}
                      onError={(error) => alert(error)}
                      size="md"
                      className="px-4 py-3"
                  />
                </div>
                </div>





                <div className="md:col-span-2 flex gap-4 justify-center mt-4">
                  <button
                    type="submit"
                    className="px-8 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
            <div className="w-full flex items-center justify-center">
              <div className="glassy-rainbow-btn rounded-2xl bg-black p-2 w-full max-h-[90vh] flex flex-col border-0" style={{ boxSizing: 'border-box' }}>
                <div className="overflow-y-auto flex-1">
                  {/* Header */}
                  <div className="relative mb-6 px-0 py-3 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)' }}>
                    <h3 className="text-xl font-bold text-white text-center">{selectedEvent.title}</h3>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
                      style={{ background: '#111', border: 'none', outline: 'none' }}
                    >
                      ×
                    </button>
                  </div>
              
                                <div className="space-y-6 px-0">
                  <div>
                    <label className="block text-sm mb-2 text-white text-left">Description:</label>
                    <div className="flex gap-2">
                      <textarea
                        value={selectedEvent.description || ''}
                        onChange={(e) => setSelectedEvent({...selectedEvent, description: e.target.value})}
                        className="flex-1 bg-black border-2 border-[var(--favourite-blue)] rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 resize-none text-left"
                        rows={3}
                        placeholder="Enter description..."
                      />
                      <SpeechToTextButton
                        onResult={handleEditDescriptionSTTResult}
                        onStart={handleEditDescriptionSTTStart}
                        onError={(error) => alert(error)}
                        size="md"
                        className="px-4 py-3"
                      />
                    </div>
                </div>
                
                  <div className="flex gap-4 items-end mb-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-2 text-white text-left">Date *</label>
                      <CustomDatePicker
                        value={selectedEvent.start ? new Date(selectedEvent.start) : new Date()}
                        onChange={(date) => {
                          const currentStart = selectedEvent.start ? new Date(selectedEvent.start) : new Date();
                          const newStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), currentStart.getHours(), currentStart.getMinutes());
                          setSelectedEvent({...selectedEvent, start: newStart.toISOString().slice(0, 16)});
                        }}
                      />
                </div>
                
                    <div className="flex-1">
                      <label className="block text-sm mb-2 text-white text-left">Start Time *</label>
                      <Select
                        className="flex-1 min-w-0"
                        value={timeOptions.find(opt => opt.value === (selectedEvent.start ? selectedEvent.start.split('T')[1]?.slice(0, 5) : '')) || null}
                        onChange={(option: SingleValue<TimeOption>) => {
                          if (option) {
                            console.log('🕐 Event Details Time Select onChange - new time:', option.value);
                            console.log('🕐 Event Details Time Select onChange - current selectedEvent.start:', selectedEvent.start);
                            
                            // Get the current date part
                            const currentDate = selectedEvent.start ? selectedEvent.start.split('T')[0] : new Date().toISOString().split('T')[0];
                            console.log('🕐 Event Details Time Select onChange - currentDate:', currentDate);
                            
                            // Create the new start datetime by combining date and time
                            const newStart = `${currentDate}T${option.value}`;
                            console.log('🕐 Event Details Time Select onChange - newStart:', newStart);
                            
                            setSelectedEvent({...selectedEvent, start: newStart});
                          }
                        }}
                        options={timeOptions}
                        placeholder=""
                        isClearable={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        components={{
                          DropdownIndicator: (props) => (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              paddingRight: 10,
                              color: '#fff',
                              opacity: 0.8,
                              fontSize: '1.2rem',
                            }}>
                              ▼
                            </div>
                          )
                        }}
                        styles={selectStyles}
                      />
                    </div>
                </div>
                
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-white text-xs mb-1 text-left" style={{ fontSize: '0.85rem' }}>Reminder</label>
                      <Select
                        className="flex-1 min-w-0"
                        value={reminderOptions.find(opt => opt.value === selectedEvent.reminder_minutes) || null}
                        onChange={(option: SingleValue<ReminderOption>) => {
                          if (option) {
                            setSelectedEvent({...selectedEvent, reminder_minutes: option.value});
                          }
                        }}
                        options={reminderOptions}
                        placeholder=""
                        isClearable={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        components={{
                          DropdownIndicator: (props) => (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              paddingRight: 10,
                              color: '#fff',
                              opacity: 0.8,
                              fontSize: '1.2rem',
                            }}>
                              ▼
                            </div>
                          )
                        }}
                        styles={selectStyles}
                      />
                    </div>
                </div>
                
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm mb-2 text-white text-left">Event Type</label>
                      <Select
                        className="flex-1 min-w-0"
                        value={eventTypeOptions.find(opt => opt.value === selectedEvent.event_type) || null}
                        onChange={(option: SingleValue<EventTypeOption>) => {
                          if (option) {
                            setSelectedEvent({...selectedEvent, event_type: option.value});
                          }
                        }}
                        options={eventTypeOptions}
                        placeholder=""
                        isClearable={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        components={{
                          DropdownIndicator: (props) => (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              paddingRight: 10,
                              color: '#fff',
                              opacity: 0.8,
                              fontSize: '1.2rem',
                            }}>
                            ▼
                  </div>
                          )
                        }}
                        styles={selectStyles}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-sm mb-2 text-white text-left">Reminder</label>
                      <Select
                        className="flex-1 min-w-0"
                        value={reminderOptions.find(opt => opt.value === selectedEvent.reminder_minutes) || null}
                        onChange={(option: SingleValue<ReminderOption>) => {
                          if (option) {
                            setSelectedEvent({...selectedEvent, reminder_minutes: option.value});
                          }
                        }}
                        options={reminderOptions}
                        placeholder=""
                        isClearable={false}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        components={{
                          DropdownIndicator: (props) => (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              paddingRight: 10,
                              color: '#fff',
                              opacity: 0.8,
                              fontSize: '1.2rem',
                            }}>
                            ▼
                  </div>
                          )
                        }}
                        styles={selectStyles}
                      />
                    </div>
              </div>
              
                  <div>
                    <label className="block text-sm mb-2 text-white text-left">Location / Meeting link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedEvent.location || ''}
                        onChange={(e) => setSelectedEvent({...selectedEvent, location: e.target.value})}
                        className="flex-1 px-4 py-3 bg-black border-2 border-[var(--favourite-blue)] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all text-left"
                        style={{ fontSize: '0.8rem' }}
                        placeholder="Enter location or meeting link..."
                      />
                      <SpeechToTextButton
                        onResult={handleEditLocationSTTResult}
                        onStart={handleEditLocationSTTStart}
                        onError={(error) => alert(error)}
                        size="md"
                        className="px-4 py-3"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2 text-white text-left">Attendees</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedEvent.attendees ? selectedEvent.attendees.join(', ') : ''}
                        onChange={(e) => setSelectedEvent({...selectedEvent, attendees: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                        className="flex-1 px-4 py-3 bg-black border-2 border-[var(--favourite-blue)] rounded-xl text-white focus:outline-none focus:border-blue-500 transition-all text-left"
                        style={{ fontSize: '0.8rem' }}
                        placeholder=""
                      />
                      <SpeechToTextButton
                        onResult={handleEditAttendeesSTTResult}
                        onStart={handleEditAttendeesSTTStart}
                        onError={(error) => alert(error)}
                        size="md"
                        className="px-4 py-3"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
                              <div className="flex justify-center mt-8 gap-4 pt-2">
                <button
                  onClick={() => deleteEvent(selectedEvent.id)}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                    style={{ background: '#111' }}
                >
                    Delete
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                    style={{ background: '#111' }}
                >
                    Close
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom CSS for FullCalendar */}
        <style>{`
          .fc {
            background: transparent !important;
            color: white !important;
            font-size: 13px !important; /* default reduced from 14px to 13px */
          }
          
          .fc-toolbar {
            background: rgba(0, 0, 0, 0.8) !important;
            border-radius: 12px !important;
            padding: 12px !important;
            margin-bottom: 16px !important;
            font-size: 15px !important; /* reduced from 16px */
          }
          
          .fc-button {
            background: linear-gradient(135deg, var(--favourite-blue), #1e40af) !important;
            border: none !important;
            border-radius: 8px !important;
            color: white !important;
            font-weight: bold !important;
            padding: 8px 16px !important;
            transition: all 0.3s ease !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
          }
          
          .fc-button-active {
            background: linear-gradient(135deg, #00ff99, #00cc7a) !important;
          }
          
          .fc-daygrid-day {
            background: rgba(0, 0, 0, 0.6) !important;
            border: 1px solid rgba(59, 130, 246, 0.3) !important;
          }
          
          .fc-daygrid-day:hover {
            background: rgba(59, 130, 246, 0.1) !important;
          }
          
          .fc-daygrid-day-number {
            color: white !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-day-today {
            background: rgba(59, 130, 246, 0.2) !important;
          }
          
          .fc-event {
            border-radius: 6px !important;
            border: none !important;
            font-weight: bold !important;
            padding: 2px 6px !important;
            margin: 1px !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-event:hover {
            transform: scale(1.02) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
          }
          
          .fc-col-header-cell {
            background: rgba(0, 0, 0, 0.8) !important;
            border: 1px solid rgba(59, 130, 246, 0.3) !important;
            color: white !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          /* Abbreviated day names for week view (S, M, T, W, T, F, S) */
          .fc-timegrid .fc-col-header-cell-cushion {
            font-size: 0 !important;
            position: relative;
          }
          .fc-timegrid .fc-col-header-cell:nth-child(1) .fc-col-header-cell-cushion::after { content: "S"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(2) .fc-col-header-cell-cushion::after { content: "M"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(3) .fc-col-header-cell-cushion::after { content: "T"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(4) .fc-col-header-cell-cushion::after { content: "W"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(5) .fc-col-header-cell-cushion::after { content: "T"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(6) .fc-col-header-cell-cushion::after { content: "F"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(7) .fc-col-header-cell-cushion::after { content: "S"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          
          /* Hide original day names */
          .fc-day-header .fc-col-header-cell-cushion {
            font-size: 0 !important;
          }
          
          /* Show abbreviated day names */
          .fc-day-header .fc-col-header-cell-cushion::after {
            font-size: 12px !important; /* reduced from 14px */
            font-weight: bold !important;
            color: white !important;
          }
          
          .fc-timegrid-slot {
            background: rgba(0, 0, 0, 0.4) !important;
            border: 1px solid rgba(59, 130, 246, 0.2) !important;
          }
          
          .fc-timegrid-slot-label {
            color: white !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-list-event {
            background: rgba(0, 0, 0, 0.6) !important;
            border: 1px solid rgba(59, 130, 246, 0.3) !important;
            border-radius: 8px !important;
            margin: 4px 0 !important;
            padding: 8px !important;
          }
          
          .fc-list-event:hover {
            background: rgba(59, 130, 246, 0.1) !important;
          }
          
          .fc-list-event-title {
            color: white !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-list-event-time {
            color: var(--favourite-blue) !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-now-indicator-line {
            border-color: #ff6b6b !important;
            border-width: 2px !important;
          }
          
          .fc-now-indicator-arrow {
            border-color: #ff6b6b !important;
            border-width: 5px !important;
          }
          
          .fc-timegrid-slot {
            background: rgba(0, 0, 0, 0.4) !important;
            border: 1px solid rgba(59, 130, 246, 0.2) !important;
          }
          
          .fc-timegrid-slot-label {
            color: white !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-list-event {
            background: rgba(0, 0, 0, 0.6) !important;
            border: 1px solid rgba(59, 130, 246, 0.3) !important;
            border-radius: 8px !important;
            margin: 4px 0 !important;
            padding: 8px !important;
          }
          
          .fc-list-event:hover {
            background: rgba(59, 130, 246, 0.1) !important;
          }
          
          .fc-list-event-title {
            color: white !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-list-event-time {
            color: var(--favourite-blue) !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-list-day-text {
            color: white !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }
          
          .fc-list-day-cushion {
            background: rgba(0, 0, 0, 0.8) !important;
            color: var(--favourite-blue) !important;
            font-weight: bold !important;
            font-size: 11px !important; /* reduced from 12px */
          }

          /* Only show day number, hide month in day cells for week and month views */
          .fc-daygrid-day-number, .fc-timegrid .fc-daygrid-day-number {
            font-size: 11px !important;
            font-weight: bold;
            color: white;
          }
          /* Hide month part in day numbers (e.g., '7/20' -> '20') */
          .fc-daygrid-day-number {
            font-size: 11px !important;
            font-weight: bold;
            color: white;
          }
          .fc-daygrid-day-number::before {
            content: '' !important;
          }
          .fc-daygrid-day-number {
            /* Remove any slashes or month text by hiding everything before the last number */
            unicode-bidi: plaintext;
          }
          /* If FullCalendar outputs '7/20', hide everything before the slash */
          .fc-daygrid-day-number {
            /* Use JavaScript to post-process if needed for more complex cases */
          }

          /* Custom day cell header: single letter day name on top, date below */
          .fc-timegrid .fc-col-header-cell-cushion {
            font-size: 0 !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0 !important;
            line-height: 1.1;
          }
          .fc-timegrid .fc-col-header-cell:nth-child(1) .fc-col-header-cell-cushion::before { content: "S"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(2) .fc-col-header-cell-cushion::before { content: "M"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(3) .fc-col-header-cell-cushion::before { content: "T"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(4) .fc-col-header-cell-cushion::before { content: "W"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(5) .fc-col-header-cell-cushion::before { content: "T"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(6) .fc-col-header-cell-cushion::before { content: "F"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell:nth-child(7) .fc-col-header-cell-cushion::before { content: "S"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-timegrid .fc-col-header-cell-cushion::after {
            content: attr(data-date);
            font-size: 11px !important;
            color: var(--favourite-blue);
            font-weight: bold;
            display: block;
            margin-top: 2px;
          }

          /* Month view: single letter day name on top, date below */
          .fc-daygrid .fc-col-header-cell-cushion {
            font-size: 0 !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0 !important;
            line-height: 1.1;
          }
          .fc-daygrid .fc-col-header-cell:nth-child(1) .fc-col-header-cell-cushion::before { content: "S"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-daygrid .fc-col-header-cell:nth-child(2) .fc-col-header-cell-cushion::before { content: "M"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-daygrid .fc-col-header-cell:nth-child(3) .fc-col-header-cell-cushion::before { content: "T"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-daygrid .fc-col-header-cell:nth-child(4) .fc-col-header-cell-cushion::before { content: "W"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-daygrid .fc-col-header-cell:nth-child(5) .fc-col-header-cell-cushion::before { content: "T"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-daygrid .fc-col-header-cell:nth-child(6) .fc-col-header-cell-cushion::before { content: "F"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-daygrid .fc-col-header-cell:nth-child(7) .fc-col-header-cell-cushion::before { content: "S"; font-size: 11px !important; font-weight: bold; color: white; display: block; }
          .fc-daygrid .fc-col-header-cell-cushion::after {
            content: attr(data-date);
            font-size: 11px !important;
            color: var(--favourite-blue);
            font-weight: bold;
            display: block;
            margin-top: 2px;
          }
        `}</style>
      </div>

      {/* Saved Events Modal */}
      {showSavedEventsModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative rounded-2xl bg-black px-4 py-6 w-full max-w-[90vw] max-h-[95vh] flex flex-col glassy-rainbow-btn" style={{ boxSizing: 'border-box', minHeight: '80vh', minWidth: '350px' }}>
            {/* X Close Button */}
            <button
              onClick={() => setShowSavedEventsModal(false)}
              className="absolute w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
              style={{ background: '#111', border: 'none', outline: 'none', top: '11px', right: '9px' }}
            >
              ×
            </button>
            
            {/* Modal Header */}
            <h3 className="text-xl font-bold mb-6 text-center p-3 rounded-lg" style={{
              backgroundColor: 'var(--favourite-blue)',
              color: 'white',
              marginTop: '-15px',
              width: 'calc(100% + 15px)',
              marginLeft: '-7.5px'
            }}>
              Saved Events
            </h3>

            {/* Events List */}
            <div className="overflow-y-auto flex-1 px-2 py-4">
              {events.length === 0 ? (
                <div className="text-center text-white py-8">
                  <p className="text-lg mb-2">No saved events yet</p>
                  <p className="text-sm text-gray-400">Create your first event using the "Add New Entry" button</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-gray-900 rounded-xl p-4 border-2 border-gray-700 hover:border-blue-500 transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {/* Event Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-lg mb-1">{event.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                              backgroundColor: getEventTypeColor(event.event_type),
                              color: 'white'
                            }}>
                              {eventTypes[event.event_type as keyof typeof eventTypes]?.label || event.event_type}
                            </span>
                            <span>•</span>
                            <span>{new Date(event.start).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-2 mb-4">
                        {event.description && (
                          <p className="text-gray-300 text-sm">{event.description}</p>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>📍</span>
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>👥</span>
                            <span>{event.attendees.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>⏱️ {event.reminder_minutes} min reminder</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventForm(true);
                            setShowSavedEventsModal(false);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this event?')) {
                              await deleteEvent(event.id);
                              setShowSavedEventsModal(false);
                            }
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarModal; 
