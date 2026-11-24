'use strict';
// ===== Niveles grandes con laberintos, puertas con llave y verificación de alcance =====
// Suelo: '.' pasto  ',' camino  'a' piso de piedra  'f' flores  'm' hongos
// Sólidos: 'T' árbol 'R' roca 'W' muro 'C' muro agrietado 'G' puerta de diamantes '~' agua 'H' casa 'd' puerta de casa
//          'b' arbusto/seto 'k' antorcha  'X' puerta de bronce  'Y' puerta de plata  'Z' puerta de oro
const SOLID = 'TRWCG~HdbkXYZNP';
const DOORKEY = { X: 0, Y: 1, Z: 2 };
const KEYNAMES = ['bronce', 'plata', 'oro'];
const solidCh = c => SOLID.includes(c);
class Level {
  constructor(w, h, theme) {
    this.w = w; this.h = h; this.theme = theme;
    this.g = []; for (let y = 0; y < h; y++) this.g.push(new Array(w).fill('T'));
    this.ents = []; this.signs = []; this.hp = {}; this.diaNeed = 0; this.must = []; this.buildings = []; this.deco = []; this.train = null; this.station = null;
    this.start = [3, 3]; this.exit = null; this.gate = null; this.arena = null; this.seen = null;
  }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 'T'; return this.g[y][x]; }
  set(x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.g[y][x] = c; }
  fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c); }
  ent(type, tx, ty, extra) { this.ents.push(Object.assign({ type, tx, ty }, extra || {})); }
  sign(tx, ty, text) { this.signs.push({ x: (tx + .5) * T, y: (ty + 1) * T - 6, text }); }
  prop(k, tx, ty, o) { this.pu = this.pu || {}; this.pu[tx + ',' + ty] = this.get(tx, ty); this.deco.push(Object.assign({ k, x: tx, y: ty }, o || {})); if (!o || o.solid !== false) this.set(tx, ty, 'P'); }
  mustReach(tx, ty) { this.must.push([tx, ty]); }
  // edificio sólido con puerta; face 'S' (puerta al sur) o 'N' (puerta al norte)
  building(x0, y0, x1, y1, o) {
    this.fill(x0, y0, x1, y1, 'H'); const dx = o.dx != null ? o.dx : Math.floor((x0 + x1) / 2), dy = o.face === 'N' ? y0 : y1, fy = o.face === 'N' ? y0 - 1 : y1 + 1;
    this.set(dx, dy, 'd'); this.buildings.push(Object.assign({ x0, y0, x1, y1, dx, dy, fy, face: 'S' }, o)); this.mustReach(dx, fy); return [dx, fy];
  }
  // alcance: ¿se llega desde el inicio a todos los puntos obligatorios? (las puertas cuentan como abiertas)
  reachFrom(sx, sy, doorsOpen = true) {
    const seen = new Uint8Array(this.w * this.h), q = [[sx, sy]]; seen[sy * this.w + sx] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
        const i = ny * this.w + nx; if (seen[i]) continue;
        const c = this.g[ny][nx]; if (SOLID.includes(c) && !(doorsOpen && (DOORKEY[c] !== undefined || c === 'G'))) continue;
        seen[i] = 1; q.push([nx, ny]);
      }
    }
    return seen;
  }
  allReachable() { const r = this.reachFrom(this.start[0], this.start[1]); return this.must.every(([x, y]) => r[y * this.w + x]); }
  // coloca decoración al azar sin cortar ningún camino
  scatter(x0, y0, x1, y1, ch, n, seed, avoid = [], on = '.') {
    const r = mkRng(seed); let tries = n * 14;
    while (n > 0 && tries-- > 0) {
      const x = x0 + Math.floor(r() * (x1 - x0 + 1)), y = y0 + Math.floor(r() * (y1 - y0 + 1));
      if (this.get(x, y) !== on) continue;
      if (avoid.some(a => Math.abs(a[0] - x) <= a[2] && Math.abs(a[1] - y) <= a[2])) continue;
      if (this.must.some(m => Math.abs(m[0] - x) <= 1 && Math.abs(m[1] - y) <= 1)) continue;
      this.set(x, y, ch);
      if (SOLID.includes(ch) && !this.allReachable()) { this.set(x, y, on); continue; }
      n--;
    }
  }
}
// Laberinto de celdas de 2x2 casillas con muros de 1. Devuelve celdas, distancias y la entrada.
function carveMaze(L, x0, y0, cw, ch, seed, o) {
  const r = mkRng(seed), Wd = cw * 3 + 1, Hd = ch * 3 + 1, floor = o.floor, wall = o.wall;
  L.fill(x0, y0, x0 + Wd - 1, y0 + Hd - 1, wall);
  const cx = i => x0 + 1 + i * 3, cy = j => y0 + 1 + j * 3, id = (i, j) => j * cw + i;
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) L.fill(cx(i), cy(j), cx(i) + 1, cy(j) + 1, floor);
  const adj = Array.from({ length: cw * ch }, () => []);
  const link = (i, j, k, l) => {
    adj[id(i, j)].push(id(k, l)); adj[id(k, l)].push(id(i, j));
    if (k > i) L.fill(cx(i) + 2, cy(j), cx(i) + 2, cy(j) + 1, floor); else if (k < i) L.fill(cx(k) + 2, cy(j), cx(k) + 2, cy(j) + 1, floor);
    else if (l > j) L.fill(cx(i), cy(j) + 2, cx(i) + 1, cy(j) + 2, floor); else L.fill(cx(i), cy(l) + 2, cx(i) + 1, cy(l) + 2, floor);
  };
  const seen = new Uint8Array(cw * ch), st = [[0, 0]]; seen[0] = 1;
  while (st.length) {
    const [i, j] = st[st.length - 1], nb = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + dx, b = j + dy; if (a >= 0 && b >= 0 && a < cw && b < ch && !seen[id(a, b)]) nb.push([a, b]); }
    if (!nb.length) { st.pop(); continue; }
    const [a, b] = nb[Math.floor(r() * nb.length)]; seen[id(a, b)] = 1; link(i, j, a, b); st.push([a, b]);
  }
  const braid = o.braid == null ? .1 : o.braid;   // atajos para que no sea un árbol perfecto
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const a = i + dx, b = j + dy; if (a >= cw || b >= ch || adj[id(i, j)].includes(id(a, b))) continue;
    if (r() < braid) link(i, j, a, b);
  }
  // entrada
  const ent = o.entrance, ei = ent.side === 'W' ? 0 : ent.side === 'E' ? cw - 1 : ent.row, ej = ent.side === 'N' ? 0 : ent.side === 'S' ? ch - 1 : ent.row;
  let ex = 0, ey = 0, ow = 1, oh = 1, bx = 0, by = 0;
  if (ent.side === 'W') { bx = x0; by = cy(ej); ex = x0 - 1; ey = by; ow = 1; oh = 2; }
  if (ent.side === 'E') { bx = x0 + Wd - 1; by = cy(ej); ex = bx + 1; ey = by; ow = 1; oh = 2; }
  if (ent.side === 'N') { bx = cx(ei); by = y0; ex = bx; ey = y0 - 1; ow = 2; oh = 1; }
  if (ent.side === 'S') { bx = cx(ei); by = y0 + Hd - 1; ex = bx; ey = by + 1; ow = 2; oh = 1; }
  L.fill(bx, by, bx + ow - 1, by + oh - 1, floor);
  // distancias desde la entrada
  const start = id(ei, ej), dist = new Array(cw * ch).fill(-1), q = [start]; dist[start] = 0;
  while (q.length) { const c = q.shift(); for (const n of adj[c]) if (dist[n] < 0) { dist[n] = dist[c] + 1; q.push(n); } }
  const cells = []; for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) cells.push({ i, j, tx: cx(i), ty: cy(j), d: dist[id(i, j)], deg: adj[id(i, j)].length });
  const far = cells.slice().sort((a, b) => b.d - a.d), dead = cells.filter(c => c.deg === 1 && c.d > 2);
  return { cells, far, dead, entrance: { bx, by, ex, ey, ow, oh, side: ent.side }, W: Wd, H: Hd, x0, y0 };
}
const pick = (arr, r) => arr[Math.floor(r() * arr.length)];

