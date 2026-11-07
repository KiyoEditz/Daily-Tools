const axios = require('axios');
const cheerio = require('cheerio');

class JustPasteScraper {
    static getHeaders() {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
        };
    }

    /**
     * Mengurai dan mengikuti pengalihan (redirect) link (misal: s.id -> justpaste.it)
     */
    static async resolveUrl(url) {
        try {
            const trimmedUrl = url.trim();

            // Jika URL adalah justpaste redirect internal
            if (trimmedUrl.includes('justpaste.it/redirect/')) {
                const encodedPart = trimmedUrl.split('/redirect/')[1]?.split('/')[1];
                if (encodedPart) {
                    return decodeURIComponent(encodedPart);
                }
            }

            const response = await axios.get(trimmedUrl, {
                headers: this.getHeaders(),
                maxRedirects: 10,
                validateStatus: status => status >= 200 && status < 400
            });

            return response.request?.res?.responseUrl || response.config?.url || trimmedUrl;
        } catch (error) {
            return url;
        }
    }

    /**
     * Mengambil dan mem-parsing isi halaman JustPaste.it
     */
    static async parse(targetUrl) {
        try {
            // Resolusi jika url berupa shortlink (seperti s.id)
            const finalUrl = await this.resolveUrl(targetUrl);

            const { data } = await axios.get(finalUrl, {
                headers: this.getHeaders()
            });

            const $ = cheerio.load(data);
            const title = $('h1').text().trim() || $('title').text().replace('- JustPaste.it', '').trim();

            // Ubah link <a> menjadi text biasa agar pemisahan baris mudah dideteksi
            $('#articleContent a').each((_, a) => {
                const linkText = $(a).text().trim();
                $(a).replaceWith(` ${linkText} `);
            });

            const rawContent = ($('#articleContent').html() || '')
                .replace(/<br\s*[\/]?>/gi, '\n')
                .replace(/<\/p>/gi, '\n')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/gi, ' ');

            const lines = rawContent
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);

            const downloads = {};
            let currentQuality = null;

            for (const line of lines) {
                // Deteksi resolusi (misal: 360P, 480P, 720P, 1080P)
                const qualityMatch = line.match(/^(\d{3,4}P)/i);
                if (qualityMatch) {
                    currentQuality = qualityMatch[1].toUpperCase();
                    if (!downloads[currentQuality]) {
                        downloads[currentQuality] = {};
                    }

                    // Antisipasi jika nama host menyatu di baris yang sama dengan resolusi
                    const rest = line.substring(qualityMatch[0].length).trim();
                    if (rest.includes(':')) {
                        const colonIdx = rest.indexOf(':');
                        const host = rest.slice(0, colonIdx).trim();
                        const urlMatch = rest.slice(colonIdx + 1).trim().match(/https?:\/\/[^\s<"']+/);
                        if (urlMatch) {
                            downloads[currentQuality][host] = urlMatch[0];
                        }
                    }
                    continue;
                }

                // Ambil link host di bawah resolusi yang sedang aktif
                if (currentQuality && line.includes(':')) {
                    const colonIdx = line.indexOf(':');
                    const host = line.slice(0, colonIdx).trim();
                    const urlPart = line.slice(colonIdx + 1).trim();
                    const urlMatch = urlPart.match(/https?:\/\/[^\s<"']+/);

                    // Saring teks penutup atau ajakan donasi
                    const isDonationOrFooter = /terimakasih|donasi|download di/i.test(host);
                    if (urlMatch && !isDonationOrFooter) {
                        downloads[currentQuality][host] = urlMatch[0];
                    }
                }
            }

            return {
                success: true,
                data: {
                    title,
                    originalUrl: targetUrl,
                    justPasteUrl: finalUrl,
                    downloads
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Eksperimen Bypass Shortlink Iklan (srnky.com / shrinkearn)
     * Mencoba mendeteksi dan melewati proteksi link iklan
     */
    static async experimentBypass(adUrl) {
        try {
            const urlObj = new URL(adUrl);
            const domain = urlObj.hostname.toLowerCase();

            // Jika link sudah direct link (misal: drive.google.com, mega.nz, acefile, pixeldrain)
            if (!/srnky|shrinkearn|s\.id|short/i.test(domain)) {
                return {
                    status: 'direct',
                    targetUrl: adUrl,
                    message: 'Link sudah direct link'
                };
            }

            // Jika link adalah redirect sederhana / unshorten biasa
            const res = await axios.get(adUrl, {
                headers: this.getHeaders(),
                maxRedirects: 5,
                validateStatus: s => s >= 200 && s < 400
            });

            const responseUrl = res.request?.res?.responseUrl;
            if (responseUrl && responseUrl !== adUrl && !responseUrl.includes(domain)) {
                return {
                    status: 'bypassed',
                    targetUrl: responseUrl,
                    message: 'Berhasil di-bypass melalui direct HTTP redirect'
                };
            }

            // Analisis proteksi srnky / shrinkearn
            const $ = cheerio.load(res.data);
            const hasTurnstile = res.data.includes('turnstile') || $('input[name="cf-turnstile-response"]').length > 0;
            const hasTimer = res.data.includes('adLinkFly.counterSubmit') || res.data.includes('setInterval');

            return {
                status: 'protected',
                targetUrl: adUrl,
                adNetwork: 'ShrinkEarn / AdLinkFly (srnky.com)',
                security: {
                    cloudflareTurnstile: hasTurnstile,
                    countdownTimer: hasTimer
                },
                message: 'Link dilindungi oleh Cloudflare Turnstile & countdown timer AdLinkFly.'
            };
        } catch (error) {
            return {
                status: 'error',
                targetUrl: adUrl,
                message: error.message
            };
        }
    }
}

// ==========================================
// LOGIKA COMMAND LINE INTERFACE (CLI)
// ==========================================
async function runCLI() {
    const args = process.argv.slice(2);
    const targetUrl = args[0];

    if (!targetUrl) {
        console.log('💡 Cara Penggunaan JustPaste Scraper:');
        console.log('   node justpaste.js <url_s.id_atau_justpaste>');
        console.log('\nContoh:');
        console.log('   node justpaste.js https://s.id/rhhcP');
        console.log('   node justpaste.js https://justpaste.it/hamfo');
        return;
    }

    console.log(`🔍 Memproses URL: ${targetUrl}...\n`);
    const result = await JustPasteScraper.parse(targetUrl);

    if (result.success && result.data) {
        const { title, originalUrl, justPasteUrl, downloads } = result.data;

        console.log(`🎬 Judul       : ${title}`);
        console.log(`🔗 URL Awal    : ${originalUrl}`);
        console.log(`📄 JustPaste   : ${justPasteUrl}\n`);

        console.log('🎥 Link Download (Berdasarkan Index Host):');
        const qualities = Object.keys(downloads);

        if (qualities.length === 0) {
            console.log('   ⚠️ Tidak ada link resolusi yang ditemukan.');
        } else {
            for (const quality of qualities) {
                console.log(`   [${quality}]`);
                const hosts = downloads[quality];
                for (const [hostName, link] of Object.entries(hosts)) {
                    console.log(`     - ${hostName}: ${link}`);
                }
            }
        }

        // Jalankan eksperimen bypass pada salah satu link jika terdapat link iklan
        const firstQuality = qualities[0];
        if (firstQuality && Object.keys(downloads[firstQuality]).length > 0) {
            const [sampleHost, sampleLink] = Object.entries(downloads[firstQuality])[0];
            console.log(`\n🧪 Eksperimen Bypass Ads (${sampleHost} - ${sampleLink}):`);
            const bypassResult = await JustPasteScraper.experimentBypass(sampleLink);
            console.log(`   - Status    : ${bypassResult.status}`);
            console.log(`   - Keterangan: ${bypassResult.message}`);
            if (bypassResult.security) {
                console.log(`   - Proteksi  : Cloudflare Turnstile=${bypassResult.security.cloudflareTurnstile}, Timer=${bypassResult.security.countdownTimer}`);
            }
            if (bypassResult.status === 'protected') {
                console.log('\n💡 Rekomendasi Melewati Iklan srnky.com:');
                console.log('   1. Buka link srnky.com di browser.');
                console.log('   2. Selesaikan checkbox Cloudflare Turnstile "Verify you are human".');
                console.log('   3. Klik tombol "Continue" (tutup tab pop-up iklan yang muncul).');
                console.log('   4. Tunggu timer hitungan mundur (10 detik) hingga tombol "Get Link" aktif.');
                console.log('   5. Klik "Get Link" untuk mendapatkan direct link (Google Drive / Mega / Acefile).');
                console.log('   💡 Tips Otomatis: Pasang ekstensi Tampermonkey dengan script "Bypass All Shortlinks"');
                console.log('      agar verifikasi & timer dilewati otomatis di browser.');
            }
        }
    } else {
        console.log(`❌ Gagal mengambil data: ${result.error || 'Data tidak ditemukan.'}`);
    }
}

module.exports = JustPasteScraper;

if (require.main === module) {
    runCLI();
}
