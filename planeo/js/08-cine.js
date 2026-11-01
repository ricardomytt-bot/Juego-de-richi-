/* 08 · cinemáticas: escenas ilustradas con diálogo, música y voz de "blips" */
'use strict';
const CINE = {
  intro: [
    { sc: 'island', tod: 'dawn', glow: 1, who: 'Narrador', m: 'story', txt: 'En lo más alto del cielo flota el Pueblo Ardilla. Tres Bellotas Doradas lo mantienen en el aire y lo iluminan día y noche.' },
    { sc: 'thieves', tod: 'night', who: 'Narrador', m: 'sad', txt: 'Pero una noche, tres ladrones del cielo se llevaron las bellotas: el Capitán Grajo, Nubarrón Trueno y Don Búho.' },
    { sc: 'island', tod: 'night', glow: 0, sink: 1, who: 'Narrador', m: 'sad', txt: 'Sin su luz, el pueblo empezó a hundirse, muy despacio, hacia el suelo.' },
    { sc: 'hangar', who: 'Nuki', mood: 'worry', m: 'story', txt: '¡Abuelo! Si el pueblo llega al suelo antes del invierno, nos quedamos sin casa. Tengo que recuperar las bellotas.' },
    { sc: 'hangar', who: 'Abuelo', mood: 'happy', txt: 'Mi viejo avioncito todavía vuela, Nuki. Y recuerda: cuando tengas dudas, frena, respira y vuelve a mirar.' },
    { sc: 'hangar', who: 'Nuki', mood: 'happy', txt: '¡Gracias, abuelo! Voy a bajar planeando hasta el último rincón del cielo.' },
    { sc: 'takeoff', tod: 'dawn', who: 'Narrador', m: 'dawn', txt: 'Y así, con las gafas bien puestas, Nuki saltó al vacío.' }
  ],
  post0: [
    { sc: 'bossTalk', boss: 'crow', bm: 'hurt', tod: 'dawn', gift: true, who: 'Capitán Grajo', mood: 'angry', m: 'sad', txt: '¡Graaak! Eres más veloz de lo que pensaba, ardilla... Está bien. Quédate tu bellota.' },
    { sc: 'bossTalk', boss: 'crow', bm: 'hurt', tod: 'dawn', gift: true, who: 'Nuki', mood: 'happy', m: 'happy', txt: '¡Una recuperada! Faltan dos.' },
    { sc: 'bossTalk', boss: 'crow', bm: 'angry', flee: true, tod: 'dawn', who: 'Capitán Grajo', mood: 'angry', m: 'storm', txt: 'Los otros no serán tan amables. Nubarrón Trueno ya te espera... ¡Graaak!' }
  ],
  pre1: [
    { sc: 'stormIntro', tod: 'storm', who: 'Narrador', m: 'storm', txt: 'Más abajo, el cielo se volvió gris. Una tormenta enorme guardaba la segunda bellota.' },
    { sc: 'stormIntro', tod: 'storm', who: 'Nuki', mood: 'worry', txt: 'Nubarrón Trueno... Dicen que nunca deja de llover donde él pasa.' }
  ],
  post1: [
    { sc: 'bossTalk', boss: 'storm', bm: 'sad', tod: 'storm', rain: true, gift: true, who: 'Nubarrón Trueno', mood: 'sad', m: 'sad', txt: '¡Buaaa! No quería asustar a nadie... Solo quería que alguien viniera a verme.' },
    { sc: 'bossTalk', boss: 'storm', bm: 'sad', tod: 'storm', rain: true, gift: true, who: 'Nuki', mood: 'surprise', txt: '¿Todo esto por sentirte solo?' },
    { sc: 'bossTalk', boss: 'storm', bm: 'sad', tod: 'storm', rain: true, gift: true, who: 'Nubarrón Trueno', mood: 'sad', txt: 'Todos huyen de mí cuando truena...' },
    { sc: 'bossTalk', boss: 'storm', bm: 'sad', tod: 'storm', rain: true, gift: true, who: 'Nuki', mood: 'happy', m: 'story', txt: 'Cuando el pueblo vuelva a brillar, vendré a visitarte. Y traeré sol para los dos.' },
    { sc: 'bossTalk', boss: 'storm', bm: 'happy', tod: 'day', gift: true, who: 'Nubarrón Trueno', mood: 'happy', m: 'happy', txt: '¿De verdad? Toma la bellota... ¡y gracias, ardilla!' }
  ],
  pre2: [
    { sc: 'forestIntro', tod: 'dusk', who: 'Narrador', m: 'dusk', txt: 'Al atardecer, Nuki llegó al Bosque Dorado. Estaba tan cerca del suelo que ya olía a hojas secas.' },
    { sc: 'forestIntro', tod: 'dusk', who: 'Nuki', mood: 'worry', txt: 'La última bellota... y la guarda Don Búho. Dicen que nunca duerme.' }
  ],
  post2: [
    { sc: 'bossTalk', boss: 'owl', bm: 'sad', tod: 'dusk', gift: true, who: 'Don Búho', mood: 'sad', m: 'sad', txt: 'Lo siento, ardilla. Sin las bellotas, mi bosque se apagó y se quedó muy frío. Por eso las tomé.' },
    { sc: 'bossTalk', boss: 'owl', bm: 'sad', tod: 'dusk', gift: true, who: 'Nuki', mood: 'happy', m: 'story', txt: 'Con las tres bellotas podemos replantar el bosque entero, y el pueblo seguirá en el cielo.' },
    { sc: 'bossTalk', boss: 'owl', bm: 'happy', tod: 'dusk', gift: true, who: 'Don Búho', mood: 'happy', m: 'happy', txt: '¿Me dejarías ayudar? Soy muy bueno cuidando árboles... y desvelándome.' },
    { sc: 'bossTalk', boss: 'owl', bm: 'happy', tod: 'dusk', gift: true, who: 'Nuki', mood: 'happy', txt: '¡Claro! Pero esta vez, nada de robar. ¡Vamos!' }
  ],
  outro: [
    { sc: 'ending', tod: 'night', who: 'Narrador', m: 'happy', txt: 'Esa noche, las tres bellotas volvieron a brillar. El Pueblo Ardilla se elevó de nuevo, y el bosque de abajo se llenó de luz.' },
    { sc: 'ending', tod: 'night', who: 'Abuelo', mood: 'happy', txt: '¡Así se hace, Nuki! ¿Ves? Frenar de vez en cuando no le hace daño a nadie.' },
    { sc: 'ending', tod: 'night', who: 'Nuki', mood: 'happy', txt: 'Abuelo... mañana volveré a planear. Solo por diversión.' },
    { sc: 'ending', tod: 'night', who: 'Narrador', fin: true, txt: 'FIN. ¿Te animas con el Modo Infinito?' }
  ]
};
const SPEAKERS = {
  'Narrador': { col: '#8a93c9', voice: 0 }, 'Nuki': { col: '#ff8a5c', voice: 2 }, 'Abuelo': { col: '#7c8fb9', voice: -1.5 },
  'Capitán Grajo': { col: '#3a4080', voice: -2.5 }, 'Nubarrón Trueno': { col: '#6b7391', voice: -3 }, 'Don Búho': { col: '#9a6a43', voice: -2 }
};
const TOD = {
  night: { top: [10, 12, 44], bot: [58, 52, 120], stars: 1, moon: true },
  dawn: { top: [96, 136, 216], bot: [255, 204, 154], stars: 0, sun: [255, 220, 150] },
  day: { top: [72, 178, 255], bot: [228, 247, 255], stars: 0, sun: [255, 245, 200] },
  storm: { top: [48, 54, 84], bot: [118, 128, 156], stars: 0, rain: true },
  dusk: { top: [120, 70, 140], bot: [255, 160, 100], stars: 0.3, sun: [255, 190, 110] }
};
let C = null;   // cinemática en curso

