/**
 * CLI Tool: tiktok2.js
 * Source: plugins/tiktok2.js
 */

const axios = require('axios');
const readline = require('readline');

class TikTokScraper {
  static async download(url) {
    try {
      // Primary API: TikWM
      const response = await axios.post('https://www.tikwm.com/api/', new URLSearchParams({
        url: url,
        count: 12,
        cursor: 0,
        web: 1
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      if (response.data && response.data.code === 0) {
        const data = response.data.data;
        return {
          success: true,
          title: data.title,
          author: {
            nickname: data.author.nickname,
            username: data.author.unique_id,
            avatar: data.author.avatar
          },
          video: `https://www.tikwm.com${data.play}`,
          wmVideo: `https://www.tikwm.com${data.wmplay}`,
          music: `https://www.tikwm.com${data.music}`,
          cover: `https://www.tikwm.com${data.cover}`,
          images: data.images ? data.images.map(img => img.startsWith('http') ? img : `https://www.tikwm.com${img}`) : [],
          stats: {
            views: data.play_count,
            likes: data.digg_count,
            comments: data.comment_count,
            shares: data.share_count
          }
        };
      }

      // Fallback API
      const fallbackRes = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
      if (fallbackRes.data) {
        const fbData = fallbackRes.data;
        return {
          success: true,
          title: fbData.title || '',
          author: {
            nickname: fbData.author?.name || '',
            username: fbData.author?.unique_id || '',
            avatar: fbData.author?.avatar || ''
          },
          video: fbData.video?.noWatermark || fbData.video?.watermark,
          music: fbData.music?.play_url,
          images: fbData.images ? fbData.images.map(i => i.url) : [],
          stats: fbData.stats || {}
        };
      }

      return { success: false, error: 'Gagal mengekstrak video TikTok.' };
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
    console.log(`         TIKTOK DOWNLOADER CLI          `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/tiktok2.js" <url_tiktok>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan URL TikTok: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleDownload(input.trim());
    });
    return;
  }

  await handleDownload(url);
}

async function handleDownload(url) {
  console.log(`📥 Memproses TikTok URL: ${url}...`);
  const res = await TikTokScraper.download(url);

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  console.log('\n================ TIKTOK DOWNLOAD RESULT ================');
  console.log(`Judul      : ${res.title}`);
  console.log(`Kreator    : ${res.author.nickname} (@${res.author.username})`);
  console.log(`Stats      : ❤️ ${res.stats.likes || 0} | 💬 ${res.stats.comments || 0} | 👁️ ${res.stats.views || 0}`);
  console.log(`Video HD   : ${res.video}`);
  console.log(`Musik/MP3  : ${res.music}`);
  if (res.images && res.images.length > 0) {
    console.log(`Slide Img  : ${res.images.length} gambar ditemukan:`);
    res.images.forEach((img, i) => console.log(`  [${i + 1}] ${img}`));
  }
  console.log('========================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = TikTokScraper;
