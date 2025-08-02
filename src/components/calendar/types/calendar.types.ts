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

export interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputText?: string;
}

export type DurationOption = { value: number; label: string };
export type ReminderOption = { value: number; label: string };
export type EventTypeOption = { value: string; label: string };
export type TimeOption = { value: string; label: string };

export interface SearchResult {
  title: string;
  summary: string;
  source: string;
  url: string;
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface FormData {
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  event_type: string;
  location: string;
  attendees: string[];
  reminder_minutes: number;
}

export interface EditingFormData {
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  event_type: string;
  location: string;
  attendees: string[];
  reminder_minutes: number;
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface EventType {
  value: string;
  label: string;
  color: string;
} 