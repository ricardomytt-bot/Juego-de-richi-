/* 08b · logros, skins y personajes de Isla Ardilla (se desbloquean jugando) */
'use strict';
/* acc: accesorio de la cabeza. old: personaje mayor. Los colores sirven para el dibujo 2D (retratos) y para el modelo 3D. */
const SKINS = [
  { id: 'nuki',          name: 'Nuki',           kind: 'color', desc: 'La piloto de Isla Ardilla.',                     fur: '#d28a3e', furD: '#a8672b', belly: '#f8dcb2', plane: '#ff5a4a', scarf: '#ffd23f', hat: '#6b4128', cloth: '#e0523f', acc: 'goggles' },
  { id: 'nuki_cielo',    name: 'Nuki Cielo',     kind: 'color', desc: 'Avión azul como el cielo despejado.',            fur: '#d28a3e', furD: '#a8672b', belly: '#f8dcb2', plane: '#3f9bff', scarf: '#ffffff', hat: '#274a8a', cloth: '#3f7fd8', acc: 'goggles' },
  { id: 'nuki_pistacho', name: 'Nuki Pistacho',  kind: 'color', desc: 'Colores de bosque y mucha energía.',             fur: '#c9a04a', furD: '#a07c2e', belly: '#f4ecb6', plane: '#58c86a', scarf: '#fff3a0', hat: '#2f6b3a', cloth: '#3fa65a', acc: 'goggles' },
  { id: 'nuki_rosa',     name: 'Nuki Rosa',      kind: 'color', desc: 'Dulce, rápida y muy presumida.',                 fur: '#e0a090', furD: '#bc7a6c', belly: '#ffe9e2', plane: '#ff7fb2', scarf: '#ffffff', hat: '#8a3a64', cloth: '#ff7fb2', acc: 'goggles' },
  { id: 'nuki_noche',    name: 'Nuki Noche',     kind: 'color', desc: 'Vuela de noche y se ve con las estrellas.',      fur: '#7d6aa8', furD: '#5e4d86', belly: '#d8cdf0', plane: '#6a4cd8', scarf: '#7be0ff', hat: '#2a1f4a', cloth: '#4a3aa0', acc: 'goggles' },
  { id: 'nuki_oro',      name: 'Nuki Dorada',    kind: 'color', desc: 'Solo para quien nunca se deja tocar.',           fur: '#f0b83a', furD: '#c98f1c', belly: '#fff3c4', plane: '#ffc42a', scarf: '#ffffff', hat: '#a87408', cloth: '#ffb300', acc: 'goggles', shine: true },
  { id: 'abuelo',        name: 'Abuelo Roble',   kind: 'char',  desc: 'Sabe más de planear que nadie.',                 fur: '#aaa49c', furD: '#86807a', belly: '#f0ede7', plane: '#7f9bd6', scarf: '#ffffff', hat: '#7c8fb9', cloth: '#7c8fb9', acc: 'glasses', old: true },
  { id: 'pipa',          name: 'Pipa',           kind: 'char',  desc: 'La más pequeña del pueblo, la más veloz.',       fur: '#eab062', furD: '#c68a3c', belly: '#fff0d0', plane: '#ffd23f', scarf: '#ff8fb5', hat: '#ff8fb5', cloth: '#ff8fb5', acc: 'bow' },
  { id: 'chispa',        name: 'Chispa',         kind: 'char',  desc: 'Mecánica del hangar. Siempre huele a aceite.',   fur: '#8a6a4a', furD: '#68502f', belly: '#e8d4b4', plane: '#38bfae', scarf: '#ff9a3a', hat: '#3a4a5a', cloth: '#ff9a3a', acc: 'welder' },
  { id: 'rama',          name: 'Capitana Rama',  kind: 'char',  desc: 'Capitana de la guardia de Isla Ardilla.',        fur: '#c07a4a', furD: '#9a5a30', belly: '#f6dcc0', plane: '#2f55b8', scarf: '#ffd23f', hat: '#1c2a5a', cloth: '#1c2a5a', acc: 'captain' }
];
const SKIN_BY = Object.fromEntries(SKINS.map(s => [s.id, s]));

const ST = store.get('planeo4.stats', { acorns: 0, dist: 0, bosses: 0, bossNoHit: 0, maxCombo: 0, dive: 0, powerups: 0, shieldSaves: 0, starKills: 0, maxCycle: 0, cleanCycles: 0, ghostWins: 0, chapters: 0, storyDone: 0, flights: 0, gold: 0 });
const ACH_DONE = store.get('planeo4.ach', {});          // { id: true }
const SKIN_OWN = store.get('planeo4.skins', { nuki: true });
let SKIN_SEL = store.get('planeo4.skinSel', 'nuki'); if (!SKIN_OWN[SKIN_SEL]) SKIN_SEL = 'nuki';
const curSkin = () => SKIN_BY[SKIN_SEL] || SKINS[0];
function statsSave(){ store.set('planeo4.stats', ST); store.set('planeo4.ach', ACH_DONE); store.set('planeo4.skins', SKIN_OWN); store.set('planeo4.skinSel', SKIN_SEL); }

