const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

db.all('SELECT id, name, breed, photo_url FROM pets ORDER BY id', [], (err, rows) => {
    if (err) {
        console.error('Error fetching pets:', err);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🐾 รายการสัตว์เลี้ยงและรูปภาพ');
    console.log('='.repeat(80) + '\n');

    if (rows.length === 0) {
        console.log('ไม่มีสัตว์เลี้ยง\n');
    } else {
        rows.forEach((pet, index) => {
            console.log(`${index + 1}. 🐕 ${pet.name}`);
            console.log(`   ID: ${pet.id}`);
            console.log(`   พันธุ์: ${pet.breed || 'ไม่ระบุ'}`);

            if (pet.photo_url) {
                const filename = pet.photo_url.replace('/uploads/', '');
                const localPath = path.join(__dirname, 'uploads', filename);
                const fileExists = fs.existsSync(localPath);

                console.log(`   🖼️  ไฟล์รูป: ${filename}`);
                console.log(`   📁 Path: uploads/${filename}`);
                console.log(`   ${fileExists ? 'มีไฟล์อยู่' : 'ไม่พบไฟล์'}`);
            } else {
                console.log(`   ไม่มีรูป`);
            }

            console.log('');
        });
    }

    console.log('='.repeat(80));
    console.log(`📊 จำนวนสัตว์เลี้ยงทั้งหมด: ${rows.length} ตัว`);
    console.log(`🖼️  จำนวนที่มีรูป: ${rows.filter(p => p.photo_url).length} ตัว`);
    console.log('='.repeat(80) + '\n');

    db.close();
});
