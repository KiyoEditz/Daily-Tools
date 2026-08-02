const axios = require('axios');
const cheerio = require('cheerio');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class NhentaiScraper {
    static getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        };
    }

    static async fetchOfficialApi(cleanCode) {
        try {
            const url = `https://nhentai.net/api/gallery/${cleanCode}`;
            const { data } = await axios.get(url, {
                headers: this.getHeaders(),
                timeout: 8000
            });

            if (data && data.media_id && Array.isArray(data.images?.pages)) {
                const extMap = { w: 'webp', j: 'jpg', p: 'png' };
                const pages = data.images.pages.map((p, i) => {
                    const ext = extMap[p.t] || 'jpg';
                    return `https://i.nhentai.net/galleries/${data.media_id}/${i + 1}.${ext}`;
                });

                const coverExt = extMap[data.images.cover?.t] || 'jpg';
                const cover = `https://t.nhentai.net/galleries/${data.media_id}/cover.${coverExt}`;

                const titleObj = data.title || {};
                const title = titleObj.english || titleObj.japanese || titleObj.pretty || `nhentai_${cleanCode}`;
                const tags = Array.isArray(data.tags) ? data.tags.map(t => t.name) : [];

                return {
                    id: data.id || cleanCode,
                    title,
                    tags,
                    num_pages: data.num_pages || pages.length,
                    images: {
                        pages,
                        cover,
                        thumbnail: cover.replace('cover', 'thumb')
                    },
                    source: 'Official API'
                };
            }
        } catch (err) {
            // Official API failed or gallery not found
        }
        return null;
    }

    static async fetchScraperFallback(cleanCode) {
        const baseUrls = [
            `https://nhentai.net/g/${cleanCode}`,
            `https://nhentai.xxx/g/${cleanCode}`,
            `https://nhentai.to/g/${cleanCode}`
        ];

        let html = '';
        let lastError = '';

        for (const url of baseUrls) {
            try {
                const { data } = await axios.get(url, {
                    headers: this.getHeaders(),
                    timeout: 10000
                });
                if (data && (data.includes('thumb-container') || data.includes('JSON.parse') || data.includes('container'))) {
                    html = data;
                    break;
                }
            } catch (err) {
                lastError = err.message;
            }
        }

        if (!html) {
            throw new Error(`Gagal mengakses gallery nhentai: ${lastError}`);
        }

        const match = html.match(/JSON\.parse\((['"`])(.+?)\1\)/);
        const $ = cheerio.load(html);
        let images = [];
        $('.thumb-container').each((i, el) => {
            let imgUrl = $(el).find('.lazyload').attr('data-src') || $(el).find('img').attr('src') || '';
            if (imgUrl) {
                imgUrl = imgUrl
                    .replace('https://t', 'https://i')
                    .replace((i + 1) + 't', (i + 1));
                images.push(imgUrl);
            }
        });

        let extractedTitle = '';
        if (match) {
            let jsonStr = match[2]
                .replace(/\\"/g, '"')
                .replace(/\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)));

            let parsed = JSON.parse(jsonStr);
            if (parsed.title) {
                extractedTitle = parsed.title.english || parsed.title.japanese || parsed.title.pretty || '';
            }
        }

        if (!extractedTitle) {
            if ($('h1.title').length) {
                extractedTitle = $('h1.title').text().replace(/\s+/g, ' ').trim();
            } else if ($('#info h1').length) {
                extractedTitle = $('#info h1').text().replace(/\s+/g, ' ').trim();
            } else if ($('#info h2').length) {
                extractedTitle = $('#info h2').text().replace(/\s+/g, ' ').trim();
            } else if ($('meta[property="og:title"]').attr('content')) {
                extractedTitle = $('meta[property="og:title"]').attr('content').replace(/[\-\|»]\s*nHentai.*/i, '').trim();
            } else if ($('title').length) {
                extractedTitle = $('title').text().replace(/[\-\|»]\s*nHentai.*/i, '').trim();
            }
        }

        if (!extractedTitle || extractedTitle.toLowerCase() === 'nhentai') {
            extractedTitle = `nhentai_${cleanCode}`;
        }

        const cover = $('meta[itemprop="image"]').attr('content') || '';
        const tags = $('.tag-container .name, .tags .name, a.tag .name').map((_, el) => $(el).text().trim()).get();
        if (tags.length === 0) {
            $('.tag-container a, .tags a').each((_, el) => {
                const text = $(el).find('.name').text().trim() || $(el).text().replace(/\d+/g, '').trim();
                if (text) tags.push(text);
            });
        }

        return {
            id: cleanCode,
            title: extractedTitle,
            tags,
            num_pages: images.length,
            images: {
                pages: images,
                cover: cover,
                thumbnail: cover.replace('cover', 'thumb')
            },
            source: match ? 'HTML Scraper (Mirror)' : 'HTML Scraper (Fallback)'
        };
    }

    static async getDetail(code) {
        const cleanCode = code.replace(/\D/g, '');
        if (!cleanCode) return { success: false, data: null, error: 'Code / ID tidak valid.' };

        // 1. Coba Official API
        const apiData = await this.fetchOfficialApi(cleanCode);
        if (apiData) {
            return { success: true, data: apiData };
        }

        // 2. Fallback ke Scraper
        try {
            const scraperData = await this.fetchScraperFallback(cleanCode);
            return { success: true, data: scraperData };
        } catch (error) {
            return { success: false, data: null, error: error.message };
        }
    }

    static async downloadPDF(images, outputPath, options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!Array.isArray(images) || images.length === 0) {
                    return reject(new Error('Tidak ada halaman gambar untuk di-download.'));
                }

                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const writeStream = fs.createWriteStream(outputPath);
                doc.pipe(writeStream);

                for (let x = 0; x < images.length; x++) {
                    const imgUrl = images[x];
                    if (!imgUrl) continue;
                    try {
                        const response = await axios.get(imgUrl, {
                            responseType: 'arraybuffer',
                            headers: this.getHeaders(),
                            ...options
                        });
                        
                        let imgBuffer = Buffer.from(response.data);

                        try {
                            // Coba render langsung (JPEG / PNG)
                            doc.image(imgBuffer, 0, 0, { fit: [595.28, 841.89], align: 'center', valign: 'center' });
                        } catch (pdfKitErr) {
                            // Handler untuk WebP atau format gambar tidak didukung PDFKit: Convert ke PNG via Sharp
                            try {
                                const convertedPng = await sharp(imgBuffer).png().toBuffer();
                                doc.image(convertedPng, 0, 0, { fit: [595.28, 841.89], align: 'center', valign: 'center' });
                            } catch (sharpErr) {
                                console.error(`\n⚠️ Gagal mengkonversi format gambar halaman ${x + 1} (${imgUrl}): ${sharpErr.message}`);
                                continue;
                            }
                        }

                        if (x + 1 < images.length) doc.addPage();
                        if (process.stdout.isTTY) {
                            process.stdout.write(`\r📥 Mengunduh & memproses halaman ${x + 1}/${images.length}...`);
                        }
                    } catch (err) {
                        console.error(`\n⚠️ Gagal mengunduh halaman ${x + 1} (${imgUrl}): ${err.message}`);
                    }
                }

                doc.end();
                writeStream.on('finish', () => {
                    if (process.stdout.isTTY) process.stdout.write('\n');
                    resolve(outputPath);
                });
                writeStream.on('error', (err) => reject(err));
            } catch (error) {
                reject(error);
            }
        });
    }
}