function startCine(key, onDone){
  const shots = CINE[key]; if (!shots){ onDone && onDone(); return; }
  C = { key, shots, i: 0, T: 0, t: 0, chars: 0, onDone, blip: 0, wrapped: null, tick: 0 };
  G.state = 'cine'; showScreen(null); el.hud.classList.add('hidden'); el.banner.classList.remove('show'); $('btnSkip').classList.remove('hidden');
  Sound.init(); Sound.startMusic(); cineEnter();
}
const cineWho = s => s.who === 'Nuki' ? playerName() : s.who;                 // el personaje principal usa el nombre que pusiste
const cineTxt = s => s.txt.replace(/Nuki/g, playerName());
function cineEnter(){ const s = C.shots[C.i]; C.t = 0; C.chars = 0; C.wrapped = null; C.txt = cineTxt(s); if (s.m) Sound.setMood(s.m); }
function cineAdvance(){
  if (!C) return;
  const s = C.shots[C.i];
  if (C.chars < C.txt.length){ C.chars = C.txt.length; return; }
  if (C.i >= C.shots.length - 1){ endCine(); return; }
  C.i++; cineEnter(); Sound.sfx('ui');
}
function endCine(){
  const d = C && C.onDone; C = null; $('btnSkip').classList.add('hidden'); if (d) d();
}
function updateCine(dt){
  if (!C) return; C.T += dt; C.t += dt;
  const s = C.shots[C.i], sp = SPEAKERS[s.who] || SPEAKERS['Narrador'];
  const before = Math.floor(C.chars);
  C.chars = Math.min(C.txt.length, C.chars + dt * (s.who === 'Narrador' ? 34 : 30));
  const now = Math.floor(C.chars);
  if (now > before){ const chh = C.txt[now - 1]; if (chh !== ' ' && /[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(chh) && (now % (s.who === 'Narrador' ? 3 : 2) === 0)){ Sound.voice(s.who, chh, now); C.talkT = C.T; } }
  if (G.state === 'cine') G.tAnim += dt;
}

/* ------------------------------------------------------------ pintura de escenas */
function cineSky(tod, T){
  const k = TOD[tod] || TOD.dawn;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(k.top)); g.addColorStop(1, rgb(k.bot)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (k.stars){ ctx.fillStyle = '#fff'; for (const s of STARS){ ctx.globalAlpha = k.stars * (0.4 + 0.6 * Math.abs(Math.sin(T * 1.4 + s.p))); circ(ctx, s.x * W, s.y * H * 0.8, s.r); } ctx.globalAlpha = 1; }
  if (k.moon){ const mx = W * 0.82, my = H * 0.17, r = Math.min(W, H) * 0.06; glow(ctx, mx, my, r * 4, 'rgba(210,225,255,A)'); ctx.fillStyle = '#f4f1e6'; circ(ctx, mx, my, r); ctx.fillStyle = 'rgba(0,0,0,.07)'; circ(ctx, mx - r * 0.3, my - r * 0.1, r * 0.25); circ(ctx, mx + r * 0.3, my + r * 0.3, r * 0.18); }
  if (k.sun){ const sx = W * 0.8, sy = H * (tod === 'dusk' ? 0.55 : 0.34), r = Math.min(W, H) * 0.07; glow(ctx, sx, sy, r * 5, rgb(k.sun, 0).replace(',0)', ',A)')); ctx.fillStyle = rgb(mixc(k.sun, [255, 255, 255], 0.5)); circ(ctx, sx, sy, r); }
  // nubes de fondo con paralaje
  for (let i = 0; i < 7; i++){
    const sp = 6 + (i % 3) * 5, w = Math.min(W, H) * (0.28 + (i % 3) * 0.12), x = ((i * 0.31 * W + T * sp) % (W + w * 2)) - w, y = H * (0.12 + (i * 0.13) % 0.62);
    if (tod === 'storm'){ ctx.globalAlpha = 0.9; ctx.save(); ctx.translate(x, y); cloudShape(ctx, w, '#3c4260', '#6b7391', w * 0.05, 'rgba(20,24,46,.5)'); ctx.restore(); }
    else { ctx.globalAlpha = 0.75; drawCloud(ctx, x, y, w, false, T, i); }
  }
  ctx.globalAlpha = 1;
  if (k.rain){
    ctx.strokeStyle = 'rgba(200,220,255,.4)'; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let i = 0; i < 120; i++){ const x = (hash2(i, 3) * (W + 200) - 100 - T * 180) % (W + 200), y = ((hash2(i, 7) * H + T * (900 + hash2(i, 9) * 400)) % (H + 40)); const xx = x < 0 ? x + W + 200 : x; ctx.moveTo(xx, y); ctx.lineTo(xx + 3, y - 18); }
    ctx.stroke();
  }
}
const mixc = mix;

