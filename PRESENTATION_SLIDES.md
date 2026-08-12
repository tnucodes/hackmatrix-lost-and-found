# 🤖 Google Slides AI Prompt & Slide Outline: Trust — Lost & Found

Use this document as a reference prompt to generate your presentation slides using AI tools (such as Gemini in Google Slides, Duet AI, Gamma App, or Tome). 

---

## 💬 Master System Prompt
> [!TIP]
> Copy the entire prompt box below and paste it into your AI slide generator or Gemini chat window alongside the slide outline.

```text
Create a professional, clean, and premium 10-slide presentation for a college hackathon project called 'Trust: Lost & Found'. 
Design requirements:
- Use a modern, user-centric design language.
- Colors: High-contrast professional theme (e.g., slate/navy primary, emerald green or sky blue highlights, clean white/light-gray cards).
- Visual Style: Minimalist layouts with ample white space, clean structural grids, and vector illustrations.
- Do NOT place long paragraphs or speaker scripts directly on the slides.
- Use the slide-by-slide structure, titles, layouts, bullet points, and image prompts defined below.
```

---

## 📊 Slide Outline & Content Reference

### 📽️ Slide 1: Title Slide
* **AI Layout Recommendation:** Minimalist, Centered Hero Title
* **Slide Title:** **Trust: Lost & Found**
* **Subtitle:** A Secure, AI-Powered & Gamified Campus Retrieval System
* **On-Slide Content:**
  - Centralized lost & found platform built by CSE students.
  - Solves campus security, privacy, and trust gaps in retrieval.
* **Image Prompt for AI:** A clean 2D vector illustration of a search magnifying glass hovering over a campus gate icon, modern flat tech aesthetic.
* **Speaker Notes (Not for slide text):**
  > *"Good morning judges. We are a team of CSE students, and today we are excited to introduce 'Trust', a smart, AI-driven Lost & Found platform designed specifically for college campuses. It goes beyond simple listings to solve the security, privacy, and trust gaps in traditional retrieval methods."*

---

### 📽️ Slide 2: The Problem
* **AI Layout Recommendation:** Split Layout (Text on left, chaotic graphic on right)
* **Slide Title:** **The Campus Lost & Found Mess**
* **On-Slide Content:**
  - **WhatsApp & Poster Chaos:** Messages get buried quickly under chat spam.
  - **Lying & Impersonation:** High risk of random claims on expensive items.
  - **Privacy Risks:** Publicly posted phone numbers lead to spam and harassment.
  - **Zero Incentives:** No motivation or rewards for honest finders.
* **Image Prompt for AI:** A flat minimal vector illustration of a smartphone screen overflowing with unread chat bubble icons and red warning symbols.
* **Speaker Notes (Not for slide text):**
  > *"Right now, campuses rely on WhatsApp groups or paper posters to report lost items. Messages get buried, students have to compromise their privacy by posting their phone numbers, and anyone can claim an expensive item just by lying. There is also no system in place to reward honest finders."*

---

### 📽️ Slide 3: The Solution
* **AI Layout Recommendation:** 3x2 Grid Cards or Feature Checklist
* **Slide Title:** **Introducing: Trust**
* **On-Slide Content:**
  - **Smart Matcher:** Gemini AI matches lost reports against found listings semantically.
  - **Vision Analysis:** Auto-fills item details and tags from uploaded photos.
  - **Leaflet Maps:** Pinpoints exact coordinates on a free, interactive campus map.
  - **In-App Messaging:** Anonymized chat to protect student contact details.
  - **Handshake Verification PIN:** Prevents point farming and validates handovers.
* **Image Prompt for AI:** A sleek smartphone mockup displaying a clean feed of lost items with green status checkmarks, flat style.
* **Speaker Notes (Not for slide text):**
  > *"'Trust' solves this by centralizing listings. We use Google Gemini AI to analyze found items from photos, predict matches semantically, and let users chat in real time. We also introduce a physical verification mechanism called the Handshake PIN to gamify returns safely."*

---

### 📽️ Slide 4: User Experience & Modern Design
* **AI Layout Recommendation:** Clean card layout with highlighted metrics
* **Slide Title:** **Intuitive User Interface & Design**
* **On-Slide Content:**
  - **Modern Dashboard Layout:** Clean, structured cards and grid systems.
  - **Conversational 2-Step Wizards:** Simplified reporting workflows to reduce cognitive load.
  - **Dynamic Micro-Animations:** Responsive click and hover states powered by Framer Motion.
  - **Enhanced Readability:** Professional typography pairing (Space Grotesk & Plus Jakarta Sans).
* **Image Prompt for AI:** A clean vector diagram of a web application layout showing user-friendly cards, tag badges, and smooth layout lines, minimalist style.
* **Speaker Notes (Not for slide text):**
  > *"We wanted our app to feel modern, intuitive, and premium. We designed a clean, responsive interface featuring interactive buttons, clear status badges, and simplified 2-step report wizards to make finding and listing items as effortless as possible."*

---

### 📽️ Slide 5: System Architecture
* **AI Layout Recommendation:** Flowchart or System Architecture Diagram
* **Slide Title:** **Under the Hood: Tech Stack**
* **On-Slide Content:**
  - **Next.js Pages Router:** Handles page routing and serverless backend API endpoints.
  - **Firebase Firestore:** Real-time database listeners (`onSnapshot`) for live state sync.
  - **Firebase Auth:** Handles secure user registration and session context.
  - **Google Gemini Flash API:** Vision analysis and semantic text processing.
  - **react-leaflet + OpenStreetMap:** Free interactive coordinate storage and mapping.
