const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('Connected to database\n');
});

// Function to generate slug from Thai/English text
function generateSlug(title) {
    // ใช้ ID แทน title เพราะภาษาไทยทำ slug ยาก
    // หรือจะใช้ transliteration library ถ้าต้องการ
    return title
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-z0-9]+/g, '-') // แปลงอักขระพิเศษเป็น -
        .replace(/^-+|-+$/g, '') // ลบ - ที่ขึ้นต้นและลงท้าย
        .substring(0, 100); // จำกัดความยาว
}

console.log('🔧 Adding slug column to blogs table...\n');

// Step 1: Add slug column (without UNIQUE constraint initially)
db.run("ALTER TABLE blogs ADD COLUMN slug TEXT", (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('⚠️  Column slug already exists, skipping creation');
            generateSlugs();
        } else {
            console.error('Error adding slug column:', err.message);
            db.close();
            return;
        }
    } else {
        console.log('Slug column added successfully\n');
        generateSlugs();
    }
});

function generateSlugs() {
    console.log('📝 Generating slugs for existing blogs...\n');

    // Get all blogs
    db.all("SELECT id, title FROM blogs", (err, blogs) => {
        if (err) {
            console.error('Error getting blogs:', err.message);
            db.close();
            return;
        }

        let completed = 0;
        const total = blogs.length;

        if (total === 0) {
            console.log('No blogs to update');
            db.close();
            return;
        }

        blogs.forEach(blog => {
            // Generate slug: use id + simplified title
            const titleSlug = generateSlug(blog.title);
            const slug = `${blog.id}-${titleSlug}`.substring(0, 100);

            db.run(
                "UPDATE blogs SET slug = ? WHERE id = ?",
                [slug, blog.id],
                function(err) {
                    completed++;

                    if (err) {
                        console.error(`Error updating blog ${blog.id}:`, err.message);
                    } else {
                        console.log(`Blog ${blog.id}: "${blog.title.substring(0, 40)}..." → slug: "${slug}"`);
                    }

                    if (completed === total) {
                        console.log(`\n🎉 Updated ${total} blogs with slugs`);

                        // Verify
                        db.all("SELECT id, title, slug FROM blogs LIMIT 3", (err, rows) => {
                            if (!err && rows) {
                                console.log('\n📊 Sample blogs with slugs:');
                                rows.forEach(r => {
                                    console.log(`   ID: ${r.id} | Slug: ${r.slug}`);
                                });
                            }
                            db.close();
                        });
                    }
                }
            );
        });
    });
}
