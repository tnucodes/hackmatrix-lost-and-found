# 🕵️‍♂️ Trust: Lost & Found

> A full-stack, AI-powered campus Lost & Found platform built for the **Hackmatrix** hackathon using **Next.js**, **Firebase**, and **Google Gemini Flash**.

---

## 🚀 What Is This?

Most campuses rely on WhatsApp groups and paper notices for lost & found. This app replaces that chaos with a structured, intelligent, and secure platform where students can report, match, and retrieve lost items — with a gamified trust system to reward good actors.

**Key Features:**
- 📸 **AI Image Analysis** — Upload a photo of a found item; Gemini Flash automatically describes it and extracts searchable tags
- 🗺️ **Interactive Maps** — Drop a GPS pin when reporting; the exact location is shown on the item details page
- 🤖 **Smart Matching** — Lost something? AI scans all found items and surfaces the most likely matches for you
- 💬 **Real-Time Chat** — Message the finder/owner directly in-app, with a full Inbox hub
- 🤝 **Handshake Verification** — An anti-cheat OTP system that proves two users physically met before awarding Trust Points
- 🏆 **Trust Leaderboard** — See who has helped return the most items on campus

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (Pages Router) |
| Database + Auth | Firebase (Firestore + Authentication) |
| AI | Google Gemini Flash (`gemini-flash-latest`) |
| Maps | react-leaflet + OpenStreetMap (free, no billing) |
| Styling | Tailwind CSS with Neo-Brutalism design system |
| Animations | framer-motion |
| Icons | lucide-react |

---

## 📁 Project Structure

```
src/
├── context/
│   └── AuthContext.js        # Firebase Auth React Context (global user state)
├── lib/
│   └── firebase.js           # Firebase app initialisation
├── components/
│   ├── MapPicker.js          # Interactive Leaflet map (for report forms — click to drop pin)
│   └── MapDisplay.js         # Read-only Leaflet map (for item detail page)
├── pages/
│   ├── index.js              # Dashboard: splash screen, action buttons, leaderboard
│   ├── browse.js             # Live feed of all lost & found items with filters
│   ├── report-lost.js        # Form to report a lost item (with map pin + handshake code)
│   ├── report-found.js       # Form to report a found item (with AI analysis + map pin)
│   ├── inbox.js              # Message hub: all active conversations in one place
│   ├── login.js              # Login page
│   ├── signup.js             # Signup page
│   ├── item/[id].js          # Item details (map, AI tags, smart matcher, chat, verification)
│   ├── chat/[id].js          # Real-time chat room with auto-scroll to latest message
│   └── api/
│       ├── analyze-image.js  # Gemini image analysis API route (POST)
│       └── find-matches.js   # Gemini smart-matching API route (POST)
```

---

