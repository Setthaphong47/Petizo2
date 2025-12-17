const sqlite3 = require('sqlite3').verbose();

console.log('กำลังเพิ่มตาราง password_resets...\n');

const db = new sqlite3.Database('./data/petizo.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        console.log('เชื่อมต่อ database สำเร็จ\n');
        addPasswordResetsTable();
    }
});

function addPasswordResetsTable() {
    // สร้างตาราง password_resets
    db.run(`
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            user_type TEXT NOT NULL CHECK(user_type IN ('admin', 'member')),
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating password_resets table:', err);
            process.exit(1);
        } else {
            console.log('ตาราง password_resets สร้างเสร็จแล้ว');

            // สร้าง indexes
            db.run('CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)', (err) => {
                if (err) console.error('Error creating token index:', err);
                else console.log('สร้าง index สำหรับ token เสร็จแล้ว');
            });

            db.run('CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email)', (err) => {
                if (err) console.error('Error creating email index:', err);
                else console.log('สร้าง index สำหรับ email เสร็จแล้ว');

                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Migration สำเร็จ! 🎉');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                db.close();
                process.exit(0);
            });
        }
    });
}
