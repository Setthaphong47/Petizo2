const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔄 Downloading petizo.db from GitHub...\n');

const url = 'https://raw.githubusercontent.com/Setthaphong47/Petizo2/main/petizo/data/petizo.db.backup';
const outputPath = path.join(__dirname, 'data', 'petizo.db');

// สร้าง data folder ถ้ายังไม่มี
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory\n');
}

const file = fs.createWriteStream(outputPath);

https.get(url, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Error: HTTP ${response.statusCode}`);
        process.exit(1);
    }

    response.pipe(file);

    file.on('finish', () => {
        file.close();
        console.log('Successfully downloaded petizo.db!');
        console.log(`📁 Saved to: ${outputPath}\n`);

        // แสดงขนาดไฟล์
        const stats = fs.statSync(outputPath);
        console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB\n`);

        process.exit(0);
    });
}).on('error', (err) => {
    fs.unlink(outputPath, () => {});
    console.error('Download failed:', err.message);
    process.exit(1);
});
