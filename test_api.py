"""
Test Script สำหรับทดสอบ Image Generator
ใช้สำหรับทดสอบว่า API integration ทำงานได้ถูกต้อง
"""

import os
from dotenv import load_dotenv
from image_generator import ImageGenerator

def main():
    print("=" * 60)
    print("🧪 Batch Image Generator - Test Script")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    api_key = os.getenv('GOOGLE_API_KEY')
    
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY not found in .env file")
        print("📝 Please create a .env file and add your API key:")
        print("   GOOGLE_API_KEY=your_api_key_here")
        return
    
    print(f"✅ API Key loaded: {api_key[:10]}...")
    print()
    
    # Initialize generator
    try:
        generator = ImageGenerator(api_key=api_key)
        print("✅ ImageGenerator initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize ImageGenerator: {e}")
        return
    
    print()
    print("-" * 60)
    print("📝 Test 1: Single Image Generation")
    print("-" * 60)
    
    test_prompt = "A cute orange cat wearing sunglasses, digital art"
    print(f"Prompt: {test_prompt}")
    print("Generating...")
    
    try:
        result = generator.generate_single(test_prompt)
        
        if result['status'] == 'completed':
            print(f"✅ Success!")
            print(f"   Filename: {result['filename']}")
            print(f"   Path: {result['filepath']}")
        else:
            print(f"❌ Failed: {result['error']}")
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    print()
    print("-" * 60)
    print("📝 Test 2: Batch Sequential Generation (3 images)")
    print("-" * 60)
    
    test_prompts = [
        "A robot playing guitar on stage",
        "A beautiful sunset over the ocean with palm trees",
        "A magical forest with glowing mushrooms at night"
    ]
    
    print("Prompts:")
    for i, p in enumerate(test_prompts, 1):
        print(f"  {i}. {p}")
    
    print("\nGenerating...")
    
    def progress_callback(current, total, result):
        status_icon = "✅" if result['status'] == 'completed' else "❌"
        print(f"  [{current}/{total}] {status_icon} {result['prompt'][:50]}...")
    
    try:
        results = generator.generate_batch_sequential(
            prompts=test_prompts,
            model=ImageGenerator.MODEL_NANO_BANANA,
            progress_callback=progress_callback
        )
        
        successful = sum(1 for r in results if r['status'] == 'completed')
        failed = sum(1 for r in results if r['status'] == 'failed')
        
        print()
        print("📊 Results:")
        print(f"   ✅ Successful: {successful}/{len(results)}")
        print(f"   ❌ Failed: {failed}/{len(results)}")
        
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    print()
    print("=" * 60)
    print("🎉 Test completed!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Check the 'static/generated/' folder for generated images")
    print("2. Run 'python app.py' to start the web application")
    print("3. Open http://localhost:5000 in your browser")

if __name__ == "__main__":
    main()
