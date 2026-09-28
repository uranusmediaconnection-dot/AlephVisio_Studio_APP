// Copies the built medical-dashboard frontend (medical-dashboard/dist) into
// backend/public so the Express server can serve the production SPA.
// Replaces the legacy backend/prepareStatic.js reference.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, '..', 'medical-dashboard', 'dist');
const dest = path.join(__dirname, 'public');

if (!fs.existsSync(src)) {
  console.error(`Frontend build not found at ${src}. Run the medical-dashboard build first.`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied frontend build to ${dest}`);
