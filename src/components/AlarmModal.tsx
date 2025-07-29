import React, { useState, useEffect } from 'react';
import { getAlarmTimeFromText, alarmManager, type Alarm } from '../lib/AlarmLogic';

interface AlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
}

export default function AlarmModal({ isOpen, onClose, currentText }: AlarmModalProps) {
  const [parsedAlarm, setParsedAlarm] = useState<ReturnType<typeof getAlarmTimeFromText>>(null);
  const [editableDescription, setEditableDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([]);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');
  const [activeAlarmCountdowns, setActiveAlarmCountdowns] = useState<Record<string, string>>({});

  // Parse alarm time when modal opens or text changes
  useEffect(() => {
    if (isOpen && currentText.trim()) {
      const parsed = getAlarmTimeFromText(currentText);
      setParsedAlarm(parsed);
      if (parsed) {
        setEditableDescription(parsed.description);
      }
      setError('');
    }
  }, [isOpen, currentText]);

  // Load active alarms
  useEffect(() => {
    if (isOpen) {
      setActiveAlarms(alarmManager.getActiveAlarms());
    }
  }, [isOpen]);

  // Active alarms countdown timer effect
  useEffect(() => {
    if (!isOpen || activeAlarms.length === 0) return;

    const updateActiveAlarmCountdowns = () => {
      const now = new Date();
      const newCountdowns: Record<string, string> = {};

      activeAlarms.forEach((alarm) => {
        const diff = alarm.targetTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          newCountdowns[alarm.id] = 'Time to go!';
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          let countdownText = '';
          if (hours > 0) countdownText += `${hours}h `;
          if (minutes > 0) countdownText += `${minutes}m `;
          countdownText += `${seconds}s`;

          newCountdowns[alarm.id] = countdownText;
        }
      });

      setActiveAlarmCountdowns(newCountdowns);
    };

    updateActiveAlarmCountdowns();
    const interval = setInterval(updateActiveAlarmCountdowns, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeAlarms]);

  // Countdown timer effect
  useEffect(() => {
    if (!parsedAlarm) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = parsedAlarm.targetTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('Time to go!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let countdownText = '';
      if (days > 0) countdownText += `${days}d `;
      if (hours > 0) countdownText += `${hours}h `;
      if (minutes > 0) countdownText += `${minutes}m `;
      countdownText += `${seconds}s`;

      setCountdown(countdownText);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [parsedAlarm]);

  const handleSetAlarm = async () => {
    if (!parsedAlarm) return;

    setIsLoading(true);
    setError('');

    try {
      // Create a modified parsed alarm with the edited description
      const modifiedParsedAlarm = {
        ...parsedAlarm,
        description: editableDescription.trim() || 'Reminder'
      };

      const alarmId = alarmManager.addAlarm(modifiedParsedAlarm);
      console.log(`Alarm set successfully! ID: ${alarmId}`);
      
      // Refresh active alarms list
      setActiveAlarms(alarmManager.getActiveAlarms());
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      setError('Failed to set alarm. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancelAlarm = (alarmId: string) => {
    alarmManager.cancelAlarm(alarmId);
    setActiveAlarms(alarmManager.getActiveAlarms());
  };

  const formatTimeUntil = (targetTime: Date): string => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Now';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Less than a minute';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Set Alarm</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>
          {/* Input Text Display */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">Your request:</label>
            <div className="p-3 rounded-lg bg-blue-800 border border-blue-600 text-white min-h-[60px] flex items-center">
              <span className="text-lg">{currentText || 'No text entered'}</span>
            </div>
          </div>

          {/* Parsed Alarm Display */}
          {parsedAlarm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-200">Alarm will be set for:</label>
                <div className="p-4 rounded-lg bg-green-800 border border-green-600">
                  <div className="text-white text-center">
                    {/* Countdown Timer */}
                    <div className="text-3xl font-bold mb-3 text-yellow-300">
                      {countdown}
                    </div>
                    
                    {/* Time */}
                    <div className="text-2xl font-bold mb-2">{parsedAlarm.timeString}</div>
                    
                    {/* Date */}
                    <div className="text-green-200 text-sm mb-1">
                      {parsedAlarm.targetTime.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    
                    {/* Type */}
                    <div className="text-green-200 text-sm">
                      {parsedAlarm.isRelative ? 'Relative time' : 'Absolute time'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Display */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-blue-200">Reminder description:</label>
                <textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  className="w-full p-3 rounded-lg bg-blue-800 border border-blue-600 text-white text-lg font-medium resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                  rows={2}
                  placeholder="Enter your reminder description..."
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-800 border border-red-600 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* No Alarm Detected */}
          {!parsedAlarm && currentText.trim() && (
            <div className="p-3 bg-yellow-800 border border-yellow-600 rounded-lg">
              <p className="text-yellow-200 text-sm">
                No alarm time detected in your text. Try phrases like:
              </p>
              <ul className="text-yellow-100 text-sm mt-2 list-disc list-inside space-y-1">
                <li>"Remind me in 2 minutes"</li>
                <li>"Wake me up at 7am"</li>
                <li>"Alarm in 30 seconds"</li>
                <li>"Set timer for 1 hour"</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            {parsedAlarm && (
              <button
                onClick={handleSetAlarm}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                style={{
                  border: '2px solid #00fff7',
                  boxShadow: '0 0 12px 2px #00fff7, 0 6px 20px rgba(30, 64, 175, 0.3), 0 0 30px rgba(255, 255, 255, 0.1)'
                }}
              >
                {isLoading ? 'Setting Alarm...' : 'Set Alarm'}
              </button>
            )}
          </div>

          {/* Active Alarms List */}
          {activeAlarms.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-200">Active Alarms:</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeAlarms.map((alarm) => (
                  <div key={alarm.id} className="p-3 bg-blue-800 border border-blue-600 rounded-lg flex justify-between items-center">
                    <div className="text-white flex-1">
                      <div className="font-medium text-blue-100">{alarm.description}</div>
                      <div className="text-blue-200 text-sm">
                        {alarm.targetTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })} on {alarm.targetTime.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-yellow-300 text-sm font-mono">
                        {activeAlarmCountdowns[alarm.id] || '...'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelAlarm(alarm.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-sm ml-3"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 