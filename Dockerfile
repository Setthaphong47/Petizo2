# Petizo Dockerfile - Node.js + Python + OCR
# Multi-stage build for optimized image size

FROM node:20-slim

# Install system dependencies for Python, OpenCV, and Tesseract OCR
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    # OpenCV dependencies
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgthread-2.0-0 \
    # Build tools (needed for some Python packages)
    gcc \
    g++ \
    make \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY petizo/package*.json ./petizo/

# Install Node.js dependencies
WORKDIR /app/petizo
RUN npm ci --only=production

# Copy Python requirements
COPY petizo/ocr_system/requirements.txt ./ocr_system/

# Install Python dependencies
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r ocr_system/requirements.txt

# Copy application code
WORKDIR /app
COPY . .

# Create necessary directories
WORKDIR /app/petizo
RUN mkdir -p data/uploads && \
    chmod +x start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/petizo/data/petizo.db
ENV EASYOCR_MODULE_PATH=/app/petizo/data/.easyocr

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run start script (handles migrations + server)
CMD ["./start.sh"]
