import React from 'react';
interface PhotoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPhotoUpload: (files: FileList) => void;
}
declare const PhotoUploadModal: React.FC<PhotoUploadModalProps>;
export default PhotoUploadModal;
