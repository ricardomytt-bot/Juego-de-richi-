'use strict';
// ===== Lógica: estado, física, combate, enemigos, jefe =====
const SPEED = 185, JUMP_V = 565, GRAV_UP = 1450, GRAV_DN = 1950, MAXFALL = 900, DASH_V = 580, BOUNCE_V = 920;
const BOSS_HP = 16;
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
  mode: 'title', lvl: null, lvlId: 0, ents: [], proj: [], particles: [], floaters: [], stage: null, dialog: null,
  timers: [], busy: false, skip: false, t: 0, dia: 0, hasDash: false, deaths: 0, playTime: 0,
  fade: 0, fadeAnim: null, shake: 0, hitstop: 0, cam: { x: 0, y: 0 }, boss: null, bossLock: false,
  bossStarted: false, gateOpen: false, gotLetter: false, checkpoint: [0, 0], hint: '', hintT: 0, willy: null,
  leaving: false, nearNpc: null, bossDefeated: false
};
const P = {
  x: 0, y: 0, w: 22, h: 40, vx: 0, vy: 0, face: 1, onGround: false, hp: 5, maxHp: 5, inv: 0, coyote: 0, jumpBuf: 0,
  atk: 0, atkCd: 0, atkDir: 'f', hitSet: new Set(), dash: 0, dashCd: 0, drop: 0, anim: 0, dead: false, safe: [0, 0],
  standCloud: false, hitWall: false
};

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
function updateDialog(dt) {
  const d = S.dialog; if (!d) return;
  if (S.skip) { S.dialog = null; d.res(); return; }
  const before = Math.floor(d.shown);
  d.shown = Math.min(d.text.length, d.shown + dt * 48);
  if (Math.floor(d.shown) !== before && Math.floor(d.shown) % 2 === 0 && d.who !== 'narr') sfx.blip();
  if (wasPressed(K.ok)) {
    if (d.shown < d.text.length) d.shown = d.text.length;
    else { S.dialog = null; d.res(); }
  }
}
function showHint(t, sec) { S.hint = t; S.hintT = Math.max(S.hintT, sec); }

// ---------- Efectos ----------
function spawnP(x, y, n, color, spd = 160, life = .5, size = 4) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(.3, 1) * spd;
    S.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rnd(.5, 1) * life, max: life, color, size });
  }
}
function floater(x, y, text, color = '#fff') { S.floaters.push({ x, y, text, color, t: 0 }); }
function updateFx(dt) {
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i]; p.life -= dt; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0) S.particles.splice(i, 1);
  }
  for (let i = S.floaters.length - 1; i >= 0; i--) {
    const f = S.floaters[i]; f.t += dt; f.y -= 28 * dt; if (f.t > 1.2) S.floaters.splice(i, 1);
  }
}

// ---------- Física ----------
function solidTile(L, x, y) {
  if (x < 0 || x >= L.w) return true;
  if (y < 0 || y >= L.h) return false;
  return SOLID.includes(L.g[y][x]);
}
function moveBody(L, b, dt) {
  b.hitWall = false; b.onGround = false;
  let landed = null, impact = 0;
  b.x += b.vx * dt;
  let x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - .01) / T), y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - .01) / T);
  outerX: for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (solidTile(L, tx, ty)) {
      if (b.vx > 0) b.x = tx * T - b.w; else if (b.vx < 0) b.x = (tx + 1) * T;
      b.vx = 0; b.hitWall = true; break outerX;
    }
  }
  const pb = b.y + b.h;
  b.y += b.vy * dt;
  x0 = Math.floor(b.x / T); x1 = Math.floor((b.x + b.w - .01) / T); y0 = Math.floor(b.y / T); y1 = Math.floor((b.y + b.h - .01) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const ch = L.get(tx, ty);
    if (solidTile(L, tx, ty)) {
      if (b.vy > 0) { b.y = ty * T - b.h; landed = ch; impact = b.vy; b.onGround = true; }
      else if (b.vy < 0) b.y = (ty + 1) * T;
      b.vy = 0;
    } else if (ch === '=' && b.vy >= 0 && !(b.drop > 0) && pb <= ty * T + 1) {
      b.y = ty * T - b.h; landed = '='; impact = b.vy; b.vy = 0; b.onGround = true;
    }
  }
  return { landed, impact };
}

