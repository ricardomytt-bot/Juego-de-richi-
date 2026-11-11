'use strict';
// ============ NOCHE DE JUGUETES (prototipo: mapa 1 contra un bot) ============
const VW = 320, VH = 180;
const FAST = /fast/.test(location.search);
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const G = { scene: null, keys: {}, t: 0, started: false };
const { R, E } = Spr;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const CFG = { cls: 0, level: 1, style: 'A', view: '3D' };
try { Object.assign(CFG, JSON.parse(localStorage.getItem('nj_cfg') || '{}')); } catch (e) {}
if (CFG.style !== 'A' && CFG.style !== 'B') CFG.style = 'A'; if (CFG.view !== '2D' && CFG.view !== '3D' && CFG.view !== 'FP') CFG.view = '3D';
const isFP = () => CFG.view === 'FP' && typeof RenderFP !== 'undefined' && RenderFP.ok;
const SAVE = { adam: 0, unlocked: [0], maxLevel: 1, name: 'JUGADOR' + (10 + (Math.random() * 90 | 0)) };
try { Object.assign(SAVE, JSON.parse(localStorage.getItem('nj_save') || '{}')); } catch (e) {}
if (!Array.isArray(SAVE.unlocked) || !SAVE.unlocked.includes(0)) SAVE.unlocked = [0, ...(Array.isArray(SAVE.unlocked) ? SAVE.unlocked : [])];
SAVE.maxLevel = clamp(SAVE.maxLevel | 0 || 1, 1, 10); SAVE.adam = Math.max(0, SAVE.adam | 0);
CFG.cls = clamp(CFG.cls | 0, 0, CLASSES.length - 1); if (!SAVE.unlocked.includes(CFG.cls)) CFG.cls = 0; CFG.level = clamp(CFG.level | 0 || 1, 1, SAVE.maxLevel);
const persist = () => { try { localStorage.setItem('nj_save', JSON.stringify(SAVE)); } catch (e) {} };
const saveCfg = () => { try { localStorage.setItem('nj_cfg', JSON.stringify(CFG)); } catch (e) {} };
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function fit() { const s = Math.min(innerWidth / VW, innerHeight / VH), asp = (innerWidth / innerHeight) / (VW / VH), fill = (G.inFP && asp > 0.8 && asp < 1.8) || (asp > 0.8 && asp < 1.45); const w = fill ? innerWidth + 'px' : Math.floor(VW * s) + 'px', h = fill ? innerHeight + 'px' : Math.floor(VH * s) + 'px'; for (const id of ['wrap', 'gl', 'fp', 'c']) { const el = document.getElementById(id); if (el) { el.style.width = w; el.style.height = h; } } }
addEventListener('resize', fit); fit();
addEventListener('pointerdown', () => { try { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen && !/lowfp|nofs/.test(location.search)) d.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {} }, { once: true });
function setScene(s, ...a) { if (s && s.name_ !== 'play' && G.prevView) { CFG.view = G.prevView; G.prevView = null; } G.scene = s; G.inFP = !!(s && s.name_ === 'play' && CFG.view === 'FP'); setTimeout(fit, 0); if (s.enter) s.enter(...a); }
function panel(g, x, y, w, h, fill = '#14102a', border = '#4a3a8a') { R(g, x, y, w, h, '#000'); R(g, x + 1, y + 1, w - 2, h - 2, border); R(g, x + 2, y + 2, w - 4, h - 4, fill); }
function circle(g, x, y, r, fill, border) { E(g, x, y, r + 1, r + 1, '#000'); E(g, x, y, r, r, border); E(g, x, y, r - 2, r - 2, fill); }
function ring(g, x, y, r, col) { g.fillStyle = col; const n = Math.max(16, Math.round(r * 2.4)); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); } }

// ---------------- estado de la partida ----------------
let S = null;
const SPEED = 62, HW = 4, HH = 3, EHW = 5, EHH = 4, RADAR_R = 105;
const tc = t => t * TS + TS / 2;
const tileOf = v => Math.floor(v / TS);
function solidTile(f, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true;
  const F = S.W.f[f], c = F.g[ty][tx];
  return c === '#' || c === ' ' || (c >= '1' && c <= '5') || F.sol[ty][tx];
}
function hits(f, x, y, hw, hh) { return solidTile(f, tileOf(x - hw), tileOf(y - hh)) || solidTile(f, tileOf(x + hw), tileOf(y - hh)) || solidTile(f, tileOf(x - hw), tileOf(y + hh)) || solidTile(f, tileOf(x + hw), tileOf(y + hh)); }
function move(en, dx, dy, hw, hh) { if (!hits(en.f, en.x + dx, en.y, hw, hh)) en.x += dx; if (!hits(en.f, en.x, en.y + dy, hw, hh)) en.y += dy; }
function los(f, x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 4); for (let i = 1; i < n; i++) { const k = i / n; if (solidTile(f, tileOf(x0 + (x1 - x0) * k), tileOf(y0 + (y1 - y0) * k))) return false; } return true; }
function barAt(f, tx, ty) { return S.placed.find(b => b.type === 'barricada' && b.f === f && b.tx === tx && b.ty === ty); }
function solidPath(f, tx, ty) { return barAt(f, tx, ty) ? false : solidTile(f, tx, ty); }
function bfs(f, sx, sy, gx, gy) {
  if (sx === gx && sy === gy) return [];
  const prev = new Int32Array(MW * MH).fill(-2), q = [sy * MW + sx]; prev[sy * MW + sx] = -1;
  for (let h = 0; h < q.length; h++) {
    const k = q[h], x = k % MW, y = (k / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = ny * MW + nx;
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH || prev[nk] !== -2 || solidPath(f, nx, ny)) continue;
      prev[nk] = k;
      if (nx === gx && ny === gy) { const path = []; let c = nk; while (c !== sy * MW + sx) { path.push([c % MW, (c / MW) | 0]); c = prev[c]; } return path.reverse(); }
      q.push(nk);
    }
  }
  return null;
}

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let MAP_SHARE = null;
function withSeed(seed, fn) { const o = Math.random; Math.random = mulberry(seed); try { return fn(); } finally { Math.random = o; } }
function newGame(seed, opts) {
  MAP_SHARE = (typeof MP !== 'undefined' && MP && MP.share && MP.share.n > 1) ? MP.share : null;
  const W = seed ? withSeed(seed, buildMap1) : buildMap1(); MAP_SHARE = null; const cl = CLASSES[CFG.cls], df = levelParams(CFG.level);
  const sp = W.spawn, es = W.enemySpawn;
  S = {
    W, cl, df, t: 0, dur: FAST ? 60 : 360, blackoutAt: FAST ? 40 : df.blackout, floors: W.f.map(f => Spr.floorCanvas(f)),
    p: { f: sp.f, x: tc(sp.x), y: tc(sp.y), dir: 'd', ang: Math.PI / 2, hp: cl.hp || 100, maxhp: cl.hp || 100, speed: SPEED * (cl.speed || 1), anim: 0, moving: false, keys: new Set(), mats: Object.assign({}, cl.mats), inv: Object.assign({}, cl.items), sel: 0, boost: 0, slow: 0, yaw: Math.PI / 2, pitch: 0, charge: 100, beam: 0, beamHit: false, immune: 0, held: false, grab: 0, dead: false, escaped: false, codeA: null, codeB: null, charging: false, stairCd: 0 },
    e: { f: es.f, x: tc(es.x), y: tc(es.y), dir: 'd', fx: 0, fy: 1, state: 'patrol', stun: 0, eat: 0, path: [], goal: null, repath: 0, radarCd: df.grace, ring: 0, anim: 0, lost: 0, wait: -df.grace, waitT: 1, calm: 0, last: null, stairCd: 0, blind: 0, slow: 0, dmgRed: 0, brk: 0 },
    lure: null, placed: [], ghosts: [], ghostT: rand(df.ghostEvery * 0.6, df.ghostEvery), scream: null, blackout: false, fixed: false, overlay: null, msg: null, fade: 1.2, ended: null, intro: 0, introT: 0, flick: 0, flickCd: rand(6, 12), cam: { cx: 0, cy: 0 }, shake: 0, hint: null, joy: null, hold: null, stats: { chests: 0, flashes: 0, grabs: 0, crafts: 0 },
  };
  S.mini = W.f.map(F => Spr.mk(80, 48, g => { const cols = { '#': '#3a2a5a', '.': '#b88454', k: '#6ab8b0', g: '#8a8aa0', r: '#b04868' }; for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) { const c = F.g[j][i]; if (c === ' ') continue; g.fillStyle = cols[c] || cols['.']; g.fillRect(i * 2, j * 2, 2, 2); } }));
  S.parts = [];
  if (opts && opts.doll) { S.dollMode = true; S.dollAuto = !!opts.auto; S.pingCd = 0; S.ping = 0; S.p.moving = false; botInit(); S.e.state = 'patrol'; if (S.t === 0) S.blackoutAt = S.df.blackout; }
  if (typeof MP !== 'undefined' && MP && MP.pending && MP.pending.length) { const q = MP.pending; MP.pending = []; q.forEach(applyShared); }
  if (typeof MP !== 'undefined' && MP && MP.share && MP.share.n > 1) say('CADA QUIEN TIENE PARTE DE LAS LLAVES: COMPARTEN', 4);
  Sfx.horrorStart(); Sfx.setTension(0);
}
function ico(g, id, x, y, w) { g.imageSmoothingEnabled = false; g.drawImage(Spr.icon(id), x, y, w, w); }
function got(icon, text, n) { if (!S.toasts) S.toasts = []; if (S.toasts.length > 4) S.toasts.shift(); S.toasts.push({ icon, text, n, t: 0 }); }
const say = (text, t = 2.4) => { S.msg = { text, t }; };

