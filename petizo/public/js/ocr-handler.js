/**
 * OCR Handler สำหรับสแกนฉลากวัคซีน
 * รองรับการสแกนอัตโนมัติและ auto-fill ข้อมูล
 */

// สแกนฉลากวัคซีน
async function scanVaccineLabel() {
    const fileInput = document.getElementById('recordProofImage');
    const file = fileInput?.files[0];
    
    if (!file) {
        alert('กรุณาอัปโหลดรูปภาพก่อนสแกน');
        return;
    }
    
    // แสดง loading
    const scanButton = document.getElementById('scanButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const scanningLoader = document.getElementById('scanningLoader');
    
    if (scanButton) scanButton.disabled = true;
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    if (scanningLoader) scanningLoader.style.display = 'block';
    
    try {
        // เตรียม FormData
        const formData = new FormData();
        formData.append('image', file);
        
        // เรียก API
        const response = await fetch(`${API_URL}/ocr/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'ไม่สามารถสแกนฉลากได้');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            // แสดงผลลัพธ์ใน console (backend)
            console.log('=== OCR Scan Results ===');
            console.log('Processing Time:', result.processing_time);
            console.log('Data:', result.data);
            console.log('Sources:', result.sources);
            
            // Auto-fill ข้อมูล
            fillVaccineData(result.data);
            
            // แสดงข้อความสำเร็จ
            showNotification('สแกนฉลากสำเร็จ กรุณาตรวจสอบข้อมูลที่กรอกอัตโนมัติ', 'success');
        } else {
            throw new Error('ไม่สามารถอ่านข้อมูลจากฉลากได้');
        }
        
    } catch (error) {
        console.error('OCR Error:', error);
        
        // แสดงข้อความที่เป็นมิตรกับผู้ใช้
        const userMessage = error.message.includes('OCR processing failed') 
            ? 'ระบบ OCR ไม่พร้อมใช้งานในขณะนี้ กรุณากรอกข้อมูลด้วยตนเอง' 
            : 'ไม่สามารถสแกนฉลากได้ กรุณากรอกข้อมูลด้วยตนเอง';
            
        showNotification(userMessage, 'warning');
    } finally {
        // ซ่อน loading และแสดง preview กลับมา
        if (scanButton) scanButton.disabled = false;
        if (scanningLoader) scanningLoader.style.display = 'none';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
    }
}

// Auto-fill ข้อมูลจากผลการสแกน
function fillVaccineData(data) {
    const currentVaccineName = document.getElementById('recordVaccineName')?.value || '';
    
    // ล้างข้อมูลเก่าทั้งหมดก่อน
    clearVaccineFields();
    
    // 1. ตรวจสอบชื่อวัคซีน
    if (data.vaccine_name || data.product_name) {
        const scannedName = data.vaccine_name || data.product_name;
        
        // เปรียบเทียบชื่อ (case-insensitive, partial match)
        const nameMatch = compareVaccineNames(currentVaccineName, scannedName);
        
        if (!nameMatch) {
            const confirmChange = confirm(
                `ชื่อวัคซีนไม่ตรงกัน!\n\n` +
                `ในฟอร์ม: ${currentVaccineName}\n` +
                `จากสแกน: ${scannedName}\n\n` +
                `คุณต้องการใช้ชื่อจากการสแกนหรือไม่?`
            );
            
            if (!confirmChange) {
                console.log('ผู้ใช้เลือกใช้ชื่อวัคซีนเดิม');
            }
        }
    }
    
    // 2. Batch Number (Serial Number)
    if (data.serial_number) {
        const batchInput = document.getElementById('recordBatchNumber');
        if (batchInput) {
            batchInput.value = data.serial_number;
            highlightField(batchInput);
        }
    }
    
    // 3. REG NO (Registration Number)
    if (data.registration_number) {
        const regNoInput = document.getElementById('recordRegNo');
        if (regNoInput) {
            regNoInput.value = data.registration_number;
            highlightField(regNoInput);
        }
    }
    
    // 4. วันที่ผลิต (MFG Date)
    if (data.mfg_date) {
        const mfgDate = convertDateFormat(data.mfg_date);
        const mfgInput = document.getElementById('recordManufactureDate');
        const mfgDisplayInput = document.getElementById('recordManufactureDateDisplay');
        if (mfgInput && mfgDate) {
            mfgInput.value = mfgDate;
            // Update Thai display if exists
            if (mfgDisplayInput && typeof formatDateToThai === 'function') {
                mfgDisplayInput.value = formatDateToThai(mfgDate);
            }
            highlightField(mfgDisplayInput || mfgInput);
        }
    }

    // 5. วันหมดอายุ (EXP Date)
    if (data.exp_date) {
        const expDate = convertDateFormat(data.exp_date);
        const expInput = document.getElementById('recordExpiryDate');
        const expDisplayInput = document.getElementById('recordExpiryDateDisplay');
        if (expInput && expDate) {
            expInput.value = expDate;
            // Update Thai display if exists
            if (expDisplayInput && typeof formatDateToThai === 'function') {
                expDisplayInput.value = formatDateToThai(expDate);
            }
            highlightField(expDisplayInput || expInput);
        }
    }
    
    console.log('Auto-fill completed:', {
        batch_number: data.serial_number,
        reg_no: data.registration_number,
        mfg_date: data.mfg_date,
        exp_date: data.exp_date
    });
}

// เปรียบเทียบชื่อวัคซีน
function compareVaccineNames(name1, name2) {
    if (!name1 || !name2) return false;
    
    const normalize = (str) => str.toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // ตรงกันเป๊ะ
    if (n1 === n2) return true;
    
    // ตรงบางส่วน
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    // ตรวจสอบคำสำคัญ (เช่น DEFENSOR, NOBIVAC, FELOCELL)
    const keywords1 = n1.split(' ').filter(w => w.length > 3);
    const keywords2 = n2.split(' ').filter(w => w.length > 3);
    
    for (const kw1 of keywords1) {
        for (const kw2 of keywords2) {
            if (kw1 === kw2 || kw1.includes(kw2) || kw2.includes(kw1)) {
                return true;
            }
        }
    }
    
    return false;
}

// ล้างฟิลด์ข้อมูลวัคซีนทั้งหมด
function clearVaccineFields() {
    const fields = [
        'recordBatchNumber',
        'recordRegNo',
        'recordManufactureDate',
        'recordExpiryDate'
    ];

    const displayFields = [
        'recordManufactureDateDisplay',
        'recordExpiryDateDisplay'
    ];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.style.backgroundColor = '';
            field.style.borderColor = '';
        }
    });

    // Clear Thai display fields too
    displayFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.style.backgroundColor = '';
            field.style.borderColor = '';
        }
    });

    console.log('Cleared all vaccine fields before auto-fill');
}

// แปลงรูปแบบวันที่ (01 JAN 2024 → 2024-01-01)
function convertDateFormat(dateStr) {
    if (!dateStr) return null;
    
    const monthMap = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    };
    
    // รูปแบบ: "01 JAN 2024"
    const pattern = /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i;
    const match = dateStr.match(pattern);
    
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = monthMap[match[2].toUpperCase()];
        const year = match[3];
        
        if (month) {
            return `${year}-${month}-${day}`;
        }
    }
    
    return null;
}

// Highlight ฟิลด์ที่ถูก auto-fill
function highlightField(element) {
    if (!element) return;
    
    element.style.transition = 'all 0.3s';
    element.style.backgroundColor = '#e6fffb';
    element.style.borderColor = '#52c41a';
    
    setTimeout(() => {
        element.style.backgroundColor = '';
        element.style.borderColor = '';
    }, 2000);
}

// แสดงการแจ้งเตือน
function showNotification(message, type = 'info') {
    const styles = {
        success: { bg: '#52c41a', icon: '✓' },
        error: { bg: '#ff4d4f', icon: '✗' },
        info: { bg: '#00bcd4', icon: 'ℹ' },
        warning: { bg: '#faad14', icon: '⚠' }
    };
    
    const style = styles[type] || styles.info;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${style.bg};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    notification.textContent = `${style.icon} ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions
if (typeof window !== 'undefined') {
    window.scanVaccineLabel = scanVaccineLabel;
    window.fillVaccineData = fillVaccineData;
    window.showNotification = showNotification;
}
