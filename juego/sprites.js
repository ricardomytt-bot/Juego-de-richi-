// Sprites procedurales (pixel art visto desde arriba, estilo Undertale / Tung Sahur World)
const Spr = (() => {
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g); return c; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const E = (g, cx, cy, rx, ry, c) => { g.fillStyle = c; for (let dy = -ry; dy <= ry; dy++) { const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.001)))); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } };
  const flipX = (c) => mk(c.width, c.height, g => { g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); });

  // ---- niño sobreviviente (16x22) ----
  function kid(dir, fr, shirt, hair) {
    const skin = '#f2c9a0';
    const base = mk(16, 22, g => {
      E(g, 8, 19, 5, 2, 'rgba(0,0,0,0.35)');
      const a = fr === 1 ? 1 : 0, b = fr === 2 ? 1 : 0;
      if (dir === 'l') { R(g, 6, 15 - a, 3, 4 + a, '#2a3a6a'); R(g, 8, 15 - b, 3, 4 + b, '#2a3a6a'); R(g, 5, 18 - a, 4, 1, '#222'); R(g, 8, 18 - b, 4, 1, '#222'); }
      else { R(g, 5, 15 - a, 3, 4 + a, '#2a3a6a'); R(g, 9, 15 - b, 3, 4 + b, '#2a3a6a'); R(g, 4, 18 - a, 4, 1, '#222'); R(g, 9, 18 - b, 4, 1, '#222'); }
      R(g, 4, 9, 8, 7, shirt); R(g, 4, 9, 8, 1, 'rgba(255,255,255,0.25)');
      if (dir === 'l') { R(g, 7, 10, 3, 5, shirt); R(g, 7, 14, 3, 1, skin); }
      else { R(g, 3, 10, 1, 5, shirt); R(g, 12, 10, 1, 5, shirt); R(g, 3, 14, 1, 1, skin); R(g, 12, 14, 1, 1, skin); }
      R(g, 3, 1, 10, 9, dir === 'u' ? hair : skin);
      if (dir === 'd') { R(g, 3, 0, 10, 3, hair); R(g, 2, 2, 1, 4, hair); R(g, 13, 2, 1, 4, hair); R(g, 5, 5, 2, 2, '#111'); R(g, 9, 5, 2, 2, '#111'); R(g, 5, 5, 1, 1, '#fff'); R(g, 9, 5, 1, 1, '#fff'); R(g, 7, 8, 2, 1, '#c07060'); }
      else if (dir === 'u') { R(g, 3, 0, 10, 2, hair); R(g, 2, 2, 1, 6, hair); R(g, 13, 2, 1, 6, hair); }
      else { R(g, 3, 0, 10, 3, hair); R(g, 9, 3, 4, 6, hair); R(g, 4, 5, 2, 2, '#111'); R(g, 4, 5, 1, 1, '#fff'); R(g, 4, 8, 2, 1, '#c07060'); }
    });
    return base;
  }
  // ---- muñeca robot (24x34) ----
  function doll(dir, fr) {
    return mk(24, 34, g => {
      E(g, 12, 31, 8, 3, 'rgba(0,0,0,0.4)');
      const a = fr === 1 ? 1 : 0, b = fr === 2 ? 1 : 0, metal = '#8a8aa0';
      R(g, 7, 25 - a, 3, 7 + a, metal); R(g, 14, 25 - b, 3, 7 + b, metal); R(g, 6, 31 - a, 5, 2, '#444'); R(g, 13, 31 - b, 5, 2, '#444');
      R(g, 6, 14, 12, 12, '#5a1a4a'); R(g, 6, 14, 12, 2, '#7a2a64'); R(g, 5, 24, 14, 3, '#e8d8e8');
      for (let i = 0; i < 7; i++) R(g, 5 + i * 2, 26, 1, 1, '#c8b8c8');
      R(g, 3, 15, 3, 9, metal); R(g, 18, 15, 3, 9, metal); R(g, 3, 23, 3, 2, '#d8c8b8'); R(g, 18, 23, 3, 2, '#d8c8b8');
      R(g, 8, 13, 8, 2, metal);
      const face = '#f4e4d4';
      R(g, 5, 1, 14, 13, dir === 'u' ? '#2a1418' : face);
      R(g, 4, 0, 16, 5, '#2a1418'); R(g, 4, 4, 2, 10, '#2a1418'); R(g, 18, 4, 2, 10, '#2a1418');
      R(g, 9, -1 + 1, 6, 3, '#d02a6a'); R(g, 8, 1, 2, 3, '#a01a4a'); R(g, 14, 1, 2, 3, '#a01a4a');
      if (dir === 'd') {
        R(g, 7, 7, 4, 3, '#111'); R(g, 13, 7, 4, 3, '#111'); R(g, 8, 8, 2, 2, '#ff2a2a'); R(g, 14, 8, 2, 2, '#ff2a2a');
        R(g, 6, 11, 2, 2, '#f0a0b0'); R(g, 16, 11, 2, 2, '#f0a0b0'); R(g, 10, 12, 4, 1, '#802030'); R(g, 10, 11, 1, 3, '#802030'); R(g, 13, 11, 1, 3, '#802030');
        R(g, 12, 4, 1, 4, '#9a9a9a');
      } else if (dir === 'l' || dir === 'r') {
        R(g, 6, 7, 4, 3, '#111'); R(g, 6, 8, 2, 2, '#ff2a2a'); R(g, 6, 11, 2, 2, '#f0a0b0'); R(g, 6, 12, 3, 1, '#802030');
        R(g, 12, 3, 6, 8, '#2a1418');
      }
    });
  }
  const cache = {};
  function kidSpr(dir, fr, shirt = '#3a8ad8', hair = '#3a2418') {
    const k = 'k' + dir + fr + shirt; if (cache[k]) return cache[k];
    if (dir === 'r') return cache[k] = flipX(kidSpr('l', fr, shirt, hair));
    return cache[k] = kid(dir, fr, shirt, hair);
  }
  function dollSpr(dir, fr) {
    const k = 'd' + dir + fr; if (cache[k]) return cache[k];
    if (dir === 'r') return cache[k] = flipX(dollSpr('l', fr));
    return cache[k] = doll(dir, fr);
  }

  // ---- tiles ----
  function tile(ch, i, j, below) {
    return mk(16, 16, g => {
      const h = (i * 7 + j * 13) % 5;
      if (ch === '.' || ch === '1' || ch === '2' || ch === '3') {
        R(g, 0, 0, 16, 16, (i + j) % 2 ? '#6b4a30' : '#654530');
        for (let y = 0; y < 16; y += 4) R(g, 0, y, 16, 1, '#4a3220'); R(g, (j % 2) * 8 + 3, 0, 1, 4, '#4a3220'); R(g, ((j + 1) % 2) * 8 + 3, 8, 1, 4, '#4a3220');
        R(g, h * 3, 5, 2, 1, '#7a5a3a');
        if (ch !== '.') { const id = +ch, col = KEY_COLORS[id]; R(g, 0, 0, 16, 16, '#2a1a10'); R(g, 1, 1, 14, 14, '#7a5232'); for (let x = 4; x < 14; x += 4) R(g, x, 1, 1, 14, '#5a3a22'); R(g, 0, 7, 16, 2, '#3a2412'); R(g, 5, 5, 6, 6, '#1a1008'); R(g, 6, 6, 4, 4, col); R(g, 7, 7, 2, 2, '#fff'); }
      } else if (ch === 'k') {
        R(g, 0, 0, 16, 16, '#c8c8d0'); R(g, 0, 0, 8, 8, '#8a8a9c'); R(g, 8, 8, 8, 8, '#8a8a9c');
      } else if (ch === 'g') {
        R(g, 0, 0, 16, 16, '#6a6a76'); R(g, h * 3, 3, 2, 1, '#5a5a66'); R(g, 10 - h, 11, 3, 1, '#7a7a86'); R(g, 0, 15, 16, 1, '#585864'); R(g, 15, 0, 1, 16, '#585864');
      } else if (ch === 'r') {
        R(g, 0, 0, 16, 16, '#7a2a3a'); for (let y = 0; y < 16; y += 4) for (let x = (y / 4 % 2) * 4; x < 16; x += 8) R(g, x + 1, y + 1, 2, 2, '#8e3a4a');
      } else if (ch === '#') {
        R(g, 0, 0, 16, 16, '#2a2038');
        if (below) { R(g, 0, 8, 16, 8, '#5a4a70'); R(g, 0, 8, 16, 1, '#7a6a90'); for (let y = 8; y < 16; y += 4) R(g, 0, y + 3, 16, 1, '#40345a'); R(g, (j % 2) * 8, 8, 1, 4, '#40345a'); R(g, ((j + 1) % 2) * 8 + 4, 12, 1, 4, '#40345a'); R(g, 0, 15, 16, 1, '#1a1428'); }
      } else R(g, 0, 0, 16, 16, '#05040a');
    });
  }
  function floorCanvas(F) {
    return mk(MW * TS, MH * TS, g => {
      for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
        const ch = F.g[j][i], below = j + 1 < MH && F.g[j + 1][i] !== '#' && F.g[j + 1][i] !== ' ';
        g.drawImage(tile(ch, i, j, below), i * TS, j * TS);
      }
    });
  }

  // ---- objetos ----
  function obj(g, o, st) {
    const X = o.x * TS, Y = o.y * TS, t = st.t || 0;
    switch (o.type === 'deco' ? 'd_' + o.kind : o.type) {
      case 'chest': R(g, X + 1, Y + 4, 14, 11, '#4a2a10'); R(g, X + 2, Y + 5, 12, 9, '#8a5a2a');
        if (o.opened) { R(g, X + 1, Y + 1, 14, 4, '#6a4018'); R(g, X + 3, Y + 6, 10, 4, '#1a0e06'); } else { R(g, X + 1, Y + 3, 14, 4, '#9a6a34'); R(g, X + 7, Y + 6, 2, 3, '#ffd23f'); R(g, X + 1, Y + 7, 14, 1, '#4a2a10'); }
        break;
      case 'wardrobe': R(g, X, Y - 2, 16, 18, '#3a2210'); R(g, X + 1, Y - 1, 14, 16, '#7a4a22');
        if (o.opened) { R(g, X + 2, Y, 12, 13, '#150a04'); R(g, X + 1, Y - 1, 3, 15, '#6a3c18'); R(g, X + 12, Y - 1, 3, 15, '#6a3c18'); } else { R(g, X + 7, Y - 1, 2, 16, '#3a2210'); R(g, X + 5, Y + 6, 1, 3, '#ffd23f'); R(g, X + 10, Y + 6, 1, 3, '#ffd23f'); R(g, X + 2, Y + 1, 5, 5, '#8a5a2e'); R(g, X + 9, Y + 1, 5, 5, '#8a5a2e'); }
        break;
      case 'vault': R(g, X, Y - 2, 16, 18, '#2a2a34'); R(g, X + 1, Y - 1, 14, 16, '#7a7a8c');
        if (o.opened) { R(g, X + 3, Y + 1, 10, 12, '#0a0a10'); R(g, X + 11, Y, 4, 14, '#9a9aac'); } else { E(g, X + 8, Y + 7, 5, 5, '#4a4a5c'); E(g, X + 8, Y + 7, 3, 3, '#9a9aac'); R(g, X + 7, Y + 6, 2, 2, '#ffd23f'); R(g, X + 3, Y + 2, 2, 2, '#3a3a48'); }
        break;
      case 'recharge': { const on = st.power !== false; R(g, X, Y + 2, 16, 13, '#2a2a34'); R(g, X + 1, Y + 3, 14, 11, on ? '#2a5a3a' : '#2a2a34'); R(g, X + 4, Y + 5, 8, 6, '#111'); R(g, X + 12, Y + 7, 2, 2, '#111'); R(g, X + 5, Y + 6, 6, 4, on ? (st.charging ? ((t * 8 | 0) % 2 ? '#ffd23f' : '#3ae07a') : '#3ae07a') : '#333'); R(g, X + 8, Y + 4, 1, 2, '#ffd23f'); break; }
      case 'table': R(g, X, Y + 3, 16, 12, '#3a2a14'); R(g, X + 1, Y + 4, 14, 8, '#9a6a34'); R(g, X + 3, Y + 6, 4, 2, '#8a8a9a'); R(g, X + 9, Y + 6, 3, 3, '#e04040'); R(g, X + 2, Y + 12, 2, 3, '#3a2a14'); R(g, X + 12, Y + 12, 2, 3, '#3a2a14'); break;
      case 'computer': R(g, X, Y + 4, 16, 11, '#2a2a34'); R(g, X + 2, Y, 12, 9, '#1a1a22'); R(g, X + 3, Y + 1, 10, 7, st.blackout ? ((t * 3 | 0) % 2 ? '#ff4040' : '#401010') : '#3ae07a'); R(g, X + 3, Y + 11, 10, 2, '#6a6a7c'); break;
      case 'exit': R(g, X - 1, Y - 3, 18, 20, '#2a2a34'); R(g, X, Y - 2, 16, 18, '#7a7a8c'); for (let y = 0; y < 16; y += 4) R(g, X + 1, Y - 1 + y, 14, 1, '#5a5a6c'); R(g, X + 10, Y + 4, 5, 7, '#1a1a22'); R(g, X + 11, Y + 5, 3, 1, o.escape ? '#3ae07a' : '#e04040'); R(g, X + 11, Y + 7, 1, 1, '#fff'); R(g, X + 13, Y + 7, 1, 1, '#fff'); R(g, X + 11, Y + 9, 1, 1, '#fff'); R(g, X + 13, Y + 9, 1, 1, '#fff'); break;
      case 'stairs': R(g, X, Y, 16, 16, '#3a3040'); for (let i = 0; i < 5; i++) R(g, X + 1, Y + 1 + i * 3, 14, 2, o.to === 1 ? ['#8a7a9a', '#7a6a8a', '#6a5a7a', '#5a4a6a', '#4a3a5a'][i] : ['#4a3a5a', '#5a4a6a', '#6a5a7a', '#7a6a8a', '#8a7a9a'][i]); R(g, X + 6, Y + 6, 4, 4, '#ffd23f'); break;
      case 'd_sofa': R(g, X, Y + 2, o.w * 16, 14, '#2a3a6a'); R(g, X + 1, Y + 3, o.w * 16 - 2, 11, '#3a5aa0'); R(g, X + 1, Y + 1, o.w * 16 - 2, 4, '#2a4a80'); R(g, X + 15, Y + 6, 1, 8, '#2a3a6a'); R(g, X + 31, Y + 6, 1, 8, '#2a3a6a'); break;
      case 'd_bed': R(g, X, Y, 32, 32, '#3a2a14'); R(g, X + 1, Y + 1, 30, 30, '#d8d0e8'); R(g, X + 2, Y + 2, 28, 8, '#fff'); R(g, X + 1, Y + 13, 30, 18, '#3a6aa0'); R(g, X + 1, Y + 13, 30, 2, '#2a4a80'); break;
      case 'd_car': R(g, X, Y + 2, 64, 28, '#1a1a22'); R(g, X + 2, Y + 3, 60, 26, '#c04040'); R(g, X + 14, Y + 6, 28, 20, '#8ab0d0'); R(g, X + 16, Y + 8, 24, 16, '#4a7090'); R(g, X + 58, Y + 6, 4, 4, '#ffe890'); R(g, X + 58, Y + 22, 4, 4, '#ffe890'); R(g, X + 2, Y + 3, 60, 2, '#e06060'); break;
      case 'd_desk': R(g, X, Y + 3, o.w * 16, 13, '#3a2a14'); R(g, X + 1, Y + 4, o.w * 16 - 2, 9, '#7a5a34'); R(g, X + 6, Y + 6, 5, 4, '#e8e0c8'); break;
      case 'd_shelf': R(g, X, Y - 2, o.w * 16, 18, '#3a2210'); for (let i = 0; i < 3; i++) { R(g, X + 1, Y + i * 5 - 1, o.w * 16 - 2, 4, '#7a4a22'); for (let k = 0; k < o.w * 4; k++) R(g, X + 2 + k * 4, Y + i * 5 - 1, 3, 4, ['#e04040', '#4a8aff', '#ffd23f', '#3ae07a'][(k + i) % 4]); } break;
      case 'd_table': { R(g, X, Y + 2, o.w * 16, o.h * 16 - 2, '#3a2a14'); R(g, X + 1, Y + 3, o.w * 16 - 2, o.h * 16 - 6, '#8a5a2e'); R(g, X + 4, Y + 6, 4, 3, '#e8e0c8'); break; }
    }
  }
  // iconos de materiales (para HUD / mensajes)
  return { mk, R, E, kid: kidSpr, doll: dollSpr, floorCanvas, obj };
})();
