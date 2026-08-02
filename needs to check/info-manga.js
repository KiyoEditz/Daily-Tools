/**
 * CLI Tool: info-manga.js
 * Source: plugins/info-manga.js
 */

const axios = require('axios');
const readline = require('readline');

class MangaInfoScraper {
    static async search(query) {
        try {
            const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}`;
            const response = await axios.get(url);

            if (!response.data || !response.data.data || response.data.data.length === 0) {
                return { success: false, data: [], error: 'Manga tidak ditemukan' };
            }

            const results = response.data.data.map(item => {
                return {
                    id: item.mal_id,
                    title: item.title,
                    englishTitle: item.title_english,
                    japaneseTitle: item.title_japanese,
                    titles: item.titles ? item.titles.map(t => `${t.title} [${t.type}]`) : [],
                    image: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
                    chapters: item.chapters,
                    volumes: item.volumes,
                    type: item.type,
                    status: item.status,
                    score: item.score,
                    scoredBy: item.scored_by,
                    rank: item.rank,
                    popularity: item.popularity,
                    favorites: item.favorites,
                    members: item.members,
                    url: item.url,
                    synopsis: item.synopsis,
                    background: item.background,
                    genres: item.genres ? item.genres.map(g => g.name) : [],
                    authors: item.authors ? item.authors.map(a => ({ name: a.name, url: a.url })) : []
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
        console.log(`         MANGA INFO CLI TOOL            `);
        console.log(`========================================`);
        console.log(`Penggunaan: node "needs to check/info-manga.js" <judul_manga>\n`);

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('Masukkan judul manga: ', async (input) => {
            rl.close();
            if (!input.trim()) return;
            await handleSearch(input.trim());
        });
        return;
    }

    await handleSearch(query);
}

async function handleSearch(query) {
    console.log(`🔍 Mencari informasi manga "${query}"...`);
    const res = await MangaInfoScraper.search(query);

    if (!res.success || res.data.length === 0) {
        console.log(`❌ Error: ${res.error || 'Tidak ditemukan'}`);
        return;
    }

    const manga = res.data[0];
    console.log(`\n================ MANGA INFO ================`);
    console.log(`Judul        : ${manga.title} (${manga.japaneseTitle || ''})`);
    console.log(`Tipe         : ${manga.type || '-'} | Status: ${manga.status || '-'}`);
    console.log(`Chapters     : ${manga.chapters || 'N/A'} | Volumes: ${manga.volumes || 'N/A'}`);
    console.log(`Score        : ${manga.score || 'N/A'} (by ${manga.scoredBy || 0} users)`);
    console.log(`Rank         : #${manga.rank || 'N/A'} | Popularity: #${manga.popularity || 'N/A'}`);
    console.log(`Genre        : ${manga.genres.join(', ')}`);
    console.log(`Penulis      : ${manga.authors.map(a => a.name).join(', ') || '-'}`);
    console.log(`Gambar       : ${manga.image}`);
    console.log(`Link MAL     : ${manga.url}`);
    console.log(`\nSinopsis     :\n${manga.synopsis || 'Tidak ada sinopsis.'}`);
    console.log(`============================================`);
}

if (require.main === module) {
    runCLI();
}

module.exports = MangaInfoScraper;
