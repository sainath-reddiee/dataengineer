import React from 'react';
import MetaTags from '@/components/SEO/MetaTags';

const PrivacyPolicyPage = () => {
  return (
    <>
      <MetaTags
        title="Privacy Policy | DataEngineer Hub - How We Protect Your Data"
        description="Read DataEngineer Hub's privacy policy to understand how we collect, use, and protect your personal information. Learn about our data practices, cookies, and your privacy rights."
        keywords="privacy policy, data protection, user privacy, cookies policy, GDPR, data security"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Privacy Policy - DataEngineer Hub
        </h1>
        
        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last Updated: September 24, 2025</p>

          <p>
            Welcome to DataEngineer Hub ("we," "us," or "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">1. WHAT INFORMATION DO WE COLLECT?</h2>
          <p>
            <strong>Personal information you disclose to us:</strong> We collect personal information that you voluntarily provide to us when you subscribe to our newsletter, contact us, or comment on our articles. This information may include your name and email address.
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
          
          <h2 className="text-xl font-bold text-white mt-8">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
          <p>
            We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">5. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
          <p>
            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">6. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
          <p>
            In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Advertising Privacy Statement (Ezoic Services)</h2>
          <div className="p-4 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-bold text-white">Ezoic Services</h3>
            <p>This website uses the services of Ezoic Inc. ("Ezoic"), including to manage third-party interest-based advertising. Ezoic may employ a variety of technologies on this website, including tools to serve content, display advertisements and enable advertising to visitors of this website, which may utilize first and third-party cookies.</p>
            <p>A cookie is a small text file sent to your device by a web server that enables the website to remember information about your browsing activity. First-party cookies are created by the site you are visiting, while third-party cookies are set by domains other than the one you're visiting. Ezoic and our partners may place third-party cookies, tags, beacons, pixels, and similar technologies to monitor interactions with advertisements and optimize ad targeting. Please note that disabling cookies may limit access to certain content and features on the website, and rejecting cookies does not eliminate advertisements but will result in non-personalized advertising. You can find more information about cookies and how to manage them <a href="https://allaboutcookies.org/" target="_blank" rel="noopener noreferrer">here</a>.</p>
            <p>The following information may be collected, used, and stored in a cookie when serving personalized ads:</p>
            <ul className="list-disc pl-5">
              <li>IP address</li>
              <li>Operating system type and version</li>
              <li>Device type</li>
              <li>Language preferences</li>
              <li>Web browser type</li>
              <li>Email (in a hashed or encrypted form)</li>
            </ul>
            <p>Ezoic and its partners may use this data in combination with information that has been independently collected to deliver targeted advertisements across various platforms and websites. Ezoic's partners may also gather additional data, such as unique IDs, advertising IDs, geolocation data, usage data, device information, traffic data, referral sources, and interactions between users and websites or advertisements, to create audience segments for targeted advertising across different devices, browsers, and apps. You can find more information about interest-based advertising and how to manage them <a href="https://youradchoices.com/" target="_blank" rel="noopener noreferrer">here</a>.</p>
            <p>You can view Ezoic's privacy policy <a href="https://www.ezoic.com/privacy-policy/" target="_blank" rel="noopener noreferrer">here</a>, or for additional information about Ezoic's advertising and other partners, you can view Ezoic's advertising partners <a href="https://www.ezoic.com/privacy-policy/advertising-partners/" target="_blank" rel="noopener noreferrer">here</a>.</p>
            <span id="ezoic-privacy-policy-embed"></span>
          </div>

          <h2 className="text-xl font-bold text-white mt-8">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
          <p>
            If you have questions or comments about this notice, you may contact us through the contact form on our website.
          </p>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;