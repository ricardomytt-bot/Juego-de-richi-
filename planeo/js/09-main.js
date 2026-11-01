/* 09 · juego principal: estado, modos (historia / infinito / multijugador), HUD, entrada, bucle */
'use strict';
const G = {
  state: 'menu', mode: 'story', ch: 0, infN: 0, t: 0, P: 0, vP: 0, x: MID, tgt: MID, bank: 0, hearts: 3, acorns: 0, combo: 0, deaths: 0,
  inv: 0, slow: 0, diveT: 0, brakeT: 0, fallT: 0, cp: 20, shake: 0, cd: 0, cdShown: 4, flash: 0, lightning: 0, lightT: 5, fade: 0,
  recT: 0, Ps: [], Xs: [], ghosts: [], tAnim: 0, endT: 0, boss: null, bossDone: false, kills: 0, totalDist: 0, lastCode: null, t0: 0, dying: false,
  multiIdx: 0, noPlane: false, shield: false, starT: 0, magT: 0
};
const keys = { dive: false, brake: false };
const particles = [];
const Story = {
  d: store.get('planeo2.story', { unlocked: 1, done: [false, false, false], best: {} }),
  save(){ store.set('planeo2.story', this.d); }
};
let Inf = store.get('planeo3.inf', { score: 0, level: 0 });

function diving(){ return !G.boss && (keys.dive || G.diveT > 0); }
function braking(){ return !G.boss && !diving() && (keys.brake || G.brakeT > 0); }

