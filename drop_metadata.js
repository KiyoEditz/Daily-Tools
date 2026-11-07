const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Normalisasi teks untuk ekstraksi judul volume utama
 */
function cleanTitle(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        // Konversi angka full-width ke half-width
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/\(z-library[^)]*\)/gi, '')
        .replace(/\[z-library[^\]]*\]/gi, '')
        .replace(/[\s\t\r\n　]+/g, ' ')
        .trim();
}

/**
 * Bigram Dice Coefficient Similarity (0.0 - 1.0)
 */
function getSimilarity(s1, s2) {
    const str1 = cleanTitle(s1);
    const str2 = cleanTitle(s2);

    if (str1 === str2) return 1.0;
    if (str1.length < 2 || str2.length < 2) return 0.0;

    const bigrams1 = new Map();
    for (let i = 0; i < str1.length - 1; i++) {
        const bigram = str1.substring(i, i + 2);
        bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < str2.length - 1; i++) {
        const bigram = str2.substring(i, i + 2);
        const count = bigrams1.get(bigram) || 0;
        if (count > 0) {
            bigrams1.set(bigram, count - 1);
            intersection++;
        }
    }

    const totalBigrams = (str1.length - 1) + (str2.length - 1);
    return (2.0 * intersection) / totalBigrams;
}

/**
 * Konversi filesize (misal "1.80 MB", "488 KB") ke MB (float)
 */
function parseFilesizeToMB(sizeStr) {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/([\d.]+)\s*(kb|mb|gb|bytes?)/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'GB') return val * 1024;
    if (unit === 'MB') return val;
    if (unit === 'KB') return val / 1024;
    return val / (1024 * 1024);
}

/**
 * Evaluasi kondisi filter pada sebuah buku
 */
function checkItemAgainstCriteria(item, criteria) {
    // 1. Language Filter
    if (criteria.language) {
        const itemLang = (item.language || '').toLowerCase();
        const targetLang = criteria.language.toLowerCase();
        if (targetLang === 'japanese' && !itemLang.includes('japan')) {
            return { pass: false, reason: `Language '${item.language}' bukan Japanese` };
        } else if (targetLang !== 'japanese' && !itemLang.includes(targetLang)) {
            return { pass: false, reason: `Language '${item.language}' != '${criteria.language}'` };
        }
    }

    // 2. Extension Filter
    if (criteria.extension) {
        const itemExt = (item.extension || '').toUpperCase();
        const targetExt = criteria.extension.toUpperCase();
        if (itemExt !== targetExt) {
            return { pass: false, reason: `Format '${item.extension}' != '${targetExt}'` };
        }
    }

    // 3. Filesize Filter (<2, >5, <=1.5, dll)
    if (criteria.filesizeExpr) {
        const itemMB = parseFilesizeToMB(item.filesize);
        const m = criteria.filesizeExpr.match(/^(<=|>=|<|>|=)?\s*([\d.]+)\s*(mb|kb)?$/i);
        if (m) {
            const op = m[1] || '<'; // default jika hanya angka misal "2" -> <2
            let threshold = parseFloat(m[2]);
            const unit = (m[3] || 'MB').toUpperCase();
            if (unit === 'KB') threshold = threshold / 1024;

            let conditionMet = false;
            switch (op) {
                case '<': conditionMet = (itemMB < threshold); break;
                case '<=': conditionMet = (itemMB <= threshold); break;
                case '>': conditionMet = (itemMB > threshold); break;
                case '>=': conditionMet = (itemMB >= threshold); break;
                case '=': conditionMet = (Math.abs(itemMB - threshold) < 0.05); break;
            }

            // Jika kondisi perbandingan TERPENUHI, berarti buku ini DI-DROP (dihapus)
            if (conditionMet) {
                return { pass: false, reason: `Ukuran file ${item.filesize} (${itemMB.toFixed(2)} MB) memenuhi syarat drop: ${criteria.filesizeExpr}` };
            }
        }
    }

    // 4. Rating Filter (<4, <3.0, dll)
    if (criteria.ratingExpr) {
        const itemRating = parseFloat(item.rating) || 0;
        const m = criteria.ratingExpr.match(/^(<=|>=|<|>|=)?\s*([\d.]+)$/);
        if (m) {
            const op = m[1] || '<';
            const threshold = parseFloat(m[2]);
            let conditionMet = false;
            switch (op) {
                case '<': conditionMet = (itemRating < threshold); break;
                case '<=': conditionMet = (itemRating <= threshold); break;
                case '>': conditionMet = (itemRating > threshold); break;
                case '>=': conditionMet = (itemRating >= threshold); break;
                case '=': conditionMet = (itemRating === threshold); break;
            }
            if (conditionMet) {
                return { pass: false, reason: `Rating (${item.rating}) memenuhi syarat drop: ${criteria.ratingExpr}` };
            }
        }
    }

    // 5. Publisher Filter (harus mengandung teks tertentu)
    if (criteria.publisherContains) {
        const itemPub = (item.publisher || '').toLowerCase();
        if (!itemPub.includes(criteria.publisherContains.toLowerCase())) {
            return { pass: false, reason: `Penerbit '${item.publisher}' tidak mengandung '${criteria.publisherContains}'` };
        }
    }

    return { pass: true };
}

