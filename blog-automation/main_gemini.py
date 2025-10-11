#!/usr/bin/env python3
"""
Main Orchestrator (GEMINI-ONLY VERSION)
Uses ONLY Google Gemini API - NO Anthropic needed!
Complete Blog Automation Pipeline
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Import our FREE modules
from trend_monitor_free import TrendMonitorFree
from blog_generator_free import BlogGeneratorFree
from wordpress_publisher import WordPressPublisher

# Optional: Import image generator if you want images
# from image_generator_free import ImageGeneratorFree

class BlogAutomationPipelineGemini:
    def __init__(self, config: dict):
        """Initialize pipeline with ONLY Gemini API"""
        self.config = config
        
        print("🚀 Initializing Blog Automation Pipeline (Gemini-Only)...\n")
        print("✅ Using Google Gemini API (NO Anthropic needed!)")
        
        # Initialize components - ALL using Gemini!
        self.trend_monitor = TrendMonitorFree(config['gemini_api_key'])
        self.blog_generator = BlogGeneratorFree(config['gemini_api_key'])
        
        # WordPress publisher
        self.wordpress_publisher = WordPressPublisher(
            config['wordpress_url'],
            config['wordpress_user'],
            config['wordpress_app_password']
        )
        
        # Optional: Image generator
        self.use_images = config.get('use_images', False)
        if self.use_images:
            try:
                from image_generator_free import ImageGeneratorFree
                self.image_generator = ImageGeneratorFree()
                print("✅ Image generation enabled (Hugging Face)")
            except ImportError:
                print("⚠️  Image generator not available, will skip images")
                self.use_images = False
        
        # Create output directory
        self.output_dir = Path(config.get('output_dir', 'blog_outputs'))
        self.output_dir.mkdir(exist_ok=True)
        
        print("✅ All components initialized!\n")
    
    def run_full_pipeline(
        self, 
        num_posts: int = 1,
        publish_status: str = 'draft',
        specific_topics: list = None
    ) -> list:
        """Run the complete automation pipeline"""
        print("="*70)
        print("BLOG AUTOMATION PIPELINE (GEMINI-ONLY)")
        print("="*70)
        print(f"📊 Posts to generate: {num_posts}")
        print(f"📝 Publish status: {publish_status}")
        print(f"💰 API Cost: FREE (using Gemini)")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        results = []
        
        try:
            # Step 1: Identify trending topics
            if specific_topics:
                topics = specific_topics
                print(f"📌 Using {len(topics)} specific topics\n")
            else:
                print("🔍 STEP 1: Analyzing trending topics (using Gemini)...")
                topics = self.trend_monitor.analyze_trends(limit=num_posts * 2)
                print(f"✅ Found {len(topics)} trending topics\n")
                
                # Display top topics
                print("📋 Top Trending Topics:")
                for i, topic in enumerate(topics[:min(10, len(topics))], 1):
                    print(f"   {i}. {topic['title']} (Score: {topic.get('trend_score', 'N/A')})")
                print()
            
            # Select top N topics
            selected_topics = topics[:num_posts]
            
            # Step 2-4: Process each topic
            for idx, topic in enumerate(selected_topics, 1):
                print("\n" + "="*70)
                print(f"PROCESSING POST {idx}/{num_posts}: {topic['title']}")
                print("="*70 + "\n")
                
                try:
                    result = self._process_single_post(topic, publish_status, idx)
                    results.append(result)
                    
                    # Save intermediate results
                    self._save_results(results)
                    
                except Exception as e:
                    print(f"\n❌ Error processing post {idx}: {str(e)}")
                    results.append({
                        'success': False,
                        'topic': topic['title'],
                        'error': str(e)
                    })
            
            # Final summary
            self._print_summary(results)
            
        except KeyboardInterrupt:
            print("\n\n⚠️  Pipeline interrupted by user")
            self._print_summary(results)
        
        except Exception as e:
            print(f"\n❌ Pipeline error: {str(e)}")
            import traceback
            traceback.print_exc()
        
        return results
    
    def _process_single_post(self, topic: dict, publish_status: str, post_num: int) -> dict:
        """Process a single blog post"""
        
        start_time = datetime.now()
        post_dir = self.output_dir / f"post_{post_num}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        post_dir.mkdir(exist_ok=True)
        
        # Step 2: Generate blog content (using Gemini)
        print("📝 STEP 2: Generating blog content (Gemini)...")
        blog_data = self.blog_generator.generate_blog_post(topic)
        
        # Save raw blog data
        with open(post_dir / 'blog_data.json', 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Content generated: {blog_data['metadata']['word_count']} words")
        print(f"   Reading time: {blog_data['metadata']['reading_time']} minutes")
        print(f"   Focus keyword: {blog_data['seo']['focus_keyword']}")
        print(f"   Cost: {blog_data['metadata']['cost']}\n")
        
        # Step 3: Handle images
        generated_images = []
        if self.use_images:
            print("🎨 STEP 3: Generating images...")
            image_dir = post_dir / 'images'
            image_dir.mkdir(exist_ok=True)
            
            try:
                generated_images = self.image_generator.generate_images(
                    blog_data['images'],
                    output_dir=str(image_dir)
                )
                successful = [img for img in generated_images if img.get('generated')]
                print(f"✅ Images generated: {len(successful)}/{len(blog_data['images'])}\n")
            except Exception as e:
                print(f"⚠️  Image generation skipped: {e}\n")
        else:
            print("ℹ️  STEP 3: Skipping images (disabled)\n")
        
        # Step 4: Publish to WordPress
        print("📤 STEP 4: Publishing to WordPress...")
        publish_result = self.wordpress_publisher.publish_blog_post(
            blog_data,
            generated_images,
            status=publish_status
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Compile result
        result = {
            'success': publish_result.get('success', False),
            'post_number': post_num,
            'topic': topic['title'],
            'category': topic.get('category', 'unknown'),
            'blog_data': {
                'title': blog_data['title'],
                'word_count': blog_data['metadata']['word_count'],
                'reading_time': blog_data['metadata']['reading_time'],
                'focus_keyword': blog_data['seo']['focus_keyword']
            },
            'images': {
                'total': len(blog_data['images']),
                'successful': len([img for img in generated_images if img.get('generated')])
            },
            'wordpress': publish_result,
            'output_directory': str(post_dir),
            'duration_seconds': duration,
            'timestamp': datetime.now().isoformat(),
            'api_used': 'Google Gemini',
            'cost': '$0.00 (FREE)'
        }
        
        # Save result
        with open(post_dir / 'result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        if result['success']:
            print(f"\n✅ POST {post_num} COMPLETED in {duration:.1f}s")
            print(f"   View: {publish_result['post_url']}")
            print(f"   Edit: {publish_result['edit_url']}")
            print(f"   💰 Cost: $0.00 (FREE with Gemini!)")
        else:
            print(f"\n❌ POST {post_num} FAILED")
            print(f"   Error: {publish_result.get('error', 'Unknown')}")
        
        return result
    
    def _save_results(self, results: list):
        """Save pipeline results"""
        results_file = self.output_dir / 'pipeline_results.json'
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
    
    def _print_summary(self, results: list):
        """Print final summary"""
        print("\n\n" + "="*70)
        print("PIPELINE SUMMARY")
        print("="*70)
        
        successful = [r for r in results if r.get('success')]
        failed = [r for r in results if not r.get('success')]
        
        print(f"\n✅ Successful: {len(successful)}")
        print(f"❌ Failed: {len(failed)}")
        print(f"📊 Total: {len(results)}")
        print(f"💰 Total Cost: $0.00 (FREE with Gemini!)")
        
        if successful:
            print("\n✅ SUCCESSFUL POSTS:")
            for r in successful:
                print(f"\n   • {r['topic']}")
                print(f"     URL: {r['wordpress']['post_url']}")
                print(f"     Words: {r['blog_data']['word_count']}")
                print(f"     Duration: {r['duration_seconds']:.1f}s")
        
        if failed:
            print("\n❌ FAILED POSTS:")
            for r in failed:
                print(f"\n   • {r['topic']}")
                print(f"     Error: {r.get('error', 'Unknown')}")
        
        print(f"\n📁 Results saved to: {self.output_dir}/pipeline_results.json")
        print("="*70 + "\n")


def load_config() -> dict:
    """Load configuration"""
    load_dotenv()
    
    # Only need Gemini API key!
    gemini_key = os.getenv('GEMINI_API_KEY')
    
    if not gemini_key:
        print("❌ Missing GEMINI_API_KEY!")
        print("\nGet FREE API key:")
        print("1. Visit: https://ai.google.dev/")
        print("2. Click 'Get API key'")
        print("3. Add to .env: GEMINI_API_KEY=your_key")
        sys.exit(1)
    
    # WordPress credentials
    wp_url = os.getenv('WORDPRESS_URL')
    wp_user = os.getenv('WORDPRESS_USER')
    wp_pass = os.getenv('WORDPRESS_APP_PASSWORD')
    
    if not all([wp_url, wp_user, wp_pass]):
        print("❌ Missing WordPress credentials!")
        print("\nRequired in .env:")
        print("- WORDPRESS_URL")
        print("- WORDPRESS_USER")
        print("- WORDPRESS_APP_PASSWORD")
        sys.exit(1)
    
    return {
        'gemini_api_key': gemini_key,
        'wordpress_url': wp_url,
        'wordpress_user': wp_user,
        'wordpress_app_password': wp_pass,
        'use_images': os.getenv('USE_IMAGES', 'false').lower() == 'true',
        'output_dir': os.getenv('OUTPUT_DIR', 'blog_outputs')
    }


def main():
    parser = argparse.ArgumentParser(
        description='AI Blog Automation (Gemini-Only Version)'
    )
    parser.add_argument(
        '--posts', 
        type=int, 
        default=1,
        help='Number of posts to generate (default: 1)'
    )
    parser.add_argument(
        '--status',
        choices=['draft', 'publish'],
        default='draft',
        help='WordPress post status (default: draft)'
    )
    parser.add_argument(
        '--topics',
        nargs='+',
        help='Specific topics to write about'
    )
    parser.add_argument(
        '--category',
        help='Focus on specific category (e.g., snowflake, aws)'
    )
    
    args = parser.parse_args()
    
    # Load config
    config = load_config()
    
    # Initialize pipeline
    pipeline = BlogAutomationPipelineGemini(config)
    
    # Prepare topics
    specific_topics = None
    if args.topics:
        specific_topics = [
            {'title': topic, 'category': args.category or 'general'}
            for topic in args.topics
        ]
    elif args.category:
        # Get category-specific trends
        print(f"🔍 Getting trends for category: {args.category}")
        monitor = TrendMonitorFree(config['gemini_api_key'])
        specific_topics = monitor.get_topics_by_category(args.category, limit=args.posts)
    
    # Run pipeline
    results = pipeline.run_full_pipeline(
        num_posts=args.posts,
        publish_status=args.status,
        specific_topics=specific_topics
    )
    
    # Exit code
    failed = len([r for r in results if not r.get('success')])
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
