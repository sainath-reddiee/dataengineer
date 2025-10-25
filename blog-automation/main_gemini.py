#!/usr/bin/env python3
"""
Main Orchestrator (GEMINI + TAVILY VERSION) - COMPLETE & FIXED
Uses Google Gemini API + Tavily Research API
All FREE APIs - NO Anthropic needed!
Updated to support both Gemini and Tavily API keys
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Import our FREE modules
from trend_monitor_realtime import EnhancedTrendMonitor
from blog_generator_free import BlogGeneratorTavily  # Correct class name
from wordpress_publisher import WordPressPublisher

# Optional: Import free image generator
try:
    from image_generator_free import ImageGeneratorFree
    IMAGE_GENERATOR_AVAILABLE = True
except ImportError:
    IMAGE_GENERATOR_AVAILABLE = False


class BlogAutomationPipelineGemini:
    def __init__(self, config: dict):
        """Initialize pipeline with Gemini + Tavily APIs"""
        self.config = config
        
        print("🚀 Initializing Blog Automation Pipeline (Gemini + Tavily)...\n")
        print("✅ Using Google Gemini API + Tavily Research API")
        print("💰 Both APIs are FREE for reasonable usage!")
        
        # Initialize components - ALL using FREE APIs!
        print("\n📊 Initializing components...")
        
        # 1. Trend Monitor (Gemini)
        print("   • Trend Monitor (Gemini)... ", end="")
        self.trend_monitor = EnhancedTrendMonitor(config['gemini_api_key'])
        print("✅")
        
        # 2. Blog Generator (Gemini + Tavily)
        print("   • Blog Generator (Gemini + Tavily)... ", end="")
        self.blog_generator = BlogGeneratorTavily(
            gemini_api_key=config['gemini_api_key'],
            tavily_api_key=config['tavily_api_key']
        )
        print("✅")
        
        # 3. WordPress Publisher
        print("   • WordPress Publisher... ", end="")
        self.wordpress_publisher = WordPressPublisher(
            config['wordpress_url'],
            config['wordpress_user'],
            config['wordpress_app_password']
        )
        print("✅")
        
        # 4. Optional: Image generator
        self.use_images = config.get('use_images', False)
        if self.use_images:
            print("   • Image Generator (Hugging Face)... ", end="")
            if IMAGE_GENERATOR_AVAILABLE:
                try:
                    self.image_generator = ImageGeneratorFree()
                    print("✅")
                except ValueError as e:
                    print(f"❌")
                    print(f"      Warning: {e}")
                    self.use_images = False
            else:
                print("❌")
                print("      Warning: image_generator_free.py not found")
                self.use_images = False
        
        # Create output directory
        self.output_dir = Path(config.get('output_dir', 'blog_outputs'))
        self.output_dir.mkdir(exist_ok=True)
        
        print("\n✅ All components initialized successfully!\n")
    
    def run_full_pipeline(
        self, 
        num_posts: int = 1,
        publish_status: str = 'draft',
        specific_topics: list = None,
        category: str = None
    ) -> list:
        """Run the complete automation pipeline"""
        print("="*70)
        print("BLOG AUTOMATION PIPELINE (GEMINI + TAVILY - ALL FREE)")
        print("="*70)
        print(f"📊 Posts to generate: {num_posts}")
        print(f"📝 Publish status: {publish_status}")
        print(f"🎯 Category filter: {category if category else 'All categories'}")
        print(f"💰 API Cost: $0.00 (FREE tier usage)")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        results = []
        
        try:
            # Step 1: Identify trending topics
            if specific_topics:
                topics = specific_topics
                print(f"📌 Using {len(topics)} specific topics provided by user\n")
            else:
                print("🔍 STEP 1: Analyzing trending topics (using Gemini + Web Scraping)...")
                topics = self.trend_monitor.analyze_trends(limit=num_posts * 2, category=category)
                
                if not topics:
                    print("❌ Could not fetch trending topics. Aborting.")
                    return []
                
                print(f"✅ Found {len(topics)} trending topics\n")
                
                # Display top topics
                print("📋 Top Trending Topics:")
                for i, topic in enumerate(topics[:min(10, len(topics))], 1):
                    score = topic.get('trend_score', 'N/A')
                    is_official = topic.get('is_official', False)
                    official_tag = " ⭐ OFFICIAL" if is_official else ""
                    print(f"   {i}. {topic['title']} (Score: {score}){official_tag}")
                print()
            
            # Select top N topics
            selected_topics = topics[:num_posts]
            
            # Step 2-5: Process each topic
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
                    import traceback
                    traceback.print_exc()
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
        """Process a single blog post through the entire pipeline"""
        
        start_time = datetime.now()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        post_dir = self.output_dir / f"post_{post_num}_{timestamp}"
        post_dir.mkdir(exist_ok=True)
        
        # Step 2: Generate blog content (using Gemini + Tavily)
        print("📝 STEP 2: Generating blog content (Gemini + Tavily Research)...")
        print("   This may take 2-3 minutes for high-quality research-backed content...\n")
        
        blog_data = self.blog_generator.generate_blog_post(topic)
        
        # Save raw blog data
        with open(post_dir / 'blog_data.json', 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Content generated successfully!")
        print(f"   📊 Statistics:")
        print(f"      • Word count: {blog_data['metadata']['word_count']}")
        print(f"      • Reading time: {blog_data['metadata']['reading_time']} minutes")
        print(f"      • Focus keyphrase: {blog_data['seo']['focus_keyphrase']}")
        print(f"      • Blocks: {blog_data['metadata']['blocks_count']} (Gutenberg)")
        print(f"      • Sources cited: {blog_data['metadata']['sources_used']}")
        print(f"      • Cost: {blog_data['metadata']['cost']}")
        
        # Save HTML preview
        html_preview = self._generate_html_preview(blog_data)
        with open(post_dir / 'preview.html', 'w', encoding='utf-8') as f:
            f.write(html_preview)
        print(f"      • Preview saved: {post_dir / 'preview.html'}\n")
        
        # Step 3: Handle images
        generated_images = []
        if self.use_images and hasattr(self, 'image_generator'):
            print("🎨 STEP 3: Generating images (Hugging Face - FREE)...")
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
                print(f"⚠️  Image generation failed: {e}\n")
        else:
            print("ℹ️  STEP 3: Skipping images (disabled or not configured)\n")
        
        # Step 4: Publish to WordPress
        print("📤 STEP 4: Publishing to WordPress...")
        print("   This includes saving Yoast SEO metadata...\n")
        
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
                'slug': blog_data.get('slug', ''),
                'word_count': blog_data['metadata']['word_count'],
                'reading_time': blog_data['metadata']['reading_time'],
                'focus_keyphrase': blog_data['seo']['focus_keyphrase'],
                'blocks_count': blog_data['metadata']['blocks_count'],
                'sources_used': blog_data['metadata']['sources_used']
            },
            'images': {
                'total': len(blog_data['images']),
                'successful': len([img for img in generated_images if img.get('generated')])
            },
            'wordpress': publish_result,
            'output_directory': str(post_dir),
            'duration_seconds': duration,
            'timestamp': datetime.now().isoformat(),
            'apis_used': {
                'gemini': 'Content Generation',
                'tavily': 'Research & Citations',
                'huggingface': 'Image Generation' if self.use_images else 'Disabled'
            },
            'cost': '$0.00 (FREE tier)'
        }
        
        # Save result
        with open(post_dir / 'result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        if result['success']:
            print(f"\n{'='*70}")
            print(f"✅ POST {post_num} COMPLETED SUCCESSFULLY!")
            print(f"{'='*70}")
            print(f"⏱️  Duration: {duration:.1f}s")
            print(f"📝 Title: {blog_data['title']}")
            print(f"📊 Stats: {result['blog_data']['word_count']} words, "
                  f"{result['blog_data']['reading_time']} min read")
            print(f"🔍 SEO: Focus on '{result['blog_data']['focus_keyphrase']}'")
            print(f"📚 Research: {result['blog_data']['sources_used']} sources cited")
            print(f"\n🌐 WordPress:")
            print(f"   View: {publish_result['post_url']}")
            print(f"   Edit: {publish_result['edit_url']}")
            
            # Yoast SEO status
            yoast_verified = publish_result.get('yoast_seo', {}).get('verified', False)
            if yoast_verified:
                print(f"   Yoast SEO: ✅ All fields saved automatically")
            else:
                print(f"   Yoast SEO: ⚠️  Manual entry required (see edit link)")
            
            print(f"\n💰 Cost: $0.00 (FREE!)")
            print(f"{'='*70}\n")
        else:
            print(f"\n{'='*70}")
            print(f"❌ POST {post_num} FAILED")
            print(f"{'='*70}")
            print(f"Error: {publish_result.get('error', 'Unknown error')}")
            print(f"{'='*70}\n")
        
        return result
    
    def _generate_html_preview(self, blog_data: dict) -> str:
        """Generate HTML preview of the blog post"""
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{blog_data['title']}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }}
        h1 {{
            color: #1a1a1a;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #0066cc;
            margin-top: 30px;
        }}
        h3 {{
            color: #0080ff;
        }}
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
        .seo-info {{
            background: #e7f3ff;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }}
        .seo-info strong {{
            color: #0066cc;
        }}
    </style>
</head>
<body>
    <div class="seo-info">
        <strong>SEO Title:</strong> {blog_data['seo']['title']}<br>
        <strong>Focus Keyphrase:</strong> {blog_data['seo']['focus_keyphrase']}<br>
        <strong>Meta Description:</strong> {blog_data['seo']['meta_description']}<br>
        <strong>Word Count:</strong> {blog_data['metadata']['word_count']} | 
        <strong>Reading Time:</strong> {blog_data['metadata']['reading_time']} min | 
        <strong>Sources:</strong> {blog_data['metadata']['sources_used']}
    </div>
    
    <h1>{blog_data['title']}</h1>
"""
        
        # Convert blocks to HTML
        for block in blog_data.get('content_blocks', []):
            content = block.get('innerContent', [''])[0]
            html += f"\n{content}\n"
        
        html += """
</body>
</html>"""
        
        return html
    
    def _save_results(self, results: list):
        """Save pipeline results to JSON"""
        results_file = self.output_dir / 'pipeline_results.json'
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'total_posts': len(results),
                'successful': len([r for r in results if r.get('success')]),
                'failed': len([r for r in results if not r.get('success')]),
                'results': results
            }, f, indent=2, ensure_ascii=False)
    
    def _print_summary(self, results: list):
        """Print final pipeline summary"""
        print("\n\n" + "="*70)
        print("📊 PIPELINE SUMMARY")
        print("="*70)
        
        successful = [r for r in results if r.get('success')]
        failed = [r for r in results if not r.get('success')]
        
        print(f"\n✅ Successful: {len(successful)}")
        print(f"❌ Failed: {len(failed)}")
        print(f"📊 Total: {len(results)}")
        print(f"💰 Total Cost: $0.00 (FREE tier)")
        
        if successful:
            print("\n✅ SUCCESSFUL POSTS:")
            print("-" * 70)
            for i, r in enumerate(successful, 1):
                print(f"\n{i}. {r['topic']}")
                print(f"   📝 Title: {r['blog_data']['title']}")
                print(f"   🌐 URL: {r['wordpress']['post_url']}")
                print(f"   ✏️  Edit: {r['wordpress']['edit_url']}")
                print(f"   📊 Stats: {r['blog_data']['word_count']} words, "
                      f"{r['blog_data']['sources_used']} sources")
                print(f"   ⏱️  Duration: {r['duration_seconds']:.1f}s")
        
        if failed:
            print("\n❌ FAILED POSTS:")
            print("-" * 70)
            for i, r in enumerate(failed, 1):
                print(f"\n{i}. {r['topic']}")
                print(f"   Error: {r.get('error', 'Unknown error')}")
        
        # Calculate total stats
        if successful:
            total_words = sum(r['blog_data']['word_count'] for r in successful)
            total_sources = sum(r['blog_data']['sources_used'] for r in successful)
            total_duration = sum(r['duration_seconds'] for r in successful)
            
            print(f"\n📈 AGGREGATE STATISTICS:")
            print("-" * 70)
            print(f"   Total words written: {total_words:,}")
            print(f"   Total sources cited: {total_sources}")
            print(f"   Total time: {total_duration/60:.1f} minutes")
            print(f"   Average per post: {total_duration/len(successful):.1f}s")
        
        print(f"\n📁 Results saved to: {self.output_dir}/pipeline_results.json")
        print("="*70 + "\n")


