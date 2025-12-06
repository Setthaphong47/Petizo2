#!/bin/sh
# Startup script for Railway deployment with OCR support
# Installs Python packages at runtime (first time only)

echo "🚀 Starting Petizo server with OCR support..."

# Set environment variables for EasyOCR and OpenCV
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Create necessary directories in Volume
mkdir -p /app/petizo/data/easyocr_models
mkdir -p /app/petizo/data/pip_cache

# Check if Python packages are already installed (cached in Volume)
CACHE_MARKER="/app/petizo/data/pip_cache/.installed"

if [ ! -f "$CACHE_MARKER" ]; then
  echo "📦 Installing Python packages (first time only, ~2-3 minutes)..."
  echo "   - opencv-python-headless"
  echo "   - pytesseract"
  echo "   - easyocr (includes ~200MB models)"
  echo "   - numpy, Pillow"

  # Install Python packages with cache in Volume
  # ใช้ --break-system-packages เพราะ Nixpacks ใช้ Nix-managed Python
  # ใช้ python3 -m pip แทน pip3 เพราะหลัง upgrade pip แล้ว pip3 หายจาก PATH
  python3 -m pip install --break-system-packages --cache-dir=/app/petizo/data/pip_cache --upgrade pip
  python3 -m pip install --break-system-packages --cache-dir=/app/petizo/data/pip_cache -r ocr_system/requirements.txt

  if [ $? -eq 0 ]; then
    # Mark as installed
    touch "$CACHE_MARKER"
    echo "✅ Python packages installed successfully!"
  else
    echo "❌ Failed to install Python packages"
    exit 1
  fi
else
  echo "✅ Python packages already installed (using cache)"
fi

# Start the Node.js server
echo "🌐 Starting Node.js server..."
exec node server.js
