import React from 'react';
import MetaTags from '@/components/SEO/MetaTags';

const Certification = () => {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <MetaTags
        title="Snowflake Certification Prep Tool - DataEngineer Hub"
        description="Prepare for Snowflake certifications with our interactive practice tool. Covers SnowPro Core, Advanced, and Specialty exams with real-world scenarios."
        noindex={true}
      />

      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Snowflake Certification Prep
        </h1>
        <p className="text-gray-300 text-lg mb-6 max-w-3xl leading-relaxed">
          Use this interactive tool to prepare for Snowflake certifications including SnowPro Core,
          SnowPro Advanced: Data Engineer, and SnowPro Specialty: Generative AI. Practice with
          real-world scenarios, test your knowledge, and track your readiness before sitting the exam.
        </p>
      </div>

      <div className="flex-grow w-full relative" style={{ minHeight: '70vh' }}>
        <iframe
          src="https://snowcert.streamlit.app/?embed=true"
          title="Snowflake Certification Prep"
          width="100%"
          height="100%"
          style={{ border: 'none', minHeight: '70vh' }}
          allow="camera; microphone; clipboard-read; clipboard-write;"
        />
      </div>
    </div>
  );
};

export default Certification;
