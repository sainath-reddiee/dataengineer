#!/usr/bin/env python3
"""
SEO & Readability Analysis for Blog Generator V2.
Fixes the broken passive voice detection and incomplete Flesch formula from V1.
"""

import re
from typing import Dict, List, Tuple


class SEOAnalyzer:
    """Analyze content for SEO compliance and readability metrics."""

    # Common past participles for passive voice detection
    PAST_PARTICIPLES = {
        "done", "made", "given", "known", "taken", "seen", "found", "told",
        "used", "called", "asked", "needed", "become", "left", "held", "brought",
        "written", "provided", "shown", "built", "set", "run", "moved",
        "created", "generated", "configured", "deployed", "optimized", "processed",
        "executed", "loaded", "stored", "managed", "monitored", "scheduled",
        "transformed", "validated", "ingested", "partitioned", "cached",
    }

    # Auxiliaries that signal passive voice
    PASSIVE_AUXILIARIES = {"is", "are", "was", "were", "been", "being", "be", "get", "gets", "got", "gotten"}

    def analyze(self, blocks: List[Dict], keyphrase: str) -> Dict:
        """Run full SEO analysis on Gutenberg blocks.

        Returns a report dict with scores and issues.
        """
        full_text = self._blocks_to_text(blocks)
        full_html = self._blocks_to_html(blocks)
        sentences = self._split_sentences(full_text)
        words = full_text.split()
        word_count = len(words)

        report = {
            "word_count": word_count,
            "reading_time": max(1, round(word_count / 225)),
            "keyphrase": self._analyze_keyphrase(blocks, full_text, full_html, keyphrase),
            "readability": self._analyze_readability(sentences, words, full_text),
            "structure": self._analyze_structure(blocks, keyphrase),
            "eeat": self._analyze_eeat(full_text, full_html, blocks),
            "content_depth": self._analyze_content_depth(blocks, full_text),
        }

        # Overall score (0-100)
        scores = []
        scores.append(report["keyphrase"]["score"])
        scores.append(report["readability"]["score"])
        scores.append(report["structure"]["score"])
        scores.append(report["eeat"]["score"])
        scores.append(report["content_depth"]["score"])
        report["overall_score"] = round(sum(scores) / len(scores))

        return report

    # ------------------------------------------------------------------ #
    #  Keyphrase Analysis                                                 #
    # ------------------------------------------------------------------ #

    def _analyze_keyphrase(
        self, blocks: List[Dict], text: str, html: str, keyphrase: str
    ) -> Dict:
        """Analyze keyphrase usage."""
        kp_lower = keyphrase.lower()
        text_lower = text.lower()

        # Count occurrences
        count = text_lower.count(kp_lower)
        word_count = len(text.split())
        density = (count * len(keyphrase.split()) / word_count * 100) if word_count > 0 else 0

        # Check intro (first 300 chars)
        in_intro = kp_lower in text_lower[:300]

        # Check headings
        heading_blocks = [b for b in blocks if b.get("blockName") == "core/heading"]
        headings_with_kp = sum(
            1 for b in heading_blocks
            if kp_lower in b.get("innerContent", [""])[0].lower()
        )
        heading_ratio = (headings_with_kp / len(heading_blocks) * 100) if heading_blocks else 0

        # Check meta (from title in first heading if present)
        in_slug = kp_lower.replace(" ", "-") in html.lower()

        issues = []
        if not in_intro:
            issues.append("Keyphrase not found in introduction (first 300 chars)")
        if count < 5:
            issues.append(f"Keyphrase appears only {count} times (target: 5+)")
        if density > 2.5:
            issues.append(f"Keyphrase density {density:.1f}% is too high (max 2.5%)")
        if heading_ratio < 30:
            issues.append(f"Only {headings_with_kp}/{len(heading_blocks)} headings contain keyphrase")

        score = 100
        if not in_intro:
            score -= 20
        if count < 5:
            score -= min(30, (5 - count) * 10)
        if density > 2.5:
            score -= 15
        if heading_ratio < 30:
            score -= 10

        return {
            "count": count,
            "density": round(density, 2),
            "in_intro": in_intro,
            "headings_with_kp": headings_with_kp,
            "heading_ratio": round(heading_ratio, 1),
            "score": max(0, score),
            "issues": issues,
        }

    # ------------------------------------------------------------------ #
    #  Readability Analysis                                               #
    # ------------------------------------------------------------------ #

    def _analyze_readability(
        self, sentences: List[str], words: List[str], text: str
    ) -> Dict:
        """Analyze readability with corrected Flesch formula."""
        word_count = len(words)
        sentence_count = len(sentences) if sentences else 1
        syllable_count = sum(self._count_syllables(w) for w in words)

        # Flesch Reading Ease (FIXED — V1 was missing syllable component)
        if word_count > 0 and sentence_count > 0:
            asl = word_count / sentence_count  # average sentence length
            asw = syllable_count / word_count  # average syllables per word
            flesch = 206.835 - (1.015 * asl) - (84.6 * asw)
            flesch = max(0, min(100, round(flesch, 1)))
        else:
            flesch = 0
            asl = 0

        # Passive voice detection (FIXED — V1 just checked for "is/are/was")
        passive_count, passive_sentences = self._detect_passive_voice(sentences)
        passive_ratio = (passive_count / sentence_count * 100) if sentence_count > 0 else 0

        # Transition word detection
        transition_count = self._count_transitions(sentences)
        transition_ratio = (transition_count / sentence_count * 100) if sentence_count > 0 else 0

        # Sentence length distribution
        long_sentences = sum(1 for s in sentences if len(s.split()) > 25)
        long_ratio = (long_sentences / sentence_count * 100) if sentence_count > 0 else 0

        issues = []
        if flesch < 40:
            issues.append(f"Flesch score {flesch} is too low (aim for 50+)")
        if passive_ratio > 15:
            issues.append(f"Passive voice in {passive_ratio:.0f}% of sentences (aim for <15%)")
        if transition_ratio < 20:
            issues.append(f"Only {transition_ratio:.0f}% sentences start with transitions (aim for 25%+)")
        if long_ratio > 30:
            issues.append(f"{long_ratio:.0f}% of sentences are over 25 words")

        score = 100
        if flesch < 40:
            score -= 25
        elif flesch < 50:
            score -= 10
        if passive_ratio > 15:
            score -= 15
        if transition_ratio < 20:
            score -= 10
        if long_ratio > 30:
            score -= 10

        return {
            "flesch_score": flesch,
            "avg_sentence_length": round(asl, 1),
            "passive_voice_ratio": round(passive_ratio, 1),
            "passive_sentences": passive_sentences[:3],  # sample
            "transition_ratio": round(transition_ratio, 1),
            "long_sentence_ratio": round(long_ratio, 1),
            "syllable_count": syllable_count,
            "score": max(0, score),
            "issues": issues,
        }

    def _count_syllables(self, word: str) -> int:
        """Approximate syllable count for English words."""
        word = word.lower().strip(".,!?;:\"'()[]")
        if not word:
            return 0
        if len(word) <= 3:
            return 1

        # Remove trailing silent e, except for words ending in 'le', 'ce', 'ge', 'se', 've'
        # where the e often forms its own syllable (e.g., "table", "advance", "merge")
        if word.endswith("e") and len(word) > 4:
            if not word.endswith(("le", "ce", "ge", "se", "ve")):
                word = word[:-1]

        # Count vowel groups
        vowels = "aeiouy"
        count = 0
        prev_vowel = False
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel

        return max(1, count)

    def _detect_passive_voice(self, sentences: List[str]) -> Tuple[int, List[str]]:
        """Detect passive voice using auxiliary + past participle pattern.

        FIXED: V1 just checked for presence of 'is', 'are', 'was' anywhere.
        This version uses proper linguistic patterns.
        """
        passive_count = 0
        passive_examples = []

        # Pattern: auxiliary verb followed by optional adverb + past participle
        # "is configured", "was being processed", "are often used"
        aux_pattern = "|".join(re.escape(a) for a in self.PASSIVE_AUXILIARIES)
        participle_pattern = "|".join(re.escape(p) for p in self.PAST_PARTICIPLES)
        passive_regex = re.compile(
            rf"\b({aux_pattern})\s+(\w+ly\s+)?(\w+ed|{participle_pattern})\b",
            re.IGNORECASE,
        )

        for sentence in sentences:
            if passive_regex.search(sentence):
                passive_count += 1
                if len(passive_examples) < 5:
                    passive_examples.append(sentence[:80])

        return passive_count, passive_examples

    def _count_transitions(self, sentences: List[str]) -> int:
        """Count sentences starting with transition words/phrases."""
        transitions = {
            "additionally", "furthermore", "moreover", "besides", "also",
            "however", "nevertheless", "conversely", "although", "though",
            "therefore", "consequently", "thus", "hence", "accordingly",
            "for instance", "for example", "specifically", "in particular",
            "first", "second", "third", "next", "then", "finally",
            "indeed", "in fact", "certainly", "obviously", "clearly",
            "meanwhile", "similarly", "likewise", "in contrast",
            "as a result", "on the other hand", "in addition",
        }

        count = 0
        for sentence in sentences:
            sentence_lower = sentence.lower().strip()
            for t in transitions:
                if sentence_lower.startswith(t):
                    count += 1
                    break

        return count

    # ------------------------------------------------------------------ #
    #  Structure Analysis                                                 #
    # ------------------------------------------------------------------ #

    def _analyze_structure(self, blocks: List[Dict], keyphrase: str) -> Dict:
        """Analyze content structure."""
        h2_count = 0
        h3_count = 0
        code_count = 0
        list_count = 0
        table_count = 0
        paragraph_count = 0
        has_faq = False

        for block in blocks:
            name = block.get("blockName", "")
            if name == "core/heading":
                level = block.get("attrs", {}).get("level", 2)
                if level == 2:
                    h2_count += 1
                elif level == 3:
                    h3_count += 1
                content = block.get("innerContent", [""])[0].lower()
                if "faq" in content or "frequently" in content:
                    has_faq = True
            elif name == "core/code":
                code_count += 1
            elif name == "core/list":
                list_count += 1
            elif name == "core/table":
                table_count += 1
            elif name == "core/paragraph":
                paragraph_count += 1

        # Internal links
        internal_links = 0
        for block in blocks:
            content = block.get("innerContent", [""])[0]
            internal_links += content.count("/articles/")

        issues = []
        if h2_count < 4:
            issues.append(f"Only {h2_count} H2 headings (aim for 5+)")
        if code_count < 2:
            issues.append(f"Only {code_count} code blocks (aim for 2+)")
        if not has_faq:
            issues.append("Missing FAQ section")
        if internal_links < 2:
            issues.append(f"Only {internal_links} internal links (aim for 3+)")

        score = 100
        if h2_count < 4:
            score -= 10
        if code_count < 2:
            score -= 15
        if not has_faq:
            score -= 15
        if internal_links < 2:
            score -= 10

        return {
            "h2_count": h2_count,
            "h3_count": h3_count,
            "code_blocks": code_count,
            "list_blocks": list_count,
            "table_blocks": table_count,
            "paragraphs": paragraph_count,
            "has_faq": has_faq,
            "internal_links": internal_links,
            "total_blocks": len(blocks),
            "score": max(0, score),
            "issues": issues,
        }

    # ------------------------------------------------------------------ #
    #  E-E-A-T Analysis                                                   #
    # ------------------------------------------------------------------ #

    def _analyze_eeat(self, text: str, html: str, blocks: List[Dict]) -> Dict:
        """Analyze E-E-A-T (Experience, Expertise, Authority, Trust) signals."""

        # First person voice (Experience)
        first_person = len(re.findall(r"\b(I|my|we|our|I\'m|I\'ve|I\'ll)\b", text, re.IGNORECASE))

        # Specific metrics (Expertise) — percentages, multipliers, dollar amounts, explicit units
        metrics = len(re.findall(
            r"\b\d+(?:\.\d+)?\s*(?:%|percent|x\b|ms\b|GB\b|TB\b|MB\b|seconds?\b|minutes?\b|hours?\b)|\$\d+",
            text, re.IGNORECASE
        ))

        # Inline citations (Authority)
        external_links = len(re.findall(r'href="https?://', html))
        inline_citations = len(re.findall(r"according to|source:|based on", text, re.IGNORECASE))

        # Code blocks (Expertise)
        code_blocks = sum(1 for b in blocks if b.get("blockName") == "core/code")

        # Banned AI-detectable phrases
        banned_patterns = [
            r"in today's data-driven world",
            r"when it comes to",
            r"it is crucial to",
            r"it is important to note",
            r"in the ever-evolving landscape",
            r"comprehensive guide",
            r"let's dive in",
        ]
        ai_phrases_found = []
        for pattern in banned_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                ai_phrases_found.append(pattern)

        # Vague anecdote detection (low-value experience signals)
        vague_anecdote_patterns = [
            r"I recall a project where",
            r"In my experience,? (?:things|it|this|that)",
            r"I've seen (?:many|some|a lot of) teams",
            r"I remember when we",
        ]
        vague_anecdotes = 0
        for pattern in vague_anecdote_patterns:
            vague_anecdotes += len(re.findall(pattern, text, re.IGNORECASE))

        # Unsourced claims detection (Authority gap)
        # Phrases that assert facts about "most", "the industry", etc. without citation
        # Run on HTML so we can check for nearby <a> citation links
        unsourced_claim_patterns = [
            r"most (?:teams|companies|organizations|engineers|developers) (?:use|prefer|rely on|choose)",
            r"the industry standard is",
            r"according to (?:experts|industry|many)",
        ]
        # Separate pattern for "studies show" — only flag if no <a> link within 200 chars after
        studies_pattern = r"(?:studies|research|data) (?:show|suggest|indicate)s?"
        unsourced_claims = 0
        for pattern in unsourced_claim_patterns:
            unsourced_claims += len(re.findall(pattern, text, re.IGNORECASE))
        # For "studies show" etc., check on HTML for nearby citations
        for match in re.finditer(studies_pattern, html, re.IGNORECASE):
            nearby_html = html[match.start():match.start() + 200]
            if not re.search(r'<a\s+[^>]*href="https?://', nearby_html):
                unsourced_claims += 1

        # Source diversity — count unique external domains cited
        all_ext_urls = re.findall(r'href="https?://([^"/]+)', html)
        unique_domains = set(all_ext_urls)
        source_diversity = len(unique_domains)

        issues = []
        if first_person < 5:
            issues.append(f"Only {first_person} first-person references (aim for 10+)")
        if metrics < 3:
            issues.append(f"Only {metrics} concrete metrics/numbers (aim for 5+)")
        if ai_phrases_found:
            issues.append(f"Contains AI-detectable phrases: {', '.join(ai_phrases_found[:3])}")
        if code_blocks < 2:
            issues.append("Fewer than 2 code examples")
        if vague_anecdotes > 0:
            issues.append(f"{vague_anecdotes} vague anecdote(s) without concrete details")
        if unsourced_claims > 0:
            issues.append(f"{unsourced_claims} unsourced authoritative claim(s) (e.g., 'most teams use...')")
        if source_diversity < 3 and external_links > 0:
            issues.append(f"Only {source_diversity} unique source domain(s) cited (aim for 3+)")

        score = 100
        if first_person < 5:
            score -= 20
        if metrics < 3:
            score -= 10
        if ai_phrases_found:
            score -= len(ai_phrases_found) * 10
        if code_blocks < 2:
            score -= 10
        if vague_anecdotes > 0:
            score -= min(vague_anecdotes * 5, 15)
        if unsourced_claims > 0:
            score -= min(unsourced_claims * 5, 15)
        if source_diversity < 3 and external_links > 0:
            score -= 10

        return {
            "first_person_count": first_person,
            "metrics_count": metrics,
            "external_links": external_links,
            "inline_citations": inline_citations,
            "code_blocks": code_blocks,
            "ai_phrases_found": ai_phrases_found,
            "vague_anecdotes": vague_anecdotes,
            "unsourced_claims": unsourced_claims,
            "source_diversity": source_diversity,
            "score": max(0, score),
            "issues": issues,
        }

    # ------------------------------------------------------------------ #
    #  Content Depth Analysis                                              #
    # ------------------------------------------------------------------ #

    def _analyze_content_depth(self, blocks: List[Dict], full_text: str) -> Dict:
        """Analyze content depth: per-section word distribution, actionable signals, filler ratio."""
        issues = []
        score = 100

        # 1. Split into sections by H2 headings
        sections = []
        current_heading = "Introduction"
        current_blocks = []
        for block in blocks:
            bname = block.get("blockName", "")
            if bname == "core/heading" and block.get("attrs", {}).get("level", 2) == 2:
                if current_blocks:
                    sections.append((current_heading, current_blocks))
                raw = block.get("innerContent", [""])[0]
                current_heading = re.sub(r"<[^>]+>", "", raw).strip()
                current_blocks = []
                continue
            current_blocks.append(block)
        if current_blocks:
            sections.append((current_heading, current_blocks))

        # 2. Per-section word counts
        section_word_counts = []
        thin_count = 0
        for sec_heading, sec_blocks in sections:
            wc = 0
            for b in sec_blocks:
                if b.get("blockName", "") in ("core/paragraph", "core/list", "core/code", "core/quote"):
                    raw = b.get("innerContent", [""])[0]
                    clean = re.sub(r"<[^>]+>", " ", raw)
                    wc += len(clean.split())
            section_word_counts.append(wc)
            if wc < 150:
                thin_count += 1

        # Penalize thin sections
        if thin_count > 0:
            penalty = min(30, thin_count * 10)
            score -= penalty
            issues.append(f"{thin_count} section(s) under 150 words")

        # 3. Word distribution evenness — check if any section is < 40% of average
        if section_word_counts:
            avg_wc = sum(section_word_counts) / len(section_word_counts)
            if avg_wc > 0:
                uneven = sum(1 for wc in section_word_counts if wc < avg_wc * 0.4)
                if uneven > 1:
                    score -= 10
                    issues.append(f"{uneven} section(s) significantly shorter than average ({round(avg_wc)}w avg)")

        # 4. Actionable content signals — code blocks, external links, specific numbers
        code_blocks = sum(1 for b in blocks if b.get("blockName") == "core/code")
        external_links = len(re.findall(r'href="https?://', self._blocks_to_html(blocks)))
        specific_numbers = len(re.findall(
            r"\b\d+(?:\.\d+)?\s*(?:%|percent|x\b|ms\b|GB\b|TB\b|MB\b|seconds?\b|minutes?\b|hours?\b)|\$\d+",
            full_text, re.IGNORECASE
        ))

        actionable_signals = code_blocks + external_links + specific_numbers
        if actionable_signals < 5:
            score -= 15
            issues.append(f"Low actionable content: {code_blocks} code blocks, {external_links} links, {specific_numbers} metrics")
        elif actionable_signals < 10:
            score -= 5
            issues.append(f"Moderate actionable content: {code_blocks} code, {external_links} links, {specific_numbers} metrics")

        # 5. Generic filler ratio
        filler_patterns = [
            r"depends on your (?:specific )?(?:requirements|use case|needs)",
            r"refer to the (?:official )?documentation",
            r"getting this right (?:early )?(?:is important|saves)",
            r"this is beyond the scope",
            r"there are many ways to",
            r"as with any technology",
            r"# TODO: Replace",
        ]
        filler_count = 0
        for pattern in filler_patterns:
            filler_count += len(re.findall(pattern, full_text, re.IGNORECASE))

        if filler_count > 3:
            score -= 20
            issues.append(f"{filler_count} generic filler phrases found")
        elif filler_count > 0:
            score -= filler_count * 5
            issues.append(f"{filler_count} generic filler phrase(s) found")

        # 6. Fallback block ratio
        fallback_blocks = sum(1 for b in blocks if b.get("fallback_used"))
        total_content_blocks = sum(1 for b in blocks if b.get("blockName", "") in (
            "core/paragraph", "core/list", "core/code", "core/quote"
        ))
        if fallback_blocks > 0 and total_content_blocks > 0:
            fallback_ratio = fallback_blocks / total_content_blocks
            if fallback_ratio > 0.3:
                score -= 20
                issues.append(f"{fallback_blocks}/{total_content_blocks} blocks are fallback-generated ({round(fallback_ratio*100)}%)")
            elif fallback_ratio > 0.1:
                score -= 10
                issues.append(f"{fallback_blocks} fallback-generated block(s)")

        return {
            "section_count": len(sections),
            "section_word_counts": section_word_counts,
            "thin_sections": thin_count,
            "actionable_signals": actionable_signals,
            "filler_count": filler_count,
            "fallback_blocks": fallback_blocks,
            "score": max(0, score),
            "issues": issues,
        }

    # ------------------------------------------------------------------ #
    #  Helpers                                                            #
    # ------------------------------------------------------------------ #

    def _blocks_to_text(self, blocks: List[Dict]) -> str:
        """Extract plain text from all blocks."""
        parts = []
        for block in blocks:
            content = block.get("innerContent", [""])[0]
            text = re.sub(r"<[^>]+>", "", content).strip()
            if text:
                parts.append(text)
        return " ".join(parts)

    def _blocks_to_html(self, blocks: List[Dict]) -> str:
        """Concatenate HTML from all blocks."""
        parts = []
        for block in blocks:
            content = block.get("innerContent", [""])[0]
            parts.append(content)
        return " ".join(parts)

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 5]
