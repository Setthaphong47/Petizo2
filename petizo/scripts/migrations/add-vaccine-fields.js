/**
 * เพิ่มฟิลด์ใหม่ให้ตาราง vaccinations:
 * - registration_number (REG NO)
 * - manufacture_date (วันที่ผลิต)
 * - expiry_date (วันหมดอายุ)
 */

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./petizo.db');

console.log('🔧 กำลังเพิ่มฟิลด์ใหม่ให้ตาราง vaccinations...\n');

// เพิ่มฟิลด์ทีละตัว
const alterQueries = [
    {
        name: 'registration_number',
        query: `ALTER TABLE vaccinations ADD COLUMN registration_number TEXT`,
        description: 'เลขทะเบียนวัคซีน (REG NO)'
    },
    {
        name: 'manufacture_date',
        query: `ALTER TABLE vaccinations ADD COLUMN manufacture_date DATE`,
        description: 'วันที่ผลิต'
    },
    {
        name: 'expiry_date',
        query: `ALTER TABLE vaccinations ADD COLUMN expiry_date DATE`,
        description: 'วันหมดอายุ'
    }
];

let completed = 0;
let errors = 0;

alterQueries.forEach((item, index) => {
    db.run(item.query, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`⚠️  ${item.name} - มีอยู่แล้ว`);
            } else {
                console.error(`${item.name} - Error:`, err.message);
                errors++;
            }
        } else {
            console.log(`${item.name} - ${item.description}`);
        }
        
        completed++;
        
        // ถ้าเสร็จหมดแล้ว
        if (completed === alterQueries.length) {
            console.log('\n' + '='.repeat(50));
            if (errors === 0) {
                console.log('เพิ่มฟิลด์สำเร็จทั้งหมด!');
            } else {
                console.log(`⚠️  เพิ่มฟิลด์เสร็จสิ้น (มี ${errors} ข้อผิดพลาด)`);
            }
            console.log('='.repeat(50) + '\n');
            
            // แสดงโครงสร้างตารางใหม่
            db.all('PRAGMA table_info(vaccinations)', (err, rows) => {
                if (!err) {
                    console.log('📋 โครงสร้างตาราง vaccinations ปัจจุบัน:\n');
                    rows.forEach(row => {
                        console.log(`   ${row.cid + 1}. ${row.name.padEnd(25)} ${row.type.padEnd(10)} ${row.notnull ? 'NOT NULL' : ''}`);
                    });
                    console.log('');
                }
                db.close();
            });
        }
    });
});
