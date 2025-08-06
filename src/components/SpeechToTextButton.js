import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useSpeechToText, useContinuousSpeechToText, useMobileSpeechToText } from '../hooks/useSpeechToText';
// General purpose speech-to-text button
export const SpeechToTextButton = ({ onResult, onError, onStart, language = 'en-US', continuous = false, interimResults = false, className = '', size = 'md', variant = 'default', disabled = false, children }) => {
    const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
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
        }
        else {
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
        return (_jsx("button", { className: `${baseClasses} opacity-50 cursor-not-allowed`, disabled: true, "aria-label": "Speech recognition not available", children: _jsx("span", { className: "text-gray-400", children: "\uD83C\uDFA4" }) }));
    }
    return (_jsx("button", { className: `${baseClasses} ${listeningClasses}`, onClick: handleClick, "aria-label": isListening ? 'Stop listening' : 'Start listening', type: "button", style: {
            background: isListening ? '#dc2626' : undefined,
            color: isListening ? 'white' : 'var(--text-color)',
            boxShadow: isListening
                ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
                : undefined,
            position: 'relative',
            zIndex: 1,
            borderRadius: '50%',
            aspectRatio: '1.15',
            minWidth: '32px',
            minHeight: '28px',
            width: '32px',
            height: '28px',
        }, children: children || (_jsx("span", { className: `transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`, children: "\uD83C\uDFA4" })) }));
};
// Continuous speech-to-text button (for real-time transcription)
export const ContinuousSpeechToTextButton = ({ onResult, onError, onStart, language = 'en-US', className = '', size = 'md', variant = 'default', disabled = false, children }) => {
    const { isListening, startListening, stopListening, isSupported } = useContinuousSpeechToText({
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
        }
        else {
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
        return (_jsx("button", { className: `${baseClasses} opacity-50 cursor-not-allowed`, disabled: true, "aria-label": "Speech recognition not available", children: _jsx("span", { className: "text-gray-400", children: "\uD83C\uDFA4" }) }));
    }
    return (_jsx("button", { className: `${baseClasses} ${listeningClasses}`, onClick: handleClick, "aria-label": isListening ? 'Stop continuous listening' : 'Start continuous listening', type: "button", style: {
            background: isListening ? '#dc2626' : undefined,
            color: isListening ? 'white' : 'var(--text-color)',
            boxShadow: isListening
                ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
                : undefined,
            position: 'relative',
            zIndex: 1,
        }, children: children || (_jsx("span", { className: `transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`, children: "\uD83C\uDFA4" })) }));
};
// Mobile-optimized speech-to-text button
export const MobileSpeechToTextButton = ({ onResult, onError, onStart, language = 'en-US', className = '', size = 'md', variant = 'default', disabled = false, children }) => {
    const { isListening, startListening, stopListening, isSupported } = useMobileSpeechToText({
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
        }
        else {
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
        return (_jsx("button", { className: `${baseClasses} opacity-50 cursor-not-allowed`, disabled: true, "aria-label": "Speech recognition not available on mobile", children: _jsx("span", { className: "text-gray-400", children: "\uD83C\uDFA4" }) }));
    }
    return (_jsx("button", { className: `${baseClasses} ${listeningClasses}`, onClick: handleClick, "aria-label": isListening ? 'Stop mobile listening' : 'Start mobile listening', type: "button", style: {
            background: isListening ? '#dc2626' : '#111111', // Red when recording, black when not
            color: isListening ? 'white' : 'var(--text-color)',
            boxShadow: isListening
                ? '0 0 16px 4px #ff1744, 0 0 32px 8px #ff1744cc, 0 1px 4px 0 #ff174488, 0 1.5px 3px rgba(220, 38, 38, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)'
                : undefined,
            position: 'relative',
            zIndex: 1,
        }, children: children || (_jsx("span", { className: `transition-colors duration-200 ${isListening ? 'text-red-500' : ''}`, children: "\uD83C\uDFA4" })) }));
};
export const TextToSpeechButton = ({ onSpeak, text = '', language = 'en-US', className = '', size = 'md', variant = 'default', disabled = false, children }) => {
    const [isSpeaking, setIsSpeaking] = React.useState(false);
    const handleClick = () => {
        if (!text.trim()) {
            console.warn('No text to speak');
            // Still allow the button to be clicked even with no text
            return;
        }
        if (isSpeaking) {
            // Stop speaking
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            setIsSpeaking(false);
        }
        else {
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
        ? 'scale-110 animate-pulse ring-2 ring-gray-400 ring-opacity-60'
        : '';
    // Disabled state
    if (disabled) {
        return (_jsx("button", { className: `${baseClasses} opacity-50 cursor-not-allowed`, disabled: true, "aria-label": "Text-to-speech not available", children: _jsx("span", { className: "text-gray-400", children: "\uD83D\uDD0A" }) }));
    }
    return (_jsxs("button", { className: `${baseClasses} ${speakingClasses}`, onClick: handleClick, "aria-label": isSpeaking ? 'Stop speaking' : 'Speak text', type: "button", style: {
            background: isSpeaking
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8), rgba(59, 130, 246, 0.2))'
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.15))',
            color: isSpeaking ? '#333333' : 'var(--text-color)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: isSpeaking
                ? '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                : '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            filter: isSpeaking
                ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 10px rgba(59, 130, 246, 0.4)) drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))'
                : 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 10px rgba(59, 130, 246, 0.4)) drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))',
            transform: 'translateZ(20px) perspective(1000px) rotateX(5deg)',
            borderRadius: '50%',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 1,
            animation: isSpeaking ? 'pulse-white 1.5s ease-in-out infinite' : 'none',
            aspectRatio: '1.15',
            minWidth: '32px',
            minHeight: '28px',
            width: '32px',
            height: '28px',
        }, children: [children || (_jsx("span", { className: `transition-colors duration-200 ${isSpeaking ? 'text-gray-700' : ''}`, children: "\uD83D\uDD0A" })), isSpeaking && (_jsx("div", { className: "absolute inset-0 rounded-full animate-ping", style: {
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 0%, rgba(5, 150, 105, 0.3) 50%, transparent 100%)',
                    zIndex: -1,
                } }))] }));
};
export const LanguageToggleButton = ({ currentLanguage, onLanguageChange, className = '', size = 'sm', variant = 'default', disabled = false }) => {
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
        return (_jsx("button", { className: `${baseClasses} opacity-50 cursor-not-allowed`, disabled: true, "aria-label": "Language toggle disabled", children: _jsx("span", { className: "text-gray-400 font-bold", children: isEnglish ? 'EN' : 'AF' }) }));
    }
    return (_jsx("button", { className: baseClasses, onClick: handleClick, "aria-label": `Switch to ${isEnglish ? 'Afrikaans' : 'English'}`, type: "button", style: {
            background: isEnglish
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(34, 197, 94, 0.8), rgba(59, 130, 246, 0.2))'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(59, 130, 246, 0.8), rgba(59, 130, 246, 0.2))',
            color: 'black',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: isEnglish
                ? '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(34, 197, 94, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                : '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            filter: isEnglish
                ? 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.5)) drop-shadow(0 0 10px rgba(34, 197, 94, 0.4)) drop-shadow(0 0 15px rgba(34, 197, 94, 0.3))'
                : 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 10px rgba(59, 130, 246, 0.4)) drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))',
            transform: 'translateZ(20px) perspective(1000px) rotateX(5deg)',
            borderRadius: '50%',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            zIndex: 1,
            aspectRatio: '1.15',
            minWidth: '32px',
            minHeight: '28px',
            width: '32px',
            height: '28px',
        }, children: _jsx("span", { className: `transition-colors duration-200 font-bold ${languageClasses}`, children: isEnglish ? 'EN' : 'AF' }) }));
};
