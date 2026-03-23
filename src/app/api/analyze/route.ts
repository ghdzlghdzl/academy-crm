import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const MODELS = [
  'moonshotai/kimi-k2-instruct',
  'llama-3.3-70b-versatile',
];

async function callWithRetry(groq: Groq, messages: { role: string; content: string }[], retries = 2) {
  for (let modelIdx = 0; modelIdx < MODELS.length; modelIdx++) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          model: MODELS[modelIdx],
          temperature: 0.1,
          max_tokens: 2048,
          messages: messages as { role: 'system' | 'user'; content: string }[],
        });
        return completion;
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        console.log(`[Analyze] ${MODELS[modelIdx]} attempt ${attempt + 1} failed (${status})`);
        if (status === 503 || status === 429) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
            continue;
          }
          // Try next model
          break;
        }
        throw err;
      }
    }
  }
  throw new Error('모든 AI 모델이 현재 사용 불가합니다. 잠시 후 다시 시도해주세요.');
}

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: '텍스트가 없습니다.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });
    const today = new Date().toISOString().split('T')[0];

    console.log('[Analyze] Sending to Groq LLM...');

    const completion = await callWithRetry(groq, [
      {
        role: 'system',
        content: `당신은 학원 영업팀의 통화 분석 전문가입니다.
통화 내용을 정확하게 분석해서 반드시 JSON 형식으로만 응답하세요.
설명이나 생각 과정 없이 오직 JSON 객체만 출력하세요.

분석 규칙:
- customerName: 통화 텍스트에서 사람 이름을 찾으세요. "OOO 학부모님", "OOO님", "OOO 어머님" 패턴에서 이름만 추출. 예: "김미영 학부모님" → "김미영"
- needs: 고객이 원하는 것을 구체적으로 요약 (예: "수학 성적 향상", "영어 내신 대비")
- grade: 학년 정보 (예: "중2", "고1", "초등 5학년")
- subject: 과목 (예: "수학", "영어", "국어")
- preferredTime: 희망 수업 시간대
- currentSituation: 현재 학습 상황 (예: "수학 성적 하락", "타학원 다니는 중")
- consultationBooked: 고객이 방문하겠다고 동의했으면 true. "가볼게요", "갈게요", "그때 뵙겠습니다" 등은 true
- consultationDate: 상담 날짜 (YYYY-MM-DD 형식). 요일로 언급된 경우 오늘(${today}) 기준으로 가장 가까운 해당 요일 날짜를 계산
- followUpDate: 상담예약이 있으면 상담일 전날, 없으면 오늘+3일 (YYYY-MM-DD)
- nextAction: 다음에 해야 할 구체적 행동 (예: "토요일 상담 전 확인 전화", "자료 문자 발송")
- notes: 결정권자, 가족 상황 등 특이사항
- status: 통화 결과에 따라 판단
  - "1차통화완료": 통화는 했지만 상담 예약은 안 잡힘
  - "상담예약": 방문 상담 일정이 확정됨
  - 그 외 상황에 맞게 판단

없는 정보만 null로 처리하고, 통화에서 유추 가능한 정보는 최대한 채워주세요.
반드시 JSON만 출력하세요.`,
      },
      {
        role: 'user',
        content: `아래는 학원 영업 통화 녹취 전문입니다. 분석해주세요.
오늘 날짜: ${today}
---
${transcript}`,
      },
    ]);

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
    }

    console.log('[Analyze] Response:', text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답에서 JSON을 찾을 수 없습니다.' }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error('[Analyze] Error:', error);
    const message = error instanceof Error ? error.message : 'AI 분석 중 오류 발생';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
