import { Link } from 'react-router-dom';
import MetaTags from '@/components/SEO/MetaTags';

const EditorialStandardsPage = () => {
  return (
    <>
      <MetaTags
        title="Editorial Standards — How We Write"
        description="How DataEngineer Hub writes, reviews, and updates tutorials. Practitioner-first editorial standards, what we will not publish, and how to request a correction."
        keywords="editorial standards, content policy, data engineering blog, original tutorials, E-E-A-T"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Editorial Standards
        </h1>

        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last updated: August 31, 2026</p>

          <p>
            DataEngineer Hub is a practitioner site, not a content mill. Every indexed article is
            written or signed off by{' '}
            <Link to="/about" className="text-blue-400 underline">Sainath Reddy</Link>, a data
            engineer based in Hyderabad who has spent the last several years on Snowflake, dbt,
            Airflow, and warehouse cost problems in production. This page is the rulebook for what
            goes live.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">What we publish</h2>
          <p>
            Tutorials, architecture notes, cost breakdowns, and interview-style walkthroughs that
            come from work we have actually done: warehouse sizing mistakes, Cortex token bills,
            dbt model reviews, Time Travel recoveries, and SQL patterns that show up in interviews
            because they show up on the job. If a page cannot name a concrete failure mode, a
            number, or a decision we would make again, it does not ship as an article.
          </p>
          <p>
            Interactive tools (cost calculators, SQL playground, format converters) and cheat sheets
            exist to support those articles. They are not substitutes for the article library.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">What we will not publish</h2>
          <ul>
            <li>Rewrites of vendor documentation with a new title</li>
            <li>Unreviewed AI drafts, spun articles, or scraped aggregations</li>
            <li>Pages whose only purpose is to rank for a keyword</li>
            <li>Thin listing pages with one or two cards and no original copy</li>
            <li>Duplicate URLs that 301 to a canonical article</li>
          </ul>
          <p>
            Glossary terms and tool-vs-tool pages stay on the site as a working reference for
            readers. They are not the front door of the site and they are not treated as
            equivalent to original tutorials.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">How an article is made</h2>
          <ol>
            <li>
              <strong>Source.</strong> A production note, a cost incident, a review comment, or a
              question that kept coming up at work.
            </li>
            <li>
              <strong>Draft.</strong> Written in the author&apos;s voice. AI tools may help outline
              or check syntax. They do not publish unsupervised. See the{' '}
              <Link to="/disclaimer" className="text-blue-400 underline">disclaimer</Link>.
            </li>
            <li>
              <strong>Review.</strong> Sainath checks technical claims, code samples, and whether
              the piece adds anything a first-page Google result does not already say.
            </li>
            <li>
              <strong>Update.</strong> Pricing, exam blueprints, and warehouse features change.
              Articles carry a last-updated date. When a number is wrong, we fix the page rather
              than leave a stale 2024 screenshot up.
            </li>
          </ol>

          <h2 className="text-xl font-bold text-white mt-8">Guest writing</h2>
          <p>
            Guest authors appear on{' '}
            <Link to="/contributors" className="text-blue-400 underline">/contributors</Link>{' '}
            only after at least one piece has passed the same review and gone live. Pitches go
            through{' '}
            <Link to="/contribute" className="text-blue-400 underline">Write for Us</Link>. We
            reject generic overviews. We want the incident you actually debuged.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Corrections</h2>
          <p>
            If a query, credit rate, or exam detail is wrong, email{' '}
            <a className="text-blue-400 underline" href="mailto:sainath@dataengineerhub.blog">
              sainath@dataengineerhub.blog
            </a>{' '}
            or use the{' '}
            <Link to="/contact" className="text-blue-400 underline">contact form</Link>. We reply
            personally, usually within 24–48 hours on weekdays, India Standard Time, and we update
            the page when you are right.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Advertising</h2>
          <p>
            Ads, if shown, are separate from editorial. Sponsors cannot rewrite a tutorial to match
            a talking point. Affiliate links are disclosed in the disclaimer. Privacy details live
            on the{' '}
            <Link to="/privacy-policy" className="text-blue-400 underline">privacy policy</Link>.
          </p>
        </div>
      </div>
    </>
  );
};

export default EditorialStandardsPage;
