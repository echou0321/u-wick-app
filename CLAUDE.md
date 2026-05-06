# U-Wick App — Claude Working Doc (Frontend)

Project: UW Capstone 2026, partnered with Maximal Learning/Wick (wick.app).
Conversational AI academic planner frontend: React Native + Expo + TypeScript.
@docs/frontend-design.md
Say "Frontend Design Doc loaded." at the start of every session after reading it.

> **Bridging backend status:** This frontend repo and the backend repo (`u-wick-server`) are
> separate. The **Backend API Readiness** table below is the maintained snapshot — it has
> everything needed for purely frontend sessions. Only paste `u-wick-server/CLAUDE.md` into
> the chat when: (1) you are implementing a feature against a route not yet marked ✅, or
> (2) you suspect the backend has changed since the table was last updated.

---

## Locked Decisions
- Language: TypeScript strict mode. No `.js` or `.jsx` files — only `.ts` and `.tsx`.
- This project uses ES modules (`import`/`export`). CommonJS `require()` is forbidden.
- Routing: Expo Router v6 (file-based). Groups: `(auth)`, `(onboarding)`, `(tabs)`.
- Server state: TanStack React Query v5. Never use Context or useState for data that comes from the API.
- UI state: Zustand v4. Stores: `authStore`, `chatStore`, `uiStore`.
- Auth storage: Expo SecureStore only. JWT never goes in AsyncStorage.
- HTTP: Single Axios instance in `src/api/client.ts` for all API calls. Exception: `POST /chat` uses `fetch` directly because Axios does not support streaming — this is intentional.
- Chat uses SSE (`fetch` ReadableStream). No WebSocket.
- EAS Build required for push notifications — Expo Go does not support push in SDK 54+.
- Base URL from `process.env.EXPO_PUBLIC_API_URL` in `.env.local` (never committed).

---

## Environment Variables
Local `.env.local` required (not committed):
```
EXPO_PUBLIC_API_URL=https://u-wick-api-hxaketgeedg9cjcr.centralus-01.azurewebsites.net/api
```
For local backend dev: `EXPO_PUBLIC_API_URL=http://localhost:3000/api`

---

## Code Conventions
- `src/api/` — one file per backend route group; functions named by HTTP action (`getTasks`, `updateTask`, `deleteTask`)
- `src/hooks/` — React Query hooks named `useNoun` (`useUser`, `useTasks`, `useSchedule`)
- `src/stores/` — Zustand stores; access via `useAuthStore.getState()` outside React components
- `src/types/api.ts` — all API response interfaces; must exactly match backend schema (see DB Schema Deviations in backend CLAUDE.md before typing)
- `FlowMode` type: `'planning' | 'proactive' | 'advising' | 'quarter_planning' | 'free'`
- Always check `enrollment_status === 'pre-major'` before rendering `MajorGoalCard`, `major-goals` route, or "Major advising" shortcut in `ShortcutBar`
- Session logging is fire-and-forget — never `await` `logEvent()` calls in UI handlers; errors are swallowed silently
- Push notification `data` payload shapes: `startThisNow` job sends `{ taskId }` — on notification tap, route to `todo/[id]`; `morningDigest` and `majorReminders` send no task-specific data (route to TODO or Profile tab respectively)
- All `PATCH` mutations must invalidate their React Query key on success; side effects from SSE must invalidate affected keys after `done` event
- `req.user.id` pattern from backend maps to JWT payload `id` field — decode with `jwtDecode()` client-side to get userId without an extra API call

---

## Backend API Readiness

Cross-reference `../u-wick-server/CLAUDE.md` → **What's Built** for live status.
This table reflects state as of 2026-05-02 — update when backend "What's Built" changes.

| Feature Group | Backend Routes | Frontend Status |
|---|---|---|
| Auth | POST /auth/register, POST /auth/login | ✅ Build now |
| User profile | GET /me, PATCH /me, POST /me/onboarding/complete, PATCH /me/push-token | ✅ Build now |
| ICS | POST /ics/connect, POST /ics/sync, GET /ics/status | ✅ Build now |
| Tasks (read/edit) | GET /tasks, PATCH /tasks/:id, DELETE /tasks/:id | ✅ Build now |
| Task creation | POST /tasks | ⏳ Not yet in backend — frontend shows coming-soon stub; implement form when route ships |
| Schedule | GET /schedule, POST/PATCH/DELETE /schedule/blocks, GET /schedule/heat | ✅ Build now |
| Sessions | POST /sessions/start, POST /sessions/event, POST /sessions/end | ✅ Build now |
| Majors | GET /majors, GET /majors/:id | ✅ Build now |
| Goals | POST /goals/major, GET /goals/major, PATCH /goals/major/:id, PATCH /goals/major/:id/checklist | ✅ Build now |
| Push (receive) | Server-side cron delivery via Expo Push | ✅ Receive + deep link now; EAS Build needed for physical device |
| Chat (SSE) | POST /chat, GET /chat/history, DELETE /chat/history | ⏳ Blocked — Anthropic API key; build skeleton UI with disabled state |
| Task breakdown | POST /tasks/:id/breakdown | ⏳ Blocked — Anthropic API key; show disabled "Break this down" button |
| Syllabus upload | POST /syllabus/upload, GET /syllabus/status/:jobId, POST /syllabus/confirm/:jobId, GET /syllabus | ⏳ Partial — upload + poll UI buildable; confirm step blocked on API key |

