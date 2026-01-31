# 🚀 Quick Start Guide

## ขั้นตอนการเริ่มต้นใช้งาน

### 1. เตรียม API Key

1. ไปที่ [Google AI Studio](https://aistudio.google.com/app/apikey)
2. สร้าง API key (ฟรี!)
3. Copy API key ที่ได้

### 2. ติดตั้ง Dependencies

เปิด Terminal/Command Prompt และรันคำสั่ง:

```bash
pip install -r requirements.txt
```

**หมายเหตุ:** ถ้าใช้ Python 3.11+ อาจต้องติดตั้ง packages ทีละตัว:

```bash
pip install flask google-genai python-dotenv Pillow
```

### 3. ตั้งค่า API Key

สร้างไฟล์ `.env` โดย copy จาก `.env.example`:

**Windows:**
```bash
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

แล้วแก้ไขไฟล์ `.env` ใส่ API key ของคุณ:

```
GOOGLE_API_KEY=your_actual_api_key_here
```

### 4. ทดสอบ API Connection (ไม่จำเป็น)

รัน test script เพื่อทดสอบว่า API key ใช้งานได้:

```bash
python test_api.py
```

ถ้าสำเร็จจะเห็น:
- ✅ API Key loaded
- ✅ ImageGenerator initialized
- ✅ รูปภาพที่สร้างใน folder `static/generated/`

### 5. รันโปรแกรม

```bash
python app.py
```

คุณจะเห็นข้อความ:
```
🚀 Starting Batch Image Generator...
📁 Generated images will be saved to: static/generated
🌐 Open your browser at: http://localhost:5000
```

### 6. เปิดเบราว์เซอร์

เปิดเบราว์เซอร์แล้วไปที่:
```
http://localhost:5000
```

## 📖 วิธีใช้งาน

### สร้างรูปภาพ

1. **ใส่ Prompts:**
   - พิมพ์ prompts ใน textarea (แต่ละบรรทัด = 1 รูป)
   - ตัวอย่าง:
     ```
     A cute cat wearing sunglasses
     A robot playing guitar
     A sunset over the ocean
     ```

2. **เลือกการตั้งค่า:**
   - **Model:** 
     - `Nano Banana` = เร็ว เหมาะกับ batch
     - `Nano Banana Pro` = คุณภาพสูง
   - **Mode:**
     - `Sequential` = ทีละรูป (แนะนำ)
     - `Parallel` = พร้อมกัน (เร็วกว่า แต่ใช้ quota เยอะ)
   - **Prefix/Suffix:** (ไม่จำเป็น)
     - เพิ่มคำข้างหน้า/หลังทุก prompt
     - ตัวอย่าง prefix: `high quality, detailed, `

3. **กด Generate:**
   - กด `🚀 Generate Images`
   - รอดู progress bar
   - เมื่อเสร็จจะแสดงรูปที่ gallery ด้านล่าง

4. **ดาวน์โหลด:**
   - Download ทีละรูป: กดปุ่ม `💾 Download` ใต้รูป
   - Download ทั้งหมด: กด `📦 Download All (ZIP)`

## 🎯 Tips & Tricks

### เขียน Prompt ที่ดี

✅ **ดี:**
```
A cute orange cat wearing sunglasses, sitting on a beach chair, digital art, highly detailed
```

❌ **ไม่ดี:**
```
cat
```

### ใช้ Prefix/Suffix

แทนที่จะเขียน:
```
high quality photo of a cat
high quality photo of a dog
high quality photo of a bird
```

ใช้:
- **Prefix:** `high quality photo of `
- **Prompts:**
  ```
  a cat
  a dog
  a bird
  ```

### Sequential vs Parallel

- **Sequential (แนะนำ):**
  - ทีละรูป
  - ป้องกัน rate limit
  - เหมาะกับ batch ใหญ่

- **Parallel:**
  - พร้อมกัน 3-5 รูป
  - เร็วกว่า
  - เหมาะกับ batch เล็ก

## ⚠️ Troubleshooting

### Error: API Key not found
- ตรวจสอบว่าสร้างไฟล์ `.env` แล้ว
- ตรวจสอบว่าใส่ API key ถูกต้อง

### Error: Module not found
```bash
pip install -r requirements.txt --upgrade
```

### Generation Failed / API Error
- ตรวจสอบว่า prompt ไม่มีเนื้อหาไม่เหมาะสม
- ตรวจสอบว่า API key ยังใช้งานได้
- ลองอีกครั้ง (อาจเป็น temporary error)

### Port 5000 already in use
แก้ไขใน `app.py` บรรทัดสุดท้าย:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # เปลี่ยนเป็น port อื่น
```

## 📞 Support

หากพบปัญหา:
1. อ่าน README.md
2. ตรวจสอบ console error messages
3. ทดสอบด้วย `python test_api.py`

## 🎉 สนุกกับการสร้างรูปภาพ!

ตัวอย่าง prompts ที่น่าสนใจ:
- `A cyberpunk city at night with neon lights`
- `A cute robot chef cooking in a modern kitchen`
- `A magical treehouse in an enchanted forest`
- `A steampunk airship flying through clouds`
- `A cozy coffee shop on a rainy day, anime style`
