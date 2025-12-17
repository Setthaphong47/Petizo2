# แผนการจัดระเบียบไฟล์ Petizo

## โครงสร้างโฟลเดอร์ที่แนะนำ

```
petizo/
├── docs/                           # เอกสารทั้งหมด
│   ├── analytics/                  # เอกสารเกี่ยวกับ Analytics
│   │   ├── ANALYTICS_DASHBOARD_REPORT.md
│   │   └── ANALYTICS_DASHBOARD_SUMMARY.md
│   ├── deployment/                 # เอกสารการ Deploy
│   │   ├── DEPLOYMENT.md
│   │   └── VOLUME-FIX.md
│   ├── setup/                      # เอกสารการติดตั้ง
│   │   ├── OCR-SETUP.md
│   │   └── ENV-VARIABLES.txt
│   └── development/                # เอกสารการพัฒนา
│       └── RESTRUCTURE_PLAN.md
│
├── scripts/                        # Scripts ทั้งหมด
│   ├── migrations/                 # Database migrations
│   ├── setup/                      # Setup scripts
│   ├── utils/                      # Utility scripts
│   ├── maintenance/                # Maintenance scripts (ใหม่)
│   │   └── add-species-column.js
│   └── testing/                    # Test scripts (ใหม่)
│       └── test-stats-api.js
│
├── data/                           # ข้อมูล Database
│   └── petizo.db
│
├── public/                         # Static files
│   ├── icon/
│   ├── images/
│   └── *.html
│
├── ocr_system/                     # OCR System
│
├── node_modules/                   # Dependencies
│
├── server.js                       # Main server file
├── package.json
├── package-lock.json
├── .gitignore
├── .dockerignore
├── .env.example
└── nixpacks.toml
```

## ไฟล์ที่ต้องย้าย

### 1. เอกสาร (Documentation)
-  ANALYTICS_DASHBOARD_REPORT.md → docs/analytics/
-  ANALYTICS_DASHBOARD_SUMMARY.md → docs/analytics/
-  docs/DEPLOYMENT.md → docs/deployment/
-  docs/VOLUME-FIX.md → docs/deployment/
-  docs/OCR-SETUP.md → docs/setup/
-  docs/ENV-VARIABLES.txt → docs/setup/
-  docs/RESTRUCTURE_PLAN.md → docs/development/

### 2. Scripts
-  add-species-column.js → scripts/maintenance/
-  test-stats-api.js → scripts/testing/

### 3. ไฟล์ที่ควรลบ
-  nul (ไฟล์ขยะ)
-  data/petizo.db.backup.* (ย้ายไป backups/ หรือลบ)

## คำสั่งที่ใช้ย้าย

```bash
# สร้างโฟลเดอร์
mkdir -p docs/analytics docs/deployment docs/setup docs/development
mkdir -p scripts/maintenance scripts/testing

# ย้ายเอกสาร Analytics
git mv ANALYTICS_DASHBOARD_REPORT.md docs/analytics/
git mv ANALYTICS_DASHBOARD_SUMMARY.md docs/analytics/

# ย้ายเอกสาร Deployment
git mv docs/DEPLOYMENT.md docs/deployment/
git mv docs/VOLUME-FIX.md docs/deployment/

# ย้ายเอกสาร Setup
git mv docs/OCR-SETUP.md docs/setup/
git mv docs/ENV-VARIABLES.txt docs/setup/

# ย้ายเอกสาร Development
git mv docs/RESTRUCTURE_PLAN.md docs/development/

# ย้าย Scripts
git mv add-species-column.js scripts/maintenance/
git mv test-stats-api.js scripts/testing/

# ลบไฟล์ขยะ
rm -f nul
```
