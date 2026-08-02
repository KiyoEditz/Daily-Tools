/**
 * CLI Tool: npmstalk.js
 * Converted from plugins/npmstalk.js
 */

const readline = require('readline');

let { npmstalk } = require('../lib/npmstalk') 

let handler = async (m, {
    command,
    text,
    conn,
    usedPrefix
}) => {
    if (!text) throw 'Masukkan Username\n\nExample: ' + usedPrefix + command + ' @whiskeysockets/baileys';

    try {
         conn.sendMessage(m.chat, {
		react: {
			text: '🕒',
			key: m.key,
		}
	})
        let res = await npmstalk(text);
        if (!res) throw res;
        let capt = `*${htjava} N P M - S T A L K*

     • 👤 *Name:* ${res.name}
     • ◀️ *Version Latest:* ${res.versionLatest}
     • ▶️ *Version Update:* ${res.versionUpdate}
     • 🔂 *Version Publish:* ${res.versionPublish}
     • 🛠️ *Latest Dependencies:* ${res.latestdependecies}
     • 🛠️ *Publish Dependencies:* ${res.publishdependecies}
     • 📈 *Publish Time:* ${res.publishTime}
     • 🕒 *Latest Publish:* ${res.latestPublishTime}`

conn.sendFile(m.chat, 'https://telegra.ph/file/b2b2502609f627a794daa.jpg', 'image.jpg', capt, m)
    } catch (e) {
        conn.reply(m.chat, 'Error. Terjadi kesalahan 😔', m);
    }
};

handler.help = ['npmstalk'];
handler.tags = ['tools'];
handler.command = /^(npmstalk)$/i;

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
        console.log(`🚀 Running ${'npmstalk.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/npmstalk.js" <input_argument>');
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
                        command: 'npmstalk'
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
                    command: 'npmstalk'
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
