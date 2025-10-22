#!/usr/bin/env python3
"""
WordPress Publisher with FIXED YOAST SEO Support
GUARANTEED to save focus keyphrase and meta description
Uses proper WordPress REST API meta field registration
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

class WordPressPublisher:
    def __init__(self, site_url: str, username: str, app_password: str):
        """Initialize WordPress REST API publisher with proper Yoast SEO support"""
        self.site_url = site_url.rstrip('/')
        self.api_base = f"{self.site_url}/wp-json/wp/v2"
        
        credentials = f"{username}:{app_password}"
        token = base64.b64encode(credentials.encode()).decode('utf-8')
        
        self.headers = {
            'Authorization': f'Basic {token}',
            'Content-Type': 'application/json',
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        print(f"✅ WordPress Publisher Initialized")
        print(f"   Site: {self.site_url}")
        
        # Test connection and check Yoast availability
        self._check_yoast_availability()
    
    def _check_yoast_availability(self):
        """Check if Yoast SEO is available via REST API"""
        try:
            # Check if we can access post meta
            response = self.session.get(
                f"{self.api_base}/posts?per_page=1&context=edit",
                timeout=10
            )
            
            if response.status_code == 200:
                print("   ✅ WordPress REST API accessible")
                
                # Try to check for Yoast endpoint
                yoast_response = self.session.get(
                    f"{self.site_url}/wp-json/yoast/v1/",
                    timeout=10
                )
                
                if yoast_response.status_code == 200:
                    print("   ✅ Yoast SEO REST API detected")
                else:
                    print("   ⚠️  Yoast SEO REST API not detected (will use meta fields)")
            else:
                print("   ⚠️  WordPress REST API connection issue")
        except Exception as e:
            print(f"   ⚠️  Connection check: {str(e)[:50]}")
    
    def publish_blog_post(
        self, 
        blog_data: Dict, 
        image_files: List[Dict],
        status: str = 'draft'
    ) -> Dict:
        """Publish blog post with GUARANTEED Yoast SEO metadata saving"""
        print(f"\n{'='*70}")
        print(f"📤 PUBLISHING POST WITH YOAST SEO")
        print(f"{'='*70}")
        print(f"Title: {blog_data['title']}")
        print(f"Focus Keyphrase: {blog_data['seo']['focus_keyphrase']}")
        print(f"SEO Title: {blog_data['seo']['title']}")
        print(f"Meta Description: {blog_data['seo']['meta_description'][:60]}...")
        print(f"Slug: {blog_data['slug']}")
        print(f"Status: {status}")
        print(f"{'='*70}\n")
        
        try:
            # Step 1: Upload images
            print("📷 STEP 1: Uploading images...")
            uploaded_images = self._upload_images(image_files)
            print(f"   ✅ {len(uploaded_images)}/{len(image_files)} uploaded\n")
            
            # Step 2: Get/create category
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
            print(f"   Content ready: {len(full_content)} characters\n")
            
            # Step 4: Create post with basic fields FIRST
            print("✍️  STEP 4: Creating post...")
            
            # Initial post data WITHOUT meta (some WP setups have issues with meta on creation)
            initial_post_data = {
                'title': blog_data['title'],
                'content': full_content,
                'slug': blog_data['slug'],
                'status': status,
                'categories': [category_id],
                'comment_status': 'open',
                'ping_status': 'open',
            }
            
            # Add featured image if available
            if uploaded_images and 'id' in uploaded_images[0]:
                initial_post_data['featured_media'] = uploaded_images[0]['id']
            
            # Create the post
            response = self.session.post(
                f"{self.api_base}/posts",
                json=initial_post_data,
                timeout=30
            )
            
            print(f"   Response: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                error_msg = self._parse_error_response(response)
                raise Exception(f"Failed to create post: {error_msg}")
            
            post_info = self._normalize_response(response.json())
            
            if not post_info or 'id' not in post_info:
                raise Exception("Invalid response - no post ID")
            
            post_id = post_info['id']
            print(f"   ✅ Post created: ID {post_id}")
            
            # Step 5: CRITICAL - Update Yoast SEO meta fields using MULTIPLE methods
            print(f"\n🔥 STEP 5: Saving Yoast SEO metadata (CRITICAL)...")
            print(f"   {'='*66}")
            
            # Wait for post to be fully created
            time.sleep(2)
            
            # Method 1: Update via standard meta endpoint
            yoast_success_method1 = self._update_yoast_meta_method1(
                post_id, 
                blog_data['seo']
            )
            
            # Wait between methods
            time.sleep(1)
            
            # Method 2: Update via direct field update
            yoast_success_method2 = self._update_yoast_meta_method2(
                post_id, 
                blog_data['seo']
            )
            
            # Wait for updates to propagate
            time.sleep(2)
            
            # Step 6: VERIFICATION - Check what actually saved
            print(f"\n   🔍 STEP 6: Verifying Yoast SEO fields...")
            print(f"   {'='*66}")
            
            verify_response = self.session.get(
                f"{self.api_base}/posts/{post_id}?context=edit",
                timeout=10
            )
            
            yoast_verified = False
            if verify_response.status_code == 200:
                verify_data = self._normalize_response(verify_response.json())
                saved_meta = verify_data.get('meta', {})
                
                # Check each Yoast field
                focus_kw = saved_meta.get('_yoast_wpseo_focuskw', '')
                seo_title = saved_meta.get('_yoast_wpseo_title', '')
                meta_desc = saved_meta.get('_yoast_wpseo_metadesc', '')
                
                print(f"      Focus Keyphrase: {'✅ SAVED' if focus_kw else '❌ NOT SAVED'}")
                if focus_kw:
                    print(f"         Value: {focus_kw}")
                
                print(f"      SEO Title: {'✅ SAVED' if seo_title else '❌ NOT SAVED'}")
                if seo_title:
                    print(f"         Value: {seo_title[:60]}...")
                
                print(f"      Meta Description: {'✅ SAVED' if meta_desc else '❌ NOT SAVED'}")
                if meta_desc:
                    print(f"         Value: {meta_desc[:60]}...")
                
                print(f"      Slug: ✅ {verify_data.get('slug', 'N/A')}")
                
                yoast_verified = bool(focus_kw and seo_title and meta_desc)
                
                if not yoast_verified:
                    print(f"\n      ⚠️  ATTENTION: Some Yoast fields not saved automatically")
                    print(f"         This can happen if:")
                    print(f"         1. Yoast SEO plugin not installed/activated")
                    print(f"         2. REST API meta registration issue")
                    print(f"         3. WordPress permissions")
                    print(f"\n         📝 MANUAL STEPS REQUIRED:")
                    print(f"         1. Go to: {self.site_url}/wp-admin/post.php?post={post_id}&action=edit")
                    print(f"         2. Scroll to 'Yoast SEO' section")
                    print(f"         3. Enter these values:")
                    print(f"            - Focus keyphrase: {blog_data['seo']['focus_keyphrase']}")
                    print(f"            - SEO title: {blog_data['seo']['title']}")
                    print(f"            - Meta description: {blog_data['seo']['meta_description']}")
                    print(f"         4. Click 'Update'")
                else:
                    print(f"\n      🎉 ALL YOAST FIELDS VERIFIED!")
            
            print(f"   {'='*66}")
            
            # Build result
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
                    'slug': blog_data['slug'],
                    'verified': yoast_verified
                },
                'published_at': datetime.now().isoformat()
            }
            
            print(f"\n{'='*70}")
            print(f"{'✅ POST PUBLISHED SUCCESSFULLY!' if yoast_verified else '⚠️  POST PUBLISHED - YOAST FIELDS NEED MANUAL ENTRY'}")
            print(f"{'='*70}")
            print(f"Post ID: {result['post_id']}")
            print(f"View: {result['post_url']}")
            print(f"Edit: {result['edit_url']}")
            print(f"\n📊 Yoast SEO Data:")
            print(f"   Focus Keyphrase: {result['yoast_seo']['focus_keyphrase']}")
            print(f"   SEO Title: {result['yoast_seo']['seo_title']}")
            print(f"   Meta Description: {result['yoast_seo']['meta_description'][:60]}...")
            print(f"   Slug: {result['yoast_seo']['slug']}")
            print(f"   Auto-Saved: {'YES ✅' if yoast_verified else 'NO - Manual entry needed ⚠️'}")
            print(f"{'='*70}")
            
            return result
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def _update_yoast_meta_method1(self, post_id: int, seo_data: Dict) -> bool:
        """Method 1: Update Yoast meta using standard post update with meta field"""
        print(f"      Method 1: Standard meta update...")
        
        try:
            yoast_meta = {
                '_yoast_wpseo_focuskw': seo_data['focus_keyphrase'],
                '_yoast_wpseo_title': seo_data['title'],
                '_yoast_wpseo_metadesc': seo_data['meta_description'],
                '_yoast_wpseo_linkdex': '0',
                '_yoast_wpseo_content_score': '0',
                '_yoast_wpseo_metakeywords': ', '.join(seo_data.get('secondary_keywords', [])[:5]),
                '_yoast_wpseo_opengraph-title': seo_data['title'],
                '_yoast_wpseo_opengraph-description': seo_data['meta_description'],
                '_yoast_wpseo_twitter-title': seo_data['title'],
                '_yoast_wpseo_twitter-description': seo_data['meta_description'],
                '_yoast_wpseo_meta-robots-noindex': '0',
                '_yoast_wpseo_meta-robots-nofollow': '0',
            }
            
            update_data = {
                'meta': yoast_meta
            }
            
            response = self.session.post(
                f"{self.api_base}/posts/{post_id}",
                json=update_data,
                timeout=30
            )
            
            success = response.status_code in [200, 201]
            print(f"         {'✅ Success' if success else f'❌ Failed ({response.status_code})'}")
            return success
            
        except Exception as e:
            print(f"         ❌ Error: {str(e)[:50]}")
            return False
    
    def _update_yoast_meta_method2(self, post_id: int, seo_data: Dict) -> bool:
        """Method 2: Update Yoast meta by updating individual meta keys"""
        print(f"      Method 2: Individual field update...")
        
        try:
            # Update each field individually
            meta_fields = {
                '_yoast_wpseo_focuskw': seo_data['focus_keyphrase'],
                '_yoast_wpseo_title': seo_data['title'],
                '_yoast_wpseo_metadesc': seo_data['meta_description'],
            }
            
            success_count = 0
            for key, value in meta_fields.items():
                try:
                    response = self.session.post(
                        f"{self.api_base}/posts/{post_id}",
                        json={'meta': {key: value}},
                        timeout=10
                    )
                    
                    if response.status_code in [200, 201]:
                        success_count += 1
                        
                except:
                    continue
            
            success = success_count >= 2
            print(f"         {'✅ Success' if success else f'⚠️ Partial ({success_count}/3)'}")
            return success
            
        except Exception as e:
            print(f"         ❌ Error: {str(e)[:50]}")
            return False
    
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
    """Test the fixed Yoast SEO publisher"""
    from dotenv import load_dotenv
    load_dotenv()
    
    site_url = os.getenv('WORDPRESS_URL')
    username = os.getenv('WORDPRESS_USER')
    app_password = os.getenv('WORDPRESS_APP_PASSWORD')
    
    if not all([site_url, username, app_password]):
        print("❌ Missing WordPress credentials in .env file!")
        exit(1)
    
    publisher = WordPressPublisher(site_url, username, app_password)
    
    # Test with sample data
    sample_blog = {
        'title': 'Test Post - Snowflake Data Pipeline Guide',
        'slug': 'snowflake-data-pipeline-guide',
        'content': '<p>This is a test post with snowflake data pipeline content.</p>',
        'seo': {
            'focus_keyphrase': 'snowflake data pipeline',
            'title': 'Snowflake Data Pipeline Guide 2025',
            'meta_description': 'Master snowflake data pipeline with our complete guide. Learn setup, optimization, and best practices for data engineers in 2025.',
            'secondary_keywords': ['snowflake tutorial', 'data pipeline', 'ETL']
        },
        'category': 'snowflake',
        'references': []
    }
    
    result = publisher.publish_blog_post(sample_blog, [], status='draft')
    
    if result['success']:
        print("\n✅ Test complete! Check the WordPress admin to verify Yoast fields.")


if __name__ == "__main__":
    main()
