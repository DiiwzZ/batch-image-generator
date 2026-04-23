# Batch Image Generator

โปรแกรมสร้างรูปภาพอัตโนมัติจาก prompts หลายๆ อันพร้อมกัน โดยใช้ Google Gemini API (Nano Banana models)

## ✨ ฟีเจอร์

- **User API Keys**: แต่ละคนใช้ API key ของตัวเอง (เก็บใน browser)
- **สองโหมด**: Text only และ Reference image (อัปโหลดรูปอ้างอิงเพื่อคงคนเดิม/สิ่งเดิม)
- **Reference Type**: Person / Animal / Object พร้อม Auto-detect และ preset Master/Negative
- **Batch Input**: วาง prompts หลายๆ บรรทัดพร้อมกัน
- **Master / Suffix / Negative Prompts**: เพิ่ม prefix, suffix, และ avoid ให้ทุก prompt อัตโนมัติ
- **Presets**: บันทึกและโหลดชุด Master/Negative ได้
- **Aspect Ratio**: เลือก 1:1, 16:9, 9:16 ฯลฯ (non-1:1 ใช้ได้กับ Pro เท่านั้น)
- **Flexible Generation**: Sequential (ทีละรูป) หรือ Parallel (พร้อมกัน)
- **Model Selection**: Nano Banana (fast) และ Nano Banana Pro (quality)
- **Auto-retry**: retry อัตโนมัติสูงสุด 2 ครั้งเมื่อ generation ล้มเหลว
- **Real-time Progress**: ติดตามความคืบหน้าแบบ real-time
- **Browser Notification**: แจ้งเตือนเมื่อ batch เสร็จ (แม้เปิด tab อื่น)
- **Job History**: ดูประวัติ, Rerun, Delete
- **Download**: ดาวน์โหลดทีละรูป หรือทั้งหมดเป็น ZIP (พร้อม manifest.json)
- **Image Preview**: คลิกรูปเพื่อดูตัวอย่างเต็ม
- **Dark Mode**: โหมด Light/Dark
- **Auto-cleanup**: ลบรูปเก่าอัตโนมัติ (เปิด/ปิดได้)
- **Cancel Jobs**: หยุดการสร้างรูปได้ตลอดเวลา

## 📋 ความต้องการ

