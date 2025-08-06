import React from 'react';
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
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    style?: React.CSSProperties;
    features?: {
        showHandles?: boolean;
        showActions?: boolean;
        autoCopy?: boolean;
        selectionMode?: 'word' | 'sentence' | 'custom';
    };
}
declare const EnhancedTouchDragSelect: ({ text, onSelect, className, placeholder, onChange, onKeyDown, style, features }: EnhancedTouchDragSelectProps) => import("react/jsx-runtime").JSX.Element;
export default EnhancedTouchDragSelect;
