# Projects: Technical Summary

## 1. Genera (October 2026)
- Type: Offline-first flashcard web app
- Status: Finished, Live at https://genera-bvzb.onrender.com/
- GitHub: https://github.com/tonganwashere/genera
- Role: Solo developer (~1 month)
- Tech Stack: Python, Flask, vanilla JavaScript, SQLite, IndexedDB, Service Worker, Resend API
- Overview: Structured trivia flashcard app with ~4,500 questions across 24 categories from Open Trivia DB. Supports custom decks and CSV/JSON import/export.
- Core Engine: 5-box Leitner spaced repetition system (1, 2, 4, 8, 16 day intervals).
- Offline Architecture: Service Worker caches app shell; IndexedDB stores cards locally. Zero login required to study.
- Sync: Last-Write-Wins timestamp conflict resolution with Flask/SQLite backend on Render. Account merging preserves offline progress.

## 2. Proctor (September - October 2026)
- Type: Terminal examination and quiz management platform
- Status: Finished
- GitHub: https://github.com/tonganwashere/proctor
- Role: Solo developer for architecture, database, and AI (~2 months)
- Tech Stack: Java, Terminal UI, PostgreSQL, Ollama (Llama 3.2 local LLM), MVC Architecture
- Features: Teacher role (author questions, build quizzes/exams) and student role (timed tests, immediate scoring).
- Local AI: Ollama integration for generating questions and grading open-ended answers.
- Database: PostgreSQL with automated startup schema validation and migrations.

## 3. PyDFile (July - August 2026)
- Type: Offline desktop PDF management suite
- Status: Finished, Standalone Windows Executable v1.0.0
- GitHub: https://github.com/tonganwashere/pydfile
- Download: https://github.com/tonganwashere/pydfile/releases/tag/v1.0.0
- Role: Solo developer (~2 months)
- Tech Stack: Python, CustomTkinter, PyMuPDF, pikepdf, PyInstaller
- Philosophy: 100% local privacy. Completely offline with zero telemetry or network calls.
- Tools: Merge, split, reorder, compress, watermark, page numbering, password protect, unlock, image conversion, text extraction. Packaged into a single Windows .exe.

## 4. Pitch Flip (May - June 2026)
- Type: Android 3D coin flip application
- Status: Finished, Play Store release planned
- GitHub: https://github.com/tonganwashere/pitch_flip
- Role: Solo developer (~2 months). First Android app and first OpenGL project.
- Tech Stack: Kotlin, Android SDK, OpenGL ES 2.0
- Features: Realistic 3D coin rendering with custom GLSL shaders and flip speed slider.
- Secret Rig: Hidden trick mode ties coin landing (heads vs tails) to hardware volume level without on-screen clues.
- Reflection: Hardest project built so far due to OpenGL shader pipeline and 3D matrix math.

## 5. Wordle++ (March - April 2026)
- Type: Terminal word guessing game
- Status: Finished
- GitHub: https://github.com/tonganwashere/wordle_plus_plus
- Role: Solo developer (~2 months). Won Top 1 project in ISTAD Pre-University Course.
- Tech Stack: C++, FTXUI, nlohmann/json, CMake
- Features: Rich terminal UI with color-coded hints, 4 game modes (3-letter, 5-letter, 6-letter, Daily Challenge), player streaks, and admin dashboard (admin/admin123) for managing word banks.

## 6. Bread and Blades: Pixel Duel RPG (In Development)
- Type: 2D pixel-art 1v1 melee fighting RPG for Android and PC
- Tech Stack: Godot 4.7, GDScript, custom Q8 fixed-point integer AABB physics
- Highlights: Tournament story mode where no characters die on screen (kneel rule). Deterministic integer math from day one for cross-platform physics parity. 7 melee weapons, no pay-to-win.

## 7. Other Projects
- PixelArt BLE Canvas: Interactive 16x16 LED matrix canvas over Bluetooth Low Energy (ESP32, Web Bluetooth).
- NEXA: Community forum and lost-and-found platform (ISTAD Foundation capstone, Top 1 team).
- tongan.dev: Semantic portfolio built with vanilla HTML, Tailwind, and JS on GitHub Pages.