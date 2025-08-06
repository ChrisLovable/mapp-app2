interface AppGridProps {
    onAskAIClick: () => void;
    onTranslateClick: () => void;
    onRewriteClick: () => void;
    onDiaryClick: () => void;
    onCalendarClick: () => void;
    onExpenseClick: () => void;
    onTodoClick: () => void;
    onShoppingClick: () => void;
    onImageToTextClick: () => void;
    onPdfReaderClick: () => void;
    onMeetingMinutesClick: () => void;
    onSmartMeetingRecorderClick: () => void;
    onImageGeneratorClick: () => void;
    onExpenseJournalClick: () => void;
    onTokenDashboardClick: () => void;
    onAdminDashboardClick: () => void;
}
export default function AppGrid(props: AppGridProps): import("react/jsx-runtime").JSX.Element;
export {};
