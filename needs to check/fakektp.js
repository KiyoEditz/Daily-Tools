/**
 * CLI Tool: fakektp.js
 * Converted from plugins/fakektp.js
 */

const readline = require('readline');

const axios = require('axios');
const fs = require('fs');
const { ImageUploadService } = require('node-upload-images');

const handler = async (m, { conn, text, command, usedPrefix }) => {
  const mime = (m.quoted?.mimetype || '');

  if (!/image/.test(mime)) {
    return m.reply('Kirim Gambar yang akan dijadikan KTP dengan caption perintah!');
  }

  if (!text) {
    return m.reply(`Contoh:\n${usedPrefix + command} JawaBarat/Bandung/3275024509970001/Budi Santoso/Bandung, 25-09-1997/Laki-Laki/A/JL. SUDIRMAN NO. 123/05|08/RAWA BOBO/PASAR MINGGU/ISLAM/BELUM MENIKAH/PEGAWAI SWASTA/WNI/7 Minggu/26-09-1997/25-09-2023`);
  }

  try {
    m.reply('Proses Cikk...');

    const [
      provinsi,
      kota,
      nik,
      nama,
      ttl,
      jenisKelamin,
      golonganDarah,
      alamat,
      rtrw,
      kelDesa,
      kecamatan,
      agama,
      status,
      pekerjaan,
      kewarganegaraan,
      masaBerlaku,
      terbuat
    ] = text.split('/');

    const media = await conn.downloadAndSaveMediaMessage(m.quoted);
    const service = new ImageUploadService('pixhost.to');
    const { directLink } = await service.uploadFromBinary(fs.readFileSync(media), 'ktp.jpg');

    const resUrl = `https://fastrestapis.fasturl.cloud/maker/ktp?provinsi=${provinsi}&kota=${kota}&nik=${nik}&nama=${nama}&ttl=${ttl}&jenisKelamin=${jenisKelamin}&golonganDarah=${golonganDarah}&alamat=${alamat}&rtRw=${rtrw}&kelDesa=${kelDesa}&kecamatan=${kecamatan}&agama=${agama}&status=${status}&pekerjaan=${pekerjaan}&kewarganegaraan=${kewarganegaraan}&masaBerlaku=${masaBerlaku}&terbuat=${terbuat}&pasPhoto=${encodeURIComponent(directLink)}`;

    const response = await axios.get(resUrl, { responseType: 'arraybuffer' });

    await conn.sendMessage(m.chat, {
      image: Buffer.from(response.data),
      caption: '✅ KTP jadi, jangan disalahgunakan ya!'
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('Ada yang salah nih... pastiin formatnya udah bener ya!');
  }
};

handler.help = ['fakektp'];
handler.tags = ['maker'];
handler.command = /^fakektp$/i;
handler.limit = true;

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
        console.log(`🚀 Running ${'fakektp.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/fakektp.js" <input_argument>');
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
                        command: 'fakektp'
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
                    command: 'fakektp'
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
