const fs = require('fs');
const path = require('path');

/**
 * Normalisasi teks untuk matching similarity atau exact
 */
function cleanText(str, stripVolumePunctuation = false) {
    if (!str) return '';
    let res = str
        .toLowerCase()
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/\(z-library[^)]*\)/gi, '')
        .replace(/\[z-library[^\]]*\]/gi, '');

    if (stripVolumePunctuation) {
        // Hilangkan label volume sekunder seperti "(gaノベル)", "(カドカワbooks)", tanda kurung dll
        res = res.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
    }

    return res
        .replace(/[\s\t\r\n　_.-]+/g, ' ')
        .trim();
}

/**
 * Ekstrak perkiraan metadata dari nama file (Format Z-Library: "Judul (Penulis) (Domain).ext")
 */
function parseFilenameDetails(filename) {
    const ext = path.extname(filename).replace('.', '').toUpperCase();
    const basename = path.basename(filename, path.extname(filename));

    // Bersihkan penanda domain
    let clean = basename.replace(/\((?:z-library|1lib|z-lib|b-ok)[^)]*\)/gi, '').trim();

    // Deteksi penulis dalam kurung paling belakang
    let author = '-';
    const authorMatch = clean.match(/\(([^()]+)\)$/);
    if (authorMatch) {
        author = authorMatch[1].trim();
        clean = clean.substring(0, authorMatch.index).trim();
    }

    const title = clean || basename;
    return { title, author, ext };
}

/**
 * Format bytes ke string ukuran manusiawi
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Scan seluruh file di folder downloads (rekursif)
 */
function scanFolderFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;

    function walk(currDir) {
        const entries = fs.readdirSync(currDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currDir, entry.name);
            if (entry.isDirectory()) {
                // Abaikan subfolder check_dup jika ada
                if (entry.name !== 'check_dup') {
                    walk(fullPath);
                }
            } else if (entry.isFile()) {
                try {
                    const stats = fs.statSync(fullPath);
                    const parsed = parseFilenameDetails(entry.name);
                    results.push({
                        filename: entry.name,
                        fullPath,
                        relativePath: path.relative(dir, fullPath),
                        sizeBytes: stats.size,
                        sizeFormatted: formatBytes(stats.size),
                        modifiedAt: stats.mtime.toISOString().split('T')[0],
                        parsedTitle: parsed.title,
                        parsedAuthor: parsed.author,
                        extension: parsed.ext
                    });
                } catch (e) {}
            }
        }
    }

    walk(dir);
    return results;
}

/**
 * Muat kamus metadata dari seluruh file JSON yang ada di tmp/
 */
function loadMetadataIndex() {
    const tmpDir = path.join(__dirname, 'tmp');
    const index = new Map(); // key: cleanTitle -> metadata item

    if (!fs.existsSync(tmpDir)) return index;

    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('lookup-') && f.endsWith('.json'));

    for (const f of files) {
        try {
            const p = path.join(tmpDir, f);
            const content = JSON.parse(fs.readFileSync(p, 'utf8'));

            const items = [];
            if (Array.isArray(content)) {
                for (const elem of content) {
                    if (Array.isArray(elem.items)) {
                        items.push(...elem.items);
                    } else if (elem.title) {
                        items.push(elem);
                    }
                }
            }

            for (const item of items) {
                if (item && item.title) {
                    const k = cleanText(item.title);
                    if (!index.has(k)) {
                        index.set(k, item);
                    }
                }
            }
        } catch (e) {}
    }
    return index;
}

/**
 * Cari metadata yang paling cocok dari file JSON berdasarkan nama file
 */
function findMatchingMetadata(parsedTitle, metaIndex) {
    const cleanP = cleanText(parsedTitle);

    // 1. Direct key match
    if (metaIndex.has(cleanP)) return metaIndex.get(cleanP);

    // 2. Substring match
    for (const [key, meta] of metaIndex.entries()) {
        if (cleanP.includes(key) || key.includes(cleanP)) {
            return meta;
        }
    }
    return null;
}

function parseCLIArgs(argv) {
    const args = {
        query: '',
        folder: path.join(__dirname, 'downloads'),
        limit: 0,
        exact: false
    };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--query' || a === '-q' || a === '--title' || a === '-t') {
            args.query = argv[++i] || '';
        } else if (a === '--dir' || a === '--folder' || a === '-d') {
            args.folder = argv[++i] || args.folder;
        } else if (a === '--limit' || a === '-l') {
            args.limit = parseInt(argv[++i], 10) || 0;
        } else if (a === '--exact' || a === '-e') {
            args.exact = true;
        } else if (!args.query && !a.startsWith('-')) {
            args.query = a;
        }
    }
    return args;
}

