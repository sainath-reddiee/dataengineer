// src/pages/DisclaimerPage.jsx
import React from 'react';
import MetaTags from '@/components/SEO/MetaTags';

const DisclaimerPage = () => {
  return (
    <>
      <MetaTags
        title="Disclaimer | DataEngineer Hub - Information and Advice"
        description="Read the disclaimer for DataEngineer Hub. The content on this site is for informational and educational purposes only and does not constitute professional advice."
        keywords="disclaimer, affiliate disclosure, professional advice, information accuracy"
      />
      <div className="container mx-auto px-6 max-w-4xl py-12">
        <h1 className="text-3xl md:text-4xl font-black mb-6 leading-tight gradient-text">
          Disclaimer
        </h1>

        <div className="prose prose-invert max-w-none text-gray-300">
          <p className="text-gray-400">Last Updated: October 6, 2025</p>

          <h2 className="text-xl font-bold text-white mt-8">General Information</h2>
          <p>
            The information provided by DataEngineer Hub ("we," "us," or "our") on dataengineerhub.blog (the "Site") is for general informational and educational purposes only. All information on the Site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Not Professional Advice</h2>
          <p>
            The information on the Site is not intended to be a substitute for professional advice. The data engineering field is constantly evolving, and what works in one scenario may not work in another. Always seek the advice of a qualified professional with any questions you may have regarding a specific data engineering problem or your career. Reliance on any information provided by this Site is solely at your own risk.
          </p>

          <h2 className="text-xl font-bold text-white mt-8">External Links Disclaimer</h2>
          <p>
            The Site may contain (or you may be sent through the Site) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8">Affiliate Disclaimer</h2>
          <p>
            This Site may contain links to affiliate websites, and we receive an affiliate commission for any purchases made by you on the affiliate website using such links. Our affiliates include [List any affiliate programs you are a part of, e.g., Amazon Associates, etc.].
          </p>

          <h2 className="text-xl font-bold text-white mt-8">Errors and Omissions Disclaimer</h2>
          <p>
            While we have made every attempt to ensure that the information contained in this site has been obtained from reliable sources, DataEngineer Hub is not responsible for any errors or omissions or for the results obtained from the use of this information.
          </p>
        </div>
      </div>
    </>
  );
};

export default DisclaimerPage;
