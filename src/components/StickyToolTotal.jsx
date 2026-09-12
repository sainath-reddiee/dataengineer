const StickyToolTotal = ({ label, value }) => (
  <div
    className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-blue-500/30 bg-slate-950/95 px-4 py-3 backdrop-blur-xl"
    style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
  >
    <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-bold text-white tabular-nums" aria-live="polite">
        {value}
      </p>
    </div>
  </div>
);

export default StickyToolTotal;
