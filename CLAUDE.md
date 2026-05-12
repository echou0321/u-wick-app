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
- `@react-native/babel-plugin-codegen` is patched via `patch-package` (see `patches/` dir) — RN 0.81 ships `@react-native/codegen` without the flow parser; the plugin is replaced with a no-op since the project has no `codegenNativeComponent` usage. `postinstall` in `package.json` re-applies the patch after every `npm install`.

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
- `PATCH /goals/major/:id/checklist` body uses `{ step_id, completed: bool }` — field is `completed`, not `done` (backend deviation from design doc)
- `DELETE /tasks/:id` returns 403 for ICS/syllabus/ai-sourced tasks — always check `task.source` before calling delete; use done-toggle (soft remove) for ICS tasks
- Syllabus route is `POST /syllabus` (not `/syllabus/upload`) — text-paste only, no file upload
- `DELETE /chat/history` requires `?flow=<flowMode>` query param — omitting it returns 400
- `POST /tasks` does NOT auto-trigger subtask breakdown — call `POST /tasks/:id/breakdown` separately if needed
- `Task.tag` is AI-generated server-side on `POST /tasks` (manual tasks only); `null` for ICS/syllabus/AI-sourced tasks; displayed as a gray pill badge on TaskRow and detail screen; `PATCH /tasks/:id` accepts `{ tag }` to override
- Weight is displayed as priority throughout the app: weight ≥ 2.0 → **High** (red `#F76A6A`), weight ≥ 1.0 → **Medium** (orange `#F7A06A`), weight < 1.0 → **Low** (teal `#6AF7C8`); create form sends 3.0/1.5/0.5 for High/Medium/Low

---

## Backend API Readiness

Backend fully deployed — 166 tests passing, 10 suites. All routes live as of 2026-05-07.

