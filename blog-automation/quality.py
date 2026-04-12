#!/usr/bin/env python3
"""
Quality Gate for Blog Generator V2.
Runs after generation and before publishing.
If the article fails, it can be flagged for regeneration.
"""

import re
from typing import Dict, List, Tuple

from seo import SEOAnalyzer


class QualityGate:
    """Pre-publish quality checks for generated blog posts."""

    def __init__(self):
        self.seo_analyzer = SEOAnalyzer()

    def check(self, blog_data: Dict) -> Tuple[bool, List[str], Dict]:
        """Run all quality checks.

        Args:
            blog_data: The full blog post dict from BlogGeneratorV2.

        Returns:
            (passed: bool, issues: list[str], report: dict)
        """
        issues = []
        blocks = blog_data.get("content_blocks", [])
        seo = blog_data.get("seo", {})
        metadata = blog_data.get("metadata", {})
        keyphrase = seo.get("focus_keyphrase", "")

        # Run SEO analysis
        seo_report = self.seo_analyzer.analyze(blocks, keyphrase)

        # ---- Content length checks ---- #
        word_count = metadata.get("word_count", 0)
        if word_count < 1500:
            issues.append(f"CRITICAL: Only {word_count} words (minimum 1500)")
        elif word_count < 1800:
            issues.append(f"WARNING: Only {word_count} words (recommended 1800+)")
        if word_count > 5000:
            issues.append(f"WARNING: {word_count} words is very long (recommended <4500)")

        # ---- E-E-A-T checks ---- #
        full_text = self._blocks_to_text(blocks)

        # First-person voice in opening
        opening_text = ""
        para_count = 0
        for block in blocks:
            if block.get("blockName") == "core/paragraph":
                opening_text += " " + block.get("innerContent", [""])[0]
                para_count += 1
                if para_count >= 3:
                    break
        opening_text = re.sub(r"<[^>]+>", "", opening_text)

        if not re.search(r"\b(I|my|we|our)\b", opening_text, re.IGNORECASE):
            issues.append("No first-person voice in first 3 paragraphs")

        # ---- Internal links ---- #
        full_html = self._blocks_to_html(blocks)
        link_count = full_html.count("/articles/")
        if link_count < 2:
            issues.append(f"Only {link_count} internal links (need 2+)")

        # ---- FAQ section ---- #
        has_faq = any(
            "faq" in block.get("innerContent", [""])[0].lower()
            or "frequently" in block.get("innerContent", [""])[0].lower()
            for block in blocks
            if block.get("blockName") == "core/heading"
        )
        if not has_faq:
            issues.append("Missing FAQ section")

        # ---- Code blocks ---- #
        code_blocks = [b for b in blocks if b.get("blockName") == "core/code"]
        if len(code_blocks) < 1:
            issues.append("No code blocks found")
        # Check for placeholder code
        for cb in code_blocks:
            content = cb.get("innerContent", [""])[0]
            if "def process_data(data):" in content and "return transform(data)" in content:
                issues.append("Contains placeholder code (process_data/transform)")
                break

        # ---- AI-detectable patterns ---- #
        ai_patterns = [
            (r"When it comes to .{5,40},", "Contains 'When it comes to...' pattern"),
            (r"In today's data-driven world", "Contains 'In today's data-driven world'"),
            (r"It is crucial to", "Contains 'It is crucial to'"),
            (r"In the ever-evolving landscape", "Contains 'In the ever-evolving landscape'"),
            (r"Let's dive in", "Contains 'Let's dive in'"),
            (r"comprehensive guide", "Contains 'comprehensive guide'"),
        ]
        for pattern, msg in ai_patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                issues.append(msg)

        # ---- SEO title check ---- #
        title = seo.get("title", "")
        if re.search(r"Guide 20\d{2}$", title):
            issues.append(f"Formulaic title ending: '{title}'")
        if len(title) > 60:
            issues.append(f"Title too long: {len(title)} chars (max 60)")
        if len(title) < 20:
            issues.append(f"Title too short: {len(title)} chars")

        # ---- Meta description check ---- #
        meta_desc = seo.get("meta_description", "")
        if len(meta_desc) > 165:
            issues.append(f"Meta description too long: {len(meta_desc)} chars (max 160)")
        if len(meta_desc) < 100:
            issues.append(f"Meta description too short: {len(meta_desc)} chars")

        # ---- Block structure ---- #
        block_count = len(blocks)
        if block_count < 15:
            issues.append(f"Only {block_count} blocks (minimum 15)")

        # ---- Keyphrase from SEO report ---- #
        kp_report = seo_report.get("keyphrase", {})
        if kp_report.get("count", 0) < 4:
            issues.append(f"Keyphrase appears only {kp_report.get('count', 0)} times (need 4+)")
        if not kp_report.get("in_intro", False):
            issues.append("Keyphrase not in introduction")

        # ---- Duplicate code block detection ---- #
        code_contents = []
        for cb in code_blocks:
            raw = cb.get("innerContent", [""])[0]
            clean = re.sub(r"<[^>]+>", "", raw).strip()
            if clean:
                code_contents.append(clean)
        seen_code = set()
        duplicate_code_count = 0
        for snippet in code_contents:
            # Normalize whitespace for comparison
            normalized = re.sub(r"\s+", " ", snippet[:200])
            if normalized in seen_code:
                duplicate_code_count += 1
            else:
                seen_code.add(normalized)
        if duplicate_code_count > 0:
            issues.append(f"CRITICAL: {duplicate_code_count} duplicate code block(s) found")

        # ---- Repeated paragraph detection ---- #
        paragraph_texts = []
        for block in blocks:
            if block.get("blockName") == "core/paragraph":
                raw = block.get("innerContent", [""])[0]
                text = re.sub(r"<[^>]+>", "", raw).strip()
                if len(text) > 50:  # Only check substantial paragraphs
                    paragraph_texts.append(text)
        seen_paragraphs = set()
        duplicate_para_count = 0
        for para in paragraph_texts:
            # Normalize: lowercase, collapse whitespace, first 150 chars
            normalized = re.sub(r"\s+", " ", para.lower())[:150]
            if normalized in seen_paragraphs:
                duplicate_para_count += 1
            else:
                seen_paragraphs.add(normalized)
        if duplicate_para_count > 0:
            issues.append(f"WARNING: {duplicate_para_count} near-duplicate paragraph(s) found")

        # ---- Unsourced metrics detection ---- #
        # Find numbers (percentages, multipliers) without nearby citation links
        metrics_without_source = 0
        for block in blocks:
            if block.get("blockName") != "core/paragraph":
                continue
            content = block.get("innerContent", [""])[0]
            # Find specific metrics: percentages (with optional space), Nx multipliers, dollar amounts, "N percent"
            metrics = re.findall(r'\b\d+\s*[%x]\b|\$\d+|\b\d+\s+percent\b', content, re.IGNORECASE)
            if metrics:
                # Check if there's at least one external link in this paragraph
                has_citation = bool(re.search(r'href="https?://', content))
                if not has_citation:
                    metrics_without_source += len(metrics)
        if metrics_without_source > 3:
            issues.append(f"WARNING: {metrics_without_source} metrics without inline source citations")

        # ---- Repeated source URL detection ---- #
        all_urls = re.findall(r'href="(https?://[^"]+)"', full_html)
        external_urls = [u for u in all_urls if "/articles/" not in u]
        url_counts = {}
        for url in external_urls:
            url_counts[url] = url_counts.get(url, 0) + 1
        overused_urls = {u: c for u, c in url_counts.items() if c > 3}
        if overused_urls:
            issues.append(f"WARNING: {len(overused_urls)} source URL(s) cited more than 3 times")

        # ---- Thin content detection ---- #

        # 1. Per-section word count — find H2 sections with < 150 words
        sections = self._split_into_sections(blocks)
        thin_sections = []
        for sec_heading, sec_blocks in sections:
            sec_word_count = 0
            for b in sec_blocks:
                bname = b.get("blockName", "")
                if bname in ("core/paragraph", "core/list", "core/code", "core/quote"):
                    raw = b.get("innerContent", [""])[0]
                    clean = re.sub(r"<[^>]+>", " ", raw)
                    sec_word_count += len(clean.split())
            if sec_word_count < 150:
                thin_sections.append(f"{sec_heading} ({sec_word_count}w)")
        if thin_sections:
            issues.append(f"WARNING: {len(thin_sections)} thin section(s) under 150 words: {', '.join(thin_sections[:3])}")

        # 2. Thin filler pattern detection
        thin_filler_patterns = [
            r"depends on your (?:specific )?(?:requirements|use case|needs)",
            r"refer to the (?:official )?documentation",
            r"getting this right (?:early )?(?:is important|saves)",
            r"this is beyond the scope",
            r"there are many ways to",
            r"as with any technology",
            r"# TODO: Replace",
        ]
        filler_count = 0
        for pattern in thin_filler_patterns:
            filler_count += len(re.findall(pattern, full_text, re.IGNORECASE))
        if filler_count > 0:
            issues.append(f"WARNING: {filler_count} thin filler phrase(s) detected in content")

        # 3. Fallback block detection
        fallback_count = sum(1 for b in blocks if b.get("fallback_used"))
        if fallback_count > 0:
            issues.append(f"WARNING: {fallback_count} fallback-generated block(s) — LLM generation failed for some sections")

        # 4. Section-level citation check — sections with zero external links
        uncited_sections = []
        for sec_heading, sec_blocks in sections:
            sec_html = " ".join(b.get("innerContent", [""])[0] for b in sec_blocks)
            has_external_link = bool(re.search(r'href="https?://', sec_html))
            if not has_external_link and sec_heading.lower() not in ("faq", "frequently asked questions", "conclusion", "next steps"):
                uncited_sections.append(sec_heading)
        if len(uncited_sections) > 2:
            issues.append(f"WARNING: {len(uncited_sections)} section(s) have no external citations: {', '.join(uncited_sections[:3])}")

        # ---- Slug keyphrase check ---- #
        slug = blog_data.get("slug", "")
        if slug and keyphrase:
            kp_slug = keyphrase.lower().replace(" ", "-")
            if kp_slug not in slug:
                issues.append(f"Slug '{slug}' does not contain keyphrase '{keyphrase}'")
        elif not slug:
            issues.append("No slug defined for the post")

        # ---- Meta description quality check ---- #
        if meta_desc:
            md_lower = meta_desc.lower()
            kp_lower = keyphrase.lower()
            if kp_lower and kp_lower not in md_lower:
                issues.append(f"Meta description does not contain keyphrase '{keyphrase}'")
            formulaic_starts = [
                f"master {kp_lower}",
                f"learn everything about {kp_lower}",
                f"a comprehensive guide to {kp_lower}",
                f"discover the best {kp_lower}",
            ]
            for pattern in formulaic_starts:
                if md_lower.startswith(pattern):
                    issues.append(f"Meta description starts with formulaic pattern: '{pattern}'")
                    break
        else:
            issues.append("CRITICAL: No meta description defined")

        # ---- Determine pass/fail ---- #
        critical_count = sum(1 for i in issues if i.startswith("CRITICAL"))
        warning_count = sum(1 for i in issues if i.startswith("WARNING"))
        other_count = len(issues) - critical_count - warning_count

        # Fail on any critical issue, 4+ non-warning issues, or 6+ warnings
        passed = critical_count == 0 and other_count < 4 and warning_count < 6

        return passed, issues, seo_report

    def print_report(self, blog_data: Dict) -> bool:
        """Run checks and print a formatted report. Returns True if passed."""

        passed, issues, seo_report = self.check(blog_data)

        print(f"\n{'='*60}")
        print(f"  QUALITY GATE {'PASSED' if passed else 'FAILED'}")
        print(f"{'='*60}")

        # SEO scores
        print(f"\n  SEO Scores:")
        print(f"    Overall:       {seo_report.get('overall_score', 0)}/100")
        print(f"    Keyphrase:     {seo_report.get('keyphrase', {}).get('score', 0)}/100")
        print(f"    Readability:   {seo_report.get('readability', {}).get('score', 0)}/100")
        print(f"    Structure:     {seo_report.get('structure', {}).get('score', 0)}/100")
        print(f"    E-E-A-T:       {seo_report.get('eeat', {}).get('score', 0)}/100")
        print(f"    Content Depth: {seo_report.get('content_depth', {}).get('score', 0)}/100")

        # Readability details
        readability = seo_report.get("readability", {})
        print(f"\n  Readability:")
        print(f"    Flesch score:        {readability.get('flesch_score', 0)}")
        print(f"    Avg sentence length: {readability.get('avg_sentence_length', 0)} words")
        print(f"    Passive voice:       {readability.get('passive_voice_ratio', 0)}%")
        print(f"    Transition words:    {readability.get('transition_ratio', 0)}%")

        if issues:
            print(f"\n  Issues ({len(issues)}):")
            for issue in issues:
                prefix = "  !!" if issue.startswith("CRITICAL") else "  --"
                print(f"    {prefix} {issue}")
        else:
            print(f"\n  No issues found.")

        print(f"{'='*60}\n")
        return passed

    def _blocks_to_text(self, blocks: List[Dict]) -> str:
        """Extract plain text from blocks."""
        parts = []
        for block in blocks:
            content = block.get("innerContent", [""])[0]
            text = re.sub(r"<[^>]+>", "", content).strip()
            if text:
                parts.append(text)
        return " ".join(parts)

    def _blocks_to_html(self, blocks: List[Dict]) -> str:
        """Concatenate raw HTML from all blocks."""
        parts = []
        for block in blocks:
            content = block.get("innerContent", [""])[0]
            parts.append(content)
        return " ".join(parts)

    def _split_into_sections(self, blocks: List[Dict]) -> List[tuple]:
        """Split blocks into (heading_text, [blocks]) tuples by H2 headings."""
        sections = []
        current_heading = "Introduction"
        current_blocks = []

        for block in blocks:
            bname = block.get("blockName", "")
            if bname == "core/heading":
                level = block.get("attrs", {}).get("level", 2)
                if level == 2:
                    # Save previous section if it has content
                    if current_blocks:
                        sections.append((current_heading, current_blocks))
                    # Start new section
                    raw = block.get("innerContent", [""])[0]
                    current_heading = re.sub(r"<[^>]+>", "", raw).strip()
                    current_blocks = []
                    continue
            current_blocks.append(block)

        # Don't forget the last section
        if current_blocks:
            sections.append((current_heading, current_blocks))

        return sections
