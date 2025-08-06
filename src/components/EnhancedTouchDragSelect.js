import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useRef, useState, useEffect, useCallback } from 'react';
const EnhancedTouchDragSelect = ({ text, onSelect, className = '', placeholder = '', onChange, onKeyDown, style, features = {
    showHandles: true,
    showActions: true,
    autoCopy: false,
    selectionMode: 'custom'
} }) => {
    const textareaRef = useRef(null);
    const [currentText, setCurrentText] = useState(text);
    const [selection, setSelection] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState(null);
    // Update currentText when text prop changes
    useEffect(() => {
        setCurrentText(text);
    }, [text]);
    // Auto-scroll to show new content with proper spacing
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea && text) {
            // Delay scroll to allow content to render
            setTimeout(() => {
                // Scroll to bottom minus some offset for better visibility
                const scrollHeight = textarea.scrollHeight;
                const clientHeight = textarea.clientHeight;
                const maxScrollTop = scrollHeight - clientHeight;
                // Scroll with 20px offset from the very bottom for better text visibility
                textarea.scrollTop = Math.max(0, maxScrollTop - 20);
            }, 100);
        }
    }, [text]);
    const handleInput = (e) => {
        const newText = e.target.value;
        setCurrentText(newText);
        onChange?.(newText);
    };
    const getTextPositionFromPoint = (clientX, clientY) => {
        const textarea = textareaRef.current;
        if (!textarea)
            return 0;
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
    const getSelectionPosition = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea)
            return null;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = currentText.substring(start, end).trim();
        if (!selectedText)
            return null;
        return {
            start,
            end,
            text: selectedText
        };
    }, [currentText]);
    const handleSelectionStart = (clientX, clientY) => {
        const startPos = getTextPositionFromPoint(clientX, clientY);
        setSelectionStart(startPos);
        setIsSelecting(true);
        // Set the initial selection point
        if (textareaRef.current) {
            textareaRef.current.setSelectionRange(startPos, startPos);
        }
    };
    const handleSelectionUpdate = (clientX, clientY) => {
        if (!isSelecting || selectionStart === null)
            return;
        const endPos = getTextPositionFromPoint(clientX, clientY);
        // Create selection from start to current position
        if (textareaRef.current) {
            const start = Math.min(selectionStart, endPos);
            const end = Math.max(selectionStart, endPos);
            textareaRef.current.setSelectionRange(start, end);
        }
    };
    const handleSelectionEnd = () => {
        if (!isSelecting)
            return;
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
                const actions = {
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
                        }
                        else {
                            navigator.clipboard.writeText(selectionPos.text);
                        }
                        hideMenu();
                    }
                };
                onSelect(selectionPos.text, actions);
            }
        }
        else {
            hideMenu();
            setIsSelecting(false);
            setSelectionStart(null);
        }
    };
    const hideMenu = () => {
        setMenuPosition(null);
        setSelection(null);
    };
    const handleMouseDown = (e) => {
        // Don't interfere with normal text input - let the browser handle it
        // Only start selection if user is dragging (handled in mouse move)
    };
    const handleMouseMove = (e) => {
        if (isSelecting) {
            e.preventDefault();
            handleSelectionUpdate(e.clientX, e.clientY);
        }
        else {
            // Start selection if mouse is pressed and moving
            if (e.buttons === 1) { // Left mouse button pressed
                handleSelectionStart(e.clientX, e.clientY);
            }
        }
    };
    const handleMouseUp = (e) => {
        if (isSelecting) {
            e.preventDefault();
            handleSelectionEnd();
        }
    };
    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        handleSelectionStart(touch.clientX, touch.clientY);
    };
    const handleTouchMove = (e) => {
        if (isSelecting) {
            // Don't call preventDefault on touch events to avoid passive listener errors
            const touch = e.touches[0];
            handleSelectionUpdate(touch.clientX, touch.clientY);
        }
    };
    const handleTouchEnd = (e) => {
        if (isSelecting) {
            // Don't call preventDefault on touch events to avoid passive listener errors
            handleSelectionEnd();
        }
    };
    const handleClickOutside = (e) => {
        if (textareaRef.current && !textareaRef.current.contains(e.target)) {
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
        if (!selection)
            return {};
        return {
            background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
            color: 'white',
            borderRadius: '4px',
            padding: '2px 4px',
            margin: '0 1px'
        };
    };
    return (_jsxs("div", { className: "relative", style: { width: '100%', height: '220px' }, children: [_jsx("textarea", { ref: textareaRef, value: currentText, onChange: handleInput, onKeyDown: onKeyDown, placeholder: placeholder, onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd, className: className, spellCheck: "false", style: {
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
                    padding: '0.5rem 0.5rem 3rem 0.5rem', // Added extra bottom padding for better scrolling
                    fontSize: 'inherit',
                    lineHeight: '1.5rem',
                    fontFamily: 'inherit',
                    scrollBehavior: 'smooth',
                    scrollPaddingBottom: '2rem', // Ensures content can scroll well past the bottom
                } }), menuPosition && selection && features.showActions && (_jsx("div", { className: "absolute z-50", style: {
                    left: menuPosition.x,
                    top: menuPosition.y,
                    transform: 'translateX(-50%)'
                }, children: _jsx("div", { className: "floating-actions", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => navigator.clipboard.writeText(selection.text), className: "p-2 hover:bg-gray-700 rounded-lg transition-colors", title: "Copy", children: "\uD83D\uDCCB" }), _jsx("button", { onClick: () => console.log('Send to AI:', selection.text), className: "p-2 hover:bg-gray-700 rounded-lg transition-colors", title: "AI", children: "\uD83E\uDD16" }), _jsx("button", { onClick: () => console.log('Translate:', selection.text), className: "p-2 hover:bg-gray-700 rounded-lg transition-colors", title: "Translate", children: "\uD83C\uDF0D" }), _jsx("button", { onClick: () => console.log('Rewrite:', selection.text), className: "p-2 hover:bg-gray-700 rounded-lg transition-colors", title: "Rewrite", children: "\u270F\uFE0F" }), _jsx("button", { onClick: () => {
                                    if (navigator.share) {
                                        navigator.share({ text: selection.text });
                                    }
                                    else {
                                        navigator.clipboard.writeText(selection.text);
                                    }
                                }, className: "p-2 hover:bg-gray-700 rounded-lg transition-colors", title: "Send", children: "\u27A4" })] }) }) })), features.showHandles && selection && (_jsxs(_Fragment, { children: [_jsx("div", { className: "selection-handle absolute z-10", style: {
                            left: `${(selection.start / currentText.length) * 100}%`,
                            top: '0px',
                            transform: 'translateX(-50%)'
                        }, title: "Drag to adjust selection start" }), _jsx("div", { className: "selection-handle absolute z-10", style: {
                            left: `${(selection.end / currentText.length) * 100}%`,
                            top: '0px',
                            transform: 'translateX(-50%)'
                        }, title: "Drag to adjust selection end" })] }))] }));
};
export default EnhancedTouchDragSelect;
