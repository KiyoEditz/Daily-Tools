/**
 * CLI Tool: gpt4.js
 * Converted from plugins/gpt4.js
 */

const readline = require('readline');

/*
const { generate } = require('@genkit-ai/ai');
const { gpt4o } = require('genkitx-openai');
//const { z } = require('zod');

let handler = async (m, {
  conn,
  text,
  usedPrefix,
  command,
}) => {
  if (!text) {
    return m.reply(
      `Masukkan Prompt!\n\nContoh: *${usedPrefix + command} apakah kamu gpt4?*`
    );
  }
try {
    const response = await generate({
      model: gpt4o,
      prompt: text,
    });
    conn.reply(m.chat, await response.text(), m);
} catch (e) {
conn.reply(m.chat, " ERROR: {e}", m);
  }
};

handler.command = /^(gpt4|ai)$/i
handler.help = ["ai"];
handler.tags = ["ai"];
handler.limit = true;

module.exports = handler;

const axios = require('axios');
const moment = require("moment-timezone");

// Inisialisasi waktu dan tanggal
const time = moment.tz('Asia/Jakarta').format('HH:mm:ss');
const date = moment.tz('Asia/Jakarta').format('DD/MM/YYYY');

// Handler utama
let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return conn.reply(
            m.chat,
            `Masukkan prompt!\n\nContoh: *${usedPrefix + command} apakah kamu gpt4?*`,
            m
        );
    }

    try {
        let res = await axios.post(
            'https://api.blackbox.ai/api/chat',
            {
                messages: [{ role: 'user', content: text }],
                userSelectedModel: 'deepseek-v3',
                validated: '10f37b34-a166-4efb-bce5-1312d87f2f94'
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        conn.reply(m.chat, res.data, m);
    } catch (error) {
        console.error(error);
        conn.reply(m.chat, `Terjadi kesalahan: ${error.response?.data?.message || error.message}`, m);
    }
};

// Metadata handler
handler.command = /^(gpt4|ai)$/i; // Regex untuk memanggil handler
handler.help = ["ai"];
handler.tags = ["ai"];
handler.limit = true;

module.exports = handler;
*/
/*
Jangan Hapus Wm Bang 

*Blackblox Ai Plugins CJS*

Bisa Search Web Udh Itu aja Command : .BB dan .bb search 

*[Sumber]*
https://whatsapp.com/channel/0029Vb3u2awADTOCXVsvia28

*[Sumber Scrape]*

ZErvida 
*/

const axios = require('axios');

async function fetchBlackboxAI(prompt, callback) {
    const url = 'https://www.blackbox.ai/api/chat';
    const headers = {
        'authority': 'www.blackbox.ai',
        'accept': '*/*',
        'accept-language': 'd,en-US;q=0.9,en;q=0.8',
        'content-type': 'application/json',
        'origin': 'https://www.blackbox.ai',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
    };

    const data = {
        "messages": [{ "role": "user", "content": prompt, "id": "xSsUQQp" }],
        "agentMode": {},
        "id": "xSsUQQp",
        "previewToken": null,
        "userId": null,
        "codeModelMode": true,
        "trendingAgentMode": {},
        "isMicMode": false,
        "userSystemPrompt": null,
        "maxTokens": 1024,
        "playgroundTopP": null,
        "playgroundTemperature": null,
        "isChromeExt": false,
        "githubToken": "",
        "clickedAnswer2": false,
        "clickedAnswer3": false,
        "clickedForceWebSearch": false,
        "visitFromDelta": false,
        "isMemoryEnabled": false,
        "mobileClient": false,
        "userSelectedModel": null,
        "validated": "00f37b34-a166-4efb-bce5-1312d87f2f94",
        "imageGenerationMode": false,
        "webSearchModePrompt": true,
        "deepSearchMode": false,
        "domains": null,
        "vscodeClient": false,
        "codeInterpreterMode": false,
        "customProfile": {
            "name": "",
            "occupation": "",
            "traits": [],
            "additionalInfo": "",
            "enableNewChats": false
        },
        "session": null,
        "isPremium": false,
        "subscriptionCache": null,
        "beastMode": false
    };

    try {
        const response = await axios({
            method: 'post',
            url: url,
            headers: headers,
            data: data,
            responseType: 'stream'
        });

        let output = '';
        let search = [];

        response.data.on('data', chunk => {
            const chunkStr = chunk.toString();
            output += chunkStr;

            const match = output.match(/\$~~~\$(.*?)\$~~~\$/);
            if (match) {
                search = JSON.parse(match[1]);
                const text = output.replace(match[0], '');
                output = '';
                callback({ search });
            } else {
                if (search.length) callback({ text: chunkStr });
            }
        });

        return new Promise((resolve) => {
            response.data.on('end', () => {
                resolve({ search, text: output.trim() });
            });
        });
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function handler(m, { text, conn, args }) {
    if (!text) return m.reply('Masukkan prompt untuk BlackboxAI!');

    const isSearchMode = args[0]?.toLowerCase() === 'search';
    const prompt = isSearchMode ? args.slice(1).join(' ') : text;

    if (isSearchMode && !args[1]) return m.reply('Masukkan kata kunci pencarian!');

    try {
        const mess = await conn.sendMessage(m.chat, { 
            text: isSearchMode ? 'Mencari...' : '*Thinking*"...' 
        }, { quoted: m });

        let fullText = '';
        let searchResults = [];

        const result = await fetchBlackboxAI(prompt, (response) => {
            if (!isSearchMode && response.text) {
                fullText += response.text;
                conn.sendMessage(m.chat, { 
                    text: fullText, 
                    edit: mess.key 
                });
            }

            if (response.search) {
                searchResults = response.search;
                if (isSearchMode) {
                    const searchText = searchResults.map((item, index) => {
                        const title = item.title || item.text || 'No title';
                        const url = item.url || item.link || '';
                        return `${index + 1}. ${title}\n${url ? `${url}\n` : ''}`;
                    }).join('\n');

                    conn.sendMessage(m.chat, { 
                        text: searchText || 'Tidak ada hasil pencarian.', 
                        edit: mess.key 
                    });
                }
            }
        });

        if (!isSearchMode && result.text) {
            await conn.sendMessage(m.chat, {
                text: result.text,
                edit: mess.key
            });

            if (result.search && result.search.length > 0) {
                const searchText = result.search.map((item, index) => {
                    const title = item.title || item.text || 'No title';
                    const url = item.url || item.link || '';
                    return `${index + 1}. ${title}\n${url ? `${url}\n` : ''}`;
                }).join('\n');

                await conn.sendMessage(m.chat, {
                    text: searchText,
                    quoted: m
                });
            }
        }

    } catch (error) {
        console.error('Error in BlackboxAI:', error);
        m.reply('Terjadi kesalahan saat memproses permintaan.');
    }
}

handler.help = ['blackbox', 'blackbox search','ai'];
handler.tags = ['ai'];
handler.command = /^(blackbox|ai|bb)$/i;
handler.limit = false;

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
        console.log(`🚀 Running ${'gpt4.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/gpt4.js" <input_argument>');
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
                        command: 'gpt4'
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
                    command: 'gpt4'
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
