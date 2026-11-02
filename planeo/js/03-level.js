/* 03 · generación determinista del nivel (3 carriles; depende de la distancia, no del tiempo)
   Roster de enemigos con comportamientos distintos:
     sweep  cruza de un carril a otro            (abejorro · baba)
     rush   se lanza hacia ti a toda velocidad   (cometa · bola rodante)
     hop    salta de carril en carril             (murciélago · conejo)
     home   te sigue y se fija en tu carril      (dron vigía)
     gate   valla eléctrica que parpadea         (cielo y tierra)
     ambush sale de la tierra cuando te acercas  (topo)                                       */
'use strict';
const ENEMIES = {
  sky:    [{ t: 'bee', beh: 'sweep', d: 0.05, w: 3 }, { t: 'comet', beh: 'rush', d: 0.12, w: 2.6 }, { t: 'bat', beh: 'hop', d: 0.25, w: 2.4 },
           { t: 'gate', beh: 'gate', d: 0.35, w: 2.2 }, { t: 'drone', beh: 'home', d: 0.4, w: 2.2 }],
  ground: [{ t: 'slime', beh: 'sweep', d: 0.05, w: 3 }, { t: 'boulder', beh: 'rush', d: 0.12, w: 2.6 }, { t: 'bunny', beh: 'hop', d: 0.25, w: 2.4 },
           { t: 'mole', beh: 'ambush', d: 0.25, w: 2.6 }, { t: 'gate', beh: 'gate', d: 0.4, w: 2 }]
};
const PICKUPS = ['acorn', 'gold', 'heart', 'shield', 'star', 'magnet', 'chest', 'portal'];
const JUMPABLE = { hurdle: 1, logbar: 1 };   // obstáculos bajos: se saltan (o se esquivan de carril)

