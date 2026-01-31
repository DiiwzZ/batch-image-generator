"""
Check available models in Google Generative AI
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv('GOOGLE_API_KEY')

if not api_key:
    print("❌ API Key not found")
    exit(1)

genai.configure(api_key=api_key)

print("=" * 60)
print("Available Models:")
print("=" * 60)

try:
    models = genai.list_models()
    
    print("\n🎨 Image Generation Models:")
    print("-" * 60)
    image_models = [m for m in models if 'image' in m.name.lower() or 'imagen' in m.name.lower()]
    
    if image_models:
        for model in image_models:
            print(f"✅ {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Description: {model.description}")
            print()
    else:
        print("❌ No image generation models found")
    
    print("\n📝 All Available Models:")
    print("-" * 60)
    for model in models:
        print(f"- {model.name}")
        
except Exception as e:
    print(f"❌ Error: {e}")
