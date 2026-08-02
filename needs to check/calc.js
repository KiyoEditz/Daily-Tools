/**
 * CLI Tool: calc.js
 * Converted from plugins/calc.js
 */

const readline = require('readline');

let handler = async (m, { conn, text, usedPrefix, command }) => {
  conn.math = conn.math ? conn.math : {};
  let id = m.sender;

  if (id in conn.math) {
    clearTimeout(conn.math[id][3]);
    delete conn.math[id];
    return m.reply('Hmmm... ngecheat ya??');
  }
///Code di atas ini sebenernya gak perlu ada. Cuman anti cheat buat game math 

  if (!text) return m.reply(`Penggunaan: ${usedPrefix + command} <perhitungan>\n\nContoh:\n${usedPrefix + command} 5÷0.5`);

  let val = text
    .replace(/[^0-9\-\/+*×÷πEe().]/g, '') // Hanya angka dan simbol tertentu
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π|pi/gi, 'Math.PI')
    .replace(/e/gi, 'Math.E')
    .replace(/\/+/g, '/')
    .replace(/\++/g, '+')
    .replace(/-+/g, '-');

  let format = val
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e')
    .replace(/\//g, '÷')
    .replace(/\*/g, '×');

  try {
    let result = Function('"use strict"; return (' + val + ')')();

    if (result === Infinity || result === -Infinity || isNaN(result)) {
      throw new Error('Perhitungan tidak valid!');
    }

    m.reply(`*${format}* = _${result}_`);
  } catch (e) {
    m.reply('_Format salah atau perhitungan tidak valid!_\nHanya angka dan simbol -, +, *, /, ×, ÷, π, e, (.) yang didukung.');
  }
};

handler.help = ['calc', 'kalkulator'];
handler.tags = ['tools'];
handler.command = /^(calc(ulat(e|or))?|kalk(ulator)?)$/i;
handler.exp = 5;

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
        console.log(`🚀 Running ${'calc.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/calc.js" <input_argument>');
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
                        command: 'calc'
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
                    command: 'calc'
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
