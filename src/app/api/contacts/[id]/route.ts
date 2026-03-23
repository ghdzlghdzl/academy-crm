import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const body = await req.json();
    const updateData: Record<string, unknown> = {};
    if (body.memo !== undefined) updateData.memo = body.memo;

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      customerId: data.customer_id,
      date: data.date,
      type: data.type,
      transcript: data.transcript,
      memo: data.memo,
      aiGenerated: data.ai_generated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '컨택 수정 중 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '컨택 삭제 중 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
