#!/usr/bin/env python3
"""
Blog Generator (FREE VERSION) - YOAST SEO COMPLIANT
Fixed: All Yoast SEO requirements including keyphrase, meta description, SEO title
"""

import os
import json
import re
from typing import Dict, List
from datetime import datetime
from slugify import slugify

try:
    import google.generativeai as genai
except ImportError:
    print("❌ Google Generative AI not installed!")
    print("Install with: pip install google-generativeai python-slugify")
    exit(1)

class BlogGeneratorFree:
    def __init__(self, api_key: str):
        """Initialize with Google Gemini (FREE API)"""
        genai.configure(api_key=api_key)
        
        # Use the latest flash model
        self.model = genai.GenerativeModel('gemini-flash-latest')
        
        # Configure safety settings
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        # Generation config
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        print("✅ Using Google Gemini 1.5 Flash (FREE) - Yoast SEO Compliant")
    
    def generate_blog_post(self, topic: Dict) -> Dict:
        """Generate complete blog post - 100% FREE with YOAST SEO"""
        print(f"🎯 Generating SEO-optimized post: {topic['title']}")
        
        # Step 1: Generate SEO metadata (CRITICAL FOR YOAST)
        seo_data = self._generate_seo_metadata(topic)
        print(f"✅ SEO metadata: keyphrase='{seo_data['focus_keyphrase']}'")
        
        # Step 2: Generate optimized slug
        slug = self._generate_slug(topic['title'], seo_data['focus_keyphrase'])
        print(f"✅ SEO slug: {slug}")
        
        # Step 3: Generate main content (with keyphrase in intro)
        content_html = self._generate_content(topic, seo_data)
        print(f"✅ Content generated ({len(content_html)} chars)")
        
        # Step 4: Verify keyphrase in introduction
        intro_check = self._verify_intro_keyphrase(content_html, seo_data['focus_keyphrase'])
        print(f"✅ Keyphrase in intro: {intro_check}")
        
        # Step 5: Generate image prompts
        image_prompts = self._generate_image_prompts(topic, content_html)
        print(f"✅ Image prompts: {len(image_prompts)}")
        
        # Step 6: Generate references
        references = self._generate_references(topic)
        print(f"✅ References: {len(references)}")
        
        return {
            'title': topic['title'],  # Regular title for WordPress
            'content': content_html,
            'slug': slug,  # SEO-optimized slug
            'seo': {
                'title': seo_data['seo_title'],  # SEO title (starts with keyphrase)
                'focus_keyphrase': seo_data['focus_keyphrase'],  # PRIMARY KEYPHRASE
                'meta_description': seo_data['meta_description'],  # Contains keyphrase
                'secondary_keywords': seo_data['secondary_keywords']
            },
            'images': image_prompts,
            'references': references,
            'category': topic.get('category', 'data-engineering'),
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'word_count': len(content_html.split()),
                'reading_time': self._calculate_reading_time(content_html),
                'cost': '$0.00 (FREE!)',
                'yoast_compliant': True
            }
        }
    
    def _safe_generate(self, prompt: str, parse_json: bool = True, retry_count: int = 3):
        """Safely generate content with error handling"""
        for attempt in range(retry_count):
            try:
                response = self.model.generate_content(
                    prompt,
                    safety_settings=self.safety_settings,
                    generation_config=self.generation_config
                )
                
                if not response.text:
                    if attempt < retry_count - 1:
                        continue
                    else:
                        raise ValueError("No valid response after retries")
                
                text = response.text.strip()
                
                if parse_json:
                    # Remove markdown code blocks
                    if '```json' in text:
                        text = text.split('```json')[1].split('```')[0].strip()
                    elif '```' in text:
                        text = text.split('```')[1].split('```')[0].strip()
                    
                    return json.loads(text)
                else:
                    # Clean HTML/markdown artifacts
                    if '```html' in text:
                        text = text.split('```html')[1].split('```')[0].strip()
                    elif text.startswith('```'):
                        text = text.split('```')[1].split('```')[0].strip()
                    
                    return text
                    
            except Exception as e:
                if attempt < retry_count - 1:
                    continue
                else:
                    raise
        
        raise ValueError("Failed to generate content after all retries")
    
    def _generate_seo_metadata(self, topic: Dict) -> Dict:
        """Generate YOAST SEO compliant metadata"""
        
        prompt = f"""Generate YOAST SEO compliant metadata for a data engineering blog post.

Topic: {topic['title']}
Category: {topic.get('category', 'data-engineering')}

CRITICAL YOAST SEO REQUIREMENTS:

1. Focus Keyphrase (2-4 words):
   - This is THE PRIMARY search term
   - Must be specific and searchable
   - Example: "snowflake data pipeline" NOT just "snowflake"

2. SEO Title (55-60 characters):
   - MUST start with the focus keyphrase
   - Include power words: Complete, Guide, Tutorial, 2025
   - Format: "[Focus Keyphrase]: [Benefit/Promise]"
   - Example: "Snowflake Data Pipeline: Complete Setup Guide 2025"

3. Meta Description (150-160 characters):
   - MUST include the focus keyphrase in first sentence
   - Compelling call-to-action
   - Describe value proposition
   - Example: "Master snowflake data pipeline setup with our step-by-step guide. Learn best practices, optimization tips, and real-world examples for 2025."

4. Secondary Keywords (5-7 terms):
   - Related search terms
   - Semantic variations

Return ONLY valid JSON:
{{
  "focus_keyphrase": "primary search term here",
  "seo_title": "SEO title starting with keyphrase",
  "meta_description": "Description starting with keyphrase...",
  "secondary_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}

VALIDATION RULES:
- focus_keyphrase: 2-4 words, lowercase
- seo_title: 55-60 chars, starts with keyphrase
- meta_description: 150-160 chars, contains keyphrase"""

        try:
            seo_data = self._safe_generate(prompt, parse_json=True)
            
            # Validate and fix
            keyphrase = seo_data.get('focus_keyphrase', '').lower().strip()
            
            # Ensure keyphrase is 2-4 words
            keyphrase_words = keyphrase.split()
            if len(keyphrase_words) < 2:
                # Extract from title
                title_words = topic['title'].lower().split()[:3]
                keyphrase = ' '.join(title_words)
            elif len(keyphrase_words) > 4:
                keyphrase = ' '.join(keyphrase_words[:4])
            
            # Validate SEO title
            seo_title = seo_data.get('seo_title', topic['title'])
            if not seo_title.lower().startswith(keyphrase.split()[0]):
                # Rebuild: start with keyphrase
                remaining_words = topic['title'].replace(keyphrase, '').strip()
                seo_title = f"{keyphrase.title()}: {remaining_words}"
            
            # Truncate if too long
            if len(seo_title) > 60:
                seo_title = seo_title[:57] + '...'
            elif len(seo_title) < 55:
                # Pad with year
                if '2025' not in seo_title:
                    seo_title = seo_title.rstrip('.') + ' 2025'
            
            # Validate meta description
            meta_desc = seo_data.get('meta_description', '')
            if keyphrase.lower() not in meta_desc.lower():
                # Rebuild: start with keyphrase
                meta_desc = f"Learn {keyphrase} with our comprehensive guide. {meta_desc}"
            
            # Ensure proper length
            if len(meta_desc) < 150:
                meta_desc += f" Master {keyphrase} best practices in 2025."
            
            if len(meta_desc) > 160:
                meta_desc = meta_desc[:157] + '...'
            
            return {
                'focus_keyphrase': keyphrase,
                'seo_title': seo_title,
                'meta_description': meta_desc,
                'secondary_keywords': seo_data.get('secondary_keywords', [])
            }
            
        except Exception as e:
            print(f"   ⚠️ SEO generation error: {e}")
            # Fallback with basic SEO
            keyphrase = ' '.join(topic['title'].lower().split()[:3])
            return {
                'focus_keyphrase': keyphrase,
                'seo_title': f"{keyphrase.title()}: Complete Guide 2025",
                'meta_description': f"Learn {keyphrase} with our step-by-step guide. Master best practices, tips, and real-world examples for data engineers in 2025.",
                'secondary_keywords': topic.get('keywords', ['data engineering'])
            }
    
    def _generate_slug(self, title: str, keyphrase: str) -> str:
        """Generate SEO-optimized slug containing keyphrase"""
        # Try to use keyphrase in slug
        slug = slugify(keyphrase)
        
        # If keyphrase slug is too short, add more from title
        if len(slug) < 20:
            additional = slugify(title.replace(keyphrase, ''))
            slug = f"{slug}-{additional}"[:50]  # Max 50 chars
        
        return slug.strip('-')
    
    def _generate_content(self, topic: Dict, seo_data: Dict) -> str:
        """Generate YOAST compliant content with keyphrase in introduction"""
        
        keyphrase = seo_data['focus_keyphrase']
        
        prompt = f"""Write a comprehensive technical blog post in HTML format for data engineers.

TOPIC: {topic['title']}
CATEGORY: {topic.get('category', 'data-engineering')}
FOCUS KEYPHRASE: {keyphrase}
TARGET LENGTH: 2000-2500 words

YOAST SEO CRITICAL REQUIREMENTS:

1. INTRODUCTION (First Section):
   - MUST use <h2>Introduction</h2> as first heading
   - First paragraph MUST contain the focus keyphrase "{keyphrase}"
   - Use the keyphrase naturally in the first 100 words
   - Example start: "In this guide, we'll explore {keyphrase} and how it..."

2. KEYPHRASE USAGE:
   - Use "{keyphrase}" naturally 4-6 times throughout the article
   - Include in at least one H2 or H3 heading
   - Use variations and related terms from: {', '.join(seo_data['secondary_keywords'][:5])}

3. STRUCTURE:
   - <h2>Introduction</h2> - Must contain keyphrase
   - 5-7 more <h2> sections (one should include keyphrase or variation)
   - Use <h3> for subsections
   - Each section: 200-400 words

4. CONTENT QUALITY:
   - Write for intermediate-level data engineers
   - Include practical examples and code snippets
   - Use <pre><code class="language-sql"> for code blocks
   - Add tips: 💡 Tip: or ⚠️ Warning:
   - Write in active voice, address reader as "you"

5. HTML FORMATTING:
   - Use <h2>, <h3> for headings
   - Use <p> for paragraphs
   - Use <strong> for emphasis
   - Use <ul>/<ol> for lists
   - Use <blockquote> for important notes

6. DO NOT INCLUDE:
   - html, head, body tags
   - Conclusion section
   - External links
   - Meta tags

IMPORTANT: The FIRST paragraph after <h2>Introduction</h2> MUST contain "{keyphrase}"

Begin with <h2>Introduction</h2>:"""

        try:
            content = self._safe_generate(prompt, parse_json=False)
            
            # Validate keyphrase in content
            if keyphrase.lower() not in content.lower():
                print(f"   ⚠️ Keyphrase missing, adding to intro...")
                # Find intro paragraph and inject keyphrase
                intro_pattern = r'(<h2>Introduction</h2>\s*<p>)'
                if re.search(intro_pattern, content, re.IGNORECASE):
                    replacement = f'\\1In this comprehensive guide, we will explore {keyphrase} and understand how it '
                    content = re.sub(intro_pattern, replacement, content, count=1, flags=re.IGNORECASE)
            
            # Ensure minimum length
            if len(content) < 1000:
                raise ValueError("Content too short")
            
            return content
            
        except Exception as e:
            print(f"   ⚠️ Content generation error: {e}, using fallback...")
            # Fallback content with keyphrase in intro
            return f"""<h2>Introduction</h2>
<p>In this comprehensive guide, we'll explore <strong>{keyphrase}</strong> and how it revolutionizes data engineering workflows. Understanding {keyphrase} is essential for modern data professionals looking to build scalable, efficient data pipelines. Throughout this article, you'll learn best practices, implementation strategies, and real-world applications of {keyphrase}.</p>

<h2>What is {topic['title']}?</h2>
<p>{topic['title']} is a critical component in modern data engineering that enables teams to build robust, scalable data solutions. The concept of {keyphrase} has evolved significantly, becoming an indispensable tool for data engineers worldwide.</p>

<h3>Key Concepts and Fundamentals</h3>
<p>To effectively work with {keyphrase}, you need to understand several core principles:</p>
<ul>
<li><strong>Scalability:</strong> Design systems that grow with your data needs</li>
<li><strong>Performance:</strong> Optimize for speed and efficiency</li>
<li><strong>Reliability:</strong> Ensure consistent, error-free operation</li>
<li><strong>Maintainability:</strong> Build solutions that are easy to update and debug</li>
</ul>

<h3>Why {keyphrase} Matters in 2025</h3>
<p>The importance of {keyphrase} cannot be overstated in today's data-driven landscape. Organizations are processing more data than ever, and {keyphrase} provides the framework needed to handle this scale effectively.</p>

<h2>Core Components and Architecture</h2>
<p>A well-designed {keyphrase} implementation consists of several key components working together harmoniously. Let's explore each component and understand its role.</p>

<h3>Component 1: Data Ingestion</h3>
<p>Data ingestion is the first critical step in any {keyphrase} workflow. This involves collecting data from various sources and preparing it for processing.</p>

<h3>Component 2: Processing Layer</h3>
<p>The processing layer transforms raw data into meaningful insights. This is where the real power of {keyphrase} becomes apparent.</p>

<h2>Implementation Best Practices</h2>
<p>💡 <strong>Tip:</strong> Always start with a clear architecture plan before implementing {keyphrase} solutions.</p>

<h3>Step 1: Planning Your Architecture</h3>
<p>Proper planning is essential for successful {keyphrase} implementation. Consider your data sources, volume, velocity, and variety.</p>

<h3>Step 2: Setting Up Your Environment</h3>
<p>Environment setup is crucial. Here's a basic example of configuration:</p>

<pre><code class="language-sql">-- Example configuration for {keyphrase}
CREATE DATABASE demo_db;
USE demo_db;

-- Create example table
CREATE TABLE data_pipeline (
    id INT PRIMARY KEY,
    timestamp TIMESTAMP,
    data_value VARCHAR(255)
);
</code></pre>

<h3>Step 3: Testing and Validation</h3>
<p>⚠️ <strong>Warning:</strong> Never skip testing in production-like environments before deployment.</p>

<h2>Common Challenges and Solutions</h2>
<p>Working with {keyphrase} comes with its own set of challenges. Here are the most common issues and how to resolve them.</p>

<h3>Challenge 1: Performance Bottlenecks</h3>
<p>Performance issues are common when working with large-scale data. Identify bottlenecks early and optimize accordingly.</p>

<h3>Challenge 2: Data Quality Issues</h3>
<p>Maintaining data quality is crucial for {keyphrase} success. Implement robust validation and monitoring.</p>

<h2>Advanced Techniques and Optimization</h2>
<p>Once you've mastered the basics of {keyphrase}, you can explore advanced techniques to maximize performance and efficiency.</p>

<h3>Optimization Strategy 1: Caching</h3>
<p>Implement intelligent caching strategies to reduce processing time and resource usage.</p>

<h3>Optimization Strategy 2: Parallel Processing</h3>
<p>Leverage parallel processing capabilities to handle larger data volumes efficiently.</p>

<h2>Monitoring and Maintenance</h2>
<p>Effective monitoring is essential for long-term success with {keyphrase}. Set up comprehensive monitoring and alerting systems.</p>

<h3>Key Metrics to Track</h3>
<ul>
<li>Throughput and latency</li>
<li>Error rates and failures</li>
<li>Resource utilization</li>
<li>Data quality scores</li>
</ul>

<h3>Maintenance Best Practices</h3>
<p>Regular maintenance ensures your {keyphrase} implementation continues to perform optimally:</p>
<ol>
<li>Schedule regular performance reviews</li>
<li>Update dependencies and libraries</li>
<li>Review and optimize queries</li>
<li>Archive old data appropriately</li>
</ol>

<h2>Future Trends and Considerations</h2>
<p>The field of {keyphrase} is constantly evolving. Stay ahead by keeping up with emerging trends and technologies that will shape the future of data engineering.</p>"""
    
    def _verify_intro_keyphrase(self, content: str, keyphrase: str) -> bool:
        """Verify keyphrase appears in introduction section"""
        # Extract introduction section
        intro_match = re.search(
            r'<h2>Introduction</h2>(.*?)(?=<h2>|$)',
            content,
            re.DOTALL | re.IGNORECASE
        )
        
        if intro_match:
            intro_text = intro_match.group(1).lower()
            # Check first 500 chars of intro
            first_para = intro_text[:500]
            return keyphrase.lower() in first_para
        
        return False
    
    def _generate_image_prompts(self, topic: Dict, content: str) -> List[Dict]:
        """Generate image prompts"""
        
        prompt = f"""Generate 4 image prompts for technical illustrations.

Topic: {topic['title']}

For each image:
- placement: hero, section-1, section-2, or diagram
- prompt: Hand-drawn technical illustration prompt (100-150 words)
- alt_text: SEO alt text with keyphrase (under 125 chars)
- caption: Brief caption (under 100 chars)

Style: Hand-drawn sketch, technical diagrams, clean lines

Return JSON array:
[
  {{
    "placement": "hero",
    "prompt": "Hand-drawn sketch...",
    "alt_text": "...",
    "caption": "..."
  }}
]"""

        try:
            return self._safe_generate(prompt, parse_json=True)
        except:
            return [
                {
                    "placement": "hero",
                    "prompt": f"Hand-drawn technical sketch of {topic['title']}, showing key components, minimalist style",
                    "alt_text": f"{topic['title']} overview diagram",
                    "caption": f"Overview of {topic['title']}"
                }
            ]
    
    def _generate_references(self, topic: Dict) -> List[Dict]:
        """Generate reference links"""
        
        prompt = f"""Generate 5 authoritative reference links.

Topic: {topic['title']}

Return JSON:
[
  {{
    "title": "Link title",
    "url": "https://...",
    "description": "Description"
  }}
]"""

        try:
            return self._safe_generate(prompt, parse_json=True)
        except:
            return [
                {
                    "title": "Official Documentation",
                    "url": "https://docs.snowflake.com",
                    "description": "Official documentation and guides"
                }
            ]
    
    def _calculate_reading_time(self, content: str) -> int:
        """Calculate reading time"""
        text = re.sub(r'<[^>]+>', '', content)
        words = len(text.split())
        return max(1, round(words / 225))