// ---- Nivel 0: la ciudad de Diamantia (calles, casas de los compas y estación de tren) ----
const INTERIOR_INFO = {};
function level0() {
  const L = new Level(110, 80, 'city'); L.diaNeed = 3; L.start = [9, 66];
  const R = (a, b, c, d, ch = '.') => L.fill(a, b, c, d, ch), r = mkRng(17);
  R(3, 3, 106, 76);
  // avenidas y calles
  R(3, 63, 106, 68, ','); R(3, 38, 87, 41, ','); R(3, 16, 106, 19, ',');
  for (const x of [24, 48, 76]) R(x, 16, x + 3, 68, ',');
  // plaza central con fuente
  R(40, 22, 60, 35, 'a'); R(48, 26, 52, 30, '~');
  // parque del norte-este
  R(62, 21, 75, 35, 'f'); R(62, 28, 75, 28, 'a'); R(68, 21, 68, 35, 'a'); R(65, 25, 71, 31, 'a'); R(67, 27, 69, 29, '~');
  // estación
  R(88, 27, 106, 50, 'a'); R(88, 27, 88, 50, 'W'); R(88, 38, 88, 41, 'G'); R(91, 28, 105, 32, 'N');
  L.train = { x0: 91, y0: 28, x1: 105, y1: 32 }; L.trainDoors = [[94.5 * T, 33.2 * T], [98.5 * T, 33.2 * T], [102.5 * T, 33.2 * T]]; L.station = { x0: 89, y0: 34, x1: 106, y1: 49 };
  L.gate = { x: 88 * T, y: 38 * T, w: T, h: 4 * T, tiles: [[88, 38], [88, 39], [88, 40], [88, 41]], station: true };
  // casas de los compas
  const mike = L.building(6, 69, 13, 75, { id: 'mike', color: '#e8c24a', roof: '#c0392b', label: 'CASA DE MIKE', face: 'N' });
  const post = L.building(14, 56, 21, 62, { id: 'ambrosio', color: '#f2d24a', roof: '#d35400', label: 'CORREOS' });
  const timba = L.building(30, 56, 37, 62, { id: 'timba', color: '#5b8de8', roof: '#2a3f8a', label: 'CASA DE TIMBA' });
  const rius = L.building(56, 56, 63, 62, { id: 'rius', color: '#f0e0b0', roof: '#c0392b', label: 'GRANJA DE RIUS' });
  const mayo = L.building(84, 56, 91, 62, { id: 'mayo', color: '#ecebf5', roof: '#cc2a2a', label: 'PIZZERÍA MAYO' });
  const ace = L.building(8, 31, 15, 37, { id: 'acenix', color: '#f6b6d2', roof: '#d6609a', label: 'CAFÉ GATUNO' });
  const esp = L.building(30, 9, 38, 15, { id: 'esparta', color: '#9ab8e8', roof: '#3a68b8', label: 'CASA DE ESPARTA' });
  const rap = L.building(56, 9, 63, 15, { id: 'raptor', color: '#e85a5a', roof: '#7a2a2a', label: 'TIENDA DE ANIME' });
  const inv = L.building(84, 9, 92, 15, { id: 'invictor', color: '#f4efe6', roof: '#b82a2a', label: 'VILLA ROMANA' });
  // restaurante
  const rest = L.building(37, 43, 46, 49, { id: 'restaurant', color: '#fff4e0', roof: '#2a8a5a', label: 'RESTAURANTE LA ESTRELLA' });
  // casas blancas del vecindario
  const roofs = ['#c0553a', '#3a6aa8', '#7a4a8a', '#3a8a5a', '#b8742a', '#a83a4a'], whites = [];
  const house = (x0, y0, i) => { whites.push(L.building(x0, y0, x0 + 6, y0 + 5, { id: 'house', color: i % 5 === 3 ? '#f4efe0' : '#fbfbf8', roof: roofs[i % roofs.length], label: 'CASA ' + (10 + i * 3) })); };
  let hi = 0;
  for (const x of [5, 13, 29, 53, 61, 68, 80]) house(x, 44, hi++);
  for (const x of [5, 29, 81, 88 > 0 ? 95 : 0]) { if (x < 88 || x > 93) house(x, 21, hi++); }
  for (const x of [5, 14, 44, 76, 96]) house(x, 8, hi++);
  for (const x of [30, 40, 54, 66, 82]) house(x, 70, hi++);
  // personajes en las puertas
  const npcAt = (id, p, extra) => L.ent('npc', p[0], p[1], Object.assign({ id }, extra || {}));
  npcAt('trolino', [mike[0] + 2, mike[1] - 1], { hideAfter: 'trainDone' }); L.ent('npc', 44, 24, { id: 'ambrosio', job: 'perritos', shop: true }); L.ent('npc', 96, 36, { id: 'ambrosio', job: 'conductor' }); L.ent('npc', 42, 54, { id: 'ambrosio', job: 'mesero' }); L.ent('npc', 74, 60, { id: 'ambrosio', job: 'dj' });
  for (const [bx, by] of [[50, 34], [9, 64], [96, 44], [68, 36], [100, 66]]) L.ent('bonfire', bx, by);
  npcAt('aquela', [mike[0] - 2, mike[1] - 1]);
  // ciudadanos que pasean
  const cit = [[30, 65], [44, 66], [70, 65], [95, 66], [20, 40], [56, 40], [45, 28], [57, 24], [26, 30], [78, 50], [50, 18], [100, 18], [66, 30], [41, 52], [60, 66], [36, 40]];
  cit.forEach((p, i) => L.ent('citizen', p[0], p[1], { seed: i + 1 }));
  // diamantes escondidos y corazones
  L.ent('dia', 6, 52); L.ent('dia', 70, 11); L.ent('dia', 102, 60);
  for (const p of [[22, 66], [40, 40], [60, 18], [80, 65], [96, 40], [10, 40], [45, 24], [30, 18]]) L.ent('heart', p[0], p[1]);
  for (const p of [mike, post, timba, rius, mayo, ace, esp, rap, inv, rest, ...whites]) L.mustReach(p[0], p[1]);
  for (const [x, y] of [[9, 66], [6, 52], [70, 11], [102, 60], [87, 39], [89, 39], [96, 40], [50, 33], [45, 28]]) L.mustReach(x, y);
  // ----- decoración estructurada -----
  // plaza: fuente con borde, bancas, puestos
  for (let x = 47; x <= 53; x++) for (const y of [25, 31]) L.prop('rim', x, y, { solid: false });
  for (let y = 26; y <= 30; y++) for (const x of [47, 53]) L.prop('rim', x, y, { solid: false });
  L.deco.push({ k: 'statue', x: 50, y: 28 });
  for (const [x, y, rot] of [[44, 28, 1], [56, 28, 3], [46, 33, 0], [54, 33, 0]]) L.prop('bench', x, y, { rot });
  for (const [x, y, c] of [[42, 23, '#e84a4a'], [45, 23, '#4a8ae8'], [55, 23, '#e8c24a'], [58, 23, '#58b848']]) L.prop('stall', x, y, { c });
  // parque: glorieta, bancas, farolas, pozo
  L.prop('gazebo', 64, 23, { solid: true });
  for (const [x, y, rot] of [[66, 28, 0], [70, 28, 0], [68, 24, 2], [68, 33, 0], [72, 25, 1], [72, 31, 3]]) L.prop('bench', x, y, { rot });
  for (const [x, y] of [[65, 22], [72, 22], [65, 34], [73, 34], [63, 27], [74, 29]]) L.prop('tree2', x, y);
  // restaurante: terraza con mesas y sombrillas
  for (const [x, y, c] of [[38, 52, '#e84a4a'], [41, 52, '#ffd24a'], [44, 52, '#4a8ae8']]) L.prop('table', x, y, { c });
  // vecindario: buzones, setos, barriles
  for (const b of [...whites, mike, post, timba, rius, mayo, ace]) { /* flores junto a la puerta */ }
  for (const bd of L.buildings) { if (bd.id === 'house') { const fy = bd.fy; for (const dx of [-2, 2]) { const x = bd.dx + dx, y = fy; if (L.get(x, y) === '.') L.set(x, y, 'f'); } L.prop('mail', bd.dx + 2, bd.fy - 0, { solid: false }); } }
  // árboles en hilera junto a las avenidas
  for (let x = 6; x <= 104; x += 6) for (const y of [62, 69]) if (L.get(x, y) === '.' ) L.set(x, y, 'T');
  for (let x = 7; x <= 104; x += 6) for (const y of [37, 42]) if (L.get(x, y) === '.') L.set(x, y, 'T');
  const keep = [[9, 66, 3]];
  L.scatter(3, 3, 106, 76, 'T', 60, 31, keep, '.'); L.scatter(3, 3, 106, 76, 'b', 80, 32, keep, '.'); L.scatter(3, 3, 106, 76, 'R', 12, 33, keep, '.');
  L.scatter(3, 3, 106, 76, 'f', 520, 34, [], '.'); L.scatter(3, 3, 106, 76, 'm', 40, 35, [], '.');
  for (let x = 8; x <= 104; x += 8) for (const y of [63, 68, 38, 41, 16, 19]) { if (L.get(x, y) === ',') { L.set(x, y, 'k'); if (!L.allReachable()) L.set(x, y, ','); } }
  // letreros
  L.sign(9, 67, 'Calle de Mike  ·  Correos está al este →');
  L.sign(18, 64, 'CORREOS: ¡Ambrosio necesita ayuda!');
  L.sign(50, 36, 'Plaza de Diamantia');
  L.sign(86, 42, 'ESTACIÓN  →  (abre cuando entregues todas las cartas)');
  L.sign(6, 54, '¿Ese brillo es un diamante?');
  L.sign(68, 20, 'Parque de las Estrellas');
  L.sign(70, 12, '¡algo brilla por aquí!');
  L.sign(100, 62, 'Rincón del Sureste');
  L.sign(41, 51, 'Restaurante La Estrella  ·  ¡Hoy hay pizza!');
  // puertas: cada edificio se puede visitar por dentro
  const ZID = { mike: 10, ambrosio: 11, timba: 12, rius: 13, mayo: 14, acenix: 15, esparta: 16, raptor: 17, invictor: 18, restaurant: 19 }; let wk = 0; L.exits = [];
  for (const b of L.buildings) { b.zone = ZID[b.id] || (20 + wk++); INTERIOR_INFO[b.zone] = { id: b.id, seed: b.zone, out: [b.dx, b.face === 'N' ? b.fy - 1 : b.fy], label: b.label };
    L.exits.push({ door: true, key: b.face === 'N' ? 'down' : 'up', x0: b.dx, x1: b.dx, y0: b.fy, y1: b.fy, to: b.zone, spawn: [7, 7], lock: null }); }
  L.prop('xtree', 50, 23);
  L.prop('portal', 99, 47, { solid: false, lock: 'train', to: 1 }); L.exits.push({ x0: 97, y0: 46, x1: 101, y1: 48, to: 1, spawn: [60, 77], lock: 'train', msg: 'El portal del Valle del Sueño aún no se abre... ¡sigue la historia!' });
  return L;
}