// ---------- Entidades ----------
function spawnEnts(L) {
  S.ents = [];
  for (const d of L.ents) {
    const cx = d.tx * T + T / 2, by = (d.ty + 1) * T;
    switch (d.type) {
      case 'slime': S.ents.push({ type: 'slime', x: cx - 14, y: by - 24, w: 28, h: 24, vx: 0, vy: 0, hp: 2, dir: -1, hop: rnd(.3, 1), flash: 0 }); break;
      case 'flyer': S.ents.push({ type: 'flyer', x: cx - 13, y: d.ty * T, w: 26, h: 22, vx: 0, vy: 0, hp: 1, hx: cx, hy: d.ty * T, t: rnd(0, 6), flash: 0 }); break;
      case 'dia': S.ents.push({ type: 'dia', x: cx - 10, y: (d.ty + .5) * T - 10, w: 20, h: 20, t: rnd(0, 6) }); break;
      case 'heart': S.ents.push({ type: 'heart', x: cx - 10, y: (d.ty + .5) * T - 10, w: 20, h: 20, t: rnd(0, 6) }); break;
      case 'npc': S.ents.push({ type: 'npc', id: d.id, x: cx - 12, y: by - 40, w: 24, h: 40 }); break;
      case 'dummy': S.ents.push({ type: 'dummy', x: cx - 15, y: by - 48, w: 30, h: 48, hit: 0 }); break;
    }
  }
}
function hurtPlayer(n, fromX) {
  if (P.inv > 0 || P.dead || S.busy) return;
  P.hp -= n; P.inv = 1.15; P.dash = 0;
  P.vx = ((P.x + P.w / 2) < fromX ? -1 : 1) * 250; P.vy = -300;
  S.shake = .22; S.hitstop = .07; sfx.hurt();
  spawnP(P.x + P.w / 2, P.y + P.h / 2, 10, '#ff4a5a', 200);
  if (P.hp <= 0) killPlayer();
}
function healPlayer() { P.hp = P.maxHp; sfx.heal(); spawnP(P.x + P.w / 2, P.y + 10, 14, '#ff7aa8', 140, .8); floater(P.x, P.y - 10, '¡Pastel! ♥', '#ff9ac0'); }

function hitEnt(e) {
  sfx.hit();
  const dir = P.face;
  if (e.type === 'dummy') { e.hit = .3; floater(e.x, e.y - 6, ['¡Auch!', '¡Oye!', '¡Pum!', '¿Por qué?'][Math.floor(rnd(0, 4))], '#ffe14a'); spawnP(e.x + 15, e.y + 20, 6, '#c9a15a'); return; }
  e.hp--; e.flash = .12;
  e.vx = dir * 220; e.vy = -220;
  spawnP(e.x + e.w / 2, e.y + e.h / 2, 8, e.type === 'slime' ? '#7dff8a' : '#c26aff');
  if (e.hp <= 0) {
    e.dead = true; spawnP(e.x + e.w / 2, e.y + e.h / 2, 16, '#fff', 220);
    if (Math.random() < .25) S.ents.push({ type: 'heart', x: e.x, y: e.y, w: 20, h: 20, t: 0 });
  }
}
function updateEnt(e, dt) {
  const L = S.lvl, px = P.x + P.w / 2;
  if (e.flash > 0) e.flash -= dt;
  if (e.type === 'slime') {
    e.vy = Math.min(MAXFALL, e.vy + GRAV_DN * dt);
    if (e.onGround) {
      e.vx = approach(e.vx, 0, 900 * dt); e.hop -= dt;
      if (e.hop <= 0) {
        e.hop = rnd(.7, 1.3);
        e.dir = Math.abs(px - e.x) < 280 ? sign(px - (e.x + e.w / 2)) || e.dir : e.dir;
        e.vx = e.dir * 95; e.vy = -300;
      }
    }
    moveBody(L, e, dt);
    if (e.hitWall) e.dir *= -1;
    if (e.y > L.h * T + 50) e.dead = true;
    if (!e.dead && aabb(P, e)) hurtPlayer(1, e.x + e.w / 2);
  } else if (e.type === 'flyer') {
    e.t += dt;
    const near = Math.hypot(px - e.x, P.y - e.y) < 230;
    const tx = near ? px : e.hx, ty = near ? P.y - 10 : e.hy + Math.sin(e.t * 2) * 18;
    e.vx = approach(e.vx, clamp(tx - e.x, -1, 1) * (near ? 85 : 40), 400 * dt);
    e.vy = approach(e.vy, clamp(ty - e.y, -1, 1) * (near ? 70 : 40), 400 * dt);
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (aabb(P, e)) hurtPlayer(1, e.x + e.w / 2);
  } else if (e.type === 'dia' || e.type === 'heart') {
    e.t += dt;
    if (aabb(P, e)) {
      if (e.type === 'dia') {
        e.dead = true; S.dia++; sfx.dia();
        spawnP(e.x + 10, e.y + 10, 14, '#7df3ff', 200, .7);
        floater(e.x - 10, e.y - 6, '+1 DIAMANTE  ' + S.dia + '/' + S.lvl.diaNeed, '#7df3ff');
        if (S.dia >= S.lvl.diaNeed && S.lvlId === 1) showHint('¡Tienes los 3 diamantes! Ve a la puerta del fondo →', 3.5);
      } else if (P.hp < P.maxHp) { e.dead = true; P.hp++; sfx.heal(); floater(e.x, e.y - 6, '♥', '#ff7aa8'); }
    }
  } else if (e.type === 'dummy') { e.hit = Math.max(0, e.hit - dt); }
}