/* ---------------------------------------------------------------- HUD */
const el = {
  hud: $('hud'), hearts: $('hearts'), pfill: $('pfill'), markers: $('markers'), alt: $('stAlt'), acorns: $('stAcorns'), time: $('stTime'),
  banner: $('banner'), toast: $('toast'), bossbar: $('bossbar'), bossName: $('bossName'), bossPips: $('bossPips'), lvTitle: $('lvTitle')
};
let bannerTimer = 0, toastTimer = 0, titleTimer = 0;
function banner(html, ms){
  el.banner.innerHTML = html; el.banner.classList.add('show');
  clearTimeout(bannerTimer); if (ms) bannerTimer = setTimeout(() => el.banner.classList.remove('show'), ms);
}
function toast(msg){
  el.toast.textContent = msg; el.toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2600);
}
function showLevelTitle(txt){
  el.lvTitle.textContent = txt; el.lvTitle.classList.add('show'); clearTimeout(titleTimer); titleTimer = setTimeout(() => el.lvTitle.classList.remove('show'), 3800);
}
let hudCache = {};
function setText(node, key, v){ if (hudCache[key] !== v){ hudCache[key] = v; node.textContent = v; } }
function showBossBar(on){ el.bossbar.classList.toggle('hidden', !on); if (on) updateBossBar(); }
function updateBossBar(){
  const B = G.boss; if (!B) return;
  el.bossName.textContent = '⚔ ' + B.def.name;
  let h = ''; for (let i = 0; i < B.maxhp; i++) h += `<div class="pip ${i < B.hp ? 'on' : ''}"></div>`;
  el.bossPips.innerHTML = h;
}
const svgHeart = full => `<svg viewBox="0 0 24 22" width="28" height="26"><path d="M12 21C3 14 1 9 1 6.5 1 3.5 3.4 1.5 6 1.5c2.5 0 4.7 1.5 6 3.7 1.3-2.2 3.5-3.7 6-3.7 2.6 0 5 2 5 5 0 2.500-2 7.500-11 14.500z" fill="${full ? '#ff4f6e' : 'rgba(255,255,255,.22)'}" stroke="${full ? '#7d1030' : 'rgba(255,255,255,.75)'}" stroke-width="1.7" stroke-linejoin="round"/>${full ? '<ellipse cx="7" cy="6.2" rx="2.7" ry="1.6" fill="rgba(255,255,255,.7)" transform="rotate(-30 7 6.2)"/>' : ''}</svg>`;
const SVG_ACORN = '<svg viewBox="0 0 22 26" width="17" height="20"><ellipse cx="11" cy="15" rx="7.500" ry="9" fill="#d89a55" stroke="#4a2a12" stroke-width="1.6"/><path d="M2.500 10.500C3 5 7 3.500 11 3.500s8 1.500 8.500 7z" fill="#7a4a2a" stroke="#4a2a12" stroke-width="1.6" stroke-linejoin="round"/><rect x="10" y="0.800" width="2" height="3.500" fill="#4a2a12"/><ellipse cx="8" cy="16" rx="1.500" ry="3.500" fill="rgba(255,255,255,.45)"/></svg>';
const SVG_CLOCK = '<svg viewBox="0 0 22 22" width="17" height="17"><circle cx="11" cy="11" r="9" fill="rgba(255,255,255,.9)" stroke="#27305c" stroke-width="1.800"/><path d="M11 5.500V11l3.800 2.200" stroke="#27305c" stroke-width="1.900" fill="none" stroke-linecap="round"/></svg>';
const SVG_PW = {
  shield: '<svg viewBox="0 0 22 22" width="18" height="18"><circle cx="11" cy="11" r="9" fill="rgba(110,205,255,.7)" stroke="#fff" stroke-width="1.800"/><path d="M11 5l4.500 1.800-.4 5C14.500 14 13 15.500 11 17c-2-1.500-3.500-3-4.100-5.200l-.4-5z" fill="#fff"/></svg>',
  star: '<svg viewBox="0 0 22 22" width="18" height="18"><path d="M11 1.500l2.700 6 6.500.6-4.900 4.300 1.500 6.400L11 15.500 5.200 18.800l1.500-6.400L1.800 8.100l6.500-.6z" fill="#ffd21f" stroke="#7a4a00" stroke-width="1.400" stroke-linejoin="round"/></svg>',
  magnet: '<svg viewBox="0 0 22 22" width="18" height="18"><path d="M4 18V11a7 7 0 0114 0v7" fill="none" stroke="#e8343a" stroke-width="4.500"/><rect x="2" y="15" width="4" height="4.500" fill="#fff" stroke="#27305c" stroke-width="1"/><rect x="16" y="15" width="4" height="4.500" fill="#fff" stroke="#27305c" stroke-width="1"/></svg>'
};
function setHtml(node, key, v){ if (hudCache[key] !== v){ hudCache[key] = v; node.innerHTML = v; } }
function updateHud(){
  let h = ''; for (let i = 0; i < 3; i++) h += svgHeart(i < G.hearts);
  setHtml(el.hearts, 'h', h);
  const inSky = G.P < L_SKY;
  let alt;
  if (G.boss) alt = '¡Jefe!';
  else if (G.mode === 'inf') alt = 'Nivel ' + (G.infN + 1) + (inSky ? ' · ' + Math.round(START_ALT * altFrac(G.P)) + ' m' : ' · en tierra');
  else alt = inSky ? 'Altitud ' + Math.round(START_ALT * altFrac(G.P)) + ' m' : 'Jefe a ' + Math.max(0, Math.round(L - G.P)) + ' m';
  setText(el.alt, 'alt', alt);
  setHtml(el.acorns, 'ac', SVG_ACORN + '<b>' + G.acorns + '</b>');
  setHtml(el.time, 'tm', SVG_CLOCK + '<b>' + fmtTime(G.t) + '</b>');
  let pw = '';
  if (G.shield) pw += `<div class="pw">${SVG_PW.shield}<span>Escudo</span></div>`;
  if (G.starT > 0) pw += `<div class="pw">${SVG_PW.star}<span>Invencible ${Math.ceil(G.starT)}</span></div>`;
  if (G.magT > 0) pw += `<div class="pw">${SVG_PW.magnet}<span>Imán ${Math.ceil(G.magT)}</span></div>`;
  setHtml($('powers'), 'pw', pw);
  el.pfill.style.width = (clamp(G.P / L, 0, 1) * 100).toFixed(1) + '%';
  const ms = el.markers.children;
  for (let i = 0; i < G.ghosts.length; i++){
    const g = G.ghosts[i], node = ms[i + 1]; if (!node) continue;
    const s = ghostAt(g, G.t);
    node.style.left = (s ? clamp(s.P / L, 0, 1) * 100 : 100) + '%';
  }
  if (ms[0]) ms[0].style.left = (clamp(G.P / L, 0, 1) * 100).toFixed(1) + '%';
}
function buildMarkers(){
  el.markers.innerHTML = '';
  const me = document.createElement('div'); me.className = 'mk me'; el.markers.appendChild(me);
  G.ghosts.forEach(g => { const n = document.createElement('div'); n.className = 'mk'; n.style.background = g.color; n.title = g.name; el.markers.appendChild(n); });
}

/* ---------------------------------------------------------------- pantallas */
const screens = { menu: $('screen-menu'), story: $('screen-story'), multi: $('screen-multi'), help: $('screen-help'), pause: $('screen-pause'), end: $('screen-end') };
function showScreen(name){ for (const k in screens) screens[k].classList.toggle('hidden', k !== name); }
function playerName(){ return (store.get('planeo2.name', '') || 'Nuki').slice(0, 14); }

