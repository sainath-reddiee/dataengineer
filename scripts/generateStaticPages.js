// scripts/generateStaticPages.js
// MINIMAL VERSION: Only generate static pages for article posts
// Let React handle category/tag pages dynamically
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

async function fetchFromWP(endpoint, fields = '') {
  const items = [];
  let page = 1;
  
  while (true) {
    try {
      const url = `${WORDPRESS_API_URL}${endpoint}?per_page=100&page=${page}${fields ? `&_fields=${fields}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 400) break;
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      
      items.push(...data);
      page++;
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      break;
    }
  }
  
  return items;
}

function stripHTML(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function generateHTML(pageData) {
  const { title, description, path: pagePath, content = '' } = pageData;
  
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} | DataEngineer Hub</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="https://dataengineerhub.blog${pagePath}" />
    <meta name="robots" content="index, follow" />
    
    <link rel="dns-prefetch" href="//app.dataengineerhub.blog">
    <link rel="preconnect" href="https://app.dataengineerhub.blog" crossorigin>
    
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);
        color: #f8fafc;
        line-height: 1.6;
      }
      .seo-content {
        max-width: 800px;
        margin: 0 auto;
        padding: 60px 20px;
      }
      .seo-content h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .seo-content p { 
        font-size: 1.125rem; 
        line-height: 1.8; 
        color: #cbd5e1; 
        margin-bottom: 1rem; 
      }
      body.react-loaded .seo-content { display: none; }
    </style>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add('react-loading');
      });
    </script>
  </head>
  <body>
    <div id="root">
      <div class="seo-content">
        <h1>${title}</h1>
        <p>${description}</p>
        ${content ? `<div>${content}</div>` : ''}
      </div>
    </div>
    <script type="module" src="/src/main.jsx"></script>
    <script>
      window.addEventListener('load', function() {
        document.body.classList.remove('react-loading');
        document.body.classList.add('react-loaded');
      });
    </script>
  </body>
</html>`;
}

async function generatePages() {
  console.log('🚀 Generating static pages for article posts only...\n');
  console.log('ℹ️  Categories and tags will be handled by React dynamically.\n');
  
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ folder not found. Run "npm run build:vite" first.');
    process.exit(1);
  }
  
  // Only generate pages for posts (articles)
  console.log('📄 Fetching posts...');
  const posts = await fetchFromWP('/posts', 'slug,title,excerpt,content');
  
  console.log(`✅ Found ${posts.length} posts\n`);
  console.log('💾 Writing HTML files...');
  
  let generated = 0;
  
  for (const post of posts) {
    const description = stripHTML(post.excerpt.rendered).substring(0, 160);
    const contentPreview = stripHTML(post.content.rendered).substring(0, 500);
    
    const pageData = {
      title: stripHTML(post.title.rendered),
      description,
      path: `/articles/${post.slug}`,
      content: `<p>${contentPreview}...</p>`
    };
    
    const html = generateHTML(pageData);
    const filePath = path.join(distDir, pageData.path, 'index.html');
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, html);
    generated++;
    
    if (generated % 50 === 0) {
      console.log(`  Generated ${generated}/${posts.length} pages...`);
    }
  }
  
  console.log(`\n✅ Successfully generated ${generated} static HTML pages!`);
  console.log('\n📊 What was generated:');
  console.log(`   ✅ Article posts: ${posts.length}`);
  console.log(`   ⚠️  Categories: Handled by React (no static HTML)`);
  console.log(`   ⚠️  Tags: Handled by React (no static HTML)`);
  console.log('\n✨ This is better because:');
  console.log('   - Article pages get full SEO benefits');
  console.log('   - Category/tag pages load instantly with React');
  console.log('   - No conflicts between static HTML and React routes\n');
}

generatePages().catch(error => {
  console.error('❌ Error generating pages:', error);
  process.exit(1);
});
