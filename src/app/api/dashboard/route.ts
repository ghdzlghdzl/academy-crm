import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { CustomerStatus, STATUSES } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const { data: rawCustomers, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const customers = (rawCustomers || []).map(mapCustomer);
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayFollowUp = customers.filter(c => c.followUpDate === today);
    const upcomingFollowUp = customers.filter(
      c => c.followUpDate && c.followUpDate > today && c.followUpDate <= threeDaysLater
    );
    const overdueFollowUp = customers.filter(
      c => c.followUpDate && c.followUpDate < today && c.status !== '등록' && c.status !== '보류'
    );

    const statusCounts: Record<string, number> = {};
    STATUSES.forEach((s: CustomerStatus) => {
      statusCounts[s] = customers.filter(c => c.status === s).length;
    });

    const channelCounts: Record<string, number> = {};
    customers.forEach(c => {
      const ch = c.channel || '기타';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    });

    const assigneeCounts: Record<string, number> = {};
    customers.forEach(c => {
      const a = c.assignee || '미배정';
      assigneeCounts[a] = (assigneeCounts[a] || 0) + 1;
    });

    const totalContacted = customers.filter(c => c.status !== '미컨택').length;
    const consultationBooked = customers.filter(c => c.consultationBooked).length;
    const registered = customers.filter(c => c.status === '등록').length;
    const conversionRate = {
      contacted: totalContacted,
      booked: consultationBooked,
      registered,
      contactToBookRate: totalContacted > 0 ? Math.round((consultationBooked / totalContacted) * 100) : 0,
      bookToRegisterRate: consultationBooked > 0 ? Math.round((registered / consultationBooked) * 100) : 0,
      overallRate: totalContacted > 0 ? Math.round((registered / totalContacted) * 100) : 0,
    };

    return NextResponse.json({
      todayFollowUp,
      upcomingFollowUp,
      overdueFollowUp,
      statusCounts,
      channelCounts,
      assigneeCounts,
      conversionRate,
      totalCustomers: customers.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '대시보드 조회 실패';
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
