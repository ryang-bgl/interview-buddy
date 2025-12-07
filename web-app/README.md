# LeetStack Web App

A React + TypeScript + MobX + React Router + Tailwind SPA that complements the Chrome extension and mobile client.

## High-Level Experience

### 1. DSA Notebook Dashboard
- Lists captured LeetCode problems (title, difficulty, tags, last review).
- Filters by difficulty/tags, search by title/problem #.
- Each problem links to a detail page showing:
  - Original description, user solution, AI-generated "ideal" solution, and personal notes.
  - Spaced-repetition history + next scheduled review.
  - Inline edit controls for notes/solutions.

### 2. General Notes & Flashcards
- Separate section for notes generated from arbitrary text (mirroring the "Text -> Flashcards" flow in the extension).
- Overview list shows note summary, tags, and source URL.
- Detail page displays the note summary plus all flashcards.
- Inline editing for each flashcard (front/back/extra/tags) so users can clean up AI output without leaving the web app.

### 3. Browser Review Session
- Offers the same spaced-repetition flow as mobile: due-card queue, easy/good/hard buttons, streak/badge indicators.
- Users can constrain the session to specific problem tags or notebooks (e.g., only general-note flashcards).

### 4. Settings & Support
- Manage profile info, connected devices/browsers, default AI model/language, and export data.
- Provide feedback/help links and changelog updates.

## Tech Stack & Structure
- **React Router** organizes routes: `/login`, `/dashboard`, `/problems/:index`, `/notes/:id`, `/review`.
- **MobX** stores for problems, general notes, flashcards, and user/session state; stores hydrate via existing REST APIs.
- **Tailwind CSS** for rapid UI iteration; see `tailwind.config.ts` and `src/index.css`.

## Local Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
npm run preview # optional
```
