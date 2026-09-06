import React, { useState } from 'react';
import { Check, Coffee, Copy, ExternalLink, Mail, MapPin } from 'lucide-react';
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

  const UpiCard = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-amber-300" />
        <h3 className="text-sm font-bold text-white">UPI (India)</h3>
      </div>
      <p className="text-sm text-gray-300">
        Copy this ID, then paste it into Google Pay, PhonePe, Paytm, BHIM, or the UPI app you prefer.
      </p>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">UPI ID</p>
          <p className="text-sm font-semibold text-white truncate">{SUPPORT_CONFIG.upi.id}</p>
        </div>
        <button
          type="button"
          onClick={() => handleCopy('upi', SUPPORT_CONFIG.upi.id)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-slate-600 px-3 py-1.5 text-xs text-gray-200 hover:border-amber-400/60 hover:text-white"
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
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-4 py-3 text-sm font-semibold transition-colors"
      >
        {copiedField === 'upi_cta' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiedField === 'upi_cta' ? 'UPI ID copied' : 'Copy UPI ID'}
      </button>
      <p className="text-xs text-gray-500">
        This avoids opening a different app automatically — you choose the app that handles your payment.
      </p>
    </div>
  );

  const PayPalCard = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Coffee className="h-4 w-4 text-blue-300" />
        <h3 className="text-sm font-bold text-white">PayPal (International)</h3>
      </div>
      <p className="text-sm text-gray-300">
        For international transactions — scan this QR in PayPal, or send directly to the email below.
      </p>
      <div className="flex justify-center">
        <img
          src={SUPPORT_CONFIG.paypal.qrImage}
          alt="Scan to pay via PayPal"
          width={320}
          height={320}
          className="rounded-2xl border border-slate-700/60 bg-white p-3 w-64 h-64 sm:w-72 sm:h-72 object-contain shadow-lg"
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">PayPal email</p>
          <p className="text-sm font-semibold text-white truncate">{SUPPORT_CONFIG.paypal.email}</p>
        </div>
        <button
          type="button"
          onClick={() => handleCopy('paypal', SUPPORT_CONFIG.paypal.email)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-slate-600 px-3 py-1.5 text-xs text-gray-200 hover:border-amber-400/60 hover:text-white"
        >
          {copiedField === 'paypal' ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copiedField === 'paypal' ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        type="button"
        onClick={() => handleCopy('paypal_cta', SUPPORT_CONFIG.paypal.email)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white px-4 py-3 text-sm font-semibold transition-colors"
      >
        {copiedField === 'paypal_cta' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiedField === 'paypal_cta' ? 'PayPal email copied' : 'Copy PayPal email'}
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
        Add your email in the UPI/PayPal payment note, or email me directly — I read every message and
        reply personally.
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
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <UpiCard />
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <PayPalCard />
          </div>
        </div>
        <NoteCallout />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'upi', label: 'UPI (India)', icon: MapPin },
          { key: 'paypal', label: 'PayPal (International)', icon: Coffee },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
              tab === key
                ? 'bg-white text-slate-900 border-white'
                : 'border-slate-600 text-gray-300 hover:border-slate-400 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      {tab === 'upi' ? <UpiCard /> : <PayPalCard />}
      <div className="mt-5">
        <NoteCallout />
      </div>
    </div>
  );
};

export default SupportPanel;
