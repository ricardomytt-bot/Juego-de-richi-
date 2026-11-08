// Arte pixel generado por código: monstruos, cuartos, cámaras, menú
const Art = (() => {
  const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g); return c; };
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const E = (g, cx, cy, rx, ry, c) => { g.fillStyle = c; for (let dy = -ry; dy <= ry; dy++) { const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.001)))); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } };
  const EO = (g, cx, cy, rx, ry, f, o) => { E(g, cx, cy, rx + 1, ry + 1, o); E(g, cx, cy, rx, ry, f); };
  const L = (g, x0, y0, x1, y1, c, t = 1) => { g.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), t, t); };
  const TR = (g, y0, y1, xl0, xr0, xl1, xr1, c) => { g.fillStyle = c; for (let y = y0; y < y1; y++) { const k = (y - y0) / Math.max(1, y1 - y0 - 1); const xl = Math.round(xl0 + (xl1 - xl0) * k), xr = Math.round(xr0 + (xr1 - xr0) * k); g.fillRect(xl, y, xr - xl + 1, 1); } };
  const eye = (g, x, y, r, px, py, scare) => { EO(g, x, y, r, r, scare ? '#ff3030' : '#fff', '#111'); if (!scare) R(g, x + px - 1, y + py - 1, 2, 2, '#111'); else R(g, x - 1, y - 1, 2, 3, '#300'); };
  const OUT = '#1a0f1f';

  // ---------- MONSTRUOS (32x48) ----------
  const D = {};
  D.chancla = (g, s) => {
    R(g, 11, 38, 2, 8, '#2a1810'); R(g, 19, 38, 2, 8, '#2a1810'); R(g, 9, 45, 5, 3, '#111'); R(g, 18, 45, 5, 3, '#111');
    L(g, 6, 24, 1, 32, '#2a1810', 2); L(g, 26, 24, 31, 32, '#2a1810', 2); R(g, 0, 31, 3, 3, '#e3a566'); R(g, 29, 31, 3, 3, '#e3a566');
    EO(g, 16, 22, 11, 19, '#e3a566', '#3b2314'); E(g, 16, 25, 8, 14, '#f2c78e');
    L(g, 8, 5, 16, 17, '#7a1410', 5); L(g, 24, 5, 16, 17, '#7a1410', 5);
    L(g, 8, 5, 16, 17, '#e0382f', 3); L(g, 24, 5, 16, 17, '#e0382f', 3); R(g, 15, 15, 3, 7, '#e0382f');
    eye(g, 11, 27, 3, 1, 1, s); eye(g, 21, 27, 3, -1, 1, s);
    L(g, 7, 22, 13, 25, '#111', 2); L(g, 25, 22, 19, 25, '#111', 2);
    if (s) { R(g, 8, 31, 16, 9, '#2a0000'); for (let i = 0; i < 8; i++) { R(g, 9 + i * 2, 31, 1, 3, '#fff'); R(g, 9 + i * 2, 37, 1, 3, '#fff'); } }
    else { R(g, 10, 33, 12, 3, '#2a0a0a'); for (let i = 0; i < 6; i++) R(g, 10 + i * 2, 33, 1, 1, '#fff'); }
  };
  D.cuchara = (g, s) => {
    R(g, 13, 38, 2, 8, '#2a1810'); R(g, 17, 38, 2, 8, '#2a1810'); R(g, 11, 45, 5, 3, '#111'); R(g, 17, 45, 5, 3, '#111');
    L(g, 6, 26, 2, 34, '#3b2314', 2); L(g, 26, 26, 30, 34, '#3b2314', 2);
    R(g, 13, 22, 6, 17, OUT); R(g, 14, 22, 4, 17, '#c98b4a'); R(g, 15, 24, 1, 12, '#a56d33');
    EO(g, 16, 12, 12, 12, '#c98b4a', '#3b2314');
    for (const [x, y, h] of [[8, 5, 5], [24, 9, 6], [12, 20, 3], [21, 19, 3]]) R(g, x, y, 1, h, '#a56d33');
    eye(g, 11, 9, 3, 1, 1, s); eye(g, 21, 9, 3, -1, 1, s);
    L(g, 7, 4, 13, 7, '#111', 2); L(g, 25, 4, 19, 7, '#111', 2);
    if (s) { R(g, 8, 14, 16, 10, '#2a0000'); for (let i = 0; i < 8; i++) { R(g, 9 + i * 2, 14, 1, 3, '#fff'); R(g, 9 + i * 2, 21, 1, 3, '#fff'); } }
    else { E(g, 16, 18, 3, 2, '#2a0a0a'); }
  };
  D.tamal = (g, s) => {
    R(g, 11, 40, 3, 7, '#3a2a14'); R(g, 18, 40, 3, 7, '#3a2a14'); R(g, 9, 46, 6, 2, '#111'); R(g, 17, 46, 6, 2, '#111');
    L(g, 7, 22, 2, 30, '#3a2a14', 2); L(g, 25, 22, 30, 30, '#3a2a14', 2);
    R(g, 6, 10, 20, 31, '#6e5420'); R(g, 7, 11, 18, 29, '#ead58d');
    for (const x of [10, 14, 18, 22]) R(g, x, 12, 1, 27, '#cdb35f');
    // puntas del hollejo
    for (let i = 0; i < 5; i++) { R(g, 6 + i * 4, 4 + (i % 2) * 2, 4, 7, '#ead58d'); R(g, 6 + i * 4, 4 + (i % 2) * 2, 1, 7, '#6e5420'); R(g, 6 + i * 4, 40, 4, 5 - (i % 2) * 2, '#ead58d'); }
    R(g, 6, 11, 20, 2, '#8a6a2a'); R(g, 6, 37, 20, 2, '#8a6a2a');
    R(g, 8, 13, 16, 3, '#f2b92e');
    eye(g, 12, 23, 3, 1, 1, s); eye(g, 20, 23, 3, -1, 1, s);
    L(g, 8, 18, 13, 20, '#111', 2); L(g, 24, 18, 19, 20, '#111', 2);
    if (s) { R(g, 9, 28, 14, 8, '#2a0000'); for (let i = 0; i < 7; i++) { R(g, 10 + i * 2, 28, 1, 3, '#fff'); R(g, 10 + i * 2, 33, 1, 3, '#fff'); } }
    else { R(g, 12, 30, 8, 3, '#2a0a0a'); R(g, 13, 30, 2, 1, '#fff'); R(g, 17, 30, 2, 1, '#fff'); }
  };
  D.sombra = (g, s) => {
    g.globalAlpha = 0.92;
    EO(g, 16, 17, 12, 14, '#6b2fa0', '#1b0b2e'); R(g, 3, 17, 27, 23, '#1b0b2e'); R(g, 4, 17, 25, 23, '#6b2fa0');
    for (let i = 0; i < 5; i++) { R(g, 4 + i * 5, 40, 5, 4 + (i % 2) * 3, '#1b0b2e'); R(g, 5 + i * 5, 40, 3, 3 + (i % 2) * 3, '#6b2fa0'); }
    L(g, 4, 24, 0, 12, '#1b0b2e', 3); L(g, 28, 24, 32, 12, '#1b0b2e', 3);
    for (const x of [-1, 31]) { R(g, x, 9, 1, 4, '#c9a6ff'); R(g, x + 2, 9, 1, 4, '#c9a6ff'); }
    E(g, 11, 14, 4, 5, '#fff'); E(g, 21, 14, 4, 5, '#fff');
    R(g, 10, 14, 2, 3, s ? '#f00' : '#2a0a4a'); R(g, 21, 14, 2, 3, s ? '#f00' : '#2a0a4a');
    R(g, 6, 25, 20, s ? 9 : 5, '#14061f');
    for (let i = 0; i < 10; i++) { R(g, 6 + i * 2, 25, 1, 2 + (i % 2), '#fff'); R(g, 6 + i * 2, (s ? 31 : 28) + (i % 2), 1, 2, '#fff'); }
    g.globalAlpha = 1;
  };
  D.apagon = (g, s) => {
    R(g, 11, 40, 3, 6, '#0c0c12'); R(g, 18, 40, 3, 6, '#0c0c12'); R(g, 9, 45, 6, 3, '#000'); R(g, 17, 45, 6, 3, '#000');
    L(g, 8, 28, 3, 38, '#0c0c12', 3); L(g, 24, 28, 29, 38, '#0c0c12', 3);
    R(g, 8, 25, 16, 16, '#000'); R(g, 9, 26, 14, 14, '#1c1c28'); R(g, 14, 26, 4, 10, '#eee');
    R(g, 13, 27, 6, 3, '#e03030'); R(g, 15, 28, 2, 1, '#802020');
    R(g, 11, 20, 10, 6, '#555a60'); R(g, 11, 21, 10, 1, '#8a9096'); R(g, 11, 23, 10, 1, '#8a9096');
    EO(g, 16, 11, 11, 11, s ? '#fff6b0' : '#cfe3ee', '#2b3a44'); E(g, 12, 6, 3, 2, '#fff');
    L(g, 11, 17, 13, 12, '#7a6a30'); L(g, 13, 12, 16, 15, '#7a6a30'); L(g, 16, 15, 19, 12, '#7a6a30'); L(g, 19, 12, 21, 17, '#7a6a30');
    E(g, 12, 9, 3, 4, '#111'); E(g, 20, 9, 3, 4, '#111');
    R(g, 11, 8, 2, 3, s ? '#f00' : '#ffd23f'); R(g, 19, 8, 2, 3, s ? '#f00' : '#ffd23f');
    if (s) { R(g, 10, 14, 12, 4, '#111'); for (let i = 0; i < 6; i++) R(g, 11 + i * 2, 14, 1, 2, '#fff'); }
  };
  const mcache = {};
  function mon(id, scare) {
    const k = id + (scare ? 's' : ''); return mcache[k] || (mcache[k] = mk(32, 48, g => D[id](g, scare)));
  }
  const MONS = {
    chancla: { name: 'Chancla Chancla Chancla', short: 'CHANCLA', color: '#e0382f',
      rule: 'Viene por la PUERTA IZQUIERDA. Si la ves ahí con la luz, ¡cierra la puerta antes de que te dé el chanclazo!',
      tip: 'Chancla ataca por la puerta izquierda. Mira con la luz izquierda y cierra la puerta a tiempo.' },
    cuchara: { name: 'Cuchara Cuchara Cuchara', short: 'CUCHARA', color: '#c98b4a',
      rule: 'Llega por la PUERTA DERECHA. La puerta cerrada no la espanta: ¡alúmbrala con la luz derecha para que huya!',
      tip: 'Cuchara solo huye con la luz derecha. Con la puerta cerrada se queda y te gasta la batería.' },
    tamal: { name: 'Tamal Tamal Tamalito', short: 'TAMAL', color: '#ead58d',
      rule: 'Solo avanza cuando NO lo miras en cámara. Si llega a la VENTANA, mírala en cámara 7 hasta que retroceda.',
      tip: 'Tamal solo avanza cuando no lo ves. Mira su cámara; si oyes golpecitos, revisa la cámara 7 (ventana).' },
    sombra: { name: 'Sombra Sombra Sombra', short: 'SOMBRA', color: '#a070e0',
      rule: 'Aparece al pie de la cama con un pitido. Escóndete bajo la COBIJA (mantén S) unos 3 segundos hasta que se vaya.',
      tip: 'Cuando suene el pitido, mantén la cobija (S) puesta unos 3 segundos. ¡No te quedes sin esconderte!' },
    apagon: { name: 'Don Apagón', short: 'APAGÓN', color: '#ffd23f',
      rule: 'Si la energía llega a 0%, se apagan las luces y las puertas se abren. Entonces sale él. ¡Cuida la batería!',
      tip: 'Don Apagón sale cuando se acaba la energía. Cierra puertas y usa cámaras solo cuando haga falta.' },
  };

  // ---------- OFICINA / CUARTO (320x180) ----------
  const DOORL = { x: 14, w: 60 }, DOORR = { x: 246, w: 60 }, DOORY = 30, DOORH = 98;
  const office = mk(320, 180, g => {
    R(g, 0, 0, 320, 180, '#3a3358');
    for (let x = 0; x < 320; x += 8) R(g, x, 0, 3, 128, '#342e50');
    for (let x = 4; x < 320; x += 16) for (let y = 14; y < 120; y += 16) R(g, x, y, 2, 2, '#4a4270');
    R(g, 0, 0, 320, 22, '#2a2442'); R(g, 0, 22, 320, 2, '#1c1830');
    R(g, 0, 124, 320, 5, '#25182e'); R(g, 0, 129, 320, 51, '#5a3b2a');
    for (let y = 129; y < 180; y += 9) R(g, 0, y, 320, 1, '#43291c');
    for (let i = 0; i < 20; i++) { const x = (i * 37) % 320, y0 = 129 + (i * 13) % 5 * 9; R(g, x, y0, 1, 9, '#43291c'); }
    // marcos de puertas
    for (const d of [DOORL, DOORR]) { R(g, d.x - 5, DOORY - 5, d.w + 10, DOORH + 5, '#3d2414'); R(g, d.x - 3, DOORY - 3, d.w + 6, DOORH + 3, '#6b4226'); }
    // ventana central
    R(g, 130, 32, 60, 62, '#3d2414'); R(g, 133, 35, 54, 56, '#10163a');
    for (const [x, y] of [[140, 42], [175, 50], [150, 78], [168, 70], [181, 85]]) R(g, x, y, 1, 1, '#fff');
    E(g, 172, 52, 7, 7, '#f6f1c8'); E(g, 175, 50, 5, 5, '#10163a'); E(g, 172, 52, 7, 7, '#f6f1c8'); E(g, 176, 50, 5, 5, '#10163a');
    R(g, 133, 62, 54, 2, '#0a0e28'); R(g, 158, 35, 3, 56, '#3d2414'); R(g, 133, 62, 54, 3, '#3d2414');
    R(g, 133, 35, 10, 56, '#c0507a'); R(g, 177, 35, 10, 56, '#c0507a');
    for (let y = 35; y < 91; y += 4) { R(g, 135, y, 1, 3, '#a03a62'); R(g, 139, y, 1, 3, '#a03a62'); R(g, 179, y, 1, 3, '#a03a62'); R(g, 183, y, 1, 3, '#a03a62'); }
    R(g, 128, 94, 64, 4, '#6b4226');
    // pósters
    R(g, 88, 44, 28, 34, '#201a38'); R(g, 90, 46, 24, 30, '#ffd84a'); E(g, 102, 58, 7, 7, '#ff9a2a'); R(g, 99, 56, 2, 2, '#111'); R(g, 104, 56, 2, 2, '#111'); R(g, 99, 61, 7, 1, '#111'); R(g, 98, 60, 1, 1, '#111'); R(g, 106, 60, 1, 1, '#111'); R(g, 94, 70, 16, 2, '#111');
    R(g, 204, 44, 28, 34, '#201a38'); R(g, 206, 46, 24, 30, '#3aa0ff'); R(g, 210, 52, 16, 3, '#fff'); R(g, 210, 58, 16, 3, '#ffd23f'); R(g, 210, 64, 10, 3, '#fff'); R(g, 210, 70, 14, 2, '#ff5a8a');
    // repisa con peluche
    R(g, 84, 100, 40, 3, '#3d2414'); E(g, 96, 96, 4, 4, '#b8b8d8'); R(g, 93, 92, 2, 2, '#b8b8d8'); R(g, 98, 92, 2, 2, '#b8b8d8'); R(g, 95, 95, 1, 1, '#111'); R(g, 98, 95, 1, 1, '#111'); R(g, 108, 90, 10, 10, '#e05a5a'); R(g, 108, 90, 10, 3, '#ffd23f');
    // cama (pie)
    R(g, 82, 148, 156, 32, '#2f5a8c'); R(g, 82, 146, 156, 5, '#6b4226'); R(g, 82, 144, 6, 36, '#6b4226'); R(g, 232, 144, 6, 36, '#6b4226');
    for (let x = 90; x < 232; x += 14) R(g, x, 154, 7, 26, '#3a6aa0');
    R(g, 82, 168, 156, 2, '#264a74');
  });
  // pasillo visto desde la puerta (luz)
  const hallDark = mk(60, 98, g => { R(g, 0, 0, 60, 98, '#07060d'); R(g, 0, 70, 60, 28, '#0b0a14'); });
  const hallLit = mk(60, 98, g => {
    R(g, 0, 0, 60, 98, '#d8c98a'); R(g, 0, 0, 60, 8, '#b8a96a');
    R(g, 0, 70, 60, 28, '#8a6a44'); for (let y = 70; y < 98; y += 7) R(g, 0, y, 60, 1, '#6a4a2a');
    R(g, 0, 66, 60, 4, '#6a5a38'); R(g, 0, 0, 3, 98, '#a89a5a'); R(g, 57, 0, 3, 98, '#a89a5a');
    R(g, 8, 16, 14, 18, '#5a4a30'); R(g, 10, 18, 10, 14, '#7ab0d8');
  });
  function drawDoorPanel(g, d, pos) { // pos 0 abierta .. 1 cerrada
    const h = Math.round(DOORH * pos); if (h <= 0) return;
    R(g, d.x, DOORY, d.w, h, '#7a5232');
    for (let x = d.x + 10; x < d.x + d.w; x += 10) R(g, x, DOORY, 1, h, '#5a3a22');
    for (let y = DOORY + 20; y < DOORY + h; y += 25) R(g, d.x, y, d.w, 2, '#5a3a22');
    R(g, d.x, DOORY + h - 3, d.w, 3, '#3d2414');
    if (pos > 0.8) { E(g, d.x + (d === DOORL ? d.w - 8 : 8), DOORY + 55, 3, 3, '#e0c060'); R(g, d.x + 6, DOORY + 8, d.w - 12, 20, '#6a4426'); R(g, d.x + 8, DOORY + 10, d.w - 16, 16, '#7a5232'); }
  }

  // ---------- CÁMARAS (320x180) ----------
  const CAMS = [];
  const camBase = (fn) => CAMS.push(mk(320, 180, fn));
  // 0 PATIO
  camBase(g => {
    R(g, 0, 0, 320, 180, '#12183a'); E(g, 250, 30, 12, 12, '#f2eec0'); E(g, 255, 27, 9, 9, '#12183a'); E(g, 250, 30, 12, 12, '#f2eec0'); E(g, 256, 27, 9, 9, '#12183a');
    for (let i = 0; i < 25; i++) R(g, (i * 53) % 320, (i * 29) % 70, 1, 1, '#fff');
    R(g, 0, 110, 320, 70, '#1d4a2a');
    for (let x = 0; x < 320; x += 5) R(g, x, 118 + (x * 7) % 40, 2, 3, '#2a6a38');
    R(g, 0, 78, 320, 36, '#5a4028'); for (let x = 0; x < 320; x += 14) { R(g, x, 70, 10, 46, '#7a5632'); R(g, x + 3, 70, 1, 46, '#5a4028'); }
    R(g, 0, 90, 320, 3, '#4a3320'); R(g, 0, 104, 320, 3, '#4a3320');
    R(g, 40, 30, 14, 100, '#4a3018'); E(g, 47, 28, 34, 26, '#1d5a2a'); E(g, 30, 40, 20, 14, '#164a22'); E(g, 66, 36, 20, 14, '#164a22');
    R(g, 220, 140, 28, 20, '#a8542a'); R(g, 218, 136, 32, 6, '#c0643a'); R(g, 228, 124, 3, 14, '#2a8a3a'); E(g, 229, 122, 5, 4, '#e0508a');
    R(g, 120, 52, 100, 1, '#aaa'); R(g, 130, 53, 14, 12, '#d8d8e8'); R(g, 170, 53, 10, 16, '#e0a0a0'); R(g, 120, 40, 2, 70, '#4a3018'); R(g, 218, 40, 2, 70, '#4a3018');
  });
  // 1 COCINA
  camBase(g => {
    R(g, 0, 0, 320, 180, '#6a7a8a'); R(g, 0, 0, 320, 20, '#4a5a6a');
    for (let x = 0; x < 320; x += 20) for (let y = 40; y < 110; y += 20) { R(g, x, y, 19, 19, '#8a9aaa'); }
    for (let y = 120; y < 180; y += 15) for (let x = ((y / 15) % 2) * 15; x < 320; x += 30) { R(g, x, y, 15, 15, '#2a2a3a'); R(g, x + 15, y, 15, 15, '#c8c8d0'); }
    R(g, 0, 20, 320, 22, '#7a4a2a'); for (let x = 0; x < 320; x += 40) { R(g, x + 1, 22, 38, 18, '#9a6a3a'); R(g, x + 17, 28, 6, 3, '#2a1a0a'); }
    R(g, 0, 108, 320, 14, '#3a2a1a'); R(g, 0, 102, 320, 7, '#d0c8b8');
    R(g, 10, 44, 46, 76, '#d8dce0'); R(g, 10, 80, 46, 2, '#8a8e92'); R(g, 48, 56, 3, 14, '#6a6e72'); R(g, 48, 90, 3, 14, '#6a6e72');
    R(g, 240, 76, 56, 32, '#2a2a30'); for (const x of [250, 262, 274, 286]) E(g, x, 82, 4, 2, '#111'); R(g, 240, 100, 56, 8, '#8a8e92');
    R(g, 120, 84, 20, 18, '#c05a2a'); R(g, 118, 80, 24, 5, '#e07a3a'); R(g, 180, 94, 30, 8, '#c0c8d0');
  });
  // 2 COMEDOR
  camBase(g => {
    R(g, 0, 0, 320, 180, '#6a4a5a'); for (let x = 0; x < 320; x += 10) R(g, x, 0, 2, 120, '#5a3a4a');
    R(g, 0, 120, 320, 60, '#4a3020'); for (let y = 120; y < 180; y += 10) R(g, 0, y, 320, 1, '#3a2418');
    R(g, 130, 0, 2, 40, '#222'); R(g, 112, 40, 38, 8, '#e0c060'); R(g, 116, 48, 30, 4, '#ffe890');
    R(g, 40, 30, 60, 50, '#2a1a3a'); R(g, 43, 33, 54, 44, '#1a2050'); R(g, 68, 33, 3, 44, '#2a1a3a'); R(g, 43, 53, 54, 3, '#2a1a3a');
    R(g, 220, 40, 80, 70, '#5a3418'); R(g, 224, 44, 72, 30, '#7a4a28'); R(g, 224, 78, 72, 28, '#7a4a28'); R(g, 258, 56, 5, 4, '#e0c060'); R(g, 258, 90, 5, 4, '#e0c060');
    R(g, 70, 100, 150, 14, '#8a5a30'); R(g, 70, 100, 150, 3, '#a87040'); R(g, 80, 114, 8, 40, '#6a4020'); R(g, 200, 114, 8, 40, '#6a4020');
    R(g, 130, 90, 30, 10, '#e0e0e8'); R(g, 134, 86, 22, 5, '#d04a4a');
    for (const x of [52, 196]) { R(g, x, 96, 24, 8, '#4a2a18'); R(g, x + 2, 104, 3, 40, '#3a2010'); R(g, x + 19, 104, 3, 40, '#3a2010'); R(g, x + 2, 76, 3, 22, '#3a2010'); R(g, x + 19, 76, 3, 22, '#3a2010'); R(g, x + 2, 76, 20, 5, '#3a2010'); }
  });
  // 3 SALA
  camBase(g => {
    R(g, 0, 0, 320, 180, '#4a3a5a'); for (let x = 0; x < 320; x += 12) R(g, x, 0, 4, 125, '#403050');
    R(g, 0, 125, 320, 55, '#6a4a30'); R(g, 70, 140, 180, 36, '#8a2a3a'); R(g, 74, 144, 172, 28, '#a03a4a'); for (let x = 74; x < 246; x += 8) R(g, x, 144, 2, 28, '#802030');
    R(g, 120, 40, 80, 56, '#1a1a1a'); R(g, 124, 44, 72, 46, '#8ab0c8'); for (let i = 0; i < 120; i++) R(g, 124 + (i * 31) % 70, 44 + (i * 17) % 44, 2, 1, i % 2 ? '#fff' : '#456');
    R(g, 150, 96, 20, 6, '#1a1a1a'); R(g, 112, 102, 96, 8, '#5a3a22'); R(g, 112, 110, 6, 18, '#4a2a18'); R(g, 202, 110, 6, 18, '#4a2a18');
    R(g, 20, 96, 80, 38, '#3a6a8a'); R(g, 20, 84, 80, 16, '#4a7a9a'); R(g, 14, 90, 12, 40, '#2a5a7a'); R(g, 94, 90, 12, 40, '#2a5a7a'); R(g, 24, 124, 72, 4, '#2a4a62');
    R(g, 270, 80, 10, 50, '#5a3a22'); E(g, 275, 70, 18, 16, '#1d5a2a'); E(g, 265, 76, 10, 8, '#2a7a3a'); R(g, 262, 118, 26, 14, '#a8542a');
  });
  // 4 PASILLO
  camBase(g => {
    R(g, 0, 0, 320, 180, '#2a2438');
    TR(g, 0, 60, 0, 319, 100, 219, '#3a3050'); TR(g, 60, 180, 100, 219, 0, 319, '#5a3a28');
    TR(g, 0, 180, 0, 0, 100, 100, '#4a3a5a'); TR(g, 0, 180, 319, 319, 219, 219, '#4a3a5a');
    for (let i = 0; i < 14; i++) { const k = i / 14; const y = 60 + Math.round(120 * k * k); R(g, 100 - Math.round(100 * k * k), y, 120 + Math.round(200 * k * k), 1, '#3a2418'); }
    R(g, 100, 60, 120, 60, '#14101e'); R(g, 150, 70, 20, 50, '#0a0814');
    R(g, 20, 40, 40, 80, '#2a1a10'); R(g, 24, 44, 32, 72, '#4a2e1a'); R(g, 262, 40, 40, 80, '#2a1a10'); R(g, 266, 44, 32, 72, '#4a2e1a');
    R(g, 74, 30, 26, 30, '#2a1a10'); R(g, 76, 32, 22, 26, '#7a9ab0'); R(g, 222, 28, 26, 30, '#2a1a10'); R(g, 224, 30, 22, 26, '#b08a6a');
    R(g, 140, 0, 40, 6, '#e0c060'); R(g, 142, 6, 36, 3, '#ffe890');
    TR(g, 110, 180, 150, 170, 80, 240, '#7a2a3a');
  });
  // 5 BAÑO
  camBase(g => {
    R(g, 0, 0, 320, 180, '#8ab0b8'); for (let x = 0; x < 320; x += 16) R(g, x, 0, 1, 120, '#6a9098'); for (let y = 0; y < 120; y += 16) R(g, 0, y, 320, 1, '#6a9098');
    R(g, 0, 120, 320, 60, '#4a5a6a'); for (let x = 0; x < 320; x += 20) for (let y = 120; y < 180; y += 20) R(g, x + ((y / 20) % 2) * 10, y, 10, 10, '#5a6a7a');
    R(g, 120, 24, 70, 50, '#3a4a5a'); R(g, 123, 27, 64, 44, '#b8d8f0'); R(g, 130, 32, 20, 4, '#e8f4ff');
    R(g, 130, 82, 50, 14, '#e8e8f0'); R(g, 150, 76, 10, 8, '#8a8e92'); R(g, 138, 96, 34, 30, '#d0d0d8');
    R(g, 20, 70, 70, 56, '#e8e8f0'); R(g, 20, 70, 70, 6, '#c0c0c8'); R(g, 14, 120, 82, 8, '#d0d0d8'); R(g, 28, 56, 4, 16, '#8a8e92'); R(g, 24, 54, 16, 4, '#8a8e92');
    R(g, 240, 80, 40, 12, '#e8e8f0'); R(g, 244, 92, 32, 36, '#e8e8f0'); R(g, 250, 60, 28, 22, '#d0d0d8');
    R(g, 226, 100, 6, 20, '#d04a4a');
  });
  // 6 VENTANA (afuera de tu ventana)
  camBase(g => {
    R(g, 0, 0, 320, 180, '#0e1230'); for (let i = 0; i < 20; i++) R(g, (i * 47) % 320, (i * 23) % 40, 1, 1, '#fff');
    R(g, 0, 40, 320, 100, '#7a4a3a'); for (let y = 40; y < 140; y += 8) { R(g, 0, y, 320, 1, '#5a3028'); for (let x = ((y / 8) % 2) * 16; x < 320; x += 32) R(g, x, y, 1, 8, '#5a3028'); }
    R(g, 100, 50, 120, 90, '#3d2414'); R(g, 106, 56, 108, 78, '#e0b860'); R(g, 106, 56, 108, 78, '#e8c870');
    R(g, 157, 56, 6, 78, '#3d2414'); R(g, 106, 92, 108, 6, '#3d2414');
    R(g, 106, 56, 22, 78, '#c0507a'); R(g, 192, 56, 22, 78, '#c0507a'); R(g, 94, 138, 132, 8, '#5a3820');
    R(g, 0, 140, 320, 40, '#1d4a2a'); E(g, 40, 140, 36, 18, '#164a22'); E(g, 280, 142, 40, 20, '#164a22'); E(g, 240, 150, 24, 12, '#1d5a2a');
  });

  // ---------- MENÚ ----------
  const menuBg = mk(320, 240, g => {
    const bands = ['#0b0b2a', '#10103a', '#16164a', '#1e1a5a', '#2a2070', '#3a2a86', '#4e3498', '#6a3fa8', '#8a4cb0'];
    bands.forEach((c, i) => R(g, 0, i * 16, 320, 17, c));
    for (let i = 0; i < 60; i++) { const x = (i * 83) % 320, y = (i * 47) % 100; R(g, x, y, 1, 1, i % 5 ? '#fff' : '#ffd23f'); if (i % 9 === 0) { R(g, x - 1, y, 3, 1, '#fff'); R(g, x, y - 1, 1, 3, '#fff'); } }
    E(g, 260, 54, 26, 26, '#fff6c8'); E(g, 268, 48, 22, 22, '#0f0f3a'); E(g, 260, 54, 26, 26, '#fff6c8'); E(g, 270, 48, 22, 22, bands[3]); E(g, 260, 54, 25, 25, '#fff6c8'); E(g, 272, 46, 21, 21, '#1e1a5a');
  });
  const menuFront = mk(320, 240, g => {
    R(g, 0, 190, 320, 50, '#0c0a1e'); for (let x = 0; x < 320; x += 6) R(g, x, 188 - ((x * 5) % 7), 3, 6, '#0c0a1e');
    // casa
    R(g, 20, 130, 90, 62, '#1c1634'); TR(g, 108, 130, 10, 120, 20, 110, '#2a1e44');
    R(g, 34, 144, 16, 16, '#ffd23f'); R(g, 34, 151, 16, 1, '#c8901a'); R(g, 41, 144, 1, 16, '#c8901a'); R(g, 72, 144, 16, 16, '#ffd23f'); R(g, 72, 151, 16, 1, '#c8901a'); R(g, 79, 144, 1, 16, '#c8901a'); R(g, 52, 164, 16, 28, '#3a2418');
    R(g, 92, 110, 8, 22, '#1c1634');
  });

  return { mk, R, E, EO, L, TR, mon, MONS, office, hallDark, hallLit, drawDoorPanel, DOORL, DOORR, DOORY, DOORH, CAMS, menuBg, menuFront };
})();
