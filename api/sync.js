// POST /api/sync - state merge et ve kaydet
const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const DATA = path.join('/tmp', 'klimapro-state.json');
  try {
    // Vercel req.body already parsed when Content-Type: application/json
    let remote = req.body;
    if (!remote || typeof remote !== 'object') {
      // fallback: read raw stream
      const raw = await new Promise((r) => { let b=''; req.on('data',c=>b+=c); req.on('end',()=>r(b)); });
      remote = JSON.parse(raw || '{}');
    }
    let local = {};
    try { local = JSON.parse(fs.readFileSync(DATA,'utf8')); } catch(e) {}
    const merged = JSON.parse(JSON.stringify(local));
    Object.keys(remote).forEach(col => {
      if (!remote[col] || typeof remote[col] !== 'object') return;
      merged[col] = merged[col] || {};
      Object.values(remote[col]).forEach(r => {
        if (!r || !r.id) return;
        const l = merged[col][r.id];
        if (!l || (r.updated||0) > (l.updated||0)) merged[col][r.id] = r;
      });
    });
    fs.writeFileSync(DATA, JSON.stringify(merged));
    res.status(200).json({ok:true, saved: true});
  } catch(e) { res.status(400).json({error:e.message}); }
};
