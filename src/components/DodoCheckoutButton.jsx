import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { dodoReadyMessage, startDodoCheckout } from '@/utils/dodoCheckout';
import { dodoSkuConfigured, getDodoSku } from '@/data/dodoCatalog';

export default function DodoCheckoutButton({
  sku,
  children,
  className = '',
  source = 'button',
  disabled = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const spec = getDodoSku(sku);
  const ready = dodoSkuConfigured(sku);

  const onClick = async () => {
    if (!spec || disabled || busy) return;
    setError('');
    setBusy(true);
    try {
      await startDodoCheckout(sku, { source });
    } catch (err) {
      setError(err?.message || dodoReadyMessage(sku) || 'Checkout did not start.');
    } finally {
      setBusy(false);
    }
  };

  if (!spec) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        className={className}
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening checkout…
          </span>
        ) : (
          children
        )}
      </button>
      {!ready && (
        <p className="text-xs text-amber-300/90">{dodoReadyMessage(sku)}</p>
      )}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}
