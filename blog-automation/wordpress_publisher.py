#!/usr/bin/env python3
"""
WordPress Publisher - Publishes blog posts to WordPress via REST API
"""

import os
import requests
import base64
from typing import Dict, List, Optional
import json
from datetime import datetime
from dotenv import load_dotenv

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
        
        print(f"✅ WordPress Publisher initialized for: {self.site_url}")
    
    def publish_blog_post(
        self, 
        blog_data: Dict, 
        image_files: List[Dict],
        status: str = 'draft'
    ) -> Dict:
        """
        Publish complete blog post with images
        
        Args:
            blog_data: Blog post data from BlogGenerator
            image_files: List of generated images with local paths
            status: 'draft' or 'publish'
        
        Returns:
            Dictionary with post URL and IDs
        """
        print(f"📤 Publishing blog post: {blog_data['title']}")
        
        try:
            # Step 1: Upload images to WordPress media library
            print("📷 Uploading images...")
            uploaded_images = self._upload_images(image_files)
            
            # Step 2: Get or create category
            print("📁 Setting up category...")
            category_id = self._get_or_create_category(blog_data.get('category', 'Uncategorized'))
            
            # Step 3: Insert images into content
            content_with_images = self._insert_images_into_content(
                blog_data['content'],
                uploaded_images
            )
            
            # Step 4: Build references section
            references_html = self._build_references_section(blog_data.get('references', []))
            
            # Step 5: Combine everything
            full_content = content_with_images + references_html
            
            # Step 6: Create post
            print("✍️  Creating post...")
            post_data = {
                'title': blog_data['title'],
                'content': full_content,
                'status': status,
                'categories': [category_id],
                'meta': {
                    'description': blog_data['seo']['meta_description'],
                    'keywords': ', '.join(blog_data['seo']['secondary_keywords'])
                }
            }
            
            # Set featured image if available
            if uploaded_images and 'id' in uploaded_images[0]:
                post_data['featured_media'] = uploaded_images[0]['id']
            
            response = requests.post(
                f"{self.api_base}/posts",
                headers=self.headers,
                json=post_data
            )
            
            if response.status_code in [200, 201]:
                post_info = response.json()
                result = {
                    'success': True,
                    'post_id': post_info['id'],
                    'post_url': post_info['link'],
                    'edit_url': f"{self.site_url}/wp-admin/post.php?post={post_info['id']}&action=edit",
                    'status': status,
                    'images_uploaded': len(uploaded_images),
                    'published_at': datetime.now().isoformat()
                }
                
                print(f"\n✅ POST PUBLISHED!")
                print(f"   Post ID: {result['post_id']}")
                print(f"   View: {result['post_url']}")
                print(f"   Edit: {result['edit_url']}")
                
                return result
            else:
                error_msg = f"Failed to create post: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }
                
        except Exception as e:
            error_msg = f"Exception during publishing: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                'success': False,
                'error': error_msg
            }
    
    def _upload_images(self, image_files: List[Dict]) -> List[Dict]:
        """Upload images to WordPress media library"""
        uploaded = []
        
        if not image_files:
            return uploaded
        
        for img in image_files:
            if not img.get('generated') or not img.get('local_path'):
                continue
            
            try:
                # Check if file exists
                if not os.path.exists(img['local_path']):
                    print(f"   ⚠️  File not found: {img['local_path']}")
                    continue
                
                # Read image file
                with open(img['local_path'], 'rb') as f:
                    image_data = f.read()
                
                # Get filename
                filename = os.path.basename(img['local_path'])
                
                # Upload to WordPress
                headers = {
                    'Authorization': self.headers['Authorization'],
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'image/png'
                }
                
                response = requests.post(
                    f"{self.api_base}/media",
                    headers=headers,
                    data=image_data
                )
                
                if response.status_code in [200, 201]:
                    media_info = response.json()
                    uploaded.append({
                        **img,
                        'id': media_info['id'],
                        'url': media_info['source_url'],
                        'wp_uploaded': True
                    })
                    print(f"   ✅ Uploaded: {img['placement']}")
                else:
                    print(f"   ⚠️  Failed to upload {img['placement']}: {response.status_code}")
            
            except Exception as e:
                print(f"   ❌ Error uploading {img.get('placement', 'image')}: {str(e)}")
        
        return uploaded
    
    def _get_or_create_category(self, category_name: str) -> int:
        """Get category ID or create if doesn't exist"""
        try:
            # Search for existing category
            response = requests.get(
                f"{self.api_base}/categories",
                headers=self.headers,
                params={'search': category_name}
            )
            
            if response.status_code == 200:
                categories = response.json()
                if categories:
                    return categories[0]['id']
            
            # Create new category
            response = requests.post(
                f"{self.api_base}/categories",
                headers=self.headers,
                json={'name': category_name.title()}
            )
            
            if response.status_code in [200, 201]:
                return response.json()['id']
            
        except Exception as e:
            print(f"   ⚠️  Category error: {e}")
        
        # Return default "Uncategorized" category (ID: 1)
        return 1
    
    def _insert_images_into_content(
        self, 
        content: str, 
        images: List[Dict]
    ) -> str:
        """Insert images into content at appropriate positions"""
        if not images:
            return content
        
        # Find hero image
        hero_img = next((img for img in images if img.get('placement') == 'hero'), None)
        
        # Split content into sections (by H2 tags)
        sections = content.split('<h2>')
        
        result = []
        
        # Add hero image at top if exists
        if hero_img and 'url' in hero_img:
            hero_html = self._create_image_html(hero_img)
            result.append(hero_html)
        
        # Add first section (before first H2)
        if sections[0].strip():
            result.append(sections[0])
        
        # Add remaining sections with images interspersed
        section_images = [img for img in images if img.get('placement') != 'hero' and 'url' in img]
        
        for i, section in enumerate(sections[1:], 1):
            result.append('<h2>' + section)
            
            # Insert image after every 2 sections
            if i % 2 == 0 and section_images:
                img = section_images.pop(0)
                result.append(self._create_image_html(img))
        
        # Add any remaining images at the end
        for img in section_images:
            result.append(self._create_image_html(img))
        
        return '\n\n'.join(result)
    
    def _create_image_html(self, img: Dict) -> str:
        """Create WordPress image HTML"""
        img_id = img.get('id', '')
        img_url = img.get('url', '')
        alt_text = img.get('alt_text', 'Blog image')
        caption = img.get('caption', '')
        
        return f'''
<figure class="wp-block-image size-large">
    <img src="{img_url}" alt="{alt_text}" class="wp-image-{img_id}"/>
    <figcaption>{caption}</figcaption>
</figure>
'''
    
    def _build_references_section(self, references: List[Dict]) -> str:
        """Build references section HTML"""
        if not references:
            return ''
        
        html = '\n\n<h2>References and Further Reading</h2>\n<ul>\n'
        
        for ref in references:
            title = ref.get('title', 'Reference')
            url = ref.get('url', '#')
            description = ref.get('description', '')
            html += f'<li><a href="{url}" target="_blank" rel="noopener">{title}</a> - {description}</li>\n'
        
        html += '</ul>'
        return html
    
    def test_connection(self) -> bool:
        """Test WordPress API connection"""
        try:
            response = requests.get(
                f"{self.api_base}/posts",
                headers=self.headers,
                params={'per_page': 1}
            )
            
            if response.status_code == 200:
                print("✅ WordPress connection successful!")
                return True
            else:
                print(f"❌ WordPress connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ WordPress connection error: {e}")
            return False


