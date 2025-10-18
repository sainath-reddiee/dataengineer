#!/usr/bin/env python3
"""
WordPress Publisher - REST API with Aggressive Anti-Cache Strategy
Final attempt to force new post creation
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
import random
import uuid

class WordPressPublisher:
    def __init__(self, site_url: str, username: str, app_password: str):
        """Initialize WordPress REST API publisher"""
        self.site_url = site_url.rstrip('/')
        self.api_base = f"{self.site_url}/wp-json/wp/v2"
        
        credentials = f"{username}:{app_password}"
        token = base64.b64encode(credentials.encode()).decode('utf-8')
        
        self.headers = {
            'Authorization': f'Basic {token}',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-With': 'XMLHttpRequest',
        }
        
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        print(f"✅ WordPress REST API Publisher initialized")
        print(f"   Site: {self.site_url}")
        print(f"   API: {self.api_base}")
    
    def _normalize_response(self, response_data):
        """Normalize WordPress API response"""
        if isinstance(response_data, list):
            if len(response_data) > 0 and isinstance(response_data[0], dict):
                return response_data[0]
            return None
        elif isinstance(response_data, dict):
            return response_data
        return None
    
    def publish_blog_post(
        self, 
        blog_data: Dict, 
        image_files: List[Dict],
        status: str = 'draft'
    ) -> Dict:
        """Publish blog post - GUARANTEED NEW POST"""
        print(f"\n{'='*70}")
        print(f"📤 CREATING NEW POST (ANTI-CACHE MODE)")
        print(f"{'='*70}")
        print(f"Title: {blog_data['title']}")
        print(f"Status: {status}")
        print(f"{'='*70}\n")
        
        try:
            # Upload images
            print("📷 STEP 1: Uploading images...")
            uploaded_images = self._upload_images(image_files)
            print(f"   ✅ {len(uploaded_images)}/{len(image_files)} uploaded\n")
            
            # Get category
            print("📁 STEP 2: Category...")
            category_id = self._get_or_create_category(blog_data.get('category', 'Uncategorized'))
            print()
            
            # Prepare content
            print("📝 STEP 3: Preparing content...")
            content_with_images = self._insert_images_into_content(
                blog_data['content'],
                uploaded_images
            )
            references_html = self._build_references_section(blog_data.get('references', []))
            full_content = content_with_images + references_html
            print(f"   Content: {len(full_content)} chars\n")
            
            # CRITICAL: Add unique identifier to title temporarily
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            temp_unique_title = f"{blog_data['title']} [TEMP_{unique_id}]"
            
            print("✍️  STEP 4: Creating post with unique identifier...")
            print("   " + "-"*66)
            print(f"   Using temporary unique title to bypass cache")
            
            # Post data with unique title
            post_data = {
                'title': temp_unique_title,
                'content': full_content,
                'status': status,
                'categories': [category_id],
                'comment_status': 'open',
                'ping_status': 'open',
            }
            
            if uploaded_images and 'id' in uploaded_images[0]:
                post_data['featured_media'] = uploaded_images[0]['id']
            
            # Create post
            print(f"   📤 Creating post...")
            response = self.session.post(
                f"{self.api_base}/posts",
                json=post_data,
                timeout=30
            )
            
            print(f"   📊 Response: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                error_msg = self._parse_error_response(response)
                raise Exception(f"Failed to create post: {error_msg}")
            
            raw_response = response.json()
            post_info = self._normalize_response(raw_response)
            
            if not post_info or 'id' not in post_info:
                raise Exception("Invalid response - no post ID")
            
            post_id = post_info['id']
            print(f"   ✅ Post created with ID: {post_id}")
            
            # CRITICAL: Now update the post with the REAL title
            print(f"\n   🔄 Updating post with real title...")
            time.sleep(1)  # Brief pause
            
            update_data = {
                'title': blog_data['title']  # Real title without unique ID
            }
            
            update_response = self.session.post(
                f"{self.api_base}/posts/{post_id}",
                json=update_data,
                timeout=30
            )
            
            if update_response.status_code in [200, 201]:
                print(f"   ✅ Title updated successfully")
                updated_info = self._normalize_response(update_response.json())
                post_link = updated_info.get('link', f"{self.site_url}/?p={post_id}")
            else:
                print(f"   ⚠️  Title update failed, but post exists")
                post_link = f"{self.site_url}/?p={post_id}"
            
            # Verify the post
            print(f"\n   🔍 Verifying post...")
            time.sleep(1)
            
            verify_response = self.session.get(
                f"{self.api_base}/posts/{post_id}",
                timeout=10
            )
            
            if verify_response.status_code == 200:
                verify_data = self._normalize_response(verify_response.json())
                verify_title = verify_data.get('title', {})
                if isinstance(verify_title, dict):
                    verify_title = verify_title.get('rendered', '')
                
                print(f"      Title: {verify_title[:60]}...")
                print(f"      Status: {verify_data.get('status', 'unknown')}")
                
                # Check if it's our title
                is_correct = (
                    verify_title.strip() == blog_data['title'].strip() or
                    temp_unique_title in verify_title
                )
                
                if is_correct:
                    print(f"      ✅ Verified - this is our new post!")
                else:
                    print(f"      ⚠️  Title doesn't match, but post exists")
            
            print(f"\n   " + "-"*66)
            
            result = {
                'success': True,
                'post_id': post_id,
                'post_url': post_link,
                'edit_url': f"{self.site_url}/wp-admin/post.php?post={post_id}&action=edit",
                'status': status,
                'images_uploaded': len(uploaded_images),
                'published_at': datetime.now().isoformat()
            }
            
            print(f"\n{'='*70}")
            print(f"✅ POST CREATED!")
            print(f"{'='*70}")
            print(f"Post ID: {result['post_id']}")
            print(f"View: {result['post_url']}")
            print(f"Edit: {result['edit_url']}")
            print(f"{'='*70}")
            
            return result
            
        except Exception as e:
            print(f"\n❌ Error: {str(e)}")
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def _upload_images(self, image_files: List[Dict]) -> List[Dict]:
        """Upload images"""
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
        """Parse error"""
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
        """Get or create category"""
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
        """Insert images"""
        if not images:
            return content
        
        hero_img = next((img for img in images if img.get('placement') == 'hero'), None)
        sections = content.split('<h2>')
        result = []
        
        if hero_img and 'url' in hero_img:
            result.append(self._create_image_html(hero_img))
        
        if sections[0].strip():
            result.append(sections[0])
        
        section_images = [img for img in images if img.get('placement') != 'hero' and 'url' in img]
        
        for i, section in enumerate(sections[1:], 1):
            result.append('<h2>' + section)
            if i % 2 == 0 and section_images:
                result.append(self._create_image_html(section_images.pop(0)))
        
        for img in section_images:
            result.append(self._create_image_html(img))
        
        return '\n\n'.join(result)
    
    def _create_image_html(self, img: Dict) -> str:
        """Create image HTML"""
        return f'''
<figure class="wp-block-image size-large">
    <img src="{img.get('url', '')}" alt="{img.get('alt_text', '')}" class="wp-image-{img.get('id', '')}"/>
    <figcaption>{img.get('caption', '')}</figcaption>
</figure>
'''
    
    def _build_references_section(self, references: List[Dict]) -> str:
        """Build references"""
        if not references:
            return ''
        html = '\n\n<h2>References and Further Reading</h2>\n<ul>\n'
        for ref in references:
            html += f'<li><a href="{ref["url"]}" target="_blank" rel="noopener">{ref["title"]}</a> - {ref["description"]}</li>\n'
        html += '</ul>'
        return html


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    site_url = os.getenv('WORDPRESS_URL')
    username = os.getenv('WORDPRESS_USER')
    app_password = os.getenv('WORDPRESS_APP_PASSWORD')
    
    if not all([site_url, username, app_password]):
        print("❌ Missing credentials")
        exit(1)
    
    print("\n" + "="*70)
    print("WordPress REST API Publisher - Anti-Cache Version")
    print("="*70)
    print("\nStrategy: Create with unique title, then update to real title")
    print("This ensures a NEW post is always created")
    print("="*70 + "\n")
