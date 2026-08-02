/**
 * CLI Tool: nekopoi-search.js
 * Source: plugins/nekopoi-search.js
 */

const NekoPoi = require('../lib/nekopoi');
const readline = require('readline');

class NekoPoiSearch {
  static async search(query) {
    try {
      const nekopoi = new NekoPoi();
      const results = await nekopoi.search(query);
      return results || [];
    } catch (err) {
      console.error('Error searching NekoPoi:', err.message);
      return [];
    }
  }

  static async latest() {
    try {
      const nekopoi = new NekoPoi();
      return await nekopoi.latest();
    } catch (err) {
      console.error('Error fetching latest NekoPoi:', err.message);
      return { series: [], episode: [] };
    }
  }

  static async detail(url) {
    try {
      const nekopoi = new NekoPoi();
      return await nekopoi.detail(url);
    } catch (err) {
      console.error('Error fetching NekoPoi detail:', err.message);
      return null;
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : null;
  const param = args.slice(1).join(' ');

  if (!command) {
    console.log(`\n========================================`);
    console.log(`         NEKOPOI SEARCH CLI             `);
    console.log(`========================================`);
    console.log(`Penggunaan:`);
    console.log(`  node "needs to check/nekopoi-search.js" search <query>`);
    console.log(`  node "needs to check/nekopoi-search.js" latest`);
    console.log(`  node "needs to check/nekopoi-search.js" detail <url>`);
    console.log(`========================================\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan perintah (search <query> / latest / detail <url>): ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      const parts = input.trim().split(' ');
      await handleAction(parts[0], parts.slice(1).join(' '));
    });
    return;
  }

  await handleAction(command, param);
}

async function handleAction(command, param) {
  switch (command) {
    case 'search': {
      if (!param) return console.log('❌ Masukkan judul anime/hentai yang ingin dicari!');
      console.log(`🔍 Mencari NekoPoi: "${param}"...`);
      const results = await NekoPoiSearch.search(param);
      if (!results || results.length === 0) return console.log('❌ Tidak ada hasil ditemukan.');
      console.log(`\n✅ Hasil Pencarian (${results.length}):`);
      results.forEach((item, index) => {
        console.log(`\n[${index + 1}] ${item.title || item.name || 'Untitled'}`);
        if (item.type) console.log(`    Type  : ${item.type}`);
        if (item.images) console.log(`    Cover : ${item.images}`);
        console.log(`    Link  : ${item.url}`);
      });
      break;
    }
    case 'latest': {
      console.log('📖 Mengambil Rilis Terbaru NekoPoi...');
      const data = await NekoPoiSearch.latest();
      console.log(`\n✅ Episode Terbaru (${data.episode ? data.episode.length : 0}):`);
      (data.episode || []).forEach((ep, i) => {
        console.log(`[${i + 1}] ${ep.title} (${ep.release}) -> ${ep.url}`);
      });
      break;
    }
    case 'detail': {
      if (!param) return console.log('❌ Masukkan URL NekoPoi!');
      console.log(`📖 Mengambil Detail...`);
      const detail = await NekoPoiSearch.detail(param);
      if (!detail) return console.log('❌ Gagal mengambil detail.');
      console.log('\n================ DETAIL NEKOPOI ================');
      console.log(JSON.stringify(detail, null, 2));
      console.log('================================================');
      break;
    }
    default:
      console.log(`❌ Perintah "${command}" tidak dikenal.`);
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = NekoPoiSearch;
