'use strict';
// ===== Dibujo (vista desde arriba): texturas, sombras, luces, interfaz =====
const SW = 48, SH = 56, FOOT = 3;
const IMG = {};
for (const k in CH) { const im = new Image(); im.src = `assets/${CH[k]}_caminar_4frames.png`; IMG[k] = im; }
const NATIVE_LEFT = { willy: true };
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
function shadow(x, y, rx, ry, a = .32) {
  ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, 6.2832); ctx.fill();
}
// x = centro, y = pies
function drawChar(id, x, y, o = {}) {
  const im = IMG[id]; if (!im || !im.complete || !im.naturalWidth) return;
  const sc = o.scale || 1, f = o.frame || 0;
  let flip = !!o.flip; if (NATIVE_LEFT[id]) flip = !flip;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y - (o.lift || 0)));
  if (o.tilt) ctx.rotate(o.tilt);
  ctx.scale((flip ? -sc : sc) * (o.sx || 1), sc * (o.sy || 1));
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.drawImage(im, f * SW, 0, SW, SH, -24, -(SH - FOOT), SW, SH);
  if (o.flash) { ctx.globalAlpha = .85; ctx.drawImage(silhouette(id, f), -24, -(SH - FOOT)); ctx.globalAlpha = 1; }
  if (o.red && EYES[id]) {
    for (const [ex, ey] of EYES[id]) {
      ctx.fillStyle = 'rgba(255,0,0,.35)'; ctx.fillRect(ex - 3 - 24, ey - 3 - (SH - FOOT), 7, 7);
      ctx.fillStyle = '#ff1a1a'; ctx.fillRect(ex - 1 - 24, ey - 1 - (SH - FOOT), 3, 3);
    }
  }
  if (o.sleep && EYES[id]) {
    for (const [ex, ey] of EYES[id]) {
      ctx.fillStyle = '#f8d0b0'; ctx.fillRect(ex - 4 - 24, ey - 3 - (SH - FOOT), 9, 7);
      ctx.fillStyle = '#1a1020'; ctx.fillRect(ex - 3 - 24, ey - (SH - FOOT), 7, 1);
    }
  }
  ctx.restore();
}

