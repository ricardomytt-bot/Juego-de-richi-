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
function tex(fn) { const s = mk(16, 16, fn); return mk(48, 48, g => g.drawImage(s, 0, 0, 48, 48)); }
function noise(g, base, cols, seed, p = .4, x0 = 0, y0 = 0, w = 16, h = 16) {
  const r = mkRng(seed); g.fillStyle = base; g.fillRect(x0, y0, w, h);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (r() < p) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, y, 1, 1); }
}
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
  const P_ = PAL[theme], T_ = {};
  T_.grass = [0, 1, 2].map(i => tex(g => {
    noise(g, P_.grass[0], P_.grass[1], 100 + i, .45);
    const r = mkRng(200 + i); g.fillStyle = P_.grass[1][2]; for (let k = 0; k < 3; k++) { const x = 1 + Math.floor(r() * 13), y = 1 + Math.floor(r() * 13); g.fillRect(x, y, 1, 2); g.fillRect(x + 1, y - 1, 1, 2); }
  }));
  T_.dark = [0, 1].map(i => tex(g => noise(g, P_.dark[0], P_.dark[1], 300 + i, .5)));
  T_.path = [0, 1].map(i => tex(g => {
    noise(g, P_.path[0], P_.path[1], 400 + i, .45);
    const r = mkRng(410 + i); g.fillStyle = P_.path[1][2]; for (let k = 0; k < 4; k++) g.fillRect(1 + Math.floor(r() * 13), 1 + Math.floor(r() * 13), 2, 1);
  }));
  T_.wall = tex(g => {
    noise(g, P_.wall[0], P_.wall[1], 500, .4); g.fillStyle = 'rgba(0,0,0,.28)';
    for (let y = 0; y < 16; y += 4) g.fillRect(0, y + 3, 16, 1);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4 % 2) * 4 + 2; x < 16; x += 8) g.fillRect(x, y, 1, 3);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, 16, 1);
  });
  T_.crack = tex(g => {
    g.drawImage(T_.wall, 0, 0, 48, 48, 0, 0, 16, 16); g.fillStyle = '#1a1424';
    [[8, 0], [7, 1], [7, 2], [6, 3], [6, 4], [7, 5], [8, 6], [8, 7], [9, 8], [10, 9], [10, 10], [9, 11], [8, 12], [8, 13], [7, 14], [7, 15], [5, 5], [4, 5], [11, 9], [12, 9]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  });
  T_.gate = tex(g => { g.drawImage(T_.wall, 0, 0, 48, 48, 0, 0, 16, 16); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(2, 2, 12, 12); g.fillStyle = '#2a2040'; g.fillRect(3, 3, 10, 10); });
  T_.arena = [0, 1].map(i => tex(g => {
    noise(g, P_.arena[0], P_.arena[1], 600 + i, .35); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(8, 8, 4, 4);
  }));
  T_.water = [0, 1, 2].map(i => tex(g => {
    noise(g, P_.water[0], P_.water[1], 700, .25);
    g.fillStyle = P_.water[1][2]; const r = mkRng(710); for (let k = 0; k < 5; k++) { const x = (Math.floor(r() * 12) + i * 3) % 14, y = Math.floor(r() * 14); g.fillRect(x, y, 3, 1); }
  }));
  return T_;
}
const TEXS = { day: buildTex('day'), dream: buildTex('dream') };