// ---------------- jugador ----------------
let VIG2 = null, GRAIN = null;
function fpPost(g) { // viñeta, grano de película y pulso rojo cuando la muñeca está cerca
  if (!VIG2) { VIG2 = Spr.mk(VW, VH, c => { const gr = c.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VW * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,8,0.78)'); c.fillStyle = gr; c.fillRect(0, 0, VW, VH); }); GRAIN = []; for (let i = 0; i < 4; i++) GRAIN.push(Spr.mk(VW, VH, c => { for (let n = 0; n < 700; n++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.16)'; c.fillRect(Math.random() * VW | 0, Math.random() * VH | 0, 1, 1); } })); }
  g.drawImage(VIG2, 0, 0); g.drawImage(GRAIN[(G.t * 12 | 0) % 4], 0, 0);
  const e = S.e, p = S.p; if (e.f === p.f && !p.dead) { const d = Math.hypot(e.x - p.x, e.y - p.y), k = clamp(1 - d / 110, 0, 1); if (k > 0) { g.fillStyle = 'rgba(200,0,20,' + (k * (0.14 + 0.08 * Math.sin(G.t * 9))).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH); } }
}
const FPV = { sx: 0, sy: 0, dy: 0, dp: 0, sens: 1 };
function fpLook(dt) { const k = 1 - Math.exp(-dt * 32), a = FPV.dy * k, b = FPV.dp * k; FPV.dy -= a; FPV.dp -= b; S.p.yaw += a; S.p.pitch = clamp(S.p.pitch + b, -0.8, 0.8); }
const fpAdd = (dx, dy, m) => { FPV.dy += clamp(dx, -60, 60) * m * FPV.sens; FPV.dp -= clamp(dy, -60, 60) * m * 0.7 * FPV.sens; };
let JOYSRC = false;
function inputVec() {
  JOYSRC = false; let x = 0, y = 0; const k = G.keys;
  const fp = CFG.view === 'FP';
  if (k.KeyA || (!fp && k.ArrowLeft)) x -= 1; if (k.KeyD || (!fp && k.ArrowRight)) x += 1; if (k.KeyW || (!fp && k.ArrowUp)) y -= 1; if (k.KeyS || (!fp && k.ArrowDown)) y += 1;
  if (x || y) { const l = Math.hypot(x, y); return [x / l, y / l]; }
  if (S.joy) { const dx = (S.joy.x - S.joy.ox) / 22, dy = (S.joy.y - S.joy.oy) / 22, l = Math.hypot(dx, dy); if (l > 0.18) { JOYSRC = true; return [dx / Math.max(1, l), dy / Math.max(1, l)]; } }
  return [0, 0];
}
const invList = () => ITEM_ORDER.filter(k => (S.p.inv[k] || 0) > 0 && ITEMS[k].u !== false);
const addItem = (id, n = 1) => { S.p.inv[id] = (S.p.inv[id] || 0) + n; };
const takeItem = id => { S.p.inv[id] = Math.max(0, (S.p.inv[id] || 0) - 1); };
const curItem = () => { const l = invList(); return l.length ? l[S.p.sel % l.length] : null; };
function cycleItem() { const l = invList(); if (l.length > 1) { S.p.sel = (S.p.sel + 1) % l.length; Sfx.blip(); } }
function nearest() {
  const p = S.p; let best = null, bd = 17;
  for (const o of S.W.f[p.f].objs) { if (o.type === 'deco' || o.removed) continue; const rx = clamp(p.x, o.x * TS, (o.x + o.w) * TS), ry = clamp(p.y, o.y * TS, (o.y + o.h) * TS), dd = Math.hypot(rx - p.x, ry - p.y), cx = (o.x + o.w / 2) * TS, cy = (o.y + o.h / 2) * TS; if (isFP() && Math.abs(angDiff(Math.atan2(cy - p.y, cx - p.x), p.yaw)) > 1.0 && dd > 3) continue; const d = dd + 6; if (d < bd) { bd = d; best = o; } }
  return best;
}
function hintFor(o) {
  switch (o.type) {
    case 'chest': case 'wardrobe': case 'fridge': case 'safe': case 'vault': case 'mechbox': case 'crate': return o.opened ? null : 'x'; case 'microwave': return o.cooking ? null : 'x';
    case 'gap': return o.bridged ? null : 'x'; case 'fusebox': return o.powered ? null : 'x';
    case 'door': case 'recharge': case 'table': case 'computer': case 'exit': case 'stairs': return 'x';
  } return null;
}
function sparkle(x, y, n = 12) { for (let i = 0; i < n; i++) S.parts.push({ x, y, vx: rand(-34, 34), vy: rand(-48, -14), g: 90, t: 0, life: rand(0.5, 0.9), col: ['#ffd23f', '#fff6a0', '#ff9ad0', '#8ae0ff'][i % 4], sz: 2, star: true }); }
const shared = () => typeof MP !== 'undefined' && MP && MP.share && MP.share.n > 1 && typeof Net !== 'undefined' && Net.ch;
function applyShared(m) { // llega algo que consiguió un compañero
  if (!S || !S.p) { if (typeof MP !== 'undefined' && MP) (MP.pending = MP.pending || []).push(m); return; }
  const p = S.p;
  if (m.t === 'code') { if (m.part === 'A') p.codeA = m.digits; else p.codeB = m.digits; say(m.from + ' ENCONTRO EL CODIGO', 3); Sfx.pickup(); return; }
  const l = m.loot; if (!l) return;
  if (l.key) { p.keys.add(l.key); got('llave', 'LLAVE ' + KEY_NAMES[l.key], 1); } else if (l.item) { addItem(l.item, l.n); got(l.item, ITEMS[l.item].n, l.n); } else if (l.mat) { p.mats[l.mat] = (p.mats[l.mat] || 0) + l.n; got(l.mat, MAT_NAMES[l.mat], l.n); }
  say(m.from + ' TE LO PASO', 2.6); Sfx.pickup();
}
function sharedMsg(m) { applyShared(m); }
function giveLoot(o) {
  const p = S.p, parts = [];
  if (shared()) for (const l of o.loot || []) if (l.prog) Net.post({ t: 'give', from: SAVE.name.slice(0, 8), loot: l });
  for (const l of o.loot || []) { if (l.key) { p.keys.add(l.key); parts.push('LLAVE ' + KEY_NAMES[l.key]); got('llave', 'LLAVE ' + KEY_NAMES[l.key], 1); } else if (l.item) { addItem(l.item, l.n); parts.push(l.n + ' ' + ITEMS[l.item].n); got(l.item, ITEMS[l.item].n, l.n); } else { p.mats[l.mat] = (p.mats[l.mat] || 0) + l.n; parts.push(l.n + ' ' + MAT_NAMES[l.mat]); got(l.mat, MAT_NAMES[l.mat], l.n); } }
  Sfx.pickup(); 
}
function useAction(forced) {
  const p = S.p, o = forced || nearest(); if (!o) return;
  switch (o.type) {
    case 'chest': case 'wardrobe': case 'fridge': if (o.opened) return; o.opened = true; S.stats.chests++; Sfx.chest(); sparkle((o.x + 0.5) * TS, o.y * TS + 6); giveLoot(o); break;
    case 'door': if (p.keys.has(o.id) || (p.inv.ganzua > 0 && (takeItem('ganzua'), true))) { o.removed = true; S.W.f[o.f].g[o.y][o.x] = '.'; Sfx.door(); say('PUERTA ABIERTA'); sparkle((o.x + 0.5) * TS, (o.y + 0.5) * TS, 8); } else say('PUERTA CON LLAVE ' + KEY_NAMES[o.id]); break;
    case 'mechbox': if (o.opened) return; if (p.inv.engranaje > 0) { takeItem('engranaje'); o.opened = true; S.stats.chests++; Sfx.hit(); sparkle((o.x + 0.5) * TS, o.y * TS + 6); giveLoot(o); } else say('FALTA UN ENGRANAJE'); break;
    case 'crate': if (o.opened) return; if (p.inv.palanca > 0) { o.opened = true; S.stats.chests++; Sfx.hit(); sparkle((o.x + 0.5) * TS, o.y * TS + 6); giveLoot(o); } else say('TABLAS CLAVADAS'); break;
    case 'gap': if (o.bridged) return; if (p.inv.escalera > 0) { takeItem('escalera'); o.bridged = true; for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) S.W.f[o.f].sol[o.y + j][o.x + i] = false; Sfx.door(); sparkle((o.x + 1) * TS, (o.y + 1.5) * TS, 12); say('PUENTE LISTO'); } else say('HUECO EN EL PISO'); break;
    case 'fusebox': if (o.powered) return; if (p.inv.fusible > 0) { takeItem('fusible'); o.powered = true; S.W.f[0].objs.find(x => x.type === 'exit').powered = true; Sfx.power(); Sfx.pickup(); say('ENERGIA RESTAURADA'); } else say('FALTA UN FUSIBLE'); break;
    case 'vault': if (o.opened) say('PRIMERAS CIFRAS: ' + o.digits + '__'); else if (true) { o.opened = true; p.codeA = o.digits; if (shared()) Net.post({ t: 'code', part: 'A', digits: o.digits, from: SAVE.name.slice(0, 8) }); Sfx.door(); sparkle((o.x + 0.5) * TS, o.y * TS + 6); giveLoot(o); say('CODIGO: ' + o.digits + '__  (FALTAN 2 CIFRAS)', 4); } else say('BOVEDA CERRADA'); break;
    case 'safe': if (o.opened) say('ULTIMAS CIFRAS: __' + o.digits); else if (true) { o.opened = true; p.codeB = o.digits; if (shared()) Net.post({ t: 'code', part: 'B', digits: o.digits, from: SAVE.name.slice(0, 8) }); Sfx.door(); sparkle((o.x + 0.5) * TS, o.y * TS + 6); giveLoot(o); say('CODIGO: __' + o.digits, 4); } break;
    case 'recharge': if (S.blackout) say('SIN ENERGIA'); else if (p.charge >= 99.9) say('LINTERNA LLENA'); else { p.charging = true; say('RECARGANDO...'); } break;
    case 'table': S.overlay = newCraft(); break;
    case 'microwave':
      if (!o.opened) { if (p.inv.engranaje > 0) { takeItem('engranaje'); o.opened = true; Sfx.hit(); sparkle((o.x + 0.5) * TS, o.y * TS + 8, 14); say('¡MICROONDAS ABIERTO!'); } else if (p.inv.palanca > 0) { takeItem('palanca'); o.opened = true; Sfx.hit(); say('MICROONDAS ABIERTO'); } else say('MICROONDAS ATASCADO'); }
      else if (o.cooking) say('COCINANDO...');
      else if (o.food) { o.food = false; if (S.cl.id === 'cocinero') { addItem('pizza', 2); got('pizza', 'PIZZA', 2); } else { addItem('racion', 2); got('racion', 'RACION', 2); } Sfx.pickup(); }
      else if (p.inv.comida > 0) { takeItem('comida'); o.cooking = true; o.cookT = 6; say('COCINANDO...'); Sfx.cam(); }
      else say('MICROONDAS VACIO'); break;
    case 'computer': if (S.blackout && !S.fixed) S.overlay = newPuzzle(); break;
    case 'exit': if (!o.powered) say('SIN ENERGIA'); else if (!o.shutter) { if (p.inv.engranaje > 0) { takeItem('engranaje'); o.shutter = true; Sfx.door(); sparkle((o.x + 0.5) * TS, o.y * TS + 6, 10); say('PERSIANA ABIERTA'); } else say('PERSIANA ATASCADA'); } else S.overlay = { type: 'keypad', entered: '', shake: 0, o }; break;
    case 'stairs': { if (p.stairCd > 0) return; const to = o.to, l = S.W.land(to); p.f = to; p.x = tc(l.x); p.y = tc(l.y); p.stairCd = 0.8; S.fade = 0.5; Sfx.step(); break; }
  }
}
function flashAction() {
  const p = S.p; if (p.beam > 0) return;
  if (p.charge < 33) { say('SIN PILA'); return; }
  p.charge -= 33.4; if (p.charge < 0.5) p.charge = 0; p.beam = 1.4; p.beamHit = false; S.stats.flashes++; Sfx.flash();
}
function enemyInCone(range, half) { const p = S.p, e = S.e; if (e.f !== p.f) return false; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); return d < range && Math.abs(angDiff(Math.atan2(dy, dx), p.ang)) < half && los(p.f, p.x, p.y, e.x, e.y); }
function placeAt(type, extra) { const p = S.p; S.placed.push(Object.assign({ type, f: p.f, x: p.x, y: p.y, t: 0 }, extra)); }
function itemAction() {
  const p = S.p, e = S.e, it = curItem(); if (!it) return;
  switch (it) {
    case 'mascara': takeItem(it); p.immune = 10; Sfx.hiss(); break;
    case 'taser': if (enemyInCone(30, 1.0)) { takeItem(it); stunEnemy(4); if (e.state === 'grab') releaseGrab(1.5); sparkle(e.x, e.y - 14, 10); Sfx.hit(); } else { Sfx.light(); sparkle(p.x + Math.cos(p.ang) * 10, p.y - 8, 4); } break;
    case 'petardos': takeItem(it); placeAt('petardo'); Sfx.blip(); break;
    case 'trampa': takeItem(it); placeAt('trampa'); Sfx.blip(); break;
    case 'mancha': takeItem(it); placeAt('mancha'); Sfx.blip(); break;
    case 'musica': takeItem(it); S.lure = { type: 'musica', f: p.f, x: p.x, y: p.y, life: 16, stay: 8 }; Sfx.musicBox(); break;
    case 'barricada': { const tx = tileOf(p.x + Math.cos(p.ang) * 16), ty = tileOf(p.y + Math.sin(p.ang) * 16), F = S.W.f[p.f]; if (solidTile(p.f, tx, ty) || F.objs.some(o => o.type === 'stairs' && o.x === tx && o.y === ty) || tileOf(p.x) === tx && tileOf(p.y) === ty || barAt(p.f, tx, ty)) { say('NO SE PUEDE PONER AQUI'); break; } takeItem(it); F.sol[ty][tx] = true; S.placed.push({ type: 'barricada', f: p.f, tx, ty, x: tc(tx), y: tc(ty), t: 0 }); Sfx.door(); break; }
    case 'turbo': takeItem(it); p.charge = Math.min(100, p.charge + 33.4); Sfx.pickup(); break;
    case 'pizza': { takeItem(it); let px = p.x + Math.cos(p.ang) * 44, py = p.y + Math.sin(p.ang) * 44; if (hits(p.f, px, py, 3, 3)) { px = p.x; py = p.y; } S.lure = { type: 'pizza', f: p.f, x: px, y: py, life: 25, stay: S.cl.pizzaT || 7 }; Sfx.blip(); break; }
    case 'camara': takeItem(it); p.beam = 0.5; p.beamHit = true; S.flick = 0; S.fade = 0; Sfx.flash(); p.camFlash = 0.25; for (const gh of S.ghosts) if (gh.f === p.f && Math.hypot(gh.x - p.x, gh.y - p.y) < 130) { gh.dead = true; sparkle(gh.x, gh.y - 8, 10); }
    if (enemyInCone(115, 0.62)) { if (e.state === 'grab') releaseGrab(1.5); stunEnemy(5 + (S.cl.camBonus || 0)); } break;
    case 'nerf': { takeItem(it); const ex = p.x + Math.cos(p.ang) * 150, ey = p.y + Math.sin(p.ang) * 150; S.parts.push({ x: p.x, y: p.y - 6, vx: Math.cos(p.ang) * 260, vy: Math.sin(p.ang) * 260, t: 0, life: 0.5, col: '#ff6a4a', sz: 3 }); Sfx.blip(); if (e.f === p.f) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy), perp = Math.abs(dx * Math.sin(p.ang) - dy * Math.cos(p.ang)); if (d < 150 && perp < 9 && Math.cos(p.ang) * dx + Math.sin(p.ang) * dy > 0 && los(p.f, p.x, p.y, e.x, e.y)) { stunEnemy(2); if (e.state === 'grab') releaseGrab(1); } } break; }
    case 'jeringa': takeItem(it); p.hp = Math.min(p.maxhp, p.hp + 40); sparkle(p.x, p.y - 10, 8); Sfx.pickup(); break;
    case 'racion': takeItem(it); p.hp = Math.min(p.maxhp, p.hp + 50); sparkle(p.x, p.y - 10, 8); Sfx.pickup(); break;
    case 'bebida': takeItem(it); p.boost = 5; Sfx.ability(); break;
    case 'humo': takeItem(it); for (let i = 0; i < 18; i++) S.parts.push({ x: p.x + rand(-6, 6), y: p.y - 4 + rand(-4, 4), vx: rand(-14, 14), vy: rand(-12, 2), t: 0, life: rand(1.5, 3), col: '#b8b8c8', sz: 4, fade: 1 }); Sfx.hiss(); if (e.f === p.f && Math.hypot(e.x - p.x, e.y - p.y) < 55) { e.blind = 4; e.state = 'patrol'; e.path = []; e.goal = null; e.calm = Math.max(e.calm, 5); } break;
    case 'torreta': takeItem(it); placeAt('torreta', { life: 15, cd: 0 }); Sfx.blip(); break;
  }
  if (!invList().length) p.sel = 0; else p.sel = Math.min(p.sel, invList().length - 1);
}
// ---------------- fantasmas: te asustan y te dejan lento ----------------
function spawnGhost() {
  const p = S.p; for (let i = 0; i < 12; i++) { const a = Math.random() * 6.283, r = rand(80, 125), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r; if (x > 24 && y > 24 && x < MW * TS - 24 && y < MH * TS - 24) { S.ghosts.push({ f: p.f, x, y, a: 0, t: 0, life: 22, ph: Math.random() * 6 }); Sfx.warn(); return; } }
}
function updateGhosts(dt) {
  const p = S.p, df = S.df; S.ghostT -= dt;
  if (S.ghostT <= 0 && S.t > df.grace + 8 && S.ghosts.length < 1 + (CFG.level > 5 ? 1 : 0)) { spawnGhost(); S.ghostT = rand(df.ghostEvery * 0.7, df.ghostEvery * 1.2); }
  const busy = S.overlay || p.charging || !p.moving;
  for (const gh of S.ghosts) {
    gh.t += dt; gh.life -= dt; gh.a = Math.min(1, gh.t / 1.5) * Math.min(1, gh.life / 1.5);
    if (gh.f !== p.f) { gh.life -= dt * 3; continue; }
    const dx = p.x - gh.x, dy = p.y - gh.y, d = Math.hypot(dx, dy) || 1, sp = df.ghostSpeed * (busy ? 1.8 : 1) * (S.blackout ? 1.2 : 1);
    gh.x += dx / d * sp * dt; gh.y += dy / d * sp * dt;
    if (d < 11 && gh.a > 0.5 && !p.dead && !p.escaped) { gh.dead = true; S.scream = { t: 0, dur: 1.3 }; p.slow = 8; p.hp = Math.max(1, p.hp - 8); S.shake = 0.8; closeOverlay(); Sfx.scare(); }
    if (p.beam > 0 && d < 120 && Math.abs(angDiff(Math.atan2(dy, dx) + Math.PI, p.ang)) > 3.1 - 0.5 && false) gh.dead = true;
    if (p.beam > 0 && d < 125 && Math.abs(angDiff(Math.atan2(-dy, -dx), p.ang)) < 0.6) { gh.dead = true; sparkle(gh.x, gh.y - 8, 12); Sfx.flee(); }
  }
  S.ghosts = S.ghosts.filter(g2 => !g2.dead && g2.life > 0);
  if (S.scream) { S.scream.t += dt; if (S.scream.t > S.scream.dur) S.scream = null; }
}
function mash() { const p = S.p; p.grab = Math.min(100, p.grab + 11); Sfx.mash(); }
function press(kind) {
  if (S.intro > 0 || S.ended) return;
  if (S.dollMode) { if (kind === 'use') dollUse(); else if (kind === 'flash') dollPing(); return; }
  if (S.p.held && kind === 'use') return;
  if (S.p.dead || S.p.escaped) return;
  if (S.overlay) return;
  if (kind === 'use') useAction(); else if (kind === 'flash') flashAction(); else itemAction();
}

