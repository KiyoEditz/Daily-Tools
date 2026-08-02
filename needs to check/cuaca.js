/**
 * CLI Tool: cuaca.js
 * Converted from plugins/cuaca.js
 */

const readline = require('readline');

const fetch = require('node-fetch');

let handler = async (m, {
  text,
  usedPrefix,
  command
}) => {
  if (!text) {
    throw `Penggunaan:\n${usedPrefix + command} <teks>\n\nContoh:\n${usedPrefix + command} Jakarta`;
  }

  await m.reply(`${global.wait}`);
  let teksenc = encodeURIComponent(text);

  let res = await fetch(API('https://api.openweathermap.org', '/data/2.5/weather', {
    q: text,
    units: 'metric',
    appid: '060a6bcfa19809c2cd4d97a212b19273'
  }));

  if (!res.ok) {
    throw 'Lokasi tidak ditemukan';
  }

  let json = await res.json();

  if (json.cod != 200) {
    throw json;
  }

  let gustKmph = json.wind.gust * 3.6;

  let sunriseTime = json.sys.sunrise ? new Date(json.sys.sunrise * 1000).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }) : 'Tidak Tersedia';
  let sunsetTime = json.sys.sunset ? new Date(json.sys.sunset * 1000).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }) : 'Tidak Tersedia';
  let predictionTime = new Date(json.dt * 1000 + json.timezone * 1000).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta'
  });

  let groundLevelPressure = json.main.grnd_level !== undefined ? json.main.grnd_level + ' hPa' : 'Tidak Tersedia';
  let seaLevelPressure = json.main.sea_level !== undefined ? json.main.sea_level + ' hPa' : 'Tidak Tersedia';

  m.reply(`
🤩 Koordinat: ${json.coord.lat}, ${json.coord.lon} https://www.google.com/maps/place/${teksenc}/@${json.coord.lat},${json.coord.lon}
🌍 Lokasi: ${json.name}, ${json.sys.country}
🌦️ Cuaca: ${json.weather[0].description}, intinya: ${json.weather[0].main}
🌡️ Suhu saat ini: ${json.main.temp} °C
🔥 Suhu tertinggi: ${json.main.temp_max} °C
❄️ Suhu terendah: ${json.main.temp_min} °C
😊 Terasa seperti: ${json.main.feels_like} °C
💧 Kelembapan: ${json.main.humidity} %
💨 Angin: ${json.wind.speed} km/jam, ${json.wind.deg} derajat, guncangan ${gustKmph.toFixed(2)} km/jam
☔ Curah Hujan (1 Jam): ${json.rain ? json.rain['1h'] || 0 : 0} mm
☁ Persen Awan: ${json.clouds ? json.clouds.all || 0 : 0} %
🌬️ Tekanan (Udara): ${json.main.pressure} hPa
⛳ Tingkat Tanah: ${groundLevelPressure}
🌊 Tingkat Laut: ${seaLevelPressure}
👀 Jarak Pandang: ${json.visibility ? `${(json.visibility / 1000).toFixed(2)} km` : 'Tidak Tersedia'}
🔮 Prediksi di waktu: ${predictionTime} WIB
🌄 Waktu Sunrise: ${sunriseTime} WIB
🌅 Waktu Sunset: ${sunsetTime} WIB
    `.trim());
};

handler.help = ['cuaca'];
handler.tags = ['tools'];
handler.command = /^(cuaca|weather)$/i;

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
        console.log(`🚀 Running ${'cuaca.js'} CLI...`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/cuaca.js" <input_argument>');
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
                        command: 'cuaca'
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
                    command: 'cuaca'
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
