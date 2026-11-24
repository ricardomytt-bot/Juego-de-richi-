'use strict';
// ===== Lógica (vista desde arriba): estado, movimiento, combate, enemigos, jefe =====
const SPEED = 330;
const BOSS_HP = 18;
const CH = {
  mike: '01_mike', exe: '02_mike_malvado', willy: '03_perro_negro', ambrosio: '04_cartero', aquela: '05_gata_azul',
  rius: '06_gallo_espada', mayo: '07_robot_pizza', acenix: '08_gato_blanco_pastel', esparta: '09_chico_capucha_azul',
  raptor: '10_chico_gorro_rojo', timba: '11_chico_pelo_azul', trolino: '12_chico_pelo_negro', invictor: '13_romano'
};
const NAMES = {
  mike: 'Mike', exe: 'Exe', willy: 'Willy Perro', ambrosio: 'Ambrosio', aquela: 'Aquela', rius: 'Rius', mayo: 'Mayo',
  acenix: 'Acenix', esparta: 'Esparta', raptor: 'Raptor', timba: 'Timba', trolino: 'Trolino', invictor: 'Invictor', narr: ''
};

const S = {
  mode: 'title', lvl: null, lvlId: 0, ents: [], proj: [], warns: [], particles: [], floaters: [], stage: null, dialog: null,
  timers: [], busy: false, skip: false, t: 0, dia: 0, deaths: 0, playTime: 0,
  fade: 0, fadeAnim: null, shake: 0, hitstop: 0, cam: { x: 0, y: 0 }, boss: null, bossLock: false,
  bossStarted: false, gateOpen: false, gotLetter: false, checkpoint: [0, 0], hint: '', hintT: 0, willy: null,
  leaving: false, nearNpc: null, bossDefeated: false, stepT: 0, keys: [0, 0, 0],
  q: { gotLetters: false, delivered: {}, count: 0, total: 7, done: false, trainStarted: false }, fav: {}, flags: {}, wave: null, camShot: null
};
const P = {
  x: 0, y: 0, hw: 10, hh: 12, vx: 0, vy: 0, dx: 0, dy: 1, face: 1, hp: 5, maxHp: 5, inv: 0,
  atk: 0, atkCd: 0, adx: 0, ady: 1, hitSet: new Set(), anim: 0, moving: false, dead: false, hitWall: false
};
const pbody = () => ({ x: P.x, y: P.y - 22 });

// ---------- Promesas de tiempo / diálogo (para cinemáticas) ----------
function wait(sec) { return S.skip ? Promise.resolve() : new Promise(res => S.timers.push({ t: sec, res })); }
function updateTimers(dt) {
  for (let i = S.timers.length - 1; i >= 0; i--) {
    const m = S.timers[i]; m.t -= dt;
    if (m.t <= 0 || S.skip) { S.timers.splice(i, 1); m.res(); }
  }
}
function fadeTo(v, t) {
  return new Promise(res => {
    if (S.skip) { S.fade = v; res(); return; }
    S.fadeAnim = { from: S.fade, to: v, t: 0, dur: t, res };
  });
}
function updateFade(dt) {
  const f = S.fadeAnim; if (!f) return;
  f.t += dt; S.fade = lerp(f.from, f.to, Math.min(1, f.t / f.dur));
  if (f.t >= f.dur || S.skip) { S.fade = f.to; S.fadeAnim = null; f.res(); }
}
function say(who, text, opt = {}) {
  if (S.skip) return Promise.resolve();
  return new Promise(res => {
    S.dialog = {
      who, text, shown: 0, res, side: opt.side || (who === 'mike' ? 'L' : 'R'),
      portrait: opt.portrait !== false && !!CH[who], red: !!opt.red, name: opt.name != null ? opt.name : (NAMES[who] || who), tick: 0
    };
  });
}
function ask(who, text, options, opt = {}) {
  if (S.skip) return Promise.resolve(0);
  return new Promise(res => {
    S.dialog = { who, text, shown: 0, res, side: opt.side || (who === 'mike' ? 'L' : 'R'), portrait: opt.portrait !== false && !!CH[who] && who !== 'narr', red: !!opt.red, name: opt.name != null ? opt.name : (NAMES[who] || who), choices: options, sel: 0, age: 0, seed: opt.seed || 0 };
  });
}
function updateDialog(dt) {
  const d = S.dialog; if (!d) return;
  if (S.skip) { S.dialog = null; d.res(d.choices ? 0 : undefined); return; }
  d.age = (d.age || 0) + dt;
  const before = Math.floor(d.shown);
  d.shown = Math.min(d.text.length, d.shown + dt * (d.who === 'timba' ? 40 : 52));
  const now = Math.floor(d.shown);
  if (now !== before) { const ch = d.text[now - 1]; if (ch && ch !== ' ' && now % 2 === 0 && d.who !== 'narr') sfx.voice(d.who, now + (d.seed || 0) * 7); }
  const done = d.shown >= d.text.length;
  if (d.choices && done) {
    if (wasPressed(K.up)) { d.sel = (d.sel + d.choices.length - 1) % d.choices.length; sfx.move(); }
    if (wasPressed(K.down)) { d.sel = (d.sel + 1) % d.choices.length; sfx.move(); }
    if (PTR.hit && d.rects) {
      for (let i = 0; i < d.rects.length; i++) { const r = d.rects[i]; if (PTR.x > r.x && PTR.x < r.x + r.w && PTR.y > r.y && PTR.y < r.y + r.h) { PTR.hit = false; S.dialog = null; sfx.select(); d.res(i); return; } }
    }
    if (wasPressed(K.ok)) { S.dialog = null; sfx.select(); d.res(d.sel); }
    return;
  }
  if (wasPressed(K.ok)) { if (!done) d.shown = d.text.length; else { S.dialog = null; d.res(); } }
}
function showHint(t, sec) { S.hint = t; S.hintT = Math.max(S.hintT, sec); }

