import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdAdd, MdEdit, MdDelete, MdCheck, MdSchedule, MdFlag, MdLabel, MdNotes, MdCalendarToday, MdToday, MdDateRange, MdKeyboardArrowUp, MdKeyboardArrowDown, MdRemove } from 'react-icons/md';
import { supabase } from '../lib/supabase';
export default function ShoppingListModal({ isOpen, onClose, initialInput, currentLanguage }) {
    const [shoppingItems, setShoppingItems] = useState([]);
    const [input, setInput] = useState('');
    const [parsedItems, setParsedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editingValues, setEditingValues] = useState({
        description: '',
        quantity: '',
        vendor: ''
    });
    const [filter, setFilter] = useState('all');
    const [showCompleted, setShowCompleted] = useState(true);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const textareaRef = useRef(null);
    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setInput('');
            setParsedItems([]);
            setEditingItem(null);
            setError('');
            setDebugInfo('');
        }
        else {
            fetchShoppingItems();
        }
    }, [isOpen]);
    // Auto-parse input when modal opens with initial input
    useEffect(() => {
        if (isOpen && initialInput && initialInput.trim()) {
            setInput(initialInput);
            parseInputForDisplay(initialInput);
        }
        else if (isOpen) {
            // Clear any existing parsed items when opening without input
            setParsedItems([]);
            setInput('');
        }
    }, [isOpen, initialInput]);
    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);
    const fetchShoppingItems = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('shopping_items')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching shopping items:', error);
                setError('Failed to load shopping items');
                return;
            }
            setShoppingItems(data || []);
        }
        catch (error) {
            console.error('Error:', error);
            setError('Failed to load shopping items');
        }
        finally {
            setIsLoading(false);
        }
    };
    const translateToEnglish = async (text, sourceLanguage) => {
        if (sourceLanguage === 'en' || sourceLanguage === 'en-US' || sourceLanguage === 'en-GB') {
            return text; // Already in English
        }
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please check your .env file.');
        }
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a translator. Translate the given text from ${sourceLanguage} to English. Return only the translated text, nothing else.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                max_tokens: 200,
                temperature: 0.3
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Translation error: ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const translatedText = data.choices[0]?.message?.content?.trim();
        if (!translatedText) {
            throw new Error('No translation received');
        }
        return translatedText;
    };
    const parseInputForDisplay = async (input) => {
        if (!input.trim())
            return;
        setIsParsing(true);
        setError('');
        try {
            // Translate to English if language is not English
            let processedInput = input;
            if (currentLanguage && currentLanguage !== 'en' && currentLanguage !== 'en-US' && currentLanguage !== 'en-GB') {
                try {
                    processedInput = await translateToEnglish(input, currentLanguage);
                    console.log(`Translated from ${currentLanguage} to English: "${input}" → "${processedInput}"`);
                }
                catch (translationError) {
                    console.error('Translation failed, proceeding with original input:', translationError);
                    // Continue with original input if translation fails
                }
            }
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('OpenAI API key not found. Please check your .env file.');
            }
            const prompt = `You are an intelligent shopping list parser. Given natural language input, extract distinct shopping items, associating each with its own specific quantity and vendor if provided.

Instructions:

Identify each shopping item and assign it to a separate item block.

If quantities are mentioned (e.g., "2 apples", "a dozen eggs", "3 cans"), extract them.

If vendors/stores are mentioned (e.g., "from Walmart", "at Target", "from the grocery store"), extract them.

Clean up filler words like "uh", "you know", "like", etc.

If no quantity is specified, use "1" as default.

If no vendor is specified, use "Any" as default.

Input: "${processedInput}"

Return items in a structured array with:
- description
- quantity
- vendor

Example output:
[
  {
    "description": "apples",
    "quantity": "2",
    "vendor": "Any"
  },
  {
    "description": "milk",
    "quantity": "1 gallon",
    "vendor": "Walmart"
  }
]`;
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an intelligent shopping list parser. Given natural language input, extract distinct shopping items, associating each with its own specific quantity and vendor if provided. Always return valid JSON arrays.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.3
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response received from OpenAI');
            }
            try {
                const parsed = JSON.parse(content);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                // Convert to editable item objects with proper formatting
                const editableItems = items.map((item, index) => {
                    return {
                        id: `item-${index}`,
                        description: formatDescription(item.description || ''),
                        quantity: item.quantity || '1',
                        vendor: formatVendor(item.vendor || 'Any')
                    };
                });
                const debugMessage = currentLanguage && currentLanguage !== 'en' && currentLanguage !== 'en-US' && currentLanguage !== 'en-GB'
                    ? `Input: "${input}" → Translated: "${processedInput}" | Parsed ${editableItems.length} items`
                    : `Input: "${input}" | Parsed ${editableItems.length} items`;
                setDebugInfo(debugMessage);
                setParsedItems(editableItems);
            }
            catch (parseError) {
                console.error('Failed to parse AI response:', parseError);
                setParsedItems([]);
            }
        }
        catch (error) {
            console.error('Error parsing input:', error);
            setError(`Failed to parse input: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setParsedItems([]);
        }
        finally {
            setIsParsing(false);
        }
    };
    const saveShoppingItem = async (parsedItem) => {
        try {
            const { data, error } = await supabase
                .from('shopping_items')
                .insert([{
                    description: parsedItem.description,
                    quantity: parsedItem.quantity,
                    vendor: parsedItem.vendor,
                    completed: false
                }])
                .select()
                .single();
            if (error) {
                throw new Error(error.message);
            }
            setShoppingItems([data, ...shoppingItems]);
            console.log('Shopping item saved:', data);
        }
        catch (error) {
            console.error('Error saving shopping item:', error);
            setError(`Failed to save item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const handleAddShoppingItem = async () => {
        if (!input.trim())
            return;
        setIsLoading(true);
        setError('');
        try {
            const parsedItem = await parseShoppingItemWithAI(input);
            await saveShoppingItem(parsedItem);
            setInput('');
        }
        catch (error) {
            console.error('Error adding shopping item:', error);
            setError(`Failed to add item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    const parseShoppingItemWithAI = async (input) => {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please check your .env file.');
        }
        const prompt = `
Parse the following shopping item input into a structured format:
- Extract the item description (required)
- Extract the quantity if mentioned (default to "1" if not specified)
- Extract the vendor/store if mentioned (default to "Any" if not specified)

Input: "${input}"

Return a JSON object with:
- description: string
- quantity: string
- vendor: string

Example: {"description": "milk", "quantity": "1 gallon", "vendor": "Walmart"}`;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a shopping item parser. Extract item description, quantity, and vendor from natural language input. Always return valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 200,
                temperature: 0.3
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
        }
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No response received from OpenAI');
        }
        try {
            const parsed = JSON.parse(content);
            return {
                description: parsed.description || '',
                quantity: parsed.quantity || '1',
                vendor: parsed.vendor || 'Any'
            };
        }
        catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            throw new Error('Failed to parse shopping item');
        }
    };
    const handleUpdateShoppingItem = async (item) => {
        try {
            const { error } = await supabase
                .from('shopping_items')
                .update({
                description: item.description,
                quantity: item.quantity,
                vendor: item.vendor
            })
                .eq('id', item.id);
            if (error) {
                throw new Error(error.message);
            }
            setShoppingItems(prev => prev.map(i => i.id === item.id ? item : i));
            setEditingItem(null);
            setEditingValues({ description: '', quantity: '', vendor: '' });
        }
        catch (error) {
            console.error('Error updating shopping item:', error);
            setError(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const startEditing = (item) => {
        setEditingItem(item);
        setEditingValues({
            description: item.description,
            quantity: item.quantity,
            vendor: item.vendor
        });
    };
    const cancelEditing = () => {
        setEditingItem(null);
        setEditingValues({ description: '', quantity: '', vendor: '' });
    };
    const saveEditing = async () => {
        if (!editingItem)
            return;
        const updatedItem = {
            ...editingItem,
            description: editingValues.description,
            quantity: editingValues.quantity,
            vendor: editingValues.vendor
        };
        await handleUpdateShoppingItem(updatedItem);
    };
    const updateEditingValue = (field, value) => {
        setEditingValues(prev => ({ ...prev, [field]: value }));
    };
    const handleDeleteShoppingItem = async (id) => {
        try {
            const { error } = await supabase
                .from('shopping_items')
                .delete()
                .eq('id', id);
            if (error) {
                throw new Error(error.message);
            }
            setShoppingItems(prev => prev.filter(item => item.id !== id));
        }
        catch (error) {
            console.error('Error deleting shopping item:', error);
            setError(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const handleToggleComplete = async (item) => {
        try {
            const { error } = await supabase
                .from('shopping_items')
                .update({ completed: !item.completed })
                .eq('id', item.id);
            if (error) {
                throw new Error(error.message);
            }
            setShoppingItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
        }
        catch (error) {
            console.error('Error toggling completion:', error);
            setError(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const updateParsedItem = (id, field, value) => {
        setParsedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const removeParsedItem = (id) => {
        setParsedItems(prev => prev.filter(item => item.id !== id));
    };
    const formatDescription = (description) => {
        return description
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^[a-z]/, (letter) => letter.toUpperCase());
    };
    const formatVendor = (vendor) => {
        return vendor
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/^[a-z]/, (letter) => letter.toUpperCase());
    };
    const addEmptyItem = () => {
        const newItem = {
            id: `item-${Date.now()}`,
            description: '',
            quantity: '1',
            vendor: 'Any'
        };
        setParsedItems(prev => [...prev, newItem]);
    };
    const confirmItem = async (item) => {
        try {
            // Save item to Supabase
            const itemData = {
                description: item.description,
                quantity: item.quantity,
                vendor: item.vendor,
                completed: false
            };
            const { data, error } = await supabase
                .from('shopping_items')
                .insert([itemData])
                .select()
                .single();
            if (error) {
                throw new Error(error.message);
            }
            // Add to saved items list
            setShoppingItems([data, ...shoppingItems]);
            // Remove from parsed items
            setParsedItems(prev => prev.filter(i => i.id !== item.id));
            console.log('Shopping item confirmed and saved:', data);
        }
        catch (error) {
            console.error('Error confirming item:', error);
            setError(`Failed to confirm item: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-2 flex flex-col overflow-hidden", style: {
                boxSizing: 'border-box',
                border: '2px solid white',
                width: '85vw',
                height: '90vh'
            }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                        transform: 'translateZ(5px)'
                    }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                transform: 'translateZ(3px)'
                            }, children: "AI Shopping List Manager" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsxs("div", { className: "flex flex-col flex-1 overflow-y-auto px-1 pb-1", children: [_jsxs("div", { className: "flex flex-col mb-4", children: [_jsx("div", { className: "mb-3", children: _jsx("div", { className: "flex justify-start", children: _jsx("button", { onClick: addEmptyItem, className: "px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border border-gray-400 text-sm", style: { background: '#111' }, children: "Add New Item" }) }) }), _jsxs("div", { className: "space-y-3", children: [parsedItems.length > 0 ? (_jsx("div", { className: "space-y-3", children: parsedItems.map((item, index) => (_jsx("div", { className: "rounded-2xl p-4", style: { border: '2px solid white' }, children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-white mb-2 block", children: "Item Description" }), _jsx("input", { type: "text", value: item.description, onChange: (e) => updateParsedItem(item.id, 'description', e.target.value), className: "w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-white focus:outline-none focus:border-white", placeholder: "Enter item description..." })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-white mb-2 block", children: "Quantity" }), _jsx("input", { type: "text", value: item.quantity, onChange: (e) => updateParsedItem(item.id, 'quantity', e.target.value), className: "w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-white focus:outline-none focus:border-white", placeholder: "1" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-white mb-2 block", children: "Vendor" }), _jsx("input", { type: "text", value: item.vendor, onChange: (e) => updateParsedItem(item.id, 'vendor', e.target.value), className: "w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-white focus:outline-none focus:border-white", placeholder: "Any" })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => removeParsedItem(item.id), className: "px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border border-gray-400 text-sm", style: { background: '#dc2626' }, children: "Remove" }), _jsx("button", { onClick: () => confirmItem(item), className: "px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border border-gray-400 text-sm", style: { background: '#111' }, children: "Confirm" })] })] }) }, item.id))) })) : null, error && (_jsx("div", { className: "text-red-400 text-sm bg-red-900 bg-opacity-20 p-3 rounded-xl border border-red-500", children: error })), debugInfo && (_jsx("div", { className: "text-blue-400 text-sm bg-blue-900 bg-opacity-20 p-3 rounded-xl border border-white", children: debugInfo }))] })] }), _jsxs("div", { className: "flex flex-col flex-1", children: [_jsxs("div", { className: "mb-3", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-2 text-left", children: "Saved Items" }), _jsxs("div", { className: "flex gap-2 w-full", children: [_jsx("button", { onClick: () => setFilter('all'), className: `flex-1 px-4 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-sm`, style: { background: filter === 'all' ? '#10b981' : '#111' }, children: "All" }), _jsx("button", { onClick: () => setFilter('active'), className: `flex-1 px-4 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-sm`, style: { background: filter === 'active' ? '#10b981' : '#111' }, children: "Active" }), _jsx("button", { onClick: () => setFilter('completed'), className: `flex-1 px-4 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-sm`, style: { background: filter === 'completed' ? '#10b981' : '#111' }, children: "Completed" })] })] }), _jsx("div", { className: "space-y-3", children: isLoading ? (_jsx("div", { className: "text-center text-white py-8", children: _jsx("p", { children: "Loading items..." }) })) : shoppingItems.filter(item => {
                                        if (filter === 'active')
                                            return !item.completed;
                                        if (filter === 'completed')
                                            return item.completed;
                                        return true;
                                    }).length > 0 ? (_jsx("div", { className: "space-y-3", children: shoppingItems
                                            .filter(item => {
                                            if (filter === 'active')
                                                return !item.completed;
                                            if (filter === 'completed')
                                                return item.completed;
                                            return true;
                                        })
                                            .map((item) => (_jsx("div", { className: "rounded-2xl p-4 border-2 border-white bg-black", children: _jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex justify-between mb-3", children: [!item.completed && (_jsx("button", { onClick: () => handleToggleComplete(item), className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-xs", style: { background: '#10b981' }, children: "Done" })), editingItem?.id === item.id ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: saveEditing, className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-xs", style: { background: '#2563eb' }, children: "Save" }), _jsx("button", { onClick: cancelEditing, className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-xs", style: { background: '#111' }, children: "Cancel" })] })) : (_jsx("button", { onClick: () => startEditing(item), className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-xs", style: { background: '#111' }, children: "Edit" })), _jsx("button", { onClick: () => handleDeleteShoppingItem(item.id), className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border border-gray-400 text-xs", style: { background: '#dc2626' }, children: "Delete" })] }), _jsx("div", { className: "flex-1", children: editingItem?.id === item.id ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-white mb-2 block", children: "Item Description" }), _jsx("input", { type: "text", value: editingValues.description, onChange: (e) => updateEditingValue('description', e.target.value), className: "w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-white focus:outline-none focus:border-white", placeholder: "Enter item description..." })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-white mb-2 block", children: "Quantity" }), _jsx("input", { type: "text", value: editingValues.quantity, onChange: (e) => updateEditingValue('quantity', e.target.value), className: "w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-white focus:outline-none focus:border-white", placeholder: "1" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-white mb-2 block", children: "Vendor" }), _jsx("input", { type: "text", value: editingValues.vendor, onChange: (e) => updateEditingValue('vendor', e.target.value), className: "w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-white focus:outline-none focus:border-white", placeholder: "Any" })] })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-2", children: _jsx("span", { className: `text-lg font-bold ${item.completed ? 'line-through text-gray-400' : 'text-white'}`, children: item.description }) }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-300", children: [item.quantity && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-white font-bold", children: "Qty:" }), _jsx("span", { children: item.quantity })] })), item.vendor && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: "text-white font-bold", children: "From:" }), _jsx("span", { children: item.vendor })] }))] })] })) })] }) }, item.id))) })) : (_jsx("div", { className: "text-center text-gray-400 py-8", children: _jsxs("p", { children: ["No ", filter === 'all' ? '' : filter, " items found."] }) })) })] })] })] }) }));
}
