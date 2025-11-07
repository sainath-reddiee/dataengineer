// scripts/generateStaticPages.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDPRESS_API_URL = 'https://app.dataengineerhub.blog/wp-json/wp/v2';

// Function to fetch data from WordPress
async function fetchFromWP(endpoint, fields = '') {
  const items = [];
  let page = 1;
  
  while (true) {
    try {
      const url = `${WORDPRESS_API_URL}${endpoint}?per_page=100&page=${page}${fields ? `&_fields=${fields}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 400) break; // No more pages
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;
      
      items.push(...data);
      page++;
      
      // Be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error.message);
      break;
    }
  }
  
  return items;
}

// Function to strip HTML tags
function stripHTML(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Function to generate HTML for a page
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
    
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%);
        color: #f8fafc;
        line-height: 1.6;
        padding: 40px 20px;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.05);
        padding: 40px;
        border-radius: 12px;
      }
      h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      p { font-size: 1.125rem; line-height: 1.8; color: #cbd5e1; margin-bottom: 1rem; }
      .content { margin-top: 2rem; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${title}</h1>
      <p>${description}</p>
      ${content ? `<div class="content">${content}</div>` : ''}
      <noscript>
        <p style="margin-top: 2rem; color: #fbbf24;">
          Enable JavaScript for the full interactive experience.
        </p>
      </noscript>
    </div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
}

// Main function
async function generatePages() {
  console.log('🚀 Generating static pages for SEO...\n');
  
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ folder not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const pages = [];
  
  // 1. Fetch posts
  console.log('📄 Fetching posts...');
  const posts = await fetchFromWP('/posts', 'slug,title,excerpt,content');
  
  posts.forEach(post => {
    const description = stripHTML(post.excerpt.rendered).substring(0, 160);
    const contentPreview = stripHTML(post.content.rendered).substring(0, 500);
    
    pages.push({
      title: stripHTML(post.title.rendered),
      description,
      path: `/articles/${post.slug}`,
      content: `<p>${contentPreview}...</p>`
    });
  });
  
  console.log(`✅ Found ${posts.length} posts`);
  
  // 2. Fetch categories
  console.log('📁 Fetching categories...');
  const categories = await fetchFromWP('/categories', 'slug,name,description');
  
  categories.forEach(cat => {
    pages.push({
      title: stripHTML(cat.name),
      description: stripHTML(cat.description) || `Articles about ${cat.name}`,
      path: `/category/${cat.slug}`
    });
  });
  
  console.log(`✅ Found ${categories.length} categories`);
  
  // 3. Fetch tags
  console.log('🏷️  Fetching tags...');
  const tags = await fetchFromWP('/tags', 'slug,name,description');
  
  tags.forEach(tag => {
    pages.push({
      title: stripHTML(tag.name),
      description: stripHTML(tag.description) || `Articles tagged with ${tag.name}`,
      path: `/tag/${tag.slug}`
    });
  });
  
  console.log(`✅ Found ${tags.length} tags\n`);
  
  // 4. Generate HTML files
  console.log('💾 Writing HTML files...');
  let generated = 0;
  
  for (const page of pages) {
    const html = generateHTML(page);
    const filePath = path.join(distDir, page.path, 'index.html');
    const dir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write HTML file
    fs.writeFileSync(filePath, html);
    generated++;
    
    if (generated % 50 === 0) {
      console.log(`  Generated ${generated}/${pages.length} pages...`);
    }
  }
  
  console.log(`\n✅ Successfully generated ${generated} static HTML pages!`);
  console.log('📊 Summary:');
  console.log(`   - Posts: ${posts.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Tags: ${tags.length}`);
  console.log(`   - Total: ${generated} pages\n`);
}

// Run the script
generatePages().catch(error => {
  console.error('❌ Error generating pages:', error);
  process.exit(1);
});