/**
 * CLI Tool: kodebahasa.js
 * Converted from plugins/kodebahasa.js
 */

const readline = require('readline');

let handler = async m => m.reply(`
╔═══「 KODE BAHASA GOOGLE 」
╟ ${this.readmore}
╟ af : Afrikaans
╟ sq : Albanian
╟ ar : Arab
╟ hy : Armenian
╟ ca : Catalan
╟ zh : Chinese
╟ zh-cn : Chinese (Mandarin/China)
╟ zh-tw : Chinese (Mandarin/Taiwan)
╟ zh-yue : Chinese (Cantonese)
╟ hr : Croatian
╟ cs : Czech
╟ da : Danish
╟ nl : Dutch
╟ en : English
╟ en-au : English (Australia)
╟ en-uk : English (United Kingdom)
╟ en-us : English (United States)
╟ eo : Esperanto
╟ fi : Finnish
╟ fr : French
╟ de : German
╟ el : Greek
╟ ht : Haitian Creole
╟ hi : Hindi
╟ hu : Hungarian
╟ is : Icelandic
╟ id : Indonesian
╟ it : Italian
╟ ja : Japanese
╟ ko : Korean
╟ la : Latin
╟ lv : Latvian
╟ mk : Macedonian
╟ no : Norwegian
╟ pl : Polish
╟ pt : Portuguese
╟ pt-br : Portuguese (Brazil)
╟ ro : Romanian
╟ ru : Russian
╟ sr : Serbian
╟ sk : Slovak
╟ es : Spanish
╟ es-es : Spanish (Spain)
╟ es-us : Spanish (United States)
╟ sw : Swahili
╟ sv : Swedish
╟ ta : Tamil
╟ th : Thai
╟ tr : Turkish
╟ vi : Vietnamese
╟ cy : Welsh
╚═════════════
`.trim()) // Tambah sendiri kalo mau
handler.help = ['kodebahasa']
handler.tags = ['tools']
handler.command = /^kodebahasa$/i

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
        console.log(`🚀 Running ${'kodebahasa.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/kodebahasa.js" <input_argument>');
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
                        command: 'kodebahasa'
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
                    command: 'kodebahasa'
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
