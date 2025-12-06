#!/bin/sh
# Startup script for Railway deployment with OCR support
# Python packages are installed during build phase (see nixpacks.toml)

echo "🚀 Starting Petizo server with OCR support..."

# Set environment variables for EasyOCR and OpenCV
export EASYOCR_MODULE_PATH="/app/petizo/data/easyocr_models"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Create necessary directories in Volume for EasyOCR models
mkdir -p /app/petizo/data/easyocr_models

# Start the Node.js server
echo "🌐 Starting Node.js server..."
exec node server.js
