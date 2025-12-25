# Petizo - Pet Management System

ระบบจัดการข้อมูลสัตว์เลี้ยงและติดตามวัคซีน สำหรับผู้เลี้ยงแมว

## เกี่ยวกับโปรเจค

Petizo เป็นเว็บแอปพลิเคชันสำหรับจัดการข้อมูลแมวและติดตามประวัติการฉีดวัคซีน ช่วยให้เจ้าของสัตว์เลี้ยงสามารถบันทึก จัดการ และรับการแจ้งเตือนเมื่อถึงกำหนดฉีดวัคซีนได้อย่างสะดวก

## คุณสมบัติหลัก

### สำหรับผู้ใช้ทั่วไป
- จัดการข้อมูลแมว (เพิ่ม แก้ไข ลบ)
- บันทึกข้อมูลพื้นฐาน: ชื่อ สายพันธุ์ เพศ วันเกิด สี น้ำหนัก
- อัปโหลดและครอปรูปภาพแมว
- ดูตารางวัคซีนที่แนะนำตามอายุ
- บันทึกประวัติการฉีดวัคซีนพร้อมหลักฐาน
- รับการแจ้งเตือนวัคซีนที่ใกล้ถึงกำหนด
- อ่านบทความเกี่ยวกับการดูแลสัตว์เลี้ยง

### สำหรับผู้ดูแลระบบ (Admin)
- จัดการบทความ (เพิ่ม แก้ไข ลบ ปักหมุด)
- จัดการผู้ใช้ (ดูข้อมูล เปลี่ยนสถานะ ลบบัญชี)
- ดูข้อมูลสัตว์เลี้ยงทั้งหมดในระบบ
- Dashboard แสดงสถิติและกราฟ
- เข้าถึงได้เฉพาะผ่านคอมพิวเตอร์ (บล็อกการเข้าจากมือถือ)

## เทคโนโลยีที่ใช้

### Backend
- Node.js + Express.js
- SQLite3
- JWT Authentication
- bcrypt สำหรับ hash รหัสผ่าน
- Multer สำหรับอัปโหลดไฟล์
- SendGrid สำหรับส่งอีเมล

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Cropper.js สำหรับครอปรูปภาพ

## โครงสร้างโปรเจค

```
petizo/
├── server.js                 # Express server หลัก
├── init-database.js          # สคริปต์สร้างฐานข้อมูล
├── package.json
├── .env                      # ไฟล์ config (ต้องสร้างเอง)
├── data/
│   └── petizo.db            # SQLite database
├── public/
│   ├── index.html           # หน้าแรก
│   ├── login.html           # เข้าสู่ระบบ
│   ├── register.html        # สมัครสมาชิก
│   ├── your-pet.html        # จัดการแมว
│   ├── pet-details.html     # รายละเอียดแมว + ตารางวัคซีน
│   ├── vaccination-record.html  # บันทึกประวัติวัคซีน
│   ├── user-profile.html    # โปรไฟล์ผู้ใช้
│   ├── admin.html           # หน้า Admin
│   ├── blog.html            # บทความทั้งหมด
│   ├── blog-detail.html     # อ่านบทความ
│   ├── js/
│   │   ├── navbar.js        # Navigation bar
│   │   ├── auth-common.js   # ฟังก์ชัน authentication
│   │   ├── vaccine-notification.js  # ระบบแจ้งเตือน
│   │   ├── profile-dropdown.js
│   │   ├── chat-popup.js
│   │   ├── ocr-handler.js
│   │   └── config.js
│   ├── css/
│   │   ├── navbar.css
│   │   └── chat-popup.css
│   ├── icon/                # ไอคอนต่างๆ
│   ├── images/              # รูปภาพสำหรับบทความ
│   └── uploads/             # รูปที่อัปโหลดโดยผู้ใช้
└── node_modules/
```

## การติดตั้ง

### ความต้องการของระบบ
- Node.js >= 18.0.0
- npm >= 9.0.0

### ขั้นตอนการติดตั้ง

