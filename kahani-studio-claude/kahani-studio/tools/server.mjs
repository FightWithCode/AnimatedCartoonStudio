import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png' };
export async function startServer(port = 0) {
  const srv = http.createServer((q, r) => { let u = decodeURIComponent(q.url.split('?')[0]); if (u === '/') u = '/web/index.html'; if (u === '/favicon.ico') { r.writeHead(204); return r.end(); } const f = path.join(root, u); if (!f.startsWith(root)) { r.writeHead(403); return r.end(); } fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end('not found'); } else { r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } }); });
  await new Promise((res) => srv.listen(port, res)); return { srv, port: srv.address().port };
}
if (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const { port } = await startServer(+process.env.PORT || 8080); console.log(`Kahani Studio player: http://localhost:${port}/`); }
