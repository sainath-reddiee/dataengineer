/**
 * Optimized Prompts for PSEO Content Generation
 * Structured to produce high-quality, SEO-optimized content
 */

// =============================================================================
// GLOSSARY TERM PROMPT
// =============================================================================

export function getGlossaryPrompt(term, category, existingTerms = []) {
    const existingList = existingTerms.slice(0, 10).join(', ');

    return `You are a senior data engineering expert writing for DataEngineer Hub, a technical blog for data professionals.

Generate a comprehensive glossary entry for "${term}" in the category "${category}".

REQUIREMENTS:
1. fullDefinition: 400-600 words with markdown formatting
   - Use ## for section headers (e.g., "## Key Features", "## How It Works")
   - Include practical examples where relevant
   - Mention related tools/technologies
   - Be technically accurate and up-to-date

2. shortDefinition: 1-2 sentences (max 160 characters) - perfect for meta description

3. keyPoints: Array of 5 key takeaways (bullet-point style, 1 sentence each)

4. faqs: Array of 4 objects with "question" and "answer" keys
   - Questions should be what data engineers actually search for
   - Answers should be 2-3 sentences each, informative and practical

5. keywords: Array of 10 SEO keywords related to this term

6. relatedTerms: Array of 5 slugs from this list that are most related: [${existingList}]
   - If none are related, suggest new terms as slugs (lowercase, hyphenated)

7. relatedTools: Array of 3-5 tools/products related to this term

OUTPUT FORMAT (strict JSON):
{
  "term": "${term}",
  "slug": "<lowercase-hyphenated-version>",
  "category": "${category}",
  "shortDefinition": "<string>",
  "fullDefinition": "<markdown string>",
  "keyPoints": ["<string>", ...],
  "faqs": [{"question": "<string>", "answer": "<string>"}, ...],
  "keywords": ["<string>", ...],
  "relatedTerms": ["<slug>", ...],
  "relatedTools": ["<string>", ...],
  "lastUpdated": "${new Date().toISOString().split('T')[0]}"
}`;
}

// =============================================================================
// COMPARISON PROMPT
// =============================================================================

export function getComparisonPrompt(toolA, toolB, category) {
    return `You are a senior data engineering expert writing for DataEngineer Hub.

Generate a detailed comparison between "${toolA}" and "${toolB}" in the "${category}" category.

REQUIREMENTS:
1. intro: 100-150 words providing context on why this comparison matters

2. shortVerdict: 1-2 sentences summarizing who should choose which tool

3. features: Array of 5-7 comparison points, each with:
   - name: Feature category (e.g., "Scalability", "Pricing", "Ease of Use")
   - toolAValue: How ${toolA} handles this (1-2 sentences)
   - toolBValue: How ${toolB} handles this (1-2 sentences)
   - winner: "${toolA}" or "${toolB}" or "Tie"

4. pros: Object with toolA and toolB arrays (3-4 pros each)

5. cons: Object with toolA and toolB arrays (2-3 cons each)

6. finalVerdict: 150-200 words with:
   - "**Choose ${toolA} if:**" followed by 3 bullet points
   - "**Choose ${toolB} if:**" followed by 3 bullet points

7. winner: "${toolA}" or "${toolB}" or "It Depends"

OUTPUT FORMAT (strict JSON):
{
  "id": "<toolA-vs-toolB-slug>",
  "slug": "<toolA-vs-toolB-slug>",
  "toolA": "${toolA}",
  "toolB": "${toolB}",
  "category": "${category}",
  "winner": "<string>",
  "shortVerdict": "<string>",
  "intro": "<string>",
  "features": [{"name": "<string>", "toolAValue": "<string>", "toolBValue": "<string>", "winner": "<string>"}, ...],
  "pros": {"toolA": ["<string>", ...], "toolB": ["<string>", ...]},
  "cons": {"toolA": ["<string>", ...], "toolB": ["<string>", ...]},
  "finalVerdict": "<markdown string>",
  "relatedComparisons": [],
  "lastUpdated": "${new Date().toISOString().split('T')[0]}"
}`;
}

// =============================================================================
// TOPIC SUGGESTION PROMPT
// =============================================================================

export function getTopicSuggestionsPrompt(type, count, existingTopics = []) {
    const existing = existingTopics.slice(0, 20).join(', ');

    if (type === 'glossary') {
        return `You are a data engineering content strategist.

Suggest ${count} NEW glossary terms for a data engineering blog.

EXISTING TERMS (do not duplicate): ${existing || 'None yet'}

Focus on:
- Modern data stack tools (Fivetran, dbt, Dagster, Prefect, etc.)
- Cloud data platforms (Snowflake, Databricks, BigQuery features)
- Data engineering concepts (Data Mesh, Data Contracts, etc.)
- Streaming & real-time (Kafka, Flink, Spark Streaming)

OUTPUT FORMAT (JSON array):
[
  {"term": "<Nice Name>", "category": "<category-slug>", "priority": "high|medium|low"},
  ...
]

Categories available: data-warehousing, etl-elt, data-orchestration, data-modeling, cloud-platforms, data-governance, data-quality, data-observability, streaming, analytics, data-integration`;
    } else {
        return `You are a data engineering content strategist.

Suggest ${count} NEW tool comparisons for a data engineering blog.

EXISTING COMPARISONS (do not duplicate): ${existing || 'None yet'}

Focus on high-intent comparisons data engineers actually search for:
- Orchestration: Airflow vs Prefect, Dagster vs Prefect
- Warehouses: Snowflake vs Databricks, BigQuery vs Redshift
- Transformation: dbt vs Dataform, dbt vs SQLMesh
- Streaming: Kafka vs Pulsar, Flink vs Spark Streaming

OUTPUT FORMAT (JSON array):
[
  {"toolA": "<Tool A>", "toolB": "<Tool B>", "category": "<category>", "priority": "high|medium|low"},
  ...
]`;
    }
}
