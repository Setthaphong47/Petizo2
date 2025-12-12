require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// OpenRouter AI Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = process.env.MODEL_NAME || 'openai/gpt-4o-mini';

// Global variable เก็บโครงสร้าง database
let DB_STRUCTURE = 'old'; // 'old' = users table, 'new' = admins + members

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('data/uploads'));

// Database Connection
const fs = require('fs');
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database('./data/petizo.db', (err) => {
    if (err) {
        console.error(' ไม่สามารถเชื่อมต่อ database:', err.message);
    } else {
        console.log(' เชื่อมต่อ database สำเร็จ\n');
        // ตรวจสอบโครงสร้าง database
        detectDbStructure();
    }
});

// ตรวจสอบโครงสร้าง database
function detectDbStructure() {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'", (err, row) => {
        if (row) {
            DB_STRUCTURE = 'new';
            console.log(' Database Structure: NEW (admins + members)');
        } else {
            DB_STRUCTURE = 'old';
            console.log(' Database Structure: OLD (users table)');
        }

        // เพิ่ม column views ในตาราง blogs ถ้ายังไม่มี (ทำงานเบื้องหลังไม่ block)
        db.get("PRAGMA table_info(blogs)", (err, row) => {
            if (!err) {
                db.all("PRAGMA table_info(blogs)", (err, columns) => {
                    const hasViews = columns && columns.some(col => col.name === 'views');
                    if (!hasViews) {
                        db.run("ALTER TABLE blogs ADD COLUMN views INTEGER DEFAULT 0");
                    }
                });
            }
        });
    });
}

// สร้างโฟลเดอร์ data/uploads
const uploadsDir = path.join(__dirname, 'data', 'uploads');
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('สร้าง data/uploads folder เรียบร้อย');
    }
} catch (err) {
    console.error('ไม่สามารถสร้างโฟลเดอร์ data/uploads:', err.message);
}

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'data/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('ประเภทไฟล์ไม่ถูกต้อง'), false);
        }
    }
});


// ============= HELPER FUNCTIONS =============

// เลือกตาราง user ตามโครงสร้าง
function getUserTable(userType) {
    if (DB_STRUCTURE === 'new') {
        return userType === 'admin' ? 'admins' : 'members';
    }
    return 'users';
}

// เลือก column สำหรับ pets
function getPetUserColumn() {
    return DB_STRUCTURE === 'new' ? 'member_id' : 'user_id';
}


// ============= AUTHENTICATION MIDDLEWARE =============

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token ไม่ถูกต้อง' });
        }
        
        // Normalize userType
        if (!user.userType) {
            user.userType = user.role === 'admin' ? 'admin' : 'member';
        }
        
        req.user = user;
        next();
    });
};

// Optional authentication - allows access without token but extracts user info if provided
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null; // No user logged in
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null; // Invalid token, treat as guest
        } else {
            // Normalize userType
            if (!user.userType) {
                user.userType = user.role === 'admin' ? 'admin' : 'member';
            }
            req.user = user;
        }
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.userType !== 'admin') {
        return res.status(403).json({ error: 'ต้องมีสิทธิ์ Admin' });
    }
    next();
};


// ============= AUTH ROUTES =============

// Verify Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;
        
        // ตรวจสอบ email ซ้ำ
        let checkQuery, insertQuery;
        
        if (DB_STRUCTURE === 'new') {
            // ตรวจสอบทั้ง 2 ตาราง
            const existingAdmin = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM admins WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            
            const existingMember = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM members WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            
            if (existingAdmin || existingMember) {
                return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
            }
            
            insertQuery = 'INSERT INTO members (username, email, password, full_name, phone) VALUES (?, ?, ?, ?, ?)';
        } else {
            const existing = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            
            if (existing) {
                return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' });
            }
            
            insertQuery = "INSERT INTO users (username, email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?, 'user')";
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run(insertQuery, [username, email, hashedPassword, full_name, phone], function(err) {
            if (err) {
                console.error('Register error:', err);
                return res.status(500).json({ error: 'ไม่สามารถสมัครสมาชิกได้' });
            }
            res.json({ message: 'สมัครสมาชิกสำเร็จ', userId: this.lastID });
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        let user = null;
        
        if (DB_STRUCTURE === 'new') {
            // ค้นหาใน admins
            user = await new Promise((resolve, reject) => {
                db.get('SELECT *, "admin" as user_type FROM admins WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            
            // ค้นหาใน members
            if (!user) {
                user = await new Promise((resolve, reject) => {
                    db.get('SELECT *, "member" as user_type FROM members WHERE email = ?', [email], (err, row) => {
                        if (err) reject(err); else resolve(row);
                    });
                });
            }
            
            if (user) {
                if (user.user_type === 'member' && user.is_hidden === 1) {
                    return res.status(403).json({ error: 'บัญชีของคุณถูกระงับการใช้งาน' });
                }
                user.role = user.user_type === 'admin' ? 'admin' : 'user';
            }
        } else {
            // ค้นหาใน users
            user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });
            
            if (user) {
                if (user.is_hidden === 1) {
                    return res.status(403).json({ error: 'บัญชีของคุณถูกระงับการใช้งาน' });
                }
                user.user_type = user.role === 'admin' ? 'admin' : 'member';
            }
        }
        
        if (!user) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Update last login
        const tableName = getUserTable(user.user_type);
        db.run(`UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);
        
        const token = jwt.sign({
            id: user.id,
            username: user.username,
            userType: user.user_type,
            role: user.role
        }, JWT_SECRET, { expiresIn: '24h' });
        
        // ส่ง response กลับทันที
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                userType: user.user_type
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + error.message });
    }
});


// ============= USER PROFILE =============
// Upload user profile picture
app.post('/api/user/profile-picture', authenticateToken, upload.single('profile_picture'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const profile_picture = `/uploads/${req.file.filename}`;
    // Update user table
    let userTable = getUserTable(req.user.userType);
    db.run(`UPDATE ${userTable} SET profile_picture = ? WHERE id = ?`, [profile_picture, req.user.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'ไม่สามารถบันทึกรูปโปรไฟล์ได้' });
        }
        res.json({ message: 'อัพโหลดรูปโปรไฟล์สำเร็จ', profile_picture });
    });
});

app.get('/api/profile', authenticateToken, (req, res) => {
    const tableName = getUserTable(req.user.userType);
    const petColumn = getPetUserColumn();
    
    let query;
    if (DB_STRUCTURE === 'new' && req.user.userType === 'admin') {
        query = `SELECT id, username, email, full_name, phone, created_at, updated_at FROM ${tableName} WHERE id = ?`;
    } else {
        query = `SELECT id, username, email, full_name, phone, created_at, updated_at,
                 (SELECT COUNT(*) FROM pets WHERE ${petColumn} = ${tableName}.id) as pet_count
                 FROM ${tableName} WHERE id = ?`;
    }
    
    db.get(query, [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(err ? 500 : 404).json({ error: err ? 'เกิดข้อผิดพลาด' : 'ไม่พบผู้ใช้' });
        }
        user.role = req.user.role;
        user.userType = req.user.userType;
        res.json(user);
    });
});

app.get('/api/user/profile', authenticateToken, (req, res) => {
    const tableName = getUserTable(req.user.userType);
    const petColumn = getPetUserColumn();
    
    let query;
    if (DB_STRUCTURE === 'new' && req.user.userType === 'admin') {
        query = `SELECT id, username, email, full_name, phone, profile_picture, created_at, updated_at FROM ${tableName} WHERE id = ?`;
    } else {
        query = `SELECT id, username, email, full_name, phone, profile_picture, created_at, updated_at,
                 (SELECT COUNT(*) FROM pets WHERE ${petColumn} = ${tableName}.id) as pet_count
                 FROM ${tableName} WHERE id = ?`;
    }
    
    db.get(query, [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(err ? 500 : 404).json({ error: err ? 'เกิดข้อผิดพลาด' : 'ไม่พบผู้ใช้' });
        }
        user.role = req.user.role;
        res.json(user);
    });
});

app.put('/api/profile', authenticateToken, (req, res) => {
    const { full_name, phone } = req.body;
    const tableName = getUserTable(req.user.userType);
    
    db.run(
        `UPDATE ${tableName} SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [full_name || null, phone || null, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'ไม่สามารถอัปเดตได้' });
            if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
            
            db.get(`SELECT id, username, email, full_name, phone FROM ${tableName} WHERE id = ?`, [req.user.id], (err, user) => {
                if (user) user.role = req.user.role;
                res.json({ message: 'อัปเดตสำเร็จ', user: user });
            });
        }
    );
});

