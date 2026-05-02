# U-Wick Frontend Design Document

**FifthGear Team · University of Washington · Capstone 2026**
Built in partnership with Maximal Learning, Inc. — [Wick](https://wick.app)

**Version 1.0 · Status: Pre-Development · May 2026**

> This document assumes the backend is complete as described in `docs/design.md`. All API routes, SSE behavior, and data shapes referenced here are defined there. This doc covers only the frontend: screens, navigation, state management, and integration patterns.

---

## 1. Overview

U-Wick's frontend is a React Native + Expo application written in **TypeScript**. It consumes the U-Wick REST API and renders a conversational AI academic planner with four core tabs: Chat, TODO, Schedule, and Profile.

The primary research question is whether a conversational AI interface reduces friction in academic planning compared to a traditional planner (Wick). The frontend must make the AI feel approachable — not like a chatbot bolted onto a planner — while giving researchers clean behavioral logging through session events.

---

## 2. Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Language | TypeScript | 5.x | Strict mode enabled |
| Framework | React Native + Expo | RN 0.81 / Expo 54 | Managed workflow |
| Routing | Expo Router | v6 | File-based; `(auth)`, `(onboarding)`, `(tabs)` groups |
| Server State | TanStack React Query | v5 | Tasks, schedule, user, majors, syllabus |
| UI State | Zustand | v4 | Heat map toggle, chat flow, wizard state, offline flag |
| Auth Storage | Expo SecureStore | SDK 54 | JWT persistence across app launches |
| HTTP Client | Axios | Latest | Central instance with JWT interceptor |
| Push Notifications | Expo Notifications | SDK 54 | Requires EAS Build for physical devices |
| Offline Detection | `@react-native-community/netinfo` | Latest | Gates chat tab and API mutations |
| Calendar UI | `react-native-calendars` | Latest | Schedule tab week/month view |
| Bottom Sheets | `@gorhom/bottom-sheet` | v4 | Coach mark wizard, create/edit sheets |
| Icons | `@expo/vector-icons` | SDK 54 | Ionicons set |

> ⚠️ **EAS Build required** for push notifications. Expo Go does not support push in SDK 54+. Set this up before physical device testing — it can take time to configure.

---

## 3. Project File Structure

```
app/
  _layout.tsx                      ← Root layout: QueryClient provider, Zustand, auth gate
  index.tsx                        ← Redirect: splash → /(auth)/login or /(tabs)/chat
  splash.tsx                       ← 🎨 DESIGN NEEDED — see Section 5
  (auth)/
    _layout.tsx
    login.tsx                      ← Email + password login
    register.tsx                   ← Register: email, password, display_name
  (onboarding)/
    _layout.tsx
    profile.tsx                    ← display_name, major, enrollment_status, current_quarter
    notifications.tsx              ← Expo push permission request + PATCH /me/push-token
  (tabs)/
    _layout.tsx                    ← Tab bar: Chat, TODO, Schedule, Profile
    chat/
      index.tsx                    ← Main chat screen
    todo/
      index.tsx                    ← Task list
      [id].tsx                     ← Task detail: subtasks, edit, delete
    schedule/
      index.tsx                    ← Calendar + heat map toggle
    profile/
      index.tsx                    ← Profile overview
      edit.tsx                     ← Edit display_name, major, enrollment_status, quarter
      courses.tsx                  ← My courses + syllabus upload entry points
      syllabus-upload.tsx          ← Upload PDF, poll status, confirm extracted tasks
      major-goals.tsx              ← Major goals list (pre-major only)
      major-goals/
        [id].tsx                   ← Goal detail: checklist, deadline countdown

src/
  api/
    client.ts                      ← Axios instance, base URL, JWT interceptor, 401 handler
    auth.ts                        ← register(), login()
    users.ts                       ← getMe(), updateMe(), completeOnboarding(), updatePushToken()
    ics.ts                         ← connectIcs(), syncIcs(), getIcsStatus()
    tasks.ts                       ← getTasks(), updateTask(), deleteTask()
    schedule.ts                    ← getSchedule(), createBlock(), updateBlock(), deleteBlock(), getHeat()
    chat.ts                        ← getChatHistory(), deleteChatHistory()
    sessions.ts                    ← startSession(), logEvent(), endSession()
    majors.ts                      ← getMajors(), getMajor()
    goals.ts                       ← createMajorGoal(), getMajorGoals(), updateMajorGoal(), updateChecklist()
    syllabus.ts                    ← uploadSyllabus(), getSyllabusStatus(), confirmSyllabus(), getSyllabi()
  hooks/
    useUser.ts                     ← React Query: GET /users/me
    useTasks.ts                    ← React Query: GET /tasks
    useSchedule.ts                 ← React Query: GET /schedule
    useHeat.ts                     ← React Query: GET /schedule/heat
    useMajors.ts                   ← React Query: GET /majors
    useMajorGoals.ts               ← React Query: GET /goals/major
    useChatHistory.ts              ← React Query: GET /chat/history?flow=
    useSyllabi.ts                  ← React Query: GET /syllabus
    useIcsStatus.ts                ← React Query: GET /ics/status
    useChatStream.ts               ← SSE stream handler: tokens, side_effects, done
    useSession.ts                  ← Session lifecycle: start, log, end
    useNetworkStatus.ts            ← NetInfo online/offline flag
  stores/
    uiStore.ts                     ← Zustand: heat map toggle, offline flag, wizard state
    chatStore.ts                   ← Zustand: active flow, conversation history per flow
    authStore.ts                   ← Zustand: JWT token, user id, clear on logout
  components/
    chat/
      ChatBubble.tsx
      ChatInput.tsx
      FlowPill.tsx                 ← Flow mode badge (e.g. "Planning mode")
      ShortcutBar.tsx              ← Quick action buttons that set flow mode
      TypingIndicator.tsx
    todo/
      TaskRow.tsx
      SubtaskRow.tsx
      TaskFilterBar.tsx
    schedule/
      WeekCalendar.tsx
      HeatMapBar.tsx               ← Colored bar above calendar
      BlockCard.tsx
    profile/
      MajorGoalCard.tsx            ← Pre-major only
      ChecklistItem.tsx
      SyllabusCard.tsx
    shared/
      OfflineBanner.tsx
      LoadingSpinner.tsx
      ErrorToast.tsx
      SkipButton.tsx
  wizard/
    CoachMarkWizard.tsx            ← Tutorial overlay orchestrator (see Section 8)
    WizardStep1.tsx                ← Schedule tab: connect Canvas
    WizardStep2.tsx                ← Chat tab: first message
    WizardStep3.tsx                ← Feature discovery card
  constants/
    flows.ts                       ← FlowMode constants + shortcut trigger map
    weights.ts                     ← Task weight reference (mirrors backend doc Section 7.3)
    colors.ts                      ← Heat map colors + app palette
  types/
    api.ts                         ← TypeScript interfaces for all API response shapes
    navigation.ts                  ← Expo Router typed route params
```

---

## 4. Navigation & Auth Gate

### Root Layout (`app/_layout.tsx`)

On every cold launch, the root layout performs a synchronous auth check before rendering any screen:

1. Read JWT from `SecureStore`
2. If missing → redirect to `/(auth)/login`
3. If present → decode client-side and check `exp` field (no API call needed)
4. If expired → clear `authStore`, redirect to `/(auth)/login`
5. If valid → load user from `authStore` (or fetch `GET /users/me` if not cached)
6. If `onboarding_complete === false` → redirect to `/(onboarding)/profile`
7. If `onboarding_complete === true` → redirect to `/(tabs)/chat`
8. If tabs destination and `wizardCompleted === false` in AsyncStorage → launch coach mark wizard overlay after tabs mount

```
App Launch
    │
    ▼
SecureStore has JWT?
    │ No → /(auth)/login
    │ Yes
    ▼
JWT expired?
    │ Yes → clear auth → /(auth)/login
    │ No
    ▼
onboarding_complete?
    │ No → /(onboarding)/profile
    │ Yes
    ▼
/(tabs)/chat
    │
    ▼
wizardCompleted?
    │ No → launch CoachMarkWizard overlay
    │ Yes → normal app
```

---

## 5. Splash Screen

`app/splash.tsx` is the first screen visible on cold launch while the auth check runs in the background.

### Layout

```
┌─────────────────────────────────────┐
│                    [purple glow orb] │  ← top-right, 420×420, rgba(124,106,247,0.13)
│  [mid-left glow]                    │  ← 220×220, rgba(180,100,255,0.09)
│                                     │
│              ✦                      │  ← 20pt, Colors.primary, letterSpacing 3
│            Wick                     │  ← 58pt, Syne_800ExtraBold, Colors.primaryLight
│    Your AI academic planner         │  ← 14pt, DM Sans, Colors.textMuted
│                                     │
│                   [teal glow orb]   │  ← bottom-right, 200×200, rgba(106,247,200,0.07)
│                                     │
│              ● ● ●                  │  ← loading dots, 5pt, Colors.primary, absolute bottom 60
└─────────────────────────────────────┘
```

### Animation

1. On mount: wordmark lockup springs up from `translateY: 28` → `0` with `tension: 55, friction: 9`, simultaneously fading from `0` → `1` over 650ms
2. Tagline fades in 220ms after the wordmark animation starts (separate `Animated.Value`)
3. Three loading dots pulse opacity `0.2` → `1` → `0.2` in a staggered loop (180ms apart), giving a left-to-right wave

### Timing

- Maximum display: 1500ms
- In production: transitions as soon as the auth check in `app/_layout.tsx` resolves — whichever comes first
- For now (prototype): `setTimeout(() => router.replace('/(onboarding)'), 1500)`

### Colors used

| Element | Value |
|---|---|
| Background | `Colors.bg` `#0F0D1A` |
| Wordmark | `Colors.primaryLight` `#C4B8FF` |
| Star mark + dots | `Colors.primary` `#7C6AF7` |
| Tagline | `Colors.textMuted` `#6B6488` |
| Top-right orb | `rgba(124, 106, 247, 0.13)` |
| Mid-left orb | `rgba(180, 100, 255, 0.09)` |
| Bottom-right orb | `rgba(106, 247, 200, 0.07)` |

> If the UX designer wants to iterate: all values above live in `app/splash.tsx` styles and `constants/colors.ts`. The glow orbs are plain `View` components with `borderRadius: 9999` — no `expo-linear-gradient` dependency needed.

---

## 6. Auth Screens

### Login (`(auth)/login.tsx`)

- Fields: email, password
- On submit: `POST /api/auth/login` → store `{ token, user }` in `authStore` + SecureStore → navigate per Section 4 gate
- "Don't have an account? Register" link
- Inline field validation: non-empty, valid email format
- Loading state on submit button while request is in-flight
- Error toast on 401: "Incorrect email or password"

### Register (`(auth)/register.tsx`)

- Fields: display_name, email, password, confirm password
- On submit: `POST /api/auth/register` → store token → navigate to `/(onboarding)/profile`
- Validation: passwords match, password min 8 characters, valid email format
- Error toast on 409: "An account with that email already exists"

Both screens share a consistent layout: logo at top, card-style form, full-width submit button.

---

## 7. Onboarding Flow

Onboarding is a minimal 2-screen flow that runs once after registration. ICS connection and feature discovery happen in the coach mark wizard (Section 8) so onboarding stays fast and focused.

### Screen 1 — Profile Setup (`(onboarding)/profile.tsx`)

Fields:
- `current_quarter` — text input (e.g. "Spring 2026") with placeholder; or a simple picker with common UW quarters
- `enrollment_status` — segmented control: **Pre-major** | **In major**
- `major` — text input, optional at this stage, helper text: "You can add this later"

`display_name` is already captured at registration; not repeated here.

On submit: `PATCH /api/users/me` with `{ current_quarter, enrollment_status, major }` → navigate to `/(onboarding)/notifications`

### Screen 2 — Notifications (`(onboarding)/notifications.tsx`)

- Explanation section: what push notifications are used for:
  - Morning digest of today's tasks
  - "Start this now" nudges for upcoming high-weight assignments
  - Major application deadline reminders
- **"Enable Notifications"** primary button:
  1. Call `Expo.requestPermissionsAsync()`
  2. On grant: call `Expo.getExpoPushTokenAsync()`, then `PATCH /api/users/me/push-token` with `{ expoPushToken }`
  3. Navigate forward
- **"Skip for now"** secondary link — skippable; notifications can be enabled later from Profile → Notifications
- On completion (either path):
  1. `POST /api/users/me/onboarding/complete`
  2. `POST /api/sessions/start` with `{ flow: 'free', platform, app_version }`
  3. Navigate to `/(tabs)/chat`

---

## 8. Coach Mark Tutorial Wizard

> This is entirely frontend — zero new backend routes needed.

### Overview

After a new user's first arrival at `/(tabs)`, a 3-step coach mark wizard launches as a semi-transparent overlay on top of the live app. It runs exactly once. State is tracked in Zustand (`uiStore.wizardStep`) and persisted to AsyncStorage (`wizard_completed`) so it never shows again after completion or explicit dismissal.

**Implementation approach:**
- Custom overlay using `react-native-modal` or a full-screen `View` with `position: absolute`
- Semi-transparent backdrop (`rgba(0,0,0,0.6)`) with a circular or rectangular "spotlight" cutout rendered via SVG clip path to highlight specific UI elements
- Tooltip cards rendered via `@gorhom/bottom-sheet` at 30% snap point
- Navigation between steps driven by Zustand `uiStore.advanceWizard()`
- "Skip tutorial" link visible on Steps 1 and 2 — immediately calls `uiStore.completeWizard()` and writes `wizard_completed = true` to AsyncStorage

---

### Step 1 — Connect Canvas (Schedule Tab)

**What happens:**
1. Wizard mounts; app programmatically navigates to `/(tabs)/schedule`
2. Spotlight highlights the calendar area
3. Bottom sheet tooltip appears

**Tooltip content:**
- **Title:** "Import your Canvas calendar"
- **Body:** "Paste your Canvas ICS URL to pull in all your assignments and due dates automatically. You can find it in Canvas under Calendar → Feed."
- **Primary CTA:** "Connect Canvas"
- **Secondary link:** "Skip"

**On "Connect Canvas" tap:**
1. Open a modal with a single labeled text input: "Canvas ICS URL"
2. Placeholder: `https://canvas.uw.edu/feeds/calendars/...`
3. Submit calls `POST /api/ics/connect` with `{ icsUrl }`
4. Loading spinner on submit button while request is in-flight
5. On success: dismiss modal, show success toast: "Synced X tasks from Canvas!"
6. Schedule calendar populates with real data
7. Advance wizard to Step 2

**On "Skip" tap:**
- Advance wizard to Step 2 without connecting ICS (user can connect later from Profile)

---

### Step 2 — First Chat Interaction (Chat Tab)

**What happens:**
1. App programmatically navigates to `/(tabs)/chat`
2. Spotlight highlights the message input bar
3. Bottom sheet tooltip appears

**Tooltip content:**
- **Title:** "Ask U-Wick anything"
- **Body:** "U-Wick can answer questions about your schedule, suggest when to study, and help you plan your quarter."
- **Primary CTA:** "Ask now"
- **Secondary link:** "Skip"

**On "Ask now" tap:**
1. Dismiss tooltip
2. Pre-fill chat input with: `"What do I have going on next week?"`
3. Focus the input so the keyboard appears
4. The user taps Send themselves — never auto-send (preserves user agency)
5. Chat response streams in via SSE normally
6. After the `done` SSE event fires, wizard auto-advances to Step 3

**On "Skip" tap:**
- Advance to Step 3 immediately

---

### Step 3 — Feature Discovery Card

**What happens:**
- Full-screen bottom sheet (no spotlight backdrop — just a card over the live app)
- No "Skip" link; only a single CTA to dismiss

**Card content:**
- **Title:** "Here's what else U-Wick can do"
- Three feature rows (icon + title + one-line body):

| Icon | Title | Body |
|---|---|---|
| calendar-outline | Schedule tasks | "Ask me to block study time before your next exam or paper." |
| school-outline | Major advising | "Ask about prerequisites and application deadlines for your target major." |
| notifications-outline | Proactive reminders | "I'll nudge you when a big assignment is coming up with no study time planned." |

- **Primary CTA:** "Let's go"
  1. Dismiss bottom sheet
  2. `uiStore.completeWizard()` → sets `wizardCompleted = true`
  3. Writes `wizard_completed = true` to AsyncStorage

---

### Wizard Zustand State

```typescript
// src/stores/uiStore.ts (wizard slice)
interface WizardSlice {
  wizardStep: 0 | 1 | 2 | 3;   // 0 = not started, 3 = complete
  wizardCompleted: boolean;
  advanceWizard: () => void;
  completeWizard: () => void;
}
```

`wizardCompleted` is persisted via Zustand `persist` middleware with AsyncStorage adapter.

---

## 9. Tab Architecture

Four tabs rendered by `(tabs)/_layout.tsx`:

| Tab | Icon | Route | Default |
|---|---|---|---|
| Chat | `chatbubble-outline` | `/(tabs)/chat` | Yes — first tab on launch |
| TODO | `checkmark-circle-outline` | `/(tabs)/todo` | |
| Schedule | `calendar-outline` | `/(tabs)/schedule` | |
| Profile | `person-outline` | `/(tabs)/profile` | |

Major advising lives inside the Chat tab (via the "Major advising" shortcut and Claude context injection). There is no standalone Majors tab.

The tab bar hides automatically when a nested stack screen is active (e.g. task detail, syllabus upload, major goal detail) using Expo Router's `tabBarStyle` hide pattern.

---

## 10. Chat Tab (`/(tabs)/chat`)

### Layout

```
┌─────────────────────────────────────┐
│  [Flow Pill]            [Clear  ↺]  │  ← header
├─────────────────────────────────────┤
│                                     │
│          conversation history       │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  ← [Plan week] [Plan quarter] [→]  │  ← ShortcutBar (scrollable)
├─────────────────────────────────────┤
│  [  message input          ] [Send] │
└─────────────────────────────────────┘
```

### Flow Pill (`FlowPill.tsx`)

Displayed as a small colored pill badge in the chat header. Shows the active flow mode in user-friendly language:

| `FlowMode` value | Displayed label |
|---|---|
| `free` | Chat |
| `planning` | Planning mode |
| `advising` | Advising mode |
| `quarter_planning` | Quarter planning |
| `proactive` | Check-in |

Tapping the pill opens a bottom sheet with a one-line description of the current mode and the option to switch manually. This is a **nice-to-have** for MVP — the shortcut bar covers flow switching for the user study.

### Shortcut Bar (`ShortcutBar.tsx`)

Horizontally scrollable row of pill buttons rendered above the message input. Each button sets the active flow in `chatStore` and optionally pre-fills the chat input with a starter message (the user can edit before sending):

| Button Label | Sets Flow | Pre-fill Text |
|---|---|---|
| Plan my week | `planning` | "Help me plan my study schedule for this week" |
| Plan my quarter | `quarter_planning` | "Let's plan out my whole quarter" |
| Major advising | `advising` | "Tell me about requirements for my target major" |
| Am I on track? | `free` | "Am I on track with my coursework this week?" |
| Start this now | `free` | "What should I work on right now?" |

The `advising` shortcut is hidden when `enrollment_status === 'in-major'` (in-major students can still ask Claude freely, but the prompt shortcut is not surfaced).

### Conversation History

- Loaded on mount via `useChatHistory(activeFlow)` → `GET /chat/history?flow=`
- History is **per flow** — switching flows shows that flow's history
- User messages: right-aligned bubble, app primary color
- Claude responses: left-aligned bubble, neutral background, markdown rendered (bold, lists, line breaks)
- `TypingIndicator` (three animated dots) shown while SSE stream is in progress, hidden on `done` event
- Conversation scrolls to bottom on new message and on each incoming token

### Clear Conversation

- Top-right header icon button
- Confirmation `Alert`: "Clear this conversation? This can't be undone."
- On confirm: `DELETE /api/chat/history` with `{ flow: activeFlow }` → clears `chatStore.histories[activeFlow]` → React Query invalidates `['chat', activeFlow]`

### Session Logging

- `POST /sessions/start` on Chat tab mount if no active session exists (session may already be open from onboarding)
- After each SSE `done` event: `logEvent('chat_turn', { flow, message_length, response_time_ms, side_effects_triggered })`
- `POST /sessions/end` on `AppState` change to `background` or tab unmount

### Offline State

If `useNetworkStatus()` returns `offline`:
- `OfflineBanner` shown at top of screen
- Chat input and Send button disabled
- Message below input: "Chat is unavailable offline."
- Cached conversation history (React Query) remains visible and readable

---

## 11. Chat SSE Integration (`src/hooks/useChatStream.ts`)

This hook manages the complete lifecycle of a single chat turn, from send through streaming through side-effect application.

### Sending a Message

```typescript
async function sendMessage(message: string, flow: FlowMode): Promise<void>
```

1. Append user message to `chatStore.histories[flow]` immediately (optimistic — feels instant)
2. Record `turnStartTime = Date.now()`
3. POST to `/api/chat` with `{ message, flow, conversationHistory: chatStore.histories[flow] }` via `fetch` (not Axios — fetch supports streaming in React Native)
4. Open response body as `ReadableStream`

### Token Events

On each `data: { type: 'token', content }` SSE event:
- Append `content` to the in-progress assistant chat bubble
- The bubble renders each token as it arrives — no waiting for the full response

### Side Effect Events

On `data: { type: 'side_effects', actions: [...] }` SSE event, apply optimistic updates immediately before server confirms persistence:

| Action | Optimistic Update | React Query Invalidation |
|---|---|---|
| `add_study_blocks` | Add blocks to `['schedule']` cache | `['schedule']`, `['heat']` |
| `breakdown_task` | Add subtasks to `['tasks', taskId]` cache | `['tasks']` |
| `complete_task` | Set `done: true` in `['tasks']` cache | `['tasks']` |
| `add_task` | Prepend new task to `['tasks']` cache | `['tasks']` |
| `schedule_alert` | No optimistic UI change (notification queued) | — |
| `update_checklist` | Update step in `['goals']` cache | `['goals']` |
| `set_notif_active` | Trigger `Expo.requestPermissionsAsync()` flow | `['user']` |

Show a subtle inline confirmation in the assistant bubble footer after side effects are applied: e.g. "✓ Added 2 study blocks to your schedule."

### Done Event

On `data: { type: 'done' }` SSE event:
1. Hide `TypingIndicator`
2. Finalize the assistant message in `chatStore.histories[flow]`
3. Log `chat_turn` session event with `response_time_ms = Date.now() - turnStartTime`
4. Trigger React Query refetch for any resources mutated by side effects

### Error Handling

- Network error mid-stream: show `ErrorToast` — "Message failed. Try again."
- Roll back the optimistic user message from `chatStore`
- Do not retry automatically — let the user re-send

---

## 12. TODO Tab (`/(tabs)/todo`)

### Task List (`todo/index.tsx`)

- React Query: `useTasks()` → `GET /tasks?done=false` on mount
- Pull-to-refresh calls React Query `refetch()`
- Tasks grouped by course; course name rendered as section header with course color dot
- Each `TaskRow` displays:
  - Task title
  - Due date (relative: "Due tomorrow", "Due in 3 days", or absolute if >7 days out)
  - Course color indicator
  - Weight badge: "Exam", "Paper", "Quiz", etc. (derived from `weight` value per backend Section 7.3)
  - Highlighted star icon (tappable: `PATCH /tasks/:id` with `{ highlighted }`)
- Tap row → navigate to `/(tabs)/todo/[id]`
- Swipe left to reveal delete action:
  - Manual/AI/syllabus tasks: hard delete with confirmation → `DELETE /tasks/:id`
  - ICS tasks: soft delete (sets `done = true`) — show tooltip "ICS tasks will re-appear on next Canvas sync unless removed in Canvas"
- Filter bar at top: **All** | **This Week** | **Highlighted**
- "Show completed" toggle at bottom of list — fetches `GET /tasks?done=true` when active
- Logs `task_completed` session event when a task's `done` is toggled to `true`

### Task Detail (`todo/[id].tsx`)

- Full task info: title, due date, course, weight, source badge
- Subtasks section: shows Claude-generated subtask checklist if `breakdown_task` side effect has been applied
  - Each `SubtaskRow` has a checkbox → `PATCH /tasks/:id` for done toggle
  - Shows suggested start time if present
- "Break this down" button:
  - **Blocked until Anthropic API key received** — show disabled state with tooltip: "AI features coming soon"
  - When unblocked: `POST /tasks/:id/breakdown` → log `task_breakdown_requested` session event
- Edit inline: title, due date, weight — `PATCH /tasks/:id` on blur/confirm
- Logs `task_completed` session event on done toggle

---

## 13. Schedule Tab (`/(tabs)/schedule`)

### Layout

```
┌─────────────────────────────────────┐
│  [████ ████ ████ ████ ████ ████ ██] │  ← HeatMapBar (8 weeks, colored segments)
│  Workload                    [ ◐ ]  │  ← toggle switch
├─────────────────────────────────────┤
│                                     │
│        Week Calendar View           │
│     (react-native-calendars)        │
│                                     │
│   [+ Add block]  (header action)    │
├─────────────────────────────────────┤
│   Today's blocks                    │
│   ┌────────────────────────────┐    │
│   │ 10–11am  Study: INFO 201   │    │
│   └────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Heat Map Bar (`HeatMapBar.tsx`)

- Rendered above the calendar when `uiStore.heatMapVisible === true`
- Data from `useHeat()` → `GET /schedule/heat?start=<quarterStart>&weeks=8`
- 8 equally-sized colored segments, one per week, using backend-provided `color` field:
  - `light` → `#6AF7C8` (teal)
  - `moderate` → `#F7D06A` (yellow)
  - `heavy` → `#F7A06A` (orange)
  - `intense` → `#F76A6A` (red)
- Tapping a segment scrolls the calendar to that week
- Label tooltip on long-press: "Week of Apr 13 — Intense" (uses `label` + `week_start` from backend response)
- Toggle switch labeled "Workload" in the row below the bar
  - State stored in `uiStore.heatMapVisible`, persisted to AsyncStorage via Zustand `persist`
  - Toggling logs `heat_map_toggled` session event

### Calendar

- Week view by default; week/month toggle available in header
- Blocks fetched via `useSchedule()` → `GET /schedule?start=&end=` for the visible date range
- Three block types rendered with distinct styles:
  - `class` — solid color, no edit (ICS-sourced)
  - `study` — lighter fill, editable
  - `commitment` — striped or border-only style
- Tapping a study/commitment block opens an edit bottom sheet:
  - Edit: title, start_time, end_time, color
  - `PATCH /schedule/blocks/:id` on save
  - Delete button: `DELETE /schedule/blocks/:id` with confirmation
- Long-pressing an empty time slot opens a create block bottom sheet:
  - Fields: title, start_time, end_time, block_type, color
  - `POST /schedule/blocks` on save
- "+" button in header also opens create block sheet
- React Query invalidates `['schedule']` and `['heat']` after any block mutation

### Offline State

- Calendar and blocks render from React Query cache when offline
- Create / edit / delete actions disabled; `OfflineBanner` shown at top

---

## 14. Profile Tab (`/(tabs)/profile`)

### Profile Index (`profile/index.tsx`)

- Displays: avatar initials placeholder, `display_name`, `email`, `major`, `enrollment_status`, `current_quarter`
- Navigation links:
  - **Edit Profile** → `profile/edit.tsx`
  - **My Courses** → `profile/courses.tsx` (always visible)
  - **Major Goals** → `profile/major-goals.tsx` (only shown if `enrollment_status === 'pre-major'`)
  - **Notifications** → toggle `notif_active` or re-request permission if not granted
  - **ICS Status** → shows `ics_last_synced` timestamp + manual "Sync now" button → `POST /ics/sync`
- **Logout** button at bottom → `Alert` confirmation → clears JWT from SecureStore, clears `authStore`, navigates to `/(auth)/login`

**In-major enrollment display:**
If `enrollment_status === 'in-major'`, show a simple "My Major" info card on this screen:
- Major name
- Enrollment status badge
- No checklist, no goals list, no application deadline

### Edit Profile (`profile/edit.tsx`)

- Editable fields: `display_name`, `major`, `enrollment_status`, `current_quarter`
- `PATCH /api/users/me` on save
- React Query invalidates `['user']` on success
- Changing `enrollment_status` from `pre-major` to `in-major` will hide Major Goals section — show a confirmation: "This will hide your major goal checklists. You can switch back at any time."

### My Courses (`profile/courses.tsx`)

- Lists all courses derived from the React Query tasks cache (group tasks by `course_id`; display course `name` and `code`)
- Each course card shows:
  - Course name and code
  - Quarter
  - Color dot (from `courses` table)
  - Syllabus status badge: `none` | `pending` | `extracting` | `ready` | `failed` (sourced from `useSyllabi()`)
  - "Upload Syllabus" button → navigate to `profile/syllabus-upload.tsx?courseId=`
  - If syllabus is `ready`: "View tasks" link to filtered TODO tab for that course

### Major Goals (`profile/major-goals.tsx`)

> Only rendered if `enrollment_status === 'pre-major'`. In-major users see the simple card on Profile index instead.

- Lists all goals from `useMajorGoals()` → `GET /goals/major?status=active`
- Each `MajorGoalCard` shows:
  - Major name
  - Deadline countdown (e.g. "47 days until application deadline")
  - Checklist progress bar: "3 of 7 steps complete"
  - Status badge: `active` | `achieved`
- "Add major goal" button:
  1. Opens bottom sheet with searchable list of majors from `GET /majors`
  2. User selects a major → `POST /goals/major` with `{ majorReqId }`
  3. Backend guards against duplicate active goals for same major
  4. Log `major_goal_set` session event
- Swipe left on a goal → "Drop goal" → `PATCH /goals/major/:id` with `{ status: 'dropped' }` (row retained for research history)
- "Show dropped goals" toggle at bottom

### Major Goal Detail (`profile/major-goals/[id].tsx`)

- Full checklist from `major_requirements.checklist_steps` cross-referenced with `student_major_goals.checklist_progress`
- Each `ChecklistItem` shows:
  - Step title
  - Checkbox: tapping calls `PATCH /goals/major/:id/checklist`
  - Step can also be updated via Claude's `update_checklist` side effect in chat
- Deadline countdown banner: "47 days until application deadline" — prominent, colored by urgency (green/yellow/red)
- Info section: minimum GPA, prerequisites list (from `major_requirements.prereqs` JSONB), application deadline, department notes
- Source URL link: "View on UW website" (from `major_requirements.source_url`)
- "Mark as achieved" button → `PATCH /goals/major/:id` with `{ status: 'achieved' }`

---

## 15. State Management

### React Query — Server State

React Query owns all data that originates from the API. It handles caching, background refetching, loading/error states, and cache invalidation.

```typescript
// src/hooks/useUser.ts
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.users.getMe(),
    staleTime: 5 * 60 * 1000,
  });
}

// src/hooks/useTasks.ts
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.tasks.getTasks(filters),
    staleTime: 2 * 60 * 1000,
  });
}
```

| Query Key | Hook | Stale Time | Notes |
|---|---|---|---|
| `['user']` | `useUser` | 5 min | Invalidated on `PATCH /me` |
| `['tasks', filters]` | `useTasks` | 2 min | Invalidated on side effects + task mutations |
| `['schedule', range]` | `useSchedule` | 2 min | Invalidated on block mutations + side effects |
| `['heat', start, weeks]` | `useHeat` | 10 min | Invalidated after task or block changes |
| `['majors']` | `useMajors` | 60 min | Rarely changes; one-time scrape data |
| `['goals']` | `useMajorGoals` | 5 min | Invalidated on checklist side effects |
| `['chat', flow]` | `useChatHistory` | 0 | Always fresh on mount; appended locally during stream |
| `['syllabi']` | `useSyllabi` | 5 min | Polled during extraction (`refetchInterval: 3000`) |
| `['ics-status']` | `useIcsStatus` | 5 min | |

### Zustand — UI State

Zustand owns ephemeral client state that does not come from the server.

```typescript
// src/stores/uiStore.ts
interface UIStore {
  heatMapVisible: boolean;
  offlineMode: boolean;
  wizardStep: 0 | 1 | 2 | 3;
  wizardCompleted: boolean;
  toggleHeatMap: () => void;
  setOfflineMode: (v: boolean) => void;
  advanceWizard: () => void;
  completeWizard: () => void;
}

// src/stores/chatStore.ts
export type FlowMode = 'planning' | 'proactive' | 'advising' | 'quarter_planning' | 'free';

interface ChatStore {
  activeFlow: FlowMode;
  histories: Record<FlowMode, ChatMessage[]>;
  setFlow: (flow: FlowMode) => void;
  appendMessage: (flow: FlowMode, message: ChatMessage) => void;
  clearHistory: (flow: FlowMode) => void;
}

// src/stores/authStore.ts
interface AuthStore {
  token: string | null;
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
}
```

`uiStore.heatMapVisible` and `uiStore.wizardCompleted` are persisted to AsyncStorage via Zustand's `persist` middleware. `chatStore.histories` is kept in-memory only (React Query `useChatHistory` is the persistent backup via the DB).

---

## 16. API Integration Layer (`src/api/client.ts`)

Single Axios instance used by all API modules.

```typescript
const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

// Attach JWT to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — token expired or invalid
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      // Navigate to login via a singleton router ref
    }
    return Promise.reject(err);
  }
);
```

### Error Shape

All API errors return `{ error: string, message: string }`. The response interceptor surfaces `message` to the `ErrorToast` component. Never show raw Axios errors to the user.

### TypeScript Types (`src/types/api.ts`)

All API response shapes are typed to exactly match the backend schema:

```typescript
export type FlowMode = 'planning' | 'proactive' | 'advising' | 'quarter_planning' | 'free';
export type EnrollmentStatus = 'pre-major' | 'in-major';
export type ParseStatus = 'pending' | 'extracting' | 'ready' | 'failed';
export type BlockType = 'class' | 'study' | 'commitment' | 'other';
export type TaskSource = 'ics' | 'syllabus' | 'manual' | 'ai';

export interface User {
  id: string;
  email: string;
  display_name: string;
  major: string | null;
  enrollment_status: EnrollmentStatus | null;
  ics_url: string | null;
  ics_last_synced: string | null;
  onboarding_complete: boolean;
  notif_active: boolean;
  expo_push_token: string | null;
  current_quarter: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  due_date: string | null;
  weight: number;
  source: TaskSource;
  ics_uid: string | null;
  done: boolean;
  highlighted: boolean;
  created_at: string;
}

export interface ScheduleBlock {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  start_time: string;
  end_time: string;
  block_type: BlockType;
  source: string;
  color: string | null;
  created_at: string;
}

export interface HeatEntry {
  week_start: string;
  raw_score: number;
  normalized: number;
  label: 'light' | 'moderate' | 'heavy' | 'intense';
  color: string;
}

export interface Major {
  id: string;
  major_name: string;
  department: string | null;
  source_url: string | null;
  application_deadline: string | null;
  min_gpa: number | null;
  prereqs: Array<{ course: string; min_grade: string }>;
  checklist_steps: string[];
  last_scraped: string | null;
  notes: string | null;
}

export interface MajorGoal {
  id: string;
  user_id: string;
  major_req_id: string;
  status: 'active' | 'dropped' | 'achieved';
  declared_at: string;
  application_deadline: string | null;
  checklist_progress: Record<string, boolean>;
  reminder_30d_sent: boolean;
  reminder_7d_sent: boolean;
  reminder_1d_sent: boolean;
  major: Major;   // joined from major_requirements
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  flow: FlowMode;
  created_at: string;
}

export interface SyllabusMeta {
  id: string;
  user_id: string;
  course_id: string;
  quarter: string;
  blob_url: string | null;
  extracted_text: string | null;
  parse_status: ParseStatus;
  parsed_at: string | null;
}
```

---

## 17. Offline Behavior

`useNetworkStatus.ts` wraps `@react-native-community/netinfo` and syncs the result to `uiStore.offlineMode` on every network state change.

| Screen / Feature | Online | Offline |
|---|---|---|
| Chat tab | Full SSE streaming | Disabled input; cached history visible; `OfflineBanner` shown |
| TODO tab | Full CRUD + swipe actions | Read-only; cached tasks visible |
| Schedule tab | Full CRUD + block creation | Read-only; cached calendar + heat map visible |
| Profile tab | Full edits + ICS sync | Read-only |
| All API mutations | Enabled | Disabled; tap shows toast "No internet connection" |

`OfflineBanner` renders as a sticky yellow bar at the top of any affected screen: "You're offline — some features are unavailable."

React Query's in-memory cache (populated during the last online session) ensures the app remains useful for viewing tasks and schedule while offline.

---

## 18. Syllabus Upload Flow

Available from **Profile → My Courses → [Course] → Upload Syllabus**. Not part of the onboarding flow — keeps onboarding fast and non-blocking.

### Step-by-Step

1. User taps "Upload Syllabus" on a course card in `profile/courses.tsx`
2. Navigate to `profile/syllabus-upload.tsx?courseId=<id>`
3. Screen shows course name + "Select a PDF" button
4. `Expo.DocumentPicker.getDocumentAsync({ type: 'application/pdf' })` — file picker opens
5. Client-side validation:
   - MIME type must be `application/pdf`
   - File size must be ≤ 10 MB — show error toast if over limit
6. `POST /api/syllabus/upload` (multipart/form-data, fields: `pdf`, `courseId`) → receives `{ jobId }`
7. Screen transitions to polling state:
   - `useSyllabi()` with `refetchInterval: 3000` polls `GET /api/syllabus/status/:jobId`
   - Animated progress indicator
   - Status shown: `pending` → "Uploading..." | `extracting` → "Reading syllabus..." | `ready` → advance | `failed` → show retry
8. On `ready`: navigate to confirmation screen within the same route
9. **Confirmation screen** shows extracted task list:
   - Each task: title, due date, type (exam/quiz/paper etc.), weight badge
   - User can edit title or due date inline before confirming
   - User can remove tasks from the list
10. `POST /api/syllabus/confirm/:jobId` → tasks inserted (source = `syllabus`), full text stored for RAG
11. Success toast: "Syllabus saved — X tasks added to your TODO list"
12. React Query invalidates `['tasks']`, `['syllabi']`
13. Navigate back to `profile/courses.tsx`; course card now shows `ready` badge

> ⚠️ The Claude extraction step in the backend pipeline is **blocked until the Anthropic API key is received.** Azure Document Intelligence text extraction will work, but task parsing from that text requires Claude. Show the `extracting` state gracefully and handle `failed` with a retry option and message: "Extraction failed — try again or add tasks manually."

---

## 19. Push Notifications & Deep Linking

### Permission Flow

- First requested during `(onboarding)/notifications.tsx`
- Re-requestable from Profile → Notifications
- On grant: `Expo.getExpoPushTokenAsync()` → `PATCH /api/users/me/push-token` with `{ expoPushToken }`

### Notification Types & Deep Links

| Type | Example Body | Deep Link Target |
|---|---|---|
| `morning_digest` | "3 things due today · MATH midterm tomorrow" | `/(tabs)/todo` |
| `start_this_now` | "Start studying for MATH 126 Midterm — due in 48h" | `/(tabs)/todo/[taskId]` |
| `deadline_reminder` | "Assignment due tomorrow: INFO 201 Paper" | `/(tabs)/todo/[taskId]` |
| `major_app_reminder` | "30 days until your Informatics application deadline" | `/(tabs)/profile/major-goals/[goalId]` |

### Handling Notification Taps

Register `Notifications.addNotificationResponseReceivedListener` in `app/_layout.tsx`:

1. Extract `taskId` or `goalId` from `notification.request.content.data`
2. Navigate via `router.push()` to the appropriate deep link target
3. For proactive nudge notifications: set `chatStore.activeFlow = 'proactive'` then navigate to `/(tabs)/chat`
4. Log `notif_tapped` session event with `{ notification_type, time_to_dismiss_ms }`

> ⚠️ EAS Build is required for push notifications on physical devices. Expo Go does not support them in SDK 54+. Plan for this before user study testing.

---

## 20. Major Advising — Enrollment-Gated UI

`enrollment_status` from `useUser()` determines which major advising UI surfaces are shown.

### Pre-major (`enrollment_status === 'pre-major'`)

- Profile tab shows full "Major Goals" navigation link
- `profile/major-goals.tsx` — full goals list, add/drop goals, progress bars, deadline countdowns
- `profile/major-goals/[id].tsx` — full checklist UI, prereqs, GPA requirement, deadline banner
- Chat `ShortcutBar` includes "Major advising" shortcut button
- Claude injects all active major goal checklists into the system prompt (backend handles this automatically based on user's goals in DB)

### In-major (`enrollment_status === 'in-major'`)

- Profile tab shows a simple "My Major" info card: major name, enrollment status badge, no checklist
- No Major Goals navigation link
- "Major advising" shortcut hidden from `ShortcutBar`
- Student can still ask Claude freely about course requirements in chat — Claude context injection includes `enrollment_status`, so responses are appropriate for a student already in their major

---

## 21. Environment Variables

```bash
# .env.local (frontend — never committed to version control)
EXPO_PUBLIC_API_URL=https://u-wick-api-hxaketgeedg9cjcr.centralus-01.azurewebsites.net/api
```

The `EXPO_PUBLIC_` prefix makes the variable available in the Expo bundle at build time. All other credentials (Anthropic API key, Azure keys, JWT secret) are server-side only and never appear in the frontend codebase.

For local development against a local backend: set `EXPO_PUBLIC_API_URL=http://localhost:3000/api` in `.env.local`.

---

## 22. Backend API Readiness

Backend route status is tracked in `frontend-CLAUDE.md` → **Backend API Readiness** table. Do not maintain a separate list here — that table is the single source of truth and is updated manually whenever backend status changes.

For the current build order, all routes needed through the Schedule tab are ✅ ready. Chat SSE, task breakdown, and syllabus extraction are ⏳ blocked on the Anthropic API key. Push notifications require EAS Build.

---

*U-Wick Frontend Design Document v1.0 · FifthGear · UW Capstone 2026*
*Built in partnership with Maximal Learning, Inc. · wick.app*
