import { searchDigits } from '../lib/search';

let dataset: Promise<string> | null = null;

function loadDigits(): Promise<string> {
  if (!dataset) dataset = (async () => {
    const [digitResponse, metadataResponse] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}pi.txt`),
      fetch(`${import.meta.env.BASE_URL}pi.json`),
    ]);
    if (!digitResponse.ok || !metadataResponse.ok) throw new Error('Couldn’t download the digit dataset. Please try connecting again.');
    const [digits, metadata] = await Promise.all([digitResponse.text(), metadataResponse.json()]);
    if (digits.length !== metadata.digits || !/^[0-9]+$/.test(digits) || !digits.startsWith('14159265358979323846264338327950288419716939937510')) throw new Error('The digit dataset failed verification. Refresh the page to try again.');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(digits));
    const digest = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== metadata.sha256) throw new Error('The digit checksum didn’t match. Refresh the page to try again.');
    return digits;
  })().catch((error) => { dataset = null; throw error; });
  return dataset;
}

self.addEventListener('message', async (event: MessageEvent<{ id: number; type: 'load' | 'search'; query?: string }>) => {
  const { id, type, query } = event.data;
  try {
    const digits = await loadDigits();
    const result = type === 'load'
      ? { digits: digits.length, positionConvention: 'Positions start at 1 after the decimal point; the integer 3 is excluded.' }
      : searchDigits(digits, query ?? '');
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : 'Search couldn’t finish. Please try again.' });
  }
});