app.put('/api/profile/password', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;
    const tableName = getUserTable(req.user.userType);
    
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
    }
    
    if (new_password.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
    }
    
    db.get(`SELECT password FROM ${tableName} WHERE id = ?`, [req.user.id], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        
        const valid = await bcrypt.compare(current_password, user.password);
        if (!valid) return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        
        const hashed = await bcrypt.hash(new_password, 10);
        db.run(`UPDATE ${tableName} SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hashed, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
            res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        });
    });
});

app.post('/api/user/change-password', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;
    const tableName = getUserTable(req.user.userType);
    
    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
    }
    
    db.get(`SELECT password FROM ${tableName} WHERE id = ?`, [req.user.id], async (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
        
        const valid = await bcrypt.compare(current_password, user.password);
        if (!valid) return res.status(401).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        
        const hashed = await bcrypt.hash(new_password, 10);
        db.run(`UPDATE ${tableName} SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hashed, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
            res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
        });
    });
});


// ============= PETS =============

app.get('/api/pets', authenticateToken, (req, res) => {
    const petColumn = getPetUserColumn();
    
    db.all(`SELECT * FROM pets WHERE ${petColumn} = ? ORDER BY created_at DESC`, [req.user.id], (err, pets) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลได้' });
        res.json(pets);
    });
});

app.get('/api/pets/:id', authenticateToken, (req, res) => {
    const petColumn = getPetUserColumn();
    
    db.get(`SELECT * FROM pets WHERE id = ? AND ${petColumn} = ?`, [req.params.id, req.user.id], (err, pet) => {
        if (err || !pet) return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });
        res.json(pet);
    });
});

app.post('/api/pets', authenticateToken, upload.single('photo'), (req, res) => {
    const petColumn = getPetUserColumn();
    const { name, species, breed, gender, birth_date, color, weight, microchip_id, notes } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
        `INSERT INTO pets (${petColumn}, name, species, breed, gender, birth_date, color, weight, microchip_id, photo_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, name, species || 'cat', breed, gender, birth_date, color, weight, microchip_id, photo_url, notes],
        function(err) {
            if (err) return res.status(500).json({ error: 'ไม่สามารถสร้างข้อมูลได้' });
            res.json({ message: 'สร้างข้อมูลสำเร็จ', petId: this.lastID });
        }
    );
});

app.put('/api/pets/:id', authenticateToken, upload.single('photo'), (req, res) => {
    const petColumn = getPetUserColumn();
    const { name, species, breed, gender, birth_date, color, weight, microchip_id, notes } = req.body;

    let query = `UPDATE pets SET name = ?, species = ?, breed = ?, gender = ?, birth_date = ?, color = ?, weight = ?, microchip_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP`;
    let params = [name, species || 'cat', breed || null, gender || null, birth_date || null, color || null, weight || null, microchip_id || null, notes || null];
    
    if (req.file) {
        query += ', photo_url = ?';
        params.push(`/uploads/${req.file.filename}`);
    }
    
    query += ` WHERE id = ? AND ${petColumn} = ?`;
    params.push(req.params.id, req.user.id);
    
    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: 'ไม่สามารถอัปเดตได้' });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ message: 'อัปเดตสำเร็จ' });
    });
});

app.delete('/api/pets/:id', authenticateToken, (req, res) => {
    const petColumn = getPetUserColumn();
    
    db.run(`DELETE FROM pets WHERE id = ? AND ${petColumn} = ?`, [req.params.id, req.user.id], function(err) {
        if (err) return res.status(500).json({ error: 'ไม่สามารถลบได้' });
        res.json({ message: 'ลบสำเร็จ' });
    });
});


// ============= VACCINATIONS =============
// ============= NOTIFICATIONS ALL-IN-ONE =============
app.get('/api/notifications/all', authenticateToken, async (req, res) => {
    const petColumn = getPetUserColumn();
    try {
        // 1. Load user's pets
        const pets = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM pets WHERE ${petColumn} = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // 2. Load vaccine schedules
        const vaccineSchedules = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM vaccine_schedules ORDER BY age_weeks_min ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // 3. For each pet, load vaccination history & recommended vaccines
        let notifications = [];
        let recommendedVaccines = {};
        for (const pet of pets) {
            // Vaccination history
            const vaccinations = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM vaccinations WHERE pet_id = ? ORDER BY vaccination_date DESC', [pet.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Notification logic (urgent/warning)
            if (Array.isArray(vaccinations)) {
                for (const vaccination of vaccinations) {
                    if (!vaccination) continue;
                    if (vaccination.next_due_date) {
                        const today = new Date();
                        const dueDate = new Date(vaccination.next_due_date);
                        const diffTime = dueDate - today;
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (daysLeft < 0) {
                            notifications.push({ type:'urgent', petName:pet.name, petId:pet.id, vaccineName:vaccination.vaccine_name, message:`วัคซีนเลยกำหนดฉีดแล้ว ${Math.abs(daysLeft)} วัน`, dueDate:vaccination.next_due_date, daysLeft });
                        } else if (daysLeft <= 30) {
                            notifications.push({ type:'warning', petName:pet.name, petId:pet.id, vaccineName:vaccination.vaccine_name, message:`ใกล้ถึงกำหนดฉีดวัคซีนในอีก ${daysLeft} วัน`, dueDate:vaccination.next_due_date, daysLeft });
                        }
                    }
                }
            }

            // Recommended vaccines
            let petRecommendations = [];
            if (pet.birth_date) {
                const birthDate = new Date(pet.birth_date);
                const today = new Date();
                const ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000));
                const ageInYears = ageInWeeks / 52;

                // Completed vaccines map
                const completedMap = {};
                vaccinations.forEach(v => { if (v.schedule_id) completedMap[v.schedule_id] = v; });

                vaccineSchedules.forEach(schedule => {
                    const isCompleted = !!completedMap[schedule.id];
                    let status = 'upcoming', dueDate = null, daysUntilDue = null, shouldShow = true;

                    if (schedule.is_booster) {
                        if (ageInWeeks < schedule.age_weeks_min) {
                            shouldShow = false;
                        } else {
                            const baseName = schedule.vaccine_name.replace(/\s*(Booster|บูสเตอร์).*$/i, '').trim();
                            const related = vaccinations.filter(v => v.vaccine_name.includes(baseName) || baseName.includes(v.vaccine_name));
                            if (related.length > 0) {
                                const lastDate = new Date(related[0].vaccination_date);
                                dueDate = new Date(lastDate);
                                dueDate.setFullYear(dueDate.getFullYear() + (schedule.frequency_years || 1));
                                daysUntilDue = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));
                                if (daysUntilDue < -30) status = 'overdue';
                                else if (daysUntilDue <= 30) status = 'due';
                                else shouldShow = false;
                            } else {
                                dueDate = new Date(birthDate);
                                dueDate.setDate(dueDate.getDate() + (schedule.age_weeks_min * 7));
                                daysUntilDue = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));
                                if (daysUntilDue < -30) status = 'overdue';
                                else if (daysUntilDue <= 30) status = 'due';
                            }
                        }
                    } else {
                        if (ageInYears > 1) {
                            shouldShow = false;
                        } else {
                            dueDate = new Date(birthDate);
                            dueDate.setDate(dueDate.getDate() + (schedule.age_weeks_min * 7));
                            daysUntilDue = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));
                            if (isCompleted) status = 'completed';
                            else if (ageInWeeks < schedule.age_weeks_min) status = 'upcoming';
                            else if (!schedule.age_weeks_max || ageInWeeks <= schedule.age_weeks_max) status = 'due';
                            else status = 'overdue';
                        }
                    }
                    if (shouldShow) {
                        petRecommendations.push({
                            ...schedule, status, due_date: dueDate, days_until_due: daysUntilDue,
                            is_completed: isCompleted, pet_age_weeks: ageInWeeks
                        });
                    }
                });
            }
            recommendedVaccines[pet.id] = petRecommendations;
        }

        res.json({
            pets,
            vaccineSchedules,
            notifications,
            recommendedVaccines
        });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด', details: err.message });
    }
});

app.get('/api/vaccine-schedules', (req, res) => {
    db.all('SELECT * FROM vaccine_schedules ORDER BY age_weeks_min ASC', (err, schedules) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลได้' });
        res.json(schedules);
    });
});

// Admin: Create new vaccine schedule
app.post('/api/vaccine-schedules', authenticateToken, isAdmin, (req, res) => {
    const {
        vaccine_name,
        description,
        age_weeks_min,
        age_weeks_max,
        is_booster,
        frequency_years
    } = req.body;

    db.run(
        `INSERT INTO vaccine_schedules (
            vaccine_name, description, age_weeks_min, age_weeks_max,
            is_booster, frequency_years
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [vaccine_name, description, age_weeks_min, age_weeks_max, is_booster ? 1 : 0, frequency_years],
        function(err) {
            if (err) return res.status(500).json({ error: 'ไม่สามารถเพิ่มข้อมูลได้' });
            res.json({ message: 'เพิ่มสำเร็จ', scheduleId: this.lastID });
        }
    );
});

