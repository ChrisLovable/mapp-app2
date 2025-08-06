// Calendar Event Types
export interface CalendarEvent {
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

// Calendar Modal Props
export interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputText?: string;
}

// Option Types
export type DurationOption = { value: number; label: string };
export type ReminderOption = { value: number; label: string };
export type EventTypeOption = { value: string; label: string };
export type TimeOption = { value: string; label: string };

// Search Result Type
export interface SearchResult {
  title: string;
  summary: string;
  source: string;
  url: string;
}

// Notification State Type
export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Form Data Types
export interface FormData {
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  event_type: string;
  location: string;
  attendees: string | string[];
  reminder_minutes: number;
  duration: number;
}

export interface EditingFormData {
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  event_type: string;
  location: string;
  attendees: string | string[];
  reminder_minutes: number;
  duration: number;
}

// Calendar Day Type
export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

// Event Type
export interface EventType {
  value: string;
  label: string;
  color: string;
} 