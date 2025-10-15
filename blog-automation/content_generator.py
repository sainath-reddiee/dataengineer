#!/usr/bin/env python3
"""
Content Generator - Creates SEO-optimized blog posts
Uses Claude API for high-quality, technical content
"""

import os
import json
import re
from typing import Dict, List, Tuple
import anthropic


class ContentGenerator:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.max_title_length = 60
        self.max_meta_description_length = 160
    
    def generate_complete_article(self, topic: Dict) -> Dict:
        """
        Generate complete blog article with SEO optimization
        
        Returns:
            {
                'seo_title': '...',
                'focus_keyword': '...',
                'meta_description': '...',
                'content_html': '...',
                'tags': [...],
                'references': [...],
                'image_prompts': [...]
            }
        """
        print(f"🚀 Generating article: {topic['title']}")
        
        # Step 1: Generate SEO metadata
        seo_data = self._generate_seo_metadata(topic)
        
        # Step 2: Generate main content
        content_html = self._generate_article_content(topic, seo_data)
        
        # Step 3: Generate external references
        references = self._generate_references(topic)
        
        # Step 4: Generate image prompts for hand-drawn style
        image_prompts = self._generate_image_prompts(topic)
        
        # Step 5: Generate tags
        tags = self._generate_tags(topic, content_html)
        
        article = {
            'seo_title': seo_data['title'],
            'focus_keyword': seo_data['focus_keyword'],
            'meta_description': seo_data['meta_description'],
            'content_html': content_html,
            'tags': tags,
            'references': references,
            'image_prompts': image_prompts,
            'category': topic['category'],
            'target_level': topic.get('level', 'intermediate')
        }
        
        # Validate SEO requirements
        self._validate_seo(article)
        
        return article
    
    def _generate_seo_metadata(self, topic: Dict) -> Dict:
        """Generate SEO title, focus keyword, and meta description"""
        
        prompt = f"""You are an SEO expert for a data engineering blog.

Topic: {topic['title']}
Category: {topic['category']}
Keywords: {', '.join(topic.get('keywords', []))}
Content Angle: {topic.get('angle', 'tutorial')}
Target Level: {topic.get('level', 'intermediate')}

Generate SEO metadata following STRICT requirements:

1. SEO Title (MUST be ≤60 characters):
   - Include primary keyword
   - Be compelling and clickable
   - Match user search intent
   - Use power words (Complete, Ultimate, Proven, etc.)

2. Focus Keyword (2-4 words):
   - Primary search term for this article
   - Specific, not generic
   - Should appear in title

3. Meta Description (MUST be 150-160 characters):
   - Summarize value proposition
   - Include focus keyword
   - End with call-to-action
   - Be compelling

Return ONLY valid JSON:
{{
  "title": "SEO title here",
  "focus_keyword": "primary keyword",
  "meta_description": "Meta description here"
}}"""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        if content.startswith('```json'):
            content = content.replace('```json\n', '').replace('```', '').strip()
        
        seo_data = json.loads(content)
        
        # Enforce length limits
        if len(seo_data['title']) > self.max_title_length:
            print(f"⚠️ Title too long ({len(seo_data['title'])}), truncating...")
            seo_data['title'] = seo_data['title'][:57] + '...'
        
        if len(seo_data['meta_description']) > self.max_meta_description_length:
            print(f"⚠️ Meta description too long, truncating...")
            seo_data['meta_description'] = seo_data['meta_description'][:157] + '...'
        
        return seo_data
    
    def _generate_article_content(self, topic: Dict, seo_data: Dict) -> str:
        """Generate comprehensive, SEO-optimized HTML content"""
        
        prompt = f"""You are an expert technical writer for DataEngineer Hub, creating content for data professionals.

Topic: {topic['title']}
Category: {topic['category']}
Focus Keyword: {seo_data['focus_keyword']}
Content Angle: {topic.get('angle', 'tutorial')}
Target Audience: {topic.get('level', 'intermediate')} level
Related Keywords: {', '.join(topic.get('keywords', []))}

Write a COMPREHENSIVE, HIGH-QUALITY blog article (1500-2500 words) in HTML format.

REQUIREMENTS:

1. STRUCTURE:
   - Start with H2 heading (Introduction)
   - Use H2 for main sections, H3 for subsections
   - Include 4-6 major sections
   - Each section should be substantial (200-400 words)

2. SEO OPTIMIZATION:
   - Use focus keyword "{seo_data['focus_keyword']}" naturally 3-5 times
   - Include related keywords throughout
   - Use semantic variations
   - First paragraph should contain focus keyword

3. CONTENT QUALITY:
   - Provide actionable, practical advice
   - Include specific examples and use cases
   - Explain concepts clearly for {topic.get('level', 'intermediate')} audience
   - Use code examples where appropriate (in <pre><code> tags)
   - Include best practices and common pitfalls

4. HTML FORMATTING:
   - Use <h2>, <h3> for headings
   - Use <p> for paragraphs
   - Use <strong> for emphasis (not <b>)
   - Use <ul>/<ol> for lists
   - Use <pre><code class="language-sql"> for code blocks
   - Use <blockquote> for important quotes/tips

5. ENGAGEMENT:
   - Write in active voice
   - Use "you" to address the reader
   - Include practical tips marked with "💡 Tip:" or "⚠️ Warning:"
   - End each section with a brief transition

6. DO NOT INCLUDE:
   - Any meta tags or <head> content
   - <html> or <body> tags
   - Conclusion section (we'll add references separately)
   - External links (we'll add those separately)

Return ONLY the HTML content, starting with the first <h2> tag."""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=16000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content_html = response.content[0].text.strip()
        
        # Clean any markdown artifacts
        if content_html.startswith('```html'):
            content_html = content_html.replace('```html\n', '').replace('```', '').strip()
        
        return content_html
    
    def _generate_references(self, topic: Dict) -> List[Dict]:
        """Generate relevant external reference links"""
        
        prompt = f"""Generate 5 authoritative external reference links for this topic:

Topic: {topic['title']}
Category: {topic['category']}
Keywords: {', '.join(topic.get('keywords', []))}

For each reference, provide:
- title: Link text
- url: Actual URL (official docs, GitHub repos, reputable tech sites)
- description: Brief 1-line description

Focus on:
- Official documentation
- GitHub repositories
- Reputable tech blogs (AWS blog, Azure blog, etc.)
- Stack Overflow discussions
- Industry standards/whitepapers

Return JSON array:
[
  {{
    "title": "Link title",
    "url": "https://example.com",
    "description": "Brief description"
  }}
]"""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        if content.startswith('```json'):
            content = content.replace('```json\n', '').replace('```', '').strip()
        
        return json.loads(content)
    
    def _generate_image_prompts(self, topic: Dict) -> List[Dict]:
        """Generate prompts for hand-drawn style images"""
        
        prompt = f"""Generate 3 image prompts for hand-drawn technical illustrations for this article:

Topic: {topic['title']}
Category: {topic['category']}

For each image, provide:
- position: where in article (feature_image, section_1, section_2)
- prompt: Detailed prompt for AI image generation in hand-drawn sketch style
- alt_text: SEO-optimized alt text

Style guide:
- Hand-drawn, sketch-like appearance
- Technical diagrams and flowcharts
- Clean, professional linework
- Minimalist color palette (blue, purple, white)
- Educational and clear

Example prompt structure:
"Hand-drawn technical sketch showing [concept], featuring [elements], in a clean minimalist style with blue and purple accents, white background, simple linework, educational diagram style"

Return JSON array:
[
  {{
    "position": "feature_image",
    "prompt": "Detailed image generation prompt",
    "alt_text": "SEO-friendly alt text with focus keyword"
  }}
]"""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        if content.startswith('```json'):
            content = content.replace('```json\n', '').replace('```', '').strip()
        
        return json.loads(content)
    
    def _generate_tags(self, topic: Dict, content: str) -> List[str]:
        """Generate relevant tags for the article"""
        
        # Extract potential tags from topic and content
        base_tags = topic.get('keywords', [])
        
        # Add category as tag
        base_tags.append(topic['category'])
        
        # Clean and deduplicate
        tags = list(set([
            tag.lower().strip() 
            for tag in base_tags 
            if len(tag) > 2
        ]))
        
        return tags[:8]  # Max 8 tags
    
    def _validate_seo(self, article: Dict):
        """Validate SEO requirements"""
        errors = []
        
        if len(article['seo_title']) > self.max_title_length:
            errors.append(f"Title too long: {len(article['seo_title'])} chars")
        
        if len(article['meta_description']) > self.max_meta_description_length:
            errors.append(f"Meta description too long: {len(article['meta_description'])} chars")
        
        if not article['focus_keyword']:
            errors.append("Missing focus keyword")
        
        # Check if focus keyword appears in content
        if article['focus_keyword'].lower() not in article['content_html'].lower():
            errors.append("Focus keyword not found in content")
        
        if errors:
            print("⚠️ SEO Validation Warnings:")
            for error in errors:
                print(f"  - {error}")
        else:
            print("✅ SEO validation passed")


