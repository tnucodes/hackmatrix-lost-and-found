# 🎓 Hackmatrix Hackathon Guide: Trust — Lost & Found

Welcome to your guide for the **Trust: Lost & Found** campus platform! As B.Tech CSE students, this guide will help you understand the project, how its components interact, and how to confidently explain it to the hackathon judges.

---

## 💡 1. Summary of the Idea

### The Problem
Most college campuses rely on informal channels like WhatsApp groups, Telegram channels, or physical notice boards to report lost or found items. This leads to several issues:
- **Information Chaos:** Messages get buried quickly under chat spam.
- **No Searchability:** You cannot easily search for a lost item from two weeks ago.
- **Privacy Risks:** Sharing phone numbers publicly to claim items can lead to harassment.
- **Lack of Trust:** Anyone can claim a found item (like an expensive calculator or AirPods) by simply lying, and there's no incentive for finders to report items.

### The Solution: "Trust: Lost & Found"
**Trust** is an intelligent, secure, and gamified campus Lost & Found platform. It replaces messy chat groups with a clean, structured interface and adds smart features:
1. **AI-Powered Search & Tagging:** Automatically describes found items and tags them using AI vision.
2. **Interactive Campus Mapping:** Visualizes precisely where an item was lost or found using open-source, free maps.
3. **Smart Matcher:** Automatically suggests likely matches for lost reports using semantic AI comparisons.
4. **Secure In-App Chat:** Allows finders and losers to communicate directly inside the application without revealing personal phone numbers or email addresses.
5. **The Handshake System:** A secure verification protocol (inspired by Uber's PIN system) that proves a physical return took place before marking an item resolved and awarding **Trust Points** to build a campus leaderboard.

---

## 🛠️ 2. Summary of the Tech Stack

Here is the tech stack breakdown and why we chose each piece:

| Technology | Layer | Why We Used It (The Developer Perspective) |
| :--- | :--- | :--- |
| **Next.js (Pages Router)** | Framework | Provides clean routing (each file in [src/pages](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages) is a webpage), built-in API routing (serverless backend endpoints), and fast development. |
| **Firebase Firestore** | Database | A NoSQL cloud database. It supports real-time synchronization (`onSnapshot`), meaning changes in the database (like a verified handover or a new chat message) instantly update the UI without needing a page reload. |
| **Firebase Authentication** | User Identity | Handles secure signups and logins. We wrapped the application in a React Context ([AuthContext.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/context/AuthContext.js)) to make the logged-in user details available to any page instantly. |
| **Google Gemini Flash** | AI Engine | Specifically `gemini-flash-latest` (Gemini 3.6 Flash) for ultra-fast, cheap, and accurate vision and text processing. |
| **react-leaflet + OpenStreetMap** | Maps | Provides interactive maps without needing a credit card or paid billing account (which Google Maps API requires). |
| **Tailwind CSS v4** | Styling | A utility-first CSS framework. We used it to design a custom **Neo-Brutalist** design theme (characterized by thick black borders, flat primary colors, and heavy drop shadows). |
| **Framer Motion** | Animation | Adds smooth page transitions, modal popups, and the dashboard's initial splash screen loading animation. |
| **Lucide React** | Icons | Provides premium-looking vector icons (like maps, alerts, chat bubbles, cameras) for a modern UI. |

---

## 🤖 3. Special Working Logics (Under the Hood)

This is the most important section for the judges! They will ask you how you implemented specific features and solved technical hurdles. Here are the five key architectural innovations:

### 1. The Canvas Base64 Image Upload Trick (Bypassing Paid Storage)
* **The Problem:** Firebase Cloud Storage requires paid billing to be enabled. For a free hackathon account, we couldn't upload files directly.
* **The Solution:** We compress images on the client side using the HTML5 `<canvas>` API, convert them to a Base64 string, and store them directly in the Firestore document.
* **How it works:**
  1. The user selects an image in the report wizard.
  2. The `compressImage` helper function in [report-found.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/report-found.js#L14-L34) loads the image, scales down its maximum width to `600px`, and draws it on a canvas.
  3. It exports it at `70%` JPEG quality using `canvas.toDataURL("image/jpeg", 0.7)`.
  4. This reduces the image size to under **150 KB** (well within Firestore's 1 MB document limit). The string is saved in the database under `imageUrl` and rendered directly using `<img src={imageUrl} />`.

### 2. AI Image Vision Analysis
* **How it works:**
  1. When a user uploads a photo of a found item, the page automatically calls the API route [analyze-image.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/api/analyze-image.js).
  2. It sends the Base64 image data to the Google Generative AI SDK using the `gemini-flash-latest` model.
  3. The prompt instructs Gemini to output a structured description and 5-10 relevant tags.
  4. The API parses the model response, and the front-end auto-fills the Title field (e.g. *"Found Calculator"*) and the Description box for the student.

### 3. AI Smart Matcher (Semantic Recommendations)
* **The Problem:** Simple keyword search fails if someone writes "black smartphone" but the finder writes "dark grey iPhone 13".
* **The Solution:** We use Gemini's natural language understanding to perform semantic matching.
* **How it works:**
  1. In [item/[id].js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/item/%5Bid%5D.js), when looking at a Lost report, the user can click **"Find Potential Matches ✨"**.
  2. The app fetches all active found items from Firestore.
  3. It calls [find-matches.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/api/find-matches.js), sending the lost item's title/description alongside the list of found items.
  4. Gemini reads the descriptions, compares them semantically (e.g., matching "water flask" with "blue thermos"), and returns a list of matched IDs.
  5. The front-end filters and displays these matching items instantly.

### 4. Deterministic Chat Room IDs (Zero-Database Routing)
* **The Problem:** Traditional chat apps require creating a chat room in a database, looking up its ID, and then loading the page.
* **The Solution:** We use a deterministic formula to generate chat room IDs:
  $$\text{Chat ID} = \text{itemId} + \text{"\_"} + \text{initiatorUserId}$$
* **How it works:**
  * When User A wants to chat about an item, the chat room is loaded at `/chat/[itemId]_[UserA_ID]`.
  * Because the ID is mathematically predictable, both the finder and the owner can reconstruct the URL instantly without doing database lookups first.
  * We write a single chat document to Firestore's `chats` collection containing `participants: [ownerId, initiatorId]`. The Inbox page ([inbox.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/inbox.js)) uses a Firestore query to fetch all chats where the active user's ID is in the `participants` array.

### 5. The Handshake PIN System (Secure Gamification)
* **The Problem:** If users get "Trust Points" for returning items, what stops a user from reporting fake items and immediately claiming they returned them to farm points?
* **The Solution:** A physical verification loop inspired by ride-sharing safety codes.
* **How it works:**
  1. When a found item is reported, the system generates a random 4-digit code (e.g., `5832`) and saves it under `handshakeCode` in the item's document.
  2. **Finder's View:** If the logged-in user is the finder, the item page displays the code in large text.
  3. **Claimer's View:** If the logged-in user is NOT the finder, they see a numeric keypad entry box asking for the Handshake PIN.
  4. The finder and claimer meet in person on campus. Once the finder hands over the item, they tell the claimer the 4-digit PIN.
  5. The claimer inputs it on their phone. If it matches, the status of the item updates to `verified_resolved`, and both users are awarded **+50 Trust Points** towards their Leaderboard ranking.
  6. Because a user cannot access their own input box, it is impossible to self-verify.

---

## 🧭 4. Navigation & Directory Structure

To edit the codebase or showcase specific parts to a judge, locate the files here:

* 🏠 **Homepage & Unified Feed:** [src/pages/index.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/index.js)
  * Renders live statistics, the user's active report dashboard, the leaderboard, and the searchable feed.
* 📝 **Lost Report Form Wizard:** [src/pages/report-lost.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/report-lost.js)
  * Simple 2-step card wizard to create a lost listing.
* 📸 **Found Report Form Wizard:** [src/pages/report-found.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/report-found.js)
  * 2-step wizard: Step 1 (Photo Upload & Auto-AI analysis), Step 2 (Campus map picker & coordinates).
* 🕵️‍♂️ **Item Detail Page:** [src/pages/item/[id].js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/item/%5Bid%5D.js)
  * Displays details, the Leaflet map display, the Smart Matcher (for lost items), and the Handshake PIN keypad (for found items).
* 💬 **Chat Room:** [src/pages/chat/[id].js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/pages/chat/%5Bid%5D.js)
  * Live messaging with auto-scroll and top metadata guidance banner.
* 🌐 **Map Components:**
  * Map Picker (drops pins on click): [src/components/MapPicker.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/components/MapPicker.js)
  * Map Display (shows static pin): [src/components/MapDisplay.js](file:///Users/tanuja/Desktop/hackmatrix-lost-and-found/src/components/MapDisplay.js)
  * *Note:* Because Leaflet accesses the browser's `window` object, Next.js imports them using `dynamic(() => import(...), { ssr: false })` to avoid server-side crashes.
