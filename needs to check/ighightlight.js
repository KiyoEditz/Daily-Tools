/**
 * CLI Tool: ighightlight.js
 * Converted from plugins/ighightlight.js
 */

const readline = require('readline');

let fetch = require('node-fetch')
let handler = async (m, { conn, args, usedPrefix, command }) => {
	if (!(/^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$/i.test(args[0]))) throw 'Masukan username tanpa @'
	let res = await fetch(global.API('lolhuman', `/api/highlights/${args[0]}`, 'apikey'))
	if (!res.ok) throw 'Server Error.. Harap lapor owner'
	let json = await res.json()
	if (json.result.length == 0) throw `sorotan tidak ditemukan`
	for (let link of json.result) {
		conn.sendFile(m.chat, link, 'ighl' + (link.includes('mp4') ? '.mp4' : '.jpg'), ``, m)
	}
}
handler.help = ['ighightlight', 'igsorotan'].map(v => v + ' <username>')
handler.tags = ['downloadersosmed']
handler.command = /^(ig(highlights?|sorotan))$/i
handler.limit = true
handler.private = true

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
        console.log(`🚀 Running ${'ighightlight.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/ighightlight.js" <input_argument>');
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
                        command: 'ighightlight'
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
                    command: 'ighightlight'
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
