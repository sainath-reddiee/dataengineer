import React from 'react';
import MetaTags from '@/components/SEO/MetaTags';

const TermsOfServicePage = () => {
  return (
    <>
      <MetaTags
        title="Terms of Service - Website Usage Terms"
        description="Terms of service for dataengineerhub.blog. Understand your rights and responsibilities when using the site, accessing content, posting comments, and clicking external links."
        keywords="terms of service, terms and conditions, user agreement, website terms, legal terms"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last Updated: May 9, 2026</p>

          <h2 className="text-xl font-bold text-white mt-8">1. Agreement to Terms</h2>
          <p>
            These Terms of Service ("Terms") constitute a legally binding agreement between you and dataengineerhub.blog
            (the "Site," "we," "us," or "our") governing your access to and use of the website at
            https://dataengineerhub.blog and any related content, tools, newsletters, or services (collectively, the
            "Services"). By accessing or using the Services you agree to be bound by these Terms. If you do not agree,
            do not use the Services.
          </p>
          <p>
            We may update these Terms from time to time. The "Last Updated" date above reflects the most recent change.
            Continued use of the Site after an update constitutes acceptance of the revised Terms. Material changes
            will be reasonably highlighted on the Site.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use the Services. If you are between 13 and the age of legal majority
            in your jurisdiction, you may use the Services only with the involvement of a parent or legal guardian who
            agrees to these Terms on your behalf. The Services are not directed to children under 13, and we do not
            knowingly collect personal information from children under 13.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">3. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, all content on the Site — including articles, tutorials, code samples, images,
            logos, illustrations, designs, and the underlying software — is owned by us or licensed to us and is
            protected by copyright, trademark, and other intellectual property laws. You may view, download, and print
            content for your own personal, non-commercial use, provided you retain all copyright and proprietary
            notices.
          </p>
          <p>
            Code samples published on the Site are made available under the MIT License unless explicitly stated
            otherwise within the article. You may copy, modify, and use such code in your own projects without
            attribution; however, the prose, screenshots, and surrounding tutorial content are not licensed for
            redistribution without prior written consent. Republishing entire articles, in whole or substantial part,
            is not permitted.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">4. User Representations</h2>
          <p>By using the Services you represent and warrant that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You have the legal capacity and you agree to comply with these Terms.</li>
            <li>You will not access the Services through automated or non-human means (bot, scraper, crawler) other
            than well-behaved search-engine indexing.</li>
            <li>You will not use the Services for any illegal or unauthorized purpose.</li>
            <li>Your use of the Services will not violate any applicable law or regulation.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-8">5. Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Systematically retrieve or scrape data from the Site to create or compile a collection or database
            without our written permission.</li>
            <li>Interfere with, disrupt, or create an undue burden on the Services or networks connected to them.</li>
            <li>Attempt to bypass any security measures, paywalls, or rate limits.</li>
            <li>Upload or transmit viruses, malware, or any disruptive or destructive content via comments, contact
            forms, or any other input.</li>
            <li>Use the Services to harass, defame, impersonate, or harm any person.</li>
            <li>Reverse engineer or attempt to derive source code of any non-public portion of the Services.</li>
          </ul>

          <h2 className="text-xl font-bold text-white mt-8">6. User-Submitted Content</h2>
          <p>
            The Site may allow you to post comments, submit guest articles via the "Write for Us" page, or otherwise
            contribute content ("User Content"). You retain ownership of your User Content but grant us a worldwide,
            royalty-free, perpetual, non-exclusive license to use, reproduce, modify, publish, translate, and display
            it on the Site and in marketing materials related to the Site.
          </p>
          <p>
            You are solely responsible for your User Content. You represent that it is original, that you have the
            right to grant the license above, and that it does not infringe any third party's intellectual property,
            privacy, or other rights. We reserve the right (but have no obligation) to review, edit, or remove any User
            Content at our sole discretion, including comments that we deem off-topic, abusive, spammy, or in violation
            of these Terms.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">7. Third-Party Links and Services</h2>
          <p>
            The Site contains links to third-party websites, products, services, advertisements (including those served
            by Google AdSense), and resources that are not owned or controlled by us. We do not endorse and are not
            responsible for the content, privacy practices, or availability of any third-party site or service.
            Accessing third-party links is at your own risk and subject to the terms and privacy policies of those
            third parties.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">8. Affiliate and Advertising Disclosures</h2>
          <p>
            Some links on the Site are affiliate links. If you click through and make a purchase, we may earn a
            commission at no additional cost to you. The Site also displays advertisements served by Google AdSense and
            potentially other ad networks. Ads are clearly identifiable and we do not control which specific
            advertisements are displayed on any given visit. See our{' '}
            <a className="text-blue-400 underline" href="/disclaimer">Disclaimer</a> and{' '}
            <a className="text-blue-400 underline" href="/privacy-policy">Privacy Policy</a> for full details.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">9. Disclaimer of Warranties</h2>
          <p>
            THE SERVICES ARE PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMITTED BY LAW WE
            DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the Services will be uninterrupted,
            error-free, secure, or that any defects will be corrected. Tutorials and code samples are provided for
            educational purposes; you are responsible for testing and validating any code in your own environment
            before using it in production.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">10. Limitation of Liability</h2>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE
            LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR
            PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE
            OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. Our total cumulative
            liability for any claim arising out of or related to these Terms or the Services is limited to the amount
            you have paid us in the twelve months prior to the event giving rise to the claim, which for free-tier
            users is zero.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">11. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold us harmless from any claim, demand, loss, liability, or expense
            (including reasonable attorneys' fees) made by any third party arising out of: (a) your User Content;
            (b) your use of the Services; (c) your breach of these Terms; or (d) your violation of any law or the
            rights of any third party.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">12. Termination</h2>
          <p>
            We may, in our sole discretion and without notice, suspend or terminate your access to the Services if we
            believe you have violated these Terms, breached applicable law, or engaged in conduct harmful to other
            users or the Site. You may discontinue use of the Services at any time. Sections of these Terms that by
            their nature should survive termination (including IP rights, disclaimers, limitation of liability, and
            indemnification) will continue to apply.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">13. Modifications to the Services</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Services at any time without
            notice. We will not be liable to you or any third party for any modification, price change, suspension, or
            discontinuance of the Services.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">14. Governing Law and Jurisdiction</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of India, without regard to its
            conflict-of-law principles. Any dispute arising out of or related to these Terms or the Services will be
            subject to the exclusive jurisdiction of the courts located in Hyderabad, Telangana, India.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">15. Severability and Entire Agreement</h2>
          <p>
            If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force
            and effect. These Terms, together with our Privacy Policy and Disclaimer, constitute the entire agreement
            between you and us regarding the Services and supersede any prior agreements.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">16. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a className="text-blue-400 underline" href="mailto:sainath@dataengineerhub.blog">sainath@dataengineerhub.blog</a>{' '}
            or via the <a className="text-blue-400 underline" href="/contact">contact page</a>.
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;
