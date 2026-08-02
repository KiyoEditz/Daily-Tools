/**
 * CLI Tool: bingimg.js
 * Converted from plugins/bingimg.js
 */

const readline = require('readline');



let fetch = require('node-fetch')
let handler = async (m, { conn, args, text, command, usedPrefix, isCreator, isPrems }) => {
  if (!text) return m.reply(`*Masukkan Parameter!*\n\nExample: ${usedPrefix + command} a dynamic origami representation of Luffy from One Piece, painted with vibrant colors, capturing the essence of the character's energy, in the style of manga illustrations, exaggerated facial expression, Canon EOS 5D Mark IV, studio portrait, shōnen anime`)
	conn.sendMessage(m.chat, {
		react: {
			text: '🕒',
			key: m.key,
		}
	})
  m.react('🕒')
  try {
  let url = await fetch(`https://api.alyachan.dev/api/bing-image?q=${text}&apikey=${api.alya}`)
  const res1 = await url.json()
 let teks1 = `*B I N G - I M G*\n\n`
    teks1 += `  ∘  *Prompt* : ${text}`
  res1.data.map((v, i) => {
            conn.sendFile(m.chat, v.url, '', teks1, m)
        })
  } catch (e) {
    console.log(e)
    return m.reply('```STATUS:```' + e)
  }
}
handler.command = handler.help = ['bing-img','bingimg','bingimage'];
handler.tags = ['ai'];
handler.premium = true;
handler.limit = true;

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
        console.log(`🚀 Running ${'bingimg.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/bingimg.js" <input_argument>');
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
                        command: 'bingimg'
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
                    command: 'bingimg'
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
