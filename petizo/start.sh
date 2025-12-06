#!/bin/sh
# Startup script for Railway deployment with OCR support
# Python packages installed to Volume (persist across deployments)

echo "🚀 Starting Petizo server with OCR support..."

# Set Python packages path in Volume
export PYTHON_PACKAGES="/app/petizo/data/python_packages"
export PYTHONPATH="$PYTHON_PACKAGES:$PYTHONPATH"

# Set environment variables for EasyOCR and OpenCV
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Create necessary directories in Volume
mkdir -p /app/petizo/data/easyocr_models
mkdir -p "$PYTHON_PACKAGES"

# Check if Python packages are installed
INSTALL_MARKER="$PYTHON_PACKAGES/.installed"

if [ ! -f "$INSTALL_MARKER" ]; then
  echo "📦 Installing Python packages to Volume (first time only, ~2-3 min)..."
  echo "   Target: $PYTHON_PACKAGES"

  # Install PyTorch CPU-only first (smaller, avoids OOM)
  echo "   Installing PyTorch CPU-only..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu

  if [ $? -ne 0 ]; then
    echo "❌ Failed to install PyTorch"
    exit 1
  fi

  # Install rest of packages
  echo "   Installing other OCR packages..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" -r ocr_system/requirements.txt

  if [ $? -eq 0 ]; then
    touch "$INSTALL_MARKER"
    echo "✅ Python packages installed successfully!"
  else
    echo "❌ Failed to install Python packages"
    exit 1
  fi
else
  echo "✅ Python packages already installed (using Volume cache)"
fi

# Start the Node.js server
echo "🌐 Starting Node.js server..."
exec node server.js