// ---------- Efectos ----------
function spawnP(x, y, n, color, spd = 160, life = .5, size = 4) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(.3, 1) * spd;
    S.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(.5, 1) * life, max: life, color, size });
  }
}
function floater(x, y, text, color = '#fff') { S.floaters.push({ x, y, text, color, t: 0 }); }
function updateFx(dt) {
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i]; p.life -= dt; p.vx *= (1 - 2.5 * dt); p.vy *= (1 - 2.5 * dt); p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0) S.particles.splice(i, 1);
  }
  for (let i = S.floaters.length - 1; i >= 0; i--) {
    const f = S.floaters[i]; f.t += dt; f.y -= 34 * dt; if (f.t > 1.3) S.floaters.splice(i, 1);
  }
}

// ---------- Colisiones con el mapa ----------
function boxHit(L, b) {
  const x0 = Math.floor((b.x - b.hw) / T), x1 = Math.floor((b.x + b.hw - .01) / T);
  const y0 = Math.floor((b.y - b.hh) / T), y1 = Math.floor((b.y - .01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidCh(L.get(tx, ty))) return true;
  return false;
}
function moveBody(L, b, dt) {
  b.hitWall = false;
  let dx = b.vx * dt, dy = b.vy * dt;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4)); dx /= n; dy /= n;
  for (let i = 0; i < n; i++) {
    if (dx) { b.x += dx; if (boxHit(L, b)) { b.x -= dx; b.vx = 0; b.hitWall = true; dx = 0; } }
    if (dy) { b.y += dy; if (boxHit(L, b)) { b.y -= dy; b.vy = 0; b.hitWall = true; dy = 0; } }
  }
}
function freeSpot(L, x, y, hw, hh) {   // busca un sitio libre cerca
  const b = { x, y, hw, hh };
  if (!boxHit(L, b)) return [x, y];
  for (let r = 8; r < 200; r += 8) for (let a = 0; a < 6.28; a += .5) {
    b.x = x + Math.cos(a) * r; b.y = y + Math.sin(a) * r; if (!boxHit(L, b)) return [b.x, b.y];
  }
  return [x, y];
}

// ---------- Entidades ----------
function spawnEnts(L) {
  S.ents = [];
  for (const d of L.ents) {
    const cx = (d.tx + .5) * T, fy = (d.ty + 1) * T - 8;
    switch (d.type) {
      case 'slime': S.ents.push({ type: 'slime', x: cx, y: fy, hw: 11, hh: 9, bh: 14, rad: 18, vx: 0, vy: 0, hp: 2, hop: rnd(.2, 1), hopT: 0, flash: 0 }); break;
      case 'flyer': S.ents.push({ type: 'flyer', x: cx, y: fy, hw: 9, hh: 7, bh: 30, rad: 15, vx: 0, vy: 0, hp: 1, t: rnd(0, 6), flash: 0, hx: cx, hy: fy, z: 30 }); break;
      case 'dia': S.ents.push({ type: 'dia', x: cx, y: (d.ty + .5) * T, t: rnd(0, 6) }); break;
      case 'key': S.ents.push({ type: 'key', k: d.k, x: cx, y: (d.ty + .5) * T, t: rnd(0, 6) }); break;
      case 'heart': S.ents.push({ type: 'heart', x: cx, y: (d.ty + .5) * T, t: rnd(0, 6) }); break;
      case 'npc': S.ents.push({ type: 'npc', id: d.id, x: cx, y: fy, hw: 10, hh: 10, face: 0, vx: 0, vy: 0, corrupt: false }); break;
      case 'citizen': S.ents.push({ type: 'citizen', id: 'citizen' + d.seed, seed: d.seed, x: cx, y: fy, hw: 10, hh: 10, face: 0, vx: 0, vy: 0, wt: rnd(0, 3), hx: cx, hy: fy }); break;
      case 'dummy': S.ents.push({ type: 'dummy', x: cx, y: fy, hw: 10, hh: 10, bh: 24, rad: 20, hit: 0 }); break;
    }
  }
}
const ebody = e => ({ x: e.x, y: e.y - (e.bh || 20) });
function hurtPlayer(n, fx, fy) {
  if (P.inv > 0 || P.dead || S.busy) return;
  P.hp -= n; P.inv = 1.15;
  const a = Math.atan2(P.y - fy, P.x - fx); P.vx = Math.cos(a) * 300; P.vy = Math.sin(a) * 300;
  S.shake = .25; S.hitstop = .07; sfx.hurt();
  spawnP(P.x, P.y - 20, 12, '#ff4a5a', 220);
  if (P.hp <= 0) killPlayer();
}
function healPlayer() { P.hp = P.maxHp; sfx.heal(); spawnP(P.x, P.y - 30, 18, '#ff7aa8', 160, .9); floater(P.x - 20, P.y - 60, '¡Pastel! ♥', '#ff9ac0'); }

