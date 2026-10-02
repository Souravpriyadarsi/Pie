import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp, searchDigits } from '../server.ts';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const prefix = '14159265358979323846264338327950288419716939937510';

test('the static build contains the verified dataset used by browser searches', () => {
  const digits = readFileSync('dist/pi.txt', 'ascii');
  const metadata = JSON.parse(readFileSync('dist/pi.json', 'utf8'));
  assert.equal(digits.length, metadata.digits);
  assert.match(digits, /^[0-9]+$/);
  assert.ok(digits.startsWith(prefix));
  assert.equal(createHash('sha256').update(digits).digest('hex'), metadata.sha256);
});

test('positions exclude the integer 3 and preserve exact leading zeros', () => {
  assert.equal(searchDigits(prefix, '14159').matches[0].position, 1);
  assert.equal(searchDigits(prefix, '3').matches[0].position, 9);
  assert.equal(searchDigits(prefix, '0').matches[0].position, 32);
  assert.equal(searchDigits('10012300123', '00123').matches[0].position, 2);
  assert.equal(searchDigits(prefix, '000000').count, 0);
});

test('all overlapping matches are counted, with response size capped', () => {
  const result = searchDigits('0000', '00', 2);
  assert.equal(result.count, 3);
  assert.deepEqual(result.matches.map((match) => match.position), [1, 2]);
  assert.equal(result.truncated, true);
  assert.equal(result.matches[0].before, '');
  assert.equal(result.matches[0].after, '00');
  assert.equal(searchDigits('123', '1234').count, 0);
  assert.equal(searchDigits('123', '3').matches[0].position, 3);
});

test('HTTP workflow serves the site, searches, and rejects invalid queries', async (t) => {
  const server = createApp(prefix);
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  t.after(() => new Promise((done) => server.close(done)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const site = await fetch(base);
  assert.equal(site.status, 200);
  const html = await site.text();
  assert.match(html, /Pi Explorer/);
  assert.match(html, /id="root"/);
  assert.match(site.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal((await (await fetch(`${base}/api/status`)).json()).digits, prefix.length);
  const found = await (await fetch(`${base}/api/search?q=14159`)).json();
  assert.equal(found.matches[0].position, 1);
  assert.equal(found.count, 1);
  for (const invalid of ['', 'abc', '1.4', '12 34', '１２', '1'.repeat(1001)]) {
    const response = await fetch(`${base}/api/search?q=${encodeURIComponent(invalid)}`);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Enter/);
  }
  assert.equal((await fetch(`${base}/api/search?q=123456`)).status, 200);
  assert.equal((await fetch(`${base}/api/search?q=1`, { method: 'POST' })).status, 405);
  assert.equal((await fetch(`${base}/not-a-file`)).status, 404);
  const script = html.match(/src="([^"]+\.js)"/)[1];
  const style = html.match(/href="([^"]+\.css)"/)[1];
  assert.equal((await fetch(`${base}${script}`)).status, 200);
  assert.equal((await fetch(`${base}${style}`)).status, 200);
  assert.equal((await fetch(`${base}/favicon.svg`)).status, 200);
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e%2fpackage.json`)).status, 404);
  assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
});

test('generated pi agrees with an independent Machin-formula calculation and setup repeats safely', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pi-generator-'));
  const output = join(directory, 'pi.txt');
  try {
    execFileSync('python3', ['scripts/generate_pi.py', '--digits', '200', '--output', output]);
    const independent = execFileSync('python3', ['-c', `
from decimal import Decimal, localcontext
def atan_inverse(n):
    x = Decimal(1) / n
    square = x*x
    power = x
    total = x
    k = 1
    while True:
        power *= -square
        term = power / (2*k+1)
        total += term
        if abs(term) < Decimal('1e-235'):
            return total
        k += 1
with localcontext() as ctx:
    ctx.prec = 245
    pi = 16*atan_inverse(5) - 4*atan_inverse(239)
    print(str(pi)[2:202], end='')
`], { encoding: 'utf8' });
    assert.equal(readFileSync(output, 'ascii'), independent);
    const repeated = execFileSync('python3', ['scripts/generate_pi.py', '--digits', '200', '--output', output], { encoding: 'utf8' });
    assert.match(repeated, /Verified existing/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