def load_config() -> dict:
    """Load configuration from environment variables"""
    load_dotenv()
    
    print("🔐 Loading API keys from environment...\n")
    
    # Check Gemini API key
    gemini_key = os.getenv('GEMINI_API_KEY')
    if not gemini_key:
        print("❌ Missing GEMINI_API_KEY!")
        print("\n📝 How to get FREE Gemini API key:")
        print("1. Visit: https://ai.google.dev/")
        print("2. Click 'Get API key in Google AI Studio'")
        print("3. Create project and generate key")
        print("4. Add to .env: GEMINI_API_KEY=your_key_here")
        print("\n💰 Free tier: 60 requests/minute")
        sys.exit(1)
    print("✅ Gemini API key found")
    
    # Check Tavily API key
    tavily_key = os.getenv('TAVILY_API_KEY')
    if not tavily_key:
        print("❌ Missing TAVILY_API_KEY!")
        print("\n📝 How to get FREE Tavily API key:")
        print("1. Visit: https://tavily.com/")
        print("2. Sign up for free account")
        print("3. Get API key from dashboard")
        print("4. Add to .env: TAVILY_API_KEY=your_key_here")
        print("\n💰 Free tier: 1000 requests/month")
        sys.exit(1)
    print("✅ Tavily API key found")
    
    # Check WordPress credentials
    wp_url = os.getenv('WORDPRESS_URL')
    wp_user = os.getenv('WORDPRESS_USER')
    wp_pass = os.getenv('WORDPRESS_APP_PASSWORD')
    
    if not all([wp_url, wp_user, wp_pass]):
        print("❌ Missing WordPress credentials!")
        print("\n📝 Required in .env:")
        print("- WORDPRESS_URL (e.g., https://yourdomain.com)")
        print("- WORDPRESS_USER (your WP username)")
        print("- WORDPRESS_APP_PASSWORD (from WP admin → Users → Application Passwords)")
        sys.exit(1)
    print("✅ WordPress credentials found")
    
    print()
    
    return {
        'gemini_api_key': gemini_key,
        'tavily_api_key': tavily_key,
        'wordpress_url': wp_url,
        'wordpress_user': wp_user,
        'wordpress_app_password': wp_pass,
        'use_images': os.getenv('USE_IMAGES', 'false').lower() == 'true',
        'output_dir': os.getenv('OUTPUT_DIR', 'blog_outputs')
    }


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='AI Blog Automation (Gemini + Tavily - All FREE)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
USAGE EXAMPLES:

