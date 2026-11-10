// ============ VISTA EN PRIMERA PERSONA (alta calidad): texturas procedurales, sombras, luces, techos y ventanas ============
const RenderFP = (() => {
  const T = typeof THREE !== 'undefined' ? THREE : null;
  const W = 960, H = 540, WALLH = 2.7;
  let ren = null, scene = null, cam = null, ok = false, built = null, cv = null, _S = null;

  function init() {
    if (ok) return true; if (!T) return false;
    try {
      cv = document.getElementById('fp'); if (!cv) return false;
      ren = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
      ren.setPixelRatio(1); ren.setSize(W, H, false); if ('useLegacyLights' in ren) ren.useLegacyLights = true;
      ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.25; if ('outputColorSpace' in ren) ren.outputColorSpace = T.SRGBColorSpace;
      ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap;
      cam = new T.PerspectiveCamera(74, W / H, 0.05, 70); ok = true;
    } catch (e) { ok = false; }
    return ok;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  const cvs = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
  const mkTex = (c, rx = 1, ry = 1, srgb = true) => { const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; if (srgb && 'colorSpace' in t) t.colorSpace = T.SRGBColorSpace; return t; };
  function speckle(g, w, h, n, al, cols, sz = 1) { for (let i = 0; i < n; i++) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.globalAlpha = Math.random() * al; g.fillRect(Math.random() * w, Math.random() * h, sz * (1 + Math.random() * 2), sz * (1 + Math.random())); } g.globalAlpha = 1; }

  // ---------- texturas ----------
  function woodCanvas(base = '#b07a48', rows = 4, w = 256, h = 256) {
    return cvs(w, h, (g) => {
      const ph = h / rows;
      for (let r = 0; r < rows; r++) {
        const y0 = r * ph, v = rnd(-14, 14), col = new T.Color(base); g.fillStyle = '#' + col.clone().offsetHSL(0, 0, v / 255).getHexString(); g.fillRect(0, y0, w, ph);
        for (let i = 0; i < 46; i++) { g.strokeStyle = 'rgba(40,20,8,' + rnd(0.04, 0.16).toFixed(2) + ')'; g.lineWidth = rnd(0.5, 1.6); g.beginPath(); const yy = y0 + rnd(1, ph - 1), ph0 = rnd(0, 6); g.moveTo(0, yy); for (let x = 0; x <= w; x += 8) g.lineTo(x, yy + Math.sin(x * 0.04 + ph0) * rnd(0.6, 2)); g.stroke(); }
        if (Math.random() < 0.7) { const kx = rnd(20, w - 20), ky = y0 + ph / 2 + rnd(-6, 6); for (let k = 3; k > 0; k--) { g.strokeStyle = 'rgba(40,20,8,' + (0.25 / k).toFixed(2) + ')'; g.lineWidth = 1; g.beginPath(); g.ellipse(kx, ky, k * 5, k * 2.4, 0, 0, 6.283); g.stroke(); } }
        g.fillStyle = 'rgba(20,10,4,0.6)'; g.fillRect(0, y0, w, 1.5); const sx = (r * 97) % (w - 20) + 10; g.fillRect(sx, y0, 1.5, ph);
        g.fillStyle = 'rgba(255,235,200,0.10)'; g.fillRect(0, y0 + 1.5, w, 1);
      }
      speckle(g, w, h, 500, 0.12, ['#000', '#3a2008', '#fff'], 1);
    });
  }
  const gray = (cv) => cv;
  function fabricCanvas() { return cvs(128, 128, (g, w, h) => { g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 3) { g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x, 0, 1, h); } for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(0, y, w, 1); } speckle(g, w, h, 600, 0.12, ['#000', '#fff'], 1); }); }
  function metalCanvas() { return cvs(128, 128, (g, w, h) => { g.fillStyle = '#b8b8c0'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.fillStyle = (Math.random() < 0.5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + rnd(0.02, 0.1).toFixed(2) + ')'; g.fillRect(0, Math.random() * h, w, rnd(0.5, 1.4)); } speckle(g, w, h, 160, 0.2, ['#000', '#fff'], 1); }); }
  function wallCanvas() {
    return cvs(128, 256, (g, w, h) => {
      g.fillStyle = '#d6d0de'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(x, 0, 8, h); g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(x + 8, 0, 8, h); }
      for (let y = 18; y < h * 0.66; y += 26) for (let x = 8; x < w; x += 16) { g.fillStyle = 'rgba(80,50,110,0.16)'; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 4, y); g.lineTo(x, y + 5); g.lineTo(x - 4, y); g.fill(); }
      const wy = h * 0.68; g.fillStyle = '#9a8aa8'; g.fillRect(0, wy, w, h - wy); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, wy, w, 3); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, wy + 3, w, 2);
      for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + 4, wy + 12, 24, h - wy - 36); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x + 4, wy + 12, 24, 1); g.fillRect(x + 4, wy + 12, 1, h - wy - 36); }
      g.fillStyle = '#6a5a7a'; g.fillRect(0, h - 22, w, 22); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, h - 22, w, 2); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, h - 3, w, 3);
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, 0, w, 8); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(0, 8, w, 2);
      for (let i = 0; i < 7; i++) { const x = rnd(0, w), gr = g.createLinearGradient(x, 0, x, h * 0.7); gr.addColorStop(0, 'rgba(60,40,20,0.0)'); gr.addColorStop(1, 'rgba(60,40,20,' + rnd(0.08, 0.2).toFixed(2) + ')'); g.fillStyle = gr; g.fillRect(x, 0, rnd(2, 8), h * 0.7); }
      speckle(g, w, h, 900, 0.18, ['#000', '#5a4a30'], 1);
    });
  }
  function ceilingCanvas() { return cvs(128, 128, (g, w, h) => { g.fillStyle = '#9a96a4'; g.fillRect(0, 0, w, h); speckle(g, w, h, 1400, 0.2, ['#000', '#fff', '#5a4a3a'], 1); for (let i = 0; i < 4; i++) { const x = rnd(0, w), y = rnd(0, h), gr = g.createRadialGradient(x, y, 2, x, y, rnd(14, 30)); gr.addColorStop(0, 'rgba(70,50,30,0.25)'); gr.addColorStop(1, 'rgba(70,50,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } g.strokeStyle = 'rgba(0,0,0,0.25)'; g.strokeRect(0, 0, w, h); }); }
  function doorCanvas() {
    return cvs(128, 256, (g, w, h) => {
      g.drawImage(woodCanvas('#8a5a34', 8, 128, 256), 0, 0);
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, 0, w, 8); g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
      for (const [x, y, ww, hh] of [[16, 16, 40, 90], [72, 16, 40, 90], [16, 126, 40, 110], [72, 126, 40, 110]]) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y, ww, hh); g.fillStyle = 'rgba(255,230,190,0.14)'; g.fillRect(x, y, ww, 2); g.fillRect(x, y, 2, hh); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + ww - 2, y, 2, hh); g.fillRect(x, y + hh - 2, ww, 2); }
    });
  }
  function windowCanvas() {
    return cvs(128, 160, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0a1034'); gr.addColorStop(1, '#2a3a78'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(0.3, 1).toFixed(2) + ')'; g.fillRect(rnd(4, w - 4), rnd(4, h * 0.6), 1.4, 1.4); }
      const mg = g.createRadialGradient(88, 36, 4, 88, 36, 26); mg.addColorStop(0, 'rgba(255,248,210,1)'); mg.addColorStop(0.4, 'rgba(255,244,190,0.9)'); mg.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = mg; g.fillRect(40, 0, 90, 80);
      g.fillStyle = '#05030c'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, h - 28 - Math.sin(x * 0.07) * 8 - (x % 24 < 8 ? 10 : 0)); g.lineTo(w, h); g.fill();
      g.fillStyle = '#20140c'; g.fillRect(0, 0, w, 7); g.fillRect(0, h - 7, w, 7); g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h); g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h * 0.5 - 3, w, 6);
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(8, 8, 30, h - 16);
      g.fillStyle = '#9a2a54'; g.fillRect(0, 0, 18, h); g.fillRect(w - 18, 0, 18, h); for (let y = 0; y < h; y += 6) { g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, y, 18, 2); g.fillRect(w - 18, y, 18, 2); }
    });
  }
  function ghostCanvas() {
    return cvs(128, 192, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(235,240,255,0.95)'); gr.addColorStop(0.6, 'rgba(200,215,255,0.75)'); gr.addColorStop(1, 'rgba(180,200,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(64, 56, 40, 46, 0, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(24, 56); g.lineTo(104, 56); g.lineTo(116, h); for (let i = 0; i < 6; i++) g.lineTo(104 - i * 16 - 8, h - 14 + (i % 2) * 14); g.lineTo(12, h); g.fill();
      g.fillStyle = 'rgba(200,215,255,0.8)'; g.fillRect(2, 70, 22, 12); g.fillRect(104, 70, 22, 12);
      const eg = (x) => { const e = g.createRadialGradient(x, 52, 1, x, 52, 18); e.addColorStop(0, '#000'); e.addColorStop(0.7, '#0a0618'); e.addColorStop(1, 'rgba(10,6,24,0)'); g.fillStyle = e; g.beginPath(); g.ellipse(x, 54, 11, 17, 0, 0, 6.283); g.fill(); g.fillStyle = '#ff3a5a'; g.fillRect(x - 2, 48, 4, 4); };
      eg(46); eg(82); const mg = g.createRadialGradient(64, 92, 1, 64, 92, 18); mg.addColorStop(0, '#000'); mg.addColorStop(1, 'rgba(10,6,24,0)'); g.fillStyle = mg; g.beginPath(); g.ellipse(64, 92, 12, 18, 0, 0, 6.283); g.fill();
    });
  }
  function floorBase(type) {
    return cvs(128, 128, (g, w, h) => {
      if (type === '.') { g.drawImage(woodCanvas('#a8693c', 4, 128, 128), 0, 0); }
      else if (type === 'k') { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#e8efe8' : '#5a9a94'; g.fillRect(x * 64, y * 64, 64, 64); const gr = g.createLinearGradient(x * 64, y * 64, x * 64 + 64, y * 64 + 64); gr.addColorStop(0, 'rgba(255,255,255,0.28)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = gr; g.fillRect(x * 64, y * 64, 64, 64); } g.fillStyle = 'rgba(40,50,50,0.7)'; g.fillRect(0, 0, 128, 2); g.fillRect(0, 62, 128, 4); g.fillRect(0, 126, 128, 2); g.fillRect(0, 0, 2, 128); g.fillRect(62, 0, 4, 128); g.fillRect(126, 0, 2, 128); speckle(g, w, h, 300, 0.12, ['#000', '#fff'], 1); }
      else if (type === 'g') { g.fillStyle = '#7e8294'; g.fillRect(0, 0, w, h); speckle(g, w, h, 2200, 0.28, ['#000', '#fff', '#5a5e70'], 1); for (let i = 0; i < 3; i++) { const x = rnd(20, 108), y = rnd(20, 108), gr = g.createRadialGradient(x, y, 2, x, y, rnd(12, 24)); gr.addColorStop(0, 'rgba(20,20,30,0.35)'); gr.addColorStop(1, 'rgba(20,20,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 126, w, 2); g.fillRect(126, 0, 2, h); }
      else { g.fillStyle = '#a03a58'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3500; i++) { g.fillStyle = (Math.random() < 0.5 ? 'rgba(255,200,210,' : 'rgba(40,0,10,') + rnd(0.05, 0.22).toFixed(2) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1, rnd(1, 3)); } g.strokeStyle = 'rgba(255,220,180,0.16)'; g.lineWidth = 3; g.strokeRect(10, 10, 108, 108); g.beginPath(); g.moveTo(64, 14); g.lineTo(114, 64); g.lineTo(64, 114); g.lineTo(14, 64); g.closePath(); g.stroke(); }
    });
  }
  const FB = {}; const fb = t => FB[t] || (FB[t] = floorBase(t));
  function floorTexFP(F) {
    const TS2 = 48;
    return cvs(MW * TS2, MH * TS2, (g) => {
      g.fillStyle = '#0a0612'; g.fillRect(0, 0, MW * TS2, MH * TS2);
      for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
        let c = F.g[j][i]; if (c === '#' || c === ' ') continue; if (c >= '1' && c <= '5') c = '.';
        const x = i * TS2, y = j * TS2; g.drawImage(fb(c), (i % 2) * 64, (j % 2) * 64, 64, 64, x, y, TS2, TS2);
        const v = (Math.sin(i * 12.9 + j * 78.2) * 43758.5) % 1; g.fillStyle = v > 0 ? 'rgba(0,0,0,' + (v * 0.1).toFixed(3) + ')' : 'rgba(255,255,255,' + (-v * 0.06).toFixed(3) + ')'; g.fillRect(x, y, TS2, TS2);
        // oclusión ambiental cerca de las paredes
        for (const [dx, dy, gx, gy, gx2, gy2] of [[0, -1, 0, 0, 0, 14], [0, 1, 0, TS2, 0, TS2 - 14], [-1, 0, 0, 0, 14, 0], [1, 0, TS2, 0, TS2 - 14, 0]]) { const n = (F.g[j + dy] || [])[i + dx]; if (n === '#' || n === ' ') { const gr = g.createLinearGradient(x + gx, y + gy, x + gx2, y + gy2); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, TS2, TS2); } }
      }
      for (const r of (F.rugs || [])) {
        const x = r.x * TS2, y = r.y * TS2, w = r.w * TS2, h = r.h * TS2; g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 2, y - 2, w + 6, h + 6); g.fillStyle = r.c1; g.fillRect(x, y, w, h); g.fillStyle = r.c2; g.fillRect(x + 8, y + 8, w - 16, h - 16); g.fillStyle = r.c1; g.fillRect(x + 16, y + 16, w - 32, h - 32);
        g.fillStyle = r.c3; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 - 28, h / 2 - 28, 0, 0, 6.283); g.fill(); g.fillStyle = r.c2; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 - 38, h / 2 - 38, 0, 0, 6.283); g.fill();
        for (let k = 0; k < w; k += 8) { g.fillStyle = r.c3; g.fillRect(x + k, y - 4, 3, 4); g.fillRect(x + k, y + h, 3, 4); } speckle(g, w + 10, h + 10, 2400, 0.14, ['#000', '#fff'], 1);
      }
      speckle(g, MW * TS2, MH * TS2, 4000, 0.18, ['#000', '#2a1a0a'], 2);
    });
  }

  // ---------- materiales ----------
  let WOODT, FABT, METT; const MC = {};
  function M(c, o = {}) {
    const k = c + '|' + (o.m || '') + (o.r || ''); if (MC[k]) return MC[k]; const col = new T.Color(c), hsl = {}; col.getHSL(hsl); let m;
    if (o.m === 'metal' || (!o.m && hsl.s < 0.18 && hsl.l > 0.3 && hsl.l < 0.8)) m = new T.MeshStandardMaterial({ color: c, map: METT, roughness: o.r != null ? o.r : 0.4, metalness: 0.7 });
    else if (o.m === 'wood' || (!o.m && hsl.s > 0.22 && hsl.h > 0.03 && hsl.h < 0.12 && hsl.l < 0.68)) m = new T.MeshStandardMaterial({ color: c, map: WOODT, bumpMap: WOODT, bumpScale: 0.8, roughness: 0.72, metalness: 0.02 });
    else if (o.m === 'gloss') m = new T.MeshStandardMaterial({ color: c, roughness: 0.18, metalness: 0.2 });
    else m = new T.MeshStandardMaterial({ color: c, map: FABT, roughness: o.r != null ? o.r : 0.85, metalness: 0.0 });
    return (MC[k] = m);
  }
  const EM = {}; const emi = (c) => EM[c] || (EM[c] = new T.MeshBasicMaterial({ color: c }));
  let BOXG, SPHG, CYLG;
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const me = new T.Mesh(BOXG, typeof m === 'string' ? M(m) : m); me.scale.set(w, h, d); me.position.set(x, y, z); return me; };
  const sph = (r, m, x = 0, y = 0, z = 0, sy = 1, sz = 1) => { const me = new T.Mesh(SPHG, typeof m === 'string' ? M(m) : m); me.scale.set(r, r * sy, r * sz); me.position.set(x, y, z); return me; };
  const CYC = {};
  const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 18) => { const k = rt + '_' + rb + '_' + seg; const geo = CYC[k] || (CYC[k] = new T.CylinderGeometry(rt, rb, 1, seg)); const me = new T.Mesh(geo, typeof m === 'string' ? M(m) : m); me.scale.set(1, h, 1); me.position.set(x, y, z); return me; };
  const torus = (r, tube, m, x, y, z, seg = 24) => { const me = new T.Mesh(new T.TorusGeometry(r, tube, 10, seg), typeof m === 'string' ? M(m) : m); me.position.set(x, y, z); return me; };

  // ---------- objetos de la casa (con detalle) ----------
  const lampSources = [];
  function makeObj(o, fi) {
    const g = new T.Group(); let upd = null; const w = o.w || 1, h = o.h || 1, key = o.type === 'deco' ? 'd_' + o.kind : o.type, GOLD = M('#ffd23f', { m: 'metal', r: 0.25 }), STEEL = M('#a8a8b8', { m: 'metal' });
    switch (key) {
      case 'chest': { const lid = new T.Group(); lid.position.set(0, 0.5, -0.3); const arch = new T.Mesh(new T.CylinderGeometry(0.31, 0.31, 0.88, 14, 1, false, 0, Math.PI), M('#b87a3c', { m: 'wood' })); arch.rotation.z = Math.PI / 2; arch.rotation.y = Math.PI / 2; arch.position.set(0, 0, 0.3); lid.add(arch, box(0.9, 0.04, 0.04, STEEL, 0, 0.02, 0.58), box(0.1, 0.34, 0.66, STEEL, -0.25, 0.1, 0.3), box(0.1, 0.34, 0.66, STEEL, 0.25, 0.1, 0.3));
        g.add(box(0.86, 0.5, 0.62, '#8a5a2a', 0, 0.25, 0), box(0.9, 0.06, 0.66, STEEL, 0, 0.5, 0), box(0.1, 0.52, 0.66, STEEL, -0.28, 0.26, 0), box(0.1, 0.52, 0.66, STEEL, 0.28, 0.26, 0), lid); const lock = box(0.14, 0.18, 0.06, GOLD, 0, 0.44, 0.34); g.add(lock); for (const sx of [-0.4, 0.4]) for (const sz of [-0.28, 0.28]) g.add(sph(0.03, STEEL, sx, 0.52, sz));
        upd = o => { lid.rotation.x = o.opened ? -1.25 : 0; lock.visible = !o.opened; }; break; }
      case 'wardrobe': { const dl = new T.Group(), dr = new T.Group(); dl.position.set(-0.45, 0.8, 0.36); dr.position.set(0.45, 0.8, 0.36); dl.add(box(0.44, 1.5, 0.05, '#8a5a34', 0.22, 0, 0), box(0.3, 1.2, 0.03, '#6a4020', 0.22, 0, 0.03), sph(0.035, GOLD, 0.38, 0, 0.06)); dr.add(box(0.44, 1.5, 0.05, '#8a5a34', -0.22, 0, 0), box(0.3, 1.2, 0.03, '#6a4020', -0.22, 0, 0.03), sph(0.035, GOLD, -0.38, 0, 0.06));
        g.add(box(0.98, 1.7, 0.7, '#6a4020', 0, 0.9, 0), box(1.06, 0.1, 0.78, '#5a3418', 0, 1.78, 0), box(0.94, 0.1, 0.74, '#5a3418', 0, 0.05, 0), box(0.06, 0.1, 0.06, '#3a2210', -0.44, 0.0, 0.3), box(0.06, 0.1, 0.06, '#3a2210', 0.44, 0.0, 0.3), box(0.8, 1.5, 0.02, '#0a0604', 0, 0.8, 0.33), dl, dr);
        upd = o => { dl.rotation.y = o.opened ? -1.7 : 0; dr.rotation.y = o.opened ? 1.7 : 0; }; break; }
      case 'fridge': { const door = new T.Group(); door.position.set(-0.4, 0.9, 0.4); door.add(box(0.84, 1.5, 0.08, M('#eef6fa', { m: 'gloss' }), 0.42, 0, 0), box(0.04, 0.5, 0.06, STEEL, 0.74, 0.2, 0.07), box(0.04, 0.3, 0.06, STEEL, 0.74, -0.5, 0.07), box(0.12, 0.12, 0.02, '#e04a6a', 0.2, 0.3, 0.05), box(0.1, 0.1, 0.02, '#ffd23f', 0.5, 0.45, 0.05)); g.add(box(0.9, 1.75, 0.8, M('#dce8f0', { m: 'gloss' }), 0, 0.88, 0), door, box(0.8, 1.45, 0.02, '#cfe0e8', 0, 0.9, 0.36)); upd = o => { door.rotation.y = o.opened ? -1.3 : 0; }; break; }
      case 'safe': case 'vault': { const gold = key === 'safe', dr = new T.Group(); dr.position.set(-0.4, 0.62, 0.42); const dm = M(gold ? '#c8a040' : '#8a8aa4', { m: 'metal', r: 0.3 }); dr.add(cyl(0.34, 0.34, 0.1, dm, 0.4, 0, 0.02, 24), box(0.1, 0.1, 0.1, STEEL, 0.4, 0, 0.1), torus(0.2, 0.025, GOLD, 0.4, 0, 0.1), box(0.08, 0.4, 0.04, GOLD, 0.4, 0, 0.12), box(0.4, 0.04, 0.04, GOLD, 0.4, 0, 0.12)); dr.children[0].rotation.x = Math.PI / 2; dr.children[3].rotation.z = 0.3;
        g.add(box(0.98, 1.3, 0.84, M(gold ? '#a88830' : '#5a5a72', { m: 'metal', r: 0.35 }), 0, 0.68, 0), box(0.86, 1.1, 0.04, '#07060c', 0, 0.68, 0.4), dr); for (const sy of [0.2, 1.1]) for (const sx of [-0.4, 0.4]) g.add(sph(0.04, STEEL, sx, sy, 0.43)); upd = (o, t) => { dr.rotation.y = o.opened ? -1.8 : 0; }; break; }
      case 'mechbox': { const lid = new T.Group(); lid.position.set(0, 0.62, -0.3); lid.add(box(0.9, 0.12, 0.64, '#5a5a72', 0, 0.06, 0.3)); const gear = new T.Group(); gear.position.set(0, 0.34, 0.32); gear.add(cyl(0.2, 0.2, 0.06, STEEL, 0, 0, 0, 20)); for (let i = 0; i < 10; i++) { const tooth = box(0.07, 0.07, 0.07, STEEL, Math.cos(i * 0.628) * 0.24, 0, Math.sin(i * 0.628) * 0.24); tooth.rotation.y = -i * 0.628; gear.add(tooth); } gear.children[0].rotation.x = 0; gear.rotation.x = Math.PI / 2;
        g.add(box(0.9, 0.64, 0.64, '#6a6a82', 0, 0.32, 0), lid, gear, box(0.8, 0.04, 0.04, '#e04040', 0, 0.55, 0.33)); for (const sx of [-0.4, 0.4]) for (const sy of [0.1, 0.5]) g.add(sph(0.025, '#222', sx, sy, 0.33));
        upd = (o, t) => { lid.rotation.x = o.opened ? -1.2 : 0; gear.visible = !o.opened; if (!o.opened) gear.rotation.z = t * 0.7; }; break; }
      case 'crate': { const lid = new T.Group(); lid.position.set(0, 0.78, 0); lid.add(box(0.94, 0.1, 0.7, '#9a7038', 0, 0.05, 0), box(0.1, 0.12, 0.72, '#7a5a2c', -0.3, 0.06, 0), box(0.1, 0.12, 0.72, '#7a5a2c', 0.3, 0.06, 0)); g.add(box(0.9, 0.8, 0.66, '#b8884c', 0, 0.4, 0), box(0.94, 0.1, 0.7, '#7a5a2c', 0, 0.25, 0), box(0.94, 0.1, 0.7, '#7a5a2c', 0, 0.6, 0), lid); for (const sx of [-0.4, 0.4]) for (const sy of [0.25, 0.6]) g.add(sph(0.03, '#3a3a3a', sx, sy, 0.35)); upd = o => { lid.rotation.z = o.opened ? 0.7 : 0; lid.position.x = o.opened ? 0.35 : 0; lid.position.y = o.opened ? 0.95 : 0.78; }; break; }
      case 'microwave': { g.add(box(0.94, 0.84, 0.66, '#5a3a20', 0, 0.42, 0), box(0.98, 0.04, 0.7, '#3a2410', 0, 0.86, 0)); const door = new T.Group(); door.position.set(-0.28, 1.1, 0.28); door.add(box(0.54, 0.4, 0.04, '#1a2a38', 0.27, 0, 0)); const lamp = box(0.5, 0.36, 0.02, emi('#ffe890'), 0.27, 0, -0.02); g.add(box(0.84, 0.48, 0.54, M('#c8c8d8', { m: 'gloss' }), 0, 1.12, 0), door, lamp, sph(0.04, '#e04040', 0.36, 1.2, 0.28), sph(0.04, '#3ae07a', 0.36, 1.06, 0.28)); upd = (o, t) => { door.rotation.y = o.opened ? -1.7 : 0; lamp.visible = !!o.opened; lamp.material = emi(o.cooking ? ((t * 6 | 0) % 2 ? '#ff9a3a' : '#ffd23f') : (o.food ? '#e08a3a' : '#fff6c0')); }; break; }
      case 'recharge': { const glow = box(0.7, 0.04, 0.7, emi('#3ae07a'), 0, 0.14, 0), ring = torus(0.4, 0.04, emi('#3ae07a'), 0, 0.16, 0, 28), bolt = new T.Group(); ring.rotation.x = Math.PI / 2; bolt.add(box(0.12, 0.4, 0.1, emi('#ffd23f')), box(0.3, 0.1, 0.1, emi('#ffd23f'), 0, 0.2, 0)); bolt.position.y = 0.6; g.add(box(0.96, 0.12, 0.96, '#3a3a4c', 0, 0.06, 0), glow, ring, bolt); upd = (o, t) => { const on = !_S.blackout; glow.material = emi(on ? (_S.p.charging && (t * 8 | 0) % 2 ? '#ffd23f' : '#3ae07a') : '#2a2a30'); ring.material = glow.material; bolt.visible = on; bolt.position.y = 0.6 + Math.sin(t * 3) * 0.06; bolt.rotation.y = t; }; break; }
      case 'table': g.add(box(1.0, 0.1, 0.92, '#b88450', 0, 0.86, 0), box(1.0, 0.06, 0.92, '#7a5030', 0, 0.78, 0)); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.1, 0.82, 0.1, '#7a5030', sx * 0.42, 0.41, sz * 0.38)); g.add(box(0.3, 0.1, 0.18, STEEL, -0.2, 0.96, 0.05), box(0.04, 0.2, 0.04, '#7a5030', 0.3, 1.0, 0.1), box(0.2, 0.05, 0.05, STEEL, 0.3, 1.1, 0.1), cyl(0.06, 0.06, 0.2, '#e04040', 0.0, 1.0, -0.2, 10), sph(0.05, emi('#fff6c0'), 0.4, 1.4, -0.3)); g.add(box(0.8, 0.5, 0.04, '#4a3420', 0, 1.3, -0.44), box(0.5, 0.04, 0.04, STEEL, 0, 1.45, -0.4)); break;
      case 'computer': { const scr = box(0.56, 0.4, 0.03, emi('#46f09a'), 0, 1.15, 0.02); g.add(box(0.95, 0.8, 0.64, '#4a4a60', 0, 0.4, 0), box(0.7, 0.5, 0.1, '#16161e', 0, 1.15, -0.06), scr, box(0.5, 0.04, 0.2, '#2a2a38', 0, 0.82, 0.2), box(0.1, 0.18, 0.1, '#16161e', 0, 0.92, -0.04)); const L = new T.PointLight(0x46f09a, 0.5, 4, 1.6); L.position.set(0, 1.1, 0.5); g.add(L); upd = (o, t) => { const bo = _S.blackout; scr.material = emi(bo ? ((t * 3 | 0) % 2 ? '#ff5050' : '#501818') : '#46f09a'); L.color.set(bo ? 0xff3030 : 0x46f09a); L.intensity = bo ? 0.8 : 0.5; }; break; }
      case 'exit': { const sh = box(1.0, 2.1, 0.16, M('#8a8a9a', { m: 'metal', r: 0.5 }), 0, 1.05, 0.04); const led = box(0.2, 0.08, 0.02, emi('#e04040'), 0.62, 1.3, 0.2); g.add(box(1.25, 2.3, 0.4, '#3a3a50', 0, 1.15, 0), box(0.94, 2.0, 0.1, M('#6a6a80', { m: 'metal' }), 0, 1.0, 0.06), sh, box(0.3, 0.44, 0.1, '#14141a', 0.62, 1.1, 0.22), led); for (let i = 0; i < 12; i++) sh.add(box(1.02, 0.03, 1.4, '#555566', 0, (i - 6) * 0.17, 0.0)); for (let k = 0; k < 6; k++) g.add(box(0.05, 0.05, 0.02, emi('#fff'), 0.57 + (k % 2) * 0.1, 1.0 + (k >> 1) * 0.1, 0.28)); upd = o => { sh.visible = !o.shutter; led.material = emi(o.escape ? '#3ae07a' : (o.powered ? '#ffd23f' : '#e04040')); }; break; }
      case 'stairs': { for (let i = 0; i < 6; i++) g.add(box(0.94, 0.14 + i * 0.17, 0.2, '#8a6a4a', 0, (0.14 + i * 0.17) / 2, o.to === 1 ? 0.45 - i * 0.2 : -0.45 + i * 0.2)); g.add(box(0.06, 1.1, 0.06, '#5a3a20', -0.46, 0.6, -0.4), box(0.06, 1.1, 0.06, '#5a3a20', 0.46, 0.6, -0.4), box(0.06, 0.06, 1.0, '#5a3a20', -0.46, 1.15, 0), box(0.06, 0.06, 1.0, '#5a3a20', 0.46, 1.15, 0)); const ar = new T.Group(); ar.add(box(0.18, 0.18, 0.18, emi('#ffd23f'))); ar.position.y = 1.9; g.add(ar); upd = (o, t) => { ar.position.y = 1.9 + Math.sin(t * 3) * 0.1; ar.rotation.y = t * 2; }; break; }
      case 'gap': { g.add(box(w, 0.012, h, emi('#010005'), 0, 0.014, 0)); for (let i = 0; i < 4; i++) g.add(box(w - i * 0.35, 0.012, h - i * 0.35, emi('#' + ['0a0414', '060210', '03010a', '010005'][i]), 0, 0.016 + i * 0.002, 0)); for (let i = 0; i < 18; i++) { const sh = box(rnd(0.14, 0.3), 0.06, rnd(0.1, 0.24), '#2a1a10', rnd(-w / 2, w / 2), 0.0, rnd(-h / 2, h / 2)); sh.rotation.y = rnd(0, 3); sh.position.y = rnd(-0.1, 0.02); if (Math.abs(sh.position.x) > w / 2 - 0.2 || Math.abs(sh.position.z) > h / 2 - 0.2) g.add(sh); } const br = new T.Group(); for (const sz of [-0.5, 0.5]) br.add(box(w + 0.6, 0.1, 0.1, '#6a4a2a', 0, 0.2, sz)); for (let i = 0; i < w * 5; i++) br.add(box(0.1, 0.06, 1.1, '#c8935a', -w / 2 + 0.08 + i * 0.2, 0.2, 0)); br.visible = false; g.add(br); const dg = new T.PointLight(0x6a2aff, 0.8, 5, 1.6); dg.position.set(0, -0.3, 0); g.add(dg); upd = o => { br.visible = !!o.bridged; dg.visible = !o.bridged; }; break; }
      case 'fusebox': { const l1 = box(0.12, 0.1, 0.03, emi('#e04040'), 0, 1.4, 0.16), pw = []; g.add(box(0.7, 1.0, 0.28, M('#5a5a70', { m: 'metal' }), 0, 1.0, 0), box(0.58, 0.82, 0.04, '#24242e', 0, 1.0, 0.14), l1); for (let k = 0; k < 3; k++) { const s = box(0.5, 0.1, 0.04, '#0a0a10', 0, 0.8 + k * 0.2, 0.17), l = box(0.08, 0.06, 0.02, emi('#e04040'), 0.2, 0.8 + k * 0.2, 0.2); g.add(s, l); pw.push(l); } upd = o => { l1.material = emi(o.powered ? '#3ae07a' : '#e04040'); pw.forEach(l => { l.material = emi(o.powered ? '#3ae07a' : '#e04040'); }); }; break; }
      case 'd_sofa': g.add(box(w - 0.1, 0.45, 0.9, '#3a62b0', 0, 0.28, 0), box(w - 0.1, 0.7, 0.24, '#2a4a90', 0, 0.72, -0.34), box(0.22, 0.65, 0.9, '#2a4a90', -w / 2 + 0.11, 0.42, 0), box(0.22, 0.65, 0.9, '#2a4a90', w / 2 - 0.11, 0.42, 0)); for (let i = 0; i < Math.round(w); i++) g.add(box(w / Math.round(w) - 0.18, 0.18, 0.62, '#4a72c0', -w / 2 + 0.25 + (i + 0.5) * ((w - 0.5) / Math.round(w)) - 0.08, 0.52, 0.06), sph(0.2, '#c8a040', -w / 2 + 0.5 + i * 0.9, 0.78, -0.2, 0.9, 0.5)); break;
      case 'd_table': g.add(box(w - 0.1, 0.1, h - 0.14, '#b88450', 0, 0.86, 0), box(w - 0.1, 0.06, h - 0.14, '#7a5030', 0, 0.78, 0)); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.1, 0.82, 0.1, '#7a5030', sx * (w / 2 - 0.2), 0.41, sz * (h / 2 - 0.2))); if (w > 1) g.add(sph(0.12, '#c0392b', w / 2 - 0.5, 0.98, 0, 0.8), box(0.3, 0.02, 0.2, '#f4ecd8', -0.2, 0.92, 0)); break;
      case 'd_desk': g.add(box(w - 0.1, 0.1, 0.82, '#7a5030', 0, 0.78, 0), box(0.12, 0.78, 0.74, '#5a3a20', -w / 2 + 0.15, 0.39, 0), box(0.12, 0.78, 0.74, '#5a3a20', w / 2 - 0.15, 0.39, 0), box(0.3, 0.02, 0.4, '#f4ecd8', -0.3, 0.84, 0), cyl(0.04, 0.05, 0.12, '#2a2a3a', 0.5, 0.88, -0.1, 10)); break;
      case 'd_shelf': g.add(box(w - 0.1, 2.0, 0.5, '#6a4020', 0, 1.0, 0)); for (let r = 0; r < 4; r++) { g.add(box(w - 0.2, 0.04, 0.46, '#4a2a12', 0, 0.4 + r * 0.46, 0.02)); for (let k = 0; k < w * 3; k++) g.add(box(0.12 + rnd(0, 0.06), 0.28 + rnd(0, 0.08), 0.3, ['#e04040', '#4a8aff', '#ffd23f', '#3ae07a', '#c060e0', '#e08a3a'][(k + r) % 6], -w / 2 + 0.2 + k * 0.3, 0.6 + r * 0.46 - 0.04, 0.05)); } break;
      case 'd_bed': g.add(box(w - 0.1, 0.4, h - 0.1, '#7a5030', 0, 0.22, 0), box(w - 0.2, 0.22, h - 0.2, '#f0e8f8', 0, 0.5, 0), box(w - 0.1, 0.9, 0.12, '#5a3a20', 0, 0.7, -h / 2 + 0.1), box(0.7, 0.18, 0.5, '#fff', -w / 4, 0.7, -h / 2 + 0.5), box(0.7, 0.18, 0.5, '#fff', w / 4, 0.7, -h / 2 + 0.5), box(w - 0.2, 0.3, h * 0.55, '#4a88d0', 0, 0.66, h * 0.2), box(w - 0.1, 0.04, 0.3, '#7aaae8', 0, 0.84, h * 0.02)); break;
      case 'd_car': { const body = M('#c03838', { m: 'gloss' }); g.add(box(w - 0.2, 0.55, h - 0.3, body, 0, 0.55, 0), box(w * 0.42, 0.5, h - 0.5, body, -0.1, 1.05, 0), box(w * 0.38, 0.38, h - 0.58, M('#8ab8d8', { m: 'gloss', r: 0.05 }), -0.1, 1.08, 0)); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const wh = cyl(0.3, 0.3, 0.24, '#14141a', sx * (w / 2 - 0.75), 0.3, sz * (h / 2 - 0.1), 18); wh.rotation.x = Math.PI / 2; g.add(wh); const hub = cyl(0.14, 0.14, 0.26, STEEL, sx * (w / 2 - 0.75), 0.3, sz * (h / 2 - 0.1), 12); hub.rotation.x = Math.PI / 2; g.add(hub); } g.add(box(0.1, 0.18, 0.34, emi('#fff0a0'), w / 2 - 0.12, 0.62, -h / 4), box(0.1, 0.18, 0.34, emi('#fff0a0'), w / 2 - 0.12, 0.62, h / 4), box(0.1, 0.16, 0.3, emi('#ff3030'), -w / 2 + 0.12, 0.62, -h / 4), box(0.1, 0.16, 0.3, emi('#ff3030'), -w / 2 + 0.12, 0.62, h / 4)); break; }
      case 'd_plant': g.add(cyl(0.3, 0.22, 0.42, '#c8643a', 0, 0.21, 0, 14), cyl(0.28, 0.28, 0.04, '#2a1a10', 0, 0.42, 0, 14)); for (let i = 0; i < 9; i++) { const a = i * 0.7, lf = sph(0.22, '#2f9a4a', Math.cos(a) * 0.22, 0.75 + (i % 3) * 0.12, Math.sin(a) * 0.22, 1.8, 0.35); lf.rotation.y = -a; lf.rotation.z = 0.5; g.add(lf); } g.add(cyl(0.03, 0.04, 0.4, '#4a6a2a', 0, 0.6, 0, 8)); break;
      case 'd_lamp': { g.add(cyl(0.2, 0.22, 0.05, '#2a2018', 0, 0.025, 0, 14), cyl(0.04, 0.04, 1.2, M('#6a5a4a', { m: 'metal' }), 0, 0.6, 0, 10), cyl(0.32, 0.2, 0.38, emi('#ffd878'), 0, 1.35, 0, 16)); const li = { x: 0, y: 0, z: 0, f: o.f, wx: o.x + w / 2, wz: o.y + h / 2, base: 1.0 }; lampSources.push(li); break; }
      case 'd_stove': g.add(box(0.94, 0.86, 0.82, M('#9a9ab0', { m: 'metal' }), 0, 0.43, 0), box(0.8, 0.04, 0.68, '#1a1a24', 0, 0.88, 0), box(0.6, 0.34, 0.04, '#2a2a3a', 0, 0.42, 0.42), box(0.5, 0.04, 0.03, STEEL, 0, 0.62, 0.45)); for (const [sx, sz] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]]) g.add(torus(0.1, 0.02, '#111', sx, 0.9, sz, 14)); g.children.slice(-4).forEach(t2 => { t2.rotation.x = Math.PI / 2; }); break;
      case 'd_boxes': g.add(box(0.84, 0.58, 0.74, '#c8924a', 0, 0.3, 0), box(0.6, 0.42, 0.52, '#d8a25a', 0.06, 0.8, 0), box(0.1, 0.6, 0.76, '#e8c88a', 0, 0.3, 0), box(0.1, 0.44, 0.54, '#e8c88a', 0.06, 0.8, 0), box(0.5, 0.18, 0.02, '#fff', -0.1, 0.4, 0.38)); break;
      case 'd_tv': { const scr = box(w - 0.36, 0.62, 0.02, emi('#3a78c8'), 0, 1.1, 0.0); g.add(box(w - 0.1, 0.84, 0.14, '#1c1c28', 0, 1.1, -0.04), scr, box(w - 0.3, 0.5, 0.5, '#5a3a20', 0, 0.28, -0.06), box(0.4, 0.04, 0.16, '#2a2a38', 0, 0.54, 0.02)); const L = new T.PointLight(0x4a88ff, 0.7, 5, 1.6); L.position.set(0, 1.1, 0.7); g.add(L); upd = (o, t) => { const k = 0.7 + Math.sin(t * 17) * 0.15 + (Math.random() < 0.1 ? 0.25 : 0); scr.material = emi(new T.Color().setRGB(0.2 * k, 0.45 * k, 0.9 * k)); L.intensity = 0.4 + k * 0.4; }; break; }
      default: g.add(box(0.6, 0.6, 0.6, '#888', 0, 0.3, 0));
    }
    g.position.set(o.x + w / 2, 0, o.y + h / 2); g.userData.upd = upd; return g;
  }

  // ---------- personajes ----------
  function makeDoll() {
    const g = new T.Group(), porc = M('#fff0e6', { m: 'gloss', r: 0.28 }), hairM = M('#3a2258', { r: 0.6 }), dress = M('#8a2478', { r: 0.9 }), metal = M('#9a9ab4', { m: 'metal', r: 0.35 });
    const mk = (x, y) => { const pv = new T.Group(); pv.position.set(x, y, 0); return pv; };
    const lArm = mk(-0.7, 1.42), rArm = mk(0.7, 1.42), lLeg = mk(-0.22, 0.66), rLeg = mk(0.22, 0.66);
    for (const [arm, s] of [[lArm, -1], [rArm, 1]]) { arm.add(sph(0.14, '#b8b8d0', 0, 0, 0), cyl(0.07, 0.07, 0.75, metal, 0, -0.4, 0, 10), torus(0.09, 0.02, '#5a5a74', 0, -0.35, 0, 12), sph(0.13, porc, 0, -0.84, 0)); for (let i = -1; i <= 1; i++) arm.add(box(0.035, 0.12, 0.035, porc, i * 0.05, -0.97, 0.03)); arm.children[3].rotation.x = Math.PI / 2; }
    for (const leg of [lLeg, rLeg]) leg.add(cyl(0.07, 0.07, 0.6, metal, 0, -0.32, 0, 10), box(0.3, 0.14, 0.4, '#d02a6a', 0, -0.66, 0.06), box(0.3, 0.05, 0.1, '#2a1020', 0, -0.72, 0.14), sph(0.1, '#5a5a74', 0, 0, 0));
    const head = new T.Group(); head.position.set(0, 2.02, 0);
    const eyeG = [], mkEye = (x) => { const e = new T.Group(); e.position.set(x, 0.04, 0.6); e.add(sph(0.14, '#fdfdfd', 0, 0, 0), sph(0.085, emi('#c02a3a'), 0, 0, 0.09)); e.add(sph(0.04, '#000', 0, 0, 0.15), sph(0.03, '#fff', 0.03, 0.03, 0.17)); eyeG.push(e); return e; };
    head.add(sph(0.7, hairM, 0, 0.08, -0.06), sph(0.6, porc, 0, -0.03, 0.12), mkEye(-0.22), mkEye(0.22));
    const lids = [box(0.34, 0.08, 0.1, '#2a1020', -0.22, 0.2, 0.68), box(0.34, 0.08, 0.1, '#2a1020', 0.22, 0.2, 0.68)]; head.add(...lids);
    head.add(sph(0.09, '#ff9ab0', -0.36, -0.14, 0.55, 0.5), sph(0.09, '#ff9ab0', 0.36, -0.14, 0.55, 0.5), cone2(0.05, 0.12, porc, 0, -0.08, 0.76));
    const mouth = new T.Group(); mouth.position.set(0, -0.28, 0.665); mouth.add(box(0.42, 0.05, 0.03, '#5a1626')); for (let i = -3; i <= 3; i++) mouth.add(box(0.012, 0.1, 0.03, '#5a1626', i * 0.06, 0, 0.0)); head.add(mouth);
    const teeth = new T.Group(); teeth.position.set(0, -0.3, 0.675); for (let i = -3; i <= 3; i++) { teeth.add(box(0.045, 0.07, 0.03, '#f6f0e0', i * 0.055, 0.04, 0), box(0.045, 0.07, 0.03, '#f6f0e0', i * 0.055, -0.07, 0)); } teeth.add(box(0.4, 0.12, 0.02, '#1a0810', 0, -0.015, -0.01)); teeth.visible = false; head.add(teeth);
    for (const [x, y, z, rz] of [[0.18, 0.4, 0.5, 0.5], [0.22, 0.3, 0.52, -0.3]]) { const cr = box(0.012, 0.22, 0.012, '#6a5a58', x, y, z + 0.06); cr.rotation.z = rz; head.add(cr); }
    for (const s of [-1, 1]) { head.add(sph(0.2, hairM, s * 0.72, -0.1, 0, 1.6), torus(0.16, 0.04, hairM, s * 0.78, -0.35, 0, 10), sph(0.1, '#e02a70', s * 0.5, 0.6, 0.1, 0.7), sph(0.09, '#e02a70', s * 0.3, 0.72, 0.1, 0.7)); }
    head.add(sph(0.08, '#a01a50', 0, 0.68, 0.14), sph(0.075, '#e02a70', -0.24, 0.68, 0.1, 0.7), sph(0.075, '#e02a70', 0.24, 0.68, 0.1, 0.7));
    const bangs = []; for (let i = -3; i <= 3; i++) { const b = box(0.1, 0.22, 0.06, hairM, i * 0.15, 0.4, 0.55); b.rotation.x = -0.3; b.rotation.z = i * 0.05; head.add(b); bangs.push(b); }
    g.add(cyl(0.18, 0.22, 0.4, dress, 0, 1.55, 0, 16), cyl(0.2, 0.9, 1.0, dress, 0, 0.98, 0, 20), cyl(0.12, 0.12, 0.14, '#c8c8dc', 0, 1.78, 0, 12));
    for (let i = 0; i < 3; i++) g.add(torus(0.4 + i * 0.16, 0.05, '#f4e8f4', 0, 0.55 + i * 0.1 - 0.05, 0, 28)), g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    g.add(cyl(0.36, 0.5, 0.7, M('#f6ecf6'), 0, 0.85, 0.22, 16), sph(0.07, '#d02a6a', 0, 1.15, 0.46, 0.5));
    const key = new T.Group(); key.position.set(0, 1.5, -0.4); key.add(box(0.07, 0.7, 0.07, metal), torus(0.16, 0.035, metal, -0.2, 0.36, 0, 12), torus(0.16, 0.035, metal, 0.2, 0.36, 0, 12)); g.add(key);
    const aura = new T.Mesh(new T.CircleGeometry(1.1, 24), new T.MeshBasicMaterial({ color: 0xff2846, transparent: true, opacity: 0.28, depthWrite: false })); aura.rotation.x = -Math.PI / 2; aura.position.y = 0.03; g.add(aura);
    const eyeL = new T.PointLight(0xff2030, 0, 6, 1.6); eyeL.position.set(0, 2.1, 0.8); g.add(eyeL);
    const stars = new T.Group(); for (let i = 0; i < 5; i++) stars.add(box(0.12, 0.12, 0.12, emi('#ffd23f'))); stars.position.y = 3.2; g.add(stars);
    g.add(lArm, rArm, lLeg, rLeg, head);
    const root = new T.Group(); root.add(g); root.scale.setScalar(1.05);
    g.traverse(m => { if (m.isMesh && m.material !== aura.material) { m.castShadow = true; } });
    return { g: root, inner: g, lArm, rArm, lLeg, rLeg, head, eyeG, lids, mouth, teeth, aura, stars, eyeL, key };
  }
  function cone2(r, h, m, x, y, z) { const me = new T.Mesh(new T.ConeGeometry(r, h, 8), typeof m === 'string' ? M(m) : m); me.position.set(x, y, z); me.rotation.x = Math.PI / 2; return me; }
  let GHT = null;
  function makeGhost() { if (!GHT) GHT = mkTex(ghostCanvas(), 1, 1); const sp = new T.Sprite(new T.SpriteMaterial({ map: GHT, transparent: true, opacity: 0.8, depthWrite: false, fog: true })); sp.scale.set(1.5, 2.25, 1); return sp; }
  function makePlaced(q) {
    const g = new T.Group();
    switch (q.type) {
      case 'petardo': g.add(box(0.3, 0.12, 0.2, '#ff8a3a', 0, 0.08, 0), cyl(0.012, 0.012, 0.18, emi('#ffd23f'), 0, 0.2, 0, 6)); break;
      case 'trampa': g.add(torus(0.3, 0.04, '#c8a060', 0, 0.06, 0, 18), box(0.1, 0.05, 0.1, '#e8d098', 0, 0.05, 0)); g.children[0].rotation.x = Math.PI / 2; break;
      case 'mancha': { const m = new T.Mesh(new T.CircleGeometry(0.5, 18), new T.MeshStandardMaterial({ color: 0x0a0800, roughness: 0.05, metalness: 0.6 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.03; g.add(m); break; }
      case 'barricada': for (let i = 0; i < 4; i++) g.add(box(1.0, 0.28, 0.12, i % 2 ? '#9a6a38' : '#b07a44', 0, 0.2 + i * 0.3, (i % 2) * 0.05)); g.add(box(0.12, 1.3, 0.3, '#6a4020', -0.38, 0.65, 0), box(0.12, 1.3, 0.3, '#6a4020', 0.38, 0.65, 0)); break;
      case 'torreta': g.add(box(0.5, 0.2, 0.5, '#e0505a', 0, 0.1, 0), cyl(0.12, 0.12, 0.5, M('#9a9ab0', { m: 'metal' }), 0, 0.45, 0, 10), box(0.1, 0.1, 0.45, GOLDM(), 0, 0.72, 0.16)); break;
    }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
  }
  const GOLDM = () => M('#ffd23f', { m: 'metal', r: 0.3 });

  // ---------- escena ----------
  let amb, hemi, moonL, flash, flashT, poolL = [], player = null, doll = null, ghosts = [], ring = null, lureM = null, lureKey = '', placed = new Map(), vm = null, lastF = -1, dust = null, camPos = null, bob = 0, shafts = [], lampList = [];
  function clearScene() { if (!scene) return; while (scene.children.length) scene.remove(scene.children[0]); placed = new Map(); lureM = null; lureKey = ''; ghosts = []; lampSources.length = 0; shafts = []; poolL = []; }
  function build(S) {
    _S = S; clearScene(); WOODT = mkTex(woodCanvas('#d8d8d8', 4, 256, 256)); FABT = mkTex(fabricCanvas()); METT = mkTex(metalCanvas()); for (const k in MC) delete MC[k];
    BOXG = BOXG || new T.BoxGeometry(1, 1, 1); SPHG = SPHG || new T.SphereGeometry(1, 20, 14);
    scene = scene || new T.Scene(); scene.background = new T.Color(0x07040f); scene.fog = new T.FogExp2(0x0c0818, 0.07);
    amb = new T.AmbientLight(0x6a5a9a, 0.55); hemi = new T.HemisphereLight(0x8a9ad0, 0x2a1a30, 0.35); moonL = new T.DirectionalLight(0x8aa4ff, 0.35); moonL.position.set(-8, 14, -6);
    flash = new T.SpotLight(0xfff0c8, 1.6, 22, 0.55, 0.5, 1.2); flash.castShadow = !low; flash.shadow.mapSize.set(2048, 2048); flash.shadow.bias = -0.0008; flash.shadow.camera.near = 0.2; flash.shadow.camera.far = 22;
    scene.add(amb, hemi, moonL, flash, flash.target);
    for (let i = 0; i < 5; i++) { const L = new T.PointLight(0xffc880, 0, 9, 1.6); scene.add(L); poolL.push(L); }
    const wallTex = mkTex(wallCanvas()), ceilTex = mkTex(ceilingCanvas(), MW / 2, MH / 2), doorTex = mkTex(doorCanvas()), winTex = mkTex(windowCanvas());
    const wallMat = new T.MeshStandardMaterial({ map: wallTex, bumpMap: wallTex, bumpScale: 0.5, roughness: 0.92 }), ceilMat = new T.MeshStandardMaterial({ map: ceilTex, roughness: 1 }), doorMat = new T.MeshStandardMaterial({ map: doorTex, bumpMap: doorTex, bumpScale: 1, roughness: 0.7 });
    const WCOL = { '.': '#bcaed4', k: '#a0cdc4', g: '#b4bccc', r: '#dc9fae' }; built = { S, floors: [], doors: [], objs: [] };
    const shaftTex = mkTex(cvs(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(160,190,255,0.55)'); gr.addColorStop(1, 'rgba(160,190,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
    for (let f = 0; f < 2; f++) {
      const F = S.W.f[f], grp = new T.Group();
      const ft = new T.CanvasTexture(floorTexFP(F)); ft.anisotropy = 8; if ('colorSpace' in ft) ft.colorSpace = T.SRGBColorSpace;
      const floor = new T.Mesh(new T.PlaneGeometry(MW, MH), new T.MeshStandardMaterial({ map: ft, roughness: 0.7, metalness: 0.02 })); floor.rotation.x = -Math.PI / 2; floor.position.set(MW / 2, 0, MH / 2); floor.receiveShadow = true; grp.add(floor);
      const ceil = new T.Mesh(new T.PlaneGeometry(MW, MH), ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.set(MW / 2, WALLH, MH / 2); ceil.receiveShadow = true; grp.add(ceil);
      const walls = []; for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) if (F.g[j][i] === '#') walls.push([i, j]);
      const im = new T.InstancedMesh(BOXG, wallMat, walls.length), mtx = new T.Matrix4(), cc = new T.Color();
      walls.forEach(([i, j], k) => { let t = '.'; for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const c = (F.g[j + dy] || [])[i + dx]; if (c && WCOL[c]) { t = c; break; } } mtx.makeScale(1, WALLH, 1); mtx.setPosition(i + 0.5, WALLH / 2, j + 0.5); im.setMatrixAt(k, mtx); im.setColorAt(k, cc.set(WCOL[t])); });
      { const trimM = new T.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.6 }), crownM = new T.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.7 }), bb = [], cr = [];
        for (const [i, j] of walls) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const c = (F.g[j + dy] || [])[i + dx]; if (c && c !== '#' && c !== ' ') { const hz = dx === 0; bb.push([i + 0.5 + dx * 0.52, j + 0.5 + dy * 0.52, hz]); } }
        const bi = new T.InstancedMesh(BOXG, trimM, bb.length), ci = new T.InstancedMesh(BOXG, crownM, bb.length), m4 = new T.Matrix4();
        bb.forEach(([x, z, hz], k) => { m4.makeScale(hz ? 1.02 : 0.05, 0.2, hz ? 0.05 : 1.02); m4.setPosition(x, 0.1, z); bi.setMatrixAt(k, m4); m4.makeScale(hz ? 1.02 : 0.12, 0.12, hz ? 0.12 : 1.02); m4.setPosition(x, WALLH - 0.06, z); ci.setMatrixAt(k, m4); });
        bi.receiveShadow = true; ci.receiveShadow = true; grp.add(bi, ci); }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; grp.add(im);
      // ventanas con luz de luna, cuadros y lámparas de techo
      F.rooms.forEach((r, ri) => {
        if (r.w < 4) return; const z = r.y - 0.02;
        for (let x = r.x + 1; x < r.x + r.w - 1; x += 4) { const kind = (x * 3 + r.y) % 3; if (kind === 0) { const win = new T.Mesh(new T.PlaneGeometry(1.1, 1.4), new T.MeshBasicMaterial({ map: winTex })); win.position.set(x + 0.5, 1.6, z); grp.add(win); const sh = new T.Mesh(new T.PlaneGeometry(1.3, 3.2), new T.MeshBasicMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.35, side: T.DoubleSide })); sh.position.set(x + 0.5, 1.4, z + 1.3); sh.rotation.x = -0.55; grp.add(sh); shafts.push(sh); } else if (kind === 1) { const col = ['#d04a6a', '#4aa8d0', '#6ac04a'][(x + r.y) % 3]; grp.add(box(0.8, 0.6, 0.05, '#5a3a20', x + 0.5, 1.7, z), box(0.66, 0.46, 0.02, col, x + 0.5, 1.7, z + 0.03)); } }
        const cx = r.x + r.w / 2, cz = r.y + r.h / 2; grp.add(cyl(0.012, 0.012, 0.3, '#222', cx, WALLH - 0.15, cz, 4), cyl(0.28, 0.2, 0.12, emi('#ffe8b0'), cx, WALLH - 0.35, cz, 14)); lampSources.push({ f, wx: cx, wz: cz, base: 0.55, ceil: true });
      });
      for (const o of F.objs) {
        if (o.type === 'door') { const dg = new T.Group(); dg.add(box(1, WALLH, 1, doorMat, 0, WALLH / 2, 0), box(0.2, 0.2, 1.1, M(KEY_COLORS[o.id], { m: 'metal', r: 0.2 }), 0.3, 1.05, 0), box(1.06, 0.1, 1.04, '#3a2412', 0, 2.1, 0)); dg.position.set(o.x + 0.5, 0, o.y + 0.5); dg.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); grp.add(dg); built.doors.push({ g: dg, o }); }
        else { const before = lampSources.length; const m = makeObj(o, f); for (let k = before; k < lampSources.length; k++) lampSources[k].f = f; m.traverse(x => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } }); grp.add(m); built.objs.push({ o, g: m, upd: m.userData.upd }); }
      }
      scene.add(grp); built.floors.push(grp);
    }
    player = { yaw: 0 }; doll = makeDoll(); avatar = makeAvatar(); scene.add(avatar.g); scene.add(doll.g);
    for (let i = 0; i < 3; i++) { const gh = makeGhost(); gh.visible = false; scene.add(gh); ghosts.push(gh); }
    ring = new T.Mesh(new T.RingGeometry(0.92, 1, 48), new T.MeshBasicMaterial({ color: 0xff3c3c, transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; ring.visible = false; scene.add(ring);
    // polvo flotante
    const dp = new Float32Array(300 * 3); for (let i = 0; i < dp.length; i++) dp[i] = Math.random() * 6 - 3; const dg2 = new T.BufferGeometry(); dg2.setAttribute('position', new T.BufferAttribute(dp, 3)); dust = new T.Points(dg2, new T.PointsMaterial({ color: 0xffeedd, size: 0.025, transparent: true, opacity: 0.5, depthWrite: false })); scene.add(dust);
    // mano con linterna (pegada a la cámara)
    vm = new T.Group(); const pal = Spr.PAL[CFG.cls % Spr.PAL.length], sleeve = M(pal.shirt, { r: 0.9 }), skin = M(pal.skin, { r: 0.6 });
    const arm = new T.Group(); arm.add(box(0.07, 0.065, 0.12, sleeve, 0.01, -0.1, -0.02), sph(0.045, skin, 0.0, -0.065, -0.1, 1, 1.2), box(0.02, 0.03, 0.08, skin, 0.045, -0.05, -0.12)); arm.position.set(0, 0, 0);
    const fl = new T.Group(); fl.add(cyl(0.035, 0.03, 0.26, M('#202028', { m: 'metal', r: 0.3 }), 0, 0, 0, 14), cyl(0.05, 0.04, 0.07, M('#d8b028', { m: 'metal', r: 0.3 }), 0, 0.15, 0, 14), cyl(0.045, 0.045, 0.01, emi('#fff6d0'), 0, 0.185, 0, 14), box(0.012, 0.03, 0.012, '#c04040', 0.035, 0.02, 0)); fl.rotation.x = Math.PI / 2; fl.position.set(0, -0.03, -0.2);
    const beam = new T.Mesh(new T.ConeGeometry(0.5, 3, 16, 1, true), new T.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); beam.rotation.x = -Math.PI / 2; beam.position.set(0, -0.02, -1.7);
    vm.add(arm, fl, beam); vm.scale.setScalar(0.72); vm.position.set(0.27, -0.25, -0.2); vm.userData = { arm, fl, beam }; cam.add(vm); scene.add(cam);
    camPos = new T.Vector3(S.p.x / 16, 1.5, S.p.y / 16); lastF = S.p.f; built.cls = CFG.cls;
  }

  let avatar = null;
  function makeAvatar() {
    const pal = Spr.PAL[CFG.cls % Spr.PAL.length], sk = M(pal.skin, { r: 0.6 }), sh = M(pal.shirt, { r: 0.85 }), pa = M('#2a3050', { r: 0.9 }), ha = M(pal.hair, { r: 0.8 }); const g = new T.Group(), inner = new T.Group(); g.add(inner);
    const mkLeg = x => { const l = new T.Group(); l.add(box(0.15, 0.5, 0.17, pa, 0, -0.25, 0), box(0.17, 0.08, 0.24, '#1a1a22', 0, -0.52, 0.03)); l.position.set(x, 0.58, 0); inner.add(l); return l; };
    const lL = mkLeg(-0.11), rL = mkLeg(0.11);
    const mkArm = x => { const a = new T.Group(); a.add(box(0.12, 0.4, 0.13, sh, 0, -0.18, 0), sph(0.065, sk, 0, -0.42, 0)); a.position.set(x, 1.02, 0); inner.add(a); return a; };
    const lA = mkArm(-0.26), rA = mkArm(0.26);
    inner.add(box(0.4, 0.46, 0.24, sh, 0, 0.82, 0), box(0.41, 0.07, 0.25, pa, 0, 0.6, 0), sph(0.21, sk, 0, 1.2, 0), sph(0.215, ha, 0, 1.26, -0.03, 0.8, 0.95), box(0.03, 0.04, 0.02, '#111', -0.07, 1.2, 0.19), box(0.03, 0.04, 0.02, '#111', 0.07, 1.2, 0.19));
    const hat = (typeof CLASSES !== 'undefined' && CLASSES[CFG.cls]) ? CLASSES[CFG.cls].hat : ''; if (hat) inner.add(cyl(0.23, 0.23, 0.08, M(CLASSES[CFG.cls].c || '#d8b028'), 0, 1.38, 0, 16));
    const fl = new T.Group(); fl.add(cyl(0.035, 0.03, 0.22, M('#202028', { m: 'metal', r: 0.3 }), 0, 0, 0, 12), cyl(0.05, 0.04, 0.06, M('#d8b028', { m: 'metal', r: 0.3 }), 0, 0.13, 0, 12), cyl(0.045, 0.045, 0.01, emi('#fff6d0'), 0, 0.165, 0, 12)); fl.rotation.x = Math.PI / 2; fl.position.set(0, -0.42, 0.14); rA.add(fl); rA.rotation.x = -1.4;
    g.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
    return { g, inner, lL, rL, lA, rA, ph: 0 };
  }
  // ---------- dibujo ----------
  // calidad automática: si va lento, se apagan las sombras y baja la resolución
  const TPS = false; let camD = 3.3, lastT = 0, ema = 16, frames = 0, low = /lowfp/.test(location.search);
  function lowQ() { low = true; ren.setSize(640, 360, false); ren.shadowMap.enabled = false; if (flash) flash.castShadow = false; if (scene) scene.traverse(o => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; }); } }); }
  function draw(S) {
    if (!init()) return; const nowT = performance.now(); if (lastT) { ema += (Math.min(200, nowT - lastT) - ema) * 0.05; frames++; if (!low && frames > 150 && ema > 42) lowQ(); } lastT = nowT; if (low && !ren.__lowSet) { ren.__lowSet = true; ren.setSize(640, 360, false); ren.shadowMap.enabled = false; } if (!built || built.S !== S || built.cls !== CFG.cls) { build(S); } _S = S;
    const p = S.p, e = S.e, t = G.t, px = p.x / 16, pz = p.y / 16, bo = S.blackout;
    built.floors.forEach((fg, i) => { fg.visible = i === p.f; });
    for (const d of built.doors) d.g.visible = !d.o.removed && d.o.f === p.f;
    for (const ob of built.objs) if (ob.o.f === p.f && ob.upd) ob.upd(ob.o, t);
    // balanceo al caminar
    if (p.moving) bob += 0.2; const bobY = p.moving ? Math.sin(bob * 1.9) * 0.035 : Math.sin(t * 1.2) * 0.006, bobX = p.moving ? Math.cos(bob * 0.95) * 0.025 : 0;
    let eyeY = 1.5 + bobY, roll = bobX * 0.4, yaw = p.yaw, pitch = p.pitch;
    if (p.dead) { eyeY = 0.45; roll = 0.9; pitch = -0.1; }
    if (p.held) { const dx = e.x / 16 - px, dz = e.y / 16 - pz, ty = Math.atan2(dz, dx); let d = ty - yaw; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; p.yaw += d * 0.2; yaw = p.yaw; pitch += (0.1 - pitch) * 0.1; eyeY -= 0.1; }
    const sh = S.shake > 0 ? S.shake * 0.12 : 0;
    if (!TPS) { cam.position.set(px + (Math.random() - 0.5) * sh, eyeY, pz + (Math.random() - 0.5) * sh); cam.rotation.order = 'YXZ'; cam.rotation.y = -yaw - Math.PI / 2; cam.rotation.x = pitch; cam.rotation.z = roll; avatar.g.visible = false; }
    else {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), solF = S.W.f[p.f].sol;
    let dist = 3.3 - Math.max(0, pitch) * 1.2 + (p.moving ? 0 : 0); const camH = clampN(1.9 - pitch * 1.6, 0.7, 2.45);
    // la cámara no atraviesa paredes
    let ok2 = dist; for (let k = 0.4; k <= dist; k += 0.15) { const cx = px - cy * k - sy * 0.45 * Math.min(1, k / 1.2), cz = pz - sy * k + cy * 0.45 * Math.min(1, k / 1.2), tx = Math.floor(cx), tz = Math.floor(cz); if (!solF[tz] || solF[tz][tx] || solF[tz][tx] === undefined) { ok2 = Math.max(0.35, k - 0.3); break; } }
    camD += (ok2 - camD) * (ok2 < camD ? 0.5 : 0.08); const sd = camD / dist, rx = 0.45 * Math.min(1, camD / 1.2);
    cam.position.set(px - cy * camD - sy * rx + (Math.random() - 0.5) * sh, p.dead ? 1.2 : camH * (0.55 + 0.45 * sd), pz - sy * camD + cy * rx + (Math.random() - 0.5) * sh);
    cam.up.set(0, 1, 0); cam.lookAt(px + cy * 4, p.dead ? 0.3 : 1.15 + pitch * 3.2, pz + sy * 4); cam.rotation.z += roll * 0.0;
    // avatar del jugador
    const A = avatar; A.g.position.set(px, 0, pz); A.g.rotation.y = -yaw + Math.PI / 2; A.g.visible = true;
    if (p.moving) A.ph += 0.22; const sw = p.moving ? Math.sin(A.ph) * 0.7 : 0; A.lL.rotation.x = sw; A.rL.rotation.x = -sw; A.lA.rotation.x = p.held ? -0.6 : 0.5 * Math.sin(A.ph + 3) * (p.moving ? 1 : 0); A.rA.rotation.x = -1.4 + pitch * 0.6; A.inner.position.y = p.moving ? Math.abs(Math.sin(A.ph)) * 0.04 : Math.sin(t * 1.4) * 0.006; if (p.dead) { A.g.rotation.x = -1.4; A.g.position.y = 0.2; } else A.g.rotation.x = 0; }
    // muñeca
    const D = doll; D.g.visible = e.f === p.f;
    if (D.g.visible) {
      D.g.position.set(e.x / 16, 0, e.y / 16); const ef = Math.atan2(e.fx, e.fy); let d2 = ef - D.g.rotation.y; while (d2 > Math.PI) d2 -= 2 * Math.PI; while (d2 < -Math.PI) d2 += 2 * Math.PI; D.g.rotation.y += d2 * 0.25;
      const mv = e.path.length && e.stun <= 0 && e.state !== 'eat', s2 = mv ? Math.sin(e.anim * 8) * 0.75 : 0; D.lLeg.rotation.x = s2; D.rLeg.rotation.x = -s2; D.lArm.rotation.x = -s2 * 0.7; D.rArm.rotation.x = s2 * 0.7;
      const stunned = e.stun > 0 || e.state === 'eat', angry = e.state === 'chase' || e.state === 'grab', dist = Math.hypot(e.x / 16 - px, e.y / 16 - pz);
      D.inner.position.y = mv ? Math.abs(Math.sin(e.anim * 8)) * 0.05 : Math.sin(t * 2.5) * 0.04; D.inner.rotation.z = stunned ? Math.sin(t * 8) * 0.14 : 0;
      // la cabeza sigue al jugador
      const rel = Math.atan2(px - e.x / 16, pz - e.y / 16) - D.g.rotation.y; let r2 = rel; while (r2 > Math.PI) r2 -= 2 * Math.PI; while (r2 < -Math.PI) r2 += 2 * Math.PI; D.head.rotation.y += (clampN(r2, -1.1, 1.1) * (e.state === 'patrol' && dist > 8 ? 0.2 : 1) - D.head.rotation.y) * 0.12; D.head.rotation.z = stunned ? 0.35 : Math.sin(t * 1.1) * 0.05;
      D.eyeG.forEach(ey => { ey.children[1].material = emi(stunned ? '#ff5a5a' : angry ? '#ff1a1a' : '#c02a3a'); ey.scale.setScalar(angry ? 1.12 : 1); }); D.lids.forEach((l, i) => { l.rotation.z = (i ? -1 : 1) * (angry ? -0.45 : 0.08); l.position.y = angry ? 0.22 : 0.2; l.visible = !stunned; });
      D.teeth.visible = angry; D.mouth.visible = !angry; D.aura.visible = angry; D.aura.scale.setScalar(1 + Math.sin(t * 10) * 0.08); D.stars.visible = stunned; D.stars.rotation.y = t * 5; D.stars.children.forEach((c, i) => c.position.set(Math.cos(i * 1.256) * 0.6, Math.sin(t * 6 + i) * 0.1, Math.sin(i * 1.256) * 0.6)); D.key.rotation.z = t * 1.5;
      D.eyeL.intensity = angry ? 1.2 : 0.25; D.inner.scale.setScalar(e.blind > 0 ? 0.92 : 1);
    }
    // fantasmas
    ghosts.forEach((gm, i) => { const gh = S.ghosts[i]; gm.visible = !!gh && gh.f === p.f; if (gm.visible) { gm.position.set(gh.x / 16, 1.15 + Math.sin(t * 3 + gh.ph) * 0.18, gh.y / 16); gm.material.opacity = 0.85 * gh.a; } });
    // radar
    ring.visible = e.f === p.f && e.ring > 0; if (ring.visible) { const r = e.ring / 1.2 * S.df.radarR / 16; ring.position.set(e.x / 16, 0.06, e.y / 16); ring.scale.set(r, r, r); ring.material.opacity = Math.max(0, 1 - e.ring / 1.2) * 0.9; }
    // objetos colocados y señuelo
    const seen = new Set();
    for (const q of S.placed) { if (q.f !== p.f) continue; seen.add(q); let m = placed.get(q); if (!m) { m = makePlaced(q); m.position.set(q.type === 'barricada' ? q.tx + 0.5 : q.x / 16, 0, q.type === 'barricada' ? q.ty + 0.5 : q.y / 16); scene.add(m); placed.set(q, m); } }
    for (const [q, m] of placed) if (!seen.has(q)) { scene.remove(m); placed.delete(q); }
    const L = S.lure && S.lure.f === p.f ? S.lure : null, lk = L ? L.type : '';
    if (lk !== lureKey) { if (lureM) scene.remove(lureM); lureM = null; lureKey = lk; if (L) { lureM = new T.Group(); if (L.type === 'pizza') lureM.add(cyl(0.32, 0.32, 0.05, '#e0a040', 0, 0.05, 0, 20), cyl(0.27, 0.27, 0.06, '#d04030', 0, 0.07, 0, 20), sph(0.05, '#fff0a0', 0.1, 0.12, 0.05, 0.4), sph(0.05, '#fff0a0', -0.1, 0.12, -0.08, 0.4)); else lureM.add(box(0.5, 0.35, 0.4, '#b05ac0', 0, 0.2, 0), sph(0.08, emi('#ffd23f'), 0, 0.5, 0)); scene.add(lureM); } }
    if (lureM) lureM.position.set(L.x / 16, 0, L.y / 16);
    // luces
    amb.intensity += ((bo ? 0.1 : 0.55) - amb.intensity) * 0.1; hemi.intensity = bo ? 0.08 : 0.35; moonL.intensity = bo ? 0.1 : 0.35; scene.fog.density = bo ? 0.12 : 0.07;
    if (S.flick > 0) { amb.intensity *= 0.4; hemi.intensity *= 0.4; }
    const beam = p.beam > 0, ang = yaw, dirx = Math.cos(ang) * Math.cos(pitch), dirz = Math.sin(ang) * Math.cos(pitch), diry = Math.sin(pitch);
    const fy = TPS ? 1.0 : eyeY - 0.1; flash.position.set(px + dirx * 0.3, fy, pz + dirz * 0.3); flash.target.position.set(px + dirx * 5, fy + diry * 5, pz + dirz * 5); flash.intensity = beam ? 9 * Math.min(1, p.beam / 0.35) : (bo ? 3.2 : 1.4); flash.angle = beam ? 0.6 : 0.5; flash.color.set(beam ? 0xffffff : 0xffe0a8);
    vm.userData.beam.material.opacity = beam ? 0.18 * Math.min(1, p.beam / 0.35) : 0; vm.userData.fl.children[2].material = emi(beam ? '#ffffff' : '#ffe6a0');
    vm.position.y = -0.25 + (p.moving ? Math.sin(bob * 1.9) * 0.012 : Math.sin(t * 1.5) * 0.004); vm.position.x = 0.27 + (p.moving ? Math.cos(bob * 0.95) * 0.012 : 0); vm.rotation.x = p.boost > 0 ? -0.08 : 0; vm.visible = !TPS && !p.dead;
    // luces de lámparas más cercanas
    const cands = lampSources.filter(l => l.f === p.f).map(l => ({ l, d: Math.hypot(l.wx - px, l.wz - pz) })).sort((a, b) => a.d - b.d);
    poolL.forEach((pl, i) => { const c = cands[i]; if (!c || c.d > 14) { pl.intensity = 0; return; } const fl2 = 0.88 + Math.sin(t * 9 + c.l.wx * 3) * 0.08 + (Math.random() < 0.02 ? 0.2 : 0); pl.position.set(c.l.wx, c.l.ceil ? WALLH - 0.5 : 1.5, c.l.wz); pl.intensity = (bo ? 0.08 : c.l.base * 1.4) * fl2; pl.color.set(c.l.ceil ? 0xffe0a0 : 0xffc070); });
    // polvo
    dust.position.set(px, 1.5, pz); dust.rotation.y = t * 0.02; dust.material.opacity = 0.35 + Math.sin(t) * 0.1;
    shafts.forEach(s => { s.material.opacity = (bo ? 0.5 : 0.3) + Math.sin(t * 0.7 + s.position.x) * 0.05; });
    ren.render(scene, cam);
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const project = (x, y, h = 0.6) => { if (!cam) return [-99, -99]; const v = new T.Vector3(x / 16, h, y / 16).project(cam); return v.z > 1 ? [-99, -99] : [(v.x * 0.5 + 0.5) * 320, (-v.y * 0.5 + 0.5) * 180]; };
  const show = on => { const c = document.getElementById('fp'); if (c) c.style.display = on ? 'block' : 'none'; };
  return { init, draw, project, show, dbg: () => ({ scene, cam, vm }), get ok() { return ok || (T && init()); } };
})();
