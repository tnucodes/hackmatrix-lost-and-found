# 📓 Development Log — Trust: Lost & Found

This document is a full, chronological record of how this project was built during the Hackmatrix hackathon, including every feature, every major decision, every bug, and the thought process behind all of it.

---

## Phase 1 — Project Setup & Design System

**Goal:** Get a Next.js app running with a strong visual identity.

The first instinct was to pick a design language that would make the app stand out from the typical blue-and-white hackathon entries. We chose **Neo-Brutalism** — a design style characterised by thick black borders, solid drop shadows, flat blocks of strong colour (yellow, pink, green, blue, purple), and bold uppercase typography.

### What was built:
- Initialised the Next.js app with the Pages Router
- Configured Tailwind CSS with a custom colour palette (`neo-pink`, `neo-yellow`, `neo-blue`, `neo-green`, `neo-purple`, `neo-bg`)
- Created reusable Tailwind utilities: `neo-border`, `neo-shadow`, `neo-card`, `neo-button`
- Animated splash screen on the dashboard using `framer-motion` (slides up to reveal the app after ~2.5 seconds)
- Responsive grid layout for the main dashboard

### Key decision: Tailwind over plain CSS
Tailwind's utility classes meant we could iterate on the design extremely fast. All the neo-brutalist tokens are defined once in `tailwind.config.js` and used everywhere.

---

## Phase 2 — Firebase Authentication

**Goal:** Secure user accounts so only logged-in students can report or claim items.

### Architecture decision: React Context
Rather than prop-drilling Firebase's user object down through every component, we created `src/context/AuthContext.js`. It wraps the whole app (in `_app.js`) and exposes `user`, `login`, `logout`, and `signup` to any component via `useAuth()`.

### What was built:
- `AuthContext.js` — Firebase `onAuthStateChanged` listener that keeps user state fresh
- `login.js` — Email/password sign-in page with Neo-Brutalist form styling
- `signup.js` — Registration page
- Conditional rendering on the dashboard (hides "Report" buttons and shows "Log In" prompts for unauthenticated users)
- Redirect protection on report pages (sends unauthenticated users to `/login`)

---

## Phase 3 — AI-Powered Reporting & Image Analysis

**Goal:** Make reporting a found item intelligent — not just a text form.

### Problem: Firebase Storage billing
Firebase Storage requires billing enabled on the Google Cloud project. For a hackathon prototype on free-tier accounts, this was a blocker.

**Solution — Canvas Base64 Trick:**
Instead of uploading to Firebase Storage, we compress images using the browser's `<canvas>` element. The `compressImage()` function in the report forms:
1. Draws the uploaded image onto a 600×600 canvas at 70% JPEG quality
2. Exports it as a Base64 string using `canvas.toDataURL('image/jpeg', 0.7)`
3. Stores the Base64 string directly in the Firestore document as the `imageUrl` field

No storage bucket. No billing. Images load directly from Firestore.

### Problem: Gemini model availability
Early API calls using `gemini-2.5-flash-lite` and `gemini-2.5-flash` returned 500 errors. These endpoints are restricted for new API users.

**Testing process:** We wrote `test-models.js` (a standalone Node.js script) and iterated through multiple model IDs to find one that actually responded. `gemini-flash-latest` (Gemini 3.6 Flash) was confirmed stable.

### What was built:
- `src/pages/api/analyze-image.js` — Next.js API route that:
  1. Receives a Base64 image
  2. Sends it to Gemini with a structured prompt asking for a JSON object with `description` and `tags`
  3. Returns the parsed JSON to the client
- `report-found.js` — Reports a found item. On submit:
  1. Compresses image to Base64
  2. Calls `/api/analyze-image` to get AI description + tags
  3. Saves everything to Firestore `foundItems` collection
- `report-lost.js` — Simpler form (no AI analysis needed) that saves to Firestore `lostItems`
- `browse.js` — Feed page showing all lost and found items merged and sorted by date

---

## Phase 4 — AI Smart Matching

**Goal:** When someone reports a lost item, automatically suggest found items that could be theirs.

