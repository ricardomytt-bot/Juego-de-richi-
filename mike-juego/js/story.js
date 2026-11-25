'use strict';
// ===== Historia: ciudad, cartas, tren, Valle del Sueño, jefe y diálogos con respuestas =====

// ---------- Escenario 2D de cinemáticas (para el final del piloto) ----------
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

// ---------- utilidades de cámara y estado ----------
const fav = (id, n) => { S.fav[id] = (S.fav[id] || 0) + n; };
const M = t => say('mike', t);
function camTalk(e) { S.camShot = { x: (P.x + e.x) / 2 / T, z: (P.y + e.y) / 2 / T - .4, dist: 10.5 }; }
function camClear() { S.camShot = null; }
function glMood(dark) {
  if (!GL.ok) return; const L = S.lvl;
  if (dark) { GL.scene.background = new THREE.Color(0x2a0a1a); GL.scene.fog = new THREE.Fog(0x4a1228, 20, 70); GL.amb.color.set(0xff8ca0); GL.amb.intensity = .85; GL.hemi.color.set(0xff6a8a); GL.hemi.groundColor.set(0x3a0a1a); GL.sun.color.set(0xff5070); GL.sun.intensity = 1.6; GL.snow = false; }
  else if (L) { glThemeMood(L); if (typeof dpFlatLight === 'function') dpFlatLight(); }
}
function openStationGate() {
  S.flags.gateOpen = true; const L = S.lvlId === 0 ? S.lvl : (ZONES[0] && ZONES[0].L);
  if (L && L.gate) { for (const [x, y] of L.gate.tiles) L.set(x, y, 'a'); if (S.lvlId === 0) { S.gateOpen = true; sfx.door(); S.shake = .25; spawnP(L.gate.x + 24, L.gate.y + 96, 40, '#ffe14a', 320, 1); } }
}
async function deliver(id) {
  S.q.delivered[id] = true; S.q.count++; sfx.key(); floater(P.x - 50, P.y - 80, '¡Carta entregada!', '#ffe14a'); spawnP(P.x, P.y - 30, 16, '#ffe14a', 220, .8);
  if (S.q.count >= S.q.total) { S.q.done = true; openStationGate(); await say('narr', '¡Entregaste todas las cartas! La estación del tren ya está abierta. ¡Ve a despedir a tus amigos!'); showHint('La estación está abierta  →  sigue la flecha', 5); }
  else showHint('Carta entregada  (' + S.q.count + ' / ' + S.q.total + ')', 3.5);
}
const needLetter = (id) => S.q.gotLetters && !S.q.delivered[id];

