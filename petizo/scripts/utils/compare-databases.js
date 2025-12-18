const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Paths to databases
const OLD_DB = path.join(__dirname, '../../data/petizo.db');
const NEW_DB = path.join(__dirname, '../../railway-current.db');

console.log('เปรียบเทียบฐานข้อมูล');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`ฐานข้อมูลเก่า (Local): ${OLD_DB}`);
console.log(`ฐานข้อมูลใหม่ (Railway): ${NEW_DB}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Helper function to get database info
function getDatabaseInfo(dbPath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                reject(err);
                return;
            }
        });

        const info = {
            tables: {},
            tableList: []
        };

        // Get all tables
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, tables) => {
            if (err) {
                db.close();
                reject(err);
                return;
            }

            info.tableList = tables.map(t => t.name);
            let processedTables = 0;

            if (tables.length === 0) {
                db.close();
                resolve(info);
                return;
            }

            tables.forEach(table => {
                const tableName = table.name;
                info.tables[tableName] = {
                    columns: [],
                    rowCount: 0
                };

                // Get table structure
                db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                    if (err) {
                        processedTables++;
                        if (processedTables === tables.length) {
                            db.close();
                            resolve(info);
                        }
                        return;
                    }

                    info.tables[tableName].columns = columns.map(col => ({
                        name: col.name,
                        type: col.type,
                        notnull: col.notnull,
                        dflt_value: col.dflt_value,
                        pk: col.pk
                    }));

                    // Get row count
                    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
                        if (!err && result) {
                            info.tables[tableName].rowCount = result.count;
                        }

                        processedTables++;
                        if (processedTables === tables.length) {
                            db.close();
                            resolve(info);
                        }
                    });
                });
            });
        });
    });
}

async function compareDatabases() {
    try {
        console.log('กำลังวิเคราะห์ฐานข้อมูลเก่า...');
        const oldInfo = await getDatabaseInfo(OLD_DB);

        console.log('กำลังวิเคราะห์ฐานข้อมูลใหม่...');
        const newInfo = await getDatabaseInfo(NEW_DB);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('สรุปผลการเปรียบเทียบ');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Compare tables
        const oldTables = new Set(oldInfo.tableList);
        const newTables = new Set(newInfo.tableList);

        const tablesOnlyInOld = [...oldTables].filter(t => !newTables.has(t));
        const tablesOnlyInNew = [...newTables].filter(t => !oldTables.has(t));
        const commonTables = [...oldTables].filter(t => newTables.has(t));

        // 1. Tables comparison
        console.log('1. ตารางที่มีในฐานข้อมูล:\n');
        console.log(`ฐานข้อมูลเก่า: ${oldInfo.tableList.length} ตาราง`);
        console.log(`ฐานข้อมูลใหม่: ${newInfo.tableList.length} ตาราง`);
        console.log(`ตารางเหมือนกัน: ${commonTables.length} ตาราง\n`);

        if (tablesOnlyInOld.length > 0) {
            console.log('ตารางที่มีแค่ในฐานข้อมูลเก่า:');
            tablesOnlyInOld.forEach(t => console.log(`      - ${t}`));
            console.log('');
        }

        if (tablesOnlyInNew.length > 0) {
            console.log('ตารางใหม่ที่เพิ่มเข้ามา:');
            tablesOnlyInNew.forEach(t => console.log(`      - ${t} (${newInfo.tables[t].rowCount} rows)`));
            console.log('');
        }

        // 2. Compare common tables
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('2. เปรียบเทียบข้อมูลในแต่ละตาราง:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        commonTables.sort().forEach(tableName => {
            const oldTable = oldInfo.tables[tableName];
            const newTable = newInfo.tables[tableName];

            console.log(`ตาราง: ${tableName}`);

            // Row count comparison
            const oldCount = oldTable.rowCount;
            const newCount = newTable.rowCount;
            const diff = newCount - oldCount;

            console.log(`   จำนวนแถว:`);
            console.log(`   เก่า: ${oldCount} rows`);
            console.log(`   ใหม่: ${newCount} rows`);

            if (diff > 0) {
                console.log(`      เพิ่มขึ้น: +${diff} rows`);
            } else if (diff < 0) {
                console.log(`      ลดลง: ${diff} rows`);
            } else {
                console.log(`      ไม่เปลี่ยนแปลง`);
            }

            // Column comparison
            const oldColumns = new Set(oldTable.columns.map(c => c.name));
            const newColumns = new Set(newTable.columns.map(c => c.name));

            const columnsOnlyInOld = [...oldColumns].filter(c => !newColumns.has(c));
            const columnsOnlyInNew = [...newColumns].filter(c => !oldColumns.has(c));

            if (columnsOnlyInOld.length > 0) {
                console.log(`   คอลัมน์ที่ถูกลบ:`);
                columnsOnlyInOld.forEach(c => console.log(`      - ${c}`));
            }

            if (columnsOnlyInNew.length > 0) {
                console.log(`   คอลัมน์ใหม่ที่เพิ่ม:`);
                columnsOnlyInNew.forEach(c => {
                    const col = newTable.columns.find(col => col.name === c);
                    console.log(`      - ${c} (${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ' DEFAULT ' + col.dflt_value : ''})`);
                });
            }

            console.log('');
        });

        // 3. Detailed summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('สรุปรวม:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let totalOldRows = 0;
        let totalNewRows = 0;

        commonTables.forEach(t => {
            totalOldRows += oldInfo.tables[t].rowCount;
            totalNewRows += newInfo.tables[t].rowCount;
        });

        console.log(`จำนวนข้อมูลทั้งหมด:`);
        console.log(`ฐานข้อมูลเก่า: ${totalOldRows} rows`);
        console.log(`ฐานข้อมูลใหม่: ${totalNewRows} rows`);
        console.log(`   ${totalNewRows > totalOldRows ? '[+]' : totalNewRows < totalOldRows ? '[-]' : '[=]'} ผลต่าง: ${totalNewRows - totalOldRows > 0 ? '+' : ''}${totalNewRows - totalOldRows} rows\n`);

        console.log(`การเปลี่ยนแปลงโครงสร้าง:`);
        console.log(`   [+] ตารางใหม่: ${tablesOnlyInNew.length}`);
        console.log(`   [-] ตารางที่ถูกลบ: ${tablesOnlyInOld.length}`);

        let totalNewColumns = 0;
        let totalDeletedColumns = 0;

        commonTables.forEach(tableName => {
            const oldTable = oldInfo.tables[tableName];
            const newTable = newInfo.tables[tableName];
            const oldColumns = new Set(oldTable.columns.map(c => c.name));
            const newColumns = new Set(newTable.columns.map(c => c.name));
            totalNewColumns += [...newColumns].filter(c => !oldColumns.has(c)).length;
            totalDeletedColumns += [...oldColumns].filter(c => !newColumns.has(c)).length;
        });

        console.log(`   [+] คอลัมน์ใหม่: ${totalNewColumns}`);
        console.log(`   [-] คอลัมน์ที่ถูกลบ: ${totalDeletedColumns}\n`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('[ERROR] เกิดข้อผิดพลาด:', error.message);
        process.exit(1);
    }
}

compareDatabases();
