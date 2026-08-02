/**
 * CLI Tool: jadwal-anime.js
 * Source: plugins/jadwal-anime.js
 */

const axios = require('axios');
const cheerio = require('cheerio');

class JadwalAnimeScraper {
  static async fetchSchedule() {
    const urls = [
      'https://otakudesu.cloud/jadwal-rilis/',
      'https://otakudesu.cloud/',
      'https://otakudesu.cc/jadwal-rilis/'
    ];

    for (const url of urls) {
      try {
        const { data } = await axios.get(url, { timeout: 5000 });
        const $ = cheerio.load(data);
        const schedule = {};

        $('.kglist321').each((i, e) => {
          const day = $(e).find('h2').text().trim().toLowerCase();
          if (day) {
            schedule[day] = [];
            $(e).find('a').each((_, anime) => {
              const title = $(anime).text().trim();
              const link = $(anime).attr('href');
              if (title && link) {
                schedule[day].push({ title, link });
              }
            });
          }
        });

        if (Object.keys(schedule).length > 0) {
          return { success: true, data: schedule };
        }
      } catch (err) {
        // try next URL
      }
    }

    return { success: false, data: {}, error: 'Gagal mengambil jadwal anime dari Otakudesu.' };
  }
}

async function runCLI() {
  console.log('📅 Mengambil jadwal rilis anime...');
  const res = await JadwalAnimeScraper.fetchSchedule();

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  console.log('\n================ JADWAL RILIS ANIME ================');
  for (const day in res.data) {
    console.log(`\n📌 ${day.toUpperCase()}:`);
    res.data[day].forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`);
      console.log(`      Link: ${item.link}`);
    });
  }
  console.log('\n====================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = JadwalAnimeScraper;
