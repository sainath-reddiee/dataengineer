// src/components/calculator/ValidateWithSqlBlock.jsx
// Collapsible "Validate with SQL" block for calculator pages.
// Shows a copyable SQL snippet users can run against SNOWFLAKE.ACCOUNT_USAGE
// (or equivalent) to reconcile the calculator estimate with their real bill.
import { useState, useCallback } from 'react';
import { Terminal, Copy, Check, ChevronDown } from 'lucide-react';

// Fallback copy for insecure contexts where navigator.clipboard is unavailable.
function fallbackCopy(text, onOk) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    onOk();
  } catch { /* clipboard unavailable; silent no-op */ }
}

const ValidateWithSqlBlock = ({ title, description, sql, note }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = sql.trim();
    const onOk = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    // Prefer async Clipboard API; fall back to execCommand for insecure contexts.
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onOk).catch(() => fallbackCopy(text, onOk));
    } else {
      fallbackCopy(text, onOk);
    }
  }, [sql]);

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-800/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <div>
            <div className="text-white font-semibold">{title}</div>
            {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t border-slate-700 p-5 space-y-3">
          <div className="relative">
            <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs text-gray-100 font-mono overflow-x-auto whitespace-pre">
              {sql.trim()}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/80 hover:bg-slate-700 border border-slate-600 rounded text-gray-200"
            >
              {copied ? (
                <><Check className="w-3 h-3 text-green-400" aria-hidden="true" /> Copied</>
              ) : (
                <><Copy className="w-3 h-3" aria-hidden="true" /> Copy</>
              )}
            </button>
          </div>
          {note && <p className="text-xs text-gray-400">{note}</p>}
        </div>
      )}
    </div>
  );
};

export default ValidateWithSqlBlock;
