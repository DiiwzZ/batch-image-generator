# 📚 Usage Examples & Best Practices

## ตัวอย่างการใช้งานแบบต่างๆ

### 1. สร้างรูปธรรมดา (Basic Generation)

**Prompts:**
```
A cute cat
A dog playing
A beautiful sunset
```

**Settings:**
- Model: Nano Banana (Fast)
- Mode: Sequential
- Prefix: (ว่าง)
- Suffix: (ว่าง)

---

### 2. สร้างรูปคุณภาพสูง (High Quality)

**Prompts:**
```
A cyberpunk city at night
A magical forest scene
A steampunk airship
```

**Settings:**
- Model: Nano Banana Pro (Quality) ⭐
- Mode: Sequential
- Prefix: `high quality, highly detailed, professional photography, `
- Suffix: `, 4k, sharp focus`

---

### 3. Batch Generation แบบเร็ว (Fast Batch)

**Prompts:** (10-20 prompts)
```
Animal 1
Animal 2
Animal 3
...
```

**Settings:**
- Model: Nano Banana (Fast) ⭐
- Mode: Parallel ⚡
- Prefix: `simple illustration of `
- Suffix: (ว่าง)

---

### 4. สร้างรูปชุดธีมเดียวกัน (Themed Generation)

**Theme: Cute Animals**

**Prompts:**
```
an orange cat
a golden retriever
a white rabbit
a gray elephant
a pink flamingo
```

**Settings:**
- Model: Nano Banana Pro
- Mode: Sequential
- Prefix: `cute cartoon style illustration of `
- Suffix: `, kawaii style, pastel colors, white background`

---

### 5. สร้างรูปสไตล์ศิลปะ (Art Styles)

**Prompts:**
```
a mountain landscape
an ocean view
a forest path
a desert sunset
```

**Settings:**
- Model: Nano Banana Pro
- Mode: Sequential
- Prefix: (ว่าง)
- Suffix: `, oil painting style, artistic, masterpiece`

**ทดลองเปลี่ยน Suffix:**
- `, watercolor painting style`
- `, digital art, vibrant colors`
- `, pencil sketch, black and white`
- `, anime style, Studio Ghibli inspired`

---

## 🎨 Prompt Writing Tips

### โครงสร้าง Prompt ที่ดี

```
[Subject] + [Action/Pose] + [Environment] + [Style] + [Quality]
```

**ตัวอย่าง:**
```
A cute robot [Subject]
dancing happily [Action]
in a colorful garden [Environment]
digital art style [Style]
highly detailed, vibrant colors [Quality]
```

### คำที่ควรใช้

**สำหรับคุณภาพ:**
- `high quality`
- `highly detailed`
- `professional photography`
- `4k`, `8k`
- `sharp focus`
- `masterpiece`

**สำหรับสไตล์:**
- `digital art`
- `oil painting`
- `watercolor`
- `anime style`
- `photorealistic`
- `cartoon style`
- `minimalist`

**สำหรับแสงไฟ:**
- `warm lighting`
- `soft lighting`
- `dramatic lighting`
- `golden hour`
- `cinematic lighting`

**สำหรับมุมมอง:**
- `close-up shot`
- `wide angle`
- `aerial view`
- `front view`
- `side view`

---

## 🔧 Advanced Techniques

### 1. ใช้ Prefix/Suffix เพื่อความสม่ำเสมอ

แทนที่จะเขียนซ้ำๆ ในทุก prompt:

❌ **ไม่ดี:**
```
professional photo of a cat, high quality, 4k
professional photo of a dog, high quality, 4k
professional photo of a bird, high quality, 4k
```

✅ **ดี:**

Prefix: `professional photo of `
Suffix: `, high quality, 4k`

Prompts:
```
a cat
a dog
a bird
```

### 2. สร้างรูปหลายเวอร์ชั่น

ใช้ variations ของ prompt เดียวกัน:

```
A cat in a garden, sunny day
A cat in a garden, rainy day
A cat in a garden, sunset
A cat in a garden, night time with moon
```

### 3. Negative Space & Composition

ระบุพื้นหลังหรือองค์ประกอบ:

