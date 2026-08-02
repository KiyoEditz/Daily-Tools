/**
 * CLI Tool: cocstalk.js
 * Converted from plugins/cocstalk.js
 */

const readline = require('readline');

/* Plugin Stalker Clash of Clans type cjs
   Scraper by fruatre
*/
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeCOC(playerTag) {
    try {
        const url = `https://brawlace.com/coc/players/%23${playerTag}`;
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);

        const getText = (selector, regex) => 
            $(selector).filter((_, el) => $(el).text().includes(regex.split(" ")[0]))
                .text().match(new RegExp(regex))?.[1] || "Tidak ditemukan";

        return {
            name: $('h2.pt-3').text().trim() || "Tidak ditemukan",
            clan: $('h3.pb-2 a').text().trim() || "Tidak ada clan",
            level: getText('div.card-body', "Level (\\d+)"),
            trophies: getText('div.card-body', "Trophies (\\d+)"),
            bestTrophy: $('div.card-body').filter((_, el) => $(el).text().includes("Best Season")).text().match(/Trophies (\d+)/)?.[1] || "Tidak ditemukan",
            townHall: getText('div.card-body', "Town Hall Level (\\d+)"),
            warStars: getText('div.card-body', "War Stars (\\d+)"),
            attackWins: getText('div.card-body', "Attack Wins (\\d+)"),
            defenseWins: getText('div.card-body', "Defense Wins (\\d+)"),
            legendRank: getText('div.card-body', "Current Season.*?Rank (\\d+)"),
            profileUrl: url
        };
    } catch (error) {
        console.error("Error:", error.message);
        return null;
    }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `*Contoh:* ${usedPrefix}${command} 8000QP00C`;

    try {
        const playerTag = args[0].toUpperCase().replace(/#/g, '');
        const data = await scrapeCOC(playerTag);

        if (!data) throw '*Data tidak ditemukan atau terjadi kesalahan!*';

        let message = `*Clash of Clans Player Stalker*\n\n`;
        message += `Nama > ${data.name}\n`;
        message += `Clan > ${data.clan}\n`;
        message += `Level > ${data.level}\n`;
        message += `Trophies > ${data.trophies}\n`;
        message += `Best Trophy > ${data.bestTrophy}\n`;
        message += `Town Hall Level > ${data.townHall}\n`;
        message += `War Stars > ${data.warStars}\n`;
        message += `Attack Wins > ${data.attackWins}\n`;
        message += `Defense Wins > ${data.defenseWins}\n`;
        message += `Legend Rank > ${data.legendRank}\n\n`;
        message += `Profile URL > ${data.profileUrl}`;

        await conn.reply(m.chat, message, m);
    } catch (e) {
        console.error(e);
        throw '*Terjadi kesalahan saat mengambil data!*';
    }
};

handler.help = ['cocstalk'].map(v => v + ' <playerTag>');
handler.tags = ['stalk'];
handler.command = /^(cocstalk|stalkcoc)$/i;
handler.limit = true;

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
        console.log(`🚀 Running ${'cocstalk.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/cocstalk.js" <input_argument>');
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
                        command: 'cocstalk'
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
                    command: 'cocstalk'
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
