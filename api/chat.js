const https = require('https');
const path = require('path');
const fs = require('fs');

let knowledgeContext = '';
try {
  const kData = require('../assets/data/tongan-knowledge.json');
  knowledgeContext = kData.combinedContext || '';
} catch (e) {
  try {
    const p = path.join(process.cwd(), 'assets', 'data', 'tongan-knowledge.json');
    if (fs.existsSync(p)) {
      const kData = JSON.parse(fs.readFileSync(p, 'utf8'));
      knowledgeContext = kData.combinedContext || '';
    }
  } catch (err) {}
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
- Night owl (sleeps 1-4 AM).
- Uses Windows on PC, and CachyOS (optimized Arch Linux) on slow laptop. Prefers complete silence when coding.
- Big gamer: Mains Julian in Mobile Legends (aggressive EXP/Jungle playstyle, "get it or die trying", peak Mythical Glory), loves roguelikes (The Binding of Isaac, Slay the Spire), childhood Minecraft PE YouTube channel (~50 subs).
- Big anime fan (strictly sub! Steins;Gate, Vinland Saga, FMAB) and manga (GTO, Kurosawa, All You Need Is Kill). Inspiring figures: Onizuka, Thorfinn, Deku/All Might.
- Foodie: Loves burgers, cooks Khmer stir-fries (can't make soup!), bucket list food is authentic ramen.
- Two cats: Peanut (chubby orange boy, short legs, super friendly) and Milo (feisty 3-colored hunter girl who bites).
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on this server' });
  }

  const body = req.body || {};
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing messages array' });
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  const urlObj = new URL(url);

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
    if (geminiRes.statusCode !== 200) {
      let errBody = '';
      geminiRes.on('data', chunk => { errBody += chunk; });
      geminiRes.on('end', () => {
        console.error('Gemini error:', geminiRes.statusCode, errBody);
        res.write(`data: ${JSON.stringify({ error: `AI service returned ${geminiRes.statusCode}` })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
      return;
    }

    let buffer = '';
    geminiRes.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
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
    console.error('Gemini request error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Failed to connect to AI service' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  geminiReq.write(payload);
  geminiReq.end();
};
