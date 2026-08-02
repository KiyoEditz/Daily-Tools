/**
 * CLI Tool: honkai-star-rail.js
 * Converted from plugins/honkai-star-rail.js
 */

const readline = require('readline');

/*
 • Fitur By Anomaki Team
 • Created : Nazand Code
 • Conributor : han (scrape) 
 • Honkai Char Name & Detail
 • Jangan Hapus Wm
 • https://whatsapp.com/channel/0029Vaio4dYC1FuGr5kxfy2l
*/

const axios = require('axios');
const cheerio = require('cheerio');

async function searchCharacter(name) {
    const url = 'https://genshin.gg/star-rail/character-stats/';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const characterData = {};

    $('.rt-tr').each((index, element) => {
        const characterName = $(element).find('.character-name').text().trim();
        if (characterName.toLowerCase() === name.toLowerCase()) {
            const hp = $(element).find('div').eq(1).text();
            const atk = $(element).find('div').eq(2).text();
            const def = $(element).find('div').eq(3).text();
            const speed = $(element).find('div').eq(4).text();
            const taunt = $(element).find('div').eq(5).text();
            const image = $(element).find('img.character-icon').attr('src');

            Object.assign(characterData, { name: characterName, hp, atk, def, speed, taunt, image });
        }
    });

    if (Object.keys(characterData).length === 0) throw 'Karakter tidak ditemukan';
    return characterData;
}

async function listCharacters() {
    const url = 'https://genshin.gg/star-rail/character-stats/';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const characters = [];

    $('.rt-tr').each((index, element) => {
        const characterName = $(element).find('.character-name').text().trim();
        if (characterName) characters.push(characterName);
    });

    return characters;
}

const handler = async (m, { text, conn }) => {
    if (!text) {
        const characterNames = await listCharacters();
        const namesList = characterNames.map((name, index) => `- *${index + 1}. ${name}*`).join('\n');
        return conn.sendMessage(m.chat, {
            text: `📜 *Daftar Karakter Honkai: Star Rail*\n\n${namesList}`,
        }, { quoted: m });
    } else {
        try {
            const character = await searchCharacter(text);
            const message = `
📖 *Detail Karakter*
⭐ *Nama*: ${character.name}
💖 *HP*: ${character.hp}
⚔️ *ATK*: ${character.atk}
🛡️ *DEF*: ${character.def}
🚀 *Speed*: ${character.speed}
🎯 *Taunt*: ${character.taunt}
📷 *Gambar*: ${character.image}
`.trim();

            return conn.sendMessage(m.chat, {
                text: message,
                contextInfo: {
                    externalAdReply: {
                        title: character.name,
                        body: 'Detail Statistik Karakter',
                        // sourceUrl: 'https://chat.whatsapp.com/', 
                        thumbnailUrl: character.image,
                        mediaType: 1,
                    },
                },
            }, { quoted: m });
        } catch (error) {
            return conn.sendMessage(m.chat, { text: `${error}` }, { quoted: m });
        }
    }
};

handler.command = ['honkai-star','honkai-rail','star-rail'];
handler.tags = ['games'];
handler.help = ['honkai-star nama karakter'];
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
        console.log(`🚀 Running ${'honkai-star-rail.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/honkai-star-rail.js" <input_argument>');
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
                        command: 'honkai-star-rail'
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
                    command: 'honkai-star-rail'
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
