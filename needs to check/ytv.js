/**
 * CLI Tool: ytv.js
 * Converted from plugins/ytv.js
 */

const readline = require('readline');

/*
let limit = 30
let fetch = require('node-fetch')
const { youtubedl } = require('@bochilteam/scraper')
const q = ['144', '240', '360', '480', '720', '1080']
const { ytIdRegex } = require('../lib/y2mate')

let handler = async (m, { conn, args, isPrems, isOwner, usedPrefix, command }) => {
  if (!args[0] || !ytIdRegex.test(args[0])) throw `
Ketik ${usedPrefix + command} link/url resolusi[144, 240, 360, 480, 720, 1080]
  
Contoh
${usedPrefix + command} https://youtu.be/yoururl 480`.trim()

  let kasihtau
  if (!args[1]) {
    args[1] = '360'
    kasihtau = true
  }
  if (!q.includes(args[1])) throw 'Kualitas tidak ditemukan\nKualitas tersedia\n' + q.map(v => v).join(', ')
  let user = global.db.data.users[m.sender]
  let kualitas = (args[1] || '360').toLowerCase().replace(/[a-z]/i, '') + 'p'
  let yt = await youtubedl(args[0])
  let { title, thumbnail } = yt
  let { fileSize, fileSizeH, download } = yt.video[kualitas]
  let isLimit = (isPrems || isOwner ? 99 : limit) * 1024 < fileSize
  let dl = await download()
  conn.reply(m.chat, `
${isLimit ? `
*Source:* ${args[0]}
*Ukuran File:* ${fileSizeH}
_File terlalu besar, Download langsung dengan browser sekali klik menggunakan link:_ $${dl.toString()}` : '_Sedang proses mengirim..._\n_Mohon tunggu sebentar jangan spam desu_ ^_^'}
`.trim(), {
    key: { remoteJid: 'status@broadcast', participant: '0@s.whatsapp.net', fromMe: false }, message: {
      "imageMessage": {
        "mimetype": "image/jpeg", "caption": `
*Judul:* ${title}
`.trim(),
        "jpegThumbnail": await (await fetch(thumbnail)).buffer()
      }
    }
  })
  let _thumb = {}
  try { _thumb = { thumbnail: await (await fetch(thumbnail)).buffer() } }
  catch (e) { }
  if (!isLimit) await conn.sendFile(m.chat, dl, title + '.mp4', `
*Title:* ${title}
*Filesize:* ${fileSizeH}
`.trim(), m, false, {
    ..._thumb,
    asDocument: user.useDocument
  })
  if (kasihtau) m.reply(`Ingin memilih resolusinya?? ketik *${usedPrefix + command} <link> <144/240,360,480,720>*`)
}
handler.help = ['mp4', ''].map(v => 'yt' + v + ` <link> [quality: 144, 240, 360, 480, 720, 1080]`)
handler.tags = ['downloader']
handler.command = /^y(ou)?t(ube)?(v|mp4)?$/i
handler.owner = false
handler.mods = false
handler.premium = false
handler.group = false
handler.private = false

handler.admin = false
handler.botAdmin = false

handler.fail = null
handler.exp = 0
handler.limit = true

module.exports = handler
*/
const axios = require('axios');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) throw `Masukan URL!\n\ncontoh:\n${usedPrefix + command} https://youtu.be/4rDOsvzTicY?si=3Ps-SJyRGzMa83QT`;    
  
        if (!text) throw 'masukan link youtube';   
        m.reply(wait);   
    try {
        const response = await axios.get(`https://api.betabotz.eu.org/api/download/ytmp4?url=${text}&apikey=Btz-KiyoEditz`);        
        const res = response.data.result;      
        var { mp4, id, title, source, duration, thumb } = res;
        let capt = `╭──── 〔YTMP4〕 ─⬣\n`;
        capt += ` ⬡ *id* : ${id}\n`;
        capt += ` ⬡  *tittle* : ${title}\n`;
        capt += ` ⬡  *source* : ${source}\n`;
        capt += ` ⬡  *duration* : ${duration}\n`;
        capt += `╰────────⬣\n`;    
        await conn.sendMessage(m.chat, { 
        image: { url: thumb }, 
        caption: capt
    }, { quoted: m });
        // await conn.sendFile(m.chat, mp4, null, capt, m);
        await conn.sendMessage(m.chat, { 
            document: { url: mp4 }, 
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`
        }, { quoted: m });
    } catch (e) {
    console.log(e);
    m.reply(`*Error:* ${e.message}`);
    m.reply(`*Mencoba matode lain!...*`);
    try {
      const response = await axios.get(`https://ab-ytdlv2.abrahamdw882.workers.dev/?url=${text}&&format=720`);        
        const res = response.data.data;      
        var { downloadUrl, id, title, image } = res;
        let capt = `╭──── 〔YTMP4〕 ─⬣\n`;
        capt += ` ⬡ *id* : ${id}\n`;
        capt += ` ⬡  *tittle* : ${title}\n`;
        capt += ` ⬡  *source* : ${text}\n`;
        capt += ` ⬡  *duration* : null\n`;
        capt += `╰────────⬣\n`;    
        capt += `Ab.tech.api`;    
        await conn.sendMessage(m.chat, { 
        image: { url: image }, 
        caption: capt
    }, { quoted: m });
        // await conn.sendFile(m.chat, mp4, null, capt, m);
        await conn.sendMessage(m.chat, { 
            document: { url: downloadUrl }, 
            mimetype: 'video/mp4',
            fileName: `${title}.mp4`
        }, { quoted: m });
     } catch (e) {
         console.log(e);
    m.reply(`*Error:* ${e.message}`);
    m.reply(`*Semua metode gagal, harap lapor owner!...*`);
     }
    }
};
handler.help = ['ytmp4'];
handler.command = /^y(ou)?t(ube)?(v|mp4)?$/i
handler.tags = ['downloader'];
handler.limit = true;
handler.group = false;
handler.premium = false;
handler.owner = false;
handler.admin = false;
handler.botAdmin = false;
handler.fail = null;
handler.private = false;

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
        console.log(`🚀 Running ${'ytv.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/ytv.js" <input_argument>');
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
                        command: 'ytv'
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
                    command: 'ytv'
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
