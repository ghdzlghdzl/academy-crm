import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !customer) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', id)
      .order('date', { ascending: false });

    return NextResponse.json({
      customer: mapCustomer(customer),
      contacts: (contacts || []).map(mapContact),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '고객 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const body = await req.json();

    // If there's a new contact to add
    if (body.newContact) {
      await supabase.from('contacts').insert({
        customer_id: id,
        user_id: user.id,
        type: body.newContact.type || 'call',
        transcript: body.newContact.transcript || null,
        memo: body.newContact.memo || '',
        ai_generated: body.newContact.aiGenerated || false,
        date: body.newContact.date || new Date().toISOString(),
      });
      delete body.newContact;
    }

    // Build update data (camelCase → snake_case)
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.channel !== undefined) updateData.channel = body.channel;
    if (body.assignee !== undefined) updateData.assignee = body.assignee;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.preferredTime !== undefined) updateData.preferred_time = body.preferredTime;
    if (body.needs !== undefined) updateData.needs = body.needs;
    if (body.currentSituation !== undefined) updateData.current_situation = body.currentSituation;
    if (body.followUpDate !== undefined) updateData.follow_up_date = body.followUpDate;
    if (body.consultationBooked !== undefined) updateData.consultation_booked = body.consultationBooked;
    if (body.consultationDate !== undefined) updateData.consultation_date = body.consultationDate;
    if (body.nextAction !== undefined) updateData.next_action = body.nextAction;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(mapCustomer(data));
    }

    // If only contact was added, return current customer
    const { data } = await supabase.from('customers').select('*').eq('id', id).single();
    return NextResponse.json(mapCustomer(data));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '고객 수정 중 오류';
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

function mapContact(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    date: row.date as string,
    type: row.type as string,
    transcript: row.transcript as string | null,
    memo: row.memo as string,
    aiGenerated: row.ai_generated as boolean,
  };
}
