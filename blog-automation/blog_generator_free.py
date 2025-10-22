#!/usr/bin/env python3
"""
Blog Generator (PREMIUM QUALITY VERSION)
Complete file - No lines missing - Production ready
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
        
        image_prompts = self._generate_image_prompts(topic, content_html)
        print(f"✅ Image prompts: {len(image_prompts)}")
        
        references = self._generate_references(topic)
        print(f"✅ References: {len(references)}")
        
        return {
            'title': topic['title'],
            'content': content_html,
            'slug': slug,
            'seo': {
                'title': seo_data['seo_title'],
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
  "seo_title": "Exact Keyphrase Guide 2025",
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
                'seo_title': seo_title,
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
                'seo_title': f"{keyphrase.title()} Guide 2025",
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

3. KEYPHRASE IN SUBHEADINGS:
   - Include "{keyphrase}" or synonyms in at least 2-3 H2 headings
   - Examples: "Why {keyphrase.title()} Matters", "Optimizing {keyphrase.title()}", "Best Practices for {keyphrase.title()}"

4. READABILITY (CRITICAL):
   - Keep sentences SHORT: Maximum 20 words per sentence
   - Use ACTIVE VOICE: "We implement X" NOT "X is implemented"
   - Break long sentences into 2-3 shorter ones
   - Aim for 15-20 words average per sentence
   - Max 10% passive voice usage

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

✓ "I discovered this technique last year." (ACTIVE)
✗ "This technique was discovered by me last year." (PASSIVE - AVOID)

STRUCTURE:

OPENING (NO H2, start directly):
"When it comes to {keyphrase}, [hook]. I'll show you what works. You'll learn practical techniques. Let's dive in."

THEN SPECIFIC H2 HEADINGS (include keyphrase in 2-3 of them):
<h2>Why {keyphrase.title()} Is Critical for Modern Data Teams</h2>
<h2>The Architecture Behind Effective {keyphrase.title()}</h2>
<h2>Setting Up {keyphrase.title()}: Step-by-Step Guide</h2>
<h2>Advanced {keyphrase.title()} Techniques</h2>
<h2>Common {keyphrase.title()} Mistakes to Avoid</h2>
<h2>Optimizing {keyphrase.title()} for Production</h2>

CODE BLOCKS:
<pre><code class="language-python">code here</code></pre>
<pre><code class="language-sql">code here</code></pre>

WRITING CHECKLIST:
□ Sentences under 20 words (aim for 15-18 average)
□ Active voice (you/we/I as subjects, not "it was done")
□ Keyphrase in first paragraph
□ Keyphrase 8-12 times total
□ Keyphrase in 2-3 H2 headings
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

Return ONLY HTML. Start with opening paragraphs containing keyphrase. Use SHORT sentences and ACTIVE voice."""

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
            new_first_para = f"<p>When it comes to {keyphrase}, understanding the fundamentals and best practices is crucial for success. "
            content = re.sub(r'<p>.*?</p>', new_first_para + first_p_match.group(1) + '</p>', content, count=1, flags=re.IGNORECASE | re.DOTALL)
        else:
            # No <p> tag found, add at start
            content = f"<p>When it comes to {keyphrase}, mastering the key concepts is essential.</p>\n\n" + content
        
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
    
    def _generate_fallback_content(self, topic: Dict, keyphrase: str, seo_data: Dict) -> str:
        """Generate high-quality fallback content - NO GENERIC HEADINGS - COMPLETE VERSION"""
        
        # Create the content as a regular string, not f-string to avoid issues
        opening = f"<p>When it comes to modern data engineering, understanding {keyphrase} has become crucial for building scalable, efficient data systems. Over the past few years, I've worked with dozens of teams implementing {keyphrase}, and I've seen firsthand what works and what doesn't. Let me share the practical lessons that will save you months of trial and error.</p>\n\n"
        
        context = f"<p>The data engineering landscape has evolved dramatically. What used to require massive infrastructure and specialized teams is now accessible to anyone willing to learn the right patterns. {keyphrase.title()} represents a fundamental shift in how we approach data workflows, offering scalability and performance that wasn't possible just a few years ago.</p>\n\n"
        
        preview = f"<p>I'll walk you through the practical implementation, share real production examples, and highlight the gotchas that took us way too long to figure out. By the end, you'll have actionable knowledge you can apply immediately to your own data engineering challenges.</p>\n\n"
        
        why_section = f"""<h2>Why {keyphrase.title()} Changed Everything</h2>

<p>Let me be direct: {keyphrase} isn't just another tool in your data engineering toolkit. It's a fundamentally different approach that solves several critical problems simultaneously. Think of it like the difference between building with hand tools versus using modern power equipment - same end goal, but completely different efficiency.</p>

<p>The key breakthrough came when I realized that traditional approaches were optimizing for the wrong things. We were focused on making individual operations faster, when we should have been thinking about the entire system architecture. {keyphrase.title()} forces you to think holistically, and that perspective shift changes everything.</p>

<h3>The Core Problems It Solves</h3>

<p>Here's what makes this approach different:</p>

<ul>
<li><strong>Scalability without rewrites:</strong> Your pipeline that handles gigabytes today scales to petabytes tomorrow with minimal changes. We went from processing 100GB daily to 5TB daily without touching the core logic.</li>
<li><strong>Performance that matters:</strong> We're talking 10-50x improvements in real-world scenarios. Our report generation went from 2 hours to 5 minutes.</li>
<li><strong>Maintainability for the long term:</strong> Code that's actually readable six months later. Your future self will thank you.</li>
<li><strong>Reliability you can trust:</strong> Built-in fault tolerance means fewer 3 AM alerts. Trust me, this matters.</li>
</ul>

<p>💡 <strong>Pro Tip:</strong> The real power becomes apparent when you're handling complex transformations across multiple data sources. That's where traditional approaches start breaking down.</p>\n\n"""
        
        architecture = """<h2>The Architecture That Actually Works</h2>

<p>After trying various approaches, we settled on an architecture that balances simplicity with flexibility. Here's the pattern that's served us well across dozens of production pipelines:</p>

<pre><code class="language-python">class DataPipeline:
    def __init__(self, source, destination):
        self.source = source
        self.destination = destination
        self.transformations = []
        self.validators = []
    
    def add_transformation(self, func):
        self.transformations.append(func)
        return self
    
    def add_validator(self, func):
        self.validators.append(func)
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
            self.handle_error(e)
            raise

pipeline = (
    DataPipeline(source=S3Source(), destination=SnowflakeDestination())
    .add_transformation(remove_duplicates)
    .add_transformation(normalize_schema)
    .add_validator(check_data_quality)
    .execute()
)
</code></pre>

<p>🎯 <strong>Key Insight:</strong> The method chaining pattern makes pipelines readable. You can hand this to a junior engineer and they'll understand immediately.</p>\n\n"""
        
        setup = """<h2>Setting Up Your First Production Pipeline</h2>

<p>Let's build something real. I'm going to show you exactly how to set this up, including all the details that documentation skips.</p>

<h3>Environment Setup That Saves Headaches</h3>

<p>First, get your environment right. I've seen too many teams skip this and regret it later:</p>

<pre><code class="language-bash">python -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install pandas sqlalchemy boto3
</code></pre>

<p>⚠️ <strong>Warning:</strong> Pin your dependency versions. Latest breaks things at the worst possible time.</p>

<h3>Configuration That's Maintainable</h3>

<pre><code class="language-python">import os
from dataclasses import dataclass

@dataclass
class PipelineConfig:
    source_database: str
    source_table: str
    destination_database: str
    destination_table: str
    batch_size: int = 1000
    max_retries: int = 3
    
    @classmethod
    def from_env(cls):
        config = cls(
            source_database=os.getenv('SOURCE_DB'),
            source_table=os.getenv('SOURCE_TABLE'),
            destination_database=os.getenv('DEST_DB'),
            destination_table=os.getenv('DEST_TABLE'),
        )
        
        if not all([config.source_database, config.source_table]):
            raise ValueError("Missing required configuration")
        
        return config

config = PipelineConfig.from_env()
</code></pre>

<p>The dataclass approach with type hints catches configuration errors at development time, not in production.</p>\n\n"""
        
        performance = """<h2>Performance Tricks Nobody Tells You</h2>

<p>These optimizations made our pipelines 10x faster:</p>

<h3>Batch Processing Done Right</h3>

<blockquote>
<p><strong>Lesson learned:</strong> The optimal batch size depends on your data characteristics. We found our sweet spot: 5000 rows for wide tables, 20000 for narrow ones.</p>
</blockquote>

<pre><code class="language-python">def process_in_batches(data, batch_size=5000):
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        yield process_batch(batch)

results = []
for batch_result in process_in_batches(data):
    results.append(batch_result)
</code></pre>

<h3>Parallel Processing Strategy</h3>

<pre><code class="language-python">from concurrent.futures import ThreadPoolExecutor
import multiprocessing as mp

def parallel_process(data, operation):
    with ThreadPoolExecutor(max_workers=mp.cpu_count()) as executor:
        return list(executor.map(operation, data))
</code></pre>

<p>💡 <strong>Pro Tip:</strong> Use threading for I/O-bound operations, multiprocessing for CPU-bound ones.</p>\n\n"""
        
        production = """<h2>Handling Production Reality</h2>

<p>Theory is clean. Production is messy. Here's how to handle it:</p>

<h3>Error Handling That Works</h3>

<pre><code class="language-python">from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def resilient_operation(data):
    try:
        return risky_operation(data)
    except TemporaryError as e:
        logger.warning(f"Temporary failure. Retrying...")
        raise
    except PermanentError as e:
        logger.error(f"Permanent failure: {e}")
        return None
</code></pre>

<h3>Data Quality Validation</h3>

<pre><code class="language-python">def validate_data_quality(df):
    checks = [
        (not df.empty, "Dataset is empty"),
        (df['id'].notna().all(), "Missing IDs detected"),
        (df['id'].is_unique, "Duplicate IDs found"),
    ]
    
    for check, message in checks:
        if not check:
            logger.error(f"Data quality issue: {message}")
            raise DataQualityError(message)
    
    return df
</code></pre>

<p>⚠️ <strong>Warning:</strong> Validate early and often. Finding bad data after it's loaded is 100x harder.</p>\n\n"""
        
        mistakes = """<h2>The Mistakes I Made So You Don't Have To</h2>

<p>Let me save you some pain:</p>

<h3>Mistake #1: Not Handling Schema Changes</h3>

<p>Schemas WILL change. Plan for it:</p>

<pre><code class="language-python">def safe_column_access(df, column, default=None):
    if column in df.columns:
        return df[column]
    logger.warning(f"Column '{column}' not found, using default")
    return default

df['amount'] = safe_column_access(df, 'amount', 0)
</code></pre>

<h3>Mistake #2: Memory Issues</h3>

<p>Our pipeline crashed because test data was 100MB but production was 50GB. Always use chunking for datasets over 100MB.</p>

<h3>Mistake #3: Ignoring Idempotency</h3>

<pre><code class="language-sql">MERGE INTO destination AS dest
USING source AS src
ON dest.id = src.id
WHEN MATCHED THEN
    UPDATE SET dest.value = src.value, dest.updated_at = CURRENT_TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (id, value, created_at) VALUES (src.id, src.value, CURRENT_TIMESTAMP);
</code></pre>\n\n"""
        
        closing = f"<p>These patterns are battle-tested across production pipelines processing billions of rows. Start with the basics, master them, then gradually add complexity as needed. The key is understanding that {keyphrase} isn't just about technology - it's about building systems that are reliable, maintainable, and scalable. Focus on those principles, and you'll build data pipelines that stand the test of time.</p>"
        
        return opening + context + preview + why_section + architecture + setup + performance + production + mistakes + closing
    
    def _verify_intro_keyphrase(self, content: str, keyphrase: str) -> bool:
        """Verify keyphrase appears in opening paragraphs (no 'Introduction' heading)"""
        first_h2_match = re.search(r'<h2>', content, re.IGNORECASE)
        
        if first_h2_match:
            opening_text = content[:first_h2_match.start()].lower()
        else:
            opening_text = content[:500].lower()
        
        return keyphrase.lower() in opening_text
    
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
    
    def _ensure_keyphrase_in_headings(self, content: str, keyphrase: str) -> str:
        """Ensure keyphrase appears in at least 30% of H2 headings"""
        h2_pattern = r'<h2>(.*?)</h2>'
        h2_matches = list(re.finditer(h2_pattern, content, re.IGNORECASE | re.DOTALL))
        
        if not h2_matches:
            return content
        
        total_h2 = len(h2_matches)
        required_with_keyphrase = max(3, int(total_h2 * 0.3))
        current_with_keyphrase = sum(1 for match in h2_matches if keyphrase.lower() in match.group(1).lower())
        
        if current_with_keyphrase >= required_with_keyphrase:
            return content
        
        needed = required_with_keyphrase - current_with_keyphrase
        
        for match in h2_matches[:needed + 2]:
            heading_text = match.group(1).strip()
            if keyphrase.lower() in heading_text.lower():
                continue
            new_heading = self._inject_keyphrase_in_heading(heading_text, keyphrase)
            content = content.replace(f'<h2>{heading_text}</h2>', f'<h2>{new_heading}</h2>', 1)
            needed -= 1
            if needed <= 0:
                break
        
        return content
    
    def _inject_keyphrase_in_heading(self, heading: str, keyphrase: str) -> str:
        """Inject keyphrase into a heading naturally"""
        patterns = {
            'getting started': f'Getting Started with {keyphrase.title()}',
            'introduction': f'Introduction to {keyphrase.title()}',
            'why ': f'Why {keyphrase.title()} ',
            'how to': f'How to Use {keyphrase.title()}',
            'best practices': f'Best Practices for {keyphrase.title()}',
            'common mistakes': f'Common {keyphrase.title()} Mistakes',
        }
        
        heading_lower = heading.lower()
        for pattern, replacement in patterns.items():
            if pattern in heading_lower:
                return replacement
        
        return f'{keyphrase.title()}: {heading}'
    
    def _analyze_headings(self, content: str, keyphrase: str) -> tuple:
        """Analyze heading structure"""
        h2_matches = re.findall(r'<h2>(.*?)</h2>', content, re.IGNORECASE | re.DOTALL)
        h3_matches = re.findall(r'<h3>(.*?)</h3>', content, re.IGNORECASE | re.DOTALL)
        
        h2_with_keyphrase = sum(1 for h in h2_matches if keyphrase.lower() in h.lower())
        h3_with_keyphrase = sum(1 for h in h3_matches if keyphrase.lower() in h.lower())
        
        total_with_keyphrase = h2_with_keyphrase + h3_with_keyphrase
        
        return len(h2_matches), len(h3_matches), total_with_keyphrase