- Python 3.11+
- Google Gemini API Key ([รับได้ที่นี่](https://aistudio.google.com/app/apikey))

## 🚀 การติดตั้ง

1. Clone หรือดาวน์โหลดโปรเจค

2. ติดตั้ง dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) สร้างไฟล์ `.env` สำหรับการตั้งค่า:
```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

**หมายเหตุ:** ไม่จำเป็นต้องใส่ `GOOGLE_API_KEY` ใน `.env` เพราะแต่ละ user จะใส่ API key ผ่าน UI

## 💻 การใช้งาน

1. รันโปรแกรม:
```bash
python app.py
```

2. เปิดเบราว์เซอร์ไปที่: `http://localhost:5000`

3. **ครั้งแรก:** จะมี modal ขึ้นมาให้ใส่ Google Gemini API Key
   - รับ API key ได้ที่: https://aistudio.google.com/apikey
   - API key เก็บใน browser (localStorage)
   - กด "Test & Save" เพื่อตรวจสอบและบันทึก

4. เลือกโหมด:
   - **Text only**: สร้างรูปจาก prompt เท่านั้น
   - **Reference image**: อัปโหลดรูปอ้างอิง เพื่อคงคนเดิม/สัตว์เดิม/สิ่งเดิมในรูปใหม่

5. ใส่ prompts (กด "Add Prompt" เพื่อเพิ่มช่อง):
```
A cute cat wearing sunglasses
A robot playing guitar
A sunset over the ocean
```

6. เลือกการตั้งค่า:
   - **Model**: Nano Banana (เร็ว) หรือ Nano Banana Pro (คุณภาพสูง)
   - **Mode**: Sequential (ทีละรูป) หรือ Parallel (พร้อมกัน)
   - **Aspect Ratio**: 1:1, 16:9, 9:16 ฯลฯ
   - **Master Prompts / Suffix / Negative Prompts**: (ถ้าต้องการ) หรือโหลด Preset

7. กด "Generate Images" และรอดูผลลัพธ์!

### โหมด Reference Image

1. เลือกแท็บ "Reference image"
2. อัปโหลดรูปอ้างอิง (ลากวางหรือคลิกเลือก) — JPG, PNG, WebP สูงสุด 10MB
3. เลือกประเภท: Person / Animal / Object หรือกด "Auto-detect"
4. ระบบจะโหลด preset Master/Negative ให้อัตโนมัติ (แก้ได้)
5. ใส่ prompts แล้วกด Generate

### การจัดการ API Key

- **เปลี่ยน API Key**: กดปุ่ม "Change API Key" ที่มุมขวาบน
- **ความปลอดภัย**: API key เก็บใน browser เท่านั้น, ส่งไปยัง Google API โดยตรง, ค่าใช้จ่ายคิดจาก Google Cloud account ของคุณ

## 📁 โครงสร้างโปรเจค

```
batch-image-generator/
├── app.py                 # Flask web server
├── image_generator.py     # Image generation logic
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (สร้างเอง)
├── .env.example           # ตัวอย่าง env file
├── README.md              # คู่มือนี้
├── QUICKSTART.md          # คู่มือเริ่มต้นด่วน
├── USAGE_EXAMPLES.md      # ตัวอย่างการใช้งาน
├── check_models.py        # ตรวจสอบ models ที่ใช้ได้
├── test_api.py            # ทดสอบ API
├── data/
│   └── jobs_history.json  # ประวัติ jobs (auto-created)
├── static/
│   ├── css/style.css      # Styling
│   ├── js/main.js         # Frontend logic
│   └── generated/         # รูปที่ generate (auto-created)
└── templates/
    └── index.html         # หน้า UI หลัก
```

## ⚙️ การตั้งค่า

แก้ไขใน `.env` (optional):

- `SECRET_KEY`: secret key สำหรับ Flask session (ควรตั้งค่าใน production)
- `MAX_WORKERS`: จำนวนรูปที่ generate พร้อมกันสูงสุด (default: 3)
- `AUTO_CLEANUP_ENABLED`: เปิด/ปิด auto-cleanup (true/false)
- `AUTO_CLEANUP_DAYS`: ลบรูปเก่ากว่า X วัน (default: 7)

## 🎯 Models

### Nano Banana (`gemini-2.5-flash-image`)
- เร็ว เหมาะกับ batch generation
- ประหยัด quota
- Aspect ratio 1:1 เท่านั้น

### Nano Banana Pro (`gemini-3-pro-image-preview`)
- คุณภาพสูง
- รองรับ Aspect ratio หลากหลาย (16:9, 9:16 ฯลฯ)
- Render text ได้ดีกว่า

## ⚠️ ข้อควรระวัง

- **API Rate Limits**: Gemini API มีข้อจำกัด ถ้า generate เยอะ ใช้ Sequential mode
- **Memory Usage**: Parallel mode ใช้ RAM เยอะ
- **Storage**: รูปเก็บใน `static/generated/` — เปิด auto-cleanup หรือลบรูปเก่าเป็นระยะ
- **Reference mode Rerun**: Job ที่มี reference ใช้ Rerun ไม่ได้ (ไม่มีรูปอ้างอิงเก็บ) — ต้องอัปโหลดรูปใหม่

## 🐛 แก้ปัญหา

### Import Error / Module Not Found
```bash
pip install -r requirements.txt --upgrade
```

### API Key Error
- ใส่ API key ผ่าน UI (ไม่จำเป็นต้องมีใน .env)
- ตรวจสอบว่า key ยังใช้งานได้ที่ [AI Studio](https://aistudio.google.com)

### Generation Failed
- ระบบจะ retry อัตโนมัติสูงสุด 2 ครั้ง — ส่วนใหญ่หายเองโดยไม่ต้องทำอะไร
- ถ้ายัง failed หลัง retry ให้ตรวจสอบ prompt ว่าไม่มีเนื้อหาที่ไม่เหมาะสม
- ลอง generate ใหม่อีกครั้ง หรือลด Parallel workers ลง

## 📝 License

MIT License

## 🙏 Credits

- Google Gemini API for image generation
- Flask for web framework
