#!/usr/bin/env python3
"""
Image Generator (FREE VERSION) - Uses Hugging Face API
Generates images using Stable Diffusion for free.
"""

import os
import requests
import base64
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

    def generate_images(self, image_prompts: List[Dict], output_dir: str = 'generated_images') -> List[Dict]:
        """
        Generate all images for a blog post.
        """
        os.makedirs(output_dir, exist_ok=True)
        results = []
        
        for idx, img_data in enumerate(image_prompts, 1):
            print(f"🎨 Generating image {idx}/{len(image_prompts)}: {img_data['placement']} (using Hugging Face)...")
            
            try:
                enhanced_prompt = self._enhance_prompt(img_data['prompt'])
                image_bytes = self._generate_single_image(enhanced_prompt)
                
                if image_bytes:
                    # Save the image from bytes
                    image = Image.open(BytesIO(image_bytes))
                    local_path = os.path.join(output_dir, f"{img_data['placement']}_image_{idx}.png")
                    image.save(local_path)
                    
                    results.append({
                        **img_data,
                        'local_path': local_path,
                        'generated': True
                    })
                    print(f"✅ Image saved: {local_path}")
                else:
                    raise Exception("Received empty image response.")
                
                time.sleep(2) # Rate limiting
                
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
        style_additions = (
            "hand-drawn technical illustration, technical sketch, simple line work, "
            "minimalist, clean, professional diagram, blue and purple accents, white background, "
            "educational diagram style, data visualization"
        )
        return f"{style_additions}, {base_prompt}"

    def _generate_single_image(self, prompt: str) -> bytes:
        """Generate a single image and return its bytes."""
        payload = {"inputs": prompt}
        
        for attempt in range(3): # Retry mechanism for model loading
            response = requests.post(self.api_url, headers=self.headers, json=payload)
            
            if response.status_code == 200:
                return response.content
            
            # If the model is loading, wait and retry
            elif response.status_code == 503:
                error_info = response.json()
                wait_time = error_info.get("estimated_time", 20)
                print(f"   Model is loading, waiting for {wait_time:.1f}s (Attempt {attempt + 1}/3)...")
                time.sleep(wait_time)
            else:
                raise Exception(f"API request failed with status {response.status_code}: {response.text}")
        
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
            }
        ]
        
        results = generator.generate_images(test_prompts, output_dir='test_images_free')
        
        print("\n" + "="*50)
        print("FREE IMAGE GENERATION COMPLETE")
        print("="*50)
        
        for result in results:
            if result['generated']:
                print(f"\n✅ {result['placement']}")
                print(f"   Path: {result['local_path']}")
            else:
                print(f"\n❌ {result['placement']}")
                print(f"   Error: {result.get('error', 'Unknown error')}")

    except ValueError as e:
        print(f"❌ Configuration Error: {e}")
        print("\nPlease ensure you have a .env file with a valid HUGGINGFACE_API_KEY.")

if __name__ == "__main__":
    main()
