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

### Built
- `app/splash.tsx` — animated splash with glow orbs, spring entrance, staggered loading dots; real auth gate (SecureStore hydrate → JWT expiry check → `GET /users/me` → navigate); min 1500ms display, navigation fires when both gate + timer resolve
- `app/index.tsx` — redirects to `/splash`
- `app/_layout.tsx` — `QueryClientProvider` + `AppProvider` (prototype compat); Stack registers `(auth)`, `(onboarding)`, `(tabs)`; auth gate lives in `splash.tsx`
- `app/(auth)/_layout.tsx` — auth group Stack with fade animation
- `app/(auth)/login.tsx` — email + password form; inline field validation; 401 error message; navigates to `/(tabs)/chat` or `/(onboarding)` based on `onboarding_complete`
- `app/(auth)/register.tsx` — display_name + email + password + confirm; length + match validation; 409 error message; navigates to `/(onboarding)` on success
- `src/api/auth.ts` — `login()`, `register()`
- `src/api/users.ts` — `getMe()`
- `src/api/client.ts` — Axios instance with JWT interceptor + 401 → `clearAuth`
- `src/stores/authStore.ts` — token + userId; `setAuth` / `clearAuth` / `hydrate` (reads SecureStore on launch)
- `src/stores/chatStore.ts` — activeFlow + per-flow message histories
- `src/stores/uiStore.ts` — heatMap / offline / wizard state; `heatMapVisible` + `wizardCompleted` persisted to AsyncStorage
- `src/styles/forms.ts` — shared `StyleSheet` for the card/form/input/button pattern used by auth + onboarding screens
- `src/types/api.ts` — all API interfaces (`User`, `Course`, `Task`, `ScheduleBlock`, `HeatEntry`, `Major`, `MajorGoal`, `ChatMessage`, `SyllabusMeta`, `IcsStatus`) + type aliases (`FlowMode`, `EnrollmentStatus`, etc.)

### Cleanup Waves

Prototype files use AppContext + useState and mock data — never extend them. Delete/replace at the step noted.

**Wave 1 — during onboarding migration (What's Next step 1):**
- `app/(onboarding)/index.tsx` → replaced by `(onboarding)/profile.tsx`
- `app/(onboarding)/upload.tsx` → delete (syllabus upload moves to Profile tab)
- `app/(onboarding)/connect.tsx` → delete (ICS connect moves to wizard Step 1)
- Update auth screens: change `/(onboarding)` navigation target to `/(onboarding)/profile`

**Wave 2 — during tab layout migration (What's Next step 2):**
- `app/(tabs)/home.tsx` → delete (no Home tab in spec)
- `app/(tabs)/chat.tsx` → replaced by `chat/index.tsx`
- `app/(tabs)/tasks.tsx` → replaced by `todo/index.tsx`
- `app/(tabs)/plan.tsx` → replaced by `schedule/index.tsx`
- `context/AppContext.tsx` → delete; remove `AppProvider` from `app/_layout.tsx`
- `hooks/useChatEngine.ts` → delete
- `data/mock-state.ts`, `data/chat-scripts.ts`, `data/mock-responses.ts` → delete
- `components/dashboard/` (HeroCard, AlertCard, TaskRow, ScheduleItem) → delete
- `types/index.ts` → delete (superseded by `src/types/api.ts`)
- `App.tsx` (root) → delete (dead code; entry point is `expo-router/entry`)
- `components/ui/`, `components/chat/` → move into `src/components/`

---

## What's Next (in order)
1. **Onboarding migration** — replace 3-screen prototype flow with `(onboarding)/profile.tsx` (current_quarter, enrollment_status, major; PATCH /me) and `(onboarding)/notifications.tsx` (push permission + PATCH /me/push-token + POST /me/onboarding/complete + POST /sessions/start); delete `(onboarding)/index.tsx`, `upload.tsx`, `connect.tsx`; update auth screens to navigate to `/(onboarding)/profile` instead of `/(onboarding)`
2. **Tab layout migration** — delete Home tab; rename tabs to Chat/TODO/Schedule/Profile; convert flat `.tsx` files to subdirectory `index.tsx` files; swap emoji icons for Ionicons; add tab bar hide pattern for nested screens; delete `context/AppContext.tsx`, `hooks/useChatEngine.ts`, `data/`, `components/dashboard/`, `types/index.ts`; move `components/` into `src/components/`
3. **Coach mark wizard** — `src/wizard/` overlay; Steps 1–3; ICS connect in step 1; AsyncStorage persistence
4. **TODO tab** — migrate Tasks screen to `todo/index.tsx`; wire to `useTasks`; add TaskFilterBar, swipe delete, pull-to-refresh; create `todo/[id].tsx` task detail
5. **Schedule tab** — migrate Plan screen to `schedule/index.tsx`; wire to `useSchedule` + `useHeat`; add WeekCalendar + HeatMapBar + block CRUD bottom sheets
6. **Chat tab** — migrate Chat screen to `chat/index.tsx`; wire to `useChatHistory` + `chatStore`; add FlowPill + ShortcutBar; SSE path disabled until API key arrives
7. **Profile tab** — new `profile/index.tsx`; wire to `useUser`; enrollment-gated Major Goals link; ICS status + sync; push notification toggle; logout; create edit/courses/syllabus-upload/major-goals sub-screens
8. **Session logging** — wire `useSession` hook to all session events throughout the app
9. **Chat SSE** — unblock and wire `useChatStream` once Anthropic API key received; apply side effect optimistic updates
10. **Syllabus confirm** — unblock once Anthropic API key received
