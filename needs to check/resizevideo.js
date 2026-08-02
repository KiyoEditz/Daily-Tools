/**
 * CLI Tool: resizevideo.js
 * Converted from plugins/resizevideo.js
 */

const readline = require('readline');

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { tmpdir } = require("os");
const { fromBuffer } = require("file-type");
const axios = require("axios");

let handler = async (m, { conn, usedPrefix, command, args }) => {
    conn.hdr = conn.hdr || {};
    const sender = m.sender.split("@")[0];

    if (m.sender in conn.hdr)
        throw "Masih ada proses yang belum selesai kak >//<";

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || "";
    let url = "";

    if (args[0] && args[0].startsWith("http")) url = args[0];
    else if (/video/.test(mime)) url = "quoted";
    else throw `Videonya mana kak?\n\nContoh:\n${usedPrefix + command} 480p (reply video atau kirim link video)`;

    let resolution = args[0]?.match(/\d{3,4}p/)?.[0] || "480p";

    conn.hdr[m.sender] = true;
    m.reply("Sedang memproses video...");

    let inputBuffer;

    try {
        if (url === "quoted") {
            inputBuffer = await q.download();
        } else {
            let res = await axios.get(url, { responseType: "arraybuffer" });
            inputBuffer = Buffer.from(res.data);
        }

        const resized = await resizeVideo(inputBuffer, resolution);
        await conn.sendFile(m.chat, resized, `video_${resolution}.mp4`, `Sudah jadi kak @${sender} dengan resolusi ${resolution} >//<`, m);
    } catch (e) {
        console.error(e);
        m.reply("Gagal mengubah resolusi video.");
    } finally {
        delete conn.hdr[m.sender];
    }
};

handler.help = ['resizevideo <resolusi>'];
handler.tags = ['tools'];
handler.command = /^(resizevideo)$/i;
handler.limit = true;

module.exports = handler;

async function resizeVideo(buffer, resolution = "480p") {
    return new Promise(async (resolve, reject) => {
        let inputPath = path.join(tmpdir(), `${Date.now()}_input.mp4`);
        let outputPath = path.join(tmpdir(), `${Date.now()}_output.mp4`);
        fs.writeFileSync(inputPath, buffer);

        let scale;
        switch (resolution) {
            case "1080p": scale = "1920:1080"; break;
            case "720p": scale = "1280:720"; break;
            case "480p": scale = "854:480"; break;
            case "360p": scale = "640:360"; break;
            default: scale = "854:480"; break;
        }

        const ffmpeg = spawn("ffmpeg", [
            "-i", inputPath,
            "-vf", `scale=${scale}`,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "28",
            "-y", outputPath
        ]);

        ffmpeg.stderr.on("data", data => console.log("ffmpeg:", data.toString()));

        ffmpeg.on("close", () => {
            let out = fs.readFileSync(outputPath);
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
            resolve(out);
        });

        ffmpeg.on("error", err => {
            reject(err);
        });
    });
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
        console.log(`🚀 Running ${'resizevideo.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/resizevideo.js" <input_argument>');
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
                        command: 'resizevideo'
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
                    command: 'resizevideo'
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
