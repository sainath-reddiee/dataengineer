# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
ENHANCED Real-Time Trend Monitor with Official Documentation Scraping
Uses: BeautifulSoup + Free APIs + Official Tech Docs
Supports category-specific searches for targeted blog topics
INCLUDES: Snowflake, AWS, Azure, dbt, Airflow, Python, SQL, GCP, Salesforce, Databricks
"""

import os
import json
import requests
from typing import List, Dict
from datetime import datetime, timedelta
from collections import Counter
import time
from dotenv import load_dotenv
import re
import argparse

try:
    import google.generativeai as genai
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies!")
    print("Install with: pip install google-generativeai beautifulsoup4 lxml requests python-dotenv")
    exit(1)


class EnhancedTrendMonitor:
    def __init__(self, gemini_api_key: str):
        """Initialize with FREE Gemini API"""
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Category-specific subreddits
        self.category_subreddits = {
            'snowflake': ['snowflake', 'dataengineering', 'datawarehouse', 'CloudDataWarehouse'],
            'aws': ['aws', 'amazonwebservices', 'devops', 'dataengineering'],
            'azure': ['AZURE', 'dataengineering', 'azuredevops'],
            'dbt': ['dbt', 'analytics', 'dataengineering'],
            'airflow': ['airflow', 'dataengineering', 'devops'],
            'python': ['python', 'learnpython', 'datascience', 'dataengineering'],
            'sql': ['SQL', 'database', 'dataengineering'],
            'gcp': ['googlecloud', 'dataengineering', 'bigquery'],
            'salesforce': ['salesforce', 'salesforceadmins', 'SalesforceDeveloper', 'dataengineering'],
            'databricks': ['databricks', 'apachespark', 'dataengineering', 'bigdata']
        }
        
        # Official documentation URLs (EXPANDED with Salesforce & Databricks)
        self.official_docs = {
            'snowflake': {
                'engineering_blog': 'https://www.snowflake.com/en/engineering-blog/',
                'all_release_notes': 'https://docs.snowflake.com/release-notes/all-release-notes',
                'openflow': 'https://docs.snowflake.com/en/release-notes/openflow',
                'behavior_changes': 'https://docs.snowflake.com/en/release-notes/behavior-changes',
                'performance_improvements': 'https://docs.snowflake.com/en/release-notes/performance-improvements',
                'sql_improvements': 'https://docs.snowflake.com/en/release-notes/sql-improvements',
                'preview_features': 'https://docs.snowflake.com/en/release-notes/preview-features',
                'new_features': 'https://docs.snowflake.com/en/release-notes/new-features',
                'blog': 'https://www.snowflake.com/blog/'
            },
            'aws': {
                'whats_new': 'https://aws.amazon.com/new/',
                'data_blog': 'https://aws.amazon.com/blogs/big-data/'
            },
            'azure': {
                'updates': 'https://azure.microsoft.com/en-us/updates/',
                'data_blog': 'https://techcommunity.microsoft.com/t5/azure-data-blog/bg-p/AzureDataBlog'
            },
            'dbt': {
                'blog': 'https://www.getdbt.com/blog/',
                'changelog': 'https://docs.getdbt.com/docs/dbt-versions/core-upgrade'
            },
            'airflow': {
                'blog': 'https://airflow.apache.org/blog/',
                'releases': 'https://airflow.apache.org/docs/apache-airflow/stable/release_notes.html'
            },
            'python': {
                'whats_new': 'https://docs.python.org/3/whatsnew/',
                'pypi_trending': 'https://pypi.org/search/?o=-zscore'
            },
            'gcp': {
                'release_notes': 'https://cloud.google.com/release-notes',
                'blog': 'https://cloud.google.com/blog/products/data-analytics'
            },
            'salesforce': {
                'release_notes': 'https://help.salesforce.com/s/articleView?id=release-notes.salesforce_release_notes.htm',
                'developer_blog': 'https://developer.salesforce.com/blogs/',
                'success_blog': 'https://www.salesforce.com/blog/',
                'trailhead': 'https://trailhead.salesforce.com/en/today'
            },
            'databricks': {
                'blog': 'https://www.databricks.com/blog',
                'release_notes': 'https://docs.databricks.com/en/release-notes/index.html',
                'engineering_blog': 'https://www.databricks.com/blog/category/engineering'
            }
        }
        
        print("🚀 Enhanced Trend Monitor initialized with Official Docs support")
    
    def analyze_trends(self, limit: int = 10, category: str = None) -> List[Dict]:
        """Find REAL trending topics with optional category filter"""
        print(f"\n{'='*70}")
        print(f"🔍 Searching for {'ALL' if not category else category.upper()} trending topics")
        print(f"{'='*70}\n")
        
        all_signals = []
        
        if category and category.lower() in self.category_subreddits:
            # Category-specific search
            print(f"🎯 CATEGORY-SPECIFIC MODE: {category.upper()}")
            print(f"{'='*70}\n")
            
            # 1. Official Documentation (HIGHEST PRIORITY)
            print(f"📚 Scraping Official {category.upper()} Documentation...")
            official_signals = self._scrape_official_docs(category.lower())
            all_signals.extend(official_signals)
            print(f"   Found {len(official_signals)} official announcements/features\n")
            
            # 2. Reddit (Category-specific)
            print(f"🔴 Scraping {category.upper()}-specific Reddit posts...")
            reddit_signals = self._scrape_reddit_category(category.lower())
            all_signals.extend(reddit_signals)
            print(f"   Found {len(reddit_signals)} trending posts\n")
            
            # 3. Stack Overflow (Category tag)
            print(f"📚 Checking Stack Overflow [{category}] tag...")
            so_signals = self._scrape_stackoverflow_by_tag(category.lower())
            all_signals.extend(so_signals)
            print(f"   Found {len(so_signals)} hot questions\n")
            
            # 4. GitHub (Category topic)
            print(f"⭐ Scraping GitHub [{category}] trending repos...")
            github_signals = self._scrape_github_by_topic(category.lower())
            all_signals.extend(github_signals)
            print(f"   Found {len(github_signals)} trending repos\n")
            
            # 5. Dev.to (Category tag)
            print(f"✍️ Checking Dev.to [{category}] articles...")
            devto_signals = self._scrape_devto_by_tag(category.lower())
            all_signals.extend(devto_signals)
            print(f"   Found {len(devto_signals)} trending articles\n")
            
        else:
            # Generic search (original logic)
            print("🌐 GENERIC MODE: Scanning all sources")
            print(f"{'='*70}\n")
            
            print("Scraping Reddit...")
            reddit_signals = self._scrape_reddit()
            all_signals.extend(reddit_signals)
            print(f"   Found {len(reddit_signals)} trending posts from Reddit\n")
            
            print("Checking Hacker News...")
            hn_signals = self._scrape_hackernews()
            all_signals.extend(hn_signals)
            print(f"   Found {len(hn_signals)} hot topics from HN\n")
            
            print("Scraping GitHub Trending...")
            github_signals = self._scrape_github_trending()
            all_signals.extend(github_signals)
            print(f"   Found {len(github_signals)} trending repos\n")
            
            print("Checking Dev.to...")
            devto_signals = self._scrape_devto()
            all_signals.extend(devto_signals)
            print(f"   Found {len(devto_signals)} trending articles\n")
            
            print("Checking Stack Overflow...")
            so_signals = self._scrape_stackoverflow()
            all_signals.extend(so_signals)
            print(f"   Found {len(so_signals)} hot questions\n")
        
        print(f"{'='*70}")
        print(f"📊 Total signals collected: {len(all_signals)}")
        print(f"{'='*70}\n")
        
        if len(all_signals) == 0:
            print("⚠️ No signals found, using fallback topics")
            return self._get_emergency_fallback(limit, category)
        
        # Analyze with AI
        print("🤖 Analyzing signals with Gemini AI...\n")
        trending_topics = self._analyze_with_gemini(all_signals, limit, category)
        
        return trending_topics
    
    # ==================== OFFICIAL DOCS SCRAPING ====================
    
    def _scrape_official_docs(self, category: str) -> List[Dict]:
        """Scrape official documentation for latest features/announcements"""
        signals = []
        
        if category not in self.official_docs:
            return signals
        
        docs_urls = self.official_docs[category]
        
        for doc_type, url in docs_urls.items():
            try:
                print(f"   • Checking {doc_type}: {url[:60]}...")
                
                if category == 'snowflake':
                    if 'release-notes' in url or 'docs.snowflake.com' in url:
                        signals.extend(self._scrape_snowflake_docs(url, doc_type))
                    elif 'blog' in url:
                        signals.extend(self._scrape_snowflake_blog(url))
                
                elif category == 'aws':
                    if 'whats-new' in url:
                        signals.extend(self._scrape_aws_whats_new(url))
                    elif 'blogs' in url:
                        signals.extend(self._scrape_aws_blog(url))
                
                elif category == 'azure':
                    if 'updates' in url:
                        signals.extend(self._scrape_azure_updates(url))
                
                elif category == 'dbt':
                    if 'blog' in url:
                        signals.extend(self._scrape_dbt_blog(url))
                
                elif category == 'gcp':
                    if 'blog' in url:
                        signals.extend(self._scrape_gcp_blog(url))
                
                elif category == 'salesforce':
                    if 'release-notes' in url:
                        signals.extend(self._scrape_salesforce_release_notes(url))
                    elif 'blog' in url:
                        signals.extend(self._scrape_salesforce_blog(url))
                
                elif category == 'databricks':
                    if 'release-notes' in url or 'release_notes' in url:
                        signals.extend(self._scrape_databricks_release_notes(url))
                    elif 'blog' in url:
                        signals.extend(self._scrape_databricks_blog(url))
                
                time.sleep(2)  # Be respectful
                
            except Exception as e:
                print(f"      ⚠️ Error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_snowflake_docs(self, url: str, doc_type: str) -> List[Dict]:
        """Scrape Snowflake official documentation"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                features = soup.find_all(['h2', 'h3', 'h4', 'div'], limit=15)
                
                for feature in features:
                    title = feature.get_text().strip()
                    
                    if title and len(title) > 10 and not any(x in title.lower() for x in ['navigation', 'menu', 'search', 'table of contents', 'skip to', 'feedback']):
                        
                        next_p = feature.find_next('p')
                        description = next_p.get_text().strip()[:200] if next_p else ''
                        
                        score_map = {
                            'engineering_blog': 250,
                            'openflow': 240,
                            'all_release_notes': 230,
                            'new_features': 220,
                            'performance_improvements': 210,
                            'sql_improvements': 210,
                            'behavior_changes': 200,
                            'preview_features': 220,
                            'blog': 180
                        }
                        
                        score = score_map.get(doc_type, 200)
                        
                        signals.append({
                            'source': f'snowflake_official/{doc_type}',
                            'title': f"Snowflake: {title}",
                            'description': description,
                            'score': score,
                            'engagement': score,
                            'url': url,
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'snowflake',
                            'type': 'official_doc'
                        })
        except Exception as e:
            print(f"      Error scraping Snowflake docs: {str(e)[:50]}")
        
        return signals[:8]
    
    def _scrape_snowflake_blog(self, url: str) -> List[Dict]:
        """Scrape Snowflake official blog"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                articles = soup.find_all('article', limit=8) or soup.find_all('div', class_='post', limit=8)
                
                for article in articles:
                    title_elem = article.find(['h2', 'h3', 'a'])
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = article.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        if post_url.startswith('/'):
                            post_url = f"https://www.snowflake.com{post_url}"
                        
                        signals.append({
                            'source': 'snowflake_official/blog',
                            'title': title,
                            'score': 150,
                            'engagement': 150,
                            'url': post_url,
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'snowflake',
                            'type': 'official_blog'
                        })
        except Exception as e:
            print(f"      Error scraping Snowflake blog: {str(e)[:50]}")
        
        return signals
    
    def _scrape_aws_whats_new(self, url: str) -> List[Dict]:
        """Scrape AWS What's New"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                items = soup.find_all('div', class_='lb-txt-normal', limit=10)
                
                for item in items:
                    title_elem = item.find('h2') or item.find('h3')
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = item.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        if 'data' in title.lower() or 'analytics' in title.lower() or 'redshift' in title.lower() or 'glue' in title.lower():
                            signals.append({
                                'source': 'aws_official/whats_new',
                                'title': f"AWS Announcement: {title}",
                                'score': 180,
                                'engagement': 180,
                                'url': post_url if post_url.startswith('http') else f"https://aws.amazon.com{post_url}",
                                'created': time.time(),
                                'age_hours': 1,
                                'category': 'aws',
                                'type': 'official_announcement'
                            })
        except Exception as e:
            print(f"      Error scraping AWS: {str(e)[:50]}")
        
        return signals[:5]
    
    def _scrape_aws_blog(self, url: str) -> List[Dict]:
        """Scrape AWS Big Data Blog"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                articles = soup.find_all('article', limit=5)
                
                for article in articles:
                    title_elem = article.find('h2') or article.find('h3')
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = article.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        signals.append({
                            'source': 'aws_official/blog',
                            'title': title,
                            'score': 150,
                            'engagement': 150,
                            'url': post_url if post_url.startswith('http') else f"https://aws.amazon.com{post_url}",
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'aws',
                            'type': 'official_blog'
                        })
        except Exception as e:
            print(f"      Error scraping AWS blog: {str(e)[:50]}")
        
        return signals
    
    def _scrape_azure_updates(self, url: str) -> List[Dict]:
        """Scrape Azure Updates"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                updates = soup.find_all('div', class_='update', limit=10)
                
                for update in updates:
                    title_elem = update.find('h3') or update.find('h2')
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = update.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        if 'data' in title.lower() or 'synapse' in title.lower() or 'factory' in title.lower():
                            signals.append({
                                'source': 'azure_official/updates',
                                'title': f"Azure Update: {title}",
                                'score': 170,
                                'engagement': 170,
                                'url': post_url if post_url.startswith('http') else f"https://azure.microsoft.com{post_url}",
                                'created': time.time(),
                                'age_hours': 1,
                                'category': 'azure',
                                'type': 'official_update'
                            })
        except Exception as e:
            print(f"      Error scraping Azure: {str(e)[:50]}")
        
        return signals[:5]
    
    def _scrape_dbt_blog(self, url: str) -> List[Dict]:
        """Scrape dbt blog"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                posts = soup.find_all('article', limit=5) or soup.find_all('div', class_='post', limit=5)
                
                for post in posts:
                    title_elem = post.find(['h2', 'h3'])
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = post.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        signals.append({
                            'source': 'dbt_official/blog',
                            'title': title,
                            'score': 140,
                            'engagement': 140,
                            'url': post_url if post_url.startswith('http') else f"https://www.getdbt.com{post_url}",
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'dbt',
                            'type': 'official_blog'
                        })
        except Exception as e:
            print(f"      Error scraping dbt blog: {str(e)[:50]}")
        
        return signals
    
    def _scrape_gcp_blog(self, url: str) -> List[Dict]:
        """Scrape GCP Data Analytics Blog"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                articles = soup.find_all('article', limit=5)
                
                for article in articles:
                    title_elem = article.find('h2') or article.find('h3')
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = article.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        signals.append({
                            'source': 'gcp_official/blog',
                            'title': title,
                            'score': 145,
                            'engagement': 145,
                            'url': post_url if post_url.startswith('http') else f"https://cloud.google.com{post_url}",
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'gcp',
                            'type': 'official_blog'
                        })
        except Exception as e:
            print(f"      Error scraping GCP blog: {str(e)[:50]}")
        
        return signals
    
    def _scrape_salesforce_blog(self, url: str) -> List[Dict]:
        """Scrape Salesforce official blogs"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                articles = soup.find_all('article', limit=8) or soup.find_all('div', class_='post', limit=8)
                
                for article in articles:
                    title_elem = article.find(['h2', 'h3', 'a'])
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = article.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        if post_url.startswith('/'):
                            base_url = 'https://developer.salesforce.com' if 'developer' in url else 'https://www.salesforce.com'
                            post_url = f"{base_url}{post_url}"
                        
                        signals.append({
                            'source': 'salesforce_official/blog',
                            'title': f"Salesforce: {title}",
                            'score': 150,
                            'engagement': 150,
                            'url': post_url,
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'salesforce',
                            'type': 'official_blog'
                        })
        except Exception as e:
            print(f"      Error scraping Salesforce blog: {str(e)[:50]}")
        
        return signals[:5]
    
    def _scrape_salesforce_release_notes(self, url: str) -> List[Dict]:
        """Scrape Salesforce release notes"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                items = soup.find_all(['h2', 'h3', 'div'], class_=['feature', 'release'], limit=10)
                
                for item in items:
                    title = item.get_text().strip()
                    
                    if title and len(title) > 10 and not any(x in title.lower() for x in ['navigation', 'menu', 'search']):
                        signals.append({
                            'source': 'salesforce_official/release_notes',
                            'title': f"Salesforce Release: {title}",
                            'score': 180,
                            'engagement': 180,
                            'url': url,
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'salesforce',
                            'type': 'official_release'
                        })
        except Exception as e:
            print(f"      Error scraping Salesforce release notes: {str(e)[:50]}")
        
        return signals[:5]
    
    def _scrape_databricks_blog(self, url: str) -> List[Dict]:
        """Scrape Databricks official blog"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                articles = soup.find_all('article', limit=8) or soup.find_all('div', class_='post-item', limit=8)
                
                for article in articles:
                    title_elem = article.find(['h2', 'h3', 'h4', 'a'])
                    if title_elem:
                        title = title_elem.get_text().strip()
                        link = article.find('a')
                        post_url = link.get('href', url) if link else url
                        
                        if post_url.startswith('/'):
                            post_url = f"https://www.databricks.com{post_url}"
                        
                        signals.append({
                            'source': 'databricks_official/blog',
                            'title': title,
                            'score': 160,
                            'engagement': 160,
                            'url': post_url,
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'databricks',
                            'type': 'official_blog'
                        })
        except Exception as e:
            print(f"      Error scraping Databricks blog: {str(e)[:50]}")
        
        return signals[:5]
    
    def _scrape_databricks_release_notes(self, url: str) -> List[Dict]:
        """Scrape Databricks release notes"""
        signals = []
        try:
            response = self.session.get(url, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                
                releases = soup.find_all(['h2', 'h3', 'div'], limit=10)
                
                for release in releases:
                    title = release.get_text().strip()
                    
                    if title and len(title) > 10 and not any(x in title.lower() for x in ['navigation', 'menu', 'search', 'table of contents']):
                        
                        link = release.find('a')
                        release_url = link.get('href', url) if link else url
                        if release_url.startswith('/'):
                            release_url = f"https://docs.databricks.com{release_url}"
                        
                        signals.append({
                            'source': 'databricks_official/release_notes',
                            'title': f"Databricks Release: {title}",
                            'score': 170,
                            'engagement': 170,
                            'url': release_url,
                            'created': time.time(),
                            'age_hours': 1,
                            'category': 'databricks',
                            'type': 'official_release'
                        })
        except Exception as e:
            print(f"      Error scraping Databricks release notes: {str(e)[:50]}")
        
        return signals[:5]
    
    # ==================== CATEGORY-SPECIFIC SCRAPING ====================
    
    def _scrape_reddit_category(self, category: str) -> List[Dict]:
        """Scrape Reddit for specific category"""
        signals = []
        subreddits = self.category_subreddits.get(category, ['dataengineering'])
        
        for subreddit in subreddits:
            try:
                search_url = f"https://www.reddit.com/r/{subreddit}/search.json?q={category}&restrict_sr=1&sort=hot&t=week&limit=10"
                response = self.session.get(search_url, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for post in data['data']['children']:
                        p = post['data']
                        engagement = p['score'] + (p['num_comments'] * 2)
                        
                        if engagement > 20:
                            signals.append({
                                'source': f'reddit/r/{subreddit}',
                                'title': p['title'],
                                'score': p['score'],
                                'comments': p['num_comments'],
                                'engagement': engagement,
                                'url': f"https://reddit.com{p['permalink']}",
                                'created': p['created_utc'],
                                'age_hours': (time.time() - p['created_utc']) / 3600,
                                'category': category
                            })
                
                time.sleep(1)
            except Exception as e:
                print(f"      ⚠️ Reddit/{subreddit} error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_github_by_topic(self, topic: str) -> List[Dict]:
        """Search GitHub trending by specific topic"""
        signals = []
        
        try:
            url = f"https://github.com/topics/{topic}?o=desc&s=stars"
            response = self.session.get(url, timeout=15)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'lxml')
                articles = soup.find_all('article', limit=5)
                
                for article in articles:
                    try:
                        h3 = article.find('h3')
                        if not h3:
                            continue
                        
                        repo_link = h3.find('a')
                        repo_name = repo_link.get('href', '').strip('/') if repo_link else ''
                        
                        desc_elem = article.find('p')
                        description = desc_elem.text.strip() if desc_elem else ''
                        
                        signals.append({
                            'source': f'github/topic/{topic}',
                            'title': f"{repo_name}: {description[:100]}",
                            'score': 100,
                            'engagement': 100,
                            'url': f"https://github.com/{repo_name}",
                            'created': time.time(),
                            'age_hours': 1,
                            'category': topic
                        })
                    except:
                        continue
        
        except Exception as e:
            print(f"      ⚠️ GitHub/{topic} error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_stackoverflow_by_tag(self, tag: str) -> List[Dict]:
        """Search Stack Overflow for specific tag"""
        signals = []
        
        try:
            url = f"https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&tagged={tag}&site=stackoverflow"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                for q in data.get('items', [])[:8]:
                    engagement = q.get('score', 0) + q.get('answer_count', 0) * 5
                    
                    if engagement > 3:
                        signals.append({
                            'source': f'stackoverflow/{tag}',
                            'title': q.get('title', ''),
                            'score': q.get('score', 0),
                            'comments': q.get('answer_count', 0),
                            'engagement': engagement,
                            'url': q.get('link', ''),
                            'created': q.get('creation_date', time.time()),
                            'age_hours': (time.time() - q.get('creation_date', time.time())) / 3600,
                            'category': tag
                        })
            
            time.sleep(2)
        
        except Exception as e:
            print(f"      ⚠️ StackOverflow/{tag} error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_devto_by_tag(self, tag: str) -> List[Dict]:
        """Search Dev.to for specific tag"""
        signals = []
        
        try:
            url = f"https://dev.to/api/articles?tag={tag}&top=7"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                articles = response.json()
                
                for article in articles[:5]:
                    engagement = article.get('positive_reactions_count', 0) + (article.get('comments_count', 0) * 3)
                    
                    if engagement > 10:
                        signals.append({
                            'source': f'devto/tag/{tag}',
                            'title': article['title'],
                            'score': article.get('positive_reactions_count', 0),
                            'comments': article.get('comments_count', 0),
                            'engagement': engagement,
                            'url': article['url'],
                            'created': datetime.fromisoformat(article['published_at'].replace('Z', '+00:00')).timestamp(),
                            'age_hours': 24,
                            'category': tag
                        })
        
        except Exception as e:
            print(f"      ⚠️ Dev.to/{tag} error: {str(e)[:50]}")
        
        return signals
    
    # ==================== GENERIC SCRAPING ====================
    
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
                        engagement = p['score'] + (p['num_comments'] * 2)
                        
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
                
                time.sleep(1)
                
            except Exception as e:
                print(f"   Reddit/{subreddit} error: {str(e)[:50]}")
        
        return signals
    
    def _scrape_hackernews(self) -> List[Dict]:
        """Scrape Hacker News using FREE official API"""
        signals = []

        try:
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
        """Scrape GitHub Trending"""
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
                            h2 = article.find('h2')
                            if not h2:
                                continue
                            
                            repo_link = h2.find('a')
                            repo_name = repo_link.get('href', '').strip('/') if repo_link else ''
                            
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
    
    # ==================== AI ANALYSIS ====================
    
    def _analyze_with_gemini(self, signals: List[Dict], limit: int, category: str = None) -> List[Dict]:
        """Analyze signals using FREE Gemini"""
        
        cutoff = time.time() - (7 * 24 * 60 * 60)
        recent = [s for s in signals if s.get('created', 0) > cutoff]
        
        recent.sort(key=lambda x: (
            x.get('type', '') == 'official_doc' and 300 or
            x.get('type', '') == 'official_announcement' and 250 or
            x.get('type', '') == 'official_blog' and 200 or
            x.get('engagement', 0)
        ), reverse=True)
        
        top_signals = recent[:80]
        
        signal_list = []
        for s in top_signals:
            signal_list.append({
                'source': s['source'],
                'title': s['title'][:150],
                'engagement': s['engagement'],
                'age_hours': round(s.get('age_hours', 24), 1),
                'type': s.get('type', 'community')
            })
        
        category_context = f" in the {category.upper()} category" if category else ""
        
        prompt = f"""You are analyzing REAL trending signals{category_context} from multiple sources including OFFICIAL DOCUMENTATION, Reddit, Hacker News, GitHub, Dev.to, and Stack Overflow.