// ---------- Sprites de escenario ----------
function disc(g, cx, cy, r, col, st = 4) {
  g.fillStyle = col;
  for (let y = -r; y <= r; y += st) for (let x = -r; x <= r; x += st) if (x * x + y * y <= r * r) g.fillRect(cx + x - st / 2, cy + y - st / 2, st, st);
}
function makeTree(p, seed) {
  const r = mkRng(seed);
  return mk(96, 124, g => {
    g.fillStyle = p.out; g.fillRect(40, 84, 16, 34); g.fillStyle = '#6b4424'; g.fillRect(42, 86, 12, 30); g.fillStyle = '#8a5a30'; g.fillRect(42, 86, 4, 30); g.fillStyle = '#4a2c14'; g.fillRect(50, 90, 4, 26);
    const blobs = [[48, 52, 34], [26, 62, 22], [70, 62, 22], [48, 30, 24], [34, 40, 20], [62, 40, 20]];
    blobs.forEach(([x, y, rr]) => disc(g, x, y + 4, rr + 4, p.out));
    blobs.forEach(([x, y, rr]) => disc(g, x, y + 4, rr, p.base));
    blobs.forEach(([x, y, rr]) => disc(g, x - 4, y - 2, Math.floor(rr * .7), p.mid));
    blobs.slice(0, 4).forEach(([x, y, rr]) => disc(g, x - 8, y - 8, Math.floor(rr * .38), p.hi));
    g.fillStyle = 'rgba(0,0,0,.14)'; for (let k = 0; k < 6; k++) g.fillRect(24 + Math.floor(r() * 44), 70 + Math.floor(r() * 14), 8, 4);
  });
}
function makeRock(c) {
  return mk(56, 52, g => {
    disc(g, 28, 30, 26, '#1a1424', 4); disc(g, 28, 30, 22, c[0], 4); disc(g, 24, 26, 14, c[1], 4); g.fillStyle = c[2]; g.fillRect(14, 40, 30, 6); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(16, 20, 8, 4);
  });
}
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
  const L = S.lvl; if (!MM || !L.seen) return; const g = MM.c.getContext('2d'), dm = L.theme === 'dream';
  const cx = Math.floor(P.x / T), cy = Math.floor(P.y / T);
  for (let y = Math.max(0, cy - 10); y <= Math.min(L.h - 1, cy + 10); y++) for (let x = Math.max(0, cx - 10); x <= Math.min(L.w - 1, cx + 10); x++) {
    const i = y * L.w + x; if (!L.seen[i] || MM.drawn[i]) continue; MM.drawn[i] = 1;
    const c = L.g[y][x]; let col;
    if (c === 'T') col = dm ? '#3a2c7a' : '#2a6a30'; else if (c === '~') col = '#4a6aff'; else if (c === 'W' || c === 'C' || c === 'H' || c === 'd') col = '#aaa'; else if (c === 'G') col = '#7df3ff'; else if (c === 'R') col = '#778';
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
      if ((h + Math.floor(t * 1.5)) % 11 === 0) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + (h % 30), y + (h % 36) + 4, 6, 3); }
      continue;
    }
    else if (c === 'T' || c === 'W' || c === 'C' || c === 'G' || c === 'H' || c === 'd' || c === 'R') img = (c === 'R' ? texs.grass[h % 3] : texs.dark[h % 2]);
    else img = texs.grass[h % 3];
    ctx.drawImage(img, x, y);
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
    } else if (c === 'W' || c === 'C' || c === 'G') {
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x + 6, y + T - 4, T, 14);
      items.push({ y: y + T - 2, d: () => drawWallTile(L, texs, tx, ty) });
    }
  }
  if (S.lvlId === 0) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(4 * T + 14, 7 * T - 8, 7 * T, 16); items.push({ y: 7 * T - 2, d: () => ctx.drawImage(HOUSE, 4 * T - 20, 2 * T - 24) }); }
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
      drawChar('timba', b.x, b.y, { scale: 2, frame: fr, flip: b.face > 0, flash: b.flash > 0, red: b.state !== 'saved', sleep: b.state === 'sleep', lift: b.lift, sy: crouch });
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
  drawLighting(L, lights, camx, camy, dm);
  // carteles (texto, por encima de la luz)
  ctx.save(); ctx.translate(-camx, -camy);
  let ns = null, bd = 150; for (const s of L.signs) { const d = dist(P.x, P.y, s.x, s.y); if (d < bd) { bd = d; ns = s; } }
  if (ns) { ctx.font = 'bold 17px "Courier New"'; const tw = ctx.measureText(ns.text).width + 28; ctx.fillStyle = 'rgba(10,8,30,.88)'; ctx.fillRect(ns.x - tw / 2, ns.y - 120, tw, 40); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(ns.x - tw / 2 + 1, ns.y - 119, tw - 2, 38); txt(ns.text, ns.x, ns.y - 110, { size: 17, align: 'center', outline: false }); }
  for (const f of S.floaters) { ctx.globalAlpha = clamp(1.3 - f.t, 0, 1); txt(f.text, f.x, f.y, { size: 18, color: f.color }); }
  ctx.globalAlpha = 1; ctx.restore();
  ctx.drawImage(VIG, 0, 0);
  drawHUD();
}
function drawLighting(L, lights, camx, camy, dm) {
  const arena = S.bossLock, g = DARK.getContext('2d');
  if (dm) {
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.fillStyle = arena ? 'rgba(40,0,24,.6)' : 'rgba(14,8,48,.56)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    for (const l of lights) { const sx = l.x - camx, sy = l.y - camy; if (sx < -l.r || sx > W + l.r || sy < -l.r || sy > H + l.r) continue; g.globalAlpha = l.strong ? 1 : .8; g.drawImage(LIGHT, sx - l.r, sy - l.r, l.r * 2, l.r * 2); }
    g.globalAlpha = 1; ctx.drawImage(DARK, 0, 0);
  } else { ctx.fillStyle = 'rgba(255,214,150,.07)'; ctx.fillRect(0, 0, W, H); }
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
function panel(x, y, w, h) { ctx.fillStyle = 'rgba(10,8,30,.72)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
function drawHUD() {
  const L = S.lvl;
  panel(12, 12, 20 + P.maxHp * 34, 46);
  for (let i = 0; i < P.maxHp; i++) ctx.drawImage(i < P.hp ? HEART_F : HEART_E, 24 + i * 34, 22);
  panel(W - 126, 12, 114, 46); ctx.drawImage(DIA, W - 118, 20, 36, 32);
  txt(S.dia + '/' + L.diaNeed, W - 72, 22, { size: 24, color: S.dia >= L.diaNeed ? '#7df3ff' : '#fff' });
  if (S.hasDash) { panel(12, 64, 130, 30); txt('SHIFT: ESQUIVE', 22, 71, { size: 14, color: P.dashCd > 0 ? '#888' : '#9ad0ff', outline: false }); }
  // minimapa
  if (MM && L.seen) {
    minimapUpdate(); const sc = 2, mw = L.w * sc, mh = L.h * sc, mx = W - 12 - mw - 6, my = 66;
    ctx.fillStyle = 'rgba(10,8,30,.78)'; ctx.fillRect(mx - 6, my - 6, mw + 12, mh + 12); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(mx - 5, my - 5, mw + 10, mh + 10);
    ctx.drawImage(MM.c, mx, my, mw, mh);
    for (const e of S.ents) if (e.type === 'dia' && L.seen[Math.floor(e.y / T) * L.w + Math.floor(e.x / T)]) { ctx.fillStyle = '#7df3ff'; ctx.fillRect(mx + Math.floor(e.x / T) * sc - 1, my + Math.floor(e.y / T) * sc - 1, 5, 5); }
    if (Math.floor(S.t * 3) % 2) { ctx.fillStyle = '#ff3b5c'; ctx.fillRect(mx + Math.floor(P.x / T) * sc - 1, my + Math.floor(P.y / T) * sc - 1, 5, 5); }
  }
  const b = S.boss;
  if (b && S.bossStarted && b.state !== 'saved' && !S.dialog) {
    const bw = 480, bx = (W - bw) / 2, by = H - 44;
    txt('TIMBA  (corrupto)', W / 2, by - 30, { size: 18, align: 'center', color: '#ffb0b0' });
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
function drawStage() {
  const st = S.stage, t = S.t, sx = st.shake > 0 ? rnd(-1, 1) * st.shake * 20 : 0;
  ctx.save(); ctx.translate(Math.round(sx), 0);
  drawNightSky(st.dark, t); drawSevenStars(st.dark, t);
  const gy = 352; drawGroundBand(gy, st.dark);
  for (const c of st.chars) {
    const bob = c.anim === 'idle' ? Math.round(Math.sin(t * 3 + c.x) * 2) : 0, fr = c.anim === 'walk' ? [1, 0, 3, 0][Math.floor(t * 9) % 4] : 0;
    const jit = c.glitch ? rnd(-1, 1) * 2 : 0, fy = c.float ? Math.sin(t * 1.5) * 8 : 0;
    if (c.id === 'exe') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55; ctx.drawImage(glow('rgba(255,30,60,.9)'), c.x - 220, c.y - 260, 440, 440); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    else shadow(c.x, c.y - 2, 24 * (c.scale || 1), 8 * (c.scale || 1), .35);
    drawChar(c.id, c.x + jit, c.y + bob + fy, { scale: c.scale || 1, flip: c.face < 0, frame: fr, red: c.red, alpha: c.alpha != null ? c.alpha : 1 });
    if (c.glitch && Math.sin(t * 9 + c.x) > .7) { ctx.fillStyle = 'rgba(255,0,200,.35)'; ctx.fillRect(c.x - 30, c.y - 70 + rnd(0, 50), 60, 5); }
  }
  ctx.restore();
  ctx.drawImage(VIG, 0, 0);
  if (st.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${st.flash})`; ctx.fillRect(0, 0, W, H); }
  if (st.end) drawEndText();
}
function drawEndText() {
  const e = S.stage.end;
  ctx.fillStyle = 'rgba(0,0,0,.76)'; ctx.fillRect(0, 0, W, H);
  txt('FIN DEL PILOTO', W / 2, 60, { size: 56, align: 'center', color: '#ffe14a', lw: 8 });
  txt('Timba recuperó la conciencia... ¡y una siesta!', W / 2, 140, { size: 22, align: 'center', color: '#fff' });
  const m = Math.floor(e.time / 60), s = Math.floor(e.time % 60);
  txt('Diamantes: ' + e.dia + '    Tiempo: ' + m + ':' + String(s).padStart(2, '0') + '    Derrotas: ' + e.deaths, W / 2, 200, { size: 22, align: 'center', color: '#7df3ff' });
  txt('Nuevo poder: ESQUIVE ALMOHADA  (SHIFT)', W / 2, 248, { size: 20, align: 'center', color: '#9ad0ff' });
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
  shadow(300, 478, 70, 22, .4); drawChar('mike', 300, 476 - Math.abs(Math.sin(t * 2.6)) * 22, { scale: 4 });
  shadow(470, 478, 50, 16, .4); drawChar('willy', 470, 476, { scale: 3, frame: 0 });
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5; ctx.drawImage(glow('rgba(255,225,74,.9)'), W / 2 - 300, 0, 600, 260); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  txt('MIKE', W / 2, 44, { size: 104, align: 'center', color: '#ffe14a', lw: 12 });
  txt('Y LAS ESTRELLAS OSCURAS', W / 2, 160, { size: 38, align: 'center', color: '#fff', lw: 8 });
  txt('— PILOTO —', W / 2, 212, { size: 20, align: 'center', color: '#9ad0ff' });
  if (Math.floor(t * 1.6) % 2 === 0) txt('Pulsa ENTER para empezar', 700, 350, { size: 26, align: 'center', color: '#fff' });
  txt('Flechas/WASD mover  ·  J / Espacio atacar  ·  E hablar  ·  Shift esquive  ·  M sonido  ·  ESC saltar escena', W / 2, H - 28, { size: 14, align: 'center', color: '#bcd', lw: 3 });
  ctx.drawImage(VIG, 0, 0);
}
function drawDialog() {
  const d = S.dialog; if (!d) return;
  const bx = 40, by = H - 158, bw = W - 80, bh = 128;
  if (d.portrait) {
    const left = d.side === 'L', px = left ? 130 : W - 130;
    shadow(px, by + 20, 70, 14, .3); drawChar(d.who, px, by + 20, { scale: 4, flip: !left, red: d.red });
  }
  ctx.fillStyle = 'rgba(8,6,26,.94)'; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);
  ctx.strokeStyle = 'rgba(255,225,74,.6)'; ctx.lineWidth = 2; ctx.strokeRect(bx + 7, by + 7, bw - 14, bh - 14);
  const narr = d.who === 'narr';
  if (!narr && d.name) {
    const left = d.side === 'L'; ctx.font = 'bold 20px "Courier New"'; const nw = ctx.measureText(d.name).width + 36, nx = left ? bx + 20 : bx + bw - 20 - nw;
    ctx.fillStyle = '#ffe14a'; ctx.fillRect(nx, by - 30, nw, 34); ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 3; ctx.strokeRect(nx, by - 30, nw, 34);
    txt(d.name, nx + nw / 2, by - 25, { size: 20, align: 'center', color: '#1a1020', outline: false });
  }
  const lines = wrap(d.text, bw - 70, 22), full = Math.floor(d.shown); let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], take = clamp(full - n, 0, l.length); n += l.length + 1;
    txt(l.slice(0, take), narr ? W / 2 : bx + 34, by + 24 + i * 30, { size: 22, align: narr ? 'center' : 'left', color: narr ? '#ffeaa0' : '#fff', outline: false });
  }
  if (d.shown >= d.text.length && Math.floor(S.t * 3) % 2) txt('▼', bx + bw - 40, by + bh - 36, { size: 20, outline: false });
}
function drawFrame() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (S.mode === 'title') drawTitle();
  else if (S.stage) drawStage();
  else if (S.lvl) drawWorld();
  drawDialog();
  if (S.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${S.fade})`; ctx.fillRect(0, 0, W, H); }
}
