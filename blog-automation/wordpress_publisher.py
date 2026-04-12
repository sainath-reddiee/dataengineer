#!/usr/bin/env python3
"""
WordPress Publisher - COMPLETE VERSION - NO MISSING CODE
Handles both HTML content and Gutenberg blocks
Includes Yoast SEO support
"""

import os
import requests
import base64
from typing import Dict, List, Optional
import json
from datetime import datetime
import traceback
import hashlib
import time
import re

class WordPressPublisher:
    def __init__(self, site_url: str, username: str, app_password: str):
        """
        Initialize WordPress publisher
        
        Args:
            site_url: WordPress site URL (e.g., https://yourdomain.com)
            username: WordPress username
            app_password: WordPress Application Password (not regular password!)
        """
        self.site_url = site_url.rstrip('/')
        self.api_base = f"{self.site_url}/wp-json/wp/v2"
        
        # Create authentication token
        credentials = f"{username}:{app_password}"
        token = base64.b64encode(credentials.encode()).decode('utf-8')
        self.headers = {
            'Authorization': f'Basic {token}',
            'Content-Type': 'application/json'
        }
        
        print(f"✅ WordPress Publisher Initialized")
        print(f"   Site: {self.site_url}")
        print(f"   API Base: {self.api_base}")
    
    def publish_blog_post(
        self, 
        blog_data: Dict, 
        image_files: List[Dict],
        status: str = 'draft'
    ) -> Dict:
        """
        Publish complete blog post with images
        
        Args:
            blog_data: Blog post data from BlogGenerator (supports both 'content' and 'content_blocks')
            image_files: List of generated images with local paths
            status: 'draft' or 'publish'
        
        Returns:
            Dictionary with post URL and IDs
        """
        print(f"\n{'='*70}")
        print(f"📤 PUBLISHING BLOG POST")
        print(f"{'='*70}")
        print(f"Title: {blog_data['title']}")
        print(f"Status: {status}")
        
        try:
            # Step 1: Upload images to WordPress media library
            print("\n📷 STEP 1: Uploading images...")
            uploaded_images = self._upload_images(image_files)
            print(f"   ✅ Uploaded: {len(uploaded_images)}/{len(image_files)} images")
            
            # Step 2: Get or create category
            print("\n📁 STEP 2: Setting up category...")
            category_id = self._get_or_create_category(blog_data.get('category', 'Uncategorized'))
            
            # Step 3: Prepare content (HANDLES BOTH FORMATS)
            print("\n📝 STEP 3: Preparing content...")
            content_html = self._get_content_html(blog_data)
            
            # Insert images into content
            content_with_images = self._insert_images_into_content(
                content_html,
                uploaded_images
            )
            
            # Build references section
            references_html = self._build_references_section(blog_data.get('references', []))
            
            # Combine everything
            full_content = content_with_images + references_html
            print(f"   ✅ Content ready: {len(full_content)} characters")
            
            # Step 4: Create post
            print("\n✍️  STEP 4: Creating WordPress post...")
            seo_data = blog_data.get('seo', {})
            slug = blog_data.get('slug', '')
            meta_desc = seo_data.get('meta_description', '')
            post_data = {
                'title': blog_data['title'],
                'content': full_content,
                'status': status,
                'slug': slug,
                'excerpt': meta_desc,
                'categories': [category_id],
                'meta': self._build_yoast_meta(seo_data),
                'featured_media': uploaded_images[0]['id'] if uploaded_images and 'id' in uploaded_images[0] else None
            }
            
            response = requests.post(
                f"{self.api_base}/posts",
                headers=self.headers,
                json=post_data,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                post_info = response.json()
                post_id = post_info['id']
                
                # Follow-up: explicitly update Yoast meta fields via a separate PUT
                # WordPress REST API sometimes ignores custom meta on initial POST
                yoast_meta = self._build_yoast_meta(seo_data)
                yoast_verified = False
                if yoast_meta:
                    try:
                        meta_update = {'meta': yoast_meta}
                        meta_resp = requests.post(
                            f"{self.api_base}/posts/{post_id}",
                            headers=self.headers,
                            json=meta_update,
                            timeout=15
                        )
                        if meta_resp.status_code in [200, 201]:
                            print(f"   ✅ Yoast SEO meta fields sent successfully")
                        else:
                            print(f"   ⚠️  Yoast meta update returned {meta_resp.status_code}: {meta_resp.text[:100]}")
                    except Exception as e:
                        print(f"   ⚠️  Could not update Yoast meta: {e}")
                    
                    # Verify meta actually persisted by reading the post back
                    yoast_verified = self._verify_yoast_meta(post_id, yoast_meta)
                
                # Verify slug was set correctly
                slug_verified = False
                if slug:
                    slug_verified = self._verify_slug(post_id, slug)
                
                result = {
                    'success': True,
                    'post_id': post_id,
                    'post_url': post_info['link'],
                    'edit_url': f"{self.site_url}/wp-admin/post.php?post={post_id}&action=edit",
                    'status': status,
                    'images_uploaded': len(uploaded_images),
                    'yoast_seo': {
                        **seo_data,
                        'verified': yoast_verified,
                    },
                    'slug_verified': slug_verified,
                    'published_at': datetime.now().isoformat()
                }
                
                print(f"\n{'='*70}")
                print(f"✅ POST PUBLISHED SUCCESSFULLY!")
                print(f"{'='*70}")
                print(f"Post ID: {result['post_id']}")
                print(f"View: {result['post_url']}")
                print(f"Edit: {result['edit_url']}")
                
                if seo_data:
                    print(f"\n📊 Yoast SEO:")
                    print(f"   Focus Keyphrase: {seo_data.get('focus_keyphrase', 'N/A')}")
                    print(f"   SEO Title: {seo_data.get('title', 'N/A')}")
                    print(f"   Meta Description: {seo_data.get('meta_description', 'N/A')[:60]}...")
                    print(f"   Meta Verified: {'YES' if yoast_verified else 'NO - check Yoast REST API settings'}")
                print(f"   Slug Verified: {'YES' if slug_verified else 'NO - slug may have been altered'}")
                
                print(f"{'='*70}\n")
                
                return result
            else:
                error_msg = f"Failed to create post: {response.status_code} - {response.text[:200]}"
                print(f"❌ {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }
        
        except Exception as e:
            error_msg = f"Error publishing post: {str(e)}"
            print(f"❌ {error_msg}")
            traceback.print_exc()
            return {
                'success': False,
                'error': error_msg
            }
    
    def _get_content_html(self, blog_data: Dict) -> str:
        """
        Get HTML content - handles BOTH formats:
        1. Gutenberg blocks (from blog_generator_free.py with Tavily)
        2. Direct HTML string (from older generators)
        """
        
        # Format 1: Gutenberg blocks
        if 'content_blocks' in blog_data:
            print("   📦 Format: Gutenberg blocks")
            return self._blocks_to_html(blog_data['content_blocks'])
        
        # Format 2: Direct HTML
        elif 'content' in blog_data:
            print("   📄 Format: HTML string")
            return blog_data['content']
        
        else:
            raise Exception("No content found! Expected 'content' or 'content_blocks' in blog_data")
    
    def _blocks_to_html(self, blocks: List[Dict]) -> str:
        """
        Convert Gutenberg blocks to WordPress Gutenberg HTML with block comments.
        
        WordPress requires <!-- wp:blocktype --> comments to render blocks properly
        in the Block Editor. Without these, content is treated as Classic Editor
        and code blocks, tables, etc. lose their formatting.
        
        Args:
            blocks: List of Gutenberg block dictionaries
        
        Returns:
            Gutenberg-formatted HTML string with block comments
        """
        html_parts = []
        
        for block in blocks:
            block_name = block.get('blockName', '')
            attrs = block.get('attrs', {})
            content = block.get('innerContent', [''])[0]
            
            # Skip empty blocks (but allow separator which generates its own HTML)
            if block_name != 'core/separator' and (not content or not content.strip()):
                continue
            
            # Wrap each block type in its Gutenberg block comment
            if block_name == 'core/paragraph':
                html_parts.append(f'<!-- wp:paragraph -->\n{content}\n<!-- /wp:paragraph -->')
            elif block_name == 'core/heading':
                level = attrs.get('level', 2)
                attrs_json = f' {{"level":{level}}}' if level != 2 else ''
                html_parts.append(f'<!-- wp:heading{attrs_json} -->\n{content}\n<!-- /wp:heading -->')
            elif block_name == 'core/code':
                html_parts.append(f'<!-- wp:code -->\n{content}\n<!-- /wp:code -->')
            elif block_name == 'core/list':
                html_parts.append(f'<!-- wp:list -->\n{content}\n<!-- /wp:list -->')
            elif block_name == 'core/quote':
                html_parts.append(f'<!-- wp:quote -->\n{content}\n<!-- /wp:quote -->')
            elif block_name == 'core/image':
                html_parts.append(f'<!-- wp:image -->\n{content}\n<!-- /wp:image -->')
            elif block_name == 'core/table':
                html_parts.append(f'<!-- wp:table -->\n{content}\n<!-- /wp:table -->')
            elif block_name == 'core/separator':
                html_parts.append('<!-- wp:separator -->\n<hr class="wp-block-separator"/>\n<!-- /wp:separator -->')
            else:
                # Pass through any other block type with generic wrapper
                if content.strip():
                    html_parts.append(content)
        
        html = '\n\n'.join(html_parts)
        print(f"   ✅ Converted {len(blocks)} blocks → {len(html)} characters Gutenberg HTML")
        return html
    
    def _build_yoast_meta(self, seo_data: Dict) -> Dict:
        """
        Build Yoast SEO meta fields
        
        Args:
            seo_data: SEO data dictionary with focus_keyphrase, title, meta_description
        
        Returns:
            Dictionary of Yoast meta fields
        """
        if not seo_data:
            return {}
        
        meta = {
            '_yoast_wpseo_focuskw': seo_data.get('focus_keyphrase', ''),
            '_yoast_wpseo_title': seo_data.get('title', ''),
            '_yoast_wpseo_metadesc': seo_data.get('meta_description', ''),
        }
        
        # Remove empty values so WordPress doesn't store blank meta
        return {k: v for k, v in meta.items() if v}
    
    def _verify_yoast_meta(self, post_id: int, expected_meta: Dict) -> bool:
        """
        Verify Yoast SEO meta fields actually persisted by reading the post back.
        
        WordPress silently ignores meta fields if:
        - Yoast REST API is not enabled in plugin settings
        - The meta key is not registered with show_in_rest=true
        - The user lacks edit_posts capability for meta
        
        Args:
            post_id: WordPress post ID
            expected_meta: Dict of meta keys/values we tried to set
        
        Returns:
            True if all meta fields were confirmed, False otherwise
        """
        try:
            resp = requests.get(
                f"{self.api_base}/posts/{post_id}",
                headers=self.headers,
                params={'_fields': 'meta,slug'},
                timeout=15
            )
            if resp.status_code != 200:
                print(f"   ⚠️  Could not verify meta: GET returned {resp.status_code}")
                return False
            
            post_data = resp.json()
            saved_meta = post_data.get('meta', {})
            
            all_verified = True
            for key, expected_value in expected_meta.items():
                actual_value = saved_meta.get(key, '')
                if actual_value == expected_value:
                    print(f"   ✅ Verified {key}")
                else:
                    print(f"   ❌ {key} NOT persisted (expected: '{expected_value[:50]}...', got: '{str(actual_value)[:50]}')")
                    all_verified = False
            
            if not all_verified:
                print(f"   ⚠️  Yoast meta fields did not persist. Check:")
                print(f"      1. Yoast SEO > General > Features > 'REST API: Head endpoint' is ON")
                print(f"      2. Application Password user has 'edit_posts' capability")
                print(f"      3. Yoast plugin is active and up to date")
            
            return all_verified
            
        except Exception as e:
            print(f"   ⚠️  Meta verification failed: {e}")
            return False
    
    def _verify_slug(self, post_id: int, expected_slug: str) -> bool:
        """
        Verify the post slug was set correctly.
        
        WordPress may alter the slug (appending -2, -3, etc.) if a duplicate exists.
        
        Args:
            post_id: WordPress post ID
            expected_slug: The slug we intended to set
        
        Returns:
            True if slug matches, False otherwise
        """
        try:
            resp = requests.get(
                f"{self.api_base}/posts/{post_id}",
                headers=self.headers,
                params={'_fields': 'slug'},
                timeout=10
            )
            if resp.status_code == 200:
                actual_slug = resp.json().get('slug', '')
                if actual_slug == expected_slug:
                    print(f"   ✅ Slug verified: {actual_slug}")
                    return True
                else:
                    print(f"   ⚠️  Slug mismatch: expected '{expected_slug}', got '{actual_slug}'")
                    return False
            return False
        except Exception as e:
            print(f"   ⚠️  Slug verification failed: {e}")
            return False
    
    def _upload_images(self, image_files: List[Dict]) -> List[Dict]:
        """
        Upload images to WordPress media library
        
        Args:
            image_files: List of image dictionaries with local_path
        
        Returns:
            List of uploaded images with WordPress IDs and URLs
        """
        uploaded = []
        
        for idx, img in enumerate(image_files, 1):
            if not img.get('generated') or not img.get('local_path'):
                continue
            
            try:
                # Check if file exists
                if not os.path.exists(img['local_path']):
                    print(f"   ⚠️  Image {idx}: File not found at {img['local_path']}")
                    continue
                
                # Read image file
                with open(img['local_path'], 'rb') as f:
                    image_data = f.read()
                
                # Get filename and create unique name
                file_ext = os.path.splitext(img['local_path'])[1]
                file_hash = hashlib.md5(image_data).hexdigest()[:8]
                timestamp = int(time.time())
                placement = img.get('placement', 'img').replace('/', '_')
                unique_filename = f"blog_{timestamp}_{placement}_{file_hash}{file_ext}"
                
                # Determine content type
                content_type = 'image/jpeg' if file_ext.lower() in ['.jpg', '.jpeg'] else 'image/png'
                
                # Upload to WordPress
                headers = {
                    'Authorization': self.headers['Authorization'],
                    'Content-Disposition': f'attachment; filename="{unique_filename}"',
                    'Content-Type': content_type
                }
                
                response = requests.post(
                    f"{self.api_base}/media",
                    headers=headers,
                    data=image_data,
                    timeout=60
                )
                
                if response.status_code in [200, 201]:
                    media_info = response.json()
                    uploaded.append({
                        **img,
                        'id': media_info['id'],
                        'url': media_info['source_url'],
                        'wp_uploaded': True
                    })
                    file_size = len(image_data) / 1024
                    print(f"   ✅ Image {idx}: ID {media_info['id']} ({file_size:.1f} KB)")
                else:
                    print(f"   ⚠️  Image {idx}: Upload failed - HTTP {response.status_code}")
                
                # Rate limiting
                time.sleep(0.5)
            
            except Exception as e:
                print(f"   ❌ Image {idx}: Error - {str(e)[:60]}")
        
        return uploaded
    
    def _get_or_create_category(self, category_name: str) -> int:
        """
        Get category ID or create if doesn't exist
        
        Args:
            category_name: Name of the category
        
        Returns:
            Category ID (int)
        """
        try:
            # Search for existing category
            response = requests.get(
                f"{self.api_base}/categories",
                headers=self.headers,
                params={'search': category_name},
                timeout=10
            )
            
            if response.status_code == 200:
                categories = response.json()
                if categories and len(categories) > 0:
                    print(f"   ✅ Found category: {category_name} (ID: {categories[0]['id']})")
                    return categories[0]['id']
            
            # Create new category
            print(f"   📝 Creating category: {category_name}")
            response = requests.post(
                f"{self.api_base}/categories",
                headers=self.headers,
                json={'name': category_name.title()},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                cat_data = response.json()
                print(f"   ✅ Created category (ID: {cat_data['id']})")
                return cat_data['id']
        
        except Exception as e:
            print(f"   ⚠️  Category error: {str(e)[:50]}")
        
        # Return default "Uncategorized" category (ID: 1)
        print(f"   ℹ️  Using default category (ID: 1)")
        return 1
    
    def _insert_images_into_content(
        self, 
        content: str, 
        images: List[Dict]
    ) -> str:
        """
        Insert images into content at appropriate positions
        
        Args:
            content: HTML content string
            images: List of uploaded images with URLs
        
        Returns:
            Content with images inserted
        """
        if not images:
            return content
        
        # Find hero image
        hero_img = next((img for img in images if img.get('placement') == 'hero'), None)
        
        # Split content into sections by heading blocks.
        # Handle both Gutenberg format (<!-- wp:heading --> before <h2>) and raw HTML (<h2> only).
        # Use regex to split on the Gutenberg heading comment OR bare <h2> tag.
        heading_pattern = re.compile(r'(<!-- wp:heading.*?-->\s*<h2>|<h2>)', re.DOTALL)
        parts = heading_pattern.split(content)
        
        # Reassemble into sections: parts[0] is before first heading,
        # then alternating [heading_prefix, section_content, heading_prefix, section_content, ...]
        sections = [parts[0]]  # Content before first heading
        for i in range(1, len(parts), 2):
            # Recombine heading prefix with its content
            heading_prefix = parts[i] if i < len(parts) else ''
            section_content = parts[i + 1] if (i + 1) < len(parts) else ''
            sections.append(heading_prefix + section_content)
        
        result = []
        
        # Add hero image at top if exists
        if hero_img and 'url' in hero_img:
            result.append(self._create_image_html(hero_img))
        
        # Add first section (before first H2)
        if sections[0].strip():
            result.append(sections[0])
        
        # Add remaining sections with images interspersed
        section_images = [img for img in images if img.get('placement') != 'hero' and 'url' in img]
        
        for i, section in enumerate(sections[1:], 1):
            result.append(section)
            
            # Insert image after every 2 sections
            if i % 2 == 0 and section_images:
                img = section_images.pop(0)
                result.append(self._create_image_html(img))
        
        # Add any remaining images at the end
        for img in section_images:
            result.append(self._create_image_html(img))
        
        return '\n\n'.join(result)
    
    def _create_image_html(self, img: Dict) -> str:
        """
        Create WordPress image HTML with figure and caption
        
        Args:
            img: Image dictionary with url, alt_text, caption, id
        
        Returns:
            HTML string for the image
        """
        return f'''
<figure class="wp-block-image size-large">
    <img src="{img.get('url', '')}" alt="{img.get('alt_text', '')}" class="wp-image-{img.get('id', '')}"/>
    <figcaption>{img.get('caption', '')}</figcaption>
</figure>
'''
    
    def _build_references_section(self, references: List[Dict]) -> str:
        """
        Build references section HTML
        
        Args:
            references: List of reference dictionaries with title, url, description
        
        Returns:
            HTML string for references section
        """
        if not references:
            return ''
        
        html = '\n\n<h2>References and Further Reading</h2>\n<ul>\n'
        
        for ref in references:
            title = ref.get('title', 'Source')
            url = ref.get('url', '#')
            description = ref.get('description', '')
            
            html += f'<li><a href="{url}" target="_blank" rel="noopener">{title}</a>'
            if description:
                html += f' - {description}'
            html += '</li>\n'
        
        html += '</ul>'
        return html
    
    def update_post_seo(self, post_id: int, seo_data: Dict) -> bool:
        """
        Update post SEO using Yoast or RankMath plugin
        
        Args:
            post_id: WordPress post ID
            seo_data: SEO data dictionary
        
        Returns:
            True if successful, False otherwise
        """
        try:
            meta_data = {
                '_yoast_wpseo_title': seo_data.get('title'),
                '_yoast_wpseo_metadesc': seo_data.get('meta_description'),
                '_yoast_wpseo_focuskw': seo_data.get('focus_keyword'),
            }
            
            for key, value in meta_data.items():
                response = requests.post(
                    f"{self.api_base}/posts/{post_id}",
                    headers=self.headers,
                    json={'meta': {key: value}},
                    timeout=10
                )
                
                if response.status_code not in [200, 201]:
                    print(f"⚠️  Failed to update SEO meta: {key}")
                    return False
            
            return True
        
        except Exception as e:
            print(f"❌ Error updating SEO: {str(e)}")
            return False
    
    def schedule_post(self, post_id: int, publish_datetime: str) -> bool:
        """
        Schedule post for future publication
        
        Args:
            post_id: WordPress post ID
            publish_datetime: ISO format datetime string (e.g., "2025-10-15T10:00:00")
        
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.post(
                f"{self.api_base}/posts/{post_id}",
                headers=self.headers,
                json={
                    'status': 'future',
                    'date': publish_datetime
                },
                timeout=10
            )
            
            return response.status_code in [200, 201]
        
        except Exception as e:
            print(f"❌ Error scheduling post: {str(e)}")
            return False
    
    def get_post_stats(self, post_id: int) -> Dict:
        """
        Get post statistics
        
        Args:
            post_id: WordPress post ID
        
        Returns:
            Dictionary with post statistics
        """
        try:
            response = requests.get(
                f"{self.api_base}/posts/{post_id}",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                post = response.json()
                return {
                    'id': post['id'],
                    'title': post['title']['rendered'],
                    'status': post['status'],
                    'url': post['link'],
                    'date_published': post['date'],
                    'modified': post['modified'],
                    'categories': post['categories'],
                    'word_count': len(post['content']['rendered'].split())
                }
            
            return {}
        
        except Exception as e:
            print(f"❌ Error getting post stats: {str(e)}")
            return {}


def main():
    """Test WordPress publisher with both content formats"""
    from dotenv import load_dotenv
    load_dotenv()
    
    site_url = os.getenv('WORDPRESS_URL')
    username = os.getenv('WORDPRESS_USER')
    app_password = os.getenv('WORDPRESS_APP_PASSWORD')
    
    if not all([site_url, username, app_password]):
        print("❌ Missing WordPress credentials!")
        print("\nPlease set environment variables:")
        print("  - WORDPRESS_URL")
        print("  - WORDPRESS_USER")
        print("  - WORDPRESS_APP_PASSWORD")
        return
    
    print("🔗 Testing WordPress Publisher\n")
    
    publisher = WordPressPublisher(site_url, username, app_password)
    
    # Test 1: Gutenberg blocks format (from blog_generator_free.py)
    print("\n" + "="*70)
    print("TEST 1: Gutenberg Blocks Format")
    print("="*70)
    
    test_blog_blocks = {
        'title': 'Test Post - Gutenberg Blocks Format',
        'slug': 'test-gutenberg-blocks-format',
        'content_blocks': [
            {
                'blockName': 'core/paragraph',
                'attrs': {},
                'innerContent': ['<p>This is a test paragraph from Gutenberg blocks format.</p>']
            },
            {
                'blockName': 'core/heading',
                'attrs': {'level': 2},
                'innerContent': ['<h2>Introduction to Testing</h2>']
            },
            {
                'blockName': 'core/paragraph',
                'attrs': {},
                'innerContent': ['<p>Another paragraph with important information about testing.</p>']
            }
        ],
        'seo': {
            'focus_keyphrase': 'gutenberg blocks',
            'title': 'Gutenberg Blocks Test 2025',
            'meta_description': 'Testing Gutenberg blocks format with WordPress publisher to ensure compatibility.'
        },
        'category': 'testing',
        'references': [
            {
                'title': 'WordPress Block Editor',
                'url': 'https://wordpress.org/gutenberg/',
                'description': 'Official Gutenberg documentation'
            }
        ]
    }
    
    result1 = publisher.publish_blog_post(test_blog_blocks, [], status='draft')
    
    if result1['success']:
        print(f"\n✅ Test 1 successful!")
        print(f"   View: {result1['post_url']}")
        print(f"   Edit: {result1['edit_url']}")
    else:
        print(f"\n❌ Test 1 failed: {result1.get('error')}")
    
    # Test 2: HTML string format (from older generators)
    print("\n" + "="*70)
    print("TEST 2: HTML String Format")
    print("="*70)
    
    test_blog_html = {
        'title': 'Test Post - HTML String Format',
        'slug': 'test-html-string-format',
        'content': '<h2>Introduction</h2><p>This is a test post with HTML string content.</p><h2>Main Section</h2><p>More content in HTML format.</p>',
        'seo': {
            'focus_keyphrase': 'html format',
            'title': 'HTML Format Test 2025',
            'meta_description': 'Testing HTML string format with WordPress publisher to ensure backward compatibility.'
        },
        'category': 'testing',
        'references': []
    }
    
    result2 = publisher.publish_blog_post(test_blog_html, [], status='draft')
    
    if result2['success']:
        print(f"\n✅ Test 2 successful!")
        print(f"   View: {result2['post_url']}")
        print(f"   Edit: {result2['edit_url']}")
    else:
        print(f"\n❌ Test 2 failed: {result2.get('error')}")
    
    print("\n" + "="*70)
    print("TESTING COMPLETE")
    print("="*70)
    print("\nBoth content formats are supported:")
    print("  ✅ Gutenberg blocks (content_blocks)")
    print("  ✅ HTML strings (content)")
    print("\nCheck your WordPress admin to verify the posts!")


if __name__ == "__main__":
    main()