def main():
    """Example usage"""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ Set ANTHROPIC_API_KEY environment variable")
        return
    
    # Example topic (from trend monitor)
    topic = {
        'title': 'Snowflake Time Travel: Complete Guide for Data Recovery',
        'category': 'snowflake',
        'keywords': ['snowflake time travel', 'data recovery', 'snowflake backup'],
        'angle': 'tutorial',
        'level': 'intermediate',
        'trend_score': 85
    }
    
    generator = ContentGenerator(api_key)
    
    print("📝 Generating complete article...\n")
    article = generator.generate_complete_article(topic)
    
    print("\n✅ Article generated successfully!\n")
    print(f"Title: {article['seo_title']} ({len(article['seo_title'])} chars)")
    print(f"Focus Keyword: {article['focus_keyword']}")
    print(f"Meta: {article['meta_description']} ({len(article['meta_description'])} chars)")
    print(f"Content Length: {len(article['content_html'])} chars")
    print(f"Tags: {', '.join(article['tags'])}")
    print(f"References: {len(article['references'])}")
    print(f"Images needed: {len(article['image_prompts'])}")
    
    # Save to file
    with open('generated_article.json', 'w') as f:
        json.dump(article, f, indent=2)
    
    print("\n💾 Article saved to generated_article.json")


if __name__ == '__main__':
    main()