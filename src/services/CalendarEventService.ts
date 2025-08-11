import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../types/calendar';

export class CalendarEventService {
  static async loadEvents(): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }

      // Map database fields to interface fields
      const mappedData = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start_time, // Map start_time to start
        end: event.end_time,     // Map end_time to end
        allDay: event.all_day,   // Map all_day to allDay
        event_type: event.event_type,
        location: event.location,
        attendees: event.attendees || [],
        reminder_minutes: event.reminder_minutes
      }));
      
      return mappedData;
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }

  static async saveEvent(eventData: any): Promise<void> {
    try {
      // Map app model (camelCase) to DB schema (snake_case)
      const row = {
        title: eventData.title,
        description: eventData.description ?? null,
        start_time: eventData.start ?? eventData.start_time,
        end_time: eventData.end ?? eventData.end_time,
        all_day: eventData.allDay ?? eventData.all_day ?? false,
        event_type: eventData.event_type ?? null,
        location: eventData.location ?? null,
        attendees: eventData.attendees ?? [],
        reminder_minutes: eventData.reminder_minutes ?? 0,
      };

      const { error } = await supabase
        .from('calendar_events')
        .insert([row]);

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
      // Map app model updates (camelCase) to DB schema (snake_case)
      const rowUpdates: any = {};
      if (typeof updates.title !== 'undefined') rowUpdates.title = updates.title;
      if (typeof updates.description !== 'undefined') rowUpdates.description = updates.description;
      if (typeof updates.start !== 'undefined') rowUpdates.start_time = updates.start;
      if (typeof updates.start_time !== 'undefined') rowUpdates.start_time = updates.start_time;
      if (typeof updates.end !== 'undefined') rowUpdates.end_time = updates.end;
      if (typeof updates.end_time !== 'undefined') rowUpdates.end_time = updates.end_time;
      if (typeof updates.allDay !== 'undefined') rowUpdates.all_day = updates.allDay;
      if (typeof updates.all_day !== 'undefined') rowUpdates.all_day = updates.all_day;
      if (typeof updates.event_type !== 'undefined') rowUpdates.event_type = updates.event_type;
      if (typeof updates.location !== 'undefined') rowUpdates.location = updates.location;
      if (typeof updates.attendees !== 'undefined') rowUpdates.attendees = updates.attendees;
      if (typeof updates.reminder_minutes !== 'undefined') rowUpdates.reminder_minutes = updates.reminder_minutes;

      const { error } = await supabase
        .from('calendar_events')
        .update(rowUpdates)
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