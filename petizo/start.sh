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
INSTALL_VERSION="v5"  # v5: Install PyTorch WITH deps, others WITHOUT deps to prevent GPU torch

# Force reinstall if version changed (e.g., after adding libstdc++6)
if [ -f "$INSTALL_MARKER" ]; then
  CURRENT_VERSION=$(cat "$INSTALL_MARKER" 2>/dev/null || echo "v0")
  if [ "$CURRENT_VERSION" != "$INSTALL_VERSION" ]; then
    echo "🔄 Detected system library update, forcing reinstall..."
    rm -rf "$PYTHON_PACKAGES"
    rm -rf /app/petizo/data/tmp
    rm -rf /root/.cache/pip
    rm -f "$INSTALL_MARKER"
  fi
else
  # First time install - also clear everything
  echo "🧹 Cleaning old Python packages and pip cache..."
  rm -rf "$PYTHON_PACKAGES"
  rm -rf /app/petizo/data/tmp
  rm -rf /root/.cache/pip
  rm -f "$INSTALL_MARKER"
fi

echo "✅ Cleanup complete (packages + pip cache)"

# Create necessary directories in Volume AFTER cleanup
mkdir -p /app/petizo/data/easyocr_models
mkdir -p "$PYTHON_PACKAGES"

# Use Volume temp directory to avoid cross-device link errors
export TMPDIR="/app/petizo/data/tmp"
mkdir -p "$TMPDIR" || echo "⚠️  Warning: Could not create tmp directory"

if [ ! -f "$INSTALL_MARKER" ]; then
  echo "📦 Installing Python packages to Volume (first time only, ~2-3 min)..."
  echo "   Target: $PYTHON_PACKAGES"

  # CRITICAL: Install NumPy 2.0+ FIRST (before PyTorch)
  # This ensures we get a version compiled with zlib1g support
  echo "   Installing NumPy 2.0+ with zlib support..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" "numpy>=2.0.0,<3.0.0"
  NUMPY_EXIT=$?
  
  if [ $NUMPY_EXIT -ne 0 ]; then
    echo "❌ Failed to install NumPy (exit code: $NUMPY_EXIT)"
    exit 1
  fi
  
  # Verify NumPy installation
  echo "   Verifying NumPy installation..."
  python3 -c "import sys; sys.path.insert(0, '$PYTHON_PACKAGES'); import numpy; print(f'NumPy {numpy.__version__} installed successfully')"
  
  # Install PyTorch CPU-only WITH dependencies (filelock, fsspec, jinja2, sympy, etc.)
  # Using --index-url ensures we get CPU version from PyTorch's CPU-only index
  echo "   Installing PyTorch CPU-only with dependencies..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu
  PYTORCH_EXIT=$?

  if [ $PYTORCH_EXIT -ne 0 ]; then
    echo "❌ Failed to install PyTorch (exit code: $PYTORCH_EXIT)"
    exit 1
  fi

  echo "   ✅ PyTorch CPU installed successfully with all dependencies"

  # Install other basic packages WITHOUT dependencies (to prevent pulling torch GPU)
  echo "   Installing basic OCR packages (opencv, pillow, pytesseract)..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps \
    opencv-python-headless>=4.8.0 \
    pytesseract>=0.3.10 \
    Pillow>=10.0.0

  # Install EasyOCR WITHOUT dependencies (to avoid re-downloading GPU torch)
  echo "   Installing EasyOCR (without torch/torchvision dependencies)..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps easyocr>=1.7.0

  # Install EasyOCR's other dependencies WITHOUT deps (to prevent pulling torch GPU)
  echo "   Installing EasyOCR dependencies (without pulling torch)..."
  pip3 install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps \
    scipy scikit-image python-bidi PyYAML Shapely pyclipper ninja

  PACKAGES_EXIT=$?

  if [ $PACKAGES_EXIT -eq 0 ]; then
    echo "$INSTALL_VERSION" > "$INSTALL_MARKER"
    echo "✅ All Python packages installed successfully! (version: $INSTALL_VERSION)"
  else
    echo "❌ Failed to install OCR packages (exit code: $PACKAGES_EXIT)"
    exit 1
  fi
else
  echo "✅ Python packages already installed (using Volume cache, version: $(cat $INSTALL_MARKER))"
fi

# Start the Node.js server
echo "🌐 Starting Node.js server..."
exec node server.js
