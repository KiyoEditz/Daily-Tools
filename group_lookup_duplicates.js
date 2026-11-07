const fs = require('fs');
const path = require('path');

/**
 * Normalisasi judul & teks untuk perbandingan similarity
 */
function cleanText(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[\s\t\r\n　]+/g, ' ')
        .replace(/[（【「『]/g, '(')
        .replace(/[）】」』]/g, ')')
        .trim();
}

/**
 * Bigram Dice Coefficient Similarity (0.0 - 1.0)
 */
function getSimilarity(s1, s2) {
    const str1 = cleanText(s1);
    const str2 = cleanText(s2);

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
 * Konversi filesize (misal "1.2 MB", "488 KB") ke bytes untuk scoring kualitas
 */
function parseFilesizeToBytes(sizeStr) {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/([\d.]+)\s*(kb|mb|gb|bytes?)/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'KB') return val * 1024;
    return val;
}

function organizeLookupJson() {
    const srcJson = path.join(__dirname, 'tmp', 'lookup-魔女の旅々.json');
    const outJson = path.join(__dirname, 'tmp', 'lookup-魔女の旅々-grouped.json');
    const SIMILARITY_THRESHOLD = 0.50; // 50%

    if (!fs.existsSync(srcJson)) {
        console.error(`File sumber tidak ditemukan: ${srcJson}`);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(srcJson, 'utf8'));
    console.log(`================================================================`);
    console.log(`📊 PENGELOMPOKAN METADATA LOOKUP JSON BERDASARKAN SIMILARITY`);
    console.log(`================================================================`);
    console.log(`Sumber JSON         : ${srcJson}`);
    console.log(`Total data buku     : ${rawData.length} buku`);
    console.log(`Threshold Similarity: ${(SIMILARITY_THRESHOLD * 100)}%\n`);

    const groups = []; // [{ group_id, rep_title, count, items: [] }]

    for (const book of rawData) {
        let matchedGroup = null;
        let maxSim = 0;

        for (const group of groups) {
            const sim = getSimilarity(book.title, group.rep_title);
            if (sim >= SIMILARITY_THRESHOLD && sim > maxSim) {
                maxSim = sim;
                matchedGroup = group;
            }
        }

        if (matchedGroup) {
            matchedGroup.items.push(book);
        } else {
            groups.push({
                rep_title: book.title,
                items: [book]
            });
        }
    }

    // Urutkan item di dalam tiap grup berdasarkan kualitas tertinggi (Rating -> Quality -> Filesize)
    const formattedGroups = groups.map((g, idx) => {
        const sortedItems = [...g.items].sort((a, b) => {
            const rA = parseFloat(a.rating) || 0;
            const rB = parseFloat(b.rating) || 0;
            if (rB !== rA) return rB - rA;

            const qA = parseFloat(a.quality) || 0;
            const qB = parseFloat(b.quality) || 0;
            if (qB !== qA) return qB - qA;

            return parseFilesizeToBytes(b.filesize) - parseFilesizeToBytes(a.filesize);
        });

        return {
            group_id: idx + 1,
            group_title: g.rep_title,
            total_variations: g.items.length,
            recommended_best_id: sortedItems[0]?.id || null,
            items: sortedItems
        };
    });

    // Urutkan grup dengan variasi buku terbanyak terlebih dahulu
    formattedGroups.sort((a, b) => b.total_variations - a.total_variations);

    fs.writeFileSync(outJson, JSON.stringify(formattedGroups, null, 2), 'utf8');

    console.log(`✅ Berhasil mengelompokkan ke dalam ${formattedGroups.length} kelompok judul unik.`);
    const duplicateGroups = formattedGroups.filter(g => g.total_variations > 1);
    console.log(`⚠️  Ditemukan ${duplicateGroups.length} kelompok yang memiliki duplikat/variasi (> 1).`);

    console.log('\nTop 5 Kelompok dengan variasi terbanyak:');
    formattedGroups.slice(0, 5).forEach(g => {
        console.log(` - [${g.total_variations} variasi] ${g.group_title} (Rekomendasi Terbaik ID: ${g.recommended_best_id})`);
    });

    console.log(`\n================================================================`);
    console.log(`💾 JSON baru berhasil disimpan ke:`);
    console.log(`   ${outJson}`);
    console.log(`================================================================`);
}

organizeLookupJson();

