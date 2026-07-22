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
                pinUrl: item.pin || `https://www.pinterest.com/pin/${item.id}`,
                pinner: item.pinner?.full_name || item.pinner?.username || 'Unknown'
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
        if (!query) return console.log('❌ Masukkan keyword pencarian.\nContoh: node pinterest.js search minecraft');

        console.log(`🔍 Mencari gambar Pinterest: "${query}"...\n`);
        const result = await PinterestScraper.search(query);

        if (result.success && result.data.length > 0) {
            result.data.slice(0, 10).forEach((item, i) => {
                console.log(`${i + 1}. ${item.title}`);
                console.log(`   Uploader : ${item.pinner}`);
                console.log(`   Image    : ${item.image}`);
                console.log(`   Pin URL  : ${item.pinUrl}\n`);
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