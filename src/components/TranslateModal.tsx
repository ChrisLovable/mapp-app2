import { useState, useRef, useEffect } from 'react';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
}

interface LanguageOption {
  code: string;
  name: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'en', name: 'English' },
  { code: 'st', name: 'Sesotho' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'zu', name: 'Zulu' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'auto', name: 'Auto Detect' }
];

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: LanguageOption[];
  placeholder: string;
  label: string;
}

function CustomDropdown({ value, onChange, options, placeholder, label }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.code === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2">
      <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>{label}:</label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 rounded-2xl text-white border-0 focus:outline-none text-left flex items-center justify-between"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '2px solid white',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span>{selectedOption ? selectedOption.name : placeholder}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 rounded-2xl overflow-hidden" style={{ 
            backgroundColor: '#181a1b',
            border: '2px solid white',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 24px 0 #2563eb99'
          }}>
            <div className="max-h-48 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onChange(option.code);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left text-white transition-colors ${
                    value === option.code ? 'bg-blue-600 font-bold' : 'hover:bg-gray-700'
                  }`}
                  style={{
                    background: value === option.code 
                      ? '#2563eb' 
                      : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: value === option.code ? 'bold' : 'normal',
                  }}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TranslateModal({ isOpen, onClose, currentText }: TranslateModalProps) {
  const [fromLanguage, setFromLanguage] = useState('auto');
  const [toLanguage, setToLanguage] = useState('es');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editableText, setEditableText] = useState(currentText);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Update editable text when currentText prop changes
  useEffect(() => {
    setEditableText(currentText);
  }, [currentText]);

  // Speech Recognition setup
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (speechError) {
      const timer = setTimeout(() => setSpeechError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [speechError]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setEditableText(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechError('Speech recognition failed. Please try again.');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      setError('');
      recognition.start();
    } else {
      setSpeechError('Speech recognition is not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // TTS function
  const speakTranslatedText = () => {
    if (!translatedText.trim()) return;

    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(translatedText);
      
      // Set language based on target language
      const languageMap: { [key: string]: string } = {
        'af': 'af-ZA', // Afrikaans
        'en': 'en-US', // English
        'es': 'es-ES', // Spanish
        'fr': 'fr-FR', // French
        'de': 'de-DE', // German
        'it': 'it-IT', // Italian
        'pt': 'pt-PT', // Portuguese
        'ru': 'ru-RU', // Russian
        'ja': 'ja-JP', // Japanese
        'ko': 'ko-KR', // Korean
        'zh': 'zh-CN', // Chinese
        'ar': 'ar-SA', // Arabic
        'hi': 'hi-IN', // Hindi
        'nl': 'nl-NL', // Dutch
        'sv': 'sv-SE', // Swedish
        'no': 'no-NO', // Norwegian
        'da': 'da-DK', // Danish
        'fi': 'fi-FI', // Finnish
        'pl': 'pl-PL', // Polish
        'tr': 'tr-TR', // Turkish
        'he': 'he-IL', // Hebrew
        'th': 'th-TH', // Thai
        'vi': 'vi-VN', // Vietnamese
        'id': 'id-ID', // Indonesian
        'ms': 'ms-MY', // Malay
      };
      
      utterance.lang = languageMap[toLanguage] || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setError('Text-to-speech is not supported in this browser');
    }
  };

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!editableText?.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setIsLoading(true);
    setError('');

    try {

      // Get language names for better prompts
      const fromLang = LANGUAGE_OPTIONS.find(lang => lang.code === fromLanguage)?.name || fromLanguage;
      const toLang = LANGUAGE_OPTIONS.find(lang => lang.code === toLanguage)?.name || toLanguage;

      const prompt = `Translate the following text from ${fromLang} to ${toLang}. Return only the translated text, nothing else.

