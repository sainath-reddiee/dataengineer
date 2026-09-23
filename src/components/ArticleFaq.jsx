import React from 'react';
import { HelpCircle } from 'lucide-react';

const ArticleFaq = ({ items }) => {
  if (!items || items.length < 2) return null;

  return (
    <section className="article-faq" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading" className="article-faq-title">
        <HelpCircle className="article-faq-icon" aria-hidden="true" />
        Questions this article answers
      </h2>
      <p className="article-faq-kicker">Short answers first. Open a question to read the working note.</p>
      {items.map((item, index) => (
        <details key={item.question} className="article-faq-item" open={index < 2}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </section>
  );
};

export default ArticleFaq;
