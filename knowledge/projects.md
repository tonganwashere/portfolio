# Projects: Comprehensive Technical Deep-Dive

## 1. Genera (October 2026)
- **Type:** Offline-first flashcard web app
- **Status:** Finished, Live at https://genera-bvzb.onrender.com/
- **GitHub:** https://github.com/tonganwashere/genera
- **Role:** Solo developer (~1 month)
- **Tech Stack:** Python, Flask, vanilla JavaScript, SQLite, IndexedDB, Service Worker, Resend API
- **Overview:** Genera makes learning general knowledge trivia structured, consistent, and distraction-free. Pre-loaded with ~4,500 trivia questions across 24 categories from Open Trivia DB (CC BY-SA 4.0), plus custom deck creation and CSV/JSON import/export.
- **Core Study Engine:** 5-box Leitner spaced repetition with expanding review intervals:
  - Box 1: 1 day
  - Box 2: 2 days
  - Box 3: 4 days
  - Box 4: 8 days
  - Box 5: 16 days
  Correct answers advance cards towards graduation; wrong answers reset cards back to Box 1 for next-day review.
- **Study Modes:**
  1. *Scheduled Mode:* Reviews due cards according to the 5-box Leitner system.
  2. *Freestyle Mode:* Quick flip through all cards in a deck without affecting scheduled intervals.
  3. *Random Mode:* Quick quiz sample from any selected deck.
- **Keyboard Shortcuts:** Space to flip card, 1 for wrong/miss, 2 for right/correct, Esc to dismiss modal dialogs.
- **Offline & Local-Mode First Architecture:**
  - Zero required sign-up to start studying.
  - Browser IndexedDB stores data across 5 distinct stores: `catalog`, `own_cards`, `progress`, `settings`, and `meta`.
  - Service worker (`sw.js`) caches the complete app shell for instant offline loading.
  - Background catalog updates check `catalog-manifest.json` when internet is available to update trivia cards without wiping personal progress.
- **Sync & Conflict Resolution:**
  - Syncs with Flask/SQLite backend deployed on Render.
  - Offline mutations tracked with dirty flags and pushed in 500-item batches to `/api/sync`.
  - Conflicts resolved via Last-Write-Wins (LWW) using ISO UTC timestamps (`updated_at`), with ties breaking in favor of the server.
  - Shows a dismissible amber banner notifying the user if a local change was superseded.
  - Intelligent account merging reconciles local anonymous progress with server accounts upon registration without duplicate cards.
- **Backend Architecture:** Modular MVC architecture in Flask, session authentication with token versioning, CSRF validation, rate limiting, and email OTP verification via Resend API.

## 2. Proctor (September – October 2026)
- **Type:** Terminal-based examination, quiz, and question bank management platform
- **Status:** Finished
- **GitHub:** https://github.com/tonganwashere/proctor
- **Role:** Solo implementation in a collaborative group project (~2 months). Tongan architected and implemented the entire software, database layer, and AI pipeline solo.
- **Tech Stack:** Java, Terminal UI, PostgreSQL, Ollama (Llama 3.2 local LLM), MVC Architecture
- **Overview:** A terminal assessment platform designed for command-line efficiency with distinct roles for teachers and students.
- **Features & Modes:**
  - *Teacher Role:* Create and organize subject-based question banks, build custom quizzes and exams, manage questions.
  - *Student Role:* Take timed assessments, view live prompt feedback, check score summaries and history.
  - *Assessment Modes:* Standard Quizzes, Comprehensive Exams, and Speed Challenge modes.
  - *Question Types:* Multiple-choice questions (MCQ), True/False, Short-Answer.
- **Local AI Integration (Ollama + Llama 3.2):**
  - Teachers can automatically generate new questions and distractors/options from custom topic prompts.
  - Students receive AI-assisted grading and constructive correction for open-ended submissions.
- **Database & Persistence:**
  - PostgreSQL persistence with an automated startup schema manager that validates, creates, and migrates tables and relational constraints automatically.

