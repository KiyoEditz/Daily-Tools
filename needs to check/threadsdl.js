/**
 * CLI Tool: threadsdl.js
 * Converted from plugins/threadsdl.js
 */

const readline = require('readline');

const threadster = require('../lib/threads.js');

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    throw `Masukkan URL!\n\nContoh:\n${usedPrefix}${command} https://www.threads.net/@kiyoeditz/post/DBM2ZfDhNt1?xmt=AQGzrh-Sij7-wJHJB8vj6q4Gu4plAuy-7IqSgfVMkNePCg`;
  }

  try {
    // Ekstraksi ID dari URL
    let urlMatch = args[0].match(/\/post\/([A-Za-z0-9-_?=]+)$/i);
    if (!urlMatch) throw `URL tidak valid!`;
    let id = urlMatch[0];

    conn.reply(m.chat, `_Sedang memproses, harap tunggu..._`, m);

    // Mengambil respons dari API Threadster
    const response = await threadster(id);
    let vid = response.content.download.link;

    await m.reply('_Sedang mengirim file..._');

    // Kirim file ke chat
    let fileType = vid.endsWith('.jpg') || vid.endsWith('.jpeg') ? 'image' : 'video';
    await conn.sendFile(
      m.chat,
      vid,
      `threads.${fileType === 'image' ? 'jpg' : 'mp4'}`,
      '',
      m,
      null,
      { asDocument: global.db.data.users[m.sender]?.useDocument || false }
    );
  } catch (e) {
    throw `Error: ${e.message || e}`;
  }
};

handler.help = ['threads'];
handler.command = /^(threads)$/i;
handler.tags = ['downloader'];
handler.limit = true;
handler.group = false;
handler.premium = false;

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
        console.log(`🚀 Running ${'threadsdl.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/threadsdl.js" <input_argument>');
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
                        command: 'threadsdl'
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
                    command: 'threadsdl'
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