1. Clone โปรเจค
```bash
git clone <repository-url>
cd petizo
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. สร้างไฟล์ .env
```
PORT=3000
JWT_SECRET=your-secret-key-here
SENDGRID_API_KEY=your-sendgrid-api-key
SENDER_EMAIL=your-verified-sender@example.com
```

4. สร้างฐานข้อมูล
```bash
npm run init-db
```

5. เริ่มต้นใช้งาน
```bash
npm start
```

หรือใช้ nodemon สำหรับ development
```bash
npm run dev
```

6. เข้าใช้งานที่ http://localhost:3000

## ฐานข้อมูล

ระบบใช้ SQLite3 โดยมีตารางหลัก:

- **members**: ข้อมูลผู้ใช้
- **pets**: ข้อมูลแมว
- **vaccinations**: ประวัติการฉีดวัคซีน
- **vaccine_schedules**: ตารางวัคซีนแนะนำ
- **blogs**: บทความ
- **blog_views**: สถิติการเข้าชมบทความ

## API Endpoints

### Authentication
- POST `/api/auth/register` - สมัครสมาชิก
- POST `/api/auth/login` - เข้าสู่ระบบ
- POST `/api/auth/forgot-password/send-reset-link` - ขอรีเซ็ตรหัสผ่าน
- POST `/api/auth/reset-password` - รีเซ็ตรหัสผ่าน
- GET `/api/auth/verify` - ตรวจสอบ token

### Pets
- GET `/api/pets` - ดูแมวทั้งหมดของผู้ใช้
- GET `/api/pets/:id` - ดูรายละเอียดแมว
- POST `/api/pets` - เพิ่มแมว
- PUT `/api/pets/:id` - แก้ไขข้อมูลแมว
- DELETE `/api/pets/:id` - ลบแมว

### Vaccinations
- GET `/api/pets/:petId/vaccinations` - ดูประวัติวัคซีนของแมว
- POST `/api/pets/:petId/vaccinations` - บันทึกวัคซีน
- PUT `/api/vaccinations/:id` - แก้ไขประวัติวัคซีน
- DELETE `/api/vaccinations/:id` - ลบประวัติวัคซีน

### Vaccine Schedules
- GET `/api/pets/:petId/recommended-vaccines` - ดูตารางวัคซีนแนะนำตามอายุ
- GET `/api/notifications/all` - ดูการแจ้งเตือนทั้งหมด

### Blog
- GET `/api/blog` - ดูบทความที่เผยแพร่ (แบบ pagination)
- GET `/api/blog/all` - ดูบทความทั้งหมด
- GET `/api/blog/:slug` - อ่านบทความ
- POST `/api/blog/:slug/view` - บันทึกการเข้าชม

### Admin
- GET `/api/admin/users` - ดูผู้ใช้ทั้งหมด
- PUT `/api/admin/users/:id/status` - เปลี่ยนสถานะผู้ใช้
- DELETE `/api/admin/users/:id` - ลบผู้ใช้
- POST `/api/admin/blog` - สร้างบทความ
- PUT `/api/admin/blog/:id` - แก้ไขบทความ
- DELETE `/api/admin/blog/:id` - ลบบทความ
- GET `/api/admin/dashboard/stats` - สถิติสำหรับ dashboard

## การใช้งาน

### สำหรับผู้ใช้ทั่วไป

1. สมัครสมาชิกที่หน้า Register
2. เข้าสู่ระบบ
3. ไปที่ "Your Pet" เพื่อเพิ่มข้อมูลแมว
4. คลิกที่แมวเพื่อดูรายละเอียดและตารางวัคซีนที่แนะนำ
5. บันทึกประวัติวัคซีนที่ "สมุดวัคซีน"
6. ดูการแจ้งเตือนวัคซีนที่กำลังจะถึงกำหนดที่ไอคอนกระดิ่ง

### สำหรับ Admin

1. สร้างบัญชี admin ผ่านการแก้ไขฐานข้อมูลโดยตรง (เปลี่ยน role เป็น 'admin')
2. เข้าสู่ระบบ จะถูก redirect ไปหน้า admin.html
3. Admin เข้าถึงได้เฉพาะผ่านคอมพิวเตอร์เท่านั้น

## Security Features

- Password hashing ด้วย bcrypt
- JWT-based authentication
- Role-based access control (user/admin)
- Admin panel บล็อกการเข้าจากอุปกรณ์มือถือ
- File upload validation
- SQL injection prevention ด้วย prepared statements

## การ Deploy

สามารถ deploy ได้หลายวิธี:

### Railway
1. เชื่อมต่อ GitHub repository
2. ตั้งค่า environment variables
3. Railway จะ build และ deploy อัตโนมัติ

### Manual Deployment
1. คัดลอกโปรเจคไปยัง server
2. ติดตั้ง dependencies: `npm install --production`
3. สร้างฐานข้อมูล: `npm run init-db`
4. รัน: `npm start`

## ข้อจำกัดที่ทราบ

- ระบบรองรับเฉพาะแมวเท่านั้น (ไม่รองรับสัตว์เลี้ยงชนิดอื่น)
- การแจ้งเตือนวัคซีนทำงานเมื่อผู้ใช้เข้าสู่ระบบเท่านั้น
- Admin panel ใช้งานได้เฉพาะบนคอมพิวเตอร์

## ใบอนุญาต

ISC

## ผู้พัฒนา

โปรเจคนี้พัฒนาขึ้นเพื่อช่วยให้เจ้าของแมวสามารถดูแลสัตว์เลี้ยงได้อย่างมีประสิทธิภาพมากขึ้น
