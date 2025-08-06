import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
import { apiUsageTracker } from '../lib/ApiUsageTracker';
import { OpenAIService } from '../services/OpenAIService';
// Initialize OpenAI service
const openAIService = new OpenAIService();
// Helper function to get GPT answer
const getGPTAnswer = async (prompt) => {
    console.log('=== GETGPTANSWER CALLED ===');
    console.log('Prompt:', prompt);
    try {
        const response = await openAIService.getResponse(prompt, {
            model: 'gpt-4o-mini',
            maxTokens: 1000,
            temperature: 0.7
        });
        console.log('OpenAI response received:', response);
        return response.content;
    }
    catch (error) {
        console.error('Error getting GPT answer:', error);
        throw error;
    }
};
const REWRITE_OPTIONS = [
    { id: 'business', label: 'Professional', description: 'Formal, corporate tone suitable for business communications' },
    { id: 'informal', label: 'Informal', description: 'Casual, conversational tone for everyday communication' },
    { id: 'friendly', label: 'Friendly', description: 'Warm, approachable tone that builds rapport' },
    { id: 'expanded', label: 'Expanded', description: 'Add more detail and elaboration to the content' },
    { id: 'summarized', label: 'Summarized', description: 'Condense the content while keeping key points' },
    { id: 'grammar', label: 'Well-written', description: 'Keep the text as is, but correct grammar and punctuation only' }
];
export default function RewriteModal({ isOpen, onClose, currentText, onTextChange }) {
    const [selectedOption, setSelectedOption] = useState('business');
    const [rewrittenText, setRewrittenText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectAllActive, setSelectAllActive] = useState(false);
    const [localText, setLocalText] = useState(currentText);
    const rewrittenTextareaRef = useRef(null);
    // Auto-dismiss success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);
    const handleOptionSelect = (optionId) => {
        console.log('Selecting option:', optionId);
        setSelectedOption(optionId);
    };
    const handleRewrite = async () => {
        const textToRewrite = onTextChange ? currentText : localText;
        console.log('=== REWRITE BUTTON CLICKED ===');
        console.log('Current text:', textToRewrite);
        console.log('Selected option:', selectedOption);
        console.log('Text length:', textToRewrite.length);
        console.log('Is loading:', isLoading);
        if (!textToRewrite.trim()) {
            setError('Please enter some text in the "Text to rewrite" field before clicking Rewrite Text');
            return;
        }
        if (!selectedOption) {
            setError('Please select a rewrite option');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        setRewrittenText('');
        try {
            let prompt = '';
            if (selectedOption === 'grammar') {
                prompt = `Rewrite the following text in correct, proper English. Fix all grammar, spelling, and punctuation errors. Make it sound natural and well-written while maintaining the original meaning. Return only the corrected text, nothing else.\n\n"${textToRewrite}"`;
            }
            else {
                const optionLabel = REWRITE_OPTIONS.find(opt => opt.id === selectedOption)?.label;
                console.log('Option label:', optionLabel);
                prompt = `Rewrite the following text in a ${optionLabel} style. Maintain the original meaning and key information while adapting the tone and structure as requested:\n\n"${textToRewrite}"\n\nPlease provide only the rewritten text without any additional explanations or formatting.`;
            }
            console.log('Sending prompt to OpenAI:', prompt);
            const response = await getGPTAnswer(prompt);
            console.log('OpenAI response:', response);
            setRewrittenText(response);
            // Set success message based on selected option
            const optionLabel = REWRITE_OPTIONS.find(opt => opt.id === selectedOption)?.label;
            setSuccessMessage(`Your text is now rewritten in ${optionLabel} style.`);
            // Track successful rewrite usage
            apiUsageTracker.trackOpenAIUsage('https://api.openai.com/v1/chat/completions', 'gpt-4', prompt.length / 4, // Approximate token count
            response.length / 4, // Approximate token count
            'Text Rewrite', true);
        }
        catch (error) {
            setError('Failed to rewrite text. Please try again.');
            console.error('Rewrite error:', error);
            // Track failed rewrite usage
            apiUsageTracker.trackOpenAIUsage('https://api.openai.com/v1/chat/completions', 'gpt-4', currentText.length / 4, // Approximate token count
            0, 'Text Rewrite', false, error instanceof Error ? error.message : 'Unknown error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(rewrittenText);
            // You could add a toast notification here
        }
        catch (error) {
            console.error('Failed to copy text:', error);
        }
    };
    const clearAll = () => {
        setSelectedOption('');
        setRewrittenText('');
        setError('');
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4", style: { height: '100vh' }, children: _jsx("div", { className: "w-full flex items-center justify-center", children: _jsx("div", { className: "rounded-2xl bg-black p-4 min-h-0 flex flex-col", style: { width: '85vw', height: '85vh', boxSizing: 'border-box', border: '2px solid white', padding: '20px' }, children: _jsxs("div", { className: "overflow-y-auto overflow-x-hidden", style: { maxHeight: 'calc(85vh - 80px)' }, children: [_jsxs("div", { className: "sticky top-0 z-10 mb-6 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(10px)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                                transform: 'translateZ(5px)',
                                paddingLeft: '20px',
                                paddingRight: '20px'
                            }, children: [_jsx("h2", { className: "text-white font-bold text-lg text-center", style: {
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                        transform: 'translateZ(3px)'
                                    }, children: "Rewrite Text" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px', border: '1px solid #666666' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "w-full px-4 flex flex-col items-center", children: [_jsx("div", { className: "space-y-2 mb-2", style: { width: '75vw' }, children: _jsx("div", { className: "p-3 rounded-2xl min-h-[80px] max-h-[200px]", children: _jsx("textarea", { value: onTextChange ? currentText : localText, onChange: (e) => {
                                                    console.log('Input text changed:', e.target.value);
                                                    if (onTextChange) {
                                                        onTextChange(e.target.value);
                                                    }
                                                    else {
                                                        setLocalText(e.target.value);
                                                    }
                                                }, className: "w-full h-full bg-black text-white text-sm rounded-xl border-2 border-white resize-none outline-none px-3 py-2", placeholder: "Enter or edit the text you want to rewrite...", style: { minHeight: '100px', maxHeight: '120px' } }) }) }), _jsxs("div", { className: "space-y-4 mb-2", style: { width: '75vw' }, children: [_jsx("div", { className: "grid grid-cols-2 gap-2 mx-auto", style: { width: '65vw' }, children: REWRITE_OPTIONS.map((option) => (_jsxs("label", { className: `flex items-center px-3 py-1 text-white rounded-full cursor-pointer transition-all block`, style: {
                                                        background: selectedOption === option.id
                                                            ? 'linear-gradient(135deg, #10b981 0%, #000000 100%)'
                                                            : 'linear-gradient(135deg, #000000 0%, #2563eb 100%)',
                                                        color: selectedOption === option.id ? 'white' : 'white'
                                                    }, children: [_jsx("input", { type: "radio", name: "rewriteOption", checked: selectedOption === option.id, onChange: () => handleOptionSelect(option.id), className: "appearance-none w-5 h-5 rounded-full border-2 border-white checked:bg-black checked:ring-2 checked:ring-red-500 mr-1 focus:ring-white cursor-pointer" }), _jsx("span", { className: "text-xs font-bold", children: option.label })] }, option.id))) }), _jsx("div", { className: "flex justify-center mt-4", children: _jsx("div", { className: "p-2", children: _jsx("button", { onClick: handleRewrite, disabled: isLoading || !(onTextChange ? currentText : localText).trim() || !selectedOption, className: "glassy-btn neon-grid-btn px-6 py-3 rounded-2xl text-white font-bold transition-colors text-sm border-0", style: {
                                                            background: '#111',
                                                            border: '1px solid #666666',
                                                            fontSize: '0.9rem',
                                                            minWidth: '120px'
                                                        }, children: isLoading ? 'Rewriting...' : 'Rewrite Text' }) }) })] }), _jsxs("div", { className: "space-y-2 mt-1", style: { width: '75vw' }, children: [_jsx("div", { className: "p-3 rounded-2xl", children: _jsx("textarea", { id: "rewritten-textarea", ref: rewrittenTextareaRef, value: rewrittenText, onChange: (e) => setRewrittenText(e.target.value), className: `w-full h-full bg-black text-white text-sm rounded-xl border-2 border-white resize-none outline-none font-bold px-3 py-2${selectAllActive ? ' custom-selection' : ''}`, placeholder: "Rewritten text will appear here...", style: { minHeight: '120px', maxHeight: '150px' }, onBlur: () => setSelectAllActive(false), readOnly: true }) }), _jsxs("div", { className: "flex justify-end gap-2", style: { marginTop: '-10px' }, children: [_jsx("div", { className: "p-2", children: _jsx("button", { onClick: (e) => {
                                                                e.preventDefault();
                                                                const textarea = document.querySelector('#rewritten-textarea');
                                                                if (textarea) {
                                                                    textarea.select();
                                                                    setSelectAllActive(true);
                                                                }
                                                            }, className: "glassy-btn neon-grid-btn px-6 py-3 rounded-2xl text-white font-bold transition-colors text-sm border-0", style: {
                                                                background: '#111',
                                                                border: '1px solid #666666',
                                                                fontSize: '0.9rem',
                                                                minWidth: '120px'
                                                            }, children: "Select All" }) }), _jsx("div", { className: "p-2", children: _jsx("button", { onClick: (e) => {
                                                                e.preventDefault();
                                                                copyToClipboard();
                                                            }, className: "glassy-btn neon-grid-btn px-6 py-3 rounded-2xl text-white font-bold transition-colors text-sm border-0", style: {
                                                                background: '#111',
                                                                border: '1px solid #666666',
                                                                fontSize: '0.9rem',
                                                                minWidth: '120px'
                                                            }, children: "Copy" }) })] })] }), error && (_jsxs("div", { className: "p-3 rounded-2xl animated-rainbow-border bg-red-100 text-black border-0 mb-4", style: { backgroundColor: '#fee2e2' }, children: [_jsx("h3", { className: "text-red-800 font-semibold text-sm mb-1", children: "Error" }), _jsx("p", { className: "text-red-700 text-xs", children: error })] })), successMessage && (_jsx("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000]", style: { animation: 'fadeInUp 0.3s ease-out' }, children: _jsx("div", { className: "glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ring-green-400 ring-opacity-60", style: {
                                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(34, 197, 94, 0.2))',
                                                backdropFilter: 'blur(20px)',
                                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                                                filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))',
                                                transform: 'translateZ(30px) perspective(1000px)',
                                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }, children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "text-3xl", style: {
                                                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                                                            textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                                                            transform: 'translateZ(10px)'
                                                        }, children: "\u2705" }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-white font-bold text-lg", style: {
                                                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                                                transform: 'translateZ(5px)'
                                                            }, children: successMessage }) }), _jsx("button", { onClick: () => setSuccessMessage(''), className: "w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button", style: {
                                                            border: '1px solid rgba(255, 255, 255, 0.4)',
                                                            background: 'rgba(0, 0, 0, 0.6)',
                                                            backdropFilter: 'blur(10px)'
                                                        }, children: "\u00D7" })] }) }) }))] }) })] }) }) }) }));
}
