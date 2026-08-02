/**
 * CLI Tool: topdf.js
 * Converted from plugins/topdf.js
 */

const readline = require('readline');

const uploadImage = require('../lib/uploadImage')
let { webp2png } = require('../lib/webp2mp4')
const { sticker } = require('../lib/sticker')

let fetch = require('node-fetch')
let handler = async (m, { conn }) => {

    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    if (!(mime || /image\/(jpe?g|png)|webp/.test(mime))) throw `Reply Gambar`
    let img = await q.download()
    m.reply('_Sedang proses mengirim..._')
    let url
    if (/webp/.test(mime)) {
        url = await webp2png(img)
    } else {
        url = await uploadImage(img)
    }
    let res = await fetch(global.API('lolhuman', '/api/convert/imgtopdf', {
        img: url
    }, 'apikey'))
    // if (!res.ok) throw 'Server Error.. Harap lapor owner'
    // let json = await res.json()
    await conn.sendFile(m.chat, res, new Date * 1 + '.pdf', '', m)

}
handler.help = ['imagetopdf', 'topdf'].map(v => v + ' (caption|reply gambar)')
handler.tags = ['maker']
handler.command = /^(ima?ge?)?topdf$/i
handler.limit = true
handler.disabled = 1
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
        console.log(`🚀 Running ${'topdf.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/topdf.js" <input_argument>');
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
                        command: 'topdf'
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
                    command: 'topdf'
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