// ---------- Jugador ----------
function atkRect() {
  const p = P, R = 50;
  if (p.atkDir === 'u') return { x: p.x - 14, y: p.y - R + 6, w: p.w + 28, h: R };
  if (p.atkDir === 'd') return { x: p.x - 14, y: p.y + p.h - 6, w: p.w + 28, h: R };
  return { x: p.face > 0 ? p.x + p.w - 4 : p.x - R + 4, y: p.y - 6, w: R, h: p.h + 10 };
}
function doAttack() {
  const r = atkRect(), p = P, L = S.lvl; let any = false;
  for (const e of S.ents) {
    if (e.dead || !(e.type === 'slime' || e.type === 'flyer' || e.type === 'dummy') || p.hitSet.has(e)) continue;
    if (aabb(r, e)) { p.hitSet.add(e); hitEnt(e); any = true; }
  }
  const b = S.boss;
  if (b && !b.dead && b.state !== 'saved' && b.state !== 'idle' && !p.hitSet.has(b) && aabb(r, b)) { p.hitSet.add(b); hitBoss(); any = true; }
  for (let ty = Math.floor(r.y / T); ty <= Math.floor((r.y + r.h) / T); ty++)
    for (let tx = Math.floor(r.x / T); tx <= Math.floor((r.x + r.w) / T); tx++) {
      if (L.get(tx, ty) !== 'C') continue;
      const key = tx + ',' + ty; if (p.hitSet.has(key)) continue;
      p.hitSet.add(key); L.hp[key] = (L.hp[key] == null ? 3 : L.hp[key]) - 1; any = true; sfx.hit();
      spawnP(tx * T + 16, ty * T + 16, 8, '#9a9aa6', 160);
      if (L.hp[key] <= 0) { L.set(tx, ty, '.'); spawnP(tx * T + 16, ty * T + 16, 18, '#bfbfca', 240, .8); S.shake = .12; floater(tx * T, ty * T - 8, '¡Crack!', '#fff'); }
    }
  if (any) {
    S.hitstop = .05;
    if (p.atkDir === 'd' && !p.onGround) { p.vy = -440; p.noCut = true; p.jumpBuf = 0; }
    else if (p.atkDir === 'f') p.vx -= p.face * 70;
  }
}
function updatePlayer(dt) {
  const p = P, L = S.lvl;
  if (p.dead) return;
  p.inv = Math.max(0, p.inv - dt); p.atkCd = Math.max(0, p.atkCd - dt); p.dashCd = Math.max(0, p.dashCd - dt); p.drop = Math.max(0, p.drop - dt);
  p.anim += dt;
  const ax = (isDown(K.right) ? 1 : 0) - (isDown(K.left) ? 1 : 0);
  if (p.dash > 0) { p.dash -= dt; p.vx = p.face * DASH_V; p.vy = 0; if (Math.random() < .6) S.particles.push({ x: p.x + 11, y: p.y + rnd(6, 34), vx: 0, vy: 0, life: .25, max: .25, color: '#bfe9ff', size: 5 }); }
  else {
    if (ax) p.face = ax;
    p.vx = approach(p.vx, ax * SPEED, (p.onGround ? 2800 : 1800) * dt);
    p.vy = Math.min(MAXFALL, p.vy + (p.vy < 0 ? GRAV_UP : GRAV_DN) * dt);
    if (p.vy >= 0) p.noCut = false;
    if (p.vy < 0 && !isDown(K.jump) && !p.noCut) p.vy += 2600 * dt;
    if (wasPressed(K.jump)) p.jumpBuf = .12; else p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    p.coyote = p.onGround ? .1 : Math.max(0, p.coyote - dt);
    if (p.jumpBuf > 0 && p.coyote > 0) {
      if (isDown(K.down) && p.standCloud) { p.drop = .22; p.y += 3; p.coyote = 0; p.jumpBuf = 0; }
      else { p.vy = -JUMP_V; p.jumpBuf = 0; p.coyote = 0; sfx.jump(); spawnP(p.x + 11, p.y + p.h, 4, '#fff', 60, .3, 3); }
    }
  }
  if (S.hasDash && wasPressed(K.dash) && p.dashCd <= 0 && p.dash <= 0) { p.dash = .17; p.dashCd = .5; p.inv = Math.max(p.inv, .25); sfx.dash(); }
  if (wasPressed(K.atk) && p.atkCd <= 0 && p.dash <= 0) {
    p.atk = .22; p.atkCd = .3; p.hitSet = new Set(); sfx.swing();
    p.atkDir = isDown(K.up) ? 'u' : (isDown(K.down) && !p.onGround) ? 'd' : 'f';
  }
  if (p.atk > 0) { p.atk -= dt; if (p.atk < .18 && p.atk > .04) doAttack(); }
  const r = moveBody(L, p, dt);
  p.standCloud = p.onGround && r.landed === '=';
  if (r.landed === 'M' && r.impact > 100) {
    p.vy = -BOUNCE_V; p.noCut = true; sfx.boing(); spawnP(p.x + 11, p.y + p.h, 8, '#ff8fb0', 140);
    L.bounce = L.bounce || {}; L.bounce[Math.floor((p.x + 11) / T) + ',' + Math.floor((p.y + p.h + 4) / T)] = .3;
  }
  if (p.onGround && r.landed && r.landed !== '=') {
    const tl = Math.floor((p.x + 2) / T), tr = Math.floor((p.x + p.w - 2) / T), ty = Math.floor((p.y + p.h + 2) / T);
    if (solidTile(L, tl, ty) && solidTile(L, tr, ty) && L.get(tl, ty) !== 'M' && L.get(tr, ty) !== 'M') p.safe = [p.x, p.y];
  }
  if (p.y > L.h * T + 80) fallRespawn();
}
function fallRespawn() {
  const p = P; p.x = p.safe[0]; p.y = p.safe[1]; p.vx = p.vy = 0;
  sfx.hurt(); P.hp -= 1; P.inv = 1.2; S.shake = .2; floater(p.x, p.y - 20, '¡Ouch!', '#ff4a5a');
  if (P.hp <= 0) killPlayer();
}
async function killPlayer() {
  if (P.dead) return; P.dead = true; S.deaths++; S.busy = true;
  spawnP(P.x + 11, P.y + 20, 24, '#ffe14a', 260, .9);
  await wait(.9); await fadeTo(1, .45);
  respawn();
  await fadeTo(0, .45); S.busy = false;
  if (S.bossStarted && S.boss && !S.boss.dead) showHint('¡Acenix te dio pastel! ¡Otra vez!', 2.5);
  else showHint('¡Acenix te dio pastel! ¡Otra vez!', 2.5);
}
function respawn() {
  P.hp = P.maxHp; P.dead = false; P.inv = 1; P.vx = P.vy = 0; P.dash = 0;
  P.x = S.checkpoint[0]; P.y = S.checkpoint[1];
  S.proj = [];
  if (S.bossStarted && S.boss && !S.boss.dead && S.boss.state !== 'saved') { S.boss = makeBoss(); S.boss.state = 'walk'; S.boss.t = 1.2; }
  initWilly(); updateCamera(0, true);
}

