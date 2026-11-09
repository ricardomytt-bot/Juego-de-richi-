'use strict';
// ============ MENÚ NUEVO: principal, modo historia, multijugador (sala de espera) y ajustes ============
const UI = {
  hits: [], foc: [],
  reset() { this.hits.length = 0; this.foc.length = 0; },
  // botón con relieve; o: { sel, fn, adj, icon, sub, disabled, primary, small, focus }
  btn(g, x, y, w, h, label, o = {}) {
    const dis = o.disabled, sel = !!o.sel && !dis, pr = o.primary;
    const top = dis ? '#4a4660' : sel ? '#ffe27a' : pr ? '#ff9ad0' : '#7a6ae0', bot = dis ? '#2e2a44' : sel ? '#e8a020' : pr ? '#c0407a' : '#3a2a8a', tc = dis ? '#7a7690' : sel ? '#2a1400' : '#fff';
    R(g, x + 2, y + 3, w, h, 'rgba(0,0,0,0.5)'); R(g, x, y, w, h, '#10081c'); R(g, x + 1, y + 1, w - 2, h - 2, bot); R(g, x + 1, y + 1, w - 2, (h - 2) >> 1, top); R(g, x + 1, y + 1, w - 2, 1, 'rgba(255,255,255,0.55)'); R(g, x + 1, y + h - 2, w - 2, 1, 'rgba(0,0,0,0.35)');
    if (sel) { R(g, x - 2, y - 2, w + 4, 2, '#fff6a0'); R(g, x - 2, y + h, w + 4, 2, '#fff6a0'); R(g, x - 2, y, 2, h, '#fff6a0'); R(g, x + w, y, 2, h, '#fff6a0'); }
    const ix = x + 8; if (o.icon) { o.icon(g, ix, y + ((h - 9) >> 1), tc); }
    Txt.draw(g, label, x + (o.icon ? 22 : 0) + (w - (o.icon ? 22 : 0)) / 2, y + ((h - 7) >> 1) + (o.sub ? -3 : 0), { align: 'c', color: tc, s: o.small ? 1 : 1 });
    if (o.sub) Txt.draw(g, o.sub, x + w / 2, y + h - 10, { align: 'c', color: sel ? '#6a3a00' : '#c9c0ff' });
    if (o.focus !== false && !dis) UI.foc.push(o); if (!dis) UI.hits.push({ x, y, w, h, fn: o.fn });
  },
  hit(x, y) { for (let i = this.hits.length - 1; i >= 0; i--) { const h = this.hits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) { if (h.fn) h.fn(); return true; } } return false; },
  key(sc, c) {
    const n = UI.foc.length;
    if (c === 'ArrowDown' || c === 'KeyS') { sc.sel = (sc.sel + 1) % Math.max(1, n); Sfx.blip(); return true; }
    if (c === 'ArrowUp' || c === 'KeyW') { sc.sel = (sc.sel + n - 1) % Math.max(1, n); Sfx.blip(); return true; }
    const f = UI.foc[sc.sel];
    if ((c === 'ArrowLeft' || c === 'KeyA') && f && f.adj) { f.adj(-1); return true; } if ((c === 'ArrowRight' || c === 'KeyD') && f && f.adj) { f.adj(1); return true; }
    if ((c === 'Enter' || c === 'Space') && f && f.fn) { Sfx.click(); f.fn(); return true; }
    if (c === 'Escape' && sc.back) { Sfx.back(); sc.back(); return true; }
    return false;
  },
};
const IC = {
  play: (g, x, y, c) => icon(g, ['X....', 'XX...', 'XXX..', 'XXXX.', 'XXXXX', 'XXXX.', 'XXX..', 'XX...', 'X....'], x + 2, y, c),
  book: (g, x, y, c) => icon(g, ['.XXXXXXXXX.', 'XX...X...XX', 'X.XX.X.XX.X', 'X.XX.X.XX.X', 'X.XX.X.XX.X', 'X.XX.X.XX.X', 'X.XX.X.XX.X', 'XX...X...XX', '.XXXXXXXXX.'], x, y, c),
  people: (g, x, y, c) => icon(g, ['.XX...XX.', 'XXXX.XXXX', 'XXXX.XXXX', '.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'X.XX.XX.X', 'X.XX.XX.X'], x, y, c),
  gear: (g, x, y, c) => icon(g, ['...XXX...', '.X.XXX.X.', '..XXXXX..', 'XXX...XXX', 'XXX...XXX', 'XXX...XXX', '..XXXXX..', '.X.XXX.X.', '...XXX...'], x, y, c),
  back: (g, x, y, c) => icon(g, ['...X.', '..XX.', '.XXXX', 'XXXXX', '.XXXX', '..XX.', '...X.'], x, y + 1, c),
  lock: (g, x, y, c) => icon(g, ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'XXXXX', 'XXXXX'], x, y, c),
  crown: (g, x, y, c) => icon(g, ['X.X.X', 'XXXXX', 'XXXXX'], x, y, c),
};

// ----- fondo: casa embrujada en 3D (o 2D si no hay WebGL) -----
function menuBackdrop(g, dim) {
  if (Render3D.ok && Render3D.drawMenu(G.t)) { Render3D.show(true); if (dim) { g.fillStyle = 'rgba(8,4,24,' + dim + ')'; g.fillRect(0, 0, VW, VH); } }
  else { Render3D.show(false); drawTitleBg2D(g); if (dim) { g.fillStyle = 'rgba(8,4,24,' + dim + ')'; g.fillRect(0, 0, VW, VH); } }
  g.drawImage(VIG, 0, 0);
}
function sideShade(g, w, a) { for (let i = 0; i < w / 4; i++) { g.fillStyle = 'rgba(8,4,24,' + (a * (1 - i / (w / 4))).toFixed(3) + ')'; g.fillRect(i * 4, 0, 4, VH); } }
function chip(g, x, y) { // perfil: avatar, nombre y adamantium
  const KI = Spr.KI[CFG.style];
  R(g, x, y, 92, 24, '#000'); R(g, x + 1, y + 1, 90, 22, 'rgba(24,14,52,0.9)'); R(g, x + 1, y + 1, 90, 1, '#6a5ad0');
  g.drawImage(Spr.kid('d', 0, CFG.cls, CFG.style), x + 4, y + 22 - KI.fy - 1);
  Txt.draw(g, SAVE.name.slice(0, 10), x + 26, y + 4, { color: '#fff' });
  g.drawImage(Spr.gem(), x + 26, y + 13, 7, 8); Txt.draw(g, 'X ' + SAVE.adam, x + 36, y + 14, { color: '#e0b8ff' });
}
function header(g, title, back) {
  g.fillStyle = 'rgba(8,4,24,0.7)'; g.fillRect(0, 0, VW, 24); R(g, 0, 24, VW, 1, '#6a5ad0');
  UI.btn(g, 6, 4, 50, 16, 'ATRAS', { icon: IC.back, fn: back, focus: false, small: true });
  Txt.draw(g, title, 160, 8, { s: 1, align: 'c', color: '#ffd23f', outline: '#10081c' });
  g.drawImage(Spr.gem(), 258, 6); Txt.draw(g, 'X ' + SAVE.adam, 272, 8, { color: '#e0b8ff', outline: '#10081c' });
}
function askText(title, initial, maxLen, cb) {
  const old = document.getElementById('ask'); if (old) old.remove();
  const d = document.createElement('div'); d.id = 'ask';
  d.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#14102a;border:3px solid #6a5ad0;padding:14px;z-index:30;font:700 14px monospace;color:#ffd23f;text-align:center;border-radius:6px;box-shadow:0 0 0 3px #000';
  const t = document.createElement('div'); t.textContent = title; t.style.marginBottom = '8px';
  const inp = document.createElement('input'); inp.maxLength = maxLen; inp.value = initial || ''; inp.autocomplete = 'off'; inp.style.cssText = 'font:700 18px monospace;text-transform:uppercase;text-align:center;width:180px;padding:6px;background:#0a0618;color:#fff;border:2px solid #4a3a8a;outline:none';
  const row = document.createElement('div'); row.style.marginTop = '10px';
  const ok = document.createElement('button'), no = document.createElement('button'); ok.textContent = 'ACEPTAR'; no.textContent = 'CANCELAR';
  for (const b of [ok, no]) b.style.cssText = 'font:700 13px monospace;padding:6px 10px;margin:0 4px;background:#4a42a0;color:#fff;border:2px solid #8a7af0;cursor:pointer';
  const close = (v) => { d.remove(); if (v !== null) cb(v.toUpperCase().replace(/[^A-Z0-9 ÑÁÉÍÓÚ]/g, '').trim()); };
  ok.onclick = () => close(inp.value); no.onclick = () => close(null); inp.onkeydown = e => { if (e.key === 'Enter') close(inp.value); if (e.key === 'Escape') close(null); e.stopPropagation(); };
  row.append(ok, no); d.append(t, inp, row); document.body.appendChild(d); setTimeout(() => inp.focus(), 30);
}

// =====================================================================
//  PANTALLA PRINCIPAL
// =====================================================================
const Menu = {
  sel: 0,
  enter() { this.sel = 0; if (G.started) { Sfx.horrorStart(); Sfx.setTension(0); } },
  render(g) {
    UI.reset(); menuBackdrop(g, 0); sideShade(g, 190, 0.78);
    const t = G.t, w = Math.sin(t * 2) * 1.2;
    Txt.draw(g, 'NOCHE DE', 14, 14 + w, { s: 2, color: '#ffd23f', outline: '#1a0820', shadow: '#d0601a' });
    Txt.draw(g, 'JUGUETES', 14, 34 - w, { s: 3, color: '#ff7ab8', outline: '#1a0820', shadow: '#a02060' });
    R(g, 14, 62, 120, 2, '#ffd23f'); R(g, 14, 65, 70, 1, '#ff7ab8');
    if (!G.started) { if ((t * 2 | 0) % 2 === 0) Txt.draw(g, 'TOCA PARA EMPEZAR', 14, 100, { s: 1, color: '#fff', outline: '#000' }); return; }
    const f = () => UI.foc.length === this.sel;
    UI.btn(g, 14, 76, 142, 24, 'JUGAR', { sel: f(), primary: true, icon: IC.play, fn: () => this.quick() });
    UI.btn(g, 14, 106, 142, 24, 'MODO HISTORIA', { sel: f(), icon: IC.book, fn: () => { setScene(Story); } });
    UI.btn(g, 14, 136, 142, 24, 'MULTIJUGADOR', { sel: f(), icon: IC.people, fn: () => { setScene(MultiMenu); } });
    // ajustes
    const gsel = UI.foc.length === this.sel; UI.foc.push({ fn: () => setScene(Settings) }); UI.hits.push({ x: 290, y: 140, w: 24, h: 24, fn: () => { Sfx.click(); setScene(Settings); } });
    R(g, 292, 144, 24, 24, '#000'); R(g, 293, 145, 22, 22, gsel ? '#e8a020' : '#3a2a8a'); R(g, 293, 145, 22, 11, gsel ? '#ffe27a' : '#7a6ae0'); IC.gear(g, 299, 151, gsel ? '#2a1400' : '#fff');
    chip(g, 224, 4);
    Txt.draw(g, 'PROTOTIPO', 316, 170, { align: 'r', color: '#7a6aa8', outline: '#10081c' });
  },
  quick() { // partida rápida con tu clase y nivel actuales
    if (!SAVE.unlocked.includes(CFG.cls)) CFG.cls = 0; Sfx.click(); MPleave(); newGame(); setScene(Play);
  },
  keydown(c) { if (!G.started) return; UI.key(this, c); },
  pointerDown(id, x, y) { if (!G.started) return; UI.hit(x, y); },
};

// =====================================================================
//  MODO HISTORIA: mapas (con imágenes) y selección
// =====================================================================
let PREV = null;
function makePreviews() {
  const W = buildMap1(), imgs = W.f.map(F => { const c = Spr.floorCanvas(F, false), g = c.getContext('2d'); for (const o of F.objs) if (o.type !== 'door') Spr.obj(g, o, { t: 0, power: true }); return c; });
  return [
    { n: 'LA CASA - PISO 1', c: imgs[0], r: [16, 16, 38 * 16, 18 * 16] }, { n: 'LA COCINA', c: imgs[0], r: [14 * 16, 16, 10 * 16, 9 * 16] },
    { n: 'EL ESTACIONAMIENTO', c: imgs[0], r: [16, 10 * 16, 16 * 16, 9 * 16] }, { n: 'LA SALA', c: imgs[0], r: [16, 16, 14 * 16, 9 * 16] },
    { n: 'EL TALLER Y LA SALIDA', c: imgs[0], r: [23 * 16, 10 * 16, 13 * 16, 9 * 16] }, { n: 'LA CASA - PISO 2', c: imgs[1], r: [16, 16, 38 * 16, 21 * 16] },
    { n: 'EL ATICO', c: imgs[1], r: [26 * 16, 13 * 16, 13 * 16, 9 * 16] }, { n: 'EL PASILLO Y EL HUECO', c: imgs[1], r: [16, 9 * 16, 38 * 16, 5 * 16] },
  ];
}
function drawPrev(g, p, x, y, w, h) {
  const [rx, ry, rw, rh] = p.r, sc = Math.min(w / rw, h / rh), dw = Math.round(rw * sc), dh = Math.round(rh * sc);
  g.imageSmoothingEnabled = false; g.drawImage(p.c, rx, ry, rw, rh, x + ((w - dw) >> 1), y + ((h - dh) >> 1), dw, dh);
}
const Story = {
  tab: 0, sel: 0, pv: 0, pvT: 0, cs: 0,
  enter() { this.sel = 0; if (!PREV) PREV = makePreviews(); this.cs = CFG.cls; },
  back() { setScene(Menu); },
  render(g) {
    UI.reset(); menuBackdrop(g, 0.62); header(g, 'MODO HISTORIA', () => { Sfx.back(); this.back(); });
    const f = () => UI.foc.length === this.sel;
    // pestañas
    UI.btn(g, 8, 28, 74, 14, 'MAPAS', { sel: this.tab === 0, small: true, fn: () => { this.tab = 0; Sfx.blip(); }, focus: false });
    UI.btn(g, 86, 28, 74, 14, 'SELECCION', { sel: this.tab === 1, small: true, fn: () => { this.tab = 1; Sfx.blip(); }, focus: false });
    if (this.tab === 0) this.renderMaps(g, f); else this.renderSel(g, f);
  },
  renderMaps(g, f) {
    this.pvT += 1 / 60; if (this.pvT > 2.6) { this.pvT = 0; this.pv = (this.pv + 1) % PREV.length; }
    const p = PREV[this.pv];
    R(g, 8, 46, 152, 90, '#000'); R(g, 9, 47, 150, 88, '#6a5ad0'); R(g, 11, 49, 146, 84, '#120a24'); drawPrev(g, p, 12, 50, 144, 82);
    Txt.draw(g, p.n, 84, 139, { align: 'c', color: '#ffd23f', outline: '#10081c' });
    for (let i = 0; i < PREV.length; i++) R(g, 84 - PREV.length * 4 + i * 8, 149, 5, 3, i === this.pv ? '#ffd23f' : '#4a3a8a');
    UI.hits.push({ x: 8, y: 46, w: 152, h: 90, fn: () => { this.pv = (this.pv + 1) % PREV.length; this.pvT = 0; Sfx.blip(); } });
    Txt.draw(g, 'NIVELES', 166, 47, { color: '#c9a6ff', outline: '#10081c' });
    for (let i = 0; i < 10; i++) {
      const lv = i + 1, x = 166 + (i % 5) * 30, y = 57 + (i / 5 | 0) * 32, locked = lv > SAVE.maxLevel, sel = lv === CFG.level;
      R(g, x, y, 27, 29, sel ? '#ffd23f' : '#000'); R(g, x + 1, y + 1, 25, 27, locked ? '#2a2640' : sel ? '#e8a020' : '#4a3a9a'); R(g, x + 1, y + 1, 25, 12, locked ? '#3a3654' : sel ? '#ffe27a' : '#6a5ad0');
      Txt.draw(g, String(lv), x + 13, y + 4, { align: 'c', s: 2, color: locked ? '#6a6690' : sel ? '#2a1400' : '#fff' });
      if (locked) IC.lock(g, x + 11, y + 17, '#8a86a8'); else { const sk = Math.min(5, Math.ceil(lv / 2)); for (let k = 0; k < sk; k++) R(g, x + 3 + k * 4, y + 21, 3, 4, sel ? '#7a2a00' : '#ff7ab8'); }
      UI.hits.push({ x, y, w: 27, h: 29, fn: () => { if (locked) { Sfx.hit(); return; } CFG.level = lv; saveCfg(); Sfx.blip(); } });
    }
    const lp = levelParams(CFG.level);
    R(g, 166, 121, 147, 28, 'rgba(8,4,24,0.85)'); R(g, 166, 121, 147, 1, '#6a5ad0');
    Txt.draw(g, 'PREMIO: ' + CFG.level + ' ADAMANTIUM', 170, 124, { color: '#e0b8ff' });
    Txt.draw(g, 'FANTASMAS CADA ' + Math.round(lp.ghostEvery) + ' S', 170, 133, { color: '#c9c0ff' });
    Txt.draw(g, 'APAGON: ' + Math.floor(lp.blackout / 60) + ':' + String(Math.round(lp.blackout % 60)).padStart(2, '0') + ' DE LA NOCHE', 170, 142, { color: '#c9c0ff' });
    UI.btn(g, 166, 152, 147, 22, 'JUGAR', { sel: f(), primary: true, icon: IC.play, fn: () => this.play() });
    // clase actual
    const KI = Spr.KI[CFG.style]; R(g, 8, 156, 152, 20, '#000'); R(g, 9, 157, 150, 18, 'rgba(24,14,52,0.9)'); g.drawImage(Spr.kid('d', 0, CFG.cls, CFG.style), 14, 174 - KI.fy - 2);
    Txt.draw(g, 'CLASE: ' + CLASSES[CFG.cls].n, 38, 162, { color: '#fff' });
    UI.hits.push({ x: 8, y: 156, w: 152, h: 20, fn: () => { this.tab = 1; Sfx.blip(); } });
  },
  renderSel(g, f) {
    const cs = this.cs, cl = CLASSES[cs], owned = SAVE.unlocked.includes(cs);
    R(g, 8, 46, 198, 98, '#000'); R(g, 9, 47, 196, 96, '#6a5ad0'); R(g, 11, 49, 192, 92, '#120a24');
    UI.btn(g, 14, 84, 14, 24, '<', { fn: () => this.step(-1), focus: false, small: true }); UI.btn(g, 190, 84, 14, 24, '>', { fn: () => this.step(1), focus: false, small: true });
    const KI = Spr.KI[CFG.style], sc = 2, spr = Spr.kid('d', (G.t * 3 | 0) % 2 ? 1 : 0, cs, CFG.style);
    E(g, 58, 118, 17, 4, 'rgba(0,0,0,0.4)'); g.globalAlpha = owned ? 1 : 0.5; g.drawImage(spr, Math.round(58 - KI.w * sc / 2), 117 - KI.fy * sc, KI.w * sc, KI.h * sc); g.globalAlpha = 1;
    Txt.draw(g, cl.n, 142, 54, { align: 'c', color: owned ? '#ffd23f' : '#9a8ab8', outline: '#10081c' });
    Txt.wrap(cl.desc, 104).forEach((l, k) => Txt.draw(g, l, 142, 68 + k * 9, { align: 'c', color: '#c9c0ff' }));
    if (!owned) { IC.lock(g, 139, 108, '#9a8ab8'); }
    if (cs === CFG.cls && owned) Txt.draw(g, 'SELECCIONADA', 142, 126, { align: 'c', color: '#3ae07a' });
    else if (owned) UI.btn(g, 94, 122, 96, 16, 'ELEGIR', { sel: f(), small: true, fn: () => { CFG.cls = cs; saveCfg(); Sfx.pickup(); } });
    else UI.btn(g, 84, 122, 116, 16, 'COMPRAR: ' + cl.cost, { sel: f(), small: true, primary: true, fn: () => this.buy() });
    // iconos de clases
    for (let i = 0; i < CLASSES.length; i++) { const x = 8 + i * 18, ow = SAVE.unlocked.includes(i); R(g, x, 148, 17, 24, i === cs ? '#ffd23f' : '#000'); R(g, x + 1, 149, 15, 22, i === CFG.cls ? '#2a5a3a' : '#1c1436'); g.globalAlpha = ow ? 1 : 0.4; g.drawImage(Spr.kid('d', 0, i, CFG.style), x + 8 - (KI.w >> 1), 170 - KI.fy - 1); g.globalAlpha = 1; if (!ow) IC.lock(g, x + 6, 152, '#c9c0ff'); UI.hits.push({ x, y: 148, w: 17, h: 24, fn: () => { this.cs = i; Sfx.blip(); } }); }
    // estilo y vista
    Txt.draw(g, 'ESTILO', 212, 47, { color: '#c9a6ff', outline: '#10081c' });
    for (const [k, x, l] of [['A', 212, 'REDONDO'], ['B', 262, 'CLASICO']]) { const on = CFG.style === k, K2 = Spr.KI[k]; R(g, x, 57, 48, 56, on ? '#ffd23f' : '#000'); R(g, x + 1, 58, 46, 54, on ? '#3a2a6a' : '#1c1436'); g.drawImage(Spr.kid('d', 0, cs, k), Math.round(x + 24 - K2.w), 100 - K2.fy * 2 + 8, K2.w * 2, K2.h * 2); Txt.draw(g, l, x + 24, 101, { align: 'c', color: on ? '#ffd23f' : '#9a8ab8' }); UI.hits.push({ x, y: 57, w: 48, h: 56, fn: () => { CFG.style = k; saveCfg(); Sfx.blip(); } }); }
    Txt.draw(g, 'VISTA', 212, 119, { color: '#c9a6ff', outline: '#10081c' });
    UI.btn(g, 212, 129, 48, 14, '3D', { sel: CFG.view === '3D', small: true, focus: false, fn: () => { CFG.view = '3D'; saveCfg(); Sfx.blip(); } });
    UI.btn(g, 262, 129, 48, 14, '2D', { sel: CFG.view === '2D', small: true, focus: false, fn: () => { CFG.view = '2D'; saveCfg(); Sfx.blip(); } });
    UI.btn(g, 212, 150, 100, 22, 'JUGAR', { sel: f(), primary: true, icon: IC.play, fn: () => this.play() });
    if (this.msgT > 0) { this.msgT -= 1 / 60; Txt.draw(g, this.msg, 160, 36, { align: 'c', color: '#ff9a9a', outline: '#10081c' }); }
  },
  step(d) { this.cs = (this.cs + d + CLASSES.length) % CLASSES.length; Sfx.blip(); },
  buy() { const c = CLASSES[this.cs]; if (SAVE.adam >= c.cost) { SAVE.adam -= c.cost; SAVE.unlocked.push(this.cs); CFG.cls = this.cs; persist(); saveCfg(); Sfx.pickup(); this.say('¡' + c.n + ' DESBLOQUEADO!'); } else { Sfx.hit(); this.say('FALTA ADAMANTIUM (' + SAVE.adam + '/' + c.cost + ')'); } },
  say(t) { this.msg = t; this.msgT = 2.2; }, msgT: 0, msg: '',
  play() { if (!SAVE.unlocked.includes(CFG.cls)) { this.tab = 1; this.cs = CFG.cls; this.say('ESA CLASE ESTA BLOQUEADA'); Sfx.hit(); return; } Sfx.click(); saveCfg(); MPleave(); newGame(); setScene(Play); },
  keydown(c) { if (c === 'Tab') { this.tab = 1 - this.tab; Sfx.blip(); return; } if (this.tab === 1 && (c === 'ArrowLeft' || c === 'KeyA')) { this.step(-1); return; } if (this.tab === 1 && (c === 'ArrowRight' || c === 'KeyD')) { this.step(1); return; } if (this.tab === 0 && (c === 'ArrowLeft' || c === 'KeyA')) { CFG.level = Math.max(1, CFG.level - 1); saveCfg(); return; } if (this.tab === 0 && (c === 'ArrowRight' || c === 'KeyD')) { CFG.level = Math.min(SAVE.maxLevel, CFG.level + 1); saveCfg(); return; } UI.key(this, c); },
  pointerDown(id, x, y) { UI.hit(x, y); },
};

// =====================================================================
//  RED DE SALAS (por ahora entre pestañas del mismo navegador)
// =====================================================================
let MP = null;
const Net = {
  id: 'p' + Math.random().toString(36).slice(2, 8), ch: null, code: null, host: false, players: [], level: 1, err: '', hb: null, joinT: null, onStart: null,
  ok: typeof BroadcastChannel !== 'undefined',
  me() { return { id: this.id, name: SAVE.name, cls: CFG.cls, host: this.host, bot: false }; },
  newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 4; i++) c += A[Math.random() * A.length | 0]; return c; },
  post(m) { try { this.ch && this.ch.postMessage(m); } catch (e) {} },
  open(code) { this.close(); this.code = code; if (!this.ok) return; this.ch = new BroadcastChannel('nj-room-' + code); this.ch.onmessage = e => this.msg(e.data); },
  create() { this.host = true; this.err = ''; this.open(this.newCode()); this.level = CFG.level; this.players = [this.me()]; this.hb = setInterval(() => this.broadcast(), 1500); },
  join(code, cb) {
    this.host = false; this.err = ''; this.players = []; if (!this.ok) { this.err = 'ESTE NAVEGADOR NO LO SOPORTA'; cb(false); return; }
    this.open(code); this.post({ t: 'join', p: this.me() });
    this.joinT = setTimeout(() => { if (!this.players.length) { this.close(); this.err = 'NO ENCONTRE LA SALA ' + code; cb(false); } }, 1800); this.onJoin = cb;
  },
  broadcast() { if (this.host) this.post({ t: 'players', list: this.players, level: this.level }); },
  msg(m) {
    if (!m) return;
    if (this.host) {
      if (m.t === 'join') { if (this.players.length < 8 && !this.players.find(p => p.id === m.p.id)) { this.players.push(Object.assign({}, m.p, { host: false })); Sfx.pickup(); } this.broadcast(); }
      else if (m.t === 'leave') { this.players = this.players.filter(p => p.id !== m.id); this.broadcast(); }
      else if (m.t === 'result') recordResult(m.r);
    } else {
      if (m.t === 'players') { if (m.list.find(p => p.id === this.id)) { this.players = m.list; this.level = m.level; if (this.onJoin) { const cb = this.onJoin; this.onJoin = null; clearTimeout(this.joinT); cb(true); } } else if (this.players.length) { this.err = 'SALA LLENA O CERRADA'; leaveRoom(); setScene(MultiMenu); } }
      else if (m.t === 'closed') { this.err = 'EL ANFITRION CERRO LA SALA'; leaveRoom(); setScene(MultiMenu); }
      else if (m.t === 'start') this.onStart && this.onStart(m);
      else if (m.t === 'result') recordResult(m.r);
    }
  },
  addBot() { if (!this.host || this.players.length >= 8) return; const n = this.players.filter(p => p.bot).length + 1; this.players.push({ id: 'bot' + n + Math.random().toString(36).slice(2, 5), name: 'BOT ' + n, cls: Math.random() * CLASSES.length | 0, host: false, bot: true }); this.broadcast(); Sfx.blip(); },
  close() { if (this.hb) clearInterval(this.hb); this.hb = null; if (this.joinT) clearTimeout(this.joinT); if (this.ch) { try { this.ch.close(); } catch (e) {} } this.ch = null; },
  leave() { if (this.ch) { if (this.host) this.post({ t: 'closed' }); else this.post({ t: 'leave', id: this.id }); } this.close(); this.players = []; this.code = null; this.host = false; },
};
function leaveRoom() { Net.leave(); MP = null; }
function MPleave() { if (MP) { leaveRoom(); } }
function recordResult(r) { if (!MP) return; MP.results = MP.results.filter(x => x.id !== r.id); MP.results.push(r); }
function MPreport(kind, t) { if (!MP) return; const r = { id: Net.id, name: SAVE.name, kind, t }; recordResult(r); Net.post({ t: 'result', r }); }
function MPback() { if (!MP || !Net.code) return false; setScene(Room); return true; }
function MPend(g) {
  if (!MP) return; const rs = MP.results.slice().sort((a, b) => (a.kind === 'escape' ? 0 : a.kind === 'survive' ? 1 : 2) - (b.kind === 'escape' ? 0 : b.kind === 'survive' ? 1 : 2) || a.t - b.t);
  R(g, 200, 100, 112, 70, 'rgba(8,4,24,0.9)'); R(g, 200, 100, 112, 1, '#6a5ad0'); Txt.draw(g, 'SALA ' + MP.code, 256, 104, { align: 'c', color: '#ffd23f' });
  rs.slice(0, 6).forEach((r, i) => Txt.draw(g, (i + 1) + '. ' + r.name.slice(0, 7) + (r.kind === 'escape' ? ' SALIO' : r.kind === 'survive' ? ' 6AM' : ' CAYO'), 204, 115 + i * 9, { color: r.kind === 'escape' ? '#3ae07a' : r.kind === 'survive' ? '#c9c0ff' : '#ff8a8a' }));
}
function startMatch(m) {
  MP = { code: Net.code, results: [], players: m.list }; CFG.level = m.level; Sfx.click(); newGame(m.seed); setScene(Play);
}

