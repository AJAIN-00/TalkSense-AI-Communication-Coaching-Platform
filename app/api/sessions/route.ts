import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { mode } = body as { mode: string };

    const { data, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        mode,
        transcript: [],
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ sessionId: data.id });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
