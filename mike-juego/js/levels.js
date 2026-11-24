'use strict';
// ===== Niveles (vista desde arriba) =====
// Tiles: '.' pasto  ',' camino  'a' piso de arena  'f' flores  'm' hongos  (caminables)
//        'T' árbol  'R' roca  'W' muro  'C' muro agrietado  'G' puerta de diamantes  '~' agua  'H' casa  'd' puerta de casa  'b' arbusto  'k' antorcha
const SOLID = 'TRWCG~Hdbk';
class Level {
  constructor(w, h, theme) {
    this.w = w; this.h = h; this.theme = theme;
    this.g = []; for (let y = 0; y < h; y++) this.g.push(new Array(w).fill('T'));
    this.ents = []; this.signs = []; this.hp = {}; this.diaNeed = 0;
    this.start = [3, 3]; this.exit = null; this.gate = null; this.arena = null; this.seen = null;
  }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 'T'; return this.g[y][x]; }
  set(x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.g[y][x] = c; }
  fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c); }
  scatter(x0, y0, x1, y1, ch, n, seed, avoid = [], on = '.') {
    const r = mkRng(seed); let tries = n * 12;
    while (n > 0 && tries-- > 0) {
      const x = x0 + Math.floor(r() * (x1 - x0 + 1)), y = y0 + Math.floor(r() * (y1 - y0 + 1));
      if (this.get(x, y) !== on) continue;
      if (avoid.some(a => Math.abs(a[0] - x) <= a[2] && Math.abs(a[1] - y) <= a[2])) continue;
      this.set(x, y, ch); n--;
    }
  }
  ent(type, tx, ty, extra) { this.ents.push(Object.assign({ type, tx, ty }, extra || {})); }
  sign(tx, ty, text) { this.signs.push({ x: (tx + .5) * T, y: (ty + 1) * T - 6, text }); }
}
const solidCh = c => SOLID.includes(c);

// ---- Nivel 0: la casa de Mike (tutorial) ----
function level0() {
  const L = new Level(44, 26, 'day');
  L.diaNeed = 1; L.start = [7, 9];
  L.fill(2, 2, 41, 23, '.');
  L.fill(4, 2, 10, 6, 'H'); L.set(7, 6, 'd');
  L.fill(6, 7, 8, 10, ','); L.fill(4, 11, 41, 13, ',');
  L.fill(18, 16, 23, 20, '~');
  const keep = [[7, 9, 3], [5, 9, 1], [9, 9, 1], [15, 12, 2], [22, 8, 2], [35, 12, 2], [41, 12, 2], [27, 12, 1], [31, 17, 1], [14, 5, 1]];
  L.scatter(2, 2, 41, 23, 'T', 26, 11, keep);
  L.scatter(2, 2, 41, 23, 'R', 12, 12, keep);
  L.scatter(2, 2, 41, 23, 'b', 22, 14, keep);
  L.scatter(2, 2, 41, 23, 'f', 90, 13, [], '.');
  L.ent('dummy', 15, 12);
  L.ent('npc', 5, 9, { id: 'aquela' });
  L.ent('heart', 10, 9);
  L.ent('npc', 35, 12, { id: 'ambrosio' });
  L.ent('slime', 27, 12); L.ent('slime', 31, 17);
  L.ent('dia', 22, 8); L.ent('heart', 14, 5);
  L.exit = { x: 41 * T, y: 11 * T, w: T, h: 3 * T };
  L.sign(9, 8, 'JOYSTICK / FLECHAS :  MOVERTE');
  L.sign(12, 10, 'ATACAR  (J / Espacio) :  tu espada pega hacia donde miras');
  L.sign(17, 14, '¡Prueba tu espada con el muñeco!');
  L.sign(33, 10, '¡Habla con Ambrosio!   ACTUAR (E)');
  L.sign(38, 14, 'Entra al portal  →');
  return L;
}

