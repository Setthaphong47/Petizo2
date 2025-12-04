#!/bin/bash
# Startup script for Railway deployment with OCR support

# Set environment variables for EasyOCR and OpenCV
# ใช้ Volume เดิมที่ /app/petizo/data และสร้างโฟลเดอร์ย่อย easyocr_models
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Create easyocr_models directory inside existing volume if it doesn't exist
mkdir -p /app/petizo/data/easyocr_models

# Start the Node.js server
exec node server.js
