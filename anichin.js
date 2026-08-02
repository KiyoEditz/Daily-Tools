const axios = require('axios');
const cheerio = require('cheerio');

class AnichinScraper {
    static baseUrl = 'https://anichin.co/';

    static getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        };
    }

    static async getLatest() {
        try {
            const { data } = await axios.get(this.baseUrl, { headers: this.getHeaders() });
            const $ = cheerio.load(data);
            const results = [];
            const seen = new Set();

            $('.listupd .bs, .listupd .bsx').each((_, element) => {
                const linkElement = $(element).find('a').first();
                const title = linkElement.attr('title') || $(element).find('.tt').text().trim() || $(element).find('h2').text().trim();
                const url = linkElement.attr('href');
                const episode = $(element).find('.bt .epx').text().trim() || $(element).find('.epx').text().trim();
                const thumbnail = $(element).find('img').attr('src');
                const type = $(element).find('.typez').text().trim();

                if (title && url && !seen.has(url)) {
                    seen.add(url);
                    results.push({ title: title.replace(/\s+/g, ' ').trim(), url, episode, thumbnail, type });
                }
            });

            return { success: true, data: results };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async search(query) {
        try {
            const url = `${this.baseUrl}?s=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url, { headers: this.getHeaders() });
            const $ = cheerio.load(data);
            const results = [];
            const seen = new Set();

            $('.listupd .bs, .listupd .bsx').each((_, el) => {
                const linkElement = $(el).find('a').first();
                const title = $(el).find('.tt h2').text().trim() || $(el).find('.tt').text().trim() || linkElement.attr('title') || $(el).find('h2').text().trim();
                const type = $(el).find('.typez').text().trim();
                const status = $(el).find('.bt .epx').text().trim() || $(el).find('.epx').text().trim();
                const link = linkElement.attr('href');
                const image = $(el).find('img').attr('src');

                if (title && link && !seen.has(link)) {
                    seen.add(link);
                    results.push({ title: title.replace(/\s+/g, ' ').trim(), type, status, link, image });
                }
            });

            return { success: true, data: results };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async getDetail(url) {
        try {
            const { data } = await axios.get(url, { headers: this.getHeaders() });
            const $ = cheerio.load(data);

            const title = $('.entry-title').text().trim();
            const thumbnail = $('.thumb img').attr('src');
            const rating = $('.rating strong').text().replace('Rating ', '').trim();
            const followers = $('.bmc').text().replace('Followed ', '').replace(' people', '').trim();
            const synopsis = $('.synp .entry-content').text().trim();
            const alternativeTitles = $('.alter').text().trim();
            const status = $('.info-content .spe span:contains("Status")').text().replace('Status:', '').trim();
            const studio = $('.info-content .spe span:contains("Studio") a').text().trim();
            const released = $('.info-content .spe span:contains("Released")').text().replace('Released:', '').trim();
            const duration = $('.info-content .spe span:contains("Duration")').text().replace('Duration:', '').trim();
            const genres = $('.genxed a').map((_, el) => $(el).text().trim()).get();

            return {
                success: true,
                data: { title, thumbnail, rating, followers, synopsis, alternativeTitles, status, studio, released, duration, genres }
            };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    static async getEpisodes(url) {
        try {
            const { data } = await axios.get(url, { headers: this.getHeaders() });
            const $ = cheerio.load(data);
            const episodes = [];

            $('.eplister ul li').each((_, element) => {
                const episodeNumber = $(element).find('.epl-num').text().trim();
                const title = $(element).find('.epl-title').text().trim();
                const subStatus = $(element).find('.epl-sub .status').text().trim();
                const releaseDate = $(element).find('.epl-date').text().trim();
                const link = $(element).find('a').attr('href');

                episodes.push({ episodeNumber, title, subStatus, releaseDate, link });
            });

            return { success: true, data: episodes };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async getDownloadLinks(url) {
        try {
            const { data } = await axios.get(url, { headers: this.getHeaders() });
            const $ = cheerio.load(data);
            const downloads = [];

            $('.mctnx .soraddlx').each((_, element) => {
                const resolution = $(element).find('.soraurlx strong').first().text().trim();
                const links = [];

                $(element).find('.soraurlx a').each((_, linkElement) => {
                    const host = $(linkElement).text().trim();
                    const link = $(linkElement).attr('href');
                    links.push({ host, link });
                });

                downloads.push({ resolution, links });
            });

            return { success: true, data: downloads };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async getPopular() {
        try {
            const { data } = await axios.get(this.baseUrl, { headers: this.getHeaders() });
            const $ = cheerio.load(data);
            const popularToday = [];

            $('.bixbox .listupd .bsx').each((_, element) => {
                const title = $(element).find('.tt').text().trim();
                const episode = $(element).find('.bt .epx').text().trim();
                const type = $(element).find('.typez').text().trim();
                const link = $(element).find('a').attr('href');
                const image = $(element).find('img').attr('src');

                if (title && link) {
                    popularToday.push({ title, episode, type, link, image });
                }
            });

            return { success: true, data: popularToday };
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

    if (!command) {
        console.log('💡 Cara Penggunaan (Anichin CLI):');
        console.log('   Pencarian        : node anichin.js search <judul>');
        console.log('   Rilisan Terbaru  : node anichin.js latest');
        console.log('   Donghua Populer  : node anichin.js popular');
        console.log('   Detail Donghua   : node anichin.js detail <url>');
        console.log('   Daftar Episode   : node anichin.js episode <url>');
        console.log('   Link Download    : node anichin.js download <url_episode>');
        console.log('\nContoh:');
        console.log('   node anichin.js search btth');
        return;
    }

    if (command === 'search') {
        if (!query) return console.log('❌ Masukkan judul donghua/anime.\nContoh: node anichin.js search btth');
        console.log(`🔍 Mencari Anichin: "${query}"...\n`);
        const res = await AnichinScraper.search(query);

        if (res.success && res.data.length > 0) {
            res.data.forEach((item, i) => {
                console.log(`${i + 1}. ${item.title}`);
                console.log(`   Status/Ep: ${item.status} [${item.type}]`);
                console.log(`   Link: ${item.link}\n`);
            });
        } else {
            console.log('❌ Tidak ditemukan hasil pencarian.');
        }

    } else if (command === 'latest') {
        console.log('🔍 Mengambil rilisan terbaru dari Anichin...\n');
        const res = await AnichinScraper.getLatest();

        if (res.success && res.data.length > 0) {
            res.data.forEach((item, i) => {
                console.log(`${i + 1}. ${item.title}`);
                console.log(`   Episode: ${item.episode} [${item.type}]`);
                console.log(`   Link: ${item.url}\n`);
            });
        } else {
            console.log('❌ Gagal mengambil data terbaru.');
        }

    } else if (command === 'popular') {
        console.log('🔥 Mengambil donghua populer hari ini...\n');
        const res = await AnichinScraper.getPopular();

        if (res.success && res.data.length > 0) {
            res.data.forEach((item, i) => {
                console.log(`${i + 1}. ${item.title}`);
                console.log(`   Episode: ${item.episode} [${item.type}]`);
                console.log(`   Link: ${item.link}\n`);
            });
        } else {
            console.log('❌ Gagal mengambil data populer.');
        }

    } else if (command === 'detail') {
        if (!query) return console.log('❌ Masukkan URL detail anichin.\nContoh: node anichin.js detail https://anichin.date/...');
        console.log(`🔍 Mengambil detail dari: ${query}...\n`);
        const res = await AnichinScraper.getDetail(query);

        if (res.success && res.data) {
            const d = res.data;
            console.log(`🎬 Judul: ${d.title}`);
            if (d.alternativeTitles) console.log(`🔤 Judul Lain: ${d.alternativeTitles}`);
            console.log(`⭐ Rating: ${d.rating}`);
            console.log(`📌 Status: ${d.status}`);
            console.log(`🏢 Studio: ${d.studio}`);
            console.log(`📅 Rilis: ${d.released}`);
            console.log(`⏱️ Durasi: ${d.duration}`);
            console.log(`🏷️ Genres: ${d.genres.join(', ')}`);
            console.log(`\n📖 Sinopsis:\n${d.synopsis}`);
        } else {
            console.log(`❌ Gagal mengambil detail: ${res.error}`);
        }

    } else if (command === 'episode') {
        if (!query) return console.log('❌ Masukkan URL donghua.\nContoh: node anichin.js episode https://anichin.date/...');
        console.log(`🔍 Mengambil daftar episode dari: ${query}...\n`);
        const res = await AnichinScraper.getEpisodes(query);

        if (res.success && res.data.length > 0) {
            res.data.forEach((ep) => {
                console.log(`Episode ${ep.episodeNumber}: ${ep.title}`);
                console.log(`  Sub: ${ep.subStatus} | Rilis: ${ep.releaseDate}`);
                console.log(`  Link: ${ep.link}\n`);
            });
        } else {
            console.log('❌ Gagal mengambil daftar episode.');
        }

    } else if (command === 'download') {
        if (!query) return console.log('❌ Masukkan URL episode anichin.\nContoh: node anichin.js download https://anichin.date/...');
        console.log(`🎥 Mengambil link download dari: ${query}...\n`);
        const res = await AnichinScraper.getDownloadLinks(query);

        if (res.success && res.data.length > 0) {
            res.data.forEach((dl) => {
                console.log(`[Resolusi ${dl.resolution}]`);
                dl.links.forEach((l) => {
                    console.log(`  - ${l.host}: ${l.link}`);
                });
                console.log('');
            });
        } else {
            console.log('❌ Gagal mengambil link download.');
        }

    } else {
        console.log('❌ Perintah tidak dikenal. Gunakan "node anichin.js" untuk bantuan.');
    }
}

module.exports = AnichinScraper;

if (require.main === module) {
    runCLI();
}
