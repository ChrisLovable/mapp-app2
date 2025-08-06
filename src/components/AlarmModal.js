import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { getAlarmTimeFromText, alarmManager } from '../lib/AlarmLogic';
export default function AlarmModal({ isOpen, onClose, currentText }) {
    const [parsedAlarm, setParsedAlarm] = useState(null);
    const [editableDescription, setEditableDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeAlarms, setActiveAlarms] = useState([]);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState('');
    const [activeAlarmCountdowns, setActiveAlarmCountdowns] = useState({});
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
        if (!isOpen || activeAlarms.length === 0)
            return;
        const updateActiveAlarmCountdowns = () => {
            const now = new Date();
            const newCountdowns = {};
            activeAlarms.forEach((alarm) => {
                const diff = alarm.targetTime.getTime() - now.getTime();
                if (diff <= 0) {
                    newCountdowns[alarm.id] = 'Time to go!';
                }
                else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    let countdownText = '';
                    if (hours > 0)
                        countdownText += `${hours}h `;
                    if (minutes > 0)
                        countdownText += `${minutes}m `;
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
        if (!parsedAlarm)
            return;
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
            if (days > 0)
                countdownText += `${days}d `;
            if (hours > 0)
                countdownText += `${hours}h `;
            if (minutes > 0)
                countdownText += `${minutes}m `;
            countdownText += `${seconds}s`;
            setCountdown(countdownText);
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [parsedAlarm]);
    const handleSetAlarm = async () => {
        if (!parsedAlarm)
            return;
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
        }
        catch (error) {
            setError('Failed to set alarm. Please try again.');
            setIsLoading(false);
        }
    };
    const handleCancelAlarm = (alarmId) => {
        alarmManager.cancelAlarm(alarmId);
        setActiveAlarms(alarmManager.getActiveAlarms());
    };
    const formatTimeUntil = (targetTime) => {
        const now = new Date();
        const diff = targetTime.getTime() - now.getTime();
        if (diff <= 0)
            return 'Now';
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        }
        else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
        else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        else {
            return 'Less than a minute';
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-blue-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl simple-double-border", style: { background: 'linear-gradient(135deg, #000000 0%, #666666 100%)', border: '4px double rgba(255, 255, 255, 0.9)' }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", children: "Set Alarm" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-blue-200", children: "Your request:" }), _jsx("div", { className: "p-3 rounded-lg bg-blue-800 border border-white text-white min-h-[60px] flex items-center", children: _jsx("span", { className: "text-lg", children: currentText || 'No text entered' }) })] }), parsedAlarm && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-blue-200", children: "Alarm will be set for:" }), _jsx("div", { className: "p-4 rounded-lg bg-green-800 border border-green-600", children: _jsxs("div", { className: "text-white text-center", children: [_jsx("div", { className: "text-3xl font-bold mb-3 text-yellow-300", children: countdown }), _jsx("div", { className: "text-2xl font-bold mb-2", children: parsedAlarm.timeString }), _jsx("div", { className: "text-green-200 text-sm mb-1", children: parsedAlarm.targetTime.toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    }) }), _jsx("div", { className: "text-green-200 text-sm", children: parsedAlarm.isRelative ? 'Relative time' : 'Absolute time' })] }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-blue-200", children: "Reminder description:" }), _jsx("textarea", { value: editableDescription, onChange: (e) => setEditableDescription(e.target.value), className: "w-full p-3 rounded-lg bg-blue-800 border border-white text-white text-lg font-medium resize-none focus:outline-none focus:border-white focus:ring-2 focus:ring-white focus:ring-opacity-50", rows: 2, placeholder: "Enter your reminder description..." })] })] })), error && (_jsx("div", { className: "p-3 bg-red-800 border border-red-600 rounded-lg", children: _jsx("p", { className: "text-red-200 text-sm", children: error }) })), !parsedAlarm && currentText.trim() && (_jsxs("div", { className: "p-3 bg-yellow-800 border border-yellow-600 rounded-lg", children: [_jsx("p", { className: "text-yellow-200 text-sm", children: "No alarm time detected in your text. Try phrases like:" }), _jsxs("ul", { className: "text-yellow-100 text-sm mt-2 list-disc list-inside space-y-1", children: [_jsx("li", { children: "\"Remind me in 2 minutes\"" }), _jsx("li", { children: "\"Wake me up at 7am\"" }), _jsx("li", { children: "\"Alarm in 30 seconds\"" }), _jsx("li", { children: "\"Set timer for 1 hour\"" })] })] })), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { onClick: onClose, className: "px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors", children: "Cancel" }), parsedAlarm && (_jsx("button", { onClick: handleSetAlarm, disabled: isLoading, className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors", style: {
                                    border: '2px solid #00fff7',
                                    boxShadow: '0 0 12px 2px #00fff7, 0 6px 20px rgba(30, 64, 175, 0.3), 0 0 30px rgba(255, 255, 255, 0.1)'
                                }, children: isLoading ? 'Setting Alarm...' : 'Set Alarm' }))] }), activeAlarms.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-blue-200", children: "Active Alarms:" }), _jsx("div", { className: "space-y-2 max-h-60 overflow-y-auto", children: activeAlarms.map((alarm) => (_jsxs("div", { className: "p-3 bg-blue-800 border border-white rounded-lg flex justify-between items-center", children: [_jsxs("div", { className: "text-white flex-1", children: [_jsx("div", { className: "font-medium text-blue-100", children: alarm.description }), _jsxs("div", { className: "text-blue-200 text-sm", children: [alarm.targetTime.toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        }), " on ", alarm.targetTime.toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })] }), _jsx("div", { className: "text-yellow-300 text-sm font-mono", children: activeAlarmCountdowns[alarm.id] || '...' })] }), _jsx("button", { onClick: () => handleCancelAlarm(alarm.id), className: "px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-sm ml-3", children: "Cancel" })] }, alarm.id))) })] }))] }) }) }));
}
