/**
 * CLI Tool: moewalls.js
 * Converted from plugins/moewalls.js
 */

const readline = require('readline');

const moewalls = require('../lib/moewalls');

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `Masukkan teks dan angka dengan pemisah sebagai index\n\nContoh:\n${usedPrefix}${command} elaina|1\n\n *index bisa membanyak hasil yang di temuka.*`;
  }
   let url = text.split('|')[0]
   let page = text.split('|')[1] || "1"; // Mengatur default "1" jika bagian kedua kosong

// Konversi page ke indeks array (0-based)
let index = parseInt(page) - 1;

   
  try {
    conn.reply(m.chat, `_Sedang memproses, harap tunggu..._`, m);

    // Mengambil respons dari scraper 
    const response = await moewalls(url);
    var res = response;
     //deskripsi = description.replace(/[^\S\r\n]+/g, '');
        let capt = `╭──── 〔MOEWALLS〕 ─⬣\n`;
        capt += ` ⬡ *Pencarian* : ${res.query}\n`;
        capt += ` ⬡  *Index* : ${res.total}\n`;
        capt += `╰────────⬣\n`;  
        capt += ` ⬡  *Judul* : ${res.wallpapers[index].title}\n`;
        capt += ` ⬡  *Source* : ${res.wallpapers[index].source}\n`;
        capt += ` ⬡  *Menampilkan* : ${res.wallpapers[index].index} - ${res.total}\n`;
        await conn.sendMessage(m.chat, { 
        video: { url: res.wallpapers[index].video }, 
        caption: capt
    }, { quoted: m });
  } catch (e) {
    throw `Error: ${e.message || e}`;
  }
};

handler.help = ['moewalls'];
handler.command = /^(moewalls)$/i;
handler.tags = ['downloader','tools'];
handler.premium = false;

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
        console.log(`🚀 Running ${'moewalls.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/moewalls.js" <input_argument>');
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
                        command: 'moewalls'
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
                    command: 'moewalls'
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
