/**
 * CLI Tool: terabox.js
 * Converted from plugins/terabox.js
 */

const readline = require('readline');

const teradlx = require('../lib/terabox');

let handler = async (m, { conn, command, text, args }) => {
    if (!text) {
        throw `_*Link nya mana?!*_\n\nContoh:\n${usedPrefix}${command} https://www.terabox.app/wap/share/filelist?surl=qx26_6N3phpSAfwtefjT-g`;
    }

    try {
        conn.reply(m.chat, `_Sedang memproses, harap tunggu..._`, m);

        // Mengambil respons dari scraper
        const response = await teradlx(text);
        const { filename, size, download } = response;

        // Membuat caption untuk file
        let capt = `╭──── 〔 TERABOX 〕 ─⬣\n`;
        capt += ` ⬡ *Title* : ${filename}\n`;
        capt += ` ⬡ *Size* : ${size}\n`;
        capt += `╰────────⬣\n`;

        // Mengirim dokumen dengan nama file dan tipe MIME yang sesuai
        conn.sendMessage(
            m.chat,
            {
                document: download,
                mimetype: getMimeType(filename),
                fileName: filename,
                caption: capt,
            },
            { quoted: m }
        );
    } catch (e) {
        throw `Error: ${e.message || e}`;
    }
};

// Fungsi untuk mendapatkan MIME type berdasarkan ekstensi file
function getMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        pdf: 'application/pdf',
        mp4: 'video/mp4',
        mkv: 'video/x-matroska',
        mp3: 'audio/mpeg',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        txt: 'text/plain',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        default: 'application/octet-stream', // MIME type default
    };

    return mimeTypes[extension] || mimeTypes.default;
}

handler.help = ['teraboxdl'];
handler.command = /^(teraboxdl|teradl|terabox)$/i;
handler.tags = ['downloader', 'tools'];
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
        console.log(`🚀 Running ${'terabox.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/terabox.js" <input_argument>');
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
                        command: 'terabox'
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
                    command: 'terabox'
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
