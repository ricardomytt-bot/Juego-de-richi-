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
const SPEED = 62, HW = 4, HH = 3, EHW = 5, EHH = 4, RADAR_R = 130;
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
    e: { f: es.f, x: tc(es.x), y: tc(es.y), dir: 'd', fx: 0, fy: 1, state: 'patrol', stun: 0, eat: 0, path: [], goal: null, repath: 0, radarCd: 7, ring: 0, anim: 0, lost: 0, wait: 0, last: null, stairCd: 0 },
    pizza: null, blackout: false, fixed: false, overlay: null, msg: null, fade: 0, ended: null, intro: 1, introT: 0, banner: null, room: null, flick: 0, flickCd: rand(6, 12), cam: { cx: 0, cy: 0 }, shake: 0, hint: null, joy: null, stats: { chests: 0, flashes: 0, grabs: 0 },
  };
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
  const p = S.p, o = nearest(); if (!o) { say('NO HAY NADA CERCA'); return; }
  switch (o.type) {
    case 'chest': case 'wardrobe': {
      if (o.opened) return; o.opened = true; S.stats.chests++; Sfx.chest(); const parts = [];
      for (const l of o.loot) { if (l.key) { p.keys.add(l.key); parts.push('LLAVE ' + KEY_NAMES[l.key]); } else { p.mats[l.mat] = (p.mats[l.mat] || 0) + l.n; parts.push(l.n + ' ' + MAT_NAMES[l.mat]); } }
      Sfx.pickup(); say(parts.join(', ')); break;
    }
    case 'door': if (p.keys.has(o.id)) { o.removed = true; S.W.f[o.f].g[o.y][o.x] = '.'; Sfx.door(); say('PUERTA ABIERTA'); } else { Sfx.back && 0; say('NECESITAS LA LLAVE ' + KEY_NAMES[o.id]); } break;
    case 'vault': if (o.opened) { say('CODIGO: ' + o.code); } else if (p.keys.has(3)) { o.opened = true; p.code = o.code; Sfx.door(); Sfx.pickup(); say('CODIGO: ' + o.code + ' - ¡RECUERDALO!', 5); } else say('NECESITAS LA LLAVE VERDE'); break;
    case 'recharge': if (S.blackout) say('SIN LUZ: LA ESTACION NO FUNCIONA'); else if (p.charge >= 99.9) say('LINTERNA YA ESTA LLENA'); else { p.charging = true; say('RECARGANDO... NO TE MUEVAS'); } break;
    case 'table': say('MESA DE CRAFTEO: PROXIMAMENTE'); break;
    case 'computer': if (S.blackout && !S.fixed) { S.overlay = newPuzzle(); } else say(S.fixed ? 'LA LUZ YA FUNCIONA' : 'SE USA CUANDO SE VA LA LUZ'); break;
    case 'exit': S.overlay = { type: 'keypad', entered: '', shake: 0, o }; break;
    case 'stairs': {
      if (p.stairCd > 0) return; const to = o.to, l = S.W.land(to); p.f = to; p.x = tc(l.x); p.y = tc(l.y); p.stairCd = 0.8; S.fade = 0.5; Sfx.step(); break;
    }
  }
}
function flashAction() {
  const p = S.p; if (p.beam > 0) return;
  if (p.charge < 33) { say('SIN PILA: RECARGA EN EL ESTACIONAMIENTO'); return; }
  p.charge -= 33.4; if (p.charge < 0.5) p.charge = 0; p.beam = 1.4; p.beamHit = false; S.stats.flashes++; Sfx.flash();
}
function itemAction() {
  const p = S.p; if (!p.items.length) { say('NO TIENES OBJETOS'); return; }
  const it = p.items.shift();
  if (it === 'mask') { p.immune = 10; say('MASCARA: INMUNE 10 SEGUNDOS'); Sfx.hiss(); }
  else if (it === 'pizza') {
    let px = p.x + Math.cos(p.ang) * 44, py = p.y + Math.sin(p.ang) * 44; if (hits(p.f, px, py, 3, 3)) { px = p.x; py = p.y; }
    S.pizza = { f: p.f, x: px, y: py, life: 25 }; say('LANZASTE LA PIZZA'); Sfx.blip();
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
      if (ov.entered === ov.o.code) { ov.o.escape = true; S.p.escaped = true; S.overlay = null; Sfx.door(); Sfx.win(); say('¡ABRISTE LA PUERTA!'); }
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
  else if (ov.phase === 'wait') { ov.wait -= dt; if (ov.wait <= 0) { S.overlay = null; S.blackout = false; S.fixed = true; Sfx.bell(); say('¡LUZ ARREGLADA!', 3); } }
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
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy); if (d > 72) return false;
  if (d < 22) return los(e.f, e.x, e.y, p.x, p.y);
  const a = Math.atan2(dy, dx), fa = Math.atan2(e.fy, e.fx);
  return Math.abs(angDiff(a, fa)) < 0.96 && los(e.f, e.x, e.y, p.x, p.y);
}
function stunEnemy(sec) { const e = S.e; e.stun = Math.max(e.stun, sec); e.path = []; if (e.state === 'eat') e.state = 'patrol'; Sfx.hiss(); }
function releaseGrab(imm) { const p = S.p, e = S.e; p.held = false; p.immune = Math.max(p.immune, imm); e.state = 'patrol'; e.path = []; e.goal = null; e.stun = Math.max(e.stun, 1.5); say('¡TE SOLTASTE!'); Sfx.flee(); }
function updateEnemy(dt) {
  const e = S.e, p = S.p; e.anim += dt; if (e.stairCd > 0) e.stairCd -= dt;
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
    e.radarCd = rand(8, 11); e.ring = 0.001; const same = p.f === e.f, d = same ? Math.hypot(p.x - e.x, p.y - e.y) : 999;
    Sfx.radar(same ? clamp(1.1 - d / 260, 0.1, 1) : 0.08);
    if (same && d < RADAR_R && !p.dead && !p.escaped && p.immune <= 0 && e.state !== 'chase') { e.last = { f: p.f, x: p.x, y: p.y }; e.state = 'investigate'; planTo(p.f, tileOf(p.x), tileOf(p.y)); }
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
  if (sees && e.state !== 'chase' && e.state !== 'lure') { e.state = 'chase'; e.lost = 0; Sfx.warn(); }
  if (e.state === 'chase') {
    if (sees) { e.lost = 0; e.last = { f: p.f, x: p.x, y: p.y }; } else e.lost += dt;
    if (e.lost > 4 || p.dead || p.escaped || p.immune > 0 && !sees && e.lost > 0.5) { e.state = 'investigate'; if (e.last) planTo(e.last.f, tileOf(e.last.x), tileOf(e.last.y)); e.lost = 0; }
    e.repath -= dt; if (e.repath <= 0 && !p.dead) { e.repath = 0.25; planTo(sees ? p.f : e.last ? e.last.f : e.f, tileOf(sees ? p.x : e.last ? e.last.x : e.x), tileOf(sees ? p.y : e.last ? e.last.y : e.y)); }
  }
  // atrapar
  if (p.f === e.f && !p.dead && !p.escaped && !p.held && p.immune <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < 13 && (e.state === 'chase' || e.state === 'investigate' || e.state === 'patrol')) {
    e.state = 'grab'; p.held = true; p.grab = 0; p.charging = false; S.overlay = null; S.stats.grabs++; Sfx.grab(); S.shake = 0.4; say('¡TE AGARRO! ¡TOCA LOS BOTONES!', 3); return;
  }
  // seguir camino
  const spd = (e.state === 'chase' ? 54 : e.state === 'investigate' || e.state === 'lure' ? 42 : 34) * (S.blackout ? 1.15 : 1);
  if (e.path.length) {
    const [tx, ty] = e.path[0], dx = tc(tx) - e.x, dy = tc(ty) - e.y, d = Math.hypot(dx, dy);
    if (d < 2) e.path.shift();
    else { const st = Math.min(d, spd * dt), ux = dx / d, uy = dy / d; move(e, ux * st, uy * st, EHW, EHH); e.fx = ux; e.fy = uy; e.dir = Math.abs(ux) > Math.abs(uy) ? (ux < 0 ? 'l' : 'r') : (uy < 0 ? 'u' : 'd'); }
  } else {
    // llegó al destino intermedio o final
    if (e.goal && e.goal.f !== e.f && e.stairCd <= 0) { const to = e.goal.f, l = S.W.land(to); e.f = to; e.x = tc(l.x); e.y = tc(l.y); e.stairCd = 3; planTo(e.goal.f, e.goal.tx, e.goal.ty); }
    else if (e.state === 'investigate' || e.state === 'chase') { e.wait += dt; if (e.wait > 1.6) { e.wait = 0; e.state = 'patrol'; e.goal = null; } }
    else if (e.state === 'lure') { e.state = 'patrol'; }
    else { e.wait += dt; if (e.wait > 0.8) { e.wait = 0; pickWaypoint(); } }
  }
}

