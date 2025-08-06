import React from 'react';
interface ImageChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGalleryUpload: () => void;
    onCameraCapture: () => void;
}
declare const ImageChoiceModal: React.FC<ImageChoiceModalProps>;
export default ImageChoiceModal;
