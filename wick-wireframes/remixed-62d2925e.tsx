import { useState, useRef, useEffect } from "react";

const CHAT_SCRIPT = [
  {
    id: 0,
    role: "assistant",
    text: "Hey Nathan! 👋 A week in — how's it going? What can I help you with today?",
    quickReplies: ["First week of class in the books. I need help setting up my schedule for this quarter."],
  },
  {
    id: 1,
    role: "user",
    text: "First week of class in the books. I need help setting up my schedule for this quarter.",
    next: 2,
  },
  {
    id: 2,
    role: "assistant",
    text: "Let's start with your classes. Do you have any preferences on study times?",
    quickReplies: ["Yes. I want to study for INFO 200 right after class", "No preference, surprise me"],
  },
  {
    id: 3,
    role: "user",
    text: "Yes. I want to study for INFO 200 right after class.",
    next: 4,
  },
  {
    id: 4,
    role: "assistant",
    text: "To keep up with the expected course work for this class, I've blocked off 90 minutes on Monday/Wednesdays after class from 4:30–6pm. How does that sound? (tap to undo)",
    quickReplies: ["Sounds great! Help me set aside time for my other classes too!", "Undo"],
    showSchedulePreview: "info200",
  },
  {
    id: 5,
    role: "user",
    text: "Sounds great! Help me set aside time for my other classes too!",
    next: 6,
  },
  {
    id: 6,
    role: "assistant",
    text: "I've scheduled 4 hours of study time for MATH 207 over Saturday and Sunday to fit around your soccer practices and game while keeping Saturday evenings open for friends! (tap to undo)",
    quickReplies: ["Thanks so much! Send me a daily event summary every morning to help me remember what I need to do.", "Undo"],
    showSchedulePreview: "math207",
  },
  {
    id: 7,
    role: "user",
    text: "Thanks so much! Send me a daily event summary every morning to help me remember what I need to do.",
    next: 8,
  },
  {
    id: 8,
    role: "assistant",
    text: "Glad to help! I can send you a daily event summary everyday directly as a text message each morning at 7:30am when you wake up. (tap to undo)",
    quickReplies: ["Perfect, let's do it!", "Undo"],
    showNotifPreview: true,
  },
  {
    id: 9,
    role: "user",
    text: "Perfect, let's do it!",
    next: 10,
  },
  {
    id: 10,
    role: "assistant",
    text: "You're all set, Nathan! 🎉 Study blocks are locked in and your 7:30am daily summary texts start tomorrow. You've got a solid plan — let's crush this quarter! 💪",
    quickReplies: ["Show my full schedule", "What's due this week?", "Edit study blocks"],
  },
];

const SCHEDULE_BLOCKS = {
  info200: [
    { day: "Mon", time: "4:30–6:00PM", label: "INFO 200 Study", color: "#7C6AF7" },
    { day: "Wed", time: "4:30–6:00PM", label: "INFO 200 Study", color: "#7C6AF7" },
  ],
  math207: [
    { day: "Sat", time: "10:00–12:00PM", label: "MATH 207 Study", color: "#F7A06A" },
    { day: "Sun", time: "2:00–4:00PM", label: "MATH 207 Study", color: "#F7A06A" },
  ],
};

const TASKS = [
  { label: "INFO 200 Reading Ch. 2", due: "Today", done: false },
  { label: "MATH 207 Problem Set", due: "Thu", done: false },
  { label: "CSE 163 Lab Setup", due: "Fri", done: true },
];

const SCHEDULE = [
  { time: "9:30–10:20AM", course: "INFO 200", room: "MGH 389", color: "#7C6AF7" },
  { time: "11:30AM–12:20PM", course: "MATH 207", room: "SMI 211", color: "#F7A06A" },
  { time: "4:30–6:00PM", course: "INFO 200 Study", room: "Self-scheduled", color: "#C4B8FF" },
];

