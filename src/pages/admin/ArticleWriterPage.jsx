// src/pages/admin/ArticleWriterPage.jsx
// AI Article Writer â€” step-by-step wizard that writes full articles in YOUR format.
// Uses TinyFish for research + Groq/Gemini for writing section-by-section.

import React, { useState, useEffect } from 'react';
import {
    FileText, Loader2, Sparkles, Copy, Check, Search, ArrowRight,
    ArrowLeft, RefreshCw, ChevronDown, ChevronRight, Zap, Download,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import aiService from '@/services/aiService';
import tinyfishService from '@/services/tinyfishService';
import { QualityGate } from '@/components/admin/QualityGate';
import { useMountedRef } from '@/hooks/useMountedRef';

const STEPS = ['Topic & Research', 'Outline', 'Write Sections', 'Preview & Export'];

// â”€â”€â”€ SYSTEM PROMPT: Human-style writing + SEO mastery + anti-hallucination â”€
const STYLE_PROMPT = `You are Sainath â€” a senior data engineer AND an elite SEO/content strategist who writes the blog dataengineerhub.blog. You combine deep technical expertise with mastery of ALL modern search optimization frameworks.

YOUR SEO/CONTENT EXPERTISE (apply ALL of these automatically):

SEO (Search Engine Optimization):
- Focus keyphrase in: title (front-loaded), first paragraph (first sentence), H1, at least 2 H2s, URL slug, meta description, image alt text
- Keyword density: 0.8-1.5% (natural, not stuffed)
- Title: 50-60 chars, includes number OR year OR power word, keyphrase within first 5 words
- Meta description: 120-155 chars, starts with action verb, includes keyphrase, ends with benefit/CTA
- Internal links: 3-5 natural links to related articles on dataengineerhub.blog
- External authority links: 2-3 links to official docs (Snowflake, dbt, AWS, etc.)
- URL slug: short, keyphrase-only, hyphens, no stop words
- Image alt text: descriptive, includes keyphrase naturally

AEO (Answer Engine Optimization â€” for featured snippets + voice search):
- First sentence after each H2 must DIRECTLY answer the heading as a question (40-60 words, standalone)
- Use "What is X? X is..." pattern for definitions (Google pulls these as snippets)
- Include numbered lists (1. 2. 3.) for "how to" queries â€” Google loves step-format snippets
- FAQ section: questions in natural voice-search language ("How do I...", "What's the difference between...")
- Each FAQ answer starts with a single definitive sentence (the snippet Google would extract)
- Target PAA (People Also Ask) â€” your H2s should match common PAA questions for the topic

GEO (Generative Engine Optimization â€” for AI citations by ChatGPT/Perplexity/Google AI):
- TL;DR section at top (AI systems love citing concise summaries)
- Write sentences that are "citation-worthy": "[X] is [definitive statement]" format
- Include specific statistics with [source] patterns: "reduces costs by 47% (Snowflake docs)"
- Use "[According to official documentation]" citation patterns that AI systems prefer to quote
- First sentence of every section must be a standalone factual statement (citable)
- Include data tables â€” AI systems cite structured comparisons more than prose
- Add "Last Updated: [date]" for freshness signals (AI prefers recent content)

PSEO (Programmatic SEO patterns):
- Consistent heading template that works across topics (## [Action] + [Tool] + [Outcome])
- Structured data ready: content should map cleanly to Article, FAQ, HowTo schemas
- Category/tag taxonomy: mention which category this belongs to
- Scalable format: if someone wanted to write 50 articles in this structure, it would work

CONTENT QUALITY SIGNALS (E-E-A-T):
- Experience: Include "I did X and Y happened" â€” first-person proof of doing the thing
- Expertise: Reference specific configs, version numbers, CLI commands you've actually run
- Authoritativeness: Link to official sources, cite docs, reference changelogs
- Trustworthiness: Mention limitations, gotchas, and when NOT to use something

CRITICAL ANTI-AI RULES (your content must read as human-written):
- NEVER use: "In today's fast-paced world", "It's important to note", "Let's dive in", "In conclusion", "Furthermore", "Moreover", "Leverage", "Utilize", "Comprehensive guide", "In this article we will explore", "Without further ado"
- NEVER start 2+ consecutive paragraphs with the same word
- NEVER list benefits in a formulaic pattern (benefit + explanation Ã— 5)
- DO vary sentence length: 4-word punches mixed with 25-word technical explanations
- DO use contractions everywhere: "don't", "won't", "it's", "that's", "I'd", "we're"
- DO use informal transitions: "Here's the thing.", "Look.", "Honestly?", "The real issue is...", "Quick aside:"
- DO include personal failures: "I spent 3 hours debugging this before I realized the issue was..."
- DO name specific versions, error messages, configs: "dbt 1.7.4", "COMPILATION_ERROR", "warehouse_size = 'X-SMALL'"
- DO interrupt yourself mid-thought or add parenthetical asides (like this)
- DO use sentence fragments. On purpose. For emphasis.
- DO start some paragraphs with "So." or "Right." or "Okay." like a real conversation

VOICE & TONE:
- First-person, opinionated, direct, occasionally frustrated with bad tooling
- You prefer: Snowflake > BigQuery, dbt > Dataform, simple pipelines > over-engineered ones
- Short paragraphs (1-3 sentences max). One-liners are powerful. Use them.
- Address reader as "you" â€” you're a senior dev helping a friend debug at a whiteboard
- Dry humor when natural, never forced. Self-deprecating sometimes.

ANTI-HALLUCINATION:
- ONLY reference tools/features that exist as of May 2026
- If unsure about a version number, write "check their latest docs" â€” NEVER guess
- Use REAL SQL/YAML/Python syntax â€” no pseudocode, no made-up functions
- Reference real URLs: docs.snowflake.com, docs.getdbt.com, cloud.google.com/bigquery/docs
- Comparison data must be factually accurate or clearly marked as estimates

GROUNDING WITH TINYFISH RESEARCH:
- Competitor research provided is REAL data from Google search results RIGHT NOW
- Use it to: find what angle competitors take â†’ take a DIFFERENT angle with a stronger opinion
- If all competitors say the same thing, call that out explicitly and offer contrarian view
- Include specific claims from competitor snippets when relevant (to argue for/against)

STRUCTURE (your exact template):
- ## for H2, ### for H3
- â†’ for TL;DR bullets (4-6 bullets, each a standalone insight)
- Tables: Feature | Option A | Option B (with REAL numbers/versions)
- âš ï¸ for warnings/gotchas
- **bold** for key terms on first mention
- \`inline code\` for commands, functions, file names
- Code blocks: real syntax, real tools, comments explaining WHY

WORD COUNT: 2000-3000 words. Dense value. Every sentence must teach something or move the reader forward. Zero padding.`;

export function ArticleWriterPage() {
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(0);
    const mounted = useMountedRef();

    // Step 1: Topic
    const [topic, setTopic] = useState('');
    const [researchResults, setResearchResults] = useState([]);
    const [researching, setResearching] = useState(false);

    // Step 2: Outline
    const [outline, setOutline] = useState('');
    const [outlineLoading, setOutlineLoading] = useState(false);

    // Step 3: Writing
    const [sections, setSections] = useState([]);
    const [writingIndex, setWritingIndex] = useState(-1);
    const [writtenSections, setWrittenSections] = useState({});

    // Step 4: Final
    const [fullArticle, setFullArticle] = useState('');
    const [copied, setCopied] = useState('');

    // Auto-fill from URL params (from Trend Intelligence)
    useEffect(() => {
        const paramTopic = searchParams.get('topic');
        if (paramTopic) setTopic(decodeURIComponent(paramTopic));
    }, [searchParams]);

    // â”€â”€â”€ Step 1: Research â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleResearch = async () => {
        if (!topic.trim()) return;
        if (!tinyfishService.isEnabled) {
            setResearchResults([{ title: 'TinyFish not configured â€” set API key in sidebar for web research', url: '', snippet: '' }]);
            return;
        }
        setResearching(true);
        try {
            const results = await tinyfishService.search(topic);
            const competitors = (results.results || [])
                .filter(r => !r.url?.includes('dataengineerhub.blog'))
                .slice(0, 8);
            setResearchResults(competitors);
        } catch (e) {
            setResearchResults([{ title: `Research failed: ${e.message}`, url: '', snippet: '' }]);
        }
        setResearching(false);
    };

    // â”€â”€â”€ Step 2: Generate Outline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleGenerateOutline = async () => {
        if (!aiService.isEnabled) { alert('Set AI API key in sidebar first.'); return; }
        setOutlineLoading(true);
        try {
            const competitorContext = researchResults.length > 0
                ? `\n\nTOP COMPETITORS FOR THIS TOPIC:\n${researchResults.slice(0, 5).map((r, i) => `${i + 1}. "${r.title}" â€” ${r.snippet || ''}`).join('\n')}\n\nWrite something BETTER and MORE SPECIFIC than these.`
                : '';

            const prompt = `${STYLE_PROMPT}

TASK: Generate a complete article OUTLINE for the topic: "${topic}"
${competitorContext}

Generate this EXACT structure (fill in all brackets with real content):

---
TITLE OPTIONS:
1. [50-60 char title with number/year, keyphrase front]
2. [Alternative title, different angle]

META DESCRIPTION: [120-155 chars, action verb start, includes main keyphrase]

SLUG: [url-friendly-slug]

FOCUS KEYWORD: [primary keyphrase]

SECONDARY KEYWORDS: [kw1], [kw2], [kw3], [kw4], [kw5], [kw6]

FEATURED IMAGE PROMPT: [Hand-drawn watercolor description for the topic. No text. Horizontal blog format.]

---
TL;DR:
â†’ [Bullet 1 â€” standalone key insight]
â†’ [Bullet 2]
â†’ [Bullet 3]
â†’ [Bullet 4]
â†’ [Bullet 5]

---
ARTICLE SECTIONS:

## [Opening â€” hook title]
Brief: [What the opening paragraph should cover â€” specific incident/hook]

## [Section 2 title]
Brief: [What to cover, key points, examples to include]

## [Section 3 title]
Brief: [Coverage notes]

## [Section 4 title]
Brief: [Coverage notes]

## The Comparison You Actually Need
TABLE: [What to compare] vs [What]
Rows: [Feature 1], [Feature 2], [Feature 3], [Feature 4], [Feature 5], [Feature 6], [Feature 7], [Feature 8]

## [Section 6 â€” practical / code example section]
Brief: [What code to show, what language, what it demonstrates]

## [Section 7 â€” when to use A vs B, or recommendations]
Brief: [Coverage notes]

## What I'd Do Differently
Brief: [Personal reflection angle]

---
FAQ (5-6 questions â€” natural language, how users would ask Google):
Q1: [Question]
Q2: [Question]
Q3: [Question]
Q4: [Question]
Q5: [Question]
Q6: [Question â€” optional]

---

Output the outline and NOTHING else. Be specific â€” no generic placeholder text.`;

            const result = await aiService.generateSuggestion(prompt, '');
            setOutline(result);
        } catch (e) {
            setOutline(`Error: ${e.message}`);
        }
        setOutlineLoading(false);
    };

    // â”€â”€â”€ Step 3: Parse outline into sections & write â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleStartWriting = () => {
        // Parse H2 sections from outline
        const sectionMatches = outline.match(/^## .+$/gm) || [];
        const parsedSections = sectionMatches
            .filter(s => !s.includes('TL;DR') && !s.includes('FAQ'))
            .map(s => s.replace(/^## /, '').trim());

        // Always include these structural sections
        const allSections = [
            'Opening (hook + context)',
            ...parsedSections,
            'Frequently Asked Questions',
            'WordPress Metadata',
        ];

        setSections(allSections);
        setWrittenSections({});
        setStep(2);
    };

    const handleWriteSection = async (index) => {
        if (!aiService.isEnabled) return;
        setWritingIndex(index);
        try {
            const sectionName = sections[index];
            const isOpening = index === 0;
            const isFAQ = sectionName.includes('FAQ');
            const isMeta = sectionName.includes('Metadata');

            // Include research context in every section for grounding
            const researchContext = researchResults.length > 0
                ? `\n\nGROUNDING DATA (real competitor articles from Google â€” use these facts, don't hallucinate):\n${researchResults.slice(0, 4).map((r, i) => `${i + 1}. "${r.title}" â€” ${r.snippet || ''}`).join('\n')}\n`
                : '';

            let sectionPrompt = '';

            if (isOpening) {
                sectionPrompt = `${STYLE_PROMPT}

TOPIC: "${topic}"${researchContext}
OUTLINE CONTEXT:
${outline.substring(0, 2000)}

Write the OPENING of this article:
1. A compelling first-person hook paragraph (specific incident/situation â€” NOT "As a data engineer...")
2. A second paragraph explaining what this article covers and why it's different
3. The TL;DR section with 5 bullet points (use â†’ prefix)

Format in markdown. 300-400 words total.`;
            } else if (isFAQ) {
                sectionPrompt = `${STYLE_PROMPT}

TOPIC: "${topic}"${researchContext}
OUTLINE:
${outline.substring(0, 3000)}

Write the FAQ section. Generate 5-6 Q&A pairs following these rules:
- Questions in natural language (how a user would ask Google/Alexa)
- First sentence of each answer is a DIRECT standalone response (works for voice search)
- Then 2-3 sentences of elaboration
- Include the focus keyword naturally in at least 3 answers

Format:
## Frequently Asked Questions

Q: [question]
A: [direct answer. Elaboration.]

(repeat 5-6 times)`;
            } else if (isMeta) {
                sectionPrompt = `${STYLE_PROMPT}

TOPIC: "${topic}"
OUTLINE:
${outline.substring(0, 2000)}

Generate the WordPress metadata section:

WORDPRESS METADATA
Yoast Title: [title | Data Engineer Hub] (under 60 chars before suffix)
Meta Description: [120-155 chars, action verb, includes keyphrase]
Slug: [url-slug]
Focus Keyword: [primary keyphrase]
Secondary Keywords: [kw1, kw2, kw3, kw4, kw5, kw6]
Featured Image Prompt: [Hand-drawn watercolor. No text. Horizontal.]`;
            } else {
                sectionPrompt = `${STYLE_PROMPT}

TOPIC: "${topic}"
SECTION TO WRITE: "${sectionName}"${researchContext}
OUTLINE CONTEXT:
${outline.substring(0, 2000)}

${sectionName.includes('Comparison') ? `Write this section with a comparison TABLE in this format:
## ${sectionName}

Feature | [Option A] | [Option B]
[8 rows with specific, concrete values â€” not vague]

Then 1-2 paragraphs of analysis after the table.` :
sectionName.includes("What I'd Do Differently") ? `Write this section:
## ${sectionName}

2-3 paragraphs of honest, first-person reflection. What you'd change knowing what you know now. Specific recommendations for someone starting fresh in 2026. No hedging.` :
`Write this section:
## ${sectionName}

Write 200-400 words. Include:
- 2-3 paragraphs (short, punchy, specific)
- Code example if relevant (real syntax, with comments)
- Use ### subsections if the section is complex
- Bold key terms on first mention
- End with a transition to the next topic`}

Output ONLY this section's content in markdown. No preamble.`;
            }

            const result = await aiService.generateSuggestion(sectionPrompt, '');
            if (!mounted.current) return;
            setWrittenSections(prev => ({ ...prev, [index]: result }));
        } catch (e) {
            if (!mounted.current) return;
            setWrittenSections(prev => ({ ...prev, [index]: `Error: ${e.message}` }));
        } finally {
            if (mounted.current) setWritingIndex(-1);
        }
    };

    const handleWriteAll = async () => {
        for (let i = 0; i < sections.length; i++) {
            if (!mounted.current) break;
            if (!writtenSections[i]) {
                await handleWriteSection(i);
                if (!mounted.current) break;
                // Small delay between calls to avoid rate limiting
                await new Promise(r => setTimeout(r, 500));
            }
        }
    };

    // â”€â”€â”€ Step 4: Compile & Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleCompile = () => {
        const compiled = sections
            .map((_, i) => writtenSections[i] || `[Section "${sections[i]}" not written yet]`)
            .join('\n\n---\n\n');
        setFullArticle(compiled);
        setStep(3);
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(label);
        setTimeout(() => setCopied(''), 2000);
    };

    // Generate FAQ JSON-LD from the FAQ section
    const generateFAQSchema = () => {
        const faqSection = Object.values(writtenSections).find(s => s?.includes('Frequently Asked Questions'));
        if (!faqSection) return '';
        const pairs = [];
        const lines = faqSection.split('\n');
        let currentQ = '';
        for (const line of lines) {
            if (line.startsWith('Q:') || line.startsWith('**Q:')) {
                currentQ = line.replace(/^\*?\*?Q:\s*\*?\*?/, '').trim();
            } else if ((line.startsWith('A:') || line.startsWith('**A:')) && currentQ) {
                const answer = line.replace(/^\*?\*?A:\s*\*?\*?/, '').trim();
                pairs.push({ question: currentQ, answer });
                currentQ = '';
            }
        }
        if (pairs.length === 0) return '';
        const schema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: pairs.map(p => ({
                '@type': 'Question',
                name: p.question,
                acceptedAnswer: { '@type': 'Answer', text: p.answer },
            })),
        };
        return JSON.stringify(schema, null, 2);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <FileText className="w-8 h-8 text-pink-400" />
                    AI Article Writer
                </h1>
                <p className="text-gray-400">Write full articles in your exact format â€” topic â†’ outline â†’ write section-by-section â†’ export to WordPress.</p>
            </div>

            {/* Step Indicator */}
            <div className="flex flex-wrap items-center gap-2">
                {STEPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <button
                            onClick={() => setStep(i)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                step === i
                                    ? 'bg-pink-600/30 text-white border border-pink-500/40'
                                    : step > i
                                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-800/50 text-gray-500 border border-slate-700'
                            }`}
                        >
                            {step > i ? '✓' : i + 1}. <span className="hidden sm:inline">{s}</span>
                        </button>
                        {i < STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-gray-600 hidden sm:block" />}
                    </div>
                ))}
            </div>

            {/* â•â•â• STEP 1: TOPIC & RESEARCH â•â•â• */}
            {step === 0 && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">What do you want to write about?</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Snowflake vs Databricks for real-time data pipelines"
                            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                        />
                        <button onClick={handleResearch} disabled={researching || !topic.trim()} className="px-5 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 font-medium">
                            {researching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Research
                        </button>
                    </div>

                    {researchResults.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Competitor Research ({researchResults.length} results)</div>
                            {researchResults.map((r, i) => (
                                <div key={i} className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
                                    <div className="text-xs text-white font-medium">{r.title}</div>
                                    {r.snippet && <div className="text-[10px] text-gray-400 mt-1">{r.snippet}</div>}
                                    {r.url && <div className="text-[10px] text-blue-400 mt-0.5 truncate">{r.url}</div>}
                                </div>
                            ))}
                            <button onClick={() => setStep(1)} className="mt-3 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold rounded-xl flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" /> Continue to Outline
                            </button>
                        </div>
                    )}

                    {researchResults.length === 0 && topic.trim() && (
                        <button onClick={() => setStep(1)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg text-sm">
                            Skip research â†’ Go to Outline
                        </button>
                    )}
                </div>
            )}

            {/* â•â•â• STEP 2: OUTLINE â•â•â• */}
            {step === 1 && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h2 className="text-lg font-bold text-white">Article Outline</h2>
                        <button onClick={handleGenerateOutline} disabled={outlineLoading} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
                            {outlineLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {outlineLoading ? 'Generating...' : outline ? 'Regenerate Outline' : 'Generate Outline'}
                        </button>
                    </div>

                    {outline && (
                        <>
                            <textarea
                                value={outline}
                                onChange={(e) => setOutline(e.target.value)}
                                rows={25}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-gray-300 text-xs font-mono leading-relaxed resize-y"
                                placeholder="Outline will appear here..."
                            />
                            <div className="flex items-center gap-3">
                                <button onClick={handleStartWriting} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4" /> Approve & Start Writing
                                </button>
                                <span className="text-xs text-gray-500">Edit the outline above before proceeding â€” the AI will follow it exactly.</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* â•â•â• STEP 3: WRITE SECTIONS â•â•â• */}
            {step === 2 && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Write Sections ({Object.keys(writtenSections).length}/{sections.length} complete)</h2>
                        <div className="flex gap-2">
                            <button onClick={handleWriteAll} disabled={writingIndex >= 0} className="px-4 py-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-2">
                                {writingIndex >= 0 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                                {writingIndex >= 0 ? `Writing ${writingIndex + 1}/${sections.length}...` : 'Write All Sections'}
                            </button>
                            {Object.keys(writtenSections).length === sections.length && (
                                <button onClick={handleCompile} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2">
                                    <Download className="w-3.5 h-3.5" /> Compile & Preview
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-2 bg-gradient-to-r from-pink-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(Object.keys(writtenSections).length / Math.max(1, sections.length)) * 100}%` }}
                        />
                    </div>

                    <div className="space-y-2">
                        {sections.map((section, i) => (
                            <SectionCard
                                key={i}
                                index={i}
                                title={section}
                                content={writtenSections[i] || null}
                                isWriting={writingIndex === i}
                                onWrite={() => handleWriteSection(i)}
                                onRegenerate={() => { setWrittenSections(prev => { const n = { ...prev }; delete n[i]; return n; }); handleWriteSection(i); }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* â•â•â• STEP 4: PREVIEW & EXPORT â•â•â• */}
            {step === 3 && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Final Article â€” Ready to Export</h2>
                        <div className="flex gap-2">
                            <button onClick={() => handleCopy(fullArticle, 'article')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2">
                                {copied === 'article' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied === 'article' ? 'Copied!' : 'Copy Full Article (WordPress)'}
                            </button>
                            {generateFAQSchema() && (
                                <button onClick={() => handleCopy(generateFAQSchema(), 'schema')} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs rounded-xl flex items-center gap-1">
                                    {copied === 'schema' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    FAQ Schema
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-6 text-sm text-gray-300 whitespace-pre-wrap max-h-[600px] overflow-y-auto font-mono leading-relaxed border border-slate-700">
                        {fullArticle}
                    </div>

                    {/* Quality Gate â€” pre-publish check */}
                    {fullArticle && (
                        <QualityGate content={fullArticle} focusKeyword={topic.split(' ').slice(0, 4).join(' ').toLowerCase()} />
                    )}

                    <div className="flex gap-2">
                        <button onClick={() => setStep(2)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs rounded-lg flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Back to Edit Sections
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// â”€â”€â”€ Section Card Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SectionCard({ index, title, content, isWriting, onWrite, onRegenerate }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${
            content ? 'border-emerald-500/30 bg-emerald-900/5' : 'border-slate-700 bg-slate-900/30'
        }`}>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => content && setExpanded(!expanded)}>
                <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        content ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-gray-500'
                    }`}>
                        {content ? 'âœ“' : index + 1}
                    </span>
                    <span className="text-sm text-white">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isWriting && <Loader2 className="w-3.5 h-3.5 text-pink-400 animate-spin" />}
                    {!content && !isWriting && (
                        <button onClick={(e) => { e.stopPropagation(); onWrite(); }} className="px-3 py-1 text-[10px] bg-pink-600/30 hover:bg-pink-600/50 text-pink-300 rounded border border-pink-500/30">
                            Write
                        </button>
                    )}
                    {content && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="px-2 py-1 text-[10px] bg-slate-700 hover:bg-slate-600 text-gray-400 rounded">
                                <RefreshCw className="w-3 h-3" />
                            </button>
                            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                        </>
                    )}
                </div>
            </div>
            {expanded && content && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-700/50">
                    <div className="bg-slate-900/80 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono leading-relaxed">
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ArticleWriterPage;