// ---------- charlas libres (después de las cartas): el jugador elige de qué hablar ----------
const TOPICS = {
  timba: { hi: (d, f) => d ? (f >= 2 ? '(bostezo) Mike... mi persona favorita después de mi cama. Pregunta lo que quieras.' : '(bostezo) ...Hola. Zzz.') : '(bostezo) ...Vuelve cuando tengas algo para mí... zzz...',
    t: [['¿Qué sueñas?', [['timba', 'Sueño que soy una almohada gigante y todos me abrazan.'], ['mike', '...Eso es tierno y raro.'], ['timba', 'Y a veces sueño que sueño. Es muy cansado.']]], ['¿Por qué duermes tanto?', [['timba', 'Es que despierto con hambre, como con sueño, y duermo con ganas. Es un ciclo perfecto.']]], ['Secreto de Timba', [['timba', 'Ven, te digo algo: cuando me duermo en pelea, ¡duele más que me pegues! No se lo digas a Exe.']], 2]] },
  rius: { hi: (d) => d ? '¡Cocoricó! ¿Qué se cuenta, Mike?' : '¡Cocoricó! ¿Buscas algo, Mike? ¡Aquí hay mucho pasto!',
    t: [['Cuéntame un chiste', [['rius', '¿Qué le dice un gallo a otro? ...¡Nada! ¡Los gallos no hablan, son gallos!'], ['mike', '(se ríe) Ese es malísimo.'], ['rius', '¡Cocoricó! ¡Gracias, gracias!']]], ['¿Y tu espada?', [['rius', 'Se llama Madrugadora. Brilla cuando amanece. Y cuando me aburro la uso para abrir sobres.']]], ['La libreta de chistes', [['rius', 'Tengo una libreta con 400 chistes. Solo 3 son buenos. ¡Pero esos 3 son MUY buenos!']], 2]] },
  mayo: { hi: (d) => d ? 'Beep. Cliente Mike registrado. ¿Desea algo del menú?' : 'Beep, boop. Bienvenido a Pizzería Mayo.',
    t: [['¿Qué tiene el menú?', [['mayo', 'Pizza. Pizza con queso. Pizza con más queso. Y la especial: pizza con pizza encima.'], ['mike', '¿Eso es legal?'], ['mayo', 'Aún no hay ley que lo prohíba. Beep.']]], ['¿Eres un robot?', [['mayo', 'Soy un cocinero con circuitos. Mis lágrimas son salsa de tomate. Beep.']]], ['Receta secreta', [['mayo', 'Ingrediente secreto: cariño al 100%. ...Y un poco de orégano. Beep boop.']], 2]] },
  esparta: { hi: (d) => d ? 'Mmm... Mike. Qué gusto. Siéntate, ya casi sale la nieve del día.' : 'Oh... hola, Mike. Con calma, con calma.',
    t: [['¿A qué juegas?', [['esparta', 'A casi todo, pero despacio. Damas, dominó, adivinar nubes...'], ['mike', '¿Y ganas?'], ['esparta', 'A veces. Cuando me da pereza perder.']]], ['¿Por qué tan tranquilo?', [['esparta', 'Porque la prisa es un juego que siempre pierdes. La calma, en cambio, siempre llega a tiempo.']]], ['El juego favorito', [['esparta', 'Mi favorito es mirar la nieve caer. Si cuentas los copos, siempre pierdes la cuenta. Es perfecto.']], 2]] },
  raptor: { hi: (d) => d ? '¡Mike! Justo estaba dibujando una escena épica.' : '¡Shhh! Estoy viendo el final de un anime.',
    t: [['¿Qué dibujas?', [['raptor', 'Un manga sobre un perrito amarillo con capa. Se llama "Mike Z: la saga del chocolate".'], ['mike', '¡Quiero un cameo!'], ['raptor', 'Ya eres el protagonista. Y también el villano. Es profundo.']]], ['Tu capucha roja', [['raptor', 'Me la dio mi abuela. Decía que protege del frío y de los spoilers.']]], ['Final del anime', [['raptor', 'Te lo cuento solo a ti: ...al final todos se abrazan. ¡Ya, ya, no se lo digas a nadie!']], 2]] },
  invictor: { hi: (d) => d ? '¡Mike! ¡Un abrazo de oso! ...Bueno, de romano. ¡Jajaja!' : '¡HOLA HOLA! ¿Vienes a jugar o a visitarme? ¡Las dos cosas están bien!',
    t: [['¿Por qué ese casco?', [['invictor', 'El casco da +10 de valentía y +5 de peinado. Incluye cresta roja de serie. ¡Jajaja!']]], ['¿A qué jugamos?', [['invictor', '¡A las estatuas! Nadie se mueve, y el primero que se ríe pierde. ...¡Jajaja! ¡Perdí!'], ['mike', 'Ni siquiera empezamos.']]], ['La gloria romana', [['invictor', 'Un verdadero romano no cae jamás. ...Salvo si hay una cáscara de plátano. Entonces sí, cae. ¡Jajaja!']], 2]] },
  trolino: { hi: () => 'No te quedes parado, Mike. Correos queda al este. ¡Y la corona no se toca!',
    t: [['¿Y esa corona?', [['trolino', 'Es de oro. De oro falso. Pero de falso muy bien hecho.'], ['mike', 'Se te ve genial.'], ['trolino', 'Lo sé. Siempre lo supe.']]], ['¿Qué lleva tu maleta?', [['trolino', 'Tres camisas, una corona de repuesto y un cojín en forma de dona.'], ['willy', '¡Guau! (Traducción: yo llevo el hueso.)']]], ['¿Estás nervioso?', [['trolino', '...Un poco. Hay algo raro en el aire desde anoche. Pero no digas nada.']], 2]] },
  aquela: { hi: () => 'Hola de nuevo, Mike. Qué buena vibra tienes hoy.',
    t: [['¿Cómo se juega esto?', [['aquela', 'Joystick para moverte. ACTUAR para hablar y ATACAR para la espada. ¡Solo dos botones!']]], ['Pistas de diamantes', [['aquela', 'Hay tres diamantes en la ciudad: al oeste, en el parque del norte y al sureste. ¡Willy los huele!']]], ['¿Quién eres tú?', [['aquela', 'Una gata que ve cosas que otros no ven. Y a veces ve pájaros. Eso me distrae.']], 1]] },
  ambrosio: { hi: () => 'Todavía faltan cartas, ¡tú puedes, héroe!',
    t: [['¿Por qué tantas cartas?', [['ambrosio', 'Porque todos se escriben entre todos y ninguno se lo dice a la cara. Es la magia del correo.']]], ['¿Tu bicicleta?', [['ambrosio', 'Hecha bolita. Está en el taller. El taller es mi cuarto. El mecánico soy yo.']]]] },
  acenix: { hi: (d) => d ? 'Miau. Pasa, pasa. Hay pastel.' : 'Miau. Bienvenido al Café Gatuno.',
    t: [['¿Qué pastel recomiendas?', [['acenix', 'El de chocolate. Es el único. Pero es muy bueno. Miau.']]], ['¿Eres un gato?', [['acenix', 'Soy un gato con estilo. Un gato gris, elegante y misterioso. Miau.'], ['mike', 'Y que reparte pasteles.'], ['acenix', 'Eso también. Es mi talento secreto.']]], ['Un secreto', [['acenix', 'A veces el pastel me mira... y yo lo miro... y nos entendemos sin hablar. Miau.']], 2]] }
};
async function talkAgain(id) {
  const T0 = TOPICS[id], d = !!S.q.delivered[id], f = S.fav[id] || 0;
  await say(id, T0.hi(d, f));
  const list = T0.t.filter(t => !t[2] || f >= t[2]);
  for (;;) {
    const r = await ask(id, '¿De qué quieres hablar?', [...list.map(t => t[0]), 'Nada más, gracias']);
    if (r >= list.length) { await say(id, d ? '¡Nos vemos en el tren!' : 'Aquí estaré.'); break; }
    for (const [who, txt] of list[r][1]) await say(who, txt);
    fav(id, 0);
  }
}
// ---------- conversaciones de la ciudad ----------
const CITY = {
  async trolino() {
    if (!S.flags.trolino1) {
      S.flags.trolino1 = true;
      await say('trolino', '¡Por fin sales, Mike! Llevo media hora esperándote aquí afuera.');
      const r = await ask('trolino', 'Hoy es el gran viaje en tren con los compas. ¿Ya hiciste tu maleta?', ['¡Lista desde ayer!', 'Eh... ¿qué viaje?', 'Mi maleta es un chocolate.']);
      if (r === 0) { await say('trolino', 'Mentira. Tu maleta está llena de chocolates, lo vi.'); await M('Son... provisiones. Para emergencias.'); fav('trolino', 1); }
      else if (r === 1) { await say('trolino', '¡El viaje! ¡Lo hablamos hace una semana! ¡Con el tren! ¡Y los compas!'); await M('Ah. ¡Ese viaje! Claro. Obvio.'); }
      else { await say('trolino', 'Por supuesto que sí. A veces creo que eres un chocolate con patas.'); await M('Y con capa.'); fav('trolino', 2); }
      await say('willy', '¡Guau! (Traducción: yo también voy y no me pueden dejar.)');
      await say('trolino', 'Antes de ir a la estación, pasa por Correos, al este. Ambrosio te anda buscando. Algo de cartas.');
      showHint('Objetivo: habla con Ambrosio en Correos (sigue la flecha)', 5);
    } else await talkAgain('trolino');
  },
  async aquela() {
    if (S.flags.aquela1) { await talkAgain('aquela'); return; } S.flags.aquela1 = true;
    await say('aquela', 'Hola, Mike. Me gusta pasear por tu calle: tiene buena vibra y buenos gatos.');
    const r = await ask('aquela', '¿Quieres un consejo?', ['¿Cómo se juega esto?', 'Sí, dime un secreto', 'No, gracias']);
    if (r === 0) { await say('aquela', 'Con el joystick te mueves. ACTUAR habla con la gente, y ATACAR usa tu espada. Solo dos botones. ¡Fácil!'); await M('Eso sí lo entiendo.'); }
    else if (r === 1) { await say('aquela', 'Hay tres diamantes escondidos por la ciudad: uno al oeste, uno en el parque del norte y otro al sureste. Brillan. ¡Y Willy los huele!'); fav('aquela', 1); }
    else await say('aquela', 'Qué orgullo de gato. Me iré a mirar un pájaro.');
  },
  async ambrosio() {
    const q = S.q;
    if (S.flags.trainDone) {
      await say('ambrosio', S.restored >= 7 ? '¡Mike! Soy cartero, tendero, cocinero, mecánico y ahora alcalde provisional. ¡Todo con descuento de héroe! ...Creo.' : '¡Mike! A mí no me llevó Exe porque estaba repartiendo cartas... y vendiendo perritos... y arreglando el semáforo. Tengo todos los trabajos, ¿recuerdas? ¡Soy un noob multitarea!');
      const r = await ask('ambrosio', '¿Qué necesitas hoy?', ['Ver la tienda', 'Solo saludar']);
      if (r === 0) setTimeout(() => openMenu('shop'), 50); else await say('ambrosio', '¡Pues aquí estaré! En Correos, en el puesto, en la estación... en todos lados. ¡Soy una persona muy ocupada! ...¿Qué estaba diciendo?');
      return;
    }
    if (!q.gotLetters) { await say('ambrosio', '¡Mike! ¿Dónde estaban mis cartas? Ah, ya... eh... ¡las tengo yo! Toma.'); q.gotLetters = true; await say('narr', 'Recibiste 7 cartas.'); return; }
    if (!q.done) { const left = q.total - q.count; await say('ambrosio', left === 1 ? '¡Solo falta una carta! ...Eh... ¿o eran dos? No, una. ¡Mira la flecha amarilla!' : 'Todavía faltan ' + left + ' cartas. ¡Tú puedes! Yo me quedo aquí, perdido. ¡Digo, trabajando!'); await talkAgain('ambrosio'); return; }
    await say('ambrosio', '¡Entregaste todas! ¡GG, Mike! Ahora ve al tren, que si no se va sin ti... y sin mí. Bueno, yo no voy. ¿O sí?');
  },
  async timba() {
    if (!needLetter('timba')) { await talkAgain('timba'); return; }
    await say('timba', '(bostezo) ...¿Quién es? ¿Ya es de mañana? ¿O todavía es ayer?');
    const r = await ask('timba', 'Ah, ¿una carta? Qué amable... Me da pereza abrir sobres. ¿Me la lees tú?', ['Te la leo con gusto', 'Ábrela tú, flojo', '¿Y si te leo un cuento mejor?']);
    if (r === 0) { await say('narr', '"Timba: no olvides despertar a tiempo para el tren. Atentamente, tu mejor amigo."'); await say('timba', 'Qué lindo, Mike. Eres mi persona favorita... después de mi cama.'); fav('timba', 2); }
    else if (r === 1) { await say('timba', '(se ofende en cámara lenta) ...Qué... grosero... Pero la abriré... mañana.'); fav('timba', -1); }
    else { await say('timba', '¡Sí! Un cuento... ¡Había una vez una almohada muy... zzz...'); await M('¡Timba! ¡No te duermas!'); await say('timba', '(ronca) ...Pe-perdón. ¡Qué cuento tan bueno!'); fav('timba', 1); }
    await deliver('timba');
  },
  async rius() {
    if (!needLetter('rius')) { await talkAgain('rius'); return; }
    await say('rius', '¡COCORICÓ! ¡Buenos días, buenos días! Perdón, es costumbre.');
    const r = await ask('rius', '¡Adivina! ¿Qué hace un pollo cuando sale el sol?', ['¿Canta?', '¿Trabaja en un banco?', 'No sé... ¿cocorico?']);
    if (r === 0) { await say('rius', '¡Exacto! Cocorico. Ya veo que eres de los inteligentes.'); fav('rius', 1); }
    else if (r === 1) { await say('rius', '¡Jajaja! ¡Un pollo banquero! ¡Lo voy a anotar en mi libreta de chistes!'); fav('rius', 2); }
    else { await say('rius', '¡Eso! Tú sí hablas el idioma gallina.'); fav('rius', 1); }
    await say('rius', 'Ah, una carta. Déjala en el nido. Siempre las pierdo... Pero esta no, ¡esta me la guardo!');
    await deliver('rius');
  },
  async mayo() {
    if (!needLetter('mayo')) { await talkAgain('mayo'); return; }
    await say('mayo', 'Beep, boop. Bienvenido a Pizzería Mayo. Analizando cliente... Mike detectado.');
    const r = await ask('mayo', 'Pregunta importante: ¿con qué quieres tu pizza?', ['Con piña', 'Solo queso', 'Con chocolate (¡estilo Mike!)']);
    if (r === 0) { await say('mayo', 'ERROR 404: buen gusto no encontrado... Es broma. Todos tenemos derecho a equivocarnos.'); fav('mayo', -1); }
    else if (r === 1) { await say('mayo', 'Clásico. Respeto absoluto. Beep.'); fav('mayo', 1); }
    else { await say('mayo', 'Eso es... innovador y aterrador al mismo tiempo. Me gusta. Beep boop.'); fav('mayo', 2); }
    await say('mayo', 'Entrega recibida. Carta archivada junto al queso rallado.');
    await deliver('mayo');
  },
  async esparta() {
    if (!needLetter('esparta')) { await talkAgain('esparta'); return; }
    await say('esparta', 'Oh... hola, Mike. Pasa, pasa. Qué día tan bonito para no hacer nada, ¿no crees?');
    const r = await ask('esparta', '¿Jugamos algo tranquilo? Tengo todo el día. Y la tarde. Y la noche.', ['Juguemos a las nubes', 'Mejor unas damas', 'Solo vine a dejarte la carta']);
    if (r === 0) { await say('esparta', 'Mira esa: parece un perro con capa. ...Ah, eres tú. Perdón, la nube se parece a ti. Jeje.'); fav('esparta', 2); }
    else if (r === 1) { await say('esparta', 'Muy bien. Pero te aviso: pierdo a propósito para que ganes. Es mi forma de jugar bonito.'); fav('esparta', 2); }
    else { await say('esparta', 'Ah, claro, la carta. Sin prisa. Las cartas, igual que el té, se disfrutan despacio.'); fav('esparta', 1); }
    await say('esparta', 'Una carta... para mí. Gracias, Mike. La leeré con calma, junto a la ventana, mientras nieva un poquito.');
    await deliver('esparta');
  },
  async raptor() {
    if (!needLetter('raptor')) { await talkAgain('raptor'); return; }
    await say('raptor', '¡Mike! Mira este póster: edición limitada, firmado, ¡con el final SIN spoilers!');
    const r = await ask('raptor', 'Pregunta seria: ¿cuál es el mejor anime de la historia?', ['El de los diamantes y los perros', 'El de los ninjas, obvio', 'No veo anime, veo caricaturas']);
    if (r === 0) { await say('raptor', 'Ese no existe... todavía. ¡Pero ya me diste una idea para dibujar!'); fav('raptor', 2); }
    else if (r === 1) { await say('raptor', '¡Un hombre de cultura! ¡Dattebayo!'); fav('raptor', 1); }
    else { await say('raptor', 'Las caricaturas también cuentan. ¡Todo es anime si le pones suficiente drama!'); fav('raptor', 1); }
    await say('raptor', 'Una carta... ¿será una invitación a una convención? ¡Voy a leerla ahora mismo!');
    await deliver('raptor');
  },
  async invictor() {
    if (!needLetter('invictor')) { await talkAgain('invictor'); return; }
    await say('invictor', '¡HOLA HOLA HOLA! ¡Mike! ¡Soy Invictor, el romano más feliz de toda Diamantia!');
    const r = await ask('invictor', '¡Vamos a jugar! ¿A qué quieres jugar?', ['Al escondite', 'A las espadas (con cuidado)', 'A adivinar qué dice la carta']);
    if (r === 0) { await say('invictor', '¡Uno, dos, tres! ¡Ya voy!... ¿Mike? ¿Dónde te escondiste? ¡Estás parado frente a mí! ¡Jajaja!'); fav('invictor', 2); }
    else if (r === 1) { await say('invictor', '¡Tac, tac, tac! ¡Gané! ...Ah, no, no estábamos jugando. ¡Jajaja! ¡Igual fue divertido!'); fav('invictor', 2); }
    else { await say('invictor', 'Mmm... ¿una invitación a un banquete? ¿Mil monedas? ¿Un perrito? ¡O todo junto!'); fav('invictor', 2); }
    await say('invictor', '¡Una carta para MÍ! ¡Nunca me escriben! ¡Qué felicidad! ¡Voy a bailar con mi capa!');
    await deliver('invictor');
  },
  async acenix() {
    if (!needLetter('acenix')) { await talkAgain('acenix'); return; }
    await say('acenix', 'Miau. ...Perdón, se me escapó. Bienvenido al Café Gatuno.');
    const r = await ask('acenix', '¿Quieres pastel o prefieres jugar con el puntero láser?', ['Pastel, por favor', '¡El láser!', 'Los dos, por favor']);
    if (r === 0) { await say('acenix', 'Chocolate, como siempre. Eres de los míos.'); fav('acenix', 1); }
    else if (r === 1) { await say('acenix', '¡DÓNDE ESTÁ! ¡DÓNDE ESTÁ! ...¡Ahí! ¡Miau! ¡Miau!'); fav('acenix', 2); }
    else { await say('acenix', 'Un cliente que sabe lo que quiere. Me caes bien.'); fav('acenix', 2); }
    await say('acenix', 'Una carta. Mmm. Huele a pescado. Eso es buena señal.');
    await deliver('acenix');
  }
};
const CIT = [
  ['Buenos días. ¿Sabías que las palomas de la plaza cobran peaje?', ['¿En serio?', 'Qué raro', 'Yo les pago con migas'], ['Sí, y nunca dan cambio.', 'La ciudad está llena de misterios.', '¡Entonces eres su cliente favorito!']],
  ['¡Cuidado, Mike! Dicen que hay slimes por el parque. ...Bueno, eso dicen.', ['No les tengo miedo', '¿Slimes? ¿Dónde?', 'Les daré chocolate'], ['Qué valiente. O qué despistado.', 'Ay, no sé. Me lo contó una paloma.', 'Los slimes no comen eso... ¡creo!']],
  ['Estoy practicando para el concurso de silbidos. ¿Cómo voy?', ['¡Muy bien!', 'Mejor practica en otro lado', 'Sopla más fuerte'], ['¡Gracias! Eres muy amable.', 'Uy. Qué honestidad tan dolorosa.', 'Fiuuuuu... ¡mejoré!']],
  ['Mi gato no quiere ir a la estación. Dice que los trenes son ruidosos.', ['Los gatos saben mucho', 'Dale una galleta', '¡Muuuy ruidosos!'], ['Y tiene razón, siempre.', 'Buena idea. Es su debilidad.', '¡Eso lo asustó más!']],
  ['Hoy toda la ciudad habla de tu viaje en tren. ¡Qué emoción!', ['¡Estoy muy emocionado!', 'Un poco nervioso', '¿Quién les contó?'], ['¡Que les vaya genial!', 'Respira hondo y mastica chocolate.', 'Ambrosio. Siempre Ambrosio.']],
  ['Perdí mi sombrero. Es azul, redondo y sabe volar. ¿Lo viste?', ['No, pero te ayudo a buscar', '¿Un sombrero volador?', 'Se lo llevó el viento'], ['¡Qué buen vecino eres!', 'Es un sombrero de calidad.', 'Seguro. Tiene alma de globo.']]
];
async function citizenTalk(e) {
  const c = CIT[(e.seed - 1) % CIT.length], seed = e.seed;
  await say(e.id, c[0], { name: 'Vecino', seed, portrait: false });
  const r = await ask(e.id, '¿Qué le respondes?', c[1], { name: 'Vecino', seed, portrait: false });
  await say(e.id, c[2][r], { name: 'Vecino', seed, portrait: false });
}
const JOBS = {
  perritos: { name: 'Puesto de perritos', lines: ['¡Peeerritos calientes! ...eh... ¿calientes? Sí. Los calenté yo. Con la mano. ¡Es broma! Con un microondas.'], shop: true },
  conductor: { name: 'Jefe de estación', lines: ['¡Atención, pasaje... pasajeros! Soy el jefe de estación. Y el conductor. Y el que silba. ¡Chu-chu! ...Perdón, a veces me emociono.', '¿Que yo soy el cartero? Sí. ¿Y el conductor? Sí. ¿Y el que vende los boletos? También. Los lunes soy tres personas. Los martes me pierdo.'] },
  mesero: { name: 'Mesero', lines: ['¡Bienvenido al Rest... al Restaurante La Estrella! Soy el mesero. Y el cocinero. Y el que lava platos. ¡Y el que escribe el menú! Con faltas.', 'Hoy hay pizza. Y mañana también. Es que solo me sé una receta. Y me salió media quemada. ¡Pero con cariño!'] },
  dj: { name: 'DJ Ambrosio', lines: ['¡Un aplauso para el DJ! ...Soy yo. Soy DJ Ambrosio. También arreglo bicicletas. Pero esas las arreglo peor.', 'Si escuchas la radio de Diamantia: sí, soy yo. El pronóstico, las noticias y la canción. ¡Y a veces el eco! ...eco, eco, eco.'] }
};
async function jobTalk(e) {
  const J = JOBS[e.job] || JOBS.perritos;
  for (const l of J.lines) await say('ambrosio', l, { name: 'Ambrosio · ' + J.name });
  if (e.shop && S.flags.trainDone) { const r = await ask('ambrosio', '¿Quieres ver la mercancía?', ['Ver la tienda', 'Más tarde'], { name: 'Ambrosio · ' + J.name }); if (r === 0) setTimeout(() => openMenu('shop'), 50); }
  else if (e.shop) await say('ambrosio', 'Cuando termine el desastre del tren, abriré la tienda aquí también. ¡Eso sí: pago en monedas!', { name: 'Ambrosio · ' + J.name });
}
async function talkNpc(e) {
  S.busy = true; S.talking = true; S.skip = false; camTalk(e);
  try {
    if (e.job) await jobTalk(e);
    else if (S.lvlId === 0 || S.lvlId >= 10) { if (e.type === 'citizen') await citizenTalk(e); else await (CITY[e.id] || (async () => { }))(e); }
    else if (e.id === 'aquela') {
      if (S.dia < 3) await say('aquela', 'La puerta del jefe necesita 3 diamantes. Hay puertas de colores y llaves escondidas en los laberintos. ¡Explora y mira el mapa en el menú!');
      else await say('aquela', 'Ya tienes los 3 diamantes. Detrás de la puerta está ' + ((BOSS_DATA[LEVEL_BOSS[S.lvlId]] || BOSS_DATA.timba).foe) + '. Recuerda: ' + (BOSS_DATA[LEVEL_BOSS[S.lvlId]] || BOSS_DATA.timba).tip);
    }
  } finally { camClear(); S.busy = false; S.talking = false; }
}

