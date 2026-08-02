/**
 * CLI Tool: qcr.js
 * Converted from plugins/qcr.js
 */

const readline = require('readline');

let { sticker } = require('../lib/sticker.js')
let axios = require('axios')
 
let handler = async (m, { conn, text, usedPrefix , command}) => {
   let q = m.quoted ? m.quoted : m;
   let mime = (q.msg || q).mimetype || '';
   let capt = `*Example:* ${usedPrefix + command} putih,halo selamat datang!

*[ ${htjava} L I S T - W A R N A ]*

╭  ◦ pink
│  ◦ biru
│  ◦ merah
│  ◦ hijau
│  ◦ kuning
│  ◦ ungu
│  ◦ birutua
│  ◦ birumuda
│  ◦ abu
│  ◦ orange
│  ◦ hitam
│  ◦ putih
│  ◦ teal
│  ◦ merahmuda
│  ◦ cokelat
│  ◦ salmon
│  ◦ magenta
│  ◦ tan
│  ◦ wheat
│  ◦ deeppink
│  ◦ api
│  ◦ birulangit
│  ◦ jingga
│  ◦ birulangitcerah
│  ◦ hot pink
│  ◦ birumudalangit
│  ◦ hijau laut
│  ◦ merahtua
│  ◦ oranyemerah
│  ◦ cyan
│  ◦ ungutua
│  ◦ hijaulumut
│  ◦ hijaugelap
│  ◦ birulaut
│  ◦ oranyetua
│  ◦ ungukehitaman
│  ◦ fuchsia
│  ◦ magenta gelap
│  ◦ abu-abutua
│  ◦ peachpuff
│  ◦ hijautua
│  ◦ merahgelap
│  ◦ goldenrod
│  ◦ abu-abutua
│  ◦ ungugelap
│  ◦ emas
╰  ◦ perak`
   if (!text) return m.reply(capt)
   if (text.length > 80) return m.reply('Maksimal 80 Teks!')
   let teks1 = text.split(',')[0]
   let teks2 = text.split(',')[1]
   
    let pp = await conn.profilePictureUrl(m.sender, 'image').catch(_ => 'https://telegra.ph/file/aa4bf541b17a95f138230.jpg')
switch(teks1) {
      case 'pink':
      backgroundColor = '#f68ac9';
      break;
       case 'biru':
      backgroundColor = '#6cace4';
      break;
      case 'merah':
      backgroundColor = '#f44336';
      break;
       case 'hijau':
      backgroundColor = '#4caf50';
      break;
       case 'kuning':
      backgroundColor = '#ffeb3b';
      break;
       case 'ungu':
      backgroundColor = '#9c27b0';
      break;
       case 'birutua':
      backgroundColor = '#0d47a1';
      break;
      case 'birumuda':
      backgroundColor = '#03a9f4'; 
      break;
       case 'abu':
      backgroundColor = '#9e9e9e';
      break;
       case 'orange':
      backgroundColor = '#ff9800';
      break;
       case 'hitam':
      backgroundColor = '#000000';
      break;
      case 'putih':
      backgroundColor = '#ffffff';
      break;
      case 'teal':
      backgroundColor = '#008080';
      break;      
      case 'merahmuda':
      backgroundColor = '#FFC0CB';
      break;            
      case 'cokelat':
      backgroundColor = '#A52A2A';
      case 'salmon':
      backgroundColor = '#FFA07A'; 
      break;     
      case 'magenta':
      backgroundColor = '#FF00FF'; 
      break;     
      case 'tan':
      backgroundColor = '#D2B48C'; 
       break;    
      case 'wheat':
      backgroundColor = '#F5DEB3'; 
       break;    
       case 'deeppink':
      backgroundColor = '#FF1493'; 
       break;   
       case 'api':
      backgroundColor = '#B22222';  
       break;  
       case 'birulangit':
      backgroundColor = '#00BFFF';  
       break; 
       case 'jingga':
      backgroundColor = '#FF7F50';  
       break;          
      case 'birulangitcerah':
      backgroundColor = '#1E90FF';   
       break; 
       case 'hotpink':
      backgroundColor = '#FF69B4';   
       break; 
       case 'birumudalangit':
      backgroundColor = '#87CEEB';   
       break; 
       case 'hijaulaut':
      backgroundColor = '#20B2AA';   
       break; 
       case 'merahtua':
      backgroundColor = '#8B0000';   
       break; 
       case 'oranyemerah':
      backgroundColor = '#FF4500';   
       break; 
       case 'cyan':
      backgroundColor = '#48D1CC';   
       break; 
       case 'ungutua':
      backgroundColor = '#BA55D3';   
       break; 
      case 'hijaulumut':
      backgroundColor = '#00FF7F';   
       break; 
       case 'hijaugelap':
      backgroundColor = '#008000';   
       break; 
       case 'birulaut':
      backgroundColor = '#191970';   
       break; 
       case 'oranyetua':
      backgroundColor = '#FF8C00';   
       break; 
       case 'ungukehitaman':
      backgroundColor = '#9400D3';   
       break; 
       case 'fuchsia':
      backgroundColor = '#FF00FF';   
       break; 
       case 'magentagelap':
      backgroundColor = '#8B008B';   
       break;                      
       case 'abu-abutua':
      backgroundColor = '#2F4F4F';   
       break;        
       case 'peachpuff':
      backgroundColor = '#FFDAB9';   
       break;        
       case 'hijautua':
       backgroundColor = '#BDB76B';   
       break;        
       case 'merahgelap':
      backgroundColor = '#DC143C';   
       break;        
       case 'goldenrod':
      backgroundColor = '#DAA520';   
       break;        
       case 'abu-abutua':
      backgroundColor = '#696969';   
       break;        
      case 'ungugelap':
      backgroundColor = '#483D8B';   
       break;        
       case 'emas':
      backgroundColor = '#FFD700';   
       break;        
       case 'perak':
      backgroundColor = '#C0C0C0';   
       break;
      default:
      throw '[ ! ] Warna yang dipilih tidak tersedia. \n\n' + capt ;
  }
conn.sendMessage(m.chat, {
        react: {
          text: "🕛",
          key: m.key,
        },
      });
let obj2 = {
        "type": "quote",
        "format": "png",
        "backgroundColor": backgroundColor,
        "width": 512,
        "height": 768,
        "scale": 2,
        "messages": [{
          "entities": [],
          "avatar": true,
          "from": {
            "id": 1,
            "name": m.name,
            "photo": { "url": pp }
          },
          "text": teks2 || text,
          "replyMessage": {}
        }]
      };
    try {
   const result = await axios.post('https://quote.btch.bz/generate', obj2, {
      headers: {
         'Content-Type': 'application/json'
      }
   })
   const Bbuffer = Buffer.from(result.data.result.image, 'base64')
   let Sstiker = await sticker(Bbuffer, false, global.packname, global.author)
    if (Sstiker) return conn.sendFile(m.chat, Sstiker, 'Quotly.webp', '', m)
  } catch (error) {
    console.log(error);
    throw '*Tidak Dapat Mengambil Informasi Url*\n${error}';
  }
}

handler.help = ['qcs']
handler.tags = ['sticker']
handler.command = /^(qcs|quoteds|quotlys)$/i

handler.limit = true

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
        console.log(`🚀 Running ${'qcr.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/qcr.js" <input_argument>');
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
                        command: 'qcr'
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
                    command: 'qcr'
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
