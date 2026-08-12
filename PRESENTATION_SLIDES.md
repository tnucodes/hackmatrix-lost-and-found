# 🖨️ Presentation Slides: Trust — Lost & Found

This document contains a slide-by-slide script and structure to help you prepare your presentation slides and pitch to the hackathon judges.

---

## 📽️ Slide 1: Title Slide
* **Slide Title:** **Trust: Lost & Found**
* **Sub-tagline:** A Secure, AI-Powered & Gamified Campus Retrieval System
* **Visuals:** Project Logo, screenshot of the landing page showing the Neo-Brutalist theme.
* **Speaker Script:**
  > *"Good morning judges. We are a team of CSE students, and today we are excited to introduce 'Trust', a smart, AI-driven Lost & Found platform designed specifically for college campuses. It goes beyond simple listings to solve the security, privacy, and trust gaps in traditional retrieval methods."*

---

## 📽️ Slide 2: The Problem
* **Slide Title:** **The Campus Lost & Found Mess**
* **Key Bullet Points:**
  - **WhatsApp & Poster Chaos:** Messages get lost in clutter; no search history.
  - **Lying & Impersonation:** Anyone can claim a found phone or wallet by pretending it's theirs.
  - **Privacy Risks:** Students post phone numbers publicly to find owners, opening them up to spam/harassment.
  - **Zero Incentives:** There is no motivation for students to spend time reporting items they find.
* **Visuals:** A chaotic graphic representation of chat lists or a question mark over standard message groups.
* **Speaker Script:**
  > *"Right now, campuses rely on WhatsApp groups or paper posters to report lost items. Messages get buried, students have to compromise their privacy by posting their phone numbers, and anyone can claim an expensive item just by lying. There is also no system in place to reward honest finders."*

---

## 📽️ Slide 3: The Solution
* **Slide Title:** **Introducing: Trust**
* **Key Bullet Points:**
  - **Smart Matcher:** Gemini AI compares lost reports against found listings semantically.
  - **Image Vision Analysis:** Auto-fills item details from photos using Gemini.
  - **Leaflet Campus Maps:** Pinpoints exact coordinates on a free, interactive campus map.
  - **In-App Messaging:** Anonymized real-time chat so students never share personal contact details.
  - **Handshake Verification PIN:** Secured gamification to award Trust Points safely.
* **Visuals:** Clean screenshots of the dashboard showing the unified feed, leaderboard, and report wizards.
* **Speaker Script:**
  > *"'Trust' solves this by centralizing listings. We use Google Gemini AI to analyze found items from photos, predict matches semantically, and let users chat in real time. We also introduce a physical verification mechanism called the Handshake PIN to gamify returns safely."*

---

## 📽️ Slide 4: User Experience & Custom Design
* **Slide Title:** **Visual Identity: Neo-Brutalism**
* **Key Bullet Points:**
  - **High-Impact Aesthetics:** Standout visual identity with custom shadows, borders, and animations.
  - **Conversational 2-Step Wizards:** Simplified workflows for reporting lost or found items.
  - **Tactile Micro-Animations:** Custom interactive buttons with hover and click state transformations.
  - **Fonts:** Space Grotesk (headings) and Plus Jakarta Sans (body copy) for a modern, readable feel.
* **Visuals:** Close-up screenshots of report forms, buttons, or CSS code snippets.
* **Speaker Script:**
  > *"We wanted our app to feel modern and premium. We designed a custom Neo-Brutalist theme featuring tactile buttons that animate when clicked, clear status badges, and simplified 2-step report wizards to keep form filing simple."*

---

## 📽️ Slide 5: Under the Hood — Tech Stack
* **Slide Title:** **System Architecture**
* **Key Bullet Points:**
  - **Next.js Pages Router:** Handles both page routing and backend serverless API endpoints.
  - **Firebase Firestore:** Live, real-time database listener subscriptions (`onSnapshot`).
  - **Firebase Authentication:** Handles secure user registration and sign-in context.
  - **Google Gemini Flash API:** Vision analysis and semantic text processing.
  - **react-leaflet + OpenStreetMap:** Coordinate storage and rendering (100% free/billing-free map framework).
* **Visuals:** Simple diagram showing: React Frontend ⟷ API Routes ⟷ Gemini Flash / Firebase Firestore.
* **Speaker Script:**
  > *"Our stack is built on Next.js. We use Firebase for authentication and database management. The database uses real-time listeners, which update claim states and chat messages instantly. For AI and mapping, we integrate Google Gemini and react-leaflet."*

