const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
};

class Rule34Scraper {
    static async search(query) {
        try {
            const url = `https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, headers);
            const $ = cheerio.load(data);
            const results = [];

            $('span.thumb').each((i, el) => {
                const aTag = $(el).find('a');
                const imgTag = $(el).find('img');

                const postId = aTag.attr('id')?.replace('p', '');
                const postUrl = `https://rule34.xxx${aTag.attr('href')}`;
                const imageUrl = imgTag.attr('src');
                const title = imgTag.attr('title') || '';
                const tags = imgTag.attr('alt')?.split(' ') || [];

                if (postUrl && imageUrl) {
                    results.push({
                        id: postId,
                        link: postUrl,
                        image: imageUrl,
                        title: title.trim(),
                        tags: tags.filter((t) => t),
                    });
                }
            });

            return { success: true, data: results };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }
}

// ==========================================
// LOGIKA COMMAND LINE INTERFACE (CLI)
// ==========================================
async function runCLI() {
    const args = process.argv.slice(2);
    const command = args[0];
    const query = args.slice(1).join(' ');

    if (command === 'search') {
        if (!query) return console.log('❌ Masukkan tag pencarian.\nContoh: node rule34.js search hinata_hyuga');

        console.log(`🔞 Mencari Rule34: "${query}"...\n`);
        const result = await Rule34Scraper.search(query);

        if (result.success && result.data.length > 0) {
            result.data.slice(0, 10).forEach((item, i) => {
                console.log(`${i + 1}. ID: ${item.id}`);
                console.log(`   Title : ${item.title || '-'}`);
                console.log(`   Tags  : ${item.tags.join(', ')}`);
                console.log(`   Image : ${item.image}`);
                console.log(`   Link  : ${item.link}\n`);
            });
        } else {
            console.log(`❌ Gagal mencari data: ${result.error || 'Tidak ada hasil ditemukan.'}`);
        }
    } else {
        console.log('💡 Cara Penggunaan CLI Rule34:');
        console.log('   Pencarian : node rule34.js search <tags>');
    }
}

runCLI();