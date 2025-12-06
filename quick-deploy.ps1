# 🚀 Quick Deploy to Railway (No Docker Required)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚂 Quick Deploy to Railway" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "This will prepare and push your code to Railway" -ForegroundColor White
Write-Host "Railway will build Docker image on their servers`n" -ForegroundColor Gray

# Check git status
Write-Host "📋 Step 1: Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --short

if ($gitStatus) {
    Write-Host "   📝 You have uncommitted changes:" -ForegroundColor White
    git status --short | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    Write-Host ""
    
    $commitMsg = Read-Host "   Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) {
        $commitMsg = "Add Docker support for Railway deployment"
    }
    
    Write-Host "`n   📦 Staging files..." -ForegroundColor Cyan
    git add .
    
    Write-Host "   💾 Committing..." -ForegroundColor Cyan
    git commit -m $commitMsg
    
    Write-Host "   ✅ Changes committed!`n" -ForegroundColor Green
} else {
    Write-Host "   ✅ Working directory is clean`n" -ForegroundColor Green
}

# Push to GitHub
Write-Host "📋 Step 2: Pushing to GitHub..." -ForegroundColor Yellow
$pushConfirm = Read-Host "   Push to GitHub now? (y/n)"

if ($pushConfirm -eq 'y') {
    Write-Host "   🚀 Pushing..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Pushed successfully!`n" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Push failed! Check errors above`n" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ⏭️  Skipped push`n" -ForegroundColor Yellow
}

# Railway deployment instructions
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Code is ready for Railway!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "📋 Next Steps on Railway Dashboard:`n" -ForegroundColor Yellow

Write-Host "1️⃣  Go to Railway:" -ForegroundColor White
Write-Host "   https://railway.app/dashboard`n" -ForegroundColor Cyan

Write-Host "2️⃣  Create New Project:" -ForegroundColor White
Write-Host "   • Click 'New Project'" -ForegroundColor Gray
Write-Host "   • Select 'Deploy from GitHub repo'" -ForegroundColor Gray
Write-Host "   • Choose 'Petizo2' repository" -ForegroundColor Gray
Write-Host "   • Railway will auto-detect Dockerfile ✅`n" -ForegroundColor Gray

Write-Host "3️⃣  Configure Environment Variables:" -ForegroundColor White
Write-Host "   Go to Variables tab and add:" -ForegroundColor Gray
Write-Host "   ┌─────────────────────────────────────────┐" -ForegroundColor Gray
Write-Host "   │ NODE_ENV=production                     │" -ForegroundColor White
Write-Host "   │ PORT=3000                               │" -ForegroundColor White
Write-Host "   │ JWT_SECRET=<random-secure-string>       │" -ForegroundColor White
Write-Host "   │ OPENROUTER_API_KEY=<your-key-optional>  │" -ForegroundColor White
Write-Host "   └─────────────────────────────────────────┘`n" -ForegroundColor Gray

Write-Host "   💡 Generate JWT_SECRET:" -ForegroundColor Cyan
Write-Host "   `$bytes = New-Object byte[] 32" -ForegroundColor Gray
Write-Host "   [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes(`$bytes)" -ForegroundColor Gray
Write-Host "   [Convert]::ToBase64String(`$bytes)`n" -ForegroundColor Gray

Write-Host "4️⃣  Create Volume (IMPORTANT!):" -ForegroundColor White
Write-Host "   • Go to 'Data' tab" -ForegroundColor Gray
Write-Host "   • Click '+ New Volume'" -ForegroundColor Gray
Write-Host "   • Mount Path: /app/data" -ForegroundColor Gray
Write-Host "   • This stores your database & uploads`n" -ForegroundColor Gray

Write-Host "5️⃣  Generate Domain:" -ForegroundColor White
Write-Host "   • Go to 'Settings' → 'Networking'" -ForegroundColor Gray
Write-Host "   • Click 'Generate Domain'" -ForegroundColor Gray
Write-Host "   • You'll get: your-app.up.railway.app`n" -ForegroundColor Gray

Write-Host "6️⃣  Deploy:" -ForegroundColor White
Write-Host "   • Railway will auto-deploy!" -ForegroundColor Gray
Write-Host "   • Build time: ~5-10 minutes (first time)" -ForegroundColor Gray
Write-Host "   • Watch logs in 'Deployments' tab`n" -ForegroundColor Gray

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📚 Resources:" -ForegroundColor Yellow
Write-Host "   Detailed Guide: DEPLOY_RAILWAY.md" -ForegroundColor White
Write-Host "   Docker Info: DOCKER_DEPLOYMENT.md" -ForegroundColor White
Write-Host "   Project Info: README.md`n" -ForegroundColor White

Write-Host "❓ Need help?" -ForegroundColor Yellow
Write-Host "   • Railway Docs: https://docs.railway.app" -ForegroundColor White
Write-Host "   • Railway Discord: https://discord.gg/railway`n" -ForegroundColor White

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