// =====================================================================
//  MULTIJUGADOR: crear o unirse
// =====================================================================
const MultiMenu = {
  sel: 0,
  enter() { this.sel = 0; leaveRoom(); },
  back() { setScene(Menu); },
  render(g) {
    UI.reset(); menuBackdrop(g, 0.55); header(g, 'MULTIJUGADOR', () => { Sfx.back(); this.back(); });
    const f = () => UI.foc.length === this.sel;
    R(g, 50, 40, 220, 110, 'rgba(8,4,24,0.85)'); R(g, 50, 40, 220, 1, '#6a5ad0'); R(g, 50, 149, 220, 1, '#6a5ad0');
    Txt.draw(g, 'JUEGA CON TUS PRIMOS', 160, 48, { align: 'c', color: '#ffd23f', outline: '#10081c' });
    UI.btn(g, 70, 64, 180, 26, 'CREAR SALA', { sel: f(), primary: true, sub: 'TU ERES EL ANFITRION', icon: IC.people, fn: () => { Net.create(); setScene(Room); } });
    UI.btn(g, 70, 98, 180, 26, 'UNIRSE CON CODIGO', { sel: f(), sub: 'ESCRIBE EL CODIGO DE LA SALA', icon: IC.play, fn: () => this.joinPrompt() });
    Txt.draw(g, 'HASTA 8 JUGADORES POR SALA', 160, 132, { align: 'c', color: '#c9c0ff' });
    if (Net.err) Txt.draw(g, Net.err, 160, 160, { align: 'c', color: '#ff9a9a', outline: '#10081c' });
    chip(g, 224, 28);
  },
  joinPrompt() { askText('CODIGO DE LA SALA', '', 4, code => { if (code.length < 4) { Net.err = 'EL CODIGO TIENE 4 LETRAS'; return; } Net.join(code, okk => { if (okk) { Net.onStart = startMatch; setScene(Room); } }); }); },
  keydown(c) { UI.key(this, c); }, pointerDown(id, x, y) { UI.hit(x, y); },
};

