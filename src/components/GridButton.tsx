import type { ReactNode } from 'react';
import { useState } from 'react';
import './GridButton.css';

interface Props {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export default function GridButton({ label, icon, onClick }: Props) {
  const [isActive, setIsActive] = useState(false);
  
  const handleClick = () => {
    // If a custom onClick is provided, use it instead of default behavior
    if (onClick) {
      onClick();
      return;
    }

    // Default behavior for other buttons
    switch (label.toLowerCase()) {
      case 'ask me':
        // Handle Ask Me functionality
        console.log('Ask Me clicked');
        break;
      case 'alarm':
        // Handle Alarm functionality
        console.log('Alarm clicked');
        break;

      case 'notes':
        // Handle Notes functionality
        console.log('Notes clicked');
        break;
      case 'calculator':
        // Handle Calculator functionality
        console.log('Calculator clicked');
        break;
      default:
        console.log(`${label} clicked`);
    }
  };

    // Neon styles
  const defaultBoxShadow = '0 0 3px 1px rgba(255, 255, 255, 0.3), 0 0 4px 1px rgba(255, 255, 255, 0.2), 0 2px 4px rgba(255, 255, 255, 0.1)';
  const defaultFilter = 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4))';
  const activeBoxShadow = '0 0 6px 1.5px rgba(255, 255, 255, 0.4), 0 0 8px 2px rgba(255, 255, 255, 0.3), 0 3px 6px rgba(255, 255, 255, 0.15)';
  const activeFilter = 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))';

  // Create data-action attribute for Gabby to identify buttons
  const getDataAction = (label: string): string => {
    switch (label.toLowerCase()) {
      case 'ask me':
        return 'ai';
      case 'translate':
        return 'translate';
      case 'rewrite':
        return 'rewrite';
      case 'diary':
        return 'diary';
      case 'calendar':
        return 'calendar';
      case 'expenses':
        return 'expenses';
      case 'todo':
        return 'todo';
      case 'buy':
        return 'shopping';
      case 'image to text':
        return 'imageToText';
      case 'read pdf':
        return 'pdfReader';
      case 'ai art':
        return 'aiArt';
      default:
        return label.toLowerCase().replace(/\s+/g, '');
    }
  };

  return (
    <div className="
      font-semibold text-[12px]
      rounded-2xl text-center p-2 select-none cursor-pointer
      border-0
      backdrop-blur-xl
      transition-all duration-200
      active:scale-95
      relative
      overflow-visible
      neon-grid-btn glassy-btn
      h-[65px]
    "
    style={{
      background: '#111',
      color: 'white',
      width: '90px',
      boxShadow: isActive ? activeBoxShadow : defaultBoxShadow,
      filter: isActive ? activeFilter : defaultFilter,
      position: 'relative',
      zIndex: 1,
    } as React.CSSProperties}
    onClick={handleClick}
    onMouseDown={() => setIsActive(true)}
    onMouseUp={() => setIsActive(false)}
    onMouseLeave={() => setIsActive(false)}
    data-action={getDataAction(label)}
    data-label={label.toLowerCase()}
    >
      <div className="flex justify-center text-xl mb-0.5 drop-shadow-lg transition-transform duration-300 hover:scale-110">
        {icon || '🔹'}
      </div>
      <div className="leading-tight uppercase text-[10px]">
        {label}
      </div>
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        background: 'linear-gradient(120deg,rgba(255,255,255,0.15) 0%,rgba(255,255,255,0.05) 100%)',
        boxShadow: '0 1.5px 8px 0 rgba(255,255,255,0.10) inset',
        mixBlendMode: 'overlay',
      }} />
    </div>
  );
}