// ---------- Willy Perro ----------
function initWilly() { S.willy = { x: P.x - 30, y: P.y, w: 30, h: 24, vx: 0, vy: 0, face: 1, onGround: false, anim: 0, barkT: 1, hitWall: false }; }
function updateWilly(dt) {
  const w = S.willy, L = S.lvl; if (!w) return;
  w.anim += dt; w.barkT -= dt;
  const tx = P.x + P.w / 2 - P.face * 46, dx = tx - (w.x + w.w / 2);
  const stuck = solidTile(L, Math.floor((w.x + w.w / 2) / T), Math.floor((w.y + w.h / 2) / T));
  if (Math.abs(dx) > 430 || w.y > L.h * T + 50 || stuck) { w.x = P.x - P.face * 30; w.y = P.y - 10; w.vx = 0; w.vy = 0; }
  const want = Math.abs(dx) > 14 ? sign(dx) * clamp(Math.abs(dx) * 3, 60, 215) : 0;
  w.vx = approach(w.vx, want, 1800 * dt); if (Math.abs(w.vx) > 5) w.face = sign(w.vx);
  w.vy = Math.min(MAXFALL, w.vy + GRAV_DN * dt);
  if (w.onGround && ((w.hitWall && want !== 0) || (P.y + P.h < w.y + w.h - 40 && Math.abs(dx) < 90))) w.vy = -560;
  moveBody(L, w, dt);
  if (w.barkT <= 0) {
    for (const e of S.ents) if (e.type === 'dia' && !e.dead && Math.hypot(e.x - w.x, e.y - w.y) < 190) {
      w.barkT = 3.5; sfx.bark(); floater(w.x, w.y - 18, '¡GUAU!', '#ffe14a'); break;
    }
  }
}

