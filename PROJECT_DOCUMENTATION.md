# เอกสารโปรเจค Petizo - Pet Management System

**ชื่อโปรเจค:** Petizo - ระบบจัดการสัตว์เลี้ยงและติดตามวัคซีน
**ผู้จัดทำ:** [ใส่ชื่อของคุณ]
**วันที่:** 21 ธันวาคม 2568
**เวอร์ชัน:** 1.0

---

## สารบัญ

1. [ภาพรวมโปรเจค](#1-ภาพรวมโปรเจค)
2. [ฟีเจอร์หลักของระบบ](#2-ฟีเจอร์หลักของระบบ)
3. [เทคโนโลยีที่ใช้](#3-เทคโนโลยีที่ใช้)
4. [สถาปัตยกรรมระบบ](#4-สถาปัตยกรรมระบบ)
5. [โครงสร้างฐานข้อมูล](#5-โครงสร้างฐานข้อมูล)
6. [โครงสร้างไฟล์โปรเจค](#6-โครงสร้างไฟล์โปรเจค)
7. [การติดตั้งและใช้งาน](#7-การติดตั้งและใช้งาน)
8. [การ Deploy ขึ้นเว็บ](#8-การ-deploy-ขึ้นเว็บ)
9. [ข้อดีและข้อจำกัด](#9-ข้อดีและข้อจำกัด)
10. [คำถามที่พบบ่อย (FAQ)](#10-คำถามที่พบบ่อย-faq)

---

## 1. ภาพรวมโปรเจค

### 1.1 ที่มาและวัตถุประสงค์

**Petizo** เป็นระบบจัดการสัตว์เลี้ยงแบบครบวงจร ที่พัฒนาขึ้นเพื่อช่วยเจ้าของสัตว์เลี้ยงในการบันทึกข้อมูล ติดตามประวัติการฉีดวัคซีน และเข้าถึงความรู้เกี่ยวกับการดูแลสัตว์เลี้ยงได้อย่างมีประสิทธิภาพ

**วัตถุประสงค์หลัก:**
- อำนวยความสะดวกในการจัดเก็บข้อมูลสัตว์เลี้ยง
- ติดตามและแจ้งเตือนการฉีดวัคซีนอัตโนมัติ
- ใช้เทคโนโลยี AI และ OCR ลดขั้นตอนการบันทึกข้อมูลจากเอกสาร
- เป็นแหล่งความรู้เกี่ยวกับการดูแลสัตว์เลี้ยง

### 1.2 กลุ่มผู้ใช้งานเป้าหมาย

1. **สมาชิกทั่วไป (Members)** - เจ้าของสัตว์เลี้ยง
2. **ผู้ดูแลระบบ (Admins)** - เจ้าหน้าที่จัดการระบบและเขียนบทความ

### 1.3 จุดเด่นของระบบ

| จุดเด่น | คำอธิบาย |
|---------|----------|
| 🤖 **OCR อัจฉริยะ** | สแกนใบรับรองวัคซีนด้วย AI (EasyOCR + Tesseract) ดึงข้อมูลอัตโนมัติ |
| 💬 **AI Chatbot** | ตอบคำถามเกี่ยวกับการดูแลสัตว์เลี้ยงด้วย GPT-4o-mini |
| 📌 **ปักหมุดบทความ** | แอดมินเลือกบทความแนะนำได้ แสดงด้านบนสุด |
| 🔒 **ความปลอดภัยสูง** | bcrypt encryption + JWT Token + ระบบรีเซ็ตรหัสผ่านผ่านอีเมล |
| 🚀 **Deploy ง่าย** | รองรับ Railway.app และ Docker |
| 🇹🇭 **รองรับภาษาไทย** | OCR อ่านภาษาไทยได้, URL Slug รองรับภาษาไทย |

---

## 2. ฟีเจอร์หลักของระบบ

### 2.1 ระบบผู้ใช้งาน (User Management)

#### 2.1.1 การลงทะเบียนและเข้าสู่ระบบ
- **สมาชิกทั่วไป (Members):**
  - ลงทะเบียนด้วย username, email, password, ชื่อ-นามสกุล, เบอร์โทร
  - เข้าสู่ระบบด้วย email/username + password
  - ได้รับ JWT Token สำหรับ authentication

- **ผู้ดูแลระบบ (Admins):**
  - สิทธิ์พิเศษในการจัดการระบบ
  - เขียนและจัดการบทความ
  - ปักหมุดบทความแนะนำ

#### 2.1.2 ระบบรีเซ็ตรหัสผ่าน
- ส่ง Token ผ่านอีเมล (SendGrid)
- Token มีอายุ 1 ชั่วโมง
- ตรวจสอบการใช้งาน Token (ใช้ได้ครั้งเดียว)

#### 2.1.3 ความปลอดภัย
- **bcrypt** - เข้ารหัสรหัสผ่านแบบ Hash (Salt rounds: 10)
- **JWT Token** - Authentication Token (Secret Key จาก .env)
- **Token Expiration** - กำหนดอายุ Token

---

### 2.2 ระบบจัดการสัตว์เลี้ยง (Pet Management)

#### 2.2.1 ข้อมูลสัตว์เลี้ยง
- **ข้อมูลพื้นฐาน:**
  - ชื่อสัตว์เลี้ยง
  - สายพันธุ์ (Breed)
  - เพศ (Male/Female)
  - วันเกิด
  - สี (Color)
  - น้ำหนัก (Weight)
  - หมายเลขไมโครชิป (Microchip ID)
  - รูปภาพ (Photo Upload)
  - บันทึกเพิ่มเติม (Notes)

#### 2.2.2 การจัดการข้อมูล
- เพิ่ม/แก้ไข/ลบข้อมูลสัตว์เลี้ยง
- อัปโหลดรูปภาพ (multer middleware)
- แสดงรายการสัตว์เลี้ยงทั้งหมดของสมาชิก
- Foreign Key เชื่อมกับ `members` table

---

### 2.3 ระบบติดตามวัคซีน (Vaccination Tracking) ⭐

#### 2.3.1 ตารางวัคซีนแนะนำ (Vaccine Schedules)
- กำหนดช่วงอายุที่ควรฉีดวัคซีน (age_weeks_min, age_weeks_max)
- ระบุว่าเป็นวัคซีนบูสเตอร์หรือไม่ (is_booster)
- ความถี่ในการฉีดซ้ำ (frequency_years)

**ตัวอย่างตารางวัคซีน:**
| วัคซีน | อายุ (สัปดาห์) | ประเภท | ความถี่ |
|--------|---------------|--------|---------|
| FVRCP ครั้งที่ 1 | 6-8 | ปกติ | - |
| FVRCP ครั้งที่ 2 | 10-12 | ปกติ | - |
| FVRCP ครั้งที่ 3 | 14-16 | ปกติ | - |
| Rabies | 12-16 | ปกติ | - |
| FVRCP Booster | 52+ | บูสเตอร์ | ทุก 1 ปี |
| Rabies Booster | 52+ | บูสเตอร์ | ทุก 1 ปี |

#### 2.3.2 บันทึกประวัติการฉีดวัคซีน (Vaccinations)
- **ข้อมูลที่บันทึก:**
  - ชื่อวัคซีน
  - ประเภทวัคซีน
  - วันที่ฉีด
  - วันครบกำหนดครั้งถัดไป (คำนวณอัตโนมัติ)
  - สัตวแพทย์ผู้ฉีด
  - ชื่อคลินิก
  - เลขล็อตวัคซีน (Batch Number)
  - รูปภาพใบรับรอง (Proof Image)
  - บันทึกเพิ่มเติม
  - สถานะ (completed, scheduled, overdue)

#### 2.3.3 ระบบ OCR สำหรับสแกนใบรับรองวัคซีน 🔥

**วิธีการทำงาน:**

```
1. ผู้ใช้อัปโหลดรูปใบรับรองวัคซีน
   ↓
2. Backend บันทึกไฟล์ชั่วคราว
   ↓
3. เรียก Python OCR Script (scan.py)
   ↓
4. ประมวลผลภาพ (OpenCV):
   - ปรับความคมชัด
   - ลดสัญญาณรบกวน
   - แปลงเป็นขาว-ดำ
   ↓
5. ดึงข้อความ (EasyOCR + Tesseract)
   ↓
6. วิเคราะห์ข้อความด้วย AI (GPT-4o-mini):
   - ชื่อวัคซีน
   - วันที่ฉีด
   - ชื่อคลินิก
   - สัตวแพทย์
   - เลขล็อต
   ↓
7. ส่งข้อมูลกลับเป็น JSON
   ↓
8. Frontend แสดงผลให้ผู้ใช้ยืนยัน
```

**เทคโนโลยีที่ใช้:**
- **EasyOCR** - OCR Engine หลัก (รองรับภาษาไทย, แม่นยำสูง)
- **Tesseract** - OCR Engine สำรอง (รวดเร็ว)
- **OpenCV** - ประมวลผลภาพ
- **OpenRouter API** - วิเคราะห์ข้อความด้วย GPT-4o-mini

---

### 2.4 ระบบบทความ (Blog System)

#### 2.4.1 การจัดการบทความ
- **CRUD Operations:**
  - Create - เขียนบทความใหม่ (แอดมินอย่างเดียว)
  - Read - อ่านบทความ (ทุกคน)
  - Update - แก้ไขบทความ (แอดมินอย่างเดียว)
  - Delete - ลบบทความ (แอดมินอย่างเดียว)

#### 2.4.2 ข้อมูลบทความ
- ชื่อบทความ (Title)
- Slug (URL-friendly, รองรับภาษาไทย)
- เนื้อหา (Content - WYSIWYG Editor)
- เนื้อหาย่อ (Excerpt)
- รูปภาพหน้าปก (Featured Image)
- หมวดหมู่ (Category)
- แท็ก (Tags)
- แหล่งอ้างอิง (Source Name, Source URL)
- สถานะ (draft, published)
- วันที่เผยแพร่ (published_at)
- ยอดวิว (views)
- **การปักหมุด (pinned)** - แสดงบทความแนะนำด้านบนสุด

#### 2.4.3 ระบบปักหมุดบทความ (Pinned Blog Feature)

**วิธีการทำงาน:**
1. แอดมินคลิกปุ่ม "ปักหมุด" ในหน้าจัดการบทความ
2. ส่ง PUT request ไปยัง `/api/admin/blog/:id` พร้อม `{ "pinned": 1 }`
3. Backend อัปเดตคอลัมน์ `pinned` ในฐานข้อมูล
4. Frontend แสดงตราสัญลักษณ์ "แนะนำ" (สีทอง) บนบทความ
5. บทความที่ปักหมุดจะถูกเรียงด้านบนสุด (`ORDER BY pinned DESC, published_at DESC`)

**การจัดเรียงบทความ:**
```sql
SELECT * FROM blogs
WHERE status = 'published'
ORDER BY pinned DESC, published_at DESC
LIMIT 10 OFFSET 0
```

#### 2.4.4 ระบบนับยอดวิว
- เพิ่มยอดวิวทุกครั้งที่มีการเปิดบทความ
- แสดงยอดวิวในหน้ารายการบทความ

---

### 2.5 ระบบ AI Chatbot 🤖

#### 2.5.1 การทำงาน
- ใช้ **OpenRouter API** เชื่อมต่อกับโมเดล GPT-4o-mini
- ตอบคำถามเกี่ยวกับการดูแลสัตว์เลี้ยง
- รองรับการสนทนาแบบ Context-aware

#### 2.5.2 ตัวอย่างการใช้งาน
```javascript
// Frontend
const response = await fetch(`${API_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'แมวควรฉีดวัคซีนอะไรบ้าง?'
  })
});

// Response
{
  "message": "แมวควรฉีดวัคซีนป้องกันโรคหลัก 3 ตัว ได้แก่...",
  "model": "openai/gpt-4o-mini"
}
```

---

## 3. เทคโนโลยีที่ใช้

### 3.1 Backend Stack

| เทคโนโลยี | เวอร์ชัน | หน้าที่ | เหตุผลที่เลือกใช้ |
|-----------|---------|---------|------------------|
| **Node.js** | ≥18.0.0 | JavaScript Runtime | รันเซิร์ฟเวอร์ JavaScript, Non-blocking I/O, Ecosystem กว้างขวาง |
| **Express.js** | 4.18.2 | Web Framework | สร้าง REST API ง่าย, Middleware ครบครัน, ชุมชนใหญ่ |
| **SQLite3** | 5.1.7 | Database | Serverless, ไม่ต้องติดตั้งเซิร์ฟเวอร์แยก, เก็บเป็นไฟล์เดียว |
| **bcrypt** | 5.1.1 | Password Hashing | เข้ารหัสรหัสผ่านแบบ One-way Hash, ป้องกัน Rainbow Table Attack |
| **jsonwebtoken** | 9.0.2 | Authentication | สร้าง JWT Token, Stateless Authentication |
| **multer** | 1.4.5-lts.1 | File Upload | รองรับ multipart/form-data, จัดการไฟล์อัปโหลด |
| **dotenv** | 16.6.1 | Environment Variables | จัดการ Config แยกตาม Environment |
| **cors** | 2.8.5 | CORS Middleware | รองรับ Cross-Origin Requests |
| **SendGrid** | 8.1.6 | Email Service | ส่งอีเมลรีเซ็ตรหัสผ่าน (SMTP Cloud Service) |
| **OpenAI SDK** | 4.28.0 | AI Integration | เชื่อมต่อ OpenRouter API |

### 3.2 Python OCR System

| เทคโนโลยี | เวอร์ชัน | หน้าที่ | เหตุผลที่เลือกใช้ |
|-----------|---------|---------|------------------|
| **Python** | 3.x | Programming Language | เหมาะสำหรับ Machine Learning และ Image Processing |
| **EasyOCR** | ≥1.7.0 | OCR Engine | แม่นยำสูง, รองรับภาษาไทย, ใช้ Deep Learning |
| **pytesseract** | ≥0.3.10 | OCR Engine (Backup) | รวดเร็ว, เป็นที่นิยม, Backup เมื่อ EasyOCR ล้มเหลว |
| **OpenCV** | ≥4.8.0 | Image Processing | ประมวลผลภาพ (ปรับคมชัด, ลดสัญญาณรบกวน, ตัดพื้นหลัง) |
| **Pillow** | ≥10.0.0 | Image Library | จัดการภาพ, Resize, Convert format |
| **NumPy** | ≥1.24.0 | Numerical Computing | คำนวณเมทริกซ์สำหรับประมวลผลภาพ |
| **PyTorch** | CPU-only | Deep Learning Framework | Backend สำหรับ EasyOCR (ใช้ CPU เพื่อประหยัดต้นทุน) |

### 3.3 Frontend Stack

| เทคโนโลยี | หน้าที่ | เหตุผลที่เลือกใช้ |
|-----------|---------|------------------|
| **HTML5** | Markup Language | โครงสร้างหน้าเว็บ, Semantic Tags |
| **CSS3** | Styling | Responsive Design, Flexbox, Grid Layout |
| **Vanilla JavaScript** | Client-side Logic | ไม่ซับซ้อน, ไม่ต้องพึ่ง Framework, Load เร็ว |
| **Fetch API** | HTTP Client | เรียก REST API จาก Backend |

### 3.4 DevOps & Deployment

| เทคโนโลยี | หน้าที่ | เหตุผลที่เลือกใช้ |
|-----------|---------|------------------|
| **Railway.app** | Cloud Platform | รองรับ Node.js + Python, Auto Deploy, มี Volume สำหรับ SQLite |
| **Docker** | Containerization | แพ็กเกจ Application พร้อม Dependencies, Portable |
| **Nixpacks** | Build System | Railway ใช้ Nixpacks สำหรับ Build (ทดแทน Buildpacks) |
| **Git** | Version Control | ติดตามการเปลี่ยนแปลง, Collaboration |

---

## 4. สถาปัตยกรรมระบบ

### 4.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  (Web Browser - HTML/CSS/JavaScript)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS Requests
                        │ (REST API)
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                      NODE.JS SERVER                         │
│                     (Express.js)                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Routes     │  │  Middleware  │  │  Controllers │     │
│  │              │  │              │  │              │     │
│  │ /api/auth    │  │ - cors       │  │ - authCtrl   │     │
│  │ /api/pets    │  │ - multer     │  │ - petCtrl    │     │
│  │ /api/blogs   │  │ - jwt auth   │  │ - blogCtrl   │     │
│  │ /api/ocr     │  │              │  │ - ocrCtrl    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└───────────┬────────────────────────────┬────────────────────┘
            │                            │
            ↓                            ↓
┌───────────────────────┐    ┌───────────────────────────────┐
│   SQLITE DATABASE     │    │     PYTHON OCR SYSTEM         │
│                       │    │                               │
│  ┌─────────────────┐  │    │  ┌────────────────────────┐  │
│  │ admins          │  │    │  │ scan.py                │  │
│  │ members         │  │    │  │ ocr_engines.py         │  │
│  │ pets            │  │    │  │ preprocessing.py       │  │
│  │ vaccinations    │  │    │  │ data_extraction.py     │  │
│  │ blogs           │  │    │  └────────────────────────┘  │
│  │ password_resets │  │    │                               │
│  └─────────────────┘  │    │  Uses:                        │
│                       │    │  - EasyOCR                    │
│  File: petizo.db      │    │  - Tesseract                  │
│  Location: /data      │    │  - OpenCV                     │
└───────────────────────┘    │  - OpenRouter API             │
                             └───────────────────────────────┘
```

### 4.2 Request Flow

#### 4.2.1 การเข้าสู่ระบบ (Login)
```
1. User ป้อน email + password
   ↓
2. Frontend ส่ง POST /api/auth/login
   ↓
3. Backend ตรวจสอบ user ในฐานข้อมูล
   ↓
4. ใช้ bcrypt.compare() ตรวจสอบรหัสผ่าน
   ↓
5. ถ้าถูกต้อง → สร้าง JWT Token
   ↓
6. ส่ง Token กลับไปที่ Frontend
   ↓
7. Frontend เก็บ Token ใน localStorage
   ↓
8. ใช้ Token ในทุก Request (Authorization: Bearer <token>)
```

#### 4.2.2 การสแกนใบวัคซีนด้วย OCR
```
1. User อัปโหลดรูปใบวัคซีน
   ↓
2. Frontend ส่ง POST /api/ocr/scan (multipart/form-data)
   ↓
3. Backend บันทึกไฟล์ชั่วคราว (multer)
   ↓
4. เรียก Python script: python3 ocr_system/scan.py <file_path>
   ↓
5. Python ประมวลผลภาพ (OpenCV)
   ↓
6. ดึงข้อความ (EasyOCR + Tesseract)
   ↓
7. วิเคราะห์ข้อความ (OpenRouter API + GPT-4o-mini)
   ↓
8. ส่งผลลัพธ์เป็น JSON
   ↓
9. Backend อ่าน JSON และส่งกลับไปที่ Frontend
   ↓
10. Frontend แสดงผลให้ผู้ใช้ยืนยันข้อมูล
```

---

## 5. โครงสร้างฐานข้อมูล

### 5.1 Database Schema (SQLite3)

#### 5.1.1 ตาราง `admins` (ผู้ดูแลระบบ)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัสแอดมิน |
| `username` | TEXT | UNIQUE NOT NULL | ชื่อผู้ใช้ |
| `email` | TEXT | UNIQUE NOT NULL | อีเมล |
| `password` | TEXT | NOT NULL | รหัสผ่าน (bcrypt hash) |
| `full_name` | TEXT | | ชื่อ-นามสกุล |
| `phone` | TEXT | | เบอร์โทร |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่แก้ไข |

#### 5.1.2 ตาราง `members` (สมาชิกทั่วไป)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัสสมาชิก |
| `username` | TEXT | UNIQUE NOT NULL | ชื่อผู้ใช้ |
| `email` | TEXT | UNIQUE NOT NULL | อีเมล |
| `password` | TEXT | NOT NULL | รหัสผ่าน (bcrypt hash) |
| `full_name` | TEXT | | ชื่อ-นามสกุล |
| `phone` | TEXT | | เบอร์โทร |
| `is_hidden` | INTEGER | DEFAULT 0 | ซ่อนบัญชี (0=แสดง, 1=ซ่อน) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่แก้ไข |

#### 5.1.3 ตาราง `pets` (สัตว์เลี้ยง)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัสสัตว์เลี้ยง |
| `member_id` | INTEGER | FOREIGN KEY → members(id) | รหัสเจ้าของ |
| `name` | TEXT | NOT NULL | ชื่อสัตว์เลี้ยง |
| `breed` | TEXT | | สายพันธุ์ |
| `gender` | TEXT | CHECK(gender IN ('male', 'female')) | เพศ |
| `birth_date` | DATE | | วันเกิด |
| `color` | TEXT | | สี |
| `weight` | REAL | | น้ำหนัก (kg) |
| `microchip_id` | TEXT | | หมายเลขไมโครชิป |
| `photo_url` | TEXT | | URL รูปภาพ |
| `notes` | TEXT | | บันทึกเพิ่มเติม |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่แก้ไข |

#### 5.1.4 ตาราง `vaccine_schedules` (ตารางวัคซีนแนะนำ)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัสตาราง |
| `vaccine_name` | TEXT | NOT NULL | ชื่อวัคซีน |
| `age_weeks_min` | INTEGER | NOT NULL | อายุขั้นต่ำ (สัปดาห์) |
| `age_weeks_max` | INTEGER | | อายุสูงสุด (สัปดาห์) |
| `is_booster` | INTEGER | DEFAULT 0 | บูสเตอร์ (0=ไม่, 1=ใช่) |
| `frequency_years` | INTEGER | | ความถี่ (ปี) |
| `description` | TEXT | | คำอธิบาย |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |

#### 5.1.5 ตาราง `vaccinations` (ประวัติการฉีดวัคซีน)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัสบันทึก |
| `pet_id` | INTEGER | FOREIGN KEY → pets(id) | รหัสสัตว์เลี้ยง |
| `vaccine_name` | TEXT | NOT NULL | ชื่อวัคซีน |
| `vaccine_type` | TEXT | | ประเภทวัคซีน |
| `vaccination_date` | DATE | NOT NULL | วันที่ฉีด |
| `next_due_date` | DATE | | วันครบกำหนดครั้งถัดไป |
| `veterinarian` | TEXT | | ชื่อสัตวแพทย์ |
| `clinic_name` | TEXT | | ชื่อคลินิก |
| `batch_number` | TEXT | | เลขล็อตวัคซีน |
| `notes` | TEXT | | บันทึกเพิ่มเติม |
| `schedule_id` | INTEGER | FOREIGN KEY → vaccine_schedules(id) | รหัสตารางวัคซีน |
| `proof_image` | TEXT | | URL รูปใบรับรอง |
| `status` | TEXT | DEFAULT 'completed' | สถานะ |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่แก้ไข |

#### 5.1.6 ตาราง `blogs` (บทความ)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัสบทความ |
| `admin_id` | INTEGER | FOREIGN KEY → admins(id) | รหัสผู้เขียน |
| `title` | TEXT | NOT NULL | ชื่อบทความ |
| `slug` | TEXT | UNIQUE NOT NULL | URL Slug |
| `content` | TEXT | NOT NULL | เนื้อหา |
| `excerpt` | TEXT | | เนื้อหาย่อ |
| `featured_image` | TEXT | | URL รูปหน้าปก |
| `category` | TEXT | | หมวดหมู่ |
| `tags` | TEXT | | แท็ก (คั่นด้วย comma) |
| `source_name` | TEXT | | ชื่อแหล่งอ้างอิง |
| `source_url` | TEXT | | URL แหล่งอ้างอิง |
| `status` | TEXT | DEFAULT 'draft' CHECK(status IN ('draft', 'published')) | สถานะ |
| `views` | INTEGER | DEFAULT 0 | ยอดวิว |
| `pinned` | INTEGER | DEFAULT 0 | ปักหมุด (0=ไม่, 1=ปัก) |
| `published_at` | DATETIME | | วันที่เผยแพร่ |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่แก้ไข |

#### 5.1.7 ตาราง `password_resets` (Token รีเซ็ตรหัสผ่าน)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัส |
| `email` | TEXT | NOT NULL | อีเมลผู้ใช้ |
| `token` | TEXT | UNIQUE NOT NULL | Token (random hash) |
| `user_type` | TEXT | CHECK(user_type IN ('admin', 'member')) | ประเภทผู้ใช้ |
| `expires_at` | DATETIME | NOT NULL | วันหมดอายุ |
| `used` | INTEGER | DEFAULT 0 | ใช้แล้ว (0=ไม่, 1=ใช้แล้ว) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |

#### 5.1.8 ตาราง `breeds` (สายพันธุ์)

| คอลัมน์ | ชนิดข้อมูล | ข้อจำกัด | คำอธิบาย |
|---------|-----------|---------|----------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | รหัสสายพันธุ์ |
| `name` | TEXT | NOT NULL | ชื่อสายพันธุ์ |
| `description` | TEXT | | คำอธิบาย |
| `image_url` | TEXT | | URL รูปภาพ |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | วันที่สร้าง |

### 5.2 Entity Relationship Diagram (ERD)

```
┌─────────────┐
│   admins    │
└──────┬──────┘
       │ 1
       │
       │ N
       ↓
┌─────────────┐           ┌────────────────────┐
│    blogs    │           │ password_resets    │
└─────────────┘           └────────────────────┘

┌─────────────┐
│   members   │
└──────┬──────┘
       │ 1
       │
       │ N
       ↓
┌─────────────┐
│    pets     │
└──────┬──────┘
       │ 1
       │
       │ N
       ↓
┌──────────────────┐
│   vaccinations   │
└────────┬─────────┘
         │ N
         │
         │ 1
         ↓
┌──────────────────────┐
│  vaccine_schedules   │
└──────────────────────┘

┌─────────────┐
│   breeds    │
└─────────────┘
```

### 5.3 Indexes (สำหรับเพิ่มประสิทธิภาพ)

```sql
-- Pet indexes
CREATE INDEX idx_pets_member_id ON pets(member_id);

-- Vaccination indexes
CREATE INDEX idx_vaccinations_pet_id ON vaccinations(pet_id);
CREATE INDEX idx_vaccinations_schedule_id ON vaccinations(schedule_id);

-- Vaccine schedule indexes
CREATE INDEX idx_vaccine_schedules_age ON vaccine_schedules(age_weeks_min, age_weeks_max);

-- Blog indexes
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_admin_id ON blog_posts(admin_id);

-- User indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_members_email ON members(email);

-- Password reset indexes
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_email ON password_resets(email);
```

---

## 6. โครงสร้างไฟล์โปรเจค

```
petizo/
├── data/                           # ฐานข้อมูล + ไฟล์อัปโหลด (Railway Volume)
│   ├── petizo.db                  # SQLite Database
│   ├── uploads/                   # รูปสัตว์เลี้ยง + ใบวัคซีน
│   ├── python_packages/           # Python packages (ติดตั้งใน Volume)
│   └── easyocr_models/            # โมเดล EasyOCR
│
├── public/                         # Frontend (HTML, CSS, JS)
│   ├── index.html                 # หน้าแรก
│   ├── admin.html                 # หน้าแอดมิน
│   ├── login.html                 # หน้าเข้าสู่ระบบ
│   ├── register.html              # หน้าลงทะเบียน
│   ├── user-profile.html          # โปรไฟล์ผู้ใช้
│   ├── your-pet.html              # จัดการสัตว์เลี้ยง
│   ├── pet-details.html           # รายละเอียดสัตว์เลี้ยง
│   ├── vaccination-record.html    # บันทึกวัคซีน
│   ├── vaccine-schedule.html      # ตารางวัคซีน
│   ├── blog.html                  # รายการบทความ
│   ├── blog-detail.html           # รายละเอียดบทความ
│   ├── forgot-password.html       # ลืมรหัสผ่าน
│   ├── reset-password.html        # รีเซ็ตรหัสผ่าน
│   ├── terms.html                 # ข้อกำหนดการใช้งาน
│   │
│   ├── css/                       # Stylesheets
│   │   ├── style.css
│   │   ├── admin.css
│   │   └── blog.css
│   │
│   ├── js/                        # JavaScript
│   │   ├── config.js              # API URL configuration
│   │   ├── auth-common.js         # Authentication utilities
│   │   ├── ocr-handler.js         # OCR functionality
│   │   └── profile-dropdown.js    # UI components
│   │
│   ├── images/                    # รูปภาพ
│   └── icon/                      # ไอคอน
│
├── ocr_system/                     # Python OCR System
│   ├── scan.py                    # สคริปต์หลัก (Entry point)
│   ├── ocr_engines.py             # EasyOCR + Tesseract
│   ├── preprocessing.py           # ประมวลผลภาพ (OpenCV)
│   ├── data_extraction.py         # ดึงข้อมูลจากข้อความ (AI)
│   └── requirements.txt           # Python dependencies
│
├── services/                       # Node.js Services
│   └── emailService.js            # ส่งอีเมล (SendGrid)
│
├── scripts/                        # Utility Scripts
│   ├── setup/
│   │   └── init-database.js       # สร้างตารางฐานข้อมูล
│   │
│   ├── migrations/
│   │   ├── add-pinned-to-blogs.js
│   │   ├── add-password-resets-table.js
│   │   ├── add-slug-column.js
│   │   ├── add-vaccine-fields.js
│   │   ├── add-blog-source-columns.js
│   │   └── migrate-users.js
│   │
│   └── utils/
│       ├── compare-databases.js
│       ├── download-db.js
│       └── download-railway-db.js
│
├── server.js                       # Backend API (Express Server)
├── package.json                    # Node.js dependencies
├── package-lock.json
├── start.sh                        # Startup script (Railway)
├── nixpacks.toml                   # Nixpacks configuration (Railway)
├── railway.json                    # Railway deployment config
├── Dockerfile.backup               # Docker configuration (ถ้าใช้ Docker)
├── .dockerignore                   # Docker ignore files
├── .env.example                    # ตัวอย่าง Environment variables
└── .gitignore                      # Git ignore files
```

---

## 7. การติดตั้งและใช้งาน

### 7.1 ข้อกำหนดของระบบ (System Requirements)

**ซอฟต์แวร์ที่ต้องติดตั้ง:**
- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Python 3.x
- Tesseract OCR (สำหรับ OCR)
- Git

**ระบบปฏิบัติการ:**
- Windows 10/11
- macOS 12+
- Linux (Ubuntu 20.04+)

### 7.2 การติดตั้งในเครื่อง Local

#### ขั้นตอนที่ 1: Clone โปรเจค

```bash
git clone https://github.com/your-username/petizo.git
cd petizo/petizo
```

#### ขั้นตอนที่ 2: ติดตั้ง Node.js Dependencies

```bash
npm install
```

#### ขั้นตอนที่ 3: ติดตั้ง Python Dependencies

```bash
cd ocr_system
pip3 install -r requirements.txt
cd ..
```

#### ขั้นตอนที่ 4: ติดตั้ง Tesseract OCR

**Windows:**
```bash
# ดาวน์โหลด Installer จาก
# https://github.com/UB-Mannheim/tesseract/wiki
# ติดตั้งและเพิ่มเข้า PATH
```

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-eng
```

#### ขั้นตอนที่ 5: สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:
```env
JWT_SECRET=your-super-secret-key-change-this
PORT=3000
NODE_ENV=development

OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
MODEL_NAME=openai/gpt-4o-mini

SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
FRONTEND_URL=http://localhost:3000
```

#### ขั้นตอนที่ 6: สร้างฐานข้อมูล

```bash
node scripts/setup/init-database.js
```

**ผลลัพธ์:**
- สร้างไฟล์ `data/petizo.db`
- สร้างตารางทั้งหมด
- สร้างข้อมูลตัวอย่าง:
  - Admin: `admin@petizo.com` / `admin123`
  - Member: `user@petizo.com` / `user123`

#### ขั้นตอนที่ 7: รันเซิร์ฟเวอร์

**Development Mode:**
```bash
npm run dev
# หรือ
nodemon server.js
```

**Production Mode:**
```bash
npm start
# หรือ
node server.js
```

#### ขั้นตอนที่ 8: เปิดเว็บบราว์เซอร์

เข้าที่: `http://localhost:3000`

**ทดสอบเข้าสู่ระบบ:**
- Admin: `admin@petizo.com` / `admin123`
- Member: `user@petizo.com` / `user123`

---

## 8. การ Deploy ขึ้นเว็บ

### 8.1 Deploy ด้วย Railway.app (แนะนำ) ⭐

**ข้อดี:**
- รองรับ Node.js + Python ในคอนเทนเนอร์เดียว
- มี Railway Volume สำหรับเก็บฐานข้อมูล SQLite
- Deploy อัตโนมัติผ่าน GitHub
- ฟรี $5/เดือน (Hobby Plan)

#### ขั้นตอนที่ 1: สมัครบัญชี Railway

1. ไปที่ [railway.app](https://railway.app)
2. สมัครด้วย GitHub Account
3. ยืนยันอีเมล

#### ขั้นตอนที่ 2: สร้าง Project ใหม่

1. คลิก **New Project**
2. เลือก **Deploy from GitHub repo**
3. เชื่อม GitHub Repository ของคุณ
4. เลือก Repository `petizo`

#### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

ไปที่ **Variables** และเพิ่ม:

```
JWT_SECRET=your-production-secret-key-very-long-and-random
PORT=3000
NODE_ENV=production

OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
MODEL_NAME=openai/gpt-4o-mini

SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
FRONTEND_URL=https://your-app.railway.app
```

#### ขั้นตอนที่ 4: เพิ่ม Railway Volume

1. ไปที่ **Data** → **+ New Volume**
2. ตั้งค่า:
   - **Mount Path:** `/app/petizo/data`
   - **Volume Size:** 1GB (ฟรี)
3. คลิก **Add Volume**

#### ขั้นตอนที่ 5: Deploy

1. Railway จะ Build และ Deploy อัตโนมัติ
2. รอประมาณ 3-5 นาที (ครั้งแรกจะนานเพราะต้องติดตั้ง Python packages)
3. เมื่อเสร็จจะได้ URL เช่น `https://petizo-production.up.railway.app`

#### ขั้นตอนที่ 6: ตรวจสอบ Logs

ไปที่ **Deployments** → **View Logs** เพื่อดูสถานะ

**ตัวอย่าง Log ที่ถูกต้อง:**
```
Starting Petizo server with OCR support...
Python packages already installed (using Volume cache)
Checking database tables...
Database exists, running migrations...
Starting Node.js server...
เชื่อมต่อ database สำเร็จ
Server running on port 3000
```

#### ขั้นตอนที่ 7: ตั้งค่า Custom Domain (ถ้าต้องการ)

1. ไปที่ **Settings** → **Domains**
2. คลิก **Generate Domain** หรือ **Add Custom Domain**
3. ตั้งค่า DNS ตามคำแนะนำ

---

### 8.2 Deploy ด้วย Docker (ทางเลือก) 🐳

**ข้อดี:**
- Deploy ได้ทุกแพลตฟอร์ม (AWS, GCP, Azure, DigitalOcean)
- Consistent environment
- ง่ายต่อการ Scale

#### ขั้นตอนที่ 1: สร้าง Dockerfile

โปรเจคมี `Dockerfile.backup` อยู่แล้ว ให้เปลี่ยนชื่อ:

```bash
mv Dockerfile.backup Dockerfile
```

**เนื้อหา Dockerfile:**
```dockerfile
# Petizo Dockerfile - Node.js + Python + OCR
FROM node:20-slim

# ติดตั้ง Python, Tesseract, OpenCV dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-dev \
    tesseract-ocr tesseract-ocr-eng \
    libgl1 libglib2.0-0 libsm6 libxext6 \
    libxrender-dev libgomp1 \
    gcc g++ make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ติดตั้ง Node.js dependencies
COPY petizo/package*.json ./petizo/
WORKDIR /app/petizo
RUN npm install --production

# ติดตั้ง Python dependencies
COPY petizo/ocr_system/requirements.txt ./ocr_system/
RUN pip3 install --no-cache-dir --break-system-packages -r ocr_system/requirements.txt

# Copy application code
WORKDIR /app
COPY . .

WORKDIR /app/petizo
RUN mkdir -p data/uploads && chmod +x start.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["./start.sh"]
```

#### ขั้นตอนที่ 2: Build Docker Image

```bash
docker build -t petizo:latest .
```

#### ขั้นตอนที่ 3: รัน Container

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/petizo/data \
  -e JWT_SECRET=your-secret-key \
  -e OPENROUTER_API_KEY=sk-or-v1-xxx \
  -e SENDGRID_API_KEY=SG.xxx \
  --name petizo-app \
  petizo:latest
```

#### ขั้นตอนที่ 4: ตรวจสอบสถานะ

```bash
# ดู Logs
docker logs -f petizo-app

# ตรวจสอบ Container
docker ps
```

#### ขั้นตอนที่ 5: เปิดใช้งาน

เข้าที่: `http://localhost:3000`

---

### 8.3 Deploy ด้วย Docker Compose (สำหรับการใช้งานจริง)

สร้างไฟล์ `docker-compose.yml`:

```yaml
version: '3.8'

services:
  petizo:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/petizo/data
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - EMAIL_FROM_ADDRESS=${EMAIL_FROM_ADDRESS}
      - FRONTEND_URL=${FRONTEND_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**รัน:**
```bash
docker-compose up -d
```

---

### 8.4 เปรียบเทียบ Deployment Options

| ฟีเจอร์ | Railway | Docker (Self-hosted) | Heroku | Vercel |
|---------|---------|----------------------|--------|--------|
| **รองรับ Node.js + Python** | ✅ | ✅ | ✅ | ❌ (Node.js only) |
| **SQLite Support** | ✅ (Volume) | ✅ | ❌ | ❌ |
| **Auto Deploy จาก GitHub** | ✅ | ❌ | ✅ | ✅ |
| **ราคา (Free Tier)** | $5/เดือน | ฟรี (ต้องมีเซิร์ฟเวอร์) | $7/เดือน | ฟรี (Serverless) |
| **ความยาก** | ง่าย | ปานกลาง | ง่าย | ง่าย |
| **เหมาะสำหรับ** | โปรเจค Fullstack | Production | Prototype | Frontend/API |

**คำแนะนำ:**
- **Railway** - เหมาะสำหรับโปรเจคนี้มากที่สุด (Node.js + Python + SQLite)
- **Docker** - ใช้ถ้าต้องการควบคุมเซิร์ฟเวอร์เองหรือ Deploy บน AWS/GCP
- **Heroku** - ไม่แนะนำ (ไม่รองรับ SQLite, ต้องใช้ PostgreSQL)
- **Vercel** - ไม่รองรับ Python

---

## 9. ข้อดีและข้อจำกัด

### 9.1 ข้อดีของระบบ

#### 9.1.1 ด้านเทคนิค

| ข้อดี | คำอธิบาย |
|-------|----------|
| **🤖 OCR อัจฉริยะ** | ใช้ EasyOCR + Tesseract + AI ดึงข้อมูลจากใบวัคซีนอัตโนมัติ ลดเวลาการบันทึกข้อมูล |
| **🔒 ความปลอดภัยสูง** | bcrypt (password hashing) + JWT Token + Email verification |
| **🚀 Performance ดี** | SQLite + Index optimization + Lightweight frontend |
| **📱 Responsive Design** | ใช้งานได้ทั้ง Desktop และ Mobile |
| **🌐 รองรับภาษาไทย** | OCR อ่านภาษาไทยได้, URL Slug รองรับภาษาไทย |
| **♻️ Maintainable** | โครงสร้างโค้ดชัดเจน, แยก Layer (Frontend/Backend/OCR) |

#### 9.1.2 ด้านผู้ใช้งาน

- **ใช้งานง่าย** - UI ออกแบบเป็นมิตร, ไม่ซับซ้อน
- **ประหยัดเวลา** - OCR ดึงข้อมูลอัตโนมัติ ไม่ต้องพิมพ์เอง
- **ติดตามวัคซีนได้** - แจ้งเตือนวัคซีนครบกำหนด
- **แหล่งความรู้** - บทความเกี่ยวกับการดูแลสัตว์เลี้ยง
- **AI Chatbot** - ตอบคำถามได้ทันที

---

### 9.2 ข้อจำกัดและแนวทางแก้ไข

| ข้อจำกัด | ผลกระทบ | แนวทางแก้ไข |
|----------|---------|------------|
| **SQLite ไม่เหมาะกับ Traffic สูง** | ถ้ามีผู้ใช้เยอะ (>10,000 concurrent users) จะช้า | Migrate ไปใช้ PostgreSQL หรือ MySQL |
| **OCR ช้า** | EasyOCR ใช้เวลา 5-10 วินาที | - ใช้ GPU (แทน CPU)<br>- แคช OCR results<br>- ใช้ Queue system (Bull/Redis) |
| **ไม่มี Real-time Notification** | ไม่แจ้งเตือนแบบ Push | เพิ่ม Push Notification (Firebase, OneSignal) |
| **ไม่มี Mobile App** | ต้องใช้ผ่านเว็บบราว์เซอร์ | พัฒนา React Native / Flutter App |
| **การสำรองข้อมูล** | ถ้า Volume เสีย ข้อมูลหาย | - ตั้งค่า Auto Backup (cron job)<br>- ใช้ Cloud Storage (S3, Google Cloud Storage) |

---

### 9.3 ฟีเจอร์ที่ควรพัฒนาเพิ่มเติม (Future Work)

#### 9.3.1 Short-term (1-3 เดือน)

1. **ระบบแจ้งเตือนวัคซีน**
   - ส่งอีเมลเตือนก่อนครบกำหนด 7 วัน
   - Push Notification (ถ้าเป็น PWA)

2. **ระบบค้นหาคลินิกสัตว์**
   - แสดงคลินิกใกล้เคียงบนแผนที่ (Google Maps API)
   - รีวิวคลินิก

3. **Export ข้อมูล**
   - Export ประวัติวัคซีนเป็น PDF
   - Export ข้อมูลสัตว์เลี้ยงเป็น CSV

#### 9.3.2 Long-term (6-12 เดือน)

1. **Mobile App (React Native)**
   - รองรับ iOS และ Android
   - Camera integration สำหรับ OCR

2. **ระบบนัดหมาย**
   - จองคิวฉีดวัคซีนกับคลินิก
   - ปฏิทินนัดหมาย

3. **ระบบ Analytics**
   - Dashboard สำหรับแอดมิน
   - สถิติการฉีดวัคซีน

4. **Multi-language Support**
   - รองรับภาษาอังกฤษ
   - i18n implementation

---

## 10. คำถามที่พบบ่อย (FAQ)

### Q1: ทำไมเลือกใช้ SQLite แทน MySQL/PostgreSQL?

**ตอบ:**
- **Serverless** - ไม่ต้องติดตั้งเซิร์ฟเวอร์ Database แยก
- **ง่ายต่อการ Deploy** - เก็บเป็นไฟล์ `.db` เดียว
- **เหมาะกับโปรเจคขนาดกลาง** - รองรับ < 100,000 records ได้ดี
- **ประหยัดต้นทุน** - ไม่ต้องเช่าเซิร์ฟเวอร์ Database แยก
- **รัน Railway.app ได้** - ใช้ Volume เก็บฐานข้อมูล

**ข้อจำกัด:**
- ถ้ามีผู้ใช้เยอะมาก (>10,000 concurrent) ควร Migrate ไป PostgreSQL

---

### Q2: ทำไมใช้ EasyOCR + Tesseract ทั้งคู่?

**ตอบ:**
- **EasyOCR:**
  - แม่นยำสูง (ใช้ Deep Learning)
  - รองรับภาษาไทยดีกว่า
  - **ข้อเสีย:** ช้ากว่า (5-10 วินาที)

- **Tesseract:**
  - รวดเร็ว (1-2 วินาที)
  - Lightweight
  - **ข้อเสีย:** แม่นยำต่ำกว่า, ภาษาไทยไม่ดีเท่า

**กลยุทธ์:**
- ใช้ EasyOCR เป็นหลัก (ความแม่นยำสูง)
- ใช้ Tesseract เป็น Fallback (ถ้า EasyOCR ล้มเหลว)
- ผลลัพธ์ดีที่สุด = ทั้งสองรวมกัน

---

### Q3: ทำไมใช้ OpenRouter แทนเรียก OpenAI API โดยตรง?

**ตอบ:**
- **รองรับหลายโมเดล** - GPT-4, Claude, Gemini ใน API เดียว
- **ราคาถูกกว่า** - OpenRouter มีส่วนลด
- **เปลี่ยนโมเดลง่าย** - แก้แค่ `MODEL_NAME` ใน `.env`
- **Fallback ได้** - ถ้าโมเดลหนึ่งล่ม ใช้โมเดลอื่นได้ทันที

**ตัวอย่าง:**
```env
# ปัจจุบันใช้ GPT-4o-mini
MODEL_NAME=openai/gpt-4o-mini

# เปลี่ยนเป็น Claude ได้ทันที
MODEL_NAME=anthropic/claude-3-sonnet
```

---

### Q4: ขึ้นเว็บยังไง? ต้องเสียเงินไหม?

**ตอบ:**

**ตัวเลือกที่ 1: Railway.app (แนะนำ)**
- **ราคา:** $5/เดือน (Hobby Plan)
- **ข้อดี:**
  - Deploy ง่ายที่สุด
  - รองรับ Node.js + Python
  - มี Volume สำหรับ SQLite
  - Auto Deploy จาก GitHub

**ตัวเลือกที่ 2: Docker (Self-hosted)**
- **ราคา:** ฟรี (ถ้ามีเซิร์ฟเวอร์อยู่แล้ว)
- **ข้อดี:**
  - ควบคุมเต็มที่
  - Deploy ได้ทุกแพลตฟอร์ม
- **ข้อเสีย:**
  - ต้องจัดการเซิร์ฟเวอร์เอง
  - ต้องรู้เรื่อง DevOps

**ตัวเลือกที่ 3: AWS/GCP (สำหรับ Production)**
- **ราคา:** $10-50/เดือน (ขึ้นอยู่กับ Traffic)
- **ข้อดี:**
  - Scalable
  - Reliable
- **ข้อเสีย:**
  - ซับซ้อน
  - ราคาแพง

**คำแนะนำสำหรับนักศึกษา:**
- ใช้ **Railway.app** ($5/เดือน) - ง่ายที่สุด
- หรือใช้ **Docker + DigitalOcean Droplet** ($4-6/เดือน) - ประหยัดกว่า

---

### Q5: ข้อมูลหายไหมถ้า Deploy ใหม่?

**ตอบ:**

**ถ้าใช้ Railway:**
- ❌ **ไม่หาย** - เพราะเก็บใน **Railway Volume** (persistent storage)
- Volume แยกจาก Container (ไม่ถูกลบตอน Redeploy)

**ถ้าใช้ Docker:**
- ✅ **อาจหาย** - ถ้าไม่ใช้ Volume
- ✅ **ไม่หาย** - ถ้าใช้ `-v` flag mount volume

**วิธีป้องกัน:**
```bash
# ผิด (ข้อมูลหาย)
docker run petizo:latest

# ถูก (ข้อมูลไม่หาย)
docker run -v $(pwd)/data:/app/petizo/data petizo:latest
```

**Best Practice:**
- ตั้งค่า **Auto Backup** ทุกวัน
- เก็บ Backup ใน Cloud Storage (S3, Google Cloud Storage)

---

### Q6: OCR อ่านใบวัคซีนไม่ได้ ทำไง?

**สาเหตุที่เป็นไปได้:**
1. **รูปภาพเบลอ** - ถ่ายใหม่ ให้ชัดกว่าเดิม
2. **แสงน้อยเกินไป** - ถ่ายในที่แสงสว่าง
3. **มุมเอียง** - ถ่ายให้ตรง ไม่เอียง
4. **คุณภาพรูปต่ำ** - ใช้กล้องความละเอียดสูงกว่า 5MP

**วิธีแก้:**
- ถ่ายรูปใหม่ให้ชัดเจน
- ใช้โหมด "สแกนเอกสาร" ในแอปกล้อง (เช่น Google Drive)
- ตรวจสอบว่าตัวอักษรชัดเจน

**ถ้ายังไม่ได้:**
- กรอกข้อมูลด้วยตนเอง (มีฟอร์มสำรอง)

---

### Q7: Dockerfile ใช้ได้ไหม?

**ตอบ:** ✅ **ใช้ได้** - โปรเจคมี `Dockerfile.backup` อยู่แล้ว

**วิธีใช้:**

```bash
# 1. เปลี่ยนชื่อไฟล์
mv Dockerfile.backup Dockerfile

# 2. Build Image
docker build -t petizo:latest .

# 3. Run Container
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/petizo/data \
  -e JWT_SECRET=your-secret-key \
  -e OPENROUTER_API_KEY=sk-or-v1-xxx \
  -e SENDGRID_API_KEY=SG.xxx \
  -e EMAIL_FROM_ADDRESS=noreply@example.com \
  -e FRONTEND_URL=http://localhost:3000 \
  --name petizo-app \
  petizo:latest

# 4. ตรวจสอบ
docker logs -f petizo-app
```

**หรือใช้ Docker Compose (แนะนำ):**

```bash
# สร้างไฟล์ .env
cat > .env << EOF
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=sk-or-v1-xxx
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM_ADDRESS=noreply@example.com
FRONTEND_URL=http://localhost:3000
EOF

# รัน
docker-compose up -d
```

---

### Q8: ต้องเตรียมอะไรก่อนพรีเซนต์?

**เอกสาร:**
- [x] เอกสารโปรเจค (ไฟล์นี้)
- [x] Slide PowerPoint (ถ้ามี)
- [x] ER Diagram
- [x] Architecture Diagram

**Demo:**
- [x] Deploy บน Railway (ใช้งานจริง)
- [x] เตรียม Test Account:
  - Admin: `admin@petizo.com` / `admin123`
  - Member: `user@petizo.com` / `user123`
- [x] เตรียมรูปใบวัคซีนตัวอย่าง (สำหรับ Demo OCR)

**คำถามที่อาจถูกถาม:**
1. ทำไมเลือกใช้เทคโนโลยีนี้? → ดูที่ส่วน 3
2. ระบบทำงานอย่างไร? → ดูที่ส่วน 4
3. ข้อจำกัดคืออะไร? → ดูที่ส่วน 9.2
4. ขึ้นเว็บยังไง? → ดูที่ส่วน 8

---

### Q9: มี Demo ให้ดูไหม?

**ตอบ:**

ถ้า Deploy บน Railway แล้ว:
- **URL:** `https://your-app.railway.app`
- **Admin Login:** `admin@petizo.com` / `admin123`
- **Member Login:** `user@petizo.com` / `user123`

**ฟีเจอร์ที่ควร Demo:**
1. **Login/Register** - แสดงระบบ Authentication
2. **เพิ่มสัตว์เลี้ยง** - แสดงการอัปโหลดรูปภาพ
3. **OCR สแกนใบวัคซีน** - แสดงการดึงข้อมูลอัตโนมัติ (จุดเด่น)
4. **ปักหมุดบทความ** - แสดง Admin Features
5. **AI Chatbot** - ถามคำถามเกี่ยวกับสัตว์เลี้ยง

---

### Q10: ถ้าเพิ่มฟีเจอร์ใหม่ ต้องทำอย่างไร?

**ตอบ:**

**ตัวอย่าง: เพิ่มฟีเจอร์ "รีวิวคลินิก"**

1. **สร้างตารางใหม่:**
```sql
CREATE TABLE clinic_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  clinic_name TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id)
);
```

2. **สร้าง API Endpoint:**
```javascript
// POST /api/reviews
app.post('/api/reviews', authenticateToken, (req, res) => {
  const { clinic_name, rating, comment } = req.body;
  const member_id = req.user.id;

  db.run(
    'INSERT INTO clinic_reviews (member_id, clinic_name, rating, comment) VALUES (?, ?, ?, ?)',
    [member_id, clinic_name, rating, comment],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});
```

3. **สร้าง Frontend:**
```html
<!-- review-form.html -->
<form id="reviewForm">
  <input type="text" name="clinic_name" placeholder="ชื่อคลินิก" required>
  <select name="rating" required>
    <option value="5">⭐⭐⭐⭐⭐</option>
    <option value="4">⭐⭐⭐⭐</option>
    <option value="3">⭐⭐⭐</option>
    <option value="2">⭐⭐</option>
    <option value="1">⭐</option>
  </select>
  <textarea name="comment" placeholder="ความคิดเห็น"></textarea>
  <button type="submit">ส่งรีวิว</button>
</form>
```

4. **Test:**
```bash
# ทดสอบ API
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"clinic_name":"ABC Vet","rating":5,"comment":"ดีมาก"}'
```

5. **Deploy:**
```bash
git add .
git commit -m "feat: add clinic reviews"
git push origin main
# Railway จะ Deploy อัตโนมัติ
```

---

## สรุป

โปรเจค **Petizo** เป็นระบบจัดการสัตว์เลี้ยงและติดตามวัคซีนที่ครบครัน ใช้เทคโนโลยี:

**Backend:**
- Node.js + Express.js
- SQLite3
- bcrypt + JWT

**OCR System:**
- Python + EasyOCR + Tesseract + OpenCV
- OpenRouter API (GPT-4o-mini)

**Deployment:**
- Railway.app (แนะนำ)
- Docker (ทางเลือก)

**จุดเด่น:**
- ระบบ OCR สแกนใบวัคซีนอัตโนมัติ
- AI Chatbot ตอบคำถาม
- ปักหมุดบทความ
- ความปลอดภัยสูง

---

**เอกสารจัดทำโดย:** Claude Code
**วันที่:** 21 ธันวาคม 2568
**เวอร์ชัน:** 1.0
