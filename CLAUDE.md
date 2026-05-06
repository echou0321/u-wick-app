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
| Tasks | GET /tasks, PATCH /tasks/:id, DELETE /tasks/:id | ✅ Build now |
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
- `app/_layout.tsx` — `QueryClientProvider`; Stack registers `(auth)`, `(onboarding)`, `(tabs)`; auth gate lives in `splash.tsx`
- `app/(auth)/_layout.tsx` — auth group Stack with fade animation
- `app/(auth)/login.tsx` — email + password form; inline field validation; 401 error message; navigates to `/(tabs)/chat` or `/(onboarding)/profile` based on `onboarding_complete`
- `app/(auth)/register.tsx` — display_name + email + password + confirm; length + match validation; 409 error message; navigates to `/(onboarding)/profile` on success
- `app/(onboarding)/_layout.tsx` — onboarding group Stack, slide animation
- `app/(onboarding)/profile.tsx` — current_quarter + enrollment_status segmented control + optional major; `PATCH /users/me`; navigates to `/notifications`
- `app/(onboarding)/notifications.tsx` — 3 feature rows; "Enable Notifications" requests OS permission + Expo push token + `PATCH /users/me/push-token`; "Skip for now" path; both paths call `POST /users/me/onboarding/complete` + fire-and-forget `POST /sessions/start` → `/(tabs)/chat`
- `app/(tabs)/_layout.tsx` — 4 tabs: Chat / TODO / Schedule / Profile; Ionicons; styles from `src/styles/tabs.ts`
- `app/(tabs)/chat/index.tsx` — skeleton (Step 6)
- `app/(tabs)/todo/index.tsx` — skeleton (Step 4)
- `app/(tabs)/schedule/index.tsx` — skeleton (Step 5)
- `app/(tabs)/profile/index.tsx` — skeleton (Step 7)
- `src/api/auth.ts` — `login()`, `register()`
- `src/api/users.ts` — `getMe()`, `updateMe()`, `completeOnboarding()`, `updatePushToken()`
- `src/api/sessions.ts` — `startSession()`, `logEvent()`, `endSession()`
- `src/api/client.ts` — Axios instance with JWT interceptor + 401 → `clearAuth`
- `src/stores/authStore.ts` — token + userId; `setAuth` / `clearAuth` / `hydrate` (reads SecureStore on launch)
- `src/stores/chatStore.ts` — activeFlow + per-flow message histories
- `src/stores/uiStore.ts` — heatMap / offline / wizard state; `heatMapVisible` + `wizardCompleted` persisted to AsyncStorage
- `src/styles/forms.ts` — `formStyles`: card/form/input/button pattern (auth + onboarding screens)
- `src/styles/components.ts` — `cardStyles`, `badgeStyles`: generic UI components
- `src/styles/chat.ts` — `bubbleStyles`, `inputStyles`, `typingStyles`: chat components
- `src/styles/tabs.ts` — `tabScreenStyles`, `tabBarStyles`: tab screens + tab bar
- `src/components/ui/Card.tsx`, `Badge.tsx` — generic, pull styles from `components.ts`
- `src/components/chat/ChatBubble.tsx` — stripped of prototype fields; uses `ChatMessage` from `src/types/api`; markdown rendering pending (Step 6)
- `src/components/chat/ChatInput.tsx` — `onSend` + `disabled` prop; pull styles from `chat.ts`
- `src/components/chat/TypingIndicator.tsx` — staggered dot animation; pull styles from `chat.ts`
- `src/types/api.ts` — all API interfaces (`User`, `Course`, `Task`, `ScheduleBlock`, `HeatEntry`, `Major`, `MajorGoal`, `ChatMessage`, `SyllabusMeta`, `IcsStatus`) + type aliases (`FlowMode`, `EnrollmentStatus`, etc.)

---

## What's Next (in order)
1. **Coach mark wizard** — `src/wizard/` overlay; Steps 1–3; ICS connect in step 1; AsyncStorage persistence
2. **TODO tab** — replace skeleton in `todo/index.tsx`; wire to `useTasks`; add TaskFilterBar, swipe delete, pull-to-refresh; create `todo/[id].tsx` task detail
3. **Schedule tab** — replace skeleton in `schedule/index.tsx`; wire to `useSchedule` + `useHeat`; add WeekCalendar + HeatMapBar + block CRUD bottom sheets
4. **Chat tab** — replace skeleton in `chat/index.tsx`; wire to `useChatHistory` + `chatStore`; add FlowPill + ShortcutBar; SSE path disabled until API key arrives
5. **Profile tab** — replace skeleton in `profile/index.tsx`; wire to `useUser`; enrollment-gated Major Goals link; ICS status + sync; push notification toggle; logout; create edit/courses/syllabus-upload/major-goals sub-screens
6. **Session logging** — wire `useSession` hook to all session events throughout the app
7. **Chat SSE** — unblock and wire `useChatStream` once Anthropic API key received; apply side effect optimistic updates
8. **Syllabus confirm** — unblock once Anthropic API key received