// Admin: Update vaccine schedule
app.put('/api/vaccine-schedules/:id', authenticateToken, isAdmin, (req, res) => {
    const {
        vaccine_name,
        description,
        age_weeks_min,
        age_weeks_max,
        is_booster,
        frequency_years
    } = req.body;

    db.run(
        `UPDATE vaccine_schedules SET
            vaccine_name = ?, description = ?, age_weeks_min = ?, age_weeks_max = ?,
            is_booster = ?, frequency_years = ?
         WHERE id = ?`,
        [vaccine_name, description, age_weeks_min, age_weeks_max, is_booster ? 1 : 0, frequency_years, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: 'ไม่สามารถแก้ไขได้' });
            if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
            res.json({ message: 'แก้ไขสำเร็จ' });
        }
    );
});

// Admin: Delete vaccine schedule
app.delete('/api/vaccine-schedules/:id', authenticateToken, isAdmin, (req, res) => {
    db.run('DELETE FROM vaccine_schedules WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'ไม่สามารถลบได้' });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ message: 'ลบสำเร็จ' });
    });
});

app.get('/api/pets/:petId/recommended-vaccines', authenticateToken, (req, res) => {
    const petColumn = getPetUserColumn();
    
    db.get(`SELECT * FROM pets WHERE id = ? AND ${petColumn} = ?`, [req.params.petId, req.user.id], (err, pet) => {
        if (err || !pet) return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });
        
        if (!pet.birth_date) {
            return res.json({ message: 'กรุณาใส่วันเกิด', vaccines: [] });
        }
        
        const birthDate = new Date(pet.birth_date);
        const today = new Date();
        const ageInWeeks = Math.floor((today - birthDate) / (7 * 24 * 60 * 60 * 1000));
        const ageInYears = ageInWeeks / 52;
        
        db.all('SELECT * FROM vaccine_schedules ORDER BY age_weeks_min ASC', (err, schedules) => {
            if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
            
            db.all('SELECT * FROM vaccinations WHERE pet_id = ? ORDER BY vaccination_date DESC', [req.params.petId], (err, completed) => {
                if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
                
                const completedMap = {};
                completed.forEach(v => { if (v.schedule_id) completedMap[v.schedule_id] = v; });
                
                const recommendations = [];
                
                schedules.forEach(schedule => {
                    const isCompleted = !!completedMap[schedule.id];
                    let status = 'upcoming', dueDate = null, daysUntilDue = null, shouldShow = true;

                    // --- Logic ใหม่: ใช้ชื่อวัคซีนและ description (ครั้งที่ X) ---
                    // ดึงชื่อชุดวัคซีน เช่น "FVRCP", "FeLV", "Rabies"
                    const baseVaccineName = schedule.vaccine_name.replace(/ครั้งที่\s*\d+/g, '').replace(/\s+/g, ' ').trim();
                    // ดึงลำดับเข็มจาก description
                    let doseNum = 1;
                    if (schedule.description) {
                        const doseMatch = schedule.description.match(/ครั้งที่\s*(\d+)/);
                        if (doseMatch) doseNum = parseInt(doseMatch[1]);
                    }
                    // ถ้าเป็นเข็มที่ 2+ ต้องเช็คว่ามีการฉีดเข็มที่ 1 แล้วหรือยัง
                    if (doseNum > 1) {
                        // หา schedule ของเข็มที่ 1 ในชุดเดียวกัน
                        const firstDoseSchedule = schedules.find(sch => {
                            const schBaseName = sch.vaccine_name.replace(/ครั้งที่\s*\d+/g, '').replace(/\s+/g, ' ').trim();
                            let schDoseNum = 1;
                            if (sch.description) {
                                const schDoseMatch = sch.description.match(/ครั้งที่\s*(\d+)/);
                                if (schDoseMatch) schDoseNum = parseInt(schDoseMatch[1]);
                            }
                            return schBaseName === baseVaccineName && schDoseNum === 1;
                        });
                        // ตรวจสอบว่ามีการฉีดเข็มที่ 1 แล้วหรือยัง (ดูจาก completed)
                        let hasFirstDose = false;
                        if (firstDoseSchedule) {
                            hasFirstDose = completed.some(v => {
                                // เทียบชื่อวัคซีนและ description
                                const vBaseName = v.vaccine_name.replace(/ครั้งที่\s*\d+/g, '').replace(/\s+/g, ' ').trim();
                                let vDoseNum = 1;
                                if (v.description) {
                                    const vDoseMatch = v.description.match(/ครั้งที่\s*(\d+)/);
                                    if (vDoseMatch) vDoseNum = parseInt(vDoseMatch[1]);
                                }
                                return vBaseName === baseVaccineName && vDoseNum === 1;
                            });
                        }
                        if (!hasFirstDose) shouldShow = false;
                    }

                    if (schedule.is_booster) {
                        if (ageInWeeks < schedule.age_weeks_min) {
                            shouldShow = false;
                        } else {
                            const baseName = schedule.vaccine_name.replace(/\s*(Booster|บูสเตอร์).*$/i, '').trim();
                            const related = completed.filter(v => v.vaccine_name.includes(baseName) || baseName.includes(v.vaccine_name));
                            if (related.length > 0) {
                                const lastDate = new Date(related[0].vaccination_date);
                                dueDate = new Date(lastDate);
                                dueDate.setFullYear(dueDate.getFullYear() + (schedule.frequency_years || 1));
                                daysUntilDue = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));
                                if (daysUntilDue < -30) status = 'overdue';
                                else if (daysUntilDue <= 30) status = 'due';
                                else shouldShow = false;
                            } else {
                                dueDate = new Date(birthDate);
                                dueDate.setDate(dueDate.getDate() + (schedule.age_weeks_min * 7));
                                daysUntilDue = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));
                                if (daysUntilDue < -30) status = 'overdue';
                                else if (daysUntilDue <= 30) status = 'due';
                            }
                        }
                    } else {
                        if (ageInYears > 1) {
                            shouldShow = false;
                        } else {
                            dueDate = new Date(birthDate);
                            dueDate.setDate(dueDate.getDate() + (schedule.age_weeks_min * 7));
                            daysUntilDue = Math.floor((dueDate - today) / (24 * 60 * 60 * 1000));
                            if (isCompleted) status = 'completed';
                            else if (ageInWeeks < schedule.age_weeks_min) status = 'upcoming';
                            else if (!schedule.age_weeks_max || ageInWeeks <= schedule.age_weeks_max) status = 'due';
                            else status = 'overdue';
                        }
                    }

                    if (shouldShow) {
                        recommendations.push({
                            ...schedule, status, due_date: dueDate, days_until_due: daysUntilDue,
                            is_completed: isCompleted, pet_age_weeks: ageInWeeks
                        });
                    }
                });
                
                const priority = { overdue: 1, due: 2, upcoming: 3, completed: 4 };
                recommendations.sort((a, b) => (priority[a.status] || 5) - (priority[b.status] || 5));
                
                // กรองเฉพาะวัคซีนที่ยังไม่ได้ฉีด (ใช้ is_completed แทน status)
                const activeVaccines = recommendations.filter(v => !v.is_completed);
                
                res.json({
                    pet_age_weeks: ageInWeeks,
                    vaccines: activeVaccines,
                    active_count: activeVaccines.length,
                    completed_count: recommendations.filter(v => v.is_completed).length
                });
            });
        });
    });
});