function hitEnt(e) {
  sfx.hit();
  if (e.type === 'dummy') { e.hit = .3; floater(e.x - 20, e.y - 70, ['¡Auch!', '¡Oye!', '¡Pum!', '¿Por qué?'][Math.floor(rnd(0, 4))], '#ffe14a'); spawnP(e.x, e.y - 24, 8, '#c9a15a'); return; }
  e.hp--; e.flash = .14;
  const a = Math.atan2(e.y - P.y, e.x - P.x); e.vx = Math.cos(a) * 300; e.vy = Math.sin(a) * 300;
  const c = ebody(e);
  spawnP(c.x, c.y, 10, e.type === 'slime' ? '#7dff8a' : '#c26aff', 200);
  if (e.hp <= 0) {
    e.dead = true; spawnP(c.x, c.y, 20, '#fff', 260); sfx.poof();
    if (Math.random() < .28) S.ents.push({ type: 'heart', x: e.x, y: e.y - 10, t: 0 });
  }
}
function updateEnt(e, dt) {
  const L = S.lvl, pb = pbody();
  if (e.flash > 0) e.flash -= dt;
  if (e.type === 'slime') {
    e.hop -= dt;
    const d = dist(P.x, P.y, e.x, e.y);
    if (e.hop <= 0) {
      e.hop = rnd(.6, 1.1);
      if (d < 340) { const a = Math.atan2(P.y - e.y, P.x - e.x); e.vx = Math.cos(a) * (e.corrupt ? 290 : 235); e.vy = Math.sin(a) * (e.corrupt ? 290 : 235); }
      else { const a = rnd(0, 6.28); e.vx = Math.cos(a) * 130; e.vy = Math.sin(a) * 130; }
      e.hopT = .35; if (d < 420) sfx.squish();
    }
    const f = Math.exp(-dt * (e.hopT > 0 ? 1.5 : 9)); e.vx *= f; e.vy *= f; e.hopT -= dt;
    moveBody(L, e, dt);
    const c = ebody(e);
    if (!e.dead && dist(c.x, c.y, pb.x, pb.y) < 26) hurtPlayer(1, e.x, e.y);
  } else if (e.type === 'flyer') {
    e.t += dt;
    const near = dist(P.x, P.y, e.x, e.y) < 300;
    let tx = near ? P.x + Math.cos(e.t * 2.2) * 70 : e.hx + Math.cos(e.t) * 40, ty = near ? P.y + Math.sin(e.t * 2.2) * 50 : e.hy + Math.sin(e.t * 1.3) * 30;
    const a = Math.atan2(ty - e.y, tx - e.x), sp = near ? 150 : 60;
    e.vx = approach(e.vx, Math.cos(a) * sp, 500 * dt); e.vy = approach(e.vy, Math.sin(a) * sp, 500 * dt);
    moveBody(L, e, dt);
    const c = { x: e.x, y: e.y - e.z - Math.sin(e.t * 5) * 3 };
    if (dist(c.x, c.y, pb.x, pb.y) < 24) hurtPlayer(1, e.x, e.y);
  } else if (e.type === 'npc' || e.type === 'citizen') {
    e.t = (e.t || 0) + dt;
    if (e.goto) {
      const dx = e.goto.x - e.x, dy = e.goto.y - e.y, d = Math.hypot(dx, dy);
      if (d < 8) { e.vx = e.vy = 0; const f = e.goto.done; e.goto = null; if (f) f(); }
      else { e.vx = dx / d * e.goto.speed; e.vy = dy / d * e.goto.speed; e.face = Math.atan2(dx, dy); }
      moveBody(L, e, dt);
    } else if (e.type === 'citizen' && !S.wave) {
      e.wt -= dt;
      if (e.wt <= 0) { e.wt = rnd(1.5, 4); if (Math.random() < .6) { const a = rnd(0, 6.28), s = rnd(40, 70); e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s; } else e.vx = e.vy = 0; }
      if (dist(e.x, e.y, e.hx, e.hy) > 160) { const a = Math.atan2(e.hy - e.y, e.hx - e.x); e.vx = Math.cos(a) * 55; e.vy = Math.sin(a) * 55; }
      moveBody(L, e, dt); if (e.hitWall) { e.vx = -e.vx; e.vy = -e.vy; }
      if (Math.hypot(e.vx, e.vy) > 10) e.face = Math.atan2(e.vx, e.vy);
    } else {
      const dx = P.x - e.x, dy = P.y - e.y; if (Math.hypot(dx, dy) < 220) e.face = Math.atan2(dx, dy);
    }
  } else if (e.type === 'exe3d') {
    e.t = (e.t || 0) + dt;
  } else if (e.type === 'key') {
    e.t += dt;
    if (dist(e.x, e.y, pb.x, pb.y) < 30) {
      e.dead = true; S.keys[e.k]++; sfx.key(); S.shake = .08; spawnP(e.x, e.y, 22, ['#e0a060', '#dfe6ff', '#ffe14a'][e.k], 280, .8);
      floater(e.x - 60, e.y - 40, '¡Llave de ' + KEYNAMES[e.k] + '!', ['#ffc080', '#dfe6ff', '#ffe14a'][e.k]); showHint('Conseguiste la llave de ' + KEYNAMES[e.k] + '. Busca su puerta.', 3.5);
    }
  } else if (e.type === 'dia' || e.type === 'heart') {
    e.t += dt;
    if (dist(e.x, e.y, pb.x, pb.y) < 30) {
      if (e.type === 'dia') {
        e.dead = true; S.dia++; sfx.dia(); S.shake = .08;
        spawnP(e.x, e.y, 22, '#7df3ff', 280, .8);
        floater(e.x - 50, e.y - 40, '+1 DIAMANTE  ' + S.dia + '/' + S.lvl.diaNeed, '#7df3ff');
        if (S.dia >= S.lvl.diaNeed && S.lvlId === 1) showHint('¡Tienes los 3 diamantes! Ve a la puerta del salón →', 3.5);
      } else if (P.hp < P.maxHp) { e.dead = true; P.hp++; sfx.heal(); floater(e.x, e.y - 30, '♥', '#ff7aa8'); }
    }
  } else if (e.type === 'dummy') { e.hit = Math.max(0, e.hit - dt); }
}

