import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { revokeConsent } from './CookieConsent';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import {
  Database,
  Github,
  Linkedin,
  Mail,
  Heart
} from 'lucide-react';

const Footer = () => {

  const footerLinks = {
    content: [
      { name: 'Latest Articles', href: '/articles' },
      { name: 'AWS Tutorials', href: '/category/aws' },
      { name: 'Snowflake Guides', href: '/category/snowflake' },
      { name: 'Azure Resources', href: '/category/azure' },
      { name: 'SQL Tips', href: '/category/sql' },
      { name: 'Cheat Sheets', href: '/cheatsheets' },
      { name: 'Interview Prep', href: '/interview-prep' },
      { name: 'Tools', href: '/tools' },
      ...(!ADSENSE_REVIEW_MODE ? [
        { name: 'Glossary', href: '/glossary' },
        { name: 'Comparisons', href: '/compare' },
      ] : []),
    ],
    tools: [
      { name: 'Airflow', href: '/category/airflow' },
      { name: 'dbt', href: '/category/dbt' },
      { name: 'Python', href: '/category/python' },
      { name: 'Databricks', href: '/category/databricks' },
      { name: 'Salesforce', href: '/category/salesforce' },
      { name: 'Developer Productivity', href: '/category/developer-productivity' }
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Editorial Standards', href: '/editorial-standards' },
      { name: 'Contact', href: '/contact' },
      { name: 'All Articles', href: '/articles' },
      { name: 'Reading List', href: '/reading-list' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Cookie Policy', href: '/privacy-policy#cookies' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Disclaimer', href: '/disclaimer' },
      { name: 'Write for Us', href: '/contribute' },
      { name: 'Advertise', href: '/advertise' },
      { name: 'Sitemap', href: '/sitemap-index.xml', external: true },
      { name: 'RSS Feed', href: '/rss.xml', external: true },
      { name: 'Manage Cookies', action: () => { revokeConsent(); window.location.reload(); } }
    ]
  };

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/sainath-reddiee' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/sainathreddypogaku/' },
    { name: 'Email', icon: Mail, href: 'mailto:sainath@dataengineerhub.blog' }
  ];

  return (
    <footer className="relative py-16 border-t border-white/10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="col-span-2 lg:col-span-1"
          >
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <Database className="h-8 w-8 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold gradient-text">DataEngineer Hub</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Your ultimate resource for mastering data engineering technologies.
              From AWS to dbt, we cover it all with practical insights and expert guidance.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-white/10 hover:bg-blue-500/20 rounded-full flex items-center justify-center transition-colors group"
                    aria-label={`Visit ${social.name}`}
                  >
                    <IconComponent className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {[
            { title: 'Content', links: footerLinks.content, delay: 0.1 },
            { title: 'Technologies', links: footerLinks.tools, delay: 0.2 },
            { title: 'Company', links: footerLinks.company, delay: 0.3 }
          ].map((section) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: section.delay }}
              viewport={{ once: true }}
            >
              <span className="text-lg font-semibold text-white mb-6 block">{section.title}</span>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.action ? (
                      <button
                        onClick={link.action}
                        className="text-gray-400 hover:text-blue-400 transition-colors flex items-center group"
                      >
                        {link.name}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </button>
                    ) : link.external ? (
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-blue-400 transition-colors flex items-center group"
                      >
                        {link.name}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-blue-400 transition-colors flex items-center group"
                      >
                        {link.name}
                        <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm flex items-center">
              © {new Date().getFullYear()} DataEngineer Hub. Made with
              <Heart className="h-4 w-4 text-red-400 mx-1 animate-pulse" />
              for data engineers worldwide.
            </p>
            <p className="text-gray-400 text-sm">
              Empowering the next generation of data professionals
            </p>
          </div>

          {/* CCPA / Ad Personalization Disclosure */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <span>Information from your device can be used to personalize your ad experience.</span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <button
              onClick={() => { revokeConsent(); window.location.reload(); }}
              className="text-blue-400/70 hover:text-blue-400 hover:underline transition-colors"
            >
              Do not sell or share my personal information
            </button>
            <span className="hidden sm:inline text-gray-700">|</span>
            <Link
              to="/terms-of-service"
              className="text-blue-400/70 hover:text-blue-400 hover:underline transition-colors"
            >
              Terms of Content Use
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
