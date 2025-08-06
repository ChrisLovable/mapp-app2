import type { CalendarEvent } from '../types/calendar';
export declare class CalendarEventService {
    static loadEvents(): Promise<CalendarEvent[]>;
    static saveEvent(eventData: any): Promise<void>;
    static updateEvent(eventId: string, updates: any): Promise<void>;
    static deleteEvent(eventId: string): Promise<void>;
    static scheduleReminder(event: any, reminderMinutes: number): void;
    private static showNotification;
    static requestNotificationPermission(): Promise<void>;
}
