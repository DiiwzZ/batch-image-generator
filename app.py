"""
Batch Image Generator - Flask Web Application
Web app สำหรับสร้างรูปภาพอัตโนมัติจาก prompts หลายๆ อัน
"""

import os
import uuid
import zipfile
import threading
import time
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from dotenv import load_dotenv
from image_generator import ImageGenerator

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configuration
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')  # Optional - for backward compatibility
MAX_WORKERS = int(os.getenv('MAX_WORKERS', '3'))
STATIC_FOLDER = 'static/generated'
DATA_FOLDER = 'data'
HISTORY_FILE = os.path.join(DATA_FOLDER, 'jobs_history.json')
MAX_HISTORY_JOBS = 50
AUTO_CLEANUP_ENABLED = os.getenv('AUTO_CLEANUP_ENABLED', 'false').lower() == 'true'
AUTO_CLEANUP_DAYS = int(os.getenv('AUTO_CLEANUP_DAYS', '7'))

# Note: ไม่ต้องเช็ค GOOGLE_API_KEY แล้ว เพราะแต่ละ user จะส่ง API key ของตัวเองมา
# ImageGenerator จะถูกสร้างใหม่ทุกครั้งที่มี request

# Auto-cleanup state
cleanup_state = {
    'last_cleanup': None,
    'next_cleanup': None,
    'files_deleted': 0,
    'enabled': AUTO_CLEANUP_ENABLED
}

# สร้าง data folder ถ้ายังไม่มี
os.makedirs(DATA_FOLDER, exist_ok=True)

# In-memory storage สำหรับ job tracking
jobs = {}
jobs_lock = threading.Lock()

# Job History Functions
def load_history():
    """โหลด job history จาก file"""
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading history: {e}")
            return []
    return []


def save_history(history):
    """บันทึก job history ลง file"""
    try:
        # จำกัดไม่เกิน MAX_HISTORY_JOBS
        if len(history) > MAX_HISTORY_JOBS:
            history = history[:MAX_HISTORY_JOBS]
        
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving history: {e}")


def add_to_history(job):
    """เพิ่ม job เข้า history"""
    try:
        history = load_history()
        
        # สร้าง history entry (เก็บเฉพาะข้อมูลที่จำเป็น)
        history_entry = {
            'id': job['id'],
            'created_at': job['created_at'],
            'finished_at': job.get('finished_at'),
            'status': job['status'],
            'model': job['model'],
            'mode': job['mode'],
            'total': job['total'],
            'completed': job['completed'],
            'failed': job['failed'],
            'prompts': job['prompts'],
            'master_prompts': job.get('master_prompts', ''),
            'suffix': job.get('suffix', ''),
            'negative_prompts': job.get('negative_prompts', ''),
            'aspect_ratio': job.get('aspect_ratio', '1:1'),
            'success_count': len([r for r in job.get('results', []) if r['status'] == 'completed'])
        }
        
        # เพิ่มเข้าด้านหน้า (ใหม่สุด)
        history.insert(0, history_entry)
        
        # บันทึก
        save_history(history)
    except Exception as e:
        print(f"Error adding to history: {e}")


def create_job(prompts: list, model: str, mode: str, master_prompts: str = "", suffix: str = "", negative_prompts: str = "", aspect_ratio: str = "1:1") -> str:
    """สร้าง job ใหม่และ return job_id"""
    job_id = str(uuid.uuid4())
    
    with jobs_lock:
        jobs[job_id] = {
            'id': job_id,
            'status': 'pending',
            'prompts': prompts,
            'model': model,
            'mode': mode,
            'master_prompts': master_prompts,
            'suffix': suffix,
            'negative_prompts': negative_prompts,
            'aspect_ratio': aspect_ratio,
            'total': len(prompts),
            'completed': 0,
            'failed': 0,
            'results': [],
            'cancel_requested': False,
            'created_at': datetime.now().isoformat(),
            'started_at': None,
            'finished_at': None
        }
    
    return job_id


def update_job_progress(job_id: str, current: int, total: int, result: dict):
    """Update job progress (callback function)"""
    with jobs_lock:
        if job_id in jobs:
            job = jobs[job_id]
            job['completed'] = current
            job['results'].append(result)
            
            if result['status'] == 'failed':
                job['failed'] += 1
            
            # Check if finished
            if current >= total:
                job['status'] = 'completed'
                job['finished_at'] = datetime.now().isoformat()


