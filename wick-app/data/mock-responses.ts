// Pattern-matching mock responses for free-text chat input.
// Each entry defines keyword patterns and the response to send when matched.
// Patterns are tested in order; first match wins.

export interface MockIntent {
  patterns: RegExp[];
  response: string;
}

export const MOCK_INTENTS: MockIntent[] = [
  {
    patterns: [/\b(hi|hello|hey|sup|what'?s up)\b/i],
    response:
      "Hey! 👋 I'm Wick, your academic planning assistant. How can I help you today? You can ask me about your schedule, tasks, deadlines, or major requirements.",
  },
  {
    patterns: [/\b(schedule|calendar|class(es)?|when do i)\b/i],
    response:
      "📅 Today you have INFO 200 at 9:30am, MATH 307 at 11:30am, and CSE 163 Lab at 1:30pm. You also have an INFO 200 study block at 4:30–6pm.",
  },
  {
    patterns: [/\b(task|assignment|due|homework|hw|reading|lab)\b/i],
    response:
      "📋 Here's what's on your plate: Read INFO 200 Ch. 3 (due today), MATH 307 HW 2 (due tomorrow), and CSE 163 Lab 1 (completed ✓). Want me to add something new?",
  },
  {
    patterns: [/\b(study|block|focus|time)\b/i],
    response:
      "📖 Your study blocks are: INFO 200 on Mon/Wed 4:30–6pm, and MATH 207 on Sat 10am–12pm & Sun 2–4pm. Want to add or adjust any blocks?",
  },
  {
    patterns: [/\b(major|informatics|ischool|apply|application)\b/i],
    response:
      "🎯 You're pre-major targeting Informatics. The application window opens this Monday — deadline is March 20. You're in great shape with a 3.7 GPA. Want to see your eligibility checklist?",
  },
  {
    patterns: [/\b(prerequisite|prereq|requirement|eligible|eligib)\b/i],
    response:
      "✅ You meet all 4 prerequisites: INFO 200 (in progress), CSE 163 (programming), PSYCH 101 (social science), and STAT 311 (statistics). Your GPA of 3.7 makes you a strong applicant!",
  },
  {
    patterns: [/\b(canvas|lms|course site|portal)\b/i],
    response:
      "🔗 Your Canvas account is connected! I sync your course data automatically. If something looks off, try disconnecting and reconnecting from your profile settings.",
  },
  {
    patterns: [/\b(deadline|due date|when is|when('s)?)\b/i],
    response:
      "⏰ Upcoming deadlines: MATH 307 HW 2 (tomorrow), CSE 163 Lab 1 (Mar 8), and the Informatics Application (Mar 20). Want me to set a reminder for any of these?",
  },
  {
    patterns: [/\b(remind(er)?|notif(ication)?|alert|text)\b/i],
    response:
      "📱 Your daily 7:30am text summaries are active! I'll also remind you about the Informatics application on Wednesday morning.",
  },
  {
    patterns: [/\b(gpa|grade|score|grade point)\b/i],
    response:
      "📊 Your current GPA is 3.7 — you're in great standing! For the Informatics application, this puts you well above the typical admitted student range.",
  },
  {
    patterns: [/\b(help|what can you do|feature|option)\b/i],
    response:
      "I can help you with:\n• 📅 Your schedule & study blocks\n• ✅ Tasks & deadlines\n• 🎯 Major requirements & applications\n• 📱 Reminders & notifications\n\nJust ask!",
  },
  {
    patterns: [/\b(week|this week|quarter)\b/i],
    response:
      "📆 It's Week 2 of the quarter. You have 3 assignments this week and your INFO 200 study blocks start Monday. The quarter goes through mid-June — you've got a good pace going!",
  },
];

export const FALLBACK_RESPONSE =
  "Hmm, I didn't quite catch that. Try asking about your schedule, tasks, deadlines, or major requirements — I'm here to help! 🤔";

export function matchIntent(input: string): string {
  for (const intent of MOCK_INTENTS) {
    if (intent.patterns.some((pattern) => pattern.test(input))) {
      return intent.response;
    }
  }
  return FALLBACK_RESPONSE;
}
