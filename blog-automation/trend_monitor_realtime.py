# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
100% FREE Real-Time Trend Monitor
Uses: BeautifulSoup + Free APIs to find REAL trending topics
No paid services required!
"""

import os
import json
import requests
from typing import List, Dict
from datetime import datetime, timedelta
from collections import Counter
import time
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies!")
    print("Install with: pip install google-generativeai beautifulsoup4 lxml")
    exit(1)


class FreeTrendMonitor:
    def __init__(self, gemini_api_key: str):
        """Initialize with FREE Gemini API"""
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-flash-latest')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        print("100% FREE Trend Monitor initialized")
    
    def analyze_trends(self, limit: int = 10) -> List[Dict]:
        """Find REAL trending topics using FREE sources"""
        print(f"Searching for real-time trending topics (100% FREE)...\n")
        
        all_signals = []
        
        # 1. Reddit (FREE - Public JSON API)
        print("Scraping Reddit...")
        reddit_signals = self._scrape_reddit()
        all_signals.extend(reddit_signals)
        print(f"   Found {len(reddit_signals)} trending posts from Reddit")
        
        # 2. Hacker News (FREE - Official API)
        print("Checking Hacker News...")
        hn_signals = self._scrape_hackernews()
        all_signals.extend(hn_signals)
        print(f"   Found {len(hn_signals)} hot topics from HN")
        
        # 3. GitHub Trending (FREE - Web scraping)
        print("Scraping GitHub Trending...")
        github_signals = self._scrape_github_trending()
        all_signals.extend(github_signals)
        print(f"   Found {len(github_signals)} trending repos")
        
        # 4. Dev.to (FREE - Public API)
        print("Checking Dev.to...")
        devto_signals = self._scrape_devto()
        all_signals.extend(devto_signals)
        print(f"   Found {len(devto_signals)} trending articles")
        
        # 5. Medium (FREE - Web scraping)
        print("Checking Medium...")
        medium_signals = self._scrape_medium()
        all_signals.extend(medium_signals)
        print(f"   Found {len(medium_signals)} trending Medium posts")
        
        # 6. Stack Overflow (FREE - API)
        print("Checking Stack Overflow...")
        so_signals = self._scrape_stackoverflow()
        all_signals.extend(so_signals)
        print(f"   Found {len(so_signals)} hot questions")
        
        print(f"\nTotal signals collected: {len(all_signals)}")
        
        if len(all_signals) == 0:
            print("No signals found, using fallback topics")
            return self._get_emergency_fallback(limit)
        
        # Analyze with AI
        print("\nAnalyzing signals with Gemini (FREE)...")
        trending_topics = self._analyze_with_gemini(all_signals, limit)
        
        return trending_topics
    
    def _scrape_reddit(self) -> List[Dict]:
        """Scrape Reddit using FREE public JSON API"""
        signals = []
        subreddits = [
            'dataengineering',
            'learnprogramming', 
            'python',
            'aws',
            'datascience',
            'MachineLearning',
            'selfhosted'
        ]
        
        for subreddit in subreddits:
            try:
                url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=20"
                response = self.session.get(url, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for post in data['data']['children']:
                        p = post['data']
                        
                        # Calculate engagement score
                        engagement = p['score'] + (p['num_comments'] * 2)
                        
                        # Filter: only posts with good engagement
                        if engagement > 50:
                            signals.append({
                                'source': f'reddit/r/{subreddit}',
                                'title': p['title'],
                                'score': p['score'],
                                'comments': p['num_comments'],
                                'engagement': engagement,
                                'url': f"https://reddit.com{p['permalink']}",
                                'created': p['created_utc'],
                                'age_hours': (time.time() - p['created_utc']) / 3600
                            })
                
                time.sleep(1)  # Be nice to Reddit
                
            except Exception as e:
                print(f"   Reddit/{subreddit} error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_hackernews(self) -> List[Dict]:
        """Scrape Hacker News using FREE official API"""
        signals = []
        
        try:
            # Get top stories
            top_url = "https://hacker-news.firebaseio.com/v0/topstories.json"
            response = self.session.get(top_url, timeout=10)
            
            if response.status_code == 200:
                story_ids = response.json()[:25]
                
                for story_id in story_ids:
                    try:
                        item_url = f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
                        item_response = self.session.get(item_url, timeout=5)
                        
                        if item_response.status_code == 200:
                            story = item_response.json()
                            
                            if story and story.get('type') == 'story':
                                engagement = story.get('score', 0) + (story.get('descendants', 0) * 2)
                                
                                if engagement > 30:
                                    signals.append({
                                        'source': 'hackernews',
                                        'title': story.get('title', ''),
                                        'score': story.get('score', 0),
                                        'comments': story.get('descendants', 0),
                                        'engagement': engagement,
                                        'url': story.get('url', f"https://news.ycombinator.com/item?id={story_id}"),
                                        'created': story.get('time', 0),
                                        'age_hours': (time.time() - story.get('time', 0)) / 3600
                                    })
                    except:
                        continue
        
        except Exception as e:
            print(f"   HN error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_github_trending(self) -> List[Dict]:
        """Scrape GitHub Trending using web scraping (FREE)"""
        signals = []
        languages = ['python', 'javascript', 'go']
        
        for lang in languages:
            try:
                url = f"https://github.com/trending/{lang}?since=daily"
                response = self.session.get(url, timeout=15)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'lxml')
                    articles = soup.find_all('article', class_='Box-row')
                    
                    for article in articles[:5]:
                        try:
                            # Get repo name
                            h2 = article.find('h2')
                            if not h2:
                                continue
                            
                            repo_link = h2.find('a')
                            repo_name = repo_link.get('href', '').strip('/') if repo_link else ''
                            
                            # Get description
                            desc_elem = article.find('p', class_='col-9')
                            description = desc_elem.text.strip() if desc_elem else ''
                            
                            signals.append({
                                'source': f'github/{lang}',
                                'title': f"{repo_name}: {description[:100]}",
                                'score': 100,
                                'comments': 0,
                                'engagement': 100,
                                'url': f"https://github.com/{repo_name}",
                                'created': time.time(),
                                'age_hours': 1
                            })
                        except:
                            continue
                
                time.sleep(2)
                
            except Exception as e:
                print(f"   GitHub/{lang} error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_devto(self) -> List[Dict]:
        """Scrape Dev.to using FREE public API"""
        signals = []
        
        try:
            url = "https://dev.to/api/articles?top=7"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                articles = response.json()
                
                for article in articles[:15]:
                    engagement = article.get('positive_reactions_count', 0) + (article.get('comments_count', 0) * 3)
                    
                    if engagement > 20:
                        signals.append({
                            'source': 'devto',
                            'title': article['title'],
                            'score': article.get('positive_reactions_count', 0),
                            'comments': article.get('comments_count', 0),
                            'engagement': engagement,
                            'url': article['url'],
                            'created': datetime.fromisoformat(article['published_at'].replace('Z', '+00:00')).timestamp(),
                            'age_hours': 24,
                            'tags': article.get('tag_list', [])
                        })
        
        except Exception as e:
            print(f"   Dev.to error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_medium(self) -> List[Dict]:
        """Scrape Medium trending topics (FREE via web scraping)"""
        signals = []
        
        tags = ['data-engineering', 'python', 'machine-learning', 'aws', 'programming']
        
        for tag in tags:
            try:
                # Medium's tag feed (public)
                url = f"https://medium.com/tag/{tag}/latest"
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    # Simple title extraction
                    soup = BeautifulSoup(response.text, 'lxml')
                    
                    # Look for article titles
                    h2_tags = soup.find_all('h2')
                    
                    for h2 in h2_tags[:3]:
                        title = h2.get_text().strip()
                        if len(title) > 20:
                            signals.append({
                                'source': f'medium/{tag}',
                                'title': title,
                                'score': 50,
                                'comments': 0,
                                'engagement': 50,
                                'url': f"https://medium.com/tag/{tag}",
                                'created': time.time(),
                                'age_hours': 12
                            })
                
                time.sleep(2)
                
            except Exception as e:
                print(f"   Medium/{tag} error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_stackoverflow(self) -> List[Dict]:
        """Scrape Stack Overflow using FREE API"""
        signals = []
        
        try:
            tags = ['python', 'sql', 'aws', 'pandas']
            
            for tag in tags[:3]:
                url = f"https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&tagged={tag}&site=stackoverflow"
                response = self.session.get(url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for q in data.get('items', [])[:5]:
                        engagement = q.get('score', 0) + q.get('answer_count', 0) * 5
                        
                        if engagement > 10:
                            signals.append({
                                'source': f'stackoverflow/{tag}',
                                'title': q.get('title', ''),
                                'score': q.get('score', 0),
                                'comments': q.get('answer_count', 0),
                                'engagement': engagement,
                                'url': q.get('link', ''),
                                'created': q.get('creation_date', time.time()),
                                'age_hours': (time.time() - q.get('creation_date', time.time())) / 3600
                            })
                
                time.sleep(2)
        
        except Exception as e:
            print(f"   StackOverflow error: {str(e)[:50]}")
        
        return signals
    
    def _analyze_with_gemini(self, signals: List[Dict], limit: int) -> List[Dict]:
        """Analyze signals using FREE Gemini"""
        
        # Filter recent signals (last 7 days)
        cutoff = time.time() - (7 * 24 * 60 * 60)
        recent = [s for s in signals if s.get('created', 0) > cutoff]
        
        # Sort by engagement
        recent.sort(key=lambda x: x.get('engagement', 0), reverse=True)
        
        # Take top 60 signals
        top_signals = recent[:60]
        
        # Create summary for AI
        signal_list = []
        for s in top_signals:
            signal_list.append({
                'source': s['source'],
                'title': s['title'][:100],
                'engagement': s['engagement'],
                'age_hours': round(s.get('age_hours', 24), 1)
            })
        
        prompt = f"""You are analyzing REAL trending signals from Reddit, Hacker News, GitHub, Dev.to, Medium, and Stack Overflow.

