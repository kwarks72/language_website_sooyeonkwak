# 적용한 보안 변경 사항

## 1. `schema.sql` 실행 (Supabase SQL Editor)

기존 정책 `using (true) with check (true)` — 즉 **"누구나 다 됨"** — 을 지우고,
"조회는 누구나, 추가·수정·삭제는 관리자 이메일만" 정책으로 교체해요.

- 파일 안의 `YOUR_ADMIN_EMAIL@example.com`을 실제 관리자 이메일로 **모두** 바꾼 뒤 실행하세요.
- `App.jsx` 상단의 `ADMIN_EMAIL` 값과 **반드시 똑같아야** 해요. 다르면 관리자 로그인을 해도
  화면엔 편집 버튼이 보이는데 실제 저장은 거부되는(RLS 오류) 상황이 생겨요.

## 2. `App.jsx`에서 바뀐 부분

**(1) 로그인한 사람의 인증 토큰을 실제로 서버에 보내도록 수정**

기존 코드는 단어/문장을 추가·수정·삭제할 때 `accessToken`을 넘기지 않아서,
로그인 여부와 상관없이 항상 익명 키(anon key)로만 요청하고 있었어요.
이러면 RLS를 아무리 강하게 걸어도 관리자 본인조차 글을 못 올리는 상태가 돼요.
→ `VocabCardCatalog`, `WordCardsPage`, `SentencePracticePage`의 모든 쓰기 요청에
  `accessToken: session?.access_token`을 추가했어요.

**(2) 화면에서도 관리자가 아니면 편집 UI 자체를 숨김**

RLS가 최종 방어선이지만, 관리자가 아닌 사람 눈에 "추가/수정/삭제/즐겨찾기" 버튼이
아예 안 보이는 게 사용성 면에서 맞다고 판단해 `isAdmin` 여부로 감쌌어요.
→ 로그인 안 한 방문자, 그리고 로그인은 했지만 관리자가 아닌 회원은 카드 조회만 가능해요.

**(3) 홈 화면 제목 업데이트**

이전 대화에서 요청하셨던 대로 홈 제목/부제도 반영해뒀어요.
- "영어 공부방" → "모두의 언어방"
- 부제 → "단어 카드와 문장으로 배우는 다국어 학습 사이트"

## 3. 적용 순서

1. Supabase SQL Editor에서 `schema.sql` 실행 (이메일 치환 필수)
2. `App.jsx`의 `ADMIN_EMAIL`을 같은 이메일로 설정
3. 배포 후 관리자 계정으로 로그인해서 단어 추가가 실제로 되는지 확인
4. 로그아웃 상태(또는 다른 계정)로 접속해서 편집 버튼이 안 보이는지, 조회는 되는지 확인

## 4. 남아있는 참고 사항 (코드 밖에서 처리)

- `SUPABASE_ANON_KEY`는 프론트에 노출돼도 되는 "공개용" 키가 맞아요 (Supabase 설계상 정상).
  실제 보호는 이번에 적용한 RLS 정책이 담당해요.
- 로그인 시도 제한(brute force 방지)은 Supabase가 기본 제공하지만,
  Dashboard → Authentication → Settings에서 hCaptcha를 켜면 한 단계 더 강화돼요.
- 세션이 `localStorage`에 저장되는 구조라 XSS에 다소 취약할 수 있어요.
  React가 기본적으로 innerHTML을 이스케이프해주기 때문에 지금 코드 구조상 위험은 낮지만,
  앞으로 `dangerouslySetInnerHTML`을 쓰는 기능을 추가한다면 이 부분을 다시 점검해야 해요.
