/**
 * CLI Tool: sfile.js
 * Converted from plugins/sfile.js
 */

const readline = require('readline');

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`Format salah!\nGunakan:\n• ${usedPrefix + command} search <query>|<halaman>\n• ${usedPrefix + command} down <url>\n\nContoh:\n• ${usedPrefix + command} search naruto|2\n• ${usedPrefix + command} down https://sfile.mobi/xxxxx`);
  }

  let [mode, ...rest] = text.trim().split(' ');
  let param = rest.join(' ').trim();

  if (mode.toLowerCase() === 'search') {
    try {
      let [query, page] = param.split('|');
      query = query?.trim();
      page = parseInt(page) || 1;

      let res = await fetch(`https://sfile.mobi/search.php?q=${encodeURIComponent(query)}&page=${page}`);
      let $ = cheerio.load(await res.text());

      let result = [];
      $('div.list').each(function () {
        let title = $(this).find('a').text();
        let size = $(this).text().trim().split('(')[1];
        let link = $(this).find('a').attr('href');
        if (link) result.push({ title, size: size?.replace(')', ''), link });
      });

      if (!result.length) return m.reply(`🔍 Tidak ditemukan hasil untuk "${query}"`);

      let caption = result.map((v, i) => {
        return `📌 *Result ${i + 1}*\n🔖 *Title:* ${v.title}\n📦 *Size:* ${v.size}\n🔗 *Link:* ${v.link}`;
      }).join('\n\n━━━━━━━━━━━━━━━\n\n');

      m.reply(`🔎 *Hasil Pencarian untuk "${query}"*\n\n${caption}\n\n📝 Halaman: ${page}`);
    } catch (e) {
      console.error(e);
      m.reply('Terjadi kesalahan saat mencari file.');
    }

  } else if (mode.toLowerCase() === 'down') {
    if (!/^https:\/\/sfile\.mobi\//i.test(param)) return m.reply('Link tidak valid.');

    try {
      let res = await fetch(param);
      let $ = cheerio.load(await res.text());

      let filename = $('img.intro').attr('alt');
      let mimetype = $('div.list').text().split(' - ')[1].split('\n')[0];
      let downloadPage = $('#download').attr('href');
      let up_at = $('.list').eq(2).text().split(':')[1]?.trim();
      let uploader = $('.list').eq(1).find('a').eq(0).text().trim();
      let total_down = $('.list').eq(3).text().split(':')[1]?.trim();

      let data = await fetch(downloadPage);
      let $$ = cheerio.load(await data.text());
      let scriptText = $$('script').text();
      let downloadUrl = scriptText.split('sf = "')[1]?.split('"')[0]?.replace(/\\/g, '');

      if (!downloadUrl) return m.reply('Gagal mengambil tautan unduhan.');

      const buff = Buffer.from(await (await fetch(downloadUrl)).arrayBuffer());

      await conn.sendMessage(m.chat, {
        document: buff,
        fileName: filename,
        mimetype: mimetype,
        caption: `📁 *File Information*\n\n🔹 *Filename:* ${filename}\n🔹 *Mimetype:* ${mimetype}\n🔹 *Uploader:* ${uploader || 'N/A'}\n🔹 *Upload Date:* ${up_at || 'N/A'}\n🔹 *Downloads:* ${total_down || 'N/A'}\n🔹 *Download URL:* ${downloadUrl}`
      }, { quoted: m });
    } catch (e) {
      console.error(e);
      m.reply('Terjadi kesalahan saat mengunduh file.');
    }

  } else {
    m.reply(`Sub-command tidak dikenali.\nGunakan:\n• ${usedPrefix + command} search <query>|<halaman>\n• ${usedPrefix + command} down <url>`);
  }
};

handler.help = ['sfile search <query>|<halaman>', 'sfile down <url>'];
handler.tags = ['downloader'];
handler.command = /^sfile$/i;

module.exports = handler;

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
        console.log(`🚀 Running ${'sfile.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/sfile.js" <input_argument>');
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
                        command: 'sfile'
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
                    command: 'sfile'
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
