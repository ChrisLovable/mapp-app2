interface DiaryEntry {
    id?: string;
    chapter?: string;
    content?: string;
    photo_urls?: string[];
}
interface Props {
    entry: DiaryEntry | null;
    onSave: (entryData: Partial<DiaryEntry>) => void;
    onCancel: () => void;
}
export default function DiaryEntryEditor({ entry, onSave, onCancel }: Props): import("react/jsx-runtime").JSX.Element;
export {};
