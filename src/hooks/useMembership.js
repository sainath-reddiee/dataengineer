import { useCallback, useEffect, useState } from 'react';

export const MEMBERSHIP_KEY = 'dehub:membership:v1';

const EMPTY = {
  plan: 'free',
  sku: null,
  source: null,
  updatedAt: null,
};

function readMembership() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MEMBERSHIP_KEY) || '{}');
    const plan = parsed.plan === 'pro' || parsed.plan === 'coaching' ? parsed.plan : 'free';
    return {
      plan,
      sku: parsed.sku || null,
      source: parsed.source || null,
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { ...EMPTY };
  }
}

function writeMembership(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('dehub-membership'));
  } catch {
    /* quota */
  }
}

export function planFromSku(sku) {
  if (sku === 'pro_monthly' || sku === 'pro_annual') return 'pro';
  if (sku === 'coaching') return 'coaching';
  return 'free';
}

export function useMembership() {
  const [state, setState] = useState(readMembership);

  useEffect(() => {
    const refresh = () => setState(readMembership());
    window.addEventListener('storage', refresh);
    window.addEventListener('dehub-membership', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('dehub-membership', refresh);
    };
  }, []);

  const grantFromSku = useCallback((sku, source = 'dodo') => {
    const plan = planFromSku(sku);
    if (plan === 'free' && sku !== 'coffee') return;
    setState((prev) => {
      const nextPlan =
        plan === 'coaching' && prev.plan === 'pro'
          ? 'pro'
          : plan === 'free'
            ? prev.plan
            : plan;
      const next = {
        plan: nextPlan,
        sku: sku || prev.sku,
        source,
        updatedAt: new Date().toISOString(),
      };
      if (plan === 'coaching' && prev.plan !== 'pro') {
        next.plan = 'coaching';
      }
      if (plan === 'pro') next.plan = 'pro';
      writeMembership(next);
      return next;
    });
  }, []);

  const clearMembership = useCallback(() => {
    writeMembership({ ...EMPTY });
    setState({ ...EMPTY });
  }, []);

  const isPro = state.plan === 'pro' || state.plan === 'coaching';

  return { ...state, isPro, grantFromSku, clearMembership };
}