* **Image Prompt for AI:** A system architecture diagram showing a web client connected to a database cloud icon and an AI model brain icon, flat layout.
* **Speaker Notes (Not for slide text):**
  > *"Our stack is built on Next.js. We use Firebase for authentication and database management. The database uses real-time listeners, which update claim states and chat messages instantly. For AI and mapping, we integrate Google Gemini and react-leaflet."*

---

### 📽️ Slide 6: Dev Hack — Canvas Uploads
* **AI Layout Recommendation:** Problem vs. Solution comparative layout
* **Slide Title:** **Solving the Storage Billing Hurdle**
* **On-Slide Content:**
  - **The Challenge:** Firebase Cloud Storage requires paid billing accounts.
  - **The Solution:** Client-side HTML5 `<canvas>` compression.
  - **How it works:** Images are loaded into a canvas, scaled to 600px, and compressed.
  - **The Result:** Base64 text strings under 150KB stored directly in Firestore for free.
* **Image Prompt for AI:** A flat vector illustration showing an image file passing through a funnel and converting into a light code string, clean graphic.
* **Speaker Notes (Not for slide text):**
  > *"A major technical challenge we solved was handling image uploads on the Firebase free tier, which normally blocks file uploads. By compressing images down to 600px width inside a browser canvas element, we convert them into small Base64 strings. This lets us store images directly in the database without any hosting cost."*

---

### 📽️ Slide 7: Security — The Handshake Verification
* **AI Layout Recommendation:** Step-by-Step Flow diagram (1 to 5)
* **Slide Title:** **Preventing Point Farming**
* **On-Slide Content:**
  - **The Threat:** Users reporting fake items and claiming them themselves to farm points.
  - **The PIN Defense:** 4-digit random PIN code generated upon item creation.
  - **Handover Validation:** Finder gets the PIN; claimer must input the PIN to resolve.
  - **Point Reward:** Successful match resolves the status and awards **+50 Trust Points** to both.
* **Image Prompt for AI:** Two hands executing a handshake with a padlock and a 4-digit code box hovering above, vector icon style.
* **Speaker Notes (Not for slide text):**
  > *"To gamify the app safely, we created the Handshake system. When a found item is reported, a 4-digit code is generated. The finder sees the code, and the claimer sees a PIN pad. When they meet in person on campus, the finder shares the PIN. Entering it verifies the handoff and awards Trust Points to both users, making farming impossible."*

---

### 📽️ Slide 8: AI Integration — Gemini Flash
* **AI Layout Recommendation:** Two columns (Vision Input on left, Semantic Match on right)
* **Slide Title:** **Google Gemini Flash Integration**
* **On-Slide Content:**
  - **Vision Extraction:** Automatically analyzes photos to pre-populate item titles and tags.
  - **Semantic Matcher:** Compares lost descriptions with found items contextually (e.g. "blue flask" matches "navy thermos").
  - **API Engine:** Hardcoded to `gemini-flash-latest` for low latency and high accuracy.
* **Image Prompt for AI:** A clean vector graphic representing AI vision: an image showing tags like "keys" and "wallet" being extracted, flat design.
* **Speaker Notes (Not for slide text):**
  > *"We leverage Gemini Flash in two ways. First, vision analysis auto-fills titles and tags on upload. Second, semantic matching recommends found items to lost reports. It doesn't look for exact keyword matches; instead, it understands the context, helping users find lost items much faster."*

---

### 📽️ Slide 9: Future Scope
* **AI Layout Recommendation:** 4 Grid quadrants
* **Slide Title:** **Future Enhancements**
* **On-Slide Content:**
  - **University SSO:** Restrict access to verified college student email accounts.
  - **AI Image-to-Image Matching:** Scan found listings using a photo of the lost item.
  - **Auto-Email Alerts:** Notify users instantly when Gemini identifies a high-confidence match.
  - **Security Dashboard:** Admin panel for campus security staff.
* **Image Prompt for AI:** A flat vector illustration showing a target with an arrow hitting the center, surrounded by clean future tech growth icons.
* **Speaker Notes (Not for slide text):**
  > *"In the future, we plan to restrict signups to college Single Sign-On (SSO), add image-to-image matching where you search using a photo, and create an admin dashboard for campus security to manage unclaimed items."*

---

### 📽️ Slide 10: Summary & Q&A
* **AI Layout Recommendation:** Key takeaway highlights
* **Slide Title:** **Building a Trustworthy Campus**
* **On-Slide Content:**
  - **Structured & Searchable:** No more lost WhatsApp threads.
  - **AI-Assisted:** Automatically tagged and semantically matched.
  - **Privacy First:** Full in-app secure chat without phone numbers.
  - **Verified Handovers:** Handshake PIN guarantees physical returns.
* **Image Prompt for AI:** A campus scene with a shield emblem containing a checkmark floating in the center, modern flat vector.
* **Speaker Notes (Not for slide text):**
  > *"By combining modern design, real-time synchronization, and Google's Gemini AI, we've created a platform that builds a safer and more cooperative campus community. Thank you, and we are happy to take any questions."*
