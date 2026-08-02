/**
 * CLI Tool: anilist.js
 * Source: plugins/anilist.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const readline = require('readline');

class AniListScraper {
  static async search(query) {
    try {
      const graphqlQuery = `
        query ($search: String) {
          Page(page: 1, perPage: 10) {
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
              }
              siteUrl
              genres
              episodes
              status
              score: averageScore
            }
          }
        }
      `;

      const response = await axios.post('https://graphql.anilist.co', {
        query: graphqlQuery,
        variables: { search: query }
      }, { headers: { 'Content-Type': 'application/json' } });

      if (response.data && response.data.data && response.data.data.Page.media) {
        return response.data.data.Page.media.map(item => ({
          id: item.id,
          title: item.title.romaji || item.title.english || item.title.native,
          englishTitle: item.title.english,
          coverImage: item.coverImage.extraLarge || item.coverImage.large,
          link: item.siteUrl,
          genres: item.genres,
          episodes: item.episodes,
          status: item.status,
          score: item.score
        }));
      }

      // Fallback to scraping
      const { data } = await axios.get(`https://anilist.co/search/anime?query=${encodeURIComponent(query)}`);
      const $ = cheerio.load(data);
      return $('.media-card').map((_, el) => ({
        title: $(el).find('.title').text().trim(),
        coverImage: $(el).find('.image').attr('src'),
        link: `https://anilist.co${$(el).find('.cover').attr('href')}`,
      })).get();
    } catch (err) {
      console.error('Error searching AniList:', err.message);
      return [];
    }
  }

  static async detail(urlOrId) {
    try {
      const id = parseInt(urlOrId.match(/\d+/)?.[0]);
      if (id) {
        const graphqlQuery = `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              description(asHtml: false)
              coverImage {
                extraLarge
              }
              bannerImage
              genres
              status
              episodes
              duration
              averageScore
              siteUrl
            }
          }
        `;
        const response = await axios.post('https://graphql.anilist.co', {
          query: graphqlQuery,
          variables: { id }
        });
        const media = response.data.data.Media;
        return {
          title: media.title.romaji || media.title.english,
          englishTitle: media.title.english,
          description: media.description ? media.description.replace(/<[^>]*>?/gm, '') : '',
          cover: media.coverImage.extraLarge,
          banner: media.bannerImage,
          genres: media.genres,
          status: media.status,
          episodes: media.episodes,
          duration: media.duration,
          score: media.averageScore,
          url: media.siteUrl
        };
      }

      const { data } = await axios.get(urlOrId);
      const $ = cheerio.load(data);
      const descriptionText = $('.description.content-wrap').text().replace(/\n\s+/g, ' ').trim();
      return {
        title: $('.content h1').first().text().trim(),
        description: descriptionText,
        cover: $('.cover-wrap-inner .cover').attr('src'),
        banner: $('.banner').attr('style')?.match(/url\(['"]?(.*?)['"]?\)/)?.[1],
        genres: $('div.data-set:contains("Genres") .value a').map((_, el) => $(el).text().trim()).get(),
        url: urlOrId
      };
    } catch (err) {
      console.error('Error fetching AniList detail:', err.message);
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
    console.log(`          ANILIST CLI TOOL              `);
    console.log(`========================================`);
    console.log(`Penggunaan:`);
    console.log(`  node "needs to check/anilist.js" search <query>`);
    console.log(`  node "needs to check/anilist.js" detail <id_or_url>`);
    console.log(`========================================\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan perintah (search <query> / detail <id_or_url>): ', async (input) => {
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
      if (!param) return console.log('❌ Masukkan nama anime yang ingin dicari!');
      console.log(`🔍 Mencari AniList: "${param}"...`);
      const results = await AniListScraper.search(param);
      if (results.length === 0) return console.log('❌ Tidak ada hasil ditemukan.');
      console.log(`\n✅ Hasil Pencarian (${results.length}):`);
      results.forEach((res, i) => {
        console.log(`\n[${i + 1}] ${res.title} (ID: ${res.id})`);
        if (res.score) console.log(`    Score    : ${res.score}/100 | Episodes: ${res.episodes || 'N/A'} | Status: ${res.status}`);
        if (res.genres) console.log(`    Genres   : ${res.genres.join(', ')}`);
        console.log(`    Cover    : ${res.coverImage}`);
        console.log(`    Link     : ${res.link}`);
      });
      break;
    }
    case 'detail': {
      if (!param) return console.log('❌ Masukkan ID atau URL AniList!');
      console.log(`📖 Mengambil detail AniList...`);
      const d = await AniListScraper.detail(param);
      if (!d) return console.log('❌ Gagal mengambil detail.');
      console.log('\n================ DETAIL ANILIST ================');
      console.log(`Judul       : ${d.title}`);
      console.log(`Judul EN    : ${d.englishTitle || '-'}`);
      console.log(`Score       : ${d.score ? d.score + '/100' : '-'}`);
      console.log(`Status      : ${d.status || '-'}`);
      console.log(`Episodes    : ${d.episodes || '-'}`);
      console.log(`Genres      : ${d.genres ? d.genres.join(', ') : '-'}`);
      console.log(`Cover       : ${d.cover}`);
      console.log(`Banner      : ${d.banner || '-'}`);
      console.log(`URL         : ${d.url}`);
      console.log(`Deskripsi   :\n${d.description}`);
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

module.exports = AniListScraper;
