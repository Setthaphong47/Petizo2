const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/petizo.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to database\n');
});

// Check for the specific ID
const searchId = -1765133828580;

console.log('🔍 Searching for blog with ID:', searchId);
console.log('-------------------------------------------\n');

// Try different ID formats
db.all(`SELECT id, title, slug, status, published_at, created_at FROM blogs`, [], (err, rows) => {
    if (err) {
        console.error('Error fetching blogs:', err);
        db.close();
        process.exit(1);
    }

    console.log(`📊 Total blogs in database: ${rows.length}\n`);

    // Find by exact ID match
    const exactMatch = rows.find(r => r.id === searchId || r.id === String(searchId));
    
    // Find by similar ID (contains the number)
    const similarMatches = rows.filter(r => 
        String(r.id).includes('1765133828580') || 
        r.id === searchId ||
        r.id === Math.abs(searchId)
    );

    if (exactMatch) {
        console.log('Found exact match:');
        console.log(JSON.stringify(exactMatch, null, 2));
    } else if (similarMatches.length > 0) {
        console.log('⚠️  Found similar matches:');
        similarMatches.forEach(match => {
            console.log('\n---');
            console.log(JSON.stringify(match, null, 2));
        });
    } else {
        console.log('No blog found with ID containing:', searchId);
        console.log('\n📝 All blog IDs in database:');
        rows.forEach(r => {
            console.log(`  ID: ${r.id} (type: ${typeof r.id}) | Title: ${r.title} | Status: ${r.status}`);
        });
    }

    db.close();
});
