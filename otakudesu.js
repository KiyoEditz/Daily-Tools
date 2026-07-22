const axios = require("axios");
const cheerio = require("cheerio");

class OtakudesuScraper {
    static baseUrl = "https://otakudesu.blog";

    static async latestAnime() {
        try {
            const url = `${this.baseUrl}/ongoing-anime/`;
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);

            const animeList = [];

            $(".venz ul li").each((i, elem) => {
                const title = $(elem).find("h2.jdlflm").text().trim();
                const episode = $(elem).find(".epz").text().replace("Episode ", "").trim();
                const releaseDay = $(elem).find(".epztipe").text().trim();
                const releaseDate = $(elem).find(".newnime").text().trim();
                const image = $(elem).find(".thumbz img").attr("src");
                const link = $(elem).find(".thumb a").attr("href");

                if (title && link) {
                    animeList.push({ title, episode, releaseDay, releaseDate, image, link });
                }
            });

            return { success: true, data: animeList };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async searchAnime(query) {
        try {
            const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(query)}&post_type=anime`;
            const { data } = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(data);
            const results = [];

            $('.chivsrc > li').each((i, el) => {
                const image = $(el).find('img').attr('src');
                const title = $(el).find('h2 a').text().trim();
                const url = $(el).find('h2 a').attr('href');
                const genres = [];
                $(el).find('.set').eq(0).find('a').each((_, genre) => {
                    genres.push($(genre).text().trim());
                });
                const status = $(el).find('.set').eq(1).text().replace(/^Status\s*:\s*/, '').trim();
                const rating = $(el).find('.set').eq(2).text().replace(/^Rating\s*:\s*/, '').trim();

                if (title && url) {
                    results.push({ title, url, image, genres, status, rating });
                }
            });

            return { success: true, data: results };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }

    static async animeDetail(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);

            const title = $('title').text().split('|')[0].trim();
            const description = $('meta[name="description"]').attr('content') || '';
            const image = $('meta[property="og:image"]').attr('content') || '';

            const titleJapanese = $('p:contains("Japanese")').text().replace(/^Japanese\s*:\s*/, '').trim();
            const score = $('p:contains("Skor")').text().replace(/^Skor\s*:\s*/, '').trim();
            const rating = $('p:contains("Rating")').text().replace(/^Rating\s*:\s*/, '').trim();
            const producer = $('p:contains("Produser")').text().replace(/^Produser\s*:\s*/, '').trim();
            const type = $('p:contains("Tipe")').text().replace(/^Tipe\s*:\s*/, '').trim();
            const status = $('p:contains("Status")').text().replace(/^Status\s*:\s*/, '').trim();
            const totalEpisodes = $('p:contains("Total Episode")').text().replace(/^Total Episode\s*:\s*/, '').trim();
            const duration = $('p:contains("Durasi")').text().replace(/^Durasi\s*:\s*/, '').trim();
            const releaseDate = $('p:contains("Tanggal Rilis")').text().replace(/^Tanggal Rilis\s*:\s*/, '').trim();
            const studio = $('p:contains("Studio")').text().replace(/^Studio\s*:\s*/, '').trim();
            const genres = $('p:contains("Genre") a').map((i, el) => $(el).text().trim()).get().join(', ');
            const synopsis = $('.sinopc p').map((i, el) => $(el).text().trim()).get().join(' ');

            return {
                success: true,
                data: {
                    title, titleJapanese, description, image, score, rating,
                    producer, type, status, totalEpisodes, duration, releaseDate,
                    studio, genres, synopsis, url
                }
            };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    static async episodeData(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            const episodes = [];

            $('.episodelist ul li').each((index, element) => {
                const title = $(element).find('a').text().trim();
                const epUrl = $(element).find('a').attr('href');
                const date = $(element).find('.zeebr').text().trim();

                episodes.push({ title, url: epUrl, date });
            });

            return {
                success: true,
                data: {
                    title: $('.monktit').text().trim() || $('title').text().trim(),
                    episodes
                }
            };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    static async linkDownloadData(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            const iframeSrc = $('#lightsVideo iframe').attr('src');
            const downloads = $('.download li').map((index, element) => {
                const quality = $(element).find('strong').text().trim();
                const links = $(element).find('a').map((index, linkElement) => ({
                    host: $(linkElement).text().trim(),
                    url: $(linkElement).attr('href'),
                })).get();
                const size = $(element).find('i').text().trim();

                return { quality, links, size };
            }).get();

            return {
                success: true,
                data: {
                    title: $('h4').text().trim() || $('title').text().trim(),
                    streamFrame: iframeSrc,
                    downloads
                }
            };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    static async videoData(url) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const regex = /sources:\s*(.*?)/;
            const matches = data.match(regex);
            if (matches) {
                const jsonObject = JSON.parse(matches[1].replace(/'/g, '"'));
                return { success: true, data: jsonObject[0].file };
            } else {
                return { success: false, data: null, error: 'Source video tidak ditemukan.' };
            }
        } catch (error) {
            return { success: false, data: null, error: error.message };
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

    if (command === 'latest') {
        console.log('🔥 Mengambil daftar anime terbaru...\n');
        const result = await OtakudesuScraper.latestAnime();

        if (result.success && result.data.length > 0) {
            result.data.forEach((anime, i) => {
                console.log(`${i + 1}. ${anime.title}`);
                console.log(`   Episode : ${anime.episode}`);
                console.log(`   Rilis   : ${anime.releaseDay} (${anime.releaseDate})`);
                console.log(`   Link    : ${anime.link}\n`);
            });
        } else {
            console.log(`❌ Gagal mengambil data: ${result.error || 'Tidak ada data ditemukan.'}`);
        }

    } else if (command === 'search') {
        if (!query) return console.log('❌ Masukkan judul anime.\nContoh: node otakudesu.js search naruto');

        console.log(`🔍 Mencari anime: "${query}"...\n`);
        const result = await OtakudesuScraper.searchAnime(query);

        if (result.success && result.data.length > 0) {
            result.data.forEach((anime, i) => {
                console.log(`${i + 1}. ${anime.title}`);
                console.log(`   Status : ${anime.status}`);
                console.log(`   Rating : ${anime.rating}`);
                console.log(`   Genre  : ${anime.genres.join(', ')}`);
                console.log(`   Link   : ${anime.url}\n`);
            });
        } else {
            console.log(`❌ Gagal mencari anime: ${result.error || 'Tidak ditemukan hasil.'}`);
        }

    } else if (command === 'detail') {
        if (!query) return console.log('❌ Masukkan URL detail anime.\nContoh: node otakudesu.js detail https://otakudesu.cloud/anime/...');

        console.log(`🔍 Mengambil detail dari: ${query}...\n`);
        const result = await OtakudesuScraper.animeDetail(query);

        if (result.success && result.data) {
            const data = result.data;
            console.log(`🎬 Judul       : ${data.title}`);
            console.log(`🇯🇵 Japanese    : ${data.titleJapanese}`);
            console.log(`⭐ Skor        : ${data.score}`);
            console.log(`🏢 Studio      : ${data.studio}`);
            console.log(`📅 Rilis       : ${data.releaseDate}`);
            console.log(`📺 Ep Total    : ${data.totalEpisodes}`);
            console.log(`⏱️ Durasi      : ${data.duration}`);
            console.log(`🏷️ Genre       : ${data.genres}`);
            console.log(`\n📝 Sinopsis:\n${data.synopsis}\n`);
            console.log(`🔗 Link        : ${data.url}`);
        } else {
            console.log(`❌ Gagal mengambil detail: ${result.error || 'Data tidak ditemukan.'}`);
        }

    } else if (command === 'episode') {
        if (!query) return console.log('❌ Masukkan URL anime untuk melihat daftar episode.\nContoh: node otakudesu.js episode https://otakudesu.cloud/anime/...');

        console.log(`📺 Mengambil daftar episode dari: ${query}...\n`);
        const result = await OtakudesuScraper.episodeData(query);

        if (result.success && result.data && result.data.episodes.length > 0) {
            console.log(`📌 Anime: ${result.data.title}\n`);
            result.data.episodes.forEach((ep, i) => {
                console.log(`${i + 1}. ${ep.title}`);
                console.log(`   Tanggal : ${ep.date}`);
                console.log(`   Link    : ${ep.url}\n`);
            });
        } else {
            console.log(`❌ Gagal mengambil episode: ${result.error || 'Episode tidak ditemukan.'}`);
        }

    } else if (command === 'download') {
        if (!query) return console.log('❌ Masukkan URL episode anime.\nContoh: node otakudesu.js download https://otakudesu.cloud/episode/...');

        console.log(`📥 Mengambil link download dari: ${query}...\n`);
        const result = await OtakudesuScraper.linkDownloadData(query);

        if (result.success && result.data) {
            console.log(`📌 Judul  : ${result.data.title}`);
            if (result.data.streamFrame) {
                console.log(`🎥 Stream : ${result.data.streamFrame}`);
            }
            console.log('\n💾 Link Download:');
            result.data.downloads.forEach(dl => {
                console.log(`\n   [${dl.quality}] (${dl.size})`);
                dl.links.forEach(link => {
                    console.log(`     - ${link.host}: ${link.url}`);
                });
            });
        } else {
            console.log(`❌ Gagal mengambil link download: ${result.error || 'Data tidak ditemukan.'}`);
        }

    } else if (command === 'video') {
        if (!query) return console.log('❌ Masukkan URL episode anime.\nContoh: node otakudesu.js video https://otakudesu.cloud/episode/...');

        console.log(`🎥 Mengambil link video stream dari: ${query}...\n`);
        const result = await OtakudesuScraper.videoData(query);

        if (result.success && result.data) {
            console.log(`🎬 Stream Direct Link: ${result.data}`);
        } else {
            console.log(`❌ Gagal mengambil video stream: ${result.error || 'Video tidak ditemukan.'}`);
        }

    } else {
        console.log('💡 Cara Penggunaan CLI Otakudesu:');
        console.log('   Anime Terbaru : node otakudesu.js latest');
        console.log('   Pencarian     : node otakudesu.js search <judul>');
        console.log('   Detail Anime  : node otakudesu.js detail <url>');
        console.log('   Daftar Episode: node otakudesu.js episode <url>');
        console.log('   Link Download : node otakudesu.js download <url>');
        console.log('   Direct Stream : node otakudesu.js video <url>');
    }
}

runCLI();