REAL SIGNALS (collected in the last hour):
{json.dumps(signal_list, indent=2)}

IMPORTANT: Signals marked as 'official_doc', 'official_announcement', or 'official_blog' are from OFFICIAL sources and should be given HIGHEST priority as they represent actual new features/updates.

TASK: Identify the top {limit} topics that would make EXCELLENT blog posts for data engineers in 2025{category_context}.

REQUIREMENTS:
1. Base recommendations ONLY on the signals above (DO NOT invent trends)
2. PRIORITIZE official documentation signals - these are confirmed new features
3. Look for patterns - multiple signals about the same topic = strong trend
4. Prioritize topics with high engagement and recency
5. Focus on practical, tutorial-worthy topics
6. For official features, suggest "How to use..." or "Getting started with..." angles

For each topic, provide:
- title: Compelling blog title (include "2025" or "Complete Guide" or "Tutorial")
- category: {category if category else 'snowflake/aws/python/kafka/dbt/sql/airflow/spark/general'}
- keywords: 5-7 SEO keywords
- trend_score: 1-10 (official docs should score 9-10)
- why_trending: Explain using actual signals (mention if from official docs)
- evidence: List specific sources with counts
- target_audience: beginner/intermediate/advanced data engineers
- content_type: tutorial/guide/comparison/best-practices/feature-announcement
- level: beginner/intermediate/advanced
- signal_sources: Array of source names
- is_official: true if based on official documentation

