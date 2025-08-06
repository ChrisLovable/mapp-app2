import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
export default function MeetingMinutesModal({ isOpen, onClose }) {
    // State management
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [meetingContent, setMeetingContent] = useState('');
    const [askMeResponse, setAskMeResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSendingToAI, setIsSendingToAI] = useState(false);
    const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
    const [meetingTitle, setMeetingTitle] = useState('');
    const [meetingAgenda, setMeetingAgenda] = useState('');
    const [processingOptions, setProcessingOptions] = useState({
        meetingNotes: false,
        meetingSummary: false,
        actionItems: true
    });
    // MediaRecorder refs
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const currentStreamRef = useRef(null);
    // Speech Recognition refs
    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    // Recording Core Logic
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            currentStreamRef.current = stream;
            // Get supported MIME types
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : MediaRecorder.isTypeSupported('audio/mp4')
                        ? 'audio/mp4'
                        : 'audio/wav';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            recordedChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setIsPaused(false);
            // Clear previous content and initialize speech recognition
            setMeetingContent('');
            setTranscript('');
            // Initialize speech recognition only when recording starts
            if (!recognitionRef.current) {
                initializeSpeechRecognition();
            }
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                }
                catch (error) {
                    console.error('Error starting speech recognition:', error);
                }
            }
        }
        catch (err) {
            console.error('Error starting recording:', err);
            alert(`Error: ${err instanceof Error ? err.message : 'Failed to start recording'}`);
        }
    };
    const pauseRecording = () => {
        if (!isRecording || !mediaRecorderRef.current || !currentStreamRef.current)
            return;
        mediaRecorderRef.current.stop();
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsPaused(true);
        // Stop speech recognition and clear interim transcript
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            }
            catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
        setTranscript('');
    };
    const resumeRecording = async () => {
        if (!isPaused)
            return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            currentStreamRef.current = stream;
            // Get supported MIME types (same as startRecording)
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : MediaRecorder.isTypeSupported('audio/mp4')
                        ? 'audio/mp4'
                        : 'audio/wav';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setIsPaused(false);
            // Clear interim transcript and resume speech recognition
            setTranscript('');
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                }
                catch (error) {
                    console.error('Error resuming speech recognition:', error);
                }
            }
        }
        catch (err) {
            console.error('Error resuming recording:', err);
            alert(`Error: ${err instanceof Error ? err.message : 'Failed to resume recording'}`);
        }
    };
    const endRecording = () => {
        if (!isRecording && !isPaused)
            return;
        if (isRecording && mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        if (currentStreamRef.current) {
            currentStreamRef.current.getTracks().forEach(track => track.stop());
        }
        // Stop speech recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            }
            catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
        // Create blob from recorded chunks
        if (recordedChunksRef.current.length > 0) {
            // Determine the correct MIME type and file extension
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : MediaRecorder.isTypeSupported('audio/mp4')
                        ? 'audio/mp4'
                        : 'audio/wav';
            const fileExtension = mimeType.includes('webm') ? 'webm'
                : mimeType.includes('mp4') ? 'm4a'
                    : 'wav';
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            // Create download link with correct extension
            const a = document.createElement('a');
            a.href = url;
            const titlePart = meetingTitle.trim() ? meetingTitle.trim().replace(/[^a-zA-Z0-9\s-]/g, '') : 'meeting';
            const datePart = meetingDate || new Date().toISOString().split('T')[0];
            a.download = `${titlePart}-${datePart}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            // Add recording info to meeting content
            const recordingInfo = `\n\n[Recording completed: ${new Date().toLocaleString()}]`;
            setMeetingContent(prev => prev + recordingInfo);
        }
        // Reset state
        recordedChunksRef.current = [];
        setIsRecording(false);
        setIsPaused(false);
        setTranscript('');
    };
    const handlePauseResume = () => {
        if (isPaused) {
            resumeRecording();
        }
        else {
            pauseRecording();
        }
    };
    const handleProcessMeeting = async () => {
        if (!meetingContent.trim())
            return;
        setIsProcessing(true);
        try {
            // TODO: Implement processing logic based on selected options
            console.log('Processing meeting with options:', processingOptions);
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            // TODO: Add actual processing logic here
        }
        catch (error) {
            console.error('Error processing meeting:', error);
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleSaveMeeting = () => {
        // TODO: Implement save functionality
        console.log('Saving meeting:', { meetingContent, askMeResponse });
    };
    const handleSendToAI = async () => {
        if (!meetingContent.trim())
            return;
        setIsSendingToAI(true);
        try {
            // TODO: Implement OpenAI API call
            console.log('Sending to OpenAI:', meetingContent);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 3000));
            // TODO: Replace with actual API response
            setAskMeResponse('This is a simulated response from the AskMe API. In the actual implementation, this would contain the AI-generated response based on the meeting content.');
        }
        catch (error) {
            console.error('Error sending to OpenAI:', error);
            setAskMeResponse('Error: Failed to get response from AskMe API');
        }
        finally {
            setIsSendingToAI(false);
        }
    };
    const handleOptionChange = (option) => {
        setProcessingOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };
    // Check for MediaRecorder support
    const isMediaRecorderSupported = typeof MediaRecorder !== 'undefined' &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia;
    // Initialize Speech Recognition - REMOVED AUTOMATIC INITIALIZATION
    // Speech recognition will now only be initialized when user starts recording
    const initializeSpeechRecognition = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onstart = () => {
                setIsListening(true);
                console.log('Speech recognition started');
            };
            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    }
                    else {
                        interimTranscript += transcript;
                    }
                }
                if (finalTranscript) {
                    setMeetingContent(prev => prev + finalTranscript);
                    setTranscript('');
                }
                else {
                    setTranscript(interimTranscript);
                }
            };
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                // Only stop recording if it's a fatal error, not just a pause
                if (event.error === 'no-speech' || event.error === 'audio-capture') {
                    // These are recoverable errors, don't stop recording
                    return;
                }
                if (!isPaused) {
                    setIsRecording(false);
                }
            };
            recognition.onend = () => {
                setIsListening(false);
            };
        }
    };
    // Effect to initialize speech recognition when recording starts
    useEffect(() => {
        if (isRecording && !recognitionRef.current) {
            initializeSpeechRecognition();
        }
    }, [isRecording]);
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-blue-900 text-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col", children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                        transform: 'translateZ(5px)'
                    }, children: [_jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx("div", { className: "text-2xl", style: {
                                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                                        textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                                        transform: 'translateZ(3px)'
                                    }, children: "\uD83D\uDCC4" }), _jsx("h1", { className: "text-white font-bold text-base text-center", style: {
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                        transform: 'translateZ(3px)'
                                    }, children: "Meeting Minutes" })] }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Meeting Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "meetingDate", className: "block text-sm font-medium text-gray-300", children: "Meeting Date" }), _jsx("input", { type: "date", id: "meetingDate", value: meetingDate, onChange: (e) => setMeetingDate(e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-white" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "meetingTitle", className: "block text-sm font-medium text-gray-300", children: "Meeting Title" }), _jsx("input", { type: "text", id: "meetingTitle", value: meetingTitle, onChange: (e) => setMeetingTitle(e.target.value), placeholder: "Enter meeting title...", className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "meetingAgenda", className: "block text-sm font-medium text-gray-300", children: "Meeting Agenda" }), _jsx("textarea", { id: "meetingAgenda", value: meetingAgenda, onChange: (e) => setMeetingAgenda(e.target.value), placeholder: "Enter meeting agenda or topics to be discussed...", className: "w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-white" })] })] }), _jsxs("div", { className: "space-y-4", children: [!isMediaRecorderSupported && (_jsx("div", { className: "bg-red-600 text-white p-4 rounded-lg", children: "Error: Audio recording is not supported in this browser. Please use a modern browser with MediaRecorder support." })), _jsxs("div", { className: "flex flex-wrap gap-2 justify-center", children: [_jsxs("button", { onClick: startRecording, disabled: isRecording || isPaused || !isMediaRecorderSupported, className: `flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${isRecording || isPaused || !isMediaRecorderSupported
                                                ? 'bg-gray-500 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-500'}`, children: [_jsx("span", { className: "text-sm", children: "\u25B6\uFE0F" }), "Start"] }), _jsxs("button", { onClick: handlePauseResume, disabled: (!isRecording && !isPaused) || !isMediaRecorderSupported, className: `flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${(!isRecording && !isPaused) || !isMediaRecorderSupported
                                                ? 'bg-gray-500 cursor-not-allowed'
                                                : isPaused
                                                    ? 'bg-green-600 hover:bg-green-500'
                                                    : 'bg-yellow-600 hover:bg-yellow-500'}`, children: [_jsx("span", { className: "text-sm", children: isPaused ? '▶️' : '⏸️' }), isPaused ? 'Resume' : 'Pause'] }), _jsxs("button", { onClick: endRecording, disabled: (!isRecording && !isPaused) || !isMediaRecorderSupported, className: `flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${(!isRecording && !isPaused) || !isMediaRecorderSupported
                                                ? 'bg-gray-500 cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-500'}`, children: [_jsx("span", { className: "text-sm", children: "\u23F9\uFE0F" }), "End"] })] }), _jsxs("div", { className: "flex items-center gap-2 text-gray-300", children: [_jsx("div", { className: `text-lg ${isRecording ? 'animate-pulse' : ''}`, children: isRecording ? (_jsx("div", { className: "w-6 h-6 bg-red-500 rounded-full animate-pulse flex items-center justify-center", children: _jsx("span", { className: "text-white text-xs", children: "\uD83C\uDFA4" }) })) : isPaused ? (_jsx("div", { className: "w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white text-xs", children: "\uD83C\uDFA4" }) })) : (_jsx("span", { children: "\uD83C\uDFA4" })) }), _jsx("span", { className: isRecording
                                                ? 'text-red-400 font-semibold'
                                                : isPaused
                                                    ? 'text-yellow-400 font-semibold'
                                                    : '', children: isRecording
                                                ? 'Recording...'
                                                : isPaused
                                                    ? 'Paused'
                                                    : 'Microphone' })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Meeting Recording" }), _jsxs("div", { className: "relative", children: [_jsx("textarea", { value: meetingContent + (transcript ? '\n' + transcript : ''), onChange: (e) => setMeetingContent(e.target.value), placeholder: "Meeting content will appear here as you speak...", className: "w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-white" }), isListening && (_jsx("div", { className: "absolute top-2 right-2", children: _jsx("div", { className: "w-3 h-3 bg-red-500 rounded-full animate-pulse" }) })), isPaused && (_jsx("div", { className: "absolute top-2 right-2", children: _jsx("div", { className: "w-3 h-3 bg-yellow-500 rounded-full" }) }))] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Meeting Transcript" }), _jsx("textarea", { value: meetingContent, onChange: (e) => setMeetingContent(e.target.value), placeholder: "Full meeting transcript will appear here...", className: "w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-white" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Processing Options" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: processingOptions.meetingNotes, onChange: () => handleOptionChange('meetingNotes'), className: "w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-lg", children: "\uD83D\uDCC4" }), _jsx("span", { children: "Meeting Notes" })] }), _jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: processingOptions.meetingSummary, onChange: () => handleOptionChange('meetingSummary'), className: "w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-lg", children: "\uD83D\uDCC4" }), _jsx("span", { children: "Meeting Summary" })] }), _jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: processingOptions.actionItems, onChange: () => handleOptionChange('actionItems'), className: "w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" }), _jsx("span", { className: "text-lg", children: "\uD83D\uDCC4" }), _jsx("span", { children: "Action Items" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: handleProcessMeeting, disabled: !meetingContent.trim() || isProcessing, className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!meetingContent.trim() || isProcessing
                                                ? 'bg-gray-500 cursor-not-allowed'
                                                : 'bg-gray-600 hover:bg-gray-500'}`, children: [_jsx("span", { className: "text-lg", children: "\uD83E\uDD16" }), isProcessing ? 'Processing...' : 'Process Meeting'] }), _jsx("button", { onClick: onClose, className: "px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors", children: "Cancel" }), _jsxs("button", { onClick: handleSaveMeeting, disabled: !meetingContent.trim(), className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${!meetingContent.trim()
                                                ? 'bg-gray-500 cursor-not-allowed'
                                                : 'bg-gray-600 hover:bg-gray-500'}`, children: [_jsx("span", { className: "text-lg", children: "\uD83D\uDCBE" }), "Save Meeting"] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("button", { onClick: handleSendToAI, disabled: !meetingContent.trim() || isSendingToAI, className: `w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${!meetingContent.trim() || isSendingToAI
                                        ? 'bg-gray-500 cursor-not-allowed'
                                        : 'bg-gray-600 hover:bg-gray-500'}`, children: isSendingToAI ? 'Sending...' : 'Send to OpenAI (AskMe API)' }), _jsx("textarea", { value: askMeResponse, onChange: (e) => setAskMeResponse(e.target.value), placeholder: "AskMe API response will appear here...", className: "w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-white" })] })] })] }) }));
}