/**
 * Cek apakah buku memiliki varian / duplikat lain di dalam daftar buku yang ada
 */
function countTitleVariations(targetBook, allCurrentBooks, threshold = 0.55) {
    let matches = 0;
    for (const b of allCurrentBooks) {
        if (getSimilarity(targetBook.title, b.title) >= threshold) {
            matches++;
        }
    }
    return matches;
}

function promptUser(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => {
        rl.question(query, ans => {
            rl.close();
            resolve(ans.trim());
        });
    });
}

function parseCLIArgs(argv) {
    const parsed = {
        lang: 'japanese',      // default: buang di luar japanese
        filesize: '<2',        // default: hapus di bawah 2MB
        ext: 'EPUB',           // default: pertahankan EPUB
        rating: '',            // opsional misal "<3"
        publisher: '',         // opsional
        autoConfirm: false,    // --yes untuk bypass prompt
        input: path.join(__dirname, 'tmp', 'lookup-魔女の旅々-grouped.json'),
        output: path.join(__dirname, 'tmp', 'lookup-魔女の旅々-cleaned.json')
    };

    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--lang') parsed.lang = argv[++i];
        else if (a === '--filesize' || a === '--size') parsed.filesize = argv[++i];
        else if (a === '--ext') parsed.ext = argv[++i];
        else if (a === '--rating') parsed.rating = argv[++i];
        else if (a === '--publisher') parsed.publisher = argv[++i];
        else if (a === '--input' || a === '-i') parsed.input = argv[++i];
        else if (a === '--output' || a === '-o') parsed.output = argv[++i];
        else if (a === '--yes' || a === '-y') parsed.autoConfirm = true;
    }
    return parsed;
}

