import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
const VoiceTranscript = ({ isVisible, onToggleVisibility, userTranscript, gabbyTranscript, isListening, isSpeaking }) => {
    const [transcriptHistory, setTranscriptHistory] = useState([]);
    const scrollRef = useRef(null);
    // Auto-scroll to bottom when new content is added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcriptHistory, userTranscript, gabbyTranscript]);
    // Update transcript history when new speech is detected
    useEffect(() => {
        if (userTranscript && userTranscript.trim()) {
            const newEntry = {
                id: Date.now().toString(),
                speaker: 'user',
                text: userTranscript,
                timestamp: new Date(),
                isFinal: !isListening // Final when not actively listening
            };
            setTranscriptHistory(prev => {
                // Update the last user entry if it's not final, otherwise add new entry
                const lastEntry = prev[prev.length - 1];
                if (lastEntry && lastEntry.speaker === 'user' && !lastEntry.isFinal) {
                    return [...prev.slice(0, -1), { ...lastEntry, text: userTranscript }];
                }
                else {
                    return [...prev, newEntry];
                }
            });
        }
    }, [userTranscript, isListening]);
    useEffect(() => {
        if (gabbyTranscript && gabbyTranscript.trim()) {
            const newEntry = {
                id: Date.now().toString(),
                speaker: 'gabby',
                text: gabbyTranscript,
                timestamp: new Date(),
                isFinal: !isSpeaking // Final when not actively speaking
            };
            setTranscriptHistory(prev => {
                // Update the last gabby entry if it's not final, otherwise add new entry
                const lastEntry = prev[prev.length - 1];
                if (lastEntry && lastEntry.speaker === 'gabby' && !lastEntry.isFinal) {
                    return [...prev.slice(0, -1), { ...lastEntry, text: gabbyTranscript }];
                }
                else {
                    return [...prev, newEntry];
                }
            });
        }
    }, [gabbyTranscript, isSpeaking]);
    // Clear transcript history
    const clearTranscript = () => {
        setTranscriptHistory([]);
    };
    if (!isVisible) {
        return (_jsx("button", { onClick: onToggleVisibility, style: {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 9996,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
            }, title: "Show Voice Transcript", children: "\uD83D\uDCDD" }));
    }
    return (_jsxs("div", { style: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '400px',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #333',
            borderRadius: '12px',
            zIndex: 9996,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #333',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px 10px 0 0'
                }, children: [_jsx("div", { style: { color: '#fff', fontWeight: 'bold', fontSize: '14px' }, children: "Voice Transcript" }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: clearTranscript, style: {
                                    backgroundColor: 'rgba(255, 107, 107, 0.8)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }, title: "Clear Transcript", children: "Clear" }), _jsx("button", { onClick: onToggleVisibility, style: {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }, title: "Hide Transcript", children: "\u2715" })] })] }), _jsx("div", { ref: scrollRef, style: {
                    flex: 1,
                    padding: '12px',
                    overflowY: 'auto',
                    fontSize: '12px',
                    lineHeight: '1.4'
                }, children: transcriptHistory.length === 0 ? (_jsxs("div", { style: { color: '#888', textAlign: 'center', marginTop: '50px' }, children: ["No conversation yet...", _jsx("br", {}), _jsx("small", { children: "Start talking to see the transcript here" })] })) : (transcriptHistory.map((entry) => (_jsxs("div", { style: {
                        marginBottom: '12px',
                        opacity: entry.isFinal ? 1 : 0.7
                    }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: '4px',
                                gap: '6px'
                            }, children: [_jsx("div", { style: {
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: entry.speaker === 'user' ? '#4a90e2' : '#50c878',
                                        flexShrink: 0
                                    } }), _jsx("span", { style: {
                                        color: entry.speaker === 'user' ? '#4a90e2' : '#50c878',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        textTransform: 'uppercase'
                                    }, children: entry.speaker === 'user' ? '👤 You' : '🤖 Gabby' }), _jsx("span", { style: {
                                        color: '#666',
                                        fontSize: '10px',
                                        marginLeft: 'auto'
                                    }, children: entry.timestamp.toLocaleTimeString() })] }), _jsxs("div", { style: {
                                backgroundColor: entry.speaker === 'user'
                                    ? 'rgba(74, 144, 226, 0.2)'
                                    : 'rgba(80, 200, 120, 0.2)',
                                border: `1px solid ${entry.speaker === 'user' ? '#4a90e2' : '#50c878'}`,
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                wordWrap: 'break-word'
                            }, children: [entry.text, !entry.isFinal && (_jsx("span", { style: { color: '#888', marginLeft: '4px' }, children: "..." }))] })] }, entry.id)))) }), _jsxs("div", { style: {
                    padding: '8px 12px',
                    borderTop: '1px solid #333',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '0 0 10px 10px',
                    fontSize: '10px',
                    color: '#888',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }, children: [_jsxs("div", { children: [isListening && _jsx("span", { style: { color: '#ff6b6b' }, children: "\uD83C\uDFA4 Listening..." }), isSpeaking && _jsx("span", { style: { color: '#4ecdc4' }, children: "\uD83D\uDD0A Speaking..." }), !isListening && !isSpeaking && _jsx("span", { children: "Ready" })] }), _jsxs("div", { children: [transcriptHistory.length, " messages"] })] })] }));
};
export default VoiceTranscript;
