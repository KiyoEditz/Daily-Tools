/**
 * CLI Tool: yahoo.js
 * Converted from plugins/yahoo.js
 */

const readline = require('readline');

// Jangan Hapus Wm Bang 

// *Yahoo Search Img/web Plugins CJS*

// Entahlah 

// *[Sumber]*
// https://whatsapp.com/channel/0029Vb3u2awADTOCXVsvia28

// *[Sumber Scrape]*

// https://whatsapp.com/channel/0029VamzFetC6ZvcD1qde90Z/3955
//  *(Kyknya)*


const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const body = {
    httpsAgent,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
    }
};

const Yahoo = {
    search: async (query) => {
        const res = await axios.get('https://search.yahoo.com/search?p=' + encodeURIComponent(query), body);
        let $ = cheerio.load(res.data);
        const items = [];

        $('.searchCenterMiddle li').each((_, element) => {
            const title = ($(element).find('a').text() + "").split('·');
            const icon = $(element).find('img').attr('src');
            const description = $(element).find('.compText').text().trim();
            const link = $(element).find('a').attr('href');

            items.push({
                link,
                description,
                icon,
                title: (title[2] || title[1] || title[0]).trim()
            });
        });

        return items;
    },

    images: async (query) => {
        const res = await axios.get('https://images.search.yahoo.com/search/images?p=' + encodeURIComponent(query), body);
        let $ = cheerio.load(res.data);
        const items = [];

        $('.sres-cntr li').each((_, element) => {
            const title = $(element).find('.title').text().trim();
            const image = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');
            const ratio = $(element).find('.asp-rat').text().trim();
            const source = $(element).find('.source').text().trim();

            items.push({
                source,
                ratio,
                image: (image + "").split('&')[0],
                title
            });
        });

        return items;
    }
};

let handler = async (m, { conn, args, text }) => {
    if (!text) return m.reply("Mana query-nya?");

    let searchType = args[0]?.toLowerCase();
    let query = args.slice(1).join(" ");

    if (!query) return m.reply("Masukin kata kunci yang mau dicari!");

    if (searchType === 'web') {
        let results = await Yahoo.search(query);
        if (!results.length) return m.reply("Gak nemu hasilnya!");

        let teks = "*Hasil Pencarian Yahoo*\n\n";
        results.slice(0, 3).forEach((item, i) => {
            teks += `*${i + 1}. ${item.title}*\n${item.link}\n ${item.description}\n\n`;
        });

        m.reply(teks);
    } 
    
    else if (searchType === 'img') {
        let results = await Yahoo.images(query);
        if (!results.length) return m.reply("Gak ada gambar yang ditemukan!");

        let { title, image, source } = results[0];
        conn.sendMessage(m.chat, {
            image: { url: image },
            caption: `*Hasil Pencaharian Yahoo*\n\n*Judul:* ${title}\n🔗 *Sumber:* ${source}`
        });
    } 
    
    else {
        return m.reply("Pilih jenis pencarian dulu! Gunakan:\n- `.yahoo web {query}`\n- `.yahoo img {query}`");
    }
};

handler.help = ['yahoo'];
handler.tags = ['internet']
handler.command = ['yahoo'];

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
        console.log(`🚀 Running ${'yahoo.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/yahoo.js" <input_argument>');
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
                        command: 'yahoo'
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
                    command: 'yahoo'
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
