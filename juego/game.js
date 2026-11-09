'use strict';
// ============ NOCHE DE JUGUETES (prototipo: mapa 1 contra un bot) ============
const VW = 320, VH = 180;
const FAST = /fast/.test(location.search);
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const G = { scene: null, keys: {}, t: 0, started: false };
const { R, E } = Spr;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function fit() { const s = Math.min(innerWidth / VW, innerHeight / VH); canvas.style.width = Math.floor(VW * s) + 'px'; canvas.style.height = Math.floor(VH * s) + 'px'; }
addEventListener('resize', fit); fit();
function setScene(s, ...a) { G.scene = s; if (s.enter) s.enter(...a); }
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
  return c === '#' || c === ' ' || c === '1' || c === '2' || c === '3' || F.sol[ty][tx];
}
function hits(f, x, y, hw, hh) { return solidTile(f, tileOf(x - hw), tileOf(y - hh)) || solidTile(f, tileOf(x + hw), tileOf(y - hh)) || solidTile(f, tileOf(x - hw), tileOf(y + hh)) || solidTile(f, tileOf(x + hw), tileOf(y + hh)); }
function move(en, dx, dy, hw, hh) { if (!hits(en.f, en.x + dx, en.y, hw, hh)) en.x += dx; if (!hits(en.f, en.x, en.y + dy, hw, hh)) en.y += dy; }
function los(f, x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 4); for (let i = 1; i < n; i++) { const k = i / n; if (solidTile(f, tileOf(x0 + (x1 - x0) * k), tileOf(y0 + (y1 - y0) * k))) return false; } return true; }
function bfs(f, sx, sy, gx, gy) {
  if (sx === gx && sy === gy) return [];
  const prev = new Int32Array(MW * MH).fill(-2), q = [sy * MW + sx]; prev[sy * MW + sx] = -1;
  for (let h = 0; h < q.length; h++) {
    const k = q[h], x = k % MW, y = (k / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = ny * MW + nx;
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH || prev[nk] !== -2 || solidTile(f, nx, ny)) continue;
      prev[nk] = k;
      if (nx === gx && ny === gy) { const path = []; let c = nk; while (c !== sy * MW + sx) { path.push([c % MW, (c / MW) | 0]); c = prev[c]; } return path.reverse(); }
      q.push(nk);
    }
  }
  return null;
}

function newGame() {
  const W = buildMap1();
  const sp = W.spawn, es = W.enemySpawn;
  S = {
    W, t: 0, dur: FAST ? 60 : 360, blackoutAt: FAST ? 40 : 240, floors: W.f.map(f => Spr.floorCanvas(f)),
    p: { f: sp.f, x: tc(sp.x), y: tc(sp.y), dir: 'd', ang: Math.PI / 2, hp: 100, anim: 0, moving: false, keys: new Set(), mats: {}, items: ['mask', 'pizza'], charge: 100, beam: 0, beamHit: false, immune: 0, held: false, grab: 0, dead: false, escaped: false, code: null, charging: false, stairCd: 0 },
    e: { f: es.f, x: tc(es.x), y: tc(es.y), dir: 'd', fx: 0, fy: 1, state: 'patrol', stun: 0, eat: 0, path: [], goal: null, repath: 0, radarCd: 20, ring: 0, anim: 0, lost: 0, wait: -25, waitT: 1, calm: 0, last: null, stairCd: 0 },
    pizza: null, blackout: false, fixed: false, overlay: null, msg: null, fade: 1.2, ended: null, intro: 0, introT: 0, banner: null, room: null, flick: 0, flickCd: rand(6, 12), cam: { cx: 0, cy: 0 }, shake: 0, hint: null, joy: null, stats: { chests: 0, flashes: 0, grabs: 0 },
  };
  S.mini = W.f.map(F => Spr.mk(80, 48, g => { const cols = { '#': '#3a2a5a', '.': '#b88454', k: '#6ab8b0', g: '#8a8aa0', r: '#b04868' }; for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) { const c = F.g[j][i]; if (c === ' ') continue; g.fillStyle = cols[c] || cols['.']; g.fillRect(i * 2, j * 2, 2, 2); } }));
  S.parts = [];
  Sfx.horrorStart(); Sfx.setTension(0);
}
const say = (text, t = 2.4) => { S.msg = { text, t }; };

