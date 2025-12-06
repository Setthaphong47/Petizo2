# 🚀 Railway Deployment Guide - Docker Version

## ขั้นตอนการ Deploy แบบละเอียด

### 📋 Checklist ก่อน Deploy

- [ ] มี Railway Account แล้ว
- [ ] มี GitHub Repository พร้อม code
- [ ] ได้ API Keys ที่จำเป็น:
  - JWT_SECRET
  - OPENROUTER_API_KEY (optional - สำหรับ AI Chat)

---

## 🛠️ Step 1: Test Docker ใน Local (แนะนำ)

### 1.1 Build Docker Image
```bash
# ใน directory d:\Code 27-11\petizo 2\
docker build -t petizo:test .
```

### 1.2 Test รัน Container
```bash
# วิธีที่ 1: ใช้ docker-compose (ง่ายที่สุด)
docker-compose up

# วิธีที่ 2: ใช้ docker run
docker run -p 3000:3000 `
  -e JWT_SECRET=test-secret-key `
  -e OPENROUTER_API_KEY=your-key `
  -v petizo-data:/app/data `
  petizo:test
```

### 1.3 ทดสอบ
เปิดเบราว์เซอร์: http://localhost:3000
- ทดสอบ Login
- ทดสอบเพิ่มสัตว์เลี้ยง
- ทดสอบ OCR (ถ้ามีรูป)

### 1.4 Stop Container
```bash
# ถ้าใช้ docker-compose
docker-compose down

# ถ้าใช้ docker run
docker stop <container-id>
```

---

## 🌐 Step 2: Push Code ไป GitHub

```bash
# เช็คสถานะ
git status

# Add ไฟล์ใหม่
git add Dockerfile .dockerignore docker-compose.yml railway.json

# Commit
git commit -m "Add Docker support for Railway deployment"

# Push
git push origin main
```

---

## 🚂 Step 3: Deploy บน Railway

### 3.1 สร้าง Project ใหม่ (ถ้ายังไม่มี)