Automatic Mode (AI finds trending topics):
  python main_gemini.py --posts 1 --category snowflake --status draft
  python main_gemini.py --posts 3 --category databricks --status draft
  python main_gemini.py --posts 5 --category aws --status publish

Manual Mode (You provide topics):
  python main_gemini.py --topics "Snowflake Time Travel Guide" --status draft
  python main_gemini.py --topics "Topic 1" "Topic 2" "Topic 3" --status draft

Supported Categories:
  snowflake    - Snowflake data warehouse
  aws          - Amazon Web Services
  azure        - Microsoft Azure
  dbt          - Data Build Tool
  airflow      - Apache Airflow
  python       - Python programming
  sql          - SQL and databases
  gcp          - Google Cloud Platform
  salesforce   - Salesforce
  databricks   - Databricks

Features:
  • Real-time web research with Tavily
  • Premium content generation with Gemini
  • Research-backed blog posts with citations
  • SEO-optimized with Yoast support
  • WordPress Gutenberg blocks
  • 100% FREE (using free API tiers)

Cost: $0.00 (FREE tier usage)
        """
    )
    
    parser.add_argument(
        '--posts', 
        type=int, 
        default=1,
        help='Number of posts to generate (default: 1, automatic mode only)'
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
        help='Specific topics to write about (manual mode)'
    )
    
    parser.add_argument(
        '--category',
        choices=['snowflake', 'aws', 'azure', 'dbt', 'airflow', 'python', 'sql', 'gcp', 'salesforce', 'databricks'],
        help='Focus on specific category (automatic mode only)'
    )
    
    args = parser.parse_args()
    
    # Determine mode
    if args.topics:
        print(f"📝 MANUAL mode - Will create {len(args.topics)} post(s) from your topics")
    else:
        print(f"🤖 AUTOMATIC mode - Will create {args.posts} post(s) from trending topics")
        if args.category:
            print(f"🎯 Category filter: {args.category}")
    
    print()
    
    # Load configuration
    config = load_config()
    
    # Initialize pipeline
    pipeline = BlogAutomationPipelineGemini(config)
    
    # Prepare specific topics if provided (manual mode)
    specific_topics = None
    if args.topics:
        specific_topics = [
            {'title': topic, 'category': args.category or 'general'}
            for topic in args.topics
        ]
        num_posts = len(specific_topics)
    else:
        num_posts = args.posts
    
    # Run pipeline
    results = pipeline.run_full_pipeline(
        num_posts=num_posts,
        publish_status=args.status,
        specific_topics=specific_topics,
        category=args.category
    )
    
    # Exit with appropriate code
    failed_count = len([r for r in results if not r.get('success')])
    
    if failed_count == 0:
        print("\n🎉 All posts completed successfully!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {failed_count} post(s) failed. Check logs above for details.")
        sys.exit(1)


if __name__ == "__main__":
    main()