// ---------------- jugador ----------------
function inputVec() {
  let x = 0, y = 0; const k = G.keys;
  if (k.KeyA || k.ArrowLeft) x -= 1; if (k.KeyD || k.ArrowRight) x += 1; if (k.KeyW || k.ArrowUp) y -= 1; if (k.KeyS || k.ArrowDown) y += 1;
  if (x || y) { const l = Math.hypot(x, y); return [x / l, y / l]; }
  if (S.joy) { const dx = (S.joy.x - S.joy.ox) / 22, dy = (S.joy.y - S.joy.oy) / 22, l = Math.hypot(dx, dy); if (l > 0.18) return [dx / Math.max(1, l), dy / Math.max(1, l)]; }
  return [0, 0];
}
function nearest() {
  const p = S.p; let best = null, bd = 24;
  for (const o of S.W.f[p.f].objs) { if (o.type === 'deco' || o.removed) continue; const d = Math.hypot((o.x + o.w / 2) * TS - p.x, (o.y + o.h / 2) * TS - p.y); if (d < bd) { bd = d; best = o; } }
  return best;
}
function hintFor(o) {
  switch (o.type) {
    case 'chest': return o.opened ? null : 'ABRIR COFRE'; case 'wardrobe': return o.opened ? null : 'ABRIR ARMARIO';
    case 'door': return 'ABRIR PUERTA'; case 'vault': return o.opened ? 'VER CODIGO' : 'ABRIR BOVEDA';
    case 'recharge': return 'RECARGAR LINTERNA'; case 'table': return 'MESA DE CRAFTEO'; case 'computer': return 'USAR COMPUTADORA';
    case 'exit': return 'PUERTA DE SALIDA'; case 'stairs': return o.to === 1 ? 'SUBIR' : 'BAJAR';
  } return null;
}
function useAction() {
  const p = S.p, o = nearest(); if (!o) { 0; return; }
  switch (o.type) {
    case 'chest': case 'wardrobe': {
      if (o.opened) return; o.opened = true; S.stats.chests++; Sfx.chest(); for (let i = 0; i < 12; i++) S.parts.push({ x: (o.x + 0.5) * TS, y: o.y * TS + 6, vx: rand(-34, 34), vy: rand(-48, -14), g: 90, t: 0, life: rand(0.5, 0.9), col: ['#ffd23f', '#fff6a0', '#ff9ad0', '#8ae0ff'][i % 4], sz: 2, star: true }); const parts = [];
      for (const l of o.loot) { if (l.key) { p.keys.add(l.key); parts.push('LLAVE ' + KEY_NAMES[l.key]); } else { p.mats[l.mat] = (p.mats[l.mat] || 0) + l.n; parts.push(l.n + ' ' + MAT_NAMES[l.mat]); } }
      Sfx.pickup(); say(parts.join(', ')); break;
    }
    case 'door': if (p.keys.has(o.id)) { o.removed = true; S.W.f[o.f].g[o.y][o.x] = '.'; Sfx.door(); say('PUERTA ABIERTA'); } else { Sfx.back && 0; say('PUERTA CON LLAVE ' + KEY_NAMES[o.id]); } break;
    case 'vault': if (o.opened) { say('CODIGO: ' + o.code); } else if (p.keys.has(3)) { o.opened = true; p.code = o.code; Sfx.door(); Sfx.pickup(); say('CODIGO: ' + o.code + ' - ¡RECUERDALO!', 5); } else say('BOVEDA CERRADA'); break;
    case 'recharge': if (S.blackout) say('SIN ENERGIA'); else if (p.charge >= 99.9) say('LINTERNA LLENA'); else { p.charging = true; say('RECARGANDO...'); } break;
    case 'table': say('PROXIMAMENTE'); break;
    case 'computer': if (S.blackout && !S.fixed) { S.overlay = newPuzzle(); } else 0; break;
    case 'exit': S.overlay = { type: 'keypad', entered: '', shake: 0, o }; break;
    case 'stairs': {
      if (p.stairCd > 0) return; const to = o.to, l = S.W.land(to); p.f = to; p.x = tc(l.x); p.y = tc(l.y); p.stairCd = 0.8; S.fade = 0.5; Sfx.step(); break;
    }
  }
}
function flashAction() {
  const p = S.p; if (p.beam > 0) return;
  if (p.charge < 33) { say('SIN PILA'); return; }
  p.charge -= 33.4; if (p.charge < 0.5) p.charge = 0; p.beam = 1.4; p.beamHit = false; S.stats.flashes++; Sfx.flash();
}
function itemAction() {
  const p = S.p; if (!p.items.length) { 0; return; }
  const it = p.items.shift();
  if (it === 'mask') { p.immune = 10; 0; Sfx.hiss(); }
  else if (it === 'pizza') {
    let px = p.x + Math.cos(p.ang) * 44, py = p.y + Math.sin(p.ang) * 44; if (hits(p.f, px, py, 3, 3)) { px = p.x; py = p.y; }
    S.pizza = { f: p.f, x: px, y: py, life: 25 }; 0; Sfx.blip();
  }
}
function mash() { const p = S.p; p.grab = Math.min(100, p.grab + 11); Sfx.mash(); }
function press(kind) {
  if (S.intro > 0 || S.ended) return;
  if (S.p.held) { mash(); return; }
  if (S.p.dead || S.p.escaped) return;
  if (kind === 'use') useAction(); else if (kind === 'flash') flashAction(); else itemAction();
}