### How it works:
1. User opens a Lost Item's detail page
2. Clicks "Find Potential Matches ✨"
3. The page fetches all found items from Firestore
4. Sends the lost item's description + all found items to `/api/find-matches`
5. Gemini returns a JSON array of IDs of the found items that best match
6. The page filters the local array to show only those items as cards

### What was built:
- `src/pages/api/find-matches.js` — Gemini API route that compares descriptions semantically
- Smart Matcher UI section on `item/[id].js` (only visible for Lost items)
- Match result cards with image preview, location, and a tag badge

---

## Phase 5 — Interactive Maps

**Goal:** Replace the decorative Google Maps iframe with real, interactive maps that save GPS coordinates.

### Problem: Google Maps billing
Google Maps' interactive JavaScript API (needed for dropping pins) requires a paid billing account. Using iframes was possible for display but couldn't capture coordinates.

**Solution — OpenStreetMap + react-leaflet:**
- OpenStreetMap is fully free, open-source map data
- `react-leaflet` provides React components wrapping Leaflet.js
- `npm install leaflet react-leaflet`

### SSR crash fix:
Leaflet's JavaScript directly references `window` and `document`, which don't exist during Next.js server-side rendering. Both map components are imported with:
```js
const MapPicker = dynamic(() => import('../components/MapPicker'), { ssr: false });
```
This defers loading to the browser only.

### Custom pin styling:
Rather than the default Leaflet marker, we used `L.divIcon()` to create custom Neo-Brutalist pins using inline HTML:
```html
<div style="background-color: #FF00FF; border: 4px solid black; width: 28px; height: 28px; border-radius: 50%; box-shadow: 4px 4px 0px black;"></div>
```

### What was built:
- `src/components/MapPicker.js` — Clickable map component. User clicks to set a `position` state, which triggers `onLocationSelect({ lat, lng })` callback. Default center: New Delhi coordinates.
- `src/components/MapDisplay.js` — Read-only map centered on saved `{ lat, lng }` coordinates with a marker
- Updated `report-lost.js` and `report-found.js` to include `MapPicker` and save `coordinates: { lat, lng }` to Firestore
- Updated `item/[id].js` to show `MapDisplay` when coordinates exist, with a legacy Google iframe fallback for older items

### Status tracking:
While updating the item system, we added a full status lifecycle:
- All new items are created with `status: "active"`
- Resolved items are marked `status: "verified_resolved"` via the Handshake system
- Items display a bold status badge: `🔴 Active` or `✅ Resolved`
- Badges appear on both the Feed cards and the Item Detail page

---

## Phase 6 — Real-Time Chat & Inbox

**Goal:** Let the owner and the finder communicate directly inside the app without exchanging personal contact info.

### Chat architecture:
**Chat Room ID** = `{itemId}_{initiatorUserId}`

This is a deterministic ID. Neither party needs a lookup table — they both know the item's ID and the initiator's UID. The ID is created when the "Start Chat" button is clicked.

**Why not use the owner's UID?** The owner is not always the one who initiates the chat. The initiator (the person clicking "Start Chat" on someone else's item) is always the second user — so we use their UID.

### Inbox design:
When "Start Chat" is clicked, before routing, we write a parent document to Firestore:
```js
{ itemId, itemTitle, participants: [ownerId, initiatorId], updatedAt }
```
The Inbox page (`/inbox`) queries:
```js
where("participants", "array-contains", currentUser.uid)
```
This returns every conversation where the current user is a participant — from both sides.

### Real-time messages:
Messages live in a sub-collection: `chats/{chatId}/messages`. The chat room uses `onSnapshot` to listen for new messages in real time. On component unmount, the `unsubscribe` function from `onSnapshot` is called to clean up the listener and prevent memory leaks.

### UX fixes:
- **Auto-scroll:** A `useRef` (`messagesEndRef`) is attached to an invisible `<div>` at the end of the message list. A `useEffect` that depends on the `messages` array calls `messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })` whenever new messages arrive.
- **Fixed input bar:** The root layout was changed from `min-h-screen` to `h-screen overflow-hidden`, making the middle message area an internally scrollable flex child while the input bar stays fixed at the bottom.

