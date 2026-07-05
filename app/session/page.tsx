'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { VoiceRecorder } from '@/components/session/VoiceRecorder';
import { SpeechPlayer } from '@/components/session/SpeechPlayer';
import { createClient } from '@/lib/supabase/client';
import type { PracticeMode } from '@/lib/gemini';
import { PhotoAvatar } from '@/components/avatar/PhotoAvatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MODE_LABELS: Record<string, string> = {
  general: 'General Conversation',
  interview: 'Job Interview',
  sales: 'Sales Pitch',
  speaking: 'Public Speaking',
  conflict: 'Conflict Resolution',
};

const MODE_COLORS: Record<string, string> = {
  general: '#00d4ff',
  interview: '#7c3aed',
  sales: '#ffd700',
  speaking: '#10b981',
  conflict: '#f59e0b',
};

function SessionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') || 'general') as PracticeMode;

  // Core session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const [currentViseme, setCurrentViseme] = useState<string>('viseme_sil');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentSpeechText, setCurrentSpeechText] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  const sessionStartTimeRef = useRef<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<{ role: 'user' | 'model'; content: string }[]>([]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create session in DB
  async function createSession() {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    if (data.sessionId) {
      setSessionId(data.sessionId);
    }
  }

  // Start the session — greet user
  async function startSession() {
    setSessionStarted(true);
    sessionStartTimeRef.current = new Date();
    await createSession();

    const greetings: Record<PracticeMode, string> = {
      general: "Hi there! I'm Sofia, your communication coach. I'm here to help you practice your conversational skills today. How are you doing?",
      interview: "Good morning! I'm Sofia, and I'll be conducting your interview today. Before we begin, could you take a moment to introduce yourself and tell me what position you're interviewing for?",
      sales: "Hello. I have a few minutes before my next meeting. I understand you wanted to pitch something to me — what have you got?",
      speaking: "Welcome! I'm in the audience ready to hear your presentation. Whenever you're ready, please go ahead and begin.",
      conflict: "I need to talk to you. I just found out our entire project timeline is off because the deliverables you promised weren't ready. What happened?",
    };

    const greeting = greetings[mode];
    addAssistantMessage(greeting);
    setCurrentSpeechText(greeting);
  }

  function addAssistantMessage(content: string) {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    chatHistoryRef.current.push({ role: 'model', content });
  }

  function addUserMessage(content: string) {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    chatHistoryRef.current.push({ role: 'user', content });
  }

  // Handle final user speech
  const handleFinalTranscript = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking || isSpeaking) return;

      addUserMessage(text);
      setInterimTranscript('');
      setIsRecordingActive(false); // Stop listening while AI responds
      setIsThinking(true);
      setAvatarState('idle');

      try {
        const history = chatHistoryRef.current;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            mode,
          }),
        });

        if (!res.ok) throw new Error('Chat request failed');

        const data = await res.json();
        const aiReply = data.response as string;

        addAssistantMessage(aiReply);
        setCurrentSpeechText(aiReply);
      } catch (err) {
        console.error('Chat error:', err);
        const fallback = 'I apologize, I had a brief issue. Could you please repeat that?';
        addAssistantMessage(fallback);
        setCurrentSpeechText(fallback);
      } finally {
        setIsThinking(false);
      }
    },
    [isThinking, isSpeaking, mode]
  );

  const handleInterimTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        handleFinalTranscript(text);
      } else {
        setInterimTranscript(text);
      }
    },
    [handleFinalTranscript]
  );

  function handleSpeechStart() {
    setIsSpeaking(true);
    setAvatarState('speaking');
  }

  function handleSpeechEnd() {
    setIsSpeaking(false);
    setCurrentSpeechText(null);
    setAvatarState('listening');
    setCurrentViseme('viseme_sil');
    // Resume listening after avatar finishes speaking
    if (!sessionEnded) {
      setIsRecordingActive(true);
    }
  }

  function handleListeningChange(listening: boolean) {
    setIsListening(listening);
    if (listening && !isSpeaking) {
      setAvatarState('listening');
    }
  }

  // Toggle microphone
  function toggleMic() {
    if (isSpeaking) return; // Don't allow during speaking
    setIsRecordingActive((prev) => !prev);
    setAvatarState(isRecordingActive ? 'idle' : 'listening');
  }

  // End session and score
  async function endSession() {
    setIsRecordingActive(false);
    setSessionEnded(true);
    setIsScoring(true);
    setAvatarState('idle');

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const durationSeconds = sessionStartTimeRef.current
      ? Math.round((Date.now() - sessionStartTimeRef.current.getTime()) / 1000)
      : 0;

    if (!sessionId || chatHistoryRef.current.length < 2) {
      router.push('/dashboard');
      return;
    }

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcript: chatHistoryRef.current,
          mode,
          durationSeconds,
        }),
      });

      const data = await res.json();
      if (data.sessionId) {
        router.push(`/results/${data.sessionId}`);
      } else {
        router.push('/dashboard');
      }
    } catch {
      router.push('/dashboard');
    }
  }

  const accentColor = MODE_COLORS[mode] || '#00d4ff';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#04070f' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1"
            style={{ color: '#8892a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium" style={{ color: '#8892a4' }}>Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}>
            {MODE_LABELS[mode] || mode}
          </div>
          {sessionStarted && (
            <SessionTimer startTime={sessionStartTimeRef.current} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="end-session"
            onClick={endSession}
            disabled={!sessionStarted || isScoring}
            className="btn-danger text-sm"
            style={{ opacity: (!sessionStarted || isScoring) ? 0.5 : 1 }}
          >
            {isScoring ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Scoring...
              </span>
            ) : 'End & Score'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex gap-0">
        {/* Avatar Panel (left 55%) */}
        <div className="flex flex-col" style={{ width: '55%', minWidth: '55%' }}>
          <div className="flex-1 relative avatar-panel m-4" style={{
            borderColor: isSpeaking
              ? `${accentColor}60`
              : isListening
              ? 'rgba(0,212,255,0.3)'
              : 'rgba(0,212,255,0.12)',
            transition: 'border-color 0.5s ease',
            boxShadow: isSpeaking
              ? `0 0 40px ${accentColor}25`
              : isListening
              ? '0 0 30px rgba(0,212,255,0.15)'
              : 'none',
          }}>
            {/* Video call chrome — top bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3"
              style={{
                background: 'linear-gradient(to bottom, rgba(7,13,26,0.9) 0%, transparent 100%)',
              }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full"
                  style={{
                    background: isSpeaking ? '#7c3aed' : isListening ? '#00d4ff' : '#4a5568',
                    boxShadow: isSpeaking ? '0 0 8px #7c3aed' : isListening ? '0 0 8px #00d4ff' : 'none',
                    transition: 'all 0.3s',
                  }} />
                <span className="text-xs font-medium" style={{ color: '#8892a4' }}>
                  {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isThinking ? 'Thinking...' : 'Ready'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
              </div>
            </div>

            {/* Avatar */}
            <div className="absolute inset-0">
              <PhotoAvatar
                state={avatarState}
                isSpeaking={isSpeaking}
              />
            </div>

            {/* Thinking overlay */}
            <AnimatePresence>
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: accentColor, animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: '#8892a4' }}>Sofia is thinking...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Waveform when listening */}
            <AnimatePresence>
              {isListening && !isSpeaking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                >
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="wave-bar" />
                  ))}
                  <span className="text-xs ml-2" style={{ color: '#00d4ff' }}>Listening</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start overlay */}
            <AnimatePresence>
              {!sessionStarted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center z-30"
                  style={{ background: 'rgba(4,7,15,0.85)', backdropFilter: 'blur(8px)' }}
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{ background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                      border: `2px solid ${accentColor}60` }}>
                    <svg className="w-10 h-10" style={{ color: accentColor }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                  <h2 className="font-display font-bold text-2xl mb-2 text-white">Ready to Begin?</h2>
                  <p className="text-sm mb-8 text-center max-w-xs" style={{ color: '#8892a4' }}>
                    Practice <span style={{ color: accentColor }}>{MODE_LABELS[mode]}</span> with Sofia,
                    your AI communication coach
                  </p>
                  <button
                    id="start-session"
                    onClick={startSession}
                    className="btn-primary px-8 py-3 text-base"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
                    }}
                  >
                    Start Session
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mic control */}
          <div className="flex items-center justify-center gap-4 px-4 pb-4">
            <button
              id="toggle-mic"
              onClick={toggleMic}
              disabled={!sessionStarted || isSpeaking || isThinking || sessionEnded}
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: isRecordingActive
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'rgba(255,255,255,0.08)',
                border: isRecordingActive
                  ? '2px solid #f87171'
                  : '2px solid rgba(255,255,255,0.15)',
                boxShadow: isRecordingActive
                  ? '0 0 0 8px rgba(239,68,68,0.15), 0 0 20px rgba(239,68,68,0.3)'
                  : 'none',
                opacity: (!sessionStarted || isSpeaking || isThinking || sessionEnded) ? 0.4 : 1,
              }}
            >
              {isRecordingActive ? (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-7 h-7" style={{ color: '#8892a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  <line x1="4" y1="4" x2="20" y2="20" strokeWidth={2} />
                </svg>
              )}
            </button>
            <p className="text-xs" style={{ color: '#4a5568' }}>
              {isRecordingActive ? 'Tap to mute' : 'Tap to speak'}
            </p>
          </div>
        </div>

        {/* Chat Panel (right 45%) */}
        <div className="flex flex-col border-l" style={{
          width: '45%',
          borderColor: 'rgba(255,255,255,0.06)',
        }}>
          {/* Chat history */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !sessionStarted && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: '#4a5568' }}>
                  Session transcript will appear here
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[85%]">
                    {msg.role === 'assistant' && (
                      <p className="text-xs mb-1 ml-1 font-medium" style={{ color: accentColor }}>
                        Sofia
                      </p>
                    )}
                    <div
                      className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: msg.role === 'user'
                          ? `linear-gradient(135deg, ${accentColor}25 0%, ${accentColor}15 100%)`
                          : 'rgba(255,255,255,0.05)',
                        border: msg.role === 'user'
                          ? `1px solid ${accentColor}30`
                          : '1px solid rgba(255,255,255,0.08)',
                        color: msg.role === 'user' ? '#e0f0ff' : '#c8d4e0',
                        borderRadius: msg.role === 'user'
                          ? '18px 18px 4px 18px'
                          : '18px 18px 18px 4px',
                      }}
                    >
                      {msg.content}
                    </div>
                    <p className="text-xs mt-1 mx-1" style={{ color: '#374151' }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Interim transcript */}
            {interimTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm italic"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#4a5568',
                    borderRadius: '18px 18px 4px 18px',
                  }}>
                  {interimTranscript}...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Tips panel */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="glass-card p-3">
              <p className="text-xs font-semibold mb-2" style={{ color: accentColor }}>
                💡 Session Tips
              </p>
              <ul className="text-xs space-y-1" style={{ color: '#8892a4' }}>
                <li>• Speak clearly into your microphone</li>
                <li>• Take your time — natural pauses are good</li>
                <li>• End the session when you feel ready for your score</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden logic components */}
      <VoiceRecorder
        isActive={isRecordingActive}
        onTranscript={handleInterimTranscript}
        onListeningChange={handleListeningChange}
      />
      <SpeechPlayer
        text={currentSpeechText}
        onStart={handleSpeechStart}
        onEnd={handleSpeechEnd}
        onViseme={setCurrentViseme}
      />
    </div>
  );
}

function SessionTimer({ startTime }: { startTime: Date | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');

  return (
    <div className="text-xs font-mono px-2 py-1 rounded"
      style={{ background: 'rgba(255,255,255,0.05)', color: '#8892a4' }}>
      {mins}:{secs}
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04070f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#00d4ff', borderTopColor: 'transparent' }} />
      </div>
    }>
      <SessionPageInner />
    </Suspense>
  );
}
