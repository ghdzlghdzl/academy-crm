# 학원 CRM - 고객 관리 자동화 시스템

통화 녹취 파일 업로드 → 자동 텍스트 변환(STT) → AI 분석 → 고객 DB 저장까지 한 번에 처리하는 학원 영업팀 전용 CRM입니다.

## 주요 기능

- **녹취 자동 분석**: 녹취 파일(mp3/m4a/wav) 업로드 → Whisper STT → Claude AI 분석 → 자동 저장
- **칸반 보드**: 미컨택 / 1차통화완료 / 상담예약 / 상담완료 / 등록 / 보류 — 드래그앤드롭 상태 관리
- **대시보드**: 오늘 팔로업 고객, 3일 이내 예정 고객 자동 표시
- **고객 상세**: 컨택 이력 타임라인, 수동 메모 추가, 브리핑 시트 생성
- **키보드 단축키**: `U` 업로드, `B` 칸반 보드, `D` 대시보드

## 로컬 실행 방법

```bash
# 1. 의존성 설치
cd academy-crm
npm install

# 2. 환경변수 설정
# .env.local 파일을 편집하여 API 키를 입력하세요
```

### .env.local 설정

```
ANTHROPIC_API_KEY=sk-ant-xxxx    # Claude API 키 (AI 분석용)
OPENAI_API_KEY=sk-xxxx           # OpenAI API 키 (Whisper STT용)
```

> Supabase 없이도 동작합니다. 로컬 JSON 파일(`data/customers.json`, `data/contacts.json`)에 자동 저장됩니다.

```bash
# 3. 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인하세요.

## Supabase 사용 시 테이블 생성 SQL

```sql
-- 고객 테이블
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '미확인',
  phone TEXT DEFAULT '',
  channel TEXT DEFAULT '전화',
  created_at TIMESTAMPTZ DEFAULT now(),
  assignee TEXT DEFAULT '',
  status TEXT DEFAULT '미컨택' CHECK (status IN ('미컨택', '1차통화완료', '상담예약', '상담완료', '등록', '보류')),
  grade TEXT,
  subject TEXT,
  preferred_time TEXT,
  needs TEXT,
  current_situation TEXT,
  follow_up_date DATE,
  consultation_booked BOOLEAN DEFAULT false,
  consultation_date DATE,
  next_action TEXT,
  notes TEXT
);

-- 컨택 이력 테이블
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT now(),
  type TEXT DEFAULT 'call' CHECK (type IN ('call', 'visit', 'message')),
  transcript TEXT,
  memo TEXT,
  ai_generated BOOLEAN DEFAULT false
);

-- 인덱스
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_follow_up ON customers(follow_up_date);
CREATE INDEX idx_contacts_customer ON contacts(customer_id);
```

## 기술 스택

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **DB**: 로컬 JSON 파일 (Supabase 연동 가능)
- **AI 분석**: Anthropic Claude API (claude-sonnet-4-20250514)
- **음성 변환**: OpenAI Whisper API

## 폴더 구조

```
src/
├── app/
│   ├── page.tsx              # 메인 대시보드
│   ├── layout.tsx            # 글로벌 레이아웃 + 네비게이션
│   ├── board/page.tsx        # 칸반 보드
│   ├── customer/[id]/page.tsx # 고객 상세
│   ├── upload/page.tsx       # 녹취 업로드
│   └── api/
│       ├── upload/route.ts   # Whisper STT
│       ├── analyze/route.ts  # Claude AI 분석
│       ├── customers/        # 고객 CRUD
│       ├── dashboard/        # 대시보드 데이터
│       └── briefing/         # 브리핑 시트 생성
├── lib/
│   └── db.ts                 # 로컬 JSON DB
└── types/
    └── index.ts              # 타입 정의
data/
├── customers.json            # 고객 데이터
└── contacts.json             # 컨택 이력 데이터
```
