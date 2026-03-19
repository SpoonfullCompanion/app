export const speak = (text: string): void => {
  if ('speechSynthesis' in window) {
    const isAndroid = /android/i.test(navigator.userAgent);

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';

    const speakutterance = () => {
      if (isAndroid) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
          utterance.voice = englishVoice;
        }
      }

      window.speechSynthesis.speak(utterance);

      if (isAndroid) {
        utterance.onend = () => {
          window.speechSynthesis.cancel();
        };
      }
    };

    if (isAndroid) {
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speakutterance();
          window.speechSynthesis.onvoiceschanged = null;
        };
        window.speechSynthesis.getVoices();
      } else {
        setTimeout(speakutterance, 100);
      }
    } else {
      speakutterance();
    }
  } else {
    console.warn('Text-to-speech not supported in this browser');
  }
};

export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};
