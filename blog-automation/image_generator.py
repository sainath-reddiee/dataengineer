#!/usr/bin/env python3
"""
Image Generator - Creates hand-drawn style images using AI
Supports multiple providers: DALL-E, Stable Diffusion, Replicate
"""

import os
import requests
import base64
from typing import Dict, List
from io import BytesIO
from PIL import Image
import time

class ImageGenerator:
    def __init__(self, provider='dalle'):
        """
        Initialize image generator
        provider: 'dalle', 'stable-diffusion', or 'replicate'
        """
        self.provider = provider.lower()
        
        if self.provider == 'dalle':
            self.api_key = os.getenv('OPENAI_API_KEY')
            self.api_url = "https://api.openai.com/v1/images/generations"
        elif self.provider == 'stable-diffusion':
            self.api_key = os.getenv('STABILITY_API_KEY')
            self.api_url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
        elif self.provider == 'replicate':
            self.api_key = os.getenv('REPLICATE_API_TOKEN')
        else:
            raise ValueError(f"Unknown provider: {provider}")
        
        if not self.api_key:
            raise ValueError(f"API key not found for provider: {provider}")
    
    def generate_images(self, image_prompts: List[Dict], output_dir: str = 'generated_images') -> List[Dict]:
        """
        Generate all images for a blog post
        Returns: List of dicts with image info and local paths
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []
        
        for idx, img_data in enumerate(image_prompts, 1):
            print(f"🎨 Generating image {idx}/{len(image_prompts)}: {img_data['placement']}")
            
            try:
                # Enhance prompt for hand-drawn style
                enhanced_prompt = self._enhance_prompt(img_data['prompt'])
                
                # Generate image
                image_url = self._generate_single_image(enhanced_prompt)
                
                # Download and save
                local_path = self._download_image(
                    image_url, 
                    output_dir, 
                    f"{img_data['placement']}_image_{idx}.png"
                )
                
                results.append({
                    **img_data,
                    'image_url': image_url,
                    'local_path': local_path,
                    'generated': True
                })
                
                print(f"✅ Image saved: {local_path}")
                
                # Rate limiting
                time.sleep(2)
                
            except Exception as e:
                print(f"❌ Error generating image {idx}: {str(e)}")
                results.append({
                    **img_data,
                    'error': str(e),
                    'generated': False
                })
        
        return results
    
    def _enhance_prompt(self, base_prompt: str) -> str:
        """Enhance prompt to ensure hand-drawn style"""
        style_additions = (
            "Hand-drawn technical illustration, black ink sketch on white background, "
            "clean lines, minimal shading, professional diagram style, "
            "technical drawing aesthetic, whiteboard sketch, "
        )
        return style_additions + base_prompt
    
    def _generate_single_image(self, prompt: str) -> str:
        """Generate single image and return URL"""
        if self.provider == 'dalle':
            return self._generate_dalle(prompt)
        elif self.provider == 'stable-diffusion':
            return self._generate_stable_diffusion(prompt)
        elif self.provider == 'replicate':
            return self._generate_replicate(prompt)
    
    def _generate_dalle(self, prompt: str) -> str:
        """Generate image using DALL-E 3"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "dall-e-3",
            "prompt": prompt,
            "n": 1,
            "size": "1792x1024",  # Landscape format for blog
            "quality": "standard",
            "style": "natural"
        }
        
        response = requests.post(self.api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        return data['data'][0]['url']
    
    def _generate_stable_diffusion(self, prompt: str) -> str:
        """Generate image using Stable Diffusion XL"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1
                },
                {
                    "text": "photo, realistic, colorful, painted",
                    "weight": -1
                }
            ],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1792,
            "samples": 1,
            "steps": 30,
        }
        
        response = requests.post(self.api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        # Save base64 image temporarily
        image_data = data['artifacts'][0]['base64']
        
        # Convert to URL by saving locally first
        temp_path = '/tmp/temp_sd_image.png'
        image = Image.open(BytesIO(base64.b64decode(image_data)))
        image.save(temp_path)
        
        return temp_path  # Return path instead of URL
    
    def _generate_replicate(self, prompt: str) -> str:
        """Generate image using Replicate (SDXL)"""
        try:
            import replicate
        except ImportError:
            raise ImportError("Please install replicate: pip install replicate")
        
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "prompt": prompt,
                "negative_prompt": "color, photograph, realistic, painting",
                "width": 1792,
                "height": 1024,
                "num_outputs": 1,
            }
        )
        
        return output[0]  # Returns URL
    
    def _download_image(self, url: str, output_dir: str, filename: str) -> str:
        """Download image from URL and save locally"""
        # Handle local file paths (from Stable Diffusion)
        if url.startswith('/tmp/'):
            import shutil
            dest_path = os.path.join(output_dir, filename)
            shutil.copy(url, dest_path)
            return dest_path
        
        # Download from URL
        response = requests.get(url)
        response.raise_for_status()
        
        # Save image
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        return filepath
    
    def optimize_for_web(self, image_path: str, max_width: int = 1200) -> str:
        """Optimize image for web (resize, compress)"""
        img = Image.open(image_path)
        
        # Resize if needed
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save optimized version
        optimized_path = image_path.replace('.png', '_optimized.png')
        img.save(optimized_path, optimize=True, quality=85)
        
        return optimized_path


def main():
    """Test image generator"""
    print("🎨 Testing Image Generator\n")
    
    # Check which provider is available
    providers = {
        'dalle': os.getenv('OPENAI_API_KEY'),
        'stable-diffusion': os.getenv('STABILITY_API_KEY'),
        'replicate': os.getenv('REPLICATE_API_TOKEN')
    }
    
    available = [p for p, key in providers.items() if key]
    
    if not available:
        print("❌ No image generation API keys found!")
        print("\nPlease set one of:")
        print("  - OPENAI_API_KEY for DALL-E")
        print("  - STABILITY_API_KEY for Stable Diffusion")
        print("  - REPLICATE_API_TOKEN for Replicate")
        return
    
    provider = available[0]
    print(f"✅ Using provider: {provider}\n")
    
    generator = ImageGenerator(provider=provider)
    
    # Test prompts
    test_prompts = [
        {
            'placement': 'hero',
            'prompt': 'Overview diagram showing data pipeline architecture with sources, transformations, and destinations',
            'alt_text': 'Data pipeline architecture diagram',
            'caption': 'Modern data pipeline architecture'
        }
    ]
    
    results = generator.generate_images(test_prompts, output_dir='test_images')
    
    print("\n" + "="*50)
    print("IMAGE GENERATION COMPLETE")
    print("="*50)
    
    for result in results:
        if result['generated']:
            print(f"\n✅ {result['placement']}")
            print(f"   Path: {result['local_path']}")
        else:
            print(f"\n❌ {result['placement']}")
            print(f"   Error: {result.get('error', 'Unknown error')}")


if __name__ == "__main__":
    main()