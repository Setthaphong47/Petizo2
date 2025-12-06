# 🚂 Railway Setup Guide - Petizo

**Last Updated:** December 7, 2025

## ⚠️ ปัญหาที่พบ

1. ❌ **Login ไม่ได้** - Environment variables ยังไม่ได้ตั้งค่า
2. ❌ **Blog ไม่มา** - Database ไม่ถาวร (ไม่มี Volume)
3. ❌ **401 Unauthorized** - JWT_SECRET ไม่ถูกต้อง

---

## ✅ แก้ไขทันที (5 นาที)

### 1️⃣ ตั้งค่า Environment Variables

ไปที่ **Railway Dashboard → Your Project → Variables**

คลิก **"New Variable"** แล้วเพิ่มทีละตัว:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=petizo_super_secret_key_change_this_in_production_2024
OPENROUTER_API_KEY=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
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
MODEL_NAME=openai/gpt-4o-mini
```

**⚡ Railway จะ auto-restart service หลังเพิ่ม variables**

---

### 2️⃣ สร้าง Volume (เก็บข้อมูลถาวร)

ไปที่ **Railway Dashboard → Your Project → Settings**

1. เลื่อนลงหา **"Volumes"**
2. คลิก **"New Volume"**
3. ใส่:
   - **Mount Path**: `/app/data`
   - **Name**: `petizo-data`
4. คลิก **"Add"**

**⚡ Railway จะ restart อีกรอบ**

---

### 3️⃣ รอ Deployment เสร็จ

ไปที่ **Deployments** tab ดู status:
- ⏳ Building... (ประมาณ 30 วินาที)
- ⏳ Deploying...
- ✅ **Active** (เสร็จแล้ว!)

---

## 🧪 ทดสอบระบบ

### เข้าเว็บ
```
https://petizo1.up.railway.app
```

### Login Admin
```
Email: admin@petizo.com
Password: admin123
```

### Login Member
```
Email: user@petizo.com
Password: user123
```

---

## 🐛 ถ้ายังไม่ได้ผล

### ดู Logs
Railway Dashboard → Deployments → View Logs

### ตรวจสอบ
```
✅ Environment variables ครบ 6 ตัว?
✅ Volume mount ที่ /app/data?
✅ Deployment status = Active?
```

### Re-deploy
คลิก **"Deploy"** → **"Redeploy"**

---

## 📊 คาดการณ์หลังแก้

- ✅ Login ได้ทั้ง Admin และ Member
- ✅ Blog มาแสดงปกติ
- ✅ สร้าง Pet ได้
- ✅ OCR สแกนฉลากวัคซีนได้ (ครั้งแรกใช้เวลา 1-2 นาที)
- ✅ AI Chatbot ตอบได้
- ✅ ข้อมูลไม่หาย (เพราะมี Volume)

---

## 🎯 Next Steps หลังแก้ปัญหา

1. ⚡ เปลี่ยน `JWT_SECRET` เป็นค่าที่ปลอดภัยกว่า
2. 🔒 เปลี่ยนรหัสผ่าน admin ใหม่
3. 🌐 ตั้งค่า Custom Domain (petizo.com)
4. 📈 Monitor Memory Usage (Railway Dashboard → Metrics)

---

**หมายเหตุ:** Environment variables และ Volume เป็นสิ่งที่ **จำเป็น** ต้องตั้งค่าก่อนใช้งาน!
