'use strict';
// ===== Dibujo =====
const SW = 48, SH = 56, FOOT = 3;
const IMG = {};
for (const k in CH) { const im = new Image(); im.src = `assets/${CH[k]}_caminar_4frames.png`; IMG[k] = im; }
const NATIVE_LEFT = { willy: true };
// posición de los ojos (centro, en píxeles del sprite) para pintarlos de rojo cuando están corruptos
const EYES = {
  rius: [[18, 17], [30, 17]], mayo: [[17, 15], [31, 15]], esparta: [[18, 19], [30, 19]], raptor: [[19, 20], [29, 20]],
  timba: [[18, 21], [30, 21]], trolino: [[18, 19], [30, 19]], invictor: [[18, 19], [30, 19]]
};
const SIL = {};
function silhouette(id, f) {
  const key = id + f; if (SIL[key]) return SIL[key];
  const c = document.createElement('canvas'); c.width = SW; c.height = SH; const g = c.getContext('2d');
  g.drawImage(IMG[id], f * SW, 0, SW, SH, 0, 0, SW, SH);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, SW, SH);
  return SIL[key] = c;
}
// x = centro, y = pies
function drawChar(id, x, y, o = {}) {
  const im = IMG[id]; if (!im || !im.complete || !im.naturalWidth) return;
  const sc = o.scale || 1, f = o.frame || 0;
  let flip = !!o.flip; if (NATIVE_LEFT[id]) flip = !flip;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(flip ? -sc : sc, sc);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(im, f * SW, 0, SW, SH, -24, -(SH - FOOT), SW, SH);
  if (o.flash) { ctx.globalAlpha = .85; ctx.drawImage(silhouette(id, f), -24, -(SH - FOOT)); ctx.globalAlpha = 1; }
  if (o.red && EYES[id]) {
    for (const [ex, ey] of EYES[id]) {
      ctx.fillStyle = 'rgba(255,0,0,.35)'; ctx.fillRect(ex - 3 - 24, ey - 3 - (SH - FOOT), 7, 7);
      ctx.fillStyle = '#ff1a1a'; ctx.fillRect(ex - 1 - 24, ey - 1 - (SH - FOOT), 3, 3);
    }
  }
  if (o.sleep && EYES[id]) {   // ojos cerrados
    for (const [ex, ey] of EYES[id]) {
      ctx.fillStyle = '#f8d0b0'; ctx.fillRect(ex - 4 - 24, ey - 3 - (SH - FOOT), 9, 7);
      ctx.fillStyle = '#1a1020'; ctx.fillRect(ex - 3 - 24, ey - (SH - FOOT), 7, 1);
    }
  }
  ctx.restore();
}