// ---------- Texturas (16x16 → 48x48) ----------
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g); return c; }
function tex(fn) { const s = mk(24, 24, fn); return mk(48, 48, g => g.drawImage(s, 0, 0, 48, 48)); }
function noise(g, base, cols, seed, p = .4, x0 = 0, y0 = 0, w = 24, h = 24) {
  const rr = mkRng(seed); g.fillStyle = base; g.fillRect(x0, y0, w, h);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (rr() < p) { g.fillStyle = cols[Math.floor(rr() * cols.length)]; g.fillRect(x, y, 1, 1); }
}
const px1 = (g, x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const PAL = {
  day: {
    grass: ['#5fbf4a', ['#52ae3f', '#6ed058', '#4a9e38']], dark: ['#2f7a34', ['#276a2c', '#388a3c', '#215c26']], path: ['#c09a62', ['#b08a56', '#cfab72', '#a47c4a']],
    water: ['#3a8bd8', ['#4a9be8', '#2c7ac8', '#6ab6f6']], wall: ['#8a8a98', ['#7a7a88', '#9a9aa8', '#6a6a78']], wallF: '#4a4a58', arena: ['#8a8a98', ['#7a7a88', '#9a9aa8']],
    tree: [{ out: '#12361c', base: '#2f9a40', mid: '#43b855', hi: '#7fe27a' }, { out: '#143a22', base: '#379e44', mid: '#4cc05a', hi: '#8cf080' }, { out: '#10301a', base: '#2a8a3a', mid: '#3eac50', hi: '#74d870' }],
    rock: ['#7c7c8a', '#a0a0b0', '#5c5c6a'], flower: ['#ff6a8a', '#ffe14a', '#ffffff', '#9ad0ff']
  },
  dream: {
    grass: ['#6a58c8', ['#5b49b4', '#7d6be0', '#8f80f0']], dark: ['#3a2c7a', ['#33266c', '#43358a', '#2a2060']], path: ['#9a86c8', ['#8a76b8', '#aa96d8', '#7a66a8']],
    water: ['#4a52e0', ['#5a62f0', '#3a42d0', '#8a92ff']], wall: ['#6a5f9a', ['#5a4f8a', '#7a6faa', '#4a3f7a']], wallF: '#352a66', arena: ['#4a3f7a', ['#3f3470', '#554a8a']],
    tree: [{ out: '#1c1450', base: '#6a4ad8', mid: '#8a6af0', hi: '#cdbbff' }, { out: '#3a1040', base: '#c64ea0', mid: '#e86ec0', hi: '#ffbfe8' }, { out: '#12284a', base: '#3a78d8', mid: '#5a98f0', hi: '#b5dcff' }],
    rock: ['#6a6a9a', '#9a9aca', '#4a4a7a'], flower: ['#c8bfff', '#ffbfe8', '#9ae8ff', '#ffffff']
  }
};
function buildTex(theme) {
  const P_ = PAL[theme], T_ = {}, dm = theme === 'dream';
  const light = dm ? 'rgba(220,210,255,.16)' : 'rgba(255,255,220,.16)', dark = dm ? 'rgba(10,0,60,.2)' : 'rgba(10,40,10,.2)';
  T_.grass = [0, 1, 2].map(i => tex(g => {
    noise(g, P_.grass[0], P_.grass[1], 100 + i, .5);
    const q = mkRng(200 + i);
    for (let k = 0; k < 3; k++) { px1(g, Math.floor(q() * 16), Math.floor(q() * 16), q() < .5 ? light : dark, 7 + Math.floor(q() * 5), 5 + Math.floor(q() * 5)); }
    for (let k = 0; k < 7; k++) { const x = 1 + Math.floor(q() * 21), y = 2 + Math.floor(q() * 20); px1(g, x, y, P_.grass[1][2]); px1(g, x - 1, y - 1, P_.grass[1][2]); px1(g, x + 1, y - 2, P_.grass[1][1]); px1(g, x, y + 1, P_.grass[1][0]); }
    for (let k = 0; k < 5; k++) px1(g, Math.floor(q() * 24), Math.floor(q() * 24), dm ? '#d8ccff' : '#a8f08a');
  }));
  T_.dark = [0, 1].map(i => tex(g => { noise(g, P_.dark[0], P_.dark[1], 300 + i, .55); const q = mkRng(310 + i); for (let k = 0; k < 8; k++) px1(g, Math.floor(q() * 22), Math.floor(q() * 22), 'rgba(0,0,0,.18)', 3, 2); }));
  T_.path = [0, 1].map(i => tex(g => {
    noise(g, P_.path[0], P_.path[1], 400 + i, .5);
    const q = mkRng(410 + i);
    for (let k = 0; k < 2; k++) px1(g, 0, 5 + k * 11 + Math.floor(q() * 3), 'rgba(0,0,0,.08)', 24, 2);
    for (let k = 0; k < 6; k++) { const x = 1 + Math.floor(q() * 20), y = 1 + Math.floor(q() * 20); px1(g, x + 1, y + 1, 'rgba(0,0,0,.28)', 3, 2); px1(g, x, y, P_.path[1][1], 3, 2); px1(g, x, y, 'rgba(255,255,255,.25)', 2, 1); }
  }));
  T_.wall = tex(g => {
    const q = mkRng(500);
    for (let row = 0; row < 3; row++) {
      const off = row % 2 ? 5 : 0;
      for (let bx = -off; bx < 24; bx += 10) {
        const tone = .88 + q() * .24, c = P_.wall[0], rc = parseInt(c.slice(1, 3), 16) * tone, gc = parseInt(c.slice(3, 5), 16) * tone, bc = parseInt(c.slice(5, 7), 16) * tone;
        g.fillStyle = `rgb(${rc | 0},${gc | 0},${bc | 0})`; g.fillRect(bx, row * 8, 10, 8);
        px1(g, bx, row * 8, 'rgba(255,255,255,.28)', 10, 1); px1(g, bx, row * 8, 'rgba(255,255,255,.18)', 1, 8);
        px1(g, bx, row * 8 + 6, 'rgba(0,0,0,.25)', 10, 2); px1(g, bx + 9, row * 8, 'rgba(0,0,0,.3)', 1, 8);
        for (let k = 0; k < 4; k++) px1(g, bx + 1 + Math.floor(q() * 8), row * 8 + 1 + Math.floor(q() * 5), P_.wall[1][Math.floor(q() * 3)]);
      }
    }
    for (let k = 0; k < 6; k++) px1(g, Math.floor(q() * 22), Math.floor(q() * 22), dm ? '#9ae8ff' : '#5fa04a', 2, 1);
  });
  T_.crack = tex(g => {
    g.drawImage(T_.wall, 0, 0, 48, 48, 0, 0, 24, 24); g.fillStyle = '#120c1e';
    [[12, 0], [11, 2], [11, 4], [10, 6], [10, 8], [11, 10], [12, 12], [13, 13], [14, 15], [15, 17], [14, 19], [13, 21], [12, 23], [8, 8], [7, 9], [16, 14], [18, 15]].forEach(([x, y]) => { g.fillRect(x, y, 2, 2); });
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(13, 2, 1, 6);
  });
  T_.gate = tex(g => { g.drawImage(T_.wall, 0, 0, 48, 48, 0, 0, 24, 24); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(3, 3, 18, 18); g.fillStyle = '#2a2040'; g.fillRect(4, 4, 16, 16); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(4, 4, 16, 2); });
  T_.arena = [0, 1].map(i => tex(g => {
    noise(g, P_.arena[0], P_.arena[1], 600 + i, .12);
    for (const [x, y] of [[0, 0], [12, 0], [0, 12], [12, 12]]) { px1(g, x, y, 'rgba(255,255,255,.16)', 12, 1); px1(g, x, y, 'rgba(255,255,255,.1)', 1, 12); px1(g, x, y + 11, 'rgba(0,0,0,.3)', 12, 1); px1(g, x + 11, y, 'rgba(0,0,0,.3)', 1, 12); }
    if (i) { px1(g, 9, 9, 'rgba(210,190,255,.22)', 6, 1); px1(g, 11, 7, 'rgba(210,190,255,.22)', 2, 5); }
  }));
  T_.water = [0, 1, 2].map(i => tex(g => {
    noise(g, P_.water[0], P_.water[1], 700, .3);
    for (let y = 0; y < 24; y++) px1(g, 0, y, `rgba(255,255,255,${.1 * (1 - y / 24)})`, 24, 1);
    const q = mkRng(710);
    for (let k = 0; k < 6; k++) { const x = (Math.floor(q() * 20) + i * 4) % 22, y = 2 + Math.floor(q() * 20); px1(g, x, y, P_.water[1][2], 5, 1); px1(g, x + 1, y + 1, 'rgba(255,255,255,.35)', 3, 1); px1(g, x + 4, y - 1, P_.water[1][2], 2, 1); }
  }));
  return T_;
}
const TEXS = { day: buildTex('day'), dream: buildTex('dream') };

// ---------- Sprites de escenario ----------
function disc(g, cx, cy, r, col, st = 2) {
  g.fillStyle = col;
  for (let y = -r; y <= r; y += st) for (let x = -r; x <= r; x += st) if (x * x + y * y <= r * r) g.fillRect(cx + x - st / 2, cy + y - st / 2, st, st);
}
function leafy(g, p, blobs, seed, ox = 0) {
  const q = mkRng(seed);
  blobs.forEach(([x, y, rr]) => disc(g, x, y + 4, rr + 3, p.out));
  blobs.forEach(([x, y, rr]) => disc(g, x, y + 3, rr, p.base));
  blobs.forEach(([x, y, rr]) => { disc(g, x + 3, y + 7, Math.floor(rr * .7), 'rgba(0,0,0,.18)'); });
  blobs.forEach(([x, y, rr]) => disc(g, x - 3, y - 2, Math.floor(rr * .74), p.mid));
  blobs.forEach(([x, y, rr]) => disc(g, x - 7, y - 8, Math.floor(rr * .38), p.hi));
  for (let k = 0; k < 46; k++) {
    const b = blobs[Math.floor(q() * blobs.length)], a = q() * 6.28, d = q() * b[2] * .85, x = Math.round(b[0] + Math.cos(a) * d), y = Math.round(b[1] + Math.sin(a) * d * .8);
    g.fillStyle = q() < .5 ? p.out : p.hi; g.globalAlpha = q() < .5 ? .5 : .75; g.fillRect(x, y, 4, 2); g.fillRect(x + 2, y + 2, 2, 2); g.globalAlpha = 1;
  }
}
function makeTree(p, seed) {
  const r = mkRng(seed);
  return mk(96, 124, g => {
    g.fillStyle = p.out; g.fillRect(38, 82, 20, 38); g.fillStyle = '#6b4424'; g.fillRect(41, 84, 14, 34); g.fillStyle = '#8f5e32'; g.fillRect(41, 84, 5, 34); g.fillStyle = '#4a2c14'; g.fillRect(50, 88, 5, 30);
    for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(43 + Math.floor(r() * 9), 88 + Math.floor(r() * 26), 3, 4); }
    g.fillStyle = '#4a2c14'; g.fillRect(34, 114, 10, 6); g.fillRect(54, 114, 10, 6);
    leafy(g, p, [[48, 52, 34], [26, 62, 22], [70, 62, 22], [48, 30, 24], [34, 40, 20], [62, 40, 20]], seed + 5);
    if (seed % 2) { for (let k = 0; k < 5; k++) { const x = 24 + Math.floor(r() * 48), y = 36 + Math.floor(r() * 36); g.fillStyle = '#7a1018'; g.fillRect(x, y, 6, 6); g.fillStyle = '#ff4a5a'; g.fillRect(x, y, 5, 5); g.fillStyle = '#fff'; g.fillRect(x + 1, y + 1, 2, 1); } }
  });
}
function makeRock(c) {
  return mk(56, 52, g => {
    disc(g, 28, 30, 26, '#1a1424'); disc(g, 28, 30, 23, c[0]); disc(g, 22, 25, 15, c[1]); disc(g, 20, 21, 8, 'rgba(255,255,255,.32)');
    g.fillStyle = c[2]; g.fillRect(12, 40, 34, 6); disc(g, 38, 38, 9, 'rgba(0,0,0,.22)');
    g.fillStyle = 'rgba(0,0,0,.35)'; [[30, 18, 2, 10], [32, 26, 8, 2], [18, 34, 2, 8]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
    g.fillStyle = '#5aa045'; g.fillRect(14, 36, 8, 4); g.fillRect(40, 30, 6, 4);
  });
}
function makeBush(p, seed) {
  return mk(64, 52, g => {
    const bl = [[32, 28, 18], [16, 32, 13], [48, 32, 13], [32, 18, 12]];
    leafy(g, p, bl, seed);
    const r = mkRng(seed); for (let k = 0; k < 7; k++) { const x = 12 + Math.floor(r() * 40), y = 18 + Math.floor(r() * 22); g.fillStyle = '#1a1020'; g.fillRect(x - 1, y - 1, 6, 6); g.fillStyle = ['#ff6a8a', '#ffe14a', '#fff'][k % 3]; g.fillRect(x, y, 4, 4); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x, y, 2, 1); }
  });
}
const BUSHES = { day: PAL.day.tree.map((p, i) => makeBush(p, 77 + i)), dream: PAL.dream.tree.map((p, i) => makeBush(p, 88 + i)) };
const TREES = { day: PAL.day.tree.map((p, i) => makeTree(p, 900 + i)), dream: PAL.dream.tree.map((p, i) => makeTree(p, 950 + i)) };
const ROCKS = { day: makeRock(PAL.day.rock), dream: makeRock(PAL.dream.rock) };
function pat(rows, pal, sc = 1) { const h = rows.length, w = rows[0].length; return mk(w * sc, h * sc, g => rows.forEach((r, y) => [...r].forEach((c, x) => { if (pal[c]) { g.fillStyle = pal[c]; g.fillRect(x * sc, y * sc, sc, sc); } }))); }
const DIA = pat(['..ooooo..', '.owwccco.', 'owwcccddo', 'occcccddo', '.occcddo.', '..occdo..', '...odo...', '....o....'], { o: '#0b3a52', w: '#ffffff', c: '#4fe6ff', d: '#1fa6d6' }, 4);
const HEART = (full) => pat(['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], { X: full ? '#ff3b5c' : '#3a2438' }, 4);
const HEART_F = HEART(true), HEART_E = HEART(false);
const HEART_S = pat(['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], { X: '#ff3b5c' }, 3);
const GLOWS = {};
function glow(color) {
  if (GLOWS[color]) return GLOWS[color];
  return GLOWS[color] = mk(128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
}
const LIGHT = mk(128, 128, g => { const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
const VIG = mk(W, H, g => { const gr = g.createRadialGradient(W / 2, H / 2, H * .38, W / 2, H / 2, H * .95); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
const DARK = mk(W, H, () => { });

// Casa de Mike (7x5 tiles + alero)
const HOUSE = mk(7 * T + 40, 5 * T + 24, g => {
  const ox = 20, oy = 24, w = 7 * T;
  g.fillStyle = '#1a0f08'; g.fillRect(ox - 2, oy + 2 * T - 2, w + 4, 3 * T + 2);
  const wr = mkRng(5); for (let y = 0; y < 3 * T; y += 12) { g.fillStyle = y % 24 ? '#b98a52' : '#c79a60'; g.fillRect(ox, oy + 2 * T + y, w, 12); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(ox, oy + 2 * T + y + 10, w, 2); }
  g.fillStyle = '#5a3a1a'; g.fillRect(ox + 3 * T, oy + 4 * T - 10, T, T + 10); g.fillStyle = '#7a4e26'; g.fillRect(ox + 3 * T + 4, oy + 4 * T - 6, T - 8, T + 6); g.fillStyle = '#ffd24a'; g.fillRect(ox + 3 * T + 32, oy + 4 * T + 20, 5, 5);
  for (const wx of [ox + T, ox + 5 * T - 10]) { g.fillStyle = '#3a2410'; g.fillRect(wx - 3, oy + 2 * T + 18, 52, 50); g.fillStyle = '#bfe9ff'; g.fillRect(wx, oy + 2 * T + 21, 46, 44); g.fillStyle = '#e8f8ff'; g.fillRect(wx + 4, oy + 2 * T + 25, 14, 14); g.fillStyle = '#3a2410'; g.fillRect(wx + 21, oy + 2 * T + 21, 4, 44); g.fillRect(wx, oy + 2 * T + 41, 46, 4); g.fillStyle = '#e8503a'; g.fillRect(wx - 2, oy + 2 * T + 62, 50, 8); }
  g.fillStyle = '#1a0a0a'; g.fillRect(ox - 20, oy - 2, w + 40, 2 * T + 4);
  for (let y = 0; y < 2 * T; y += 12) { const inset = Math.max(0, 14 - y / 4); g.fillStyle = y % 24 ? '#b6382c' : '#c8483a'; g.fillRect(ox - 18 + inset, oy + y, w + 36 - inset * 2, 12); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(ox - 18 + inset, oy + y + 10, w + 36 - inset * 2, 2); for (let x = 0; x < w + 36; x += 24) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(ox - 18 + inset + x, oy + y, 2, 10); } }
  g.fillStyle = '#7a1c18'; g.fillRect(ox - 18, oy + 2 * T - 8, w + 36, 8); g.fillStyle = '#5a3a2a'; g.fillRect(ox + 5 * T + 4, oy - 22, 30, 36); g.fillStyle = '#8a8a8a'; g.fillRect(ox + 5 * T, oy - 28, 38, 10);
  g.fillStyle = '#ffe14a'; g.font = 'bold 20px "Courier New"'; g.textAlign = 'center'; g.fillStyle = '#1a0a0a'; g.fillRect(ox + w / 2 - 82, oy + 2 * T + 74, 164, 26); g.fillStyle = '#ffe14a'; g.fillText('CASA DE MIKE', ox + w / 2, oy + 2 * T + 94);
});

// ---------- Minimapa ----------
let MM = null;
function minimapReset() { const L = S.lvl; MM = { c: mk(L.w, L.h, () => { }), drawn: new Uint8Array(L.w * L.h) }; }
function minimapUpdate() {
  if (S.lvl && S.lvl.seen && !S.lvl.allSeen) { S.lvl.seen.fill(1); S.lvl.allSeen = 1; if (MM) MM.drawn.fill(0); }
  const L = S.lvl; if (!MM || !L.seen) return; const g = MM.c.getContext('2d'), dm = L.theme === 'dream';
  const cx = Math.floor(P.x / T), cy = Math.floor(P.y / T);
  const R0 = L.allSeen && !MM.full ? 999 : 10; if (R0 === 999) MM.full = true;
  for (let y = Math.max(0, cy - R0); y <= Math.min(L.h - 1, cy + R0); y++) for (let x = Math.max(0, cx - R0); x <= Math.min(L.w - 1, cx + R0); x++) {
    const i = y * L.w + x; if (!L.seen[i] || MM.drawn[i]) continue; MM.drawn[i] = 1;
    const c = L.g[y][x]; let col;
    if (c === 'T') col = dm ? '#3a2c7a' : '#2a6a30'; else if (c === 'b') col = dm ? '#5a48b8' : '#3a8a40'; else if (c === '~') col = '#4a6aff'; else if (c === 'W' || c === 'C' || c === 'H' || c === 'd') col = '#aaa'; else if (c === 'G') col = '#7df3ff'; else if (c === 'X') col = '#e0a060'; else if (c === 'Y') col = '#dfe6ff'; else if (c === 'Z') col = '#ffd24a'; else if (c === 'R') col = '#778';
    else if (c === ',') col = dm ? '#b8a6e0' : '#d0aa70'; else if (c === 'a') col = '#6a5aaa'; else col = dm ? '#7a68d8' : '#6fcf5a';
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
}

// ---------- Fondo de cielo para cinemáticas ----------
function skyGradient(stops) { const g = ctx.createLinearGradient(0, 0, 0, H); stops.forEach(([p, c]) => g.addColorStop(p, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
const STARS = (() => { const r = mkRng(7), a = []; for (let i = 0; i < 140; i++) a.push({ x: r() * W, y: r() * 330, s: r() < .15 ? 3 : 2, p: r() * 6 }); return a; })();
function bigStar(x, y, r, color, gl) {
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.drawImage(glow(gl), x - 50, y - 50, 100, 100); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = color; ctx.fillRect(x - r, y - 2, 2 * r + 1, 4); ctx.fillRect(x - 2, y - r, 4, 2 * r + 1); ctx.fillRect(x - 4, y - 4, 9, 9); ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 5, 5);
}
function drawNightSky(dark, t) {
  if (dark) skyGradient([[0, '#10020c'], [.6, '#3a0a24'], [1, '#6a1530']]); else skyGradient([[0, '#070b24'], [.55, '#16285a'], [1, '#34548f']]);
  for (const s of STARS) { const tw = (Math.sin(t * 2 + s.p) + 1) / 2; ctx.fillStyle = dark ? `rgba(255,150,170,${.2 + tw * .5})` : `rgba(255,255,255,${.3 + tw * .7})`; ctx.fillRect(s.x, s.y, s.s, s.s); }
  ctx.fillStyle = dark ? '#1a0610' : '#0b1638';
  for (let x = 0; x < W; x += 24) { const h = 70 + Math.sin(x * .013) * 28 + Math.sin(x * .05) * 10; ctx.fillRect(x, 400 - h, 25, h + 140); }
}
function drawSevenStars(dark, t) {
  for (let i = 0; i < 7; i++) {
    const x = 100 + i * 127, y = 66 + Math.sin(i * 1.1) * 26 + Math.sin(t * 2 + i) * 3;
    if (dark) bigStar(x, y, 12, '#b04bff', 'rgba(255,40,80,.9)'); else bigStar(x, y, 12, '#fff6a0', 'rgba(255,230,90,.9)');
  }
}

// ---------- Mundo ----------
const FLY = []; for (let i = 0; i < 46; i++) FLY.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6, s: .3 + Math.random() * .7 });
function drawFloor(L, texs, x0, x1, y0, y1, lights) {
  const t = S.t, wf = Math.floor(Math.max(0, t) * 2.2) % 3, dm = L.theme === 'dream';
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const c = L.g[ty][tx], x = tx * T, y = ty * T, h = hash2(tx, ty);
    let img;
    if (c === ',') img = texs.path[h % 2];
    else if (c === 'a') img = texs.arena[(tx + ty) % 2];
    else if (c === '~') {
      ctx.drawImage(texs.water[wf], x, y);
      const nb = (a, b) => L.get(tx + a, ty + b) !== '~';
      ctx.fillStyle = dm ? 'rgba(200,210,255,.55)' : 'rgba(255,255,255,.55)';
      if (nb(0, -1)) ctx.fillRect(x, y, T, 4); if (nb(0, 1)) ctx.fillRect(x, y + T - 4, T, 4); if (nb(-1, 0)) ctx.fillRect(x, y, 4, T); if (nb(1, 0)) ctx.fillRect(x + T - 4, y, 4, T);
      if (!nb(0, -1) && !nb(0, 1) && !nb(-1, 0) && !nb(1, 0)) { ctx.fillStyle = dm ? 'rgba(10,0,60,.3)' : 'rgba(0,30,90,.24)'; ctx.fillRect(x, y, T, T); }
      if (h % 9 === 0 && !nb(0, 0)) { const lx = x + 10 + (h >> 4) % 18, ly = y + 12 + (h >> 7) % 18 + Math.sin(t * 1.5 + h) * 1.5; if (dm) { ctx.fillStyle = '#9ae8ff'; ctx.fillRect(lx, ly, 8, 8); ctx.fillStyle = '#fff'; ctx.fillRect(lx + 2, ly + 2, 4, 4); lights.push({ x: lx + 4, y: ly + 4, r: 60, col: 'rgba(120,220,255,.5)' }); } else { ctx.fillStyle = '#1a5a2a'; ctx.fillRect(lx, ly, 16, 12); ctx.fillStyle = '#3aa848'; ctx.fillRect(lx + 2, ly + 2, 12, 8); ctx.fillStyle = '#ff7aa8'; ctx.fillRect(lx + 6, ly + 3, 5, 5); } }
      if ((h + Math.floor(t * 1.5)) % 11 === 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + (h % 30), y + (h % 36) + 4, 6, 3); }
      continue;
    }
    else if (c === 'T' || c === 'W' || c === 'C' || c === 'G' || c === 'H' || c === 'd' || c === 'R') img = (c === 'R' ? texs.grass[h % 3] : texs.dark[h % 2]);
    else img = texs.grass[h % 3];
    ctx.drawImage(img, x, y);
    const grassy = ch => '.fmbTR'.includes(ch), pth = ch => ch === ',' || ch === 'a', wl = ch => 'WCG'.includes(ch);
    const PG = PAL[dm ? 'dream' : 'day'];
    if (grassy(c)) {
      ctx.fillStyle = dm ? 'rgba(10,0,50,.22)' : 'rgba(20,60,10,.28)';
      if (pth(L.get(tx, ty - 1))) ctx.fillRect(x, y, T, 5); if (pth(L.get(tx, ty + 1))) ctx.fillRect(x, y + T - 5, T, 5);
      if (pth(L.get(tx - 1, ty))) ctx.fillRect(x, y, 5, T); if (pth(L.get(tx + 1, ty))) ctx.fillRect(x + T - 5, y, 5, T);
      if (c !== 'T' && c !== 'R' && h % 4 === 0) {
        const sw = Math.sin(t * 2.2 + tx * .8 + ty * .5) * 2, gc = dm ? '#b8a9ff' : '#8ae27a';
        for (let k = 0; k < 3; k++) { const bx = x + 8 + k * 14 + (h >> k) % 6, by = y + 26 + ((h >> (k + 3)) % 14); ctx.fillStyle = dm ? '#7d6be0' : '#3f9a38'; ctx.fillRect(bx, by, 3, 6); ctx.fillStyle = gc; ctx.fillRect(Math.round(bx + sw), by - 5, 3, 6); }
      }
    } else if (pth(c)) {
      const gcol = PG.grass[0];
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        if (!grassy(L.get(tx + dx, ty + dy)) || c === 'a') continue;
        for (let i = 0; i < 8; i++) {
          const long = (h >> (i + (dx + 2) * 2)) & 1, len = long ? 10 : 5;
          ctx.fillStyle = gcol; if (dy) ctx.fillRect(x + i * 6, dy < 0 ? y : y + T - len, 6, len); else ctx.fillRect(dx < 0 ? x : x + T - len, y + i * 6, len, 6);
          ctx.fillStyle = PG.grass[1][1]; if (dy) ctx.fillRect(x + i * 6, dy < 0 ? y + len - 2 : y + T - len, 6, 2); else ctx.fillRect(dx < 0 ? x + len - 2 : x + T - len, y + i * 6, 2, 6);
        }
      }
    }
    if (!wl(c) && wl(L.get(tx, ty - 1))) { ctx.fillStyle = 'rgba(0,0,0,.24)'; ctx.fillRect(x, y, T, 9); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(x, y + 9, T, 9); ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fillRect(x, y + 18, T, 9); }
    if (c === 'f') {
      const r = mkRng(h), cols = PAL[L.theme === 'dream' ? 'dream' : 'day'].flower;
      for (let k = 0; k < 3; k++) { const fx = x + 6 + Math.floor(r() * 32), fy = y + 8 + Math.floor(r() * 30); ctx.fillStyle = '#2a6a2a'; ctx.fillRect(fx + 2, fy + 4, 2, 6); ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.fillRect(fx, fy, 6, 2); ctx.fillRect(fx + 2, fy - 2, 2, 6); ctx.fillStyle = '#ffe14a'; ctx.fillRect(fx + 2, fy, 2, 2); }
    } else if (c === 'm') {
      const r = mkRng(h), bob = Math.sin(t * 2 + h) * .6;
      for (let k = 0; k < 2; k++) { const mx = x + 8 + Math.floor(r() * 26), my = y + 14 + Math.floor(r() * 22); ctx.fillStyle = '#e8f0ff'; ctx.fillRect(mx + 2, my + 6, 4, 7); ctx.fillStyle = k ? '#ff6ad0' : '#6ad8ff'; ctx.fillRect(mx - 2, my + bob, 12, 7); ctx.fillStyle = '#fff'; ctx.fillRect(mx, my + 2, 3, 2); ctx.fillRect(mx + 6, my + 3, 2, 2); lights.push({ x: mx + 4, y: my + 4, r: 70, col: k ? 'rgba(255,100,210,.55)' : 'rgba(100,220,255,.55)' }); }
    }
  }
}
function drawWallTile(L, texs, tx, ty) {
  const c = L.g[ty][tx], x = tx * T, y = ty * T, below = L.get(tx, ty + 1);
  const img = c === 'C' ? texs.crack : c === 'G' ? texs.gate : texs.wall;
  ctx.drawImage(img, x, y - 14);
  if (DOORKEY[c] !== undefined) {
    const col = ['#d08a4a', '#cfd6ee', '#ffd24a'][DOORKEY[c]], pul = .55 + .45 * Math.sin(S.t * 3);
    ctx.fillStyle = '#120a06'; ctx.fillRect(x + 1, y - 18, T - 2, T + 8); ctx.fillStyle = '#7a4e26'; ctx.fillRect(x + 4, y - 15, T - 8, T + 2);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#8a5a2e' : '#6a4220'; ctx.fillRect(x + 4 + i * 10, y - 15, 9, T + 2); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + 4 + i * 10, y - 15, 2, T + 2); }
    ctx.fillStyle = '#2a2230'; ctx.fillRect(x + 4, y - 8, T - 8, 5); ctx.fillRect(x + 4, y + 14, T - 8, 5);
    ctx.fillStyle = '#120a06'; ctx.beginPath(); ctx.arc(x + 24, y + 7, 12, 0, 6.3); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 24, y + 7, 10, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 22, y + 2, 4, 6); ctx.fillRect(x + 23, y + 7, 2, 7);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .3 * pul; ctx.fillStyle = col; ctx.fillRect(x + 4, y - 15, T - 8, T + 2); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    return;
  }
  ctx.fillStyle = PAL[L.theme === 'dream' ? 'dream' : 'day'].wallF; ctx.fillRect(x, y + T - 14, T, 14);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + T - 14, T, 3);
  if (below === 'W' || below === 'C' || below === 'G') { ctx.drawImage(img, 0, 34, 48, 14, x, y + T - 14, T, 14); }
  if (c === 'G') {
    const ok = S.dia >= L.diaNeed, pulse = .6 + .4 * Math.sin(S.t * 4);
    ctx.globalAlpha = .3 + .3 * pulse; ctx.fillStyle = ok ? '#7df3ff' : '#ff4a5a'; ctx.fillRect(x + 8, y - 6, 32, 38); ctx.globalAlpha = 1;
    ctx.drawImage(DIA, 0, 0, 36, 32, x + 6, y - 6, 36, 32);
  }
}
function drawSlime(e) {
  const t = S.t, hop = e.hopT > 0 ? Math.sin(clamp(e.hopT / .35, 0, 1) * Math.PI) : 0, w = 38 - hop * 6, h = 30 + hop * 10, x = e.x - w / 2, y = e.y - h - hop * 14;
  if (e.flash > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); return; }
  ctx.fillStyle = '#1a5a2a'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#62d874'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#8af59a'; ctx.fillRect(x + 4, y + 4, w - 8, 5); ctx.fillStyle = '#3fa852'; ctx.fillRect(x, y + h - 7, w, 7);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 5, y + 5, 7, 3);
  const dx = clamp((P.x - e.x) / 60, -1, 1) * 3; ctx.fillStyle = '#fff'; ctx.fillRect(x + 6 + dx, y + 10, 9, 10); ctx.fillRect(x + w - 15 + dx, y + 10, 9, 10);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 10 + dx, y + 13, 5, 6); ctx.fillRect(x + w - 11 + dx, y + 13, 5, 6); ctx.fillRect(x + 12, y + h - 11, w - 24, 3);
  if (Math.sin(t * 7 + e.x) > .93) { ctx.fillStyle = 'rgba(255,0,200,.7)'; ctx.fillRect(x - 6, y + 12, w + 12, 5); }
}
function drawFlyer(e) {
  const t = S.t * 14 + e.x, wing = Math.sin(t) * 8, bob = Math.sin(S.t * 5 + e.x) * 3, x = e.x, y = e.y - e.z + bob;
  ctx.fillStyle = '#8a5acd'; ctx.fillRect(x - 26, y - 8 - wing, 16, 10); ctx.fillRect(x + 10, y - 8 + wing, 16, 10);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 12, y - 10, 24, 24); ctx.fillStyle = e.flash > 0 ? '#fff' : '#4b2a7a'; ctx.fillRect(x - 10, y - 8, 20, 20);
  ctx.fillStyle = '#ff2a4a'; ctx.fillRect(x - 7, y - 2, 5, 5); ctx.fillRect(x + 3, y - 2, 5, 5);
  ctx.fillStyle = '#c9a0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('z', x + 8, y - 24);
}
function drawDummy(e) {
  const sh = e.hit > 0 ? Math.sin(e.hit * 60) * 3 : 0, x = e.x + sh, y = e.y;
  ctx.fillStyle = '#1a0f08'; ctx.fillRect(x - 5, y - 36, 10, 36); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - 3, y - 34, 6, 34);
  ctx.fillStyle = '#1a0f08'; ctx.fillRect(x - 24, y - 32, 48, 10); ctx.fillStyle = '#7a5a2a'; ctx.fillRect(x - 22, y - 30, 44, 6);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 17, y - 66, 34, 34); ctx.fillStyle = e.hit > 0 ? '#fff' : '#d9b46a'; ctx.fillRect(x - 15, y - 64, 30, 30);
  ctx.fillStyle = '#7a5a2a'; ctx.fillRect(x - 15, y - 40, 30, 6); ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 9, y - 56, 5, 5); ctx.fillRect(x + 4, y - 56, 5, 5); ctx.fillRect(x - 8, y - 46, 16, 3);
  txt('.exe', x, y - 86, { size: 13, align: 'center', color: '#ff8aff', lw: 3 });
}
function drawSignProp(s) {
  ctx.fillStyle = '#1a0f08'; ctx.fillRect(s.x - 5, s.y - 40, 10, 40); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(s.x - 3, s.y - 38, 6, 38);
  ctx.fillStyle = '#1a0f08'; ctx.fillRect(s.x - 22, s.y - 66, 44, 30); ctx.fillStyle = '#c9a15a'; ctx.fillRect(s.x - 20, s.y - 64, 40, 26); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(s.x - 20, s.y - 42, 40, 4);
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(s.x - 12, s.y - 58, 24, 3); ctx.fillRect(s.x - 12, s.y - 51, 18, 3);
}
function drawSwordFx(p) {
  const prog = 1 - p.atk / .26; if (prog < 0 || prog > 1) return;
  const base = Math.atan2(p.ady, p.adx), ang = base + (-1.15 + 2.3 * prog), cx = p.x, cy = p.y - 22;
  ctx.save(); ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const a0 = base - 1.15 + 2.3 * Math.max(0, prog - i * .05); ctx.globalAlpha = (.5 - i * .08); ctx.strokeStyle = '#9ff4ff'; ctx.lineWidth = 12 - i * 1.5; ctx.beginPath(); ctx.arc(0, 0, 50, a0 - .25, a0 + .05); ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.rotate(ang);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(8, -6, 56, 12); ctx.fillStyle = '#6b3a1a'; ctx.fillRect(10, -3, 14, 6); ctx.fillStyle = '#666'; ctx.fillRect(24, -9, 5, 18);
  ctx.fillStyle = '#3fe0f5'; ctx.fillRect(29, -4, 34, 8); ctx.fillStyle = '#d0ffff'; ctx.fillRect(29, -4, 34, 3); ctx.fillStyle = '#fff'; ctx.fillRect(60, -2, 4, 4);
  ctx.restore();
}
function drawProj(q) {
  if (q.type === 'pillow') { ctx.save(); ctx.translate(q.x, q.y - q.z); ctx.rotate(q.rot); ctx.fillStyle = '#1a1020'; ctx.fillRect(-20, -14, 40, 28); ctx.fillStyle = '#fff'; ctx.fillRect(-17, -11, 34, 22); ctx.fillStyle = '#9ad0ff'; ctx.fillRect(-17, -2, 34, 5); ctx.restore(); }
}
function drawGroundFx() {
  const t = S.t;
  for (const w of S.warns) {
    const p = w.t / w.dur, a = .25 + .3 * Math.abs(Math.sin(t * 12));
    ctx.fillStyle = `rgba(255,40,70,${a})`; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r, w.r * .72, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(255,230,230,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r * p, w.r * .72 * p, 0, 0, 6.28); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,60,80,.9)'; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r, w.r * .72, 0, 0, 6.28); ctx.stroke();
  }
  for (const q of S.proj) if (q.type === 'ring') {
    ctx.strokeStyle = `rgba(220,200,255,${1 - q.r / q.max})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r, q.r * .72, 0, 0, 6.28); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  }
}
function drawSheepFall(w) {
  const left = w.dur - w.t; if (left > .4) return;
  const y = w.y - left * 900, x = w.x;
  ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 22, y - 30, 44, 34); ctx.fillStyle = '#fff'; ctx.fillRect(x - 19, y - 27, 38, 28); ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 6, y - 22, 14, 14); ctx.fillStyle = 'rgba(255,0,200,.4)'; ctx.fillRect(x - 19, y - 18, 38, 4);
}

function drawWorld() {
  const L = S.lvl, cam = S.cam, dm = L.theme === 'dream', texs = TEXS[dm ? 'dream' : 'day'], lights = [];
  ctx.fillStyle = dm ? '#1a1240' : '#2f7a34'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  const sx = S.shake > 0 ? rnd(-1, 1) * S.shake * 22 : 0, sy = S.shake > 0 ? rnd(-1, 1) * S.shake * 22 : 0;
  const camx = Math.round(cam.x + sx), camy = Math.round(cam.y + sy);
  ctx.translate(-camx, -camy);
  const x0 = Math.max(0, Math.floor(camx / T) - 1), x1 = Math.min(L.w - 1, Math.floor((camx + W) / T) + 1);
  const y0 = Math.max(0, Math.floor(camy / T) - 1), y1 = Math.min(L.h - 1, Math.floor((camy + H) / T) + 4);
  drawFloor(L, texs, x0, x1, Math.max(0, y0), Math.min(L.h - 1, Math.floor((camy + H) / T) + 1), lights);
  // ---- sombras ----
  const items = [];
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const c = L.g[ty][tx], x = tx * T, y = ty * T;
    if (c === 'T') {
      const v = hash2(tx, ty) % 3, spr = TREES[dm ? 'dream' : 'day'][v];
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 34, y + 44, 44, 17, -.12, 0, 6.28); ctx.fill();
      const sway = Math.sin(S.t * 1.3 + tx * .7) * 1.5;
      items.push({ y: y + T - 4, d: () => { const behind = !P.dead && Math.abs(P.x - (x + 24)) < 56 && P.y < y + T - 4 && P.y > y - 70; if (behind) ctx.globalAlpha = .42; ctx.drawImage(spr, x + 24 - 48 + sway * .5, y + T - 124 + 6); ctx.globalAlpha = 1; } });
    } else if (c === 'R') {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 30, y + 40, 30, 11, 0, 0, 6.28); ctx.fill();
      items.push({ y: y + T - 6, d: () => ctx.drawImage(ROCKS[dm ? 'dream' : 'day'], x - 4, y - 2) });
    } else if (c === 'b') {
      const spr = BUSHES[dm ? 'dream' : 'day'][hash2(tx, ty) % 3];
      ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.beginPath(); ctx.ellipse(x + 28, y + 42, 28, 10, 0, 0, 6.28); ctx.fill();
      items.push({ y: y + T - 8, d: () => ctx.drawImage(spr, x - 8, y - 6) });
    } else if (c === 'k') {
      const fl = .75 + .25 * Math.sin(S.t * 13 + tx) + .1 * Math.sin(S.t * 29 + ty);
      lights.push({ x: x + 24, y: y - 6, r: 210 * fl, col: 'rgba(255,170,60,.5)', strong: true });
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 28, y + 44, 16, 6, 0, 0, 6.28); ctx.fill();
      items.push({ y: y + T - 4, d: () => {
        ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 14, y + 22, 20, 24); ctx.fillStyle = '#7a7a8c'; ctx.fillRect(x + 16, y + 24, 16, 20); ctx.fillStyle = '#9a9aac'; ctx.fillRect(x + 16, y + 24, 5, 20);
        ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 20, y - 4, 8, 30); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x + 22, y - 2, 4, 28);
        ctx.fillStyle = '#1a1020'; ctx.fillRect(x + 12, y - 16, 24, 16); ctx.fillStyle = '#4a4a5a'; ctx.fillRect(x + 14, y - 14, 20, 12);
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow('rgba(255,170,60,.9)'), x - 22, y - 46, 92, 92); ctx.globalCompositeOperation = 'source-over';
        const fh = 14 + fl * 7; ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x + 17, y - 14 - fh + 14, 14, fh); ctx.fillStyle = '#ffd24a'; ctx.fillRect(x + 20, y - 8 - fh * .6 + 6, 8, fh * .7); ctx.fillStyle = '#fff6c0'; ctx.fillRect(x + 22, y - 2 - fh * .3 + 4, 4, fh * .35);
      } });
    } else if (c === 'W' || c === 'C' || c === 'G' || DOORKEY[c] !== undefined) {
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 6, y + T - 4, T, 14);
      items.push({ y: y + T - 2, d: () => drawWallTile(L, texs, tx, ty) });
    }
  }
  if (S.lvlId === 0) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(4 * T + 14, 7 * T - 8, 7 * T, 16); items.push({ y: 7 * T - 2, d: () => ctx.drawImage(HOUSE, 4 * T - 20, 2 * T - 24) }); }
  if (L.arena) {
    const A = L.arena, cx = (A.x0 + A.x1) / 2, cy = (A.y0 + A.y1) / 2, t = S.t, on = S.bossLock, a = on ? .95 : .55;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .72);
    for (const [rad, lw, col] of [[250, 10, on ? 'rgba(255,60,110,' : 'rgba(150,110,255,'], [200, 5, 'rgba(210,190,255,'], [150, 4, on ? 'rgba(255,120,170,' : 'rgba(170,140,255,']]) { ctx.strokeStyle = col + (a * .5) + ')'; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 6.2832); ctx.stroke(); }
    for (let i = 0; i < 24; i++) { const an = i / 24 * 6.2832 + t * .15 * (on ? 2.2 : 1), rr = 225; ctx.save(); ctx.rotate(an); ctx.fillStyle = `rgba(230,210,255,${a * (.35 + .35 * Math.sin(t * 2 + i))})`; ctx.fillRect(rr, -5, 12, 10); ctx.restore(); }
    ctx.restore(); lights.push({ x: cx, y: cy, r: 330, col: on ? 'rgba(255,60,110,.22)' : 'rgba(150,110,255,.22)' });
  }
  drawGroundFx();
  // portal
  if (L.exit) {
    const r = L.exit, cx = r.x + 24, cy = r.y + r.h / 2, pul = .8 + .2 * Math.sin(S.t * 3);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow('rgba(150,100,255,.9)'), cx - 100, cy - 100, 200, 200); ctx.globalCompositeOperation = 'source-over';
    lights.push({ x: cx, y: cy, r: 150, col: 'rgba(150,100,255,.5)' });
    items.push({ y: r.y + r.h, d: () => {
      ctx.fillStyle = '#1a0f33'; ctx.fillRect(r.x - 6, r.y - 12, r.w + 12, r.h + 12); ctx.fillStyle = '#6a3fc8'; ctx.fillRect(r.x, r.y - 6, r.w, r.h);
      for (let i = 0; i < 10; i++) { ctx.fillStyle = `rgba(255,255,255,${.3 + .3 * Math.sin(S.t * 3 + i)})`; ctx.fillRect(r.x + 6 + (i * 11) % 32, r.y + ((i * 37 + S.t * 40) % (r.h - 8)), 5, 5); }
      txt('VALLE DEL SUEÑO →', r.x - 12, r.y - 40, { size: 15, align: 'right', color: '#d9c8ff' });
    } });
  }
  for (const s of L.signs) items.push({ y: s.y, d: () => { shadow(s.x, s.y, 16, 6, .3); drawSignProp(s); } });
  // ---- entidades ----
  for (const e of S.ents) {
    if (e.type === 'slime') items.push({ y: e.y, d: () => { shadow(e.x, e.y - 2, 22, 9); drawSlime(e); } });
    else if (e.type === 'flyer') items.push({ y: e.y, d: () => { shadow(e.x, e.y, 14, 6, .25); drawFlyer(e); } });
    else if (e.type === 'dummy') items.push({ y: e.y, d: () => { shadow(e.x, e.y, 20, 8); drawDummy(e); } });
    else if (e.type === 'key') {
      const b = Math.sin(e.t * 3) * 5, col = ['#e0a060', '#dfe6ff', '#ffd24a'][e.k], rc = ['rgba(255,170,90,.9)', 'rgba(200,215,255,.9)', 'rgba(255,220,80,.9)'][e.k];
      lights.push({ x: e.x, y: e.y, r: 120, col: rc.replace('.9', '.55'), strong: true });
      items.push({ y: e.y + 22, d: () => {
        shadow(e.x, e.y + 24, 14, 5, .25); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow(rc), e.x - 44, e.y - 44 + b, 88, 88); ctx.globalCompositeOperation = 'source-over';
        const kx = e.x, ky = e.y + b; ctx.save(); ctx.translate(kx, ky); ctx.rotate(Math.sin(e.t * 2) * .2);
        ctx.fillStyle = '#1a1020'; ctx.fillRect(-18, -6, 30, 12); ctx.beginPath(); ctx.arc(-18, 0, 12, 0, 6.3); ctx.fill(); ctx.fillRect(2, 6, 8, 10); ctx.fillRect(10, 6, 6, 8);
        ctx.fillStyle = col; ctx.fillRect(-17, -4, 28, 8); ctx.beginPath(); ctx.arc(-18, 0, 9, 0, 6.3); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-18, 0, 4, 0, 6.3); ctx.fill();
        ctx.fillStyle = col; ctx.fillRect(3, 4, 5, 9); ctx.fillRect(10, 4, 4, 7); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-10, -4, 18, 2); ctx.restore();
      } });
    }
    else if (e.type === 'dia') { const b = Math.sin(e.t * 3) * 5; lights.push({ x: e.x, y: e.y, r: 130, col: 'rgba(90,240,255,.6)', strong: true }); items.push({ y: e.y + 20, d: () => { shadow(e.x, e.y + 22, 16, 6, .25); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow('rgba(90,240,255,.8)'), e.x - 46, e.y - 46 + b, 92, 92); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(DIA, e.x - 18, e.y - 18 + b); if (Math.sin(e.t * 5) > .7) { ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 14, e.y - 22 + b, 4, 4); ctx.fillRect(e.x + 12, e.y - 20 + b, 8, 0); } } }); }
    else if (e.type === 'heart') { const b = Math.sin(e.t * 3) * 4; items.push({ y: e.y + 20, d: () => { shadow(e.x, e.y + 22, 12, 5, .25); ctx.drawImage(HEART_F, e.x - 14, e.y - 14 + b); } }); }
    else if (e.type === 'npc') {
      const near = S.nearNpc === e;
      items.push({ y: e.y, d: () => {
        shadow(e.x, e.y - 2, 22, 8); drawChar(e.id, e.x, e.y, { flip: P.x < e.x, lift: Math.abs(Math.sin(S.t * 2 + e.x)) * 1.2 });
        if (near) { txt(NAMES[e.id], e.x, e.y - 82, { size: 15, align: 'center', color: '#ffe14a' }); ctx.fillStyle = '#fff'; ctx.fillRect(e.x - 11, e.y - 66, 22, 22); ctx.fillStyle = '#1a1020'; ctx.fillRect(e.x - 9, e.y - 64, 18, 18); txt('E', e.x, e.y - 64, { size: 15, align: 'center', outline: false }); }
      } });
    }
  }
  const w = S.willy;
  if (w) items.push({ y: w.y, d: () => { shadow(w.x, w.y, 18, 7); drawChar('willy', w.x, w.y + 2, { frame: w.moving ? [1, 0, 3, 0][Math.floor(w.anim * 10) % 4] : 0, flip: w.face < 0, lift: w.moving ? Math.abs(Math.sin(w.anim * 14)) * 2 : 0 }); } });
  const b = S.boss;
  if (b && !b.dead) {
    const walking = b.state === 'walk', fr = walking ? [1, 0, 3, 0][Math.floor(b.anim * 6) % 4] : 0, crouch = (b.state === 'slam' && b.lift === 0 && b.t > .77) ? .9 : 1;
    lights.push({ x: b.x, y: b.y - 40, r: 170, col: 'rgba(255,60,90,.35)' });
    items.push({ y: b.y, d: () => {
      const sc = 1 - b.lift / 400; shadow(b.x, b.y - 2, 46 * sc, 16 * sc, .38);
      drawChar(b.kind || 'timba', b.x, b.y, { scale: 2, frame: fr, flip: b.face > 0, flash: b.flash > 0, red: b.state !== 'saved', sleep: b.state === 'sleep', lift: b.lift, sy: crouch });
    } });
  }
  for (const q of S.proj) if (q.type === 'pillow') items.push({ y: q.y, d: () => { shadow(q.x, q.y, 14, 6, .3); drawProj(q); } });
  if (!P.dead) {
    items.push({ y: P.y, d: () => {
      const blink = P.inv > 0 && Math.floor(P.inv * 18) % 2 === 0, fr = P.moving ? [1, 0, 3, 0][Math.floor(P.anim * 11) % 4] : 0;
      shadow(P.x, P.y - 2, 22, 8, .38);
      drawChar('mike', P.x, P.y, { frame: fr, flip: P.face < 0, alpha: blink ? .35 : 1, lift: P.moving ? Math.abs(Math.sin(P.anim * 11)) * 3 : Math.sin(P.anim * 2) * .8, tilt: P.moving ? Math.sin(P.anim * 11) * .05 : 0 });
      drawSwordFx(P);
    } });
    lights.push({ x: P.x, y: P.y - 30, r: 230, col: 'rgba(255,240,200,.25)', strong: true });
  }
  if (w) lights.push({ x: w.x, y: w.y - 10, r: 90, col: null });
  items.sort((a, c) => a.y - c.y);
  for (const it of items) it.d();
  // ---- encima de todo ----
  for (const wn of S.warns) if (wn.kind === 'sheep') drawSheepFall(wn);
  for (const q of S.particles) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); ctx.fillStyle = q.color; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size); }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawAtmos(dm, camx, camy);
  drawLighting(L, lights, camx, camy, dm);
  // carteles (texto, por encima de la luz)
  ctx.save(); ctx.translate(-camx, -camy);
  let ns = null, bd = 150; for (const s of L.signs) { const d = dist(P.x, P.y, s.x, s.y); if (d < bd) { bd = d; ns = s; } }
  if (ns) { ctx.font = 'bold 17px "Courier New"'; const tw = ctx.measureText(ns.text).width + 28; ctx.fillStyle = 'rgba(10,8,30,.88)'; ctx.fillRect(ns.x - tw / 2, ns.y - 120, tw, 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(ns.x - tw / 2 + 1, ns.y - 119, tw - 2, 38); txt(ns.text, ns.x, ns.y - 110, { size: 17, align: 'center', outline: false }); }
  for (const f of S.floaters) { ctx.globalAlpha = clamp(1.3 - f.t, 0, 1); txt(f.text, f.x, f.y, { size: 18, color: f.color }); }
  ctx.globalAlpha = 1; ctx.restore();
  ctx.drawImage(VIG, 0, 0, W, H);
  drawHUD();
}
const LEAVES = []; for (let i = 0; i < 26; i++) LEAVES.push({ x: Math.random() * W, y: Math.random() * H, vx: 14 + Math.random() * 20, vy: 22 + Math.random() * 26, p: Math.random() * 6, c: i % 3 });
function drawAtmos(dm, camx, camy) {
  const t = S.t;
  if (!dm) {
    ctx.fillStyle = 'rgba(8,30,10,.09)';
    for (let i = 0; i < 4; i++) { const x = ((t * 16 + i * 560 - camx * .5) % (W + 900) + W + 900) % (W + 900) - 400, y = 90 + i * 150 + Math.sin(t * .1 + i) * 30; ctx.beginPath(); ctx.ellipse(x, y, 280, 96, -.1, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 130, y + 40, 170, 60, 0, 0, 6.28); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) { const x0 = 120 + i * 260 + Math.sin(t * .25 + i) * 40; ctx.fillStyle = `rgba(255,240,190,${.045 + .02 * Math.sin(t * .6 + i)})`; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 70, 0); ctx.lineTo(x0 + 260, H); ctx.lineTo(x0 + 130, H); ctx.closePath(); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    for (const l of LEAVES) {
      const x = ((l.x + t * l.vx + Math.sin(t + l.p) * 24) % (W + 60) + W + 60) % (W + 60) - 30, y = ((l.y + t * l.vy) % (H + 40) + H + 40) % (H + 40) - 20, k = Math.sin(t * 3 + l.p);
      ctx.fillStyle = ['#7fd05a', '#e8c24a', '#ff9ac0'][l.c]; ctx.fillRect(Math.round(x), Math.round(y), 8, 5 + Math.round(k * 2)); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(Math.round(x), Math.round(y) + 3, 8, 2);
    }
  }
}
function drawLighting(L, lights, camx, camy, dm) {
  const arena = S.bossLock, g = DARK.getContext('2d');
  if (dm) {
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.fillStyle = arena ? 'rgba(40,0,24,.6)' : 'rgba(14,8,48,.56)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    for (const l of lights) { const sx = l.x - camx, sy = l.y - camy; if (sx < -l.r || sx > W + l.r || sy < -l.r || sy > H + l.r) continue; g.globalAlpha = l.strong ? 1 : .8; g.drawImage(LIGHT, sx - l.r, sy - l.r, l.r * 2, l.r * 2); }
    g.globalAlpha = 1; ctx.drawImage(DARK, 0, 0);
  } else { ctx.fillStyle = 'rgba(255,214,150,.07)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .22; ctx.drawImage(glow('rgba(255,235,170,.9)'), -160, -180, 700, 560); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) { if (!l.col) continue; const sx = l.x - camx, sy = l.y - camy; if (sx < -l.r || sx > W + l.r || sy < -l.r || sy > H + l.r) continue; ctx.globalAlpha = l.strong ? .5 : .7; ctx.drawImage(glow(l.col), sx - l.r, sy - l.r, l.r * 2, l.r * 2); }
  // luciérnagas / motas
  const t = S.t;
  for (const f of FLY) {
    const x = (f.x + Math.sin(t * .6 + f.p) * 30 - camx * .15 * f.s + W * 10) % W, y = (f.y + Math.cos(t * .5 + f.p) * 20 - camy * .1 * f.s + H * 10) % H, a = (Math.sin(t * 2 + f.p) + 1) / 2;
    ctx.globalAlpha = (dm ? .35 : .22) + a * .5; ctx.fillStyle = dm ? '#bfe9ff' : '#fff6a0'; ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
    ctx.globalAlpha *= .4; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 5, 5);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function panel(x, y, w, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(40,30,90,.82)'); g.addColorStop(1, 'rgba(10,6,34,.86)');
  ctx.fillStyle = g; rrect(x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; rrect(x + 1.5, y + 1.5, w - 3, h - 3, 11); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y + 5); ctx.lineTo(x + w - 10, y + 5); ctx.stroke();
}
function drawHUD() {
  const L = S.lvl;
  { // barra de vida (porcentaje)
    panel(12, 12, 290, 46); const pc = Math.max(0, P.hp / P.maxHp), bw = 200;
    ctx.fillStyle = '#1a1020'; ctx.fillRect(66, 24, bw + 4, 22); ctx.fillStyle = '#3a2a3a'; ctx.fillRect(68, 26, bw, 18);
    const gr = ctx.createLinearGradient(68, 0, 68 + bw, 0); gr.addColorStop(0, pc > .5 ? '#4ae860' : pc > .25 ? '#ffd24a' : '#ff4a5a'); gr.addColorStop(1, pc > .5 ? '#a8ff7a' : pc > .25 ? '#ffe98a' : '#ff8a8a');
    ctx.fillStyle = gr; ctx.fillRect(68, 26, bw * pc, 18); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(68, 26, bw * pc, 5);
    if (P.hp < 25 && Math.floor(S.t * 6) % 2) { ctx.strokeStyle = '#ff4a5a'; ctx.lineWidth = 3; ctx.strokeRect(66, 24, bw + 4, 22); }
    txt('VIDA', 22, 27, { size: 16, color: '#ffe14a' }); txt(Math.round(pc * 100) + '%', 68 + bw / 2, 27, { size: 16, align: 'center' });
  }
  { // armas y chocolate
    const ws = WSLOTS(), sw = 62, gap = 8, tot = ws.length * sw + (ws.length - 1) * gap + sw + 26, x0 = W / 2 - tot / 2, y0 = H - 82;
    ws.forEach((id, i) => {
      const w = WEAPONS[id], x = x0 + i * (sw + gap), sel = i === Math.min(P.sel, ws.length - 1);
      ctx.fillStyle = sel ? 'rgba(255,225,74,.95)' : 'rgba(20,12,40,.82)'; rrect(x, y0, sw, sw, 10); ctx.fill(); ctx.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; rrect(x + 1.5, y0 + 1.5, sw - 3, sw - 3, 9); ctx.stroke();
      ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(w.icon, x + sw / 2, y0 + 26);
      txt(w.type, x + sw / 2, y0 + 44, { size: 10, align: 'center', color: sel ? '#3a1a00' : '#ffe14a', outline: false }); txt(String(i + 1), x + 6, y0 + 4, { size: 11, color: sel ? '#3a1a00' : '#aaa', outline: false });
      { const cv0 = Math.max((P.cds && P.cds[id]) || 0, sel ? Math.min(P.atkCd, w.cd) : 0); if (cv0 > 0) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x + 3, y0 + 3, sw - 6, (sw - 6) * Math.min(1, cv0 / w.cd)); if (cv0 > 1.5) txt(Math.ceil(cv0) + 's', x + sw / 2, y0 + 18, { size: 16, align: 'center' }); } }
      if (w.legend) { ctx.strokeStyle = '#ff9a2a'; ctx.lineWidth = 3; rrect(x - 1, y0 - 1, sw + 2, sw + 2, 11); ctx.stroke(); }
    });
    const cx = x0 + ws.length * (sw + gap) + 26, ready = P.chocoCd <= 0;
    ctx.fillStyle = ready ? 'rgba(122,70,34,.95)' : 'rgba(20,12,40,.82)'; rrect(cx, y0, sw, sw, 10); ctx.fill(); ctx.strokeStyle = ready ? '#ffd24a' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; rrect(cx + 1.5, y0 + 1.5, sw - 3, sw - 3, 9); ctx.stroke();
    ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('🍫', cx + sw / 2, y0 + 26);
    if (!ready) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(cx + 3, y0 + 3, sw - 6, (sw - 6) * (P.chocoCd / CHOCO_CD)); txt(Math.ceil(P.chocoCd) + 's', cx + sw / 2, y0 + 20, { size: 18, align: 'center' }); }
    txt(ready ? 'LISTO' : 'CURA', cx + sw / 2, y0 + 44, { size: 10, align: 'center', color: '#ffe14a', outline: false }); txt('R', cx + 6, y0 + 4, { size: 11, color: '#ddd', outline: false });
  }
  if (!S.bossLock && S.keys && (S.keys.some(k => k > 0) || L.ents.some(e => e.type === 'key') || S.ents.some(e => e.type === 'key'))) {
    panel(12, 64, 150, 38);
    ['#e0a060', '#dfe6ff', '#ffd24a'].forEach((c, i) => {
      const x = 24 + i * 46, has = S.keys[i] > 0; ctx.globalAlpha = has ? 1 : .28;
      ctx.fillStyle = '#1a1020'; ctx.fillRect(x - 1, 76, 22, 8); ctx.beginPath(); ctx.arc(x + 3, 80, 7, 0, 6.3); ctx.fill(); ctx.fillRect(x + 12, 82, 5, 8);
      ctx.fillStyle = c; ctx.fillRect(x, 78, 20, 4); ctx.beginPath(); ctx.arc(x + 3, 80, 5, 0, 6.3); ctx.fill(); ctx.fillRect(x + 13, 82, 3, 6); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + 3, 80, 2, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 1; if (has) txt('×' + S.keys[i], x + 20, 72, { size: 12, outline: false, color: '#fff' });
    });
  }
  { const q = S.q, lines = []; if ((S.lvlId === 0 || S.lvlId >= 10) && S.mode === 'play') {
      if (S.wave && !S.wave.done) { const left = S.ents.filter(e => e.corrupt && !e.dead).length + (S.wave.total - S.wave.spawned); lines.push('OLEADA ' + S.wave.n + ' / 3', 'Slimes: ' + left); }
      else if (!q.gotLetters) lines.push('MISIÓN', 'Habla con Ambrosio (Correos)');
      else if (!q.done) lines.push('REPARTE LAS CARTAS  ' + q.count + ' / ' + q.total, 'Sigue la flecha amarilla');
      else if (!q.trainStarted) lines.push('MISIÓN', 'Ve a la estación del tren');
    }
    if (lines.length) { const y = S.keys && S.ents.some(e => e.type === 'key') ? 112 : 64; ctx.font = 'bold 17px "Courier New"'; const w = Math.max(...lines.map(s => ctx.measureText(s).width)) + 36; panel(12, y, w, 20 + lines.length * 24); lines.forEach((s, i) => txt(s, 30, y + 11 + i * 24, { size: i ? 15 : 17, color: i ? '#fff' : '#ffe14a', outline: false })); } }
  panel(W / 2 + 36, 12, 118, 38); txt('🪙 ' + S.coins, W / 2 + 95, 20, { size: 20, align: 'center', color: '#ffe14a' });
  panel(W - 126, 12, 114, 46); ctx.drawImage(DIA, W - 118, 20, 36, 32);
  txt(S.dia + '/' + L.diaNeed, W - 72, 22, { size: 24, color: S.dia >= L.diaNeed ? '#7df3ff' : '#fff' });
  // minimapa
  if (MM && L.seen && !S.bossLock) {
    minimapUpdate(); const sc = 2, mw = L.w * sc, mh = L.h * sc, mx = W - 12 - mw - 6, my = 66;
    ctx.fillStyle = 'rgba(10,8,30,.96)'; ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(mx - 5, my - 5, mw + 10, mh + 10);
    ctx.drawImage(MM.c, mx, my, mw, mh);
    for (const e of S.ents) if (e.type === 'dia' && L.seen[Math.floor(e.y / T) * L.w + Math.floor(e.x / T)]) { ctx.fillStyle = '#7df3ff'; ctx.fillRect(mx + Math.floor(e.x / T) * sc - 1, my + Math.floor(e.y / T) * sc - 1, 5, 5); }
    { ctx.fillStyle = '#1a1020'; ctx.fillRect(mx + Math.floor(P.x / T) * sc - 3, my + Math.floor(P.y / T) * sc - 3, 8, 8); ctx.fillStyle = '#ffe14a'; ctx.fillRect(mx + Math.floor(P.x / T) * sc - 2, my + Math.floor(P.y / T) * sc - 1, 5, 5); }
  }
  const b = S.boss;
  if (b && S.bossStarted && b.state !== 'saved' && !S.dialog) {
    const bw = 480, bx = (W - bw) / 2, by = 70;
    txt(((S.boss && BOSS_DATA[S.boss.kind] && BOSS_DATA[S.boss.kind].foe) || 'JEFE').toUpperCase() + (S.boss && S.boss.kind === 'exe' ? '' : '  (corrupto)'), W / 2, by - 28, { size: 18, align: 'center', color: '#ffb0b0' });
    ctx.fillStyle = '#1a1020'; ctx.fillRect(bx - 5, by - 5, bw + 10, 26); ctx.fillStyle = '#4a1020'; ctx.fillRect(bx, by, bw, 16);
    ctx.fillStyle = b.state === 'sleep' ? '#6ac8ff' : '#ff3b5c'; ctx.fillRect(bx, by, bw * b.hp / b.max, 16); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(bx, by, bw * b.hp / b.max, 5);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(bx - 4, by - 4, bw + 8, 24);
  }
  if (S.hintT > 0 && S.hint) {
    ctx.globalAlpha = clamp(S.hintT * 3, 0, 1); ctx.font = 'bold 20px "Courier New"'; const tw = ctx.measureText(S.hint).width + 40;
    panel(W / 2 - tw / 2, 78, tw, 42); txt(S.hint, W / 2, 88, { size: 20, align: 'center', color: '#fff6a0', outline: false }); ctx.globalAlpha = 1;
  }
}

// ---------- Escenas: título / cinemática / final ----------
function drawGroundBand(y, dark) {
  ctx.fillStyle = dark ? '#2a1020' : '#1f4a2c'; ctx.fillRect(0, y, W, H - y); ctx.fillStyle = dark ? '#4a1830' : '#368a46'; ctx.fillRect(0, y, W, 10);
  for (let yy = y + 26; yy < H; yy += 24) for (let x = ((yy - y) / 24 % 2) * 24; x < W; x += 48) { ctx.fillStyle = dark ? '#3a1428' : '#2c6c3a'; ctx.fillRect(x, yy, 24, 24); }
}
// ---------- Retratos grandes para los diálogos ----------
const PORT = {};
['mike', 'exe', 'willy', 'ambrosio', 'aquela', 'rius', 'mayo', 'esparta', 'raptor', 'timba', 'trolino', 'invictor', 'acenix'].forEach(k => { const im = new Image(); im.src = `assets/retratos/${k}.png`; PORT[k] = im; });
const PSIL = {};
function portSil(id, color) {
  const key = id + color; if (PSIL[key]) return PSIL[key];
  const im = PORT[id]; return PSIL[key] = mk(im.naturalWidth, im.naturalHeight, g => { g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, im.naturalWidth, im.naturalHeight); });
}
const PTMP = document.createElement('canvas');
function drawPortrait(id, x, yb, sc, o = {}) {
  const im = PORT[id]; if (!im || !im.complete || !im.naturalWidth) return false;
  const w = im.naturalWidth * sc, h = im.naturalHeight * sc, t = S.t, pad = 24;
  PTMP.width = Math.ceil(w + pad * 2); PTMP.height = Math.ceil(h + pad * 2);
  const g = PTMP.getContext('2d'); g.imageSmoothingEnabled = false;
  g.globalAlpha = .75; g.drawImage(portSil(id, o.red ? '#ff4060' : (o.rim || '#9ad0ff')), pad - 5, pad - 5, w, h); g.globalAlpha = 1;
  g.drawImage(im, pad, pad, w, h);
  if (o.red) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,0,40,.2)'; g.fillRect(0, 0, PTMP.width, PTMP.height); }
  g.globalCompositeOperation = 'destination-out';
  const gr = g.createLinearGradient(0, pad + h * .7, 0, pad + h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(0, pad + h * .7, PTMP.width, h * .3 + pad);
  g.globalCompositeOperation = 'source-over';
  const breathe = Math.sin(t * 1.8) * 3, talk = o.talk ? Math.abs(Math.sin(t * 13)) * 6 : 0, sq = o.talk ? 1 + Math.sin(t * 13) * .018 : 1;
  ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  ctx.translate(Math.round(x + (o.dx || 0)), Math.round(yb + breathe - talk)); if (o.flip) ctx.scale(-1, 1); ctx.scale(1 / sq, sq);
  ctx.drawImage(PTMP, -PTMP.width / 2, -PTMP.height + pad, PTMP.width, PTMP.height);
  if (o.red) {
    const q = mkRng(Math.floor(t * 12) + 7);
    for (let i = 0; i < 3; i++) { const y0 = q() * h * .75, hh = 5 + q() * 12, dx = (q() - .5) * 30; ctx.drawImage(PTMP, 0, pad + y0, PTMP.width, hh, -PTMP.width / 2 + dx, -PTMP.height + pad + pad + y0, PTMP.width, hh); }
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .22; ctx.drawImage(PTMP, -PTMP.width / 2 + 5, -PTMP.height + pad, PTMP.width, PTMP.height); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255,30,70,.1)'; for (let yy = -PTMP.height + pad; yy < pad; yy += 6) ctx.fillRect(-PTMP.width / 2, yy, PTMP.width, 2);
  }
  ctx.restore();
  return true;
}
const TREES_DARK = {};
function darkTree(i, dark) {
  const key = i + (dark ? 'd' : 'n'); if (TREES_DARK[key]) return TREES_DARK[key];
  const s = TREES.day[i % 3]; return TREES_DARK[key] = mk(s.width, s.height, g => { g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = dark ? 'rgba(40,6,22,.72)' : 'rgba(8,14,52,.66)'; g.fillRect(0, 0, s.width, s.height); });
}
function drawStageBG(st, t) {
  const dark = st.dark, cx = st.panx || 0;
  if (dark) skyGradient([[0, '#0d0209'], [.5, '#3a0a26'], [.85, '#7a1a3a'], [1, '#a0284a']]); else skyGradient([[0, '#060a26'], [.45, '#16286a'], [.8, '#3a5a9a'], [1, '#6a86b8']]);
  for (const s of STARS) { const tw = (Math.sin(t * 2 + s.p) + 1) / 2; ctx.fillStyle = dark ? `rgba(255,150,170,${.15 + tw * .45})` : `rgba(255,255,255,${.25 + tw * .7})`; ctx.fillRect((s.x - cx * .04 + W) % W, s.y, s.s, s.s); }
  // aurora / nubes de energía
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath(); ctx.moveTo(0, 140 + k * 26);
    for (let x = 0; x <= W; x += 24) ctx.lineTo(x, 120 + k * 30 + Math.sin(x * .008 + t * .5 + k * 1.7) * 34 + Math.sin(x * .021 + t * .8 + k) * 10);
    ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.closePath();
    const gg = ctx.createLinearGradient(0, 0, 0, 220); const c1 = dark ? ['rgba(255,40,90,.0)', 'rgba(255,50,110,.18)'] : [['rgba(60,255,200,.0)', 'rgba(80,255,210,.13)'], ['rgba(140,100,255,.0)', 'rgba(150,110,255,.13)'], ['rgba(90,170,255,.0)', 'rgba(100,180,255,.11)']][k];
    gg.addColorStop(0, c1[0]); gg.addColorStop(1, c1[1]); ctx.fillStyle = gg; ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // luna / sol oscuro
  const mx = 780 - cx * .06, my = 96;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.drawImage(glow(dark ? 'rgba(255,40,70,.9)' : 'rgba(210,225,255,.9)'), mx - 150, my - 150, 300, 300); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = dark ? '#2a0610' : '#f4f1d8'; ctx.beginPath(); ctx.arc(mx, my, 38, 0, 6.3); ctx.fill(); ctx.fillStyle = dark ? '#6a1020' : '#d6d2b0'; for (const [dx, dy, rr] of [[-12, -8, 8], [10, 10, 6], [-6, 14, 4]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, rr, 0, 6.3); ctx.fill(); }
  // montañas y bosque con parallax
  for (let L = 0; L < 3; L++) {
    const par = [.12, .25, .45][L], col = dark ? ['#2a0a18', '#220812', '#1a050e'][L] : ['#1a2a5a', '#14204a', '#0e1838'][L], base = [300, 330, 352][L];
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = -20; x <= W + 20; x += 20) { const wx = x + cx * par; ctx.lineTo(x, base - (L === 0 ? 90 : L === 1 ? 55 : 28) - Math.sin(wx * .011 + L * 2) * (L === 0 ? 46 : 26) - Math.abs(Math.sin(wx * .037 + L)) * (L === 2 ? 22 : 10)); }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  // niebla
  for (let k = 0; k < 3; k++) { const gg = ctx.createLinearGradient(0, 270 + k * 30, 0, 350 + k * 30); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, dark ? 'rgba(160,30,70,.2)' : 'rgba(140,170,230,.14)'); ctx.fillStyle = gg; ctx.fillRect(((t * (8 + k * 5) + k * 300) % (W + 600)) - 600 + W * 0, 270 + k * 30, 900, 90); }
  // las siete estrellas
  drawSevenStars(dark, t);
}
function drawStageGround(st, t, gy) {
  const dark = st.dark, tx = TEXS.day;
  for (let y = gy; y < H; y += T) for (let x = -((st.panx || 0) * .8 % T); x < W + T; x += T) ctx.drawImage(((x + y) / T | 0) % 3 === 0 ? tx.grass[0] : tx.grass[1 + (((x / T | 0) + (y / T | 0)) & 1)], Math.round(x), y);
  const gr = ctx.createLinearGradient(0, gy, 0, H); gr.addColorStop(0, dark ? 'rgba(60,6,30,.55)' : 'rgba(6,12,50,.45)'); gr.addColorStop(1, dark ? 'rgba(20,0,12,.85)' : 'rgba(4,6,30,.75)'); ctx.fillStyle = gr; ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = dark ? 'rgba(255,60,100,.2)' : 'rgba(150,190,255,.18)'; ctx.fillRect(0, gy, W, 3);
}
function drawStage() {
  const st = S.stage, t = S.t; st.age = (st.age || 0);
  const sx = st.shake > 0 ? rnd(-1, 1) * st.shake * 20 : 0, zoom = 1 + (st.zoom || 0);
  ctx.save();
  ctx.translate(W / 2 + Math.round(sx), 330); ctx.scale(zoom, zoom); ctx.translate(-W / 2 - (st.panx || 0) * .0, -330);
  drawStageBG(st, t);
  const gy = 348; drawStageGround(st, t, gy);
  // árboles-silueta a los lados
  for (const [x, i, sc] of [[-30, 0, 1.25], [60, 1, 1.0], [W - 120, 2, 1.1], [W - 30, 0, 1.3]]) { const s = darkTree(i, st.dark); ctx.drawImage(s, x - s.width * sc / 2 - (st.panx || 0) * .35, gy + 20 - s.height * sc, s.width * sc, s.height * sc); }
  const sp = S.dialog && S.dialog.who;
  const list = st.chars.slice().sort((a, b) => a.y - b.y);
  for (const c of list) {
    const talk = sp && c.id === sp, bob = c.anim === 'idle' ? Math.round(Math.sin(t * 3 + c.x) * 2) : 0, fr = c.anim === 'walk' ? [1, 0, 3, 0][Math.floor(t * 9) % 4] : 0;
    const jit = c.glitch ? rnd(-1, 1) * 2 : 0, fy = c.float ? Math.sin(t * 1.5) * 8 : 0, hop = talk ? -Math.abs(Math.sin(t * 8)) * 4 : 0, scl = c.scale || 1;
    const x = c.x - (st.panx || 0) * (c.id === 'exe' ? .1 : .5);
    if (c.id === 'exe') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.drawImage(glow('rgba(255,30,60,.9)'), x - 260, c.y - 300, 520, 520); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    else {
      shadow(x, c.y - 2, 24 * scl, 8 * scl, .4);
      if (talk) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.drawImage(glow(st.dark ? 'rgba(255,90,120,.7)' : 'rgba(255,240,180,.8)'), x - 80 * scl, c.y - 60 * scl, 160 * scl, 100 * scl); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    }
    drawChar(c.id, x + jit, c.y + bob + fy + hop, { scale: scl, flip: c.face < 0, frame: fr, red: c.red, alpha: (c.alpha != null ? c.alpha : 1) * (sp && !talk && c.id !== 'exe' ? .72 : 1) });
    if (c.glitch && Math.sin(t * 9 + c.x) > .7) { ctx.fillStyle = 'rgba(255,0,200,.35)'; ctx.fillRect(x - 30 * scl, c.y - 70 * scl + rnd(0, 50 * scl), 60 * scl, 5); }
  }
  if (st.snow) { ctx.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { const sx2 = (i * 97 + t * (18 + i % 7 * 4)) % (W + 40) - 20, sy2 = (i * 53 + t * (40 + i % 5 * 14)) % (H + 20) - 10; ctx.globalAlpha = .5 + (i % 4) * .12; ctx.fillRect(Math.round(sx2), Math.round(sy2), 2 + i % 2, 2 + i % 2); } ctx.globalAlpha = 1; }
  // motas flotando
  ctx.globalCompositeOperation = 'lighter';
  for (const f of FLY) { const a = (Math.sin(t * 2 + f.p) + 1) / 2; ctx.globalAlpha = .2 + a * .55; ctx.fillStyle = st.dark ? '#ff8aa0' : '#bfe9ff'; ctx.fillRect(Math.round((f.x + Math.sin(t * .6 + f.p) * 40) % W), Math.round(60 + (f.y * .8 + Math.cos(t * .5 + f.p) * 24) % 400), 3, 3); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  // luz de cine: viñeta fuerte + barras negras
  ctx.drawImage(VIG, 0, 0, W, H); ctx.drawImage(VIG, 0, 0, W, H);
  const bar = Math.round(46 * Math.min(1, (st.barT = (st.barT || 0) + .02) / 1)); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  if (st.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${st.flash})`; ctx.fillRect(0, 0, W, H); }
  if (st.card) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 150, W, 140); txt(st.card, W / 2, 180, { size: 40, align: 'center', color: '#ffe14a' }); if (st.card2) txt(st.card2, W / 2, 240, { size: 22, align: 'center', color: '#fff' }); }
  if (st.end) drawEndText();
}
function drawEndText() {
  const e = S.stage.end;
  ctx.fillStyle = 'rgba(0,0,0,.76)'; ctx.fillRect(0, 0, W, H);
  txt('FIN DEL PILOTO', W / 2, 60, { size: 56, align: 'center', color: '#ffe14a', lw: 8 });
  txt('Timba recuperó la conciencia... ¡y una siesta!', W / 2, 140, { size: 22, align: 'center', color: '#fff' });
  const m = Math.floor(e.time / 60), s = Math.floor(e.time % 60);
  txt('Diamantes: ' + e.dia + '    Tiempo: ' + m + ':' + String(s).padStart(2, '0') + '    Derrotas: ' + e.deaths, W / 2, 200, { size: 22, align: 'center', color: '#7df3ff' });
  txt('Recompensa: ALMOHADA DE ESTRELLA  (+2 corazones)', W / 2, 248, { size: 20, align: 'center', color: '#9ad0ff' });
  txt('Amigos restaurados: 1 / 7', W / 2, 292, { size: 22, align: 'center', color: '#fff' });
  txt('Continuará... Rius, Mayo, Esparta, Raptor, Invictor y Trolino te esperan.', W / 2, 346, { size: 18, align: 'center', color: '#ffb0b0' });
  if (Math.floor(S.t * 2) % 2) txt('ENTER: jugar de nuevo', W / 2, 440, { size: 24, align: 'center', color: '#fff' });
}
function drawTitle() {
  const t = S.t;
  drawNightSky(false, t); drawSevenStars(false, t);
  drawGroundBand(420, false);
  for (const f of FLY) { const a = (Math.sin(t * 2 + f.p) + 1) / 2; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .3 + a * .6; ctx.fillStyle = '#fff6a0'; ctx.fillRect((f.x + Math.sin(t * .6 + f.p) * 30) % W, 240 + (f.y % 220) + Math.cos(t * .5 + f.p) * 20, 4, 4); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  if (Math.sin(t * .8) < .92) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .6; ctx.drawImage(glow('rgba(255,0,60,.9)'), 800, 190, 120, 120); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ff1a3a'; ctx.fillRect(838, 244, 14, 10); ctx.fillRect(868, 244, 14, 10); }
  drawPortrait('mike', 150, H + 6, 3.4, { rim: '#ffe14a', talk: false }); drawPortrait('willy', W - 150, H + 6, 3.0, { rim: '#9ad0ff', flip: true });
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.drawImage(glow('rgba(255,225,74,.9)'), W / 2 - 300, 0, 600, 260); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  txt('MIKECRACK', W / 2, 52, { size: 84, align: 'center', color: '#ffe14a', lw: 12 });
  txt('Y LAS ESTRELLAS OSCURAS', W / 2, 160, { size: 38, align: 'center', color: '#fff', lw: 8 });
  txt('— PILOTO —', W / 2, 212, { size: 20, align: 'center', color: '#9ad0ff' });
  const sp = (t * .22) % 1; if (sp < .35) { const k = sp / .35, sx = 120 + k * 520, sy = 40 + k * 190; ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { ctx.globalAlpha = (1 - k) * (1 - i / 12) * .8; ctx.fillStyle = '#fff'; ctx.fillRect(sx - i * 7, sy - i * 3.6, 5, 5); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  ctx.drawImage(VIG, 0, 0, W, H);
}
function drawDialog() {
  const d = S.dialog; if (!d) { S.cineK = Math.max(0, (S.cineK || 0) - 1 / 20); if (S.cineK > 0) { const bh = 54 * S.cineK; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); } return; }
  d.age = (d.age || 0) + 1 / 60;
  const cineOn = S.busy && !S.talking && !S.stage; S.cineK = cineOn ? Math.min(1, (S.cineK || 0) + 1 / 15) : Math.max(0, (S.cineK || 0) - 1 / 15);
  if (S.cineK > 0) { const bh = 54 * S.cineK; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
  if (!S.lastSpk || S.lastSpk.who !== d.who) { if (S.curSpk && S.curSpk.who !== d.who) S.lastSpk = S.curSpk; S.curSpk = { who: d.who, side: d.side, red: d.red }; }
  if (d.portrait && S.lastSpk && S.lastSpk.who !== d.who && S.lastSpk.side !== d.side && !d.choices) { const l = S.lastSpk, lx = l.side === 'L' ? 190 : W - 190; drawPortrait(l.who, lx, H - 28 - 128 + 38, 3.0, { red: l.red, rim: '#7a88aa', talk: false, alpha: .4 }); }
  const nOpt = d.choices ? d.choices.length : 0, bh = nOpt ? 112 + nOpt * 38 : 128, bx = 40, by = H - 28 - bh, bw = W - 80, left = d.side === 'L';
  const ease = 1 - Math.pow(1 - Math.min(1, d.age / .3), 3);
  if (d.portrait) {
    const px = left ? 190 : W - 190, dx = (1 - ease) * (left ? -160 : 160), talking = d.shown < d.text.length;
    const rimc = S.stage && S.stage.dark ? '#ff6a8a' : '#a8d8ff';
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .28 * ease; ctx.drawImage(glow(S.stage && S.stage.dark ? 'rgba(255,60,100,.9)' : 'rgba(150,190,255,.9)'), px - 270, by - 330, 540, 540); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (!drawPortrait(d.who, px, by + 38, d.who === 'exe' ? 3.2 : 3.6, { red: d.red, rim: rimc, talk: talking, dx, alpha: ease })) { shadow(px, by + 20, 70, 14, .3); drawChar(d.who, px, by + 20, { scale: 4, flip: !left, red: d.red }); }
  }
  ctx.fillStyle = 'rgba(8,6,26,.94)'; rrect(bx, by, bw, bh, 16); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; rrect(bx + 2, by + 2, bw - 4, bh - 4, 14); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,74,.6)'; ctx.lineWidth = 2; rrect(bx + 8, by + 8, bw - 16, bh - 16, 10); ctx.stroke();
  const narr = d.who === 'narr';
  if (!narr && d.name) {
    ctx.font = 'bold 20px "Courier New"'; const nw = ctx.measureText(d.name).width + 40, nx = left ? bx + 24 : bx + bw - 24 - nw;
    ctx.fillStyle = '#ffe14a'; rrect(nx, by - 32, nw, 36, 10); ctx.fill(); ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 3; rrect(nx, by - 32, nw, 36, 10); ctx.stroke();
    txt(d.name, nx + nw / 2, by - 27, { size: 20, align: 'center', color: '#1a1020', outline: false });
  }
  const lines = wrap(d.text, bw - 70, 22), full = Math.floor(d.shown); let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], take = clamp(full - n, 0, l.length); n += l.length + 1;
    txt(l.slice(0, take), narr ? W / 2 : bx + 34, by + 24 + i * 30, { size: 22, align: narr ? 'center' : 'left', color: narr ? '#ffeaa0' : '#fff', outline: false });
  }
  if (nOpt && d.shown >= d.text.length) {
    d.rects = []; const oy = by + 24 + Math.min(lines.length, 2) * 30 + 10;
    d.choices.forEach((c, i) => {
      const y = oy + i * 38, sel = i === d.sel, x = bx + 30, w = bw - 60;
      ctx.fillStyle = sel ? 'rgba(255,225,74,.95)' : 'rgba(255,255,255,.1)'; rrect(x, y, w, 32, 9); ctx.fill();
      if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rrect(x, y, w, 32, 9); ctx.stroke(); }
      txt((sel ? '▶ ' : '   ') + c, x + 14, y + 6, { size: 20, color: sel ? '#1a1020' : '#fff', outline: false }); d.rects.push({ x, y, w, h: 32 });
    });
  } else if (!nOpt && d.shown >= d.text.length && Math.floor(S.t * 3) % 2) txt('▼', bx + bw - 40, by + bh - 36, { size: 20, outline: false });
}
function drawFrame() {
  const world = S.mode !== 'title' && !S.stage && S.lvl, use3d = world && typeof GL !== 'undefined' && GL.ok;
  const glc = document.getElementById('gl'); if (glc) { const off = !use3d; if (glc.classList.contains('off') !== off) glc.classList.toggle('off', off); }
  ctx.clearRect(0, 0, W, H);
  if (!use3d) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
  if (S.mode === 'title') drawTitle();
  else if (S.stage) drawStage();
  else if (S.lvl) { if (use3d) { glFrame(S.dtv || 1 / 60); drawOverlay3D(); ctx.drawImage(VIG, 0, 0, W, H); if (S.intro3d) drawIntro3D(); else drawHUD(); } else drawWorld(); }
  drawDialog();
  drawMenu();
  if (S.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${S.fade})`; ctx.fillRect(0, 0, W, H); }
}

function drawIntro3D() {
  const I = S.intro3d, bar = Math.round(46 * Math.min(1, (I.bt = (I.bt || 0) + .03))); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  if (I.card) { const a = Math.min(1, I.cardT = (I.cardT || 0) + .04); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, H / 2 - 70, W, 140); txt(I.card, W / 2, H / 2 - 48, { size: 54, align: 'center', color: '#ffe14a', lw: 9 }); if (I.card2) txt(I.card2, W / 2, H / 2 + 22, { size: 24, align: 'center', color: '#fff' }); ctx.globalAlpha = 1; } else I.cardT = 0;
}
