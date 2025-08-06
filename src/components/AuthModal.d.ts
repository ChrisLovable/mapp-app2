interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthSuccess: (user: any) => void;
}
export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