app.post('/api/pets/:petId/vaccinations', authenticateToken, upload.single('proof'), (req, res) => {
    const { 
        vaccine_name, 
        vaccine_type, 
        vaccination_date, 
        next_due_date, 
        veterinarian, 
        clinic_name, 
        batch_number, 
        registration_number,
        manufacture_date,
        expiry_date,
        notes, 
        schedule_id 
    } = req.body;
    const proof_image = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(
        `INSERT INTO vaccinations (
            pet_id, vaccine_name, vaccine_type, vaccination_date, next_due_date, 
            veterinarian, clinic_name, batch_number, registration_number, 
            manufacture_date, expiry_date, notes, schedule_id, proof_image, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
            req.params.petId, vaccine_name, vaccine_type, vaccination_date, next_due_date, 
            veterinarian, clinic_name, batch_number, registration_number,
            manufacture_date, expiry_date, notes, schedule_id, proof_image
        ],
        function(err) {
            if (err) return res.status(500).json({ error: 'ไม่สามารถบันทึกได้' });
            res.json({ message: 'บันทึกสำเร็จ', vaccinationId: this.lastID });
        }
    );
});

app.get('/api/pets/:petId/vaccinations', authenticateToken, (req, res) => {
    db.all('SELECT * FROM vaccinations WHERE pet_id = ? ORDER BY vaccination_date DESC', [req.params.petId], (err, vaccinations) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
        res.json(vaccinations);
    });
});

app.delete('/api/vaccinations/:id', authenticateToken, (req, res) => {
    // ตรวจสอบว่าผู้ใช้เป็นเจ้าของสัตว์เลี้ยงที่มีวัคซีนนี้
    const petColumn = getPetUserColumn();
    
    db.get(
        `SELECT v.* FROM vaccinations v 
         JOIN pets p ON v.pet_id = p.id 
         WHERE v.id = ? AND p.${petColumn} = ?`,
        [req.params.id, req.user.id],
        (err, vaccination) => {
            if (err) return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
            if (!vaccination) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
            
            db.run('DELETE FROM vaccinations WHERE id = ?', [req.params.id], function(err) {
                if (err) return res.status(500).json({ error: 'ไม่สามารถลบได้' });
                res.json({ message: 'ลบสำเร็จ' });
            });
        }
    );
});

app.get('/api/vaccinations', authenticateToken, (req, res) => {
    const petColumn = getPetUserColumn();
    
    db.all(
        `SELECT v.*, p.name as pet_name, p.breed as pet_breed, p.photo_url as pet_photo
         FROM vaccinations v JOIN pets p ON v.pet_id = p.id
         WHERE p.${petColumn} = ? ORDER BY v.next_due_date ASC`,
        [req.user.id],
        (err, vaccinations) => {
            if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
            res.json(vaccinations);
        }
    );
});


// ============= OCR VACCINE LABEL SCANNING =============

// Endpoint สำหรับดาวน์โหลดภาพ debug
app.get('/api/ocr/debug/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename;
    // ตรวจสอบว่าเป็นไฟล์ debug เท่านั้น
    if (!filename.startsWith('debug_') || !filename.endsWith('.png')) {
        return res.status(400).json({ error: 'Invalid debug file' });
    }
    
    const filePath = path.join(__dirname, 'data', 'uploads', filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).json({ error: 'File not found' });
        }
    });
});

// Endpoint แสดงรายการไฟล์ debug
app.get('/api/ocr/debug', authenticateToken, (req, res) => {
    const uploadsDir = path.join(__dirname, 'data', 'uploads');
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Cannot read directory' });
        
        const debugFiles = files
            .filter(f => f.startsWith('debug_') && f.endsWith('.png'))
            .sort()
            .reverse()
            .slice(0, 20); // แสดง 20 ไฟล์ล่าสุด
        
        res.json({ files: debugFiles });
    });
});

app.post('/api/ocr/scan', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'ไม่พบไฟล์รูปภาพ' });
    }
    
    const imagePath = path.join(__dirname, req.file.path);
    const pythonScript = path.join(__dirname, 'ocr_system', 'scan.py');
    
    // ตรวจสอบว่ามี Python script
    if (!require('fs').existsSync(pythonScript)) {
        console.log('[OCR API] Python script not found, OCR feature disabled');
        return res.status(503).json({ 
            error: 'OCR feature is not available',
            message: 'กรุณากรอกข้อมูลด้วยตนเอง'
        });
    }
    
    console.log('\n[OCR API] Starting vaccine label scan...');
    console.log(`[OCR API] Image: ${req.file.filename}`);
    console.log(`[OCR API] Image path: ${imagePath}`);
    console.log(`[OCR API] Python script: ${pythonScript}`);
    
    // ลอง python3 ก่อน ถ้าไม่ได้ค่อยใช้ python
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    console.log(`[OCR API] Using Python command: ${pythonCmd}`);
    console.log(`[OCR API] PYTHONPATH in Node.js: ${process.env.PYTHONPATH}`);

    // เรียก Python script พร้อมส่ง PYTHONPATH และ LD_LIBRARY_PATH
    // ใช้ shell: true เพื่อให้ environment variables ทำงานถูกต้อง
    const { spawn } = require('child_process');
    const pythonEnv = {
        ...process.env,
        PYTHONPATH: process.env.PYTHONPATH || '',
        LD_LIBRARY_PATH: '/root/.nix-profile/lib:' + (process.env.LD_LIBRARY_PATH || '')
    };
    
    console.log(`[OCR API] PYTHONPATH passed to Python: ${pythonEnv.PYTHONPATH}`);
    
    const python = spawn(pythonCmd, [pythonScript, imagePath], {
        env: pythonEnv,
        shell: true
    });

    // ตั้ง timeout 600 วินาที (10 นาที สำหรับ EasyOCR CPU-only inference)
    let isTimeout = false;
    let isResponseSent = false;
    
    const timeout = setTimeout(() => {
        isTimeout = true;
        python.kill('SIGTERM');
        console.error('[OCR API] Process timeout after 600s');
        
        if (!isResponseSent) {
            isResponseSent = true;
            res.status(504).json({
                error: 'OCR processing timeout',
                message: 'กรุณาลองใหม่อีกครั้ง (ครั้งแรกอาจใช้เวลานาน)'
            });
        }
    }, 600000); // เพิ่มเป็น 600 วินาที (10 นาที)
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
        stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
        stderr += data.toString();
        // แสดง backend logs
        console.log(data.toString());
    });
    
    python.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`[OCR API] Python process exited with code ${code}`);
        
        // ถ้า timeout แล้วไม่ต้องส่ง response อีก
        if (isTimeout || isResponseSent) {
            console.log('[OCR API] Response already sent, skipping');
            return;
        }
        
        isResponseSent = true;
        
        if (code !== 0) {
            console.error(`[OCR API] Python script failed with code ${code}`);
            console.error('[OCR API] stderr:', stderr);
            console.error('[OCR API] stdout:', stdout);
            return res.status(500).json({ 
                error: 'OCR processing failed',
                message: 'ไม่สามารถอ่านฉลากวัคซีนได้ กรุณากรอกข้อมูลด้วยตนเอง',
                details: stderr || 'Python process failed',
                code: code
            });
        }
        
        try {
            console.log('[OCR API] Raw stdout:', stdout);
            
            if (!stdout || stdout.trim() === '') {
                throw new Error('Empty response from Python script');
            }
            
            const result = JSON.parse(stdout);
            console.log('[OCR API] Scan completed successfully');
            console.log('[OCR API] Result:', result);
            res.json(result);
        } catch (err) {
            console.error('[OCR API] Failed to parse JSON:', err);
            console.error('[OCR API] stdout:', stdout);
            res.status(500).json({ 
                error: 'ไม่สามารถประมวลผลผลลัพธ์ได้',
                message: 'กรุณากรอกข้อมูลด้วยตนเอง',
                details: err.message,
                stdout: stdout
            });
        }
    });
    
    python.on('error', (err) => {
        clearTimeout(timeout);
        console.error('[OCR API] Failed to start Python process:', err);
        res.status(500).json({ 
            error: 'Failed to start OCR process',
            message: 'ไม่สามารถเริ่มระบบ OCR ได้ กรุณากรอกข้อมูลด้วยตนเอง',
            details: err.message
        });
    });
});


// ============= BLOG =============
// ใช้ตาราง 'blogs' และ columns: admin_id, source_name, source_url

app.post('/api/admin/blog', authenticateToken, isAdmin, upload.single('featured_image'), (req, res) => {
    console.log('📝 POST /api/admin/blog - Creating new blog');
    console.log('Request body:', { title: req.body.title, category: req.body.category, status: req.body.status });
    console.log('User ID:', req.user.id);
    console.log('Has file:', !!req.file);
    
    const { title, content, excerpt, category, status, tags, source_name, source_url } = req.body;
    const featured_image = req.file ? `/uploads/${req.file.filename}` : null;
    
    let tagsJson = '[]';
    if (tags) {
        try { 
            const tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            tagsJson = JSON.stringify(tagsArray);
        } catch { tagsJson = JSON.stringify([tags]); }
    }
    
    // First, get the next ID to generate slug
    db.get('SELECT MAX(id) as maxId FROM blogs', [], (err, row) => {
        if (err) {
            console.error('❌ Error getting max ID:', err);
            return res.status(500).json({ error: 'ไม่สามารถสร้างบทความได้' });
        }
        
        const nextId = (row.maxId || 0) + 1;
        const titleSlug = slugify(title);
        const slug = `${nextId}-${titleSlug}`;
        const published_at = status === 'published' ? new Date().toISOString() : null;
        
        console.log('Generated slug:', slug);
        
        db.run(
            `INSERT INTO blogs (admin_id, title, slug, content, excerpt, featured_image, category, tags, source_name, source_url, status, published_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, title, slug, content, excerpt, featured_image, category, tagsJson, source_name || null, source_url || null, status, published_at],
            function(err) {
                if (err) {
                    console.error('❌ Blog create error:', err);
                    return res.status(500).json({ error: 'ไม่สามารถสร้างบทความได้: ' + err.message });
                }
                console.log('✅ Blog created successfully! ID:', this.lastID, 'Slug:', slug);
                res.json({ message: 'สร้างบทความสำเร็จ', id: this.lastID, slug });
            }
        );
    });
});

