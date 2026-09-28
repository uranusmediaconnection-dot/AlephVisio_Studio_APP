import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Static frontend
// ---------------------------------------------------------------------------
// `npm run build` (repo root) compiles medical-dashboard/ into backend/public/.
// When that build exists we serve it; otherwise we fall back to the
// self-contained CalSync page (../index.html) so the server is useful standalone.
// ---------------------------------------------------------------------------
const publicDir = path.join(__dirname, 'public');
const builtIndex = path.join(publicDir, 'index.html');
const calsyncIndex = path.join(__dirname, '..', 'index.html');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ---------------------------------------------------------------------------
// Tiny JSON-file "database"
// ---------------------------------------------------------------------------
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

function readEvents() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2));
}

function isEventObject(body) {
  return body !== null && typeof body === 'object' && !Array.isArray(body);
}

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'calendar-backend', time: new Date().toISOString() });
});

app.get('/api/events', (req, res) => {
  res.json(readEvents());
});

app.post('/api/events', (req, res) => {
  if (!isEventObject(req.body)) {
    return res.status(400).json({ error: 'Event payload must be a JSON object' });
  }
  const events = readEvents();
  const newEvent = { ...req.body, id: Date.now().toString() };
  events.push(newEvent);
  try {
    writeEvents(events);
  } catch {
    return res.status(500).json({ error: 'Failed to persist event' });
  }
  res.status(201).json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  if (!isEventObject(req.body)) {
    return res.status(400).json({ error: 'Event payload must be a JSON object' });
  }
  const events = readEvents();
  const idx = events.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });
  events[idx] = { ...events[idx], ...req.body, id: events[idx].id };
  try {
    writeEvents(events);
  } catch {
    return res.status(500).json({ error: 'Failed to persist event' });
  }
  res.json(events[idx]);
});

app.delete('/api/events/:id', (req, res) => {
  const events = readEvents();
  const filtered = events.filter((e) => e.id !== req.params.id);
  if (filtered.length === events.length) {
    return res.status(404).json({ error: 'Event not found' });
  }
  try {
    writeEvents(filtered);
  } catch {
    return res.status(500).json({ error: 'Failed to persist event' });
  }
  res.json({ success: true });
});

// Unknown /api/* routes -> JSON 404 (must come after the real routes).
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Page routes
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  if (fs.existsSync(builtIndex)) {
    return res.sendFile(builtIndex);
  }
  if (fs.existsSync(calsyncIndex)) {
    return res.sendFile(calsyncIndex);
  }
  return res.status(503).send('No frontend available. Run "npm run build" first.');
});

// SPA fallback for the built frontend (client-side routing). Only active when
// a production build exists; the CalSync page needs no fallback.
app.get(/.*/, (req, res, next) => {
  if (fs.existsSync(builtIndex)) {
    return res.sendFile(builtIndex);
  }
  return next();
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
