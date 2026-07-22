const axios = require('axios');

class TikTokPlayScraper {
    static async search(query) {
        try {
            const { data } = await axios.post('https://tikwm.com/api/feed/search',
                new URLSearchParams({ keywords: query, count: 10, cursor: 0 }).toString(),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
                }
            );

            if (data.code !== 0 || !data.data || !data.data.videos || data.data.videos.length === 0) {
                return { success: false, data: [], error: 'Video TikTok tidak ditemukan.' };
            }

            const results = data.data.videos.map(v => ({
                title: v.title || 'TikTok Video',
                author: v.author?.nickname || v.author?.unique_id || 'Unknown',
                views: v.play_count ? v.play_count.toLocaleString() : '0',
                videoUrl: v.play.startsWith('http') ? v.play : 'https://tikwm.com' + v.play,
                cover: v.cover.startsWith('http') ? v.cover : 'https://tikwm.com' + v.cover,
                wmVideoUrl: v.wmplay ? (v.wmplay.startsWith('http') ? v.wmplay : 'https://tikwm.com' + v.wmplay) : null
            }));

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
        if (!query) return console.log('❌ Masukkan query TikTok.\nContoh: node playtiktok.js search haikyuu edit');

        console.log(`🎬 Mencari video TikTok: "${query}"...\n`);
        const result = await TikTokPlayScraper.search(query);

        if (result.success && result.data.length > 0) {
            result.data.slice(0, 10).forEach((item, i) => {
                console.log(`${i + 1}. ${item.title}`);
                console.log(`   Author : ${item.author}`);
                console.log(`   Views  : ${item.views}`);
                console.log(`   Stream : ${item.videoUrl}`);
                console.log(`   Cover  : ${item.cover}\n`);
            });
        } else {
            console.log(`❌ Gagal mengambil video: ${result.error || 'Video tidak ditemukan.'}`);
        }
    } else {
        console.log('💡 Cara Penggunaan CLI PlayTikTok:');
        console.log('   Pencarian : node playtiktok.js search <query>');
    }
}

runCLI();