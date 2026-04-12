#!/usr/bin/env python3
"""
Prompt Templates for Blog Generator V2
All LLM prompts centralized here for easy tuning and testing.
Each function returns a formatted prompt string.
"""

import json
from typing import Dict, List, Optional


def build_outline_prompt(
    topic: Dict,
    research_data: Dict,
    author_config: Dict
) -> str:
    """Generate a topic-specific article outline (not a hardcoded template)."""

    research_summary = research_data.get('summary', '')
    sources_text = "\n".join(
        f"- {s['title']}: {s.get('content', '')[:300]}"
        for s in research_data.get('sources', [])[:6]
    )
    category = topic.get('category', 'data-engineering')
    experience_hint = author_config.get('experience_examples', {}).get(
        category,
        author_config.get('experience_examples', {}).get('data-engineering', '')
    )

    return f"""You are planning a blog article for an experienced data engineering audience.

TOPIC: {topic['title']}
CATEGORY: {category}

RESEARCH FINDINGS:
{research_summary}

TOP SOURCES:
{sources_text}

AUTHOR CONTEXT: {experience_hint}

Create a detailed article outline. The outline must be SPECIFIC to this topic.

RULES:
1. Generate 5-8 H2 sections. Each section will later be expanded to 300-500 words.
2. The sections must follow a logical narrative for THIS topic — do NOT use a generic template.
3. Each section needs a clear purpose: "teach" (explain a concept), "code" (show working code),
   "compare" (contrast approaches), "warn" (common mistakes/gotchas), or "story" (personal experience).
4. Include at least ONE "code" section with a description of what real code to write.
5. Include at least ONE "warn" section about mistakes or gotchas.
6. The first section should set context (why this matters, what problem it solves).
7. The last content section should be practical takeaways or a "when to use / when not to use" summary.

BAD OUTLINE (generic template applied to every topic):
  "Why X Matters" → "X Architecture" → "X Implementation" → "Advanced X" → "X Mistakes" → "X Performance" → "Monitoring X"

GOOD OUTLINE (specific to the topic):
  "The Problem X Solves (And Why I Switched)" → "How X Works Under the Hood" →
  "Setting Up X Step by Step" → "The Query That Changed Everything" →
  "What Can Go Wrong (And How to Debug It)" → "X vs Y: When to Use Which" → "My Production Checklist"

Also generate 4-5 FAQ questions that a reader would ask after reading this article.
Think "People Also Ask" on Google — practical questions, not generic ones.

Return ONLY valid JSON (no markdown fences):
{{
  "hook_angle": "one sentence describing the opening story angle — pick from: production incident, confession of doing it wrong, moment of discovery, relatable pain point, or surprising metric",
  "sections": [
    {{
      "heading": "Specific heading text",
      "purpose": "teach|code|compare|warn|story",
      "key_points": ["point 1", "point 2", "point 3"]
    }}
  ],
  "faq_questions": [
    "Specific question a reader would google?",
    "Another practical question?"
  ]
}}"""


def build_seo_metadata_prompt(
    topic: Dict,
    research_data: Dict
) -> str:
    """Generate compelling, non-formulaic SEO metadata."""

    research_summary = (research_data.get('summary') or '')[:400]

    return f"""Generate SEO metadata for a data engineering blog article.

TOPIC: {topic['title']}
RESEARCH CONTEXT: {research_summary}

REQUIREMENTS:

1. FOCUS KEYPHRASE (2-4 words):
   - The core topic phrase readers would search for
   - Lowercase

2. SEO TITLE (max 55 characters):
   - MUST include a specific benefit, number, or outcome
   - Examples of GOOD titles:
     "DuckDB for Data Engineers: Replace Your Python Scripts"
     "Apache Iceberg: Cut Storage Costs 60% on Snowflake"
     "Data Quality Testing with dbt: 5 Patterns That Work"
     "CI/CD for Data Pipelines: Ship dbt Models Safely"
   - NEVER use these patterns:
     "{{Keyphrase}} Guide 2026"
     "{{Keyphrase}}: Complete Guide"
     "Mastering {{Keyphrase}}"
     "{{Keyphrase}} Best Practices"

3. META DESCRIPTION (150-160 characters):
   - Start with a hook or question, NOT "Master {{keyphrase}} with our comprehensive guide"
   - Include the keyphrase naturally in the first sentence
   - End with a clear promise of what the reader will learn
   - Examples of GOOD descriptions:
     "I cut my dbt build time by 48% using Snowflake Cortex Code. Here's the exact setup, gotchas, and results after 3 months in production."
     "DuckDB replaced my 200-line Python scripts with 5 SQL queries. A practical guide to using DuckDB for everyday data engineering tasks."

4. SECONDARY KEYWORDS (7 terms):
   - Related search terms, not just variations of the keyphrase

Return ONLY valid JSON (no markdown fences):
{{
  "focus_keyphrase": "main topic phrase",
  "title": "Compelling Benefit-Driven Title Here",
  "meta_description": "Hook sentence with keyphrase. Promise of what reader learns in 150-160 chars.",
  "secondary_keywords": ["term1", "term2", "term3", "term4", "term5", "term6", "term7"]
}}"""