app.put('/api/admin/blog/:id', authenticateToken, isAdmin, upload.single('featured_image'), (req, res) => {
    console.log('PUT /api/admin/blog/:id - Request body:', req.body);
    console.log('PUT /api/admin/blog/:id - File:', req.file);
    console.log('PUT /api/admin/blog/:id - Blog ID:', req.params.id);
    
    const { title, content, excerpt, category, status, tags, source_name, source_url } = req.body;
    const file = req.file;
    
    let tagsJson = '[]';
    if (tags) {
        try { 
            const tagsArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
            tagsJson = JSON.stringify(tagsArray);
        } catch { tagsJson = JSON.stringify([tags]); }
    }
    
    const featured_image = file ? `/uploads/${file.filename}` : req.body.featured_image;
    
    db.get('SELECT published_at FROM blogs WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'ไม่พบบทความ' });
        
        const setPublished = status === 'published' && !row.published_at;
        let sql = `UPDATE blogs SET title=?, category=?, status=?, excerpt=?, content=?, tags=?, source_name=?, source_url=?`;
        let params = [title, category, status, excerpt, content, tagsJson, source_name || null, source_url || null];
        
        if (file) { sql += ', featured_image=?'; params.push(featured_image); }
        if (setPublished) { sql += ", published_at=datetime('now')"; }
        
        sql += ' WHERE id=?';
        params.push(req.params.id);
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Blog update error:', err);
                console.error('SQL:', sql);
                console.error('Params:', params);
                return res.status(500).json({ error: 'ไม่สามารถอัปเดตได้: ' + err.message });
            }
            if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบบทความ' });
            res.json({ message: 'อัปเดตสำเร็จ' });
        });
    });
});

app.get('/api/admin/blog', authenticateToken, isAdmin, (req, res) => {
    const userTable = DB_STRUCTURE === 'new' ? 'admins' : 'users';
    const authorColumn = DB_STRUCTURE === 'new' ? 'admin_id' : 'author_id';
    
    db.all(
        `SELECT b.*, u.username as author_name, u.full_name as author_full_name
         FROM blogs b LEFT JOIN ${userTable} u ON b.${authorColumn} = u.id
         ORDER BY b.created_at DESC`,
        (err, blogs) => {
            if (err) {
                console.error('Blog fetch error:', err);
                return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
            }
            blogs.forEach(b => { 
                try { b.tags = JSON.parse(b.tags || '[]'); } catch { b.tags = []; }
            });
            res.json(blogs);
        }
    );
});

app.get('/api/admin/blog/:id', authenticateToken, isAdmin, (req, res) => {
    const userTable = DB_STRUCTURE === 'new' ? 'admins' : 'users';
    const authorColumn = DB_STRUCTURE === 'new' ? 'admin_id' : 'author_id';
    
    db.get(
        `SELECT b.*, u.username as author_name, u.full_name as author_full_name
         FROM blogs b LEFT JOIN ${userTable} u ON b.${authorColumn} = u.id WHERE b.id = ?`,
        [req.params.id],
        (err, blog) => {
            if (err || !blog) return res.status(404).json({ error: 'ไม่พบบทความ' });
            try { blog.tags = JSON.parse(blog.tags || '[]'); } catch { blog.tags = []; }
            // Parse source_name to array
            if (blog.source_name) {
                blog.source = blog.source_name.split(',').map(s => s.trim()).filter(Boolean);
            } else {
                blog.source = [];
            }
            res.json(blog);
        }
    );
});

app.delete('/api/admin/blog/:id', authenticateToken, isAdmin, (req, res) => {
    db.run('DELETE FROM blogs WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'ไม่สามารถลบได้' });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบบทความ' });
        res.json({ success: true, message: 'ลบบทความสำเร็จ' });
    });
});

app.get('/api/blog', (req, res) => {
    db.all(
        `SELECT * FROM blogs WHERE LOWER(status) IN ('published','public') OR status = 'เผยแพร่' ORDER BY datetime(published_at) DESC`,
        (err, rows) => {
            if (err) {
                console.error('Blog public fetch error:', err);
                return res.status(500).json({ error: err.message });
            }
            rows.forEach(r => {
                try { r.tags = JSON.parse(r.tags || '[]'); } catch { r.tags = []; }
            });
            res.json(rows);
        }
    );
});

app.get('/api/blog/all', (req, res) => {
    db.all(`SELECT * FROM blogs WHERE status = 'published' ORDER BY published_at DESC`, (err, blogs) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
        blogs.forEach(b => {
            try { b.tags = JSON.parse(b.tags || '[]'); } catch { b.tags = []; }
        });
        res.json(blogs);
    });
});

app.get('/api/blog/:slug', (req, res) => {
    const userTable = DB_STRUCTURE === 'new' ? 'admins' : 'users';
    const authorColumn = DB_STRUCTURE === 'new' ? 'admin_id' : 'author_id';
    const identifier = req.params.slug;

    db.get(
        `SELECT b.*, u.full_name as author_name FROM blogs b
         LEFT JOIN ${userTable} u ON b.${authorColumn} = u.id
         WHERE (b.slug = ? OR b.id = ?) AND b.status = 'published'`,
        [identifier, identifier],
        (err, blog) => {
            if (err || !blog) return res.status(404).json({ error: 'ไม่พบบทความ' });
            try { blog.tags = JSON.parse(blog.tags || '[]'); } catch { blog.tags = []; }
            // Parse source_name to array for frontend
            if (blog.source_name) {
                blog.source = blog.source_name.split(',').map(s => s.trim()).filter(Boolean);
            } else {
                blog.source = [];
            }
            res.json(blog);
        }
    );
});

// Increment blog view count
app.post('/api/blog/:slug/view', (req, res) => {
    const identifier = req.params.slug;
    console.log('Incrementing view count for:', identifier);

    // พยายามหาด้วย slug ก่อน ถ้าไม่เจอลอง id
    db.run(
        `UPDATE blogs SET views = COALESCE(views, 0) + 1 WHERE (slug = ? OR id = ?) AND status = 'published'`,
        [identifier, identifier],
        function(err) {
            if (err) {
                console.error('Error incrementing view count:', err);
                return res.status(500).json({ error: 'Failed to increment view count' });
            }
            if (this.changes === 0) {
                console.log('Blog not found or not published:', identifier);
                return res.status(404).json({ error: 'Blog not found' });
            }
            console.log('View count incremented successfully for:', identifier);
            res.json({ success: true, changes: this.changes });
        }
    );
});


// ============= ADMIN USER MANAGEMENT =============

app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
    const petColumn = getPetUserColumn();
    
    if (DB_STRUCTURE === 'new') {
        // โครงสร้างใหม่: รวม admins และ members
        db.all(`SELECT id, username, email, full_name, phone, 'admin' as role, 0 as is_hidden, created_at, updated_at, 0 as pet_count, 'admin' as userType FROM admins`, (err, admins) => {
            if (err) admins = [];
            
            db.all(
                `SELECT id, username, email, full_name, phone, 'user' as role, is_hidden, created_at, updated_at,
                 (SELECT COUNT(*) FROM pets WHERE member_id = members.id) as pet_count, 'member' as userType FROM members`,
                (err, members) => {
                    if (err) members = [];
                    
                    const all = [...admins, ...members].map(u => ({
                        ...u, status: u.is_hidden === 1 ? 'hidden' : 'active'
                    }));
                    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    res.json(all);
                }
            );
        });
    } else {
        // โครงสร้างเดิม
        db.all(
            `SELECT id, username, email, full_name, phone, role, is_hidden, created_at, updated_at,
             (SELECT COUNT(*) FROM pets WHERE ${petColumn} = users.id) as pet_count
             FROM users ORDER BY created_at DESC`,
            (err, users) => {
                if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
                users.forEach(u => {
                    u.status = u.is_hidden === 1 ? 'hidden' : 'active';
                    u.userType = u.role === 'admin' ? 'admin' : 'member';
                });
                res.json(users);
            }
        );
    }
});

app.put('/api/admin/users/:id/status', authenticateToken, isAdmin, (req, res) => {
    const { status, userType } = req.body;
    const isHidden = status === 'hidden' ? 1 : 0;
    
    let tableName;
    if (DB_STRUCTURE === 'new') {
        if (userType === 'admin') return res.status(400).json({ error: 'ไม่สามารถซ่อน Admin ได้' });
        tableName = 'members';
    } else {
        tableName = 'users';
    }
    
    db.run(`UPDATE ${tableName} SET is_hidden = ? WHERE id = ?`, [isHidden, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'ไม่สามารถอัปเดต' });
        res.json({ success: true, message: 'อัพเดทสำเร็จ' });
    });
});

app.put('/api/admin/users/:id/toggle-status', authenticateToken, isAdmin, (req, res) => {
    const { status, userType } = req.body;
    const isHidden = status === 'hidden' ? 1 : 0;
    
    let tableName;
    if (DB_STRUCTURE === 'new') {
        if (userType === 'admin') return res.status(400).json({ error: 'ไม่สามารถซ่อน Admin ได้' });
        tableName = 'members';
    } else {
        tableName = 'users';
    }
    
    db.run(`UPDATE ${tableName} SET is_hidden = ? WHERE id = ?`, [isHidden, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'ไม่สามารถอัปเดต' });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        res.json({ success: true, message: 'อัพเดทสำเร็จ', status, is_hidden: isHidden });
    });
});