### What was built:
- `src/pages/chat/[id].js` — Full real-time chat UI with auto-scroll and fixed bottom input
- `src/pages/inbox.js` — Message hub listing all active conversations
- "My Inbox" button added to the Dashboard with a purple Neo-Brutalist style
- "Start Chat" on item pages changed from a `<Link>` to an `async` function that creates the chat metadata first

---

## Phase 7 — Trust Points & Handshake Verification

**Goal:** Gamify the platform by rewarding users who successfully complete item returns — but do it securely to prevent point farming.

### The problem with naive gamification:
The first instinct was a simple "Mark as Returned" button. But this means any user can post a fake item and immediately click the button to farm points. With no verification, the leaderboard becomes meaningless.

### The Handshake Code solution:
**Inspiration:** Uber's safety PIN system. Before a driver starts a trip, the passenger confirms a code to prove they're in the right car. We applied the same principle to item returns.

**How it works:**
1. When any item is created, we silently generate a 4-digit code:
   ```js
   const handshakeCode = Math.floor(1000 + Math.random() * 9000).toString();
   ```
   This is saved to the Firestore document.

2. **Creator's view (own item page):** The verification box shows the code in large text with the instruction: *"Give this code to the other person when you meet in person."*

3. **Second party's view (someone else's item):** The verification box shows an input field with the instruction: *"Ask the poster for their 4-digit Handshake Code."*

4. The ternary `user.uid === item.finderId` is what determines which view is shown. A user literally cannot see the input box on their own item.

5. On verification:
   - The code is compared with `item.handshakeCode`
   - If they match, the Firestore document is updated: `{ status: "verified_resolved", verifiedUserEmail: user.email }`
   - Both the creator and the second party now appear on the leaderboard

### Leaderboard calculation:
The leaderboard fetches from **both** Firestore collections (`foundItems` and `lostItems`). For each document with status `verified_resolved` or `resolved`:
- The creator (`finderEmail` / `ownerEmail`) gets +50 points
- The verified second party (`verifiedUserEmail`) also gets +50 points

This means the leaderboard reflects genuine cooperation, not item count.

### Naming:
Points are called **"Trust Points"** (not "Hackmatrix Points" — renamed to better reflect the mission of building a trustworthy campus community).

---

## Bugs Fixed

| # | Bug | Symptom | Root Cause | Fix |
|---|---|---|---|---|
| 1 | Gemini 500 errors | Submit completed instantly with no AI analysis | Model IDs `gemini-2.5-flash` and `gemini-2.5-flash-lite` restricted for new users | Switched to `gemini-flash-latest` |
| 2 | `useAuth is not defined` | Item detail page crashed on load | Missing import after editing the top of `item/[id].js` | Added `import { useAuth } from '../../context/AuthContext'` |
| 3 | `MessageSquare is not defined` | Dashboard crashed after adding Inbox button | Icon added to JSX but not to the `lucide-react` import line | Added `MessageSquare` to the import |
| 4 | `id is not defined` | Item page crashed immediately | When adding `codeInput` state, the line `const { id, type } = router.query` was accidentally replaced | Re-added the router query destructuring |
| 5 | Chat input required scrolling | User had to scroll to the bottom of the page to type a message | Root `<div>` was `min-h-screen` so it grew to fit all content | Changed to `h-screen overflow-hidden` with flex internal scroll |
| 6 | Messages didn't auto-scroll | User had to manually scroll down after each message | No scroll logic implemented | Added `useRef` + `scrollIntoView` triggered by `useEffect` on `messages` state |

---

## What Could Come Next

- **Email Notifications** — Use Firebase Cloud Functions to send an email when a match is found
- **Image Search** — Let users search by uploading a similar image rather than text
- **Admin Dashboard** — For campus security to manage flagged items
- **Expiry System** — Automatically archive items older than 30 days
- **College SSO** — Restrict signups to a specific college email domain for verified campuses
