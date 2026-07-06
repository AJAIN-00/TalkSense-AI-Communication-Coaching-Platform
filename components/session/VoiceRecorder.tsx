'use client';

import { useEffect, useRef, useCallback } from 'react';

interface VoiceRecorderProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onListeningChange: (listening: boolean) => void;
  isActive: boolean;
}

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((event: Event) => void) | null;
    onend: ((event: Event) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
  }
}

export function VoiceRecorder({ onTranscript, onListeningChange, isActive }: VoiceRecorderProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      onListeningChange(true);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      onListeningChange(false);

      // Auto-restart if still supposed to be active
      if (isActive) {
        restartTimerRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch {}
        }, 300);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      console.warn('Speech recognition error:', event.error);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onTranscript(interimTranscript.trim(), false);
      }
    };

    return recognition;
  }, [isActive, onTranscript, onListeningChange]);

  useEffect(() => {
    if (isActive) {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      if (recognitionRef.current && !isListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn('Could not start recognition:', err);
        }
      }
    } else {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }

    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
    };
  }, [isActive, initRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return null; // This component has no UI — it's a pure logic component
}
