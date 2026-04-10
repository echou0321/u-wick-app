import { useState, useRef, useEffect } from "react";

const CHAT_SCRIPT = [
  {
    id: 0,
    role: "assistant",
    text: "Hey Nathan! 👋 Welcome to Wick — I'm here to help you get set up for the quarter. Quick question to get started: Are you currently Pre-major or already in a Major?",
    quickReplies: ["Pre-major", "In a Major"],
  },
  {
    id: 1,
    role: "user",
    text: "Pre-major",
    next: 2,
  },
  {
    id: 2,
    role: "assistant",
    text: "Got it — Pre-major! 🎯 What's your target major? This helps me tailor your course recommendations and track the right requirements.",
    quickReplies: ["Informatics", "Computer Science", "Human Centered Design & Engineering", "Other"],
  },
  {
    id: 3,
    role: "user",
    text: "Informatics",
    next: 4,
  },
  {
    id: 4,
    role: "assistant",
    text: "Informatics — great choice! 💡 To help you stay on top of deadlines and assignments, can you upload your syllabi for all your classes this quarter? I'll extract all the key dates automatically.",
    quickReplies: null,
    showUpload: true,
  },
  {
    id: 5,
    role: "user",
    text: "📎 Uploaded: MATH307_syllabus.pdf, INFO200_syllabus.pdf, CSE163_syllabus.pdf",
    isUpload: true,
    next: 6,
  },
  {
    id: 6,
    role: "assistant",
    text: "Perfect, I've scanned all 3 syllabi! 📚 I found 14 assignments, 3 exams, and 2 major projects across your courses. Last step — connect your Canvas account so I can sync your course data and keep everything up to date automatically.",
    quickReplies: null,
    showCanvas: true,
  },
  {
    id: 7,
    role: "user",
    text: "Connect Canvas",
    isCanvas: true,
    next: 8,
  },
  {
    id: 8,
    role: "assistant",
    text: "You're all set, Nathan! 🎉 Canvas is connected and your dashboard is ready. I've loaded your schedule, tasks, and upcoming deadlines. Let's make this quarter your best one yet!",
    quickReplies: ["Show my tasks", "What's due this week?", "View my schedule"],
  },
];

const SCHEDULE = [
  { time: "9:30–10:20AM", course: "INFO 200", room: "MGH 389", color: "#7C6AF7" },
  { time: "11:30AM–12:20PM", course: "MATH 307", room: "SMI 211", color: "#F7A06A" },
  { time: "1:30–3:20PM", course: "CSE 163", room: "CSE2 G10", color: "#6AF7C8" },
];

const TASKS = [
  { label: "Read INFO 200 Ch. 3", due: "Today", done: false },
  { label: "MATH 307 HW 2", due: "Tomorrow", done: false },
  { label: "CSE 163 Lab 1", due: "Mar 8", done: true },
];