def main():
    """Test WordPress publisher"""
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
        print("\nAdd these to your .env file")
        return
    
    print("🔗 Testing WordPress Publisher\n")
    
    publisher = WordPressPublisher(site_url, username, app_password)
    
    # Test connection
    if not publisher.test_connection():
        return
    
    # Test with sample data
    sample_blog = {
        'title': 'Test Blog Post from Automation',
        'content': '<h2>Introduction</h2><p>This is a test post generated by the automation system.</p><h2>Main Content</h2><p>Testing the WordPress REST API integration.</p>',
        'category': 'test',
        'seo': {
            'title': 'Test Blog Post',
            'meta_description': 'A test blog post created by automation',
            'focus_keyword': 'test automation',
            'secondary_keywords': ['wordpress', 'automation', 'testing']
        },
        'references': [
            {
                'title': 'WordPress REST API',
                'url': 'https://developer.wordpress.org/rest-api/',
                'description': 'Official WordPress REST API documentation'
            }
        ]
    }
    
    sample_images = []  # No images for this test
    
    # Publish as draft
    print("\n📤 Publishing test post...\n")
    result = publisher.publish_blog_post(sample_blog, sample_images, status='draft')
    
    if result['success']:
        print("\n✅ Test successful!")
        print(f"   View your draft at: {result['post_url']}")
        print(f"   Edit at: {result['edit_url']}")
    else:
        print(f"\n❌ Test failed: {result.get('error')}")


if __name__ == "__main__":
    main()