/* ---------------------------------------------------------------- inicio / fin de nivel */
async function startLevel(mode, idx, carry){
  Sound.init(); Sound.startMusic();
  let cfg, opts = {};
  if (mode === 'inf'){ const n = carry ? G.infN + 1 : 0; const ic = infConfig(n); cfg = ic.cfg; opts = ic.opts; G.infN = n; }
  else cfg = LEVELS[idx];
  setLevel(genLevel(cfg, opts));
  AMB.init(THEME.amb);
  G.mode = mode; G.ch = mode === 'inf' ? G.infN % 3 : idx;
  G.ghosts = mode === 'multi' ? await Ghosts.runtime(cfg.seed) : [];
  const keep = !!(carry && mode === 'inf');
  Object.assign(G, { state: 'countdown', P: 0, vP: 0, x: MID, tgt: MID, bank: 0, inv: 0, slow: 0, diveT: 0, brakeT: 0, fallT: 0, cp: 20, shake: 0,
    cd: keep ? 1.8 : 3.4, cdShown: 4, flash: 0, lightning: 0, lightT: 4, fade: keep ? 1 : 0, recT: 0, boss: null, bossDone: false, endT: 0, t0: 0, dying: false, noPlane: false });
  if (!keep) Object.assign(G, { t: 0, hearts: 3, acorns: 0, combo: 0, deaths: 0, kills: 0, totalDist: 0, Ps: [], Xs: [] });
  else G.hearts = Math.min(3, G.hearts + 1);
  G.starT = 0; G.magT = 0; if (!keep) G.shield = false;
  particles.length = 0; keys.dive = keys.brake = false; hudCache = {};
  buildMarkers(); showBossBar(false); showScreen(null); el.hud.classList.remove('hidden');
  el.banner.classList.remove('show');
  Sound.setMood(cfg.theme); Sound.intensity = 0;
  showLevelTitle(mode === 'inf' ? 'Nivel ' + (G.infN + 1) + ' · ' + cfg.name : mode === 'story' ? 'Capítulo ' + (idx + 1) + ' · ' + cfg.name : cfg.name);
}
function goMenu(){
  Sound.setMood('menu'); setLevel(genLevel(LEVELS[0])); AMB.init(THEME.amb);
  Object.assign(G, { state: 'menu', boss: null, ghosts: [], fade: 0, noPlane: false, fallT: 0, flash: 0, lightning: 0 });
  particles.length = 0; showScreen('menu'); el.hud.classList.add('hidden'); el.banner.classList.remove('show'); showBossBar(false); refreshMenu();
}
function pauseGame(){
  if (G.state !== 'playing' && G.state !== 'countdown') return;
  G.prevState = G.state; G.state = 'paused'; showScreen('pause');
}
function resumeGame(){ if (G.state !== 'paused') return; G.state = G.prevState || 'playing'; showScreen(null); }
function restartLevel(){ if (G.mode === 'inf') startLevel('inf', 0, false); else startLevel(G.mode, G.ch, false); }

function move(dir){
  if (G.state !== 'playing' && G.state !== 'countdown') return;
  const n = clamp(G.tgt + dir, 0, LANES - 1);
  if (n !== G.tgt){ G.tgt = n; Sound.sfx('move'); }
}
function doDive(){ if (G.diveT <= 0 && !keys.dive) Sound.sfx('dive'); G.diveT = 1.3; G.brakeT = 0; }
function doBrake(){ if (G.brakeT <= 0 && !keys.brake) Sound.sfx('brake'); G.brakeT = 1.3; G.diveT = 0; }

