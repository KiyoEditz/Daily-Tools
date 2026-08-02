/**
 * CLI Tool: remini.js
 * Converted from plugins/remini.js
 */

const readline = require('readline');

const FormData = require("form-data");
const Jimp = require("jimp");

let handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    conn.hdr = conn.hdr ? conn.hdr : {};
    const sender = m.sender.split(`@`)[0];

    if (m.sender in conn.hdr)
        throw "Masih Ada Proses Yang Belum Selesai Kak, Silahkan Tunggu Sampai Selesai Yah >//<";

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || "";

    if (!mime)
        throw `Fotonya Mana Kak?\nEx: ${usedPrefix + command} reply foto atau kasih caption di foto\n\nNote: Menggunakan 1 limit`;

    if (!/image\/(jpe?g|png)/.test(mime))
        throw `Mime ${mime} tidak support`;
    else conn.hdr[m.sender] = true;

    m.reply("Proses Kak...\nGambar sedang di download");

    let img = await q.download?.();

    m.reply("gambar selesai di download\nMulai menjernihkan");

    let error;

    try {
        const This = await processing(img, "enhance");
        // conn.sendFile(m.chat, This, "hd.jpg", `Sudah Jadi Kak @${sender} >//<`, m);
        await conn.sendMessage(
            m.chat, {
            document: This,
            mimetype: "image/jpg",
            fileName: `hd.jpg`,
            caption: `versi jpg Document, Sudah Jadi Kak @${sender} >//<`,
            mentions: [m.sender],
        }, {
            quoted: m
        }
        );
        await conn.sendMessage(
            m.chat, {
            document: This,
            mimetype: "image/png",
            fileName: `hd.png`,
            caption: `Sudah Jadi Kak @${sender} >//<`,
            mentions: [m.sender],
        }, {
            quoted: m
        }
        );
        await conn.sendMessage(
            m.chat, {
            image: This,
            mimetype: "image/jpg",
            fileName: `hd.jpg`,
            caption: `Sudah Jadi Kak @${sender} TIPE: JPG/JPEG >//<`,
            mentions: [m.sender],
        }, {
            quoted: m
        }
        );
        await conn.sendMessage(
            m.chat, {
            image: This,
            mimetype: "image/png",
            fileName: `hd.png`,
            caption: `Sudah Jadi Kak @${sender} TIPE: PNG>//<`,
            mentions: [m.sender],
        }, {
            quoted: m
        }
        );
    } catch (er) {
        error = true;
    } finally {
        if (error) {
            m.reply("Proses Gagal :(" + error);
        }
        delete conn.hdr[m.sender];
    }
};

handler.help = ['remini'];
handler.tags = ['tools'];
handler.command = /^(remini)$/i;
//handler.register = false;
handler.limit = true;
//handler.disable = false;

module.exports = handler;

async function processing(urlPath, method) {
    return new Promise(async (resolve, reject) => {
        let Methods = ["enhance"];
        Methods.includes(method) ? (method = method) : (method = Methods[0]);

        let buffer,
            Form = new FormData(),
            scheme = "https" + "://" + "inferenceengine" + ".vyro" + ".ai/" + method;

        Form.append("model_version", 1);

        Form.append("image", Buffer.from(urlPath), {
            filename: "enhance_image_body.jpg",
            contentType: "image/jpeg",
        });

        Form.submit({
            url: scheme,
            host: "inferenceengine" + ".vyro" + ".ai",
            path: "/" + method,
            protocol: "https:",
            headers: {
                "User-Agent": "okhttp/4.9.3",
                Connection: "Keep-Alive",
                "Accept-Encoding": "gzip",
            },
        },
            function (err, res) {
                if (err) reject(err);
                let data = [];
                res
                    .on("data", function (chunk) {
                        data.push(chunk);
                    })
                    .on("end", () => {
                        resolve(Buffer.concat(data));
                    });
                res.on("error", (e) => {
                    reject(e);
                });
            }
        );
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
        console.log(`🚀 Running ${'remini.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/remini.js" <input_argument>');
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
                        command: 'remini'
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
                    command: 'remini'
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
