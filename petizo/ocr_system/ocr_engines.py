import cv2
import numpy as np
import pytesseract
import os
import sys
from typing import Dict, Optional

# EasyOCR
try:
    import easyocr
    EASYOCR_AVAILABLE = True
    _reader = None
except ImportError:
    EASYOCR_AVAILABLE = False
    _reader = None


def get_easyocr_reader():
    """สร้าง EasyOCR reader (singleton)"""
    global _reader
    if _reader is None and EASYOCR_AVAILABLE:
        try:
            # ตั้งค่า model storage path
            model_storage_directory = os.environ.get('EASYOCR_MODULE_PATH', None)
            print(f'[EasyOCR] Model storage directory: {model_storage_directory}', file=sys.stderr)
            
            _reader = easyocr.Reader(
                ['en'], 
                gpu=False, 
                verbose=False,
                model_storage_directory=model_storage_directory,
                download_enabled=True
            )
            print('[EasyOCR] Reader initialized successfully', file=sys.stderr)
        except Exception as e:
            print(f'Warning: Could not initialize EasyOCR: {e}', file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
    return _reader


def ocr_tesseract(image: np.ndarray) -> str:
    """ใช้ Tesseract OCR"""
    try:
        config = '--psm 6 --oem 3'
        text = pytesseract.image_to_string(image, lang='eng', config=config)
        return text.strip()
    except Exception as e:
        return f'Tesseract Error: {e}'


def ocr_easyocr(image: np.ndarray) -> str:
    """ใช้ EasyOCR"""
    try:
        reader = get_easyocr_reader()
        if reader is None:
            return 'EasyOCR not available'
        
        results = reader.readtext(image, detail=0, paragraph=True)
        text = ' '.join(results)
        return text.strip()
    except Exception as e:
        return f'EasyOCR Error: {e}'


def ocr_hybrid(left_image: np.ndarray, right_image: np.ndarray) -> Dict[str, str]:
    """OCR แบบผสม: Tesseract สำหรับซ้าย, EasyOCR สำหรับขวา"""
    import sys
    print('\n[OCR] Processing with Hybrid method...', file=sys.stderr)
    
    # ด้านซ้าย: Tesseract 
    print('[OCR] Left region -> Tesseract...', file=sys.stderr)
    left_text = ocr_tesseract(left_image)
    
    # ด้านขวา: EasyOCR
    print('[OCR] Right region -> EasyOCR...', file=sys.stderr)
    right_text = ocr_easyocr(right_image)
    
    return {
        'left_text': left_text,
        'right_text': right_text,
        'left_engine': 'tesseract',
        'right_engine': 'easyocr'
    }


def ocr_tesseract_only(left_image: np.ndarray, right_image: np.ndarray) -> Dict[str, str]:
    """ใช้ Tesseract เท่านั้น (สำหรับเปรียบเทียบ)"""
    import sys
    print('\n[OCR] Processing with Tesseract only...', file=sys.stderr)
    
    left_text = ocr_tesseract(left_image)
    right_text = ocr_tesseract(right_image)
    
    return {
        'left_text': left_text,
        'right_text': right_text,
        'left_engine': 'tesseract',
        'right_engine': 'tesseract'
    }


def ocr_easyocr_only(left_image: np.ndarray, right_image: np.ndarray) -> Dict[str, str]:
    """ใช้ EasyOCR เท่านั้น (สำหรับเปรียบเทียบ)"""
    import sys
    print('\n[OCR] Processing with EasyOCR only...', file=sys.stderr)
    
    left_text = ocr_easyocr(left_image)
    right_text = ocr_easyocr(right_image)
    
    return {
        'left_text': left_text,
        'right_text': right_text,
        'left_engine': 'easyocr',
        'right_engine': 'easyocr'
    }


def clean_ocr_text(text: str) -> str:
    """ทำความสะอาดข้อความ OCR"""
    import re
    
    # ลบช่องว่างหลายช่อง
    text = re.sub(r'\s+', ' ', text)
    
    # การแก้ไข OCR ที่พบบ่อย
    text = text.replace('|', 'I')  # Pipe → I
    text = text.replace('0', 'O') if text.isupper() else text  # Context-aware
    
    return text.strip()