function genLevel(cfg, o){
  o = o || {};
  const diffAdd = o.diffAdd || 0, spdAdd = o.spdAdd || 0;
  const A = o.asc || 0, skyLen = A + cfg.skyLen, Lend = skyLen + cfg.groundLen, calmA = skyLen - 200, calmB = skyLen + 90;   // A = metros de ascenso al principio (modo infinito)
  const rnd = mulberry32(cfg.seed + (o.seedAdd || 0));
  const R = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const objs = [], dyn = [], scenery = [];
  let P = o.startP || 90, safe = MID, prevP = (o.startP || 90) - 60, lastE = '';
  let nextChest = P + 380 + R(0, 200), nextPortal = P + 650 + R(0, 250);

  const pushBlocks = (rowP, free, d) => {
    const ground = rowP >= calmB;
    for (let l = 0; l < LANES; l++){
      if (free.has(l)) continue;
      let type;
      if (ground) type = (d > 0.3 && rnd() < 0.45) ? 'spikerock' : 'crate';
      else type = (d > 0.45 && rnd() < 0.4) ? 'thunderbox' : 'crystal';
      objs.push({ type, P: rowP, lane: l, v: rnd(), sc: 1 });
    }
  };
  const pickEnemy = (pool, d) => {
    const c = pool.filter(e => d >= e.d); let tot = 0;
    const ws = c.map(e => { const w = e.w * (e.t === lastE ? 0.25 : 1); tot += w; return w; });
    let r = rnd() * tot; for (let i = 0; i < c.length; i++){ r -= ws[i]; if (r <= 0) return c[i]; }
    return c[0];
  };
  const nearestFree = (taken, from) => { let best = MID, bd = 9; for (let l = 0; l < LANES; l++){ if (taken.includes(l)) continue; if (Math.abs(l - from) < bd){ bd = Math.abs(l - from); best = l; } } return best; };

  while (P < Lend - 70){
    const prog = P / Lend;
    const d = cfg.diff0 + diffAdd + prog * cfg.span;
    const calm = P > calmA && P < calmB;
    const ground = P >= calmB;
    const gap = lerp(36, 25, clamp(prog, 0, 1)) + R(0, 5);
    let kind;
    if (calm) kind = 'trail';
    else {
      const r = rnd();
      if (d > 0.4 && r < 0.12) kind = 'slalom';
      else if (r < 0.40) kind = 'wall';
      else if (r < 0.55 && P > 150) kind = 'hurdle';
      else if (r < 0.84 && d > 0.05) kind = 'enemy';
      else kind = 'trail';
    }
    let newSafe = safe, extra = 0;
    if (kind === 'wall'){
      newSafe = clamp(safe + R(-2, 2), 0, LANES - 1);
      const n = d < 0.3 ? 1 : d < 0.6 ? (rnd() < 0.5 ? 1 : 2) : (rnd() < 0.78 ? 2 : 1);
      const free = new Set([newSafe]);
      while (free.size < LANES - n) free.add(R(0, LANES - 1));
      pushBlocks(P, free, d);
    } else if (kind === 'hurdle'){
      const full = d > 0.2 && rnd() < 0.4, ht = ground ? 'logbar' : 'hurdle', lanesH = new Set([safe]);
      if (full){ for (let l = 0; l < LANES; l++) lanesH.add(l); } else if (rnd() < 0.5) lanesH.add(clamp(safe + (rnd() < 0.5 ? -1 : 1), 0, LANES - 1));
      for (const l of lanesH) objs.push({ type: ht, P, lane: l, v: rnd(), sc: 1 });
      // arco de bellotas por encima: se recogen saltando
      const ys = [0, 0.9, 1.9, 2.3, 1.9, 0.9, 0];
      for (let i = 0; i < ys.length; i++) objs.push({ type: i === 3 && rnd() < 0.3 ? 'gold' : 'acorn', P: P - 12 + i * 4, lane: safe, y: ys[i], taken: false });
      let free = -1; for (let l = 0; l < LANES; l++) if (!lanesH.has(l)) free = l;
      newSafe = free >= 0 ? free : safe;
    } else if (kind === 'slalom'){
      let s = safe, dir = rnd() < 0.5 ? -1 : 1;
      for (let k = 0; k < 3; k++){
        let s2 = s + dir; if (s2 < 0 || s2 > LANES - 1){ dir = -dir; s2 = s + dir; }
        pushBlocks(P + k * 17, new Set([s2]), d);
        s = s2;
      }
      newSafe = s; extra = 34;
    } else if (kind === 'enemy'){
      const e = pickEnemy(ground ? ENEMIES.ground : ENEMIES.sky, d); lastE = e.t;
      if (e.beh === 'sweep'){
        const base = (ground ? 3.4 : 2.3) * (1 - 0.25 * Math.min(1, d));
        const full = d > 0.5 && rnd() < 0.4;
        const a0 = full ? 0 : R(0, LANES - 2), b0 = full ? LANES - 1 : a0 + 1;
        objs.push({ type: e.t, P, a: a0, b: b0, per: base + (full ? 1.0 : 0) + rnd() * 0.6, ph: rnd() * 6.28, v: rnd(), sc: 1 });
        if (full) newSafe = MID;
        else {
          let free = 0; for (let l = 0; l < LANES; l++) if (l < a0 || l > b0) free = l;
          newSafe = free;
          if (d > 0.8 && rnd() < 0.25) pushBlocks(P, new Set([a0, b0]), d);
        }
        if (rnd() < 0.6) objs.push({ type: 'gold', P: P - 11, lane: a0 + R(0, b0 - a0), taken: false });
      } else if (e.beh === 'rush'){
        const lanes = [clamp(safe + R(-1, 1), 0, LANES - 1)];
        if (d > 0.7 && rnd() < 0.4){ let l2; do { l2 = R(0, LANES - 1); } while (l2 === lanes[0]); lanes.push(l2); }
        // se lanzan desde lejos y llegan antes de su posición nominal: lo colocamos más adelante para que el IMPACTO caiga justo en esta fila
        const vr = (ground ? 12 : 14) + Math.min(1, d) * 4, Vest = lerp(cfg.spd0, cfg.spd1, clamp(prog, 0, 1)) + spdAdd, shift = 105 * vr / (Vest + vr);
        for (const l of lanes) dyn.push({ type: e.t, P: P + shift, lane: l, vr, act: null, pe: P + shift, pz: 99, v: rnd() });
        newSafe = nearestFree(lanes, safe);
      } else if (e.beh === 'hop'){
        const pats = [[0, 1, 2, 1], [2, 1, 0, 1], [0, 2, 1, 2], [1, 0, 1, 2]], seq = pats[R(0, pats.length - 1)];
        objs.push({ type: e.t, P, hop: true, seq, a: 0, b: 2, per: 1.55 - 0.4 * Math.min(1, d), ph: rnd() * 4, v: rnd() });
        newSafe = MID;
      } else if (e.beh === 'home'){
        const l0 = R(0, LANES - 1);
        dyn.push({ type: 'drone', P, lane: l0, cur: l0, pe: P, pz: 99, v: rnd() });
        newSafe = MID;
      } else if (e.beh === 'gate'){
        const full = d > 0.8 && rnd() < 0.3;
        let ga, gb;
        if (full){ ga = 0; gb = LANES - 1; } else if (rnd() < 0.5){ ga = R(0, LANES - 2); gb = ga + 1; } else { ga = gb = R(0, LANES - 1); }
        objs.push({ type: 'gate', P, ga, gb, per: 2.3 - 0.4 * Math.min(1, d), ph: rnd(), v: rnd() });
        const taken = []; for (let l = ga; l <= gb; l++) taken.push(l);
        newSafe = full ? MID : nearestFree(taken, safe);
      } else if (e.beh === 'ambush'){
        const n = (d > 0.6 && rnd() < 0.5) ? 2 : 1, lanes = new Set();
        while (lanes.size < n) lanes.add(R(0, LANES - 1));
        for (const l of lanes) objs.push({ type: 'mole', P, lane: l, v: rnd(), sc: 1 });
        newSafe = nearestFree([...lanes], safe);
      }
    } else {
      newSafe = clamp(safe + R(-1, 1), 0, LANES - 1);
    }
    // rastro de bellotas (y a veces un power-up) desde la fila anterior hasta esta, guiando hacia el hueco libre
    if (kind === 'trail' || rnd() < 0.7){
      const from = prevP + 10, to = P - 9;
      const step = calm ? 5 : 6;
      const n = Math.max(0, Math.floor((to - from) / step));
      if (n > 1){
        const special = rnd();
        for (let i = 0; i < n; i++){
          const t = i / (n - 1);
          const lane = clamp(Math.round(lerp(safe, kind === 'slalom' ? safe : newSafe, smooth(t))), 0, LANES - 1);
          let type = 'acorn';
          if (i === (n >> 1)){
            if (special < 0.05 && !calm) type = 'heart';
            else if (special < 0.10) type = 'shield';
            else if (special < 0.135 && P > 250) type = 'star';
            else if (special < 0.18) type = 'magnet';
            else if (special < 0.26) type = 'gold';
          }
          objs.push({ type, P: from + i * step, lane, taken: false });
        }
      }
    }
    if (P > nextChest && kind === 'trail' && P + 120 < calmA){   // cofre secreto: en un carril del borde, a la altura de un salto
      nextChest = P + 520 + R(0, 320);
      const cl = newSafe <= 1 ? LANES - 1 : 0;
      objs.push({ type: 'chest', P: P + 6, lane: cl, y: 2.35, taken: false });
      for (let i = 0; i < 3; i++) objs.push({ type: 'acorn', P: P - 6 + i * 4, lane: cl, y: 0.5 + i * 0.75, taken: false });
    }
    if (P > nextPortal && kind === 'trail' && !calm && P + 360 < calmA){   // portal: atajo hacia delante (a cambio de las bellotas del camino largo)
      nextPortal = P + 800 + R(0, 300);
      objs.push({ type: 'portal', P: P + 6, lane: newSafe, y: 0, to: P + 6 + 170, taken: false });
    }
    safe = newSafe; prevP = P + extra;
    P += gap + extra;
  }
  objs.sort((a, b) => a.P - b.P);

  // decoración lateral fuera de la pista (no colisiona)
  for (let p = 30; p < Lend + 520; p += R(13, 24)){
    const side = rnd() < 0.5 ? -1 : 1;
    const lat = side * (2.4 + rnd() * 5.5);
    if (p < skyLen - 100 || rnd() < 0.18) scenery.push({ type: 'puff', P: p, lat, h: R(-40, 420), sc: 0.8 + rnd() * 1.2, v: rnd() });
    if (p > skyLen - 100) scenery.push({ type: rnd() < 0.8 ? 'stree' : 'srock', P: p, lat: side * (2.3 + rnd() * 4.5), sc: 0.8 + rnd() * 0.7, v: rnd() });
  }
  // islotes flotantes y bandadas lejanas (solo en el cielo)
  for (let p = 60; p < skyLen - 150; p += R(70, 150)){
    const side = rnd() < 0.5 ? -1 : 1;
    if (rnd() < 0.5) scenery.push({ type: 'islet', P: p, lat: side * (6 + rnd() * 7), h: R(60, 340), sc: 0.9 + rnd() * 0.9, v: rnd() });
    else scenery.push({ type: 'flock', P: p, lat: side * (3 + rnd() * 6), h: R(160, 420), sc: 0.8 + rnd() * 0.6, v: rnd() });
  }
  for (let p = 120; p < skyLen - 100; p += R(80, 170)){   // globos aerostáticos
    const side = rnd() < 0.5 ? -1 : 1; scenery.push({ type: 'balloon', P: p, lat: side * (4 + rnd() * 6), h: R(90, 340), sc: 0.9 + rnd() * 0.7, v: rnd() });
  }
  for (let p = skyLen - 60; p < Lend + 520; p += R(35, 80)){   // casas y molinos junto a la pista
    const side = rnd() < 0.5 ? -1 : 1; scenery.push({ type: rnd() < 0.4 ? 'windmill' : 'house', P: p, lat: side * (3.4 + rnd() * 5), sc: 0.9 + rnd() * 0.5, v: rnd() });
  }
  for (let p = skyLen - 80; p < Lend + 520; p += R(4, 8)){
    const lat = (rnd() < 0.5 ? -1 : 1) * (1.8 + rnd() * 7);
    scenery.push({ type: rnd() < 0.5 ? 'flower' : 'tuft', P: p, lat, sc: 0.7 + rnd() * 0.7, v: rnd() });
  }
  if (A > 0){   // al empezar el ascenso aún se ve el suelo: árboles, flores y casas a los lados para que la unión con el ciclo anterior sea continua
    for (let p = 6; p < A * 0.6; p += R(10, 18)){ const side = rnd() < 0.5 ? -1 : 1; scenery.push({ type: rnd() < 0.8 ? 'stree' : 'srock', P: p, lat: side * (2.3 + rnd() * 4.5), sc: 0.8 + rnd() * 0.7, v: rnd() }); }
    for (let p = 6; p < A * 0.55; p += R(35, 80)){ const side = rnd() < 0.5 ? -1 : 1; scenery.push({ type: rnd() < 0.4 ? 'windmill' : 'house', P: p, lat: side * (3.4 + rnd() * 5), sc: 0.9 + rnd() * 0.5, v: rnd() }); }
    for (let p = 4; p < A * 0.5; p += R(4, 8)){ const lat = (rnd() < 0.5 ? -1 : 1) * (1.8 + rnd() * 7); scenery.push({ type: rnd() < 0.5 ? 'flower' : 'tuft', P: p, lat, sc: 0.7 + rnd() * 0.7, v: rnd() }); }
  }
  scenery.sort((a, b) => a.P - b.P);

  return {
    cfg, objs, dyn, scenery, skyLen, skyRel: cfg.skyLen, asc: A, base: 0, groundLen: cfg.groundLen, L: Lend, calmA, calmB,
    cps: [skyLen * 0.33, skyLen * 0.66, skyLen + 60],
    spd0: Math.max(cfg.spd0 + spdAdd, o.spdFloor || 0), spd1: cfg.spd1 + spdAdd, bossLevel: o.bossLevel || 0
  };
}

