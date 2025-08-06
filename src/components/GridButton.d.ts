import type { ReactNode } from 'react';
import './GridButton.css';
interface Props {
    label: string;
    icon?: ReactNode;
    onClick?: () => void;
}
export default function GridButton({ label, icon, onClick }: Props): import("react/jsx-runtime").JSX.Element;
export {};
