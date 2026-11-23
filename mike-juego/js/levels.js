'use strict';
// ===== Niveles =====
// Tiles: '.' aire  '#' tierra/pasto  'S' piedra  'G' puerta de diamantes  'M' cama (rebote)
//        'C' bloque agrietado (se rompe a golpes)  '=' nube (se atraviesa por abajo)
const SOLID = '#SGMC';
class Level {
  constructor(w, h, theme) {
    this.w = w; this.h = h; this.theme = theme;
    this.g = []; for (let y = 0; y < h; y++) this.g.push(new Array(w).fill('.'));
    this.ents = []; this.signs = []; this.hp = {}; this.diaNeed = 0;
    this.start = [3, 8]; this.exit = null; this.gate = null; this.arena = null;
  }
  get(x, y) {
    if (x < 0 || x >= this.w) return '#';
    if (y < 0 || y >= this.h) return '.';
    return this.g[y][x];
  }
  set(x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.g[y][x] = c; }
  fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c); }
  ent(type, tx, ty, extra) { this.ents.push(Object.assign({ type, tx, ty }, extra || {})); }
  sign(tx, text) { this.signs.push({ x: tx * T + T / 2, text }); }
}

// ---- Nivel 0: la casa de Mike (tutorial) ----
function level0() {
  const L = new Level(50, 12, 'day');
  L.diaNeed = 1; L.start = [3, 8];
  L.fill(0, 9, 49, 11, '#');
  L.fill(19, 9, 22, 11, '.');              // foso para aprender a saltar
  L.set(27, 8, 'S'); L.fill(29, 7, 29, 8, 'S'); L.fill(31, 6, 31, 8, 'S');
  L.fill(33, 5, 36, 5, '=');               // nubes con premio
  L.ent('heart', 35, 4);
  L.ent('dia', 34, 4);
  L.ent('dummy', 13, 8);
  L.ent('npc', 8, 8, { id: 'aquela' });
  L.ent('npc', 10, 8, { id: 'acenix' });
  L.ent('npc', 41, 8, { id: 'ambrosio' });
  L.ent('slime', 24, 8);
  L.exit = { x: 47 * T, y: 7 * T, w: T, h: 2 * T };
  L.sign(5, '← →  /  A D :  MOVERTE');
  L.sign(17, 'ESPACIO :  SALTAR  (manténlo para saltar más alto)');
  L.sign(12, 'J :  ATACAR  (↑+J  ataca arriba)');
  L.sign(25, '↓ + J  en el aire :  GOLPE ABAJO  (rebota)');
  L.sign(38, '¡Habla con Ambrosio!  (E)');
  return L;
}

// ---- Nivel 1: Valle del Sueño ----
function level1() {
  const L = new Level(98, 14, 'dream');
  L.diaNeed = 3; L.start = [3, 10];
  L.fill(0, 11, 30, 13, '#');
  L.fill(36, 11, 97, 13, '#');
  // nubes sobre el foso + diamante 1
  L.fill(31, 10, 32, 10, '='); L.fill(33, 9, 34, 9, '='); L.fill(35, 10, 35, 10, '=');
  L.fill(33, 7, 35, 7, '=');
  L.ent('dia', 34, 6);
  // camas elásticas + saliente alto + diamante 2
  L.set(40, 10, 'M'); L.set(41, 10, 'M');
  L.fill(44, 5, 53, 5, 'S');
  L.ent('dia', 49, 4);
  L.ent('flyer', 47, 7);
  // escondite secreto con bloques agrietados + diamante 3
  L.fill(54, 10, 55, 10, '='); L.fill(56, 9, 57, 9, '=');
  L.fill(58, 8, 62, 10, 'S'); L.fill(59, 9, 61, 10, '.');
  L.set(58, 9, 'C'); L.set(58, 10, 'C');
  L.ent('dia', 60, 9);
  L.ent('heart', 61, 10);
  // enemigos
  L.ent('slime', 14, 10); L.ent('slime', 22, 10); L.ent('slime', 27, 10);
  L.ent('slime', 47, 10); L.ent('slime', 65, 10); L.ent('slime', 69, 10);
  L.ent('flyer', 66, 7);
  // pastel y consejos antes de la puerta
  L.ent('npc', 71, 10, { id: 'acenix' });
  L.ent('npc', 73, 10, { id: 'aquela' });
  // puerta de diamantes y arena del jefe
  L.fill(76, 7, 76, 10, 'G'); L.fill(76, 0, 76, 6, 'S');
  L.gate = { x: 76 * T, y: 7 * T, w: T, h: 4 * T };
  L.fill(81, 8, 83, 8, '='); L.fill(90, 8, 92, 8, '=');
  L.fill(97, 0, 97, 13, 'S');
  L.arena = { x0: 77 * T, x1: 97 * T, trigger: 79 * T };
  L.sign(6, 'VALLE DEL SUEÑO  —  ¡cuidado con los glitchitos!');
  L.sign(38, 'Las camas rebotan.  ¡Salta en ellas!');
  L.sign(52, 'Hay grietas sospechosas... ¡golpéalas!');
  L.sign(75, '3 diamantes abren la puerta');
  return L;
}
const LEVELS = [level0, level1];
