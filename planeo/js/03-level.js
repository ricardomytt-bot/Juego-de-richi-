/* 03 · generación determinista del nivel (3 carriles; depende de la distancia, no del tiempo) */
'use strict';
function genLevel(cfg, o){
  o = o || {};
  const diffAdd = o.diffAdd || 0, spdAdd = o.spdAdd || 0;
  const skyLen = cfg.skyLen, Lend = skyLen + cfg.groundLen, calmA = skyLen - 200, calmB = skyLen + 90;
  const rnd = mulberry32(cfg.seed + (o.seedAdd || 0));
  const R = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const objs = [], scenery = [];
  let P = 90, safe = MID, prevP = 30;

  // un bloque en cada carril que no esté libre
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
      if (d > 0.4 && r < 0.14) kind = 'slalom';
      else if (r < 0.58) kind = 'wall';
      else if (r < 0.82 && d > 0.05) kind = 'mover';
      else kind = 'trail';
    }
    let newSafe = safe, extra = 0;
    if (kind === 'wall'){
      newSafe = clamp(safe + R(-2, 2), 0, LANES - 1);
      const n = d < 0.3 ? 1 : d < 0.6 ? (rnd() < 0.5 ? 1 : 2) : (rnd() < 0.78 ? 2 : 1);   // carriles bloqueados
      const free = new Set([newSafe]);
      while (free.size < LANES - n) free.add(R(0, LANES - 1));
      pushBlocks(P, free, d);
    } else if (kind === 'slalom'){
      let s = safe, dir = rnd() < 0.5 ? -1 : 1;
      for (let k = 0; k < 3; k++){
        let s2 = s + dir; if (s2 < 0 || s2 > LANES - 1){ dir = -dir; s2 = s + dir; }
        pushBlocks(P + k * 17, new Set([s2]), d);   // un solo hueco que se va desplazando
        s = s2;
      }
      newSafe = s; extra = 34;
    } else if (kind === 'mover'){
      const mt = ground ? 'slime' : 'bee';
      const base = (ground ? 3.4 : 2.3) * (1 - 0.25 * Math.min(1, d));
      const full = d > 0.5 && rnd() < 0.4;               // recorre los 3 carriles: hay que cronometrar
      const a0 = full ? 0 : R(0, LANES - 2), b0 = full ? LANES - 1 : a0 + 1;
      objs.push({ type: mt, P, a: a0, b: b0, per: base + (full ? 1.0 : 0) + rnd() * 0.6, ph: rnd() * 6.28, v: rnd(), sc: 1 });
      if (full){ newSafe = MID; }
      else {
        let free = 0; for (let l = 0; l < LANES; l++) if (l < a0 || l > b0) free = l;
        newSafe = free;
        if (d > 0.8 && rnd() < 0.25) pushBlocks(P, new Set([a0, b0]), d);   // bloque en el carril libre: obliga a cronometrar
      }
      if (rnd() < 0.6) objs.push({ type: 'gold', P: P - 11, lane: a0 + R(0, b0 - a0), taken: false });
    } else {
      newSafe = clamp(safe + R(-1, 1), 0, LANES - 1);
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
          const lane = clamp(Math.round(lerp(safe, kind === 'slalom' ? safe : newSafe, smooth(t))), 0, LANES - 1);
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

  // decoración lateral fuera de la pista (no colisiona)
  for (let p = 30; p < Lend + 520; p += R(13, 24)){
    const side = rnd() < 0.5 ? -1 : 1;
    const lat = side * (2.4 + rnd() * 5.5);
    if (p < skyLen - 100 || rnd() < 0.18) scenery.push({ type: 'puff', P: p, lat, h: R(-40, 420), sc: 0.8 + rnd() * 1.2, v: rnd() });
    if (p > skyLen - 100) scenery.push({ type: rnd() < 0.8 ? 'stree' : 'srock', P: p, lat: side * (2.3 + rnd() * 4.5), sc: 0.8 + rnd() * 0.7, v: rnd() });
  }
  for (let p = skyLen - 80; p < Lend + 520; p += R(4, 8)){
    const lat = (rnd() < 0.5 ? -1 : 1) * (1.8 + rnd() * 7);
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
const isPickup = o => o.type === 'acorn' || o.type === 'gold' || o.type === 'heart';
function hitRadius(o){ return o.type === 'bee' ? 0.58 : o.type === 'slime' ? 0.58 : 0.62; }

/* nivel n del modo infinito: va rotando los 3 mundos y subiendo la dificultad sin techo */
function infConfig(n){
  const base = LEVELS[n % 3];
  const cfg = Object.assign({}, base, { seed: base.seed + Math.floor(n / 3) * 17 + n });
  return { cfg, opts: { diffAdd: n * 0.16, spdAdd: Math.min(n * 1.6, 9), bossLevel: n } };
}