// ---------------- overlays ----------------
const COLS = ['#e04040', '#4a8aff', '#3ae07a', '#ffd23f'];
function newPuzzle() { return { type: 'puzzle', seq: [0, 1, 2].map(() => Math.random() * 4 | 0), phase: 'show', t: 0, idx: 0, wait: 0, flashC: -1, fail: 0 }; }
const PAD = { x: 104, y: 20, w: 112, h: 140 };
function padKeys() { const ks = []; ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'X'].forEach((k, i) => ks.push({ k, x: 112 + (i % 3) * 32, y: 56 + ((i / 3) | 0) * 26, w: 28, h: 22 })); return ks; }
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
    if (ov.seq[ov.idx] === v) { ov.idx++; if (ov.idx >= 3) { ov.phase = 'wait'; ov.wait = 3; Sfx.pickup(); } }
    else { ov.fail = 0.8; ov.phase = 'show'; ov.t = 0; ov.idx = 0; ov.seq = [0, 1, 2].map(() => Math.random() * 4 | 0); Sfx.hit(); }
  }
}
function updateOverlay(dt) {
  const ov = S.overlay; if (!ov) return;
  if (ov.shake > 0) ov.shake -= dt;
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
function enemySees() {
  const e = S.e, p = S.p; if (p.dead || p.escaped || p.immune > 0 || p.f !== e.f) return false;
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d > 54) return false;
  if (d < 17) return los(e.f, e.x, e.y, p.x, p.y);
  const a = Math.atan2(dy, dx), fa = Math.atan2(e.fy, e.fx);
  return Math.abs(angDiff(a, fa)) < 0.75 && los(e.f, e.x, e.y, p.x, p.y);
}
function stunEnemy(sec) { const e = S.e; e.stun = Math.max(e.stun, sec); e.path = []; if (e.state === 'eat') e.state = 'patrol'; Sfx.hiss(); }
function releaseGrab(imm) { const p = S.p, e = S.e; p.held = false; p.immune = Math.max(p.immune, imm); e.state = 'patrol'; e.path = []; e.goal = null; e.stun = Math.max(e.stun, 3.5); e.calm = 16; e.wait = 0; e.waitT = 3; 0; Sfx.flee(); }
function updateEnemy(dt) {
  const e = S.e, p = S.p; e.anim += dt; if (e.stairCd > 0) e.stairCd -= dt; e.calm = Math.max(0, e.calm - dt);
  if (e.state === 'grab') {
    e.x += (p.x - e.x) * Math.min(1, dt * 8); e.y += (p.y - 6 - e.y) * Math.min(1, dt * 8);
    p.hp -= 9 * dt;
    if (p.grab >= 100) releaseGrab(2.5);
    else if (p.hp <= 0) { p.hp = 0; p.dead = true; p.held = false; e.state = 'patrol'; e.stun = 2; Sfx.scare(); S.shake = 0.6; }
    else p.grab = Math.max(0, p.grab - 9 * dt);
    return;
  }
  if (e.stun > 0) { e.stun -= dt; return; }
  // radar: cada pocos segundos lanza un círculo; si hay alguien cerca, va hacia allá
  e.radarCd -= dt;
  if (e.radarCd <= 0) {
    e.radarCd = rand(13, 18); e.ring = 0.001; const same = p.f === e.f, d = same ? Math.hypot(p.x - e.x, p.y - e.y) : 999;
    Sfx.radar(same ? clamp(1.1 - d / 260, 0.1, 1) : 0.08);
    if (same && d < RADAR_R && !p.dead && !p.escaped && p.immune <= 0 && e.state !== 'chase' && e.calm <= 0) { e.last = { f: p.f, x: p.x, y: p.y }; e.state = 'investigate'; planTo(p.f, tileOf(p.x), tileOf(p.y)); }
  }
  if (e.ring > 0) { e.ring += dt; if (e.ring > 1.2) e.ring = 0; }
  // pizza señuelo
  const pz = S.pizza;
  if (pz) { pz.life -= dt; if (pz.life <= 0) S.pizza = null; }
  if (S.pizza && e.state !== 'eat' && S.pizza.f === e.f && Math.hypot(S.pizza.x - e.x, S.pizza.y - e.y) < 230) {
    if (Math.hypot(S.pizza.x - e.x, S.pizza.y - e.y) < 10) { e.state = 'eat'; e.eat = 7; e.path = []; }
    else if (e.state !== 'lure') { e.state = 'lure'; planTo(e.f, tileOf(S.pizza.x), tileOf(S.pizza.y)); }
  }
  if (e.state === 'eat') { e.eat -= dt; if (e.eat <= 0) { S.pizza = null; e.state = 'patrol'; e.goal = null; } return; }
  if (e.state === 'lure' && !S.pizza) { e.state = 'patrol'; e.goal = null; }
  // visión
  const sees = enemySees();
  if (sees && e.state !== 'chase' && e.state !== 'lure' && e.calm <= 0 && S.t > 30) { e.state = 'chase'; e.lost = 0; Sfx.warn(); }
  if (e.state === 'chase') {
    if (sees) { e.lost = 0; e.last = { f: p.f, x: p.x, y: p.y }; } else e.lost += dt;
    if (e.lost > 2.2 || p.dead || p.escaped || p.immune > 0 && !sees && e.lost > 0.5) { e.state = 'investigate'; if (e.last) planTo(e.last.f, tileOf(e.last.x), tileOf(e.last.y)); e.lost = 0; e.calm = 10; }
    e.repath -= dt; if (e.repath <= 0 && !p.dead) { e.repath = 0.25; planTo(sees ? p.f : e.last ? e.last.f : e.f, tileOf(sees ? p.x : e.last ? e.last.x : e.x), tileOf(sees ? p.y : e.last ? e.last.y : e.y)); }
  }
  // atrapar
  if (p.f === e.f && !p.dead && !p.escaped && !p.held && p.immune <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 13 && (e.state === 'chase' || e.state === 'investigate' || e.state === 'patrol')) {
    e.state = 'grab'; p.held = true; p.grab = 0; p.charging = false; S.overlay = null; S.stats.grabs++; Sfx.grab(); S.shake = 0.4; 0; return;
  }
  // seguir camino
  const spd = (e.state === 'chase' ? 45 : e.state === 'investigate' || e.state === 'lure' ? 34 : 27) * (S.blackout ? 1.15 : 1);
  if (e.path.length) {
    const [tx, ty] = e.path[0], dx = tc(tx) - e.x, dy = tc(ty) - e.y, d = Math.hypot(dx, dy);
    if (d < 2) e.path.shift();
    else { const st = Math.min(d, spd * dt), ux = dx / d, uy = dy / d; move(e, ux * st, uy * st, EHW, EHH); e.fx = ux; e.fy = uy; e.dir = Math.abs(ux) > Math.abs(uy) ? (ux < 0 ? 'l' : 'r') : (uy < 0 ? 'u' : 'd'); }
  } else {
    // llegó al destino intermedio o final
    if (e.goal && e.goal.f !== e.f && e.stairCd <= 0) { const to = e.goal.f, l = S.W.land(to); e.f = to; e.x = tc(l.x); e.y = tc(l.y); e.stairCd = 3; planTo(e.goal.f, e.goal.tx, e.goal.ty); }
    else if (e.state === 'investigate' || e.state === 'chase') { e.wait += dt; if (e.wait > 1.6) { e.wait = 0; e.state = 'patrol'; e.goal = null; } }
    else if (e.state === 'lure') { e.state = 'patrol'; }
    else { e.wait += dt; if (e.wait > e.waitT) { e.wait = 0; e.waitT = rand(3, 7); pickWaypoint(); } }
  }
}