// ---------- Jugador ----------
function doAttack() {
  const p = P, L = S.lvl, reach = 34, R = 46;
  const cx = p.x + p.adx * reach, cy = p.y - 22 + p.ady * reach;
  let any = false;
  for (const e of S.ents) {
    if (e.dead || !(e.type === 'slime' || e.type === 'flyer' || e.type === 'dummy') || p.hitSet.has(e)) continue;
    const c = e.type === 'flyer' ? { x: e.x, y: e.y - e.z } : ebody(e);
    if (dist(cx, cy, c.x, c.y) < R + e.rad) { p.hitSet.add(e); hitEnt(e); any = true; }
  }
  const b = S.boss;
  if (b && !b.dead && b.state !== 'saved' && b.state !== 'idle' && !p.hitSet.has(b)) {
    if (dist(cx, cy, b.x, b.y - 46) < R + 48) { p.hitSet.add(b); hitBoss(); any = true; }
  }
  const tx0 = Math.floor((cx - R) / T), tx1 = Math.floor((cx + R) / T), ty0 = Math.floor((cy - R) / T), ty1 = Math.floor((cy + R) / T);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (L.get(tx, ty) !== 'C') continue;
    const mx = (tx + .5) * T, my = (ty + .5) * T;
    if (dist(cx, cy, mx, my) > R + 22) continue;
    const key = tx + ',' + ty; if (p.hitSet.has(key)) continue;
    p.hitSet.add(key); L.hp[key] = (L.hp[key] == null ? 3 : L.hp[key]) - 1; any = true; sfx.hit();
    spawnP(mx, my, 10, '#9a9aa6', 200);
    if (L.hp[key] <= 0) { L.set(tx, ty, ','); spawnP(mx, my, 24, '#bfbfca', 300, .9); S.shake = .15; floater(mx - 30, my - 40, '¡Crack!', '#fff'); }
  }
  if (any) { S.hitstop = .05; p.vx -= p.adx * 60; p.vy -= p.ady * 60; }
}
function updatePlayer(dt) {
  const p = P, L = S.lvl;
  if (p.dead) return;
  p.inv = Math.max(0, p.inv - dt); p.atkCd = Math.max(0, p.atkCd - dt);
  p.anim += dt; p.lowT = (p.lowT || 0) - dt; if (p.hp === 1 && p.lowT <= 0) { p.lowT = 1.4; sfx.low(); }
  const [ix, iy] = getMove(), il = Math.hypot(ix, iy);
  p.moving = il > 0.05;
  if (p.moving && p.atk <= 0) { const nx = ix / il, ny = iy / il; p.dx = nx; p.dy = ny; if (Math.abs(nx) > .3) p.face = sign(nx); }
  const sp = (p.atk > .12 ? SPEED * .6 : SPEED), acc = 5200 * dt;
  p.vx = approach(p.vx, ix * sp, acc); p.vy = approach(p.vy, iy * sp, acc);
  if (wasPressed(K.atk) && p.atkCd <= 0) {
    p.atk = .26; p.atkCd = .3; p.hitSet = new Set(); sfx.swing();
    p.adx = p.dx; p.ady = p.dy; if (p.adx === 0 && p.ady === 0) p.ady = 1;
    if (Math.abs(p.adx) > .3) p.face = sign(p.adx);
  }
  if (p.atk > 0) { p.atk -= dt; if (p.atk < .2 && p.atk > .08) doAttack(); }
  moveBody(L, p, dt);
  S.stepT -= dt;
  if (p.moving && S.stepT <= 0) { S.stepT = .24; sfx.step(); S.particles.push({ x: p.x + rnd(-4, 4), y: p.y - 1, vx: rnd(-10, 10), vy: rnd(-10, 10), life: .35, max: .35, color: S.lvl.theme === 'dream' ? '#9a8cf0' : '#cfa86a', size: 4 }); }
  // revelar minimapa
  if (L.seen) {
    const cx = Math.floor(p.x / T), cy = Math.floor(p.y / T);
    for (let y = cy - 9; y <= cy + 9; y++) for (let x = cx - 9; x <= cx + 9; x++) if (x >= 0 && y >= 0 && x < L.w && y < L.h && (x - cx) * (x - cx) + (y - cy) * (y - cy) <= 81) L.seen[y * L.w + x] = 1;
  }
}
async function killPlayer() {
  if (P.dead) return; P.dead = true; S.deaths++; S.busy = true;
  spawnP(P.x, P.y - 24, 28, '#ffe14a', 300, 1);
  await wait(.9); await fadeTo(1, .45);
  respawn();
  await fadeTo(0, .45); S.busy = false;
  showHint('¡Aquela te dio ánimos! ¡Otra vez!', 2.5);
}
function respawn() {
  P.hp = P.maxHp; P.dead = false; P.inv = 1; P.vx = P.vy = 0;
  P.x = S.checkpoint[0]; P.y = S.checkpoint[1];
  S.proj = []; S.warns = [];
  if (S.bossStarted && S.boss && !S.boss.dead && S.boss.state !== 'saved') { S.boss = makeBoss(); S.boss.state = 'walk'; S.boss.t = 1.2; }
  initWilly(); updateCamera(0, true);
}

