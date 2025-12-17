# การตั้งค่าระบบส่งอีเมลสำหรับ Forgot Password

## ขั้นตอนการตั้งค่า Gmail App Password

ระบบ Forgot Password ใช้ Nodemailer ในการส่งอีเมลผ่าน Gmail โดยต้องใช้ **App Password** แทนรหัสผ่านปกติของ Gmail

### 1. เปิดใช้งาน 2-Step Verification

1. เข้าไปที่ [Google Account Security](https://myaccount.google.com/security)
2. ในส่วน "Signing in to Google" คลิกที่ **2-Step Verification**
3. ทำตามขั้นตอนเพื่อเปิดใช้งาน 2-Step Verification (ถ้ายังไม่ได้เปิด)

### 2. สร้าง App Password

1. เข้าไปที่ [Google App Passwords](https://myaccount.google.com/apppasswords)
2. เลือก **Select app** → เลือก "Mail"
3. เลือก **Select device** → เลือก "Other (Custom name)"
4. ตั้งชื่อ เช่น "Petizo Password Reset"
5. คลิก **Generate**
6. Google จะแสดง App Password (16 ตัวอักษร) **คัดลอกรหัสนี้ไว้**

### 3. ตั้งค่าในไฟล์ .env

สร้างไฟล์ `.env` ในโฟลเดอร์ petizo (ถ้ายังไม่มี) และเพิ่มข้อมูลต่อไปนี้:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:3000
```

**หมายเหตุ:**
- `EMAIL_USER`: อีเมล Gmail ของคุณ (ที่จะใช้ส่งอีเมล)
- `EMAIL_APP_PASSWORD`: App Password ที่คุณได้จากขั้นตอนที่ 2 (16 ตัวอักษร สามารถมีช่องว่างหรือไม่มีก็ได้)
- `FRONTEND_URL`: URL ของ frontend (ใช้ในการสร้างลิงก์รีเซ็ตรหัสผ่าน)

### 4. ทดสอบการส่งอีเมล

1. รันเซิร์ฟเวอร์: `npm run dev` หรือ `node server.js`
2. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000/forgot-password.html`
3. กรอกอีเมลที่มีในระบบแล้วคลิก "ส่งลิงก์เปลี่ยนรหัสผ่าน"
4. ตรวจสอบอีเมลที่กรอกว่าได้รับลิงก์รีเซ็ตรหัสผ่านหรือไม่

## วิธีการทำงาน

1. **ผู้ใช้กรอกอีเมล** → ระบบตรวจสอบว่ามีอีเมลนี้ในฐานข้อมูลหรือไม่
2. **สร้าง Reset Token** → สร้าง token แบบสุ่มและบันทึกลงฐานข้อมูล (มีอายุ 1 ชั่วโมง)
3. **ส่งอีเมล** → ส่งลิงก์รีเซ็ตรหัสผ่านที่มี token ไปยังอีเมลของผู้ใช้
4. **ผู้ใช้คลิกลิงก์** → เปิดหน้า reset-password.html พร้อม token
5. **ตรวจสอบ token** → ระบบตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ
6. **ตั้งรหัสผ่านใหม่** → ผู้ใช้กรอกรหัสผ่านใหม่และระบบบันทึกลงฐานข้อมูล

## ข้อควรระวัง

- **อย่าแชร์ App Password** กับใครหรือ commit ลง Git
- ใส่ไฟล์ `.env` ใน `.gitignore` เสมอ
- App Password สามารถ revoke ได้ทุกเมื่อที่ [App Passwords](https://myaccount.google.com/apppasswords)
- ถ้า deploy บน production ต้องเปลี่ยน `FRONTEND_URL` เป็น URL จริง

## การแก้ปัญหา

### อีเมลไม่ถูกส่ง

1. ตรวจสอบว่า 2-Step Verification เปิดอยู่หรือไม่
2. ตรวจสอบ App Password ว่าถูกต้องหรือไม่
3. ตรวจสอบ Console Log ของ server ว่ามี error อะไร
4. ลองสร้าง App Password ใหม่

### อีเมลถูกส่งแต่ไม่เจออีเมล

1. ตรวจสอบในกล่อง Spam/Junk
2. รอสักครู่ (บางครั้งอีเมลอาจจะมาช้า)
3. ตรวจสอบว่าอีเมลที่กรอกถูกต้องหรือไม่

### ลิงก์หมดอายุ

- ลิงก์มีอายุ 1 ชั่วโมง ถ้าหมดอายุให้ขอลิงก์ใหม่อีกครั้ง
