interface RealtimeConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    matchedTriggers?: string[];
}
export default function RealtimeConfirmationModal({ isOpen, onConfirm, onCancel, matchedTriggers }: RealtimeConfirmationModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