/* desplaza todo el nivel para que empiece justo donde estás (el mundo no se reinicia: los bosques y aldeas siguen en su sitio) */
function shiftLevel(lv, base){
  lv.base = base; for (const o of lv.objs) o.P += base; for (const d of lv.dyn){ d.P += base; d.pe += base; } for (const s of lv.scenery) s.P += base;
  lv.skyLen += base; lv.L += base; lv.calmA += base; lv.calmB += base; lv.cps = lv.cps.map(c => c + base); return lv;
}
function setLevel(lv){
  LV = lv; L_SKY = lv.skyLen; L_GROUND = lv.groundLen; L = lv.L; CALM_A = lv.calmA; CALM_B = lv.calmB; CHECKPOINTS = lv.cps;
  THEME = THEMES[lv.cfg.theme];
}
function lowerBound(arr, p){
  let lo = 0, hi = arr.length;
  while (lo < hi){ const m = (lo + hi) >> 1; if (arr[m].P < p) lo = m + 1; else hi = m; }
  return lo;
}
/* posición (en carriles) de un obstáculo/enemigo en el instante t */
function laneOf(o, t){
  if (o.cur !== undefined) return o.cur;                                    // dron: sigue al jugador
  if (o.hop){ const u = t / o.per + o.ph, k = Math.floor(u), f = u - k, n = o.seq.length;
    const l0 = o.seq[k % n], l1 = o.seq[(k + 1) % n], e = f < 0.7 ? 0 : smooth((f - 0.7) / 0.3); return l0 + (l1 - l0) * e; }
  if (o.a === undefined) return o.lane;
  return o.a + (o.b - o.a) * (0.5 + 0.5 * Math.sin(6.2832 * t / o.per + o.ph));
}
/* fase del salto (0 = en el suelo/aire quieto, 0..1 = saltando) */
function hopK(o, t){ const u = t / o.per + o.ph, f = u - Math.floor(u); return f < 0.7 ? 0 : (f - 0.7) / 0.3; }
function hopWarn(o, t){ const u = t / o.per + o.ph, f = u - Math.floor(u); return f > 0.5 && f < 0.7; }
function gateOn(o, t){ return ((t / o.per + o.ph) % 1) < 0.5; }
function gateFlicker(o, t){ const f = (t / o.per + o.ph) % 0.5; return f > 0.4; }   // cerca de cambiar de estado
const isPickup = o => PICKUPS.includes(o.type);
const HIT_R = { bee: 0.58, slime: 0.58, comet: 0.55, boulder: 0.6, bat: 0.55, bunny: 0.58, drone: 0.6, mole: 0.6 };
function hitRadius(o){ return HIT_R[o.type] || 0.62; }
function staticHit(o, x, t, y, dp){
  if (JUMPABLE[o.type]) return (y || 0) < 0.7 && Math.abs(o.lane - x) < 0.62 && (dp === undefined || Math.abs(dp) < 0.9);
  if (o.type === 'gate') return gateOn(o, t) && x > o.ga - 0.58 && x < o.gb + 0.58;
  return Math.abs(laneOf(o, t) - x) < hitRadius(o);
}
/* enemigos dinámicos: cometa/bola se lanzan hacia ti; el dron te sigue y se fija */
function updateDyn(d, dt){
  if (d.dead) return;
  const z = d.pe - G.P;
  if (d.vr){
    if (d.act === null && d.P - G.P < 105) d.act = G.t;
    d.pe = d.act === null ? d.P : d.P - d.vr * (G.t - d.act);
  } else if (d.cur !== undefined){
    if (z < 95 && z > 26) d.cur += (clamp(G.tgt, 0, LANES - 1) - d.cur) * Math.min(1, dt * 1.7);
    d.locked = z <= 26;
  }
}

/* nivel n del modo infinito: va rotando los 3 mundos y subiendo la dificultad sin techo */
function infConfig(n){
  const base = LEVELS[n % 3];
  const cfg = Object.assign({}, base, { seed: base.seed + Math.floor(n / 3) * 17 + n });
  const prev = n > 0 ? LEVELS[(n - 1) % 3].spd1 + Math.min((n - 1) * 1.7, 14) : 0;   // la velocidad no se reinicia al cambiar de ciclo
  return { cfg, opts: { diffAdd: n * 0.16, spdAdd: Math.min(n * 1.7, 14), bossLevel: n, startP: n > 0 ? 150 : 90, asc: n > 0 ? 380 : 0, spdFloor: prev * 0.92 } };
}