function burst(x, y, color, n, spd, size){
  for (let i = 0; i < n; i++){
    const a = Math.random() * 6.283, v = (0.3 + Math.random()) * spd;
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.2, life: 0.5 + Math.random() * 0.5, max: 1, color, size: size * (0.6 + Math.random() * 0.8), g: 200 });
  }
}
function hurt(o){
  const p0 = playerScreen();
  if (G.starT > 0){   // invencible: el enemigo estalla
    o.hit = true; o.dead = true; G.acorns += 2; G.shake = 6; Sound.sfx('smash');
    burst(p0.x, p0.y, '#ffe36b', 22, 300, 8); burst(p0.x, p0.y, '#ffffff', 12, 220, 6); return;
  }
  if (G.shield){      // el escudo absorbe un golpe
    o.hit = true; G.shield = false; G.inv = 1.4; G.shake = 7; Sound.sfx('pop');
    burst(p0.x, p0.y, '#8fd8ff', 26, 280, 8); burst(p0.x, p0.y, '#ffffff', 14, 200, 6); toast('¡El escudo te salvó!'); return;
  }
  o.hit = true; G.hearts--; G.inv = 1.8; G.slow = 0.9; G.shake = 14; G.combo = 0; G.flash = 0.35;
  Sound.sfx('hit');
  const p = playerScreen();
  burst(p.x, p.y, o.type === 'bee' || o.type === 'comet' ? '#ffd23f' : o.type === 'thunderbox' || o.type === 'storm' ? '#ffe36b' : o.type === 'crystal' ? '#9fe7ff' : o.type === 'crate' ? '#e0a060' : '#ffffff', 22, 260, 9);
  if (G.hearts <= 0){
    G.fallT = 1.6; G.vP = 0; Sound.sfx('fall');
    if (G.mode === 'inf'){ G.dying = true; banner('¡Se acabó el vuelo!', 1500); }
    else banner('¡Uy!<small>' + (G.boss ? 'Inténtalo otra vez' : 'Volvemos al último punto de control') + '</small>', 1500);
  }
}
function collect(o){
  o.taken = true;
  const p = playerScreen();
  if (o.type === 'shield'){ G.shield = true; Sound.sfx('power'); burst(p.x, p.y, '#8fd8ff', 18, 220, 7); toast('¡Escudo! Absorbe un golpe'); }
  else if (o.type === 'star'){ G.starT = 6; G.inv = Math.max(G.inv, 0.3); Sound.sfx('power'); burst(p.x, p.y, '#ffe36b', 26, 280, 8); toast('¡Estrella! Invencible 6 s'); }
  else if (o.type === 'magnet'){ G.magT = 9; Sound.sfx('power'); burst(p.x, p.y, '#ff7a7a', 18, 220, 7); toast('¡Imán! Las bellotas vienen a ti'); }
  else if (o.type === 'heart'){
    if (G.hearts < 3) G.hearts++; else G.acorns += 5;
    Sound.sfx('heart'); burst(p.x, p.y, '#ff7aa8', 16, 200, 8); toast('¡Corazón!');
  } else {
    const val = (o.type === 'gold' ? 5 : 1) * (diving() ? 2 : 1);
    G.acorns += val; G.combo++;
    Sound.sfx(o.type === 'gold' ? 'gold' : 'acorn', G.combo - 1);
    burst(p.x, p.y, o.type === 'gold' ? '#ffe36b' : '#ffc27a', o.type === 'gold' ? 18 : 8, 170, 6);
    if (G.combo > 0 && G.combo % 10 === 0) toast('¡Racha de ' + G.combo + '!');
  }
}

/* el jefe cayó: historia / multijugador muestran resultados, infinito sigue al siguiente nivel */
function onBossDefeated(){
  if (G.mode === 'inf'){
    G.kills++; G.totalDist += L; G.state = 'transition'; G.fade = 0; Sound.sfx('level'); toast('¡Jefe derrotado! Subimos otra vez…');
    return;
  }
  G.state = 'ended'; showEnd(true);
}
function gameOverInf(){ G.state = 'ended'; showEnd(false); }
const esc2 = esc;

