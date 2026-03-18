# Lune 프로젝트 컨텍스트 문서
> 새 채팅에서 이 문서를 붙여넣으면 Lune 프로젝트 맥락을 이어갈 수 있습니다.

---

## 프로젝트 개요

**Lune** — "진짜 나를 알아가는 SDS (Self Discovery Service)"
- 기획/개발/배포 완료 상태
- URL: https://lune-app-eight.vercel.app
- GitHub: https://github.com/Jo880607/lune-app (private)
- 로컬 경로: `C:\Users\USER\Desktop\winter-sunshine-projects\lune-app`

---

## 서비스 정의

**타겟:** SNS는 지쳤는데 연결은 포기 못 한 25~35세
**핵심 철학:** 보여주기 위한 기록이 아닌, 나를 알기 위한 기록
**슬로건:** "SNS 지쳤죠?" / "1,000명 한정 / 조용히 나를 비추는 빛"

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS + 커스텀 CSS |
| DB/Auth/Storage | Firebase (Firestore, Auth, Storage) |
| AI 분석 | Claude Haiku (claude-haiku-4-5-20251001) |
| STT | OpenAI Whisper API |
| 배포 | Vercel |
| 본인인증 | Firebase 전화번호 인증 |

---

## 완성된 기능 목록

```
✅ 전체 기획 (타겟/수익/UX/안전/AI윤리)
✅ 픽셀 레트로 UI (Galmuri11 + Press Start 2P 폰트)
✅ Firebase Auth (전화번호 로그인)
✅ 온보딩 3단계 (환영 → 닉네임 → 첫 기록)
✅ 기록 화면 (음성/텍스트, 저장 후 수정 불가)
✅ 음성 기록 STT (Whisper API)
✅ Firestore 기록/유저 저장
✅ 첫 기록 즉시 AI 분석 (Claude Haiku)
✅ 주간 AI 분석 (나 탭, 주간/월간/연간 탭)
✅ 사람 간 실시간 매칭/대화
✅ AI 대화 (달빛 캐릭터)
✅ 대화 1시간 간격 제한
✅ 관리자 페이지 (/admin)
✅ PWA 설정 (폰 앱처럼 설치 가능)
✅ 대기자 명단 시스템 (/waitlist)
✅ Vercel 배포
✅ Firestore 보안 규칙
✅ 대화 보관 기능 (상호 동의 시 저장)
✅ Galmuri11 한글 픽셀 폰트 전체 통일
```

---

## 프로젝트 구조

```
lune-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx       # 전화번호 로그인
│   │   └── onboarding/page.tsx  # 온보딩 3단계
│   ├── api/
│   │   ├── analyze/route.ts     # Claude Haiku AI 분석
│   │   ├── connect/chat/route.ts # AI 대화 API
│   │   └── transcribe/route.ts  # Whisper STT
│   ├── connect/
│   │   ├── page.tsx             # 연결 선택 화면
│   │   └── chat/[connectionId]/page.tsx  # 실시간 채팅
│   ├── me/page.tsx              # 나 (AI 분석)
│   ├── record/page.tsx          # 기록 화면
│   ├── admin/page.tsx           # 관리자 대시보드
│   ├── waitlist/page.tsx        # 대기자 명단
│   ├── page.tsx                 # 메인 (온보딩 랜딩)
│   ├── layout.tsx               # 전역 레이아웃
│   └── globals.css              # 전역 스타일
├── components/
│   └── auth/LoginForm.tsx
├── lib/
│   ├── firebase.ts              # Firebase 초기화 (하드코딩)
│   ├── auth.ts                  # 인증 함수
│   ├── firestore.ts             # Firestore CRUD
│   └── ai.ts                   # AI 분석 함수
├── types/index.ts               # 타입 정의
├── public/
│   ├── manifest.json            # PWA 설정
│   └── icons/                   # PWA 아이콘
├── firestore.rules              # 보안 규칙
├── CLAUDE.md                    # Claude Code 가이드
└── .env.local                   # 환경변수 (git 제외)
```

---

## UI 디자인 시스템

**컨셉:** 픽셀 레트로 감성. 밤하늘 + 달 세계관.

