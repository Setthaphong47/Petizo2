# คู่มือการ Deploy Petizo บน Railway.app

## สารบัญ
1. [เตรียมความพร้อม](#เตรียมความพร้อม)
2. [สร้าง Railway Project](#สร้าง-railway-project)
3. [ตั้งค่า Environment Variables](#ตั้งค่า-environment-variables)
4. [เพิ่ม Volumes สำหรับเก็บไฟล์](#เพิ่ม-volumes)
5. [Deploy และทดสอบ](#deploy-และทดสอบ)
6. [แก้ไขปัญหา](#แก้ไขปัญหา)

---

## เตรียมความพร้อม

### 1. สร้าง Railway Account
- ไปที่ https://railway.app
- สมัครสมาชิกด้วย GitHub Account
- ยืนยันอีเมล

### 2. เตรียม GitHub Repository
```bash
# ถ้ายังไม่มี git repository
cd petizo
git init
git add .
git commit -m "Initial commit for Railway deployment"

# สร้าง repository บน GitHub แล้ว push
git remote add origin https://github.com/YOUR_USERNAME/petizo.git
git branch -M main
git push -u origin main
```

---

## สร้าง Railway Project

### ขั้นตอนที่ 1: สร้างโปรเจค

1. Login เข้า [Railway Dashboard](https://railway.app/dashboard)
2. คลิก **"New Project"**
3. เลือก **"Deploy from GitHub repo"**
4. เลือก repository **petizo**
5. Railway จะเริ่ม deploy อัตโนมัติ

### ขั้นตอนที่ 2: รอการ Build (ครั้งแรกจะล้มเหลวเพราะยังไม่มี env variables)

---

## ตั้งค่า Environment Variables

### 1. ไปที่ Settings → Variables

คลิกที่โปรเจค → **Settings** → **Variables** → **Add Variables**

### 2. เพิ่ม Variables ทั้งหมด:

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-2024
NODE_ENV=production
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key-here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
MODEL_NAME=openai/gpt-4o-mini
```

### สำคัญมาก:
- **JWT_SECRET**: ต้องเปลี่ยนเป็นค่าใหม่! อย่าใช้ค่าเดิมจาก development
  - ควรยาวอย่างน้อย 32 ตัวอักษร
  - สามารถสร้างได้ด้วย: `openssl rand -hex 32`
- **OPENROUTER_API_KEY**: ใช้ API key ของคุณเอง
- **PORT**: ไม่ต้องตั้ง Railway จะตั้งให้อัตโนมัติ

### 3. บันทึกและ Redeploy

หลังจากเพิ่ม variables แล้ว:
- คลิก **"Redeploy"** หรือ
- Push commit ใหม่ไป GitHub

---

## เพิ่ม Volumes สำหรับเก็บไฟล์

### ทำไมต้องมี Volumes?
- เก็บรูปภาพที่ผู้ใช้อัปโหลด (uploads/)
- เก็บ SQLite database (petizo.db)
- ป้องกันไฟล์หายเมื่อ redeploy

### Volume 1: สำหรับ Uploads และ Database

1. ไปที่ **Settings** → **Volumes**
2. คลิก **"New Volume"**
3. ตั้งค่าดังนี้:
   ```
   Volume Name: petizo-data
   Mount Path: /app/petizo/data
   ```
4. คลิก **"Add Volume"**

### สำคัญมาก:
- Mount Path ต้องเป็น `/app/petizo/data` เพื่อให้รูปภาพและ database อยู่ใน volume
- ถ้า mount path ผิด รูปภาพจะหายทุกครั้งที่ redeploy
- Volume จะเก็บทั้ง `petizo.db` และโฟลเดอร์ `uploads/`

### หมายเหตุ:
- Free tier มี 1GB Volume ฟรี (ใช้ร่วมกันได้)
- ถ้าต้องการมากกว่า ราคา $5/month ต่อ 1GB

---

## Deploy และทดสอบ

### 1. รอให้ Build เสร็จ

ดู logs ที่ tab **"Deployments"** จะเห็น:
```
Building...
Running npm install
Running npm run build (สร้าง database)
Starting server with npm start
Server listening on port XXXX
```

### 2. เปิด URL

Railway จะสร้าง URL ให้อัตโนมัติ:
- ไปที่ **Settings** → **Networking**
- คลิก **"Generate Domain"**
- จะได้ URL แบบ: `https://petizo-production-xxxx.up.railway.app`

### 3. ทดสอบเข้าสู่ระบบ

เปิด URL แล้วทดสอบ login:

**Admin:**
- Email: `admin@petizo.com`
- Password: `admin123`

**User:**
- Email: `user@petizo.com`
- Password: `user123`

---

## แก้ไขปัญหา

### Build ล้มเหลว

**ตรวจสอบ:**
1. ดู Logs → มีข้อผิดพลาดอะไรบ้าง
2. ตรวจสอบ Environment Variables ครบหรือไม่
3. ตรวจสอบ `package.json` มี `build` script หรือไม่

**วิธีแก้:**
```bash
# ลองรันในเครื่องก่อน
npm install
npm run build
npm start
```

### Database Error

**สาเหตุ:** ไม่มี write permission หรือ Volume ไม่ได้ mount

**วิธีแก้:**
1. ตรวจสอบว่าเพิ่ม Volume สำหรับ database แล้ว
2. Mount path ต้องเป็น `/app` หรือ `/app/petizo.db`
3. Redeploy

### รูปภาพหาย

**สาเหตุ:** ไม่ได้เพิ่ม Volume สำหรับ uploads

**วิธีแก้:**
1. เพิ่ม Volume mount ที่ `/app/uploads`
2. Redeploy (รูปเก่าจะหาย ต้องอัปโหลดใหม่)

### OCR ไม่ทำงาน

**สาเหตุ:** Railway ไม่มี Python หรือ Tesseract OCR

**วิธีแก้ชั่วคราว:**
1. สร้าง Nixpacks configuration (ดูด้านล่าง)
2. หรือปิดฟีเจอร์ OCR ไว้ก่อน

**สร้างไฟล์ `nixpacks.toml`:**
```toml
[phases.setup]
nixPkgs = ['python39', 'tesseract']

[phases.install]
cmds = ['pip install -r ocr_system/requirements.txt']
```

### JWT Token Error

**สาเหตุ:** JWT_SECRET ไม่ตรงกัน

**วิธีแก้:**
1. ตั้งค่า JWT_SECRET ใหม่ใน Railway
2. Logout แล้ว Login ใหม่

---

## ตรวจสอบสถานะ

### ดู Logs แบบ Real-time

```
1. ไปที่ Dashboard → เลือกโปรเจค
2. คลิก tab "Deployments"
3. คลิก deployment ล่าสุด
4. ดู "Build Logs" และ "Deploy Logs"
```

### ดูการใช้งาน Resources

```
1. ไปที่ "Metrics"
2. ดู:
   - CPU Usage
   - Memory Usage
   - Network Traffic
   - Volume Usage
```

---

## ค่าใช้จ่าย

### Free Tier ($0/month)
- 500 hours/month
- 1GB Volume (ฟรี)
- Unlimited bandwidth
- Custom domains
- Sleep หลัง inactivity

### Hobby Plan ($5/month)
- Unlimited hours
- 5GB Volume รวม
- ไม่ sleep
- Priority support

### ประมาณการสำหรับ Petizo:
```
- Base: $0 (Free tier)
- Volume 2GB: $5/month (ถ้าต้องการมากกว่า 1GB ฟรี)
- รวม: $0-5/month
```

---

## การอัปเดทโค้ด

### วิธีที่ 1: Auto Deploy (แนะนำ)

Railway ตั้งค่า auto-deploy จาก GitHub อยู่แล้ว:

```bash
# แก้ไขโค้ด
git add .
git commit -m "Update feature"
git push origin main

# Railway จะ deploy ให้อัตโนมัติ
```

### วิธีที่ 2: Manual Deploy

1. ไปที่ Dashboard → Deployments
2. คลิก **"Deploy"**
3. เลือก commit ที่ต้องการ

---

## Security Best Practices

### 1. เปลี่ยน JWT_SECRET
```bash
# สร้าง secret ใหม่
openssl rand -hex 32

# อัปเดตใน Railway Variables
JWT_SECRET=your-new-generated-secret-here
```

### 2. เปลี่ยนรหัสผ่าน Admin

หลัง deploy ให้:
1. Login ด้วย `admin@petizo.com / admin123`
2. ไปที่ Profile → Change Password
3. เปลี่ยนรหัสผ่านใหม่ทันที

### 3. ตั้งค่า CORS (ถ้าจำเป็น)

ถ้าต้องการจำกัด domains ที่เข้าถึงได้:
```javascript
// ใน server.js
app.use(cors({
  origin: ['https://yourdomain.com']
}));
```

---

## Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Petizo GitHub Issues](https://github.com/YOUR_USERNAME/petizo/issues)

---

## Checklist หลัง Deploy

- [ ] ตรวจสอบ URL เปิดได้
- [ ] Login ด้วย admin ได้
- [ ] เปลี่ยนรหัสผ่าน admin
- [ ] ทดสอบสมัครสมาชิกใหม่
- [ ] ทดสอบเพิ่มสัตว์เลี้ยง
- [ ] ทดสอบอัปโหลดรูป
- [ ] ทดสอบบันทึกวัคซีน
- [ ] ตรวจสอบ AI Chatbot
- [ ] ตั้งค่า Custom Domain (ถ้ามี)
- [ ] เพิ่ม Volume สำหรับ uploads
- [ ] เพิ่ม Volume สำหรับ database

---

## เสร็จสิ้น!

ยินดีด้วย! Petizo ของคุณพร้อมใช้งานแล้วบน Railway.app

หากมีปัญหา สามารถ:
1. ดู Logs ใน Railway Dashboard
2. ตรวจสอบ Environment Variables
3. ลองรันในเครื่องก่อน (`npm start`)
4. ติดต่อผ่าน GitHub Issues

**Happy Deploying!**