// ---------- Jefe: Timba corrupto ----------
function makeBoss() {
  const A = S.lvl.arena;
  return {
    x: A.x1 - T * 6, y: 11 * T - 96, w: 52, h: 96, vx: 0, vy: 0, hp: BOSS_HP, max: BOSS_HP, state: 'idle', t: 0,
    face: -1, flash: 0, phase: 1, count: 0, anim: 0, dead: false, onGround: false, hitWall: false, red: true,
    fired: false, jumped: false, airT: 0, rain: 0, zzz: 0
  };
}
function hitBoss() {
  const b = S.boss; if (!b || b.dead) return;
  let d = 1; const sleeping = b.state === 'sleep';
  if (sleeping) { d = 2; floater(b.x + 10, b.y - 10, '¡x2!', '#7df3ff'); }
  b.hp -= d; b.flash = .14; sfx.hit(); S.shake = .1;
  spawnP(b.x + b.w / 2, b.y + 40, 10, '#fff', 220);
  if (b.hp <= 0) { b.hp = 0; defeatBoss(); return; }
  if (b.phase === 1 && b.hp <= b.max / 2) {
    b.phase = 2; b.state = 'rain'; b.t = 4; b.rain = 0; b.vx = 0; sfx.boss();
    floater(b.x - 30, b.y - 30, '¡YA NO TENGO SUEÑO!', '#ff4a5a'); S.shake = .3;
  }
}
function defeatBoss() {
  const b = S.boss; b.state = 'saved'; b.vx = 0; S.proj = []; S.bossDefeated = true;
  S.shake = .4; sfx.boss(); spawnP(b.x + b.w / 2, b.y + 40, 30, '#ff4a5a', 300, 1);
  csTimbaSaved();
}
function updateBoss(dt) {
  const b = S.boss; if (!b || b.dead) return;
  const L = S.lvl, A = L.arena;
  b.anim += dt; b.flash = Math.max(0, b.flash - dt);
  b.vy = Math.min(MAXFALL, b.vy + 1900 * dt);
  const bx = b.x + b.w / 2, px = P.x + P.w / 2, spd = b.phase === 2 ? 98 : 64;
  switch (b.state) {
    case 'idle': case 'saved': b.vx = 0; break;
    case 'walk':
      b.face = sign(px - bx) || b.face; b.vx = b.face * spd; b.t -= dt;
      if (b.t <= 0) {
        b.vx = 0; b.count++;
        if (b.count % 3 === 0) { b.state = 'sleep'; b.t = 3.4; floater(bx - 30, b.y - 14, '¡Me dio sueñito...!', '#9ad0ff'); }
        else {
          const r = Math.random();
          if (b.phase === 2 && r < .3) { b.state = 'rain'; b.t = 4; b.rain = 0; floater(bx - 40, b.y - 14, '¡CONTANDO OVEJAS!', '#fff'); }
          else if (r < .62) { b.state = 'throw'; b.t = .75; b.fired = false; floater(bx - 30, b.y - 14, '¡ALMOHADAZO!', '#fff'); }
          else { b.state = 'slam'; b.t = .55; b.jumped = false; b.airT = 0; floater(bx - 20, b.y - 14, '¡Siesta-azo!', '#fff'); }
        }
      }
      break;
    case 'throw':
      b.vx = 0; b.t -= dt; b.face = sign(px - bx) || b.face;
      if (b.t <= .3 && !b.fired) {
        b.fired = true; const n = b.phase === 2 ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const dist = Math.abs(px - bx) * (.8 + i * .25);
          S.proj.push({ type: 'pillow', x: bx + b.face * 30, y: b.y + 20, w: 22, h: 14, vx: b.face * clamp(dist, 140, 330), vy: -280 - i * 70, rot: 0 });
        }
        sfx.swing();
      }
      if (b.t <= -.4) { b.state = 'walk'; b.t = rnd(1.1, 1.9); }
      break;
    case 'slam':
      b.vx = 0;
      if (!b.jumped) {
        b.t -= dt; if (b.t <= 0) { b.jumped = true; b.vy = -660; b.vx = sign(px - bx) * 150; b.airT = 0; b.onGround = false; }
      } else {
        b.airT += dt;
        if (b.onGround && b.airT > .2) {
          b.vx = 0; sfx.slam(); S.shake = .35; b.state = 'recover'; b.t = .7;
          const gy = 11 * T;
          S.proj.push({ type: 'wave', x: bx - 12, y: gy - 28, w: 22, h: 28, vx: -240, vy: 0, life: 1.6 });
          S.proj.push({ type: 'wave', x: bx - 10, y: gy - 28, w: 22, h: 28, vx: 240, vy: 0, life: 1.6 });
          spawnP(bx, gy, 14, '#d0c0ff', 220);
        }
      }
      break;
    case 'recover': b.vx = 0; b.t -= dt; if (b.t <= 0) { b.state = 'walk'; b.t = rnd(1.0, 1.7); } break;
    case 'rain':
      b.vx = 0; b.t -= dt; b.rain -= dt;
      if (b.rain <= 0) { b.rain = b.phase === 2 ? .55 : .8; S.proj.push({ type: 'sheep', x: rnd(A.x0 + 40, A.x1 - 60), y: S.cam.y - 30, w: 28, h: 20, vx: 0, vy: 80 }); }
      if (b.t <= 0) { b.state = 'walk'; b.t = rnd(1, 1.6); }
      break;
    case 'sleep':
      b.vx = 0; b.t -= dt; b.zzz -= dt;
      if (b.zzz <= 0) { b.zzz = .6; floater(bx + 10, b.y - 6, 'Z', '#9ad0ff'); }
      if (b.t <= 0) { b.state = 'walk'; b.t = rnd(1.2, 1.8); floater(bx - 10, b.y - 14, '¡¿Qué?!', '#fff'); }
      break;
  }
  moveBody(L, b, dt);
  if (b.state !== 'idle' && b.state !== 'saved' && aabb(P, b)) hurtPlayer(1, bx);
}
function updateProj(dt) {
  const L = S.lvl;
  for (let i = S.proj.length - 1; i >= 0; i--) {
    const q = S.proj[i];
    if (q.type === 'pillow') {
      q.vy += 520 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += dt * 9;
      if (solidTile(L, Math.floor((q.x + q.w / 2) / T), Math.floor((q.y + q.h) / T))) { spawnP(q.x, q.y, 8, '#fff', 120); S.proj.splice(i, 1); continue; }
    } else if (q.type === 'wave') {
      q.x += q.vx * dt; q.life -= dt;
      if (q.life <= 0 || solidTile(L, Math.floor((q.x + (q.vx > 0 ? q.w : 0)) / T), Math.floor((q.y + 10) / T))) { S.proj.splice(i, 1); continue; }
    } else if (q.type === 'sheep') {
      q.vy = Math.min(420, q.vy + 500 * dt); q.y += q.vy * dt;
      if (solidTile(L, Math.floor((q.x + 14) / T), Math.floor((q.y + q.h) / T))) { spawnP(q.x + 14, q.y + 16, 8, '#fff', 140); S.proj.splice(i, 1); continue; }
    }
    if (aabb(P, q)) { hurtPlayer(1, q.x + q.w / 2); }
  }
}

