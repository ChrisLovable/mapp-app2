import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
const SpeechContext = createContext(undefined);
export function SpeechProvider({ children }) {
    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const languageRef = useRef('en-US');
    const [sessionOwner, setSessionOwner] = useState(null);
    const accumulatedFinalRef = useRef('');
    const lastResultIndexRef = useRef(0);
    const [transcriptLive, setTranscriptLive] = useState('');
    const [transcriptFinal, setTranscriptFinal] = useState('');
    const [finalDelta, setFinalDelta] = useState('');
    const [finalVersion, setFinalVersion] = useState(0);
    const startListening = useCallback((language, ownerId) => {
        if (isListening)
            return; // mic lock
        const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionImpl) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }
        languageRef.current = language || languageRef.current;
        const recognition = new SpeechRecognitionImpl();
        recognition.lang = languageRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = () => {
            setIsListening(true);
            accumulatedFinalRef.current = '';
            lastResultIndexRef.current = 0;
            setTranscriptFinal('');
            setTranscriptLive('');
            setFinalDelta('');
            setSessionOwner(ownerId || 'global');
        };
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let newFinalChunk = '';
            for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
                const result = event.results.item(i);
                const text = result.item(0).transcript;
                if (result.isFinal) {
                    newFinalChunk += text + ' ';
                }
                else {
                    interimTranscript += text;
                }
            }
            lastResultIndexRef.current = event.results.length;
            if (newFinalChunk) {
                const prevFinal = accumulatedFinalRef.current;
                accumulatedFinalRef.current = (prevFinal + ' ' + newFinalChunk).trim();
                setTranscriptFinal(accumulatedFinalRef.current);
                // Compute delta based on previous final
                const delta = accumulatedFinalRef.current.startsWith(prevFinal)
                    ? accumulatedFinalRef.current.slice(prevFinal.length).trim()
                    : newFinalChunk.trim();
                if (delta) {
                    setFinalDelta(delta);
                    setFinalVersion(v => v + 1);
                }
            }
            const live = interimTranscript
                ? (accumulatedFinalRef.current + ' ' + interimTranscript).trim()
                : accumulatedFinalRef.current;
            setTranscriptLive(live);
        };
        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
            setSessionOwner(null);
        };
        recognition.onerror = () => {
            setIsListening(false);
            recognitionRef.current = null;
            setSessionOwner(null);
        };
        try {
            recognitionRef.current = recognition;
            recognition.start();
        }
        catch {
            recognitionRef.current = null;
            setIsListening(false);
        }
    }, [isListening]);
    const stopListening = useCallback((ownerId) => {
        // If an owner is specified and it's not the current owner, ignore
        if (ownerId && sessionOwner && ownerId !== sessionOwner) {
            return;
        }
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            }
            catch { }
        }
        setIsListening(false);
        setSessionOwner(null);
    }, [sessionOwner]);
    const value = {
        isListening,
        transcriptLive,
        transcriptFinal,
        finalDelta,
        finalVersion,
        sessionOwner,
        startListening,
        stopListening,
    };
    return (_jsx(SpeechContext.Provider, { value: value, children: children }));
}
export function useSpeech() {
    const ctx = useContext(SpeechContext);
    if (!ctx)
        throw new Error('useSpeech must be used within SpeechProvider');
    return ctx;
}
