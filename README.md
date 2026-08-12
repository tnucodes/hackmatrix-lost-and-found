# 🕵️‍♂️ Trust: Lost & Found

> A full-stack, AI-powered campus Lost & Found platform built for the **Hackmatrix** hackathon using **Next.js**, **Firebase**, and **Google Gemini Flash**.

---

## 🚀 What Is This?

Most campuses rely on WhatsApp groups and paper notices for lost & found. This app replaces that chaos with a structured, intelligent, and secure platform where students can report, match, and retrieve lost items — with a gamified trust system to reward good actors.

**Key Features:**
- 🏠 **Unified Landing Page** — A premium, high-impact landing page featuring live campus stats, podium-style trust leaderboard, and illustrated guides.
- 🏫 **Merged Search Feed** — Campus feed is embedded directly on the homepage, allowing quick keyword, location, and AI tag searches with active category switching.
- 🕵️‍♂️ **Side-by-Side User Dashboard** — Logged-in students can view and manage their active lost/found reports side-by-side. Safe Handshake PIN codes are displayed directly on their dashboard Found cards for instant physical access.
- 📸 **AI Image Analysis & Preview** — Upload a photo of a found item; Gemini Flash automatically describes it and extracts searchable tags. Drag-and-drop styling upload box displays live visual previews before submitting.
- 🗺️ **Interactive Maps** — Drop a GPS pin when reporting; Leaflet displays the exact coordinates on the item details page.
- 🤖 **Smart Matching** — Lost something? AI scans all found items and surfaces the most likely matches as premium suggested cards.
- 🤝 **Passcode safe handovers** — Balanced item details page with a digital PIN verification pad for claimers on Found items. OTP matches verify handovers to award Trust Points.
- 💬 **Integrated Chat Banner** — Direct messaging in-app with a parent metadata banner that displays item status and finder Handshake PIN codes directly inside the chat window.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (Pages Router) |
| Database + Auth | Firebase (Firestore + Authentication) |
| AI | Google Gemini Flash (`gemini-flash-latest`) |
| Maps | react-leaflet + OpenStreetMap (free, no billing) |
| Styling & Fonts | Tailwind CSS v4 + Space Grotesk / Plus Jakarta Sans Google Fonts |
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
│   ├── index.js              # Dashboard: landing page, live stats, side-by-side user dashboard, unified feed with search
│   ├── browse.js             # Feed view with aligned search, category filters, and premium cards
│   ├── report-lost.js        # Lost form (2-step card wizard with location text description and optional photo)
│   ├── report-found.js       # Found form (dashed upload, live preview, Gemini image scan, MapPicker)
│   ├── inbox.js              # Inbox hub: chat cards with dates, badges, and user tags
│   ├── login.js              # Polished login page with responsive inputs and custom borders
│   ├── signup.js             # Polished signup page
│   ├── item/[id].js          # Balanced 2-columns (media + map on left; details + PIN pad terminal on right)
│   ├── chat/[id].js          # Chat room with colored message bubble cards, and active context banners
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
| Flat buttons and no click states | `neo-button` class was used across pages but omitted from globals.css | Defined `@utility neo-button` in CSS with hover/active translations |
| Unbalanced item detail columns | Left column held only details image, causing right column to overflow vertically | Stacked image + Leaflet map on the left, and details + PIN safe on the right |
| Lost description enclosed in AI analysis box | Detail page rendered AI box whenever `aiDescription` was present, which was prefilled on lost reports | Restricted AI card rendering in `item/[id].js` to found items only (`type === "found"`) |
| Lost status stuck as active after found verification | Handshake verification completed on a found item, but the related lost report remained active | Passed `matchedLostId` in suggestions links, and queried active reports as a fallback in verification |
| Duplicate description on details page | Detailed Description and AI Vision cards showed the same text when pre-fills were unedited | Modified `item/[id].js` to only render the AI text if it differs from the user's manual description |

---

## 👨‍💻 About the Developers

A team of passionate first-year CSE B.Tech students built this for the **Hackmatrix** hackathon. Technologies explored: Next.js, Firebase, Gemini AI, react-leaflet, framer-motion, and Neo-Brutalist design systems.
