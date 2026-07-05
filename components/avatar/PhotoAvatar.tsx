'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface PhotoAvatarProps {
  state: 'idle' | 'listening' | 'speaking';
  isSpeaking: boolean;
}

export function PhotoAvatar({ state, isSpeaking }: PhotoAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d1f35 0%, #04070f 100%)' }}
    >
      {/* Ambient glow behind Sofia */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-1000"
        style={{
          width: '60%',
          height: '60%',
          top: '10%',
          left: '20%',
          background: isSpeaking
            ? 'rgba(124, 58, 237, 0.18)'
            : state === 'listening'
            ? 'rgba(0, 212, 255, 0.12)'
            : 'rgba(0, 100, 160, 0.08)',
          transition: 'background 0.8s ease',
        }}
      />

      {/* Sofia photo */}
      <div
        className="relative z-10"
        style={{
          width: '88%',
          maxWidth: '400px',
          aspectRatio: '3/4',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: isSpeaking
            ? '0 0 0 2px rgba(124,58,237,0.5), 0 8px 60px rgba(124,58,237,0.3), 0 2px 20px rgba(0,0,0,0.5)'
            : state === 'listening'
            ? '0 0 0 2px rgba(0,212,255,0.4), 0 8px 60px rgba(0,212,255,0.15), 0 2px 20px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.6s ease',
        }}
      >
        <Image
          src="/sofia.png"
          alt="Sofia - AI Communication Coach"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          priority
        />

        {/* Subtle speaking pulse overlay on mouth area */}
        {isSpeaking && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(124,58,237,0.08) 0%, transparent 40%)',
              animation: 'speakingPulse 0.6s ease-in-out infinite alternate',
            }}
          />
        )}

        {/* Listening rim glow */}
        {state === 'listening' && !isSpeaking && (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,212,255,0.05) 0%, transparent 50%)',
              animation: 'listeningPulse 1.5s ease-in-out infinite alternate',
            }}
          />
        )}
      </div>

      {/* Name & status badge */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full z-20"
        style={{
          background: 'rgba(7, 13, 26, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Status dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: isSpeaking
              ? '#7c3aed'
              : state === 'listening'
              ? '#00d4ff'
              : '#4a5568',
            boxShadow: isSpeaking
              ? '0 0 8px #7c3aed'
              : state === 'listening'
              ? '0 0 8px #00d4ff'
              : 'none',
            transition: 'all 0.4s ease',
          }}
        />
        <span
          className="text-sm font-semibold"
          style={{ color: '#e0eaf4', letterSpacing: '0.01em' }}
        >
          Sofia — AI Coach
        </span>
        <span
          className="text-xs"
          style={{ color: '#4a5568' }}
        >
          •
        </span>
        <span
          className="text-xs"
          style={{
            color: isSpeaking
              ? '#a78bfa'
              : state === 'listening'
              ? '#00d4ff'
              : '#4a5568',
            transition: 'color 0.4s ease',
          }}
        >
          {isSpeaking ? 'Speaking' : state === 'listening' ? 'Listening...' : 'Ready'}
        </span>
      </div>

      {/* CSS keyframes injected */}
      <style>{`
        @keyframes speakingPulse {
          from { opacity: 0.4; }
          to   { opacity: 1; }
        }
        @keyframes listeningPulse {
          from { opacity: 0.3; }
          to   { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
