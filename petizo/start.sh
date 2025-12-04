#!/bin/bash
# Startup script for Railway deployment with OCR support

# Set environment variables for EasyOCR and OpenCV
export EASYOCR_MODULE_PATH="/app/petizo/.easyocr"
export OPENCV_IO_MAX_IMAGE_PIXELS=1000000000
export PYTHONUNBUFFERED=1

# Create .easyocr directory if it doesn't exist
mkdir -p /app/petizo/.easyocr

# Start the Node.js server
exec node server.js