def build_hook_prompt(
    topic: Dict,
    author_config: Dict,
    hook_angle: str,
    keyphrase: str
) -> str:
    """Generate opening 2-3 paragraphs with a personal story hook."""

    name = author_config.get('name', 'the author')
    role = author_config.get('role', 'Data Engineer')
    company = author_config.get('company', '')
    years = author_config.get('experience_years', 3)
    category = topic.get('category', 'data-engineering')
    experience = author_config.get('experience_examples', {}).get(
        category,
        author_config.get('experience_examples', {}).get('data-engineering', '')
    )

    # Hook style examples from config
    hook_styles = author_config.get('hook_styles', [])
    hook_styles_text = "\n".join(f"  - {s}" for s in hook_styles) if hook_styles else ""

    return f"""You are {name}, a {role} at {company} with {years}+ years of experience.

Write the OPENING 2-3 paragraphs for a blog article.

TOPIC: {topic['title']}
HOOK ANGLE: {hook_angle}
YOUR EXPERIENCE: {experience}

HOOK STYLE INSPIRATION (pick one that fits the topic, or blend):
{hook_styles_text if hook_styles_text else "  - Start with a personal story, a surprising metric, or a confession of doing something wrong first."}

REQUIREMENTS:
1. Start with a compelling personal story or anecdote (NOT "In today's data-driven world...")
2. The hook should pull the reader in within the first sentence
3. Include the keyphrase "{keyphrase}" naturally in the first or second paragraph
4. Use first person (I, my, we)
5. Share a specific detail: a number, a time, a tool name, a team size — something concrete
6. End the opening with a one-sentence promise of what the article covers
7. SHORT paragraphs — 3-4 sentences each
8. Use contractions (don't, I'll, can't) to sound natural

BANNED PHRASES (never use these):
"In today's data-driven world", "When it comes to", "It is crucial to",
"In the ever-evolving landscape", "Comprehensive guide", "Let's dive in",
"It is important to note"

Return ONLY a JSON array of Gutenberg paragraph blocks (no markdown fences):
[
  {{
    "blockName": "core/paragraph",
    "attrs": {{}},
    "innerContent": ["<p>Your compelling opening sentence here...</p>"]
  }},
  {{
    "blockName": "core/paragraph",
    "attrs": {{}},
    "innerContent": ["<p>Second paragraph continuing the story...</p>"]
  }},
  {{
    "blockName": "core/paragraph",
    "attrs": {{}},
    "innerContent": ["<p>What this article covers (the promise)...</p>"]
  }}
]"""