async function showEnd(win){
  el.banner.classList.remove('show'); showBossBar(false);
  $('btnNext').classList.add('hidden'); $('btnShare').classList.add('hidden'); $('btnAgain').classList.remove('hidden');
  if (G.mode === 'inf'){
    const dist = Math.round(G.totalDist + Math.min(G.P, L)), score = Math.round(dist / 10 + G.acorns * 10 + G.kills * 300);
    const rec = score > Inf.score; if (rec){ Inf = { score, level: G.infN + 1 }; store.set('planeo3.inf', Inf); }
    $('endTitle').textContent = rec ? '¡Nuevo récord! 🏆' : 'Fin del vuelo';
    $('endStats').innerHTML = stat(G.infN + 1, 'NIVEL') + stat(dist + ' m', 'DISTANCIA') + stat(G.acorns + ' 🌰', 'BELLOTAS') + stat(G.kills, 'JEFES') + stat(score + (rec ? ' ⭐' : ''), 'PUNTOS');
    $('endRank').innerHTML = `<p class="sub">Récord: ${Inf.score} puntos · nivel ${Inf.level}. Cada nivel es más rápido y más difícil que el anterior.</p>`;
    showScreen('end'); el.hud.classList.add('hidden'); Sound.setMood('sad'); return;
  }
  const time = G.t0 || G.t, cfg = LEVELS[G.ch];
  const score = Math.round(G.acorns * 10 + Math.max(0, 200 - time) * 5 - G.deaths * 50);
  const prev = Story.d.best[cfg.id], rec = !prev || time < prev.time;
  Story.d.best[cfg.id] = { time: rec ? time : prev.time, score: Math.max(score, prev ? prev.score : 0) };
  const recScore = !prev || score > prev.score;
  let mine = Ghosts.mine(cfg.seed);
  if (!mine || rec){
    try { mine = await Ghosts.add(await encodeGhost({ seed: cfg.seed, time, acorns: G.acorns, name: playerName(), Ps: G.Ps, Xs: G.Xs }), true); } catch (e) {}
  }
  G.lastCode = mine ? mine.code : null;
  if (G.mode === 'story'){ Story.d.done[G.ch] = true; Story.d.unlocked = Math.max(Story.d.unlocked, Math.min(3, G.ch + 2)); }
  Story.save();
  $('endTitle').textContent = rec ? '¡Nuevo récord! 🏆' : '¡Jefe derrotado! 🎉';
  $('endStats').innerHTML = stat(fmtTime(time), 'TIEMPO') + stat(G.acorns + ' 🌰', 'BELLOTAS') + stat(score + (recScore ? ' ⭐' : ''), 'PUNTOS') + stat(G.deaths, 'CAÍDAS');
  const rows = [{ name: playerName() + ' (tú)', time, you: true }];
  G.ghosts.forEach(g => rows.push({ name: g.name, time: g.time }));
  rows.sort((a, b) => a.time - b.time);
  $('endRank').innerHTML = (G.mode === 'multi' && rows.length > 1)
    ? '<h3 style="margin:6px 0">Carrera</h3>' + rows.map((r, i) => `<div class="rk ${r.you ? 'you' : ''}"><em>${i + 1}</em><b>${esc(r.name)}</b><span>${fmtTime1(r.time)}</span></div>`).join('')
    : `<p class="sub">${G.mode === 'story' ? 'Una Bellota Dorada recuperada.' : 'Tu partida quedó guardada como fantasma.'}</p>`;
  if (G.mode === 'story'){ $('btnNext').classList.remove('hidden'); $('btnNext').textContent = G.ch < 2 ? 'Continuar ▶' : 'Ver el final ▶'; }
  if (G.mode === 'multi') $('btnShare').classList.remove('hidden');
  showScreen('end'); el.hud.classList.add('hidden'); Sound.setMood('happy'); Sound.sfx('win');
}
const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;

/* ---------------------------------------------------------------- historia */
function playChapter(i){
  const key = i === 0 ? 'intro' : 'pre' + i;
  startCine(key, () => startLevel('story', i));
}
function afterChapter(i){
  startCine('post' + i, () => {
    if (i < 2) playChapter(i + 1);
    else startCine('outro', () => { goMenu(); toast('¡Historia completada! Prueba el Modo Infinito'); });
  });
}
function refreshStory(){
  document.querySelectorAll('.pname').forEach(n => { n.textContent = playerName(); });
  const box = $('chapters'); box.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const open = i < Story.d.unlocked, done = Story.d.done[i], best = Story.d.best[lv.id];
    const d = document.createElement('div'); d.className = 'chap' + (open ? '' : ' locked');
    d.innerHTML = `<div class="n">${i + 1}</div><div><b>${esc(lv.name)}</b><span>Jefe: ${esc(lv.bossName)}</span></div><em>${open ? (done ? '✅ ' + (best ? fmtTime(best.time) : '') : '▶ Jugar') : '🔒'}</em>`;
    if (open) d.onclick = () => { Sound.init(); Sound.sfx('ui'); playChapter(i); };
    box.appendChild(d);
  });
  const all = Story.d.done.every(Boolean), next = Story.d.done.findIndex(d => !d);
  $('btnStoryGo').textContent = all ? '🎬 Ver la historia completa' : (next === 0 ? 'Empezar la historia' : 'Continuar: capítulo ' + (next + 1));
}