| Feature Group | Backend Routes | Frontend Status |
|---|---|---|
| Auth | POST /auth/register, POST /auth/login | ✅ Build now |
| User profile | GET /me, PATCH /me, POST /me/onboarding/complete, PATCH /me/push-token | ✅ Build now |
| Dashboard | GET /users/me/dashboard → `{ tasks_due_soon, schedule_today, nudges, heat_this_week }` | ✅ Live — no frontend hook yet; useful for profile tab or home preload |
| ICS | POST /ics/connect, POST /ics/sync, GET /ics/status, DELETE /ics/disconnect | ✅ Build now; DELETE /ics/disconnect hard-deletes all ICS tasks + courses; not yet wired in frontend |
| Tasks (read/edit) | GET /tasks, PATCH /tasks/:id, DELETE /tasks/:id | ✅ Build now; DELETE returns 403 for ICS/syllabus/ai sources — frontend swipe-delete already handles this |
| Task creation | POST /tasks | ✅ Live — create form built (title, due_date, priority pills High/Medium/Low); backend auto-generates `tag` on creation; does NOT auto-trigger breakdown |
| Task tag (AI) | PATCH /tasks/:id accepts { tag } | ✅ Live — backend auto-generates 1–2 word tag on POST /tasks; returned on all task responses; PATCH accepts { tag } for user overrides |
| Task subtasks | GET /tasks/:id/subtasks, POST /tasks/:id/breakdown | ✅ Both live — build SubtaskRow + useSubtasks hook; wire "Break this down" button |
| Schedule | GET /schedule, POST/PATCH/DELETE /schedule/blocks, GET /schedule/heat | ✅ Build now |
| Sessions | POST /sessions/start, POST /sessions/event, POST /sessions/end | ✅ Live — fire-and-forget calls already in onboarding; wire remaining events throughout app |
| Majors | GET /majors, GET /majors/:id | ✅ Live — build profile/major-goals screens |
| Goals | POST /goals/major, GET /goals/major, PATCH /goals/major/:id, PATCH /goals/major/:id/checklist | ✅ Live — checklist PATCH body uses `completed` (not `done`) |
| Push token | PATCH /me/push-token | ✅ Already wired in onboarding |
| Push cron delivery | Server-side cron: morning_digest, start_this_now, major_app_reminder | ✅ Live — receive + deep-link handlers can be built now; EAS Build needed for physical device testing |
| Chat (SSE) | POST /chat, GET /chat/history, DELETE /chat/history | ✅ Fully live — all 7 side-effects wired; build full chat UI; DELETE requires `?flow=` query param or returns 400 |
| Task breakdown | POST /tasks/:id/breakdown | ✅ Live — remove disabled state, wire button |
| Syllabus | POST /syllabus (text-paste: `{course_id, quarter, text}`), GET /syllabus/status/:jobId, POST /syllabus/confirm/:jobId, GET /syllabus | ✅ Live — text-paste only (no PDF), response is synchronous `{jobId, tasks}`; build confirm flow |

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
- `app/_layout.tsx` — `GestureHandlerRootView` (outermost) + `QueryClientProvider`; Stack registers `(auth)`, `(onboarding)`, `(tabs)`; auth gate lives in `splash.tsx`; subscribes to `authStore.token` and calls `queryClient.clear()` when it goes null (prevents stale cache bleed across account switches)
- `babel.config.js` — `babel-preset-expo` + `react-native-reanimated/plugin` (required for reanimated v4 / bottom sheets)
- `app/(auth)/_layout.tsx` — auth group Stack with fade animation
- `app/(auth)/login.tsx` — email + password form; inline field validation; 401 error message; navigates to `/(tabs)/chat` or `/(onboarding)/profile` based on `onboarding_complete`
- `app/(auth)/register.tsx` — display_name + email + password + confirm; length + match validation; 409 error message; navigates to `/(onboarding)/profile` on success
- `app/(onboarding)/_layout.tsx` — onboarding group Stack, slide animation
- `app/(onboarding)/profile.tsx` — current_quarter + enrollment_status segmented control; branched major field: **in-major** → free-text input (saved to `PATCH /users/me`); **pre-major** → slide-up major picker modal (same data source as major-goals screen) → saves name to `PATCH /users/me` AND calls `POST /goals/major` to create the goal (error swallowed if duplicate); `SafeAreaView` uses `edges={['top']}` to prevent double bottom inset
- `app/(onboarding)/notifications.tsx` — 3 feature rows; "Enable Notifications" requests OS permission + Expo push token + `PATCH /users/me/push-token`; "Skip for now" path; both paths call `POST /users/me/onboarding/complete` + `uiStore.resetWizard()` (ensures fresh accounts always see the wizard regardless of prior device history) + fire-and-forget `POST /sessions/start` → `/(tabs)/chat`
- `app/(tabs)/_layout.tsx` — 4 tabs: Chat / TODO / Schedule / Profile; Ionicons; wraps Tabs in View + mounts `<CoachMarkWizard />` as absolute overlay
- `app/(tabs)/chat/_layout.tsx` — Stack navigator (`headerShown: false`) for the Chat tab; required for Expo Router to surface `tabBarIcon` for the chat segment
- `app/(tabs)/todo/_layout.tsx` — Stack navigator (`headerShown: false`) for the TODO tab; required so `todo/[id]` can push/pop correctly via `router.back()`
- `app/(tabs)/schedule/_layout.tsx` — Stack navigator (`headerShown: false`) for the Schedule tab; required for Expo Router to surface `tabBarIcon` for the schedule segment
- `app/(tabs)/chat/index.tsx` — per-flow message history (loads from React Query, lives in local state during session), SSE streaming via XHR + `onprogress` (token → streaming bubble → finalized message), clear-conversation Alert (`DELETE /chat/history?flow=`), offline banner; **flow tab strip** (Chat/Planning/Quarter plan/Advising) replaces FlowPill — each tab is its own conversation thread, Advising hidden for in-major users; context-sensitive `ShortcutBar` per active flow; assistant bubbles render markdown + are text-selectable; `SafeAreaView edges={['top']}` — prevents double bottom inset on tab switch
- `app/(tabs)/todo/index.tsx` — task list with scrollable filter bar (All / This Week / Overdue / Starred / **Completed** — Completed tab replaces the old show-completed toggle), pull-to-refresh, bidirectional done toggle (checkbox + undo toast), sort by due date or priority (header icon), mark-all-overdue-done bulk action, swipe-to-delete (hard delete for manual; soft delete for ICS/ai/syllabus), prominent **"Add task" pill button** in header, add-task form with title + inline calendar date picker + priority pills; `__DEV__`-only sign-out icon; scroll resets to top on filter change; `isThisWeek` is today→+7 days only; `SafeAreaView edges={['top']}` — prevents last-item flicker on tab switch
- `app/(tabs)/todo/[id].tsx` — **built**: task detail; done toggle, due date, priority label, tag row (shown when `task.tag` non-null), source badge, active "Break this down" button (loading spinner while pending), subtask section (renders `SubtaskRow` list on breakdown success), delete/remove action
- `app/(tabs)/schedule/index.tsx` — skeleton
- `app/(tabs)/profile/index.tsx` — skeleton
- `src/api/syllabus.ts` — `extractSyllabus(course_id | null, quarter, text)` → `POST /syllabus`; `confirmSyllabus(jobId, tasks[])` → `POST /syllabus/confirm/:jobId`; `ExtractedTask` interface `{ title, due_date, weight }`; **blocked on backend `GET /courses` — see Syllabus section below**
- `src/api/chat.ts` — `getChatHistory(flow)`, `deleteChatHistory(flow)`
- `src/api/auth.ts` — `login()`, `register()`
- `src/api/users.ts` — `getMe()`, `updateMe()`, `completeOnboarding()`, `updatePushToken()`
- `src/api/sessions.ts` — `startSession()`, `logEvent()`, `endSession()`
- `src/api/ics.ts` — `connectIcs()`, `syncIcs()`, `getIcsStatus()`
- `src/api/tasks.ts` — `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`, `getSubtasks(taskId)`, `triggerBreakdown(taskId)`
- `src/api/client.ts` — Axios instance with JWT interceptor + 401 → `clearAuth`
- `src/stores/authStore.ts` — token + userId; `setAuth` / `clearAuth` / `hydrate` (reads SecureStore on launch)
- `src/stores/chatStore.ts` — activeFlow + per-flow message histories
- `src/stores/uiStore.ts` — heatMap / offline / wizard state; `heatMapVisible` + `wizardCompleted` persisted to AsyncStorage; `startWizard()` sets wizardStep to 1; `resetWizard()` clears `wizardCompleted` + resets step to 0 (called on onboarding complete so each new account sees the wizard)
- `src/styles/forms.ts` — `formStyles`: card/form/input/button pattern (auth + onboarding screens)
- `src/styles/components.ts` — `cardStyles`, `badgeStyles`: generic UI components
- `src/styles/chat.ts` — `bubbleStyles`, `inputStyles`, `typingStyles`, `flowPillStyles`, `shortcutBarStyles`, `chatScreenStyles`, `markdownStyles`, `flowTabStyles`: chat components; `flowTabStyles` drives the flow tab strip (row, tab, dot, label, labelActive, clearBtn)
- `src/styles/tabs.ts` — `tabScreenStyles`, `tabBarStyles`: tab screens + tab bar
- `src/styles/wizard.ts` — `wizardStyles`: overlay, spotlight, slide-up card, feature rows
- `src/styles/todo.ts` — `todoStyles`: `filterBarOuter` (fixed-height 52 View wrapper for the horizontal ScrollView — prevents flex-stretch bug), `filterBar` (contentContainerStyle row), task row (incl. `checkBox`), swipe action, empty state, `markAllBtn`, `sortRow`, `undoToast`, detail screen; `completedRow`/`completedRowText` removed (replaced by Completed filter tab)
- `src/components/ui/Card.tsx`, `Badge.tsx` — generic, pull styles from `components.ts`
- `src/components/chat/ChatBubble.tsx` — assistant bubbles render via `react-native-markdown-display` (bold, lists, code, headings) with `paragraph` rule overridden to `<Text selectable>` — enables long-press text selection on AI responses; user bubbles use plain `Text` (selectable); styles via `markdownStyles` in `chat.ts`
- `src/components/chat/ChatInput.tsx` — `onSend` + `disabled` + `prefill` + `inputRef` props; `prefill` sets value via `useEffect` only when it changes to a new non-empty string; `multiline` enabled — input expands vertically up to `maxHeight: 120`; send button uses `alignItems: 'flex-end'` so it anchors to the bottom of a tall input; pull styles from `chat.ts`
- `src/components/chat/TypingIndicator.tsx` — staggered dot animation; pull styles from `chat.ts`
- `src/components/chat/FlowPill.tsx` — colored dot + human-readable flow label badge; label/color maps for all 5 `FlowMode` values; no longer used in main chat screen (replaced by `flowTabStyles` tab strip) but kept for potential future use
- `src/components/chat/ShortcutBar.tsx` — context-sensitive quick-prompt pills per active flow; `FLOW_PROMPTS` map defines 1–2 prompts per flow mode; renders `null` for `proactive` flow; props: `activeFlow` + `onPrefill(text)`
- `src/components/todo/TaskFilterBar.tsx` — All / This Week / Overdue / Starred / Completed scrollable pill filter; outer `View` with `filterBarOuter` (height: 52) wraps a horizontal `ScrollView` with `contentContainerStyle={filterBar}`; `TaskFilter` type exported
- `src/components/todo/TaskRow.tsx` — swipeable row; circular done checkbox (bidirectional), title, due date (relative + urgent colour — "Overdue" label suppressed for done tasks, shows plain date instead), **priority badge** (High/Medium/Low with red/orange/teal colors via `priorityLabel`/`priorityColor`), **tag badge** (gray pill, shown when `task.tag` non-null), star toggle; swipe-left = delete action
- `src/components/todo/SubtaskRow.tsx` — read-only subtask row; checkmark/ellipse icon reflects `done` state; shows `suggested_start` hint if present
- `src/types/api.ts` — all API interfaces (`User`, `Course`, `Task`, `TaskSubtask`, `ScheduleBlock`, `HeatEntry`, `Major`, `MajorGoal`, `ChatMessage`, `SyllabusMeta`, `IcsStatus`) + type aliases (`FlowMode`, `EnrollmentStatus`, etc.); `Task` now includes `tag: string | null`
- `src/wizard/CoachMarkWizard.tsx` — orchestrator; reads `wizardCompleted`; calls `startWizard()` on mount; navigates to Schedule tab (step 1) and Chat tab (step 2) via `router.navigate`
- `src/wizard/WizardStep1.tsx` — Canvas connect; dark backdrop + calendar spotlight + `Animated` slide-up card + ICS URL modal with validation + `KeyboardAvoidingView` so keyboard doesn't cover input; `POST /ics/connect` → Alert → `advanceWizard()`
- `src/wizard/WizardStep2.tsx` — chat intro; backdrop + input-bar spotlight + slide-up card; both "Got it" and "Skip" call `advanceWizard()`
- `src/hooks/useTasks.ts` — `useTasks(filters?)`, `useTask(id)` (cache lookup), `useUpdateTask()`, `useDeleteTask()`, `useCreateTask()`, `useSubtasks(taskId)`, `useBreakdownTask()`
- `src/hooks/useUser.ts` — `useUser()` React Query hook; queryKey `['user']`, staleTime 5 min
- `src/hooks/useChatHistory.ts` — `useChatHistory(flow)` (staleTime 0, always fresh on mount); `useClearChatHistory()` mutation (DELETE + invalidate)
- `src/hooks/useChatStream.ts` — SSE via XHR + `onprogress`; handles `token` / `side_effects` / `done` events; invalidates React Query keys per side-effect type; fire-and-forget `logEvent('chat_turn')`; graceful fallback if stream closes without `done`
- `src/wizard/WizardStep3.tsx` — feature discovery; dimmed overlay + tall card with 3 icon/title/body rows; "Let's go" → `completeWizard()` (writes `wizardCompleted: true` to AsyncStorage)
- `app/(tabs)/profile/syllabus-upload.tsx` — two-state screen (paste → review); paste state: course name/quarter fields + large text area + sticky "Save syllabus" footer button; on save: `POST /syllabus` → if `tasks.length === 0` auto-confirms and shows success; if tasks found transitions to review state; review state: editable task cards (title, due date, priority badge, remove button) + "Add X assignments to TODO" primary + "Save syllabus without adding tasks" secondary; both confirm paths call `POST /syllabus/confirm/:jobId` and invalidate `['tasks']`; **currently blocked: `POST /syllabus` requires a valid UUID for `course_id` but frontend has no `GET /courses` endpoint to fetch one — see Syllabus section below**
- `app/(tabs)/profile/courses.tsx` — lists courses derived from task `course_id` groupings; "Upload Syllabus" navigates to `syllabus-upload?courseId=<uuid>` (passes real UUID when available, or 'Unassigned' which resolves to `null` on the upload screen); `SafeAreaView` updated to `react-native-safe-area-context`