// ---------- Texturas de bloques (16x16 → se dibujan al doble, estilo Minecraft) ----------
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function noise(g, base, cols, seed, x0, y0, w, h, p = .4) {
  const r = rng(seed); g.fillStyle = base; g.fillRect(x0, y0, w, h);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (r() < p) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y, 1, 1); }
}
function buildTex(theme) {
  const d = theme === 'day';
  const dirtB = d ? '#8a5a32' : '#4a3a78', dirtC = d ? ['#7a4e2a', '#98663a', '#6b4424'] : ['#3f3068', '#58468c', '#352858'];
  const grassB = d ? '#58b947' : '#6d5bd0', grassC = d ? ['#4aa23a', '#6fd05a', '#3e8f30'] : ['#5b4ab8', '#8a7af0', '#a99cff'];
  const T_ = {};
  T_.dirt = mk(16, 16, g => noise(g, dirtB, dirtC, 11, 0, 0, 16, 16));
  T_.grass = mk(16, 16, g => {
    noise(g, dirtB, dirtC, 12, 0, 0, 16, 16);
    noise(g, grassB, grassC, 13, 0, 0, 16, 4, .5);
    const r = rng(14); for (let x = 0; x < 16; x++) { const h = 4 + (r() < .45 ? 1 + (r() < .4 ? 1 : 0) : 0); g.fillStyle = grassB; g.fillRect(x, 3, 1, h - 3); if (h > 4) { g.fillStyle = grassC[0]; g.fillRect(x, h - 1, 1, 1); } }
  });
  T_.stone = mk(16, 16, g => { noise(g, '#8c8c98', ['#7c7c88', '#9c9ca8', '#6e6e7a'], 21, 0, 0, 16, 16); g.fillStyle = '#5e5e6a'; g.fillRect(0, 7, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(3, 8, 1, 8); g.fillRect(11, 8, 1, 8); });
  T_.crack = mk(16, 16, g => {
    g.drawImage(T_.stone, 0, 0); g.fillStyle = '#2b2b36';
    [[8, 0], [7, 1], [7, 2], [6, 3], [6, 4], [7, 5], [8, 6], [8, 7], [9, 8], [10, 9], [10, 10], [9, 11], [8, 12], [8, 13], [7, 14], [7, 15], [5, 5], [4, 5], [11, 9], [12, 9]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  });
  T_.cloud = mk(16, 16, g => {
    g.fillStyle = '#dff1ff'; g.fillRect(0, 2, 16, 5); g.fillStyle = '#ffffff'; g.fillRect(1, 1, 14, 3); g.fillRect(3, 0, 5, 2); g.fillRect(9, 0, 4, 2);
    g.fillStyle = '#b9d9f2'; g.fillRect(1, 7, 14, 1); g.fillRect(0, 5, 16, 2);
  });
  T_.bed = mk(16, 16, g => {
    g.fillStyle = '#2a1a3a'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#e0486c'; g.fillRect(0, 4, 16, 12); g.fillStyle = '#ff7a9a'; g.fillRect(0, 4, 16, 3);
    g.fillStyle = '#fff'; g.fillRect(1, 0, 8, 5); g.fillStyle = '#dfe9ff'; g.fillRect(1, 3, 8, 2);
    g.fillStyle = '#a82a4c'; for (let x = 2; x < 16; x += 4) g.fillRect(x, 8, 1, 8);
    g.fillStyle = '#6a3a1a'; g.fillRect(0, 14, 16, 2);
  });
  T_.gate = mk(16, 16, g => { noise(g, '#3a3552', ['#2e2a44', '#47416a', '#262238'], 31, 0, 0, 16, 16); g.fillStyle = '#15121f'; g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(0, 7, 16, 1); });
  return T_;
}
const TEXS = { day: buildTex('day'), dream: buildTex('dream') };

// ---------- Pixel arts pequeños ----------
function pat(rows, pal) { const h = rows.length, w = rows[0].length; return mk(w, h, g => rows.forEach((r, y) => [...r].forEach((c, x) => { if (pal[c]) { g.fillStyle = pal[c]; g.fillRect(x, y, 1, 1); } }))); }
const DIA = pat(['..ooooo..', '.owwccco.', 'owwcccddo', 'occcccddo', '.occcddo.', '..occdo..', '...odo...', '....o....'],
  { o: '#0b3a52', w: '#ffffff', c: '#4fe6ff', d: '#1fa6d6' });
const HEART = (full) => pat(['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], { X: full ? '#ff3b5c' : '#3a2438' });
const HEART_F = HEART(true), HEART_E = HEART(false);

// ---------- Fondos ----------
const STARS = (() => { const r = rng(7), a = []; for (let i = 0; i < 90; i++) a.push({ x: r() * 900, y: r() * 230, s: r() < .15 ? 2 : 1, p: r() * 6 }); return a; })();
function skyGradient(stops) { const g = ctx.createLinearGradient(0, 0, 0, H); stops.forEach(([p, c]) => g.addColorStop(p, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function bigStar(x, y, r, color, glow) {
  ctx.fillStyle = glow; ctx.fillRect(x - r - 3, y - 2, 2 * r + 6, 4); ctx.fillRect(x - 2, y - r - 3, 4, 2 * r + 6);
  ctx.fillStyle = color; ctx.fillRect(x - r, y - 1, 2 * r + 1, 3); ctx.fillRect(x - 1, y - r, 3, 2 * r + 1); ctx.fillRect(x - 3, y - 3, 7, 7);
}
function drawNightSky(dark, t) {
  if (dark) skyGradient([[0, '#10020c'], [.6, '#3a0a24'], [1, '#6a1530']]); else skyGradient([[0, '#070b24'], [.6, '#16285a'], [1, '#2c4a86']]);
  for (const s of STARS) { const tw = (Math.sin(t * 2 + s.p) + 1) / 2; ctx.fillStyle = dark ? `rgba(255,150,170,${.2 + tw * .5})` : `rgba(255,255,255,${.3 + tw * .7})`; ctx.fillRect(s.x % W, s.y, s.s, s.s); }
}
function drawSevenStars(dark, t) {
  for (let i = 0; i < 7; i++) {
    const x = 70 + i * 83, y = 44 + Math.sin(i * 1.1) * 18 + Math.sin(t * 2 + i) * 2;
    if (dark) bigStar(x, y, 8, '#9a2bff', 'rgba(255,40,80,.35)'); else bigStar(x, y, 8, '#fff6a0', 'rgba(255,230,90,.35)');
  }
}
function drawBGDay() {
  skyGradient([[0, '#7cc8ff'], [1, '#e1f5ff']]);
  ctx.fillStyle = '#fff3a0'; ctx.fillRect(500, 36, 44, 44); ctx.fillStyle = '#ffe14a'; ctx.fillRect(506, 42, 32, 32);
  const cx = S.cam.x;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) { const x = ((i * 230 - cx * .15) % 1000 + 1000) % 1000 - 120, y = 30 + (i * 47) % 90; ctx.fillRect(x, y, 90, 14); ctx.fillRect(x + 14, y - 10, 50, 12); ctx.fillRect(x + 50, y + 6, 60, 10); }
  for (let L = 0; L < 2; L++) {
    ctx.fillStyle = L ? '#5faf5a' : '#79c874'; const par = L ? .5 : .3;
    for (let x = -32; x < W + 64; x += 32) { const wx = x + Math.floor(cx * par / 32) * 32, h = 36 + (Math.sin(wx * .021 + L) + 1) * 22 + L * 14; ctx.fillRect(x - (cx * par) % 32, H - 60 - h + 60, 33, h + 4 + 90); }
  }
}
function drawBGDream() {
  const t = S.t, cx = S.cam.x, cy = S.cam.y;
  skyGradient([[0, '#120c36'], [.55, '#472a7a'], [1, '#c8689e']]);
  for (const s of STARS) { const tw = (Math.sin(t * 1.6 + s.p) + 1) / 2; ctx.fillStyle = `rgba(255,255,255,${.25 + tw * .6})`; ctx.fillRect(((s.x - cx * .08) % W + W) % W, s.y - cy * .05, s.s, s.s); }
  const mx = 470 - cx * .04, my = 70 - cy * .04;
  ctx.fillStyle = '#fff6d8'; ctx.fillRect(mx - 28, my - 40, 56, 80); ctx.fillRect(mx - 40, my - 28, 80, 56); ctx.fillRect(mx - 34, my - 34, 68, 68);
  ctx.fillStyle = '#e8d8a8'; ctx.fillRect(mx - 14, my - 18, 12, 12); ctx.fillRect(mx + 8, my + 4, 14, 14); ctx.fillRect(mx - 24, my + 10, 8, 8);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) { const x = ((i * 260 - cx * .12 - t * 6) % 1100 + 1100) % 1100 - 150, y = 110 + (i * 53) % 90 - cy * .06; ctx.globalAlpha = .22; ctx.fillRect(x, y, 100, 12); ctx.fillRect(x + 16, y - 10, 54, 12); ctx.globalAlpha = 1; }
  for (let L = 0; L < 2; L++) {
    ctx.fillStyle = L ? '#2d1f5a' : '#3a2870'; const par = L ? .45 : .28;
    for (let x = -32; x < W + 64; x += 32) { const wx = x + Math.floor(cx * par / 32) * 32, h = 30 + (Math.sin(wx * .02 + L * 2) + 1) * 26; ctx.fillRect(x - (cx * par) % 32, H - h - 20 - L * 10 - cy * .1, 33, h + 140); }
  }
  ctx.font = 'bold 18px "Courier New"'; ctx.textBaseline = 'top';
  for (let i = 0; i < 6; i++) { const x = ((i * 190 + t * 14 - cx * .2) % 900 + 900) % 900 - 100, y = 60 + ((i * 71 + t * 9) % 200); ctx.fillStyle = `rgba(190,215,255,${.2 + .2 * Math.sin(t + i)})`; ctx.fillText(i % 2 ? 'z' : 'Z', x, y); }
}
function drawBGArena() {
  drawBGDream();
  ctx.fillStyle = 'rgba(120,0,40,.22)'; ctx.fillRect(0, 0, W, H);
  const t = S.t;
  for (let i = 0; i < 4; i++) { const y = ((t * 60 + i * 97) % H); ctx.fillStyle = 'rgba(255,60,120,.08)'; ctx.fillRect(0, y, W, 6); }
}

// ---------- Mundo ----------
function drawTile(L, tx, ty, texs) {
  const c = L.g[ty][tx]; if (c === '.') return;
  const x = tx * T, y = ty * T;
  const sol = (a, b) => SOLID.includes(L.get(a, b)) && L.get(a, b) !== 'M';
  let tex, h = 16;
  if (c === '#') tex = sol(tx, ty - 1) ? texs.dirt : texs.grass;
  else if (c === 'S') tex = texs.stone; else if (c === 'C') tex = texs.crack;
  else if (c === '=') { tex = texs.cloud; ctx.drawImage(tex, 0, 0, 16, 8, x, y, 32, 16); return; }
  else if (c === 'M') {
    const k = tx + ',' + ty, b = L.bounce && L.bounce[k]; const sq = b ? Math.sin(b / .3 * Math.PI) * 6 : 0;
    ctx.drawImage(texs.bed, 0, 0, 16, 16, x, y + sq, 32, 32 - sq); return;
  }
  else if (c === 'G') {
    ctx.drawImage(texs.gate, 0, 0, 16, 16, x, y, 32, 32);
    if (ty === 8 || ty === 9) { const ok = S.dia >= L.diaNeed; ctx.fillStyle = ok ? '#7df3ff' : '#ff4a5a'; ctx.globalAlpha = .5 + .3 * Math.sin(S.t * 4); ctx.fillRect(x + 10, y + 6, 12, 20); ctx.globalAlpha = 1; ctx.drawImage(DIA, 0, 0, 9, 8, x + 3, y + 8, 27, 24); }
    return;
  }
  ctx.drawImage(tex, 0, 0, 16, h, x, y, 32, 32);
}
function drawHouse(x, gy) {
  ctx.fillStyle = '#b98a52'; ctx.fillRect(x, gy - 132, 232, 132);
  ctx.fillStyle = '#9a6e3c'; for (let yy = gy - 132; yy < gy; yy += 16) ctx.fillRect(x, yy, 232, 2);
  ctx.fillStyle = '#7a2a28'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 12 + i * 12, gy - 132 - 12 * (i + 1), 232 + 24 - i * 24, 12);
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 96, gy - 70, 42, 70); ctx.fillStyle = '#ffd24a'; ctx.fillRect(x + 128, gy - 36, 5, 5);
  ctx.fillStyle = '#bfe9ff'; ctx.fillRect(x + 30, gy - 100, 36, 36); ctx.fillRect(x + 166, gy - 100, 36, 36);
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 46, gy - 100, 4, 36); ctx.fillRect(x + 30, gy - 84, 36, 4); ctx.fillRect(x + 182, gy - 100, 4, 36); ctx.fillRect(x + 166, gy - 84, 36, 4);
  txt('CASA DE MIKE', x + 116, gy - 164, { size: 13, align: 'center', color: '#ffe14a' });
}
function drawPortal(r) {
  const t = S.t;
  ctx.fillStyle = '#1a0f33'; ctx.fillRect(r.x - 6, r.y - 6, r.w + 12, r.h + 6);
  ctx.fillStyle = '#6a3fc8'; ctx.fillRect(r.x, r.y, r.w, r.h);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,255,255,${.25 + .25 * Math.sin(t * 3 + i)})`; ctx.fillRect(r.x + 4 + (i * 7) % 20, r.y + 6 + (i * 23 + t * 20) % (r.h - 10), 4, 4); }
  txt('VALLE DEL SUEÑO →', r.x + 16, r.y - 22, { size: 12, align: 'center', color: '#d9c8ff' });
}
function drawSign(s, gy) {
  const near = S.nearSign === s;
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(s.x - 3, gy - 30, 6, 30); ctx.fillStyle = '#c9a15a'; ctx.fillRect(s.x - 14, gy - 44, 28, 18); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(s.x - 14, gy - 28, 28, 2);
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(s.x - 8, gy - 39, 16, 2); ctx.fillRect(s.x - 8, gy - 34, 12, 2);
  if (near) {
    ctx.font = 'bold 13px "Courier New"'; const w = ctx.measureText(s.text).width + 16;
    ctx.fillStyle = 'rgba(10,8,30,.82)'; ctx.fillRect(s.x - w / 2, gy - 82, w, 28); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(s.x - w / 2, gy - 82, w, 28);
    txt(s.text, s.x, gy - 75, { size: 13, align: 'center', outline: false });
  }
}
function drawSlime(e) {
  const t = S.t, st = clamp(-e.vy / 400, -.3, .4), h = e.h * (1 + st * .4), w = e.w * (1 - st * .25), x = e.x + (e.w - w) / 2, y = e.y + e.h - h;
  if (e.flash > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); return; }
  ctx.fillStyle = '#1a5a2a'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#62d874'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#8af59a'; ctx.fillRect(x + 3, y + 3, w - 6, 4); ctx.fillStyle = '#3fa852'; ctx.fillRect(x, y + h - 5, w, 5);
  const d = e.dir > 0 ? 3 : -3; ctx.fillStyle = '#fff'; ctx.fillRect(x + 5 + d, y + 8, 6, 7); ctx.fillRect(x + w - 11 + d, y + 8, 6, 7);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 8 + d, y + 10, 3, 4); ctx.fillRect(x + w - 8 + d, y + 10, 3, 4); ctx.fillRect(x + 10, y + h - 8, w - 20, 2);
  if (Math.sin(t * 7 + e.x) > .93) { ctx.fillStyle = 'rgba(255,0,200,.7)'; ctx.fillRect(x - 4, y + 9, w + 8, 4); }
}
function drawFlyer(e) {
  const t = S.t * 14 + e.x, wing = Math.sin(t) * 6;
  const x = e.x, y = e.y;
  ctx.fillStyle = '#8a5acd'; ctx.fillRect(x - 6, y + 2 - wing, 10, 8); ctx.fillRect(x + e.w - 4, y + 2 + wing, 10, 8);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 2, y, e.w - 4, e.h); ctx.fillStyle = e.flash > 0 ? '#fff' : '#4b2a7a'; ctx.fillRect(x + 4, y + 2, e.w - 8, e.h - 4);
  ctx.fillStyle = '#ff2a4a'; ctx.fillRect(x + 7, y + 8, 4, 4); ctx.fillRect(x + e.w - 11, y + 8, 4, 4);
  ctx.fillStyle = '#c9a0ff'; ctx.font = 'bold 10px monospace'; ctx.fillText('z', x + 8, y - 10);
}
function drawDummy(e) {
  const sh = e.hit > 0 ? Math.sin(e.hit * 60) * 3 : 0, x = e.x + sh, y = e.y;
  ctx.fillStyle = '#4a2f18'; ctx.fillRect(x + 12, y + 20, 6, 28); ctx.fillRect(x - 4, y + 22, 38, 5);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 1, y - 2, 32, 28); ctx.fillStyle = e.hit > 0 ? '#fff' : '#d9b46a'; ctx.fillRect(x + 1, y, 28, 24);
  ctx.fillStyle = '#7a5a2a'; ctx.fillRect(x + 1, y + 20, 28, 4); ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 6, y + 6, 4, 4); ctx.fillRect(x + 20, y + 6, 4, 4); ctx.fillRect(x + 8, y + 15, 14, 2);
  txt('.exe', x + 15, y - 16, { size: 11, align: 'center', color: '#ff8aff' });
}
function drawSheep(q) {
  ctx.fillStyle = '#1a1020'; ctx.fillRect(q.x - 2, q.y - 2, q.w + 4, q.h + 4); ctx.fillStyle = '#fff'; ctx.fillRect(q.x, q.y, q.w, q.h);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(q.x + q.w - 8, q.y + 4, 8, 10); ctx.fillRect(q.x + 3, q.y + q.h, 4, 5); ctx.fillRect(q.x + q.w - 9, q.y + q.h, 4, 5);
  ctx.fillStyle = 'rgba(255,0,200,.5)'; ctx.fillRect(q.x, q.y + 5, q.w, 3);
}
function drawProj(q) {
  if (q.type === 'pillow') { ctx.save(); ctx.translate(q.x + 11, q.y + 7); ctx.rotate(q.rot); ctx.fillStyle = '#1a1020'; ctx.fillRect(-13, -9, 26, 18); ctx.fillStyle = '#fff'; ctx.fillRect(-11, -7, 22, 14); ctx.fillStyle = '#9ad0ff'; ctx.fillRect(-11, -1, 22, 3); ctx.restore(); }
  else if (q.type === 'wave') { ctx.fillStyle = '#1a1020'; ctx.fillRect(q.x - 2, q.y - 2, q.w + 4, q.h + 4); ctx.fillStyle = '#d0c0ff'; ctx.fillRect(q.x, q.y + 6, q.w, q.h - 6); ctx.fillStyle = '#fff'; ctx.fillRect(q.x + 6, q.y, 8, 10); }
  else if (q.type === 'sheep') drawSheep(q);
}
function drawSword(p) {
  const prog = 1 - p.atk / .22; if (prog < 0 || prog > 1) return;
  const a = -1.3 + 2.4 * prog; let ang, hx = p.x + 11 + p.face * 6, hy = p.y + 24;
  if (p.atkDir === 'f') ang = p.face > 0 ? a : Math.PI - a;
  else if (p.atkDir === 'u') { ang = -Math.PI / 2 + (-1 + 2 * prog) * .95 * p.face; hy = p.y + 14; }
  else { ang = Math.PI / 2 + (-1 + 2 * prog) * .95 * p.face; hy = p.y + 30; }
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
  ctx.globalAlpha = .5; ctx.strokeStyle = '#bfffff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 40, -.55, .25); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#1a1020'; ctx.fillRect(-1, -4, 44, 8);
  ctx.fillStyle = '#6b3a1a'; ctx.fillRect(0, -2, 9, 4); ctx.fillStyle = '#555'; ctx.fillRect(9, -6, 3, 12);
  ctx.fillStyle = '#3fe0f5'; ctx.fillRect(12, -3, 29, 6); ctx.fillStyle = '#c8ffff'; ctx.fillRect(12, -3, 29, 2);
  ctx.restore();
}
function drawWorld() {
  const L = S.lvl, cam = S.cam, texs = TEXS[L.theme === 'dream' ? 'dream' : 'day'];
  if (S.bossLock) drawBGArena(); else if (L.theme === 'dream') drawBGDream(); else drawBGDay();
  ctx.save();
  const sx = S.shake > 0 ? rnd(-1, 1) * S.shake * 16 : 0, sy = S.shake > 0 ? rnd(-1, 1) * S.shake * 16 : 0;
  ctx.translate(-Math.round(cam.x) + Math.round(sx), -Math.round(cam.y) + Math.round(sy));
  if (S.lvlId === 0) { drawHouse(36, 9 * T); }
  const gy = S.lvlId === 0 ? 9 * T : 11 * T;
  if (L.exit) drawPortal(L.exit);
  S.nearSign = null; { let bd = 150; for (const s of L.signs) { const d = Math.abs(P.x + 11 - s.x); if (d < bd) { bd = d; S.nearSign = s; } } }
  for (const s of L.signs) drawSign(s, gy);
  const x0 = Math.max(0, Math.floor(cam.x / T) - 1), x1 = Math.min(L.w - 1, Math.floor((cam.x + W) / T) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / T) - 1), y1 = Math.min(L.h - 1, Math.floor((cam.y + H) / T) + 1);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) drawTile(L, tx, ty, texs);
  // entidades
  for (const e of S.ents) {
    if (e.type === 'slime') drawSlime(e);
    else if (e.type === 'flyer') drawFlyer(e);
    else if (e.type === 'dummy') drawDummy(e);
    else if (e.type === 'dia') { const b = Math.sin(e.t * 3) * 4; ctx.fillStyle = 'rgba(120,240,255,.25)'; ctx.fillRect(e.x - 4, e.y - 4 + b, 28, 28); ctx.drawImage(DIA, 0, 0, 9, 8, e.x - 4, e.y + b, 27, 24); }
    else if (e.type === 'heart') { const b = Math.sin(e.t * 3) * 3; ctx.drawImage(HEART_F, 0, 0, 7, 6, e.x - 1, e.y + 2 + b, 21, 18); }
    else if (e.type === 'npc') {
      const near = S.nearNpc === e;
      drawChar(e.id, e.x + 12, e.y + e.h, { frame: 0, flip: P.x + 11 < e.x + 12, scale: 1 });
      if (near) { txt(NAMES[e.id], e.x + 12, e.y - 30, { size: 12, align: 'center', color: '#ffe14a' }); ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 4, e.y - 14, 16, 14); ctx.fillStyle = '#1a1020'; txt('E', e.x + 12, e.y - 15, { size: 13, align: 'center', color: '#1a1020', outline: false }); }
    }
  }
  const w = S.willy;
  if (w) drawChar('willy', w.x + w.w / 2, w.y + w.h, { frame: Math.abs(w.vx) > 20 ? [1, 0, 3, 0][Math.floor(w.anim * 9) % 4] : 0, flip: w.face < 0 });
  const b = S.boss;
  if (b && !b.dead) {
    const walking = b.state === 'walk', fr = walking ? [1, 0, 3, 0][Math.floor(b.anim * 6) % 4] : 0;
    const crouch = (b.state === 'slam' && !b.jumped) ? 8 : 0;
    drawChar('timba', b.x + b.w / 2, b.y + b.h + crouch, { scale: 2, frame: fr, flip: b.face > 0, flash: b.flash > 0, red: b.state !== 'saved', sleep: b.state === 'sleep', alpha: 1 });
  }
  const p = P;
  if (!p.dead) {
    let fr = 0; if (p.onGround && Math.abs(p.vx) > 30) fr = [1, 0, 3, 0][Math.floor(p.anim * 10) % 4];
    const blink = p.inv > 0 && Math.floor(p.inv * 18) % 2 === 0;
    drawChar('mike', p.x + 11, p.y + p.h, { frame: fr, flip: p.face < 0, alpha: blink ? .35 : 1 });
    drawSword(p);
  }
  for (const q of S.proj) drawProj(q);
  for (const q of S.particles) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.color; ctx.fillRect(q.x, q.y, q.size, q.size); }
  ctx.globalAlpha = 1;
  for (const f of S.floaters) { ctx.globalAlpha = clamp(1.2 - f.t, 0, 1); txt(f.text, f.x, f.y, { size: 13, color: f.color }); }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawHUD();
}
function drawHUD() {
  for (let i = 0; i < P.maxHp; i++) ctx.drawImage(i < P.hp ? HEART_F : HEART_E, 0, 0, 7, 6, 12 + i * 27, 12, 21, 18);
  ctx.drawImage(DIA, 0, 0, 9, 8, W - 100, 10, 27, 24);
  txt(S.dia + '/' + S.lvl.diaNeed, W - 66, 12, { size: 18, color: S.dia >= S.lvl.diaNeed ? '#7df3ff' : '#fff' });
  if (S.hasDash) txt('≫ ESQUIVE', 12, 36, { size: 11, color: P.dashCd > 0 ? '#888' : '#9ad0ff' });
  const b = S.boss;
  if (b && S.bossStarted && b.state !== 'saved') {
    const bw = 320, bx = (W - bw) / 2;
    txt('TIMBA (corrupto)', W / 2, H - 44, { size: 12, align: 'center', color: '#ffb0b0' });
    ctx.fillStyle = '#1a1020'; ctx.fillRect(bx - 3, H - 28, bw + 6, 16); ctx.fillStyle = '#4a1020'; ctx.fillRect(bx, H - 25, bw, 10);
    ctx.fillStyle = b.state === 'sleep' ? '#6ac8ff' : '#ff3b5c'; ctx.fillRect(bx, H - 25, bw * b.hp / b.max, 10);
  }
  if (S.hintT > 0 && S.hint) { ctx.globalAlpha = clamp(S.hintT * 3, 0, 1); txt(S.hint, W / 2, 48, { size: 15, align: 'center', color: '#fff6a0' }); ctx.globalAlpha = 1; }
}

// ---------- Escenas: título / cinemática / final ----------
function drawStage() {
  const st = S.stage, t = S.t;
  const sx = st.shake > 0 ? rnd(-1, 1) * st.shake * 14 : 0;
  ctx.save(); ctx.translate(Math.round(sx), 0);
  drawNightSky(st.dark, t); drawSevenStars(st.dark, t);
  if (st.ground !== false) {
    const gy = 228;
    ctx.fillStyle = st.dark ? '#2a1020' : '#1c3a2a'; ctx.fillRect(-10, gy + 2, W + 20, H); ctx.fillStyle = st.dark ? '#4a1830' : '#2f6a40'; ctx.fillRect(-10, gy + 2, W + 20, 8);
    for (let y = gy + 18; y < H; y += 16) for (let x = (y / 16 % 2) * 16; x < W; x += 32) { ctx.fillStyle = st.dark ? '#3a1428' : '#27553a'; ctx.fillRect(x, y, 16, 16); }
  }
  for (const c of st.chars) {
    const bob = c.anim === 'idle' ? Math.round(Math.sin(t * 3 + c.x) * 1.5) : 0, fr = c.anim === 'walk' ? [1, 0, 3, 0][Math.floor(t * 9) % 4] : 0;
    const jit = c.glitch ? rnd(-1, 1) * 2 : 0, fy = (c.float ? Math.sin(t * 1.5) * 6 : 0) + (c.jump ? -Math.abs(Math.sin(t * 5)) * 24 : 0);
    drawChar(c.id, c.x + jit, c.y + bob + fy, { scale: c.scale || 1, flip: c.face < 0, frame: fr, red: c.red, alpha: c.alpha != null ? c.alpha : 1 });
    if (c.glitch && Math.sin(t * 9 + c.x) > .7) { ctx.fillStyle = 'rgba(255,0,200,.35)'; ctx.fillRect(c.x - 24, c.y - 50 + rnd(0, 40), 50, 4); }
  }
  ctx.restore();
  if (st.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${st.flash})`; ctx.fillRect(0, 0, W, H); }
  if (st.card) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 110, W, 120); txt(st.card, W / 2, 140, { size: 26, align: 'center', color: '#ffe14a' }); if (st.card2) txt(st.card2, W / 2, 184, { size: 16, align: 'center', color: '#fff' }); }
  if (st.end) drawEndText();
}
function drawEndText() {
  const e = S.stage.end;
  ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(0, 0, W, H);
  txt('FIN DEL PILOTO', W / 2, 40, { size: 34, align: 'center', color: '#ffe14a', lw: 5 });
  txt('Timba recuperó la conciencia... ¡y una siesta!', W / 2, 92, { size: 14, align: 'center', color: '#fff' });
  const m = Math.floor(e.time / 60), s = Math.floor(e.time % 60);
  txt('Diamantes: ' + e.dia + '   Tiempo: ' + m + ':' + String(s).padStart(2, '0') + '   Caídas: ' + e.deaths, W / 2, 130, { size: 15, align: 'center', color: '#7df3ff' });
  txt('Nuevo poder: ESQUIVE ALMOHADA  (SHIFT)', W / 2, 160, { size: 14, align: 'center', color: '#9ad0ff' });
  txt('Amigos restaurados: 1 / 7', W / 2, 190, { size: 15, align: 'center', color: '#fff' });
  txt('Continuará... Rius, Mayo, Esparta, Raptor, Invictor y Trolino te esperan.', W / 2, 224, { size: 12, align: 'center', color: '#ffb0b0' });
  if (Math.floor(S.t * 2) % 2) txt('ENTER: jugar de nuevo', W / 2, 290, { size: 16, align: 'center', color: '#fff' });
}
function drawTitle() {
  const t = S.t;
  drawNightSky(false, t); drawSevenStars(false, t);
  ctx.fillStyle = '#1c3a2a'; ctx.fillRect(0, 302, W, 60); ctx.fillStyle = '#2f6a40'; ctx.fillRect(0, 302, W, 8);
  for (let x = 0; x < W; x += 32) { ctx.fillStyle = '#27553a'; ctx.fillRect(x, 318, 16, 16); ctx.fillRect(x + 16, 334, 16, 16); }
  // ojos rojos acechando
  const bl = Math.sin(t * .8) > .92 ? 0 : 1;
  if (bl) { ctx.fillStyle = 'rgba(255,0,60,.25)'; ctx.fillRect(570, 156, 34, 18); ctx.fillStyle = '#ff1a3a'; ctx.fillRect(576, 162, 8, 6); ctx.fillRect(592, 162, 8, 6); }
  drawChar('mike', 150, 300 - Math.abs(Math.sin(t * 2.6)) * 16, { scale: 3 });
  drawChar('willy', 270, 302, { scale: 2, frame: 0 });
  txt('MIKE', W / 2, 30, { size: 56, align: 'center', color: '#ffe14a', lw: 8 });
  txt('Y LAS ESTRELLAS OSCURAS', W / 2, 100, { size: 22, align: 'center', color: '#fff', lw: 5 });
  txt('— PILOTO —', W / 2, 134, { size: 14, align: 'center', color: '#9ad0ff' });
  if (Math.floor(t * 1.6) % 2 === 0) txt('Pulsa ENTER para empezar', 470, 230, { size: 18, align: 'center', color: '#fff' });
  txt('← → mover   ESPACIO saltar   J atacar   ↑/↓ + J golpe arriba/abajo   E hablar   M sonido   ESC saltar cinemática', W / 2, 340, { size: 10, align: 'center', color: '#bcd', lw: 2 });
}
function drawDialog() {
  const d = S.dialog; if (!d) return;
  const bx = 20, by = H - 106, bw = W - 40, bh = 90;
  if (d.portrait) {
    const left = d.side === 'L', px = left ? 96 : W - 96;
    drawChar(d.who, px, by + 14, { scale: 3, flip: !left, red: d.red });
  }
  ctx.fillStyle = 'rgba(8,6,26,.92)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
  const narr = d.who === 'narr';
  if (!narr && d.name) {
    const left = d.side === 'L'; ctx.font = 'bold 14px "Courier New"'; const nw = ctx.measureText(d.name).width + 24;
    const nx = left ? bx + 12 : bx + bw - 12 - nw;
    ctx.fillStyle = '#ffe14a'; ctx.fillRect(nx, by - 18, nw, 22); ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2; ctx.strokeRect(nx, by - 18, nw, 22);
    txt(d.name, nx + nw / 2, by - 15, { size: 14, align: 'center', color: '#1a1020', outline: false });
  }
  const shown = d.text.slice(0, Math.floor(d.shown));
  const lines = wrap(d.text, bw - 40, 15), full = shown.length;
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], take = clamp(full - n, 0, l.length); n += l.length + 1;
    txt(l.slice(0, take), narr ? W / 2 : bx + 20, by + 14 + i * 21, { size: 15, align: narr ? 'center' : 'left', color: narr ? '#ffeaa0' : '#fff', outline: false });
  }
  if (d.shown >= d.text.length && Math.floor(S.t * 3) % 2) txt('▼', bx + bw - 24, by + bh - 24, { size: 14, outline: false });
}
function drawFrame() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (S.mode === 'title') drawTitle();
  else if (S.stage) drawStage();
  else if (S.lvl) drawWorld();
  drawDialog();
  if (S.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${S.fade})`; ctx.fillRect(0, 0, W, H); }
}
