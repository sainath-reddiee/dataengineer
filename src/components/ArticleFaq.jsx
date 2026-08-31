import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const ArticleFaq = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(0);

  if (!items || items.length < 2) return null;

  return (
    <section
      className="my-8 rounded-xl border border-blue-500/20 bg-slate-900/50 p-6"
      aria-labelledby="article-faq-heading"
    >
      <h2 id="article-faq-heading" className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-blue-400" />
        Questions this article answers
      </h2>
      <div className="space-y-2">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.question} className="rounded-lg border border-slate-700/60 bg-slate-800/40">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-slate-100">{item.question}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-blue-300 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <p className="px-4 pb-4 text-sm leading-relaxed text-gray-300">
                  {item.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ArticleFaq;
