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

Follow these steps to get the app running on your phone. Takes about 10–15 minutes the first time.

### Step 1 — Install Node.js on your computer

1. Go to https://nodejs.org and click the **LTS** button (left side — the stable version)
2. Run the installer with all defaults
3. To verify: open **Terminal** (Mac) or **Command Prompt** (Windows) and type `node -v` — you should see something like `v20.x.x`

### Step 2 — Install Git

1. Go to https://git-scm.com/downloads, download for your OS, and install with all defaults

### Step 3 — Install Expo Go on your phone

- **iPhone:** Search "Expo Go" in the App Store
- **Android:** Search "Expo Go" in the Google Play Store

Create a free account at https://expo.dev — you'll need it to log in to Expo Go.

### Step 4 — Get the code

Open Terminal / Command Prompt and run:

```bash
git clone <repo-url>
cd u-wick-app
```

### Step 5 — Install dependencies

```bash
npm install
```

This downloads all the libraries the app needs. Takes 2–5 minutes — the scrolling text is normal.

### Step 6 — Create the environment file

The app needs to know where the backend server lives. Create a file called `.env.local` in the `u-wick-app` folder and paste this line into it:

```
EXPO_PUBLIC_API_URL=https://u-wick-api-hxaketgeedg9cjcr.centralus-01.azurewebsites.net/api
```

> **Tips for creating the file:**
> - **VS Code:** Right-click in the Explorer panel → New File → name it `.env.local`
> - **Mac:** Open TextEdit → Format → Make Plain Text → save as `.env.local`
> - **Windows:** Open Notepad → save as `.env.local` (set "Save as type" to "All Files" so it doesn't add `.txt`)

For local backend development: `EXPO_PUBLIC_API_URL=http://localhost:3000/api`

### Step 7 — Connect to the right Wi-Fi

> **This step is critical.** Your phone and your computer must be on the **same Wi-Fi network.**

When running in development mode, your computer streams the app to your phone over the local network. If they're on different networks the app won't load.

- Connect both to the same home or office Wi-Fi
- A personal hotspot (phone → computer) also works
- Most university/corporate networks block device-to-device traffic — use a hotspot instead if on one of those

If you're on a restricted network and can't use a hotspot, run `npm start -- --tunnel` instead of `npm start` (slower but works over any connection).

### Step 8 — Start the app

```bash
npm start
```

After a few seconds a **QR code** appears in the terminal.

- **iPhone:** Open the **Camera** app and point it at the QR code — tap the banner
- **Android:** Open **Expo Go** → "Scan QR code"

The first load takes 30–60 seconds while the code compiles. After that, any code changes appear on your phone automatically within a few seconds.

Press `Ctrl + C` in the terminal to stop the server.

### Pulling updates from teammates

Whenever someone pushes new code:

```bash
git pull
npm install
```

Then restart with `npm start`.

### Common problems

| Problem | Fix |
|---|---|
| `npm install` fails | Make sure Node.js is installed — run `node -v` to check |
| QR code won't connect | Phone and computer must be on the same Wi-Fi (Step 7) |
| Blank or error screen | Check that `.env.local` is saved correctly with no `.txt` extension |
| "Network request failed" in the app | The Azure backend may be sleeping — wait 30 s and retry |
| "Port 8081 already in use" | Another Expo server is running — quit it, or press `shift+r` in the terminal |

---

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