// =====================================================================
//  SALA DE ESPERA
// =====================================================================
const Room = {
  sel: 0,
  enter() { this.sel = 0; Net.onStart = startMatch; },
  back() { leaveRoom(); setScene(MultiMenu); },
  render(g) {
    UI.reset(); menuBackdrop(g, 0.6); header(g, 'SALA DE ESPERA', () => { Sfx.back(); this.back(); });
    const f = () => UI.foc.length === this.sel, n = Net.players.length, dots = '.'.repeat(1 + (G.t * 2 | 0) % 3);
    R(g, 8, 30, 304, 28, 'rgba(8,4,24,0.88)'); R(g, 8, 30, 304, 1, '#6a5ad0'); R(g, 8, 57, 304, 1, '#6a5ad0');
    Txt.draw(g, 'EL CODIGO DE LA SALA ES', 16, 35, { color: '#c9c0ff' });
    Txt.draw(g, Net.code || '----', 16, 44, { s: 2, color: '#ffd23f', outline: '#10081c', shadow: '#c8501a' });
    Txt.draw(g, Net.host ? 'ESPERANDO JUGADORES' + dots : 'ESPERANDO AL ANFITRION' + dots, 308, 36, { align: 'r', color: '#fff' });
    Txt.draw(g, n + ' / 8 JUGADORES   NIVEL ' + Net.level, 308, 47, { align: 'r', color: '#3ae07a' });
    for (let i = 0; i < 8; i++) {
      const x = 8 + (i % 4) * 77, y = 62 + (i / 4 | 0) * 44, p = Net.players[i];
      R(g, x, y, 73, 40, '#000'); R(g, x + 1, y + 1, 71, 38, p ? (p.id === Net.id ? '#2a3a5a' : '#241c44') : '#16102a'); R(g, x + 1, y + 1, 71, 1, p ? '#6a5ad0' : '#2a2248');
      if (p) {
        const KI = Spr.KI[CFG.style]; E(g, x + 16, y + 33, 8, 2, 'rgba(0,0,0,0.4)'); g.drawImage(Spr.kid('d', (G.t * 3 + i | 0) % 2, p.cls, CFG.style), Math.round(x + 16 - KI.w / 2), y + 33 - KI.fy);
        Txt.draw(g, p.name.slice(0, 7), x + 30, y + 5, { color: p.id === Net.id ? '#ffd23f' : '#fff' });
        Txt.draw(g, CLASSES[p.cls].n.slice(0, 7), x + 30, y + 15, { color: '#c9a6ff' });
        Txt.draw(g, p.bot ? 'BOT' : p.id === Net.id ? 'TU' : 'JUGADOR', x + 30, y + 27, { color: p.bot ? '#8a86a8' : '#6a9a6a' });
        if (p.host) { IC.crown(g, x + 62, y + 29, '#ffd23f'); }
      } else { Txt.draw(g, 'LIBRE', x + 36, y + 17, { align: 'c', color: '#4a4268' }); }
    }
    if (Net.host) {
      UI.btn(g, 8, 152, 70, 22, '+ BOT', { sel: f(), small: true, fn: () => Net.addBot(), disabled: n >= 8 });
      UI.btn(g, 82, 152, 56, 22, 'NIVEL', { sel: f(), small: true, sub: '< ' + Net.level + ' >', fn: () => this.lv(1), adj: d => this.lv(d) });
      UI.btn(g, 142, 152, 100, 22, 'EMPEZAR', { sel: f(), primary: true, icon: IC.play, fn: () => this.start() });
    } else Txt.draw(g, 'EL ANFITRION INICIARA LA PARTIDA', 8, 160, { color: '#c9c0ff', outline: '#10081c' });
    UI.btn(g, 246, 152, 66, 22, 'SALIR', { sel: f(), small: true, fn: () => { this.back(); } });
    if (!Net.ok) Txt.draw(g, 'SIN SOPORTE DE SALAS EN ESTE NAVEGADOR', 160, 142, { align: 'c', color: '#ff9a9a', outline: '#10081c' });
  },
  lv(d) { let v = Net.level + (d || 1); if (v > SAVE.maxLevel) v = 1; if (v < 1) v = SAVE.maxLevel; Net.level = v; Net.broadcast(); Sfx.blip(); },
  start() { const m = { t: 'start', seed: 1 + (Math.random() * 1e9 | 0), level: Net.level, list: Net.players.slice() }; Net.post(m); startMatch(m); },
  keydown(c) { UI.key(this, c); }, pointerDown(id, x, y) { UI.hit(x, y); },
};

