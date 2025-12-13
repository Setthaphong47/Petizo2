# 📚 Petizo Documentation

คู่มือเอกสารทั้งหมดของโครงการ Petizo

---

## 📁 โครงสร้างเอกสาร

### 📊 [analytics/](analytics/)
เอกสารเกี่ยวกับ Analytics Dashboard และการวิเคราะห์ข้อมูล

- **[ANALYTICS_DASHBOARD_REPORT.md](analytics/ANALYTICS_DASHBOARD_REPORT.md)** (913 บรรทัด)
  - เอกสารฉบับสมบูรณ์
  - รายละเอียด SQL queries, API endpoints, code examples
  - Performance optimization, Security considerations

- **[ANALYTICS_DASHBOARD_SUMMARY.md](analytics/ANALYTICS_DASHBOARD_SUMMARY.md)** (150 บรรทัด)
  - สรุปแบบย่อ
  - เหมาะสำหรับอ้างอิงด่วน

### 🚀 [deployment/](deployment/)
เอกสารเกี่ยวกับการ Deploy และ Infrastructure

- **[DEPLOYMENT.md](deployment/DEPLOYMENT.md)**
  - วิธีการ Deploy ไปยัง Railway
  - การตั้งค่า Environment Variables
  - Troubleshooting

- **[VOLUME-FIX.md](deployment/VOLUME-FIX.md)**
  - แก้ปัญหา Volume และ Database persistence

### ⚙️ [setup/](setup/)
เอกสารการติดตั้งและ Configuration

- **[OCR-SETUP.md](setup/OCR-SETUP.md)**
  - การติดตั้ง OCR System
  - Dependencies และ Libraries

- **[ENV-VARIABLES.txt](setup/ENV-VARIABLES.txt)**
  - รายการ Environment Variables ที่ใช้

### 💻 [development/](development/)
เอกสารสำหรับ Developer

- **[RESTRUCTURE_PLAN.md](development/RESTRUCTURE_PLAN.md)**
  - แผนการปรับโครงสร้างโปรเจค
  - Database schema changes

### 🗂️ [FILE_ORGANIZATION_PLAN.md](FILE_ORGANIZATION_PLAN.md)
- โครงสร้างไฟล์และโฟลเดอร์
- แผนการจัดระเบียบโปรเจค

---

## 🔍 Quick Reference

### สำหรับ Developer
- เริ่มต้นพัฒนา → [setup/OCR-SETUP.md](setup/OCR-SETUP.md)
- ทำความเข้าใจ Analytics → [analytics/ANALYTICS_DASHBOARD_SUMMARY.md](analytics/ANALYTICS_DASHBOARD_SUMMARY.md)
- ศึกษาโครงสร้างโปรเจค → [FILE_ORGANIZATION_PLAN.md](FILE_ORGANIZATION_PLAN.md)

### สำหรับ DevOps
- Deploy โปรเจค → [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)
- แก้ปัญหา Database → [deployment/VOLUME-FIX.md](deployment/VOLUME-FIX.md)
- ตั้งค่า Environment → [setup/ENV-VARIABLES.txt](setup/ENV-VARIABLES.txt)

### สำหรับเขียนรายงาน
- Analytics Dashboard Report → [analytics/ANALYTICS_DASHBOARD_REPORT.md](analytics/ANALYTICS_DASHBOARD_REPORT.md)
- สรุปฟีเจอร์ที่เพิ่ม → [analytics/ANALYTICS_DASHBOARD_SUMMARY.md](analytics/ANALYTICS_DASHBOARD_SUMMARY.md)

---

## 📝 การอัปเดตเอกสาร

เมื่อเพิ่มเอกสารใหม่ กรุณาอัปเดต README.md นี้ด้วย

**โครงสร้างที่แนะนำ:**
```
docs/
├── analytics/          # Analytics & Data Analysis
├── deployment/         # Deployment & Infrastructure
├── setup/             # Installation & Configuration
├── development/       # Development & Architecture
└── README.md          # This file
```

---

**Last Updated:** ธันวาคม 2567