// ---------- Cámara / niveles / disparadores ----------
function updateCamera(dt, snap) {
  const L = S.lvl; let tx, ty;
  if (S.bossLock) tx = (L.arena.x0 + L.arena.x1) / 2 - W / 2; else tx = P.x + P.w / 2 - W / 2 + P.face * 40;
  ty = P.y + P.h / 2 - H / 2 - 20;
  tx = clamp(tx, 0, L.w * T - W); ty = clamp(ty, 0, Math.max(0, L.h * T - H));
  if (snap) { S.cam.x = tx; S.cam.y = ty; }
  else { S.cam.x = lerp(S.cam.x, tx, 1 - Math.exp(-dt * 7)); S.cam.y = lerp(S.cam.y, ty, 1 - Math.exp(-dt * 5)); }
}
function loadLevel(id) {
  S.lvlId = id; const L = S.lvl = LEVELS[id]();
  spawnEnts(L); S.proj = []; S.particles = []; S.floaters = [];
  S.dia = 0; S.boss = null; S.bossLock = false; S.bossStarted = false; S.gateOpen = false; S.hint = ''; S.hintT = 0; S.bossDefeated = false;
  P.x = L.start[0] * T + (T - P.w) / 2; P.y = (L.start[1] + 1) * T - P.h;
  P.vx = P.vy = 0; P.hp = P.maxHp; P.inv = 0; P.dead = false; P.safe = [P.x, P.y]; P.face = 1; P.dash = 0; P.atk = 0;
  S.checkpoint = [P.x, P.y]; initWilly(); updateCamera(0, true);
  setMusic(L.theme === 'dream' ? 'dream' : 'day');
}
function openGate() {
  const L = S.lvl, g = L.gate; S.gateOpen = true;
  L.fill(76, 7, 76, 10, '.'); sfx.door(); S.shake = .25;
  spawnP(g.x + 16, g.y + 64, 30, '#7df3ff', 260, 1);
  showHint('¡La puerta se abrió! Adelante... pero con cuidado.', 3);
}
function checkTriggers() {
  const L = S.lvl;
  if (L.exit && aabb(P, L.exit)) {
    if (S.lvlId === 0 && !S.gotLetter) showHint('Primero habla con Ambrosio (tecla E)', 1.2);
    else if (!S.leaving) { S.leaving = true; goNext(); }
  }
  if (L.gate && !S.gateOpen && Math.abs(P.x + P.w / 2 - (L.gate.x + T / 2)) < 90) {
    if (S.dia >= L.diaNeed) openGate(); else showHint('La puerta necesita 3 diamantes  (' + S.dia + '/3)', .3);
  }
  if (L.arena && S.gateOpen && !S.bossStarted && P.x > L.arena.trigger) startBoss();
}
function nearestNpc() {
  let best = null, bd = 60;
  for (const e of S.ents) if (e.type === 'npc') {
    const d = Math.abs(e.x + 12 - (P.x + 11)); if (d < bd && Math.abs(e.y - P.y) < 50) { bd = d; best = e; }
  }
  return best;
}

// ---------- Actualización general ----------
function update(dt) {
  S.t += dt; updateTimers(dt); updateFade(dt); updateMusic(dt);
  S.shake = Math.max(0, S.shake - dt); S.hintT = Math.max(0, S.hintT - dt);
  if (S.skip && !S.busy && !S.stage && !S.dialog) S.skip = false;
  if (S.mode === 'title') {
    if (wasPressed(['Enter', 'Space', 'KeyJ'])) startGame();
    return;
  }
  if ((S.stage || S.dialog) && wasPressed('Escape')) S.skip = true;
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
  updateBoss(dt); updateProj(dt); updateFx(dt);
  if (S.lvl.bounce) for (const k in S.lvl.bounce) { S.lvl.bounce[k] -= dt; if (S.lvl.bounce[k] <= 0) delete S.lvl.bounce[k]; }
  S.nearNpc = nearestNpc();
  if (S.nearNpc && wasPressed(K.talk)) talkNpc(S.nearNpc);
  checkTriggers();
  updateCamera(dt, false);
}
