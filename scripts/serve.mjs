import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const allowedPages = new Set(['index.html', 'services.html', 'about.html', 'contact.html']);
const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end('Method not allowed'); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    // A prefix simulates a GitHub project Pages URL for local verification.
    const relative = pathname.replace(/^\/trinetra-consulting(?=\/)/, '').replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(root, relative);
    const permitted = allowedPages.has(relative) || relative.startsWith('assets/');
    if (!permitted || !target.startsWith(root) || !(await stat(target)).isFile()) throw new Error('Not found');
    const body = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Content-Length': body.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Page not found. Open /index.html to return home.');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Trinetra Consultancy: http://127.0.0.1:${port}`));
