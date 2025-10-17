#!/usr/bin/env python3
"""
Image Generator (FREE VERSION) - Uses Hugging Face API
Generates images using Stable Diffusion for free.
"""

import os
import requests
from typing import Dict, List
from io import BytesIO
from PIL import Image
import time
from dotenv import load_dotenv

class ImageGeneratorFree:
    def __init__(self):
        """
        Initialize the free image generator using Hugging Face.
        """
        load_dotenv()
        self.api_key = os.getenv('HUGGINGFACE_API_KEY')
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY not found in .env file. Get one from https://huggingface.co/settings/tokens")
        
        # Using a popular and powerful Stable Diffusion model
        self.api_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}
        
        print("✅ Image Generator initialized (Hugging Face - FREE)")

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
