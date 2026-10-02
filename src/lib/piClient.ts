import type { DatasetStatus, SearchResult } from '../types';

type PendingRequest = { resolve: (value: DatasetStatus | SearchResult) => void; reject: (error: Error) => void; cleanup: () => void };

/** Keep the dataset and searches off the UI thread. No backend is required. */
export class PiSearchClient {
  private worker = new Worker(new URL('../workers/pi.worker.ts', import.meta.url), { type: 'module' });
  private pending = new Map<number, PendingRequest>();
  private nextId = 0;

  constructor() {
    this.worker.addEventListener('message', (event: MessageEvent<{ id: number; result?: DatasetStatus | SearchResult; error?: string }>) => {
      const request = this.pending.get(event.data.id);
      if (!request) return;
      request.cleanup();
      this.pending.delete(event.data.id);
      if (event.data.error) request.reject(new Error(event.data.error));
      else if (event.data.result) request.resolve(event.data.result);
      else request.reject(new Error('Unexpected search response. Please retry.'));
    });
    this.worker.addEventListener('error', () => this.failAll(new Error('The digit search couldn’t start. Refresh the page to try again.')));
    this.worker.addEventListener('messageerror', () => this.failAll(new Error('The search response couldn’t be read. Please retry.')));
  }

  private failAll(error: Error) {
    for (const request of this.pending.values()) { request.cleanup(); request.reject(error); }
    this.pending.clear();
  }

  private request(type: 'load' | 'search', query?: string, signal?: AbortSignal): Promise<DatasetStatus | SearchResult> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
      const id = this.nextId++;
      const abort = () => {
        this.pending.delete(id);
        signal?.removeEventListener('abort', abort);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal?.addEventListener('abort', abort, { once: true });
      this.pending.set(id, { resolve, reject, cleanup: () => signal?.removeEventListener('abort', abort) });
      this.worker.postMessage({ id, type, query });
    });
  }

  async load(signal?: AbortSignal) { return await this.request('load', undefined, signal) as DatasetStatus; }
  async search(query: string, signal?: AbortSignal) { return await this.request('search', query, signal) as SearchResult; }
  dispose() { this.worker.terminate(); this.failAll(new DOMException('Aborted', 'AbortError')); }
}
