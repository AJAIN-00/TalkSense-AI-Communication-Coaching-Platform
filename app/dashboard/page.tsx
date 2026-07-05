'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface Session {
  id: string;
  mode: 'general' | 'interview' | 'sales' | 'speaking' | 'conflict';
  created_at: string;
  duration_seconds: number;
  score_label: 'Weak' | 'Good' | 'Talented' | null;
  score_detail: any;
  status: string;
}

const MODES = [
  {
    id: 'general',
    title: 'General Conversation',
    description: 'Practice natural conversation, friendly chatting, and small talk with Sofia.',
    icon: '💬',
    color: '#00d4ff',
    bg: 'rgba(0, 212, 255, 0.1)',
  },
  {
    id: 'interview',
    title: 'Job Interview Prep',
    description: 'Face tough professional interview questions and behavioral follow-ups.',
    icon: '👔',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.1)',
  },
  {
    id: 'sales',
    title: 'Sales Pitch Practice',
    description: 'Present your pitch and learn to handle hard objections from a skeptical buyer.',
    icon: '📈',
    color: '#ffd700',
    bg: 'rgba(255, 215, 0, 0.1)',
  },
  {
    id: 'speaking',
    title: 'Public Speaking',
    description: 'Speak to a critical audience. Improve clarity, structure, and pacing.',
    icon: '🎤',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'conflict',
    title: 'Conflict Resolution',
    description: 'Resolve tense workplace situations with a frustrated colleague.',
    icon: '🤝',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Profile details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Sessions list
      const { data: userSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (userSessions) {
        setSessions(userSessions);
      }
      setLoading(false);
    }
    fetchData();
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04070f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#00d4ff', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#04070f' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800 bg-navy-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="font-display font-bold text-lg gradient-text">TalkSense</span>
        </div>

        <div className="flex items-center gap-4">
          {userProfile?.role === 'admin' && (
            <Link href="/admin" className="text-sm font-medium hover:text-teal-glow transition-colors px-3 py-1.5 rounded-lg border border-teal-500/20 bg-teal-500/5">
              Admin Panel
            </Link>
          )}
          <span className="text-sm" style={{ color: '#8892a4' }}>
            Hi, <span className="text-white font-semibold">{userProfile?.full_name || userProfile?.email}</span>
          </span>
          <button onClick={handleSignOut} className="text-sm font-semibold hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main container */}
      <div className="max-w-6xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 cols: Coaching Modes */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Practice Scenarios</h1>
            <p className="text-sm" style={{ color: '#8892a4' }}>Select a mode to begin voice-based practice with Sofia, your AI communication coach.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODES.map((mode) => (
              <Link href={`/session?mode=${mode.id}`} key={mode.id} className="block group">
                <div className="glass-card-hover p-6 h-full flex flex-col justify-between"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                      style={{ background: mode.bg, border: `1px solid ${mode.color}25` }}>
                      {mode.icon}
                    </div>
                    <h3 className="font-display font-semibold text-lg text-white mb-2 group-hover:text-teal-glow transition-colors">
                      {mode.title}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>
                      {mode.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold" style={{ color: mode.color }}>
                    Start Session
                    <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right col: Session History */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white mb-2">Session History</h2>
            <p className="text-xs" style={{ color: '#8892a4' }}>Track your communication score and progress over time.</p>
          </div>

          <div className="glass-card p-5 space-y-4 max-h-[550px] overflow-y-auto" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            {sessions.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-xs" style={{ color: '#4a5568' }}>No practice sessions yet. Start your first one above!</p>
              </div>
            ) : (
              sessions.map((session) => {
                const modeDetails = MODES.find((m) => m.id === session.mode) || MODES[0];
                const dateString = new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const durationString = `${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`;

                // Badge style depending on rating
                const badgeColor = session.score_label === 'Talented'
                  ? { text: '#ffd700', bg: 'rgba(255, 215, 0, 0.1)', border: 'rgba(255,215,0,0.2)' }
                  : session.score_label === 'Good'
                  ? { text: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)', border: 'rgba(0, 212, 255, 0.2)' }
                  : { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };

                return (
                  <div key={session.id} className="p-4 rounded-xl flex items-center justify-between border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{modeDetails.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: '#4a5568' }}>
                        <span>{dateString}</span>
                        <span>•</span>
                        <span>{durationString}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {session.score_label ? (
                        <div className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ color: badgeColor.text, background: badgeColor.bg, border: `1px solid ${badgeColor.border}` }}>
                          {session.score_label}
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/5" style={{ color: '#8892a4' }}>
                          Incomplete
                        </div>
                      )}
                      
                      {session.score_label && (
                        <Link href={`/results/${session.id}`} className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
