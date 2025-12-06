#!/usr/bin/env python3
"""
OCR Scanner สำหรับฉลากวัคซีนสัตว์เลี้ยง
รับไฟล์รูปภาพผ่าน command line และคืนผลลัพธ์เป็น JSON
"""

import sys
import os
import json

# Debug: แสดง sys.path และตรวจสอบว่า numpy และ cv2 อยู่ที่ไหน
print("🔍 DEBUG: Python sys.path in scan.py:", file=sys.stderr)
for p in sys.path[:5]:
    print(f"   - {p}", file=sys.stderr)
    
print("🔍 DEBUG: Looking for numpy and cv2...", file=sys.stderr)
nix_site_packages = "/nix/store/jf0ipsi53apm3891hb4f05f0lc4k0qam-python3-3.9.18/lib/python3.9/site-packages"
if os.path.exists(nix_site_packages):
    numpy_path = os.path.join(nix_site_packages, "numpy")
    cv2_path = os.path.join(nix_site_packages, "cv2")
    print(f"🔍 DEBUG: numpy exists at {numpy_path}? {os.path.exists(numpy_path)}", file=sys.stderr)
    print(f"🔍 DEBUG: cv2 exists at {cv2_path}? {os.path.exists(cv2_path)}", file=sys.stderr)
    
    # Check in Volume packages too
    volume_packages = "/app/petizo/data/python_packages"
    if os.path.exists(volume_packages):
        volume_numpy = os.path.join(volume_packages, "numpy")
        volume_cv2 = os.path.join(volume_packages, "cv2")
        print(f"🔍 DEBUG: numpy in Volume? {os.path.exists(volume_numpy)}", file=sys.stderr)
        print(f"🔍 DEBUG: cv2 in Volume? {os.path.exists(volume_cv2)}", file=sys.stderr)
else:
    print(f"🔍 DEBUG: Nix site-packages does not exist", file=sys.stderr)

import cv2
import numpy as np
import time

# เพิ่ม path สำหรับ import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from preprocessing import split_image_left_right, preprocess_left_region, preprocess_right_region
from ocr_engines import ocr_hybrid, ocr_tesseract_only, ocr_easyocr_only
from data_extraction import extract_vaccine_data, merge_ocr_results


def scan_vaccine_label(image_path: str) -> dict:
    """
    สแกนฉลากวัคซีนและคืนผลลัพธ์
    
    Args:
        image_path: path ของไฟล์รูปภาพ
        
    Returns:
        dict ที่มีข้อมูลวัคซีนและ metadata
    """
    
    print(f'\n{"="*60}', file=sys.stderr)
    print(f'[OCR] Processing: {os.path.basename(image_path)}', file=sys.stderr)
    print(f'{"="*60}', file=sys.stderr)
    
    # โหลดรูปภาพ
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f'Cannot load image: {image_path}')
    
    # แบ่งรูปภาพ
    print('[OCR] Splitting image...', file=sys.stderr)
    left, right = split_image_left_right(image)
    
    # ประมวลผลภาพ
    print('[OCR] Preprocessing regions...', file=sys.stderr)
    left_processed = preprocess_left_region(left, scale=2)
    right_processed = preprocess_right_region(right, scale=7)
    
    # === HYBRID ONLY (เร็วที่สุด) ===
    print('\n[HYBRID] Running Hybrid OCR (Tesseract + EasyOCR)...', file=sys.stderr)
    start_time = time.time()
    hybrid_results = ocr_hybrid(left_processed, right_processed)
    hybrid_data = extract_vaccine_data(
        hybrid_results['left_text'],
        hybrid_results['right_text']
    )
    hybrid_time = time.time() - start_time
    print(f'[HYBRID] Hybrid completed in {hybrid_time:.2f}s', file=sys.stderr)
    print(f'[HYBRID] Hybrid results: {json.dumps(hybrid_data, indent=2, ensure_ascii=False)}', file=sys.stderr)
    
    # สรุปผลลัพธ์
    print(f'\n{"="*60}', file=sys.stderr)
    print('[SUMMARY] OCR Results Summary:', file=sys.stderr)
    print(f'{"="*60}', file=sys.stderr)
    print(f'[SUMMARY] Hybrid: {sum(1 for v in hybrid_data.values() if v)}/6 fields', file=sys.stderr)
    print(f'{"="*60}\n', file=sys.stderr)
    
    # คืนผลลัพธ์ (Hybrid เท่านั้น)
    return {
        'success': True,
        'data': hybrid_data,
        'processing_time': {
            'hybrid': round(hybrid_time, 2)
        }
    }


def main():
    """Main function สำหรับรัน script"""
    
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No image path provided'
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(json.dumps({
            'success': False,
            'error': f'Image not found: {image_path}'
        }))
        sys.exit(1)
    
    try:
        result = scan_vaccine_label(image_path)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.exit(0)
        
    except Exception as e:
        # Error ส่งไปที่ stdout เป็น JSON
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
        # Traceback ส่งไปที่ stderr
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