// ---- Nivel 1: Valle del Sueño ----
function level1() {
  const L = new Level(90, 40, 'dream');
  L.diaNeed = 3; L.start = [6, 32];
  const R = (a, b, c, d, ch = '.') => L.fill(a, b, c, d, ch);
  R(3, 28, 14, 36);                         // claro inicial
  R(14, 31, 24, 33, ',');                   // sendero
  R(24, 24, 38, 37);                        // prado con estanque
  R(28, 28, 32, 32, '~');
  R(30, 14, 32, 24, ',');                   // sendero norte
  R(22, 4, 42, 14);                         // claro del norte
  R(42, 8, 52, 10, ',');                    // sendero este
  R(52, 2, 69, 16);                         // salón de ovejas
  R(57, 17, 58, 21, ',');                   // pasadizo secreto
  R(54, 22, 62, 28);                        // cámara secreta
  L.set(57, 17, 'C'); L.set(58, 17, 'C');
  // muro y puerta de diamantes
  R(70, 2, 70, 16, 'W'); R(70, 9, 70, 11, 'G');
  R(70, 4, 89, 4, 'W'); R(70, 16, 89, 16, 'W'); R(89, 4, 89, 16, 'W');
  R(71, 5, 88, 15, 'a');
  for (const [x, y] of [[75, 8], [75, 12], [84, 8], [84, 12]]) L.set(x, y, 'R');
  for (const [x, y] of [[72, 6], [72, 14], [87, 6], [87, 14], [69, 8], [69, 12], [8, 30], [8, 34], [20, 30], [20, 34]]) L.set(x, y, 'k');
  L.gate = { x: 70 * T, y: 9 * T, w: T, h: 3 * T, tiles: [[70, 9], [70, 10], [70, 11]] };
  L.arena = { x0: 71 * T, y0: 5 * T, x1: 89 * T, y1: 16 * T, trigger: 73 * T };
  // decoración
  const keep = [[6, 32, 4], [34, 30, 2], [36, 26, 2], [40, 5, 2], [23, 12, 1], [55, 14, 2], [58, 14, 2], [58, 25, 2], [60, 25, 1]];
  L.scatter(3, 28, 14, 36, 'T', 8, 21, keep); L.scatter(24, 24, 38, 37, 'T', 9, 22, keep); L.scatter(22, 4, 42, 14, 'T', 12, 23, keep);
  L.scatter(52, 2, 69, 16, 'T', 12, 24, keep); L.scatter(3, 28, 69, 37, 'R', 14, 25, keep);
  L.scatter(3, 28, 69, 37, 'b', 30, 28, keep); L.scatter(22, 4, 69, 36, 'm', 70, 26, [], '.'); L.scatter(3, 28, 38, 37, 'm', 40, 27, [], '.');
  // premios y enemigos
  L.ent('dia', 36, 26);
  L.ent('slime', 30, 34); L.ent('slime', 35, 30); L.ent('slime', 27, 26);
  L.ent('dia', 40, 5); L.ent('heart', 23, 12);
  L.ent('flyer', 30, 8); L.ent('flyer', 35, 11); L.ent('slime', 26, 6); L.ent('slime', 38, 12);
  L.ent('dia', 58, 25); L.ent('heart', 60, 25);
  L.ent('heart', 55, 14); L.ent('heart', 56, 14); L.ent('npc', 58, 14, { id: 'aquela' });
  L.ent('slime', 60, 6); L.ent('slime', 64, 10); L.ent('flyer', 62, 13); L.ent('slime', 56, 4);
  L.sign(8, 31, 'VALLE DEL SUEÑO  —  ¡cuidado con los glitchitos!');
  L.sign(27, 34, 'Los diamantes brillan... ¡y Willy los huele!');
  L.sign(31, 20, 'Camino al claro del norte  ↑');
  L.sign(54, 9, 'Hay grietas sospechosas al sur...  ¡golpéalas!');
  L.sign(68, 12, '3 diamantes abren la puerta  →');
  return L;
}
const LEVELS = [level0, level1];
