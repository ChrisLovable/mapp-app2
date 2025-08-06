export interface Alarm {
    id: string;
    targetTime: Date;
    originalText: string;
    description: string;
    isActive: boolean;
    timeoutId?: NodeJS.Timeout;
}
export interface ParsedAlarm {
    targetTime: Date;
    originalText: string;
    description: string;
    isRelative: boolean;
    timeString: string;
}
export declare function getAlarmTimeFromText(input: string): ParsedAlarm | null;
export declare function scheduleAlarm(targetTime: Date, onTrigger: () => void, alarmId: string): NodeJS.Timeout | undefined;
export declare function playAlarmSound(): Promise<void>;
export declare function showAlarmNotification(title: string, body: string): Promise<void>;
export declare class AlarmManager {
    private alarms;
    private nextId;
    private onAlarmTrigger?;
    setAlarmTriggerCallback(callback: (alarm: Alarm) => void): void;
    addAlarm(parsedAlarm: ParsedAlarm): string;
    private triggerAlarm;
    cancelAlarm(alarmId: string): boolean;
    getActiveAlarms(): Alarm[];
    getAllAlarms(): Alarm[];
    clearAllAlarms(): void;
    private saveToStorage;
    loadFromStorage(): void;
}
export declare const alarmManager: AlarmManager;
