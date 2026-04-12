#!/usr/bin/env python3
"""
Blog Generator V2 — Multi-pass content generation pipeline.
Replaces the single-shot approach in blog_generator_free.py.

Key improvements over V1:
- Section-by-section generation (7-9 API calls instead of 1)
- Full research context passed to each section (not truncated)
- Author persona injected into every prompt
- Natural keyphrase integration (no mechanical find-and-replace)
- Internal linking via linker.py
- FAQ/AEO section generation
- TL;DR block for featured snippets
- Quality gate before publishing
"""

import os
import json
import re
import time
from difflib import SequenceMatcher
from typing import Dict, List, Optional
from datetime import datetime
from slugify import slugify
from pathlib import Path

try:
    import google.generativeai as genai
    from tavily import TavilyClient
except ImportError:
    raise ImportError("Missing dependencies: pip install google-generativeai tavily-python python-slugify")

try:
    from openai import OpenAI as _OpenAI
    OPENAI_SDK_AVAILABLE = True
except ImportError:
    OPENAI_SDK_AVAILABLE = False

from prompts import (
    build_outline_prompt,
    build_seo_metadata_prompt,
    build_hook_prompt,
    build_section_prompt,
    build_tldr_prompt,
    build_faq_prompt,
    build_natural_keyphrase_prompt,
    build_image_prompts,
    build_featured_image_prompt,
    build_comparison_table_prompt,
    build_editorial_review_prompt,
)
from linker import InternalLinker


class QuotaExhaustedException(Exception):
    """Raised when Gemini API quota is fully exhausted after retries."""
    pass


