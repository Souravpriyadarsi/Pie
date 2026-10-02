import { ArrowDown, ArrowUpRight, Calculator, Check, Copy, Infinity as InfinityIcon, LoaderCircle, RotateCw, ScanLine, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DeepSearchState, PiMatch, SearchResult } from '../types';

const number = (value: number) => value.toLocaleString('en-US');

function MatchRow({ match, rank, digits }: { match: PiMatch; rank: number; digits: number }) {
  return (
    <li className="match-row group">
      <span className="font-mono text-[11px] text-muted">{String(rank).padStart(2, '0')}</span>
      <div className="flex items-center gap-2 sm:block">
        <span className="mb-1 block font-mono text-[9px] tracking-widest text-muted">POSITION</span>
        <span className="font-mono text-[13px] text-cream">{number(match.position)}</span>
      </div>
      <div className="digit-context" aria-label={`Match ${match.match} at position ${number(match.position)}`}>
        <span>{match.atStart ? '3.' : '…'}{match.before}</span>
        <mark>{match.match}</mark>
        <span>{match.after}{match.position - 1 + match.match.length + match.after.length < digits ? '…' : ''}</span>
      </div>
      <ArrowUpRight className="hidden h-4 w-4 text-muted opacity-40 transition group-hover:text-lime group-hover:opacity-100 md:block" aria-hidden="true" />
    </li>
  );
}

