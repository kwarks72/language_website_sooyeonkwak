import { useState, useEffect } from "react";
import {
  Volume2,
  Search,
  Plus,
  X,
  BookOpen,
  Star,
  Home as HomeIcon,
  AlertTriangle,
  Pencil,
  Trash2,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  User,
  LogOut,
} from "lucide-react";

// ───────────────────────────────────────────────────────────
// Supabase 설정 (여기만 채우면 전체 사이트가 실제 DB에 연결돼요)
//
// 1. https://supabase.com 에서 무료 계정 + 새 프로젝트를 만드세요.
// 2. 왼쪽 메뉴 Project Settings → API 에서
//    "Project URL"과 "anon public" 키를 복사해서 아래 두 줄에 붙여넣으세요.
// 3. SQL Editor에서 schema.sql (같이 드린 파일)을 실행해 테이블 + 보안 정책을 만드세요.
// ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://tbkcztqcnpvboqlihilo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRia2N6dHFjbnB2Ym9xbGloaWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjIxMDksImV4cCI6MjEwMTgzODEwOX0.qUG9NckDYud-3H6VjAsV4iSC2AGcsCM_X8emkqTxG3c";

// 관리자로 인식할 이메일 주소예요. 본인 계정 이메일로 바꿔주세요.
// (관리자 메뉴는 이 이메일로 로그인했을 때만 보이고 접근할 수 있어요.)
const ADMIN_EMAIL = "sooyeon0702@naver.com";

const isSupabaseConfigured = () =>
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  !SUPABASE_ANON_KEY.includes("YOUR_ANON_PUBLIC_KEY");

