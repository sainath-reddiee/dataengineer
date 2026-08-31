import { useEffect, useState } from 'react';

/**
 * WordPress 522s can leave listings in a loading state for tens of
 * seconds. After a short wait, callers should paint bundled titles
 * instead of skeletons so a reviewer does not snapshot empty cards.
 */
export function useSlowLoadFallback(isPending, delayMs = 1500) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setTimedOut(false);
      return undefined;
    }

    const timer = setTimeout(() => setTimedOut(true), delayMs);
    return () => clearTimeout(timer);
  }, [isPending, delayMs]);

  return Boolean(isPending && timedOut);
}
