import React from 'react';
import MetaTags from '@/components/SEO/MetaTags';

const PrivacyPolicyPage = () => {
  return (
    <>
      <MetaTags
        title="Privacy Policy - How We Protect Your Data"
        description="Read DataEngineer Hub's privacy policy to understand how we collect, use, and protect your personal information. Learn about our data practices, cookies, and your privacy rights."
        keywords="privacy policy, data protection, user privacy, cookies policy, GDPR, data security"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Privacy Policy - DataEngineer Hub
        </h1>
        
        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last Updated: April 27, 2026</p>

          <p>
            Welcome to DataEngineer Hub ("we," "us," or "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">1. WHAT INFORMATION DO WE COLLECT?</h2>
          <p>
            <strong>Personal information you disclose to us:</strong> For the purpose of serving personalized advertisements, third-party vendors, including Google, may collect data such as your IP address, geolocation data, unique user IDs, and user behavior (such as your visits to this and other websites) to tailor advertisements to your interests.
          </p>
          <p>
            <strong>Information automatically collected:</strong> We automatically collect certain information when you visit, use or navigate the website. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, and other technical information.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">2. HOW DO WE USE YOUR INFORMATION?</h2>
          <p>
            We use personal information collected via our website for a variety of business purposes, including to send you marketing and promotional communications, to manage user accounts, and to deliver and facilitate delivery of services to the user.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">3. WILL YOUR INFORMATION BE SHARED WITH ANYONE?</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis: Consent, Legitimate Interests, Performance of a Contract, or Legal Obligations.
          </p>
          
          <h2 id="cookies" className="text-xl font-bold text-white mt-8">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
          <p>
            We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. The table and opt-out links in this section are our cookie policy. There is no separate cookie-policy page; <a href="/privacy-policy#cookies" className="text-blue-400 hover:text-blue-300 underline">/cookie-policy</a> redirects here.
          </p>
          <p>
            When you first visit our website, a cookie consent banner is displayed at the bottom of the page. We implement Google Consent Mode v2: by default, users in the EU, UK, and EEA have advertising, analytics, and personalization storage set to "denied" until consent is granted. Advertising scripts (such as Google AdSense) may still load to comply with Google's verification and delivery requirements, but will not store or read personalized advertising cookies until you accept cookies through the banner. If you decline, only essential cookies required for the website to function are used, and any ads served will be non-personalized. You can revoke your consent at any time via the "Manage Cookies" link in the footer.
          </p>

          <h3 className="text-lg font-semibold text-white mt-6">Cookies in use</h3>
          <p>
            The table below lists the cookies and similar storage mechanisms commonly set when you visit the Site.
            Specific cookie names from third parties (Google, Cloudflare) may change without notice; this list
            documents categories and typical examples.
          </p>
          <div className="overflow-x-auto my-4">
            <table className="min-w-full text-sm border border-slate-700">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left border border-slate-700">Name / Pattern</th>
                  <th className="px-3 py-2 text-left border border-slate-700">Provider</th>
                  <th className="px-3 py-2 text-left border border-slate-700">Purpose</th>
                  <th className="px-3 py-2 text-left border border-slate-700">Type</th>
                  <th className="px-3 py-2 text-left border border-slate-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-slate-700"><code>cookie_consent</code></td>
                  <td className="px-3 py-2 border border-slate-700">dataengineerhub.blog</td>
                  <td className="px-3 py-2 border border-slate-700">Stores your cookie-consent choice (accept / deny) so the banner does not reappear.</td>
                  <td className="px-3 py-2 border border-slate-700">Strictly necessary</td>
                  <td className="px-3 py-2 border border-slate-700">12 months</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-slate-700"><code>theme</code>, <code>seo_admin_*</code></td>
                  <td className="px-3 py-2 border border-slate-700">dataengineerhub.blog</td>
                  <td className="px-3 py-2 border border-slate-700">UI preferences and admin-area session (admin users only).</td>
                  <td className="px-3 py-2 border border-slate-700">Functional</td>
                  <td className="px-3 py-2 border border-slate-700">Session — 1 year</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-slate-700"><code>_ga</code>, <code>_ga_*</code>, <code>_gid</code></td>
                  <td className="px-3 py-2 border border-slate-700">Google Analytics 4</td>
                  <td className="px-3 py-2 border border-slate-700">Distinguish unique users, count visits, and measure aggregate traffic patterns. Loaded only when you grant analytics consent.</td>
                  <td className="px-3 py-2 border border-slate-700">Analytics</td>
                  <td className="px-3 py-2 border border-slate-700">Up to 2 years</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-slate-700"><code>__gads</code>, <code>__gpi</code>, <code>IDE</code>, <code>NID</code>, DART cookie</td>
                  <td className="px-3 py-2 border border-slate-700">Google AdSense / DoubleClick</td>
                  <td className="px-3 py-2 border border-slate-700">Ad delivery, frequency capping, and (when consented) interest-based advertising.</td>
                  <td className="px-3 py-2 border border-slate-700">Advertising</td>
                  <td className="px-3 py-2 border border-slate-700">Up to 13 months</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border border-slate-700"><code>__cf_bm</code></td>
                  <td className="px-3 py-2 border border-slate-700">Cloudflare</td>
                  <td className="px-3 py-2 border border-slate-700">Bot management and DDoS protection; helps distinguish humans from bots.</td>
                  <td className="px-3 py-2 border border-slate-700">Strictly necessary</td>
                  <td className="px-3 py-2 border border-slate-700">30 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-white mt-6">Google Analytics</h3>
          <p>
            We use Google Analytics 4 to understand aggregate site traffic and reading patterns (which articles are
            popular, average time on page, country-level visitor counts). Analytics data is anonymized — IP
            anonymization is enabled and we do not collect personally identifiable information through Analytics. The
            Analytics script only loads after you grant "analytics_storage" consent via our cookie banner. You can opt
            out at any time using the official{' '}
            <a className="text-blue-400 underline" href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out browser add-on</a>{' '}
            or by clearing cookies and choosing "Decline" when the banner reappears.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">5. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">6. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
          <p>
            In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.
          </p>
          <h2 className="text-xl font-bold text-white mt-8">7. DO NOT SELL MY PERSONAL INFORMATION (CCPA)</h2>
<p>
  If you are a California resident, you have the right to opt-out of the "sale" of your personal information. DataEngineer Hub does not directly sell your personal information in the conventional sense. However, the use of advertising cookies may be considered a "sale" under the CCPA. You can exercise your right to opt-out by using the opt-out links provided in the "Google AdSense" section of this policy.
</p>
          {/* ── Google AdSense Disclosure — Required by AdSense Program Policies ── */}
          <div className="mt-8 p-5 rounded-xl border-2 border-blue-500/40 bg-blue-500/10">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
              Google AdSense &amp; Third-Party Advertising Disclosure
            </h2>
            <p className="mb-3">
              <strong className="text-white">We use Google AdSense</strong> to display advertisements on this website.
              Google AdSense is an advertising service provided by Google LLC. Third-party vendors, including Google,
              use cookies to serve ads based on your prior visits to this website or other websites on the Internet.
            </p>
            <p className="mb-3">
              <strong className="text-white">DoubleClick DART Cookie:</strong> Google's use of the DoubleClick DART
              cookie enables it and its partners to serve ads to users based on their visit to this site and/or other
              sites on the Internet. The DART cookie is used for interest-based (personalized) advertising.
            </p>
            <p className="mb-3">
              <strong className="text-white">What data is collected:</strong> Google AdSense may collect your IP
              address, browser type, pages visited, time spent on pages, and other usage data to serve relevant
              advertisements. This data is processed by Google in accordance with their privacy policy.
            </p>
            <p className="mb-3">
              <strong className="text-white">Non-personalized ads:</strong> If you decline cookies via our consent
              banner (or are located in the EU/UK/EEA), only non-personalized ads will be served. Non-personalized
              ads do not use cookies for ad targeting.
            </p>
            <h3 className="text-base font-semibold text-white mt-4 mb-2">Opt-Out of Personalized Advertising</h3>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>
                <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium">
                  Google Ads Settings
                </a>{' '}— Control Google's interest-based ads
              </li>
              <li>
                <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium">
                  www.aboutads.info/choices
                </a>{' '}— Digital Advertising Alliance opt-out (all participating vendors)
              </li>
              <li>
                <a href="http://www.youronlinechoices.eu/" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium">
                  www.youronlinechoices.eu
                </a>{' '}— European Interactive Digital Advertising Alliance (EU users)
              </li>
              <li>
                <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline font-medium">
                  optout.networkadvertising.org
                </a>{' '}— Network Advertising Initiative opt-out
              </li>
            </ul>
            <p className="text-sm text-gray-400">
              For more information about how Google uses data when you use their partners' sites or apps, visit{' '}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline">
                Google's Privacy &amp; Terms
              </a>.
            </p>
          </div>

<p className="mt-4">
  For more information about Google's privacy practices, please visit the{' '}
  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
    Google Privacy Policy
  </a>.
</p>
<h2 className="text-xl font-bold text-white mt-8">8. CHILDREN'S INFORMATION</h2>
<p>
  Our Site is not intended for use by children under the age of 13, and we do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information from our files as soon as possible.
</p>
          <h2 className="text-xl font-bold text-white mt-8">9. UPDATES TO THIS NOTICE</h2>
<p>
  We may update this privacy notice from time to time. The updated version will be indicated by an updated "Last Updated" date and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
</p>
          <h2 className="text-xl font-bold text-white mt-8">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
          <p>
            If you have questions or comments about this notice, you may email us at <a href="mailto:sainath@dataengineerhub.blog" className="text-blue-400 hover:text-blue-300 underline">sainath@dataengineerhub.blog</a> or use the contact form on our website.
          </p>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
