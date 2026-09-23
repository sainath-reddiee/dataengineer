import React from 'react';

/**
 * TL;DR / Key Takeaways card for AEO and readers.
 * Used when the article has an explicit summary block (heading, bold
 * paragraph, or HTML comment). Synthetic H2 sentences stay in the body.
 */
const KeyTakeaways = ({ items, title = 'TL;DR' }) => {
  if (!items || items.length === 0) return null;

  return (
    <aside className="key-takeaways article-tldr" aria-label={title}>
      <p className="article-tldr-kicker">{title}</p>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </aside>
  );
};

export default KeyTakeaways;
