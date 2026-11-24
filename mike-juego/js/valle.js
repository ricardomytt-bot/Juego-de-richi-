'use strict';
// ===== Versión "Valle del Sueño": solo ese mundo, con guardado de partida =====
const SAVE_KEY = 'mike_valle_save_v1';
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function saveGame(silent) {
  if (S.mode !== 'play' || S.lvlId !== 1 || !S.lvl || S.bossLock || S.bossDefeated || P.dead) { if (!silent) showHint('No se puede guardar durante el jefe', 2); return false; }
  try {
    const L = S.lvl, fresh = LEVELS[1](), tiles = [];
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (L.g[y][x] !== fresh.g[y][x]) tiles.push([x, y, L.g[y][x]]);
    const alive = new Set(S.ents.filter(e => !e.dead && e._i != null).map(e => e._i)), dead = [];
    for (let i = 0; i < S.nSpawn; i++) if (!alive.has(i)) dead.push(i);
    const data = { v: 1, t: Date.now(), px: P.x, py: P.y, hp: P.hp, sel: P.sel, special: P.special, dmgMul: P.dmgMul, kills: P.kills, chocoCd: P.chocoCd,
      dia: S.dia, keys: S.keys, gateOpen: S.gateOpen, tiles, hpTiles: L.hp, dead, seen: Array.from(L.seen).join('') };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    showHint('Partida guardada ✓', 1.8); return true;
  } catch (e) { if (!silent) showHint('No se pudo guardar', 2); return false; }
}
function applySave() {
  const d = JSON.parse(localStorage.getItem(SAVE_KEY)), L = S.lvl;
  for (const [x, y, c] of d.tiles) L.set(x, y, c);
  Object.assign(L.hp, d.hpTiles || {});
  const dd = new Set(d.dead); S.ents = S.ents.filter(e => !(e._i != null && dd.has(e._i)));
  if (d.seen) for (let i = 0; i < d.seen.length && i < L.seen.length; i++) L.seen[i] = d.seen.charCodeAt(i) === 49 ? 1 : 0;
  S.dia = d.dia; S.keys = d.keys; S.gateOpen = d.gateOpen;
  P.x = d.px; P.y = d.py; P.hp = d.hp; P.sel = d.sel || 0; P.special = !!d.special; P.dmgMul = d.dmgMul || 1; P.kills = d.kills || 0; P.chocoCd = d.chocoCd || 0;
  S.checkpoint = [P.x, P.y]; initWilly(); updateCamera(0, true);
}
function startValle(cont) {
  MENU.open = false; S.mode = 'play'; S.fade = 1; AUDIO.unlock(); sfx.start(); S.skip = false; S.camShot = null;
  loadLevel(1); S.ents.forEach((e, i) => e._i = i); S.nSpawn = S.ents.length; glMood(false);
  if (cont && hasSave()) { try { applySave(); } catch (e) { console.warn('Guardado dañado', e); } }
  if (GL.ok) GL.camInit = false;
  (async () => {
    await fadeTo(0, 1);
    if (!cont) { S.busy = true; await say('narr', 'El Valle del Sueño: un mundo enorme de laberintos, llaves y puertas. Consigue 3 diamantes para abrir la puerta del jefe.'); await say('aquela', 'Tu partida se guarda sola cada pocos segundos. También puedes guardar desde el menú ☰.'); S.busy = false; showHint('Explora, busca llaves y diamantes', 5); }
    else showHint('Partida cargada ✓', 2.5);
  })();
}
const _menuItems = menuItems;
menuItems = function () {
  const a = _menuItems();
  if (MENU.page === 'main') return [...(hasSave() ? [{ t: 'CONTINUAR', go: () => startValle(true) }] : []), { t: hasSave() ? 'NUEVA PARTIDA' : 'JUGAR', go: () => { if (hasSave()) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } } startValle(false); } }, ...a.slice(1)];
  if (MENU.page === 'pause') { a.splice(1, 0, { t: 'GUARDAR PARTIDA', go: () => { saveGame(false); closeMenu(); } }); }
  return a;
};
setInterval(() => { if (S.mode === 'play' && !MENU.open && !S.busy && !S.dialog) saveGame(true); }, 12000);
