const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

console.log('🔄 เริ่มต้น Migration: แยกตาราง users → members + admins\n');

const db = new sqlite3.Database('./petizo.db', (err) => {
    if (err) {
        console.error('❌ ไม่สามารถเชื่อมต่อ database:', err.message);
        process.exit(1);
    }
    console.log('✅ เชื่อมต่อ database สำเร็จ\n');
});

// เปิด Foreign Keys
db.run('PRAGMA foreign_keys = OFF');

async function migrate() {
    try {
        // ขั้นตอนที่ 1: สร้างตาราง admins
        console.log('📋 ขั้นตอนที่ 1: สร้างตาราง admins...');
        await runQuery(`
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
        `);
        console.log('✅ สร้างตาราง admins สำเร็จ\n');

        // ขั้นตอนที่ 2: สร้างตาราง members
        console.log('📋 ขั้นตอนที่ 2: สร้างตาราง members...');
        await runQuery(`
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
        `);
        console.log('✅ สร้างตาราง members สำเร็จ\n');

        // ขั้นตอนที่ 3: ย้ายข้อมูล admins
        console.log('📋 ขั้นตอนที่ 3: ย้ายข้อมูล admin users...');
        const admins = await getAll(`SELECT * FROM users WHERE role = 'admin'`);
        console.log(`   พบ Admin ${admins.length} คน`);
        
        for (const admin of admins) {
            await runQuery(`
                INSERT OR IGNORE INTO admins (id, username, email, password, full_name, phone, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [admin.id, admin.username, admin.email, admin.password, admin.full_name, admin.phone, admin.created_at, admin.updated_at]);
            console.log(`   ✅ ย้าย admin: ${admin.username}`);
        }
        console.log('');

        // ขั้นตอนที่ 4: ย้ายข้อมูล members
        console.log('📋 ขั้นตอนที่ 4: ย้ายข้อมูล member users...');
        const members = await getAll(`SELECT * FROM users WHERE role = 'user' OR role IS NULL`);
        console.log(`   พบ Member ${members.length} คน`);
        
        for (const member of members) {
            await runQuery(`
                INSERT OR IGNORE INTO members (id, username, email, password, full_name, phone, is_hidden, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [member.id, member.username, member.email, member.password, member.full_name, member.phone, member.is_hidden || 0, member.created_at, member.updated_at]);
            console.log(`   ✅ ย้าย member: ${member.username}`);
        }
        console.log('');

        // ขั้นตอนที่ 5: สร้างตาราง pets ใหม่ (อ้างอิง members)
        console.log('📋 ขั้นตอนที่ 5: อัพเดท Foreign Key ของ pets...');
        
        // Backup pets data
        const pets = await getAll('SELECT * FROM pets');
        console.log(`   พบ Pets ${pets.length} ตัว`);
        
        // Drop และสร้างใหม่
        await runQuery('DROP TABLE IF EXISTS pets');
        await runQuery('ALTER TABLE pets RENAME TO pets');
        
        await runQuery(`
            CREATE TABLE pets (
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
        `);
        
        // ย้ายข้อมูลกลับ
        for (const pet of pets) {
            await runQuery(`
                INSERT INTO pets (id, member_id, name, breed, gender, birth_date, color, weight, microchip_id, photo_url, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [pet.id, pet.user_id, pet.name, pet.breed, pet.gender, pet.birth_date, pet.color, pet.weight, pet.microchip_id, pet.photo_url, pet.notes, pet.created_at, pet.updated_at]);
        }
        
        await runQuery('DROP TABLE pets');
        console.log('✅ อัพเดท pets table สำเร็จ\n');

        // ขั้นตอนที่ 6: อัพเดท blogs (อ้างอิง admins)
        console.log('📋 ขั้นตอนที่ 6: อัพเดท Foreign Key ของ blogs...');
        
        const blogs = await getAll('SELECT * FROM blogs');
        console.log(`   พบ Blog Posts ${blogs.length} บทความ`);
        
        await runQuery('DROP TABLE IF EXISTS blogs');
        await runQuery('ALTER TABLE blogs RENAME TO blogs');
        
        await runQuery(`
            CREATE TABLE blogs (
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
        `);
        
        for (const blog of blogs) {
            await runQuery(`
                INSERT INTO blogs (id, admin_id, title, slug, content, excerpt, featured_image, category, tags, source_name, source_url, status, published_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [blog.id, blog.author_id, blog.title, blog.slug, blog.content, blog.excerpt, blog.featured_image, blog.category, blog.tags, blog.source_name, blog.source_url, blog.status, blog.published_at, blog.created_at, blog.updated_at]);
        }
        
        await runQuery('DROP TABLE blogs');
        console.log('✅ อัพเดท blogs table สำเร็จ\n');

        // ขั้นตอนที่ 8: Backup และลบตาราง users เดิม
        console.log('📋 ขั้นตอนที่ 8: Backup ตาราง users เดิม...');
        await runQuery('ALTER TABLE users RENAME TO users_backup_old');
        console.log('✅ เปลี่ยนชื่อ users → users_backup_old สำเร็จ\n');

        // ขั้นตอนที่ 9: สร้าง Indexes
        console.log('📋 ขั้นตอนที่ 9: สร้าง Indexes...');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_pets_member_id ON pets(member_id)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_blogs_admin_id ON blogs(admin_id)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_members_email ON members(email)');
        console.log('✅ สร้าง Indexes สำเร็จ\n');

        // สรุป
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✨ Migration สำเร็จ!\n');
        console.log('📊 สรุปผลลัพธ์:');
        
        const adminCount = await getOne('SELECT COUNT(*) as count FROM admins');
        const memberCount = await getOne('SELECT COUNT(*) as count FROM members');
        const petCount = await getOne('SELECT COUNT(*) as count FROM pets');
        const blogCount = await getOne('SELECT COUNT(*) as count FROM blogs');
        
        console.log(`   👑 Admins: ${adminCount.count} คน`);
        console.log(`   👤 Members: ${memberCount.count} คน`);
        console.log(`   🐱 Pets: ${petCount.count} ตัว`);
        console.log(`   📝 Blog Posts: ${blogCount.count} บทความ`);
        console.log('\n⚠️  ตาราง users เดิมถูก backup เป็น "users_backup_old"');
        console.log('   หากทุกอย่างทำงานปกติ สามารถลบได้ด้วย:');
        console.log('   DROP TABLE users_backup_old;');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
        console.error('\n⚠️  กรุณาตรวจสอบและลอง restore จาก backup');
    } finally {
        db.close();
    }
}

// Helper functions
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

function getOne(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Run migration
migrate();