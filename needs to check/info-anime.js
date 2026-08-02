/**
 * CLI Tool: info-anime.js
 * Source: plugins/info-anime.js
 */

const axios = require('axios');
const readline = require('readline');

class AnimeInfoScraper {
    static async search(query) {
        try {
            const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}`;
            const response = await axios.get(url);
            
            if (!response.data || !response.data.data || response.data.data.length === 0) {
                return { success: false, data: [], error: 'Anime tidak ditemukan' };
            }

            const results = response.data.data.map(item => {
                return {
                    id: item.mal_id,
                    title: item.title,
                    englishTitle: item.title_english,
                    japaneseTitle: item.title_japanese,
                    titles: item.titles ? item.titles.map(t => `${t.title} [${t.type}]`) : [],
                    image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
                    trailerUrl: item.trailer?.url,
                    episodes: item.episodes,
                    type: item.type,
                    status: item.status,
                    duration: item.duration,
                    score: item.score,
                    rating: item.rating,
                    scoredBy: item.scored_by,
                    rank: item.rank,
                    popularity: item.popularity,
                    season: item.season,
                    year: item.year,
                    favorites: item.favorites,
                    members: item.members,
                    url: item.url,
                    synopsis: item.synopsis,
                    background: item.background,
                    genres: item.genres ? item.genres.map(g => g.name) : [],
                    producers: item.producers ? item.producers.map(p => ({ name: p.name, url: p.url })) : [],
                    studios: item.studios ? item.studios.map(s => ({ name: s.name, url: s.url })) : []
                };
            });

            return { success: true, data: results };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }
}

async function runCLI() {
    const args = process.argv.slice(2);
    const query = args.join(' ');

    if (!query) {
        console.log(`\n========================================`);
        console.log(`         ANIME INFO CLI TOOL            `);
        console.log(`========================================`);
        console.log(`Penggunaan: node "needs to check/info-anime.js" <judul_anime>\n`);

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('Masukkan judul anime: ', async (input) => {
            rl.close();
            if (!input.trim()) return;
            await handleSearch(input.trim());
        });
        return;
    }

    await handleSearch(query);
}

async function handleSearch(query) {
    console.log(`🔍 Mencari informasi anime "${query}"...`);
    const res = await AnimeInfoScraper.search(query);

    if (!res.success || res.data.length === 0) {
        console.log(`❌ Error: ${res.error || 'Tidak ditemukan'}`);
        return;
    }

    const anime = res.data[0];
    console.log(`\n================ ANIME INFO ================`);
    console.log(`Judul        : ${anime.title} (${anime.japaneseTitle || ''})`);
    console.log(`Tipe         : ${anime.type || '-'} | Status: ${anime.status || '-'}`);
    console.log(`Episodes     : ${anime.episodes || 'N/A'} | Durasi: ${anime.duration || '-'}`);
    console.log(`Score        : ${anime.score || 'N/A'} (by ${anime.scoredBy || 0} users)`);
    console.log(`Rating       : ${anime.rating || '-'}`);
    console.log(`Rank         : #${anime.rank || 'N/A'} | Popularity: #${anime.popularity || 'N/A'}`);
    console.log(`Musim/Tahun  : ${anime.season || '-'} ${anime.year || ''}`);
    console.log(`Genre        : ${anime.genres.join(', ')}`);
    console.log(`Studio       : ${anime.studios.map(s => s.name).join(', ') || '-'}`);
    console.log(`Produser     : ${anime.producers.map(p => p.name).join(', ') || '-'}`);
    console.log(`Gambar       : ${anime.image}`);
    console.log(`Trailer      : ${anime.trailerUrl || '-'}`);
    console.log(`Link MAL     : ${anime.url}`);
    console.log(`\nSinopsis     :\n${anime.synopsis || 'Tidak ada sinopsis.'}`);
    console.log(`============================================`);
}

if (require.main === module) {
    runCLI();
}

module.exports = AnimeInfoScraper;
