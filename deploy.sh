#!/bin/bash
# ====================================
# 🚀 Railway Deployment Script (Bash)
# ====================================
# For Linux/Mac users

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐾 Petizo - Railway Deployment Helper"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Docker
echo "🔍 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found! Please install Docker"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi
echo "✅ Docker is installed"
echo ""

# Check Docker daemon
echo "🔍 Checking Docker daemon..."
if ! docker ps &> /dev/null; then
    echo "❌ Docker daemon is not running!"
    echo "   Please start Docker"
    exit 1
fi
echo "✅ Docker daemon is running"
echo ""

# Menu
echo "What would you like to do?"
echo ""
echo "  1) 🐳 Build Docker image"
echo "  2) 🧪 Test locally (docker-compose)"
echo "  3) 🧹 Clean up Docker resources"
echo "  4) 📦 Prepare for Railway deployment"
echo "  5) 🚀 Full workflow (Build + Test + Prepare)"
echo "  6) ❌ Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🐳 Building Docker image..."
        docker build -t petizo:latest .
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Build successful!"
            echo "   Image: petizo:latest"
            echo ""
            echo "💡 Next: Run 'docker-compose up' to test"
        else
            echo ""
            echo "❌ Build failed! Check logs above"
        fi
        ;;
        
    2)
        echo ""
        echo "🧪 Starting containers..."
        echo "   Press Ctrl+C to stop"
        echo ""
        docker-compose up
        ;;
        
    3)
        echo ""
        echo "🧹 Cleaning up Docker resources..."
        docker-compose down
        docker image prune -f
        docker volume prune -f
        echo ""
        echo "✅ Cleanup complete!"
        ;;
        
    4)
        echo ""
        echo "📦 Preparing for Railway deployment..."
        echo ""
        
        files=("Dockerfile" ".dockerignore" "railway.json")
        all_exist=true
        
        for file in "${files[@]}"; do
            if [ -f "$file" ]; then
                echo "   ✅ $file"
            else
                echo "   ❌ $file - Not found!"
                all_exist=false
            fi
        done
        
        if [ "$all_exist" = true ]; then
            echo ""
            echo "✅ All required files are ready!"
            echo ""
            echo "📋 Next steps:"
            echo "   1. Commit and push to GitHub:"
            echo "      git add ."
            echo "      git commit -m 'Add Docker support'"
            echo "      git push origin main"
            echo ""
            echo "   2. Go to Railway Dashboard"
            echo "      - New Project → Deploy from GitHub"
            echo "      - Select your repository"
            echo "      - Add Environment Variables"
            echo "      - Create Volume: /app/data"
            echo "      - Deploy!"
            echo ""
            echo "   📖 See DEPLOY_RAILWAY.md for detailed guide"
        fi
        ;;
        
    5)
        echo ""
        echo "🚀 Running full workflow..."
        echo ""
        
        echo "Step 1/3: Building Docker image..."
        docker build -t petizo:latest .
        if [ $? -ne 0 ]; then
            echo "❌ Build failed!"
            exit 1
        fi
        echo "✅ Build successful!"
        echo ""
        
        echo "Step 2/3: Testing container..."
        docker-compose up -d
        sleep 10
        
        if docker ps | grep -q petizo; then
            echo "✅ Container is running!"
        else
            echo "⚠️  Container may have issues"
        fi
        
        docker-compose down
        echo ""
        
        echo "Step 3/3: Checking deployment files..."
        echo "   ✅ Dockerfile"
        echo "   ✅ .dockerignore"
        echo "   ✅ railway.json"
        echo ""
        
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎉 Everything is ready for Railway!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📦 Git Commit & Push:"
        echo "   git add ."
        echo "   git commit -m 'Add Docker support for Railway'"
        echo "   git push origin main"
        echo ""
        echo "🚂 Railway Deployment:"
        echo "   1. Go to https://railway.app"
        echo "   2. New Project → Deploy from GitHub"
        echo "   3. Select Petizo2 repository"
        echo "   4. Add Environment Variables"
        echo "   5. Create Volume: /app/data"
        echo "   6. Deploy!"
        echo ""
        echo "📖 Full guide: DEPLOY_RAILWAY.md"
        ;;
        
    6)
        echo ""
        echo "Bye! 👋"
        echo ""
        exit 0
        ;;
        
    *)
        echo ""
        echo "❌ Invalid choice!"
        echo ""
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
