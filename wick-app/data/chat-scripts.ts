import { ScriptStep } from '@/types';

// ---------------------------------------------------------------------------
// Planning Flow  (tab: Chat default)
// User asks Wick to help schedule study sessions for the quarter.
// ---------------------------------------------------------------------------
export const PLANNING_SCRIPT: ScriptStep[] = [
  {
    id: 0,
    role: 'assistant',
    text: "Hey Nathan! 👋 A week in — how's it going? What can I help you with today?",
    quickReplies: [
      "First week of class in the books. I need help setting up my schedule for this quarter.",
    ],
  },
  {
    id: 1,
    role: 'user',
    text: "First week of class in the books. I need help setting up my schedule for this quarter.",
    next: 2,
  },
  {
    id: 2,
    role: 'assistant',
    text: "Let's start with your classes. Do you have any preferences on study times?",
    quickReplies: [
      "Yes. I want to study for INFO 200 right after class",
      "No preference, surprise me",
    ],
  },
  {
    id: 3,
    role: 'user',
    text: "Yes. I want to study for INFO 200 right after class.",
    next: 4,
  },
  {
    id: 4,
    role: 'assistant',
    text: "To keep up with the expected course work for this class, I've blocked off 90 minutes on Monday/Wednesdays after class from 4:30–6pm. How does that sound? (tap to undo)",
    quickReplies: [
      "Sounds great! Help me set aside time for my other classes too!",
      "Undo",
    ],
    showSchedulePreview: 'info200',
  },
  {
    id: 5,
    role: 'user',
    text: "Sounds great! Help me set aside time for my other classes too!",
    next: 6,
  },
  {
    id: 6,
    role: 'assistant',
    text: "I've scheduled 4 hours of study time for MATH 207 over Saturday and Sunday to fit around your soccer practices and game while keeping Saturday evenings open for friends! (tap to undo)",
    quickReplies: [
      "Thanks so much! Send me a daily event summary every morning to help me remember what I need to do.",
      "Undo",
    ],
    showSchedulePreview: 'math207',
  },
  {
    id: 7,
    role: 'user',
    text: "Thanks so much! Send me a daily event summary every morning to help me remember what I need to do.",
    next: 8,
  },
  {
    id: 8,
    role: 'assistant',
    text: "Glad to help! I can send you a daily event summary everyday directly as a text message each morning at 7:30am when you wake up. (tap to undo)",
    quickReplies: ["Perfect, let's do it!", "Undo"],
    showNotifPreview: true,
  },
  {
    id: 9,
    role: 'user',
    text: "Perfect, let's do it!",
    next: 10,
  },
  {
    id: 10,
    role: 'assistant',
    text: "You're all set, Nathan! 🎉 Study blocks are locked in and your 7:30am daily summary texts start tomorrow. You've got a solid plan — let's crush this quarter! 💪",
    quickReplies: ["Show my full schedule", "What's due this week?", "Edit study blocks"],
  },
];

// ---------------------------------------------------------------------------
// Proactive Flow  (triggered from home alert card)
// Wick proactively surfaces the Informatics application deadline.
// ---------------------------------------------------------------------------
export const PROACTIVE_SCRIPT: ScriptStep[] = [
  {
    id: 0,
    role: 'assistant',
    text: "Hey Nathan, heads up: Informatics major applications open this Monday. You mentioned Informatics as your intended major — and just so you know, there are only two application cycles a year (fall and winter). If you miss this one, the next chance to apply won't be until next school year. 📅",
    quickReplies: ["Wait really? I didn't know that"],
    isProactive: true,
  },
  {
    id: 1,
    role: 'user',
    text: "Wait really? I didn't know that.",
    next: 2,
  },
  {
    id: 2,
    role: 'assistant',
    text: "Yep! The deadline to submit is Friday, Mar 20. Here's where you stand on the 4 prerequisites. The good news — grades just need to meet the minimums to qualify. What really makes you stand out is your extracurriculars and essays. And with a 3.7 GPA, you're already a strong applicant! 🌟",
    quickReplies: ["Can you walk me through what I need to do?"],
    showStatusCard: true,
  },
  {
    id: 3,
    role: 'user',
    text: "Can you walk me through what I need to do?",
    next: 4,
  },
  {
    id: 4,
    role: 'assistant',
    text: "Of course! Here's your application checklist:",
    quickReplies: ["Thanks Wick, this is super helpful!"],
    showChecklist: true,
  },
  {
    id: 5,
    role: 'user',
    text: "Thanks Wick, this is super helpful!",
    next: 6,
  },
  {
    id: 6,
    role: 'assistant',
    text: "You've got this, Nathan! 💪 I've added the application deadline to your calendar and I'll remind you Wednesday morning so you have time to review before Friday. Remember — prerequisites just get you in the door. A strong personal statement and your extracurriculars are what will really make you stand out. Good luck! 🎓",
    quickReplies: [
      "Set a reminder for Wednesday",
      "Show my full checklist",
      "What happens after I apply?",
    ],
    showDeadlineAdded: true,
  },
];

// ---------------------------------------------------------------------------
// Quick-reply → next script-step map per flow
// Maps: currentScriptIndex → { userStepId }
// ---------------------------------------------------------------------------
export const PLANNING_ADVANCE_MAP: Record<number, number> = {
  0: 1,  // assistant(0) → user(1)
  2: 3,  // assistant(2) → user(3)
  4: 5,  // assistant(4) → user(5)
  6: 7,  // assistant(6) → user(7)
  8: 9,  // assistant(8) → user(9)
};

export const PROACTIVE_ADVANCE_MAP: Record<number, number> = {
  0: 1,
  2: 3,
  4: 5,
};
