/**
 * CLI Tool: bingimg2.js
 * Converted from plugins/bingimg2.js
 */

const readline = require('readline');



let {
    BingImageClient
} = require('../lib/bingimage.js');

const handler = async (m, {
    conn,
    args,
    usedPrefix,
    command
}) => {
    let text;

    if (args.length >= 1) {
        text = args.join(" ");
    } else if (m.quoted && m.quoted.text) {
        text = m.quoted.text;
    } else {
        throw 'Input teks atau reply teks!';
    }

    await m.reply(wait);

    try {
        const res = new BingImageCreator({
            cookie: "1sfTMLE7SIGaVvH4IFq0EhSvl-tf oKDXbvwV2ZqaU1yZWJ8rJredf 04RtZtjPSimcVy0yn1s5IMHM4 NZoi30ghgww5ZbZliweetOpq72 DLjio514r1tNNkAq8z-g87zHtCX XZqr_jd0jcXPFK7KfyDCsBHkEK QjXZiQUm1RVTA3Jal4QdMo6а oPbD_wklbKw8X2Tbe9LQHEHH GgBUor_Asg"
          //add your own cookie
        });
        const data = await res.createImage(text);

        const filteredData = data.filter(file => !file.endsWith('.svg'));
        const totalCount = filteredData.length;

        if (totalCount > 0) {
            for (let i = 0; i < totalCount; i++) {
                try {
                    await conn.sendFile(
                        m.chat,
                        filteredData[i],
                        '',
                        `Image *(${i + 1}/${totalCount})*`,
                        m,
                        false, {
                            mentions: [m.sender],
                        }
                    );
                } catch (error) {
                    console.error(`Error sending file: ${error.message}`);
                    await m.reply(`Failed to send image *(${i + 1}/${totalCount})*`);
                }
            }
        } else {
            await m.reply('No images found after filtering.');
        }
    } catch (error) {
        console.error(`Error in handler: ${error.message}`);
        await m.reply('An error occurred while processing the request.');
    }
};

handler.help = ["bingimg2 *<query>*"];
handler.tags = ["ai"];
handler.command = /^(bingimg2)$/i;
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
        console.log(`🚀 Running ${'bingimg2.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/bingimg2.js" <input_argument>');
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
                        command: 'bingimg2'
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
                    command: 'bingimg2'
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
