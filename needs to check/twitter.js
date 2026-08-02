/**
 * CLI Tool: twitter.js
 * Converted from plugins/twitter.js
 */

const readline = require('readline');

const axios = require('axios');
const cheerio = require('cheerio');

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) {
        return m.reply(`Masukkan URL X (Twitter)\n\n*Contoh:* ${usedPrefix}${command} https://x.com/elonmusk/status/1901663707190419744`);
    }

    const regex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
    if (!regex.test(args[0])) {
        return m.reply('Berikan URL dari X (Twitter) yang valid.');
    }

    m.reply('*Tunggu sebentar, sedang memproses...*');

    try {
        const res = await axios.post('https://twmate.com/', new URLSearchParams({
            page: args[0],
            ftype: 'all',
            ajax: '1'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://twmate.com/',
            }
        });

        const $ = cheerio.load(res.data);
        const videoLinks = [];
        $('.btn-dl').each((index, element) => {
            const quality = $(element).parent().prev().text().trim();
            const downloadUrl = $(element).attr('href');
            if (downloadUrl.includes('.mp4')) {
                videoLinks.push({ quality, downloadUrl });
            }
        });

        if (videoLinks.length === 0) {
            return m.reply('Gagal mengambil video. Pastikan URL benar dan video bersifat publik.');
        }

        const best = videoLinks[0];
        let caption = `*Download Twitter/X*\n\n`;
        caption += `*Quality:* ${best.quality}\n`;
        caption += `*Source:* ${args[0]}\n\n`;
        caption += `*Link Alternatif:*\n`;
        videoLinks.forEach((v, i) => {
            caption += `${i + 1}. ${v.quality}: ${v.downloadUrl}\n`;
        });

        await conn.sendMessage(m.chat, {
            video: { url: best.downloadUrl },
            caption: caption.trim()
        }, { quoted: m });

    } catch (error) {
        console.error(error);
        m.reply('Terjadi kesalahan saat memproses video.');
    }
};

handler.help = ['twitter'].map(v => v + ' <url>');
handler.tags = ['downloader'];
handler.alias = ['x', 'twitter', 'twdown'];
handler.command = /^(x|twitter|twdown)$/i;

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
        console.log(`🚀 Running ${'twitter.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/twitter.js" <input_argument>');
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
                        command: 'twitter'
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
                    command: 'twitter'
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
