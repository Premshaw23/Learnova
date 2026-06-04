"use client";

import { useState, useRef, useEffect } from "react";
import { loadDocument, loadFromPaste } from "./DocumentLoader";
import { splitDocuments } from "./TextSplitter";
import { buildRetriever } from "./Retriever";
import { askQuestion, quickAction, clearHistory } from "./qachain";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
 
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
  :root {
    --bg-base:      #080810;
    --bg-card:      #0f0f18;
    --bg-elevated:  #141420;
    --bg-input:     #0d0d16;
    --bg-hover:     rgba(255,255,255,0.04);
 
    --accent-1:     #7c6fff;
    --accent-2:     #c084fc;
    --accent-g:     linear-gradient(135deg, #7c6fff, #c084fc);
 
    --border-dim:   rgba(255,255,255,0.06);
    --border-mid:   rgba(255,255,255,0.10);
    --border-glow:  rgba(124,111,255,0.30);
 
    --text-1:       #eef0f6;
    --text-2:       #8b90a8;
    --text-3:       #545870;
 
    --font:         'Geist', sans-serif;
    --mono:         'Geist Mono', monospace;
 
    --r-sm:   6px;
    --r-md:   12px;
    --r-lg:   18px;
    --r-pill: 999px;
  }
 
  /* ── Base ── */
  .page-wrapper {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
    font-family: var(--font);
    color: var(--text-1);
    overflow: hidden;
  }
 
  /* ── Layout ── */
  .main {
    display: grid;
    grid-template-columns: 264px 1fr;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }
 
  /* ── Sidebar ── */
  .sidebar {
    background: var(--bg-card);
    border-right: 1px solid var(--border-dim);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .sidebar::-webkit-scrollbar { width: 3px; }
  .sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
 
  .sidebar-header {
    padding: 18px 16px 16px;
    border-bottom: 1px solid var(--border-dim);
  }
 
  .sidebar-title {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    letter-spacing: 1.4px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
 
  /* tabs */
  .input-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
  .input-tab {
    flex: 1; padding: 7px 6px;
    border-radius: var(--r-sm);
    font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
    border: 1px solid var(--border-dim);
    color: var(--text-3);
    background: transparent;
    font-family: var(--font);
  }
  .input-tab:hover { color: var(--text-2); border-color: var(--border-mid); }
  .input-tab.active {
    background: rgba(124,111,255,0.12);
    color: #a89fff;
    border-color: rgba(124,111,255,0.25);
  }
 
  /* upload zone */
  .upload-zone {
    border: 1.5px dashed rgba(124,111,255,0.25);
    border-radius: var(--r-md);
    padding: 28px 14px;
    text-align: center;
    cursor: pointer;
    background: rgba(124,111,255,0.03);
    transition: all 0.2s;
    position: relative;
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: rgba(124,111,255,0.5);
    background: rgba(124,111,255,0.07);
  }
  .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .upload-icon { font-size: 28px; margin-bottom: 10px; }
  .upload-label { font-size: 13px; font-weight: 500; color: var(--text-2); }
  .upload-sub { font-size: 11px; color: var(--text-3); margin-top: 4px; }
 
  /* paste */
  .paste-area {
    width: 100%;
    border-radius: var(--r-sm);
    border: 1px solid var(--border-dim);
    background: var(--bg-input);
    color: var(--text-1);
    font-family: var(--font);
    font-size: 12.5px;
    padding: 10px 12px;
    resize: none;
    outline: none;
    transition: border-color 0.2s;
    line-height: 1.6;
  }
  .paste-area:focus { border-color: rgba(124,111,255,0.35); }
  .paste-area::placeholder { color: var(--text-3); }
 
  .process-btn {
    width: 100%; margin-top: 10px; padding: 11px;
    border-radius: var(--r-sm); border: none; cursor: pointer;
    font-size: 13px; font-weight: 600; letter-spacing: 0.1px;
    background: var(--accent-g);
    color: #fff; transition: opacity 0.2s;
    font-family: var(--font);
  }
  .process-btn:hover:not(:disabled) { opacity: 0.85; }
  .process-btn:disabled { opacity: 0.35; cursor: not-allowed; }
 
  /* progress */
  .progress-wrap {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-dim);
  }
  .progress-label {
    font-size: 11px; color: var(--text-2);
    margin-bottom: 7px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .progress-bar {
    height: 3px; border-radius: var(--r-pill);
    background: rgba(255,255,255,0.06); overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: var(--r-pill);
    background: var(--accent-g);
    transition: width 0.4s ease;
  }
 
  /* doc badge */
  .doc-info { padding: 12px 16px; border-bottom: 1px solid var(--border-dim); }
  .doc-badge {
    display: flex; align-items: center; gap: 10px;
    background: rgba(124,111,255,0.07);
    border: 1px solid rgba(124,111,255,0.18);
    border-radius: var(--r-sm); padding: 10px 12px;
  }
  .doc-badge-icon { font-size: 18px; flex-shrink: 0; }
  .doc-badge-name {
    font-size: 12px; font-weight: 500; color: var(--text-1);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 148px;
  }
  .doc-badge-meta { font-size: 10.5px; color: var(--text-3); margin-top: 2px; }
  .doc-badge-remove {
    margin-left: auto; font-size: 12px; cursor: pointer;
    color: var(--text-3); flex-shrink: 0; line-height: 1;
    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
    border-radius: 4px; transition: all 0.15s;
  }
  .doc-badge-remove:hover { color: #f87171; background: rgba(248,113,113,0.1); }
 
  /* quick actions */
  .quick-actions {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-dim);
  }
  .qa-title {
    font-size: 10px; font-weight: 600; color: var(--text-3);
    letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 10px;
  }
  .qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .qa-btn {
    padding: 10px 8px; border-radius: var(--r-sm);
    border: 1px solid var(--border-dim);
    background: var(--bg-elevated); cursor: pointer;
    transition: all 0.15s; text-align: center;
    font-size: 11.5px; font-weight: 500; color: var(--text-2);
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    font-family: var(--font);
  }
  .qa-btn:hover:not(:disabled) {
    border-color: rgba(124,111,255,0.35);
    color: #a89fff;
    background: rgba(124,111,255,0.07);
  }
  .qa-btn:disabled { opacity: 0.25; cursor: not-allowed; }
  .qa-btn-icon { font-size: 15px; }
 
  /* chunk profile */
  .profile-wrap { padding: 12px 16px; }
  .profile-label {
    font-size: 10px; font-weight: 600; color: var(--text-3);
    letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 8px;
  }
  .profile-select {
    width: 100%; padding: 8px 10px; border-radius: var(--r-sm);
    border: 1px solid var(--border-dim); background: var(--bg-elevated);
    color: var(--text-2); font-size: 12.5px; font-family: var(--font);
    outline: none; cursor: pointer; transition: border-color 0.15s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23545870'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }
  .profile-select:focus { border-color: rgba(124,111,255,0.35); }
 
  /* ── Chat ── */
  .chat-area {
    display: flex; flex-direction: column;
    overflow: hidden; position: relative;
    background: var(--bg-base);
  }
 
  /* ambient glow */
  .chat-glow {
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: 700px; height: 300px;
    background: radial-gradient(ellipse at 50% 0%, rgba(124,111,255,0.07) 0%, transparent 65%);
    pointer-events: none; z-index: 0;
  }
 
  .chat-header {
    padding: 14px 22px;
    border-bottom: 1px solid var(--border-dim);
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0; position: relative; z-index: 1;
    background: rgba(8,8,16,0.8);
    backdrop-filter: blur(12px);
  }
  .chat-header-left { display: flex; align-items: center; gap: 10px; }
  .status-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    transition: all 0.3s;
  }
  .chat-header-title { font-size: 14px; font-weight: 600; color: var(--text-1); }
  .chat-header-sub   { font-size: 11.5px; color: var(--text-3); margin-top: 1px; }
  .clear-btn {
    padding: 6px 14px; border-radius: var(--r-pill);
    border: 1px solid var(--border-dim);
    background: transparent; color: var(--text-3);
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: all 0.15s; font-family: var(--font);
  }
  .clear-btn:hover { border-color: rgba(248,113,113,0.35); color: #fca5a5; }
 
  /* messages list */
  .messages {
    flex: 1; overflow-y: auto; padding: 28px 24px;
    display: flex; flex-direction: column; gap: 20px;
    position: relative; z-index: 1; min-height: 0;
  }
  .messages::-webkit-scrollbar { width: 3px; }
  .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
 
  /* empty state */
  .empty-state {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; padding: 40px; text-align: center;
    user-select: none;
  }
  .empty-icon {
    width: 64px; height: 64px; border-radius: 20px;
    background: rgba(124,111,255,0.1);
    border: 1px solid rgba(124,111,255,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin-bottom: 4px;
  }
  .empty-title {
    font-size: 22px; font-weight: 700;
    background: linear-gradient(135deg, #a89fff 0%, #d8b4fe 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -0.3px;
  }
  .empty-sub {
    font-size: 13px; color: var(--text-3);
    max-width: 360px; line-height: 1.7;
  }
  .empty-hints {
    display: flex; flex-wrap: wrap; gap: 7px;
    justify-content: center; margin-top: 8px;
  }
  .empty-hint {
    padding: 7px 14px; border-radius: var(--r-pill);
    border: 1px solid var(--border-dim);
    background: var(--bg-card); font-size: 12px; color: var(--text-2);
    cursor: pointer; transition: all 0.15s; font-family: var(--font);
  }
  .empty-hint:hover {
    border-color: rgba(124,111,255,0.35); color: #a89fff;
    background: rgba(124,111,255,0.06);
  }
 
  /* message row */
  .msg {
    display: flex; gap: 11px; align-items: flex-start;
    animation: msgIn 0.2s ease both;
  }
  @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .msg.user { flex-direction: row-reverse; }
 
  .msg-avatar {
    width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
  }
  .msg-avatar.ai   { background: var(--accent-g); }
  .msg-avatar.user { background: rgba(255,255,255,0.08); border: 1px solid var(--border-mid); color: var(--text-2); font-size: 14px; }
 
  .msg-bubble {
    max-width: 70%; padding: 12px 15px;
    font-size: 13.5px; line-height: 1.7;
    border: 1px solid var(--border-dim);
    border-radius: var(--r-md);
  }
  .msg.user .msg-bubble {
    background: rgba(124,111,255,0.1);
    border-color: rgba(124,111,255,0.18);
    border-radius: var(--r-md) 4px var(--r-md) var(--r-md);
    color: var(--text-1);
  }
  .msg.ai .msg-bubble {
    background: var(--bg-card);
    border-radius: 4px var(--r-md) var(--r-md) var(--r-md);
    color: var(--text-1);
  }
  .msg-time {
    font-size: 10px; color: var(--text-3); margin-top: 5px;
    font-variant-numeric: tabular-nums;
  }
 
  /* source pills */
  .source-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
  .source-pill {
    padding: 3px 8px; border-radius: var(--r-pill);
    background: rgba(124,111,255,0.08); border: 1px solid rgba(124,111,255,0.2);
    font-size: 10px; color: #a89fff; font-family: var(--mono);
  }
 
  /* typing */
  .typing { display: flex; gap: 4px; align-items: center; padding: 3px 0; }
  .typing-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent-1);
    animation: bounce 1.1s ease infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.18s; }
  .typing-dot:nth-child(3) { animation-delay: 0.36s; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
    30%            { transform: translateY(-5px); opacity: 1; }
  }
 
  /* action card */
  .action-card {
    background: var(--bg-card);
    border: 1px solid rgba(124,111,255,0.18);
    border-radius: var(--r-md); padding: 16px 18px;
    position: relative; overflow: hidden;
  }
  .action-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--accent-g);
  }
  .action-card-label {
    font-size: 10px; font-weight: 600; color: var(--accent-1);
    letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 10px;
  }
  .action-card-content {
    font-size: 13.5px; line-height: 1.75; color: var(--text-2);
    white-space: pre-wrap;
  }
 
  /* ── Input bar ── */
  .input-bar {
    padding: 14px 20px 16px;
    border-top: 1px solid var(--border-dim);
    background: rgba(8,8,16,0.85);
    backdrop-filter: blur(16px);
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .input-wrap {
    display: flex; gap: 10px; align-items: flex-end;
    background: var(--bg-elevated);
    border: 1px solid var(--border-mid);
    border-radius: var(--r-lg);
    padding: 10px 12px;
    transition: border-color 0.2s;
  }
  .input-wrap:focus-within { border-color: rgba(124,111,255,0.4); }
  .chat-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--text-1); font-family: var(--font); font-size: 13.5px;
    resize: none; max-height: 120px; line-height: 1.55;
  }
  .chat-input::placeholder { color: var(--text-3); }
  .send-btn {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    background: var(--accent-g);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; transition: opacity 0.2s;
    align-self: flex-end;
  }
  .send-btn:hover:not(:disabled) { opacity: 0.8; }
  .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .input-hint { font-size: 10.5px; color: var(--text-3); margin-top: 8px; text-align: center; letter-spacing: 0.1px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const QUICK_ACTIONS = [
  { key: "summarise",  label: "Summarise",  icon: "📝" },
  { key: "keypoints",  label: "Key Points", icon: "🎯" },
  { key: "flashcards", label: "Flashcards", icon: "🃏" },
  { key: "simplify",   label: "Simplify",   icon: "💡" },
];

const HINT_PROMPTS = [
  "What are the main concepts?",
  "Explain this in simple terms",
  "What are the key formulas?",
  "Give me a quick summary",
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function StudyAIPage() {
  const [activeTab,    setActiveTab]    = useState("upload");
  const [profile,      setProfile]      = useState("academic");
  const [document,     setDocument]     = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnswering,  setIsAnswering]  = useState(false);
  const [progress,     setProgress]     = useState({ stage: "", percent: 0 });
  const [pasteText,    setPasteText]    = useState("");
  const [dragOver,     setDragOver]     = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswering]);

  async function processPipeline(file, pastedText) {
    setIsProcessing(true);
    setProgress({ stage: "Starting…", percent: 0 });

    const docs = file
      ? await loadDocument(file, ({ stage, percent }) => setProgress({ stage, percent }))
      : loadFromPaste(pastedText);

    setProgress({ stage: "Splitting into chunks…", percent: 60 });
    const chunks = await splitDocuments(docs, profile);

    setProgress({ stage: "Building vector store…", percent: 75 });
    const sessionId = await buildRetriever(
  chunks,
  ({ stage, percent }) => setProgress({ stage, percent })
);

setSessionId(sessionId);

    setProgress({ stage: "Ready ✓", percent: 100 });

    const docName = file ? file.name : "Pasted Content";
    const docType = file
      ? (file.name.endsWith(".pdf") ? "pdf-text" : "plain-text")
      : "plain-text";

    setDocument({ name: docName, type: docType, chunks: chunks.length });
    setIsProcessing(false);

    setMessages([{
      id:      Date.now(),
      role:    "ai",
      text:    `Document loaded! Processed **${docName}** into ${chunks.length} chunks. Ask me anything about it, or use the quick actions.`,
      time:    timestamp(),
      sources: [],
    }]);
  }

  async function handleFileUpload(file) {
    if (!file) return;
    await processPipeline(file, null);
  }

  async function handlePasteProcess() {
    if (!pasteText.trim()) return;
    await processPipeline(null, pasteText);
  }

  async function handleSend(text) {
    const q = (text || input).trim();
    if (!q || !sessionId || isAnswering) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { id: Date.now(), role: "user", text: q, time: timestamp() };
    setMessages(prev => [...prev, userMsg]);
    setIsAnswering(true);

    const answer = await askQuestion(q, sessionId);
    const aiMsg = {
      id:      Date.now() + 1,
      role:    "ai",
      text:    answer,
      time:    timestamp(),
      sources: [],
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsAnswering(false);
  }

  async function handleQuickAction(action) {
    if (!sessionId || isAnswering) return;
    setIsAnswering(true);

    const label = QUICK_ACTIONS.find(a => a.key === action)?.label;

    const userMsg = {
      id:   Date.now(),
      role: "user",
      text: `Generate ${label} for this document`,
      time: timestamp(),
    };
    setMessages(prev => [...prev, userMsg]);

    const result = await quickAction(action, sessionId);

    const aiMsg = {
      id:          Date.now() + 1,
      role:        "ai",
      isAction:    true,
      actionKey:   action,
      actionLabel: label,
      text:        result,
      time:        timestamp(),
      sources:     [],
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsAnswering(false);
  }

  function handleClear() {
    setMessages([]);
    clearHistory();
  }

  function handleRemoveDoc() {
    setDocument(null);
    setSessionId(null);
    setMessages([]);
    setProgress({ stage: "", percent: 0 });
    setPasteText("");
  }

  const canInteract = !!sessionId && !isProcessing;

  return (
    <>
      <style>{CSS}</style>
      <div className="page-wrapper">

        {/* ── Main ── */}
        <div className="main">

          {/* ── Sidebar ── */}
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-title">Document Input</div>

              <div className="input-tabs">
                <button
                  className={`input-tab${activeTab === "upload" ? " active" : ""}`}
                  onClick={() => setActiveTab("upload")}>
                  ↑ Upload
                </button>
                <button
                  className={`input-tab${activeTab === "paste" ? " active" : ""}`}
                  onClick={() => setActiveTab("paste")}>
                  ✎ Paste
                </button>
              </div>

              {activeTab === "upload" && !document && (
                <div
                  className={`upload-zone${dragOver ? " drag-over" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]); }}>
                  <input
                    type="file" accept=".pdf,.txt,.md" ref={fileInputRef}
                    onChange={e => handleFileUpload(e.target.files[0])} />
                  <div className="upload-icon">📄</div>
                  <div className="upload-label">Drop your file here</div>
                  <div className="upload-sub">PDF, TXT, MD — max 20 MB</div>
                </div>
              )}

              {activeTab === "paste" && !document && (
                <>
                  <textarea
                    className="paste-area" rows={6}
                    placeholder="Paste your notes, articles, or any study material here…"
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)} />
                  <button
                    className="process-btn"
                    disabled={!pasteText.trim() || isProcessing}
                    onClick={handlePasteProcess}>
                    {isProcessing ? "Processing…" : "Process Content →"}
                  </button>
                </>
              )}
            </div>

            {isProcessing && (
              <div className="progress-wrap">
                <div className="progress-label">
                  <span>{progress.stage}</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
            )}

            {document && (
              <div className="doc-info">
                <div className="doc-badge">
                  <div className="doc-badge-icon">
                    {document.type === "pdf-scanned" ? "🖨️" : document.type === "pdf-text" ? "📕" : "📝"}
                  </div>
                  <div>
                    <div className="doc-badge-name">{document.name}</div>
                    <div className="doc-badge-meta">{document.chunks} chunks · {document.type}</div>
                  </div>
                  <div className="doc-badge-remove" onClick={handleRemoveDoc} title="Remove document">✕</div>
                </div>
              </div>
            )}

            <div className="quick-actions">
              <div className="qa-title">Quick Actions</div>
              <div className="qa-grid">
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a.key}
                    className="qa-btn"
                    disabled={!canInteract || isAnswering}
                    onClick={() => handleQuickAction(a.key)}>
                    <span className="qa-btn-icon">{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-wrap">
              <div className="profile-label">Chunk Profile</div>
              <select
                className="profile-select"
                value={profile}
                onChange={e => setProfile(e.target.value)}>
                <option value="academic">Academic — Dense PDFs</option>
                <option value="notes">Notes — Lecture / Articles</option>
                <option value="brief">Brief — Short Passages</option>
              </select>
            </div>
          </aside>

          {/* ── Chat area ── */}
          <div className="chat-area">
            <div className="chat-glow" />

           <div className="chat-header">
  <div className="chat-header-left">
    <div
      className="chat-header-dot"
      style={{
        background: canInteract ? "#22c55e" : "#64748b",
        boxShadow: canInteract ? "0 0 8px #22c55e" : "none",
      }}
    />
    <div>
      <div className="chat-header-title">Study Assistant</div>
      <div className="chat-header-sub">
        {canInteract
          ? `${document?.name} — ${document?.chunks} chunks indexed`
          : "Upload a document to start chatting"}
      </div>
    </div>
  </div>

  <div style={{ display: "flex", gap: "8px" }}>
    <a href="/" className="clear-btn" style={{ textDecoration: "none" }}>
      ← Home
    </a>
    {messages.length > 0 && (
      <button className="clear-btn" onClick={handleClear}>Clear chat</button>
    )}
  </div>
</div>

            <div className="messages">
              {messages.length === 0 && !isProcessing ? (
                <div className="empty-state">
                  <div className="empty-icon">🧠</div>
                  <div className="empty-title">Ask me anything</div>
                  <div className="empty-sub">
                    Upload your study material and I&apos;ll answer questions, generate summaries, create flashcards, and help you understand complex topics.
                  </div>
                  <div className="empty-hints">
                    {HINT_PROMPTS.map(h => (
                      <button key={h} className="empty-hint" onClick={() => { if (canInteract) handleSend(h); }}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`msg ${msg.role}`}>
                    <div className={`msg-avatar ${msg.role}`}>
                      {msg.role === "ai" ? "✦" : "👤"}
                    </div>
                    <div>
                      {msg.isAction ? (
                        <div className="action-card">
                          <div className="action-card-label">{msg.actionLabel}</div>
                          <div className="action-card-content">{msg.text}</div>
                        </div>
                      ) : (
                        <div className="msg-bubble">{msg.text}</div>
                      )}
                      {msg.sources?.length > 0 && (
                        <div className="source-pills">
                          {msg.sources.map((s, i) => (
                            <span key={i} className="source-pill">pg {s.page} · chunk {s.chunk}</span>
                          ))}
                        </div>
                      )}
                      <div className="msg-time">{msg.time}</div>
                    </div>
                  </div>
                ))
              )}

              {isAnswering && (
                <div className="msg ai">
                  <div className="msg-avatar ai">✦</div>
                  <div className="msg-bubble">
                    <div className="typing">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="input-bar">
              <div className="input-wrap">
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  rows={1}
                  placeholder={canInteract ? "Ask a question about your document…" : "Upload a document first…"}
                  value={input}
                  disabled={!canInteract || isAnswering}
                  onChange={e => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                />
                <button
                  className="send-btn"
                  disabled={!canInteract || !input.trim() || isAnswering}
                  onClick={() => handleSend()}>
                  ➤
                </button>
              </div>
              <div className="input-hint">Enter to send · Shift+Enter for new line · Powered by Groq llama-3.3-70b</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}