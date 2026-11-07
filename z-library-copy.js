const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * ============================================================================
 * Z-Library Scraper & Downloader (Hybrid Smart-Tiering Edition)
 * ============================================================================
 * Arsitektur:
 * 1. SEARCH & LOOKUP : Menggunakan Akun (Bisa melihat buku tersembunyi/member,
 *                      0 kuota unduh terpakai karena hanya membaca metadata).
 * 2. DOWNLOAD        : HYBRID SMART TIERING:
 *    - Tier 1: Cek Smart-Skip lokal (jika sudah ada -> skip, kuota 0).
 *    - Tier 2: Guest IP Rotator (Direct IP & Proxy acak, 5 unduh/IP).
 *              Kuota akun 100% aman dan UTUH untuk buku publik!
 *    - Tier 3: Auto-Escalate ke Akun jika buku terdeteksi Member-Only / Butuh Login.
 *    - Tier 4: Multi-Account Pool (rotasi otomatis jika akun 1 habis).
 * ============================================================================
 */

class ProxyManager {
    constructor(options = {}) {
        this.maxPerIp = options.maxPerIp || 5;
        this.baseDir = __dirname;
        this.tmpDir = path.join(this.baseDir, 'tmp');
        this.proxyFile = path.join(this.tmpDir, 'z-library-proxies.txt');
        this.stateFile = path.join(this.tmpDir, 'z-library-ip-state.json');
        this.ensureDirectories();
        this.proxies = this.loadProxies();
        this.state = this.loadState();
        this.currentIndex = 0;
    }

    ensureDirectories() {
        if (!fs.existsSync(this.tmpDir)) {
            fs.mkdirSync(this.tmpDir, { recursive: true });
        }
        if (!fs.existsSync(this.proxyFile)) {
            const def = `# Daftar proxy HTTP untuk rotasi guest (satu per baris)\n# Format: http://ip:port\n`;
            fs.writeFileSync(this.proxyFile, def, 'utf8');
        }
    }

    loadProxies() {
        const list = ['direct'];
        if (process.env.ZLIB_PROXIES) {
            const envList = process.env.ZLIB_PROXIES.split(',').map(p => p.trim()).filter(Boolean);
            list.push(...envList);
        }
        if (fs.existsSync(this.proxyFile)) {
            const lines = fs.readFileSync(this.proxyFile, 'utf8').split('\n');
            for (let line of lines) {
                line = line.trim();
                if (line && !line.startsWith('#')) {
                    if (!list.includes(line)) list.push(line);
                }
            }
        }
        return list;
    }

    loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                const lastReset = data.lastReset ? new Date(data.lastReset).getTime() : 0;
                if (Date.now() - lastReset > 24 * 60 * 60 * 1000) {
                    console.log('🔄 Kuota harian IP proxy direset otomatis (24 jam berlalu).');
                    return this.createNewState();
                }
                return data;
            }
        } catch (e) {}
        return this.createNewState();
    }

    createNewState() {
        const state = {
            lastReset: new Date().toISOString(),
            usage: {}
        };
        this.saveState(state);
        return state;
    }

    saveState(state = this.state) {
        try {
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
        } catch (e) {}
    }

    getProxyRecord(proxyStr) {
        if (!this.state.usage[proxyStr]) {
            this.state.usage[proxyStr] = {
                proxy: proxyStr,
                downloads: 0,
                exhausted: false,
                lastUsed: null
            };
        }
        return this.state.usage[proxyStr];
    }

    async getActiveProxy() {
        for (let i = 0; i < this.proxies.length; i++) {
            const idx = (this.currentIndex + i) % this.proxies.length;
            const p = this.proxies[idx];
            const record = this.getProxyRecord(p);
            if (!record.exhausted && record.downloads < this.maxPerIp) {
                this.currentIndex = idx;
                return p;
            }
        }

        // Ambil proxy publik baru jika seluruh IP di pool habis
        console.log('\n🌐 Seluruh IP guest mencapai batas (5/5). Mengambil proxy publik baru...');
        const fresh = await this.fetchPublicProxies(10);
        if (fresh.length > 0) {
            this.currentIndex = this.proxies.indexOf(fresh[0]);
            return fresh[0];
        }

        return null;
    }

    async rotate() {
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        return await this.getActiveProxy();
    }

    recordDownload(proxyStr) {
        if (!proxyStr || proxyStr === 'cache' || proxyStr === 'account') return;
        const rec = this.getProxyRecord(proxyStr);
        rec.downloads += 1;
        rec.lastUsed = new Date().toISOString();
        if (rec.downloads >= this.maxPerIp) {
            rec.exhausted = true;
            console.log(`       ⚠️ Kuota IP [${proxyStr}] telah mencapai 5/5.`);
        }
        this.saveState();
    }

    markExhausted(proxyStr, reason = 'Batas limit harian tercapai') {
        if (!proxyStr) return;
        const rec = this.getProxyRecord(proxyStr);
        rec.exhausted = true;
        rec.downloads = this.maxPerIp;
        rec.lastUsed = new Date().toISOString();
        console.log(`       ⛔ IP [${proxyStr}] ditandai habis: ${reason}`);
        this.saveState();
    }

    async fetchPublicProxies(limit = 10) {
        try {
            console.log('       📡 Menghubungi public proxy pool...');
            let list = [];
            try {
                const res = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3500&country=all&ssl=yes', { timeout: 8000 });
                if (typeof res.data === 'string') list = res.data.split('\n').map(s => s.trim()).filter(Boolean);
            } catch (e1) {
                try {
                    const fb = await axios.get('https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt', { timeout: 8000 });
                    if (typeof fb.data === 'string') list = fb.data.split('\n').map(s => s.trim()).filter(Boolean);
                } catch (e2) {}
            }

            const added = [];
            for (const item of list) {
                const p = item.startsWith('http') ? item : `http://${item}`;
                if (!this.proxies.includes(p)) {
                    this.proxies.push(p);
                    added.push(p);
                    if (added.length >= limit) break;
                }
            }

            if (added.length > 0) {
                console.log(`       ✅ Ditambahkan ${added.length} IP proxy baru ke daftar rotasi.`);
                fs.appendFileSync(this.proxyFile, '\n' + added.join('\n'), 'utf8');
                this.saveState();
                return added;
            }
        } catch (e) {}
        return [];
    }

    parseProxyConfig(proxyStr) {
        if (!proxyStr || proxyStr === 'direct') return null;
        try {
            const url = new URL(proxyStr.startsWith('http') ? proxyStr : `http://${proxyStr}`);
            const config = {
                protocol: url.protocol.replace(':', ''),
                host: url.hostname,
                port: parseInt(url.port, 10) || (url.protocol === 'https:' ? 443 : 80)
            };
            if (url.username || url.password) {
                config.auth = {
                    username: decodeURIComponent(url.username),
                    password: decodeURIComponent(url.password)
                };
            }
            return config;
        } catch (e) {
            return null;
        }
    }
}

class ConfigManager {
    constructor() {
        this.baseDir = __dirname;
        this.tmpDir = path.join(this.baseDir, 'tmp');
        this.configFile = path.join(this.tmpDir, 'z-library-config.json');
        this.ensureDir();
        this.config = this.loadConfig();
    }

    get cookies() {
        if (!this.config.cookies) {
            this.config.cookies = { siteLanguage: 'en' };
        }
        return this.config.cookies;
    }