---

## 📽️ Slide 6: Dev Trick — Canvas Base64 Uploads
* **Slide Title:** **Solving the Storage Billing Hurdle**
* **Key Bullet Points:**
  - **The Problem:** Firebase Cloud Storage requires paid billing.
  - **The Solution:** HTML5 `<canvas>` client-side compression.
  - **How it works:**
    - Image is loaded into a virtual canvas.
    - Width is scaled to `600px` (aspect ratio preserved).
    - Image is compressed to a Base64 string at `70%` JPEG quality.
    - Base64 is stored directly as a text field in Firestore.
  - **Benefit:** Fast load times, zero-cost, runs on free tier.
* **Visuals:** Before-and-after resolution scale comparison, or canvas drawing snippet.
* **Speaker Script:**
  > *"A major technical challenge we solved was handling image uploads on the Firebase free tier, which normally blocks file uploads. By compressing images down to 600px width inside a browser canvas element, we convert them into small Base64 strings. This lets us store images directly in the database without any hosting cost."*

---

## 📽️ Slide 7: Security — The Handshake Verification
* **Slide Title:** **Preventing Point Farming (Security)**
* **Key Bullet Points:**
  - **The Threat:** Users reporting fake items and claiming them themselves to farm leaderboard points.
  - **The Defense:** A 4-digit numeric code generated upon item creation.
  - **Finder's View:** Shows the code (e.g., `4291`).
  - **Claimer's View:** Shows a numeric entry pad.
  - **In-Person Verification:** Finder tells the claimer the PIN during physical handover.
  - **Action:** Matching the PIN updates the status to `verified_resolved` and awards both parties **+50 Trust Points**.
* **Visuals:** Side-by-side comparison of the Finder's screen vs. the Claimer's keypad screen.
* **Speaker Script:**
  > *"To gamify the app safely, we created the Handshake system. When a found item is reported, a 4-digit code is generated. The finder sees the code, and the claimer sees a PIN pad. When they meet in person on campus, the finder shares the PIN. Entering it verifies the handoff and awards Trust Points to both users, making farming impossible."*

---

## 📽️ Slide 8: AI Integration — Gemini Flash
* **Slide Title:** **Google Gemini Flash Integration**
* **Key Bullet Points:**
  - **Vision Analysis:** Extracts details and tags automatically from photos to reduce user manual typing.
  - **Semantic Matcher:** Compares lost descriptions with found items naturally (detects that 'blue flask' matches 'navy thermos').
  - **Stable API endpoint:** Hardcoded to `gemini-flash-latest` (Gemini 3.6 Flash) for reliable speed and reliability.
* **Visuals:** Diagram showing a photo going in, and tags + description returning from Gemini.
* **Speaker Script:**
  > *"We leverage Gemini Flash in two ways. First, vision analysis auto-fills titles and tags on upload. Second, semantic matching recommends found items to lost reports. It doesn't look for exact keyword matches; instead, it understands the context, helping users find lost items much faster."*

---

## 📽️ Slide 9: Future Scope
* **Slide Title:** **Future Enhancements**
* **Key Bullet Points:**
  - **College SSO Integration:** Restrict access to students with verified university emails.
  - **AI Image Matching:** Let users upload photos of lost items to scan found listings.
  - **Email Alerts:** Auto-notify users when Gemini finds a high-confidence match.
  - **Campus Security Dashboard:** Admin interface for security personnel to manage items.
* **Visuals:** List of icons showing Email, SSO, Search, Security.
* **Speaker Script:**
  > *"In the future, we plan to restrict signups to college Single Sign-On (SSO), add image-to-image matching where you search using a photo, and create an admin dashboard for campus security to manage unclaimed items."*

---

## 📽️ Slide 10: Summary & Q&A
* **Slide Title:** **Building a Trustworthy Campus**
* **Key Bullet Points:**
  - Structured & Searchable listings.
  - AI-assisted entry & recommendation.
  - Secure communication.
  - Verified physical returns.
* **Speaker Script:**
  > *"By combining modern design, real-time synchronization, and Google's Gemini AI, we've created a platform that builds a safer and more cooperative campus community. Thank you, and we are happy to take any questions."*
