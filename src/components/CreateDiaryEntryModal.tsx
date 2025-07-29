import { useState, useEffect, useRef } from 'react';
import CustomDatePicker from './CustomDatePicker';
import { supabase } from '../lib/supabase';
import DiaryFlipbook from './DiaryFlipbook';
import { apiUsageTracker } from '../lib/ApiUsageTracker';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import Select from 'react-select';
import type { SingleValue } from 'react-select';


interface CreateDiaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
}

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
}

interface DiaryEntry {
  id: string;
  content: string;
  diary_chapter: string;
  photo_urls?: string[];
  entry_date: string;
  created_at: string;
}

export default function CreateDiaryEntryModal({ isOpen, onClose, currentText }: CreateDiaryEntryModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [diaryEntry, setDiaryEntry] = useState(currentText);
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [existingEntries, setExistingEntries] = useState<DiaryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [duplicateEntryId, setDuplicateEntryId] = useState<string | null>(null);
  const [addChapterStatus, setAddChapterStatus] = useState('');
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingEntryData, setPendingEntryData] = useState<any>(null);
  // Add state for photo source choice
  const [showPhotoSourceChoice, setShowPhotoSourceChoice] = useState(false);
  const [photoCaptureMode, setPhotoCaptureMode] = useState<'camera' | 'gallery' | null>(null);

  
  // Update diary entry when modal opens or currentText changes
  useEffect(() => {
    if (isOpen) {
      setDiaryEntry(currentText);
    }
  }, [isOpen, currentText]);

  // When modal opens, always reset selectedChapter to empty string
  useEffect(() => {
    if (isOpen) {
      setSelectedChapter('');
    }
  }, [isOpen]);

  // Fetch existing entries when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingEntries(selectedDate);
    }
  }, [isOpen, selectedDate]);

  // Fetch chapters from user_preferences when modal opens
  useEffect(() => {
    async function fetchChaptersFromPreferences() {
      if (isOpen) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('chapter_names')
          .eq('user_id', 'test-user-123')
          .single();
        if (!error && data && Array.isArray(data.chapter_names)) {
          setChapters(data.chapter_names);
        }
      }
    }
    fetchChaptersFromPreferences();
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const handleAddChapter = async () => {
    if (newChapterName.trim()) {
      const newChapter = newChapterName.trim();
      const updatedChapters = chapters.includes(newChapter)
        ? chapters
        : [...chapters, newChapter];
      setChapters(updatedChapters);
      setSelectedChapter(newChapter);
      setNewChapterName('');
      // Do NOT close the modal yet

      // Update user_preferences table to add the new chapter name
      try {
        console.log('Adding new chapter:', newChapter);
        console.log('Updated chapters array:', updatedChapters);
        const { error, data } = await supabase
          .from('user_preferences')
          .upsert(
            { user_id: 'test-user-123', chapter_names: updatedChapters },
            { onConflict: 'user_id' }
          );
        if (error) {
          console.error('Supabase upsert error:', error);
        } else {
          console.log('Supabase upsert response:', data);
          setAddChapterStatus('Chapter successfully added to the database');
          setTimeout(() => {
            setAddChapterStatus('');
            setShowAddChapter(false); // Close modal after message disappears
          }, 2000);
        }
      } catch (err) {
        console.error('Error updating user preferences:', err);
      }
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        // Check if file is an image
        const isValidImage = file.type.startsWith('image/') || 
                            file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/);
        
        if (!isValidImage) {
          console.warn(`Skipping invalid file: ${file.name} (type: ${file.type})`);
          return false;
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          console.warn(`Skipping large file: ${file.name} (size: ${file.size} bytes)`);
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length === 0) {
        console.warn('No valid image files selected');
        return;
      }
      
      const newPhotos: PhotoFile[] = validFiles.map(file => ({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setUploadedPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const fetchExistingEntries = async (date: Date) => {
    setIsLoadingEntries(true);
    try {
      // Use local date format to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', 'test-user-123')
        .eq('entry_date', dateString)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        setExistingEntries([]);
        
        // Track failed database query
        apiUsageTracker.trackSupabaseUsage(
          'database/diary_entries',
          'Diary Entries Query',
          undefined,
          false,
          error.message
        );
      } else {
        // Track successful database query
        apiUsageTracker.trackSupabaseUsage(
          'database/diary_entries',
          'Diary Entries Query',
          data ? JSON.stringify(data).length : 0,
          true
        );
        setExistingEntries(data || []);
        
        // In fetchExistingEntries, do not overwrite diaryEntry with DB content
        if (data && data.length > 0) {
          setExistingEntries(data || []);
          setSelectedChapter('');
          // Do NOT setDiaryEntry here
          
          // If there are photos, convert URLs back to file objects for display
          if (data[0].photo_urls && data[0].photo_urls.length > 0) {
            const photoFiles: PhotoFile[] = data[0].photo_urls.map((url: string, index: number) => ({
              id: `existing-${index}`,
              file: new File([], `photo-${index}.jpg`), // Dummy file object
              preview: url
            }));
            setUploadedPhotos(photoFiles);
          } else {
            setUploadedPhotos([]);
          }
        } else {
          setExistingEntries([]);
          setDiaryEntry('');
          setSelectedChapter('');
          setUploadedPhotos([]);
        }
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      setExistingEntries([]);
    } finally {
      setIsLoadingEntries(false);
    }
  };



  const handleSave = async () => {
    if (!selectedChapter || selectedChapter.trim() === '') {
      setSaveStatus('Please select a chapter.');
      setIsSaving(false);
      return;
    }
    if (!diaryEntry.trim()) {
      setSaveStatus('Please add an entry for this date and chapter.');
      setIsSaving(false);
      return;
    }

    // Check for duplicate entry (same date and chapter)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const duplicate = existingEntries.find(
      (entry) => entry.entry_date === dateString && entry.diary_chapter === selectedChapter
    );
    if (duplicate) {
      setDuplicateEntryId(duplicate.id);
      setShowDuplicateConfirm(true);
      setIsSaving(false);
      return;
    }

    await actuallySaveDiaryEntry();
  };

  // Move the actual save logic to a new function
  const actuallySaveDiaryEntry = async () => {
    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
      // Upload photos to Supabase storage
      const photoUrls: string[] = [];
      
      for (const photo of uploadedPhotos) {
        const fileName = `diary-photos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('diary-photos')
          .upload(fileName, photo.file);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          setSaveStatus(`Error uploading photo: ${uploadError.message}`);
          
          // Track failed storage upload
          apiUsageTracker.trackSupabaseUsage(
            'storage/diary-photos',
            'Photo Upload',
            photo.file.size,
            false,
            uploadError.message
          );
          
          setIsSaving(false);
          return;
        }

        // Track successful storage upload
        apiUsageTracker.trackSupabaseUsage(
          'storage/diary-photos',
          'Photo Upload',
          photo.file.size,
          true
        );

        // Get public URL for the uploaded photo
        const { data: urlData } = supabase.storage
          .from('diary-photos')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Save diary entry to database
      const entryData = {
        user_id: 'test-user-123',
        entry_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
        diary_chapter: selectedChapter,
        content: diaryEntry,
        photo_urls: photoUrls.length > 0 ? photoUrls : null
      };
      console.log('Upserting diary entry:', entryData);
      const { error, data: upsertData } = await supabase
        .from('diary_entries')
        .upsert(entryData, { onConflict: 'user_id,entry_date,diary_chapter' });
      if (error && (error as any).code === '23505') {
        // Duplicate key error: show replace/cancel modal
        setPendingEntryData(entryData);
        setShowReplaceConfirm(true);
        setIsSaving(false);
        return;
      } else if (error) {
        console.error('Database error (upsert):', error);
        setSaveStatus(`Error saving entry: ${error.message}`);
        setIsSaving(false);
        return;
      }
      console.log('Upsert response:', upsertData);
      setSaveStatus('Data successfully saved to the database');
      await fetchExistingEntries(selectedDate);
      setTimeout(() => {
        setDiaryEntry('');
        setUploadedPhotos([]);
        setIsSaving(false);
      }, 1500);
    } catch (error) {
      console.error('Unexpected error (upsert):', error);
      setSaveStatus('An unexpected error occurred while saving.');
      setIsSaving(false);
    }
  };

  // Add a function to handle replacing the duplicate
  const handleReplaceDuplicate = async () => {
    setShowDuplicateConfirm(false);
    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
      // Upload photos to Supabase storage
      const photoUrls: string[] = [];
      
      for (const photo of uploadedPhotos) {
        const fileName = `diary-photos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('diary-photos')
          .upload(fileName, photo.file);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          setSaveStatus(`Error uploading photo: ${uploadError.message}`);
          
          // Track failed storage upload
        apiUsageTracker.trackSupabaseUsage(
            'storage/diary-photos',
            'Photo Upload',
            photo.file.size,
          false,
            uploadError.message
        );
        
        setIsSaving(false);
        return;
      }

        // Track successful storage upload
      apiUsageTracker.trackSupabaseUsage(
          'storage/diary-photos',
          'Photo Upload',
          photo.file.size,
        true
      );

        // Get public URL for the uploaded photo
        const { data: urlData } = supabase.storage
          .from('diary-photos')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          photoUrls.push(urlData.publicUrl);
        }
      }

      // Update the existing entry in the database
      const updateData = {
        content: diaryEntry,
        photo_urls: uploadedPhotos.length > 0 ? uploadedPhotos.map(p => p.preview) : null
      };
      console.log('Updating diary entry id', duplicateEntryId, 'with:', updateData);
      const { error, data: updateResp } = await supabase
        .from('diary_entries')
        .update(updateData)
        .eq('id', duplicateEntryId);
      if (error) {
        console.error('Database error (update):', error);
        setSaveStatus(`Error updating entry: ${error.message}`);
        setIsSaving(false);
        return;
      }
      console.log('Update response:', updateResp);
      setSaveStatus('Data successfully saved to the database');
      await fetchExistingEntries(selectedDate);
      setTimeout(() => {
        setDiaryEntry('');
        setUploadedPhotos([]);
        setIsSaving(false);
      }, 1500);
    } catch (error) {
      console.error('Unexpected error (update):', error);
      setSaveStatus('An unexpected error occurred while updating.');
      setIsSaving(false);
    }
  };

  // Auto-dismiss green success message after 3 seconds
  useEffect(() => {
    if (saveStatus && saveStatus.includes('successfully')) {
      const timeout = setTimeout(() => setSaveStatus(''), 3000);
      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  const handleReplaceConfirmed = async () => {
    setShowReplaceConfirm(false);
    setSaveStatus(''); // Clear the 'Saving...' message
    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
      const { error, data: updateResp } = await supabase
        .from('diary_entries')
        .update({
          content: pendingEntryData.content,
          photo_urls: pendingEntryData.photo_urls
        })
        .eq('user_id', pendingEntryData.user_id)
        .eq('entry_date', pendingEntryData.entry_date)
        .eq('diary_chapter', pendingEntryData.diary_chapter);
      if (error) {
        setSaveStatus(`Error updating entry: ${error.message}`);
        setIsSaving(false);
        return;
      }
      setSaveStatus('Data successfully saved to the database');
      await fetchExistingEntries(selectedDate);
      setTimeout(() => {
        setDiaryEntry('');
        setUploadedPhotos([]);
        setIsSaving(false);
      }, 1500);
    } catch (error) {
      setSaveStatus('An unexpected error occurred while updating.');
      setIsSaving(false);
    }
  };


  if (!isOpen) return null;

  // Custom styles for DayPicker table and day cells
  const dayPickerTableStyles = {
    width: '100%',
    tableLayout: 'fixed',
  };
  const dayCellStyles = {
    width: '14.2857%', // 100% / 7 days
    padding: 0,
    fontSize: '0.85rem',
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  type ChapterOption = { value: string; label: string };
  const chapterOptions: ChapterOption[] = chapters.map(chapter => ({ value: chapter, label: chapter }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
      <div className="w-full flex items-center justify-center">
        <div className="glassy-rainbow-btn rounded-2xl bg-black p-2 w-full min-h-0 h-auto flex flex-col border-0" style={{ boxSizing: 'border-box' }}>
          <div className="overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="relative mb-6 px-0 py-3 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)' }}>
          <h2 className="text-xl font-bold text-white">Create Diary Entry</h2>
          <button
            onClick={onClose}
            className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
            style={{ background: '#111', border: 'none', outline: 'none' }}
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Date and Chapter with Add Chapter Button */}
          <div className="w-full px-0" style={{ marginTop: '-20px' }}>
            <div className="space-y-2 mb-2">
              {/* Chapter Selection and Add Chapter Button */}
                  <div className="flex flex-col mb-4 w-full">
                    <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Choose Chapter</label>
                    <div className="flex flex-row items-center gap-2 w-full">
                      <Select
                        className="flex-1 min-w-0"
                        value={chapterOptions.find(opt => opt.value === selectedChapter) || null}
                        onChange={(option: SingleValue<ChapterOption>) => setSelectedChapter(option ? option.value : '')}
                        options={chapterOptions}
                        placeholder=""
                        isClearable={false}
                        components={{
                          DropdownIndicator: (props) => (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '100%',
                              paddingRight: 10,
                              color: '#fff',
                              opacity: 0.8,
                              fontSize: '1.2rem',
                            }}>
                              ▼
                            </div>
                          )
                        }}
                        styles={{
                          container: (base: any) => ({ ...base, width: 200, zIndex: 20 }),
                          control: (base: any, state: any) => ({
                            ...base,
                            borderRadius: 16,
                            border: state.isFocused ? '2px solid #2563eb' : '2px solid var(--favourite-blue)',
                            background: '#111',
                            color: '#fff',
                            boxShadow: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            minHeight: 44,
                            transition: 'border 0.2s, box-shadow 0.2s',
                          }),
                          menu: (base: any) => ({
                            ...base,
                            background: '#181a1b',
                            borderRadius: 12,
                            marginTop: 2,
                            zIndex: 9999,
                            boxShadow: '0 4px 24px 0 #2563eb99',
                            color: '#fff',
                          }),
                          option: (base: any, state: any) => ({
                            ...base,
                            background: state.isSelected
                              ? 'linear-gradient(90deg, #2563eb 60%, #00fff7 100%)'
                              : state.isFocused
                              ? 'rgba(37,99,235,0.3)'
                              : 'transparent',
                            color: state.isSelected || state.isFocused ? '#fff' : '#fff',
                            fontWeight: state.isSelected ? 700 : 500,
                            borderRadius: 8,
                            padding: '10px 16px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }),
                          singleValue: (base: any) => ({ ...base, color: '#fff' }),
                          placeholder: (base: any) => ({ ...base, color: '#60a5fa', fontWeight: 500 }),
                          dropdownIndicator: (base: any, state: any) => ({
                            ...base,
                            color: '#fff',
                            opacity: 0.8,
                            fontSize: '1.2rem',
                            paddingRight: 10,
                            transition: 'color 0.2s',
                          }),
                          clearIndicator: (base: any) => ({ ...base, color: '#60a5fa' }),
                          indicatorSeparator: (base: any) => ({ ...base, display: 'none' }),
                          input: (base: any) => ({ ...base, color: '#fff' }),
                          menuList: (base: any) => ({ ...base, background: 'transparent', padding: 0 }),
                        }}
                      />
                <button
                  onClick={() => setShowAddChapter(true)}
                        className="glassy-btn px-4 py-2 rounded-2xl text-white transition-colors text-sm border-0 ml-2"
                  style={{ background: '#111', fontSize: '0.9rem', minWidth: '120px' }}
                >
                  New chapter
                </button>
                    </div>
              </div>
              {/* Date Picker */}
                  <div style={{ background: '#111', padding: '0.5rem 0.25rem 0.5rem 0.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginLeft: '0', width: '100%', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                <CustomDatePicker value={selectedDate} onChange={setSelectedDate} />
              </div>
            </div>
          </div>





          {/* Add Chapter Modal */}
          {showAddChapter && (
            <div className="bg-black glassy-rainbow-btn rounded-2xl p-0 border-0">
              <div className="relative mb-6 px-0 py-3 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)' }}>
                <h3 className="text-xl font-bold text-white">New Chapter</h3>
                <button
                  onClick={() => {
                    setShowAddChapter(false);
                    setNewChapterName('');
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
                  style={{ background: '#111', border: 'none', outline: 'none' }}
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 w-full">
                <input
                  type="text"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="Enter chapter name..."
                  className="w-full p-2 rounded-2xl text-white border-2 placeholder-gray-400"
                  style={{ background: '#111', borderColor: 'var(--favourite-blue)' }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChapter()}
                />
                <button
                  onClick={handleAddChapter}
                  className="w-full glassy-btn px-3 py-2 rounded-2xl text-white transition-colors border-0"
                  style={{ background: '#111' }}
                >
                  Add
                </button>
                    {addChapterStatus && (
                      <div className="relative flex items-center p-3 rounded-2xl text-sm font-medium bg-green-600 text-white border-0 shadow-lg" style={{ boxShadow: '0 2px 12px 2px #00ff99, 0 1.5px 6px #007a4d', background: 'linear-gradient(135deg, #00ff99 80%, #007a4d 100%)', fontWeight: 600, backdropFilter: 'blur(2px)' }}>
                        <span className="pr-8">{addChapterStatus}</span>
                        <button
                          onClick={() => setAddChapterStatus('')}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-green-200 flex items-center justify-center z-10"
                          style={{ background: '#111', border: 'none', outline: 'none', boxShadow: '0 0 6px 1.5px #00ff99' }}
                          aria-label="Dismiss success"
                        >
                          ×
                        </button>
                      </div>
                    )}
              </div>
            </div>
          )}

          {/* New Entry Text Area */}
          <div className="space-y-2" style={{ marginTop: '20px' }}>
            <div className="flex justify-between items-center">
              <label className="block text-xs font-medium" style={{ fontSize: '0.65rem' }}>
                New Entry
                {currentText && diaryEntry === currentText && (
                  <span className="ml-2 text-xs text-green-400">(Text copied from main textbox)</span>
                )}
              </label>
            </div>
            <textarea
              value={diaryEntry}
              onChange={(e) => setDiaryEntry(e.target.value)}
              placeholder="Write your diary entry here..."
              className="w-full p-3 rounded-2xl text-white border-2 placeholder-gray-400 min-h-[100px] resize-none"
              style={{ fontSize: '0.8rem', background: '#111', borderColor: 'var(--favourite-blue)' }}
            />
          </div>
          {/* Upload Button below the text box */}
          <div className="flex justify-start" style={{ marginTop: '3px' }}>
            <div className="flex-2">
              <button
                    onClick={() => setShowPhotoSourceChoice(true)}
                    className="w-full glassy-btn px-4 py-2 rounded-2xl text-white transition-colors flex items-center gap-2 border-0 ml-2"
                style={{ background: '#111', fontSize: '0.9rem' }}
              >
                Upload photos
              </button>
            </div>
          </div>

              {/* Hidden File Inputs */}
          <input
                ref={cameraInputRef}
            type="file"
            multiple
                accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
            capture="environment"
                onChange={(event) => {
                  try {
                    handlePhotoUpload(event);
                  } catch (error) {
                    console.error('Error uploading camera photo:', error);
                  }
                }}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                onChange={(event) => {
                  try {
                    handlePhotoUpload(event);
                  } catch (error) {
                    console.error('Error uploading gallery photo:', error);
                  }
                }}
            className="hidden"
          />

          {/* Photo Upload Section */}
          {uploadedPhotos.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative">
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                        className="absolute -top-2 -right-2 glassy-btn bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 border-0"
                  >
                    ×
                  </button>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden glassy-rainbow-btn border-0">
                    <img
                      src={photo.preview}
                      alt="Uploaded photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Existing Entries Display */}
          <div className="space-y-2" style={{ marginTop: '30px' }}>
            <label className="block text-xs font-medium text-left" style={{ fontSize: '0.65rem', marginTop: '-5px' }}>
              Existing entries found for {selectedDate.toLocaleDateString()} for this Diary chapter
              {isLoadingEntries && <span className="ml-2 text-xs text-blue-400">Loading...</span>}
            </label>
            
            {existingEntries.length === 0 && !isLoadingEntries ? (
                              <div className="p-3 rounded-2xl text-white text-sm border-2 min-h-[100px] text-left" style={{ background: '#111', borderColor: 'var(--favourite-blue)', marginTop: '5px' }}>
                  No entries found for this date.
                </div>
            ) : (
              <div className="space-y-3" style={{ marginTop: '21px' }}>
                {existingEntries.map((entry) => (
                      <div key={entry.id} className="p-3 rounded-2xl text-white border-2 min-h-[100px] text-left" style={{ background: '#111', borderColor: 'var(--favourite-blue)' }}>
                        <div className="flex justify-between items-start mb-2 text-left">
                      <span className="text-xs text-blue-400 font-medium">
                        {entry.diary_chapter}
                      </span>
                          {/* Timestamp removed */}
                    </div>
                        <div className="text-gray-200 text-sm mb-2 text-left">
                      {entry.content}
                    </div>
                    {entry.photo_urls && entry.photo_urls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {entry.photo_urls.map((url: string, photoIndex: number) => (
                          <img
                            key={photoIndex}
                            src={url}
                            alt={`Photo ${photoIndex + 1}`}
                            className="w-12 h-12 rounded-2xl object-cover glassy-rainbow-btn border-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Message */}
              {(saveStatus && (
                saveStatus.includes('successfully') || saveStatus === 'Saving...'
                  ? (
                    <div className="relative flex items-center p-3 rounded-2xl text-sm font-medium bg-green-600 text-white border-0 shadow-lg" style={{ boxShadow: '0 2px 12px 2px #00ff99, 0 1.5px 6px #007a4d', background: 'linear-gradient(135deg, #00ff99 80%, #007a4d 100%)', fontWeight: 600, backdropFilter: 'blur(2px)' }}>
                      <span>{saveStatus}</span>
                    </div>
                  ) : (
            <div className="relative flex items-center p-3 rounded-2xl text-sm font-medium bg-red-600 text-white border-0 shadow-lg" style={{ boxShadow: '0 2px 12px 2px #ff0033, 0 1.5px 6px #a1001a', background: 'linear-gradient(135deg, #ff0033 80%, #a1001a 100%)', fontWeight: 600 }}>
              <span className="pr-8">{saveStatus}</span>
              <button
                onClick={() => setSaveStatus('')}
                className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center z-10"
                style={{ background: '#111', border: 'none', outline: 'none', boxShadow: '0 0 6px 1.5px #ff0033' }}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
                  )
              ))}

          {/* Action Buttons */}
          <div className="flex justify-start gap-3 pt-2">
            <button
              onClick={() => setIsFlipbookOpen(true)}
              disabled={isSaving}
              className="flex-1 p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0"
              style={{ background: '#111' }}
            >
              Read Diary
            </button>
            <button
                  onClick={handleSave}
              disabled={isSaving}
              className="flex-1 p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0"
              style={{ background: '#111' }}
            >
              {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Diary Flipbook */}
      <DiaryFlipbook 
        isOpen={isFlipbookOpen} 
        onClose={() => setIsFlipbookOpen(false)} 
      />

      {/* Confirmation Modal for Duplicate Entry */}
      {showDuplicateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4 text-black">Duplicate Entry</h2>
            <p className="mb-6 text-black">There is already an entry for this date and chapter. Do you want to replace the existing entry or cancel?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDuplicateConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-400 text-white font-medium hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleReplaceDuplicate}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Confirmation Modal for Duplicate Entry */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <div className="relative flex flex-col items-center p-6 rounded-2xl text-sm font-medium bg-blue-700 text-white border-0 shadow-lg" style={{ boxShadow: '0 2px 12px 2px #2563eb, 0 1.5px 6px #00fff7', background: 'linear-gradient(135deg, #2563eb 80%, #00fff7 100%)', fontWeight: 600, backdropFilter: 'blur(2px)', minWidth: 320 }}>
            <h2 className="text-lg font-bold mb-4 text-white">Duplicate Entry</h2>
            <p className="mb-6 text-white">An entry for this user, date, and chapter already exists. Do you want to replace the existing entry or cancel?</p>
            <div className="flex justify-end gap-4 w-full">
              <button
                onClick={() => { setShowReplaceConfirm(false); setSaveStatus(''); }}
                className="px-4 py-2 rounded-lg bg-gray-400 text-white font-bold hover:bg-gray-500 shadow-md"
                style={{ boxShadow: '0 0 6px 1.5px #2563eb' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReplaceConfirmed}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-md"
                style={{ boxShadow: '0 0 6px 1.5px #00fff7' }}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Source Choice Modal */}
      {showPhotoSourceChoice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-[#181a1b] rounded-2xl p-6 shadow-xl flex flex-col items-center min-w-[220px]">
            <div className="text-white text-lg font-semibold mb-4">Choose photo source</div>
            <button
              className="w-full mb-2 glassy-btn px-4 py-2 rounded-2xl text-white font-bold border-0"
              style={{ background: '#111', fontSize: '1rem' }}
              onClick={() => {
                setPhotoCaptureMode('camera');
                setShowPhotoSourceChoice(false);
                setTimeout(() => cameraInputRef.current?.click(), 0);
              }}
            >
              Use Camera
            </button>
            <button
              className="w-full glassy-btn px-4 py-2 rounded-2xl text-white font-bold border-0"
              style={{ background: '#111', fontSize: '1rem' }}
              onClick={() => {
                setPhotoCaptureMode('gallery');
                setShowPhotoSourceChoice(false);
                setTimeout(() => galleryInputRef.current?.click(), 0);
              }}
            >
              Select from Gallery
            </button>
            <button
              className="mt-4 text-xs text-gray-400 hover:text-white"
              onClick={() => setShowPhotoSourceChoice(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 