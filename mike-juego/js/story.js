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
  if (dark) { GL.scene.background = new THREE.Color(0x2a0a1a); GL.scene.fog = new THREE.Fog(0x4a1228, 20, 70); GL.amb.color.set(0xff8ca0); GL.amb.intensity = .85; GL.hemi.color.set(0xff6a8a); GL.hemi.groundColor.set(0x3a0a1a); GL.sun.color.set(0xff5070); GL.sun.intensity = 1.6; }
  else if (L && L.theme === 'dream') { GL.scene.background = new THREE.Color(0x140e36); GL.scene.fog = new THREE.Fog(0x241a58, 14, 46); GL.amb.color.set(0x8a7ad0); GL.amb.intensity = 1.05; GL.sun.color.set(0xb4bcff); GL.sun.intensity = 1.5; }
  else { GL.scene.background = new THREE.Color(0x8fd3ff); GL.scene.fog = new THREE.Fog(0xb4e2ff, 34, 100); GL.amb.color.set(0xffffff); GL.amb.intensity = 1.15; GL.hemi.color.set(0xbfe0ff); GL.hemi.groundColor.set(0x5a7a3a); GL.sun.color.set(0xfff0d4); GL.sun.intensity = 2.5; }
}
function openStationGate() {
  const L = S.lvl; for (const [x, y] of L.gate.tiles) L.set(x, y, 'a'); S.gateOpen = true; sfx.door(); S.shake = .25; spawnP(L.gate.x + 24, L.gate.y + 96, 40, '#ffe14a', 320, 1);
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
  esparta: { hi: (d) => d ? '¡HOLA HOLA! ¡Qué felicidad verte otra vez! ¡Jajaja!' : '¡HOLA HOLA! ¿Vienes a jugar o a visitarme? ¡Las dos cosas están bien!',
    t: [['¿A qué jugamos?', [['esparta', '¡A TODO! ¡Piedra, papel y tijera! ¡Escondite! ¡Carreras de pesas!'], ['mike', '¿Carreras de pesas?'], ['esparta', '¡Gana el que llegue último! ¡Jajaja!']]], ['Te ves muy contento', [['esparta', '¡Es que cada mañana descubro que sigo vivo! ¡Y eso es genial! ¡Jajaja!']]], ['Un deseo', [['esparta', 'Mi deseo es que todos sonrían al mismo tiempo. ¡Una vez! ¡Aunque sea medio segundo!']], 2]] },
  raptor: { hi: (d) => d ? '¡Mike! Justo estaba dibujando una escena épica.' : '¡Shhh! Estoy viendo el final de un anime.',
    t: [['¿Qué dibujas?', [['raptor', 'Un manga sobre un perrito amarillo con capa. Se llama "Mike Z: la saga del chocolate".'], ['mike', '¡Quiero un cameo!'], ['raptor', 'Ya eres el protagonista. Y también el villano. Es profundo.']]], ['Tu capucha roja', [['raptor', 'Me la dio mi abuela. Decía que protege del frío y de los spoilers.']]], ['Final del anime', [['raptor', 'Te lo cuento solo a ti: ...al final todos se abrazan. ¡Ya, ya, no se lo digas a nadie!']], 2]] },
  invictor: { hi: (d) => d ? '¡Mike! ¡Un abrazo de oso! ...Bueno, de romano.' : '¡ESTO ES... LA VILLA ROMANA!',
    t: [['¿Por qué ese casco?', [['invictor', 'El casco da +10 de valentía y +5 de peinado. Incluye cresta roja de serie.']]], ['¿Entrenamos?', [['invictor', '¡Cinco flexiones! ¡Uno! ¡Dos! ...Ya, ya, que me da cosquillas el suelo.'], ['mike', 'Qué entrenamiento tan raro.']]], ['La gloria romana', [['invictor', 'Un verdadero romano no cae jamás. ...Salvo si hay una cáscara de plátano. Entonces sí, cae.']], 2]] },
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
    if (!q.gotLetters) {
      await say('ambrosio', '¡Mike! ¡Gracias al cielo! Se me juntaron TODAS las cartas del mes y mi bicicleta se hizo bolita.');
      const r = await ask('ambrosio', 'Necesito ayuda para repartir las cartas de tus amigos. ¿Me ayudas?', ['¡Claro, cuenta conmigo!', '¿Y por qué no las repartes tú?', '¿Me pagas?']);
      if (r === 0) { await say('ambrosio', '¡Eres un héroe! ¡Héroe! ¡Héroe! Te lo voy a decir mil veces.'); fav('ambrosio', 2); }
      else if (r === 1) { await say('ambrosio', 'Porque... tengo una cita muy importante. Con mi almohada.'); await M('Está bien, está bien.'); }
      else { await say('ambrosio', 'Te pago con... mi eterna gratitud y un sello postal.'); await M('...Acepto el sello.'); fav('ambrosio', 1); }
      q.gotLetters = true; sfx.key(); S.shake = .1;
      await say('narr', 'Recibiste 7 cartas: para Timba, Rius, Mayo, Esparta, Raptor, Invictor y Acenix.');
      await say('ambrosio', 'Cada compa vive en una calle distinta, así que explora la ciudad. Cuando termines, ¡corre a la estación!');
      showHint('Objetivo: entrega las 7 cartas  (arriba a la izquierda ves el progreso)', 6);
    } else if (!q.done) {
      const left = q.total - q.count; await say('ambrosio', left === 1 ? '¡Solo falta una carta! Mira el mapa o sigue la flecha amarilla.' : 'Todavía faltan ' + left + ' cartas. ¡Tú puedes, héroe!'); await talkAgain('ambrosio');
    } else await say('ambrosio', '¡Entregaste todas! Eres el mejor cartero sin sueldo que he visto. ¡Ve al tren!');
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
    await say('esparta', '¡HOLA HOLA HOLA! ¡Mike! ¡Bienvenido al gimnasio más feliz de Diamantia!');
    const r = await ask('esparta', '¡Vamos a jugar! ¿A qué quieres jugar?', ['Al escondite', 'A las espadas (con cuidado)', 'A adivinar qué dice la carta']);
    if (r === 0) { await say('esparta', '¡Uno, dos, tres! ¡Ya voy!... ¿Mike? ¿Dónde te escondiste? ¡Estás parado frente a mí! ¡Jajaja!'); fav('esparta', 2); }
    else if (r === 1) { await say('esparta', '¡Tac, tac, tac! ¡Gané! ...Ah, no, no estábamos jugando. ¡Jajaja! ¡Igual fue divertido!'); fav('esparta', 2); }
    else { await say('esparta', 'Mmm... ¿una invitación a un banquete? ¿Mil monedas? ¿Un perrito? ¡O todo junto!'); fav('esparta', 2); }
    await say('esparta', '¡Una carta para MÍ! ¡Nunca me escriben! ¡Qué felicidad! ¡Voy a bailar con las pesas!');
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
    await say('invictor', '¡ESTO ES... LA VILLA ROMANA! ¡Bienvenido, Mike!');
    const r = await ask('invictor', '¿Quieres entrenar conmigo antes de irnos?', ['¡Sí! ¡A sudar!', 'Mejor miro desde aquí', '¿Hay snacks?']);
    if (r === 0) { await say('invictor', '¡Veinte sentadillas! ¡Uno! ¡Dos! ¡Tres! ...Ya, descansa, campeón.'); await M('(jadeando) Veinte... y media...'); fav('invictor', 2); }
    else if (r === 1) { await say('invictor', 'La grada también es parte del entrenamiento. ¡Aplaudir quema calorías!'); fav('invictor', 1); }
    else { await say('invictor', '¡Aquí solo hay proteína y rabia! ...Y unas galletas escondidas.'); }
    await say('invictor', 'Una carta. ¡Gracias! La leeré mientras hago planchas.');
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
async function talkNpc(e) {
  S.busy = true; S.skip = false; camTalk(e);
  try {
    if (S.lvlId === 0) { if (e.type === 'citizen') await citizenTalk(e); else await (CITY[e.id] || (async () => { }))(e); }
    else if (e.id === 'aquela') {
      if (S.dia < 3) await say('aquela', 'La puerta del jefe necesita 3 diamantes. Hay puertas de colores y llaves escondidas en los laberintos. ¡Explora y mira el mapa en el menú!');
      else await say('aquela', 'Ya tienes los 3 diamantes. Detrás de la puerta está Timba. Recuerda: ¡cuando se duerme, golpéalo más fuerte!');
    }
  } finally { camClear(); S.busy = false; }
}

// ---------- apertura ----------
function startGame() {
  MENU.open = false; S.mode = 'play'; S.fade = 1; AUDIO.unlock(); sfx.start();
  S.q = { gotLetters: false, delivered: {}, count: 0, total: 7, done: false, trainStarted: false }; S.fav = {}; S.flags = {}; S.wave = null; S.camShot = null;
  csOpening();
}
async function csOpening() {
  S.skip = false; S.busy = true; loadLevel(0); setMusic('city'); setAmbient('day'); glMood(false);
  S.camShot = { x: P.x / T, z: P.y / T - 1.5, dist: 11 }; if (GL.ok) GL.camInit = false;
  await fadeTo(0, 1.2);
  await say('narr', 'Ciudad de Diamantia. Una mañana tranquila... demasiado tranquila. Hoy los compas se van de viaje en tren.');
  S.camShot = null; S.busy = false; showHint('Habla con Trolino (botón ACTUAR junto a él)', 6);
}

// ---------- el tren ----------
async function csTrain() {
  S.busy = true; S.skip = false; const L = S.lvl;
  await fadeTo(1, .4); P.x = 97.5 * T; P.y = 46.5 * T; P.vx = P.vy = 0; P.dx = 0; P.dy = -1; if (S.willy) { S.willy.x = P.x - 40; S.willy.y = P.y + 10; }
  const crew = [['timba', 92], ['rius', 94.2], ['mayo', 96.4], ['esparta', 98.6], ['raptor', 100.8], ['invictor', 103], ['acenix', 105]];
  for (const [id, x] of crew) S.ents.push({ type: 'npc', id, x: x * T, y: 43.5 * T, hw: 10, hh: 10, face: 0, vx: 0, vy: 0, corrupt: false, tag: 'crew' });
  S.ents.push({ type: 'npc', id: 'trolino', x: 90 * T, y: 44 * T, hw: 10, hh: 10, face: 0, vx: 0, vy: 0, tag: 'crew' });
  for (const e of S.ents) if ((e.type === 'npc' && !e.tag && e.id !== 'aquela') || e.type === 'citizen') e.hidden = true;
  S.camShot = { x: 98, z: 41, dist: 14 }; if (GL.ok) GL.camInit = false; setMusic('story'); await fadeTo(0, .6);
  const f = (id, a, b) => say(id, (S.fav[id] || 0) >= 2 ? a : b);
  await say('narr', 'En la estación todos esperaban el tren, con maletas, bocadillos y mucho sueño.');
  await f('timba', '¡Mike! Tu carta me hizo el día. Zzz... digo, ¡qué alegría verte!', '(bostezo) Mike... llegaste. Zzz...');
  await f('rius', '¡Cocoricó, Mike! ¡Tu chiste del banco me tiene riendo desde la mañana!', '¡Cocoricó, Mike! ¡Qué bueno que viniste!');
  await f('mayo', 'Beep. Nivel de amistad con Mike: 100%. Pizza para el camino.', 'Beep. Mike detectado. Pizza para el camino, aunque no pidas piña.');
  await f('esparta', '¡HOLA HOLA! ¡Mike! ¡Vamos a jugar en el tren! ¡Jajaja!', '¡Mike! ¡Qué felicidad que vengas! ¡Jajaja!');
  await f('raptor', '¡Mike! Ya vi el final del anime. ¡No te hago spoiler, lo juro!', 'Mike. Shhh. No hables: estoy leyendo el manga del viaje.');
  await f('invictor', '¡ESTO ES... UN VIAJE! ¡Campeón, vamos a entrenar en el tren!', '¡Esto es... un tren! ¡Qué grande!');
  await f('acenix', 'Miau. Te guardé pastel, Mike. De chocolate.', 'Miau. Hola, Mike. Hay pastel, si quieres.');
  await say('trolino', '¡Mike! ¡Todos a bordo! Y no te olvides de tu capa.');
  await M('¡Esta va a ser la mejor aventura de todas!');
  sfx.boss(); GL.trainShake = true; await wait(.8); GL.trainShake = false;
  // llega Exe
  setMusic('dark'); glMood(true); S.shake = .6; sfx.boss();
  S.ents.push({ type: 'exe3d', id: 'exe', x: 98 * T, y: 38 * T, lift: 6.5 }); S.camShot = { x: 98, z: 39, dist: 20 };
  await say('exe', '¡MUAJAJAJÁ! ¡Qué reunión tan bonita! ¡Y qué tren tan bonito! ¡Y qué amigos tan... míos!');
  await M('¡Exe! ¿Qué haces aquí? ¡Y baja de ahí, que vas a romper el techo!');
  await say('exe', 'Con el poder de las estrellas oscuras, ¡tus amigos viajarán conmigo! ¡Tienen seguro de viaje y todo!');
  S.shake = .6; sfx.boss();
  for (const e of S.ents.filter(e => e.tag === 'crew')) e.corrupt = true;
  await say('timba', 'Exe dice que si lo ayudo me deja dormir tres días seguidos. ¡Trato hecho!', { red: true });
  await say('mayo', 'Beep. Exe ofrece pizza con doble queso. Me quedo. Beep.', { red: true });
  await say('esparta', '¡Qué divertido! ¡Todos juntos! ...Aunque me duele un poco la cabeza. ¡Jajaja!', { red: true });
  await say('acenix', 'Miau... Miau... MIAU.', { red: true });
  await say('trolino', 'Mi corona y yo trabajamos ahora para el jefe nuevo. Lo siento, Mike.', { red: true });
  // suben al tren
  const doors = L.trainDoors; let k = 0;
  for (const e of S.ents.filter(e => e.tag === 'crew')) { const d = doors[k++ % doors.length]; e.goto = { x: d[0] + (k % 3 - 1) * 20, y: d[1] + 20, speed: 230, done: () => { e.hidden = true; spawnP(e.x, e.y - 20, 8, '#ff4a8a', 160, .5); sfx.pop(); } }; }
  for (let i = 0; i < 80 && S.ents.some(e => e.tag === 'crew' && !e.hidden); i++) await wait(.1);
  await say('exe', '¡Slimes corrompidos! ¡Ataquen al perrito de la capa! ¡Muajajá!');
  S.ents = S.ents.filter(e => !(e.tag === 'crew')); S.camShot = null; setMusic('chase'); S.busy = false; startWave(1);
}
async function csTrainEnd() {
  S.busy = true; S.skip = false; S.camShot = { x: 98, z: 40, dist: 17 }; sfx.win();
  await say('exe', '¡Ja! No está mal, perrito. Tus amigos y yo nos vamos de viaje. ¡Alcánzanos si puedes!');
  await M('¡Exe! ¡Devuélvelos! ¡Te voy a restaurar a ti también!');
  await say('exe', 'Los espero en el Valle del Sueño. Ahí empieza lo bueno. ¡Muajajá!');
  GL.trainShake = true; sfx.boss(); const t0 = S.t; while (S.t - t0 < 3.2 && !S.skip) { GL.trainX += 11 * (S.dtv || .016) * (1 + (S.t - t0) * 1.4); await wait(.016); } GL.trainShake = false;
  S.ents = S.ents.filter(e => e.type !== 'exe3d'); glMood(false); setMusic('story'); S.camShot = { x: 98, z: 42, dist: 13 };
  const aq = S.ents.find(e => e.id === 'aquela'); if (aq) { aq.hidden = false; aq.x = 94 * T; aq.y = 46 * T; aq.face = 0; }
  await say('aquela', 'Mike, el tren se fue... pero conozco un atajo: el portal del Valle del Sueño. Ahí es donde Exe llevó a los compas.');
  await M('¡Vamos! ¡Willy, a trabajar!'); await say('willy', '¡Guau! (Traducción: ¡por fin hago algo!)');
  S.camShot = null; await goNext();
}

// ---------- cambio de nivel ----------
async function goNext() {
  S.busy = true; S.skip = false; sfx.portal(); S.wave = null; S.camShot = null;
  await fadeTo(1, .6);
  loadLevel(S.lvlId + 1); S.leaving = false; glMood(false); if (GL.ok) GL.camInit = false;
  await fadeTo(0, .6);
  await say('narr', 'Capítulo 2: El Valle del Sueño. Aquí todo flota, es suave y bonito... y probablemente peligroso.');
  await say('willy', '¡Guau! (Traducción: huele a almohada con maldad.)');
  S.busy = false; showHint('Explora los laberintos, busca las llaves y consigue 3 diamantes', 6);
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
  await M('¡Timba! ¡Soy yo, Mike! ¡Despierta! ¡Te entregué tu carta y todo!');
  await say('timba', 'Mike no existe: eres un sueño. Y yo soy el pesadillo. ¡Exe me prometió una cama más grande si te derroto!', { red: true });
  await M('¡Pero si ya tienes una cama enorme!');
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
  await M('¡Timba! ¡Volviste! ¡Estabas bajo el control de Exe!');
  await say('timba', S.q.delivered.timba ? '¿Yo? Solo recuerdo un sueño muy raro donde lanzaba almohadas... y tu carta. Esa sí la recuerdo. Gracias, Mike.' : '¿Yo? Solo recuerdo un sueño muy raro donde lanzaba almohadas... y fue lo más divertido que hice en años.');
  await say('aquela', 'Las estrellas oscuras te dominaron. Pero Mike restauró tu conciencia.');
  await say('timba', 'Gracias, Mike. Toma: la Almohada de Estrella. Te hará más fuerte: ¡+25% de daño! Es lo único que tengo... aparte de sueño.');
  P.dmgMul += .25; P.hp = P.maxHp; P.chocoCd = 0; sfx.win(); S.shake = .1;
  spawnP(P.x, P.y - 30, 34, '#9ad0ff', 300, 1);
  showHint('¡ALMOHADA DE ESTRELLA!  +25% de daño', 5);
  await say('timba', 'Yo los ayudo desde tu casa, Mike. Pero antes... ¿alguien tiene un colchón?');
  await M('¡Gracias, Timba! ¡Vamos por los demás!');
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
  await M('¡Exe, vamos a restaurar a todos tus empleados! ¡Y después te toca a ti!');
  await say('exe', 'Quedan SIETE guardianes: Rius, Mayo, Esparta, Raptor, Invictor, Trolino y Acenix. Ven por mí... si te atreves. ¡Muajajá!');
  await say('timba', 'Mike, ¿puedo dormir un ratito? ...¿Mike?');
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
  if (q.has('lvl') || q.has('boss') || q.has('end') || q.has('train') || q.has('city')) {
    S.mode = 'play'; S.fade = 0; MENU.open = false;
    if (q.has('boss')) { loadLevel(1); S.dia = 3; for (const e of S.ents) if (e.type === 'dia') e.dead = true; openGate(); P.x = 26.5 * T; P.y = 21.5 * T; initWilly(); updateCamera(0, true); }
    else if (q.has('end')) { loadLevel(1); S.dia = 3; csEnding(); }
    else if (q.has('train')) { loadLevel(0); S.q.gotLetters = true; S.q.done = true; openStationGate(); P.x = 87 * T; P.y = 39.5 * T; initWilly(); }
    else loadLevel(parseInt(q.get('lvl')) || 0);
  }
  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, .05); last = now;
    S.dtv = dt; update(dt); drawFrame();
    for (const k in pressed) delete pressed[k];
    PTR.hit = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
