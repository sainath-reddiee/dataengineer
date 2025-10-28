// src/pages/AboutPage.jsx - ULTRA-COMPACT & SPACE-EFFICIENT
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Heart, Code, Database, Cloud, Briefcase, Award, BookOpen, Sparkles, Zap, ArrowRight } from 'lucide-react';
import MetaTags from '@/components/SEO/MetaTags';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  return (
    <>
      <MetaTags 
        title="About Sainath Reddy - Expert Data Engineer"
        description="Meet Sainath Reddy, a passionate Data Engineer at Anblicks with 4+ years of experience in Snowflake, AWS, Azure, Databricks, Salesforce Data Cloud, and modern data engineering technologies."
        keywords="sainath reddy, data engineer, anblicks, snowflake expert, databricks expert, aws data engineer, azure data engineer, salesforce data cloud"
        type="website"
      />
      <div className="pt-4 pb-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          
          {/* ============================================================================
              HERO SECTION - ULTRA COMPACT
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6 sm:mb-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-1.5 rounded-full mb-3 border border-blue-500/30">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-xs sm:text-sm font-medium text-blue-300">Data Engineering Expert</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 leading-tight">
              Hi, I'm <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Sainath Reddy</span>
            </h1>
            
            {/* Subtitle - Compact */}
            <p className="text-sm sm:text-base text-gray-300 mb-2">
              Data Engineer at <span className="text-blue-400 font-bold">Anblicks</span>
            </p>
            
            {/* Description - Shorter */}
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Transforming raw data into business intelligence through modern engineering. 
              Cloud-native architectures • Real-time pipelines • Scalable solutions.
            </p>
          </motion.div>

          {/* ============================================================================
              STATS SECTION - INLINE COMPACT (2x2 GRID MOBILE, 4 COLS DESKTOP)
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
          >
            {[
              { icon: Briefcase, value: '4+', label: 'Years', color: 'from-blue-500 to-purple-600' },
              { icon: Database, value: '10+', label: 'Tools', color: 'from-green-500 to-teal-500' },
              { icon: Cloud, value: '3', label: 'Clouds', color: 'from-orange-500 to-red-500' },
              { icon: Zap, value: 'Real-time', label: 'Pipelines', color: 'from-pink-500 to-rose-500' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 hover:from-slate-800 hover:to-slate-700 border border-slate-700/40 hover:border-slate-600/60 rounded-lg p-3 sm:p-4 text-center transition-all"
              >
                <div className={`inline-flex p-2 bg-gradient-to-br ${stat.color} rounded-lg mb-2`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-white">{stat.value}</div>
                <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ============================================================================
              MISSION & WHO I AM - COMPACT 2-COL
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="grid md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            {/* Mission */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4 hover:border-blue-500/50 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">My Mission</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Empowering organizations with scalable data solutions that transform challenges into actionable insights.
              </p>
            </div>

            {/* Who I Am */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4 hover:border-green-500/50 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">Who I Am</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Passionate Data Engineer specializing in architectures, ETL/ELT workflows, and optimization across clouds.
              </p>
            </div>
          </motion.div>

          {/* ============================================================================
              TECH STACK - 2 COLUMNS COMPACT
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Code className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Tech Stack</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {/* Cloud Platforms */}
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">☁️</span>
                  <h3 className="font-bold text-sm text-blue-400">Cloud Platforms</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['AWS', 'Azure', 'GCP'].map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Warehouses */}
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🗄️</span>
                  <h3 className="font-bold text-sm text-purple-400">Data Warehouses</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Snowflake', 'Databricks', 'BigQuery'].map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* ETL/ELT */}
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚙️</span>
                  <h3 className="font-bold text-sm text-teal-400">ETL/ELT Tools</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Airflow', 'dbt', 'Python', 'SQL'].map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-teal-500/20 text-teal-300 rounded text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialized */}
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🔧</span>
                  <h3 className="font-bold text-sm text-cyan-400">Specialized</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Salesforce DC', 'Kafka', 'Spark'].map(tech => (
                    <span key={tech} className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ============================================================================
              CORE SKILLS - COMPACT 3-COLUMN GRID
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex items-center gap-2 mb-4 justify-center">
              <Award className="h-5 w-5 text-green-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Core Skills</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {[
                { emoji: '🏗️', title: 'Data Architecture', desc: 'Scalable end-to-end systems' },
                { emoji: '🔄', title: 'Pipeline Dev', desc: 'ETL/ELT with Airflow & dbt' },
                { emoji: '⚡', title: 'Performance', desc: 'Query & warehouse tuning' },
                { emoji: '☁️', title: 'Cloud Solutions', desc: 'Multi-cloud data systems' },
                { emoji: '📊', title: 'Data Modeling', desc: 'Efficient analytics schemas' },
                { emoji: '🔐', title: 'Governance', desc: 'Quality, security, compliance' },
              ].map((skill, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-3 hover:border-blue-500/50 transition-colors"
                >
                  <div className="text-2xl mb-1.5">{skill.emoji}</div>
                  <h3 className="font-bold text-xs sm:text-sm text-white leading-tight mb-0.5">{skill.title}</h3>
                  <p className="text-xs text-gray-400">{skill.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ============================================================================
              ABOUT THE HUB - COMPACT CARD
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-br from-slate-800/60 to-slate-700/60 border border-slate-700/40 rounded-lg p-4 sm:p-5 text-center mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 px-3 py-1.5 rounded-full mb-3 border border-pink-500/30">
              <BookOpen className="h-4 w-4 text-pink-400" />
              <span className="text-xs font-medium text-pink-300">Knowledge Sharing</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2 text-white">DataEngineer Hub</h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-3 max-w-2xl mx-auto">
              My platform for sharing practical tutorials, insights, and best practices in modern data engineering. 
              Helping professionals master cutting-edge technologies.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Heart className="h-3.5 w-3.5 text-pink-400" />
              <span>Built with React • Vite • TailwindCSS • Framer Motion</span>
            </div>
          </motion.div>

          {/* ============================================================================
              PHILOSOPHY QUOTE - COMPACT
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-2 border-blue-500/30 rounded-lg p-4 sm:p-5 text-center mb-6"
          >
            <div className="text-3xl mb-2">💡</div>
            <h3 className="text-base sm:text-lg font-bold mb-2 text-white">My Philosophy</h3>
            <p className="text-sm text-gray-300 italic leading-relaxed mb-2">
              "Data engineering isn't just moving data—it's transforming information into insights that drive value."
            </p>
            <div className="text-blue-400 font-semibold text-sm">— Sainath Reddy</div>
          </motion.div>

          {/* ============================================================================
              CTA SECTION - CONNECT
              ============================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-center"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-white">Let's Connect</h2>
            <p className="text-sm text-gray-300 mb-4">
              Interested in data engineering or collaboration opportunities?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold">
                <a href="mailto:sainath@example.com">
                  Get in Touch
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="border-2 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 font-semibold">
                <a href="/articles">Read My Articles</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
