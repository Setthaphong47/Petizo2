const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/petizo.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

console.log('🔍 Looking for blogs created today (Dec 8, 2025):\n');

db.all(
    `SELECT id, title, slug, status, created_at, published_at FROM blogs WHERE created_at >= '2025-12-08' ORDER BY created_at DESC`,
    [],
    (err, todayBlogs) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            process.exit(1);
        }

        if (todayBlogs.length > 0) {
            console.log(`Found ${todayBlogs.length} blog(s) created today:\n`);
            todayBlogs.forEach(blog => {
                console.log('='.repeat(80));
                console.log(`ID: ${blog.id}`);
                console.log(`Title: ${blog.title}`);
                console.log(`Slug: ${blog.slug}`);
                console.log(`Status: ${blog.status}`);
                console.log(`Created: ${blog.created_at}`);
                console.log(`Published: ${blog.published_at || 'Not published'}`);
                console.log(`\nTest URLs:`);
                console.log(`  By ID: blog-detail.html?id=${blog.id}`);
                console.log(`  By Slug: blog-detail.html?id=${encodeURIComponent(blog.slug)}`);
                console.log('');
            });
        } else {
            console.log('No blogs created today\n');
            console.log('📝 Showing most recent blog instead:\n');
            
            db.get(`SELECT id, title, slug, status, created_at, published_at FROM blogs ORDER BY created_at DESC LIMIT 1`, [], (err2, latest) => {
                if (err2 || !latest) {
                    console.log('No blogs found');
                    db.close();
                    return;
                }
                
                console.log('='.repeat(80));
                console.log(`ID: ${latest.id}`);
                console.log(`Title: ${latest.title}`);
                console.log(`Slug: ${latest.slug}`);
                console.log(`Status: ${latest.status}`);
                console.log(`Created: ${latest.created_at}`);
                console.log(`Published: ${latest.published_at || 'Not published'}`);
                
                db.close();
            });
        }
    }
);