app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, (req, res) => {
    const { role, currentUserType } = req.body;
    const userId = parseInt(req.params.id);

    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Role ไม่ถูกต้อง' });
    }

    if (userId === req.user.id) {
        return res.status(400).json({ error: 'ไม่สามารถเปลี่ยน role ตัวเองได้' });
    }

    if (DB_STRUCTURE === 'new') {
        // โครงสร้างใหม่: ย้ายระหว่างตาราง admins และ members
        const sourceTable = currentUserType === 'admin' ? 'admins' : 'members';
        const targetTable = role === 'admin' ? 'admins' : 'members';

        // ถ้าย้ายไปตารางเดิม ไม่ต้องทำอะไร
        if (sourceTable === targetTable) {
            return res.json({ message: 'ผู้ใช้อยู่ใน role นี้อยู่แล้ว' });
        }

        // ดึงข้อมูลผู้ใช้จากตารางต้นทาง
        db.get(`SELECT * FROM ${sourceTable} WHERE id = ?`, [userId], (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
            }

            // เริ่ม transaction
            db.serialize(() => {
                // 1. Insert ข้อมูลไปยังตารางปลายทาง (ใช้เฉพาะคอลัมน์ที่มีทั้ง 2 ตาราง)
                const insertFields = 'username, password, email, full_name, phone, created_at, updated_at';
                const insertValues = '?, ?, ?, ?, ?, ?, ?';

                db.run(
                    `INSERT INTO ${targetTable} (${insertFields}) VALUES (${insertValues})`,
                    [user.username, user.password, user.email, user.full_name, user.phone, user.created_at, user.updated_at || new Date().toISOString()],
                    function(insertErr) {
                        if (insertErr) {
                            console.error('Insert error:', insertErr);
                            return res.status(500).json({ error: 'ไม่สามารถสร้างผู้ใช้ในตารางใหม่ได้' });
                        }

                        const newUserId = this.lastID;

                        // 2. ถ้าเป็น member → admin: ลบสัตว์เลี้ยงทั้งหมด
                        if (role === 'admin' && currentUserType === 'member') {
                            db.run('DELETE FROM pets WHERE member_id = ?', [userId], (petErr) => {
                                if (petErr) console.error('Error deleting pets:', petErr);
                            });
                        }

                        // 3. ลบข้อมูลจากตารางต้นทาง
                        db.run(`DELETE FROM ${sourceTable} WHERE id = ?`, [userId], (deleteErr) => {
                            if (deleteErr) {
                                console.error('Delete error:', deleteErr);
                                return res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้จากตารางเดิมได้' });
                            }

                            let warning = '';
                            if (role === 'admin' && currentUserType === 'member') {
                                warning = 'สัตว์เลี้ยงของผู้ใช้ถูกลบเนื่องจาก Admin ไม่สามารถมีสัตว์เลี้ยงได้';
                            }

                            res.json({
                                message: 'เปลี่ยน role สำเร็จ',
                                warning: warning,
                                newUserId: newUserId
                            });
                        });
                    }
                );
            });
        });
    } else {
        // โครงสร้างเดิม
        db.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, userId], function(err) {
            if (err) return res.status(500).json({ error: 'ไม่สามารถเปลี่ยน role ได้' });
            res.json({ message: 'เปลี่ยน role สำเร็จ' });
        });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const { userType } = req.query;
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
        return res.status(400).json({ error: 'ไม่สามารถลบตัวเองได้' });
    }
    
    let tableName;
    if (DB_STRUCTURE === 'new') {
        tableName = userType === 'admin' ? 'admins' : 'members';
    } else {
        tableName = 'users';
    }
    
    db.run(`DELETE FROM ${tableName} WHERE id = ?`, [userId], function(err) {
        if (err) return res.status(500).json({ error: 'ไม่สามารถลบได้' });
        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    });
});


// ============= ADMIN PET MANAGEMENT =============

app.get('/api/admin/users-with-pets', authenticateToken, isAdmin, (req, res) => {
    const petColumn = getPetUserColumn();
    const userTable = DB_STRUCTURE === 'new' ? 'members' : 'users';
    const userIdColumn = DB_STRUCTURE === 'new' ? 'member_id' : 'user_id';
    
    let whereClause = DB_STRUCTURE === 'new' ? '' : "WHERE (role = 'user' OR role IS NULL)";
    if (whereClause) whereClause += ' AND ';
    else whereClause = 'WHERE ';
    whereClause += '(is_hidden = 0 OR is_hidden IS NULL)';
    
    db.all(
        `SELECT u.id, u.username, u.email, u.full_name, u.created_at,
         (SELECT COUNT(*) FROM pets WHERE ${userIdColumn} = u.id) as pet_count,
         (SELECT MAX(created_at) FROM pets WHERE ${userIdColumn} = u.id) as latest_pet_date
         FROM ${userTable} u ${whereClause} ORDER BY u.created_at DESC`,
        (err, users) => {
            if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
            res.json(users);
        }
    );
});

app.get('/api/admin/users/:userId/pets', authenticateToken, isAdmin, (req, res) => {
    const petColumn = getPetUserColumn();
    
    db.all(`SELECT * FROM pets WHERE ${petColumn} = ? ORDER BY created_at DESC`, [req.params.userId], (err, pets) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
        res.json(pets);
    });
});

app.get('/api/admin/pets/:petId', authenticateToken, isAdmin, (req, res) => {
    db.get('SELECT * FROM pets WHERE id = ?', [req.params.petId], (err, pet) => {
        if (err || !pet) return res.status(404).json({ error: 'ไม่พบสัตว์เลี้ยง' });
        res.json(pet);
    });
});

app.get('/api/admin/pets/:petId/vaccinations', authenticateToken, isAdmin, (req, res) => {
    db.all('SELECT * FROM vaccinations WHERE pet_id = ? ORDER BY vaccination_date DESC', [req.params.petId], (err, vaccinations) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
        res.json(vaccinations);
    });
});

app.get('/api/admin/all-pets', authenticateToken, isAdmin, (req, res) => {
    const petColumn = getPetUserColumn();
    const userTable = DB_STRUCTURE === 'new' ? 'members' : 'users';
    
    db.all(
        `SELECT p.*, u.username, u.full_name, u.email
         FROM pets p JOIN ${userTable} u ON p.${petColumn} = u.id
         WHERE (u.is_hidden = 0 OR u.is_hidden IS NULL)
         ORDER BY p.created_at DESC`,
        (err, pets) => {
            if (err) return res.status(500).json({ error: 'ไม่สามารถโหลดได้' });
            res.json(pets);
        }
    );
});


// ============= DASHBOARD STATS =============

