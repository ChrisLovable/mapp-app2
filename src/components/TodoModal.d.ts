interface TodoModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialInput?: string;
}
export default function TodoModal({ isOpen, onClose, initialInput }: TodoModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
