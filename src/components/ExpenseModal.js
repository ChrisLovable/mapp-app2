import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import ExpenseJournalModal from './ExpenseJournalModal';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseAnalytics } from '../services/ExpenseAnalytics';
import { OpenAIService } from '../services/OpenAIService';
import { GlobalSpeechRecognition } from '../hooks/useGlobalSpeechRecognition';
import { QuestionProcessor } from '../services/QuestionProcessor';
// Temporary placeholder functions for missing dependencies
const askOpenAIVision = async (prompt, base64Image) => {
    // Placeholder implementation
    console.warn('askOpenAIVision not implemented, using placeholder');
    return `Extracted text from image: ${prompt}`;
};
const getGPTAnswer = async (prompt) => {
    // Placeholder implementation
    console.warn('getGPTAnswer not implemented, using placeholder');
    return `AI response to: ${prompt}`;
};
const ExpenseModal = ({ isOpen, onClose, currentLanguage }) => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [newExpenses, setNewExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCacheLoading, setIsCacheLoading] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [showExpenseJournal, setShowExpenseJournal] = useState(false);
    const [processingSuccess, setProcessingSuccess] = useState(false);
    const [processingStep, setProcessingStep] = useState('');
    const [showQuickQuestion, setShowQuickQuestion] = useState(false);
    const [quickQuestion, setQuickQuestion] = useState('');
    const [quickAnswer, setQuickAnswer] = useState('');
    const [isAskingQuestion, setIsAskingQuestion] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef(null);
    const [expenseCache, setExpenseCache] = useState([]);
    const [cacheTimestamp, setCacheTimestamp] = useState(0);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, expenseId: null });
    // Initialize services
    const analytics = new ExpenseAnalytics(supabase);
    const openAI = new OpenAIService();
    const questionProcessor = new QuestionProcessor(analytics, openAI);
    // Add helper to save image and get its id
    async function saveReceiptImageToDB(userId, base64) {
        const { data, error } = await supabase
            .from('receipt_images')
            .insert([{ user_id: userId, image_data: base64 }])
            .select('id')
            .single();
        if (error)
            throw error;
        return data.id;
    }
    // OpenAI Vision function for extracting text from images
    const askOpenAIVision = async (prompt, base64Image) => {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please check your .env file.');
        }
        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = base64Image.split(',')[1] || base64Image;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an OCR (Optical Character Recognition) specialist. Extract all text from the provided image, including any tables, numbers, dates, and structured data. Preserve the formatting and structure as much as possible. If you cannot read any text clearly, indicate that with [unreadable]. IMPORTANT: Respond with ONLY the extracted text. Do not add any introductory phrases like "Certainly, here is..." or "Here is the extracted text:". Just provide the raw extracted text directly.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Data}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }
        const data = await response.json();
        const extractedText = data.choices?.[0]?.message?.content?.trim();
        if (!extractedText) {
            throw new Error('No response received from OpenAI Vision API');
        }
        return extractedText;
    };
    // Cache management functions
    const saveExpenseCache = (expenses) => {
        setExpenseCache(expenses);
        setCacheTimestamp(Date.now());
        // Create a cache-safe version without image data to avoid localStorage quota issues
        const cacheSafeExpenses = expenses.map(expense => ({
            id: expense.id,
            expense_date: expense.expense_date,
            vendor: expense.vendor,
            amount: expense.amount,
            quantity: expense.quantity,
            description: expense.description,
            category: expense.category,
            user_id: expense.user_id,
            created_at: expense.created_at,
            receipt_image_id: expense.receipt_image_id,
            // Exclude receipt_image to prevent localStorage quota issues
        }));
        try {
            localStorage.setItem('expenseCache', JSON.stringify(cacheSafeExpenses));
            localStorage.setItem('expenseCacheTimestamp', Date.now().toString());
        }
        catch (error) {
            console.warn('Failed to save expense cache to localStorage:', error);
            // Clear old cache and try again with smaller data
            try {
                localStorage.removeItem('expenseCache');
                localStorage.removeItem('expenseCacheTimestamp');
                // Try with just the most recent expenses
                const recentExpenses = cacheSafeExpenses.slice(0, 10);
                localStorage.setItem('expenseCache', JSON.stringify(recentExpenses));
                localStorage.setItem('expenseCacheTimestamp', Date.now().toString());
            }
            catch (retryError) {
                console.error('Failed to save even reduced cache:', retryError);
            }
        }
    };
    const loadExpenseCache = () => {
        const cache = localStorage.getItem('expenseCache');
        const ts = localStorage.getItem('expenseCacheTimestamp');
        if (cache) {
            try {
                const parsedCache = JSON.parse(cache);
                setExpenseCache(parsedCache);
            }
            catch (error) {
                console.warn('Failed to parse expense cache:', error);
                // Clear corrupted cache
                localStorage.removeItem('expenseCache');
                localStorage.removeItem('expenseCacheTimestamp');
            }
        }
        if (ts)
            setCacheTimestamp(Number(ts));
    };
    useEffect(() => {
        if (isOpen) {
            fetchExpenses();
            setShowImageUpload(true);
            setSelectedImage(null);
            setImagePreview(null);
            setNewExpenses([]);
            setProcessingSuccess(false);
            setProcessingStep('');
            setShowQuickQuestion(false);
            setQuickQuestion('');
            setQuickAnswer('');
        }
    }, [isOpen]);
    // Debug expenses state changes
    useEffect(() => {
        console.log('Expenses state changed:', expenses);
        console.log('Expenses count:', expenses.length);
    }, [expenses]);
    // Update fetchExpenses to use cache
    const fetchExpenses = async (forceRefresh = false) => {
        try {
            console.log('=== FETCH EXPENSES START ===');
            console.log('Force refresh:', forceRefresh);
            console.log('User:', user);
            loadExpenseCache();
            // If cache is recent (<10min) and not forcing refresh, use it
            if (!forceRefresh && Date.now() - cacheTimestamp < 10 * 60 * 1000 && expenseCache.length > 0) {
                console.log('Using cached data, cache length:', expenseCache.length);
                setExpenses(expenseCache);
                return;
            }
        }
        catch (error) {
            console.warn('Cache loading failed, proceeding with fresh data:', error);
        }
        try {
            setIsLoading(true);
            setIsCacheLoading(true);
            console.log('User object in fetchExpenses:', user);
            console.log('User ID in fetchExpenses:', user?.id);
            console.log('Is user authenticated?', !!user);
            if (!user) {
                console.log('No authenticated user found, using dummy user ID for testing');
                // Fallback to dummy user ID if no user is logged in
                const dummyUserId = '00000000-0000-0000-0000-000000000000';
                console.log('Fetching expenses for dummy user:', dummyUserId);
                const { data, error } = await supabase
                    .from('expense_tracker')
                    .select('id, expense_date, vendor, amount, quantity, description, category, receipt_image_id, user_id, created_at')
                    .eq('user_id', dummyUserId)
                    .order('expense_date', { ascending: false })
                    .limit(50);
                if (error) {
                    console.error('Database error for dummy user:', error);
                    // If database fails, try to use cache if available
                    if (expenseCache.length > 0) {
                        console.log('Using cache due to database error');
                        setExpenses(expenseCache);
                    }
                    return;
                }
                console.log('Database data for dummy user:', data);
                setExpenses(data || []);
                if (data) {
                    saveExpenseCache(data);
                }
            }
            else {
                console.log('Fetching expenses for authenticated user:', user.id);
                const { data, error } = await supabase
                    .from('expense_tracker')
                    .select('id, expense_date, vendor, amount, quantity, description, category, receipt_image_id, user_id, created_at')
                    .eq('user_id', user.id)
                    .order('expense_date', { ascending: false })
                    .limit(50);
                if (error) {
                    console.error('Database error for authenticated user:', error);
                    // If database fails, try to use cache if available
                    if (expenseCache.length > 0) {
                        console.log('Using cache due to database error');
                        setExpenses(expenseCache);
                    }
                    return;
                }
                console.log('Database data for authenticated user:', data);
                console.log('Expenses with receipt_image_id:', data?.filter(e => e.receipt_image_id)?.length || 0);
                console.log('Expenses without receipt_image_id:', data?.filter(e => !e.receipt_image_id)?.length || 0);
                console.log('All expense IDs:', data?.map(e => ({ id: e.id, receipt_image_id: e.receipt_image_id })) || []);
                // Check all expenses without user filter to see if there are more
                const { data: allData, error: allError } = await supabase
                    .from('expense_tracker')
                    .select('id, user_id, receipt_image_id')
                    .order('created_at', { ascending: false })
                    .limit(20);
                if (!allError) {
                    console.log('All expenses in database:', allData);
                    console.log('Expenses for this user:', allData?.filter(e => e.user_id === user.id)?.length || 0);
                }
                setExpenses(data || []);
                if (data) {
                    saveExpenseCache(data);
                }
            }
        }
        catch (error) {
            console.error('Error in fetchExpenses:', error);
            // If database fails, try to use cache if available
            if (expenseCache.length > 0) {
                console.log('Using cache due to error');
                setExpenses(expenseCache);
            }
        }
        finally {
            setIsLoading(false);
            setIsCacheLoading(false);
            console.log('=== FETCH EXPENSES COMPLETE ===');
        }
    };
    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // Clear previous data when new image is uploaded
            setSelectedImage(file);
            setNewExpenses([]);
            setImagePreview(null);
            setIsProcessing(true);
            // Automatically start processing the image without showing preview
            processImage(file);
        }
    };
    const processImage = async (file) => {
        try {
            setProcessingStep('Converting image format...');
            // Convert HEIC to JPEG if needed
            let processedFile = file;
            if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                const heic2any = (await import('heic2any')).default;
                processedFile = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.8
                });
            }
            setProcessingStep('Preparing image for analysis...');
            // Convert to base64 for storage
            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(processedFile);
            });
            setProcessingStep('Extracting text from image...');
            // Step 1: Extract text from image using OpenAI Vision
            const extractedText = await askOpenAIVision('Extract all text from this receipt image. Include all text visible on the receipt including vendor name, items, prices, dates, and any other relevant information. Return only the extracted text without any additional formatting or commentary.', base64);
            if (!extractedText) {
                throw new Error('Failed to extract text from image');
            }
            setProcessingStep('Parsing expense data...');
            // Step 2: Parse the extracted text into structured expense data
            const parsePrompt = `Parse the following receipt text into structured expense entries. Extract multiple expense items if present. For each item, provide:
- expense_date: Date from receipt (YYYY-MM-DD format)
- vendor: Store/business name
- amount: Price/amount (number only)
- quantity: Quantity of items (default to 1 if not specified)
- description: Item description
- category: Categorize as: Food, Transportation, Shopping, Entertainment, Health, Utilities, Other

IMPORTANT: You must return ONLY a valid JSON array. Do not include any explanatory text, markdown formatting, or additional commentary. Start with [ and end with ].

Example format:
[
  {
    "expense_date": "2024-01-15",
    "vendor": "Walmart",
    "amount": 25.99,
    "quantity": 2,
    "description": "Milk",
    "category": "Food"
  }
]

Receipt text to parse:
${extractedText}

Return ONLY the JSON array:`;
            // Use a custom GPT call with higher token limit for expense parsing
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('OpenAI API key not found. Please check your .env file.');
            }
            const parseApiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                            content: 'You are an intelligent expense parser. Parse receipt text into structured JSON format. Always return valid JSON arrays.'
                        },
                        {
                            role: 'user',
                            content: parsePrompt
                        }
                    ],
                    max_tokens: 2000, // Increased token limit for expense parsing
                    temperature: 0.1 // Lower temperature for more consistent JSON output
                })
            });
            if (!parseApiResponse.ok) {
                const errorData = await parseApiResponse.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${errorData.error?.message || parseApiResponse.statusText}`);
            }
            const data = await parseApiResponse.json();
            const parseResponse = data.choices[0]?.message?.content;
            if (!parseResponse) {
                throw new Error('No response received from OpenAI');
            }
            if (parseResponse) {
                try {
                    // Try multiple approaches to extract JSON
                    let parsedData = null;
                    // Approach 1: Look for JSON array pattern
                    const jsonMatch = parseResponse.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        try {
                            parsedData = JSON.parse(jsonMatch[0]);
                        }
                        catch (e) {
                            console.log('Failed to parse JSON array match:', e);
                        }
                    }
                    // Approach 2: Try to parse the entire response as JSON
                    if (!parsedData) {
                        try {
                            parsedData = JSON.parse(parseResponse);
                        }
                        catch (e) {
                            console.log('Failed to parse entire response as JSON:', e);
                        }
                    }
                    // Approach 3: Try to extract JSON object and convert to array
                    if (!parsedData) {
                        const objectMatch = parseResponse.match(/\{[\s\S]*\}/);
                        if (objectMatch) {
                            try {
                                const singleObject = JSON.parse(objectMatch[0]);
                                parsedData = [singleObject]; // Convert single object to array
                            }
                            catch (e) {
                                console.log('Failed to parse JSON object match:', e);
                            }
                        }
                    }
                    // Approach 4: Create a fallback expense from the extracted text
                    if (!parsedData) {
                        console.log('Creating fallback expense from extracted text');
                        parsedData = [{
                                expense_date: new Date().toISOString().split('T')[0],
                                vendor: 'Unknown Vendor',
                                amount: 0,
                                quantity: 1,
                                description: extractedText.substring(0, 100) + '...',
                                category: 'Other'
                            }];
                    }
                    if (Array.isArray(parsedData)) {
                        let imageId = null;
                        if (user && base64) {
                            imageId = await saveReceiptImageToDB(user.id, base64);
                        }
                        const expensesWithImageRef = parsedData.map(expense => ({
                            ...expense,
                            receipt_image_id: imageId
                        }));
                        setNewExpenses(expensesWithImageRef);
                        setShowImageUpload(false); // Automatically switch to parsed entries view
                        setImagePreview(base64); // Store the image preview for reference
                        setProcessingSuccess(true); // Mark processing as successful
                        setProcessingStep('✅ Processing complete!');
                    }
                    else {
                        throw new Error('Parsed data is not an array');
                    }
                }
                catch (parseError) {
                    console.error('Error parsing JSON response:', parseError);
                    console.log('Raw parse response:', parseResponse);
                    // Create a fallback expense entry
                    const fallbackExpense = [{
                            expense_date: new Date().toISOString().split('T')[0],
                            vendor: 'Unknown Vendor',
                            amount: 0,
                            quantity: 1,
                            description: 'Failed to parse expense data. Please edit manually.',
                            category: 'Other',
                            receipt_image_id: null // No image for fallback
                        }];
                    setNewExpenses(fallbackExpense);
                    setShowImageUpload(false);
                    setImagePreview(base64);
                    setProcessingSuccess(true);
                    setProcessingStep('⚠️ Processing completed with fallback data');
                }
            }
        }
        catch (error) {
            console.error('Error processing image:', error);
            setIsProcessing(false);
        }
        finally {
            setIsProcessing(false);
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
                receipt_image_id: null // No image for manual entry
            }]);
        // Clear image data for manual entries
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
                receipt_image_id: null // No image for new expense
            }]);
    };
    const updateNewExpense = (index, field, value) => {
        const updated = [...newExpenses];
        updated[index] = { ...updated[index], [field]: value };
        setNewExpenses(updated);
    };
    const removeNewExpense = (index) => {
        setNewExpenses(newExpenses.filter((_, i) => i !== index));
    };
    const saveIndividualExpense = async (expense, index) => {
        try {
            setIsLoading(true);
            if (!user) {
                console.log('No authenticated user found, using dummy user ID for testing');
                // Fallback to dummy user ID if no user is logged in
                const dummyUserId = '00000000-0000-0000-0000-000000000000';
                const { data, error } = await supabase
                    .from('expense_tracker')
                    .insert([{
                        user_id: dummyUserId,
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
                    console.log('This might be due to RLS policies. Try running: ALTER TABLE expense_tracker DISABLE ROW LEVEL SECURITY; in Supabase SQL Editor');
                    return;
                }
                // Remove from new expenses and add to saved expenses
                setNewExpenses(prev => prev.filter((_, i) => i !== index));
                setExpenses(prev => {
                    const updated = [data, ...prev];
                    saveExpenseCache(updated);
                    return updated;
                });
            }
            else {
                const { data, error } = await supabase
                    .from('expense_tracker')
                    .insert([{
                        user_id: user.id,
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
                    console.log('This might be due to RLS policies. Try running: ALTER TABLE expense_tracker DISABLE ROW LEVEL SECURITY; in Supabase SQL Editor');
                    return;
                }
                // Remove from new expenses and add to saved expenses
                setNewExpenses(prev => prev.filter((_, i) => i !== index));
                setExpenses(prev => {
                    const updated = [data, ...prev];
                    saveExpenseCache(updated);
                    return updated;
                });
            }
        }
        catch (error) {
            console.error('Error saving expense:', error);
            console.log('This might be due to RLS policies. Try running: ALTER TABLE expense_tracker DISABLE ROW LEVEL SECURITY; in Supabase SQL Editor');
        }
        finally {
            setIsLoading(false);
        }
    };
    const confirmExpenses = async () => {
        try {
            setIsLoading(true);
            if (!user) {
                console.log('No authenticated user found, using dummy user ID for testing');
                // Fallback to dummy user ID if no user is logged in
                const dummyUserId = '00000000-0000-0000-0000-000000000000';
                const expensesToInsert = newExpenses.map(expense => ({
                    user_id: dummyUserId,
                    expense_date: expense.expense_date,
                    vendor: expense.vendor,
                    amount: expense.amount,
                    quantity: expense.quantity,
                    description: expense.description,
                    category: expense.category,
                    receipt_image_id: expense.receipt_image_id
                }));
                const { error } = await supabase
                    .from('expense_tracker')
                    .insert(expensesToInsert);
                if (error) {
                    console.error('Error inserting expenses:', error);
                    return;
                }
                setNewExpenses([]);
                setImagePreview(null);
                fetchExpenses();
            }
            else {
                const expensesToInsert = newExpenses.map(expense => ({
                    user_id: user.id,
                    expense_date: expense.expense_date,
                    vendor: expense.vendor,
                    amount: expense.amount,
                    quantity: expense.quantity,
                    description: expense.description,
                    category: expense.category,
                    receipt_image_id: expense.receipt_image_id
                }));
                const { error } = await supabase
                    .from('expense_tracker')
                    .insert(expensesToInsert);
                if (error) {
                    console.error('Error inserting expenses:', error);
                    return;
                }
                setNewExpenses([]);
                setImagePreview(null);
                fetchExpenses();
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleDeleteClick = (expenseId) => {
        console.log('Delete button clicked, expense ID:', expenseId);
        setDeleteConfirmModal({ show: true, expenseId });
    };
    const confirmDelete = async () => {
        console.log('Confirm delete clicked, expense ID:', deleteConfirmModal.expenseId);
        if (deleteConfirmModal.expenseId) {
            console.log('Starting deletion process...');
            await deleteExpense(deleteConfirmModal.expenseId);
            console.log('Deletion process completed');
        }
        else {
            console.log('No expense ID found for deletion');
        }
        setDeleteConfirmModal({ show: false, expenseId: null });
    };
    const cancelDelete = () => {
        setDeleteConfirmModal({ show: false, expenseId: null });
    };
    const deleteExpense = async (id) => {
        try {
            console.log('=== DELETE EXPENSE START ===');
            console.log('Expense ID to delete:', id);
            // Check if user exists
            console.log('User object:', user);
            let userId = user?.id;
            if (!userId) {
                console.log('No authenticated user, using dummy user ID');
                userId = '00000000-0000-0000-0000-000000000000';
            }
            console.log('Using user ID for deletion:', userId);
            // Delete the expense
            const { data, error } = await supabase
                .from('expense_tracker')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
            if (error) {
                console.error('Database error during deletion:', error);
                return;
            }
            console.log('Database deletion successful, data:', data);
            // Immediately remove from local state
            console.log('Updating local state...');
            setExpenses(prevExpenses => {
                const filtered = prevExpenses.filter(expense => expense.id !== id);
                console.log('Previous expenses count:', prevExpenses.length);
                console.log('Filtered expenses count:', filtered.length);
                return filtered;
            });
            console.log('=== DELETE EXPENSE COMPLETE ===');
        }
        catch (error) {
            console.error('Error in deleteExpense:', error);
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    const handleQuickQuestion = async () => {
        if (!quickQuestion.trim())
            return;
        setIsAskingQuestion(true);
        setQuickAnswer('');
        try {
            // Get user ID (fallback to dummy for now)
            const userId = user?.id || '00000000-0000-0000-0000-000000000000';
            // Use the new question processor service
            const result = await questionProcessor.processQuestion({
                userId,
                question: quickQuestion,
                dataLimit: 50 // Limit for quick questions
            });
            setQuickAnswer(result.response);
        }
        catch (error) {
            console.error('Error processing quick question:', error);
            setQuickAnswer(`Error: ${error instanceof Error ? error.message : 'Failed to get answer'}`);
        }
        finally {
            setIsAskingQuestion(false);
        }
    };
    const handleMicClick = () => {
        if (isListening) {
            GlobalSpeechRecognition.stop();
            return;
        }
        setIsListening(true);
        GlobalSpeechRecognition.start(currentLanguage, (transcript) => {
            setQuickQuestion(transcript);
        }, () => {
            setIsListening(false);
        }, (error) => {
            alert(`Speech recognition error: ${error}`);
            setIsListening(false);
        });
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: `fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4 ${isProcessing || isCacheLoading ? 'cursor-wait' : ''}`, children: [_jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
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
                                }, children: "Expense entries" }), _jsx("div", { className: "absolute top-2 right-2 flex items-center gap-2", children: _jsx("button", { onClick: onClose, className: "w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" }) })] }), _jsx("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: _jsxs("div", { className: "space-y-6", children: [showImageUpload && (_jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-white font-bold text-sm mb-4", children: "Take a photo of a receipt / upload receipt image from gallery / manually enter an expense" }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*,.heic", onChange: handleImageUpload, className: "hidden" }), _jsx("button", { onClick: () => {
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.setAttribute('capture', 'environment');
                                                            fileInputRef.current.click();
                                                            // Remove capture after click to allow gallery selection later
                                                            setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 1000);
                                                        }
                                                    }, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white mb-2", style: { background: '#111' }, children: "\uD83D\uDCF7 Open Camera" }), isCacheLoading && (_jsx("div", { className: "bg-black border-2 border-yellow-500 rounded-2xl p-3 mb-4", children: _jsxs("div", { className: "flex items-center justify-center space-x-3", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300" }), _jsx("p", { className: "text-yellow-300 text-sm text-center", children: "Cache loading - please be patient" })] }) })), isProcessing ? (_jsxs("div", { className: "text-center space-y-4", children: [_jsxs("div", { className: "inline-flex items-center px-6 py-3 glassy-btn neon-grid-btn text-white rounded-2xl", children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" }), processingStep || 'Processing image...'] }), _jsx("div", { className: "text-yellow-300 text-sm", children: "Please wait while AI analyzes your receipt..." })] })) : (_jsx("button", { onClick: () => fileInputRef.current?.click(), className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, children: "\uD83D\uDDBC\uFE0F Select Image" })), _jsx("div", { className: "mt-6", children: _jsx("button", { onClick: handleManualEntry, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, children: "\u270F\uFE0F Enter Manually" }) }), _jsx("div", { className: "mt-4", children: _jsx("button", { onClick: async () => {
                                                            await fetchExpenses(true);
                                                            setShowQuickQuestion(true);
                                                        }, disabled: isCacheLoading, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, children: isCacheLoading ? '🔄 Loading...' : '❓ Quick Question' }) }), _jsx("div", { className: "mt-2 flex justify-center", children: _jsx("button", { className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, onClick: () => {
                                                            setShowExpenseJournal(true);
                                                        }, children: "Expense Journal" }) })] })] })), !showImageUpload && (_jsxs(_Fragment, { children: [processingSuccess && newExpenses.length > 0 && (_jsx("div", { className: "bg-black border-2 border-green-500 rounded-2xl p-3 mb-4", children: _jsx("p", { className: "text-green-300 text-sm text-center", children: processingStep === '✅ Processing complete!'
                                                    ? '✅ Image processed successfully! Please review and confirm the parsed expenses below.'
                                                    : '✅ Processing complete! Please review and confirm the parsed expenses below.' }) })), isCacheLoading && (_jsx("div", { className: "bg-black border-2 border-yellow-500 rounded-2xl p-3 mb-4", children: _jsxs("div", { className: "flex items-center justify-center space-x-3", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300" }), _jsx("p", { className: "text-yellow-300 text-sm text-center", children: "Cache loading - please be patient" })] }) })), _jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-end mb-4", children: _jsx("div", { className: "flex flex-col gap-2", children: _jsxs("div", { className: "flex gap-2", children: [processingSuccess && (_jsx("button", { onClick: () => {
                                                                        setShowImageUpload(true);
                                                                        setProcessingSuccess(false);
                                                                        setNewExpenses([]);
                                                                        setImagePreview(null);
                                                                    }, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, children: "\uD83D\uDCF7 Upload Another" })), _jsx("button", { onClick: addNewExpense, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white mx-auto block", style: { background: '#111' }, children: "Add new expense manually" })] }) }) }), newExpenses.length > 0 ? (_jsx("div", { className: "space-y-3", children: newExpenses.map((expense, index) => (_jsx("div", { className: "bg-black border-2 border-white rounded-2xl p-4", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "date", value: expense.expense_date, onChange: (e) => updateNewExpense(index, 'expense_date', e.target.value), className: "flex-1 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm" }), _jsx("input", { type: "number", step: "0.01", value: expense.amount === 0 ? '' : expense.amount.toFixed(2), onChange: (e) => updateNewExpense(index, 'amount', parseFloat(e.target.value) || 0), className: "w-24 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm", placeholder: "Amount" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "number", min: "1", value: expense.quantity, onChange: (e) => updateNewExpense(index, 'quantity', parseInt(e.target.value) || 1), className: "w-20 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm", placeholder: "Qty" }), _jsx("input", { type: "text", value: expense.vendor, onChange: (e) => updateNewExpense(index, 'vendor', e.target.value), className: "p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm", style: { width: 'calc(100% - 20px)' }, placeholder: "Vendor" })] }), _jsx("div", { children: _jsx("input", { type: "text", value: expense.category, onChange: (e) => updateNewExpense(index, 'category', e.target.value), className: "w-full p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm", placeholder: "Category" }) }), _jsx("div", { children: _jsx("input", { type: "text", value: expense.description, onChange: (e) => updateNewExpense(index, 'description', e.target.value), className: "w-full p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm", placeholder: "Description" }) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: () => removeNewExpense(index), className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#6b7280' }, children: "Cancel" }), _jsx("button", { onClick: () => saveIndividualExpense(expense, index), disabled: isLoading, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#16a34a' }, children: isLoading ? 'Saving...' : 'Confirm' })] })] }) }, index))) })) : (_jsx("p", { className: "text-gray-300 text-center py-8", children: "No new expenses to add" }))] }), _jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: "Saved Expenses" }), _jsx("span", { className: "text-sm text-white", children: "(50 most recent)" })] }) }), isLoading || isCacheLoading ? (_jsx("div", { className: "text-center text-white mt-8", children: _jsx("p", { children: "Loading expenses..." }) })) : expenses.length > 0 ? (_jsx("div", { className: "space-y-3", children: expenses.map((expense) => (_jsxs("div", { className: "bg-black border-2 border-white rounded-2xl p-4 relative", children: [_jsxs("div", { className: "absolute top-3 right-3 flex gap-2", children: [expense.receipt_image_id && (_jsx("button", { onClick: async () => {
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
                                                                            }
                                                                            catch (error) {
                                                                                console.error('Error fetching receipt image:', error);
                                                                            }
                                                                        }, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, title: "View Receipt", children: "\uD83D\uDCF7" })), _jsx("button", { onClick: (e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            handleDeleteClick(expense.id);
                                                                        }, className: "px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#dc2626' }, children: "Delete" })] }), _jsx("div", { className: "flex items-start justify-between pr-32", children: _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-bold text-white mb-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-xs", children: expense.vendor }), _jsx("div", { className: "text-xs font-bold text-white mb-1", children: expense.description }), _jsxs("div", { className: "flex items-center gap-3 mb-1", children: [_jsxs("span", { className: "text-sm font-bold text-green-400", children: ["R", expense.amount.toFixed(2)] }), _jsxs("span", { className: "text-xs font-bold text-white", children: ["Qty: ", expense.quantity] })] }), _jsxs("div", { className: "flex items-center gap-3 text-xs font-bold text-white", children: [_jsx("span", { children: new Date(expense.expense_date).toLocaleDateString() }), _jsx("span", { className: "bg-white text-black px-2 py-1 rounded-full text-xs", children: expense.category })] })] }) })] }, expense.id))) })) : (_jsxs("div", { className: "text-center text-white mt-8", children: [_jsx("p", { children: "No saved expenses yet." }), _jsxs("p", { className: "text-xs text-gray-400 mt-2", children: ["Expenses count: ", expenses.length] })] }))] })] }))] }) })] }), showReceiptPreview && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
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
                                    }, children: "Receipt Preview" }), _jsx("button", { onClick: () => setShowReceiptPreview(false), className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white", style: { background: '#111' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsx("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: _jsx("img", { src: previewImageUrl, alt: "Receipt", className: "w-full h-auto rounded-2xl border-2 border-white", style: { maxHeight: 'calc(90vh - 120px)' } }) })] }) })), _jsx(ExpenseJournalModal, { isOpen: showExpenseJournal, onClose: () => setShowExpenseJournal(false) }), showQuickQuestion && (_jsx("div", { className: `fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4 ${isCacheLoading ? 'cursor-wait' : ''}`, children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-2xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
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
                                    }, children: "Quick Question" }), _jsx("button", { onClick: () => setShowQuickQuestion(false), className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white", style: { background: '#111' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsx("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: _jsxs("div", { className: "space-y-6", children: [isCacheLoading && (_jsx("div", { className: "bg-black border-2 border-yellow-500 rounded-2xl p-3 mb-4", children: _jsxs("div", { className: "flex items-center justify-center space-x-3", children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-300" }), _jsx("p", { className: "text-yellow-300 text-sm text-center", children: "Cache loading - please be patient" })] }) })), _jsxs("div", { children: [_jsx("label", { className: "block text-white font-bold text-sm mb-2", children: "Ask your question:" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: quickQuestion, onChange: (e) => setQuickQuestion(e.target.value), className: "flex-1 p-3 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm", placeholder: "Type your question here...", disabled: isAskingQuestion }), _jsx("button", { onClick: handleMicClick, className: `px-4 py-3 rounded-2xl glassy-btn neon-grid-btn text-white font-bold transition-colors border border-white flex items-center justify-center ${isListening ? 'bg-red-600 animate-pulse' : ''}`, style: { background: isListening ? '#dc2626' : '#111' }, disabled: isAskingQuestion, children: "\uD83C\uDFA4" })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-3", children: [_jsx("button", { onClick: () => setQuickQuestion(''), disabled: isAskingQuestion, className: "px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, children: "Clear" }), _jsx("button", { onClick: handleQuickQuestion, disabled: !quickQuestion.trim() || isAskingQuestion, className: "px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, children: isAskingQuestion ? 'Asking...' : 'Submit' })] })] }), quickAnswer && (_jsxs("div", { children: [_jsx("label", { className: "block text-white font-bold text-sm mb-2", children: "Answer:" }), _jsx("textarea", { value: quickAnswer, readOnly: true, className: "w-full p-4 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-sm h-32 resize-none", placeholder: "Answer will appear here..." })] })), _jsxs("div", { children: [_jsxs("label", { className: "block text-white font-bold text-sm mb-2", children: ["Debug - Cache Data (", expenseCache.length, " entries):"] }), _jsx("textarea", { value: JSON.stringify(expenseCache, null, 2), readOnly: true, className: "w-full p-4 border-2 border-white rounded-2xl text-white bg-black focus:outline-none text-xs h-48 resize-none", placeholder: "Cache data will appear here..." })] })] }) })] }) })), deleteConfirmModal.show && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-md mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
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
                                    }, children: "Confirm Deletion" }), _jsx("div", { className: "absolute top-2 right-2 flex items-center gap-2", children: _jsx("button", { onClick: cancelDelete, className: "w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors border border-white", style: { background: '#111' }, "aria-label": "Close modal", children: "\u00D7" }) })] }), _jsxs("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: [_jsx("p", { className: "text-white text-center py-8", children: "Are you sure you want to delete this expense?" }), _jsxs("div", { className: "flex justify-center gap-4", children: [_jsx("button", { onClick: confirmDelete, className: "px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#16a34a' }, children: "Save" }), _jsx("button", { onClick: cancelDelete, className: "px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border border-white", style: { background: '#111' }, children: "Cancel" })] })] })] }) }))] }));
};
export default ExpenseModal;
