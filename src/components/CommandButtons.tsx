import { useState, useEffect } from 'react';
import './GridButton.css';

interface Props {
  message: string;
  setMessage: (message: string) => void;
  clearKey?: number; // Add a key that changes when message is cleared externally
}

const commands = ["COPY", "PASTE", "UNDO", "CLEAR"]

export default function CommandButtons({ message, setMessage, clearKey }: Props) {
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lastMessage, setLastMessage] = useState('');

  // Reset history when clearKey changes (external clear)
  useEffect(() => {
    if (clearKey && clearKey > 0) {
      setHistory(['']);
      setHistoryIndex(0);
      setLastMessage('');
    }
  }, [clearKey]);

  // Track message changes and add to history
  useEffect(() => {
    if (message !== lastMessage) {
      // Only add to history if it's a significant change (not just cursor movement)
      if (Math.abs(message.length - lastMessage.length) > 0 || 
          (message.length > 0 && lastMessage.length === 0) ||
          (message.length === 0 && lastMessage.length > 0)) {
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(message);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      setLastMessage(message);
    }
  }, [message, lastMessage, history, historyIndex]);

  const addToHistory = (newMessage: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newMessage);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setLastMessage(newMessage);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      
      // Select all text in the textbox and add pulsating effect
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        textarea.focus();
        
        // Add pulsating effect
        textarea.classList.add('animate-pulse', 'ring-2', 'ring-blue-400', 'ring-opacity-60');
        
        // Remove the effect after 1 second
        setTimeout(() => {
          textarea.classList.remove('animate-pulse', 'ring-2', 'ring-blue-400', 'ring-opacity-60');
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const newMessage = message + text;
      addToHistory(newMessage);
      setMessage(newMessage);
    } catch (err) {
      console.error('Failed to paste text:', err);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMessage(history[newIndex]);
      setLastMessage(history[newIndex]);
    }
  };

  const handleClear = () => {
    // Clear the current message
    setMessage('');
    setLastMessage('');
    
    // Clear the history cache completely
    setHistory(['']);
    setHistoryIndex(0);
  };

  const handleCommand = (cmd: string) => {
    switch (cmd) {
      case 'COPY':
        handleCopy();
        break;
      case 'PASTE':
        handlePaste();
        break;
      case 'UNDO':
        handleUndo();
        break;
      case 'CLEAR':
        handleClear();
        break;
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {commands.map(cmd => (
        <button
          key={cmd}
          onClick={() => handleCommand(cmd)}
          disabled={cmd === 'UNDO' && historyIndex <= 0}
          className={`
            font-semibold text-[10px]
            rounded-2xl text-center p-3 select-none cursor-pointer
            border-0
            backdrop-blur-xl
            transition-all duration-200
            active:scale-95
            relative
            overflow-visible
            neon-grid-btn glassy-btn
            ${cmd === 'UNDO' && historyIndex <= 0 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer'
            }
          `}
          style={{
            background: '#111',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {cmd}
        </button>
      ))}
    </div>
  )
}
