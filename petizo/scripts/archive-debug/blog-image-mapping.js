const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

db.all('SELECT id, title, featured_image, status FROM blogs WHERE status = "published" ORDER BY id', [], (err, rows) => {
    if (err) {
        console.error('Error fetching blogs:', err);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 รายการบทความและรูปภาพที่ใช้');
    console.log('='.repeat(80) + '\n');

    rows.forEach((blog, index) => {
        console.log(`${index + 1}. 📝 ${blog.title}`);
        console.log(`   ID: ${blog.id}`);

        if (blog.featured_image) {
            // Extract filename from path
            const filename = blog.featured_image.replace('/uploads/', '');
            const localPath = path.join(__dirname, 'uploads', filename);
            const fileExists = fs.existsSync(localPath);

            console.log(`   🖼️  ไฟล์รูป: ${filename}`);
            console.log(`   📁 Path: uploads/${filename}`);
            console.log(`   ${fileExists ? '✅ มีไฟล์อยู่' : '❌ ไม่พบไฟล์'}`);
        } else {
            console.log(`   ❌ ไม่มีรูป`);
        }

        console.log('');
    });

    console.log('='.repeat(80));
    console.log('💡 วิธีใช้:');
    console.log('   1. หาไฟล์รูปใน folder: uploads/');
    console.log('   2. เข้า Admin Panel → Blogs → Edit บทความ');
    console.log('   3. Upload รูปใหม่ตามชื่อบทความด้านบน');
    console.log('='.repeat(80) + '\n');

    db.close();
});
