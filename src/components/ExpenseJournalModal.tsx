import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import HTMLFlipBook from 'react-pageflip';
import React from 'react'; // Added missing import for React

interface ExpenseJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExpenseEntry {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  receipt_image_id?: string;
}

// Calendar helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const isSameDate = (date1: Date, date2: Date) => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

// Custom Calendar Component
const Calendar = ({ 
  selectedDate, 
  onDateSelect, 
  isOpen, 
  onClose, 
  minDate, 
  maxDate 
}: {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate && selectedDate < minDate) return;
    if (maxDate && selectedDate > maxDate) return;
    onDateSelect(selectedDate);
    onClose();
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = selectedDate && isSameDate(date, selectedDate);
      const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isSelected
              ? 'bg-blue-600 text-black shadow-lg transform scale-105'
              : isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-blue-50 hover:text-blue-700 text-gray-700 hover:shadow-md'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white border-2 border-white rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-semibold"
          >
            ←
          </button>
          <h3 className="text-base font-bold text-gray-800">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-semibold"
          >
            →
          </button>
        </div>
      
      <div className="grid grid-cols-7 gap-1 mb-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="w-10 h-10 flex items-center justify-center text-sm font-bold text-blue-600">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      </div>
    </div>
  );
};

export default function ExpenseJournalModal({ isOpen, onClose }: ExpenseJournalModalProps) {
  const flipbookRef = useRef<any>(null);
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState<string>('');

  // Fetch expense entries from database
  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase
        .from('expense_tracker')
        .select('id, expense_date, category, description, vendor, amount, receipt_image_id')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        setExpenses([]);
      } else {
        setExpenses(data || []);
        setFilteredExpenses(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setExpenses([]);
      setFilteredExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter expenses based on selected categories, vendors, and date range
  useEffect(() => {
    let filtered = expenses;
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(expense => 
        selectedCategories.includes(expense.category)
      );
    }
    
    // Filter by vendors
    if (selectedVendors.length > 0) {
      filtered = filtered.filter(expense => 
        selectedVendors.includes(expense.vendor)
      );
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
        const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
        
        if (start && end) {
          return expenseDate >= start && expenseDate <= end;
        } else if (start) {
          return expenseDate >= start;
        } else if (end) {
          return expenseDate <= end;
        }
        return true;
      });
    }
    
    setFilteredExpenses(filtered);
  }, [expenses, selectedCategories, selectedVendors, startDate, endDate]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleVendorToggle = (vendor: string) => {
    setSelectedVendors(prev => {
      if (prev.includes(vendor)) {
        return prev.filter(v => v !== vendor);
      } else {
        return [...prev, vendor];
      }
    });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedVendors([]);
    setStartDate(null);
    setEndDate(null);
    setShowStartCalendar(false);
    setShowEndCalendar(false);
  };

  // Calendar helper functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isDateInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start && !end) return false;
    if (start && end) {
      return date >= start && date <= end;
    }
    if (start) return date >= start;
    if (end) return date <= end;
    return false;
  };

  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen]);

  useEffect(() => {
    // Initialize audio element
    pageTurnAudioRef.current = new Audio('/pageturn.mp3');
    pageTurnAudioRef.current.preload = 'auto';
    
    return () => {
      if (pageTurnAudioRef.current) {
        pageTurnAudioRef.current.pause();
        pageTurnAudioRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handlePreviousPage = () => {
    const flip = flipbookRef.current?.pageFlip();
    if (flip && typeof flip.flipPrev === 'function') {
      flip.flipPrev();
    }
  };

  const handleNextPage = () => {
    const flip = flipbookRef.current?.pageFlip();
    if (flip && typeof flip.flipNext === 'function') {
      flip.flipNext();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowLeft':
          handlePreviousPage();
          break;
        case 'ArrowRight':
          handleNextPage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePageTurn = () => {
    if (pageTurnAudioRef.current) {
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const formatExpenseDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const handleViewReceipt = async (receiptImageId: string) => {
    try {
      const { data: imageRow, error } = await supabase
        .from('receipt_images')
        .select('image_data')
        .eq('id', receiptImageId)
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
  };

  const handleDescriptionClick = (description: string) => {
    setSelectedDescription(description);
    setShowDescriptionModal(true);
  };

  // Split expenses into pages (20 entries per page)
  const entriesPerPage = 20;
  const expensePages = [];
  for (let i = 0; i < filteredExpenses.length; i += entriesPerPage) {
    expensePages.push(filteredExpenses.slice(i, i + entriesPerPage));
  }

  // Create all pages array
  const allPages = [
    // Cover Page
            <div key="cover" className="flip-page w-full h-full overflow-y-auto bg-black shadow-lg rounded-3xl border border-gray-300 relative">
      <img
        src="/gabby_minimalist.jpg"
        alt="Expense Journal Cover"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="text-6xl font-bold text-black px-8 py-4 rounded-lg font-serif tracking-wider 
          drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] 
          shadow-[0_0_20px_rgba(0,0,0,0.3),0_0_40px_rgba(0,0,0,0.2),0_0_60px_rgba(0,0,0,0.1)]
          text-shadow-[2px_2px_4px_rgba(255,255,255,0.8),-2px_-2px_4px_rgba(255,255,255,0.8)]
          bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm
          border border-white/30
          transform hover:scale-105 transition-transform duration-300
          animate-pulse">
          EXPENSE JOURNAL
        </h1>
      </div>
    </div>,

    // Table of Contents Page
            <div key="toc" className="flip-page bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col">
      <h2 className="text-2xl font-semibold text-amber-800 text-center mb-4">📊 Expense Summaries</h2>
      
      {/* Date Range Filter */}
      <div className="mb-4">

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">From:</span>
            <div className="relative">
              <button
                onClick={() => {
                  setShowStartCalendar(!showStartCalendar);
                  setShowEndCalendar(false);
                }}
                className="px-3 py-2 glassy-btn neon-grid-btn border-2 border-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[120px] text-left transition-colors shadow-sm text-white"
                style={{ background: '#111' }}
              >
                {startDate ? formatDate(startDate) : 'Start Date'}
              </button>
              <Calendar
                selectedDate={startDate}
                onDateSelect={setStartDate}
                isOpen={showStartCalendar}
                onClose={() => setShowStartCalendar(false)}
                maxDate={endDate || new Date()}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-black">To:</span>
            <div className="relative">
              <button
                onClick={() => {
                  setShowEndCalendar(!showEndCalendar);
                  setShowStartCalendar(false);
                }}
                className="px-3 py-2 glassy-btn neon-grid-btn border-2 border-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[120px] text-left transition-colors shadow-sm text-white"
                style={{ background: '#111' }}
              >
                {endDate ? formatDate(endDate) : 'End Date'}
              </button>
              <Calendar
                selectedDate={endDate}
                onDateSelect={setEndDate}
                isOpen={showEndCalendar}
                onClose={() => setShowEndCalendar(false)}
                minDate={startDate || undefined}
                maxDate={new Date()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-black mb-2 text-left">Filter by Category:</h3>
        <div className="max-h-32 overflow-y-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from(new Set(expenses.map(e => e.category))).sort().map(category => (
              <button
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors glassy-btn neon-grid-btn ${
                  selectedCategories.includes(category)
                    ? 'text-white border-amber-400'
                    : 'text-white border-white'
                }`}
                style={{ background: selectedCategories.includes(category) ? '#059669' : '#111' }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Filter */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-black mb-2 text-left">Filter by Vendor:</h3>
        <div className="max-h-32 overflow-y-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from(new Set(expenses.map(e => e.vendor))).sort().map(vendor => (
              <button
                key={vendor}
                onClick={() => handleVendorToggle(vendor)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors glassy-btn neon-grid-btn ${
                  selectedVendors.includes(vendor)
                    ? 'text-white border-amber-400'
                    : 'text-white border-white'
                }`}
                style={{ background: selectedVendors.includes(vendor) ? '#059669' : '#111' }}
              >
                {vendor}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {(selectedCategories.length > 0 || selectedVendors.length > 0 || startDate || endDate) && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={clearFilters}
            className="px-4 py-2 glassy-btn neon-grid-btn text-white rounded-xl text-sm font-medium transition-colors border border-white"
            style={{ background: '#dc2626' }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="text-center text-black mt-4">
          {(selectedCategories.length > 0 || selectedVendors.length > 0 || startDate || endDate) && (
            <div className="text-sm mt-1">
              {selectedVendors.length > 0 && (
                <p className="text-green-600">
                  Vendors: {selectedVendors.join(', ')}
                </p>
              )}

            </div>
          )}
          
          {/* Total Amount Display */}
          <div className="mt-6 p-2 bg-green-50 border-2 border-green-300 rounded-lg">
            <p className="text-lg font-bold text-green-700 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-green-800">
              R{filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>,

    // Dashboard Overview Page
            <div key="dashboard-overview" className="flip-page bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col">
      <h2 className="text-2xl font-semibold text-blue-800 text-center mb-6">📊 Dashboard Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">
                R{filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-3xl text-green-500">💰</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{filteredExpenses.length}</p>
            </div>
            <div className="text-3xl text-blue-500">📝</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average per Entry</p>
              <p className="text-2xl font-bold text-purple-600">
                R{filteredExpenses.length > 0 ? (filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) / filteredExpenses.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="text-3xl text-purple-500">📊</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories Used</p>
              <p className="text-2xl font-bold text-orange-600">
                {Array.from(new Set(filteredExpenses.map(e => e.category))).length}
              </p>
            </div>
            <div className="text-3xl text-orange-500">🏷️</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {filteredExpenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">{expense.description}</div>
                <div className="text-sm text-gray-600">
                  {expense.category} • {expense.vendor} • {new Date(expense.expense_date).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">R{expense.amount.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,

    // Category Pie Chart Page
            <div key="dashboard-category-pie" className="flip-page bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col">
      <h2 className="text-2xl font-semibold text-green-800 text-center mb-6">🥧 Spending by Category</h2>
      
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">Category Distribution</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Pie Chart Visualization */}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              {(() => {
                const categoryTotals = filteredExpenses.reduce((acc, expense) => {
                  acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                  return acc;
                }, {} as Record<string, number>);
                
                const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
                
                let currentAngle = 0;
                return Object.entries(categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount], index) => {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    const angle = (percentage / 100) * 360;
                    const color = colors[index % colors.length];
                    
                    const slice = (
                      <div
                        key={category}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(from ${currentAngle}deg, ${color} 0deg, ${color} ${angle}deg, transparent ${angle}deg)`,
                          transform: 'rotate(-90deg)'
                        }}
                      />
                    );
                    
                    currentAngle += angle;
                    return slice;
                  });
              })()}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-gray-700">Total</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-col justify-center">
            <div className="space-y-3">
              {(() => {
                const categoryTotals = filteredExpenses.reduce((acc, expense) => {
                  acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                  return acc;
                }, {} as Record<string, number>);
                
                const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
                
                return Object.entries(categoryTotals)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount], index) => {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{category}</span>
                            <span className="text-gray-600">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="text-sm text-gray-500">R{amount.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>,

    // Vendor Pie Chart Page
            <div key="dashboard-vendor-pie" className="flip-page bg-gradient-to-br from-purple-50 to-violet-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col">
      <h2 className="text-2xl font-semibold text-purple-800 text-center mb-6">🏪 Spending by Vendor</h2>
      
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">Vendor Distribution</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Pie Chart Visualization */}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              {(() => {
                const vendorTotals = filteredExpenses.reduce((acc, expense) => {
                  acc[expense.vendor] = (acc[expense.vendor] || 0) + expense.amount;
                  return acc;
                }, {} as Record<string, number>);
                
                const total = Object.values(vendorTotals).reduce((sum, amount) => sum + amount, 0);
                const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'];
                
                let currentAngle = 0;
                return Object.entries(vendorTotals)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8) // Top 8 vendors
                  .map(([vendor, amount], index) => {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    const angle = (percentage / 100) * 360;
                    const color = colors[index % colors.length];
                    
                    const slice = (
                      <div
                        key={vendor}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(from ${currentAngle}deg, ${color} 0deg, ${color} ${angle}deg, transparent ${angle}deg)`,
                          transform: 'rotate(-90deg)'
                        }}
                      />
                    );
                    
                    currentAngle += angle;
                    return slice;
                  });
              })()}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-gray-700">Total</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex flex-col justify-center">
            <div className="space-y-3">
              {(() => {
                const vendorTotals = filteredExpenses.reduce((acc, expense) => {
                  acc[expense.vendor] = (acc[expense.vendor] || 0) + expense.amount;
                  return acc;
                }, {} as Record<string, number>);
                
                const total = Object.values(vendorTotals).reduce((sum, amount) => sum + amount, 0);
                const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'];
                
                return Object.entries(vendorTotals)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8) // Top 8 vendors
                  .map(([vendor, amount], index) => {
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={vendor} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">{vendor}</span>
                            <span className="text-gray-600">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="text-sm text-gray-500">R{amount.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>,

    // Top Expenses Page
            <div key="dashboard-top-expenses" className="flip-page bg-gradient-to-br from-pink-50 to-rose-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col">
      <h2 className="text-2xl font-semibold text-pink-800 text-center mb-6">🏆 Top Expenses Analysis</h2>
      
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">Largest Transactions</h3>
        
        <div className="space-y-4">
          {(() => {
            const sortedExpenses = [...filteredExpenses]
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 10);
            
            return sortedExpenses.map((expense, index) => {
              const date = new Date(expense.expense_date);
              const isTop3 = index < 3;
              
              return (
                <div 
                  key={expense.id} 
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    isTop3 
                      ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{expense.description}</div>
                        <div className="text-sm text-gray-600">
                          {expense.category} • {expense.vendor} • {date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">R{expense.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        {((expense.amount / filteredExpenses.reduce((sum, e) => sum + e.amount, 0)) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  ];

  // Add expense pages to the array
  expensePages.forEach((pageExpenses, pageIndex) => {
    allPages.push(
      <div key={`expense-${pageIndex}`} className="flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto">
        <div className="page-content overflow-y-auto h-full p-6" style={{ maxHeight: '100%', overflowY: 'auto' }}>
          <h3 className="text-xl font-semibold text-blue-800 text-center mb-4">
            Expense Entries - Page {pageIndex + 1}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="bg-white border border-white rounded-lg shadow-lg">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-1 py-1 text-left text-[10px] font-semibold w-20 border border-blue-200">Date</th>
                  <th className="px-1 py-1 text-left text-[10px] font-semibold w-20 border border-blue-200">Vendor</th>
                  <th className="px-1 py-1 text-left text-[10px] font-semibold border border-blue-200" style={{ width: '40px' }}>Description</th>
                  <th className="px-1 py-1 text-left text-[10px] font-semibold w-20 border border-blue-200">Amount</th>
                  <th className="px-1 py-1 text-center text-[10px] font-semibold w-20 border border-blue-200">Image</th>
                </tr>
              </thead>
              <tbody>
                {pageExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-1 py-1 text-[10px] font-medium text-black w-20 whitespace-nowrap overflow-hidden border border-blue-200">
                      {formatExpenseDate(expense.expense_date)}
                    </td>
                    <td className="px-1 py-1 text-[10px] text-black font-medium w-20 whitespace-nowrap overflow-hidden border border-blue-200">
                      {expense.vendor}
                    </td>
                    <td 
                      className="px-1 py-1 text-[10px] text-blue-600 underline whitespace-nowrap overflow-hidden border border-blue-200 text-left cursor-pointer hover:bg-blue-100" 
                      style={{ width: '40px' }}
                      onClick={() => handleDescriptionClick(expense.description)}
                      title="Click to view full description"
                    >
                      {expense.description.length > 8 ? expense.description.substring(0, 8) + '...' : expense.description}
                    </td>
                    <td className="px-1 py-1 text-[10px] font-semibold text-green-600 w-20 whitespace-nowrap overflow-hidden border border-blue-200">
                      R{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-1 py-1 text-center w-20 border border-blue-200">
                      {expense.receipt_image_id && (
                        <button
                          onClick={() => handleViewReceipt(expense.receipt_image_id!)}
                          className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          title="View Receipt"
                        >
                          📷
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  });

  // Add empty page if no expenses
  if (expensePages.length === 0) {
    allPages.push(
      <div key="empty" className="flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto">
        <div className="page-content overflow-y-auto h-full p-6" style={{ maxHeight: '100%', overflowY: 'auto' }}>
          <div className="text-center text-gray-600 mt-8">
            <h3 className="text-xl font-semibold mb-4">No Expenses Found</h3>
            <p>Your expense journal is empty.</p>
            <p className="text-sm mt-2">Add some expenses to see them here!</p>
          </div>
        </div>
      </div>
    );
  }

  // Remove all debug console.log statements at the end of the file
  // Debug: Log pages to identify null values
  // console.log('All pages:', allPages);
  // console.log('Pages length:', allPages.length);
  // console.log('Pages with null/undefined:', allPages.filter(page => !page).length);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-amber-50 bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="w-full h-full max-w-6xl max-h-[90vh] mx-auto relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 glassy-btn neon-grid-btn text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors z-10"
          style={{ background: '#111' }}
        >
          ×
        </button>

        {/* Navigation Buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
          <button
            onClick={handlePreviousPage}
            className="px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border border-white text-xs"
            style={{ background: '#111', minWidth: '100px' }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNextPage}
            className="px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border border-white text-xs"
            style={{ background: '#111', minWidth: '100px' }}
          >
            Next →
          </button>
        </div>

        {/* Flipbook Content */}
        <div className="w-full h-full flex items-center justify-center" style={{ overflow: 'auto' }}>
          {isLoading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading expense journal...</div>
            </div>
          ) : (
            <div className="w-full h-full" style={{ overflow: 'auto' }}>
              <HTMLFlipBook
                width={Math.min(window.innerWidth * 0.9, 500)}
                height={Math.min(window.innerHeight * 0.85, 700)}
                size="fixed"
                minWidth={280}
                maxWidth={500}
                minHeight={400}
                maxHeight={700}
                showCover={true}
                flippingTime={500}
                usePortrait={true}
                startPage={0}
                drawShadow={true}
                maxShadowOpacity={0.5}
                useMouseEvents={true}
                className="flipbook w-full h-full"
                style={{ touchAction: 'auto' }}
                mobileScrollSupport={true}
                onFlip={() => {
                  handlePageTurn();
                }}
                onChangeState={() => {
                  // State changed
                }}
                ref={flipbookRef}
                startZIndex={1}
                autoSize={false}
                clickEventForward={true}
                swipeDistance={30}
                showPageCorners={false}
                disableFlipByClick={false}
              >
                {allPages.filter(Boolean).map((page, index) => (
                  <div key={`page-${index}`}>
                    {page}
                  </div>
                ))}
              </HTMLFlipBook>
            </div>
          )}
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
                className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Image Content */}
            <div className="flex-1 overflow-hidden px-4 pb-4">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={previewImageUrl}
                  alt="Receipt"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  style={{ maxHeight: 'calc(90vh - 120px)' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
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
                Full Description
              </h2>
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Description Content */}
            <div className="flex-1 overflow-hidden px-4 pb-4">
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white text-lg p-6 bg-gray-800 rounded-lg max-w-full">
                  {selectedDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 