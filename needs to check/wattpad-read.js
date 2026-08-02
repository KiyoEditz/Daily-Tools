/**
 * CLI Tool: wattpad-read.js
 * Source: plugins/wattpad-read.js
 */

const { readWattpad, getStartReadingLink } = require('../lib/wattpad');
const readline = require('readline');

class WattpadRead {
  static async read(url) {
    try {
      let targetUrl = url;
      if (!url.includes('/page/') && !url.includes('-chapter-')) {
        try {
          targetUrl = await getStartReadingLink(url);
        } catch (e) {
          // ignore, use original URL
        }
      }
      const text = await readWattpad(targetUrl);
      return { success: true, text };
    } catch (err) {
      return { success: false, text: '', error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.log(`\n========================================`);
    console.log(`         WATTPAD READER CLI             `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/wattpad-read.js" <url_cerita_atau_chapter>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan URL Wattpad: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleRead(input.trim());
    });
    return;
  }

  await handleRead(url);
}

async function handleRead(url) {
  console.log(`📖 Mengambil isi cerita Wattpad dari ${url}...`);
  const res = await WattpadRead.read(url);

  if (!res.success || !res.text) {
    console.log(`❌ Error: ${res.error || 'Gagal mengambil isi cerita.'}`);
    return;
  }

  console.log('\n================ ISI CERITA WATTPAD ================');
  console.log(res.text);
  console.log('====================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = WattpadRead;
