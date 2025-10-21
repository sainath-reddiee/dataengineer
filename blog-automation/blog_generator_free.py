#!/usr/bin/env python3
"""
Blog Generator (FREE VERSION) - Uses Google Gemini API (Free Forever!)
Fixed with proper model and error handling
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
        
        # Use the latest flash model
        self.model = genai.GenerativeModel('gemini-flash-latest')
        
        # Configure safety settings to be less restrictive
        self.safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            },
        ]
        
        # Generation config for better output
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        print("✅ Using Google Gemini 1.5 Flash Latest (FREE tier)")
    
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
        
        # Final validation: ensure keyphrase is in content
        content_html = self._ensure_keyphrase_in_content(content_html, seo_data['focus_keyword'])

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
    
    def _safe_generate(self, prompt: str, parse_json: bool = True, retry_count: int = 3):
        """
        Safely generate content with error handling and retries
        """
        for attempt in range(retry_count):
            try:
                response = self.model.generate_content(
                    prompt,
                    safety_settings=self.safety_settings,
                    generation_config=self.generation_config
                )
                
                # Check if response has text
                if not response.text:
                    print(f"   ⚠️ Attempt {attempt + 1}: No text in response")
                    
                    # Check for blocked content
                    if hasattr(response, 'prompt_feedback'):
                        print(f"   ⚠️ Prompt feedback: {response.prompt_feedback}")
                    
                    # Check candidates
                    if hasattr(response, 'candidates') and response.candidates:
                        for candidate in response.candidates:
                            print(f"   ⚠️ Finish reason: {candidate.finish_reason}")
                            if hasattr(candidate, 'safety_ratings'):
                                print(f"   ⚠️ Safety ratings: {candidate.safety_ratings}")
                    
                    if attempt < retry_count - 1:
                        print(f"   🔄 Retrying with simplified prompt...")
                        continue
                    else:
                        raise ValueError("No valid response after retries")
                
                text = response.text.strip()
                
                # Clean and parse if needed
                if parse_json:
                    # Remove markdown code blocks
                    if '```json' in text:
                        text = text.split('```json')[1].split('```')[0].strip()
                    elif '```' in text:
                        text = text.split('```')[1].split('```')[0].strip()
                    
                    # Parse JSON
                    return json.loads(text)
                else:
                    # Clean HTML/markdown artifacts
                    if '```html' in text:
                        text = text.split('```html')[1].split('```')[0].strip()
                    elif text.startswith('```'):
                        text = text.split('```')[1].split('```')[0].strip()
                    
                    return text
                    
            except Exception as e:
                print(f"   ⚠️ Attempt {attempt + 1} failed: {str(e)[:100]}")
                if attempt < retry_count - 1:
                    print(f"   🔄 Retrying...")
                    continue
                else:
                    raise
        
        raise ValueError("Failed to generate content after all retries")
    
    def _generate_seo_metadata(self, topic: Dict) -> Dict:
        """Generate SEO metadata using FREE Gemini API"""

        prompt = f"""Generate SEO metadata for a technical blog post about data engineering.

Topic: {topic['title']}
Category: {topic.get('category', 'data-engineering')}

Generate SEO-optimized metadata following Yoast SEO best practices:
1. SEO Title: Must START with the focus keyphrase, under 60 characters, keyword-rich
2. Focus Keyphrase: 2-4 words, natural language, exactly what users search for
3. Meta Description: Must contain the focus keyphrase naturally, 150-160 characters, compelling
4. Slug: URL-friendly version of the focus keyphrase (lowercase, hyphens)
5. Secondary Keywords: 5-7 related terms

IMPORTANT:
- SEO Title MUST begin with the focus keyphrase
- Meta description MUST contain the focus keyphrase
- Slug MUST contain the focus keyphrase
- Focus keyphrase should be search-engine friendly

