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

// Improved slugify function that supports Thai
const slugify = (s) => {
    if (!s) return '';
    
    // Convert to string and trim
    let slug = s.toString().trim();
    
    // For Thai content, use URL encoding approach
    // Replace spaces with hyphens
    slug = slug.replace(/\s+/g, '-');
    
    // Remove special characters but keep Thai Unicode, alphanumeric, and hyphens
    // Keep Unicode letters (including Thai), numbers, and hyphens
    slug = slug.replace(/[^\u0E00-\u0E7F\w\-]/g, '');
    
    // Replace multiple consecutive hyphens with single hyphen
    slug = slug.replace(/\-\-+/g, '-');
    
    // Remove leading/trailing hyphens
    slug = slug.replace(/^-+|-+$/g, '');
    
    // If slug is empty or just hyphens after processing, use timestamp
    if (!slug || slug === '-' || slug.length === 0) {
        slug = 'post-' + Date.now();
    }
    
    return slug;
};

// Find blogs with problematic slugs (starting with -- or just numbers)
db.all(`SELECT id, title, slug FROM blogs WHERE slug LIKE '--%' OR slug LIKE '%---%'`, [], (err, rows) => {
    if (err) {
        console.error('Error fetching blogs:', err);
        db.close();
        process.exit(1);
    }

    if (rows.length === 0) {
        console.log('✅ No problematic slugs found\n');
        db.close();
        return;
    }

    console.log(`⚠️  Found ${rows.length} blog(s) with problematic slugs:\n`);
    
    let updates = 0;
    let processed = 0;

    rows.forEach((blog) => {
        console.log(`ID: ${blog.id}`);
        console.log(`Title: ${blog.title}`);
        console.log(`Current slug: ${blog.slug}`);
        
        // Generate new slug from title
        const titleSlug = slugify(blog.title);
        const newSlug = `${titleSlug}-${blog.id}`;
        
        console.log(`New slug: ${newSlug}\n`);

        // Update the blog
        db.run(
            `UPDATE blogs SET slug = ? WHERE id = ?`,
            [newSlug, blog.id],
            function(updateErr) {
                processed++;
                
                if (updateErr) {
                    console.error(`❌ Error updating blog ${blog.id}:`, updateErr);
                } else {
                    updates++;
                    console.log(`✅ Updated blog ${blog.id}`);
                }

                // Close database after processing all rows
                if (processed === rows.length) {
                    console.log(`\n✅ Updated ${updates} out of ${rows.length} blogs`);
                    db.close();
                }
            }
        );
    });
});
