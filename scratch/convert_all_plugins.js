const fs = require('fs');
const path = require('path');

const pluginsDir = path.join(__dirname, '..', 'plugins');
const targetDir = path.join(__dirname, '..', 'needs to check');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
console.log(`Found ${files.length} plugins to convert.`);

let convertedCount = 0;
let errorCount = 0;

for (const file of files) {
    try {
        const srcPath = path.join(pluginsDir, file);
        const destPath = path.join(targetDir, file);
        let code = fs.readFileSync(srcPath, 'utf8');

        // Derive class/module name from filename
        const baseName = path.basename(file, '.js')
            .replace(/^[^a-zA-Z0-9]+/, '')
            .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
        const className = (baseName ? baseName.charAt(0).toUpperCase() + baseName.slice(1) : 'Plugin') + 'Scraper';

        // Check if code already contains CLI structure or module export
        let newCode = '';

        if (code.includes('runCLI') || (code.includes('require.main === module') && code.includes('class '))) {
            // Already converted / CLI ready, just move/copy to targetDir
            newCode = code;
        } else {
            // Transform plugin code into standalone CLI compatible format
            // Wrap mock conn / m if handler is exported
            newCode = `/**
 * CLI Tool: ${file}
 * Converted from plugins/${file}
 */

const readline = require('readline');

${code}

// Auto-generated CLI runner wrapper
async function runCLI() {
    const args = process.argv.slice(2);
    const input = args.join(' ');
    
    // Create mock Baileys message & conn context for CLI execution
    const mockConn = {
        sendMessage: async (jid, content, options) => {
            if (typeof content === 'string') {
                console.log('\\n[RESPONSE]', content);
            } else if (content.text) {
                console.log('\\n[RESPONSE]', content.text);
            } else if (content.caption) {
                console.log('\\n[CAPTION]', content.caption);
                if (content.image) console.log('[IMAGE URL]', content.image.url || content.image);
                if (content.video) console.log('[VIDEO URL]', content.video.url || content.video);
                if (content.document) console.log('[DOC URL]', content.document.url || content.document);
            } else {
                console.log('\\n[RESPONSE MEDIA/DATA]', content);
            }
            return { key: { id: 'cli_msg_id' } };
        },
        reply: async (jid, text, quoted) => {
            console.log('\\n[REPLY]', text);
        },
        sendFile: async (jid, url, filename, caption, quoted) => {
            console.log(\`\\n[SEND FILE] \${filename}: \${url}\`);
            if (caption) console.log('[CAPTION]', caption);
        }
    };

    const mockM = {
        chat: 'cli@terminal',
        key: { id: 'cli_key' },
        sender: 'cli@user',
        reply: (text) => console.log('\\n[REPLY]', text),
        quoted: null
    };

    let handlerFunc = typeof module.exports === 'function' ? module.exports : (typeof handler !== 'undefined' ? handler : null);

    if (handlerFunc) {
        console.log(\`🚀 Running \${'${file}'} CLI...\`);
        if (!input) {
            console.log('ℹ️ Usage: node "needs to check/${file}" <input_argument>');
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question('Masukkan input / query: ', async (userInput) => {
                rl.close();
                if (!userInput) return console.log('❌ Input cancelled.');
                try {
                    await handlerFunc(mockM, {
                        conn: mockConn,
                        args: userInput.split(' '),
                        text: userInput,
                        usedPrefix: '.',
                        command: '${file.replace('.js', '')}'
                    });
                } catch (err) {
                    console.error('❌ Error executing plugin:', err);
                }
            });
        } else {
            try {
                await handlerFunc(mockM, {
                    conn: mockConn,
                    args: input.split(' '),
                    text: input,
                    usedPrefix: '.',
                    command: '${file.replace('.js', '')}'
                });
            } catch (err) {
                console.error('❌ Error executing plugin:', err);
            }
        }
    } else {
        console.log('ℹ️ Plugin file loaded successfully.');
    }
}

if (require.main === module) {
    runCLI();
}
`;
        }

        fs.writeFileSync(destPath, newCode, 'utf8');
        fs.unlinkSync(srcPath); // remove from plugins/ as moved to needs to check/
        convertedCount++;
    } catch (err) {
        console.error(`Failed to convert ${file}:`, err.message);
        errorCount++;
    }
}

console.log(`\n🎉 Conversion finished! Success: ${convertedCount}, Errors: ${errorCount}`);
