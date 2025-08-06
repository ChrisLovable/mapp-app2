import { supabase } from '../lib/supabase';
export class CalendarEventService {
    static async loadEvents() {
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
                end: event.end_time, // Map end_time to end
                allDay: event.all_day, // Map all_day to allDay
                event_type: event.event_type,
                location: event.location,
                attendees: event.attendees || [],
                reminder_minutes: event.reminder_minutes
            }));
            return mappedData;
        }
        catch (error) {
            console.error('Failed to load events:', error);
            return [];
        }
    }
    static async saveEvent(eventData) {
        try {
            const { error } = await supabase
                .from('calendar_events')
                .insert([eventData]);
            if (error) {
                console.error('Error saving event:', error);
                throw error;
            }
        }
        catch (error) {
            console.error('Failed to save event:', error);
            throw error;
        }
    }
    static async updateEvent(eventId, updates) {
        try {
            const { error } = await supabase
                .from('calendar_events')
                .update(updates)
                .eq('id', eventId);
            if (error) {
                console.error('Error updating event:', error);
                throw error;
            }
        }
        catch (error) {
            console.error('Failed to update event:', error);
            throw error;
        }
    }
    static async deleteEvent(eventId) {
        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', eventId);
            if (error) {
                console.error('Error deleting event:', error);
                throw error;
            }
        }
        catch (error) {
            console.error('Failed to delete event:', error);
            throw error;
        }
    }
    static scheduleReminder(event, reminderMinutes) {
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
        }
        catch (error) {
            console.error('Failed to schedule reminder:', error);
        }
    }
    static showNotification(event) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Calendar Reminder', {
                body: `${event.title} starts in ${event.reminder_minutes} minutes`,
                icon: '/favicon.ico'
            });
        }
    }
    static async requestNotificationPermission() {
        try {
            if ('Notification' in window && Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
        catch (error) {
            console.error('Failed to request notification permission:', error);
        }
    }
}
