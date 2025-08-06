import React from 'react';
interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLanguage: string;
}
declare const ExpenseModal: React.FC<ExpenseModalProps>;
export default ExpenseModal;
