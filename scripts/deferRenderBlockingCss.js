// Shared helper: keep the Tailwind bundle off the homepage critical path.
// Vite injects <link rel="stylesheet">, then prerender/SSG can put it back
// as media="all". Re-apply this after those steps so PSI mobile does not
// sit on 24 KB of CSS for 1.2s before the static hero can paint.

export function deferRenderBlockingStylesheets(html) {
  if (typeof html !== 'string' || !html) return html;

  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel=["']stylesheet["']/i.test(tag)) return tag;
    if (!/\bhref=["'][^"']+\.css["']/i.test(tag)) return tag;
    if (/\bonload=/i.test(tag) && /\bmedia=["']print["']/i.test(tag)) return tag;

    const attrs = tag
      .replace(/^<link\b/i, '')
      .replace(/>$/, '')
      .replace(/\s*rel=["']stylesheet["']/i, '')
      .replace(/\s*media=["'][^"']*["']/i, '')
      .replace(/\s*onload=["'][^"']*["']/i, '');

    return `<link rel="stylesheet"${attrs} media="print" onload="this.media='all'"><noscript><link rel="stylesheet"${attrs}></noscript>`;
  });
}
