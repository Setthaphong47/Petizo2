const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database\n');
});

// Check if blogs table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='blogs'", (err, row) => {
    if (err) {
        console.error('❌ Error checking table:', err.message);
    } else if (row) {
        console.log('✅ Table "blogs" exists\n');

        // Check table structure
        db.all("PRAGMA table_info(blogs)", (err, columns) => {
            if (err) {
                console.error('❌ Error getting table info:', err.message);
            } else {
                console.log('📋 Table "blogs" structure:');
                console.log('Column Name          | Type      | Not Null | Default');
                console.log('---------------------|-----------|----------|--------');
                columns.forEach(col => {
                    const hasViews = col.name === 'views';
                    const marker = hasViews ? '👁️  ' : '   ';
                    console.log(`${marker}${col.name.padEnd(20)}| ${String(col.type).padEnd(9)} | ${col.notnull} | ${col.dflt_value || 'NULL'}`);
                });

                // Check if views column exists
                const hasViews = columns.some(col => col.name === 'views');
                console.log('\n' + (hasViews ? '✅ Column "views" EXISTS' : '❌ Column "views" NOT FOUND'));

                // Count total blogs
                db.get("SELECT COUNT(*) as count FROM blogs", (err, result) => {
                    if (err) {
                        console.error('❌ Error counting blogs:', err.message);
                    } else {
                        console.log(`\n📊 Total blogs in database: ${result.count}`);

                        // Show sample blog with views
                        db.get("SELECT id, title, slug, views FROM blogs LIMIT 1", (err, blog) => {
                            if (blog) {
                                console.log('\n📝 Sample blog:');
                                console.log(`   ID: ${blog.id}`);
                                console.log(`   Title: ${blog.title}`);
                                console.log(`   Slug: ${blog.slug}`);
                                console.log(`   Views: ${blog.views !== null ? blog.views : 'NULL (needs to be added)'}`);
                            }
                            db.close();
                        });
                    }
                });
            }
        });
    } else {
        console.log('❌ Table "blogs" does NOT exist');
        console.log('   The table might be named differently.');

        // List all tables
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (!err && tables) {
                console.log('\n📋 Available tables:');
                tables.forEach(t => console.log(`   - ${t.name}`));
            }
            db.close();
        });
    }
});
