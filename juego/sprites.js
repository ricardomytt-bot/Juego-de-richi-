// Sprites procedurales: pixel art "chibi" (cabezas grandes y redondas, contorno, sombreado, peinados)
const Spr = (() => {
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g); return c; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const E = (g, cx, cy, rx, ry, c) => { g.fillStyle = c; for (let dy = -ry; dy <= ry; dy++) { const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.001)))); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } };
  const L = (g, x0, y0, x1, y1, c, t = 1) => { g.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), t, t); };
  const flipX = c => mk(c.width, c.height, g => { g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); });
  const OL = '#2a1a30';
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const r = Math.min(255, Math.round((n >> 16) * f)), gg = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f)); return '#' + ((1 << 24) | (r << 16) | (gg << 8) | b).toString(16).slice(1); };
  // elipse con contorno y sombreado (luz arriba-izquierda)
  function blob(g, cx, cy, rx, ry, base, o = {}) {
    if (o.out !== false) E(g, cx, cy, rx + 1, ry + 1, o.outCol || OL);
    if (ry >= 4 && rx >= 3 && o.shade !== false) {
      E(g, cx, cy, rx, ry, shade(base, 0.74)); E(g, cx, cy - 1, rx, ry - 1, base);
      E(g, cx - Math.round(rx * 0.35), cy - Math.round(ry * 0.42), Math.max(1, Math.round(rx * 0.32)), Math.max(1, Math.round(ry * 0.25)), shade(base, 1.25));
    } else E(g, cx, cy, rx, ry, base);
  }
  const rb = (g, x, y, w, h, fill, out = OL) => { R(g, x, y, w, h, out); R(g, x + 1, y + 1, w - 2, h - 2, fill); g.clearRect(x, y, 1, 1); g.clearRect(x + w - 1, y, 1, 1); g.clearRect(x, y + h - 1, 1, 1); g.clearRect(x + w - 1, y + h - 1, 1, 1); };

  // ================= SOBREVIVIENTE (24x34, pies en y=29) =================
  const STYLES = [
    { skin: '#ffd9b8', hair: '#6a3a20', shirt: '#4aa0ff', style: 'spiky' },
    { skin: '#e8b48c', hair: '#1c1428', shirt: '#ff6a8a', style: 'pony' },
    { skin: '#ffe0c8', hair: '#e8b030', shirt: '#4ac870', style: 'bun' },
    { skin: '#b57850', hair: '#2a1a1a', shirt: '#ffa030', style: 'pig' },
    { skin: '#ffd9b8', hair: '#c04030', shirt: '#9a6aff', style: 'long' },
    { skin: '#d49a70', hair: '#3a2a50', shirt: '#30c8d8', style: 'spiky' },
    { skin: '#ffe0c8', hair: '#f0f0f8', shirt: '#e84040', style: 'bun' },
    { skin: '#e8b48c', hair: '#6a3a20', shirt: '#f0d040', style: 'pony' },
  ];
  function kid(dir, fr, st) {
    return mk(24, 34, g => {
      const skin = st.skin, hair = st.hair, shirt = st.shirt;
      const hl = shade(hair, 1.45), hd = shade(hair, 0.7);
      const swing = fr === 1 ? 1 : fr === 2 ? -1 : 0, bob = fr ? 1 : 0;
      E(g, 12, 30, 8, 2, 'rgba(0,0,0,0.30)');
      const HY = 13 - 0 + (bob ? 0 : 0);
      // pelo trasero (largo / coletas) detrás del cuerpo
      if (st.style === 'long') blob(g, 12, HY + 6, 9, 9, hair);
      if (st.style === 'pig' && dir !== 'd') { blob(g, 3, HY + 3, 3, 4, hair); blob(g, 21, HY + 3, 3, 4, hair); }
      // pies
      const side = dir === 'l';
      if (side) { blob(g, 9, 28 - (swing > 0 ? 1 : 0), 3, 2, '#3a2850', { shade: false }); blob(g, 15, 28 - (swing < 0 ? 1 : 0), 3, 2, '#3a2850', { shade: false }); }
      else { blob(g, 8, 28 - (swing > 0 ? 1 : 0), 3, 2, '#3a2850', { shade: false }); blob(g, 16, 28 - (swing < 0 ? 1 : 0), 3, 2, '#3a2850', { shade: false }); }
      // cuerpo
      blob(g, 12, 24 - bob * 0, side ? 4 : 5, 4, shirt);
      R(g, side ? 9 : 8, 26, side ? 7 : 9, 1, shade(shirt, 0.6));
      // brazos
      if (side) { blob(g, 12, 23 + swing, 2, 3, shade(shirt, 1.05)); E(g, 12, 26 + swing, 1, 1, skin); }
      else { blob(g, 6, 23 + swing, 2, 3, shirt); blob(g, 18, 23 - swing, 2, 3, shirt); E(g, 6, 26 + swing, 1, 1, skin); E(g, 18, 26 - swing, 1, 1, skin); }
      // extras de peinado atrás
      if (st.style === 'pony' && dir !== 'd') { blob(g, dir === 'l' ? 21 : dir === 'r' ? 3 : 12, dir === 'u' ? HY + 6 : HY + 3, dir === 'u' ? 3 : 3, dir === 'u' ? 5 : 4, hair); }
      if (st.style === 'pony' && dir === 'd') blob(g, 20, HY + 1, 3, 4, hair);
      // cabeza: pelo + cara
      const cx = side ? 13 : 12;
      blob(g, cx, HY, 9, 9, hair);
      if (st.style === 'spiky') { [[6, 4, 4], [12, 2, 5], [18, 4, 4]].forEach(([x, y, h]) => { for (let i = 0; i < h; i++) R(g, x - ((h - i) >> 1) + 1, y + i - 1, h - i, 1, OL); for (let i = 0; i < h - 1; i++) R(g, x - ((h - i) >> 1) + 2, y + i, Math.max(1, h - i - 2), 1, hair); }); R(g, 11, 2, 2, 2, hl); }
      if (st.style === 'bun') { blob(g, 12, 3, 4, 3, hair); R(g, 11, 2, 2, 1, hl); }
      if (st.style === 'pig' && dir === 'd') { blob(g, 3, HY + 2, 3, 4, hair); blob(g, 21, HY + 2, 3, 4, hair); R(g, 2, HY - 1, 3, 2, '#ff5a8a'); R(g, 19, HY - 1, 3, 2, '#ff5a8a'); }
      R(g, cx - 5, HY - 7, 5, 1, hl); R(g, cx - 6, HY - 6, 2, 1, hl); R(g, cx + 2, HY - 7, 2, 1, shade(hair, 1.2));
      if (dir === 'd') {
        E(g, 12, HY + 2, 7, 6, skin); E(g, 12, HY + 3, 7, 6, skin); R(g, 6, HY + 6, 12, 1, shade(skin, 0.9));
        // flequillo
        R(g, 6, HY - 3, 5, 1, hair); R(g, 7, HY - 2, 3, 1, hair); R(g, 8, HY - 1, 1, 1, hair); R(g, 13, HY - 3, 6, 1, hair); R(g, 15, HY - 2, 3, 1, hair); R(g, 12, HY - 3, 1, 2, hd);
        // ojos grandes con brillo
        for (const ex of [8, 14]) { R(g, ex, HY + 1, 3, 4, '#1a1020'); R(g, ex, HY + 1, 1, 1, '#fff'); R(g, ex + 1, HY + 4, 1, 1, '#4a3a6a'); R(g, ex + 2, HY + 2, 1, 1, '#fff'); }
        E(g, 6, HY + 5, 1, 1, '#ff9a9a'); E(g, 18, HY + 5, 1, 1, '#ff9a9a'); R(g, 11, HY + 6, 2, 1, '#b04a50'); R(g, 10, HY + 5, 1, 1, '#b04a50'); R(g, 13, HY + 5, 1, 1, '#b04a50');
      } else if (dir === 'u') {
        R(g, 12, HY - 6, 1, 6, hd); R(g, 8, HY - 2, 2, 1, hd); R(g, 15, HY - 3, 2, 1, hd); R(g, 9, HY + 1, 6, 1, hd);
      } else {
        E(g, cx - 3, HY + 3, 6, 6, skin); R(g, cx - 8, HY - 1, 4, 1, hair); R(g, cx - 7, HY - 2, 4, 1, hair); R(g, cx - 6, HY - 3, 3, 1, hair);
        R(g, cx - 7, HY + 1, 3, 4, '#1a1020'); R(g, cx - 7, HY + 1, 1, 1, '#fff'); R(g, cx - 5, HY + 2, 1, 1, '#fff'); R(g, cx - 10, HY + 4, 2, 2, skin); R(g, cx - 10, HY + 4, 1, 2, shade(skin, 0.85));
        E(g, cx - 5, HY + 6, 1, 1, '#ff9a9a'); R(g, cx - 7, HY + 7, 2, 1, '#b04a50'); E(g, cx + 3, HY + 3, 1, 2, shade(skin, 0.9));
      }
    });
  }

  // ================= MUÑECA ROBOT (40x52, pies en y=48) =================
  function doll(dir, fr, mood) {
    return mk(40, 52, g => {
      const metal = '#9a9ab4', mdark = '#5a5a74', porc = '#fff0e6', dress = '#7a2068', hair = '#2e1840', hl = '#6a4a90';
      const swing = fr === 1 ? 1 : fr === 2 ? -1 : 0, bob = fr ? 1 : 0, side = dir === 'l';
      E(g, 20, 49, 12, 3, 'rgba(0,0,0,0.40)');
      // coletas atrás
      if (dir !== 'd' || true) { blob(g, 6, 22, 4, 7, hair); blob(g, 34, 22, 4, 7, hair); R(g, 4, 19, 4, 2, '#d02a6a'); R(g, 32, 19, 4, 2, '#d02a6a'); }
      // piernas y zapatos
      R(g, 15, 40, 3, 6 - (swing > 0 ? 1 : 0), mdark); R(g, 22, 40, 3, 6 - (swing < 0 ? 1 : 0), mdark);
      blob(g, 16, 47 - (swing > 0 ? 1 : 0), 4, 2, '#2a1a30', { shade: false }); blob(g, 24, 47 - (swing < 0 ? 1 : 0), 4, 2, '#2a1a30', { shade: false }); R(g, 14, 46 - (swing > 0 ? 1 : 0), 4, 1, '#d02a6a'); R(g, 22, 46 - (swing < 0 ? 1 : 0), 4, 1, '#d02a6a');
      // falda de campana
      blob(g, 20, 38 - bob, 12, 8, dress);
      for (let i = 0; i < 6; i++) blob(g, 10 + i * 4, 44 - bob, 2, 2, '#f4e8f4', { out: false });
      R(g, 9, 44 - bob, 22, 1, '#d8c8d8');
      blob(g, 20, 37 - bob, 6, 7, '#f6ecf6', { shade: false }); R(g, 19, 34 - bob, 3, 1, '#d02a6a'); R(g, 18, 35 - bob, 5, 1, '#d02a6a'); R(g, 19, 36 - bob, 3, 1, '#d02a6a');
      // torso + brazos metálicos
      blob(g, 20, 29 - bob, 7, 5, dress);
      const ay = swing * 1;
      R(g, 8, 27 + ay, 3, 11, mdark); R(g, 9, 27 + ay, 1, 11, metal); R(g, 29, 27 - ay, 3, 11, mdark); R(g, 30, 27 - ay, 1, 11, metal);
      blob(g, 9, 28 + ay, 3, 3, '#b8b8d0'); R(g, 8, 27 + ay, 2, 1, mdark); blob(g, 31, 28 - ay, 3, 3, '#b8b8d0'); R(g, 30, 27 - ay, 2, 1, mdark);
      blob(g, 9, 39 + ay, 2, 2, porc, { shade: false }); blob(g, 31, 39 - ay, 2, 2, porc, { shade: false });
      // cuello
      R(g, 17, 24 - bob, 6, 2, mdark);
      // cabeza
      const hy = 15 - bob;
      if (dir === 'u') {
        blob(g, 20, hy, 12, 12, hair); R(g, 20, hy - 9, 1, 8, shade(hair, 0.6)); R(g, 12, hy - 6, 6, 1, hl); R(g, 11, hy - 5, 2, 1, hl);
        // llave de cuerda en la espalda
        const kx = 20, ky = 32 - bob; R(g, kx - 1, ky - 5, 3, 8, '#c8c8dc'); R(g, kx, ky - 5, 1, 8, '#8a8aa0'); blob(g, kx - 4, ky - 6, 3, 3, '#d8d8ec'); blob(g, kx + 5, ky - 6, 3, 3, '#d8d8ec'); E(g, kx - 4, ky - 6, 1, 1, '#2a1a30'); E(g, kx + 5, ky - 6, 1, 1, '#2a1a30');
      } else {
        blob(g, 20, hy, 12, 12, hair);
        const fx = side ? 17 : 20;
        blob(g, fx, hy + 2, 10, 9, porc);
        R(g, fx - 6, hy - 8, 8, 1, hair); R(g, fx - 7, hy - 7, 4, 1, hair); R(g, fx + 3, hy - 8, 6, 1, hair); R(g, fx + 5, hy - 7, 3, 1, hair);
        L(g, fx + 3, hy - 7, fx + 5, hy - 3, '#a89898'); L(g, fx + 5, hy - 3, fx + 4, hy, '#a89898');
        R(g, 11, hy - 8, 6, 1, hl); R(g, 10, hy - 7, 2, 1, hl);
        const ex = side ? [fx - 5] : [fx - 6, fx + 6];
        for (const e of ex) {
          if (mood === 'stun') { L(g, e - 2, hy - 1, e + 2, hy + 3, '#ff4a4a', 1); L(g, e + 2, hy - 1, e - 2, hy + 3, '#ff4a4a', 1); }
          else { blob(g, e, hy + 1, 3, 4, '#18101e', { out: false }); R(g, e - 1, hy + 1, 3, 3, mood === 'angry' ? '#ff2a2a' : '#c02a3a'); R(g, e - 2, hy - 2, 1, 2, '#fff'); R(g, e + 1, hy + 2, 1, 1, '#ffd0d0'); }
          if (mood === 'angry') L(g, side ? e - 3 : (e < fx ? e - 4 : e + 4), hy - 6 + (e < fx ? 0 : 0), side ? e + 3 : (e < fx ? e + 3 : e - 3), hy - 3 - 0, '#2a1020', 2);
        }
        E(g, fx - 9, hy + 6, 2, 1, '#ff9ab0'); if (!side) E(g, fx + 9, hy + 6, 2, 1, '#ff9ab0');
        if (mood === 'angry') { R(g, fx - 4, hy + 6, 9, 4, '#1a0810'); for (let i = 0; i < 4; i++) { R(g, fx - 4 + i * 2 + 1, hy + 6, 1, 2, '#fff'); R(g, fx - 4 + i * 2 + 1, hy + 8, 1, 2, '#fff'); } }
        else if (mood === 'stun') { for (let i = 0; i < 5; i++) R(g, fx - 5 + i * 2, hy + 7 + (i % 2), 2, 1, '#6a2030'); }
        else { R(g, fx - 4, hy + 7, 9, 1, '#6a2030'); for (let i = 0; i < 4; i++) R(g, fx - 4 + i * 3, hy + 6, 1, 3, '#6a2030'); }
      }
      // moño
      blob(g, 12, 2 - bob, 5, 3, '#e02a70'); blob(g, 28, 2 - bob, 5, 3, '#e02a70'); blob(g, 20, 3 - bob, 2, 2, '#a01a50', { shade: false });
    });
  }
  const cache = {};
  function kidSpr(dir, fr, styleIdx = 0) {
    const k = 'k' + dir + fr + '_' + styleIdx; if (cache[k]) return cache[k];
    if (dir === 'r') return cache[k] = flipX(kidSpr('l', fr, styleIdx));
    return cache[k] = kid(dir, fr, STYLES[styleIdx % STYLES.length]);
  }
  function dollSpr(dir, fr, mood = 'calm') {
    const k = 'd' + dir + fr + mood; if (cache[k]) return cache[k];
    if (dir === 'r') return cache[k] = flipX(dollSpr('l', fr, mood));
    return cache[k] = doll(dir, fr, mood);
  }

  // ================= TILES =================
  const WALLPAL = { '.': ['#8a6ab8', '#9a7ac8', '#5a3a88', '#b8a0e0'], k: ['#58b8a8', '#68c8b8', '#2a7a6a', '#98e8d8'], g: ['#8a98b8', '#9aa8c8', '#4a5a78', '#c0d0f0'], r: ['#c8587a', '#d8688a', '#8a2a4a', '#f0a0b8'] };
  function tile(ch, i, j, below, above, wc) {
    return mk(16, 16, g => {
      const h = (i * 7 + j * 13) % 5, n = (i * 31 + j * 17) % 7;
      if (ch === '.' || ch === '1' || ch === '2' || ch === '3') {
        const cols = ['#b07040', '#a46638', '#bc7c48', '#aa6c3c'];
        for (let y = 0; y < 16; y += 8) { const c = cols[((j * 2 + (y >> 3)) + i * 3) % 4]; R(g, 0, y, 16, 8, c); R(g, 0, y, 16, 1, shade(c, 0.7)); R(g, 0, y + 1, 16, 1, shade(c, 1.12)); R(g, 0, y + 7, 16, 1, shade(c, 0.85)); const off = ((j + (y >> 3)) * 5 + i) % 3 * 5 + 2; R(g, off, y, 1, 8, shade(c, 0.65)); R(g, (off + 7) % 16, y + 3, 3, 1, shade(c, 0.9)); R(g, (off + 3) % 16, y + 5, 1, 1, shade(c, 0.6)); }
        if (ch !== '.') {
          const id = +ch, col = KEY_COLORS[id];
          R(g, 0, 0, 16, 16, '#2a1a10'); R(g, 1, 1, 14, 15, '#8a5a34'); R(g, 1, 1, 14, 1, '#a87444'); for (let x = 4; x < 14; x += 4) R(g, x, 2, 1, 14, '#6a4020');
          R(g, 2, 3, 5, 5, '#7a4e2a'); R(g, 9, 3, 5, 5, '#7a4e2a'); R(g, 2, 9, 5, 5, '#7a4e2a'); R(g, 9, 9, 5, 5, '#7a4e2a');
          blob(g, 8, 8, 4, 4, '#2a2030'); E(g, 8, 8, 3, 3, col); R(g, 7, 7, 2, 2, '#fff'); R(g, 8, 9, 1, 3, '#2a2030');
        }
      } else if (ch === 'k') {
        const A = '#e6efe8', B = '#86b0aa';
        R(g, 0, 0, 16, 16, A); R(g, 0, 0, 8, 8, B); R(g, 8, 8, 8, 8, B);
        R(g, 0, 0, 16, 1, 'rgba(255,255,255,0.35)'); R(g, 0, 8, 16, 1, 'rgba(255,255,255,0.2)'); R(g, 7, 0, 1, 16, 'rgba(0,0,0,0.12)'); R(g, 15, 0, 1, 16, 'rgba(0,0,0,0.12)'); R(g, 0, 15, 16, 1, 'rgba(0,0,0,0.12)');
        R(g, 2, 2, 2, 1, '#fff'); R(g, 10, 10, 2, 1, '#fff');
      } else if (ch === 'g') {
        R(g, 0, 0, 16, 16, '#8c90a4'); for (let k = 0; k < 6; k++) R(g, (h * 3 + k * 5) % 15, (n * 2 + k * 3) % 15, 2, 1, k % 2 ? '#6c6c7c' : '#8c8c9c');
        R(g, 0, 15, 16, 1, '#5c5c6c'); R(g, 15, 0, 1, 16, '#5c5c6c'); R(g, 0, 0, 16, 1, '#8c8c9c');
        if (j % 4 === 0) { R(g, 2, 7, 5, 2, '#e8c840'); R(g, 10, 7, 5, 2, '#e8c840'); }
        if (n === 3) { E(g, 8, 8, 4, 2, 'rgba(30,30,40,0.35)'); }
      } else if (ch === 'r') {
        R(g, 0, 0, 16, 16, '#b04060'); R(g, 0, 0, 16, 1, '#c85478'); R(g, 0, 15, 16, 1, '#6e2438'); R(g, 15, 0, 1, 16, '#6e2438');
        for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) { R(g, x + 3, y + 1, 2, 6, '#a24258'); R(g, x + 1, y + 3, 6, 2, '#a24258'); R(g, x + 3, y + 3, 2, 2, '#d8a8b0'); }
      } else if (ch === '#') {
        R(g, 0, 0, 16, 16, '#2c2240'); R(g, 0, 0, 16, 1, '#3c3258');
        for (let k = 0; k < 4; k++) R(g, (h * 4 + k * 5) % 15, (n * 3 + k * 4) % 15, 1, 1, '#382e50');
        if (below) {
          const w = WALLPAL[wc] || WALLPAL['.'];
          R(g, 0, 7, 16, 9, w[0]); for (let x = 0; x < 16; x += 4) R(g, x, 8, 2, 6, w[1]); R(g, 0, 7, 16, 1, w[3]);
          R(g, 0, 13, 16, 3, w[2]); R(g, 0, 13, 16, 1, w[3]); R(g, 0, 15, 16, 1, '#241a34'); R(g, 5 + h, 9, 2, 2, w[3]); R(g, 11 - h % 3, 10, 1, 1, w[2]);
        } else R(g, 0, 15, 16, 1, '#241a34');
      } else R(g, 0, 0, 16, 16, '#05040a');
      if (above && ch !== '#' && ch !== ' ') { R(g, 0, 0, 16, 4, 'rgba(10,0,20,0.28)'); R(g, 0, 4, 16, 3, 'rgba(10,0,20,0.12)'); }
    });
  }
  function floorCanvas(F) {
    return mk(MW * TS, MH * TS, g => {
      for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
        const ch = F.g[j][i], below = j + 1 < MH && F.g[j + 1][i] !== '#' && F.g[j + 1][i] !== ' ', above = j > 0 && F.g[j - 1][i] === '#';
        g.drawImage(tile(ch, i, j, below, above, below ? F.g[j + 1][i] : '.'), i * TS, j * TS);
      }
      for (const r of (F.rugs || [])) {
        const x = r.x * TS, y = r.y * TS, w = r.w * TS, h = r.h * TS;
        R(g, x, y, w, h, OL); R(g, x + 1, y + 1, w - 2, h - 2, r.c1); R(g, x + 3, y + 3, w - 6, h - 6, r.c2); R(g, x + 5, y + 5, w - 10, h - 10, r.c1);
        for (let k = 0; k < w - 8; k += 6) { R(g, x + 4 + k, y + 4, 2, 2, r.c3); R(g, x + 4 + k, y + h - 6, 2, 2, r.c3); }
        for (let k = 0; k < h - 8; k += 6) { R(g, x + 4, y + 4 + k, 2, 2, r.c3); R(g, x + w - 6, y + 4 + k, 2, 2, r.c3); }
        E(g, x + (w >> 1), y + (h >> 1), Math.max(2, (w >> 1) - 9), Math.max(2, (h >> 1) - 8), r.c3);
        E(g, x + (w >> 1), y + (h >> 1), Math.max(1, (w >> 1) - 12), Math.max(1, (h >> 1) - 11), r.c2);
      }
      // ventanas y cuadros en la pared de arriba de cada habitación + rayos de luna sobre el piso
      for (const r of F.rooms) {
        if (r.w < 5) continue;
        const ty = (r.y - 1) * TS;
        for (let x = r.x + 1; x < r.x + r.w - 1; x += 4) {
          const kind = (x * 3 + r.y) % 3, X = x * TS + 3, Y = ty + 8;
          if (kind === 0) {
            R(g, X - 1, Y - 1, 12, 8, OL); R(g, X, Y, 10, 6, '#3a5aa8'); R(g, X + 1, Y + 1, 4, 3, '#a8c8ff'); R(g, X + 6, Y + 1, 3, 2, '#a8c8ff'); R(g, X + 5, Y, 1, 6, '#e8e0f0'); R(g, X, Y + 3, 10, 1, '#e8e0f0'); R(g, X + 7, Y + 1, 2, 2, '#fff8c0');
            for (let k = 0; k < 40; k += 2) { const wd = 8 + (k >> 1), x0 = X - 1 - (k >> 2); g.fillStyle = 'rgba(150,190,255,' + (0.13 - k * 0.0028).toFixed(3) + ')'; g.fillRect(x0 + 3, ty + TS + k, wd, 2); }
          } else if (kind === 1) {
            R(g, X, Y, 10, 6, OL); R(g, X + 1, Y + 1, 8, 4, '#e8c060'); R(g, X + 2, Y + 2, 6, 2, ['#d04a6a', '#4aa8d0', '#6ac04a'][(x + r.y) % 3]); R(g, X + 3, Y + 2, 2, 1, '#fff');
          } else { E(g, X + 5, Y + 3, 3, 3, OL); E(g, X + 5, Y + 3, 2, 2, '#f4ecd8'); R(g, X + 5, Y + 1, 1, 3, OL); R(g, X + 5, Y + 3, 2, 1, OL); }
        }
      }
      for (const o of F.objs) if (o.type === 'deco' && o.kind === 'lamp') {
        const cx = o.x * TS + 8, cy = o.y * TS + 8;
        [[34, 26, 0.05], [26, 20, 0.06], [18, 14, 0.07], [10, 8, 0.09]].forEach(([rx, ry, a]) => E(g, cx, cy, rx, ry, 'rgba(255,200,110,' + a + ')'));
      }
    });
  }

  // ================= OBJETOS =================
  function obj(g, o, st) {
    const X = o.x * TS, Y = o.y * TS, t = st.t || 0, W = o.w * TS, H = o.h * TS;
    const shadow = (w = W) => E(g, X + (w >> 1), Y + H - 1, (w >> 1) - 1, 3, 'rgba(0,0,0,0.28)');
    switch (o.type === 'deco' ? 'd_' + o.kind : o.type) {
      case 'chest': shadow(); rb(g, X + 1, Y + 5, 14, 10, '#9a6430'); R(g, X + 2, Y + 6, 12, 2, '#b87a3c'); R(g, X + 2, Y + 12, 12, 2, '#7a4a20'); R(g, X + 1, Y + 9, 14, 1, OL); R(g, X + 4, Y + 6, 1, 8, '#6a3a18'); R(g, X + 11, Y + 6, 1, 8, '#6a3a18');
        if (o.opened) { rb(g, X + 1, Y + 1, 14, 5, '#7a4a20'); R(g, X + 3, Y + 7, 10, 3, '#150a04'); } else { rb(g, X + 1, Y + 2, 14, 6, '#b87a3c'); R(g, X + 2, Y + 3, 12, 1, '#d89a58'); rb(g, X + 6, Y + 6, 4, 5, '#ffd23f', '#8a6a10'); R(g, X + 7, Y + 8, 2, 2, '#8a6a10'); }
        break;
      case 'wardrobe': shadow(); rb(g, X, Y - 3, 16, 19, '#7a4a28'); R(g, X + 1, Y - 2, 14, 2, '#a06a3c');
        if (o.opened) { R(g, X + 2, Y, 12, 14, '#150a04'); rb(g, X, Y - 2, 4, 17, '#8a5a30'); rb(g, X + 12, Y - 2, 4, 17, '#8a5a30'); R(g, X + 5, Y + 3, 6, 1, '#4a3a5a'); R(g, X + 5, Y + 4, 6, 5, '#3a6aa0'); }
        else { R(g, X + 7, Y - 2, 2, 17, OL); rb(g, X + 2, Y, 5, 7, '#92603a'); rb(g, X + 9, Y, 5, 7, '#92603a'); rb(g, X + 2, Y + 8, 5, 6, '#92603a'); rb(g, X + 9, Y + 8, 5, 6, '#92603a'); R(g, X + 5, Y + 6, 1, 3, '#ffd23f'); R(g, X + 10, Y + 6, 1, 3, '#ffd23f'); }
        break;
      case 'vault': shadow(); rb(g, X, Y - 3, 16, 19, '#6a6a80'); R(g, X + 1, Y - 2, 14, 2, '#9a9ab4');
        if (o.opened) { R(g, X + 3, Y, 10, 13, '#0a0a10'); rb(g, X + 11, Y - 1, 5, 15, '#8a8aa0'); R(g, X + 4, Y + 2, 3, 3, '#3ae07a'); R(g, X + 4, Y + 6, 4, 2, '#ffd23f'); }
        else { blob(g, X + 8, Y + 6, 5, 5, '#8a8aa0'); E(g, X + 8, Y + 6, 3, 3, '#c0c0d8'); R(g, X + 8, Y + 4, 1, 3, '#2a2a40'); R(g, X + 7, Y + 6, 3, 1, '#2a2a40'); R(g, X + 2, Y - 1, 2, 2, '#3a3a50'); R(g, X + 12, Y - 1, 2, 2, '#3a3a50'); }
        break;
      case 'recharge': { const on = st.power !== false; shadow(); rb(g, X, Y + 2, 16, 13, '#3a3a4c'); R(g, X + 1, Y + 3, 14, 3, on ? '#4a4a60' : '#2a2a38'); rb(g, X + 3, Y + 6, 10, 7, '#18181e'); const col = on ? (st.charging ? ((t * 8 | 0) % 2 ? '#ffd23f' : '#3ae07a') : '#3ae07a') : '#333'; R(g, X + 4, Y + 7, 8, 5, col); R(g, X + 13, Y + 8, 2, 3, '#18181e'); R(g, X + 8, Y + 7, 1, 2, '#fff'); R(g, X + 7, Y + 9, 3, 1, '#fff'); if (on) E(g, X + 8, Y + 9, 12, 8, 'rgba(60,224,122,0.12)'); break; }
      case 'table': shadow(); rb(g, X, Y + 3, 16, 12, '#7a5030'); R(g, X + 1, Y + 4, 14, 2, '#b88450'); R(g, X + 3, Y + 7, 5, 3, '#9a9ab4'); R(g, X + 3, Y + 7, 5, 1, '#d0d0e4'); R(g, X + 10, Y + 7, 3, 4, '#e04040'); R(g, X + 10, Y + 7, 3, 1, '#ff8a8a'); R(g, X + 2, Y + 13, 2, 2, OL); R(g, X + 12, Y + 13, 2, 2, OL); break;
      case 'computer': shadow(); rb(g, X + 1, Y + 6, 14, 9, '#4a4a60'); rb(g, X + 1, Y, 14, 10, '#2a2a38'); R(g, X + 3, Y + 2, 10, 6, st.blackout ? ((t * 3 | 0) % 2 ? '#ff5050' : '#501818') : '#46f09a'); if (!st.blackout) { R(g, X + 4, Y + 3, 5, 1, '#1a6a40'); R(g, X + 4, Y + 5, 7, 1, '#1a6a40'); } R(g, X + 3, Y + 12, 10, 2, '#8a8aa4'); break;
      case 'exit': shadow(); rb(g, X - 1, Y - 3, 18, 20, '#5a5a70'); rb(g, X + 1, Y - 1, 14, 16, '#8a8aa4'); for (let y = 0; y < 14; y += 4) R(g, X + 2, Y + y, 12, 1, '#6a6a84'); rb(g, X + 9, Y + 3, 6, 9, '#18181e'); R(g, X + 10, Y + 4, 4, 2, o.escape ? '#3ae07a' : '#e04040'); for (let k = 0; k < 4; k++) R(g, X + 10 + (k % 2) * 2, Y + 7 + (k >> 1) * 2, 1, 1, '#fff'); R(g, X + 2, Y - 2, 5, 3, o.escape ? '#3ae07a' : '#e04040'); break;
      case 'stairs': rb(g, X, Y, 16, 16, '#3a3050'); for (let i = 0; i < 5; i++) { const c = o.to === 1 ? shade('#9a8aaa', 1 - i * 0.12) : shade('#9a8aaa', 0.6 + i * 0.12); R(g, X + 1, Y + 1 + i * 3, 14, 2, c); R(g, X + 1, Y + 3 + i * 3, 14, 1, 'rgba(0,0,0,0.3)'); } rb(g, X + 5, Y + 5, 6, 6, '#ffd23f', '#8a6a10'); R(g, X + 7, o.to === 1 ? Y + 6 : Y + 8, 2, 3, '#8a6a10'); R(g, X + 6, o.to === 1 ? Y + 7 : Y + 7, 4, 1, '#8a6a10'); break;
      case 'd_sofa': E(g, X + (W >> 1), Y + 15, (W >> 1) - 1, 3, 'rgba(0,0,0,0.28)'); rb(g, X, Y + 1, W, 14, '#3a62b0'); R(g, X + 1, Y + 2, W - 2, 4, '#5a82d0'); R(g, X + 3, Y + 7, W - 6, 6, '#4a72c0'); R(g, X + 15, Y + 7, 1, 6, '#2a4a90'); R(g, X + 31, Y + 7, 1, 6, '#2a4a90'); rb(g, X, Y + 3, 3, 12, '#2a4a90'); rb(g, X + W - 3, Y + 3, 3, 12, '#2a4a90'); break;
      case 'd_bed': E(g, X + 16, Y + 31, 15, 3, 'rgba(0,0,0,0.28)'); rb(g, X, Y, 32, 32, '#7a5030'); R(g, X + 2, Y + 2, 28, 28, '#f0e8f8'); rb(g, X + 4, Y + 3, 10, 7, '#fff'); rb(g, X + 18, Y + 3, 10, 7, '#fff'); rb(g, X + 2, Y + 13, 28, 17, '#4a88d0'); R(g, X + 3, Y + 14, 26, 2, '#7aaae8'); for (let k = 0; k < 4; k++) R(g, X + 6 + k * 7, Y + 19, 3, 3, '#7aaae8'); break;
      case 'd_car': E(g, X + 32, Y + 31, 31, 3, 'rgba(0,0,0,0.3)'); rb(g, X + 1, Y + 3, 62, 27, '#d04848'); R(g, X + 3, Y + 5, 58, 3, '#f07070'); rb(g, X + 14, Y + 7, 30, 19, '#9ac4e0'); R(g, X + 16, Y + 9, 12, 15, '#c8e4f4'); R(g, X + 30, Y + 9, 12, 15, '#7aa8c8'); rb(g, X + 56, Y + 6, 7, 5, '#ffe890', '#8a7a20'); rb(g, X + 56, Y + 22, 7, 5, '#ffe890', '#8a7a20'); R(g, X + 2, Y + 8, 3, 4, '#e8e8e8'); R(g, X + 2, Y + 22, 3, 4, '#e8e8e8'); break;
      case 'd_desk': shadow(); rb(g, X, Y + 3, W, 13, '#7a5030'); R(g, X + 1, Y + 4, W - 2, 3, '#b88450'); R(g, X + 6, Y + 6, 6, 5, '#f4ecd8'); R(g, X + 7, Y + 7, 4, 1, '#8a8a9a'); R(g, X + 7, Y + 9, 3, 1, '#8a8a9a'); R(g, X + W - 12, Y + 5, 5, 6, '#e04040'); break;
      case 'd_shelf': shadow(); rb(g, X, Y - 3, W, 19, '#6a4020'); for (let i = 0; i < 3; i++) { R(g, X + 1, Y + i * 5 - 1, W - 2, 4, '#3a2210'); for (let k = 0; k < W / 4 - 0.5; k++) R(g, X + 2 + k * 4, Y + i * 5 - 1, 3, 4, ['#e04040', '#4a8aff', '#ffd23f', '#3ae07a', '#c060e0'][(k + i) % 5]); } break;
      case 'd_plant': shadow(); rb(g, X + 4, Y + 9, 8, 6, '#c8643a'); R(g, X + 5, Y + 10, 6, 1, '#e88a5a'); blob(g, X + 8, Y + 5, 5, 5, '#38c060'); blob(g, X + 4, Y + 8, 3, 3, '#2aa04a'); blob(g, X + 12, Y + 7, 3, 3, '#2aa04a'); R(g, X + 6, Y + 3, 2, 1, '#8af0a0'); break;
      case 'd_lamp': shadow(); R(g, X + 6, Y + 14, 4, 1, OL); R(g, X + 7, Y + 7, 2, 7, '#6a5a4a'); rb(g, X + 3, Y, 10, 7, '#ffd878'); R(g, X + 4, Y + 1, 8, 2, '#fff0b0'); R(g, X + 7, Y + 7, 2, 1, '#ffe090'); break;
      case 'd_fridge': shadow(); rb(g, X + 1, Y - 5, 14, 21, '#dce8f0'); R(g, X + 2, Y - 4, 12, 2, '#f8fcff'); R(g, X + 1, Y + 4, 14, 1, OL); R(g, X + 12, Y - 2, 1, 5, '#8a9aa8'); R(g, X + 12, Y + 6, 1, 6, '#8a9aa8'); R(g, X + 4, Y + 7, 3, 3, '#e04a6a'); R(g, X + 4, Y - 1, 3, 2, '#ffd23f'); break;
      case 'd_stove': shadow(); rb(g, X + 1, Y + 1, 14, 14, '#9a9ab0'); R(g, X + 2, Y + 2, 12, 2, '#c0c0d4'); E(g, X + 5, Y + 6, 2, 2, '#2a2a38'); E(g, X + 11, Y + 6, 2, 2, '#2a2a38'); rb(g, X + 3, Y + 9, 10, 5, '#3a3a4a'); R(g, X + 4, Y + 10, 8, 2, '#5a8ac8'); R(g, X + 3, Y + 3, 1, 1, '#e04040'); R(g, X + 12, Y + 3, 1, 1, '#e04040'); break;
      case 'd_boxes': shadow(); rb(g, X + 1, Y + 6, 14, 9, '#d09a52'); R(g, X + 7, Y + 6, 2, 9, '#f0d08a'); R(g, X + 2, Y + 7, 4, 1, '#e8b870'); rb(g, X + 3, Y + 1, 10, 6, '#e0aa62'); R(g, X + 7, Y + 1, 2, 6, '#f0d08a'); break;
      case 'd_tv': shadow(); rb(g, X + 1, Y - 3, 30, 17, '#3a3a50'); R(g, X + 3, Y - 1, 26, 12, '#3a78c8'); for (let k = 0; k < 14; k++) R(g, X + 3 + ((k * 7 + (t * 6 | 0) * 3) % 24), Y - 1 + ((k * 5) % 12), 2, 1, k % 2 ? '#e8f4ff' : '#1a3a6a'); R(g, X + 4, Y, 8, 2, 'rgba(255,255,255,0.3)'); R(g, X + 12, Y + 11, 8, 2, '#2a2a3a'); break;
      case 'd_table': shadow(); rb(g, X, Y + 2, W, H - 2, '#7a5030'); R(g, X + 1, Y + 3, W - 2, H - 6, '#b88450'); R(g, X + 2, Y + 4, W - 4, 1, '#d8a870'); R(g, X + 4, Y + 7, 5, 4, '#f4ecd8'); if (W > 16) E(g, X + W - 8, Y + 9, 3, 2, '#e04040'); break;
    }
  }
  return { mk, R, E, kid: kidSpr, doll: dollSpr, floorCanvas, obj, STYLES };
})();