## 3. PyDFile (July – August 2026)
- **Type:** Offline desktop PDF management suite
- **Status:** Finished, Standalone Windows Executable v1.0.0 released
- **GitHub:** https://github.com/tonganwashere/pydfile
- **Download:** https://github.com/tonganwashere/pydfile/releases/tag/v1.0.0
- **Role:** Solo developer (~2 months)
- **Tech Stack:** Python, CustomTkinter, PyMuPDF, pikepdf, PyInstaller
- **Philosophy:** Complete local privacy. Runs 100% offline with zero telemetry or network calls. User files never touch third-party servers.
- **10 Built-In Tools:**
  1. *Merge:* Combine multiple PDFs into a single file.
  2. *Split:* Break a PDF into individual pages or custom page ranges.
  3. *Reorder:* Rearrange page sequence.
  4. *Compress:* Reduce PDF file size.
  5. *Watermark:* Add custom text or overlay stamps.
  6. *Page Numbers:* Automatically stamp sequential numbers with custom placement.
  7. *Password Protect:* Encrypt and lock PDFs with strong passwords.
  8. *Unlock:* Remove password protection from PDFs the user owns.
  9. *PDF ↔ Image Conversion:* Convert PDF pages to image formats and vice versa.
  10. *Extract Text:* Pull raw text contents cleanly from documents.
- **Architecture:** Structured three-layer architecture:
  - *Core layer:* PDF manipulation logic using PyMuPDF (rendering, geometry, merging) and pikepdf (cryptography and password handling).
  - *UI layer:* CustomTkinter modular widgets with native dark/light mode.
  - *Utilities layer:* Constants, file system helpers, error boundaries.
  - Packaged via PyInstaller into a standalone Windows `.exe` requiring zero external Python runtimes.

## 4. Pitch Flip (May – June 2026)
- **Type:** Android 3D coin flip application
- **Status:** Finished, Play Store release planned
- **GitHub:** https://github.com/tonganwashere/pitch_flip
- **Role:** Solo developer (~2 months). Milestone: Tongan's first Android app and first time working with OpenGL.
- **Tech Stack:** Kotlin, Android SDK, OpenGL ES 2.0
- **Overview:** Looks like a sleek, physics-based 3D coin flipper, but includes a clever hidden pranking mechanic.
- **Key Mechanics:**
  - *3D Graphics:* Coin rendered in 3D using OpenGL ES 2.0 with custom vertex and fragment shaders and an adjustable flip speed slider.
  - *Secret Rig Mode:* When enabled quietly, the flip result is tied to the smartphone's physical volume level:
    - Volume > 50%: Coin lands on Heads.
    - Volume < 50%: Coin lands on Tails.
    - The person watching sees an authentic, smooth random flip with zero on-screen indicators that the flip was controlled.
  - *Custom Skin System:* Customize each coin face independently with text labels, user-uploaded pictures, or preset animal illustrations (Dog, Cat, Monkey, Bear, Duck, Chicken).
  - *Storage:* SharedPreferences stores user preferences, rig toggle states, and custom skins persistently.
- **The Biggest Technical Hurdle & Honest Reflections:**
  - Tongan considers Pitch Flip the single hardest and most intimidating project he has built so far.
  - Wrapping his head around the OpenGL ES 2.0 shader pipeline, 3D matrix math, coordinate transformations, and physics tuning was a steep mountain.
  - He candidly admits that he still hasn't wrapped his head around a lot of the deep 3D graphics theory and considers himself a newbie in low-level graphics, but he persevered, got it working smoothly, and is eager to build more graphics projects to genuinely master it over time.

## 5. Wordle++ (March – April 2026)
- **Type:** Terminal-based word guessing game
- **Status:** Finished
- **GitHub:** https://github.com/tonganwashere/wordle_plus_plus
- **Role:** Solo developer (~2 months). Feature direction from university team, 100% of the code written solo by Tongan.
- **Tech Stack:** C++, FTXUI, nlohmann/json, CMake
- **Milestone:** Won Top 1 project in the ISTAD Pre-University Course.
- **Key Features:**
  - *Rich Terminal UI:* Built with FTXUI, providing color-coded letter feedback (green, yellow, grey), smooth keyboard input handling, and navigable TUI menus.
  - *4 Game Modes:* 3-letter words, 5-letter words (classic), 6-letter words, and a Daily Challenge.
  - *Accounts & Leaderboard:* Player accounts with persistent win rates and streak tracking.
  - *Admin Mode:* Login with `admin` / `admin123` opens a runtime administrative dashboard to add or delete words from mode-specific JSON word banks and manage user accounts without touching raw files.

