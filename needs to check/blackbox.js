/**
 * CLI Tool: blackbox.js
 * Source: plugins/blackbox.js
 */

const axios = require('axios');
const { randomBytes, randomUUID } = require('crypto');
const readline = require('readline');

class BlackBoxAIScraper {
  static cleanText(text) {
    if (!text) return '';
    return text.replace(/\$\$(.*?)\$\$/g, '').trim();
  }

  static async chat(prompt, model = 'blackbox') {
    const api = 'https://api.blackbox.ai/api/chat';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Referer': 'https://www.blackbox.ai/',
      'Content-Type': 'application/json',
      'Origin': 'https://www.blackbox.ai'
    };

    const modelConfig = {
      'blackbox': {},
      'gpt-4o': { userSelectedModel: 'gpt-4o' },
      'claude-3.5-sonnet': { userSelectedModel: 'claude-sonnet-3.5' },
      'gemini-pro': { userSelectedModel: 'gemini-pro' },
      'llama-3.1-405b': { trendingAgentMode: { mode: true, id: 'llama-3.1-405b' } }
    };

    const selectedConfig = modelConfig[model] || {};

    const payload = {
      messages: [{ role: 'user', content: prompt }],
      id: randomBytes(16).toString('hex'),
      userId: randomUUID(),
      previewToken: null,
      codeModelMode: true,
      agentMode: {},
      ...selectedConfig,
      isMicMode: false,
      isChromeExt: false,
      githubToken: null,
      webSearchMode: true,
      maxTokens: 100000,
      playgroundTemperature: 0.7,
      playgroundTopP: 0.9,
      validated: "69783381-2ce4-4dbd-ac78-35e9063feabc"
    };

    try {
      const response = await axios.post(api, payload, { headers });
      const reply = BlackBoxAIScraper.cleanText(response.data);
      return { success: true, text: reply };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

async function runCLI() {
  const args = process.argv.slice(2);
  const prompt = args.join(' ');

  if (!prompt) {
    console.log(`\n========================================`);
    console.log(`          BLACKBOX AI CLI               `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/blackbox.js" <pertanyaan>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan pertanyaan untuk BlackBox AI: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleAsk(input.trim());
    });
    return;
  }

  await handleAsk(prompt);
}

async function handleAsk(prompt) {
  console.log(`💻 BlackBox AI sedang memproses kode/jawaban...`);
  const res = await BlackBoxAIScraper.chat(prompt);

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  console.log('\n================ BLACKBOX AI RESPONSE ================');
  console.log(res.text);
  console.log('======================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = BlackBoxAIScraper;
