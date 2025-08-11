import React, { useEffect, useRef, useState } from 'react';
import { useSpeech } from '../contexts/SpeechContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'gabby';
  timestamp: Date;
};

async function speakWithElevenLabs(text: string, language?: string) {
  const resp = await fetch('/api/elevenlabs-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language })
  });
  if (!resp.ok) {
    throw new Error(`ElevenLabs TTS failed: ${resp.status}`);
  }
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => reject(new Error('Audio playback error'));
    audio.play().catch(reject);
  });
}

async function fetchChatReply(message: string, history: { role: 'user' | 'assistant'; content: string }[], language: string) {
  const res = await fetch('/api/openai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, language })
  });
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  const data = await res.json();
  return (data?.reply || '').trim();
}

export default function VoiceOnlyChatModal({ isOpen, onClose, language = 'en-US' }: Props) {
  const { isListening, startListening, stopListening, transcriptLive, transcriptFinal, finalVersion, sessionOwner } = useSpeech();
  const ownerIdRef = useRef('voice-only-modal');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingUserText, setPendingUserText] = useState('');
  const composingIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number | null>(null);
  const chatHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const IDLE_TIMEOUT_MS = 2000;

  useEffect(() => {
    if (isOpen) {
      // Reset state for fresh session
      setMessages([]);
      setPendingUserText('');
      composingIdRef.current = null;
      chatHistoryRef.current = [];

      // Greeting
      const greeting = language.toLowerCase().startsWith('af')
        ? "Hi.  Ek is Gabby. Hoe kan ek jou help vandag?"
        : 'Hi! This is Gabby. How can I help you today?';
      const welcome: ChatMessage = { id: 'greet', text: greeting, sender: 'gabby', timestamp: new Date() };
      setMessages([welcome]);
      // Play greeting with TTS while mic is paused
      (async () => {
        try {
          setIsSpeaking(true);
          await stopListening(ownerIdRef.current);
          await speakWithElevenLabs(greeting, language);
        } finally {
          setIsSpeaking(false);
          startListening(language, ownerIdRef.current);
        }
      })();

      // Mic will be (re)started after greeting above
    }
    return () => {
      stopListening(ownerIdRef.current);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live composing bubble
  useEffect(() => {
    if (!isOpen) return;
    if (sessionOwner !== ownerIdRef.current) return;
    if (isSpeaking) return; // ignore loopback while TTS is playing
    const live = (transcriptLive || '').trim();
    if (!live) return;
    if (!composingIdRef.current) {
      const id = `compose-${Date.now()}`;
      composingIdRef.current = id;
      setMessages(prev => [...prev, { id, text: live, sender: 'user', timestamp: new Date() }]);
    } else {
      const id = composingIdRef.current;
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, text: live } : m)));
    }
    setPendingUserText(live);

    // Reset idle finalize timer
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(async () => {
      await finalizeAndSend();
    }, IDLE_TIMEOUT_MS);
  }, [transcriptLive, sessionOwner, isSpeaking]);

  const finalizeAndSend = async (overrideText?: string) => {
    const text = (overrideText ?? pendingUserText).trim();
    if (!text) return;
    const id = composingIdRef.current;
    composingIdRef.current = null;
    if (idleTimerRef.current) { window.clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }

    // ensure composing bubble is kept as final text
    if (id) {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, text } : m)));
    } else {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, text, sender: 'user', timestamp: new Date() }]);
    }

    // Build history and fetch reply
    const history = [
      ...chatHistoryRef.current,
      { role: 'user' as const, content: text }
    ];
    try {
      const reply = await fetchChatReply(text, history, language);
      chatHistoryRef.current = [...history, { role: 'assistant', content: reply }];
      const gabby: ChatMessage = { id: `g-${Date.now()}`, text: reply, sender: 'gabby', timestamp: new Date() };
      setMessages(prev => [...prev, gabby]);
      // Pause mic while speaking to avoid echo/loopback
      try {
        setIsSpeaking(true);
        await stopListening(ownerIdRef.current);
        await speakWithElevenLabs(reply, language);
      } finally {
        setIsSpeaking(false);
        startListening(language, ownerIdRef.current);
      }
    } catch (err) {
      const errMsg = language.toLowerCase().startsWith('af') ? 'Jammer, die bediener het gefaal.' : 'Sorry, server error.';
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, text: errMsg, sender: 'gabby', timestamp: new Date() }]);
    }
    // clear after reply handling to avoid cutting the last token
    setPendingUserText('');
  };

  // Finalize immediately on final STT event to avoid last-word truncation
  useEffect(() => {
    if (!isOpen) return;
    if (sessionOwner !== ownerIdRef.current) return;
    if (isSpeaking) return;
    const finalText = (transcriptFinal || '').trim();
    if (!finalText) return;
    // Update composing bubble to the final text
    if (composingIdRef.current) {
      const id = composingIdRef.current;
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, text: finalText } : m)));
    } else {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, text: finalText, sender: 'user', timestamp: new Date() }]);
    }
    setPendingUserText(finalText);
    if (idleTimerRef.current) { window.clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    // Finalize now using the confirmed final transcript
    finalizeAndSend(finalText);
  }, [finalVersion]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          height: '80vh',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.85), rgba(30,58,138,0.25))',
          border: '2px solid rgba(255,255,255,0.35)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <img src="/Gabby.jpg" className="w-10 h-10 rounded-full border border-white/40" />
            <div>
              <div className="text-white font-bold">Gabby Voice Chat</div>
              <div className="text-gray-300 text-xs">Voice only · {isSpeaking ? 'Speaking…' : (isListening ? 'Listening…' : 'Tap mic to speak')}</div>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full text-white" style={{ border: '1px solid rgba(255,255,255,0.4)' }}>×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ height: 'calc(100% - 120px)' }}>
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                <div className="text-[10px] opacity-60 mt-1">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer: Mic only */}
        <div className="p-4 border-t border-white/20 flex items-center justify-center gap-3">
          <button
            onClick={() => { if (!isListening) startListening(language, ownerIdRef.current); }}
            className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-xl"
            style={{
              background: isListening ? 'linear-gradient(135deg, rgba(220,38,38,0.95), rgba(220,38,38,0.8))' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
              border: '2px solid rgba(255,255,255,0.4)'
            }}
            aria-label={isListening ? 'Listening' : 'Tap to speak'}
            title={isListening ? 'Listening' : 'Tap to speak'}
          >
            {isListening ? '🎙️' : '🎤'}
          </button>
        </div>
      </div>
    </div>
  );
}


