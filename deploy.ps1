# ====================================
# 🚀 Railway Deployment Script
# ====================================
# Script นี้จะช่วยคุณ test และ deploy ไปยัง Railway

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🐾 Petizo - Railway Deployment Helper" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# ตรวจสอบว่ามี Docker ไหม
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker not found! Please install Docker Desktop" -ForegroundColor Red
    Write-Host "   Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker is installed`n" -ForegroundColor Green

# ตรวจสอบว่า Docker daemon รันอยู่ไหม
Write-Host "🔍 Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker daemon is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# ตัวเลือก
Write-Host "What would you like to do?`n" -ForegroundColor Cyan
Write-Host "  1) 🐳 Build Docker image" -ForegroundColor White
Write-Host "  2) 🧪 Test locally (docker-compose)" -ForegroundColor White
Write-Host "  3) 🧹 Clean up Docker resources" -ForegroundColor White
Write-Host "  4) 📦 Prepare for Railway deployment" -ForegroundColor White
Write-Host "  5) 🚀 Full workflow (Build + Test + Prepare)" -ForegroundColor White
Write-Host "  6) ❌ Exit`n" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host "`n🐳 Building Docker image..." -ForegroundColor Cyan
        docker build -t petizo:latest .
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Build successful!" -ForegroundColor Green
            Write-Host "   Image: petizo:latest" -ForegroundColor White
            Write-Host "`n💡 Next: Run 'docker-compose up' to test" -ForegroundColor Yellow
        } else {
            Write-Host "`n❌ Build failed! Check logs above" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host "`n🧪 Starting containers..." -ForegroundColor Cyan
        Write-Host "   This will build (if needed) and start the server" -ForegroundColor Gray
        Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Gray
        
        docker-compose up
    }
    
    "3" {
        Write-Host "`n🧹 Cleaning up Docker resources..." -ForegroundColor Cyan
        
        Write-Host "   Stopping containers..." -ForegroundColor Gray
        docker-compose down
        
        Write-Host "   Removing unused images..." -ForegroundColor Gray
        docker image prune -f
        
        Write-Host "   Removing unused volumes..." -ForegroundColor Gray
        docker volume prune -f
        
        Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
    }
    
    "4" {
        Write-Host "`n📦 Preparing for Railway deployment...`n" -ForegroundColor Cyan
        
        # Check ไฟล์สำคัญ
        $files = @(
            "Dockerfile",
            ".dockerignore",
            "railway.json"
        )
        
        $allExist = $true
        foreach ($file in $files) {
            if (Test-Path $file) {
                Write-Host "   ✅ $file" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $file - Not found!" -ForegroundColor Red
                $allExist = $false
            }
        }
        
        if ($allExist) {
            Write-Host "`n✅ All required files are ready!" -ForegroundColor Green
            Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
            Write-Host "   1. Commit and push to GitHub:" -ForegroundColor White
            Write-Host "      git add ." -ForegroundColor Gray
            Write-Host "      git commit -m 'Add Docker support'" -ForegroundColor Gray
            Write-Host "      git push origin main" -ForegroundColor Gray
            Write-Host "`n   2. Go to Railway Dashboard:" -ForegroundColor White
            Write-Host "      - New Project → Deploy from GitHub" -ForegroundColor Gray
            Write-Host "      - Select your repository" -ForegroundColor Gray
            Write-Host "      - Add Environment Variables (JWT_SECRET, etc.)" -ForegroundColor Gray
            Write-Host "      - Create Volume: /app/data" -ForegroundColor Gray
            Write-Host "      - Deploy!" -ForegroundColor Gray
            Write-Host "`n   📖 See DEPLOY_RAILWAY.md for detailed guide" -ForegroundColor Yellow
        } else {
            Write-Host "`n❌ Some files are missing!" -ForegroundColor Red
        }
    }
    
    "5" {
        Write-Host "`n🚀 Running full workflow...`n" -ForegroundColor Cyan
        
        # Step 1: Build
        Write-Host "Step 1/3: Building Docker image..." -ForegroundColor Yellow
        docker build -t petizo:latest .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n❌ Build failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Build successful!`n" -ForegroundColor Green
        
        # Step 2: Test
        Write-Host "Step 2/3: Testing container..." -ForegroundColor Yellow
        Write-Host "   Starting server (will run for 10 seconds)..." -ForegroundColor Gray
        
        $job = Start-Job -ScriptBlock { docker-compose up }
        Start-Sleep -Seconds 10
        
        # Check if container is running
        $running = docker ps --filter "name=petizo" --format "{{.Names}}"
        if ($running) {
            Write-Host "✅ Container is running!`n" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Container may have issues`n" -ForegroundColor Yellow
        }
        
        # Stop test
        docker-compose down | Out-Null
        Stop-Job $job | Out-Null
        Remove-Job $job | Out-Null
        
        # Step 3: Prepare
        Write-Host "Step 3/3: Checking deployment files..." -ForegroundColor Yellow
        
        $files = @("Dockerfile", ".dockerignore", "railway.json")
        $allExist = $true
        foreach ($file in $files) {
            if (Test-Path $file) {
                Write-Host "   ✅ $file" -ForegroundColor Green
            } else {
                Write-Host "   ❌ $file" -ForegroundColor Red
                $allExist = $false
            }
        }
        
        if ($allExist) {
            Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
            Write-Host "🎉 Everything is ready for Railway!" -ForegroundColor Green
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
            
            Write-Host "📦 Git Commit & Push:" -ForegroundColor Cyan
            Write-Host "   git add ." -ForegroundColor White
            Write-Host "   git commit -m 'Add Docker support for Railway'" -ForegroundColor White
            Write-Host "   git push origin main`n" -ForegroundColor White
            
            Write-Host "🚂 Railway Deployment:" -ForegroundColor Cyan
            Write-Host "   1. Go to https://railway.app" -ForegroundColor White
            Write-Host "   2. New Project → Deploy from GitHub" -ForegroundColor White
            Write-Host "   3. Select Petizo2 repository" -ForegroundColor White
            Write-Host "   4. Railway will auto-detect Dockerfile" -ForegroundColor White
            Write-Host "   5. Add Environment Variables" -ForegroundColor White
            Write-Host "   6. Create Volume: /app/data" -ForegroundColor White
            Write-Host "   7. Deploy!`n" -ForegroundColor White
            
            Write-Host "📖 Full guide: DEPLOY_RAILWAY.md`n" -ForegroundColor Yellow
        }
    }
    
    "6" {
        Write-Host "`nBye! 👋`n" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host "`n❌ Invalid choice!`n" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