Return ONLY valid JSON:
{{
  "title": "Focus Keyphrase First - Rest of Title",
  "focus_keyword": "exact focus keyphrase",
  "meta_description": "Description containing focus keyphrase naturally...",
  "slug": "focus-keyphrase-in-url",
  "secondary_keywords": ["...", "..."]
}}"""

        try:
            seo_data = self._safe_generate(prompt, parse_json=True)

            # Validate and fix SEO data to ensure Yoast compliance
            seo_data = self._validate_seo_data(seo_data, topic)
            return seo_data

        except Exception as e:
            print(f"   ⚠️ SEO generation error: {e}")
            # Fallback SEO data that follows Yoast rules
            focus_kw = ' '.join(topic['title'].split()[:4]).lower()
            return {
                "title": f"{focus_kw.title()}: {topic['title'][:40]}",
                "focus_keyword": focus_kw,
                "meta_description": f"Discover how {focus_kw} can transform your data engineering workflow. Learn best practices, implementation strategies, and expert tips.",
                "slug": focus_kw.replace(' ', '-'),
                "secondary_keywords": topic.get('keywords', ['data engineering', 'tutorial'])
            }
    
    def _generate_content(self, topic: Dict, seo_data: Dict) -> str:
        """Generate main blog content using FREE Gemini API"""

        focus_keyphrase = seo_data.get('focus_keyword', topic['title'])

        prompt = f"""Write a comprehensive technical blog post in HTML format following Yoast SEO best practices.

TOPIC: {topic['title']}
CATEGORY: {topic.get('category', 'data-engineering')}
FOCUS KEYPHRASE: {focus_keyphrase}
TARGET LENGTH: 2000-2500 words

STRUCTURE:
- Start with <h2>Introduction</h2>
- Use <h2> for main sections (5-7 sections)
- Use <h3> for subsections
- Use <p> for paragraphs
- Use <ul> or <ol> for lists
- Use <pre><code class="language-sql"> for code examples
- Use <strong> for emphasis

CONTENT REQUIREMENTS:
1. Write for intermediate-level data engineers
2. Include practical examples and use cases
3. Include code snippets where relevant
4. Add tips marked with 💡 Tip: or ⚠️ Warning:
5. Write in active voice, address reader as "you"

YOAST SEO CRITICAL REQUIREMENTS:
1. The focus keyphrase "{focus_keyphrase}" MUST appear in the first paragraph of the Introduction
2. Use the focus keyphrase naturally 4-6 times throughout the content
3. The Introduction paragraph should be 150-200 words and clearly explain what the article covers
4. Use the focus keyphrase in at least one <h2> heading
5. Include the focus keyphrase in the first 10% of the content
6. Distribute the keyphrase naturally - don't stuff it

IMPORTANT:
- Return ONLY the HTML content
- Start with <h2>Introduction</h2>
- The FIRST paragraph after Introduction heading MUST contain the focus keyphrase "{focus_keyphrase}"
- Do NOT include html, head, body tags
- Do NOT include a conclusion section
- Do NOT add external links

Begin the article now:"""

        try:
            content = self._safe_generate(prompt, parse_json=False)
            
            # Validate content length
            if len(content) < 500:
                print(f"   ⚠️ Content too short ({len(content)} chars), regenerating...")
                # Try with a simpler prompt
                simple_prompt = f"""Write a detailed technical article about {topic['title']} for data engineers.

Include:
- Introduction explaining the topic
- 4-5 main sections with examples
- Best practices and tips
- Use HTML tags: h2, h3, p, ul, code

Write at least 1500 words. Return only HTML content starting with <h2>Introduction</h2>"""
                
                content = self._safe_generate(simple_prompt, parse_json=False)
            
            return content
            
        except Exception as e:
            print(f"   ⚠️ Content generation error: {e}")
            # Return minimal fallback content
            return f"""<h2>Introduction</h2>
<p>Welcome to this comprehensive guide on {topic['title']}. This article will help you understand the key concepts and best practices.</p>

<h2>What is {topic['title']}?</h2>
<p>{topic['title']} is an important concept in data engineering that helps teams build more efficient data pipelines.</p>

