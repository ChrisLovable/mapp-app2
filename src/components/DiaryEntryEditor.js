import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function DiaryEntryEditor({ entry, onSave, onCancel }) {
    const [chapter, setChapter] = useState('');
    const [content, setContent] = useState('');
    const [photoUrls, setPhotoUrls] = useState([]);
    useEffect(() => {
        if (entry) {
            setChapter(entry.chapter || '');
            setContent(entry.content || '');
            setPhotoUrls(entry.photo_urls || []);
        }
        else {
            setChapter('');
            setContent('');
            setPhotoUrls([]);
        }
    }, [entry]);
    const handleSave = () => {
        if (!chapter.trim()) {
            alert('Please enter a chapter title');
            return;
        }
        onSave({
            chapter: chapter.trim(),
            content: content.trim(),
            photo_urls: photoUrls
        });
    };
    const handleRemovePhoto = (index) => {
        setPhotoUrls(photoUrls.filter((_, i) => i !== index));
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: entry ? 'Edit Entry' : 'New Entry' }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Chapter Title:" }), _jsx("input", { type: "text", value: chapter, onChange: (e) => setChapter(e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white", placeholder: "Enter chapter title..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Content:" }), _jsx("textarea", { value: content, onChange: (e) => setContent(e.target.value), className: "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-32 resize-none", placeholder: "Write your diary entry..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Photo URLs:" }), _jsxs("div", { className: "space-y-2", children: [photoUrls.map((url, index) => (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: url, onChange: (e) => {
                                                        const newUrls = [...photoUrls];
                                                        newUrls[index] = e.target.value;
                                                        setPhotoUrls(newUrls);
                                                    }, className: "flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white", placeholder: "Photo URL..." }), _jsx("button", { onClick: () => handleRemovePhoto(index), className: "px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white", children: "Remove" })] }, index))), _jsx("button", { onClick: () => setPhotoUrls([...photoUrls, '']), className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white", children: "+ Add Photo URL" })] })] })] }), _jsxs("div", { className: "flex gap-4 mt-6", children: [_jsx("button", { onClick: () => { }, className: "px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white", children: "Save" }), _jsx("button", { onClick: onCancel, className: "px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white", children: "Cancel" })] })] }) }));
}
