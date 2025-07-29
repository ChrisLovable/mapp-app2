// AlarmLogic.ts - Comprehensive alarm reminder system
import * as chrono from 'chrono-node';

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

// Parse natural language into alarm time and description
export function getAlarmTimeFromText(input: string): ParsedAlarm | null {
  try {
    const parsed = chrono.parse(input);
    if (parsed.length > 0) {
      const result = parsed[0];
      const targetTime = result.start.date();
      
      // Check if the time is in the past
      if (targetTime.getTime() <= Date.now()) {
        return null;
      }

      // Determine if it's relative or absolute time
      const isRelative = result.start.isCertain('hour') === false || 
                        result.start.isCertain('minute') === false;

      // Format time string for display
      const timeString = targetTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Extract description by removing the time-related text
      let description = input;
      
      // Remove the parsed time text from the original input
      if (result.text) {
        description = input.replace(result.text, '').trim();
      }
      
      // Clean up common alarm-related words if they're at the beginning
      const alarmWords = ['remind me', 'alarm', 'wake me up', 'set timer', 'set alarm', 'timer'];
      for (const word of alarmWords) {
        if (description.toLowerCase().startsWith(word.toLowerCase())) {
          description = description.substring(word.length).trim();
          break;
        }
      }
      
      // Remove common prepositions
      const prepositions = ['in', 'at', 'for', 'to', 'on'];
      for (const prep of prepositions) {
        if (description.toLowerCase().startsWith(prep.toLowerCase() + ' ')) {
          description = description.substring(prep.length + 1).trim();
          break;
        }
      }
      
      // If description is empty, use a default
      if (!description) {
        description = 'Reminder';
      }

      return {
        targetTime,
        originalText: input,
        description,
        isRelative,
        timeString
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing alarm time:', error);
    return null;
  }
}

// Schedule an alarm with callback
export function scheduleAlarm(
  targetTime: Date, 
  onTrigger: () => void,
  alarmId: string
): NodeJS.Timeout | undefined {
  const delay = targetTime.getTime() - Date.now();
  
  if (delay <= 0) {
    console.warn("Alarm time is in the past or invalid");
    return undefined;
  }

  const timeoutId = setTimeout(() => {
    console.log(`⏰ Alarm triggered! ID: ${alarmId}`);
    onTrigger();
  }, delay);

  return timeoutId;
}

// Play alarm sound
export function playAlarmSound(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Use the dedicated alarm sound
      const audio = new Audio('/alarmpingreminder.mp3');
      
      audio.addEventListener('canplaythrough', () => {
        audio.play()
          .then(() => {
            console.log('🔊 Alarm sound played successfully');
            resolve();
          })
          .catch((error) => {
            console.error('Error playing alarm sound:', error);
            resolve(); // Don't use fallback, just resolve
          });
      });

      audio.addEventListener('error', (error) => {
        console.error('Error loading alarm sound:', error);
        resolve(); // Don't use fallback, just resolve
      });

      // If audio fails, just resolve without playing anything
      audio.addEventListener('abort', () => {
        console.log('Audio aborted');
        resolve();
      });

    } catch (error) {
      console.error('Error creating audio element:', error);
      reject(error);
    }
  });
}

// Show browser notification (if permissions allow)
export async function showAlarmNotification(title: string, body: string): Promise<void> {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/vite.svg', // Use the existing vite icon
          badge: '/vite.svg',
          tag: 'alarm-notification',
          requireInteraction: true,
          silent: false
        });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: 'alarm-notification',
            requireInteraction: true,
            silent: false
          });
        }
      }
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Alarm manager class for handling multiple alarms
export class AlarmManager {
  private alarms: Map<string, Alarm> = new Map();
  private nextId: number = 1;
  private onAlarmTrigger?: (alarm: Alarm) => void;

  // Set callback for alarm triggers
  setAlarmTriggerCallback(callback: (alarm: Alarm) => void) {
    this.onAlarmTrigger = callback;
  }

