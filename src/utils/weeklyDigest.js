/**
 * Draft the weekly email and a LinkedIn post from recent articles.
 * Sending stays in Buttondown / Brevo / LinkedIn — this only writes the copy.
 */

export function selectRecentPosts(posts, days = 7, limit = 6) {
  const cutoff = Date.now() - days * 86400000;
  return (posts || [])
    .filter((post) => post?.title && post?.slug)
    .filter((post) => {
      const time = new Date(post.date || post.modified || 0).getTime();
      return Number.isFinite(time) && time >= cutoff;
    })
    .slice(0, limit);
}

export function buildEmailDigest(posts, { siteUrl = 'https://dataengineerhub.blog' } = {}) {
  const items = posts.length > 0 ? posts : [];
  const lines = [
    'Weekly Data Digest',
    '',
    'Production notes from DataEngineer Hub — warehouse cost, dbt, Snowflake, not vendor rewrites.',
    '',
  ];

  if (items.length === 0) {
    lines.push('No new tutorials this week. The archive is still here: ' + siteUrl + '/articles');
  } else {
    items.forEach((post) => {
      lines.push(`• ${post.title}`);
      lines.push(`  ${siteUrl}/articles/${post.slug}`);
      if (post.excerpt) {
        lines.push(`  ${String(post.excerpt).replace(/<[^>]+>/g, '').trim().slice(0, 180)}`);
      }
      lines.push('');
    });
  }

  lines.push('Save articles for later: ' + siteUrl + '/reading-list');
  lines.push('Unsubscribe anytime via the link at the bottom of this email.');
  return lines.join('\n');
}

export function buildLinkedInPost(posts, { siteUrl = 'https://dataengineerhub.blog' } = {}) {
  const items = posts.slice(0, 3);
  const lines = [
    'This week I published production notes for data engineers — not another “what is Snowflake” explainer.',
    '',
  ];

  if (items.length === 0) {
    lines.push(`Archive: ${siteUrl}/articles`);
  } else {
    items.forEach((post, index) => {
      lines.push(`${index + 1}. ${post.title}`);
      lines.push(`${siteUrl}/articles/${post.slug}`);
      lines.push('');
    });
  }

  lines.push('If you want these in your inbox instead of the feed: ' + siteUrl + '/newsletter');
  lines.push('');
  lines.push('#dataengineering #snowflake #dbt');
  return lines.join('\n');
}