---

## Integration Sprint — Tab Stitching & Bug Fixes

Cross-tab audit completed 2026-05-08. All 4 main tabs and all profile sub-screens are built by the team. This sprint closes the gaps between them before user-study testing. Work in this order; do not start Syllabus or Dashboard until all items below are checked off.

### P1 — Crash & stale-data bugs ✅ DONE

- [x] **`app/(tabs)/profile/major-goals/[id].tsx` — missing `router` import** — fixed
- [x] **`app/(tabs)/profile/major-goals/[id].tsx` — React Query key mismatch** — both mutations now invalidate `['goals', 'major']` (prefix match)

### P2 — Type correctness ✅ DONE

- [x] **`src/api/tasks.ts`** — `'tag'` added to `updateTask` Pick
- [x] **`src/types/api.ts`** — dead `MajorGoal` interface removed

### P3 — Session logging ✅ DONE

- [x] `todo/index.tsx` — `task_completed`
- [x] `todo/[id].tsx` — `task_completed` + `task_breakdown_requested`
- [x] `profile/major-goals.tsx` — `major_goal_set`
- [x] `profile/index.tsx` — `ics_synced`
- [x] `chat/index.tsx` — `startSession` guard (`sessionStarted` ref, fires once before first message)

### P4 — Missing profile feature ✅ DONE

