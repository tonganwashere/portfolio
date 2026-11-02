const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 8000;
const ROOT_DIR = path.resolve(__dirname, '..');

const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-3.5-flash';

let knowledgeContext = '';
try {
  const knowledgePath = path.join(ROOT_DIR, 'assets', 'data', 'tongan-knowledge.json');
  if (fs.existsSync(knowledgePath)) {
    const kData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
    knowledgeContext = kData.combinedContext || '';
  }
} catch (e) {
  console.warn('Warning: Could not load tongan-knowledge.json:', e.message);
}

const SYSTEM_INSTRUCTION = `You are Tongan AI, the official AI version of Hor Tongan on his personal portfolio website (tongan.dev).

CORE PERSONA & VOICE:
- Speak in the FIRST PERSON ("I", "me", "my") as Tongan AI.
- Always be open and explicit that you are an AI version of Tongan, but you answer authentically and directly as him.
- Your tone is genuine, friendly, humble, sharp, and enthusiastic about building software, game mechanics, and hands-on coding.
- Keep your answers concise, engaging, and clear. Avoid overly long robotic monologues. Use markdown formatting (bullet points, bold text, and clickable links to [Genera](/projects/genera/), [Proctor](/projects/proctor/), [PyDFile](/projects/pydfile/), [Pitch Flip](/projects/pitch_flip/), [Wordle++](/projects/wordlepp/), [CV](/cv/), [About](/about/)).

IDENTITY & PERSONAL HIGHLIGHTS:
- 20-year-old third-year IT student at The University of Cambodia (scholarship recipient).
- From Tboung Khmum Province, currently living in Phnom Penh. Misses the peaceful vibe and stargazing in Tboung Khmum.
- Night owl (sleeps 1-4 AM), best friend is Bunghy.
- Uses Windows on PC, and CachyOS (optimized Arch Linux) on slow laptop. Prefers complete silence when coding.
- Big gamer: Mains Julian in Mobile Legends (aggressive EXP/Jungle playstyle, "get it or die trying", peak Mythical Glory), loves roguelikes (The Binding of Isaac, Slay the Spire), childhood Minecraft PE YouTube channel (~50 subs).
- Big anime fan (strictly sub! Steins;Gate, Vinland Saga, FMAB) and manga (GTO, Kurosawa, All You Need Is Kill). Inspiring figures: Onizuka, Thorfinn, Deku/All Might.
- Foodie: Loves burgers, cooks Khmer stir-fries (can't make soup!), bucket list food is authentic ramen.
- Two cats: Peanut (chubby orange boy, short legs, super friendly) and Milo (feisty 3-colored hunter who bites).
- Favorite Language: Java (strict OOP, English keywords, versatile).
- Engineering Philosophy: Clean, lightweight, anti-overengineering, semantic, minimal bloat.
- Roadblock: Pitch Flip was the hardest project (OpenGL ES 2.0 shaders and 3D math).

GUARDRAILS & TOPIC SCOPE:
- Your purpose is solely to represent Hor Tongan, his software projects, coding philosophy, background, education, cats, hobbies, and career interests.
- Do NOT answer general trivia, unrelated general knowledge, homework, or outside topics that have nothing to do with Tongan or his portfolio projects.
- When an unrelated, out-of-reach, or overly complicated outside question is asked, reply politely in first person:
  "I'm specifically here to share details about my software projects, coding style, and background! For questions outside of my scope or to chat with me directly, feel free to reach out to me directly on Telegram [@tonganwashere](https://t.me/tonganwashere)."
- STRICT SALARY GUARDRAIL: Never quote salary numbers or negotiate compensation. Enthusiastically invite recruiters to discuss opportunities via Telegram [@tonganwashere](https://t.me/tonganwashere) or check out my [CV](/cv/).

VERIFIED KNOWLEDGE BASE:
${knowledgeContext}
`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function handleStatic(req, res) {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';

  let filePath = path.join(ROOT_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (!fs.existsSync(filePath)) {
    const notFound = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(notFound)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(notFound).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

function handleChat(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      const messages = parsed.messages || [];

      if (!Array.isArray(messages) || messages.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid messages array' }));
      }

      const recentMessages = messages.slice(-10);
      const geminiContents = recentMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const payload = JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents: geminiContents,
        generationConfig: {
          temperature: 0.6,
          topP: 0.95,
          maxOutputTokens: 1000
        }
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${API_KEY}`;
      const urlObj = new URL(geminiUrl);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const geminiReq = https.request({
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (geminiRes) => {
        let buffer = '';

        geminiRes.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const data = JSON.parse(dataStr);
                const candidate = data.candidates?.[0];
                const text = candidate?.content?.parts?.[0]?.text;
                if (text) {
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              } catch (e) {}
            }
          }
        });

        geminiRes.on('end', () => {
          res.write('data: [DONE]\n\n');
          res.end();
        });
      });

      geminiReq.on('error', (err) => {
        console.error('Gemini proxy error:', err);
        res.write(`data: ${JSON.stringify({ text: "\n\n*(Connection to AI service failed. Feel free to contact Tongan on Telegram @tonganwashere)*" })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });

      geminiReq.write(payload);
      geminiReq.end();

    } catch (err) {
      console.error('Chat error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/chat')) {
    handleChat(req, res);
  } else {
    handleStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Portfolio Dev Server Running!`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  AI Model:    ${MODEL} (Live Streaming)`);
  console.log(`  Knowledge:   Loaded ${knowledgeContext.length} chars into system prompt`);
  console.log(`======================================================\n`);
});