app.get('/api/admin/dashboard/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userTable = DB_STRUCTURE === 'new' ? 'members' : 'users';
        const userColumn = DB_STRUCTURE === 'new' ? 'member_id' : 'user_id';

        // Get date range from query params (default to last 6 months)
        const endDate = req.query.endDate || new Date().toISOString();
        const startDate = req.query.startDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString();
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        // Helper to promisify db queries
        const dbGet = (query, params = []) => {
            return new Promise((resolve, reject) => {
                db.get(query, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                });
            });
        };

        const dbAll = (query, params = []) => {
            return new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });
        };

        // Get all stats in parallel
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            newUsersMonth,
            totalPets,
            petsByGender,
            petsByBreed,
            newPetsMonth,
            totalBlogs,
            publishedBlogs,
            popularBlogs,
            newBlogsMonth,
            userGrowth,
            petGrowth
        ] = await Promise.all([
            // Total users
            dbGet(`SELECT COUNT(*) as total FROM ${userTable}`),
            // Active users (not hidden)
            dbGet(`SELECT COUNT(*) as total FROM ${userTable} WHERE is_hidden = 0 OR is_hidden IS NULL`),
            // Suspended users (hidden)
            dbGet(`SELECT COUNT(*) as total FROM ${userTable} WHERE is_hidden = 1`),
            // New users this month
            dbGet(`SELECT COUNT(*) as total FROM ${userTable} WHERE created_at >= ?`, [startOfMonth]),
            // Total pets (cats only)
            dbGet('SELECT COUNT(*) as total FROM pets'),
            // Pets by gender
            dbGet(`SELECT
                SUM(CASE WHEN LOWER(gender) = 'male' OR LOWER(gender) = 'ผู้' OR LOWER(gender) = 'ชาย' THEN 1 ELSE 0 END) as male,
                SUM(CASE WHEN LOWER(gender) = 'female' OR LOWER(gender) = 'เมีย' OR LOWER(gender) = 'หญิง' THEN 1 ELSE 0 END) as female,
                SUM(CASE WHEN gender IS NULL OR gender = '' OR (LOWER(gender) NOT IN ('male', 'female', 'ผู้', 'เมีย', 'ชาย', 'หญิง')) THEN 1 ELSE 0 END) as unknown
            FROM pets`),
            // Top breeds
            dbAll(`SELECT breed, COUNT(*) as count FROM pets
                   WHERE breed IS NOT NULL AND breed != ''
                   GROUP BY breed ORDER BY count DESC LIMIT 10`),
            // New pets this month
            dbGet('SELECT COUNT(*) as total FROM pets WHERE created_at >= ?', [startOfMonth]),
            // Total blogs
            dbGet('SELECT COUNT(*) as total FROM blogs'),
            // Published blogs
            dbGet('SELECT COUNT(*) as total FROM blogs WHERE status = "published" OR status = "เผยแพร่"'),
            // Popular blogs (top 5 by views)
            dbAll(`SELECT id, title, views FROM blogs
                   WHERE status = 'published' OR status = 'เผยแพร่'
                   ORDER BY views DESC LIMIT 5`),
            // New blogs this month
            dbGet('SELECT COUNT(*) as total FROM blogs WHERE created_at >= ?', [startOfMonth]),
            // User growth by month (last 6 months)
            dbAll(`SELECT
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as count
                FROM ${userTable}
                WHERE created_at >= ? AND created_at <= ?
                GROUP BY month
                ORDER BY month ASC`, [startDate, endDate]),
            // Pet growth by month (last 6 months)
            dbAll(`SELECT
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as count
                FROM pets
                WHERE created_at >= ? AND created_at <= ?
                GROUP BY month
                ORDER BY month ASC`, [startDate, endDate])
        ]);

        // Calculate age groups from birth_date
        const petsWithAge = await dbAll('SELECT birth_date FROM pets WHERE birth_date IS NOT NULL AND birth_date != ""');
        const ageGroups = {
            kitten: 0,      // 0-1 year
            young: 0,       // 1-3 years
            adult: 0,       // 3-7 years
            senior: 0,      // 7-11 years
            geriatric: 0    // 11+ years
        };

        const now = new Date();
        petsWithAge.forEach(pet => {
            try {
                const birthDate = new Date(pet.birth_date);
                const ageInYears = (now - birthDate) / (1000 * 60 * 60 * 24 * 365.25);

                if (ageInYears < 1) ageGroups.kitten++;
                else if (ageInYears < 3) ageGroups.young++;
                else if (ageInYears < 7) ageGroups.adult++;
                else if (ageInYears < 11) ageGroups.senior++;
                else ageGroups.geriatric++;
            } catch (e) {
                // Skip invalid dates
            }
        });

        // Send response
        res.json({
            // User stats
            totalUsers: totalUsers.total || 0,
            activeUsers: activeUsers.total || 0,
            suspendedUsers: suspendedUsers.total || 0,
            newUsersThisMonth: newUsersMonth.total || 0,

            // Pet stats
            totalPets: totalPets.total || 0,
            newPetsThisMonth: newPetsMonth.total || 0,
            petsByGender: {
                male: petsByGender.male || 0,
                female: petsByGender.female || 0,
                unknown: petsByGender.unknown || 0
            },
            petsByAge: ageGroups,
            topBreeds: petsByBreed,

            // Blog stats
            totalBlogs: totalBlogs.total || 0,
            publishedBlogs: publishedBlogs.total || 0,
            popularBlogs: popularBlogs,
            newBlogsThisMonth: newBlogsMonth.total || 0,

            // Growth data for charts
            userGrowth: userGrowth,
            petGrowth: petGrowth
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลได้' });
    }
});

// ============= DASHBOARD CHARTS =============

// Gender Distribution
app.get('/api/admin/dashboard/gender-distribution', authenticateToken, isAdmin, (req, res) => {
    db.get(`SELECT
        SUM(CASE WHEN LOWER(gender) = 'male' OR LOWER(gender) = 'ผู้' OR LOWER(gender) = 'ชาย' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN LOWER(gender) = 'female' OR LOWER(gender) = 'เมีย' OR LOWER(gender) = 'หญิง' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN gender IS NULL OR gender = '' OR (LOWER(gender) NOT IN ('male', 'female', 'ผู้', 'เมีย', 'ชาย', 'หญิง')) THEN 1 ELSE 0 END) as unknown
    FROM pets`, (err, result) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json({
            male: result.male || 0,
            female: result.female || 0,
            unknown: result.unknown || 0
        });
    });
});

// Vaccine Status
app.get('/api/admin/dashboard/vaccine-status', authenticateToken, isAdmin, (req, res) => {
    db.all(`SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' OR status = 'ฉีดแล้ว' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN (status = 'pending' OR status = 'รอฉีด' OR status IS NULL) AND (next_due_date IS NULL OR date(next_due_date) >= date('now')) THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN next_due_date IS NOT NULL AND date(next_due_date) < date('now') AND (status != 'completed' AND status != 'ฉีดแล้ว') THEN 1 ELSE 0 END) as overdue
    FROM vaccinations`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        const result = rows[0] || {};
        res.json({
            completed: result.completed || 0,
            pending: result.pending || 0,
            overdue: result.overdue || 0
        });
    });
});

// Top Vaccines
app.get('/api/admin/dashboard/top-vaccines', authenticateToken, isAdmin, (req, res) => {
    db.all(`SELECT vaccine_name as name, COUNT(*) as count
            FROM vaccinations
            WHERE vaccine_name IS NOT NULL AND vaccine_name != ''
            GROUP BY vaccine_name
            ORDER BY count DESC
            LIMIT 5`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json(rows || []);
    });
});

// Top Breeds
app.get('/api/admin/dashboard/top-breeds', authenticateToken, isAdmin, (req, res) => {
    db.all(`SELECT breed, COUNT(*) as count
            FROM pets
            WHERE breed IS NOT NULL AND breed != ''
            GROUP BY breed
            ORDER BY count DESC
            LIMIT 5`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json(rows || []);
    });
});

// Monthly Trends (Users and Pets registration)
app.get('/api/admin/dashboard/trends', authenticateToken, isAdmin, (req, res) => {
    const petColumn = getPetUserColumn();

    // Get last 6 months data
    const userTable = DB_STRUCTURE === 'new' ? 'members' : 'users';

    db.all(`SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
    FROM ${userTable}
    WHERE created_at >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month`, (err, users) => {
        db.all(`SELECT
            strftime('%Y-%m', created_at) as month,
            COUNT(*) as count
        FROM pets
        WHERE created_at >= date('now', '-6 months')
        GROUP BY month
        ORDER BY month`, (err, pets) => {

            // Create labels for last 6 months
            const months = [];
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
            const now = new Date();

            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                months.push({
                    key: monthKey,
                    label: thaiMonths[d.getMonth()]
                });
            }

            // Map data to months
            const userData = months.map(m => {
                const found = users.find(u => u.month === m.key);
                return found ? found.count : 0;
            });

            const petData = months.map(m => {
                const found = pets.find(p => p.month === m.key);
                return found ? found.count : 0;
            });

            res.json({
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'ผู้ใช้งานใหม่',
                        data: userData,
                        borderColor: '#00bcd4',
                        backgroundColor: 'rgba(0, 188, 212, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'สัตว์เลี้ยงที่ลงทะเบียน',
                        data: petData,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4
                    }
                ]
            });
        });
    });
});

// ============= NEW ANALYTICS DASHBOARD APIs =============

// 1. User Growth by Month with Percentage Change
app.get('/api/admin/dashboard/user-growth-detailed', authenticateToken, isAdmin, (req, res) => {
    const userTable = DB_STRUCTURE === 'new' ? 'members' : 'users';
    const monthsBack = parseInt(req.query.months) || 12; // Default 12 months

    db.all(`SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
    FROM ${userTable}
    WHERE created_at >= date('now', '-${monthsBack} months')
    GROUP BY month
    ORDER BY month`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });

        const data = rows.map((row, index) => {
            let percentageChange = 0;
            if (index > 0) {
                const prevCount = rows[index - 1].count;
                percentageChange = prevCount > 0
                    ? ((row.count - prevCount) / prevCount * 100).toFixed(2)
                    : 100;
            }
            return {
                month: row.month,
                count: row.count,
                percentageChange: parseFloat(percentageChange)
            };
        });

        res.json(data);
    });
});

// 2. Top Breeds by Month
app.get('/api/admin/dashboard/breeds-by-month', authenticateToken, isAdmin, (req, res) => {
    const targetMonth = req.query.month; // Format: YYYY-MM
    const monthsBack = parseInt(req.query.months) || 12;

    let query;
    let params = [];

    if (targetMonth) {
        // Specific month
        query = `SELECT
            breed,
            COUNT(*) as count,
            strftime('%Y-%m', created_at) as month
        FROM pets
        WHERE breed IS NOT NULL
            AND breed != ''
            AND strftime('%Y-%m', created_at) = ?
        GROUP BY breed
        ORDER BY count DESC
        LIMIT 10`;
        params = [targetMonth];
    } else {
        // All months in range
        query = `SELECT
            breed,
            COUNT(*) as count,
            strftime('%Y-%m', created_at) as month
        FROM pets
        WHERE breed IS NOT NULL
            AND breed != ''
            AND created_at >= date('now', '-${monthsBack} months')
        GROUP BY month, breed
        ORDER BY month DESC, count DESC`;
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json(rows);
    });
});

