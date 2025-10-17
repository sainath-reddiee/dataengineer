#!/usr/bin/env python3
"""
Blog Generator (FREE VERSION) - Uses Google Gemini API (Free Forever!)
Creates SEO-optimized blog content at ZERO cost
"""

import os
import json
import re
from typing import Dict, List
from datetime import datetime

try:
    import google.generativeai as genai
except ImportError:
    print("❌ Google Generative AI not installed!")
    print("Install with: pip install google-generativeai")
    exit(1)

class BlogGeneratorFree:
    def __init__(self, api_key: str):
        """Initialize with Google Gemini (FREE API)"""
        genai.configure(api_key=api_key)
        
        # Use free tier model - gemini-1.5-flash
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        print("✅ Using Google Gemini (FREE tier)")
    
    def generate_blog_post(self, topic: Dict) -> Dict:
        """Generate complete blog post - 100% FREE"""
        print(f"🎯 Generating blog post: {topic['title']}")
        
        # Step 1: Generate SEO metadata
        seo_data = self._generate_seo_metadata(topic)
        print(f"✅ SEO metadata generated (FREE)")
        
        # Step 2: Generate main content
        content_html = self._generate_content(topic, seo_data)
        print(f"✅ Content generated ({len(content_html)} chars) (FREE)")
        
        # Step 3: Generate image prompts
        image_prompts = self._generate_image_prompts(topic, content_html)
        print(f"✅ Image prompts generated ({len(image_prompts)} images) (FREE)")
        
        # Step 4: Generate references
        references = self._generate_references(topic)
        print(f"✅ References generated ({len(references)} links) (FREE)")
        
        return {
            'title': seo_data['title'],
            'content': content_html,
            'seo': seo_data,
            'images': image_prompts,
            'references': references,
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'word_count': len(content_html.split()),
                'reading_time': self._calculate_reading_time(content_html),
                'cost': '$0.00 (FREE!)'
            }
        }
    
    def _generate_seo_metadata(self, topic: Dict) -> Dict:
        """Generate SEO metadata using FREE Gemini API"""
        
        prompt = f"""Generate SEO metadata for this blog topic:

Title: {topic['title']}
Category: {topic.get('category', 'general')}
Target Audience: {topic.get('target_audience', 'data engineers')}

Generate:
1. SEO Title: Compelling, keyword-rich, MUST be under 60 characters
2. Focus Keyword: Primary keyword phrase (2-4 words)
3. Meta Description: Compelling description, MUST be under 160 characters
4. Secondary Keywords: 5-7 related keywords

CRITICAL REQUIREMENTS:
- SEO title MUST include the focus keyword
- Meta description MUST include focus keyword
- Use power words (Ultimate, Complete, Essential, Guide, etc.)
- All must be search-intent optimized

Return as JSON ONLY (no markdown, no extra text):
{{
  "title": "...",
  "focus_keyword": "...",
  "meta_description": "...",
  "secondary_keywords": ["...", "..."]
}}"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean response
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            seo_data = json.loads(text)
            
            # Enforce length limits
            if len(seo_data['title']) > 60:
                seo_data['title'] = seo_data['title'][:57] + '...'
            
            if len(seo_data['meta_description']) > 160:
                seo_data['meta_description'] = seo_data['meta_description'][:157] + '...'
            
            return seo_data
            
        except Exception as e:
            print(f"⚠️ SEO generation error: {e}")
            # Fallback SEO
            return {
                'title': topic['title'][:60],
                'focus_keyword': topic.get('keywords', ['data engineering'])[0] if topic.get('keywords') else 'data engineering',
                'meta_description': f"Learn about {topic['title']} in this comprehensive guide for data engineers.",
                'secondary_keywords': topic.get('keywords', ['data engineering', 'tutorial'])[:7]
            }
    
    def _generate_content(self, topic: Dict, seo_data: Dict) -> str:
        """Generate main blog content using FREE Gemini API"""
        
        prompt = f"""Write a comprehensive, SEO-optimized blog post in HTML format.

TOPIC DETAILS:
- Title: {topic['title']}
- Category: {topic.get('category', 'general')}
- Focus Keyword: {seo_data['focus_keyword']}
- Target Length: 1800-2500 words
- Audience Level: {topic.get('level', 'intermediate')}

SEO REQUIREMENTS:
1. STRUCTURE:
   - Start with engaging introduction (use focus keyword in first 100 words)
   - 5-7 main sections with H2 headings
   - Each section should have 2-3 subsections with H3 headings
   - Include practical examples and code snippets where relevant

2. SEO OPTIMIZATION:
   - Use focus keyword "{seo_data['focus_keyword']}" 4-6 times naturally
   - Use secondary keywords: {', '.join(seo_data['secondary_keywords'][:5])}
   - Include semantic variations
   - Optimize heading structure

3. CONTENT QUALITY:
   - Provide actionable, practical advice
   - Include specific examples and use cases
   - Use code examples where appropriate
   - Include best practices and tips
   - Explain concepts clearly

4. HTML FORMATTING:
   - Use <h2> for main section headings
   - Use <h3> for subsection headings
   - Use <p> for paragraphs
   - Use <strong> for emphasis
   - Use <ul> or <ol> for lists
   - Use <pre><code class="language-[lang]"> for code blocks
   - Use <blockquote> for tips/warnings

5. ENGAGEMENT:
   - Write in active voice
   - Address reader as "you"
   - Include emoji bullets for tips: 💡 Tip:, ⚠️ Warning:, 🚀 Pro Tip:
   - End sections with smooth transitions

6. DO NOT INCLUDE:
   - HTML/head/body tags
   - Meta tags
   - Conclusion section
   - External links
   - Images