// ---------------- overlays ----------------
const COLS = ['#e04040', '#4a8aff', '#3ae07a', '#ffd23f'];
function newPuzzle() { const w = S.cl.fix || 3; return { type: 'puzzle', seq: [0, 1, 2].map(() => Math.random() * 4 | 0), phase: 'show', t: 0, idx: 0, wait: w, waitMax: w, flashC: -1, fail: 0 }; }
const PAD = { x: 104, y: 14, w: 112, h: 154 };
function padKeys() { const ks = []; ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'X'].forEach((k, i) => ks.push({ k, x: 112 + (i % 3) * 32, y: 54 + ((i / 3) | 0) * 26, w: 28, h: 22 })); return ks; }
// ---- mesa de crafteo 3x3 (sin orden) ----
const MAT_ORDER = ['chatarra', 'cuerda', 'pilas', 'tela', 'madera', 'aluminio', 'lente', 'circuito', 'aceite'];
function newCraft() { return { type: 'craft', grid: Array(9).fill(null), tab: 'rec', crafting: false, cT: 0, rec: null, warn: 0, sel: null, scroll: 0, all: false, made: 0 }; }
const haveMat = (ov, k) => (S.p.mats[k] || 0) + (ov ? ov.grid.filter(x => x === k).length : 0);
const recCan = (ov, r) => Math.min(...Object.keys(r.ing).map(k => Math.floor(haveMat(ov, k) / r.ing[k])));
const recList = ov => RECIPES.map((r, i) => ({ r, i, can: recCan(ov, r) })).sort((a, b) => (b.can > 0) - (a.can > 0) || a.i - b.i);
function craftMatch(grid) { const cnt = {}; for (const m of grid) if (m) cnt[m] = (cnt[m] || 0) + 1; const ks = Object.keys(cnt); if (!ks.length) return null; return RECIPES.find(r => { const rk = Object.keys(r.ing); return rk.length === ks.length && rk.every(k => cnt[k] === r.ing[k]); }) || null; }
function craftAdd(ov, m) { if ((S.p.mats[m] || 0) <= 0 || ov.crafting) return false; const i = ov.grid.indexOf(null); if (i < 0) return false; ov.grid[i] = m; S.p.mats[m]--; Sfx.blip(); return true; }
function craftRemove(ov, i) { if (ov.crafting) return; const m = ov.grid[i]; if (!m) return; ov.grid[i] = null; S.p.mats[m] = (S.p.mats[m] || 0) + 1; Sfx.blip(); }
function craftClear(ov) { if (ov.crafting) return; for (let i = 0; i < 9; i++) craftRemove(ov, i); }
function craftFill(ov, r) { craftClear(ov); for (const k in r.ing) for (let n = 0; n < r.ing[k]; n++) if (!craftAdd(ov, k)) { craftClear(ov); ov.warn = 0.7; Sfx.hit(); return false; } return true; }
function craftStart(ov, all) { const r = craftMatch(ov.grid); if (r && !ov.crafting) { ov.crafting = true; ov.cT = 0; ov.rec = r; ov.all = !!all; ov.made = 0; Sfx.cam(); } }
function closeOverlay() { const ov = S.overlay; if (!ov) return; if (ov.type === 'craft') for (let i = 0; i < 9; i++) if (ov.grid[i]) S.p.mats[ov.grid[i]] = (S.p.mats[ov.grid[i]] || 0) + 1; S.overlay = null; }
const CRAFT = { slot: i => ({ x: 20 + (i % 3) * 30, y: 28 + ((i / 3) | 0) * 30, w: 28, h: 28 }), res: { x: 130, y: 34, w: 32, h: 32 }, btn: { x: 118, y: 72, w: 62, h: 16 }, all: { x: 118, y: 91, w: 62, h: 14 }, clr: { x: 118, y: 108, w: 62, h: 12 }, close: { x: 290, y: 9, w: 16, h: 12 }, tabM: { x: 190, y: 24, w: 52, h: 12 }, tabR: { x: 244, y: 24, w: 58, h: 12 }, matRow: i => ({ x: 190, y: 40 + i * 14, w: 112, h: 13 }), recRow: i => ({ x: 190, y: 40 + i * 15, w: 112, h: 14 }), up: { x: 190, y: 162, w: 54, h: 11 }, dn: { x: 248, y: 162, w: 54, h: 11 }, ROWS: 8 };
const inR = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
function craftPointer(x, y) {
  const ov = S.overlay;
  if (inR(CRAFT.close, x, y)) { closeOverlay(); return true; }
  for (let i = 0; i < 9; i++) if (inR(CRAFT.slot(i), x, y)) { craftRemove(ov, i); return true; }
  if (inR(CRAFT.btn, x, y)) { craftStart(ov, false); return true; }
  if (inR(CRAFT.all, x, y)) { craftStart(ov, true); return true; }
  if (inR(CRAFT.clr, x, y)) { craftClear(ov); return true; }
  if (inR(CRAFT.tabM, x, y)) { ov.tab = 'mat'; Sfx.blip(); return true; } if (inR(CRAFT.tabR, x, y)) { ov.tab = 'rec'; Sfx.blip(); return true; }
  if (ov.tab === 'mat') { for (let i = 0; i < 9; i++) if (inR(CRAFT.matRow(i), x, y)) { craftAdd(ov, MAT_ORDER[i]); return true; } }
  else {
    const L = recList(ov), mx = Math.max(0, L.length - CRAFT.ROWS);
    if (inR(CRAFT.up, x, y)) { ov.scroll = clamp(ov.scroll - CRAFT.ROWS + 1, 0, mx); Sfx.blip(); return true; } if (inR(CRAFT.dn, x, y)) { ov.scroll = clamp(ov.scroll + CRAFT.ROWS - 1, 0, mx); Sfx.blip(); return true; }
    for (let i = 0; i < CRAFT.ROWS; i++) if (inR(CRAFT.recRow(i), x, y) && L[ov.scroll + i]) { const e = L[ov.scroll + i]; if (!ov.crafting) { ov.sel = e.i; craftFill(ov, e.r); } return true; }
  }
  return x > 10 && x < 310 && y > 4 && y < 176;
}
function puzBtns() { return [0, 1, 2, 3].map(i => ({ i, x: 118 + (i % 2) * 44, y: 76 + ((i / 2) | 0) * 38, w: 40, h: 34 })); }
function overlayInput(kind, v) {
  const ov = S.overlay; if (!ov) return;
  if (ov.type === 'keypad') {
    if (v === 'X') { S.overlay = null; return; }
    if (v === 'C') { ov.entered = ''; return; }
    if (ov.entered.length < 4) { ov.entered += v; Sfx.blip(); }
    if (ov.entered.length === 4) {
      if (ov.entered === ov.o.code) { ov.o.escape = true; S.p.escaped = true; S.overlay = null; Sfx.door(); Sfx.win(); 0; }
      else { ov.shake = 0.5; ov.entered = ''; Sfx.hit(); }
    }
  } else if (ov.type === 'puzzle' && ov.phase === 'input') {
    ov.flashC = v; ov.flashT = 0.2; Sfx.blip();
    if (ov.seq[ov.idx] === v) { ov.idx++; if (ov.idx >= 3) { ov.phase = 'wait'; ov.wait = ov.waitMax; Sfx.pickup(); } }
    else { ov.fail = 0.8; ov.phase = 'show'; ov.t = 0; ov.idx = 0; ov.seq = [0, 1, 2].map(() => Math.random() * 4 | 0); Sfx.hit(); }
  }
}
function updateOverlay(dt) {
  const ov = S.overlay; if (!ov) return;
  if (ov.shake > 0) ov.shake -= dt;
  if (ov.type === 'craft') { if (ov.warn > 0) ov.warn -= dt; if (ov.crafting) { ov.cT += dt; if (ov.cT >= 2.5 * (S.cl.craft || 1)) { ov.crafting = false; addItem(ov.rec.out, ov.rec.n); got(ov.rec.out, ITEMS[ov.rec.out].n, ov.rec.n); ov.grid = Array(9).fill(null); S.stats.crafts++; ov.made++; Sfx.pickup(); sparkle(S.p.x, S.p.y - 12, 10); if (ov.all && craftFill(ov, ov.rec)) { ov.crafting = true; ov.cT = 0; } else ov.all = false; } } return; }
  if (ov.type !== 'puzzle') return;
  if (ov.flashT > 0) ov.flashT -= dt; if (ov.fail > 0) ov.fail -= dt;
  if (ov.phase === 'show') { ov.t += dt; if (ov.fail <= 0 && ov.t > 0.9 * 3 + 1.0) { ov.phase = 'input'; ov.idx = 0; } }
  else if (ov.phase === 'wait') { ov.wait -= dt; if (ov.wait <= 0) { S.overlay = null; S.blackout = false; S.fixed = true; Sfx.bell(); 0; } }
}

// ---------------- enemigo (bot) ----------------
function planTo(f, tx, ty) {
  const e = S.e; let gx = tx, gy = ty;
  if (f !== e.f) { const l = S.W.land(e.f); gx = l.x; gy = l.y; }
  const path = bfs(e.f, tileOf(e.x), tileOf(e.y), gx, gy);
  if (path) { e.path = path; e.goal = { f, tx, ty }; return true; }
  return false;
}
function pickWaypoint() {
  const e = S.e;
  for (let i = 0; i < 8; i++) { const w = S.W.waypoints[Math.random() * S.W.waypoints.length | 0]; if (planTo(w[0], w[1], w[2])) return true; }
  return false;
}
const ramp = () => 1 + 0.5 * clamp(S.t / S.dur, 0, 1);
function enemySees() {
  const e = S.e, p = S.p, df = S.df; if (p.dead || p.escaped || p.immune > 0 || p.f !== e.f || e.blind > 0) return false;
  const st = S.cl.stealth || 1, dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d > df.sight * ramp() * st) return false;
  if (d < 17 * st + 2) return los(e.f, e.x, e.y, p.x, p.y);
  const a = Math.atan2(dy, dx), fa = Math.atan2(e.fy, e.fx);
  return Math.abs(angDiff(a, fa)) < 0.75 + 0.015 * (CFG.level - 1) && los(e.f, e.x, e.y, p.x, p.y);
}
function stunEnemy(sec) { const e = S.e; e.stun = Math.max(e.stun, sec); e.path = []; if (e.state === 'eat') { e.state = 'patrol'; S.lure = null; } Sfx.hiss(); }
function releaseGrab(imm) { const p = S.p, e = S.e; p.held = false; p.immune = Math.max(p.immune, imm); e.state = 'patrol'; e.path = []; e.goal = null; e.stun = Math.max(e.stun, 3.5); e.calm = 14; e.wait = 0; e.waitT = 3; Sfx.flee(); }
function updateEnemy(dt) {
  const e = S.e, p = S.p, df = S.df, rp = ramp(), st = S.cl.stealth || 1;
  e.anim += dt; if (e.stairCd > 0) e.stairCd -= dt; e.calm = Math.max(0, e.calm - dt); e.blind = Math.max(0, e.blind - dt); e.slow = Math.max(0, e.slow - dt); e.dmgRed = Math.max(0, e.dmgRed - dt);
  if (e.state !== 'grab') for (const q of S.placed) {
    if (q.f !== e.f || q.dead || Math.hypot(q.x - e.x, q.y - e.y) > 9) continue;
    if (q.type === 'trampa') { q.dead = true; e.slow = 4; Sfx.hit(); } else if (q.type === 'petardo') { q.dead = true; e.dmgRed = 5; stunEnemy(2); sparkle(q.x, q.y - 4, 10); Sfx.hit(); } else if (q.type === 'mancha') { q.dead = true; stunEnemy(3); Sfx.flee(); }
  }
  for (const q of S.placed) if (q.type === 'torreta' && q.f === e.f && !q.dead) { q.cd -= dt; if (q.cd <= 0 && Math.hypot(q.x - e.x, q.y - e.y) < 95 && los(q.f, q.x, q.y, e.x, e.y)) { q.cd = 3; q.fire = 0.2; stunEnemy(1.5); Sfx.hit(); } }
  if (e.state === 'grab') {
    e.x += (p.x - e.x) * Math.min(1, dt * 8); e.y += (p.y - 6 - e.y) * Math.min(1, dt * 8);
    p.hp -= df.dmg * (e.dmgRed > 0 ? 0.5 : 1) * dt;
    if (p.grab >= 100) releaseGrab(2.5);
    else if (p.hp <= 0) { p.hp = 0; p.dead = true; p.held = false; e.state = 'patrol'; e.stun = 2; Sfx.scare(); S.shake = 0.6; }
    else p.grab = Math.min(100, p.grab + 100 / Math.max(1.6, 3 - 0.12 * CFG.level) * dt); // te sueltas solo; no hay que tocar nada
    return;
  }
  if (e.stun > 0) { e.stun -= dt; return; }
  if (S.dollMode && !S.dollAuto) { dollControl(dt); return; }
  if (e.ring > 0) { e.ring += dt; if (e.ring > 1.2) e.ring = 0; }
  // señuelos: pizza y caja musical
  const lu = S.lure;
  if (lu) { lu.life -= dt; if (lu.life <= 0) S.lure = null; }
  if (S.lure && e.state !== 'eat' && S.lure.f === e.f && Math.hypot(S.lure.x - e.x, S.lure.y - e.y) < 240) {
    if (Math.hypot(S.lure.x - e.x, S.lure.y - e.y) < 10) { e.state = 'eat'; e.eat = S.lure.stay; e.path = []; }
    else if (e.state !== 'lure') { e.state = 'lure'; planTo(e.f, tileOf(S.lure.x), tileOf(S.lure.y)); }
  }
  if (e.state === 'eat') { e.eat -= dt; if (e.eat <= 0) { S.lure = null; e.state = 'patrol'; e.goal = null; } return; }
  if (e.state === 'lure' && !S.lure) { e.state = 'patrol'; e.goal = null; }
  // visión
  const hunt = !!S.dollAuto && !p.dead && !p.escaped && p.immune <= 0 && e.blind <= 0;
  const sees = enemySees() || hunt;
  if (sees && e.state !== 'chase' && e.state !== 'lure' && (e.calm <= 0 || hunt) && S.t > (hunt ? df.grace : df.grace + 5)) { e.state = 'chase'; e.lost = 0; Sfx.warn(); }
  if (e.state === 'chase') {
    if (sees) { e.lost = 0; e.last = { f: p.f, x: p.x, y: p.y }; } else e.lost += dt;
    if (e.lost > df.lose || p.dead || p.escaped || p.immune > 0 && !sees && e.lost > 0.5 || e.blind > 0) { e.state = 'investigate'; if (e.last) planTo(e.last.f, tileOf(e.last.x), tileOf(e.last.y)); e.lost = 0; e.calm = df.calm * 2 / rp; }
    e.repath -= dt; if (e.repath <= 0 && !p.dead) { e.repath = 0.25; planTo(sees ? p.f : e.last ? e.last.f : e.f, tileOf(sees ? p.x : e.last ? e.last.x : e.x), tileOf(sees ? p.y : e.last ? e.last.y : e.y)); }
  }
  // atrapar
  if (p.f === e.f && !p.dead && !p.escaped && !p.held && p.immune <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 13 && (e.state === 'chase' || e.state === 'investigate' || e.state === 'patrol')) {
    e.state = 'grab'; p.held = true; p.grab = 0; p.charging = false; closeOverlay(); S.stats.grabs++; Sfx.grab(); S.shake = 0.4; return;
  }
  // seguir camino
  const base = e.state === 'chase' ? df.spChase : e.state === 'investigate' || e.state === 'lure' ? df.spInv : df.spPatrol;
  const spd = base * Math.sqrt(rp) * (S.blackout ? 1.15 : 1) * (e.slow > 0 ? 0.45 : 1);
  if (e.path.length) {
    const [tx, ty] = e.path[0], dx = tc(tx) - e.x, dy = tc(ty) - e.y, d = Math.hypot(dx, dy), bar = barAt(e.f, tx, ty);
    if (bar && d < 22) { e.brk += dt; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 'u' : 'd'); if (e.brk >= 6) { bar.dead = true; S.W.f[e.f].sol[ty][tx] = false; e.brk = 0; Sfx.hit(); sparkle(bar.x, bar.y - 4, 8); } return; }
    e.brk = 0;
    if (d < 2) e.path.shift();
    else { const stp = Math.min(d, spd * dt), ux = dx / d, uy = dy / d; move(e, ux * stp, uy * stp, EHW, EHH); e.fx = ux; e.fy = uy; e.dir = Math.abs(ux) > Math.abs(uy) ? (ux < 0 ? 'l' : 'r') : (uy < 0 ? 'u' : 'd'); }
  } else {
    if (e.goal && e.goal.f !== e.f && e.stairCd <= 0) { const to = e.goal.f, l = S.W.land(to); e.f = to; e.x = tc(l.x); e.y = tc(l.y); e.stairCd = 3; planTo(e.goal.f, e.goal.tx, e.goal.ty); }
    else if (e.state === 'investigate' || e.state === 'chase') { e.wait += dt; if (e.wait > 1.6) { e.wait = 0; e.state = 'patrol'; e.goal = null; } }
    else if (e.state === 'lure') { e.state = 'patrol'; }
    else { e.wait += dt; if (e.wait > e.waitT) { e.wait = 0; e.waitT = rand(2.5, 6.5) / rp; pickWaypoint(); } }
  }
}


