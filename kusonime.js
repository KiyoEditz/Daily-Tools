const axios = require('axios');
const cheerio = require('cheerio');

class KusonimeScraper {
    static async search(query) {
        try {
            const url = `https://kusonime.com/?s=${encodeURIComponent(query)}&post_type=post`;
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const result = $('.kover').map((_, element) => {
                const $element = $(element);
                return {
                    title: $element.find('.episodeye a').text().trim(),
                    link: $element.find('.episodeye a').attr('href'),
                    thumbnail: $element.find('.thumbz img').attr('src'),
                    postedBy: $element.find('.fa-user').parent().text().replace('Posted by', '').trim(),
                    releaseTime: $element.find('.fa-clock-o').parent().text().replace('Released on', '').trim(),
                    genres: $element.find('.fa-tag').parent().find('a').map((_, genre) => $(genre).text().trim()).get()
                };
            }).get();

            return { success: true, data: result };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async getDetail(url) {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const info = {};
            $('.info p').each((_, element) => {
                const text = $(element).text().trim();
                if (text.includes(':')) {
                    const [key, value] = text.split(':').map(item => item.trim());
                    info[key] = value;
                }
            });

            const synopsis = $('.lexot p').map((_, element) => {
                const text = $(element).text().trim();
                return (!text.includes('Released on') && !text.includes('Credit') && text.length > 0 && !text.includes(':')) ? text : null;
            }).get().filter(Boolean);

            const downloadLinks = {};
            $('.smokeurlrh').each((_, element) => {
                const $element = $(element);
                const quality = $element.find('strong').text().trim();
                const links = {};
                $element.find('a').each((_, link) => {
                    const $link = $(link);
                    links[$link.text().trim()] = $link.attr('href');
                });
                downloadLinks[quality] = links;
            });

            return {
                success: true,
                data: {
                    title: $('.jdlz').text().trim(),
                    thumbnail: $('.post-thumb img').attr('src') || $('.thumbz img').attr('src'),
                    banner: $('.post-thumb img').attr('src'),
                    views: $('.viewoy').text().trim(),
                    info,
                    synopsis,
                    downloadLinks
                }
            };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    static async latest(page = 1) {
        try {
            const pageNum = parseInt(page, 10) || 1;
            const url = pageNum > 1 ? `https://kusonime.com/page/${pageNum}/` : 'https://kusonime.com/';
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);

            const result = $('.kover').map((_, element) => {
                const $element = $(element);
                return {
                    title: $element.find('.episodeye a').text().trim(),
                    link: $element.find('.episodeye a').attr('href'),
                    thumbnail: $element.find('.thumbz img').attr('src'),
                    postedBy: $element.find('.fa-user').parent().text().replace('Posted by', '').trim(),
                    releaseTime: $element.find('.fa-clock-o').parent().text().replace('Released on', '').trim(),
                    genres: $element.find('.fa-tag').parent().find('a').map((_, genre) => $(genre).text().trim()).get()
                };
            }).get();

            return { success: true, data: result };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async getLatest(page = 1) {
        return this.latest(page);
    }
}

// ==========================================
// LOGIKA COMMAND LINE INTERFACE (CLI)
// ==========================================
async function runCLI() {
    // Mengambil argumen dari terminal (melewati 'node' dan 'kusonime.js')
    const args = process.argv.slice(2);
    const command = args[0];
    const query = args.slice(1).join(' ');

    if (command === 'latest') {
        const page = parseInt(args[1], 10) || 1;
        console.log(`⏳ Mengambil anime terbaru (Halaman ${page})...\n`);
        const result = await KusonimeScraper.latest(page);

        if (result.success && result.data.length > 0) {
            result.data.forEach((anime, i) => {
                console.log(`${i + 1}. ${anime.title}`);
                console.log(`   Genre: ${anime.genres.length > 0 ? anime.genres.join(', ') : '-'}`);
                console.log(`   URL  : ${anime.link}\n`);
            });
        } else {
            console.log('❌ Gagal mengambil daftar anime terbaru.');
        }

    } else if (command === 'search') {
        if (!query) return console.log('❌ Masukkan judul anime.\nContoh: node kusonime.js search naruto');

        console.log(`🔍 Mencari anime: "${query}"...\n`);
        const result = await KusonimeScraper.search(query);

        if (result.success && result.data.length > 0) {
            result.data.forEach((anime, i) => {
                console.log(`${i + 1}. ${anime.title}`);
                console.log(`   Link: ${anime.link}`);
                console.log(`   Genres: ${anime.genres.join(', ')}\n`);
            });
        } else {
            console.log('❌ Tidak ditemukan hasil pencarian.');
        }

    } else if (command === 'detail') {
        if (!query) return console.log('❌ Masukkan URL dari kusonime.\nContoh: node kusonime.js detail https://kusonime.com/...');

        console.log(`🔍 Mengambil detail dari: ${query}...\n`);
        const result = await KusonimeScraper.getDetail(query);

        if (result.success && result.data) {
            const { title, views, info, downloadLinks } = result.data;
            console.log(`🎬 Judul: ${title}`);
            console.log(`👁️ Views: ${views}\n`);

            console.log('ℹ️ Informasi:');
            for (const [key, value] of Object.entries(info)) {
                console.log(`   - ${key}: ${value}`);
            }

            console.log('\n🎥 Link Download:');
            for (const [quality, links] of Object.entries(downloadLinks)) {
                console.log(`   [${quality}]`);
                for (const [label, link] of Object.entries(links)) {
                    console.log(`     - ${label}: ${link}`);
                }
            }
        } else {
            console.log('❌ Gagal mengambil detail anime.');
        }

    } else {
        console.log('💡 Cara Penggunaan:');
        console.log('   Terbaru   : node kusonime.js latest [halaman]');
        console.log('   Pencarian : node kusonime.js search <judul>');
        console.log('   Detail    : node kusonime.js detail <url>');
    }
}

module.exports = KusonimeScraper;

if (require.main === module) {
    // Menjalankan fungsi utama
    runCLI();
}