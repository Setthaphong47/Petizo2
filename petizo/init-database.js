const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

console.log('🚀 กำลังสร้าง Database...\n');

// สร้าง data folder ถ้ายังไม่มี
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ สร้าง data folder เรียบร้อย\n');
}

const db = new sqlite3.Database('./data/petizo.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
        process.exit(1);
    } else {
        console.log('✅ เชื่อมต่อ SQLite database สำเร็จ\n');
        createTables();
    }
});

function createTables() {
    console.log('📋 กำลังสร้างตาราง...\n');

    // ตาราง Admins (ผู้ดูแลระบบ)
    db.run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('❌ Error creating admins table:', err);
        else console.log('✅ ตาราง admins สร้างเสร็จแล้ว');
    });

    // ตาราง Members (สมาชิกทั่วไป)
    db.run(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            is_hidden INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('❌ Error creating members table:', err);
        else console.log('✅ ตาราง members สร้างเสร็จแล้ว');
    });

    // ตาราง Pets (เชื่อมกับ members)
    db.run(`
        CREATE TABLE IF NOT EXISTS pets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            breed TEXT,
            gender TEXT CHECK(gender IN ('male', 'female')),
            birth_date DATE,
            color TEXT,
            weight REAL,
            microchip_id TEXT,
            photo_url TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('❌ Error creating pets table:', err);
        else console.log('✅ ตาราง pets สร้างเสร็จแล้ว');
    });

    // ตาราง Vaccine Schedules
    db.run(`
        CREATE TABLE IF NOT EXISTS vaccine_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vaccine_name TEXT NOT NULL,
            age_weeks_min INTEGER NOT NULL,
            age_weeks_max INTEGER,
            is_booster INTEGER DEFAULT 0,
            frequency_years INTEGER,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('❌ Error creating vaccine_schedules table:', err);
        else console.log('✅ ตาราง vaccine_schedules สร้างเสร็จแล้ว');
    });

    // ตาราง Vaccinations
    db.run(`
        CREATE TABLE IF NOT EXISTS vaccinations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pet_id INTEGER NOT NULL,
            vaccine_name TEXT NOT NULL,
            vaccine_type TEXT,
            vaccination_date DATE NOT NULL,
            next_due_date DATE,
            veterinarian TEXT,
            clinic_name TEXT,
            batch_number TEXT,
            notes TEXT,
            schedule_id INTEGER,
            proof_image TEXT,
            status TEXT DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
            FOREIGN KEY (schedule_id) REFERENCES vaccine_schedules(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating vaccinations table:', err);
        else console.log('✅ ตาราง vaccinations สร้างเสร็จแล้ว');
    });

    // ตาราง Blog Posts (เชื่อมกับ admins) - สร้างทั้ง blog_posts และ blogs
    db.run(`
        CREATE TABLE IF NOT EXISTS blog_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            featured_image TEXT,
            category TEXT,
            tags TEXT,
            source_name TEXT,
            source_url TEXT,
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
            published_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES admins(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating blog_posts table:', err);
        else console.log('✅ ตาราง blog_posts สร้างเสร็จแล้ว');
    });

    // ตาราง blogs (เหมือน blog_posts - สำหรับ compatibility)
    db.run(`
        CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            featured_image TEXT,
            category TEXT,
            tags TEXT,
            source_name TEXT,
            source_url TEXT,
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
            views INTEGER DEFAULT 0,
            published_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES admins(id)
        )
    `, (err) => {
        if (err) console.error('❌ Error creating blogs table:', err);
        else console.log('✅ ตาราง blogs สร้างเสร็จแล้ว');
    });

    // ตาราง Chat History (เชื่อมกับ members)
    db.run(`
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
        )
    `, (err) => {
        if (err) console.error('❌ Error creating chat_history table:', err);
        else console.log('✅ ตาราง chat_history สร้างเสร็จแล้ว');
    });

    // ตาราง Breeds
    db.run(`
        CREATE TABLE IF NOT EXISTS breeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('❌ Error creating breeds table:', err);
        else console.log('✅ ตาราง breeds สร้างเสร็จแล้ว');
    });

    // สร้าง Indexes
    setTimeout(() => {
        console.log('\n📊 กำลังสร้าง Indexes...\n');
        
        db.run('CREATE INDEX IF NOT EXISTS idx_pets_member_id ON pets(member_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_id ON vaccinations(pet_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_vaccinations_schedule_id ON vaccinations(schedule_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_vaccine_schedules_age ON vaccine_schedules(age_weeks_min, age_weeks_max)');
        db.run('CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)');
        db.run('CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)');
        db.run('CREATE INDEX IF NOT EXISTS idx_blog_posts_admin_id ON blog_posts(admin_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_chat_history_member_id ON chat_history(member_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)');
        db.run('CREATE INDEX IF NOT EXISTS idx_members_email ON members(email)');
        
        console.log('✅ Indexes สร้างเสร็จแล้ว\n');
        
        createSampleData();
    }, 1000);
}

async function createSampleData() {
    console.log('👤 กำลังสร้างผู้ใช้งานตัวอย่าง...\n');

    try {
        // สร้าง Admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        db.run(`
            INSERT OR IGNORE INTO admins (username, email, password, full_name, phone) 
            VALUES ('admin', 'admin@petizo.com', ?, 'ผู้ดูแลระบบ', '0981234765')
        `, [adminPassword], function(err) {
            if (err) {
                console.error('❌ Error creating admin:', err);
            } else if (this.changes > 0) {
                console.log('✅ สร้าง Admin สำเร็จ');
                console.log('   📧 Email: admin@petizo.com');
                console.log('   🔑 Password: admin123\n');
            } else {
                console.log('ℹ️  Admin มีอยู่แล้ว\n');
            }
        });

        // สร้าง Member
        const memberPassword = await bcrypt.hash('user123', 10);
        
        db.run(`
            INSERT OR IGNORE INTO members (username, email, password, full_name, phone) 
            VALUES ('testuser', 'user@petizo.com', ?, 'ผู้ใช้ทดสอบ', '081-234-5678')
        `, [memberPassword], function(err) {
            if (err) {
                console.error('❌ Error creating test member:', err);
            } else if (this.changes > 0) {
                console.log('✅ สร้าง Test Member สำเร็จ');
                console.log('   📧 Email: user@petizo.com');
                console.log('   🔑 Password: user123\n');
            }
        });

        // เพิ่มตัวอย่าง Vaccine Schedules
        setTimeout(() => {
            const vaccines = [
                ['FVRCP (ครั้งที่ 1)', 6, 8, 0, null, 'ป้องกันโรคไข้หวัดแมว, โรคตับอักเสบ, และโรคหวัดหลอดลม'],
                ['FVRCP (ครั้งที่ 2)', 10, 12, 0, null, 'เสริมภูมิคุ้มกัน FVRCP'],
                ['FVRCP (ครั้งที่ 3)', 14, 16, 0, null, 'เสริมภูมิคุ้มกันครั้งสุดท้ายสำหรับลูกแมว'],
                ['Rabies (โรคพิษสุนัขบ้า)', 12, 16, 0, null, 'ป้องกันโรคพิษสุนัขบ้า - บังคับโดยกฎหมาย'],
                ['FVRCP Booster', 52, null, 1, 1, 'วัคซีนบูสเตอร์ประจำปี'],
                ['Rabies Booster', 52, null, 1, 1, 'วัคซีนป้องกันโรคพิษสุนัขบ้าประจำปี']
            ];

            vaccines.forEach(v => {
                db.run(
                    'INSERT OR IGNORE INTO vaccine_schedules (vaccine_name, age_weeks_min, age_weeks_max, is_booster, frequency_years, description) VALUES (?, ?, ?, ?, ?, ?)',
                    v,
                    (err) => {
                        if (err) console.error('❌ Error creating vaccine schedule:', err);
                    }
                );
            });

            console.log('✅ สร้างตัวอย่าง vaccine schedules สำเร็จ\n');

            // บทความตัวอย่าง (ใช้ admin_id แทน author_id)
            db.run(`
                INSERT OR IGNORE INTO blog_posts (
                    admin_id, title, slug, content, excerpt, category, status, published_at
                ) VALUES (
                    1,
                    'วิธีดูแลแมวให้มีสุขภาพดี',
                    'cat-health-care-tips',
                    'การดูแลแมวให้มีสุขภาพดีนั้นมีหลายปัจจัย ไม่ว่าจะเป็นการให้อาหารที่มีคุณภาพ การตรวจสุขภาพประจำ การฉีดวัคซีนครบถ้วน และการให้ความรักและความสนใจ',
                    'เรียนรู้วิธีดูแลแมวของคุณให้มีสุขภาพแข็งแรง',
                    'สุขภาพ',
                    'published',
                    datetime('now')
                )
            `, function(err) {
                if (err) {
                    console.error('❌ Error creating sample blog post:', err);
                } else if (this.changes > 0) {
                    console.log('✅ สร้างบทความตัวอย่างสำเร็จ\n');
                }
                
                finishSetup();
            });
        }, 500);

    } catch (error) {
        console.error('❌ Error creating sample data:', error);
        finishSetup();
    }
}

function finishSetup() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Database สร้างเสร็จสมบูรณ์!\n');
    console.log('📊 โครงสร้างใหม่:');
    console.log('   👑 admins   - ผู้ดูแลระบบ');
    console.log('   👤 members  - สมาชิกทั่วไป');
    console.log('   🐱 pets     - สัตว์เลี้ยง (เชื่อมกับ members)');
    console.log('   📝 blog_posts - บทความ (เชื่อมกับ admins)');
    console.log('\n📝 คุณสามารถใช้งานได้ด้วยบัญชีเหล่านี้:');
    console.log('👑 Admin: admin@petizo.com / admin123');
    console.log('👤 Member: user@petizo.com / user123');
    console.log('\n🚀 ขั้นตอนถัดไป:');
    console.log('   1. รัน: node server.js');
    console.log('   2. เปิด: http://localhost:3000');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    db.close();
    process.exit(0);
}