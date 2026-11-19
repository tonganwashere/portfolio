const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT_DIR = path.resolve(__dirname, '..');
const MAX_BODY_BYTES = 64 * 1024;

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

const chatHandler = require('../api/chat');

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

function isSafeStaticPath(reqPath) {
  if (!reqPath || reqPath.includes('\0')) return false;
  const segments = reqPath.split('/').filter(Boolean);
  for (const seg of segments) {
    if (seg.startsWith('.')) return false;
  }
  return true;
}

function handleStatic(req, res) {
  let reqPath;
  try {
    reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('400 Bad Request');
  }

  if (!isSafeStaticPath(reqPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  if (reqPath.endsWith('/')) reqPath += 'index.html';

  let filePath = path.resolve(ROOT_DIR, '.' + reqPath);
  if (filePath !== ROOT_DIR && !filePath.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (!filePath.startsWith(ROOT_DIR + path.sep) || !fs.existsSync(filePath)) {
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

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache, must-revalidate'
  });
  fs.createReadStream(filePath).pipe(res);
}

function attachVercelHelpers(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
    }
    res.end(JSON.stringify(data));
    return res;
  };
}

function handleChat(req, res) {
  attachVercelHelpers(res);

  if (req.method !== 'POST') {
    Promise.resolve(chatHandler(req, res)).catch((err) => {
      console.error('Chat handler error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    });
    return;
  }

  let body = '';
  let byteLength = 0;
  let aborted = false;

  req.on('error', () => {
    aborted = true;
    if (!res.writableEnded) res.end();
  });

  req.on('data', (chunk) => {
    if (aborted) return;
    byteLength += chunk.length;
    if (byteLength > MAX_BODY_BYTES) {
      aborted = true;
      res.status(413).json({ error: 'Request payload too large' });
      req.destroy();
      return;
    }
    body += chunk.toString('utf8');
  });

  req.on('end', () => {
    if (aborted) return;
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    Promise.resolve(chatHandler(req, res)).catch((err) => {
      console.error('Chat handler error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  if (pathname === '/api/chat' || pathname.startsWith('/api/chat/')) {
    handleChat(req, res);
  } else {
    handleStatic(req, res);
  }
});

server.listen(PORT, HOST, () => {
  const models = chatHandler.MODELS || [];
  const knowledgeLen = chatHandler.KNOWLEDGE_LENGTH || 0;
  console.log(`\n======================================================`);
  console.log(`  Portfolio Dev Server Running!`);
  console.log(`  Local URL:   http://${HOST}:${PORT}`);
  console.log(`  AI Model:    ${models[0] || 'unknown'} (Fallback: ${models.slice(1).join(', ')})`);
  console.log(`  Knowledge:   Loaded ${knowledgeLen} chars into system prompt`);
  console.log(`======================================================\n`);
});