// ---------- Willy Perro ----------
function initWilly() { S.willy = { x: P.x - 30, y: P.y + 10, hw: 9, hh: 8, vx: 0, vy: 0, face: 1, anim: 0, barkT: 1, moving: false }; }
function updateWilly(dt) {
  const w = S.willy, L = S.lvl; if (!w) return;
  w.anim += dt; w.barkT -= dt;
  const tx = P.x - P.dx * 54 - P.dy * 16, ty = P.y - P.dy * 54 + P.dx * 16 + 6;
  const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
  if (d > 520 || boxHit(L, w)) { const fs = freeSpot(L, P.x - P.dx * 40, P.y - P.dy * 40 + 4, 9, 8); w.x = fs[0]; w.y = fs[1]; w.vx = w.vy = 0; }
  const sp = d > 22 ? clamp(d * 3.2, 40, 235) : 0;
  w.vx = approach(w.vx, d > 0 ? dx / d * sp : 0, 2000 * dt); w.vy = approach(w.vy, d > 0 ? dy / d * sp : 0, 2000 * dt);
  moveBody(L, w, dt);
  w.moving = Math.hypot(w.vx, w.vy) > 25; if (Math.abs(w.vx) > 10) w.face = sign(w.vx);
  if (w.barkT <= 0) {
    for (const e of S.ents) if (e.type === 'dia' && !e.dead && dist(e.x, e.y, w.x, w.y) < 300) {
      w.barkT = 3.5; sfx.bark(); floater(w.x - 20, w.y - 50, '¡GUAU!', '#ffe14a'); break;
    }
  }
}