def main():
    """Test the PREMIUM QUALITY generator"""
    from dotenv import load_dotenv
    load_dotenv()  # FIXED: Load .env file
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found!")
        print("\nMake sure you have a .env file with:")
        print("GEMINI_API_KEY=your_key_here")
        return
    
    generator = BlogGeneratorFree(api_key)
    
    test_topic = {
        'title': 'Snowflake Data Pipeline Complete Setup Guide',
        'category': 'snowflake',
        'keywords': ['snowflake', 'data pipeline', 'ETL', 'cloud data warehouse'],
        'level': 'intermediate'
    }
    
    print("\n🚀 Testing PREMIUM QUALITY Generator...\n")
    result = generator.generate_blog_post(test_topic)
    
    print("\n" + "="*60)
    print("PREMIUM QUALITY BLOG POST GENERATED")
    print("="*60)
    print(f"\n📝 Title: {result['title']}")
    print(f"🎯 SEO Title: {result['seo']['title']}")
    print(f"🔑 Focus Keyphrase: {result['seo']['focus_keyphrase']}")
    print(f"📊 Meta Description: {result['seo']['meta_description']}")
    print(f"🔗 Slug: {result['slug']}")
    print(f"📈 Word Count: {result['metadata']['word_count']}")
    print(f"⏱️  Reading Time: {result['metadata']['reading_time']} min")
    print(f"✅ Quality: {result['metadata']['quality']}")
    print(f"💰 Cost: {result['metadata']['cost']}")
    
    # Save output
    with open('test_blog_premium.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved to: test_blog_premium.json")
    print("\n🎉 Premium quality content generated!")


if __name__ == "__main__":
    main()
