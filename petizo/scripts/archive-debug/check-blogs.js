const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

// Count total blogs
db.get('SELECT COUNT(*) as total FROM blogs', [], (err, row) => {
    if (err) {
        console.error('Error counting blogs:', err);
        process.exit(1);
    }
    console.log(`\n📊 Total blogs: ${row.total}\n`);
});

// List blogs
db.all('SELECT id, title, status, published_at FROM blogs LIMIT 10', [], (err, rows) => {
    if (err) {
        console.error('Error fetching blogs:', err);
        process.exit(1);
    }

    if (rows.length === 0) {
        console.log('No blogs found in database!\n');
    } else {
        console.log('📝 Blogs in database:\n');
        rows.forEach(blog => {
            console.log(`ID: ${blog.id} | Title: ${blog.title} | Status: ${blog.status}`);
        });
        console.log('');
    }

    db.close();
});
