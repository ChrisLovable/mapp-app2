interface LanguageOption {
    code: string;
    name: string;
}
interface Props {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    languages: LanguageOption[];
}
export default function LanguageSelector({ value, onChange, languages }: Props): import("react/jsx-runtime").JSX.Element;
export {};
