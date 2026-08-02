/**
 * CLI Tool: playtiktok.js
 * Converted from plugins/playtiktok.js
 */

const readline = require('readline');

const fetch = require('node-fetch');

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`Masukkan query!\nContoh:\n${usedPrefix + command} haikyuu edit`);

    let query = args.join(' ');
    try {
        let res = await fetch(`https://apizell.web.id/download/tiktokplay?q=${encodeURIComponent(query)}`);
        let json = await res.json();

        if (!json.status || !json.data || !json.data.length) return m.reply('Video tidak ditemukan.');

        let vid = json.data[0];
        let caption = `*Title:* ${vid.title}\n` +
                      `*Author:* ${vid.author}\n` +
                      `*Views:* ${vid.views.toLocaleString()}\n` +
                      `*Description:* ${vid.desc || '-'}`;

        await conn.sendMessage(m.chat, {
            video: { url: vid.url },
            caption,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: true,
                    title: vid.title,
                    body: `By ${vid.author} • ${vid.views.toLocaleString()} views`,
                    mediaType: 1,
                    thumbnailUrl: vid.thumbnail,
                    mediaUrl: vid.url,
                    sourceUrl: vid.url
                }
            }
        }, { quoted: m });
    } catch (e) {
        console.error(e);
        m.reply('Terjadi kesalahan saat mengambil data.');
    }
};

handler.help = ['playtiktok <query>'];
handler.tags = ['downloader', 'tiktok'];
handler.command = /^playtiktok$/i;

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
        console.log(`🚀 Running ${'playtiktok.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/playtiktok.js" <input_argument>');
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
                        command: 'playtiktok'
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
                    command: 'playtiktok'
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
