const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const DATA = path.join('/tmp', 'klimapro-state.json');
  let s = {};
  try { s = JSON.parse(fs.readFileSync(DATA,'utf8')); } catch(e) {}
  res.status(200).json(s);
};
