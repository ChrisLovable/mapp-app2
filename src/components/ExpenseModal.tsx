import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { askOpenAIVision, getGPTAnswer } from '../lib/AskMeLogic';
import ExpenseJournalModal from './ExpenseJournalModal';
import { useAuth } from '../contexts/AuthContext';

interface Expense {
  id: string;
  expense_date: string;
  vendor: string;
  amount: number;
  quantity: number;
  description: string;
  category: string;
  receipt_image?: string;
}

interface ParsedExpense {
  expense_date: string;
  vendor: string;
  amount: number;
  quantity: number;
  description: string;
  category: string;
  _currentImageData?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [expenseCache, setExpenseCache] = useState<Expense[]>([]);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);

  // Cache management functions
  const saveExpenseCache = (expenses: Expense[]) => {
    setExpenseCache(expenses);
    setCacheTimestamp(Date.now());
    localStorage.setItem('expenseCache', JSON.stringify(expenses));
    localStorage.setItem('expenseCacheTimestamp', Date.now().toString());
  };

  const loadExpenseCache = () => {
    const cache = localStorage.getItem('expenseCache');
    const ts = localStorage.getItem('expenseCacheTimestamp');
    if (cache) {
      const parsedCache = JSON.parse(cache);
      setExpenseCache(parsedCache);
    }
    if (ts) setCacheTimestamp(Number(ts));
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

  // Update fetchExpenses to use cache
  const fetchExpenses = async (forceRefresh: boolean = false) => {
    loadExpenseCache();
    // If cache is recent (<10min) and not forcing refresh, use it
    if (!forceRefresh && Date.now() - cacheTimestamp < 10 * 60 * 1000 && expenseCache.length > 0) {
      setExpenses(expenseCache);
      return;
    }
    try {
      setIsLoading(true);
      setIsCacheLoading(true);
      if (!user) {
        console.log('No authenticated user found, using dummy user ID for testing');
        // Fallback to dummy user ID if no user is logged in
        const dummyUserId = '00000000-0000-0000-0000-000000000000';
        const { data, error } = await supabase
          .from('expense_tracker')
          .select('*')
          .eq('user_id', dummyUserId)
          .order('expense_date', { ascending: false });
        if (error) {
          // If database fails, try to use cache if available
          if (expenseCache.length > 0) {
            setExpenses(expenseCache);
          }
          return;
        }
        setExpenses(data || []);
        if (data) {
          saveExpenseCache(data);
        }
      } else {
        const { data, error } = await supabase
          .from('expense_tracker')
          .select('*')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false });
        if (error) {
          // If database fails, try to use cache if available
          if (expenseCache.length > 0) {
            setExpenses(expenseCache);
          }
          return;
        }
        setExpenses(data || []);
        if (data) {
          saveExpenseCache(data);
        }
      }
    } catch (error) {
      // If database fails, try to use cache if available
      if (expenseCache.length > 0) {
        setExpenses(expenseCache);
      }
    } finally {
      setIsLoading(false);
      setIsCacheLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const processImage = async (file: File) => {
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
        }) as File;
      }

      setProcessingStep('Preparing image for analysis...');
      
      // Convert to base64 for storage
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(processedFile);
      });

      setProcessingStep('Extracting text from image...');
      
      // Step 1: Extract text from image using OpenAI Vision
      const extractedText = await askOpenAIVision(
        'Extract all text from this receipt image. Include all text visible on the receipt including vendor name, items, prices, dates, and any other relevant information. Return only the extracted text without any additional formatting or commentary.',
        base64
      );

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
            } catch (e) {
              console.log('Failed to parse JSON array match:', e);
            }
          }
          
          // Approach 2: Try to parse the entire response as JSON
          if (!parsedData) {
            try {
              parsedData = JSON.parse(parseResponse);
            } catch (e) {
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
              } catch (e) {
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
            // Store the current image data with each parsed expense
            const expensesWithImage = parsedData.map(expense => ({
              ...expense,
              _currentImageData: base64 // Add the current image data to each expense
            }));
            setNewExpenses(expensesWithImage);
            setShowImageUpload(false); // Automatically switch to parsed entries view
            setImagePreview(base64); // Store the image preview for reference
            setProcessingSuccess(true); // Mark processing as successful
            setProcessingStep('✅ Processing complete!');
          } else {
            throw new Error('Parsed data is not an array');
          }
        } catch (parseError) {
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
            _currentImageData: base64
          }];
          
          setNewExpenses(fallbackExpense);
          setShowImageUpload(false);
          setImagePreview(base64);
          setProcessingSuccess(true);
          setProcessingStep('⚠️ Processing completed with fallback data');
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
    } finally {
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
      category: ''
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
      category: ''
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
            receipt_image: expense._currentImageData || imagePreview
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
      } else {
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
            receipt_image: expense._currentImageData || imagePreview
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
      
    } catch (error) {
      console.error('Error saving expense:', error);
      console.log('This might be due to RLS policies. Try running: ALTER TABLE expense_tracker DISABLE ROW LEVEL SECURITY; in Supabase SQL Editor');
    } finally {
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
          receipt_image: expense._currentImageData || imagePreview // Use the specific image data for each expense
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
      } else {
        const expensesToInsert = newExpenses.map(expense => ({
          user_id: user.id,
          expense_date: expense.expense_date,
          vendor: expense.vendor,
          amount: expense.amount,
          quantity: expense.quantity,
          description: expense.description,
          category: expense.category,
          receipt_image: expense._currentImageData || imagePreview // Use the specific image data for each expense
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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      if (!user) {
        console.log('No authenticated user found, using dummy user ID for testing');
        // Fallback to dummy user ID if no user is logged in
        const dummyUserId = '00000000-0000-0000-0000-000000000000';
        const { error } = await supabase
          .from('expense_tracker')
          .delete()
          .eq('id', id)
          .eq('user_id', dummyUserId);

        if (error) {
          console.error('Error deleting expense:', error);
          return;
        }
      } else {
        const { error } = await supabase
          .from('expense_tracker')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting expense:', error);
          return;
        }
      }

      fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const analyzeExpenses = (expenses: any[]) => {
    if (!expenses || expenses.length === 0) {
      return {
        totalExpenses: 0,
        totalEntries: 0,
        message: "No expense data available"
      };
    }

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalEntries = expenses.length;
    const totalQuantity = expenses.reduce((sum, expense) => sum + (expense.quantity || 1), 0);

    // Group by category
    const categoryTotals: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};
    const categoryQuantities: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      categoryQuantities[category] = (categoryQuantities[category] || 0) + (expense.quantity || 1);
    });

    // Group by vendor
    const vendorTotals: { [key: string]: number } = {};
    const vendorCounts: { [key: string]: number } = {};
    const vendorQuantities: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      const vendor = expense.vendor || 'Unknown Vendor';
      vendorTotals[vendor] = (vendorTotals[vendor] || 0) + (expense.amount || 0);
      vendorCounts[vendor] = (vendorCounts[vendor] || 0) + 1;
      vendorQuantities[vendor] = (vendorQuantities[vendor] || 0) + (expense.quantity || 1);
    });

    // Date analysis
    const dates = expenses.map(e => e.expense_date).filter(Boolean);
    const earliestDate = dates.length > 0 ? Math.min(...dates.map(d => new Date(d).getTime())) : null;
    const latestDate = dates.length > 0 ? Math.max(...dates.map(d => new Date(d).getTime())) : null;

    // Monthly breakdown
    const monthlyTotals: { [key: string]: number } = {};
    const monthlyQuantities: { [key: string]: number } = {};
    expenses.forEach(expense => {
      if (expense.expense_date) {
        const monthKey = expense.expense_date.substring(0, 7); // YYYY-MM format
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (expense.amount || 0);
        monthlyQuantities[monthKey] = (monthlyQuantities[monthKey] || 0) + (expense.quantity || 1);
      }
    });

    // Recent expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenses = expenses.filter(expense => 
      expense.expense_date && new Date(expense.expense_date) >= thirtyDaysAgo
    );
    const recentTotal = recentExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const recentQuantity = recentExpenses.reduce((sum, expense) => sum + (expense.quantity || 1), 0);

    // Top categories by amount
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, total]) => ({ 
        category, 
        total, 
        count: categoryCounts[category],
        quantity: categoryQuantities[category]
      }));

    // Top vendors by amount
    const topVendors = Object.entries(vendorTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([vendor, total]) => ({ 
        vendor, 
        total, 
        count: vendorCounts[vendor],
        quantity: vendorQuantities[vendor]
      }));

    // Quantity analysis
    const quantityStats = {
      total: totalQuantity,
      average: totalEntries > 0 ? totalQuantity / totalEntries : 0,
      max: Math.max(...expenses.map(e => e.quantity || 1)),
      min: Math.min(...expenses.map(e => e.quantity || 1))
    };

    // Get recent expenses (last 10 for context, but limit data)
    const recentExpenseList = expenses
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
      .slice(0, 10)
      .map(expense => ({
        date: expense.expense_date,
        vendor: expense.vendor,
        amount: expense.amount,
        quantity: expense.quantity || 1,
        category: expense.category,
        description: expense.description?.substring(0, 50) // Limit description length
      }));

    return {
      summary: {
        totalExpenses,
        totalEntries,
        totalQuantity,
        averagePerEntry: totalEntries > 0 ? totalExpenses / totalEntries : 0,
        dateRange: {
          earliest: earliestDate ? new Date(earliestDate).toISOString().split('T')[0] : null,
          latest: latestDate ? new Date(latestDate).toISOString().split('T')[0] : null
        },
        recent30Days: {
          total: recentTotal,
          count: recentExpenses.length,
          quantity: recentQuantity
        }
      },
      categories: {
        totals: categoryTotals,
        counts: categoryCounts,
        quantities: categoryQuantities,
        topCategories
      },
      vendors: {
        totals: vendorTotals,
        counts: vendorCounts,
        quantities: vendorQuantities,
        topVendors
      },
      monthly: {
        totals: monthlyTotals,
        quantities: monthlyQuantities
      },
      quantity: quantityStats,
      recentExpenses: recentExpenseList // Only include recent expenses instead of all
    };
  };

  // Enhanced question classification function
  const classifyQuestion = (question: string) => {
    const lowerQuestion = question.toLowerCase();
    
    // Vendor-related keywords
    const vendorKeywords = ['at', 'from', 'spent at', 'bought at', 'purchased at', 'shopped at', 'store', 'shop', 'vendor', 'merchant'];
    const hasVendorKeywords = vendorKeywords.some(keyword => lowerQuestion.includes(keyword));
    
    // Category-related keywords
    const categoryKeywords = ['category', 'food', 'transportation', 'shopping', 'entertainment', 'health', 'utilities', 'other', 'spent on', 'bought', 'purchased'];
    const hasCategoryKeywords = categoryKeywords.some(keyword => lowerQuestion.includes(keyword));
    
    // Description-related keywords
    const descriptionKeywords = ['what did i buy', 'what did i purchase', 'items', 'products', 'description', 'contains', 'includes', 'bought', 'purchased'];
    const hasDescriptionKeywords = descriptionKeywords.some(keyword => lowerQuestion.includes(keyword));
    
    // Date-related keywords
    const dateKeywords = ['when', 'date', 'today', 'yesterday', 'this week', 'this month', 'last week', 'last month', 'recent', 'latest'];
    const hasDateKeywords = dateKeywords.some(keyword => lowerQuestion.includes(keyword));
    
    // Amount-related keywords (including "Number of" as reference to amount field)
    const amountKeywords = ['how much', 'total', 'amount', 'cost', 'price', 'spent', 'spending', 'budget', 'expensive', 'cheap', 'number of', 'number of transactions', 'number of purchases', 'number of expenses'];
    const hasAmountKeywords = amountKeywords.some(keyword => lowerQuestion.includes(keyword));
    
    // Quantity-related keywords
    const quantityKeywords = ['how many', 'quantity', 'count', 'pieces', 'items', 'units', 'bought', 'purchased', 'total items'];
    const hasQuantityKeywords = quantityKeywords.some(keyword => lowerQuestion.includes(keyword));
    
    // Determine primary question type
    if (hasVendorKeywords) return 'vendor';
    if (hasCategoryKeywords) return 'category';
    if (hasDescriptionKeywords) return 'description';
    if (hasDateKeywords) return 'date';
    if (hasAmountKeywords) return 'amount';
    if (hasQuantityKeywords) return 'quantity';
    
    return 'general';
  };

  // Smart data filtering based on question type
  const getRelevantData = (questionType: string, expenseAnalysis: any) => {
    const maxExpenses = 20; // Limit for GPT-4 token efficiency
    
    switch (questionType) {
      case 'vendor':
        return {
          summary: expenseAnalysis.summary,
          vendors: expenseAnalysis.vendors,
          recentExpenses: expenseAnalysis.recentExpenses?.slice(0, maxExpenses) || []
        };
      
      case 'category':
        return {
          summary: expenseAnalysis.summary,
          categories: expenseAnalysis.categories,
          recentExpenses: expenseAnalysis.recentExpenses?.slice(0, maxExpenses) || []
        };
      
      case 'description':
        // For description questions, provide more detailed expense data
        const detailedExpenses = expenseCache
          .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime())
          .slice(0, maxExpenses)
          .map(expense => ({
            date: expense.expense_date,
            vendor: expense.vendor,
            amount: expense.amount,
            quantity: expense.quantity || 1,
            category: expense.category,
            description: expense.description
          }));
        return {
          summary: expenseAnalysis.summary,
          detailedExpenses
        };
      
      case 'date':
        return {
          summary: expenseAnalysis.summary,
          recentExpenses: expenseAnalysis.recentExpenses?.slice(0, maxExpenses) || [],
          monthlyBreakdown: expenseAnalysis.monthly
        };
      
      case 'amount':
        return {
          summary: expenseAnalysis.summary,
          categories: expenseAnalysis.categories,
          vendors: expenseAnalysis.vendors,
          recentExpenses: expenseAnalysis.recentExpenses?.slice(0, 10) || [],
          totalEntries: expenseAnalysis.summary.totalEntries,
          totalQuantity: expenseAnalysis.summary.totalQuantity
        };
      
      case 'quantity':
        return {
          summary: expenseAnalysis.summary,
          quantity: expenseAnalysis.quantity,
          categories: expenseAnalysis.categories,
          vendors: expenseAnalysis.vendors,
          recentExpenses: expenseAnalysis.recentExpenses?.slice(0, maxExpenses) || []
        };
      
      default:
        return {
          summary: expenseAnalysis.summary,
          quantity: expenseAnalysis.quantity,
          categories: expenseAnalysis.categories?.topCategories || [],
          vendors: expenseAnalysis.vendors?.topVendors || [],
          recentExpenses: expenseAnalysis.recentExpenses?.slice(0, 10) || []
        };
    }
  };

  const handleQuickQuestion = async () => {
    if (!quickQuestion.trim()) return;

    setIsAskingQuestion(true);
    setQuickAnswer('');

    try {
      // Use local cache only
      if (!expenseCache || expenseCache.length === 0) {
        setQuickAnswer('No expense data found in cache. Please add some expenses first.');
        return;
      }
      
      const expenseAnalysis = analyzeExpenses(expenseCache);
      const questionType = classifyQuestion(quickQuestion);
      const relevantData = getRelevantData(questionType, expenseAnalysis);
      
      // Create targeted prompt based on question type
      let contextPrompt = `You are a personal finance assistant. Question type: ${questionType.toUpperCase()}\n\n`;
      
      // Add summary data
      contextPrompt += `SUMMARY: Total $${relevantData.summary?.totalExpenses?.toFixed(2) || '0.00'} (${relevantData.summary?.totalEntries || 0} entries, ${relevantData.summary?.totalQuantity || 0} total items)\n`;
      
      // Add relevant data based on question type
      if (questionType === 'vendor' && relevantData.vendors?.topVendors) {
        contextPrompt += `VENDORS: ${relevantData.vendors.topVendors.map((v: any) => `${v.vendor}: $${v.total.toFixed(2)} (${v.quantity} items)`).join(', ')}\n`;
      }
      
      if (questionType === 'category' && relevantData.categories?.topCategories) {
        contextPrompt += `CATEGORIES: ${relevantData.categories.topCategories.map((c: any) => `${c.category}: $${c.total.toFixed(2)} (${c.quantity} items)`).join(', ')}\n`;
      }
      
      if (questionType === 'quantity' && relevantData.quantity) {
        contextPrompt += `QUANTITY STATS: Total ${relevantData.quantity.total} items, Average ${relevantData.quantity.average.toFixed(1)} per entry, Range ${relevantData.quantity.min}-${relevantData.quantity.max}\n`;
      }
      
      if (questionType === 'amount') {
        // Special handling for "Number of" questions - clarify what the data represents
        if (quickQuestion.toLowerCase().includes('number of')) {
          contextPrompt += `NOTE: "Number of" refers to the count of expense entries/transactions, not monetary amounts.\n`;
          contextPrompt += `TRANSACTION COUNTS: Total ${relevantData.summary?.totalEntries || 0} expense entries\n`;
          if (relevantData.categories?.topCategories) {
            contextPrompt += `CATEGORY COUNTS: ${relevantData.categories.topCategories.map((c: any) => `${c.category}: ${c.count} entries`).join(', ')}\n`;
          }
          if (relevantData.vendors?.topVendors) {
            contextPrompt += `VENDOR COUNTS: ${relevantData.vendors.topVendors.map((v: any) => `${v.vendor}: ${v.count} entries`).join(', ')}\n`;
          }
        } else {
          // Regular amount questions
          if (relevantData.categories?.topCategories) {
            contextPrompt += `CATEGORIES: ${relevantData.categories.topCategories.map((c: any) => `${c.category}: $${c.total.toFixed(2)} (${c.quantity} items)`).join(', ')}\n`;
          }
          if (relevantData.vendors?.topVendors) {
            contextPrompt += `VENDORS: ${relevantData.vendors.topVendors.map((v: any) => `${v.vendor}: $${v.total.toFixed(2)} (${v.quantity} items)`).join(', ')}\n`;
          }
        }
      }
      
      if (questionType === 'description' && relevantData.detailedExpenses) {
        contextPrompt += `DETAILED EXPENSES:\n${relevantData.detailedExpenses.map((e: any) => 
          `${e.date} | ${e.vendor} | $${e.amount} | ${e.quantity} items | ${e.category} | ${e.description || 'No description'}`
        ).join('\n')}\n`;
      } else if (relevantData.recentExpenses) {
        contextPrompt += `RECENT EXPENSES:\n${relevantData.recentExpenses.map((e: any) => 
          `${e.date} | ${e.vendor} | $${e.amount} | ${e.quantity} items | ${e.category}`
        ).join('\n')}\n`;
      }
      
      contextPrompt += `\nUSER QUESTION: "${quickQuestion}"\n\nProvide a specific, helpful answer based on this data. Be precise with amounts, dates, and details.`;
      
      const response = await getGPTAnswer(contextPrompt);
      setQuickAnswer(response);
    } catch (error) {
      setQuickAnswer(`Error: ${error instanceof Error ? error.message : 'Failed to get answer'}`);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      // Stop listening
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Start listening
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuickQuestion(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4 ${isProcessing || isCacheLoading ? 'cursor-wait' : ''}`}>
      <div className="glassy-rainbow-btn rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col border-0" style={{ boxSizing: 'border-box', maxHeight: '90vh' }}>
        {/* Modal Header */}
        <div className="relative mb-6 bg-[var(--favourite-blue)] px-4 py-3 rounded-xl mx-2 mt-2" style={{ background: 'var(--favourite-blue)' }}>
          <h2 className="text-white font-bold text-base text-center">AI Expense Tracker</h2>
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
              style={{ background: '#111' }}
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
                    className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0 mb-2"
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
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                      style={{ background: '#111' }}
                    >
                      📷 Select Image
                    </button>
                  )}
                  
                  <div className="mt-6">
                    <button
                      onClick={handleManualEntry}
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
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
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                      style={{ background: '#111' }}
                    >
                      {isCacheLoading ? '🔄 Loading...' : '❓ Quick Question'}
                    </button>
                  </div>
                  {/* Move Journal button here */}
                  <div className="mt-2 flex justify-center">
                    <button
                      className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
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
                            className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0 text-xs"
                            style={{ background: '#111' }}
                          >
                            📷 Upload Another
                          </button>
                        )}
                        <button
                          onClick={addNewExpense}
                          className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                          style={{ background: '#111' }}
                        >
                          Add New
                        </button>
                      </div>
                      <button
                        onClick={async () => {
                          // Always force a fresh fetch to ensure cache is populated
                          await fetchExpenses(true);
                          setShowQuickQuestion(true);
                        }}
                        disabled={isCacheLoading}
                        className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0 text-xs"
                        style={{ background: '#111' }}
                      >
                        {isCacheLoading ? '🔄 Loading...' : '❓ Quick Question'}
                      </button>
                    </div>
                  </div>
                                      {newExpenses.length > 0 ? (
                      <div className="space-y-3">
                        {newExpenses.map((expense, index) => (
                          <div key={index} className="bg-black border-2 border-[var(--favourite-blue)] rounded-2xl p-4">
                            <div className="space-y-3">
                              {/* Date and Amount */}
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={expense.expense_date}
                                  onChange={(e) => updateNewExpense(index, 'expense_date', e.target.value)}
                                  className="flex-1 p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={expense.amount === 0 ? '' : expense.amount}
                                  onChange={(e) => updateNewExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                                  className="w-24 p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Amount"
                                />
                              </div>
                              
                              {/* Quantity and Vendor */}
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={expense.quantity === 1 ? '' : expense.quantity}
                                  onChange={(e) => updateNewExpense(index, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20 p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Qty"
                                />
                                <input
                                  type="text"
                                  value={expense.vendor}
                                  onChange={(e) => updateNewExpense(index, 'vendor', e.target.value)}
                                  className="flex-1 p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Vendor"
                                />
                              </div>
                              
                              {/* Category */}
                              <div>
                                <input
                                  type="text"
                                  value={expense.category}
                                  onChange={(e) => updateNewExpense(index, 'category', e.target.value)}
                                  className="w-full p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Category"
                                />
                              </div>
                              
                              {/* Description */}
                              <div>
                                <input
                                  type="text"
                                  value={expense.description}
                                  onChange={(e) => updateNewExpense(index, 'description', e.target.value)}
                                  className="w-full p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                                  placeholder="Description"
                                />
                              </div>
                              
                              {/* Confirm Button */}
                              <div className="flex justify-end">
                                <button
                                  onClick={() => saveIndividualExpense(expense, index)}
                                  disabled={isLoading}
                                  className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                                  style={{ background: '#111' }}
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
                  <h3 className="text-white font-bold text-sm mb-4">Saved Expenses</h3>
                  {isLoading || isCacheLoading ? (
                    <div className="text-center text-white mt-8">
                      <p>Loading expenses...</p>
                    </div>
                  ) : expenses.length > 0 ? (
                    <div className="space-y-3">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="bg-black border-2 border-[var(--favourite-blue)] rounded-2xl p-4 relative">
                          <div className="absolute top-3 right-3 flex gap-2">
                            {expense.receipt_image && (
                              <button 
                                onClick={() => {
                                  setPreviewImageUrl(expense.receipt_image!);
                                  setShowReceiptPreview(true);
                                }}
                                className="px-3 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border-0 text-xs"
                                style={{ background: '#111' }}
                                title="View Receipt"
                              >
                                📷
                              </button>
                            )}
                            <button 
                              onClick={() => deleteExpense(expense.id)}
                              className="px-3 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border-0 text-xs"
                              style={{ background: '#111' }}
                            >
                              Delete
                            </button>
                          </div>
                          <div className="flex items-start justify-between pr-32">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white mb-1">
                                {expense.vendor}
                              </div>
                              
                              <div className="text-xs font-bold text-[var(--favourite-blue)] mb-1">
                                {expense.description}
                              </div>
                              
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-bold text-green-400">
                                  R{expense.amount.toFixed(2)}
                                </span>
                                <span className="text-xs font-bold text-[var(--favourite-blue)]">
                                  Qty: {expense.quantity}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs font-bold text-[var(--favourite-blue)]">
                                <span>
                                  {new Date(expense.expense_date).toLocaleDateString()}
                                </span>
                                <span className="bg-[var(--favourite-blue)] text-black px-2 py-1 rounded-full text-xs">
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
          <div className="glassy-rainbow-btn rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col border-0" style={{ boxSizing: 'border-box', maxHeight: '90vh' }}>
            {/* Modal Header */}
            <div className="relative mb-6 bg-[var(--favourite-blue)] px-4 py-3 rounded-xl mx-2 mt-2" style={{ background: 'var(--favourite-blue)' }}>
              <h2 className="text-white font-bold text-base text-center">Receipt Preview</h2>
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
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
                className="w-full h-auto rounded-2xl border-2 border-[var(--favourite-blue)]"
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
          <div className="glassy-rainbow-btn rounded-2xl bg-black p-0 w-full max-w-2xl mx-4 flex flex-col border-0" style={{ boxSizing: 'border-box', maxHeight: '90vh' }}>
            {/* Modal Header */}
            <div className="relative mb-6 bg-[var(--favourite-blue)] px-4 py-3 rounded-xl mx-2 mt-2" style={{ background: 'var(--favourite-blue)' }}>
              <h2 className="text-white font-bold text-base text-center">Quick Question</h2>
              <button
                onClick={() => setShowQuickQuestion(false)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
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
                      className="flex-1 p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                      placeholder="Type your question here..."
                      disabled={isAskingQuestion}
                    />
                    <button
                      onClick={handleMicClick}
                      className={`px-4 py-3 rounded-2xl glassy-btn neon-grid-btn text-white font-bold transition-colors border-0 flex items-center justify-center ${isListening ? 'bg-red-600 animate-pulse' : ''}`}
                      style={{ background: isListening ? '#dc2626' : '#111' }}
                      disabled={isAskingQuestion}
                    >
                      🎤
                    </button>
                  </div>
                  
                  {/* Question Type Indicator */}
                  {quickQuestion.trim() && (
                    <div className="mt-2 text-xs text-gray-300">
                      Question type: <span className="text-[var(--favourite-blue)] font-bold">{classifyQuestion(quickQuestion).toUpperCase()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setQuickQuestion('')}
                      disabled={isAskingQuestion}
                      className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                      style={{ background: '#111' }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleQuickQuestion}
                      disabled={!quickQuestion.trim() || isAskingQuestion}
                      className="px-6 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
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
                      className="w-full p-4 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm h-32 resize-none"
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
                    className="w-full p-4 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-xs h-48 resize-none"
                    placeholder="Cache data will appear here..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseModal; 