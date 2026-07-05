'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a0020 0%, #04070f 65%)' }}>
      
      {/* Background radial glow orbs */}
      <div className="bg-orb w-[500px] h-[500px] top-[-100px] left-1/4 opacity-25"
        style={{ background: '#7c3aed' }} />
      <div className="bg-orb w-[400px] h-[400px] bottom-[10%] right-[10%] opacity-20"
        style={{ background: '#00d4ff' }} />

      {/* Navigation header */}
      <header className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="font-display font-black text-xl gradient-text tracking-wide">TalkSense</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold hover:text-teal-glow transition-colors px-4 py-2" style={{ color: '#8892a4' }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary py-2 px-5 text-xs font-bold">
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 flex flex-col justify-center items-center text-center z-10 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.2)', color: '#00d4ff' }}>
            ✨ AI-Powered Communication Coaching
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-white leading-tight">
            Master the Art of <br />
            <span className="gradient-text">Public Speaking & Pitching</span>
          </h1>

          <p className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#8892a4' }}>
            Practice speaking, job interviews, sales pitches, and conflict resolution in real-time with Sofia — our photorealistic 3D human AI coach. Get detailed scores, weaknesses, and strengths instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Link href="/signup" className="btn-primary text-base px-8 py-3.5">
              Start Practicing Free
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3.5">
              Watch Demo
            </Link>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24"
        >
          <div className="glass-card p-6 text-left" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-2xl mb-4">👤</div>
            <h3 className="font-display font-bold text-lg text-white mb-2">Photorealistic AI Avatar</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>
              Interact with Sofia, a fully human-like model with viseme-synced lip movement, eye contact, breathing, and nodding.
            </p>
          </div>

          <div className="glass-card p-6 text-left" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-2xl mb-4">🎙️</div>
            <h3 className="font-display font-bold text-lg text-white mb-2">Speech-to-Speech Flow</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>
              Completely voice-driven conversation practice. Sofia listens actively, thinks, and responds naturally in real-time.
            </p>
          </div>

          <div className="glass-card p-6 text-left" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-2xl mb-4">🎯</div>
            <h3 className="font-display font-bold text-lg text-white mb-2">Detailed Score Analytics</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>
              Receive ratings (Weak, Good, Talented) across multiple dimensions: clarity, confidence, vocabulary, tone, and structure.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-6 py-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-xs"
        style={{ color: '#4a5568' }}>
        <p>© 2026 TalkSense AI. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
