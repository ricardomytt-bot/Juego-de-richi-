'use strict';
// ===== Mundo conectado: zonas unidas por portales, estado persistente por zona y guardado de partida =====
const ZONES = {}, WSAVE = 'mike_world_save_v1', ZNAME = ['la Ciudad de Diamantia', 'el Valle del Sueño', 'Pastelandia', 'la Granja del Amanecer', 'la Fábrica de Pizza', 'el Jardín de Nubes', 'la Ciudad Neón', 'el Coliseo Romano', 'el Código Corrupto'];
ZNAME[51] = 'la Plaza y el Parque'; ZNAME[52] = 'las Calles del Sur'; ZNAME[53] = 'la Estación y el Este'; ZNAME[0] = 'el Barrio de Mike';
const ZINTRO = { 1: 'El Valle del Sueño: un mundo de zonas conectadas con laberintos, llaves y puertas. Aquí todo flota, es suave y bonito... y probablemente peligroso.', 2: 'Pastelandia: todo es dulce, esponjoso y huele delicioso... y probablemente tiene trampa.', 3: 'Granja del Amanecer: campos dorados, graneros y un gallinero con mucho carácter... y probablemente huevos explosivos.', 4: 'Fábrica de Pizza: tuberías, hornos y cintas de masa... y probablemente un robot con hambre.', 5: 'Jardín de Nubes: caminas sobre algodón blanco y todo está en calma... demasiada calma.', 6: 'Ciudad Neón: luces rosas y azules, carteles de anime y un silencio muy ninja.', 7: 'Coliseo Romano: arena, columnas y un romano que se ríe demasiado.', 8: 'Código Corrupto: el mundo se rompe en píxeles. Aquí espera Mike Maligno, el último guardián.' };
const zoneMusic = L => L.theme === 'dream' ? 'dream' : L.theme === 'sweet' ? 'day' : L.theme === 'indoor' ? 'story' : 'city';
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
let zoning = false, zoneT = -9;
async function enterZone(id, spawn) {
  if (zoning) return; zoning = true; S.busy = true; S.skip = false; sfx.portal();
  await fadeTo(1, .4);
  const hp = P.hp, cd = P.chocoCd; stashZone();
  if (ZONES[id]) activateZone(id); else { loadLevel(id); ZONES[id] = null; }
  P.hp = hp; P.chocoCd = cd; P.x = (spawn[0] + .5) * T; P.y = (spawn[1] + 1) * T - 8; P.vx = P.vy = 0; P.dead = false; { const fs = freeSpot(S.lvl, P.x, P.y, P.hw, P.hh); P.x = fs[0]; P.y = fs[1]; }
  S.checkpoint = [P.x, P.y]; S.cpZone = id; initWilly(); updateCamera(0, true); if (GL.ok) GL.camInit = false; glMood(false); S.camShot = null;
  if (S.maps[id] && S.lvl.seen) S.lvl.seen.fill(1);
  await fadeTo(0, .5);
  S.busy = false; zoning = false; zoneT = S.t;
  if (!S.flags['zona' + id]) {
    S.flags['zona' + id] = true; S.busy = true;
    await say('narr', ZINTRO[id] || ''); if (id === 1) { await say('willy', '¡Guau! (Traducción: huele a almohada con maldad.)'); showHint('Explora las zonas, busca llaves y consigue 3 diamantes', 6); } else await say('willy', '¡Guau! (Traducción: huele a problemas... y a monedas.)');
    S.busy = false;
  } else if (id < 10 || (id >= 50 && id < 60)) showHint('Zona: ' + ZNAME[id], 2.5);
}
const _ct = checkTriggers;
checkTriggers = function () {
  _ct();
  const L = S.lvl; if (!L || !L.exits || S.busy || zoning || S.wave || P.dead) return;
  const tx = P.x / T, ty = (P.y - 8) / T;
  for (const ex of L.exits) if (ex.edge) {
    if (S.t - zoneT < 1.0) continue;
    const ptx = Math.floor(P.x / T), pty = Math.floor((P.y - 4) / T);
    if (ptx < ex.x0 || ptx > ex.x1 || pty < ex.y0 || pty > ex.y1) continue;
    const bt = ex.axis === 'x' ? L.get(ex.bpos, pty) : L.get(ptx, ex.bpos); if (SOLID.includes(bt)) continue;
    enterZone(ex.to, [ex.sx != null ? ex.sx : ptx + (ex.ox || 0), ex.sy != null ? ex.sy : pty + (ex.oy || 0)]); return;
  } else if (ex.door) {
    if (S.t - zoneT < 1.3) continue;
    const px = Math.floor(P.x / T), py = Math.floor((P.y - 4) / T);
    if (px === ex.x0 && py === ex.y0 && (ex.key === 'up' ? (isDown(K.up) || (JOY.active && JOY.y < -.4)) : (isDown(K.down) || (JOY.active && JOY.y > .4)))) { enterZone(ex.to, ex.spawn); return; }
  } else if (tx >= ex.x0 && tx <= ex.x1 + 1 && ty >= ex.y0 && ty <= ex.y1 + 1) {
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
      for (let y = 0; y < z.L.h; y++) for (let x = 0; x < z.L.w; x++) if (z.L.g[y][x] !== fresh.g[y][x] && fresh.g[y][x] !== 'v') tiles.push([x, y, z.L.g[y][x]]);
      const alive = new Set(z.ents.filter(e => !e.dead && e._i != null).map(e => e._i)), dead = []; for (let i = 0; i < z.nSpawn; i++) if (!alive.has(i)) dead.push(i);
      zs[id] = { tiles, hpTiles: z.L.hp, dead, seen: Array.from(z.L.seen).join(''), dia: z.dia, keys: z.keys, gateOpen: z.gateOpen, bossDefeated: z.bossDefeated, bossStarted: z.bossStarted, trials: (z.L.trials || []).map(t => !!t.done), chests: z.ents.filter(e => e.type === 'chest' && !e.dead && e._i == null).map(e => [e.x, e.y, e.w]) }; }
    localStorage.setItem(WSAVE, JSON.stringify({ v: 1, lvl: S.lvlId, px: P.x, py: P.y, P: { armors: P.armors, armor: P.armor, chocoHeal: P.chocoHeal, defMul: P.defMul, speedMul: P.speedMul, up: P.up, hp: P.hp, sel: P.sel, owned: P.owned, equip: P.equip, special: P.special, dmgMul: P.dmgMul, kills: P.kills, chocoCd: P.chocoCd }, choco: CHOCO_CD, coins: S.coins, maps: S.maps, restored: S.restored, cpZone: S.cpZone, q: S.q, fav: S.fav, flags: S.flags, defeated: S.defeated || {}, zs }));
    showHint('Partida guardada ✓', 1.8); return true;
  } catch (e) { if (!silent) showHint('No se pudo guardar', 2); return false; }
}
function buildZone(id, d) {
  const L = LEVELS[id](); for (const [x, y, c] of d.tiles) L.set(x, y, c); Object.assign(L.hp, d.hpTiles || {});
  S.lvl = L; S.lvlId = id; spawnEnts(L); S.ents.forEach((e, i) => e._i = i); const n = S.ents.length, dd = new Set(d.dead);
  L.seen = new Uint8Array(L.w * L.h); for (let i = 0; i < d.seen.length && i < L.seen.length; i++) L.seen[i] = d.seen.charCodeAt(i) === 49 ? 1 : 0;
  if (L.trials && d.trials) L.trials.forEach((t, i) => { t.done = !!d.trials[i]; });
  minimapReset();
  ZONES[id] = { L, ents: S.ents.filter(e => !dd.has(e._i)).concat((d.chests || []).map(([x, y, w]) => ({ type: 'chest', x, y, w, opened: false, t: 0 }))), nSpawn: n, dia: d.dia, keys: d.keys, gateOpen: d.gateOpen, bossDefeated: d.bossDefeated, bossStarted: d.bossStarted, MM };
}
function resetPlayerStats() { Object.assign(P, { armors: [], armor: null, cds: {}, chocoHeal: .7, defMul: 1, speedMul: 1, up: { choco: 0, boots: 0, sharp: 0, scarf: 0, fast: 0 }, hp: 100, sel: 0, owned: ['dagger', 'hammer', 'bow'], equip: ['dagger', 'hammer', 'bow'], special: false, dmgMul: 1, kills: 0, chocoCd: 0, dead: false }); CHOCO_CD = 30; }
function continueGame() {
  const d = JSON.parse(localStorage.getItem(WSAVE)); MENU.open = false; S.mode = 'play'; S.fade = 1; AUDIO.unlock(); sfx.start(); S.skip = false; S.camShot = null;
  for (const k in ZONES) delete ZONES[k];
  S.coins = d.coins || 0; S.maps = d.maps || {}; S.restored = d.restored || 0; S.cpZone = d.cpZone || 0; S.q = d.q; S.fav = d.fav; S.flags = d.flags; S.defeated = d.defeated; Object.assign(P, d.P); P.cds = {}; P.armors = P.armors || []; sanitizeGear(); CHOCO_CD = d.choco || 30;
  for (const id in d.zs) buildZone(+id, d.zs[id]);
  activateZone(d.lvl); P.x = d.px; P.y = d.py; P.vx = P.vy = 0; S.checkpoint = [P.x, P.y]; initWilly(); updateCamera(0, true); if (GL.ok) GL.camInit = false; glMood(false);
  fadeTo(0, 1); showHint('Partida cargada ✓', 2.5);
}
const _startGame = startGame;
startGame = function () { for (const k in ZONES) delete ZONES[k]; S.defeated = {}; S.coins = 0; S.maps = {}; S.restored = 0; S.cpZone = 0; resetPlayerStats(); _startGame(); };
const _menuItems = menuItems;
menuItems = function () {
  const a = _menuItems();
  if (MENU.page === 'main') return [...(hasSave() ? [{ t: 'CONTINUAR', go: () => continueGame() }] : []), { t: hasSave() ? 'NUEVA PARTIDA' : 'JUGAR', go: () => { if (hasSave()) { try { localStorage.removeItem(WSAVE); } catch (e) { } } startGame(); } }, ...a.slice(1)];
  if (MENU.page === 'pause' && S.lvl && !S.stage) a.splice(1, 0, { t: 'GUARDAR PARTIDA', go: () => { closeMenu(); saveGame(false); } });
  return a;
};
setInterval(() => { if (S.mode === 'play' && !MENU.open && !S.busy && !S.dialog) saveGame(true); }, 15000);
