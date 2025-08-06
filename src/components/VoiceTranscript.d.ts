import React from 'react';
interface VoiceTranscriptProps {
    isVisible: boolean;
    onToggleVisibility: () => void;
    userTranscript: string;
    gabbyTranscript: string;
    isListening: boolean;
    isSpeaking: boolean;
}
declare const VoiceTranscript: React.FC<VoiceTranscriptProps>;
export default VoiceTranscript;
