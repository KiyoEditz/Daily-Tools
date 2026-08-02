/**
 * CLI Tool: capcut.js
 * Converted from plugins/capcut.js
 */

const readline = require('readline');

/* [ CAPCUT DOWNLOADER ]
Scrape by https://whatsapp.com/channel/0029Vb2mOzL1Hsq0lIEHoR0N/144
*/

const axios = require('axios');
const cheerio = require('cheerio');

const handler = async (m, { conn, usedPrefix, command, text }) => {
    if (!text) return m.reply(`*• Example :* ${usedPrefix + command} *[url capcut]*`);
    m.reply('Tunggu sebentar...');
    
    try {
        const result = await capcutdl(text);

        if (!result) {
            return m.reply('❌ Gagal mendapatkan data. Pastikan URL yang dimasukkan benar.');
        }

        const cpt = `*乂 C A P C U T - D O W N L O A D E R*\n\n   ◦ Title : ${result.title}\n   ◦ Date : ${result.date}\n   ◦ Pengguna : ${result.pengguna}\n   ◦ Likes : ${result.likes}\n   ◦ Author : ${result.author.name}`;
        await conn.sendFile(m.chat, result.videoUrl, '', cpt, m, {
            thumbnail: await (await axios.get(result.posterUrl, { responseType: 'arraybuffer' })).data
        });
    } catch (error) {
        console.error(error);
        m.reply('Terjadi kesalahan saat mengambil data.');
    }
};

handler.help = ["capcut"].map((a) => a + " *[url capcut]*");
handler.tags = ["downloader"];
handler.command = ["capcut"];

module.exports = handler;

async function capcutdl(url) {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const videoElement = $('video.player-o3g3Ag');
        const videoSrc = videoElement.attr('src');
        const posterSrc = videoElement.attr('poster');
        const title = $('h1.template-title').text().trim();
        const actionsDetail = $('p.actions-detail').text().trim();
        const [date, uses, likes] = actionsDetail.split(',').map(item => item.trim());
        const authorAvatar = $('span.lv-avatar-image img').attr('src');
        const authorName = $('span.lv-avatar-image img').attr('alt');

        if (!videoSrc || !posterSrc || !title || !date || !uses || !likes || !authorAvatar || !authorName) {
            throw new Error('Beberapa elemen penting tidak ditemukan di halaman.');
        }

        return {            
            title: title,
            date: date,
            pengguna: uses,
            likes: likes,
            author: {
                name: authorName,
                avatarUrl: authorAvatar
            },
            videoUrl: videoSrc,
            posterUrl: posterSrc
        };
    } catch (error) {
        console.error('Error fetching video details:', error.message);
        return null;
    }
}

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
        console.log(`🚀 Running ${'capcut.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/capcut.js" <input_argument>');
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
                        command: 'capcut'
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
                    command: 'capcut'
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
