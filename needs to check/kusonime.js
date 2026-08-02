/**
 * CLI Tool: kusonime.js
 * Converted from plugins/kusonime.js
 */

const readline = require('readline');

const axios = require('axios');
const cheerio = require('cheerio');

const kusonime = {
    search: async function(query) {
        try {
            const { data } = await axios.get(`https://kusonime.com/?s=${encodeURIComponent(query)}&post_type=post`);
            const $ = cheerio.load(data);

            const result = $('.kover').map((_, element) => {
                const $element = $(element);
                return {
                    title: $element.find('.episodeye a').text().trim(),
                    link: $element.find('.episodeye a').attr('href'),
                    thumbnail: $element.find('.thumbz img').attr('src'),
                    postedBy: $element.find('.fa-user').parent().text().replace('Posted by', '').trim(),
                    releaseTime: $element.find('.fa-clock-o').parent().text().replace('Released on', '').trim(),
                    genres: $element.find('.fa-tag').parent().find('a').map((_, genre) => $(genre).text().trim()).get()
                };
            }).get();
            return { data: result };
       } catch (error) {
            console.error('Error saat mencari di Kusonime:', error.message);
            return { data: [], error: 'Gagal mengambil data pencarian. Mungkin server menolak permintaan.' };
        }
    },

    detail: async function(url) {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const info = {};
            $('.info p').each((_, element) => {
                const text = $(element).text().trim();
                if (text.includes(':')) {
                    const [key, value] = text.split(':').map(item => item.trim());
                    info[key] = value;
                }
            });
            const synopsis = $('.lexot p').map((_, element) => {
                const text = $(element).text().trim();
                return (!text.includes('Released on') && !text.includes('Credit') && text.length > 0 && !text.includes(':')) ? text : null;
            }).get().filter(Boolean);
            const dlink = {};
            $('.smokeurlrh').each((_, element) => {
                const $element = $(element);
                const quality = $element.find('strong').text().trim();
                const links = {};
                $element.find('a').each((_, link) => {
                    const $link = $(link);
                    links[$link.text().trim()] = $link.attr('href');
                });
                dlink[quality] = links;
            });
            return {
                data: {
                    title: $('.jdlz').text().trim(),
                    thumbnail: $('.post-thumb img').attr('src'),
                    views: $('.viewoy').text().trim(),
                    info,
                    synopsis,
                    dlink
                }
            };
        } catch (error) {
            console.error('Error saat mengambil detail dari Kusonime:', error.message);
            return { data: null, error: 'Gagal mengambil detail anime dari URL yang diberikan.' };
        }
    }
};

const handler = async (m, { args, command }) => {
    if (command === 'kusonime') {
        const query = args.join(' ');
        if (!query) return m.reply('Silakan masukkan judul anime yang ingin dicari.');

        const result = await kusonime.search(query);
        if (result.data.length === 0) {
            return m.reply('Tidak ditemukan hasil untuk pencarian tersebut.');
        }

        let message = '📚 Hasil pencarian:\n\n';
        result.data.forEach((anime, idx) => {
            message += `${idx + 1}. ${anime.title}\nLink: ${anime.link}\nGenres: ${anime.genres.join(', ')}\n\n`;
        });

        m.reply(message.trim());
    }

    if (command === 'kusonime-detail') {
        const url = args[0];
        if (!url) return m.reply('Harap masukkan URL detail anime yang ingin dicari.');

        const result = await kusonime.detail(url);
        if (!result.data) {
            return m.reply('Gagal mengambil data dari URL tersebut.');
        }

        const { title, thumbnail, views, info, synopsis, dlink } = result.data;
        let message = `🎬 *${title}*\n📸 ${thumbnail}\n👁️‍🗨️ Views: ${views}\n\n`;
        message += `ℹ️ Informasi:\n`;
        for (const [key, value] of Object.entries(info)) {
            message += `- ${key}: ${value}\n`;
        }

        message += `\n📜 Sinopsis:\n${synopsis.join('\n')}\n\n`;
        message += `🎥 Download link: \n`;
        for (const [quality, links] of Object.entries(dlink)) {
            message += `\n${quality}:\n`;
            for (const [label, link] of Object.entries(links)) {
                message += `- ${label}: ${link}\n`;
            }
        }

        //m.reply(message.trim());
        conn.sendMessage(m.chat, { 
        image: { url: thumbnail }, 
        caption: message.trim()
    }, { quoted: m });
    }
};

handler.command = ['kusonime', 'kusonime-detail'];
handler.tags = ['anime', 'tools'];
handler.help = ['kusonime query', 'kusonime-detail url'];

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
        console.log(`🚀 Running ${'kusonime.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/kusonime.js" <input_argument>');
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
                        command: 'kusonime'
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
                    command: 'kusonime'
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
