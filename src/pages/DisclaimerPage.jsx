// src/pages/DisclaimerPage.jsx
import React from 'react';
import MetaTags from '@/components/SEO/MetaTags';

const DisclaimerPage = () => {
  return (
    <>
      <MetaTags
        title="Disclaimer - Information and Advice"
        description="Disclaimer for dataengineerhub.blog. Information is for educational purposes only, AI-assisted content is reviewed by a human author, opinions are personal, and external links and affiliate relationships are disclosed."
        keywords="disclaimer, affiliate disclosure, AI content disclosure, professional advice, information accuracy"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Disclaimer
        </h1>

        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last Updated: May 9, 2026</p>

          <h2 className="text-xl font-bold text-white mt-8">General Information</h2>
          <p>
            The information provided by dataengineerhub.blog ("we," "us," or "our") on this website (the "Site") is for
            general informational and educational purposes only. All information is provided in good faith; however,
            we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy,
            validity, reliability, availability, or completeness of any information on the Site.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Not Professional Advice</h2>
          <p>
            The Site is not a substitute for professional advice. The data engineering field is constantly evolving and
            cloud-vendor pricing, APIs, and best practices change frequently. What works in one scenario may not work
            in another. Always seek the advice of a qualified professional, your cloud account manager, or your
            employer's architecture team with any questions you may have regarding a specific data engineering problem,
            cost decision, security configuration, or career choice. Reliance on any information provided by this Site
            is solely at your own risk.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">AI-Assisted Content Disclosure</h2>
          <p>
            Some articles, code samples, and reference content on this Site are drafted with the help of AI tools
            (including large language models) and are then reviewed, edited, fact-checked, and signed off by a human
            author — Sainath Reddy — before publication. We do not publish AI-generated content unsupervised. Where AI
            assistance was used, the final article still reflects the author's professional judgement, real-world
            experience, and editorial voice.
          </p>
          <p>
            Despite this human review, AI-assisted drafts can occasionally contain inaccuracies, outdated information,
            or "hallucinated" details that look plausible but are wrong. If you spot an error in any article, please{' '}
            <a className="text-blue-400 underline" href="/contact">contact us</a> — we appreciate corrections and will
            update the article promptly.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Views Are Personal</h2>
          <p>
            All views, opinions, technology preferences, and recommendations expressed on this Site are personal to the
            author(s). They do not represent the views, recommendations, or official positions of any current or
            former employer, client, partner, vendor, or affiliated organization. Code samples, architecture diagrams,
            and benchmarks are not derived from any employer's confidential data or proprietary systems.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">External Links Disclaimer</h2>
          <p>
            The Site may contain links to other websites, products, services, or content belonging to or originating
            from third parties — including documentation pages, vendor blogs, GitHub repositories, advertisements
            served by Google AdSense, and links inside banners. Such external links are not investigated, monitored,
            or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us. We do not
            warrant, endorse, or assume responsibility for any third-party content. Visiting any external link is at
            your own risk and subject to that site's own terms and privacy policy.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Advertising Disclosure</h2>
          <p>
            This Site displays advertising served by Google AdSense and may, in the future, display ads from other
            networks. Ads are clearly distinguishable from editorial content and we do not control which specific
            advertisements are displayed on any given visit. The presence of an ad on the Site does not imply
            endorsement of the advertised product or service.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Affiliate Disclaimer</h2>
          <p>
            This Site may contain affiliate links. If you click through and make a purchase, we may receive an
            affiliate commission at no additional cost to you. We currently participate in the Udemy affiliate program
            and may join others over time. Affiliate commissions help support the ongoing creation of free educational
            content. We only recommend courses, books, and tools we believe provide genuine value to data engineering
            professionals; we have not been paid to write favourable reviews.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Earnings and Results Disclaimer</h2>
          <p>
            Any career-related, salary-related, or revenue-related figures mentioned on the Site (for example, in
            articles about data-engineer compensation, AdSense earnings, or interview outcomes) are illustrative
            examples drawn from publicly reported data, surveys, or the author's personal experience. Your individual
            results will vary based on geography, experience, employer, market conditions, and many other factors. No
            specific outcome is guaranteed.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Errors and Omissions</h2>
          <p>
            While we have made every reasonable attempt to ensure that the information contained in this Site is
            accurate and current, we are not responsible for any errors or omissions or for the results obtained from
            the use of this information. All information is provided "as is" with no guarantee of completeness,
            accuracy, timeliness, or of the results obtained from the use of this information.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Contact</h2>
          <p>
            Questions, corrections, or takedown requests:{' '}
            <a className="text-blue-400 underline" href="mailto:sainath@dataengineerhub.blog">sainath@dataengineerhub.blog</a>{' '}
            or via the <a className="text-blue-400 underline" href="/contact">contact page</a>.
          </p>
        </div>
      </div>
    </>
  );
};

export default DisclaimerPage;
