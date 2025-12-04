#!/bin/bash
# Startup script for Railway deployment with OCR support

# Install Python packages if not already installed
if ! python3 -c "import cv2" 2>/dev/null; then
    echo "Installing Python packages for OCR..."
    cd /app/petizo/ocr_system
    pip3 install --upgrade pip --quiet
    pip3 install -r requirements.txt --quiet
    cd /app/petizo
    echo "Python packages installed successfully"
else
    echo "Python packages already installed"
fi

# Set environment variables for EasyOCR and OpenCV
# ใช้ Volume เดิมที่ /app/petizo/data และสร้างโฟลเดอร์ย่อย easyocr_models
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Create easyocr_models directory inside existing volume if it doesn't exist
mkdir -p /app/petizo/data/easyocr_models

# Start the Node.js server
exec node server.js
