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
        references_html = self._build_references_section(blog_data['references'])
        
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
            },
            'featured_media': uploaded_images[0]['id'] if uploaded_images else None
        }
        
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
    
    def _upload_images(self, image_files: List[Dict]) -> List[Dict]:
        """Upload images to WordPress media library"""
        uploaded = []
        
        for img in image_files:
            if not img.get('generated') or not img.get('local_path'):
                continue
            
            try:
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
                print(f"   ❌ Error uploading {img['placement']}: {str(e)}")
        
        return uploaded
    
    def _get_or_create_category(self, category_name: str) -> int:
        """Get category ID or create if doesn't exist"""
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
        hero_img = next((img for img in images if img['placement'] == 'hero'), None)
        
        # Split content into sections (by H2 tags)
        sections = content.split('<h2>')
        
        result = []
        
        # Add hero image at top if exists
        if hero_