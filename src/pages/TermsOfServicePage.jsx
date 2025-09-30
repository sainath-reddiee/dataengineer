import React from 'react';
import MetaTags from '@/components/SEO/MetaTags';

const TermsOfServicePage = () => {
  return (
    <>
      <MetaTags
        title="Terms of Service | DataEngineer Hub - Website Usage Terms"
        description="Review the terms of service for DataEngineer Hub. Understand your rights and responsibilities when using our website, accessing content, and engaging with our data engineering resources."
        keywords="terms of service, terms and conditions, user agreement, website terms, legal terms"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Terms of Service - DataEngineer Hub
        </h1>

        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last Updated: September 24, 2025</p>

          <h2 className="text-xl font-bold text-white mt-8">1. AGREEMENT TO TERMS</h2>
          <p>
            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and DataEngineer Hub ("we," "us," or "our"), concerning your access to and use of the dataengineerhub.blog website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site"). You agree that by accessing the Site, you have read, understood, and agreed to be bound by all of these Terms of Service. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND YOU MUST DISCONTINUE USE IMMEDIATELY.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">2. INTELLECTUAL PROPERTY RIGHTS</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">3. USER REPRESENTATIONS</h2>
          <p>
            By using the Site, you represent and warrant that: (1) you have the legal capacity and you agree to comply with these Terms of Service; (2) you will not access the Site through automated or non-human means, whether through a bot, script or otherwise; (3) you will not use the Site for any illegal or unauthorized purpose; and (4) your use of the Site will not violate any applicable law or regulation.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">4. PROHIBITED ACTIVITIES</h2>
          <p>
            You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">5. GOVERNING LAW</h2>
          <p>
            These Terms shall be governed by and defined following the laws of [Your Country/State]. DataEngineer Hub and yourself irrevocably consent that the courts of [Your City, Country/State] shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">6. DISCLAIMER</h2>
          <p>
            THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">7. CONTACT US</h2>
          <p>
            In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us using the contact form available on our website.
          </p>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;