<h2>Key Concepts</h2>
<p>Understanding the fundamentals is crucial for success. Let's explore the main concepts.</p>

<h3>Core Principles</h3>
<p>The following principles guide effective implementation:</p>
<ul>
<li>Scalability and performance optimization</li>
<li>Data quality and validation</li>
<li>Monitoring and observability</li>
<li>Security and compliance</li>
</ul>

<h2>Best Practices</h2>
<p>💡 <strong>Tip:</strong> Always test your implementations in a development environment first.</p>

<h3>Implementation Steps</h3>
<ol>
<li>Plan your architecture carefully</li>
<li>Implement incrementally</li>
<li>Test thoroughly</li>
<li>Monitor in production</li>
</ol>

<h2>Common Challenges</h2>
<p>⚠️ <strong>Warning:</strong> Be aware of potential pitfalls and plan accordingly.</p>

<h3>Performance Considerations</h3>
<p>Performance is critical in data engineering. Consider these factors when implementing your solution.</p>

<h2>Advanced Topics</h2>
<p>Once you've mastered the basics, explore these advanced concepts to take your skills to the next level.</p>"""
    
    def _generate_image_prompts(self, topic: Dict, content: str) -> List[Dict]:
        """Generate prompts for hand-drawn style images - FREE"""
        
        prompt = f"""Generate 4 image prompts for technical illustrations.

Blog Topic: {topic['title']}
Category: {topic.get('category', 'data-engineering')}

For each image create:
- placement: hero, section-1, section-2, or diagram
- prompt: Detailed prompt for hand-drawn technical illustration (100-150 words)
- alt_text: SEO-friendly alt text (under 125 chars)
- caption: Brief caption (under 100 chars)

Style: Hand-drawn sketch, black ink on white background, technical diagrams, clean lines, minimal shading

Return ONLY valid JSON array:
[
  {{
    "placement": "hero",
    "prompt": "Hand-drawn sketch showing...",
    "alt_text": "...",
    "caption": "..."
  }}
]"""

        try:
            return self._safe_generate(prompt, parse_json=True)
        except Exception as e:
            print(f"   ⚠️ Image prompt error: {e}")
            # Fallback image prompts
            return [
                {
                    "placement": "hero",
                    "prompt": f"Hand-drawn technical sketch illustrating {topic['title']}, showing key components and workflow, minimalist style, blue and purple accents",
                    "alt_text": f"{topic['title']} overview diagram",
                    "caption": f"Overview of {topic['title']}"
                },
                {
                    "placement": "section-1",
                    "prompt": f"Technical diagram showing the architecture of {topic['title']}, hand-drawn style, clean lines",
                    "alt_text": f"{topic['title']} architecture",
                    "caption": "System architecture"
                },
                {
                    "placement": "section-2",
                    "prompt": f"Workflow diagram for {topic['title']}, hand-drawn sketch, simple flowchart style",
                    "alt_text": f"{topic['title']} workflow",
                    "caption": "Implementation workflow"
                },
                {
                    "placement": "diagram",
                    "prompt": f"Data flow diagram for {topic['title']}, hand-drawn technical illustration",
                    "alt_text": f"{topic['title']} data flow",
                    "caption": "Data flow overview"
                }
            ]
    
    def _generate_references(self, topic: Dict) -> List[Dict]:
        """Generate relevant external reference links - FREE"""
        
        prompt = f"""Generate 5-6 authoritative reference links for this topic.

Topic: {topic['title']}
Category: {topic.get('category', 'data-engineering')}

For each reference provide:
- title: Link text (under 60 chars)
- url: Real URL to official docs, GitHub, or reputable tech blogs
- description: Brief description (under 100 chars)

Focus on:
1. Official documentation
2. GitHub repositories
3. Tech company blogs
4. Industry publications

Return ONLY valid JSON array:
[
  {{
    "title": "...",
    "url": "https://...",
    "description": "..."
  }}
]"""

        try:
            return self._safe_generate(prompt, parse_json=True)
        except Exception as e:
            print(f"   ⚠️ References error: {e}")
            # Fallback references
            category = topic.get('category', 'general')
            return [
                {
                    "title": f"Official {category.title()} Documentation",
                    "url": "https://docs.snowflake.com" if category == "snowflake" else "https://aws.amazon.com/documentation/",
                    "description": "Official documentation and guides"
                },
                {
                    "title": "GitHub Examples",
                    "url": "https://github.com/topics/data-engineering",
                    "description": "Open source examples and implementations"
                },
                {
                    "title": "Stack Overflow Community",
                    "url": "https://stackoverflow.com/questions/tagged/data-engineering",
                    "description": "Community Q&A and solutions"
                }
            ]
    
    def _validate_seo_data(self, seo_data: Dict, topic: Dict) -> Dict:
        """Validate and fix SEO data to ensure Yoast SEO compliance"""
        focus_kw = seo_data.get('focus_keyword', '').strip()

        # Ensure focus keyword exists and is reasonable length
        if not focus_kw or len(focus_kw.split()) < 2:
            focus_kw = ' '.join(topic['title'].split()[:4]).lower()
            seo_data['focus_keyword'] = focus_kw

        # Ensure SEO title starts with focus keyphrase
        title = seo_data.get('title', '')
        if not title.lower().startswith(focus_kw.lower()):
            # Rebuild title to start with focus keyphrase
            if len(title) > 60:
                title = f"{focus_kw.title()} - {topic['title'][:40]}"
            else:
                title = f"{focus_kw.title()}: {topic['title']}"

        # Limit title to 60 characters
        if len(title) > 60:
            title = title[:57] + '...'
        seo_data['title'] = title

        # Ensure meta description contains focus keyphrase
        meta_desc = seo_data.get('meta_description', '')
        if focus_kw.lower() not in meta_desc.lower():
            meta_desc = f"Learn about {focus_kw} and discover best practices for implementing it in your data engineering workflow. Expert tips and strategies included."

        # Ensure meta description is 150-160 characters
        if len(meta_desc) < 150:
            meta_desc = f"{meta_desc} Discover expert insights and proven techniques."
        if len(meta_desc) > 160:
            # Find last complete sentence within 160 chars
            meta_desc = meta_desc[:157] + '...'
        seo_data['meta_description'] = meta_desc

        # Ensure slug contains focus keyphrase
        slug = seo_data.get('slug', '')
        if not slug or focus_kw.lower().replace(' ', '-') not in slug:
            slug = focus_kw.lower().replace(' ', '-')
        # Clean slug
        slug = re.sub(r'[^a-z0-9-]', '', slug.lower())
        slug = re.sub(r'-+', '-', slug).strip('-')
        seo_data['slug'] = slug

        return seo_data

    def _ensure_keyphrase_in_content(self, content: str, focus_keyphrase: str) -> str:
        """Ensure focus keyphrase appears in the introduction paragraph"""
        # Check if keyphrase is in first 500 characters
        if focus_keyphrase.lower() in content[:500].lower():
            return content

        # If not, insert it in the first paragraph after Introduction heading
        intro_pattern = r'(<h2>Introduction</h2>\s*<p>)([^<]+)'
        match = re.search(intro_pattern, content)

        if match:
            intro_text = match.group(2)
            # Add keyphrase to the beginning of the first sentence
            enhanced_intro = f"{focus_keyphrase.title()} is a critical concept in modern data engineering. {intro_text}"
            content = re.sub(intro_pattern, f'{match.group(1)}{enhanced_intro}', content, count=1)

        return content

    def _calculate_reading_time(self, content: str) -> int:
        """Calculate estimated reading time"""
        text = re.sub(r'<[^>]+>', '', content)
        words = len(text.split())
        return max(1, round(words / 225))


def main():
    """Test the FREE blog generator"""
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