```
A minimalist illustration of a coffee cup, white background, centered
A product photo of a smartphone, clean background, professional lighting
```

---

## ⚡ Performance Tips

### เลือก Model ให้เหมาะสม

**Nano Banana (Fast):**
- ✅ Batch ขนาดใหญ่ (10+ รูป)
- ✅ Content ง่ายๆ
- ✅ ต้องการความเร็ว
- ✅ ประหยัด quota

**Nano Banana Pro (Quality):**
- ✅ รูปสำคัญที่ต้องการคุณภาพสูง
- ✅ Prompt ซับซ้อน
- ✅ ต้องการ text ในรูป
- ✅ Professional use

### เลือก Mode ให้เหมาะสม

**Sequential:**
- ✅ Batch ใหญ่ (20+ รูป)
- ✅ ป้องกัน rate limit
- ✅ Stable และปลอดภัย
- ✅ แนะนำสำหรับผู้เริ่มต้น

**Parallel:**
- ✅ Batch เล็ก (5-10 รูป)
- ✅ ต้องการความเร็ว
- ⚠️ อาจโดน rate limit
- ⚠️ ใช้ resources เยอะ

---

## 📊 Example Use Cases

### Use Case 1: Social Media Content

สร้างรูปสำหรับโพสต์ Instagram/Facebook:

```
A modern minimalist home office setup, clean aesthetic
A healthy breakfast bowl with fruits, overhead view
A cozy reading nook with books and plants
```

Settings: Nano Banana Pro, Sequential

### Use Case 2: Concept Art

สร้างรูป concept art สำหรับโปรเจค:

```
A sci-fi spaceship interior, futuristic design
A fantasy tavern, medieval style
A post-apocalyptic city ruins
```

Settings: Nano Banana Pro, Sequential

### Use Case 3: Product Mockups

สร้างรูป mockup สำหรับสินค้า:

```
A modern coffee mug on a wooden table
A stylish laptop on a minimalist desk
A smartphone with blank screen, professional product photo
```

Settings: Nano Banana Pro, Sequential

### Use Case 4: Educational Content

สร้างรูปประกอบเนื้อหาการเรียน:

```
Diagram of solar system, educational illustration
Cute cartoon character explaining math
Historical medieval castle, detailed illustration
```

Settings: Nano Banana, Sequential

---

## 🚫 Common Mistakes to Avoid

### 1. Prompt สั้นเกินไป

❌ `cat`
✅ `A cute orange cat sitting in a sunny garden`

### 2. Prompt ขัดแย้งกัน

❌ `A realistic photo, cartoon style, abstract art`
✅ `A realistic photo of a cat` หรือ `A cartoon style cat`

### 3. ใช้ Parallel กับ Batch ใหญ่

❌ 50 prompts + Parallel mode = Rate limit!
✅ 50 prompts + Sequential mode = ✅

### 4. ลืมใช้ Prefix/Suffix

❌ เขียนซ้ำๆ ใน prompt
✅ ใช้ Prefix/Suffix เพื่อความสะดวก

---

## 💡 Pro Tips

1. **เก็บ prompts ที่ดีไว้:** สร้างไฟล์ .txt เก็บ prompts ที่ชอบ
2. **ทดสอบก่อน:** ลอง generate 1-2 รูปก่อนทำ batch ใหญ่
3. **ใช้ consistent style:** ใช้ prefix/suffix เพื่อให้รูปมีสไตล์เดียวกัน
4. **Backup รูปสำคัญ:** Download รูปที่ชอบออกมาเก็บไว้
5. **ทดลอง variations:** ลอง prompt แบบต่างๆ เพื่อหา result ที่ดีที่สุด

---

## 📖 Learning Resources

**ต้องการเรียนรู้เพิ่มเติม?**

- Google AI Studio: https://aistudio.google.com
- Gemini API Docs: https://ai.google.dev/gemini-api/docs
- Prompt Engineering Guide: https://www.promptingguide.ai

**Community Examples:**
- ลองค้นหา "AI image generation prompts" ใน Google
- ดู examples จากคนอื่นๆ เพื่อหาไอเดีย
- ทดลองและปรับแต่งให้เหมาะกับงานของคุณ

---

Happy generating! 🎨✨
