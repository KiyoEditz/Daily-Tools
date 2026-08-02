/**
 * CLI Tool: ig.js
 * Source: plugins/ig.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

class InstagramScraper {
  static async download(url) {
    try {
      // Primary: SnapDownloader / Indown scraper
      let { data } = await axios.get(`https://snapdownloader.com/tools/instagram-downloader/download?url=${encodeURIComponent(url)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      let $ = cheerio.load(data);
      const mediaList = [];

      $(".download-item").each((i, el) => {
        const type = $(el).find(".type").text().trim().toLowerCase() || 'media';
        const mediaUrl = $(el).find(".btn-download").attr("href");
        if (mediaUrl) mediaList.push({ type, url: mediaUrl });
      });

      if (mediaList.length > 0) {
        return { success: true, data: mediaList };
      }

      // Fallback: Cobalt API
      const cobRes = await axios.post('https://api.cobalt.tools/api/json', {
        url: url
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (cobRes.data && cobRes.data.url) {
        return {
          success: true,
          data: [{ type: cobRes.data.picker ? 'album' : 'media', url: cobRes.data.url }]
        };
      }

      return { success: false, data: [], error: 'Gagal mengambil media Instagram.' };
    } catch (err) {
      return { success: false, data: [], error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.log(`\n========================================`);
    console.log(`       INSTAGRAM DOWNLOADER CLI         `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/ig.js" <url_post_reel_ig>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan URL Post / Reel Instagram: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleDownload(input.trim());
    });
    return;
  }

  await handleDownload(url);
}

async function handleDownload(url) {
  console.log(`📥 Memproses Instagram URL: ${url}...`);
  const res = await InstagramScraper.download(url);

  if (!res.success || res.data.length === 0) {
    console.log(`❌ Error: ${res.error || 'Media tidak ditemukan.'}`);
    return;
  }

  console.log('\n================ INSTAGRAM DOWNLOAD RESULT ================');
  console.log(`Total Media Ditemukan: ${res.data.length}\n`);
  res.data.forEach((item, i) => {
    console.log(`[${i + 1}] Tipe: ${item.type.toUpperCase()}`);
    console.log(`    URL: ${item.url}`);
  });
  console.log('===========================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = InstagramScraper;
