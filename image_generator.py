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

# Aspect ratio prompt prefixes (shared - avoid duplication)
ASPECT_RATIO_PREFIXES = {
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


def get_aspect_ratio_prefix(aspect_ratio: str) -> str:
    """Return prompt prefix for aspect ratio, or empty string for 1:1."""
    if not aspect_ratio or aspect_ratio == "1:1":
        return ""
    return ASPECT_RATIO_PREFIXES.get(aspect_ratio, f"Create an image in {aspect_ratio} aspect ratio. ")


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
    
    def analyze_reference_type(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
        """
        Analyze an image and return reference type: person, animal, or object.
        Uses Gemini vision model for classification.
        """
        try:
            model = genai.GenerativeModel("models/gemini-2.5-flash")
            pil_image = Image.open(io.BytesIO(image_bytes))
            response = model.generate_content([
                pil_image,
                "Is this image primarily of a person, animal, or object? Reply with exactly one word: person, animal, or object."
            ])
            text = (response.text or "").strip().lower()
            if "person" in text:
                return "person"
            if "animal" in text:
                return "animal"
            if "object" in text:
                return "object"
            return "object"  # fallback
        except Exception as e:
            print(f"[ImageGen] analyze_reference_type error: {e}")
            return "object"

    def _get_reference_type_hint(self, reference_type: str) -> str:
        """Get prompt hint based on reference type."""
        hints = {
            "person": "Keep the same person and face as in the reference image; pose and body position may change according to the prompt. ",
            "animal": "Keep exactly the same creature as in the reference image. ",
            "object": "Keep exactly the same object as in the reference image. "
        }
        return hints.get(reference_type, "")

    def generate_single_with_reference(
        self,
        prompt: str,
        reference_image_bytes: bytes,
        mime_type: str = "image/jpeg",
        reference_type: str = "",
        model: str = MODEL_NANO_BANANA,
        filename_prefix: str = "img",
        aspect_ratio: str = "1:1",
        master_prompts: str = "",
        suffix: str = "",
        negative_prompts: str = ""
    ) -> Dict:
        """
        Generate image from text + reference image (image-to-image).
        Sends [image, prompt] to Gemini.
        """
        result = {
            "status": "pending",
            "prompt": prompt,
            "filename": None,
            "error": None,
            "model": model,
            "timestamp": datetime.now().isoformat()
        }

        generation_model = genai.GenerativeModel(model_name=model)
        pil_ref = Image.open(io.BytesIO(reference_image_bytes))

        hint = self._get_reference_type_hint(reference_type) if reference_type else ""
        aspect_prefix = get_aspect_ratio_prefix(aspect_ratio or "1:1")
        full_prompt = f"{hint}{aspect_prefix}{master_prompts}{prompt}{suffix}"
        if negative_prompts:
            full_prompt += f", avoid: {negative_prompts}"
        full_prompt = full_prompt.strip()

        last_error = None
        for attempt in range(1 + self.MAX_RETRIES):
            if attempt > 0:
                print(f"[ImageGen] Retry {attempt}/{self.MAX_RETRIES} (reference)...")
                time.sleep(self.RETRY_DELAY)
            try:
                response = generation_model.generate_content([pil_ref, full_prompt])
                if response.parts:
                    for part in response.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            pil_out = Image.open(io.BytesIO(part.inline_data.data))
                            ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                            filename = f"{filename_prefix}_{ts}.png"
                            filepath = os.path.join(self.output_dir, filename)
                            pil_out.save(filepath, "PNG")
                            result["status"] = "completed"
                            result["filename"] = filename
                            result["filepath"] = filepath
                            return result
                last_error = "No image data in response"
            except Exception as e:
                last_error = str(e)
                print(f"[ImageGen] Attempt {attempt + 1} failed (reference): {last_error}")

        result["status"] = "failed"
        result["error"] = last_error
        return result

    MAX_RETRIES = 2  # จำนวนครั้งที่ retry เมื่อ fail (ไม่นับครั้งแรก)
    RETRY_DELAY = 3  # วินาทีระหว่าง retry

    def generate_single(
        self,
        prompt: str,
        model: str = MODEL_NANO_BANANA,
        filename_prefix: str = "img",
        aspect_ratio: str = "1:1"
    ) -> Dict:
        result = {
            "status": "pending",
            "prompt": prompt,
            "filename": None,
            "error": None,
            "model": model,
            "aspect_ratio": aspect_ratio,
            "timestamp": datetime.now().isoformat()
        }

        generation_model = genai.GenerativeModel(model_name=model)
        print(f"[ImageGen] Generating image (aspect_ratio={aspect_ratio}), prompt length={len(prompt)}")

        last_error = None
        for attempt in range(1 + self.MAX_RETRIES):
            if attempt > 0:
                print(f"[ImageGen] Retry {attempt}/{self.MAX_RETRIES}...")
                time.sleep(self.RETRY_DELAY)
            try:
                response = generation_model.generate_content(prompt)
                if response.parts:
                    for part in response.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            pil_image = Image.open(io.BytesIO(part.inline_data.data))
                            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                            filename = f"{filename_prefix}_{timestamp}.png"
                            filepath = os.path.join(self.output_dir, filename)
                            pil_image.save(filepath, "PNG")
                            result["status"] = "completed"
                            result["filename"] = filename
                            result["filepath"] = filepath
                            return result
                last_error = "No image data in response"
            except Exception as e:
                last_error = str(e)
                print(f"[ImageGen] Attempt {attempt + 1} failed: {last_error}")

        result["status"] = "failed"
        result["error"] = last_error
        return result

    def generate_batch_with_reference_sequential(
        self,
        prompts: List[str],
        reference_image_bytes: bytes,
        mime_type: str = "image/jpeg",
        reference_type: str = "",
        model: str = MODEL_NANO_BANANA,
        progress_callback: Optional[Callable] = None,
        master_prompts: str = "",
        suffix: str = "",
        negative_prompts: str = "",
        aspect_ratio: str = "1:1",
        cancel_check: Optional[Callable[[], bool]] = None,
        timeout_seconds: Optional[int] = 120
    ) -> List[Dict]:
        """Generate images with reference, sequential."""
        results = []
        total = len(prompts)
        timeout_sec = timeout_seconds or 120

        for idx, prompt in enumerate(prompts, 1):
            if cancel_check and cancel_check():
                break

            executor = ThreadPoolExecutor(max_workers=1)
            future = executor.submit(
                self.generate_single_with_reference,
                prompt=prompt,
                reference_image_bytes=reference_image_bytes,
                mime_type=mime_type,
                reference_type=reference_type,
                model=model,
                filename_prefix=f"batch_{idx}",
                aspect_ratio=aspect_ratio,
                master_prompts=master_prompts,
                suffix=suffix,
                negative_prompts=negative_prompts
            )
            result = None
            chunk_sec = 3
            waited = 0
            try:
                while waited < timeout_sec:
                    try:
                        result = future.result(timeout=chunk_sec)
                        break
                    except FuturesTimeoutError:
                        waited += chunk_sec
                        if cancel_check and cancel_check():
                            hint = self._get_reference_type_hint(reference_type) if reference_type else ""
                            full_prompt = f"{hint}{master_prompts}{prompt}{suffix}"
                            if negative_prompts:
                                full_prompt += f", avoid: {negative_prompts}"
                            result = {
                                "status": "cancelled",
                                "prompt": full_prompt.strip(),
                                "filename": None,
                                "error": "Cancelled",
                                "model": model,
                                "timestamp": datetime.now().isoformat()
                            }
                            break
                if result is None:
                    full_prompt = f"{master_prompts}{prompt}{suffix}"
                    if negative_prompts:
                        full_prompt += f", avoid: {negative_prompts}"
                    result = {
                        "status": "failed",
                        "prompt": full_prompt.strip(),
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

    def generate_batch_with_reference_parallel(
        self,
        prompts: List[str],
        reference_image_bytes: bytes,
        mime_type: str = "image/jpeg",
        reference_type: str = "",
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
        """Generate images with reference, parallel."""
        results = [None] * len(prompts)
        total = len(prompts)
        completed = 0
        timeout_sec = timeout_seconds or 120

        def gen_with_idx(idx: int, prompt: str):
            if cancel_check and cancel_check():
                return idx, {"status": "cancelled", "prompt": "", "filename": None, "error": "Cancelled", "model": model, "timestamp": datetime.now().isoformat()}
            with ThreadPoolExecutor(max_workers=1) as ex:
                fut = ex.submit(
                    self.generate_single_with_reference,
                    prompt=prompt,
                    reference_image_bytes=reference_image_bytes,
                    mime_type=mime_type,
                    reference_type=reference_type,
                    model=model,
                    filename_prefix=f"batch_{idx+1}",
                    aspect_ratio=aspect_ratio,
                    master_prompts=master_prompts,
                    suffix=suffix,
                    negative_prompts=negative_prompts
                )
                try:
                    return idx, fut.result(timeout=timeout_sec)
                except FuturesTimeoutError:
                    full_prompt = f"{master_prompts}{prompt}{suffix}"
                    if negative_prompts:
                        full_prompt += f", avoid: {negative_prompts}"
                    return idx, {
                        "status": "failed",
                        "prompt": full_prompt.strip(),
                        "filename": None,
                        "error": f"Timeout after {timeout_sec}s",
                        "model": model,
                        "timestamp": datetime.now().isoformat()
                    }

        executor = ThreadPoolExecutor(max_workers=max_workers)
        try:
            future_to_idx = {
                executor.submit(gen_with_idx, idx, prompt): idx
                for idx, prompt in enumerate(prompts)
            }
            for future in as_completed(future_to_idx):
                if cancel_check and cancel_check():
                    break
                idx = future_to_idx[future]
                try:
                    i, res = future.result(timeout=1)
                except FuturesTimeoutError:
                    continue
                results[idx] = res
                completed += 1
                if progress_callback:
                    progress_callback(completed, total, res)
        finally:
            executor.shutdown(wait=False)

        if cancel_check and cancel_check():
            for i in range(len(results)):
                if results[i] is None:
                    full_prompt = f"{master_prompts}{prompts[i]}{suffix}"
                    if negative_prompts:
                        full_prompt += f", avoid: {negative_prompts}"
                    results[i] = {
                        "status": "cancelled",
                        "prompt": full_prompt.strip(),
                        "filename": None,
                        "error": "Cancelled",
                        "model": model,
                        "timestamp": datetime.now().isoformat()
                    }
                    completed += 1
                    if progress_callback:
                        progress_callback(completed, total, results[i])

        return results

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
            
            aspect_prefix = get_aspect_ratio_prefix(aspect_ratio or "1:1")
            full_prompt = f"{aspect_prefix}{master_prompts}{prompt}{suffix}"
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
            
            aspect_prefix = get_aspect_ratio_prefix(aspect_ratio or "1:1")
            full_prompt = f"{aspect_prefix}{master_prompts}{prompt}{suffix}"
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
            
            for future in as_completed(future_to_idx):
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
