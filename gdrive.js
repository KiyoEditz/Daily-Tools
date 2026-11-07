const axios = require('axios');
const crypto = require('crypto');

class GDriveDirectLinker {
    /**
     * Membuat UUID v4 secara otomatis tanpa perlu stock manual
     */
    static generateUuid() {
        if (typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        // Fallback generator UUID v4 standar RFC4122
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Mengekstrak Google Drive File ID dari berbagai format URL
     */
    static extractFileId(url) {
        if (!url) return null;
        const trimmed = url.trim();

        // Jika input langsung berupa File ID
        if (/^[-\w]{25,}$/.test(trimmed)) {
            return trimmed;
        }

        // Format: /file/d/FILE_ID/view
        const dMatch = trimmed.match(/\/file\/d\/([-\w]{25,})/i) || trimmed.match(/\/d\/([-\w]{25,})/i);
        if (dMatch) return dMatch[1];

        // Format query: ?id=FILE_ID atau &id=FILE_ID
        const idMatch = trimmed.match(/[?&]id=([-\w]{25,})/i);
        if (idMatch) return idMatch[1];

        // Fallback match karakter alfanumerik panjang
        const generalMatch = trimmed.match(/[-\w]{25,}/);
        return generalMatch ? generalMatch[0] : null;
    }

    /**
     * Merakit direct download link dengan UUID otomatis
     */
    static generate(url) {
        const fileId = this.extractFileId(url);

        if (!fileId) {
            return {
                success: false,
                error: 'File ID tidak ditemukan di dalam URL.'
            };
        }

        // Generate UUID otomatis secara dinamis
        const uuid = this.generateUuid();

        // Format direct download usercontent Google
        const directLink = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${uuid}`;

        return {
            success: true,
            fileId,
            uuid,
            directLink
        };
    }

    /**
     * Mengecek nama dan ukuran file langsung dari header Google Drive tanpa mengunduh isinya
     */
    static async getFileInfo(directLinkOrUrl) {
        try {
            const gen = directLinkOrUrl.includes('drive.usercontent.google.com')
                ? { directLink: directLinkOrUrl }
                : this.generate(directLinkOrUrl);

            if (!gen.directLink) {
                return { success: false, error: 'URL tidak valid.' };
            }

            const res = await axios.get(gen.directLink, {
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });

            const disposition = res.headers['content-disposition'] || '';
            const filenameMatch = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
            const fileName = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'Tidak diketahui';

            const lengthBytes = parseInt(res.headers['content-length'] || '0', 10);
            let fileSize = 'Tidak diketahui';
            if (lengthBytes > 0) {
                if (lengthBytes >= 1024 * 1024 * 1024) {
                    fileSize = `${(lengthBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
                } else {
                    fileSize = `${(lengthBytes / (1024 * 1024)).toFixed(2)} MB`;
                }
            }

            // Hancurkan stream seketika agar tidak membebani memori / bandwidth
            res.data.destroy();

            return {
                success: true,
                fileName,
                fileSize,
                bytes: lengthBytes
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// ==========================================
// LOGIKA COMMAND LINE INTERFACE (CLI)
// ==========================================
async function runCLI() {
    const args = process.argv.slice(2);
    const url = args[0];

    if (!url) {
        console.log('💡 Cara Penggunaan:');
        console.log('   node gdrive.js <url_atau_id_gdrive>');
        console.log('\nContoh:');
        console.log('   node gdrive.js https://drive.google.com/file/d/1-Bd4cVndwUrDWLDqjS6FTf-L3ax_RRTK/view');
        console.log('   node gdrive.js 1-Bd4cVndwUrDWLDqjS6FTf-L3ax_RRTK');
        return;
    }

    console.log('⏳ Mengurai URL & merakit direct link...\n');
    const result = GDriveDirectLinker.generate(url);

    if (result.success) {
        console.log('✅ Berhasil merakit Direct Link!');
        console.log(`📂 File ID    : ${result.fileId}`);
        console.log(`🔄 UUID Otomatis : ${result.uuid}`);
        console.log('\n🔗 Link Download:');
        console.log(result.directLink);

        // Cek informasi file
        process.stdout.write('\n🔍 Mengecek informasi file...');
        const fileInfo = await GDriveDirectLinker.getFileInfo(result.directLink);
        process.stdout.write('\r' + ' '.repeat(35) + '\r');

        if (fileInfo.success) {
            console.log('📄 Informasi File:');
            console.log(`   - Nama File   : ${fileInfo.fileName}`);
            console.log(`   - Ukuran File : ${fileInfo.fileSize}`);
        } else {
            console.log('ℹ️ Catatan: Metadata file tidak dapat dibaca langsung (kemungkinan butuh login / kuota limit Google).');
        }
    } else {
        console.log(`\n❌ Gagal: ${result.error}`);
    }
}

module.exports = GDriveDirectLinker;

if (require.main === module) {
    runCLI();
}