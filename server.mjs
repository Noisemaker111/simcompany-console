// Sim Company Console - tiny local server. No dependencies.
// Agent (OpenCode) writes state.json; the site posts commands to commands.json.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const PORT = 5178;

const DEFAULT = (name) => {
  const p = join(dir, name);
  if (!existsSync(p)) writeFileSync(p, '[]');
  return p;
};
const commandsFile = DEFAULT('commands.json');
const stateFile = join(dir, 'state.json');
if (!existsSync(stateFile)) writeFileSync(stateFile, JSON.stringify({ error: 'no state yet' }));
const logFile = join(dir, 'log.txt');
if (!existsSync(logFile)) writeFileSync(logFile, '');

const read = (f) => {
  try { return readFileSync(f, 'utf8'); } catch { return '[]'; }
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(readFileSync(join(dir, 'index.html')));
  } else if (url.pathname === '/api/state') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(read(stateFile));
  } else if (url.pathname === '/api/log') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    res.end(read(logFile));
  } else if (url.pathname === '/api/commands') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(read(commandsFile));
  } else if (url.pathname === '/api/command' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { text } = JSON.parse(body || '{}');
        if (text && String(text).trim()) {
          const cmds = JSON.parse(read(commandsFile));
          cmds.push({ id: Date.now(), text: String(text).trim(), created: new Date().toLocaleTimeString(), status: 'queued' });
          writeFileSync(commandsFile, JSON.stringify(cmds, null, 2));
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
  } else {
    res.writeHead(404); res.end('nope');
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`Sim console on http://localhost:${PORT}`));
