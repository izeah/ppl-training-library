# PPL Training Library

Mobile-first workout planner, exercise library, session logger, and progress tracker built with React, TypeScript, Vite, and IndexedDB.

## Requirements
- Node.js 20.19+ or 22.12+
- npm

## Install and run
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build
```bash
npm run build
npm run preview
```
The production site is generated in `dist/`.

## Deployment
Deploy the contents of `dist/` to any static host (Netlify, Vercel, Cloudflare Pages, or GitHub Pages). For GitHub Pages under a repository subpath, configure Vite's `base` in `vite.config.ts` to the repository path before building. Configure the host to serve `index.html` for application routes if routes are added later.

## Data persistence and backup
Workout sessions, body-weight entries, profile preferences, and custom templates are stored in browser IndexedDB. Data remains on the same browser/device after closing the browser, but it is not synchronized to other devices and can be lost if site data is cleared. Use **Settings → Export data backup** regularly. Import accepts this app's JSON backup schema version 1.

## Application structure
```text
src/
├── App.tsx                 # Screens, navigation, workout interactions
├── main.tsx                # React entry point
├── styles.css              # Responsive design system
├── data/
│   ├── exercises.json      # 64 catalog exercises transcribed from project docs
│   └── templates.ts        # Six documented A/B training templates + weekly split
└── lib/
    └── db.ts               # IndexedDB persistence and data types
```

## Data and programming provenance
The exercise catalogue and training templates are derived from the supplied `PPL_Training_Library_Project_Context.zip` files:
- `03-push-exercise-library.md`
- `04-pull-exercise-library.md`
- `05-legs-exercise-library.md`
- `02-programming-principles.md`

The app retains the 23 Push, 19 Pull, and 22 Legs exercise variations (64 total) and the documented Push A/B, Pull A/B, Legs A/B programs. The session data is initially empty. No user loads, repetitions, RIR, body measurements, or workout history are fabricated.

Exercise technique guidance in the documentation is grouped by movement pattern/split; the detail view shows concise general cues and equipment from the catalogue. YouTube links are search links, not verified single-video embeds. No video IDs are invented. Source references listed in `07-references-and-provenance.md` were preserved in the supplied project context; missing article URLs were not guessed.

## Current implementation notes
- IndexedDB is the active local persistence adapter. A future cloud backend can be introduced behind repository/service functions.
- Workout set entries autosave to IndexedDB as they change; explicit Save progress is also available.
- A workout in progress is stored as an unfinished session and can be recovered from IndexedDB at the data layer; automatic cross-device recovery requires a backend.
- Exercise illustrations are neutral visual placeholders rather than misleading technique images. Add reviewed media assets before production use.
- Rest timer controls a 90-second countdown. Adjust the default duration or add per-exercise rest presets as needed.
- The current custom-template creation flow accepts comma-separated exercise names and applies 3 × 8–12 as an editable starting point; this does not overwrite the documented templates.
- A basic service worker caches the app shell for repeat/offline visits after the first successful load. Deployment must serve over HTTPS (localhost is exempt).

## Important limitations
This is a functional local-first v1, not a cloud-synced production service. Browser storage is device/browser-specific. Exercise setup and execution detail is limited by the granularity of the source documentation; it should not be expanded with unsupported personal or machine-specific claims. Always adapt loading and range of motion to the user's actual ability and equipment.
