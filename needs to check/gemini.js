/**
 * CLI Tool: gemini.js
 * Source: plugins/gemini.js
 */

const axios = require('axios');
const readline = require('readline');

class GeminiAIScraper {
  static async ask(prompt) {
    try {
      // Primary: gemini-g4f module dynamic import
      try {
        const { Gemini } = await import("gemini-g4f");
        const gemini = new Gemini("");
        const res = await gemini.ask(prompt, { model: "gemini-1.5-pro-latest" });
        if (res) return { success: true, text: res };
      } catch (e) {
        // Fallback to web API
      }

      // Fallback: Free Gemini endpoint
      const response = await axios.get(`https://restapii.rioooxdzz.web.id/api/gemini?message=${encodeURIComponent(prompt)}`);
      if (response.data && (response.data.data?.response || response.data.result)) {
        return {
          success: true,
          text: response.data.data?.response || response.data.result
        };
      }

      return { success: false, error: 'Gagal mendapatkan respon dari AI Gemini.' };
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
    console.log(`            GEMINI AI CLI               `);
    console.log(`========================================`);
    console.log(`Penggunaan: node "needs to check/gemini.js" <pertanyaan>\n`);

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Masukkan pertanyaan untuk Gemini AI: ', async (input) => {
      rl.close();
      if (!input.trim()) return;
      await handleAsk(input.trim());
    });
    return;
  }

  await handleAsk(prompt);
}

async function handleAsk(prompt) {
  console.log(`🤖 Gemini AI sedang berpikir...`);
  const res = await GeminiAIScraper.ask(prompt);

  if (!res.success) {
    console.log(`❌ Error: ${res.error}`);
    return;
  }

  console.log('\n================ GEMINI AI RESPONSE ================');
  console.log(res.text);
  console.log('====================================================');
}

if (require.main === module) {
  runCLI();
}

module.exports = GeminiAIScraper;
