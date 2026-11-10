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

  // ================= SOBREVIVIENTE: dos estilos, chicos =================
  const PAL = [
    { skin: '#ffd9b8', hair: '#6a3a20', shirt: '#6a9a40', style: 'spiky' }, { skin: '#e8b48c', hair: '#1c1428', shirt: '#e8a020', style: 'short' },
    { skin: '#b57850', hair: '#2a1a1a', shirt: '#e84a4a', style: 'spiky' }, { skin: '#ffe0c8', hair: '#e8b030', shirt: '#f0f0f8', style: 'pony' },
    { skin: '#d49a70', hair: '#3a2a50', shirt: '#3a3a58', style: 'short' }, { skin: '#ffd9b8', hair: '#c04030', shirt: '#9a6aff', style: 'long' },
    { skin: '#e8b48c', hair: '#6a3a20', shirt: '#f8f8f8', style: 'short' }, { skin: '#ffe0c8', hair: '#5a4a30', shirt: '#3a7a3a', style: 'pony' },
    { skin: '#d49a70', hair: '#1c1428', shirt: '#c8a040', style: 'pig' }, { skin: '#ffd9b8', hair: '#d8d8f0', shirt: '#30c8d8', style: 'bun' },
  ];
  // accesorios por clase: cx = centro de la cabeza, top = y de arriba de la cabeza, w = ancho, by = y del pecho
  function hat(g, id, dir, cx, top, w, by) {
    const front = dir === 'd' || dir === 'l';
    switch (id) {
      case 'explorer': E(g, cx, top + 1, (w >> 1) + 2, 1, OL); E(g, cx, top + 1, (w >> 1) + 1, 1, '#d8b060'); R(g, cx - 3, top - 2, 7, 3, OL); R(g, cx - 2, top - 2, 5, 3, '#c8a050'); R(g, cx - 2, top, 5, 1, '#6a4a20'); break;
      case 'helmet': E(g, cx, top + 1, (w >> 1) - 1, 3, OL); E(g, cx, top + 1, (w >> 1) - 2, 2, '#ffd23f'); R(g, cx, top - 1, 1, 3, '#e8a010'); R(g, cx - 2, top, 5, 1, '#fff6a0'); break;
      case 'band': R(g, cx - (w >> 1), top + 3, w, 2, OL); R(g, cx - (w >> 1) + 1, top + 3, w - 2, 1, '#ff4a4a'); if (dir !== 'd') R(g, cx + (w >> 1), top + 4, 2, 3, '#ff4a4a'); break;
      case 'cross': R(g, cx - 3, top + 1, 7, 3, OL); R(g, cx - 2, top + 1, 5, 2, '#fff'); if (front) { R(g, cx, top + 1, 1, 2, '#e03030'); R(g, cx - 1, top + 2, 3, 1, '#e03030'); } break;
      case 'mask': if (front) { R(g, cx - (w >> 1) + 1, top + (w > 12 ? 8 : 7), w - 2, 3, OL); R(g, cx - (w >> 1) + 2, top + (w > 12 ? 8 : 7), w - 4, 2, '#3a3a58'); } R(g, cx - (w >> 1), top + 2, w, 1, '#3a3a58'); break;
      case 'cam': R(g, cx - 3, by - 1, 7, 4, OL); R(g, cx - 2, by, 5, 2, '#707890'); R(g, cx, by, 2, 2, '#6ac8ff'); break;
      case 'chef': R(g, cx - 4, top - 4, 9, 5, OL); R(g, cx - 3, top - 4, 7, 5, '#fff'); E(g, cx - 2, top - 4, 2, 2, '#fff'); E(g, cx + 2, top - 4, 2, 2, '#fff'); R(g, cx - 3, top, 7, 1, '#d8d8e8'); break;
      case 'cap': R(g, cx - (w >> 1), top + 1, w, 3, OL); R(g, cx - (w >> 1) + 1, top + 1, w - 2, 2, '#3a9a3a'); if (front) R(g, cx - (w >> 1) - 1, top + 3, w + 2, 1, '#2a6a2a'); break;
      case 'keys': R(g, cx + 2, by + 3, 1, 1, '#ffd23f'); R(g, cx + 3, by + 3, 1, 2, '#ffd23f'); R(g, cx + 4, by + 3, 1, 1, '#c8c8d8'); break;
      case 'goggles': R(g, cx - (w >> 1), top + 3, w, 1, '#3a3a58'); if (front) { E(g, cx - 2, top + 3, 1, 1, '#4af0ff'); E(g, cx + 2, top + 3, 1, 1, '#4af0ff'); } else R(g, cx - 1, top + 2, 3, 2, '#4af0ff'); break;
    }
  }
  // ---- ESTILO A: redondito (18x26, pies en y=22) ----
  function kidA(dir, fr, pal, hatId) {
    return mk(18, 26, g => {
      const { skin, hair, shirt, style } = pal, hl = shade(hair, 1.45), hd = shade(hair, 0.7);
      const sw = fr === 1 ? 1 : fr === 2 ? -1 : 0, side = dir === 'l', cx = side ? 10 : 9;
      E(g, 9, 23, 6, 2, 'rgba(0,0,0,0.3)');
      if (style === 'long') blob(g, 9, 14, 7, 7, hair);
      if (style === 'pig' && dir !== 'd') { blob(g, 2, 11, 2, 3, hair); blob(g, 16, 11, 2, 3, hair); }
      blob(g, side ? 7 : 6, 22 - (sw > 0 ? 1 : 0), 2, 1, '#3a2850', { shade: false }); blob(g, side ? 11 : 12, 22 - (sw < 0 ? 1 : 0), 2, 1, '#3a2850', { shade: false });
      blob(g, 9, 18, side ? 3 : 4, 3, shirt);
      if (side) blob(g, 9, 18 + sw, 1, 2, shade(shirt, 1.1), { shade: false }); else { blob(g, 4, 18 + sw, 1, 2, shirt, { shade: false }); blob(g, 14, 18 - sw, 1, 2, shirt, { shade: false }); }
      if (style === 'pony' && dir !== 'd') blob(g, dir === 'u' ? 9 : side ? 15 : 3, dir === 'u' ? 14 : 11, 2, 3, hair);
      if (style === 'pony' && dir === 'd') blob(g, 15, 10, 2, 3, hair);
      blob(g, cx, 9, 7, 7, hair);
      if (style === 'spiky') { for (const [x, h] of [[5, 3], [9, 4], [13, 3]]) for (let i = 0; i < h; i++) { R(g, x - ((h - i) >> 1) + cx - 9, 1 - 0 + i - 1, h - i + 1, 1, OL); } for (const [x, h] of [[5, 3], [9, 4], [13, 3]]) for (let i = 0; i < h - 1; i++) R(g, x - ((h - i) >> 1) + cx - 9 + 1, i, Math.max(1, h - i - 1), 1, hair); }
      if (style === 'bun') blob(g, 9, 2, 3, 2, hair);
      R(g, cx - 4, 4, 4, 1, hl); R(g, cx - 5, 5, 2, 1, hl);
      if (dir === 'd') {
        E(g, 9, 11, 5, 4, skin); E(g, 9, 12, 5, 4, skin); R(g, 5, 14, 9, 1, shade(skin, 0.9));
        R(g, 5, 7, 3, 1, hair); R(g, 6, 8, 1, 1, hair); R(g, 10, 7, 4, 1, hair); R(g, 12, 8, 1, 1, hair);
        R(g, 6, 10, 2, 3, '#1a1020'); R(g, 11, 10, 2, 3, '#1a1020'); R(g, 6, 10, 1, 1, '#fff'); R(g, 11, 10, 1, 1, '#fff');
        R(g, 5, 13, 1, 1, '#ff9a9a'); R(g, 14, 13, 1, 1, '#ff9a9a'); R(g, 8, 14, 2, 1, '#b04a50');
      } else if (dir === 'u') { R(g, 9, 4, 1, 5, hd); R(g, 6, 8, 2, 1, hd); R(g, 12, 7, 2, 1, hd); }
      else { E(g, 7, 12, 4, 4, skin); R(g, 4, 8, 3, 1, hair); R(g, 5, 7, 2, 1, hair); R(g, 5, 10, 2, 3, '#1a1020'); R(g, 5, 10, 1, 1, '#fff'); R(g, 2, 12, 2, 1, skin); R(g, 5, 14, 2, 1, '#b04a50'); R(g, 4, 13, 1, 1, '#ff9a9a'); }
      hat(g, hatId, dir, cx, 2, 14, 17);
    });
  }
  // ---- ESTILO B: clásico de RPG (16x24, pies en y=20) ----
  function kidB(dir, fr, pal, hatId) {
    return mk(16, 24, g => {
      const { skin, hair, shirt, style } = pal, hl = shade(hair, 1.4), sw = fr === 1 ? 1 : fr === 2 ? -1 : 0, side = dir === 'l', K = '#201428';
      E(g, 8, 21, 5, 2, 'rgba(0,0,0,0.3)');
      if (style === 'long') { R(g, 2, 8, 12, 9, K); R(g, 3, 8, 10, 8, hair); }
      if (style === 'pig' && dir !== 'u') { R(g, 0, 6, 3, 6, K); R(g, 1, 6, 2, 5, hair); R(g, 13, 6, 3, 6, K); R(g, 13, 6, 2, 5, hair); }
      // piernas y zapatos
      R(g, 5, 16 - (sw > 0 ? 1 : 0), 3, 4, K); R(g, 6, 16 - (sw > 0 ? 1 : 0), 1, 3, '#33406a'); R(g, 9, 16 - (sw < 0 ? 1 : 0), 3, 4, K); R(g, 10, 16 - (sw < 0 ? 1 : 0), 1, 3, '#33406a');
      // cuerpo y brazos
      rb(g, 3, 10, 10, 7, shirt, K); R(g, 4, 11, 8, 1, shade(shirt, 1.25)); R(g, 4, 15, 8, 1, shade(shirt, 0.75));
      if (!side) { rb(g, 1, 11 + sw, 3, 5, shirt, K); rb(g, 12, 11 - sw, 3, 5, shirt, K); R(g, 2, 15 + sw, 1, 1, skin); R(g, 13, 15 - sw, 1, 1, skin); } else { rb(g, 6, 11 + sw, 4, 5, shade(shirt, 1.1), K); R(g, 7, 15 + sw, 2, 1, skin); }
      if (style === 'pony' && dir !== 'd') { R(g, dir === 'u' ? 6 : side ? 12 : 1, dir === 'u' ? 10 : 6, 4, 6, K); R(g, dir === 'u' ? 7 : side ? 13 : 2, dir === 'u' ? 10 : 7, 2, 4, hair); }
      if (style === 'pony' && dir === 'd') { R(g, 13, 4, 3, 6, K); R(g, 13, 5, 2, 4, hair); }
      // cabeza
      rb(g, 2, 1, 12, 10, dir === 'u' ? hair : skin, K);
      R(g, 2, 1, 12, 4, K); R(g, 3, 1, 10, 4, hair); R(g, 3, 1, 5, 1, hl);
      if (style === 'spiky') { for (const x of [3, 7, 11]) { R(g, x, -1 + 1, 3, 1, K); R(g, x + 1, 0, 1, 1, hair); } R(g, 4, 0, 2, 1, hair); R(g, 8, 0, 2, 1, hair); R(g, 12, 0, 1, 1, hair); }
      if (style === 'bun') { R(g, 6, 0, 4, 2, K); R(g, 7, 0, 2, 1, hair); }
      if (dir === 'd') { R(g, 2, 3, 2, 6, hair); R(g, 12, 3, 2, 6, hair); R(g, 4, 5, 3, 1, hair); R(g, 9, 5, 4, 1, hair); R(g, 5, 7, 1, 2, K); R(g, 10, 7, 1, 2, K); R(g, 4, 9, 1, 1, '#ff9a9a'); R(g, 11, 9, 1, 1, '#ff9a9a'); }
      else if (dir === 'u') { R(g, 3, 5, 10, 5, hair); R(g, 8, 3, 1, 6, shade(hair, 0.7)); }
      else { R(g, 8, 3, 6, 7, hair); R(g, 2, 3, 2, 3, hair); R(g, 4, 7, 1, 2, K); R(g, 3, 9, 1, 1, '#ff9a9a'); }
      hat(g, hatId, dir, 8, 1, 12, 12);
    });
  }
  // ---- MUÑECA ESTILO B: caricatura plana (32x44, pies en y=40) ----
  function dollB(dir, fr, mood) {
    return mk(32, 44, g => {
      const K = '#241020', metal = '#9a9ab4', porc = '#fff0e6', dress = '#7a2068', hair = '#2e1840', sw = fr === 1 ? 1 : fr === 2 ? -1 : 0, bob = fr ? 1 : 0, side = dir === 'l';
      E(g, 16, 41, 10, 3, 'rgba(0,0,0,0.4)');
      R(g, 11, 32, 4, 7 - (sw > 0 ? 1 : 0), K); R(g, 12, 32, 2, 6 - (sw > 0 ? 1 : 0), metal); R(g, 17, 32, 4, 7 - (sw < 0 ? 1 : 0), K); R(g, 18, 32, 2, 6 - (sw < 0 ? 1 : 0), metal);
      rb(g, 9, 38 - (sw > 0 ? 1 : 0), 7, 3, '#d02a6a', K); rb(g, 16, 38 - (sw < 0 ? 1 : 0), 7, 3, '#d02a6a', K);
      blob(g, 16, 31 - bob, 10, 7, dress); R(g, 6, 36 - bob, 20, 1, '#f4e8f4'); blob(g, 16, 30 - bob, 5, 5, '#f6ecf6', { shade: false });
      R(g, 3, 21 + sw, 3, 10, K); R(g, 4, 21 + sw, 1, 9, metal); R(g, 26, 21 - sw, 3, 10, K); R(g, 27, 21 - sw, 1, 9, metal); blob(g, 4, 31 + sw, 2, 2, porc, { shade: false }); blob(g, 27, 31 - sw, 2, 2, porc, { shade: false });
      const hy = 12 - bob;
      blob(g, 5, hy + 6, 3, 5, hair); blob(g, 27, hy + 6, 3, 5, hair); R(g, 3, hy + 3, 4, 2, '#d02a6a'); R(g, 25, hy + 3, 4, 2, '#d02a6a');
      blob(g, 16, hy, 11, 11, dir === 'u' ? hair : hair);
      if (dir !== 'u') {
        const fx = side ? 14 : 16; blob(g, fx, hy + 2, 9, 8, porc, { shade: false }); R(g, fx - 8, hy - 5, 17, 3, hair); R(g, fx - 3, hy - 3, 2, 2, hair); R(g, fx + 2, hy - 3, 3, 2, hair);
        const ex = side ? [fx - 4] : [fx - 5, fx + 5];
        for (const e of ex) { if (mood === 'stun') { R(g, e - 1, hy + 1, 1, 1, '#ff4a4a'); R(g, e + 1, hy + 1, 1, 1, '#ff4a4a'); R(g, e, hy + 2, 1, 1, '#ff4a4a'); R(g, e - 1, hy + 3, 1, 1, '#ff4a4a'); R(g, e + 1, hy + 3, 1, 1, '#ff4a4a'); } else { blob(g, e, hy + 2, 2, 3, K, { out: false }); R(g, e - 1, hy + 2, 2, 2, mood === 'angry' ? '#ff2a2a' : '#c03040'); R(g, e - 1, hy, 1, 1, '#fff'); } if (mood === 'angry') { R(g, e - 2, hy - 2, 5, 1, K); } }
        E(g, fx - 7, hy + 5, 1, 1, '#ff9ab0'); if (!side) E(g, fx + 7, hy + 5, 1, 1, '#ff9ab0');
        if (mood === 'angry') { R(g, fx - 3, hy + 5, 7, 3, '#1a0810'); R(g, fx - 2, hy + 5, 1, 1, '#fff'); R(g, fx, hy + 5, 1, 1, '#fff'); R(g, fx + 2, hy + 5, 1, 1, '#fff'); } else R(g, fx - 3, hy + 6, 7, 1, '#6a2030');
      } else { R(g, 14, hy - 8, 1, 8, shade(hair, 0.6)); blob(g, 16, 26 - bob, 3, 3, '#c8c8dc'); R(g, 14, 22 - bob, 1, 1, K); }
      blob(g, 10, 1 - bob, 4, 2, '#e02a70'); blob(g, 22, 1 - bob, 4, 2, '#e02a70'); R(g, 15, 1 - bob, 2, 2, '#a01a50');
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
  const KI = { A: { w: 18, h: 26, fy: 22 }, B: { w: 16, h: 24, fy: 20 } }, DI = { A: { w: 40, h: 52, fy: 48 }, B: { w: 32, h: 44, fy: 40 } };
  function kidSpr(dir, fr, cls = 0, style = 'A') {
    const k = 'k' + style + dir + fr + '_' + cls; if (cache[k]) return cache[k];
    if (dir === 'r') return cache[k] = flipX(kidSpr('l', fr, cls, style));
    const pal = PAL[cls % PAL.length], hatId = (typeof CLASSES !== 'undefined' && CLASSES[cls]) ? CLASSES[cls].hat : '';
    return cache[k] = (style === 'B' ? kidB : kidA)(dir, fr, pal, hatId);
  }
  // ---- fantasma (22x30) ----
  function ghostSpr(fr) { const k = 'gh' + fr; if (cache[k]) return cache[k];
    return cache[k] = mk(22, 30, g => { const w = fr % 2; E(g, 11, 26, 7, 2, 'rgba(0,0,0,0.18)'); g.globalAlpha = 0.95; E(g, 11, 10, 9, 9, '#e8ecff'); R(g, 2, 10, 18, 12, '#e8ecff'); for (let i = 0; i < 5; i++) { R(g, 2 + i * 4, 22, 4, 3 + ((i + w) % 2) * 3, '#e8ecff'); } R(g, 3, 6, 4, 2, '#fff'); g.globalAlpha = 1;
      E(g, 8, 11, 2, 3, '#15102a'); E(g, 14, 11, 2, 3, '#15102a'); R(g, 8, 10, 1, 1, '#ff4a6a'); R(g, 14, 10, 1, 1, '#ff4a6a'); E(g, 11, 17, 2, 3 + w, '#15102a'); R(g, 0, 12, 3, 7, '#d0d6f0'); R(g, 19, 12, 3, 7, '#d0d6f0'); }); }
  function gemSpr() { return cache.gem || (cache.gem = mk(12, 14, g => { const c = '#b46aff'; R(g, 4, 0, 4, 1, OL); R(g, 2, 1, 8, 1, OL); R(g, 0, 3, 12, 1, OL); R(g, 2, 4, 8, 8, OL); R(g, 4, 12, 4, 1, OL); R(g, 5, 13, 2, 1, OL); R(g, 4, 1, 4, 2, '#e0b8ff'); R(g, 1, 3, 10, 2, c); R(g, 3, 5, 6, 6, c); R(g, 3, 5, 2, 4, '#e0b8ff'); R(g, 7, 6, 2, 5, '#7a3ac8'); R(g, 5, 11, 2, 1, '#7a3ac8'); })); }
  // ================= ÍCONOS (12x12) de materiales y objetos =================
  const ICON_DRAW = {
    chatarra: g => { E(g, 6, 6, 5, 5, OL); E(g, 6, 6, 4, 4, '#9aa0b4'); R(g, 5, 0, 2, 2, '#9aa0b4'); R(g, 5, 10, 2, 2, '#9aa0b4'); R(g, 0, 5, 2, 2, '#9aa0b4'); R(g, 10, 5, 2, 2, '#9aa0b4'); E(g, 6, 6, 2, 2, OL); E(g, 6, 6, 1, 1, '#2a2a38'); R(g, 3, 3, 2, 1, '#e0e4f4'); },
    cuerda: g => { E(g, 6, 6, 5, 5, OL); E(g, 6, 6, 4, 4, '#d8b878'); E(g, 6, 6, 2, 2, OL); E(g, 6, 6, 1, 1, '#8a6a38'); R(g, 3, 3, 3, 1, '#fff0c0'); R(g, 2, 6, 1, 1, '#a8884a'); R(g, 9, 5, 1, 2, '#a8884a'); R(g, 9, 9, 3, 1, '#d8b878'); R(g, 11, 10, 1, 2, '#d8b878'); },
    pilas: g => { R(g, 3, 1, 6, 11, OL); R(g, 4, 2, 4, 9, '#ffd23f'); R(g, 4, 0, 4, 2, OL); R(g, 5, 0, 2, 2, '#aab0c0'); R(g, 4, 8, 4, 2, '#d0601a'); R(g, 4, 2, 1, 6, '#fff6a0'); R(g, 5, 4, 3, 1, OL); R(g, 6, 3, 1, 3, OL); },
    tela: g => { R(g, 1, 2, 10, 9, OL); R(g, 2, 3, 8, 7, '#e86a9a'); R(g, 2, 5, 8, 1, '#f89aba'); R(g, 2, 7, 8, 1, '#f89aba'); R(g, 7, 3, 1, 7, '#b84a7a'); R(g, 3, 9, 1, 1, OL); R(g, 5, 9, 1, 1, OL); R(g, 2, 3, 8, 1, '#ffc0d4'); },
    madera: g => { R(g, 0, 3, 12, 7, OL); R(g, 1, 4, 10, 5, '#b07a44'); R(g, 2, 5, 7, 1, '#8a5a2a'); R(g, 4, 7, 6, 1, '#8a5a2a'); R(g, 1, 4, 10, 1, '#d8a468'); E(g, 2, 6, 1, 1, '#6a4020'); R(g, 10, 4, 1, 5, '#8a5a2a'); },
    aluminio: g => { R(g, 1, 2, 10, 8, OL); R(g, 2, 3, 8, 6, '#dfe6f4'); R(g, 2, 3, 8, 2, '#ffffff'); R(g, 2, 7, 8, 1, '#8a94a8'); R(g, 8, 9, 3, 3, OL); R(g, 8, 9, 3, 2, '#c8d0e4'); R(g, 1, 2, 1, 8, '#b0bacc'); },
    lente: g => { E(g, 6, 6, 5, 5, OL); E(g, 6, 6, 4, 4, '#3a4a6a'); E(g, 6, 6, 3, 3, '#6ac8ff'); R(g, 4, 4, 2, 2, '#ffffff'); R(g, 7, 7, 1, 1, '#a8e8ff'); },
    circuito: g => { R(g, 1, 1, 10, 10, OL); R(g, 2, 2, 8, 8, '#2a7a4a'); R(g, 4, 4, 4, 4, '#14141a'); for (const [x, y] of [[0, 3], [0, 6], [0, 8], [11, 3], [11, 6], [11, 8], [3, 0], [6, 0], [8, 0], [3, 11], [6, 11], [8, 11]]) R(g, x, y, 1, 1, '#ffd23f'); R(g, 2, 3, 2, 1, '#3ae07a'); R(g, 8, 8, 2, 1, '#3ae07a'); R(g, 6, 2, 1, 2, '#3ae07a'); },
    aceite: g => { R(g, 4, 0, 4, 2, OL); R(g, 5, 0, 2, 2, '#c04040'); R(g, 3, 2, 6, 10, OL); R(g, 4, 3, 4, 8, '#c8a830'); R(g, 4, 3, 1, 6, '#fff0a0'); R(g, 5, 6, 3, 3, '#2a2a2a'); R(g, 6, 7, 1, 1, '#c8a830'); },
    mascara: g => { E(g, 6, 6, 5, 5, OL); E(g, 6, 6, 4, 4, '#f0f0f8'); R(g, 3, 5, 2, 2, '#222'); R(g, 7, 5, 2, 2, '#222'); R(g, 4, 8, 4, 1, '#c04050'); R(g, 0, 5, 1, 2, '#3a3a58'); R(g, 11, 5, 1, 2, '#3a3a58'); },
    taser: g => { R(g, 1, 3, 8, 5, OL); R(g, 2, 4, 6, 3, '#4aa8ff'); R(g, 2, 7, 3, 5, OL); R(g, 3, 7, 1, 4, '#2a5a9a'); R(g, 9, 3, 3, 1, '#ddd'); R(g, 9, 7, 3, 1, '#ddd'); R(g, 9, 5, 3, 1, '#ffd23f'); R(g, 10, 4, 1, 3, '#fff6a0'); },
    petardos: g => { for (const [x, h, c] of [[1, 8, '#ff8a3a'], [5, 7, '#e86a1a'], [9, 8, '#ff8a3a']]) { R(g, x, 4 + (8 - h), 2, h, OL); R(g, x, 5 + (8 - h), 2, h - 2, c); R(g, x, 1 + (8 - h), 1, 3, '#ffd23f'); } },
    barricada: g => { R(g, 0, 1, 12, 3, OL); R(g, 1, 2, 10, 1, '#b07a44'); R(g, 0, 5, 12, 3, OL); R(g, 1, 6, 10, 1, '#9a6a38'); R(g, 0, 9, 12, 3, OL); R(g, 1, 10, 10, 1, '#b07a44'); R(g, 1, 0, 2, 12, OL); R(g, 1, 0, 1, 12, '#6a4020'); R(g, 9, 0, 2, 12, OL); R(g, 10, 0, 1, 12, '#6a4020'); },
    trampa: g => { E(g, 6, 6, 5, 5, OL); E(g, 6, 6, 4, 4, '#c8a060'); g.clearRect(4, 4, 4, 4); E(g, 6, 6, 1, 1, OL); R(g, 0, 5, 2, 1, '#e8d098'); R(g, 10, 6, 2, 1, '#e8d098'); R(g, 5, 0, 1, 2, '#e8d098'); R(g, 6, 10, 1, 2, '#e8d098'); },
    musica: g => { R(g, 1, 4, 10, 8, OL); R(g, 2, 5, 8, 6, '#b05ac0'); R(g, 2, 5, 8, 1, '#d890e8'); R(g, 6, 0, 1, 5, '#ffd23f'); R(g, 6, 0, 3, 1, '#ffd23f'); E(g, 5, 5, 1, 1, '#ffd23f'); R(g, 4, 8, 4, 1, '#ffd23f'); },
    mancha: g => { E(g, 6, 7, 5, 3, OL); E(g, 6, 7, 4, 2, '#1a1608'); R(g, 3, 6, 3, 1, '#9a9a40'); R(g, 7, 8, 2, 1, '#6a6a30'); R(g, 5, 2, 2, 3, OL); R(g, 5, 3, 2, 2, '#c8b030'); },
    turbo: g => { R(g, 3, 1, 6, 11, OL); R(g, 4, 2, 4, 9, '#ffd23f'); R(g, 4, 0, 4, 2, OL); R(g, 5, 0, 2, 2, '#aab0c0'); R(g, 5, 3, 3, 1, '#fff'); R(g, 5, 4, 2, 2, '#fff'); R(g, 6, 6, 2, 1, '#fff'); R(g, 5, 7, 2, 2, '#fff'); },
    pizza: g => { for (let y = 0; y < 12; y++) { const w = Math.max(1, 12 - y); R(g, (12 - w) >> 1, y, w, 1, OL); if (w > 2) R(g, ((12 - w) >> 1) + 1, y, w - 2, 1, y < 2 ? '#c8802a' : '#ffd860'); } R(g, 3, 4, 2, 2, '#d04030'); R(g, 6, 6, 2, 2, '#d04030'); R(g, 5, 2, 1, 1, '#d04030'); R(g, 5, 8, 1, 1, '#d04030'); },
    camara: g => { R(g, 0, 3, 12, 8, OL); R(g, 1, 4, 10, 6, '#9aa0b8'); R(g, 1, 2, 3, 2, '#ffd23f'); R(g, 8, 2, 2, 1, '#e04040'); E(g, 6, 7, 3, 3, OL); E(g, 6, 7, 2, 2, '#6ac8ff'); R(g, 5, 6, 1, 1, '#fff'); },
    nerf: g => { R(g, 0, 3, 10, 5, OL); R(g, 1, 4, 8, 3, '#ff6a4a'); R(g, 9, 4, 3, 3, '#ffd23f'); R(g, 2, 8, 3, 4, OL); R(g, 3, 8, 1, 3, '#e04a2a'); R(g, 6, 2, 3, 1, OL); R(g, 1, 4, 8, 1, '#ff9a7a'); },
    engranaje: g => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; R(g, 5 + Math.round(Math.cos(a) * 5), 5 + Math.round(Math.sin(a) * 5), 2, 2, OL); } E(g, 6, 6, 5, 5, OL); E(g, 6, 6, 4, 4, '#c0c0d8'); E(g, 6, 6, 2, 2, OL); E(g, 6, 6, 1, 1, '#4a4a60'); R(g, 3, 3, 2, 1, '#f0f0ff'); },
    escalera: g => { R(g, 2, 0, 2, 12, OL); R(g, 3, 0, 1, 12, '#c8935a'); R(g, 8, 0, 2, 12, OL); R(g, 8, 0, 1, 12, '#c8935a'); for (const y of [2, 5, 8, 11]) { R(g, 3, y, 6, 1, OL); R(g, 4, y, 4, 1, '#e8b87a'); } },
    fusible: g => { R(g, 1, 3, 10, 6, OL); R(g, 2, 4, 8, 4, '#f4ead0'); R(g, 0, 3, 3, 6, OL); R(g, 0, 4, 2, 4, '#b8bcc8'); R(g, 9, 3, 3, 6, OL); R(g, 10, 4, 2, 4, '#b8bcc8'); R(g, 3, 6, 6, 1, '#ff9a3a'); R(g, 3, 4, 3, 1, '#ffffff'); },
    ganzua: g => { for (let i = 0; i < 9; i++) { R(g, 1 + i, 9 - i, 2, 2, OL); R(g, 1 + i, 9 - i, 1, 1, '#c8c8a0'); } R(g, 8, 0, 3, 2, OL); R(g, 8, 0, 2, 1, '#c8c8a0'); R(g, 0, 10, 4, 2, OL); R(g, 1, 10, 2, 1, '#8a6a38'); },
    jeringa: g => { R(g, 2, 3, 6, 6, OL); R(g, 3, 4, 4, 4, '#e8f8f0'); R(g, 3, 5, 2, 2, '#6ae0a0'); R(g, 8, 5, 3, 2, OL); R(g, 8, 5, 3, 1, '#ccc'); R(g, 10, 3, 1, 6, OL); R(g, 0, 6, 2, 1, '#ccc'); },
    bebida: g => { R(g, 3, 1, 6, 10, OL); R(g, 4, 2, 4, 8, '#48e0ff'); R(g, 4, 0, 4, 2, OL); R(g, 5, 0, 2, 1, '#ccc'); R(g, 5, 4, 3, 1, '#fff'); R(g, 5, 5, 2, 2, '#fff'); R(g, 4, 2, 1, 6, '#a8f0ff'); },
    humo: g => { for (const [x, y, r] of [[4, 8, 3], [8, 8, 3], [6, 5, 3], [3, 5, 2]]) E(g, x, y, r + 1, r + 1, OL); for (const [x, y, r] of [[4, 8, 3], [8, 8, 3], [6, 5, 3], [3, 5, 2]]) E(g, x, y, r, r, '#c0c0d0'); R(g, 5, 3, 2, 1, '#eeeef8'); },
    torreta: g => { R(g, 1, 8, 10, 4, OL); R(g, 2, 9, 8, 2, '#e0505a'); R(g, 4, 3, 4, 5, OL); R(g, 5, 4, 2, 4, '#7a7a90'); R(g, 5, 0, 2, 3, OL); R(g, 5, 1, 2, 1, '#ffd23f'); },
    racion: g => { R(g, 1, 4, 10, 8, OL); R(g, 2, 5, 8, 6, '#f0b878'); R(g, 5, 6, 2, 4, '#fff'); R(g, 4, 7, 4, 2, '#fff'); R(g, 3, 1, 1, 3, '#dde'); R(g, 6, 0, 1, 3, '#dde'); R(g, 9, 1, 1, 3, '#dde'); },
    comida: g => { E(g, 6, 7, 5, 4, OL); E(g, 6, 7, 4, 3, '#d89860'); R(g, 4, 5, 2, 1, '#f0c090'); R(g, 7, 7, 2, 1, '#a86a30'); R(g, 9, 2, 2, 3, OL); R(g, 9, 2, 1, 2, '#eee'); R(g, 1, 3, 2, 3, OL); R(g, 1, 3, 1, 2, '#eee'); },
    palanca: g => { for (let i = 0; i < 9; i++) { R(g, 2 + i, 10 - i, 2, 2, OL); R(g, 2 + i, 10 - i, 1, 1, '#9a9ab4'); } R(g, 0, 8, 3, 4, OL); R(g, 0, 9, 2, 2, '#8a8aa0'); R(g, 9, 0, 3, 3, OL); R(g, 10, 1, 1, 1, '#9a9ab4'); },
  };
  function iconSpr(id) { const k = 'ic_' + id; if (cache[k]) return cache[k]; const fn = ICON_DRAW[id]; return cache[k] = mk(12, 12, g => { if (fn) fn(g); else { R(g, 1, 1, 10, 10, OL); R(g, 2, 2, 8, 8, '#8a8aa0'); } }); }
  function dollSpr(dir, fr, mood = 'calm', style = 'A') {
    const k = 'd' + style + dir + fr + mood; if (cache[k]) return cache[k];
    if (dir === 'r') return cache[k] = flipX(dollSpr('l', fr, mood, style));
    return cache[k] = (style === 'B' ? dollB : doll)(dir, fr, mood);
  }

  // ================= TILES =================
  const WALLPAL = { '.': ['#8a6ab8', '#9a7ac8', '#5a3a88', '#b8a0e0'], k: ['#58b8a8', '#68c8b8', '#2a7a6a', '#98e8d8'], g: ['#8a98b8', '#9aa8c8', '#4a5a78', '#c0d0f0'], r: ['#c8587a', '#d8688a', '#8a2a4a', '#f0a0b8'] };
  function tile(ch, i, j, below, above, wc) {
    return mk(16, 16, g => {
      const h = (i * 7 + j * 13) % 5, n = (i * 31 + j * 17) % 7;
      if (ch === '.' || (ch >= '1' && ch <= '5')) {
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
  function floorCanvas(F, flat) {
    return mk(MW * TS, MH * TS, g => {
      for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
        const ch = F.g[j][i], below = j + 1 < MH && F.g[j + 1][i] !== '#' && F.g[j + 1][i] !== ' ', above = j > 0 && F.g[j - 1][i] === '#';
        if (flat && (ch === '#' || ch === ' ')) { R(g, i * TS, j * TS, TS, TS, '#120a1e'); continue; }
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
      if (!flat) for (const r of F.rooms) {
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
      case 'exit': shadow(); rb(g, X - 1, Y - 3, 18, 20, '#5a5a70'); if (!o.shutter) { /* persiana cerrada */ } rb(g, X + 1, Y - 1, 14, 16, '#8a8aa4'); for (let y = 0; y < 14; y += 4) R(g, X + 2, Y + y, 12, 1, '#6a6a84'); rb(g, X + 9, Y + 3, 6, 9, '#18181e'); R(g, X + 10, Y + 4, 4, 2, o.escape ? '#3ae07a' : '#e04040'); for (let k = 0; k < 4; k++) R(g, X + 10 + (k % 2) * 2, Y + 7 + (k >> 1) * 2, 1, 1, '#fff'); R(g, X + 2, Y - 2, 5, 3, o.escape ? '#3ae07a' : '#e04040'); if (!o.shutter) { rb(g, X, Y - 2, 16, 18, '#7a7a8a'); for (let k = 0; k < 6; k++) R(g, X + 1, Y - 1 + k * 3, 14, 1, '#4a4a5a'); blob(g, X + 8, Y + 7, 3, 3, '#3a3a4a'); E(g, X + 8, Y + 7, 1, 1, '#c0c0d8'); } break;
      case 'mechbox': shadow(); rb(g, X + 1, Y + 3, 14, 12, '#6a6a82'); R(g, X + 2, Y + 4, 12, 2, '#9a9ab4');
        if (o.opened) { R(g, X + 3, Y + 7, 10, 6, '#0a0a10'); rb(g, X + 1, Y, 14, 4, '#5a5a72'); } else { blob(g, X + 8, Y + 9, 4, 4, '#3a3a50'); E(g, X + 8, Y + 9, 2, 2, '#c0c0d8'); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; R(g, X + 8 + Math.round(Math.cos(a) * 5), Y + 9 + Math.round(Math.sin(a) * 5), 1, 1, '#c0c0d8'); } }
        break;
      case 'crate': shadow(); rb(g, X + 1, Y + 3, 14, 12, '#b8884c'); R(g, X + 1, Y + 8, 14, 1, '#7a5a2c'); R(g, X + 7, Y + 3, 2, 12, '#7a5a2c'); R(g, X + 2, Y + 4, 4, 1, '#d8b070'); R(g, X + 10, Y + 4, 4, 1, '#d8b070');
        if (o.opened) { R(g, X + 3, Y + 5, 10, 8, '#2a1a0a'); R(g, X + 2, Y, 12, 3, '#9a7038'); R(g, X + 11, Y + 1, 5, 2, '#9a7038'); } else { R(g, X + 3, Y + 5, 2, 2, '#6a4a22'); R(g, X + 11, Y + 5, 2, 2, '#6a4a22'); R(g, X + 3, Y + 11, 2, 2, '#6a4a22'); R(g, X + 11, Y + 11, 2, 2, '#6a4a22'); }
        break;
      case 'gap': { const w = o.w * 16, h = o.h * 16; R(g, X, Y, w, h, '#05030a'); R(g, X, Y, w, 2, '#2a1a10'); R(g, X, Y + h - 2, w, 2, '#2a1a10'); R(g, X, Y, 2, h, '#2a1a10'); R(g, X + w - 2, Y, 2, h, '#2a1a10');
        for (let k = 0; k < 9; k++) R(g, X + 3 + (k * 7) % (w - 6), Y + 4 + (k * 11) % (h - 8), 3, 1, '#14091c');
        if (o.bridged) { R(g, X + 2, Y + 3, w - 4, 3, '#3a2210'); R(g, X + 2, Y + h - 6, w - 4, 3, '#3a2210'); for (let x = X + 4; x < X + w - 3; x += 5) R(g, x, Y + 3, 3, h - 6, '#c8935a'); R(g, X + 2, Y + 3, w - 4, 1, '#e8b87a'); } else { R(g, X + 4, Y + 3, 8, 1, '#4a3a5a'); R(g, X + w - 12, Y + h - 5, 8, 1, '#4a3a5a'); }
        break; }
      case 'fusebox': shadow(); rb(g, X + 3, Y, 10, 14, '#5a5a70'); R(g, X + 4, Y + 1, 8, 2, '#8a8aa0'); for (let k = 0; k < 3; k++) { R(g, X + 5, Y + 5 + k * 3, 6, 2, '#1a1a24'); if (o.powered || k === 0) R(g, X + 6, Y + 5 + k * 3, 4, 1, o.powered ? '#3ae07a' : '#e04040'); } R(g, X + 11, Y + 2, 1, 1, o.powered ? '#3ae07a' : '#e04040'); break;
      case 'stairs': rb(g, X, Y, 16, 16, '#3a3050'); for (let i = 0; i < 5; i++) { const c = o.to === 1 ? shade('#9a8aaa', 1 - i * 0.12) : shade('#9a8aaa', 0.6 + i * 0.12); R(g, X + 1, Y + 1 + i * 3, 14, 2, c); R(g, X + 1, Y + 3 + i * 3, 14, 1, 'rgba(0,0,0,0.3)'); } rb(g, X + 5, Y + 5, 6, 6, '#ffd23f', '#8a6a10'); R(g, X + 7, o.to === 1 ? Y + 6 : Y + 8, 2, 3, '#8a6a10'); R(g, X + 6, o.to === 1 ? Y + 7 : Y + 7, 4, 1, '#8a6a10'); break;
      case 'fridge': shadow(); rb(g, X + 1, Y - 5, 14, 21, '#dce8f0'); R(g, X + 2, Y - 4, 12, 2, '#f8fcff'); R(g, X + 1, Y + 4, 14, 1, OL); R(g, X + 12, Y - 2, 1, 5, '#8a9aa8'); R(g, X + 12, Y + 6, 1, 6, '#8a9aa8'); R(g, X + 4, Y + 7, 3, 3, '#e04a6a'); R(g, X + 4, Y - 1, 3, 2, '#ffd23f'); if (o.opened) R(g, X + 2, Y + 5, 12, 1, '#a8b8c8'); break;
      case 'microwave': rb(g, X + 1, Y + 4, 14, 11, '#c8c8d8'); R(g, X + 2, Y + 5, 12, 1, '#e8e8f4');
        if (o.opened) { rb(g, X + 2, Y + 6, 9, 7, '#ffe890'); R(g, X + 3, Y + 7, 7, 5, '#fff6c0'); R(g, X + 1, Y + 6, 2, 8, '#9a9ab0'); if (o.cooking) R(g, X + 4, Y + 8, 5, 3, ((G.t * 8 | 0) % 2) ? '#ff9a3a' : '#ffd23f'); else if (o.food) R(g, X + 4, Y + 9, 5, 3, '#e08a3a'); }
        else { rb(g, X + 2, Y + 6, 9, 7, '#2a3a4a'); R(g, X + 3, Y + 7, 3, 1, '#4a6a8a'); } R(g, X + 12, Y + 7, 2, 2, '#e04040'); R(g, X + 12, Y + 10, 2, 2, '#3ae07a'); break;
      case 'safe': shadow(); rb(g, X + 1, Y - 1, 14, 16, '#c8a040'); R(g, X + 2, Y, 12, 2, '#f0d070');
        if (o.opened) { R(g, X + 3, Y + 2, 10, 11, '#0a0a10'); rb(g, X + 11, Y + 1, 4, 13, '#a88830'); R(g, X + 4, Y + 4, 4, 3, '#3ae07a'); } else { blob(g, X + 8, Y + 7, 4, 4, '#8a6a20'); E(g, X + 8, Y + 7, 2, 2, '#f0d070'); R(g, X + 8, Y + 5, 1, 2, '#2a1a00'); R(g, X + 3, Y + 12, 2, 2, '#2a1a00'); R(g, X + 11, Y + 12, 2, 2, '#2a1a00'); } break;
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
  return { mk, R, E, kid: kidSpr, doll: dollSpr, ghost: ghostSpr, gem: gemSpr, icon: iconSpr, floorCanvas, obj, PAL, KI, DI, tile };
})();
