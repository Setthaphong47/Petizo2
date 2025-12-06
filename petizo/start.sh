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

# Check if Python packages are installed
INSTALL_MARKER="/app/petizo/data/.installed"

# Force reinstall to clear corrupted packages from OOM
rm -rf "$PYTHON_PACKAGES"
rm -rf /app/petizo/data/tmp
rm -f "$INSTALL_MARKER"

# Create necessary directories in Volume AFTER cleanup
mkdir -p /app/petizo/data/easyocr_models
mkdir -p "$PYTHON_PACKAGES"

# Use Volume temp directory to avoid cross-device link errors
export TMPDIR="/app/petizo/data/tmp"
mkdir -p "$TMPDIR" || echo "⚠️  Warning: Could not create tmp directory"

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

  # Install basic packages (opencv, numpy, pillow, pytesseract)
  echo "   Installing basic OCR packages (opencv, numpy, pillow, pytesseract)..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" \
    opencv-python-headless>=4.8.0 \
    numpy>=1.24.0 \
    pytesseract>=0.3.10 \
    Pillow>=10.0.0

  # Install EasyOCR WITHOUT dependencies (to avoid re-downloading GPU torch)
  echo "   Installing EasyOCR (without torch/torchvision dependencies)..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps easyocr>=1.7.0

  # Install EasyOCR's other dependencies (excluding torch/torchvision)
  echo "   Installing EasyOCR dependencies..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" \
    scipy scikit-image python-bidi PyYAML Shapely pyclipper ninja

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
