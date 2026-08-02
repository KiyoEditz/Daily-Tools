/**
 * CLI Tool: githubstalk.js
 * Source: plugins/githubstalk.js
 */

const axios = require('axios');
const readline = require('readline');

class GithubStalkScraper {
  static async stalk(username) {
    try {
      const response = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const data = response.data;
      if (!data || data.message === 'Not Found') {
        return { success: false, error: 'Pengguna GitHub tidak ditemukan.' };
      }

      return {
        success: true,
        data: {
          username: data.login,
          name: data.name || 'Not available',
          bio: data.bio || 'No bio available',
          company: data.company || 'N/A',
          location: data.location || 'N/A',
          blog: data.blog || 'N/A',
          publicRepos: data.public_repos,
          publicGists: data.public_gists,
          followers: data.followers,
          following: data.following,
          avatarUrl: data.avatar_url,
          profileUrl: data.html_url,
          createdAt: data.created_at
        }
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const username = args[0];

  if (!username) {
    console.log(`\n========================================`);
    console.log(`          GITHUB STALKER CLI            `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/githubstalk.js" <username_github>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan username GitHub: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleStalk(input.trim());
    });
    return;
  }

  await handleStalk(username);
}

async function handleStalk(username) {
  console.log(`🔍 Mengambil profil GitHub "${username}"...`);
  const res = await GithubStalkScraper.stalk(username);

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  const u = res.data;
  console.log('\n================ GITHUB USER PROFILE ================');
  console.log(`Username    : ${u.username}`);
  console.log(`Nama        : ${u.name}`);
  console.log(`Bio         : ${u.bio}`);
  console.log(`Lokasi      : ${u.location}`);
  console.log(`Perusahaan  : ${u.company}`);
  console.log(`Website     : ${u.blog}`);
  console.log(`Public Repos: ${u.publicRepos} | Public Gists: ${u.publicGists}`);
  console.log(`Followers   : ${u.followers} | Following: ${u.following}`);
  console.log(`Avatar URL  : ${u.avatarUrl}`);
  console.log(`Profile URL : ${u.profileUrl}`);
  console.log(`Dibuat Pada : ${u.createdAt}`);
  console.log('====================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = GithubStalkScraper;