// ---------------- actualización ----------------
function update(dt) {
  if (S.intro > 0) { S.introT += dt; return; }
  const p = S.p, e = S.e;
  S.t += dt; S.shake = Math.max(0, S.shake - dt); S.fade = Math.max(0, S.fade - dt);
  if (S.msg) { S.msg.t -= dt; if (S.msg.t <= 0) S.msg = null; }
  if (p.stairCd > 0) p.stairCd -= dt; if (p.immune > 0) p.immune -= dt;
  if (!S.blackout && !S.fixed && S.t >= S.blackoutAt) { S.blackout = true; p.charging = false; Sfx.power(); say('¡SE FUE LA LUZ!', 4); }
  const [vx, vy] = inputVec(), mag = Math.hypot(vx, vy);
  if (S.overlay && mag > 0.5) S.overlay = null;
  p.moving = false;
  if (!p.held && !p.dead && !p.escaped && !S.overlay && !S.ended) {
    if (mag > 0.05) { move(p, vx * SPEED * dt, vy * SPEED * dt, HW, HH); p.moving = true; p.anim += dt * 9; p.ang = Math.atan2(vy, vx); p.dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'l' : 'r') : (vy < 0 ? 'u' : 'd'); if (p.charging) { p.charging = false; say('RECARGA CANCELADA'); } }
  }
  if (p.charging) {
    const st = S.W.f[p.f].objs.find(o => o.type === 'recharge');
    if (S.blackout || p.f !== 0 || Math.hypot((st.x + 0.5) * TS - p.x, (st.y + 0.5) * TS - p.y) > 30) p.charging = false;
    else { p.charge = Math.min(100, p.charge + 10 * dt); if (p.charge >= 100) { p.charging = false; say('LINTERNA LISTA'); Sfx.pickup(); } }
  }
  if (p.beam > 0) {
    p.beam -= dt;
    if (!p.beamHit && e.f === p.f) { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d < 125 && Math.abs(angDiff(Math.atan2(dy, dx), p.ang)) < 0.52 && los(p.f, p.x, p.y, e.x, e.y)) { p.beamHit = true; if (e.state === 'grab') releaseGrab(1.5); stunEnemy(3); say('¡ATURDIDO 3 SEGUNDOS!', 1.6); } }
  }
  if (p.held) { /* forcejeo en updateEnemy */ }
  updateEnemy(dt); updateOverlay(dt);
  if (!S.ended) {
    if (p.escaped) S.ended = { kind: 'escape', t: 0 }; else if (p.dead) S.ended = { kind: 'dead', t: 0 }; else if (S.t >= S.dur) S.ended = { kind: 'survive', t: 0 };
  } else { S.ended.t += dt; if (S.ended.t > (S.ended.kind === 'dead' ? 2.2 : 1.6)) { Sfx.setTension(0); setScene(End, S.ended.kind, S); } }
  const o = !S.overlay && !p.held ? nearest() : null; S.hint = o ? hintFor(o) : null;
  // nombre de la habitación
  const F = S.W.f[p.f], tx = tileOf(p.x), ty = tileOf(p.y), rm = F.rooms.find(r => tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h);
  const rk = rm ? p.f + rm.name : null;
  if (rk !== S.room) { S.room = rk; if (rm && ROOM_NAMES[rm.name]) S.banner = { title: ROOM_NAMES[rm.name][0], sub: ROOM_NAMES[rm.name][1], t: 2.6 }; }
  if (S.banner) { S.banner.t -= dt; if (S.banner.t <= 0) S.banner = null; }
  // tensión de la música y parpadeo de luces
  const dist = e.f === p.f ? Math.hypot(e.x - p.x, e.y - p.y) : 999, prox = clamp(1 - dist / 170, 0, 1);
  Sfx.setTension(p.held ? 1 : Math.max(prox * 0.9, e.state === 'chase' ? 0.65 : 0, S.blackout ? 0.4 : 0));
  S.flickCd -= dt; if (S.flickCd <= 0) { S.flickCd = rand(7, 15); S.flick = 0.22; Sfx.light(); }
  if (S.flick > 0) S.flick -= dt;
}
const ROOM_NAMES = { sala: ['SALA', 'AQUI EMPIEZAS'], cocina: ['COCINA', ''], estudio: ['ESTUDIO', ''], boveda: ['BOVEDA', 'AQUI ESTA EL CODIGO'], estacionamiento: ['ESTACIONAMIENTO', 'AQUI RECARGAS LA LINTERNA'], comedor: ['COMEDOR', 'ESCALERAS HACIA EL PISO 2'], taller: ['TALLER', 'LA SALIDA NECESITA EL CODIGO'], pasillo: ['PASILLO', ''], 'cuarto A': ['CUARTO DE LA COMPUTADORA', 'ARREGLA LA LUZ AQUI'], 'cuarto B': ['CUARTO AZUL', ''], bano: ['BAÑO', ''], 'cuarto C': ['CUARTO INFANTIL', ''], biblioteca: ['BIBLIOTECA', ''], bodega: ['BODEGA', ''], atico: ['ATICO', ''] };

