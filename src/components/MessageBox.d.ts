import React from 'react';
import './GridButton.css';
interface Props {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onTranslateClick?: () => void;
    onRewriteClick?: () => void;
    onAskAI?: () => void;
    uploadedImage: {
        file: File;
        previewUrl: string;
    } | null;
    setUploadedImage: (image: {
        file: File;
        previewUrl: string;
    } | null) => void;
    onShowImageChoice?: () => void;
    onGalleryUpload?: () => void;
    onCameraCapture?: () => void;
    language?: string;
    onLanguageChange?: (language: string) => void;
}
export default function MessageBox({ value, onChange, onTranslateClick, onRewriteClick, onAskAI, uploadedImage, setUploadedImage, onShowImageChoice, onGalleryUpload, onCameraCapture, language, onLanguageChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
