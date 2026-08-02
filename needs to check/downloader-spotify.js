/**
 * CLI Tool: downloader-spotify.js
 * Converted from plugins/downloader-spotify.js
 */

const readline = require('readline');

const { getInfo, spotifydl } = require("../lib/spotify");
const canvafy = require("canvafy");
let handler = async (m,{conn, text, usedPrefix, command}) => {
if (!text) throw `Masukan Link Spotify ‼️, *Example:* ${usedPrefix + command} https://open.spotify.com/tracks/xxxxxxxx`
    conn.sendMessage(m.chat, {
      react: {
        text: '🕒',
        key: m.key,
      }
    });
  try {
	let music = await spotifydl(text)

const info = await getInfo(text)

    let captionvid = `∘ Title: ${info.data.title}\n∘ Artist: ${info.data.artist.name}\n∘ ID: ${info.data.artist.id}\n\n${set.footer}`
const p = await new canvafy.Spotify()
            .setTitle(info.data.title)
            .setAuthor(htjava + " Spotify Downloader")
            .setTimestamp(40, 100)
            .setOverlayOpacity(0.8)
            .setBorder("#fff", 0.8)
            .setImage(info.data.thumbnail)
             .setBlur(3)
            .build();

       await conn.sendFile(m.chat, p, '', captionvid, m);
//conn.sendFile(m.chat, music.download, '', null, m, true)
    await conn.sendFile(m.chat, music.download, info.data.title + '.mp3', '', m, null, { asDocument: global.db.data.users[m.sender].useDocument});
} catch (e) {
    console.log(e)
    throw `Terjadi Kesalahan!\nCode: ${e}`
  }
}
handler.command = handler.help = ['spotify','spotifydl']
handler.tags = ['downloader']
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
        console.log(`🚀 Running ${'downloader-spotify.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/downloader-spotify.js" <input_argument>');
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
                        command: 'downloader-spotify'
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
                    command: 'downloader-spotify'
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
