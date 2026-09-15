import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import DodoCheckoutButton from '@/components/DodoCheckoutButton';
import { planFromSku, useMembership } from '@/hooks/useMembership';
import { useLearnProgress } from '@/hooks/useLearnProgress';
import { MEMBERSHIP_PLANS } from '@/data/dodoCatalog';

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const { plan, sku, updatedAt, isPro, grantFromSku, clearMembership } = useMembership();
  const { clearProgress } = useLearnProgress();

  const dodoFlag = params.get('dodo');
  const returnedSku = params.get('sku');
  const upgraded = params.get('upgraded');

  useEffect(() => {
    if (dodoFlag === 'success') {
      grantFromSku(returnedSku || 'pro_monthly', 'dodo_return');
    }
    if (upgraded === 'pro') {
      grantFromSku('pro_monthly', 'legacy_query');
    }
  }, [dodoFlag, returnedSku, upgraded, grantFromSku]);

  const planMeta = MEMBERSHIP_PLANS[plan] || MEMBERSHIP_PLANS.free;
  const success = dodoFlag === 'success';
  const granted = useMemo(() => planFromSku(returnedSku || ''), [returnedSku]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Settings — membership on this device"
        description="Hub Pro and coaching flags after Dodo Payments return. Stored in this browser only."
        url="/settings"
        noindex
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          This browser
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-4 text-base text-slate-300">
          There is no Hub login. Dodo hosts the receipt and customer portal. After a successful
          payment we set a membership flag in localStorage so Pro pads unlock on this device.
          Webhooks land on Hostinger for your records; they do not sync other browsers yet.
        </p>

        {success && (
          <div className="mt-6 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm text-blue-50">
            <p className="font-semibold">Dodo checkout returned success.</p>
            <p className="mt-1 text-slate-300">
              {granted === 'pro'
                ? 'Hub Pro is on for this browser. Hard SQL pads and the full interview bank are unlocked.'
                : granted === 'coaching'
                  ? 'Coaching is marked paid. Email sainath@dataengineerhub.blog with the Dodo receipt if we have not already written you.'
                  : 'Thanks — if this was a coffee, it keeps the Hub online. Pro pads need the Pro SKU.'}
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-blue-300 underline"
              onClick={() => setParams({})}
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Membership</h2>
          <p className="mt-1 text-sm text-slate-400">{planMeta.blurb}</p>
          <p className="mt-3 text-2xl font-bold">{planMeta.name}</p>
          {sku && <p className="mt-1 text-xs text-slate-500">Last SKU: {sku}</p>}
          {updatedAt && (
            <p className="text-xs text-slate-500">Updated {updatedAt.slice(0, 10)}</p>
          )}
          {!isPro && (
            <div className="mt-4">
              <DodoCheckoutButton
                sku="pro_monthly"
                source="settings"
                className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white"
              >
                Upgrade to Hub Pro
              </DodoCheckoutButton>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link to="/pricing" className="text-blue-400 hover:underline">
              All plans
            </Link>
            <Link to="/progress" className="text-blue-400 hover:underline">
              Learning progress
            </Link>
            <Link to="/saved" className="text-blue-400 hover:underline">
              Saved items
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Danger zone (this device only)</h2>
          <p className="mt-2 text-sm text-slate-400">
            Clearing membership does not refund Dodo. Clearing SQL progress does not delete
            reading-list articles.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearMembership}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
            >
              Clear membership flag
            </button>
            <button
              type="button"
              onClick={clearProgress}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
            >
              Clear SQL pad progress
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