// ---------------- MODO MUÑECA: tú eres la muñeca y un BOT juega como humano ----------------
function dollControl(dt) {
  const e = S.e, p = S.p, df = S.df; if (S.pingCd > 0) S.pingCd -= dt; if (S.ping > 0) S.ping -= dt;
  const [vx, vy] = window.__fakeIn || inputVec(), mag = Math.hypot(vx, vy);
  if (mag > 0.05) { const sp = df.spChase * 0.98 * (e.slow > 0 ? 0.45 : 1) * (S.blackout ? 1.1 : 1); move(e, vx * sp * dt, vy * sp * dt, EHW, EHH); e.fx = vx; e.fy = vy; e.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'l' : 'r') : (vy < 0 ? 'u' : 'd'); e.path = [[0, 0]]; e.state = 'chase'; e.anim += dt; }
  else { e.path = []; e.state = 'patrol'; }
  if (p.f === e.f && !p.dead && !p.escaped && !p.held && p.immune <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 13) { e.state = 'grab'; p.held = true; p.grab = 0; S.stats.grabs++; Sfx.grab(); S.shake = 0.3; }
}
function dollUse() { // la muñeca sube y baja escaleras
  const e = S.e; if (e.stairCd > 0) return;
  for (const o of S.W.f[e.f].objs) if (o.type === 'stairs') { const rx = clamp(e.x, o.x * TS, (o.x + o.w) * TS), ry = clamp(e.y, o.y * TS, (o.y + o.h) * TS); if (Math.hypot(rx - e.x, ry - e.y) < 20) { const to = o.to, l = S.W.land(to); e.f = to; e.x = tc(l.x); e.y = tc(l.y); e.stairCd = 1; S.fade = 0.4; Sfx.step(); return; } }
  say('ACERCATE A UNA ESCALERA', 1.5);
}
function dollPing() { // radar de la muñeca (habilidad del jugador): muestra dónde está el bot unos segundos
  if (S.pingCd > 0) return; S.pingCd = 12; S.ping = 2.5; S.e.ring = 0.001; Sfx.radar(0.8);
}
const botHas = id => (S.p.inv[id] || 0) > 0;
function botInit() { S.bot = { path: [], goalKey: '', goal: null, think: 0, react: 0, mashT: 0, craft: null, fleeT: 0, stuck: 0, lx: 0, ly: 0, wander: 0 }; }
function adjTiles(o) { const r = []; for (let j = o.y - 1; j <= o.y + o.h; j++) for (let i = o.x - 1; i <= o.x + o.w; i++) { if (i >= o.x && i < o.x + o.w && j >= o.y && j < o.y + o.h) continue; if (!solidTile(o.f, i, j)) r.push([i, j]); } return r; }
function botPathTo(f, tiles, fromF, fx, fy) { let best = null; for (const [i, j] of tiles) { const pa = bfs(f, fx, fy, i, j); if (pa && (!best || pa.length < best.path.length)) best = { path: pa, tile: [i, j] }; } return best; }
function botNeeds() {
  const W = S.W, p = S.p, ex = W.f[0].objs.find(o => o.type === 'exit'), all = [].concat(W.f[0].objs, W.f[1].objs);
  const mech = all.filter(o => o.type === 'mechbox' && !o.opened).length, crates = all.filter(o => o.type === 'crate' && !o.opened).length;
  const fb = all.find(o => o.type === 'fusebox'), gap = all.find(o => o.type === 'gap');
  const need = [['engranaje', mech + (ex.shutter ? 0 : 1)], ['escalera', gap && !gap.bridged ? 1 : 0], ['fusible', fb && !fb.powered ? 1 : 0]];
  return { need, mech, crates, ex };
}
function botPickGoal() {
  const p = S.p, W = S.W, all = [].concat(W.f[0].objs, W.f[1].objs), N = botNeeds(), ex = N.ex, codes = p.codeA && p.codeB && (p.codeA + p.codeB) === ex.code;
  const sx = tileOf(p.x), sy = tileOf(p.y), cands = [];
  const add = (o, kind, bonus = 0) => cands.push({ o, kind, bonus });
  if (ex.powered && ex.shutter && codes) add(ex, 'exit', -999);
  for (const o of all) {
    if (o.removed) continue;
    switch (o.type) {
      case 'chest': case 'wardrobe': case 'fridge': case 'vault': case 'safe': if (!o.opened) add(o, 'use'); break;
      case 'mechbox': if (!o.opened && botHas('engranaje')) add(o, 'use', -20); break;
      case 'crate': if (!o.opened && botHas('palanca')) add(o, 'use', -20); break;
      case 'door': if (p.keys.has(o.id)) add(o, 'use', -30); break;
      case 'gap': if (!o.bridged && botHas('escalera')) add(o, 'use', -30); break;
      case 'fusebox': if (!o.powered && botHas('fusible')) add(o, 'use', -30); break;
      case 'exit': if (o.powered && !o.shutter && (p.inv.engranaje || 0) > N.mech) add(o, 'use', -40); break;
    }
  }
  // fabricar lo que falte
  for (const [it, n] of N.need) if (n > 0 && (p.inv[it] || 0) < n) { const rc = RECIPES.find(r => r.out === it); if (rc && Object.keys(rc.ing).every(k => (p.mats[k] || 0) >= rc.ing[k])) { const tb = all.find(o => o.type === 'table'); if (tb) add(tb, 'craft', -25); break; } }
  if (!cands.some(c => c.kind === 'use') && N.crates > 0 && !botHas('palanca')) { const rc = RECIPES.find(r => r.out === 'palanca'); if (Object.keys(rc.ing).every(k => (p.mats[k] || 0) >= rc.ing[k])) { const tb = all.find(o => o.type === 'table'); if (tb) add(tb, 'craft', -10); } }
  if (p.charge < 34 && !S.blackout) { const rc = all.find(o => o.type === 'recharge'); if (rc) add(rc, 'charge', 25); }
  let best = null;
  for (const c of cands) {
    const o = c.o; let cost, route;
    if (o.f === p.f) { route = botPathTo(o.f, adjTiles(o), p.f, sx, sy); if (!route) continue; cost = route.path.length; }
    else { const st = W.f[p.f].objs.find(q => q.type === 'stairs'); if (!st) continue; const land = W.land(o.f), pr = botPathTo(p.f, adjTiles(st), p.f, sx, sy); if (!pr) continue; const t2 = adjTiles(o).some(([i, j]) => bfs(o.f, land.x, land.y, i, j)); if (!t2) continue; cost = pr.path.length + 30; route = pr; c.viaStairs = st; }
    cost += c.bonus; if (!best || cost < best.cost) best = { c, route, cost };
  }
  return best;
}
function botFace(x, y) { S.p.ang = Math.atan2(y - S.p.y, x - S.p.x); }
function botItem(id) { const l = invList(), i = l.indexOf(id); if (i < 0) return false; S.p.sel = i; itemAction(); return true; }
function botThink(dt) {
  const p = S.p, e = S.e, B = S.bot, W = S.W; if (!B || p.dead || p.escaped || S.ended) return;
  p.moving = false;
  const same = e.f === p.f, d = same ? Math.hypot(e.x - p.x, e.y - p.y) : 999, seen = same && los(p.f, p.x, p.y, e.x, e.y);
  B.react -= dt;
  if (p.held) { // forcejeo: aprieta unas 4.5 veces por segundo; usa el taser si lo tiene
    if (botHas('taser') && B.react <= 0) { botFace(e.x, e.y); if (botItem('taser')) B.react = 1.2; }
    return;
  }
  if (p.immune > 0 && same && d > 40) { /* inmune: sigue con lo suyo */ }
  // defensas
  if (same && seen && e.stun <= 0 && e.state !== 'eat' && B.react <= 0) {
    if (d < 38 && botHas('taser')) { botFace(e.x, e.y); if (botItem('taser')) { B.react = 1; return; } }
    if (d < 100 && p.charge >= 33.4 && p.beam <= 0) { botFace(e.x, e.y); flashAction(); B.react = 1.3; return; }
    if (d < 85 && botHas('mascara') && p.immune <= 0) { botItem('mascara'); B.react = 1; return; }
    if (d < 75) { for (const it of ['mancha', 'trampa', 'petardos']) if (botHas(it)) { botItem(it); B.react = 1.5; return; } }
  }
  // huir si la muñeca está cerca y no está aturdida
  const threat = same && e.state !== 'eat' && (e.stun <= 0 ? (p.immune <= 0 && (d < 60 || (seen && d < 135))) : (p.immune > 0 && d < 170));
  B.craft && threat && (B.craft = null);
  B.think -= dt;
  if (threat) {
    B.fleeT -= dt;
    if (B.fleeT <= 0 || !B.path.length) {
      B.fleeT = 0.7; let best = null;
      for (let k = 0; k < 10; k++) { const wp = W.waypoints[Math.random() * W.waypoints.length | 0]; if (wp[0] !== p.f) continue; const dd = Math.hypot(wp[1] * TS - e.x, wp[2] * TS - e.y); const pa = bfs(p.f, tileOf(p.x), tileOf(p.y), wp[1], wp[2]); if (!pa || !pa.length) continue; const first = pa[0], toward = Math.hypot(tc(first[0]) - e.x, tc(first[1]) - e.y) < d - 2; if (toward) continue; const sc = dd - pa.length * 2; if (!best || sc > best.sc) best = { sc, pa }; }
      if (best) { B.path = best.pa; B.goalKey = 'flee'; }
    }
    B.craft = null;
  } else if (B.craft) {
    B.craft.t -= dt; if (B.craft.t <= 0) { const rc = B.craft.rec; if (Object.keys(rc.ing).every(k => (p.mats[k] || 0) >= rc.ing[k])) { for (const k in rc.ing) p.mats[k] -= rc.ing[k]; addItem(rc.out, rc.n); S.stats.crafts++; Sfx.pickup(); } B.craft = null; B.goalKey = ''; }
    return;
  } else if (B.think <= 0) {
    B.think = 0.6; const gl = botPickGoal();
    if (!gl) { // nada que hacer: recorre la casa
      if (!B.path.length) { B.wander -= 0.6; const wp = W.waypoints[Math.random() * W.waypoints.length | 0]; if (wp[0] === p.f) { const pa = bfs(p.f, tileOf(p.x), tileOf(p.y), wp[1], wp[2]); if (pa) { B.path = pa; B.goalKey = 'wander'; B.goal = null; } } }
    } else {
      const o = gl.c.viaStairs || gl.c.o, key = gl.c.kind + (gl.c.viaStairs ? 's' : '') + o.type + o.x + '_' + o.y + '_' + o.f;
      if (key !== B.goalKey || (!B.path.length && B.goal !== gl.c)) { B.goalKey = key; B.goal = { o, kind: gl.c.viaStairs ? 'use' : gl.c.kind, real: gl.c.o }; B.path = gl.route.path.slice(); }
    }
  }
  // seguir el camino
  if (B.path.length) {
    const [tx, ty] = B.path[0], dx = tc(tx) - p.x, dy = tc(ty) - p.y, dd = Math.hypot(dx, dy);
    if (dd < 2) B.path.shift();
    else { const sp = p.speed * (p.boost > 0 ? 1.45 : 1) * (p.slow > 0 ? 0.5 : 1), stp = Math.min(dd, sp * dt), ux = dx / dd, uy = dy / dd; const ox = p.x, oy = p.y; move(p, ux * stp, uy * stp, HW, HH); p.moving = true; p.anim += dt * 9; p.ang = Math.atan2(uy, ux); p.dir = Math.abs(ux) > Math.abs(uy) ? (ux < 0 ? 'l' : 'r') : (uy < 0 ? 'u' : 'd'); B.stuck = Math.hypot(p.x - ox, p.y - oy) < stp * 0.2 ? B.stuck + dt : 0; if (B.stuck > 0.8) { B.stuck = 0; B.path = []; B.goalKey = ''; } }
    return;
  }
  // llegó: ejecutar la acción del objetivo
  const gl = B.goal; if (!gl || B.goalKey === 'flee' || B.goalKey === 'wander') return;
  const o = gl.o, rx = clamp(p.x, o.x * TS, (o.x + o.w) * TS), ry = clamp(p.y, o.y * TS, (o.y + o.h) * TS);
  if (Math.hypot(rx - p.x, ry - p.y) > 15) { B.goalKey = ''; return; }
  B.goal = null; B.goalKey = '';
  if (gl.kind === 'craft') { const N = botNeeds(); let rc = null; for (const [it, n] of N.need) if (n > 0 && (p.inv[it] || 0) < n) { const r = RECIPES.find(q => q.out === it); if (r && Object.keys(r.ing).every(k => (p.mats[k] || 0) >= r.ing[k])) { rc = r; break; } } if (!rc && N.crates > 0 && !botHas('palanca')) rc = RECIPES.find(q => q.out === 'palanca'); if (rc) B.craft = { rec: rc, t: 2.5 * (S.cl.craft || 1) }; return; }
  if (gl.kind === 'charge') { useAction(o); return; }
  if (gl.kind === 'exit') { const ex = o; if (p.codeA && p.codeB && p.codeA + p.codeB === ex.code) { p.escaped = true; Sfx.door(); Sfx.win(); } return; }
  botFace(rx, ry); useAction(o);
}