function drawIsland(x, y, S, o){
  o = o || {}; const T = o.T || 0, glw = o.glow === undefined ? 1 : o.glow;
  ctx.save(); ctx.translate(x, y + (o.sink || 0) * S * 0.05 + Math.sin(T * 0.8) * S * 0.012); ctx.rotate((o.tilt || 0) + Math.sin(T * 0.6) * 0.012);
  // roca inferior
  const rk = ctx.createLinearGradient(0, 0, 0, S * 0.75); rk.addColorStop(0, '#9a86a8'); rk.addColorStop(1, '#4b3f62');
  ctx.fillStyle = rk; ctx.beginPath(); ctx.moveTo(-0.52 * S, 0); ctx.bezierCurveTo(-0.5 * S, 0.14 * S, -0.34 * S, 0.3 * S, -0.16 * S, 0.5 * S); ctx.quadraticCurveTo(-0.04 * S, 0.74 * S, 0.02 * S, 0.76 * S); ctx.quadraticCurveTo(0.12 * S, 0.56 * S, 0.3 * S, 0.3 * S); ctx.bezierCurveTo(0.44 * S, 0.16 * S, 0.5 * S, 0.1 * S, 0.52 * S, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.moveTo(-0.4 * S, 0.04 * S); ctx.lineTo(-0.2 * S, 0.34 * S); ctx.lineTo(-0.12 * S, 0.06 * S); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.moveTo(0.1 * S, 0.06 * S); ctx.lineTo(0.02 * S, 0.7 * S); ctx.lineTo(0.3 * S, 0.1 * S); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3f8f4a'; ctx.lineWidth = S * 0.012; ctx.lineCap = 'round';
  for (const vx of [-0.4, -0.28, 0.2, 0.36]){ ctx.beginPath(); ctx.moveTo(vx * S, 0.04 * S); ctx.quadraticCurveTo(vx * S + Math.sin(T + vx * 9) * S * 0.01, 0.12 * S, vx * S, (0.16 + Math.abs(vx) * 0.1) * S); ctx.stroke(); }
  // cascada
  ctx.fillStyle = 'rgba(190,230,255,.65)'; ctx.fillRect(-0.47 * S, 0.02 * S, 0.028 * S, 0.3 * S);
  // césped
  const gg = ctx.createLinearGradient(0, -0.1 * S, 0, 0.04 * S); gg.addColorStop(0, '#9be57e'); gg.addColorStop(1, '#4fae56');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(0, 0, 0.53 * S, 0.075 * S, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#66c55f'; ctx.beginPath(); ctx.ellipse(0, -0.012 * S, 0.5 * S, 0.055 * S, 0, 0, TAU); ctx.fill();
  // casitas
  const houses = [[-0.34, '#f4dcae', '#e0583f'], [-0.2, '#f6e6c4', '#4a79c9'], [-0.07, '#f2d1b0', '#d9a43f']];
  houses.forEach((h, i) => {
    const hx = h[0] * S, hw = S * 0.1, hh = S * 0.07;
    ctx.fillStyle = h[1]; ctx.fillRect(hx - hw / 2, -0.06 * S - hh * 0.2, hw, hh);
    ctx.fillStyle = h[2]; ctx.beginPath(); ctx.moveTo(hx - hw * 0.65, -0.06 * S - hh * 0.2); ctx.lineTo(hx, -0.06 * S - hh * 1.2); ctx.lineTo(hx + hw * 0.65, -0.06 * S - hh * 0.2); ctx.closePath(); ctx.fill();
    const lit = glw > 0.2 ? 0.55 + 0.4 * glw * (0.7 + 0.3 * Math.sin(T * 2 + i * 2)) : 0.15;
    ctx.fillStyle = `rgba(255,210,90,${lit})`; ctx.fillRect(hx - hw * 0.18, -0.06 * S - hh * 0.05, hw * 0.36, hh * 0.45);
  });
  // gran árbol
  const tx = 0.27 * S;
  ctx.fillStyle = '#7a5235'; ctx.beginPath(); ctx.moveTo(tx - 0.03 * S, 0); ctx.lineTo(tx - 0.015 * S, -0.2 * S); ctx.lineTo(tx + 0.015 * S, -0.2 * S); ctx.lineTo(tx + 0.03 * S, 0); ctx.fill();
  const can = [[0, -0.28, 0.16], [-0.1, -0.22, 0.11], [0.1, -0.22, 0.11], [0, -0.36, 0.11]];
  can.forEach((cn, i) => { ctx.fillStyle = ['#3f9d5a', '#4fb36a', '#58c274', '#68c97c'][i]; circ(ctx, tx + cn[0] * S, cn[1] * S, cn[2] * S); });
  ctx.fillStyle = 'rgba(255,255,255,.12)'; circ(ctx, tx - 0.04 * S, -0.34 * S, 0.07 * S);
  // bellotas doradas
  if (glw > 0){
    glow(ctx, tx, -0.28 * S, S * 0.5 * glw, 'rgba(255,225,90,A)');
    [[-0.08, -0.2], [0.09, -0.24], [0.0, -0.33]].forEach((b, i) => { drawAcorn(ctx, tx + b[0] * S, b[1] * S, S * 0.07, 'gold', T + i, i); });
  }
  ctx.restore();
}

function scenePlaneBack(x, y, u, T, bank){
  ctx.save(); ctx.translate(x, y); drawPlane(ctx, u, bank || 0, '#ff5a4a', T, 1, 0, false); ctx.restore();
}

function drawCineScene(s, t, T){
  const S = Math.min(W * 0.95, H * 0.62);
  ctx.save();
  const zoom = 1 + 0.05 * smooth(Math.min(1, t / 7)); ctx.translate(W / 2, H * 0.4); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H * 0.4);
  const sc = s.sc;
  if (sc === 'island'){
    cineSky(s.tod, T);
    const rise = s.tod === 'night' && s.sink ? smooth(Math.min(1, t / 8)) : 0;
    drawIsland(W / 2, H * 0.3 + rise * S * 0.06, S, { T, glow: s.glow === undefined ? 1 : s.glow, sink: s.sink ? t * 0.4 + 1 : 0, tilt: s.sink ? -0.05 : 0 });
  } else if (sc === 'thieves'){
    cineSky('night', T);
    drawIsland(W * 0.34, H * 0.32 + Math.min(1, t / 6) * S * 0.04, S * 0.85, { T, glow: Math.max(0, 1 - t / 3), tilt: -0.06 * Math.min(1, t / 3) });
    const k = t * 0.05;
    [['crow', 0.55, 0.32, 0], ['storm', 0.72, 0.22, 1], ['owl', 0.86, 0.38, 2]].forEach(([type, bx, by, i]) => {
      const x = W * (bx + k * 0.7), y = H * (by - k * 0.4) + Math.sin(T * 2 + i) * 6, sz = Math.min(W, H) * (type === 'storm' ? 0.055 : 0.065);
      glow(ctx, x, y + sz * 0.8, sz * 3, 'rgba(255,225,90,A)');
      ctx.save(); drawBossSprite(type, ctx, x, y, sz, T, { sil: true, flap: 7 }); ctx.restore();
      drawAcorn(ctx, x, y + sz * 1.9, sz * 0.9, 'gold', T + i, i);
    });
  } else if (sc === 'hangar'){
    // interior de madera con ventanal al cielo
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6b4a33'); g.addColorStop(1, '#3d2a1d'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++){ ctx.beginPath(); ctx.moveTo(0, i * H / 11); ctx.lineTo(W, i * H / 11); ctx.stroke(); }
    const wx = W * 0.5, wy = H * 0.07, ww = Math.min(W * 0.8, S * 1.05), wh = H * 0.34;
    ctx.save(); ctx.beginPath(); ctx.roundRect(wx - ww / 2, wy, ww, wh, 22); ctx.clip();
    const sg = ctx.createLinearGradient(0, wy, 0, wy + wh); sg.addColorStop(0, '#6a9be0'); sg.addColorStop(1, '#ffd6a8'); ctx.fillStyle = sg; ctx.fillRect(wx - ww / 2, wy, ww, wh);
    for (let i = 0; i < 4; i++) drawCloud(ctx, wx - ww / 2 + ((i * ww * 0.37 + T * 8) % (ww + 100)) - 30, wy + wh * (0.25 + i * 0.17), ww * 0.28, false, T, i);
    ctx.restore(); ctx.strokeStyle = '#2a1b12'; ctx.lineWidth = 10; ctx.beginPath(); ctx.roundRect(wx - ww / 2, wy, ww, wh, 22); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wh); ctx.stroke();
    // suelo
    ctx.fillStyle = '#2b1d14'; ctx.fillRect(0, H * 0.72, W, H * 0.28);
    // avioncito al fondo
    scenePlaneBack(W * 0.5, H * 0.58, S * 0.1, T, 0);
    // Nuki y abuelo
    const ps = S * 0.14, bobN = Math.sin(T * 2) * 3, bobA = Math.sin(T * 1.6 + 1) * 2;
    drawSquirrelFront(ctx, W * 0.22, H * 0.52 + bobN, ps, { t: T, mood: s.who === 'Nuki' ? (s.mood || 'happy') : 'happy', look: 0.6 });
    drawSquirrelFront(ctx, W * 0.78, H * 0.52 + bobA, ps, { t: T, old: true, mood: s.who === 'Abuelo' ? (s.mood || 'happy') : 'happy', look: -0.6 });
  } else if (sc === 'takeoff'){
    cineSky('dawn', T);
    const k = smooth(Math.min(1, t / 4.5));
    drawIsland(W / 2, H * (0.1 - k * 0.5), S, { T, glow: 0.2 });
    // rayas de velocidad
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < 40; i++){ const x = hash2(i, 1) * W, y = ((hash2(i, 2) * H + T * 700) % H); ctx.moveTo(x, y); ctx.lineTo(x, y - 40 - hash2(i, 3) * 60); }
    ctx.stroke();
    const u = S * lerp(0.1, 0.045, k); scenePlaneBack(W / 2 + Math.sin(T * 1.5) * 8, lerp(H * 0.3, H * 0.62, k), u, T, Math.sin(T * 1.5) * 0.15);
  } else if (sc === 'stormIntro'){
    cineSky('storm', T);
    const kk = Math.min(1, t / 3);
    ctx.save(); ctx.globalAlpha = kk; drawStormKing(ctx, W / 2, H * 0.25, S * 0.1, T, { mood: 'angry', sil: t < 1.2 }); ctx.restore();
    scenePlaneBack(W / 2 + Math.sin(T) * 10, H * 0.62, S * 0.06, T, Math.sin(T) * 0.1);
    if (Math.sin(T * 1.3) > 0.97 || (t % 4.3) < 0.1){ ctx.fillStyle = 'rgba(235,240,255,.35)'; ctx.fillRect(0, 0, W, H); }
  } else if (sc === 'forestIntro'){
    cineSky('dusk', T);
    // bosque de siluetas
    for (let layer = 0; layer < 3; layer++){
      ctx.fillStyle = ['#7b4a6c', '#5a3558', '#3a2342'][layer];
      const by = H * (0.62 + layer * 0.07);
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 16){ const h = (28 + hash2(x / 16 + layer * 30, 5) * 54) * (1 + layer * 0.5) * (S / 520); ctx.lineTo(x, by - h); ctx.lineTo(x + 8, by - h * 0.55); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
    // ojos brillantes del búho
    const ex = W * 0.62, ey = H * 0.5, bl = (T % 4) < 0.15 ? 0.1 : 1;
    ctx.fillStyle = '#ffd23f'; ctx.globalAlpha = Math.min(1, t / 2); ell(ctx, ex, ey, 7, 9 * bl); ell(ctx, ex + 26, ey, 7, 9 * bl); ctx.globalAlpha = 1;
    // hojas cayendo
    for (let i = 0; i < 18; i++){ const x = (hash2(i, 4) * W + Math.sin(T + i) * 20) % W, y = (hash2(i, 6) * H + T * (30 + hash2(i, 8) * 30)) % H; ctx.fillStyle = i % 2 ? '#e8a33d' : '#c9792f'; ell(ctx, x, y, 6, 3.2, T + i); }
    scenePlaneBack(W * 0.36 + Math.sin(T * 1.2) * 10, H * 0.5, S * 0.07, T, Math.sin(T * 1.2) * 0.12);
  } else if (sc === 'bossTalk'){
    cineSky(s.tod, T);
    if (s.tod === 'dusk'){ ctx.fillStyle = 'rgba(58,35,66,.55)'; ctx.fillRect(0, H * 0.72, W, H * 0.28); }
    let bx = W / 2, by = H * 0.3 + Math.sin(T * 1.7) * 7, sz = S * (s.boss === 'storm' ? 0.095 : 0.12);
    if (s.flee){ const k = smooth(Math.min(1, t / 3)); bx += k * W * 0.6; by -= k * H * 0.18; sz *= 1 - k * 0.5; }
    if (s.gift){ glow(ctx, W / 2, H * 0.52, S * 0.4, 'rgba(255,225,90,A)'); drawAcorn(ctx, W / 2, H * 0.52 + Math.sin(T * 2) * 6, S * 0.1, 'gold', T, 1); }
    drawBossSprite(s.boss, ctx, bx, by, sz, T, { mood: s.bm || 'angry', flap: s.boss === 'crow' ? 5 : 3 });
    scenePlaneBack(W / 2 + Math.sin(T) * 6, H * 0.68, S * 0.06, T, 0);
  } else if (sc === 'ending'){
    cineSky('night', T);
    const k = smooth(Math.min(1, t / 6));
    drawIsland(W / 2, lerp(H * 0.62, H * 0.28, k), S, { T, glow: 1 });
    // fuegos artificiales
    for (let f = 0; f < 5; f++){
      const ph = (T * 0.7 + f * 0.37) % 1.8, id = Math.floor(T * 0.7 + f * 0.37 / 1.8), fx = W * (0.12 + hash2(f, id) * 0.76), fy = H * (0.1 + hash2(f + 9, id) * 0.3);
      if (ph < 1.4){ const r = ph * S * 0.16, a = 1 - ph / 1.4; for (let i = 0; i < 18; i++){ const an = i * 0.349; ctx.fillStyle = `rgba(${i % 2 ? '255,210,90' : '255,140,170'},${a})`; circ(ctx, fx + Math.cos(an) * r, fy + Math.sin(an) * r + ph * ph * 12, 2.4); } }
    }
    // bosque iluminado abajo
    ctx.fillStyle = '#1c2b3a'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 20){ ctx.lineTo(x, H * 0.86 - hash2(x / 20, 2) * 24 * (S / 520) - 10); } ctx.lineTo(W, H); ctx.fill();
    ctx.globalAlpha = k; for (let i = 0; i < 26; i++){ ctx.fillStyle = 'rgba(255,225,120,.85)'; circ(ctx, hash2(i, 12) * W, H * (0.88 + hash2(i, 13) * 0.1), 2 + Math.sin(T * 2 + i) * 0.8); } ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function wrapLines(text, maxW){
  const words = text.split(' '), lines = []; let line = '';
  for (const w of words){ const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line){ lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line); return lines;
}
function drawPortrait(who, mood, px, py, R, T){
  ctx.save(); ctx.beginPath(); ctx.arc(px, py, R, 0, TAU); ctx.clip();
  const g = ctx.createLinearGradient(0, py - R, 0, py + R); g.addColorStop(0, '#ffe9c9'); g.addColorStop(1, '#f5b98a'); ctx.fillStyle = who === 'Nubarrón Trueno' ? '#aab3c9' : who === 'Capitán Grajo' ? '#9aa6d8' : who === 'Don Búho' ? '#f1d3a6' : g; ctx.fillRect(px - R, py - R, R * 2, R * 2);
  if (who === 'Nuki') drawSquirrelFront(ctx, px, py + R * 0.05, R * 0.58, { t: T, mood: mood || 'happy' });
  else if (who === 'Abuelo') drawSquirrelFront(ctx, px, py + R * 0.05, R * 0.58, { t: T, old: true, mood: mood || 'happy' });
  else if (who === 'Capitán Grajo') drawCrow(ctx, px, py + R * 0.5, R * 0.5, T, { mood: mood === 'angry' ? 'angry' : 'sad', flap: 0 });
  else if (who === 'Nubarrón Trueno') drawStormKing(ctx, px, py + R * 0.1, R * 0.34, T, { mood: mood === 'happy' ? 'happy' : mood === 'angry' ? 'angry' : 'sad' });
  else if (who === 'Don Búho') drawOwl(ctx, px, py + R * 0.55, R * 0.5, T, { mood: mood === 'happy' ? 'happy' : mood === 'angry' ? 'angry' : 'sad' });
  ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, R, 0, TAU); ctx.stroke();
}

