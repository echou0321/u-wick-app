# U-Wick — AI Academic Planner

**UW 2026 Capstone · Team FifthGear · Sponsor: Wick by Maximal Learning**

U-Wick is a conversational AI academic planning assistant for UW students, built as a research prototype for the [Wick](https://wick.app) platform. The primary research question is whether a conversational AI interface reduces friction in academic planning compared to a traditional planner.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript (strict) |
| Routing | Expo Router v6 (file-based) |
| Server state | TanStack React Query v5 |
| UI state | Zustand v4 |
| HTTP | Axios (single instance with JWT interceptor) |
| Auth storage | Expo SecureStore |
| Chat streaming | SSE via `fetch` ReadableStream |
| Push notifications | Expo Notifications (requires EAS Build) |

---

## Project Structure

```
app/
  _layout.tsx              ← Root layout: QueryClient, font loading, Stack nav
  index.tsx                ← Redirects to /splash
  splash.tsx               ← Auth gate + animated splash
  (auth)/
    login.tsx
    register.tsx
  (onboarding)/
    profile.tsx            ← quarter, enrollment status, major
    notifications.tsx      ← push permission + onboarding complete
  (tabs)/
    _layout.tsx            ← Tab bar + CoachMarkWizard overlay
    chat/index.tsx
    todo/index.tsx
    schedule/index.tsx
    profile/index.tsx

src/
  api/                     ← One file per backend route group
    client.ts              ← Axios instance + JWT interceptor
    auth.ts
    users.ts
    ics.ts
    sessions.ts
  stores/                  ← Zustand stores
    authStore.ts           ← token, userId
    chatStore.ts           ← activeFlow, per-flow message histories
    uiStore.ts             ← heatMapVisible, wizard state, offlineMode
  wizard/                  ← Coach mark tutorial overlay (runs once)
    CoachMarkWizard.tsx
    WizardStep1.tsx        ← Connect Canvas
    WizardStep2.tsx        ← First chat interaction
    WizardStep3.tsx        ← Feature discovery
  components/
    chat/                  ← ChatBubble, ChatInput, TypingIndicator
    ui/                    ← Card, Badge
  styles/                  ← Shared StyleSheet files
    forms.ts               ← auth + onboarding screens
    tabs.ts                ← tab bar + tab screens
    components.ts          ← generic UI primitives
    chat.ts                ← chat bubbles + input
    wizard.ts              ← wizard overlay + cards
  types/
    api.ts                 ← All API response interfaces

constants/
  colors.ts                ← Full design system palette
  typography.ts            ← Syne + DM Sans font config
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo Go (for device testing without push notifications)
- `.env.local` at the project root (see below)

### Environment

Create `.env.local` (never committed):

```bash
EXPO_PUBLIC_API_URL=https://u-wick-api-hxaketgeedg9cjcr.centralus-01.azurewebsites.net/api
```

For local backend: `EXPO_PUBLIC_API_URL=http://localhost:3000/api`

### Install & Run

```bash
npm install
npm start
```

Scan the QR code with Expo Go. Your phone and computer must be on the same Wi-Fi network. Use `npm start -- --tunnel` if on a restricted network.

### Type Check

```bash
npx tsc --noEmit
```

### Tests

```bash
npx expo test
```

---

## Key Conventions

- All API calls go through `src/api/client.ts` (Axios). Exception: `POST /chat` uses `fetch` directly for SSE streaming.
- Server state lives in React Query. Never use Context or `useState` for API data.
- UI state lives in Zustand (`uiStore`, `chatStore`). Auth token lives in `authStore` + SecureStore.
- Every new screen/hook gets a test file immediately (RNTL + `renderHook`).
- Styles go in `src/styles/` — never inline `StyleSheet.create()` in a screen or component file.

---

## Team

- **Sponsor:** Wick by Maximal Learning
- **Team:** FifthGear (UW iSchool Capstone 2026)
