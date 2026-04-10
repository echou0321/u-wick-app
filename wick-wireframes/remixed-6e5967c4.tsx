import { useState, useRef, useEffect } from "react";

const CHAT_SCRIPT = [
  {
    id: 0,
    role: "assistant",
    text: "Hey Nathan, heads up: Informatics major applications open this Monday. You mentioned Informatics as your intended major — and just so you know, there are only two application cycles a year (fall and winter). If you miss this one, the next chance to apply won't be until next school year. 📅",
    quickReplies: ["Wait really? I didn't know that"],
    isProactive: true,
  },
  {
    id: 1,
    role: "user",
    text: "Wait really? I didn't know that.",
    next: 2,
  },
  {
    id: 2,
    role: "assistant",
    text: "Yep! The deadline to submit is Friday, Mar 20. Here's where you stand on the 4 prerequisites. The good news — grades just need to meet the minimums to qualify. What really makes you stand out is your extracurriculars and essays. And with a 3.7 GPA, you're already a strong applicant! 🌟",
    quickReplies: ["Can you walk me through what I need to do?"],
    showStatusCard: true,
  },
  {
    id: 3,
    role: "user",
    text: "Can you walk me through what I need to do?",
    next: 4,
  },
  {
    id: 4,
    role: "assistant",
    text: "Of course! Here's your application checklist:",
    quickReplies: ["Thanks Wick, this is super helpful!"],
    showChecklist: true,
  },
  {
    id: 5,
    role: "user",
    text: "Thanks Wick, this is super helpful!",
    next: 6,
  },
  {
    id: 6,
    role: "assistant",
    text: "You've got this, Nathan! 💪 I've added the application deadline to your calendar and I'll remind you Wednesday morning so you have time to review before Friday. Remember — prerequisites just get you in the door. A strong personal statement and your extracurriculars are what will really make you stand out. Good luck! 🎓",
    quickReplies: ["Set a reminder for Wednesday", "Show my full checklist", "What happens after I apply?"],
    showDeadlineAdded: true,
  },
];

const CHECKLIST = [
  { label: "Complete INFO 200 (in progress ✓)", done: false },
  { label: "Complete a programming course — INFO 201, CSE 12x, or CSE 16x series", done: false },
  { label: "Complete a social science class", done: true },
  { label: "Complete a statistics class", done: false },
  { label: "Write a compelling personal statement 🌟 (this is where you stand out!)", done: false },
  { label: "Highlight extracurriculars & activities 🌟 (key differentiator!)", done: false },
  { label: "Submit via MyUW portal before Fri, Mar 20 at 11:59pm", done: false, link: true },
];

const TASKS = [
  { label: "INFO 200 Reading Ch. 4", due: "Today", done: false },
  { label: "Informatics Application", due: "Mar 20", done: false, highlight: true },
  { label: "MATH 207 Problem Set", due: "Thu", done: false },
  { label: "CSE 163 Lab 2", due: "Fri", done: true },
];

const SCHEDULE = [
  { time: "9:30–10:20AM", course: "INFO 200", room: "MGH 389", color: "#7C6AF7" },
  { time: "11:30AM–12:20PM", course: "MATH 207", room: "SMI 211", color: "#F7A06A" },
  { time: "4:30–6:00PM", course: "INFO 200 Study", room: "Self-scheduled", color: "#C4B8FF" },
];

