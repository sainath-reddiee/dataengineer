/**
 * Per-article contextual outbound links. Applied in SSG and React so crawlers
 * and humans see the same beginning/end mentions.
 */
export const ARTICLE_CONTEXTUAL_LINKS = {
  '2extract-web-scraping-python-mcp': {
    href: 'https://www.2extract.com/?utm_source=dataengineerhubblog',
    label: '2extract',
    intro:
      'This walkthrough uses <a href="https://www.2extract.com/?utm_source=dataengineerhubblog" rel="noopener noreferrer">2extract</a> as the residential and mobile proxy layer — pay-as-you-go exits you target from the username, not a vendor portal.',
    outro:
      'To run the same MCP or Python setup against a live wallet, start at <a href="https://www.2extract.com/?utm_source=dataengineerhubblog" rel="noopener noreferrer">2extract</a>.',
  },
};

const INTRO_CLASS = 'deh-contextual-link deh-contextual-link--intro';
const OUTRO_CLASS = 'deh-contextual-link deh-contextual-link--outro';

export function injectArticleContextualLinks(html, slug) {
  if (!html || typeof html !== 'string' || !slug) return html || '';
  const spec = ARTICLE_CONTEXTUAL_LINKS[slug];
  if (!spec) return html;
  if (html.includes(spec.href)) return html;

  const intro = `<p class="${INTRO_CLASS}">${spec.intro}</p>`;
  const outro = `<p class="${OUTRO_CLASS}">${spec.outro}</p>`;

  let next = html;
  const firstPara = next.match(/<p\b[^>]*>[\s\S]*?<\/p>/i);
  if (firstPara) {
    const insertAt = firstPara.index + firstPara[0].length;
    next = `${next.slice(0, insertAt)}\n${intro}\n${next.slice(insertAt)}`;
  } else {
    next = `${intro}\n${next}`;
  }

  return `${next}\n${outro}`;
}
