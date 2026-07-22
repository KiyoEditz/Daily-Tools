const axios = require('axios');

class PinterestScraper {
    static async search(query) {
        try {
            const url = `https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`;
            const { data } = await axios.get(url);

            if (!data.status || !data.data || data.data.length === 0) {
                return { success: false, data: [], error: 'Tidak ditemukan hasil gambar.' };
            }

            const results = data.data.map(item => ({
                title: item.grid_title || item.seo_alt_text || 'Pinterest Image',
                image: item.image_url,
                video: item.video_url,
                gif: item.gif_url,
                pinUrl: item.pin || `https://www.pinterest.com/pin/${item.id}`,
                pinner: item.pinner ? `${item.pinner.full_name} (@${item.pinner.username})` : 'Unknown',
                board: item.board?.name || '-',
                reactions: item.reaction_counts ? Object.values(item.reaction_counts).reduce((a, b) => a + b, 0) : 0
            })).filter(item => item.image);

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
        if (!query) return console.log('❌ Masukkan keyword pencarian.\nContoh: node pinterest.js search anime wallpaper');

        console.log(`🔍 Mencari gambar Pinterest: "${query}"...\n`);
        const result = await PinterestScraper.search(query);

        if (result.success && result.data.length > 0) {
            result.data.slice(0, 10).forEach((item, i) => {
                console.log(`${i + 1}. ${item.title}`);
                console.log(`   Uploader  : ${item.pinner}`);
                console.log(`   Board     : ${item.board}`);
                console.log(`   Reaksi    : ${item.reactions}`);
                console.log(`   Image Direct: ${item.image}`);
                if (item.video) console.log(`   Video Direct: ${item.video}`);
                console.log(`   Pin Link  : ${item.pinUrl}\n`);
            });
        } else {
            console.log(`❌ Gagal mengambil gambar: ${result.error || 'Tidak ada hasil.'}`);
        }
    } else {
        console.log('💡 Cara Penggunaan CLI Pinterest:');
        console.log('   Pencarian : node pinterest.js search <keyword>');
    }
}

runCLI();