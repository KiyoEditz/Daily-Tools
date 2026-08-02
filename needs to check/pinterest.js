/**
 * CLI Tool: pinterest.js
 * Source: plugins/pinterest.js
 */

const axios = require('axios');
const readline = require('readline');

class PinterestScraper {
  static async search(query, count = 4) {
    try {
      const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const results = response.data?.resource_response?.data?.results;
      if (results && results.length > 0) {
        const images = results.map(v => ({
          id: v.id,
          title: v.title || v.grid_title || '',
          description: v.description || '',
          url: v.images?.orig?.url,
          width: v.images?.orig?.width,
          height: v.images?.orig?.height,
          pinUrl: `https://www.pinterest.com/pin/${v.id}/`
        })).filter(v => v.url);

        return { success: true, data: images.slice(0, count) };
      }

      return { success: false, data: [], error: `Tidak ada gambar ditemukan untuk "${query}".` };
    } catch (err) {
      return { success: false, data: [], error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const input = args.join(' ');
  const [query, countStr] = input.split('|').map(s => s.trim());
  const count = parseInt(countStr) || 4;

  if (!query) {
    console.log(`\n========================================`);
    console.log(`         PINTEREST SEARCH CLI           `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/pinterest.js" <kata_kunci> | [jumlah]\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan kata kunci pencarian Pinterest: ', async (userInput) => {
      rl.close();
      if (!userInput.trim()) return;
      const [q, cStr] = userInput.trim().split('|').map(s => s.trim());
      await handleSearch(q, parseInt(cStr) || 4);
    });
    return;
  }

  await handleSearch(query, count);
}

async function handleSearch(query, count) {
  console.log(`📌 Mencari gambar Pinterest: "${query}" (limit: ${count})...`);
  const res = await PinterestScraper.search(query, count);

  if (!res.success || res.data.length === 0) {
    console.log(`❌ Error: ${res.error || 'Gambar tidak ditemukan.'}`);
    return;
  }

  console.log(`\n✅ Hasil Gambar Pinterest (${res.data.length}):`);
  res.data.forEach((item, i) => {
    console.log(`\n[${i + 1}] ${item.title || 'Untitled'}`);
    console.log(`    Dimensi : ${item.width}x${item.height}`);
    console.log(`    URL     : ${item.url}`);
    console.log(`    Pin Link: ${item.pinUrl}`);
  });
}

if (require.main === module) {
  runCLI();
}

module.exports = PinterestScraper;
