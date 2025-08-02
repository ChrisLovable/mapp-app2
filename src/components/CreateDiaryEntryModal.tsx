import { useState, useEffect, useRef } from 'react';
import CustomDatePicker from './CustomDatePicker';
import { supabase } from '../lib/supabase';
import DiaryFlipbook from './DiaryFlipbook';
import { apiUsageTracker } from '../lib/ApiUsageTracker';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import ThreeDComponent from './ThreeDComponent';
import AddChapterModal from './AddChapterModal';
import PhotoUploadModal from './PhotoUploadModal';
import ConfirmationModal from './ConfirmationModal';

// Reusable Modal Header Component with consistent styling
const ModalHeader: React.FC<{ title: string; onClose?: () => void }> = ({ title, onClose }) => (
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
      {title}
    </h2>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
        style={{ background: '#000000', fontSize: '15px' }}
        aria-label="Close modal"
      >
        ×
      </button>
    )}
  </div>
);



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
  const [uploadedPhotos, setUploadedPhotos] = useState<PhotoFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [existingEntries, setExistingEntries] = useState<DiaryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [duplicateEntryId, setDuplicateEntryId] = useState<string | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingEntryData, setPendingEntryData] = useState<any>(null);

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

  const handleAddChapter = async (newChapterName: string) => {
    const updatedChapters = chapters.includes(newChapterName)
      ? chapters
      : [...chapters, newChapterName];
    setChapters(updatedChapters);
    setSelectedChapter(newChapterName);

    // Update user_preferences table to add the new chapter name
    try {
      console.log('Adding new chapter:', newChapterName);
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
      }
    } catch (err) {
      console.error('Error updating user preferences:', err);
    }
  };

  const handlePhotoUpload = (files: FileList) => {
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

  type ChapterOption = { value: string; label: string };
  const chapterOptions: ChapterOption[] = chapters.map(chapter => ({ value: chapter, label: chapter }));

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
        <div className="w-full flex items-center justify-center">
          <div className="rounded-2xl bg-black p-4 w-full flex flex-col border-0 transition-all duration-300 relative" style={{ boxSizing: 'border-box', border: '2px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)', height: '90vh' }}>
            <div className="overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <ModalHeader title="Create Diary Entry" onClose={onClose} />
              <button
                onClick={onClose}
                className="absolute w-8 h-8 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
                style={{ border: 'none', outline: 'none', margin: '4px 8px 8px 4px', right: '-270px', top: '-65px', background: '#000000', fontSize: '15px' }}
              >
                ×
              </button>

              {/* Chapter Selection - Moved below header */}
              <div className="flex flex-col mb-4 w-full px-4" style={{ marginTop: '10px', marginLeft: '-10px' }}>
                <label className="text-white font-medium text-[10px] mb-1 text-left" style={{ fontSize: '0.85rem' }}>Choose Chapter</label>
                <div className="flex flex-row items-center gap-2 w-full">
                  <Select
                    className="flex-1 min-w-0"
                    value={chapterOptions.find(opt => opt.value === selectedChapter) || null}
                    onChange={(option: SingleValue<ChapterOption>) => setSelectedChapter(option ? option.value : '')}
                    options={chapterOptions}
                    placeholder=""
                    isClearable={false}
                    onMenuOpen={() => {
                      // Prevent keyboard from opening
                      const activeElement = document.activeElement as HTMLElement;
                      if (activeElement) {
                        activeElement.blur();
                      }
                    }}
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
                        border: '2px solid white',
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
                    className="glassy-btn px-4 py-2 rounded-2xl text-white transition-colors text-sm border-0 ml-2 animated-white-border"
                    style={{ background: '#111', fontSize: '0.9rem', minWidth: '120px' }}
                  >
                    New chapter
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Date and Chapter Selection */}
                <div className="w-full px-0" style={{ marginTop: '0px' }}>
                  <div className="space-y-2 mb-2">
                    {/* Date Picker */}
                    <div style={{ background: '#111', padding: '0.5rem 0.25rem 0.5rem 0.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginLeft: '0', width: '100%', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <CustomDatePicker value={selectedDate} onChange={setSelectedDate} />
                    </div>
                  </div>
                </div>

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
                    className="w-full p-2 px-4 rounded-2xl text-black placeholder-gray-600 min-h-[100px] resize-none photo-frame-3d-sm textbox-white"
                    style={{ fontSize: '0.8rem', background: 'linear-gradient(135deg, #d3d3d3 0%, #ffffff 100%)', boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -1px -1px 2px rgba(255, 255, 255, 0.5)' }}
                  />
                </div>

                {/* Upload Button */}
                <div className="flex justify-start" style={{ marginTop: '3px' }}>
                  <div className="flex-2">
                    <button
                      onClick={() => setShowPhotoUpload(true)}
                      className="w-full glassy-btn px-4 py-2 rounded-2xl text-white transition-colors flex items-center gap-2 border-0 ml-2 animated-white-border"
                      style={{ background: '#111', fontSize: '0.9rem' }}
                    >
                      Upload photos
                    </button>
                  </div>
                </div>

                {/* Photo Display */}
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
                        <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: '2px solid white' }}>
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
                    <div className="p-2 rounded-2xl text-black text-sm min-h-[100px] text-left photo-frame-3d-sm textbox-white" style={{ marginTop: '5px', background: 'linear-gradient(135deg, #d3d3d3 0%, #ffffff 100%)', boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -1px -1px 2px rgba(255, 255, 255, 0.5)' }}>
                      No entries found for this date.
                    </div>
                  ) : (
                    <div className="space-y-3" style={{ marginTop: '21px' }}>
                      {existingEntries.map((entry) => (
                        <div key={entry.id} className="p-2 rounded-2xl text-black min-h-[100px] text-left photo-frame-3d-sm textbox-white" style={{ background: 'linear-gradient(135deg, #d3d3d3 0%, #ffffff 100%)', boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -1px -1px 2px rgba(255, 255, 255, 0.5)' }}>
                          <div className="flex justify-between items-start mb-2 text-left">
                            <span className="text-xs text-blue-600 font-medium">
                              {entry.diary_chapter}
                            </span>
                          </div>
                          <div className="text-gray-800 text-sm mb-2 text-left">
                            {entry.content}
                          </div>
                          {entry.photo_urls && entry.photo_urls.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {entry.photo_urls.map((url: string, photoIndex: number) => (
                                <img
                                  key={photoIndex}
                                  src={url}
                                  alt={`Photo ${photoIndex + 1}`}
                                  className="w-12 h-12 rounded-2xl object-cover"
                style={{ border: '2px solid white' }}
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

              </div>
              
              {/* Action Buttons - Moved to bottom */}
              <div className="flex justify-start gap-3 mt-4 px-4 pb-4">
                <button
                  onClick={() => {
                    console.log('Read Diary button clicked - setting isFlipbookOpen to true');
                    setIsFlipbookOpen(true);
                  }}
                  disabled={isSaving}
                  className="flex-1 p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0 animated-white-border"
                  style={{ background: '#111' }}
                >
                  Read Diary
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0 animated-white-border"
                  style={{ background: '#111' }}
                >
                  {isSaving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <AddChapterModal 
        isOpen={showAddChapter}
        onClose={() => setShowAddChapter(false)}
        onAddChapter={handleAddChapter}
      />

      <PhotoUploadModal
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        onPhotoUpload={handlePhotoUpload}
      />

      <ConfirmationModal
        isOpen={showDuplicateConfirm}
        title="Duplicate Entry"
        message="There is already an entry for this date and chapter. Do you want to replace the existing entry or cancel?"
        onConfirm={handleReplaceDuplicate}
        onCancel={() => setShowDuplicateConfirm(false)}
        confirmText="Replace"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={showReplaceConfirm}
        title="Duplicate Entry"
        message="An entry for this user, date, and chapter already exists. Do you want to replace the existing entry or cancel?"
        onConfirm={handleReplaceConfirmed}
        onCancel={() => { setShowReplaceConfirm(false); setSaveStatus(''); }}
        confirmText="Replace"
        cancelText="Cancel"
      />

      {/* Diary Flipbook */}
      <DiaryFlipbook 
        isOpen={isFlipbookOpen} 
        onClose={() => setIsFlipbookOpen(false)} 
      />
    </>
  );
} 