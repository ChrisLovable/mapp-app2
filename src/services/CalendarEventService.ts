import { supabase } from '../lib/supabase';
import { CalendarEvent } from '../components/calendar/types/calendar.types';

export class CalendarEventService {
  static async loadEvents(): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }

  static async saveEvent(eventData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .insert([eventData]);

      if (error) {
        console.error('Error saving event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  }

  static async updateEvent(eventId: string, updates: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  static scheduleReminder(event: any, reminderMinutes: number): void {
    try {
      const eventTime = new Date(event.start);
      const reminderTime = new Date(eventTime.getTime() - (reminderMinutes * 60 * 1000));
      const now = new Date();

      if (reminderTime > now) {
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        setTimeout(() => {
          this.showNotification(event);
        }, timeUntilReminder);
      }
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }

  private static showNotification(event: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Calendar Reminder', {
        body: `${event.title} starts in ${event.reminder_minutes} minutes`,
        icon: '/favicon.ico'
      });
    }
  }

  static async requestNotificationPermission(): Promise<void> {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    }
  }
} 