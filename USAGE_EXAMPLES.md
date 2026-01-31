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
- Master Prompts: (ว่าง)
- Negative Prompts: (ว่าง)

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
- Master Prompts: `high quality, highly detailed, professional photography, `
- Negative Prompts: `blurry, low quality, distorted`

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
- Master Prompts: `simple illustration of `
- Negative Prompts: (ว่าง)

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
- Master Prompts: `cute cartoon style illustration of `
- Suffix: `, kawaii style, pastel colors, white background`
- Negative Prompts: (ว่าง)

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
- Master Prompts: (ว่าง)
- Suffix: `, oil painting style, artistic, masterpiece`
- Negative Prompts: (ว่าง)

**ทดลองเปลี่ยน Suffix:**
- `, watercolor painting style`
- `, digital art, vibrant colors`
- `, pencil sketch, black and white`
- `, anime style, Studio Ghibli inspired`

---

### 6. โหมด Reference Image (คงคนเดิม/สัตว์เดิม/สิ่งเดิม)

**วัตถุประสงค์:** สร้างรูปใหม่ที่คงบุคคล/สัตว์/สิ่งของเดิมจากรูปอ้างอิง

**ขั้นตอน:**
1. เลือกแท็บ "Reference image"
2. อัปโหลดรูปอ้างอิง (JPG, PNG, WebP สูงสุด 10MB)
3. เลือกประเภท: **Person** / **Animal** / **Object** หรือกด "Auto-detect"
4. ระบบจะโหลด preset Master/Negative ให้อัตโนมัติ (แก้ได้)
5. ใส่ prompts แล้วกด Generate

**ตัวอย่าง Person (คงคนเดิม):**

รูปอ้างอิง: รูปบุคคล
- Reference Type: Person
- Master Prompts: `same person as reference, consistent face and identity, `
- Negative Prompts: `duplicate faces, deformed, different person, different face`
- Prompts:
  ```
  wearing a red hat, smiling
  standing in an office, professional attire
  sitting in a cafe, casual outfit
  ```

**ตัวอย่าง Animal (คงสัตว์เดิม):**

รูปอ้างอิง: รูปสัตว์เลี้ยง
- Reference Type: Animal
- Master Prompts: `same creature as reference, consistent anatomy and features, `
- Negative Prompts: `extra limbs, wrong proportions, different animal`
- Prompts:
  ```
  running in a park, sunny day
  sleeping on a couch
  wearing a small hat, cute pose
  ```

**ตัวอย่าง Object (คงสินค้าเดิม):**

รูปอ้างอิง: รูปสินค้า
- Reference Type: Object
- Master Prompts: `same object as reference, accurate form and details, `
- Negative Prompts: `distorted, blurry, different object`
- Prompts:
  ```
  on a white background, product shot
  in a lifestyle setting, living room
  with packaging, marketing style
  ```

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

### 1. ใช้ Master/Negative Prompts เพื่อความสม่ำเสมอ

แทนที่จะเขียนซ้ำๆ ในทุก prompt:

❌ **ไม่ดี:**
```
professional photo of a cat, high quality, 4k, avoid blurry
professional photo of a dog, high quality, 4k, avoid blurry
professional photo of a bird, high quality, 4k, avoid blurry
```

✅ **ดี:**

Master Prompts: `professional photo of `
Suffix: `, high quality, 4k`
Negative Prompts: `blurry, low quality, distorted`

Prompts:
```
a cat
a dog
a bird
```

ลำดับ prompt สุดท้าย: `[aspect] + [master] + [prompt] + [suffix] + ", avoid: " + [negative]`

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

### 4. ลืมใช้ Master/Negative Prompts

❌ เขียนซ้ำๆ ใน prompt
✅ ใช้ Master Prompts และ Negative Prompts เพื่อความสะดวก

---

## 💡 Pro Tips

1. **เก็บ prompts ที่ดีไว้:** สร้างไฟล์ .txt เก็บ prompts ที่ชอบ
2. **ใช้ Preset:** บันทึก Master/Negative Prompts ที่ใช้บ่อยเป็น Preset
3. **ทดสอบก่อน:** ลอง generate 1-2 รูปก่อนทำ batch ใหญ่
4. **ใช้ consistent style:** ใช้ Master Prompts และ Suffix เพื่อให้รูปมีสไตล์เดียวกัน
5. **Reference mode:** เลือกรูปอ้างอิงที่ชัด พื้นหลังเรียบ เพื่อให้คงคน/สัตว์/สิ่งเดิมได้ดี
6. **Backup รูปสำคัญ:** Download รูปที่ชอบออกมาเก็บไว้

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