- [x] **`src/api/ics.ts`** — `disconnectIcs()` added (`DELETE /ics/disconnect`)
- [x] **`profile/index.tsx`** — "Disconnect Canvas" destructive Pressable with Alert confirmation; invalidates `['ics-status']` + `['tasks']`

### Additional Bug Fixes — 2026-05-08 (found during live testing)

**Chat tab**
- `useChatStream.ts` — `<side_effects>…</side_effects>` XML blocks leaked into token stream and were rendered inside assistant bubbles; now stripped before display and finalization via `stripSideEffectBlocks()`

**TODO tab**
- `todo/index.tsx` + `todo/[id].tsx` — delete gated only on `source === 'ics'`; backend returns 403 for `ai` and `syllabus` sources too; now all `source !== 'manual'` tasks use done-toggle (soft remove) with source-appropriate alert message
- `todo/[id].tsx` — task title in detail header used `ts.title` (Syne ExtraBold 20px, `numberOfLines=1`) causing truncation; changed to `DMSans_500Medium` 15px, `numberOfLines=2`

**Profile — Major Goals**
- `major-goals.tsx` — "Choose a major" modal had no close button (only Android back gesture); added "✕ Close" pressable to modal header
- `src/api/goals.ts` — `POST /goals/major` body was sending `majorReqId` (camelCase) then `major_req_id` mismatch; now correctly sends `{ major_req_id }` (snake_case) matching backend validation; `application_deadline` removed from body (backend derives it from the major requirements row)
- `src/types/api.ts` — `Major.checklist_steps` was typed as `string[]`; actual API response is `Array<{ label: string; step_id: string }>`; type corrected and detail screen FlatList updated to use `step.step_id` / `step.label`
- `src/api/goals.ts` — `getMajorGoals('all')` was sending `?status=all` which the backend doesn't recognise; now omits the param when `status === 'all'` (no filter = all goals)

