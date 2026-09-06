import React, { useState } from 'react';
import { Check, Coffee, Copy, ExternalLink, Globe, Mail, MapPin } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/data/supportConfig';
import { copyToClipboard } from '@/utils/seo/exportUtils';
import { trackEvent } from '@/utils/analytics';

// Shared UPI / PayPal payment cards used by both the SupportModal (compact,
// tabbed) and the Advertise page (always-visible, side-by-side grid).
const SupportPanel = ({ layout = 'tabs', source = 'support_panel' }) => {
  const [tab, setTab] = useState('upi');
  const [copiedField, setCopiedField] = useState('');

  const handleCopy = async (field, value) => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopiedField(field);
      trackEvent({ action: 'copy_support_id', category: 'monetization', label: `${source}:${field}` });
      window.setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const handleOpen = (label) => {
    trackEvent({ action: 'support_click', category: 'monetization', label: `${source}:${label}` });
  };

  const SupportNote = () => (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-amber-950/30 p-4 sm:p-5">
      <p className="text-sm leading-relaxed text-slate-200">{SUPPORT_CONFIG.supportNote}</p>
    </div>
  );

  const UpiCard = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/25">
          <MapPin className="h-4 w-4 text-amber-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">UPI (India)</h3>
          <p className="text-[11px] text-gray-500">Google Pay, PhonePe, Paytm, BHIM</p>
        </div>
      </div>
      <p className="text-sm text-gray-400">
        Copy the ID below and paste it into your UPI app — you pick which app handles the payment.
      </p>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">UPI ID</p>
          <p className="text-sm font-semibold text-white truncate">{SUPPORT_CONFIG.upi.id}</p>
        </div>
        <button
          type="button"
          onClick={() => handleCopy('upi', SUPPORT_CONFIG.upi.id)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-slate-600 px-3 py-1.5 text-xs text-gray-200 hover:border-amber-400/60 hover:text-white transition-colors"
        >
          {copiedField === 'upi' ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copiedField === 'upi' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => handleCopy('upi_cta', SUPPORT_CONFIG.upi.id)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-4 py-3 text-sm font-semibold transition-colors shadow-lg shadow-amber-900/20"
      >
        {copiedField === 'upi_cta' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiedField === 'upi_cta' ? 'UPI ID copied' : 'Copy UPI ID'}
      </button>
    </div>
  );

  const PayPalCard = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 border border-blue-500/25">
          <Globe className="h-4 w-4 text-blue-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">PayPal (International)</h3>
          <p className="text-[11px] text-gray-500">Cards, bank, PayPal balance</p>
        </div>
      </div>
      <p className="text-sm text-gray-400">
        Opens PayPal.me in your browser — no email to copy, no QR to scan.
      </p>
      <div className="rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-3.5">
        <p className="text-[11px] uppercase tracking-wider text-gray-500">PayPal.me</p>
        <p className="mt-0.5 text-sm font-semibold text-white truncate">
          paypal.me/{SUPPORT_CONFIG.paypal.handle}
        </p>
      </div>
      <a
        href={SUPPORT_CONFIG.paypal.meUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleOpen('paypal_me')}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-4 py-3 text-sm font-semibold transition-colors shadow-lg shadow-blue-900/20"
      >
        <ExternalLink className="h-4 w-4" />
        Pay on PayPal
      </a>
      <button
        type="button"
        onClick={() => handleCopy('paypal_link', SUPPORT_CONFIG.paypal.meUrl)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-xs font-medium text-gray-300 hover:border-slate-500 hover:text-white transition-colors"
      >
        {copiedField === 'paypal_link' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copiedField === 'paypal_link' ? 'Link copied' : 'Copy PayPal link'}
      </button>
    </div>
  );

  const NoteCallout = () => (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
      <p className="text-sm font-semibold text-white flex items-center gap-2">
        <Mail className="h-4 w-4 text-blue-300" />
        Want to send a personal note?
      </p>
      <p className="mt-1 text-xs text-gray-400 leading-relaxed">
        Add a message in your UPI or PayPal payment note, or email me directly — I read every message
        and reply personally.
      </p>
      <a
        href={SUPPORT_CONFIG.noteMailto()}
        onClick={() => handleOpen('send_note_email')}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-blue-200"
      >
        Email me a note
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );

  if (layout === 'grid') {
    return (
      <div className="space-y-6">
        <SupportNote />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-inner">
            <UpiCard />
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-inner">
            <PayPalCard />
          </div>
        </div>
        <NoteCallout />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SupportNote />
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'upi', label: 'UPI (India)', icon: MapPin },
          { key: 'paypal', label: 'PayPal', icon: Coffee },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
              tab === key
                ? 'bg-white text-slate-900 border-white shadow-sm'
                : 'border-slate-600 text-gray-300 hover:border-slate-400 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5">
        {tab === 'upi' ? <UpiCard /> : <PayPalCard />}
      </div>
      <NoteCallout />
    </div>
  );
};

export default SupportPanel;
