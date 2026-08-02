/**
 * CLI Tool: fb.js
 * Source: plugins/fb.js
 */

const axios = require('axios');
const readline = require('readline');

class FacebookScraper {
  static async download(url) {
    try {
      // Primary API: api-dylux or snapsave
      try {
        const fg = require('api-dylux');
        const res = await fg.fbdl(url);
        if (res && (res.videoUrl || res.sd || res.hd)) {
          return {
            success: true,
            title: res.title || 'Facebook Video',
            sd: res.sd || res.videoUrl,
            hd: res.hd || res.videoUrl,
            size: res.size || 'N/A'
          };
        }
      } catch (e) {
        // fallback to web API
      }

      // Fallback: Cobalt / SaveFrom API
      const response = await axios.post('https://api.cobalt.tools/api/json', {
        url: url
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.url) {
        return {
          success: true,
          title: 'Facebook Video',
          hd: response.data.url,
          sd: response.data.url
        };
      }

      return { success: false, error: 'Gagal mengekstrak video Facebook.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.log(`\n========================================`);
    console.log(`        FACEBOOK DOWNLOADER CLI         `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/fb.js" <url_facebook>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan URL Facebook Video / Reel: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleDownload(input.trim());
    });
    return;
  }

  await handleDownload(url);
}

async function handleDownload(url) {
  console.log(`📥 Memproses Facebook URL: ${url}...`);
  const res = await FacebookScraper.download(url);

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  console.log('\n================ FACEBOOK DOWNLOAD RESULT ================');
  console.log(`Judul     : ${res.title}`);
  console.log(`Ukuran    : ${res.size || 'N/A'}`);
  console.log(`Link HD   : ${res.hd || '-'}`);
  console.log(`Link SD   : ${res.sd || '-'}`);
  console.log('==========================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = FacebookScraper;
