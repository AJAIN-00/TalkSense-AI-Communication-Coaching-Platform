import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ScoreCard } from '@/components/ui/ScoreCard';

interface ResultsPageProps {
  params: { id: string };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !session) {
    notFound();
  }

  const score = session.score_detail as {
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
  } | null;

  const modeLabels: Record<string, string> = {
    general: 'General Conversation',
    interview: 'Job Interview',
    sales: 'Sales Pitch',
    speaking: 'Public Speaking',
    conflict: 'Conflict Resolution',
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: '#04070f' }}>
      <div className="max-w-3xl mx-auto">
        {/* Back nav */}
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 mb-8 text-sm group"
          style={{ color: '#8892a4' }}>
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
              color: '#00d4ff',
            }}>
            Session Complete
          </div>
          <h1 className="font-display font-bold text-4xl text-white mb-2">
            Your Results
          </h1>
          <p className="text-sm" style={{ color: '#8892a4' }}>
            {modeLabels[session.mode]} •{' '}
            {new Date(session.created_at).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })} •{' '}
            {Math.floor((session.duration_seconds || 0) / 60)}m {(session.duration_seconds || 0) % 60}s
          </p>
        </div>

        {score ? (
          <ScoreCard score={score} />
        ) : (
          <div className="glass-card p-8 text-center">
            <p style={{ color: '#8892a4' }}>Score data not available for this session.</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-4 justify-center mt-10">
          <Link href={`/session?mode=${session.mode}`}
            className="btn-primary">
            Practice Again
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            View All Sessions
          </Link>
        </div>
      </div>
    </div>
  );
}