def build_section_prompt(
    section: Dict,
    topic: Dict,
    research_data: Dict,
    author_config: Dict,
    keyphrase: str,
    previous_section_ending: str = "",
    previous_code_snippets: Optional[List[str]] = None,
    used_source_urls: Optional[List[str]] = None,
    used_conclusions: Optional[List[str]] = None,
) -> str:
    """Generate ONE section (300-500 words) with full research context."""

    name = author_config.get('name', 'the author')
    role = author_config.get('role', 'Data Engineer')
    company = author_config.get('company', '')
    years = author_config.get('experience_years', 3)

    # Category-specific experience context
    category = topic.get('category', 'data-engineering')
    experience = author_config.get('experience_examples', {}).get(
        category,
        author_config.get('experience_examples', {}).get('data-engineering', '')
    )

    # Author writing rules from config
    writing_rules = author_config.get('writing_rules', [])
    rules_text = "\n".join(f"- {r}" for r in writing_rules) if writing_rules else ""

    # Cap each source to 800 chars to avoid context window overflow
    sources_text = "\n".join(
        f"- {s['title']} ({s.get('url', '')}): {s.get('content', '')[:800]}"
        for s in research_data.get('sources', [])[:8]
    )
    research_summary = research_data.get('summary', '')

    heading = section.get('heading', 'Section')
    purpose = section.get('purpose', 'teach')
    key_points = "\n".join(f"  - {p}" for p in section.get('key_points', []))

    purpose_instructions = {
        'teach': "Explain the concept clearly. Use an analogy if helpful. Include one real-world example.",
        'code': """Show REAL, production-grade code. NOT placeholder functions like `def process_data(data): return transform(data)`.
Include comments explaining WHY (not what). Use actual library names, real SQL queries, or real Python code.
The code should be copy-pasteable and runnable.
IMPORTANT: The code example MUST be DIFFERENT from any code shown in previous sections.""",
        'compare': "Compare approaches objectively. Use a brief table or structured comparison. State your preference and why.",
        'warn': "Share a specific mistake you made or saw. Describe what went wrong, the symptom, and the fix. Be concrete — include error messages or unexpected behavior.",
        'story': "Tell a short personal anecdote. Include specific details (time, place, tool, metric). Connect it to a practical lesson."
    }

    flow_instruction = ""
    if previous_section_ending:
        flow_instruction = f"""
PREVIOUS SECTION ENDED WITH:
"{previous_section_ending}"
Continue the narrative naturally. Do NOT repeat what was just said."""

    # Build deduplication context
    dedup_instruction = ""
    if previous_code_snippets:
        code_list = "\n".join(f"  [{i+1}] {snippet[:150]}..." if len(snippet) > 150 else f"  [{i+1}] {snippet}"
                              for i, snippet in enumerate(previous_code_snippets))
        dedup_instruction += f"""
CODE ALREADY USED IN PREVIOUS SECTIONS (do NOT repeat these):
{code_list}
You MUST write a DIFFERENT code example. Show a different query, different operation, or different aspect of the topic."""

    if used_source_urls:
        urls_list = "\n".join(f"  - {url}" for url in used_source_urls[:10])
        dedup_instruction += f"""

SOURCES ALREADY CITED HEAVILY (prefer citing DIFFERENT sources):
{urls_list}
Try to cite sources NOT in this list. If you must re-cite one, add NEW information from it — not the same quote."""

    if used_conclusions:
        conclusions_list = "\n".join(f"  - \"{c}\"" for c in used_conclusions[:10])
        dedup_instruction += f"""

PHRASES/CONCLUSIONS ALREADY USED IN PREVIOUS SECTIONS (do NOT repeat these):
{conclusions_list}
You MUST write FRESH conclusions and takeaways. Do NOT rephrase or echo the above.
Use a different angle, different analogy, or different supporting evidence.
BANNED: repeating the same verdict, same recommendation, or same summary sentence across sections."""

    return f"""You are {name}, a {role} at {company} with {years}+ years of experience.

Write the section: "{heading}"
Purpose: {purpose}
Key points to cover:
{key_points}

TOPIC: {topic['title']}
KEYPHRASE: "{keyphrase}" — use it 1-2 times naturally. Do NOT force it into awkward positions.
{flow_instruction}
{dedup_instruction}

RESEARCH CONTEXT (use for facts and inline citations):
{research_summary}

SOURCES (cite inline when referencing facts):
{sources_text}

SECTION-SPECIFIC INSTRUCTIONS:
{purpose_instructions.get(purpose, purpose_instructions['teach'])}

YOUR EXPERIENCE WITH THIS TOPIC:
{experience if experience else "Draw from your " + str(years) + " years of hands-on data engineering experience."}

WRITING RULES (follow ALL of these strictly):
{rules_text if rules_text else "- Write in first person (I, we, my team)"}
- INLINE CITATIONS: When using facts from research, link to the source:
  e.g., "According to <a href="https://docs.snowflake.com/..." target="_blank" rel="noopener">Snowflake's docs</a>, partitions are..."
  Do NOT just list sources at the bottom.
- METRICS MUST HAVE SOURCES: Every specific number (percentage, time, cost, row count) MUST have an
  inline citation to the source it came from. If no source backs a claim, describe the improvement
  qualitatively (e.g., "significantly faster") instead of inventing a number like "30% faster".
- ANECDOTES MUST BE SPECIFIC: When sharing a personal experience, include at least 2 concrete details:
  a tool name, a team size, a data volume, a time period, or an error message. Never write vague
  anecdotes like "I recall a project where we improved performance."

ANTI-THIN-CONTENT RULES (critical — Google devalues shallow sections):
- Every section MUST contain at least ONE actionable takeaway: a specific step, command, config setting,
  decision framework, or code snippet the reader can use immediately. A section that only describes
  concepts without telling the reader what to DO is thin content.
- Every section MUST contain at least ONE unique insight: a personal experience, a benchmark result,
  an edge case, a gotcha, or an opinion backed by evidence. If the section could appear on any generic
  blog post about this topic, it is thin content.
- Write at least 3 substantial paragraphs (not counting headings or code blocks). Each paragraph should
  add NEW information — do not pad with restatements or filler.
- BANNED FILLER PHRASES (these are thin content markers — NEVER use them):
  "depends on your specific requirements", "depends on your use case", "refer to the official documentation",
  "getting this right is important", "this is beyond the scope of this article",
  "there are many ways to", "as with any technology"

OUTPUT: 300-500 words as a JSON array of Gutenberg blocks.
Start with the H2 heading block, then 3-5 paragraph blocks, plus code/list/table blocks as needed.

Supported block types:
- core/heading (with attrs.level = 2 or 3)
- core/paragraph
- core/code (with attrs.language)
- core/list
- core/table
- core/quote
- core/separator

Return ONLY a valid JSON array (no markdown fences):
[
  {{"blockName": "core/heading", "attrs": {{"level": 2}}, "innerContent": ["<h2>{heading}</h2>"]}},
  {{"blockName": "core/paragraph", "attrs": {{}}, "innerContent": ["<p>Content...</p>"]}},
  ...
]"""


