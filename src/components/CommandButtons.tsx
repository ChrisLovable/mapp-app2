import { useState, useEffect } from 'react';
import './GridButton.css';

// Styled notification component
const StyledNotification: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return { ring: 'ring-green-400', bg: 'rgba(34, 197, 94, 0.2)' };
      case 'error': return { ring: 'ring-red-400', bg: 'rgba(239, 68, 68, 0.2)' };
      case 'info': return { ring: 'ring-blue-400', bg: 'rgba(59, 130, 246, 0.2)' };
      default: return { ring: 'ring-blue-400', bg: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]"
      style={{ animation: 'fadeInUp 0.3s ease-out' }}
    >
      <div 
        className={`glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ${colors.ring} ring-opacity-60`}
        style={{
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), ${colors.bg})`,
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
          filter: `drop-shadow(0 0 10px ${colors.ring.includes('green') ? 'rgba(34, 197, 94, 0.5)' : colors.ring.includes('red') ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'})`,
          transform: 'translateZ(30px) perspective(1000px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="text-3xl"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
              transform: 'translateZ(10px)'
            }}
          >
            {getIcon()}
          </div>
          <div className="flex-1">
            <p 
              className="text-white font-bold text-lg"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                transform: 'translateZ(5px)'
              }}
            >
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.4)',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)'
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Auto-close after 3 seconds
  };

  // Suppress browser clipboard notifications
  useEffect(() => {
    // Store original notification functions
    const originalNotification = window.Notification;
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    
    // Override browser notification functions during clipboard operations
    const suppressNotifications = () => {
      window.alert = () => {};
      window.confirm = () => true;
      if (window.Notification) {
        window.Notification = class {
          constructor() {
            // Silent notification - do nothing
          }
          static requestPermission = () => Promise.resolve('denied');
          static permission = 'denied';
        } as any;
      }
    };

    const restoreNotifications = () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.Notification = originalNotification;
    };

    // Suppress during component lifetime
    suppressNotifications();

    return () => {
      restoreNotifications();
    };
  }, []);

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
    console.log('🔵 Copy button clicked! Message to copy:', message);
    
    if (!message || message.trim() === '') {
      console.warn('⚠️ No text to copy');
      showNotification('No text to copy!', 'info');
      return;
    }
    
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        console.error('❌ Clipboard API not available');
        // Silent fallback method - no browser notifications
        const textarea = document.createElement('textarea');
        textarea.value = message;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('tabindex', '-1');
        document.body.appendChild(textarea);
        
        // Temporarily disable any potential notifications
        const originalConsoleLog = console.log;
        const originalAlert = window.alert;
        window.alert = () => {}; // Suppress any alerts
        
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
          const successful = document.execCommand('copy');
          console.log('✅ Copied using silent fallback method:', successful);
        } catch (err) {
          console.error('Copy command failed:', err);
        }
        
        // Restore original functions
        window.alert = originalAlert;
        
        document.body.removeChild(textarea);
      } else {
        await navigator.clipboard.writeText(message);
        console.log('✅ Copied using Clipboard API');
      }
      
      // Add visual feedback without focusing (prevents keyboard opening)
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        // Add pulsating effect without focusing or selecting
        textarea.classList.add('animate-pulse', 'ring-2', 'ring-blue-400', 'ring-opacity-60');
        
        // Remove the effect after 2 seconds
        setTimeout(() => {
          textarea.classList.remove('animate-pulse', 'ring-2', 'ring-blue-400', 'ring-opacity-60');
        }, 2000);
      }
      
      console.log('✅ Copy operation completed successfully');
      showNotification('📋 Text copied to clipboard!', 'success');
    } catch (err) {
      console.error('❌ Failed to copy text:', err);
      showNotification(`Copy failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handlePaste = async () => {
    console.log('🟢 Paste button clicked!');
    
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        console.error('❌ Clipboard API not available');
        showNotification('Clipboard API not supported in this browser', 'error');
        return;
      }
      
      // Request clipboard permission
      const permission = await navigator.permissions.query({ name: 'clipboard-read' as any });
      console.log('📋 Clipboard permission status:', permission.state);
      
      const text = await navigator.clipboard.readText();
      console.log('📋 Text from clipboard:', text);
      
      if (!text || text.trim() === '') {
        console.warn('⚠️ Clipboard is empty');
        showNotification('Clipboard is empty!', 'info');
        return;
      }
      
      const newMessage = message + text;
      addToHistory(newMessage);
      setMessage(newMessage);
      console.log('✅ Text pasted successfully:', newMessage);
      
      // Add visual feedback for paste action
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        
        // Add green pulsating effect to indicate paste
        textarea.classList.add('animate-pulse', 'ring-2', 'ring-green-400', 'ring-opacity-60');
        
        // Remove the effect after 1 second
        setTimeout(() => {
          textarea.classList.remove('animate-pulse', 'ring-2', 'ring-green-400', 'ring-opacity-60');
        }, 1000);
      }
      showNotification('📥 Text pasted successfully!', 'success');
    } catch (err) {
      console.error('❌ Failed to paste text:', err);
      showNotification(`Paste failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      
      // Show error feedback
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        
        // Add red pulsating effect to indicate error
        textarea.classList.add('animate-pulse', 'ring-2', 'ring-red-400', 'ring-opacity-60');
        
        // Remove the effect after 1 second
        setTimeout(() => {
          textarea.classList.remove('animate-pulse', 'ring-2', 'ring-red-400', 'ring-opacity-60');
        }, 1000);
      }
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
    <>
            <div className="grid grid-cols-4 gap-2 mt-2" style={{ width: '80vw', margin: '0 auto', marginTop: '25px', marginBottom: '30px' }}>
      {commands.map(cmd => (
        <button
          key={cmd}
          onClick={() => handleCommand(cmd)}
          disabled={cmd === 'UNDO' && historyIndex <= 0}
          onMouseDown={() => setActiveButton(cmd)}
          onMouseUp={() => setActiveButton(null)}
          onMouseLeave={() => setActiveButton(null)}
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
            width: 'calc(100% - 10px)',
            boxShadow: activeButton === cmd 
              ? '0 0 6px 1.5px rgba(255, 255, 255, 0.4), 0 0 8px 2px rgba(255, 255, 255, 0.3), 0 3px 6px rgba(255, 255, 255, 0.15)'
              : '0 0 3px 1px rgba(255, 255, 255, 0.3), 0 0 4px 1px rgba(255, 255, 255, 0.2), 0 2px 4px rgba(255, 255, 255, 0.1)',
            filter: activeButton === cmd 
              ? 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))'
              : 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4))',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {cmd}
        </button>
      ))}
    </div>
    
    {/* Styled Notification */}
    {notification && (
      <StyledNotification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(null)}
      />
    )}
  </>
  )
}
