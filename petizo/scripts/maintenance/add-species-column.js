const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'petizo.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Starting migration: Add species column to pets table...\n');

db.serialize(() => {
    // 1. เพิ่มคอลัมน์ species
    db.run(`ALTER TABLE pets ADD COLUMN species TEXT DEFAULT 'cat'`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('✅ Column "species" already exists, skipping...');
            } else {
                console.error('❌ Error adding column:', err.message);
                return;
            }
        } else {
            console.log('✅ Added column "species" to pets table');
        }

        // 2. อัปเดตข้อมูลเดิมให้เป็น 'cat' (แมว)
        db.run(`UPDATE pets SET species = 'cat' WHERE species IS NULL OR species = ''`, function(err) {
            if (err) {
                console.error('❌ Error updating existing data:', err.message);
            } else {
                console.log(`✅ Updated ${this.changes} existing pet(s) to species = 'cat'`);
            }

            // 3. ตรวจสอบผลลัพธ์
            db.all(`SELECT species, COUNT(*) as count FROM pets GROUP BY species`, (err, rows) => {
                if (err) {
                    console.error('❌ Error checking results:', err.message);
                } else {
                    console.log('\n📊 Current pet species distribution:');
                    rows.forEach(row => {
                        console.log(`   ${row.species || '(null)'}: ${row.count} pet(s)`);
                    });
                }

                console.log('\n🎉 Migration completed successfully!');
                db.close();
            });
        });
    });
});