// ---------- apertura ----------
function startGame() {
  MENU.open = false; S.mode = 'play'; S.fade = 1; AUDIO.unlock(); sfx.start();
  S.q = { gotLetters: false, delivered: {}, count: 0, total: 7, done: false, trainStarted: false }; S.fav = {}; S.flags = {}; S.wave = null; S.camShot = null;
  csOpening();
}
async function walkP(tx, ty, sp = 150) {
  P.forceMove = true;
  for (let i = 0; i < 900; i++) { const dx = tx - P.x, dy = ty - P.y, d = Math.hypot(dx, dy); if (d < 5 || S.skip) break; const k = Math.min(d, sp * (S.dtv || .016)); P.x += dx / d * k; P.y += dy / d * k; P.dx = dx / d; P.dy = dy / d; P.moving = true; if (Math.abs(dx) > .3) P.face = sign(dx); P.anim += S.dtv || .016; await wait(.016); }
  P.forceMove = false; P.moving = false;
}
async function gatherMove(list, timeout = 6) {
  for (const [e, tx, ty] of list) { e._arr = false; e.goto = { x: tx * T, y: ty * T, speed: 150, done: () => { e._arr = true; } }; }
  let t = 0; while (t < timeout && !S.skip && list.some(([e]) => !e._arr)) { await wait(.1); t += .1; }
  for (const [e, tx, ty] of list) { if (!e._arr) { e.goto = null; e.vx = e.vy = 0; e.x = tx * T; e.y = ty * T; } }
}
async function seriesCard(t1, t2, secs = 2.6) {
  S.stage.card = t1; S.stage.card2 = t2 || null; await wait(secs); S.stage.card = null; S.stage.card2 = null; await wait(.4);
}
async function camTo(x, z, dist, secs, pitch) {
  const c0 = S.camShot || { x, z, dist }, p0 = S.camPitch || 1.06, n = Math.max(1, Math.round(secs / .033));
  for (let i = 1; i <= n && !S.skip; i++) { const k = i / n, e = k * k * (3 - 2 * k); S.camShot = { x: lerp(c0.x, x, e), z: lerp(c0.z, z, e), dist: lerp(c0.dist, dist, e) }; if (pitch) S.camPitch = lerp(p0, pitch, e); await wait(.033); }
}
async function introCard(t1, t2, secs = 2.8) { S.intro3d.card = t1; S.intro3d.card2 = t2 || null; await wait(secs); S.intro3d.card = null; await wait(.5); }
async function csSeriesIntro() {
  S.skip = false; S.busy = true; S.cineAuto = false; S.fade = 1; setMusic('title');
  loadLevel(51); S.intro3d = { bt: 0 }; S.flags.zona0 = true; S.stage = null;
  if (GL.ok) { if (GL.lvlRef !== S.lvl) glBuildLevel(S.lvl); const sc = GL.scene; sc.background = new THREE.Color(0x0a1030); sc.fog = new THREE.Fog(0x141c48, 18, 64); GL.amb.color.set(0x6a7ac8); GL.amb.intensity = .8; GL.hemi.color.set(0x7a8ae0); GL.hemi.intensity = .5; GL.sun.color.set(0xa8b8ff); GL.sun.intensity = 1.1; GL.plight.intensity = 0; GL.snow = true; GL.camInit = false; }
  S.ents = S.ents.filter(e => e.type !== 'citizen' && e.type !== 'npc'); S.willy = null;
  P.x = 12 * T; P.y = 33 * T; P.dx = 1; P.dy = 0; initWilly(); S.willy.x = P.x - 40; S.willy.y = P.y + 8;
  S.camPitch = .55; S.camShot = { x: 24, z: 30, dist: 26 }; if (GL.ok) { GL.camInit = false; }
  await wait(.8); await fadeTo(0, 2.2);
  await introCard('MIKECRACK', 'Y LAS ESTRELLAS OSCURAS', 3.6);
  await say('narr', 'Hace mucho, siete estrellas brillaban sobre Diamantia y cuidaban los sueños de todos...');
  await camTo(24, 24, 20, 3.5, .9);
  await introCard('EPISODIO 1', 'Un viaje de Navidad', 2.6); setMusic('story');
  await say('narr', 'Víspera de Navidad. La nieve cae despacio, y una luz cálida se asoma en cada ventana.');
  await camTo(14, 33, 9, 2.2, 1.0);
  const tro = { type: 'npc', id: 'trolino', x: 38 * T, y: 33 * T, hw: 10, hh: 10, face: -1.57, vx: 0, vy: 0, tag: 'intro' }; S.ents.push(tro);
  S.cineAuto = true; S.camShot = null;
  await walkP(21 * T, 33 * T, 90); P.dx = 1; P.dy = 0;
  await say('mike', 'Qué noche tan bonita, Willy. Mañana viajamos todos juntos en tren. ¡Va a ser la mejor Navidad!');
  await say('willy', '¡Guau! (Traducción: ¡y yo llevo el hueso!)');
  S.cineAuto = false; S.camShot = { x: 26, z: 32, dist: 12 };
  tro.goto = { x: 26 * T, y: 33 * T, speed: 130, done: () => { } }; await wait(2.6);
  S.cineAuto = true; S.camShot = null;
  await say('trolino', 'Mike, no se te olvide: mañana temprano, todos en la estación. ¡Duerme bien!');
  await say('mike', '¡Dormiré como Timba! ...Bueno, casi.');
  S.cineAuto = false; setMusic('dark'); S.shake = .5; sfx.boss();
  await camTo(24, 22, 16, 1.2, .7);
  const ex = { type: 'exe3d', id: 'exe', x: 24 * T, y: 17 * T, lift: 9 }; S.ents.push(ex);
  if (GL.ok) { GL.scene.background.set(0x2a0a1a); GL.scene.fog.color.set(0x4a1228); GL.amb.color.set(0xff6a8a); GL.snow = false; }
  await camTo(24, 20, 20, 2.4, .5);
  S.cineAuto = false; await say('exe', 'Siete estrellas... y una sola noche. Mañana, nadie viajará solo... porque todos viajarán conmigo.', { red: true });
  await say('narr', 'Pero en lo alto del cielo, alguien los observaba.');
  S.shake = .6; sfx.boss(); await wait(.6); await fadeTo(1, 1.2);
  S.ents = S.ents.filter(e => e.tag !== 'intro' && e.type !== 'exe3d');
  S.camShot = null; S.camPitch = null; S.cineAuto = false;
  await introCard('A LA MAÑANA SIGUIENTE...', null, 2.2);
  S.intro3d = null; S.busy = false;
}
async function csOpening() {
  if (!window.NO_SERIES_INTRO) { await csSeriesIntro(); }
  S.skip = false; S.busy = true; S.flags.zona0 = true; S.cineAuto = true;
  loadLevel(10); S.q.gotLetters = false; setMusic('story'); setAmbient('day'); glMood(false);
  P.x = 4.5 * T; P.y = 3 * T + 20; P.dx = 0; P.dy = 1; initWilly(); S.willy.x = P.x + 50; S.willy.y = P.y + 20;
  const tro = { type: 'npc', id: 'trolino', x: 7.5 * T, y: 8.5 * T, hw: 10, hh: 10, face: Math.PI, vx: 0, vy: 0, tag: 'gather' }; S.ents.push(tro);
  S.camShot = { x: 7.5, z: 4.6, dist: 10.5 }; if (GL.ok) GL.camInit = false;
  await fadeTo(0, 1.6);
  await say('narr', '24 de diciembre. Diamantia amanece fría, pero con una luz cálida en cada ventana.');
  S.camShot = null;
  await say('willy', '¡Guau! ¡Guau, guau! (Traducción: ¡despierta, que hay viaje!)');
  await M('(bostezo) ...Cinco minutitos más... ¿Willy? ¿Por qué estás en mi cama?');
  tro.goto = { x: 7.5 * T, y: 5.2 * T, speed: 130, done: () => { } };
  await wait(1.4);
  await say('trolino', '¡Por fin despiertas! Hoy es el gran día: nos vamos todos de viaje por Navidad, en tren.');
  const r = await ask('trolino', 'Solo vine a avisarte para que hagas tu maleta. ¿Ya sabías?', ['¡Claro, lo tengo todo listo!', '¿Qué viaje?', '¿Puedo llevar chocolate?']);
  if (r === 0) { await M('¡Mi maleta está lista desde... eh... hace cinco minutos!'); await say('trolino', 'Mentira. Mike, tu maleta es una caja de chocolates con ruedas.'); fav('trolino', 1); }
  else if (r === 1) { await say('trolino', '¡El viaje de Navidad! ¡Lo hablamos hace una semana! ¡Con el tren y todos los compas!'); await M('Ah. ¡Ese viaje! Obvio. Totalmente.'); }
  else { await say('trolino', 'Claro que sí. De hecho, creo que sin chocolate el tren no arranca.'); await M('¡Entonces es una cuestión de seguridad!'); fav('trolino', 2); }
  await say('trolino', 'Yo voy a hacer la mía. ¡Haz la tuya, Mike! ¡Nos vemos más tarde!');
  tro.goto = { x: 7.5 * T, y: 8.6 * T, speed: 120, done: () => { tro.hidden = true; sfx.door(); } };
  await wait(4.2);
  await M('Maleta, maleta... capa, chocolate, otro chocolate...');
  await walkP(11 * T, 3.2 * T, 100); await wait(.4); sfx.pop(); floater(P.x - 40, P.y - 80, '¡Maleta lista!', '#ffe14a');
  await M('¡Listo, Willy! Ahora sí: ¡a divertirse!');
  // llega corriendo Ambrosio
  const amb = { type: 'npc', id: 'ambrosio', x: 7.5 * T, y: 8.6 * T, hw: 10, hh: 10, face: Math.PI, vx: 0, vy: 0, tag: 'gather' }; S.ents.push(amb); sfx.door();
  amb.goto = { x: 8.5 * T, y: 5.2 * T, speed: 150, done: () => { } };
  await say('willy', '¡Guau! ¡Guau! (Traducción: ¡viene alguien corriendo!)');
  await wait(2.6);
  await say('ambrosio', '¡HOLAAA Mike! ...eh... ¿Mike? Sí, Mike. Perdón, vine corriendo y se me olvidó para qué. ¡Lag!');
  await say('ambrosio', 'Ah, ya me acordé. Soy el cartero. Creo. Me dieron una mochila y todo.');
  const r2 = await ask('ambrosio', 'Necesito un favor... o un... ¿faborr? ¿Se escribe con v? ¿Me ayudas?', ['Claro, dime el favor', '¿Un qué?', 'Estoy haciendo mi maleta']);
  if (r2 === 0) { await say('ambrosio', '¡Eres un jugador pro! ...Yo soy más bien noob. Pero muy simpático.'); fav('ambrosio', 2); }
  else if (r2 === 1) { await say('ambrosio', 'Un favor. ¡Un favor, Mike! Es cuando uno hace algo por otro. Como cuando me prestas tu lápiz y yo no lo devuelvo.'); fav('ambrosio', 1); }
  else { await say('ambrosio', '¡Ah, qué bueno! Yo no tengo maleta. Tengo una bolsa. Con un sándwich. Que ya me comí.'); fav('ambrosio', 1); }
  await say('ambrosio', 'Es que... se me juntaron las cartas del mes y... eh... el mapa se me perdió. ¿Tú sabes dónde vive Rius? ¿Es un gallo o un pollo? No me acuerdo.');
  await M('Rius es un gallo. Y sí, sé dónde vive todo el mundo.');
  await say('ambrosio', '¡GG, Mike! Toma las 7 cartas. Son para Timba, Rius, Mayo, Esparta, Raptor, Invictor y Acenix. ¡Si pierdes una, no pasa nada! ...Bueno, sí pasa. Pero poquito.');
  S.q.gotLetters = true; sfx.key(); S.shake = .1; spawnP(P.x, P.y - 30, 16, '#ffe14a', 220, .8);
  await say('narr', 'Recibiste 7 cartas. Cada casa del barrio y de la ciudad tiene un dueño esperándote.');
  await say('ambrosio', '¡Gracias, gracias! ¡Me voy corriendo! ...¿Por dónde era la puerta? ¡Ah, ahí!');
  amb.goto = { x: 7.5 * T, y: 8.6 * T, speed: 150, done: () => { amb.hidden = true; sfx.door(); } };
  await wait(4);
  S.ents = S.ents.filter(e => e.tag !== 'gather');
  S.flags.trolino1 = true; S.camShot = null; S.cineAuto = false; S.busy = false;
  showHint('Sal de tu casa (camina hacia ↓ en la puerta) y reparte las 7 cartas', 8);
}

