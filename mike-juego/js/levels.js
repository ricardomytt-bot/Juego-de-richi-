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
  const esp = L.building(30, 9, 38, 15, { id: 'esparta', color: '#9ab8e8', roof: '#3a68b8', label: 'GIMNASIO ESPARTA' });
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
  npcAt('trolino', [mike[0] + 2, mike[1] - 1]); npcAt('ambrosio', post); npcAt('timba', timba); npcAt('rius', rius); npcAt('mayo', mayo);
  npcAt('acenix', ace); npcAt('esparta', esp); npcAt('raptor', rap); npcAt('invictor', inv);
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
  return L;
}

// ---- Nivel 1: Valle del Sueño (grande, con laberintos y llaves) ----
function level1() {
  const L = new Level(120, 84, 'dream'); L.diaNeed = 3; L.start = [61, 75];
  const R = (a, b, c, d, ch = '.') => L.fill(a, b, c, d, ch), r = mkRng(7);
  // zona central
  R(48, 60, 72, 78);
  // ---- A: ruinas del oeste (laberinto) → llave de bronce
  const A = carveMaze(L, 6, 54, 10, 8, 11, { floor: 'a', wall: 'W', entrance: { side: 'E', row: 4 }, braid: .12 });
  R(A.entrance.ex, A.entrance.ey, 47, A.entrance.ey + 1, ',');
  // ---- B: bosque de almohadas (claro enorme)
  R(30, 12, 78, 40);
  R(58, 41, 60, 59, ','); R(58, 50, 60, 50, 'X');
  // ---- C: pantano (laberinto de setos) → llave de oro y diamante 2
  const C = carveMaze(L, 92, 14, 8, 9, 22, { floor: ',', wall: 'b', entrance: { side: 'W', row: 4 }, braid: .12 });
  R(79, C.entrance.ey, C.entrance.ex, C.entrance.ey + 1, ','); R(85, C.entrance.ey, 85, C.entrance.ey + 1, 'Y');
  // ---- D: cámara de oro (laberinto grande) → diamante 3
  const D = carveMaze(L, 78, 52, 11, 8, 33, { floor: 'a', wall: 'W', entrance: { side: 'W', row: 4 }, braid: .1 });
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
  L.ent('key', 74, 16, { k: 1 });
  L.ent('dia', dC.tx, dC.ty); L.ent('key', kC.tx, kC.ty, { k: 2 });
  L.ent('dia', dD.tx, dD.ty);
  for (const [x, y] of [[kA.tx, kA.ty], [36, 17], [74, 16], [dC.tx, dC.ty], [kC.tx, kC.ty], [dD.tx, dD.ty], [61, 75], [58, 49], [59, 51], [84, C.entrance.ey], [86, C.entrance.ey], [74, D.entrance.ey], [76, D.entrance.ey], [26, 21], [22, 21], [36, 22], [47, A.entrance.ey]]) L.mustReach(x, y);
  for (let x = 79; x <= 91; x++) for (let y = C.entrance.ey; y <= C.entrance.ey + 1; y++) L.mustReach(x, y);
  for (let x = 25; x <= 30; x++) L.mustReach(x, 21);
  // ---- decoración sin cortar caminos
  const keep = [[61, 75, 4], [36, 17, 2], [74, 16, 3]];
  L.scatter(48, 60, 72, 78, 'T', 14, 21, keep); L.scatter(48, 60, 72, 78, 'R', 6, 22, keep); L.scatter(48, 60, 72, 78, 'b', 16, 23, keep);
  R(40, 20, 48, 26, '~'); R(60, 28, 70, 35, '~'); R(44, 33, 50, 37, '~');
  L.scatter(30, 12, 78, 40, 'T', 70, 24, keep); L.scatter(30, 12, 78, 40, 'R', 20, 25, keep); L.scatter(30, 12, 78, 40, 'b', 36, 26, keep);
  L.scatter(30, 12, 78, 40, 'm', 90, 27, [], '.'); L.scatter(48, 60, 72, 78, 'm', 40, 28, [], '.');
  for (const [x, y] of [[56, 70], [66, 70], [56, 64], [66, 64], [72, 14], [76, 14], [72, 18], [76, 18]]) L.set(x, y, 'k');
  // ---- enemigos
  const openIn = (x0, y0, x1, y1, ch = '.') => { const a = []; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (L.get(x, y) === ch) a.push([x, y]); return a; };
  const place = (arr, type, n, minD = 0) => { let k = 0, t = 0; while (k < n && t++ < n * 30) { const [x, y] = pick(arr, r); if (Math.hypot(x - 61, y - 75) < minD) continue; if (L.ents.some(e => Math.abs(e.tx - x) < 2 && Math.abs(e.ty - y) < 2)) continue; L.ent(type, x, y); k++; } };
  place(openIn(48, 60, 72, 78), 'slime', 5, 8);
  place(openIn(30, 12, 78, 40), 'slime', 14, 6); place(openIn(30, 12, 78, 40), 'flyer', 10, 6);
  for (const M of [A, D]) { const cs = M.cells.filter(c => c.d > 3); for (let i = 0; i < 10; i++) { const c = pick(cs, r); L.ent(i % 3 === 0 ? 'flyer' : 'slime', c.tx, c.ty); } }
  { const cs = C.cells.filter(c => c.d > 3); for (let i = 0; i < 9; i++) { const c = pick(cs, r); L.ent(i % 2 ? 'flyer' : 'slime', c.tx, c.ty); } }
  L.ent('flyer', 72, 15); L.ent('flyer', 76, 17); L.ent('slime', 74, 18);   // guardianes de la llave de plata
  for (const M of [A, C, D]) for (const c of M.dead.slice(0, 3)) if (c !== M.far[0]) L.ent('heart', c.tx, c.ty);
  L.ent('heart', 58, 72); L.ent('heart', 64, 72); L.ent('heart', 34, 38); L.ent('heart', 76, 36); L.ent('heart', 40, 12);
  L.ent('npc', 61, 72, { id: 'aquela' });
  // cartelitos
  L.sign(60, 76, 'VALLE DEL SUEÑO  —  un mundo enorme: ¡explóralo!');
  L.sign(53, 68, '← Ruinas del oeste  (laberinto de piedra)');
  L.sign(67, 68, 'Cámara de oro  →  (necesita la llave de oro)');
  L.sign(56, 57, '↑ Puerta de bronce al Bosque de Almohadas');
  L.sign(34, 23, 'Un escondite de rocas... ¡algo brilla adentro!');
  L.sign(80, C.entrance.ey + 3, 'Puerta de plata  →  Pantano de setos');
  L.sign(28, 24, 'El jefe espera al oeste.  3 diamantes abren la puerta');
  L.sign(45, 18, 'Hay puertas de colores: busca sus llaves');
  return L;
}
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
const LEVELS = [level0, level1];