### Known bugs — needs further investigation (all tabs affected)

> **Do not mark any tab as "complete" yet.** Live device testing has surfaced bugs in all 4 tabs. Fix bugs before building new features (Syllabus, Dashboard, push deep-links).

- **Chat**: SSE side-effect invalidation may not be firing correctly (backend may only embed side effects in token stream, not as a separate `side_effects` event); needs verification that tasks/schedule actually update after Claude actions
- **TODO**: tag display unverified — tags only generated for `source=manual` tasks; confirm backend is returning non-null `tag` on `POST /tasks` response
- **Profile / Major Goals**: goal detail screen still under active debugging — checklist rendering, goal creation flow, and `GET /majors/:id` call all need end-to-end verification
- **Schedule**: not yet tested on device; block CRUD and heat map toggle untested

### Additional Bug Fixes — 2026-05-11

**UI / Layout**
- `app/(tabs)/chat/_layout.tsx` + `app/(tabs)/schedule/_layout.tsx` — created Stack layouts for chat and schedule tab folders; without them Expo Router cannot surface `tabBarIcon` for these segments (chat and schedule icons were missing from tab bar)
- `app/(tabs)/chat/index.tsx` + `app/(tabs)/todo/index.tsx` — `SafeAreaView` changed to `edges={['top']}`; tab bar already owns the bottom safe area, double-applying it caused last-item flicker in TODO and input position stutter in Chat on every tab switch
- `src/components/chat/ChatInput.tsx` — `multiline={false}` → `multiline`; input now expands vertically; `inputStyles.row` changed to `alignItems: 'flex-end'` so send button anchors to bottom of tall input; `maxHeight: 120` added to cap growth

