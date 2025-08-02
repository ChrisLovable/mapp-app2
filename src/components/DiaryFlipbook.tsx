import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import HTMLFlipBook from 'react-pageflip';
import CustomDatePicker from './CustomDatePicker';

// Structured Entry Object
type DiaryEntry = {
  date: string;
  content: string;
  images?: string[];
  chapter?: string;
  id?: string;
};

interface DiaryFlipbookProps {
  isOpen: boolean;
  onClose: () => void;
}

// Updated Text Overflow Split Logic
  function splitDiaryEntryIntoPages(entry: DiaryEntry, maxChars = 500): DiaryEntry[] {
  const words = entry.content.split(' ');
  const pages: DiaryEntry[] = [];
  let pageText = '';

  words.forEach(word => {
    if ((pageText + word).length < maxChars) {
      pageText += word + ' ';
    } else {
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

export default function DiaryFlipbook({ isOpen, onClose }: DiaryFlipbookProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flipbookRef = useRef<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [chapterIndexMap, setChapterIndexMap] = useState<{ [chapter: string]: number }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Remove all date range filtering, date pickers, and related state/effects/UI
  // Remove: startDate, endDate, filteredEntries, isUsingTestData, CustomDatePicker, filterEntriesByDateRange, and all related UI
  // Only show all entries as pages, no filtering

  // Debug selectedImage changes
  useEffect(() => {
    console.log('selectedImage changed:', selectedImage);
  }, [selectedImage]);

  // Build chapter index map based on filtered entries
  useEffect(() => {
    const map: { [chapter: string]: number } = {};
    entries.forEach((entry, index) => {
      if (entry.chapter && !map[entry.chapter]) {
        map[entry.chapter] = index + 2; // +2 to account for Cover + TOC pages
      }
    });
    setChapterIndexMap(map);
    console.log('Chapter index map (filtered):', map);
  }, [entries]);

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
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);

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
        const structuredEntries: DiaryEntry[] = data.map(entry => {
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
        const allPages: DiaryEntry[] = [];
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
      } else {
        console.log('⚠️ No entries found in database');
        // No entries found in database - add some test data for demonstration
        const testEntries: DiaryEntry[] = [
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
        const allPages: DiaryEntry[] = [];
        testEntries.forEach(entry => {
          const pages = splitDiaryEntryIntoPages(entry, 500);
          console.log(`📄 Split test entry into ${pages.length} pages`);
          allPages.push(...pages);
        });
        
        console.log('📚 Setting test entries:', allPages.length);
        setEntries(allPages);
        // setFilteredEntries(allPages); // This line is no longer needed
      }
    } catch (error) {
      console.error('❌ Error fetching entries:', error);
      setEntries([]);
      // setFilteredEntries([]); // This line is no longer needed
    } finally {
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
        } else {
          console.error('flip.flipPrev method not found');
        }
      } catch (error) {
        console.error('Error flipping to previous page:', error);
      }
    } else {
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
        } else {
          console.error('flip.flipNext method not found');
        }
      } catch (error) {
        console.error('Error flipping to next page:', error);
      }
    } else {
      console.log('Flipbook ref not available');
    }
  };

  const handleImageClick = (imageUrl: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    setSelectedImage(imageUrl);
  };

  const handleCloseImageModal = (event?: React.MouseEvent) => {
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
    const handleKeyDown = (event: KeyboardEvent) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate page number within the current date entry
  const getPageNumberWithinDate = (currentIndex: number) => {
    if (currentIndex === 0) return 1;
    
    const currentDate = entries[currentIndex].date;
    let pageNumber = 1;
    
    // Count backwards to find pages with the same date
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (entries[i].date === currentDate) {
        pageNumber++;
      } else {
        break;
      }
    }
    
    return pageNumber;
  };

  console.log('DiaryFlipbook render - isOpen:', isOpen, 'entries.length:', entries.length, 'isLoading:', isLoading);
  
  if (!isOpen) return null;

  console.log('DiaryFlipbook returning JSX - isOpen:', isOpen);
  
  return (
    <div className="fixed inset-0 bg-amber-50 bg-opacity-95 flex items-center justify-center z-[9999] p-4">
      <div className="w-full h-full max-w-6xl max-h-[90vh] mx-auto relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center z-20"
          style={{ background: '#111', border: 'none', outline: 'none' }}
        >
          ×
        </button>

        {/* Remove the header section with the white title */}
        {/* <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Diary Flipbook</h2>
        </div> */}

        {/* Navigation Buttons */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-4 z-10 pb-2">
          <button
            onClick={handlePreviousPage}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center justify-center w-24"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center justify-center w-24"
          >
            Next
          </button>

        </div>

        {/* Flipbook Content */}
        <div className="w-full h-full flex items-center justify-center">
          {isLoading ? (
            <div className="text-white text-xl">Loading diary...</div>
          ) : entries.length === 0 ? (
            <div className="w-full h-full">
              <HTMLFlipBook
                width={Math.min(window.innerWidth * 0.9, 500)}
                height={Math.min(window.innerHeight * 0.85, 700)}
                size="fixed"
                minWidth={280}
                maxWidth={500}
                minHeight={400}
                maxHeight={700}
                showCover={false}
                flippingTime={1000}
                usePortrait={true}
                startPage={0}
                drawShadow={true}
                maxShadowOpacity={0.5}
                useMouseEvents={true}
                className="flipbook w-full h-full"
                style={{ touchAction: 'none' }}
                mobileScrollSupport={false}
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
                <div className="flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-hidden">
                  {/* Page Content */}
                  <div className="page-content overflow-y-auto h-full">
                    <h2 className="text-center font-semibold text-lg text-blue-800 mb-4">
                      No Diary Entries Found
                    </h2>
                    <div className="text-center text-gray-600 mt-8">
                      <p className="text-lg mb-4">Your diary is empty</p>
                      <p className="text-sm">Create your first diary entry to get started!</p>
                    </div>
                  </div>
                </div>
              </HTMLFlipBook>
            </div>
          ) : (
            <div className="w-full h-full">
              <HTMLFlipBook
                width={Math.min(window.innerWidth * 0.9, 500)}
                height={Math.min(window.innerHeight * 0.85, 700)}
                size="fixed"
                minWidth={280}
                maxWidth={500}
                minHeight={400}
                maxHeight={700}
                showCover={false}
                flippingTime={1000}
                usePortrait={true}
                startPage={0}
                drawShadow={true}
                maxShadowOpacity={0.5}
                useMouseEvents={true}
                className="flipbook w-full h-full"
                style={{ touchAction: 'none' }}
                mobileScrollSupport={false}
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
                {/* Cover Page */}
                <div className="flip-page w-full h-full overflow-hidden bg-black shadow-lg rounded-3xl border border-gray-300 relative">
                  <img
                    src="/diarycover1.jpg"
                    alt="Diary Cover"
                    className="w-full h-full object-cover"
                  />
                  {/* Gold Script Title */}
                  <div className="absolute inset-0 flex items-start justify-center pt-20">
                    <h1 
                      className="text-6xl md:text-7xl font-bold text-center"
                      style={{
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
                      }}
                    >
                      My Diary
                    </h1>
                  </div>
                </div>

                {/* Table of Contents Page */}
                <div className="flip-page bg-white shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-hidden p-6 flex flex-col">
                  <h2 className="text-2xl font-semibold text-blue-800 text-center mb-4">📖 Table of Contents</h2>
                  
                  <div className="flex-1 overflow-y-auto">
                    {Object.keys(chapterIndexMap).length > 0 ? (
                      <ul className="space-y-3">
                        {Object.entries(chapterIndexMap).map(([chapter, pageNum]) => (
                          <li key={chapter}>
                            <button
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left text-lg w-full p-2 rounded transition-colors"
                              onClick={() => {
                                console.log('Navigating to chapter:', chapter, 'at page:', pageNum);
                                const flip = flipbookRef.current?.pageFlip();
                                if (flip && typeof flip.flip === 'function') {
                                  flip.flip(pageNum);
                                }
                              }}
                            >
                              {chapter}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center text-gray-500 mt-8">
                        <p>No chapters found</p>
                        <p className="text-sm">Your diary entries will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Diary Pages */}
                {entries.map((page: DiaryEntry, index: number) => (
                  <div key={page.id || index} className="flip-page bg-amber-50 shadow-lg rounded-3xl border border-gray-300 w-full h-full overflow-hidden">
                    {/* Page Content */}
                    <div className="page-content overflow-y-auto h-full pt-2 pb-6 px-6">
                      {/* Chapter - only show on first page of each entry */}
                      {page.chapter && (
                        <div className="text-center text-sm text-gray-600 mb-1">
                          {page.chapter}
                        </div>
                      )}
                      {/* Diary Entry Content */}
                      <div className="rounded-lg p-4">
                        {/* Date Header - show on every page */}
                        {page.date && (
                          <h3 className="text-blue-800 font-semibold text-center mb-1" style={{ marginTop: '-20px' }}>
                            {formatDate(page.date)} <br />
                            <span className="text-sm text-gray-500">(Page {getPageNumberWithinDate(index)})</span>
                          </h3>
                        )}
                        {/* Content */}
                        <p className="text-justify text-gray-900 px-2 py-2 leading-relaxed text-xl font-handwriting break-words">
                          {page.content}
                        </p>
                        {/* Images - only show on last page of each entry */}
                        {page.images && page.images.filter(url => !url.startsWith('blob:')).length > 0 && (
                          <div 
                            className="mt-4 flex flex-wrap gap-2 justify-center"
                            onPointerDownCapture={(e) => e.stopPropagation()}
                          >
                            {page.images
                              .filter(url => !url.startsWith('blob:')) // Skip blob URLs
                              .map((url: string, imgIndex: number) => {
                              console.log('Rendering image:', url, 'at index:', imgIndex);
                              return (
                                <button
                                  key={imgIndex}
                                  type="button"
                                  onClick={(e) => {
                                    console.log('Image button clicked:', url);
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Setting selectedImage to:', url);
                                    setSelectedImage(url);
                                  }}
                                  style={{
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
                                  }}
                                  className="focus:outline-none hover:border-white transition-colors"
                                >
                                  <span className="sr-only">View image</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </HTMLFlipBook>
            </div>
          )}
        </div>
      </div>

      {/* Transparent overlay to block flipbook events when modal is open */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[55]"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        />
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
          style={{ pointerEvents: 'auto' }}
          onClick={handleCloseImageModal}
        >
          <div 
            className="relative bg-white p-6 rounded-xl shadow-2xl border-2 border-gray-200 max-w-[90vw] max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseImageModal}
              className="absolute top-2 right-2 bg-black hover:bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors z-10 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Close image"
            >
              ×
            </button>
            
            {/* Image Container */}
            <div className="flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Enlarged photo"
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  console.error('Image failed to load:', selectedImage);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                }}
              />
            </div>
            
            {/* Image Info */}
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>Click outside or press ESC to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