// ---------- el tren ----------
async function csTrain() {
  S.busy = true; S.skip = false; const L = S.lvl;
  await fadeTo(1, .4); P.x = 72.5 * T; P.y = 38.5 * T; P.vx = P.vy = 0; P.dx = 0; P.dy = -1; if (S.willy) { S.willy.x = P.x - 40; S.willy.y = P.y + 10; }
  const crew = [['timba', 68.5], ['rius', 70], ['mayo', 71.5], ['esparta', 73], ['raptor', 74.5], ['invictor', 76], ['acenix', 77.5]];
  for (const [id, x] of crew) S.ents.push({ type: 'npc', id, x: x * T, y: 35.5 * T, hw: 10, hh: 10, face: 0, vx: 0, vy: 0, corrupt: false, tag: 'crew' });
  S.ents.push({ type: 'npc', id: 'trolino', x: 67.5 * T, y: 36 * T, hw: 10, hh: 10, face: 0, vx: 0, vy: 0, tag: 'crew' });
  for (const e of S.ents) if ((e.type === 'npc' && !e.tag && e.id !== 'aquela') || e.type === 'citizen') e.hidden = true;
  S.camShot = { x: 72, z: 34, dist: 14 }; if (GL.ok) GL.camInit = false; setMusic('story'); await fadeTo(0, .6); S.cineAuto = true; await wait(.8); S.camShot = null;
  const f = (id, a, b) => say(id, (S.fav[id] || 0) >= 2 ? a : b);
  await say('narr', 'En la estación todos esperaban el tren, con maletas, bocadillos y mucho sueño.');
  await f('timba', '¡Mike! Tu carta me hizo el día. Zzz... digo, ¡qué alegría verte!', '(bostezo) Mike... llegaste. Zzz...');
  await f('rius', '¡Cocoricó, Mike! ¡Tu chiste del banco me tiene riendo desde la mañana!', '¡Cocoricó, Mike! ¡Qué bueno que viniste!');
  await f('mayo', 'Beep. Nivel de amistad con Mike: 100%. Pizza para el camino.', 'Beep. Mike detectado. Pizza para el camino, aunque no pidas piña.');
  await f('esparta', 'Mmm... Mike. ¿Jugamos algo en el tren? Algo tranquilo. Como mirar por la ventana.', 'Hola, Mike. Qué bueno que viniste. Con calma, que el tren no se va sin nosotros.');
  await f('raptor', '¡Mike! Ya vi el final del anime. ¡No te hago spoiler, lo juro!', 'Mike. Shhh. No hables: estoy leyendo el manga del viaje.');
  await f('invictor', '¡HOLA HOLA! ¡Mike! ¡Vamos a jugar en el tren! ¡Jajaja!', '¡Mike! ¡Qué felicidad que vengas! ¡Jajaja!');
  await f('acenix', 'Miau. Te guardé pastel, Mike. De chocolate.', 'Miau. Hola, Mike. Hay pastel, si quieres.');
  await say('trolino', '¡Mike! ¡Todos a bordo! Y no te olvides de tu capa.');
  await M('¡Esta va a ser la mejor aventura de todas!');
  sfx.boss(); GL.trainShake = true; await wait(.8); GL.trainShake = false;
  // llega Exe
  setMusic('dark'); glMood(true); S.shake = .6; sfx.boss();
  S.ents.push({ type: 'exe3d', id: 'exe', x: 72 * T, y: 30 * T, lift: 6.5 }); S.camShot = { x: 72, z: 31, dist: 20 }; await wait(1.2); S.camShot = null;
  await say('exe', '¡MUAJAJAJÁ! ¡Qué reunión tan bonita! ¡Y qué tren tan bonito! ¡Y qué amigos tan... míos!');
  await M('¡Exe! ¿Qué haces aquí? ¡Y baja de ahí, que vas a romper el techo!');
  await say('exe', 'Con el poder de las estrellas oscuras, ¡tus amigos viajarán conmigo! ¡Tienen seguro de viaje y todo!');
  S.shake = .6; sfx.boss();
  for (const e of S.ents.filter(e => e.tag === 'crew')) e.corrupt = true;
  await say('timba', 'Exe dice que si lo ayudo me deja dormir tres días seguidos. ¡Trato hecho!', { red: true });
  await say('mayo', 'Beep. Exe ofrece pizza con doble queso. Me quedo. Beep.', { red: true });
  await say('invictor', '¡Qué divertido! ¡Todos juntos! ...Aunque me duele un poco la cabeza. ¡Jajaja!', { red: true });
  await say('esparta', 'Mmm... Exe dice que todo es un juego... y yo no quiero perder. Perdón, Mike.', { red: true });
  await say('acenix', 'Miau... Miau... MIAU.', { red: true });
  await say('trolino', 'Mi corona y yo trabajamos ahora para el jefe nuevo. Lo siento, Mike.', { red: true });
  // suben al tren
  const doors = L.trainDoors; let k = 0;
  for (const e of S.ents.filter(e => e.tag === 'crew')) { const d = doors[k++ % doors.length]; e.goto = { x: d[0] + (k % 3 - 1) * 20, y: d[1] + 20, speed: 230, done: () => { e.hidden = true; spawnP(e.x, e.y - 20, 8, '#ff4a8a', 160, .5); sfx.pop(); } }; }
  for (let i = 0; i < 80 && S.ents.some(e => e.tag === 'crew' && !e.hidden); i++) await wait(.1);
  await say('exe', '¡Slimes corrompidos! ¡Ataquen al perrito de la capa! ¡Muajajá!');
  S.ents = S.ents.filter(e => !(e.tag === 'crew')); S.camShot = null; S.cineAuto = false; setMusic('chase'); S.busy = false; startWave(1);
}
async function csTrainEnd() {
  S.busy = true; S.skip = false; S.camShot = { x: 72, z: 32, dist: 17 }; sfx.win();
  await say('exe', '¡Ja! No está mal, perrito. Tus amigos y yo nos vamos de viaje. ¡Alcánzanos si puedes!');
  await M('¡Exe! ¡Devuélvelos! ¡Te voy a restaurar a ti también!');
  await say('exe', 'Los espero en el Valle del Sueño. Ahí empieza lo bueno. ¡Muajajá!');
  GL.trainShake = true; sfx.boss(); const t0 = S.t; while (S.t - t0 < 3.2 && !S.skip) { GL.trainX += 11 * (S.dtv || .016) * (1 + (S.t - t0) * 1.4); await wait(.016); } GL.trainShake = false;
  S.ents = S.ents.filter(e => e.type !== 'exe3d'); glMood(false); setMusic('story'); S.camShot = { x: 72, z: 35, dist: 13 };
  let aq = S.ents.find(e => e.id === 'aquela'); if (!aq) { aq = { type: 'npc', id: 'aquela', x: 69 * T, y: 38 * T, hw: 10, hh: 10, face: 0, vx: 0, vy: 0, tag: 'tmp' }; S.ents.push(aq); } aq.hidden = false; aq.x = 69 * T; aq.y = 38 * T; aq.face = 0;
  await say('aquela', 'Mike, el tren se fue... pero conozco un atajo: el portal del Valle del Sueño. Ahí es donde Exe llevó a los compas.');
  await M('¡Vamos! ¡Willy, a trabajar!'); await say('willy', '¡Guau! (Traducción: ¡por fin hago algo!)');
  S.camShot = null; S.flags.trainDone = true; await enterZone(1, [60, 77]);
}

