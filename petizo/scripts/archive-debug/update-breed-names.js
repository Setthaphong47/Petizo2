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

// Mapping จากภาษาอังกฤษเป็นภาษาไทย
const breedMapping = {
    'Siamese': 'วิเชียรมาศ',
    'Korat': 'ศุพลักษณ์',
    'Khao Manee': 'ขาวมณี',
    'Suphalak': 'โคโรช',
    'Persian': 'เปอร์เซีย',
    'Maine Coon': 'เมนคูน',
    'American Shorthair': 'อเมริกันช็อตแฮร์',
    'British Shorthair': 'บริติชช็อตแฮร์',
    'Scottish Fold': 'สก็อตติชโฟลด์',
    'Munchkin': 'มันช์กิ้น',
    'Bengal': 'เบงกอล',
    'Sphynx': 'สฟิงซ์',
    'Ragdoll': 'แร็กดอลล์',
    'Russian Blue': 'รัสเซียนบลู',
    'Scottish Straight': 'สก็อตติชสเตรท',
    'Exotic Shorthair': 'เอ็กโซติกช็อตแฮร์',
    'American Curl': 'อเมริกันเคิร์ล',
    'Norwegian Forest Cat': 'นอร์วีเจียนฟอเรสต์',
    'Himalayan': 'ฮิมาลายัน',
    'Abyssinian': 'อบิสซิเนียน',
    'Devon Rex': 'เดวอนเร็กซ์'
};

console.log('🔄 Updating breed names from English to Thai...\n');

// Get all pets that need update
db.all(`SELECT id, name, breed FROM pets WHERE breed IS NOT NULL AND breed != ''`, [], (err, rows) => {
    if (err) {
        console.error('Error fetching pets:', err);
        db.close();
        process.exit(1);
    }

    if (rows.length === 0) {
        console.log('✅ No pets found in database\n');
        db.close();
        return;
    }

    let needsUpdate = rows.filter(pet => breedMapping[pet.breed]);

    if (needsUpdate.length === 0) {
        console.log('✅ All breeds are already in Thai!\n');
        db.close();
        return;
    }

    console.log(`⚠️  Found ${needsUpdate.length} pets with English breed names\n`);

    let updated = 0;
    let processed = 0;

    needsUpdate.forEach(pet => {
        const newBreed = breedMapping[pet.breed];
        
        console.log(`🔧 Updating: ${pet.name} (ID: ${pet.id})`);
        console.log(`   ${pet.breed} → ${newBreed}`);
        
        db.run(
            `UPDATE pets SET breed = ? WHERE id = ?`,
            [newBreed, pet.id],
            function(updateErr) {
                processed++;
                
                if (updateErr) {
                    console.error(`❌ Error updating pet ${pet.id}:`, updateErr);
                } else {
                    updated++;
                    console.log(`✅ Success!\n`);
                }

                if (processed === needsUpdate.length) {
                    console.log('='.repeat(80));
                    console.log(`\n🎉 Updated ${updated} out of ${needsUpdate.length} pets successfully!`);
                    
                    // Verify
                    db.all(`SELECT id, name, breed FROM pets WHERE breed IS NOT NULL AND breed != ''`, [], (err2, verifyRows) => {
                        if (!err2) {
                            console.log('\n📋 Current breeds in database:');
                            verifyRows.forEach(pet => {
                                console.log(`   - ${pet.name}: ${pet.breed}`);
                            });
                        }
                        db.close();
                    });
                }
            }
        );
    });
});
