# Calendar App (Full‑Stack)

Two calendar experiences sharing one tiny events API:

- **CalSync** (`index.html`) — self-contained single-file app (vanilla JS +
  Tailwind CDN, `localStorage` persistence). Just open it in a browser.
- **Andromeda** (`medical-dashboard/`) — React 19 + Vite + Tailwind v4 app
  (Zustand store, Framer Motion, charts, 3D hero).
- **Backend** (`backend/server.js`) — Express (ESM) API (`/api/events`,
  `/api/health`) persisting to `backend/data/events.json`. Serves the built
  SPA when present, otherwise the CalSync page.

## Project Structure

```
calendar full implementation/
│   README.md
│   AGENTS.md                 # contributor notes for AI agents
│   index.html                # CalSync — standalone single-file app
│   package.json              # backend deps + orchestration scripts
│
├─backend/
│   ├─server.js               # Express server: static frontend + API
│   ├─copyFrontend.js         # build helper (medical-dashboard/dist -> backend/public)
│   ├─public/                 # (generated) production SPA, served at /
│   └─data/events.json        # simple JSON DB for events
│
└─medical-dashboard/          # Andromeda React app (own package.json)
    ├─src/
    └─public/
```

## Development

```bash
# 1. Install dependencies (Node.js >= 18 required)
npm install
npm --prefix medical-dashboard install

# 2a. Run backend + frontend together
npm run dev
# backend → http://localhost:3001 (API + CalSync page)
# frontend → http://localhost:5173 (Andromeda dev server)

# 2b. Or run them individually
npm run server     # Express API on :3001
npm run frontend   # Vite dev server on :5173
```

## Production build

```bash
npm run build   # builds medical-dashboard/ into backend/public/
npm start       # serves everything from one process (PORT env, default 3001)
```

See `AGENTS.md` for architecture notes, testing, and gotchas.
