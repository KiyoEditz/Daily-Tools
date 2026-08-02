/**
 * CLI Tool: kbbi.js
 * Source: plugins/kbbi.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

class KBBIScraper {
  static async search(word) {
    try {
      // Primary: KBBI web scraper
      const url = `https://kbbi.web.id/${encodeURIComponent(word)}`;
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const $ = cheerio.load(data);

      const title = $('#d1 h2').text().trim() || word;
      const means = [];

      $('#d1').contents().each((_, el) => {
        const text = $(el).text().trim();
        if (text && !text.startsWith('Hasil Pencarian') && text.length > 3) {
          means.push(text);
        }
      });

      const rawContent = $('#d1').text().trim();

      if (rawContent && !rawContent.includes('tidak ditemukan')) {
        return {
          success: true,
          word: title,
          definitions: rawContent
        };
      }

      // Fallback: @bochilteam/scraper
      try {
        const { kbbi } = require('@bochilteam/scraper');
        const res = await kbbi(word);
        if (res && res.length > 0) {
          return {
            success: true,
            word,
            results: res
          };
        }
      } catch (e) {
        // ignore
      }

      return { success: false, error: `Kata "${word}" tidak ditemukan dalam KBBI.` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const word = args.join(' ');

  if (!word) {
    console.log(`\n========================================`);
    console.log(`             KBBI CLI TOOL              `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/kbbi.js" <kata>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan kata untuk dicari di KBBI: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleSearch(input.trim());
    });
    return;
  }

  await handleSearch(word);
}

async function handleSearch(word) {
  console.log(`📖 Mencari kata "${word}" di KBBI...`);
  const res = await KBBIScraper.search(word);

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  console.log('\n================ HASIL PENCARIAN KBBI ================');
  console.log(`Kata : ${res.word}`);
  console.log(`\nArti/Definisi:\n${res.definitions || JSON.stringify(res.results, null, 2)}`);
  console.log('======================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = KBBIScraper;
