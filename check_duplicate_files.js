const fs = require('fs');
const path = require('path');

/**
 * Normalisasi teks untuk perbandingan similarity
 */
function cleanText(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        // Hapus penanda z-library domain di nama file
        .replace(/\(z-library[^)]*\)/gi, '')
        .replace(/\[z-library[^\]]*\]/gi, '')
        // Hapus ekstensi
        .replace(/\.(epub|pdf|txt|mobi|azw3)$/i, '')
        // Normalisasi simbol full-width/spasi
        .replace(/[\s\t\r\n　]+/g, ' ')
        .replace(/[（【「『]/g, '(')
        .replace(/[）】」』]/g, ')')
        .trim();
}

/**
 * Bigram Dice Coefficient Similarity (0.0 - 1.0)
 * Sangat akurat & cepat untuk string bahasa Jepang dan alfabet
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

function sanitizeFolderName(name) {
    return cleanText(name)
        .replace(/[\\/:*?"<>|]/g, '_')
        .substring(0, 50)
        .trim() || 'group_misc';
}

function organizeDuplicates() {
    const srcDir = path.join(__dirname, 'downloads', 'Majo_no_Tabitabi');
    const targetBaseDir = path.join(__dirname, 'check_dup', 'majo_no_tabitabi');
    const SIMILARITY_THRESHOLD = 0.50; // 50%

    if (!fs.existsSync(srcDir)) {
        console.error(`Folder sumber tidak ditemukan: ${srcDir}`);
        return;
    }

    const files = fs.readdirSync(srcDir).filter(f => {
        const full = path.join(srcDir, f);
        return fs.statSync(full).isFile();
    });

    console.log(`================================================================`);
    console.log(`📁 MEMPROSES PENGELOMPOKAN FILE FISIK BERDASARKAN SIMILARITY`);
    console.log(`================================================================`);
    console.log(`Sumber folder       : ${srcDir}`);
    console.log(`Total file terdeteksi: ${files.length} file`);
    console.log(`Target folder       : ${targetBaseDir}`);
    console.log(`Threshold Similarity: ${(SIMILARITY_THRESHOLD * 100)}%\n`);

    if (!fs.existsSync(targetBaseDir)) {
        fs.mkdirSync(targetBaseDir, { recursive: true });
    }

    const groups = []; // [{ rep: 'nama_file', files: ['file1', 'file2'] }]

    for (const file of files) {
        let matchedGroup = null;
        let maxSim = 0;

        for (const group of groups) {
            // Hitung skor kecocokan terhadap file perwakilan grup
            const sim = getSimilarity(file, group.rep);
            if (sim >= SIMILARITY_THRESHOLD && sim > maxSim) {
                maxSim = sim;
                matchedGroup = group;
            }
        }

        if (matchedGroup) {
            matchedGroup.files.push(file);
        } else {
            groups.push({
                rep: file,
                files: [file]
            });
        }
    }

    console.log(`✅ Berhasil mengelompokkan ke dalam ${groups.length} grup/subfolder.\n`);

    let copiedCount = 0;
    groups.forEach((grp, idx) => {
        const folderName = `group_${String(idx + 1).padStart(3, '0')}_${sanitizeFolderName(grp.rep)}`;
        const groupFolder = path.join(targetBaseDir, folderName);

        if (!fs.existsSync(groupFolder)) {
            fs.mkdirSync(groupFolder, { recursive: true });
        }

        console.log(`[Grup ${idx + 1}] (${grp.files.length} file) -> ${folderName}`);
        for (const f of grp.files) {
            const srcPath = path.join(srcDir, f);
            const destPath = path.join(groupFolder, f);
            fs.copyFileSync(srcPath, destPath);
            copiedCount++;
            console.log(`   📄 ${f}`);
        }
        console.log('');
    });

    console.log(`================================================================`);
    console.log(`🎉 Selesai! Sebanyak ${copiedCount} file disalin ke:`);
    console.log(`   ${targetBaseDir}`);
    console.log(`================================================================`);
}

organizeDuplicates();

