import { useCallback, useEffect, useRef, useState } from 'react';
import type { DatasetStatus, DeepSearchState, SearchResult } from '../types';
import { PiSearchClient } from '../lib/piClient';

export function usePiSearch() {
  const [dataset, setDataset] = useState<DatasetStatus | null>(null);
  const [datasetError, setDatasetError] = useState(false);
  const [input, setInput] = useState(() => new URL(location.href).searchParams.get('q') ?? '');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deep, setDeep] = useState<DeepSearchState | null>(null);
  const active = useRef<AbortController | null>(null);
  const client = useRef<PiSearchClient | null>(null);
  const getClient = useCallback(() => client.current ?? (client.current = new PiSearchClient()), []);

  const search = useCallback(async (value: string) => {
    active.current?.abort();
    active.current = null;
    setLoading(false);
    setDeep(null);
    const query = value.trim();
    setInput(query);
    if (!/^[0-9]{1,1000}$/.test(query)) {
      setError('Enter 1–1,000 digits (0–9), without spaces or a decimal point.');
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setError('');
    setLoading(true);
    try {
      const data = await getClient().search(query, controller.signal);
      if (controller.signal.aborted) return;
      setResult(data);
      const url = new URL(location.href);
      url.searchParams.set('q', query);
      history.replaceState(null, '', url);
      if (data.count === 0) {
        setLoading(false);
        const startAfter = data.digitsSearched;
        setDeep({ query, running: true, digitsSearched: startAfter, computing: startAfter * 2, elapsedMs: 0 });
        const found = await getClient().deepSearch(query, startAfter, (progress) => {
          if (!controller.signal.aborted) setDeep({ query, running: true, ...progress });
        }, controller.signal);
        if (controller.signal.aborted) return;
        setDeep(null);
        setResult({ query, count: 1, matches: [found.match], digitsSearched: found.digitsSearched, elapsedMs: found.elapsedMs, truncated: false, computed: true });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setDeep(null);
      setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'Couldn’t load the digits. Please try connecting again.');
    } finally {
      if (active.current === controller) setLoading(false);
    }
  }, [getClient]);

  const loadDataset = useCallback(async (signal?: AbortSignal) => {
    setDatasetError(false);
    try {
      const data = await getClient().load(signal);
      if (signal?.aborted) return;
      setDataset(data);
      const initial = new URL(location.href).searchParams.get('q');
      if (initial !== null) void search(initial);
    } catch {
      if (!signal?.aborted) setDatasetError(true);
    }
  }, [search, getClient]);

  useEffect(() => {
    const controller = new AbortController();
    void loadDataset(controller.signal);
    return () => { controller.abort(); active.current?.abort(); client.current?.dispose(); client.current = null; };
  }, [loadDataset]);

  /** Stops a running calculation but keeps how far it got on screen. */
  const stopDeep = () => {
    active.current?.abort();
    active.current = null;
    setDeep((state) => state && { ...state, running: false });
  };

  const clear = () => {
    active.current?.abort();
    active.current = null;
    setDeep(null);
    setInput('');
    setResult(null);
    setError('');
    setLoading(false);
    const url = new URL(location.href);
    url.searchParams.delete('q');
    history.replaceState(null, '', url);
  };

  return { dataset, datasetError, input, setInput, result, error, setError, loading, deep, stopDeep, search, clear, retryDataset: () => loadDataset() };
}
