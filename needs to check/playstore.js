/**
 * CLI Tool: playstore.js
 * Converted from plugins/playstore.js
 */

const readline = require('readline');

/*
*[Plugins Playstore]* 
By Fruatre
wa.me/6285817597752
Saluran : https://whatsapp.com/channel/0029VaNR2B6BadmioY6mar3N
*/

const axios = require("axios");
const cheerio = require("cheerio");

let handler = async (m, { conn, text }) => {
  if (!text) throw "Mau Cari Apk Apa?";
  m.reply("Tunggu sebentar...");
  let hasil = await PlayStoreScraper.search(text);
  if (hasil.error) throw hasil.error;

  let anu = hasil.map((v) => 
    `*Nama:* ${v.nama}\n*Developer:* ${v.developer}\n*Rate:* ${v.rate}\n*Rate 2:* ${v.rate2}\n*Link:* ${v.link}\nLinkDev: ${v.link_dev}`
  ).join("\n\n°°°°°°°°°°°°°°°°°°°°°°°°°°°°°\n\n");

  m.reply(anu);
};

handler.help = ["playstore"];
handler.tags = ["internet"];
handler.command = /^(playstore)$/i;
handler.limit = true;

module.exports = handler;

class PlayStoreScraper {
  static async search(query) {
    try {
      const { data } = await axios.get(`https://play.google.com/store/search?q=${query}&c=apps`);
      const results = [];
      const $ = cheerio.load(data);

      $(".ULeU3b > .VfPpkd-WsjYwc").each((_, element) => {
        const linkk = $(element).find("a").attr("href");
        const nama = $(element).find(".DdYX5").text();
        const developer = $(element).find(".wMUdtb").text();
        const img = $(element).find("img").attr("src");
        const rate = $(element).find(".ubGTjb > div").attr("aria-label");
        const rate2 = $(element).find(".w2kbF").text();
        const link = `https://play.google.com${linkk}`;

        results.push({
          link: link,
          nama: nama || "No Name",
          developer: developer || "No Developer",
          img: img || "https://i.ibb.co/G7CrCwN/404.png",
          rate: rate || "No Rate",
          rate2: rate2 || "No Rate",
          link_dev: `https://play.google.com/store/apps/developer?id=${developer.split(" ").join("+")}`,
        });
      });

      if (!results.length) {
        return { error: "Tidak ditemukan hasil pencarian." };
      }

      return results;
    } catch (error) {
      console.error(error);
      return { error: "Gagal mengambil data dari Play Store." };
    }
  }
}

// Auto-generated CLI runner wrapper
async function runCLI() {
    const args = process.argv.slice(2);
    const input = args.join(' ');
    
    // Create mock Baileys message & conn context for CLI execution
    const mockConn = {
        sendMessage: async (jid, content, options) => {
            if (typeof content === 'string') {
                console.log('\n[RESPONSE]', content);
            } else if (content.text) {
                console.log('\n[RESPONSE]', content.text);
            } else if (content.caption) {
                console.log('\n[CAPTION]', content.caption);
                if (content.image) console.log('[IMAGE URL]', content.image.url || content.image);
                if (content.video) console.log('[VIDEO URL]', content.video.url || content.video);
                if (content.document) console.log('[DOC URL]', content.document.url || content.document);
            } else {
                console.log('\n[RESPONSE MEDIA/DATA]', content);
            }
            return { key: { id: 'cli_msg_id' } };
        },
        reply: async (jid, text, quoted) => {
            console.log('\n[REPLY]', text);
        },
        sendFile: async (jid, url, filename, caption, quoted) => {
            console.log(`\n[SEND FILE] ${filename}: ${url}`);
            if (caption) console.log('[CAPTION]', caption);
        }
    };

    const mockM = {
        chat: 'cli@terminal',
        key: { id: 'cli_key' },
        sender: 'cli@user',
        reply: (text) => console.log('\n[REPLY]', text),
        quoted: null
    };

    let handlerFunc = typeof module.exports === 'function' ? module.exports : (typeof handler !== 'undefined' ? handler : null);

    if (handlerFunc) {
        console.log(`🚀 Running ${'playstore.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/playstore.js" <input_argument>');
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question('Masukkan input / query: ', async (userInput) => {
                rl.close();
                if (!userInput) return console.log('❌ Input cancelled.');
                try {
                    await handlerFunc(mockM, {
                        conn: mockConn,
                        args: userInput.split(' '),
                        text: userInput,
                        usedPrefix: '.',
                        command: 'playstore'
                    });
                } catch (err) {
                    console.error('❌ Error executing plugin:', err);
                }
            });
        } else {
            try {
                await handlerFunc(mockM, {
                    conn: mockConn,
                    args: input.split(' '),
                    text: input,
                    usedPrefix: '.',
                    command: 'playstore'
                });
            } catch (err) {
                console.error('❌ Error executing plugin:', err);
            }
        }
    } else {
        console.log('ℹ️ Plugin file loaded successfully.');
    }
}

if (require.main === module) {
    runCLI();
}
