/**
 * CLI Tool: jadwalsholat.js
 * Converted from plugins/jadwalsholat.js
 */

const readline = require('readline');

/*
 • Fitur By Anomaki Team
 • Created : Nazand Code
 • Contributor by : selxyz (scrape) 
 • Jadwal Sholat 
 • Jangan Hapus Wm
 • https://whatsapp.com/channel/0029Vaio4dYC1FuGr5kxfy2l
*/

const axios = require('axios');
const cheerio = require('cheerio');

const handler = async (m, { conn, usedPrefix, command, args }) => {
    const kota = (args[0]?.toLowerCase() || 'jakarta');
    try {
        const { data } = await axios.get(`https://jadwal-sholat.tirto.id/kota-${kota}`);
        const $ = cheerio.load(data);

        const jadwal = $('tr.currDate td').map((i, el) => $(el).text()).get();

        if (jadwal.length === 7) {
            const [tanggal, subuh, duha, dzuhur, ashar, maghrib, isya] = jadwal;

            const zan = `
╭──[ *Jadwal Sholat* ]──✧
᎒⊸ *Kota*: ${kota.charAt(0).toUpperCase() + kota.slice(1)}
᎒⊸ *Tanggal*: ${tanggal}

╭──[ *Waktu Sholat* ]──✧
᎒⊸ Subuh: ${subuh}
᎒⊸ Duha: ${duha}
᎒⊸ Dzuhur: ${dzuhur}
᎒⊸ Ashar: ${ashar}
᎒⊸ Maghrib: ${maghrib}
᎒⊸ Isya: ${isya}
╰────────────•`;

            await conn.reply(m.chat, zan, m);
        } else {
            await conn.reply(m.chat, 'Jadwal sholat tidak ditemukan. Pastikan nama kota sesuai.', m);
        }
    } catch (error) {
        await conn.reply(m.chat, 'error', m);
    }
};

handler.help = ['jadwalsholat <kota>']
handler.tags = ['tools']
handler.command = /^((jadwal)?sh?[oa]lat)$/i

module.exports = handler

/*
let { jadwalsholat } = require('@bochilteam/scraper')
let handler = async (m, { conn, text, usedPrefix }) => {
  let d = new Date
  let locale = 'id'
  let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
  let week = d.toLocaleDateString(locale, { weekday: 'long' })
  let date = d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  if (!text) throw `ketik ${usedPrefix}jadwalsholat daerah/kota\n*Contoh*: ${usedPrefix}jadwalsholat surabaya`

  const res = await jadwalsholat(text)
  if (!res.today) throw 'Server Error.. Harap lapor owner'
  m.reply(`
Jadwal Sholat *${text}*
${week}, ${date}

${Object.entries(res.today).map(([name, data]) => `*${name}:* ${data}`).join('\n').trim()}
`.trim())
}
handler.help = ['jadwalsholat <kota>']
handler.tags = ['tools']
handler.command = /^((jadwal)?sh?[oa]lat)$/i

module.exports = handler
*/

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
        console.log(`🚀 Running ${'jadwalsholat.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/jadwalsholat.js" <input_argument>');
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
                        command: 'jadwalsholat'
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
                    command: 'jadwalsholat'
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