def process_generation(job_id: str, api_key: str):
    """Background task สำหรับ generate images"""
    print(f"[Job {job_id[:8]}] Starting generation...")
    with jobs_lock:
        if job_id not in jobs:
            print(f"[Job {job_id[:8]}] Error: Job not found")
            return
        
        job = jobs[job_id]
        job['status'] = 'processing'
        job['started_at'] = datetime.now().isoformat()
    
    try:
        # สร้าง ImageGenerator instance ใหม่สำหรับ user นี้ (ใช้ API key ของเขา)
        image_generator = ImageGenerator(api_key=api_key, output_dir=STATIC_FOLDER)
        
        # Get job details
        prompts = job['prompts']
        model = job['model']
        mode = job['mode']
        master_prompts = job.get('master_prompts', job.get('prefix', ''))  # รองรับทั้งชื่อเก่า/ใหม่
        suffix = job.get('suffix', '')
        negative_prompts = job.get('negative_prompts', '')
        aspect_ratio = job.get('aspect_ratio', '1:1')
        
        # Cancel check: ตรวจสอบว่าผู้ใช้กดหยุดหรือไม่
        def cancel_check():
            with jobs_lock:
                return jobs.get(job_id, {}).get('cancel_requested', False)
        
        # Progress callback
        def progress_callback(current, total, result):
            if result.get('status') == 'failed':
                print(f"[Job {job_id[:8]}] Image {current}/{total} FAILED: {result.get('error', 'Unknown error')}")
            else:
                print(f"[Job {job_id[:8]}] Image {current}/{total} completed")
            update_job_progress(job_id, current, total, result)
        
        # Timeout ต่อ 1 รูป (วินาที) - ป้องกันรูปเดียวค้างแล้วบล็อกทั้งหมด
        timeout_per_image = 120
        
        # Generate based on mode
        if mode == 'sequential':
            image_generator.generate_batch_sequential(
                prompts=prompts,
                model=model,
                progress_callback=progress_callback,
                master_prompts=master_prompts,
                suffix=suffix,
                negative_prompts=negative_prompts,
                aspect_ratio=aspect_ratio,
                cancel_check=cancel_check,
                timeout_seconds=timeout_per_image
            )
        else:  # parallel
            image_generator.generate_batch_parallel(
                prompts=prompts,
                model=model,
                max_workers=MAX_WORKERS,
                progress_callback=progress_callback,
                master_prompts=master_prompts,
                suffix=suffix,
                negative_prompts=negative_prompts,
                aspect_ratio=aspect_ratio,
                cancel_check=cancel_check,
                timeout_seconds=timeout_per_image
            )
        
        # Update final status (ถ้าถูกยกเลิกจะตั้งในบล็อกด้านล่าง)
        with jobs_lock:
            if job_id in jobs:
                job = jobs[job_id]
                if job.get('cancel_requested'):
                    job['status'] = 'cancelled'
                    # เติมผลลัพธ์ที่ยังไม่มีเป็น cancelled เพื่อให้ UI แสดงครบ
                    prompts = job['prompts']
                    master_prompts = job.get('master_prompts', job.get('prefix', ''))
                    suffix = job.get('suffix', '')
                    negative_prompts = job.get('negative_prompts', '')
                    for i in range(len(job['results']), len(prompts)):
                        full_prompt = f"{master_prompts}{prompts[i]}{suffix}"
                        if negative_prompts:
                            full_prompt += f", avoid: {negative_prompts}"
                        full_prompt = full_prompt.strip()
                        job['results'].append({
                            'status': 'cancelled',
                            'prompt': full_prompt,
                            'filename': None,
                            'error': 'Cancelled',
                            'model': job.get('model', ''),
                            'timestamp': datetime.now().isoformat()
                        })
                    job['completed'] = len(prompts)
                else:
                    job['status'] = 'completed'
                job['finished_at'] = datetime.now().isoformat()
                
                # เพิ่มเข้า history
                add_to_history(job)
    
    except Exception as e:
        print(f"[Job {job_id[:8]}] CRITICAL ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        with jobs_lock:
            if job_id in jobs:
                jobs[job_id]['status'] = 'error'
                jobs[job_id]['error'] = str(e)
                jobs[job_id]['finished_at'] = datetime.now().isoformat()


# ===== Routes =====

@app.route('/')
def index():
    """หน้าหลัก"""
    return render_template('index.html')


@app.route('/api/validate-key', methods=['POST'])
def validate_key():
    """
    API endpoint สำหรับทดสอบว่า API key ใช้งานได้หรือไม่
    
    Request JSON:
    {
        "api_key": "..."
    }
    
    Response:
    {
        "valid": true/false,
        "error": "..." (if invalid)
    }
    """
    try:
        data = request.get_json()
        api_key = data.get('api_key', '').strip()
        
        if not api_key:
            return jsonify({
                'valid': False,
                'error': 'API key is required'
            }), 400
        
        # ทดสอบ API key โดยลองสร้าง ImageGenerator และเรียก list models
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            # ลองเรียก API เพื่อเช็คว่า key ใช้งานได้
            models = genai.list_models()
            # ถ้าถึงจุดนี้แสดงว่า API key ใช้งานได้
            return jsonify({
                'valid': True,
                'message': 'API key is valid'
            })
        except Exception as e:
            error_msg = str(e)
            # แปลง error message ให้เข้าใจง่าย
            if 'API_KEY_INVALID' in error_msg or 'invalid' in error_msg.lower():
                error_msg = 'API key ไม่ถูกต้อง'
            elif 'permission' in error_msg.lower():
                error_msg = 'API key ไม่มีสิทธิ์เข้าถึง Gemini API'
            return jsonify({
                'valid': False,
                'error': error_msg
            }), 400
    
    except Exception as e:
        return jsonify({
            'valid': False,
            'error': str(e)
        }), 500


@app.route('/api/generate', methods=['POST'])
def generate():
    """
    API endpoint สำหรับเริ่ม batch generation
    
    Request JSON:
    {
        "api_key": "...",  (required)
        "prompts": ["prompt1", "prompt2", ...],
        "model": "gemini-2.5-flash-image",
        "mode": "sequential" | "parallel",
        "master_prompts": "...",  (optional)
        "suffix": "...",  (optional)
        "negative_prompts": "...",  (optional)
        "aspect_ratio": "1:1" | "16:9" | "9:16" | etc.  (optional, default: "1:1")
    }
    
    Response:
    {
        "success": true,
        "job_id": "uuid",
        "message": "..."
    }
    """
    try:
        data = request.get_json()
        
        # Validate API key
        api_key = data.get('api_key', '').strip()
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key is required'
            }), 400
        
        # Validate input
        if not data or 'prompts' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing prompts in request'
            }), 400
        
        prompts_raw = data['prompts']
        
        # Parse prompts (รองรับทั้ง array และ string with newlines)
        if isinstance(prompts_raw, str):
            prompts = [p.strip() for p in prompts_raw.split('\n') if p.strip()]
        elif isinstance(prompts_raw, list):
            prompts = [p.strip() for p in prompts_raw if p.strip()]
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid prompts format'
            }), 400
        
        if not prompts:
            return jsonify({
                'success': False,
                'error': 'No valid prompts provided'
            }), 400
        
        # Get parameters
        model = data.get('model', ImageGenerator.MODEL_NANO_BANANA)
        mode = data.get('mode', 'sequential')
        master_prompts = data.get('master_prompts', data.get('prefix', ''))  # รองรับทั้งชื่อเก่า/ใหม่
        suffix = data.get('suffix', '')
        negative_prompts = data.get('negative_prompts', '')
        aspect_ratio = data.get('aspect_ratio', '1:1')
        
        # Validate model (accept both with and without 'models/' prefix)
        valid_models = [
            ImageGenerator.MODEL_NANO_BANANA, 
            ImageGenerator.MODEL_NANO_BANANA_PRO,
            "gemini-2.5-flash-image",
            "gemini-3-pro-image-preview"
        ]
        
        # Add 'models/' prefix if not present
        if model in ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"]:
            model = f"models/{model}"
        
        if model not in valid_models:
            model = ImageGenerator.MODEL_NANO_BANANA
        
        # Validate mode
        if mode not in ['sequential', 'parallel']:
            mode = 'sequential'
        
        # Create job
        job_id = create_job(prompts, model, mode, master_prompts, suffix, negative_prompts, aspect_ratio)
        
        # Start background processing (ส่ง api_key เข้าไปด้วย)
        thread = threading.Thread(target=process_generation, args=(job_id, api_key))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': f'Started generating {len(prompts)} images',
            'total': len(prompts)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cancel/<job_id>', methods=['POST'])
