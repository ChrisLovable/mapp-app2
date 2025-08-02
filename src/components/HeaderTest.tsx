import { useState, useRef, useEffect } from 'react';

const menuOptions = [
  { label: 'Personalize', icon: '🎨', hasSubmenu: true },
  { label: 'Dashboard', icon: '📊', action: 'dashboard' },
  { label: 'Instruction videos', icon: '🎥' },
];

const themeOptions = [
  { label: 'Dark Mode', value: 'dark', icon: '🌙' },
  { label: 'Light Mode', value: 'light', icon: '☀️' },
  { label: 'Pink Theme', value: 'pink', icon: '🌸' },
  { label: 'Red Theme', value: 'red', icon: '🔴' },
  { label: 'Blue Theme', value: 'blue', icon: '🔵' },
  { label: 'Green Theme', value: 'green', icon: '🟢' },
];

interface HeaderTestProps {
  onDashboardClick?: () => void;
}

export default function HeaderTest({ onDashboardClick }: HeaderTestProps) {
  const [open, setOpen] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('blue');
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'blue';
    setCurrentTheme(savedTheme);
    document.documentElement.className = `theme-${savedTheme}`;
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setPersonalizeOpen(false);
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

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    setPersonalizeOpen(false);
    setOpen(false);
    
    // Apply theme to document
    document.documentElement.className = `theme-${theme}`;
    
    // Store theme preference
    localStorage.setItem('theme', theme);
  };

  const handlePersonalizeClick = () => {
    setPersonalizeOpen(!personalizeOpen);
  };

  return (
    <div className="relative flex items-center justify-between w-full">
      {/* Hamburger Menu */}
      <div className="flex items-center" ref={menuRef}>
        <button
          className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
        >
          <span className="block w-6 h-0.5 bg-white mb-1 rounded"></span>
          <span className="block w-6 h-0.5 bg-white mb-1 rounded"></span>
          <span className="block w-6 h-0.5 bg-white rounded"></span>
        </button>
        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 top-16 w-48 bg-black/90 border border-white rounded-xl shadow-lg z-50">
            {menuOptions.map((opt) => (
              <div key={opt.label}>
                <div
                  className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-blue-600/30 cursor-pointer text-white text-base rounded-xl transition-all"
                  onClick={() => {
                    if (opt.hasSubmenu) {
                      handlePersonalizeClick();
                    } else if (opt.action === 'dashboard' && onDashboardClick) {
                      onDashboardClick();
                      setOpen(false);
                    } else {
                      setOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{opt.icon}</span>
                    <span>{opt.label}</span>
                  </div>
                  {opt.hasSubmenu && (
                    <span className="text-sm">▶</span>
                  )}
                </div>
                
                {/* Personalize Submenu */}
                {opt.hasSubmenu && personalizeOpen && (
                  <div className="ml-4 mt-1 bg-black/80 border border-white/50 rounded-lg">
                    {themeOptions.map((theme) => (
                      <div
                        key={theme.value}
                        className={`flex items-center gap-2 px-3 py-2 hover:bg-blue-600/30 cursor-pointer text-white text-sm transition-all ${
                          currentTheme === theme.value ? 'bg-blue-600/50' : ''
                        }`}
                        onClick={() => handleThemeChange(theme.value)}
                      >
                        <span className="text-lg">{theme.icon}</span>
                        <span>{theme.label}</span>
                        {currentTheme === theme.value && (
                          <span className="ml-auto text-blue-400">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Right side spacer for symmetry */}
      <div className="w-10" />
    </div>
  );
} 