REAL SIGNALS (collected in the last hour):
{json.dumps(signal_list, indent=2)}

TASK: Identify the top {limit} topics that would make EXCELLENT blog posts for data engineers in 2025.

REQUIREMENTS:
1. Base recommendations ONLY on the signals above (DO NOT invent trends)
2. Look for patterns - multiple signals about the same topic = strong trend
3. Prioritize topics with high engagement and recency
4. Focus on practical, tutorial-worthy topics

For each topic, provide:
- title: Compelling blog title (include "2025" or "Complete Guide")
- category: snowflake/aws/python/kafka/dbt/sql/airflow/spark/general
- keywords: 5-7 SEO keywords
- trend_score: 1-10 (based on signal strength)
- why_trending: Explain using actual signals
- evidence: List specific sources
- target_audience: beginner/intermediate/advanced data engineers
- content_type: tutorial/guide/comparison/best-practices
- level: beginner/intermediate/advanced
- signal_sources: Array of source names

Return as JSON array ONLY (no markdown):
[
  {{
    "title": "Complete Guide to [Topic] in 2025",
    "category": "python",
    "keywords": ["keyword1", "keyword2"],
    "trend_score": 9,
    "why_trending": "Multiple signals...",
    "evidence": "Reddit: 3 posts",
    "target_audience": "intermediate data engineers",
    "content_type": "tutorial",
    "level": "intermediate",
    "signal_sources": ["reddit/r/dataengineering"]
  }}
]"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Extract JSON
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            topics = json.loads(text)
            
            # Add metadata
            for topic in topics:
                topic['analyzed_at'] = datetime.now().isoformat()
                topic['total_signals_analyzed'] = len(signals)
            
            return topics[:limit]
        
        except Exception as e:
            print(f"Gemini analysis failed: {e}")
            return self._manual_analysis(top_signals, limit)
    
    def _manual_analysis(self, signals: List[Dict], limit: int) -> List[Dict]:
        """Fallback: Manual topic extraction"""
        print("Using manual analysis...")
        
        topics = []
        for i, signal in enumerate(signals[:limit], 1):
            topics.append({
                'title': signal['title'][:80],
                'category': 'general',
                'keywords': signal['title'].lower().split()[:5],
                'trend_score': min(10, signal['engagement'] // 20),
                'why_trending': f"High engagement on {signal['source']}",
                'evidence': f"{signal['source']}: {signal['engagement']} points",
                'target_audience': 'data engineers',
                'content_type': 'guide',
                'level': 'intermediate',
                'source_url': signal['url']
            })
        
        return topics
    
    def _get_emergency_fallback(self, limit: int) -> List[Dict]:
        """Emergency fallback if all scraping fails"""
        print("Using emergency fallback...")
        
        return [
            {
                "title": "Complete Guide to Vector Databases for Data Engineers 2025",
                "category": "ai_data",
                "keywords": ["vector database", "embeddings", "rag"],
                "trend_score": 9,
                "why_trending": "AI/LLM boom",
                "evidence": "Emergency fallback",
                "target_audience": "intermediate data engineers",
                "content_type": "guide",
                "level": "intermediate"
            }
        ][:limit]


def main():
    """Test the 100% FREE trend monitor"""
    load_dotenv()
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("GEMINI_API_KEY not found!")
        print("\nGet FREE API key at: https://ai.google.dev/")
        return
    
    monitor = FreeTrendMonitor(api_key)
    
    print("\n" + "="*70)
    print("100% FREE REAL-TIME TREND ANALYSIS")
    print("="*70 + "\n")
    
    topics = monitor.analyze_trends(limit=10)
    
    print("\n" + "="*70)
    print(f"FOUND {len(topics)} REAL TRENDING TOPICS (NO COST!)")
    print("="*70 + "\n")
    
    for i, topic in enumerate(topics, 1):
        print(f"{i}. {topic['title']}")
        print(f"   Trend Score: {topic['trend_score']}/10")
        print(f"   Why: {topic['why_trending']}")
        print(f"   Evidence: {topic['evidence']}")
        print(f"   Category: {topic['category']}")
        print()
    
    # Save results
    output = {
        'analyzed_at': datetime.now().isoformat(),
        'method': '100% FREE web scraping',
        'cost': '$0.00',
        'topics': topics
    }
    
    output_file = 'real_trending_topics.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print("="*70)
    print(f"Results saved to: {output_file}")
    print("Total cost: $0.00 (100% FREE!)")
    print("="*70)


if __name__ == "__main__":
    main()
