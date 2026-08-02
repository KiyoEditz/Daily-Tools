/**
 * CLI Tool: bstation.js
 * Converted from plugins/bstation.js
 */

const readline = require('readline');

/*
Jangan Hapus Wm Bang 

*Bilibili/Bstation Search  Plugins CJS*

*[Sumber]*
https://whatsapp.com/channel/0029Vb3u2awADTOCXVsvia28

*[Sumber Scrape]*
https://whatsapp.com/channel/0029VadfVP5ElagswfEltW0L/2192
*/

const axios = require('axios');
const cheerio = require('cheerio');

async function getBsTation(q) {
    try {
        const anu = `https://www.bilibili.tv/id/search-result?q=${q}`;
        const { data } = await axios.get(anu);
        const $ = cheerio.load(data);

        let result = [];

        $('.card-container').each((_, el) => {
            const search = $(el).find('p.card-container__title').text().trim();
            const videoUrl = "https://www.bilibili.tv" + $(el).find('a').attr('href');
            const imageUrl = $(el).find('img').attr('src');
            const views = $(el).find('span.meta__tips-text').text().trim();
            const description = $(el).find('p').text().trim();

            result.push({
                search,
                videoUrl,
                imageUrl,
                views,
                description
            });
        });
        return result;
    } catch (e) {
        console.log(e);
        return [];
    }
}

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('Berikan Query Nya\n\n *Example :* .bilibili Spy X Family');
    
    try {
        const result = await getBsTation(text);
        
        if (result.length === 0) {
            return m.reply('Gak Nemu  Coba Cari Yang Lain');
        }
        
        let teks = 'Bilibili Search\n\n';
        
        for (let i = 0; i < result.length; i++) {
            const item = result[i];
            teks += `*Title :* ${item.search}\n\n`;
            teks += `*Views :* ${item.views}\n\n`;
            teks += `*Description :* ${item.description}\n\n`;
            teks += `*Link :* ${item.videoUrl}\n\n`;
        }
        
        await conn.sendMessage(m.chat, { 
            image: { url: result[0].imageUrl }, 
            caption: teks 
        }, { quoted: m });
        
    } catch (e) {
        console.log(e);
        m.reply('Error');
    }
};

handler.help = ['bilibili <query>'];
handler.tags = ['internet'];
handler.command = ['bilibili', 'bstation'];

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
        console.log(`🚀 Running ${'bstation.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/bstation.js" <input_argument>');
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
                        command: 'bstation'
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
                    command: 'bstation'
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
