/**
 * CLI Tool: applemusic.js
 * Converted from plugins/applemusic.js
 */

const readline = require('readline');

const fetch = require('node-fetch');

const handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) return m.reply(`Contoh:\n${usedPrefix + command} jakarta hari ini, 2`);

    let [query, jumlah] = args.join(' ').split(',');
    query = query?.trim();
    jumlah = parseInt(jumlah) || 1;

    if (!query) return m.reply(`Kamu belum kasih kata kunci.\nContoh:\n${usedPrefix + command} jakarta hari ini, 2`);

    try {
        let res = await fetch(`https://api.siputzx.my.id/api/s/applemusic?query=${encodeURIComponent(query)}&region=id`);
        let json = await res.json();

        if (!json.status || !json.data?.result?.length) return m.reply('Tidak ditemukan.');

        let result = json.data.result.slice(0, jumlah);

        for (let item of result) {
            let link = item.link;
            if (!link) continue;

            let down = await fetch(`https://www.velyn.biz.id/api/downloader/applemusic?url=${encodeURIComponent(link)}`);
            let downJson = await down.json();

            if (downJson?.status && downJson.data?.download_url) {
                let data = downJson.data;
                let caption = `*Title:* ${data.name}\n` +
                              `*Artist:* ${data.artist}\n` +
                              `*Album:* ${data.albumname}\n` +
                              `*Duration:* ${data.duration}\n` +
                              `*Link:* ${data.url}`;
                await conn.sendMessage(m.chat, {
                    audio: { url: data.download_url },
                    mimetype: 'audio/mp4',
                    fileName: `${data.name}.m4a`,
                    caption: caption,
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: data.name,
                            body: data.artist,
                            thumbnailUrl: data.thumb,
                            mediaUrl: data.url,
                            mediaType: 1,
                            showAdAttribution: true,
                            renderLargerThumbnail: true,
                            sourceUrl: data.url
                        }
                    }
                }, { quoted: m });
            } else {
                let teks = `*Title:* ${item.title}\n*Artist:* ${item.artist}\n*Link:* ${item.link}`;
                if (item.image) {
                    await conn.sendMessage(m.chat, {
                        image: { url: item.image },
                        caption: teks
                    }, { quoted: m });
                } else {
                    await m.reply(teks);
                }
            }
        }
    } catch (e) {
        console.error(e);
        m.reply('Terjadi kesalahan saat mengambil data.');
    }
};

handler.help = ['applemusic <query>, <jumlah>'];
handler.tags = ['music', 'downloader'];
handler.command = /^applemusic$/i;

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
        console.log(`🚀 Running ${'applemusic.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/applemusic.js" <input_argument>');
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
                        command: 'applemusic'
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
                    command: 'applemusic'
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