/* progress(): 0..goal.  reward: id de skin que se desbloquea */
const ACHS = [
  { id: 'first_flight', name: 'Primer vuelo',            desc: 'Termina el capítulo 1 de la historia.',                 goal: 1,     prog: () => Math.min(1, Story.d.done[0] ? 1 : 0),         reward: 'nuki_cielo' },
  { id: 'acorn100',     name: 'Ardilla ahorradora',      desc: 'Recoge 100 bellotas en total.',                          goal: 100,   prog: () => ST.acorns,                                    reward: 'nuki_pistacho' },
  { id: 'acorn1000',    name: 'Despensa llena',          desc: 'Recoge 1000 bellotas en total.',                         goal: 1000,  prog: () => ST.acorns },
  { id: 'combo30',      name: 'Racha de oro',            desc: 'Encadena 30 bellotas sin recibir daño.',                 goal: 30,    prog: () => ST.maxCombo },
  { id: 'boss1',        name: 'Matajefes',               desc: 'Derrota a un mini jefe.',                                goal: 1,     prog: () => ST.bosses },
  { id: 'boss_nohit',   name: 'Sin un rasguño',          desc: 'Derrota a un mini jefe sin perder ninguna vida.',        goal: 1,     prog: () => ST.bossNoHit,                                 reward: 'nuki_noche' },
  { id: 'story_done',   name: 'Isla salvada',            desc: 'Completa toda la historia.',                             goal: 1,     prog: () => ST.storyDone,                                 reward: 'abuelo' },
  { id: 'cycle3',       name: 'Tres vueltas',            desc: 'Llega al ciclo 3 del modo infinito.',                    goal: 3,     prog: () => ST.maxCycle,                                  reward: 'pipa' },
  { id: 'cycle6',       name: 'Sin bajar la guardia',    desc: 'Llega al ciclo 6 del modo infinito.',                    goal: 6,     prog: () => ST.maxCycle,                                  reward: 'chispa' },
  { id: 'cycle10',      name: 'Leyenda del cielo',       desc: 'Llega al ciclo 10 del modo infinito.',                   goal: 10,    prog: () => ST.maxCycle,                                  reward: 'rama' },
  { id: 'clean_cycle',  name: 'Intocable',               desc: 'Completa un ciclo infinito entero sin perder vidas.',    goal: 1,     prog: () => ST.cleanCycles,                               reward: 'nuki_oro' },
  { id: 'ghost_win',    name: 'Más rápido que un fantasma', desc: 'Gana una carrera contra un fantasma.',                 goal: 1,     prog: () => ST.ghostWins,                                 reward: 'nuki_rosa' },
  { id: 'dive60',       name: 'Picada loca',             desc: 'Pasa 60 segundos en picada en total.',                   goal: 60,    prog: () => Math.floor(ST.dive) },
  { id: 'powerups10',   name: 'Coleccionista',           desc: 'Recoge 10 power-ups.',                                   goal: 10,    prog: () => ST.powerups },
  { id: 'shield5',      name: 'Escudo salvador',         desc: 'Que el escudo te salve de 5 golpes.',                    goal: 5,     prog: () => ST.shieldSaves },
  { id: 'star10',       name: 'Imparable',               desc: 'Revienta 10 enemigos con la estrella.',                  goal: 10,    prog: () => ST.starKills },
  { id: 'jump100',    name: 'Ardilla saltarina',       desc: 'Salta 100 veces.',                                       goal: 100,   prog: () => ST.jumps || 0 },
  { id: 'chest3',      name: 'Cazatesoros',             desc: 'Encuentra 3 cofres secretos.',                           goal: 3,     prog: () => ST.chests || 0 },
  { id: 'portal5',     name: 'Atajista',                desc: 'Cruza 5 portales.',                                      goal: 5,     prog: () => ST.portals || 0 },
  { id: 'photo1',      name: 'Fotógrafa del cielo',     desc: 'Guarda una foto con el modo foto.',                      goal: 1,     prog: () => ST.photos || 0 },
  { id: 'dist20',       name: 'Maratón aéreo',           desc: 'Vuela 20 km en total.',                                  goal: 20000, prog: () => Math.floor(ST.dist) }
];
const ACH_BY = Object.fromEntries(ACHS.map(a => [a.id, a]));

