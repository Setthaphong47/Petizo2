# ใช้ Node.js 20 บน Ubuntu (slim = เบาและประหยัด memory)
FROM node:20-bullseye-slim

# ติดตั้ง system dependencies สำหรับ OCR
# ใช้ --no-install-recommends เพื่อลดขนาด
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-tha \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libstdc++6 \
    zlib1g \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ตั้ง working directory
WORKDIR /app

# Copy package files
COPY petizo/package*.json ./

# ติดตั้ง Node.js dependencies (production only)
# ใช้ npm install แทน npm ci เพราะไม่มี package-lock.json
RUN npm install --only=production && npm cache clean --force

# Copy Python requirements
COPY petizo/ocr_system/requirements.txt ./ocr_system/

# ติดตั้ง Python packages (ใช้ CPU-only PyTorch เพื่อประหยัด memory)
# EasyOCR จะใช้ memory ประมาณ 500MB-1GB เมื่อโหลด model
RUN pip3 install --no-cache-dir \
    torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip3 install --no-cache-dir \
    opencv-python-headless==4.8.0.76 \
    pytesseract==0.3.10 \
    easyocr==1.7.0 \
    Pillow==10.0.0 && \
    rm -rf /root/.cache/pip

# Copy application code
COPY petizo/ ./

# สร้าง directories สำหรับ data และ uploads
RUN mkdir -p data/uploads data/easyocr_models data/tmp

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    OPENCV_IO_MAX_IMAGE_PIXELS=1000000000 \
    EASYOCR_MODULE_PATH=/app/data/easyocr_models \
    TMPDIR=/app/data/tmp \
    # จำกัด memory ของ PyTorch
    OMP_NUM_THREADS=2 \
    OPENBLAS_NUM_THREADS=2 \
    MKL_NUM_THREADS=2

# Health check - เพิ่ม start-period เป็น 120s เพื่อให้เวลา init database
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command - init database ก่อนเริ่ม server
CMD ["sh", "-c", "node scripts/setup/init-database.js && node server.js"]
