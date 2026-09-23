import React from 'react';
import { HelpCircle } from 'lucide-react';

const ArticleFaq = ({ items }) => {
  if (!items || items.length < 1) return null;
  const many = items.length > 1;

  return (
    <section className="article-faq" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading" className="article-faq-title">
        <HelpCircle className="article-faq-icon" aria-hidden="true" />
        {many ? 'Questions this article answers' : 'Question this article answers'}
      </h2>
      <p className="article-faq-kicker">
        {many
          ? 'Short answers first. Open a question to read the working note.'
          : 'The short answer first. Open it to read the working note.'}
      </p>
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
