const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const RAILWAY_URL = process.env.RAILWAY_API_URL || 'https://petizo.up.railway.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@petizo.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const OUTPUT_FILE = path.join(__dirname, '../../railway-current.db');

console.log('🚂 Downloading database from Railway...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📍 Server: ${RAILWAY_URL}`);
console.log(`👤 Admin: ${ADMIN_EMAIL}`);
console.log(`💾 Output: ${OUTPUT_FILE}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Helper function to make HTTP/HTTPS requests
function makeRequest(urlString, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(urlString);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.path,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = client.request(requestOptions, (res) => {
            if (options.downloadFile) {
                // Download file directly to disk
                const fileStream = fs.createWriteStream(options.downloadFile);
                res.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve({ statusCode: res.statusCode, filePath: options.downloadFile });
                });

                fileStream.on('error', (err) => {
                    fs.unlink(options.downloadFile, () => {}); // Delete partial file
                    reject(err);
                });
            } else {
                // Get JSON response
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
                    } catch (e) {
                        resolve({ statusCode: res.statusCode, data });
                    }
                });
            }
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function downloadDatabase() {
    try {
        // Step 1: Login to get JWT token
        console.log('1️⃣  Logging in as admin...');
        const loginResponse = await makeRequest(`${RAILWAY_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD
            }
        });

        if (loginResponse.statusCode !== 200) {
            throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
        }

        const token = loginResponse.data.token;
        console.log('   ✅ Login successful\n');

        // Step 2: Download database file
        console.log('2️⃣  Downloading database file...');
        const downloadResponse = await makeRequest(`${RAILWAY_URL}/api/admin/export-database`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            downloadFile: OUTPUT_FILE
        });

        if (downloadResponse.statusCode !== 200) {
            throw new Error(`Download failed with status code: ${downloadResponse.statusCode}`);
        }

        // Step 3: Verify downloaded file
        console.log('   ✅ Download complete\n');

        const stats = fs.statSync(OUTPUT_FILE);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Database exported successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📁 File: ${OUTPUT_FILE}`);
        console.log(`📊 Size: ${fileSizeInMB} MB`);
        console.log(`📅 Date: ${new Date().toLocaleString('th-TH')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Step 4: Show database info
        console.log('3️⃣  Analyzing database structure...\n');
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database(OUTPUT_FILE, sqlite3.OPEN_READONLY);

        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
            if (err) {
                console.error('Error reading database:', err);
                db.close();
                return;
            }

            console.log('📋 Tables found:');
            let tableCount = 0;

            const checkTable = (index) => {
                if (index >= tables.length) {
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`✅ Total tables: ${tableCount}`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    db.close();
                    return;
                }

                const table = tables[index];
                db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
                    tableCount++;
                    if (err) {
                        console.log(`   - ${table.name}: Error reading`);
                    } else {
                        console.log(`   - ${table.name}: ${result.count} rows`);
                    }
                    checkTable(index + 1);
                });
            };

            checkTable(0);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

downloadDatabase();
