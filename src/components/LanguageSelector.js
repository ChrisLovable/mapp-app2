import { jsx as _jsx } from "react/jsx-runtime";
export default function LanguageSelector({ value, onChange, languages }) {
    return (_jsx("div", { className: "relative rounded-full overflow-visible", children: _jsx("select", { className: "glassy-btn neon-grid-btn font-semibold text-[10px] rounded-full text-center p-2 select-none cursor-pointer border-0 transition-all duration-200 active:scale-95 relative overflow-visible w-full max-w-[110px] min-w-[80px]", value: value, onChange: onChange, style: {
                background: '#111',
                color: 'white',
                boxShadow: '0 1px 6px 1px #00fff7, 0 2px 8px 0 #000, 0 1px 4px 0 #00fff766, 0 1.5px 3px rgba(30, 64, 175, 0.3), 0 0 2px rgba(255, 255, 255, 0.1)',
                position: 'relative',
                zIndex: 1,
                maxHeight: '32px',
                overflowY: 'auto',
                maxWidth: '110px',
                minWidth: '80px',
                fontSize: '13px',
                fontWeight: '700',
                lineHeight: '1.1',
                right: '0',
                transform: 'translateX(0)',
                transformOrigin: 'top right',
                padding: '0 6px',
            }, children: languages.map(lang => (_jsx("option", { value: lang.code, className: "text-xs", style: {
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '1px 2px',
                    backgroundColor: '#111',
                    color: '#fff'
                }, children: lang.name }, lang.code))) }) }));
}