function drawCine(){
  if (!C) return;
  const s = C.shots[C.i], T = C.T;
  drawCineScene(s, C.t, T);
  // barras de cine
  const bar = H * 0.075 * smooth(Math.min(1, T * 1.4));
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  // fundido de entrada
  const fi = clamp(1 - C.t / 0.5, 0, 1); if (fi > 0){ ctx.fillStyle = `rgba(0,0,0,${fi})`; ctx.fillRect(0, 0, W, H); }
  // cuadro de diálogo
  const maxW = Math.min(W * 0.92, 880), boxX = (W - maxW) / 2, hasPort = s.who !== 'Narrador', portR = Math.min(46, maxW * 0.09), pad = 16;
  ctx.font = '600 ' + Math.round(clamp(W * 0.045, 16, 24)) + 'px ' + FONT;
  const lh = Math.round(clamp(W * 0.045, 16, 24) * 1.35), textX = boxX + pad + (hasPort ? portR * 2 + 14 : 0), textW = maxW - pad * 2 - (hasPort ? portR * 2 + 14 : 0);
  if (!C.wrapped || C.wrappedFor !== C.i + ':' + W){ C.wrapped = wrapLines(C.txt, textW); C.wrappedFor = C.i + ':' + W; }
  const boxH = Math.max(C.wrapped.length * lh + pad * 2 + 18, hasPort ? portR * 2 + pad * 2 : 0), boxY = H - bar - boxH - 14;
  ctx.fillStyle = 'rgba(14,16,40,.78)'; ctx.beginPath(); ctx.roundRect(boxX, boxY, maxW, boxH, 20); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2; ctx.stroke();
  const sp = SPEAKERS[s.who] || SPEAKERS['Narrador'];
  if (hasPort) drawPortrait(s.who, s.mood, boxX + pad + portR, boxY + pad + portR, portR, T);
  // etiqueta con el nombre
  const whoName = cineWho(s); ctx.font = '700 14px ' + FONT; const nw = ctx.measureText(whoName).width + 22;
  ctx.fillStyle = sp.col; ctx.beginPath(); ctx.roundRect(boxX + 18, boxY - 13, nw, 26, 13); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(whoName, boxX + 29, boxY + 5);
  ctx.font = '600 ' + Math.round(clamp(W * 0.045, 16, 24)) + 'px ' + FONT; ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
  let left = Math.floor(C.chars);
  C.wrapped.forEach((ln, i) => { if (left <= 0) return; const part = ln.slice(0, left); left -= ln.length + 1; ctx.fillText(part, textX, boxY + pad + 14 + 8 + i * lh); });
  if (C.chars >= C.txt.length){ ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(T * 6)})`; ctx.font = '700 16px ' + FONT; ctx.textAlign = 'right'; ctx.fillText('▶', boxX + maxW - 18, boxY + boxH - 12); ctx.textAlign = 'left'; }
  if (s.fin){ const k = clamp((C.t - 1) / 1.5, 0, 1); ctx.globalAlpha = k; ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.round(Math.min(W * 0.2, 110)) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 8; ctx.strokeText('FIN', W / 2, H * 0.34); ctx.fillText('FIN', W / 2, H * 0.34); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
}
