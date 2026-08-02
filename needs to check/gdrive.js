/**
 * CLI Tool: gdrive.js
 * Converted from plugins/gdrive.js
 */

const readline = require('readline');

const axios = require('axios')
const { writeFileSync } = require('fs')
const { tmpdir } = require('os')
const path = require('path')

let handler = async (m, { args, usedPrefix, command, conn }) => {
  const url = args[0]
  if (!url) throw `Contoh: ${usedPrefix + command} https://drive.google.com/file/d/xxxxxxxxx/view`

  const fileId = await extractGDrive(url)
  if (!fileId) throw 'URL Google Drive tidak valid!'

  try {
    const apiKey = 'AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU'
    const metaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType&key=${apiKey}`
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`

    const metadata = await axios.get(metaUrl)
    const { name, size, mimeType } = metadata.data

    m.reply(`Mendownload file...\n\n• Nama: ${name}\n• Ukuran: ${await formatSize(size)}\n• Tipe: ${mimeType}`)

    const res = await axios.get(downloadUrl, { responseType: 'arraybuffer' })

    if (res.status !== 200) {
      throw `Gagal mengunduh file: ${res.status} ${res.statusText}`
    }

    const buffer = Buffer.from(res.data, 'binary')
    const tmpPath = path.join(tmpdir(), name)
    writeFileSync(tmpPath, buffer)

    await conn.sendMessage(m.chat, {
      document: { url: tmpPath },
      fileName: name,
      mimetype: mimeType || 'application/octet-stream',
      caption: `File berhasil diunduh!\n\n• Nama: ${name}\n• Ukuran: ${await formatSize(size)}`
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    throw typeof err === 'string' ? err : `Terjadi kesalahan: ${err.response?.status} ${err.response?.statusText}`
  }
}

handler.help = ['gdrive <url>']
handler.tags = ['downloader']
handler.command = /^gdrive$/i

module.exports = handler

async function extractGDrive(url) {
  const match = url.match(/\/d\/([^/]+)|open\?id=([^&]+)/)
  return match ? (match[1] || match[2]) : null
}

async function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
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
        console.log(`🚀 Running ${'gdrive.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/gdrive.js" <input_argument>');
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
                        command: 'gdrive'
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
                    command: 'gdrive'
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
