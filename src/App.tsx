import { ArrowDown, ArrowRight, ArrowUpRight, Asterisk, Check, Hash, Infinity as InfinityIcon, LoaderCircle, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ClipboardEvent, FormEvent } from 'react';
import { PiArtwork } from './components/PiArtwork';
import { SearchResults } from './components/SearchResults';
import { usePiSearch } from './hooks/usePiSearch';

const suggestions = [
  { value: '14159', label: 'A familiar beginning' },
  { value: '2026', label: 'This year' },
  { value: '123456', label: 'A little order' },
  { value: '0000', label: 'Beautiful nothingness' },
];
const number = (value: number) => value.toLocaleString('en-US');

export default function App() {
  const pi = usePiSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^[0-9]{1,1000}$/.test(pi.input.trim())) inputRef.current?.focus();
    void pi.search(pi.input);
  };
  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    const field = event.currentTarget;
    const length = field.value.length - ((field.selectionEnd ?? 0) - (field.selectionStart ?? 0)) + event.clipboardData.getData('text').length;
    if (length > 1000) {
      event.preventDefault();
      pi.setError('Paste up to 1,000 digits. Your sequence has not been truncated.');
    }
  };

  return (
    <div className="site-shell">
      <a href="#explore" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-3 focus:text-canvas">Skip to search</a>
      <header className="flex h-23 items-center justify-between gap-6 border-b border-line sm:h-26">
        <a href={import.meta.env.BASE_URL} className="flex shrink-0 items-center gap-2.5" aria-label="Pi Explorer home"><span className="brand-mark">π</span><span className="text-[22px] tracking-[-1px] sm:text-[25px]"><span className="font-semibold">pi</span>explorer<span className="text-lime">.</span></span></a>
        <nav className="hidden items-center gap-8 text-xs md:flex" aria-label="Main navigation"><a href="#explore" className="nav-link text-cream">Explore <span className="ml-1.5 inline-block h-1 w-1 rounded-full bg-lime" /></a><a href="#how-it-works" className="nav-link text-muted">How it works <ArrowUpRight size={13} className="ml-1 inline" aria-hidden="true" /></a></nav>
        <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-[9px] text-muted sm:text-[10px]"><span className={`status-dot ${pi.datasetError ? 'bg-amber-300' : 'bg-lime'}`} />{pi.dataset ? `${number(pi.dataset.digits)} digits indexed` : pi.datasetError ? 'Dataset offline' : 'Connecting…'}</div>
      </header>

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="relative z-10">
            <p className="mb-7 flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.16em] text-sage sm:text-[10px]"><span className="status-dot bg-lime" /> A little curiosity. A million possibilities.</p>
            <h1 id="hero-title" className="hero-title">Find your place<br />in <span className="font-serif italic text-lime">infinity.</span><Asterisk className="hero-star" strokeWidth={1.3} aria-hidden="true" /></h1>
            <p className="mt-6 max-w-100 text-sm leading-7 text-muted sm:text-[15px]">Your birthday. Your lucky number. A string of zeros.<br className="hidden sm:block" /> Somewhere in π, there might be a little piece of you.</p>
            <a href="#explore" className="mt-7 inline-flex items-center gap-2 text-xs text-sage transition hover:text-lime">Let’s find out <ArrowDown size={13} aria-hidden="true" /></a>
          </div>
          <PiArtwork />
        </section>

        <section id="explore" className="search-panel scroll-mt-8" aria-labelledby="search-title">
          <div className="mb-5 flex items-center justify-between gap-4"><div className="flex items-center gap-2.5"><Hash size={17} strokeWidth={1.5} className="text-lime" aria-hidden="true" /><h2 id="search-title" className="text-base font-medium tracking-tight sm:text-lg">What’s your number?</h2></div><span className="hidden items-center gap-1.5 font-mono text-[10px] text-muted sm:flex"><Sparkles size={11} aria-hidden="true" /> NO NUMBER TOO ORDINARY</span><InfinityIcon size={20} strokeWidth={1.2} className="text-muted sm:hidden" aria-hidden="true" /></div>
          <form onSubmit={submit} noValidate>
            <label className="sr-only" htmlFor="number-input">A sequence of 1 to 1,000 digits to find in pi</label>
            <div className={`search-input-wrap ${pi.error ? 'border-amber-300/60' : ''}`}>
              <Search size={20} strokeWidth={1.5} className="hidden shrink-0 text-muted sm:block" aria-hidden="true" />
              <input ref={inputRef} id="number-input" name="q" value={pi.input} onChange={(event) => { pi.setInput(event.target.value); pi.setError(''); }} onPaste={paste} type="text" inputMode="numeric" maxLength={1000} autoComplete="off" spellCheck={false} placeholder="A birthday, a lucky number, anything…" aria-invalid={Boolean(pi.error)} aria-describedby={`search-note${pi.error ? ' input-error' : ''}`} className="min-w-0 flex-1 bg-transparent py-4 font-mono text-base text-cream outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-muted/70 sm:text-lg" />
              {pi.input && <button className="clear-button" onClick={() => { pi.clear(); inputRef.current?.focus(); }} type="button" aria-label="Clear search"><X size={16} /></button>}
              <button id="search-button" type="submit" disabled={pi.loading || !pi.dataset} className="search-button"><span>{pi.loading ? 'Searching' : 'Find in π'}</span>{pi.loading ? <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden="true" /> : <ArrowUpRight size={18} strokeWidth={1.7} aria-hidden="true" />}</button>
            </div>
            {pi.error && <p id="input-error" role="alert" className="mt-3 text-xs leading-6 text-amber-200">{pi.error}</p>}
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-[11px] text-muted">A little inspiration</span>{suggestions.map((item) => <button key={item.value} title={item.label} type="button" disabled={!pi.dataset} onClick={() => void pi.search(item.value)} className="suggestion-button">{item.value}</button>)}</div><p id="search-note" className="flex items-center gap-1.5 text-[10px] text-muted"><Check size={12} className="text-sage" aria-hidden="true" /> Exact matches. Leading zeros welcome.</p></div>
          {pi.datasetError && <p role="alert" className="mt-4 text-xs text-amber-200">The digit dataset is unavailable. <button onClick={() => void pi.retryDataset()} className="ml-1 underline underline-offset-4" type="button">Try connecting again</button></p>}
        </section>
        <div className="mt-3.5 flex items-center justify-between gap-4 px-1 text-[10px] leading-5 text-muted/90"><p>Searching {pi.dataset ? `the first ${number(pi.dataset.digits)}` : 'a finite dataset of'} decimal digits of π.</p><p className="hidden items-center gap-1.5 sm:flex">Press <kbd className="rounded border border-line px-1.5 font-mono text-[10px]">/</kbd> to focus</p></div>

        <SearchResults result={pi.result} loading={pi.loading} error={pi.error} />

        <section id="how-it-works" className="explainer-section scroll-mt-8" aria-labelledby="explanation-title">
          <div><div className="mb-4 flex items-center gap-3"><span className="section-index">02 /</span><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Behind the digits</span></div><h2 id="explanation-title" className="text-[30px] leading-tight tracking-[-1px] sm:text-[35px]">Infinite digits.<br /><span className="font-serif text-[37px] italic text-sage sm:text-[44px]">One tiny window.</span></h2><div className="mt-6 flex items-center gap-2 font-mono text-[10px] text-muted"><span className="h-1 w-1 rounded-full bg-sage" /> A CONSTANT SOURCE OF WONDER</div></div>
          <div className="space-y-5"><p className="text-[13px] leading-7 text-muted">π goes on forever. This explorer searches its <strong className="font-medium text-cream">first {number(pi.dataset?.digits ?? 1_000_000)} decimal digits</strong> — a small window into something infinite.</p><div className="position-example"><span className="font-mono text-lg tracking-[0.17em] text-muted">3.<mark>1</mark>41592653589…</span><span className="flex items-center gap-1.5 text-[11px] text-sage"><ArrowUpRight size={13} aria-hidden="true" /> Position 1</span></div><p className="text-[13px] leading-7 text-muted">We start counting at <strong className="font-medium text-cream">1</strong>, the first digit after the decimal point. Every match is exact, and overlapping matches count too.</p><p className="border-l border-lime/25 pl-4 text-[11px] leading-6 text-muted/85">A sequence that isn’t here could appear further along. Whether every possible sequence appears in π remains an open mathematical question. There’s always more to discover.</p></div>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-7 text-[11px] text-muted"><span className="flex items-center gap-2"><Asterisk size={15} strokeWidth={1.4} className="text-sage" aria-hidden="true" /> Made for the endlessly curious.</span><span className="order-3 w-full font-mono text-[10px] tracking-wider text-muted/70 md:order-0 md:w-auto">3.141592653589793238462643383279…</span><a href="#explore" className="flex items-center gap-1.5 text-sage hover:text-lime">Keep exploring <ArrowRight size={13} aria-hidden="true" /></a></footer>
    </div>
  );
}
