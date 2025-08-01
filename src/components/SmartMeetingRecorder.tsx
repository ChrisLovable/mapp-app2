import React, { useState, useRef, useEffect } from 'react';
import CustomDatePicker from './CustomDatePicker';
import Select from 'react-select';
import { supabase } from '../lib/supabase';
import { useSmartSpeechToText } from '../hooks/useSmartSpeechToText';
import { useErrorToast } from '../hooks/useErrorToast';
import { useLockedAction } from '../hooks/useLockedAction';
import { useMicManager } from '../contexts/MicManagerContext';

interface SmartMeetingRecorderProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmartMeetingRecorder: React.FC<SmartMeetingRecorderProps> = ({ isOpen, onClose }) => {
  const { showError, showWarning } = useErrorToast();
  const { locked: isProcessing, runLocked } = useLockedAction();
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

  // Get direct access to MicManager for cleanup
  const micManager = useMicManager();
  
  // 🛡️ MOBILE-PROOF: Use the global mic manager
  const {
    isListening,
    startListening,
    stopListening,
    transcript: globalTranscript,
    isSupported: isSpeechRecognitionSupported
  } = useSmartSpeechToText({
    language: selectedLanguage,
    continuous: true,
    interimResults: true,
    owner: 'SmartMeetingRecorder',
    onResult: (text, isFinal) => {
      if (isFinal) {
        setTranscript(prev => prev + text);
        setMeetingRecording(prev => prev + text);
      }
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);
      setError(`Speech recognition error: ${error}`);
      showError('Speech Recognition Error', error);
    }
  });

  // Ref to track current state values for onend handler
  const stateRef = useRef({
    isResuming: false,
    isRecording: false,
    isPaused: false,
    fallbackTimeout: null as NodeJS.Timeout | null
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  // ✅ CLEANUP: Add cleanup effect for unmount
  useEffect(() => {
    return () => {
      console.log('[speech] SmartMeetingRecorder cleanup on unmount');
      const recognition = micManager.getRecognition();
      if (recognition) {
        recognition.stop?.();
        recognition.abort?.();
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
      
      // Stop any active recording when component unmounts
      if (isRecording || isListening) {
        stopListening();
        setIsRecording(false);
        setIsPaused(false);
        setIsResuming(false);
      }
      
      // Clear any fallback timeouts
      if (stateRef.current.fallbackTimeout) {
        clearTimeout(stateRef.current.fallbackTimeout);
        stateRef.current.fallbackTimeout = null;
      }
    };
  }, [isRecording, isListening, stopListening, micManager]);

  // 🛡️ MOBILE-PROOF: Speech recognition is now handled by the global mic manager

  // startRecording function
  const startRecording = async () => {
    await runLocked(async () => {
      try {
        setError(null);
        setInterimTranscript('');
        setConfidence(0);
        
        // Clear previous content
        setTranscript('');
        setMeetingRecording('');
        
        // 🛡️ MOBILE-PROOF: Use the global mic manager
        await startListening();
        setIsRecording(true);
        setIsPaused(false);
        stateRef.current = { ...stateRef.current, isRecording: true, isPaused: false, fallbackTimeout: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start transcription';
        setError(errorMessage);
        console.error('Error starting transcription:', err);
        showError('Recording Error', errorMessage);
      }
    });
  };

  const continueRecording = async () => {
    await runLocked(async () => {
      try {
        setError(null);
        setInterimTranscript('');
        setConfidence(0);
        
        // Don't clear previous content - continue from where we left off
        
        // 🛡️ MOBILE-PROOF: Use the global mic manager
        await startListening();
        setIsRecording(true);
        setIsPaused(false);
        stateRef.current = { ...stateRef.current, isRecording: true, isPaused: false, fallbackTimeout: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start transcription';
        setError(errorMessage);
        console.error('Error starting transcription:', err);
        showError('Recording Error', errorMessage);
      }
    });
  };

  const pauseRecording = () => {
    if (!isRecording) return;
    
    // 🛡️ MOBILE-PROOF: Use the global mic manager
    stopListening();
    
    setIsRecording(false);
    setIsPaused(true);
    stateRef.current = { ...stateRef.current, isRecording: false, isPaused: true, fallbackTimeout: null };
  };

  const resumeRecording = async () => {
    if (!isPaused) return;

    await runLocked(async () => {
      try {
        setIsResuming(true);
        stateRef.current = { ...stateRef.current, isResuming: true };

        // 🛡️ MOBILE-PROOF: Use the global mic manager
        await startListening();
        
        setIsResuming(false);
        setIsRecording(true);
        setIsPaused(false);
        stateRef.current = { ...stateRef.current, isResuming: false, isRecording: true, isPaused: false, fallbackTimeout: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to resume transcription';
        setError(errorMessage);
        console.error('Error resuming transcription:', err);
        showError('Recording Error', errorMessage);
        setIsResuming(false);
        stateRef.current = { ...stateRef.current, isResuming: false, fallbackTimeout: null };
      }
    });
  };

  const endRecording = () => {
    if (!isRecording && !isPaused) return;
    
    // 🛡️ MOBILE-PROOF: Use the global mic manager
    stopListening();
    
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

    await runLocked(async () => {
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to create minutes: ${errorMessage}`);
        showError('Minutes Creation Failed', `Failed to create minutes: ${errorMessage}`);
      } finally {
        setIsCreatingMinutes(false);
      }
    });
  };

  // Save meeting data to database
  const saveToDatabase = async () => {
    if (!meetingRecording.trim()) {
      setError('No meeting recording to save');
      return;
    }

    await runLocked(async () => {
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
        showError('Database Error', errorMessage);
      } finally {
        setIsSavingToDatabase(false);
      }
    });
  };

  // Open meeting journal and load saved meetings
  const openMeetingJournal = async () => {
    await runLocked(async () => {
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
        showError('Database Error', errorMessage);
      } finally {
        setIsLoadingMeetings(false);
      }
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    const changeLanguage = () => {
      setSelectedLanguage(newLanguage);
      // 🛡️ MOBILE-PROOF: Use the global mic manager for language change
      if (isRecording) {
        stopListening();
        setTimeout(async () => {
          try {
            await startListening();
          } catch (error) {
            console.error('Error restarting with new language:', error);
            setError('Failed to restart recording with new language');
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
        className="glassy-rainbow-btn rounded-2xl bg-black p-2 w-full max-w-[90vw] max-h-[95vh] flex flex-col border-0"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="w-full bg-blue-600 rounded-t-2xl rounded-b-2xl flex items-center justify-between px-4 py-3 mb-4">
          <h2 className="text-white font-bold text-lg sm:text-xl mx-auto w-full text-center">Smart Meeting Recorder</h2>
          <button
            onClick={onClose}
            className="absolute right-6 top-4 text-white text-xl font-bold bg-transparent rounded-full hover:bg-blue-800 hover:text-gray-200 transition-colors w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        {/* Meeting Journal Button */}
        <div className="px-4 mb-4">
          <button
            onClick={openMeetingJournal}
            className={`w-full px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0`}
            style={{ background: '#111' }}
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
                  <label className="text-sm text-white mb-2 block">Meeting Date</label>
                  <CustomDatePicker
                    value={meetingDate}
                    onChange={setMeetingDate}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-white block">Language</label>
                  <Select
                    className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm"
                    value={availableLanguages.find(opt => opt.code === selectedLanguage) || null}
                    onChange={(option) => option && handleLanguageChange(option.code)}
                    options={availableLanguages}
                    getOptionLabel={opt => opt.name}
                    getOptionValue={opt => opt.code}
                    placeholder="Select language..."
                    isClearable={false}
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
                      container: (base) => ({ ...base, width: '150px', zIndex: 20 }),
                      control: (base, state) => ({
                        ...base,
                        borderRadius: 16,
                        border: state.isFocused ? '2px solid #2563eb' : '2px solid var(--favourite-blue)',
                        background: '#111',
                        color: '#fff',
                        boxShadow: 'none',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        minHeight: 44,
                        transition: 'border 0.2s, box-shadow 0.2s',
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
                        fontSize: '0.9rem',
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
                <label className="text-sm text-white mb-2 block">Meeting Agenda</label>
                <textarea
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  placeholder="Enter meeting agenda..."
                  className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] resize-none"
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
                disabled={isRecording || isPaused || !isSpeechRecognitionSupported || isProcessing}
                className={`flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  isRecording || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: isRecording ? '#dc2626' : '#111' }}
              >
                {isProcessing ? 'Starting...' : isRecording ? 'Recording...' : 'Start'}
              </button>
              
              <button
                onClick={handlePauseResume}
                disabled={(!isRecording && !isPaused) || isProcessing}
                className={`flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  (!isRecording && !isPaused) || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111' }}
              >
                {isProcessing ? 'Processing...' : isPaused ? 'Resume' : 'Pause'}
              </button>
              
              <button
                onClick={endRecording}
                disabled={!isRecording && !isPaused}
                className={`flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  !isRecording && !isPaused ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111' }}
              >
                Stop
              </button>
            </div>
          </div>

          {/* Meeting Recording */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white mb-2 block">Meeting Recording</label>
              <textarea
                value={meetingRecording + (interimTranscript ? ' ' + interimTranscript : '')}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Remove the interim transcript from the new value
                  const baseValue = interimTranscript ? newValue.replace(interimTranscript, '').trim() : newValue;
                  setMeetingRecording(baseValue);
                }}
                placeholder="Recording will appear here..."
                className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] resize-none"
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
                disabled={!meetingRecording.trim() || isGeneratingMinutes || isProcessing}
                className={`flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  !meetingRecording.trim() || isGeneratingMinutes || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111' }}
              >
                {isProcessing ? 'Processing...' : isGeneratingMinutes ? 'Generating...' : 'Create Minutes'}
              </button>
              
              <button
                onClick={saveToDatabase}
                disabled={!meetingRecording.trim() || isSavingToDatabase || isProcessing}
                className={`flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 ${
                  !meetingRecording.trim() || isSavingToDatabase || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ background: '#111' }}
              >
                {isProcessing ? 'Processing...' : isSavingToDatabase ? 'Saving...' : 'Save to Database'}
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
              <h3 className="text-lg font-bold text-white">Generated Meeting Minutes</h3>
              <div className="bg-black bg-opacity-50 p-4 rounded-xl border border-[var(--favourite-blue)] max-h-64 overflow-y-auto">
                <pre className="text-white text-sm whitespace-pre-wrap">{meetingMinutes}</pre>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(meetingMinutes)}
                  className="flex-1 px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                  style={{ background: '#111' }}
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
                  className="flex-1 px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                  style={{ background: '#111' }}
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
            <div className="glassy-rainbow-btn rounded-2xl bg-black p-4 w-full max-w-sm text-white text-center">
              <h3 className="text-base font-bold mb-2">{confirmAction.message}</h3>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleConfirm}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-sm"
                  style={{ background: '#dc2626' }}
                >
                  Clear
                </button>
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-sm"
                  style={{ background: '#2563eb' }}
                >
                  Continue
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-sm"
                  style={{ background: '#111' }}
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
          <div className="w-full h-full max-w-6xl max-h-[90vh] glassy-rainbow-btn rounded-2xl bg-black p-6 text-white overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Meeting Journal</h2>
              <button
                onClick={() => setShowMeetingJournal(false)}
                className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0"
                style={{ background: '#dc2626' }}
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
                  <div className="glassy-rainbow-btn rounded-2xl p-8 text-center border-2 border-[var(--favourite-blue)]">
                    <h1 className="text-4xl font-bold mb-4">Meeting Journal</h1>
                    <p className="text-xl text-gray-300">Your Professional Meeting Records</p>
                    <p className="text-lg text-gray-400 mt-2">
                      Total Meetings: {savedMeetings.length}
                    </p>
                  </div>

                  {/* Table of Contents */}
                  <div className="glassy-rainbow-btn rounded-2xl p-6 border-2 border-[var(--favourite-blue)]">
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
                    <div key={meeting.id} className="glassy-rainbow-btn rounded-2xl p-6 border-2 border-[var(--favourite-blue)]">
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