// ---------------- actualización ----------------
function update(dt) {
  if (S.intro > 0) { S.introT += dt; return; }
  const p = S.p, e = S.e;
  S.t += dt; S.shake = Math.max(0, S.shake - dt); S.fade = Math.max(0, S.fade - dt);
  if (S.msg) { S.msg.t -= dt; if (S.msg.t <= 0) S.msg = null; }
  for (const q of S.parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; } S.parts = S.parts.filter(q => q.t < q.life);
  if (p.stairCd > 0) p.stairCd -= dt; if (p.immune > 0) p.immune -= dt;
  if (!S.blackout && !S.fixed && S.t >= S.blackoutAt) { S.blackout = true; p.charging = false; Sfx.power(); 0; }
  const [vx, vy] = inputVec(), mag = Math.hypot(vx, vy);
  if (S.overlay && mag > 0.5) S.overlay = null;
  p.moving = false;
  if (!p.held && !p.dead && !p.escaped && !S.overlay && !S.ended) {
    if (mag > 0.05) { move(p, vx * SPEED * dt, vy * SPEED * dt, HW, HH); p.moving = true; p.anim += dt * 9; p.dust = (p.dust || 0) - dt; if (p.dust <= 0) { p.dust = 0.17; S.parts.push({ x: p.x + rand(-2, 2), y: p.y + 2, vx: rand(-6, 6), vy: rand(-8, -3), t: 0, life: 0.5, col: '#d8c8b0', sz: 2, fade: 1 }); } p.ang = Math.atan2(vy, vx); p.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'l' : 'r') : (vy < 0 ? 'u' : 'd'); if (p.charging) { p.charging = false; 0; } }
  }
  if (p.charging) {
    const st = S.W.f[p.f].objs.find(o => o.type === 'recharge');
    if (S.blackout || p.f !== 0 || Math.hypot((st.x + 0.5) * TS - p.x, (st.y + 0.5) * TS - p.y) > 30) p.charging = false;
    else { p.charge = Math.min(100, p.charge + 10 * dt); if (p.charge >= 100) { p.charging = false; say('LINTERNA LISTA'); Sfx.pickup(); } }
  }
  if (p.beam > 0) {
    p.beam -= dt;
    if (!p.beamHit && e.f === p.f) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d < 125 && Math.abs(angDiff(Math.atan2(dy, dx), p.ang)) < 0.52 && los(p.f, p.x, p.y, e.x, e.y)) { p.beamHit = true; if (e.state === 'grab') releaseGrab(1.5); stunEnemy(3); 0; } }
  }
  if (p.held) { /* forcejeo en updateEnemy */ }
  updateEnemy(dt); updateOverlay(dt);
  if (!S.ended) {
    if (p.escaped) S.ended = { kind: 'escape', t: 0 }; else if (p.dead) S.ended = { kind: 'dead', t: 0 }; else if (S.t >= S.dur) S.ended = { kind: 'survive', t: 0 };
  } else { S.ended.t += dt; if (S.ended.t > (S.ended.kind === 'dead' ? 2.2 : 1.6)) { Sfx.setTension(0); setScene(End, S.ended.kind, S); } }
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
function renderFx(g) {
  const p = S.p, e = S.e;
  g.fillStyle = 'rgba(70,20,120,0.12)'; g.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 4; i++) { const x = ((G.t * 7 + i * 110) % 460) - 70, y = 36 + i * 42 + Math.sin(G.t * 0.5 + i) * 8; E(g, x, y, 74, 11, 'rgba(210,200,255,0.05)'); E(g, x + 20, y + 4, 46, 7, 'rgba(210,200,255,0.05)'); }
  for (const d of DUST) { const x = ((d.x + G.t * d.vx) % 320 + 320) % 320, y = ((d.y + G.t * d.vy) % 180 + 180) % 180; g.fillStyle = 'rgba(230,220,255,' + (0.25 + 0.2 * Math.sin(G.t * 2 + d.ph)).toFixed(2) + ')'; g.fillRect(x | 0, y | 0, d.s, d.s); }
  g.globalAlpha = 0.85 + 0.15 * Math.sin(G.t * 1.3); g.drawImage(VIG, 0, 0); g.globalAlpha = 1;
  const dist = e.f === p.f ? Math.hypot(e.x - p.x, e.y - p.y) : 999, prox = Math.max(clamp(1 - dist / 150, 0, 1), p.held ? 1 : 0);
  if (prox > 0.05 || e.state === 'chase' && e.f === p.f) { g.globalAlpha = clamp(prox * 0.9 + (e.state === 'chase' ? 0.15 : 0), 0, 1) * (0.55 + 0.45 * Math.sin(G.t * (5 + prox * 6))); g.drawImage(VIGR, 0, 0); g.globalAlpha = 1; }
  if (S.flick > 0) { g.fillStyle = 'rgba(0,0,20,' + (0.45 * Math.abs(Math.sin(S.flick * 40))).toFixed(2) + ')'; g.fillRect(0, 0, VW, VH); }
}
function renderWorld(g) {
  const p = S.p, e = S.e;
  const cam = S.p.dead && S.e.f === p.f ? e : p;
  let cx = clamp(Math.round(cam.x - VW / 2), 0, MW * TS - VW), cy = clamp(Math.round(cam.y - VH / 2), 0, MH * TS - VH);
  if (S.shake > 0) { cx += (Math.random() * 4 - 2) | 0; cy += (Math.random() * 4 - 2) | 0; }
  S.cam.cx = cx; S.cam.cy = cy;
  g.save(); g.translate(-cx, -cy);
  g.drawImage(S.floors[p.f], 0, 0);
  for (const o of S.W.f[p.f].objs) if (o.type === 'deco' && o.kind === 'lamp') { const lx = o.x * TS + 8, ly = o.y * TS + 8, fl = 0.05 + 0.03 * Math.sin(G.t * 9 + o.x * 3) + (Math.random() < 0.02 ? 0.05 : 0); E(g, lx, ly, 24, 17, 'rgba(255,210,120,' + fl.toFixed(3) + ')'); E(g, lx, ly, 13, 9, 'rgba(255,230,160,' + (fl * 1.3).toFixed(3) + ')'); }
  const st = { t: G.t, power: !S.blackout, charging: p.charging, blackout: S.blackout };
  for (const o of S.W.f[p.f].objs) if (!o.removed && o.type !== 'door') Spr.obj(g, o, st);
  const list = [];
  list.push({ y: p.y, d: () => { if (p.escaped) return; const sp = Spr.kid(p.dir, p.moving ? 1 + ((p.anim | 0) % 2) : 0, 0); g.globalAlpha = p.dead ? 0.35 : (p.immune > 0 && (G.t * 10 | 0) % 2 ? 0.5 : 1); g.drawImage(sp, Math.round(p.x - 12), Math.round(p.y - 28)); g.globalAlpha = 1; } });
  if (e.f === p.f) list.push({ y: e.y, d: () => { const mood = e.stun > 0 || e.state === 'eat' ? 'stun' : (e.state === 'chase' || e.state === 'grab') ? 'angry' : 'calm'; const sp = Spr.doll(e.dir, e.path.length && e.stun <= 0 && e.state !== 'eat' ? 1 + ((e.anim * 6 | 0) % 2) : 0, mood); if (mood === 'angry') E(g, e.x, e.y + 1, 14 + Math.round(Math.sin(G.t * 10)), 5, 'rgba(255,40,70,0.25)'); g.drawImage(sp, Math.round(e.x - 20), Math.round(e.y - 47 + (e.path.length ? 0 : Math.sin(G.t * 2.5)))); if (e.stun > 0 || e.state === 'eat') for (let i = 0; i < 4; i++) { const a = G.t * 5 + i * 1.6; R(g, e.x + Math.cos(a) * 11 - 1, e.y - 52 + Math.sin(a) * 3, 3, 3, '#ffd23f'); } } });
  if (S.pizza && S.pizza.f === p.f) list.push({ y: S.pizza.y, d: () => { E(g, S.pizza.x, S.pizza.y, 5, 4, '#e0a040'); E(g, S.pizza.x, S.pizza.y, 4, 3, '#d04030'); R(g, S.pizza.x - 2, S.pizza.y - 1, 2, 1, '#ffe890'); R(g, S.pizza.x + 1, S.pizza.y, 2, 1, '#ffe890'); } });
  list.sort((a, b) => a.y - b.y).forEach(i => i.d());
  for (const q of S.parts) { const k = 1 - q.t / q.life; g.globalAlpha = clamp(q.fade ? k * 0.7 : 1 - Math.pow(q.t / q.life, 3), 0, 1); g.fillStyle = q.col; if (q.star) { g.fillRect(Math.round(q.x) - 1, Math.round(q.y), 3, 1); g.fillRect(Math.round(q.x), Math.round(q.y) - 1, 1, 3); } else g.fillRect(Math.round(q.x), Math.round(q.y), q.sz, q.sz); } g.globalAlpha = 1;
  // destello de la linterna
  if (p.beam > 0) { const k = clamp(p.beam / 1.4, 0, 1); for (let wy = Math.floor((p.y - 130) / 3) * 3; wy < p.y + 130; wy += 3) for (let wx = Math.floor((p.x - 130) / 3) * 3; wx < p.x + 130; wx += 3) { const dx = wx - p.x, dy = wy - p.y, d2 = dx * dx + dy * dy; if (d2 < 130 * 130 && d2 > 16 && Math.abs(angDiff(Math.atan2(dy, dx), p.ang)) < 0.52 && los(p.f, p.x, p.y, wx, wy)) { g.fillStyle = 'rgba(255,252,210,' + (0.34 * k * (1 - Math.sqrt(d2) / 150)).toFixed(3) + ')'; g.fillRect(wx, wy, 3, 3); } } }
  g.restore();
  if (S.blackout) renderDark(g, cx, cy);
  renderFx(g);
  g.save(); g.translate(-cx, -cy);
  // ojos y radar del enemigo (visibles en la oscuridad)
  if (e.f === p.f) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (S.blackout && e.stun <= 0 && e.dir !== 'u') { const xs = e.dir === 'd' ? [-6, 6] : e.dir === 'l' ? [-8] : [8]; for (const x of xs) { R(g, e.x + x - 1, e.y - 32, 3, 3, '#ff2a2a'); R(g, e.x + x - 3, e.y - 34, 7, 7, 'rgba(255,40,40,0.25)'); } }
    if (e.ring > 0 && d < RADAR_R + 140) { ring(g, e.x, e.y, e.ring / 1.2 * RADAR_R, 'rgba(255,60,60,0.9)'); ring(g, e.x, e.y, Math.max(1, e.ring / 1.2 * RADAR_R - 3), 'rgba(255,60,60,0.45)'); }
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
    if ((G.t * 3 | 0) % 2) R(g, mx + tileOf(p.x) * 2 - 1, my + tileOf(p.y) * 2 - 1, 4, 4, '#fff'); R(g, mx + tileOf(p.x) * 2, my + tileOf(p.y) * 2, 2, 2, '#ff4a6a');
    Txt.draw(g, String(p.f + 1), mx + 73, my + 40, { color: '#ffd23f', outline: '#000' }); }
  // joystick (siempre visible)
  const j = S.joy;
  if (j) { const dx = j.x - j.ox, dy = j.y - j.oy, l = Math.hypot(dx, dy), k = l > 24 ? 24 / l : 1; drawJoy(g, j.ox, j.oy, Math.round(j.ox + dx * k), Math.round(j.oy + dy * k), true); }
  else { drawJoy(g, JOY_HOME.x, JOY_HOME.y, JOY_HOME.x, JOY_HOME.y, false); }
  // botones
  const near = S.hint, canF = p.charge >= 33;
  circle(g, BTN.use.x, BTN.use.y, BTN.use.r, near ? '#ffd23f' : '#4a42a0', near ? '#fff' : '#8a7af0'); E(g, BTN.use.x - 8, BTN.use.y - 9, 7, 4, near ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'); Txt.draw(g, 'USAR', BTN.use.x, BTN.use.y - 3, { s: 1, align: 'c', color: near ? '#1a0f1f' : '#fff' });
  circle(g, BTN.flash.x, BTN.flash.y, BTN.flash.r, canF ? '#4a42a0' : '#2a2840', canF ? '#8a7af0' : '#5a5080'); R(g, BTN.flash.x - 3, BTN.flash.y - 5, 7, 4, canF ? '#ffd23f' : '#6a6a50'); R(g, BTN.flash.x - 2, BTN.flash.y - 1, 5, 6, canF ? '#ffd23f' : '#6a6a50'); Txt.draw(g, 'LINTERNA', BTN.flash.x, BTN.flash.y + BTN.flash.r + 2, { align: 'c', color: '#c9c0ff', shadow: '#000' });
  const it = p.items[0];
  circle(g, BTN.item.x, BTN.item.y, BTN.item.r, it ? '#4a42a0' : '#2a2840', it ? '#8a7af0' : '#5a5080'); Txt.draw(g, it === 'mask' ? 'M' : it === 'pizza' ? 'P' : '-', BTN.item.x, BTN.item.y - 3, { align: 'c', color: it ? '#fff' : '#6a6a80' });
  Txt.draw(g, it ? (it === 'mask' ? 'MASCARA' : 'PIZZA') + (p.items.length > 1 ? ' +' + (p.items.length - 1) : '') : 'OBJETO', BTN.item.x, BTN.item.y + BTN.item.r + 2, { align: 'c', color: '#c9c0ff', shadow: '#000' });
  if (S.msg) { g.globalAlpha = clamp(S.msg.t * 2, 0, 1); Txt.draw(g, S.msg.text, 160, 26, { align: 'c', color: '#fff', outline: '#000' }); g.globalAlpha = 1; }
  // forcejeo
  if (p.held) {
    panel(g, 100, 54, 120, 72, 'rgba(40,6,10,0.92)', '#e03030'); Txt.draw(g, '¡TE AGARRARON!', 160, 60, { align: 'c', color: '#ff6060' });
    circle(g, 160, 92, 17 + ((G.t * 10 | 0) % 2), '#e03030', '#fff'); Txt.draw(g, 'TOCA', 160, 89, { align: 'c', color: '#fff' });
    R(g, 110, 114, 100, 6, '#000'); R(g, 111, 115, Math.round(98 * p.grab / 100), 4, '#3ae07a');
  }
  // overlays
  const ov = S.overlay;
  if (ov) {
    if (ov.type === 'keypad') {
      const sx = ov.shake > 0 ? (Math.random() * 4 - 2) | 0 : 0; g.save(); g.translate(sx, 0);
      panel(g, PAD.x, PAD.y, PAD.w, PAD.h); Txt.draw(g, 'CODIGO DE SALIDA', 160, 26, { align: 'c', color: '#ffd23f' });
      R(g, 118, 38, 84, 14, '#000'); Txt.draw(g, (ov.entered + '____').slice(0, 4).split('').join(' '), 160, 42, { align: 'c', s: 1, color: ov.shake > 0 ? '#ff4040' : '#3ae07a' });
      for (const k of padKeys()) { R(g, k.x, k.y, k.w, k.h, '#000'); R(g, k.x + 1, k.y + 1, k.w - 2, k.h - 2, k.k === 'X' ? '#6a2030' : k.k === 'C' ? '#5a4a20' : '#3a3470'); Txt.draw(g, k.k, k.x + 14, k.y + 8, { align: 'c', color: '#fff' }); }
      g.restore();
    } else {
      panel(g, PAD.x, PAD.y, PAD.w, PAD.h); Txt.draw(g, 'COMPUTADORA', 160, 26, { align: 'c', color: '#3ae07a' });
      const lab = ov.phase === 'show' ? (ov.fail > 0 ? '¡ERROR! OTRA VEZ' : 'MEMORIZA EL ORDEN') : ov.phase === 'input' ? 'REPITE EL ORDEN (' + ov.idx + '/3)' : 'REINICIANDO... ' + Math.ceil(ov.wait) + ' (NO TE MUEVAS)';
      Txt.draw(g, lab, 160, 40, { align: 'c', color: '#fff' });
      const shown = ov.phase === 'show' && ov.fail <= 0 ? (ov.t > 0.5 ? Math.floor((ov.t - 0.5) / 0.9) : -1) : -1;
      const hot = ov.phase === 'show' && shown >= 0 && shown < 3 && ((ov.t - 0.5) % 0.9) < 0.6 ? ov.seq[shown] : (ov.flashT > 0 ? ov.flashC : -1);
      for (const b of puzBtns()) { R(g, b.x, b.y, b.w, b.h, '#000'); R(g, b.x + 1, b.y + 1, b.w - 2, b.h - 2, hot === b.i ? COLS[b.i] : ov.phase === 'wait' ? '#2a2a3a' : '#1c1a30'); R(g, b.x + 4, b.y + 4, b.w - 8, b.h - 8, hot === b.i ? '#fff' : COLS[b.i]); if (hot !== b.i) { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8); } }
      if (ov.phase === 'wait') { R(g, 118, 150, 84, 5, '#000'); R(g, 119, 151, Math.round(82 * (1 - ov.wait / 3)), 3, '#3ae07a'); }
    }
  }
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
const Title = {
  sel: 0, items: ['JUGAR (PRACTICA CON BOT)', 'CREAR SALA (PRONTO)', 'UNIRSE CON CODIGO (PRONTO)', 'SONIDO'],
  enter() { this.sel = 0; if (G.started) { Sfx.horrorStart(); Sfx.setTension(0); } },
  render(g) {
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
    const w = Math.sin(t * 2) * 1.5, gl = Math.random() < 0.02 ? 2 : 0;
    Txt.draw(g, 'NOCHE DE', 224 + gl, 46 + w, { s: 3, align: 'c', color: '#ffd23f', outline: '#1a0820', shadow: '#d0601a' });
    Txt.draw(g, 'JUGUETES', 224 - gl, 74 - w, { s: 3, align: 'c', color: '#ff7ab8', outline: '#1a0820', shadow: '#a02060' });
    if (!G.started) { if ((t * 2 | 0) % 2 === 0) Txt.draw(g, 'TOCA PARA JUGAR', 224, 128, { s: 1, align: 'c', color: '#fff', outline: '#000' }); return; }
    this.items.forEach((it, i) => { const sel = i === this.sel; let l = it; if (i === 3) l = 'SONIDO: ' + (Sfx.muted ? 'NO' : 'SI'); const y = 108 + i * 14; if (sel) { g.fillStyle = 'rgba(255,210,63,0.18)'; g.fillRect(122, y - 3, 204, 13); R(g, 122, y - 3, 2, 13, '#ffd23f'); } Txt.draw(g, l, 224, y, { align: 'c', color: sel ? '#ffd23f' : i === 1 || i === 2 ? '#7a6aa8' : '#e8e0ff', outline: '#10081c' }); });
  },
  act(i) { Sfx.click(); if (i === 0) { newGame(); setScene(Play); } else if (i === 3) Sfx.toggleMute(); else say0(); },
  keydown(c) { if (!G.started) return; if (c === 'ArrowUp' || c === 'KeyW') this.sel = (this.sel + 3) % 4; if (c === 'ArrowDown' || c === 'KeyS') this.sel = (this.sel + 1) % 4; if (c === 'Enter' || c === 'Space') this.act(this.sel); },
  pointerDown(id, x, y) { if (!G.started) return; for (let i = 0; i < 4; i++) if (y >= 105 + i * 14 && y < 119 + i * 14 && x > 110) { this.sel = i; this.act(i); } },
};
function say0() { Sfx.back(); }

