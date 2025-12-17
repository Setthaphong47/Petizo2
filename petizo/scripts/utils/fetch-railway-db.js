const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

// Railway API URL
const API_URL = process.env.RAILWAY_API_URL || 'https://petizo.up.railway.app/api';
const OUTPUT_DB = path.join(__dirname, '../../railway-current.db');

console.log('Starting database export from Railway...');
console.log('API URL:', API_URL);
console.log('Output file:', OUTPUT_DB);

// Create new SQLite database
const db = new sqlite3.Database(OUTPUT_DB, (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
    console.log('Created new database file');
});

// Helper function to make HTTP requests
function fetchData(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${API_URL}${endpoint}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function exportDatabase() {
    try {
        // Create tables
        console.log('\n1. Creating tables...');

        // Admins table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                phone TEXT,
                profile_image TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => err ? reject(err) : resolve());
        });
        console.log('   Created admins table');

        // Members table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT,
                phone TEXT,
                profile_image TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => err ? reject(err) : resolve());
        });
        console.log('   Created members table');

        // Pets table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                species TEXT,
                breed TEXT,
                birthdate TEXT,
                gender TEXT,
                color TEXT,
                weight REAL,
                microchip_id TEXT,
                image TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (member_id) REFERENCES members (id)
            )`, (err) => err ? reject(err) : resolve());
        });
        console.log('   Created pets table');

        // Blogs table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS blogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                slug TEXT UNIQUE,
                content TEXT NOT NULL,
                excerpt TEXT,
                featured_image TEXT,
                category TEXT,
                tags TEXT,
                source_name TEXT,
                source_url TEXT,
                status TEXT DEFAULT 'draft',
                published_at DATETIME,
                views INTEGER DEFAULT 0,
                pinned INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admins (id)
            )`, (err) => err ? reject(err) : resolve());
        });
        console.log('   Created blogs table');

        // Vaccines table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS vaccines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                vaccine_name TEXT NOT NULL,
                vaccine_date TEXT NOT NULL,
                next_due_date TEXT,
                veterinarian TEXT,
                clinic_name TEXT,
                batch_number TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets (id)
            )`, (err) => err ? reject(err) : resolve());
        });
        console.log('   Created vaccines table');

        // Password resets table
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                user_type TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => err ? reject(err) : resolve());
        });
        console.log('   Created password_resets table');

        console.log('\n2. Fetching data from Railway API...');

        // Note: Since we need authentication to fetch data, we'll need to export via a special endpoint
        // For now, let's create a simpler approach using a dump endpoint

        console.log('\nDatabase schema created successfully!');
        console.log('To fetch actual data, you need to either:');
        console.log('1. Create an API endpoint that exports all data');
        console.log('2. Or download the database file directly from Railway');
        console.log('\nCreating download script instead...');

    } catch (error) {
        console.error('Error exporting database:', error);
        throw error;
    } finally {
        db.close((err) => {
            if (err) console.error('Error closing database:', err);
            console.log('\nDatabase connection closed');
        });
    }
}

exportDatabase().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
