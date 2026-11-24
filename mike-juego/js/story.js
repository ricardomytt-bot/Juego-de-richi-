'use strict';
// ===== Historia: escenas, cinemáticas, diálogos y arranque =====

// ---------- Escenario de cinemáticas ----------
function newStage(o) { return Object.assign({ chars: [], dark: false, flash: 0, shake: 0, card: null, card2: null, end: null, ground: true, movers: [] }, o || {}); }
function addChar(id, x, y, o) {
  const c = Object.assign({ id, x, y, face: 1, anim: 'idle', scale: 1, red: false, glitch: false }, o || {});
  S.stage.chars.push(c); return c;
}
function removeChar(c) { const a = S.stage.chars, i = a.indexOf(c); if (i >= 0) a.splice(i, 1); }
function moveChar(c, tx, speed = 140) {
  if (S.skip) { c.x = tx; return Promise.resolve(); }
  c.face = sign(tx - c.x) || c.face; c.anim = 'walk';
  return new Promise(res => S.stage.movers.push({ c, tx, speed, res }));
}
function updateStage(dt) {
  const st = S.stage;
  st.flash = Math.max(0, st.flash - dt * 1.3); st.shake = Math.max(0, st.shake - dt);
  st.zoom = Math.min(.08, (st.zoom || 0) + dt * (S.dialog ? .0035 : .001));
  const spk = S.dialog && st.chars.find(c => c.id === S.dialog.who), tgt = spk ? (spk.x - W / 2) * .3 : 0; st.panx = lerp(st.panx || 0, tgt, 1 - Math.exp(-dt * 2.2));
  for (let i = st.movers.length - 1; i >= 0; i--) {
    const m = st.movers[i], d = m.tx - m.c.x, step = m.speed * dt;
    if (Math.abs(d) <= step || S.skip) { m.c.x = m.tx; m.c.anim = 'idle'; st.movers.splice(i, 1); m.res(); }
    else m.c.x += sign(d) * step;
  }
  if (st.end && st.end.ready && wasPressed(K.ok)) location.reload();
}
function bang(dark) { if (S.stage) { S.stage.flash = 1; S.stage.shake = .6; S.stage.zoom = 0; if (dark != null) S.stage.dark = dark; } sfx.boss(); }

// ---------- Cinemática 1: la noche en que todo cambió ----------
async function csIntro() {
  S.skip = false; S.busy = true; S.stage = newStage(); setMusic('story');
  const order = ['invictor', 'rius', 'mayo', 'esparta', 'raptor', 'mike', 'timba', 'trolino', 'aquela', 'willy'];
  const C = {}; order.forEach((id, i) => { C[id] = addChar(id, 116 + i * 80, 344, { face: i < 5 ? 1 : -1, scale: 2 }); });
  C.mike.face = 1; C.willy.face = -1;
  await fadeTo(0, 1.2);
  await say('narr', 'Había una vez, en el mundo de bloques de Diamantia, siete estrellas que mantenían todo en orden... y también evitaban que Willy olvidara dónde enterró su hueso.');
  await say('mike', '¡Qué noche tan bonita, amigos! ¿Alguien quiere chocolate? ¡Ah, no! Ya me lo comí. Y el de Timba también.');
  await say('timba', '(bostezo) ¿Ya es de mañana?');
  await say('rius', 'Son las ocho de la noche, Timba. ¡Cocoricó! ...Perdón, me salió solo.');
  await say('mayo', 'Yo solo vine por la pizza. ¿Hay pizza? ¿No? Entonces ya me voy... a pedir una.');
  await say('esparta', '¡ESTO ES... una reunión muy tranquila!');
  await say('raptor', 'Les juro que esta escena es igualita a un anime que vi ayer.');
  await say('trolino', 'Nadie toca mi corona. Nadie. Ni siquiera el viento.');
  await say('invictor', '... (asiente muy serio, con cara de héroe)');
  await say('aquela', 'Mike... las estrellas parpadean muy raro. Algo no está bien.');
  bang(true); setMusic('dark'); await wait(.9);
  const ex = addChar('exe', 480, 215, { scale: 3, float: true, face: -1 });
  await say('exe', '¡MUAJAJAJÁ! ¡Hola, Diamantia! ¿Me extrañaron? ¡Seguro que no, pero igual vine!');
  await say('mike', '¡Exe! ¿Pero qué haces con esa cara? ...Bueno, siempre tienes esa cara.');
  await say('exe', 'Las estrellas oscuras me dieron un poder INFINITO... y también unas ojeras que me quedan espectaculares.');
  await say('exe', '¡Desde hoy tus amigos trabajan para MÍ! ¡Tienen seguro dental y todo!');
  bang();
  const friends = ['invictor', 'rius', 'mayo', 'esparta', 'raptor', 'timba', 'trolino'];
  friends.forEach(id => { C[id].red = true; C[id].glitch = true; });
  await say('timba', 'Exe dice que si lo ayudo me deja dormir tres días seguidos. ¡Trato hecho!', { red: true });
  await say('rius', '¡Cocorico-rrupto y feliz!', { red: true });
  await say('mayo', 'Beep, boop. Exe ofrece pizza con doble queso. Me quedo.', { red: true });
  await say('esparta', '¡ESTO ES... un contrato de trabajo!', { red: true });
  await say('raptor', 'Me prometió el final del anime sin spoilers.', { red: true });
  await say('trolino', 'Mi corona y yo trabajamos ahora para el jefe nuevo.', { red: true });
  await say('narr', 'Invictor asintió muy serio y se fue con los demás. Como siempre, sin decir ni una palabra.');
  await Promise.all(friends.map(id => moveChar(C[id], C[id].x < 480 ? -160 : W + 160, 230)));
  await say('exe', '¡Intenta alcanzarlos, perrito! ¡Muajajá!');
  S.stage.flash = 1; sfx.boss(); removeChar(ex); await wait(.7);
  await say('mike', '¡Timba! ¡Raptor! ¡Chicos! ...No me escuchan. ¡Se fueron más rápido que la pizza de Mayo!');
  await say('aquela', 'Están bajo el poder de las estrellas oscuras. Solo tú puedes restaurarlos, Mike: tu diamante es el único que sigue puro.');
  await say('willy', '¡Guau! (Traducción: ¡Vamos, jefe, que se me enfría el hueso!)');
  await say('mike', '¡Pues andando! Primero iremos por Timba. Seguro está dormido y será fácil... ¿verdad?');
  await say('aquela', 'Ay, Mike. Nunca digas "será fácil".');
  await fadeTo(1, 1);
  S.skip = false;
  S.stage = null; loadLevel(0); setMusic('day');
  await fadeTo(0, .8);
  showHint('Capítulo 1: La casa de Mike', 3.5);
  S.busy = false;
}