export default function WickGuidanceApp() {
  const [messages, setMessages] = useState([]);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [activeNav, setActiveNav] = useState("chat");
  const [showOpportunityCard, setShowOpportunityCard] = useState(true);
  const [deadlineAdded, setDeadlineAdded] = useState(false);
  const bottomRef = useRef(null);

  // Simulate Wick initiating the conversation proactively
  useEffect(() => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([CHAT_SCRIPT[0]]);
      setScriptIndex(0);
    }, 1500);
  }, []);

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
      if (msg.showDeadlineAdded) setDeadlineAdded(true);
    }, 1100);
  };

  const handleQuickReply = (text) => {
    const userMsgMap = {
      0: { nextUser: 1 },
      2: { nextUser: 3 },
      4: { nextUser: 5 },
      6: null,
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
          {/* Proactive label */}
          {messages.length > 0 && (
            <div style={styles.proactiveLabel}>✦ Wick reached out to you</div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "assistant" ? "flex-start" : "flex-end" }}>
              <div
                style={{
                  ...styles.bubble,
                  ...(msg.role === "assistant" ? styles.bubbleBot : styles.bubbleUser),
                  ...(msg.isProactive ? styles.bubbleProactive : {}),
                }}
              >
                {msg.text.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
                ))}
              </div>

              {/* Status card inline */}
              {msg.showStatusCard && (
                <div style={styles.inlineCard}>
                  <div style={styles.inlineCardTitle}>📋 Your eligibility snapshot</div>
                  {["✅ INFO 200 — in progress, on track", "✅ Computer programming — enrolled in CSE 163 ✓ (also counts: INFO 201, CSE 12x/16x series)", "✅ Social science class — completed PSYCH 101", "✅ Statistics class — enrolled in STAT 311", "🎓 GPA: 3.7 — great standing, makes you a strong applicant!"].map((item, j) => (
                    <div key={j} style={{ ...styles.inlineCardRow, color: item.startsWith("🎓") ? "#F7D06A" : "#6AF7C8" }}>{item}</div>
                  ))}
                </div>
              )}

              {/* Checklist inline */}
              {msg.showChecklist && (
                <div style={styles.inlineCard}>
                  <div style={styles.inlineCardTitle}>✅ Application checklist</div>
                  {CHECKLIST.map((item, j) => (
                    <div key={j} style={styles.checklistRow}>
                      <span style={{ color: item.done ? "#6AF7C8" : "#6B6488", fontSize: 13 }}>{item.done ? "✓" : "○"}</span>
                      <span style={{ ...styles.checklistLabel, opacity: item.done ? 0.5 : 1 }}>{item.label}</span>
                      {item.link && <span style={styles.linkTag}>Open →</span>}
                    </div>
                  ))}
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
              <button key={r} style={styles.quickBtn} onClick={() => handleQuickReply(r)}>
                {r}
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
          <div style={styles.heroDate}>Friday, Mar 13 · Week 5</div>
          <div style={styles.heroGlow} />
        </div>

        {/* Opportunity Alert Card */}
        {showOpportunityCard && (
          <div style={styles.alertCard}>
            <div style={styles.alertHeader}>
              <span style={styles.alertBadge}>🎯 Opportunity</span>
              <button style={styles.dismissBtn} onClick={() => setShowOpportunityCard(false)}>✕</button>
            </div>
            <div style={styles.alertTitle}>Informatics Application Opens Monday</div>
            <div style={styles.alertBody}>Deadline: Friday, Mar 20 · Only 2 cycles per year</div>
            {deadlineAdded && (
              <div style={styles.addedBadge}>📅 Added to your calendar</div>
            )}
          </div>
        )}

        {/* Summary */}
        <div style={styles.card}>
          <p style={styles.cardTitle}>On your radar 🔭</p>
          <p style={styles.cardBody}>
            Wick spotted something important — your Informatics application window opens Monday. With only fall and winter cycles, this is your shot. I'll keep surfacing things like this so nothing slips through.
          </p>
        </div>

        {/* Bottom row */}
        <div style={styles.twoCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>To do today</span>
              <span style={styles.seeAll}>See all →</span>
            </div>
            {TASKS.map((t, i) => (
              <div key={i} style={{ ...styles.taskRow, ...(t.highlight ? styles.taskRowHighlight : {}) }}>
                <span style={{ ...styles.taskDot, background: t.done ? "#6AF7C8" : t.highlight ? "#F7D06A" : "#7C6AF7" }} />
                <span style={{ ...styles.taskLabel, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.5 : 1 }}>
                  {t.label}
                </span>
                <span style={{ ...styles.taskDue, color: t.highlight ? "#F7D06A" : "#6B6488" }}>{t.due}</span>
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Lato:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
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
    fontFamily: "'Lato', sans-serif",
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
  proactiveLabel: {
    textAlign: "center",
    fontSize: 11,
    color: "#7C6AF7",
    padding: "6px 0 10px",
    letterSpacing: "0.5px",
    animation: "fadeUp 0.4s ease",
  },
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
    width: "fit-content",
    padding: "12px 16px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 1.6,
    animation: "fadeUp 0.3s ease",
  },
  bubbleBot: {
    background: "#1A1730",
    color: "#E8E4FF",
    borderBottomLeftRadius: 4,
  },
  bubbleProactive: {
    background: "#1E1A40",
    borderLeft: "3px solid #7C6AF7",
  },
  bubbleUser: {
    background: "#2E2660",
    color: "#E8E4FF",
    borderBottomRightRadius: 4,
  },
  inlineCard: {
    background: "#13101F",
    border: "1px solid #2E2A44",
    borderRadius: 12,
    padding: "12px 14px",
    marginTop: 6,
    marginBottom: 4,
    alignSelf: "flex-start",
    width: "88%",
    maxWidth: 320,
    animation: "slideIn 0.3s ease",
  },
  inlineCardTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#9990BB",
    marginBottom: 8,
    fontFamily: "'Syne', sans-serif",
  },
  inlineCardRow: {
    fontSize: 13,
    padding: "4px 0",
    borderBottom: "1px solid #1A1730",
  },
  checklistRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 0",
    borderBottom: "1px solid #1A1730",
  },
  checklistLabel: {
    flex: 1,
    fontSize: 12,
    color: "#C4B8FF",
  },
  linkTag: {
    fontSize: 11,
    color: "#7C6AF7",
    cursor: "pointer",
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
    fontFamily: "'Lato', sans-serif",
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
    fontFamily: "'Lato', sans-serif",
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
  alertCard: {
    background: "#1A1428",
    border: "1px solid #7C6AF7",
    borderRadius: 16,
    padding: "16px 18px",
    animation: "slideIn 0.4s ease",
  },
  alertHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  alertBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: "#7C6AF7",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "#6B6488",
    cursor: "pointer",
    fontSize: 13,
  },
  alertTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    color: "#E8E4FF",
    marginBottom: 4,
  },
  alertBody: {
    fontSize: 13,
    color: "#9990BB",
  },
  addedBadge: {
    marginTop: 10,
    background: "#1E1A40",
    color: "#C4B8FF",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    display: "inline-block",
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
  taskRowHighlight: {
    background: "rgba(247, 208, 106, 0.05)",
    borderRadius: 6,
    paddingLeft: 6,
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
