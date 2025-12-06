# ====================================
# 🔍 Railway Health Check Script
# ====================================
# ใช้เช็คว่าทุกอย่างพร้อม deploy หรือยัง

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🏥 Petizo - System Health Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$score = 0
$total = 0

# ====================================
# 1. Check Files
# ====================================
Write-Host "📁 Checking Required Files..." -ForegroundColor Yellow
$requiredFiles = @(
    @{Path="Dockerfile"; Name="Dockerfile"},
    @{Path=".dockerignore"; Name=".dockerignore"},
    @{Path="docker-compose.yml"; Name="Docker Compose"},
    @{Path="railway.json"; Name="Railway Config"},
    @{Path="petizo/package.json"; Name="Package.json"},
    @{Path="petizo/server.js"; Name="Server.js"},
    @{Path="petizo/ocr_system/scan.py"; Name="OCR Script"},
    @{Path="petizo/ocr_system/requirements.txt"; Name="Python Requirements"}
)

foreach ($file in $requiredFiles) {
    $total++
    if (Test-Path $file.Path) {
        Write-Host "   ✅ $($file.Name)" -ForegroundColor Green
        $score++
    } else {
        Write-Host "   ❌ $($file.Name) - Missing!" -ForegroundColor Red
    }
}

Write-Host ""

# ====================================
# 2. Check Docker
# ====================================
Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
$total++
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    Write-Host "   ✅ Docker is installed" -ForegroundColor Green
    $score++
    
    $total++
    try {
        docker ps | Out-Null
        Write-Host "   ✅ Docker daemon is running" -ForegroundColor Green
        $score++
    } catch {
        Write-Host "   ❌ Docker daemon is not running" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Docker not found" -ForegroundColor Red
    Write-Host "      Install: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
}

Write-Host ""

# ====================================
# 3. Check Git
# ====================================
Write-Host "📦 Checking Git..." -ForegroundColor Yellow
$total++
$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if ($gitInstalled) {
    Write-Host "   ✅ Git is installed" -ForegroundColor Green
    $score++
    
    # Check git status
    try {
        $status = git status 2>&1
        if ($status -match "nothing to commit") {
            Write-Host "   ℹ️  Working directory clean" -ForegroundColor Cyan
        } elseif ($status -match "Changes not staged") {
            Write-Host "   ⚠️  You have uncommitted changes" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠️  Not a git repository" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Git not found" -ForegroundColor Red
}

Write-Host ""

# ====================================
# 4. Check Environment Variables
# ====================================
Write-Host "🔐 Checking Environment Config..." -ForegroundColor Yellow

$total++
if (Test-Path "petizo/.env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
    $score++
    
    # Check important vars
    $envContent = Get-Content "petizo/.env" -Raw
    
    if ($envContent -match "JWT_SECRET=(?!your-secret-key)") {
        Write-Host "   ✅ JWT_SECRET is set" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  JWT_SECRET needs to be changed" -ForegroundColor Yellow
    }
    
    if ($envContent -match "OPENROUTER_API_KEY=.+") {
        Write-Host "   ✅ OPENROUTER_API_KEY is set" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  OPENROUTER_API_KEY not set (AI Chat disabled)" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  .env file not found (will use defaults)" -ForegroundColor Yellow
    Write-Host "      Copy from: petizo/.env.example" -ForegroundColor Gray
}

Write-Host ""

# ====================================
# 5. Check Node.js Dependencies
# ====================================
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
$total++
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js $nodeVersion" -ForegroundColor Green
    $score++
    
    if (Test-Path "petizo/node_modules") {
        Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Dependencies not installed" -ForegroundColor Yellow
        Write-Host "      Run: cd petizo && npm install" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Node.js not found" -ForegroundColor Red
}

Write-Host ""

# ====================================
# 6. Check Python (for OCR)
# ====================================
Write-Host "🐍 Checking Python..." -ForegroundColor Yellow
$total++
$pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonInstalled) {
    $pythonInstalled = Get-Command python3 -ErrorAction SilentlyContinue
}

if ($pythonInstalled) {
    $pythonVersion = python --version 2>&1
    Write-Host "   ✅ $pythonVersion" -ForegroundColor Green
    $score++
    Write-Host "   ℹ️  OCR will use Docker's Python (recommended)" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  Python not found locally" -ForegroundColor Yellow
    Write-Host "      OCR will use Docker's Python (this is fine)" -ForegroundColor Gray
}

Write-Host ""

# ====================================
# 7. Check Database
# ====================================
Write-Host "💾 Checking Database..." -ForegroundColor Yellow
if (Test-Path "petizo/data/petizo.db") {
    $dbSize = (Get-Item "petizo/data/petizo.db").Length / 1KB
    Write-Host "   ✅ Database exists ($([math]::Round($dbSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Database not initialized" -ForegroundColor Cyan
    Write-Host "      Will be created on first run" -ForegroundColor Gray
}

Write-Host ""

# ====================================
# 8. Check Railway CLI (optional)
# ====================================
Write-Host "🚂 Checking Railway CLI (optional)..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if ($railwayInstalled) {
    Write-Host "   ✅ Railway CLI installed" -ForegroundColor Green
    Write-Host "      You can use: railway up" -ForegroundColor Gray
} else {
    Write-Host "   ℹ️  Railway CLI not installed (optional)" -ForegroundColor Cyan
    Write-Host "      Install: npm i -g @railway/cli" -ForegroundColor Gray
}

Write-Host ""

# ====================================
# Score & Recommendations
# ====================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
$percentage = [math]::Round(($score / $total) * 100)

if ($percentage -ge 90) {
    Write-Host "🎉 Health Score: $score/$total ($percentage%)" -ForegroundColor Green
    Write-Host "✅ System is ready for deployment!" -ForegroundColor Green
} elseif ($percentage -ge 70) {
    Write-Host "⚠️  Health Score: $score/$total ($percentage%)" -ForegroundColor Yellow
    Write-Host "⚠️  Some issues detected, but deployment is possible" -ForegroundColor Yellow
} else {
    Write-Host "❌ Health Score: $score/$total ($percentage%)" -ForegroundColor Red
    Write-Host "❌ Please fix critical issues before deployment" -ForegroundColor Red
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# ====================================
# Next Steps
# ====================================
if ($percentage -ge 70) {
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "1️⃣  Test Docker Build:" -ForegroundColor White
    Write-Host "   .\deploy.ps1" -ForegroundColor Gray
    Write-Host "   Select option 1 (Build Docker image)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "2️⃣  Test Locally:" -ForegroundColor White
    Write-Host "   docker-compose up" -ForegroundColor Gray
    Write-Host "   Visit: http://localhost:3000" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "3️⃣  Deploy to Railway:" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m 'Add Docker support'" -ForegroundColor Gray
    Write-Host "   git push origin main" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📖 Full guide: DEPLOY_RAILWAY.md" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Please fix the issues above first" -ForegroundColor Yellow
}

Write-Host ""
