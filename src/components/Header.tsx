import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onDashboardClick: () => void;
  onAdminDashboardClick?: () => void;
}

const menuOptions = [
  { label: 'User Preferences', icon: '⚙️', action: 'preferences' },
  // { label: 'Dashboard', icon: '📊', action: 'dashboard' }, // Hidden but data tracking remains active
  { label: 'Dashboard', icon: '🔧', action: 'admin' },
  { label: 'Personalization', icon: '🎨', action: 'personalization' },
  { label: 'Instructions', icon: '📚', action: 'instructions', hasSubmenu: true }
];

const instructionOptions = [
  { label: 'Ask AI', audioFile: 'ask-ai-instruction.mp3' },
  { label: 'Diary', audioFile: 'diary-instruction.mp3' },
  { label: 'Calendar', audioFile: 'calendar-instruction.mp3' },
  { label: 'Expenses', audioFile: 'expenses-instruction.mp3' },
  { label: 'To-Do', audioFile: 'todo-instruction.mp3' },
  { label: 'Shopping', audioFile: 'buy-instruction.mp3' },
  { label: 'Smart Recorder', audioFile: 'smart-recorder-instruction.mp3' },
  { label: 'Rewrite', audioFile: 'rewrite-instruction.mp3' },
  { label: 'Translate', audioFile: 'translate-instruction.mp3' },
  { label: 'Image to Text', audioFile: 'image-to-text-instruction.mp3' },
  { label: 'Read PDF', audioFile: 'read-pdf-instruction.mp3' },
  { label: 'AI Art', audioFile: 'text2imagefunction.mp3' }
];

export default function Header({ onDashboardClick, onAdminDashboardClick }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (action: string) => {
    if (action === 'instructions') {
      setInstructionsOpen(!instructionsOpen);
      return;
    }
    
    setOpen(false);
    setInstructionsOpen(false);
    
              if (action === 'dashboard') {
            onDashboardClick();
          } else if (action === 'admin' && onAdminDashboardClick) {
            onAdminDashboardClick();
          }
          // Add other actions as needed
  };

  const handleInstructionClick = (audioFile: string) => {
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsAudioPlaying(false);
      setCurrentAudio(null);
    }

    // Play the new audio instruction
    const audio = new Audio(`/audio/${audioFile}`);
    
    // Add event listeners for better user feedback
    audio.addEventListener('loadstart', () => {
      console.log(`Loading audio: ${audioFile}`);
    });
    
    audio.addEventListener('canplay', () => {
      console.log(`Audio ready to play: ${audioFile}`);
    });
    
    audio.addEventListener('play', () => {
      setIsAudioPlaying(true);
      setCurrentAudio(audio);
    });
    
    audio.addEventListener('ended', () => {
      setIsAudioPlaying(false);
      setCurrentAudio(null);
    });
    
    audio.addEventListener('error', (e) => {
      console.error(`Audio error for ${audioFile}:`, e);
      alert(`Audio instruction for ${audioFile} could not be loaded. Please check if the audio file exists in the /public/audio/ directory.`);
      setIsAudioPlaying(false);
      setCurrentAudio(null);
    });
    
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      // Fallback: show a message or alert
      alert(`Audio instruction for ${audioFile} could not be played. Please check if the audio file exists.`);
      setIsAudioPlaying(false);
      setCurrentAudio(null);
    });
  };

  const handleStopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsAudioPlaying(false);
      setCurrentAudio(null);
    }
  };

  // Handle clicking outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setInstructionsOpen(false);
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Hamburger Menu */}
      <div className="absolute left-0 top-0 flex items-center h-full" ref={menuRef}>
        <button
          className="glassy-rainbow-btn p-2 rounded-lg border-0 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 mt-16"
          style={{ border: '2px solid transparent', position: 'relative', zIndex: 2 }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
        >
          <span className="block w-4 h-0.5 bg-white mb-1 rounded"></span>
          <span className="block w-4 h-0.5 bg-white mb-1 rounded"></span>
          <span className="block w-4 h-0.5 bg-white rounded"></span>
        </button>
        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 mt-56 w-48 bg-black/90 border border-blue-400 rounded-xl shadow-lg z-[1000] animate-fade-in">
            {menuOptions.map((opt) => (
              <div key={opt.label}>
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-blue-600/30 cursor-pointer text-white text-base rounded-xl transition-all"
                  onClick={() => handleMenuClick(opt.action)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </div>
                  {opt.hasSubmenu && (
                    <span className="text-sm">▶</span>
                  )}
                </div>
                
                {/* Instructions Submenu */}
                {opt.hasSubmenu && instructionsOpen && (
                  <div className="absolute left-24 -mt-36 w-48 bg-black/80 border border-blue-400/50 rounded-lg z-[1000] animate-fade-in">
                    {/* Stop Audio Button - Only show when audio is playing */}
                    {isAudioPlaying && (
                      <div
                        className="flex items-center gap-2 px-3 py-2 hover:bg-red-600/30 cursor-pointer text-white text-sm transition-all border-b border-red-400/30"
                        onClick={handleStopAudio}
                      >
                        <span className="text-lg">⏹️</span>
                        <span>Stop Audio</span>
                      </div>
                    )}
                    {instructionOptions.map((instruction) => (
                      <div
                        key={instruction.label}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-blue-600/30 cursor-pointer text-white text-sm transition-all"
                        onClick={() => handleInstructionClick(instruction.audioFile)}
                      >
                        <span className="text-lg">🔊</span>
                        <span>{instruction.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        <div className="w-full text-center font-bold text-2xl drop-shadow-md relative flex flex-col items-center justify-center">
        </div>
    </div>
  );
}
