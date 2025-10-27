// src/pages/AboutPage.jsx
// FIXED: Single H1, optimized title and description
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Heart, Code, Database, Cloud, Briefcase, Award, BookOpen } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';

const AboutPage = () => {
  return (
    <>
      <MetaTags 
        title="About Sainath Reddy - Expert Data Engineer"
        description="Meet Sainath Reddy, a passionate Data Engineer at Anblicks with 4+ years of experience in Snowflake, AWS, Azure, Databricks, Salesforce Data Cloud, and modern data engineering technologies."
        keywords="sainath reddy, data engineer, anblicks, snowflake expert, databricks expert, aws data engineer, azure data engineer, salesforce data cloud"
        type="website"
      />
      <div className="pt-4 pb-12 overflow-hidden">
        <div className="container mx-auto px-6">
          {/* FIXED: Single H1 tag for entire page */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              About <span className="gradient-text">Sainath Reddy</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
              Passionate Data Engineer crafting scalable data solutions at <span className="text-blue-400 font-semibold">Anblicks</span>
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              Specializing in Snowflake, AWS, Azure, Databricks, DBT, GCP, and Salesforce Data Cloud with 4+ years of hands-on experience building robust data pipelines and architectures.
            </p>
          </motion.div>

          {/* Professional Highlights */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-16 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="blog-card p-6 rounded-2xl text-center"
            >
              <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-4">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">4+ Years</div>
              <p className="text-gray-400">Data Engineering Experience</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="blog-card p-6 rounded-2xl text-center"
            >
              <div className="inline-flex p-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl mb-4">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">8+ Tools</div>
              <p className="text-gray-400">Modern Data Technologies</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="blog-card p-6 rounded-2xl text-center"
            >
              <div className="inline-flex p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl mb-4">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">3 Clouds</div>
              <p className="text-gray-400">AWS, Azure & GCP</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="blog-card p-8 rounded-2xl"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold">My Mission</div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                To empower organizations and data professionals by sharing practical knowledge and real-world experience in modern data engineering. I believe in transforming complex data challenges into elegant, scalable solutions that drive business value.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="blog-card p-8 rounded-2xl"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold">Who I Am</div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                I'm a Data Engineer at Anblicks with deep expertise in building end-to-end data architectures, implementing ETL/ELT workflows, and optimizing data warehouses for performance and cost efficiency across multiple cloud platforms.
              </p>
            </motion.div>
          </div>

          {/* Technical Expertise */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-5xl mx-auto mt-20"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-3 mb-4">
                <Code className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium text-purple-200">Technical Arsenal</span>
              </div>
              <div className="text-3xl font-bold mb-4">Technologies & Tools</div>
              <p className="text-lg text-gray-300">
                Expertise across modern data stack and cloud platforms
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="blog-card p-6 rounded-xl">
                <div className="text-xl font-bold mb-4 text-blue-400">☁️ Cloud Platforms</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">AWS</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Azure</span>
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">GCP</span>
                </div>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-xl font-bold mb-4 text-purple-400">🗄️ Data Warehouses</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Snowflake</span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Databricks</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">BigQuery</span>
                </div>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-xl font-bold mb-4 text-teal-400">⚙️ ETL/ELT Tools</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Apache Airflow</span>
                  <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">dbt</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Python</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">SQL</span>
                </div>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-xl font-bold mb-4 text-cyan-400">🔧 Specialized Platforms</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Salesforce Data Cloud</span>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">Kafka</span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Spark</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What I Do */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-5xl mx-auto mt-20"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-500/30 rounded-full px-6 py-3 mb-4">
                <Award className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-green-200">Core Competencies</span>
              </div>
              <div className="text-3xl font-bold mb-4">What I Do</div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="blog-card p-6 rounded-xl">
                <div className="text-4xl mb-4">🏗️</div>
                <div className="text-lg font-bold mb-2 text-white">Data Architecture</div>
                <p className="text-gray-400 text-sm">Designing scalable, end-to-end data architectures that support business growth and analytics needs.</p>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-4xl mb-4">🔄</div>
                <div className="text-lg font-bold mb-2 text-white">Pipeline Development</div>
                <p className="text-gray-400 text-sm">Building robust ETL/ELT pipelines using Airflow, dbt, and Python for data ingestion and transformation.</p>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-4xl mb-4">⚡</div>
                <div className="text-lg font-bold mb-2 text-white">Performance Optimization</div>
                <p className="text-gray-400 text-sm">Optimizing data warehouses and queries for maximum performance and cost efficiency.</p>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-4xl mb-4">☁️</div>
                <div className="text-lg font-bold mb-2 text-white">Cloud Data Solutions</div>
                <p className="text-gray-400 text-sm">Implementing cloud-native data solutions across AWS, Azure, and GCP platforms.</p>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-4xl mb-4">📊</div>
                <div className="text-lg font-bold mb-2 text-white">Data Modeling</div>
                <p className="text-gray-400 text-sm">Creating efficient data models and schemas that support analytics and reporting requirements.</p>
              </div>

              <div className="blog-card p-6 rounded-xl">
                <div className="text-4xl mb-4">🔐</div>
                <div className="text-lg font-bold mb-2 text-white">Data Governance</div>
                <p className="text-gray-400 text-sm">Implementing data quality, security, and governance frameworks for enterprise data platforms.</p>
              </div>
            </div>
          </motion.div>

          {/* DataEngineer Hub */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center max-w-4xl mx-auto mt-20"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 backdrop-blur-sm border border-pink-500/30 rounded-full px-6 py-3 mb-6">
              <BookOpen className="h-5 w-5 text-pink-400" />
              <span className="text-sm font-medium text-pink-200">Knowledge Sharing</span>
            </div>
            <div className="text-3xl font-bold mb-4">About DataEngineer Hub</div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              DataEngineer Hub is my platform for sharing practical insights, tutorials, and best practices in modern data engineering. Through hands-on examples and real-world scenarios, I aim to help data professionals master the latest technologies and advance their careers.
            </p>
            <div className="inline-flex items-center space-x-2 text-gray-400 text-sm">
              <Heart className="h-5 w-5 text-pink-400" />
              <span>Built with passion using React, Vite, TailwindCSS, and Framer Motion</span>
            </div>
          </motion.div>

          {/* Philosophy */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="max-w-4xl mx-auto mt-20 blog-card p-8 rounded-2xl"
          >
            <div className="text-center">
              <div className="text-5xl mb-6">💡</div>
              <div className="text-2xl font-bold mb-4 text-white">My Philosophy</div>
              <p className="text-xl text-gray-300 italic leading-relaxed">
                "Data engineering is not just about moving data—it's about transforming raw information into actionable insights that drive business value. Every pipeline should be reliable, every query should be optimized, and every solution should be built with scale in mind."
              </p>
              <div className="mt-6 text-blue-400 font-semibold">— Sainath Reddy</div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;