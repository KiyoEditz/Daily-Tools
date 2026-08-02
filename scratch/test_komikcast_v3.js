const axios = require('axios');

(async () => {
    const urls = [
        'https://be.komikcast.cc/series/solo-farming-in-the-tower/chapter/136',
        'https://be.komikcast.cc/series/7120/chapter/136',
        'https://be.komikcast.cc/chapters/413655',
        'https://be.komikcast.cc/series/solo-farming-in-the-tower/chapters/413655',
        'https://be.komikcast.cc/chapter?id=413655',
        'https://be.komikcast.cc/series/solo-farming-in-the-tower/136'
    ];

    for (const u of urls) {
        try {
            console.log('Testing:', u);
            const res = await axios.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            console.log(`✅ SUCCESS (${res.status}):`, typeof res.data);
            if (typeof res.data === 'object') {
                console.log('Keys:', Object.keys(res.data));
                console.log('Sample:', JSON.stringify(res.data).slice(0, 600));
            }
        } catch (e) {
            console.log(`❌ FAIL (${u}):`, e.message);
        }
    }
})();
