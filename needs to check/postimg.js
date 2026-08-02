/**
 * CLI Tool: postimg.js
 * Converted from plugins/postimg.js
 */

const readline = require('readline');

/*
Jangan Hapus Wm Bang 

*postimg  Plugins CJS*

Yah Intinya Sih Kayak Tourl

*[Sumber]*
https://whatsapp.com/channel/0029Vb3u2awADTOCXVsvia28

*[Sumber Scrape]*

https://whatsapp.com/channel/0029Vb2WECv9xVJaXVi46y2m
*/

const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function postimg(buffer) {
  try {
    let data = new FormData();
    data.append('optsize', '0');
    data.append('expire', '0');
    data.append('numfiles', '1');
    data.append('upload_session', Math.random());
    data.append('file', buffer, `${Date.now()}.jpg`);

    const res = await axios.post('https://postimages.org/json/rr', data);
    const html = await axios.get(res.data.url);
    const $ = cheerio.load(html.data);

    let link = $('#code_html').attr('value');
    let image = $('#code_direct').attr('value');
    let delimg = $('#code_remove').attr('value');

    return { link, image, delimg };
  } catch (err) {
    throw err;
  }
}

let handler = async (m, { conn, usedPrefix }) => {
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    if (!/image/.test(mime)) return m.reply(`Kirim gambar dengan caption *${usedPrefix}postimg* atau balas gambar`);

    let media = await q.download();

    m.reply('Tunggu Bentar...');

    let result = await postimg(media);

    let caption = `*Successful Image Upload*\n\n` +
                  `*Link HTML :* ${result.link}\n` +
                  `*Direct Link :* ${result.image}\n` +
                  `*Delete Image :* ${result.delimg}`;

    await conn.sendMessage(m.chat, { image: { url: result.image }, caption }, { quoted: m });
  } catch (e) {
    m.reply(`*Gagal mengunggah gambar:*\n${e}`);
  }
}

handler.help = ['postimg'];
handler.command = ['postimg'];
handler.tags = ['tools'];
handler.limit = false;

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
        console.log(`🚀 Running ${'postimg.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/postimg.js" <input_argument>');
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
                        command: 'postimg'
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
                    command: 'postimg'
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
