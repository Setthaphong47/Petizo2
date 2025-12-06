#!/bin/sh
# Startup script for Railway deployment with OCR support
# Python packages installed to Volume (persist across deployments)

echo "🚀 Starting Petizo server with OCR support..."

# Set Python packages path in Volume
export PYTHON_PACKAGES="/app/petizo/data/python_packages"
export PYTHONPATH="$PYTHON_PACKAGES:$PYTHONPATH"

# Use Volume temp directory to avoid cross-device link errors
export TMPDIR="/app/petizo/data/tmp"
mkdir -p "$TMPDIR"

# Set environment variables for EasyOCR and OpenCV
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Create necessary directories in Volume
mkdir -p /app/petizo/data/easyocr_models
mkdir -p "$PYTHON_PACKAGES"

# Check if Python packages are installed
INSTALL_MARKER="$PYTHON_PACKAGES/.installed"

# Force reinstall to clear corrupted packages from OOM
rm -rf "$PYTHON_PACKAGES"
rm -f "$INSTALL_MARKER"

if [ ! -f "$INSTALL_MARKER" ]; then
  echo "📦 Installing Python packages to Volume (first time only, ~2-3 min)..."
  echo "   Target: $PYTHON_PACKAGES"

  # Install PyTorch CPU-only first (smaller, avoids OOM)
  echo "   Installing PyTorch CPU-only..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" torch torchvision --index-url https://download.pytorch.org/whl/cpu 2>&1 | tee /tmp/pytorch_install.log
  PYTORCH_EXIT=$?

  # Check if packages were actually installed (pip may return exit code 2 for warnings)
  if grep -q "Successfully installed.*torch" /tmp/pytorch_install.log; then
    echo "   ✅ PyTorch CPU installed successfully"
  elif [ $PYTORCH_EXIT -ne 0 ]; then
    echo "❌ Failed to install PyTorch (exit code: $PYTORCH_EXIT)"
    exit 1
  else
    echo "   ✅ PyTorch CPU installed successfully"
  fi

  # Install rest of packages
  echo "   Installing other OCR packages..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" -r ocr_system/requirements.txt
  PACKAGES_EXIT=$?

  if [ $PACKAGES_EXIT -eq 0 ]; then
    touch "$INSTALL_MARKER"
    echo "✅ All Python packages installed successfully!"
  else
    echo "❌ Failed to install OCR packages (exit code: $PACKAGES_EXIT)"
    exit 1
  fi
else
  echo "✅ Python packages already installed (using Volume cache)"
fi

# Start the Node.js server
echo "🌐 Starting Node.js server..."
exec node server.js
