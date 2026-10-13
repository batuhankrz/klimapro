// KlimaPro basit senkronizasyon sunucusu (Node.js, dosya tabanlı)
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = '/home/user/workspace/klimapro';
const DATA_FILE = ROOT + '/data/state.json';

const loadState = () => {
  try { return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); } catch(e) { return {}; }
};
const saveState = (s) => fs.writeFileSync(DATA_FILE, JSON.stringify(s, null, 2), 'utf8');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (url.pathname === '/state' && req.method === 'GET') {
    const s = loadState();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify(s));
    return;
  }
  if (url.pathname === '/sync' && req.method === 'POST') {
    let body='';
    req.on('data',c=>body+=c);
    req.on('end',()=>{
      try {
        const remote = JSON.parse(body);
        const local = loadState();
        const merged = JSON.parse(JSON.stringify(local));
        Object.keys(remote).forEach(col => {
          merged[col] = merged[col] || {};
          Object.values(remote[col]).forEach(r => {
            const l = merged[col][r.id];
            if (!l || (r.updated||0) > (l.updated||0)) merged[col][r.id] = r;
          });
        });
        saveState(merged);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true}));
      } catch(e) { res.writeHead(400); res.end(JSON.stringify({error:e.message})); }
    });
    return;
  }
  // static files
  let file = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//,'');
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  try {
    const st = fs.statSync(full);
    if (!st.isFile()) throw new Error('not file');
    const ext = path.extname(full).toLowerCase();
    const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'}[ext] || 'application/octet-stream';
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache'});
    fs.createReadStream(full).pipe(res);
  } catch(e) { res.writeHead(404); res.end('not found'); }
});

server.listen(3000, '0.0.0.0', () => console.log('klimapro sync server on :3000'));
