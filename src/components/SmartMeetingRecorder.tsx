import React, { useState, useRef, useEffect } from 'react';
import CustomDatePicker from './CustomDatePicker';
import Select from 'react-select';
import { supabase } from '../lib/supabase';

interface SmartMeetingRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartMeetingRecorder: React.FC<SmartMeetingRecorderProps> = ({ isOpen, onClose }) => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [meetingRecording, setMeetingRecording] = useState('');
  const [meetingMinutes, setMeetingMinutes] = useState('');
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const [showMeetingJournal, setShowMeetingJournal] = useState(false);
  const [savedMeetings, setSavedMeetings] = useState<any[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingMinutes, setIsCreatingMinutes] = useState(false);
  const [meetingDate, setMeetingDate] = useState(new Date());
  const [meetingName, setMeetingName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [confidence, setConfidence] = useState<number>(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'clear' | 'close' | 'language';
    callback: () => void;
    message: string;
  } | null>(null);

  // Refs for speech recognition
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastTranscriptRef = useRef('');
  const shouldContinueRef = useRef<boolean>(false);
  
  // Ref to track current state values for onend handler
  const stateRef = useRef({
    isResuming: false,
    isRecording: false,
    isPaused: false,
    fallbackTimeout: null as NodeJS.Timeout | null
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Speech Recognition Support Check
  const isSpeechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Initialize speech recognition only when needed
  const initializeSpeechRecognition = () => {
    if (isSpeechRecognitionSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      
      console.log('Speech recognition initialized with language:', selectedLanguage);

      recognition.onstart = () => {
        setError(null);
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result received:', event.results.length, 'results');
        let finalTranscript = '';
        let currentInterimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          console.log('Result:', transcript, 'isFinal:', result.isFinal, 'confidence:', confidence);
          
          if (result.isFinal) {
            // Only append the new part of the transcript
            const newPart = transcript.replace(lastTranscriptRef.current, '');
            finalTranscript += newPart + ' ';
            lastTranscriptRef.current = transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
          } else {
            currentInterimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log('Adding final transcript:', finalTranscript);
          setTranscript(prev => prev + finalTranscript);
          setMeetingRecording(prev => prev + finalTranscript);
          setInterimTranscript('');
          setConfidence(maxConfidence);
        } else {
          console.log('Setting interim transcript:', currentInterimTranscript);
          setInterimTranscript(currentInterimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        setIsPaused(false);
      };

      recognition.onend = () => {
        // Auto-restart if we are supposed to continue recording
        if (shouldContinueRef.current && !stateRef.current.isPaused) {
          try {
            recognition.start();
            setIsRecording(true);
            return;
          } catch (err) {
            console.error('Auto-restart failed:', err);
          }
        }
        setIsRecording(false);
        setIsPaused(false);
      };
    }
  };

  // startRecording function
  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      setError(null);
      setInterimTranscript('');
      setConfidence(0);
      lastTranscriptRef.current = '';
      
      // Clear previous content
      setTranscript('');
      setMeetingRecording('');
      
      // Initialize speech recognition only when recording starts
      if (!recognitionRef.current) {
        console.log('Initializing speech recognition...');
        initializeSpeechRecognition();
      }
      
      if (recognitionRef.current) {
        try {
          console.log('Starting speech recognition...');
          shouldContinueRef.current = true;
          recognitionRef.current.start();
          setIsRecording(true);
          setIsPaused(false);
          stateRef.current = { ...stateRef.current, isRecording: true, isPaused: false, fallbackTimeout: null };
          console.log('Recording started successfully');
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          throw new Error('Failed to start speech recognition');
        }
      } else {
        throw new Error('Speech recognition not available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start transcription';
      setError(errorMessage);
      console.error('Error starting transcription:', err);
    }
  };

  const continueRecording = async () => {
    try {
      setError(null);
      setInterimTranscript('');
      setConfidence(0);
      
      // Don't clear previous content - continue from where we left off
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
          setIsPaused(false);
          stateRef.current = { ...stateRef.current, isRecording: true, isPaused: false, fallbackTimeout: null };
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          throw new Error('Failed to start speech recognition');
        }
      } else {
        throw new Error('Speech recognition not available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start transcription';
      setError(errorMessage);
      console.error('Error starting transcription:', err);
    }
  };

  const pauseRecording = () => {
    if (!isRecording || !recognitionRef.current) return;
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    
    setIsRecording(false);
    setIsPaused(true);
    stateRef.current = { ...stateRef.current, isRecording: false, isPaused: true, fallbackTimeout: null };
  };

  const resumeRecording = async () => {
    if (!isPaused) return;

    try {
      if (recognitionRef.current) {
        setIsResuming(true);
        stateRef.current = { ...stateRef.current, isResuming: true };

        recognitionRef.current.stop();

        // ⏱ Fallback: restart if onend doesn't fire
        const fallbackTimeout = setTimeout(() => {
          if (stateRef.current.isResuming && recognitionRef.current) {
            setIsResuming(false);
            setIsRecording(true);
            setIsPaused(false);
            stateRef.current = { ...stateRef.current, isResuming: false, isRecording: true, isPaused: false, fallbackTimeout: null };
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error('Resume fallback failed to start recognition:', error);
              setError('Resume fallback failed. Please try again.');
              setIsRecording(false);
              stateRef.current = { ...stateRef.current, isRecording: false, fallbackTimeout: null };
            }
          }
        }, 1000); // 1 second

        // Store the timeout ID so onend can clear it
        stateRef.current.fallbackTimeout = fallbackTimeout;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resume transcription';
      setError(errorMessage);
      console.error('Error resuming transcription:', err);
      setIsResuming(false);
      stateRef.current = { ...stateRef.current, isResuming: false, fallbackTimeout: null };
    }
  };

  const endRecording = () => {
    if (!isRecording && !isPaused) return;
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        shouldContinueRef.current = false;
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    
    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setInterimTranscript('');
    setConfidence(0);
    stateRef.current = { ...stateRef.current, isRecording: false, isPaused: false, fallbackTimeout: null };
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleClose = () => {
    // Stop any ongoing recording
    if (isRecording || isPaused) {
      endRecording();
    }
    
    onClose();
  };

  const handleSaveTranscript = () => {
    if (!transcript.trim()) {
      setError('No transcript to save');
      return;
    }

    try {
      const namePart = meetingName.trim() ? meetingName.trim().replace(/[^a-zA-Z0-9\s-]/g, '') : 'meeting';
      const datePart = meetingDate instanceof Date ? `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}` : new Date().toISOString().split('T')[0];
      const filename = `${namePart}-${datePart}-transcript.txt`;
      
      const blob = new Blob([transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to save transcript');
      console.error('Error saving transcript:', error);
    }
  };

  const handleClearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setConfidence(0);
  };

  const handleCreateMinutes = async () => {
    if (!transcript.trim()) {
      setError('No transcript available to create minutes from.');
      return;
    }

    setIsCreatingMinutes(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env file.');
      }

      const prompt = `CREATE THE MINUTES FOR THIS MEETING. IT SHOULD HAVE A 100 WORDS OR LESS SUMMARY, IT SHOULD HAVE THE ACTION ITEMS LISTED AND IT SHOULD INCLUDE THE DETAILED MINUTES.

Meeting Transcript:
${transcript}

Please format the response with clear subheadings for:
1. SUMMARY (100 words or less)
2. ACTION ITEMS
3. DETAILED MINUTES`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional meeting minutes assistant. Create clear, well-structured meeting minutes with proper formatting and subheadings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const minutes = data.choices[0]?.message?.content;

      if (!minutes) {
        throw new Error('No response received from OpenAI');
      }

      // Set the minutes in the additional notes text box
      setAdditionalNotes(minutes);

    } catch (error) {
      console.error('Error creating minutes:', error);
      setError(`Failed to create minutes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingMinutes(false);
    }
  };

  // Save meeting data to database
  const saveToDatabase = async () => {
    if (!meetingRecording.trim()) {
      setError('No meeting recording to save');
      return;
    }

    setIsSavingToDatabase(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('meeting_recordings')
        .insert([
          {
            meeting_agenda: meetingAgenda || 'Meeting Recording',
            meeting_transcript: meetingRecording,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (data) {
        console.log('Meeting saved to database:', data);
        // Optionally show success message or clear form
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save meeting to database';
      setError(errorMessage);
      console.error('Error saving to database:', err);
    } finally {
      setIsSavingToDatabase(false);
    }
  };

  // Open meeting journal and load saved meetings
  const openMeetingJournal = async () => {
    setShowMeetingJournal(true);
    setIsLoadingMeetings(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('meeting_recordings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (data) {
        setSavedMeetings(data);
        console.log('Loaded meetings:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load meetings';
      setError(errorMessage);
      console.error('Error loading meetings:', err);
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    const changeLanguage = () => {
      setSelectedLanguage(newLanguage);
      // If currently recording, restart with new language
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.lang = newLanguage;
            recognitionRef.current.start();
          }
        }, 100);
      }
    };

    safeExecute(changeLanguage, 'language', 'Changing language will clear the current transcript. Continue?');
  };

  // Available languages for speech recognition
  const availableLanguages = [
    { code: 'en-US', name: 'English' },
    { code: 'af-ZA', name: 'Afrikaans' }
  ];

  // Safety check function
  const hasExistingText = () => {
    return transcript.trim().length > 0;
  };

  // Safe action execution with confirmation
  const safeExecute = (action: () => void, type: 'start' | 'clear' | 'close' | 'language', message: string) => {
    if (hasExistingText()) {
      setConfirmAction({ type, callback: action, message: 'You have existing recording content. What would you like to do?' });
      setShowConfirmDialog(true);
    } else {
      action();
    }
  };

  // Handle confirmation - Yes (clear contents and start new)
  const handleConfirm = () => {
    if (confirmAction) {
      // Clear contents and start new recording
      setTranscript('');
      setMeetingRecording('');
      confirmAction.callback();
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Handle continue - Continue recording from where it left off
  const handleContinue = () => {
    // Continue recording without clearing contents
    continueRecording();
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  // Create meeting minutes using OpenAI
  const createMinutes = async () => {
    if (!meetingRecording.trim()) {
      setError('No recording content to generate minutes from');
      return;
    }

    setIsGeneratingMinutes(true);
    setError(null);

    try {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const prompt = `Please create detailed meeting minutes from the following meeting recording. Include:

1. Meeting Title (suggest a professional title based on the content)
2. Date: ${currentDate}
3. Key Points Discussed
4. Action Items
5. Decisions Made
6. Next Steps
7. Attendees (if mentioned)

Meeting Recording:
${meetingRecording}

Please format the minutes in a clear, professional structure with proper headings and bullet points.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a professional meeting minutes writer. Create clear, structured, and comprehensive meeting minutes from the provided recording content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedMinutes = data.choices[0]?.message?.content;
      
      if (generatedMinutes) {
        setMeetingMinutes(generatedMinutes);
      } else {
        throw new Error('No response content from OpenAI');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate meeting minutes';
      setError(errorMessage);
      console.error('Error generating meeting minutes:', err);
    } finally {
      setIsGeneratingMinutes(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div
        ref={containerRef}
        className="rounded-2xl p-4 w-full max-h-[90vh] flex flex-col"
        style={{ 
          border: '2px solid white', 
          boxSizing: 'border-box', 
          background: '#000000',
          width: '85vw',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
            filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
            transform: 'translateZ(5px)'
          }}
        >
          <h2 
            className="text-white font-bold text-base text-center"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
              transform: 'translateZ(3px)'
            }}
          >
            Smart Meeting Recorder
          </h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
            style={{ background: '#000000', fontSize: '15px', border: '1px solid #666666' }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        {/* Meeting Journal Button */}
        <div className="px-4 mb-4 flex justify-start">
          <button
            onClick={openMeetingJournal}
            className={`w-1/2 ml-0 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-xs`}
            style={{ background: '#111', border: '1px solid #666666' }}
          >
            Meeting Journal
          </button>
        </div>
        
        <div className="px-1 pb-1 flex flex-col gap-4 overflow-y-auto flex-1">
          {/* Meeting Information */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2 w-full">
                <div className="flex-1">
                  <label className="text-xs text-white mb-2 block">Meeting Date</label>
                  <CustomDatePicker
                    value={meetingDate}
                    onChange={setMeetingDate}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white block">Language</label>
                  <Select
                    className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs"
                    value={availableLanguages.find(opt => opt.code === selectedLanguage) || null}
                    onChange={(option) => option && handleLanguageChange(option.code)}
                    options={availableLanguages}
                    getOptionLabel={opt => opt.name}
                    getOptionValue={opt => opt.code}
                    placeholder="Select language..."
                    isClearable={false}
                    isSearchable={false}
                    components={{
                      DropdownIndicator: (props) => (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          height: '100%',
                          paddingRight: 10,
                          color: '#fff',
                          opacity: 0.8,
                          fontSize: '1.2rem',
                        }}>
                          ▼
                        </div>
                      )
                    }}
                    styles={{
                      container: (base) => ({ ...base, width: '120px', zIndex: 20 }),
                      control: (base, state) => ({
                        ...base,
                        borderRadius: 16,
                        border: '1px solid white',
                        background: 'transparent',
                        color: '#fff',
                        boxShadow: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        minHeight: 44,
                        transition: 'border 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                      }),
                      menu: (base) => ({
                        ...base,
                        background: '#181a1b',
                        borderRadius: 12,
                        marginTop: 2,
                        zIndex: 9999,
                        boxShadow: '0 4px 24px 0 #2563eb99',
                        color: '#fff',
                        position: 'absolute',
                        left: '-50px',
                        minWidth: '200px',
                      }),
                      option: (base, state) => ({
                        ...base,
                        background: state.isSelected ? '#2563eb' : state.isFocused ? '#374151' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        fontSize: '0.8rem',
                        fontWeight: state.isSelected ? 'bold' : 'normal',
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#fff',
                        fontWeight: 'bold',
                      }),
                      input: (base) => ({
                        ...base,
                        color: '#fff',
                        fontWeight: 'bold',
                      }),
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-white mb-2 block text-left">Meeting name</label>
                <textarea
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="Enter meeting agenda..."
                  className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border-2 border-white resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => safeExecute(startRecording, 'start', 'Start recording')}
                disabled={isRecording || isPaused || !isSpeechRecognitionSupported}
                className={`flex-1 px-3 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  isRecording ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: isRecording ? '#dc2626' : '#111', border: '1px solid #666666' }}
              >
                {isRecording ? 'Recording...' : 'Start'}
              </button>
              
              <button
                onClick={handlePauseResume}
                disabled={!isRecording && !isPaused}
                className={`flex-1 px-3 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  !isRecording && !isPaused ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111', border: '1px solid #666666' }}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <button
                onClick={endRecording}
                disabled={!isRecording && !isPaused}
                className={`flex-1 px-3 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  !isRecording && !isPaused ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111', border: '1px solid #666666' }}
              >
                Stop
              </button>
            </div>
          </div>

          {/* Meeting Recording */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white mb-2 block">Meeting Recording</label>
              <textarea
                value={meetingRecording + (interimTranscript ? ' ' + interimTranscript : '')}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Remove the interim transcript from the new value
                  const baseValue = interimTranscript ? newValue.replace(interimTranscript, '').trim() : newValue;
                  setMeetingRecording(baseValue);
                }}
                placeholder="Recording will appear here..."
                className="w-full px-3 py-2 rounded-xl bg-black text-white text-xs border-2 border-white resize-none"
                rows={8}
                readOnly={isRecording}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={handleCreateMinutes}
                disabled={!meetingRecording.trim() || isGeneratingMinutes}
                className={`flex-1 px-4 py-4 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-xs ${
                  !meetingRecording.trim() || isGeneratingMinutes ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111', border: '1px solid #666666' }}
              >
                {isGeneratingMinutes ? 'Generating...' : 'Create Minutes'}
              </button>
              
              <button
                onClick={saveToDatabase}
                disabled={!meetingRecording.trim() || isSavingToDatabase}
                className={`flex-1 px-4 py-4 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-xs ${
                  !meetingRecording.trim() || isSavingToDatabase ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111', border: '1px solid #666666' }}
              >
                {isSavingToDatabase ? 'Saving...' : 'Save to Database'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-3 rounded-xl border border-red-500">
              {error}
            </div>
          )}

          {/* Meeting Minutes Display */}
          {meetingMinutes && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Generated Meeting Minutes</h3>
              <div className="bg-black bg-opacity-50 p-4 rounded-xl border border-white max-h-64 overflow-y-auto">
                <pre className="text-white text-xs whitespace-pre-wrap">{meetingMinutes}</pre>
              </div>
              <div className="flex gap-2">
                                  <button
                    onClick={() => navigator.clipboard.writeText(meetingMinutes)}
                    className="flex-1 px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-xs"
                    style={{ background: '#111', border: '1px solid #666666' }}
                  >
                  Copy to Clipboard
                </button>
                                  <button
                    onClick={() => {
                      const blob = new Blob([meetingMinutes], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `meeting-minutes-${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-xs"
                    style={{ background: '#111', border: '1px solid #666666' }}
                  >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        {showConfirmDialog && confirmAction && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
            <div className="rounded-2xl bg-black p-4 w-full max-w-sm text-white text-center" style={{ border: '2px solid white' }}>
              <h3 className="text-sm font-bold mb-2">{confirmAction.message}</h3>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleConfirm}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-xs"
                  style={{ background: '#dc2626', border: '1px solid #666666' }}
                >
                  Clear
                </button>
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-xs"
                  style={{ background: '#2563eb', border: '1px solid #666666' }}
                >
                  Continue
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-xs"
                  style={{ background: '#111', border: '1px solid #666666' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Journal Modal */}
      {showMeetingJournal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4">
          <div className="w-full h-full max-w-4xl max-h-[90vh] rounded-2xl bg-black p-6 text-white overflow-hidden" style={{ border: '2px solid white' }}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Meeting Journal</h2>
              <button
                onClick={() => setShowMeetingJournal(false)}
                className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0"
                style={{ background: '#dc2626', border: '1px solid #666666' }}
              >
                Close
              </button>
            </div>

            {/* Flipbook Content */}
            <div className="h-full overflow-y-auto">
              {isLoadingMeetings ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading meetings...</div>
                </div>
              ) : savedMeetings.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-gray-400">No meetings found. Start recording to create your first meeting entry.</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cover Page */}
                  <div className="rounded-2xl p-8 text-center" style={{ border: '2px solid white' }}>
                    <h1 className="text-4xl font-bold mb-4">Meeting Journal</h1>
                    <p className="text-xl text-gray-300">Your Professional Meeting Records</p>
                    <p className="text-lg text-gray-400 mt-2">
                      Total Meetings: {savedMeetings.length}
                    </p>
                  </div>

                  {/* Table of Contents */}
                  <div className="rounded-2xl p-6" style={{ border: '2px solid white' }}>
                    <h2 className="text-2xl font-bold mb-4">Table of Contents</h2>
                    <div className="space-y-3">
                      {savedMeetings.map((meeting, index) => (
                        <div key={meeting.id} className="flex justify-between items-center p-3 bg-black bg-opacity-50 rounded-lg">
                          <div>
                            <span className="font-bold text-[var(--favourite-blue)]">{index + 1}.</span>
                            <span className="ml-2 font-semibold">
                              {meeting.meeting_agenda || 'Untitled Meeting'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(meeting.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meeting Pages */}
                  {savedMeetings.map((meeting, index) => (
                    <div key={meeting.id} className="rounded-2xl p-6" style={{ border: '2px solid white' }}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-[var(--favourite-blue)]">
                          Meeting {index + 1}: {meeting.meeting_agenda || 'Untitled Meeting'}
                        </h3>
                        <div className="text-sm text-gray-400">
                          {new Date(meeting.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Agenda:</h4>
                          <div className="bg-black bg-opacity-50 p-3 rounded-lg">
                            {meeting.meeting_agenda || 'No agenda provided'}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Transcript:</h4>
                          <div className="bg-black bg-opacity-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                            {meeting.meeting_transcript || 'No transcript available'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartMeetingRecorder;