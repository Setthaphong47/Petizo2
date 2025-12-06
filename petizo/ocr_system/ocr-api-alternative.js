// ====================================================
// ตัวอย่าง: ใช้ OCR.space API แทน Python OCR
// ====================================================

const FormData = require('form-data');
const fs = require('fs');

/**
 * OCR using OCR.space API (Free tier: 25,000 requests/month)
 * Get API key from: https://ocr.space/ocrapi
 */
async function scanVaccineWithOCRSpace(imagePath) {
    const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;
    
    if (!OCR_SPACE_API_KEY) {
        throw new Error('OCR_SPACE_API_KEY not configured');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));
    formData.append('apikey', OCR_SPACE_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
    });

    const result = await response.json();
    
    if (result.IsErroredOnProcessing) {
        throw new Error('OCR processing failed: ' + result.ErrorMessage);
    }

    const text = result.ParsedResults[0]?.ParsedText || '';
    
    // Extract vaccine data from text
    return extractVaccineData(text);
}

/**
 * Extract vaccine information from OCR text
 */
function extractVaccineData(text) {
    const data = {
        vaccine_name: null,
        batch_number: null,
        registration_number: null,
        manufacture_date: null,
        expiry_date: null,
        product_name: null
    };

    // Extract vaccine name (e.g., DEFENSOR 3, FELOCELL)
    const vaccineMatch = text.match(/(DEFENSOR|FELOCELL|NOBIVAC|RABISIN)\s*\d*/i);
    if (vaccineMatch) {
        data.product_name = vaccineMatch[0].toUpperCase();
    }

    // Extract batch number (e.g., LOT: ABC123, BATCH: 12345)
    const batchMatch = text.match(/(?:LOT|BATCH|SER)[:\s]*([A-Z0-9\-]+)/i);
    if (batchMatch) {
        data.batch_number = batchMatch[1];
    }

    // Extract registration number (e.g., REG NO: 123/456)
    const regMatch = text.match(/REG(?:\s+NO)?[:\s]*([A-Z0-9\s\/\-()]+)/i);
    if (regMatch) {
        data.registration_number = regMatch[1].trim();
    }

    // Extract dates (MFG, EXP)
    const mfgMatch = text.match(/MFG[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (mfgMatch) {
        data.manufacture_date = normalizeDate(mfgMatch[1]);
    }

    const expMatch = text.match(/EXP[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    if (expMatch) {
        data.expiry_date = normalizeDate(expMatch[1]);
    }

    return data;
}

/**
 * Normalize date format to YYYY-MM-DD
 */
function normalizeDate(dateStr) {
    // Handle various date formats
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
        let [month, day, year] = parts;
        
        // Convert 2-digit year to 4-digit
        if (year.length === 2) {
            year = '20' + year;
        }
        
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
}

module.exports = {
    scanVaccineWithOCRSpace,
    extractVaccineData
};
