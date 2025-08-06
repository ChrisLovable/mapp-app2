import type { ExcelFile, ChunkingResult } from '../types/excel';
interface ExcelQueryModalProps {
    isOpen: boolean;
    onClose: () => void;
    excelFile: ExcelFile | null;
    chunkingResult?: ChunkingResult | null;
}
export default function ExcelQueryModal({ isOpen, onClose, excelFile, chunkingResult }: ExcelQueryModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
