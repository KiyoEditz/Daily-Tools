class GDriveDirectLinker {
    // 1. Masukkan semua UUID ke dalam Array
    static uuids = [
        '8ee94338-4d25-4f01-a79d-45ee6c48120e',
        'c7729be6-1814-4b44-b2d6-11317046fa04',
        '08686a5d-3c68-458a-a49e-01a3766d279a',
        '21d69699-f877-4685-b7b5-8ff2672b54a7',
        'feebeefb-5806-4411-870a-ac9604e2beac',
        'd55e421f-4cdd-4d53-ba5f-af1b1e75dc46',
        '71abc72f-bc6b-470b-8c82-eb1267cd2205',
        '26461458-2f8f-46a5-9e2f-be5a3eef213f',
        '0896272d-b1a4-488d-8f66-ef7381e87a2e'
        //https://drive.usercontent.google.com/download?id=1-Bd4cVndwUrDWLDqjS6FTf-L3ax_RRTK&export=download&confirm=t&uuid=0896272d-b1a4-488d-8f66-ef7381e87a2e&at=ABswASYj_GOnPZ1Sck8iGX5JRWGY%3A1783050078303
    ];

    static generate(url) {
        // 2. Ekstrak File ID dari URL Google Drive apa pun
        const match = url.match(/[-\w]{25,}/);

        if (!match) {
            return { success: false, error: 'File ID tidak ditemukan di dalam URL.' };
        }
        const fileId = match[0];

        // 3. Pilih salah satu UUID secara acak dari Array
        const randomIndex = Math.floor(Math.random() * this.uuids.length);
        const randomUuid = this.uuids[randomIndex];

        // 4. Rakit menjadi URL Direct Download sesuai template
        const directLink = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t&uuid=${randomUuid}`;

        // Mengembalikan data beserta informasi UUID mana yang terpakai
        return { success: true, directLink, fileId, usedUuid: randomUuid };
    }
}

// ==========================================
// LOGIKA COMMAND LINE INTERFACE (CLI)
// ==========================================
function runCLI() {
    const args = process.argv.slice(2);
    const url = args[0];

    if (!url) {
        console.log('❌ Masukkan URL Google Drive.');
        console.log('💡 Contoh: node gdrive.js https://drive.google.com/file/d/1-Bd4cVndwUrDWLDqjS6FTf-L3ax_RRTK/view');
        return;
    }

    const result = GDriveDirectLinker.generate(url);

    if (result.success) {
        console.log('✅ Berhasil merakit Direct Link!\n');
        console.log(`📂 File ID   : ${result.fileId}`);
        console.log(`🔄 UUID acak : ${result.usedUuid}`);
        console.log('\n🔗 Link Download:');
        console.log(result.directLink);
    } else {
        console.log(`\n❌ Gagal: ${result.error}`);
    }
}

runCLI();