// =====================================================================
//  AJUSTES
// =====================================================================
const Settings = {
  sel: 0, confirm: 0,
  enter() { this.sel = 0; this.confirm = 0; },
  back() { setScene(Menu); },
  render(g) {
    UI.reset(); menuBackdrop(g, 0.6); header(g, 'AJUSTES', () => { Sfx.back(); this.back(); });
    const f = () => UI.foc.length === this.sel; if (this.confirm > 0) this.confirm -= 1 / 60;
    R(g, 40, 32, 240, 140, 'rgba(8,4,24,0.88)'); R(g, 40, 32, 240, 1, '#6a5ad0');
    UI.btn(g, 56, 40, 208, 18, 'SONIDO: ' + (Sfx.muted ? 'NO' : 'SI'), { sel: f(), small: true, fn: () => { Sfx.toggleMute(); } });
    UI.btn(g, 56, 62, 208, 18, 'VISTA: ' + CFG.view, { sel: f(), small: true, fn: () => { CFG.view = CFG.view === '3D' ? '2D' : '3D'; saveCfg(); Sfx.blip(); } });
    UI.btn(g, 56, 84, 208, 18, 'ESTILO: ' + (CFG.style === 'A' ? 'A REDONDO' : 'B CLASICO'), { sel: f(), small: true, fn: () => { CFG.style = CFG.style === 'A' ? 'B' : 'A'; saveCfg(); Sfx.blip(); } });
    UI.btn(g, 56, 106, 208, 18, 'MI NOMBRE: ' + SAVE.name, { sel: f(), small: true, fn: () => askText('TU NOMBRE DE JUGADOR', SAVE.name, 10, v => { if (v) { SAVE.name = v; persist(); } }) });
    UI.btn(g, 56, 128, 208, 18, this.confirm > 0 ? '¿SEGURO? PULSA OTRA VEZ' : 'BORRAR PROGRESO', { sel: f(), small: true, fn: () => this.wipe() });
    UI.btn(g, 56, 150, 208, 18, 'VOLVER', { sel: f(), small: true, primary: true, fn: () => this.back() });
  },
  wipe() { if (this.confirm > 0) { SAVE.adam = 0; SAVE.unlocked = [0]; SAVE.maxLevel = 1; CFG.cls = 0; CFG.level = 1; persist(); saveCfg(); this.confirm = 0; Sfx.hit(); } else { this.confirm = 3; Sfx.blip(); } },
  keydown(c) { UI.key(this, c); }, pointerDown(id, x, y) { UI.hit(x, y); },
};

// ---------------- arranque ----------------
Title = Menu;
window.__scenes.Title = Menu; window.__scenes.Menu = Menu; window.__scenes.Story = Story; window.__scenes.MultiMenu = MultiMenu; window.__scenes.Room = Room; window.__scenes.Settings = Settings; window.__Net = Net; window.__MP = () => MP;
persist(); setScene(Menu); requestAnimationFrame(loop);