def build_tldr_prompt(
    topic: Dict,
    outline: Dict,
    keyphrase: str,
    research_summary: str = "",
) -> str:
    """Generate a TL;DR summary block for featured snippet optimization."""

    sections_summary = "\n".join(
        f"- {s['heading']}" for s in outline.get('sections', [])
    )

    research_block = ""
    if research_summary:
        research_block = f"""
RESEARCH FACTS (use ONLY these for any numbers or claims):
{research_summary[:1500]}
"""

    return f"""Write a TL;DR (Too Long; Didn't Read) summary for a blog article.

TOPIC: {topic['title']}
KEYPHRASE: {keyphrase}

ARTICLE SECTIONS:
{sections_summary}
{research_block}
REQUIREMENTS:
1. 3-5 bullet points summarizing the key takeaways
2. Each bullet should be one concise sentence (under 20 words)
3. Include the keyphrase in the first bullet naturally
4. Write for someone who wants the answer without reading the full article
5. Be specific — include tool names and concrete outcomes where possible
6. FACTUAL ACCURACY: Every number or metric in a bullet MUST come from the RESEARCH FACTS above.
   If no research backs a claim, state it qualitatively (e.g., "significantly faster" not "50% faster").
7. Do NOT invent scale thresholds (e.g., "suits datasets under 1000 rows") unless the research explicitly states them.
8. Each bullet must be independently true — do not contradict other bullets.

Return ONLY a valid JSON array of Gutenberg blocks (no markdown fences):
[
  {{
    "blockName": "core/heading",
    "attrs": {{"level": 2}},
    "innerContent": ["<h2>TL;DR</h2>"]
  }},
  {{
    "blockName": "core/list",
    "attrs": {{}},
    "innerContent": ["<ul><li>Bullet 1 with keyphrase</li><li>Bullet 2</li><li>Bullet 3</li></ul>"]
  }},
  {{
    "blockName": "core/separator",
    "attrs": {{}},
    "innerContent": ["<hr class=\\"wp-block-separator has-alpha-channel-opacity\\"/>"]
  }}
]"""


