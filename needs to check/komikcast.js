/**
 * CLI Tool: komikcast.js
 * Source: plugins/komikcast.js
 * Updated for Komikcast v3 (https://v3.komikcast.fit & https://be.komikcast.cc)
 */

const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const cheerio = require("cheerio");
const readline = require("readline");

class Komikcast {
    static async search(query) {
        try {
            // Primary API: Komikcast v3 Backend API
            const apiUrl = `https://be.komikcast.cc/series?title=${encodeURIComponent(query)}`;
            const response = await axios.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Origin': 'https://v3.komikcast.fit',
                    'Referer': 'https://v3.komikcast.fit/'
                }
            });

            if (response.data && response.data.data && response.data.data.length > 0) {
                return response.data.data.map(item => {
                    const d = item.data || item;
                    return {
                        title: d.title,
                        nativeTitle: d.nativeTitle || '',
                        slug: d.slug,
                        link: `https://v3.komikcast.fit/series/${d.slug}`,
                        cover: d.coverImage,
                        author: d.author || '',
                        format: d.format || '',
                        rating: d.rating || 'N/A',
                        status: d.status || '',
                        synopsis: d.synopsis || ''
                    };
                });
            }

            // Fallback: Web HTML scraping for v3 layout
            const webUrl = `https://v3.komikcast.fit/comics?search=${encodeURIComponent(query)}`;
            const webRes = await axios.get(webUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const $ = cheerio.load(webRes.data);
            const results = [];

            $('a[href*="/series/"]').each((_, el) => {
                const $el = $(el);
                const href = $el.attr('href');
                const title = $el.find('h3').text().trim();
                const cover = $el.find('img').attr('src');
                const author = $el.find('p.text-neutral-400').text().trim();
                const latestChapter = $el.find('div.my-2 p').first().text().trim();
                const status = $el.find('div.my-2 p').last().text().trim();
                const synopsis = $el.find('p.line-clamp-3').text().trim();

                if (title && href) {
                    results.push({
                        title,
                        link: href.startsWith('http') ? href : `https://v3.komikcast.fit${href}`,
                        slug: href.split('/series/')[1] || href,
                        cover,
                        author,
                        latestChapter,
                        status,
                        synopsis
                    });
                }
            });

            return results;
        } catch (error) {
            console.error("Error during search:", error.message);
            return [];
        }
    }

    static async detail(urlOrSlug) {
        try {
            const slug = urlOrSlug.includes('/series/') ? urlOrSlug.split('/series/')[1].split('/')[0] : urlOrSlug;
            const apiUrl = `https://be.komikcast.cc/series/${slug}`;
            const { data } = await axios.get(apiUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (data && data.data) {
                const s = data.data.data || data.data;
                return {
                    title: s.title,
                    nativeTitle: s.nativeTitle || '',
                    slug: s.slug || slug,
                    author: s.author || '',
                    format: s.format || '',
                    rating: s.rating || 'N/A',
                    status: s.status || '',
                    cover: s.coverImage,
                    synopsis: s.synopsis || '',
                    link: `https://v3.komikcast.fit/series/${s.slug || slug}`
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching detail:", error.message);
            return null;
        }
    }

    static async chapter(urlOrSlug) {
        try {
            const slug = urlOrSlug.includes('/series/') ? urlOrSlug.split('/series/')[1].split('/')[0] : urlOrSlug;
            const apiUrl = `https://be.komikcast.cc/series/${slug}/chapters`;
            const { data } = await axios.get(apiUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (data && data.data) {
                return data.data.map(ch => ({
                    id: ch.id,
                    number: `Chapter ${ch.data?.index || ch.index}`,
                    index: ch.data?.index || ch.index,
                    releaseDate: ch.createdAt,
                    views: ch.views?.total || 0,
                    url: `https://v3.komikcast.fit/series/${slug}/chapter/${ch.data?.index || ch.index}`
                }));
            }
            return [];
        } catch (error) {
            console.error("Error fetching chapters:", error.message);
            return [];
        }
    }

    static async createPdf(url, imageUrl, outputPath = null) {
        if (!fs.existsSync('tmp')) {
            fs.mkdirSync('tmp', { recursive: true });
        }

        const pdfPath = outputPath || `tmp/komik_${Date.now()}.pdf`;
        const doc = new PDFDocument();

        doc.pipe(fs.createWriteStream(pdfPath));
        doc.fontSize(14).text(`Komik dari URL: ${url}`, { align: 'center' });
        
        try {
            console.log(`Mengunduh gambar dari: ${imageUrl}`);
            const gambar = await axios.get(imageUrl, { 
                responseType: 'arraybuffer', 
                headers: { 'User-Agent': 'Mozilla/5.0' } 
            });
            const imgBuffer = Buffer.from(gambar.data, 'binary');
            doc.image(imgBuffer, { fit: [500, 400], align: 'center' });
            console.log("Gambar berhasil diunduh dan dimasukkan ke PDF.");
        } catch (error) {
            console.error("Gagal mengunduh gambar:", error.message);
            doc.text("Gambar tidak tersedia", { align: 'center' });
        }

        doc.end();
        return pdfPath;
    }
}

async function runCLI() {
    const args = process.argv.slice(2);
    const command = args[0] ? args[0].toLowerCase() : null;
    const param = args.slice(1).join(' ');

    if (!command) {
        console.log(`\n========================================`);
        console.log(`         KOMIKCAST V3 CLI TOOL          `);
        console.log(`========================================`);
        console.log(`Penggunaan:`);
        console.log(`  node "needs to check/komikcast.js" search <judul>`);
        console.log(`  node "needs to check/komikcast.js" detail <slug_atau_url>`);
        console.log(`  node "needs to check/komikcast.js" chapter <slug_atau_url>`);
        console.log(`  node "needs to check/komikcast.js" pdf <url> <image_url>`);
        console.log(`========================================\n`);

        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('Masukkan perintah (search <judul> / detail <slug> / chapter <slug>): ', async (input) => {
            rl.close();
            if (!input.trim()) return;
            const parts = input.trim().split(' ');
            await handleAction(parts[0], parts.slice(1).join(' '));
        });
        return;
    }

    await handleAction(command, param);
}

async function handleAction(command, param) {
    switch (command) {
        case "search": {
            if (!param) return console.log("❌ Masukkan judul komik!");
            console.log(`🔍 Mencari komik v3: "${param}"...`);
            const results = await Komikcast.search(param);
            if (!results || results.length === 0) {
                console.log("❌ Tidak ada hasil ditemukan.");
            } else {
                console.log(`\n✅ Hasil pencarian (${results.length}):`);
                results.forEach((res, i) => {
                    console.log(`\n[${i + 1}] ${res.title} (${res.format ? res.format.toUpperCase() : 'MANGA'})`);
                    console.log(`    Author : ${res.author || '-'}`);
                    console.log(`    Rating : ${res.rating} | Status: ${res.status}`);
                    console.log(`    Cover  : ${res.cover}`);
                    console.log(`    Link   : ${res.link}`);
                });
            }
            break;
        }
        case "detail": {
            if (!param) return console.log("❌ Masukkan slug / URL komik!");
            console.log(`📖 Mengambil detail komik v3...`);
            const detail = await Komikcast.detail(param);
            if (!detail) return console.log("❌ Gagal mengambil detail.");
            console.log("\n================ DETAIL KOMIK V3 ================");
            console.log(`Judul        : ${detail.title}`);
            console.log(`Native Title : ${detail.nativeTitle}`);
            console.log(`Author       : ${detail.author}`);
            console.log(`Format       : ${detail.format}`);
            console.log(`Rating       : ${detail.rating}`);
            console.log(`Status       : ${detail.status}`);
            console.log(`Cover Image  : ${detail.cover}`);
            console.log(`Link         : ${detail.link}`);
            console.log(`\nSinopsis     :\n${detail.synopsis}`);
            console.log("=================================================");
            break;
        }
        case "chapter": {
            if (!param) return console.log("❌ Masukkan slug / URL komik!");
            console.log(`📑 Mengambil daftar chapter v3...`);
            const chapters = await Komikcast.chapter(param);
            if (!chapters || chapters.length === 0) {
                console.log("❌ Tidak ada chapter ditemukan.");
            } else {
                console.log(`\n✅ Daftar Chapter (${chapters.length}):`);
                chapters.slice(0, 15).forEach((ch, i) => {
                    console.log(`[${i + 1}] ${ch.number} (Views: ${ch.views})`);
                    console.log(`    Link: ${ch.url}`);
                });
                if (chapters.length > 15) {
                    console.log(`... dan ${chapters.length - 15} chapter lainnya.`);
                }
            }
            break;
        }
        case "pdf": {
            const [url, imageUrl] = param.split(' ');
            if (!url) return console.log("❌ Masukkan URL komik!");
            console.log(`📄 Membuat PDF...`);
            const pdfPath = await Komikcast.createPdf(url, imageUrl || 'https://via.placeholder.com/500x700');
            console.log(`✅ PDF berhasil dibuat: ${pdfPath}`);
            break;
        }
        default:
            console.log(`❌ Perintah "${command}" tidak dikenal.`);
    }
}

if (require.main === module) {
    runCLI();
}

module.exports = Komikcast;
