import type { PiMatch, SearchResult } from '../types.ts';

export function searchDigits(digits: string, query: string, limit = 100): SearchResult {
  if (!/^[0-9]{1,1000}$/.test(query)) throw new RangeError('Enter 1–1,000 digits.');
  const started = performance.now();
  let count = 0;
  let offset = 0;
  const matches: PiMatch[] = [];
  while (offset <= digits.length - query.length) {
    const index = digits.indexOf(query, offset);
    if (index === -1) break;
    count++;
    if (matches.length < limit) matches.push({
      position: index + 1,
      before: digits.slice(Math.max(0, index - 16), index),
      match: query,
      after: digits.slice(index + query.length, index + query.length + 16),
      atStart: index < 16,
    });
    offset = index + 1;
  }
  return { query, count, matches, digitsSearched: digits.length, elapsedMs: Number((performance.now() - started).toFixed(2)), truncated: count > matches.length };
}
