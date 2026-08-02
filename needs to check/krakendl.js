/**
 * CLI Tool: krakendl.js
 * Converted from plugins/krakendl.js
 */

const readline = require('readline');

const krakens = require('../lib/krakendl.js');
const fetch = require('node-fetch');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `*🚩 Example:* ${usedPrefix}${command} https://krakenfiles.com/view/neTIvR1wIz/file.html`;
      try {
        const res = await krakens.download(text);
        if (res.error) throw res.error; 
        let msg = `乂 *K R A K E N  D O W N L O A D E R*\n\n`;
        msg += ` ◦ *Name* : ${res.fileName}\n`;
        msg += ` ◦ *View* : unknown\n`;
        msg += ` ◦ *Size* : unknown\n`;
        msg += ` ◦ *Type* : unknown\n`;
        msg += ` ◦ *Uploaded* : unknow\n`;
        msg += ` ◦ *Download* : unknow\n`;
        msg += ` ◦ *Last Download* : unknow\n`;
        msg += ` ◦ *Link* : ${res.downloadLink}\n`;

        await conn.sendFile(m.chat, res.thumbnail, 'thumb_.png', msg, m);
        await conn.sendMessage(m.chat, { document: { url: res.downloadLink }, fileName: res.fileName, mimetype: res.fileName }, { quoted: m });

    } catch (e) { throw e }
};
handler.help = ['krakendl'].map(v => v + '<url>');
handler.tags = ['downloader'];
handler.command =  /^(krakendl|krakendownload)$/i
handler.limit = true;
handler.register = false;
handler.premium = false;

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
        console.log(`🚀 Running ${'krakendl.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/krakendl.js" <input_argument>');
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
                        command: 'krakendl'
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
                    command: 'krakendl'
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