// ---------- objetivo actual ----------
function getObjective() {
  const p = S.p, W = S.W;
  const find = pred => { for (let f = 0; f < 2; f++) { const o = W.f[f].objs.find(pred); if (o) return o; } };
  const door = id => find(o => o.type === 'door' && o.id === id), open = id => door(id).removed;
  let o, text, col = '#ffd23f';
  if (S.blackout && !S.fixed) { o = find(x => x.type === 'computer'); text = '¡SE FUE LA LUZ! ARREGLALA EN LA COMPUTADORA'; col = '#ff5a5a'; }
  else if (!p.keys.has(1)) { o = find(x => x.type === 'chest' && x.loot.some(l => l.key === 1)); text = 'ABRE EL COFRE DE LA SALA: LLAVE ROJA'; col = KEY_COLORS[1]; }
  else if (!open(1)) { o = door(1); text = 'ABRE LA PUERTA ROJA (FONDO DE LA COCINA)'; col = KEY_COLORS[1]; }
  else if (!p.keys.has(2)) { o = find(x => x.type === 'wardrobe' && x.loot.some(l => l.key === 2)); text = 'ABRE EL ARMARIO DEL ESTUDIO: LLAVE AZUL'; col = KEY_COLORS[2]; }
  else if (!open(2)) { o = door(2); text = 'ABRE LA PUERTA AZUL DEL PISO 2'; col = KEY_COLORS[2]; }
  else if (!p.keys.has(3)) { o = find(x => x.type === 'chest' && x.loot.some(l => l.key === 3)); text = 'ABRE EL COFRE DEL CUARTO AZUL: LLAVE VERDE'; col = KEY_COLORS[3]; }
  else if (!open(3)) { o = door(3); text = 'ABRE LA PUERTA VERDE (ESTUDIO)'; col = KEY_COLORS[3]; }
  else if (!find(x => x.type === 'vault').opened) { o = find(x => x.type === 'vault'); text = 'ABRE LA BOVEDA: AHI ESTA EL CODIGO'; col = KEY_COLORS[3]; }
  else { o = find(x => x.type === 'exit'); text = 'ESCAPA POR EL TALLER: ESCRIBE EL CODIGO'; col = '#3ae07a'; }
  let tgt = o;
  if (o.f !== p.f) { tgt = W.f[p.f].objs.find(x => x.type === 'stairs'); text = (o.f > p.f ? 'SUBE AL PISO 2. ' : 'BAJA AL PISO 1. ') + text; }
  return { o, tgt, text, col };
}
function arrow(g, x, y, ang, col, sz = 7) {
  const c = Math.cos(ang), s = Math.sin(ang);
  for (const pad of [1.4, 0]) { g.fillStyle = pad ? '#000' : col; for (let dy = -sz - 3; dy <= sz + 3; dy++) for (let dx = -sz - 3; dx <= sz + 3; dx++) { const u = dx * c + dy * s, v = -dx * s + dy * c; const head = u >= -pad && u <= sz + pad && Math.abs(v) <= (sz - u) * 0.95 + pad, tail = u >= -sz * 0.9 - pad && u <= 0.5 + pad && Math.abs(v) <= 1.7 + pad; if (head || tail) g.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1); } }
}
function edgeArrow(g, wx, wy, col) {
  const sx = wx - S.cam.cx, sy = wy - S.cam.cy;
  if (sx > 10 && sx < 310 && sy > 70 && sy < 172) return false;
  const dx = sx - 160, dy = sy - 121, k = Math.min(140 / Math.max(1, Math.abs(dx)), 44 / Math.max(1, Math.abs(dy)));
  arrow(g, 160 + dx * k, 121 + dy * k, Math.atan2(dy, dx), col, 7); return true;
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
  const st = { t: G.t, power: !S.blackout, charging: p.charging, blackout: S.blackout };
  for (const o of S.W.f[p.f].objs) if (!o.removed && o.type !== 'door') Spr.obj(g, o, st);
  const list = [];
  list.push({ y: p.y, d: () => { if (p.escaped) return; const sp = Spr.kid(p.dir, p.moving ? 1 + ((p.anim | 0) % 2) : 0, 0); g.globalAlpha = p.dead ? 0.35 : (p.immune > 0 && (G.t * 10 | 0) % 2 ? 0.5 : 1); g.drawImage(sp, Math.round(p.x - 12), Math.round(p.y - 28)); g.globalAlpha = 1; } });
  if (e.f === p.f) list.push({ y: e.y, d: () => { const mood = e.stun > 0 || e.state === 'eat' ? 'stun' : (e.state === 'chase' || e.state === 'grab') ? 'angry' : 'calm'; const sp = Spr.doll(e.dir, e.path.length && e.stun <= 0 && e.state !== 'eat' ? 1 + ((e.anim * 6 | 0) % 2) : 0, mood); g.drawImage(sp, Math.round(e.x - 20), Math.round(e.y - 47)); if (e.stun > 0 || e.state === 'eat') for (let i = 0; i < 4; i++) { const a = G.t * 5 + i * 1.6; R(g, e.x + Math.cos(a) * 11 - 1, e.y - 52 + Math.sin(a) * 3, 3, 3, '#ffd23f'); } } });
  if (S.pizza && S.pizza.f === p.f) list.push({ y: S.pizza.y, d: () => { E(g, S.pizza.x, S.pizza.y, 5, 4, '#e0a040'); E(g, S.pizza.x, S.pizza.y, 4, 3, '#d04030'); R(g, S.pizza.x - 2, S.pizza.y - 1, 2, 1, '#ffe890'); R(g, S.pizza.x + 1, S.pizza.y, 2, 1, '#ffe890'); } });
  list.sort((a, b) => a.y - b.y).forEach(i => i.d());
  // destello de la linterna
  if (p.beam > 0) { const k = clamp(p.beam / 1.4, 0, 1); for (let wy = Math.floor((p.y - 130) / 3) * 3; wy < p.y + 130; wy += 3) for (let wx = Math.floor((p.x - 130) / 3) * 3; wx < p.x + 130; wx += 3) { const dx = wx - p.x, dy = wy - p.y, d2 = dx * dx + dy * dy; if (d2 < 130 * 130 && d2 > 16 && Math.abs(angDiff(Math.atan2(dy, dx), p.ang)) < 0.52 && los(p.f, p.x, p.y, wx, wy)) { g.fillStyle = 'rgba(255,252,210,' + (0.34 * k * (1 - Math.sqrt(d2) / 150)).toFixed(3) + ')'; g.fillRect(wx, wy, 3, 3); } } }
  // marcadores: objetivo y objetos que se pueden abrir
  const ob = getObjective();
  for (const o of S.W.f[p.f].objs) {
    if (o.removed) continue; const ox = (o.x + o.w / 2) * TS, oy = o.y * TS;
    if (((o.type === 'chest' || o.type === 'wardrobe' || o.type === 'vault') && !o.opened)) { const tw = ((G.t * 3 + o.x) % 2) < 1; g.fillStyle = tw ? '#fff6a0' : '#ffd23f'; g.fillRect(ox + 4, oy - 2, 1, 3); g.fillRect(ox + 3, oy - 1, 3, 1); g.fillRect(ox - 6, oy + 2, 1, 1); }
    if (o.type === 'door') { ring(g, ox, (o.y + 0.5) * TS, 11 + Math.sin(G.t * 4) * 1.5, KEY_COLORS[o.id]); ring(g, ox, (o.y + 0.5) * TS, 12 + Math.sin(G.t * 4) * 1.5, KEY_COLORS[o.id]); }
  }
  if (ob.tgt && ob.tgt.f === p.f) { const t = ob.tgt, tx = (t.x + t.w / 2) * TS, ty = t.y * TS - 6 - Math.abs(Math.sin(G.t * 4)) * 4; ring(g, tx, (t.y + t.h / 2) * TS, 13 + Math.sin(G.t * 5) * 2, ob.col); arrow(g, tx, ty - 6, Math.PI / 2, ob.col, 6); }
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
  Txt.draw(g, h12 + ':' + String(mm).padStart(2, '0') + (hh >= 12 && hh < 24 ? ' PM' : ' AM'), 160, 4, { s: 2, align: 'c', color: S.blackout ? '#ff6060' : '#fff', outline: '#000' });
  R(g, 110, 22, 100, 3, '#000'); R(g, 111, 23, Math.round(98 * clamp(S.t / S.dur, 0, 1)), 1, '#ffd23f');
  Txt.draw(g, 'PISO ' + (p.f + 1), 316, 5, { align: 'r', color: '#c9a6ff', shadow: '#000' });
  // inventario
  let iy = 34; for (const k of Object.keys(p.mats)) if (p.mats[k] > 0) { Txt.draw(g, MAT_NAMES[k].slice(0, 3) + ' ' + p.mats[k], 4, iy, { color: '#d8d0ff', shadow: '#000' }); iy += 9; }
  for (const k of p.keys) { R(g, 4 + (k - 1) * 12, iy + 2, 9, 5, KEY_COLORS[k]); R(g, 4 + (k - 1) * 12, iy + 2, 9, 1, '#fff'); }
  if (p.immune > 0 && !p.held) Txt.draw(g, 'INMUNE ' + Math.ceil(p.immune), 160, 28, { align: 'c', color: '#3ae07a', shadow: '#000' });
  // objetivo, progreso y flechas
  const ob = getObjective(), olines = Txt.wrap(ob.text, 172), oh = 14 + olines.length * 9;
  g.fillStyle = 'rgba(8,4,20,0.82)'; g.fillRect(70, 29, 184, oh); R(g, 70, 29, 184, 1, ob.col); R(g, 70, 29, 3, oh, ob.col);
  Txt.draw(g, 'OBJETIVO', 78, 33, { color: ob.col }); olines.forEach((l, i) => Txt.draw(g, l, 78, 43 + i * 9, { color: '#fff' }));
  [[1, 224], [2, 238], [3, 252]].forEach(([k, x]) => { const has = p.keys.has(k); R(g, x, 14, 12, 10, '#000'); R(g, x + 1, 15, 10, 8, has ? KEY_COLORS[k] : '#2a2440'); if (has) R(g, x + 3, 17, 6, 1, 'rgba(255,255,255,0.6)'); else Txt.draw(g, '?', x + 6, 16, { align: 'c', color: '#6a6090' }); });
  R(g, 268, 14, 28, 10, '#000'); R(g, 269, 15, 26, 8, p.code ? '#3ae07a' : '#2a2440'); Txt.draw(g, p.code ? p.code : 'COD', 282, 16, { align: 'c', color: p.code ? '#06210f' : '#6a6090' });
  R(g, 298, 14, 18, 10, '#000'); R(g, 299, 15, 16, 8, p.escaped ? '#3ae07a' : '#2a2440'); Txt.draw(g, 'SAL', 307, 16, { align: 'c', color: p.escaped ? '#06210f' : '#6a6090' });
  if (!p.dead && !p.escaped) {
    if (ob.tgt && ob.tgt.f === p.f) edgeArrow(g, (ob.tgt.x + ob.tgt.w / 2) * TS, (ob.tgt.y + ob.tgt.h / 2) * TS, ob.col);
    if (e.f === p.f && Math.hypot(e.x - p.x, e.y - p.y) < 340 && e.state !== 'eat') edgeArrow(g, e.x, e.y, '#ff3a3a');
  }
  if (S.banner) { const b = S.banner, a = clamp(Math.min(b.t, 0.5) * 2, 0, 1), w = Math.max(Txt.w(b.title, 1), Txt.w(b.sub, 1)) + 24; g.globalAlpha = a; g.fillStyle = 'rgba(8,4,20,0.85)'; g.fillRect(160 - w / 2, 104, w, b.sub ? 24 : 15); R(g, 160 - w / 2, 104, w, 1, '#ffd23f'); Txt.draw(g, b.title, 160, 108, { align: 'c', color: '#ffd23f' }); if (b.sub) Txt.draw(g, b.sub, 160, 118, { align: 'c', color: '#c9c0ff' }); g.globalAlpha = 1; }
  // joystick (siempre visible)
  const j = S.joy;
  if (j) { const dx = j.x - j.ox, dy = j.y - j.oy, l = Math.hypot(dx, dy), k = l > 24 ? 24 / l : 1; drawJoy(g, j.ox, j.oy, Math.round(j.ox + dx * k), Math.round(j.oy + dy * k), true); }
  else { drawJoy(g, JOY_HOME.x, JOY_HOME.y, JOY_HOME.x, JOY_HOME.y, false); if (!G.touched || S.t < 6) Txt.draw(g, 'MOVER', JOY_HOME.x, JOY_HOME.y + 33, { align: 'c', color: '#fff', outline: '#000' }); }
  // botones
  const near = S.hint, canF = p.charge >= 33;
  circle(g, BTN.use.x, BTN.use.y, BTN.use.r, near ? '#ffd23f' : '#4a42a0', near ? '#fff' : '#8a7af0'); E(g, BTN.use.x - 8, BTN.use.y - 9, 7, 4, near ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)'); Txt.draw(g, 'USAR', BTN.use.x, BTN.use.y - 3, { s: 1, align: 'c', color: near ? '#1a0f1f' : '#fff' });
  circle(g, BTN.flash.x, BTN.flash.y, BTN.flash.r, canF ? '#4a42a0' : '#2a2840', canF ? '#8a7af0' : '#5a5080'); R(g, BTN.flash.x - 3, BTN.flash.y - 5, 7, 4, canF ? '#ffd23f' : '#6a6a50'); R(g, BTN.flash.x - 2, BTN.flash.y - 1, 5, 6, canF ? '#ffd23f' : '#6a6a50'); Txt.draw(g, 'LINTERNA', BTN.flash.x, BTN.flash.y + BTN.flash.r + 2, { align: 'c', color: '#c9c0ff', shadow: '#000' });
  const it = p.items[0];
  circle(g, BTN.item.x, BTN.item.y, BTN.item.r, it ? '#4a42a0' : '#2a2840', it ? '#8a7af0' : '#5a5080'); Txt.draw(g, it === 'mask' ? 'M' : it === 'pizza' ? 'P' : '-', BTN.item.x, BTN.item.y - 3, { align: 'c', color: it ? '#fff' : '#6a6a80' });
  Txt.draw(g, it ? (it === 'mask' ? 'MASCARA' : 'PIZZA') + (p.items.length > 1 ? ' +' + (p.items.length - 1) : '') : 'OBJETO', BTN.item.x, BTN.item.y + BTN.item.r + 2, { align: 'c', color: '#c9c0ff', shadow: '#000' });
  if (S.hint) Txt.draw(g, 'USAR: ' + S.hint, 160, 158, { align: 'c', color: '#ffd23f', outline: '#000' });
  if (S.msg) Txt.draw(g, S.msg.text, 160, 138, { align: 'c', color: '#fff', outline: '#000' });
  // forcejeo
  if (p.held) {
    panel(g, 100, 54, 120, 72, 'rgba(40,6,10,0.92)', '#e03030'); Txt.draw(g, '¡TE AGARRARON!', 160, 60, { align: 'c', color: '#ff6060' });
    circle(g, 160, 92, 17 + ((G.t * 10 | 0) % 2), '#e03030', '#fff'); Txt.draw(g, 'TOCA', 160, 89, { align: 'c', color: '#fff' });
    R(g, 110, 114, 100, 6, '#000'); R(g, 111, 115, Math.round(98 * p.grab / 100), 4, '#3ae07a');
  }
  if (e.state === 'chase' && e.f === p.f && !p.held && (G.t * 4 | 0) % 2) Txt.draw(g, '¡TE VE!', 160, 94, { align: 'c', color: '#ff4040', outline: '#000' });
  if (S.blackout) { Txt.draw(g, 'SIN LUZ', 316, 15, { align: 'r', color: '#ff6060', shadow: '#000' }); }
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
  if (S.intro > 0) {
    R(g, 0, 0, VW, VH, '#0c0820'); for (let i = 0; i < 40; i++) R(g, (i * 71) % 320, (i * 37) % 180, 1, 1, i % 4 ? '#fff' : '#ffd23f');
    Txt.draw(g, 'MAPA 1', 160, 6, { align: 'c', color: '#c9a6ff' }); Txt.draw(g, 'CASA ABANDONADA', 160, 16, { s: 2, align: 'c', color: '#ffd23f', outline: '#2a1a30' });
    panel(g, 6, 38, 82, 108, '#1a1038', '#e02a70'); g.drawImage(Spr.doll('d', (G.t * 3 | 0) % 2, 'calm'), 16, 44, 62, 81); Txt.draw(g, 'LA MUÑECA', 47, 128, { align: 'c', color: '#ff7ab8' }); Txt.draw(g, 'TE BUSCA', 47, 137, { align: 'c', color: '#fff' });
    panel(g, 94, 38, 220, 108, '#1a1038', '#6a5ad0');
    const steps = [['#4a42a0', 'J', 'MUEVETE: JOYSTICK (O TECLAS WASD)'], ['#ffd23f', 'U', 'USAR (O J): ABRE COFRES, PUERTAS Y ESCALERAS'], ['#4aa8ff', 'L', 'LINTERNA (O K): ATURDE A LA MUÑECA 3 S'], ['#3ae07a', '★', 'ESCAPA CON LLAVES Y CODIGO O SOBREVIVE HASTA LAS 6 AM']];
    steps.forEach(([c, l, t], i) => { const y = 44 + i * 25; circle(g, 110, y + 9, 8, c, '#fff'); Txt.draw(g, l === '★' ? '!' : l, 110, y + 6, { align: 'c', color: '#1a0f1f' }); Txt.wrap(t, 186).forEach((ln, k) => Txt.draw(g, ln, 124, y + 3 + k * 9, { color: '#fff' })); });
    Txt.draw(g, 'SIGUE LA FLECHA AMARILLA: TE DICE A DONDE IR', 160, 152, { align: 'c', color: '#ffd23f' });
    if (S.introT > 0.6 && (G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'TOCA PARA EMPEZAR', 160, 166, { s: 1, align: 'c', color: '#fff', outline: '#000' });
  }
}

// ---------------- escenas ----------------
const Title = {
  sel: 0, items: ['JUGAR (PRACTICA CON BOT)', 'CREAR SALA (PRONTO)', 'UNIRSE CON CODIGO (PRONTO)', 'SONIDO'],
  enter() { this.sel = 0; if (G.started) { Sfx.horrorStart(); Sfx.setTension(0); } },
  render(g) {
    R(g, 0, 0, VW, VH, '#07061a'); for (let i = 0; i < 40; i++) R(g, (i * 71) % 320, (i * 37) % 100, 1, 1, i % 5 ? '#fff' : '#ffd23f');
    E(g, 270, 34, 18, 18, '#fff6c8'); E(g, 277, 29, 15, 15, '#07061a'); E(g, 270, 34, 18, 18, '#fff6c8'); E(g, 278, 28, 15, 15, '#07061a');
    R(g, 0, 150, 320, 30, '#0c0a1e'); g.drawImage(Spr.doll('d', (G.t * 3 | 0) % 2 ? 1 : 0, 'calm'), 22, 38, 80, 104);
    Txt.draw(g, 'NOCHE DE', 210, 14, { s: 3, align: 'c', color: '#ffd23f', outline: '#1a0f1f' }); Txt.draw(g, 'JUGUETES', 210, 38, { s: 3, align: 'c', color: '#ff7ab8', outline: '#1a0f1f' });
    Txt.draw(g, '(NOMBRE PROVISIONAL)', 210, 62, { align: 'c', color: '#8a7fe0' });
    if (!G.started) { if ((G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'TOCA O PULSA UNA TECLA', 210, 110, { align: 'c', color: '#fff', outline: '#000' }); return; }
    this.items.forEach((it, i) => { const sel = i === this.sel; let l = it; if (i === 3) l = 'SONIDO: ' + (Sfx.muted ? 'NO' : 'SI'); Txt.draw(g, (sel ? '> ' : '') + l, 210, 86 + i * 14, { align: 'c', color: sel ? '#ffd23f' : i === 1 || i === 2 ? '#6a6090' : '#d8d0ff', shadow: '#000' }); });
  },
  act(i) { Sfx.click(); if (i === 0) { newGame(); setScene(Play); } else if (i === 3) Sfx.toggleMute(); else say0(); },
  keydown(c) { if (!G.started) return; if (c === 'ArrowUp' || c === 'KeyW') this.sel = (this.sel + 3) % 4; if (c === 'ArrowDown' || c === 'KeyS') this.sel = (this.sel + 1) % 4; if (c === 'Enter' || c === 'Space') this.act(this.sel); },
  pointerDown(id, x, y) { if (!G.started) return; for (let i = 0; i < 4; i++) if (y >= 82 + i * 14 && y < 96 + i * 14 && x > 90) { this.sel = i; this.act(i); } },
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
