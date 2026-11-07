const fs = require('fs');
const path = require('path');

function parseCLIArgs(argv) {
    const args = {
        title: '',
        author: '',
        publisher: '',
        year: '',
        ext: '',
        lang: '',
        id: '',
        file: '',
        limit: 0,
        exact: false
    };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--title' || a === '-t') args.title = argv[++i] || '';
        else if (a === '--author' || a === '-a') args.author = argv[++i] || '';
        else if (a === '--publisher' || a === '-p') args.publisher = argv[++i] || '';
        else if (a === '--year' || a === '-y') args.year = argv[++i] || '';
        else if (a === '--ext') args.ext = argv[++i] || '';
        else if (a === '--lang') args.lang = argv[++i] || '';
        else if (a === '--id') args.id = argv[++i] || '';
        else if (a === '--file' || a === '-f') args.file = argv[++i] || '';
        else if (a === '--limit' || a === '-l') args.limit = parseInt(argv[++i], 10) || 0;
        else if (a === '--exact' || a === '-e') args.exact = true;
        else if (!args.title && !a.startsWith('-')) {
            args.title = a;
        }
    }
    return args;
}

function cleanText(str, stripVolumePunctuation = false) {
    if (!str) return '';
    let res = str
        .toLowerCase()
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/\(z-library[^)]*\)/gi, '')
        .replace(/\[z-library[^\]]*\]/gi, '');

    if (stripVolumePunctuation) {
        res = res.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
    }

    return res
        .replace(/[\s\t\r\n　_.-]+/g, ' ')
        .trim();
}

function resolveInputFile(customFile) {
    if (customFile && fs.existsSync(customFile)) return customFile;

    // Prioritas default: cleaned -> grouped -> lookup mentah
    const candidates = [
        path.join(__dirname, 'tmp', 'lookup-魔女の旅々-cleaned.json'),
        path.join(__dirname, 'tmp', 'lookup-魔女の旅々-grouped.json'),
        path.join(__dirname, 'tmp', 'lookup-魔女の旅々.json')
    ];

    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }

    return null;
}

function loadBooks(filePath) {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const books = [];

    if (Array.isArray(raw)) {
        for (const item of raw) {
            if (Array.isArray(item.items)) {
                // Struktur grouped / cleaned
                books.push(...item.items);
            } else if (item.title) {
                // Struktur flat
                books.push(item);
            }
        }
    }
    return books;
}

function displayMetadata() {
    const args = parseCLIArgs(process.argv.slice(2));
    const targetFile = resolveInputFile(args.file);

    if (!targetFile) {
        console.error('❌ Tidak ditemukan file data metadata di folder tmp/. Jalankan lookup terlebih dahulu.');
        return;
    }

    const books = loadBooks(targetFile);

    // Filter berdasarkan parameter CLI
    const qClean = cleanText(args.title);
    const qBase = cleanText(args.title, true);

    const matchedBooks = books.filter(b => {
        if (args.title) {
            const titleClean = cleanText(b.title);
            const titleBase = cleanText(b.title, true);

            if (args.exact) {
                const isExact = (titleClean === qClean || titleBase === qBase || titleClean === qBase || titleBase === qClean);
                if (!isExact) return false;
            } else {
                if (!titleClean.includes(qClean)) return false;
            }
        }
        if (args.author && !(b.author || '').toLowerCase().includes(args.author.toLowerCase())) return false;
        if (args.publisher && !(b.publisher || '').toLowerCase().includes(args.publisher.toLowerCase())) return false;
        if (args.year && String(b.year || '') !== String(args.year)) return false;
        if (args.ext && (b.extension || '').toUpperCase() !== args.ext.toUpperCase()) return false;
        if (args.lang && !(b.language || '').toLowerCase().includes(args.lang.toLowerCase())) return false;
        if (args.id && String(b.id) !== String(args.id)) return false;
        return true;
    });

    console.log(`================================================================================`);
    console.log(`📚 Z-LIBRARY METADATA VIEWER`);
    console.log(`================================================================================`);
    console.log(`📂 Memuat data dari  : ${path.basename(targetFile)} (${books.length} total buku)`);
    if (args.title) console.log(`🔍 Filter Judul       : "${args.title}"`);
    console.log(`🎯 Mode Pencarian     : ${args.exact ? 'EXACT MATCH (Hanya judul yang persis tanpa volume lain)' : 'FUZZY / CONTAINS'}`);
    if (args.author) console.log(`👤 Filter Penulis     : "${args.author}"`);
    if (args.publisher) console.log(`🏢 Filter Penerbit    : "${args.publisher}"`);
    if (args.ext) console.log(`📦 Filter Format      : "${args.ext}"`);
    console.log(`📊 Hasil Pencocokan  : ${matchedBooks.length} buku`);
    console.log(`--------------------------------------------------------------------------------\n`);

    if (matchedBooks.length === 0) {
        console.log('❌ Tidak ada buku yang cocok dengan kriteria pencarian.');
        return;
    }

    const displayList = args.limit > 0 ? matchedBooks.slice(0, args.limit) : matchedBooks;

    displayList.forEach((b, idx) => {
        console.log(`[${idx + 1}] 📖 ${b.title}`);
        console.log(`    🆔 ID        : ${b.id}`);
        console.log(`    📦 Info      : ${b.extension} (${b.filesize}) | ${b.language} | Tahun: ${b.year || '-'}`);
        console.log(`    🏢 Penerbit  : ${b.publisher || '-'}`);
        console.log(`    📥 Download  : ${b.downloadUrl}`);
        console.log(`--------------------------------------------------------------------------------`);
    });

    if (args.limit > 0 && matchedBooks.length > args.limit) {
        console.log(`ℹ️  Menampilkan ${args.limit} dari total ${matchedBooks.length} buku (Gunakan tanpa --limit untuk melihat semua).`);
    }

    console.log(`\n💡 Total Ditemukan: ${matchedBooks.length} buku.`);
}

displayMetadata();

