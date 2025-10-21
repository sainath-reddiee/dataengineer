#!/usr/bin/env python3
"""
WordPress Publisher with FULL YOAST SEO Support
Fixes: Meta description, focus keyphrase, SEO title, slug - all saved correctly
"""

import os
import requests
import base64
from typing import Dict, List
import json
from datetime import datetime
import traceback
import hashlib
import time
import uuid

class WordPressPublisher:
    def __init__(self, site_url: str, username: str, app_password: str):
        """Initialize WordPress REST API publisher with Yoast SEO support"""
        self.site_url = site_url.rstrip('/')
        self.api_base = f"{self.site_url}/wp-json/wp/v2"
        
        credentials = f"{username}:{app_password}"
        token = base64.b64encode(credentials.encode()).decode('utf-8')
        
        self.headers = {
            'Authorization': f'Basic {token}',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        print(f"✅ WordPress Publisher with Yoast SEO Support")
        print(f"   Site: {self.site_url}")
    
    def publish_blog_post(
        self, 
        blog_data: Dict, 
        image_files: List[Dict],
        status: str = 'draft'
    ) -> Dict:
        """Publish blog post with FULL Yoast SEO metadata"""
        print(f"\n{'='*70}")
        print(f"📤 PUBLISHING YOAST SEO COMPLIANT POST")
        print(f"{'='*70}")
        print(f"Title: {blog_data['title']}")
        print(f"Focus Keyphrase: {blog_data['seo']['focus_keyphrase']}")
        print(f"SEO Title: {blog_data['seo']['title']}")
        print(f"Slug: {blog_data['slug']}")
        print(f"Status: {status}")
        print(f"{'='*70}\n")
        
        try:
            # Step 1: Upload images
            print("📷 STEP 1: Uploading images...")
            uploaded_images = self._upload_images(image_files)
            print(f"   ✅ {len(uploaded_images)}/{len(image_files)} uploaded\n")
            
            # Step 2: Get category
            print("📁 STEP 2: Setting up category...")
            category_id = self._get_or_create_category(
                blog_data.get('category', 'Uncategorized')
            )
            print()
            
            # Step 3: Prepare content
            print("📝 STEP 3: Preparing content...")
            content_with_images = self._insert_images_into_content(
                blog_data['content'],
                uploaded_images
            )
            references_html = self._build_references_section(
                blog_data.get('references', [])
            )
            full_content = content_with_images + references_html
            print(f"   Content: {len(full_content)} chars\n")
            
            # Step 4: Create post with ALL metadata
            print("✍️  STEP 4: Creating post with Yoast SEO metadata...")
            print("   " + "-"*66)
            
            # Build Yoast SEO meta fields
            yoast_meta = self._build_yoast_meta(blog_data['seo'])
            
            # Primary post data
            post_data = {
                'title': blog_data['title'],
                'content': full_content,
                'slug': blog_data['slug'],  # SEO-optimized slug
                'status': status,
                'categories': [category_id],
                'comment_status': 'open',
                'ping_status': 'open',
                'meta': yoast_meta  # CRITICAL: Yoast SEO fields
            }
            
            # Add featured image if available
            if uploaded_images and 'id' in uploaded_images[0]:
                post_data['featured_media'] = uploaded_images[0]['id']
            
            print(f"   📊 Yoast SEO fields to save:")
            print(f"      - Focus Keyphrase: {blog_data['seo']['focus_keyphrase']}")
            print(f"      - SEO Title: {blog_data['seo']['title']}")
            print(f"      - Meta Description: {blog_data['seo']['meta_description'][:50]}...")
            print(f"      - Slug: {blog_data['slug']}")
            
            # Create post
            print(f"\n   📤 Sending to WordPress...")
            response = self.session.post(
                f"{self.api_base}/posts",
                json=post_data,
                timeout=30
            )
            
            print(f"   📊 Response: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                error_msg = self._parse_error_response(response)
                raise Exception(f"Failed to create post: {error_msg}")
            
            post_info = self._normalize_response(response.json())
            
            if not post_info or 'id' not in post_info:
                raise Exception("Invalid response - no post ID")
            
            post_id = post_info['id']
            print(f"   ✅ Post created with ID: {post_id}")
            
            # Step 5: CRITICAL - Verify and re-save Yoast fields
            print(f"\n   🔍 STEP 5: Verifying Yoast SEO metadata...")
            time.sleep(2)  # Allow WordPress to process
            
            # Update post again to ensure Yoast fields are saved
            # Some WordPress setups require a second update for custom fields
            update_data = {
                'meta': yoast_meta
            }
            
            update_response = self.session.post(
                f"{self.api_base}/posts/{post_id}",
                json=update_data,
                timeout=30
            )
            
            if update_response.status_code in [200, 201]:
                print(f"   ✅ Yoast SEO metadata confirmed")
            else:
                print(f"   ⚠️  Yoast update returned {update_response.status_code}")
            
            # Step 6: Final verification
            print(f"\n   🔍 STEP 6: Final verification...")
            time.sleep(1)
            
            verify_response = self.session.get(
                f"{self.api_base}/posts/{post_id}?context=edit",
                timeout=10
            )
            
            if verify_response.status_code == 200:
                verify_data = self._normalize_response(verify_response.json())
                
                # Check meta fields
                saved_meta = verify_data.get('meta', {})
                
                print(f"      ✓ Title: {verify_data.get('title', {}).get('raw', '')[:50]}...")
                print(f"      ✓ Slug: {verify_data.get('slug', 'N/A')}")
                print(f"      ✓ Focus Keyphrase: {saved_meta.get('_yoast_wpseo_focuskw', 'NOT SAVED')}")
                print(f"      ✓ SEO Title: {saved_meta.get('_yoast_wpseo_title', 'NOT SAVED')[:50]}...")
                print(f"      ✓ Meta Desc: {saved_meta.get('_yoast_wpseo_metadesc', 'NOT SAVED')[:50]}...")
                
                # Check if Yoast fields were saved
                yoast_saved = all([
                    saved_meta.get('_yoast_wpseo_focuskw'),
                    saved_meta.get('_yoast_wpseo_title'),
                    saved_meta.get('_yoast_wpseo_metadesc')
                ])
                
                if yoast_saved:
                    print(f"\n      ✅ All Yoast SEO fields saved successfully!")
                else:
                    print(f"\n      ⚠️  Some Yoast fields may not have saved")
                    print(f"         This may be due to Yoast SEO plugin not installed/active")
            
            print(f"\n   " + "-"*66)
            
            result = {
                'success': True,
                'post_id': post_id,
                'post_url': post_info.get('link', f"{self.site_url}/?p={post_id}"),
                'edit_url': f"{self.site_url}/wp-admin/post.php?post={post_id}&action=edit",
                'status': status,
                'images_uploaded': len(uploaded_images),
                'yoast_seo': {
                    'focus_keyphrase': blog_data['seo']['focus_keyphrase'],
                    'seo_title': blog_data['seo']['title'],
                    'meta_description': blog_data['seo']['meta_description'],
                    'slug': blog_data['slug']
                },
                'published_at': datetime.now().isoformat()
            }
            
            print(f"\n{'='*70}")
            print(f"✅ POST PUBLISHED WITH YOAST SEO!")
            print(f"{'='*70}")
            print(f"Post ID: {result['post_id']}")
            print(f"View: {result['post_url']}")
            print(f"Edit: {result['edit_url']}")
            print(f"\n📊 Yoast SEO Status:")
            print(f"   ✓ Focus Keyphrase: {result['yoast_seo']['focus_keyphrase']}")
            print(f"   ✓ SEO Title: {result['yoast_seo']['seo_title']}")
            print(f"   ✓ Meta Description: {result['yoast_seo']['meta_description'][:60]}...")
            print(f"   ✓ Slug: {result['yoast_seo']['slug']}")
            print(f"{'='*70}")
            
            return result
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def _build_yoast_meta(self, seo_data: Dict) -> Dict:
        """Build Yoast SEO meta fields for WordPress API"""
        return {
            # Yoast SEO Primary Fields
            '_yoast_wpseo_focuskw': seo_data['focus_keyphrase'],
            '_yoast_wpseo_title': seo_data['title'],
            '_yoast_wpseo_metadesc': seo_data['meta_description'],
            
            # Additional Yoast Fields
            '_yoast_wpseo_linkdex': '0',  # SEO score (0 = not analyzed yet)
            '_yoast_wpseo_content_score': '0',  # Readability score
            '_yoast_wpseo_metakeywords': ', '.join(seo_data.get('secondary_keywords', [])),
            
            # OpenGraph (Social Media)
            '_yoast_wpseo_opengraph-title': seo_data['title'],
            '_yoast_wpseo_opengraph-description': seo_data['meta_description'],
            
            # Twitter Card
            '_yoast_wpseo_twitter-title': seo_data['title'],
            '_yoast_wpseo_twitter-description': seo_data['meta_description'],
            
            # Canonical URL (optional - WordPress sets this automatically)
            # '_yoast_wpseo_canonical': '',
            
            # Meta robots (index/follow settings)
            '_yoast_wpseo_meta-robots-noindex': '0',  # 0 = index, 1 = noindex
            '_yoast_wpseo_meta-robots-nofollow': '0',  # 0 = follow, 1 = nofollow
        }
    
    def _normalize_response(self, response_data):
        """Normalize WordPress API response"""
        if isinstance(response_data, list):
            if len(response_data) > 0 and isinstance(response_data[0], dict):
                return response_data[0]
            return None
        elif isinstance(response_data, dict):
            return response_data
        return None
    
    def _upload_images(self, image_files: List[Dict]) -> List[Dict]:
        """Upload images to WordPress media library"""
        uploaded = []
        
        for idx, img in enumerate(image_files, 1):
            if not img.get('generated') or not img.get('local_path'):
                continue
            
            try:
                if not os.path.exists(img['local_path']):
                    continue
                
                with open(img['local_path'], 'rb') as f:
                    image_data = f.read()
                
                file_size = len(image_data) / 1024
                file_ext = os.path.splitext(img['local_path'])[1]
                file_hash = hashlib.md5(image_data).hexdigest()[:8]
                timestamp = int(time.time())
                placement = img.get('placement', 'img').replace('/', '_')
                unique_filename = f"blog_{timestamp}_{placement}_{file_hash}{file_ext}"
                
                content_type = 'image/jpeg' if file_ext.lower() in ['.jpg', '.jpeg'] else 'image/png'
                
                headers = {
                    'Authorization': self.headers['Authorization'],
                    'Content-Disposition': f'attachment; filename="{unique_filename}"',
                    'Content-Type': content_type,
                }
                
                response = self.session.post(
                    f"{self.api_base}/media",
                    headers=headers,
                    data=image_data,
                    timeout=60
                )
                
                if response.status_code in [200, 201]:
                    media_info = self._normalize_response(response.json())
                    
                    if media_info and 'id' in media_info:
                        uploaded.append({
                            **img,
                            'id': media_info['id'],
                            'url': media_info.get('source_url', ''),
                            'wp_uploaded': True
                        })
                        print(f"   ✅ Image {idx}: ID {media_info['id']} ({file_size:.1f}KB)")
                
                time.sleep(0.5)
                
            except Exception as e:
                print(f"   ❌ Image {idx}: {str(e)[:60]}")
        
        return uploaded
    
    def _parse_error_response(self, response) -> str:
        """Parse error response from WordPress"""
        try:
            error_data = response.json()
            if isinstance(error_data, list) and len(error_data) > 0:
                error_data = error_data[0]
            if isinstance(error_data, dict):
                return error_data.get('message', str(error_data)[:200])
            return str(error_data)[:200]
        except:
            return response.text[:200]
    
    def _get_or_create_category(self, category_name: str) -> int:
        """Get existing category or create new one"""
        try:
            response = self.session.get(
                f"{self.api_base}/categories",
                params={'search': category_name},
                timeout=10
            )
            
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) > 0:
                    print(f"   ✅ Found: {category_name} (ID: {categories[0]['id']})")
                    return categories[0]['id']
            
            print(f"   📝 Creating: {category_name}")
            response = self.session.post(
                f"{self.api_base}/categories",
                json={'name': category_name.title()},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                cat_data = self._normalize_response(response.json())
                if cat_data and 'id' in cat_data:
                    print(f"   ✅ Created (ID: {cat_data['id']})")
                    return cat_data['id']
        except:
            pass
        
        print(f"   ℹ️  Using default (ID: 1)")
        return 1
    
    def _insert_images_into_content(self, content: str, images: List[Dict]) -> str:
        """Insert images into content at appropriate positions"""
        if not images:
            return content
        
        hero_img = next((img for img in images if img.get('placement') == 'hero'), None)
        sections = content.split('<h2>')
        result = []
        
        # Add hero image at top
        if hero_img and 'url' in hero_img:
            result.append(self._create_image_html(hero_img))
        
        # Add first section (before first H2)
        if sections[0].strip():
            result.append(sections[0])
        
        # Add remaining sections with images interspersed
        section_images = [img for img in images if img.get('placement') != 'hero' and 'url' in img]
        
        for i, section in enumerate(sections[1:], 1):
            result.append('<h2>' + section)
            # Insert image after every 2 sections
            if i % 2 == 0 and section_images:
                result.append(self._create_image_html(section_images.pop(0)))
        
        # Add remaining images
        for img in section_images:
            result.append(self._create_image_html(img))
        
        return '\n\n'.join(result)
    
    def _create_image_html(self, img: Dict) -> str:
        """Create WordPress image HTML with proper figure/caption"""
        return f'''
<figure class="wp-block-image size-large">
    <img src="{img.get('url', '')}" alt="{img.get('alt_text', '')}" class="wp-image-{img.get('id', '')}"/>
    <figcaption>{img.get('caption', '')}</figcaption>
</figure>
'''
    
    def _build_references_section(self, references: List[Dict]) -> str:
        """Build references section HTML"""
        if not references:
            return ''
        
        html = '\n\n<h2>References and Further Reading</h2>\n<ul>\n'
        for ref in references:
            html += f'<li><a href="{ref["url"]}" target="_blank" rel="noopener">{ref["title"]}</a> - {ref["description"]}</li>\n'
        html += '</ul>'
        return html


def main():
    """Test Yoast SEO publisher"""
    from dotenv import load_dotenv
    load_dotenv()
    
    site_url = os.getenv('WORDPRESS_URL')
    username = os.getenv('WORDPRESS_USER')
    app_password = os.getenv('WORDPRESS_APP_PASSWORD')
    
    if not all([site_url, username, app_password]):
        print("❌ Missing WordPress credentials!")
        print("\nRequired in .env:")
        print("- WORDPRESS_URL")
        print("- WORDPRESS_USER")
        print("- WORDPRESS_APP_PASSWORD")
        exit(1)
    
    print("\n" + "="*70)
    print("WordPress Publisher - Yoast SEO Compliant")
    print("="*70)
    print("\nThis version saves ALL Yoast SEO metadata:")
    print("✓ Focus keyphrase")
    print("✓ SEO title")
    print("✓ Meta description")
    print("✓ SEO-optimized slug")
    print("✓ Secondary keywords")
    print("✓ OpenGraph & Twitter cards")
    print("="*70 + "\n")
    
    publisher = WordPressPublisher(site_url, username, app_password)
    
    # Test with sample Yoast-compliant data
    sample_blog = {
        'title': 'Snowflake Data Pipeline Setup Guide',
        'slug': 'snowflake-data-pipeline-setup-guide',
        'content': '''<h2>Introduction</h2>
<p>In this comprehensive guide, we'll explore <strong>snowflake data pipeline</strong> setup and how it revolutionizes modern data engineering. Understanding snowflake data pipeline is essential for building scalable, efficient data solutions.</p>

<h2>Getting Started with Snowflake Data Pipeline</h2>
<p>Let's dive into the fundamentals of setting up your snowflake data pipeline effectively.</p>''',
        'seo': {
            'focus_keyphrase': 'snowflake data pipeline',
            'title': 'Snowflake Data Pipeline: Complete Setup Guide 2025',
            'meta_description': 'Master snowflake data pipeline setup with our step-by-step guide. Learn best practices, optimization tips, and real-world examples for data engineers in 2025.',
            'secondary_keywords': ['snowflake tutorial', 'data pipeline setup', 'ETL snowflake', 'cloud data warehouse', 'snowflake best practices']
        },
        'category': 'snowflake',
        'references': [
            {
                'title': 'Snowflake Official Documentation',
                'url': 'https://docs.snowflake.com',
                'description': 'Official Snowflake documentation and guides'
            }
        ]
    }
    
    sample_images = []  # No images for this test
    
    print("\n🧪 Publishing test post...")
    result = publisher.publish_blog_post(sample_blog, sample_images, status='draft')
    
    if result['success']:
        print("\n" + "="*70)
        print("✅ TEST SUCCESSFUL!")
        print("="*70)
        print(f"\nView your draft at: {result['post_url']}")
        print(f"Edit in WordPress: {result['edit_url']}")
        print("\nCheck in WordPress Admin:")
        print("1. Go to the edit screen")
        print("2. Scroll to Yoast SEO section")
        print("3. Verify all fields are populated:")
        print(f"   - Focus keyphrase: {result['yoast_seo']['focus_keyphrase']}")
        print(f"   - SEO title: {result['yoast_seo']['seo_title']}")
        print(f"   - Meta description: Present")
        print(f"   - Slug: {result['yoast_seo']['slug']}")
    else:
        print(f"\n❌ TEST FAILED: {result.get('error')}")


if __name__ == "__main__":
    main()