const duration = (ms: number) => ms < 1000 ? `${Math.round(ms)} ms` : ms < 60_000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`;

function DeepSearchPanel({ deep, onStop, onResume }: { deep: DeepSearchState; onStop: () => void; onResume: () => void }) {
  return (
    <div id="deep-search" className="mt-5 rounded-xl border border-dashed border-lime/20 bg-lime/3 px-6 py-7">
      <h3 className="flex items-center gap-2 text-lg"><Calculator size={18} className="text-lime" aria-hidden="true" />{deep.running ? 'Calculating π further…' : 'Calculation stopped.'}</h3>
      <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">
        Not in the first {number(deep.digitsSearched)} digits{deep.running ? <>. Now calculating up to <span className="text-cream">{number(deep.computing)}</span> digits and scanning them. Nothing is stored — each round is computed fresh and discarded.</> : '.'}
      </p>
      <p className="mt-3 font-mono text-[11px] text-muted">{number(deep.digitsSearched)} digits explored · {duration(deep.elapsedMs)}</p>
      <p className="mt-1 text-[11px] leading-5 text-muted/80">Each round doubles the digits and takes roughly 2.5× longer. A sequence of n digits usually first appears near position 10ⁿ.</p>
      {deep.running
        ? <button className="subtle-button mt-5" onClick={onStop} type="button"><Square size={12} aria-hidden="true" /> Stop calculating</button>
        : <button className="subtle-button mt-5" onClick={onResume} type="button"><RotateCw size={12} aria-hidden="true" /> Search again</button>}
    </div>
  );
}

export function SearchResults({ result, loading, error, deep, onStopDeep, onResumeDeep }: { result: SearchResult | null; loading: boolean; error: string; deep: DeepSearchState | null; onStopDeep: () => void; onResumeDeep: () => void }) {
  const [visible, setVisible] = useState(10);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  useEffect(() => { setVisible(10); setCopied(false); setCopyError(''); }, [result]);
  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copyLink = async () => {
    const url = new URL(location.href);
    url.searchParams.set('q', result!.query);
    try { await navigator.clipboard.writeText(url.href); setCopied(true); setCopyError(''); }
    catch { setCopyError('Copy the URL from your address bar to share this search.'); }
  };
  const status = loading ? 'Exploring the digits…' : deep?.running ? `Calculating π · ${number(deep.digitsSearched)} digits explored` : error ? 'Search needs your attention' : result?.computed ? 'First appearance found' : result ? `${number(result.count)} ${result.count === 1 ? 'match' : 'matches'} found` : 'A discovery is just a number away';

  return (
    <section id="discoveries" className="mt-11 scroll-mt-8 sm:mt-14" aria-labelledby="results-title" aria-busy={loading || Boolean(deep?.running)}>
      <div className="section-heading">
        <div className="flex items-center gap-3"><span className="section-index">01 /</span><h2 id="results-title" className="text-base font-medium sm:text-lg">Your discoveries</h2></div>
        <p className="flex max-w-48 items-center gap-2 text-right font-mono text-[10px] leading-relaxed text-muted sm:max-w-none sm:text-[11px]" role="status" aria-live="polite">{(loading || deep?.running) && <LoaderCircle size={13} className="shrink-0 motion-safe:animate-spin" aria-hidden="true" />}{status}</p>
      </div>

      {!result ? (
        <div className="empty-state">
          <div className="empty-orbit"><InfinityIcon size={39} strokeWidth={1.2} className="text-lime/80" aria-hidden="true" /></div>
          <h3 className="mt-5 text-lg tracking-tight">A small number. A big adventure.</h3>
          <p className="mt-2 max-w-sm text-[13px] leading-6 text-muted">Enter a sequence above and discover its exact place in the digits of π.</p>
          <span className="mt-6 flex items-center gap-2 font-mono text-[10px] tracking-widest text-muted/80"><ScanLine size={13} aria-hidden="true" /> READY WHEN YOU ARE</span>
        </div>
      ) : (
        <div className="result-enter mt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-[13px] text-muted">The story of <span className="query-tag">{result.query.length > 30 ? result.query.slice(0, 30) + '…' : result.query}</span></p>
            <button onClick={() => void copyLink()} className="subtle-button" type="button" aria-label="Copy search link">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Link copied' : 'Share discovery'}</button>
          </div>
          {copyError && <p role="status" className="mb-4 text-xs text-muted">{copyError}</p>}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.15fr_1fr_1fr]">
            <div className="stat-card stat-card-featured col-span-2 lg:col-span-1">
              <span className="stat-label">FIRST APPEARANCE</span>
              <strong id="first-position" className="stat-value text-lime">{result.count ? number(result.matches[0].position) : deep?.running ? 'Searching…' : 'Not found'}</strong>
              <span className="stat-caption flex items-center justify-between">digits after the decimal point <ArrowUpRight size={17} className="text-lime" aria-hidden="true" /></span>
            </div>
            {result.computed
              ? <div className="stat-card"><span className="stat-label">FOUND BY</span><strong id="match-count" className="stat-value">Live math</strong><span className="stat-caption">calculated, not stored</span></div>
              : <div className="stat-card"><span className="stat-label">EXACT MATCHES</span><strong id="match-count" className="stat-value">{number(result.count)}</strong><span className="stat-caption">in this slice of infinity</span></div>}
            <div className="stat-card"><span className="stat-label">DIGITS EXPLORED</span><strong className="stat-value">{number(result.digitsSearched)}</strong><span className="stat-caption">{result.computed ? 'Calculated' : 'Searched'} in {result.elapsedMs < 1 ? '< 1 ms' : duration(result.elapsedMs)}</span></div>
          </div>
          {result.count ? (
            <div className="mt-8">
              <div className="mb-4 flex items-start justify-between gap-4"><h3 className="text-[13px] text-cream/80">The neighborhood of your number</h3><p className="max-w-40 text-right font-mono text-[10px] leading-relaxed text-muted sm:max-w-none">{result.computed ? 'First appearance only' : <>Showing {Math.min(visible, result.matches.length)} of {number(result.count)}{result.truncated && <span className="block text-muted/80">First 100 matches available</span>}</>}</p></div>
              <ol className="overflow-hidden rounded-xl border border-line" aria-label="Exact matches in pi">{result.matches.slice(0, visible).map((match, i) => <MatchRow key={match.position} match={match} rank={i + 1} digits={result.digitsSearched} />)}</ol>
              {visible < result.matches.length && <button className="more-button" onClick={() => setVisible((value) => value + 10)} type="button">Explore more matches <ArrowDown size={14} aria-hidden="true" /></button>}
            </div>
          ) : deep?.query === result.query ? (
            <DeepSearchPanel deep={deep} onStop={onStopDeep} onResume={onResumeDeep} />
          ) : (
            <div id="no-match" className="mt-5 rounded-xl border border-dashed border-lime/20 bg-lime/3 px-6 py-7">
              <h3 className="text-lg">Still a little mystery.</h3>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted">This sequence doesn’t appear in the first {number(result.digitsSearched)} decimal digits. It could appear beyond our dataset. Try a shorter sequence, or let curiosity take you somewhere new.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
