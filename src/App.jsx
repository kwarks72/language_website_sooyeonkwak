import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tbkcztqcnpvboqlihilo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRia2N6dHFjbnB2Ym9xbGloaWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjIxMDksImV4cCI6MjEwMTgzODEwOX0.qUG9NckDYud-3H6VjAsV4iSC2AGcsCM_X8emkqTxG3c";
const ADMIN_EMAIL = "sooyeon0702@naver.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [currentLang, setCurrentLang] = useState("영어");
  const [currentTab, setCurrentTab] = useState("vocabulary");
  const [userEmail, setUserEmail] = useState(null);
  const [vocabList, setVocabList] = useState([]);
  const [sentenceList, setSentenceList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const EMPTY_FORM = {
    word: "",
    pos: "명사",
    ipa: "",
    meaning: "",
    example: "",
    exampleKo: "",
  };

  useEffect(() => {
    const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe?.data?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentLang === "영어" && currentTab === "vocabulary") {
      loadVocab("vocab_words");
    } else if (currentLang === "영어" && currentTab === "sentences") {
      loadSentences("english_sentences");
    } else if (currentLang === "일본어" && currentTab === "vocabulary") {
      loadVocab("japanese_words");
    } else if (currentLang === "일본어" && currentTab === "sentences") {
      loadSentences("japanese_sentences");
    } else if (currentLang === "스페인어" && currentTab === "vocabulary") {
      loadVocab("spanish_words");
    } else if (currentLang === "스페인어" && currentTab === "sentences") {
      loadSentences("spanish_sentences");
    }
  }, [currentLang, currentTab]);

  const loadVocab = async (tableName) => {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) {
      console.error("Error loading vocab:", error);
      setVocabList([]);
    } else {
      setVocabList(data || []);
    }
  };

  const loadSentences = async (tableName) => {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) {
      console.error("Error loading sentences:", error);
      setSentenceList([]);
    } else {
      setSentenceList(data || []);
    }
  };

  const handleFormChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleAdd = async () => {
    if (!form.word && !form.sentence) {
      alert("내용을 입력해주세요");
      return;
    }

    try {
      let tableName = "";
      let body = {};

      if (currentTab === "vocabulary") {
        tableName = currentLang === "영어" ? "vocab_words" : currentLang === "일본어" ? "japanese_words" : "spanish_words";
        body = {
          word: form.word,
          pos: form.pos,
          ipa: form.ipa,
          meaning: form.meaning,
          example: form.example,
          example_ko: form.exampleKo,
        };
      } else {
        tableName = currentLang === "영어" ? "english_sentences" : currentLang === "일본어" ? "japanese_sentences" : "spanish_sentences";
        body = {
          sentence: form.sentence || form.word,
          translation: form.exampleKo || form.meaning,
        };
      }

      const { error } = await supabase.from(tableName).insert([body]);

      if (error) {
        console.error("Error details:", error);
        alert("저장에 실패했어요. 다시 시도해주세요.");
      } else {
        alert("저장되었어요!");
        setForm(EMPTY_FORM);
        setShowForm(false);
        if (currentTab === "vocabulary") {
          loadVocab(tableName);
        } else {
          loadSentences(tableName);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("오류가 발생했어요.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  const getTableName = () => {
    if (currentTab === "vocabulary") {
      return currentLang === "영어" ? "vocab_words" : currentLang === "일본어" ? "japanese_words" : "spanish_words";
    } else {
      return currentLang === "영어" ? "english_sentences" : currentLang === "일본어" ? "japanese_sentences" : "spanish_sentences";
    }
  };

  const isAdmin = userEmail === ADMIN_EMAIL;
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
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <button onClick={() => { setCurrentLang("영어"); setCurrentTab("vocabulary"); }} style={{ background: "none", border: "none", color: "#f5f1e8", fontSize: "16px", cursor: "pointer" }}>
            🏠 홈
          </button>
          <button onClick={() => setCurrentTab("vocabulary")} style={{ background: "none", border: "none", color: "#f5f1e8", fontSize: "16px", cursor: "pointer" }}>
            🔍 전체 검색
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <select value={currentLang} onChange={(e) => setCurrentLang(e.target.value)} style={{ padding: "8px", borderRadius: "4px", border: "1px solid #999", backgroundColor: "#3a3a3a", color: "#f5f1e8" }}>
            <option value="영어">🗣️ 영어</option>
            <option value="일본어">🗣️ 일본어</option>
            <option value="스페인어">🗣️ 스페인어</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "14px" }}>🔑 1인쌤</span>
          <span style={{ fontSize: "14px" }}>{userEmail ? userEmail.substring(0, 15) : "로그인 필요"}</span>
          {userEmail ? (
            <button onClick={handleSignOut} style={{ padding: "6px 12px", backgroundColor: "#555", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>
              로그아웃
            </button>
          ) : (
            <button onClick={() => { window.location.href = "https://localhost:5173"; }} style={{ padding: "6px 12px", backgroundColor: "#555", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>
              로그인
            </button>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "0 20px" }}>
        {/* 탭 선택 */}
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

        {/* 낱말장 보기 */}
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
                <input placeholder="단어" value={form.word} onChange={handleFormChange("word")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px" }} />
                <select value={form.pos} onChange={handleFormChange("pos")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px" }}>
                  <option value="명사">명사</option>
                  <option value="동사">동사</option>
                  <option value="형용사">형용사</option>
                </select>
                <input placeholder="IPA 발음" value={form.ipa} onChange={handleFormChange("ipa")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px" }} />
                <textarea placeholder="의미" value={form.meaning} onChange={handleFormChange("meaning")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }} />
                <textarea placeholder="예문 (영어)" value={form.example} onChange={handleFormChange("example")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }} />
                <textarea placeholder="예문 번역 (한국어)" value={form.exampleKo} onChange={handleFormChange("exampleKo")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit" }} />
                <button onClick={handleAdd} style={{ width: "100%", padding: "10px", backgroundColor: "#6b5344", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                  + 단어 추가하기
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
              {dataList.map((item) => (
                <div key={item.id} onClick={() => setSelected(item)} style={{ backgroundColor: "#e8dcc8", padding: "16px", borderRadius: "8px", cursor: "pointer", border: selected?.id === item.id ? "3px solid #8b7355" : "1px solid #d4a574" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "18px" }}>{item.word}</h4>
                  <p style={{ margin: "4px 0", color: "#666", fontSize: "12px" }}>[{item.pos}]</p>
                  {item.ipa && <p style={{ margin: "4px 0", color: "#888", fontSize: "12px" }}>{item.ipa}</p>}
                  <p style={{ margin: "8px 0 0 0", color: "#333", fontSize: "14px" }}>{item.meaning}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 예문 보기 */}
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
                <textarea placeholder="문장 (영어)" value={form.word} onChange={handleFormChange("word")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit", minHeight: "60px" }} />
                <textarea placeholder="문장 번역 (한국어)" value={form.exampleKo} onChange={handleFormChange("exampleKo")} style={{ width: "100%", padding: "8px", marginBottom: "10px", border: "1px solid #bbb", borderRadius: "4px", fontFamily: "inherit", minHeight: "60px" }} />
                <button onClick={handleAdd} style={{ width: "100%", padding: "10px", backgroundColor: "#6b5344", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                  + 문장 추가하기
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
              {dataList.map((item) => (
                <div key={item.id} onClick={() => setSelected(item)} style={{ backgroundColor: "#e8dcc8", padding: "16px", borderRadius: "8px", cursor: "pointer", border: selected?.id === item.id ? "3px solid #8b7355" : "1px solid #d4a574" }}>
                  <p style={{ margin: "0 0 8px 0", color: "#333", fontSize: "16px", lineHeight: "1.6" }}>{item.sentence}</p>
                  <p style={{ margin: "0", color: "#666", fontSize: "14px", lineHeight: "1.6" }}>{item.translation}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 상세 보기 */}
        {selected && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
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
              <button onClick={() => setSelected(null)} style={{ marginTop: "16px", padding: "8px 16px", backgroundColor: "#6b5344", color: "#f5f1e8", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
