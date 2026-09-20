import React, { useState } from 'react';
import { X, Shield, ArrowRight, CheckCircle2, CreditCard, Lock } from 'lucide-react';
import { createDodoCheckoutSession, DODO_PRODUCTS } from '@/services/dodoPaymentsService';

const DodoCheckoutModal = ({ isOpen, onClose, defaultPackageKey = 'resource_reference' }) => {
  const [packageKey, setPackageKey] = useState(defaultPackageKey);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentProduct = DODO_PRODUCTS[packageKey] || DODO_PRODUCTS.resource_reference;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await createDodoCheckoutSession({
        packageKey,
        customerEmail: email,
        companyName: company,
        websiteUrl: website,
      });

      if (session.url) {
        window.open(session.url, '_blank');
      }
      onClose();
    } catch {
      alert('Checkout initiation failed. Please use the contact form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Instant Placement Checkout</h3>
            <p className="text-xs text-slate-400">Powered by DodoPayments · 100% Encrypted</p>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Placement</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DODO_PRODUCTS).map(([key, prod]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPackageKey(key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    packageKey === key
                      ? 'border-blue-400 bg-blue-500/15 text-white ring-1 ring-blue-400'
                      : 'border-white/10 bg-slate-950 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold line-clamp-1">{prod.name}</div>
                  <div className="text-sm font-extrabold text-blue-300 mt-1">${prod.priceUsd} USD</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Name *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Product URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>{currentProduct.name}</span>
              <span className="text-blue-300 text-sm font-bold">${currentProduct.priceUsd} USD</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Includes UTM tracking, live preview approval, and instant scheduling confirmation within 48h.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 px-6 text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            {loading ? 'Opening DodoPayments...' : `Pay $${currentProduct.priceUsd} USD via DodoPayments`}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2">
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-emerald-400" /> SSL Encrypted</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-blue-400" /> 100% Refund Guarantee</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DodoCheckoutModal;