export default function WickStudyApp() {
  const [messages, setMessages] = useState([CHAT_SCRIPT[0]]);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [activeNav, setActiveNav] = useState("chat");
  const [scheduledBlocks, setScheduledBlocks] = useState([]);
  const [notifSet, setNotifSet] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addAssistantMessage = (msgId) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const msg = CHAT_SCRIPT[msgId];
      setMessages((prev) => [...prev, msg]);
      setScriptIndex(msgId);
      if (msg.showSchedulePreview === "info200") {
        setScheduledBlocks((prev) => [...prev, ...SCHEDULE_BLOCKS.info200]);
      }
      if (msg.showSchedulePreview === "math207") {
        setScheduledBlocks((prev) => [...prev, ...SCHEDULE_BLOCKS.math207]);
      }
      if (msg.showNotifPreview) {
        setNotifSet(true);
      }
    }, 1100);
  };

  const handleQuickReply = (text) => {
    if (text === "Undo") {
      setMessages((prev) => [...prev, { role: "user", text: "↩ Undo" }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          role: "assistant",
          text: "No problem! I've removed that block. Want to try a different time?",
          quickReplies: ["Try a different time", "Skip for now"],
        }]);
      }, 900);
      return;
    }

    const userMsgMap = {
      0: { text: "First week of class in the books. I need help setting up my schedule for this quarter.", nextUser: 1 },
      2: { text: "Yes. I want to study for INFO 200 right after class.", nextUser: 3 },
      4: { text: "Sounds great! Help me set aside time for my other classes too!", nextUser: 5 },
      6: { text: "Thanks so much! Send me a daily event summary every morning to help me remember what I need to do.", nextUser: 7 },
      8: { text: "Perfect, let's do it!", nextUser: 9 },
    };

    const mapping = userMsgMap[scriptIndex];
    if (mapping) {
      const userMsg = CHAT_SCRIPT[mapping.nextUser];
      setMessages((prev) => [...prev, userMsg]);
      addAssistantMessage(userMsg.next);
    } else {
      setMessages((prev) => [...prev, { role: "user", text }]);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: inputVal }]);
    setInputVal("");
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
              }}
            >
              {msg.text}
              {msg.showSchedulePreview && (
                <div style={styles.previewPill}>
                  📅 Added to your calendar
                </div>
              )}
              {msg.showNotifPreview && (
                <div style={{ ...styles.previewPill, background: "#1A2E22", color: "#6AF7C8" }}>
                  📱 Daily texts set for 7:30am
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{ ...styles.bubble, ...styles.bubbleBot, ...styles.typingBubble }}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!isTyping && lastMsg?.quickReplies && (
          <div style={styles.quickReplies}>
            {lastMsg.quickReplies.map((r) => (
              <button
                key={r}
                style={{ ...styles.quickBtn, ...(r === "Undo" ? styles.undoBtn : {}) }}
                onClick={() => handleQuickReply(r)}
              >
                {r === "Undo" ? "↩ Undo" : r}
              </button>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <input
            style={styles.input}
            placeholder="Message Wick"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button style={styles.inputIcon}>📎</button>
          <button style={styles.inputIcon}>🎙️</button>
        </div>
      </section>

      {/* Dashboard Panel */}
      <section style={styles.dashboard}>
        {/* Hero */}
        <div style={styles.hero}>
          <div style={styles.heroStars}>✦ ✦ · ✦ · ✦</div>
          <div style={styles.heroGreeting}>Hello, Nathan! ✌️</div>
          <div style={styles.heroDate}>Friday, Mar 13 · Week 2</div>
          <div style={styles.heroGlow} />
        </div>

        {/* Daily Summary */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>Study planning mode 📖</p>
          <p style={styles.cardBody}>
            Week 2 is here! I'm helping you lock in study blocks around your classes and soccer schedule. Your INFO 200 blocks are set — let's get the rest of your courses sorted too.
          </p>
          {notifSet && (
            <div style={styles.notifBadge}>📱 Daily 7:30am summaries active</div>
          )}
        </div>

        {/* Schedule Blocks */}
        {scheduledBlocks.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Scheduled study blocks</span>
              <span style={styles.seeAll}>Edit →</span>
            </div>
            {scheduledBlocks.map((b, i) => (
              <div key={i} style={{ ...styles.scheduleItem, borderLeft: `3px solid ${b.color}` }}>
                <div style={styles.scheduleTime}>{b.day} · {b.time}</div>
                <div style={styles.scheduleCourse}>{b.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div style={styles.twoCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>To do today</span>
              <span style={styles.seeAll}>See all →</span>
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

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Your schedule today</span>
              <span style={styles.seeAll}>See all →</span>
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
  previewPill: {
    marginTop: 10,
    background: "#1E1A40",
    color: "#C4B8FF",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 500,
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
  },
  undoBtn: {
    background: "transparent",
    border: "1px solid #3A2A2A",
    color: "#9980BB",
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
  notifBadge: {
    marginTop: 10,
    background: "#1A2E22",
    color: "#6AF7C8",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    display: "inline-block",
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
