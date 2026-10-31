/* 03 · generación determinista del nivel (depende de la distancia, no del tiempo) */
'use strict';
function genLevel(cfg, o){
  o = o || {};
  const diffAdd = o.diffAdd || 0, spdAdd = o.spdAdd || 0;
  const skyLen = cfg.skyLen, Lend = skyLen + cfg.groundLen, calmA = skyLen - 200, calmB = skyLen + 90;
  const rnd = mulberry32(cfg.seed + (o.seedAdd || 0));
  const R = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const objs = [], scenery = [];
  let P = 90, safe = 2, prevP = 30;

  const pushWall = (rowP, free, d) => {
    const ground = rowP >= calmB;
    for (let l = 0; l < LANES; l++){
      if (free.has(l)) continue;
      let type;
      if (ground) type = rnd() < 0.7 ? 'tree' : 'bush';
      else type = (d > 0.5 && rnd() < 0.35) ? 'storm' : 'cloud';
      objs.push({ type, P: rowP, lane: l, v: rnd(), sc: 0.95 + rnd() * 0.22 });
    }
  };

  while (P < Lend - 70){
    const prog = P / Lend;
    const d = cfg.diff0 + diffAdd + prog * cfg.span;
    const calm = P > calmA && P < calmB;
    const ground = P >= calmB;
    const gap = lerp(40, 29, clamp(prog, 0, 1)) + R(0, 6);
    let kind;
    if (calm) kind = 'trail';
    else {
      const r = rnd();
      if (d > 0.45 && r < 0.14) kind = 'slalom';
      else if (r < 0.6) kind = 'wall';
      else if (r < 0.84 && d > 0.05) kind = 'mover';
      else kind = 'trail';
    }
    let newSafe = safe, extra = 0;
    if (kind === 'wall'){
      newSafe = clamp(safe + R(-2, 2), 0, 4);
      const n = d < 0.35 ? R(1, 2) : d < 0.65 ? R(2, 3) : d < 0.95 ? (rnd() < 0.35 ? 4 : R(2, 3)) : (rnd() < 0.55 ? 4 : 3);
      const free = new Set([newSafe]);
      while (free.size < 5 - n) free.add(R(0, 4));
      pushWall(P, free, d);
    } else if (kind === 'slalom'){
      let s = safe, dir = rnd() < 0.5 ? -1 : 1;
      for (let k = 0; k < 3; k++){
        let s2 = s + dir; if (s2 < 0 || s2 > 4){ dir = -dir; s2 = s + dir; }
        pushWall(P + k * 17, new Set([s, s2]), d);
        s = s2;
      }
      newSafe = s; extra = 34;
    } else if (kind === 'mover'){
      const two = d > 0.35 && rnd() < 0.55;
      const mt = ground ? 'hog' : 'bird';
      const base = (ground ? 3.3 : 2.2) * (1 - 0.28 * Math.min(1, d));
      let free;
      if (two){
        const combos = [[0, 2, 4], [0, 3, 2], [1, 3, 0]];
        const c = combos[R(0, 2)];
        for (let k = 0; k < 2; k++) objs.push({ type: mt, P, a: c[k], b: c[k] + 1, per: base + rnd() * 0.8, ph: rnd() * 6.28, v: rnd(), sc: 1 });
        free = c[2];
      } else {
        const w = (d > 0.25 && rnd() < 0.55) ? 2 : 1;
        const a0 = R(0, 4 - w);
        objs.push({ type: mt, P, a: a0, b: a0 + w, per: base + rnd() * 0.8, ph: rnd() * 6.28, v: rnd(), sc: 1 });
        let best = -1, bd = 99;
        for (let l = 0; l < LANES; l++){
          if (l >= a0 && l <= a0 + w) continue;
          if (Math.abs(l - safe) < bd){ bd = Math.abs(l - safe); best = l; }
        }
        free = best;
        if (d > 0.3 && rnd() < 0.55){
          const cand = []; for (let l = 0; l < LANES; l++) if (l !== free && (l < a0 || l > a0 + w)) cand.push(l);
          if (cand.length) objs.push({ type: ground ? 'bush' : 'cloud', P, lane: cand[R(0, cand.length - 1)], v: rnd(), sc: 1 });
        }
        if (rnd() < 0.55) objs.push({ type: 'gold', P: P - 11, lane: a0 + R(0, w), taken: false });
      }
      newSafe = free;
    } else {
      newSafe = clamp(safe + R(-2, 2), 0, 4);
    }
    // rastro de bellotas desde la fila anterior hasta esta, guiando hacia el hueco libre
    if (kind === 'trail' || rnd() < 0.7){
      const from = prevP + 10, to = P - 9;
      const step = calm ? 5 : 6;
      const n = Math.max(0, Math.floor((to - from) / step));
      if (n > 1){
        const special = rnd();
        for (let i = 0; i < n; i++){
          const t = i / (n - 1);
          const lane = Math.round(lerp(safe, kind === 'slalom' ? safe : newSafe, smooth(t)));
          let type = 'acorn';
          if (i === (n >> 1)){ if (special < 0.07 && !calm) type = 'heart'; else if (special < 0.17) type = 'gold'; }
          objs.push({ type, P: from + i * step, lane, taken: false });
        }
      }
    }
    safe = newSafe; prevP = P + extra;
    P += gap + extra;
  }
  objs.sort((a, b) => a.P - b.P);

  // decoración lateral (no colisiona)
  for (let p = 30; p < Lend + 520; p += R(13, 24)){
    const side = rnd() < 0.5 ? -1 : 1;
    const lat = side * (3.3 + rnd() * 5.5);
    if (p < skyLen - 100 || rnd() < 0.18) scenery.push({ type: 'puff', P: p, lat, h: R(-40, 420), sc: 0.8 + rnd() * 1.2, v: rnd() });
    if (p > skyLen - 100) scenery.push({ type: rnd() < 0.8 ? 'stree' : 'srock', P: p, lat: side * (3.2 + rnd() * 4.5), sc: 0.8 + rnd() * 0.7, v: rnd() });
  }
  for (let p = skyLen - 80; p < Lend + 520; p += R(4, 8)){
    const lat = (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 7.5);
    scenery.push({ type: rnd() < 0.5 ? 'flower' : 'tuft', P: p, lat, sc: 0.7 + rnd() * 0.7, v: rnd() });
  }
  scenery.sort((a, b) => a.P - b.P);

  return {
    cfg, objs, scenery, skyLen, groundLen: cfg.groundLen, L: Lend, calmA, calmB,
    cps: [skyLen * 0.33, skyLen * 0.66, skyLen + 60],
    spd0: cfg.spd0 + spdAdd, spd1: cfg.spd1 + spdAdd, bossLevel: o.bossLevel || 0
  };
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
function laneOf(o, t){
  if (o.a === undefined) return o.lane;
  return o.a + (o.b - o.a) * (0.5 + 0.5 * Math.sin(6.2832 * t / o.per + o.ph));
}
function hitRadius(o){ return o.type === 'bird' ? 0.62 : o.type === 'hog' ? 0.6 : o.type === 'bush' ? 0.6 : 0.68; }

/* nivel n del modo infinito: va rotando los 3 mundos y subiendo la dificultad sin techo */
function infConfig(n){
  const base = LEVELS[n % 3];
  const cfg = Object.assign({}, base, { seed: base.seed + Math.floor(n / 3) * 17 + n });
  return { cfg, opts: { diffAdd: n * 0.16, spdAdd: Math.min(n * 1.6, 9), bossLevel: n } };
}