let _achQ = [], _achShowing = false;
function achCheck(){
  let changed = false;
  for (const a of ACHS){
    if (ACH_DONE[a.id]) continue;
    if (a.prog() >= a.goal){ ACH_DONE[a.id] = true; changed = true; _achQ.push(a); if (a.reward && !SKIN_OWN[a.reward]) SKIN_OWN[a.reward] = true; }
  }
  if (changed){ statsSave(); achPump(); }
}
function achPump(){
  if (_achShowing || !_achQ.length) return;
  const a = _achQ.shift(), pop = document.getElementById('achPop'); if (!pop) return;
  _achShowing = true;
  const sk = a.reward ? SKIN_BY[a.reward] : null;
  pop.innerHTML = `<div class="trophy">🏆</div><div><b>¡Logro!</b> ${esc(a.name)}<small>${sk ? 'Desbloqueaste: <u>' + esc(sk.name) + '</u>' : esc(a.desc)}</small></div>`;
  pop.classList.add('show'); Sound.sfx('ach');
  setTimeout(() => { pop.classList.remove('show'); setTimeout(() => { _achShowing = false; achPump(); }, 500); }, 3600);
}
let _lastSave = 0;
function statsTick(dt, G_){   // llamado cada fotograma jugando: distancia y picada
  ST.dist += G_.vP * dt; if (G_.diveOn) ST.dive += dt;
  _lastSave += dt; if (_lastSave > 8){ _lastSave = 0; statsSave(); achCheck(); }
}
function skinOf(sel){ return SKIN_BY[sel || SKIN_SEL] || SKINS[0]; }
function selectSkin(id){ if (!SKIN_OWN[id]) return; SKIN_SEL = id; statsSave(); if (typeof onSkinChanged === 'function') onSkinChanged(); }

/* ---------- pantallas ---------- */
let _awTab = 0;
function renderAch(){
  const tabs = document.getElementById('achTabs'); if (!tabs) return;
  tabs.innerHTML = ['Personajes y skins', 'Logros'].map((t, i) => `<button class="tab ${i === _awTab ? 'on' : ''}" data-t="${i}">${t}</button>`).join('');
  const box = document.getElementById('achBody'), done = ACHS.filter(a => ACH_DONE[a.id]).length;
  document.getElementById('achCount').textContent = `${done}/${ACHS.length} logros · ${Object.keys(SKIN_OWN).length}/${SKINS.length} skins`;
  if (_awTab === 0){
    box.innerHTML = '<div class="skins">' + SKINS.map(s => {
      const own = !!SKIN_OWN[s.id], src = ACHS.find(a => a.reward === s.id);
      return `<div class="skin ${own ? '' : 'locked'} ${s.id === SKIN_SEL ? 'sel' : ''}" data-skin="${s.id}"><canvas width="120" height="104" data-pv="${s.id}"></canvas><b>${esc(s.name)}</b>
        <small>${own ? esc(s.desc) : src ? '🔒 ' + esc(src.name) + ': ' + esc(src.desc) : '🔒 Bloqueado'}</small>${s.id === SKIN_SEL ? '<em>En uso</em>' : own ? '<em class="use">Usar</em>' : ''}</div>`;
    }).join('') + '</div>';
    box.querySelectorAll('canvas[data-pv]').forEach(cv => { const s = SKIN_BY[cv.dataset.pv], c = cv.getContext('2d'); c.clearRect(0, 0, 120, 104); if (SKIN_OWN[s.id]) drawSquirrelFront(c, 60, 52, 22, { t: 0.5, mood: 'happy', skin: s }); else { c.globalAlpha = 0.28; drawSquirrelFront(c, 60, 52, 22, { t: 0.5, mood: 'happy', skin: s }); c.globalAlpha = 1; c.font = '700 30px sans-serif'; c.textAlign = 'center'; c.fillText('🔒', 60, 64); } });
  } else {
    box.innerHTML = ACHS.map(a => {
      const p = Math.min(a.goal, a.prog()), ok = !!ACH_DONE[a.id], sk = a.reward ? SKIN_BY[a.reward] : null;
      return `<div class="ach ${ok ? 'ok' : ''}"><div class="ic">${ok ? '🏆' : '🔒'}</div><div class="tx"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>
        <div class="bar"><i style="width:${Math.round(p / a.goal * 100)}%"></i></div><span>${p >= 1000 ? (p / 1000).toFixed(1) + ' k' : p} / ${a.goal >= 1000 ? (a.goal / 1000) + ' k' : a.goal}${sk ? ' · premio: ' + esc(sk.name) : ''}</span></div></div>`;
    }).join('');
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('#achTabs .tab'); if (t){ _awTab = +t.dataset.t; renderAch(); return; }
  const sk = e.target.closest('.skin'); if (sk && !sk.classList.contains('locked')){ selectSkin(sk.dataset.skin); renderAch(); Sound.sfx('ui'); }
});
