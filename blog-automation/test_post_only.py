#!/usr/bin/env python3
"""
Test ONLY post creation (Step 4) - No images, no content generation
Quick test to isolate the WordPress API issue
"""

import os
import requests
import base64
import json
from datetime import datetime
from dotenv import load_dotenv
import uuid

def test_post_creation():
    """Test creating a simple WordPress post"""
    
    load_dotenv()
    
    site_url = os.getenv('WORDPRESS_URL').rstrip('/')
    username = os.getenv('WORDPRESS_USER')
    app_password = os.getenv('WORDPRESS_APP_PASSWORD')
    
    if not all([site_url, username, app_password]):
        print("❌ Missing credentials")
        return
    
    api_base = f"{site_url}/wp-json/wp/v2"
    credentials = f"{username}:{app_password}"
    token = base64.b64encode(credentials.encode()).decode('utf-8')
    
    headers = {
        'Authorization': f'Basic {token}',
        'Content-Type': 'application/json',
        'User-Agent': 'Python-WordPress-Client/1.0'
    }
    
    print("="*70)
    print("TESTING POST CREATION ONLY")
    print("="*70)
    print(f"Site: {site_url}")
    print(f"API: {api_base}")
    print("="*70 + "\n")
    
    # Test 1: Create with completely random title
    print("TEST 1: Creating post with random UUID title")
    print("-"*70)
    
    random_id = str(uuid.uuid4())
    test_title_1 = f"TEST POST {random_id}"
    
    post_data_1 = {
        'title': test_title_1,
        'content': f'<p>This is a test post created at {datetime.now().isoformat()}</p><p>UUID: {random_id}</p>',
        'status': 'draft'
    }
    
    print(f"Title: {test_title_1}")
    print(f"POST to: {api_base}/posts")
    print()
    
    response_1 = requests.post(
        f"{api_base}/posts",
        headers=headers,
        json=post_data_1,
        timeout=30
    )
    
    print(f"Response Status: {response_1.status_code}")
    print(f"Response Headers:")
    print(f"  Content-Type: {response_1.headers.get('Content-Type')}")
    print(f"  X-WP-Total: {response_1.headers.get('X-WP-Total')}")
    print(f"  X-WP-TotalPages: {response_1.headers.get('X-WP-TotalPages')}")
    
    if response_1.status_code in [200, 201]:
        data_1 = response_1.json()
        
        # Normalize
        if isinstance(data_1, list):
            data_1 = data_1[0] if len(data_1) > 0 else {}
        
        returned_id = data_1.get('id')
        returned_title = data_1.get('title', {})
        if isinstance(returned_title, dict):
            returned_title = returned_title.get('rendered', '')
        
        print(f"\nReturned:")
        print(f"  ID: {returned_id}")
        print(f"  Title: {returned_title}")
        
        if test_title_1 == returned_title:
            print(f"  ✅ SUCCESS - New post created!")
            print(f"\nCleaning up - deleting test post {returned_id}...")
            
            delete_response = requests.delete(
                f"{api_base}/posts/{returned_id}",
                headers=headers,
                params={'force': True}
            )
            
            if delete_response.status_code == 200:
                print(f"  ✅ Test post deleted")
            else:
                print(f"  ⚠️  Delete failed - please delete manually")
            
            return True
        else:
            print(f"  ❌ FAILED - Got different post")
            print(f"     Sent: {test_title_1}")
            print(f"     Got:  {returned_title}")
    else:
        print(f"❌ Request failed: {response_1.status_code}")
        print(f"Response: {response_1.text[:500]}")
    
    # Test 2: Check what method WordPress sees
    print("\n" + "="*70)
    print("TEST 2: Checking HTTP method handling")
    print("-"*70)
    
    # Try with explicit method override
    headers_with_override = {
        **headers,
        'X-HTTP-Method-Override': 'POST',
        'X-HTTP-Method': 'POST'
    }
    
    random_id_2 = str(uuid.uuid4())
    test_title_2 = f"TEST POST {random_id_2}"
    
    post_data_2 = {
        'title': test_title_2,
        'content': f'<p>Method override test {datetime.now().isoformat()}</p>',
        'status': 'draft'
    }
    
    print(f"Title: {test_title_2}")
    print(f"Using X-HTTP-Method-Override header")
    print()
    
    response_2 = requests.post(
        f"{api_base}/posts",
        headers=headers_with_override,
        json=post_data_2,
        timeout=30
    )
    
    print(f"Response Status: {response_2.status_code}")
    
    if response_2.status_code in [200, 201]:
        data_2 = response_2.json()
        if isinstance(data_2, list):
            data_2 = data_2[0] if len(data_2) > 0 else {}
        
        returned_id_2 = data_2.get('id')
        returned_title_2 = data_2.get('title', {})
        if isinstance(returned_title_2, dict):
            returned_title_2 = returned_title_2.get('rendered', '')
        
        print(f"  ID: {returned_id_2}")
        print(f"  Title: {returned_title_2}")
        
        if test_title_2 == returned_title_2:
            print(f"  ✅ SUCCESS with method override!")
            
            # Cleanup
            requests.delete(
                f"{api_base}/posts/{returned_id_2}",
                headers=headers,
                params={'force': True}
            )
            return True
    
    # Test 3: Check server configuration
    print("\n" + "="*70)
    print("TEST 3: Checking server configuration")
    print("-"*70)
    
    # Check if there's a redirect
    print("Checking for redirects...")
    
    test_response = requests.post(
        f"{api_base}/posts",
        headers=headers,
        json={'title': 'redirect-test', 'content': 'test', 'status': 'draft'},
        allow_redirects=False,
        timeout=30
    )
    
    if test_response.status_code in [301, 302, 303, 307, 308]:
        print(f"  ⚠️  REDIRECT DETECTED: {test_response.status_code}")
        print(f"  Location: {test_response.headers.get('Location')}")
        print(f"  This might be causing the issue!")
    else:
        print(f"  No redirect (status: {test_response.status_code})")
    
    # Final diagnosis
    print("\n" + "="*70)
    print("DIAGNOSIS")
    print("="*70)
    print("\n❌ POST requests are NOT creating new posts")
    print("\nPossible causes:")
    print("1. ✅ LiteSpeed Cache - already disabled/excluded")
    print("2. ⚠️  Server-level reverse proxy (Varnish, nginx)")
    print("3. ⚠️  Hostinger firewall blocking POST to REST API")
    print("4. ⚠️  .htaccess rewrite rules interfering")
    print("5. ⚠️  WordPress in 'read-only' mode at server level")
    
    print("\n" + "="*70)
    print("RECOMMENDED ACTIONS")
    print("="*70)
    print("\n1. Contact Hostinger Support:")
    print("   - Tell them: 'POST requests to /wp-json/wp/v2/posts always")
    print("     return an existing post instead of creating new ones'")
    print("   - Ask them to check server-level caching and restrictions")
    
    print("\n2. Check .htaccess file:")
    print("   - Look for 'RewriteRule' affecting wp-json")
    print("   - Temporarily rename .htaccess to .htaccess.bak and test")
    
    print("\n3. Alternative: Use XML-RPC")
    print("   - XML-RPC uses a different endpoint (xmlrpc.php)")
    print("   - Less likely to be cached/blocked")
    print("   - I can help you switch to XML-RPC if needed")
    
    print("\n" + "="*70)
    
    return False


if __name__ == "__main__":
    test_post_creation()
