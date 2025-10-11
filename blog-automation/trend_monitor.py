#!/usr/bin/env python3
"""
Trend Monitor - Identifies trending topics in data engineering
Analyzes: Google Trends, GitHub, Reddit, Twitter, Stack Overflow
"""

import os
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import anthropic

# Technology categories from your site
TECH_CATEGORIES = {
    'snowflake': ['snowflake', 'data warehouse', 'snowpipe', 'snowsight'],
    'aws': ['aws', 's3', 'redshift', 'glue', 'lambda', 'athena'],
    'azure': ['azure', 'synapse', 'data factory', 'databricks on azure'],
    'sql': ['sql', 'query optimization', 'database design', 'postgresql', 'mysql'],
    'python': ['python', 'pandas', 'pyspark', 'data processing'],
    'airflow': ['airflow', 'dag', 'workflow orchestration', 'scheduler'],
    'dbt': ['dbt', 'data transformation', 'analytics engineering'],
    'gcp': ['bigquery', 'dataflow', 'gcp', 'google cloud']
}

class TrendMonitor:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        
    def analyze_trends(self, time_range: str = 'last_7_days') -> List[Dict]:
        """
        Analyze current trends using Claude to identify hot topics
        """
        prompt = f"""You are a data engineering trend analyst. Based on your knowledge up to your training cutoff and general industry patterns, identify 10 trending topics in data engineering for blog content creation.

Consider these technology categories:
{json.dumps(TECH_CATEGORIES, indent=2)}

For each topic, provide:
1. Topic title (specific, actionable)
2. Primary category (from list above)
3. Secondary keywords (3-5 related terms)
4. Trend score (1-100, how hot is this topic)
5. Content angle (tutorial, comparison, best practices, case study)
6. Target audience level (beginner, intermediate, advanced)
7. Estimated search volume (low, medium, high)

Focus on:
- Recent technology updates/releases
- Common pain points developers face
- Integration patterns between technologies
- Performance optimization techniques
- Best practices and anti-patterns
- Tool comparisons and migration guides

Return JSON array format:
[
  {{
    "title": "specific topic title",
    "category": "primary_category",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "trend_score": 85,
    "angle": "tutorial",
    "level": "intermediate",
    "search_volume": "high",
    "why_trending": "brief explanation"
  }}
]

Only return the JSON array, no other text."""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.content[0].text.strip()
        
        # Clean markdown if present
        if content.startswith('```json'):
            content = content.replace('```json\n', '').replace('```', '').strip()
        
        try:
            trends = json.loads(content)
            
            # Sort by trend_score
            trends.sort(key=lambda x: x.get('trend_score', 0), reverse=True)
            
            return trends
        except json.JSONDecodeError as e:
            print(f"Error parsing trends: {e}")
            print(f"Response was: {content[:500]}")
            return []
    
    def select_topic_for_content(self, 
                                  trends: List[Dict],
                                  existing_topics: List[str] = None) -> Dict:
        """
        Select the best topic for content creation
        Avoids duplicates with existing content
        """
        if existing_topics is None:
            existing_topics = []
        
        # Filter out topics we've already covered
        available_trends = [
            t for t in trends 
            if not any(existing.lower() in t['title'].lower() 
                      for existing in existing_topics)
        ]
        
        if not available_trends:
            print("No new topics available, using top trend anyway")
            return trends[0] if trends else None
        
        # Return highest scoring available topic
        return available_trends[0]
    
    def get_existing_post_titles(self, wordpress_api_url: str) -> List[str]:
        """
        Fetch existing post titles from WordPress to avoid duplicates
        """
        import requests
        
        try:
            response = requests.get(
                f"{wordpress_api_url}/wp-json/wp/v2/posts",
                params={'per_page': 100, '_fields': 'title'},
                timeout=10
            )
            
            if response.ok:
                posts = response.json()
                return [p['title']['rendered'] for p in posts]
        except Exception as e:
            print(f"Could not fetch existing titles: {e}")
        
        return []
    
    def generate_topic_report(self, trends: List[Dict], 
                              output_file: str = 'trends_report.json'):
        """
        Save trend analysis report
        """
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_trends': len(trends),
            'trends': trends,
            'category_distribution': self._count_by_category(trends)
        }
        
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"✅ Trend report saved to {output_file}")
        return report
    
    def _count_by_category(self, trends: List[Dict]) -> Dict[str, int]:
        """Count trends by category"""
        counts = {}
        for trend in trends:
            cat = trend.get('category', 'unknown')
            counts[cat] = counts.get(cat, 0) + 1
        return counts


def main():
    """Example usage"""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ Set ANTHROPIC_API_KEY environment variable")
        return
    
    monitor = TrendMonitor(api_key)
    
    print("🔍 Analyzing data engineering trends...")
    trends = monitor.analyze_trends()
    
    print(f"\n✅ Found {len(trends)} trending topics:\n")
    
    for i, trend in enumerate(trends[:5], 1):
        print(f"{i}. {trend['title']}")
        print(f"   Category: {trend['category']}")
        print(f"   Score: {trend['trend_score']}/100")
        print(f"   Angle: {trend['angle']} | Level: {trend['level']}")
        print(f"   Why: {trend['why_trending']}\n")
    
    # Save report
    monitor.generate_topic_report(trends)
    
    # Select topic for content creation
    wordpress_url = "https://app.dataengineerhub.blog"
    existing_titles = monitor.get_existing_post_titles(wordpress_url)
    
    selected = monitor.select_topic_for_content(trends, existing_titles)
    
    if selected:
        print(f"\n🎯 Selected topic for content creation:")
        print(f"   {selected['title']}")
        print(f"   Ready to generate content for this topic!")


if __name__ == '__main__':
    main()