When a ⏳ item becomes ✅ in the backend CLAUDE.md, update this table and remove the disabled state from the corresponding frontend component.

---

## Testing Protocol
Every screen and hook gets a test file immediately after it is built. Structure:
- Component tests: React Native Testing Library (`@testing-library/react-native`)
- Hook tests: `renderHook` with a `QueryClientProvider` wrapper
- API module tests: mock Axios with `jest-mock-axios`; verify request shape and response mapping
- Cover: loading state, error state, happy path, offline state (mock `useNetworkStatus` returning `offline`)
- Run: `npx expo test` (or `jest` if configured directly)

---

## What's Built

**Foundation complete** — Expo 54, RN 0.81, Expo Router v6, TypeScript strict. Prototype files fully removed. All active code lives under `src/` or `app/`.

### Constants (finalized, do not modify)
- `constants/colors.ts` — full design system palette
- `constants/typography.ts` — Syne + DM Sans font config

### Built
- `app/splash.tsx` — animated splash with glow orbs, spring entrance, staggered loading dots; real auth gate (SecureStore hydrate → JWT expiry check → `GET /users/me` → navigate); min 1500ms display, navigation fires when both gate + timer resolve
- `app/index.tsx` — redirects to `/splash`
- `app/_layout.tsx` — `GestureHandlerRootView` (outermost) + `QueryClientProvider`; Stack registers `(auth)`, `(onboarding)`, `(tabs)`; auth gate lives in `splash.tsx`
- `babel.config.js` — `babel-preset-expo` + `react-native-reanimated/plugin` (required for reanimated v4 / bottom sheets)
- `app/(auth)/_layout.tsx` — auth group Stack with fade animation
- `app/(auth)/login.tsx` — email + password form; inline field validation; 401 error message; navigates to `/(tabs)/chat` or `/(onboarding)/profile` based on `onboarding_complete`
- `app/(auth)/register.tsx` — display_name + email + password + confirm; length + match validation; 409 error message; navigates to `/(onboarding)/profile` on success
- `app/(onboarding)/_layout.tsx` — onboarding group Stack, slide animation
- `app/(onboarding)/profile.tsx` — current_quarter + enrollment_status segmented control + optional major; `PATCH /users/me`; navigates to `/notifications`
- `app/(onboarding)/notifications.tsx` — 3 feature rows; "Enable Notifications" requests OS permission + Expo push token + `PATCH /users/me/push-token`; "Skip for now" path; both paths call `POST /users/me/onboarding/complete` + fire-and-forget `POST /sessions/start` → `/(tabs)/chat`
- `app/(tabs)/_layout.tsx` — 4 tabs: Chat / TODO / Schedule / Profile; Ionicons; wraps Tabs in View + mounts `<CoachMarkWizard />` as absolute overlay
- `app/(tabs)/chat/index.tsx` — skeleton
- `app/(tabs)/todo/index.tsx` — **built**: task list with All/This Week/Overdue/Starred filter bar, pull-to-refresh, bidirectional done toggle (checkbox on each row + undo toast), sort by due date or weight (header icon), mark-all-overdue-done bulk action, swipe-to-delete (hard delete for manual/ai/syllabus; soft delete for ICS), show-completed toggle, ICS import modal (cloud icon in header + CTA in empty state), "Add task" stub button (shows coming-soon modal — `POST /tasks` not yet in backend), `__DEV__`-only sign-out icon in header
- `app/(tabs)/todo/[id].tsx` — **built**: task detail; done toggle, due date, type label, source badge, disabled "Break this down" button, delete/remove action
- `app/(tabs)/schedule/index.tsx` — skeleton
- `app/(tabs)/profile/index.tsx` — skeleton
- `src/api/auth.ts` — `login()`, `register()`
- `src/api/users.ts` — `getMe()`, `updateMe()`, `completeOnboarding()`, `updatePushToken()`
- `src/api/sessions.ts` — `startSession()`, `logEvent()`, `endSession()`
- `src/api/ics.ts` — `connectIcs()`, `syncIcs()`, `getIcsStatus()`
- `src/api/tasks.ts` — `getTasks()`, `updateTask()`, `deleteTask()`
- `src/api/client.ts` — Axios instance with JWT interceptor + 401 → `clearAuth`
- `src/stores/authStore.ts` — token + userId; `setAuth` / `clearAuth` / `hydrate` (reads SecureStore on launch)
- `src/stores/chatStore.ts` — activeFlow + per-flow message histories
- `src/stores/uiStore.ts` — heatMap / offline / wizard state; `heatMapVisible` + `wizardCompleted` persisted to AsyncStorage; `startWizard()` sets wizardStep to 1
- `src/styles/forms.ts` — `formStyles`: card/form/input/button pattern (auth + onboarding screens)
- `src/styles/components.ts` — `cardStyles`, `badgeStyles`: generic UI components
- `src/styles/chat.ts` — `bubbleStyles`, `inputStyles`, `typingStyles`: chat components
- `src/styles/tabs.ts` — `tabScreenStyles`, `tabBarStyles`: tab screens + tab bar
- `src/styles/wizard.ts` — `wizardStyles`: overlay, spotlight, slide-up card, feature rows
- `src/styles/todo.ts` — `todoStyles`: filter bar, task row (incl. `checkBox`), swipe action, empty state, `markAllBtn`, `sortRow`, `undoToast`, detail screen
- `src/components/ui/Card.tsx`, `Badge.tsx` — generic, pull styles from `components.ts`
- `src/components/chat/ChatBubble.tsx` — stripped of prototype fields; uses `ChatMessage` from `src/types/api`; markdown rendering pending
- `src/components/chat/ChatInput.tsx` — `onSend` + `disabled` prop; pull styles from `chat.ts`
- `src/components/chat/TypingIndicator.tsx` — staggered dot animation; pull styles from `chat.ts`
- `src/components/todo/TaskFilterBar.tsx` — All / This Week / Overdue / Starred pill filter; `TaskFilter` type exported
- `src/components/todo/TaskRow.tsx` — swipeable row; circular done checkbox (bidirectional), title, due date (relative + urgent colour), weight badge, star toggle; swipe-left = delete action
- `src/types/api.ts` — all API interfaces (`User`, `Course`, `Task`, `ScheduleBlock`, `HeatEntry`, `Major`, `MajorGoal`, `ChatMessage`, `SyllabusMeta`, `IcsStatus`) + type aliases (`FlowMode`, `EnrollmentStatus`, etc.)
- `src/wizard/CoachMarkWizard.tsx` — orchestrator; reads `wizardCompleted`; calls `startWizard()` on mount; navigates to Schedule tab (step 1) and Chat tab (step 2) via `router.navigate`
- `src/wizard/WizardStep1.tsx` — Canvas connect; dark backdrop + calendar spotlight + `Animated` slide-up card + ICS URL modal with validation + `KeyboardAvoidingView` so keyboard doesn't cover input; `POST /ics/connect` → Alert → `advanceWizard()`
- `src/wizard/WizardStep2.tsx` — chat intro; backdrop + input-bar spotlight + slide-up card; both "Got it" and "Skip" call `advanceWizard()`
- `src/hooks/useTasks.ts` — `useTasks(filters?)`, `useTask(id)` (cache lookup), `useUpdateTask()`, `useDeleteTask()`
- `src/wizard/WizardStep3.tsx` — feature discovery; dimmed overlay + tall card with 3 icon/title/body rows; "Let's go" → `completeWizard()` (writes `wizardCompleted: true` to AsyncStorage)