def build_faq_prompt(
    topic: Dict,
    faq_questions: List[str],
    keyphrase: str,
    research_summary: str = "",
) -> str:
    """Generate FAQ section for AEO (Answer Engine Optimization)."""

    questions_text = "\n".join(f"  {i+1}. {q}" for i, q in enumerate(faq_questions))

    research_block = ""
    if research_summary:
        research_block = f"""
RESEARCH FACTS (ground your answers in these):
{research_summary[:1500]}
"""

    return f"""Write a FAQ (Frequently Asked Questions) section for a blog article.

TOPIC: {topic['title']}
KEYPHRASE: {keyphrase}

QUESTIONS TO ANSWER:
{questions_text}
{research_block}
REQUIREMENTS:
1. DIRECT ANSWER FIRST: The very first sentence of each answer MUST directly answer the question
   in a single factual statement. No hedging ("It depends..."), no filler ("That's a great question...").
   Example — Question: "Is DuckDB faster than Snowflake?"
   BAD first sentence: "It depends on your use case and data volume."
   GOOD first sentence: "DuckDB is faster for local analytical queries under 10GB because it runs in-process without network overhead."
2. After the direct answer, add 1-2 sentences of supporting context or a concrete example.
3. Include the keyphrase naturally in 1-2 answers (NOT all of them — that looks spammy).
4. Answers should be self-contained (make sense without reading the full article).
5. Every specific number or metric in an answer MUST come from the RESEARCH FACTS above.
   If no source backs a claim, describe it qualitatively.
6. Use first person sparingly and only when sharing genuine experience ("In my experience with X...").
7. These will be used for FAQ schema markup and AI answer engines — concise, factual answers rank best.

Return ONLY a valid JSON array of Gutenberg blocks (no markdown fences).
Use H3 for each question, paragraph for each answer.
IMPORTANT: Every answer MUST be wrapped in <p>...</p> tags. Never return bare text without <p> tags.
[
  {{
    "blockName": "core/heading",
    "attrs": {{"level": 2}},
    "innerContent": ["<h2>Frequently Asked Questions</h2>"]
  }},
  {{
    "blockName": "core/heading",
    "attrs": {{"level": 3}},
    "innerContent": ["<h3>Question text here?</h3>"]
  }},
  {{
    "blockName": "core/paragraph",
    "attrs": {{}},
    "innerContent": ["<p>Direct answer here. Additional context. Personal insight if relevant.</p>"]
  }}
]"""


def build_natural_keyphrase_prompt(
    paragraph_html: str,
    keyphrase: str
) -> str:
    """Rewrite a paragraph to naturally include the keyphrase (no mechanical injection)."""

    return f"""Rewrite the following paragraph to naturally include the phrase "{keyphrase}".

CURRENT PARAGRAPH:
{paragraph_html}

RULES:
1. Keep the same meaning and information
2. Include "{keyphrase}" exactly once, in a natural position
3. Do NOT start with "When it comes to {keyphrase},"
4. Do NOT mechanically replace "this approach" or "the system" with the keyphrase
5. The rewrite should read as if a human naturally mentioned the topic
6. Keep the same HTML tags (<p>, <a>, <code>, etc.)
7. Keep the same length (within 10% of original)

Return ONLY the rewritten HTML paragraph (no JSON, no markdown fences).
Example input:  <p>This approach reduces query time by 40%.</p>
Example output: <p>Using DuckDB reduces query time by 40% compared to raw Python.</p>"""


