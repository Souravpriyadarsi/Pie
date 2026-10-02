import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createHash } from 'node:crypto';
import { copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

function verifyDataset() {
  const digits = readFileSync(resolve(root, 'data/pi.txt'), 'ascii');
  const metadata = JSON.parse(readFileSync(resolve(root, 'data/pi.json'), 'utf8'));
  if (digits.length !== metadata.digits || !/^[0-9]+$/.test(digits) || createHash('sha256').update(digits).digest('hex') !== metadata.sha256) throw new Error('Invalid pi dataset. Run npm run setup.');
}

export default defineConfig({
  base: process.env.PAGES_BASE_PATH || '/',
  plugins: [react(), tailwindcss(), {
    name: 'verified-pi-dataset',
    buildStart() { verifyDataset(); },
    closeBundle() {
      for (const file of ['pi.txt', 'pi.json']) copyFileSync(resolve(root, 'data', file), resolve(root, 'dist', file));
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url || '/', 'http://localhost').pathname;
        const base = server.config.base;
        const file = path === `${base}pi.txt` ? 'pi.txt' : path === `${base}pi.json` ? 'pi.json' : null;
        if (!file) return next();
        try {
          res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'text/plain');
          res.end(readFileSync(resolve(root, 'data', file)));
        } catch { res.statusCode = 503; res.end('Run npm run setup first.'); }
      });
    },
  }],
  server: { host: '0.0.0.0' },
});
