// src/utils/fetchBlogArticleHTML.js
// Fetches blog article content from WordPress API and constructs a complete HTML
// document for SEO analysis. This bypasses the SPA shell problem where fetch()
// returns the empty index.html instead of rendered article content.

const WP_API = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

/**
 * If the URL is a blog article, fetches from WordPress API and returns
 * a fully-formed HTML string with meta tags, OG tags, canonical, and content.
 * Returns null if the URL is not a blog article or fetch fails.
 */
export async function fetchBlogArticleHTML(url) {
  // Match: */articles/{slug} patterns (production, localhost, preview)
  const match = url.match(/\/articles\/([a-z0-9][a-z0-9-]*[a-z0-9])/i);
  if (!match) return null;

  const slug = match[1];

  try {
    const response = await fetch(`${WP_API}/posts?slug=${slug}&_embed&_fields=id,slug,title,content,excerpt,date,modified,_embedded`);
    if (!response.ok) return null;

    const posts = await response.json();
    if (!posts || posts.length === 0) return null;

    const post = posts[0];
    const title = (post.title?.rendered || '').replace(/<[^>]*>/g, '');
    const content = post.content?.rendered || '';
    const excerpt = (post.excerpt?.rendered || '').replace(/<[^>]*>/g, '').trim();
    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    const image = featuredMedia?.source_url || 'https://dataengineerhub.blog/logo.png';
    const imgWidth = featuredMedia?.media_details?.width || 250;
    const imgHeight = featuredMedia?.media_details?.height || 250;
    const author = post._embedded?.author?.[0]?.name || 'Sainath Reddy';
    const date = post.date || '';
    const modified = post.modified || date;
    const canonical = `https://dataengineerhub.blog/articles/${slug}`;

    // Extract categories and tags from embedded terms
    const categories = post._embedded?.['wp:term']?.[0] || [];
    const tags = post._embedded?.['wp:term']?.[1] || [];
    const primaryCategory = categories.find(c => c.name !== 'Uncategorized')?.name || categories[0]?.name || '';
    const tagNames = tags.map(t => t.name);

    // Build category/tag meta tags
    const categoryMeta = primaryCategory ? `\n  <meta property="article:section" content="${primaryCategory}">` : '';
    const tagsMeta = tagNames.map(t => `\n  <meta property="article:tag" content="${t}">`).join('');

    // Detect FAQ-worthy Q&A headings for schema
    const questionHeadings = [...content.matchAll(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/gi)]
      .map(m => m[1].replace(/<[^>]*>/g, '').trim())
      .filter(h => /^(what|why|how|when|where|who|can|is|does|do|should)\b/i.test(h));

    const faqSchema = questionHeadings.length >= 2 ? `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [${questionHeadings.slice(0, 5).map(q => `
      {"@type": "Question", "name": "${q.replace(/"/g, '\\"')}", "acceptedAnswer": {"@type": "Answer", "text": "See article for detailed answer."}}`).join(',')}
    ]
  }
  </script>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="canonical" href="${canonical}">
  <link rel="sitemap" href="https://dataengineerhub.blog/sitemap.xml">
  <link rel="icon" type="image/png" href="https://dataengineerhub.blog/logo.png">
  <meta name="description" content="${excerpt.substring(0, 160)}">
  <meta name="author" content="${author}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${excerpt.substring(0, 200)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="${imgWidth}">
  <meta property="og:image:height" content="${imgHeight}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="DataEngineer Hub">
  <meta property="article:published_time" content="${date}">
  <meta property="article:modified_time" content="${modified}">${categoryMeta}${tagsMeta}
  <meta property="article:author" content="${author}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${excerpt.substring(0, 200)}">
  <meta name="twitter:image" content="${image}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "${title.replace(/"/g, '\\"')}",
    "author": { "@type": "Person", "name": "${author}" },
    "datePublished": "${date}",
    "dateModified": "${modified}",
    "image": "${image}",
    "url": "${canonical}",
    "publisher": { "@type": "Organization", "name": "DataEngineer Hub" },
    "mainEntityOfPage": "${canonical}"
  }
  </script>${faqSchema}
</head>
<body>
  <article>
    <header>
      <h1>${title}</h1>
      <p class="meta">By ${author} · Updated: ${modified.split('T')[0]}</p>
    </header>
    <section>
      ${content}
    </section>
  </article>
</body>
</html>`;
  } catch (err) {
    return null;
  }
}
