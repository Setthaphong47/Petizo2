import cv2
import numpy as np
import sys
from typing import Tuple


def detect_split_point(image: np.ndarray) -> int:
    """ตรวจจับจุดแบ่งระหว่างด้านซ้ายและขวาของฉลากวัคซีน"""
    height, width = image.shape[:2]
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    
    brightness = []
    start_y = int(height * 0.2)
    end_y = int(height * 0.8)
    
    for x in range(width):
        column = gray[start_y:end_y, x]
        brightness.append(np.mean(column))
    
    max_drop = 0
    split_x = int(width * 0.65)
    window_size = int(width * 0.05)
    
    for x in range(int(width * 0.5), int(width * 0.8)):
        if x < window_size or x >= width - window_size:
            continue
        
        left_avg = np.mean(brightness[max(0, x-window_size):x])
        right_avg = np.mean(brightness[x:min(width, x+window_size)])
        drop = left_avg - right_avg
        
        if drop > max_drop:
            max_drop = drop
            split_x = x
    
    return split_x


def split_image_left_right(image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """แบ่งรูปภาพออกเป็นด้านซ้ายและขวา"""
    split_x = detect_split_point(image)
    return image[:, :split_x], image[:, split_x:]


def rotate_90(image: np.ndarray) -> np.ndarray:
    """หมุนภาพ 90 องศาตามเข็มนาฬิกา"""
    return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)


def preprocess_left_region(image: np.ndarray, scale: int = 2) -> np.ndarray:
    """ประมวลผลภาพด้านซ้าย (ข้อมูลหลัก)"""
    height, width = image.shape[:2]
    scaled = cv2.resize(image, (width*scale, height*scale), 
                       interpolation=cv2.INTER_CUBIC)
    
    gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY) if len(scaled.shape) == 3 else scaled
    
    # เพิ่มความคมชัด
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    
    # เพิ่มความเข้มข้น
    enhanced = cv2.convertScaleAbs(sharpened, alpha=1.2, beta=10)
    
    # Binary threshold
    _, binary = cv2.threshold(enhanced, 128, 255, cv2.THRESH_BINARY)
    
    # Denoise
    denoised = cv2.medianBlur(binary, 3)
    
    return denoised


def preprocess_right_region(image: np.ndarray, scale: int = 7) -> np.ndarray:
    """ประมวลผลภาพด้านขวา (Serial number, dates)"""
    height, width = image.shape[:2]
    
    # ขยายภาพ
    scaled = cv2.resize(image, (width*scale, height*scale), 
                       interpolation=cv2.INTER_CUBIC)
    
    # หมุนภาพ
    rotated = rotate_90(scaled)
    
    # แปลงเป็นขาวดำ
    gray = cv2.cvtColor(rotated, cv2.COLOR_BGR2GRAY) if len(rotated.shape) == 3 else rotated
    
    # สลับสี (invert)
    inverted = cv2.bitwise_not(gray)
    
    # Bilateral filter
    bilateral = cv2.bilateralFilter(inverted, 9, 75, 75)
    
    # CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    clahe_applied = clahe.apply(bilateral)
    
    # Enhance contrast
    enhanced = cv2.convertScaleAbs(clahe_applied, alpha=1.3, beta=4)
    
    # Adaptive threshold
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=25,
        C=2
    )
    
    white_percent = (binary == 255).sum() / binary.size * 100
    print(f'   Right preprocessing: {white_percent:.1f}% white', file=sys.stderr)
    
    # Denoise
    denoised = cv2.medianBlur(binary, 3)
    
    # Morphological operations
    kernel = np.ones((2, 2), np.uint8)
    opened = cv2.morphologyEx(denoised, cv2.MORPH_OPEN, kernel, iterations=1)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel, iterations=1)
    
    return closed


def preprocess_right_region_for_tesseract(image: np.ndarray, scale: int = 10) -> np.ndarray:
    """ประมวลผลภาพด้านขวาสำหรับ Tesseract โดยเฉพาะ (ความละเอียดสูงกว่า)"""
    height, width = image.shape[:2]
    
    # ความละเอียดสูงขึ้น
    scaled = cv2.resize(image, (width*scale, height*scale), 
                       interpolation=cv2.INTER_CUBIC)
    
    rotated = rotate_90(scaled)
    gray = cv2.cvtColor(rotated, cv2.COLOR_BGR2GRAY) if len(rotated.shape) == 3 else rotated
    inverted = cv2.bitwise_not(gray)
    
    # Aggressive denoising
    denoised = cv2.fastNlMeansDenoising(inverted, None, h=15, 
                                        templateWindowSize=7, 
                                        searchWindowSize=21)
    
    bilateral = cv2.bilateralFilter(denoised, 9, 100, 100)
    
    clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
    clahe_applied = clahe.apply(bilateral)
    
    kernel_sharpen = np.array([
        [-1, -1, -1, -1, -1],
        [-1,  2,  2,  2, -1],
        [-1,  2,  9,  2, -1],
        [-1,  2,  2,  2, -1],
        [-1, -1, -1, -1, -1]
    ]) / 9.0
    sharpened = cv2.filter2D(clahe_applied, -1, kernel_sharpen)
    
    enhanced = cv2.convertScaleAbs(sharpened, alpha=2.5, beta=20)
    
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=11, C=3
    )
    
    denoised2 = cv2.medianBlur(binary, 3)
    
    kernel_dilate = np.ones((2, 2), np.uint8)
    dilated = cv2.dilate(denoised2, kernel_dilate, iterations=1)
    
    kernel = np.ones((2, 2), np.uint8)
    opened = cv2.morphologyEx(dilated, cv2.MORPH_OPEN, kernel, iterations=1)
    closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel, iterations=1)
    
    final = cv2.filter2D(closed, -1, np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]]))
    _, final = cv2.threshold(final, 127, 255, cv2.THRESH_BINARY)
    
    white_percent = (final == 255).sum() / final.size * 100
    print(f'   Right (Tesseract): {white_percent:.1f}% white', file=sys.stderr)
    
    return final
