# Batch Image Generator

โปรแกรมสร้างรูปภาพอัตโนมัติจาก prompts หลายๆ อันพร้อมกัน โดยใช้ Google Gemini API (Nano Banana models)

## ✨ ฟีเจอร์

- 🔑 **User API Keys**: แต่ละคนใช้ API key ของตัวเอง (เก็บใน browser)
- 📝 **Batch Input**: วาง prompts หลายๆ บรรทัดพร้อมกัน
- 🚀 **Flexible Generation**: เลือกได้ว่าจะ generate ทีละรูป (Sequential) หรือหลายรูปพร้อมกัน (Parallel)
- 🎨 **Model Selection**: รองรับทั้ง Nano Banana (fast) และ Nano Banana Pro (quality)
- 📊 **Real-time Progress**: ติดตามความคืบหน้าแบบ real-time
- 💾 **Download Options**: ดาวน์โหลดรูปทีละรูปหรือทั้งหมดเป็น ZIP
- 🎯 **Prefix/Suffix**: เพิ่ม prefix/suffix ให้ prompts ทั้งหมดอัตโนมัติ
- ⏹️ **Cancel Jobs**: หยุดการสร้างรูปได้ตลอดเวลา

## 📋 ความต้องการ

- Python 3.8+
- Google Gemini API Key ([รับได้ที่นี่](https://aistudio.google.com/app/apikey))

## 🚀 การติดตั้ง

1. Clone หรือดาวน์โหลดโปรเจค

2. ติดตั้ง dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) สร้างไฟล์ `.env` สำหรับการตั้งค่า:
```bash
cp .env.example .env
```

**หมายเหตุ:** ไม่จำเป็นต้องใส่ `GOOGLE_API_KEY` ใน `.env` อีกต่อไป เพราะแต่ละ user จะใส่ API key ของตัวเองผ่าน UI

## 💻 การใช้งาน

1. รันโปรแกรม:
```bash
python app.py
```

2. เปิดเบราว์เซอร์ไปที่: `http://localhost:5000`

3. **ครั้งแรก:** จะมี modal ขึ้นมาให้ใส่ Google Gemini API Key ของคุณ
   - ไปรับ API key ได้ที่: https://aistudio.google.com/apikey
   - API key จะถูกเก็บใน browser ของคุณเท่านั้น (localStorage)
   - กด "ทดสอบ & บันทึก" เพื่อตรวจสอบว่า key ใช้งานได้

4. ใส่ prompts (กด "➕ เพิ่ม Prompt" เพื่อเพิ่มช่อง):
```
A cute cat wearing sunglasses
A robot playing guitar
A sunset over the ocean
```

5. เลือกการตั้งค่า:
   - **Model**: Nano Banana (เร็ว) หรือ Nano Banana Pro (คุณภาพสูง)
   - **Mode**: Sequential (ทีละรูป) หรือ Parallel (พร้อมกัน)
   - **Prefix/Suffix**: (ถ้าต้องการ)

6. กด "🚀 Generate Images" และรอดูผลลัพธ์!

### 🔑 การจัดการ API Key

- **เปลี่ยน API Key**: กดปุ่ม "🔑 เปลี่ยน API Key" ที่มุมขวาบน
- **ความปลอดภัย**: 
  - API key เก็บใน browser ของคุณเท่านั้น (localStorage)
  - เราส่ง key ไปยัง Google Gemini API โดยตรง (ไม่ผ่าน server)
  - ค่าใช้จ่ายคิดจาก Google Cloud account ของคุณเอง

## 📁 โครงสร้างโปรเจค

```
other_forD/
├── app.py                 # Flask web server
├── image_generator.py     # Image generation logic
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (สร้างเอง)
├── .env.example          # ตัวอย่าง env file
├── README.md             # คู่มือนี้
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   ├── js/
│   │   └── main.js       # Frontend logic
│   └── generated/        # รูปที่ generate (auto-created)
└── templates/
    └── index.html        # หน้า UI หลัก
```

## ⚙️ การตั้งค่า

แก้ไขใน `.env` (optional):

- `MAX_WORKERS`: จำนวนรูปที่ generate พร้อมกันสูงสุด (default: 3)
- `FLASK_DEBUG`: เปิด/ปิด debug mode

**หมายเหตุ:** `GOOGLE_API_KEY` ไม่จำเป็นใน `.env` อีกต่อไป เพราะแต่ละ user ใส่ผ่าน UI

## 🎯 Models

### Nano Banana (`gemini-2.5-flash-image`)
- ⚡ เร็ว เหมาะสำหรับ batch generation
- 💰 ประหยัด quota
- ✅ คุณภาพดี

### Nano Banana Pro (`gemini-3-pro-image-preview`)
- 🎨 คุณภาพสูง professional-grade
- 🧠 เข้าใจ prompt ซับซ้อนได้ดีกว่า
- 🔤 Render text ในรูปได้ดีกว่า

## ⚠️ ข้อควรระวัง

- **API Rate Limits**: Gemini API มีข้อจำกัดการใช้งาน ถ้า generate เยอะๆ ควรใช้ Sequential mode
- **Memory Usage**: การ generate รูปหลายๆ รูปพร้อมกัน จะใช้ RAM เยอะ
- **Storage**: รูปที่ generate จะถูกเก็บใน `static/generated/` ควรลบรูปเก่าเป็นระยะ

## 🐛 แก้ปัญหา

### Import Error / Module Not Found
```bash
pip install -r requirements.txt --upgrade
```

### API Key Error
- ตรวจสอบว่าใส่ API key ถูกต้องใน `.env`
- ตรวจสอบว่า API key ยังใช้งานได้ที่ [AI Studio](https://aistudio.google.com)

### Generation Failed
- ตรวจสอบ prompt ว่าไม่มีเนื้อหาที่ไม่เหมาะสม
- ลอง generate ใหม่อีกครั้ง (อาจเป็น temporary error)

## 📝 License

MIT License - ใช้งานได้อย่างอิสระ

## 🙏 Credits

- Google Gemini API for image generation
- Flask for web framework
