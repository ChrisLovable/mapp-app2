import React from 'react';
interface SpeechToTextButtonProps {
    onResult: (text: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    isListening?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'primary' | 'secondary';
    disabled?: boolean;
    children?: React.ReactNode;
}
export declare const SpeechToTextButton: React.FC<SpeechToTextButtonProps>;
export declare const ContinuousSpeechToTextButton: React.FC<SpeechToTextButtonProps>;
export declare const MobileSpeechToTextButton: React.FC<SpeechToTextButtonProps>;
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
export declare const TextToSpeechButton: React.FC<TextToSpeechButtonProps>;
interface LanguageToggleButtonProps {
    currentLanguage: string;
    onLanguageChange: (language: string) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'primary' | 'secondary';
    disabled?: boolean;
}
export declare const LanguageToggleButton: React.FC<LanguageToggleButtonProps>;
export {};
