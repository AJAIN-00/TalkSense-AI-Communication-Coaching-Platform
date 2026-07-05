'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScoreData {
  clarity: number;
  confidence: number;
  vocabulary: number;
  tone: number;
  structure: number;
  overall: number;
  label: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface ScoreCardProps {
  score: ScoreData;
}

const LABEL_CONFIG = {
  Talented: {
    color: '#ffd700',
    bg: 'rgba(255,215,0,0.1)',
    border: 'rgba(255,215,0,0.3)',
    icon: '🏆',
    description: 'Outstanding communication skills',
  },
  Good: {
    color: '#00d4ff',
    bg: 'rgba(0,212,255,0.1)',
    border: 'rgba(0,212,255,0.3)',
    icon: '⭐',
    description: 'Solid communication with room to grow',
  },
  Weak: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    icon: '📈',
    description: 'Keep practicing — improvement is the goal',
  },
};

const DIMENSIONS = [
  { key: 'clarity', label: 'Clarity', icon: '🔍', description: 'How clearly your ideas are expressed' },
  { key: 'confidence', label: 'Confidence', icon: '💪', description: 'Your assertiveness and conviction' },
  { key: 'vocabulary', label: 'Vocabulary', icon: '📚', description: 'Richness and precision of language' },
  { key: 'tone', label: 'Tone', icon: '🎵', description: 'Appropriateness of your tone' },
  { key: 'structure', label: 'Structure', icon: '🏗️', description: 'Organization and flow of your responses' },
];

function ScoreBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(value * 10), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="relative h-2 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-full rounded-full score-bar-fill"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  );
}

export function ScoreCard({ score }: ScoreCardProps) {
  const config = LABEL_CONFIG[score.label as keyof typeof LABEL_CONFIG] || LABEL_CONFIG.Good;

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 text-center"
        style={{
          border: `1px solid ${config.border}`,
          boxShadow: `0 0 40px ${config.color}15`,
        }}
      >
        <div className="text-5xl mb-3">{config.icon}</div>
        <div className="text-7xl font-display font-black mb-2"
          style={{ color: config.color }}>
          {score.label}
        </div>
        <p className="text-sm mb-6" style={{ color: '#8892a4' }}>
          {config.description}
        </p>

        {/* Overall score ring */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none"
                stroke={config.color} strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - score.overall / 10) }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                style={{ filter: `drop-shadow(0 0 6px ${config.color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: config.color }}>
                {score.overall}
              </span>
              <span className="text-xs" style={{ color: '#4a5568' }}>/10</span>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <p className="text-sm leading-relaxed" style={{ color: '#a0aec0' }}>
          {score.feedback}
        </p>
      </motion.div>

      {/* Dimension breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="font-display font-bold text-lg mb-5 text-white">
          Dimension Breakdown
        </h2>
        <div className="space-y-5">
          {DIMENSIONS.map((dim, i) => {
            const value = score[dim.key as keyof ScoreData] as number;
            const barColor = value >= 8 ? '#ffd700' : value >= 5 ? '#00d4ff' : '#f59e0b';

            return (
              <motion.div
                key={dim.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{dim.icon}</span>
                    <div>
                      <span className="text-sm font-semibold text-white">{dim.label}</span>
                      <p className="text-xs" style={{ color: '#4a5568' }}>{dim.description}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold ml-4" style={{ color: barColor }}>
                    {value}/10
                  </span>
                </div>
                <ScoreBar value={value} color={barColor} delay={400 + i * 100} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"
            style={{ color: '#10b981' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Strengths
          </h3>
          <ul className="space-y-2">
            {score.strengths?.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#a0aec0' }}>
                <span style={{ color: '#10b981' }}>•</span>
                {s}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5"
        >
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"
            style={{ color: '#f59e0b' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Areas to Improve
          </h3>
          <ul className="space-y-2">
            {score.improvements?.map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#a0aec0' }}>
                <span style={{ color: '#f59e0b' }}>•</span>
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
