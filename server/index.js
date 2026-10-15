const http = require('http');
const fs = require('fs');
const path = require('path');
const limits = require('./limits');
// STUB: const { writeMotto } = require('./gemma'); (Block 3, motto route)

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

const limiter = limits.createLimiter();

function sendJson(res, status, obj, extra) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }, SECURITY_HEADERS, extra || {}));
  res.end(JSON.stringify(obj));
}

function clientIp(req) {
  // Render sets the first entry to the real client address (Render's own staff reply on feedback.render.com).
  // Known limit: Render appends to a header the client already sent, so a determined visitor can write a fake
  // first entry and dodge the per-visitor cap. Tried the last entry on Oct 3 and it did not help (see FINDINGS).
  // The total daily cap is what really bounds spend.
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return req.socket.remoteAddress || 'unknown';
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => reject(new Error('bad_request')));
  });
}

// STUB: POST /motto (Block 3)
// Order, same as Tinctures: same-origin check, limiter.check, readBody + JSON.parse,
// body check ({ word: string <= 40 chars, blazon: string <= 400 chars }), writeMotto(), six-line shape check
// ({ motto: string <= 80, lore: string <= 600 }), sendJson 200. Errors: 429 daily_cap/slow_down,
// 503 model_off, 504 model_timeout, 502 unreadable. Never log the body or the key.
// Helpers above (sendJson, clientIp, readBody, limiter) are kept for it.

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Health check endpoint: zero side effects, no model call, no storage
  if (pathname === '/healthz' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS
    });
    res.end('OK');
    return;
  }

  // STUB: if (pathname === '/motto') { POST only, else 405; handleMotto(req, res); return; }

  // Handle static assets
  const rawPath = req.url.split('?')[0];
  const targetRel = (rawPath === '/' || rawPath === '') ? '/index.html' : rawPath;
  const filePath = path.resolve(PUBLIC_DIR, '.' + targetRel);

  // Prevent directory traversal outside public
  const rel = path.relative(PUBLIC_DIR, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      ...SECURITY_HEADERS
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
