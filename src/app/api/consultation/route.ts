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
          temperature: 0.7,
          max_tokens: 4096,
          messages: messages as { role: 'system' | 'user'; content: string }[],
        });
        return completion;
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        console.log(`[Consultation] ${MODELS[modelIdx]} attempt ${attempt + 1} failed (${status})`);
        if (status === 503 || status === 429) {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
            continue;
          }
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
    const body = await req.json();
    const { customerName, grade, subject, needs, currentSituation, notes, customContent } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const customerInfo = [
      customerName && `학생/학부모 이름: ${customerName}`,
      grade && `학년: ${grade}`,
      subject && `과목: ${subject}`,
      needs && `니즈: ${needs}`,
      currentSituation && `현재 상황: ${currentSituation}`,
      notes && `특이사항: ${notes}`,
      customContent && `추가 내용: ${customContent}`,
    ].filter(Boolean).join('\n');

    console.log('[Consultation] Generating consultation material...');

    const completion = await callWithRetry(groq, [
      {
        role: 'system',
        content: `당신은 SBS아카데미컴퓨터아트학원 분당점의 전문 상담 자료 작성가입니다.
학부모/학생 상담을 위한 전문적이고 설득력 있는 상담 자료를 작성합니다.

반드시 아래 JSON 형식으로만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력하세요.

{
  "title": "상담 자료 제목 (예: OOO 학생 맞춤 학습 상담 자료)",
  "subtitle": "부제목 (예: SBS아카데미컴퓨터아트학원 분당점)",
  "sections": [
    {
      "title": "섹션 제목",
      "content": "상세 내용 (3-5문장으로 전문적으로 작성)",
      "imageKeyword": "이 섹션에 어울리는 이미지를 위한 영어 키워드 (예: 'student studying mathematics classroom')"
    }
  ],
  "youtubeRecommendations": [
    {
      "title": "채널/콘텐츠 한글 제목 (예: 포토샵 기초 강좌)",
      "searchQuery": "YouTube 검색 쿼리 (예: 포토샵 기초 강의 튜토리얼)",
      "description": "이 콘텐츠를 추천하는 이유 1줄 설명"
    }
  ]
}

규칙:
- sections는 최소 6개, 최대 8개 생성
- 고객 정보에 맞춰 개인화된 내용 작성
- imageKeyword는 교육/학습 관련 실사 이미지를 생성할 수 있는 영어 키워드
- 전문적이고 신뢰감 있는 톤으로 작성

★★★ 매우 중요한 금지사항 ★★★
- 절대로 개강일, 시간표, 수업 시간, 몇월 개강, 주몇회 등 스케줄/시간표 관련 내용을 언급하지 마세요
- 통화 내용에서 직접 언급되지 않은 사실을 지어내지 마세요
- 수강료, 가격 관련 내용도 언급하지 마세요

★★★ 반드시 포함할 내용 ★★★
- 해당 분야/자격증을 배워야 하는 이유와 근거를 강하게 설득력 있게 작성 (최소 2개 섹션)
- 해당 분야의 취업 시장 현황, 연봉 데이터, 채용 트렌드 등 구체적 수치와 통계를 포함
- 해당 자격증/기술의 실질적 활용처와 커리어 가치를 상세히 설명
- 해당 분야의 최신 업계 동향, 시장 뉴스, 기술 트렌드를 포함 (실제 근거 있는 내용)
- 예시: "2025년 기준 디자인 분야 평균 연봉 3,800만원", "국내 IT 인력 부족 약 16만명" 등 실제 통계 활용
- 학원의 장점, 맞춤 커리큘럼, 학습 방법, 성과 사례, 학습 환경도 포함하되 시간표 관련은 제외

- youtubeRecommendations는 3~5개 생성하며, 해당 과목/분야에 맞는 교육용 YouTube 검색 쿼리를 포함
- 검색 쿼리는 한국어 또는 영어로 학습에 도움이 되는 콘텐츠를 찾을 수 있도록 작성`,
      },
      {
        role: 'user',
        content: `다음 고객 정보를 기반으로 상담 자료를 생성해주세요:\n\n${customerInfo}`,
      },
    ]);

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
    }

    console.log('[Consultation] Response received');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답에서 JSON을 찾을 수 없습니다.' }, { status: 500 });
    }

    const material = JSON.parse(jsonMatch[0]);
    return NextResponse.json(material);
  } catch (error: unknown) {
    console.error('[Consultation] Error:', error);
    const message = error instanceof Error ? error.message : '상담 자료 생성 중 오류 발생';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
