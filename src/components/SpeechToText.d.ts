import React from 'react';
interface SpeechToTextProps {
    onTranscriptChange: (transcript: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    language?: string;
    className?: string;
    children?: React.ReactNode;
}
export declare const SpeechToText: React.FC<SpeechToTextProps>;
export default SpeechToText;
