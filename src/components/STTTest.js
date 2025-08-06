import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { SpeechToTextButton } from './SpeechToTextButton';
export const STTTest = () => {
    const [transcript, setTranscript] = useState('');
    const handleSTTResult = (text) => {
        setTranscript(text);
    };
    return (_jsxs("div", { className: "p-6 bg-black border border-white rounded-xl", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-4", children: "STT Test" }), _jsxs("div", { className: "flex gap-3 mb-4", children: [_jsx("input", { type: "text", value: transcript, onChange: (e) => setTranscript(e.target.value), placeholder: "Speech will appear here...", className: "flex-1 px-4 py-3 bg-black border-2 border-white rounded-xl text-white" }), _jsx(SpeechToTextButton, { onResult: handleSTTResult, onError: (error) => alert(error), size: "md" })] }), _jsx("p", { className: "text-gray-400 text-sm", children: "Click the microphone button and start speaking. The text should appear in real-time." })] }));
};
