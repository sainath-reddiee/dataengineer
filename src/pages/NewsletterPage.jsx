import React from 'react';
import { motion } from 'framer-motion';
import Newsletter from '@/components/Newsletter';
import MetaTags from '@/components/SEO/MetaTags';

const NewsletterPage = () => {
  return (
    <>
      <MetaTags 
        title="Weekly Data Digest - Subscribe to DataEngineer Hub"
        description="Subscribe to the DataEngineer Hub weekly digest. Get tutorials, tool deep-dives, and data engineering insights on Snowflake, dbt, Airflow, and the modern data stack delivered to your inbox."
        keywords="data engineering newsletter, weekly digest, Snowflake tutorials, dbt guides, data engineering updates"
      />
      <div className="pt-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Newsletter />
        </motion.div>
      </div>
    </>
  );
};

export default NewsletterPage;