```css
--bg:      #0D0D1A  /* 메인 배경 */
--bg2:     #1A1A2E  /* 서브 배경 */
--bg3:     #16213E  /* 카드/보더 */
--accent:  #C8A8E9  /* 달빛 연보라 */
--accent2: #9B72CF  /* 포인트 진한 버전 */
--yellow:  #FFE566  /* 별빛 노랑 */
--text:    #E8E8F0  /* 기본 텍스트 */
--muted:   #6B6B8A  /* 흐린 텍스트 */
```

**폰트:** Galmuri11 (본문, CDN: https://cdn.jsdelivr.net/npm/galmuri/dist/galmuri.css) + Press Start 2P (타이틀)
**네비게이션:** 탭 3개 고정 — 기록 / 나 / 연결

---

## 핵심 설계 원칙

### 기록
- 음성 + 텍스트만 (사진 없음 — 현대 사진은 날것이 아님)
- 올린 후 수정 불가 (24시간 내 삭제만 가능)
- 가이드 문구: "잘 쓰려고 하지 않아도 돼요. 오늘 느낀 것, 스친 생각, 지금 이 순간. 그냥 떠오르는 대로."

### 연결 시스템
- 감정 태그 기반 매칭 (오늘 기록한 감정)
- 대화: 하루 2회 왕복, 1시간 간격
- 대화 종료 후 전체 삭제 (상호 동의 시 보관 가능)
- AI 신원 항상 공개 (🤖 표시)
- 7일 연속 AI 대화 시 사람 연결 제안

### 수익 구조
- 구독 없음
- 아이템 판매 (하루 2,000원 한도)
- BEP: 하루 7명 결제 (전환율 0.7%)
- 월 운영비 목표: 37만원 이하

### 유저 한도
- 최대 1,000명 (미접속 30일 시 교체)
- 대기자 1,000명 돌파 시 2,000명으로 확장 (단계별)
- 대기자 순번 앞당기기: 매일 방문 +1칸, 질문 답변 +15칸

---

## Firebase 설정

- **프로젝트 ID:** lune-app-fd23c
- **관리자 UID:** 25iRJKrVu9eJsjGWdZYrOHPimpZ2 (Jo)
- **테스트 번호:** +821012345678 / 123456, +821011111111 / 123456

### Firestore 컬렉션
- `users` — 유저 정보
- `records` — 기록
- `analyses` — AI 분석 결과
- `connections` — 연결
- `connections/{id}/messages` — 메시지 (subcollection)
- `waitlist` — 대기자 명단
- `stats` — 통계

---

## 환경변수 (.env.local)

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDX33D8gK7bbiMkLDw8TNzReM5N9wb_iVY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lune-app-fd23c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lune-app-fd23c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lune-app-fd23c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=556188934508
NEXT_PUBLIC_FIREBASE_APP_ID=1:556188934508:web:e47612bc8a121d0dbcd349
ANTHROPIC_API_KEY=실제키
OPENAI_API_KEY=실제키
```

**주의:** lib/firebase.ts는 현재 하드코딩 상태 (환경변수 이슈로)

---

## 남은 작업

```
⬜ 픽셀 아바타 에디터 시스템 (16x16 직접 그리기)
   └ 적용 위치: 연결화면, 채팅화면, 나 탭, 대기자명단, 온보딩
⬜ 이모지 아이콘 → 픽셀 아이콘 교체 (Piskel 등으로 직접 제작)
⬜ 마케팅 (빠더너스 문상훈 협업 검토)
⬜ 커스텀 도메인 연결 (lune.kr 등)
⬜ 네이티브 앱 래핑 (Capacitor, 앱스토어 출시)
```

---

## Claude Code 실행

```bash
cd C:\Users\USER\Desktop\winter-sunshine-projects\lune-app
claude --model claude-opus-4-5
```

## 로컬 개발 서버

```bash
npx next dev
```

## 배포

```bash
git add .
git commit -m "커밋 메시지"
git push
# Vercel 자동 배포
```

---

*Lune — 조용히 나를 비추는 빛 🌙*