    set cookies(val) {
        this.config.cookies = val;
    }

    ensureDir() {
        if (!fs.existsSync(this.tmpDir)) {
            fs.mkdirSync(this.tmpDir, { recursive: true });
        }
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                const data = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                if (!data.cookies) data.cookies = { siteLanguage: 'en' };
                if (!data.accounts) data.accounts = [];
                return data;
            }
        } catch (e) {}

        const def = {
            cookies: { siteLanguage: 'en' },
            activeAccount: null,
            accounts: []
        };
        this.saveConfig(def);
        return def;
    }

    saveConfig(cfg = this.config) {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(cfg, null, 2), 'utf8');
        } catch (e) {}
    }

    getAccountCookieHeader() {
        const cookies = {
            siteLanguage: 'en',
            ...(this.config.cookies || {})
        };

        // Jika ada active account
        if (this.config.activeAccount && this.config.activeAccount.key) {
            cookies['remix_userkey'] = this.config.activeAccount.key;
            cookies['remix_user_key'] = this.config.activeAccount.key;
            if (this.config.activeAccount.userid) {
                cookies['remix_userid'] = this.config.activeAccount.userid;
            }
        } else if (process.env.ZLIB_USER_KEY) {
            cookies['remix_userkey'] = process.env.ZLIB_USER_KEY;
            cookies['remix_user_key'] = process.env.ZLIB_USER_KEY;
            if (process.env.ZLIB_USER_ID) cookies['remix_userid'] = process.env.ZLIB_USER_ID;
        } else {
            const existingKey = cookies['remix_userkey'] || cookies['remix_user_key'];
            if (existingKey) {
                cookies['remix_userkey'] = existingKey;
                cookies['remix_user_key'] = existingKey;
            }
        }

        return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    getGuestCookieHeader() {
        const cookies = {
            siteLanguage: 'en',
            ...(this.config.cookies['c_token'] ? { c_token: this.config.cookies['c_token'] } : {})
        };
        return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    }

    setCookies(cookieMap) {
        this.config.cookies = {
            ...this.config.cookies,
            ...cookieMap
        };
        this.saveConfig();
    }

    addAccount(accountObj) {
        if (!this.config.accounts) this.config.accounts = [];
        const exists = this.config.accounts.find(a => a.email === accountObj.email || a.key === accountObj.key);
        if (!exists) {
            this.config.accounts.push(accountObj);
        } else {
            Object.assign(exists, accountObj);
        }
        this.config.activeAccount = accountObj;
        if (accountObj.key) {
            this.config.cookies['remix_userkey'] = accountObj.key;
            this.config.cookies['remix_user_key'] = accountObj.key;
        }
        if (accountObj.userid) this.config.cookies['remix_userid'] = accountObj.userid;
        this.saveConfig();
    }

    hasRegisteredAccount() {
        return Boolean(
            (this.config.activeAccount && this.config.activeAccount.key) ||
            this.config.cookies['remix_userkey'] ||
            this.config.cookies['remix_user_key'] ||
            process.env.ZLIB_USER_KEY
        );
    }

    rotateAccount() {
        if (!this.config.accounts || this.config.accounts.length <= 1) return null;
        const currentIdx = this.config.accounts.findIndex(a => a.email === this.config.activeAccount?.email);
        const nextIdx = (currentIdx + 1) % this.config.accounts.length;
        const nextAcc = this.config.accounts[nextIdx];
        this.config.activeAccount = nextAcc;
        this.config.cookies['remix_userkey'] = nextAcc.key;
        this.config.cookies['remix_user_key'] = nextAcc.key;
        if (nextAcc.userid) this.config.cookies['remix_userid'] = nextAcc.userid;
        this.saveConfig();
        console.log(`🔀 Merotasi ke Akun: ${nextAcc.email}`);
        return nextAcc;
    }
}

class ZLibrary {
    static baseUrl = 'https://z-library.biz';
    static config = new ConfigManager();
    static proxyManager = new ProxyManager();

    static getHeaders(referer = 'https://z-library.biz/') {
        return {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,ja;q=0.7',
            'Referer': referer,
            'Upgrade-Insecure-Requests': '1'
        };
    }

    /**
     * Menyelesaikan tantangan Proof-of-Work SHA-1 Z-Library (Status 503)
     */
    static solvePoW(html) {
        const seedMatch = html.match(/['"]([A-Fa-f0-9]{32,64})['"]/);
        if (!seedMatch) {
            throw new Error('Tidak dapat menemukan token seed PoW pada respon 503.');
        }

        const c = seedMatch[1];
        const n1 = parseInt(c[0], 16);
        let i = 0;

        while (true) {
            const hash = crypto.createHash('sha1').update(c + i).digest();
            if (hash[n1] === 0xb0 && hash[n1 + 1] === 0x0b) {
                return c + i;
            }
            i++;
        }
    }

    /**
     * Request wrapper umum
     * options.withAccount: boolean (default true jika akun ada)
     * options.proxy: string / proxy URL
     */
    static async request(url, options = {}) {
        const useAccount = options.withAccount !== false && this.config.hasRegisteredAccount();
        const cookieStr = useAccount ? this.config.getAccountCookieHeader() : this.config.getGuestCookieHeader();

        const headers = {
            ...this.getHeaders(options.referer || url),
            ...(cookieStr ? { 'Cookie': cookieStr } : {}),
            ...(options.headers || {})
        };

        const proxyConfig = options.proxy ? this.proxyManager.parseProxyConfig(options.proxy) : false;

        const axiosConfig = {
            url,
            method: options.method || 'GET',
            headers,
            data: options.data,
            proxy: proxyConfig,
            validateStatus: () => true,
            maxRedirects: options.maxRedirects !== undefined ? options.maxRedirects : 5,
            timeout: options.timeout || (options.proxy && options.proxy !== 'direct' ? 10000 : 25000),
            responseType: options.responseType || 'text'
        };

        const execAxios = async (cfg, retries = 3) => {
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    return await axios(cfg);
                } catch (err) {
                    const isReset = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' || (err.message && err.message.includes('ECONNRESET'));
                    if (isReset && attempt < retries) {
                        await new Promise(r => setTimeout(r, 500 * attempt));
                        continue;
                    }
                    throw err;
                }
            }
        };

        let response = await execAxios(axiosConfig);

        // Tangkap set-cookie
        if (response.headers['set-cookie']) {
            const newCookies = {};
            response.headers['set-cookie'].forEach(c => {
                const [pair] = c.split(';');
                const [k, v] = pair.split('=');
                if (k && v) newCookies[k.trim()] = v.trim();
            });
            this.config.setCookies(newCookies);
        }

        // Cek PoW 503
        if (response.status === 503 && typeof response.data === 'string' && response.data.includes('c_token=')) {
            const token = this.solvePoW(response.data);
            this.config.setCookies({ c_token: token });

            const updatedCookie = useAccount ? this.config.getAccountCookieHeader() : this.config.getGuestCookieHeader();
            axiosConfig.headers['Cookie'] = updatedCookie;
            response = await execAxios(axiosConfig);
        }

        return response;
    }

