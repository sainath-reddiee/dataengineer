import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail,
  Heart,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Footer = () => {
  const { toast } = useToast();

  const handleSocialClick = (item) => {
    toast({
      title: "🚧 Link Coming Soon!",
      description: `${item} isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀`,
    });
  };

  const footerLinks = {
    content: [
      { name: 'Latest Articles', href: '/articles' },
      { name: 'AWS Tutorials', href: '/category/aws' },
      { name: 'Snowflake Guides', href: '/category/snowflake' },
      { name: 'Azure Resources', href: '/category/azure' },
      { name: 'SQL Tips', href: '/category/sql' }
    ],
    tools: [
      { name: 'Airflow', href: '/category/airflow' },
      { name: 'dbt', href: '/category/dbt' },
      { name: 'Python', href: '/category/python' },
      { name: 'Analytics', href: '/category/analytics' }
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'Newsletter', href: '/newsletter' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Service', href: '/terms-of-service' }
    ]
  };

  const socialLinks = [
    { name: 'GitHub', icon: Github, href: 'https://github.com/sainath-reddiee' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/sainath29' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/in/sainathreddypogaku/' },
    { name: 'Email', icon: Mail, href: 'mailto:sainath@dataengineerhub.blog' }
  ];

  return (
    <footer className="relative py-16 border-t border-white/10">
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
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
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-blue-400 transition-colors flex items-center group"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
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
              © 2025 DataEngineer Hub. Made with 
              <Heart className="h-4 w-4 text-red-400 mx-1 animate-pulse" />
              for data engineers worldwide.
            </p>
            <p className="text-gray-500 text-sm">
              Empowering the next generation of data professionals
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;