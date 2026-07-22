const axios = require('axios');
const cheerio = require('cheerio');
const { searching } = require('./lib/spotify');

async function testAll() {
    console.log('--- Testing Spotify Search ---');
    try {
        const spot = await searching('kemarin');
        console.log('Spotify Status:', spot.status, 'Count:', spot.data?.length);
        if (spot.data?.length > 0) console.log('Spotify Sample:', spot.data[0]);
    } catch(e) {
        console.log('Spotify Error:', e.message);
    }

    console.log('\n--- Testing Rule34 Search ---');
    try {
        const headers = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
            }
        };
        const { data } = await axios.get('https://rule34.xxx/index.php?page=post&s=list&tags=hinata_hyuga', headers);
        const $ = cheerio.load(data);
        const results = [];
        $('span.thumb').each((i, el) => {
            const aTag = $(el).find('a');
            const imgTag = $(el).find('img');
            const postId = aTag.attr('id')?.replace('p', '');
            const postUrl = `https://rule34.xxx${aTag.attr('href')}`;
            const imageUrl = imgTag.attr('src');
            const title = imgTag.attr('title') || '';
            results.push({ id: postId, link: postUrl, image: imageUrl, title });
        });
        console.log('Rule34 Count:', results.length);
        if (results.length > 0) console.log('Rule34 Sample:', results[0]);
    } catch(e) {
        console.log('Rule34 Error:', e.message);
    }

    console.log('\n--- Testing PlayTikTok ---');
    try {
        const { data } = await axios.get('https://apizell.web.id/download/tiktokplay?q=' + encodeURIComponent('haikyuu edit'));
        console.log('TikTok Status:', data.status, 'Count:', data.data?.length);
        if (data.data?.length > 0) console.log('TikTok Sample:', data.data[0]);
    } catch(e) {
        console.log('TikTok Error:', e.message);
    }

    console.log('\n--- Testing Playstore ---');
    try {
        const { data } = await axios.get('https://play.google.com/store/search?q=whatsapp&c=apps');
        const $ = cheerio.load(data);
        const results = [];
        $(".ULeU3b > .VfPpkd-WsjYwc").each((_, element) => {
            const linkk = $(element).find("a").attr("href");
            const nama = $(element).find(".DdYX5").text();
            const developer = $(element).find(".wMUdtb").text();
            const rate = $(element).find(".ubGTjb > div").attr("aria-label");
            if (nama && linkk) {
                results.push({
                    nama,
                    developer,
                    rate,
                    link: `https://play.google.com${linkk}`
                });
            }
        });
        console.log('Playstore Count:', results.length);
        if (results.length > 0) console.log('Playstore Sample:', results[0]);
    } catch(e) {
        console.log('Playstore Error:', e.message);
    }
}

testAll();
