import React from 'react';
import { useSpeechToText, useContinuousSpeechToText, useMobileSpeechToText } from '../hooks/useSpeechToText';

interface SpeechToTextButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  disabled?: boolean;
  children?: React.ReactNode;
}

// General purpose speech-to-text button
export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onResult,
  onError,
  onStart,
  language = 'en-US',
  continuous = false,
  interimResults = false,
  className = '',
  size = 'md',
  variant = 'default',
  disabled = false,
  children
}) => {
  const {
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useSpeechToText({
    language,
    continuous,
    interimResults,
    onResult,
    onError,
    onStart
  });

  const handleClick = () => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported on this device.');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-[#111] hover:bg-gray-800',
    primary: 'bg-[var(--favourite-blue)] hover:bg-blue-600',
    secondary: 'bg-gray-700 hover:bg-gray-600'
  };

  // Base classes
  const baseClasses = `
    glassy-btn neon-grid-btn rounded-full shadow-md 
    transition-all duration-200 flex items-center justify-center border-0 
    active:scale-95 relative overflow-visible
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  // Listening state classes
  const listeningClasses = isListening 
    ? 'scale-110 animate-pulse ring-2 ring-red-500 ring-opacity-60' 
    : '';

  // Disabled state
  if (disabled || !isSupported) {
    return (
      <button
        className={`${baseClasses} opacity-50 cursor-not-allowed`}
        disabled
        aria-label="Speech recognition not available"
      >
        <span className="text-gray-400">🎤</span>
      </button>
    );
  }

  return (
    <button
      className={`${baseClasses} ${listeningClasses}`}
      onClick={handleClick}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
      type="button"
      style={{
        background: isListening ? '#dc2626' : undefined,
        color: isListening ? 'white' : 'var(--text-color)',
        boxShadow: isListening
          ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
          : undefined,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {children || (
        <span className={`transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`}>
          🎤
        </span>
      )}
    </button>
  );
};

// Continuous speech-to-text button (for real-time transcription)
export const ContinuousSpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onResult,
  onError,
  onStart,
  language = 'en-US',
  className = '',
  size = 'md',
  variant = 'default',
  disabled = false,
  children
}) => {
  const {
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useContinuousSpeechToText({
    language,
    onResult,
    onError,
    onStart
  });

  console.log('ContinuousSpeechToTextButton render - isListening:', isListening);

  const handleClick = () => {
    console.log('ContinuousSpeechToTextButton clicked, isListening:', isListening);
    
    if (!isSupported) {
      console.error('Speech recognition not supported');
      onError?.('Speech recognition is not supported on this device.');
      return;
    }

    if (isListening) {
      console.log('Stopping continuous listening...');
      stopListening();
    } else {
      console.log('Starting continuous listening...');
      startListening();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-[#111] hover:bg-gray-800',
    primary: 'bg-[var(--favourite-blue)] hover:bg-blue-600',
    secondary: 'bg-gray-700 hover:bg-gray-600'
  };

  // Base classes
  const baseClasses = `
    glassy-btn neon-grid-btn rounded-full shadow-md 
    transition-all duration-200 flex items-center justify-center border-0 
    active:scale-95 relative overflow-visible
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  // Listening state classes
  const listeningClasses = isListening 
    ? 'scale-110 animate-pulse ring-2 ring-red-500 ring-opacity-60' 
    : '';

  // Disabled state
  if (disabled || !isSupported) {
    return (
      <button
        className={`${baseClasses} opacity-50 cursor-not-allowed`}
        disabled
        aria-label="Speech recognition not available"
      >
        <span className="text-gray-400">🎤</span>
      </button>
    );
  }

  return (
    <button
      className={`${baseClasses} ${listeningClasses}`}
      onClick={handleClick}
      aria-label={isListening ? 'Stop continuous listening' : 'Start continuous listening'}
      type="button"
      style={{
        background: isListening ? '#dc2626' : undefined,
        color: isListening ? 'white' : 'var(--text-color)',
        boxShadow: isListening
          ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
          : undefined,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {children || (
        <span className={`transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`}>
          🎤
        </span>
      )}
    </button>
  );
};

// Mobile-optimized speech-to-text button
export const MobileSpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onResult,
  onError,
  onStart,
  language = 'en-US',
  className = '',
  size = 'md',
  variant = 'default',
  disabled = false,
  children
}) => {
  const {
    isListening,
    startListening,
    stopListening,
    isSupported
  } = useMobileSpeechToText({
    language,
    onResult,
    onError,
    onStart
  });

  console.log('MobileSpeechToTextButton render - isListening:', isListening);

  const handleClick = () => {
    console.log('MobileSpeechToTextButton clicked, isListening:', isListening);
    console.log('Device info:', navigator.userAgent);
    console.log('Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    if (!isSupported) {
      console.error('Speech recognition not supported on this mobile device');
      onError?.('Speech recognition is not supported on this mobile device.');
      return;
    }

    if (isListening) {
      console.log('Stopping mobile listening...');
      stopListening();
    } else {
      console.log('Starting mobile listening...');
      startListening();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-[#111] hover:bg-gray-800',
    primary: 'bg-[var(--favourite-blue)] hover:bg-blue-600',
    secondary: 'bg-gray-700 hover:bg-gray-600'
  };

  // Base classes
  const baseClasses = `
    glassy-btn neon-grid-btn rounded-full shadow-md 
    transition-all duration-200 flex items-center justify-center border-0 
    active:scale-95 relative overflow-visible
    ${sizeClasses[size]}
    ${className}
  `;

  // Listening state classes - more prominent for mobile
  const listeningClasses = isListening 
    ? 'scale-125 animate-pulse ring-4 ring-red-500 ring-opacity-80' 
    : '';

  // Disabled state
  if (disabled || !isSupported) {
    return (
      <button
        className={`${baseClasses} opacity-50 cursor-not-allowed`}
        disabled
        aria-label="Speech recognition not available on mobile"
      >
        <span className="text-gray-400">🎤</span>
      </button>
    );
  }

  return (
    <button
      className={`${baseClasses} ${listeningClasses}`}
      onClick={handleClick}
      aria-label={isListening ? 'Stop mobile listening' : 'Start mobile listening'}
      type="button"
      style={{
        background: isListening ? '#dc2626' : '#111111', // Red when recording, black when not
        color: isListening ? 'white' : 'var(--text-color)',
        boxShadow: isListening
          ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
          : undefined,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {children || (
        <span className={`transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`}>
          🎤
        </span>
      )}
    </button>
  );
};

// Text-to-Speech button component
interface TextToSpeechButtonProps {
  onSpeak: (text: string) => void;
  text?: string;
  language?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const TextToSpeechButton: React.FC<TextToSpeechButtonProps> = ({
  onSpeak,
  text = '',
  language = 'en-US',
  className = '',
  size = 'md',
  variant = 'default',
  disabled = false,
  children
}) => {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const handleClick = () => {
    if (!text.trim()) {
      console.warn('No text to speak');
      return;
    }

    if (isSpeaking) {
      // Stop speaking
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    } else {
      // Start speaking
      setIsSpeaking(true);
      onSpeak(text);
      // Reset speaking state after a short delay
      setTimeout(() => {
        setIsSpeaking(false);
      }, 1000);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-[#111] hover:bg-gray-800',
    primary: 'bg-[var(--favourite-blue)] hover:bg-blue-600',
    secondary: 'bg-gray-700 hover:bg-gray-600'
  };

  // Base classes
  const baseClasses = `
    glassy-btn neon-grid-btn rounded-full shadow-md 
    transition-all duration-200 flex items-center justify-center border-0 
    active:scale-95 relative overflow-visible
    ${sizeClasses[size]}
    ${className}
  `;

  // Speaking state classes
  const speakingClasses = isSpeaking 
    ? 'scale-110 animate-pulse ring-2 ring-green-500 ring-opacity-60' 
    : '';

  // Disabled state
  if (disabled || !text.trim()) {
    return (
      <button
        className={`${baseClasses} opacity-50 cursor-not-allowed`}
        disabled
        aria-label="Text-to-speech not available"
      >
        <span className="text-gray-400">🔊</span>
      </button>
    );
  }

  return (
    <button
      className={`${baseClasses} ${speakingClasses}`}
      onClick={handleClick}
      aria-label={isSpeaking ? 'Stop speaking' : 'Speak text'}
      type="button"
      style={{
        background: isSpeaking ? '#059669' : '#111111', // Green when speaking, black when not
        color: isSpeaking ? 'white' : 'var(--text-color)',
        boxShadow: isSpeaking
          ? '0 0 16px 4px #10b981, 0 0 32px 8px #10b981cc, 0 1px 4px 0 #05966988, 0 1.5px 3px rgba(5, 150, 105, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
          : undefined,
        position: 'relative',
        zIndex: 1,
        animation: isSpeaking ? 'pulse-green 1.5s ease-in-out infinite' : 'none',
      }}
    >
      {children || (
        <span className={`transition-colors duration-200 ${isSpeaking ? 'text-green-500' : ''}`}>
          🔊
        </span>
      )}
      {/* Pulsating green background effect */}
      {isSpeaking && (
        <div 
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.3) 50%, transparent 100%)',
            zIndex: -1,
          }}
        />
      )}
    </button>
  );
};

// Language toggle button component
interface LanguageToggleButtonProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
  disabled?: boolean;
}

export const LanguageToggleButton: React.FC<LanguageToggleButtonProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
  size = 'sm',
  variant = 'default',
  disabled = false
}) => {
  const isEnglish = currentLanguage === 'en-US';
  const isAfrikaans = currentLanguage === 'af-ZA';

  const handleClick = () => {
    const newLanguage = isEnglish ? 'af-ZA' : 'en-US';
    onLanguageChange(newLanguage);
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  // Base classes
  const baseClasses = `
    glassy-btn neon-grid-btn rounded-full shadow-md 
    transition-all duration-200 flex items-center justify-center border-0 
    active:scale-95 relative overflow-visible
    ${sizeClasses[size]}
    ${className}
  `;

  const languageClasses = isEnglish
    ? 'text-black'
    : 'text-black';

  // Disabled state
  if (disabled) {
    return (
      <button
        className={`${baseClasses} opacity-50 cursor-not-allowed`}
        disabled
        aria-label="Language toggle disabled"
      >
        <span className="text-gray-400 font-bold">
          {isEnglish ? 'EN' : 'AF'}
        </span>
      </button>
    );
  }

  return (
    <button
      className={baseClasses}
      onClick={handleClick}
      aria-label={`Switch to ${isEnglish ? 'Afrikaans' : 'English'}`}
      type="button"
      style={{
        background: isEnglish ? '#eab308' : '#3b82f6', // Yellow for EN, Blue for AF
        color: 'black',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <span className={`transition-colors duration-200 font-bold ${languageClasses}`}>
        {isEnglish ? 'EN' : 'AF'}
      </span>
    </button>
  );
}; 