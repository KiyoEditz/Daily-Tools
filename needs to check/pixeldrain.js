/**
 * CLI Tool: pixeldrain.js
 * Converted from plugins/pixeldrain.js
 */

const readline = require('readline');

const { pixeldrain } = require('../lib/pixeldrain.js');
const fetch = require('node-fetch');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `*🚨 Contoh:* ${usedPrefix}${command} https://pixeldrain.com/u/Un6ru7VS`;

    try {
        // Ekstrak ID file dari URL
        const fileId = pixeldrain.extractLink(text);
        if (!fileId) throw `*🚨 Format link tidak valid!*\nGunakan link seperti: https://pixeldrain.com/u/Un6ru7VS`;

        // Ambil informasi file dari PixelDrain
        const res = await pixeldrain.dl(fileId);
        if (!res || !res.success) throw `*🚨 Gagal mengambil informasi file!*`;

        // Pastikan file bisa diunduh
        if (!res.can_download) throw `*🚨 File ini tidak tersedia untuk diunduh!*`;

        // Filter berdasarkan MIME type
        const allowedMimeTypes = ['video/mp4', 'image/png', 'image/jpeg', 'application/zip', 'application/pdf'];
        if (!allowedMimeTypes.includes(res.mime_type)) throw `*🚨 Format file tidak didukung!*\nJenis file: ${res.mime_type}`;

        let msg = `📥 *P I X E L D R A I N  D O W N L O A D E R*\n\n`;
        msg += `📌 *Nama:* ${res.name}\n`;
        msg += `📌 *Ukuran:* ${(res.size / (1024 * 1024)).toFixed(2)} MB\n`;
        msg += `📌 *Tipe:* ${res.mime_type}\n`;
        msg += `📌 *Upload:* ${res.date_upload}\n`;
        msg += `📌 *Unduhan:* ${res.downloads}\n`;
        msg += `📌 *Terakhir Dilihat:* ${res.date_last_view}\n`;
        msg += `📌 *Link:* ${text}\n`;

        // Kirim thumbnail jika tersedia
        if (res.thumbnail_href) {
            await conn.sendFile(m.chat, `https://pixeldrain.com/api${res.thumbnail_href}`, 'thumb.png', msg, m);
        } else {
            await conn.reply(m.chat, msg, m);
        }

        // Kirim file ke pengguna
        await conn.sendMessage(m.chat, { 
            document: { url: res.file }, 
            fileName: res.name, 
            mimetype: res.mime_type 
        }, { quoted: m });

    } catch (e) { 
        throw `🚨 *Error:* ${e}`;
    }
};

handler.help = ['pixeldrain'].map(v => v + ' <url>');
handler.tags = ['downloader'];
handler.command = /^(pixeldrain|pd)$/i;
handler.limit = true;
handler.register = false;
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
        console.log(`🚀 Running ${'pixeldrain.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/pixeldrain.js" <input_argument>');
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
                        command: 'pixeldrain'
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
                    command: 'pixeldrain'
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