def cancel_job(job_id):
    """
    API endpoint สำหรับยกเลิก job ที่กำลังทำงาน
    
    Response:
    { "success": true, "message": "..." }
    """
    with jobs_lock:
        if job_id not in jobs:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        job = jobs[job_id]
        if job['status'] != 'processing':
            return jsonify({
                'success': True,
                'message': 'Job is not running (already completed or cancelled)'
            })
        job['cancel_requested'] = True
    
    return jsonify({
        'success': True,
        'message': 'Cancel requested. Current images will still be shown when done.'
    })


@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    """
    API endpoint สำหรับตรวจสอบสถานะของ job
    
    Response:
    {
        "success": true,
        "job": { ... }
    }
    """
    with jobs_lock:
        if job_id not in jobs:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        
        job = jobs[job_id].copy()
    
    return jsonify({
        'success': True,
        'job': job
    })


@app.route('/api/jobs', methods=['GET'])
def get_all_jobs():
    """API endpoint สำหรับดูรายการ jobs ทั้งหมด"""
    with jobs_lock:
        jobs_list = list(jobs.values())
    
    return jsonify({
        'success': True,
        'jobs': jobs_list
    })


@app.route('/api/download/<filename>', methods=['GET'])
def download_image(filename):
    """Download รูปภาพเดียว"""
    try:
        return send_from_directory(STATIC_FOLDER, filename, as_attachment=True)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404