// ---------- cambio de nivel ----------
async function goNext() {
  S.busy = true; S.skip = false; sfx.portal(); S.wave = null; S.camShot = null;
  await fadeTo(1, .6);
  loadLevel(S.lvlId + 1); S.leaving = false; glMood(false); if (GL.ok) GL.camInit = false;
  await fadeTo(0, .6);
  if (S.lvlId === 2) { setMusic('day'); await say('narr', 'Capítulo 3: Pastelandia. Todo es dulce, esponjoso y huele delicioso... y probablemente tiene trampa.'); await say('willy', '¡Guau! (Traducción: huele a muffin con maldad.)'); }
  else { await say('narr', 'Capítulo 2: El Valle del Sueño. Aquí todo flota, es suave y bonito... y probablemente peligroso.');
  await say('willy', '¡Guau! (Traducción: huele a almohada con maldad.)'); }
  S.busy = false; showHint('Explora los laberintos, busca las llaves y consigue 3 diamantes', 6);
}

// ---------- Jefe: Timba ----------
const BOSS_DATA = {
  timba: { who: 'timba', foe: 'Timba', intro: [['timba', '(roncando) Zzz... zzz... ¿Quién osa interrumpir mi siesta?'], ['mike', '¡Timba! ¡Soy yo, Mike! ¡Despierta! ¡Te entregué tu carta y todo!'], ['timba', 'Mike no existe: eres un sueño. Y yo soy el pesadillo. ¡Exe me prometió una cama más grande si te derroto!'], ['mike', '¡Pero si ya tienes una cama enorme!'], ['timba', '...Ah, es verdad. Bueno, igual me pagan en almohadas. ¡PREPÁRATE!']], tip: '¡cuando se duerma es tu oportunidad! ¡Golpéalo y le harás el doble de daño!', hint: '¡Esquiva los almohadazos! Si se duerme... ¡golpea fuerte!',
    saved: [['timba', '(parpadea) ¿Eh? ¿Qué pasó? ¿Ya amaneció? ...¿Por qué hay tanta gente en mi cuarto?'], ['mike', '¡Timba! ¡Volviste! ¡Estabas bajo el control de Exe!'], ['timba', 'Solo recuerdo un sueño muy raro donde lanzaba almohadas... Gracias, Mike.'], ['aquela', 'Las estrellas oscuras te dominaron. Pero Mike restauró tu conciencia.'], ['timba', 'Toma: la Almohada de Estrella. Te hará más fuerte: ¡+25% de daño! Yo vuelvo a mi casa a dormir... y a ayudar a reconstruir Diamantia.']], reward: () => { P.dmgMul += .25; return 'ALMOHADA DE ESTRELLA  +25% de daño'; } },
  acenix: { who: 'acenix', foe: 'Acenix', intro: [['acenix', 'Miau... Miau... ¿Quién pisa mi cocina? ¡Aquí solo entran clientes con hambre!'], ['mike', '¡Acenix! ¡Soy yo, Mike! ¡Te llevé tu carta!'], ['acenix', 'Los clientes no hablan. Los clientes COMEN. ¡Exe me prometió pasteles infinitos si te derroto!'], ['mike', '¡Acenix, tú ya tienes pasteles infinitos!'], ['acenix', '...Ah. Es verdad. Bueno, igual me da hambre. ¡MIAU!']], tip: '¡cuando se pone a comer, aprovecha! ¡Le harás el doble de daño!', hint: '¡Esquiva los muffins! Si se pone a comer... ¡golpea fuerte!',
    saved: [['acenix', '(parpadea) Miau... ¿Qué pasó? ...¿Por qué hay muffins por todo el suelo?'], ['mike', '¡Acenix! ¡Volviste!'], ['acenix', 'Solo recuerdo que tenía MUCHA hambre... y que alguien me pidió una carta. Gracias, Mike.'], ['acenix', 'Toma: el Muffin Dorado. Recarga tu chocolate más rápido: ¡cada 20 segundos! Miau.']], reward: () => { CHOCO_CD = 20; return 'MUFFIN DORADO  chocolate cada 20 s'; } },
  rius: { who: 'rius', foe: 'Rius', intro: [['rius', '¡COCORICÓ! ¡Este es MI gallinero! ¡Nadie pasa sin pagar con maíz!'], ['mike', '¡Rius! ¡Soy yo, Mike! ¡Tu amigo del chiste del banco!'], ['rius', 'Exe me prometió un huevo de oro... ¡y los huevos de oro no se comparten! ¡Cocoricó!']], tip: '¡cuando se pone a picotear maíz, golpéalo: recibe el doble!', hint: '¡Esquiva los huevazos! Cuando picotea, ¡ataca!',
    saved: [['rius', '(sacude las plumas) ¿Cocoricó? ¿Qué pasó? ...Tengo plumas por todos lados.'], ['mike', '¡Rius! ¡Ya estás bien!'], ['rius', 'Perdóname, Mike. Toma mi Termo Caliente: el chocolate te curará 10% más. ¡Cocoricó!']], reward: () => { P.chocoHeal = Math.min(1, P.chocoHeal + .1); return 'TERMO CALIENTE  el chocolate cura +10%'; } },
  mayo: { who: 'mayo', foe: 'Mayo', intro: [['mayo', 'Beep. Intruso detectado. Iniciando protocolo de pizza.'], ['mike', '¡Mayo! ¡Soy yo, Mike! ¡Tu cliente favorito!'], ['mayo', 'Cliente no encontrado. Solo hay presas... digo, pedidos. Beep boop.']], tip: '¡cuando se recalienta, es tu momento: daño doble!', hint: '¡Esquiva las pizzas! Cuando se recalienta, ¡ataca!',
    saved: [['mayo', 'Beep... reinicio completo. ¿Por qué hay queso en mi circuito?'], ['mike', '¡Mayo! ¡Volviste!'], ['mayo', 'Gracias, Mike. Toma el Circuito Turbo: +12% de velocidad. Beep boop.']], reward: () => { P.speedMul += .12; return 'CIRCUITO TURBO  +12% de velocidad'; } },
  esparta: { who: 'esparta', foe: 'Esparta', intro: [['esparta', 'Mmm... el juego ha cambiado, Mike. Ahora se juega... en serio.'], ['mike', '¡Esparta! ¡Tú no eres así!'], ['esparta', 'Exe dice que perder es feo. Pero yo odio perder con calma... así que mejor gano.']], tip: '¡cuando se duerme un ratito, aprovecha!', hint: '¡Esquiva la nieve estelar! Si se duerme, ¡ataca!',
    saved: [['esparta', 'Oh... qué siesta tan rara. ¿Ya no hay nieve roja?'], ['mike', '¡Esparta! ¡Eres tú otra vez!'], ['esparta', 'Gracias, Mike. Toma mi Bufanda de Nubes: recibirás 15% menos daño. Con calma, siempre con calma.']], reward: () => { P.defMul *= .85; return 'BUFANDA DE NUBES  recibes 15% menos daño'; } },
  raptor: { who: 'raptor', foe: 'Raptor', intro: [['raptor', 'Shhh... este es el capítulo final de mi manga: tú pierdes.'], ['mike', '¡Raptor! ¡Soy yo, Mike!'], ['raptor', 'Los protagonistas siempre dudan antes del final. ¡Yo no! ¡Dattebayo!']], tip: '¡cuando se pone a leer spoilers, golpéalo: daño doble!', hint: '¡Esquiva los shuriken! Cuando lee spoilers, ¡ataca!',
    saved: [['raptor', 'No me hagas spoilers de mi propia derrota... ¿Qué pasó?'], ['mike', '¡Raptor! ¡Ya estás bien!'], ['raptor', 'Gracias, Mike. Toma mi Máscara Ninja: +15% de daño. ¡Y no cuentes el final!']], reward: () => { P.dmgMul += .15; return 'MÁSCARA NINJA  +15% de daño'; } },
  invictor: { who: 'invictor', foe: 'Invictor', intro: [['invictor', '¡HOLA HOLA! ¡Mike! ¡Jajaja! ...Perdón, es que Exe dijo que debo ganar. ¡Es un juego, ¿no?!'], ['mike', '¡Invictor, no es un juego!'], ['invictor', '¡Todo es un juego si lo juegas feliz! ¡Jajaja! ¡Prepárate!']], tip: '¡cuando se pone a bailar, golpéalo: daño doble!', hint: '¡Esquiva las jabalinas! Cuando baila, ¡ataca!',
    saved: [['invictor', '¡Jajaja! ¡Qué sueño más raro! ¡Me caí de la cama romana!'], ['mike', '¡Invictor! ¡Volviste!'], ['invictor', '¡Gracias, Mike! Toma mi Casco Romano: recibirás 15% menos daño. ¡Jajaja!']], reward: () => { P.defMul *= .85; return 'CASCO ROMANO  recibes 15% menos daño'; } },
  exe: { who: 'exe', foe: 'Mike Maligno', intro: [['exe', 'Llegaste. Qué lindo. Yo soy tú, Mike: tu lado sin diversión, sin amigos... y sin chocolate.'], ['mike', '¡Exe! ¡Tú eres Minecraft.exe: el Mike Maligno que se llevó a mis amigos!'], ['exe', 'Me llevé lo que ellos querían dar. Y ahora me llevaré tu final. ¡MUAJAJAJÁ!'], ['aquela', 'Mike, es el último guardián. ¡Todo lo que aprendiste, úsalo ahora!']], tip: 'tiene tres fases y se recarga rápido. ¡Aprovecha cada pausa!', hint: '¡MIKE MALIGNO! Esquiva todo y ataca en sus pausas.', saved: [] }
};
async function startBoss() {
  S.bossStarted = true; S.busy = true; S.skip = false; S.cineAuto = false;
  const L = S.lvl; for (const [gx, gy] of L.gate.tiles) L.set(gx, gy, 'G'); sfx.door(); S.shake = .3;
  S.bossLock = true; S.checkpoint = [L.arena.enter[0], L.arena.enter[1]]; S.cpZone = S.lvlId;
  S.boss = makeBoss(); S.boss.state = 'idle'; setMusic('dark');
  if (S.willy) { const fs = freeSpot(L, P.x - 50, P.y + 10, 9, 8); S.willy.x = fs[0]; S.willy.y = fs[1]; S.willy.vx = S.willy.vy = 0; }
  await wait(.6);
  const D = BOSS_DATA[S.boss.kind] || BOSS_DATA.timba;
  for (const [who, txt] of D.intro) await say(who, txt, who === D.who ? { red: true } : undefined);
  await say('aquela', 'Mike, ' + D.tip);
  S.boss.state = 'walk'; S.boss.t = 1.4; setMusic('boss'); showHint(D.hint, 4); S.busy = false;
}
async function csBossSaved(kind) {
  const D = BOSS_DATA[kind] || BOSS_DATA.timba;
  if (window.BOSS_ONLY || window.VALLE_ONLY) { S.busy = true; setMusic('story'); await wait(.9); for (const [who, txt] of D.saved) await say(who, txt); await fadeTo(1, .8); S.bossLock = false; await csEnding(); return; }
  S.busy = true; S.skip = false; setMusic('story'); S.cineAuto = false; await wait(.9);
  if (kind === 'exe') { await csFinal(); return; }
  for (const [who, txt] of D.saved) await say(who, txt);
  const rtxt = D.reward(); sfx.win(); S.shake = .1; P.hp = P.maxHp; spawnP(P.x, P.y - 30, 34, '#9ad0ff', 300, 1); showHint('¡' + rtxt + '!', 5);
  S.restored++; S.flags['back_' + kind] = true; S.coins += 30;
  S.bossLock = false; { const L = S.lvl; for (const [gx, gy] of L.gate.tiles) L.set(gx, gy, 'a'); } sfx.portal(); S.shake = .2;
  await say('aquela', S.restored >= 7 ? 'Todos los guardianes están a salvo, y Diamantia está casi restaurada. Solo falta el portal final...' : 'Diamantia se restaura un poco: ' + D.foe + ' vuelve a su casa. Restauración: ' + S.restored + '/7. El portal del fondo de la arena se abrió.');
  showHint('Restauración de Diamantia ' + S.restored + '/7  ·  +30 monedas  ·  portal abierto al fondo de la arena', 7); S.busy = false;
}
async function csFinal() {
  await say('exe', '(se tambalea) No... no puede ser... tantas estrellas... tantos amigos...', { red: true });
  await M('¡Mike! ¡Soy yo! ¡Sé que estás ahí, en algún lugar del código!');
  await say('exe', '(la voz cambia, más suave) ...Mike. Gracias por no rendirte. Las estrellas oscuras... eran mis propias dudas.');
  await say('aquela', 'Mike restauró a todos... incluso a Exe.');
  await fadeTo(1, 1);
  S.stage = newStage({ dark: false }); setMusic('title'); const C = {};
  [['willy', 220, 1], ['mike', 330, 1], ['timba', 430, -1], ['acenix', 520, -1], ['rius', 610, -1], ['mayo', 700, -1]].forEach(([id, x, f]) => { C[id] = addChar(id, x, 344, { face: f, scale: 2 }); });
  await fadeTo(0, 1);
  await say('narr', 'Diamantia brilla otra vez. Las luces de Navidad iluminan cada ventana, y nadie volverá a viajar solo.');
  await say('trolino', '¡Mike! ¡Todos están en el tren! ¡Y yo traje chocolate caliente!');
  await M('¡Entonces ahora sí: a celebrar la Navidad todos juntos!');
  await say('narr', 'FIN  ·  Gracias por jugar Mikecrack y las Estrellas Oscuras');
  S.skip = false; S.stage.end = { dia: S.dia, time: S.playTime, deaths: S.deaths, ready: false };
  sfx.win(); await wait(1); S.stage.end.ready = true; S.busy = false;
}
async function csEnding() {
  S.skip = false; S.busy = true;
  S.stage = newStage({ dark: true }); setMusic('dark'); const AC = S.lvlId === 2;
  const C = {};
  [['willy', 240, -1], ['mike', 350, 1], [AC ? 'acenix' : 'timba', 470, 1], ['aquela', 590, -1]].forEach(([id, x, f]) => { C[id] = addChar(id, x, 344, { face: f, scale: 2 }); });
  C.willy.face = 1; const sv = AC ? 'acenix' : 'timba';
  await fadeTo(0, .8);
  await say('narr', 'Esa noche, en lo alto del cielo de Diamantia...');
  bang(); const ex = addChar('exe', 760, 215, { scale: 3, float: true, face: -1 });
  await say('exe', '¡Vaya, vaya! El perrito restauró a uno de mis empleados. ¡Eso sí que me dio sueño! ...No, espera, eso era de Timba.');
  await M('¡Exe, vamos a restaurar a todos tus empleados! ¡Y después te toca a ti!');
  await say('exe', '' + (AC ? 'Quedan SEIS guardianes: Rius, Mayo, Esparta, Raptor, Invictor y Trolino.' : 'Quedan SIETE guardianes: Rius, Mayo, Esparta, Raptor, Invictor, Trolino y Acenix.') + ' Ven por mí... si te atreves. ¡Muajajá!');
  await say(sv, AC ? 'Miau. ¿Alguien quiere pastel? ...¿Mike?' : 'Mike, ¿puedo dormir un ratito? ...¿Mike?');
  await M('¡Equipo, prepárense! ¡El próximo capítulo viene con más diamantes y menos siestas!');
  S.stage.flash = 1; sfx.boss(); removeChar(ex); await wait(.8);
  S.skip = false;
  S.stage.end = { dia: S.dia, time: S.playTime, deaths: S.deaths, ready: false };
  sfx.win(); setMusic('title'); await wait(1); S.stage.end.ready = true;
  S.busy = false;
}

