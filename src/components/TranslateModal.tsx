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
  { code: 'en', name: 'English' },
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
          className="w-full p-3 rounded-2xl animated-neon-blue-border text-white border-0 focus:outline-none text-left flex items-center justify-between"
          style={{ backgroundColor: 'var(--favourite-blue)' }}
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
          <div className="absolute z-50 w-full mt-1 rounded-2xl animated-neon-blue-border overflow-hidden" style={{ backgroundColor: 'var(--favourite-blue)' }}>
            <div className="max-h-48 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onChange(option.code);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left text-white hover:bg-blue-600 transition-colors ${
                    value === option.code ? 'bg-blue-700' : ''
                  }`}
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

  if (!isOpen) return null;

  const handleTranslate = async () => {
    if (!currentText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate translation API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock translation result
      const mockTranslations: { [key: string]: string } = {
        'es': `Traducción simulada: "${currentText}"`,
        'fr': `Traduction simulée: "${currentText}"`,
        'de': `Simulierte Übersetzung: "${currentText}"`,
        'it': `Traduzione simulata: "${currentText}"`,
        'pt': `Tradução simulada: "${currentText}"`,
        'ru': `Симулированный перевод: "${currentText}"`,
        'ja': `シミュレートされた翻訳: "${currentText}"`,
        'ko': `시뮬레이션된 번역: "${currentText}"`,
        'zh': `模拟翻译: "${currentText}"`,
        'ar': `ترجمة محاكاة: "${currentText}"`,
        'hi': `सिमुलेटेड अनुवाद: "${currentText}"`,
        'nl': `Gesimuleerde vertaling: "${currentText}"`,
        'sv': `Simulerad översättning: "${currentText}"`,
        'no': `Simulert oversettelse: "${currentText}"`,
        'da': `Simuleret oversættelse: "${currentText}"`,
        'fi': `Simuloitu käännös: "${currentText}"`,
        'pl': `Symulowane tłumaczenie: "${currentText}"`,
        'tr': `Simüle edilmiş çeviri: "${currentText}"`,
        'he': `תרגום מדומה: "${currentText}"`,
        'th': `การแปลจำลอง: "${currentText}"`,
        'vi': `Bản dịch mô phỏng: "${currentText}"`,
        'id': `Terjemahan simulasi: "${currentText}"`,
        'ms': `Terjemahan simulasi: "${currentText}"`
      };

      const translation = mockTranslations[toLanguage] || `Simulated translation: "${currentText}"`;
      setTranslatedText(translation);
    } catch (err) {
      setError('Translation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4" style={{ height: '100vh' }}>
      <div className="w-full flex items-center justify-center">
        <div className="rounded-2xl bg-black p-4 min-h-0 h-auto flex flex-col" style={{ width: '85vw', boxSizing: 'border-box', border: '2px solid white' }}>
          <div className="overflow-y-auto max-h-[90vh]">
            <div className="space-y-6">
              <div className="w-full px-4">
                {/* Header */}
                <div className="relative mb-6 px-4 py-3 rounded-lg simple-double-border" style={{ background: 'linear-gradient(135deg, #000000 0%, #666666 100%)', border: '4px double rgba(255, 255, 255, 0.9)' }}>
                  <div className="token-dashboard-header">
                <h2 className="text-white font-bold text-base text-center">Translate Text</h2>
              </div>
                  <button
                    onClick={onClose}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
                    style={{ background: '#000000', border: 'none', outline: 'none', fontSize: '15px' }}
                  >
                    ×
                  </button>
                </div>

                {/* Input Text Display */}
                <div className="space-y-2 mb-4">
                  <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>You asked to translate:</label>
                  <div className="p-3 rounded-2xl animated-rainbow-border text-white border-0 min-h-[60px] text-left" style={{ backgroundColor: 'transparent' }}>
                    <div className="text-white text-sm text-left">
                      {currentText || 'No text entered'}
                    </div>
                  </div>
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
                    disabled={isLoading || !currentText.trim()}
                    className="px-8 py-4 rounded-2xl text-white font-medium transition-all duration-200"
                    style={{ border: '2px solid white', background: '#111' }}
                  >
                    {isLoading ? 'Translating...' : 'Translate'}
                  </button>
                </div>

                <>
                  {/* Error Display */}
                  {error && (
                    <div className="p-3 rounded-2xl animated-rainbow-border bg-red-100 text-black border-0 mb-4" style={{ backgroundColor: '#fee2e2' }}>
                      <h3 className="text-red-800 font-semibold text-lg mb-2">Error</h3>
                      <p className="text-red-700 text-base">{error}</p>
                    </div>
                  )}

                  {/* Translation Result */}
                  {translatedText && (
                    <div className="space-y-2">
                      <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Translation:</label>
                      <div className="p-3 rounded-2xl animated-rainbow-border text-white border-0 min-h-[100px] text-left" style={{ backgroundColor: 'transparent' }}>
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