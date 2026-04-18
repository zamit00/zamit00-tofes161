import fs from 'fs';
const s = fs.readFileSync('pdf161.html', 'utf8');
const i0 = s.indexOf('id="page_0"');
const i1 = s.indexOf('id="page_1"');
const p0 = s.slice(i0, i1);
const re = /style="left:([\d.]+)em;top:([\d.]+)em/g;
const rows = [];
let m;
while ((m = re.exec(p0)) !== null) {
  const top = parseFloat(m[2]);
  if (top >= 17 && top <= 28) rows.push({ left: parseFloat(m[1]), top, idx: m.index });
}
rows.sort((a, b) => a.top - b.top || a.left - b.left);
let pos = 0;
const wantTop = '19.2854em';
while (true) {
  const idx = p0.indexOf(`top:${wantTop}`, pos);
  if (idx === -1) break;
  const chunk = p0.slice(Math.max(0, idx - 120), idx + 350);
  console.log('---\n', chunk.replace(/\s+/g, ' ').slice(0, 450));
  pos = idx + 1;
}