// ---------- Jefe: Timba corrupto ----------
function makeBoss() {
  const A = S.lvl.arena;
  return {
    x: A.spawn[0], y: A.spawn[1], hw: 26, hh: 18, vx: 0, vy: 0, hp: BOSS_HP, max: BOSS_HP, state: 'idle', t: 0,
    face: -1, flash: 0, phase: 1, count: 0, anim: 0, dead: false, fired: false, rain: 0, zzz: 0, lift: 0, ox: 0, oy: 0, tx: 0, ty: 0, hitWall: false
  };
}
function hitBoss() {
  const b = S.boss; if (!b || b.dead) return;
  let d = 1; const sleeping = b.state === 'sleep';
  if (sleeping) { d = 2; floater(b.x - 10, b.y - 120, '¡x2!', '#7df3ff'); }
  b.hp -= d; b.flash = .14; sfx.hit(); S.shake = .1;
  spawnP(b.x, b.y - 50, 12, '#fff', 260);
  if (b.hp <= 0) { b.hp = 0; defeatBoss(); return; }
  if (b.phase === 1 && b.hp <= b.max / 2) {
    b.phase = 2; b.state = 'rain'; b.t = 4; b.rain = 0; b.vx = b.vy = 0; b.lift = 0; sfx.boss(); S.warns = [];
    floater(b.x - 80, b.y - 130, '¡YA NO TENGO SUEÑO!', '#ff4a5a'); S.shake = .3;
  }
}
function defeatBoss() {
  const b = S.boss; b.state = 'saved'; b.vx = b.vy = 0; b.lift = 0; b.flash = 0; S.proj = []; S.warns = []; S.bossDefeated = true;
  S.shake = .4; sfx.boss(); spawnP(b.x, b.y - 50, 36, '#ff4a5a', 340, 1);
  csTimbaSaved();
}
function bossImpact(x, y, r) {
  sfx.slam(); S.shake = .35; spawnP(x, y, 22, '#d0c0ff', 300);
  const pb = pbody(); if (dist(P.x, P.y, x, y) < r) hurtPlayer(1, x, y);
  if (S.boss && S.boss.phase === 2) S.proj.push({ type: 'ring', x, y, r: r * .5, max: 240, speed: 150 });
}
function updateBoss(dt) {
  const b = S.boss; if (!b || b.dead) return;
  const L = S.lvl, A = L.arena;
  b.anim += dt; b.flash = Math.max(0, b.flash - dt);
  const dx = P.x - b.x, dy = P.y - b.y, d = Math.hypot(dx, dy) || 1, spd = b.phase === 2 ? 125 : 86;
  switch (b.state) {
    case 'idle': case 'saved': b.vx = b.vy = 0; break;
    case 'walk':
      b.face = sign(dx) || b.face; b.t -= dt;
      if (d > 80) { b.vx = dx / d * spd; b.vy = dy / d * spd; } else { b.vx = b.vy = 0; }
      if (b.t <= 0) {
        b.vx = b.vy = 0; b.count++;
        if (b.count % 3 === 0) { b.state = 'sleep'; b.t = 3.4; floater(b.x - 60, b.y - 130, '¡Me dio sueñito...!', '#9ad0ff'); }
        else {
          const r = Math.random();
          if (b.phase === 2 && r < .3) { b.state = 'rain'; b.t = 4; b.rain = 0; floater(b.x - 70, b.y - 130, '¡CONTANDO OVEJAS!', '#fff'); }
          else if (r < .6) { b.state = 'throw'; b.t = .75; b.fired = false; floater(b.x - 50, b.y - 130, '¡ALMOHADAZO!', '#fff'); }
          else {
            b.state = 'slam'; b.t = 1.1; b.ox = b.x; b.oy = b.y; b.tx = P.x; b.ty = P.y;
            S.warns.push({ x: b.tx, y: b.ty, r: 70, t: 0, dur: 1.1, kind: 'slam' }); sfx.warn(); floater(b.x - 40, b.y - 130, '¡Siesta-azo!', '#fff');
          }
        }
      }
      break;
    case 'throw':
      b.vx = b.vy = 0; b.t -= dt; b.face = sign(dx) || b.face;
      if (b.t <= .3 && !b.fired) {
        b.fired = true; const n = b.phase === 2 ? 3 : 1, a0 = Math.atan2(dy, dx);
        for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .32; S.proj.push({ type: 'pillow', x: b.x, y: b.y, z: 50, vx: Math.cos(a) * 270, vy: Math.sin(a) * 270, rot: 0, life: 3 }); }
        sfx.whoosh();
      }
      if (b.t <= -.4) { b.state = 'walk'; b.t = rnd(1.1, 1.8); }
      break;
    case 'slam': {
      b.vx = b.vy = 0; b.t -= dt;
      const pr = clamp(1 - b.t / 1.1, 0, 1), e = clamp((pr - .3) / .7, 0, 1);
      b.lift = e > 0 ? Math.sin(e * Math.PI) * 90 : 0;
      b.x = lerp(b.ox, b.tx, e); b.y = lerp(b.oy, b.ty, e);
      if (b.t <= 0) {
        b.lift = 0; const fs = freeSpot(L, b.tx, b.ty, b.hw, b.hh); b.x = fs[0]; b.y = fs[1];
        bossImpact(b.tx, b.ty, 70); b.state = 'recover'; b.t = .8;
      }
      break;
    }
    case 'recover': b.vx = b.vy = 0; b.t -= dt; if (b.t <= 0) { b.state = 'walk'; b.t = rnd(1.0, 1.6); } break;
    case 'rain':
      b.vx = b.vy = 0; b.t -= dt; b.rain -= dt;
      if (b.rain <= 0) {
        b.rain = b.phase === 2 ? .5 : .75;
        const near = Math.random() < .55, x = near ? P.x + rnd(-60, 60) : rnd(A.x0 + 60, A.x1 - 60), y = near ? P.y + rnd(-60, 60) : rnd(A.y0 + 60, A.y1 - 40);
        S.warns.push({ x, y, r: 48, t: 0, dur: .95, kind: 'sheep' }); sfx.warn();
      }
      if (b.t <= 0) { b.state = 'walk'; b.t = rnd(1, 1.6); }
      break;
    case 'sleep':
      b.vx = b.vy = 0; b.t -= dt; b.zzz -= dt;
      if (b.zzz <= 0) { b.zzz = .6; floater(b.x + 20, b.y - 120, 'Z', '#9ad0ff'); }
      if (b.t <= 0) { b.state = 'walk'; b.t = rnd(1.2, 1.8); floater(b.x - 20, b.y - 130, '¡¿Qué?!', '#fff'); }
      break;
  }
  if (b.state !== 'slam') moveBody(L, b, dt);
  if (b.state !== 'idle' && b.state !== 'saved' && b.state !== 'slam' && dist(P.x, P.y, b.x, b.y) < 44) hurtPlayer(1, b.x, b.y);
}
function updateProj(dt) {
  const L = S.lvl;
  for (let i = S.warns.length - 1; i >= 0; i--) {
    const w = S.warns[i]; w.t += dt;
    if (w.t >= w.dur) {
      S.warns.splice(i, 1);
      if (w.kind === 'sheep') {
        sfx.pop(); S.shake = Math.max(S.shake, .12); spawnP(w.x, w.y, 16, '#fff', 240);
        if (dist(P.x, P.y, w.x, w.y) < w.r) hurtPlayer(1, w.x, w.y);
      }
    }
  }
  for (let i = S.proj.length - 1; i >= 0; i--) {
    const q = S.proj[i];
    if (q.type === 'pillow') {
      q.x += q.vx * dt; q.y += q.vy * dt; q.rot += dt * 9; q.life -= dt;
      if (q.life <= 0 || solidCh(L.get(Math.floor(q.x / T), Math.floor(q.y / T)))) { spawnP(q.x, q.y - q.z, 10, '#fff', 160); S.proj.splice(i, 1); continue; }
      const pb = pbody(); if (dist(q.x, q.y - q.z + 14, pb.x, pb.y) < 24) { hurtPlayer(1, q.x, q.y); spawnP(q.x, q.y - q.z, 8, '#fff', 160); S.proj.splice(i, 1); }
    } else if (q.type === 'ring') {
      q.r += q.speed * dt; if (q.r > q.max) { S.proj.splice(i, 1); continue; }
      if (Math.abs(dist(P.x, P.y, q.x, q.y) - q.r) < 16) hurtPlayer(1, q.x, q.y);
    }
  }
}

