interface ShoppingListModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialInput?: string;
    currentLanguage?: string;
}
export default function ShoppingListModal({ isOpen, onClose, initialInput, currentLanguage }: ShoppingListModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