    /**
     * Login dan simpan session akun ke pool
     */
    static async login(email, password) {
        try {
            console.log(`🔐 Menghubungkan ke Z-Library untuk login (${email})...`);
            const params = new URLSearchParams();
            params.append('action', 'login');
            params.append('email', email);
            params.append('password', password);

            const res = await axios.post(`${this.baseUrl}/rpc.php`, params.toString(), {
                headers: {
                    ...this.getHeaders(`${this.baseUrl}/login`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                validateStatus: () => true
            });

            if (typeof res.data === 'string' && res.data.includes('Incorrect email or password')) {
                return { success: false, error: 'Email atau password salah.' };
            }

            const setCookie = res.headers['set-cookie'] || [];
            const sessionCookies = {};
            setCookie.forEach(c => {
                const [pair] = c.split(';');
                const [k, v] = pair.split('=');
                if (k && v) sessionCookies[k.trim()] = v.trim();
            });

            const userKey = sessionCookies['remix_userkey'] || sessionCookies['remix_user_key'];
            if (userKey) {
                const acc = {
                    email,
                    key: userKey,
                    userid: sessionCookies['remix_userid'] || '',
                    addedAt: new Date().toISOString()
                };
                this.config.addAccount(acc);
                return { success: true, account: acc };
            }

            return { success: false, error: 'Tidak mendapatkan token session remix_userkey dari server. Gunakan `node z-library-copy.js set-key <remix_userkey>` dari Developer Tools browser.' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Memverifikasi apakah session remix_userkey / remix_user_key aktif dan valid ke Z-Library
     */
    static async verifyAccountSession(key, userid = '') {
        try {
            console.log('🔍 Memverifikasi session akun ke server Z-Library...');
            if (key) {
                this.config.cookies['remix_userkey'] = key;
                this.config.cookies['remix_user_key'] = key;
            }
            if (userid) this.config.cookies['remix_userid'] = userid;

            const res = await this.request(this.baseUrl, { withAccount: true });

            if (res.status === 200) {
                const isGuest = res.data.includes('href="/login"') || res.data.includes('Sign In');
                return { valid: !isGuest, status: res.status };
            }
            return { valid: false, status: res.status, error: `HTTP ${res.status}` };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }

    /**
     * Membangun URL pencarian dengan filter lengkap
     */
    static buildSearchUrl(query, options = {}) {
        if (query.startsWith('http://') || query.startsWith('https://')) {
            const u = new URL(query);
            if (options.page && options.page > 1) {
                u.searchParams.set('page', options.page);
            }
            return u.toString();
        }

        const languages = Array.isArray(options.languages)
            ? options.languages
            : (options.lang && options.lang !== 'all' ? options.lang.split(',').map(s => s.trim()) : ['japanese']);

        const extensions = Array.isArray(options.extensions)
            ? options.extensions
            : (options.ext && options.ext !== 'all' ? options.ext.split(',').map(s => s.trim().toUpperCase()) : ['EPUB']);

        const contentTypes = Array.isArray(options.contentTypes)
            ? options.contentTypes
            : (options.type ? options.type.split(',').map(s => s.trim()) : ['book']);

        const params = new URLSearchParams();
        languages.forEach(l => params.append('languages[]', l));
        extensions.forEach(e => params.append('extensions[]', e));
        contentTypes.forEach(c => params.append('selected_content_types[]', c));

        if (options.yearFrom) params.append('year_from', options.yearFrom);
        if (options.yearTo) params.append('year_to', options.yearTo);
        if (options.year) {
            params.append('year_from', options.year);
            params.append('year_to', options.year);
        }
        if (options.exact) params.append('e', '1');
        if (options.page && options.page > 1) params.append('page', options.page);

        return `${this.baseUrl}/s/${encodeURIComponent(query)}?${params.toString()}`;
    }

    /**
     * Ekstrak metadata buku dari HTML halaman pencarian
     */
    static parseBooksFromHtml(html) {
        const $ = cheerio.load(html);
        const books = [];

        $('z-bookcard').each((_, el) => {
            const card = $(el);
            const id = card.attr('id') || '';
            const href = card.attr('href') || '';
            const download = card.attr('download') || '';
            const publisher = card.attr('publisher') || '';
            const language = card.attr('language') || '';
            const year = card.attr('year') || '';
            const extension = (card.attr('extension') || '').toUpperCase();
            const filesize = card.attr('filesize') || '';
            const rating = card.attr('rating') || '';
            const quality = card.attr('quality') || '';
            const isbn = card.attr('isbn') || '';

            const title = card.find('div[slot="title"]').text().trim();
            const author = card.find('div[slot="author"]').text().trim();
            const cover = card.find('img').attr('data-src') || card.find('img').attr('src') || '';

            if (title) {
                books.push({
                    id,
                    title,
                    author,
                    publisher,
                    year,
                    language,
                    extension,
                    filesize,
                    rating,
                    quality,
                    isbn,
                    cover,
                    bookUrl: href ? (href.startsWith('http') ? href : `${this.baseUrl}${href}`) : '',
                    downloadPath: download,
                    downloadUrl: download ? (download.startsWith('http') ? download : `${this.baseUrl}${download}`) : ''
                });
            }
        });

        let pagesTotal = 1;
        const pagerMatch = html.match(/var\s+pagerOptions\s*=\s*({[\s\S]*?});/);
        if (pagerMatch) {
            try {
                const ptMatch = pagerMatch[1].match(/pagesTotal\s*:\s*(\d+)/);
                if (ptMatch) pagesTotal = parseInt(ptMatch[1], 10);
            } catch (e) {}
        }

        return { books, pagesTotal };
    }

    /**
     * SEARCH (Search Biasa):
     * Cek berapa hasil & halaman yang ditemukan.
     * Menggunakan session akun agar bisa melihat semua buku (tanpa memotong kuota unduh).
     */
    static async search(query, options = {}) {
        try {
            const url = this.buildSearchUrl(query, { ...options, page: options.page || 1 });
            const res = await this.request(url, { withAccount: true });

            if (res.status !== 200) {
                return { success: false, error: `Gagal mengakses halaman search (Status: ${res.status})` };
            }

            const { books, pagesTotal } = this.parseBooksFromHtml(res.data);
            let filteredBooks = books;

            if (options.filterTitle) {
                filteredBooks = filteredBooks.filter(b => b.title.toLowerCase().includes(options.filterTitle.toLowerCase()));
            }
            if (options.author) {
                filteredBooks = filteredBooks.filter(b => b.author.toLowerCase().includes(options.author.toLowerCase()));
            }

            const approxTotal = pagesTotal > 1 ? `~${(pagesTotal - 1) * 50} - ${pagesTotal * 50}` : `${books.length}`;

            return {
                success: true,
                query,
                page: options.page || 1,
                pagesTotal,
                booksOnPage: books.length,
                filteredCount: filteredBooks.length,
                estimatedTotal: approxTotal,
                preview: filteredBooks.slice(0, 5),
                searchUrl: url
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * LOOKUP (Metadata Harvester):
     * Mengambil seluruh metadata buku di seluruh halaman (200+ buku dalam 1 run).
     * Menggunakan session akun (0 kuota unduh terpakai, buku tersembunyi tetap terlihat).
     */
    static async lookup(query, options = {}) {
        try {
            const activeAcc = this.config.config.activeAccount;
            const hasAcc = this.config.hasRegisteredAccount();
            const accountEmail = activeAcc?.email || (hasAcc ? 'Akun Terdaftar (Sesi Cookie)' : null);

            if (options.requireAccount && !hasAcc) {
                return {
                    success: false,
                    error: 'Lookup dibatalkan: Belum ada akun terdaftar yang aktif. Gunakan `node z-library-copy.js set-key <remix_userkey>`.'
                };
            }

            console.log(`🔍 Memulai Lookup untuk: "${query}"...`);
            if (hasAcc) {
                console.log(`👤 Sesi Akun       : 🟢 ${accountEmail} (remix_userkey disertakan di setiap halaman)`);
            } else {
                console.log(`👤 Sesi Akun       : ⚠️  Mode Tamu (Guest) - Daftarkan akun dengan: node z-library-copy.js set-key`);
            }

            const firstUrl = this.buildSearchUrl(query, { ...options, page: 1 });
            const firstRes = await this.request(firstUrl, { withAccount: true });

            if (firstRes.status !== 200) {
                return { success: false, error: `Gagal mengakses Z-Library (Status: ${firstRes.status})` };
            }

            const parsedFirst = this.parseBooksFromHtml(firstRes.data);
            const pagesTotal = parsedFirst.pagesTotal || 1;
            const maxPages = options.maxPages ? Math.min(options.maxPages, pagesTotal) : pagesTotal;

            console.log(`📄 Ditemukan ${pagesTotal} total halaman.`);
            console.log(`⏳ Mengumpulkan metadata dari halaman 1 s/d ${maxPages}...`);
            console.log(`   ➡️ [${accountEmail || 'Guest'}] Halaman 1/${maxPages}... +${parsedFirst.books.length} buku`);

            let allBooks = [...parsedFirst.books];

            for (let p = 2; p <= maxPages; p++) {
                process.stdout.write(`   ➡️ [${accountEmail || 'Guest'}] Halaman ${p}/${maxPages}... `);
                const pageUrl = this.buildSearchUrl(query, { ...options, page: p });
                const pageRes = await this.request(pageUrl, { withAccount: true });
                if (pageRes.status === 200) {
                    const parsed = this.parseBooksFromHtml(pageRes.data);
                    allBooks.push(...parsed.books);
                    console.log(`+${parsed.books.length} buku`);
                } else {
                    console.log(`(gagal status ${pageRes.status})`);
                }
                await new Promise(r => setTimeout(r, 250));
            }

            let resultBooks = allBooks;
            if (options.filterTitle) {
                resultBooks = resultBooks.filter(b => b.title.toLowerCase().includes(options.filterTitle.toLowerCase()));
            }
            if (options.author) {
                resultBooks = resultBooks.filter(b => b.author.toLowerCase().includes(options.author.toLowerCase()));
            }
            if (options.year) {
                resultBooks = resultBooks.filter(b => String(b.year) === String(options.year));
            }
            if (options.limit && options.limit > 0) {
                resultBooks = resultBooks.slice(0, options.limit);
            }

            const safeQuery = query.replace(/[<>:"/\\|?*]/g, '_').slice(0, 30);
            const savePath = options.savePath || path.join(__dirname, 'tmp', `lookup-${safeQuery}.json`);

            try {
                fs.writeFileSync(savePath, JSON.stringify(resultBooks, null, 2), 'utf8');
            } catch (e) {}

            return {
                success: true,
                query,
                usedAccount: hasAcc ? accountEmail : 'Mode Tamu (Guest)',
                totalPagesScanned: maxPages,
                totalDiscovered: allBooks.length,
                totalMatched: resultBooks.length,
                savedTo: savePath,
                data: resultBooks
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * HYBRID RESOLVE DOWNLOAD URL:
     * 1. Coba Guest IP Rotation terlebih dahulu (menghemat kuota akun 100%).
     * 2. Jika buku member-only atau butuh login -> beralih ke Akun Terdaftar!
     */
    static async resolveDownloadUrl(downloadPathOrUrl, options = {}) {
        let targetUrl = downloadPathOrUrl;
        if (!targetUrl.startsWith('http')) {
            if (!targetUrl.startsWith('/')) targetUrl = `/${targetUrl}`;
            targetUrl = `${this.baseUrl}${targetUrl}`;
        }

        const mode = options.mode || 'hybrid'; // 'hybrid' | 'account' | 'guest'

        // ==========================================
        // TIER 1: Coba sebagai Guest IP terlebih dahulu (Hemat Akun)
        // ==========================================
        if (mode === 'hybrid' || mode === 'guest') {
            const guestProxy = await this.proxyManager.getActiveProxy();
            if (guestProxy) {
                try {
                    const guestRes = await this.request(targetUrl, {
                        withAccount: false, // Tanpa cookie akun -> kuota akun tetap utuh!
                        proxy: guestProxy,
                        maxRedirects: 0
                    });

                    // Sukses redirect 302 -> dapat link CDN!
                    if (guestRes.status >= 300 && guestRes.status < 400 && guestRes.headers.location) {
                        const directUrl = guestRes.headers.location;
                        let filename = 'download.epub';
                        try {
                            const u = new URL(directUrl);
                            if (u.searchParams.get('filename')) {
                                filename = decodeURIComponent(u.searchParams.get('filename'));
                            }
                        } catch (e) {}

                        return {
                            success: true,
                            directUrl,
                            filename,
                            usedTier: 'guest',
                            proxyUsed: guestProxy
                        };
                    }

                    // Cek jika batas IP guest tercapai (Daily limit reached)
                    if (typeof guestRes.data === 'string' && (guestRes.data.includes('Daily limit') || guestRes.data.includes('limit reached'))) {
                        this.proxyManager.markExhausted(guestProxy, 'Daily limit reached (5/5)');
                        // Coba lagi dengan proxy guest berikutnya
                        return this.resolveDownloadUrl(downloadPathOrUrl, options);
                    }

                    // Cek jika buku memang butuh login (Member-only)
                    const isMemberOnly = typeof guestRes.data === 'string' && (
                        guestRes.data.includes('login') ||
                        guestRes.data.includes('Only registered users') ||
                        guestRes.data.includes('Sign in to download')
                    );

                    if (isMemberOnly) {
                        console.log('       🔒 Buku ini khusus member (membutuhkan akun). Mengalihkan ke Akun Utama...');
                    }
                } catch (guestErr) {
                    // Jika proxy timeout atau error koneksi, tandai dan coba lagi
                    this.proxyManager.markExhausted(guestProxy, guestErr.message);
                }
            }
        }

        // ==========================================
        // TIER 2: Eskalasi ke Akun Terdaftar (Jika butuh akun / fallback)
        // ==========================================
        if (mode === 'hybrid' || mode === 'account') {
            if (!this.config.hasRegisteredAccount()) {
                return {
                    success: false,
                    error: 'Buku memerlukan akun terdaftar, namun belum ada akun yang login. Gunakan `node z-library-copy.js login <email> <password>`.'
                };
            }

            const accountsCount = (this.config.config.accounts && this.config.config.accounts.length > 0)
                ? this.config.config.accounts.length
                : 1;
            const attemptedAccounts = options._attemptedAccounts || new Set();

            try {
                const currentAccountEmail = this.config.config.activeAccount?.email || 'Registered Account';
                attemptedAccounts.add(currentAccountEmail);

                const accRes = await this.request(targetUrl, {
                    withAccount: true, // Pakai sesi akun
                    maxRedirects: 0
                });

                if (accRes.status >= 300 && accRes.status < 400 && accRes.headers.location) {
                    const directUrl = accRes.headers.location;
                    let filename = 'download.epub';
                    try {
                        const u = new URL(directUrl);
                        if (u.searchParams.get('filename')) {
                            filename = decodeURIComponent(u.searchParams.get('filename'));
                        }
                    } catch (e) {}

                    return {
                        success: true,
                        directUrl,
                        filename,
                        usedTier: 'account',
                        accountEmail: currentAccountEmail
                    };
                }

                // Jika akun utama juga habis limit harian
                if (typeof accRes.data === 'string' && (accRes.data.includes('Daily limit') || accRes.data.includes('limit reached'))) {
                    // Cek apakah masih ada akun di pool yang belum dicoba
                    if (attemptedAccounts.size < accountsCount) {
                        const nextAcc = this.config.rotateAccount();
                        if (nextAcc && !attemptedAccounts.has(nextAcc.email)) {
                            console.log(`       🔄 Mencoba kembali dengan akun berikutnya: ${nextAcc.email}...`);
                            return this.resolveDownloadUrl(downloadPathOrUrl, {
                                ...options,
                                _attemptedAccounts: attemptedAccounts
                            });
                        }
                    }
                    return {
                        success: false,
                        error: `Batas limit harian seluruh akun terdaftar telah tercapai (${attemptedAccounts.size}/${accountsCount} akun habis).`
                    };
                }

                return {
                    success: false,
                    error: `Gagal mendapatkan link unduhan (Status: ${accRes.status})`
                };
            } catch (accErr) {
                return { success: false, error: accErr.message };
            }
        }

        return {
            success: false,
            error: 'Tidak dapat mengunduh buku (seluruh IP guest habis dan mode akun nonaktif).'
        };
    }

    /**
     * Mengunduh file buku ke folder tujuan
     */
    static async downloadBook(downloadPathOrUrl, outputDir = './downloads', options = {}) {
        try {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Smart Skip: Cek file lokal terlebih dahulu
            if (options.title) {
                const clean = options.title.replace(/[<>:"/\\|?*]/g, '_').trim();
                const prefix = clean.substring(0, 20);
                const existing = fs.readdirSync(outputDir).find(f => f.includes(prefix) && (f.endsWith('.epub') || f.endsWith('.pdf')));
                if (existing) {
                    const fullP = path.join(outputDir, existing);
                    const st = fs.statSync(fullP);
                    if (st.size > 1024) {
                        return {
                            success: true,
                            skipped: true,
                            filename: existing,
                            filePath: fullP,
                            size: `${(st.size / (1024 * 1024)).toFixed(2)} MB`,
                            tier: 'local-cache'
                        };
                    }
                }
            }

            // Dapatkan link direct CDN via Hybrid Tiering
            const resolved = await this.resolveDownloadUrl(downloadPathOrUrl, options);
            if (!resolved.success || !resolved.directUrl) {
                return { success: false, error: resolved.error || 'Gagal memperoleh link download.' };
            }

            const safeName = resolved.filename.replace(/[<>:"/\\|?*]/g, '_');
            const savePath = path.join(outputDir, safeName);

            if (fs.existsSync(savePath)) {
                const st = fs.statSync(savePath);
                if (st.size > 1024) {
                    return {
                        success: true,
                        skipped: true,
                        filename: resolved.filename,
                        filePath: savePath,
                        size: `${(st.size / (1024 * 1024)).toFixed(2)} MB`,
                        tier: 'local-cache'
                    };
                }
            }

            // Stream CDN langsung tanpa hambatan
            const dlRes = await axios({
                url: resolved.directUrl,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Referer': this.baseUrl
                },
                timeout: 60000
            });

            const writer = fs.createWriteStream(savePath);
            dlRes.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const stats = fs.statSync(savePath);

            // Catat penggunaan IP jika unduhan berhasil melalui guest
            if (resolved.usedTier === 'guest') {
                this.proxyManager.recordDownload(resolved.proxyUsed);
            }

            return {
                success: true,
                skipped: false,
                filename: resolved.filename,
                filePath: savePath,
                size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
                tier: resolved.usedTier,
                info: resolved.usedTier === 'guest' ? `IP Guest [${resolved.proxyUsed}] (Akun UTUH 0/10)` : `Akun [${resolved.accountEmail}]`
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
}

/**
 * ============================================================================
 * CLI Argument Parser & Runner
 * ============================================================================
 */
function parseCLIArgs(argv) {
    const parsed = {
        command: argv[0] ? argv[0].toLowerCase() : 'help',
        query: '',
        extraArg: '',
        page: 1,
        maxPages: null,
        lookupMode: false,
        fromFile: '',
        all: false,
        exact: false,
        lang: 'japanese',
        ext: 'EPUB',
        type: 'book',
        filterTitle: '',
        author: '',
        year: null,
        yearFrom: null,
        yearTo: null,
        limit: null,
        index: null,
        output: path.join(__dirname, 'downloads'),
        mode: 'hybrid', // 'hybrid' (default) | 'account' | 'guest'
        requireAccount: false
    };

    const nonFlags = [];

    for (let i = 1; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--lookup') {
            parsed.lookupMode = true;
            if (argv[i + 1] && !argv[i + 1].startsWith('-')) {
                parsed.query = argv[++i];
            }
        } else if (arg === '--from-file' || arg === '--from-lookup') {
            parsed.fromFile = argv[++i];
        } else if (arg === '--all') {
            parsed.all = true;
        } else if (arg === '--require-account') {
            parsed.requireAccount = true;
        } else if (arg === '--mode') {
            parsed.mode = argv[++i];
        } else if (arg === '--account-only') {
            parsed.mode = 'account';
        } else if (arg === '--guest-only') {
            parsed.mode = 'guest';
        } else if (arg === '--exact') {
            parsed.exact = true;
        } else if (arg === '--lang' || arg === '--language') {
            parsed.lang = argv[++i];
        } else if (arg === '--ext' || arg === '--extension') {
            parsed.ext = argv[++i];
        } else if (arg === '--type') {
            parsed.type = argv[++i];
        } else if (arg === '--page' || arg === '-p') {
            parsed.page = parseInt(argv[++i], 10) || 1;
        } else if (arg === '--pages') {
            parsed.maxPages = parseInt(argv[++i], 10) || 1;
        } else if (arg === '--filter' || arg === '--title') {
            parsed.filterTitle = argv[++i];
        } else if (arg === '--author') {
            parsed.author = argv[++i];
        } else if (arg === '--year') {
            parsed.year = argv[++i];
        } else if (arg === '--year-from') {
            parsed.yearFrom = argv[++i];
        } else if (arg === '--year-to') {
            parsed.yearTo = argv[++i];
        } else if (arg === '--limit' || arg === '-l') {
            parsed.limit = parseInt(argv[++i], 10);
        } else if (arg === '--index' || arg === '-i') {
            parsed.index = argv[++i];
        } else if (arg === '--output' || arg === '-o') {
            parsed.output = argv[++i];
        } else if (!arg.startsWith('-')) {
            nonFlags.push(arg);
        }
    }

    if (!parsed.query && nonFlags[0]) {
        parsed.query = nonFlags[0];
    }
    if (nonFlags[1]) {
        parsed.extraArg = nonFlags[1];
    }
    parsed.allArgs = nonFlags;

    return parsed;
}

function showHelp() {
    console.log(`
================================================================================
📚 Z-LIBRARY SMART TIERING TOOL (Next-Gen Edition)
================================================================================

💡 CARA PENGGUNAAN:
   node z-library-copy.js <command> [query/target] [options]

--------------------------------------------------------------------------------
1. COMMAND: SEARCH (Quick Count & Status)
   Cek berapa total hasil & halaman buku yang ditemukan (Memakai Akun, 0 kuota).
   node z-library-copy.js search "魔女の旅々"
   node z-library-copy.js search "魔女の旅々" --filter "GAノベル"

--------------------------------------------------------------------------------
2. COMMAND: LOOKUP (Metadata Harvester)
   Ambil seluruh metadata semua buku (ukuran file, penerbit, URL, tahun, dll)
   dalam 1x jalan di seluruh halaman (200+ buku). Tersimpan di tmp/.
   node z-library-copy.js lookup "魔女の旅々"
   node z-library-copy.js lookup "魔女の旅々" --filter "GAノベル"

--------------------------------------------------------------------------------
3. COMMAND: DOWNLOAD (Hybrid Smart-Tiering Downloader)
   ⚡ SISTEM HEMAT KUOTA:
   - Menggunakan IP Acak / Proxy Guest terlebih dahulu (5 unduhan per IP).
   - Kuota akun utama TETAP UTUH (0/10) untuk buku-buku umum!
   - Otomatis beralih ke Akun Terdaftar hanya jika buku butuh login (Member-only).

   Mode A: Unduh dari Hasil Lookup
   node z-library-copy.js download --lookup "魔女の旅々" --limit 5
   node z-library-copy.js download --lookup "魔女の旅々" --filter "GAノベル" --all
   node z-library-copy.js download --lookup "魔女の旅々" --index 1,2,5

   Mode B: Unduh Langsung via URL / Path
   node z-library-copy.js download /dl/oWwrvOyPVv
   node z-library-copy.js download "https://z-library.biz/book/2KLDjPEWKB/..."

   Opsi Mode Unduh:
   --mode hybrid     : (Default) Guest IP dulu -> Akun jika butuh login
   --account-only    : Paksa pakai akun utama
   --guest-only      : Paksa hanya pakai guest IP (jangan pakai akun)

--------------------------------------------------------------------------------
4. COMMAND: ACCOUNT & PROXY POOL
   node z-library-copy.js set-key <remix_userkey> [remix_userid] [email]
   node z-library-copy.js set-cookie "<cookie_string>" (Set cookie dari DevTools browser)
   node z-library-copy.js login <email> <password>     (Login langsung via API)
   node z-library-copy.js add-account <email> <pass>   (Tambah akun ke multi-account pool)
   node z-library-copy.js account                      (Lihat status akun & pool)
   node z-library-copy.js ips                          (Lihat kuota IP proxy aktif)

--------------------------------------------------------------------------------
🏷️  FILTER SEARCH (Dapat Dikombinasikan):
   --lang <bahasa>        : japanese (default), english, all
   --ext <format>         : EPUB (default), pdf, all
   --type <tipe>          : book (default), article
   --filter <kata_kunci>  : Filter judul buku yang cocok (misal: "GAノベル")
   --author <penulis>     : Filter nama penulis
   --year <tahun>         : Filter tahun spesifik (misal: 2024)
   --limit <jumlah>       : Batasi jumlah item
   --output <folder>      : Folder penyimpanan download (default: ./downloads)
================================================================================
`);
}

async function runCLI() {
    const argv = process.argv.slice(2);
    if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help' || argv[0] === '-h') {
        showHelp();
        return;
    }

    const parsed = parseCLIArgs(argv);
    const { command } = parsed;

    if (command === 'search') {
        const query = parsed.query || '魔女の旅々';
        const activeAcc = ZLibrary.config.config.activeAccount;
        const hasAcc = ZLibrary.config.hasRegisteredAccount();
        const accEmail = activeAcc?.email || (hasAcc ? 'Terdaftar (Cookie Sesi)' : null);

        console.log('==================================================');
        console.log('🔍 Z-Library Quick Search');
        console.log('==================================================');
        console.log(`📌 Query : "${query}" (Halaman: ${parsed.page})`);
        console.log(`🏷️  Filter: Bahasa: ${parsed.lang} | Format: ${parsed.ext} | Tipe: ${parsed.type}${parsed.filterTitle ? ` | Filter Judul: "${parsed.filterTitle}"` : ''}`);
        if (hasAcc) {
            console.log(`👤 Akun  : 🟢 ${accEmail} (Sesi Aktif - 0 kuota unduh terpakai)\n`);
        } else {
            console.log(`👤 Akun  : ⚠️  Mode Tamu / Guest (Buku member-only mungkin tersembunyi)\n`);
        }

        const res = await ZLibrary.search(query, parsed);

        if (!res.success) {
            return console.log('❌ Gagal melakukan pencarian:', res.error);
        }

        console.log('📊 HASIL PENCARIAN:');
        console.log(`   📄 Total Halaman Ditemukan : ${res.pagesTotal} halaman`);
        console.log(`   📦 Buku di Halaman Ini     : ${res.booksOnPage} buku`);
        console.log(`   📚 Estimasi Total Hasil    : ${res.estimatedTotal} buku`);
        if (parsed.filterTitle) {
            console.log(`   🎯 Cocok dengan Filter     : ${res.filteredCount} buku`);
        }

        console.log('\n📖 Preview Beberapa Buku Teratas:');
        res.preview.forEach((b, i) => {
            console.log(`   [${i + 1}] ${b.title}`);
            console.log(`       👤 ${b.author || '-'} | 🏢 ${b.publisher || '-'} (${b.year || '-'}) | 📦 ${b.extension} (${b.filesize})`);
        });

        console.log('\n💡 TIPS LANGKAH SELANJUTNYA:');
        console.log(`   - Ambil seluruh metadata (${res.estimatedTotal} buku):`);
        console.log(`     node z-library-copy.js lookup "${query}"${parsed.filterTitle ? ` --filter "${parsed.filterTitle}"` : ''}`);
        console.log(`   - Unduh buku dari hasil ini:`);
        console.log(`     node z-library-copy.js download --lookup "${query}"${parsed.filterTitle ? ` --filter "${parsed.filterTitle}"` : ''} --limit 3`);

    } else if (command === 'lookup') {
        const query = parsed.query || '魔女の旅々';
        const activeAcc = ZLibrary.config.config.activeAccount;
        const hasAcc = ZLibrary.config.hasRegisteredAccount();
        const accEmail = activeAcc?.email || (hasAcc ? 'Terdaftar (Cookie Sesi)' : null);

        console.log('==================================================');
        console.log('📚 Z-Library Metadata Harvester (Lookup)');
        console.log('==================================================');
        console.log(`📌 Query : "${query}"`);
        console.log(`🏷️  Filter: Bahasa: ${parsed.lang} | Format: ${parsed.ext} | Tipe: ${parsed.type}${parsed.filterTitle ? ` | Filter Judul: "${parsed.filterTitle}"` : ''}`);
        if (hasAcc) {
            console.log(`👤 Akun  : 🟢 ${accEmail} (Sesi Aktif - 0 kuota unduh terpakai)\n`);
        } else {
            console.log(`👤 Akun  : ⚠️  Mode Tamu / Guest (Buku member-only mungkin tersembunyi)\n`);
        }

        const res = await ZLibrary.lookup(query, parsed);

        if (!res.success) {
            return console.log('❌ Gagal melakukan lookup metadata:', res.error);
        }

        console.log('\n==================================================');
        console.log(`🎉 Lookup Selesai!`);
        console.log(`   👤 Sesi Akun Digunakan   : ${res.usedAccount} (0 Kuota Terpakai)`);
        console.log(`   📄 Total Halaman Di-scan : ${res.totalPagesScanned}`);
        console.log(`   📚 Total Buku Ditemukan  : ${res.totalDiscovered} buku`);
        console.log(`   🎯 Total Cocok Filter    : ${res.totalMatched} buku`);
        console.log(`   💾 Tersimpan di JSON     : ${res.savedTo}`);
        console.log('==================================================\n');

        res.data.slice(0, 30).forEach((b, i) => {
            console.log(`[${i + 1}] ${b.title}`);
            console.log(`    👤 Penulis   : ${b.author || '-'}`);
            console.log(`    🏢 Penerbit  : ${b.publisher || '-'} (${b.year || '-'})`);
            console.log(`    📦 Format    : ${b.extension} (${b.filesize})`);
            console.log(`    🔗 Link Buku : ${b.bookUrl}`);
            console.log(`    📥 Download  : ${b.downloadUrl}`);
            console.log('--------------------------------------------------');
        });

        if (res.data.length > 30) {
            console.log(`... dan ${res.data.length - 30} buku lainnya tersimpan lengkap di file JSON.`);
        }

        console.log('\n💡 TIPS MENGUNDUH (Hemat Kuota Akun):');
        console.log(`   - Unduh semua buku ini: node z-library-copy.js download --lookup "${query}" --all`);
        console.log(`   - Unduh nomor tertentu : node z-library-copy.js download --lookup "${query}" --index 1,2,5`);

    } else if (command === 'download') {
        let booksToDownload = [];

        if (parsed.lookupMode || parsed.fromFile || (parsed.query && !parsed.query.startsWith('http') && !parsed.query.startsWith('/dl/'))) {
            let dataList = [];
            const safeQuery = (parsed.query || '').replace(/[<>:"/\\|?*]/g, '_').slice(0, 30);
            const defaultLookupJson = path.join(__dirname, 'tmp', `lookup-${safeQuery}.json`);

            if (parsed.fromFile && fs.existsSync(parsed.fromFile)) {
                console.log(`📂 Memuat data lookup dari file: ${parsed.fromFile}`);
                dataList = JSON.parse(fs.readFileSync(parsed.fromFile, 'utf8'));
            } else if (fs.existsSync(defaultLookupJson)) {
                console.log(`📂 Memuat cache lookup dari: ${defaultLookupJson}`);
                dataList = JSON.parse(fs.readFileSync(defaultLookupJson, 'utf8'));
            } else {
                console.log(`🔍 Cache lookup belum ada. Menjalankan lookup terlebih dahulu untuk "${parsed.query}"...`);
                const lookupRes = await ZLibrary.lookup(parsed.query, parsed);
                if (!lookupRes.success || lookupRes.data.length === 0) {
                    return console.log('❌ Tidak ada buku yang ditemukan untuk diunduh.');
                }
                dataList = lookupRes.data;
            }

            if (parsed.filterTitle) {
                dataList = dataList.filter(b => b.title.toLowerCase().includes(parsed.filterTitle.toLowerCase()));
            }
            if (parsed.year) {
                dataList = dataList.filter(b => String(b.year) === String(parsed.year));
            }

            if (parsed.index) {
                const indices = parsed.index.split(',').map(s => parseInt(s.trim(), 10) - 1).filter(n => !isNaN(n));
                booksToDownload = indices.map(idx => dataList[idx]).filter(Boolean);
            } else if (parsed.limit && parsed.limit > 0) {
                booksToDownload = dataList.slice(0, parsed.limit);
            } else if (parsed.all) {
                booksToDownload = dataList;
            } else {
                booksToDownload = dataList.slice(0, 1);
                console.log('ℹ️  Tips: Tambahkan flag `--all` untuk mengunduh semua, atau `--limit <n>` / `--index 1,2,3`.');
            }

            console.log(`\n🚀 Memulai Proses Unduhan (${booksToDownload.length} buku)...`);
            console.log(`📁 Folder Tujuan : ${parsed.output}`);
            console.log(`🛡️  Mode Unduhan  : ${parsed.mode.toUpperCase()} (Guest IP acak dulu -> Akun jika butuh login)\n`);

            let success = 0, skipped = 0, failed = 0;

            for (let i = 0; i < booksToDownload.length; i++) {
                const b = booksToDownload[i];
                console.log(`--------------------------------------------------`);
                console.log(`[${i + 1}/${booksToDownload.length}] 📖 ${b.title}`);
                console.log(`       📦 Format: ${b.extension} | Ukuran: ${b.filesize} | Tahun: ${b.year || '-'}`);

                const dlRes = await ZLibrary.downloadBook(b.downloadPath, parsed.output, {
                    title: b.title,
                    mode: parsed.mode
                });

                if (dlRes.success) {
                    if (dlRes.skipped) {
                        skipped++;
                        console.log(`       ⏩ File sudah ada di disk, dilewati.`);
                    } else {
                        success++;
                        console.log(`       ✅ Selesai diunduh! (${dlRes.size}) [Jalur: ${dlRes.info}]`);
                        console.log(`       💾 Disimpan: ${dlRes.filePath}`);
                    }
                } else {
                    failed++;
                    console.log(`       ❌ Gagal mengunduh: ${dlRes.error}`);
                }

                if (i < booksToDownload.length - 1) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            console.log(`\n==================================================`);
            console.log(`🎉 Proses Unduh Selesai!`);
            console.log(`   ✅ Berhasil diunduh : ${success} file`);
            console.log(`   ⏩ Dilewati (ada)   : ${skipped} file`);
            console.log(`   ❌ Gagal            : ${failed} file`);
            console.log(`   📁 Folder           : ${parsed.output}`);
            console.log(`==================================================\n`);

        } else {
            const target = parsed.query;
            if (!target) {
                return console.log('❌ Masukkan URL, ID buku, atau download path.\nContoh: node z-library-copy.js download /dl/oWwrvOyPVv');
            }

            console.log(`⏳ Mempersiapkan unduhan langsung untuk: ${target}...`);
            const res = await ZLibrary.downloadBook(target, parsed.output, { mode: parsed.mode });

            if (res.success) {
                console.log(`\n🎉 Unduhan Selesai!`);
                console.log(`   📁 File   : ${res.filename}`);
                console.log(`   💾 Lokasi : ${res.filePath}`);
                console.log(`   📊 Ukuran : ${res.size}`);
                console.log(`   🛡️  Jalur  : ${res.info}`);
            } else {
                console.log(`\n❌ Gagal mengunduh:`, res.error);
            }
        }

    } else if (command === 'login' || command === 'add-account') {
        const email = parsed.query;
        const password = parsed.extraArg;

        if (!email || !password) {
            console.log('❌ Masukkan email dan password akun Z-Library Anda.');
            console.log('Format : node z-library-copy.js login <email> <password>');
            console.log('\n💡 Atau gunakan Cookie Manual jika login otomatis dicegat anti-bot:');
            console.log('   node z-library-copy.js set-key <remix_userkey> [remix_userid] [email]');
            return;
        }

        const res = await ZLibrary.login(email, password);
        if (res.success) {
            console.log('✅ Akun Berhasil Ditambahkan ke Pool!');
            console.log(`📧 Email : ${res.account.email}`);
            console.log(`Disimpan ke: tmp/z-library-config.json`);
        } else {
            console.log('❌ Login Gagal:', res.error);
            console.log('\n💡 SOLUSI REKOMENDASI (Karena Z-Library memproteksi login dengan Cloudflare):');
            console.log('   1. Buka browser dan login ke https://z-library.biz');
            console.log('   2. Tekan F12 -> tab "Application" -> Cookies -> https://z-library.biz');
            console.log('   3. Salin nilai cookie "remix_userkey"');
            console.log('   4. Jalankan: node z-library-copy.js set-key <remix_userkey> [remix_userid] ' + email);
        }

    } else if (command === 'set-cookie' || command === 'set-key') {
        const rawArg = parsed.query;
        if (!rawArg) {
            console.log('================================================================================');
            console.log('🔑 Panduan Memasukkan Cookie / Session Key Manual Z-Library');
            console.log('================================================================================');
            console.log('Karena Z-Library memproteksi form web login dengan sistem anti-bot,');
            console.log('cara paling aman & 100% berhasil adalah menyalin session dari browser Anda:\n');
            console.log('1. Buka https://z-library.biz di browser Anda dan pastikan sudah LOGIN.');
            console.log('2. Tekan F12 di keyboard (Developer Tools) -> Pilih tab "Application" (atau "Storage").');
            console.log('3. Di panel sebelah kiri, klik "Cookies" -> klik "https://z-library.biz".');
            console.log('4. Temukan 2 cookie berikut:');
            console.log('   - remix_userkey : (contoh: 4b600a98f1234567890abcdef...)');
            console.log('   - remix_userid  : (contoh: 12345678) [opsional]\n');
            console.log('5. Jalankan perintah di terminal:');
            console.log('   node z-library-copy.js set-key <remix_userkey> [remix_userid] [email]\n');
            console.log('   Contoh:');
            console.log('   node z-library-copy.js set-key 4b600a98f1234567890abcdef 12345678 abiandriansyah11@gmail.com\n');
            console.log('Atau jika menyalin format Cookie Header lengkap:');
            console.log('   node z-library-copy.js set-cookie "remix_userkey=4b600...; remix_userid=12345"');
            console.log('================================================================================');
            return;
        }

        let userKey = '';
        let userId = '';
        let email = '';

        if (rawArg.includes('remix_user_key=') || rawArg.includes('remix_userkey=')) {
            // Format string cookie lengkap
            const parts = rawArg.split(';');
            const map = {};
            for (const p of parts) {
                const [k, v] = p.split('=');
                if (k && v) map[k.trim()] = v.trim();
            }
            userKey = map['remix_userkey'] || map['remix_user_key'] || '';
            userId = map['remix_userid'] || map['remix_user_id'] || '';
        } else {
            // Format parameter terpisah: set-key <key> [userid] [email]
            userKey = rawArg;
            if (parsed.extraArg) {
                if (parsed.extraArg.includes('@')) {
                    email = parsed.extraArg;
                } else {
                    userId = parsed.extraArg;
                }
            }
            if (parsed.allArgs && parsed.allArgs[2]) {
                const third = parsed.allArgs[2];
                if (third.includes('@')) {
                    email = third;
                } else if (!userId) {
                    userId = third;
                }
            }
            if (parsed.allArgs && parsed.allArgs[3] && !email && parsed.allArgs[3].includes('@')) {
                email = parsed.allArgs[3];
            }
        }

        if (!userKey) {
            console.log('❌ remix_userkey tidak ditemukan dalam input.');
            return;
        }

        email = email || 'abiandriansyah11@gmail.com';

        const acc = {
            email,
            key: userKey,
            userid: userId,
            addedAt: new Date().toISOString()
        };

        ZLibrary.config.addAccount(acc);
        console.log('==================================================');
        console.log('✅ Session Akun Berhasil Disimpan!');
        console.log('==================================================');
        console.log(`📧 Email          : ${email}`);
        console.log(`🔑 remix_userkey  : ${userKey.slice(0, 10)}...${userKey.slice(-6)}`);
        if (userId) console.log(`🆔 remix_userid   : ${userId}`);
        console.log(`💾 Disimpan ke    : tmp/z-library-config.json\n`);

        const check = await ZLibrary.verifyAccountSession(userKey, userId);
        if (check.valid) {
            console.log('🟢 Status Akun    : TERVERIFIKASI & AKTIF! (Siap dipakai untuk Search & Download)');
        } else {
            console.log('⚠️  Catatan        : Session disimpan, namun server Z-Library masih mendeteksi mode guest.');
            console.log('                     Pastikan remix_userkey disalin saat browser sedang dalam kondisi Login.');
        }
        console.log('==================================================\n');

    } else if (command === 'account' || command === 'accounts') {
        const cfg = ZLibrary.config.config;
        console.log('==================================================');
        console.log('👤 Status Akun & Pool Akun Z-Library');
        console.log('==================================================');
        console.log(`🟢 Akun Aktif Saat Ini : ${cfg.activeAccount?.email || 'Belum ada (Mode Tamu)'}`);
        console.log(`🔑 Key Aktif           : ${cfg.activeAccount?.key ? 'Tersedia' : 'Tidak ada'}`);
        console.log(`📦 Total Akun di Pool  : ${(cfg.accounts || []).length} akun\n`);

        if (cfg.accounts && cfg.accounts.length > 0) {
            console.log('Daftar Akun di Pool:');
            cfg.accounts.forEach((a, i) => {
                const badge = a.email === cfg.activeAccount?.email ? '⭐ [AKTIF]' : '';
                console.log(` [${i + 1}] ${a.email} ${badge}`);
            });
        }

        console.log('\n💡 TIPS:');
        console.log('   - Tambah akun ke pool : node z-library-copy.js add-account <email> <password>');
        console.log('   - Lihat kuota IP proxy: node z-library-copy.js ips');

    } else if (command === 'ips') {
        const pm = ZLibrary.proxyManager;
        console.log('==================================================');
        console.log('🌐 Status Kuota Tiap IP Guest (Batas 5 per IP)');
        console.log('==================================================');
        console.log(`📅 Terakhir Reset : ${pm.state.lastReset}\n`);
        pm.proxies.forEach((p, idx) => {
            const rec = pm.getProxyRecord(p);
            const remaining = Math.max(0, pm.maxPerIp - rec.downloads);
            const badge = rec.exhausted || rec.downloads >= pm.maxPerIp ? '🔴 HABIS (5/5)' : `🟢 AKTIF (${rec.downloads}/5)`;
            console.log(` [${idx + 1}] ${p}`);
            console.log(`     Status       : ${badge} | Sisa: ${remaining} unduhan`);
            console.log(`     Terakhir     : ${rec.lastUsed || 'Belum pernah'}`);
        });
        console.log('\n💡 Kuota akun utama 100% aman selama buku diunduh lewat IP Guest!');
    } else {
        showHelp();
    }
}

module.exports = ZLibrary;

if (require.main === module) {
    runCLI();
}
