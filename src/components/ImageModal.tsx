import { useState, useRef } from 'react'

interface Props {
  onClose: () => void
  onImageUpload: (urls: string[]) => void
}

export default function ImageModal({ onClose, onImageUpload }: Props) {
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      setImageUrls([...imageUrls, newUrl.trim()])
      setNewUrl('')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setImageUrls([...imageUrls, e.target.result as string])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onImageUpload(imageUrls)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">📷 Add Photos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              🔗 Add Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-white"
                onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
              />
              <button
                onClick={handleAddUrl}
                className="px-4 py-2 rounded-lg transition-all duration-200 font-bold uppercase text-sm"
                style={{
                  background: `linear-gradient(to bottom, var(--primary-color), var(--accent-color))`,
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              📁 Upload Images
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors"
            >
              📁 Click to select images or drag and drop
            </button>
          </div>

          {/* Image Preview */}
          {imageUrls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                �� Selected Images ({imageUrls.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='
                      }}
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg transition-all duration-200 font-bold uppercase text-sm border border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={imageUrls.length === 0}
              className="px-6 py-2 rounded-lg transition-all duration-200 font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to bottom, var(--primary-color), var(--accent-color))`,
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
              }}
            >
              💾 Save Images
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}