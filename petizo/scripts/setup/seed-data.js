const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'petizo.db');
const sqlPath = path.join(__dirname, '..', '..', 'data', 'seed-data.sql');

console.log('🌱 กำลังเพิ่มข้อมูลตัวอย่าง...\n');

const db = new sqlite3.Database(dbPath);

// อ่าน SQL file
const sql = fs.readFileSync(sqlPath, 'utf8');

// แยก SQL statements (แบ่งด้วย semicolon)
const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

let completed = 0;
statements.forEach((statement, index) => {
    db.run(statement, (err) => {
        if (err) {
            console.error(`❌ Error at statement ${index + 1}:`, err.message);
        }
        completed++;
        
        if (completed === statements.length) {
            // ตรวจสอบข้อมูลที่เพิ่ม
            db.get("SELECT COUNT(*) as count FROM blogs", (err, row) => {
                if (!err) {
                    console.log(`✅ เพิ่ม ${row.count} บทความสำเร็จ`);
                }
            });
            
            db.get("SELECT COUNT(*) as count FROM breeds", (err, row) => {
                if (!err) {
                    console.log(`✅ เพิ่ม ${row.count} พันธุ์สัตว์สำเร็จ`);
                }
            });
            
            db.get("SELECT COUNT(*) as count FROM vaccine_schedules", (err, row) => {
                if (!err) {
                    console.log(`✅ เพิ่ม ${row.count} ตารางวัคซีนสำเร็จ\n`);
                }
                
                db.close(() => {
                    console.log('✨ เพิ่มข้อมูลตัวอย่างเสร็จสมบูรณ์!\n');
                    process.exit(0);
                });
            });
        }
    });
});
