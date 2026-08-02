/**
 * CLI Tool: txt2img.js
 * Converted from plugins/txt2img.js
 */

const readline = require('readline');

/* 
[Txt2img by Flux]
Saluran : https://whatsapp.com/channel/0029VaNR2B6BadmioY6mar3N
*/

const handler = async (m, { conn, usedPrefix, command, text, isOwner, isAdmin, isBotAdmin, isPrems, chatUpdate }) => {
    if (!text) throw `*\u2022 Contoh :* ${usedPrefix + command} *[prompt]*`;
    m.reply(wait);
    
    const data = await flux({
      prompt: text,
    });
    
    for (const i of data.data.images) {
      await conn.sendMessage(
        m.chat,
        {
          image: { url: i },
          caption: `*\u2022 Prompt :* ${text}`,
        },
        {
          quoted: m,
        },
      );
    }
  };
  
  handler.help = ["flux [Prompt]"];
  handler.tags = ["ai"];
  handler.command = ["flux"];
  
  module.exports = handler;
  
  async function flux(options) {
    try {
      options = {
        prompt: options?.prompt,
        seed: options?.seed || Math.floor(Math.random() * 2147483647) + 1,
        random_seed: options?.random_seed ?? true,
        width: options?.width ?? 512,
        height: options?.height ?? 512,
        steps: options?.steps ?? 8,
      };
    
      if (!options.prompt) {
        return {
          status: false,
          message: "undefined reading prompt!",
        };
      }
      
      const session_hash = string(11);
      
      const joinResponse = await fetch("https://black-forest-labs-flux-1-schnell.hf.space/queue/join", {
        method: "POST",
        headers: {
          authority: "black-forest-labs-flux-1-schnell.hf.space",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            options.prompt,
            options.seed,
            options.random_seed,
            options.width,
            options.height,
            options.steps,
          ],
          event_data: null,
          fn_index: 2,
          trigger_id: 5,
          session_hash: session_hash,
        }),
      });
      
      if (!joinResponse.ok) throw new Error("Failed to join queue");
      
      const dataResponse = await fetch(`https://black-forest-labs-flux-1-schnell.hf.space/queue/data?session_hash=${session_hash}`, {
        headers: {
          authority: "black-forest-labs-flux-1-schnell.hf.space",
        },
      });
      
      if (!dataResponse.ok) throw new Error("Failed to retrieve data");
      
      const rawData = await dataResponse.text();
      const lines = rawData.split("\n");
      const jsonObjects = [];
      
      lines.forEach((line) => {
        if (line.startsWith("data: ")) {
          try {
            const jsonString = line.substring(6).trim();
            const jsonObject = JSON.parse(jsonString);
            jsonObjects.push(jsonObject);
          } catch (error) {
            throw new Error("Failed to parse JSON");
          }
        }
      });
      
      const result = jsonObjects.find((d) => d.msg === "process_completed") || {};
      
      if (!result?.success) {
        return {
          status: false,
          message: result,
        };
      }
      
      const images = result.output.data
        .filter((d) => typeof d === "object")
        .map((d) => d.url);
      
      return {
        status: true,
        data: { images: images },
      };
    } catch (e) {
      return {
        status: false,
        message: e.message,
      };
    }
  }
  
  function string(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
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
        console.log(`🚀 Running ${'txt2img.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/txt2img.js" <input_argument>');
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
                        command: 'txt2img'
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
                    command: 'txt2img'
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
