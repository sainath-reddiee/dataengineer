// Shared helper: keep the Tailwind bundle off the homepage critical path.
// Vite injects <link rel="stylesheet">, then prerender snapshots the DOM
// after onload flipped media to "all" and after the delayed AdSense tag
// was injected. Re-apply this after those steps.

const HEAVY_PRELOAD = /framer-motion|\/ads-|duckdb|pdf-vendor|linking-engine|ai-vendor/i;

export function deferRenderBlockingStylesheets(html) {
  if (typeof html !== 'string' || !html) return html;

  const noscripts = [];
  const withoutNoscript = html.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, (block) => {
    noscripts.push(block);
    return `<!--DEH_NOSCRIPT_${noscripts.length - 1}-->`;
  });

  const next = withoutNoscript.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel=["']stylesheet["']/i.test(tag)) return tag;
    const href = (tag.match(/\bhref=["']([^"']+\.css)["']/i) || [])[1];
    if (!href) return tag;
    if (/\bmedia=["']print["']/i.test(tag) && /\bonload=/i.test(tag)) return tag;

    const crossorigin = /\bcrossorigin\b/i.test(tag) ? ' crossorigin' : '';
    return `<link rel="stylesheet"${crossorigin} href="${href}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet"${crossorigin} href="${href}"></noscript>`;
  });

  return next.replace(/<!--DEH_NOSCRIPT_(\d+)-->/g, (_, i) => noscripts[Number(i)]);
}

export function cleanHomepagePaintHtml(html) {
  if (typeof html !== 'string' || !html) return html;

  let next = html.replace(
    /<script\b[^>]*src=["'][^"']*adsbygoogle\.js[^"']*["'][^>]*>\s*<\/script>/gi,
    ''
  );

  next = next.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel=["']modulepreload["']/i.test(tag)) return tag;
    return HEAVY_PRELOAD.test(tag) ? '' : tag;
  });

  next = deferRenderBlockingStylesheets(next);
  return next.replace(
    /(<noscript><link rel="stylesheet"[^>]*><\/noscript>)(?:\s*\1)+/gi,
    '$1'
  );
}
