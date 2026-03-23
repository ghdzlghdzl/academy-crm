import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json((data || []).map(mapCustomer));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '고객 목록 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        name: body.name || '미확인',
        phone: body.phone || '',
        channel: body.channel || '전화',
        assignee: body.assignee || '',
        status: body.status || '미컨택',
        grade: body.grade || null,
        subject: body.subject || null,
        preferred_time: body.preferredTime || null,
        needs: body.needs || null,
        current_situation: body.currentSituation || null,
        follow_up_date: body.followUpDate || null,
        consultation_booked: body.consultationBooked || false,
        consultation_date: body.consultationDate || null,
        next_action: body.nextAction || null,
        notes: body.notes || null,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(mapCustomer(data), { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '고객 생성 중 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapCustomer(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    channel: row.channel as string,
    createdAt: row.created_at as string,
    assignee: row.assignee as string,
    status: row.status as string,
    grade: row.grade as string | null,
    subject: row.subject as string | null,
    preferredTime: row.preferred_time as string | null,
    needs: row.needs as string | null,
    currentSituation: row.current_situation as string | null,
    followUpDate: row.follow_up_date as string | null,
    consultationBooked: row.consultation_booked as boolean,
    consultationDate: row.consultation_date as string | null,
    nextAction: row.next_action as string | null,
    notes: row.notes as string | null,
  };
}