// ---------------- actualización ----------------
function update(dt) {
  if (S.intro > 0) { S.introT += dt; return; }
  const p = S.p, e = S.e;
  S.t += dt; S.shake = Math.max(0, S.shake - dt); S.fade = Math.max(0, S.fade - dt);
  if (S.msg) { S.msg.t -= dt; if (S.msg.t <= 0) S.msg = null; }
  if (S.toasts) { for (const q of S.toasts) q.t += dt; S.toasts = S.toasts.filter(q => q.t < 2.8); }
  for (const q of S.parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; } S.parts = S.parts.filter(q => q.t < q.life);
  if (p.stairCd > 0) p.stairCd -= dt; if (p.immune > 0) p.immune -= dt;
  if (!S.blackout && !S.fixed && S.t >= S.blackoutAt) { S.blackout = true; p.charging = false; Sfx.power(); 0; }
  let [vx, vy] = S.dollMode ? [0, 0] : inputVec();
  if (isFP()) { // movimiento propio de primera persona: el stick avanza/retrocede y GIRA suave; la vista se suaviza
    if (JOYSRC) { const a = Math.abs(vx), t = Math.max(0, a - 0.22) / 0.78; vx *= 1; }
    const k = Math.min(1, dt * 9); FPV.sx += (vx - FPV.sx) * k; FPV.sy += (vy - FPV.sy) * k; if (Math.hypot(FPV.sx, FPV.sy) < 0.04 && !vx && !vy) { FPV.sx = FPV.sy = 0; } vx = FPV.sx; vy = FPV.sy;
  }
  const mag = Math.hypot(vx, vy);
  if (S.overlay && mag > 0.5) closeOverlay();
  p.moving = false;
  if (isFP()) { fpLook(dt); const k = G.keys; if (k.ArrowLeft) p.yaw -= 3.6 * dt; if (k.ArrowRight) p.yaw += 3.6 * dt; if (k.ArrowUp) p.pitch = clamp(p.pitch + 1.2 * dt, -0.8, 0.8); if (k.ArrowDown) p.pitch = clamp(p.pitch - 1.2 * dt, -0.8, 0.8); p.ang = p.yaw; }
  if (!p.held && !p.dead && !p.escaped && !S.overlay && !S.ended) {
    if (mag > 0.05) { const sp = p.speed * (p.boost > 0 ? 1.45 : 1) * (p.slow > 0 ? 0.5 : 1); let mx = vx, my = vy; if (isFP()) { mx = Math.cos(p.yaw) * -vy - Math.sin(p.yaw) * vx; my = Math.sin(p.yaw) * -vy + Math.cos(p.yaw) * vx; } move(p, mx * sp * dt, my * sp * dt, HW, HH); p.moving = true; p.anim += dt * 9; p.dust = (p.dust || 0) - dt; if (p.dust <= 0) { p.dust = 0.17; S.parts.push({ x: p.x + rand(-2, 2), y: p.y + 2, vx: rand(-6, 6), vy: rand(-8, -3), t: 0, life: 0.5, col: '#d8c8b0', sz: 2, fade: 1 }); } if (!isFP()) p.ang = Math.atan2(vy, vx); p.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 'l' : 'r') : (my < 0 ? 'u' : 'd'); if (p.charging) { p.charging = false; 0; } }
  }
  if (p.charging) {
    const st = S.W.f[p.f].objs.find(o => o.type === 'recharge');
    if (S.blackout || p.f !== 0 || Math.hypot((st.x + 0.5) * TS - p.x, (st.y + 0.5) * TS - p.y) > 30) p.charging = false;
    else { p.charge = Math.min(100, p.charge + 10 * (S.cl.recharge || 1) * dt); if (p.charge >= 100) { p.charging = false; say('LINTERNA LISTA'); Sfx.pickup(); } }
  }
  if (p.beam > 0) {
    p.beam -= dt;
    if (!p.beamHit && e.f === p.f) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d < 125 && Math.abs(angDiff(Math.atan2(dy, dx), p.ang)) < 0.52 && los(p.f, p.x, p.y, e.x, e.y)) { p.beamHit = true; if (e.state === 'grab') releaseGrab(1.5); stunEnemy(3); 0; } }
  }
  if (p.held) { /* forcejeo en updateEnemy */ }
  // clase, objetos y cosas colocadas
  if (p.boost > 0) p.boost -= dt; if (p.slow > 0) p.slow -= dt; if (p.camFlash > 0) p.camFlash -= dt;
  if (S.cl.regen && !p.held && !p.dead && p.hp < p.maxhp) p.hp = Math.min(p.maxhp, p.hp + S.cl.regen * dt);
  if (S.hold && !S.hold.fired) { S.hold.t += dt; if (S.hold.t > 0.45) { S.hold.fired = true; cycleItem(); } }
  for (const f of S.W.f) for (const o of f.objs) if (o.type === 'microwave' && o.cooking) { o.cookT -= dt; if (o.cookT <= 0) { o.cooking = false; o.food = true; Sfx.bell(); sparkle((o.x + 0.5) * TS, o.y * TS + 6, 8); } }
  for (const q of S.placed) { q.t += dt; if (q.fire > 0) q.fire -= dt; if (q.type === 'torreta') { q.life -= dt; if (q.life <= 0) q.dead = true; } }
  S.placed = S.placed.filter(q => { if (q.dead && q.type === 'barricada') S.W.f[q.f].sol[q.ty][q.tx] = false; return !q.dead; });
  if (S.dollMode) botThink(dt); updateEnemy(dt); if (!S.dollMode) updateGhosts(dt); updateOverlay(dt);
  if (!S.ended) {
    if (p.escaped) S.ended = { kind: 'escape', t: 0 }; else if (p.dead) S.ended = { kind: 'dead', t: 0 }; else if (S.t >= S.dur) S.ended = { kind: 'survive', t: 0 };
  } else { S.ended.t += dt; if (S.ended.t > (S.ended.kind === 'dead' ? 2.2 : 1.6)) { Sfx.setTension(0); const k = S.ended.kind, L = CFG.level, gain = S.dollMode ? 0 : k === 'escape' ? L : k === 'survive' ? Math.ceil(L / 2) : 0; SAVE.adam += gain; if (!S.dollMode && k !== 'dead' && L === SAVE.maxLevel && SAVE.maxLevel < 10) { SAVE.maxLevel++; CFG.level = SAVE.maxLevel; } persist(); saveCfg(); S.gain = gain; if (!S.dollMode && typeof MPreport === 'function') MPreport(k, S.t); setScene(End, k, S); } }
  const o = !S.overlay && !p.held ? nearest() : null; S.hint = o ? hintFor(o) : null;
  // tensión de la música y parpadeo de luces
  const dist = e.f === p.f ? Math.hypot(e.x - p.x, e.y - p.y) : 999, prox = clamp(1 - dist / 170, 0, 1);
  Sfx.setTension(p.held ? 1 : Math.max(prox * 0.9, e.state === 'chase' ? 0.65 : 0, S.blackout ? 0.4 : 0));
  S.flickCd -= dt; if (S.flickCd <= 0) { S.flickCd = rand(7, 15); S.flick = 0.22; Sfx.light(); }
  if (S.flick > 0) S.flick -= dt;
}
// ---------------- dibujo ----------------
const DARK = []; for (let i = 0; i <= 20; i++) DARK.push('rgba(2,0,10,' + (i / 20).toFixed(2) + ')');
function renderDark(g, cx, cy) { // solo durante el apagón: se ve oscuro pero visible, con luz cerca del jugador
  const p = S.p, B = 3, base = 0.58, amb = 52;
  for (let by = 0; by < VH; by += B) for (let bx = 0; bx < VW; bx += B) {
    const wx = bx + 1 + cx, wy = by + 1 + cy, dx = wx - p.x, dy = wy - p.y, d2 = dx * dx + dy * dy; let l = 0;
    if (d2 < amb * amb) { const t = 1 - Math.sqrt(d2) / amb; l = t * t * (3 - 2 * t); }
    const q = Math.round(l * 5) / 5, a = base * (1 - q);
    if (a > 0.02) { g.fillStyle = DARK[Math.round(a * 20)]; g.fillRect(bx, by, B, B); }
  }
  g.fillStyle = 'rgba(255,0,0,' + (0.05 + 0.05 * Math.sin(G.t * 5)).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH);
}
// ----- ambiente tenebroso (todo está iluminado) -----
const VIG = Spr.mk(VW, VH, g => { for (let by = 0; by < VH; by += 4) for (let bx = 0; bx < VW; bx += 4) { const dx = (bx + 2 - 160) / 160, dy = (by + 2 - 90) / 90, d = Math.sqrt(dx * dx * 0.8 + dy * dy * 1.1), a = clamp((d - 0.55) / 0.75, 0, 1), q = Math.round(a * 6) / 6 * 0.62; if (q > 0.02) { g.fillStyle = 'rgba(8,0,24,' + q.toFixed(2) + ')'; g.fillRect(bx, by, 4, 4); } } });
const VIGR = Spr.mk(VW, VH, g => { for (let by = 0; by < VH; by += 4) for (let bx = 0; bx < VW; bx += 4) { const dx = (bx + 2 - 160) / 160, dy = (by + 2 - 90) / 90, d = Math.sqrt(dx * dx * 0.8 + dy * dy * 1.1), a = clamp((d - 0.4) / 0.7, 0, 1), q = Math.round(a * 6) / 6 * 0.8; if (q > 0.02) { g.fillStyle = 'rgba(200,0,20,' + q.toFixed(2) + ')'; g.fillRect(bx, by, 4, 4); } } });
const DUST = Array.from({ length: 34 }, () => ({ x: Math.random() * 320, y: Math.random() * 180, vx: rand(-6, 6), vy: rand(-5, 3), ph: Math.random() * 6, s: Math.random() < 0.25 ? 2 : 1 }));
function renderFx(g, fp) {
  const p = S.p, e = S.e;
  if (!fp) { g.fillStyle = CFG.style === 'A' ? 'rgba(70,20,120,0.12)' : 'rgba(30,10,60,0.05)'; g.fillRect(0, 0, VW, VH); }
  if (!fp) for (let i = 0; i < 4; i++) { const x = ((G.t * 7 + i * 110) % 460) - 70, y = 36 + i * 42 + Math.sin(G.t * 0.5 + i) * 8; E(g, x, y, 74, 11, 'rgba(210,200,255,0.05)'); E(g, x + 20, y + 4, 46, 7, 'rgba(210,200,255,0.05)'); }
  if (!fp) for (const d of DUST) { const x = ((d.x + G.t * d.vx) % 320 + 320) % 320, y = ((d.y + G.t * d.vy) % 180 + 180) % 180; g.fillStyle = 'rgba(230,220,255,' + (0.25 + 0.2 * Math.sin(G.t * 2 + d.ph)).toFixed(2) + ')'; g.fillRect(x | 0, y | 0, d.s, d.s); }
  g.globalAlpha = 0.85 + 0.15 * Math.sin(G.t * 1.3); g.drawImage(VIG, 0, 0); g.globalAlpha = 1;
  const dist = e.f === p.f ? Math.hypot(e.x - p.x, e.y - p.y) : 999, prox = Math.max(clamp(1 - dist / 150, 0, 1), p.held ? 1 : 0);
  if (!S.dollMode && (prox > 0.05 || e.state === 'chase' && e.f === p.f)) { g.globalAlpha = clamp(prox * 0.9 + (e.state === 'chase' ? 0.15 : 0), 0, 1) * (0.55 + 0.45 * Math.sin(G.t * (5 + prox * 6))); g.drawImage(VIGR, 0, 0); g.globalAlpha = 1; }
  if (S.flick > 0) { g.fillStyle = 'rgba(0,0,20,' + (0.45 * Math.abs(Math.sin(S.flick * 40))).toFixed(2) + ')'; g.fillRect(0, 0, VW, VH); }
  if (p.slow > 0) { g.fillStyle = 'rgba(110,160,255,' + (0.1 + 0.04 * Math.sin(G.t * 6)).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH); }
}
function drawPlaced(g, q) {
  const x = Math.round(q.x), y = Math.round(q.y);
  switch (q.type) {
    case 'petardo': R(g, x - 3, y - 2, 6, 4, '#000'); R(g, x - 2, y - 1, 4, 2, '#ff8a3a'); R(g, x, y - 4, 1, 2, '#ffd23f'); if ((G.t * 4 | 0) % 2) R(g, x, y - 5, 1, 1, '#fff'); break;
    case 'trampa': ring(g, x, y, 5, '#c8a060'); ring(g, x, y, 4, '#8a6a3a'); R(g, x - 1, y - 1, 3, 3, '#e8d098'); break;
    case 'mancha': E(g, x, y, 7, 4, 'rgba(10,8,0,0.8)'); E(g, x - 2, y - 1, 3, 1, 'rgba(120,120,60,0.6)'); break;
    case 'barricada': R(g, x - 8, y - 9, 16, 17, '#000'); R(g, x - 7, y - 8, 14, 5, '#b07a44'); R(g, x - 7, y - 2, 14, 5, '#9a6a38'); R(g, x - 7, y + 4, 14, 3, '#b07a44'); R(g, x - 7, y - 8, 14, 1, '#d8a468'); R(g, x - 5, y - 8, 2, 15, '#6a4020'); R(g, x + 3, y - 8, 2, 15, '#6a4020'); break;
    case 'torreta': R(g, x - 5, y - 3, 10, 6, '#000'); R(g, x - 4, y - 2, 8, 4, '#e0505a'); R(g, x - 1, y - 7, 3, 5, '#7a7a90'); R(g, x - 1, y - 8, 3, 2, q.fire > 0 ? '#fff' : '#ffd23f'); if (q.fire > 0) ring(g, x, y - 6, 12, 'rgba(255,230,120,0.8)'); break;
  }
}
function renderWorld(g) {
  const p = S.p, e = S.e, fo = S.dollMode ? e : p;
  const cam = S.dollMode ? e : S.p.dead && S.e.f === fo.f ? e : p;
  let cx = clamp(Math.round(cam.x - VW / 2), 0, MW * TS - VW), cy = clamp(Math.round(cam.y - VH / 2), 0, MH * TS - VH);
  if (S.shake > 0) { cx += (Math.random() * 4 - 2) | 0; cy += (Math.random() * 4 - 2) | 0; }
  S.cam.cx = cx; S.cam.cy = cy;
  g.save(); g.translate(-cx, -cy);
  g.drawImage(S.floors[fo.f], 0, 0);
  for (const o of S.W.f[fo.f].objs) if (o.type === 'deco' && o.kind === 'lamp') { const lx = o.x * TS + 8, ly = o.y * TS + 8, fl = 0.05 + 0.03 * Math.sin(G.t * 9 + o.x * 3) + (Math.random() < 0.02 ? 0.05 : 0); E(g, lx, ly, 24, 17, 'rgba(255,210,120,' + fl.toFixed(3) + ')'); E(g, lx, ly, 13, 9, 'rgba(255,230,160,' + (fl * 1.3).toFixed(3) + ')'); }
  const st = { t: G.t, power: !S.blackout, charging: p.charging, blackout: S.blackout };
  for (const o of S.W.f[fo.f].objs) if (!o.removed && o.type !== 'door') Spr.obj(g, o, st);
  const list = [];
  for (const gh of S.ghosts) if (gh.f === fo.f) list.push({ y: gh.y + 20, d: () => { g.globalAlpha = 0.7 * gh.a; g.drawImage(Spr.ghost((G.t * 3 | 0) % 2), Math.round(gh.x - 11), Math.round(gh.y - 26 + Math.sin(G.t * 3 + gh.ph) * 3)); g.globalAlpha = 1; } });
  for (const q of S.placed) if (q.f === fo.f) list.push({ y: q.y - (q.type === 'barricada' ? 0 : 6), d: () => drawPlaced(g, q) });
  const KI = Spr.KI[CFG.style], DI = Spr.DI[CFG.style];
  if (p.f === fo.f) list.push({ y: p.y, d: () => { if (p.escaped || p.f !== fo.f) return; const sp = Spr.kid(p.dir, p.moving ? 1 + ((p.anim | 0) % 2) : 0, CFG.cls, CFG.style); g.globalAlpha = p.dead ? 0.35 : (p.immune > 0 && (G.t * 10 | 0) % 2 ? 0.5 : 1); g.drawImage(sp, Math.round(p.x - KI.w / 2), Math.round(p.y + 1 - KI.fy + (p.boost > 0 ? -1 : 0))); g.globalAlpha = 1; } });
  if (e.f === fo.f) list.push({ y: e.y, d: () => { const mood = e.stun > 0 || e.state === 'eat' ? 'stun' : (e.state === 'chase' || e.state === 'grab') ? 'angry' : 'calm'; const sp = Spr.doll(e.dir, e.path.length && e.stun <= 0 && e.state !== 'eat' ? 1 + ((e.anim * 6 | 0) % 2) : 0, mood, CFG.style); if (mood === 'angry') E(g, e.x, e.y + 1, 14 + Math.round(Math.sin(G.t * 10)), 5, 'rgba(255,40,70,0.25)'); g.globalAlpha = e.blind > 0 ? 0.6 : 1; g.drawImage(sp, Math.round(e.x - DI.w / 2), Math.round(e.y + 1 - DI.fy + (e.path.length ? 0 : Math.sin(G.t * 2.5)))); g.globalAlpha = 1; if (e.slow > 0) R(g, e.x - 6, e.y + 2, 12, 2, 'rgba(200,170,100,0.8)'); if (e.stun > 0 || e.state === 'eat') for (let i = 0; i < 4; i++) { const a = G.t * 5 + i * 1.6; R(g, e.x + Math.cos(a) * 11 - 1, e.y - DI.fy - 4 + Math.sin(a) * 3, 3, 3, '#ffd23f'); } } });
  if (S.lure && S.lure.f === fo.f) { const L = S.lure; list.push({ y: L.y, d: () => { if (L.type === 'pizza') { E(g, L.x, L.y, 5, 4, '#e0a040'); E(g, L.x, L.y, 4, 3, '#d04030'); R(g, L.x - 2, L.y - 1, 2, 1, '#ffe890'); R(g, L.x + 1, L.y, 2, 1, '#ffe890'); } else { R(g, L.x - 5, L.y - 6, 10, 7, '#2a1a30'); R(g, L.x - 4, L.y - 5, 8, 5, '#b05ac0'); R(g, L.x - 1, L.y - 8 - Math.abs(Math.sin(G.t * 6)) * 2, 2, 3, '#ffd23f'); g.fillStyle = 'rgba(255,200,255,0.7)'; g.fillRect(L.x + 6 + Math.sin(G.t * 4) * 2, L.y - 10 - (G.t * 8 % 8), 2, 2); } } }); }
  list.sort((a, b) => a.y - b.y).forEach(i => i.d());
  for (const q of S.parts) { const k = 1 - q.t / q.life; g.globalAlpha = clamp(q.fade ? k * 0.7 : 1 - Math.pow(q.t / q.life, 3), 0, 1); g.fillStyle = q.col; if (q.star) { g.fillRect(Math.round(q.x) - 1, Math.round(q.y), 3, 1); g.fillRect(Math.round(q.x), Math.round(q.y) - 1, 1, 3); } else g.fillRect(Math.round(q.x), Math.round(q.y), q.sz, q.sz); } g.globalAlpha = 1;
  // destello de la linterna
  if (p.beam > 0) { const k = clamp(p.beam / 1.4, 0, 1); for (let wy = Math.floor((p.y - 130) / 3) * 3; wy < p.y + 130; wy += 3) for (let wx = Math.floor((p.x - 130) / 3) * 3; wx < p.x + 130; wx += 3) { const dx = wx - p.x, dy = wy - p.y, d2 = dx * dx + dy * dy; if (d2 < 130 * 130 && d2 > 16 && Math.abs(angDiff(Math.atan2(dy, dx), p.ang)) < 0.52 && los(fo.f, p.x, p.y, wx, wy)) { g.fillStyle = 'rgba(255,252,210,' + (0.34 * k * (1 - Math.sqrt(d2) / 150)).toFixed(3) + ')'; g.fillRect(wx, wy, 3, 3); } } }
  g.restore();
  if (S.blackout && !S.dollMode) renderDark(g, cx, cy);
  if (p.camFlash > 0) { g.fillStyle = 'rgba(255,255,255,' + clamp(p.camFlash * 3.5, 0, 0.85).toFixed(2) + ')'; g.fillRect(0, 0, VW, VH); }
  renderFx(g);
  g.save(); g.translate(-cx, -cy);
  // ojos y radar del enemigo (visibles en la oscuridad)
  if (e.f === fo.f) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (S.blackout && e.stun <= 0 && e.dir !== 'u') { const xs = e.dir === 'd' ? [-6, 6] : e.dir === 'l' ? [-8] : [8], eyY = e.y - (DI.fy - 16); for (const x of xs) { R(g, e.x + x - 1, eyY, 3, 3, '#ff2a2a'); R(g, e.x + x - 3, eyY - 2, 7, 7, 'rgba(255,40,40,0.25)'); } }
    if (e.ring > 0 && d < S.df.radarR + 140) { const RR = S.df.radarR; ring(g, e.x, e.y, e.ring / 1.2 * RR, 'rgba(255,60,60,0.9)'); ring(g, e.x, e.y, Math.max(1, e.ring / 1.2 * RR - 3), 'rgba(255,60,60,0.45)'); }
  }
  g.restore();
}
const BTN = { use: { x: 284, y: 130, r: 24, label: 'USAR' }, flash: { x: 236, y: 148, r: 17, label: 'LINTERNA' }, item: { x: 286, y: 80, r: 17, label: 'OBJETO' } };
const JOY_HOME = { x: 50, y: 128 };
const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
function icon(g, rows, x, y, col, outline) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'X') { if (outline) { g.fillStyle = outline; g.fillRect(x + i - 1, y + j, 3, 1); g.fillRect(x + i, y + j - 1, 1, 3); } } })); rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'X') { g.fillStyle = col; g.fillRect(x + i, y + j, 1, 1); } })); }
function drawJoy(g, ox, oy, kx, ky, active) {
  const a = active ? 0.85 : 0.6;
  E(g, ox, oy, 28, 28, 'rgba(10,6,30,0.45)'); ring(g, ox, oy, 28, 'rgba(255,255,255,' + a + ')'); ring(g, ox, oy, 27, 'rgba(255,255,255,' + a * 0.8 + ')'); ring(g, ox, oy, 20, 'rgba(255,255,255,' + a * 0.25 + ')');
  g.fillStyle = 'rgba(255,255,255,' + a + ')';
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) for (let k = 0; k < 3; k++) { const px = ox + dx * 22 + (dx ? -dx * k : -k + 0), py = oy + dy * 22 + (dy ? -dy * k : 0); if (dx) g.fillRect(px, py - (2 - k), 1, (2 - k) * 2 + 1); else g.fillRect(px - (2 - k), py, (2 - k) * 2 + 1, 1); }
  E(g, kx, ky, 12, 12, 'rgba(0,0,0,0.35)'); E(g, kx, ky, 11, 11, 'rgba(255,255,255,0.75)'); E(g, kx, ky, 9, 9, 'rgba(210,205,255,0.9)'); E(g, kx - 3, ky - 3, 4, 3, 'rgba(255,255,255,0.9)');
}

