// Objetos, recetas de crafteo y las 10 clases
const ITEMS = {
  mascara: { n: 'MASCARA', c: '#e8e0f8', l: 'M' }, taser: { n: 'TASER', c: '#4aa8ff', l: 'T' }, petardos: { n: 'BRUJITAS', c: '#ff8a3a', l: 'B' },
  barricada: { n: 'BARRICADA', c: '#b07a44', l: '#' }, trampa: { n: 'TRAMPA', c: '#c8a060', l: 'X' }, musica: { n: 'CAJA MUSICAL', c: '#d06ad8', l: 'C' },
  mancha: { n: 'MANCHA ACEITE', c: '#9a9a40', l: 'A' }, turbo: { n: 'PILA TURBO', c: '#ffd23f', l: 'P' },
  pizza: { n: 'PIZZA', c: '#e0a040', l: 'Z' }, camara: { n: 'CAMARA', c: '#9aa0b8', l: 'F' }, nerf: { n: 'DARDOS NERF', c: '#ff6a4a', l: 'N' },
  engranaje: { n: 'ENGRANAJE', c: '#c0c0d8', l: 'G', u: false }, escalera: { n: 'ESCALERA', c: '#c8935a', l: 'H', u: false }, fusible: { n: 'FUSIBLE', c: '#ffb03a', l: 'U', u: false }, ganzua: { n: 'GANZUA', c: '#c8c8a0', l: 'K', u: false }, jeringa: { n: 'JERINGA', c: '#6ae0a0', l: 'J' },
  bebida: { n: 'BEBIDA', c: '#48e0ff', l: 'E' }, humo: { n: 'BOMBA HUMO', c: '#9a9aaa', l: 'H' }, torreta: { n: 'TORRETA', c: '#e0505a', l: 'R' },
  racion: { n: 'RACION', c: '#f0b878', l: '+' }, comida: { n: 'COMIDA', c: '#d89860', l: 'O', u: false }, palanca: { n: 'PALANCA', c: '#8a8aa0', l: 'L', u: false },
};
const ITEM_ORDER = Object.keys(ITEMS);
// recetas (sin orden: solo importan los materiales dentro de la cuadrícula)
const RECIPES = [
  { out: 'engranaje', n: 1, ing: { aluminio: 3, chatarra: 1 } },
  { out: 'escalera', n: 1, ing: { madera: 4, cuerda: 2, chatarra: 1 } },
  { out: 'fusible', n: 1, ing: { circuito: 1, chatarra: 1, cuerda: 1 } },
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
  { id: 'nino', n: 'NIÑO', cost: 0, hat: '', mats: {}, items: {}, desc: 'SIN VENTAJAS. TODOS EMPIEZAN AQUI' },
  { id: 'cazador', n: 'CAZADOR', cost: 1, hat: 'cap', mats: {}, items: { nerf: 10 }, desc: 'PISTOLA NERF CON 10 DARDOS' },
  { id: 'explorador', n: 'EXPLORADOR', cost: 2, hat: 'explorer', mats: { aluminio: 15 }, items: {}, desc: 'EMPIEZA CON 15 DE ALUMINIO PARA ENGRANAJES' },
  { id: 'cocinero', n: 'COCINERO', cost: 3, hat: 'chef', mats: {}, items: { comida: 2 }, pizzaT: 10, desc: 'COCINA PIZZA Y LA MUÑECA SE QUEDA 10 S' },
  { id: 'electricista', n: 'ELECTRICISTA', cost: 4, hat: 'goggles', mats: { circuito: 1 }, items: {}, fix: 1.5, recharge: 2, desc: 'ARREGLA LA LUZ Y RECARGA AL DOBLE' },
  { id: 'medico', n: 'MEDICO', cost: 5, hat: 'cross', mats: { tela: 2 }, items: { jeringa: 2 }, regen: 0.7, desc: 'SE CURA POCO A POCO Y TIENE JERINGAS' },
  { id: 'ingeniero', n: 'INGENIERO', cost: 6, hat: 'helmet', mats: { chatarra: 3, pilas: 2 }, items: { torreta: 1 }, craft: 0.45, desc: 'CRAFTEA RAPIDO Y TIENE UNA TORRETA' },
  { id: 'fotografo', n: 'FOTOGRAFO', cost: 7, hat: 'cam', mats: { lente: 1 }, items: { camara: 3 }, camBonus: 2, desc: 'SU CAMARA ATURDE MAS Y DISIPA FANTASMAS' },
  { id: 'corredor', n: 'CORREDOR', cost: 8, hat: 'band', mats: {}, items: { bebida: 2 }, speed: 1.2, hp: 80, desc: 'MAS RAPIDO Y MENOS VIDA' },
  { id: 'cerrajero', n: 'CERRAJERO', cost: 9, hat: 'keys', mats: {}, items: { ganzua: 2 }, desc: 'ABRE 2 PUERTAS CERRADAS SIN LLAVE' },
  { id: 'sigiloso', n: 'SIGILOSO', cost: 10, hat: 'mask', mats: {}, items: { humo: 2 }, stealth: 0.6, desc: 'LA MUÑECA LO VE Y LO OYE MENOS' },
];
// niveles 1..10: cada nivel completado da ese numero de adamantium
function levelParams(L) {
  const f = 1 + 0.13 * (L - 1);
  return { n: 'NIVEL ' + L, level: L, grace: Math.max(6, 24 - 2 * L), sight: 66 * f, spPatrol: 32 + 1.6 * (L - 1), spInv: 42 + 2 * (L - 1), spChase: 52 + 2.4 * (L - 1), calm: 5 / f, lose: 3.2 + 0.25 * (L - 1), radar: [9 / f, 13 / f], radarR: 120 * f, dmg: 10 + L, ghostEvery: Math.max(13, 46 - 3.5 * L), ghostSpeed: 24 + 2.2 * L, blackout: Math.max(150, 250 - 8 * L) };
}
