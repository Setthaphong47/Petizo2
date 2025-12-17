const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

// List blogs with featured images
db.all('SELECT id, title, featured_image, status FROM blogs ORDER BY id', [], (err, rows) => {
    if (err) {
        console.error('Error fetching blogs:', err);
        process.exit(1);
    }

    console.log('\n📸 รูปภาพในแต่ละบทความ:\n');

    if (rows.length === 0) {
        console.log('ไม่มีบทความ\n');
    } else {
        rows.forEach(blog => {
            const imageStatus = blog.featured_image ? '' : '';
            console.log(`${imageStatus} Blog ID: ${blog.id}`);
            console.log(`   Title: ${blog.title}`);
            console.log(`   Image: ${blog.featured_image || 'ไม่มีรูป'}`);
            console.log(`   Status: ${blog.status}\n`);
        });
    }

    db.close();
});
