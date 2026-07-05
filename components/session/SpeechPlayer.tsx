'use client';

import { useEffect, useRef, useCallback } from 'react';
import { wordToVisemes, SAPI_VISEME_MAP, type VisemeName } from '@/lib/viseme-map';

interface SpeechPlayerProps {
  text: string | null;
  onStart: () => void;
  onEnd: () => void;
  onViseme: (viseme: string) => void;
}

export function SpeechPlayer({ text, onStart, onEnd, onViseme }: SpeechPlayerProps) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeakingRef = useRef(false);
  const visemeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTextRef = useRef<string | null>(null);

  // Get a good voice — prefer a natural female English voice
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Priority: Google US English Female > Microsoft voices > any en-US
    const preferredNames = [
      'Google US English Female',
      'Microsoft Zira',
      'Microsoft Aria',
      'Samantha',
      'Karen',
      'Moira',
    ];

    for (const name of preferredNames) {
      const found = voices.find((v) => v.name.includes(name));
      if (found) return found;
    }

    // Fallback: any English voice
    return voices.find((v) => v.lang.startsWith('en')) || voices[0];
  }, []);

  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!textToSpeak.trim()) return;
      if (isSpeakingRef.current) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utteranceRef.current = utterance;

      // Voice settings for natural sound
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      const voice = getVoice();
      if (voice) utterance.voice = voice;

      // Split text into words for viseme scheduling
      const words = textToSpeak.split(/\s+/).filter(Boolean);
      const avgWordDuration = 280; // ms per word at normal speech rate

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        onStart();

        // Schedule viseme updates based on word timing
        let elapsed = 0;
        for (const word of words) {
          const visemes = wordToVisemes(word);
          const wordDuration = avgWordDuration * (word.length / 5);

          for (let i = 0; i < visemes.length; i++) {
            const visemeDelay = elapsed + (wordDuration * i) / Math.max(visemes.length, 1);
            const viseme = visemes[i];
            const timer = setTimeout(() => {
              onViseme(viseme);
            }, visemeDelay);

            // Store timers for cleanup
            const ref = visemeTimerRef as unknown as { timers?: NodeJS.Timeout[] };
            if (!ref.timers) ref.timers = [];
            ref.timers.push(timer);
          }

          elapsed += wordDuration;
        }
      };

      // Also use boundary events if available (more accurate in Chrome/Edge)
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const char = textToSpeak[charIndex] || '';
          const visemes = wordToVisemes(char);
          if (visemes.length > 0) {
            onViseme(visemes[0]);
          }
        }
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        // Silence viseme after speech ends
        onViseme('viseme_sil');
        onEnd();
        clearScheduledVisemes();
      };

      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') return;
        console.warn('Speech synthesis error:', event.error);
        isSpeakingRef.current = false;
        onViseme('viseme_sil');
        onEnd();
        clearScheduledVisemes();
      };

      window.speechSynthesis.speak(utterance);
    },
    [getVoice, onStart, onEnd, onViseme]
  );

  function clearScheduledVisemes() {
    const ref = visemeTimerRef as unknown as { timers?: NodeJS.Timeout[] };
    if (ref.timers) {
      ref.timers.forEach(clearTimeout);
      ref.timers = [];
    }
  }

  // Speak when text prop changes
  useEffect(() => {
    if (text && text !== currentTextRef.current) {
      currentTextRef.current = text;

      // Wait for voices to load (first time)
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speakText(text);
        };
      } else {
        speakText(text);
      }
    }
  }, [text, speakText]);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      clearScheduledVisemes();
      if (isSpeakingRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return null; // Pure logic component
}
