// Objetos, recetas de crafteo y las 10 clases
const ITEMS = {
  mascara: { n: 'MASCARA', c: '#e8e0f8', l: 'M' }, taser: { n: 'TASER', c: '#4aa8ff', l: 'T' }, petardos: { n: 'BRUJITAS', c: '#ff8a3a', l: 'B' },
  barricada: { n: 'BARRICADA', c: '#b07a44', l: '#' }, trampa: { n: 'TRAMPA', c: '#c8a060', l: 'X' }, musica: { n: 'CAJA MUSICAL', c: '#d06ad8', l: 'C' },
  mancha: { n: 'MANCHA ACEITE', c: '#9a9a40', l: 'A' }, turbo: { n: 'PILA TURBO', c: '#ffd23f', l: 'P' },
  pizza: { n: 'PIZZA', c: '#e0a040', l: 'Z' }, camara: { n: 'CAMARA', c: '#9aa0b8', l: 'F' }, nerf: { n: 'DARDOS NERF', c: '#ff6a4a', l: 'N' },
  pistola_al: { n: 'PISTOLA ALUMINIO', c: '#c0c0d8', l: 'G', u: false }, ganzua: { n: 'GANZUA', c: '#c8c8a0', l: 'K', u: false }, jeringa: { n: 'JERINGA', c: '#6ae0a0', l: 'J' },
  bebida: { n: 'BEBIDA', c: '#48e0ff', l: 'E' }, humo: { n: 'BOMBA HUMO', c: '#9a9aaa', l: 'H' }, torreta: { n: 'TORRETA', c: '#e0505a', l: 'R' },
  racion: { n: 'RACION', c: '#f0b878', l: '+' }, comida: { n: 'COMIDA', c: '#d89860', l: 'O', u: false }, palanca: { n: 'PALANCA', c: '#8a8aa0', l: 'L', u: false },
};
const ITEM_ORDER = Object.keys(ITEMS);
// recetas (sin orden: solo importan los materiales dentro de la cuadrícula)
const RECIPES = [
  { out: 'taser', n: 2, ing: { circuito: 1, pilas: 2, chatarra: 1 } },
  { out: 'petardos', n: 3, ing: { aluminio: 1, tela: 1, chatarra: 1 } },
  { out: 'mascara', n: 1, ing: { tela: 2, cuerda: 1 } },
  { out: 'barricada', n: 1, ing: { madera: 3, chatarra: 1 } },
  { out: 'trampa', n: 1, ing: { cuerda: 2, madera: 1 } },
  { out: 'musica', n: 1, ing: { circuito: 1, pilas: 1, madera: 1 } },
  { out: 'mancha', n: 1, ing: { aceite: 1, tela: 1 } },
  { out: 'turbo', n: 1, ing: { pilas: 2, chatarra: 1 } },
];
const MAT_COLORS = { chatarra: '#9aa0b0', cuerda: '#d8b878', pilas: '#ffd23f', tela: '#e86a9a', madera: '#b07a44', aluminio: '#d8e0f0', lente: '#6ac8ff', circuito: '#3ae07a', aceite: '#6a6a30' };
// clases: cada una empieza con sus cosas y una ventaja
const CLASSES = [
  { id: 'explorador', n: 'EXPLORADOR', hat: 'explorer', mats: { aluminio: 15 }, items: { pistola_al: 1 }, desc: '15 DE ALUMINIO Y PISTOLA PARA ABRIR EL MICROONDAS' },
  { id: 'ingeniero', n: 'INGENIERO', hat: 'helmet', mats: { chatarra: 3, pilas: 2 }, items: { torreta: 1 }, craft: 0.45, desc: 'CRAFTEA RAPIDO Y TIENE UNA TORRETA' },
  { id: 'corredor', n: 'CORREDOR', hat: 'band', mats: {}, items: { bebida: 2 }, speed: 1.2, hp: 80, desc: 'MAS RAPIDO Y MENOS VIDA' },
  { id: 'medico', n: 'MEDICO', hat: 'cross', mats: { tela: 2 }, items: { jeringa: 2 }, regen: 0.7, desc: 'SE CURA POCO A POCO Y TIENE JERINGAS' },
  { id: 'sigiloso', n: 'SIGILOSO', hat: 'mask', mats: {}, items: { humo: 2 }, stealth: 0.6, desc: 'LA MUÑECA LO VE Y LO OYE MENOS' },
  { id: 'fotografo', n: 'FOTOGRAFO', hat: 'cam', mats: { lente: 1 }, items: { camara: 3 }, camBonus: 2, desc: 'SU CAMARA ATURDE MAS TIEMPO' },
  { id: 'cocinero', n: 'COCINERO', hat: 'chef', mats: {}, items: { comida: 2 }, pizzaT: 10, desc: 'COCINA PIZZA Y LA MUÑECA SE QUEDA 10 S' },
  { id: 'cazador', n: 'CAZADOR', hat: 'cap', mats: {}, items: { nerf: 10 }, desc: 'PISTOLA NERF CON 10 DARDOS' },
  { id: 'cerrajero', n: 'CERRAJERO', hat: 'keys', mats: {}, items: { ganzua: 2 }, desc: 'ABRE 2 PUERTAS CERRADAS SIN LLAVE' },
  { id: 'electricista', n: 'ELECTRICISTA', hat: 'goggles', mats: { circuito: 1 }, items: {}, fix: 1.5, recharge: 2, desc: 'ARREGLA LA LUZ Y RECARGA AL DOBLE' },
];
// dificultad de la muñeca
const DIFFS = [
  { n: 'FACIL', grace: 40, sight: 42, spPatrol: 22, spInv: 30, spChase: 38, calm: 14, lose: 1.6, radar: [16, 22], radarR: 85, dmg: 6 },
  { n: 'NORMAL', grace: 20, sight: 66, spPatrol: 32, spInv: 42, spChase: 52, calm: 5, lose: 3.2, radar: [9, 13], radarR: 120, dmg: 10 },
  { n: 'DIFICIL', grace: 10, sight: 82, spPatrol: 38, spInv: 49, spChase: 59, calm: 2, lose: 4.8, radar: [6, 9], radarR: 140, dmg: 14 },
];
