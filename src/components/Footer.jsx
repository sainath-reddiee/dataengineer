import { Link } from 'react-router-dom';
import { revokeConsent } from './CookieConsent';
import { ADSENSE_REVIEW_MODE } from '@/data/adsenseQualityGate';
import SupportButton from '@/components/Support/SupportButton';
import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {

  const footerLinks = {
    content: [
      { name: 'Latest Articles', href: '/articles' },
      { name: 'Cheat Sheets', href: '/cheatsheets' },
      { name: 'Tools', href: '/tools' },
      { name: 'Certification prep', href: '/certification' },
      ...(!ADSENSE_REVIEW_MODE ? [
        { name: 'AWS Tutorials', href: '/category/aws' },
        { name: 'Snowflake Guides', href: '/category/snowflake' },
        { name: 'Azure Resources', href: '/category/azure' },
        { name: 'SQL Tips', href: '/category/sql' },
        { name: 'Interview Prep', href: '/interview-prep' },
        { name: 'Glossary', href: '/glossary' },
        { name: 'Comparisons', href: '/compare' },
      ] : []),
    ],
    tools: [
      { name: 'All free tools', href: '/tools' },
      { name: 'SQL Playground', href: '/tools/sql-playground' },
      { name: 'Snowflake Cost Calculator', href: '/tools/snowflake-cost-calculator' },
      { name: 'Warehouse comparison', href: '/tools/cloud-data-warehouse-cost-comparison' },
      ...(!ADSENSE_REVIEW_MODE ? [
        { name: 'Cron builder', href: '/tools/cron-expression-builder' },
        { name: 'SQL Formatter', href: '/tools/sql-formatter' },
        { name: 'dbt schema.yml', href: '/tools/dbt-schema-generator' },
      ] : [
        { name: 'Databricks Cost Calculator', href: '/tools/databricks-cost-calculator' },
        { name: 'BigQuery Cost Calculator', href: '/tools/bigquery-cost-calculator' },
      ]),
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Editorial Standards', href: '/editorial-standards' },
      { name: 'Contact', href: '/contact' },
      { name: 'All Articles', href: '/articles' },
      ...(!ADSENSE_REVIEW_MODE ? [
        { name: 'Reading List', href: '/reading-list' },
      ] : []),
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Cookie Policy', href: '/privacy-policy#cookies' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Disclaimer', href: '/disclaimer' },
      ...(!ADSENSE_REVIEW_MODE ? [
        { name: 'Write for Us', href: '/contribute' },
      ] : []),
      { name: 'Advertise', href: '/advertise' },
      { name: 'Sponsored announcements', href: '/announcements' },
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

  const linkClass = 'text-[15px] text-paper-600 transition-colors hover:text-paper';

  // Dark ink band closes the page like a newspaper colophon. Uses the
  // explicit paper/ink tokens because legacy white/gray classes are inverted.
  return (
    <footer className="mt-16 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="font-serif text-2xl font-semibold text-paper">
              DataEngineer Hub
            </Link>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-paper-600">
              Production notes on Snowflake, dbt, Airflow and the modern data stack, written and
              maintained by Sainath Reddy.
            </p>
            <div className="mt-5 flex gap-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paper-600 transition-colors hover:text-rust-300"
                    aria-label={`Visit ${social.name}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
            <div className="mt-6">
              <SupportButton variant="footerCta" label="Buy me a coffee" source="footer" />
            </div>
          </div>

          {[
            { title: 'Read', links: footerLinks.content },
            { title: 'Free tools', links: footerLinks.tools },
            { title: 'About the site', links: footerLinks.company }
          ].map((section) => (
            <div key={section.title}>
              <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-rust-300">{section.title}</p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.action ? (
                      <button onClick={link.action} className={linkClass}>
                        {link.name}
                      </button>
                    ) : link.external ? (
                      <a href={link.href} className={linkClass}>
                        {link.name}
                      </a>
                    ) : (
                      <Link to={link.href} className={linkClass}>
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-muted/40 pt-6 text-sm text-paper-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} DataEngineer Hub. Written in Hyderabad.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span>Information from your device can be used to personalize your ad experience.</span>
            <button
              onClick={() => { revokeConsent(); window.location.reload(); }}
              className="text-paper-600 underline underline-offset-2 hover:text-paper"
            >
              Do not sell or share my personal information
            </button>
            <Link to="/terms-of-service" className="text-paper-600 underline underline-offset-2 hover:text-paper">
              Terms of Content Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