---

## What's Next (in order)

### 1. TODO tab — remaining gaps

**a) ✅ Overdue display** — resolved via dedicated Overdue filter tab + mark-all bulk action.

**b) Course grouping** — Design spec calls for tasks grouped by course with the course name as a section header and a colour dot. Currently a flat list because `GET /tasks` returns `course_id` only (no course name/colour). Options: confirm whether the backend joins course data on the tasks response, or fetch `GET /courses` (check backend readiness), or group by `course_id` with a truncated label for now.

**c) `SubtaskRow` component** — `src/components/todo/SubtaskRow.tsx` not yet built; needed for the subtask checklist in `todo/[id].tsx` once the `breakdown_task` side effect is unblocked.

**d) No `GET /tasks/:id` endpoint** — `todo/[id].tsx` reads the task from the React Query cache. Edge case: deep-linking directly to a task detail with no prior list fetch shows a spinner indefinitely. Low priority for now.

**e) "Add task" backend route** — `POST /tasks` is not yet in the backend. The "Add task" `+` button in the TODO header currently shows a coming-soon modal explaining that tasks come from Canvas or U-Wick chat. When the backend ships this route, remove the modal and implement the create form (fields: title, due_date, weight/type, course_id).

### 2. Schedule tab — `schedule/index.tsx` skeleton
Create `src/api/schedule.ts` + `src/hooks/useSchedule.ts` + `useHeat.ts`; add `WeekCalendar`, `HeatMapBar`, `BlockCard` components; block CRUD bottom sheets.

### 3. Chat tab — `chat/index.tsx` skeleton
Create `src/hooks/useChatHistory.ts`; add `FlowPill`, `ShortcutBar`; wire `chatStore`; SSE path disabled until Anthropic API key arrives.

### 4. Profile tab — `profile/index.tsx` skeleton
Wire to `useUser`; enrollment-gated Major Goals link; ICS status + sync; push notification toggle; logout; create `edit`, `courses`, `syllabus-upload`, `major-goals` sub-screens.

### 5. Session logging
Wire `useSession` hook to all session events throughout the app.

### 6. Chat SSE
Unblock and wire `useChatStream` once Anthropic API key received; apply side effect optimistic updates.

### 7. Syllabus confirm
Unblock once Anthropic API key received.
