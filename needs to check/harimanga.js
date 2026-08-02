/**
 * CLI Tool: harimanga.js
 * Source: plugins/harimanga.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

class Harimanga {
  static async latest() {
    try {
      const { data } = await axios.get('https://harimanga.me/');
      const $ = cheerio.load(data);
      const results = [];

      $('.page-listing-item').each((i, el) => {
        if (results.length >= 10) return false;

        const title = $(el).find('.post-title h3 a').text().trim();
        const link = $(el).find('.post-title h3 a').attr('href');
        const latestChapter = $(el).find('.list-chapter .chapter-item .chapter a').first().text().trim();
        const chapterLink = $(el).find('.list-chapter .chapter-item .chapter a').first().attr('href');

        if (title && link) {
          results.push({ title, link, latestChapter, chapterLink });
        }
      });

      return results;
    } catch (err) {
      console.error('Error fetching latest Harimanga:', err.message);
      return [];
    }
  }

  static async search(query) {
    try {
      const url = `https://harimanga.me/?s=${encodeURIComponent(query)}&post_type=wp-manga`;
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const results = [];

      $('.c-tabs-item__content').each((_, el) => {
        const title = $(el).find('.post-title a').text().trim();
        const link = $(el).find('.post-title a').attr('href');
        const img = $(el).find('.tab-thumb img').attr('src');
        const genres = $(el).find('.mg_genres .summary-content a').map((_, g) => $(g).text().trim()).get();
        const status = $(el).find('.mg_status .summary-content').text().trim();
        const latestChapter = $(el).find('.latest-chap .chapter a').text().trim();
        const chapterLink = $(el).find('.latest-chap .chapter a').attr('href');
        const rating = $(el).find('.rating .score').text().trim();

        if (title && link) {
          results.push({ title, link, img, genres, status, latestChapter, chapterLink, rating });
        }
      });

      return results;
    } catch (err) {
      console.error('Error searching Harimanga:', err.message);
      return [];
    }
  }

  static async detail(url) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      const title = $('.post-title h1').text().trim();
      const image = $('.summary_image img').attr('src');
      const rating = $('.post-total-rating .score').first().text().trim();
      const rank = $('.post-content_item:contains("Rank") .summary-content').text().trim();
      const status = $('.post-content_item:contains("Status") .summary-content').text().trim();
      const genres = $('.post-content_item:contains("Genre(s)") .genres-content a')
        .map((_, el) => $(el).text().trim())
        .get();

      return { title, image, rating, rank, status, genres };
    } catch (err) {
      console.error('Error fetching Harimanga detail:', err.message);
      return null;
    }
  }

  static async chapters(url) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      const title = $('.post-title h1').text().trim();
      const chaptersList = [];
      $('.wp-manga-chapter').each((_, el) => {
        const chapterTitle = $(el).find('a').first().text().trim();
        const link = $(el).find('a').first().attr('href');
        const releaseDate = $(el).find('.chapter-release-date i').text().trim() || 'Unknown';

        if (chapterTitle && link) {
          chaptersList.push({ title: chapterTitle, link, releaseDate });
        }
      });

      return { title, chapters: chaptersList };
    } catch (err) {
      console.error('Error fetching Harimanga chapters:', err.message);
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
    console.log(`         HARIMANGA CLI TOOL             `);
    console.log(`========================================`);
    console.log(`Penggunaan:`);
    console.log(`  node "needs to check/harimanga.js" latest`);
    console.log(`  node "needs to check/harimanga.js" search <query>`);
    console.log(`  node "needs to check/harimanga.js" detail <url>`);
    console.log(`  node "needs to check/harimanga.js" chapters <url>`);
    console.log(`========================================\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan perintah (latest / search <query> / detail <url> / chapters <url>): ', async (input) => {
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
    case 'latest': {
      console.log('📖 Mengambil manga terbaru dari Harimanga...');
      const res = await Harimanga.latest();
      console.log(`\n✅ Result (${res.length}):`);
      res.forEach((r, i) => {
        console.log(`\n[${i + 1}] ${r.title}`);
        console.log(`    Link           : ${r.link}`);
        console.log(`    Latest Chapter : ${r.latestChapter} (${r.chapterLink})`);
      });
      break;
    }
    case 'search': {
      if (!param) return console.log('❌ Masukkan kata kunci pencarian!');
      console.log(`🔍 Mencari manga "${param}"...`);
      const res = await Harimanga.search(param);
      if (res.length === 0) return console.log('❌ Tidak ada hasil ditemukan.');
      console.log(`\n✅ Result (${res.length}):`);
      res.forEach((r, i) => {
        console.log(`\n[${i + 1}] ${r.title}`);
        console.log(`    Rating : ${r.rating} | Status: ${r.status}`);
        console.log(`    Genres : ${r.genres ? r.genres.join(', ') : '-'}`);
        console.log(`    Latest : ${r.latestChapter}`);
        console.log(`    Link   : ${r.link}`);
      });
      break;
    }
    case 'detail': {
      if (!param) return console.log('❌ Masukkan URL detail manga!');
      console.log(`📖 Mengambil detail manga...`);
      const d = await Harimanga.detail(param);
      if (!d) return console.log('❌ Gagal mengambil detail.');
      console.log('\n================ DETAIL HARIMANGA ================');
      console.log(`Judul  : ${d.title}`);
      console.log(`Cover  : ${d.image}`);
      console.log(`Rating : ${d.rating}`);
      console.log(`Rank   : ${d.rank}`);
      console.log(`Status : ${d.status}`);
      console.log(`Genres : ${d.genres ? d.genres.join(', ') : '-'}`);
      console.log('==================================================');
      break;
    }
    case 'chapters': {
      if (!param) return console.log('❌ Masukkan URL manga!');
      console.log(`📑 Mengambil daftar chapter...`);
      const chData = await Harimanga.chapters(param);
      if (!chData || chData.chapters.length === 0) return console.log('❌ Tidak ada chapter ditemukan.');
      console.log(`\n✅ Chapters for "${chData.title}" (${chData.chapters.length}):`);
      chData.chapters.forEach((c, i) => {
        console.log(`[${i + 1}] ${c.title} (${c.releaseDate})`);
        console.log(`    Link: ${c.link}`);
      });
      break;
    }
    default:
      console.log(`❌ Perintah "${command}" tidak dikenal.`);
  }
}

if (require.main === module) {
  runCLI();
}

module.exports = Harimanga;
