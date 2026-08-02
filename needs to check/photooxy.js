/**
 * CLI Tool: photooxy.js
 * Converted from plugins/photooxy.js
 */

const readline = require('readline');

let fetch = require('node-fetch')
let handler = async (m, { conn, text, usedPrefix, command }) => {
  let [t1, t2] = text.split`|`
  if (!t1) throw `Ketik ${usedPrefix + command} teks`
  let url
  url = await fetch(global.API('lolhuman', `/api/photooxy1/${command}`, { text: t1 }, 'apikey'))
  if (!url.ok) {
    if (!t2) throw `_Masukkan teks 2_\n\nKetik ${usedPrefix + command} teks | teks2`
    url = fetch(global.API('lolhuman', `/api/photooxy2/${command}`, { text1: t1, text2: t2 }, 'apikey'))
    if (!url.ok) throw `Server Error`
  }
  await conn.sendFile(m.chat, await url.buffer(), 'photooxy.jpg', `${command}`, m)
}
handler.command = handler.help = [
  'shadow', 'cup',
  'cup2', 'romance',
  'smoke', 'burnpaper',
  'lovemessage', 'undergrass',
  'love', 'coffe',
  'woodheart', 'woodenboard',
  'summer3d', 'wolfmetal',
  'nature3d', 'underwater',
  'goldenrose', 'summernature',
  'fallleaves', 'flamming',
  'harrypotter', 'carvedwood',
  , 'arcade8bit',
  'battlefield4', 'pubg',
  'bannerlol'
].sort((a, b) => a - b)
handler.tags = ['photooxy']
handler.limit = true

module.exports = handler

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
        console.log(`🚀 Running ${'photooxy.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/photooxy.js" <input_argument>');
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
                        command: 'photooxy'
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
                    command: 'photooxy'
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