// ---- Nivel 1: Valle del Sueño (grande, con laberintos y llaves) ----
function buildValley(theme, so, SG, EX) {
  const L = new Level(120, 84, theme); L.diaNeed = 3; L.start = [61, 75];
  const R = (a, b, c, d, ch = '.') => L.fill(a, b, c, d, ch), r = mkRng(7 + so);
  // zona central
  R(48, 60, 72, 78);
  // ---- A: ruinas del oeste (laberinto) → llave de bronce
  const A = carveMaze(L, 6, 54, 10, 8, 11 + so, { floor: 'a', wall: 'W', entrance: { side: 'E', row: 4 }, braid: .12 });
  R(A.entrance.ex, A.entrance.ey, 47, A.entrance.ey + 1, ',');
  // ---- B: bosque de almohadas (claro enorme)
  R(44, 28, 78, 40); R(28, 10, 50, 26);
  // marcos de seto que hacen cada zona un cuadrado claro
  const frame = (x0, y0, x1, y1) => { for (let x = x0 - 1; x <= x1 + 1; x++) for (const y of [y0 - 1, y1 + 1]) if (L.get(x, y) === 'T') L.set(x, y, 'b'); for (let y = y0 - 1; y <= y1 + 1; y++) for (const x of [x0 - 1, x1 + 1]) if (L.get(x, y) === 'T') L.set(x, y, 'b'); };
  frame(44, 28, 78, 40); frame(28, 10, 50, 26); frame(48, 60, 72, 78);
  R(58, 41, 60, 59, ','); R(58, 50, 60, 50, 'X'); R(47, 27, 49, 27, ',');
  // ---- C: pantano (laberinto de setos) → llave de oro y diamante 2
  const C = carveMaze(L, 92, 14, 8, 9, 22 + so, { floor: ',', wall: 'b', entrance: { side: 'W', row: 4 }, braid: .12 });
  R(79, C.entrance.ey, C.entrance.ex, C.entrance.ey + 1, ','); R(85, C.entrance.ey, 85, C.entrance.ey + 1, 'Y');
  // ---- D: cámara de oro (laberinto grande) → diamante 3
  const D = carveMaze(L, 78, 52, 11, 8, 33 + so, { floor: 'a', wall: 'W', entrance: { side: 'W', row: 4 }, braid: .1 });
  R(73, D.entrance.ey, D.entrance.ex, D.entrance.ey + 1, ','); R(75, D.entrance.ey, 75, D.entrance.ey + 1, 'Z');
  // ---- arena del jefe y puerta de diamantes (al oeste del bosque)
  R(6, 16, 23, 26, 'a'); R(5, 15, 24, 15, 'W'); R(5, 27, 24, 27, 'W'); R(5, 15, 5, 27, 'W'); R(24, 15, 24, 27, 'W');
  R(24, 20, 24, 22, 'G'); R(25, 20, 29, 22, ',');
  for (const [x, y] of [[10, 19], [10, 23], [19, 19], [19, 23]]) L.set(x, y, 'R');
  for (const [x, y] of [[7, 17], [7, 25], [22, 17], [22, 25], [23, 19], [23, 23]]) L.set(x, y, 'k');
  L.gate = { x: 24 * T, y: 20 * T, w: T, h: 3 * T, tiles: [[24, 20], [24, 21], [24, 22]] };
  L.arena = { x0: 6 * T, y0: 16 * T, x1: 24 * T, y1: 27 * T, trigger: 21 * T, dir: -1, spawn: [10 * T, 21.5 * T], enter: [22.5 * T, 21.5 * T] };
  // ---- diamante 1 en un escondite del bosque (cercado de rocas con una sola entrada)
  for (let x = 33; x <= 39; x++) for (let y = 14; y <= 20; y++) if (x === 33 || x === 39 || y === 14 || y === 20) L.set(x, y, 'R');
  L.set(36, 20, '.');
  // ---- puntos clave
  const kA = A.far[0], dC = C.far[0], kC = C.far.find(c => Math.abs(c.i - dC.i) + Math.abs(c.j - dC.j) > 5), dD = D.far[0];
  L.ent('key', kA.tx, kA.ty, { k: 0 });
  L.ent('dia', 36, 17);
  L.ent('key', 74, 31, { k: 1 });
  L.ent('dia', dC.tx, dC.ty); L.ent('key', kC.tx, kC.ty, { k: 2 });
  L.ent('dia', dD.tx, dD.ty);
  for (const [x, y] of [[kA.tx, kA.ty], [36, 17], [74, 31], [dC.tx, dC.ty], [kC.tx, kC.ty], [dD.tx, dD.ty], [61, 75], [58, 49], [59, 51], [84, C.entrance.ey], [86, C.entrance.ey], [74, D.entrance.ey], [76, D.entrance.ey], [26, 21], [22, 21], [36, 22], [47, A.entrance.ey]]) L.mustReach(x, y);
  for (let x = 79; x <= 91; x++) for (let y = C.entrance.ey; y <= C.entrance.ey + 1; y++) L.mustReach(x, y);
  for (let x = 25; x <= 30; x++) L.mustReach(x, 21);
  // ---- decoración sin cortar caminos
  const keep = [[61, 75, 4], [36, 17, 2], [74, 31, 3], [47, 27, 2]];
  L.scatter(48, 60, 72, 78, 'T', 14, 21 + so, keep); L.scatter(48, 60, 72, 78, 'R', 6, 22 + so, keep); L.scatter(48, 60, 72, 78, 'b', 16, 23 + so, keep);
  R(40, 20, 48, 26, '~'); R(60, 28, 70, 35, '~'); R(44, 33, 50, 37, '~');
  L.scatter(44, 28, 78, 40, 'T', 40, 24 + so, keep); L.scatter(44, 28, 78, 40, 'R', 10, 25 + so, keep); L.scatter(28, 10, 50, 26, 'T', 22, 34 + so, keep); L.scatter(28, 10, 50, 26, 'R', 8, 35 + so, keep); L.scatter(28, 10, 50, 26, 'b', 14, 36 + so, keep); L.scatter(44, 28, 78, 40, 'b', 16, 26 + so, keep);
  L.scatter(44, 28, 78, 40, 'm', 60, 27 + so, [], '.'); L.scatter(28, 10, 50, 26, 'f', 90, 37 + so, [], '.'); L.scatter(48, 60, 72, 78, 'm', 40, 28 + so, [], '.');
  for (const [x, y] of [[56, 70], [66, 70], [56, 64], [66, 64], [46, 30], [76, 30], [46, 32], [76, 38], [30, 12], [48, 12], [30, 24], [48, 24]]) L.set(x, y, 'k');
  // ---- enemigos
  const openIn = (x0, y0, x1, y1, ch = '.') => { const a = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (L.get(x, y) === ch) a.push([x, y]); return a; };
  const place = (arr, type, n, minD = 0) => { let k = 0, t = 0; while (k < n && t++ < n * 30) { const [x, y] = pick(arr, r); if (Math.hypot(x - 61, y - 75) < minD) continue; if (L.ents.some(e => Math.abs(e.tx - x) < 2 && Math.abs(e.ty - y) < 2)) continue; L.ent(type, x, y); k++; } };
  place(openIn(48, 60, 72, 78), 'slime', 5, 8);
  place(openIn(44, 28, 78, 40), 'slime', 9, 6); place(openIn(44, 28, 78, 40), 'flyer', 6, 6); place(openIn(28, 10, 50, 26), 'slime', 8, 6); place(openIn(28, 10, 50, 26), 'flyer', 5, 6);
  for (const M of [A, D]) { const cs = M.cells.filter(c => c.d > 3); for (let i = 0; i < 10; i++) { const c = pick(cs, r); L.ent(i % 3 === 0 ? 'flyer' : 'slime', c.tx, c.ty); } }
  { const cs = C.cells.filter(c => c.d > 3); for (let i = 0; i < 9; i++) { const c = pick(cs, r); L.ent(i % 2 ? 'flyer' : 'slime', c.tx, c.ty); } }
  L.ent('flyer', 72, 30); L.ent('flyer', 76, 33); L.ent('slime', 74, 34);   // guardianes de la llave de plata
  for (const M of [A, C, D]) for (const c of M.dead.slice(0, 3)) if (c !== M.far[0]) L.ent('heart', c.tx, c.ty);
  L.ent('heart', 58, 72); L.ent('heart', 64, 72); L.ent('heart', 32, 22); L.ent('heart', 76, 36); L.ent('heart', 40, 12);
  L.ent('npc', 61, 72, { id: 'aquela' });
  // ---- zonas opcionales: oleadas + parkour (norte), guarida del mini jefe (oeste) y cofre en el pantano
  R(52, 8, 86, 21, '.'); frame(52, 8, 86, 21); R(52, 22, 54, 27, ','); R(52, 28, 54, 29, '.');
  L.trials = [{ x: 60, y: 14, r: 150, n: 7, reward: EX.rw.trial }]; L.ent('heart', 56, 10); L.ent('heart', 66, 19);
  R(70, 9, 85, 20, '~'); R(84, 12, 86, 17, '.');
  const path = [[70, 14], [71, 14], [72, 14], [73, 14], [73, 13], [74, 13], [75, 13], [75, 12], [76, 12], [77, 12], [77, 13], [78, 13], [78, 14], [79, 14], [80, 14], [80, 15], [81, 15], [82, 15], [83, 15]], stones = [];
  for (const [x, y] of path) for (const yy of [y, y + 1]) { L.set(x, yy, 'v'); stones.push([x, yy]); }
  L.park = { start: [69, 14], tiles: stones }; L.ent('chest', 85, 14, { w: EX.rw.park });
  L.scatter(52, 8, 69, 21, 'f', 40, 41 + so, [], '.');
  L.sign(58, 20, 'Cámara de las Oleadas: pisa el círculo, sobrevive y gana un cofre'); L.sign(68, 16, 'PARKOUR: las baldosas se rompen. ¡No te detengas!');
  R(29, 32, 42, 46, '.'); frame(29, 32, 42, 46); R(42, 38, 52, 39, ',');
  L.ent('mini', 35, 39, { name: EX.rw.miniName || 'Rey Slime', drop: EX.rw.mini }); L.sign(30, 34, 'Guarida del Rey Slime  (jefe opcional: suelta un arma)'); L.ent('heart', 31, 44);
  { const cdd = C.dead[3] || C.dead[C.dead.length - 1]; if (cdd) { L.ent('chest', cdd.tx, cdd.ty, { w: EX.rw.chest }); L.mustReach(cdd.tx, cdd.ty); } }
  for (const [x, y] of [[53, 22], [53, 27], [53, 29], [69, 14], [85, 14], [60, 14], [35, 39], [44, 38], [31, 44]]) L.mustReach(x, y);
  for (const [x, y] of [[64, 73], [27, 23], [58, 10], [52, 31]]) L.ent('bonfire', x, y);
  // portales entre zonas
  R(58, 79, 62, 81, ','); L.prop('portal', 60, 80, { solid: false, to: EX.back[0] }); L.exits = [{ x0: 58, y0: 80, x1: 62, y1: 81, to: EX.back[0], spawn: EX.back[1], lock: null }];
  if (EX.home) { R(64, 79, 66, 81, ','); L.prop('portal', 65, 80, { solid: false, to: 0, home: true }); L.exits.push({ x0: 64, y0: 80, x1: 66, y1: 81, to: 0, spawn: [99, 45], lock: null }); for (let x = 64; x <= 66; x++) for (let y = 79; y <= 81; y++) L.mustReach(x, y); }
  if (EX.next) { L.prop('portal', 8, 21, { solid: false, lock: 'boss', to: EX.next[0] }); L.exits.push({ x0: 7, y0: 20, x1: 8, y1: 22, to: EX.next[0], spawn: EX.next[1], lock: 'boss', msg: 'El portal está dormido... derrota al jefe para abrirlo' }); }
  for (let x = 58; x <= 62; x++) for (let y = 79; y <= 81; y++) L.mustReach(x, y);
  { const sn = L.reachFrom(L.start[0], L.start[1], true); for (const e of L.ents) if (e.type === 'heart' && !sn[e.ty * L.w + e.tx]) { let best = null, bd = 1e9; for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) { const x = e.tx + dx, y = e.ty + dy; if (x > 0 && y > 0 && x < L.w && y < L.h && sn[y * L.w + x] && !SOLID.includes(L.get(x, y)) && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = [x, y]; } } if (best) { e.tx = best[0]; e.ty = best[1]; } } }
  // cartelitos
  SG.forEach((t, i) => { const P_ = [[60, 76], [53, 68], [67, 68], [56, 57], [34, 23], [80, C.entrance.ey + 3], [28, 24], [45, 18]][i]; L.sign(P_[0], P_[1], t); });
  return L;
}
const ZDEF = [null,
  { theme: 'dream', so: 0, name: 'VALLE DEL SUEÑO', boss: 'Timba', rw: { mini: 'axe', trial: 'spear', park: 'fire', chest: 'crossbow', miniName: 'Rey Slime' } },
  { theme: 'sweet', so: 100, name: 'PASTELANDIA', boss: 'Acenix', rw: { mini: 'katana', trial: 'boom', park: 'club', chest: 'coins:40', miniName: 'Gelatina Real' } },
  { theme: 'farm', so: 270, name: 'GRANJA DEL AMANECER', boss: 'Rius', rw: { mini: 'coins:35', trial: 'coins:30', park: 'coins:45', chest: 'coins:25', miniName: 'Espantapájaros' } },
  { theme: 'factory', so: 300, name: 'FÁBRICA DE PIZZA', boss: 'Mayo', rw: { mini: 'coins:40', trial: 'coins:35', park: 'coins:50', chest: 'coins:30', miniName: 'Horno Gigante' } },
  { theme: 'cloud', so: 400, name: 'JARDÍN DE NUBES', boss: 'Esparta', rw: { mini: 'coins:45', trial: 'coins:40', park: 'coins:55', chest: 'coins:35', miniName: 'Nubarrón' } },
  { theme: 'neon', so: 500, name: 'CIUDAD NEÓN', boss: 'Raptor', rw: { mini: 'coins:50', trial: 'coins:45', park: 'coins:60', chest: 'coins:40', miniName: 'Robot Otaku' } },
  { theme: 'colosseum', so: 600, name: 'COLISEO ROMANO', boss: 'Invictor', rw: { mini: 'coins:55', trial: 'coins:50', park: 'coins:65', chest: 'coins:45', miniName: 'Gladiador Slime' } },
  { theme: 'void', so: 700, name: 'CÓDIGO CORRUPTO', boss: 'Mike Maligno', rw: { mini: 'coins:60', trial: 'coins:55', park: 'coins:70', chest: 'coins:50', miniName: 'Bug Gigante' } }];