  // Add a new alarm
  addAlarm(parsedAlarm: ParsedAlarm): string {
    const alarmId = `alarm-${this.nextId++}`;
    
    const timeoutId = scheduleAlarm(
      parsedAlarm.targetTime,
      () => this.triggerAlarm(alarmId),
      alarmId
    );

    const alarm: Alarm = {
      id: alarmId,
      targetTime: parsedAlarm.targetTime,
      originalText: parsedAlarm.originalText,
      description: parsedAlarm.description,
      isActive: true,
      timeoutId
    };

    this.alarms.set(alarmId, alarm);
    
    // Save to localStorage for persistence
    this.saveToStorage();
    
    return alarmId;
  }

  // Trigger an alarm
  private async triggerAlarm(alarmId: string): Promise<void> {
    const alarm = this.alarms.get(alarmId);
    if (!alarm || !alarm.isActive) return;

    console.log(`🚨 ALARM TRIGGERED: ${alarm.description}`);

    // Play sound
    try {
      await playAlarmSound();
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }

    // Show notification
    await showAlarmNotification(
      '⏰ Alarm',
      alarm.description
    );

    // Trigger popup callback if set
    if (this.onAlarmTrigger) {
      this.onAlarmTrigger(alarm);
    }

    // Mark alarm as inactive
    alarm.isActive = false;
    this.alarms.set(alarmId, alarm);
    this.saveToStorage();
  }

  // Cancel an alarm
  cancelAlarm(alarmId: string): boolean {
    const alarm = this.alarms.get(alarmId);
    if (!alarm) return false;

    if (alarm.timeoutId) {
      clearTimeout(alarm.timeoutId);
    }

    alarm.isActive = false;
    this.alarms.set(alarmId, alarm);
    this.saveToStorage();
    
    return true;
  }

  // Get all active alarms
  getActiveAlarms(): Alarm[] {
    return Array.from(this.alarms.values()).filter(alarm => alarm.isActive);
  }

  // Get all alarms (active and inactive)
  getAllAlarms(): Alarm[] {
    return Array.from(this.alarms.values());
  }

  // Clear all alarms
  clearAllAlarms(): void {
    this.alarms.forEach(alarm => {
      if (alarm.timeoutId) {
        clearTimeout(alarm.timeoutId);
      }
    });
    this.alarms.clear();
    this.saveToStorage();
  }

  // Save alarms to localStorage
  private saveToStorage(): void {
    try {
      const alarmsData = Array.from(this.alarms.values()).map(alarm => ({
        ...alarm,
        targetTime: alarm.targetTime.toISOString(),
        timeoutId: undefined // Don't save timeout IDs
      }));
      localStorage.setItem('alarms', JSON.stringify(alarmsData));
    } catch (error) {
      console.error('Error saving alarms to storage:', error);
    }
  }

  // Load alarms from localStorage
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('alarms');
      if (stored) {
        const alarmsData = JSON.parse(stored);
        alarmsData.forEach((alarmData: any) => {
          const alarm: Alarm = {
            ...alarmData,
            targetTime: new Date(alarmData.targetTime),
            timeoutId: undefined
          };

          // Only restore active alarms that are in the future
          if (alarm.isActive && alarm.targetTime.getTime() > Date.now()) {
            const timeoutId = scheduleAlarm(
              alarm.targetTime,
              () => this.triggerAlarm(alarm.id),
              alarm.id
            );
            alarm.timeoutId = timeoutId;
            this.alarms.set(alarm.id, alarm);
          }
        });
      }
    } catch (error) {
      console.error('Error loading alarms from storage:', error);
    }
  }
}

// Global alarm manager instance
export const alarmManager = new AlarmManager();

// Initialize alarm manager on app start
if (typeof window !== 'undefined') {
  alarmManager.loadFromStorage();
} 