// ---------- NPC ----------
async function talkNpc(e) {
  S.busy = true; S.skip = false;
  const id = e.id, lv = S.lvlId;
  if (lv === 0) {
    if (id === 'aquela') {
      await say('aquela', 'Hola, Mike. Muévete con el joystick (o con las flechas). Pulsa ATACAR para usar tu espada y ACTUAR para hablar con la gente. Solo hay dos botones, ¡es facilísimo!');
      await say('mike', '¡Gracias, Aquela! Ya me siento un héroe.');
      await say('aquela', 'Todavía no. Primero golpea al muñeco con ATACAR. Es muy fácil... bueno, eso dicen.');
    } else if (id === 'ambrosio') {
      if (!S.gotLetter) {
        await say('ambrosio', '¡Correo para Mike! Soy Ambrosio, cartero oficial... en prácticas... en muy malas prácticas.');
        await say('mike', '¿Una carta? ¿De quién?');
        await say('ambrosio', 'De Timba. Yo no leo cartas ajenas, pero esta la leí tres veces para estar seguro.');
        await say('narr', '"Querido Mike: si lees esto es porque Exe ya me convenció. Estoy en el Valle del Sueño. No me despiertes antes del mediodía. Atentamente, Timba. P.D.: ¿me guardas pastel?"');
        await say('mike', '¡Entonces Timba está en el Valle del Sueño! ¡Allá voy!');
        await say('ambrosio', 'El camino está lleno de glitches, así que ten cuidado. Y la propina es voluntaria. Muy voluntaria. Se agradece.');
        S.gotLetter = true; showHint('¡Ya puedes cruzar el portal →!', 3.5);
      } else await say('ambrosio', 'Mucha suerte, Mike. Y si ves a mi jefe, dile que sí entregué las cartas. (Algunas.)');
    }
  } else {
    if (id === 'aquela') {
      if (S.dia < 3) await say('aquela', 'La puerta del fondo necesita 3 diamantes puros: uno en el prado del estanque, otro en el claro del norte, y uno escondido tras unas grietas. ¡Golpea las paredes sospechosas!');
      else await say('aquela', 'Ya tienes los 3 diamantes. Detrás de la puerta está Timba. Recuerda: ¡cuando se duerme, golpéalo más fuerte!');
    }
  }
  S.busy = false;
}

// ---------- Cambio de nivel ----------
async function goNext() {
  S.busy = true; S.skip = false; sfx.portal();
  await fadeTo(1, .6);
  loadLevel(S.lvlId + 1); S.leaving = false;
  await fadeTo(0, .6);
  await say('narr', 'Capítulo 1: El Valle del Sueño. Aquí todo es suave y bonito... y probablemente peligroso.');
  await say('willy', '¡Guau! (Traducción: huele a almohada con maldad.)');
  S.busy = false;
}

