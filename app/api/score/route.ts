import { NextRequest, NextResponse } from 'next/server';
import { scoreSession, type ChatMessage, type PracticeMode } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, transcript, mode, durationSeconds } = body as {
      sessionId: string;
      transcript: ChatMessage[];
      mode: PracticeMode;
      durationSeconds: number;
    };

    if (!sessionId || !transcript || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Score the session
    const score = await scoreSession(transcript, mode);

    // Update session in database
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        transcript: transcript,
        score_label: score.label,
        score_detail: score,
        duration_seconds: durationSeconds,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session:', updateError);
    }

    return NextResponse.json({ score, sessionId });
  } catch (error) {
    console.error('Score API error:', error);
    return NextResponse.json(
      { error: 'Failed to score session. Please try again.' },
      { status: 500 }
    );
  }
}
