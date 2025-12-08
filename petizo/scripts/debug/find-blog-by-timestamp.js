const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/petizo.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('✅ Connected to database\n');
});

// Timestamp from the URL
const timestamp = 1765133828580;
const date = new Date(timestamp);

console.log('🔍 Searching for blogs created around:', date.toLocaleString('th-TH'));
console.log('-------------------------------------------\n');

// Look for blogs created around that time (within 1 hour)
const startTime = new Date(timestamp - 3600000).toISOString(); // 1 hour before
const endTime = new Date(timestamp + 3600000).toISOString(); // 1 hour after

db.all(
    `SELECT id, title, slug, status, created_at, published_at 
     FROM blogs 
     WHERE created_at BETWEEN ? AND ?
     ORDER BY created_at DESC`,
    [startTime, endTime],
    (err, rows) => {
        if (err) {
            console.error('Error fetching blogs:', err);
            db.close();
            process.exit(1);
        }

        if (rows.length === 0) {
            console.log('❌ No blogs found created around that time\n');
            console.log('📝 Let\'s check the most recent blogs instead:\n');
            
            // Show the 5 most recent blogs
            db.all(
                `SELECT id, title, slug, status, created_at, published_at FROM blogs ORDER BY created_at DESC LIMIT 5`,
                [],
                (err2, recentRows) => {
                    if (err2) {
                        console.error('Error:', err2);
                        db.close();
                        return;
                    }
                    
                    console.log('Most recent blogs:');
                    recentRows.forEach(r => {
                        console.log(`\nID: ${r.id}`);
                        console.log(`Title: ${r.title}`);
                        console.log(`Slug: ${r.slug}`);
                        console.log(`Status: ${r.status}`);
                        console.log(`Created: ${r.created_at}`);
                    });
                    
                    db.close();
                }
            );
        } else {
            console.log(`✅ Found ${rows.length} blog(s) created around that time:\n`);
            rows.forEach(r => {
                console.log(`ID: ${r.id}`);
                console.log(`Title: ${r.title}`);
                console.log(`Slug: ${r.slug}`);
                console.log(`Status: ${r.status}`);
                console.log(`Created: ${r.created_at}`);
                console.log('---\n');
            });
            db.close();
        }
    }
);
