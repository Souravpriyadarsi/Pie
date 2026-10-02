import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { searchDigits } from './src/lib/search.ts';
export { searchDigits } from './src/lib/search.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8',
};
type FrontendMiddleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

export function createApp(digits: string, frontend?: FrontendMiddleware) {
  const dist = resolve(root, 'dist');
  return createServer((req, res) => {
    const json = (status: number, value: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(value));
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(405, { error: 'Use GET to search.' });
    let url: URL;
    try { url = new URL(req.url ?? '/', 'http://localhost'); }
    catch { return json(400, { error: 'Invalid request URL.' }); }
    if (url.pathname === '/api/status') return json(200, { digits: digits.length, positionConvention: 'Positions start at 1 after the decimal point; the integer 3 is excluded.' });
    if (url.pathname === '/api/search') {
      const query = url.searchParams.get('q') ?? '';
      if (!/^[0-9]{1,1000}$/.test(query)) return json(400, { error: 'Enter 1–1,000 digits (0–9). Leading zeros are preserved.' });
      return json(200, searchDigits(digits, query));
    }
    if (url.pathname.startsWith('/api/')) return json(404, { error: 'Not found.' });
    if (frontend) return frontend(req, res, () => json(404, { error: 'Not found.' }));
    let path: string;
    try { path = resolve(dist, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)); }
    catch { return json(400, { error: 'Invalid asset path.' }); }
    if (!path.startsWith(dist + sep)) return json(404, { error: 'Not found.' });
    let body: Buffer;
    try { body = readFileSync(path); }
    catch { return json(url.pathname === '/' ? 503 : 404, { error: url.pathname === '/' ? 'Run npm run build to prepare the website.' : 'Not found.' }); }
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; worker-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
      'Cache-Control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let digits: string;
  try {
    digits = readFileSync(resolve(root, 'data/pi.txt'), 'ascii');
    const metadata = JSON.parse(readFileSync(resolve(root, 'data/pi.json'), 'utf8'));
    if (!/^[0-9]+$/.test(digits) || digits.length !== metadata.digits || createHash('sha256').update(digits).digest('hex') !== metadata.sha256 || !digits.startsWith('14159265358979323846264338327950288419716939937510')) throw new Error('Invalid pi dataset');
  } catch (error) {
    console.error(`Cannot load verified pi digits: ${error instanceof Error ? error.message : 'unknown error'}. Run npm run setup first.`);
    process.exit(1);
  }
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const vite = process.argv.includes('--dev') ? await (await import('vite')).createServer({
    configFile: resolve(root, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'spa',
  }) : undefined;
  const server = createApp(digits, vite?.middlewares);
  server.listen(port, host, () => console.log(`Pi Explorer (${vite ? 'development' : 'production'}) on ${host}:${port}; ${digits.length.toLocaleString('en-US')} decimal digits.`));
  server.on('error', async (error) => { console.error(error.message); await vite?.close(); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, async () => {
    await vite?.close();
    server.close(() => process.exit(0));
    server.closeAllConnections();
  });
}
