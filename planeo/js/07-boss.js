/* 07 · mini jefes: ataques con aviso, bellotas para devolverle el golpe */
'use strict';
const BOSS_Z = 32;
const BOSS_DEF = {
  crow:  { name: 'Capitán Grajo',   hp: 3, cool: 3.5, shotSpd: 25, atk: ['shot', 'wall', 'shot', 'wall'],           flap: 5 },
  storm: { name: 'Nubarrón Trueno', hp: 4, cool: 3.3, shotSpd: 26, atk: ['strike', 'wall', 'strike', 'shot'],       flap: 0 },
  owl:   { name: 'Don Búho',        hp: 5, cool: 3.0, shotSpd: 28, atk: ['wall', 'shot', 'strike', 'wall', 'shot'], flap: 3 }
};
function createBoss(type, lvl){
  const def = BOSS_DEF[type], hp = def.hp + Math.floor((lvl || 0) / 3);
  return { type, def, hp, maxhp: hp, state: 'intro', t: 0, bz: 150, bx: 2, tx: 2, hurt: 0, cool: 1.6, warns: [], projs: [], gifts: [], haz: [], thrown: [], giftIn: -1, dieT: 0, atkN: 0, last: '', lvl: lvl || 0 };
}
function bossStart(){
  const cfg = LV.cfg;
  G.boss = createBoss(cfg.boss, LV.bossLevel);
  Sound.setMood('boss'); Sound.sfx('roar');
  banner('¡Mini jefe!<small>' + G.boss.def.name + '</small>', 2200);
  showBossBar(true);
}
function bossLanes(B){ // carriles ocupados por avisos / proyectiles / rayos
  const s = new Set();
  for (const w of B.warns) if (w.lane !== null) s.add(w.lane);
  for (const p of B.projs) s.add(p.lane);
  for (const h of B.haz) s.add(h.lane);
  return s;
}
function launchAttack(){
  const B = G.boss, def = B.def, er = 1 - B.hp / B.maxhp;
  let kind; do { kind = def.atk[(B.atkN + Math.floor(Math.random() * 2)) % def.atk.length]; } while (kind === B.last && Math.random() < 0.7);
  B.last = kind; B.atkN++;
  const R = n => Math.floor(Math.random() * n);
  if (kind === 'shot'){
    const n = 1 + (er > 0.34 ? 1 : 0) + (er > 0.67 ? 1 : 0);
    for (let k = 0; k < n; k++) B.warns.push({ kind: 'shot', lane: null, delay: k * 0.62, t: 0.95 - 0.15 * er, pick: k });
  } else if (kind === 'wall'){
    const nh = er > 0.5 ? 1 : 2, holes = new Set();
    while (holes.size < nh) holes.add(R(5));
    for (let l = 0; l < 5; l++) if (!holes.has(l)) B.warns.push({ kind: 'wall', lane: l, delay: 0, t: 1.15 - 0.25 * er });
    B.tx = [...holes][0];
  } else {
    const n = Math.min(3, 1 + Math.floor(er * 3.2)), lanes = new Set([clamp(G.tgt, 0, 4)]);
    while (lanes.size < n) lanes.add(R(5));
    for (const l of lanes) B.warns.push({ kind: 'strike', lane: l, delay: 0, t: 1.0 - 0.15 * er });
    B.tx = [...lanes][0];
  }
  B.cool = def.cool - 0.9 * er - Math.min(0.5, B.lvl * 0.05);
  B.giftIn = 1.0;
  Sound.sfx('warn');
}
function spawnGift(){
  const B = G.boss, busy = bossLanes(B), safe = [];
  for (let l = 0; l < 5; l++) if (!busy.has(l)) safe.push(l);
  if (!safe.length) return;
  // si había un solo disparo, también valen los carriles de al lado
  B.gifts.push({ lane: safe[Math.floor(Math.random() * safe.length)], z: BOSS_Z - 4 });
  Sound.sfx('gift');
}
function bossHit(){
  const B = G.boss; B.hp--; B.hurt = 0.9; G.shake = 10; Sound.sfx('bossHurt');
  const p = bossScreen(); burst(p.x, p.y, '#ffe36b', 26, 280, 8); burst(p.x, p.y, '#ffffff', 12, 200, 6);
  if (B.hp <= 0){
    B.state = 'dying'; B.dieT = 0; B.warns.length = B.projs.length = B.haz.length = B.gifts.length = 0;
    Sound.sfx('bossDie'); G.flash = 0.45; banner('¡Jefe derrotado!', 2400); G.t0 = G.t;
    for (let i = 0; i < 60; i++) particles.push({ x: Math.random() * W, y: -10 - Math.random() * 120, vx: (Math.random() - 0.5) * 120, vy: 80 + Math.random() * 200, life: 3 + Math.random() * 2, max: 1,
      color: ['#ff7a59', '#ffd23f', '#7bdc65', '#4aa3ff', '#c78bff'][i % 5], size: 5 + Math.random() * 5, g: 40, confetti: true });
  }
  updateBossBar();
}
function updateBoss(dt){
  const B = G.boss; B.t += dt;
  if (B.state === 'intro'){
    B.bz = Math.max(BOSS_Z, B.bz - 62 * dt);
    if (B.bz <= BOSS_Z){ B.state = 'fight'; B.cool = 1.4; }
    return;
  }
  if (B.state === 'dying'){
    B.dieT += dt; B.bz += 14 * dt;
    if (B.dieT > 2.4 && !G.bossDone){ G.bossDone = true; onBossDefeated(); }
    return;
  }
  B.bx += (B.tx - B.bx) * Math.min(1, dt * 3.2);
  B.hurt = Math.max(0, B.hurt - dt);
  B.cool -= dt; if (B.cool <= 0 && G.fallT <= 0) launchAttack();
  if (B.giftIn >= 0){ B.giftIn -= dt; if (B.giftIn < 0) spawnGift(); }
  const er = 1 - B.hp / B.maxhp, spd = B.def.shotSpd * (1 + 0.3 * er) + B.lvl * 0.6;
  // avisos -> proyectiles / rayos
  for (let i = B.warns.length - 1; i >= 0; i--){
    const w = B.warns[i];
    if (w.delay > 0){ w.delay -= dt; if (w.delay <= 0 && w.kind === 'shot'){
      const base = clamp(G.tgt, 0, 4), off = w.pick === 0 ? 0 : (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 1.9));
      w.lane = clamp(base + off, 0, 4); B.tx = w.lane; Sound.sfx('warn'); } continue; }
    if (w.lane === null) continue;
    w.t -= dt;
    if (w.t <= 0){
      B.warns.splice(i, 1);
      if (w.kind === 'strike'){ B.haz.push({ lane: w.lane, act: 0.5, hit: false }); Sound.sfx('zap'); G.lightning = 0.18; G.shake = Math.max(G.shake, 6); }
      else { B.projs.push({ lane: w.lane, z: BOSS_Z - 1, v: spd, done: false, seed: Math.random() * 9 }); if (w.kind === 'shot') Sound.sfx('whoosh'); }
    }
  }
  for (let i = B.projs.length - 1; i >= 0; i--){
    const p = B.projs[i]; p.z -= p.v * dt;
    if (!p.done && p.z <= 1.0 && p.z > -1.6 && Math.abs(p.lane - G.x) < 0.62 && G.inv <= 0 && G.fallT <= 0){ p.done = true; hurt({ type: B.type === 'storm' ? 'storm' : 'cloud' }); }
    if (p.z < -3) B.projs.splice(i, 1);
  }
  for (let i = B.haz.length - 1; i >= 0; i--){
    const h = B.haz[i]; h.act -= dt;
    if (!h.hit && Math.abs(h.lane - G.x) < 0.6 && G.inv <= 0 && G.fallT <= 0){ h.hit = true; hurt({ type: 'storm' }); }
    if (h.act <= 0) B.haz.splice(i, 1);
  }
  for (let i = B.gifts.length - 1; i >= 0; i--){
    const g = B.gifts[i]; g.z -= 14 * dt;
    if (g.z < 1.6 && g.z > -1.6 && Math.abs(g.lane - G.x) < 0.85){
      B.gifts.splice(i, 1); B.thrown.push({ t: 0, dur: 0.55 }); Sound.sfx('throw'); const p = playerScreen(); burst(p.x, p.y, '#ffe36b', 14, 180, 6); continue;
    }
    if (g.z < -3) B.gifts.splice(i, 1);
  }
  for (let i = B.thrown.length - 1; i >= 0; i--){ const th = B.thrown[i]; th.t += dt; if (th.t >= th.dur){ B.thrown.splice(i, 1); bossHit(); } }
}
function bossScreen(){
  const B = G.boss; return proj(B.bz, B.bx - 2, 0.9 * laneW + Math.sin(G.tAnim * 2) * 0.07 * laneW);
}
/* franjas rojas en el suelo que avisan de dónde vendrá el golpe */
function bossGround(drop){
  const B = G.boss, pul = 0.5 + 0.5 * Math.sin(G.tAnim * 16);
  const strip = (lane, col) => {
    const l0 = lane - 2 - 0.5, l1 = lane - 2 + 0.5, a = proj(0, l0, -drop), b = proj(0, l1, -drop), c = proj(BOSS_Z, l1, -drop), d = proj(BOSS_Z, l0, -drop);
    const a2 = proj(-14, l0, -drop), b2 = proj(-14, l1, -drop);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a2.x, a2.y); ctx.lineTo(d.x, d.y); ctx.lineTo(c.x, c.y); ctx.lineTo(b2.x, b2.y); ctx.closePath(); ctx.fill();
  };
  for (const w of B.warns){
    if (w.delay > 0 || w.lane === null) continue;
    strip(w.lane, `rgba(255,${w.kind === 'strike' ? 210 : 60},${w.kind === 'strike' ? 40 : 60},${0.16 + 0.16 * pul})`);
    const m = proj(9, w.lane - 2, -drop); ctx.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * pul})`; ctx.font = '800 ' + Math.round(laneW * 0.5 * m.s) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('!', m.x, m.y - laneW * 0.1 * m.s);
  }
  for (const h of B.haz) strip(h.lane, `rgba(255,240,120,${0.35 + 0.3 * pul})`);
}
function bossItems(items, airH){
  const B = G.boss, ph = playerScreen().h;
  items.push({ z: B.bz, k: 4, fn: (z) => {
    const p = bossScreen(), s = laneW * 0.85 * p.s;
    const gp = proj(B.bz, B.bx - 2, 0);
    ctx.fillStyle = 'rgba(20,40,30,.25)'; ell(ctx, gp.x, gp.y, laneW * 1.1 * p.s, laneW * 0.16 * p.s);
    ctx.save();
    if (B.state === 'dying'){ ctx.globalAlpha = clamp(1 - B.dieT / 2.4, 0, 1); ctx.translate(p.x, p.y); ctx.rotate(B.dieT * 4); ctx.translate(-p.x, -p.y); }
    if (B.hurt > 0 && Math.floor(G.tAnim * 20) % 2 === 0) ctx.globalAlpha *= 0.55;
    glow(ctx, p.x, p.y, s * 2.6, B.state === 'fight' ? 'rgba(255,60,60,A)' : 'rgba(255,255,255,A)');
    const mood = B.state === 'dying' ? (B.type === 'crow' ? 'hurt' : 'sad') : B.hurt > 0 ? (B.type === 'storm' ? 'sad' : 'hurt') : 'angry';
    drawBossSprite(B.type, ctx, p.x, p.y, s, G.tAnim, { mood, flap: B.def.flap });
    ctx.restore();
  } });
  for (const pr of B.projs) items.push({ z: pr.z, k: 4, fn: (z) => { const p = proj(Math.max(z, -4), pr.lane - 2, ph); ctx.globalAlpha = clamp((VIEW - z) / 40, 0, 1); drawBossShot(B.type, ctx, p.x, p.y, laneW * 0.62 * p.s, G.tAnim, pr.seed); ctx.globalAlpha = 1; } });
  for (const g of B.gifts) items.push({ z: g.z, k: 4, fn: (z) => { const p = proj(Math.max(z, -4), g.lane - 2, ph + laneW * 0.05); drawGift(ctx, p.x, p.y, laneW * 0.7 * p.s, G.tAnim); } });
  for (const h of B.haz) items.push({ z: 4, k: 4, fn: () => {
    const top = proj(4, h.lane - 2, 0), x = top.x, y = top.y;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const pts = []; for (let i = 0; i <= 8; i++) pts.push([x + (i === 0 || i === 8 ? 0 : (Math.sin(i * 12.9 + Math.floor(G.tAnim * 30)) * 0.22 * laneW)), -10 + (y + 10) * i / 8]);
    ctx.strokeStyle = 'rgba(255,230,90,.35)'; ctx.lineWidth = laneW * 0.4; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
    ctx.strokeStyle = '#fffbd0'; ctx.lineWidth = laneW * 0.1; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
    ctx.restore();
  } });
}
/* bellotas lanzadas hacia el jefe (en pantalla) */
function bossOverlay(pl){
  const B = G.boss, bp = bossScreen();
  for (const th of B.thrown){
    const k = th.t / th.dur, e = k * k * (3 - 2 * k), x = lerp(pl.x, bp.x, e), y = lerp(pl.y, bp.y, e) - Math.sin(k * Math.PI) * laneW * 0.9;
    drawAcorn(ctx, x, y, laneW * 0.62 * lerp(1, 0.55, k), 'gold', G.tAnim * 3, 1);
  }
}
