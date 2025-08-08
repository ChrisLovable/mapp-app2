// src/hooks/useGlobalSpeechRecognition.js
// A simple global speech recognition helper that can be used outside React components.
// It wraps the Web Speech API in a singleton-style object with start / stop methods.
// Usage:
//   GlobalSpeechRecognition.start('en-US', onResult, onEnd, onError);
//   GlobalSpeechRecognition.stop();
// Note: The Web Speech API is currently supported in Chrome-based browsers. Safari works with prefixes.

let recognitionInstance = null;

export const GlobalSpeechRecognition = {
  /**
   * Start speech recognition.
   * @param {string} language BCP-47 language tag, e.g. 'en-US'. Defaults to 'en-US'.
   * @param {(text:string)=>void} onResult Callback invoked with the final transcript.
   * @param {() => void} onEnd Callback when recognition ends naturally or is stopped.
   * @param {(error:string)=>void} onError Callback when an error occurs.
   */
  start(language = 'en-US', onResult, onEnd, onError) {
    // If a recognition session is already running, stop it first.
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (_) {
        // ignore
      }
      recognitionInstance = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false; // we only need final result
    recognition.continuous = false; // single utterance by default

    recognition.onresult = (event) => {
      try {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(' ')
          .trim();
        if (onResult) onResult(transcript);
      } catch (err) {
        console.error('Error processing speech recognition result', err);
        if (onError) onError('Failed to process speech recognition result.');
      }
    };

    recognition.onend = () => {
      recognitionInstance = null;
      if (onEnd) onEnd();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (onError) onError(event.error);
    };

    recognitionInstance = recognition;
    try {
      recognition.start();
    } catch (err) {
      // Some browsers throw if start() is called too quickly after a previous stop()
      console.error('Speech recognition start error:', err);
      recognitionInstance = null;
      if (onError) onError(err.message || 'Failed to start speech recognition');
    }
  },

  /**
   * Stop the current speech recognition session if one is active.
   */
  stop() {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
      recognitionInstance = null;
    }
  },
};
