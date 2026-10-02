export function PiArtwork() {
  return (
    <div className="pi-artwork hidden lg:block" aria-hidden="true">
      <div className="art-grid" />
      <div className="pi-glow" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 430 340" fill="none">
        <circle cx="218" cy="163" r="132" stroke="#a9c58a" strokeOpacity="0.12" strokeDasharray="2 6" />
        <ellipse cx="218" cy="163" rx="155" ry="78" transform="rotate(-31 218 163)" stroke="#a9c58a" strokeOpacity="0.35" />
        <ellipse cx="218" cy="163" rx="148" ry="84" transform="rotate(34 218 163)" stroke="#a9c58a" strokeOpacity="0.25" />
        <ellipse cx="218" cy="163" rx="142" ry="82" transform="rotate(90 218 163)" stroke="#a9c58a" strokeOpacity="0.18" />
        <circle cx="349" cy="79" r="4" fill="#b5f579" />
        <circle cx="92" cy="245" r="3" fill="#b5f579" />
        <path d="M58 111h10m-5-5v10M350 262h10m-5-5v10" stroke="#b5f579" strokeOpacity="0.75" />
      </svg>
      <span className="art-pi">π</span>
      <span className="art-digits left-3 top-9 -rotate-12">3.1415926535</span>
      <span className="art-digits right-0 top-40 rotate-12">8979323846</span>
      <span className="art-digits bottom-20 left-5 rotate-6">2643383279</span>
      <span className="absolute bottom-2 left-0 w-full text-center font-mono text-[9px] tracking-[0.18em] text-muted">IRRATIONAL. INFINITE. ENDLESSLY INTERESTING.</span>
    </div>
  );
}
