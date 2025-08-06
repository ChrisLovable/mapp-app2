interface AlarmPopupProps {
    isOpen: boolean;
    onClose: () => void;
    description: string;
}
export default function AlarmPopup({ isOpen, onClose, description }: AlarmPopupProps): import("react/jsx-runtime").JSX.Element | null;
export {};
