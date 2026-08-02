/**
 * CLI Tool: randomimage.js
 * Converted from plugins/randomimage.js
 */

const readline = require('readline');

const axios = require('axios');

let handler = async (m, { conn, command, usedPrefix }) => {
	try {
		command = command.toLowerCase();
		m.reply('_Sedang mencari..._');
		// Permintaan ke API Pinterest
		const response = await axios.get(`https://www.pinterest.com/resource/BaseSearchResource/get/`, {
			params: {
				source_url: `/search/pins/?q=${encodeURIComponent(command)}`,
				data: JSON.stringify({
					options: {
						isPrefetch: false,
						query: command,
						scope: 'pins',
						no_fetch_context_on_resource: false,
					},
					context: {},
				}),
				_: Date.now(),
			},
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			},
		});

		// Ambil hasil pencarian
		const results = response.data.resource_response?.data?.results || [];
		if (results.length === 0) {
			throw `Tidak ada gambar yang ditemukan untuk "${command}".`;
		}

		// Ambil URL gambar
		const imageUrls = results.map(v => v.images?.orig?.url).filter(url => url);
		if (imageUrls.length === 0) {
			throw `Gambar tidak ditemukan untuk "${command}".`;
		}

		// Pilih gambar secara acak
		let hasil = conn.pickRandom(imageUrls);
		await conn.sendFile(m.chat, hasil, 'img.jpg', '', m);
	} catch (error) {
		m.reply(`Terjadi kesalahan: ${error.message || error}`);
	}
};

handler.help = handler.command = ['bts', 'exo', 'husbu', 'loli'];
handler.tags = ['imagerandom'];

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
        console.log(`🚀 Running ${'randomimage.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/randomimage.js" <input_argument>');
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
                        command: 'randomimage'
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
                    command: 'randomimage'
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
