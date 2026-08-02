/**
 * CLI Tool: gemini2.js
 * Converted from plugins/gemini2.js
 */

const readline = require('readline');

const { UguuSe } = require("../lib/uploadImage");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCGycrkgySg3r0BcOi-BNQuQ1BBZUplbmc");
const geminiProModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const geminiFlashModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let text;
  if (args.length >= 1) {
    text = args.join(" ");
  } else if (m.quoted && m.quoted.text) {
    text = m.quoted.text;
  } else {
    return m.reply("• *Example:* .gemini selamat pagi");
  }

  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || "";
  
  try {
    if (!mime) {
      const result = await geminiFlashModel.generateContent(text);
      const response = result.response.text();
      
      if (!response) throw new Error("Response tidak valid dari API");

      await conn.sendMessage(m.chat, {
        text: response,
        contextInfo: {
          externalAdReply: {
            title: 'GEMINI-PRO / VISION',
            thumbnailUrl: 'https://telegra.ph/file/4bae3d5130aabcbe94588.jpg',
            sourceUrl: 'https://gemini.google.com',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });
    } else {
      let media = await q.download();
      let isTele = /image\/(png|jpe?g)/.test(mime);
      let link = await UguuSe(media);
      
      const imageResp = await fetch(link.url).then(response => response.arrayBuffer());
      
      const imageBase64 = Buffer.from(imageResp).toString("base64");
      
      const mimeType = mime || "image/jpeg";
      
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      };
      
      const result = await geminiProModel.generateContent([imagePart, text]);
      const response = result.response.text();
      
      if (!response) throw new Error("Response tidak valid dari API");

      await conn.sendMessage(m.chat, {
        text: response,
        contextInfo: {
          externalAdReply: {
            title: 'GEMINI-PRO / VISION',
            thumbnailUrl: link,
            sourceUrl: 'https://gemini.google.com',
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });
    }
  } catch (e) {
    console.error(e);
    m.reply("Terjadi kesalahan saat memproses permintaan.");
  }
};

handler.help = ["gemini"].map(a => a + " *<text>*");
handler.tags = ["ai"];
handler.command = /^(gemini)$/i;
handler.limit = true;
handler.register = true;
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
        console.log(`🚀 Running ${'gemini2.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/gemini2.js" <input_argument>');
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
                        command: 'gemini2'
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
                    command: 'gemini2'
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
