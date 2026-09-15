import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';
import DodoCheckoutButton from '@/components/DodoCheckoutButton';
import { useMembership } from '@/hooks/useMembership';
import { CODING_PROBLEMS, isCodingProblemFree } from '@/data/codingProblems';
import { FREE_QUESTION_LIMIT, INTERVIEW_QUESTIONS } from '@/data/interviewQuestionBank';

const FREE_FEATURES = [
  'Every calculator, playground, and cheat-sheet hub',
  `${CODING_PROBLEMS.filter(isCodingProblemFree).length} starter SQL pads on the sample tables`,
  `First ${FREE_QUESTION_LIMIT} interview prompts with model answers`,
  'Timed certification quizzes in this browser',
  'Articles, start-here tracks, and roadmaps',
  'Progress and saved items on this device — no account',
];

const PRO_FEATURES = [
  `All ${CODING_PROBLEMS.length} SQL pads, including anti-join and sessionization`,
  `Full interview bank (${INTERVIEW_QUESTIONS.length} original prompts)`,
  'Priority when you book coaching',
  'Same Dodo checkout for cards, UPI, and local methods Dodo supports in live mode',
  'Membership flag stored in this browser after return from checkout',
];

export default function PricingPage() {
  const { isPro, plan } = useMembership();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <MetaTags
        title="Pricing — Hub Pro via Dodo Payments"
        description="Free tools and starter SQL. Hub Pro is $12/month or $99/year through Dodo Payments live checkout. Coaching is $149 once. No invented API keys — paste live product IDs to finish."
        url="/pricing"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300/80">
          Pricing
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Pay Dodo. Keep the Hub.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          Checkout is{' '}
          <a
            href="https://docs.dodopayments.com/introduction"
            className="text-blue-400 hover:underline"
            rel="noopener noreferrer"
          >
            Dodo Payments
          </a>{' '}
          in live mode. Overlay uses a Hostinger PHP session (`/api/dodo-checkout.php`). If the
          API key is not on the server yet, the button falls back to the static payment link from
          the dashboard. UPI and PayPal still work on the coffee modal. This page does not put
          secrets in the JavaScript bundle.
        </p>
        {isPro && (
          <p className="mt-4 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            This browser is already marked {plan === 'coaching' ? 'coaching' : 'Hub Pro'}. Manage
            it on <Link to="/settings" className="underline">Settings</Link>.
          </p>
        )}

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-xl font-bold">Free</h2>
            <p className="mt-1 text-3xl font-black">$0</p>
            <p className="mt-2 text-sm text-slate-400">Always. Tools are not a trial.</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              {FREE_FEATURES.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/start-here"
              className="mt-6 inline-flex min-h-10 items-center rounded-lg border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/5"
            >
              Start here
            </Link>
          </article>

          <article className="rounded-2xl border border-blue-400/40 bg-blue-500/10 p-6 ring-1 ring-blue-400/20">
            <h2 className="text-xl font-bold">Hub Pro</h2>
            <p className="mt-1 text-3xl font-black">
              $12<span className="text-base font-semibold text-slate-400">/mo</span>
            </p>
            <p className="text-sm text-slate-400">or $99/year (about two months free)</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              {PRO_FEATURES.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3">
              <DodoCheckoutButton
                sku="pro_monthly"
                source="pricing"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold text-white"
              >
                Pro monthly — $12
              </DodoCheckoutButton>
              <DodoCheckoutButton
                sku="pro_annual"
                source="pricing"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-white/20 text-sm font-semibold text-white hover:bg-white/5"
              >
                Pro annual — $99
              </DodoCheckoutButton>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-xl font-bold">Coaching</h2>
            <p className="mt-1 text-3xl font-black">$149</p>
            <p className="mt-2 text-sm text-slate-400">
              One 60-minute mock (SQL + warehouse cost + one design). Written notes after. We
              email you from the Dodo receipt to schedule — not a calendar bot.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                Live round, not a recorded course
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                Uses Hub pads and the interview bank you already practice on
              </li>
            </ul>
            <div className="mt-6">
              <DodoCheckoutButton
                sku="coaching"
                source="pricing"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-amber-500 px-4 text-sm font-semibold text-slate-950"
              >
                Book coaching — $149
              </DodoCheckoutButton>
            </div>
          </article>
        </div>

        <section className="mt-12 max-w-3xl text-sm leading-relaxed text-slate-400">
          <h2 className="text-lg font-semibold text-white">What I still need from the Dodo dashboard</h2>
          <p className="mt-2">
            Live mode is verified on your account. To finish checkout everywhere, create the
            products listed in <code className="text-slate-300">docs/DODO_PAYMENTS_SETUP.md</code>,
            paste each <code className="text-slate-300">pdt_…</code> ID and payment-link URL into
            GitHub Actions secrets, add the live API key (server only) and webhook signing secret,
            and point the webhook at{' '}
            <code className="text-slate-300">https://dataengineerhub.blog/api/dodo-webhook.php</code>.
            Until those values exist, buttons explain the gap and coffee still takes UPI/PayPal.
          </p>
          <p className="mt-3">
            Advertise packages ($79 / $699 / $149 / $249 / $79 newsletter) checkout from{' '}
            <Link to="/advertise" className="text-blue-400 hover:underline">/advertise</Link> with
            the same Dodo overlay.
          </p>
        </section>
      </div>
    </div>
  );
}