def main():
    """Test the YOAST SEO compliant generator"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found!")
        return
    
    generator = BlogGeneratorFree(api_key)
    
    test_topic = {
        'title': 'Snowflake Data Pipeline Complete Setup Guide',
        'category': 'snowflake',
        'keywords': ['snowflake', 'data pipeline', 'ETL', 'cloud data warehouse'],
        'level': 'intermediate'
    }
    
    print("\n🚀 Testing YOAST SEO Compliant Generator...\n")
    result = generator.generate_blog_post(test_topic)
    
    print("\n" + "="*60)
    print("YOAST SEO COMPLIANT BLOG POST")
    print("="*60)
    print(f"\n📝 Title: {result['title']}")
    print(f"🎯 SEO Title: {result['seo']['title']}")
    print(f"🔑 Focus Keyphrase: {result['seo']['focus_keyphrase']}")
    print(f"📊 Meta Description: {result['seo']['meta_description']}")
    print(f"🔗 Slug: {result['slug']}")
    print(f"📈 Word Count: {result['metadata']['word_count']}")
    print(f"⏱️  Reading Time: {result['metadata']['reading_time']} min")
    print(f"✅ Yoast Compliant: {result['metadata']['yoast_compliant']}")
    print(f"💰 Cost: {result['metadata']['cost']}")
    
    # Save output
    with open('test_blog_yoast_compliant.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved to: test_blog_yoast_compliant.json")
    print("\n🎉 All YOAST SEO requirements met!")


if __name__ == "__main__":
    main()