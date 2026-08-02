/**
 * CLI Tool: igstalk.js
 * Converted from plugins/igstalk.js
 */

const readline = require('readline');

/*
*[Plugins Igstalk]* 
By Fruatre
wa.me/6285817597752
Saluran : https://whatsapp.com/channel/0029VaNR2B6BadmioY6mar3N
*/

const cheerio = require('cheerio');
const axios = require('axios');

let handler = async (m, { conn, args }) => {
    if (!args[0]) return m.reply("Masukkan nama pengguna Instagram yang valid!");
    try {
        const data = await stalkige(args[0]);
        const caption = `
Nama Pengguna: ${data.namalu}
Bio: ${data.bio}
Jumlah Postingan: ${data.totalpost}
Jumlah Pengikut: ${data.totalpengikut}
        `;
        await conn.sendFile(m.chat, data.linkpp, 'profile.jpg', caption, m);
    } catch (e) {
        m.reply(e.message || "Terjadi kesalahan.");
    }
};

handler.help = handler.command = ['igstalk'];
handler.tags = ['downloader'];
module.exports = handler;

async function stalkige(namalu) {
    const url = `https://greatfon.io/v/${encodeURIComponent(namalu)}`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://greatfon.io',
            },
        });

        const $ = cheerio.load(data);

        const namalu = $('h1.text-4xl').text().trim() || 'Tidak ditemukan';
        const bio = $('.items-top .text-sm').text().trim() || 'Tidak ada bio';
        const totalpost = $('.stat-title:contains("Posts")').siblings('.stat-value').text().trim() || '0';
        const totalpengikut = $('.stat-title:contains("Followers")').siblings('.stat-value').text().trim() || '0';
        const linkpp = $('figure img').attr('src') || 'https://via.placeholder.com/150'; // Gambar default jika tidak ditemukan

        return {
            namalu,
            bio,
            totalpost,
            totalpengikut,
            linkpp,
        };
    } catch (error) {
        throw new Error("Terjadi kesalahan saat mengambil data. Pastikan nama pengguna benar.");
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
        console.log(`🚀 Running ${'igstalk.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/igstalk.js" <input_argument>');
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
                        command: 'igstalk'
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
                    command: 'igstalk'
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
