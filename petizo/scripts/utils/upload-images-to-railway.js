const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Railway URL - เปลี่ยนเป็น URL ของคุณ
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://petizo2-production.up.railway.app';
const ADMIN_EMAIL = 'admin@petizo.com';
const ADMIN_PASSWORD = 'admin123';

const uploadsDir = path.join(__dirname, 'data', 'uploads');

async function login() {
    console.log('🔐 Logging in as admin...');
    const response = await fetch(`${RAILWAY_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    
    if (!response.ok) {
        throw new Error('Login failed');
    }
    
    const data = await response.json();
    console.log('✅ Login successful');
    return data.token;
}

async function uploadFile(token, filePath, fileName) {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), fileName);
        
        const response = await fetch(`${RAILWAY_URL}/api/admin/upload-file`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            console.log(`  ✅ ${fileName}`);
            return true;
        } else {
            console.log(`  ❌ ${fileName} - ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log(`  ❌ ${fileName} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('📤 Starting upload images to Railway...\n');
    
    // Login
    const token = await login();
    
    // Get all files
    const files = fs.readdirSync(uploadsDir).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    
    console.log(`\n📁 Found ${files.length} images to upload\n`);
    
    let success = 0;
    let failed = 0;
    
    for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const result = await uploadFile(token, filePath, file);
        if (result) success++;
        else failed++;
        
        // Delay เล็กน้อยเพื่อไม่ให้ถล่ม server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Success: ${success}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📦 Total: ${files.length}`);
}

main().catch(console.error);
