/**
 * CLI Tool: removebg.js
 * Converted from plugins/removebg.js
 */

const readline = require('readline');

/*
Jangan Hapus Wm Bang 

*Remove Background,Remove Background HD Plugins CJS*

Ntah lah 

*[Sumber]*
https://whatsapp.com/channel/0029Vb3u2awADTOCXVsvia28

*[Sumber Scrape]*

https://whatsapp.com/channel/0029Vb5EZCjIiRotHCI1213L/189
*/

const axios = require('axios');
const FormData = require('form-data');

const clyrBg = {
  api: {
    base: "https://s5ash41h3g.execute-api.ap-south-1.amazonaws.com/default/api/v1/rmbg",
    endpoints: { predict: "/predict" }
  },

  headers: {
    'authority': 's5ash41h3g.execute-api.ap-south-1.amazonaws.com',
    'origin': 'https://clyrbg.com',
    'referer': 'https://clyrbg.com/',
    'user-agent': 'Postify/1.0.0'
  },

  getFileExt: (url) => {
    const extension = url.split('.').pop().toLowerCase();
    if (extension === 'webp') return 'webp';
    if (extension === 'jpg' || extension === 'jpeg') return 'jpeg';
    if (extension === 'png') return 'png';
    return 'png';
  },

  remove: async (img, isHD = false) => {
    try {
      const ex = clyrBg.getFileExt(img);      
      const response = await axios.get(img, { responseType: 'arraybuffer' });
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return {
          status: false,
          code: 400,
          result: { error: "Kagak bisa ngambil link hasil remove bgnya bree" }
        };
      }

      const b = Buffer.from(response.data, 'binary').toString('base64');
      const data = { file_extension: ex, image_bytes: b, hd: isHD };

      const result = await axios.post(
        `${clyrBg.api.base}${clyrBg.api.endpoints.predict}`,
        data,
        { headers: clyrBg.headers }
      );

      return {
        status: true,
        code: 200,
        result: {
          id: result.data.id,
          url: result.data.url,
          extension: ex,
          hd: isHD
        }
      };
    } catch (error) {
      return {
        status: false,
        code: error.response?.status || 500,
        result: {
          error: error.response?.data?.message || error.message
        }
      };
    }
  }
};

async function Uguu(buffer, filename) {
  try {
    const form = new FormData();
    form.append('files[]', buffer, { filename });

    const { data } = await axios.post('https://uguu.se/upload.php', form, {
      headers: form.getHeaders(),
    });

    if (data.files && data.files[0]) {
      return {
        name: data.files[0].name,
        url: data.files[0].url,
        size: data.files[0].size,
      };
    } else {
      throw new Error('Upload gagal.');
    }
  } catch (err) {
    throw `${err.message}`;
  }
}

const handler = async (m, { conn, command }) => {
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    if (!mime || !mime.startsWith('image/')) 
      throw '*Kirim Gambar Atau Kirim Url Gambar Yang Valid Yaa*';

    let media = await q.download();
    let ext = mime.split('/')[1];
    let filename = `upload.${ext}`;

    let uploaded = await Uguu(media, filename);
    let isHD = /hd/i.test(command);
    let removed = await clyrBg.remove(uploaded.url, isHD);

    if (!removed.status) throw removed.result.error;

    let { url, extension, hd, id } = removed.result;
    let resultBuffer = await axios.get(url, { responseType: 'arraybuffer' });

    let caption = `*Background Removed Successfully*\n\n• *Quality Image :* ${hd ? 'HD' : 'Standard'}\n• *Format :* ${extension.toUpperCase()}\n• *ID :* ${id}`;

    await conn.sendMessage(m.chat, {
      image: Buffer.from(resultBuffer.data, 'binary'),
      caption,
      mimetype: `image/${extension}`,
      fileName: `removed-bg.${extension}`
    }, { quoted: m });

  } catch (error) {
    await conn.sendMessage(m.chat, { text: `${error}` }, { quoted: m });
  }
};

handler.help = ['removebg', 'removebghd'];
handler.command = ['removebg', 'removebghd'];
handler.tags = ['tools'];

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
        console.log(`🚀 Running ${'removebg.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/removebg.js" <input_argument>');
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
                        command: 'removebg'
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
                    command: 'removebg'
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