function renderHudDoll(g) {
  const p = S.p, e = S.e, seenBot = e.f === p.f && (S.ping > 0 || (Math.hypot(e.x - p.x, e.y - p.y) < 110 && los(e.f, e.x, e.y, p.x, p.y)));
  g.fillStyle = 'rgba(8,4,20,0.6)'; g.fillRect(2, 2, 98, 38); R(g, 2, 2, 98, 1, '#5a4a9a');
  Txt.draw(g, 'BOT', 6, 6, { color: '#9ae0ff' }); R(g, 26, 5, 70, 8, '#000'); R(g, 27, 6, 68, 6, '#103040'); R(g, 27, 6, Math.round(68 * p.hp / 100), 6, p.hp > 35 ? '#4ae0ff' : '#ff8a8a');
  for (let k = 1; k <= 5; k++) { R(g, 6 + (k - 1) * 12, 17, 10, 6, '#000'); R(g, 7 + (k - 1) * 12, 18, 8, 4, p.keys.has(k) ? KEY_COLORS[k] : '#2a2440'); }
  Txt.draw(g, 'CODIGO ' + (p.codeA ? 'XX' : '__') + (p.codeB ? 'XX' : '__'), 6, 28, { color: p.codeA && p.codeB ? '#3ae07a' : '#8a7fb0' });
  const mins = Math.floor(480 * clamp(S.t / S.dur, 0, 1)), hh = (22 * 60 + mins) / 60 % 24 | 0, mm = (22 * 60 + mins) % 60, h12 = hh % 12 === 0 ? 12 : hh % 12;
  Txt.draw(g, h12 + ':' + String(mm).padStart(2, '0') + (hh >= 12 && hh < 24 ? ' PM' : ' AM'), 160, 5, { align: 'c', color: '#fff', outline: '#000' }); R(g, 124, 15, 72, 3, '#000'); R(g, 125, 16, Math.round(70 * clamp(S.t / S.dur, 0, 1)), 1, '#ffd23f');
  { const mx = 236, my = 3; R(g, mx - 1, my - 1, 82, 50, '#000'); R(g, mx, my, 80, 48, 'rgba(8,4,20,0.78)'); g.drawImage(S.mini[e.f], mx, my);
    for (const o of S.W.f[e.f].objs) { if (o.type === 'stairs') R(g, mx + o.x * 2, my + o.y * 2, 2, 2, '#ffd23f'); else if (o.type === 'exit') R(g, mx + o.x * 2, my + o.y * 2, 2, 2, '#3ae07a'); }
    R(g, mx + tileOf(e.x) * 2 - 1, my + tileOf(e.y) * 2 - 1, 4, 4, '#ff2a2a');
    if (seenBot && (G.t * 4 | 0) % 2) R(g, mx + tileOf(p.x) * 2 - 1, my + tileOf(p.y) * 2 - 1, 4, 4, '#4ae0ff');
    Txt.draw(g, String(e.f + 1), mx + 73, my + 40, { color: '#ffd23f', outline: '#000' }); if (S.ping > 0 && p.f !== e.f) Txt.draw(g, 'BOT EN PISO ' + (p.f + 1), mx + 40, my + 40, { align: 'c', color: '#4ae0ff', outline: '#000' }); }
  const j = S.joy; if (j) { const dx = j.x - j.ox, dy = j.y - j.oy, l = Math.hypot(dx, dy), k = l > 24 ? 24 / l : 1; drawJoy(g, j.ox, j.oy, Math.round(j.ox + dx * k), Math.round(j.oy + dy * k), true); } else drawJoy(g, JOY_HOME.x, JOY_HOME.y, JOY_HOME.x, JOY_HOME.y, false);
  circle(g, BTN.use.x, BTN.use.y, BTN.use.r, '#4a42a0', '#8a7af0'); Txt.draw(g, 'ESCALERA', BTN.use.x, BTN.use.y - 3, { align: 'c', color: '#fff' });
  const rdy = S.pingCd <= 0; circle(g, BTN.flash.x, BTN.flash.y, BTN.flash.r, rdy ? '#a02a3a' : '#2a2840', rdy ? '#ff6a7a' : '#5a5080'); Txt.draw(g, 'RADAR', BTN.flash.x, BTN.flash.y - 3, { align: 'c', color: rdy ? '#fff' : '#6a6a80' }); if (!rdy) Txt.draw(g, String(Math.ceil(S.pingCd)), BTN.flash.x, BTN.flash.y + 5, { align: 'c', color: '#ffd23f' });
  if (S.msg) { g.globalAlpha = clamp(S.msg.t * 2, 0, 1); Txt.draw(g, S.msg.text, 160, 26, { align: 'c', color: '#fff', outline: '#000' }); g.globalAlpha = 1; }
  if (p.held) { R(g, 100, 150, 120, 8, '#000'); R(g, 101, 151, Math.round(118 * (1 - p.grab / 100)), 6, '#ff6a7a'); Txt.draw(g, 'ATRAPADO', 160, 140, { align: 'c', color: '#fff', outline: '#000' }); }
}
function renderHud(g) {
  const p = S.p, e = S.e;
  // vida y pila
  g.fillStyle = 'rgba(8,4,20,0.6)'; g.fillRect(2, 2, 98, 28); R(g, 2, 2, 98, 1, '#5a4a9a');
  icon(g, HEART, 6, 6, '#ff4a6a', '#2a0a14'); R(g, 20, 5, 76, 8, '#000'); R(g, 21, 6, 74, 6, '#3a1020'); R(g, 21, 6, Math.round(74 * p.hp / 100), 6, p.hp > 35 ? '#ff4a6a' : '#ff9a9a'); R(g, 21, 6, Math.round(74 * p.hp / 100), 2, 'rgba(255,255,255,0.35)');
  R(g, 6, 18, 10, 8, '#000'); R(g, 7, 19, 8, 6, '#2a2a10'); R(g, 16, 20, 2, 4, '#000'); R(g, 7, 19, Math.max(0, Math.round(8 * p.charge / 100)), 6, '#ffd23f');
  R(g, 20, 17, 76, 10, '#000');
  for (let i = 0; i < 3; i++) { const fill = clamp((p.charge - i * 33.34) / 33.34, 0, 1); R(g, 21 + i * 25, 18, 24, 8, '#2a2a10'); R(g, 21 + i * 25, 18, Math.round(24 * fill), 8, p.charging ? ((G.t * 8 | 0) % 2 ? '#ffe890' : '#ffd23f') : '#ffd23f'); if (fill > 0) R(g, 21 + i * 25, 18, Math.round(24 * fill), 2, 'rgba(255,255,255,0.4)'); }
  // reloj
  const mins = Math.floor(480 * clamp(S.t / S.dur, 0, 1)), hh = (22 * 60 + mins) / 60 % 24 | 0, mm = (22 * 60 + mins) % 60, h12 = hh % 12 === 0 ? 12 : hh % 12;
  Txt.draw(g, h12 + ':' + String(mm).padStart(2, '0') + (hh >= 12 && hh < 24 ? ' PM' : ' AM'), 160, 5, { align: 'c', color: S.blackout ? '#ff6060' : '#fff', outline: '#000' });
  R(g, 124, 15, 72, 3, '#000'); R(g, 125, 16, Math.round(70 * clamp(S.t / S.dur, 0, 1)), 1, '#ffd23f');
  // mapa en la esquina
  { const mx = 236, my = 3; R(g, mx - 1, my - 1, 82, 50, '#000'); R(g, mx, my, 80, 48, 'rgba(8,4,20,0.78)'); g.drawImage(S.mini[p.f], mx, my);
    for (const o of S.W.f[p.f].objs) { if (o.type === 'door' && !o.removed) R(g, mx + o.x * 2, my + o.y * 2, 2, 2, KEY_COLORS[o.id]); else if (o.type === 'stairs') R(g, mx + o.x * 2, my + o.y * 2, 2, 2, '#ffd23f'); else if (o.type === 'exit') R(g, mx + o.x * 2, my + o.y * 2, 2, 2, '#3ae07a'); }
    if ((G.t * 3 | 0) % 2) R(g, mx + tileOf(p.x) * 2 - 1, my + tileOf(p.y) * 2 - 1, 4, 4, '#fff'); R(g, mx + tileOf(p.x) * 2, my + tileOf(p.y) * 2, 2, 2, '#ff4a6a'); if (CFG.view === 'FP') { const ax = mx + tileOf(p.x) * 2 + 1 + Math.cos(p.yaw) * 5, ay = my + tileOf(p.y) * 2 + 1 + Math.sin(p.yaw) * 5; R(g, Math.round(ax), Math.round(ay), 2, 2, '#ffd23f'); }
    Txt.draw(g, String(p.f + 1), mx + 73, my + 40, { color: '#ffd23f', outline: '#000' }); }
  // joystick (siempre visible)
  const j = S.joy;
  if (j) { const dx = j.x - j.ox, dy = j.y - j.oy, l = Math.hypot(dx, dy), k = l > 24 ? 24 / l : 1; drawJoy(g, j.ox, j.oy, Math.round(j.ox + dx * k), Math.round(j.oy + dy * k), true); }
  else { drawJoy(g, JOY_HOME.x, JOY_HOME.y, JOY_HOME.x, JOY_HOME.y, false); }
  // botones
  const near = S.hint && !S.overlay, canF = p.charge >= 33;
  circle(g, BTN.use.x, BTN.use.y, BTN.use.r, near ? '#ffd23f' : '#4a42a0', near ? '#fff' : '#8a7af0'); E(g, BTN.use.x - 8, BTN.use.y - 9, 7, 4, near ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'); Txt.draw(g, 'USAR', BTN.use.x, BTN.use.y - 3, { s: 1, align: 'c', color: near ? '#1a0f1f' : '#fff' });
  circle(g, BTN.flash.x, BTN.flash.y, BTN.flash.r, canF ? '#4a42a0' : '#2a2840', canF ? '#8a7af0' : '#5a5080'); R(g, BTN.flash.x - 3, BTN.flash.y - 5, 7, 4, canF ? '#ffd23f' : '#6a6a50'); R(g, BTN.flash.x - 2, BTN.flash.y - 1, 5, 6, canF ? '#ffd23f' : '#6a6a50'); Txt.draw(g, 'LINTERNA', BTN.flash.x, BTN.flash.y + BTN.flash.r + 2, { align: 'c', color: '#c9c0ff', shadow: '#000' });
  const it = curItem(), il = invList();
  circle(g, BTN.item.x, BTN.item.y, BTN.item.r, it ? '#4a42a0' : '#2a2840', it ? (S.hold && S.hold.t > 0.1 ? '#ffd23f' : '#8a7af0') : '#5a5080');
  if (it) { R(g, BTN.item.x - 7, BTN.item.y - 7, 14, 14, '#000'); R(g, BTN.item.x - 6, BTN.item.y - 6, 12, 12, '#2a2248'); ico(g, it, BTN.item.x - 6, BTN.item.y - 6, 12); Txt.draw(g, 'x' + p.inv[it], BTN.item.x + 10, BTN.item.y + 6, { align: 'c', color: '#fff', outline: '#000' }); for (let i = 0; i < il.length && i < 8; i++) R(g, BTN.item.x - il.length * 2 + i * 4, BTN.item.y - BTN.item.r - 5, 3, 3, il[i] === it ? '#ffd23f' : '#6a5ab0'); }
  else Txt.draw(g, '-', BTN.item.x, BTN.item.y - 3, { align: 'c', color: '#6a6a80' });
  Txt.draw(g, it ? ITEMS[it].n : 'OBJETO', BTN.item.x, BTN.item.y + BTN.item.r + 2, { align: 'c', color: '#c9c0ff', shadow: '#000' });
  if (S.toasts) S.toasts.forEach((q, i) => { // aviso animado: HAS CONSEGUIDO
    const a = q.t < 0.35 ? q.t / 0.35 : 1, out = q.t > 2.3 ? clamp(1 - (q.t - 2.3) / 0.5, 0, 1) : 1, bounce = q.t < 0.35 ? 1 + Math.sin(a * Math.PI) * 0.35 : 1, w = 112, h = 22, x = 6 + (1 - a) * -30, y = 34 + i * 24 - (1 - out) * 6;
    g.save(); g.globalAlpha = Math.min(a, out); g.translate(x + w / 2, y + h / 2); g.scale(bounce, bounce); g.translate(-(x + w / 2), -(y + h / 2));
    R(g, x, y, w, h, '#000'); R(g, x + 1, y + 1, w - 2, h - 2, '#241c4a'); R(g, x + 1, y + 1, w - 2, 1, '#ffd23f'); R(g, x + 1, y + h - 2, w - 2, 1, '#6a5ad0');
    R(g, x + 3, y + 3, 16, 16, '#14102a'); ico(g, q.icon, x + 3, y + 3, 16);
    Txt.draw(g, 'HAS CONSEGUIDO', x + 22, y + 3, { color: '#ffd23f' }); Txt.draw(g, (q.n > 1 ? q.n + ' ' : '') + q.text, x + 22, y + 12, { color: '#fff' });
    if (q.t < 0.5) { g.fillStyle = 'rgba(255,255,255,' + (0.5 - q.t).toFixed(2) + ')'; g.fillRect(x, y, w, h); }
    g.restore();
  });
  if (S.msg) { g.globalAlpha = clamp(S.msg.t * 2, 0, 1); Txt.draw(g, S.msg.text, 160, 26, { align: 'c', color: '#fff', outline: '#000' }); g.globalAlpha = 1; }
  // forcejeo
  if (p.held) {
    Txt.draw(g, '¡TE AGARRARON!', 160, 56, { align: 'c', s: 2, color: '#ff6060', outline: '#000' });
    R(g, 110, 76, 100, 6, '#000'); R(g, 111, 77, Math.round(98 * (1 - p.grab / 100)), 4, '#e03030');
  }
  // overlays
  const ov = S.overlay;
  if (ov) {
    if (ov.type === 'keypad') {
      const sx = ov.shake > 0 ? (Math.random() * 4 - 2) | 0 : 0; g.save(); g.translate(sx, 0);
      panel(g, PAD.x, PAD.y, PAD.w, PAD.h); Txt.draw(g, 'CODIGO DE SALIDA', 160, 26, { align: 'c', color: '#ffd23f' });
      R(g, 118, 38, 84, 14, '#000'); Txt.draw(g, (ov.entered + '____').slice(0, 4).split('').join(' '), 160, 42, { align: 'c', s: 1, color: ov.shake > 0 ? '#ff4040' : '#3ae07a' });
      Txt.draw(g, 'PISTAS: ' + (S.p.codeA || '__') + (S.p.codeB || '__'), 160, 158, { align: 'c', color: '#c9c0ff' });
      for (const k of padKeys()) { R(g, k.x, k.y, k.w, k.h, '#000'); R(g, k.x + 1, k.y + 1, k.w - 2, k.h - 2, k.k === 'X' ? '#6a2030' : k.k === 'C' ? '#5a4a20' : '#3a3470'); Txt.draw(g, k.k, k.x + 14, k.y + 8, { align: 'c', color: '#fff' }); }
      g.restore();
    } else if (ov.type === 'craft') {
      panel(g, 10, 4, 300, 172, '#1a1230', '#6a5ad0'); Txt.draw(g, 'MESA DE CRAFTEO', 20, 10, { color: '#ffd23f' });
      const cx = CRAFT.close; R(g, cx.x, cx.y, cx.w, cx.h, '#000'); R(g, cx.x + 1, cx.y + 1, cx.w - 2, cx.h - 2, '#6a2030'); Txt.draw(g, 'X', cx.x + 8, cx.y + 3, { align: 'c', color: '#fff' });
      const match = craftMatch(ov.grid), L = recList(ov), nCan = L.filter(e => e.can > 0).length;
      Txt.draw(g, 'PUEDES HACER: ' + nCan + '/' + L.length, 212, 11, { align: 'c', color: nCan ? '#3ae07a' : '#8a7fb0' });
      for (let i = 0; i < 9; i++) { const r = CRAFT.slot(i), m = ov.grid[i]; R(g, r.x, r.y, r.w, r.h, '#000'); R(g, r.x + 1, r.y + 1, r.w - 2, r.h - 2, '#2a2248'); if (m) ico(g, m, r.x + 2, r.y + 2, 24); }
      Txt.draw(g, '>', 114, 44, { s: 2, align: 'c', color: '#6a5ab0' });
      const rs = CRAFT.res; R(g, rs.x, rs.y, rs.w, rs.h, '#000'); R(g, rs.x + 1, rs.y + 1, rs.w - 2, rs.h - 2, match ? '#2a3a22' : '#241c3a');
      if (match) { ico(g, match.out, rs.x + 4, rs.y + 4, 24); if (match.n > 1) Txt.draw(g, 'x' + match.n, rs.x + rs.w - 2, rs.y + rs.h - 9, { align: 'r', color: '#fff', outline: '#000' }); } else Txt.draw(g, '?', rs.x + 16, rs.y + 11, { align: 'c', s: 1, color: '#6a5ab0' });
      const bt = CRAFT.btn, can = match && !ov.crafting; R(g, bt.x, bt.y, bt.w, bt.h, '#000'); R(g, bt.x + 1, bt.y + 1, bt.w - 2, bt.h - 2, can ? '#3ae07a' : '#2a3a30'); Txt.draw(g, ov.crafting ? (ov.all ? 'HACIENDO ' + (ov.made + 1) : 'HACIENDO') : 'FABRICAR', bt.x + bt.w / 2, bt.y + 5, { align: 'c', color: can ? '#06210f' : '#6a8a70' });
      const al = CRAFT.all, canAll = match && !ov.crafting && recCan(ov, match) + 1 > 1 || false; R(g, al.x, al.y, al.w, al.h, '#000'); R(g, al.x + 1, al.y + 1, al.w - 2, al.h - 2, can ? '#2a8ad0' : '#1e2a38'); Txt.draw(g, 'FABRICAR TODO'.slice(0, 0) + 'REPETIR', al.x + al.w / 2, al.y + 4, { align: 'c', color: can ? '#fff' : '#5a6a80' });
      const cl = CRAFT.clr; R(g, cl.x, cl.y, cl.w, cl.h, '#000'); R(g, cl.x + 1, cl.y + 1, cl.w - 2, cl.h - 2, '#5a4a20'); Txt.draw(g, 'VACIAR', cl.x + cl.w / 2, cl.y + 3, { align: 'c', color: '#fff' });
      if (ov.crafting) { const dur = 2.5 * (S.cl.craft || 1); R(g, 118, 124, 62, 6, '#000'); R(g, 119, 125, Math.round(60 * clamp(ov.cT / dur, 0, 1)), 4, '#ffd23f'); }
      if (ov.warn > 0) Txt.draw(g, 'FALTAN MATERIALES', 150, 134, { align: 'c', color: '#ff6060' });
      // detalle de la receta elegida
      const dr = ov.sel != null ? RECIPES[ov.sel] : null; R(g, 14, 138, 168, 34, '#120c26'); R(g, 14, 138, 168, 1, '#4a3a8a');
      if (dr) {
        Txt.draw(g, ITEMS[dr.out].n + (dr.n > 1 ? '  X' + dr.n : ''), 18, 141, { color: '#ffd23f' }); Txt.draw(g, dr.d, 18, 162, { color: '#c9c0ff' });
        let xx = 18; for (const k in dr.ing) { const hv = haveMat(ov, k), ok = hv >= dr.ing[k]; ico(g, k, xx, 150, 10); Txt.draw(g, hv + '/' + dr.ing[k], xx + 11, 152, { color: ok ? '#3ae07a' : '#ff6060' }); xx += 38; }
      } else Txt.draw(g, 'TOCA UNA RECETA DEL LIBRO', 98, 152, { align: 'c', color: '#6a5ab0' });
      [['mat', CRAFT.tabM, 'MATERIAL'], ['rec', CRAFT.tabR, 'LIBRO']].forEach(([k, r, l]) => { R(g, r.x, r.y, r.w, r.h, '#000'); R(g, r.x + 1, r.y + 1, r.w - 2, r.h - 2, ov.tab === k ? '#4a42a0' : '#241c3a'); Txt.draw(g, l, r.x + r.w / 2, r.y + 3, { align: 'c', color: ov.tab === k ? '#fff' : '#8a7fb0' }); });
      if (ov.tab === 'mat') MAT_ORDER.forEach((m, i) => { const r = CRAFT.matRow(i), n = S.p.mats[m] || 0; R(g, r.x, r.y, r.w, r.h, n ? '#2a2248' : '#1a1630'); ico(g, m, r.x + 1, r.y + 1, 11); Txt.draw(g, MAT_NAMES[m], r.x + 15, r.y + 3, { color: n ? '#fff' : '#5a5080' }); Txt.draw(g, String(n), r.x + r.w - 4, r.y + 3, { align: 'r', color: n ? '#ffd23f' : '#5a5080' }); });
      else {
        const mx = Math.max(0, L.length - CRAFT.ROWS); ov.scroll = clamp(ov.scroll, 0, mx);
        for (let i = 0; i < CRAFT.ROWS; i++) { const e = L[ov.scroll + i]; if (!e) break; const r = CRAFT.recRow(i), sel = ov.sel === e.i, it = ITEMS[e.r.out];
          R(g, r.x, r.y, r.w, r.h, sel ? '#4a42a0' : e.can > 0 ? '#24402a' : '#1a1630'); if (e.can > 0) R(g, r.x, r.y, 2, r.h, '#3ae07a');
          ico(g, e.r.out, r.x + 3, r.y + 1, 12); Txt.draw(g, it.n.slice(0, 11), r.x + 18, r.y + 4, { color: e.can > 0 || sel ? '#fff' : '#6a6090' });
          if (e.can > 0) Txt.draw(g, 'X' + e.can, r.x + r.w - 3, r.y + 4, { align: 'r', color: '#3ae07a' }); else Txt.draw(g, '-', r.x + r.w - 4, r.y + 4, { align: 'r', color: '#4a4070' }); }
        for (const [b, lab, dis] of [[CRAFT.up, 'SUBIR', ov.scroll <= 0], [CRAFT.dn, 'BAJAR', ov.scroll >= mx]]) { R(g, b.x, b.y, b.w, b.h, '#000'); R(g, b.x + 1, b.y + 1, b.w - 2, b.h - 2, dis ? '#1a1630' : '#3a3470'); Txt.draw(g, lab, b.x + b.w / 2, b.y + 3, { align: 'c', color: dis ? '#4a4070' : '#fff' }); }
      }
    } else {
      panel(g, PAD.x, PAD.y, PAD.w, PAD.h); Txt.draw(g, 'COMPUTADORA', 160, 26, { align: 'c', color: '#3ae07a' });
      const lab = ov.phase === 'show' ? (ov.fail > 0 ? '¡ERROR! OTRA VEZ' : 'MEMORIZA EL ORDEN') : ov.phase === 'input' ? 'REPITE EL ORDEN (' + ov.idx + '/3)' : 'REINICIANDO... ' + Math.ceil(ov.wait) + ' (NO TE MUEVAS)';
      Txt.draw(g, lab, 160, 40, { align: 'c', color: '#fff' });
      const shown = ov.phase === 'show' && ov.fail <= 0 ? (ov.t > 0.5 ? Math.floor((ov.t - 0.5) / 0.9) : -1) : -1;
      const hot = ov.phase === 'show' && shown >= 0 && shown < 3 && ((ov.t - 0.5) % 0.9) < 0.6 ? ov.seq[shown] : (ov.flashT > 0 ? ov.flashC : -1);
      for (const b of puzBtns()) { R(g, b.x, b.y, b.w, b.h, '#000'); R(g, b.x + 1, b.y + 1, b.w - 2, b.h - 2, hot === b.i ? COLS[b.i] : ov.phase === 'wait' ? '#2a2a3a' : '#1c1a30'); R(g, b.x + 4, b.y + 4, b.w - 8, b.h - 8, hot === b.i ? '#fff' : COLS[b.i]); if (hot !== b.i) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8); } }
      if (ov.phase === 'wait') { R(g, 118, 150, 84, 5, '#000'); R(g, 119, 151, Math.round(82 * (1 - ov.wait / ov.waitMax)), 3, '#3ae07a'); }
    }
  }
  if (S.scream) { const sc = S.scream, k = sc.t / sc.dur, sh = (Math.random() - 0.5) * 12, z = 4 + k * 3; g.fillStyle = (G.t * 25 | 0) % 2 ? '#2a0008' : '#000'; g.fillRect(0, 0, VW, VH); g.globalAlpha = 1 - k * 0.4; g.drawImage(Spr.ghost((G.t * 12 | 0) % 2), Math.round(160 - 11 * z + sh), Math.round(95 - 15 * z + sh), 22 * z, 30 * z); R(g, 160 - 26 + sh, 70 + sh, 14, 18, '#ff1030'); R(g, 160 + 12 + sh, 70 + sh, 14, 18, '#ff1030'); g.globalAlpha = 1; for (let i = 0; i < 160; i++) { const v = (Math.random() * 255) | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.25)'; g.fillRect(Math.random() * VW, Math.random() * VH, 3, 1); } if ((G.t * 20 | 0) % 3 === 0) { g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(0, 0, VW, VH); } }
  if (S.fade > 0) { g.fillStyle = 'rgba(0,0,0,' + clamp(S.fade * 2, 0, 1) + ')'; g.fillRect(0, 0, VW, VH); }
  if (S.ended) { const a = clamp(S.ended.t / (S.ended.kind === 'dead' ? 2 : 1.4), 0, 1); g.fillStyle = (S.ended.kind === 'dead' ? 'rgba(60,0,0,' : 'rgba(255,255,255,') + a * 0.9 + ')'; g.fillRect(0, 0, VW, VH); }
}

