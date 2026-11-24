'use strict';
// ===== Mundo conectado: zonas unidas por portales, estado persistente por zona y guardado de partida =====
const ZONES = {}, WSAVE = 'mike_world_save_v1', ZNAME = ['la Ciudad de Diamantia', 'el Valle del Sueño', 'Pastelandia'];
const zoneMusic = L => L.theme === 'dream' ? 'dream' : L.theme === 'sweet' ? 'day' : 'city';
function lockOK(k) { if (!k) return true; if (k === 'train') return !!(S.flags && S.flags.trainDone); if (k === 'boss') return !!(S.defeated && S.defeated[S.lvlId]); return true; }
function stashZone() {
  if (!S.lvl) return;
  ZONES[S.lvlId] = { L: S.lvl, ents: S.ents.filter(e => e.type !== 'exe3d' && e.tag !== 'crew'), nSpawn: S.nSpawn, dia: S.dia, keys: S.keys, gateOpen: S.gateOpen, bossDefeated: S.bossDefeated, bossStarted: S.bossStarted, MM };
}
function activateZone(id) {
  const z = ZONES[id]; S.lvlId = id; S.lvl = z.L; S.ents = z.ents; S.nSpawn = z.nSpawn; S.dia = z.dia; S.keys = z.keys; S.gateOpen = z.gateOpen; S.bossDefeated = z.bossDefeated; S.bossStarted = z.bossStarted; MM = z.MM;
  S.boss = null; S.bossLock = false; S.shots = []; S.proj = []; S.warns = []; S.particles = []; S.floaters = []; S.wave = null;
  for (const e of S.ents) if (e.hidden) e.hidden = false;
  setMusic(zoneMusic(z.L)); setAmbient(z.L.theme === 'dream' ? 'dream' : 'day');
}
let zoning = false;
async function enterZone(id, spawn) {
  if (zoning) return; zoning = true; S.busy = true; S.skip = false; sfx.portal();
  await fadeTo(1, .4);
  const hp = P.hp, cd = P.chocoCd; stashZone();
  if (ZONES[id]) activateZone(id); else { loadLevel(id); ZONES[id] = null; }
  P.hp = hp; P.chocoCd = cd; P.x = (spawn[0] + .5) * T; P.y = (spawn[1] + 1) * T - 8; P.vx = P.vy = 0; P.dead = false;
  S.checkpoint = [P.x, P.y]; initWilly(); updateCamera(0, true); if (GL.ok) GL.camInit = false; glMood(false); S.camShot = null;
  await fadeTo(0, .5);
  S.busy = false; zoning = false;
  if (!S.flags['zona' + id]) {
    S.flags['zona' + id] = true; S.busy = true;
    if (id === 1) { await say('narr', 'El Valle del Sueño: un mundo de zonas conectadas con laberintos, llaves y puertas. Aquí todo flota, es suave y bonito... y probablemente peligroso.'); await say('willy', '¡Guau! (Traducción: huele a almohada con maldad.)'); showHint('Explora las zonas, busca llaves y consigue 3 diamantes', 6); }
    if (id === 2) { await say('narr', 'Pastelandia: todo es dulce, esponjoso y huele delicioso... y probablemente tiene trampa.'); await say('willy', '¡Guau! (Traducción: huele a muffin con maldad.)'); }
    S.busy = false;
  } else showHint('Zona: ' + ZNAME[id], 2.5);
}
const _ct = checkTriggers;
checkTriggers = function () {
  _ct();
  const L = S.lvl; if (!L || !L.exits || S.busy || zoning || S.wave || P.dead) return;
  const tx = P.x / T, ty = (P.y - 8) / T;
  for (const ex of L.exits) if (tx >= ex.x0 && tx <= ex.x1 + 1 && ty >= ex.y0 && ty <= ex.y1 + 1) {
    if (lockOK(ex.lock)) { enterZone(ex.to, ex.spawn); return; } else showHint(ex.msg || 'Aún no puedes pasar', .4);
  }
};
// ---------- guardado ----------
const hasSave = () => { try { return !!localStorage.getItem(WSAVE); } catch (e) { return false; } };
function saveGame(silent) {
  if (S.mode !== 'play' || !S.lvl || S.stage || S.wave || (S.bossLock && !S.bossDefeated) || P.dead || S.busy) { if (!silent) showHint('Ahora no se puede guardar', 2); return false; }
  try {
    stashZone(); const zs = {};
    for (const id in ZONES) { const z = ZONES[id]; if (!z) continue; const fresh = LEVELS[id](), tiles = [];
      for (let y = 0; y < z.L.h; y++) for (let x = 0; x < z.L.w; x++) if (z.L.g[y][x] !== fresh.g[y][x]) tiles.push([x, y, z.L.g[y][x]]);
      const alive = new Set(z.ents.filter(e => !e.dead && e._i != null).map(e => e._i)), dead = []; for (let i = 0; i < z.nSpawn; i++) if (!alive.has(i)) dead.push(i);
      zs[id] = { tiles, hpTiles: z.L.hp, dead, seen: Array.from(z.L.seen).join(''), dia: z.dia, keys: z.keys, gateOpen: z.gateOpen, bossDefeated: z.bossDefeated, bossStarted: z.bossStarted }; }
    localStorage.setItem(WSAVE, JSON.stringify({ v: 1, lvl: S.lvlId, px: P.x, py: P.y, P: { hp: P.hp, sel: P.sel, special: P.special, dmgMul: P.dmgMul, kills: P.kills, chocoCd: P.chocoCd }, choco: CHOCO_CD, q: S.q, fav: S.fav, flags: S.flags, defeated: S.defeated || {}, zs }));
    showHint('Partida guardada ✓', 1.8); return true;
  } catch (e) { if (!silent) showHint('No se pudo guardar', 2); return false; }
}
function buildZone(id, d) {
  const L = LEVELS[id](); for (const [x, y, c] of d.tiles) L.set(x, y, c); Object.assign(L.hp, d.hpTiles || {});
  S.lvl = L; S.lvlId = id; spawnEnts(L); S.ents.forEach((e, i) => e._i = i); const n = S.ents.length, dd = new Set(d.dead);
  L.seen = new Uint8Array(L.w * L.h); for (let i = 0; i < d.seen.length && i < L.seen.length; i++) L.seen[i] = d.seen.charCodeAt(i) === 49 ? 1 : 0;
  minimapReset();
  ZONES[id] = { L, ents: S.ents.filter(e => !dd.has(e._i)), nSpawn: n, dia: d.dia, keys: d.keys, gateOpen: d.gateOpen, bossDefeated: d.bossDefeated, bossStarted: d.bossStarted, MM };
}
function resetPlayerStats() { Object.assign(P, { hp: 100, sel: 0, special: false, dmgMul: 1, kills: 0, chocoCd: 0, dead: false }); CHOCO_CD = 30; }
function continueGame() {
  const d = JSON.parse(localStorage.getItem(WSAVE)); MENU.open = false; S.mode = 'play'; S.fade = 1; AUDIO.unlock(); sfx.start(); S.skip = false; S.camShot = null;
  for (const k in ZONES) delete ZONES[k];
  S.q = d.q; S.fav = d.fav; S.flags = d.flags; S.defeated = d.defeated; Object.assign(P, d.P); CHOCO_CD = d.choco || 30;
  for (const id in d.zs) buildZone(+id, d.zs[id]);
  activateZone(d.lvl); P.x = d.px; P.y = d.py; P.vx = P.vy = 0; S.checkpoint = [P.x, P.y]; initWilly(); updateCamera(0, true); if (GL.ok) GL.camInit = false; glMood(false);
  fadeTo(0, 1); showHint('Partida cargada ✓', 2.5);
}
const _startGame = startGame;
startGame = function () { for (const k in ZONES) delete ZONES[k]; S.defeated = {}; resetPlayerStats(); _startGame(); };
const _menuItems = menuItems;
menuItems = function () {
  const a = _menuItems();
  if (MENU.page === 'main') return [...(hasSave() ? [{ t: 'CONTINUAR', go: () => continueGame() }] : []), { t: hasSave() ? 'NUEVA PARTIDA' : 'JUGAR', go: () => { if (hasSave()) { try { localStorage.removeItem(WSAVE); } catch (e) { } } startGame(); } }, ...a.slice(1)];
  if (MENU.page === 'pause' && S.lvl && !S.stage) a.splice(1, 0, { t: 'GUARDAR PARTIDA', go: () => { closeMenu(); saveGame(false); } });
  return a;
};
setInterval(() => { if (S.mode === 'play' && !MENU.open && !S.busy && !S.dialog) saveGame(true); }, 15000);