const Play = {
  enter() {}, update(dt) { update(dt); },
  render(g) { R(g, 0, 0, VW, VH, '#000'); renderWorld(g); renderHud(g); },
  keydown(c) {
    if (S.intro > 0) { if (c === 'Escape') { setScene(Title); return; } if (S.introT > 0.6) S.intro = 0; return; }
    if (S.overlay) { if (c === 'Escape') { S.overlay = null; return; } if (S.overlay.type === 'keypad' && /^(Digit|Numpad)[0-9]$/.test(c)) { overlayInput('k', c.slice(-1)); return; } if (S.overlay.type === 'puzzle' && /^(Digit|Numpad)[1-4]$/.test(c)) { overlayInput('p', +c.slice(-1) - 1); return; } }
    if (c === 'Escape') { Sfx.setTension(0); setScene(Title); return; }
    if (c === 'KeyE' || c === 'KeyJ' || c === 'Space') press('use'); else if (c === 'KeyF' || c === 'KeyK') press('flash'); else if (c === 'KeyQ' || c === 'KeyL') press('item');
  },
  pointerDown(id, x, y) {
    G.touched = true;
    if (S.intro > 0) { if (S.introT > 0.6) S.intro = 0; return; }
    if (S.overlay) {
      const ov = S.overlay;
      if (ov.type === 'keypad') { for (const k of padKeys()) if (x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h) { overlayInput('k', k.k); return; } }
      else if (ov.phase === 'input') for (const b of puzBtns()) if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { overlayInput('p', b.i); return; }
      if (x >= PAD.x && x < PAD.x + PAD.w && y >= PAD.y && y < PAD.y + PAD.h) return;
    }
    for (const k in BTN) { const b = BTN[k]; if (Math.hypot(x - b.x, y - b.y) < b.r + 7) { press(k); return; } }
    if (S.p.held) { mash(); return; }
    if (x < 180 && y > 24) S.joy = { id, ox: clamp(x, 34, 150), oy: clamp(y, 64, 154), x, y };
  },
  pointerMove(id, x, y) { if (S && S.joy && S.joy.id === id) { S.joy.x = x; S.joy.y = y; } },
  pointerUp(id) { if (S && S.joy && S.joy.id === id) S.joy = null; },
};