Return ONLY the HTML content starting with the first <h2> tag."""

        try:
            response = self.model.generate_content(prompt)
            content_html = response.text.strip()
            
            # Clean markdown artifacts
            if '```html' in content_html:
                content_html = content_html.split('```html')[1].split('```')[0].strip()
            elif content_html.startswith('```'):
                content_html = content_html.split('```')[1].split('```')[0].strip()
            
            return content_html
            
        except Exception as e:
            print(f"⚠️ Content generation error: {e}")
            # Fallback content
            return f"""<h2>Introduction to {topic['title']}</h2>
<p>This comprehensive guide covers {seo_data['focus_keyword']} for data engineers.</p>

<h2>Overview</h2>
<p>In this article, we'll explore the key concepts and best practices for {seo_data['focus_keyword']}.</p>

<h3>Key Benefits</h3>
<ul>
<li>Improved efficiency</li>
<li>Better data management</li>
<li>Enhanced performance</li>
</ul>

<h2>Getting Started</h2>
<p>Let's dive into the fundamentals of {seo_data['focus_keyword']}.</p>"""
    
    def _generate_image_prompts(self, topic: Dict, content: str) -> List[Dict]:
        """Generate prompts for hand-drawn style images - FREE"""
        
        prompt = f"""Generate 4-5 image prompts for this blog post to create hand-drawn, sketch-style illustrations.

Blog Title: {topic['title']}
Category: {topic.get('category', 'general')}

Content Preview: {content[:1000]}...

For each image, provide:
1. placement: 'hero', 'section-1', 'section-2', etc.
2. prompt: Detailed prompt for hand-drawn illustration (100-150 words)
3. alt_text: SEO-optimized alt text (under 125 characters)
4. caption: Brief caption

STYLE REQUIREMENTS:
- Hand-drawn sketch style, black ink on white background
- Clean lines, minimal shading
- Technical diagrams mixed with conceptual illustrations
- Professional but friendly aesthetic

IMAGE TYPES:
1. Hero image: Conceptual overview
2-3. Section images: Key concepts or processes
4. Diagram: Technical workflow or architecture

Return as JSON array ONLY (no markdown):
[
  {{
    "placement": "hero",
    "prompt": "Hand-drawn sketch illustration showing...",
    "alt_text": "...",
    "caption": "..."
  }}
]"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            return json.loads(text)
            
        except Exception as e:
            print(f"⚠️ Image prompt generation error: {e}")
            # Fallback image prompts
            return [
                {
                    "placement": "hero",
                    "prompt": f"Hand-drawn sketch illustration showing {topic['title']} concept with clean lines",
                    "alt_text": f"{topic['title']} diagram",
                    "caption": f"Overview of {topic['title']}"
                }
            ]
    
    def _generate_references(self, topic: Dict) -> List[Dict]:
        """Generate relevant external reference links - FREE"""
        
        prompt = f"""Generate 5-6 authoritative external reference links for this topic:

Topic: {topic['title']}
Category: {topic.get('category', 'general')}
Keywords: {', '.join(topic.get('keywords', []))}

For each reference:
- title: Link text (under 60 chars)
- url: Real URL to authoritative source
- description: Brief description (under 100 chars)

PRIORITIES:
1. Official documentation
2. GitHub repositories
3. Official tech blogs
4. Reputable publications

Return as JSON array ONLY:
[
  {{
    "title": "...",
    "url": "https://...",
    "description": "..."
  }}
]"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            return json.loads(text)
            
        except Exception as e:
            print(f"⚠️ References generation error: {e}")
            # Fallback references
            category = topic.get('category', 'general')
            return [
                {
                    "title": f"Official {category.title()} Documentation",
                    "url": f"https://docs.{category}.com",
                    "description": f"Official documentation for {category}"
                }
            ]
    
    def _calculate_reading_time(self, content: str) -> int:
        """Calculate estimated reading time"""
        text = re.sub(r'<[^>]+>', '', content)
        words = len(text.split())
        return max(1, round(words / 225))


def main():
    """Test the FREE blog generator"""
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found!")
        print("\n📝 To get FREE API key:")
        print("1. Visit: https://ai.google.dev/")
        print("2. Click 'Get API key in Google AI Studio'")
        print("3. Create project and get FREE key")
        print("4. Add to .env: GEMINI_API_KEY=your_key_here")
        print("\n💰 Cost: $0 (FREE FOREVER!)")
        return
    
    generator = BlogGeneratorFree(api_key)
    
    test_topic = {
        'title': 'Complete Guide to Data Pipeline Automation',
        'category': 'data-engineering',
        'keywords': ['data pipeline', 'automation', 'ETL'],
        'level': 'intermediate'
    }
    
    print("\n🚀 Testing FREE Blog Generator...\n")
    result = generator.generate_blog_post(test_topic)
    
    print("\n" + "="*50)
    print("BLOG POST GENERATED (100% FREE!)")
    print("="*50)
    print(f"\n📝 Title: {result['title']}")
    print(f"🎯 Focus Keyword: {result['seo']['focus_keyword']}")
    print(f"📊 Word Count: {result['metadata']['word_count']}")
    print(f"⏱️  Reading Time: {result['metadata']['reading_time']} min")
    print(f"🖼️  Images: {len(result['images'])}")
    print(f"🔗 References: {len(result['references'])}")
    print(f"💰 Cost: {result['metadata']['cost']}")
    
    # Save output
    output_file = 'test_blog_free.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Output saved to: {output_file}")
    print("\n🎉 Everything generated for FREE!")


if __name__ == "__main__":
    main()
