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

**Project is initialized** — Expo 54, RN 0.81, Expo Router v6, TypeScript strict. A UI prototype exists (demo-quality, not production architecture). New sessions should treat it as a migration target, not a foundation to extend.

### Reusable as-is
- `constants/colors.ts` — full design system palette, finalized
- `constants/typography.ts` — Syne + DM Sans font config, finalized
- `components/ui/Card.tsx`, `Badge.tsx` — generic, keep
- `components/chat/ChatInput.tsx`, `TypingIndicator.tsx` — keep, minor cleanup only
- `components/chat/ChatBubble.tsx` — keep shell; strip prototype-only fields (`isProactive`, `isUpload`, `isCanvas`, `showStatusCard`, `showChecklist`), add markdown rendering

### Built this session
- `app/splash.tsx` — animated splash with glow orbs, spring entrance, staggered loading dots; see Section 5 of design doc for full spec
- `app/index.tsx` — redirects to `/splash`
- `app/_layout.tsx` — has `<Stack.Screen name="splash" />` + `QueryClientProvider`; still needs auth gate
- `src/types/api.ts` — all API interfaces (`User`, `Course`, `Task`, `ScheduleBlock`, `HeatEntry`, `Major`, `MajorGoal`, `ChatMessage`, `SyllabusMeta`, `IcsStatus`) + type aliases (`FlowMode`, `EnrollmentStatus`, etc.)
- `src/stores/authStore.ts` — token + userId; `setAuth` / `clearAuth` / `hydrate` (reads SecureStore on launch)
- `src/stores/chatStore.ts` — activeFlow + per-flow message histories
- `src/stores/uiStore.ts` — heatMap / offline / wizard state; `heatMapVisible` + `wizardCompleted` persisted to AsyncStorage
- `src/api/client.ts` — Axios instance with JWT interceptor + 401 → `clearAuth`

### Prototype screens (migrate, don't extend)
These exist but are wired to mock data and use the wrong architecture (AppContext + useState). Refactor each one when its step comes up in What's Next:
- `app/(tabs)/home.tsx` — **delete**; no Home tab in spec
- `app/(tabs)/chat.tsx` → becomes `app/(tabs)/chat/index.tsx`
- `app/(tabs)/tasks.tsx` → becomes `app/(tabs)/todo/index.tsx`
- `app/(tabs)/plan.tsx` → becomes `app/(tabs)/schedule/index.tsx`
- `app/(onboarding)/index.tsx` → becomes `app/(onboarding)/profile.tsx`
- `app/(onboarding)/upload.tsx` — **delete**; syllabus upload moves to Profile tab
- `app/(onboarding)/connect.tsx` — **delete**; ICS connect moves to wizard Step 1

### Delete when Zustand + React Query are in place
- `context/AppContext.tsx`
- `hooks/useChatEngine.ts`
- `data/mock-state.ts`, `data/chat-scripts.ts`, `data/mock-responses.ts`
- `components/dashboard/` (HeroCard, AlertCard, TaskRow, ScheduleItem) — Home tab components, no longer needed

---

## What's Next (in order)
1. **Auth screens** — `app/(auth)/login.tsx`, `app/(auth)/register.tsx`; rewrite `app/_layout.tsx` auth gate (SecureStore → JWT expiry → onboarding_complete → wizardCompleted → destination); wire to `POST /auth/register` and `POST /auth/login`; store JWT in SecureStore + authStore
2. **Onboarding migration** — replace 3-screen prototype flow with `(onboarding)/profile.tsx` (current_quarter, enrollment_status, major; PATCH /me) and `(onboarding)/notifications.tsx` (push permission + PATCH /me/push-token + POST /me/onboarding/complete + POST /sessions/start)
3. **Tab layout migration** — delete Home tab; rename tabs to Chat/TODO/Schedule/Profile; convert flat `.tsx` files to subdirectory `index.tsx` files; swap emoji icons for Ionicons; add tab bar hide pattern for nested screens
4. **Coach mark wizard** — `src/wizard/` overlay; Steps 1–3; ICS connect in step 1; AsyncStorage persistence
5. **TODO tab** — migrate Tasks screen to `todo/index.tsx`; wire to `useTasks`; add TaskFilterBar, swipe delete, pull-to-refresh; create `todo/[id].tsx` task detail
6. **Schedule tab** — migrate Plan screen to `schedule/index.tsx`; wire to `useSchedule` + `useHeat`; add WeekCalendar + HeatMapBar + block CRUD bottom sheets
7. **Chat tab** — migrate Chat screen to `chat/index.tsx`; wire to `useChatHistory` + `chatStore`; add FlowPill + ShortcutBar; SSE path disabled until API key arrives
8. **Profile tab** — new `profile/index.tsx`; wire to `useUser`; enrollment-gated Major Goals link; ICS status + sync; push notification toggle; logout; create edit/courses/syllabus-upload/major-goals sub-screens
9. **Session logging** — wire `useSession` hook to all session events throughout the app
10. **Chat SSE** — unblock and wire `useChatStream` once Anthropic API key received; apply side effect optimistic updates
11. **Syllabus confirm** — unblock once Anthropic API key received
