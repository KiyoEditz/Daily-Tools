const { searching } = require("./lib/spotify");

class SpotifyScraper {
    static async search(query) {
        try {
            const res = await searching(query);
            if (!res || !res.status || !res.data) {
                return { success: false, data: [], error: res?.msg || 'Musik tidak ditemukan.' };
            }
            return { success: true, data: res.data };
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
        if (!query) return console.log('❌ Masukkan judul musik/lagu.\nContoh: node search-spotify.js search kemarin');

        console.log(`🎵 Mencari lagu di Spotify: "${query}"...\n`);
        const result = await SpotifyScraper.search(query);

        if (result.success && result.data.length > 0) {
            result.data.slice(0, 10).forEach((item, i) => {
                console.log(`${i + 1}. ${item.title}`);
                console.log(`   Popularitas : ${item.popularity}`);
                console.log(`   Durasi      : ${item.duration || '-'}`);
                console.log(`   URL         : ${item.url}\n`);
            });
        } else {
            console.log(`❌ Gagal mencari lagu: ${result.error || 'Tidak ada hasil.'}`);
        }
    } else {
        console.log('💡 Cara Penggunaan CLI Spotify Search:');
        console.log('   Pencarian : node search-spotify.js search <judul>');
    }
}

runCLI();