def build_featured_image_prompt(topic: Dict, keyphrase: str = "") -> str:
    """Generate a featured image prompt in hand-drawn watercolor style.

    Returns a ready-to-use image generation prompt string (not an LLM meta-prompt).
    The caller can use this directly with an image generation API.
    """
    title = topic.get('title', '')
    category = topic.get('category', 'data-engineering')

    # Extract key tools/concepts from the title for visual elements
    tools = []
    tool_keywords = {
        'dbt': 'dbt', 'snowflake': 'Snowflake', 'airflow': 'Airflow',
        'duckdb': 'DuckDB', 'spark': 'Spark', 'kafka': 'Kafka',
        'python': 'Python', 'sql': 'SQL', 'postgres': 'PostgreSQL',
        'redshift': 'Redshift', 'bigquery': 'BigQuery', 'databricks': 'Databricks',
        'fivetran': 'Fivetran', 'dagster': 'Dagster', 'prefect': 'Prefect',
        'docker': 'Docker', 'kubernetes': 'Kubernetes', 'terraform': 'Terraform',
        'iceberg': 'Iceberg', 'delta': 'Delta Lake', 'parquet': 'Parquet',
    }
    title_lower = title.lower()
    for keyword, label in tool_keywords.items():
        if keyword in title_lower:
            tools.append(label)

    # Build visual elements description based on detected tools
    if len(tools) >= 2:
        tool_labels = ', '.join(f'"{t}"' for t in tools[:3])
        visual_elements = (
            f"interconnected gears or cogs labelled with small handwritten tags: "
            f"{tool_labels}. "
            f"Flowing between the gears are delicate watercolor arrows suggesting data movement "
            f"— like water flowing downhill through a pipe system"
        )
    elif len(tools) == 1:
        visual_elements = (
            f"a central gear or cog labelled \"{tools[0]}\" surrounded by flowing watercolor "
            f"data streams connecting to smaller nodes representing tables, queries, and pipelines"
        )
    else:
        visual_elements = (
            "flowing watercolor data streams connecting architectural blocks — databases, "
            "pipelines, and query engines — sketched loosely as if mapped out in a notebook"
        )

    # Category-specific background elements
    bg_elements = {
        'data-engineering': 'faint grid lines suggest a DAG or pipeline chart, drawn loosely as if sketched in a notebook',
        'analytics': 'faint bar charts and scatter plots sketched in the background like dashboard wireframes',
        'cloud': 'faint cloud shapes and network topology lines drawn loosely in the background',
        'devops': 'faint CI/CD pipeline arrows and container outlines sketched in the background',
    }
    background = bg_elements.get(category, bg_elements['data-engineering'])

    return (
        f"A hand-drawn watercolor illustration in cool blues, warm ambers, and earthy greens. "
        f"The scene shows {visual_elements}. "
        f"In the background, {background}. "
        f"The overall mood is that of an engineer mapping out a system on paper — purposeful, "
        f"slightly scrappy, genuinely curious. Loose watercolor brush technique, visible paper "
        f"texture, no corporate aesthetics. Leave empty space in the top third for a blog title overlay."
    )


def build_image_prompts(topic: Dict, blocks: List[Dict]) -> str:
    """Generate image prompts for the article."""

    content_preview = ""
    for block in blocks[:15]:
        if block.get('blockName') == 'core/paragraph':
            content_preview += block.get('innerContent', [''])[0]
            if len(content_preview) > 1500:
                break

    return f"""Generate 4 image prompts for a technical blog article.

TOPIC: {topic['title']}
CONTENT PREVIEW: {content_preview[:800]}

For each image, generate:
1. placement: hero, section-1, section-2, section-3
2. prompt: A detailed image generation prompt (80-120 words).
   STYLE: Hand-drawn watercolor illustration in cool blues, warm ambers, and earthy greens.
   Loose watercolor brush technique, visible paper texture, no corporate aesthetics.
   Show architecture diagrams, data flow arrows, gears, or tool labels as if sketched in a notebook.
   NOT people, NOT stock photo scenes, NOT 3D renders.
   The hero image MUST leave empty space in the top third for a blog title overlay.
3. alt_text: SEO-optimized alt text describing the image (<125 chars)
4. caption: Brief descriptive caption for under the image

Return ONLY a valid JSON array (no markdown fences):
[
  {{
    "placement": "hero",
    "prompt": "Hand-drawn watercolor illustration showing...",
    "alt_text": "Watercolor diagram of...",
    "caption": "High-level architecture overview"
  }}
]"""