Text to translate: "${editableText}"`;

      // Try backend translation route first; fallback to client OpenAI if unavailable
      let translatedText: string | undefined;
      try {
        const resp = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        if (resp.ok) {
          const json = await resp.json();
          translatedText = json.translatedText || json.data?.translatedText || json.choices?.[0]?.message?.content?.trim();
        }
      } catch (_) {
        // ignore and fallback
      }

      if (!translatedText) {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('Translation service unavailable.');
        }
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a professional translator. Translate the given text accurately while preserving the original meaning and tone. Return only the translated text without any explanations or formatting.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.3
          })
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Translation error: ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        translatedText = data.choices[0]?.message?.content?.trim();
      }

      if (!translatedText) {
        throw new Error('No translation received');
      }

      setTranslatedText(translatedText);
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4" style={{ height: '100vh' }}>
      <div className="w-full flex items-center justify-center">
        <div className="rounded-2xl bg-black p-4 min-h-0 flex flex-col" style={{ width: '85vw', height: '85vh', boxSizing: 'border-box', border: '2px solid white' }}>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 40px)' }}>
            <div className="space-y-6">
              <div className="w-full px-4">
                {/* Header */}
                <div 
                  className="sticky top-0 z-10 mb-6 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(10px)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                    filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                    transform: 'translateZ(5px)',
                    paddingLeft: '20px',
                    paddingRight: '20px'
                  }}
                >
                  <h2 
                    className="text-white font-bold text-lg text-center"
                    style={{
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                      filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                      transform: 'translateZ(3px)'
                    }}
                  >
                    Translate Text
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

                {speechError && (
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000]" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                    <div className="glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ring-red-400 ring-opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239,68,68,0.85) 0%, rgba(30,41,59,0.95) 100%)',
                        boxShadow: '0 8px 32px 0 rgba(239,68,68,0.25), 0 1.5px 0 0 #fff',
                        border: '2px solid rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(12px)',
                        color: '#fff'
                      }}>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }}>❌</div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-lg" style={{ textShadow: '0 1px 4px #ef4444' }}>{speechError}</p>
                        </div>
                        <button
                          onClick={() => setSpeechError(null)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button"
                          style={{
                            background: 'rgba(239,68,68,0.7)',
                            fontSize: '22px',
                            border: '1px solid #fff'
                          }}
                          aria-label="Close error"
                        >×</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input Text Display */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Text to translate:</label>
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isListening}
                      className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                      style={{
                        background: isListening ? '#dc2626' : 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid white',
                        color: 'white'
                      }}
                      title={isListening ? "Stop listening" : "Start voice input"}
                    >
                      {isListening ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span style={{ fontSize: '16px' }}>🎤</span>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className="w-full p-3 rounded-2xl text-white text-sm resize-none outline-none"
                    style={{ 
                      backgroundColor: 'transparent',
                      border: '2px solid white',
                      background: 'rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(10px)',
                      minHeight: '60px'
                    }}
                    placeholder="Enter text to translate..."
                  />
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <CustomDropdown
                    value={fromLanguage}
                    onChange={setFromLanguage}
                    options={LANGUAGE_OPTIONS}
                    placeholder="Select source language"
                    label="From"
                  />
                  <CustomDropdown
                    value={toLanguage}
                    onChange={setToLanguage}
                    options={LANGUAGE_OPTIONS.filter(lang => lang.code !== 'auto')}
                    placeholder="Select target language"
                    label="To"
                  />
                </div>

                {/* Translate Button */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleTranslate}
                    disabled={isLoading || !editableText?.trim()}
                    className="glassy-btn neon-grid-btn px-6 py-3 rounded-2xl text-white font-bold transition-colors text-sm border-0"
                    style={{
                      background: '#111',
                      border: '1px solid #666666',
                      fontSize: '0.9rem',
                      minWidth: '120px'
                    }}
                  >
                    {isLoading ? 'Translating...' : 'Translate'}
                  </button>
                </div>

                <>
                  {/* Error Display */}
                  {error && (
                    <div className="p-3 rounded-2xl mb-4" style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '2px solid rgba(239, 68, 68, 0.6)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <h3 className="text-red-300 font-semibold text-sm mb-1">Error</h3>
                      <p className="text-red-200 text-xs">{error}</p>
                    </div>
                  )}

                  {/* Translation Result */}
                  {translatedText && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Translation:</label>
                        <button
                          onClick={speakTranslatedText}
                          disabled={isSpeaking}
                          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                          style={{
                            background: isSpeaking ? '#2563eb' : 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid white',
                            color: 'white'
                          }}
                          title="Listen to translation"
                        >
                          {isSpeaking ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span style={{ fontSize: '16px' }}>🔊</span>
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-2xl min-h-[100px] text-left" style={{ 
                        backgroundColor: 'transparent',
                        border: '2px solid white',
                        background: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <div className="text-white text-sm text-left">
                          {translatedText}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 