## 6. Bread & Blades: Pixel Duel RPG (In Active Development)
- **Type:** 2D pixel-art 1v1 melee fighting RPG for Android (with PC development build)
- **Status:** In active development (codename: Pixel Arena Fighter)
- **Tech Stack:** Godot 4.7, GDScript, custom integer AABB physics (Q8 fixed-point: 1 px = 256 sub-pixels)
- **Narrative:**
  - King Gerhard III ("the Gilded") of Hohenmark hosts the 30-level Grand Tournament for his personal amusement, dangling a fortune to lure the realm's desperate citizens.
  - Player controls a customizable warrior from Lindenau, an impoverished village threatened with annihilation by ruthless back taxes.
  - The 30 opponents are ordinary, relatable people fighting for family, debt relief, or survival—not cartoon monsters.
  - "Kneel rule": Nobody dies on screen; losers fall to one knee.
  - Final boss is Ser Aldric Wolff, the Crown's 12-year Champion; the King is a cowardly non-combatant seen in cutscenes.
- **Combat Mechanics & Architectural Decision:**
  - High-skill melee with spacing, directional attacks, drop-through platforms, invulnerable dash, and a Block / Perfect Parry / Guard meter system.
  - 7 distinct melee weapons, each with dedicated frame data, reach, 10-move set, and an Ultimate.
  - Strictly melee: no ranged weapons, no random stage hazards.
  - **Why Q8 Fixed-Point Integer Math From Day 1:** Tongan chose to write custom integer AABB physics from scratch because if he ever wanted or needed deterministic combat later, converting a floating-point game into integer math would be a near-impossible refactoring nightmare. Tackling the hardest architectural constraint right at the beginning guarantees frame-perfect symmetry across PC and Android devices.
- **Progression Systems:**
  - *Dojo Drills:* Swords & Souls-style training with Master Brandolf in Strikes (Power), Dodge (Vitality), and Parry (Focus).
  - *Blacksmith (Emil Kessler):* Upgrade unlocked weapons through Tiers 1–5.
  - *90-Star Skill Tree:* 30 nodes costing exactly 90 Stars.
  - *Over-leveling:* Replay previous levels with endgame equipment to overpower challenges with zero rubber-banding.
- **Monetization & Privacy:** 100% free, fully playable offline, zero pay-to-win, zero banners/interstitials, optional player-initiated rewarded ads only (AdMob).

## 7. PixelArt BLE Canvas (Hardware / Embedded Project)
- **Type:** Interactive wireless pixel art canvas and ambient display
- **Status:** Functional personal project
- **GitHub:** https://github.com/tonganwashere/pixel_canvas
- **Tech Stack:** ESP32-WROOM-32, 4 chained 8x8 WS2812B RGB LED matrices (16x16 layout, 256 LEDs total), Nordic UART BLE, Web Bluetooth API
- **Key Features:**
  - Low-latency real-time live drawing via a lightweight, zero-dependency web application communicating over Bluetooth Low Energy.
  - Standalone non-blocking animations (Fire effect, Rainbow Swirl) running directly on the ESP32.
  - FastLED software current capping (`5V @ 450mA`) to prevent USB brownouts and thermal issues.
  - Mounted in a custom shadow-box photo frame with drafting vellum diffuser.

## 8. NEXA (May – October 2026)
- **Type:** Community forum & lost-and-found web application
- **Status:** Capstone project completed
- **Role:** Team project (Team placed Top 1 in ISTAD Foundation Course)
- **GitHub:** https://github.com/FOUNDATION-G06/nexa-frontend
- **Overview:** A forum platform modeled after Stack Overflow with thread discussions, voting, and a specialized community lost-and-found board.

