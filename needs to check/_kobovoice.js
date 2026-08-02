/**
 * CLI Tool: _kobovoice.js
 * Converted from plugins/_kobovoice.js
 */

const readline = require('readline');

const WebSocket = require("ws");
const fs = require("fs");

let handler = async (m, { conn, usedPrefix, command }) => {
 let q = m.quoted ? m.quoted : m
 let mime = (q.msg || q).mimetype || ''
 if (/audio|video/.test(mime)) {
  let media = await q.download?.();
  m.reply(wait);
  let wss = "wss://yanzbotz-waifu-yanzbotz.hf.space/queue/join";

  function generateRandomLetters(length) {
   let result = "";
   const alphabetLength = 26;

   for (let i = 0; i < length; i++) {
    const randomValue = Math.floor(Math.random() * alphabetLength);
    const randomLetter = String.fromCharCode(
     "a".charCodeAt(0) + randomValue,
    );
    result += randomLetter;
   }

   return result;
  }

  const zeta = async (audio) => {
   return new Promise(async (resolve, reject) => {
    let name =
     Math.floor(Math.random() * 100000000000000000) +
     (await generateRandomLetters()) +
     ".mp4";
    let result = {};
    let send_has_payload = {
     fn_index: 0,
     session_hash: "xyuk2cf684b",
    };
    let send_data_payload = {
     fn_index: 0,
     data: [
      {
       data: "data:audio/mpeg;base64," + audio.toString("base64"),
       name: name,
      },
      10,
      "pm",
      0.6,
      false,
      "",
      "en-US-AnaNeural-Female",
     ],
     event_data: null,
     session_hash: "xyuk2cf684b",
    };
    const ws = new WebSocket(wss);
    ws.onopen = function () {
     console.log("Connected to websocket");
    };

    ws.onmessage = async function (event) {
     let message = JSON.parse(event.data);

     switch (message.msg) {
      case "send_hash":
       ws.send(JSON.stringify(send_has_payload));
       break;

      case "send_data":
       console.log("Processing your audio....");
       ws.send(JSON.stringify(send_data_payload));
       break;
      case "process_completed":
       result.base64 =
        "https://yanzbotz-waifu-yanzbotz.hf.space/file=" +
        message.output.data[1].name;
       break;
     }
    };

    ws.onclose = function (event) {
     if (event.code === 1000) {
      console.log("Process completed️");
     } else {
      conn.reply("Err : WebSocket Connection Error:\n");
     }
     resolve(result);
    };
   });
  };
  let abcd = await zeta(await media);

  conn.sendFile(m.chat, abcd.base64, "", "", m);
 } else
 m.reply(`video/audio with caption *${usedPrefix + command}*`)
};

handler.help = ["kobovoice *Reply video/audio*"];
handler.command = ["kobovoice"];
handler.tags = ["ai"];

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
        console.log(`🚀 Running ${'_kobovoice.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/_kobovoice.js" <input_argument>');
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
                        command: '_kobovoice'
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
                    command: '_kobovoice'
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