function main() {
    const args = parseCLIArgs(process.argv.slice(2));

    console.log(`================================================================================`);
    console.log(`🔍 LOCAL FILE METADATA SEARCH & VERIFIER`);
    console.log(`================================================================================`);
    console.log(`📁 Folder Target    : ${args.folder}`);
    console.log(`🔎 Kata Kunci       : "${args.query || '(Tampilkan Semua)'}"`);
    console.log(`🎯 Mode Pencarian   : ${args.exact ? 'EXACT MATCH (Hanya judul yang persis tanpa volume lain)' : 'FUZZY / CONTAINS'}`);
    console.log(`--------------------------------------------------------------------------------\n`);

    if (!fs.existsSync(args.folder)) {
        console.error(`❌ Folder target tidak ditemukan: ${args.folder}`);
        return;
    }

    // 1. Scan semua file fisik di folder
    const allFiles = scanFolderFiles(args.folder);
    console.log(`📂 Memindai penyimpanan... Ditemukan ${allFiles.length} file lokal.`);

    // 2. Muat index metadata Z-Library
    const metaIndex = loadMetadataIndex();
    console.log(`📚 Menghubungkan ke ${metaIndex.size} metadata dari cache lookup JSON.\n`);

    // 3. Filter berdasarkan query pencarian
    const qClean = cleanText(args.query);
    const qBase = cleanText(args.query, true);

    const matched = allFiles.filter(f => {
        if (!qClean) return true;
        const nameClean = cleanText(f.filename);
        const titleClean = cleanText(f.parsedTitle);
        const titleBase = cleanText(f.parsedTitle, true);

        if (args.exact) {
            // Mode Exact Match:
            // Judul harus sama persis (baik nama bersih utuh atau nama tanpa kurung penerbit/label)
            return titleClean === qClean || titleBase === qBase || titleClean === qBase || titleBase === qClean;
        }

        // Mode Fuzzy / Contains:
        return nameClean.includes(qClean) || titleClean.includes(qClean);
    });

    console.log(`================================================================================`);
    console.log(`📊 STATUS PENCARIAN FILE FISIK: ${matched.length} FILE DITEMUKAN`);
    console.log(`================================================================================\n`);

    if (matched.length === 0) {
        console.log(`❌ File untuk "${args.query}" TIDAK ADA di folder ${args.folder}.`);
        console.log(`💡 Status: Belum diunduh / file belum tersedia di disk lokal.\n`);
        return;
    }

    const displayList = args.limit > 0 ? matched.slice(0, args.limit) : matched;

    displayList.forEach((file, idx) => {
        // Cocokkan dengan metadata eksternal (Penerbit, ISBN, Rating, Year, Book ID)
        const meta = findMatchingMetadata(file.parsedTitle, metaIndex);

        console.log(`[${idx + 1}] 🟢 [TERSEDIA DI DISK]`);
        console.log(`    📖 Judul File : ${file.parsedTitle}`);
        console.log(`    📊 Ukuran     : ${file.sizeFormatted} (${file.sizeBytes.toLocaleString()} bytes)`);
        console.log(`    📦 Format     : ${file.extension}`);
        console.log(`    👤 Penulis    : ${meta?.author || file.parsedAuthor || '-'}`);
        console.log(`    🏢 Penerbit   : ${meta?.publisher || '-'}`);
        console.log(`    📅 Tahun      : ${meta?.year || '-'}`);
        if (meta?.isbn) console.log(`    🔖 ISBN       : ${meta.isbn}`);
        if (meta?.rating) console.log(`    ⭐ Rating     : ${meta.rating} / 5.0 (Quality: ${meta.quality || '-'})`);
        if (meta?.id) console.log(`    🆔 Z-Lib ID   : ${meta.id}`);
        if (meta?.downloadUrl) console.log(`    🔗 Source URL : ${meta.downloadUrl}`);
        console.log(`    💾 Lokasi     : ${file.relativePath}`);
        console.log(`--------------------------------------------------------------------------------`);
    });

    if (args.limit > 0 && matched.length > args.limit) {
        console.log(`ℹ️  Menampilkan ${args.limit} dari total ${matched.length} file (Gunakan tanpa --limit untuk melihat semua).`);
    }

    console.log(`\n✅ Selesai. Total file lokal cocok: ${matched.length} file.`);
}

main();

