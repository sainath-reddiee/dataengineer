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
    const image = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
    const author = post._embedded?.author?.[0]?.name || 'Sainath Reddy';
    const date = post.date || '';
    const modified = post.modified || date;
    const canonical = `https://dataengineerhub.blog/articles/${slug}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>${title} | DataEngineer Hub</title>
  <link rel="canonical" href="${canonical}">
  <meta name="description" content="${excerpt.substring(0, 160)}">
  <meta name="author" content="${author}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${excerpt.substring(0, 200)}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="DataEngineer Hub">
  <meta property="article:published_time" content="${date}">
  <meta property="article:modified_time" content="${modified}">
  <meta property="article:author" content="${author}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${excerpt.substring(0, 200)}">
  <meta name="twitter:image" content="${image}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title.replace(/"/g, '\\"')}",
    "author": { "@type": "Person", "name": "${author}" },
    "datePublished": "${date}",
    "dateModified": "${modified}",
    "image": "${image}",
    "url": "${canonical}",
    "publisher": { "@type": "Organization", "name": "DataEngineer Hub" }
  }
  </script>
</head>
<body>
  <article>
    <h1>${title}</h1>
    <p class="meta">By ${author} · Updated: ${modified.split('T')[0]}</p>
    ${content}
  </article>
</body>
</html>`;
  } catch (err) {
    console.warn('[fetchBlogArticleHTML] Failed for slug:', slug, err.message);
    return null;
  }
}
