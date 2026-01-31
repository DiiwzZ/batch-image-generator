"""
Image Generator Module
ใช้ Google Gemini API (Nano Banana models) สำหรับสร้างรูปภาพจาก text prompts
"""

import os
import time
import io
import base64
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError as FuturesTimeoutError
from typing import List, Dict, Callable, Optional
from PIL import Image
import google.generativeai as genai


class ImageGenerator:
    """Class สำหรับจัดการการสร้างรูปภาพด้วย Google Gemini API"""
    
    # Model options
    MODEL_NANO_BANANA = "models/gemini-2.5-flash-image"
    MODEL_NANO_BANANA_PRO = "models/gemini-3-pro-image-preview"
    
    def __init__(self, api_key: str, output_dir: str = "static/generated"):
        """
        Initialize Image Generator
        
        Args:
            api_key: Google Gemini API key
            output_dir: โฟลเดอร์สำหรับเก็บรูปที่สร้าง
        """
        self.api_key = api_key
        self.output_dir = output_dir
        self.client = None
        
        # สร้างโฟลเดอร์ถ้ายังไม่มี
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize client
        self._init_client()
    
    def _init_client(self):
        """Initialize Google GenAI client"""
        try:
            genai.configure(api_key=self.api_key)
            self.client = genai
        except Exception as e:
            raise ValueError(f"Failed to initialize Gemini API client: {str(e)}") from e
    
    def generate_single(
        self, 
        prompt: str, 
        model: str = MODEL_NANO_BANANA,
        filename_prefix: str = "img",
        aspect_ratio: str = "1:1"
    ) -> Dict:
        """
        Generate รูปภาพเดียวจาก prompt
        
        Args:
            prompt: Text prompt สำหรับสร้างรูป
            model: Model ที่จะใช้ (MODEL_NANO_BANANA หรือ MODEL_NANO_BANANA_PRO)
            filename_prefix: Prefix สำหรับชื่อไฟล์
            aspect_ratio: Aspect ratio ของรูป (1:1, 16:9, 9:16, etc.)
            
        Returns:
            Dict ที่มี status, filename, และข้อมูลอื่นๆ
        """
        result = {
            "status": "pending",
            "prompt": prompt,
            "filename": None,
            "error": None,
            "model": model,
            "aspect_ratio": aspect_ratio,
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            # Generate image using GenerativeModel
            generation_model = genai.GenerativeModel(model_name=model)
            
            # Aspect ratio จะถูกเพิ่มโดย batch methods (sequential/parallel)
            # ที่นี่รับ prompt ที่ประมวลผลเสร็จแล้ว
            final_prompt = prompt
            
            # Log the final prompt for debugging
            print(f"[ImageGen] Generating image (aspect_ratio={aspect_ratio})")
            print(f"[ImageGen] Prompt length: {len(final_prompt)} chars")
            if len(final_prompt) <= 300:
                print(f"[ImageGen] Prompt: {final_prompt}")
            else:
                print(f"[ImageGen] Prompt (first 300 chars): {final_prompt[:300]}...")
            
            # Generate content
            response = generation_model.generate_content(final_prompt)
            
            # Save image from response
            if response.parts:
                for part in response.parts:
                    # Check if part has inline_data (image data)
                    if hasattr(part, 'inline_data') and part.inline_data:
                        # Get image bytes
                        image_bytes = part.inline_data.data
                        
                        # Convert to PIL Image
                        pil_image = Image.open(io.BytesIO(image_bytes))
                        
                        # Generate filename
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                        filename = f"{filename_prefix}_{timestamp}.png"
                        filepath = os.path.join(self.output_dir, filename)
                        
                        # Save
                        pil_image.save(filepath, "PNG")
                        
                        result["status"] = "completed"
                        result["filename"] = filename
                        result["filepath"] = filepath
                        
                        return result
            
            # ถ้าไม่มีรูปใน response
            result["status"] = "failed"
            result["error"] = "No image data in response"
            
        except Exception as e:
            result["status"] = "failed"
            result["error"] = str(e)
        
        return result
    
    def generate_batch_sequential(
        self,
        prompts: List[str],
        model: str = MODEL_NANO_BANANA,
        progress_callback: Optional[Callable] = None,
        master_prompts: str = "",
        suffix: str = "",
        negative_prompts: str = "",
        aspect_ratio: str = "1:1",
        cancel_check: Optional[Callable[[], bool]] = None,
        timeout_seconds: Optional[int] = 120
    ) -> List[Dict]:
        """
        Generate รูปภาพหลายๆ รูปแบบทีละรูปตามลำดับ
        รองรับการยกเลิกและ timeout ต่อรูป (ถ้ารูปเดียวค้าง รูปอื่นยังทำงานต่อ)
        
        Args:
            prompts: List ของ prompts
            model: Model ที่จะใช้
            progress_callback: Function ที่จะเรียกเมื่อมีความคืบหน้า
            master_prompts: Master prompts ที่จะเพิ่มข้างหน้าทุก prompt
            suffix: Suffix ที่จะเพิ่มข้างหลังทุก prompt
            negative_prompts: Negative prompts (สิ่งที่ไม่ต้องการ) จะถูกเพิ่มท้ายด้วย ", avoid: ..."
            aspect_ratio: Aspect ratio ของรูป (1:1, 16:9, 9:16, 21:9, etc.)
            cancel_check: Function ที่ return True ถ้าต้องการหยุด
            timeout_seconds: Timeout ต่อ 1 รูป (วินาที) ถ้าเกินจะ mark failed แล้วทำรูปถัดไป
            
        Returns:
            List of result dictionaries
        """
        results = []
        total = len(prompts)
        timeout_sec = timeout_seconds or 120
        
        for idx, prompt in enumerate(prompts, 1):
            if cancel_check and cancel_check():
                break
            
            # สร้าง full_prompt: aspect_ratio_prefix + master_prompts + prompt + suffix + negative_prompts
            # 1. เริ่มด้วย aspect ratio prefix
            aspect_prefix = ""
            if aspect_ratio and aspect_ratio != "1:1":
                aspect_ratio_prefixes = {
                    "21:9": "Create an image in 21:9 ultra-wide cinematic aspect ratio. ",
                    "16:9": "Create an image in 16:9 widescreen landscape aspect ratio. ",
                    "4:3": "Create an image in 4:3 standard landscape aspect ratio. ",
                    "3:2": "Create an image in 3:2 classic photo landscape aspect ratio. ",
                    "9:16": "Create an image in 9:16 vertical portrait aspect ratio. ",
                    "3:4": "Create an image in 3:4 portrait aspect ratio. ",
                    "2:3": "Create an image in 2:3 classic portrait aspect ratio. ",
                    "5:4": "Create an image in 5:4 almost square landscape aspect ratio. ",
                    "4:5": "Create an image in 4:5 almost square portrait aspect ratio. "
                }
                aspect_prefix = aspect_ratio_prefixes.get(aspect_ratio, f"Create an image in {aspect_ratio} aspect ratio. ")
            
            # 2. รวม: aspect_prefix + master_prompts + prompt + suffix
            full_prompt = f"{aspect_prefix}{master_prompts}{prompt}{suffix}"
            
            # 3. เพิ่ม negative prompts ท้ายสุด
            if negative_prompts:
                full_prompt += f", avoid: {negative_prompts}"
            full_prompt = full_prompt.strip()
            
            # รัน generate_single ใน thread - รอเป็นช่วงสั้นๆ แล้วเช็ค cancel เพื่อไม่ให้กดหยุดแล้วค้าง
            executor = ThreadPoolExecutor(max_workers=1)
            future = executor.submit(
                self.generate_single,
                prompt=full_prompt,
                model=model,
                filename_prefix=f"batch_{idx}",
                aspect_ratio=aspect_ratio
            )
            result = None
            chunk_sec = 3  # เช็ค cancel ทุก 3 วินาที
            waited = 0
            try:
                while waited < timeout_sec:
                    try:
                        result = future.result(timeout=chunk_sec)
                        break
                    except FuturesTimeoutError:
                        waited += chunk_sec
                        if cancel_check and cancel_check():
                            result = {
                                "status": "cancelled",
                                "prompt": full_prompt,
                                "filename": None,
                                "error": "Cancelled",
                                "model": model,
                                "timestamp": datetime.now().isoformat()
                            }
                            break
                if result is None:
                    result = {
                        "status": "failed",
                        "prompt": full_prompt,
                        "filename": None,
                        "error": f"Timeout after {timeout_sec} seconds",
                        "model": model,
                        "timestamp": datetime.now().isoformat()
                    }
            finally:
                executor.shutdown(wait=False)
            
            results.append(result)
            
            if progress_callback:
                progress_callback(len(results), total, result)
            
            if cancel_check and cancel_check():
                break
            
            if idx < total:
                time.sleep(0.5)
        
        return results
    
    def generate_batch_parallel(
        self,
        prompts: List[str],
        model: str = MODEL_NANO_BANANA,
        max_workers: int = 3,
        progress_callback: Optional[Callable] = None,
        master_prompts: str = "",
        suffix: str = "",
        negative_prompts: str = "",
        aspect_ratio: str = "1:1",
        cancel_check: Optional[Callable[[], bool]] = None,
        timeout_seconds: Optional[int] = 120
    ) -> List[Dict]:
        """
        Generate รูปภาพหลายๆ รูปแบบ parallel (พร้อมกัน)
        รองรับการยกเลิก และ timeout ต่อรูป
        """
        results = [None] * len(prompts)
        total = len(prompts)
        completed = 0
        timeout_sec = timeout_seconds or 120
        
        def generate_with_index(idx: int, prompt: str):
            if cancel_check and cancel_check():
                return idx, {"status": "cancelled", "prompt": "", "filename": None, "error": "Cancelled"}
            
            # สร้าง full_prompt: aspect_ratio_prefix + master_prompts + prompt + suffix + negative_prompts
            # 1. เริ่มด้วย aspect ratio prefix
            aspect_prefix = ""
            if aspect_ratio and aspect_ratio != "1:1":
                aspect_ratio_prefixes = {
                    "21:9": "Create an image in 21:9 ultra-wide cinematic aspect ratio. ",
                    "16:9": "Create an image in 16:9 widescreen landscape aspect ratio. ",
                    "4:3": "Create an image in 4:3 standard landscape aspect ratio. ",
                    "3:2": "Create an image in 3:2 classic photo landscape aspect ratio. ",
                    "9:16": "Create an image in 9:16 vertical portrait aspect ratio. ",
                    "3:4": "Create an image in 3:4 portrait aspect ratio. ",
                    "2:3": "Create an image in 2:3 classic portrait aspect ratio. ",
                    "5:4": "Create an image in 5:4 almost square landscape aspect ratio. ",
                    "4:5": "Create an image in 4:5 almost square portrait aspect ratio. "
                }
                aspect_prefix = aspect_ratio_prefixes.get(aspect_ratio, f"Create an image in {aspect_ratio} aspect ratio. ")
            
            # 2. รวม: aspect_prefix + master_prompts + prompt + suffix
            full_prompt = f"{aspect_prefix}{master_prompts}{prompt}{suffix}"
            
            # 3. เพิ่ม negative prompts ท้ายสุด
            if negative_prompts:
                full_prompt += f", avoid: {negative_prompts}"
            full_prompt = full_prompt.strip()
            with ThreadPoolExecutor(max_workers=1) as ex:
                fut = ex.submit(
                    self.generate_single,
                    prompt=full_prompt,
                    model=model,
                    filename_prefix=f"batch_{idx+1}",
                    aspect_ratio=aspect_ratio
                )
                try:
                    result = fut.result(timeout=timeout_sec)
                except FuturesTimeoutError:
                    result = {
                        "status": "failed",
                        "prompt": full_prompt,
                        "filename": None,
                        "error": f"Timeout after {timeout_sec}s",
                        "model": model,
                        "timestamp": datetime.now().isoformat()
                    }
            return idx, result
        
        executor = ThreadPoolExecutor(max_workers=max_workers)
        try:
            future_to_idx = {
                executor.submit(generate_with_index, idx, prompt): idx
                for idx, prompt in enumerate(prompts)
            }
            
            for future in as_completed(future_to_idx, timeout=2):
                if cancel_check and cancel_check():
                    break
                idx = future_to_idx[future]
                try:
                    idx, result = future.result(timeout=1)
                except FuturesTimeoutError:
                    continue
                results[idx] = result
                completed += 1
                if progress_callback:
                    progress_callback(completed, total, result)
        finally:
            executor.shutdown(wait=False)
        
        # ถ้ายกเลิก: เติมผลลัพธ์ที่ยังไม่มีเป็น cancelled
        if cancel_check and cancel_check():
            for i in range(len(results)):
                if results[i] is None:
                    # สร้าง full_prompt เหมือนข้างบน
                    full_prompt = f"{master_prompts}{prompts[i]}{suffix}"
                    if negative_prompts:
                        full_prompt += f", avoid: {negative_prompts}"
                    full_prompt = full_prompt.strip()
                    results[i] = {
                        "status": "cancelled",
                        "prompt": full_prompt,
                        "filename": None,
                        "error": "Cancelled",
                        "model": model,
                        "timestamp": datetime.now().isoformat()
                    }
                    completed += 1
                    if progress_callback:
                        progress_callback(completed, total, results[i])
        
        return results
    
    def cleanup_old_images(self, max_age_hours: int = 24):
        """
        ลบรูปเก่าที่อายุเกินกำหนด
        
        Args:
            max_age_hours: อายุสูงสุดของไฟล์ (ชั่วโมง)
        """
        now = time.time()
        max_age_seconds = max_age_hours * 3600
        
        deleted = 0
        for filename in os.listdir(self.output_dir):
            if filename.endswith(('.png', '.jpg', '.jpeg')):
                filepath = os.path.join(self.output_dir, filename)
                file_age = now - os.path.getmtime(filepath)
                
                if file_age > max_age_seconds:
                    try:
                        os.remove(filepath)
                        deleted += 1
                    except Exception:
                        pass
        
        return deleted


# Example usage
if __name__ == "__main__":
    # Test code
    api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in environment variables")
        exit(1)
    
    generator = ImageGenerator(api_key)
    
    # Test single generation
    print("Testing single image generation...")
    result = generator.generate_single("A cute cat wearing sunglasses")
    print(f"Result: {result}")
    
    # Test batch sequential
    print("\nTesting batch sequential generation...")
    prompts = [
        "A robot playing guitar",
        "A sunset over the ocean",
        "A magical forest with glowing mushrooms"
    ]
    
    def progress_print(current, total, result):
        print(f"Progress: {current}/{total} - Status: {result['status']}")
    
    results = generator.generate_batch_sequential(
        prompts=prompts,
        progress_callback=progress_print
    )
    
    print(f"\nCompleted: {sum(1 for r in results if r['status'] == 'completed')}/{len(results)}")
