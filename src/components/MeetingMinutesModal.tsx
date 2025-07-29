import React, { useState, useRef, useEffect } from 'react';

interface MeetingMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MeetingMinutesModal({ isOpen, onClose }: MeetingMinutesModalProps) {
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentStreamRef = useRef<MediaStream | null>(null);
  
  // Speech Recognition refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
      
      // Clear previous content and start speech recognition
      setMeetingContent('');
      setTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
        }
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to start recording'}`);
    }
  };

  const pauseRecording = () => {
    if (!isRecording || !mediaRecorderRef.current || !currentStreamRef.current) return;
    
    mediaRecorderRef.current.stop();
    currentStreamRef.current.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setIsPaused(true);
    
    // Stop speech recognition and clear interim transcript
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    setTranscript('');
  };

  const resumeRecording = async () => {
    if (!isPaused) return;
    
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
        } catch (error) {
          console.error('Error resuming speech recognition:', error);
        }
      }
    } catch (err) {
      console.error('Error resuming recording:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to resume recording'}`);
    }
  };

  const endRecording = () => {
    if (!isRecording && !isPaused) return;
    
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
      } catch (error) {
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
    } else {
      pauseRecording();
    }
  };

  const handleProcessMeeting = async () => {
    if (!meetingContent.trim()) return;
    
    setIsProcessing(true);
    try {
      // TODO: Implement processing logic based on selected options
      console.log('Processing meeting with options:', processingOptions);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Add actual processing logic here
    } catch (error) {
      console.error('Error processing meeting:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMeeting = () => {
    // TODO: Implement save functionality
    console.log('Saving meeting:', { meetingContent, askMeResponse });
  };

  const handleSendToAI = async () => {
    if (!meetingContent.trim()) return;
    
    setIsSendingToAI(true);
    try {
      // TODO: Implement OpenAI API call
      console.log('Sending to OpenAI:', meetingContent);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // TODO: Replace with actual API response
      setAskMeResponse('This is a simulated response from the AskMe API. In the actual implementation, this would contain the AI-generated response based on the meeting content.');
    } catch (error) {
      console.error('Error sending to OpenAI:', error);
      setAskMeResponse('Error: Failed to get response from AskMe API');
    } finally {
      setIsSendingToAI(false);
    }
  };

  const handleOptionChange = (option: keyof typeof processingOptions) => {
    setProcessingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Check for MediaRecorder support
  const isMediaRecorderSupported = typeof MediaRecorder !== 'undefined' && 
                                  navigator.mediaDevices && 
                                  navigator.mediaDevices.getUserMedia;

  // Initialize Speech Recognition
  useEffect(() => {
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
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setMeetingContent(prev => prev + finalTranscript);
          setTranscript('');
        } else {
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
        // Only restart if we're recording and not paused
        if (isRecording && !isPaused) {
          console.log('Restarting speech recognition...');
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.error('Error restarting speech recognition:', error);
            }
          }, 100); // Small delay to prevent rapid restarts
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, isPaused]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900 text-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📄</div>
            <h1 className="text-2xl font-bold">Meeting Minutes</h1>
          </div>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Meeting Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Meeting Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-300">
                  Meeting Date
                </label>
                <input
                  type="date"
                  id="meetingDate"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meetingTitle" className="block text-sm font-medium text-gray-300">
                  Meeting Title
                </label>
                <input
                  type="text"
                  id="meetingTitle"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Enter meeting title..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="meetingAgenda" className="block text-sm font-medium text-gray-300">
                Meeting Agenda
              </label>
              <textarea
                id="meetingAgenda"
                value={meetingAgenda}
                onChange={(e) => setMeetingAgenda(e.target.value)}
                placeholder="Enter meeting agenda or topics to be discussed..."
                className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Meeting Controls */}
          <div className="space-y-4">
            {!isMediaRecorderSupported && (
              <div className="bg-red-600 text-white p-4 rounded-lg">
                Error: Audio recording is not supported in this browser. Please use a modern browser with MediaRecorder support.
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={startRecording}
                disabled={isRecording || isPaused || !isMediaRecorderSupported}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isRecording || isPaused || !isMediaRecorderSupported
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                <span className="text-sm">▶️</span>
                Start
              </button>
              
              <button
                onClick={handlePauseResume}
                disabled={(!isRecording && !isPaused) || !isMediaRecorderSupported}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  (!isRecording && !isPaused) || !isMediaRecorderSupported
                    ? 'bg-gray-500 cursor-not-allowed'
                    : isPaused
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-yellow-600 hover:bg-yellow-500'
                }`}
              >
                <span className="text-sm">
                  {isPaused ? '▶️' : '⏸️'}
                </span>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <button
                onClick={endRecording}
                disabled={(!isRecording && !isPaused) || !isMediaRecorderSupported}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  (!isRecording && !isPaused) || !isMediaRecorderSupported
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                <span className="text-sm">⏹️</span>
                End
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-gray-300">
              <div className={`text-lg ${isRecording ? 'animate-pulse' : ''}`}>
                {isRecording ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                    <span className="text-white text-xs">🎤</span>
                  </div>
                ) : isPaused ? (
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🎤</span>
                  </div>
                ) : (
                  <span>🎤</span>
                )}
              </div>
              <span className={
                isRecording 
                  ? 'text-red-400 font-semibold' 
                  : isPaused 
                    ? 'text-yellow-400 font-semibold'
                    : ''
              }>
                {isRecording 
                  ? 'Recording...' 
                  : isPaused 
                    ? 'Paused' 
                    : 'Microphone'
                }
              </span>
            </div>
          </div>

          {/* Meeting Recording */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Meeting Recording</h2>
            <div className="relative">
              <textarea
                value={meetingContent + (transcript ? '\n' + transcript : '')}
                onChange={(e) => setMeetingContent(e.target.value)}
                placeholder="Meeting content will appear here as you speak..."
                className="w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
              />
              {isListening && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
              {isPaused && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Transcript */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Meeting Transcript</h2>
            <textarea
              value={meetingContent}
              onChange={(e) => setMeetingContent(e.target.value)}
              placeholder="Full meeting transcript will appear here..."
              className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Processing Options */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Processing Options</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={processingOptions.meetingNotes}
                  onChange={() => handleOptionChange('meetingNotes')}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-lg">📄</span>
                <span>Meeting Notes</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={processingOptions.meetingSummary}
                  onChange={() => handleOptionChange('meetingSummary')}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-lg">📄</span>
                <span>Meeting Summary</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={processingOptions.actionItems}
                  onChange={() => handleOptionChange('actionItems')}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-lg">📄</span>
                <span>Action Items</span>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleProcessMeeting}
                disabled={!meetingContent.trim() || isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  !meetingContent.trim() || isProcessing
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <span className="text-lg">🤖</span>
                {isProcessing ? 'Processing...' : 'Process Meeting'}
              </button>
              
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveMeeting}
                disabled={!meetingContent.trim()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  !meetingContent.trim()
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                <span className="text-lg">💾</span>
                Save Meeting
              </button>
            </div>
          </div>

          {/* AI Integration */}
          <div className="space-y-4">
            <button
              onClick={handleSendToAI}
              disabled={!meetingContent.trim() || isSendingToAI}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                !meetingContent.trim() || isSendingToAI
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {isSendingToAI ? 'Sending...' : 'Send to OpenAI (AskMe API)'}
            </button>
            
            <textarea
              value={askMeResponse}
              onChange={(e) => setAskMeResponse(e.target.value)}
              placeholder="AskMe API response will appear here..."
              className="w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 