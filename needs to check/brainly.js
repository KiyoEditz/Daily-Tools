/**
 * CLI Tool: brainly.js
 * Converted from plugins/brainly.js
 */

const readline = require('readline');

const fetch = require('node-fetch')
let handler = async (m, {
 text, 
 usedPrefix, 
 command
 }) => {
    
if (!text) throw m.reply(`Masukkan textnya!\n\n*Contoh:* .brainly 5 dikali 5`)
try {
  var apii2 = await fetch(`https://mfarels.my.id/api/brainly?q=${text}`)
  var js2 = await apii2.json()
  m.reply(js2.result)
} catch(e) {
  try {
    var apii = await fetch(`https://mfarels.my.id/api/brainly?q=${text}`)
    var js = await apii.json()
    m.reply(js.data.data)
  } catch(e) {
    m.reply('Error: Server down!')
  }
}
}      
/*const baileys = require('@adiwajshing/baileys')
const { Brainly } = require('brainly-scraper-v2')
const fetch = require('node-fetch')
let brainly = new Brainly('id')

let handler = async (m, { conn, text }) => {
  if (!text) throw 'Input Query'
  let res = await brainly.search(text, 'id').catch(() => null)
  console.log(res)
  if (res) {
    let answer = res.map(({ question, answers }, i) => `
            *Pertanyaan*${question.grade ? ` (${question.grade})` : ''}\n${question.content}${answers.map((v, i) => `
            *Jawaban Ke ${i + 1}*${v.verification ? ' (Verified)' : ''}${v.isBest ? ' (Best)' : ''}
            ${v.content}${v.attachments.length > 0 ? `\n*Media Url*: ${v.attachments.join(', ')}` : ''}`).join``}`).join('\n' + '-'.repeat(45))
    m.reply(answer.trim())
  } else {
    let answer = await (await fetch(API('violetics', '/api/media/brainly', { query: text }, 'apikey'))).json()
    answer = answer.result
    if (!answer.length) throw 'Not found'
    for (let x = 0; x < answer.length; x++) {
      await m.reply(`*${answer[x].pertanyaan}*\n_${answer[x].source}_\n${answer[x].jawaban}`)
      await baileys.delay(2000)
    }
  }
}*/
handler.help = ['brainly <soal>']
handler.tags = ['belajar']

handler.command = /^brainly$/i

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
        console.log(`🚀 Running ${'brainly.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/brainly.js" <input_argument>');
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
                        command: 'brainly'
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
                    command: 'brainly'
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