1. ไปที่ [Railway.app](https://railway.app)
2. Login ด้วย GitHub
3. คลิก **"New Project"**
4. เลือก **"Deploy from GitHub repo"**
5. เลือก repository **Petizo2**

### 3.2 ตั้งค่า Build

Railway จะ auto-detect Dockerfile แต่ให้เช็คว่า:

1. ไปที่ **Settings** → **Build**
2. **Builder**: ต้องเป็น `DOCKERFILE` หรือ `Docker`
3. **Dockerfile Path**: `Dockerfile` (default)

### 3.3 ตั้งค่า Environment Variables

ไปที่ **Variables** → **Raw Editor** → paste:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-ด้วย-openssl-rand-base64-32>
OPENROUTER_API_KEY=<your-api-key-หรือ-ปล่อยว่าง>
```

**วิธีสร้าง JWT_SECRET ที่ปลอดภัย:**
```bash
# Windows PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# หรือใช้เว็บ
# https://generate-secret.vercel.app/32
```

### 3.4 ตั้งค่า Volume (สำคัญมาก!)

Railway Volume จะเก็บ database และ uploaded files

1. ไปที่ **Data** tab
2. คลิก **"+ New Volume"**
3. ตั้งค่า:
   - **Name**: `petizo-data`
   - **Mount Path**: `/app/data`
4. คลิก **"Add"**

### 3.5 ตั้งค่า Networking

1. ไปที่ **Settings** → **Networking**
2. คลิก **"Generate Domain"**
3. จะได้ URL เช่น: `petizo-production.up.railway.app`

### 3.6 Deploy!

1. ไปที่ **Deployments** tab
2. คลิก **"Deploy"** หรือ
3. Railway จะ auto-deploy เมื่อมี commit ใหม่

---

## 📊 Step 4: Monitor Deployment

### 4.1 ดู Build Logs

ใน **Deployments** → คลิกที่ deployment ล่าสุด → ดู **Build Logs**

คาดว่าจะเห็น:
```
Building Dockerfile...
Sending build context...
Step 1/15: FROM node:20-bullseye-slim
Step 2/15: RUN apt-get update...
...
Successfully built <image-id>
```

**Build Time**: ประมาณ 5-10 นาที (ครั้งแรก)

### 4.2 ดู Deploy Logs

คลิกที่ **Deploy Logs** → ดูว่า server start สำเร็จ

คาดว่าจะเห็น:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐾 Petizo Server (Backward Compatible)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 URL: http://localhost:3000
 DB Structure: NEW
 
 💾 Memory Usage:
   RSS: 250.00 MB
   Heap Used: 45.00 MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4.3 ทดสอบ Website

เปิด URL ที่ได้จาก Railway เช่น:
```
https://petizo-production.up.railway.app
```

**ทดสอบ:**
- ✅ หน้าแรกโหลดได้
- ✅ Login ได้ (admin@petizo.com / admin123)
- ✅ เพิ่มสัตว์เลี้ยงได้
- ✅ Upload รูปได้
- ✅ OCR ทำงานได้ (ครั้งแรกอาจช้าเพราะโหลด models)

---

## 🔍 Step 5: Troubleshooting

### Problem 1: Build Failed

**Error**: `apt-get update failed`
```bash
# ลอง build local ก่อน
docker build -t petizo:test .

# ถ้า build ได้ แสดงว่า Dockerfile ถูกต้อง
```

### Problem 2: Container Crashes

ดู Deploy Logs:

**Error**: `JWT_SECRET is required`
→ ไปตั้ง Environment Variables

**Error**: `ENOENT: no such file or directory, open './data/petizo.db'`
→ Volume ยังไม่ได้ mount หรือ path ไม่ถูก

**Error**: `Out of Memory`
→ ปรับ memory limit หรือใช้ Tesseract-only version

### Problem 3: OCR ไม่ทำงาน

**ครั้งแรก:** EasyOCR จะโหลด models (~300MB) ใช้เวลา 30-60 วินาที

ดู logs:
```
[OCR] Processing: vaccine-label.jpg
[OCR] Splitting image...
[HYBRID] Running Hybrid OCR...
```

**ถ้ายังไม่ได้:** ลอง deploy อีกครั้ง หรือเช็ค Python path

### Problem 4: Images/Database หายหลัง Redeploy

→ **Volume ไม่ได้ mount!** ต้องไปตั้งค่า Volume (Step 3.4)

---

## 📈 Step 6: Monitor Production

### 6.1 Memory Usage

ดูใน **Metrics** tab:
- **Startup**: ~400 MB
- **Normal**: ~600-800 MB
- **During OCR**: ~1.5-2.5 GB
- **Max**: ไม่เกิน 4 GB

### 6.2 Auto-scaling

Railway จะ auto-restart ถ้า:
- Memory เกิน limit
- Container crash
- Health check fail

### 6.3 Logs

เช็ค logs เป็นประจำ:
```bash
# ใน Railway Dashboard → View Logs
[Memory Monitor] RSS: 2.34 GB
[OCR] Scan completed in 8.5s
```

---

## 🎯 Best Practices

### ✅ ควรทำ

1. **Backup Database เป็นประจำ**
   - Download `petizo.db` จาก Volume
   - หรือใช้ script auto-backup

2. **Monitor Memory**
   - เช็คว่าไม่เกิน 4GB
   - ถ้าเกินบ่อย → upgrade plan

3. **Set Health Check**
   - Railway จะ ping ทุก 30 วินาที
   - ถ้า fail 3 ครั้ง จะ restart

4. **Enable Auto-deploy**
   - Push code → auto deploy
   - ไม่ต้อง deploy manual

### ❌ ไม่ควรทำ

1. ❌ Hard-code secrets ใน code
2. ❌ Commit .env file
3. ❌ ใช้ JWT_SECRET แบบ default
4. ❌ เปิด CORS สำหรับทุก origin

---

## 🔄 Update/Redeploy

### วิธีที่ 1: Git Push (Auto)
```bash
# แก้โค้ด
git add .
git commit -m "Update feature X"
git push origin main

# Railway จะ auto-deploy
```

### วิธีที่ 2: Manual Deploy
1. ไปที่ Railway Dashboard
2. **Deployments** → **Deploy**

---

## 💰 Railway Pricing (2025)

- **Hobby Plan**: $5/month
  - 500 hours/month
  - 8GB RAM
  - 100GB bandwidth
  
- **Pro Plan**: $20/month
  - Unlimited hours
  - 32GB RAM
  - Unlimited bandwidth

**สำหรับคุณ (5GB RAM):**
- ✅ ใช้ Hobby Plan ได้
- ✅ Memory เพียงพอมาก (ใช้แค่ 2-3GB)

---

## 📞 Support

### Official Docs
- Railway: https://docs.railway.app
- Docker: https://docs.docker.com

### หากมีปัญหา
1. เช็ค Railway Logs
2. ลอง build local
3. เช็ค Environment Variables
4. เช็ค Volume mount

### Contact
- Railway Discord: https://discord.gg/railway
- GitHub Issues: [Your Repo]

---

## ✅ Checklist หลัง Deploy

- [ ] Website เปิดได้
- [ ] Login ทำงาน
- [ ] Database persist (ลอง restart แล้วข้อมูลยังอยู่)
- [ ] Upload รูปได้
- [ ] OCR ทำงาน (ลองสแกนฉลาก)
- [ ] AI Chat ทำงาน (ถ้าใช้)
- [ ] Memory usage ปกติ (<4GB)
- [ ] ตั้ง custom domain (optional)
- [ ] Setup backup (แนะนำ)

---

## 🎉 เสร็จแล้ว!

ตอนนี้ Petizo ของคุณรันบน Railway ด้วย Docker แล้ว! 🐾

**Next Steps:**
- เพิ่ม features ใหม่
- ปรับปรุง UI/UX
- เพิ่ม tests
- Setup monitoring (Sentry, LogRocket)