// ---------- Cámara / niveles / disparadores ----------
function npcNeedsLetter(e) { return S.lvlId === 0 && S.q.gotLetters && e.type === 'npc' && !e.tag && LETTER_TO[e.id] && !S.q.delivered[e.id]; }
const LETTER_TO = { timba: 1, rius: 1, mayo: 1, esparta: 1, raptor: 1, invictor: 1, acenix: 1 };
function questTarget() {
  if (S.lvlId !== 0) return null; const q = S.q;
  if (!q.gotLetters) return S.ents.find(e => e.id === 'ambrosio') || null;
  if (!q.done) { let best = null, bd = 1e9; for (const e of S.ents) if (npcNeedsLetter(e)) { const d = dist(e.x, e.y, P.x, P.y); if (d < bd) { bd = d; best = e; } } return best; }
  if (!q.trainStarted) { const s = S.lvl.station; return { x: (s.x0 + s.x1) / 2 * T, y: 40 * T }; }
  return null;
}
function updateCamera(dt, snap) {
  const L = S.lvl; let tx, ty;
  if (S.bossLock) { tx = (L.arena.x0 + L.arena.x1) / 2 - W / 2; ty = (L.arena.y0 + L.arena.y1) / 2 - H / 2; }
  else { tx = P.x - W / 2 + P.dx * 30; ty = P.y - H / 2 - 10 + P.dy * 20; }
  tx = L.w * T <= W ? (L.w * T - W) / 2 : clamp(tx, 0, L.w * T - W);
  ty = L.h * T <= H ? (L.h * T - H) / 2 : clamp(ty, 0, L.h * T - H);
  if (snap) { S.cam.x = tx; S.cam.y = ty; }
  else { S.cam.x = lerp(S.cam.x, tx, 1 - Math.exp(-dt * 6)); S.cam.y = lerp(S.cam.y, ty, 1 - Math.exp(-dt * 6)); }
}
function loadLevel(id) {
  S.lvlId = id; const L = S.lvl = LEVELS[id](); { const v = verifyLevel(L); if (!v.ok) console.warn('Nivel imposible:', v.missing.join(' ')); }
  spawnEnts(L); S.proj = []; S.warns = []; S.particles = []; S.floaters = []; L.seen = new Uint8Array(L.w * L.h); minimapReset();
  S.keys = [0, 0, 0]; S.dia = 0; S.boss = null; S.bossLock = false; S.bossStarted = false; S.gateOpen = false; S.hint = ''; S.hintT = 0; S.bossDefeated = false;
  P.x = (L.start[0] + .5) * T; P.y = (L.start[1] + 1) * T - 8;
  P.vx = P.vy = 0; P.hp = P.maxHp; P.inv = 0; P.dead = false; P.dx = 0; P.dy = 1; P.face = 1; P.atk = 0;
  S.checkpoint = [P.x, P.y]; initWilly(); updateCamera(0, true);
  setMusic(L.theme === 'dream' ? 'dream' : 'city'); setAmbient(L.theme === 'dream' ? 'dream' : 'day');
}
function openDoorGroup(x, y, c) {
  const L = S.lvl, st = [[x, y]], seen = new Set();
  while (st.length) { const [a, b] = st.pop(), k = a + ',' + b; if (seen.has(k) || L.get(a, b) !== c) continue; seen.add(k); L.set(a, b, ','); spawnP((a + .5) * T, (b + .5) * T, 14, '#ffe14a', 240, .8); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) st.push([a + dx, b + dy]); }
  sfx.unlock(); S.shake = .2;
}
function tryDoors() {
  const L = S.lvl, tx = Math.floor(P.x / T), ty = Math.floor((P.y - 8) / T);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = tx + dx, y = ty + dy, c = L.get(x, y), k = DOORKEY[c]; if (k === undefined) continue;
    if (dist(P.x, P.y - 12, (x + .5) * T, (y + .5) * T) > T * 1.15) continue;
    if (S.keys[k] > 0) { S.keys[k]--; openDoorGroup(x, y, c); showHint('¡Abriste la puerta de ' + KEYNAMES[k] + '!', 2.5); }
    else showHint('Puerta de ' + KEYNAMES[k] + ': necesitas la llave de ' + KEYNAMES[k], 1.2);
    return;
  }
}
function openGate() {
  const L = S.lvl, g = L.gate; S.gateOpen = true;
  for (const [x, y] of g.tiles) L.set(x, y, 'a');
  sfx.door(); S.shake = .25; spawnP(g.x + 24, g.y + 72, 36, '#7df3ff', 320, 1);
  showHint('¡La puerta se abrió! Adelante... pero con cuidado.', 3);
}
function spawnCorrupt(x, y, type) {
  const base = type === 'flyer' ? { type: 'flyer', x, y, hw: 9, hh: 7, bh: 30, rad: 15, vx: 0, vy: 0, hp: 1, t: rnd(0, 6), flash: 0, hx: x, hy: y, z: 30 } : { type: 'slime', x, y, hw: 11, hh: 9, bh: 14, rad: 18, vx: 0, vy: 0, hp: 2, hop: rnd(.1, .5), hopT: 0, flash: 0 };
  base.corrupt = true; base.born = .4; S.ents.push(base); spawnP(x, y - 10, 12, '#ff4a8a', 200, .6); sfx.pop();
}
function startWave(n) {
  const L = S.lvl, total = [0, 7, 9, 12][n], spots = L.trainDoors;
  S.wave = { n, total, spawned: 0, t: .5, done: false };
  showHint('¡Oleada ' + n + ' de 3!  Defiéndete de los slimes corrompidos', 4); sfx.boss();
}
function updateWave(dt) {
  const w = S.wave; if (!w || w.done || S.busy || S.dialog) return;
  const L = S.lvl, doors = L.trainDoors;
  if (w.spawned < w.total) {
    w.t -= dt;
    if (w.t <= 0) { w.t = Math.max(.45, 1.1 - w.n * .2); const d = doors[w.spawned % doors.length]; spawnCorrupt(d[0], d[1] + rnd(10, 30), (w.spawned % 4 === 3) ? 'flyer' : 'slime'); w.spawned++; }
  } else if (!S.ents.some(e => e.corrupt && !e.dead)) {
    w.done = true; if (w.n < 3) { const k = w.n + 1; setTimeout(() => { if (S.wave && S.wave.done) startWave(k); }, 1800); showHint('¡Oleada superada!', 2); sfx.win(); } else csTrainEnd();
  }
}
function checkTriggers() {
  const L = S.lvl, pb = pbody();
  if (L.exit && pb.x > L.exit.x && pb.x < L.exit.x + L.exit.w && pb.y > L.exit.y && pb.y < L.exit.y + L.exit.h && !S.leaving) { S.leaving = true; goNext(); }
  if (L.station && S.q.done && !S.q.trainStarted && P.x / T > L.station.x0 && P.x / T < L.station.x1 && P.y / T > L.station.y0 && P.y / T < L.station.y1) { S.q.trainStarted = true; csTrain(); }
  if (L.gate && !L.gate.station && !S.gateOpen && dist(P.x, P.y, L.gate.x + T / 2, L.gate.y + 1.5 * T) < 130) {
    if (S.dia >= L.diaNeed) openGate(); else showHint('La puerta del jefe necesita 3 diamantes  (' + S.dia + '/3)', .3);
  }
  tryDoors();
  if (L.arena && S.gateOpen && !S.bossStarted && (L.arena.dir < 0 ? P.x < L.arena.trigger : P.x > L.arena.trigger)) startBoss();
}
function nearestNpc() {
  let best = null, bd = 78;
  for (const e of S.ents) if ((e.type === 'npc' || e.type === 'citizen') && !e.hidden && !e.goto) { const d = dist(e.x, e.y, P.x, P.y); if (d < bd) { bd = d; best = e; } }
  return best;
}

