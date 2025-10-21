#!/usr/bin/env python3
"""
Image Generator (FREE VERSION) - Uses Hugging Face API
Generates images using Stable Diffusion for free.
WITH IMAGE COMPRESSION to < 90KB
"""

import os
import requests
from typing import Dict, List
from io import BytesIO
from PIL import Image
import time
from dotenv import load_dotenv

class ImageGeneratorFree:
    def __init__(self, max_size_kb: int = 90):
        """
        Initialize the free image generator using Hugging Face.
        
        Args:
            max_size_kb: Maximum file size in KB (default: 90)
        """
        load_dotenv()
        self.api_key = os.getenv('HUGGINGFACE_API_KEY')
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY not found in .env file. Get one from https://huggingface.co/settings/tokens")
        
        self.api_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}
        self.max_size_kb = max_size_kb
        
        print(f"✅ Image Generator initialized (Hugging Face - FREE)")
        print(f"📏 Max file size: {max_size_kb}KB per image")

    def generate_images(self, image_prompts: List[Dict], output_dir: str = 'generated_images') -> List[Dict]:
        """
        Generate all images for a blog post with compression.
        
        Args:
            image_prompts: List of image prompt dictionaries
            output_dir: Directory to save images
            
        Returns:
            List of image dictionaries with local paths
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []
        
        for idx, img_data in enumerate(image_prompts, 1):
            print(f"🎨 Generating image {idx}/{len(image_prompts)}: {img_data.get('placement', 'image')}...")
            
            try:
                enhanced_prompt = self._enhance_prompt(img_data.get('prompt', ''))
                image_bytes = self._generate_single_image(enhanced_prompt)
                
                if image_bytes:
                    # Open image from bytes
                    image = Image.open(BytesIO(image_bytes))
                    
                    # Compress image to target size
                    print(f"   🗜️  Compressing to < {self.max_size_kb}KB...")
                    compressed_image = self._compress_image(image, self.max_size_kb)
                    
                    # Create filename from placement
                    placement = img_data.get('placement', f'image_{idx}')
                    local_path = os.path.join(output_dir, f"{placement}_image_{idx}.jpg")
                    
                    # Save compressed image as JPEG
                    compressed_image.save(local_path, format='JPEG', quality=85, optimize=True)
                    
                    # Get final file size
                    file_size_kb = os.path.getsize(local_path) / 1024
                    
                    results.append({
                        **img_data,
                        'local_path': local_path,
                        'generated': True,
                        'file_size_kb': round(file_size_kb, 2)
                    })
                    print(f"   ✅ Image saved: {local_path} ({file_size_kb:.1f}KB)")
                else:
                    raise Exception("Received empty image response.")
                
                time.sleep(2)  # Rate limiting
                
            except Exception as e:
                print(f"   ❌ Error generating image {idx}: {str(e)}")
                results.append({
                    **img_data,
                    'error': str(e),
                    'generated': False
                })
        
        return results

    def _compress_image(self, image: Image, max_size_kb: int) -> Image:
        """
        Compress image to target file size while maintaining quality.
        
        Args:
            image: PIL Image object
            max_size_kb: Maximum file size in KB
            
        Returns:
            Compressed PIL Image object
        """
        # Convert RGBA/P to RGB for JPEG
        if image.mode in ('RGBA', 'P', 'LA'):
            # Create white background
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'RGBA' or image.mode == 'LA':
                background.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
            else:
                background.paste(image)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (max 1024x1024)
        max_dimension = 1024
        if image.width > max_dimension or image.height > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        
        # Binary search for optimal quality
        quality = 85
        step = 10
        
        for attempt in range(10):  # Max 10 attempts
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=quality, optimize=True)
            size_kb = buffer.tell() / 1024
            
            if size_kb <= max_size_kb:
                # Success! Return the compressed image
                buffer.seek(0)
                return Image.open(buffer)
            
            # Too large, reduce quality
            quality -= step
            step = max(5, step - 1)  # Reduce step size
            
            if quality < 20:
                quality = 20
                break
        
        # If still too large, resize further
        if size_kb > max_size_kb:
            scale = 0.9
            while size_kb > max_size_kb and scale > 0.3:
                new_size = (int(image.width * scale), int(image.height * scale))
                resized_image = image.resize(new_size, Image.Resampling.LANCZOS)
                
                buffer = BytesIO()
                resized_image.save(buffer, format='JPEG', quality=quality, optimize=True)
                size_kb = buffer.tell() / 1024
                
                if size_kb <= max_size_kb:
                    buffer.seek(0)
                    return Image.open(buffer)
                
                scale -= 0.1
            
            # Last resort: return resized image
            buffer.seek(0)
            return Image.open(buffer)
        
        buffer.seek(0)
        return Image.open(buffer)

    def _enhance_prompt(self, base_prompt: str) -> str:
        """Enhance prompt for a consistent, high-quality style."""
        if not base_prompt:
            base_prompt = "technical illustration"
            
        style_additions = (
            "hand-drawn technical illustration, technical sketch, simple line work, "
            "minimalist, clean, professional diagram, blue and purple accents, white background, "
            "educational diagram style, data visualization"
        )
        return f"{style_additions}, {base_prompt}"

    def _generate_single_image(self, prompt: str) -> bytes:
        """Generate a single image and return its bytes."""
        payload = {"inputs": prompt}
        
        for attempt in range(3):  # Retry mechanism for model loading
            try:
                response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=60)
                
                if response.status_code == 200:
                    return response.content
                
                # If the model is loading, wait and retry
                elif response.status_code == 503:
                    try:
                        error_info = response.json()
                        wait_time = error_info.get("estimated_time", 20)
                    except:
                        wait_time = 20
                    print(f"   ⏳ Model loading, waiting {wait_time:.1f}s (Attempt {attempt + 1}/3)...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"API request failed with status {response.status_code}: {response.text[:200]}")
                    
            except requests.exceptions.Timeout:
                print(f"   ⏱️  Request timeout (Attempt {attempt + 1}/3)...")
                time.sleep(5)
            except Exception as e:
                if attempt == 2:  # Last attempt
                    raise
                print(f"   ⚠️  Error: {str(e)[:100]} (Attempt {attempt + 1}/3)...")
                time.sleep(5)
        
        raise Exception("Model did not become available after multiple retries.")


def main():
    """Test the free image generator with compression."""
    print("🎨 Testing Free Image Generator (Hugging Face) with Compression...\n")
    
    try:
        generator = ImageGeneratorFree(max_size_kb=90)
        
        test_prompts = [
            {
                'placement': 'hero',
                'prompt': 'A conceptual diagram of a modern data pipeline, showing data sources, ingestion, transformation, and storage.',
                'alt_text': 'Modern data pipeline architecture diagram',
                'caption': 'An overview of a modern data pipeline.'
            },
            {
                'placement': 'section-1',
                'prompt': 'Technical diagram showing data flow through ETL process',
                'alt_text': 'ETL process flow diagram',
                'caption': 'ETL process visualization'
            }
        ]
        
        results = generator.generate_images(test_prompts, output_dir='test_images_free')
        
        print("\n" + "="*50)
        print("FREE IMAGE GENERATION COMPLETE")
        print("="*50)
        
        successful = [r for r in results if r.get('generated')]
        failed = [r for r in results if not r.get('generated')]
        
        print(f"\n✅ Successful: {len(successful)}/{len(results)}")
        print(f"❌ Failed: {len(failed)}/{len(results)}")
        
        total_size = sum(r.get('file_size_kb', 0) for r in successful)
        print(f"\n📊 Total size: {total_size:.1f}KB")
        
        for result in results:
            if result['generated']:
                print(f"\n✅ {result['placement']}")
                print(f"   Path: {result['local_path']}")
                print(f"   Size: {result['file_size_kb']}KB")
            else:
                print(f"\n❌ {result['placement']}")
                print(f"   Error: {result.get('error', 'Unknown error')}")

    except ValueError as e:
        print(f"❌ Configuration Error: {e}")
        print("\nTo enable image generation:")
        print("1. Get FREE API key from: https://huggingface.co/settings/tokens")
        print("2. Add to .env file: HUGGINGFACE_API_KEY=your_key_here")
        print("3. Set USE_IMAGES=true in .env")


if __name__ == "__main__":
    main()

    def generate_images(self, image_prompts: List[Dict], output_dir: str = 'generated_images') -> List[Dict]:
        """
        Generate all images for a blog post.
        
        Args:
            image_prompts: List of image prompt dictionaries
            output_dir: Directory to save images
            
        Returns:
            List of image dictionaries with local paths
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []
        
        for idx, img_data in enumerate(image_prompts, 1):
            print(f"🎨 Generating image {idx}/{len(image_prompts)}: {img_data.get('placement', 'image')} (using Hugging Face)...")
            
            try:
                enhanced_prompt = self._enhance_prompt(img_data.get('prompt', ''))
                image_bytes = self._generate_single_image(enhanced_prompt)
                
                if image_bytes:
                    # Save the image from bytes
                    image = Image.open(BytesIO(image_bytes))
                    
                    # Create filename from placement
                    placement = img_data.get('placement', f'image_{idx}')
                    local_path = os.path.join(output_dir, f"{placement}_image_{idx}.png")
                    
                    image.save(local_path)
                    
                    results.append({
                        **img_data,
                        'local_path': local_path,
                        'generated': True
                    })
                    print(f"✅ Image saved: {local_path}")
                else:
                    raise Exception("Received empty image response.")
                
                time.sleep(2)  # Rate limiting
                
            except Exception as e:
                print(f"❌ Error generating image {idx}: {str(e)}")
                results.append({
                    **img_data,
                    'error': str(e),
                    'generated': False
                })
        
        return results

    def _enhance_prompt(self, base_prompt: str) -> str:
        """Enhance prompt for a consistent, high-quality style."""
        if not base_prompt:
            base_prompt = "technical illustration"
            
        style_additions = (
            "hand-drawn technical illustration, technical sketch, simple line work, "
            "minimalist, clean, professional diagram, blue and purple accents, white background, "
            "educational diagram style, data visualization"
        )
        return f"{style_additions}, {base_prompt}"

    def _generate_single_image(self, prompt: str) -> bytes:
        """Generate a single image and return its bytes."""
        payload = {"inputs": prompt}
        
        for attempt in range(3):  # Retry mechanism for model loading
            try:
                response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=60)
                
                if response.status_code == 200:
                    return response.content
                
                # If the model is loading, wait and retry
                elif response.status_code == 503:
                    try:
                        error_info = response.json()
                        wait_time = error_info.get("estimated_time", 20)
                    except:
                        wait_time = 20
                    print(f"   Model is loading, waiting for {wait_time:.1f}s (Attempt {attempt + 1}/3)...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"API request failed with status {response.status_code}: {response.text[:200]}")
                    
            except requests.exceptions.Timeout:
                print(f"   Request timeout (Attempt {attempt + 1}/3)...")
                time.sleep(5)
            except Exception as e:
                if attempt == 2:  # Last attempt
                    raise
                print(f"   Error: {str(e)[:100]} (Attempt {attempt + 1}/3)...")
                time.sleep(5)
        
        raise Exception("Model did not become available after multiple retries.")


def main():
    """Test the free image generator."""
    print("🎨 Testing Free Image Generator (Hugging Face)...\n")
    
    try:
        generator = ImageGeneratorFree()
        
        test_prompts = [
            {
                'placement': 'hero',
                'prompt': 'A conceptual diagram of a modern data pipeline, showing data sources, ingestion, transformation, and storage.',
                'alt_text': 'Modern data pipeline architecture diagram',
                'caption': 'An overview of a modern data pipeline.'
            },
            {
                'placement': 'section-1',
                'prompt': 'Technical diagram showing data flow through ETL process',
                'alt_text': 'ETL process flow diagram',
                'caption': 'ETL process visualization'
            }
        ]
        
        results = generator.generate_images(test_prompts, output_dir='test_images_free')
        
        print("\n" + "="*50)
        print("FREE IMAGE GENERATION COMPLETE")
        print("="*50)
        
        successful = [r for r in results if r.get('generated')]
        failed = [r for r in results if not r.get('generated')]
        
        print(f"\n✅ Successful: {len(successful)}/{len(results)}")
        print(f"❌ Failed: {len(failed)}/{len(results)}")
        
        for result in results:
            if result['generated']:
                print(f"\n✅ {result['placement']}")
                print(f"   Path: {result['local_path']}")
            else:
                print(f"\n❌ {result['placement']}")
                print(f"   Error: {result.get('error', 'Unknown error')}")

    except ValueError as e:
        print(f"❌ Configuration Error: {e}")
        print("\nTo enable image generation:")
        print("1. Get FREE API key from: https://huggingface.co/settings/tokens")
        print("2. Add to .env file: HUGGINGFACE_API_KEY=your_key_here")
        print("3. Set USE_IMAGES=true in .env")


if __name__ == "__main__":
    main()
