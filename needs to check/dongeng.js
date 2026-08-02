/**
 * CLI Tool: dongeng.js
 * Source: plugins/dongeng.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

class DongengScraper {
  static cleanText(html) {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').trim();
  }

  static async search(query) {
    try {
      const url = `https://dongengceritarakyat.com/?s=${encodeURIComponent(query)}`;
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const results = [];

      $('article').each((index, element) => {
        const article = $(element);
        const title = article.find('.entry-title a').text().trim();
        const link = article.find('.entry-title a').attr('href');
        const image = article.find('.featured-image amp-img, img').attr('src');
        const summary = article.find('.entry-summary').text().trim();
        const category = article.find('.cat-links a').text().trim();
        const tags = article.find('.tags-links a').text().trim();

        if (title && link) {
          results.push({ title, link, image, summary, category, tags });
        }
      });

      return { success: true, data: results };
    } catch (error) {
      return { success: false, data: [], error: error.message };
    }
  }

  static async read(url) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      return {
        success: true,
        data: {
          title: $('h1.entry-title').text().trim(),
          image: $('div.featured-image amp-img, div.featured-image img').attr('src'),
          date: $('span.posted-date, time').text().trim(),
          author: $('span.posted-author a, .author a').text().trim(),
          content: DongengScraper.cleanText($('div.entry-content').text()),
          tags: $('span.tags-links a').map((_, el) => $(el).text().trim()).get(),
          category: $('span.cat-links a').map((_, el) => $(el).text().trim()).get()
        }
      };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : null;
  const param = args.slice(1).join(' ');

  if (!command) {
    console.log(`\n========================================`);
    console.log(`         DONGENG CERITA RAKYAT CLI      `);
    console.log(`========================================`);
    console.log(`Penggunaan:`);
    console.log(`  node "needs to check/dongeng.js" search <judul>`);
    console.log(`  node "needs to check/dongeng.js" read <url>`);
    console.log(`========================================\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan perintah (search <judul> / read <url>): ', async (input) => {
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
      if (!param) return console.log('❌ Masukkan judul cerita dongeng yang dicari!');
      console.log(`🔍 Mencari dongeng: "${param}"...`);
      const res = await DongengScraper.search(param);
      if (!res.success || res.data.length === 0) return console.log('❌ Dongeng tidak ditemukan.');
      console.log(`\n✅ Hasil Pencarian (${res.data.length}):`);
      res.data.forEach((item, i) => {
        console.log(`\n[${i + 1}] ${item.title}`);
        console.log(`    Ringkasan : ${item.summary.slice(0, 100)}...`);
        console.log(`    Link      : ${item.link}`);
      });
      break;
    }
    case 'read': {
      if (!param) return console.log('❌ Masukkan URL dongeng!');
      console.log(`📖 Membaca cerita dongeng...`);
      const res = await DongengScraper.read(param);
      if (!res.success || !res.data) return console.log('❌ Gagal membaca dongeng.');
      const d = res.data;
      console.log('\n================ CERITA DONGENG ================');
      console.log(`Judul    : ${d.title}`);
      console.log(`Penulis  : ${d.author || '-'}`);
      console.log(`Tanggal  : ${d.date || '-'}`);
      console.log(`Gambar   : ${d.image || '-'}`);
      console.log(`Kategori : ${d.category.join(', ')}`);
      console.log(`\nIsi Cerita:\n${d.content}`);
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

module.exports = DongengScraper;
