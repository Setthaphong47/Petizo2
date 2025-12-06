import sys
import re
from typing import Dict, Optional
from datetime import datetime


def normalize_ocr_text(text: str) -> str:
    """ทำความสะอาดและแก้ไขข้อความจาก OCR"""
    if not text:
        return text

    t = text.upper()

    # แก้ไขข้อผิดพลาดที่พบบ่อย
    replacements = {
        'HLFG': 'MFG', 'HIFG': 'MFG', 'MIFG': 'MFG', 'MIFG:': 'MFG:',
        'HLLG': 'MFG', 'HLLIG': 'MFG', 'HILG': 'MFG',  # เพิ่ม noise patterns
        'JAM': 'JAN', 'J A M': 'JAN', 'J A N': 'JAN',
        'J U N': 'JUN', 'J U L': 'JUL',
        '\\&': '4', '&': '4',
        'SCR ': 'SER ', 'SET ': 'SER ', 'SFR': 'SER',
        'RAY': 'MAY', 'R O V': 'NOV', 'ROV': 'NOV', 'R0V': 'NOV',
        'AO': 'APR', 'A0': 'APR',
        'OOT': 'OCT', '0CT': 'OCT', 'O0T': 'OCT', 'O0CT': 'OCT',
        '%': '', '?': '',  # ลบ noise characters
    }

    domain_replacements = {
        'DEFERUSOR': 'DEFENSOR', 'DEFERUSO': 'DEFENSOR',
        'DEFERRUSOR': 'DEFENSOR', 'CEFENSOR': 'DEFENSOR',
        'DEFENSOR3': 'DEFENSOR 3', 'DEFENSOR 3  ': 'DEFENSOR 3 ',
        'ZORTS': 'ZOETIS', 'ZORTS INC': 'ZOETIS INC',
        'FEUOCELL': 'FELOCELL', 'FEUOKCELL': 'FELOCELL',
        'RSG': 'REG', 'RGS': 'REG', 'RS G': 'REG',
        'GEG': 'REG', 'FEG': 'REG',
    }

    for k, v in domain_replacements.items():
        t = t.replace(k, v)

    for k, v in replacements.items():
        t = t.replace(k, v)

    # ลบอักขระพิเศษ
    t = re.sub(r"[^A-Z0-9\s/():-]", '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    
    return t


def extract_vaccine_name(text: str) -> Optional[str]:
    """ดึงชื่อวัคซีน"""
    t = text.upper()

    components = []
    if 'RABIES VACCINE' in t or 'RABIES' in t:
        components.append('Rabies Vaccine')
    if 'FELINE' in t and ('RHINOTRACH' in t or 'RHINOTRACHC' in t):
        components.append('Feline Rhinotracheitis')
    elif 'RHINOTRACHEITIS' in t or 'RHINOTRACH' in t or 'RHINOTRACHC' in t:
        components.append('Feline Rhinotracheitis')
    if 'CALICI' in t or 'PANLEUKOPENIA' in t or 'PANLCUKOPENIA' in t or 'PANLEUCOPENIA' in t:
        components.append('Calici-Panleukopenia')
    if 'CHLAMYDIA' in t or 'PSITTACI' in t or 'PSITTACH' in t or 'SHTCINDIS' in t:
        components.append('Chlamydia psittaci')

    if components:
        return '; '.join(components)

    # หาชื่อผลิตภัณฑ์
    match = re.search(r'(NOBIVAC|DEFENSOR|FELOCELL|FEUOCELL|FEUOKCELL|CEFENSOR)\s*\d*', t)
    if match:
        prod = match.group(0).strip()
        prod = prod.replace('FEUOCELL', 'FELOCELL').replace('FEUOKCELL', 'FELOCELL').replace('CEFENSOR', 'DEFENSOR')
        return prod

    return None


def extract_product_name(text: str) -> Optional[str]:
    """ดึงชื่อการค้า"""
    t = text.upper()

    match = re.search(r'(DEFENSOR|DEFERUSOR|DEFERUSO|CEFENSOR|NOBIVAC|FELOCELL|FEUOCELL|FEUOKCELL|FEU?\s*O\s*K\s*C?\s*CELL|FE\s*O\s*K\s*C?\s*CELL|FE\s*OKC\s*ELL|ELOKCELL|ELCELL|RABISIN)\s*[TM]*\s*\d*', t)
    if match:
        prod = match.group(0).strip()
        prod = prod.replace('DEFERUSOR', 'DEFENSOR').replace('DEFERUSO', 'DEFENSOR').replace('CEFENSOR', 'DEFENSOR')
        prod = prod.replace('FEUOCELL', 'FELOCELL').replace('FEUOKCELL', 'FELOCELL')
        prod = re.sub(r'FEU?\s*O\s*K\s*C?\s*CELL', 'FELOCELL', prod)
        prod = re.sub(r'FE\s*O\s*K\s*C?\s*CELL', 'FELOCELL', prod)
        prod = re.sub(r'FE\s*OKC\s*ELL', 'FELOCELL', prod)
        prod = prod.replace('ELOKCELL', 'FELOCELL').replace('ELCELL', 'FELOCELL')
        return prod

    return None


def extract_registration_number(text: str) -> Optional[str]:
    """ดึงเลขทะเบียน"""
    t = normalize_ocr_text(text)
    
    # แทนที่ตัวที่คล้ายกัน
    t = t.replace('RSG', 'REG').replace('RGS', 'REG').replace('R S G', 'REG')
    t = t.replace('GEG', 'REG').replace('FEG', 'REG')
    t = t.replace('RO.', 'NO.').replace('R O', 'NO')
    
    # 🔧 Fix: แปลง comma เป็น slash (เช่น 2,56 → 2/56)
    t = re.sub(r'(\d{1,3}),(\d{1,3})', r'\1/\2', t)
    
    # หารูปแบบเศษส่วน (111/222)
    m_frac = re.search(r'([0-9]{1,3}/[0-9]{1,3})', t)
    
    if not m_frac:
        # ลองหารูปแบบไม่มี slash
        no_slash_match = re.search(r'\bREG\s*(?:NO\.?)?\s*([A-Z0-9]{1,3})\s*([0-9]{4,5})', t)
        if no_slash_match:
            prefix = no_slash_match.group(1)
            number = no_slash_match.group(2)
            
            # หา suffix
            after_number = t[no_slash_match.end():no_slash_match.end()+10]
            suffix_match = re.search(r'\s*\(([A-Z0-9\- ]+)\)', after_number)
            
            val = f"{prefix} {number}"
            if suffix_match:
                val = f"{val} ({suffix_match.group(1).strip()})"
            
            formatted = format_registration_number(val)
            return formatted
        
        return None
    
    frac = m_frac.group(1)
    
    # หา prefix ก่อนหน้าเศษส่วน
    start_pos = max(0, m_frac.start() - 100)
    before_slash = t[start_pos:m_frac.start()]
    
    prefix_candidates = []
    
    # ลองหา REG NO prefix
    reg_patterns = [
        r'\bREG\s+NO\s+([A-Z0-9]{1,3})\s*$',
        r'\bREGNO\s*([A-Z0-9]{1,3})\s*$',
    ]
    
    for pattern in reg_patterns:
        reg_match = re.search(pattern, before_slash)
        if reg_match:
            prefix_candidates = [reg_match.group(1)]
            break
    
    if not prefix_candidates:
        # หา prefix ติดกับ REGNO
        regstuck_match = re.search(r'REGNO([A-Z0-9]{2,10})\s*$', before_slash)
        if regstuck_match:
            stuck_part = regstuck_match.group(1)
            if len(stuck_part) >= 2:
                prefix_candidates = [stuck_part[-2:]]
    
    if not prefix_candidates:
        # หา prefix ทั่วไป
        prefix_candidates = re.findall(r'([A-Z0-9]{1,3})\s*$', before_slash)
    
    if not prefix_candidates:
        # ลองดู window สุดท้าย
        window = before_slash[-15:] if len(before_slash) > 15 else before_slash
        tokens = re.findall(r'[A-Z0-9]+', window)
        if tokens:
            prefix_raw = tokens[-1]
            if 1 <= len(prefix_raw) <= 3:
                prefix_candidates = [prefix_raw]
            elif len(prefix_raw) >= 2:
                last_2 = prefix_raw[-2:]
                if re.match(r'^[A-Z0-9]{2}$', last_2):
                    prefix_candidates = [last_2]
    
    if prefix_candidates:
        prefix = prefix_candidates[0]
        
        if len(prefix) > 3:
            return None
        
        val = f"{prefix} {frac}"
        
        # หา suffix (ตัวในวงเล็บ)
        after_slash = t[m_frac.end():m_frac.end()+20]
        paren_match = re.search(r'\s*\(([A-Z0-9\- ]+)\)', after_slash)
        if paren_match:
            suffix = paren_match.group(1).strip()
            val = f"{val} ({suffix})"
        
        formatted = format_registration_number(val)
        return formatted
    
    return None


def format_registration_number(raw: str) -> Optional[str]:
    """จัดรูปแบบเลขทะเบียน"""
    if not raw:
        return None
    
    s = raw.upper().strip()
    s = re.sub(r'[^A-Z0-9/()\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    
    # แยก suffix (วงเล็บ)
    paren = None
    m_paren = re.search(r'\(([A-Z0-9\- ]+)\)\s*$', s)
    if m_paren:
        paren = m_paren.group(1).strip()
        paren = paren.replace('0', 'B')  # แปลง 0 เป็น B ใน suffix
        s = s[:m_paren.start()].strip()
    
    # หาเศษส่วน
    m_frac = re.search(r'([0-9]{1,3}/[0-9]{1,3})', s)
    if m_frac:
        frac = m_frac.group(1)
        prefix_raw = s[:m_frac.start()].strip()
        prefix = re.sub(r'[^A-Z0-9]', '', prefix_raw)
        
        if not prefix:
            toks = re.split(r'\s+', prefix_raw)
            prefix = re.sub(r'[^A-Z0-9]', '', toks[-1]) if toks else ''
        
        if prefix:
            # แก้ไข prefix ที่พบบ่อย
            prefix = prefix.replace('IF', '1F').replace('I F', '1F')
            prefix = prefix.replace('ZF', '2F').replace('Z F', '2F')
            
            if len(prefix) > 3:
                return None
            
            out = f"{prefix} {frac}"
            if paren:
                out = f"{out} ({paren})"
            return out
        else:
            return None
    
    # ลองรูปแบบไม่มี slash
    m2 = re.search(r'^([A-Z0-9]{1,3})\s*([0-9]{2,6})$', s)
    if m2:
        prefix = m2.group(1)
        number = m2.group(2)
        
        # แก้ไข prefix
        prefix = prefix.replace('IF', '1F').replace('ZF', '2F')
        
        if len(prefix) == 2 and len(number) >= 4:
            # แปลงตัวอักษรเป็นตัวเลข
            conv = str.maketrans({
                'O': '0', 'Q': '0', 'D': '0', 'S': '5', 
                'Z': '2', 'I': '1', 'L': '1', 'B': '8', 'G': '6'
            })
            num_norm = number.translate(conv)
            
            # แก้ไข prefix ตัวแรก
            p0 = prefix[0]
            p1 = prefix[1]
            if not p0.isdigit():
                p0_conv_map = {
                    'Z': '2', 'O': '0', 'Q': '0', 'S': '5', 
                    'I': '1', 'L': '1', 'B': '8', 'G': '6'
                }
                if p0 in p0_conv_map:
                    prefix = p0_conv_map[p0] + p1
            
            if len(num_norm) < 4 or not num_norm.isdigit():
                return None
            
            # แยกเป็น n1/n2
            n1 = num_norm[:2]
            n2 = num_norm[-2:]
            
            if n1.isdigit() and n2.isdigit() and len(n1) == 2 and len(n2) == 2:
                out = f"{prefix} {n1}/{n2}"
                if paren:
                    out = f"{out} ({paren})"
                return out
    
    return None


def extract_serial_number(text: str) -> Optional[str]:
    """ดึง Serial Number"""
    t = normalize_ocr_text(text)
    
    # 🔧 Fix: ปรับ pattern ให้จับ serial ที่มีตัวอักษรท้าย (เช่น 532764C)
    strict_pattern = r'\b(\d{5,7}[A-Z]{1,2})\b'  # ต้องมีตัวอักษรอย่างน้อย 1 ตัว
    letter_prefix_pattern = r'\b([A-Z]\d{5,6})\b'  # Serial ที่ขึ้นต้นด้วยตัวอักษร (เช่น S81525)
    fallback_pattern = r'\b(\d{5,7})\b'  # ถ้าไม่เจอก็ใช้แค่ตัวเลข
    
    # 🎯 Priority 1: หาจาก "SER:" keyword (แม่นที่สุด) - ทนทาน noise
    # รองรับ: SER: 532764C, SER RFG: 532764C, SER: S81525
    ser_patterns = [
        r'(?:SER|SERIAL)\s*[:\-]?\s*(?:[A-Z]{1,5}\s*[:\-]?\s*)?([A-Z]?\d{5,7}[A-Z]{0,2})\b',  # รองรับ prefix
        r'(?:SER|SERIAL)\s+([A-Z]\d{5,6})\b',  # Serial ขึ้นต้นด้วยตัวอักษร
    ]
    
    for pattern in ser_patterns:
        ser_match = re.search(pattern, t)
        if ser_match:
            raw = ser_match.group(1)
            
            # ตรวจสอบว่าไม่ใช่เลขทะเบียนที่ผสมกัน
            reg_patterns = re.findall(r'(\d{1,3})/(\d{1,3})', t)
            
            is_derived_from_reg = False
            if raw.isdigit() and len(raw) <= 6:  # เฉพาะตัวเลขอย่างเดียวที่สั้น
                for n1, n2 in reg_patterns:
                    combined = n1 + n2
                    if raw == combined or (raw.startswith(n1) and raw.endswith(n2)):
                        is_derived_from_reg = True
                        break
            
            # 🔒 ข้ามถ้าเป็น zip code (เช่น 63521 จาก Nebraska)
            if raw.isdigit() and len(raw) == 5:
                # ตรวจสอบว่าอยู่ใกล้คำว่า USA, Nebraska, Lincoln หรือไม่
                ser_pos = t.find('SER')
                if ser_pos >= 0:
                    context_before = t[max(0, ser_pos - 50):ser_pos]
                    if re.search(r'\b(USA|NEBRASKA|LINCOLN|INC)\b', context_before):
                        is_derived_from_reg = True  # ข้ามเพราะเป็น zip code
            
            if not is_derived_from_reg:
                return normalize_serial(raw)
    
    # 🎯 Priority 2: หาจาก pattern ที่ขึ้นต้นด้วยตัวอักษร (เช่น S81525)
    matches_letter_prefix = re.findall(letter_prefix_pattern, t)
    
    for match in matches_letter_prefix:
        match_pos = t.find(match)
        if match_pos >= 0:
            context_start = max(0, match_pos - 30)
            context = t[context_start:match_pos + len(match) + 30]
            
            # ข้ามถ้าอยู่ใกล้ REG
            if re.search(r'\b(REG|REGNO|FEG|GEG|RSG|RGS)\b', context[:match_pos - context_start + 10]):
                continue
        
        return normalize_serial(match)
    
    # 🎯 Priority 3: หาจาก pattern ที่มีตัวอักษรท้าย (เช่น 532764C)
    matches_with_letter = re.findall(strict_pattern, t)
    
    reg_patterns = re.findall(r'(\d{1,3})/(\d{1,3})', t)
    
    for match in matches_with_letter:
        match_pos = t.find(match)
        if match_pos >= 0:
            context_start = max(0, match_pos - 30)
            context_end = min(len(t), match_pos + len(match) + 30)
            context = t[context_start:context_end]
            
            # ข้ามถ้าอยู่ใกล้ REG
            if re.search(r'\b(REG|REGNO|FEG|GEG|RSG|RGS)\b', context[:match_pos - context_start + 10]):
                continue
        
        return normalize_serial(match)
    
    # 🎯 Priority 4: หาจาก pattern ตัวเลขอย่างเดียว (แต่ต้องไม่ใช่ zip code)
    matches_digits = re.findall(fallback_pattern, t)
    
    for match in matches_digits:
        match_pos = t.find(match)
        if match_pos >= 0:
            context_start = max(0, match_pos - 50)
            context_end = min(len(t), match_pos + len(match) + 30)
            context = t[context_start:context_end]
            
            # ข้ามถ้าอยู่ใกล้ REG
            if re.search(r'\b(REG|REGNO|FEG|GEG|RSG|RGS)\b', context[:match_pos - context_start + 10]):
                continue
            
            # ข้าม zip code (ใกล้ USA, Nebraska, Lincoln)
            context_before = t[context_start:match_pos]
            if re.search(r'\b(USA|NEBRASKA|LINCOLN|INC)\b', context_before):
                continue
        
        # ตรวจสอบว่าไม่ใช่เลขทะเบียนที่ผสมกัน
        is_derived_from_reg = False
        for n1, n2 in reg_patterns:
            combined = n1 + n2
            if match == combined or (match.startswith(n1) and match.endswith(n2)):
                is_derived_from_reg = True
                break
        
        if is_derived_from_reg:
            continue
        
        # ข้ามตัวเลข 5-6 หลักที่เป็นแค่ตัวเลข (น่าจะเป็น zip code)
        if len(match) in [5, 6] and match.isdigit():
            continue
        
        return normalize_serial(match)
    
    return None


def normalize_serial(raw: str) -> str:
    """แปลง Serial Number ให้ถูกต้อง - Smart normalization"""
    if not raw:
        return raw
    
    s = re.sub(r'[^A-Z0-9]', '', raw.upper())
    if not s:
        return raw
    
    # 🔧 Fix: Pattern 1 - Letter prefix (S81525)
    # รูปแบบ: [A-Z]\d{5,6} เช่น S81525, S81S25 → S81525
    letter_prefix_pattern = re.match(r'^([A-Z])(\d{2})([A-Z0-9])(\d{2,3})$', s)
    if letter_prefix_pattern:
        # ตรวจสอบว่าตัวที่ 3 เป็น S หรือไม่ (S81S25 → S81525)
        prefix = letter_prefix_pattern.group(1)
        first_two = letter_prefix_pattern.group(2)
        middle = letter_prefix_pattern.group(3)
        last_part = letter_prefix_pattern.group(4)
        
        # แปลง S → 5, O → 0 ในตำแหน่งกลาง
        if middle == 'S':
            middle = '5'
        elif middle == 'O':
            middle = '0'
        elif middle == 'I':
            middle = '1'
        
        return f"{prefix}{first_two}{middle}{last_part}"
    
    # ตรวจสอบรูปแบบมาตรฐาน: ตัวเลข 5-7 หลัก + ตัวอักษร 0-2 ตัว
    serial_pattern = re.match(r'^(\d{5,7})([A-Z]{0,2})$', s)
    if serial_pattern:
        return s
    
    digits = sum(c.isdigit() for c in s)
    letters = sum(c.isalpha() for c in s)
    
    # ถ้ามีตัวเลขมากกว่า แปลงตัวอักษรบางตัวเป็นตัวเลข
    if digits >= letters or (digits > 0 and letters > 0):
        s = s.replace('S', '5').replace('O', '0').replace('I', '1').replace('L', '1')
    else:
        # แปลง 0 เป็น O
        s = s.replace('0', 'O')
    
    return s


def extract_date(text: str, date_type: str = 'MFG') -> Optional[str]:
    """ดึงวันที่ (MFG หรือ EXP) - ปรับให้ทนทาน noise และรองรับหลายรูปแบบ"""
    t = normalize_ocr_text(text)
    
    # 🎯 Keywords ที่เป็นไปได้สำหรับ MFG และ EXP
    mfg_keywords = ['MFG', 'HLFG', 'HIFG', 'HLLG', 'HILG', 'MANUFACTURED', 'PROD']
    exp_keywords = ['EXP', 'EXPIRY', 'EXPIRE', 'USE BY', 'BEST BEFORE']
    
    if date_type == 'MFG':
        keywords = mfg_keywords
    else:
        keywords = exp_keywords
    
    # 🔧 Pattern 1: หาจาก keyword โดยตรง (ทนทาน noise มากขึ้น)
    # รองรับ: MFG: 01 JAN 2024, MFG 01 JAN 24, MFG:01JAN24
    for keyword in keywords:
        # ใช้ .{0,5} เพื่อข้าม noise characters ระหว่าง keyword กับ date
        pattern = rf'{keyword}\s*[:.#]?\s*[^A-Z0-9]{{0,5}}(\d{{1,2}})\s+([A-Z]{{2,6}})\s+(\d{{2,4}})'
        match = re.search(pattern, t)
        
        if match:
            day = match.group(1)
            month = match.group(2)
            year = match.group(3)
            return format_date(day, month, year)
    
    # 🔧 Pattern 2: หา date ที่มี noise characters (เช่น %7 DEC 0, 7 DEC 20, nhuqi? SEP 23)
    # รองรับ: 17 DEC 20, %7 DEC %0, 13 JUN 23, nhuqi? SEP 23 (กรณีไม่มีเลขวันที่ชัด)
    noisy_pattern = r'[^A-Z0-9]?(\d{1,2})\s+([A-Z]{2,6})\s+[^A-Z0-9]?(\d{2,4})'
    all_dates_noisy = re.findall(noisy_pattern, t)
    
    # 🔧 Pattern 2b: หา date ที่มี noise มาก จนไม่มีเลขวันที่ชัดเจน (เช่น nhuqi? SEP 23)
    # รองรับ: nhuqi? SEP 23, ???? SEP 23, %SEP 23 (ไม่มีเลขวันชัดเจน แต่มีเดือนและปี)
    very_noisy_pattern = r'[A-Z]*[^A-Z0-9]*\s*([A-Z]{3,6})\s+(\d{2,4})'
    very_noisy_dates = re.findall(very_noisy_pattern, t)
    # แปลงให้อยู่ในรูปแบบเดียวกับ all_dates (day, month, year) โดยกำหนดวันที่เป็น "12" (กลางเดือน)
    very_noisy_dates_formatted = [("12", month, year) for month, year in very_noisy_dates if len(month) in [3, 4]]
    
    # 🔧 Pattern 3: หา date มาตรฐาน (เช่น 01 JAN 2024)
    standard_pattern = r'(\d{1,2})\s+([A-Z]{2,6})\s+(\d{2,4})'
    all_dates_standard = re.findall(standard_pattern, t)
    
    # รวม dates ทั้งหมด (ไม่ซ้ำ) โดยให้ความสำคัญ: standard > noisy > very_noisy
    all_dates = list(dict.fromkeys(all_dates_standard + all_dates_noisy + very_noisy_dates_formatted))
    
    if not all_dates:
        return None
    
    # 🎯 ถ้าไม่เจอ keyword ให้ใช้ตำแหน่ง
    if date_type == 'MFG':
        # MFG: ใช้วันที่แรกเสมอ
        day, month, year = all_dates[0]
        return format_date(day, month, year)
    else:
        # EXP: ใช้วันที่หลังสุด (หรือวันที่สองถ้ามี)
        if len(all_dates) >= 2:
            # มี 2 วันขึ้นไป → ใช้วันสุดท้าย
            day, month, year = all_dates[-1]
        else:
            # มีแค่วันเดียว → ใช้อันเดียวกัน
            day, month, year = all_dates[0]
        
        return format_date(day, month, year)
    
    return None


def format_date(day: str, month: str, year: str) -> str:
    """จัดรูปแบบวันที่"""
    if not month:
        month = ''
    
    m_raw = re.sub(r'[^A-Z]', '', month.upper())
    
    month_map = {
        'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar', 'APR': 'Apr', 'MAY': 'May',
        'JUN': 'Jun', 'JUL': 'Jul', 'AUG': 'Aug', 'SEP': 'Sep', 'OCT': 'Oct',
        'NOV': 'Nov', 'DEC': 'Dec'
    }
    
    # แก้ไขเดือนที่อ่านผิด
    fixes = {
        'JN': 'JAN', 'JA': 'JAN', 'JAIN': 'JAN',
        'JV': 'JUN', 'JU': 'JUN', 'JUIV': 'JUN',
        'OOT': 'OCT', '0OT': 'OCT', '0CT': 'OCT', 'O0T': 'OCT', 'OCTT': 'OCT', 'OC': 'OCT',
        'OEC': 'DEC', 'BUC': 'MAY',
        'APRIL': 'APR', 'AP R': 'APR', 'AO': 'APR', 'A0': 'APR',
        'RAY': 'MAY',
    }
    
    noise_months = {'WS', 'CO'}
    if m_raw in noise_months:
        month_name = m_raw.capitalize()
    else:
        key = fixes.get(m_raw, m_raw[:3])
        key = key[:3]
        month_name = month_map.get(key, key.capitalize())
    
    # ทำให้แน่ใจว่าเป็นชื่อเดือนมาตรฐาน
    months = {
        'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar', 'APR': 'Apr',
        'MAY': 'May', 'JUN': 'Jun', 'JUL': 'Jul', 'AUG': 'Aug',
        'SEP': 'Sep', 'OCT': 'Oct', 'NOV': 'Nov', 'DEC': 'Dec'
    }
    month_name = months.get(month_name.upper()[:3], month_name)
    
    # แปลงปี
    if len(year) == 2:
        year_int = int(year)
        if year_int >= 20 and year_int <= 30:
            year = f'20{year}'
        else:
            year = f'20{year}'
    
    day = day.zfill(2)
    
    return f'{day} {month_name} {year}'


def parse_standard_date(date_str: str):
    """แปลงวันที่เป็น date object"""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%d %b %Y').date()
    except Exception:
        return None


def extract_manufacturer(text: str) -> Optional[str]:
    """ดึงชื่อผู้ผลิต"""
    text_upper = text.upper()
    
    manufacturers = [
        ('ZOETIS', 'Zoetis Inc.'),
        ('BOEHRINGER', 'Boehringer Ingelheim'),
        ('INTERVET', 'Intervet'),
        ('MERIAL', 'Merial'),
    ]
    
    for keyword, full_name in manufacturers:
        if keyword in text_upper:
            return full_name
    
    # หาบริษัทที่มี Inc.
    match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Inc\.?', text)
    if match:
        return match.group(0)
    
    return None


def extract_vaccine_data(left_text: str, right_text: str) -> Dict[str, Optional[str]]:
    """ดึงข้อมูลวัคซีนทั้งหมด"""
    import sys
    
    print('\n[DATA] Extracting vaccine data...', file=sys.stderr)
    
    # Normalize
    left_normalized = normalize_ocr_text(left_text)
    right_normalized = normalize_ocr_text(right_text)
    
    # Extract
    data = {
        'vaccine_name': extract_vaccine_name(left_normalized),
        'product_name': extract_product_name(left_normalized),
        'manufacturer': extract_manufacturer(left_normalized),
        'registration_number': extract_registration_number(left_normalized),
        'serial_number': None,
        'mfg_date': extract_date(right_normalized, 'MFG'),
        'exp_date': extract_date(right_normalized, 'EXP'),
    }
    
    # ดึง Serial Number จากทั้งสองด้าน
    serial_right = extract_serial_number(right_normalized)
    serial_left = extract_serial_number(left_normalized)
    
    def is_strict_serial(s: Optional[str]) -> bool:
        if not s:
            return False
        return bool(re.fullmatch(r"\d{5,6}[A-Z]", s.upper()))
    
    # เลือก Serial ที่ดีที่สุด
    if is_strict_serial(serial_right):
        data['serial_number'] = serial_right
    elif is_strict_serial(serial_left):
        data['serial_number'] = serial_left
    else:
        data['serial_number'] = serial_right or serial_left
    
    # ตรวจสอบวันที่
    mfg = data.get('mfg_date')
    exp = data.get('exp_date')
    
    mfg_dt = parse_standard_date(mfg) if mfg else None
    exp_dt = parse_standard_date(exp) if exp else None
    
    # ถ้า EXP น้อยกว่า MFG ให้ลองหาใหม่
    if mfg_dt and exp_dt and exp_dt <= mfg_dt:
        print('[DATA] Warning: EXP date <= MFG date, trying to find correct dates...', file=sys.stderr)
        # ลองหาวันที่ทั้งหมด (รองรับ noise characters เช่น %7 DEC %0)
        # Pattern 1: ปกติ (17 DEC 20)
        clean_dates = re.findall(r'(\d{1,2})\s+([A-Z]{2,6})\s+(\d{2,4})', right_normalized)
        # Pattern 2: มี noise (% หรือ ? ข้างหน้าตัวเลข) เช่น %7 DEC %0
        noisy_dates = re.findall(r'[^A-Z0-9]?(\d{1,2})\s+([A-Z]{2,6})\s+[^A-Z0-9]?(\d{2,4})', right_normalized)
        all_dates = list(dict.fromkeys(clean_dates + noisy_dates))  # รวมแบบไม่ซ้ำ
        
        if len(all_dates) >= 2:
            # ลองทุกวันที่ เลือกอันที่ > MFG และห่างจาก MFG มากที่สุด (น่าจะเป็น EXP)
            valid_exp_dates = []
            for day, month, year in all_dates:
                candidate = format_date(day, month, year)
                candidate_dt = parse_standard_date(candidate)
                if candidate_dt and candidate_dt > mfg_dt:
                    days_diff = (candidate_dt - mfg_dt).days
                    valid_exp_dates.append((candidate, candidate_dt, days_diff))
            
            if valid_exp_dates:
                # เลือกวันที่ห่างจาก MFG มากที่สุด (EXP ต้องห่างจาก MFG หลายเดือน)
                valid_exp_dates.sort(key=lambda x: x[2], reverse=True)
                data['exp_date'] = valid_exp_dates[0][0]
                print(f'[DATA] ✅ Fixed EXP date: {data["exp_date"]} (was {exp})', file=sys.stderr)
    
    # ถ้าไม่มี product_name ลองเดาจาก vaccine_name
    if not data.get('product_name'):
        vn = (data.get('vaccine_name') or '').upper()
        left_up = (left_text or '').upper()
        if 'FELINE' in vn or 'FELOCELL' in left_up or 'FELOCELL' in vn or 'FEUOCELL' in left_up:
            data['product_name'] = 'FELOCELL'
        elif 'RABIES' in vn or 'RABIES VACCINE' in vn or 'DEFENSOR' in left_up or 'DEFERUSOR' in left_up:
            data['product_name'] = 'DEFENSOR'
    
    # ถ้า registration_number ไม่ดี ลองหาจากด้านขวา
    reg = data.get('registration_number')
    if not reg or len(reg) < 4 or re.fullmatch(r'\d{1,6}', (reg or '').replace(' ', '')):
        reg_right = extract_registration_number(right_normalized)
        if reg_right:
            data['registration_number'] = reg_right
    
    # แสดงผลลัพธ์
    import sys
    for key, value in data.items():
        status = '[OK]' if value else '[MISSING]'
        print(f'   {status} {key}: {value or "ไม่พบ"}', file=sys.stderr)
    
    return data


def validate_vaccine_data(data: Dict[str, Optional[str]]) -> Dict[str, bool]:
    """ตรวจสอบความสมบูรณ์ของข้อมูล"""
    validation = {
        'has_vaccine_name': bool(data.get('vaccine_name') or data.get('product_name')),
        'has_serial': bool(data.get('serial_number')),
        'has_dates': bool(data.get('mfg_date') and data.get('exp_date')),
        'has_manufacturer': bool(data.get('manufacturer')),
    }
    
    validation['is_complete'] = all([
        validation['has_vaccine_name'],
        validation['has_serial'],
        validation['has_dates'],
    ])
    
    return validation


THAI_FIELDS = {
    'vaccine_name': 'ชื่อวัคซีน',
    'product_name': 'ชื่อการค้า',
    'manufacturer': 'ผู้ผลิต',
    'registration_number': 'เลขทะเบียน',
    'serial_number': 'Serial Number',
    'mfg_date': 'วันผลิต',
    'exp_date': 'วันหมดอายุ',
}


def format_output_thai(data: Dict[str, Optional[str]]) -> str:
    """จัดรูปแบบข้อมูลเป็นภาษาไทย"""
    lines = []
    for key, thai_name in THAI_FIELDS.items():
        value = data.get(key, 'ไม่พบ') or 'ไม่พบ'
        lines.append(f'{thai_name}: {value}')
    return '\n'.join(lines)


def merge_ocr_results(tess_data: dict, easy_data: dict, hybrid_data: dict) -> dict:
    """รวมผลลัพธ์จาก 3 engine"""
    
    def choose_best(key):
        """เลือกค่าที่ดีที่สุด"""
        h = hybrid_data.get(key)
        e = easy_data.get(key)
        t = tess_data.get(key)
        
        # Hybrid มีความสำคัญสูงสุด
        if h:
            return h, 'hybrid'
        if e:
            return e, 'easyocr'
        if t:
            return t, 'tesseract'
        return None, 'none'
    
    merged = {}
    sources = {}
    
    for field in ['vaccine_name', 'product_name', 'registration_number', 
                  'serial_number', 'mfg_date', 'exp_date']:
        value, source = choose_best(field)
        merged[field] = value
        sources[field] = source
    
    return {
        'data': merged,
        'sources': sources
    }
