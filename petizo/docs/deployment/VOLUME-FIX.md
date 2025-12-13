# แก้ไขปัญหารูปภาพหายใน Railway

## ปัญหา
รูปภาพสัตว์เลี้ยงและบล็อกหายทุกครั้งที่ Railway redeploy หรือ restart

## สาเหตุ
Railway ใช้ ephemeral file system (ไฟล์ชั่วคราว) ทำให้ไฟล์ที่ upload จะหายเมื่อ container restart

## วิธีแก้ไข

### ขั้นตอนที่ 1: เพิ่ม Volume ใน Railway

1. เข้า Railway Dashboard → เลือกโปรเจค Petizo
2. ไปที่ **Settings** → **Volumes**
3. คลิก **"New Volume"** หรือ **"Add Volume"**
4. กรอกข้อมูลดังนี้:

```
Volume Name: petizo-data
Mount Path: /app/petizo/data
```

5. คลิก **"Add"** หรือ **"Create Volume"**
6. รอให้ Railway redeploy อัตโนมัติ

### ขั้นตอนที่ 2: ตรวจสอบว่า Volume ทำงาน

หลัง redeploy เสร็จ:

1. ไปที่ **Deployments** → เลือก deployment ล่าสุด
2. เปิด **Logs** และดูว่ามีข้อความ:
   ```
   เชื่อมต่อ database สำเร็จ
   สร้าง data/uploads folder เรียบร้อย
   ```

3. ลองอัปโหลดรูปภาพสัตว์เลี้ยงใหม่
4. ไปที่ Railway Dashboard → **Settings** → คลิก **"Restart"**
5. รอ restart เสร็จ แล้วเช็ครูปภาพ → **ต้องไม่หาย**

### ขั้นตอนที่ 3: Upload รูปเก่ากลับขึ้นไป (ถ้ามี)

ถ้ามีรูปเก่าที่หาย และมี backup:

1. ดาวน์โหลด database จาก Railway:
   ```bash
   railway run node petizo/download-db.js
   ```

2. เอารูปเก่าจาก `petizo/data/uploads/` ใส่กลับใน local database

3. Upload database และรูปกลับขึ้น Railway ผ่าน Volume

## หมายเหตุสำคัญ

### Mount Path ที่ถูกต้อง
- `/app/petizo/data` - **ถูกต้อง** เก็บทั้ง database และ uploads
- `/app/data` - ผิด! ไม่ตรงกับโครงสร้างโฟลเดอร์
- `/app/uploads` - ผิด! จะเก็บแค่ uploads เท่านั้น

### ข้อมูลที่เก็บใน Volume
ข้อมูลใน `/app/petizo/data` ประกอบด้วย:
```
data/
├── petizo.db          # SQLite database
└── uploads/           # รูปภาพทั้งหมด
    ├── photo-*.jpg
    ├── proof-*.jpg
    └── blog-*.jpg
```

### Volume Size
- Railway Free tier: 1 GB Volume ฟรี
- ถ้าเต็ม: $5/month ต่อ 1 GB เพิ่มเติม

### เช็ค Volume Usage
ไปที่ Railway Dashboard → Settings → Volumes → ดูใช้ไปเท่าไหร่

## ถ้ายังเจอปัญหา

### กรณีรูปยังหาย
1. เช็คว่า Mount Path เป็น `/app/petizo/data` (ไม่ใช่ path อื่น)
2. ลองลบ Volume แล้วสร้างใหม่
3. Redeploy โปรเจค
4. Upload รูปทดสอบใหม่

### กรณี Database หาย
- Mount Path ต้องเป็น `/app/petizo/data` เท่านั้น
- ถ้าใช้ `/app/petizo/data/uploads` จะเก็บแค่รูป database จะหาย

### ตรวจสอบ Logs
```bash
# ใน Railway Logs ต้องเห็น
 เชื่อมต่อ database สำเร็จ
 สร้าง data/uploads folder เรียบร้อย

# ถ้าเห็น error เหล่านี้ = Volume ไม่ work
 SQLITE_CANTOPEN
 ENOENT: no such file or directory
```

## อ้างอิง
- Railway Volumes: https://docs.railway.app/reference/volumes
- Petizo Deploy Guide: [RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md)
