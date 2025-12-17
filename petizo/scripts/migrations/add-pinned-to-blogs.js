const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/petizo.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Adding pinned column to blogs table...');

db.run(`
    ALTER TABLE blogs ADD COLUMN pinned INTEGER DEFAULT 0
`, (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('✅ Column "pinned" already exists');
        } else {
            console.error('❌ Error adding pinned column:', err.message);
        }
    } else {
        console.log('✅ Successfully added pinned column to blogs table');
    }

    db.close((closeErr) => {
        if (closeErr) {
            console.error('Error closing database:', closeErr.message);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(err && !err.message.includes('duplicate') ? 1 : 0);
    });
});
