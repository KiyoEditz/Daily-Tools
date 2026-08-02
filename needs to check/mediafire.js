/**
 * CLI Tool: mediafire.js
 * Source: plugins/mediafire.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const mime = require('mime-types');
const readline = require('readline');

class MediafireScraper {
  static async download(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);

      const downloadLink = $('#downloadButton').attr('href') || $('.input').attr('href');
      const filename = $('.dl-btn-label').attr('title') || $('div.filename').text().trim() || 'mediafire_file';
      const sizeText = $('.download_link .input').text().trim() || $('.dl-btn-label').text().trim();
      const sizeMatch = sizeText.match(/\((.*?)\)/);
      const size = sizeMatch ? sizeMatch[1] : 'Unknown';

      const ext = filename.includes('.') ? filename.split('.').pop() : '';
      const mimetype = mime.lookup(ext) || 'application/octet-stream';

      if (!downloadLink) {
        return { success: false, error: 'Tombol download tidak ditemukan pada halaman Mediafire.' };
      }

      return {
        success: true,
        filename,
        size,
        ext,
        mimetype,
        download: downloadLink
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.log(`\n========================================`);
    console.log(`        MEDIAFIRE DOWNLOADER CLI        `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/mediafire.js" <url_mediafire>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan URL Mediafire: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleDownload(input.trim());
    });
    return;
  }

  await handleDownload(url);
}

async function handleDownload(url) {
  console.log(`📥 Ekstraksi link Mediafire: ${url}...`);
  const res = await MediafireScraper.download(url);

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  console.log('\n================ MEDIAFIRE DOWNLOAD RESULT ================');
  console.log(`Nama File  : ${res.filename}`);
  console.log(`Ukuran     : ${res.size}`);
  console.log(`MIME Type  : ${res.mimetype}`);
  console.log(`Direct Link: ${res.download}`);
  console.log('==========================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = MediafireScraper;
