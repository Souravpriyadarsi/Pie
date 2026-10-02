import { findBeyond } from '../lib/deepSearch';

/** One worker per deep search; the client terminates it to cancel. */
self.addEventListener('message', (event: MessageEvent<{ query: string; startAfter: number }>) => {
  try {
    const found = findBeyond(event.data.query, event.data.startAfter, (progress) => self.postMessage({ type: 'progress', progress }));
    self.postMessage({ type: 'found', found });
  } catch (error) {
    self.postMessage({ type: 'error', error: error instanceof Error ? error.message : 'The calculation stopped unexpectedly. Please try again.' });
  }
});
