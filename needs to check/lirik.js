/**
 * CLI Tool: lirik.js
 * Source: plugins/lirik.js
 */

const { lyrics } = require('../lib/lyrics');
const axios = require('axios');
const readline = require('readline');

class LyricsScraper {
  static async search(query) {
    try {
      const results = await lyrics.search(query);
      if (results && results.length > 0) {
        return { success: true, data: results };
      }

      // Fallback API: Genius or Genius search
      const response = await axios.get(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': 'Bearer ' + (process.env.GENIUS_TOKEN || '') }
      }).catch(() => null);

      return { success: false, data: [], error: 'Lirik lagu tidak ditemukan.' };
    } catch (err) {
      return { success: false, data: [], error: err.message };
    }
  }

  static async getLyrics(url) {
    try {
      const result = await lyrics.getLyrics(url);
      if (result) {
        return { success: true, data: result };
      }
      return { success: false, error: 'Gagal mengambil detail lirik.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const query = args.join(' ');

  if (!query) {
    console.log(`\n========================================`);
    console.log(`          LYRICS SEARCH CLI             `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/lirik.js" <penyanyi_dan_judul>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan Judul Lagu & Penyanyi: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleSearch(input.trim());
    });
    return;
  }

  await handleSearch(query);
}

async function handleSearch(query) {
  console.log(`🎵 Mencari lirik lagu "${query}"...`);
  const res = await LyricsScraper.search(query);

  if (!res.success || res.data.length === 0) {
    console.log(`❌ Error: ${res.error || 'Lirik tidak ditemukan.'}`);
    return;
  }

  console.log(`\n✅ Hasil Pencarian (${res.data.length}):`);
  const topResult = res.data[0];
  console.log(`Judul   : ${topResult.title}`);
  console.log(`Artis   : ${topResult.artist}`);
  console.log(`Album   : ${topResult.album}`);
  console.log(`Gambar  : ${topResult.imageUrl}`);
  console.log(`Link    : ${topResult.link}`);

  if (topResult.link) {
    console.log('\n📖 Mengambil lirik lengkap...');
    const lyricRes = await LyricsScraper.getLyrics(topResult.link);
    if (lyricRes.success && lyricRes.data.lyrics) {
      console.log('\n================ LIRIK LAGU ================');
      console.log(lyricRes.data.lyrics);
      console.log('============================================');
    }
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = LyricsScraper;
