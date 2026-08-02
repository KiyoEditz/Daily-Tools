/**
 * CLI Tool: toimg2.js
 * Converted from plugins/toimg2.js
 */

const readline = require('readline');

/*
let uploadImage = require('../lib/uploadImage.js')
let fetch = require('node-fetch')

let handler = async (m, { conn, usedPrefix, command }) => {

let q = m.quoted ? m.quoted : m
    if (!m.quoted) throw `Reply stiker dengan caption *${usedPrefix + command}*`
    let mime = m.quoted.mimetype || ''
    if (!/webp/.test(mime)) throw `balas stiker gif dengan caption *${usedPrefix + command}*`
    let data = await q.download?.()
let image = await uploadImage(data)
    let out = await fetch(API('alya', '/api/webp-convert', {
        url: image,
        action: 'webp-to-png'
    }, 'apikey'))
    res = await out.json()
    conn.sendFile(m.chat, res.data.url, '', 'DONE', m)
}
handler.help = ['toimg (reply stiker)']
handler.tags = ['stickertomedia']
handler.command = /^toima?ge?$/i
module.exports = handler
*/
const { readFileSync: read, unlinkSync: remove } = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { tmpdir } = require('os')

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        let q = m.quoted ? m.quoted : m
        if (!m.quoted) throw `Balas stiker dengan caption *${usedPrefix + command}*`
        let mime = m.quoted.mimetype || ''
        if (!/webp/.test(mime)) throw `Balas stiker gif dengan caption *${usedPrefix + command}*`
        
        // Mendapatkan path sementara untuk file hasil konversi
        let file = path.join(tmpdir(), `${Date.now()}.png`)
        let media = await conn.downloadAndSaveMediaMessage(q, path.join(tmpdir(), `${Date.now()}.webp`))
        
        // Eksekusi konversi dari webp ke png menggunakan ffmpeg
        exec(`ffmpeg -i ${media} ${file}`, (err, stderr, stdout) => {
            // Hapus file sumber setelah konversi selesai
            remove(media)
            
            if (err) {
                conn.reply(m.chat, `🚩 Konversi gagal.`, m)
                return
            }
            
            // Baca file hasil konversi dan kirim sebagai gambar
            const buffer = read(file)
            conn.sendFile(m.chat, buffer, '', '', m)
            remove(file)
        })
    } catch (e) {
        console.log(e)
        throw `Terjadi Kesalahan!\nCode: ${e}`
    }
}

handler.help = ['toimg (balas stiker)']
handler.tags = ['stickertomedia']
handler.command = /^toima?ge?$/i

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
        console.log(`🚀 Running ${'toimg2.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/toimg2.js" <input_argument>');
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
                        command: 'toimg2'
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
                    command: 'toimg2'
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
