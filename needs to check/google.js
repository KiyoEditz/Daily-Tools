/**
 * CLI Tool: google.js
 * Source: plugins/google.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

class GoogleScraper {
  static getRandomUserAgent() {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0"
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  static async search(query, num = 10) {
    try {
      const response = await axios.get("https://www.google.com/search", {
        headers: {
          "User-Agent": GoogleScraper.getRandomUserAgent(),
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
        },
        params: {
          q: query,
          num: num + 2,
          hl: 'id',
          safe: 'active'
        },
        timeout: 8000
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $("div.g").each((_, element) => {
        const title = $(element).find("h3").text().trim();
        const url = $(element).find("a").attr("href");
        const description = $(element).find("div.VwiC3b, div.IsZvec").text().trim();

        if (title && url && url.startsWith("http")) {
          results.push({ title, url, description });
        }
      });

      return { success: true, data: results.slice(0, num) };
    } catch (error) {
      return { success: false, data: [], error: error.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const query = args.join(' ');

  if (!query) {
    console.log(`\n========================================`);
    console.log(`          GOOGLE SEARCH CLI             `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/google.js" <kata_kunci>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan kata kunci pencarian Google: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleSearch(input.trim());
    });
    return;
  }

  await handleSearch(query);
}

async function handleSearch(query) {
  console.log(`🔍 Mencari di Google: "${query}"...`);
  const res = await GoogleScraper.search(query);

  if (!res.success || res.data.length === 0) {
    console.log(`❌ Error: ${res.error || 'Hasil tidak ditemukan.'}`);
    return;
  }

  console.log(`\n✅ Hasil Pencarian (${res.data.length}):`);
  res.data.forEach((item, i) => {
    console.log(`\n[${i + 1}] ${item.title}`);
    console.log(`    Link      : ${item.url}`);
    console.log(`    Deskripsi : ${item.description || '-'}`);
  });
}

if (require.main === module) {
  runCLI();
}

module.exports = GoogleScraper;
