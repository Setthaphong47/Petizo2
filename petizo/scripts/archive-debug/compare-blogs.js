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

console.log('📊 Comparing blog structures:\n');
console.log('='.repeat(80));

db.all(
    `SELECT id, title, slug, status, created_at, published_at FROM blogs ORDER BY id DESC`,
    [],
    (err, rows) => {
        if (err) {
            console.error('Error:', err);
            db.close();
            process.exit(1);
        }

        console.log(`\n✅ Total blogs: ${rows.length}\n`);

        // Show newest first
        console.log('📝 All blogs (newest first):\n');
        rows.forEach((blog, index) => {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`Blog #${blog.id} ${index === 0 ? '⭐ (NEWEST)' : index === 1 ? '⭐ (2nd NEWEST)' : ''}`);
            console.log(`${'='.repeat(80)}`);
            console.log(`Title: ${blog.title}`);
            console.log(`Slug: ${blog.slug}`);
            console.log(`Status: ${blog.status}`);
            console.log(`Created: ${blog.created_at}`);
            console.log(`Published: ${blog.published_at || 'Not published'}`);
            
            // Generate URLs
            const urlById = `blog-detail.html?id=${blog.id}`;
            const urlBySlug = `blog-detail.html?id=${encodeURIComponent(blog.slug)}`;
            
            console.log(`\n📌 URLs:`);
            console.log(`   By ID:   ${urlById}`);
            console.log(`   By Slug: ${urlBySlug}`);
            
            // Analyze slug quality
            if (blog.slug.startsWith('--') || blog.slug.startsWith('-')) {
                console.log(`\n⚠️  WARNING: Slug starts with dash(es)!`);
            }
            if (blog.slug.match(/\d{13}/)) {
                console.log(`\n⚠️  WARNING: Slug contains timestamp!`);
            }
            if (blog.slug.includes('--')) {
                console.log(`\n⚠️  WARNING: Slug contains double dashes!`);
            }
            
            // Check if slug is URL-encoded
            if (blog.slug !== decodeURIComponent(blog.slug)) {
                console.log(`\n✅ Slug is properly encoded for Thai characters`);
            }
        });

        db.close();
    }
);