// ---------- Actualización general ----------
let touchShown = null, menuBtnShown = null;
function updateTouchUI() {
  const show = S.mode === 'play' && !S.stage && !MENU.open && !S.dialog, mb = S.mode === 'play' && !MENU.open;
  if (show !== touchShown) { touchShown = show; const t = document.getElementById('touch'); if (t) t.classList.toggle('hide', !show); }
  if (mb !== menuBtnShown) { menuBtnShown = mb; const b = document.getElementById('btnMenu'); if (b) b.classList.toggle('hide', !mb); }
}
function update(dt) {
  updateTouchUI();
  if (MENU.open) { S.t += dt; } else { S.t += dt; updateTimers(dt); updateFade(dt); }
  S.shake = Math.max(0, S.shake - dt); S.hintT = Math.max(0, S.hintT - dt);
  if (S.skip && !S.busy && !S.stage && !S.dialog) S.skip = false;
  if (S.mode === 'title') { updateMenu(dt); return; }
  if (!MENU.open && wasPressed('Escape', 'KeyP') && !(S.stage && S.stage.end)) { openMenu('pause'); delete pressed['Escape']; delete pressed['KeyP']; }
  if (MENU.open) { updateMenu(dt); return; }
  if (PTR.hit && S.dialog && !(S.dialog.choices && S.dialog.shown >= S.dialog.text.length)) { pressed['Enter'] = true; PTR.hit = false; }
  const had = !!S.dialog;
  updateDialog(dt);
  if (S.stage) { updateStage(dt); updateFx(dt); return; }
  if (had || S.dialog || S.busy) { updateFx(dt); if (S.lvl) updateCamera(dt, false); return; }
  if (S.hitstop > 0) { S.hitstop -= dt; return; }
  S.playTime += dt;
  updatePlayer(dt);
  updateWilly(dt);
  for (const e of S.ents) updateEnt(e, dt);
  S.ents = S.ents.filter(e => !e.dead);
  updateBoss(dt); updateProj(dt); updateWave(dt); updateFx(dt);
  S.nearNpc = nearestNpc();
  if (S.nearNpc && wasPressed(K.talk)) talkNpc(S.nearNpc);
  checkTriggers();
  updateCamera(dt, false);
}
