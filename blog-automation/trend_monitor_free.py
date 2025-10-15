#!/usr/bin/env python3
"""
Trend Monitor (FREE VERSION) - Uses Google Gemini API
NO Anthropic API needed!
Identifies trending topics in your technology niche
"""

import os
import json
from typing import List, Dict
from datetime import datetime
from dotenv import load_dotenv

try:
    import google.generativeai as genai
except ImportError:
    print("❌ Google Generative AI not installed!")
    print("Install with: pip install google-generativeai")
    exit(1)

# Technology categories - ADD YOUR OWN HERE!
TECH_CATEGORIES = {
    'snowflake': ['snowflake', 'data warehouse', 'snowpipe', 'snowsight', 'cortex ai'],
    'aws': ['aws', 's3', 'redshift', 'glue', 'lambda', 'athena', 'emr'],
    'azure': ['azure', 'synapse', 'data factory', 'databricks', 'fabric'],
    'sql': ['sql', 'query optimization', 'database design', 'postgresql', 'mysql'],
    'python': ['python', 'pandas', 'pyspark', 'data processing', 'numpy'],
    'airflow': ['airflow', 'dag', 'workflow orchestration', 'scheduler'],
    'dbt': ['dbt', 'data transformation', 'analytics engineering', 'dbt cloud'],
    'gcp': ['bigquery', 'dataflow', 'gcp', 'google cloud', 'cloud composer'],
    'kafka': ['kafka', 'streaming', 'real-time data', 'event driven'],
    'spark': ['apache spark', 'pyspark', 'spark streaming', 'databricks']
}

