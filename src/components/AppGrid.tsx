import GridButton from './GridButton'
import { 
  MdAlarm, 
  MdTranslate, 
  MdTableChart,
  MdPictureAsPdf, 
  MdImage, 
  MdWbSunny, 
  MdWhatsapp, 
  MdEmail, 
  MdCalendarToday
} from 'react-icons/md'
import { 
  FaRocket, 
  FaBrain, 
  FaShieldAlt, 
  FaMagic, 
  FaCrown, 
  FaStar, 
  FaGem, 
  FaDragon,
  FaMicrophone,
  FaBook,
  FaPalette
} from 'react-icons/fa'
import { useRef, useEffect } from 'react';

interface AppGridProps {
  onAskAIClick: () => void;
  onTranslateClick: () => void;
  onRewriteClick: () => void;
  onDiaryClick: () => void;
  onCalendarClick: () => void;
  onExpenseClick: () => void;
  onTodoClick: () => void;
  onShoppingClick: () => void;
  onImageToTextClick: () => void;
  onPdfReaderClick: () => void;
  onMeetingMinutesClick: () => void;
  onSmartMeetingRecorderClick: () => void;
  onImageGeneratorClick: () => void;
  onExpenseJournalClick: () => void;
  onTokenDashboardClick: () => void;
  onAdminDashboardClick: () => void;
}

// Add custom animated DiaryBookIcon
function DiaryBookIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="diary-book-icon">
      <defs>
        <linearGradient id="rainbow-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Left cover */}
      <rect x="5" y="7" width="9" height="16" rx="2" fill="#181a1b" stroke="url(#rainbow-gradient)" strokeWidth="1.5" transform="skewY(-10)"/>
      {/* Right cover */}
      <rect x="18" y="7" width="9" height="16" rx="2" fill="#232526" stroke="url(#rainbow-gradient)" strokeWidth="1.5" transform="skewY(10)"/>
      {/* Spine */}
      <rect x="14.5" y="7" width="3" height="16" rx="1.2" fill="#222" stroke="url(#rainbow-gradient)" strokeWidth="1.1"/>
      {/* Page lines left */}
      <line x1="7" y1="10" x2="13" y2="10" stroke="url(#rainbow-gradient)" strokeWidth="0.5"/>
      <line x1="7" y1="13" x2="13" y2="13" stroke="url(#rainbow-gradient)" strokeWidth="0.4"/>
      <line x1="7" y1="16" x2="13" y2="16" stroke="url(#rainbow-gradient)" strokeWidth="0.3"/>
      {/* Page lines right */}
      <line x1="19" y1="10" x2="25" y2="10" stroke="url(#rainbow-gradient)" strokeWidth="0.5"/>
      <line x1="19" y1="13" x2="25" y2="13" stroke="url(#rainbow-gradient)" strokeWidth="0.4"/>
      <line x1="19" y1="16" x2="25" y2="16" stroke="url(#rainbow-gradient)" strokeWidth="0.3"/>
    </svg>
  );
}