class BlogGeneratorV2:
    """Multi-pass blog generator with research, persona, and quality controls."""

    def __init__(
        self,
        gemini_api_key: str,
        tavily_api_key: str,
        author_config_path: str = "author_config.json",
        gemini_api_key_2: str = None,
        groq_api_key: str = None,
        cerebras_api_key: str = None,
        together_api_key: str = None,
        mistral_api_key: str = None,
        openrouter_api_key: str = None,
        cloudflare_api_key: str = None,
        cloudflare_account_id: str = None,
        openai_api_key: str = None,
    ):
        # Gemini setup — model is configurable via env
        genai.configure(api_key=gemini_api_key)
        self._primary_gemini_key = gemini_api_key
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.model = genai.GenerativeModel(self.model_name)

        # Tavily for web research
        self.tavily = TavilyClient(api_key=tavily_api_key)

        # Author persona
        config_path = Path(__file__).parent / author_config_path
        if config_path.exists():
            with open(config_path, "r", encoding="utf-8") as f:
                self.author = json.load(f)
        else:
            print(f"  Warning: {author_config_path} not found, using defaults")
            self.author = {"name": "Author", "role": "Data Engineer", "experience_years": 3}

        # Internal linker
        self.linker = InternalLinker()

        # Gemini generation settings
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
        self.gen_config = {
            "temperature": 0.8,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
        }
        self.gen_config_precise = {
            "temperature": 0.4,
            "top_p": 0.9,
            "max_output_tokens": 4096,
        }

        # ---- Build LLM provider fallback chain ----
        self._providers = []

        # Provider 1: Primary Gemini (already configured above)
        self._providers.append({
            "name": "gemini",
            "type": "gemini",
            "model": self.model,
            "model_name": self.model_name,
        })

        # Provider 2: Backup Gemini key (separate quota pool)
        if gemini_api_key_2:
            _backup_model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            # NOTE: genai.configure() is global — we can't call it here without
            # overriding the primary key. Instead, store the backup key and
            # reconfigure just before each call in _call_gemini_provider.
            self._providers.append({
                "name": "gemini_backup",
                "type": "gemini",
                "model": None,  # Created on-the-fly after reconfigure
                "model_name": _backup_model_name,
                "api_key": gemini_api_key_2,
            })

        # Provider 3+: OpenAI-compatible providers
        # Order: groq -> cerebras -> together -> mistral -> openrouter -> cloudflare -> openai
        if OPENAI_SDK_AVAILABLE:
            if groq_api_key:
                _groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
                self._providers.append({
                    "name": "groq",
                    "type": "openai_compat",
                    "client": _OpenAI(base_url="https://api.groq.com/openai/v1", api_key=groq_api_key),
                    "model_name": _groq_model,
                })

            if cerebras_api_key:
                _cerebras_model = os.getenv("CEREBRAS_MODEL", "llama3.3-70b")
                self._providers.append({
                    "name": "cerebras",
                    "type": "openai_compat",
                    "client": _OpenAI(base_url="https://api.cerebras.ai/v1", api_key=cerebras_api_key),
                    "model_name": _cerebras_model,
                })

            if together_api_key:
                _together_model = os.getenv("TOGETHER_MODEL", "meta-llama/Llama-3.3-70B-Instruct-Turbo")
                self._providers.append({
                    "name": "together",
                    "type": "openai_compat",
                    "client": _OpenAI(base_url="https://api.together.xyz/v1", api_key=together_api_key),
                    "model_name": _together_model,
                })

            if mistral_api_key:
                _mistral_model = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
                self._providers.append({
                    "name": "mistral",
                    "type": "openai_compat",
                    "client": _OpenAI(base_url="https://api.mistral.ai/v1", api_key=mistral_api_key),
                    "model_name": _mistral_model,
                })

            if openrouter_api_key:
                _or_model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
                self._providers.append({
                    "name": "openrouter",
                    "type": "openai_compat",
                    "client": _OpenAI(base_url="https://openrouter.ai/api/v1", api_key=openrouter_api_key),
                    "model_name": _or_model,
                })

            if cloudflare_api_key and cloudflare_account_id:
                _cf_model = os.getenv("CLOUDFLARE_MODEL", "@cf/meta/llama-3.3-70b-instruct-fp8")
                _cf_base = f"https://api.cloudflare.com/client/v4/accounts/{cloudflare_account_id}/ai/v1"
                self._providers.append({
                    "name": "cloudflare",
                    "type": "openai_compat",
                    "client": _OpenAI(base_url=_cf_base, api_key=cloudflare_api_key),
                    "model_name": _cf_model,
                })

            if openai_api_key:
                _oai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                self._providers.append({
                    "name": "openai",
                    "type": "openai_compat",
                    "client": _OpenAI(api_key=openai_api_key),
                    "model_name": _oai_model,
                })

        provider_names = [p["name"] for p in self._providers]
        print(f"  BlogGeneratorV2 initialized")
        print(f"    Primary model: {self.model_name}")
        print(f"    Provider chain: {' -> '.join(provider_names)}")
        print(f"    Author: {self.author.get('name', 'Unknown')}")

        # Request delay between API calls (seconds) — higher for free tier
        self.request_delay = float(os.getenv("GEMINI_REQUEST_DELAY", "3"))
        self.section_delay = float(os.getenv("GEMINI_SECTION_DELAY", "4"))

        # Track which providers are exhausted during this pipeline run
        self._exhausted_providers = set()

    # ------------------------------------------------------------------ #
    #  LLM call with multi-provider fallback + retry                       #
    # ------------------------------------------------------------------ #

    def _call_gemini(self, prompt: str, gen_config: dict = None) -> str:
        """Call LLM with multi-provider fallback chain.

        Tries each provider in order. On quota exhaustion from one provider,
        automatically falls back to the next. Providers that have been exhausted
        in this pipeline run are skipped immediately (no wasted retries).
        Raises QuotaExhaustedException only when ALL providers are exhausted.
        """
        last_error = None

        for provider in self._providers:
            # Skip providers already known to be exhausted this run
            if provider["name"] in self._exhausted_providers:
                continue

            try:
                print(f"      [provider: {provider['name']}]")
                if provider["type"] == "gemini":
                    return self._call_gemini_provider(provider, prompt, gen_config)
                else:
                    return self._call_openai_compat(provider, prompt, gen_config)
            except QuotaExhaustedException as e:
                print(f"      {provider['name']} quota exhausted, trying next provider...")
                self._exhausted_providers.add(provider["name"])
                last_error = e
                continue
            except Exception as e:
                # Non-quota errors (auth, network, etc.) — skip this provider
                print(f"      {provider['name']} error: {str(e)[:100]}, trying next provider...")
                last_error = e
                continue

        raise QuotaExhaustedException(
            f"All {len(self._providers)} LLM providers exhausted. "
            f"Last error: {str(last_error)[:200]}"
        )

    def _call_gemini_provider(self, provider: dict, prompt: str, gen_config: dict = None) -> str:
        """Call a Gemini provider with exponential backoff on 429 errors."""
        config = gen_config or self.gen_config
        max_retries = 2
        base_wait = 30  # seconds

        # If this provider has a separate API key (backup), reconfigure and create model
        if "api_key" in provider and provider["api_key"]:
            genai.configure(api_key=provider["api_key"])
            model = genai.GenerativeModel(provider["model_name"])
        else:
            model = provider["model"]

        try:
            for attempt in range(max_retries + 1):
                try:
                    response = model.generate_content(
                        prompt,
                        safety_settings=self.safety_settings,
                        generation_config=config,
                    )
                    return response.text
                except Exception as e:
                    error_str = str(e)
                    is_rate_limit = "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower() or "rate_limit" in error_str.lower()

                    if not is_rate_limit:
                        raise  # Non-429 errors bubble up immediately

                    if attempt == max_retries:
                        raise QuotaExhaustedException(
                            f"{provider['name']} quota exhausted after {max_retries} retries. "
                            f"Last error: {error_str[:200]}"
                        )

                    wait_time = base_wait * (2 ** attempt)  # 30s, 60s, 120s
                    delay_match = re.search(r'retry.*?(\d+(?:\.\d+)?)\s*s', error_str, re.IGNORECASE)
                    if delay_match:
                        parsed_delay = float(delay_match.group(1))
                        wait_time = max(wait_time, parsed_delay + 5)

                    print(f"      Rate limited (429). Waiting {wait_time:.0f}s before retry {attempt + 1}/{max_retries}...")
                    time.sleep(wait_time)

            # Should never reach here — loop always returns or raises
            raise QuotaExhaustedException(f"{provider['name']}: exhausted all retries")
        finally:
            # Restore primary key if we switched to backup
            if "api_key" in provider and provider["api_key"]:
                genai.configure(api_key=self._primary_gemini_key)

    def _call_openai_compat(self, provider: dict, prompt: str, gen_config: dict = None) -> str:
        """Call an OpenAI-compatible provider (Groq, OpenRouter, OpenAI)."""
        config = gen_config or self.gen_config
        client = provider["client"]
        model_name = provider["model_name"]

        temperature = config.get("temperature", 0.8)
        max_tokens = config.get("max_output_tokens", 8192)

        max_retries = 2
        base_wait = 10

        for attempt in range(max_retries + 1):
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert data engineering blog writer. Always respond with the exact format requested in the prompt. When JSON is requested, return ONLY valid JSON with no markdown fences or extra text.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=temperature,
                    max_tokens=min(max_tokens, 8192),
                )
                return response.choices[0].message.content
            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower() or "rate_limit" in error_str.lower()

                if not is_rate_limit:
                    raise

                if attempt == max_retries:
                    raise QuotaExhaustedException(
                        f"{provider['name']} quota exhausted after {max_retries} retries. "
                        f"Last error: {error_str[:200]}"
                    )

                wait_time = base_wait * (2 ** attempt)
                print(f"      {provider['name']} rate limited. Waiting {wait_time:.0f}s before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)

        # Should never reach here — loop always returns or raises
        raise QuotaExhaustedException(f"{provider['name']}: exhausted all retries")

    # ------------------------------------------------------------------ #
    #  Public API                                                         #
    # ------------------------------------------------------------------ #

    def generate_blog_post(self, topic: Dict) -> Dict:
        """Full multi-pass generation pipeline. Returns publisher-compatible dict."""

        print(f"\n{'='*70}")
        print(f"  GENERATING: {topic['title']}")
        print(f"{'='*70}\n")

        # Pass 1 — Research
        print("  PASS 1/12: Researching topic with Tavily...")
        research = self._research_topic(topic)
        print(f"    Found {len(research['sources'])} sources")
        time.sleep(self.request_delay)

        # Pass 2 — SEO metadata (benefit-driven, not formulaic)
        # CIRCUIT BREAKER: If quota is exhausted here, abort entirely
        print("\n  PASS 2/12: Generating SEO metadata...")
        seo = self._generate_seo_metadata(topic, research)
        print(f"    Keyphrase: '{seo['focus_keyphrase']}'")
        print(f"    Title: {seo['title']} ({len(seo['title'])} chars)")
        time.sleep(self.request_delay)

        # Pass 3 — Topic-specific outline
        # CIRCUIT BREAKER: If quota is exhausted here, abort entirely
        print("\n  PASS 3/12: Building topic-specific outline...")
        outline = self._generate_outline(topic, research)
        print(f"    Sections: {len(outline.get('sections', []))}")
        for s in outline.get("sections", [])[:4]:
            print(f"      - {s['heading']} [{s['purpose']}]")
        time.sleep(self.request_delay)

        keyphrase = seo["focus_keyphrase"]
        research_summary = research.get("summary", "")

        # Pass 4 — Personal hook / opening
        print("\n  PASS 4/12: Writing personal hook...")
        blocks = self._generate_hook(topic, outline.get("hook_angle", ""), keyphrase)
        print(f"    Generated {len(blocks)} opening blocks")
        time.sleep(self.request_delay)

        # Pass 5 — TL;DR block (placed at top, after hook)
        print("\n  PASS 5/12: Generating TL;DR summary...")
        tldr_blocks = self._generate_tldr(topic, outline, keyphrase, research_summary=research_summary)
        blocks.extend(tldr_blocks)
        print(f"    TL;DR added ({len(tldr_blocks)} blocks)")
        time.sleep(self.request_delay)

        # Pass 6 — Section-by-section content (the core improvement)
        # CIRCUIT BREAKER: If any section hits quota exhaustion, stop generating
        # remaining sections and abort the pipeline immediately.
        # DEDUP: Track code snippets and cited source URLs across sections
        print("\n  PASS 6/12: Generating sections...")
        previous_ending = self._last_text(blocks)
        used_code_snippets: List[str] = []
        used_source_urls: List[str] = []
        used_conclusions: List[str] = []
        for i, section in enumerate(outline.get("sections", [])):
            print(f"    Section {i+1}/{len(outline['sections'])}: {section['heading']}")
            try:
                section_blocks = self._generate_section(
                    section, topic, research, keyphrase, previous_ending,
                    previous_code_snippets=used_code_snippets,
                    used_source_urls=used_source_urls,
                    used_conclusions=used_conclusions,
                )
            except QuotaExhaustedException:
                print(f"\n    *** QUOTA EXHAUSTED at section {i+1}/{len(outline['sections'])} ***")
                print(f"    *** Aborting pipeline — no point generating fallback garbage ***")
                raise
            blocks.extend(section_blocks)
            previous_ending = self._last_text(section_blocks)
            # Extract code snippets and source URLs from this section for dedup
            for block in section_blocks:
                content = (block.get("innerContent") or [""])[0]
                if block.get("blockName") == "core/code":
                    # Store first 200 chars of code as fingerprint
                    clean = re.sub(r'<[^>]+>', '', content).strip()
                    if clean:
                        used_code_snippets.append(clean[:200])
                # Extract cited URLs from any block
                for url_match in re.findall(r'href="(https?://[^"]+)"', content):
                    if url_match not in used_source_urls:
                        used_source_urls.append(url_match)
                # Extract concluding sentences from paragraphs for dedup
                if block.get("blockName") == "core/paragraph":
                    text = re.sub(r'<[^>]+>', '', content).strip()
                    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 30]
                    if sentences:
                        # Track the last sentence of each paragraph as a potential conclusion
                        last_sentence = sentences[-1][:150]
                        if last_sentence not in used_conclusions:
                            used_conclusions.append(last_sentence)
            time.sleep(self.section_delay)
        print(f"    Tracked {len(used_code_snippets)} code snippets, {len(used_source_urls)} cited URLs, {len(used_conclusions)} conclusions")

        # Pass 7 — Comparison table for 'vs' articles
        title_lower = topic.get("title", "").lower()
        is_comparison = bool(re.search(r'\bvs\b|\bversus\b|\bcomparison\b|\bcompared\b', title_lower))
        if is_comparison:
            print("\n  PASS 7/12: Generating comparison table...")
            try:
                comp_prompt = build_comparison_table_prompt(topic, research, keyphrase)
                comp_text = self._call_gemini(comp_prompt)
                comp_blocks = json.loads(self._extract_json(comp_text))
                comp_blocks = self._validate_blocks(comp_blocks)
                # Insert comparison table after TL;DR (before first content section)
                insert_pos = None
                past_tldr = False
                for idx, block in enumerate(blocks):
                    content = (block.get("innerContent") or [""])[0]
                    if "TL;DR" in content:
                        past_tldr = True
                        continue
                    if past_tldr and block.get("blockName") == "core/heading":
                        insert_pos = idx
                        break
                if insert_pos is not None:
                    blocks[insert_pos:insert_pos] = comp_blocks
                else:
                    blocks.extend(comp_blocks)
                print(f"    Comparison table added ({len(comp_blocks)} blocks)")
            except QuotaExhaustedException:
                raise
            except Exception as e:
                print(f"    Comparison table generation failed: {e} — skipping")
            time.sleep(self.request_delay)
        else:
            print("\n  PASS 7/12: Skipped (not a comparison article)")

        # Pass 8 — FAQ section (AEO)
        print("\n  PASS 8/12: Generating FAQ section...")
        faq_blocks = self._generate_faq(topic, outline.get("faq_questions", []), keyphrase, research_summary=research_summary)
        blocks.extend(faq_blocks)
        print(f"    FAQ added ({len(faq_blocks)} blocks)")
        time.sleep(self.request_delay)

        # Pass 9 — Internal linking
        print("\n  PASS 9/12: Injecting internal links...")
        link_count_before = self._count_internal_links(blocks)
        blocks = self.linker.inject_links(blocks, topic)
        link_count_after = self._count_internal_links(blocks)
        print(f"    Added {link_count_after - link_count_before} internal links")

        # Pass 10 — Natural keyphrase polish
        print("\n  PASS 10/12: Keyphrase naturalness check...")
        blocks = self._natural_keyphrase_check(blocks, keyphrase)

        # Pass 11 — Editorial review (catch fabricated metrics, repeated content)
        print("\n  PASS 11/12: Editorial review pass...")
        blocks = self._editorial_review(blocks, keyphrase, research_summary)

        # Post-editorial structural repair (editorial LLM can strip <code> wrappers, break lists)
        blocks = self._validate_blocks(blocks)

        # Pass 12 — Generate image prompts
        print("\n  PASS 12/12: Generating image prompts...")
        images = self._generate_image_prompts(topic, blocks, keyphrase)

        # Build slug
        slug = self._generate_slug(seo["title"], keyphrase)

        # Calculate stats
        word_count = self._count_words(blocks)
        reading_time = max(1, round(word_count / 225))

        result = {
            "title": seo["title"],
            "content_blocks": blocks,
            "slug": slug,
            "seo": {
                "title": seo["title"],
                "focus_keyphrase": keyphrase,
                "meta_description": seo["meta_description"],
                "secondary_keywords": seo.get("secondary_keywords", []),
            },
            "images": images,
            "references": research["sources"],
            "research_summary": research.get("summary", ""),
            "category": topic.get("category", "data-engineering"),
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "word_count": word_count,
                "reading_time": reading_time,
                "sources_used": len(research["sources"]),
                "blocks_count": len(blocks),
                "editor": "gutenberg",
                "generator_version": "v2",
                "model": self.model_name,
                "passes": 12,
                "cost": "$0.00 (FREE)",
            },
        }

        print(f"\n{'='*70}")
        print(f"  BLOG POST COMPLETE")
        print(f"{'='*70}")
        print(f"    Words: {word_count}")
        print(f"    Reading time: {reading_time} min")
        print(f"    Blocks: {len(blocks)} (Gutenberg)")
        print(f"    Sources: {len(research['sources'])}")
        print(f"    Internal links: {link_count_after}")
        print(f"    Model: {self.model_name}")
        print(f"{'='*70}\n")

        return result

    # ------------------------------------------------------------------ #
    #  Pass 1: Research                                                   #
    # ------------------------------------------------------------------ #

    def _research_topic(self, topic: Dict) -> Dict:
        """Research topic using Tavily. Returns full source content (not truncated)."""

        base_query = topic["title"]
        category = topic.get("category", "")
        keywords = " ".join(topic.get("keywords", []))
        current_year = datetime.now().year
        search_query = f"{base_query} {category} {keywords} best practices tutorial {current_year}"

        try:
            response = self.tavily.search(
                query=search_query,
                search_depth="advanced",
                max_results=10,
                include_answer=True,
                include_raw_content=False,
            )

            sources = []
            for r in response.get("results", []):
                sources.append({
                    "title": r.get("title", "Source")[:100],
                    "url": r.get("url", ""),
                    "content": r.get("content", ""),  # FULL content, not truncated
                    "score": r.get("score", 0),
                })

            sources.sort(key=lambda x: x.get("score", 0), reverse=True)

            return {
                "query": search_query,
                "summary": response.get("answer", f"Comprehensive guide to {topic['title']} covering {category} best practices and implementation strategies"),
                "sources": sources[:8],
            }

        except Exception as e:
            print(f"    Tavily error: {str(e)[:80]}")
            return {
                "query": search_query,
                "summary": f"Comprehensive guide to {topic['title']} covering {category} best practices and implementation strategies",
                "sources": self._fallback_sources(topic),
            }

    def _fallback_sources(self, topic: Dict) -> List[Dict]:
        """Fallback sources when Tavily is unavailable."""
        category = topic.get("category", "").lower()
        source_map = {
            "snowflake": [
                {"title": "Snowflake Documentation", "url": "https://docs.snowflake.com", "content": "Official Snowflake documentation", "score": 0.95},
                {"title": "Snowflake Blog", "url": "https://www.snowflake.com/blog/", "content": "Latest Snowflake updates", "score": 0.9},
            ],
            "dbt": [
                {"title": "dbt Documentation", "url": "https://docs.getdbt.com", "content": "Official dbt documentation", "score": 0.95},
                {"title": "dbt Blog", "url": "https://www.getdbt.com/blog/", "content": "dbt best practices", "score": 0.9},
            ],
            "airflow": [
                {"title": "Apache Airflow Docs", "url": "https://airflow.apache.org/docs/", "content": "Airflow documentation", "score": 0.95},
            ],
            "python": [
                {"title": "Python Docs", "url": "https://docs.python.org/3/", "content": "Python documentation", "score": 0.95},
                {"title": "Real Python", "url": "https://realpython.com", "content": "Python tutorials", "score": 0.9},
            ],
            "sql": [
                {"title": "PostgreSQL Documentation", "url": "https://www.postgresql.org/docs/", "content": "PostgreSQL reference documentation", "score": 0.95},
                {"title": "SQLStyle Guide", "url": "https://www.sqlstyle.guide/", "content": "SQL style and best practices", "score": 0.85},
            ],
            "aws": [
                {"title": "AWS Documentation", "url": "https://docs.aws.amazon.com/", "content": "Amazon Web Services documentation", "score": 0.95},
                {"title": "AWS Big Data Blog", "url": "https://aws.amazon.com/blogs/big-data/", "content": "AWS big data and analytics blog", "score": 0.9},
            ],
            "azure": [
                {"title": "Azure Documentation", "url": "https://learn.microsoft.com/en-us/azure/", "content": "Microsoft Azure documentation", "score": 0.95},
                {"title": "Azure Data Blog", "url": "https://techcommunity.microsoft.com/category/azure/blog/azuredatablog", "content": "Azure data platform blog", "score": 0.9},
            ],
            "gcp": [
                {"title": "Google Cloud Documentation", "url": "https://cloud.google.com/docs", "content": "Google Cloud Platform documentation", "score": 0.95},
                {"title": "Google Cloud Blog", "url": "https://cloud.google.com/blog/", "content": "Google Cloud updates and best practices", "score": 0.9},
            ],
            "salesforce": [
                {"title": "Salesforce Developer Docs", "url": "https://developer.salesforce.com/docs", "content": "Salesforce developer documentation", "score": 0.95},
                {"title": "Salesforce Developer Blog", "url": "https://developer.salesforce.com/blogs/", "content": "Salesforce developer blog", "score": 0.9},
            ],
            "databricks": [
                {"title": "Databricks Documentation", "url": "https://docs.databricks.com/", "content": "Databricks platform documentation", "score": 0.95},
                {"title": "Databricks Blog", "url": "https://www.databricks.com/blog", "content": "Databricks engineering blog", "score": 0.9},
            ],
            "data-engineering": [
                {"title": "DuckDB Documentation", "url": "https://duckdb.org/docs/", "content": "DuckDB analytical database documentation", "score": 0.9},
                {"title": "Apache Iceberg Docs", "url": "https://iceberg.apache.org/docs/latest/", "content": "Apache Iceberg table format documentation", "score": 0.9},
            ],
            "open-source": [
                {"title": "DuckDB News", "url": "https://duckdb.org/news/", "content": "DuckDB releases and announcements", "score": 0.9},
                {"title": "Apache Spark Docs", "url": "https://spark.apache.org/docs/latest/", "content": "Apache Spark documentation", "score": 0.9},
            ],
            "career": [
                {"title": "Start Data Engineering", "url": "https://www.startdataengineering.com/", "content": "Data engineering career resources", "score": 0.9},
            ],
        }
        return source_map.get(category, [
            {"title": "Official Documentation", "url": "", "content": "Technical reference", "score": 0.8}
        ])

    # ------------------------------------------------------------------ #
    #  Pass 2: SEO Metadata                                               #
    # ------------------------------------------------------------------ #

    def _generate_seo_metadata(self, topic: Dict, research: Dict) -> Dict:
        """Generate benefit-driven SEO metadata (not formulaic)."""

        prompt = build_seo_metadata_prompt(topic, research)

        try:
            text = self._call_gemini(prompt, self.gen_config_precise)
            data = json.loads(self._extract_json(text))

            keyphrase = data.get("focus_keyphrase", "").lower().strip()
            if not keyphrase or len(keyphrase.split()) < 2:
                keyphrase = self._extract_keyphrase_from_title(topic["title"])

            title = data.get("title", "")
            if not title or len(title) > 60:
                # Build a natural fallback from the topic title instead of a generic pattern
                title = topic["title"]
                if len(title) > 60:
                    title = title[:57] + "..."

            meta_desc = data.get("meta_description", "")
            if not meta_desc or len(meta_desc) > 165:
                meta_desc = f"Learn {keyphrase} with real-world examples and production-tested patterns. A hands-on guide for data engineers."
                if len(meta_desc) > 160:
                    meta_desc = meta_desc[:157] + "..."

            secondary = data.get("secondary_keywords", [])
            if len(secondary) < 5:
                secondary.extend([f"{keyphrase} tutorial", f"{keyphrase} example", f"best {keyphrase}"])
                secondary = list(dict.fromkeys(secondary))  # dedupe

            return {
                "focus_keyphrase": keyphrase,
                "title": title,
                "meta_description": meta_desc,
                "secondary_keywords": secondary[:7],
            }

        except QuotaExhaustedException:
            raise  # Critical pass — abort pipeline
        except Exception as e:
            print(f"    SEO generation error: {e}")
            keyphrase = self._extract_keyphrase_from_title(topic["title"])
            return {
                "focus_keyphrase": keyphrase,
                "title": f"{keyphrase.title()}: A Practical Guide",
                "meta_description": f"Learn {keyphrase} with hands-on examples. A practical guide for data engineers.",
                "secondary_keywords": [f"{keyphrase} tutorial", f"{keyphrase} example"],
            }

    def _extract_keyphrase_from_title(self, title: str) -> str:
        """Extract a reasonable keyphrase from the topic title."""
        stop_words = {
            "the", "a", "an", "to", "for", "of", "in", "on", "with",
            "guide", "complete", "ultimate", "comprehensive", "mastering",
        }
        words = [w.lower() for w in title.split() if w.lower() not in stop_words and len(w) > 2]
        return " ".join(words[:3])

    # ------------------------------------------------------------------ #
    #  Pass 3: Outline                                                    #
    # ------------------------------------------------------------------ #

    def _generate_outline(self, topic: Dict, research: Dict) -> Dict:
        """Generate a topic-specific outline (not a hardcoded template)."""

        prompt = build_outline_prompt(topic, research, self.author)

        try:
            text = self._call_gemini(prompt, self.gen_config_precise)
            outline = json.loads(self._extract_json(text))

            # Validate structure
            if "sections" not in outline or len(outline["sections"]) < 3:
                raise ValueError("Outline has fewer than 3 sections")

            # Ensure each section has required fields
            for section in outline["sections"]:
                section.setdefault("heading", "Section")
                section.setdefault("purpose", "teach")
                section.setdefault("key_points", [])

            outline.setdefault("hook_angle", "a practical lesson learned on the job")
            outline.setdefault("faq_questions", [f"What is {topic['title']}?"])

            return outline

        except QuotaExhaustedException:
            raise  # Critical pass — abort pipeline
        except Exception as e:
            print(f"    Outline generation error: {e}")
            return self._fallback_outline(topic)

    def _fallback_outline(self, topic: Dict) -> Dict:
        """Topic-aware fallback outline (better than hardcoded 7 categories)."""
        title = topic["title"]
        return {
            "hook_angle": f"a real production experience with {title}",
            "sections": [
                {"heading": f"What Problem Does {title} Solve?", "purpose": "teach", "key_points": ["the core problem", "why existing solutions fall short"]},
                {"heading": f"How {title} Works Under the Hood", "purpose": "teach", "key_points": ["architecture overview", "key components"]},
                {"heading": "Setting It Up Step by Step", "purpose": "code", "key_points": ["prerequisites", "installation", "configuration"]},
                {"heading": "A Real Example from Production", "purpose": "code", "key_points": ["complete working code", "expected output"]},
                {"heading": "What Can Go Wrong", "purpose": "warn", "key_points": ["common mistakes", "debugging tips"]},
                {"heading": "When to Use It (and When Not To)", "purpose": "compare", "key_points": ["good use cases", "alternatives"]},
            ],
            "faq_questions": [
                f"What is {title}?",
                f"How do I get started with {title}?",
                f"What are common {title} mistakes?",
                f"Is {title} free to use?",
            ],
        }

    # ------------------------------------------------------------------ #
    #  Pass 4: Personal Hook                                              #
    # ------------------------------------------------------------------ #

    def _generate_hook(self, topic: Dict, hook_angle: str, keyphrase: str) -> List[Dict]:
        """Generate opening paragraphs with a personal story hook."""

        prompt = build_hook_prompt(topic, self.author, hook_angle, keyphrase)

        try:
            text = self._call_gemini(prompt)
            blocks = json.loads(self._extract_json(text))

            if not isinstance(blocks, list) or len(blocks) == 0:
                raise ValueError("Hook returned no blocks")

            # Validate blocks have correct structure
            blocks = self._validate_blocks(blocks)
            return blocks

        except QuotaExhaustedException:
            raise  # Let circuit breaker handle this
        except Exception as e:
            print(f"    Hook generation error: {e}")
            name = self.author.get("name", "I")
            return [
                {
                    "blockName": "core/paragraph",
                    "attrs": {},
                    "innerContent": [f"<p>After working with {keyphrase} in production for months, I've learned a few things the documentation doesn't tell you. This article covers the practical side — what works, what breaks, and what I wish someone had told me earlier.</p>"],
                }
            ]

    # ------------------------------------------------------------------ #
    #  Pass 5: TL;DR                                                      #
    # ------------------------------------------------------------------ #

    def _generate_tldr(self, topic: Dict, outline: Dict, keyphrase: str, research_summary: str = "") -> List[Dict]:
        """Generate TL;DR summary block for featured snippet optimization."""

        prompt = build_tldr_prompt(topic, outline, keyphrase, research_summary=research_summary)

        try:
            text = self._call_gemini(prompt, self.gen_config_precise)
            blocks = json.loads(self._extract_json(text))
            return self._validate_blocks(blocks)

        except QuotaExhaustedException:
            raise  # Let circuit breaker handle this
        except Exception as e:
            print(f"    TL;DR generation error: {e}")
            return [
                {
                    "blockName": "core/heading",
                    "attrs": {"level": 2},
                    "innerContent": ["<h2>TL;DR</h2>"],
                },
                {
                    "blockName": "core/list",
                    "attrs": {},
                    "innerContent": [f"<ul><li>This article covers practical {keyphrase} patterns for production use.</li><li>Includes working code examples and common gotchas.</li><li>Based on real-world experience, not just documentation.</li></ul>"],
                },
                {
                    "blockName": "core/separator",
                    "attrs": {},
                    "innerContent": ['<hr class="wp-block-separator has-alpha-channel-opacity"/>'],
                },
            ]

    # ------------------------------------------------------------------ #
    #  Pass 6: Section-by-Section Content                                 #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _count_section_words(blocks: List[Dict]) -> int:
        """Count words in section blocks (paragraphs, lists, code, quotes)."""
        text_parts = []
        for block in blocks:
            bname = block.get("blockName", "")
            if bname in ("core/paragraph", "core/list", "core/code", "core/quote"):
                inner = block.get("innerContent", [])
                raw = " ".join(inner) if isinstance(inner, list) else str(inner)
                clean = re.sub(r"<[^>]+>", " ", raw)
                text_parts.append(clean)
        combined = " ".join(text_parts)
        return len(combined.split())

    def _generate_section(
        self,
        section: Dict,
        topic: Dict,
        research: Dict,
        keyphrase: str,
        previous_ending: str,
        previous_code_snippets: Optional[List[str]] = None,
        used_source_urls: Optional[List[str]] = None,
        used_conclusions: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Generate ONE section (300-500 words) with full research context."""

        prompt = build_section_prompt(
            section, topic, research, self.author, keyphrase, previous_ending,
            previous_code_snippets=previous_code_snippets,
            used_source_urls=used_source_urls,
            used_conclusions=used_conclusions,
        )

        try:
            text = self._call_gemini(prompt)
            try:
                blocks = json.loads(self._extract_json(text))
                if not isinstance(blocks, list) or len(blocks) == 0:
                    raise ValueError("Section returned no blocks")
            except (json.JSONDecodeError, ValueError) as parse_err:
                print(f"    JSON parse failed for '{section.get('heading', '?')}': {parse_err}, retrying once...")
                json_nudge = (
                    "\n\nCRITICAL: Your previous response was not valid JSON. "
                    "Return ONLY a JSON array of WordPress Gutenberg blocks. "
                    "No markdown, no explanation — just the JSON array starting with [ and ending with ]."
                )
                text = self._call_gemini(prompt + json_nudge)
                blocks = json.loads(self._extract_json(text))
                if not isinstance(blocks, list) or len(blocks) == 0:
                    raise ValueError("Section returned no blocks after retry")

            blocks = self._validate_blocks(blocks)

            # Per-section word count validation — retry once if too thin
            word_count = self._count_section_words(blocks)
            if word_count < 200:
                print(f"    Section '{section.get('heading', '?')}' too thin ({word_count} words), retrying with expansion nudge...")
                expansion_nudge = (
                    "\n\nIMPORTANT: Your previous attempt was too short. "
                    "Write at least 300 words. Add more actionable detail, "
                    "a concrete example, or a personal experience to reach depth."
                )
                try:
                    text = self._call_gemini(prompt + expansion_nudge)
                    retry_blocks = json.loads(self._extract_json(text))
                    if isinstance(retry_blocks, list) and len(retry_blocks) > 0:
                        retry_blocks = self._validate_blocks(retry_blocks)
                        if self._count_section_words(retry_blocks) > word_count:
                            blocks = retry_blocks
                        else:
                            print(f"    Retry didn't improve word count, keeping original")
                    else:
                        print(f"    Retry returned invalid blocks, keeping original")
                except QuotaExhaustedException:
                    raise
                except Exception as retry_err:
                    print(f"    Retry failed ({retry_err}), keeping original")

            # Ensure the section starts with its heading
            if blocks[0].get("blockName") != "core/heading":
                blocks.insert(0, {
                    "blockName": "core/heading",
                    "attrs": {"level": 2},
                    "innerContent": [f"<h2>{section['heading']}</h2>"],
                })

            return blocks

        except QuotaExhaustedException:
            raise  # Let circuit breaker handle this
        except Exception as e:
            print(f"    Section generation error ({section.get('heading', '?')}): {e}")
            return self._fallback_section(section, topic, keyphrase)

    def _fallback_section(self, section: Dict, topic: Dict, keyphrase: str) -> List[Dict]:
        """Generate a fallback section with topic-aware, non-thin content."""
        heading = section.get("heading", "Section")
        key_points = section.get("key_points", [])
        purpose = section.get("purpose", "teach")
        title = topic.get("title", keyphrase)

        blocks = [
            {
                "blockName": "core/heading",
                "attrs": {"level": 2},
                "innerContent": [f"<h2>{heading}</h2>"],
            },
        ]

        # Vary the content based on section purpose
        if purpose == "code" and key_points:
            blocks.append({
                "blockName": "core/paragraph",
                "attrs": {},
                "innerContent": [f"<p>Let's walk through {key_points[0] if key_points else heading.lower()} with a hands-on example. The setup below reflects a typical production configuration for {keyphrase}.</p>"],
            })
            # Topic-aware code skeleton instead of placeholder TODO
            code_points = key_points[:3] if key_points else [heading.lower()]
            category = topic.get("category", "").lower()
            lang = "python" if "python" in category or "airflow" in category or "spark" in category else "sql"
            code_comment = "#" if lang == "python" else "--"
            code_lines = [f"{code_comment} {heading}: Production-ready pattern for {keyphrase}"]
            for i, pt in enumerate(code_points, 1):
                code_lines.append(f"{code_comment} Step {i}: {pt.strip().capitalize()}")
                code_lines.append(f"{code_comment}   Configure this based on your data volume and SLA targets")
            code_lines.append(f"\n{code_comment} Verify: Run a test query to confirm {keyphrase} behavior")
            code_body = "\n".join(code_lines)
            blocks.append({
                "blockName": "core/code",
                "attrs": {"language": lang},
                "innerContent": [f"<pre><code class=\"language-{lang}\">{code_body}</code></pre>"],
            })
            blocks.append({
                "blockName": "core/paragraph",
                "attrs": {},
                "innerContent": [f"<p><strong>Key takeaway:</strong> Always validate {keyphrase} changes in a non-production environment first. Run your heaviest query pattern against the new configuration and compare execution plans before and after to confirm the expected improvement.</p>"],
            })
        elif purpose == "warn":
            points_text = " and ".join(key_points[:2]) if key_points else "common issues"
            blocks.append({
                "blockName": "core/paragraph",
                "attrs": {},
                "innerContent": [f"<p>When working with {keyphrase}, watch out for {points_text}. These are the issues that tend to surface in production rather than during development or testing.</p>"],
            })
            if key_points:
                warn_items = []
                for pt in key_points[:4]:
                    warn_items.append(f"<li><strong>{pt.strip().capitalize()}</strong> — monitor this in your observability dashboard and set alerts for anomalous patterns.</li>")
                blocks.append({
                    "blockName": "core/list",
                    "attrs": {},
                    "innerContent": ["<ul>" + "".join(warn_items) + "</ul>"],
                })
            else:
                blocks.append({
                    "blockName": "core/list",
                    "attrs": {},
                    "innerContent": ["<ul><li><strong>Configuration drift</strong> — use version-controlled config files and compare staging vs production settings before each deploy.</li><li><strong>Silent failures under load</strong> — add query-level timeout monitoring and alert when p99 latency exceeds your SLA threshold.</li></ul>"],
                })
            blocks.append({
                "blockName": "core/paragraph",
                "attrs": {},
                "innerContent": [f"<p><strong>Actionable step:</strong> Set up a weekly review of your {keyphrase} error logs. Most production incidents leave warning signals 24-48 hours before they escalate.</p>"],
            })
        elif purpose == "compare":
            blocks.append({
                "blockName": "core/paragraph",
                "attrs": {},
                "innerContent": [f"<p>Evaluating {keyphrase} against alternatives requires looking at three concrete dimensions: throughput under your actual query patterns, operational overhead for your team size, and total cost at your data volume.</p>"],
            })
            if key_points:
                compare_descriptions = [
                    "benchmark this with a representative subset of your production workload before committing.",
                    "evaluate this by measuring cost-per-query at your actual data volume, not just speed.",
                    "compare setup complexity and ongoing maintenance effort across your team's skill set.",
                    "test failure modes and recovery time — resilience matters as much as throughput.",
                ]
                compare_items = []
                for i, pt in enumerate(key_points[:4]):
                    desc = compare_descriptions[i % len(compare_descriptions)]
                    compare_items.append(f"<li><strong>{pt.strip().capitalize()}</strong> — {desc}</li>")
                blocks.append({
                    "blockName": "core/list",
                    "attrs": {},
                    "innerContent": ["<ul>" + "".join(compare_items) + "</ul>"],
                })
            blocks.append({
                "blockName": "core/paragraph",
                "attrs": {},
                "innerContent": [f"<p><strong>Decision framework:</strong> Run a 2-week proof of concept with your top 5 most expensive queries. Measure wall-clock time, compute cost, and developer effort to migrate. The tool that wins on at least 2 of these 3 dimensions is usually the right choice.</p>"],
            })
        else:
            # Default "teach" purpose
            if key_points:
                intro_point = key_points[0]
                blocks.append({
                    "blockName": "core/paragraph",
                    "attrs": {},
                    "innerContent": [f"<p>Understanding {intro_point} is foundational to working effectively with {keyphrase}. Here is what this looks like in practice and the specific patterns that separate production-grade implementations from tutorial-level setups.</p>"],
                })
                if len(key_points) > 1:
                    teach_descriptions = [
                        f"a foundational concept you will apply directly when building {keyphrase} pipelines.",
                        f"understanding this helps you avoid the most common performance pitfalls with {keyphrase}.",
                        f"teams that master this pattern report significantly fewer production incidents with {keyphrase}.",
                        f"this is where most optimization gains come from when scaling {keyphrase} workloads.",
                        f"getting this right early prevents costly rework when your {keyphrase} usage grows.",
                    ]
                    teach_items = []
                    for i, pt in enumerate(key_points):
                        desc = teach_descriptions[i % len(teach_descriptions)]
                        teach_items.append(f"<li><strong>{pt.strip().capitalize()}</strong> — {desc}</li>")
                    blocks.append({
                        "blockName": "core/list",
                        "attrs": {},
                        "innerContent": ["<ul>" + "".join(teach_items) + "</ul>"],
                    })
            else:
                blocks.append({
                    "blockName": "core/paragraph",
                    "attrs": {},
                    "innerContent": [f"<p>{heading} directly impacts how {title} performs under real workloads. Teams that skip this step typically hit scaling bottlenecks within the first quarter of production use.</p>"],
                })
            blocks.append({
                "blockName": "core/paragraph",
                "attrs": {},
                "innerContent": [f"<p><strong>Practical next step:</strong> Audit your current {keyphrase} setup against the patterns described above. Start with the area where you have the most production incidents — that is where the highest ROI improvement lives.</p>"],
            })

        # Flag fallback blocks so quality gate can detect them
        for block in blocks:
            block["fallback_used"] = True

        return blocks

    # ------------------------------------------------------------------ #
    #  Pass 7: FAQ (AEO)                                                  #
    # ------------------------------------------------------------------ #

    def _generate_faq(self, topic: Dict, faq_questions: List[str], keyphrase: str, research_summary: str = "") -> List[Dict]:
        """Generate FAQ section for Answer Engine Optimization."""

        if not faq_questions:
            faq_questions = [
                f"What is {topic['title']}?",
                f"How do I get started with {keyphrase}?",
                f"What are common {keyphrase} mistakes?",
            ]

        prompt = build_faq_prompt(topic, faq_questions, keyphrase, research_summary=research_summary)

        try:
            text = self._call_gemini(prompt)
            try:
                blocks = json.loads(self._extract_json(text))
                if not isinstance(blocks, list) or len(blocks) == 0:
                    raise ValueError("FAQ returned no blocks")
            except (json.JSONDecodeError, ValueError) as parse_err:
                print(f"    FAQ JSON parse failed: {parse_err}, retrying once...")
                json_nudge = (
                    "\n\nCRITICAL: Your previous response was not valid JSON. "
                    "Return ONLY a JSON array of WordPress Gutenberg blocks. "
                    "No markdown, no explanation — just the JSON array starting with [ and ending with ]."
                )
                text = self._call_gemini(prompt + json_nudge)
                blocks = json.loads(self._extract_json(text))
                if not isinstance(blocks, list) or len(blocks) == 0:
                    raise ValueError("FAQ returned no blocks after retry")
            return self._validate_blocks(blocks)

        except QuotaExhaustedException:
            raise  # Let circuit breaker handle this
        except Exception as e:
            print(f"    FAQ generation failed: {e}, using question-aware fallback")
            # Question-aware fallback FAQ — parse each question to generate
            # an answer that actually matches the question type
            faq_blocks = [
                {
                    "blockName": "core/heading",
                    "attrs": {"level": 2},
                    "innerContent": ["<h2>Frequently Asked Questions</h2>"],
                }
            ]
            title = topic.get("title", keyphrase)
            for q in faq_questions[:4]:
                q_lower = q.lower()
                # Classify question type and build a relevant answer
                if q_lower.startswith("what is") or q_lower.startswith("what are"):
                    answer = (
                        f"{title} is a technique used in data engineering to improve "
                        f"pipeline reliability and performance. It addresses common "
                        f"challenges teams face when working with {keyphrase} at scale, "
                        f"and is covered in detail in the sections above."
                    )
                elif "how do i" in q_lower or "how to" in q_lower or "get started" in q_lower:
                    answer = (
                        f"Start by reviewing the prerequisites in the setup section above. "
                        f"The core steps are: configure your environment, run the basic example "
                        f"from this article, then iterate on your specific use case. "
                        f"Most teams get a working {keyphrase} setup within a single sprint."
                    )
                elif "mistake" in q_lower or "avoid" in q_lower or "wrong" in q_lower:
                    answer = (
                        f"The most common {keyphrase} mistakes are: skipping validation in "
                        f"non-production environments, ignoring data volume when choosing "
                        f"configurations, and not monitoring performance after deployment. "
                        f"The pitfalls section above covers each of these in detail."
                    )
                elif "can i" in q_lower or "is it possible" in q_lower or "does" in q_lower:
                    answer = (
                        f"Yes, this is supported. The approach depends on your specific "
                        f"data volume and infrastructure. Review the examples in this article "
                        f"for practical patterns, and consult the official documentation for "
                        f"the latest configuration options."
                    )
                elif "performance" in q_lower or "slow" in q_lower or "fast" in q_lower or "optimi" in q_lower:
                    answer = (
                        f"Performance with {keyphrase} depends on data volume, query patterns, "
                        f"and your configuration choices. The optimization techniques covered "
                        f"in this article — particularly around indexing and partitioning — "
                        f"address the most common bottlenecks."
                    )
                elif "cost" in q_lower or "free" in q_lower or "pricing" in q_lower:
                    answer = (
                        f"Pricing varies by platform and usage tier. Many of the {keyphrase} "
                        f"techniques in this article work on free-tier accounts. Check the "
                        f"official pricing page for your platform for current details."
                    )
                else:
                    # Generic but still references the article content
                    answer = (
                        f"This depends on your specific setup and requirements. The article "
                        f"above covers the key considerations for {keyphrase}, including "
                        f"practical examples and common trade-offs. Start with the approach "
                        f"that best fits your current data volume and team size."
                    )
                faq_blocks.append({
                    "blockName": "core/heading",
                    "attrs": {"level": 3},
                    "innerContent": [f"<h3>{q}</h3>"],
                })
                faq_blocks.append({
                    "blockName": "core/paragraph",
                    "attrs": {},
                    "innerContent": [f"<p>{answer}</p>"],
                })
            return faq_blocks

    # ------------------------------------------------------------------ #
    #  Pass 9: Natural Keyphrase Check                                    #
    # ------------------------------------------------------------------ #

    def _natural_keyphrase_check(self, blocks: List[Dict], keyphrase: str) -> List[Dict]:
        """Ensure keyphrase appears naturally throughout the article.

        Instead of mechanical find-and-replace ("this approach" -> keyphrase),
        we ask the LLM to rewrite specific paragraphs if the keyphrase density
        is too low.
        """

        # Count current keyphrase occurrences
        total_count = 0
        total_paragraphs = 0
        for block in blocks:
            content = (block.get("innerContent") or [""])[0]
            total_count += content.lower().count(keyphrase.lower())
            if block.get("blockName") == "core/paragraph":
                total_paragraphs += 1

        word_count = self._count_words(blocks)
        # Target: keyphrase every ~300 words (roughly 0.3-0.5% density)
        target_count = max(5, word_count // 300)

        print(f"    Keyphrase '{keyphrase}' appears {total_count} times (target: {target_count})")

        if total_count >= target_count:
            return blocks

        # Find paragraphs without the keyphrase and rewrite a few
        # Prioritize introduction (first 3 paragraphs) for SEO — keyphrase
        # in the opening is critical for search ranking.
        needed = min(target_count - total_count, 4)  # max 4 rewrites per run
        rewritten = 0

        intro_candidates = []
        later_candidates = []
        para_seen = 0
        for i, block in enumerate(blocks):
            if block.get("blockName") != "core/paragraph":
                continue
            para_seen += 1
            content = (block.get("innerContent") or [""])[0]
            if keyphrase.lower() in content.lower():
                continue
            text_len = len(re.sub(r"<[^>]+>", "", content))
            if text_len < 80:
                continue
            if para_seen <= 3:
                intro_candidates.append(i)
            else:
                later_candidates.append(i)

        # Process intro paragraphs first, then later ones
        candidates = intro_candidates + later_candidates

        for i in candidates:
            if rewritten >= needed:
                break
            block = blocks[i]

            content = (block.get("innerContent") or [""])[0]

            try:
                prompt = build_natural_keyphrase_prompt(content, keyphrase)
                new_content = self._call_gemini(
                    prompt, {"temperature": 0.3, "max_output_tokens": 1024}
                ).strip()
                # Clean markdown fences if present
                if new_content.startswith("```"):
                    new_content = new_content.split("```")[1]
                    if new_content.startswith("html"):
                        new_content = new_content[4:]
                    new_content = new_content.strip()

                # Strip any preamble text before the HTML tag
                # (OpenAI-compat models may add "Here is the rewritten paragraph:" etc.)
                p_idx = new_content.find("<p>")
                if p_idx > 0:
                    new_content = new_content[p_idx:]

                # Validate it still looks like HTML
                if "<p>" in new_content and keyphrase.lower() in new_content.lower():
                    blocks[i]["innerContent"][0] = new_content
                    rewritten += 1
                    time.sleep(0.5)

            except QuotaExhaustedException:
                print(f"    Quota exhausted during keyphrase rewrite — skipping remaining rewrites")
                break  # Stop rewriting but don't abort; keyphrase polish is non-critical
            except Exception:
                continue

        print(f"    Rewrote {rewritten} paragraphs for natural keyphrase integration")
        return blocks

    # ------------------------------------------------------------------ #
    #  Pass 11: Editorial Review                                           #
    # ------------------------------------------------------------------ #

    def _editorial_review(self, blocks: List[Dict], keyphrase: str, research_summary: str) -> List[Dict]:
        """Post-generation editorial review to catch fabricated metrics and repetition.

        Assembles all paragraph/code content into HTML, sends it through
        the editorial review prompt, then patches the blocks in-place.
        """

        # Assemble paragraphs and code blocks into a single HTML string
        reviewable_html = ""
        reviewable_indices = []  # (index, block_type) for blocks we sent for review
        for i, block in enumerate(blocks):
            bname = block.get("blockName", "")
            if bname in ("core/paragraph", "core/code", "core/list"):
                content = (block.get("innerContent") or [""])[0]
                reviewable_html += content + "\n"
                reviewable_indices.append(i)

        if not reviewable_html.strip():
            print("    No reviewable content — skipping editorial review")
            return blocks

        # Limit review to 12k chars to stay within context
        if len(reviewable_html) > 12000:
            reviewable_html = reviewable_html[:12000]

        try:
            prompt = build_editorial_review_prompt(reviewable_html, keyphrase, research_summary)
            reviewed_text = self._call_gemini(prompt, self.gen_config_precise)

            # Strip common LLM preamble and markdown fences from response
            if reviewed_text:
                reviewed_text = reviewed_text.strip()
                # Remove markdown code fences (```html ... ``` or ``` ... ```)
                reviewed_text = re.sub(r'^```(?:html)?\s*\n?', '', reviewed_text)
                reviewed_text = re.sub(r'\n?```\s*$', '', reviewed_text)
                # Remove common preamble lines before first HTML tag
                first_tag = re.search(r'<[a-zA-Z]', reviewed_text)
                if first_tag and first_tag.start() > 0:
                    preamble = reviewed_text[:first_tag.start()]
                    # Only strip if preamble is short prose (not HTML content)
                    if len(preamble) < 200 and '<' not in preamble:
                        reviewed_text = reviewed_text[first_tag.start():]
                reviewed_text = reviewed_text.strip()

            # The review returns corrected HTML. We need to map corrections
            # back to original blocks. Since the LLM may restructure slightly,
            # we do a simple approach: split by block boundaries and patch.
            # If the reviewed text is mostly similar, keep it. If wildly different, skip.
            if reviewed_text and len(reviewed_text) > len(reviewable_html) * 0.5:
                # Extract paragraphs, code, and lists from reviewed HTML
                reviewed_paragraphs = re.findall(r'<p>.*?</p>', reviewed_text, re.DOTALL)
                reviewed_code = re.findall(r'<pre>.*?</pre>', reviewed_text, re.DOTALL)
                reviewed_lists = re.findall(r'<[uo]l>.*?</[uo]l>', reviewed_text, re.DOTALL)

                # Count original blocks by type for safety check
                orig_para_count = sum(1 for i in reviewable_indices if blocks[i].get("blockName") == "core/paragraph")
                orig_code_count = sum(1 for i in reviewable_indices if blocks[i].get("blockName") == "core/code")
                orig_list_count = sum(1 for i in reviewable_indices if blocks[i].get("blockName") == "core/list")

                # Safety: skip patching a type if count drifted too far (LLM merged/split blocks)
                safe_para = len(reviewed_paragraphs) >= orig_para_count * 0.5
                safe_code = len(reviewed_code) >= orig_code_count * 0.5 if orig_code_count else True
                safe_list = len(reviewed_lists) >= orig_list_count * 0.5 if orig_list_count else True

                # Patch blocks with reviewed versions by type (skip code — editorial can corrupt structure)
                # Use similarity matching to avoid misaligned patching when LLM merges/splits blocks
                para_idx = 0
                list_idx = 0
                for i in reviewable_indices:
                    block = blocks[i]
                    bname = block.get("blockName", "")
                    original = (block.get("innerContent") or [""])[0] if block.get("innerContent") else ""
                    if bname == "core/paragraph" and safe_para and para_idx < len(reviewed_paragraphs):
                        candidate = reviewed_paragraphs[para_idx]
                        similarity = SequenceMatcher(None, original, candidate).ratio()
                        if similarity > 0.3:
                            blocks[i]["innerContent"] = [candidate]
                        para_idx += 1
                    elif bname == "core/list" and safe_list and list_idx < len(reviewed_lists):
                        candidate = reviewed_lists[list_idx]
                        similarity = SequenceMatcher(None, original, candidate).ratio()
                        if similarity > 0.3:
                            blocks[i]["innerContent"] = [candidate]
                        list_idx += 1

                changes = para_idx + list_idx
                skipped = []
                if not safe_para:
                    skipped.append(f"paragraphs ({len(reviewed_paragraphs)} vs {orig_para_count})")
                if not safe_code:
                    skipped.append(f"code ({len(reviewed_code)} vs {orig_code_count})")
                if not safe_list:
                    skipped.append(f"lists ({len(reviewed_lists)} vs {orig_list_count})")
                skip_msg = f" — skipped mismatched types: {', '.join(skipped)}" if skipped else ""
                print(f"    Editorial review applied — patched {changes} blocks ({para_idx} paragraphs, {list_idx} lists, code blocks preserved){skip_msg}")
            else:
                print("    Editorial review returned insufficient content — skipping")

        except QuotaExhaustedException:
            print("    Quota exhausted during editorial review — skipping (non-critical)")
        except Exception as e:
            print(f"    Editorial review failed: {e} — skipping (non-critical)")

        return blocks

    # ------------------------------------------------------------------ #
    #  Image Prompts                                                      #
    # ------------------------------------------------------------------ #

    def _generate_image_prompts(self, topic: Dict, blocks: List[Dict], keyphrase: str = '') -> List[Dict]:
        """Generate image prompts for the article."""

        prompt = build_image_prompts(topic, blocks)
        featured_prompt = build_featured_image_prompt(topic, keyphrase)

        try:
            text = self._call_gemini(
                prompt, {"temperature": 0.7, "max_output_tokens": 2000}
            )
            images = json.loads(self._extract_json(text))
            if isinstance(images, list) and len(images) > 0:
                # Override hero image prompt with the dedicated watercolor prompt
                for img in images:
                    if img.get('placement') == 'hero':
                        img['prompt'] = featured_prompt
                        break
                return images
            raise ValueError("No images returned")

        except QuotaExhaustedException:
            print(f"    Quota exhausted during image prompt generation — using default")
            return [
                {
                    "placement": "hero",
                    "prompt": featured_prompt,
                    "alt_text": f"{topic['title']} watercolor architecture diagram",
                    "caption": "Technical overview",
                }
            ]
        except Exception:
            return [
                {
                    "placement": "hero",
                    "prompt": featured_prompt,
                    "alt_text": f"{topic['title']} watercolor architecture diagram",
                    "caption": "Technical overview",
                }
            ]

    # ------------------------------------------------------------------ #
    #  Utilities                                                          #
    # ------------------------------------------------------------------ #

    def _generate_slug(self, title: str, keyphrase: str) -> str:
        """Generate an SEO-friendly slug."""
        slug = slugify(keyphrase)
        if len(slug) < 15:
            slug = slugify(title)
        # Trim to reasonable length
        if len(slug) > 60:
            slug = slug[:60].rstrip("-")
        return slug

    def _count_words(self, blocks: List[Dict]) -> int:
        """Count words across all blocks."""
        total = 0
        for block in blocks:
            content = (block.get("innerContent") or [""])[0]
            text = re.sub(r"<[^>]+>", "", content)
            total += len(text.split())
        return total

    def _count_internal_links(self, blocks: List[Dict]) -> int:
        """Count internal links in blocks."""
        count = 0
        for block in blocks:
            content = (block.get("innerContent") or [""])[0]
            count += content.count("/articles/")
        return count

    def _last_text(self, blocks: List[Dict], chars: int = 200) -> str:
        """Get the last N characters of text from blocks (for narrative flow)."""
        if not blocks:
            return ""
        for block in reversed(blocks):
            content = (block.get("innerContent") or [""])[0]
            text = re.sub(r"<[^>]+>", "", content).strip()
            if text:
                return text[-chars:]
        return ""

    def _validate_blocks(self, blocks: List[Dict]) -> List[Dict]:
        """Validate and fix block structure."""
        valid = []
        allowed_block_names = {
            "core/paragraph", "core/heading", "core/code",
            "core/list", "core/table", "core/quote", "core/separator",
            "core/image",
        }

        for block in blocks:
            if not isinstance(block, dict):
                continue

            name = block.get("blockName", "")
            if name not in allowed_block_names:
                # Try to salvage as paragraph
                if "innerContent" in block and block["innerContent"]:
                    block["blockName"] = "core/paragraph"
                    name = "core/paragraph"
                else:
                    continue

            # Ensure innerContent exists and is a list with at least one string
            if "innerContent" not in block or not block["innerContent"]:
                continue
            if not isinstance(block["innerContent"], list):
                block["innerContent"] = [str(block["innerContent"])]
            if not isinstance(block["innerContent"][0], str):
                block["innerContent"][0] = str(block["innerContent"][0])

            # Ensure attrs exists
            block.setdefault("attrs", {})

            # Fix heading level
            if name == "core/heading":
                level = block["attrs"].get("level", 2)
                if level not in (2, 3, 4):
                    block["attrs"]["level"] = 2
                content = block["innerContent"][0]
                # Ensure heading has proper HTML tags
                if not content.startswith("<h"):
                    block["innerContent"][0] = f"<h{level}>{content}</h{level}>"

            # Fix paragraph wrapping
            if name == "core/paragraph":
                content = block["innerContent"][0]
                if not content.startswith("<p>"):
                    block["innerContent"][0] = f"<p>{content}</p>"
                elif "</p>" not in content:
                    block["innerContent"][0] = content + "</p>"

            # Fix code block wrapping
            if name == "core/code":
                content = block["innerContent"][0]
                lang = block["attrs"].get("language", "")
                if "<pre>" not in content:
                    # No <pre> at all — full rewrap needed
                    if not lang:
                        lang_match = re.search(r'class="language-(\w+)"', content)
                        lang = lang_match.group(1) if lang_match else "python"
                    # Strip existing <code> tags to avoid double wrapping
                    content = re.sub(r'<code[^>]*>', '', content)
                    content = content.replace('</code>', '')
                    block["innerContent"][0] = f'<pre><code class="language-{lang}">{content}</code></pre>'
                elif "<code" not in content:
                    # Has <pre> but missing <code> wrapper — add it
                    if not lang:
                        lang = "sql"
                    # Extract content between <pre> and </pre>
                    inner = re.sub(r'</?pre[^>]*>', '', content)
                    block["innerContent"][0] = f'<pre><code class="language-{lang}">{inner}</code></pre>'
                elif '<code>' in content and 'class="language-' not in content and lang:
                    # Has <pre><code> but missing language class — inject it
                    block["innerContent"][0] = content.replace('<code>', f'<code class="language-{lang}">', 1)

            # Fix unclosed inline HTML tags (<strong>, <em>, <a>)
            # Process innermost tags first to maintain proper nesting order
            content = block["innerContent"][0]
            for tag in ("a", "em", "strong"):
                open_count = len(re.findall(rf"<{tag}[\s>]", content))
                close_count = content.count(f"</{tag}>")
                if open_count > close_count:
                    # Append missing closing tags
                    for _ in range(open_count - close_count):
                        # Insert before the outermost closing tag (</p>, </li>, </h2>, etc.)
                        outer_close = re.search(r"(</(?:p|li|h[2-4]|ul|ol|td|th)>\s*)$", content)
                        if outer_close:
                            pos = outer_close.start()
                            content = content[:pos] + f"</{tag}>" + content[pos:]
                        else:
                            content += f"</{tag}>"
                    block["innerContent"][0] = content

            # Fix list block structure
            if name == "core/list":
                content = block["innerContent"][0]
                # Ensure content is wrapped in <ul> or <ol>
                if not re.search(r'^\s*<[uo]l', content):
                    content = f"<ul>{content}</ul>"
                # Close any unclosed <li> tags
                li_open = content.count("<li>") + len(re.findall(r'<li\s[^>]*>', content))
                li_close = content.count("</li>")
                if li_open > li_close:
                    # Insert missing </li> before </ul> or </ol>
                    for _ in range(li_open - li_close):
                        list_end = re.search(r'(</[uo]l>\s*)$', content)
                        if list_end:
                            pos = list_end.start()
                            content = content[:pos] + "</li>" + content[pos:]
                        else:
                            content += "</li>"
                block["innerContent"][0] = content

            # Fix table block structure
            if name == "core/table":
                content = block["innerContent"][0]
                if "<table" not in content:
                    content = f"<table>{content}</table>"
                # Ensure </table> closing tag exists
                if "<table" in content and "</table>" not in content:
                    content += "</table>"
                block["innerContent"][0] = content

            # Fix quote block structure
            if name == "core/quote":
                content = block["innerContent"][0]
                if "<blockquote" not in content:
                    content = f"<blockquote>{content}</blockquote>"
                if "<blockquote" in content and "</blockquote>" not in content:
                    content += "</blockquote>"
                block["innerContent"][0] = content

            # Normalize separator to WordPress format
            if name == "core/separator":
                content = block["innerContent"][0]
                if "wp-block-separator" not in content:
                    block["innerContent"][0] = '<hr class="wp-block-separator has-alpha-channel-opacity"/>'

            valid.append(block)

        return valid

    def _extract_json(self, text: str) -> str:
        """Extract JSON from LLM response (handles markdown fences).
        
        Uses bracket matching to find the outermost JSON array or object,
        which is more reliable than splitting on ``` when LLM output
        contains code blocks.
        """
        text = text.strip()
        
        # Strip markdown fences first
        if "```json" in text:
            text = text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
        elif text.startswith("```"):
            text = text.split("```", 1)[1].rsplit("```", 1)[0].strip()
            # Remove language hint if present (e.g., "json\n")
            if text and not text[0] in "{[":
                newline = text.find("\n")
                if newline != -1:
                    text = text[newline + 1:]
        
        # Find the outermost JSON structure via bracket matching
        # Pick whichever bracket appears first in the text
        bracket_pairs = [("[", "]"), ("{", "}")]
        pos_bracket = text.find("[")
        pos_brace = text.find("{")
        if pos_brace != -1 and (pos_bracket == -1 or pos_brace < pos_bracket):
            bracket_pairs = [("{", "}"), ("[", "]")]
        for start_char, end_char in bracket_pairs:
            start = text.find(start_char)
            if start == -1:
                continue
            depth = 0
            in_string = False
            escape = False
            for i in range(start, len(text)):
                c = text[i]
                if escape:
                    escape = False
                    continue
                if c == "\\":
                    escape = True
                    continue
                if c == '"':
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if c == start_char:
                    depth += 1
                elif c == end_char:
                    depth -= 1
                    if depth == 0:
                        return text[start:i + 1]
        
        # Bracket matcher failed (unbalanced quotes/brackets in LLM output).
        # Try json.loads on progressively trimmed text as fallback.
        for end_offset in range(len(text), 0, -1):
            candidate = text[:end_offset].strip()
            if candidate and candidate[-1] in ']})':
                try:
                    json.loads(candidate)
                    return candidate
                except (json.JSONDecodeError, ValueError):
                    continue
        
        return text
