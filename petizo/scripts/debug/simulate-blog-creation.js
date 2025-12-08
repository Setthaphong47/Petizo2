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

// Test slugify function (matching server.js)
const slugify = (s) => {
    if (!s) return '';
    
    let slug = s.toString().trim();
    slug = slug.replace(/\s+/g, '-');
    slug = slug.replace(/[^\u0E00-\u0E7F\w\-]/g, '');
    slug = slug.replace(/\-\-+/g, '-');
    slug = slug.replace(/^-+|-+$/g, '');
    
    if (!slug || slug === '-' || slug.length === 0) {
        slug = 'post-' + Date.now();
    }
    
    return slug;
};

// Simulate creating a new blog
console.log('🧪 Simulating blog creation...\n');

const testBlog = {
    admin_id: 1,
    title: 'ทดสอบสร้างบทความใหม่',
    content: 'นี่คือเนื้อหาทดสอบ',
    excerpt: 'สรุปย่อ',
    featured_image: null,
    category: 'สุขภาพ',
    tags: JSON.stringify(['ทดสอบ']),
    source_name: null,
    source_url: null,
    status: 'draft',
    published_at: null
};

// Get next ID
db.get('SELECT MAX(id) as maxId FROM blogs', [], (err, row) => {
    if (err) {
        console.error('❌ Error:', err);
        db.close();
        return;
    }

    const nextId = (row.maxId || 0) + 1;
    const titleSlug = slugify(testBlog.title);
    const slug = `${nextId}-${titleSlug}`;

    console.log('Next ID:', nextId);
    console.log('Title:', testBlog.title);
    console.log('Title slug:', titleSlug);
    console.log('Full slug:', slug);
    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️  THIS IS A DRY RUN - No data will be inserted');
    console.log('To actually insert, uncomment the db.run() code below\n');

    // Uncomment below to actually insert
    /*
    db.run(
        `INSERT INTO blogs (admin_id, title, slug, content, excerpt, featured_image, category, tags, source_name, source_url, status, published_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [testBlog.admin_id, testBlog.title, slug, testBlog.content, testBlog.excerpt, testBlog.featured_image, 
         testBlog.category, testBlog.tags, testBlog.source_name, testBlog.source_url, testBlog.status, testBlog.published_at],
        function(err) {
            if (err) {
                console.error('❌ Insert error:', err);
            } else {
                console.log('✅ Blog inserted! ID:', this.lastID);
            }
            db.close();
        }
    );
    */

    db.close();
});