// Custom animated SVG icons for each button
function AlarmIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-alarm" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx="16" cy="18" r="8" fill="#181a1b" stroke="url(#rainbow-gradient-alarm)" strokeWidth="2"/>
      <rect x="15" y="12" width="2" height="6" rx="1" fill="#fff" stroke="url(#rainbow-gradient-alarm)" strokeWidth="0.7"/>
      <circle cx="16" cy="18" r="1.5" fill="#fff" stroke="url(#rainbow-gradient-alarm)" strokeWidth="0.7"/>
      <path d="M8 8 L4 4" stroke="url(#rainbow-gradient-alarm)" strokeWidth="1.2"/>
      <path d="M24 8 L28 4" stroke="url(#rainbow-gradient-alarm)" strokeWidth="1.2"/>
    </svg>
  );
}
function TranslateIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-translate" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
        <radialGradient id="earth-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(0, 255, 247, 0.3)"/>
          <stop offset="100%" stopColor="rgba(0, 255, 247, 0)"/>
        </radialGradient>
      </defs>
      {/* Earth glow effect */}
      <circle cx="16" cy="16" r="12" fill="url(#earth-glow)"/>
      {/* Main earth sphere */}
      <circle cx="16" cy="16" r="10" fill="#1a4d80" stroke="url(#rainbow-gradient-translate)" strokeWidth="1.5"/>
      {/* Continents - simplified shapes */}
      {/* North America */}
      <path d="M8 12 Q6 10 8 8 Q10 6 12 8 Q11 10 10 12 Q9 13 8 12" fill="#4a7c59" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.3"/>
      {/* South America */}
      <path d="M10 14 Q9 16 10 18 Q11 20 12 18 Q12 16 11 14 Q10.5 13 10 14" fill="#4a7c59" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.3"/>
      {/* Europe/Asia */}
      <path d="M14 8 Q16 7 18 8 Q19 9 18 10 Q17 11 16 10 Q15 9 14 8" fill="#4a7c59" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.3"/>
      {/* Africa */}
      <path d="M15 10 Q16 11 17 12 Q16 14 15 15 Q14 14 14 12 Q15 11 15 10" fill="#4a7c59" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.3"/>
      {/* Australia */}
      <path d="M20 18 Q21 17 22 18 Q21 19 20 20 Q19 19 20 18" fill="#4a7c59" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.3"/>
      {/* Meridian lines */}
      <path d="M6 16 Q16 6 26 16" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.6" fill="none" opacity="0.7"/>
      <path d="M6 16 Q16 26 26 16" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.6" fill="none" opacity="0.7"/>
      {/* Parallel lines */}
      <path d="M6 12 Q16 12 26 12" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.4" fill="none" opacity="0.5"/>
      <path d="M6 20 Q16 20 26 20" stroke="url(#rainbow-gradient-translate)" strokeWidth="0.4" fill="none" opacity="0.5"/>
      {/* Translation arrows */}
      <path d="M7 7 L11 7 M9 5 L9 9" stroke="url(#rainbow-gradient-translate)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M25 25 L21 25 M23 23 L23 27" stroke="url(#rainbow-gradient-translate)" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Holographic highlights */}
      <circle cx="12" cy="12" r="1" fill="rgba(255, 255, 255, 0.3)" opacity="0.6"/>
      <circle cx="20" cy="20" r="0.8" fill="rgba(255, 255, 255, 0.2)" opacity="0.4"/>
    </svg>
  );
}
function RewriteIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-rewrite" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Circular arrow representing rewrite/refresh */}
      <circle cx="16" cy="16" r="10" fill="none" stroke="url(#rainbow-gradient-rewrite)" strokeWidth="2" strokeDasharray="2 2"/>
      {/* Arrow head */}
      <path d="M22 10 L26 14 L22 18" stroke="url(#rainbow-gradient-rewrite)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Arrow tail */}
      <path d="M26 14 L18 14" stroke="url(#rainbow-gradient-rewrite)" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Center dot */}
      <circle cx="16" cy="16" r="2" fill="#181a1b" stroke="url(#rainbow-gradient-rewrite)" strokeWidth="1"/>
      {/* Text editing lines */}
      <line x1="8" y1="20" x2="12" y2="20" stroke="url(#rainbow-gradient-rewrite)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="23" x2="14" y2="23" stroke="url(#rainbow-gradient-rewrite)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="26" x2="10" y2="26" stroke="url(#rainbow-gradient-rewrite)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ReadPdfIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-pdf" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Document body */}
      <rect x="7" y="6" width="16" height="20" rx="3" fill="#181a1b" stroke="url(#rainbow-gradient-pdf)" strokeWidth="2"/>
      {/* Folded corner */}
      <polygon points="19,6 23,10 19,10" fill="#232526" stroke="url(#rainbow-gradient-pdf)" strokeWidth="1.2"/>
      {/* PDF text */}
      <text x="10" y="22" fontSize="7" fontWeight="bold" fill="url(#rainbow-gradient-pdf)">PDF</text>
    </svg>
  );
}

function ImageToTextIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-imgtxt" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Picture frame */}
      <rect x="6" y="8" width="14" height="12" rx="2" fill="#181a1b" stroke="url(#rainbow-gradient-imgtxt)" strokeWidth="1.7"/>
      {/* Sun */}
      <circle cx="10" cy="12" r="1.5" fill="#fff" stroke="url(#rainbow-gradient-imgtxt)" strokeWidth="0.7"/>
      {/* Mountain */}
      <polyline points="8,18 12,14 15,17 18,13 20,18" fill="none" stroke="url(#rainbow-gradient-imgtxt)" strokeWidth="1.2"/>
      {/* T for text */}
      <text x="22" y="20" fontSize="8" fontWeight="bold" fill="url(#rainbow-gradient-imgtxt)">T</text>
    </svg>
  );
}

function TodoChecklistIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-todo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Clipboard/checklist base */}
      <rect x="6" y="6" width="20" height="20" rx="2" fill="#181a1b" stroke="url(#rainbow-gradient-todo)" strokeWidth="1.5"/>
      {/* Clipboard top clip */}
      <rect x="10" y="4" width="12" height="4" rx="2" fill="#222" stroke="url(#rainbow-gradient-todo)" strokeWidth="1"/>
      {/* Checkbox 1 */}
      <rect x="8" y="10" width="3" height="3" rx="0.5" fill="#181a1b" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8"/>
      <path d="M9 12 L10.5 13.5 L11.5 11.5" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Task line 1 */}
      <line x1="13" y1="11.5" x2="22" y2="11.5" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8"/>
      {/* Checkbox 2 */}
      <rect x="8" y="15" width="3" height="3" rx="0.5" fill="#181a1b" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8"/>
      <path d="M9 17 L10.5 18.5 L11.5 16.5" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Task line 2 */}
      <line x1="13" y1="16.5" x2="20" y2="16.5" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8"/>
      {/* Checkbox 3 (unchecked) */}
      <rect x="8" y="20" width="3" height="3" rx="0.5" fill="#181a1b" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8"/>
      {/* Task line 3 */}
      <line x1="13" y1="21.5" x2="18" y2="21.5" stroke="url(#rainbow-gradient-todo)" strokeWidth="0.8"/>
    </svg>
  );
}

function ExpensesDollarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-expenses" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Dollar sign */}
      <text x="8" y="24" fontSize="20" fontWeight="bold" fill="url(#rainbow-gradient-expenses)">$</text>
    </svg>
  );
}

function SmartRecorderMicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-mic" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Mic body */}
      <rect x="13" y="8" width="6" height="12" rx="3" fill="#181a1b" stroke="url(#rainbow-gradient-mic)" strokeWidth="1.5"/>
      {/* Mic grill lines */}
      <line x1="14" y1="11" x2="18" y2="11" stroke="url(#rainbow-gradient-mic)" strokeWidth="0.7"/>
      <line x1="14" y1="13" x2="18" y2="13" stroke="url(#rainbow-gradient-mic)" strokeWidth="0.7"/>
      <line x1="14" y1="15" x2="18" y2="15" stroke="url(#rainbow-gradient-mic)" strokeWidth="0.7"/>
      {/* Mic base */}
      <rect x="15" y="20" width="2" height="3" rx="1" fill="#222" stroke="url(#rainbow-gradient-mic)" strokeWidth="1"/>
      {/* Mic stand */}
      <rect x="13" y="24" width="6" height="1.2" rx="0.6" fill="#222" stroke="url(#rainbow-gradient-mic)" strokeWidth="0.7"/>
    </svg>
  );
}

function ShoppingTrolleyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-trolley" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Shopping trolley basket */}
      <rect x="6" y="12" width="16" height="10" rx="2" fill="#181a1b" stroke="url(#rainbow-gradient-trolley)" strokeWidth="1.5"/>
      {/* Trolley handle */}
      <rect x="20" y="8" width="8" height="2" rx="1" fill="#222" stroke="url(#rainbow-gradient-trolley)" strokeWidth="1"/>
      <rect x="26" y="6" width="2" height="6" rx="1" fill="#222" stroke="url(#rainbow-gradient-trolley)" strokeWidth="1"/>
      {/* Trolley wheels */}
      <circle cx="10" cy="24" r="2" fill="#fff" stroke="url(#rainbow-gradient-trolley)" strokeWidth="1"/>
      <circle cx="18" cy="24" r="2" fill="#fff" stroke="url(#rainbow-gradient-trolley)" strokeWidth="1"/>
      {/* Trolley base */}
      <rect x="8" y="20" width="12" height="1.5" rx="0.8" fill="#222" stroke="url(#rainbow-gradient-trolley)" strokeWidth="0.7"/>
      {/* Shopping items in trolley */}
      <circle cx="10" cy="16" r="1" fill="#fff" stroke="url(#rainbow-gradient-trolley)" strokeWidth="0.5"/>
      <circle cx="14" cy="15" r="0.8" fill="#fff" stroke="url(#rainbow-gradient-trolley)" strokeWidth="0.5"/>
      <circle cx="18" cy="16" r="1.2" fill="#fff" stroke="url(#rainbow-gradient-trolley)" strokeWidth="0.5"/>
    </svg>
  );
}

function AskAIIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="ask-ai-icon">
      <defs>
        <linearGradient id="rainbow-gradient-ask" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Question mark body */}
      <path d="M16 8c3 0 5 2 5 4.5 0 2.5-2 3.5-3.5 3.5-1.5 0-2.5 1-2.5 2.5 0 1.5 1 2.5 2.5 2.5" stroke="url(#rainbow-gradient-ask)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      {/* Dot */}
      <circle cx="16" cy="24" r="1.5" fill="#181a1b" stroke="url(#rainbow-gradient-ask)" strokeWidth="1.2"/>
      {/* AI brain symbol overlay */}
      <circle cx="20" cy="12" r="2" fill="#181a1b" stroke="url(#rainbow-gradient-ask)" strokeWidth="1"/>
      <path d="M19 11 Q20 10 21 11 Q20 12 19 11" fill="none" stroke="url(#rainbow-gradient-ask)" strokeWidth="0.6"/>
      <path d="M19 13 Q20 14 21 13 Q20 12 19 13" fill="none" stroke="url(#rainbow-gradient-ask)" strokeWidth="0.6"/>
    </svg>
  );
}

function CreateAIImageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rainbow-gradient-aiart" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff00cc">
            <animate attributeName="stop-color" values="#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff;#ff00cc" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#00fff7">
            <animate attributeName="stop-color" values="#00fff7;#0066ff;#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7" dur="3s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#8f00ff">
            <animate attributeName="stop-color" values="#8f00ff;#ff00cc;#ffee00;#00ff00;#00fff7;#0066ff;#8f00ff" dur="3s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      {/* Canvas/easel frame */}
      <rect x="4" y="6" width="20" height="16" rx="2" fill="#181a1b" stroke="url(#rainbow-gradient-aiart)" strokeWidth="1.5"/>
      {/* AI brain symbol */}
      <circle cx="14" cy="12" r="3" fill="#181a1b" stroke="url(#rainbow-gradient-aiart)" strokeWidth="1.2"/>
      <path d="M12 10 Q14 8 16 10 Q14 12 12 10" fill="none" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.8"/>
      <path d="M12 14 Q14 16 16 14 Q14 12 12 14" fill="none" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.8"/>
      <path d="M10 12 Q8 14 10 16 Q12 14 10 12" fill="none" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.8"/>
      <path d="M18 12 Q20 14 18 16 Q16 14 18 12" fill="none" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.8"/>
      {/* Paintbrush */}
      <rect x="22" y="8" width="6" height="2" rx="1" transform="rotate(-30 22 8)" fill="#222" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.8"/>
      <polygon points="24,6 26,8 24,10" fill="#fff" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.6"/>
      {/* Paint palette */}
      <circle cx="24" cy="20" r="2.5" fill="#181a1b" stroke="url(#rainbow-gradient-aiart)" strokeWidth="1"/>
      <circle cx="23" cy="19" r="0.4" fill="#ff0000" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.3"/>
      <circle cx="25" cy="19" r="0.4" fill="#00ff00" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.3"/>
      <circle cx="24" cy="21" r="0.4" fill="#0000ff" stroke="url(#rainbow-gradient-aiart)" strokeWidth="0.3"/>
    </svg>
  );
}

const buttons = [
  { label: "ASK AI", icon: <AskAIIcon /> },
  { label: "Diary", icon: <DiaryBookIcon /> },
  { label: "Calendar", icon: <AlarmIcon /> },
  { label: "Expenses", icon: <ExpensesDollarIcon /> },
  { label: "To-Do", icon: <TodoChecklistIcon /> },
  { label: "BUY", icon: <ShoppingTrolleyIcon /> },
  { label: "Smart Recorder", icon: <SmartRecorderMicIcon /> },
  { label: "Rewrite", icon: <RewriteIcon /> },
  { label: "Translate", icon: <TranslateIcon /> },
  { label: "Image to Text", icon: <ImageToTextIcon /> },
  { label: "Read PDF", icon: <ReadPdfIcon /> },
  { label: "AI Art", icon: <CreateAIImageIcon /> }
]

export default function AppGrid(props: AppGridProps) {
  return (
    <div className="relative w-full h-full">
      {/* FloatingNeonTextInGridButton removed */}
      <div className="grid grid-cols-3 mt-4 relative z-10 justify-items-center" style={{ gap: '5px', rowGap: '15px', width: '80vw', margin: '0 auto' }}>
        {buttons.map((button, i) => (
          <GridButton 
            key={i} 
            label={button.label} 
            icon={button.icon}
            onClick={
              button.label === "ASK AI"
                ? props.onAskAIClick
                : button.label === "Diary"
                ? props.onDiaryClick
                : button.label === "Calendar"
                ? props.onCalendarClick
                : button.label === "Translate"
                ? props.onTranslateClick
                : button.label === "Rewrite"
                ? props.onRewriteClick
                : button.label === "Read PDF"
                ? props.onPdfReaderClick
                : button.label === "Image to Text"
                ? props.onImageToTextClick
                : button.label === "To-Do"
                ? props.onTodoClick
                : button.label === "BUY"
                ? props.onShoppingClick
                : button.label === "Expenses"
                ? props.onExpenseClick
                : button.label === "Smart Recorder"
                ? props.onSmartMeetingRecorderClick
                : button.label === "AI Art"
                ? props.onImageGeneratorClick
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
}