@app.route('/api/download-all/<job_id>', methods=['GET'])
def download_all(job_id):
    """Download รูปทั้งหมดของ job เป็น ZIP"""
    with jobs_lock:
        if job_id not in jobs:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        
        job = jobs[job_id].copy()
    
    try:
        # Create ZIP file
        zip_filename = f"batch_{job_id[:8]}.zip"
        zip_path = os.path.join(STATIC_FOLDER, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for result in job['results']:
                if result['status'] == 'completed' and result['filename']:
                    filepath = os.path.join(STATIC_FOLDER, result['filename'])
                    if os.path.exists(filepath):
                        zipf.write(filepath, result['filename'])
        
        return send_file(zip_path, as_attachment=True, download_name=zip_filename)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/delete/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """ลบ job และรูปภาพที่เกี่ยวข้อง"""
    with jobs_lock:
        if job_id not in jobs:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        
        job = jobs[job_id]
        
        # ลบรูปภาพ
        for result in job['results']:
            if result['status'] == 'completed' and result['filename']:
                filepath = os.path.join(STATIC_FOLDER, result['filename'])
                try:
                    if os.path.exists(filepath):
                        os.remove(filepath)
                except Exception:
                    pass
        
        # ลบ job
        del jobs[job_id]
    
    return jsonify({
        'success': True,
        'message': 'Job deleted successfully'
    })


def perform_cleanup():
    """ทำการลบรูปเก่า (internal function)"""
    try:
        max_age_hours = AUTO_CLEANUP_DAYS * 24
        temp_generator = ImageGenerator(api_key="dummy", output_dir=STATIC_FOLDER)
        deleted = temp_generator.cleanup_old_images(max_age_hours)
        
        cleanup_state['last_cleanup'] = datetime.now().isoformat()
        cleanup_state['files_deleted'] = deleted
        
        print(f"[Auto-cleanup] Deleted {deleted} files older than {AUTO_CLEANUP_DAYS} days")
        return deleted
    except Exception as e:
        print(f"[Auto-cleanup] Error: {e}")
        return 0


def auto_cleanup_scheduler():
    """Background thread สำหรับ auto-cleanup ทุก 6 ชั่วโมง"""
    while True:
        if AUTO_CLEANUP_ENABLED:
            perform_cleanup()
            # รอ 6 ชั่วโมง (21600 วินาที)
            next_time = datetime.now()
            next_time = next_time.replace(hour=(next_time.hour + 6) % 24, minute=0, second=0, microsecond=0)
            cleanup_state['next_cleanup'] = next_time.isoformat()
            time.sleep(6 * 3600)
        else:
            # ถ้าปิดการใช้งาน รอ 1 ชั่วโมงแล้วเช็คใหม่
            time.sleep(3600)


@app.route('/api/cleanup/now', methods=['POST'])
def cleanup_now():
    """ลบรูปเก่าทันที (manual trigger)"""
    try:
        deleted = perform_cleanup()
        return jsonify({
            'success': True,
            'deleted': deleted,
            'message': f'Deleted {deleted} old images (older than {AUTO_CLEANUP_DAYS} days)'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cleanup/status', methods=['GET'])
def cleanup_status():
    """ดูสถานะ auto-cleanup"""
    try:
        # นับจำนวนไฟล์ใน static/generated
        total_files = 0
        total_size = 0
        for filename in os.listdir(STATIC_FOLDER):
            if filename.endswith(('.png', '.jpg', '.jpeg')):
                filepath = os.path.join(STATIC_FOLDER, filename)
                if os.path.exists(filepath):
                    total_files += 1
                    total_size += os.path.getsize(filepath)
        
        # แปลงขนาดเป็น MB
        total_size_mb = round(total_size / (1024 * 1024), 2)
        
        return jsonify({
            'success': True,
            'cleanup': {
                'enabled': cleanup_state['enabled'],
                'last_cleanup': cleanup_state['last_cleanup'],
                'next_cleanup': cleanup_state['next_cleanup'],
                'files_deleted_last': cleanup_state['files_deleted'],
                'cleanup_days': AUTO_CLEANUP_DAYS
            },
            'storage': {
                'total_files': total_files,
                'total_size_mb': total_size_mb
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/history/all', methods=['DELETE'])
def delete_all_history():
    """Delete all jobs from history"""
    try:
        save_history([])
        return jsonify({
            'success': True,
            'message': 'All history deleted'
        })
    except Exception as e:
        print(f"Error deleting all history: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """ดูรายการ jobs ทั้งหมดจาก history"""
    try:
        history = load_history()
        return jsonify({
            'success': True,
            'jobs': history,
            'total': len(history)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/history/<job_id>', methods=['GET'])
def get_history_job(job_id):
    """ดู job เดียวจาก history"""
    try:
        history = load_history()
        job = next((j for j in history if j['id'] == job_id), None)
        
        if not job:
            return jsonify({
                'success': False,
                'error': 'Job not found in history'
            }), 404
        
        return jsonify({
            'success': True,
            'job': job
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/history/<job_id>', methods=['DELETE'])
def delete_history_job(job_id):
    """ลบ job จาก history"""
    try:
        history = load_history()
        
        # หา index ของ job ที่ต้องการลบ
        job_index = None
        for i, job in enumerate(history):
            if job.get('id') == job_id:
                job_index = i
                break
        
        if job_index is None:
            return jsonify({
                'success': False,
                'error': 'Job not found in history'
            }), 404
        
        # ลบ job จาก history
        history.pop(job_index)
        
        # บันทึก history ใหม่
        save_history(history)
        
        return jsonify({
            'success': True,
            'message': 'Job deleted from history'
        })
    except Exception as e:
        print(f"Error deleting history job: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/rerun/<job_id>', methods=['POST'])
def rerun_job(job_id):
    """รีรัน job เก่า (ใช้ settings เดิม แต่สร้าง job ใหม่)"""
    try:
        # ต้องมี API key
        data = request.get_json()
        api_key = data.get('api_key', '').strip()
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key is required'
            }), 400
        
        # หา job ใน history
        history = load_history()
        old_job = next((j for j in history if j['id'] == job_id), None)
        
        if not old_job:
            return jsonify({
                'success': False,
                'error': 'Job not found in history'
            }), 404
        
        # สร้าง job ใหม่ด้วย settings เดิม
        new_job_id = create_job(
            prompts=old_job['prompts'],
            model=old_job['model'],
            mode=old_job['mode'],
            master_prompts=old_job.get('master_prompts', ''),
            suffix=old_job.get('suffix', ''),
            negative_prompts=old_job.get('negative_prompts', ''),
            aspect_ratio=old_job.get('aspect_ratio', '1:1')
        )
        
        # Start background processing
        thread = threading.Thread(target=process_generation, args=(new_job_id, api_key))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'job_id': new_job_id,
            'message': f'Re-running job with {len(old_job["prompts"])} prompts',
            'total': len(old_job['prompts'])
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    """ลบรูปเก่าที่อายุเกินกำหนด (legacy endpoint)"""
    try:
        max_age_hours = request.json.get('max_age_hours', 24) if request.json else 24
        
        # สร้าง temporary ImageGenerator instance สำหรับ cleanup
        temp_generator = ImageGenerator(api_key="dummy", output_dir=STATIC_FOLDER)
        deleted = temp_generator.cleanup_old_images(max_age_hours)
        
        return jsonify({
            'success': True,
            'deleted': deleted,
            'message': f'Deleted {deleted} old images'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Error handlers
@app.errorhandler(404)
def not_found(_error):
    return jsonify({'success': False, 'error': 'Not found'}), 404


@app.errorhandler(500)
def server_error(_error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Create directories if not exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs(STATIC_FOLDER, exist_ok=True)
    
    # Start auto-cleanup thread if enabled
    if AUTO_CLEANUP_ENABLED:
        cleanup_thread = threading.Thread(target=auto_cleanup_scheduler, daemon=True)
        cleanup_thread.start()
        print(f"[Auto-cleanup] Enabled - will run every 6 hours (delete files older than {AUTO_CLEANUP_DAYS} days)")
    else:
        print("[Auto-cleanup] Disabled")
    
    # Run app
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("=" * 60)
    print("Starting Batch Image Generator...")
    print("=" * 60)
    print(f"Generated images will be saved to: {STATIC_FOLDER}")
    print(f"Server running on: http://0.0.0.0:{port}")
    print("=" * 60)
    
    app.run(debug=debug, host='0.0.0.0', port=port)
