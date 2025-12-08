const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/petizo.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
});

console.log('🔍 Checking blogs table structure:\n');

// Get table info
db.all(`PRAGMA table_info(blogs)`, [], (err, columns) => {
    if (err) {
        console.error('Error getting table info:', err);
        db.close();
        process.exit(1);
    }

    console.log('📊 Blogs table columns:\n');
    columns.forEach(col => {
        console.log(`  ${col.name.padEnd(20)} ${col.type.padEnd(15)} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n🧪 Testing slug generation:\n');

    // Test slugify function (same as server.js)
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

    const testTitles = [
        'ทำไมแมวถึงชอบนอนบนกล่อง',
        'พาน้องๆ สัตว์เลี้ยง น้องหมาและแมวไปจดทะเบียนและฝังไมโครชิป',
        'How to care for your cat',
        'บทความ ทดสอบ 123'
    ];

    testTitles.forEach(title => {
        const slug = slugify(title);
        const fullSlug = slug + '-' + Date.now();
        console.log(`Title: ${title}`);
        console.log(`Slug:  ${slug}`);
        console.log(`Full:  ${fullSlug}`);
        console.log('');
    });

    db.close();
});