/* ---------------------------------------------------------------- multijugador */
function refreshMulti(){
  const tabs = $('tabs'); tabs.innerHTML = '';
  LEVELS.forEach((lv, i) => { const b = document.createElement('button'); b.className = 'tab' + (i === G.multiIdx ? ' on' : ''); b.textContent = lv.short; b.onclick = () => { G.multiIdx = i; refreshMulti(); }; tabs.appendChild(b); });
  const seed = LEVELS[G.multiIdx].seed, list = Ghosts.forSeed(seed), box = $('ghostList');
  if (!list.length){ box.innerHTML = '<div class="empty">Aún no hay fantasmas en este nivel.<br>Termínalo una vez o pega el código de un amigo.</div>'; return; }
  box.innerHTML = list.map((g, i) => `<div class="gh"><i style="background:${g.mine ? '#fff' : GHOST_COLORS[i % GHOST_COLORS.length]}"></i><b>${g.mine ? 'Tu mejor · ' : ''}${esc(g.name)}</b><span>${fmtTime1(g.time)}</span><button data-copy="${g.id}" title="Copiar código">📋</button><button data-del="${g.id}" title="Borrar">🗑️</button></div>`).join('');
}
async function copyText(txt){
  try { await navigator.clipboard.writeText(txt); return true; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
}
function refreshMenu(){
  const done = Story.d.done.filter(Boolean).length;
  $('bestLine').textContent = `Historia ${done}/3 · Récord infinito: ${Inf.score} pts`;
}

/* ---------------------------------------------------------------- actualización */
function update(dt){
  G.tAnim += dt;
  AMB.update(dt);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
  if (G.lightning > 0) G.lightning = Math.max(0, G.lightning - dt);
  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i]; p.life -= dt; if (p.life <= 0 || p.y > H + 40){ particles.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  if (G.state === 'menu'){ G.P = (G.tAnim * 40) % (L_SKY - 300); G.vP = 18; G.x = MID; G.bank = 0; G.boss = null; return; }
  if (G.state === 'paused' || G.state === 'ended') return;
  if (G.state === 'transition'){
    G.fade += dt * 1.6; G.vP += (30 - G.vP) * Math.min(1, dt * 2); G.P += G.vP * dt;
    if (G.fade >= 1){ G.state = 'busy'; startLevel('inf', 0, true); }
    return;
  }
  if (G.state === 'busy') return;
  if (G.fade > 0 && G.state === 'countdown') G.fade = Math.max(0, G.fade - dt * 1.3);
  if (G.state === 'countdown'){
    G.x += (G.tgt - G.x) * Math.min(1, dt * 13); G.bank = lerp(G.bank, (G.tgt - G.x) * 0.9, Math.min(1, dt * 10));
    G.cd -= dt;
    const n = Math.ceil(G.cd);
    if (n !== G.cdShown && n >= 1 && n <= 3){ G.cdShown = n; banner(String(n) + '<small>¡prepárate para planear!</small>', 0); Sound.sfx('tick'); }
    if (G.cd <= 0){ G.state = 'playing'; banner('¡Planea!', 900); Sound.sfx('go'); }
    return;
  }
  if (G.state !== 'playing') return;

  G.t += dt;
  G.inv = Math.max(0, G.inv - dt); G.slow = Math.max(0, G.slow - dt);
  G.starT = Math.max(0, G.starT - dt); G.magT = Math.max(0, G.magT - dt);
  G.diveT = Math.max(0, G.diveT - dt); G.brakeT = Math.max(0, G.brakeT - dt);
  const prog = clamp(G.P / L, 0, 1);

  // relámpagos de la tormenta
  if (THEME.lightning){
    G.lightT -= dt;
    if (G.lightT <= 0){ G.lightT = 5 + Math.random() * 6; G.lightning = 0.22; setTimeout(() => Sound.sfx('thunder'), 350); }
  }

  if (G.fallT > 0){
    G.fallT -= dt; G.vP = 0;
    if (G.fallT <= 0){
      if (G.dying){ gameOverInf(); return; }
      G.hearts = 3; G.inv = 3; G.deaths++; G.combo = 0; G.vP = 8;
      if (G.boss){ const B = G.boss; B.warns.length = B.projs.length = B.haz.length = B.gifts.length = 0; B.cool = 2; }
      else { G.P = G.cp; G.x = G.tgt = MID; LV.objs.forEach(o => { if (o.P > G.cp - 2 && o.P < G.cp + 60) o.hit = false; }); LV.dyn.forEach(d => { if (d.P > G.cp - 2) { d.hit = false; d.dead = false; d.act = null; d.pe = d.P; d.pz = 99; if (d.cur !== undefined) d.cur = d.lane; } }); }
      banner('¡Otra vez!', 900);
    }
  } else {
    let target;
    if (G.boss) target = LV.spd1 * 0.8;
    else {
      const base = lerp(LV.spd0, LV.spd1, prog); let m = 1;
      if (diving()) m *= 1.45; else if (braking()) m *= 0.62; if (G.slow > 0) m *= 0.55;
      if (G.starT > 0) m *= 1.18;
      target = Math.min(base * m, 58);
    }
    G.vP += (target - G.vP) * Math.min(1, dt * 2.5);
    const Pprev = G.P; G.P += G.vP * dt;
    const objs = LV.objs;
    const reach = G.magT > 0 ? 11 : 1.4;
    for (let i = lowerBound(objs, Pprev - 1.4); i < objs.length && objs[i].P <= G.P + reach; i++){
      const o = objs[i]; if (o.hit || o.taken || o.dead) continue;
      if (isPickup(o)){ const dx = Math.abs(o.lane - G.x); if (dx < (G.magT > 0 && !(o.type === 'shield' || o.type === 'star' || o.type === 'magnet') ? 3 : 0.8) && (G.magT > 0 || (o.P >= Pprev - 1.4 && o.P <= G.P + 1.4))) collect(o); }
      else if (o.P <= G.P + 1.4 && staticHit(o, G.x, G.t) && G.inv <= 0) hurt(o);
    }
    for (const d of LV.dyn){
      if (d.dead) continue; updateDyn(d, dt);
      const z = d.pe - G.P;
      if (!d.hit && d.pz > -1.2 && z < 1.2 && Math.abs(laneOf(d, G.t) - G.x) < hitRadius(d) && G.inv <= 0) hurt(d);
      d.pz = z;
    }
    if (!G.boss){
      for (const c of CHECKPOINTS) if (Pprev < c && G.P >= c && c > G.cp){ G.cp = c; banner('🚩 Punto de control', 1200); Sound.sfx('cp'); }
      if (G.P >= L) bossStart();
    }
  }
  if (G.boss) updateBoss(dt);
  G.x += (G.tgt - G.x) * Math.min(1, dt * 13);
  G.bank = lerp(G.bank, (G.tgt - G.x) * 0.9, Math.min(1, dt * 10));
  Sound.intensity = G.boss ? 1 : prog;
  G.recT += dt;
  while (G.recT >= 0.25){ G.recT -= 0.25; G.Ps.push(Math.round(G.P * 10)); G.Xs.push(Math.round(clamp(G.x, 0, LANES - 1) * 8)); }
  updateHud();
}

/* ---------------------------------------------------------------- entrada */
document.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  const k = e.key;
  if (G.state === 'cine'){
    if (k === ' ' || k === 'Enter' || k === 'ArrowRight'){ cineAdvance(); e.preventDefault(); }
    else if (k === 'Escape'){ endCine(); }
    return;
  }
  if (k === 'ArrowLeft' || k === 'a' || k === 'A'){ move(-1); e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'd' || k === 'D'){ move(1); e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 's' || k === 'S' || k === ' '){ if (!keys.dive) Sound.sfx('dive'); keys.dive = true; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'w' || k === 'W'){ if (!keys.brake) Sound.sfx('brake'); keys.brake = true; e.preventDefault(); }
  else if (k === 'Escape' || k === 'p' || k === 'P'){ G.state === 'paused' ? resumeGame() : pauseGame(); }
  else if (k === 'm' || k === 'M'){ toggleMute(); }
});
document.addEventListener('keyup', e => {
  const k = e.key;
  if (k === 'ArrowDown' || k === 's' || k === 'S' || k === ' ') keys.dive = false;
  else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.brake = false;
});
let ptr = null;
canvas.addEventListener('pointerdown', e => {
  Sound.init();
  if (G.state === 'cine'){ cineAdvance(); e.preventDefault(); return; }
  ptr = { x: e.clientX, y: e.clientY, swiped: false, id: e.pointerId }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault();
});
canvas.addEventListener('pointermove', e => {
  if (!ptr || ptr.id !== e.pointerId) return;
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, T = 32;
  if (Math.abs(dx) > T && Math.abs(dx) >= Math.abs(dy)){ move(dx > 0 ? 1 : -1); ptr.x = e.clientX; ptr.y = e.clientY; ptr.swiped = true; }
  else if (Math.abs(dy) > T){ dy > 0 ? doDive() : doBrake(); ptr.x = e.clientX; ptr.y = e.clientY; ptr.swiped = true; }
});
const endPtr = e => {
  if (!ptr || ptr.id !== e.pointerId) return;
  if (!ptr.swiped && e.type === 'pointerup') move(e.clientX < W / 2 ? -1 : 1);
  ptr = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
window.addEventListener('blur', () => { pauseGame(); keys.dive = keys.brake = false; });
['gesturestart', 'dblclick'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));

