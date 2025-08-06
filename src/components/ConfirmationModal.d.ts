import React from 'react';
interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}
declare const ConfirmationModal: React.FC<ConfirmationModalProps>;
export default ConfirmationModal;