// ---------- Jefe: Timba ----------
async function startBoss() {
  S.bossStarted = true; S.busy = true; S.skip = false;
  const L = S.lvl; for (const [gx, gy] of L.gate.tiles) L.set(gx, gy, 'G'); sfx.door(); S.shake = .3;
  S.bossLock = true; S.checkpoint = [L.arena.enter[0], L.arena.enter[1]];
  S.boss = makeBoss(); S.boss.state = 'idle'; setMusic('dark');
  if (S.willy) { const fs = freeSpot(L, P.x - 50, P.y + 10, 9, 8); S.willy.x = fs[0]; S.willy.y = fs[1]; S.willy.vx = S.willy.vy = 0; }
  await wait(.6);
  await say('timba', '(roncando) Zzz... zzz... ¿Quién osa interrumpir mi siesta?', { red: true });
  await say('mike', '¡Timba! ¡Soy yo, Mike! ¡Despierta!');
  await say('timba', 'Mike no existe: eres un sueño. Y yo soy el pesadillo. ¡Exe me prometió una cama más grande si te derroto!', { red: true });
  await say('mike', '¡Pero si ya tienes una cama enorme!');
  await say('timba', '...Ah, es verdad. Bueno, igual me pagan en almohadas. ¡PREPÁRATE!', { red: true });
  await say('aquela', 'Mike, ¡cuando se duerma es tu oportunidad! ¡Golpéalo y le harás el doble de daño!');
  S.boss.state = 'walk'; S.boss.t = 1.4; setMusic('boss');
  showHint('¡Esquiva los almohadazos! Si se duerme... ¡golpea fuerte!', 4);
  S.busy = false;
}
async function csTimbaSaved() {
  S.busy = true; S.skip = false; setMusic('story');
  await wait(.9);
  await say('timba', '(parpadea) ¿Eh? ¿Qué pasó? ¿Ya amaneció? ...¿Por qué hay tanta gente en mi cuarto?');
  await say('mike', '¡Timba! ¡Volviste! ¡Estabas bajo el control de Exe!');
  await say('timba', '¿Yo? Solo recuerdo un sueño muy raro donde lanzaba almohadas... y fue lo más divertido que hice en años.');
  await say('aquela', 'Las estrellas oscuras te dominaron. Pero Mike restauró tu conciencia.');
  await say('timba', 'Gracias, Mike. Toma: la Almohada de Estrella. Te hará más fuerte: ¡dos corazones más! Es lo único que tengo... aparte de sueño.');
  P.maxHp += 2; P.hp = P.maxHp; sfx.win(); S.shake = .1;
  spawnP(P.x, P.y - 30, 34, '#9ad0ff', 300, 1);
  showHint('¡ALMOHADA DE ESTRELLA!  +2 corazones', 5);
  await say('timba', 'Yo los ayudo desde tu casa, Mike. Pero antes... ¿alguien tiene un colchón?');
  await say('mike', '¡Gracias, Timba! ¡Vamos por los demás!');
  await fadeTo(1, .8);
  await csEnding();
}
async function csEnding() {
  S.skip = false; S.busy = true;
  S.stage = newStage({ dark: true }); setMusic('dark');
  const C = {};
  [['willy', 240, -1], ['mike', 350, 1], ['timba', 470, 1], ['aquela', 590, -1]].forEach(([id, x, f]) => { C[id] = addChar(id, x, 344, { face: f, scale: 2 }); });
  C.willy.face = 1;
  await fadeTo(0, .8);
  await say('narr', 'Esa noche, en lo alto del cielo de Diamantia...');
  bang(); const ex = addChar('exe', 760, 215, { scale: 3, float: true, face: -1 });
  await say('exe', '¡Vaya, vaya! El perrito restauró a uno de mis empleados. ¡Eso sí que me dio sueño! ...No, espera, eso era de Timba.');
  await say('mike', '¡Exe, vamos a restaurar a todos tus empleados! ¡Y después te toca a ti!');
  await say('exe', 'Quedan SEIS guardianes y siete estrellas oscuras. Ven por mí... si te atreves. ¡Muajajá!');
  await say('timba', 'Mike, ¿puedo dormir un ratito? ...¿Mike?');
  await say('mike', '¡Equipo, prepárense! ¡El próximo capítulo viene con más diamantes y menos siestas!');
  S.stage.flash = 1; sfx.boss(); removeChar(ex); await wait(.8);
  S.skip = false;
  S.stage.end = { dia: S.dia, time: S.playTime, deaths: S.deaths, ready: false };
  sfx.win(); setMusic('title'); await wait(1); S.stage.end.ready = true;
  S.busy = false;
}

// ---------- Arranque ----------
function startGame() {
  MENU.open = false; S.mode = 'play'; S.fade = 1; AUDIO.unlock(); sfx.start(); csIntro();
}
(function boot() {
  const q = new URLSearchParams(location.search);
  setMusic('title'); setAmbient('dream');
  if (q.has('lvl') || q.has('boss') || q.has('end')) {
    S.mode = 'play'; S.fade = 0; MENU.open = false;
    if (q.has('boss')) { loadLevel(1); S.dia = 3; S.gotLetter = true; for (const e of S.ents) if (e.type === 'dia') e.dead = true; openGate(); P.x = 26.5 * T; P.y = 21.5 * T; initWilly(); updateCamera(0, true); }
    else if (q.has('end')) { loadLevel(1); S.dia = 3; csEnding(); }
    else { S.gotLetter = true; loadLevel(parseInt(q.get('lvl')) || 0); }
  }
  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, .05); last = now;
    update(dt); drawFrame();
    for (const k in pressed) delete pressed[k];
    PTR.hit = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