Return as JSON array ONLY (no markdown, no code blocks):
[
  {{
    "title": "Complete Guide to [Feature] in {category.upper() if category else 'Technology'} 2025",
    "category": "{category or 'general'}",
    "keywords": ["keyword1", "keyword2"],
    "trend_score": 9,
    "why_trending": "Official announcement from [source]...",
    "evidence": "Official docs: 1 feature, Reddit: 3 posts, GitHub: 2 repos",
    "target_audience": "intermediate data engineers",
    "content_type": "tutorial",
    "level": "intermediate",
    "signal_sources": ["snowflake_official/release_notes", "reddit/r/snowflake"],
    "is_official": true
  }}
]"""

        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0].strip()
            elif '```' in text:
                text = text.split('```')[1].split('```')[0].strip()
            
            text = text.strip()
            if not text.startswith('['):
                start = text.find('[')
                end = text.rfind(']') + 1
                if start != -1 and end > start:
                    text = text[start:end]
            
            topics = json.loads(text)
            
            for topic in topics:
                topic['analyzed_at'] = datetime.now().isoformat()
                topic['total_signals_analyzed'] = len(signals)
                topic['category_filter'] = category or 'all'
            
            return topics[:limit]
        
        except Exception as e:
            print(f"❌ Gemini analysis failed: {e}")
            print(f"Response text: {text[:500] if 'text' in locals() else 'No response'}")
            return self._manual_analysis(top_signals, limit, category)
    
    def _manual_analysis(self, signals: List[Dict], limit: int, category: str = None) -> List[Dict]:
        """Fallback: Manual topic extraction"""
        print("⚠️ Using manual analysis fallback...")
        
        topics = []
        for i, signal in enumerate(signals[:limit], 1):
            topics.append({
                'title': signal['title'][:80],
                'category': category or signal.get('category', 'general'),
                'keywords': signal['title'].lower().split()[:5],
                'trend_score': min(10, signal['engagement'] // 20),
                'why_trending': f"High engagement on {signal['source']}",
                'evidence': f"{signal['source']}: {signal['engagement']} points",
                'target_audience': 'data engineers',
                'content_type': 'guide',
                'level': 'intermediate',
                'source_url': signal.get('url', ''),
                'is_official': signal.get('type', '').startswith('official')
            })
        
        return topics
    
    def _get_emergency_fallback(self, limit: int, category: str = None) -> List[Dict]:
        """Emergency fallback if all scraping fails"""
        print("🆘 Using emergency fallback topics...")
        
        fallback_topics = {
            'snowflake': [
                {
                    "title": "Complete Guide to Snowflake Dynamic Tables 2025",
                    "category": "snowflake",
                    "keywords": ["snowflake", "dynamic tables", "materialized views"],
                    "trend_score": 8,
                    "why_trending": "New feature announcement",
                    "evidence": "Snowflake official docs",
                    "content_type": "tutorial",
                    "level": "intermediate"
                }
            ],
            'aws': [
                {
                    "title": "AWS Glue vs Apache Spark: Complete Comparison 2025",
                    "category": "aws",
                    "keywords": ["aws glue", "apache spark", "etl"],
                    "trend_score": 7,
                    "why_trending": "Popular comparison topic",
                    "evidence": "Community discussion",
                    "content_type": "comparison",
                    "level": "intermediate"
                }
            ],
            'dbt': [
                {
                    "title": "dbt Semantic Layer: Getting Started Guide 2025",
                    "category": "dbt",
                    "keywords": ["dbt", "semantic layer", "metrics"],
                    "trend_score": 8,
                    "why_trending": "New dbt feature",
                    "evidence": "dbt official blog",
                    "content_type": "tutorial",
                    "level": "intermediate"
                }
            ],
            'salesforce': [
                {
                    "title": "Salesforce Data Cloud: Complete Integration Guide 2025",
                    "category": "salesforce",
                    "keywords": ["salesforce", "data cloud", "integration", "cdp"],
                    "trend_score": 8,
                    "why_trending": "New Salesforce data platform",
                    "evidence": "Salesforce release notes",
                    "content_type": "tutorial",
                    "level": "intermediate"
                }
            ],
            'databricks': [
                {
                    "title": "Databricks Unity Catalog: Best Practices Guide 2025",
                    "category": "databricks",
                    "keywords": ["databricks", "unity catalog", "data governance"],
                    "trend_score": 8,
                    "why_trending": "Key governance feature",
                    "evidence": "Databricks official blog",
                    "content_type": "best-practices",
                    "level": "intermediate"
                }
            ]
        }
        
        if category and category in fallback_topics:
            return fallback_topics[category][:limit]
        
        return [
            {
                "title": "Complete Guide to Modern Data Engineering Stack 2025",
                "category": "general",
                "keywords": ["data engineering", "tech stack", "best practices"],
                "trend_score": 7,
                "why_trending": "Evergreen topic",
                "evidence": "General interest",
                "content_type": "guide",
                "level": "intermediate"
            }
        ][:limit]


def main():
    """Enhanced main function with category support via command-line arguments"""
    
    load_dotenv()
    
    parser = argparse.ArgumentParser(
        description='Real-Time Trend Monitor for Data Engineering Topics',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python trend_monitor_realtime.py --category snowflake
  python trend_monitor_realtime.py --category databricks --limit 5
  python trend_monitor_realtime.py --category salesforce --output sf_trends.json
  python trend_monitor_realtime.py  # All categories (generic)
  
Supported Categories:
  snowflake   - Snowflake Data Warehouse
  aws         - Amazon Web Services
  azure       - Microsoft Azure
  dbt         - dbt (data build tool)
  airflow     - Apache Airflow
  python      - Python Programming
  sql         - SQL & Databases
  gcp         - Google Cloud Platform
  salesforce  - Salesforce Platform & Data Cloud
  databricks  - Databricks Lakehouse Platform
  all         - All Data Engineering Topics (generic)
        """
    )
    
    parser.add_argument(
        '--category', '-c',
        type=str,
        choices=['snowflake', 'aws', 'azure', 'dbt', 'airflow', 'python', 'sql', 'gcp', 'salesforce', 'databricks', 'all'],
        default=None,
        help='Technology category to focus on (default: all categories)'
    )
    
    parser.add_argument(
        '--limit', '-l',
        type=int,
        default=10,
        help='Number of trending topics to return (default: 10)'
    )
    
    parser.add_argument(
        '--output', '-o',
        type=str,
        default=None,
        help='Output JSON file name (default: trending_topics_<category>.json)'
    )
    
    args = parser.parse_args()
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found!")
        print("\nGet FREE API key at: https://ai.google.dev/")
        print("Add to .env file: GEMINI_API_KEY=your_key_here")
        return
    
    monitor = EnhancedTrendMonitor(api_key)
    
    print("\n" + "="*70)
    print("🚀 ENHANCED TREND MONITOR WITH OFFICIAL DOCS")
    print("="*70)
    
    category = args.category if args.category != 'all' else None
    category_display = args.category.upper() if args.category else "ALL CATEGORIES"
    
    print(f"\n📊 Analyzing: {category_display}")
    print(f"📈 Limit: {args.limit} topics")
    print("="*70)
    
    topics = monitor.analyze_trends(limit=args.limit, category=category)
    
    print("\n" + "="*70)
    print(f"✅ FOUND {len(topics)} TRENDING TOPICS")
    print("="*70 + "\n")
    
    for i, topic in enumerate(topics, 1):
        print(f"{i}. {topic['title']}")
        print(f"   📊 Trend Score: {topic['trend_score']}/10")
        print(f"   🎯 Category: {topic['category']}")
        print(f"   📝 Type: {topic['content_type']} | Level: {topic['level']}")
        
        if topic.get('is_official'):
            print(f"   ⭐ OFFICIAL SOURCE - High Priority!")
        
        print(f"   💡 Why Trending: {topic['why_trending'][:100]}...")
        print(f"   📈 Evidence: {topic['evidence'][:80]}...")
        print(f"   🔑 Keywords: {', '.join(topic['keywords'][:5])}")
        print(f"   👥 Audience: {topic['target_audience']}")
        print()
    
    output = {
        'analyzed_at': datetime.now().isoformat(),
        'category_filter': args.category or 'all',
        'method': 'Enhanced with Official Documentation',
        'cost': '$0.00 (100% FREE)',
        'topics': topics,
        'sources_used': [
            'Official Documentation (Multiple sources)',
            'Reddit (category-specific)',
            'GitHub (topics)',
            'Stack Overflow (tags)',
            'Dev.to (tags)',
            'Hacker News'
        ]
    }
    
    if args.output:
        output_file = args.output
    else:
        category_suffix = f"_{args.category}" if args.category else ""
        output_file = f'trending_topics{category_suffix}.json'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print("="*70)
    print(f"💾 Results saved to: {output_file}")
    print("💰 Total cost: $0.00 (100% FREE!)")
    print("="*70)
    
    if topics:
        print("\n" + "="*70)
        print("💡 TOP BLOG POST IDEAS")
        print("="*70 + "\n")
        
        for i, topic in enumerate(topics[:3], 1):
            print(f"🎯 IDEA #{i}: {topic['title']}")
            print(f"   Suggested Structure:")
            print(f"   1. Introduction - What is {topic['keywords'][0]}?")
            print(f"   2. Why it matters in 2025")
            print(f"   3. Step-by-step tutorial/guide")
            print(f"   4. Best practices & tips")
            print(f"   5. Common pitfalls to avoid")
            print(f"   6. Conclusion & next steps")
            print()


if __name__ == "__main__":
    main()