// ---------------- escenas ----------------
const TITLE_BG = Spr.mk(VW, VH, g => {
  const bands = ['#0a0620', '#100a2e', '#180e3c', '#22124c', '#2e175a', '#3e1c68', '#541f72', '#722478', '#94307e', '#b84a84'];
  bands.forEach((c, i) => R(g, 0, i * 12, VW, 13, c));
  for (let x = 0; x < VW; x++) { const h = 128 + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.11) * 3; R(g, x, h, 1, VH - h, '#1a0c34'); }
  for (let x = 0; x < VW; x++) { const h = 142 + Math.sin(x * 0.05 + 2) * 6; R(g, x, h, 1, VH - h, '#120824'); }
  const tree = (x, y, sc) => { g.fillStyle = '#080414'; g.fillRect(x - sc, y - 40 * sc, 2 * sc, 40 * sc); [[-10, -34, -1], [8, -30, 1], [-8, -22, -1], [10, -16, 1]].forEach(([dx, dy, d]) => { for (let i = 0; i < 12; i++) g.fillRect(x + d * i * sc * 0.9, y + (dy - i * 0.5) * sc, sc * 1.4, sc * 1.4); }); };
  tree(10, 150, 1.4); tree(150, 152, 1); tree(304, 150, 1.5);
  R(g, 22, 82, 98, 70, '#0e081e');
  for (let y = 56; y < 82; y++) { const w = Math.round((82 - y) * 1.9); R(g, 71 - w, y, w * 2, 1, '#0e081e'); }
  R(g, 98, 60, 8, 22, '#0e081e'); R(g, 0, 150, 320, 30, '#07040f');
  for (let x = 0; x < VW; x += 5) R(g, x, 148 - ((x * 7) % 5), 2, 6, '#07040f');
  R(g, 62, 126, 18, 26, '#2a1a10'); R(g, 62, 126, 18, 2, '#1a0e08'); R(g, 76, 138, 2, 2, '#ffd23f');
  [[200, 154], [232, 158], [262, 153]].forEach(([x, y]) => { R(g, x, y - 12, 12, 14, '#150b2a'); E(g, x + 6, y - 12, 6, 5, '#150b2a'); R(g, x + 5, y - 14, 2, 8, '#2a1a4a'); R(g, x + 2, y - 10, 8, 2, '#2a1a4a'); });
});
const BATS = Array.from({ length: 6 }, () => ({ x: Math.random() * 320, y: 14 + Math.random() * 70, sp: rand(16, 34), ph: Math.random() * 6, a: rand(4, 10) }));
const TSTARS = Array.from({ length: 70 }, () => ({ x: Math.random() * 320, y: Math.random() * 100, ph: Math.random() * 6 }));
function drawTitleBg2D(g) {
    const t = G.t; g.drawImage(TITLE_BG, 0, 0);
    for (const s of TSTARS) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + s.ph)); g.fillStyle = 'rgba(255,250,220,' + a.toFixed(2) + ')'; g.fillRect(s.x | 0, s.y | 0, 1, 1); }
    [[40, 0.05], [32, 0.07], [26, 0.1]].forEach(([r, a]) => E(g, 262, 28, r, r, 'rgba(255,240,190,' + (a + 0.02 * Math.sin(t * 1.2)).toFixed(3) + ')')); E(g, 262, 28, 19, 19, '#fff4c8'); E(g, 256, 22, 4, 4, '#e8d8a0'); E(g, 268, 33, 5, 5, '#e8d8a0'); E(g, 270, 20, 2, 2, '#e8d8a0');
    for (let i = 0; i < 3; i++) { const x = ((t * (4 + i * 2) + i * 140) % 420) - 60, y = 20 + i * 24; E(g, x, y, 46, 6, 'rgba(26,12,52,0.85)'); E(g, x + 16, y - 3, 28, 6, 'rgba(26,12,52,0.85)'); E(g, x - 20, y + 1, 22, 4, 'rgba(26,12,52,0.85)'); }
    const fl = k => (Math.sin(t * 7 + k * 5) > -0.7 || Math.random() < 0.3) ? 1 : 0.25;
    [[30, 118, 0], [96, 118, 1], [32, 92, 2]].forEach(([x, y, k]) => { const a = fl(k); R(g, x, y, 14, 14, 'rgba(255,200,90,' + (0.9 * a).toFixed(2) + ')'); R(g, x + 6, y, 2, 14, '#0e081e'); R(g, x, y + 6, 14, 2, '#0e081e'); E(g, x + 7, y + 7, 14, 12, 'rgba(255,190,80,' + (0.06 * a).toFixed(3) + ')'); });
    { const x = 96, y = 92; R(g, x, y, 14, 14, 'rgba(255,200,90,0.35)'); R(g, x + 6, y, 2, 14, '#0e081e'); E(g, x + 7, y + 8, 4, 5, '#1a0c2a'); R(g, x + 3, y + 1, 8, 3, '#d02a6a'); if ((t * 1.3) % 4 > 0.15) { R(g, x + 4, y + 7, 2, 2, '#ff2a2a'); R(g, x + 8, y + 7, 2, 2, '#ff2a2a'); } }
    for (const b of BATS) { const x = ((b.x + t * b.sp) % 360) - 20, y = b.y + Math.sin(t * 2 + b.ph) * b.a, up = (t * 9 + b.ph | 0) % 2; g.fillStyle = '#05020c'; g.fillRect(x - 1, y, 3, 2); if (up) { g.fillRect(x - 5, y - 2, 4, 1); g.fillRect(x + 2, y - 2, 4, 1); g.fillRect(x - 7, y - 1, 2, 1); g.fillRect(x + 6, y - 1, 2, 1); } else { g.fillRect(x - 5, y + 1, 4, 1); g.fillRect(x + 2, y + 1, 4, 1); g.fillRect(x - 7, y + 2, 2, 1); g.fillRect(x + 6, y + 2, 2, 1); } }
    for (let i = 0; i < 4; i++) { const x = ((t * (5 + i) + i * 90) % 440) - 60; E(g, x, 156 + i * 5, 80, 8, 'rgba(160,140,210,0.10)'); }
    g.fillStyle = 'rgba(70,20,120,0.10)'; g.fillRect(0, 0, VW, VH); g.drawImage(VIG, 0, 0);
}
let Title = null;
function say0() { Sfx.back(); }

