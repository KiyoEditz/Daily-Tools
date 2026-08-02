/**
 * CLI Tool: wallpaperanime.js
 * Source: plugins/wallpaperanime.js
 */

const axios = require('axios');
const readline = require('readline');

class WallpaperAnimeScraper {
    static async search(query = 'anime wallpaper', limit = 5) {
        try {
            const url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&categories=010&purity=100&sorting=relevance`;
            const response = await axios.get(url);

            if (response.data && response.data.data && response.data.data.length > 0) {
                const wallpapers = response.data.data.slice(0, limit).map(item => ({
                    id: item.id,
                    url: item.path,
                    thumbnail: item.thumbs.large,
                    resolution: item.resolution,
                    category: item.category,
                    fileSize: item.file_size
                }));
                return { success: true, data: wallpapers };
            }

            return { success: false, data: [], error: 'Tidak ada wallpaper ditemukan' };
        } catch (error) {
            return { success: false, data: [], error: error.message };
        }
    }
}

async function runCLI() {
    const args = process.argv.slice(2);
    const query = args.join(' ') || 'anime wallpaper';

    console.log(`🖼️ Mencari anime wallpaper: "${query}"...`);
    const res = await WallpaperAnimeScraper.search(query, 5);

    if (!res.success || res.data.length === 0) {
        console.log(`❌ Error: ${res.error || 'Wallpaper tidak ditemukan'}`);
        return;
    }

    console.log(`\n✅ Hasil Wallpaper (${res.data.length}):`);
    res.data.forEach((wp, i) => {
        console.log(`\n[${i + 1}] ID: ${wp.id} (${wp.resolution})`);
        console.log(`    Gambar High-Res : ${wp.url}`);
        console.log(`    Thumbnail       : ${wp.thumbnail}`);
    });
}

if (require.main === module) {
    runCLI();
}

module.exports = WallpaperAnimeScraper;