function refreshMusicBtn(){ const t = (Sound.musicOn ? '🎵 Música: sí' : '🔇 Música: no'); $('btnMusic').textContent = t; $('btnMusicP').textContent = t; }
function toggleMusic(){ Sound.init(); Sound.startMusic(); Sound.setMusic(!Sound.musicOn); refreshMusicBtn(); }
function toggleMute(){ Sound.init(); Sound.setMuted(!Sound.muted); const t = Sound.muted ? '🔇' : '🔊'; $('btnMute').textContent = t; $('btnMute2').textContent = t + ' Sonido'; }

/* botones */
const saveName = () => store.set('planeo2.name', $('inName').value.trim().slice(0, 14));
$('btnStory').onclick = () => { saveName(); Sound.init(); Sound.startMusic(); Sound.sfx('ui'); refreshStory(); showScreen('story'); };
$('btnInf').onclick = () => { saveName(); startLevel('inf', 0, false); };
$('btnMulti').onclick = () => { saveName(); Sound.init(); Sound.startMusic(); Sound.sfx('ui'); refreshMulti(); showScreen('multi'); };
$('btnHelp').onclick = () => showScreen('help');
document.querySelectorAll('.back').forEach(b => b.onclick = () => { showScreen('menu'); refreshMenu(); });
$('btnStoryGo').onclick = () => {
  const all = Story.d.done.every(Boolean), next = Story.d.done.findIndex(d => !d);
  if (all) startCine('intro', () => startCine('post0', () => startCine('post1', () => startCine('post2', () => startCine('outro', () => goMenu())))));
  else playChapter(next < 0 ? 0 : next);
};
$('btnMultiGo').onclick = () => startLevel('multi', G.multiIdx, false);
$('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame; $('btnMute').onclick = toggleMute; $('btnMusic').onclick = toggleMusic; $('btnMusicP').onclick = toggleMusic; $('btnMute2').onclick = toggleMute;
$('btnRestart').onclick = restartLevel; $('btnQuit').onclick = goMenu;
$('btnAgain').onclick = restartLevel; $('btnEndMenu').onclick = goMenu;
$('btnNext').onclick = () => afterChapter(G.ch);
$('btnSkip').onclick = () => endCine();
$('btnShare').onclick = async () => {
  if (!G.lastCode){ toast('Aún no hay fantasma guardado'); return; }
  toast((await copyText(G.lastCode)) ? 'Código copiado: pégalo en un chat' : 'No se pudo copiar');
};
$('btnCopyMine').onclick = async () => {
  const m = Ghosts.mine(LEVELS[G.multiIdx].seed); if (!m){ toast('Primero termina este nivel'); return; }
  toast((await copyText(m.code)) ? 'Código copiado' : 'No se pudo copiar');
};
$('btnAddCode').onclick = async () => {
  const v = $('inCode').value.trim(); if (!v) return;
  try {
    const g = await Ghosts.add(v, false); $('inCode').value = '';
    const lvIdx = LEVELS.findIndex(l => l.seed === g.seed); if (lvIdx >= 0) G.multiIdx = lvIdx;
    refreshMulti(); toast('Fantasma de ' + g.name + ' añadido 👻');
  } catch (e) { toast(e.message || 'Código no válido'); }
};
$('ghostList').addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.del){ Ghosts.remove(t.dataset.del); refreshMulti(); }
  else if (t.dataset.copy){ const g = Ghosts.list.find(x => x.id === t.dataset.copy); if (g) toast((await copyText(g.code)) ? 'Código copiado' : 'No se pudo copiar'); }
});
$('inName').value = store.get('planeo2.name', '');
$('inName').addEventListener('input', saveName);   // el nombre se guarda al escribir y se usa en todos los diálogos
$('btnMute').textContent = Sound.muted ? '🔇' : '🔊'; $('btnMute2').textContent = (Sound.muted ? '🔇' : '🔊') + ' Sonido';

