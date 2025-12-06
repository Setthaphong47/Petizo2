# 🐳 Docker Deployment Guide for Petizo

## ข้อมูลการใช้ Memory

### Memory Requirements (Railway 5GB)
```
┌─────────────────────────────────────────┐
│ Component          │ Memory Usage       │
├────────────────────┼────────────────────┤
│ Node.js Server     │ ~200-400 MB        │
│ SQLite Database    │ ~50-100 MB         │
│ Python Runtime     │ ~100-200 MB        │
│ EasyOCR Models     │ ~500-800 MB        │
│ OpenCV/Tesseract   │ ~200-300 MB        │
│ System/Buffer      │ ~500-1000 MB       │
├────────────────────┼────────────────────┤
│ **Total Estimated**│ **~2-3 GB**        │
│ **Available Buffer**│ **2-3 GB**        │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Build Docker Image
```bash
# ใน directory ที่มี Dockerfile
docker build -t petizo:latest .
```

### 2. Test Locally
```bash
# ใช้ docker-compose (แนะนำ)
docker-compose up

# หรือ run ด้วย docker run
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  -e OPENROUTER_API_KEY=your-api-key \
  -v petizo-data:/app/data \
  petizo:latest
```

### 3. Deploy to Railway

#### ขั้นตอนที่ 1: Push Code
```bash
git add .
git commit -m "Add Docker support"
git push origin main
```

#### ขั้นตอนที่ 2: ตั้งค่า Railway
1. ไปที่ Railway Dashboard
2. เลือก Project ของคุณ
3. ไปที่ **Settings** > **Build**
4. เลือก **Docker** (Railway จะใช้ Dockerfile อัตโนมัติ)

#### ขั้นตอนที่ 3: ตั้งค่า Environment Variables
```env
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
OPENROUTER_API_KEY=<your-api-key>
PORT=3000
```

#### ขั้นตอนที่ 4: ตั้งค่า Volume (สำคัญ!)
1. ไปที่ **Data** > **Volumes**
2. สร้าง Volume ใหม่: `/app/data`
3. Volume นี้จะเก็บ:
   - Database (petizo.db)
   - Uploaded images
   - EasyOCR models (cached)

#### ขั้นตอนที่ 5: Deploy
Railway จะ build และ deploy อัตโนมัติ

## 📊 Memory Optimization Tips

### 1. Lazy Loading OCR Models
EasyOCR models จะโหลดเฉพาะเมื่อมีการใช้งาน OCR ครั้งแรก (ใช้ memory ~500-800 MB)

### 2. Cleanup After OCR
ระบบจะลบไฟล์รูปภาพชั่วคราวหลังจาก OCR เสร็จ

### 3. Node.js Memory Limit
ถ้าจำเป็น สามารถจำกัด memory ของ Node.js:
```bash
# ใน Dockerfile CMD
CMD ["node", "--max-old-space-size=1024", "server.js"]
```

### 4. Python Process Timeout
OCR จะ timeout หลัง 30 วินาที เพื่อป้องกัน memory leak

## 🔍 Monitoring

### Check Memory Usage
```bash
# ใน Railway Logs
[Memory Monitor] RSS: 2.34 GB
```

### Health Check
Railway จะเช็คสุขภาพของ server ทุก 30 วินาที:
```
GET / -> Status 200
```

## 🐛 Troubleshooting

### Problem: Out of Memory Error
**Solution 1:** เพิ่ม RAM plan ใน Railway (ถึง 8GB หรือ 16GB)

**Solution 2:** ลด concurrent OCR requests:
```javascript
// เพิ่มใน server.js
let ocrInProgress = 0;
const MAX_OCR_CONCURRENT = 2;

app.post('/api/ocr/scan', authenticateToken, upload.single('image'), async (req, res) => {
    if (ocrInProgress >= MAX_OCR_CONCURRENT) {
        return res.status(429).json({ error: 'OCR service busy, please try again' });
    }
    ocrInProgress++;
    try {
        // ... OCR processing
    } finally {
        ocrInProgress--;
    }
});
```

**Solution 3:** ใช้ External OCR API แทน (OCR.space, Google Vision)

### Problem: Slow Build Time
Docker build ใช้เวลา ~5-10 นาที (ครั้งแรก)
- ครั้งต่อไปจะเร็วขึ้นเพราะใช้ cache

### Problem: EasyOCR Models Download Failed
Models จะดาวน์โหลดครั้งแรกที่รัน OCR (~300MB)
- ใช้ Railway Volume เพื่อ cache models
- ครั้งต่อไปจะใช้ cached version

## 📈 Performance Benchmarks

### OCR Processing Time
- Tesseract Only: ~2-3 seconds
- EasyOCR Only: ~5-8 seconds  
- Hybrid (Both): ~8-12 seconds

### Memory Peaks
- Startup: ~400 MB
- Normal Operation: ~600-800 MB
- During OCR: ~1.5-2.5 GB
- Peak (Multiple OCR): ~3-4 GB

## 🎯 Recommendations

**สำหรับ Railway 5GB RAM:**
✅ ใช้ Docker (Dockerfile ที่ให้ไป)
✅ ใช้ Volume สำหรับ cache
✅ เปิด Memory Monitor
✅ ตั้ง Healthcheck

**ถ้าต้องการประหยัด Memory มากขึ้น:**
- ใช้ Tesseract-only (ไม่ใช้ EasyOCR) -> ประหยัด ~500-800 MB
- ใช้ External OCR API -> ประหยัด ~1-1.5 GB

## 🔗 Useful Commands

```bash
# Build ภาษาไทย
docker build -t petizo:latest .

# Run local test
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Clean up
docker system prune -a
```

## 📞 Support

หากมีปัญหา:
1. เช็ค Railway Logs
2. เช็ค Memory Usage
3. ทดสอบ OCR feature ใน local ก่อน
4. ปรับ timeout หรือ concurrent limits
