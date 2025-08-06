interface RewriteModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentText: string;
    onTextChange?: (text: string) => void;
}
export default function RewriteModal({ isOpen, onClose, currentText, onTextChange }: RewriteModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
