// Mapas: se generan por código (habitaciones + puertas + objetos), 2 pisos de 40x24 casillas de 16 px
const TS = 16, MW = 40, MH = 24;
const KEY_NAMES = ['', 'ROJA', 'AZUL', 'VERDE', 'AMARILLA', 'MORADA'];
const KEY_COLORS = ['', '#e04040', '#4a8aff', '#3ae07a', '#ffd23f', '#b46aff'];
const MAT_BASIC = ['chatarra', 'cuerda', 'pilas', 'tela', 'madera', 'aluminio'];
const MAT_RARE = ['lente', 'circuito', 'aceite'];
const MAT_NAMES = { chatarra: 'CHATARRA', cuerda: 'CUERDA', pilas: 'PILAS', tela: 'TELA', madera: 'MADERA', aluminio: 'ALUMINIO', lente: 'LENTE', circuito: 'CIRCUITO', aceite: 'ACEITE' };
const randLoot = () => {
  const n = 2 + (Math.random() * 2 | 0), out = [];
  for (let i = 0; i < n; i++) out.push({ mat: Math.random() < 0.12 ? MAT_RARE[Math.random() * 3 | 0] : MAT_BASIC[Math.random() * 6 | 0], n: 1 + (Math.random() * 2 | 0) });
  return out;
};