/* ---------------------------------------------------------------- bucle */
let last = performance.now();
const logoCtx = $('logoCv').getContext('2d');
function drawLogo(){
  const c = logoCtx; c.clearRect(0, 0, 260, 230);
  glow(c, 130, 120, 120, 'rgba(255,200,120,A)');
  c.save(); c.translate(0, Math.sin(G.tAnim * 1.6) * 4); drawSquirrelFront(c, 122, 92, 46, { t: G.tAnim, mood: 'happy', look: Math.sin(G.tAnim * 0.7) * 0.6 }); c.restore();
}
let qAcc = 0, qN = 0;
function frame(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  qAcc += dt; if (++qN >= 120){ if (qAcc / qN > 0.03) Q.bloom = false; qAcc = 0; qN = 0; }   // calidad adaptable: si el dispositivo va justo, se apaga el resplandor
  if (G.state === 'menu' && !screens.menu.classList.contains('hidden')) drawLogo();
  if (G.state === 'cine'){ updateCine(dt); drawCine(); }
  else { update(dt); drawScene(dt); }
  requestAnimationFrame(frame);
}
try { document.fonts && document.fonts.load('600 20px Fredoka'); document.fonts.load('700 20px Fredoka'); } catch (e) {}
setLevel(genLevel(LEVELS[0])); AMB.init(THEME.amb);
refreshMenu(); refreshMusicBtn();
requestAnimationFrame(frame);

// ganchos para pruebas
window.__planeo = { G, update, drawScene, Ghosts, encodeGhost, decodeGhost, startLevel, startCine, cineAdvance, Story, LEVELS, goMenu, infConfig, genLevel, setLevel, getLV: () => LV, getC: () => C };
