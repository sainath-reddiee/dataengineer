import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { revokeConsent } from './CookieConsent';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import SupportButton from '@/components/Support/SupportButton';
import {
  Database,
  Github,
  Linkedin,
  Mail,
  Heart,
  ArrowRight
} from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    practice: [
      { name: 'Coding & Practice Hub', href: '/coding' },
      { name: 'SQL Sandbox', href: '/tools/sql-playground' },
      { name: 'Interview Prep & Bank', href: '/interview' },
      { name: 'Certifications Prep', href: '/certs' },
    ],
    learn: [
      { name: 'Start Here', href: '/start-here' },
      { name: 'Role Roadmaps', href: '/roadmaps' },
      { name: 'Blog Articles', href: '/articles' },
      { name: 'Free Tools & Calculators', href: '/tools' },
      { name: 'Reading List', href: '/reading-list' },
    ],
    technologies: [
      { name: 'Airflow', href: '/category/airflow' },
      { name: 'dbt', href: '/category/dbt' },
      { name: 'Python', href: '/category/python' },
      { name: 'Databricks', href: '/category/databricks' },
      { name: 'Salesforce', href: '/category/salesforce' },
      { name: 'Developer Productivity', href: '/category/developer-productivity' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Start Here', href: '/start-here' },
      { name: 'Write for Us', href: '/contribute' },
      { name: 'Contact', href: '/contact' },
      { name: 'Editorial Standards', href: '/editorial-standards' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Disclaimer', href: '/disclaimer' },
      { name: 'Sitemap', href: '/sitemap-index.xml', external: true },
      { name: 'RSS Feed', href: '/rss.xml', external: true },
    ]
  };

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/sainath-reddiee' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/sainathreddypogaku/' },
    { name: 'Email', icon: Mail, href: 'mailto:sainath@dataengineerhub.blog' }
  ];

  return (
    <footer className="relative py-16 border-t border-white/10 bg-slate-950 overflow-hidden text-slate-300">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand & Socials Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="col-span-1 sm:col-span-2 lg:col-span-1"
          >
            <Link to="/" className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <Database className="h-7 w-7 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                DataEngineer Hub
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">
              SQL, pipelines, analytics, and ML — practical insights and expert guidance so you can ship.
            </p>
            <div className="flex items-center space-x-3 mb-6">
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
                    className="w-9 h-9 bg-white/5 hover:bg-blue-500/20 border border-white/10 rounded-lg flex items-center justify-center transition-colors group"
                    aria-label={`Visit ${social.name}`}
                  >
                    <IconComponent className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </motion.a>
                );
              })}
            </div>

            <div className="mt-4">
              <SupportButton variant="footerCta" label="Buy me a coffee" source="footer" />
            </div>
          </motion.div>

          {/* Practice Column */}
          <FooterSection title="Practice" links={footerLinks.practice} delay={0.1} />

          {/* Learn Column */}
          <FooterSection title="Learn" links={footerLinks.learn} delay={0.2} />

          {/* Technologies Column */}
          <FooterSection title="Technologies" links={footerLinks.technologies} delay={0.3} />

          {/* Company & Resources Column */}
          <FooterSection title="Company" links={footerLinks.company} delay={0.4} />
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-400">
            <p className="flex items-center">
              © {new Date().getFullYear()} DataEngineer Hub. Made with
              <Heart className="h-4 w-4 text-red-400 mx-1.5 animate-pulse shrink-0" />
              for data engineers worldwide.
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Empowering data professionals to build scalable pipelines.
            </p>
          </div>

          {/* CCPA / Privacy Disclosure & Cookie Control */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <span>Information from your device can be used to personalize your experience.</span>
            <span className="hidden sm:inline text-gray-700">|</span>
            <button
              onClick={() => { revokeConsent(); window.location.reload(); }}
              className="text-blue-400/80 hover:text-blue-300 hover:underline transition-colors"
            >
              Do not sell or share my personal information
            </button>
            <span className="hidden sm:inline text-gray-700">|</span>
            <Link
              to="/terms-of-service"
              className="text-blue-400/80 hover:text-blue-300 hover:underline transition-colors"
            >
              Terms of Content Use
            </Link>
            <span className="hidden sm:inline text-gray-700">|</span>
            <button
              onClick={() => { revokeConsent(); window.location.reload(); }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Manage Cookies
            </button>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

const FooterSection = ({ title, links, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">{title}</h3>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.name}>
          {link.external ? (
            <a
              href={link.href}
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-flex items-center group"
            >
              {link.name}
              <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
            </a>
          ) : (
            <Link
              to={link.href}
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-flex items-center group"
            >
              {link.name}
              <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
            </Link>
          )}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default Footer;
