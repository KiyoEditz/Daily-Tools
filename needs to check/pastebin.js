/**
 * CLI Tool: pastebin.js
 * Converted from plugins/pastebin.js
 */

const readline = require('readline');

/*
 • Fitur By Anomaki Team
 • Created : Nazand Code
 • Untuk mengambil isi konten pastebin (bagi yang malas ke webnya aja:v) 
 • Dibuat krn malam malam gabut
 • Jangan Hapus Wm
 • https://whatsapp.com/channel/0029Vaio4dYC1FuGr5kxfy2l
*/

const fetch = require('node-fetch');

const handler = async (m, { args }) => {
  const link = args[0]?.trim();
  if (!link) {
    return m.reply('mana!');
  }
  if (!/^https:\/\/pastebin\.com\/[a-zA-Z0-9]+$/.test(link)) {
    return m.reply('url gk valid');
  }
  const pasteId = link.split('/').pop();
  try {
    const response = await fetch(`https://pastebin.com/raw/${pasteId}`);
    if (!response.ok) throw new Error('Gagal mengambil isi dari Pastebin.');
    const content = await response.text();
    if (!content) {
      return m.reply('Tidak ada isi yang ditemukan di Pastebin!');
    }
    m.reply(`${content}`);
  } catch (error) {
    console.error(error);
    m.reply('Terjadi kesalahan saat mengambil data dari Pastebin.');
  }
};

handler.command = ['getpb','pastebin','getpastebin'];
handler.tags = ['tools'];
handler.help = ['getpb url'];

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
        console.log(`🚀 Running ${'pastebin.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/pastebin.js" <input_argument>');
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
                        command: 'pastebin'
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
                    command: 'pastebin'
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
