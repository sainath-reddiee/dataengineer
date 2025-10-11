#!/usr/bin/env python3
"""
Main Orchestrator - Complete Blog Automation Pipeline
Coordinates: Trend Monitoring → Content Generation → Image Creation → WordPress Publishing
"""

import os
import sys
import json
import argparse
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Import our modules
from trend_monitor import TrendMonitor
from blog_generator import BlogGenerator
from image_generator import ImageGenerator
from wordpress_publisher import WordPressPublisher

class BlogAutomationPipeline:
    def __init__(self, config: dict):
        """Initialize the complete automation pipeline"""
        self.config = config
        
        # Initialize components
        print("🚀 Initializing Blog Automation Pipeline...\n")
        
        self.trend_monitor = TrendMonitor(config['anthropic_api_key'])
        self.blog_generator = BlogGenerator(config['anthropic_api_key'])
        self.image_generator = ImageGenerator(provider=config.get('image_provider', 'dalle'))
        self.wordpress_publisher = WordPressPublisher(
            config['wordpress_url'],
            config['wordpress_user'],
            config['wordpress_app_password']
        )
        
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
        """
        Run the complete automation pipeline
        
        Args:
            num_posts: Number of blog posts to generate
            publish_status: 'draft' or 'publish'
            specific_topics: Optional list of specific topics to write about
        
        Returns:
            List of results for each post
        """
        print("="*70)
        print("BLOG AUTOMATION PIPELINE - STARTING")
        print("="*70)
        print(f"📊 Posts to generate: {num_posts}")
        print(f"📝 Publish status: {publish_status}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        results = []
        
        try:
            # Step 1: Identify trending topics
            if specific_topics:
                topics = specific_topics
                print(f"📌 Using {len(topics)} specific topics provided by user\n")
            else:
                print("🔍 STEP 1: Analyzing trending topics...")
                topics = self.trend_monitor.analyze_trends()
                print(f"✅ Found {len(topics)} trending topics\n")
                
                # Display topics
                print("📋 Top Trending Topics:")
                for i, topic in enumerate(topics[:num_posts], 1):
                    print(f"   {i}. {topic['title']} (Score: {topic.get('trend_score', 'N/A')})")
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
        post_dir = self.output_dir / f"post_{post_num}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        post_dir.mkdir(exist_ok=True)
        
        # Step 2: Generate blog content
        print("📝 STEP 2: Generating blog content...")
        blog_data = self.blog_generator.generate_blog_post(topic)
        
        # Save raw blog data
        with open(post_dir / 'blog_data.json', 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Content generated: {blog_data['metadata']['word_count']} words")
        print(f"   Reading time: {blog_data['metadata']['reading_time']} minutes")
        print(f"   Focus keyword: {blog_data['seo']['focus_keyword']}\n")
        
        # Step 3: Generate images
        print("🎨 STEP 3: Generating images...")
        image_dir = post_dir / 'images'
        image_dir.mkdir(exist_ok=True)
        
        generated_images = self.image_generator.generate_images(
            blog_data['images'],
            output_dir=str(image_dir)
        )
        
        successful_images = [img for img in generated_images if img.get('generated')]
        print(f"✅ Images generated: {len(successful_images)}/{len(blog_data['images'])}\n")
        
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
                'successful': len(successful_images)
            },
            'wordpress': publish_result,
            'output_directory': str(post_dir),
            'duration_seconds': duration,
            'timestamp': datetime.now().isoformat()
        }
        
        # Save complete result
        with open(post_dir / 'result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        if result['success']:
            print(f"\n✅ POST {post_num} COMPLETED in {duration:.1f}s")
            print(f"   View: {publish_result['post_url']}")
            print(f"   Edit: {publish_result['edit_url']}")
        else:
            print(f"\n❌ POST {post_num} FAILED")
            print(f"   Error: {publish_result.get('error', 'Unknown error')}")
        
        return result
    
    def _save_results(self, results: list):
        """Save pipeline results"""
        results_file = self.output_dir / 'pipeline_results.json'
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
    
    def _print_summary(self, results: list):
        """Print final pipeline summary"""
        print("\n\n" + "="*70)
        print("PIPELINE SUMMARY")
        print("="*70)
        
        successful = [r for r in results if r.get('success')]
        failed = [r for r in results if not r.get('success')]
        
        print(f"\n✅ Successful: {len(successful)}")
        print(f"❌ Failed: {len(failed)}")
        print(f"📊 Total: {len(results)}")
        
        if successful:
            print("\n✅ SUCCESSFUL POSTS:")
            for r in successful:
                print(f"\n   • {r['topic']}")
                print(f"     URL: {r['wordpress']['post_url']}")
                print(f"     Words: {r['blog_data']['word_count']}")
                print(f"     Images: {r['images']['successful']}/{r['images']['total']}")
                print(f"     Duration: {r['duration_seconds']:.1f}s")
        
        if failed:
            print("\n❌ FAILED POSTS:")
            for r in failed:
                print(f"\n   • {r['topic']}")
                print(f"     Error: {r.get('error', 'Unknown')}")
        
        print(f"\n📁 Results saved to: {self.output_dir}/pipeline_results.json")
        print("="*70 + "\n")


def load_config() -> dict:
    """Load configuration from environment variables"""
    load_dotenv()
    
    required_vars = [
        'ANTHROPIC_API_KEY',
        'WORDPRESS_URL',
        'WORDPRESS_USER',
        'WORDPRESS_APP_PASSWORD'
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        print("❌ Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        sys.exit(1)
    
    return {
        'anthropic_api_key': os.getenv('ANTHROPIC_API_KEY'),
        'wordpress_url': os.getenv('WORDPRESS_URL'),
        'wordpress_user': os.getenv('WORDPRESS_USER'),
        'wordpress_app_password': os.getenv('WORDPRESS_APP_PASSWORD'),
        'image_provider': os.getenv('IMAGE_PROVIDER', 'dalle'),
        'output_dir': os.getenv('OUTPUT_DIR', 'blog_outputs')
    }


def main():
    parser = argparse.ArgumentParser(description='AI-Powered Blog Automation Pipeline')
    parser.add_argument(
        '--posts', 
        type=int, 
        default=1,
        help='Number of blog posts to generate (default: 1)'
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
        help='Specific topic titles to write about (optional)'
    )
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config()
    
    # Initialize pipeline
    pipeline = BlogAutomationPipeline(config)
    
    # Prepare specific topics if provided
    specific_topics = None
    if args.topics:
        specific_topics = [
            {'title': topic, 'category': 'general'}
            for topic in args.topics
        ]
    
    # Run pipeline
    results = pipeline.run_full_pipeline(
        num_posts=args.posts,
        publish_status=args.status,
        specific_topics=specific_topics
    )
    
    # Exit with appropriate code
    failed = len([r for r in results if not r.get('success')])
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()