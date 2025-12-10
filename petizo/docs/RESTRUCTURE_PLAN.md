# � แผนการจัดโครงสร้างโปรเจค Petizo

## � วัตถุประสงค์
จัดระเบียบโครงสร้างโปรเจคให้เป็นระบบ แยกหมวดหมู่ชัดเจน และง่ายต่อการบำรุงรักษา

---

## � ปัญหาปัจจุบัน

### 1. Frontend (public/)
 **HTML 13 ไฟล์อยู่ใน root ของ public/** - ยุ่งมาก ไม่เป็นหมวดหมู่
- admin.html, blog.html, blog-detail.html, index.html, login.html
- pet-details.html, register.html, terms.html, user-profile.html
- vaccination-record.html, vaccine-notifications.html, vaccine-schedule.html, your-pet.html

 **ไอคอน 61 ไฟล์อยู่ใน icon/ folder เดียว** - ไม่แยกประเภท

 **รูปภาพปะปนกัน** - hero, login, banner อยู่ใน images/ เดียวกัน

### 2. Backend (server.js)
 **server.js มี 1,880 บรรทัด** - ใหญ่เกินไป ควรแยก routes ออกมา
- มี 50+ API endpoints ในไฟล์เดียว
- ไม่มีการแยก routes, middleware, models

### 3. Database
 **petizo.db อยู่ที่ root** - ควรอยู่ใน data/database/

### 4. รูปภาพที่ไม่ใช้
 **Banner Petizo 1-6** - ไม่มีการใช้งานในโค้ด
 **login1-3.jpg** - เป็นไฟล์เก่า มี login_fix และ login_register แทน

---

## � โครงสร้างใหม่ที่เสนอ

```
petizo/
├── � server.js                      # Main entry point (slim version)
├── � package.json
├── � .env.example
├── � .gitignore
├── � start.sh
├── � nixpacks.toml
├── � railway.json
│
├── � src/                           # Backend source code (NEW)
│   ├── � config/
│   │   ├── database.js               # Database connection
│   │   └── multer.js                 # File upload config
│   │
│   ├── � middleware/
│   │   ├── auth.js                   # authenticateToken, isAdmin
│   │   └── validation.js             # Input validation
│   │
│   ├── � routes/
│   │   ├── auth.routes.js            # Authentication routes
│   │   ├── user.routes.js            # User profile routes
│   │   ├── pet.routes.js             # Pet management routes
│   │   ├── vaccination.routes.js     # Vaccination routes
│   │   ├── vaccine-schedule.routes.js
│   │   ├── notification.routes.js
│   │   ├── blog.routes.js            # Public blog routes
│   │   ├── ocr.routes.js             # OCR scanning routes
│   │   ├── chat.routes.js            # AI chat routes
│   │   └── admin/                    # Admin routes
│   │       ├── users.routes.js
│   │       ├── blog.routes.js
│   │       ├── dashboard.routes.js
│   │       └── upload.routes.js
│   │
│   ├── � models/                    # Database models (optional)
│   │   ├── User.js
│   │   ├── Pet.js
│   │   ├── Vaccination.js
│   │   └── Blog.js
│   │
│   └── � utils/
│       ├── slugify.js                # Slug generator
│       └── helpers.js
│
├── � data/
│   ├── � database/
│   │   ├── petizo.db                 # Main database (moved)
│   │   └── backups/                  # Database backups
│   │       └── petizo.db.backup
│   │
│   └── � uploads/
│       ├── profiles/                 # User profile pictures
│       ├── pets/                     # Pet photos
│       ├── vaccinations/             # Vaccination proofs
│       └── blogs/                    # Blog featured images
│
├── � public/                        # Frontend assets
│   ├── � index.html                 # Home page (keep at root)
│   ├── � terms.html                 # Terms page (keep at root)
│   │
│   ├── � pages/                     # HTML pages organized by feature
│   │   ├── � auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   │
│   │   ├── � pets/
│   │   │   ├── your-pet.html
│   │   │   └── pet-details.html
│   │   │
│   │   ├── � vaccinations/
│   │   │   ├── vaccination-record.html
│   │   │   ├── vaccine-schedule.html
│   │   │   └── vaccine-notifications.html
│   │   │
│   │   ├── � blog/
│   │   │   ├── blog.html
│   │   │   └── blog-detail.html
│   │   │
│   │   ├── � admin/
│   │   │   └── admin.html
│   │   │
│   │   └── � profile/
│   │       └── user-profile.html
│   │
│   ├── � components/                # Reusable components
│   │   ├── navbar.html
│   │   └── footer.html
│   │
│   ├── � css/
│   │   ├── navbar.css
│   │   └── chat-popup.css
│   │
│   ├── � js/
│   │   ├── config.js
│   │   ├── auth-common.js
│   │   ├── navbar.js
│   │   ├── profile-dropdown.js
│   │   ├── chat-popup.js
│   │   ├── ocr-handler.js
│   │   ├── vaccine-notification.js
│   │   └── footer.js
│   │
│   └── � assets/
│       ├── � icons/
│       │   ├── � ui/                # UI icons (41 files)
│       │   │   ├── alarm.png
│       │   │   ├── alert.png
│       │   │   ├── barcode.png
│       │   │   ├── bin.png
│       │   │   ├── birthday.png
│       │   │   ├── bot-assistant.png
│       │   │   ├── calendar (2).png
│       │   │   ├── cancel.png
│       │   │   ├── chart.png
│       │   │   ├── chat.png
│       │   │   ├── cute-camera.png
│       │   │   ├── document2.png
│       │   │   ├── edit.png
│       │   │   ├── gender.png
│       │   │   ├── gender (1).png
│       │   │   ├── left-arrow.png
│       │   │   ├── like.png
│       │   │   ├── logo.png
│       │   │   ├── logout.png
│       │   │   ├── love.png
│       │   │   ├── notes.png
│       │   │   ├── profile.png
│       │   │   ├── right-arrow.png
│       │   │   ├── scale.png
│       │   │   ├── search (1).png
│       │   │   ├── view.png
│       │   │   ├── warning.png
│       │   │   └── Scan documents.png
│       │   │
│       │   ├── � pets/              # Pet icons (3 files)
│       │   │   ├── dog.png
│       │   │   ├── stray-cat.png
│       │   │   └── animal-lover.png
│       │   │
│       │   ├── � medical/           # Medical icons (8 files)
│       │   │   ├── health-check.png
│       │   │   ├── medical-book.png
│       │   │   ├── mentor.png
│       │   │   ├── oath.png
│       │   │   ├── syringe.png
│       │   │   ├── vaccination.png
│       │   │   ├── veterinarian.png
│       │   │   └── veterinary.png
│       │   │
│       │   ├── � social/            # Social icons (1 file)
│       │   │   └── youtube.png
│       │   │
│       │   └── � unused/            # Icons not used (22 files)
│       │       ├── book.png
│       │       ├── bookmark.png
│       │       ├── cat.png
│       │       ├── cat copy.png
│       │       ├── circle-with-x.png
│       │       ├── document.png
│       │       ├── durability.png
│       │       ├── favorite.png
│       │       ├── file.png
│       │       ├── google-icon.png
│       │       ├── hide.png
│       │       ├── laptop.png
│       │       ├── loading.png
│       │       ├── midnight.png
│       │       ├── pencil.png
│       │       ├── pet.png
│       │       ├── shape.png
│       │       ├── sync.png
│       │       ├── verified.png
│       │       ├── views.png
│       │       └── writing.png
│       │
│       └── � images/
│           ├── � hero/              # Hero images
│           │   ├── hero1.png
│           │   └── hero2.png
│           │
│           ├── � auth/              # Login/Register images
│           │   ├── login_fix1.png
│           │   ├── login_fix2.png
│           │   ├── login_fix3.png
│           │   ├── login_register1.png
│           │   ├── login_register2.png
│           │   └── login_register3.png
│           │
│           ├── � banners/           # Banner images
│           │   ├── Banner Petizo1.png
│           │   ├── Banner Petizo2.png
│           │   ├── Banner Petizo3.png
│           │   ├── Banner Petizo4.png
│           │   ├── Banner Petizo5.png
│           │   └── Banner Petizo6.png
│           │
│           └── � unused/            # Unused images
│               ├── login1.jpg
│               ├── login2.jpg
│               ├── login3.jpg
│               └── shutterstock_1842198919.jpg
│
├── � ocr_system/                    # Python OCR system (no change)
│   ├── scan.py
│   ├── preprocessing.py
│   ├── ocr_engines.py
│   ├── data_extraction.py
│   └── requirements.txt
│
├── � scripts/
│   ├── � setup/
│   │   └── init-database.js
│   │
│   ├── � migrations/
│   │   ├── migrate-users.js
│   │   ├── add-slug-column.js
│   │   ├── add-vaccine-fields.js
│   │   └── add-blog-source-columns.js
│   │
│   ├── � utils/
│   │   ├── download-db.js
│   │   └── upload-images-to-railway.js
│   │
│   └── � archive-debug/            # Archived debug scripts
│       └── (15 debug scripts)
│
└── � docs/
    ├── DEPLOYMENT.md
    ├── ENV-VARIABLES.txt
    ├── OCR-SETUP.md
    └── VOLUME-FIX.md
```

---

## � การเปลี่ยนแปลง Path References

### Frontend (HTML/JS/CSS)

| ปัจจุบัน | ใหม่ | ผลกระทบ |
|---------|------|---------|
| `/icon/*.png` | `/assets/icons/{category}/*.png` | ต้องแก้ทุกไฟล์ HTML/JS |
| `/images/*.png` | `/assets/images/{category}/*.png` | ต้องแก้ HTML ที่ใช้รูป |
| `login.html` | `/pages/auth/login.html` | ต้องแก้ลิงก์ใน navbar, index.html |
| `your-pet.html` | `/pages/pets/your-pet.html` | ต้องแก้ลิงก์ navigation |
| `blog.html` | `/pages/blog/blog.html` | ต้องแก้ลิงก์ navigation |
| `admin.html` | `/pages/admin/admin.html` | ต้องแก้ลิงก์ admin |

### Backend (server.js)

| ปัจจุบัน | ใหม่ | การเปลี่ยนแปลง |
|---------|------|---------------|
| `./data/petizo.db` | `./data/database/petizo.db` | แก้ database path |
| `express.static('public')` | ไม่เปลี่ยน | ยังใช้ public/ เหมือนเดิม |
| All routes in server.js | แยกไปยัง `src/routes/*.js` | Refactor routes |
| Middleware in server.js | ย้ายไป `src/middleware/*.js` | Extract middleware |

---

## � ขั้นตอนการดำเนินการ

### Phase 1: Backend Restructure (ลดความซับซ้อนของ server.js)

**ขั้นตอน 1.1: สร้างโฟลเดอร์ backend**
```
สร้าง: src/config/
สร้าง: src/middleware/
สร้าง: src/routes/
สร้าง: src/routes/admin/
สร้าง: src/utils/
```

**ขั้นตอน 1.2: แยก config และ middleware**
- สร้าง `src/config/database.js` - Database connection
- สร้าง `src/config/multer.js` - File upload configuration
- สร้าง `src/middleware/auth.js` - authenticateToken, isAdmin
- สร้าง `src/utils/slugify.js` - Slugify function

**ขั้นตอน 1.3: แยก routes ออกจาก server.js**
- สร้าง `src/routes/auth.routes.js` (3 routes)
- สร้าง `src/routes/user.routes.js` (6 routes)
- สร้าง `src/routes/pet.routes.js` (5 routes)
- สร้าง `src/routes/vaccination.routes.js` (4 routes)
- สร้าง `src/routes/vaccine-schedule.routes.js` (4 routes)
- สร้าง `src/routes/notification.routes.js` (1 route)
- สร้าง `src/routes/blog.routes.js` (5 routes)
- สร้าง `src/routes/ocr.routes.js` (3 routes)
- สร้าง `src/routes/chat.routes.js` (1 route)
- สร้าง `src/routes/admin/users.routes.js` (7 routes)
- สร้าง `src/routes/admin/blog.routes.js` (5 routes)
- สร้าง `src/routes/admin/dashboard.routes.js` (5 routes)
- สร้าง `src/routes/admin/upload.routes.js` (1 route)

**ขั้นตอน 1.4: อัพเดท server.js**
- ลดขนาด server.js จาก 1,880 บรรทัด → ~150 บรรทัด
- Import routes และ mount ที่ appropriate paths
- ใช้ router.use() แทน app.get/post/put/delete แต่ละอัน

**ผลลัพธ์:**
-  server.js สั้นและอ่านง่าย
-  Routes แยกตามหน้าที่
-  Middleware แยกออกมา reusable
-  Config แยกออกมาเป็นไฟล์เดียว

---

### Phase 2: Database Restructure (ย้าย database)

**ขั้นตอน 2.1: สร้าง folder structure**
```
สร้าง: data/database/
สร้าง: data/database/backups/
```

**ขั้นตอน 2.2: ย้าย database files**
- ย้าย `petizo.db` → `data/database/petizo.db`
- ย้าย `petizo.db.backup` → `data/database/backups/petizo.db.backup`

**ขั้นตอน 2.3: อัพเดท path references**
- แก้ `src/config/database.js` เปลี่ยน path จาก `./data/petizo.db` → `./data/database/petizo.db`
- แก้ script ทั้งหมดใน `scripts/` ที่อ้อิง database path

**ขั้นตอน 2.4: แยก uploads ตามประเภท**
```
สร้าง: data/uploads/profiles/
สร้าง: data/uploads/pets/
สร้าง: data/uploads/vaccinations/
สร้าง: data/uploads/blogs/
```

**ผลลัพธ์:**
-  Database ไฟล์อยู่ใน data/database/
-  Backup แยกอยู่ใน backups/
-  Uploads จัดเป็นหมวดหมู่

---

### Phase 3: Frontend Restructure (จัดระเบียบ HTML และ assets)

**ขั้นตอน 3.1: สร้าง folder structure**
```
สร้าง: public/pages/
สร้าง: public/pages/auth/
สร้าง: public/pages/pets/
สร้าง: public/pages/vaccinations/
สร้าง: public/pages/blog/
สร้าง: public/pages/admin/
สร้าง: public/pages/profile/
สร้าง: public/assets/
สร้าง: public/assets/icons/ui/
สร้าง: public/assets/icons/pets/
สร้าง: public/assets/icons/medical/
สร้าง: public/assets/icons/social/
สร้าง: public/assets/icons/unused/
สร้าง: public/assets/images/hero/
สร้าง: public/assets/images/auth/
สร้าง: public/assets/images/banners/
สร้าง: public/assets/images/unused/
```

**ขั้นตอน 3.2: ย้าย HTML pages**
- ย้าย `login.html` → `pages/auth/login.html`
- ย้าย `register.html` → `pages/auth/register.html`
- ย้าย `your-pet.html` → `pages/pets/your-pet.html`
- ย้าย `pet-details.html` → `pages/pets/pet-details.html`
- ย้าย `vaccination-record.html` → `pages/vaccinations/vaccination-record.html`
- ย้าย `vaccine-schedule.html` → `pages/vaccinations/vaccine-schedule.html`
- ย้าย `vaccine-notifications.html` → `pages/vaccinations/vaccine-notifications.html`
- ย้าย `blog.html` → `pages/blog/blog.html`
- ย้าย `blog-detail.html` → `pages/blog/blog-detail.html`
- ย้าย `admin.html` → `pages/admin/admin.html`
- ย้าย `user-profile.html` → `pages/profile/user-profile.html`
- เก็บ `index.html` และ `terms.html` ไว้ที่ root ของ public/

**ขั้นตอน 3.3: ย้ายและจัดกลุ่มไอคอน**

**UI Icons (41 ไฟล์)** → `assets/icons/ui/`:
```
alarm.png, alert.png, barcode.png, bin.png, birthday.png,
bot-assistant.png, calendar (2).png, cancel.png, chart.png,
chat.png, cute-camera.png, document2.png, edit.png,
gender.png, gender (1).png, left-arrow.png, like.png,
logo.png, logout.png, love.png, notes.png, profile.png,
right-arrow.png, scale.png, search (1).png, view.png,
warning.png, Scan documents.png
```

**Pet Icons (3 ไฟล์)** → `assets/icons/pets/`:
```
dog.png, stray-cat.png, animal-lover.png
```

**Medical Icons (8 ไฟล์)** → `assets/icons/medical/`:
```
health-check.png, medical-book.png, mentor.png, oath.png,
syringe.png, vaccination.png, veterinarian.png, veterinary.png
```

**Social Icons (1 ไฟล์)** → `assets/icons/social/`:
```
youtube.png
```

**Unused Icons (22 ไฟล์)** → `assets/icons/unused/`:
```
book.png, bookmark.png, cat.png, cat copy.png, circle-with-x.png,
document.png, durability.png, favorite.png, file.png,
google-icon.png, hide.png, laptop.png, loading.png,
midnight.png, pencil.png, pet.png, shape.png, sync.png,
verified.png, views.png, writing.png
```

**ขั้นตอน 3.4: ย้ายและจัดกลุ่มรูปภาพ**

**Hero Images** → `assets/images/hero/`:
```
hero1.png, hero2.png
```

**Auth Images** → `assets/images/auth/`:
```
login_fix1.png, login_fix2.png, login_fix3.png,
login_register1.png, login_register2.png, login_register3.png
```

**Banner Images** → `assets/images/banners/`:
```
Banner Petizo1.png → Banner Petizo6.png
```

**Unused Images** → `assets/images/unused/`:
```
login1.jpg, login2.jpg, login3.jpg, shutterstock_1842198919.jpg
```

**ขั้นตอน 3.5: อัพเดท path references ในโค้ด**

ต้องแก้ไขทั้งหมด **13 ไฟล์ HTML** + **8 ไฟล์ JS**:

**HTML Files ที่ต้องแก้:**
1. index.html - แก้ลิงก์ไป pages/
2. login.html - แก้ icon และ image paths
3. register.html - แก้ icon และ image paths
4. your-pet.html - แก้ icon paths
5. pet-details.html - แก้ icon paths
6. user-profile.html - แก้ icon paths
7. vaccination-record.html - แก้ icon paths
8. vaccine-schedule.html - แก้ icon paths
9. vaccine-notifications.html - แก้ icon paths
10. blog.html - แก้ icon paths
11. blog-detail.html - แก้ icon paths
12. admin.html - แก้ icon paths
13. terms.html - แก้ icon paths
14. components/navbar.html - แก้ลิงก์ navigation
15. components/footer.html - แก้ icon paths

**JavaScript Files ที่ต้องแก้:**
1. navbar.js - แก้ลิงก์ และ icon paths
2. chat-popup.js - แก้ icon/bot-assistant.png path
3. auth-common.js - แก้ redirect paths
4. profile-dropdown.js - แก้ icon paths
5. ocr-handler.js - แก้ loading icon path (ถ้ามี)
6. vaccine-notification.js - แก้ icon paths (ถ้ามี)
7. footer.js - แก้ paths (ถ้ามี)

**ตัวอย่างการแก้ไข:**
```javascript
// เดิม
'/icon/logo.png'
// ใหม่
'/assets/icons/ui/logo.png'

// เดิม
'/images/hero1.png'
// ใหม่
'/assets/images/hero/hero1.png'

// เดิม
'login.html'
// ใหม่
'/pages/auth/login.html'
```

**ผลลัพธ์:**
-  HTML จัดเป็นหมวดหมู่ตามฟีเจอร์
-  ไอคอนแยกตามประเภท (UI, Pets, Medical, Social)
-  รูปภาพจัดหมวดหมู่ชัดเจน
-  ไฟล์ที่ไม่ใช้แยกออกมาอยู่ใน unused/

---

##  ข้อควรระวัง

### 1. การทดสอบ
-  ต้องทดสอบทุกหน้าหลังแก้ไข paths
-  ตรวจสอบว่าลิงก์ทั้งหมดทำงาน
-  ตรวจสอบรูปภาพและไอคอนโหลดถูกต้อง
-  ทดสอบ API endpoints ทั้งหมด

### 2. Git Commit Strategy
แนะนำแบ่ง commit ตาม phase:
```
Phase 1: Backend restructure
- commit 1: Create backend folder structure
- commit 2: Extract middleware and config
- commit 3: Extract routes
- commit 4: Update server.js

Phase 2: Database restructure
- commit 5: Move database files
- commit 6: Update database paths

Phase 3: Frontend restructure
- commit 7: Create frontend folder structure
- commit 8: Move HTML files
- commit 9: Move and organize icons
- commit 10: Move and organize images
- commit 11: Update all path references
- commit 12: Final testing and fixes
```

### 3. Backup
-  สำรองข้อมูล database ก่อนเริ่ม
-  Commit ไปที่ git ก่อนทำแต่ละ phase
-  ทดสอบหลังแต่ละ phase

### 4. การ Deploy
-  ต้องอัพเดท Railway config ถ้ามี path เปลี่ยน
-  ตรวจสอบ environment variables
-  ทดสอบบน local ก่อน deploy

---

## � สรุปผลลัพธ์ที่คาดหวัง

| ตัวชี้วัด | ก่อน | หลัง | ผลลัพธ์ |
|---------|------|------|---------|
| **Backend** | | | |
| server.js ขนาด | 1,880 บรรทัด | ~150 บรรทัด | ลด 92% |
| จำนวน route files | 1 ไฟล์ | 13 ไฟล์ | แยกตามหน้าที่ |
| **Frontend** | | | |
| HTML ใน root | 13 ไฟล์ | 2 ไฟล์ | จัดเป็นหมวดหมู่ |
| ไอคอนใน folder เดียว | 61 ไฟล์ | 0 ไฟล์ | แยกเป็น 5 หมวด |
| รูปภาพจัดหมวดหมู่ |  |  | แยกเป็น 4 หมวด |
| **Database** | | | |
| DB อยู่ที่ root |  |  | ย้ายไป data/database/ |
| Uploads มีหมวดหมู่ |  |  | แยก 4 ประเภท |

---

## � ประโยชน์ที่ได้รับ

### 1. ง่ายต่อการบำรุงรักษา
-  หาไฟล์ที่ต้องการแก้ไขได้เร็ว
-  แก้ไขแค่ไฟล์ที่เกี่ยวข้อง ไม่กระทบส่วนอื่น
-  เพิ่มฟีเจอร์ใหม่ง่ายขึ้น

### 2. ทำงานเป็นทีมได้ดีขึ้น
-  หลายคนแก้ไขไฟล์คนละส่วนได้โดยไม่ conflict
-  Code review ง่ายขึ้น
-  Onboard developer ใหม่เร็วขึ้น

### 3. Performance
-  ระบุและโหลดเฉพาะไฟล์ที่ต้องใช้
-  แยก unused files ออกมา ลดขนาด bundle

### 4. Scalability
-  เพิ่มฟีเจอร์ใหม่ได้ง่ายโดยไม่รบกวนของเดิม
-  แยก routes ชัดเจน สามารถทำ microservices ในอนาคต
-  จัดการ assets ง่าย เพิ่ม CDN ได้ในอนาคต

---

##  Checklist การดำเนินการ

### Pre-work
- [ ] อ่านแผนทั้งหมดให้เข้าใจ
- [ ] Backup database และโค้ดทั้งหมด
- [ ] Commit สิ่งที่ทำค้างไว้ก่อน
- [ ] สร้าง branch ใหม่สำหรับ restructure

### Phase 1: Backend
- [ ] สร้าง folder structure (src/config, src/middleware, src/routes, src/utils)
- [ ] สร้าง database.js และ multer.js
- [ ] สร้าง middleware/auth.js
- [ ] สร้าง utils/slugify.js
- [ ] แยก routes ทั้งหมด (13 ไฟล์)
- [ ] อัพเดท server.js ให้ใช้ routes ใหม่
- [ ] ทดสอบ API endpoints ทั้งหมด
- [ ] Commit "Backend restructure complete"

### Phase 2: Database
- [ ] สร้าง data/database/ และ data/database/backups/
- [ ] ย้าย petizo.db และ backup
- [ ] อัพเดท database path ใน config
- [ ] สร้าง uploads subfolders
- [ ] ทดสอบการเชื่อมต่อ database
- [ ] Commit "Database restructure complete"

### Phase 3: Frontend
- [ ] สร้าง folder structure (pages, assets/icons, assets/images)
- [ ] ย้าย HTML files ไปยัง pages/
- [ ] ย้ายไอคอนไปยัง assets/icons/ (แยกตามหมวด)
- [ ] ย้ายรูปภาพไปยัง assets/images/ (แยกตามหมวด)
- [ ] อัพเดท path references ใน HTML files (13 ไฟล์)
- [ ] อัพเดท path references ใน JS files (8 ไฟล์)
- [ ] อัพเดท path references ใน components (2 ไฟล์)
- [ ] ทดสอบทุกหน้า
- [ ] ตรวจสอบว่ารูปภาพและไอคอนโหลดถูกต้อง
- [ ] ทดสอบ navigation links ทั้งหมด
- [ ] Commit "Frontend restructure complete"

### Post-work
- [ ] ทดสอบ full application flow
- [ ] ทดสอบบน local server
- [ ] อัพเดท documentation ถ้ามี
- [ ] Deploy ขึ้น staging/production
- [ ] ทดสอบบน production
- [ ] ลบ branch เก่า (ถ้ามี)

---

## � พร้อมเริ่มต้นหรือยัง?

**คำถามก่อนเริ่มต้น:**

1. **คุณต้องการทำทีละ Phase หรือทั้งหมดเลย?**
   - แนะนำ: ทีละ Phase แล้ว commit เพื่อความปลอดภัย

2. **คุณต้องการลบไอคอนและรูปที่ไม่ใช้หรือไม่?**
   - ถ้าต้องการ: ลบไฟล์ใน unused/
   - ถ้าไม่ต้องการ: เก็บไว้ใน unused/ ก่อน

3. **คุณต้องการแยก uploads เป็น subfolders หรือไม่?**
   - ถ้าใช่: ต้องอัพเดท multer config และย้ายไฟล์เดิม
   - ถ้าไม่: เก็บใน data/uploads/ แบบเดิม

4. **มี automated tests หรือไม่?**
   - ถ้ามี: ต้องอัพเดท test paths ด้วย
   - ถ้าไม่มี: ต้องทดสอบ manual ทั้งหมด

**บอกฉันได้เลยว่าต้องการ:**
-  เริ่ม Phase 1 (Backend) ก่อน
-  เริ่ม Phase 3 (Frontend) ก่อน
-  ทำทั้งหมดเลยในคราวเดียว
-  แก้แผนบางส่วน

---

**หมายเหตุ:** แผนนี้ออกแบบมาให้ปลอดภัยและเป็นระบบ ทุก phase สามารถ rollback ได้ถ้ามีปัญหา โดยใช้ Git
