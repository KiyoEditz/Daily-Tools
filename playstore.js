const axios = require('axios');
const cheerio = require('cheerio');

class PlayStoreScraper {
    static async search(query) {
        try {
            const url = `https://play.google.com/store/search?q=${encodeURIComponent(query)}&c=apps`;
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            });
            const $ = cheerio.load(data);
            const results = [];

            $(".ULeU3b > .VfPpkd-WsjYwc, a[href*='/store/apps/details']").each((_, element) => {
                const linkk = $(element).attr("href") || $(element).find("a").attr("href");
                if (!linkk) return;

                const nama = $(element).find(".DdYX5").text() || $(element).find("span").first().text() || $(element).text();
                const developer = $(element).find(".wMUdtb").text() || "No Developer";
                const img = $(element).find("img").attr("src") || "https://i.ibb.co/G7CrCwN/404.png";
                const rate = $(element).find(".ubGTjb > div").attr("aria-label") || $(element).find(".w2kbF").text() || "No Rate";
                const link = linkk.startsWith("http") ? linkk : `https://play.google.com${linkk}`;

                if (nama && link && !results.some(r => r.link === link)) {
                    results.push({
                        nama: nama.trim(),
                        developer: developer.trim(),
                        rate: rate.trim(),
                        link: link,
                        img: img,
                        link_dev: `https://play.google.com/store/apps/developer?id=${encodeURIComponent(developer.trim())}`
                    });
                }
            });

            if (!results.length) {
                return { success: false, data: [], error: "Tidak ditemukan hasil pencarian." };
            }

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
        if (!query) return console.log('❌ Masukkan nama aplikasi.\nContoh: node playstore.js search whatsapp');

        console.log(`📱 Mencari aplikasi Play Store: "${query}"...\n`);
        const result = await PlayStoreScraper.search(query);

        if (result.success && result.data.length > 0) {
            result.data.slice(0, 10).forEach((item, i) => {
                console.log(`${i + 1}. ${item.nama}`);
                console.log(`   Developer : ${item.developer}`);
                console.log(`   Rating    : ${item.rate}`);
                console.log(`   Link      : ${item.link}`);
                console.log(`   Link Dev  : ${item.link_dev}\n`);
            });
        } else {
            console.log(`❌ Gagal mengambil data: ${result.error || 'Tidak ada hasil.'}`);
        }
    } else {
        console.log('💡 Cara Penggunaan CLI PlayStore:');
        console.log('   Pencarian : node playstore.js search <nama_aplikasi>');
    }
}

runCLI();