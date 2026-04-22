import React from 'react';
import { motion } from 'framer-motion';
import { Mail, BookOpen, Zap, Shield, Rss } from 'lucide-react';
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
      <div className="pt-8 pb-12">
        {/* Intro section — gives the page real content depth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto px-4 mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
            The Weekly Data Engineering Digest
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed mb-6 text-center max-w-2xl mx-auto">
            Stay current with the tools, techniques, and platforms that matter most in
            modern data engineering. Every week we distil what's new across Snowflake,
            Databricks, BigQuery, dbt, Airflow, and SQL into one concise email — so you
            can spend less time browsing and more time building.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              {
                icon: BookOpen,
                title: 'In-depth tutorials',
                text: 'Step-by-step guides on cost optimization, warehouse tuning, pipeline design, and query performance across cloud platforms.',
              },
              {
                icon: Zap,
                title: 'Tool deep-dives',
                text: 'Hands-on walkthroughs of our free calculators, SQL playground, cron builder, format converter, and new releases.',
              },
              {
                icon: Mail,
                title: 'Weekly cadence',
                text: 'One email per week — no daily noise, no promotional fluff. Unsubscribe any time with a single click.',
              },
              {
                icon: Shield,
                title: 'Privacy first',
                text: 'We never share your address. No tracking pixels, no third-party ad lists. Just content.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />
                    <h2 className="text-white font-semibold text-sm">{item.title}</h2>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>

          <p className="text-gray-400 text-sm text-center">
            Prefer RSS?{' '}
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <Rss className="w-3.5 h-3.5" aria-hidden="true" />
              Grab the feed
            </a>
          </p>
        </motion.div>

        {/* Signup widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <Newsletter />
        </motion.div>
      </div>
    </>
  );
};

export default NewsletterPage;