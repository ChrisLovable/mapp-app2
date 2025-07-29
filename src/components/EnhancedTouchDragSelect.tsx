import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SelectionActions {
  copy: () => void;
  sendToAI: () => void;
  translate: () => void;
  rewrite: () => void;
  share: () => void;
}

interface EnhancedTouchDragSelectProps {
  text: string;
  onSelect?: (selected: string, actions: SelectionActions) => void;
  className?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
  features?: {
    showHandles?: boolean;
    showActions?: boolean;
    autoCopy?: boolean;
    selectionMode?: 'word' | 'sentence' | 'custom';
  };
}

interface SelectionPosition {
  start: number;
  end: number;
  text: string;
}

interface MenuPosition {
  x: number;
  y: number;
}

const EnhancedTouchDragSelect = ({ 
  text, 
  onSelect, 
  className = '',
  placeholder = '',
  onChange,
  features = {
    showHandles: true,
    showActions: true,
    autoCopy: false,
    selectionMode: 'custom'
  }
}: EnhancedTouchDragSelectProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentText, setCurrentText] = useState(text);
  const [selection, setSelection] = useState<SelectionPosition | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  // Update currentText when text prop changes
  useEffect(() => {
    setCurrentText(text);
  }, [text]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCurrentText(newText);
    onChange?.(newText);
  };

  const getTextPositionFromPoint = (clientX: number, clientY: number): number => {
    const textarea = textareaRef.current;
    if (!textarea) return 0;

    const rect = textarea.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Calculate character position based on coordinates
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20;
    const charWidth = 8; // Approximate character width
    
    const line = Math.floor(y / lineHeight);
    const char = Math.floor(x / charWidth);
    
    return Math.min(line * 50 + char, currentText.length);
  };

  const getSelectionPosition = useCallback((): SelectionPosition | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentText.substring(start, end).trim();

    if (!selectedText) return null;

    return {
      start,
      end,
      text: selectedText
    };
  }, [currentText]);

  const handleSelectionStart = (clientX: number, clientY: number) => {
    const startPos = getTextPositionFromPoint(clientX, clientY);
    setSelectionStart(startPos);
    setIsSelecting(true);
    
    // Set the initial selection point
    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(startPos, startPos);
    }
  };

  const handleSelectionUpdate = (clientX: number, clientY: number) => {
    if (!isSelecting || selectionStart === null) return;

    const endPos = getTextPositionFromPoint(clientX, clientY);
    
    // Create selection from start to current position
    if (textareaRef.current) {
      const start = Math.min(selectionStart, endPos);
      const end = Math.max(selectionStart, endPos);
      textareaRef.current.setSelectionRange(start, end);
    }
  };

  const handleSelectionEnd = () => {
    if (!isSelecting) return;
    
    const selectionPos = getSelectionPosition();
    
    if (selectionPos && selectionPos.text) {
      setSelection(selectionPos);
      setIsSelecting(false);
      setSelectionStart(null);

      // Auto-copy if enabled
      if (features.autoCopy) {
        navigator.clipboard.writeText(selectionPos.text);
      }

      // Calculate menu position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        const startPos = selectionPos.start;
        const endPos = selectionPos.end;
        
        // Approximate position of selection
        const avgPos = (startPos + endPos) / 2;
        const lineHeight = parseInt(window.getComputedStyle(textareaRef.current).lineHeight) || 20;
        const charWidth = 8;
        
        const line = Math.floor(avgPos / 50);
        const char = avgPos % 50;
        
        setMenuPosition({
          x: char * charWidth,
          y: line * lineHeight - 60 // Position above selection
        });
      }

      // Call onSelect with actions
      if (onSelect) {
        const actions: SelectionActions = {
          copy: () => {
            navigator.clipboard.writeText(selectionPos.text);
            hideMenu();
          },
          sendToAI: () => {
            console.log('Send to AI:', selectionPos.text);
            hideMenu();
          },
          translate: () => {
            console.log('Translate:', selectionPos.text);
            hideMenu();
          },
          rewrite: () => {
            console.log('Rewrite:', selectionPos.text);
            hideMenu();
          },
          share: () => {
            if (navigator.share) {
              navigator.share({ text: selectionPos.text });
            } else {
              navigator.clipboard.writeText(selectionPos.text);
            }
            hideMenu();
          }
        };
        onSelect(selectionPos.text, actions);
      }
    } else {
      hideMenu();
      setIsSelecting(false);
      setSelectionStart(null);
    }
  };

  const hideMenu = () => {
    setMenuPosition(null);
    setSelection(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't interfere with normal text input - let the browser handle it
    // Only start selection if user is dragging (handled in mouse move)
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting) {
      e.preventDefault();
      handleSelectionUpdate(e.clientX, e.clientY);
    } else {
      // Start selection if mouse is pressed and moving
      if (e.buttons === 1) { // Left mouse button pressed
        handleSelectionStart(e.clientX, e.clientY);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isSelecting) {
      e.preventDefault();
      handleSelectionEnd();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleSelectionStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSelecting) {
      // Don't call preventDefault on touch events to avoid passive listener errors
      const touch = e.touches[0];
      handleSelectionUpdate(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSelecting) {
      // Don't call preventDefault on touch events to avoid passive listener errors
      handleSelectionEnd();
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
      hideMenu();
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const getSelectionStyle = () => {
    if (!selection) return {};
    
    return {
      background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
      color: 'white',
      borderRadius: '4px',
      padding: '2px 4px',
      margin: '0 1px'
    };
  };

  return (
    <div className="relative" style={{ width: '100%', height: '220px' }}>
      <textarea
        ref={textareaRef}
        value={currentText}
        onChange={handleInput}
        placeholder={placeholder}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={className}
        spellCheck="false"
        style={{
          userSelect: 'text',
          WebkitUserSelect: 'text',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          touchAction: 'manipulation',
          position: 'relative',
          zIndex: 1,
          cursor: 'text',
          width: '100%',
          height: '100%',
          overflow: 'auto',
          resize: 'none',
          boxSizing: 'border-box',
          maxWidth: '100%',
          maxHeight: '100%',
          direction: 'ltr',
          textAlign: 'left',
          border: 'none',
          borderRadius: '0',
          padding: '0.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5rem',
          fontFamily: 'inherit',
        }}
      />

      {/* Floating Action Menu */}
      {menuPosition && selection && features.showActions && (
        <div 
          className="absolute z-50"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="floating-actions">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigator.clipboard.writeText(selection.text)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy"
              >
                📋
              </button>
              <button
                onClick={() => console.log('Send to AI:', selection.text)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Ask AI"
              >
                🤖
              </button>
              <button
                onClick={() => console.log('Translate:', selection.text)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Translate"
              >
                🌍
              </button>
              <button
                onClick={() => console.log('Rewrite:', selection.text)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Rewrite"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ text: selection.text });
                  } else {
                    navigator.clipboard.writeText(selection.text);
                  }
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Send"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Handles (if enabled) */}
      {features.showHandles && selection && (
        <>
          <div 
            className="selection-handle absolute z-10"
            style={{
              left: `${(selection.start / currentText.length) * 100}%`,
              top: '0px',
              transform: 'translateX(-50%)'
            }}
            title="Drag to adjust selection start"
          />
          <div 
            className="selection-handle absolute z-10"
            style={{
              left: `${(selection.end / currentText.length) * 100}%`,
              top: '0px',
              transform: 'translateX(-50%)'
            }}
            title="Drag to adjust selection end"
          />
        </>
      )}
    </div>
  );
};

export default EnhancedTouchDragSelect; 