// src/pages/RefundPolicyPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';

const RefundPolicyPage = () => {
  return (
    <>
      <MetaTags
        title="Refund Policy - Sponsorship Payments"
        description="Refund policy for paid sponsorship packages on dataengineerhub.blog: full refunds before go-live, how to ask, how long it takes, and the role of Dodo Payments as merchant of record."
        keywords="refund policy, sponsorship refund, Dodo Payments, merchant of record"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Refund Policy
        </h1>

        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last Updated: October 17, 2026</p>

          <h2 className="text-xl font-bold text-white mt-8">What this covers</h2>
          <p>
            This policy covers the paid sponsorship packages listed on the{' '}
            <Link className="text-blue-400 underline" to="/advertise">Advertise</Link> page: sponsored cards, Tools Hub
            listings, co-authored integration guides and sponsored announcements. Reading the site is free and nothing
            else on dataengineerhub.blog is sold.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Who you pay</h2>
          <p>
            Card payments are processed by Dodo Payments, which acts as the merchant of record. Dodo Payments charges
            your card, calculates and collects any applicable tax (VAT, GST or sales tax), and sends the tax receipt.
            Their{' '}
            <a className="text-blue-400 underline" href="https://dodopayments.com/legal/buyer-terms" rel="noopener noreferrer" target="_blank">buyer terms</a>{' '}
            also apply to the purchase. Prices on this site are in USD before tax, and you may be charged in your local
            currency.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Full refund before go-live</h2>
          <ul>
            <li>If I decline your placement for any reason, you get a full refund.</li>
            <li>If you cancel before the placement goes live, you get a full refund.</li>
            <li>If I cannot publish within the time stated for the package and you do not want to wait, you get a full refund.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-8">After go-live</h2>
          <p>
            Once a placement is live, the payment is not refundable, because the work has been delivered. One exception:
            if I remove a 12-month card or listing early for a reason other than a breach of the{' '}
            <Link className="text-blue-400 underline" to="/advertise#rules">house rules</Link>, I refund the unused
            whole months pro rata. Monthly cards do not auto-renew, so there is nothing to cancel.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">How to ask for a refund</h2>
          <p>
            Email <a className="text-blue-400 underline" href="mailto:sainath@dataengineerhub.blog">sainath@dataengineerhub.blog</a>{' '}
            with your order reference (it starts with <code>deh_</code> and is in your confirmation email). I reply within
            two working days and issue approved refunds through Dodo Payments within five working days. Your bank may
            take a further 5 to 10 working days to show the money.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Tax and currency</h2>
          <p>
            A refund returns the full amount you were charged, including tax, to the card you paid with. If you were
            charged in your local currency, the refund is made in that currency; exchange-rate differences applied by
            your bank are outside my control.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Before a chargeback</h2>
          <p>
            Please email me before disputing a charge with your bank. Refunds through Dodo Payments are faster than a
            chargeback, and a dispute pauses the placement while it is reviewed.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Related</h2>
          <p>
            See the <Link className="text-blue-400 underline" to="/terms-of-service">terms of service</Link> and the{' '}
            <Link className="text-blue-400 underline" to="/privacy-policy">privacy policy</Link> for how order details are
            stored.
          </p>
        </div>
      </div>
    </>
  );
};

export default RefundPolicyPage;
