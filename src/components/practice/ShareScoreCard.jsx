// src/components/practice/ShareScoreCard.jsx
import React, { useState } from 'react';
import { Linkedin, Twitter, Link as LinkIcon, Check } from 'lucide-react';

const SITE = 'https://dataengineerhub.blog';

const ShareScoreCard = ({ quizSlug, quizTitle, score, correct, total }) => {
  const [copied, setCopied] = useState(false);
  const pageUrl = `${SITE}/practice/${quizSlug}?score=${score}&ref=share`;
  const ogUrl = `${SITE}/api/og-practice-result?score=${score}&cert=${encodeURIComponent(quizSlug)}&correct=${correct}&total=${total}`;
  const message = `I scored ${score}% on the ${quizTitle} practice test at Data Engineer Hub! 🎯`;

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const twitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(message)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${message}\n${pageUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignored */
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-1">Share your score</h3>
      <p className="text-sm text-slate-400 mb-4">
        Celebrate on LinkedIn — others will see a shareable score card.
      </p>
      <div className="rounded-lg overflow-hidden border border-slate-800 mb-4 bg-slate-950">
        {/* Preview of the OG card (falls back gracefully if API not deployed) */}
        <img
          src={ogUrl}
          alt={`${score}% score preview`}
          className="w-full h-auto"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white text-sm font-medium transition-colors"
        >
          <Linkedin className="w-4 h-4" />
          Share on LinkedIn
        </a>
        <a
          href={twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          <Twitter className="w-4 h-4" />
          Share on X
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
};

export default ShareScoreCard;
