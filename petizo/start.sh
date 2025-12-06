#!/bin/sh
# Startup script for Railway deployment with OCR support
# NumPy, OpenCV, Pillow จาก Nix (ติดตั้งตอน build)
# PyTorch, EasyOCR จาก pip (ติดตั้งใน Volume ตอน runtime)

echo "🚀 Starting Petizo server with OCR support..."

# Set Python packages path in Volume
export PYTHON_PACKAGES="/app/petizo/data/python_packages"

# Add both Volume packages AND Nix packages to PYTHONPATH
# Nix packages จะอยู่ใน site-packages ของ python3 จาก Nix
NIX_PYTHON_SITEPACKAGES=$(python3 -c "import site; print(':'.join(site.getsitepackages()))" 2>/dev/null || echo "")
export PYTHONPATH="$PYTHON_PACKAGES:$NIX_PYTHON_SITEPACKAGES:$PYTHONPATH"

# Set environment variables for EasyOCR and OpenCV
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Check if Python packages are installed
INSTALL_MARKER="/app/petizo/data/.installed"
INSTALL_VERSION="v13"  # v13: Fix PYTHONPATH to include Nix's site-packages for cv2/numpy

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

  # Bootstrap pip if not available (using get-pip.py because ensurepip is blocked by Nix)
  if ! python3 -m pip --version &> /dev/null; then
    echo "   Installing pip module via get-pip.py..."
    curl -sSL https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
    python3 /tmp/get-pip.py --break-system-packages --target="$PYTHON_PACKAGES" --no-warn-script-location
    rm -f /tmp/get-pip.py
    echo "   ✅ pip installed successfully"
  fi

  # Install PyTorch CPU-only WITHOUT numpy (NumPy มาจาก Nix แล้ว)
  # Note: torch จะพยายามติดตั้ง numpy ถ้าไม่มี แต่เราบังคับให้ใช้ Nix's numpy
  echo "   Installing PyTorch CPU-only (without numpy, using Nix's numpy)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps \
    torch torchvision

  # Install PyTorch dependencies (ยกเว้น numpy)
  echo "   Installing PyTorch dependencies (filelock, fsspec, jinja2, etc.)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps \
    filelock fsspec jinja2 sympy typing-extensions networkx

  PYTORCH_EXIT=$?
  if [ $PYTORCH_EXIT -ne 0 ]; then
    echo "❌ Failed to install PyTorch (exit code: $PYTORCH_EXIT)"
    exit 1
  fi
  echo "   ✅ PyTorch CPU installed (using Nix's NumPy)"

  # Install pytesseract only (NumPy, OpenCV, Pillow มาจาก Nix แล้ว)
  echo "   Installing pytesseract (NumPy, OpenCV, Pillow from Nix)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps \
    pytesseract>=0.3.10

  # Install EasyOCR WITHOUT dependencies
  echo "   Installing EasyOCR (without torch/numpy/opencv dependencies)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps easyocr>=1.7.0

  # Install EasyOCR's other dependencies (ยกเว้น numpy, pillow, opencv)
  echo "   Installing EasyOCR dependencies (scipy, scikit-image, etc.)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps \
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
