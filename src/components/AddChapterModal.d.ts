import React from 'react';
interface AddChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddChapter: (chapterName: string) => void;
}
declare const AddChapterModal: React.FC<AddChapterModalProps>;
export default AddChapterModal;
