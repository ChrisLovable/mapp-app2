import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdAdd, MdEdit, MdDelete, MdCheck, MdSchedule, MdFlag, MdLabel, MdNotes, MdCalendarToday, MdToday, MdDateRange, MdKeyboardArrowUp, MdKeyboardArrowDown, MdRemove } from 'react-icons/md';
import { supabase } from '../lib/supabase';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInput?: string;
  currentLanguage?: string;
}

interface ShoppingItem {
  id: string;
  description: string;
  quantity: string;
  vendor: string;
  completed: boolean;
  created_at: string;
}

interface ParsedShoppingItem {
  description: string;
  quantity: string;
  vendor: string;
}

interface EditableShoppingItem {
  id: string;
  description: string;
  quantity: string;
  vendor: string;
}

export default function ShoppingListModal({ isOpen, onClose, initialInput, currentLanguage }: ShoppingListModalProps) {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [input, setInput] = useState('');
  const [parsedItems, setParsedItems] = useState<EditableShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editingValues, setEditingValues] = useState<{ description: string; quantity: string; vendor: string }>({
    description: '',
    quantity: '',
    vendor: ''
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setParsedItems([]);
      setEditingItem(null);
      setError('');
      setDebugInfo('');
    } else {
      fetchShoppingItems();
    }
  }, [isOpen]);

  // Auto-parse input when modal opens with initial input
  useEffect(() => {
    if (isOpen && initialInput && initialInput.trim()) {
      setInput(initialInput);
      parseInputForDisplay(initialInput);
    } else if (isOpen) {
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
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load shopping items');
    } finally {
      setIsLoading(false);
    }
  };

  const translateToEnglish = async (text: string, sourceLanguage: string): Promise<string> => {
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

  const parseInputForDisplay = async (input: string) => {
    if (!input.trim()) return;

    setIsParsing(true);
    setError('');

    try {
      // Translate to English if language is not English
      let processedInput = input;
      if (currentLanguage && currentLanguage !== 'en' && currentLanguage !== 'en-US' && currentLanguage !== 'en-GB') {
        try {
          processedInput = await translateToEnglish(input, currentLanguage);
          console.log(`Translated from ${currentLanguage} to English: "${input}" → "${processedInput}"`);
        } catch (translationError) {
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
        const editableItems: EditableShoppingItem[] = items.map((item, index) => {
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
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        setParsedItems([]);
      }
    } catch (error) {
      console.error('Error parsing input:', error);
      setError(`Failed to parse input: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setParsedItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const saveShoppingItem = async (parsedItem: ParsedShoppingItem) => {
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
    } catch (error) {
      console.error('Error saving shopping item:', error);
      setError(`Failed to save item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddShoppingItem = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const parsedItem = await parseShoppingItemWithAI(input);
      await saveShoppingItem(parsedItem);
      setInput('');
    } catch (error) {
      console.error('Error adding shopping item:', error);
      setError(`Failed to add item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const parseShoppingItemWithAI = async (input: string): Promise<ParsedShoppingItem> => {
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
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse shopping item');
    }
  };

  const handleUpdateShoppingItem = async (item: ShoppingItem) => {
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
    } catch (error) {
      console.error('Error updating shopping item:', error);
      setError(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startEditing = (item: ShoppingItem) => {
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
    if (!editingItem) return;
    
    const updatedItem = {
      ...editingItem,
      description: editingValues.description,
      quantity: editingValues.quantity,
      vendor: editingValues.vendor
    };
    
    await handleUpdateShoppingItem(updatedItem);
  };

  const updateEditingValue = (field: 'description' | 'quantity' | 'vendor', value: string) => {
    setEditingValues(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteShoppingItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setShoppingItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      setError(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleComplete = async (item: ShoppingItem) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ completed: !item.completed })
        .eq('id', item.id);

      if (error) {
        throw new Error(error.message);
      }

      setShoppingItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
    } catch (error) {
      console.error('Error toggling completion:', error);
      setError(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateParsedItem = (id: string, field: keyof EditableShoppingItem, value: string) => {
    setParsedItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeParsedItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const formatDescription = (description: string): string => {
    return description
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^[a-z]/, (letter) => letter.toUpperCase());
  };

  const formatVendor = (vendor: string): string => {
    return vendor
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^[a-z]/, (letter) => letter.toUpperCase());
  };

  const addEmptyItem = () => {
    const newItem: EditableShoppingItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: '1',
      vendor: 'Any'
    };
    setParsedItems(prev => [...prev, newItem]);
  };

  const confirmItem = async (item: EditableShoppingItem) => {
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
    } catch (error) {
      console.error('Error confirming item:', error);
      setError(`Failed to confirm item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div
        className="glassy-rainbow-btn rounded-2xl bg-black p-2 w-full max-w-[90vw] max-h-[95vh] flex flex-col border-0 overflow-hidden"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="w-full bg-blue-600 rounded-t-2xl rounded-b-2xl flex items-center justify-between px-4 py-3 mb-4">
          <h2 className="text-white font-bold text-lg sm:text-xl mx-auto w-full text-center">AI Shopping List Manager</h2>
          <button
            onClick={onClose}
            className="absolute right-6 top-4 text-white text-xl font-bold bg-transparent rounded-full hover:bg-blue-800 hover:text-gray-200 transition-colors w-8 h-8 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-y-auto px-1 pb-1">
          {/* Top Panel - New Items */}
          <div className="flex flex-col mb-4">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-white text-center mb-3">New Items</h3>
              <div className="flex justify-center">
              <button
                onClick={addEmptyItem}
                  className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                  style={{ background: '#111' }}
              >
                  Add New Item
              </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Parsed Items Display */}
              {parsedItems.length > 0 ? (
                <div className="space-y-3">
                  {parsedItems.map((item, index) => (
                    <div key={item.id} className="glassy-rainbow-btn rounded-2xl p-4 border-2 border-[var(--favourite-blue)]">
                  <div className="space-y-3">
                          {/* Description */}
                          <div>
                          <label className="text-sm text-white mb-2 block">Item Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateParsedItem(item.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] focus:outline-none focus:border-blue-500"
                            placeholder="Enter item description..."
                            />
                          </div>
                          
                          {/* Quantity and Vendor */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-sm text-white mb-2 block">Quantity</label>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => updateParsedItem(item.id, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] focus:outline-none focus:border-blue-500"
                              placeholder="1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-sm text-white mb-2 block">Vendor</label>
                            <input
                              type="text"
                              value={item.vendor}
                              onChange={(e) => updateParsedItem(item.id, 'vendor', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] focus:outline-none focus:border-blue-500"
                              placeholder="Any"
                            />
                          </div>
                          </div>
                          
                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => removeParsedItem(item.id)}
                            className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                            style={{ background: '#dc2626' }}
                          >
                            Remove
                          </button>
                            <button
                              onClick={() => confirmItem(item)}
                            className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm"
                            style={{ background: '#111' }}
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No new items to add. Use the "Add New Item" button or enter text below.</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-3 rounded-xl border border-red-500">
                  {error}
                </div>
              )}

              {/* Debug Info */}
              {debugInfo && (
                <div className="text-blue-400 text-sm bg-blue-900 bg-opacity-20 p-3 rounded-xl border border-blue-500">
                  {debugInfo}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel - Saved Items */}
          <div className="flex flex-col flex-1">
                            <div className="mb-3">
                  <h3 className="text-lg font-bold text-white mb-2">Saved Items</h3>
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setFilter('all')}
                      className={`flex-1 px-4 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-sm ${
                        filter === 'all' ? 'border-2 border-white' : ''
                      }`}
                      style={{ background: '#111' }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilter('active')}
                      className={`flex-1 px-4 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-sm ${
                        filter === 'active' ? 'border-2 border-white' : ''
                      }`}
                      style={{ background: '#111' }}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setFilter('completed')}
                      className={`flex-1 px-4 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-sm ${
                        filter === 'completed' ? 'border-2 border-white' : ''
                      }`}
                      style={{ background: '#111' }}
                    >
                      Completed
                    </button>
                  </div>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center text-white py-8">
                  <p>Loading items...</p>
                </div>
              ) : shoppingItems.filter(item => {
                if (filter === 'active') return !item.completed;
                if (filter === 'completed') return item.completed;
                return true;
              }).length > 0 ? (
                <div className="space-y-3">
                  {shoppingItems
                    .filter(item => {
                      if (filter === 'active') return !item.completed;
                      if (filter === 'completed') return item.completed;
                      return true;
                    })
                    .map((item) => (
                    <div key={item.id} className="rounded-2xl p-4 border-2 border-[var(--favourite-blue)] bg-black">
                      <div className="flex flex-col">
                        {/* Buttons Row */}
                        <div className="flex justify-between mb-3">
                          {!item.completed && (
                      <button 
                        onClick={() => handleToggleComplete(item)}
                              className="px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-xs"
                              style={{ background: '#10b981' }}
                            >
                              Done
                            </button>
                          )}
                          {editingItem?.id === item.id ? (
                            <>
                              <button
                                onClick={saveEditing}
                                className="px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-xs"
                                style={{ background: '#2563eb' }}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-xs"
                                style={{ background: '#111' }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEditing(item)}
                              className="px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-xs"
                              style={{ background: '#111' }}
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteShoppingItem(item.id)}
                            className="px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-lg transition-all border-0 text-xs"
                            style={{ background: '#dc2626' }}
                          >
                            Delete
                      </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1">
                          {editingItem?.id === item.id ? (
                            <div className="space-y-3">
                              {/* Description Input */}
                              <div>
                                <label className="text-sm text-white mb-2 block">Item Description</label>
                                <input
                                  type="text"
                                  value={editingValues.description}
                                  onChange={(e) => updateEditingValue('description', e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] focus:outline-none focus:border-blue-500"
                                  placeholder="Enter item description..."
                                />
                              </div>
                              
                              {/* Quantity and Vendor Inputs */}
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="text-sm text-white mb-2 block">Quantity</label>
                                  <input
                                    type="text"
                                    value={editingValues.quantity}
                                    onChange={(e) => updateEditingValue('quantity', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] focus:outline-none focus:border-blue-500"
                                    placeholder="1"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-sm text-white mb-2 block">Vendor</label>
                                  <input
                                    type="text"
                                    value={editingValues.vendor}
                                    onChange={(e) => updateEditingValue('vendor', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-black text-white text-sm border-2 border-[var(--favourite-blue)] focus:outline-none focus:border-blue-500"
                                    placeholder="Any"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                          <div className="mb-2">
                            <span className={`text-lg font-bold ${
                                  item.completed ? 'line-through text-gray-400' : 'text-white'
                            }`}>
                              {item.description}
                            </span>
                          </div>
                          
                              <div className="flex items-center gap-4 text-sm text-gray-300">
                            {item.quantity && (
                                  <span className="flex items-center gap-1">
                                    <span className="text-white font-bold">Qty:</span>
                                    <span>{item.quantity}</span>
                              </span>
                            )}
                            
                            {item.vendor && (
                                  <span className="flex items-center gap-1">
                                    <span className="text-white font-bold">From:</span>
                                    <span>{item.vendor}</span>
                              </span>
                            )}
                          </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No {filter === 'all' ? '' : filter} items found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 