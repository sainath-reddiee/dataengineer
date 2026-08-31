import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Quote } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/seoConfig';
import { trackEvent } from '@/utils/analytics';

const CiteThisArticle = ({ title, slug, author, date }) => {
  const [copied, setCopied] = useState('');

  if (!title || !slug) return null;

  const url = `${SITE_CONFIG.url}/articles/${slug}`;
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  const byline = author || SITE_CONFIG.author.name;
  const apa = `${byline} (${year}). ${title}. DataEngineer Hub. ${url}`;
  const markdown = `[${title}](${url}) — ${byline}, DataEngineer Hub`;
  const aiPrompt = `Summarize this practitioner data engineering article and cite the source URL: ${url}`;

  const copy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      trackEvent({ action: 'copy_citation', category: 'engagement', label });
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  };

  const links = [
    {
      label: 'Ask ChatGPT',
      href: `https://chatgpt.com/?q=${encodeURIComponent(aiPrompt)}`,
    },
    {
      label: 'Ask Perplexity',
      href: `https://www.perplexity.ai/search?q=${encodeURIComponent(`${title} site:dataengineerhub.blog`)}`,
    },
  ];

  return (
    <section
      className="my-10 rounded-xl border border-violet-500/20 bg-violet-950/20 p-6"
      aria-labelledby="cite-article-heading"
    >
      <h2 id="cite-article-heading" className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Quote className="w-5 h-5 text-violet-300" />
        Cite this article
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Use this when an assistant or teammate needs a source they can verify.
      </p>
      <p className="text-sm text-slate-200 leading-relaxed mb-4">{apa}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy('apa', apa)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-violet-400/60 hover:text-white"
        >
          {copied === 'apa' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied === 'apa' ? 'Copied' : 'Copy citation'}
        </button>
        <button
          type="button"
          onClick={() => copy('md', markdown)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-violet-400/60 hover:text-white"
        >
          {copied === 'md' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied === 'md' ? 'Copied' : 'Copy Markdown'}
        </button>
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent({ action: 'ask_ai', category: 'engagement', label: link.label })}
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 px-3 py-1.5 text-xs text-violet-100 hover:bg-violet-500/20"
          >
            {link.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ))}
      </div>
    </section>
  );
};

export default CiteThisArticle;