## 9. Personal Portfolio (tongan.dev)
- **Type:** Semantic, accessible portfolio website
- **Stack:** Semantic HTML5, Tailwind CSS, vanilla JavaScript (no React, Next.js, or heavy bundlers)
- **Features:** Dark/light mode theme synchronization, custom media viewer modal, Lucide SVG icons, responsive typography, Inter font, custom Open Graph metadata, embedded Tongan AI assistant widget.
- **Hosting:** GitHub Pages with custom domain `tongan.dev`.

## 10. Tongan AI: First-Person Portfolio Assistant (November 2026)
- **Type:** Interactive conversational AI clone & portfolio assistant
- **Status:** Finished, Live on https://tongan.dev
- **Role:** Solo developer (~1 week)
- **Tech Stack:** Vanilla JavaScript (ES6+), Google Gemini 3.5 Flash API (`gemini-3.5-flash`), Node.js (Vercel Serverless Function), Server-Sent Events (SSE) streaming, JSON compilation pipeline, CSS3 custom property theming
- **Motivation & Vision:**
  - Traditional portfolios are static, one-way documents where recruiters and visitors have to read walls of text. Tongan wanted an interactive experience where visitors could ask anything about his code, architectural trade-offs, tech stack, university background, or personal life, and receive authentic, immediate answers in first person.
  - Demonstrates practical engineering with modern LLMs, streaming architectures, and prompt design while remaining 100% faithful to his lightweight, anti-bloat philosophy.
- **Core Architecture & Engineering Highlights:**
  - *Lightweight Zero-Dependency Frontend:* The chat interface (`assistant.js`) is written entirely in vanilla JavaScript with zero runtime npm dependencies. Handles modal lifecycle, message state, smooth auto-scrolling, textarea auto-resizing, and custom markdown rendering (bold, lists, inline code, syntax-highlighted codeblocks, and clickable portfolio links).
  - *Real-time Streaming over Server-Sent Events (SSE):* Token-by-token streaming using standard browser `ReadableStream` (`fetch` + `response.body.getReader()`). Near-instant Time-To-First-Token (<500ms) with zero heavy WebSocket infrastructure.
  - *Optimized In-Memory Context vs Heavy RAG:* Instead of setting up a slow, complex, and costly vector database or RAG pipeline with chunking and embeddings lookups on every single message (which add latency, cost, and moving parts), Tongan built a build script (`build-knowledge.js`) that compiles structured markdown documents into an in-memory JSON context payload (`tongan-knowledge.json`). Because modern models like Gemini 3.5 Flash feature a 1,000,000+ token context window, feeding the entire pre-compiled knowledge base directly into the system prompt provides 100% recall, zero hallucination of ungrounded facts, sub-second latency, and costs virtually fractions of a cent per query.
  - *Edge Routing & Geographic Resilience:* Discovered during deployment that Google Gemini API restricts outgoing calls from Hong Kong edge locations (which Cloudflare edge routes through from Southeast Asia). Solved by deploying the serverless function on Vercel explicitly pinned to US-East (`iad1` / Washington D.C.) in `vercel.json` to guarantee stable egress and zero location drops.
  - *Local Dev vs Production Parity:* Custom local Node.js development server (`scripts/dev-server.js`) that mirrors the production Vercel serverless environment with hot-reloading and `.env` parsing.
  - *Privacy-First Session Design:* No user tracking, no third-party telemetry, no analytics cookies, and no persistent server-side message logs. Chat history is preserved strictly in the visitor's browser `sessionStorage` and automatically destroyed the moment the visitor closes their browser tab.
  - *Theme Awareness & Accessibility:* Dynamically tracks system and user-toggled dark/light themes via CSS custom variables (`--color-base`, `--color-surface`, `--color-line`, `--color-primary`), supports full keyboard navigation (Esc to dismiss, Enter to send, Shift+Enter for newlines), and WCAG-accessible focus states.
  - *Strict Domain Guardrails:* Scoped strictly to Hor Tongan, his software, and portfolio. Graciously declines solving general coding puzzles or homework for visitors, protects personal financial boundaries (zero salary or rate negotiation on chat), and routes high-priority job or project discussions directly to his Telegram (@tonganwashere).