// 3. Blog Views Ranking
app.get('/api/admin/dashboard/blog-ranking', authenticateToken, isAdmin, (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    db.all(`SELECT
        id,
        title,
        slug,
        views,
        category,
        published_at,
        strftime('%Y-%m', published_at) as month
    FROM blogs
    WHERE status = 'published'
    ORDER BY views DESC
    LIMIT ?`, [limit], (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json(rows);
    });
});

// 4. Average Cat Age
app.get('/api/admin/dashboard/average-cat-age', authenticateToken, isAdmin, (req, res) => {
    db.get(`SELECT
        AVG(CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL)) as average_age,
        COUNT(*) as total_with_birthdate,
        MIN(CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL)) as youngest,
        MAX(CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL)) as oldest
    FROM pets
    WHERE birth_date IS NOT NULL AND birth_date != ''`, (err, result) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json({
            averageAge: result.average_age ? parseFloat(result.average_age.toFixed(2)) : 0,
            totalWithBirthdate: result.total_with_birthdate || 0,
            youngest: result.youngest ? parseFloat(result.youngest.toFixed(2)) : 0,
            oldest: result.oldest ? parseFloat(result.oldest.toFixed(2)) : 0
        });
    });
});

// 5. Monthly Summary (All stats by month)
app.get('/api/admin/dashboard/monthly-summary', authenticateToken, isAdmin, (req, res) => {
    const targetMonth = req.query.month || new Date().toISOString().slice(0, 7); // Default: current month
    const userTable = DB_STRUCTURE === 'new' ? 'members' : 'users';

    // Get all stats for the specified month
    const stats = {};

    // Users registered this month
    db.get(`SELECT COUNT(*) as count FROM ${userTable}
            WHERE strftime('%Y-%m', created_at) = ?`, [targetMonth], (err, userCount) => {
        stats.newUsers = userCount?.count || 0;

        // Pets registered this month
        db.get(`SELECT COUNT(*) as count FROM pets
                WHERE strftime('%Y-%m', created_at) = ?`, [targetMonth], (err, petCount) => {
            stats.newPets = petCount?.count || 0;

            // Top breed this month
            db.get(`SELECT breed, COUNT(*) as count FROM pets
                    WHERE breed IS NOT NULL AND breed != ''
                    AND strftime('%Y-%m', created_at) = ?
                    GROUP BY breed ORDER BY count DESC LIMIT 1`, [targetMonth], (err, topBreed) => {
                stats.topBreed = topBreed || { breed: 'ไม่มีข้อมูล', count: 0 };

                // Blogs published this month
                db.get(`SELECT COUNT(*) as count FROM blogs
                        WHERE strftime('%Y-%m', published_at) = ?`, [targetMonth], (err, blogCount) => {
                    stats.blogsPublished = blogCount?.count || 0;

                    // Total views this month (approximation)
                    db.get(`SELECT SUM(views) as total FROM blogs
                            WHERE strftime('%Y-%m', published_at) <= ?`, [targetMonth], (err, viewsTotal) => {
                        stats.totalBlogViews = viewsTotal?.total || 0;

                        res.json({
                            month: targetMonth,
                            ...stats
                        });
                    });
                });
            });
        });
    });
});

// 6. Available months (for dropdown selector)
app.get('/api/admin/dashboard/available-months', authenticateToken, isAdmin, (req, res) => {
    const userTable = DB_STRUCTURE === 'new' ? 'members' : 'users';

    db.all(`SELECT DISTINCT strftime('%Y-%m', created_at) as month
            FROM ${userTable}
            WHERE created_at IS NOT NULL
            UNION
            SELECT DISTINCT strftime('%Y-%m', created_at) as month
            FROM pets
            WHERE created_at IS NOT NULL
            ORDER BY month DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json(rows.map(r => r.month));
    });
});

// 7. Age Distribution
app.get('/api/admin/dashboard/age-distribution', authenticateToken, isAdmin, (req, res) => {
    db.all(`SELECT
        CASE
            WHEN CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL) < 1 THEN '0-1 ปี (ลูกแมว)'
            WHEN CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL) BETWEEN 1 AND 3 THEN '1-3 ปี (วัยเยาว์)'
            WHEN CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL) BETWEEN 3 AND 7 THEN '3-7 ปี (วัยผู้ใหญ่)'
            WHEN CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL) BETWEEN 7 AND 11 THEN '7-11 ปี (วัยสูงอายุ)'
            ELSE '11+ ปี (วัยชรา)'
        END as age_group,
        COUNT(*) as count
    FROM pets
    WHERE birth_date IS NOT NULL AND birth_date != ''
    GROUP BY age_group
    ORDER BY
        CASE age_group
            WHEN '0-1 ปี (ลูกแมว)' THEN 1
            WHEN '1-3 ปี (วัยเยาว์)' THEN 2
            WHEN '3-7 ปี (วัยผู้ใหญ่)' THEN 3
            WHEN '7-11 ปี (วัยสูงอายุ)' THEN 4
            ELSE 5
        END`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
        res.json(rows || []);
    });
});

// 8. Breed & Age Summary
app.get('/api/admin/dashboard/breed-age-summary', authenticateToken, isAdmin, (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    db.all(`SELECT
        breed,
        COUNT(*) as count,
        ROUND(AVG(CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL)), 2) as avg_age,
        MIN(CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL)) as min_age,
        MAX(CAST((julianday('now') - julianday(birth_date)) / 365.25 AS REAL)) as max_age
    FROM pets
    WHERE breed IS NOT NULL AND breed != '' AND birth_date IS NOT NULL AND birth_date != ''
    GROUP BY breed
    ORDER BY count DESC
    LIMIT ?`, [limit], (err, rows) => {
        if (err) return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });

        // Calculate percentage change (mock for now, can be enhanced)
        const total = rows.reduce((sum, r) => sum + r.count, 0);
        const result = rows.map(row => ({
            ...row,
            percentage: total > 0 ? ((row.count / total) * 100).toFixed(1) : 0
        }));

        res.json(result);
    });
});


// ============= AI CHAT ENDPOINT =============

app.post('/api/chat', optionalAuth, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'กรุณาส่งข้อความ' });
        }

        if (!OPENROUTER_API_KEY) {
            console.error('OPENROUTER_API_KEY is not configured');
            return res.status(500).json({ 
                error: 'ขออภัย ระบบ AI ยังไม่พร้อมใช้งาน',
                details: 'API key not configured' 
            });
        }

        const userId = req.user ? req.user.id : 'guest';
        console.log(`AI Chat Request from User ${userId}: "${message.substring(0, 50)}..."`);

        // System prompt สำหรับ AI CAT chatbot
        const systemPrompt = `คุณคือ AI CAT ผู้ช่วยให้คำแนะนำเกี่ยวกับการดูแลแมวและสัตว์เลี้ยง คุณมีความรู้เกี่ยวกับ:
- การดูแลสุขภาพแมว
- อาหารและโภชนาการ
- พฤติกรรมและการฝึก
- วัคซีนและการป้องกันโรค
- การรักษาโรคทั่วไป
- การดูแลสัตว์เลี้ยงชนิดอื่นๆ

กรุณาตอบเป็นภาษาไทย ให้คำแนะนำที่เป็นมิตร และเข้าใจง่าย ใช้อีโมจิแมวเป็นครั้งคราว `;

        // เรียก OpenRouter API
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.HTTP_REFERER || 'http://localhost:3000',
                'X-Title': 'Petizo AI Chat'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API Error:', response.status, errorData);
            return res.status(500).json({ 
                error: 'ไม่สามารถเชื่อมต่อกับ AI ได้',
                details: errorData.error?.message || `HTTP ${response.status}`
            });
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || 'ขออภัย ไม่สามารถสร้างคำตอบได้';

        console.log(`AI Chat: User ${userId} - "${message.substring(0, 30)}..."`);

        res.json({ 
            response: aiResponse,
            model: MODEL_NAME
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ 
            error: 'เกิดข้อผิดพลาดในการประมวลผล',
            details: error.message
        });
    }
});


// ============= UTILITY ENDPOINTS =============

// Upload file to Railway Volume (สำหรับ sync รูปจาก local)
app.post('/api/admin/upload-file', authenticateToken, isAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
        message: 'File uploaded successfully', 
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`
    });
});

// ============= ERROR HANDLING & START =============

app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
});

app.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' Petizo Server (Backward Compatible)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` DB Structure: ${DB_STRUCTURE.toUpperCase()}`);
    console.log('\n Login:');
    console.log('Admin: admin@petizo.com / admin123');
    console.log('Member: user@petizo.com / user123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});