const Play = {
  name_: "play",
  enter() { Render3D.show(CFG.view === '3D'); if (typeof RenderFP !== 'undefined') RenderFP.show(CFG.view === 'FP'); }, update(dt) { update(dt); },
  render(g) {
    if (isFP()) {
      Render3D.show(false); RenderFP.show(true); g.clearRect(0, 0, VW, VH); RenderFP.draw(S); renderFx(g, true); fpPost(g);
      for (const q of S.parts) { const k = 1 - q.t / q.life, [sx, sy] = RenderFP.project(q.x, q.y, 0.3 + (q.star ? 0.7 : 0.1)); g.globalAlpha = clamp(q.fade ? k * 0.7 : 1 - Math.pow(q.t / q.life, 3), 0, 1); g.fillStyle = q.col; g.fillRect(Math.round(sx), Math.round(sy), 2, 2); } g.globalAlpha = 1;
      renderHud(g); R(g, 159, 89, 2, 2, 'rgba(255,255,255,0.8)'); return;
    }
    RenderFP.show(false);
    if (CFG.view === '3D' && Render3D.ok) {
      Render3D.show(true); g.clearRect(0, 0, VW, VH); Render3D.draw(S); renderFx(g);
      for (const q of S.parts) { const k = 1 - q.t / q.life, [sx, sy] = Render3D.project(q.x, q.y, 0.4 + (q.star ? 0.6 : 0.1)); g.globalAlpha = clamp(q.fade ? k * 0.7 : 1 - Math.pow(q.t / q.life, 3), 0, 1); g.fillStyle = q.col; g.fillRect(Math.round(sx), Math.round(sy), q.star ? 2 : Math.max(1, q.sz - 1), q.star ? 2 : Math.max(1, q.sz - 1)); } g.globalAlpha = 1;
      S.dollMode ? renderHudDoll(g) : renderHud(g);
    } else { Render3D.show(false); R(g, 0, 0, VW, VH, '#000'); renderWorld(g); S.dollMode ? renderHudDoll(g) : renderHud(g); }
  },
  keydown(c) {
    if (S.intro > 0) { if (c === 'Escape') { setScene(Title); return; } if (S.introT > 0.6) S.intro = 0; return; }
    if (S.overlay) { if (c === 'Escape') { closeOverlay(); return; } if (S.overlay.type === 'craft') { const ov = S.overlay; if (/^Digit[1-9]$/.test(c)) craftAdd(ov, MAT_ORDER[+c[5] - 1]); else if (c === 'Backspace') craftClear(ov); else if (c === 'Enter') craftStart(ov); else if (c === 'Tab') ov.tab = ov.tab === 'mat' ? 'rec' : 'mat'; return; } if (S.overlay.type === 'keypad' && /^(Digit|Numpad)[0-9]$/.test(c)) { overlayInput('k', c.slice(-1)); return; } if (S.overlay.type === 'puzzle' && /^(Digit|Numpad)[1-4]$/.test(c)) { overlayInput('p', +c.slice(-1) - 1); return; } }
    if (c === 'Escape') { Sfx.setTension(0); if (typeof MPleave === 'function') MPleave(); setScene(Title); return; }
    if (c === 'KeyE' || c === 'KeyJ' || c === 'Space') press('use'); else if (c === 'KeyF' || c === 'KeyK') press('flash'); else if (c === 'KeyQ' || c === 'KeyL') press('item'); else if (c === 'KeyR' || c === 'Tab') cycleItem();
  },
  pointerDown(id, x, y, type) {
    G.touched = true; if (CFG.view === 'FP' && type === 'mouse' && !document.pointerLockElement && canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch (e) {} }
    if (S.intro > 0) { if (S.introT > 0.6) S.intro = 0; return; }
    if (S.overlay) {
      const ov = S.overlay;
      if (ov.type === 'craft') { if (craftPointer(x, y)) return; }
      else if (ov.type === 'keypad') { for (const k of padKeys()) if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) { overlayInput('k', k.k); return; } }
      else if (ov.phase === 'input') for (const b of puzBtns()) if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { overlayInput('p', b.i); return; }
      if (ov.type !== 'craft' && x >= PAD.x && x < PAD.x + PAD.w && y >= PAD.y && y < PAD.y + PAD.h) return;
    }
    for (const k in BTN) { const b = BTN[k]; if (Math.hypot(x - b.x, y - b.y) < b.r + 7) { if (k === 'item') { S.hold = { id, t: 0, fired: false }; return; } press(k); return; } }
    if (CFG.view === 'FP' && (x >= 150 || type === 'mouse') && !(type === 'mouse' && x < 90 && y > 100)) { if (!S.look) S.look = { id, x, y }; return; }
    if (x < 150 && y > 24 && !S.joy) S.joy = { id, ox: x, oy: y, x, y };
  },
  pointerMove(id, x, y) { if (S && S.joy && S.joy.id === id) { S.joy.x = x; S.joy.y = y; } if (S && S.look && S.look.id === id) { { const dx = x - S.look.x, dy = y - S.look.y, m = 0.013 + Math.min(Math.hypot(dx, dy), 24) * 0.00045; fpAdd(dx, dy, m); } S.look.x = x; S.look.y = y; } },
  pointerUp(id) { if (S && S.look && S.look.id === id) S.look = null; if (S && S.joy && S.joy.id === id) S.joy = null; if (S && S.hold && S.hold.id === id) { if (!S.hold.fired) press('item'); S.hold = null; } },
};

const End = {
  enter(kind, st) { Render3D.show(false); this.kind = kind; this.t = 0; this.st = st; if (kind === 'dead') Sfx.lose(); else { Sfx.win(); } },
  update(dt) { this.t += dt; },
  render(g) {
    const k = this.kind; R(g, 0, 0, VW, VH, k === 'dead' ? '#0a0204' : '#0a1a14');
    const dm = this.st && this.st.dollMode;
    const title = dm ? (k === 'dead' ? '¡LO ATRAPASTE!' : k === 'escape' ? 'EL BOT ESCAPO' : 'EL BOT SOBREVIVIO') : k === 'escape' ? '¡ESCAPASTE!' : k === 'survive' ? '¡SOBREVIVISTE!' : 'TE ATRAPARON';
    Txt.draw(g, title, 160, 22, { s: 3, align: 'c', color: (dm ? k !== 'dead' : k === 'dead') ? '#e03030' : '#3ae07a', shadow: '#000' });
    Txt.draw(g, dm ? (k === 'dead' ? 'GANASTE COMO MUÑECA' : k === 'escape' ? 'SALIO POR LA PUERTA CON EL CODIGO' : 'LLEGO A LAS 6 AM') : k === 'escape' ? 'SALISTE POR LA PUERTA CON EL CODIGO' : k === 'survive' ? 'LLEGASTE A LAS 6 AM' : 'AHORA ERES ESPECTADOR... Y NO HAY NADIE MAS', 160, 54, { align: 'c', color: '#fff' });
    const st = this.st; const mins = Math.floor(480 * clamp(st.t / st.dur, 0, 1)), hh = (22 * 60 + mins) / 60 % 24 | 0, mm = (22 * 60 + mins) % 60;
    Txt.draw(g, 'HORA FINAL: ' + (hh % 12 || 12) + ':' + String(mm).padStart(2, '0') + (hh >= 12 && hh < 24 ? ' PM' : ' AM'), 160, 78, { align: 'c', color: '#c9a6ff' });
    Txt.draw(g, CLASSES[CFG.cls].n + ' - NIVEL ' + CFG.level + '   COFRES: ' + st.stats.chests + '   CRAFTEOS: ' + st.stats.crafts + '   AGARRADO: ' + st.stats.grabs, 160, 92, { align: 'c', color: '#c9a6ff' });
    { const DI = Spr.DI[CFG.style]; g.drawImage(Spr.doll('d', 0, this.kind === 'dead' ? 'angry' : 'stun', CFG.style), 160 - DI.w / 2, 104); }
    if (typeof MPend === 'function') MPend(g);
    if (this.t > 0.8 && (G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'ENTER O TOCA: JUGAR OTRA VEZ', 160, 168, { align: 'c', color: '#ffd23f' });
  },
  go() { if (this.t < 0.8) return; Sfx.click(); if (typeof MPback === 'function' && MPback()) return; newGame(undefined, this.st && this.st.dollMode ? { doll: true } : null); setScene(Play); },
  keydown(c) { if (c === 'Enter' || c === 'Space') this.go(); if (c === 'Escape') setScene(Title); },
  pointerDown() { this.go(); },
};

// ---------------- entrada ----------------
function toLocal(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * VW / r.width, (e.clientY - r.top) * VH / r.height]; }
function goFull() { try { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (x) {} }).catch(() => {}); } catch (x) {} }
function firstInput() { const first = !G.started; G.started = true; Sfx.init(); if (first) Sfx.horrorStart(); return first; }
addEventListener('keydown', e => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (e.repeat) return; G.keys[e.code] = true; const first = firstInput(); if (first && G.scene === Title) return;
  G.scene.keydown && G.scene.keydown(e.code);
});
addEventListener('keyup', e => { G.keys[e.code] = false; });
addEventListener('blur', () => { G.keys = {}; });
canvas.addEventListener('wheel', e => { if (S && S.overlay && S.overlay.type === 'craft' && G.scene === Play) { S.overlay.scroll = Math.max(0, S.overlay.scroll + (e.deltaY > 0 ? 1 : -1)); e.preventDefault(); } }, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !G.fullTried) { G.fullTried = true; goFull(); } const first = firstInput(); try { canvas.setPointerCapture(e.pointerId); } catch (x) {} if (first && G.scene === Title) return; const [x, y] = toLocal(e); G.scene.pointerDown && G.scene.pointerDown(e.pointerId, x, y, e.pointerType); e.preventDefault(); });
addEventListener('mousemove', e => { if (document.pointerLockElement === canvas && S && G.scene === Play && CFG.view === 'FP') { fpAdd(e.movementX, e.movementY, 0.0042); } });
canvas.addEventListener('pointermove', e => { const [x, y] = toLocal(e); G.scene.pointerMove && G.scene.pointerMove(e.pointerId, x, y); });
const up = e => { G.scene.pointerUp && G.scene.pointerUp(e.pointerId); };
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; G.t += dt;
  const s = G.scene; if (s.update) s.update(dt);
  ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, VW, VH); s.render(ctx);
  requestAnimationFrame(loop);
}
window.__SAVE = SAVE; window.__persist = persist; window.__G = G; window.__S = () => S; window.__scenes = { Play, End }; window.__CFG = CFG; window.__craft = { craftAdd, craftStart, craftMatch }; window.__setScene = setScene; window.__newGame = newGame;