async function run() {
    const args = parseCLIArgs(process.argv.slice(2));

    console.log(`================================================================`);
    console.log(`🧹 Z-LIBRARY METADATA DROP & FILTER TOOL`);
    console.log(`================================================================`);
    console.log(`📂 File Sumber       : ${args.input}`);
    console.log(`💾 File Target       : ${args.output}`);
    console.log(`🏷️  Kriteria Drop:`);
    console.log(`   - Bahasa Wajib    : ${args.lang || '(Semua)'}`);
    console.log(`   - Ekstensi Wajib  : ${args.ext || '(Semua)'}`);
    console.log(`   - Drop Filesize   : ${args.filesize ? `${args.filesize} MB` : '(Tidak ada)'}`);
    if (args.rating) console.log(`   - Drop Rating     : ${args.rating}`);
    if (args.publisher) console.log(`   - Penerbit Cocok  : ${args.publisher}`);
    console.log(`----------------------------------------------------------------\n`);

    if (!fs.existsSync(args.input)) {
        console.error(`❌ File input tidak ditemukan: ${args.input}`);
        return;
    }

    const rawGroups = JSON.parse(fs.readFileSync(args.input, 'utf8'));
    
    // Ekstrak semua item flat
    const allBooks = [];
    rawGroups.forEach(g => {
        if (Array.isArray(g.items)) {
            allBooks.push(...g.items);
        } else {
            allBooks.push(g);
        }
    });

    console.log(`📊 Total metadata buku terbaca: ${allBooks.length} buku.\n`);

    const criteria = {
        language: args.lang,
        extension: args.ext,
        filesizeExpr: args.filesize,
        ratingExpr: args.rating,
        publisherContains: args.publisher
    };

    const keptBooks = [];
    const candidatesToDrop = [];

    // Langkah 1: Pisahkan kandidat yang lolos dan kandidat drop
    for (const book of allBooks) {
        const check = checkItemAgainstCriteria(book, criteria);
        if (check.pass) {
            keptBooks.push(book);
        } else {
            candidatesToDrop.push({ book, reason: check.reason });
        }
    }

    console.log(`✅ Buku yang langsung lolos filter : ${keptBooks.length} buku`);
    console.log(`⚠️  Buku kandidat yang akan di-drop: ${candidatesToDrop.length} buku\n`);

    // Langkah 2: Cek apakah ada buku kandidat drop yang merupakan "Satu-satunya varian tersisa" (Unique Volume Protection)
    const finalKept = [...keptBooks];
    let droppedCount = 0;
    let savedByUniqueCount = 0;

    for (let i = 0; i < candidatesToDrop.length; i++) {
        const { book, reason } = candidatesToDrop[i];

        // Cek kemiripan terhadap buku-buku yang SUDAH LOLOS di finalKept
        const remainingVariationsInKept = countTitleVariations(book, finalKept, 0.55);

        // Jika di finalKept TIDAK ADA buku yang mirip (0 varian tersisa), ini adalah buku tunggal / satu-satunya!
        if (remainingVariationsInKept === 0) {
            console.log(`----------------------------------------------------------------`);
            console.log(`🚨 PERINGATAN: DATA TUNGGAL TERDETEKSI (TIDAK ADA VARIAN LAIN)!`);
            console.log(`📖 Judul    : ${book.title}`);
            console.log(`📦 Format   : ${book.extension} | Ukuran: ${book.filesize} | Bahasa: ${book.language}`);
            console.log(`⚠️  Alasan  : ${reason}`);
            console.log(`ℹ️  Catatan : Jika buku ini dihapus, tidak ada volume/edisi serupa yang tersisa.`);
            console.log(`----------------------------------------------------------------`);

            let confirmDelete = true;
            if (!args.autoConfirm) {
                const answer = await promptUser(`❓ Apakah Anda YAKIN ingin MENGHAPUS buku tunggal ini? (y/N): `);
                confirmDelete = (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            }

            if (!confirmDelete) {
                console.log(`🛡️  Buku dipertahankan karena merupakan satu-satunya salinan!\n`);
                finalKept.push(book);
                savedByUniqueCount++;
                continue;
            } else {
                console.log(`🗑️  Buku dikonfirmasi untuk DIHAPUS.\n`);
            }
        }

        droppedCount++;
    }

    // Langkah 3: Susun kembali ke struktur grup yang rapi
    const finalGroups = [];
    for (const book of finalKept) {
        let matched = null;
        for (const g of finalGroups) {
            if (getSimilarity(book.title, g.group_title) >= 0.50) {
                matched = g;
                break;
            }
        }
        if (matched) {
            matched.items.push(book);
        } else {
            finalGroups.push({
                group_id: finalGroups.length + 1,
                group_title: book.title,
                total_variations: 1,
                items: [book]
            });
        }
    }

    // Update total variations & sorting
    finalGroups.forEach(g => {
        g.total_variations = g.items.length;
        g.recommended_best_id = g.items[0]?.id || null;
    });
    finalGroups.sort((a, b) => b.total_variations - a.total_variations);

    fs.writeFileSync(args.output, JSON.stringify(finalGroups, null, 2), 'utf8');

    console.log(`================================================================`);
    console.log(`🎉 PROSES DROP & FILTER SELESAI!`);
    console.log(`================================================================`);
    console.log(`📦 Total Awal            : ${allBooks.length} buku`);
    console.log(`🗑️  Total Dihapus (Drop)  : ${droppedCount} buku`);
    console.log(`🛡️  Diselamatkan (Tunggal): ${savedByUniqueCount} buku`);
    console.log(`✨ Total Tersisa         : ${finalKept.length} buku (dalam ${finalGroups.length} grup bersih)`);
    console.log(`💾 Hasil Tersimpan Di    : ${args.output}`);
    console.log(`================================================================\n`);
}

run();