class TrendMonitorFree:
    def __init__(self, api_key: str):
        """Initialize with Google Gemini API (FREE or Pro)"""
        genai.configure(api_key=api_key)
        
        # Use Gemini Pro if you have it, otherwise Flash (free)
        try:
            self.model = genai.GenerativeModel('gemini-1.5-pro-latest')
            print("✅ Using Gemini 1.5 Pro (You have a paid/pro-tier key!)")
        except:
            self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
            print("✅ Using Gemini 1.5 Flash (Free tier)")
    
    def analyze_trends(self, time_range: str = 'last_30_days', limit: int = 10) -> List[Dict]:
        """
        Analyze current trends using Gemini (NO Anthropic needed!)
        """
        print(f"🔍 Analyzing trends in data engineering...")
        
        # Build category context
        categories_text = "\n".join([
            f"- {cat.upper()}: {', '.join(keywords[:5])}" 
            for cat, keywords in TECH_CATEGORIES.items()
        ])
        
        prompt = f"""You are a data engineering trend analyst. Based on your knowledge and current industry patterns, identify the TOP {limit} trending topics for blog content.

TECHNOLOGY CATEGORIES TO ANALYZE:
{categories_text}

CURRENT DATE: {datetime.now().strftime('%B %Y')}

ANALYSIS CRITERIA:
1. Recent announcements or releases (last 1-3 months)
2. High search interest and community discussion
3. Practical value for data engineers
4. Tutorial/guide potential (good for blog posts)
5. Career advancement relevance

For each trending topic, provide:
- title: Compelling blog post title (60-80 characters)
- category: Which tech category it belongs to
- keywords: 5-7 relevant keywords
- trend_score: 1-10 (10 = hottest trend)
- why_trending: Brief reason (1 sentence)
- target_audience: Who would read this (e.g., "intermediate data engineers")
- content_type: Type of post (e.g., "tutorial", "comparison", "best practices")

FOCUS ON:
- New features, updates, or releases
- Emerging best practices
- Common pain points and solutions
- Career-relevant skills
- Tools and technologies gaining popularity

Return as JSON array ONLY (no markdown, no extra text):
[
  {{
    "title": "Complete Guide to...",
    "category": "snowflake",
    "keywords": ["keyword1", "keyword2", ...],
    "trend_score": 9,
    "why_trending": "Recently released feature gaining rapid adoption",
    "target_audience": "intermediate data engineers",
    "content_type": "tutorial",
    "level": "intermediate"
  }}
]

Return exactly {limit} trending topics, ranked by trend_score (highest first)."""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean response
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            topics = json.loads(text)
            
            # Validate and enrich
            for topic in topics:
                # Ensure all required fields
                topic.setdefault('trend_score', 5)
                topic.setdefault('level', 'intermediate')
                topic.setdefault('content_type', 'tutorial')
                topic.setdefault('target_audience', 'data engineers')
            
            # Sort by trend score
            topics.sort(key=lambda x: x.get('trend_score', 0), reverse=True)
            
            return topics[:limit]
        
        except json.JSONDecodeError as e:
            print(f"⚠️  Error parsing JSON: {e}")
            print(f"Response text: {text[:500]}")
            return self._get_fallback_topics()[:limit]
        
        except Exception as e:
            print(f"❌ Error analyzing trends: {e}")
            return self._get_fallback_topics()[:limit]
    
    def _get_fallback_topics(self) -> List[Dict]:
        """Fallback topics if API fails"""
        print("ℹ️  Using fallback topics...")
        
        return [
            {
                "title": "Complete Guide to Snowflake Cortex AI for Data Engineers",
                "category": "snowflake",
                "keywords": ["snowflake cortex", "ai", "machine learning", "llm"],
                "trend_score": 9,
                "why_trending": "Recently released AI capabilities in Snowflake",
                "target_audience": "intermediate data engineers",
                "content_type": "tutorial",
                "level": "intermediate"
            },
            {
                "title": "dbt Best Practices and Common Pitfalls in 2025",
                "category": "dbt",
                "keywords": ["dbt", "best practices", "analytics engineering", "testing"],
                "trend_score": 8,
                "why_trending": "Growing adoption of dbt in enterprises",
                "target_audience": "analytics engineers",
                "content_type": "best practices",
                "level": "intermediate"
            },
            {
                "title": "Building Real-Time Data Pipelines with Apache Kafka",
                "category": "kafka",
                "keywords": ["kafka", "streaming", "real-time", "event driven"],
                "trend_score": 8,
                "why_trending": "High demand for real-time data processing",
                "target_audience": "senior data engineers",
                "content_type": "tutorial",
                "level": "advanced"
            },
            {
                "title": "Python for Data Engineering: Essential Libraries and Tools",
                "category": "python",
                "keywords": ["python", "pandas", "polars", "data processing"],
                "trend_score": 7,
                "why_trending": "Foundational skill with new tools emerging",
                "target_audience": "beginner to intermediate",
                "content_type": "guide",
                "level": "intermediate"
            },
            {
                "title": "AWS Glue vs Apache Airflow: Which ETL Tool to Choose?",
                "category": "aws",
                "keywords": ["aws glue", "airflow", "etl", "comparison"],
                "trend_score": 7,
                "why_trending": "Common decision point for data teams",
                "target_audience": "data engineering leads",
                "content_type": "comparison",
                "level": "intermediate"
            },
            {
                "title": "Optimizing SQL Queries for Large-Scale Data Processing",
                "category": "sql",
                "keywords": ["sql optimization", "performance", "query tuning"],
                "trend_score": 6,
                "why_trending": "Evergreen topic with high search volume",
                "target_audience": "all levels",
                "content_type": "tutorial",
                "level": "intermediate"
            },
            {
                "title": "Getting Started with Apache Spark on Databricks",
                "category": "spark",
                "keywords": ["apache spark", "databricks", "big data", "pyspark"],
                "trend_score": 6,
                "why_trending": "Popular big data processing framework",
                "target_audience": "intermediate data engineers",
                "content_type": "tutorial",
                "level": "intermediate"
            },
            {
                "title": "Azure Synapse Analytics: Complete Architecture Guide",
                "category": "azure",
                "keywords": ["azure synapse", "data warehouse", "analytics"],
                "trend_score": 5,
                "why_trending": "Azure adoption growing in enterprises",
                "target_audience": "cloud architects",
                "content_type": "guide",
                "level": "advanced"
            },
            {
                "title": "Data Quality Testing Strategies with Great Expectations",
                "category": "python",
                "keywords": ["data quality", "testing", "great expectations", "validation"],
                "trend_score": 5,
                "why_trending": "Growing focus on data quality",
                "target_audience": "data engineers",
                "content_type": "tutorial",
                "level": "intermediate"
            },
            {
                "title": "Modern Data Stack: Tools and Technologies Overview 2025",
                "category": "general",
                "keywords": ["modern data stack", "tools", "technologies", "overview"],
                "trend_score": 5,
                "why_trending": "Helps teams make technology decisions",
                "target_audience": "all levels",
                "content_type": "overview",
                "level": "beginner"
            }
        ]
    
    def get_topics_by_category(self, category: str, limit: int = 5) -> List[Dict]:
        """Get trending topics for a specific category"""
        print(f"🔍 Finding trends in {category.upper()}...")
        
        if category not in TECH_CATEGORIES:
            print(f"⚠️  Unknown category: {category}")
            return []
        
        keywords = TECH_CATEGORIES[category]
        
        prompt = f"""Identify {limit} trending topics specifically for {category.upper()} technology.

FOCUS KEYWORDS: {', '.join(keywords)}
CURRENT DATE: {datetime.now().strftime('%B %Y')}

Provide trending topics that:
1. Are relevant to {category}
2. Have tutorial/guide potential
3. Are currently popular or emerging
4. Would interest data engineers

Return as JSON array with the same structure as before.
Focus only on {category} topics."""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            topics = json.loads(text)
            return topics[:limit]
        
        except Exception as e:
            print(f"❌ Error: {e}")
            # Return category-specific fallback
            fallback = self._get_fallback_topics()
            return [t for t in fallback if t['category'] == category][:limit]