async function supabaseRequest(table, { method = "GET", query = "", body, accessToken } = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Supabase ${method} ${table} 실패: ${res.status} ${errText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ───────────────────────────────────────────────────────────
// Supabase Auth (이메일/비밀번호 회원가입 · 로그인 · 로그아웃)
// Supabase 대시보드 → Authentication → Providers 에서 Email 로그인이
// 켜져 있어야 동작해요 (기본값으로 켜져 있음).
// "Confirm email" 옵션이 켜져 있으면 가입 후 이메일 인증을 완료해야
// 로그인할 수 있어요. 테스트 중에는 Authentication → Settings에서
// 꺼두면 바로 로그인할 수 있어요.
// ───────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────
// 가벼운 URL 라우팅 (react-router 없이 History API만 사용)
// 새로고침해도 같은 페이지가 유지되고, 특정 페이지 링크를
// 카카오톡/문자로 공유할 수 있게 해줘요.
// ───────────────────────────────────────────────────────────
const PAGE_PATHS = {
  home: "/",
  search: "/search",
  vocab: "/vocab",
  enSentences: "/en-sentences",
  jaWords: "/ja-words",
  jaSentences: "/ja-sentences",
  esWords: "/es-words",
  esSentences: "/es-sentences",
  admin: "/admin",
  privacy: "/privacy",
};

const PAGE_TITLES = {
  home: "모두의 언어방",
  search: "전체 검색 · 모두의 언어방",
  vocab: "낱말장 · 모두의 언어방",
  enSentences: "영어 문장 · 모두의 언어방",
  jaWords: "일본어 단어 · 모두의 언어방",
  jaSentences: "일본어 문장 · 모두의 언어방",
  esWords: "스페인어 단어 · 모두의 언어방",
  esSentences: "스페인어 문장 · 모두의 언어방",
  admin: "관리자 · 모두의 언어방",
  privacy: "개인정보처리방침 · 모두의 언어방",
};

const PATH_TO_PAGE = Object.fromEntries(Object.entries(PAGE_PATHS).map(([id, path]) => [path, id]));

function getPageFromLocation() {
  const path = window.location.pathname;
  return PATH_TO_PAGE[path] || "home";
}

// 파비콘을 코드로 직접 그려서 넣어요 (public 폴더 파일 없이도 동작해요).
function setAppFavicon() {
  try {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="14" fill="%23141019"/>' +
      '<text x="32" y="43" font-size="30" font-family="Georgia, serif" font-weight="700" ' +
      'text-anchor="middle" fill="%23F4EEFB">語</text></svg>';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = "data:image/svg+xml," + svg;
  } catch (e) {
    // 파비콘 설정이 실패해도 사이트 기능엔 영향 없으니 조용히 넘어가요.
  }
}

const AUTH_SESSION_KEY = "engstudy_auth_session";

async function supabaseAuthRequest(path, body) {
  if (!isSupabaseConfigured()) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error_description || data.msg || data.error || `요청에 실패했어요 (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function supabaseSignUp(email, password) {
  return supabaseAuthRequest("signup", { email, password });
}

async function supabaseSignIn(email, password) {
  return supabaseAuthRequest("token?grant_type=password", { email, password });
}

// 비밀번호 재설정 이메일 발송 — 이 메일의 링크를 클릭하면
// #access_token=...&type=recovery 형태로 사이트에 돌아와요.
async function supabaseRequestPasswordReset(email) {
  return supabaseAuthRequest(`recover?redirect_to=${encodeURIComponent(window.location.origin)}`, { email });
}

// 복구 링크로 들어온 access_token으로 실제 비밀번호를 변경해요.
async function supabaseUpdatePassword(accessToken, newPassword) {
  if (!isSupabaseConfigured()) throw new Error("SUPABASE_NOT_CONFIGURED");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.msg || data.error || `요청에 실패했어요 (${res.status})`);
  }
  return data;
}

async function supabaseSignOut(accessToken) {
  if (!isSupabaseConfigured() || !accessToken) return;
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (e) {
    // 네트워크 오류가 나도 로컬 세션은 지우면 되므로 무시해요.
  }
}

function loadStoredSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function storeSession(session) {
  try {
    if (session) {
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch (e) {
    // 저장 공간을 못 쓰는 환경이면 그냥 넘어가요 (로그인 유지만 안 될 뿐).
  }
}

// ───────────────────────────────────────────────────────────
// 연속 학습일(스트릭) — 브라우저 localStorage 기반으로 간단하게 추적해요.
// 계정에 저장되는 게 아니라 "이 브라우저에서 방문한 날짜" 기록이라
// 기기를 바꾸면 초기화돼요. 정확한 계정별 기록이 필요해지면
// Supabase 테이블로 옮기는 게 다음 단계예요.
// ───────────────────────────────────────────────────────────
const STREAK_KEY = "engstudy_streak_log";

function logStudyVisit() {
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    const dates = raw ? JSON.parse(raw) : [];
    const today = new Date().toISOString().slice(0, 10);
    if (!dates.includes(today)) {
      dates.push(today);
      if (dates.length > 400) dates.shift();
      window.localStorage.setItem(STREAK_KEY, JSON.stringify(dates));
    }
  } catch (e) {
    // 저장 공간을 못 쓰는 환경이면 그냥 넘어가요.
  }
}

function getStreak() {
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    const dates = raw ? JSON.parse(raw) : [];
    if (dates.length === 0) return 0;
    const set = new Set(dates);
    let streak = 0;
    const d = new Date();
    // 오늘 방문 기록이 없으면 "어제까지의 스트릭"을 보여줘요 (아직 오늘 안 왔을 뿐이니까).
    const todayKey = d.toISOString().slice(0, 10);
    if (!set.has(todayKey)) d.setDate(d.getDate() - 1);
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (set.has(key)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  } catch (e) {
    return 0;
  }
}


function SupabaseSetupNotice() {
  return (
    <div className="setup-notice">
      <style>{`
        .setup-notice {
          max-width: 640px;
          margin: 0 auto 20px auto;
          background: #fff4e0;
          border: 1px solid #d99b3f;
          border-radius: 6px;
          padding: 16px 18px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-family: 'Noto Sans KR', sans-serif;
        }
        .setup-notice h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #7a4a12;
        }
        .setup-notice p {
          margin: 0;
          font-size: 13px;
          color: #6b5638;
          line-height: 1.5;
        }
      `}</style>
      <AlertTriangle size={20} color="#c07a1f" style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <h4>Supabase 연결이 필요해요</h4>
        <p>
          파일 상단의 SUPABASE_URL과 SUPABASE_ANON_KEY를 본인 프로젝트 값으로 채워야
          단어/글이 실제로 저장돼요. 지금은 데모 상태라 새로고침하면 내용이 사라져요.
        </p>
      </div>
    </div>
  );
}


function AuthModal({ initialMode = "login", onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfoMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (mode === "forgot") {
      if (!email.trim()) {
        setError("이메일을 입력해주세요.");
        return;
      }
    } else {
      if (!email.trim() || !password) {
        setError("이메일과 비밀번호를 입력해주세요.");
        return;
      }
      if (password.length < 6) {
        setError("비밀번호는 6자 이상이어야 해요.");
        return;
      }
      if (mode === "signup" && password !== password2) {
        setError("비밀번호가 서로 달라요.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "forgot") {
        await supabaseRequestPasswordReset(email.trim());
        setInfoMsg("재설정 링크를 이메일로 보냈어요. 메일함을 확인해주세요.");
      } else if (mode === "signup") {
        const data = await supabaseSignUp(email.trim(), password);
        if (data.access_token) {
          onAuthSuccess({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
          });
        } else {
          setInfoMsg("가입 완료! 이메일로 온 인증 링크를 확인한 뒤 로그인해주세요.");
          setMode("login");
          setPassword("");
          setPassword2("");
        }
      } else {
        const data = await supabaseSignIn(email.trim(), password);
        onAuthSuccess({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        });
      }
    } catch (err) {
      if (err.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      else setError(err.message || "요청에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <style>{`
        .auth-overlay {
          position: fixed; inset: 0; z-index: 110; background: rgba(20,12,6,0.72);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .auth-modal {
          width: 100%; max-width: 380px; background: linear-gradient(160deg, #FFFCF4 0%, #FFF8E8 55%, #FFFDF6 100%);
          border: 1px solid #D9C79A; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          padding: 22px; display: flex; flex-direction: column; gap: 14px;
        }
        .auth-header { display: flex; align-items: center; justify-content: space-between; }
        .auth-header h3 {
          font-family: 'Fraunces', serif; font-size: 19px; color: #221C12; margin: 0;
        }
        .auth-close { background: none; border: none; color: #8a6f45; cursor: pointer; padding: 4px; border-radius: 4px; }
        .auth-close:hover { background: rgba(227,167,46,0.14); color: #221C12; }
        .auth-tabs { display: flex; gap: 6px; background: #FCF4DE; border-radius: 6px; padding: 4px; }
        .auth-tab {
          flex: 1; text-align: center; padding: 8px 0; border-radius: 5px; border: none; cursor: pointer;
          font-family: 'Noto Sans KR', sans-serif; font-size: 13.5px; font-weight: 600; color: #8a6f45; background: transparent;
        }
        .auth-tab.active { background: #E3A72E; color: #2a1c0e; }
        .auth-form { display: flex; flex-direction: column; gap: 10px; }
        .auth-form label { font-size: 12px; color: #655C48; font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.5px; }
        .auth-form input {
          font-family: 'Noto Sans KR', sans-serif; font-size: 14px; padding: 10px 12px; border-radius: 5px;
          border: 1px solid #b8a578; background: #fffaf0; color: #2a2420; outline: none; width: 100%;
        }
        .auth-form input:focus-visible { box-shadow: 0 0 0 3px rgba(227,167,46,0.5); }
        .auth-submit {
          margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 6px;
          background: #2f4f3e; color: #f0e6d2; border: none; padding: 11px 16px; border-radius: 6px;
          font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .auth-submit:hover { background: #24402f; }
        .auth-submit:disabled { opacity: 0.7; cursor: default; }
        .auth-error {
          font-size: 12.5px; color: #DC3B26; background: #FCEAE6; border: 1px solid #F3C4BA;
          border-radius: 5px; padding: 8px 10px;
        }
        .auth-info {
          font-size: 12.5px; color: #149468; background: #E4F4EC; border: 1px solid #BFE3D2;
          border-radius: 5px; padding: 8px 10px;
        }
      `}</style>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h3>{mode === "login" ? "로그인" : mode === "signup" ? "회원가입" : "비밀번호 재설정"}</h3>
          <button className="auth-close" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {mode !== "forgot" && (
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")} type="button">
              로그인
            </button>
            <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")} type="button">
              회원가입
            </button>
          </div>
        )}

        {needsSetup && <SupabaseSetupNotice />}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="auth-email">이메일</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label htmlFor="auth-password">비밀번호 (6자 이상)</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}
          {mode === "signup" && (
            <div>
              <label htmlFor="auth-password2">비밀번호 확인</label>
              <input
                id="auth-password2"
                type="password"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              style={{ background: "none", border: "none", color: "#d9b98a", fontSize: 12.5, textAlign: "left", cursor: "pointer", padding: 0 }}
            >
              비밀번호를 잊으셨나요?
            </button>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              style={{ background: "none", border: "none", color: "#d9b98a", fontSize: 12.5, textAlign: "left", cursor: "pointer", padding: 0 }}
            >
              ← 로그인으로 돌아가기
            </button>
          )}

          {error && <div className="auth-error">{error}</div>}
          {infoMsg && <div className="auth-info">{infoMsg}</div>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? "처리 중…" : mode === "login" ? "로그인" : mode === "signup" ? "회원가입" : "재설정 링크 보내기"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── 전체 언어 통합 검색 페이지 ──
const SEARCH_SOURCES = [
  { table: "vocab_words", lang: "영어", code: "EN", color: "#C22E4F", page: "vocab" },
  { table: "japanese_words", lang: "일본어", code: "JA", color: "#3F63C4", page: "jaWords" },
  { table: "spanish_words", lang: "스페인어", code: "ES", color: "#1C9C6B", page: "esWords" },
];

function GlobalSearchPage({ setPage }) {
  const [query, setQuery] = useState("");
  const [allWords, setAllWords] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          SEARCH_SOURCES.map((src) =>
            supabaseRequest(src.table, { query: "?select=*&order=created_at.asc" })
              .then((rows) => (Array.isArray(rows) ? rows.map((r) => ({ ...r, __src: src })) : []))
              .catch(() => [])
          )
        );
        if (!cancelled) setAllWords(results.flat());
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allWords.filter(
        (w) => (w.word || "").toLowerCase().includes(q) || (w.meaning || "").toLowerCase().includes(q)
      )
    : [];

  return (
    <div className="home-page" style={{ paddingTop: 40 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&display=swap');
        .home-page {
          --paper:#141019; --card:#211A2D; --card-border:#3A2E4D;
          --ink:#F4EEFB; --ink-soft:#B8ABCC; --ink-faint:#7C6D93;
        }
        .gsearch-wrap { max-width: 640px; margin: 0 auto; padding: 0 28px 80px; }
        .gsearch-title { font-family: 'Noto Serif KR', serif; font-weight: 700; font-size: 26px; margin: 0 0 6px; }
        .gsearch-sub { color: var(--ink-faint); font-size: 13px; margin: 0 0 24px; }
        .gsearch-input {
          width: 100%; padding: 14px 16px; font-size: 15px; border-radius: 10px;
          border: 1px solid var(--card-border); background: var(--card); color: var(--ink); outline: none;
        }
        .gsearch-input:focus { border-color: #E8543C; }
        .gsearch-results { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
        .gsearch-item {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 16px; border-radius: 10px; background: var(--card); border: 1px solid var(--card-border);
          cursor: pointer; text-align: left;
        }
        .gsearch-item:hover { border-color: #E8543C; }
        .gsearch-item-word { font-weight: 700; font-size: 15px; }
        .gsearch-item-meaning { color: var(--ink-soft); font-size: 13px; margin-left: 8px; }
        .gsearch-item-tag {
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em;
          padding: 3px 7px; border-radius: 5px; color: #fff; flex-shrink: 0;
        }
        .gsearch-empty { color: var(--ink-faint); font-size: 13.5px; text-align: center; margin-top: 40px; }
      `}</style>
      <div className="gsearch-wrap">
        <h1 className="gsearch-title">전체 검색</h1>
        <p className="gsearch-sub">영어·일본어·스페인어 단어를 언어 상관없이 한 번에 찾아보세요.</p>
        <input
          className="gsearch-input"
          type="text"
          autoFocus
          placeholder="단어 또는 뜻으로 검색 (예: apple, 사과)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!loaded ? (
          <p className="gsearch-empty">불러오는 중…</p>
        ) : q && filtered.length === 0 ? (
          <p className="gsearch-empty">검색 결과가 없어요.</p>
        ) : (
          <div className="gsearch-results">
            {filtered.map((w) => (
              <div key={`${w.__src.table}-${w.id}`} className="gsearch-item" role="button" tabIndex={0} onClick={() => setPage(w.__src.page)}>
                <div>
                  <span className="gsearch-item-word">{w.word}</span>
                  <span className="gsearch-item-meaning">{w.meaning}</span>
                </div>
                <span className="gsearch-item-tag" style={{ background: w.__src.color }}>{w.__src.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 개인정보처리방침 페이지 ──
// ── 비밀번호 재설정 링크로 들어왔을 때 보여주는 화면 ──
function ResetPasswordPage({ accessToken, onDone }) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setSubmitting(true);
    try {
      await supabaseUpdatePassword(accessToken, password);
      setDone(true);
    } catch (err) {
      setError(err.message || "재설정에 실패했어요. 링크가 만료됐을 수 있어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#141019", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&display=swap');
        .reset-box {
          width: 100%; max-width: 380px; background: #211A2D; border: 1px solid #3A2E4D;
          border-radius: 14px; padding: 28px; display: flex; flex-direction: column; gap: 14px;
        }
        .reset-box h2 { font-family: 'Noto Serif KR', serif; color: #F4EEFB; margin: 0; font-size: 19px; }
        .reset-box input {
          font-size: 14px; padding: 11px 12px; border-radius: 6px; border: 1px solid #3A2E4D;
          background: #141019; color: #F4EEFB; outline: none; width: 100%;
        }
        .reset-box button[type="submit"] {
          background: linear-gradient(135deg, #E8543C, #C22E4F); color: #fff; border: none;
          padding: 12px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer;
        }
        .reset-error { font-size: 12.5px; color: #f4b6a0; background: rgba(122,45,30,0.35); border: 1px solid #a5432c; border-radius: 5px; padding: 8px 10px; }
      `}</style>
      <div className="reset-box">
        <h2>새 비밀번호 설정</h2>
        {done ? (
          <>
            <p style={{ color: "#B8ABCC", fontSize: 13.5 }}>비밀번호가 변경됐어요. 이제 새 비밀번호로 로그인해주세요.</p>
            <button type="button" onClick={onDone} style={{ background: "#E3A72E", color: "#2a1c0e", border: "none", padding: "12px 16px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              홈으로 이동
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="password" placeholder="새 비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="password" placeholder="새 비밀번호 확인" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
            {error && <div className="reset-error">{error}</div>}
            <button type="submit" disabled={submitting}>{submitting ? "처리 중…" : "비밀번호 변경"}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function PrivacyPage({ setPage }) {
  return (
    <div className="home-page" style={{ paddingTop: 50, paddingBottom: 80 }}>
      <style>{`
        .home-page { --paper:#141019; --card:#211A2D; --card-border:#3A2E4D; --ink:#F4EEFB; --ink-soft:#B8ABCC; }
        .privacy-wrap { max-width: 680px; margin: 0 auto; padding: 0 28px; line-height: 1.75; color: var(--ink-soft); }
        .privacy-wrap h1 { font-family: 'Noto Serif KR', serif; color: var(--ink); font-size: 26px; margin-bottom: 6px; }
        .privacy-wrap h2 { color: var(--ink); font-size: 16.5px; margin: 34px 0 10px; }
        .privacy-wrap .updated { font-size: 12.5px; color: #7C6D93; margin-bottom: 30px; }
        .privacy-back { color: #E8543C; font-size: 13px; cursor: pointer; margin-bottom: 20px; display: inline-block; }
        table.privacy-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 12px 0; }
        table.privacy-table th, table.privacy-table td { border: 1px solid var(--card-border); padding: 8px 10px; text-align: left; }
        table.privacy-table th { background: var(--card); }
      `}</style>
      <div className="privacy-wrap">
        <span className="privacy-back" role="button" tabIndex={0} onClick={() => setPage("home")}>← 홈으로</span>
        <h1>개인정보처리방침</h1>
        <div className="updated">시행일: 2026년 8월</div>

        <p>모두의 언어방(이하 "사이트")은 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다.</p>

        <h2>1. 수집하는 개인정보 항목</h2>
        <table className="privacy-table">
          <tbody>
            <tr><th>회원가입 시</th><td>이메일 주소, 비밀번호(암호화 저장)</td></tr>
            <tr><th>서비스 이용 시</th><td>학습 기록(즐겨찾기), 접속 로그</td></tr>
          </tbody>
        </table>

        <h2>2. 개인정보 수집 및 이용 목적</h2>
        <p>회원 식별 및 로그인 유지, 학습 기록 저장, 부정 이용 방지를 위해 사용합니다.</p>

        <h2>3. 보유 기간</h2>
        <p>회원 탈퇴 시 지체 없이 파기합니다.</p>

        <h2>4. 제3자 제공</h2>
        <p>이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</p>

        <h2>5. 이용자의 권리</h2>
        <p>언제든지 본인의 개인정보를 조회·수정할 수 있으며, 탈퇴를 통해 삭제를 요청할 수 있습니다.</p>

        <h2>6. 문의</h2>
        <p>개인정보 관련 문의는 운영자 이메일로 연락해주세요.</p>
      </div>
    </div>
  );
}

function AdminPage({ session }) {
  const [profiles, setProfiles] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await supabaseRequest("profiles", {
          query: "?select=*&order=created_at.desc",
          accessToken: session?.access_token,
        });
        if (!cancelled && Array.isArray(rows)) setProfiles(rows);
      } catch (e) {
        if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
        else setError(e.message || "가입자 목록을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  return (
    <div className="shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .shell {
          min-height: 100vh;
          background:
            repeating-linear-gradient(100deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 5px),
            linear-gradient(160deg, #FFFCF4 0%, #FFF8E8 55%, #FFFDF6 100%);
          font-family: 'Noto Sans KR', sans-serif; color: #2a2420; padding: 20px;
        }
        .header-plaque {
          max-width: 860px; margin: 0 auto 18px auto; display: flex; align-items: center; gap: 12px;
          background: linear-gradient(180deg, #F0BC49, #E3A72E); border: 1px solid #D9C79A;
          border-radius: 6px; padding: 14px 20px; box-shadow: 0 3px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.35);
        }
        .header-plaque h1 { font-family: 'Fraunces', serif; font-weight: 700; font-size: 24px; color: #2a1c0e; margin: 0; }
        .header-plaque p { margin: 2px 0 0 0; font-size: 12.5px; color: #4a3418; font-weight: 500; }
        .content { max-width: 860px; margin: 0 auto; }
        .admin-panel {
          background: #FFFFFF; border: 1px solid #F0E6C8; border-radius: 6px; padding: 20px 22px;
          box-shadow: 0 2px 0 rgba(0,0,0,0.15), 0 10px 22px rgba(0,0,0,0.3);
        }
        .admin-panel h3 { font-family: 'Fraunces', serif; margin: 0 0 4px 0; font-size: 17px; color: #2a1c0e; }
        .admin-count { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8a6f45; margin: 0 0 16px 0; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td {
          text-align: left; padding: 10px 12px; border-bottom: 1px solid #F0E6C8; font-size: 13.5px;
        }
        .admin-table th {
          font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
          color: #6b5638;
        }
        .admin-table td { color: #2a2420; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-empty { text-align: center; padding: 40px 20px; color: #6b5638; }
        .admin-error { color: #7a3b2a; font-size: 13px; margin-top: 10px; }
      `}</style>

      <div className="header-plaque">
        <User size={24} color="#2a1c0e" strokeWidth={2} />
        <div>
          <h1>관리자 · 가입자 목록</h1>
          <p>회원가입한 계정을 확인해요</p>
        </div>
      </div>

      <div className="content">
        {needsSetup && <SupabaseSetupNotice />}
        {!needsSetup && (
          <div className="admin-panel">
            <h3>가입자</h3>
            {!loaded ? (
              <p className="admin-count">불러오는 중…</p>
            ) : (
              <p className="admin-count">총 {profiles.length}명</p>
            )}
            {error && <p className="admin-error">{error}</p>}
            {loaded && profiles.length === 0 && !error ? (
              <div className="admin-empty">
                아직 가입자가 없어요.
                <br />
                (또는 profiles 테이블/트리거 설정이 아직 안 되어 있을 수 있어요 — 파일 상단 SQL 주석을 확인해주세요.)
              </div>
            ) : profiles.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id}>
                      <td>{p.email}</td>
                      <td>{p.created_at ? new Date(p.created_at).toLocaleString("ko-KR") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function NavDropdown({ label, icon: Icon, items, page, setPage, isOpen, onOpenChange }) {
  const isActiveGroup = items.some((it) => it.id === page);
  return (
    <div className="nav-dropdown">
      <button
        type="button"
        className={`nav-tab nav-dropdown-trigger ${isActiveGroup ? "active" : ""}`}
        onClick={() => onOpenChange(isOpen ? null : label)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Icon size={16} />
        {label}
        <ChevronDown size={14} className={`nav-dropdown-caret ${isOpen ? "open" : ""}`} />
      </button>
      {isOpen && (
        <div className="nav-dropdown-menu" role="menu">
          {items.map((it) => (
            <button
              key={it.id}
              role="menuitem"
              className={`nav-dropdown-item ${page === it.id ? "active" : ""}`}
              onClick={() => {
                setPage(it.id);
                onOpenChange(null);
              }}
            >
              <it.icon size={15} />
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavBar({ page, setPage, session, isAdmin, onLoginClick, onSignupClick, onLogout }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
  }, [page]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (!e.target.closest || !e.target.closest(".nav-dropdown")) setOpenMenu(null);
    };
    const handleEscape = (e) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("click", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const groups = [
    {
      label: "영어",
      icon: Volume2,
      items: [
        { id: "vocab", label: "낱말장", icon: BookOpen },
        { id: "enSentences", label: "영어 문장", icon: Volume2 },
      ],
    },
    {
      label: "일본어",
      icon: Sparkles,
      items: [
        { id: "jaWords", label: "일본어 단어", icon: Sparkles },
        { id: "jaSentences", label: "일본어 문장", icon: Volume2 },
      ],
    },
    {
      label: "스페인어",
      icon: Sparkles,
      items: [
        { id: "esWords", label: "스페인어 단어", icon: Sparkles },
        { id: "esSentences", label: "스페인어 문장", icon: Volume2 },
      ],
    },
  ];

  return (
    <nav className="site-nav">
      <style>{`
        .site-nav {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(20,16,25,0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #2B2238;
        }
        .nav-tabs-group {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; flex: 1 1 auto;
        }
        .nav-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: #B8ABCC;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
        }
        .nav-tab:hover { background: rgba(255,255,255,0.06); color: #F4EEFB; }
        .nav-tab.active {
          background: rgba(232,84,60,0.16);
          color: #F4EEFB;
          font-weight: 700;
          border-color: rgba(232,84,60,0.4);
        }
        .nav-tab:focus-visible { outline: 2px solid #E8543C; outline-offset: 2px; }
        .nav-dropdown { position: relative; }
        .nav-dropdown-trigger { }
        .nav-dropdown-caret { transition: transform 0.15s ease; }
        .nav-dropdown-caret.open { transform: rotate(180deg); }
        .nav-dropdown-menu {
          position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; gap: 2px; min-width: 160px;
          background: #211A2D; border: 1px solid #3A2E4D;
          border-radius: 8px; padding: 6px; box-shadow: 0 10px 26px rgba(0,0,0,0.5); z-index: 30;
        }
        .nav-dropdown-item {
          display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
          font-family: 'Noto Sans KR', sans-serif; font-size: 13px; font-weight: 500; color: #B8ABCC;
          background: transparent; border: none; border-radius: 5px; padding: 9px 10px; cursor: pointer;
          white-space: nowrap;
        }
        .nav-dropdown-item:hover { background: rgba(255,255,255,0.06); color: #F4EEFB; }
        .nav-dropdown-item.active { background: rgba(232,84,60,0.16); color: #F4EEFB; font-weight: 700; }
        .nav-dropdown-item:focus-visible { outline: 2px solid #E8543C; outline-offset: 2px; }
        .nav-auth {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
          padding-left: 8px; margin-left: 4px; border-left: 1px solid #2B2238;
        }
        .nav-auth-btn {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Noto Sans KR', sans-serif; font-size: 13px; font-weight: 600;
          border-radius: 6px; padding: 8px 14px; cursor: pointer; white-space: nowrap;
        }
        .nav-login-btn { background: transparent; border: 1px solid #3A2E4D; color: #F4EEFB; }
        .nav-login-btn:hover { background: rgba(255,255,255,0.06); }
        .nav-signup-btn { background: linear-gradient(135deg, #E8543C, #C22E4F); border: 1px solid transparent; color: #fff; }
        .nav-signup-btn:hover { filter: brightness(1.08); }
        .nav-auth-btn:focus-visible { outline: 2px solid #E8543C; outline-offset: 2px; }
        .nav-user { display: flex; align-items: center; gap: 8px; }
        .nav-user-email {
          display: flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace;
          font-size: 12px; color: #B8ABCC; max-width: 150px; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-logout-btn {
          display: flex; align-items: center; gap: 5px; background: transparent; border: 1px solid #3A2E4D;
          color: #B8ABCC; border-radius: 6px; padding: 7px 12px; font-size: 12.5px; cursor: pointer;
          font-family: 'Noto Sans KR', sans-serif;
        }
        .nav-logout-btn:hover { background: rgba(255,255,255,0.06); color: #F4EEFB; }
        @media (max-width: 760px) {
          .nav-auth { border-left: none; margin-left: 0; padding-left: 0; width: 100%; justify-content: center; }
        }
      `}</style>
      <div className="nav-tabs-group">
        <button
          className={`nav-tab ${page === "home" ? "active" : ""}`}
          onClick={() => { setPage("home"); setOpenMenu(null); }}
          aria-current={page === "home" ? "page" : undefined}
        >
          <HomeIcon size={16} />
          홈
        </button>
        <button
          className={`nav-tab ${page === "search" ? "active" : ""}`}
          onClick={() => { setPage("search"); setOpenMenu(null); }}
          aria-current={page === "search" ? "page" : undefined}
        >
          <Search size={16} />
          전체 검색
        </button>
        {groups.map((g) => (
          <NavDropdown
            key={g.label}
            label={g.label}
            icon={g.icon}
            items={g.items}
            page={page}
            setPage={setPage}
            isOpen={openMenu === g.label}
            onOpenChange={setOpenMenu}
          />
        ))}
        {isAdmin && (
          <button
            className={`nav-tab ${page === "admin" ? "active" : ""}`}
            onClick={() => { setPage("admin"); setOpenMenu(null); }}
            aria-current={page === "admin" ? "page" : undefined}
          >
            <User size={16} />
            관리자
          </button>
        )}
      </div>
      <div className="nav-auth">
        {streak > 0 && (
          <span
            title="연속 학습일 (이 브라우저 기준)"
            style={{
              display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700,
              color: "#F4B840", fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            🔥 {streak}일째
          </span>
        )}
        {session ? (
          <div className="nav-user">
            <span className="nav-user-email">
              <User size={13} />
              {session.user?.email}
            </span>
            <button className="nav-logout-btn" onClick={onLogout}>
              <LogOut size={13} />
              로그아웃
            </button>
          </div>
        ) : (
          <>
            <button className="nav-auth-btn nav-login-btn" onClick={onLoginClick}>
              로그인
            </button>
            <button className="nav-auth-btn nav-signup-btn" onClick={onSignupClick}>
              회원가입
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

// ── 언어별 섹션 정의 (거대한 문자 타이포그래피 아트로 정체성 표현) ──
const HOME_LANG_ROWS = [
  {
    lang: "en",
    native: "영어",
    sub: "English",
    code: "EN",
    glyph: "Aa",
    gradient: "linear-gradient(135deg, #E8543C 0%, #C22E4F 100%)",
    stampColor: "#C22E4F",
    cards: [
      { page: "vocab", title: "낱말장", num: "01",
        icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /> },
      { page: "enSentences", title: "영어 문장", num: "02",
        icon: <><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> },
    ],
  },
  {
    lang: "ja",
    native: "일본어",
    sub: "日本語",
    code: "JA",
    glyph: "あ",
    gradient: "linear-gradient(135deg, #3F63C4 0%, #6B3FB8 100%)",
    stampColor: "#3F63C4",
    cards: [
      { page: "jaWords", title: "일본어 단어", num: "01",
        icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /> },
      { page: "jaSentences", title: "일본어 문장", num: "02",
        icon: <><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> },
    ],
  },
  {
    lang: "es",
    native: "스페인어",
    sub: "Español",
    code: "ES",
    glyph: "Ñ",
    gradient: "linear-gradient(135deg, #1C9C6B 0%, #0F7A8C 100%)",
    stampColor: "#1C9C6B",
    cards: [
      { page: "esWords", title: "스페인어 단어", num: "01",
        icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /> },
      { page: "esSentences", title: "스페인어 문장", num: "02",
        icon: <><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> },
    ],
  },
];

function Home({ setPage }) {
  return (
    <div className="home-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..900&family=Noto+Serif+KR:wght@500;600;700;800&display=swap');
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css');

        .home-page {
          --paper:#141019; --paper-soft:#1C1626; --card:#211A2D; --card-border:#3A2E4D;
          --ink:#F4EEFB; --ink-soft:#B8ABCC; --ink-faint:#7C6D93;
          min-height: 100vh;
          background: var(--paper);
          color: var(--ink);
          font-family: 'Pretendard Variable', Pretendard, -apple-system, sans-serif;
          padding-bottom: 70px;
          overflow-x: hidden;
        }
        .home-hero {
          max-width: 900px; margin: 0 auto; padding: 84px 28px 24px; text-align: center; position: relative;
        }
        .home-glyph-row {
          display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 22px;
        }
        .home-glyph-row span {
          font-family: 'Fraunces', serif; font-weight: 800; font-size: clamp(48px, 9vw, 96px);
          line-height: 1;
        }
        .home-glyph-row span:nth-child(1) { background: linear-gradient(135deg, #E8543C, #C22E4F); -webkit-background-clip: text; background-clip: text; color: transparent; transform: rotate(-4deg); }
        .home-glyph-row span:nth-child(2) { background: linear-gradient(135deg, #3F63C4, #6B3FB8); -webkit-background-clip: text; background-clip: text; color: transparent; transform: translateY(-6px); }
        .home-glyph-row span:nth-child(3) { background: linear-gradient(135deg, #1C9C6B, #0F7A8C); -webkit-background-clip: text; background-clip: text; color: transparent; transform: rotate(5deg); }
        .home-hero h1 {
          font-family: 'Noto Serif KR', serif; font-weight: 800; font-size: clamp(26px, 3.6vw, 36px);
          line-height: 1.25; letter-spacing: -0.01em; margin: 0 0 10px; color: var(--ink);
        }
        .home-hero p { font-size: 14.5px; color: var(--ink-soft); line-height: 1.7; margin: 0 0 6px; }
        .home-hero-note {
          font-size: 12.5px; color: var(--ink-faint); font-family: 'Fraunces', serif; font-style: italic;
        }
        .home-rooms { max-width: 1080px; margin: 0 auto; padding: 60px 28px 0; display: flex; flex-direction: column; gap: 6px; }
        .home-lang-row {
          position: relative; display: grid; grid-template-columns: 220px 1fr; gap: 28px; align-items: center;
          padding: 44px 24px; border-radius: 20px; overflow: hidden;
          background: var(--paper-soft); border: 1px solid var(--card-border);
        }
        @media (max-width: 820px) { .home-lang-row { grid-template-columns: 1fr; gap: 18px; padding: 32px 20px; } }
        .home-lang-bg-glyph {
          position: absolute; right: -30px; top: 50%; transform: translateY(-50%);
          font-family: 'Fraunces', serif; font-weight: 800; font-size: 260px; line-height: 1;
          opacity: 0.06; pointer-events: none; user-select: none; white-space: nowrap;
        }
        .home-lang-label { position: relative; z-index: 1; }
        .home-lang-native { font-family: 'Noto Serif KR', serif; font-weight: 700; font-size: 24px; display: block; margin: 0 0 3px; color: var(--ink); }
        .home-lang-sub {
          font-size: 11px; color: var(--ink-faint); font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .home-card-pair { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 560px) { .home-card-pair { grid-template-columns: 1fr; } }
        .home-card {
          background: rgba(255,255,255,0.03); border: 1px solid var(--card-border);
          border-radius: 12px; padding: 16px 18px; cursor: pointer; text-align: left;
          transition: transform .15s ease, background .15s ease, border-color .15s ease;
          backdrop-filter: blur(2px);
        }
        .home-card:hover, .home-card:focus-visible { transform: translateY(-2px); background: rgba(255,255,255,0.07); outline: none; }
        .home-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .home-card-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #fff; }
        .home-card-tag {
          font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.08em;
          color: var(--ink-faint);
        }
        .home-card h3 { font-family: 'Noto Serif KR', serif; font-weight: 600; font-size: 15.5px; margin: 0; color: var(--ink); }
      `}</style>

      <section className="home-hero">
        <div className="home-glyph-row">
          <span>Aa</span>
          <span>あ</span>
          <span>Ñ</span>
        </div>
        <h1>모두의 언어방</h1>
        <p>단어로 외우고, 문장으로 말하기를 연습하세요.</p>
        <p className="home-hero-note">단어 카드와 문장으로 배우는 다국어 학습 사이트</p>
      </section>

      <section className="home-rooms">
        {HOME_LANG_ROWS.map((row) => (
          <div className="home-lang-row" key={row.lang}>
            <span className="home-lang-bg-glyph" style={{ background: row.gradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {row.glyph}
            </span>
            <div className="home-lang-label">
              <span className="home-lang-native">{row.native}</span>
              <span className="home-lang-sub">{row.sub}</span>
            </div>
            <div className="home-card-pair">
              {row.cards.map((c) => (
                <div
                  key={c.page}
                  className="home-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setPage(c.page)}
                  onKeyDown={(e) => { if (e.key === "Enter") setPage(c.page); }}
                >
                  <div className="home-card-top">
                    <div className="home-card-icon" style={{ background: row.stampColor }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {c.icon}
                      </svg>
                    </div>
                    <span className="home-card-tag">{row.code} · {c.num}</span>
                  </div>
                  <h3>{c.title}</h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// 초기 상태: 저장된 단어가 없습니다. 사용자가 직접 추가한 단어만 쌓입니다.
const DEFAULT_WORDS = [];

const EMPTY_FORM = {
  word: "",
  pos: "명사",
  ipa: "",
  meaning: "",
  example: "",
  exampleKo: "",
  tags: "",
};

function mapWordRow(r) {
  return {
    id: r.id,
    word: r.word,
    pos: r.pos,
    ipa: r.ipa,
    meaning: r.meaning,
    example: r.example,
    exampleKo: r.example_ko,
    favorite: !!r.favorite,
    tags: r.tags || "",
  };
}

function parseTags(tagsStr) {
  return (tagsStr || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// ── 4지선다 퀴즈 모달 (단어 카드 공용) ──
function buildQuizQuestions(items, count = 5) {
  const pool = items.filter((i) => i.word && i.meaning);
  if (pool.length < 4) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((correct) => {
    const wrongPool = pool.filter((i) => i.id !== correct.id);
    const wrongs = [...wrongPool].sort(() => Math.random() - 0.5).slice(0, 3).map((w) => w.meaning);
    const options = [...wrongs, correct.meaning].sort(() => Math.random() - 0.5);
    return { word: correct.word, correctMeaning: correct.meaning, options };
  });
}

function QuizModal({ items, onClose }) {
  const [questions] = useState(() => buildQuizQuestions(items));
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[step];

  const choose = (opt) => {
    if (selected) return;
    setSelected(opt);
    if (opt === current.correctMeaning) setScore((s) => s + 1);
  };

  const next = () => {
    if (step + 1 >= questions.length) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
      setSelected(null);
    }
  };

  return (
    <div className="quiz-overlay" onClick={onClose}>
      <style>{`
        .quiz-overlay {
          position: fixed; inset: 0; z-index: 100; background: rgba(20,12,6,0.72);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .quiz-modal {
          width: 100%; max-width: 460px; background: #FFFCF4;
          border: 1px solid #F0E6C8; border-radius: 14px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          padding: 26px; display: flex; flex-direction: column; gap: 16px;
          max-height: 88vh; overflow-y: auto;
        }
        @media (max-width: 480px) {
          .quiz-modal { padding: 20px 18px; }
        }
        .quiz-header { display: flex; align-items: center; justify-content: space-between; }
        .quiz-header h3 { font-family: 'Fraunces', serif; font-size: 18px; color: #221C12; margin: 0; }
        .quiz-close { background: none; border: none; color: #8a6f45; cursor: pointer; padding: 4px; border-radius: 4px; }
        .quiz-close:hover { background: rgba(0,0,0,0.06); }
        .quiz-progress { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8a6f45; }
        .quiz-word { font-family: 'Fraunces', serif; font-weight: 700; font-size: 34px; color: #221C12; text-align: center; margin: 6px 0 4px; }
        .quiz-options { display: flex; flex-direction: column; gap: 8px; }
        .quiz-option {
          text-align: left; padding: 12px 14px; border-radius: 8px; border: 1px solid #F0E6C8;
          background: #fff; cursor: pointer; font-size: 14.5px; color: #221C12;
        }
        .quiz-option:hover { border-color: #E3A72E; }
        .quiz-option.correct { background: #E4F4EC; border-color: #149468; color: #0d5c40; }
        .quiz-option.wrong { background: #FCEAE6; border-color: #DC3B26; color: #8f281a; }
        .quiz-next {
          align-self: flex-end; background: #2f4f3e; color: #f0e6d2; border: none;
          padding: 10px 18px; border-radius: 8px; font-size: 13.5px; cursor: pointer; font-weight: 600;
        }
        .quiz-next:hover { background: #24402f; }
        .quiz-result { text-align: center; padding: 20px 0; }
        .quiz-result-score { font-family: 'Fraunces', serif; font-weight: 700; font-size: 40px; color: #221C12; margin: 8px 0; }
      `}</style>
      <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quiz-header">
          <h3>퀴즈 풀기</h3>
          <button className="quiz-close" onClick={onClose} aria-label="닫기"><X size={18} /></button>
        </div>

        {questions.length === 0 ? (
          <p style={{ color: "#8a6f45", fontSize: 14 }}>퀴즈를 만들려면 단어 카드가 4개 이상 필요해요.</p>
        ) : finished ? (
          <div className="quiz-result">
            <div className="quiz-progress">RESULT</div>
            <div className="quiz-result-score">{score} / {questions.length}</div>
            <p style={{ color: "#655C48", fontSize: 13.5 }}>수고하셨어요!</p>
          </div>
        ) : (
          <>
            <div className="quiz-progress">{step + 1} / {questions.length}</div>
            <div className="quiz-word">{current.word}</div>
            <div className="quiz-options">
              {current.options.map((opt) => {
                let cls = "quiz-option";
                if (selected) {
                  if (opt === current.correctMeaning) cls += " correct";
                  else if (opt === selected) cls += " wrong";
                }
                return (
                  <button key={opt} className={cls} onClick={() => choose(opt)} disabled={!!selected}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {selected && (
              <button className="quiz-next" onClick={next}>
                {step + 1 >= questions.length ? "결과 보기" : "다음 문제"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 눈에 잘 띄는 저장 성공/실패 알림 (여러 페이지에서 공용으로 사용) ──
function Toast({ message, kind = "error", onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!message) return null;

  return (
    <div className={`toast toast-${kind}`} role="status">
      <style>{`
        .toast {
          position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%);
          z-index: 200; display: flex; align-items: center; gap: 10px;
          padding: 13px 18px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
          font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif;
          box-shadow: 0 12px 28px rgba(0,0,0,0.35);
          animation: toast-in 0.2s ease;
          max-width: 90vw;
        }
        @keyframes toast-in { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .toast-error { background: #DC3B26; color: #fff; }
        .toast-success { background: #149468; color: #fff; }
      `}</style>
      {kind === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
      {message}
    </div>
  );
}

// ── 전체 카드를 한 장씩 넘겨보는 슬라이드 모달 (낱말장 / 문장 카드 공용) ──
function SlideshowModal({ title, items, onClose, renderItem }) {


  const [index, setIndex] = useState(0);
  const total = items.length;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [total, onClose]);

  if (total === 0) return null;
  const safeIndex = Math.min(index, total - 1);
  const current = items[safeIndex];

  return (
    <div className="slideshow-overlay" onClick={onClose}>
      <style>{`
        .slideshow-overlay {
          position: fixed; inset: 0; z-index: 100; background: rgba(20,12,6,0.72);
          display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .slideshow-modal {
          width: 100%; max-width: 640px; background: linear-gradient(160deg, #FFFCF4 0%, #FFF8E8 55%, #FFFDF6 100%);
          border: 1px solid #D9C79A; border-radius: 10px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          padding: 18px; display: flex; flex-direction: column; gap: 14px;
        }
        .slideshow-header { display: flex; align-items: center; justify-content: space-between; }
        .slideshow-header h3 {
          font-family: 'Fraunces', serif; font-size: 18px; color: #221C12; margin: 0;
          display: flex; align-items: center; gap: 8px;
        }
        .slideshow-close {
          background: none; border: none; color: #8a6f45; cursor: pointer; padding: 4px;
          border-radius: 4px;
        }
        .slideshow-close:hover { background: rgba(227,167,46,0.14); color: #221C12; }
        .slideshow-body { display: flex; align-items: center; gap: 10px; }
        .slideshow-nav {
          flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; border: 1px solid #D9C79A;
          background: #E3A72E; color: #2a1c0e; cursor: pointer; display: flex; align-items: center;
          justify-content: center;
        }
        .slideshow-nav:hover:not(:disabled) { background: #F0BC49; }
        .slideshow-nav:disabled { opacity: 0.3; cursor: default; }
        .slideshow-nav:focus-visible { outline: 2px solid #e0b978; outline-offset: 2px; }
        .slideshow-card {
          flex: 1 1 auto; min-width: 0; min-height: 240px; background: #FFFFFF; border: 1px solid #F0E6C8;
          border-radius: 6px; padding: 24px 26px; box-shadow: 0 2px 0 rgba(0,0,0,0.15), 0 12px 26px rgba(0,0,0,0.3);
          display: flex; flex-direction: column; justify-content: center; gap: 8px;
        }
        .slideshow-footer { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .slideshow-count { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8a6f45; }
        .slideshow-dots { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; max-width: 100%; }
        .slideshow-dot {
          width: 7px; height: 7px; border-radius: 50%; background: rgba(227,167,46,0.35); border: none;
          cursor: pointer; padding: 0;
        }
        .slideshow-dot.active { background: #e0b978; }
        @media (max-width: 520px) {
          .slideshow-nav { width: 32px; height: 32px; }
          .slideshow-card { padding: 18px 16px; min-height: 200px; }
        }
      `}</style>
      <div className="slideshow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="slideshow-header">
          <h3><Layers size={18} />{title}</h3>
          <button className="slideshow-close" onClick={onClose} aria-label="슬라이드 닫기">
            <X size={20} />
          </button>
        </div>
        <div className="slideshow-body">
          <button
            className="slideshow-nav"
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={safeIndex === 0}
            aria-label="이전 카드"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="slideshow-card">{renderItem(current, safeIndex)}</div>
          <button
            className="slideshow-nav"
            onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
            disabled={safeIndex === total - 1}
            aria-label="다음 카드"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="slideshow-footer">
          <span className="slideshow-count">{safeIndex + 1} / {total}</span>
          {total <= 40 && (
            <div className="slideshow-dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  className={`slideshow-dot ${i === safeIndex ? "active" : ""}`}
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}번 카드로 이동`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VocabCardCatalog({ session, isAdmin }) {
  const [words, setWords] = useState(DEFAULT_WORDS);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [speakingId, setSpeakingId] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeTag, setActiveTag] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await supabaseRequest("vocab_words", {
          query: "?select=*&order=created_at.asc",
        });
        if (!cancelled && Array.isArray(rows)) {
          const mapped = rows.map(mapWordRow);
          setWords(mapped);
          if (mapped.length > 0) setSelectedId(mapped[0].id);
        }
      } catch (e) {
        if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const speak = (text, id) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.85;
    utter.pitch = 1;
    utter.onstart = () => setSpeakingId(id);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
  };

  const allTags = [...new Set(words.flatMap((w) => parseTags(w.tags)))];

  const filtered = words.filter((w) => {
    const q = search.trim().toLowerCase();
    const matchesQuery = !q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q);
    const matchesTag = !activeTag || parseTags(w.tags).includes(activeTag);
    return matchesQuery && matchesTag;
  });

  const selected = words.find((w) => w.id === selectedId) || words[0];
  const selectedIndex = words.findIndex((w) => w.id === selectedId);

  const handleFormChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim() || !form.example.trim()) return;
    try {
      const rows = await supabaseRequest("vocab_words", {
        method: "POST",
        accessToken: session?.access_token,
        body: {
          word: form.word,
          pos: form.pos,
          ipa: form.ipa,
          meaning: form.meaning,
          example: form.example,
          example_ko: form.exampleKo,
          tags: form.tags,
        },
      });
      const newWord = mapWordRow(rows[0]);
      setWords((w) => [...w, newWord]);
      setSelectedId(newWord.id);
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      setSaveError(false);
      setNeedsSetup(false);
      setToastMsg({ text: "단어 카드를 저장했어요.", kind: "success" });
    } catch (e) {
      if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      else {
        setSaveError(true);
        setToastMsg({ text: "저장에 실패했어요. 다시 시도해주세요.", kind: "error" });
      }
    }
  };

  const toggleFavorite = async (id) => {
    const current = words.find((w) => w.id === id);
    if (!current) return;
    const nextValue = !current.favorite;
    setWords((ws) => ws.map((w) => (w.id === id ? { ...w, favorite: nextValue } : w)));
    try {
      await supabaseRequest("vocab_words", {
        method: "PATCH",
        query: `?id=eq.${id}`,
        accessToken: session?.access_token,
        body: { favorite: nextValue },
      });
    } catch (e) {
      setWords((ws) => ws.map((w) => (w.id === id ? { ...w, favorite: !nextValue } : w)));
      setSaveError(true);
      setToastMsg({ text: "즐겨찾기 저장에 실패했어요.", kind: "error" });
    }
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm("이 단어 카드를 삭제할까요?")) return;
    const prevWords = words;
    const remaining = words.filter((w) => w.id !== id);
    setWords(remaining);
    if (selectedId === id) {
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    }
    setIsEditing(false);
    try {
      await supabaseRequest("vocab_words", {
        method: "DELETE",
        query: `?id=eq.${id}`,
        accessToken: session?.access_token,
      });
    } catch (e) {
      setWords(prevWords);
      setSaveError(true);
      setToastMsg({ text: "삭제에 실패했어요. 다시 시도해주세요.", kind: "error" });
    }
  };

  const startEditing = () => {
    if (!selected) return;
    setEditForm({
      word: selected.word,
      pos: selected.pos,
      ipa: selected.ipa || "",
      meaning: selected.meaning,
      example: selected.example,
      exampleKo: selected.exampleKo || "",
      tags: selected.tags || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const handleEditFormChange = (field) => (e) =>
    setEditForm((f) => ({ ...f, [field]: e.target.value }));

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!editForm.word.trim() || !editForm.meaning.trim() || !editForm.example.trim()) return;
    setSavingEdit(true);
    try {
      const rows = await supabaseRequest("vocab_words", {
        method: "PATCH",
        query: `?id=eq.${selected.id}`,
        accessToken: session?.access_token,
        body: {
          word: editForm.word,
          pos: editForm.pos,
          ipa: editForm.ipa,
          meaning: editForm.meaning,
          example: editForm.example,
          example_ko: editForm.exampleKo,
          tags: editForm.tags,
        },
      });
      const updated = mapWordRow(rows[0]);
      setWords((ws) => ws.map((w) => (w.id === updated.id ? updated : w)));
      setIsEditing(false);
      setSaveError(false);
      setToastMsg({ text: "수정했어요.", kind: "success" });
    } catch (e) {
      if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      else {
        setSaveError(true);
        setToastMsg({ text: "수정에 실패했어요. 다시 시도해주세요.", kind: "error" });
      }
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Noto+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        .shell {
          min-height: 100vh;
          background:
            repeating-linear-gradient(100deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 5px),
            linear-gradient(160deg, #FFFCF4 0%, #FFF8E8 55%, #FFFDF6 100%);
          font-family: 'Noto Sans KR', sans-serif;
          color: #2a2420;
          padding: 20px;
        }

        .header-plaque.wide {
          max-width: 980px;
          margin: 0 auto 18px auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          background: linear-gradient(180deg, #F0BC49, #E3A72E);
          border: 1px solid #D9C79A;
          border-radius: 6px;
          padding: 14px 20px;
          box-shadow: 0 3px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.35);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-title h1 {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 26px;
          color: #2a1c0e;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .header-title p {
          margin: 2px 0 0 0;
          font-size: 12.5px;
          color: #4a3418;
          font-weight: 500;
        }

        .search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .slideshow-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #2a1c0e;
          background: #f0e0c2;
          border: 1px solid #D9C79A;
          border-radius: 5px;
          padding: 8px 14px;
          cursor: pointer;
          white-space: nowrap;
        }
        .slideshow-toggle:hover { background: #fff4dd; }
        .slideshow-toggle:disabled { opacity: 0.5; cursor: default; }
        .slideshow-toggle:focus-visible { outline: 2px solid #2a1c0e; outline-offset: 2px; }

        .search-input {
          font-family: 'Noto Sans KR', sans-serif;
          background: #f3e8cf;
          border: 1px solid #D9C79A;
          border-radius: 5px;
          padding: 9px 12px 9px 34px;
          font-size: 14px;
          color: #2a2420;
          width: 220px;
          outline: none;
          transition: box-shadow 0.15s ease;
        }
        .search-input:focus-visible {
          box-shadow: 0 0 0 3px rgba(227,167,46,0.6);
        }
        .search-icon {
          position: absolute;
          left: 10px;
          color: #6b4a26;
        }

        .main-grid {
          max-width: 980px;
          margin: 0 auto;
          display: flex;
          gap: 18px;
          align-items: flex-start;
        }

        @media (max-width: 760px) {
          .main-grid { flex-direction: column; }
        }

        .drawer {
          flex: 0 0 240px;
          background: linear-gradient(180deg, #FDF8EC, #FDF8EC);
          border: 1px solid #F0E6C8;
          border-radius: 8px;
          padding: 12px;
          box-shadow: inset 0 0 0 1px rgba(227,167,46,0.06), 0 6px 16px rgba(0,0,0,0.3);
        }

        @media (max-width: 760px) {
          .drawer { flex: 1 1 auto; width: 100%; }
        }

        .drawer-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #8a6f45;
          margin: 2px 4px 10px 4px;
        }

        .drawer-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 420px;
          overflow-y: auto;
        }

        .drawer-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 5px;
          background: rgba(227,167,46,0.06);
          border: 1px solid transparent;
          cursor: pointer;
          color: #6b5638;
          font-size: 14px;
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .drawer-item:hover { background: rgba(227,167,46,0.14); }
        .drawer-item.active {
          background: #f0e6d2;
          color: #2a2420;
          border-color: #E3A72E;
          font-weight: 600;
        }
        .drawer-item .meaning-hint {
          font-size: 11.5px;
          opacity: 0.75;
        }
        .drawer-item-text {
          display: flex;
          align-items: baseline;
          gap: 5px;
          min-width: 0;
        }
        .drawer-item-num {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #8a6f45;
          opacity: 0.7;
          flex-shrink: 0;
        }
        .drawer-item.active .drawer-item-num { color: #8a6f45; }
        .drawer-item:focus-visible {
          outline: 2px solid #e0b978;
          outline-offset: 2px;
        }

        .add-toggle {
          margin-top: 10px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 10px;
          border-radius: 5px;
          border: 1px dashed #8a6f45;
          background: transparent;
          color: #f0e0c2;
          font-size: 13px;
          cursor: pointer;
        }
        .add-toggle:hover { background: rgba(227,167,46,0.10); }

        .card-area { flex: 1 1 auto; min-width: 0; }

        .card-wrap {
          position: relative;
          background: #FFFFFF;
          border-radius: 6px;
          padding: 30px 32px 26px 46px;
          transform: rotate(-0.4deg);
          box-shadow: 0 2px 0 rgba(0,0,0,0.15), 0 14px 30px rgba(0,0,0,0.35);
          border: 1px solid #F0E6C8;
          transition: transform 0.2s ease;
          background-image: repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(120,90,50,0.08) 28px);
        }
        .card-wrap:hover { transform: rotate(0deg); }

        .ring {
          position: absolute;
          left: 14px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #f6f1e6, #b7a37c 70%, #8d7a54);
          border: 1px solid #6e5c3a;
        }
        .ring.top { top: 22px; }
        .ring.bottom { bottom: 22px; }

        .card-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .card-number {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #8a6f45;
          letter-spacing: 1px;
        }

        .card-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fav-btn, .edit-btn, .delete-word-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #E3A72E;
          padding: 2px;
        }
        .edit-btn { color: #6b5638; }
        .edit-btn:hover { color: #2a1c0e; }
        .delete-word-btn { color: #C4860F; }
        .delete-word-btn:hover { color: #7a3b2a; }
        .fav-btn:focus-visible, .edit-btn:focus-visible, .delete-word-btn:focus-visible {
          outline: 2px solid #E3A72E; outline-offset: 2px;
        }

        .flashcard-outer {
          perspective: 1400px;
          cursor: pointer;
          min-height: 280px;
          outline: none;
        }
        .flashcard-outer:focus-visible .flashcard-face {
          outline: 2px solid #E3A72E;
          outline-offset: 3px;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          min-height: 280px;
          transition: transform 0.6s cubic-bezier(0.4, 0.15, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flashcard-inner.flipped { transform: rotateY(180deg); }
        @media (prefers-reduced-motion: reduce) {
          .flashcard-inner { transition: none; }
        }
        .flashcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .flashcard-front { align-items: flex-start; }
        .flashcard-back {
          transform: rotateY(180deg);
          justify-content: flex-start;
          align-items: flex-start;
          padding: 18px 20px 10px 4px;
          background: linear-gradient(160deg, #FCF4DE 0%, #F7E9C4 100%);
          border-radius: 4px;
          box-shadow: inset 0 0 0 1px rgba(227,167,46,0.35);
        }
        .flashcard-back .section-label { color: #C4860F; }
        .flashcard-back .meaning-text { color: #221C12; }
        .flashcard-back .example-en { color: #4a3418; }
        .flashcard-back .example-ko { color: #6b5638; }
        .flashcard-back .divider-dashed { border-top-color: rgba(196,134,15,0.35); }
        .flashcard-back .speaker-btn { background: #E3A72E; color: #221C12; }
        .flashcard-back .speaker-btn:hover { background: #C4860F; }
        .flip-hint {
          margin: 18px 0 0 0;
          font-size: 11.5px;
          color: #8a6f45;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.5px;
        }
        .flashcard-back .flip-hint { color: #8a6f45; }

        .index-tab {
          position: absolute;
          top: 34px;
          right: -15px;
          width: 32px;
          height: 42px;
          background: linear-gradient(135deg, #F0BC49, #8a6435);
          border: 1px solid #6e4b26;
          border-radius: 0 6px 6px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 17px;
          color: #fff8ec;
          box-shadow: 2px 2px 6px rgba(0,0,0,0.35);
          z-index: 2;
          pointer-events: none;
        }
        .answer-stamp {
          position: absolute;
          top: 8px;
          right: 10px;
          width: 46px;
          height: 46px;
          border: 2px dashed rgba(196,134,15,0.55);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-14deg);
          color: rgba(196,134,15,0.85);
        }

        .word-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .word-display {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 42px;
          color: #2a1c0e;
          line-height: 1;
        }

        .pos-tag {
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #2f4f3e;
          background: #dbe6dc;
          border: 1px solid #9cb5a3;
          border-radius: 3px;
          padding: 3px 8px;
        }

        .ipa-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 0 18px 0;
        }

        .ipa-mono {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 15px;
          color: #5a4626;
        }

        .speaker-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #E3A72E;
          color: #fff8ec;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        }
        .speaker-btn:hover { background: #C4860F; }
        .speaker-btn:focus-visible { outline: 2px solid #2a1c0e; outline-offset: 2px; }
        .speaker-btn.playing::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #E3A72E;
          animation: ripple 0.9s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .speaker-btn.playing::after { animation: none; }
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .speaker-btn.small {
          width: 27px;
          height: 27px;
        }

        .divider-dashed {
          border: none;
          border-top: 1.5px dashed #b8a578;
          margin: 16px 0;
        }

        .meaning-block { margin-bottom: 4px; }
        .section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #8a6f45;
          margin: 0 0 6px 0;
        }
        .meaning-text {
          font-size: 22px;
          font-weight: 700;
          color: #2a1c0e;
        }

        .example-block { margin-top: 4px; }
        .example-en-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }
        .example-en {
          font-size: 16.5px;
          color: #2a2420;
          font-style: italic;
          line-height: 1.5;
        }
        .example-ko {
          font-size: 14.5px;
          color: #5a4a34;
          line-height: 1.5;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b5638;
        }

        .form-panel {
          background: #f3e8cf;
          border: 1px solid #E3A72E;
          border-radius: 6px;
          padding: 16px 18px;
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .form-panel h3 {
          font-family: 'Fraunces', serif;
          margin: 0 0 4px 0;
          font-size: 17px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .form-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .form-panel input, .form-panel select, .form-panel textarea {
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 13.5px;
          padding: 8px 10px;
          border-radius: 4px;
          border: 1px solid #b8a578;
          background: #fffaf0;
          color: #2a2420;
          outline: none;
          flex: 1 1 160px;
        }
        .form-panel input:focus-visible, .form-panel select:focus-visible, .form-panel textarea:focus-visible {
          box-shadow: 0 0 0 3px rgba(227,167,46,0.4);
        }
        .form-panel textarea { min-height: 44px; resize: vertical; width: 100%; }
        .form-submit {
          align-self: flex-start;
          background: #2f4f3e;
          color: #f0e6d2;
          border: none;
          padding: 9px 16px;
          border-radius: 5px;
          font-size: 13.5px;
          cursor: pointer;
        }
        .form-submit:hover { background: #24402f; }
        .form-submit:disabled { opacity: 0.7; cursor: default; }
        .form-cancel {
          align-self: flex-start;
          background: transparent;
          color: #6b5638;
          border: 1px solid #b8a578;
          padding: 9px 16px;
          border-radius: 5px;
          font-size: 13.5px;
          cursor: pointer;
        }
        .form-cancel:hover { background: rgba(0,0,0,0.04); }
        .edit-actions { display: flex; gap: 8px; }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b4a26;
        }

        .save-note {
          font-size: 11.5px;
          color: #e8c9a0;
          margin-top: 8px;
          text-align: center;
        }
      `}</style>

      <div className="header-plaque wide">
        <div className="header-title">
          <BookOpen size={26} color="#2a1c0e" strokeWidth={2} />
          <div>
            <h1>낱말장</h1>
            <p>단어로 외우고, 문장으로 말하기를 연습하세요.</p>
          </div>
        </div>
        <div className="search-wrap" style={{ gap: 8 }}>
          <button
            type="button"
            className="slideshow-toggle"
            onClick={() => setShowReview(true)}
            disabled={words.length === 0}
          >
            <Layers size={15} />
            오늘의 복습 (5개)
          </button>
          <button
            type="button"
            className="slideshow-toggle"
            onClick={() => setShowQuiz(true)}
            disabled={words.length < 4}
          >
            <Layers size={15} />
            퀴즈 풀기
          </button>
          <button
            type="button"
            className="slideshow-toggle"
            onClick={() => setShowSlides(true)}
            disabled={words.length === 0}
          >
            <Layers size={15} />
            슬라이드로 보기
          </button>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="단어 또는 뜻 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!isAdmin && (
        <p style={{ maxWidth: 980, margin: "0 auto 14px", fontSize: 12.5, color: "#8a6f45", textAlign: "center" }}>
          이 카드는 운영자가 관리해요. 조회와 복습만 가능해요.
        </p>
      )}

      {needsSetup && <SupabaseSetupNotice />}

      {showQuiz && <QuizModal items={words} onClose={() => setShowQuiz(false)} />}

      {showReview && (
        <SlideshowModal
          title="오늘의 복습"
          items={[...words].sort(() => Math.random() - 0.5).slice(0, 5)}
          onClose={() => setShowReview(false)}
          renderItem={(w) => (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: "#2a1c0e" }}>{w.word}</strong>
                <button
                  className="speaker-btn"
                  onClick={() => speak(w.word, w.id)}
                  aria-label="발음 듣기"
                  style={{ width: 30, height: 30 }}
                >
                  <Volume2 size={14} />
                </button>
              </div>
              {w.ipa && <span style={{ color: "#8a6f45", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{w.ipa}</span>}
              <span style={{ color: "#5a4a34", fontSize: 15, fontWeight: 600 }}>{w.meaning}</span>
              <span style={{ color: "#5a4a34", fontSize: 14, lineHeight: 1.6 }}>{w.example}</span>
              {w.exampleKo && <span style={{ color: "#8a7150", fontSize: 13 }}>{w.exampleKo}</span>}
            </>
          )}
        />
      )}

      {showSlides && (
        <SlideshowModal
          title="낱말장 슬라이드"
          items={words}
          onClose={() => setShowSlides(false)}
          renderItem={(w) => (
            <>
              <span className="card-number">No. {String(words.findIndex((x) => x.id === w.id) + 1).padStart(3, "0")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: "#2a1c0e" }}>{w.word}</strong>
                <button
                  className="speaker-btn"
                  onClick={() => speak(w.word, w.id)}
                  aria-label="발음 듣기"
                  style={{ width: 30, height: 30 }}
                >
                  <Volume2 size={14} />
                </button>
              </div>
              {w.ipa && <span style={{ color: "#8a6f45", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{w.ipa}</span>}
              <span style={{ color: "#5a4a34", fontSize: 15, fontWeight: 600 }}>{w.meaning}</span>
              <span style={{ color: "#5a4a34", fontSize: 14, lineHeight: 1.6 }}>{w.example}</span>
              {w.exampleKo && <span style={{ color: "#8a7150", fontSize: 13 }}>{w.exampleKo}</span>}
            </>
          )}
        />
      )}

      <div className="main-grid">
        <div className="drawer">
          <div className="drawer-label">서랍 · {words.length}개 단어</div>
          {allTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  style={{
                    fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "4px 9px", cursor: "pointer",
                    border: activeTag === t ? "1px solid #E3A72E" : "1px solid transparent",
                    background: activeTag === t ? "#E3A72E" : "rgba(255,255,255,0.06)",
                    color: activeTag === t ? "#2a1c0e" : "#ecdcc0",
                  }}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
          <ul className="drawer-list">
            {filtered.map((w, idx) => (
              <li key={w.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`drawer-item ${w.id === selectedId ? "active" : ""}`}
                  onClick={() => {
                    setSelectedId(w.id);
                    setIsEditing(false);
                    setIsFlipped(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(w.id);
                      setIsEditing(false);
                      setIsFlipped(false);
                    }
                  }}
                >
                  <span className="drawer-item-text">
                    <span className="drawer-item-num">{idx + 1}.</span>
                    {w.word}
                  </span>
                  <span className="meaning-hint">{w.meaning}</span>
                </div>
              </li>
            ))}
            {filtered.length === 0 && words.length === 0 && (
              <div style={{ color: "#e0c9a4", fontSize: 13, padding: "10px 6px" }}>
                아직 추가된 단어가 없어요.
                <br />
                아래에서 첫 단어를 추가해보세요.
              </div>
            )}
            {filtered.length === 0 && words.length > 0 && (
              <div style={{ color: "#e0c9a4", fontSize: 13, padding: "10px 6px" }}>
                검색 결과가 없습니다.
              </div>
            )}
          </ul>

          {isAdmin && (
            <button className="add-toggle" onClick={() => setShowAddForm((s) => !s)}>
              {showAddForm ? <X size={15} /> : <Plus size={15} />}
              {showAddForm ? "취소" : "새 단어 추가"}
            </button>
          )}

          {isAdmin && showAddForm && (
            <form className="form-panel" onSubmit={handleAdd}>
              <h3>새 단어</h3>
              <div className="form-row">
                <input
                  placeholder="단어 (예: apple)"
                  value={form.word}
                  onChange={handleFormChange("word")}
                  required
                />
                <select value={form.pos} onChange={handleFormChange("pos")}>
                  <option value="명사">명사</option>
                  <option value="동사">동사</option>
                  <option value="형용사">형용사</option>
                  <option value="부사">부사</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <input
                placeholder="발음 기호 (예: /ˈæp.əl/) — 선택 사항"
                value={form.ipa}
                onChange={handleFormChange("ipa")}
              />
              <input
                placeholder="뜻 (예: 사과)"
                value={form.meaning}
                onChange={handleFormChange("meaning")}
                required
              />
              <textarea
                placeholder="예문 (영어)"
                value={form.example}
                onChange={handleFormChange("example")}
                required
              />
              <textarea
                placeholder="예문 번역 (한국어)"
                value={form.exampleKo}
                onChange={handleFormChange("exampleKo")}
              />
              <input
                placeholder="태그 (쉼표로 구분, 예: 여행, 음식)"
                value={form.tags}
                onChange={handleFormChange("tags")}
              />
              <button type="submit" className="form-submit">
                카드 추가하기
              </button>
            </form>
          )}
          <Toast message={toastMsg?.text} kind={toastMsg?.kind} onDismiss={() => setToastMsg(null)} />
        </div>

        <div className="card-area">
          {!loaded ? (
            <div className="empty-state">불러오는 중…</div>
          ) : selected ? (
            <div className="card-wrap">
              <span className="ring top" aria-hidden="true" />
              <span className="ring bottom" aria-hidden="true" />
              <span className="index-tab" aria-hidden="true">
                {selected.word ? selected.word[0].toUpperCase() : "?"}
              </span>

              <div className="card-top-row">
                <span className="card-number">
                  No. {String(selectedIndex + 1).padStart(3, "0")}
                </span>
                <div className="card-top-actions">
                  {isAdmin && (
                    <button
                      className="fav-btn"
                      onClick={() => toggleFavorite(selected.id)}
                      aria-label="즐겨찾기"
                      aria-pressed={!!selected.favorite}
                    >
                      <Star
                        size={18}
                        fill={selected.favorite ? "#E3A72E" : "none"}
                      />
                    </button>
                  )}
                  {isAdmin && !isEditing && (
                    <button
                      className="edit-btn"
                      onClick={startEditing}
                      aria-label="단어 수정"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className="delete-word-btn"
                      onClick={() => handleDeleteWord(selected.id)}
                      aria-label="단어 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <form className="form-panel" onSubmit={saveEdit} style={{ marginTop: 8 }}>
                  <h3>단어 수정</h3>
                  <div className="form-row">
                    <input
                      placeholder="단어"
                      value={editForm.word}
                      onChange={handleEditFormChange("word")}
                      required
                    />
                    <select value={editForm.pos} onChange={handleEditFormChange("pos")}>
                      <option value="명사">명사</option>
                      <option value="동사">동사</option>
                      <option value="형용사">형용사</option>
                      <option value="부사">부사</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <input
                    placeholder="발음 기호 — 선택 사항"
                    value={editForm.ipa}
                    onChange={handleEditFormChange("ipa")}
                  />
                  <input
                    placeholder="뜻"
                    value={editForm.meaning}
                    onChange={handleEditFormChange("meaning")}
                    required
                  />
                  <textarea
                    placeholder="예문 (영어)"
                    value={editForm.example}
                    onChange={handleEditFormChange("example")}
                    required
                  />
                  <textarea
                    placeholder="예문 번역 (한국어)"
                    value={editForm.exampleKo}
                    onChange={handleEditFormChange("exampleKo")}
                  />
                  <input
                    placeholder="태그 (쉼표로 구분, 예: 여행, 음식)"
                    value={editForm.tags}
                    onChange={handleEditFormChange("tags")}
                  />
                  <div className="edit-actions">
                    <button type="submit" className="form-submit" disabled={savingEdit}>
                      {savingEdit ? "저장 중…" : "저장하기"}
                    </button>
                    <button type="button" className="form-cancel" onClick={cancelEditing}>
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  className="flashcard-outer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsFlipped((f) => !f)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsFlipped((f) => !f);
                    }
                  }}
                  aria-label="카드를 클릭하면 뒤집혀요"
                >
                  <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
                    <div className="flashcard-face flashcard-front">
                      <div className="word-row">
                        <span className="word-display">{selected.word}</span>
                        <span className="pos-tag">{selected.pos}</span>
                      </div>

                      <div className="ipa-row">
                        {selected.ipa && <span className="ipa-mono">{selected.ipa}</span>}
                        <button
                          className={`speaker-btn ${speakingId === "word" ? "playing" : ""}`}
                          onClick={(e) => { e.stopPropagation(); speak(selected.word, "word"); }}
                          aria-label={`${selected.word} 발음 듣기`}
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                      {parseTags(selected.tags).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                          {parseTags(selected.tags).map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: 11.5, fontWeight: 600, color: "#6b5638", background: "#f0e6d2",
                                border: "1px solid #F0E6C8", borderRadius: 999, padding: "3px 9px",
                              }}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="flip-hint">탭하면 뜻이 나와요</p>
                    </div>

                    <div className="flashcard-face flashcard-back">
                      <div className="answer-stamp" aria-hidden="true"><Check size={20} /></div>
                      <div className="meaning-block">
                        <p className="section-label">뜻</p>
                        <p className="meaning-text">{selected.meaning}</p>
                      </div>

                      <hr className="divider-dashed" />

                      <div className="example-block">
                        <p className="section-label">예문</p>
                        <div className="example-en-row">
                          <p className="example-en">"{selected.example}"</p>
                          <button
                            className={`speaker-btn small ${speakingId === "example" ? "playing" : ""}`}
                            onClick={(e) => { e.stopPropagation(); speak(selected.example, "example"); }}
                            aria-label="예문 발음 듣기"
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                        {selected.exampleKo && (
                          <p className="example-ko">{selected.exampleKo}</p>
                        )}
                      </div>
                      <p className="flip-hint">탭하면 단어로 돌아가요</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : words.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={30} color="#6b5638" style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 15 }}>
                아직 저장된 단어가 없어요.
                <br />
                왼쪽의 "새 단어 추가" 버튼으로 첫 카드를 만들어보세요.
              </p>
            </div>
          ) : (
            <div className="empty-state">왼쪽 서랍에서 단어를 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}


function mapReadingWordRow(r) {
  return {
    id: r.id,
    word: r.word,
    reading: r.reading,
    meaning: r.meaning,
    example: r.example,
    example_ko: r.example_ko,
    favorite: !!r.favorite,
  };
}

const EMPTY_READING_WORD_FORM = { word: "", reading: "", meaning: "", example: "", example_ko: "" };
const EMPTY_SENTENCE_FORM = { sentence: "", translation: "" };

// ── 단어 카드 페이지 (일본어/스페인어 등에서 공용으로 재사용) ──
function WordCardsPage({ config, session, isAdmin }) {
  const {
    table, ttsLang, icon: Icon, title, subtitle,
    wordPh, readingLabel, readingPh, meaningPh, examplePh,
  } = config;

  const [words, setWords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_READING_WORD_FORM);
  const [speakingId, setSpeakingId] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_READING_WORD_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await supabaseRequest(table, { query: "?select=*&order=created_at.asc" });
        if (!cancelled && Array.isArray(rows)) {
          const mapped = rows.map(mapReadingWordRow);
          setWords(mapped);
          if (mapped.length > 0) setSelectedId(mapped[0].id);
        }
      } catch (e) {
        if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [table]);

  const speak = (text, id) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = ttsLang;
    utter.rate = 0.85;
    utter.onstart = () => setSpeakingId(id);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
  };

  const filtered = words.filter((w) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (w.word || "").toLowerCase().includes(q) ||
      (w.meaning || "").toLowerCase().includes(q)
    );
  });

  const selected = words.find((w) => w.id === selectedId) || words[0];
  const selectedIndex = words.findIndex((w) => w.id === selectedId);

  const handleFormChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim() || !form.example.trim()) return;
    try {
      const rows = await supabaseRequest(table, {
        method: "POST",
        accessToken: session?.access_token,
        body: {
          word: form.word, reading: form.reading, meaning: form.meaning,
          example: form.example, example_ko: form.example_ko,
        },
      });
      const newWord = mapReadingWordRow(rows[0]);
      setWords((w) => [...w, newWord]);
      setSelectedId(newWord.id);
      setForm(EMPTY_READING_WORD_FORM);
      setShowAddForm(false);
      setSaveError(false);
      setNeedsSetup(false);
    } catch (e) {
      if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      else setSaveError(true);
    }
  };

  const toggleFavorite = async (id) => {
    const current = words.find((w) => w.id === id);
    if (!current) return;
    const nextValue = !current.favorite;
    setWords((ws) => ws.map((w) => (w.id === id ? { ...w, favorite: nextValue } : w)));
    try {
      await supabaseRequest(table, { method: "PATCH", query: `?id=eq.${id}`, accessToken: session?.access_token, body: { favorite: nextValue } });
    } catch (e) {
      setWords((ws) => ws.map((w) => (w.id === id ? { ...w, favorite: !nextValue } : w)));
      setSaveError(true);
    }
  };

  const handleDeleteWord = async (id) => {
    if (!window.confirm("이 단어 카드를 삭제할까요?")) return;
    const prevWords = words;
    const remaining = words.filter((w) => w.id !== id);
    setWords(remaining);
    if (selectedId === id) setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    setIsEditing(false);
    try {
      await supabaseRequest(table, { method: "DELETE", query: `?id=eq.${id}`, accessToken: session?.access_token });
    } catch (e) {
      setWords(prevWords);
      setSaveError(true);
    }
  };

  const startEditing = () => {
    if (!selected) return;
    setEditForm({
      word: selected.word, reading: selected.reading || "", meaning: selected.meaning,
      example: selected.example, example_ko: selected.example_ko || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const handleEditFormChange = (field) => (e) => setEditForm((f) => ({ ...f, [field]: e.target.value }));

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!editForm.word.trim() || !editForm.meaning.trim() || !editForm.example.trim()) return;
    setSavingEdit(true);
    try {
      const rows = await supabaseRequest(table, {
        method: "PATCH",
        query: `?id=eq.${selected.id}`,
        accessToken: session?.access_token,
        body: {
          word: editForm.word, reading: editForm.reading, meaning: editForm.meaning,
          example: editForm.example, example_ko: editForm.example_ko,
        },
      });
      const updated = mapReadingWordRow(rows[0]);
      setWords((ws) => ws.map((w) => (w.id === updated.id ? updated : w)));
      setIsEditing(false);
      setSaveError(false);
    } catch (e) {
      if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      else setSaveError(true);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .shell {
          min-height: 100vh;
          background:
            repeating-linear-gradient(100deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 5px),
            linear-gradient(160deg, #FFFCF4 0%, #FFF8E8 55%, #FFFDF6 100%);
          font-family: 'Noto Sans KR', sans-serif; color: #2a2420; padding: 20px;
        }
        .header-plaque.wide {
          max-width: 980px; margin: 0 auto 18px auto; display: flex; align-items: center;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
          background: linear-gradient(180deg, #F0BC49, #E3A72E);
          border: 1px solid #D9C79A; border-radius: 6px; padding: 14px 20px;
          box-shadow: 0 3px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.35);
        }
        .header-title { display: flex; align-items: center; gap: 10px; }
        .header-title h1 { font-family: 'Fraunces', serif; font-weight: 700; font-size: 26px; color: #2a1c0e; margin: 0; }
        .header-title p { margin: 2px 0 0 0; font-size: 12.5px; color: #4a3418; font-weight: 500; }
        .search-wrap { position: relative; display: flex; align-items: center; gap: 8px; }
        .review-toggle {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Noto Sans KR', sans-serif; font-size: 13px; font-weight: 600;
          color: #2a1c0e; background: #f0e0c2; border: 1px solid #D9C79A;
          border-radius: 5px; padding: 8px 14px; cursor: pointer; white-space: nowrap;
        }
        .review-toggle:hover { background: #fff4dd; }
        .review-toggle:disabled { opacity: 0.5; cursor: default; }
        .review-toggle:focus-visible { outline: 2px solid #2a1c0e; outline-offset: 2px; }
        .search-input {
          font-family: 'Noto Sans KR', sans-serif; background: #f3e8cf; border: 1px solid #D9C79A;
          border-radius: 5px; padding: 9px 12px 9px 34px; font-size: 14px; color: #2a2420;
          width: 220px; outline: none;
        }
        .search-input:focus-visible { box-shadow: 0 0 0 3px rgba(227,167,46,0.6); }
        .search-icon { position: absolute; left: 10px; color: #6b4a26; }
        .main-grid { max-width: 980px; margin: 0 auto; display: flex; gap: 18px; align-items: flex-start; }
        @media (max-width: 760px) { .main-grid { flex-direction: column; } }
        .drawer {
          flex: 0 0 240px; background: linear-gradient(180deg, #FDF8EC, #FDF8EC);
          border: 1px solid #F0E6C8; border-radius: 8px; padding: 12px;
          box-shadow: inset 0 0 0 1px rgba(227,167,46,0.06), 0 6px 16px rgba(0,0,0,0.3);
        }
        @media (max-width: 760px) { .drawer { flex: 1 1 auto; width: 100%; } }
        .drawer-label {
          font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 1.5px;
          text-transform: uppercase; color: #8a6f45; margin: 2px 4px 10px 4px;
        }
        .drawer-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 420px; overflow-y: auto; }
        .drawer-item {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 9px 12px; border-radius: 5px; background: rgba(227,167,46,0.06);
          border: 1px solid transparent; cursor: pointer; color: #6b5638; font-size: 14px;
          font-family: 'Noto Sans JP', 'Noto Sans KR', sans-serif;
        }
        .drawer-item:hover { background: rgba(227,167,46,0.14); }
        .drawer-item.active { background: #f0e6d2; color: #2a2420; border-color: #E3A72E; font-weight: 600; }
        .drawer-item .meaning-hint { font-size: 11.5px; opacity: 0.75; }
        .drawer-item-text { display: flex; align-items: baseline; gap: 5px; min-width: 0; }
        .drawer-item-num { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8a6f45; opacity: 0.7; flex-shrink: 0; }
        .drawer-item.active .drawer-item-num { color: #8a6f45; }
        .drawer-item:focus-visible { outline: 2px solid #e0b978; outline-offset: 2px; }
        .add-toggle {
          margin-top: 10px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px 10px; border-radius: 5px; border: 1px dashed #8a6f45; background: transparent;
          color: #f0e0c2; font-size: 13px; cursor: pointer;
        }
        .add-toggle:hover { background: rgba(227,167,46,0.10); }
        .card-area { flex: 1 1 auto; min-width: 0; }
        .card-wrap {
          position: relative; background: #FFFFFF; border-radius: 6px; padding: 30px 32px 26px 46px;
          transform: rotate(-0.4deg); box-shadow: 0 2px 0 rgba(0,0,0,0.15), 0 14px 30px rgba(0,0,0,0.35);
          border: 1px solid #F0E6C8; transition: transform 0.2s ease;
          background-image: repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(120,90,50,0.08) 28px);
        }
        .card-wrap:hover { transform: rotate(0deg); }
        .ring {
          position: absolute; left: 14px; width: 15px; height: 15px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #f6f1e6, #b7a37c 70%, #8d7a54);
          border: 1px solid #6e5c3a;
        }
        .ring.top { top: 22px; } .ring.bottom { bottom: 22px; }
        .card-top-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }
        .card-number { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8a6f45; letter-spacing: 1px; }
        .card-top-actions { display: flex; align-items: center; gap: 10px; }
        .fav-btn, .edit-btn, .delete-word-btn, .delete-btn { background: none; border: none; cursor: pointer; color: #E3A72E; padding: 2px; }
        .edit-btn { color: #6b5638; }
        .edit-btn:hover { color: #2a1c0e; }
        .delete-word-btn, .delete-btn { color: #C4860F; }
        .delete-word-btn:hover, .delete-btn:hover { color: #7a3b2a; }
        .fav-btn:focus-visible, .edit-btn:focus-visible, .delete-word-btn:focus-visible, .delete-btn:focus-visible { outline: 2px solid #E3A72E; outline-offset: 2px; }

        .flashcard-outer {
          perspective: 1400px;
          cursor: pointer;
          min-height: 280px;
          outline: none;
        }
        .flashcard-outer:focus-visible .flashcard-face {
          outline: 2px solid #E3A72E;
          outline-offset: 3px;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          min-height: 280px;
          transition: transform 0.6s cubic-bezier(0.4, 0.15, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flashcard-inner.flipped { transform: rotateY(180deg); }
        @media (prefers-reduced-motion: reduce) {
          .flashcard-inner { transition: none; }
        }
        .flashcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .flashcard-front { align-items: flex-start; }
        .flashcard-back {
          transform: rotateY(180deg);
          justify-content: flex-start;
          align-items: flex-start;
          padding: 18px 20px 10px 4px;
          background: linear-gradient(160deg, #FCF4DE 0%, #F7E9C4 100%);
          border-radius: 4px;
          box-shadow: inset 0 0 0 1px rgba(227,167,46,0.35);
        }
        .flashcard-back .section-label { color: #C4860F; }
        .flashcard-back .meaning-text { color: #221C12; }
        .flashcard-back .example-en { color: #4a3418; }
        .flashcard-back .example-ko { color: #6b5638; }
        .flashcard-back .divider-dashed { border-top-color: rgba(196,134,15,0.35); }
        .flashcard-back .speaker-btn { background: #E3A72E; color: #221C12; }
        .flashcard-back .speaker-btn:hover { background: #C4860F; }
        .flip-hint {
          margin: 18px 0 0 0;
          font-size: 11.5px;
          color: #8a6f45;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: 0.5px;
        }
        .flashcard-back .flip-hint { color: #8a6f45; }

        .index-tab {
          position: absolute;
          top: 34px;
          right: -15px;
          width: 32px;
          height: 42px;
          background: linear-gradient(135deg, #F0BC49, #8a6435);
          border: 1px solid #6e4b26;
          border-radius: 0 6px 6px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 17px;
          color: #fff8ec;
          box-shadow: 2px 2px 6px rgba(0,0,0,0.35);
          z-index: 2;
          pointer-events: none;
        }
        .answer-stamp {
          position: absolute;
          top: 8px;
          right: 10px;
          width: 46px;
          height: 46px;
          border: 2px dashed rgba(196,134,15,0.55);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-14deg);
          color: rgba(196,134,15,0.85);
        }
        .word-row { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
        .word-display { font-family: 'Noto Sans JP', serif; font-weight: 700; font-size: 42px; color: #2a1c0e; line-height: 1; }
        .reading-tag {
          font-family: 'Noto Sans JP', sans-serif; font-size: 13px; font-weight: 500; color: #2f4f3e;
          background: #dbe6dc; border: 1px solid #9cb5a3; border-radius: 3px; padding: 3px 8px;
        }
        .ipa-row { display: flex; align-items: center; gap: 10px; margin: 8px 0 18px 0; }
        .speaker-btn {
          position: relative; display: inline-flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%; background: #E3A72E; color: #fff8ec;
          border: none; cursor: pointer; flex-shrink: 0;
        }
        .speaker-btn:hover { background: #C4860F; }
        .speaker-btn:focus-visible { outline: 2px solid #2a1c0e; outline-offset: 2px; }
        .speaker-btn.playing::after {
          content: ""; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #E3A72E;
          animation: ripple 0.9s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) { .speaker-btn.playing::after { animation: none; } }
        @keyframes ripple { 0% { transform: scale(0.8); opacity: 0.9; } 100% { transform: scale(1.6); opacity: 0; } }
        .speaker-btn.small { width: 27px; height: 27px; }
        .divider-dashed { border: none; border-top: 1.5px dashed #b8a578; margin: 16px 0; }
        .meaning-block { margin-bottom: 4px; }
        .section-label {
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 1.5px;
          text-transform: uppercase; color: #8a6f45; margin: 0 0 6px 0;
        }
        .meaning-text { font-size: 22px; font-weight: 700; color: #2a1c0e; }
        .example-block { margin-top: 4px; }
        .example-en-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
        .example-en { font-family: 'Noto Sans JP', sans-serif; font-size: 16.5px; color: #2a2420; line-height: 1.6; }
        .example-ko { font-size: 14.5px; color: #5a4a34; line-height: 1.5; }
        .empty-state { text-align: center; padding: 60px 20px; color: #6b5638; }
        .form-panel {
          background: #f3e8cf; border: 1px solid #E3A72E; border-radius: 6px; padding: 16px 18px;
          margin-top: 14px; display: flex; flex-direction: column; gap: 10px;
        }
        .form-panel h3 { font-family: 'Fraunces', serif; margin: 0 0 4px 0; font-size: 17px; }
        .form-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .form-panel input, .form-panel select, .form-panel textarea {
          font-family: 'Noto Sans KR', sans-serif; font-size: 13.5px; padding: 8px 10px; border-radius: 4px;
          border: 1px solid #b8a578; background: #fffaf0; color: #2a2420; outline: none; flex: 1 1 160px;
        }
        .form-panel input:focus-visible, .form-panel select:focus-visible, .form-panel textarea:focus-visible { box-shadow: 0 0 0 3px rgba(227,167,46,0.4); }
        .form-panel textarea { min-height: 44px; resize: vertical; width: 100%; }
        .form-submit {
          align-self: flex-start; display: flex; align-items: center; gap: 6px; background: #2f4f3e;
          color: #f0e6d2; border: none; padding: 9px 16px; border-radius: 5px; font-size: 13.5px; cursor: pointer;
        }
        .form-submit:hover { background: #24402f; }
        .form-submit:disabled { opacity: 0.7; cursor: default; }
        .form-cancel {
          align-self: flex-start; background: transparent; color: #6b5638; border: 1px solid #b8a578;
          padding: 9px 16px; border-radius: 5px; font-size: 13.5px; cursor: pointer;
        }
        .form-cancel:hover { background: rgba(0,0,0,0.04); }
        .edit-actions { display: flex; gap: 8px; }
        .save-note { font-size: 11.5px; color: #e8c9a0; margin-top: 8px; text-align: center; }
      `}</style>

      <div className="header-plaque wide">
        <div className="header-title">
          <Icon size={26} color="#2a1c0e" strokeWidth={2} />
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="search-wrap">
          <button
            type="button"
            className="review-toggle"
            onClick={() => setShowReview(true)}
            disabled={words.length === 0}
          >
            <Layers size={15} />
            오늘의 복습 (5개)
          </button>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="단어 또는 뜻 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!isAdmin && (
        <p style={{ maxWidth: 980, margin: "0 auto 14px", fontSize: 12.5, color: "#8a6f45", textAlign: "center" }}>
          이 카드는 운영자가 관리해요. 조회만 가능해요.
        </p>
      )}

      {needsSetup && <SupabaseSetupNotice />}

      {showReview && (
        <SlideshowModal
          title="오늘의 복습"
          items={[...words].sort(() => Math.random() - 0.5).slice(0, 5)}
          onClose={() => setShowReview(false)}
          renderItem={(w) => (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong style={{ fontFamily: "'Noto Sans JP', serif", fontSize: 26, color: "#2a1c0e" }}>{w.word}</strong>
                <button
                  className="speaker-btn"
                  onClick={() => speak(w.word, w.id)}
                  aria-label="발음 듣기"
                  style={{ width: 30, height: 30 }}
                >
                  <Volume2 size={14} />
                </button>
              </div>
              {w.reading && <span style={{ color: "#8a6f45", fontFamily: "'Noto Sans JP', sans-serif", fontSize: 13 }}>{w.reading}</span>}
              <span style={{ color: "#5a4a34", fontSize: 15, fontWeight: 600 }}>{w.meaning}</span>
              <span style={{ color: "#5a4a34", fontSize: 14, lineHeight: 1.6 }}>{w.example}</span>
              {w.example_ko && <span style={{ color: "#8a7150", fontSize: 13 }}>{w.example_ko}</span>}
            </>
          )}
        />
      )}

      <div className="main-grid">
        <div className="drawer">
          <div className="drawer-label">서랍 · {words.length}개 단어</div>
          <ul className="drawer-list">
            {filtered.map((w, idx) => (
              <li key={w.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`drawer-item ${w.id === selectedId ? "active" : ""}`}
                  onClick={() => { setSelectedId(w.id); setIsEditing(false); setIsFlipped(false); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(w.id);
                      setIsEditing(false);
                      setIsFlipped(false);
                    }
                  }}
                >
                  <span className="drawer-item-text">
                    <span className="drawer-item-num">{idx + 1}.</span>
                    {w.word}
                  </span>
                  <span className="meaning-hint">{w.meaning}</span>
                </div>
              </li>
            ))}
            {filtered.length === 0 && words.length === 0 && (
              <div style={{ color: "#e0c9a4", fontSize: 13, padding: "10px 6px" }}>
                아직 추가된 단어가 없어요.
                <br />
                아래에서 첫 단어를 추가해보세요.
              </div>
            )}
            {filtered.length === 0 && words.length > 0 && (
              <div style={{ color: "#e0c9a4", fontSize: 13, padding: "10px 6px" }}>검색 결과가 없습니다.</div>
            )}
          </ul>

          {isAdmin && (
            <button className="add-toggle" onClick={() => setShowAddForm((s) => !s)}>
              {showAddForm ? <X size={15} /> : <Plus size={15} />}
              {showAddForm ? "취소" : "새 단어 추가"}
            </button>
          )}

          {isAdmin && showAddForm && (
            <form className="form-panel" onSubmit={handleAdd}>
              <h3>새 단어</h3>
              <input placeholder={wordPh} value={form.word} onChange={handleFormChange("word")} required />
              <input placeholder={readingPh} value={form.reading} onChange={handleFormChange("reading")} />
              <input placeholder={meaningPh} value={form.meaning} onChange={handleFormChange("meaning")} required />
              <textarea placeholder={examplePh} value={form.example} onChange={handleFormChange("example")} required />
              <textarea placeholder="예시 번역 (한국어)" value={form.example_ko} onChange={handleFormChange("example_ko")} />
              <button type="submit" className="form-submit">카드 추가하기</button>
            </form>
          )}
          <Toast message={saveError ? "저장에 실패했어요. 다시 시도해주세요." : null} kind="error" onDismiss={() => setSaveError(false)} />
        </div>

        <div className="card-area">
          {!loaded ? (
            <div className="empty-state">불러오는 중…</div>
          ) : selected ? (
            <div className="card-wrap">
              <span className="ring top" aria-hidden="true" />
              <span className="ring bottom" aria-hidden="true" />
              <span className="index-tab" aria-hidden="true">
                {selected.word ? selected.word[0].toUpperCase() : "?"}
              </span>

              <div className="card-top-row">
                <span className="card-number">No. {String(selectedIndex + 1).padStart(3, "0")}</span>
                <div className="card-top-actions">
                  {isAdmin && (
                    <button className="fav-btn" onClick={() => toggleFavorite(selected.id)} aria-label="즐겨찾기" aria-pressed={!!selected.favorite}>
                      <Star size={18} fill={selected.favorite ? "#E3A72E" : "none"} />
                    </button>
                  )}
                  {isAdmin && !isEditing && (
                    <button className="edit-btn" onClick={startEditing} aria-label="단어 수정">
                      <Pencil size={16} />
                    </button>
                  )}
                  {isAdmin && (
                    <button className="delete-word-btn" onClick={() => handleDeleteWord(selected.id)} aria-label="단어 삭제">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <form className="form-panel" onSubmit={saveEdit} style={{ marginTop: 8 }}>
                  <h3>단어 수정</h3>
                  <input placeholder={wordPh} value={editForm.word} onChange={handleEditFormChange("word")} required />
                  <input placeholder={readingPh} value={editForm.reading} onChange={handleEditFormChange("reading")} />
                  <input placeholder={meaningPh} value={editForm.meaning} onChange={handleEditFormChange("meaning")} required />
                  <textarea placeholder={examplePh} value={editForm.example} onChange={handleEditFormChange("example")} required />
                  <textarea placeholder="예시 번역 (한국어)" value={editForm.example_ko} onChange={handleEditFormChange("example_ko")} />
                  <div className="edit-actions">
                    <button type="submit" className="form-submit" disabled={savingEdit}>{savingEdit ? "저장 중…" : "저장하기"}</button>
                    <button type="button" className="form-cancel" onClick={cancelEditing}>취소</button>
                  </div>
                </form>
              ) : (
                <div
                  className="flashcard-outer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsFlipped((f) => !f)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsFlipped((f) => !f);
                    }
                  }}
                  aria-label="카드를 클릭하면 뒤집혀요"
                >
                  <div className={`flashcard-inner ${isFlipped ? "flipped" : ""}`}>
                    <div className="flashcard-face flashcard-front">
                      <div className="word-row">
                        <span className="word-display">{selected.word}</span>
                        {selected.reading && <span className="reading-tag">{selected.reading}</span>}
                      </div>
                      <div className="ipa-row">
                        <button
                          className={`speaker-btn ${speakingId === "word" ? "playing" : ""}`}
                          onClick={(e) => { e.stopPropagation(); speak(selected.word, "word"); }}
                          aria-label={`${selected.word} 발음 듣기`}
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                      <p className="flip-hint">탭하면 뜻이 나와요</p>
                    </div>

                    <div className="flashcard-face flashcard-back">
                      <div className="answer-stamp" aria-hidden="true"><Check size={20} /></div>
                      <div className="meaning-block">
                        <p className="section-label">뜻</p>
                        <p className="meaning-text">{selected.meaning}</p>
                      </div>

                      <hr className="divider-dashed" />

                      <div className="example-block">
                        <p className="section-label">예시</p>
                        <div className="example-en-row">
                          <p className="example-en">{selected.example}</p>
                          <button
                            className={`speaker-btn small ${speakingId === "example" ? "playing" : ""}`}
                            onClick={(e) => { e.stopPropagation(); speak(selected.example, "example"); }}
                            aria-label="예시 발음 듣기"
                          >
                            <Volume2 size={13} />
                          </button>
                        </div>
                        {selected.example_ko && <p className="example-ko">{selected.example_ko}</p>}
                      </div>
                      <p className="flip-hint">탭하면 단어로 돌아가요</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : words.length === 0 ? (
            <div className="empty-state">
              <Icon size={30} color="#6b5638" style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 15 }}>
                아직 저장된 단어가 없어요.
                <br />
                왼쪽의 "새 단어 추가" 버튼으로 첫 카드를 만들어보세요.
              </p>
            </div>
          ) : (
            <div className="empty-state">왼쪽 서랍에서 단어를 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 문장 연습 페이지 (일본어/스페인어 등에서 공용으로 재사용) ──
function SentencePracticePage({ config, session, isAdmin }) {
  const { table, ttsLang, icon: Icon, title, subtitle, sentencePh, translationPh } = config;

  const [sentences, setSentences] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(EMPTY_SENTENCE_FORM);
  const [saveError, setSaveError] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editTranslation, setEditTranslation] = useState("");
  const [savingEditId, setSavingEditId] = useState(null);
  const [showSlides, setShowSlides] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await supabaseRequest(table, { query: "?select=*&order=created_at.desc" });
        if (!cancelled && Array.isArray(rows)) setSentences(rows);
      } catch (e) {
        if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [table]);

  const speak = (text, id) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = ttsLang;
    utter.rate = 0.85;
    utter.onstart = () => setSpeakingId(id);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
  };

  const handleFormChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.sentence.trim()) return;
    try {
      const rows = await supabaseRequest(table, {
        method: "POST",
        accessToken: session?.access_token,
        body: { sentence: form.sentence.trim(), translation: form.translation.trim() || null },
      });
      setSentences((s) => [rows[0], ...s]);
      setForm(EMPTY_SENTENCE_FORM);
      setSaveError(false);
      setNeedsSetup(false);
    } catch (e) {
      if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      else setSaveError(true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 문장을 삭제할까요?")) return;
    const prev = sentences;
    setSentences((s) => s.filter((x) => x.id !== id));
    if (editingId === id) setEditingId(null);
    try {
      await supabaseRequest(table, { method: "DELETE", query: `?id=eq.${id}`, accessToken: session?.access_token });
    } catch (e) {
      setSentences(prev);
      setSaveError(true);
    }
  };

  const startEditing = (s) => {
    setEditingId(s.id);
    setEditText(s.sentence);
    setEditTranslation(s.translation || "");
  };

  const cancelEditing = () => setEditingId(null);

  const saveEdited = async (id) => {
    if (!editText.trim()) return;
    setSavingEditId(id);
    try {
      const rows = await supabaseRequest(table, {
        method: "PATCH",
        query: `?id=eq.${id}`,
        accessToken: session?.access_token,
        body: { sentence: editText.trim(), translation: editTranslation.trim() || null },
      });
      const updated = rows[0];
      setSentences((s) => s.map((x) => (x.id === id ? updated : x)));
      setEditingId(null);
      setSaveError(false);
    } catch (e) {
      if (e.message === "SUPABASE_NOT_CONFIGURED") setNeedsSetup(true);
      else setSaveError(true);
    } finally {
      setSavingEditId(null);
    }
  };

  return (
    <div className="shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Noto+Sans+KR:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .shell {
          min-height: 100vh;
          background:
            repeating-linear-gradient(100deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 5px),
            linear-gradient(160deg, #FFFCF4 0%, #FFF8E8 55%, #FFFDF6 100%);
          font-family: 'Noto Sans KR', sans-serif; color: #2a2420; padding: 20px;
        }
        .header-plaque {
          max-width: 760px; margin: 0 auto 18px auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          background: linear-gradient(180deg, #F0BC49, #E3A72E); border: 1px solid #D9C79A;
          border-radius: 6px; padding: 14px 20px; box-shadow: 0 3px 0 rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.35);
        }
        .header-plaque-title { display: flex; align-items: center; gap: 12px; }
        .header-plaque h1 { font-family: 'Fraunces', serif; font-weight: 700; font-size: 24px; color: #2a1c0e; margin: 0; }
        .header-plaque p { margin: 2px 0 0 0; font-size: 12.5px; color: #4a3418; font-weight: 500; }
        .slideshow-toggle {
          display: flex; align-items: center; gap: 6px; font-family: 'Noto Sans KR', sans-serif;
          font-size: 13px; font-weight: 600; color: #2a1c0e; background: #f0e0c2; border: 1px solid #D9C79A;
          border-radius: 5px; padding: 8px 14px; cursor: pointer; white-space: nowrap;
        }
        .slideshow-toggle:hover { background: #fff4dd; }
        .slideshow-toggle:disabled { opacity: 0.5; cursor: default; }
        .slideshow-toggle:focus-visible { outline: 2px solid #2a1c0e; outline-offset: 2px; }
        .sentence-number, .card-number {
          font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: #8a6f45; letter-spacing: 0.5px;
        }
        .content { max-width: 760px; margin: 0 auto; }
        .form-panel {
          background: #f3e8cf; border: 1px solid #E3A72E; border-radius: 6px; padding: 18px 20px;
          margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px;
        }
        .form-panel h3 { font-family: 'Fraunces', serif; margin: 0 0 4px 0; font-size: 17px; }
        .form-panel input, .form-panel textarea {
          font-family: 'Noto Sans KR', sans-serif; font-size: 13.5px; padding: 9px 11px; border-radius: 4px;
          border: 1px solid #b8a578; background: #fffaf0; color: #2a2420; outline: none; width: 100%;
        }
        .form-panel input:focus-visible, .form-panel textarea:focus-visible { box-shadow: 0 0 0 3px rgba(227,167,46,0.4); }
        .form-submit {
          align-self: flex-start; display: flex; align-items: center; gap: 6px; background: #2f4f3e;
          color: #f0e6d2; border: none; padding: 9px 16px; border-radius: 5px; font-size: 13.5px; cursor: pointer;
        }
        .form-submit:hover { background: #24402f; }
        .form-submit:disabled { opacity: 0.7; cursor: default; }
        .form-cancel {
          align-self: flex-start; background: transparent; color: #6b5638; border: 1px solid #b8a578;
          padding: 9px 16px; border-radius: 5px; font-size: 13.5px; cursor: pointer;
        }
        .form-cancel:hover { background: rgba(0,0,0,0.04); }
        .edit-actions { display: flex; gap: 8px; }
        .section-label {
          font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 1.5px;
          text-transform: uppercase; color: #8a6f45; margin: 0 0 6px 0;
        }
        .sentence-list { display: flex; flex-direction: column; gap: 14px; }
        .sentence-card {
          position: relative; background: #FFFFFF; border-radius: 6px; padding: 18px 22px;
          border: 1px solid #F0E6C8; box-shadow: 0 2px 0 rgba(0,0,0,0.15), 0 8px 18px rgba(0,0,0,0.3);
        }
        .sentence-top-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
        .sentence-top-actions { display: flex; align-items: center; gap: 8px; }
        .sentence-jp-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
        .sentence-jp { font-family: 'Noto Sans JP', sans-serif; font-size: 19px; color: #2a1c0e; line-height: 1.6; }
        .sentence-ko { font-size: 14.5px; color: #5a4a34; line-height: 1.5; }
        .delete-btn, .edit-btn { background: none; border: none; cursor: pointer; color: #C4860F; padding: 2px; }
        .edit-btn { color: #6b5638; }
        .edit-btn:hover { color: #2a1c0e; }
        .delete-btn:hover { color: #D9C79A; }
        .delete-btn:focus-visible, .edit-btn:focus-visible { outline: 2px solid #C4860F; outline-offset: 2px; }
        .speaker-btn {
          position: relative; display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 50%; background: #E3A72E; color: #fff8ec;
          border: none; cursor: pointer; flex-shrink: 0;
        }
        .speaker-btn:hover { background: #C4860F; }
        .speaker-btn:focus-visible { outline: 2px solid #2a1c0e; outline-offset: 2px; }
        .speaker-btn.playing::after {
          content: ""; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid #E3A72E;
          animation: ripple 0.9s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) { .speaker-btn.playing::after { animation: none; } }
        @keyframes ripple { 0% { transform: scale(0.8); opacity: 0.9; } 100% { transform: scale(1.6); opacity: 0; } }
        .empty-state { text-align: center; padding: 50px 20px; color: #6b5638; }
        .save-note { font-size: 11.5px; color: #e8c9a0; margin-top: 10px; text-align: center; }
      `}</style>

      <div className="header-plaque">
        <div className="header-plaque-title">
          <Icon size={24} color="#2a1c0e" strokeWidth={2} />
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="slideshow-toggle"
            onClick={() => setShowReview(true)}
            disabled={sentences.length === 0}
          >
            <Layers size={15} />
            오늘의 복습 (5개)
          </button>
          <button
            type="button"
            className="slideshow-toggle"
            onClick={() => setShowSlides(true)}
            disabled={sentences.length === 0}
          >
            <Layers size={15} />
            슬라이드로 보기
          </button>
        </div>
      </div>

      {showReview && (
        <SlideshowModal
          title="오늘의 복습"
          items={[...sentences].sort(() => Math.random() - 0.5).slice(0, 5)}
          onClose={() => setShowReview(false)}
          renderItem={(s) => (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <p className="sentence-jp" style={{ margin: 0 }}>{s.sentence}</p>
                <button
                  className="speaker-btn"
                  onClick={() => speak(s.sentence, s.id)}
                  aria-label="문장 발음 듣기"
                >
                  <Volume2 size={15} />
                </button>
              </div>
              {s.translation && <p className="sentence-ko" style={{ margin: 0 }}>{s.translation}</p>}
            </>
          )}
        />
      )}

      {showSlides && (
        <SlideshowModal
          title={`${title} 슬라이드`}
          items={sentences}
          onClose={() => setShowSlides(false)}
          renderItem={(s) => (
            <>
              <span className="card-number">No. {String(sentences.findIndex((x) => x.id === s.id) + 1).padStart(3, "0")}</span>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <p className="sentence-jp" style={{ margin: 0 }}>{s.sentence}</p>
                <button
                  className={`speaker-btn ${speakingId === s.id ? "playing" : ""}`}
                  onClick={() => speak(s.sentence, s.id)}
                  aria-label="문장 발음 듣기"
                >
                  <Volume2 size={15} />
                </button>
              </div>
              {s.translation && <p className="sentence-ko" style={{ margin: 0 }}>{s.translation}</p>}
            </>
          )}
        />
      )}

      <div className="content">
        {needsSetup && <SupabaseSetupNotice />}

        {!isAdmin && (
          <p style={{ fontSize: 12.5, color: "#8a6f45", textAlign: "center", marginBottom: 14 }}>
            이 문장은 운영자가 관리해요. 조회만 가능해요.
          </p>
        )}

        {isAdmin && (
          <form className="form-panel" onSubmit={handleAdd}>
            <h3>새 문장 추가</h3>
            <p className="section-label">문장 (1줄)</p>
            <input placeholder={sentencePh} value={form.sentence} onChange={handleFormChange("sentence")} required />
            <p className="section-label">번역</p>
            <input placeholder={translationPh} value={form.translation} onChange={handleFormChange("translation")} />
            <button type="submit" className="form-submit">
              <Plus size={15} />
              문장 추가하기
            </button>
          </form>
        )}

        {!loaded ? (
          <div className="empty-state">불러오는 중…</div>
        ) : sentences.length === 0 ? (
          <div className="empty-state">
            아직 저장된 문장이 없어요.
            <br />
            {isAdmin ? "위 입력창에 문장을 추가해보세요." : "곧 문장이 추가될 예정이에요."}
          </div>
        ) : (
          <div className="sentence-list">
            {sentences.map((s, idx) => (
              <div className="sentence-card" key={s.id}>
                <div className="sentence-top-row">
                  <span className="sentence-number">No. {String(idx + 1).padStart(3, "0")}</span>
                  {isAdmin && (
                    <div className="sentence-top-actions">
                      {editingId !== s.id && (
                        <button className="edit-btn" onClick={() => startEditing(s)} aria-label="수정">
                          <Pencil size={16} />
                        </button>
                      )}
                      <button className="delete-btn" onClick={() => handleDelete(s.id)} aria-label="삭제">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === s.id ? (
                  <div>
                    <p className="section-label">문장</p>
                    <input value={editText} onChange={(e) => setEditText(e.target.value)} style={{ marginBottom: 10 }} />
                    <p className="section-label">번역</p>
                    <input value={editTranslation} onChange={(e) => setEditTranslation(e.target.value)} style={{ marginBottom: 10 }} />
                    <div className="edit-actions">
                      <button className="form-submit" onClick={() => saveEdited(s.id)} disabled={savingEditId === s.id}>
                        <Check size={15} />
                        {savingEditId === s.id ? "저장 중…" : "저장하기"}
                      </button>
                      <button className="form-cancel" onClick={cancelEditing}>취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="sentence-jp-row">
                      <p className="sentence-jp">{s.sentence}</p>
                      <button
                        className={`speaker-btn ${speakingId === s.id ? "playing" : ""}`}
                        onClick={() => speak(s.sentence, s.id)}
                        aria-label="문장 발음 듣기"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                    {s.translation && <p className="sentence-ko">{s.translation}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <Toast message={saveError ? "저장에 실패했어요. 다시 시도해주세요." : null} kind="error" onDismiss={() => setSaveError(false)} />
      </div>
    </div>
  );
}

// ── 언어별 페이지 (설정만 다르게 넣어서 위 공용 컴포넌트를 재사용) ──
function EnglishSentencesPage({ session, isAdmin }) {
  return (
    <SentencePracticePage
      session={session}
      isAdmin={isAdmin}
      config={{
        table: "english_sentences",
        ttsLang: "en-US",
        icon: Volume2,
        title: "영어 문장",
        subtitle: "영어 문장 1줄과 번역으로 연습해요",
        sentencePh: "예: The weather is nice today.",
        translationPh: "예: 오늘 날씨가 좋네요.",
      }}
    />
  );
}

function JapaneseWordsPage({ session, isAdmin }) {
  return (
    <WordCardsPage
      session={session}
      isAdmin={isAdmin}
      config={{
        table: "japanese_words",
        ttsLang: "ja-JP",
        icon: Sparkles,
        title: "일본어 단어",
        subtitle: "카드로 배우는 일본어 단어 · 뜻 · 예시 · 발음",
        wordPh: "단어 (예: 猫)",
        readingPh: "읽는법 — 후리가나 (예: ねこ)",
        meaningPh: "뜻 (예: 고양이)",
        examplePh: "예시 (일본어)",
      }}
    />
  );
}

function JapaneseSentencesPage({ session, isAdmin }) {
  return (
    <SentencePracticePage
      session={session}
      isAdmin={isAdmin}
      config={{
        table: "japanese_sentences",
        ttsLang: "ja-JP",
        icon: Volume2,
        title: "일본어 문장",
        subtitle: "일본어 문장 1줄과 번역으로 연습해요",
        sentencePh: "예: 今日はいい天気ですね。",
        translationPh: "예: 오늘 날씨가 좋네요.",
      }}
    />
  );
}

function SpanishWordsPage({ session, isAdmin }) {
  return (
    <WordCardsPage
      session={session}
      isAdmin={isAdmin}
      config={{
        table: "spanish_words",
        ttsLang: "es-ES",
        icon: Sparkles,
        title: "스페인어 단어",
        subtitle: "카드로 배우는 스페인어 단어 · 뜻 · 예시 · 발음",
        wordPh: "단어 (예: gato)",
        readingPh: "발음 메모 — 선택 사항 (예: 가또)",
        meaningPh: "뜻 (예: 고양이)",
        examplePh: "예시 (스페인어)",
      }}
    />
  );
}

function SpanishSentencesPage({ session, isAdmin }) {
  return (
    <SentencePracticePage
      session={session}
      isAdmin={isAdmin}
      config={{
        table: "spanish_sentences",
        ttsLang: "es-ES",
        icon: Volume2,
        title: "스페인어 문장",
        subtitle: "스페인어 문장 1줄과 번역으로 연습해요",
        sentencePh: "예: Hace buen tiempo hoy.",
        translationPh: "예: 오늘 날씨가 좋네요.",
      }}
    />
  );
}


export default function App() {
  const [page, setPageState] = useState(getPageFromLocation);
  const [session, setSession] = useState(null);
  const [authModalMode, setAuthModalMode] = useState(null); // null | "login" | "signup"

  // 비밀번호 재설정 이메일 링크로 들어오면 #access_token=...&type=recovery 형태로 도착해요.
  const [recoveryToken, setRecoveryToken] = useState(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      return params.get("access_token");
    }
    return null;
  });

  const clearRecoveryHash = () => {
    setRecoveryToken(null);
    window.history.replaceState({}, "", PAGE_PATHS.home);
  };

  // URL도 같이 바꿔주는 페이지 이동 함수 — 기존에 setPage(id)로 부르던 모든 곳이
  // 코드 수정 없이 그대로 이 함수를 쓰게 돼요.
  const setPage = (id) => {
    setPageState(id);
    const path = PAGE_PATHS[id] || "/";
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  };

  // 브라우저 뒤로가기/앞으로가기 버튼 대응
  useEffect(() => {
    const onPopState = () => setPageState(getPageFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // 파비콘 + 탭 제목
  useEffect(() => {
    setAppFavicon();
  }, []);
  useEffect(() => {
    document.title = PAGE_TITLES[page] || "모두의 언어방";
  }, [page]);

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) setSession(stored);
  }, []);

  const isAdmin = !!session?.user?.email && session.user.email === ADMIN_EMAIL;

  const STUDY_PAGES = ["vocab", "enSentences", "jaWords", "jaSentences", "esWords", "esSentences"];
  useEffect(() => {
    if (STUDY_PAGES.includes(page)) logStudyVisit();
  }, [page]);

  // 관리자가 아닌 상태에서 admin 페이지로 남아있게 되면 홈으로 되돌려요.
  useEffect(() => {
    if (page === "admin" && !isAdmin) setPage("home");
  }, [page, isAdmin]);

  const handleAuthSuccess = (nextSession) => {
    setSession(nextSession);
    storeSession(nextSession);
    setAuthModalMode(null);
  };

  const handleLogout = async () => {
    await supabaseSignOut(session?.access_token);
    setSession(null);
    storeSession(null);
    setPage("home");
  };

  if (recoveryToken) {
    return <ResetPasswordPage accessToken={recoveryToken} onDone={clearRecoveryHash} />;
  }

  return (
    <div>
      <NavBar
        page={page}
        setPage={setPage}
        session={session}
        isAdmin={isAdmin}
        onLoginClick={() => setAuthModalMode("login")}
        onSignupClick={() => setAuthModalMode("signup")}
        onLogout={handleLogout}
      />
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
      {page === "home" && <Home setPage={setPage} />}
      {page === "search" && <GlobalSearchPage setPage={setPage} />}
      {page === "vocab" && <VocabCardCatalog session={session} isAdmin={isAdmin} />}
      {page === "enSentences" && <EnglishSentencesPage session={session} isAdmin={isAdmin} />}
      {page === "jaWords" && <JapaneseWordsPage session={session} isAdmin={isAdmin} />}
      {page === "jaSentences" && <JapaneseSentencesPage session={session} isAdmin={isAdmin} />}
      {page === "esWords" && <SpanishWordsPage session={session} isAdmin={isAdmin} />}
      {page === "esSentences" && <SpanishSentencesPage session={session} isAdmin={isAdmin} />}
      {page === "admin" && isAdmin && <AdminPage session={session} />}
      {page === "privacy" && <PrivacyPage setPage={setPage} />}

      {page !== "privacy" && (
        <footer
          style={{
            textAlign: "center", padding: "24px 20px", fontSize: 12, color: "#7C6D93",
            fontFamily: "'Pretendard Variable', 'Noto Sans KR', sans-serif",
          }}
        >
          <span role="button" tabIndex={0} onClick={() => setPage("privacy")} style={{ cursor: "pointer", textDecoration: "underline" }}>
            개인정보처리방침
          </span>
          {" · "}© 모두의 언어방
        </footer>
      )}
    </div>
  );
}