const zoneLevel = n => () => { const d = ZDEF[n]; return buildValley(d.theme, d.so, [d.name + '  —  ¡explora sus zonas!', '← Ruinas del oeste  (laberinto)', 'Cámara del tesoro  →  (necesita la llave de oro)', '↑ Puerta de bronce al claro del bosque', 'Un cercado de rocas... ¡algo brilla!', 'Puerta de plata  →  Pantano de setos', d.boss + ' espera al oeste.  3 diamantes abren la puerta', 'Hay puertas de colores: busca sus llaves'], { back: [n - 1, n === 1 ? [99, 45] : [9, 21]], next: n < 8 ? [n + 1, [61, 76]] : null, home: n > 1, rw: d.rw }); };
const level1 = zoneLevel(1), level2 = zoneLevel(2), level3 = zoneLevel(3), level4 = zoneLevel(4), level5 = zoneLevel(5), level6 = zoneLevel(6), level7 = zoneLevel(7), level8 = zoneLevel(8);
// comprueba que el nivel se puede completar aunque las puertas empiecen cerradas
function verifyLevel(L) {
  const have = [false, false, false], opened = {}, missing = [];
  const bfs = () => {
    const seen = new Uint8Array(L.w * L.h), q = [[L.start[0], L.start[1]]]; seen[L.start[1] * L.w + L.start[0]] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) continue;
        const i = ny * L.w + nx; if (seen[i]) continue; const c = L.g[ny][nx];
        if (SOLID.includes(c) && !(DOORKEY[c] !== undefined && opened[c]) && c !== 'G') continue; seen[i] = 1; q.push([nx, ny]);
      }
    }
    return seen;
  };
  let seen;
  for (let it = 0; it < 8; it++) {
    seen = bfs();
    for (const e of L.ents) if (e.type === 'key' && seen[e.ty * L.w + e.tx]) have[e.k] = true;
    for (const c in DOORKEY) if (have[DOORKEY[c]]) opened[c] = true;
  }
  for (const e of L.ents) if (['dia', 'key', 'npc', 'heart'].includes(e.type) && !seen[e.ty * L.w + e.tx]) missing.push(e.type + '@' + e.tx + ',' + e.ty);
  if (L.gate) { const g = L.gate.tiles[0]; if (!seen[g[1] * L.w + g[0] - 1]) missing.push('puerta-jefe'); }
  return { ok: missing.length === 0, missing };
}
const LEVELS = [level0, level1, level2, level3, level4, level5, level6, level7, level8];
function interiorLevel(z) {
  if (!INTERIOR_INFO[z]) level0();
  const inf = INTERIOR_INFO[z], L = new Level(15, 10, 'indoor'); L.start = [7, 7];
  L.fill(0, 0, 14, 9, 'W'); L.fill(1, 1, 13, 8, 'a'); L.fill(0, 9, 14, 9, 'P');
  const blk = (x, y) => L.set(x, y, 'P'), kitchen = ['mayo', 'acenix', 'restaurant', 'ambrosio'].includes(inf.id), cols = [0xe85a5a, 0x4a8ae8, 0x58b858, 0xe8c24a, 0xb06ad8];
  L.prop('rug', 7, 5, { solid: false, w: 5, h: 3, c: [0xb84a5a, 0x3a6aa8, 0x3a8a5a][inf.seed % 3] }); L.prop('rug', 7, 8, { solid: false, w: 2.5, h: 1, c: 0x8a5a30 });
  L.prop('bed', 2, 2, { c: cols[inf.seed % 5] }); blk(2, 3); blk(3, 2); blk(3, 3);
  L.prop('shelf', 11, 1, {}); blk(12, 1); L.prop('plant', 13, 2, {}); L.prop('plant', 1, 7, {});
  if (kitchen) { L.prop('stove', 9, 1, {}); L.prop('tableR', 11, 5, {}); blk(12, 5); blk(10, 5); } else L.prop('tableR', 11, 5, {});
  if (inf.id === 'restaurant') { L.prop('tableR', 4, 6, {}); L.prop('tableR', 7, 3, {}); }
  L.sign(7, 7, inf.label ? inf.label : 'Una casa acogedora');
  const owner = inf.id === 'house' ? null : inf.id;
  if (owner && owner !== 'mike') L.ent('npc', 7, 5, owner === 'ambrosio' ? { id: owner, shop: true } : { id: owner, owner });
  if (inf.id === 'house') L.ent('citizen', 7, 5, { seed: (inf.seed % 6) + 1 });
  L.exits = [{ x0: 6, y0: 8, x1: 8, y1: 8, to: 0, spawn: inf.out, lock: null }];
  for (const [x, y] of [[7, 7], [7, 8]]) L.mustReach(x, y);
  return L;
}
for (let z = 10; z <= 40; z++) LEVELS[z] = () => interiorLevel(z);