export default function WickApp() {
  const [messages, setMessages] = useState([CHAT_SCRIPT[0]]);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [canvasConnected, setCanvasConnected] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [activeNav, setActiveNav] = useState("chat");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addAssistantMessage = (msgId) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, CHAT_SCRIPT[msgId]]);
      setScriptIndex(msgId);
    }, 1100);
  };

  const handleQuickReply = (text) => {
    const current = CHAT_SCRIPT[scriptIndex];
    let userMsgIndex = null;

    if (scriptIndex === 0 && text === "Pre-major") userMsgIndex = 1;
    else if (scriptIndex === 2 && text === "Informatics") userMsgIndex = 3;
    else if (scriptIndex === 8) {
      setMessages((prev) => [...prev, { role: "user", text }]);
      return;
    }

    if (userMsgIndex !== null) {
      const userMsg = CHAT_SCRIPT[userMsgIndex];
      setMessages((prev) => [...prev, userMsg]);
      addAssistantMessage(userMsg.next);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: inputVal }]);
    setInputVal("");
  };

  const handleUpload = () => {
    setUploadDone(true);
    const userMsg = CHAT_SCRIPT[5];
    setMessages((prev) => [...prev, userMsg]);
    addAssistantMessage(userMsg.next);
  };

  const handleCanvas = () => {
    setCanvasConnected(true);
    const userMsg = CHAT_SCRIPT[7];
    setMessages((prev) => [...prev, userMsg]);
    addAssistantMessage(userMsg.next);
  };

  const lastMsg = messages[messages.length - 1];

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Wick</div>
        {[
          { id: "home", icon: "⌂", label: "Home" },
          { id: "chat", icon: "💬", label: "Chat" },
          { id: "tasks", icon: "✓", label: "Tasks" },
          { id: "plan", icon: "📅", label: "Plan" },
        ].map((item) => (
          <button
            key={item.id}
            style={{ ...styles.navBtn, ...(activeNav === item.id ? styles.navBtnActive : {}) }}
            onClick={() => setActiveNav(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
          </button>
        ))}
        <div style={styles.avatar}>N</div>
      </aside>

      {/* Chat Panel */}
      <section style={styles.chatPanel}>
        <div style={styles.historyBar}>
          <span style={styles.historyIcon}>🕐</span> History
        </div>

        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                ...(msg.role === "assistant" ? styles.bubbleBot : styles.bubbleUser),
                ...(msg.isUpload ? styles.bubbleUpload : {}),
                ...(msg.isCanvas ? styles.bubbleCanvas : {}),
              }}
            >
              {msg.text}
            </div>
          ))}

          {isTyping && (
            <div style={{ ...styles.bubble, ...styles.bubbleBot, ...styles.typingBubble }}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          )}

          {/* Upload CTA */}
          {!isTyping && lastMsg?.showUpload && !uploadDone && (
            <div style={styles.ctaArea}>
              <button style={styles.ctaBtn} onClick={handleUpload}>
                📎 Upload Syllabi PDFs
              </button>
            </div>
          )}

          {/* Canvas CTA */}
          {!isTyping && lastMsg?.showCanvas && !canvasConnected && (
            <div style={styles.ctaArea}>
              <button style={{ ...styles.ctaBtn, background: "#E66000" }} onClick={handleCanvas}>
                🔗 Connect Canvas Account
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Replies */}
        {!isTyping && lastMsg?.quickReplies && (
          <div style={styles.quickReplies}>
            {lastMsg.quickReplies.map((r) => (
              <button key={r} style={styles.quickBtn} onClick={() => handleQuickReply(r)}>
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            placeholder="Message Wick"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button style={styles.inputIcon} onClick={handleUpload} title="Attach file">📎</button>
          <button style={styles.inputIcon} title="Voice">🎙️</button>
        </div>
      </section>

      {/* Dashboard Panel */}
      <section style={styles.dashboard}>
        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.heroStars}>✦ ✦ · ✦ · ✦</div>
          <div style={styles.heroGreeting}>Hello, Nathan! ✌️</div>
          <div style={styles.heroDate}>Friday, Mar 6</div>
          <div style={styles.heroGlow} />
        </div>

        {/* Daily Summary */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>Quarter kickoff! 🚀</p>
          <p style={styles.cardBody}>
            Welcome to your first quarter at UW! You're pre-major targeting Informatics. I've loaded your syllabi — 14 assignments, 3 exams, and 2 projects are on your radar. Connect Canvas to sync everything automatically.
          </p>
          <p style={styles.cardBody}>You've got this, Nathan — let's make it count!</p>
        </div>

        {/* Bottom row */}
        <div style={styles.twoCol}>
          {/* Tasks */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>To do today</span>
              <span style={styles.seeAll}>See all tasks →</span>
            </div>
            {TASKS.map((t, i) => (
              <div key={i} style={styles.taskRow}>
                <span style={{ ...styles.taskDot, background: t.done ? "#6AF7C8" : "#7C6AF7" }} />
                <span style={{ ...styles.taskLabel, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.5 : 1 }}>
                  {t.label}
                </span>
                <span style={styles.taskDue}>{t.due}</span>
              </div>
            ))}
          </div>

          {/* Schedule */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Your schedule today</span>
              <span style={styles.seeAll}>See all events →</span>
            </div>
            {SCHEDULE.map((s, i) => (
              <div key={i} style={{ ...styles.scheduleItem, borderLeft: `3px solid ${s.color}` }}>
                <div style={styles.scheduleTime}>{s.time}</div>
                <div style={styles.scheduleCourse}>{s.course}</div>
                <div style={styles.scheduleRoom}>{s.room}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#0F0D1A",
    color: "#E8E4FF",
    fontFamily: "'DM Sans', sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    width: 72,
    background: "#13101F",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
    gap: 8,
    borderRight: "1px solid #1E1A30",
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: "#C4B8FF",
    marginBottom: 16,
    letterSpacing: "-0.5px",
  },
  navBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    border: "none",
    background: "transparent",
    color: "#6B6488",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    transition: "all 0.2s",
  },
  navBtnActive: {
    background: "#1E1A30",
    color: "#C4B8FF",
  },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 9, fontWeight: 500 },
  avatar: {
    marginTop: "auto",
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#7C6AF7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    color: "#fff",
  },
  chatPanel: {
    width: 380,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1E1A30",
    background: "#0F0D1A",
  },
  historyBar: {
    padding: "14px 18px",
    fontSize: 13,
    color: "#6B6488",
    borderBottom: "1px solid #1E1A30",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  historyIcon: { fontSize: 14 },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  bubble: {
    maxWidth: "88%",
    padding: "12px 16px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.55,
    animation: "fadeUp 0.3s ease",
  },
  bubbleBot: {
    background: "#1A1730",
    color: "#E8E4FF",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    background: "#2E2660",
    color: "#E8E4FF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleUpload: {
    background: "#1A2E22",
    color: "#6AF7C8",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleCanvas: {
    background: "#2E1A0E",
    color: "#F7A06A",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  typingBubble: {
    display: "flex",
    gap: 5,
    alignItems: "center",
    padding: "14px 18px",
    width: 70,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#7C6AF7",
    display: "inline-block",
    animation: "blink 1.2s infinite ease-in-out",
  },
  ctaArea: {
    display: "flex",
    justifyContent: "flex-end",
    paddingTop: 4,
  },
  ctaBtn: {
    background: "#7C6AF7",
    border: "none",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.2s",
  },
  quickReplies: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: "8px 16px",
  },
  quickBtn: {
    background: "#1A1730",
    border: "1px solid #2E2A44",
    color: "#C4B8FF",
    borderRadius: 20,
    padding: "7px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.2s",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid #1E1A30",
  },
  input: {
    flex: 1,
    background: "#1A1730",
    border: "1px solid #2E2A44",
    borderRadius: 24,
    padding: "11px 18px",
    color: "#E8E4FF",
    fontSize: 14,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
  },
  inputIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    opacity: 0.6,
  },
  dashboard: {
    flex: 1,
    overflowY: "auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  hero: {
    background: "linear-gradient(135deg, #2A1F6B 0%, #4A2080 50%, #6A1FA0 100%)",
    borderRadius: 20,
    padding: "28px 32px",
    position: "relative",
    overflow: "hidden",
    minHeight: 130,
  },
  heroStars: {
    position: "absolute",
    top: 14,
    right: 20,
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    letterSpacing: 4,
  },
  heroGreeting: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 32,
    color: "#fff",
    marginBottom: 6,
  },
  heroDate: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  heroGlow: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 180,
    height: 180,
    borderRadius: "50%",
    background: "rgba(180, 100, 255, 0.25)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  card: {
    background: "#13101F",
    borderRadius: 16,
    padding: "18px 20px",
    border: "1px solid #1E1A30",
    flex: 1,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    color: "#E8E4FF",
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 13.5,
    color: "#9990BB",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  seeAll: {
    fontSize: 12,
    color: "#7C6AF7",
    cursor: "pointer",
  },
  twoCol: {
    display: "flex",
    gap: 16,
  },
  taskRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #1A1730",
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  taskLabel: {
    flex: 1,
    fontSize: 13,
    color: "#C4B8FF",
  },
  taskDue: {
    fontSize: 11,
    color: "#6B6488",
  },
  scheduleItem: {
    paddingLeft: 12,
    marginBottom: 12,
  },
  scheduleTime: {
    fontSize: 11,
    color: "#6B6488",
    marginBottom: 2,
  },
  scheduleCourse: {
    fontSize: 14,
    fontWeight: 600,
    color: "#E8E4FF",
  },
  scheduleRoom: {
    fontSize: 11,
    color: "#9990BB",
  },
};
