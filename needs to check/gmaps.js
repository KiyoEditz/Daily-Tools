/**
 * CLI Tool: gmaps.js
 * Converted from plugins/gmaps.js
 */

const readline = require('readline');

const axios = require('axios')
const cheerio = require('cheerio')
const sharp = require('sharp')

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0';

async function jarak(dari, ke) {
    let html = (await axios.get(`https://www.google.com/search?q=${encodeURIComponent('jarak ' + dari + ' ke ' + ke)}&hl=id`, {
        headers: {
            'User-Agent': userAgent
        }
    })).data;
    let $ = cheerio.load(html);
    let obj = {};

    let img = html.split("var s=\'")?.[1]?.split("\'")?.[0];
    obj.img = /^data:.*?\/.*?;base64,/i.test(img) ? Buffer.from(img.split(',')[1], 'base64') : '';

    // ngambil waktu jarak
    obj.captions = [];
    $('div.BbbuR.uc9Qxb.uE1RRc').each((index, element) => {
        let caption = $(element).text()?.trim();
        obj.captions.push(caption);
    });

    return obj;
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    let [dari, ke] = text.split('|');
    if (!dari || !ke) throw `Ex: ${usedPrefix + command} pekalongan|sukabumi`;

    if (dari.toLowerCase() === ke.toLowerCase()) {
        conn.reply(m.chat, "hey bung, kau dari kota bodoh mana ?!\nAWOKAWOAKOAK", m);
        return;
    }

    conn.reply(m.chat, "Tunggu sebentar yah, sedang diminta peta nya...", m);

    let result = await jarak(dari, ke);

    if (result.img) {
        let imgBuffer = Buffer.from(result.img, 'base64');
        let resizedImgBuffer = await sharp(imgBuffer).toBuffer();

        conn.sendMessage(m.chat, { image: resizedImgBuffer, caption: result.captions.join('\n') + `\n\nhttps://www.google.com/maps/dir/${encodeURIComponent(dari)}/${encodeURIComponent(ke)}/` }, { quoted: m });
    } else {
        conn.reply(m.chat, result.captions.join('\n') + `\n\nhttps://www.google.com/maps/dir/${encodeURIComponent(dari)}/${encodeURIComponent(ke)}/`, m);
    }
};

handler.help = ['jarak', 'gmaps'].map(v => v + ' dari|ke');
handler.tags = ['tools'];
handler.command = /^(jarak|gmaps)$/i;

module.exports = handler


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
        console.log(`🚀 Running ${'gmaps.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/gmaps.js" <input_argument>');
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
                        command: 'gmaps'
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
                    command: 'gmaps'
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
