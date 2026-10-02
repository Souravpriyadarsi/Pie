/**
 * Computes decimal digits of π on demand with the Chudnovsky series and
 * binary splitting, using native BigInt arithmetic. Nothing is cached:
 * each call computes its digits from scratch and returns them.
 */

const C3_OVER_24 = 640320n ** 3n / 24n;
const DIGITS_PER_TERM = 14.181647462725477;

function bitLength(n: bigint): number {
  const hex = n.toString(16);
  return (hex.length - 1) * 4 + Number.parseInt(hex[0], 16).toString(2).length;
}

/** Integer square root (CPython's math.isqrt): precision doubles each step. */
export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new RangeError('isqrt of a negative number');
  if (n < 2n) return n;
  const c = BigInt((bitLength(n) - 1) >> 1);
  let a = 1n;
  let d = 0n;
  for (let s = BigInt(c.toString(2).length - 1); s >= 0n; s--) {
    const e = d;
    d = c >> s;
    a = (a << (d - e - 1n)) + (n >> (2n * c - e - d + 1n)) / a;
  }
  return a * a > n ? a - 1n : a;
}

/** Binary splitting over terms [a, b). P is only needed for left halves, so the top level skips it. */
function split(a: number, b: number, needP = true): [bigint, bigint, bigint] {
  if (b - a === 1) {
    if (a === 0) return [1n, 1n, 13591409n];
    const k = BigInt(a);
    const p = (6n * k - 5n) * (2n * k - 1n) * (6n * k - 1n);
    const q = k * k * k * C3_OVER_24;
    const t = p * (13591409n + 545140134n * k);
    return [p, q, a & 1 ? -t : t];
  }
  const m = (a + b) >> 1;
  const [p1, q1, t1] = split(a, m);
  const [p2, q2, t2] = split(m, b, needP);
  return [needP ? p1 * p2 : 0n, q1 * q2, t1 * q2 + p1 * t2];
}

const GUARD_DIGITS = 20;

/** Returns the first `count` decimal digits of π after the decimal point. */
export function piDigits(count: number): string {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a positive integer');
  const precision = count + GUARD_DIGITS;
  const terms = Math.floor(precision / DIGITS_PER_TERM) + 2;
  const [, q, t] = split(0, terms, false);
  const one = 10n ** BigInt(precision);
  const pi = (q * 426880n * isqrt(10005n * one * one)) / t;
  // pi is 3 followed by `precision` digits; drop the 3 and the guard digits.
  return pi.toString().slice(1, count + 1);
}