const End = {
  enter(kind, st) { this.kind = kind; this.t = 0; this.st = st; if (kind === 'dead') Sfx.lose(); else { Sfx.win(); } },
  update(dt) { this.t += dt; },
  render(g) {
    const k = this.kind; R(g, 0, 0, VW, VH, k === 'dead' ? '#0a0204' : '#0a1a14');
    const title = k === 'escape' ? '¡ESCAPASTE!' : k === 'survive' ? '¡SOBREVIVISTE!' : 'TE ATRAPARON';
    Txt.draw(g, title, 160, 22, { s: 3, align: 'c', color: k === 'dead' ? '#e03030' : '#3ae07a', shadow: '#000' });
    Txt.draw(g, k === 'escape' ? 'SALISTE POR LA PUERTA CON EL CODIGO' : k === 'survive' ? 'LLEGASTE A LAS 6 AM' : 'AHORA ERES ESPECTADOR... Y NO HAY NADIE MAS', 160, 54, { align: 'c', color: '#fff' });
    const st = this.st; const mins = Math.floor(480 * clamp(st.t / st.dur, 0, 1)), hh = (22 * 60 + mins) / 60 % 24 | 0, mm = (22 * 60 + mins) % 60;
    Txt.draw(g, 'HORA FINAL: ' + (hh % 12 || 12) + ':' + String(mm).padStart(2, '0') + (hh >= 12 && hh < 24 ? ' PM' : ' AM'), 160, 78, { align: 'c', color: '#c9a6ff' });
    Txt.draw(g, 'COFRES ABIERTOS: ' + st.stats.chests + '   LINTERNAZOS: ' + st.stats.flashes + '   VECES AGARRADO: ' + st.stats.grabs, 160, 92, { align: 'c', color: '#c9a6ff' });
    g.drawImage(Spr.doll('d', 0, this.kind === 'dead' ? 'angry' : 'stun'), 140, 104, 40, 52);
    if (this.t > 0.8 && (G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'ENTER O TOCA: JUGAR OTRA VEZ', 160, 168, { align: 'c', color: '#ffd23f' });
  },
  go() { if (this.t < 0.8) return; Sfx.click(); newGame(); setScene(Play); },
  keydown(c) { if (c === 'Enter' || c === 'Space') this.go(); if (c === 'Escape') setScene(Title); },
  pointerDown() { this.go(); },
};

// ---------------- entrada ----------------
function toLocal(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * VW / r.width, (e.clientY - r.top) * VH / r.height]; }
function goFull() { try { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (x) {} }).catch(() => {}); } catch (x) {} }
function firstInput() { const first = !G.started; G.started = true; Sfx.init(); if (first) Sfx.horrorStart(); return first; }
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (e.repeat) return; G.keys[e.code] = true; const first = firstInput(); if (first && G.scene === Title) return;
  G.scene.keydown && G.scene.keydown(e.code);
});
addEventListener('keyup', e => { G.keys[e.code] = false; });
addEventListener('blur', () => { G.keys = {}; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !G.fullTried) { G.fullTried = true; goFull(); } const first = firstInput(); try { canvas.setPointerCapture(e.pointerId); } catch (x) {} if (first && G.scene === Title) return; const [x, y] = toLocal(e); G.scene.pointerDown && G.scene.pointerDown(e.pointerId, x, y); e.preventDefault(); });
canvas.addEventListener('pointermove', e => { const [x, y] = toLocal(e); G.scene.pointerMove && G.scene.pointerMove(e.pointerId, x, y); });
const up = e => { G.scene.pointerUp && G.scene.pointerUp(e.pointerId); };
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; G.t += dt;
  const s = G.scene; if (s.update) s.update(dt);
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); s.render(ctx);
  requestAnimationFrame(loop);
}
window.__G = G; window.__S = () => S; window.__scenes = { Title, Play, End }; window.__setScene = setScene; window.__newGame = newGame;
setScene(Title); requestAnimationFrame(loop);
