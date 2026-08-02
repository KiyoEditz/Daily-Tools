/**
 * CLI Tool: steam.js
 * Converted from plugins/steam.js
 */

const readline = require('readline');

const { steam } = require('../lib/steam');

let { default: makeWASocket, BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, downloadContentFromMessage, downloadHistory, proto, getMessage, generateWAMessageContent, prepareWAMessageMedia } = require('@adiwajshing/baileys');
let handler = async(m, { conn, command, text, args }) => {
  if (!text) {
    throw `Masukkan judul yang ingin di cari!\n\nContoh:\n${usedPrefix}${command} miside`;
  }

  try {
    conn.reply(m.chat, `_Sedang memproses, harap tunggu..._\n*Mohon matikan auto download pada WhatsApp.*\n*File trailers yang di kirim bot berukuran besar*`, m);

    // Mengambil respons dari scraper 
    const response = await steam(text);
    var { id, name, description, screenshots, trailers, price, developers, genres, release, url } = response;
     //deskripsi = description.replace(/[^\S\r\n]+/g, '');
        let capt = `╭──── 〔STEAM〕 ─⬣\n`;
        capt += ` ⬡ *Title* : ${name}\n`;
        capt += ` ⬡ *ID* : ${id}\n`;
        capt += ` ⬡ *Genre* : ${genres}\n`;
        capt += ` ⬡  *Price* : ${price}\n`;
        capt += ` ⬡ *Release* : ${release}\n`;
        capt += ` ⬡  *Developers* : ${developers}\n`;
        capt += ` ⬡  *Url* : ${url}\n`;
        capt += `╰────────⬣\n`;  
        capt += ` ⬡  ${description}\n`;  
        await conn.sendMessage(m.chat, { 
        image: { url: trailers[0].mp4 }, 
        caption: capt
    }, { quoted: m });
    let ult = screenshots.splice(0, screenshots.length);
    let i = 1;
    let cards = [];

    for (let pus of ult) {
      cards.push({
      body: proto.Message.InteractiveMessage.Body.fromObject({
        text: `Screenshots ke - ${i++}`
      }),
      footer: proto.Message.InteractiveMessage.Footer.fromObject({
        text: name 
      }),
      header: proto.Message.InteractiveMessage.Header.fromObject({
        title: '</> Steam </>\n',
        hasMediaAttachment: true,
        imageMessage: await createImage(pus)
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
        buttons: [
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text:"Source",
              url:"${url}",
              merchant_url:"${url}"
              })
          }
        ]
      })
    });
  }
  
  const bot = generateWAMessageFromContent(m.chat, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
          body: proto.Message.InteractiveMessage.Body.create({
            text: null
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({
            text: namebot
          }),
          header: proto.Message.InteractiveMessage.Header.create({
            hasMediaAttachment: false
          }),
          carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
            cards: [
              ...cards
            ]
          })
        })
      }
    }
  }, {});
  
  await conn.relayMessage(m.chat, bot.message, {
    messageId: bot.key.id
  });
  } catch (e) {
    throw `Error: ${e.message || e}`;
  }
};

handler.help = ['steam'];
handler.command = /^(steam)$/i;
handler.tags = ['search','tools'];
handler.premium = false;
handler.limit = true;
module.exports = handler;

async function createImage(url) {
    const { imageMessage } = await generateWAMessageContent({
      image: {
        url
      }
    }, {
      upload: conn.waUploadToServer
    });
    return imageMessage;
  }

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
        console.log(`🚀 Running ${'steam.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/steam.js" <input_argument>');
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
                        command: 'steam'
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
                    command: 'steam'
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