**Onboarding**
- `app/(onboarding)/profile.tsx` — enrollment-status-branched major field: in-major → free-text input; pre-major → major picker modal (same list as major-goals) that also calls `POST /goals/major` on continue

### Deferred — out of scope until bugs resolved

- Dashboard / chat empty state
- Push notification deep links — requires EAS Build

---

## What's Next (in order)

### 1. ✅ TODO tab — complete

All gaps resolved. Known deferred items: course grouping (no `GET /courses` endpoint — flat list acceptable for user study); deep-link to task detail without prior list fetch shows spinner indefinitely (low priority).

### 2. ✅ Schedule tab — complete

`src/api/schedule.ts`, `src/hooks/useSchedule.ts`, `useHeat.ts` built. `ExpandableCalendar` (react-native-calendars) with heat map toggle, block CRUD modal, offline banner. `study_block_added` and `heat_map_toggled` session events wired. Block type pills (study / class / commitment / other); class blocks read-only.

### 3. ✅ Chat tab — complete (merged to main)

All flow tabs built (Chat / Planning / Quarter plan / Advising), SSE streaming, markdown bubbles, ShortcutBar, offline state, clear-conversation, wizard fixes. **Remaining item tracked in Integration Sprint P3:** session start before first message.

### 4. ✅ Profile tab — complete

`profile/index.tsx`, `edit.tsx`, `courses.tsx`, `notifications.tsx`, `major-goals.tsx`, `major-goals/[id].tsx` all built. Enrollment-gated Major Goals link, ICS status + sync, logout. **Remaining items tracked in Integration Sprint P1 and P4.**

### 5. 🚧 Session logging — partially complete

`study_block_added` and `heat_map_toggled` wired in schedule tab. Remaining events (`task_completed`, `task_breakdown_requested`, `major_goal_set`, `ics_synced`, session start in chat) tracked in Integration Sprint P3.

### 6. Push notification deep links
EAS Build needed for physical device push. Build receive + deep-link handlers in `app/_layout.tsx`: extract `taskId`/`goalId` from notification data, route to `todo/[id]` or `profile/major-goals/[id]`, log `notif_tapped` session event.

### 7. 🚧 Syllabus — frontend built, blocked on backend `GET /courses`

Frontend (`profile/syllabus-upload.tsx`, `src/api/syllabus.ts`) is complete. The screen pastes syllabus text, calls `POST /syllabus`, shows an assignment review/confirm flow if due dates are found, and calls `POST /syllabus/confirm/:jobId` to persist.

**Blocker:** `POST /syllabus` requires `course_id` as a valid UUID FK to the courses table. The frontend has no way to obtain course UUIDs — `GET /courses` does not exist, and ICS-imported tasks arrive with `course_id: null`. Passing a plain string (e.g. "CSE 123") fails with `Invalid input syntax for type uuid`; passing `null` fails with `course_id is required`.

**Agreed backend fix — Option A: add `GET /courses`**
Expose the courses table so the frontend can present a real course picker (like the major selector in onboarding) using actual UUIDs. Once this endpoint exists:
1. Add `src/api/courses.ts` — `getCourses()` → `GET /courses`
2. Add `src/hooks/useCourses.ts` — React Query wrapper, staleTime 5 min
3. Replace the static courseId query param in `syllabus-upload.tsx` with a live picker that shows course names + sends the UUID

This also fixes `profile/courses.tsx` — it currently groups tasks by raw UUID (or shows "Unassigned") because there is no course name to display.

### 8. ⏳ Dashboard / chat empty state — deferred
**Do not start until the chat tab is stable and merged.** When the chat FlatList is empty (no history for the active flow), render a compact dashboard summary instead of a blank screen using `GET /users/me/dashboard` → `{ tasks_due_soon, schedule_today, nudges, heat_this_week }`. Once the user sends a message the cards scroll away and never reappear. No new tab needed — this is an empty-state enhancement to the existing Chat tab. Requires a `useDashboard` hook + a lightweight summary card component.
