import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="relative pt-20 pb-16 overflow-hidden">
      {/* Optimized Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-20">
        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-sm border border-blue-500/40 rounded-full px-6 py-3 mb-4 shadow-lg">
              <Database className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-white">Latest in Data Engineering</span>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-6 leading-tight text-white"
          >
            Master the Art of{' '}
            <span className="gradient-text">Data Engineering</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Dive deep into AWS, Snowflake, Azure, SQL, Airflow, dbt and cutting-edge data technologies. 
            Transform your career with expert insights and hands-on tutorials.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
          >
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-bold text-lg pulse-glow group shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Link to="/articles">
                Explore Latest Posts
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-blue-400/60 text-blue-200 hover:bg-blue-500/30 hover:border-blue-400/80 px-8 py-4 rounded-full font-bold text-lg backdrop-blur-sm shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Link to="/newsletter">
                Join Newsletter
                <Sparkles className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {[
              { number: '50+', label: 'Expert Articles' },
              { number: '25.2K+', label: 'Monthly Readers' },
              { number: '8+', label: 'Technologies Covered' },
              { number: '98.7%', label: 'Success Rate' }
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-2xl font-bold gradient-text mb-2">{stat.number}</div>
                <div className="text-gray-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;