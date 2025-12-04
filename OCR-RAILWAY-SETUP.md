# คำแนะนำการตั้งค่า OCR บน Railway

## ขั้นตอนการ Deploy

### 1. ตั้งค่า Environment Variables บน Railway Dashboard

ไปที่ Railway Dashboard → เลือก Service → Variables → เพิ่มตัวแปรต่อไปนี้:

```
EASYOCR_MODULE_PATH=/app/petizo/data/easyocr_models
OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
PYTHONUNBUFFERED=1
```

### 2. ใช้ Volume เดิมที่มีอยู่แล้ว

คุณมี Volume อยู่แล้วที่ mount อยู่ที่ `/app/petizo/data` สำหรับเก็บ database และรูปภาพ

**ไม่ต้องสร้าง Volume ใหม่!** ระบบจะสร้างโฟลเดอร์ย่อย `/app/petizo/data/easyocr_models` อัตโนมัติ
เพื่อเก็บ EasyOCR models ใน Volume เดิม

### 3. เพิ่มขนาด Volume (ถ้าจำเป็น)

Volume ปัจจุบันของคุณมีขนาด **500 MB**

EasyOCR models ต้องการพื้นที่ประมาณ **100-200 MB**

**แนะนำ:** กด **Grow** เพื่อเพิ่มขนาด Volume เป็น **1-2 GB** เพื่อให้มีพื้นที่เพียงพอสำหรับ:
- Database (petizo.db)
- รูปภาพที่อัปโหลด (uploads/)
- EasyOCR models (easyocr_models/)

### 4. ตรวจสอบการตั้งค่า Memory

ระบบ OCR (โดยเฉพาะ EasyOCR) ต้องใช้ memory สูง:

1. ไปที่ Railway Dashboard → Service → Settings
2. ตรวจสอบว่า Memory Limit อย่างน้อย **1GB** (แนะนำ 2GB)

### 5. Deploy

```bash
git add .
git commit -m "Setup OCR with EasyOCR and Tesseract support"
git push origin main
```

Railway จะ auto-deploy และติดตั้ง dependencies ต่อไปนี้:

- **Python 3.9**
- **Tesseract OCR**
- **OpenCV** (opencv-python)
- **EasyOCR**
- **NumPy**
- **Pillow**
- **pytesseract**

### 5. ตรวจสอบ Logs

หลังจาก deploy เสร็จ ให้เช็ค Railway Logs:

```
[EasyOCR] Model storage directory: /app/petizo/data/easyocr_models
[EasyOCR] Reader initialized successfully
```

ถ้าเห็นข้อความนี้แสดงว่า OCR พร้อมใช้งาน

### 6. ทดสอบระบบ OCR

1. เข้าหน้า Vaccination Record
2. อัปโหลดรูปฉลากวัคซีน
3. กดปุ่ม "สแกนฉลากอัตโนมัติ"
4. ตรวจสอบว่าข้อมูลถูก auto-fill

## การแก้ปัญหา

### ถ้า EasyOCR ดาวน์โหลด models ทุกครั้ง
- ตรวจสอบว่า Volume mount อยู่ที่ `/app/petizo/data` ถูกต้อง
- ตรวจสอบว่า Environment Variable `EASYOCR_MODULE_PATH=/app/petizo/data/easyocr_models` ตั้งค่าถูกต้อง
- ตรวจสอบว่า Volume มีพื้นที่เพียงพอ (แนะนำ 1-2 GB)

### ถ้า Python script ล้มเหลว
- ตรวจสอบ Railway Logs หา error message
- ตรวจสอบว่า `python3` command พร้อมใช้งาน
- ตรวจสอบว่า Memory เพียงพอ (อย่างน้อย 1GB)

### ถ้า Build ใช้เวลานาน
- การติดตั้ง EasyOCR ครั้งแรกใช้เวลา 5-10 นาที (ปกติ)
- EasyOCR ต้องดาวน์โหลด models ประมาณ 100-200MB

### ถ้า Memory เกิน
- ลด Image size ก่อนส่งให้ OCR
- ปรับ Scale factor ในไฟล์ `preprocessing.py`

## ข้อมูล Dependencies

### Python Packages
- `opencv-python>=4.8.0` (~90MB)
- `easyocr>=1.7.0` (~400MB รวม models)
- `pytesseract>=0.3.10`
- `numpy>=1.24.0`
- `Pillow>=10.0.0`

### System Packages
- Tesseract OCR
- OpenGL libraries (libgl1-mesa-glx)
- GLib libraries (libglib2.0-0)

## หมายเหตุ

- ครั้งแรกที่รัน EasyOCR จะดาวน์โหลด models อัตโนมัติ
- Models จะถูกเก็บใน Volume (ถ้าตั้งค่าไว้)
- OCR จะใช้เวลาประมาณ 3-5 วินาทีต่อการสแกน 1 รูป