function buildMap1() {
  const mk = () => ({ g: Array.from({ length: MH }, () => Array(MW).fill(' ')), objs: [], rooms: [], sol: Array.from({ length: MH }, () => Array(MW).fill(false)) });
  const F = [mk(), mk()];
  const room = (f, x, y, w, h, t, name) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) F[f].g[j][i] = t; F[f].rooms.push({ x, y, w, h, t, name }); };
  const walls = f => {
    const g = F[f].g, c = g.map(r => r.slice());
    for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) if (g[j][i] === ' ') {
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const nj = j + dj, ni = i + di; if (nj >= 0 && ni >= 0 && nj < MH && ni < MW && g[nj][ni] !== ' ' && g[nj][ni] !== '#') c[j][i] = '#'; }
    }
    F[f].g = c;
  };
  const set = (f, x, y, ch) => { F[f].g[y][x] = ch; };
  const obj = (f, type, x, y, extra = {}) => { const o = Object.assign({ type, x, y, f, w: 1, h: 1 }, extra); F[f].objs.push(o); return o; };
  const code = String(1000 + (Math.random() * 9000 | 0));
  const pick = a => a[Math.random() * a.length | 0];

  // ---------- PISO 1 ----------
  room(0, 2, 2, 12, 8, '.', 'sala'); room(0, 15, 2, 8, 8, 'k', 'cocina'); room(0, 24, 2, 7, 8, 'r', 'estudio'); room(0, 32, 2, 5, 8, 'g', 'boveda');
  room(0, 2, 11, 14, 8, 'g', 'estacionamiento'); room(0, 17, 11, 6, 8, '.', 'comedor'); room(0, 24, 11, 10, 8, 'g', 'taller');
  walls(0);
  set(0, 14, 5, '.'); set(0, 19, 10, '.'); set(0, 7, 10, '.'); set(0, 16, 15, '.'); set(0, 23, 14, '.'); set(0, 23, 5, '1'); set(0, 31, 5, '3');
  obj(0, 'door', 23, 5, { id: 1 }); obj(0, 'door', 31, 5, { id: 3 });

  // ---------- PISO 2 ----------
  room(1, 2, 2, 9, 7, 'r', 'cuarto A'); room(1, 13, 2, 9, 7, 'r', 'cuarto B'); room(1, 24, 2, 6, 7, 'k', 'bano'); room(1, 32, 2, 6, 7, 'r', 'cuarto C');
  room(1, 2, 10, 36, 3, '.', 'pasillo');
  room(1, 2, 14, 11, 8, '.', 'biblioteca'); room(1, 15, 14, 10, 8, 'g', 'bodega'); room(1, 27, 14, 11, 8, 'r', 'atico');
  walls(1);
  set(1, 6, 9, '.'); set(1, 17, 9, '2'); set(1, 26, 9, '.'); set(1, 34, 9, '.'); set(1, 7, 13, '4'); set(1, 19, 13, '.'); set(1, 32, 13, '5');
  obj(1, 'door', 17, 9, { id: 2 }); obj(1, 'door', 7, 13, { id: 4 }); obj(1, 'door', 32, 13, { id: 5 });
  obj(1, 'gap', 29, 10, { w: 2, h: 3 });   // hueco en el piso: hace falta una escalera

  // ---------- contenedores (el contenido se reparte al azar) ----------
  const C = {};
  const add = (id, f, type, x, y) => { C[id] = obj(f, type, x, y, { loot: [] }); return C[id]; };
  add('c01', 0, 'chest', 3, 3); add('c02', 0, 'chest', 12, 8); add('c03', 0, 'wardrobe', 9, 3); add('c04', 0, 'chest', 21, 3);
  add('c06', 0, 'chest', 21, 17); add('c07', 0, 'wardrobe', 14, 12); add('c08', 0, 'wardrobe', 3, 18); add('c09', 0, 'chest', 31, 18);
  add('c10', 0, 'wardrobe', 26, 3); add('m01', 0, 'mechbox', 5, 16); add('k01', 0, 'crate', 31, 13);
  add('c11', 1, 'chest', 9, 7); add('c12', 1, 'chest', 10, 8); add('c13', 1, 'chest', 27, 3); add('c14', 1, 'wardrobe', 29, 3);
  add('c15', 1, 'chest', 15, 3); add('c16', 1, 'chest', 17, 16); add('c17', 1, 'chest', 22, 19); add('c18', 1, 'chest', 4, 16);
  add('c19', 1, 'chest', 35, 19); add('c20', 1, 'wardrobe', 34, 3); add('m02', 1, 'mechbox', 24, 16); add('k02', 1, 'crate', 36, 5);
  const fridge = add('fridge', 0, 'fridge', 15, 2); fridge.loot.push({ item: 'comida', n: 1 });
  const vault = add('vault', 0, 'vault', 34, 3); vault.part = 'A'; vault.digits = code.slice(0, 2);
  const safe = add('safe', 1, 'safe', 29, 16); safe.part = 'B'; safe.digits = code.slice(2);
  obj(0, 'microwave', 17, 2);
  obj(0, 'recharge', 3, 12); obj(0, 'table', 26, 12); obj(0, 'fusebox', 33, 16); obj(0, 'exit', 34, 14, { code, shutter: false, powered: false });
  obj(0, 'stairs', 19, 12, { to: 1 }); obj(1, 'stairs', 22, 11, { to: 0 }); obj(1, 'computer', 4, 3);

  // llaves: cada una puede estar en uno de varios sitios (no siempre el mismo ni el más obvio)
  const free = ['c01', 'c02', 'c03', 'c04', 'c06', 'c07', 'c08', 'c09', 'c11', 'c12', 'c13', 'c14', 'c16', 'c17'];
  const hasStuff = c => c.loot.some(x => !x.key);
  const give = (cid, l) => { // un cofre solo guarda UN tipo de objeto/material (en cantidad); las llaves van aparte
    if (!l.key && hasStuff(C[cid])) { const alt = Object.keys(C).filter(k => k !== 'fridge' && k !== 'vault' && k !== 'safe' && !hasStuff(C[k])); const af = alt.filter(k => free.includes(k)); if (af.length) cid = pick(af); else if (alt.length) cid = pick(alt); else return; }
    C[cid].loot.push(l); };
  const keyAt = { 1: pick(free), 2: pick(['c10', 'm01', 'm02']), 3: pick(['c15', 'k01']), 4: pick(['vault', 'c20']), 5: pick(['c18', 'k02']) };
  const giveP = (cid, l) => give(cid, Object.assign(l, { prog: true })); // 'prog' = sirve para progresar (se reparte entre jugadores)
  for (const k in keyAt) giveP(keyAt[k], { key: +k });
  giveP(pick(free), { item: 'palanca', n: 1 });
  // materiales garantizados en la zona libre (para engranajes, escalera y fusible), el resto al azar
  [['aluminio', 4], ['aluminio', 4], ['chatarra', 3], ['chatarra', 3], ['madera', 4], ['madera', 3], ['cuerda', 3], ['cuerda', 3], ['circuito', 2], ['pilas', 3], ['tela', 3]].forEach(([m, n]) => giveP(pick(free), { mat: m, n }));
  giveP('c18', { mat: 'lente', n: 1 }); giveP('c19', { mat: 'aceite', n: 1 }); giveP('c20', { mat: 'circuito', n: 1 });
  for (const id in C) { if (id === 'fridge' || id === 'vault' || id === 'safe') continue; if (!hasStuff(C[id]) && Math.random() < 0.8) give(id, randLoot()[0]); }
  vault.loot.push({ mat: 'lente', n: 1 }); safe.loot.push({ mat: 'aceite', n: 2 });
  // multijugador: cada llave y material de progreso solo existe en el mapa de UN jugador (reparto por turnos); luego se comparte por la sala
  const SH = typeof MAP_SHARE !== 'undefined' ? MAP_SHARE : null;
  if (SH && SH.n > 1) { let k = 0; for (const id of Object.keys(C)) C[id].loot = C[id].loot.filter(l => !l.prog || (k++ % SH.n) === SH.i); }

  // ---------- decoración ----------
  const D = (f, kind, x, y, w = 1, h = 1) => obj(f, 'deco', x, y, { kind, w, h });
  D(0, 'plant', 13, 2); D(0, 'lamp', 2, 8); D(0, 'tv', 7, 2, 2, 1); D(0, 'plant', 2, 2);
  D(0, 'stove', 16, 2); D(0, 'plant', 22, 9);
  D(0, 'shelf', 28, 2, 2, 1); D(0, 'lamp', 30, 3); D(0, 'plant', 24, 9);
  D(0, 'boxes', 32, 8); D(0, 'boxes', 33, 8); D(0, 'lamp', 36, 9);
  D(0, 'boxes', 12, 17); D(0, 'boxes', 13, 17); D(0, 'lamp', 2, 16);
  D(0, 'plant', 17, 18); D(0, 'lamp', 22, 11); D(0, 'boxes', 24, 18); D(0, 'boxes', 25, 18); D(0, 'lamp', 33, 11);
  D(1, 'lamp', 10, 2); D(1, 'plant', 2, 8); D(1, 'lamp', 21, 2); D(1, 'plant', 13, 8); D(1, 'plant', 28, 8);
  D(1, 'lamp', 32, 2); D(1, 'plant', 37, 8); D(1, 'lamp', 10, 10); D(1, 'lamp', 26, 10); D(1, 'plant', 3, 12); D(1, 'plant', 36, 12);
  D(1, 'shelf', 8, 14, 3, 1); D(1, 'lamp', 12, 21); D(1, 'plant', 2, 21);
  D(1, 'boxes', 20, 15); D(1, 'boxes', 23, 15); D(1, 'boxes', 24, 21); D(1, 'boxes', 23, 21);
  D(1, 'lamp', 27, 21); D(1, 'plant', 37, 21); D(1, 'boxes', 36, 15);
  D(0, 'sofa', 6, 4, 3, 1); D(0, 'table', 9, 4, 2, 1);
  D(0, 'table', 18, 3, 2, 2); D(0, 'table', 19, 15, 3, 2);
  D(0, 'car', 8, 14, 4, 2); D(0, 'desk', 27, 6, 3, 1);
  D(0, 'shelf', 29, 15, 3, 1);
  D(1, 'bed', 8, 3, 2, 2); D(1, 'bed', 18, 5, 2, 2); D(1, 'bed', 34, 6, 2, 2); D(1, 'shelf', 4, 20, 4, 1); D(1, 'table', 30, 20, 3, 1);
  F[0].rugs = [{ x: 4, y: 5, w: 7, h: 4, c1: '#2a5a8a', c2: '#3a7ab0', c3: '#e8d8a0' }, { x: 17, y: 12, w: 5, h: 4, c1: '#7a2a3a', c2: '#a04050', c3: '#e8c880' }];
  F[1].rugs = [{ x: 4, y: 4, w: 5, h: 3, c1: '#3a7a4a', c2: '#4a9a5a', c3: '#e8e0a0' }, { x: 14, y: 6, w: 6, h: 2, c1: '#6a3a8a', c2: '#8a5aaa', c3: '#f0d0f0' }];

  // casillas sólidas por objetos (las puertas no cuentan; el hueco sí)
  for (let f = 0; f < 2; f++) for (const o of F[f].objs) if (o.type !== 'door') for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) F[f].sol[o.y + j][o.x + i] = true;
  const stairs = [F[0].objs.find(o => o.type === 'stairs'), F[1].objs.find(o => o.type === 'stairs')];
  const land = f => { const s = stairs[f]; return { x: s.x, y: s.y + 1 }; };
  return {
    f: F, code, stairs, land, keyAt,
    spawn: { f: 0, x: 5, y: 6 }, enemySpawn: { f: 0, x: 30, y: 16 },
    waypoints: [[0, 8, 6], [0, 18, 6], [0, 9, 15], [0, 20, 14], [0, 28, 15], [0, 27, 6], [1, 6, 5], [1, 17, 5], [1, 27, 5], [1, 34, 5], [1, 20, 11], [1, 7, 17], [1, 19, 17], [1, 32, 17], [1, 34, 11]],
  };
}
