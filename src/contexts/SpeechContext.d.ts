import React from 'react';
interface SpeechContextValue {
    isListening: boolean;
    transcriptLive: string;
    transcriptFinal: string;
    finalDelta: string;
    finalVersion: number;
    sessionOwner: string | null;
    startListening: (language?: string, ownerId?: string) => void;
    stopListening: (ownerId?: string) => void;
}
export declare function SpeechProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useSpeech(): SpeechContextValue;
export {};
