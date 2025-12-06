# 🐾 Petizo - Pet Management System

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

## 📋 Overview

Petizo เป็นระบบจัดการสัตว์เลี้ยงแบบครบวงจร พร้อมฟีเจอร์:
- 🐕 จัดการข้อมูลสัตว์เลี้ยง
- 💉 ติดตามตารางวัคซีน
- 📸 OCR สแกนฉลากวัคซีน (Tesseract + EasyOCR)
- 🤖 AI Chatbot สำหรับคำปรึกษา
- 📝 ระบบบล็อก
- 👥 จัดการผู้ใช้ (Admin/Member)

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (แนะนำ)
- หรือ Node.js 18+ & Python 3.9+

### 1. Clone Repository
```bash
git clone https://github.com/Setthaphong47/Petizo2.git
cd Petizo2
```

### 2. Setup Environment Variables
```bash
cp petizo/.env.example petizo/.env
# แก้ไข JWT_SECRET และ OPENROUTER_API_KEY
```

### 3. Run with Docker (แนะนำ)
```bash
# Build และ run
docker-compose up

# เปิดเบราว์เซอร์
http://localhost:3000
```

### 4. หรือ Run แบบปกติ
```bash
cd petizo
npm install
node scripts/setup/init-database.js
npm start
```

## 🔐 Default Login

### Admin
- Email: `admin@petizo.com`
- Password: `admin123`

### Member
- Email: `user@petizo.com`
- Password: `user123`

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t petizo:latest .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -v petizo-data:/app/data \
  petizo:latest
```

### Docker Compose
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f
```

## 🚂 Deploy to Railway

### Quick Deploy
1. Fork this repository
2. Go to [Railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Select this repository
5. Add Environment Variables:
   ```
   JWT_SECRET=<random-secret>
   OPENROUTER_API_KEY=<optional>
   ```
6. Create Volume: `/app/data`
7. Deploy!

### Detailed Guide
See [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)

### Deployment Helper Script
```bash
# Windows PowerShell
.\deploy.ps1

# Linux/Mac
chmod +x deploy.sh
./deploy.sh
```

## 📊 System Requirements

### Production (Railway)
- **RAM**: 2-3 GB (แนะนำ 5GB)
- **Storage**: 1-2 GB (for database & uploads)
- **CPU**: 1-2 cores

### OCR Feature
- **Memory**: +500-800 MB (EasyOCR models)
- **First load**: 30-60 seconds (download models)
- **Subsequent**: Cached in volume

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT Authentication
- Multer (file uploads)

### OCR System
- Python 3.9+
- Tesseract OCR
- EasyOCR
- OpenCV

### Frontend
- Vanilla JavaScript
- HTML5/CSS3
- Responsive Design

### AI
- OpenRouter API (GPT-4)
- AI Chat for pet care advice

## 📁 Project Structure

```
petizo/
├── server.js              # Main Express server
├── package.json
├── data/
│   ├── petizo.db         # SQLite database
│   └── uploads/          # User uploads
├── ocr_system/           # Python OCR scripts
│   ├── scan.py
│   ├── ocr_engines.py
│   └── data_extraction.py
├── public/               # Frontend
│   ├── index.html
│   ├── admin.html
│   └── js/
└── scripts/              # Database scripts
    ├── setup/
    └── migrations/
```

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=<generate-secure-key>

# AI Chat (Optional)
OPENROUTER_API_KEY=<your-key>
MODEL_NAME=openai/gpt-4o-mini

# Database (auto)
# SQLite database at ./data/petizo.db
```

### Generate Secure JWT_SECRET
```bash
# PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Linux/Mac
openssl rand -base64 32
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Pets
- `GET /api/pets` - List pets
- `POST /api/pets` - Create pet
- `PUT /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet

### Vaccinations
- `GET /api/pets/:id/vaccinations` - List vaccinations
- `POST /api/pets/:id/vaccinations` - Add vaccination
- `GET /api/pets/:id/recommended-vaccines` - Get recommendations

### OCR
- `POST /api/ocr/scan` - Scan vaccine label

### Blog
- `GET /api/blog` - Public blogs
- `GET /api/blog/:slug` - Blog detail

### Admin
- `GET /api/admin/users` - List users
- `GET /api/admin/dashboard/stats` - Statistics
- See server.js for more endpoints

## 🧪 Testing

### Test Docker Build
```bash
docker build -t petizo:test .
```

### Test Container
```bash
docker run -p 3000:3000 petizo:test
```

### Test OCR (requires image)
```bash
curl -X POST http://localhost:3000/api/ocr/scan \
  -H "Authorization: Bearer <token>" \
  -F "image=@vaccine-label.jpg"
```

## 📈 Performance

### Memory Usage
- Startup: ~400 MB
- Normal: ~600-800 MB
- During OCR: ~1.5-2.5 GB
- Peak: ~3-4 GB

### Response Times
- Static pages: <100ms
- API calls: 50-200ms
- OCR scan: 8-12 seconds

## 🔒 Security

### Implemented
- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ SQL injection protection (parameterized queries)
- ✅ File upload validation
- ✅ CORS configuration

### Recommended
- Add rate limiting
- Enable HTTPS
- Use helmet middleware
- Add input validation (joi/express-validator)
- Setup CSP headers

## 🐛 Troubleshooting

### Docker Build Fails
```bash
# Check Docker daemon
docker ps

# Rebuild without cache
docker build --no-cache -t petizo:latest .
```

### Out of Memory
```bash
# Check memory usage
docker stats

# Increase memory limit
docker-compose.yml:
  mem_limit: 8g
```

### OCR Not Working
```bash
# Check Python
docker exec -it petizo python3 --version

# Check logs
docker-compose logs -f

# Test Python script
docker exec -it petizo python3 ocr_system/scan.py test.jpg
```

### Database Issues
```bash
# Check database file
ls -lh data/petizo.db

# Reinitialize database
node scripts/setup/init-database.js
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- [@Setthaphong47](https://github.com/Setthaphong47)

## 🙏 Acknowledgments

- Tesseract OCR
- EasyOCR
- Railway.app
- OpenRouter API

## 📞 Support

- Issues: [GitHub Issues](https://github.com/Setthaphong47/Petizo2/issues)
- Email: [Your Email]
- Discord: [Your Discord]

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Appointment booking system
- [ ] Veterinary clinic integration
- [ ] Pet social network
- [ ] Reminders via LINE/Email
- [ ] Export to PDF

## ⭐ Star History

If you find this project useful, please star it! ⭐

---

Made with ❤️ for pet lovers 🐾
