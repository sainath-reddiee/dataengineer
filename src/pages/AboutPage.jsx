// src/pages/AboutPage.jsx - ENHANCED WITH BETTER BLOCK SIZES
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Heart, Code, Database, Cloud, Briefcase, Award, BookOpen, Sparkles, Zap } from 'lucide-react';
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
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-6 py-2 rounded-full mb-6 border border-blue-500/30">
              <Sparkles className="h-5 w-5 text-blue-400" />
              <span className="text-blue-300 font-medium">Data Engineering Expert</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Hi, I'm <span className="gradient-text">Sainath Reddy</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              Data Engineer at <span className="text-blue-400 font-bold">Anblicks</span>
            </p>
            
            <p className="text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto">
              Transforming raw data into business intelligence through modern data engineering. 
              Specializing in cloud-native architectures, real-time pipelines, and scalable data solutions.
            </p>
          </motion.div>

          {/* Stats Cards - Compact */}
          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="blog-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
            >
              <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-3">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">4+ Years</div>
              <p className="text-sm text-gray-400">Experience</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="blog-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
            >
              <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg mb-3">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">10+ Tools</div>
              <p className="text-sm text-gray-400">Technologies</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="blog-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
            >
              <div className="inline-flex p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg mb-3">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">3 Clouds</div>
              <p className="text-sm text-gray-400">AWS, Azure, GCP</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="blog-card p-4 rounded-xl text-center hover:scale-105 transition-transform"
            >
              <div className="inline-flex p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg mb-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">Real-time</div>
              <p className="text-sm text-gray-400">Data Pipelines</p>
            </motion.div>
          </div>

          {/* Mission & Who I Am - Compact */}
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="blog-card p-6 rounded-xl hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">My Mission</h2>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Empowering organizations with scalable data solutions that transform complex challenges 
                into actionable insights. Building the future of data-driven decision making.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="blog-card p-6 rounded-xl hover:border-green-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Who I Am</h2>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Passionate Data Engineer specializing in end-to-end architectures, ETL/ELT workflows, 
                and performance optimization across multiple cloud platforms at Anblicks.
              </p>
            </motion.div>
          </div>

          {/* Technical Stack - Compact Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-5xl mx-auto mb-12"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-5 py-2 rounded-full mb-3 border border-purple-500/30">
                <Code className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-200">Technical Arsenal</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Tech Stack</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="blog-card p-4 rounded-xl hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">☁️</span>
                  <h3 className="font-bold text-blue-400">Cloud Platforms</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium">AWS</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">Azure</span>
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">GCP</span>
                </div>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🗄️</span>
                  <h3 className="font-bold text-purple-400">Data Warehouses</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">Snowflake</span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium">Databricks</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">BigQuery</span>
                </div>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-teal-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚙️</span>
                  <h3 className="font-bold text-teal-400">ETL/ELT Tools</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-medium">Airflow</span>
                  <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-medium">dbt</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">Python</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">SQL</span>
                </div>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-cyan-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔧</span>
                  <h3 className="font-bold text-cyan-400">Specialized</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-medium">Salesforce DC</span>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-medium">Kafka</span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">Spark</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Core Skills - Compact 3-column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-5xl mx-auto mb-12"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-5 py-2 rounded-full mb-3 border border-green-500/30">
                <Award className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-200">Core Competencies</span>
              </div>
              <h2 className="text-3xl font-bold text-white">What I Do</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="blog-card p-4 rounded-xl hover:border-blue-500/50 transition-colors">
                <div className="text-3xl mb-2">🏗️</div>
                <h3 className="font-bold mb-2 text-white text-sm">Data Architecture</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  End-to-end scalable architectures for business growth
                </p>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-purple-500/50 transition-colors">
                <div className="text-3xl mb-2">🔄</div>
                <h3 className="font-bold mb-2 text-white text-sm">Pipeline Development</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Robust ETL/ELT with Airflow, dbt & Python
                </p>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-green-500/50 transition-colors">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold mb-2 text-white text-sm">Performance Tuning</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Query & warehouse optimization for efficiency
                </p>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-cyan-500/50 transition-colors">
                <div className="text-3xl mb-2">☁️</div>
                <h3 className="font-bold mb-2 text-white text-sm">Cloud Solutions</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Native data solutions across AWS, Azure, GCP
                </p>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-yellow-500/50 transition-colors">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold mb-2 text-white text-sm">Data Modeling</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Efficient schemas for analytics & reporting
                </p>
              </div>

              <div className="blog-card p-4 rounded-xl hover:border-red-500/50 transition-colors">
                <div className="text-3xl mb-2">🔐</div>
                <h3 className="font-bold mb-2 text-white text-sm">Data Governance</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Quality, security & compliance frameworks
                </p>
              </div>
            </div>
          </motion.div>

          {/* About DataEngineer Hub - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="blog-card p-6 rounded-xl text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 px-5 py-2 rounded-full mb-4 border border-pink-500/30">
                <BookOpen className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-medium text-pink-200">Knowledge Sharing</span>
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white">About DataEngineer Hub</h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-2xl mx-auto">
                My platform for sharing practical insights, tutorials, and best practices in modern data engineering. 
                Helping professionals master cutting-edge technologies and advance their careers.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Heart className="h-4 w-4 text-pink-400" />
                <span>Built with React • Vite • TailwindCSS • Framer Motion</span>
              </div>
            </div>
          </motion.div>

          {/* Philosophy Quote - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <div className="blog-card p-6 rounded-xl text-center bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-500/30">
              <div className="text-4xl mb-3">💡</div>
              <h2 className="text-xl font-bold mb-3 text-white">My Philosophy</h2>
              <p className="text-base text-gray-300 italic leading-relaxed mb-3">
                "Data engineering isn't just moving data—it's transforming information into insights that drive value. 
                Every pipeline reliable, every query optimized, every solution scalable."
              </p>
              <div className="text-blue-400 font-semibold">— Sainath Reddy</div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
