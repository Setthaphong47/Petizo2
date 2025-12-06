#!/bin/sh
# Startup script for Railway deployment with OCR support
# Python packages installed to Volume (persist across deployments)

echo "🚀 Starting Petizo server with OCR support..."

# Set Python packages path in Volume
export PYTHON_PACKAGES="/app/petizo/data/python_packages"
export PYTHONPATH="$PYTHON_PACKAGES:$PYTHONPATH"

# Set library path for NumPy and other C-extensions to find system libraries (zlib, etc.)
export LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:/usr/lib:$LD_LIBRARY_PATH"

# Set environment variables for EasyOCR and OpenCV
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Check if Python packages are installed
INSTALL_MARKER="/app/petizo/data/.installed"
INSTALL_VERSION="v10"  # v10: Add LD_LIBRARY_PATH for NumPy to find zlib (libz.so.1)

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

  # Install PyTorch CPU-only WITH dependencies (filelock, fsspec, jinja2, sympy, numpy 1.26.3, etc.)
  # Using --index-url ensures we get CPU version from PyTorch's CPU-only index
  # PyTorch will install numpy 1.26.3 (not 2.0+) which doesn't have libstdc++ issues
  echo "   Installing PyTorch CPU-only with dependencies (including numpy 1.26.3)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu
  PYTORCH_EXIT=$?

  if [ $PYTORCH_EXIT -ne 0 ]; then
    echo "❌ Failed to install PyTorch (exit code: $PYTORCH_EXIT)"
    exit 1
  fi

  echo "   ✅ PyTorch CPU + numpy 1.26.3 installed successfully (no libstdc++ issues)"

  # Install other basic packages WITHOUT dependencies (to prevent pulling torch GPU)
  echo "   Installing basic OCR packages (opencv, pillow, pytesseract)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps \
    opencv-python-headless>=4.8.0 \
    pytesseract>=0.3.10 \
    Pillow>=10.0.0

  # Install EasyOCR WITHOUT dependencies (to avoid re-downloading GPU torch)
  echo "   Installing EasyOCR (without torch/torchvision dependencies)..."
  python3 -m pip install --break-system-packages --target="$PYTHON_PACKAGES" --no-deps easyocr>=1.7.0

  # Install EasyOCR's other dependencies WITHOUT deps (to prevent pulling torch GPU)
  echo "   Installing EasyOCR dependencies (without pulling torch)..."
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
