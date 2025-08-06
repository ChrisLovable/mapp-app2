import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import HTMLFlipBook from 'react-pageflip';
import CustomDatePicker from './CustomDatePicker';
// Calendar component for date filtering
const Calendar = ({ selectedDate, onDateSelect, isOpen, onClose, minDate, maxDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    const handleDateClick = (day) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        onDateSelect(selectedDate);
        onClose();
    };
    const renderCalendarDays = () => {
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
        const days = [];
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(_jsx("div", { className: "w-10 h-10" }, `empty-${i}`));
        }
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
            days.push(_jsx("button", { onClick: () => !isDisabled && handleDateClick(day), className: `w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${isSelected
                    ? 'bg-blue-600 text-white'
                    : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'hover:bg-blue-100 cursor-pointer'}`, disabled: isDisabled, children: day }, day));
        }
        return days;
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]", onClick: onClose, children: _jsxs("div", { className: "bg-white border-2 border-white rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px]", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("button", { onClick: handlePrevMonth, className: "p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-semibold", children: "\u2190" }), _jsxs("h3", { className: "text-base font-bold text-gray-800", children: [monthNames[currentMonth.getMonth()], " ", currentMonth.getFullYear()] }), _jsx("button", { onClick: handleNextMonth, className: "p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 font-semibold", children: "\u2192" })] }), _jsx("div", { className: "grid grid-cols-7 gap-1 mb-3", children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (_jsx("div", { className: "w-10 h-10 flex items-center justify-center text-sm font-bold text-blue-600", children: day }, day))) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: renderCalendarDays() })] }) }));
};
// Updated Text Overflow Split Logic
function splitDiaryEntryIntoPages(entry, maxChars = 500) {
    const words = entry.content.split(' ');
    const pages = [];
    let pageText = '';
    words.forEach(word => {
        if ((pageText + word).length < maxChars) {
            pageText += word + ' ';
        }
        else {
            pages.push({
                date: entry.date, // Show date on every page
                content: pageText.trim(),
                images: undefined, // No images on intermediate pages
                chapter: pages.length === 0 ? entry.chapter : undefined, // Only show chapter on 1st page
                id: pages.length === 0 ? entry.id : `${entry.id}_page_${pages.length}`
            });
            pageText = word + ' ';
        }
    });
    if (pageText.trim()) {
        pages.push({
            date: entry.date,
            content: pageText.trim(),
            images: entry.images, // Only show images on the last page
            chapter: pages.length === 0 ? entry.chapter : undefined, // Only show chapter on 1st page
            id: pages.length === 0 ? entry.id : `${entry.id}_page_${pages.length}`
        });
    }
    return pages;
}
export default function DiaryFlipbook({ isOpen, onClose }) {
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const flipbookRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [chapterIndexMap, setChapterIndexMap] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [filteredEntries, setFilteredEntries] = useState([]);
    // Remove all date range filtering, date pickers, and related state/effects/UI
    // Remove: startDate, endDate, filteredEntries, isUsingTestData, CustomDatePicker, filterEntriesByDateRange, and all related UI
    // Only show all entries as pages, no filtering
    // Debug selectedImage changes
    useEffect(() => {
        console.log('selectedImage changed:', selectedImage);
    }, [selectedImage]);
    // Filter entries based on date range
    useEffect(() => {
        let filtered = entries;
        // Filter by date range
        if (startDate || endDate) {
            filtered = entries.filter(entry => {
                const entryDate = new Date(entry.date);
                const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
                const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;
                if (start && end) {
                    return entryDate >= start && entryDate <= end;
                }
                else if (start) {
                    return entryDate >= start;
                }
                else if (end) {
                    return entryDate <= end;
                }
                return true;
            });
        }
        setFilteredEntries(filtered);
    }, [entries, startDate, endDate]);
    // Build chapter index map based on filtered entries
    useEffect(() => {
        const map = {};
        filteredEntries.forEach((entry, index) => {
            if (entry.chapter && !map[entry.chapter]) {
                map[entry.chapter] = index + 2; // +2 to account for Cover + TOC pages
            }
        });
        setChapterIndexMap(map);
        console.log('Chapter index map (filtered):', map);
    }, [filteredEntries]);
    // Initialize filteredEntries when entries are first loaded
    useEffect(() => {
        if (entries.length > 0) {
            console.log('Initializing filtered entries with all entries');
            // setFilteredEntries(entries); // This line is no longer needed
        }
    }, [entries]);
    // Remove the global click listener for debugging
    // useEffect(() => {
    //   const handleGlobalClick = (e: MouseEvent) => {
    //     console.log('Global click detected on:', e.target);
    //   };
    //   document.addEventListener('click', handleGlobalClick);
    //   return () => {
    //     document.removeEventListener('click', handleGlobalClick);
    //   };
    // }, []);
    const pageTurnAudioRef = useRef(null);
    // Fetch all diary entries
    const fetchAllEntries = async () => {
        setIsLoading(true);
        try {
            console.log('🔄 Fetching diary entries from database...');
            const { data, error } = await supabase
                .from('diary_entries')
                .select('*')
                .order('entry_date', { ascending: false });
            if (error) {
                console.error('❌ Error fetching entries:', error);
                // Show error in the flipbook
                setEntries([{
                        date: new Date().toISOString().split('T')[0],
                        content: `Error loading diary entries: ${error.message}`,
                        chapter: 'Error',
                        id: 'error'
                    }]);
                return;
            }
            console.log('📊 Raw database data:', data);
            console.log('📊 Number of entries found:', data?.length || 0);
            // Entries fetched successfully
            if (data && data.length > 0) {
                // Transform database entries to structured format
                const structuredEntries = data.map(entry => {
                    console.log('📝 Processing entry:', entry);
                    return {
                        date: entry.entry_date,
                        content: entry.content,
                        images: entry.photo_urls || [],
                        chapter: entry.diary_chapter,
                        id: entry.id
                    };
                });
                console.log('🔄 Structured entries:', structuredEntries);
                // Split entries into pages
                const allPages = [];
                structuredEntries.forEach(entry => {
                    const pages = splitDiaryEntryIntoPages(entry, 500);
                    console.log(`📄 Split entry into ${pages.length} pages`);
                    allPages.push(...pages);
                });
                console.log('📚 Total pages after splitting:', allPages.length);
                console.log('📚 Setting entries:', allPages);
                setEntries(allPages);
                // Initialize filtered entries with all entries
                // setFilteredEntries(allPages); // This line is no longer needed
            }
            else {
                console.log('⚠️ No entries found in database');
                // No entries found in database - add some test data for demonstration
                const testEntries = [
                    {
                        date: new Date().toISOString().split('T')[0],
                        content: 'Today was a wonderful day! I spent time working on my diary application and made great progress. The flipbook feature is coming along nicely, and I\'m excited to see it working properly. I also took some time to relax and enjoy the beautiful weather outside. Later in the day, I went for a walk in the park and saw some beautiful flowers blooming. The spring weather has been absolutely perfect for outdoor activities. I made a mental note to bring my camera next time so I can capture some of these beautiful moments. In the evening, I worked on some personal projects and felt very productive. It\'s amazing how much you can accomplish when you\'re in the right mindset. I\'m looking forward to tomorrow and all the possibilities it brings.',
                        chapter: 'Daily Diary',
                        id: 'test1',
                        images: []
                    },
                    {
                        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                        content: 'Yesterday was quite productive as well. I focused on learning new technologies and expanding my knowledge base. The learning process is always exciting, especially when you can see immediate results from your efforts. I also had a great conversation with a friend about future plans and goals. It\'s always inspiring to talk with people who share similar aspirations and can offer different perspectives on life and work. The weather was a bit cloudy, but that didn\'t dampen my spirits. Sometimes the best days are the ones where you find joy in the simple things, like a good book, a warm cup of tea, or meaningful conversations.',
                        chapter: 'Daily Diary',
                        id: 'test2',
                        images: []
                    },
                    {
                        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
                        content: 'Two days ago was a day of reflection. I spent time thinking about my goals and aspirations, and how I can better align my daily actions with my long-term vision. It\'s important to periodically step back and assess where you are versus where you want to be. I also took some time to organize my workspace and clear out unnecessary clutter. A clean environment really does help with focus and productivity. In the evening, I read a chapter from a book I\'ve been meaning to finish, and it provided some valuable insights that I\'ll carry forward.',
                        chapter: 'Reflections',
                        id: 'test3',
                        images: []
                    }
                ];
                // Split test entries into pages
                const allPages = [];
                testEntries.forEach(entry => {
                    const pages = splitDiaryEntryIntoPages(entry, 500);
                    console.log(`📄 Split test entry into ${pages.length} pages`);
                    allPages.push(...pages);
                });
                console.log('📚 Setting test entries:', allPages.length);
                setEntries(allPages);
                // setFilteredEntries(allPages); // This line is no longer needed
            }
        }
        catch (error) {
            console.error('❌ Error fetching entries:', error);
            setEntries([]);
            // setFilteredEntries([]); // This line is no longer needed
        }
        finally {
            setIsLoading(false);
        }
    };
    // Remove the createTestEntry function since it's no longer needed
    // const createTestEntry = async () => { ... };
    useEffect(() => {
        console.log('DiaryFlipbook useEffect - isOpen changed to:', isOpen);
        if (isOpen) {
            console.log('DiaryFlipbook is open - calling fetchAllEntries');
            fetchAllEntries();
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
        console.log('Close button clicked - closing diary flipbook');
        onClose();
    };
    const handlePreviousPage = () => {
        console.log('Previous button clicked, flipbookRef:', flipbookRef.current);
        if (flipbookRef.current) {
            try {
                const flip = flipbookRef.current.pageFlip();
                if (flip && typeof flip.flipPrev === 'function') {
                    console.log('Using flip.flipPrev()');
                    flip.flipPrev();
                }
                else {
                    console.error('flip.flipPrev method not found');
                }
            }
            catch (error) {
                console.error('Error flipping to previous page:', error);
            }
        }
        else {
            console.log('Flipbook ref not available');
        }
    };
    const handleNextPage = () => {
        console.log('Next button clicked, flipbookRef:', flipbookRef.current);
        if (flipbookRef.current) {
            try {
                const flip = flipbookRef.current.pageFlip();
                if (flip && typeof flip.flipNext === 'function') {
                    console.log('Using flip.flipNext()');
                    flip.flipNext();
                }
                else {
                    console.error('flip.flipNext method not found');
                }
            }
            catch (error) {
                console.error('Error flipping to next page:', error);
            }
        }
        else {
            console.log('Flipbook ref not available');
        }
    };
    const handleImageClick = (imageUrl, event) => {
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        setSelectedImage(imageUrl);
    };
    const handleCloseImageModal = (event) => {
        console.log('Closing image modal');
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.nativeEvent.stopImmediatePropagation();
        }
        setSelectedImage(null);
    };
    // Handle keyboard events for modal
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (selectedImage && event.key === 'Escape') {
                console.log('Escape key pressed, closing modal');
                setSelectedImage(null);
            }
        };
        if (selectedImage) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [selectedImage]);
    const handlePageTurn = () => {
        if (pageTurnAudioRef.current) {
            pageTurnAudioRef.current.currentTime = 0;
            pageTurnAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }
    };
    const clearFilters = () => {
        setStartDate(null);
        setEndDate(null);
        setShowStartCalendar(false);
        setShowEndCalendar(false);
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    // Calculate page number within the current date entry
    const getPageNumberWithinDate = (currentIndex) => {
        if (currentIndex === 0)
            return 1;
        const currentDate = entries[currentIndex].date;
        let pageNumber = 1;
        // Count backwards to find pages with the same date
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (entries[i].date === currentDate) {
                pageNumber++;
            }
            else {
                break;
            }
        }
        return pageNumber;
    };
    console.log('DiaryFlipbook render - isOpen:', isOpen, 'entries.length:', entries.length, 'isLoading:', isLoading);
    if (!isOpen)
        return null;
    console.log('DiaryFlipbook returning JSX - isOpen:', isOpen);
    return (_jsxs("div", { className: "fixed inset-0 bg-amber-50 bg-opacity-95 flex items-center justify-center z-[9999] p-4", children: [_jsxs("div", { className: "w-full h-full max-w-6xl max-h-[90vh] mx-auto relative", children: [_jsx("button", { onClick: handleClose, className: "absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center z-20", style: { background: '#111', border: 'none', outline: 'none' }, children: "\u00D7" }), _jsxs("div", { className: "absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 z-10", children: [_jsx("button", { onClick: handlePreviousPage, className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border border-white text-xs", style: { background: '#111', minWidth: '100px' }, children: "\u2190 Previous" }), _jsx("button", { onClick: handleNextPage, className: "px-4 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border border-white text-xs", style: { background: '#111', minWidth: '100px' }, children: "Next \u2192" })] }), _jsx("div", { className: "w-full h-full flex items-center justify-center", children: isLoading ? (_jsx("div", { className: "text-white text-xl", children: "Loading diary..." })) : entries.length === 0 ? (_jsx("div", { className: "w-full h-full", children: _jsxs(HTMLFlipBook, { width: Math.min(window.innerWidth * 0.9, 500), height: Math.min(window.innerHeight * 0.85, 700), size: "fixed", minWidth: 280, maxWidth: 500, minHeight: 400, maxHeight: 700, showCover: true, flippingTime: 1000, usePortrait: true, startPage: 0, drawShadow: true, maxShadowOpacity: 0.5, useMouseEvents: true, className: "flipbook w-full h-full", style: { touchAction: 'none' }, mobileScrollSupport: false, onFlip: () => {
                                    handlePageTurn();
                                }, onChangeState: () => {
                                    // State changed
                                }, ref: flipbookRef, startZIndex: 1, autoSize: false, clickEventForward: true, swipeDistance: 30, showPageCorners: false, disableFlipByClick: false, children: [_jsxs("div", { className: "flip-page w-full h-full overflow-hidden bg-black shadow-lg rounded-3xl border border-gray-300 relative", children: [_jsx("img", { src: "/gabby_cute.jpg", alt: "Diary Cover", className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 flex items-start justify-center pt-20", children: _jsx("h1", { className: "text-6xl md:text-7xl font-bold text-center", style: {
                                                        color: '#FFD700',
                                                        textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.5)',
                                                        fontFamily: 'cursive, serif',
                                                        letterSpacing: '2px',
                                                        transform: 'rotate(-2deg)',
                                                        background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                                                        backgroundClip: 'text',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.6))'
                                                    }, children: "My Diary" }) })] }), _jsx("div", { className: "flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-hidden", children: _jsxs("div", { className: "page-content overflow-y-auto h-full", children: [_jsx("h2", { className: "text-center font-semibold text-lg text-blue-800 mb-4", children: "No Diary Entries Found" }), _jsxs("div", { className: "text-center text-gray-600 mt-8", children: [_jsx("p", { className: "text-lg mb-4", children: "Your diary is empty" }), _jsx("p", { className: "text-sm", children: "Create your first diary entry to get started!" })] })] }) })] }) })) : (_jsx("div", { className: "w-full h-full", children: _jsxs(HTMLFlipBook, { width: Math.min(window.innerWidth * 0.9, 500), height: Math.min(window.innerHeight * 0.85, 700), size: "fixed", minWidth: 280, maxWidth: 500, minHeight: 400, maxHeight: 700, showCover: true, flippingTime: 1000, usePortrait: true, startPage: 0, drawShadow: true, maxShadowOpacity: 0.5, useMouseEvents: true, className: "flipbook w-full h-full", style: { touchAction: 'none' }, mobileScrollSupport: false, onFlip: () => {
                                    handlePageTurn();
                                }, onChangeState: () => {
                                    // State changed
                                }, ref: flipbookRef, startZIndex: 1, autoSize: false, clickEventForward: true, swipeDistance: 30, showPageCorners: false, disableFlipByClick: false, children: [_jsxs("div", { className: "flip-page w-full h-full overflow-hidden bg-black shadow-lg rounded-3xl border border-gray-300 relative", children: [_jsx("img", { src: "/gabby_cute.jpg", alt: "Diary Cover", className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 flex items-start justify-center pt-20", children: _jsx("h1", { className: "text-6xl md:text-7xl font-bold text-center", style: {
                                                        color: '#FFD700',
                                                        textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.5)',
                                                        fontFamily: 'cursive, serif',
                                                        letterSpacing: '2px',
                                                        transform: 'rotate(-2deg)',
                                                        background: 'linear-gradient(45deg, #FFD700, #FFA500, #FFD700)',
                                                        backgroundClip: 'text',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.6))'
                                                    }, children: "My Diary" }) })] }), _jsxs("div", { className: "flip-page bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-y-auto p-6 flex flex-col", children: [_jsx("h2", { className: "text-2xl font-semibold text-amber-800 text-center mb-4", children: "\uD83D\uDCD6 Table of Contents" }), _jsx("div", { className: "mb-4", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm font-medium text-black", children: "From:" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => {
                                                                                setShowStartCalendar(!showStartCalendar);
                                                                                setShowEndCalendar(false);
                                                                            }, className: "px-3 py-2 glassy-btn neon-grid-btn border-2 border-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[120px] text-left transition-colors shadow-sm text-white", style: { background: '#111' }, children: startDate ? startDate.toLocaleDateString() : 'Start Date' }), _jsx(Calendar, { selectedDate: startDate, onDateSelect: setStartDate, isOpen: showStartCalendar, onClose: () => setShowStartCalendar(false), maxDate: endDate || new Date() })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-sm font-medium text-black", children: "To:" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => {
                                                                                setShowEndCalendar(!showEndCalendar);
                                                                                setShowStartCalendar(false);
                                                                            }, className: "px-3 py-2 glassy-btn neon-grid-btn border-2 border-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[120px] text-left transition-colors shadow-sm text-white", style: { background: '#111' }, children: endDate ? endDate.toLocaleDateString() : 'End Date' }), _jsx(Calendar, { selectedDate: endDate, onDateSelect: setEndDate, isOpen: showEndCalendar, onClose: () => setShowEndCalendar(false), minDate: startDate || undefined, maxDate: new Date() })] })] })] }) }), (startDate || endDate) && (_jsx("div", { className: "mb-4 flex justify-center", children: _jsx("button", { onClick: clearFilters, className: "px-4 py-2 glassy-btn neon-grid-btn text-white rounded-xl text-sm font-medium transition-colors border border-white", style: { background: '#dc2626' }, children: "Clear All Filters" }) })), _jsx("div", { className: "flex-1 overflow-y-auto", children: Object.keys(chapterIndexMap).length > 0 ? (_jsx("ul", { className: "space-y-3", children: Object.entries(chapterIndexMap).map(([chapter, pageNum]) => (_jsx("li", { children: _jsx("button", { className: "text-blue-600 hover:text-blue-800 hover:underline text-left text-lg w-full p-2 rounded transition-colors", onClick: () => {
                                                                console.log('Navigating to chapter:', chapter, 'at page:', pageNum);
                                                                const flip = flipbookRef.current?.pageFlip();
                                                                if (flip && typeof flip.flip === 'function') {
                                                                    flip.flip(pageNum);
                                                                }
                                                            }, children: chapter }) }, chapter))) })) : (_jsxs("div", { className: "text-center text-gray-500 mt-8", children: [_jsx("p", { children: "No chapters found" }), _jsx("p", { className: "text-sm", children: "Your diary entries will appear here" })] })) })] }), filteredEntries.map((page, index) => (_jsx("div", { className: "flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-hidden", children: _jsxs("div", { className: "page-content overflow-y-auto h-full pt-2 pb-6 px-6", children: [page.chapter && (_jsx("div", { className: "text-center text-sm text-gray-600 mb-1", children: page.chapter })), _jsxs("div", { className: "rounded-lg p-4", children: [page.date && (_jsxs("h3", { className: "text-blue-800 font-semibold text-center mb-1", style: { marginTop: '-20px' }, children: [formatDate(page.date), " ", _jsx("br", {}), _jsxs("span", { className: "text-sm text-gray-500", children: ["(Page ", getPageNumberWithinDate(index), ")"] })] })), _jsx("p", { className: "text-justify text-gray-900 px-2 py-2 leading-relaxed text-xl font-handwriting break-words", children: page.content }), page.images && page.images.filter(url => !url.startsWith('blob:')).length > 0 && (_jsx("div", { className: "mt-4 flex flex-wrap gap-2 justify-center", onPointerDownCapture: (e) => e.stopPropagation(), children: page.images
                                                                .filter(url => !url.startsWith('blob:')) // Skip blob URLs
                                                                .map((url, imgIndex) => {
                                                                console.log('Rendering image:', url, 'at index:', imgIndex);
                                                                return (_jsx("button", { type: "button", onClick: (e) => {
                                                                        console.log('Image button clicked:', url);
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        console.log('Setting selectedImage to:', url);
                                                                        setSelectedImage(url);
                                                                    }, style: {
                                                                        backgroundImage: `url(${url})`,
                                                                        backgroundSize: 'cover',
                                                                        backgroundPosition: 'center',
                                                                        width: '48px',
                                                                        height: '48px',
                                                                        borderRadius: '8px',
                                                                        border: '2px solid #3490dc',
                                                                        zIndex: 50,
                                                                        pointerEvents: 'auto',
                                                                        position: 'relative'
                                                                    }, className: "focus:outline-none hover:border-white transition-colors", children: _jsx("span", { className: "sr-only", children: "View image" }) }, imgIndex));
                                                            }) }))] })] }) }, page.id || index)))] }) })) })] }), selectedImage && (_jsx("div", { className: "fixed inset-0 z-[55]", style: { pointerEvents: 'auto' }, onClick: (e) => e.stopPropagation(), onMouseDown: (e) => e.stopPropagation(), onMouseUp: (e) => e.stopPropagation(), onTouchStart: (e) => e.stopPropagation(), onTouchEnd: (e) => e.stopPropagation(), onPointerDown: (e) => e.stopPropagation(), onPointerUp: (e) => e.stopPropagation(), onPointerMove: (e) => e.stopPropagation() })), selectedImage && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm", style: { pointerEvents: 'auto' }, onClick: handleCloseImageModal, children: _jsxs("div", { className: "relative bg-white p-6 rounded-xl shadow-2xl border-2 border-gray-200 max-w-[90vw] max-h-[90vh] overflow-hidden", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { onClick: handleCloseImageModal, className: "absolute top-2 right-2 bg-black hover:bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors z-10 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-gray-300", "aria-label": "Close image", children: "\u00D7" }), _jsx("div", { className: "flex items-center justify-center", children: _jsx("img", { src: selectedImage, alt: "Enlarged photo", className: "max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg", onError: (e) => {
                                    console.error('Image failed to load:', selectedImage);
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                                } }) }), _jsx("div", { className: "mt-4 text-center text-sm text-gray-600", children: _jsx("p", { children: "Click outside or press ESC to close" }) })] }) }))] }));
}
