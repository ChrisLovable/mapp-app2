import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

import ExpenseJournalModal from './ExpenseJournalModal';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseAnalytics } from '../services/ExpenseAnalytics';
import { OpenAIService } from '../services/OpenAIService';
// Local Web SpeechRecognition shim to replace removed GlobalSpeechRecognition
// Provides start/stop with simple EN/AF handling and duplication-safe streaming
import { QuestionProcessor } from '../services/QuestionProcessor';

// Temporary placeholder functions for missing dependencies
const askOpenAIVision = async (prompt: string, base64Image: string): Promise<string> => {
  // Placeholder implementation
  console.warn('askOpenAIVision not implemented, using placeholder');
  return `Extracted text from image: ${prompt}`;
};

const getGPTAnswer = async (prompt: string): Promise<string> => {
  // Placeholder implementation
  console.warn('getGPTAnswer not implemented, using placeholder');
  return `AI response to: ${prompt}`;
};

interface Expense {
  id: string;
  expense_date: string;
  vendor: string;
  amount: number;
  quantity: number;
  description: string;
  category: string;
  receipt_image?: string;
  receipt_image_id?: string;
  user_id?: string;
  created_at?: string;
}

interface ParsedExpense {
  expense_date: string;
  vendor: string;
  amount: number;
  quantity: number;
  description: string;
  category: string;
  _currentImageData?: string;
  receipt_image_id?: string | null;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, currentLanguage }) => {
const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpenses, setNewExpenses] = useState<ParsedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCacheLoading, setIsCacheLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [showExpenseJournal, setShowExpenseJournal] = useState(false);
  const [processingSuccess, setProcessingSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [showQuickQuestion, setShowQuickQuestion] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expenseCache, setExpenseCache] = useState<Expense[]>([]);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; expenseId: string | null }>({ show: false, expenseId: null });

  // Initialize services
  const analytics = new ExpenseAnalytics(supabase);
  const openAI = new OpenAIService();
  const questionProcessor = new QuestionProcessor(analytics, openAI);

  // Add helper to save image and get its id
  async function saveReceiptImageToDB(userId: string, base64: string) {
    const { data, error } = await supabase
      .from('receipt_images')
      .insert([{ user_id: userId, image_data: base64 }])
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setNewExpenses([]);
      setImagePreview(null);
      setIsProcessing(true);
      processImage(file);
    }
  };

  const handleManualEntry = () => {
    setShowImageUpload(false);
    setNewExpenses([{
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      amount: 0,
      quantity: 1,
      description: '',
      category: '',
      receipt_image_id: null
    }]);
    setImagePreview(null);
  };

  const addNewExpense = () => {
    setNewExpenses([...newExpenses, {
      expense_date: new Date().toISOString().split('T')[0],
      vendor: '',
      amount: 0,
      quantity: 1,
      description: '',
      category: '',
      receipt_image_id: null
    }]);
  };

  const updateNewExpense = (index: number, field: keyof ParsedExpense, value: string | number) => {
    const updated = [...newExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setNewExpenses(updated);
  };

  const removeNewExpense = (index: number) => {
    setNewExpenses(newExpenses.filter((_, i) => i !== index));
  };

  const saveIndividualExpense = async (expense: ParsedExpense, index: number) => {
    try {
      setIsLoading(true);
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase
        .from('expense_tracker')
        .insert([{
          user_id: userId,
          expense_date: expense.expense_date,
          vendor: expense.vendor,
          amount: expense.amount,
          quantity: expense.quantity,
          description: expense.description,
          category: expense.category,
          receipt_image_id: expense.receipt_image_id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving expense:', error);
        return;
      }

      setNewExpenses(prev => prev.filter((_, i) => i !== index));
      setExpenses(prev => {
        const updated = [data, ...prev];
        saveExpenseCache(updated);
        return updated;
      });
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpenses = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      setIsCacheLoading(true);
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase
        .from('expense_tracker')
        .select('id, expense_date, vendor, amount, quantity, description, category, receipt_image_id, user_id, created_at')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Database error:', error);
        if (expenseCache.length > 0) {
          setExpenses(expenseCache);
        }
        return;
      }

      setExpenses(data || []);
      if (data) {
        saveExpenseCache(data);
      }
    } catch (error) {
      console.error('Error in fetchExpenses:', error);
      if (expenseCache.length > 0) {
        setExpenses(expenseCache);
      }
    } finally {
      setIsLoading(false);
      setIsCacheLoading(false);
    }
  };

  const handleDeleteClick = (expenseId: string) => {
    setDeleteConfirmModal({ show: true, expenseId });
  };

  const confirmDelete = async () => {
    if (deleteConfirmModal.expenseId) {
      await deleteExpense(deleteConfirmModal.expenseId);
    }
    setDeleteConfirmModal({ show: false, expenseId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmModal({ show: false, expenseId: null });
  };

  const handleQuickQuestion = async () => {
    if (!quickQuestion.trim()) return;

    setIsAskingQuestion(true);
    setQuickAnswer('');

    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      const result = await questionProcessor.processQuestion({
        userId,
        question: quickQuestion,
        dataLimit: 50
      });
      setQuickAnswer(result.response);
    } catch (error) {
      console.error('Error processing quick question:', error);
      setQuickAnswer(`Error: ${error instanceof Error ? error.message : 'Failed to get answer'}`);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = currentLanguage;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setQuickQuestion(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    
    recognition.onerror = (event: any) => {
        alert(`Speech recognition error: ${event.error}`);
        setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };



  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4 ${isProcessing || isCacheLoading ? 'cursor-wait' : ''}`}>
      <div className="rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col" style={{ boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }}>
        {/* Modal Header */}
        <div 
          className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
            filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
            transform: 'translateZ(5px)'
          }}
        >
          <h2 
            className="text-white font-bold text-base text-center"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
              transform: 'translateZ(3px)'
            }}
          >
            Expense entries
          </h2>
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white"
              style={{ background: '#000000', fontSize: '15px' }}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 px-4 pb-2 overflow-y-auto">
          <div className="space-y-6">
            {/* Image Upload Section */}
            {showImageUpload && (
              <div className="text-center">
                <h3 className="text-white font-bold text-sm mb-4">Take a photo of a receipt / upload receipt image from gallery / manually enter an expense</h3>
                
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {/* Open Camera Button */}
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.setAttribute('capture', 'environment');
                        fileInputRef.current.click();
                        // Remove capture after click to allow gallery selection later
                        setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 1000);
                      }
                    }}
                    className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white mb-2"
                    style={{ background: '#111' }}
                  >
                    📷 Open Camera
                  </button>
                  
                  {/* Cache Loading Message */}
                  {isCacheLoading && (
                    <div className="bg-black border-2 border-yellow-500 rounded-2xl p-3 mb-4">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300"></div>
                        <p className="text-yellow-300 text-sm text-center">
                          Cache loading - please be patient
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isProcessing ? (
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center px-6 py-3 glassy-btn neon-grid-btn text-white rounded-2xl">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        {processingStep || 'Processing image...'}
                      </div>
                      <div className="text-yellow-300 text-sm">
                        Please wait while AI analyzes your receipt...
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                      style={{ background: '#111' }}
                    >
                      🖼️ Select Image
                    </button>
                  )}
                  
                  <div className="mt-6">
                    <button
                      onClick={handleManualEntry}
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                      style={{ background: '#111' }}
                    >
                      ✏️ Enter Manually
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        await fetchExpenses(true);
                        setShowQuickQuestion(true);
                      }}
                      disabled={isCacheLoading}
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                      style={{ background: '#111' }}
                    >
                      {isCacheLoading ? '🔄 Loading...' : '❓ Quick Question'}
                    </button>
                  </div>
                  {/* Move Journal button here */}
                  <div className="mt-2 flex justify-center">
                    <button
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                      style={{ background: '#111' }}
                      onClick={() => {
                        setShowExpenseJournal(true);
                      }}
                    >
                      Expense Journal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Modal Content */}
            {!showImageUpload && (
              <>
                {/* Success Message */}
                {processingSuccess && newExpenses.length > 0 && (
                  <div className="bg-black border-2 border-green-500 rounded-2xl p-3 mb-4">
                    <p className="text-green-300 text-sm text-center">
                      {processingStep === '✅ Processing complete!' 
                        ? '✅ Image processed successfully! Please review and confirm the parsed expenses below.'
                        : '✅ Processing complete! Please review and confirm the parsed expenses below.'
                      }
                    </p>
                  </div>
                )}

                {/* Cache Loading Message */}
                {isCacheLoading && (
                  <div className="bg-black border-2 border-yellow-500 rounded-2xl p-3 mb-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300"></div>
                      <p className="text-yellow-300 text-sm text-center">
                        Cache loading - please be patient
                      </p>
                    </div>
                  </div>
                )}


                
                {/* New Expenses Section */}
                <div>
                  <div className="flex items-center justify-end mb-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {processingSuccess && (
                          <button
                            onClick={() => {
                              setShowImageUpload(true);
                              setProcessingSuccess(false);
                              setNewExpenses([]);
                              setImagePreview(null);
                            }}
                            className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                            style={{ background: '#111' }}
                          >
                            📷 Upload Another
                          </button>
                        )}
                        <button
                          onClick={addNewExpense}
                          className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white mx-auto block"
                          style={{ background: '#111' }}
                        >
                          Add new expense manually
                        </button>
                      </div>
                    </div>
                  </div>
                                      {newExpenses.length > 0 ? (
                      <div className="space-y-3">
                        {newExpenses.map((expense, index) => (
                          <div key={index} className="bg-black border-2 border-white rounded-2xl p-4">
                            <div className="space-y-3">
                              {/* Date and Amount */}
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={expense.expense_date}
                                  onChange={(e) => updateNewExpense(index, 'expense_date', e.target.value)}
                                  className="flex-1 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={expense.amount === 0 ? '' : expense.amount.toFixed(2)}
                                  onChange={(e) => updateNewExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Amount"
                                />
                              </div>
                              
                              {/* Quantity and Vendor */}
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={expense.quantity}
                                  onChange={(e) => updateNewExpense(index, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Qty"
                                />
                                <input
                                  type="text"
                                  value={expense.vendor}
                                  onChange={(e) => updateNewExpense(index, 'vendor', e.target.value)}
                                  className="p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  style={{ width: 'calc(100% - 20px)' }}
                                  placeholder="Vendor"
                                />
                              </div>
                              
                              {/* Category */}
                              <div>
                                <input
                                  type="text"
                                  value={expense.category}
                                  onChange={(e) => updateNewExpense(index, 'category', e.target.value)}
                                  className="w-full p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Category"
                                />
                              </div>
                              
                              {/* Description */}
                              <div>
                                <input
                                  type="text"
                                  value={expense.description}
                                  onChange={(e) => updateNewExpense(index, 'description', e.target.value)}
                                  className="w-full p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Description"
                                />
                              </div>
                              
                              {/* Confirm Button */}
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => removeNewExpense(index)}
                                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                                  style={{ background: '#6b7280' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveIndividualExpense(expense, index)}
                                  disabled={isLoading}
                                  className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                                  style={{ background: '#16a34a' }}
                                >
                                  {isLoading ? 'Saving...' : 'Confirm'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-300 text-center py-8">No new expenses to add</p>
                    )}
                  </div>

                {/* Saved Expenses Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">Saved Expenses</h3>
                      <span className="text-sm text-white">(50 most recent)</span>
                    </div>
                  </div>
                  {isLoading || isCacheLoading ? (
                    <div className="text-center text-white mt-8">
                      <p>Loading expenses...</p>
                    </div>
                  ) : expenses.length > 0 ? (
                    <div className="space-y-3">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="bg-black border-2 border-white rounded-2xl p-4 relative">
                          <div className="absolute top-3 right-3 flex gap-2">
                            {expense.receipt_image_id && (
                              <button 
                                onClick={async () => {
                                  try {
                                    const { data: imageRow, error } = await supabase
                                      .from('receipt_images')
                                      .select('image_data')
                                      .eq('id', expense.receipt_image_id)
                                      .single();
                                    
                                    if (error) {
                                      console.error('Error fetching image:', error);
                                      return;
                                    }
                                    
                                    const imageData = imageRow?.image_data;
                                    if (imageData) {
                                      setPreviewImageUrl(imageData);
                                      setShowReceiptPreview(true);
                                    }
                                  } catch (error) {
                                    console.error('Error fetching receipt image:', error);
                                  }
                                }}
                                className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                                style={{ background: '#111' }}
                                title="View Receipt"
                              >
                                📷
                              </button>
                            )}

                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick(expense.id);
                              }}
                              className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                              style={{ background: '#dc2626' }}
                            >
                              Delete
                            </button>
                          </div>
                          <div className="flex items-start justify-between pr-32">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white mb-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                                {expense.vendor}
                              </div>
                              
                              <div className="text-xs font-bold text-white mb-1">
                                {expense.description}
                              </div>
                              
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-bold text-green-400">
                                  R{expense.amount.toFixed(2)}
                                </span>
                                                                  <span className="text-xs font-bold text-white">
                                    Qty: {expense.quantity}
                                  </span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs font-bold text-white">
                                <span>
                                  {new Date(expense.expense_date).toLocaleDateString()}
                                </span>
                                <span className="bg-white text-black px-2 py-1 rounded-full text-xs">
                                  {expense.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-white mt-8">
                      <p>No saved expenses yet.</p>
                      <p className="text-xs text-gray-400 mt-2">Expenses count: {expenses.length}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {showReceiptPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
                      <div className="rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col" style={{ boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }}>
            {/* Modal Header */}
                                         <div 
           className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
           style={{ 
             background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
             border: '2px solid rgba(255, 255, 255, 0.4)',
             boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
             backdropFilter: 'blur(10px)',
             textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
             filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
             transform: 'translateZ(5px)'
           }}
         >
           <h2 
             className="text-white font-bold text-base text-center"
             style={{
               textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
               filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
               transform: 'translateZ(3px)'
             }}
           >
             Receipt Preview
           </h2>
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white"
                style={{ background: '#111' }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="flex-1 px-4 pb-2 overflow-y-auto">
              <img
                src={previewImageUrl}
                alt="Receipt"
                className="w-full h-auto rounded-2xl border-2 border-white"
                style={{ maxHeight: 'calc(90vh - 120px)' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expense Journal Modal */}
      <ExpenseJournalModal
        isOpen={showExpenseJournal}
        onClose={() => setShowExpenseJournal(false)}
      />

      {/* Quick Question Modal */}
      {showQuickQuestion && (
        <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4 ${isCacheLoading ? 'cursor-wait' : ''}`}>
                      <div className="rounded-2xl bg-black p-0 w-full max-w-2xl mx-4 flex flex-col" style={{ boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }}>
            {/* Modal Header */}
                                         <div 
           className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
           style={{ 
             background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
             border: '2px solid rgba(255, 255, 255, 0.4)',
             boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
             backdropFilter: 'blur(10px)',
             textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
             filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
             transform: 'translateZ(5px)'
           }}
         >
           <h2 
             className="text-white font-bold text-base text-center"
             style={{
               textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
               filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
               transform: 'translateZ(3px)'
             }}
           >
             Quick Question
           </h2>
              <button
                onClick={() => setShowQuickQuestion(false)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white"
                style={{ background: '#111' }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="flex-1 px-4 pb-2 overflow-y-auto">
              <div className="space-y-6">
                {/* Cache Loading Message */}
                {isCacheLoading && (
                  <div className="bg-black border-2 border-yellow-500 rounded-2xl p-3 mb-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300"></div>
                      <p className="text-yellow-300 text-sm text-center">
                        Cache loading - please be patient
                      </p>
                    </div>
                  </div>
                )}

                {/* Question Input */}
                <div>
                  <label className="block text-white font-bold text-sm mb-2">
                    Ask your question:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickQuestion}
                      onChange={(e) => setQuickQuestion(e.target.value)}
                      className="flex-1 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm"
                      placeholder="Type your question here..."
                      disabled={isAskingQuestion}
                    />
                    <button
                      onClick={handleMicClick}
                      className={`px-4 py-3 rounded-2xl glassy-btn neon-grid-btn text-white font-bold transition-colors border border-white flex items-center justify-center ${isListening ? 'bg-red-600 animate-pulse' : ''}`}
                      style={{ background: isListening ? '#dc2626' : '#111' }}
                      disabled={isAskingQuestion}
                    >
                      🎤
                    </button>
                  </div>
                  

                  
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setQuickQuestion('')}
                      disabled={isAskingQuestion}
                      className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                      style={{ background: '#111' }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleQuickQuestion}
                      disabled={!quickQuestion.trim() || isAskingQuestion}
                      className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                      style={{ background: '#111' }}
                    >
                      {isAskingQuestion ? 'Asking...' : 'Submit'}
                    </button>
                  </div>
                </div>

                {/* Answer Display */}
                {quickAnswer && (
                  <div>
                    <label className="block text-white font-bold text-sm mb-2">
                      Answer:
                    </label>
                    <textarea
                      value={quickAnswer}
                      readOnly
                      className="w-full p-4 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm h-32 resize-none"
                      placeholder="Answer will appear here..."
                    />
                  </div>
                )}

                {/* Debug: Show Cache Data */}
                <div>
                  <label className="block text-white font-bold text-sm mb-2">
                    Debug - Cache Data ({expenseCache.length} entries):
                  </label>
                  <textarea
                    value={JSON.stringify(expenseCache, null, 2)}
                    readOnly
                    className="w-full p-4 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-xs h-48 resize-none"
                    placeholder="Cache data will appear here..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
          <div className="rounded-2xl bg-black p-0 w-full max-w-md mx-4 flex flex-col" style={{ boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }}>
            <div 
              className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                transform: 'translateZ(5px)'
              }}
            >
              <h2 
                className="text-white font-bold text-base text-center"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                  transform: 'translateZ(3px)'
                }}
              >
                Confirm Deletion
              </h2>
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <button
                  onClick={cancelDelete}
                  className="w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white"
                  style={{ background: '#111' }}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 px-4 pb-2 overflow-y-auto">
              <p className="text-white text-center py-8">Are you sure you want to delete this expense?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                  style={{ background: '#16a34a' }}
                >
                  Save
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white"
                  style={{ background: '#111' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseModal; 