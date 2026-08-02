/**
 * CLI Tool: wattpad-list.js
 * Source: plugins/wattpad-list.js
 */

const { listRead } = require('../lib/wattpad');
const readline = require('readline');

class WattpadList {
  static async getChapters(url) {
    try {
      const data = await listRead(url);
      return { success: true, data };
    } catch (err) {
      return { success: false, data: null, error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.log(`\n========================================`);
    console.log(`         WATTPAD CHAPTER LIST CLI       `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/wattpad-list.js" <url_cerita>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan URL cerita Wattpad: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleList(input.trim());
    });
    return;
  }

  await handleList(url);
}

async function handleList(url) {
  console.log(`📑 Mengambil daftar chapter Wattpad dari ${url}...`);
  const res = await WattpadList.getChapters(url);

  if (!res.success || !res.data) {
    console.log(`❌ Error: ${res.error || 'Gagal mengambil daftar chapter.'}`);
    return;
  }

  console.log('\n================ DAFTAR CHAPTER WATTPAD ================');
  console.log(`Sinopsis:\n${res.data.synopsis}\n`);
  console.log(`Daftar Chapter (${res.data.chapters.length}):`);
  res.data.chapters.forEach((ch, i) => {
    console.log(`[${i + 1}] ${ch.title} (${ch.date || 'N/A'})`);
    console.log(`    Link: ${ch.link}`);
  });
  console.log('=======================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = WattpadList;
