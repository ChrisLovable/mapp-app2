import { useState, useEffect } from 'react'

interface DiaryEntry {
  id?: string;
  chapter?: string;
  content?: string;
  photo_urls?: string[];
}

interface Props {
  entry: DiaryEntry | null
  onSave: (entryData: Partial<DiaryEntry>) => void
  onCancel: () => void
}

export default function DiaryEntryEditor({ entry, onSave, onCancel }: Props) {
  const [chapter, setChapter] = useState('')
  const [content, setContent] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  useEffect(() => {
    if (entry) {
      setChapter(entry.chapter || '')
      setContent(entry.content || '')
      setPhotoUrls(entry.photo_urls || [])
    } else {
      setChapter('')
      setContent('')
      setPhotoUrls([])
    }
  }, [entry])

  const handleSave = () => {
    if (!chapter.trim()) {
      alert('Please enter a chapter title')
      return
    }
    
    onSave({
      chapter: chapter.trim(),
      content: content.trim(),
      photo_urls: photoUrls
    })
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {entry ? 'Edit Entry' : 'New Entry'}
        </h2>
        
        <div className="space-y-4">
          {/* Chapter Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Chapter Title:</label>
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="Enter chapter title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Content:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 resize-none"
              placeholder="Write your diary entry..."
            />
          </div>

          {/* Photo URLs */}
          <div>
            <label className="block text-sm font-medium mb-2">Photo URLs:</label>
            <div className="space-y-2">
              {photoUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...photoUrls]
                      newUrls[index] = e.target.value
                      setPhotoUrls(newUrls)
                    }}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Photo URL..."
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => setPhotoUrls([...photoUrls, ''])}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                + Add Photo URL
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => {}}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}