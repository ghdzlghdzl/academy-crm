import { NextResponse } from 'next/server';
import { createSupabaseServer, createServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Use service client to bypass RLS for profile lookup
    const service = createServiceClient();
    const { data: profile } = await service.from('profiles').select('*').eq('id', user.id).single();
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || user.email,
        role: profile?.role || 'user',
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
