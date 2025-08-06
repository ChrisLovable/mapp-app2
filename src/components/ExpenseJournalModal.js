import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import HTMLFlipBook from 'react-pageflip';
import React from 'react'; // Added missing import for React
// Calendar helper functions
const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};
const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};
const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};
const isSameDate = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
};
// Custom Calendar Component
const Calendar = ({ selectedDate, onDateSelect, isOpen, onClose, minDate, maxDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    if (!isOpen)
        return null;
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
    const handleDateClick = (day) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        if (minDate && selectedDate < minDate)
            return;
        if (maxDate && selectedDate > maxDate)
            return;
        onDateSelect(selectedDate);
        onClose();
    };
    const renderCalendarDays = () => {
        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(_jsx("div", { className: "w-10 h-10" }, `empty-${i}`));
        }
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = selectedDate && isSameDate(date, selectedDate);
            const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
            days.push(_jsx("button", { onClick: () => handleDateClick(day), disabled: isDisabled, className: `w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${isSelected
                    ? 'bg-blue-600 text-black shadow-lg transform scale-105'
                    : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-blue-50 hover:text-blue-700 text-gray-700 hover:shadow-md'}`, children: day }, day));
        }
        return days;
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]", onClick: onClose, children: _jsxs("div", { className: "bg-white border-2 border-white rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px]", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("button", { onClick: handlePrevMonth, className: "p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-semibold", children: "\u2190" }), _jsxs("h3", { className: "text-base font-bold text-gray-800", children: [monthNames[currentMonth.getMonth()], " ", currentMonth.getFullYear()] }), _jsx("button", { onClick: handleNextMonth, className: "p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-semibold", children: "\u2192" })] }), _jsx("div", { className: "grid grid-cols-7 gap-1 mb-3", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (_jsx("div", { className: "w-10 h-10 flex items-center justify-center text-sm font-bold text-blue-600", children: day }, day))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: renderCalendarDays() })] }) }));
};
export default function ExpenseJournalModal({ isOpen, onClose }) {
    const flipbookRef = useRef(null);
    const pageTurnAudioRef = useRef(null);
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedVendors, setSelectedVendors] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState('');
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
            }
            else {
                setExpenses(data || []);
                setFilteredExpenses(data || []);
            }
        }
        catch (error) {
            console.error('Error:', error);
            setExpenses([]);
            setFilteredExpenses([]);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Filter expenses based on selected categories, vendors, and date range
    useEffect(() => {
        let filtered = expenses;
        // Filter by categories
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(expense => selectedCategories.includes(expense.category));
        }
        // Filter by vendors
        if (selectedVendors.length > 0) {
            filtered = filtered.filter(expense => selectedVendors.includes(expense.vendor));
        }
        // Filter by date range
        if (startDate || endDate) {
            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.expense_date);
                const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
                const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
                if (start && end) {
                    return expenseDate >= start && expenseDate <= end;
                }
                else if (start) {
                    return expenseDate >= start;
                }
                else if (end) {
                    return expenseDate <= end;
                }
                return true;
            });
        }
        setFilteredExpenses(filtered);
    }, [expenses, selectedCategories, selectedVendors, startDate, endDate]);
    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            }
            else {
                return [...prev, category];
            }
        });
    };
    const handleVendorToggle = (vendor) => {
        setSelectedVendors(prev => {
            if (prev.includes(vendor)) {
                return prev.filter(v => v !== vendor);
            }
            else {
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
    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };
    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };
    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const isSameDate = (date1, date2) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };
    const isDateInRange = (date, start, end) => {
        if (!start && !end)
            return false;
        if (start && end) {
            return date >= start && date <= end;
        }
        if (start)
            return date >= start;
        if (end)
            return date <= end;
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
        const handleKeyDown = (event) => {
            if (!isOpen)
                return;
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
    const formatExpenseDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}-${month}-${year}`;
    };
    const handleViewReceipt = async (receiptImageId) => {
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
        }
        catch (error) {
            console.error('Error fetching receipt image:', error);
        }
    };
    const handleDescriptionClick = (description) => {
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
        _jsxs("div", { className: "flip-page w-full h-full overflow-y-auto bg-black shadow-lg rounded-3xl border border-gray-300 relative", children: [_jsx("img", { src: "/gabby_minimalist.jpg", alt: "Expense Journal Cover", className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("h1", { className: "text-6xl font-bold text-black px-8 py-4 rounded-lg font-serif tracking-wider \n          drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] \n          shadow-[0_0_20px_rgba(0,0,0,0.3),0_0_40px_rgba(0,0,0,0.2),0_0_60px_rgba(0,0,0,0.1)]\n          text-shadow-[2px_2px_4px_rgba(255,255,255,0.8),-2px_-2px_4px_rgba(255,255,255,0.8)]\n          bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm\n          border border-white/30\n          transform hover:scale-105 transition-transform duration-300\n          animate-pulse", children: "EXPENSE JOURNAL" }) })] }, "cover"),
        // Table of Contents Page
        _jsxs("div", { className: "flip-page bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col", children: [_jsx("h2", { className: "text-2xl font-semibold text-amber-800 text-center mb-4", children: "\uD83D\uDCCA Expense Summaries" }), _jsx("div", { className: "mb-4", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm font-medium text-black", children: "From:" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => {
                                                    setShowStartCalendar(!showStartCalendar);
                                                    setShowEndCalendar(false);
                                                }, className: "px-3 py-2 glassy-btn neon-grid-btn border-2 border-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[120px] text-left transition-colors shadow-sm text-white", style: { background: '#111' }, children: startDate ? formatDate(startDate) : 'Start Date' }), _jsx(Calendar, { selectedDate: startDate, onDateSelect: setStartDate, isOpen: showStartCalendar, onClose: () => setShowStartCalendar(false), maxDate: endDate || new Date() })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm font-medium text-black", children: "To:" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => {
                                                    setShowEndCalendar(!showEndCalendar);
                                                    setShowStartCalendar(false);
                                                }, className: "px-3 py-2 glassy-btn neon-grid-btn border-2 border-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[120px] text-left transition-colors shadow-sm text-white", style: { background: '#111' }, children: endDate ? formatDate(endDate) : 'End Date' }), _jsx(Calendar, { selectedDate: endDate, onDateSelect: setEndDate, isOpen: showEndCalendar, onClose: () => setShowEndCalendar(false), minDate: startDate || undefined, maxDate: new Date() })] })] })] }) }), _jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-black mb-2 text-left", children: "Filter by Category:" }), _jsx("div", { className: "max-h-32 overflow-y-auto", children: _jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: Array.from(new Set(expenses.map(e => e.category))).sort().map(category => (_jsx("button", { onClick: () => handleCategoryToggle(category), className: `px-3 py-1 rounded-full text-sm font-medium border transition-colors glassy-btn neon-grid-btn ${selectedCategories.includes(category)
                                        ? 'text-white border-amber-400'
                                        : 'text-white border-white'}`, style: { background: selectedCategories.includes(category) ? '#059669' : '#111' }, children: category }, category))) }) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-black mb-2 text-left", children: "Filter by Vendor:" }), _jsx("div", { className: "max-h-32 overflow-y-auto", children: _jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: Array.from(new Set(expenses.map(e => e.vendor))).sort().map(vendor => (_jsx("button", { onClick: () => handleVendorToggle(vendor), className: `px-3 py-1 rounded-full text-sm font-medium border transition-colors glassy-btn neon-grid-btn ${selectedVendors.includes(vendor)
                                        ? 'text-white border-amber-400'
                                        : 'text-white border-white'}`, style: { background: selectedVendors.includes(vendor) ? '#059669' : '#111' }, children: vendor }, vendor))) }) })] }), (selectedCategories.length > 0 || selectedVendors.length > 0 || startDate || endDate) && (_jsx("div", { className: "mb-4 flex justify-center", children: _jsx("button", { onClick: clearFilters, className: "px-4 py-2 glassy-btn neon-grid-btn text-white rounded-xl text-sm font-medium transition-colors border border-white", style: { background: '#dc2626' }, children: "Clear All Filters" }) })), _jsx("div", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "text-center text-black mt-4", children: [(selectedCategories.length > 0 || selectedVendors.length > 0 || startDate || endDate) && (_jsx("div", { className: "text-sm mt-1", children: selectedVendors.length > 0 && (_jsxs("p", { className: "text-green-600", children: ["Vendors: ", selectedVendors.join(', ')] })) })), _jsxs("div", { className: "mt-6 p-2 bg-green-50 border-2 border-green-300 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-green-700 mb-1", children: "Total Amount" }), _jsxs("p", { className: "text-xl font-bold text-green-800", children: ["R", filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)] })] })] }) })] }, "toc"),
        // Dashboard Overview Page
        _jsxs("div", { className: "flip-page bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col", children: [_jsx("h2", { className: "text-2xl font-semibold text-blue-800 text-center mb-6", children: "\uD83D\uDCCA Dashboard Overview" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Spent" }), _jsxs("p", { className: "text-2xl font-bold text-green-600", children: ["R", filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)] })] }), _jsx("div", { className: "text-3xl text-green-500", children: "\uD83D\uDCB0" })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { children: _jsx("p", { className: "text-2xl font-bold text-blue-600", children: filteredExpenses.length }) }), _jsx("div", { className: "text-3xl text-blue-500", children: "\uD83D\uDCDD" })] }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Average per Entry" }), _jsxs("p", { className: "text-2xl font-bold text-purple-600", children: ["R", filteredExpenses.length > 0 ? (filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) / filteredExpenses.length).toFixed(2) : '0.00'] })] }), _jsx("div", { className: "text-3xl text-purple-500", children: "\uD83D\uDCCA" })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm border border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Categories Used" }), _jsx("p", { className: "text-2xl font-bold text-orange-600", children: Array.from(new Set(filteredExpenses.map(e => e.category))).length })] }), _jsx("div", { className: "text-3xl text-orange-500", children: "\uD83C\uDFF7\uFE0F" })] }) })] }), _jsxs("div", { className: "flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-700 mb-4", children: "Recent Activity" }), _jsx("div", { className: "space-y-3", children: filteredExpenses.slice(0, 5).map((expense) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-gray-800", children: expense.description }), _jsxs("div", { className: "text-sm text-gray-600", children: [expense.category, " \u2022 ", expense.vendor, " \u2022 ", new Date(expense.expense_date).toLocaleDateString()] })] }), _jsx("div", { className: "text-right", children: _jsxs("div", { className: "font-bold text-green-600", children: ["R", expense.amount.toFixed(2)] }) })] }, expense.id))) })] })] }, "dashboard-overview"),
        // Category Pie Chart Page
        _jsxs("div", { className: "flip-page bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col", children: [_jsx("h2", { className: "text-2xl font-semibold text-green-800 text-center mb-6", children: "\uD83E\uDD67 Spending by Category" }), _jsxs("div", { className: "flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-700 mb-6 text-center", children: "Category Distribution" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 h-full", children: [_jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "relative w-64 h-64", children: [(() => {
                                                const categoryTotals = filteredExpenses.reduce((acc, expense) => {
                                                    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                                                    return acc;
                                                }, {});
                                                const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
                                                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
                                                let currentAngle = 0;
                                                return Object.entries(categoryTotals)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([category, amount], index) => {
                                                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                                                    const angle = (percentage / 100) * 360;
                                                    const color = colors[index % colors.length];
                                                    const slice = (_jsx("div", { className: "absolute inset-0 rounded-full", style: {
                                                            background: `conic-gradient(from ${currentAngle}deg, ${color} 0deg, ${color} ${angle}deg, transparent ${angle}deg)`,
                                                            transform: 'rotate(-90deg)'
                                                        } }, category));
                                                    currentAngle += angle;
                                                    return slice;
                                                });
                                            })(), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg", children: _jsx("span", { className: "text-lg font-bold text-gray-700", children: "Total" }) }) })] }) }), _jsx("div", { className: "flex flex-col justify-center", children: _jsx("div", { className: "space-y-3", children: (() => {
                                            const categoryTotals = filteredExpenses.reduce((acc, expense) => {
                                                acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                                                return acc;
                                            }, {});
                                            const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
                                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
                                            return Object.entries(categoryTotals)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([category, amount], index) => {
                                                const percentage = total > 0 ? (amount / total) * 100 : 0;
                                                const color = colors[index % colors.length];
                                                return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: color } }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "font-medium text-gray-700", children: category }), _jsxs("span", { className: "text-gray-600", children: [percentage.toFixed(1), "%"] })] }), _jsxs("div", { className: "text-sm text-gray-500", children: ["R", amount.toFixed(2)] })] })] }, category));
                                            });
                                        })() }) })] })] })] }, "dashboard-category-pie"),
        // Vendor Pie Chart Page
        _jsxs("div", { className: "flip-page bg-gradient-to-br from-purple-50 to-violet-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col", children: [_jsx("h2", { className: "text-2xl font-semibold text-purple-800 text-center mb-6", children: "\uD83C\uDFEA Spending by Vendor" }), _jsxs("div", { className: "flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-700 mb-6 text-center", children: "Vendor Distribution" }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 h-full", children: [_jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "relative w-64 h-64", children: [(() => {
                                                const vendorTotals = filteredExpenses.reduce((acc, expense) => {
                                                    acc[expense.vendor] = (acc[expense.vendor] || 0) + expense.amount;
                                                    return acc;
                                                }, {});
                                                const total = Object.values(vendorTotals).reduce((sum, amount) => sum + amount, 0);
                                                const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'];
                                                let currentAngle = 0;
                                                return Object.entries(vendorTotals)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 8) // Top 8 vendors
                                                    .map(([vendor, amount], index) => {
                                                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                                                    const angle = (percentage / 100) * 360;
                                                    const color = colors[index % colors.length];
                                                    const slice = (_jsx("div", { className: "absolute inset-0 rounded-full", style: {
                                                            background: `conic-gradient(from ${currentAngle}deg, ${color} 0deg, ${color} ${angle}deg, transparent ${angle}deg)`,
                                                            transform: 'rotate(-90deg)'
                                                        } }, vendor));
                                                    currentAngle += angle;
                                                    return slice;
                                                });
                                            })(), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("div", { className: "bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg", children: _jsx("span", { className: "text-lg font-bold text-gray-700", children: "Total" }) }) })] }) }), _jsx("div", { className: "flex flex-col justify-center", children: _jsx("div", { className: "space-y-3", children: (() => {
                                            const vendorTotals = filteredExpenses.reduce((acc, expense) => {
                                                acc[expense.vendor] = (acc[expense.vendor] || 0) + expense.amount;
                                                return acc;
                                            }, {});
                                            const total = Object.values(vendorTotals).reduce((sum, amount) => sum + amount, 0);
                                            const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#84CC16'];
                                            return Object.entries(vendorTotals)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 8) // Top 8 vendors
                                                .map(([vendor, amount], index) => {
                                                const percentage = total > 0 ? (amount / total) * 100 : 0;
                                                const color = colors[index % colors.length];
                                                return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: color } }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "font-medium text-gray-700", children: vendor }), _jsxs("span", { className: "text-gray-600", children: [percentage.toFixed(1), "%"] })] }), _jsxs("div", { className: "text-sm text-gray-500", children: ["R", amount.toFixed(2)] })] })] }, vendor));
                                            });
                                        })() }) })] })] })] }, "dashboard-vendor-pie"),
        // Top Expenses Page
        _jsxs("div", { className: "flip-page bg-gradient-to-br from-pink-50 to-rose-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col", children: [_jsx("h2", { className: "text-2xl font-semibold text-pink-800 text-center mb-6", children: "\uD83C\uDFC6 Top Expenses Analysis" }), _jsxs("div", { className: "flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: [_jsx("h3", { className: "text-xl font-semibold text-gray-700 mb-6 text-center", children: "Largest Transactions" }), _jsx("div", { className: "space-y-4", children: (() => {
                                const sortedExpenses = [...filteredExpenses]
                                    .sort((a, b) => b.amount - a.amount)
                                    .slice(0, 10);
                                return sortedExpenses.map((expense, index) => {
                                    const date = new Date(expense.expense_date);
                                    const isTop3 = index < 3;
                                    return (_jsx("div", { className: `p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${isTop3
                                            ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200'
                                            : 'bg-gray-50 border-gray-200'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' :
                                                                index === 1 ? 'bg-gray-400' :
                                                                    index === 2 ? 'bg-orange-500' : 'bg-blue-500'}`, children: index + 1 }), _jsxs("div", { children: [_jsx("div", { className: "font-semibold text-gray-800", children: expense.description }), _jsxs("div", { className: "text-sm text-gray-600", children: [expense.category, " \u2022 ", expense.vendor, " \u2022 ", date.toLocaleDateString()] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-xl font-bold text-green-600", children: ["R", expense.amount.toFixed(2)] }), _jsxs("div", { className: "text-xs text-gray-500", children: [((expense.amount / filteredExpenses.reduce((sum, e) => sum + e.amount, 0)) * 100).toFixed(1), "% of total"] })] })] }) }, expense.id));
                                });
                            })() })] })] }, "dashboard-top-expenses")
    ];
    // Add expense pages to the array
    expensePages.forEach((pageExpenses, pageIndex) => {
        allPages.push(_jsx("div", { className: "flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto", children: _jsxs("div", { className: "page-content overflow-y-auto h-full p-6", style: { maxHeight: '100%', overflowY: 'auto' }, children: [_jsxs("h3", { className: "text-xl font-semibold text-blue-800 text-center mb-4", children: ["Expense Entries - Page ", pageIndex + 1] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "bg-white border border-white rounded-lg shadow-lg", children: [_jsx("thead", { className: "bg-blue-600 text-white", children: _jsxs("tr", { children: [_jsx("th", { className: "px-1 py-1 text-left text-[10px] font-semibold w-20 border border-blue-200", children: "Date" }), _jsx("th", { className: "px-1 py-1 text-left text-[10px] font-semibold w-20 border border-blue-200", children: "Vendor" }), _jsx("th", { className: "px-1 py-1 text-left text-[10px] font-semibold border border-blue-200", style: { width: '40px' }, children: "Description" }), _jsx("th", { className: "px-1 py-1 text-left text-[10px] font-semibold w-20 border border-blue-200", children: "Amount" }), _jsx("th", { className: "px-1 py-1 text-center text-[10px] font-semibold w-20 border border-blue-200", children: "Image" })] }) }), _jsx("tbody", { children: pageExpenses.map((expense) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-1 py-1 text-[10px] font-medium text-black w-20 whitespace-nowrap overflow-hidden border border-blue-200", children: formatExpenseDate(expense.expense_date) }), _jsx("td", { className: "px-1 py-1 text-[10px] text-black font-medium w-20 whitespace-nowrap overflow-hidden border border-blue-200", children: expense.vendor }), _jsx("td", { className: "px-1 py-1 text-[10px] text-blue-600 underline whitespace-nowrap overflow-hidden border border-blue-200 text-left cursor-pointer hover:bg-blue-100", style: { width: '40px' }, onClick: () => handleDescriptionClick(expense.description), title: "Click to view full description", children: expense.description.length > 8 ? expense.description.substring(0, 8) + '...' : expense.description }), _jsxs("td", { className: "px-1 py-1 text-[10px] font-semibold text-green-600 w-20 whitespace-nowrap overflow-hidden border border-blue-200", children: ["R", expense.amount.toFixed(2)] }), _jsx("td", { className: "px-1 py-1 text-center w-20 border border-blue-200", children: expense.receipt_image_id && (_jsx("button", { onClick: () => handleViewReceipt(expense.receipt_image_id), className: "text-blue-600 hover:text-blue-800 transition-colors cursor-pointer", title: "View Receipt", children: "\uD83D\uDCF7" })) })] }, expense.id))) })] }) })] }) }, `expense-${pageIndex}`));
    });
    // Add empty page if no expenses
    if (expensePages.length === 0) {
        allPages.push(_jsx("div", { className: "flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto", children: _jsx("div", { className: "page-content overflow-y-auto h-full p-6", style: { maxHeight: '100%', overflowY: 'auto' }, children: _jsxs("div", { className: "text-center text-gray-600 mt-8", children: [_jsx("h3", { className: "text-xl font-semibold mb-4", children: "No Expenses Found" }), _jsx("p", { children: "Your expense journal is empty." }), _jsx("p", { className: "text-sm mt-2", children: "Add some expenses to see them here!" })] }) }) }, "empty"));
    }
    // Remove all debug console.log statements at the end of the file
    // Debug: Log pages to identify null values
    // console.log('All pages:', allPages);
    // console.log('Pages length:', allPages.length);
    // console.log('Pages with null/undefined:', allPages.filter(page => !page).length);
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 bg-amber-50 bg-opacity-95 flex items-center justify-center z-50 p-4", children: [_jsxs("div", { className: "w-full h-full max-w-6xl max-h-[90vh] mx-auto relative", children: [_jsx("button", { onClick: handleClose, className: "absolute top-4 right-4 glassy-btn neon-grid-btn text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors z-10", style: { background: '#111' }, children: "\u00D7" }), _jsxs("div", { className: "absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-10", children: [_jsx("button", { onClick: handlePreviousPage, className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border border-white text-xs", style: { background: '#111', minWidth: '100px' }, children: "\u2190 Previous" }), _jsx("button", { onClick: handleNextPage, className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border border-white text-xs", style: { background: '#111', minWidth: '100px' }, children: "Next \u2192" })] }), _jsx("div", { className: "w-full h-full flex items-center justify-center", style: { overflow: 'auto' }, children: isLoading ? (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("div", { className: "text-gray-600", children: "Loading expense journal..." })] })) : (_jsx("div", { className: "w-full h-full", style: { overflow: 'auto' }, children: _jsx(HTMLFlipBook, { width: Math.min(window.innerWidth * 0.9, 500), height: Math.min(window.innerHeight * 0.85, 700), size: "fixed", minWidth: 280, maxWidth: 500, minHeight: 400, maxHeight: 700, showCover: true, flippingTime: 500, usePortrait: true, startPage: 0, drawShadow: true, maxShadowOpacity: 0.5, useMouseEvents: true, className: "flipbook w-full h-full", style: { touchAction: 'auto' }, mobileScrollSupport: true, onFlip: () => {
                                    handlePageTurn();
                                }, onChangeState: () => {
                                    // State changed
                                }, ref: flipbookRef, startZIndex: 1, autoSize: false, clickEventForward: true, swipeDistance: 30, showPageCorners: false, disableFlipByClick: false, children: allPages.filter(Boolean).map((page, index) => (_jsx("div", { children: page }, `page-${index}`))) }) })) })] }), showReceiptPreview && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
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
                                    }, children: "Receipt Preview" }), _jsx("button", { onClick: () => setShowReceiptPreview(false), className: "absolute top-2 right-2 text-white hover:text-gray-300 transition-colors text-xl font-bold", children: "\u00D7" })] }), _jsx("div", { className: "flex-1 overflow-hidden px-4 pb-4", children: _jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx("img", { src: previewImageUrl, alt: "Receipt", className: "max-w-full max-h-full object-contain rounded-lg", style: { maxHeight: 'calc(90vh - 120px)' } }) }) })] }) })), showDescriptionModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-2xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
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
                                    }, children: "Full Description" }), _jsx("button", { onClick: () => setShowDescriptionModal(false), className: "absolute top-2 right-2 text-white hover:text-gray-300 transition-colors text-xl font-bold", children: "\u00D7" })] }), _jsx("div", { className: "flex-1 overflow-hidden px-4 pb-4", children: _jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx("p", { className: "text-white text-lg p-6 bg-gray-800 rounded-lg max-w-full", children: selectedDescription }) }) })] }) }))] }));
}
