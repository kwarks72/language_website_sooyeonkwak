import React, { useState, useEffect } from "react";

const SUPABASE_URL = "https://tbkcztqcnpvboqlihilo.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRia2N6dHFjbnB2Ym9xbGloaWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjIxMDksImV4cCI6MjEwMTgzODEwOX0.qUG9NckDYud-3H6VjAsV4iSC2AGcsCM_X8emkqTxG3c";

// 관리자로 인식할 이메일 주소예요. 본인 계정 이메일과 반드시 똑같아야 해요.
const ADMIN_EMAIL = "sooyeon0702@naver.com";

const AUTH_SESSION_KEY = "engstudy_auth_session";

async function supabaseRequest(table, { method = "GET", query = "", body, accessToken } = {}) {
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

async function supabaseAuthRequest(path, body) {
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

async function supabaseSignOut(accessToken) {
  if (!accessToken) return;
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
    // 저장 공간을 못 쓰는 환경이면 그냥 넘어가요.
  }
}

const EMPTY_FORM = {
  word: "",
  pos: "명사",
  ipa: "",
  meaning: "",
  example: "",
  exampleKo: "",
};

function AuthModal({ initialMode = "login", onClose, onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const data = await supabaseSignUp(email.trim(), password);
        if (data.access_token) {
          onAuthSuccess({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
          });
        } else {
          setInfoMsg("가입 완료! 이메일 인증 후 로그인해주세요.");
          setMode("login");
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
      setError(err.message || "요청에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(20,12,6,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fffcf4",
          border: "1px solid #d9c79a",
          borderRadius: 10,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 19, color: "#221c12" }}>
            {mode === "login" ? "로그인" : "회원가입"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, background: "#fcf4de", borderRadius: 6, padding: 4 }}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background: mode === "login" ? "#e3a72e" : "transparent",
              color: mode === "login" ? "#2a1c0e" : "#8a6f45",
            }}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              background: mode === "signup" ? "#e3a72e" : "transparent",
              color: mode === "signup" ? "#2a1c0e" : "#8a6f45",
            }}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "10px 12px", borderRadius: 5, border: "1px solid #b8a578" }}
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: "10px 12px", borderRadius: 5, border: "1px solid #b8a578" }}
          />
          {error && (
            <div style={{ fontSize: 12.5, color: "#dc3b26", background: "#fceae6", border: "1px solid #f3c4ba", borderRadius: 5, padding: "8px 10px" }}>
              {error}
            </div>
          )}
          {infoMsg && (
            <div style={{ fontSize: 12.5, color: "#149468", background: "#e4f4ec", border: "1px solid #bfe3d2", borderRadius: 5, padding: "8px 10px" }}>
              {infoMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: "#2f4f3e",
              color: "#f0e6d2",
              border: "none",
              padding: "11px 16px",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {submitting ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [currentLang, setCurrentLang] = useState("영어");
  const [currentTab, setCurrentTab] = useState("vocabulary");
  const [session, setSession] = useState(null);
  const [authModalMode, setAuthModalMode] = useState(null);
  const [vocabList, setVocabList] = useState([]);
  const [sentenceList, setSentenceList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) setSession(stored);
  }, []);

  useEffect(() => {
    const tableMap = {
      영어: { vocabulary: "vocab_words", sentences: "english_sentences" },
      일본어: { vocabulary: "japanese_words", sentences: "japanese_sentences" },
      스페인어: { vocabulary: "spanish_words", sentences: "spanish_sentences" },
    };
    const table = tableMap[currentLang][currentTab];
    if (currentTab === "vocabulary") {
      loadVocab(table);
    } else {
      loadSentences(table);
    }
  }, [currentLang, currentTab]);

  const loadVocab = async (tableName) => {
    setLoading(true);
    try {
      const rows = await supabaseRequest(tableName, { query: "?select=*&order=created_at.asc" });
      setVocabList(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      setVocabList([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSentences = async (tableName) => {
    setLoading(true);
    try {
      const rows = await supabaseRequest(tableName, { query: "?select=*&order=created_at.desc" });
      setSentenceList(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      setSentenceList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const getTableName = () => {
    const tableMap = {
      영어: { vocabulary: "vocab_words", sentences: "english_sentences" },
      일본어: { vocabulary: "japanese_words", sentences: "japanese_sentences" },
      스페인어: { vocabulary: "spanish_words", sentences: "spanish_sentences" },
    };
    return tableMap[currentLang][currentTab];
  };

  const handleAdd = async () => {
    if (!form.word) {
      alert("내용을 입력해주세요");
      return;
    }

    const tableName = getTableName();
    let body = {};

    if (currentTab === "vocabulary") {
      body = {
        word: form.word,
        pos: form.pos,
        ipa: form.ipa,
        meaning: form.meaning,
        example: form.example,
        example_ko: form.exampleKo,
      };
    } else {
      body = {
        sentence: form.word,
        translation: form.exampleKo || null,
      };
    }

    try {
      await supabaseRequest(tableName, {
        method: "POST",
        accessToken: session?.access_token,
        body,
      });
      alert("저장되었어요!");
      setForm(EMPTY_FORM);
      if (currentTab === "vocabulary") {
        loadVocab(tableName);
      } else {
        loadSentences(tableName);
      }
    } catch (e) {
      console.error(e);
      alert("저장에 실패했어요. 다시 시도해주세요.");
    }
  };

  const handleAuthSuccess = (nextSession) => {
    setSession(nextSession);
    storeSession(nextSession);
    setAuthModalMode(null);
  };

  const handleSignOut = async () => {
    await supabaseSignOut(session?.access_token);
    setSession(null);
    storeSession(null);
  };

  const isAdmin = !!session?.user?.email && session.user.email === ADMIN_EMAIL;
  const dataList = currentTab === "vocabulary" ? vocabList : sentenceList;

  return (
    <div style={{ fontFamily: "'Lora', serif", backgroundColor: "#f5f1e8", minHeight: "100vh" }}>
      {/* 헤더 */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          color: "#f5f1e8",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <button
            onClick={() => {
              setCurrentLang("영어");
              setCurrentTab("vocabulary");
            }}
            style={{ background: "none", border: "none", color: "#f5f1e8", fontSize: "16px", cursor: "pointer" }}
          >
            🏠 홈
          </button>
        </div>

        <select
          value={currentLang}
          onChange={(e) => setCurrentLang(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #999",
            backgroundColor: "#3a3a3a",
            color: "#f5f1e8",
          }}
        >
          <option value="영어">🗣️ 영어</option>
          <option value="일본어">🗣️ 일본어</option>
          <option value="스페인어">🗣️ 스페인어</option>
        </select>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {session ? (
            <>
              <span style={{ fontSize: "13px" }}>{session.user?.email}</span>
              <button
                onClick={handleSignOut}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#555",
                  color: "#f5f1e8",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setAuthModalMode("login")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "transparent",
                  border: "1px solid #666",
                  color: "#f5f1e8",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                로그인
              </button>
              <button
                onClick={() => setAuthModalMode("signup")}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#d4a574",
                  border: "none",
                  color: "#2a1c0e",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>

      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* 메인 콘텐츠 */}
      <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 20px" }}>
        {/* 탭 */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <button
            onClick={() => setCurrentTab("vocabulary")}
            style={{
              padding: "10px 16px",
              backgroundColor: currentTab === "vocabulary" ? "#8b7355" : "#d4a574",
              color: "#f5f1e8",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            낱말장
          </button>
          <button
            onClick={() => setCurrentTab("sentences")}
            style={{
              padding: "10px 16px",
              backgroundColor: currentTab === "sentences" ? "#8b7355" : "#d4a574",
              color: "#f5f1e8",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            예문
          </button>
        </div>

        {!isAdmin && (
          <p style={{ fontSize: 12.5, color: "#8a6f45", textAlign: "center", marginBottom: 14 }}>
            이 카드는 운영자가 관리해요. 조회만 가능해요.
          </p>
        )}

        {/* 낱말장 */}
        {currentTab === "vocabulary" && (
          <>
            {isAdmin && (
              <div
                style={{
                  backgroundColor: "#e8dcc8",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "2px solid #d4a574",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>새 단어 추가</h3>
                <input
                  placeholder="단어"
                  value={form.word}
                  onChange={handleFormChange("word")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }}
                />
                <select
                  value={form.pos}
                  onChange={handleFormChange("pos")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }}
                >
                  <option value="명사">명사</option>
                  <option value="동사">동사</option>
                  <option value="형용사">형용사</option>
                  <option value="부사">부사</option>
                  <option value="기타">기타</option>
                </select>
                <input
                  placeholder="IPA 발음 — 선택 사항"
                  value={form.ipa}
                  onChange={handleFormChange("ipa")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }}
                />
                <textarea
                  placeholder="의미"
                  value={form.meaning}
                  onChange={handleFormChange("meaning")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }}
                />
                <textarea
                  placeholder="예문 (영어)"
                  value={form.example}
                  onChange={handleFormChange("example")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }}
                />
                <textarea
                  placeholder="예문 번역 (한국어)"
                  value={form.exampleKo}
                  onChange={handleFormChange("exampleKo")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }}
                />
                <button
                  onClick={handleAdd}
                  style={{ width: "100%", padding: "10px", backgroundColor: "#6b5344", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
                >
                  + 단어 추가하기
                </button>
              </div>
            )}

            {loading ? (
              <p>불러오는 중…</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
                {dataList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    style={{
                      backgroundColor: "#e8dcc8",
                      padding: "16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: selected?.id === item.id ? "3px solid #8b7355" : "1px solid #d4a574",
                    }}
                  >
                    <h4 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "18px" }}>{item.word}</h4>
                    <p style={{ margin: "4px 0", color: "#666", fontSize: "12px" }}>[{item.pos}]</p>
                    {item.ipa && <p style={{ margin: "4px 0", color: "#888", fontSize: "12px" }}>{item.ipa}</p>}
                    <p style={{ margin: "8px 0 0 0", color: "#333", fontSize: "14px" }}>{item.meaning}</p>
                  </div>
                ))}
                {dataList.length === 0 && <p style={{ color: "#8a6f45" }}>아직 저장된 단어가 없어요.</p>}
              </div>
            )}
          </>
        )}

        {/* 예문 */}
        {currentTab === "sentences" && (
          <>
            {isAdmin && (
              <div
                style={{
                  backgroundColor: "#e8dcc8",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "2px solid #d4a574",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>새 문장 추가</h3>
                <textarea
                  placeholder="문장"
                  value={form.word}
                  onChange={handleFormChange("word")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit", minHeight: "60px" }}
                />
                <textarea
                  placeholder="문장 번역 (한국어)"
                  value={form.exampleKo}
                  onChange={handleFormChange("exampleKo")}
                  style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit", minHeight: "60px" }}
                />
                <button
                  onClick={handleAdd}
                  style={{ width: "100%", padding: "10px", backgroundColor: "#6b5344", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
                >
                  + 문장 추가하기
                </button>
              </div>
            )}

            {loading ? (
              <p>불러오는 중…</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
                {dataList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    style={{
                      backgroundColor: "#e8dcc8",
                      padding: "16px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      border: selected?.id === item.id ? "3px solid #8b7355" : "1px solid #d4a574",
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0", color: "#333", fontSize: "16px", lineHeight: "1.6" }}>{item.sentence}</p>
                    <p style={{ margin: "0", color: "#666", fontSize: "14px", lineHeight: "1.6" }}>{item.translation}</p>
                  </div>
                ))}
                {dataList.length === 0 && <p style={{ color: "#8a6f45" }}>아직 저장된 문장이 없어요.</p>}
              </div>
            )}
          </>
        )}

        {/* 상세 보기 모달 */}
        {selected && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setSelected(null)}
          >
            <div
              style={{
                backgroundColor: "#e8dcc8",
                padding: "24px",
                borderRadius: "8px",
                maxWidth: "500px",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 16px 0", color: "#333" }}>{selected.word || selected.sentence}</h2>
              {selected.pos && <p style={{ margin: "8px 0", color: "#666" }}>[{selected.pos}]</p>}
              {selected.ipa && <p style={{ margin: "8px 0", color: "#666" }}>발음: {selected.ipa}</p>}
              {selected.meaning && <p style={{ margin: "8px 0", color: "#333" }}>{selected.meaning}</p>}
              {selected.example && <p style={{ margin: "8px 0", color: "#666", fontStyle: "italic" }}>예문: {selected.example}</p>}
              {selected.example_ko && <p style={{ margin: "8px 0", color: "#666" }}>번역: {selected.example_ko}</p>}
              {selected.translation && <p style={{ margin: "8px 0", color: "#666" }}>{selected.translation}</p>}
              <button
                onClick={() => setSelected(null)}
                style={{ marginTop: "16px", padding: "8px 16px", backgroundColor: "#6b5344", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
