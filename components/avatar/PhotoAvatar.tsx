'use client';

interface PhotoAvatarProps {
  state: 'idle' | 'listening' | 'speaking';
  isSpeaking: boolean;
}

export function PhotoAvatar({ state, isSpeaking }: PhotoAvatarProps) {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d1f35 0%, #04070f 100%)' }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-1000"
        style={{
          width: '60%',
          height: '60%',
          top: '10%',
          left: '20%',
          background: isSpeaking
            ? 'rgba(124, 58, 237, 0.25)'
            : state === 'listening'
            ? 'rgba(0, 212, 255, 0.16)'
            : 'rgba(0, 100, 160, 0.08)',
          transition: 'background 0.8s ease',
        }}
      />

      {/* Sofia Photo Card */}
      <div
        className={`relative z-10 w-[88%] max-w-[400px] aspect-[3/4] rounded-[20px] overflow-hidden ${
          isSpeaking ? 'animate-active-speaking' : 'animate-breathing'
        }`}
        style={{
          boxShadow: isSpeaking
            ? '0 0 0 2px rgba(124,58,237,0.5), 0 8px 60px rgba(124,58,237,0.35), 0 2px 20px rgba(0,0,0,0.5)'
            : state === 'listening'
            ? '0 0 0 2px rgba(0,212,255,0.4), 0 8px 60px rgba(0,212,255,0.2), 0 2px 20px rgba(0,0,0,0.5)'
            : '0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.5)',
          transition: 'all 0.6s ease',
        }}
      >
        {/* Clean, Undivided Base Portrait */}
        <img
          src="/sofia.png"
          alt="Sofia - AI Communication Coach"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Speaking visual overlay */}
        {isSpeaking && (
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(124,58,237,0.08) 0%, transparent 50%)',
              animation: 'speakingPulse 0.6s ease-in-out infinite alternate',
            }}
          />
        )}

        {/* Listening visual overlay */}
        {state === 'listening' && !isSpeaking && (
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,212,255,0.05) 0%, transparent 50%)',
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
            background: isSpeaking ? '#7c3aed' : state === 'listening' ? '#00d4ff' : '#4a5568',
            boxShadow: isSpeaking ? '0 0 8px #7c3aed' : state === 'listening' ? '0 0 8px #00d4ff' : 'none',
            transition: 'all 0.4s ease',
          }}
        />
        <span
          className="text-sm font-semibold"
          style={{ color: '#e0eaf4', letterSpacing: '0.01em' }}
        >
          Sofia — AI Coach
        </span>
        <span className="text-xs" style={{ color: '#4a5568' }}>•</span>
        <span
          className="text-xs"
          style={{
            color: isSpeaking ? '#a78bfa' : state === 'listening' ? '#00d4ff' : '#4a5568',
            transition: 'color 0.4s ease',
          }}
        >
          {isSpeaking ? 'Speaking' : state === 'listening' ? 'Listening...' : 'Ready'}
        </span>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes speakingPulse {
          from { opacity: 0.3; }
          to   { opacity: 0.9; }
        }
        @keyframes listeningPulse {
          from { opacity: 0.3; }
          to   { opacity: 0.8; }
        }
        .animate-breathing {
          animation: breathing 4s ease-in-out infinite;
        }
        @keyframes breathing {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-4px) scale(1.005); }
        }
        .animate-active-speaking {
          animation: activeSpeaking 1.5s ease-in-out infinite alternate;
        }
        @keyframes activeSpeaking {
          0%   { transform: translateY(0px) scale(1) rotate(0deg); }
          50%  { transform: translateY(-3px) scale(1.01) rotate(0.3deg); }
          100% { transform: translateY(-1px) scale(1.005) rotate(-0.3deg); }
        }
      `}</style>
    </div>
  );
}
