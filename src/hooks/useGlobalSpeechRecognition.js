let recognition = null;
let shouldStop = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const start = (lang, onResult, onEnd, onError) => {
    shouldStop = false;
    if (recognition) {
        recognition.stop();
    }
    if (!SpeechRecognition) {
        onError('Speech recognition not supported');
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
        const fullTranscript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        const isFinal = event.results[event.results.length - 1].isFinal;
        onResult(fullTranscript, isFinal);
    };
    recognition.onend = () => {
        if (!shouldStop) {
            // Restart recognition automatically
            recognition = null;
            start(lang, onResult, onEnd, onError);
            return;
        }
        onEnd();
        recognition = null;
    };
    recognition.onerror = (event) => {
        onError(event.error);
        recognition = null;
    };
    try {
        recognition.start();
    }
    catch (error) {
        onError('Failed to start recognition');
        recognition = null;
    }
};
const stop = () => {
    shouldStop = true;
    if (recognition) {
        recognition.stop();
    }
};
export const GlobalSpeechRecognition = {
    start,
    stop,
};