def main():
    """Test the FREE trend monitor"""
    # Find the .env file in the current or parent directories
    dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(dotenv_path=dotenv_path, encoding='utf-16')
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found!")
        print("\n📝 To get API key:")
        print("1. Visit: https://ai.google.dev/")
        print("2. Click 'Get API key in Google AI Studio'")
        print("3. Get FREE or use your Gemini Pro key")
        print("4. Add to .env: GEMINI_API_KEY=your_key_here")
        return
    
    monitor = TrendMonitorFree(api_key)
    
    print("\n🚀 Testing Trend Monitor (NO Anthropic needed!)...\n")
    
    # Test 1: Get overall trends
    print("="*60)
    print("TEST 1: Top 10 Trending Topics")
    print("="*60)
    topics = monitor.analyze_trends(limit=10)
    
    print(f"\n✅ Found {len(topics)} trending topics:\n")
    for i, topic in enumerate(topics, 1):
        print(f"{i}. {topic['title']}")
        print(f"   Category: {topic['category']}")
        print(f"   Score: {topic['trend_score']}/10")
        print(f"   Why: {topic.get('why_trending', 'N/A')}")
        print()
    
    # Test 2: Category-specific trends
    print("\n" + "="*60)
    print("TEST 2: Snowflake-Specific Trends")
    print("="*60)
    snowflake_topics = monitor.get_topics_by_category('snowflake', limit=3)
    
    print(f"\n✅ Found {len(snowflake_topics)} Snowflake topics:\n")
    for i, topic in enumerate(snowflake_topics, 1):
        print(f"{i}. {topic['title']}")
        print(f"   Keywords: {', '.join(topic['keywords'][:5])}")
        print()
    
    # Save results
    output = {
        'generated_at': datetime.now().isoformat(),
        'all_trends': topics,
        'snowflake_trends': snowflake_topics,
        'api_used': 'Google Gemini (FREE/Pro)',
        'cost': 'FREE with Gemini Flash, or included in Gemini Pro subscription'
    }
    
    with open('trends_analysis_free.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print("✅ Trend analysis complete!")
    print(f"💰 Cost: $0 (using Gemini API)")
    print(f"📁 Results saved to: trends_analysis_free.json")
    print("="*60)


if __name__ == "__main__":
    main()