// ---------- Arranque ----------
(function boot() {
  initGL();
  const q = new URLSearchParams(location.search);
  setMusic('title'); setAmbient('dream');
  if (window.BOSS_ONLY || q.has('lvl') || q.has('boss') || q.has('end') || q.has('train') || q.has('city')) {
    S.mode = 'play'; S.fade = 0; MENU.open = false;
    if (window.BOSS_ONLY) {
      loadLevel(1); S.dia = 3; for (const e of S.ents) if (e.type === 'dia') e.dead = true; openGate(); P.x = S.lvl.arena.enter[0]; P.y = S.lvl.arena.enter[1]; P.special = true; P.kills = 5; initWilly(); updateCamera(0, true);
      showHint('Toca la pantalla o pulsa una tecla para empezar la batalla', 60);
      const go = () => { removeEventListener('pointerdown', go); removeEventListener('keydown', go); AUDIO.unlock(); startBoss(); }; addEventListener('pointerdown', go); addEventListener('keydown', go);
    }
    else if (q.has('boss')) { loadLevel(parseInt(q.get('boss')) || 1); S.dia = 3; for (const e of S.ents) if (e.type === 'dia') e.dead = true; openGate(); P.x = 26.5 * T; P.y = 21.5 * T; initWilly(); updateCamera(0, true); }
    else if (q.has('end')) { loadLevel(1); S.dia = 3; csEnding(); }
    else if (q.has('train')) { loadLevel(0); S.q.gotLetters = true; S.q.done = true; openStationGate(); P.x = 62 * T; P.y = 30.5 * T; initWilly(); }
    else loadLevel(parseInt(q.get('lvl')) || 0);
  }
  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, .05); last = now;
    S.dtv = dt; update(dt); drawFrame();
    for (const k in pressed) delete pressed[k];
    PTR.hit = false; PTR.tap = false;
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'complete') requestAnimationFrame(frame); else addEventListener('load', () => requestAnimationFrame(frame));
})();
