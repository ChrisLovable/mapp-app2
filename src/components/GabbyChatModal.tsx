import React, { useState, useRef, useEffect } from 'react';


interface GabbyChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'gabby';
  timestamp: Date;
}

const GABBY_GREETING_EN = "Hi! This is Gabby. How can I help you today?";
const GABBY_GREETING_AF = "Hallo! Dit is Gabby. Hoe kan ek jou vandag help?";


async function speakWithOpenAI(text: string, language: string) {
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
  } catch (error) {
    console.error('OpenAI TTS Error:', error);

  }
}

async function chatWithOpenAI(message: string, history: { role: "user"|"assistant", content: string }[], language: string) {
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
  } catch (error) {
    console.error('Chat API Error:', error);
    return language === 'af-ZA' 
      ? "Jammer, ek het probleme om te verbind op die oomblik."
      : "Sorry, I'm having trouble connecting right now.";
  }
}

export default function GabbyChatModal({ isOpen, onClose, language = 'en-US' }: GabbyChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user"|"assistant", content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastProcessedTranscript = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const sessionId = useRef<string>(Date.now().toString());
  const micDisabledUntil = useRef<number>(0);

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
      lastProcessedTranscript.current = ''; // Reset transcript tracking
      isProcessingRef.current = false; // Reset processing flag
      sessionId.current = Date.now().toString(); // New session ID
      micDisabledUntil.current = 0; // Reset mic disable timer
      initializeGabby();
    }
  }, [isOpen]);

  const initializeGabby = async () => {
    const greeting = language === 'af-ZA' ? GABBY_GREETING_AF : GABBY_GREETING_EN;
    const welcomeMessage: ChatMessage = {
      id: '1',
      text: greeting,
      sender: 'gabby',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setChatHistory([{ role: "assistant" as const, content: greeting }]);
    await speakWithOpenAI(greeting, language);
    // Removed automatic focus to prevent keyboard from opening
  };

  const handleSendMessage = async (msg?: string) => {
    const messageToSend = msg ?? inputMessage;
    if (!messageToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    const updatedHistory = [...chatHistory, { role: "user" as const, content: messageToSend }];
    setChatHistory(updatedHistory);

    try {
      const reply = await chatWithOpenAI(messageToSend, updatedHistory, language);
      
      const gabbyResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'gabby',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, gabbyResponse]);
      setChatHistory([...updatedHistory, { role: "assistant" as const, content: reply }]);
      await speakWithOpenAI(reply, language);

    } catch (error) {
      console.error('Error getting response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(language === 'af-ZA' 
        ? "Spraakherkenning word nie in hierdie blaaier ondersteun nie."
        : "Speech Recognition not supported in this browser.");
      return;
    }
    
    // Check if microphone is temporarily disabled
    const now = Date.now();
    if (now < micDisabledUntil.current) {
      console.log('Microphone temporarily disabled');
      return;
    }
    
    // Prevent multiple simultaneous recordings
    if (isListening || isProcessingRef.current) {
      return;
    }
    
    // Add a small delay to prevent rapid successive recordings on mobile
    setTimeout(() => {
      if (isListening || isProcessingRef.current || now < micDisabledUntil.current) {
        return;
      }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'af-ZA' ? "af-ZA" : "en-US";
    recognition.interimResults = false;
    recognition.continuous = false; // Keep false for mobile reliability
    recognition.maxAlternatives = 1;
    
    let hasProcessedResult = false;
    
    setIsListening(true);

    recognition.onresult = (event: any) => {
      // Only process when we have a final result
      const finalResults = Array.from(event.results).filter((result: any) => result.isFinal);
      
      if (finalResults.length === 0) {
        // Still processing, don't send yet
        return;
      }
      
      // Get the latest final transcript
      const latestFinalResult = finalResults[finalResults.length - 1] as any;
      const transcript = latestFinalResult[0].transcript;
      
      if (transcript && transcript.trim()) {
        // Check if this transcript was already processed
        if (lastProcessedTranscript.current === transcript.trim()) {
          console.log('Duplicate transcript prevented:', transcript.trim());
          return;
        }
        
        console.log('Processing final transcript:', transcript.trim(), 'Session:', sessionId.current);
        
        hasProcessedResult = true;
        isProcessingRef.current = true;
        lastProcessedTranscript.current = transcript.trim();
        
        // Disable microphone for 3 seconds to prevent rapid successive recordings
        micDisabledUntil.current = Date.now() + 3000;
        
        setInputMessage(transcript);
        handleSendMessage(transcript);
        setIsListening(false);
        recognition.stop();
        
        // Reset processing flag after a longer delay
        setTimeout(() => {
          isProcessingRef.current = false;
          console.log('Processing flag reset');
        }, 3000);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.log('Speech recognition error:', event.error);
      setIsListening(false);
      hasProcessedResult = false;
      isProcessingRef.current = false;
      micDisabledUntil.current = 0; // Reset mic disable timer on error
    };
    
    recognition.onend = () => {
      setIsListening(false);
      hasProcessedResult = false;
      isProcessingRef.current = false;
      micDisabledUntil.current = 0; // Reset mic disable timer on end
    };
    
    recognitionRef.current = recognition;
    recognition.start();
    }, 100); // 100ms delay
  };

  const stopListening = () => {
    recognitionRef.current && recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-2xl border-0 overflow-hidden"
        style={{
          height: '80vh',

          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(30, 58, 138, 0.2))',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4)',
          transform: 'translateZ(30px) perspective(1000px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
            borderBottom: '2px solid rgba(255, 255, 255, 0.4)',
            height: '80px !important',
            minHeight: '80px !important',
            maxHeight: '80px !important',
            overflow: 'hidden !important'
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img 
                src="/Gabby.jpg" 
                alt="Gabby" 
                className="w-10 h-10 rounded-full object-cover"
                style={{
                  filter: 'none',
                  border: '2px solid rgba(255, 255, 255, 0.4)'
                }}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0" style={{ minWidth: '0', flex: '1 1 auto', paddingRight: '10px' }}>
              <h2 
                className="text-white font-bold truncate gabby-modal-title" 
                style={{ 
                  fontSize: '1.2rem !important', 
                  lineHeight: '1.4rem !important',
                  margin: '0 !important',
                  padding: '0 !important',
                  overflow: 'hidden !important',
                  textOverflow: 'ellipsis !important',
                  whiteSpace: 'nowrap !important',
                  maxHeight: '1.4rem !important',
                  display: 'block !important'
                }}
              >
                Gabby Voice Chat
              </h2>
              <p 
                className="text-gray-300 truncate gabby-modal-subtitle" 
                style={{ 
                  fontSize: '0.8rem !important', 
                  lineHeight: '1rem !important',
                  margin: '0 !important',
                  padding: '0 !important',
                  overflow: 'hidden !important',
                  textOverflow: 'ellipsis !important',
                  whiteSpace: 'nowrap !important',
                  maxHeight: '1rem !important',
                  display: 'block !important'
                }}
              >
                AI Assistant with Voice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.4)',
              background: 'rgba(0, 0, 0, 0.6)'
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4" style={{ height: 'calc(100% - 160px)' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs opacity-60 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div
                className="bg-gray-700 text-white rounded-2xl px-4 py-2"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/20">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-xl text-white placeholder-gray-400"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
              disabled={isTyping}
            />
            {/* Microphone Button */}
            <button
              onClick={startListening}
              disabled={isTyping || isListening || Date.now() < micDisabledUntil.current}
              className="px-3 py-2 rounded-xl transition-colors flex items-center justify-center"
              style={{
                background: isListening ? '#dc2626' : Date.now() < micDisabledUntil.current ? '#666' : '#00cfff',
                color: '#fff',
                border: 'none',
                cursor: (isTyping || isListening || Date.now() < micDisabledUntil.current) ? 'not-allowed' : 'pointer',
                minWidth: '40px',
                opacity: Date.now() < micDisabledUntil.current ? 0.5 : 1
              }}
              aria-label={isListening ? "Listening..." : Date.now() < micDisabledUntil.current ? "Microphone disabled" : "Click to speak"}
            >
              {isListening ? "🎙️" : Date.now() < micDisabledUntil.current ? "⏸️" : "🎤"}
            </button>
            <button
              onClick={() => handleSendMessage()}
              disabled={isTyping || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              Send
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400 text-center">
            Click 🎤 to speak or type your message
          </div>
        </div>
      </div>
    </div>
  );
} 