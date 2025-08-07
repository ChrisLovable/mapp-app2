import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GlobalSpeechRecognition } from '../hooks/useGlobalSpeechRecognition';
import React, { useState, useRef, useEffect } from 'react';
const GABBY_GREETING_EN = "Hi! This is Gabby. How can I help you today?";
const GABBY_GREETING_AF = "Hallo! Dit is Gabby. Hoe kan ek jou vandag help?";
async function speakWithOpenAI(text, language) {
    try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OpenAI API key not found');
            return;
        }
        // Use OpenAI TTS directly
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: 'alloy', // You can change this to: alloy, echo, fable, onyx, nova, shimmer
                response_format: 'mp3',
                speed: 1.0
            })
        });
        if (!response.ok) {
            throw new Error(`OpenAI TTS error: ${response.status}`);
        }
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
        console.log('OpenAI TTS playing:', text);
    }
    catch (error) {
        console.error('OpenAI TTS Error:', error);
    }
}
async function chatWithOpenAI(message, history, language) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
        return language === 'af-ZA'
            ? "Jammer, ek is nie behoorlik gekonfigureer nie. Kontroleer asseblief die API-sleutel."
            : "Sorry, I'm not configured properly. Please check the API key.";
    }
    try {
        const systemPrompt = language === 'af-ZA'
            ? "Jy is Gabby, 'n vriendelike en behulpsame AI-assistent. Hou antwoorde bondig en gesprekke. Antwoord altyd in Afrikaans."
            : "You are Gabby, a friendly and helpful AI assistant. Keep responses concise and conversational.";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...history,
                    { role: "user", content: message }
                ],
                max_tokens: 200,
            })
        });
        if (!res.ok) {
            throw new Error(`Chat API error: ${res.status}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() ||
            (language === 'af-ZA' ? "Jammer, ek het dit nie verstaan nie." : "Sorry, I didn't understand that.");
    }
    catch (error) {
        console.error('Chat API Error:', error);
        return language === 'af-ZA'
            ? "Jammer, ek het probleme om te verbind op die oomblik."
            : "Sorry, I'm having trouble connecting right now.";
    }
}
export default function GabbyChatModal({ isOpen, onClose, language = 'en-US' }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const lastTranscriptRef = useRef('');
    // Debug logging
    useEffect(() => {
        console.log('GabbyChatModal rendered, isOpen:', isOpen);
    });
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // Initialize Gabby when modal opens
    useEffect(() => {
        if (isOpen) {
            // Clear previous conversation when modal opens
            setMessages([]);
            setChatHistory([]);
            setInputMessage('');
            initializeGabby();
        }
    }, [isOpen]);
    const initializeGabby = async () => {
        const greeting = language === 'af-ZA' ? GABBY_GREETING_AF : GABBY_GREETING_EN;
        const welcomeMessage = {
            id: '1',
            text: greeting,
            sender: 'gabby',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        setChatHistory([{ role: "assistant", content: greeting }]);
        await speakWithOpenAI(greeting, language);
        // Removed automatic focus to prevent keyboard from opening
    };
    const handleSendMessage = async (msg) => {
        const messageToSend = msg ?? inputMessage;
        if (!messageToSend.trim())
            return;
        const userMessage = {
            id: Date.now().toString(),
            text: messageToSend,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);
        const updatedHistory = [...chatHistory, { role: "user", content: messageToSend }];
        setChatHistory(updatedHistory);
        try {
            const reply = await chatWithOpenAI(messageToSend, updatedHistory, language);
            const gabbyResponse = {
                id: (Date.now() + 1).toString(),
                text: reply,
                sender: 'gabby',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, gabbyResponse]);
            setChatHistory([...updatedHistory, { role: "assistant", content: reply }]);
            await speakWithOpenAI(reply, language);
        }
        catch (error) {
            console.error('Error getting response:', error);
        }
        finally {
            setIsTyping(false);
        }
    };
    const handleMicClick = () => {
        if (isListening) {
            GlobalSpeechRecognition.stop();
            return;
        }
        setIsListening(true);
        lastTranscriptRef.current = '';
        GlobalSpeechRecognition.start(language, (transcript, isFinal) => {
            // Only append the new part of the transcript
            const newPart = transcript.replace(lastTranscriptRef.current, '');
            setInputMessage(prev => prev + newPart);
            lastTranscriptRef.current = transcript;
            if (isFinal) {
                handleSendMessage(transcript);
            }
        }, () => {
            setIsListening(false);
        }, (error) => {
            alert(`Speech recognition error: ${error}`);
            setIsListening(false);
        });
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx("div", { className: "absolute inset-0 bg-black bg-opacity-50", onClick: onClose }), _jsxs("div", { className: "relative w-full max-w-md rounded-2xl border-0 overflow-hidden", style: {
                    height: '80vh',
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(30, 58, 138, 0.2))',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4)',
                    transform: 'translateZ(30px) perspective(1000px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }, children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b border-white/20", style: {
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                            borderBottom: '2px solid rgba(255, 255, 255, 0.4)',
                            height: '80px !important',
                            minHeight: '80px !important',
                            maxHeight: '80px !important',
                            overflow: 'hidden !important'
                        }, children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: "/Gabby.jpg", alt: "Gabby", className: "w-10 h-10 rounded-full object-cover", style: {
                                                    filter: 'none',
                                                    border: '2px solid rgba(255, 255, 255, 0.4)'
                                                } }), _jsx("div", { className: "absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" })] }), _jsxs("div", { className: "flex-1 min-w-0", style: { minWidth: '0', flex: '1 1 auto', paddingRight: '10px' }, children: [_jsx("h2", { className: "text-white font-bold truncate gabby-modal-title", style: {
                                                    fontSize: '1.2rem !important',
                                                    lineHeight: '1.4rem !important',
                                                    margin: '0 !important',
                                                    padding: '0 !important',
                                                    overflow: 'hidden !important',
                                                    textOverflow: 'ellipsis !important',
                                                    whiteSpace: 'nowrap !important',
                                                    maxHeight: '1.4rem !important',
                                                    display: 'block !important'
                                                }, children: "Gabby Voice Chat" }), _jsx("p", { className: "text-gray-300 truncate gabby-modal-subtitle", style: {
                                                    fontSize: '0.8rem !important',
                                                    lineHeight: '1rem !important',
                                                    margin: '0 !important',
                                                    padding: '0 !important',
                                                    overflow: 'hidden !important',
                                                    textOverflow: 'ellipsis !important',
                                                    whiteSpace: 'nowrap !important',
                                                    maxHeight: '1rem !important',
                                                    display: 'block !important'
                                                }, children: "AI Assistant with Voice" })] })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors", style: {
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    background: 'rgba(0, 0, 0, 0.6)'
                                }, children: "\u00D7" })] }), _jsxs("div", { className: "flex-1 p-4 overflow-y-auto space-y-4", style: { height: 'calc(100% - 160px)' }, children: [messages.map((message) => (_jsx("div", { className: `flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`, children: _jsxs("div", { className: `max-w-[80%] rounded-2xl px-4 py-2 ${message.sender === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-white'}`, style: {
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }, children: [_jsx("p", { className: "text-sm", children: message.text }), _jsx("p", { className: "text-xs opacity-60 mt-1", children: message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] }) }, message.id))), isTyping && (_jsx("div", { className: "flex justify-start", children: _jsx("div", { className: "bg-gray-700 text-white rounded-2xl px-4 py-2", style: {
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }, children: _jsxs("div", { className: "flex space-x-1", children: [_jsx("div", { className: "w-2 h-2 bg-white rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-white rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-white rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] }) }) })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "p-4 border-t border-white/20", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { ref: inputRef, type: "text", value: inputMessage, onChange: (e) => setInputMessage(e.target.value), onKeyPress: handleKeyPress, placeholder: "Type your message...", className: "flex-1 px-4 py-2 rounded-xl text-white placeholder-gray-400", style: {
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)'
                                        }, disabled: isTyping }), _jsx("button", { onClick: handleMicClick, disabled: isTyping || isListening, className: "px-3 py-2 rounded-xl transition-colors flex items-center justify-center", style: {
                                            background: isListening ? '#dc2626' : '#00cfff',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: (isTyping || isListening) ? 'not-allowed' : 'pointer',
                                            minWidth: '40px',
                                            opacity: 1
                                        }, "aria-label": isListening ? "Listening..." : "Click to speak", children: isListening ? "🎙️" : "🎤" }), _jsx("button", { onClick: () => handleSendMessage(), disabled: isTyping || !inputMessage.trim(), className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors", children: "Send" })] }), _jsx("div", { className: "mt-2 text-xs text-gray-400 text-center", children: "Click \uD83C\uDFA4 to speak or type your message" })] })] })] }));
}
