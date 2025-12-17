const fetch = require('node-fetch');

async function testStatsAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/dashboard/stats', {
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE'
            }
        });
        const data = await response.json();
        console.log('Stats API Response:');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testStatsAPI();