def build_comparison_table_prompt(
    topic: Dict,
    research_data: Dict,
    keyphrase: str,
) -> str:
    """Generate a structured comparison table for 'vs' / comparison articles.

    Only called when the topic title contains 'vs', 'versus', or 'comparison'.
    """

    sources_text = "\n".join(
        f"- {s['title']} ({s.get('url', '')}): {s.get('content', '')[:600]}"
        for s in research_data.get('sources', [])[:8]
    )
    research_summary = research_data.get('summary', '')

    return f"""Create a detailed comparison table for a technical blog article.

TOPIC: {topic['title']}
KEYPHRASE: {keyphrase}

RESEARCH SUMMARY:
{research_summary[:1500]}

SOURCES:
{sources_text}

REQUIREMENTS:
1. Create a table comparing the two tools/technologies side by side.
2. Include 6-10 comparison dimensions (e.g., Deployment, Pricing, Query Speed, Scalability,
   Ease of Use, Ecosystem, Best For, Limitations).
3. Each cell MUST contain a specific, factual statement — NOT vague phrases like "Good" or "Fast".
   BAD: "Fast" | "Slower"
   GOOD: "Sub-second on local datasets up to 100GB" | "Scales to petabytes with auto-suspend warehouses"
4. Every numeric claim MUST come from the SOURCES above. If no source backs a number, describe qualitatively.
5. Add a final row "Best For" summarizing the ideal use case for each tool.
6. Include the keyphrase once naturally in the introductory paragraph.
7. For the H2 heading, use the actual tool/technology names (e.g., "DuckDB vs Snowflake: Side-by-Side Comparison").
   Do NOT use a generic heading like "Side-by-Side Comparison" without the tool names.

Return ONLY a valid JSON array of Gutenberg blocks (no markdown fences):
[
  {{
    "blockName": "core/heading",
    "attrs": {{"level": 2}},
    "innerContent": ["<h2>Side-by-Side Comparison</h2>"]
  }},
  {{
    "blockName": "core/paragraph",
    "attrs": {{}},
    "innerContent": ["<p>Brief intro sentence setting up the comparison.</p>"]
  }},
  {{
    "blockName": "core/table",
    "attrs": {{}},
    "innerContent": ["<figure class=\\"wp-block-table\\"><table><thead><tr><th>Dimension</th><th>Tool A</th><th>Tool B</th></tr></thead><tbody><tr><td>Row label</td><td>Specific fact</td><td>Specific fact</td></tr></tbody></table></figure>"]
  }}
]"""


def build_editorial_review_prompt(
    full_html: str,
    keyphrase: str,
    research_summary: str = "",
) -> str:
    """Post-generation editorial review pass.

    Scans the assembled article for fabricated metrics, repeated content,
    unsourced claims, and generic filler. Returns a corrected version.
    """

    return f"""You are a senior technical editor reviewing a blog article before publication.

KEYPHRASE: {keyphrase}

RESEARCH FACTS (the ONLY valid source of numbers and metrics):
{research_summary[:2000]}

FULL ARTICLE HTML:
{full_html[:12000]}

REVIEW CHECKLIST — fix each issue IN-PLACE and return the corrected HTML:

1. FABRICATED METRICS: Find any specific number (percentage, time, cost, row count) that does NOT
   appear in the RESEARCH FACTS above. Replace it with a qualitative statement or remove the sentence.
   Example: "reduces costs by 47%" → "significantly reduces costs" (if 47% is not in research).

2. REPEATED CODE: If the same code snippet or SQL query appears more than once, keep the FIRST
   occurrence and replace subsequent ones with a DIFFERENT example that illustrates a new concept.
   If you cannot generate a meaningfully different example, remove the duplicate and add a prose
   paragraph explaining the concept instead.

3. REPEATED PARAGRAPHS: If two paragraphs convey essentially the same information with different
   wording, merge them into one stronger paragraph and delete the duplicate.

4. REPEATED CONCLUSIONS & VERDICTS: Scan for sentences that express the same takeaway across
   different sections. Common patterns to catch:
   - The same recommendation repeated (e.g., "use DuckDB for local, Snowflake for scale" said 3 times)
   - The same closing phrase reused (e.g., "the simplest solution usually wins" in multiple sections)
   - The same comparison verdict restated (e.g., "large-scale collaborative data warehousing" repeated)
   Keep the STRONGEST version and rewrite others to make a DIFFERENT point or add new nuance.

5. REPEATED PHRASES & SENTENCE PATTERNS: Look for the same phrase (3+ words) appearing 3 or more
   times across the article. Rewrite duplicates using synonyms or restructured sentences. Also catch:
   - Repeated transitional phrases (e.g., "In my experience" used in every section)
   - Repeated source citations (same source name/link cited more than 3 times — vary the sources)

6. VAGUE ANECDOTES: Find sentences like "I recall a project where..." or "In my experience..."
   that lack specifics. Either add 2+ concrete details (tool name, data volume, time period, error)
   or remove the anecdote entirely.

7. KEYPHRASE STUFFING: If "{keyphrase}" appears more than 6 times in the article, remove the
   least natural occurrences. Target: 3-5 uses across the whole article.

8. UNSOURCED CLAIMS: Statements like "most teams use X" or "the industry standard is Y" without
   a citation — either add an inline link to a source from the research, or soften to "many teams"
   / "a common approach".

Return ONLY the corrected HTML content (no JSON wrapping, no markdown fences, no explanations).
If no issues are found, return the original HTML unchanged."""
