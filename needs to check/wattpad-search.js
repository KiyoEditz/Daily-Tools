/**
 * CLI Tool: wattpad-search.js
 * Source: plugins/wattpad-search.js
 */

const { searchWattpad } = require('../lib/wattpad');
const readline = require('readline');

class WattpadSearch {
  static async search(query) {
    try {
      const results = await searchWattpad(query);
      return { success: true, data: results || [] };
    } catch (err) {
      return { success: false, data: [], error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const query = args.join(' ');

  if (!query) {
    console.log(`\n========================================`);
    console.log(`         WATTPAD SEARCH CLI             `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/wattpad-search.js" <judul>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan kata kunci pencarian Wattpad: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleSearch(input.trim());
    });
    return;
  }

  await handleSearch(query);
}

async function handleSearch(query) {
  console.log(`🔍 Mencari cerita Wattpad "${query}"...`);
  const res = await WattpadSearch.search(query);

  if (!res.success || res.data.length === 0) {
    console.log(`❌ Error: ${res.error || 'Cerita tidak ditemukan.'}`);
    return;
  }

  console.log(`\n✅ Hasil Pencarian (${res.data.length}):`);
  res.data.forEach((story, i) => {
    console.log(`\n[${i + 1}] ${story.title}`);
    console.log(`    Reads    : ${story.readCount} | Votes: ${story.voteCount} | Chapters: ${story.chapterCount}`);
    console.log(`    Cover    : ${story.image}`);
    console.log(`    Link     : ${story.link}`);
    console.log(`    Ringkasan: ${story.description ? story.description.slice(0, 120) + '...' : '-'}`);
  });
}

if (require.main === module) {
  runCLI();
}

module.exports = WattpadSearch;
