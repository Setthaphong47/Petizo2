const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database\n');
});

// Check table structure
db.all("PRAGMA table_info(blogs)", (err, columns) => {
    if (err) {
        console.error('Error getting table info:', err.message);
        db.close();
        return;
    }

    console.log('📋 Table structure:');
    const hasSlug = columns.some(col => col.name === 'slug');
    console.log('   Has slug column:', hasSlug ? 'YES' : 'NO');
    console.log('   Has views column:', columns.some(col => col.name === 'views') ? 'YES' : 'NO');

    // List all blogs
    db.all("SELECT id, title, views, status FROM blogs", (err, blogs) => {
        if (err) {
            console.error('Error getting blogs:', err.message);
        } else {
            console.log('\n📊 Blogs in database:');
            blogs.forEach(blog => {
                console.log(`   ID: ${blog.id} | Title: ${blog.title.substring(0, 50)} | Views: ${blog.views} | Status: ${blog.status}`);
            });
        }
        db.close();
    });
});
