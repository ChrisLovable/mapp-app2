import 'react-day-picker/dist/style.css';
interface CreateDiaryEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentText: string;
}
export default function CreateDiaryEntryModal({ isOpen, onClose, currentText }: CreateDiaryEntryModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
