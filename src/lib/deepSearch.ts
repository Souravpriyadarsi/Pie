import type { PiMatch } from '../types.ts';
import { piDigits } from './piGenerator.ts';

export interface DeepProgress { digitsSearched: number; computing: number; elapsedMs: number }
export interface DeepFound { match: PiMatch; digitsSearched: number; elapsedMs: number }

/**
 * Finds the first appearance of `query` after the first `startAfter` digits by
 * computing π in doubling rounds (2×, 4×, …). Each round's digits are scanned
 * from where the previous round stopped, then discarded. Runs until found.
 */
export function findBeyond(query: string, startAfter: number, onProgress: (progress: DeepProgress) => void = () => {}, generate: (count: number) => string = piDigits): DeepFound {
  if (!/^[0-9]{1,1000}$/.test(query)) throw new RangeError('Enter 1–1,000 digits.');
  const started = performance.now();
  const elapsed = () => Number((performance.now() - started).toFixed(2));
  let searched = startAfter;
  for (let count = Math.max(startAfter * 2, 1000); ; count *= 2) {
    onProgress({ digitsSearched: searched, computing: count, elapsedMs: elapsed() });
    const digits = generate(count);
    // Include the tail of the previous range so matches spanning the boundary are found.
    const index = digits.indexOf(query, Math.max(0, searched - query.length + 1));
    if (index !== -1) {
      return {
        match: {
          position: index + 1,
          before: digits.slice(Math.max(0, index - 16), index),
          match: query,
          after: digits.slice(index + query.length, index + query.length + 16),
          atStart: index < 16,
        },
        digitsSearched: count,
        elapsedMs: elapsed(),
      };
    }
    searched = count;
  }
}
