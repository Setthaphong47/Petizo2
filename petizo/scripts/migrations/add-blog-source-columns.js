const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

console.log('📝 Adding source_name and source_url columns to blogs table...\n');

// Check if columns already exist
db.all("PRAGMA table_info(blogs)", (err, columns) => {
    if (err) {
        console.error('❌ Error checking table info:', err.message);
        db.close();
        process.exit(1);
    }

    const hasSourceName = columns.some(col => col.name === 'source_name');
    const hasSourceUrl = columns.some(col => col.name === 'source_url');

    if (hasSourceName && hasSourceUrl) {
        console.log('✅ Columns source_name and source_url already exist');
        db.close();
        return;
    }

    // Add source_name column if not exists
    if (!hasSourceName) {
        db.run("ALTER TABLE blogs ADD COLUMN source_name TEXT", (err) => {
            if (err) {
                console.error('❌ Error adding source_name:', err.message);
            } else {
                console.log('✅ Added column: source_name');
            }
        });
    }

    // Add source_url column if not exists
    if (!hasSourceUrl) {
        db.run("ALTER TABLE blogs ADD COLUMN source_url TEXT", (err) => {
            if (err) {
                console.error('❌ Error adding source_url:', err.message);
            } else {
                console.log('✅ Added column: source_url');
            }
            
            // Close database after last operation
            setTimeout(() => {
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    } else {
                        console.log('\n✅ Migration completed successfully!');
                    }
                });
            }, 100);
        });
    } else {
        // Close if only source_name was added
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('\n✅ Migration completed successfully!');
                }
            });
        }, 100);
    }
});
