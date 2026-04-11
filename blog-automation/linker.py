#!/usr/bin/env python3
"""
Internal Linking Engine for Blog Generator V2.
Reads the existing articles index and injects contextual links
into generated content blocks.
"""

import json
import re
from typing import Dict, List, Tuple
from pathlib import Path


class InternalLinker:
    """Injects internal links to existing blog articles into generated content."""

    def __init__(self, articles_path: str = None):
        """Load the articles index.

        Args:
            articles_path: Path to articles.json. Defaults to
                           ../src/data/pseo/articles.json relative to this file.
        """
        if articles_path is None:
            articles_path = (
                Path(__file__).parent.parent / "src" / "data" / "pseo" / "articles.json"
            )
        else:
            articles_path = Path(articles_path)

        self.articles: List[Dict] = []
        if articles_path.exists():
            with open(articles_path, "r", encoding="utf-8") as f:
                self.articles = json.load(f)
            print(f"    InternalLinker loaded {len(self.articles)} articles")
        else:
            print(f"    Warning: articles.json not found at {articles_path}")

    def inject_links(self, blocks: List[Dict], topic: Dict) -> List[Dict]:
        """Find 3-5 opportunities to link to existing articles.

        Rules:
        - Never link to the same article twice
        - Never add more than one link per paragraph block
        - Only link in paragraph blocks (not headings, code, etc.)
        - Skip paragraphs that already contain internal links
        - Link text should be a natural phrase, not the full article title
        """

        if not self.articles:
            return blocks

        # Score articles by relevance to this topic
        relevant = self._find_relevant_articles(topic, limit=8)
        if not relevant:
            return blocks

        linked_slugs = set()
        links_added = 0
        max_links = 5

        for i, block in enumerate(blocks):
            if links_added >= max_links:
                break

            if block.get("blockName") != "core/paragraph":
                continue

            content = block.get("innerContent", [""])[0]

            # Skip if paragraph already has an internal link
            if "/articles/" in content:
                continue

            # Skip very short paragraphs
            text = re.sub(r"<[^>]+>", "", content)
            if len(text) < 60:
                continue

            # Try to link one relevant article in this paragraph
            for article, score, match_keyword in relevant:
                slug = article["slug"]
                if slug in linked_slugs:
                    continue

                # Find a natural anchor phrase in the paragraph text
                anchor, pos = self._find_anchor_phrase(content, article, match_keyword)
                if anchor:
                    link_html = f'<a href="/articles/{slug}">{anchor}</a>'
                    # Replace at the exact validated position
                    new_content = content[:pos] + link_html + content[pos + len(anchor):]
                    if new_content != content:
                        blocks[i]["innerContent"][0] = new_content
                        linked_slugs.add(slug)
                        links_added += 1
                        break  # one link per paragraph

        return blocks

    def _find_relevant_articles(
        self, topic: Dict, limit: int = 8
    ) -> List[Tuple[Dict, float, str]]:
        """Score and rank existing articles by relevance to the current topic.

        Returns list of (article, score, best_matching_keyword) tuples.
        """

        topic_title = topic.get("title", "").lower()
        topic_keywords = [k.lower() for k in topic.get("keywords", [])]
        topic_category = topic.get("category", "").lower()

        # Build a set of topic terms for matching
        topic_terms = set()
        for word in topic_title.split():
            if len(word) > 3:
                topic_terms.add(word.lower())
        topic_terms.update(topic_keywords)

        scored = []

        for article in self.articles:
            article_slug = article.get("slug", "")
            article_title = article.get("title", "").lower()
            article_keywords = [k.lower() for k in article.get("keywords", [])]
            article_categories = [c.lower() for c in article.get("categories", [])]

            # Don't link to an article about the same topic
            if self._is_same_topic(topic_title, article_title):
                continue

            score = 0.0
            best_keyword = ""

            # Keyword overlap
            for kw in article_keywords:
                if kw in topic_terms or kw in topic_title:
                    score += 2.0
                    if not best_keyword:
                        best_keyword = kw

            # Category match
            if topic_category in article_categories:
                score += 1.0

            # Title word overlap
            article_words = {w for w in article_title.split() if len(w) > 3}
            overlap = topic_terms & article_words
            score += len(overlap) * 0.5
            if overlap and not best_keyword:
                best_keyword = next(iter(overlap))

            if score > 0:
                scored.append((article, score, best_keyword))

        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:limit]

    def _is_same_topic(self, topic_a: str, topic_b: str) -> bool:
        """Check if two topics are essentially the same article."""
        # Simple heuristic: >60% word overlap in titles
        words_a = {w for w in topic_a.split() if len(w) > 3}
        words_b = {w for w in topic_b.split() if len(w) > 3}
        if not words_a or not words_b:
            return False
        overlap = len(words_a & words_b)
        smaller = min(len(words_a), len(words_b))
        return (overlap / smaller) > 0.6 if smaller > 0 else False

    def _find_anchor_phrase(
        self, paragraph_html: str, article: Dict, match_keyword: str
    ) -> Tuple[str, int]:
        """Find a natural anchor phrase in the paragraph for this article.

        Returns (phrase, position) tuple where position is the character offset
        in paragraph_html, or ("", -1) if no good match found.
        """

        # Strip HTML for text search
        text = re.sub(r"<[^>]+>", "", paragraph_html).lower()

        # Strategy 1: Look for the matching keyword in the paragraph
        if match_keyword and match_keyword.lower() in text:
            # Find the exact-case version in the original HTML
            pattern = re.compile(re.escape(match_keyword), re.IGNORECASE)
            for match in pattern.finditer(paragraph_html):
                pos = match.start()
                if not self._inside_html_tag(paragraph_html[:pos]):
                    return (match.group(0), pos)

        # Strategy 2: Look for article keywords in the paragraph
        for kw in article.get("keywords", []):
            if len(kw) < 3:
                continue
            if kw.lower() in text:
                pattern = re.compile(re.escape(kw), re.IGNORECASE)
                for match in pattern.finditer(paragraph_html):
                    pos = match.start()
                    if not self._inside_html_tag(paragraph_html[:pos]):
                        return (match.group(0), pos)

        # Strategy 3: Look for significant words from the article title
        title_words = [w for w in article.get("title", "").split() if len(w) > 4]
        for word in title_words[:3]:
            if word.lower() in text:
                pattern = re.compile(re.escape(word), re.IGNORECASE)
                for match in pattern.finditer(paragraph_html):
                    pos = match.start()
                    if not self._inside_html_tag(paragraph_html[:pos]):
                        return (match.group(0), pos)

        return ("", -1)

    def _inside_html_tag(self, text_before: str) -> bool:
        """Check if the current position is inside an HTML tag or inside
        an existing <a> element's content (including its attributes)."""
        # Count unclosed < vs >
        open_tags = text_before.count("<")
        close_tags = text_before.count(">")
        if open_tags > close_tags:
            return True

        # Check if we're between <a ...> and </a> (inside link text)
        last_a_open = text_before.rfind("<a ")
        if last_a_open == -1:
            last_a_open = text_before.rfind("<a>")
        last_a_close = text_before.rfind("</a>")

        if last_a_open > last_a_close:
            return True

        # Check if we're inside an href or other attribute value
        last_quote = max(text_before.rfind('"'), text_before.rfind("'"))
        if last_quote > -1:
            # Count quotes in the last tag — odd count means inside attr value
            last_open = text_before.rfind("<")
            if last_open > text_before.rfind(">"):
                attr_region = text_before[last_open:]
                if attr_region.count('"') % 2 == 1 or attr_region.count("'") % 2 == 1:
                    return True

        return False