## ⚙️ Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase
Create a project at [console.firebase.google.com](https://console.firebase.google.com), enable **Firestore** and **Email/Password Authentication**, and paste your config object into `src/lib/firebase.js`.

### 3. Configure Gemini API
Get a free API key at [aistudio.google.com](https://aistudio.google.com) and paste it into:
- `src/pages/api/analyze-image.js`
- `src/pages/api/find-matches.js`

### 4. Run the dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🔑 Key Architecture Decisions & Thought Process

### 1. Image Storage — Canvas Base64 Trick
**Problem:** Firebase Storage requires billing enabled. We didn't want to deal with credit cards at a hackathon.  
**Solution:** We use the browser's `<canvas>` API to compress images client-side, convert them to Base64 strings, and store the strings directly inside the Firestore document. No separate storage bucket needed. No billing. Images load instantly.

### 2. AI Model — `gemini-flash-latest`
**Problem:** The `gemini-2.5-flash-lite` endpoint is restricted for new API users and threw 500 errors. Several newer model IDs were also unavailable.  
**Solution:** After testing multiple endpoints, `gemini-flash-latest` (which resolves to Gemini 3.6 Flash) was confirmed stable and fast. It is hardcoded in the API routes for simplicity.

### 3. Maps — react-leaflet + OpenStreetMap
**Problem:** Google Maps interactive APIs (for dropping pins, not just viewing) require a paid billing account.  
**Solution:** OpenStreetMap data is 100% free. `react-leaflet` wraps it in clean React components. Since Leaflet uses the browser's `window` object, both map components use Next.js `dynamic()` with `{ ssr: false }` to prevent server-side rendering crashes. The map picker saves `{ lat, lng }` coordinates to Firestore. The display map reads them back and centers the view on that exact pin.

### 4. Chat Architecture — Deterministic Room IDs
**Problem:** Real chat apps need a way for two different users to end up in the same room.  
**Solution:** Chat room ID = `{itemId}_{initiatorUserId}`. This is deterministic — both participants can always reconstruct the URL without a database lookup. When a chat is initiated, a parent Firestore document is written to the `chats` collection with:
```js
{ itemId, itemTitle, participants: [ownerId, initiatorId], updatedAt }
```
This enables the **Inbox** page to query `where("participants", "array-contains", currentUser.uid)` to show all of a user's conversations.

### 5. Gamification — The Handshake Verification OTP
**Problem:** Without verification, any user could post a fake item and immediately "resolve" it to farm Trust Points indefinitely. This is a critical security flaw.  
**The Idea (Thought Process):** We needed proof that two physically distinct users completed a real exchange — without building a complex two-way approval notification system.  
**Inspiration:** Uber's safety PIN system — before a driver starts a ride, the passenger shows a PIN to confirm they're in the right car.  
**Our Solution:** When an item is created, the backend generates a random 4-digit `handshakeCode` (e.g. `4829`) and saves it to the Firestore document.

| Role | Experience |
|---|---|
| **Creator (finder/loser)** | Sees the 4-digit code displayed on their item's page. Tells it to the other person in person. |
| **Second Party (claimer)** | Sees an input box on the same page asking for the code. Enters it to "Verify & Claim Points". |

**Security:** A user cannot see the input box on their own item (the ternary check `user.uid === item.finderId` prevents it). A user cannot verify their own transaction.  
**Reward:** On successful verification, both the creator **and** the second party receive +50 Trust Points. The Leaderboard queries both `finderEmail` and `verifiedUserEmail` fields across both collections.

---

## 🏆 Full Feature Walkthrough

### Reporting a Found Item
1. Sign in → click **"Found Something"** on the dashboard
2. Fill in the title and description
3. Type a location name (e.g. "Canteen Area, near the main door")
4. Click on the interactive Leaflet map to drop a GPS pin
5. Upload a photo → Gemini Flash analyses it, extracts a description and tags
6. Submit. The item appears in the feed. A Handshake Code is silently generated.

### Reporting a Lost Item
1. Click **"Lost Something"**
2. Describe your item in as much detail as possible (colour, brand, distinguishing marks)
3. Drop a pin on the map for where you last had it
4. Submit

### Finding a Match (AI)
1. Open any **Lost Item** from the feed
2. Scroll to the **Smart Matcher** section and click **"Find Potential Matches ✨"**
3. The Gemini API compares your lost item's description against all found items in the database
4. The best matches are displayed as cards. Click any to view that found item.

### Verifying a Handover & Earning Trust Points
1. User A (the person who posted the item) sees their 4-digit Handshake Code on the item detail page
2. User A and User B physically meet and complete the item exchange
3. User A tells User B the code (`4829` for example)
4. User B opens the item's detail page on their phone, types the code in the input box, and clicks **"Verify & Claim Points"**
5. The system verifies the code, marks the item as ✅ `verified_resolved`, and records User B's email
6. Both users appear on the Leaderboard with +50 Trust Points

### Real-Time Chat & Inbox
1. Open any item that isn't yours
2. Click **"Start Chat"** — this writes the chat metadata to Firestore and redirects you
3. The chat room auto-scrolls to the latest message on load and on every new message
4. The input bar is always pinned to the bottom of the screen (fixed height layout)
5. Click **"My Inbox"** on the dashboard to see all your active conversations listed in one place

---

## 🐛 Notable Bugs Fixed During Development

| Bug | Root Cause | Fix |
|---|---|---|
| `useAuth is not defined` on item page | Missing import after a code edit | Added `import { useAuth }` to `item/[id].js` |
| `MessageSquare is not defined` on dashboard | Added Inbox button but forgot the icon import | Added `MessageSquare` to lucide-react import in `index.js` |
| Submit happened instantly with no analysis | 500 error from Gemini: wrong model endpoint | Switched from unavailable model to `gemini-flash-latest` |
| `id is not defined` on item page | When adding `codeInput` state, accidentally deleted `const { id, type } = router.query` | Re-added the destructured router query |
| Chat input bar required scrolling to reach | Root div was `min-h-screen` which grew with content | Changed to `h-screen overflow-hidden` with internal scroll on message list |

---

## 👨‍💻 About the Developers

A team of passionate first-year CSE B.Tech students built this for the **Hackmatrix** hackathon. Technologies explored: Next.js, Firebase, Gemini AI, react-leaflet, framer-motion, and Neo-Brutalist design systems.
