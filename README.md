# U-Wick - Academic Planning Assistant

**UW 2026 Capstone - Team FifthGear - Sponsor: Wick by Maximal Learning**

U-Wick is a chatbot-centered academic planning assistant for University of Washington students, built as a prototype for the Wick Study Planner platform. The goal of this MVP is to evaluate whether a conversational AI interface can centralize fragmented academic information and reduce the effort required for students to manage coursework, schedules, and major requirements.

---

## Prototype Scope

This repository contains a **frontend-only prototype** - no live backend or database. All data is mocked to demonstrate the three core user flows:

| Flow | Description |
|---|---|
| **Onboarding** | Wizard UI collecting academic context (major, courses) + simulated syllabus upload and Canvas connect |
| **Planning** | AI-assisted study scheduling that fits around existing commitments |
| **Proactive Guidance** | Wick proactively surfaces deadlines, eligibility info, and application checklists |

---

## Tech Stack

- **Framework:** React Native via Expo (SDK 54)
- **Routing:** Expo Router (file-based)
- **Language:** TypeScript
- **Styling:** React Native StyleSheet with centralized design tokens
- **State:** React Context API
- **Fonts:** Syne (headings) + DM Sans (body) via @expo-google-fonts

---

## Project Structure

```
wick-app/
├── app/
│   ├── (onboarding)/       # 3-step onboarding wizard
│   │   ├── index.tsx       # Major status + target major selection
│   │   ├── upload.tsx      # Syllabus upload (simulated)
│   │   └── connect.tsx     # Canvas connect (simulated)
│   ├── (tabs)/             # Main app - bottom tab navigation
│   │   ├── home.tsx        # Dashboard with tasks, schedule, alert card
│   │   ├── chat.tsx        # Chat interface (planning + proactive flows)
│   │   ├── tasks.tsx       # Full task list with toggle
│   │   └── plan.tsx        # Weekly schedule + study blocks
│   ├── _layout.tsx         # Root layout - fonts, context provider
│   └── index.tsx           # Entry redirect to onboarding
├── components/
│   ├── chat/               # ChatBubble, QuickReplies, TypingIndicator, ChatInput
│   ├── dashboard/          # HeroCard, TaskRow, ScheduleItem, AlertCard
│   └── ui/                 # Card, Badge (shared primitives)
├── constants/
│   ├── colors.ts           # All design tokens
│   └── typography.ts       # Font names and sizes
├── context/
│   └── AppContext.tsx      # Global state (tasks, schedule, chat flow mode)
├── data/
│   ├── chat-scripts.ts     # Scripted chat flows (typed)
│   ├── mock-responses.ts   # Pattern-matching intents for free-text input
│   └── mock-state.ts       # Mock tasks, schedule, user profile
├── hooks/
│   └── useChatEngine.ts    # Chat logic - scripted flow + pattern matching
└── types/
    └── index.ts            # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Expo Go installed on your phone (iOS or Android)

### Install

```bash
cd wick-app
npm install
```

### Run

```bash
npm start
```

Scan the QR code with your phone camera (iOS) or the Expo Go app (Android). Your phone and computer must be on the same Wi-Fi network.

> **Network issues?** Run `npm start -- --tunnel` to bypass local network restrictions.

### Type Check

```bash
npx tsc --noEmit
```

---

## Chat Engine

The chat interface uses two mechanisms:

1. **Scripted flows** (`data/chat-scripts.ts`) - Linear, pre-authored conversation paths for each of the three demo scenarios. Quick-reply buttons advance the script step by step.
2. **Pattern matching** (`data/mock-responses.ts`) - ~15 intent categories matched via regex against free-text input. Covers schedule, tasks, deadlines, major requirements, and more. Unrecognized input returns a graceful fallback.

The active flow (`planning` or `proactive`) is set in AppContext and drives which script the chat engine runs.

---

## Wireframe References

The original wireframes (web-only React) are preserved in the root for reference:

| File | Flow |
|---|---|
| remixed-5dd5d894.tsx | Onbocdarding (chat-based prototype) |
| remixed-62d2925e.tsx | Planning flow |
| remixed-6e5967c4.tsx | Proactive guidance flow |

---

## Team

- **Sponsor:** Wick by Maximal Learning
- **Team:** FifthGear (UW iSchool Capstone 2026)
- **Backend/API integration:** TBD pending sponsor access to test environment
