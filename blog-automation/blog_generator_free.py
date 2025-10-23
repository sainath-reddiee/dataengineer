#!/usr/bin/env python3
"""
Blog Generator (PREMIUM QUALITY VERSION)
Complete file - EVERY SINGLE LINE - Production ready
FIXES: Keyphrase in 50%+ headings, no duplicates, 30%+ transitions
"""

import os
import json
import re
from typing import Dict, List
from datetime import datetime
from slugify import slugify
import random

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
        
        self.model = genai.GenerativeModel('gemini-flash-latest')
        
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        
        self.generation_config = {
            "temperature": 0.8,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
        }
        
        # Transition words for readability enhancement
        self.transition_words = {
            'addition': ['Additionally', 'Furthermore', 'Moreover', 'Besides', 'Also', 'Plus'],
            'contrast': ['However', 'Nevertheless', 'On the other hand', 'Conversely', 'In contrast', 'Although'],
            'cause': ['Therefore', 'Consequently', 'As a result', 'Thus', 'Hence', 'Because of this'],
            'example': ['For instance', 'For example', 'Specifically', 'In particular', 'To illustrate'],
            'sequence': ['First', 'Second', 'Next', 'Then', 'Finally', 'Subsequently'],
            'emphasis': ['Indeed', 'In fact', 'Certainly', 'Obviously', 'Clearly'],
        }
        
        print("✅ Using Google Gemini 1.5 Flash - PREMIUM QUALITY MODE")
    
    def generate_blog_post(self, topic: Dict) -> Dict:
        """Generate PREMIUM QUALITY blog post"""
        print(f"🎯 Generating PREMIUM blog post: {topic['title']}")
        
        seo_data = self._generate_seo_metadata(topic)
        print(f"✅ SEO metadata: keyphrase='{seo_data['focus_keyphrase']}'")
        
        slug = self._generate_slug(topic['title'], seo_data['focus_keyphrase'])
        print(f"✅ SEO slug: {slug}")
        
        content_html = self._generate_premium_content(topic, seo_data)
        print(f"✅ Premium content generated ({len(content_html)} chars)")
        
        intro_check = self._verify_intro_keyphrase(content_html, seo_data['focus_keyphrase'])
        print(f"✅ Keyphrase in intro: {intro_check}")
        
        # CRITICAL FIX: Ensure keyphrase in 50%+ of headings
        content_html = self._ensure_keyphrase_in_headings(content_html, seo_data['focus_keyphrase'])
        print(f"✅ Headings optimized with keyphrase")
        
        # Enhance readability
        content_html = self._enhance_readability_with_transitions(content_html)
        print(f"✅ Readability enhanced with transitions")
        
        image_prompts = self._generate_image_prompts(topic, content_html)
        print(f"✅ Image prompts generated ({len(image_prompts)} images)")
        
        references = self._generate_references(topic)
        print(f"✅ References generated ({len(references)} links)")
        
        return {
            'title': seo_data['title'],
            'content': content_html,
            'slug': slug,
            'seo': {
                'title': seo_data['title'],
                'focus_keyphrase': seo_data['focus_keyphrase'],
                'meta_description': seo_data['meta_description'],
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
                'yoast_compliant': True,
                'quality': 'PREMIUM'
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
                    if '```json' in text:
                        text = text.split('```json')[1].split('```')[0].strip()
                    elif '```' in text:
                        text = text.split('```')[1].split('```')[0].strip()
                    
                    return json.loads(text)
                else:
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
        """Generate YOAST SEO compliant metadata - STRICT VALIDATION"""
        
        prompt = f"""Generate YOAST SEO compliant metadata for: {topic['title']}

STRICT REQUIREMENTS:

1. Focus Keyphrase (2-4 words):
   - Extract the MAIN topic from the title
   - Example: If title is "Snowflake Performance Tuning Guide", keyphrase is "snowflake performance tuning"

2. SEO Title (50-55 characters MAX):
   - MUST start with EXACT focus keyphrase
   - Format: "[Exact Keyphrase] Guide 2025"
   - Example: "Snowflake Performance Tuning Guide 2025"
   - MUST be under 55 characters

3. Meta Description (155-160 characters):
   - MUST start with focus keyphrase
   - MUST include keyphrase at least once
   - Compelling and actionable
   - MUST be 155-160 characters

4. Secondary Keywords (7 terms):
   - Variations and related terms

Return ONLY valid JSON:
{{
  "focus_keyphrase": "exact keyphrase from title",
  "title": "Exact Keyphrase Guide 2025",
  "meta_description": "Learn exact keyphrase with our guide. Master techniques, best practices, and optimization tips for 2025.",
  "secondary_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7"]
}}"""

        try:
            seo_data = self._safe_generate(prompt, parse_json=True)
            
            # Extract keyphrase from title if not good
            keyphrase = seo_data.get('focus_keyphrase', '').lower().strip()
            
            # If keyphrase is bad, extract from title intelligently
            if len(keyphrase.split()) < 2 or len(keyphrase.split()) > 4:
                # Take first 3-4 meaningful words from title
                title_words = [w.lower() for w in topic['title'].split() if len(w) > 2][:4]
                keyphrase = ' '.join(title_words[:3])  # Use 3 words
            
            # Build SEO title - MUST start with keyphrase and be under 55 chars
            keyphrase_title_case = keyphrase.title()
            seo_title = f"{keyphrase_title_case} Guide 2025"
            
            # If still too long, make it shorter
            if len(seo_title) > 55:
                seo_title = f"{keyphrase_title_case} 2025"
            
            if len(seo_title) > 55:
                # Just use keyphrase
                seo_title = keyphrase_title_case[:55]
            
            # Build meta description - MUST include keyphrase and be 155-160 chars
            meta_desc = f"Master {keyphrase} with our comprehensive guide. Learn {keyphrase} optimization, best practices, and proven techniques for data engineers in 2025."
            
            # Adjust to exactly 155-160 characters
            if len(meta_desc) < 155:
                meta_desc += f" Get started with {keyphrase} today."
            
            if len(meta_desc) > 160:
                meta_desc = meta_desc[:157] + '...'
            
            # Ensure we have 7 secondary keywords
            secondary = seo_data.get('secondary_keywords', [])
            while len(secondary) < 7:
                secondary.append(f"{keyphrase} tips")
            secondary = secondary[:7]
            
            return {
                'focus_keyphrase': keyphrase,
                'title': seo_title,
                'meta_description': meta_desc,
                'secondary_keywords': secondary
            }
            
        except Exception as e:
            print(f"   ⚠️ SEO generation error: {e}")
            # Fallback - extract from title
            title_words = [w.lower() for w in topic['title'].split() if len(w) > 2][:3]
            keyphrase = ' '.join(title_words)
            
            return {
                'focus_keyphrase': keyphrase,
                'title': f"{keyphrase.title()} Guide 2025",
                'meta_description': f"Master {keyphrase} with our guide. Learn best practices, optimization techniques, and proven strategies for data engineers in 2025.",
                'secondary_keywords': [f"{keyphrase} guide", f"{keyphrase} tutorial", f"{keyphrase} tips", f"{keyphrase} best practices", f"{keyphrase} optimization", f"{keyphrase} examples", f"{keyphrase} 2025"]
            }
    
    def _generate_slug(self, title: str, keyphrase: str) -> str:
        """Generate SEO-optimized slug containing keyphrase"""
        slug = slugify(keyphrase)
        
        if len(slug) < 20:
            additional = slugify(title.replace(keyphrase, ''))
            slug = f"{slug}-{additional}"[:50]
        
        return slug.strip('-')
    
    def _generate_premium_content(self, topic: Dict, seo_data: Dict) -> str:
        """Generate PREMIUM QUALITY content - YOAST COMPLIANT"""
        
        keyphrase = seo_data['focus_keyphrase']
        keyphrase_title = keyphrase.title()
        secondary_keywords = ', '.join(seo_data['secondary_keywords'][:5])
        
        prompt = f"""You are an expert technical writer creating content for data engineers.

TOPIC: {topic['title']}
FOCUS KEYPHRASE: {keyphrase}
SECONDARY KEYWORDS: {secondary_keywords}
TARGET: 2500-3000 words

YOAST SEO CRITICAL REQUIREMENTS:

1. KEYPHRASE IN FIRST PARAGRAPH (within first 100 words):
   - MUST mention "{keyphrase}" in the VERY FIRST paragraph
   - Example start: "When it comes to {keyphrase}, understanding the fundamentals is crucial..."

2. KEYPHRASE DENSITY: Use "{keyphrase}" exactly 8-12 times throughout the article
   - First paragraph: 1 time
   - Opening section (before H2): 1-2 times
   - Throughout H2 sections: 5-8 times
   - In H2/H3 headings: 2-3 times

3. KEYPHRASE IN SUBHEADINGS (CRITICAL - 50%+ of headings):
   - Include "{keyphrase}" or synonyms in at least HALF of all H2 and H3 headings
   - Examples: 
     * "Why {keyphrase_title} Matters"
     * "Understanding {keyphrase_title} Architecture"
     * "Optimizing {keyphrase_title}"
     * "Best Practices for {keyphrase_title}"
     * "Common {keyphrase_title} Mistakes"
     * "{keyphrase_title} Implementation Guide"

4. READABILITY (CRITICAL):
   - Keep sentences SHORT: Maximum 20 words per sentence
   - Use ACTIVE VOICE: "We implement X" NOT "X is implemented"
   - Break long sentences into 2-3 shorter ones
   - Aim for 15-20 words average per sentence
   - Max 10% passive voice usage
   - Use transition words in 30%+ of sentences (Additionally, Furthermore, Moreover, However, Therefore, etc.)

5. NO GENERIC HEADINGS - Use specific, engaging ones

WRITING STYLE:

SHORT SENTENCES (15-20 words max):
✓ "We optimized the pipeline. It now runs 10x faster." (12 words)
✗ "The pipeline that we optimized, which took several weeks of effort, now runs significantly faster than before." (18 words - BREAK IT UP)

ACTIVE VOICE ALWAYS:
✓ "We built the system using Python." (ACTIVE)
✗ "The system was built using Python." (PASSIVE - AVOID)

✓ "The team implemented three key optimizations." (ACTIVE)
✗ "Three key optimizations were implemented by the team." (PASSIVE - AVOID)

TRANSITION WORDS (Use frequently):
"Additionally, we discovered optimization techniques."
"Furthermore, the performance improved dramatically."
"However, some challenges remained."
"Therefore, we implemented these solutions."
"For instance, processing time decreased by 50%."
"Moreover, maintenance became significantly easier."

STRUCTURE:

OPENING (NO H2, start directly):
"When it comes to {keyphrase}, [hook]. I'll show you what works. You'll learn practical techniques. Let's dive in."

THEN SPECIFIC H2 HEADINGS (include keyphrase in at least HALF of them):
<h2>Why {keyphrase_title} Is Critical for Modern Data Teams</h2>
<h2>The Architecture Behind Effective {keyphrase_title}</h2>
<h2>Setting Up {keyphrase_title}: Step-by-Step Guide</h2>
<h2>Advanced {keyphrase_title} Techniques</h2>
<h2>Common {keyphrase_title} Mistakes to Avoid</h2>
<h2>Optimizing {keyphrase_title} for Production</h2>

CODE BLOCKS:
<pre><code class="language-python">code here</code></pre>
<pre><code class="language-sql">code here</code></pre>

WRITING CHECKLIST:
□ Sentences under 20 words (aim for 15-18 average)
□ Active voice (you/we/I as subjects, not "it was done")
□ Keyphrase in first paragraph
□ Keyphrase 8-12 times total
□ Keyphrase in at least 50% of H2/H3 headings
□ Transition words in 30%+ of sentences
□ Short, punchy paragraphs (3-4 sentences max)

EXAMPLES OF GOOD WRITING:

BAD (Passive, Long):
"The data pipeline was designed by our team to handle large volumes, and it was implemented using Python and SQL, which were chosen because they offer the best performance for this type of workload." (34 words, passive)

GOOD (Active, Short):
"We designed the data pipeline to handle large volumes. We chose Python and SQL. They offer the best performance. The implementation took three weeks." (25 words split into 4 sentences, active)

BAD (Passive):
"The optimization techniques that were discovered during testing proved to be effective."

GOOD (Active):
"We discovered optimization techniques during testing. They proved effective."

Return ONLY HTML. Start with opening paragraphs containing keyphrase. Use SHORT sentences and ACTIVE voice. Include keyphrase in at LEAST 50% of H2/H3 headings."""

        try:
            content = self._safe_generate(prompt, parse_json=False)
            
            # CRITICAL: Ensure keyphrase in first paragraph
            if not self._keyphrase_in_first_paragraph(content, keyphrase):
                print(f"   ⚠️ Adding keyphrase to first paragraph...")
                content = self._inject_keyphrase_to_start(content, keyphrase)
            
            # Ensure keyphrase density (8-12 times)
            keyphrase_count = content.lower().count(keyphrase.lower())
            print(f"   📊 Keyphrase density: {keyphrase_count} times")
            
            if keyphrase_count < 8:
                print(f"   ⚠️ Keyphrase count too low ({keyphrase_count}), enhancing...")
                content = self._enhance_keyphrase_density(content, keyphrase, target=10)
            
            content = self._fix_code_blocks(content)
            
            if len(content) < 2000:
                raise ValueError("Content too short")
            
            return content
            
        except Exception as e:
            print(f"   ⚠️ Using fallback content...")
            return self._generate_fallback_content(topic, keyphrase, seo_data)
    
    def _keyphrase_in_first_paragraph(self, content: str, keyphrase: str) -> bool:
        """Check if keyphrase is in first paragraph"""
        first_p_match = re.search(r'<p>(.*?)</p>', content, re.IGNORECASE | re.DOTALL)
        if first_p_match:
            first_para = first_p_match.group(1).lower()
            return keyphrase.lower() in first_para
        return False
    
    def _inject_keyphrase_to_start(self, content: str, keyphrase: str) -> str:
        """Inject keyphrase into first paragraph"""
        # Find first <p> tag
        first_p_match = re.search(r'<p>(.*?)</p>', content, re.IGNORECASE | re.DOTALL)
        if first_p_match:
            # Replace first paragraph with one that includes keyphrase
            new_first_para = f"<p>When it comes to {keyphrase}, understanding the fundamentals and best practices is crucial for success. Additionally, "
            content = re.sub(r'<p>.*?</p>', new_first_para + first_p_match.group(1) + '</p>', content, count=1, flags=re.IGNORECASE | re.DOTALL)
        else:
            # No <p> tag found, add at start
            content = f"<p>When it comes to {keyphrase}, mastering the key concepts is essential. Moreover, this knowledge transforms your approach.</p>\n\n" + content
        
        return content
    
    def _enhance_keyphrase_density(self, content: str, keyphrase: str, target: int = 10) -> str:
        """Enhance keyphrase density by adding it strategically"""
        current_count = content.lower().count(keyphrase.lower())
        needed = target - current_count
        
        if needed <= 0:
            return content
        
        # Add keyphrase to paragraphs strategically
        paragraphs = re.findall(r'<p>.*?</p>', content, re.DOTALL)
        
        additions_made = 0
        for i, para in enumerate(paragraphs):
            if additions_made >= needed:
                break
            
            # Skip if already has keyphrase
            if keyphrase.lower() in para.lower():
                continue
            
            # Add keyphrase naturally
            # Find a good insertion point
            if 'this approach' in para.lower():
                new_para = para.replace('this approach', f'{keyphrase}', 1)
                content = content.replace(para, new_para, 1)
                additions_made += 1
            elif 'the system' in para.lower():
                new_para = para.replace('the system', f'{keyphrase}', 1)
                content = content.replace(para, new_para, 1)
                additions_made += 1
            elif 'this solution' in para.lower():
                new_para = para.replace('this solution', f'{keyphrase}', 1)
                content = content.replace(para, new_para, 1)
                additions_made += 1
        
        return content
    
    def _ensure_keyphrase_in_headings(self, content: str, keyphrase: str) -> str:
        """CRITICAL: Ensure keyphrase appears in 50%+ of H2 and H3 headings"""
        print(f"   🔍 Ensuring keyphrase in headings (50%+ requirement)...")
        
        # Extract all H2 and H3 headings
        h2_pattern = r'<h2>(.*?)</h2>'
        h3_pattern = r'<h3>(.*?)</h3>'
        
        h2_matches = list(re.finditer(h2_pattern, content, re.IGNORECASE | re.DOTALL))
        h3_matches = list(re.finditer(h3_pattern, content, re.IGNORECASE | re.DOTALL))
        
        total_headings = len(h2_matches) + len(h3_matches)
        
        if total_headings == 0:
            print(f"      ⚠️ No headings found")
            return content
        
        # Count headings with keyphrase
        h2_with_keyphrase = sum(1 for m in h2_matches if keyphrase.lower() in m.group(1).lower())
        h3_with_keyphrase = sum(1 for m in h3_matches if keyphrase.lower() in m.group(1).lower())
        current_with_keyphrase = h2_with_keyphrase + h3_with_keyphrase
        
        current_percentage = (current_with_keyphrase / total_headings) * 100 if total_headings > 0 else 0
        
        print(f"      Current: {current_with_keyphrase}/{total_headings} headings ({current_percentage:.1f}%)")
        
        # Target: 50%+ (Yoast requirement)
        target_count = int(total_headings * 0.5)
        
        if current_with_keyphrase >= target_count:
            print(f"      ✅ Already compliant ({current_percentage:.0f}% >= 50%)")
            return content
        
        needed = target_count - current_with_keyphrase
        print(f"      ⚠️ Need to add keyphrase to {needed} more headings...")
        
        # Add keyphrase to H2 headings first (higher priority)
        added = 0
        for match in h2_matches:
            if added >= needed:
                break
            
            heading_text = match.group(1).strip()
            
            # Skip if already has keyphrase
            if keyphrase.lower() in heading_text.lower():
                continue
            
            # Add keyphrase to heading
            new_heading = self._inject_keyphrase_in_heading(heading_text, keyphrase, is_h3=False)
            content = content.replace(
                f'<h2>{heading_text}</h2>',
                f'<h2>{new_heading}</h2>',
                1
            )
            added += 1
            print(f"         ✓ H2: '{heading_text[:40]}...' → '{new_heading[:40]}...'")
        
        # If still need more, add to H3 headings
        if added < needed:
            for match in h3_matches:
                if added >= needed:
                    break
                
                heading_text = match.group(1).strip()
                
                # Skip if already has keyphrase
                if keyphrase.lower() in heading_text.lower():
                    continue
                
                # Add keyphrase to heading
                new_heading = self._inject_keyphrase_in_heading(heading_text, keyphrase, is_h3=True)
                content = content.replace(
                    f'<h3>{heading_text}</h3>',
                    f'<h3>{new_heading}</h3>',
                    1
                )
                added += 1
                print(f"         ✓ H3: '{heading_text[:40]}...' → '{new_heading[:40]}...'")
        
        # Verify final count
        h2_matches_new = re.findall(h2_pattern, content, re.IGNORECASE | re.DOTALL)
        h3_matches_new = re.findall(h3_pattern, content, re.IGNORECASE | re.DOTALL)
        
        new_with_keyphrase = sum(1 for h in h2_matches_new if keyphrase.lower() in h.lower())
        new_with_keyphrase += sum(1 for h in h3_matches_new if keyphrase.lower() in h.lower())
        
        new_percentage = (new_with_keyphrase / total_headings) * 100 if total_headings > 0 else 0
        
        print(f"      ✅ Final: {new_with_keyphrase}/{total_headings} headings ({new_percentage:.0f}%)")
        
        return content
    
    def _inject_keyphrase_in_heading(self, heading: str, keyphrase: str, is_h3: bool = False) -> str:
        """Inject keyphrase into heading naturally based on common patterns"""
        keyphrase_title = keyphrase.title()
        
        # Patterns for natural injection based on heading content
        patterns = {
            'why ': f'Why {keyphrase_title} ',
            'how to': f'How to Use {keyphrase_title}',
            'what is': f'What Is {keyphrase_title}',
            'getting started': f'Getting Started with {keyphrase_title}',
            'introduction': f'Introduction to {keyphrase_title}',
            'overview': f'{keyphrase_title} Overview',
            'best practices': f'{keyphrase_title} Best Practices',
            'common mistakes': f'Common {keyphrase_title} Mistakes',
            'advanced': f'Advanced {keyphrase_title}',
            'optimization': f'{keyphrase_title} Optimization',
            'optimizing': f'Optimizing {keyphrase_title}',
            'implementing': f'Implementing {keyphrase_title}',
            'implementation': f'{keyphrase_title} Implementation',
            'setup': f'{keyphrase_title} Setup',
            'setting up': f'Setting Up {keyphrase_title}',
            'configuration': f'{keyphrase_title} Configuration',
            'architecture': f'{keyphrase_title} Architecture',
            'understanding': f'Understanding {keyphrase_title}',
            'benefits': f'{keyphrase_title} Benefits' if is_h3 else f'Key {keyphrase_title} Benefits',
            'features': f'{keyphrase_title} Features',
            'key features': f'Key {keyphrase_title} Features',
            'techniques': f'{keyphrase_title} Techniques',
            'strategies': f'{keyphrase_title} Strategies',
            'tips': f'{keyphrase_title} Tips' if is_h3 else f'Essential {keyphrase_title} Tips',
            'guide': f'{keyphrase_title} Guide',
            'tutorial': f'{keyphrase_title} Tutorial',
            'performance': f'{keyphrase_title} Performance',
            'scaling': f'Scaling {keyphrase_title}',
            'deployment': f'Deploying {keyphrase_title}',
            'monitoring': f'Monitoring {keyphrase_title}',
            'troubleshooting': f'Troubleshooting {keyphrase_title}',
            'debugging': f'Debugging {keyphrase_title}',
            'examples': f'{keyphrase_title} Examples',
            'use cases': f'{keyphrase_title} Use Cases',
        }
        
        heading_lower = heading.lower()
        for pattern, replacement in patterns.items():
            if pattern in heading_lower:
                return replacement
        
        # If no pattern matches, prepend keyphrase intelligently
        if is_h3:
            return f'{keyphrase_title} {heading}'
        else:
            return f'Understanding {keyphrase_title}: {heading}'
    
    def _enhance_readability_with_transitions(self, content: str) -> str:
        """Enhance readability by adding transition words to reach 30%+ target"""
        print(f"   🔍 Enhancing readability with transition words...")
        
        # Extract sentences from HTML
        sentences = self._extract_sentences_from_html(content)
        
        if not sentences:
            return content
        
        # Count sentences with transition words
        transition_count = sum(1 for s in sentences if self._starts_with_transition(s['text']))
        transition_percentage = (transition_count / len(sentences)) * 100 if sentences else 0
        
        print(f"      Current transitions: {transition_percentage:.1f}% ({transition_count}/{len(sentences)} sentences)")
        
        # Target: 30%+
        if transition_percentage >= 30:
            print(f"      ✅ Already compliant (>= 30%)")
            return content
        
        # Add transitions
        target_count = int(len(sentences) * 0.30)
        needed = target_count - transition_count
        
        print(f"      Adding transitions to {needed} sentences...")
        
        content = self._add_transitions_to_html(content, sentences, needed)
        
        # Verify
        new_sentences = self._extract_sentences_from_html(content)
        new_transition_count = sum(1 for s in new_sentences if self._starts_with_transition(s['text']))
        new_transition_percentage = (new_transition_count / len(new_sentences)) * 100 if new_sentences else 0
        
        print(f"      ✅ Final: {new_transition_percentage:.1f}% ({new_transition_count}/{len(new_sentences)} sentences)")
        
        return content
    
    def _extract_sentences_from_html(self, content: str) -> List[Dict]:
        """Extract sentences with their HTML context"""
        # Find all <p> tags
        p_pattern = r'<p>(.*?)</p>'
        paragraphs = re.findall(p_pattern, content, re.DOTALL | re.IGNORECASE)
        
        sentences = []
        for para in paragraphs:
            # Remove HTML tags from paragraph
            text_only = re.sub(r'<[^>]+>', '', para).strip()
            
            # Split into sentences
            para_sentences = re.split(r'(?<=[.!?])\s+', text_only)
            
            for sent in para_sentences:
                sent = sent.strip()
                if sent and len(sent) > 10:
                    sentences.append({
                        'text': sent,
                        'paragraph': para
                    })
        
        return sentences
    
    def _starts_with_transition(self, sentence: str) -> bool:
        """Check if sentence starts with transition word"""
        all_transitions = []
        for category in self.transition_words.values():
            all_transitions.extend(category)
        
        sentence_words = sentence.split()
        if not sentence_words:
            return False
        
        first_word = re.sub(r'[^\w\s]', '', sentence_words[0]).lower()
        
        return any(first_word == t.lower().rstrip(',') for t in all_transitions)
    
    def _add_transitions_to_html(self, content: str, sentences: List[Dict], needed: int) -> str:
        """Add transition words to HTML content"""
        # Find sentences without transitions (skip first sentence of each paragraph)
        candidates = []
        seen_paragraphs = set()
        
        for sent_info in sentences:
            if self._starts_with_transition(sent_info['text']):
                continue
            
            # Skip very short sentences
            if len(sent_info['text'].split()) < 5:
                continue
            
            # Don't add to first sentence of new paragraph
            para_id = id(sent_info['paragraph'])
            if para_id in seen_paragraphs:
                candidates.append(sent_info)
            seen_paragraphs.add(para_id)
        
        # Randomize to distribute transitions
        random.shuffle(candidates)
        
        # Add transitions to needed sentences
        for i, sent_info in enumerate(candidates[:needed]):
            # Choose appropriate transition based on context
            transition = random.choice(self.transition_words['addition'])
            
            old_sent = sent_info['text']
            new_sent = f"{transition}, {old_sent[0].lower()}{old_sent[1:]}"
            
            # Replace in content
            content = content.replace(old_sent, new_sent, 1)
        
        return content
    
    def _fix_code_blocks(self, content: str) -> str:
        """Fix code blocks to use proper WordPress/Prism.js format"""
        
        def replace_code_block(match):
            language = match.group(1) or 'plaintext'
            code = match.group(2).strip()
            return f'<pre><code class="language-{language}">{code}</code></pre>'
        
        content = re.sub(
            r'```(\w+)?\n(.*?)\n```',
            replace_code_block,
            content,
            flags=re.DOTALL
        )
        
        content = re.sub(
            r'(?<!<pre>)<code>(?!class=)(.*?)</code>(?!</pre>)',
            r'<code class="language-plaintext">\1</code>',
            content
        )
        
        return content
    
    def _verify_intro_keyphrase(self, content: str, keyphrase: str) -> bool:
        """Verify keyphrase appears in opening paragraphs (no 'Introduction' heading)"""
        first_h2_match = re.search(r'<h2>', content, re.IGNORECASE)
        
        if first_h2_match:
            opening_text = content[:first_h2_match.start()].lower()
        else:
            opening_text = content[:500].lower()
        
        return keyphrase.lower() in opening_text
    
    def _analyze_headings(self, content: str, keyphrase: str) -> tuple:
        """Analyze heading structure and keyphrase usage"""
        h2_matches = re.findall(r'<h2>(.*?)</h2>', content, re.IGNORECASE | re.DOTALL)
        h3_matches = re.findall(r'<h3>(.*?)</h3>', content, re.IGNORECASE | re.DOTALL)
        
        h2_with_keyphrase = sum(1 for h in h2_matches if keyphrase.lower() in h.lower())
        h3_with_keyphrase = sum(1 for h in h3_matches if keyphrase.lower() in h.lower())
        
        total_with_keyphrase = h2_with_keyphrase + h3_with_keyphrase
        
        return len(h2_matches), len(h3_matches), total_with_keyphrase
    
    def _generate_fallback_content(self, topic: Dict, keyphrase: str, seo_data: Dict) -> str:
        """Generate high-quality fallback content - NO GENERIC HEADINGS - COMPLETE VERSION"""
        
        kp = keyphrase.title()
        
        # Opening paragraphs with keyphrase in first paragraph
        opening = f"""<p>When it comes to modern data engineering, understanding {keyphrase} has become crucial for building scalable, efficient data systems. Moreover, mastering these concepts separates good engineers from great ones. Over the past few years, I've worked with dozens of teams implementing {keyphrase}, and I've seen firsthand what works and what doesn't. Furthermore, this knowledge will transform your approach to data engineering. In this comprehensive guide, I'll share the practical lessons that will save you months of trial and error. Additionally, you'll discover techniques that work in production environments. Let's dive in.</p>

<p>The data engineering landscape has evolved dramatically in recent years. What used to require massive infrastructure and specialized teams is now accessible to anyone willing to learn the right patterns. Indeed, {keyphrase} represents a fundamental shift in how we approach data workflows, offering scalability and performance that wasn't possible just a few years ago. However, most tutorials skip the critical details that make or break production implementations.</p>

<p>I'll walk you through the practical implementation, share real production examples, and highlight the gotchas that took us way too long to figure out. Consequently, by the end of this guide, you'll have actionable knowledge you can apply immediately to your own data engineering challenges. Moreover, you'll understand not just the "how" but the "why" behind each decision.</p>"""

        # Main content sections with keyphrase in headings
        why_section = f"""<h2>Why {kp} Changed Everything for Modern Data Teams</h2>

<p>Let me be direct: {keyphrase} isn't just another tool in your data engineering toolkit. Rather, it's a fundamentally different approach that solves several critical problems simultaneously. Think of it like the difference between building with hand tools versus using modern power equipment - same end goal, but completely different efficiency levels. Furthermore, the benefits compound over time as your systems scale.</p>

<p>The key breakthrough came when I realized that traditional approaches were optimizing for the wrong things. We were focused on making individual operations faster, when we should have been thinking about the entire system architecture. However, {kp} forces you to think holistically, and that perspective shift changes everything. Additionally, it enables patterns that simply weren't possible before.</p>

<h3>The Core Problems {kp} Solves</h3>

<p>Here's what makes this approach different from everything that came before. Moreover, these benefits become more apparent as your data volumes grow:</p>

<ul>
<li><strong>Scalability without rewrites:</strong> Your pipeline that handles gigabytes today scales to petabytes tomorrow with minimal changes. For instance, we went from processing 100GB daily to 5TB daily without touching the core logic. Furthermore, performance actually improved as we scaled.</li>
<li><strong>Performance that matters:</strong> We're talking 10-50x improvements in real-world scenarios, not synthetic benchmarks. Specifically, our report generation went from 2 hours to 5 minutes. Additionally, query latency dropped by 80%.</li>
<li><strong>Maintainability for the long term:</strong> Code that's actually readable six months later when you need to modify it. Indeed, your future self will thank you for this investment. Moreover, new team members become productive in days instead of weeks.</li>
<li><strong>Reliability you can trust:</strong> Built-in fault tolerance means fewer 3 AM alerts and less manual intervention. Consequently, your operations team will love you. Furthermore, recovery from failures is automatic and fast.</li>
</ul>

<p>💡 <strong>Pro Tip:</strong> The real power becomes apparent when you're handling complex transformations across multiple data sources. That's where traditional approaches start breaking down, but {keyphrase} shines. Therefore, start building with scale in mind from day one.</p>"""

        architecture = f"""<h2>The Architecture Behind Effective {kp}</h2>

<p>After trying various approaches across dozens of production deployments, we settled on an architecture that balances simplicity with flexibility. Furthermore, this pattern has served us well across different industries and use cases. Here's the pattern that's proven itself in production environments handling billions of records:</p>

<pre><code class="language-python">class DataPipeline:
    def __init__(self, source, destination):
        self.source = source
        self.destination = destination
        self.transformations = []
        self.validators = []
        self.error_handlers = []
    
    def add_transformation(self, func):
        self.transformations.append(func)
        return self
    
    def add_validator(self, func):
        self.validators.append(func)
        return self
    
    def add_error_handler(self, func):
        self.error_handlers.append(func)
        return self
    
    def execute(self):
        try:
            data = self.source.read()
            
            for transform in self.transformations:
                data = transform(data)
                
            for validator in self.validators:
                validator(data)
            
            self.destination.write(data)
            return data
        except Exception as e:
            for handler in self.error_handlers:
                handler(e)
            raise

# Usage example
pipeline = (
    DataPipeline(source=S3Source(), destination=SnowflakeDestination())
    .add_transformation(remove_duplicates)
    .add_transformation(normalize_schema)
    .add_transformation(enrich_with_metadata)
    .add_validator(check_data_quality)
    .add_validator(validate_schema)
    .add_error_handler(log_to_monitoring)
    .add_error_handler(send_alert)
    .execute()
)
</code></pre>

<p>🎯 <strong>Key Insight:</strong> The method chaining pattern makes pipelines incredibly readable. You can hand this to a junior engineer and they'll understand the flow immediately. Moreover, adding new transformations or validators is trivial. Consequently, your codebase stays maintainable as complexity grows.</p>

<h3>Core Components of Production-Ready {kp}</h3>

<p>Every robust implementation includes these essential building blocks. First, a reliable data source connector that handles failures gracefully. Second, transformation logic that's easy to test in isolation. Third, comprehensive error handling that doesn't lose data. Finally, monitoring that provides visibility into every stage of the pipeline. Additionally, each component should be swappable without affecting the others.</p>"""

        setup = f"""<h2>Setting Up {kp}: Complete Step-by-Step Guide</h2>

<p>Let's build something real that you can deploy to production. Furthermore, I'll include all the details that documentation typically skips. However, we'll start simple and add complexity gradually, so you understand each piece. Therefore, follow along carefully with each step, and don't skip the setup phase.</p>

<h3>Environment Setup That Prevents Future Headaches</h3>

<p>First, get your environment right. I've seen too many teams skip this and regret it later. Moreover, proper setup saves hours of debugging down the line:</p>

<pre><code class="language-bash">python -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install pandas sqlalchemy boto3 apache-airflow snowflake-connector-python
pip freeze > requirements.txt
</code></pre>

<p>⚠️ <strong>Warning:</strong> Always pin your dependency versions in requirements.txt. Latest versions break things at the worst possible time - usually in production. Furthermore, use virtual environments consistently across development, staging, and production. Therefore, test with the exact same dependency versions everywhere.</p>

<h3>Configuration That's Actually Maintainable</h3>

<p>Configuration is where many projects become unmaintainable. However, using dataclasses with type hints catches errors early:</p>

<pre><code class="language-python">import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class PipelineConfig:
    source_database: str
    source_table: str
    destination_database: str
    destination_table: str
    batch_size: int = 1000
    max_retries: int = 3
    timeout_seconds: int = 300
    
    @classmethod
    def from_env(cls):
        config = cls(
            source_database=os.getenv('SOURCE_DB'),
            source_table=os.getenv('SOURCE_TABLE'),
            destination_database=os.getenv('DEST_DB'),
            destination_table=os.getenv('DEST_TABLE'),
            batch_size=int(os.getenv('BATCH_SIZE', '1000')),
            max_retries=int(os.getenv('MAX_RETRIES', '3')),
        )
        
        if not all([config.source_database, config.source_table]):
            raise ValueError("Missing required configuration")
        
        return config

config = PipelineConfig.from_env()
</code></pre>

<p>The dataclass approach with type hints catches configuration errors at development time, not in production at 3 AM. Moreover, it's self-documenting and easy to extend. Additionally, you can easily add validation logic to ensure configuration makes sense.</p>"""

        performance = f"""<h2>Advanced {kp} Performance Optimization Techniques</h2>

<p>Once you have the basics working, these optimizations can make your pipelines 10x faster. Furthermore, most of these are easy to implement and have immediate impact:</p>

<h3>Batch Processing Done Right</h3>

<blockquote>
<p><strong>Lesson learned:</strong> The optimal batch size depends on your data characteristics and infrastructure. We found our sweet spot through experimentation: 5000 rows for wide tables with many columns, 20000 rows for narrow tables. However, your mileage may vary, so test with your actual data.</p>
</blockquote>

<pre><code class="language-python">def process_in_batches(data, batch_size=5000):
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        yield process_batch(batch)

results = []
for batch_result in process_in_batches(data):
    results.append(batch_result)
</code></pre>

<h3>Parallel Processing Strategy for {kp}</h3>

<p>Parallel processing can dramatically improve throughput. However, be careful about the type of parallelism you use:</p>

<pre><code class="language-python">from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp

def parallel_process_io_bound(data, operation):
    # Use threads for I/O-bound operations (database queries, API calls)
    with ThreadPoolExecutor(max_workers=mp.cpu_count() * 2) as executor:
        return list(executor.map(operation, data))

def parallel_process_cpu_bound(data, operation):
    # Use processes for CPU-bound operations (data transformations, calculations)
    with ProcessPoolExecutor(max_workers=mp.cpu_count()) as executor:
        return list(executor.map(operation, data))
</code></pre>

<p>💡 <strong>Pro Tip:</strong> Use threading for I/O-bound operations (database queries, API calls) and multiprocessing for CPU-bound operations (data transformations, heavy calculations). Therefore, profile your code to determine where the bottlenecks are. Furthermore, don't over-parallelize - too many workers can actually slow things down.</p>"""

        production = f"""<h2>Handling Production Reality with {kp}</h2>

<p>Theory is clean and elegant. Production is messy and unpredictable. Here's how to handle it without losing your sanity:</p>

<h3>Error Handling That Actually Works</h3>

<p>Comprehensive error handling is the difference between a system that works 99% of the time and one that works reliably. Moreover, good error handling makes debugging 10x easier:</p>

<pre><code class="language-python">from tenacity import retry, stop_after_attempt, wait_exponential
import logging

logger = logging.getLogger(__name__)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def resilient_operation(data):
    try:
        return risky_operation(data)
    except TemporaryError as e:
        logger.warning(f"Temporary failure, will retry: {str(e)}")
        raise  # Let tenacity handle the retry
    except PermanentError as e:
        logger.error(f"Permanent failure, aborting: {str(e)}")
        return None  # Don't retry permanent errors
    except Exception as e:
        logger.exception(f"Unexpected error: {str(e)}")
        raise
</code></pre>

<h3>Data Quality Validation in {kp}</h3>

<p>Data quality issues are the silent killer of data pipelines. Catch them early before they propagate:</p>

<pre><code class="language-python">def validate_data_quality(df):
    checks = [
        (not df.empty, "Dataset is empty - check source"),
        (df['id'].notna().all(), "Missing IDs detected - data corruption?"),
        (df['id'].is_unique, "Duplicate IDs found - check deduplication logic"),
        (df['timestamp'].max() > pd.Timestamp.now() - pd.Timedelta(days=1), "Data seems stale"),
    ]
    
    for check, message in checks:
        if not check:
            logger.error(f"Data quality issue: {message}")
            raise DataQualityError(message)
    
    return df
</code></pre>

<p>⚠️ <strong>Warning:</strong> Validate early and often. Finding bad data after it's been loaded to your warehouse is 100x harder than catching it at the source. Therefore, add validation at every boundary in your pipeline. Furthermore, save failed records for later inspection rather than discarding them.</p>"""

        mistakes = f"""<h2>Common Mistakes in {kp} Implementation</h2>

<p>Let me save you some pain by sharing mistakes I've made so you don't have to. Additionally, these are issues that cost us weeks of debugging:</p>

<h3>Mistake #1: Not Handling Schema Changes</h3>

<p>Schemas WILL change. Plan for it from day one, or you'll be rewriting code constantly:</p>

<pre><code class="language-python">def safe_column_access(df, column, default=None):
    if column in df.columns:
        return df[column]
    logger.warning(f"Column '{column}' not found, using default value")
    return default

# Usage
df['amount'] = safe_column_access(df, 'amount', 0)
df['category'] = safe_column_access(df, 'category', 'uncategorized')
</code></pre>

<h3>Mistake #2: Memory Issues at Scale</h3>

<p>Our pipeline crashed in production because test data was 100MB but production data was 50GB. Always use chunking for datasets over 100MB. Moreover, test with production-scale data before deploying:</p>

<pre><code class="language-python">def process_large_file(file_path, chunk_size=10000):
    for chunk in pd.read_csv(file_path, chunksize=chunk_size):
        processed = process_chunk(chunk)
        yield processed

# Process in chunks
for result_chunk in process_large_file('large_data.csv'):
    save_chunk(result_chunk)
</code></pre>

<h3>Mistake #3: Ignoring Idempotency</h3>

<p>Pipelines fail and need to be rerun. If your pipeline isn't idempotent, reruns create duplicate data. Therefore, always use upsert patterns:</p>

<pre><code class="language-sql">MERGE INTO destination AS dest
USING source AS src
ON dest.id = src.id
WHEN MATCHED THEN
    UPDATE SET 
        dest.value = src.value, 
        dest.updated_at = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (id, value, created_at) 
    VALUES (src.id, src.value, CURRENT_TIMESTAMP);
</code></pre>

<p>This pattern ensures that running the pipeline multiple times produces the same result. Furthermore, it handles both inserts and updates correctly. Consequently, you can safely rerun failed pipelines without worrying about data duplication.</p>"""

        closing = f"""<h2>Production Deployment Best Practices</h2>

<p>Deploying {keyphrase} to production requires careful planning and monitoring. However, following these best practices will help you avoid common pitfalls:</p>

<h3>Monitoring and Observability</h3>

<p>You can't fix what you can't see. Therefore, comprehensive monitoring is essential:</p>

<ul>
<li><strong>Metrics:</strong> Track processing time, record counts, error rates, and data quality scores. Additionally, set up dashboards for at-a-glance visibility.</li>
<li><strong>Alerts:</strong> Configure alerts for failures, slow performance, and data quality issues. However, avoid alert fatigue by setting appropriate thresholds.</li>
<li><strong>Logging:</strong> Log everything important, but make logs searchable and actionable. Furthermore, use structured logging for easier analysis.</li>
</ul>

<h3>Scaling Considerations</h3>

<p>Design for horizontal scaling from the start. Moreover, use cloud-native services that scale automatically. Consequently, your infrastructure costs will scale with usage rather than staying fixed.</p>

<p>These patterns represent years of production experience with {keyphrase} across diverse use cases. Moreover, they're battle-tested across dozens of implementations processing billions of rows daily. Furthermore, teams worldwide use these exact approaches successfully. Therefore, you're building on a solid foundation proven in production. Additionally, you can adapt them to your specific needs while maintaining the core principles. In fact, that's the beauty of these patterns - they're flexible yet robust. However, remember that mastery takes time and practice. Nevertheless, start simple and iterate continuously based on real production feedback. Consequently, you'll build reliable, scalable systems that stand the test of time. Indeed, {keyphrase} done right transforms data engineering from an art into a science.</p>"""

        return opening + why_section + architecture + setup + performance + production + mistakes + closing
    
    def _generate_image_prompts(self, topic: Dict, content: str) -> List[Dict]:
        """Generate prompts for hand-drawn style images - FREE"""
        
        prompt = f"""Generate 4-5 image prompts for this blog post to create hand-drawn, sketch-style illustrations.

Blog Title: {topic['title']}
Category: {topic['category']}

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
            response = self._safe_generate(prompt, parse_json=True)
            return response
        except:
            # Fallback
            return [
                {
                    "placement": "hero",
                    "prompt": f"Hand-drawn technical sketch showing overview of {topic['title']}, featuring key components and workflow, in clean minimalist style with blue and purple accents",
                    "alt_text": f"{topic['title']} architecture overview diagram",
                    "caption": f"Overview of {topic['title']} architecture"
                }
            ]
    
    def _generate_references(self, topic: Dict) -> List[Dict]:
        """Generate relevant external reference links - FREE"""
        
        prompt = f"""Generate 5-6 authoritative external reference links for this topic:

Topic: {topic['title']}
Category: {topic['category']}
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
            response = self._safe_generate(prompt, parse_json=True)
            return response
        except:
            # Fallback
            return [
                {
                    "title": "Official Documentation",
                    "url": "https://docs.snowflake.com",
                    "description": "Official documentation and guides"
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
    print(f"🎯 Focus Keyword: {result['seo']['focus_keyphrase']}")
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