// ==========================================
// LOGIKA COMMAND LINE INTERFACE (CLI)
// ==========================================
async function runCLI() {
    const args = process.argv.slice(2);
    let command = args[0];
    let query = args[1];

    if (!command) {
        console.log('💡 Cara Penggunaan:');
        console.log('   Download PDF : node nhentai.js pdf <code>');
        console.log('   Info Detail  : node nhentai.js info <code>');
        console.log('   Shortcut     : node nhentai.js <code> (Otomatis info & download PDF)');
        console.log('\nContoh:');
        console.log('   node nhentai.js 177013');
        return;
    }

    if (/^\d+$/.test(command) || command.includes('nhentai.net')) {
        query = command;
        command = 'all';
    }

    if (command === 'info') {
        if (!query) return console.log('❌ Masukkan kode nhentai.\nContoh: node nhentai.js info 177013');
        console.log(`🔍 Mengambil informasi dari kode: ${query}...\n`);
        const result = await NhentaiScraper.getDetail(query);

        if (result.success && result.data) {
            const d = result.data;
            console.log(`🆔 ID: ${d.id}`);
            console.log(`📖 Judul: ${d.title}`);
            console.log(`📄 Jumlah Halaman: ${d.num_pages}`);
            console.log(`📡 Sumber Data: ${d.source}`);
            console.log(`🏷️ Tags: ${Array.isArray(d.tags) ? d.tags.slice(0, 15).join(', ') : ''}`);
            console.log(`🖼️ Cover: ${d.images.cover}`);
        } else {
            console.log(`❌ Gagal mengambil detail: ${result.error}`);
        }
    } else if (command === 'pdf' || command === 'all') {
        if (!query) return console.log('❌ Masukkan kode nhentai.\nContoh: node nhentai.js pdf 177013');
        console.log(`🔍 Mengambil metadata dari kode: ${query}...`);
        const result = await NhentaiScraper.getDetail(query);

        if (!result.success || !result.data) {
            return console.log(`❌ Gagal mengambil metadata: ${result.error}`);
        }

        const d = result.data;
        console.log(`\n📖 Judul: ${d.title}`);
        console.log(`📄 Halaman: ${d.num_pages}`);
        console.log(`📡 Sumber: ${d.source}`);

        const sanitizeTitle = d.title.replace(/[\/\\?%*:|"<>]/g, '_').trim();
        const outputFilename = `${sanitizeTitle} (${d.id}).pdf`;
        const outputPath = path.join(process.cwd(), outputFilename);

        console.log(`\n🚀 Memulai pengunduhan & pembuatan PDF: "${outputFilename}"...`);
        try {
            await NhentaiScraper.downloadPDF(d.images.pages, outputPath);
            console.log(`✅ Sukses! File PDF disimpan di: ${outputPath}`);
        } catch (err) {
            console.log(`❌ Gagal mengunduh / membuat PDF: ${err.message}`);
        }
    } else {
        console.log('❌ Perintah tidak dikenal. Gunakan "node nhentai.js <code>"');
    }
}

module.exports = NhentaiScraper;

if (require.main === module) {
    runCLI();
}
