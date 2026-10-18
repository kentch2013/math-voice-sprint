import { useState, useEffect, useRef, useCallback } from 'react';

// Declaration for SpeechRecognition API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type VoiceLanguage = 'en-US' | 'zh-CN';

export interface UseVoiceRecognitionOptions {
  onTranscriptChange?: (text: string) => void;
  noiseGateThreshold?: number; // RMS threshold (0.0 to 1.0)
  language?: VoiceLanguage;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const { onTranscriptChange, noiseGateThreshold = 0.03, language = 'en-US' } = options;

  const onTranscriptChangeRef = useRef(onTranscriptChange);

  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [isSpeechDetected, setIsSpeechDetected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState<boolean>(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languageRef = useRef<VoiceLanguage>(language);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  // Keep languageRef up-to-date
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Cleanup audio context and media stream
  const stopAudioAnalysis = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
    setIsSpeechDetected(false);
  }, []);

  // Start RMS noise gating audio analysis
  const startAudioAnalysis = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const analyze = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (Root Mean Square) volume level
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        // Scale RMS to 0..100 range for display
        const levelPercent = Math.min(100, Math.round(rms * 200));
        setVolumeLevel(levelPercent);
        setIsSpeechDetected(rms >= noiseGateThreshold);

        animFrameRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (err) {
      console.warn('Audio context setup failed or mic permission denied:', err);
    }
  }, [noiseGateThreshold]);

  // Create speech recognition instance if needed
  const createRecognitionInstance = useCallback(() => {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) return null;

    const instance = new SpeechClass();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = languageRef.current;

    instance.onstart = () => {
      setIsListening(true);
    };

    instance.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscriptStr = '';
      let interimTranscriptStr = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalTranscriptStr += text + ' ';
        } else {
          interimTranscriptStr += text;
        }
      }

      const trimmedFinal = finalTranscriptStr.trim();
      const trimmedInterim = interimTranscriptStr.trim();

      if (trimmedFinal) {
        setTranscript((prev) => {
          const updated = prev ? `${prev} ${trimmedFinal}` : trimmedFinal;
          if (onTranscriptChangeRef.current) onTranscriptChangeRef.current(updated);
          return updated;
        });
      }

      setInterimTranscript(trimmedInterim);
      if (trimmedInterim && onTranscriptChangeRef.current) {
        onTranscriptChangeRef.current(trimmedInterim);
      }
    };

    instance.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore non-fatal speech errors like 'no-speech'
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    instance.onend = () => {
      setIsListening(false);
      // Auto-restart loop if continuous listening should still be active
      if (shouldListenRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.lang = languageRef.current;
              recognitionRef.current.start();
            } catch {
              // Ignore if already running
            }
          }
        }, 300);
      }
    };

    return instance;
  }, []);

  // Start speech recognition
  const startListening = useCallback(() => {
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      setError('Web Speech API is not supported in this browser.');
      return;
    }

    shouldListenRef.current = true;
    setError(null);

    // Start audio RMS noise gate
    startAudioAnalysis();

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognitionInstance();
    } else {
      recognitionRef.current.lang = languageRef.current;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Recognition might already be running
      }
    }
  }, [startAudioAnalysis, createRecognitionInstance]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    stopAudioAnalysis();
    setIsListening(false);
  }, [stopAudioAnalysis]);

  // Seamless restart when language changes dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }

    // If currently listening, restart seamlessly with new language
    if (shouldListenRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      try {
        recognitionRef.current.start();
      } catch {
        // Ignore
      }
    }
  }, [language]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    if (recognitionRef.current && shouldListenRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  return {
    transcript,
    interimTranscript,
    isListening,
    volumeLevel,
    isSpeechDetected,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
