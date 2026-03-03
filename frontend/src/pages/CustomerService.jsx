// src/pages/CustomerService.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerService.css";

/* ---------------- helpers ---------------- */
function pad2(x) {
  return String(x).padStart(2, "0");
}
function toHHMM(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/* ---------------- UI constants ---------------- */
const DEMO_AGENT = {
  name: "Customer Service",
  avatar: "/icons/CS.jpg",
};

const DEMO_TG = {
  handle: "@MarketWaySupport",
  title: "Telegram Customer Service",
  desc: "Tap below to chat via Telegram.",
  link: "https://t.me/MarketWaySupport",
};

export default function CustomerService() {
  const nav = useNavigate();

  /* ---------------- UI state ---------------- */
  const [mode, setMode] = useState("direct"); // direct | telegram
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null); // { file, url, name }
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [err, setErr] = useState("");

  // demo messages (no backend now)
  const [messages, setMessages] = useState([
    {
      id: "m1",
      from: "agent",
      type: "text",
      text: "Hello! How can we help you today?",
      url: "",
      name: "",
      at: toHHMM(new Date().toISOString()),
    },
  ]);

  const [agentTyping, setAgentTyping] = useState(false);

  // refs
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const photoInputRef = useRef(null);

  // lightbox
  const [imgOpen, setImgOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  const openImage = (src, alt = "photo") => {
    setImgSrc(src);
    setImgAlt(alt);
    setImgOpen(true);
  };
  const closeImage = () => {
    setImgOpen(false);
    setImgSrc("");
    setImgAlt("");
  };

  /* ---------------- scrolling ---------------- */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, agentTyping]);

  /* focus on direct mode */
  useEffect(() => {
    if (mode === "direct") setTimeout(() => inputRef.current?.focus(), 120);
  }, [mode]);

  /* ---------------- NEW UI file preview ---------------- */
  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/^image\//i.test(file.type || "")) {
      setErr("Please select an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErr("Max photo size is 3MB.");
      e.target.value = "";
      return;
    }

    setErr("");
    const url = URL.createObjectURL(file);
    setFilePreview({ file, url, name: file.name });
    e.target.value = "";
  }

  function removePreview() {
    if (filePreview?.url) URL.revokeObjectURL(filePreview.url);
    setFilePreview(null);
  }

  const canSend = useMemo(() => {
    return text.trim().length > 0 || !!filePreview;
  }, [text, filePreview]);

  async function send() {
    if (!canSend || uploadingPhoto) return;

    try {
      setErr("");
      const t = text.trim();
      setText("");

      // simulate upload + send
      if (filePreview?.file) {
        setUploadingPhoto(true);

        // add image message
        setMessages((prev) => [
          ...prev,
          {
            id: `m${Date.now()}`,
            from: "me",
            type: "image",
            text: "",
            url: filePreview.url,
            name: filePreview.name,
            at: toHHMM(new Date().toISOString()),
          },
        ]);

        removePreview();
        setUploadingPhoto(false);
      }

      if (t) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m${Date.now()}`,
            from: "me",
            type: "text",
            text: t,
            url: "",
            name: "",
            at: toHHMM(new Date().toISOString()),
          },
        ]);

        // fake agent reply
        setAgentTyping(true);
        setTimeout(() => {
          setAgentTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `a${Date.now()}`,
              from: "agent",
              type: "text",
              text: "Thanks! Our team is checking it now.",
              url: "",
              name: "",
              at: toHHMM(new Date().toISOString()),
            },
          ]);
        }, 900);
      }
    } catch {
      setErr("Failed to send");
      setUploadingPhoto(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="csPage">
      {/* TOP HEADER */}
      <div className="csTopBar">
        <div className="csTopLeft">
          <img className="csTopAvatar" src={DEMO_AGENT.avatar} alt="Support" />
          <div className="csTopMeta">
            <div className="csTitle">{DEMO_AGENT.name}</div>

            <div className="csSub">
              <span className="onlineDot" />
              <span className="onlineText">Online</span>
              <span className="statusSep">•</span>
              Reply time: 2–5 min
              <span className="statusSep">•</span>
              Available 24/7
            </div>
          </div>
        </div>

        <div className="csTabs" role="tablist" aria-label="Support Channels">
          <button
            className={"csTab " + (mode === "direct" ? "isActive" : "")}
            onClick={() => setMode("direct")}
            role="tab"
            aria-selected={mode === "direct"}
            type="button"
          >
            Direct
          </button>
          <button
            className={"csTab " + (mode === "telegram" ? "isActive" : "")}
            onClick={() => setMode("telegram")}
            role="tab"
            aria-selected={mode === "telegram"}
            type="button"
          >
            Telegram
          </button>
        </div>
      </div>

      {err ? (
        <div style={{ padding: "10px 12px", color: "#fecaca", fontWeight: 800 }}>{err}</div>
      ) : null}

      <div className="csBodyOne">
        {mode === "direct" ? (
          <section className="chatShell">
            {/* Messages */}
            <div className="chatList" ref={listRef}>
              <div className="chatDay">
                <span>Today</span>
              </div>

              {messages.map((m) => (
                <div key={m.id} className={"chatRow " + (m.from === "me" ? "isMe" : "isAgent")}>
                  <div className={"bubble " + (m.type === "image" ? "isImage" : "")}>
                    {m.type === "image" ? (
                      <div className="imgWrap">
                        <img
                          src={m.url || "/user.png"}
                          alt={m.name || "upload"}
                          onClick={() => openImage(m.url || "/user.png", m.name || "photo")}
                          style={{ cursor: "zoom-in" }}
                        />
                      </div>
                    ) : (
                      <div className="bubbleText">{m.text}</div>
                    )}

                    <div className="bubbleMeta">
                      <span>{m.at}</span>
                    </div>
                  </div>
                </div>
              ))}

              {agentTyping ? (
                <div className="chatRow isAgent">
                  <div className="typingBubble" aria-label="Typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Composer */}
            <div className="composer">
              {filePreview ? (
                <div className="previewBar">
                  <div className="previewLeft">
                    <div
                      className="previewThumb"
                      style={{ backgroundImage: `url("${filePreview.url}")` }}
                      aria-hidden="true"
                    />
                    <div className="previewInfo">
                      <div className="previewName">{filePreview.name}</div>
                      <div className="previewHint">{uploadingPhoto ? "Uploading…" : "Ready to send"}</div>
                    </div>
                  </div>
                  <button className="previewRemove" onClick={removePreview} type="button">
                    Remove
                  </button>
                </div>
              ) : null}

              <div className="composerRow">
                <label className="iconBtn" title="Upload photo">
                  <input
                    ref={photoInputRef}
                    className="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    disabled={uploadingPhoto}
                  />
                  <span className="icon">{uploadingPhoto ? "⏳" : "＋"}</span>
                </label>

                <div className="composerBox">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={1}
                    placeholder="Type your message…"
                    disabled={uploadingPhoto}
                  />
                </div>

                <button
                  className={"sendBtn " + (canSend && !uploadingPhoto ? "isReady" : "")}
                  onClick={send}
                  type="button"
                  disabled={!canSend || uploadingPhoto}
                >
                  Send
                </button>
              </div>

              <div className="composerNote">Never share passwords. Upload screenshots using the + button.</div>

              {/* Optional back button */}
              <div style={{ padding: "10px 0 0" }}>
                <button
                  type="button"
                  onClick={() => nav(-1)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,.18)",
                    color: "rgba(255,255,255,.85)",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="tgShell">
            <div className="tgHero">
              <div className="tgBadge">Telegram</div>
              <div className="tgTitle">{DEMO_TG.title}</div>
              <div className="tgDesc">{DEMO_TG.desc}</div>

              <div className="tgCard">
                <div className="tgRow">
                  <div className="tgLabel">Handle</div>
                  <div className="tgValue">{DEMO_TG.handle}</div>
                </div>
                <div className="tgRow">
                  <div className="tgLabel">Response</div>
                  <div className="tgValue">Typically 5–15 minutes</div>
                </div>
              </div>

              <a className="tgBtn" href={DEMO_TG.link} target="_blank" rel="noreferrer">
                Open Telegram Chat
              </a>

              <div className="tgNote">
                If not opening, search <b>{DEMO_TG.handle}</b> in Telegram.
              </div>

              <div style={{ paddingTop: 14 }}>
                <button
                  type="button"
                  onClick={() => nav(-1)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,.18)",
                    color: "rgba(255,255,255,.85)",
                    padding: "8px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  ← Back
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {imgOpen ? (
        <div className="cs-imgOverlay" role="dialog" aria-modal="true" onClick={closeImage}>
          <div className="cs-imgModal" onClick={(e) => e.stopPropagation()}>
            <button className="cs-imgClose" type="button" onClick={closeImage} aria-label="Close">
              ✕
            </button>
            <img className="cs-imgFull" src={imgSrc} alt={imgAlt || "photo"} />
          </div>
        </div>
      ) : null}
    </div>
  );
}