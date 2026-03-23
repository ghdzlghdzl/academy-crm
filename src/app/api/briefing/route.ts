import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

    const { customerId } = await req.json();
    if (!customerId) {
      return NextResponse.json({ error: '고객 ID가 필요합니다.' }, { status: 400 });
    }

    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    if (custErr || !customer) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const contactHistory = (contacts || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(c => `[${c.date}] ${c.memo}`)
      .join('\n\n');

    const completion = await groq.chat.completions.create({
      model: 'moonshotai/kimi-k2-instruct',
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: `당신은 학원 상담 전문가입니다. 고객 정보와 통화 이력을 바탕으로 상담 브리핑 시트를 작성해주세요.
브리핑 시트는 상담사가 상담 전에 빠르게 읽고 준비할 수 있도록 간결하고 구조적으로 작성하세요.`,
        },
        {
          role: 'user',
          content: `다음 고객의 상담 브리핑 시트를 작성해주세요.

## 고객 기본 정보
- 이름: ${customer.name}
- 연락처: ${customer.phone}
- 학년: ${customer.grade || '미확인'}
- 과목: ${customer.subject || '미확인'}
- 희망 시간대: ${customer.preferred_time || '미확인'}
- 고객 니즈: ${customer.needs || '미확인'}
- 현재 상황: ${customer.current_situation || '미확인'}
- 상담 예약일: ${customer.consultation_date || '미정'}
- 특이사항: ${customer.notes || '없음'}

## 통화 이력
${contactHistory || '이력 없음'}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
    }

    return NextResponse.json({ briefing: text });
  } catch (error: unknown) {
    console.error('[Briefing] Error:', error);
    const errMsg = error instanceof Error ? error.message : '브리핑 생성 중 오류 발생';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
