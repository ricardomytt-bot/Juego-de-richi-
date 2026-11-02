/* 13 · social y extras: ranking global (db), carrera en vivo (room), modo foto (downloads) y controles de inclinación.
   Todo funciona sin conexión salvo ranking y carrera, que se encienden solo cuando el visor de Artifacts da esos permisos. */
'use strict';
const Net = { db: null, room: null, dl: null, uid: null, ready: false };
Net.init = (async () => {
  try {
    if (!window.claude || !claude.use) return;
    const [db, room, dl, user] = await Promise.all([claude.use('db').catch(() => null), claude.use('room').catch(() => null), claude.use('downloads').catch(() => null), claude.use('user').catch(() => null)]);
    Net.db = db; Net.room = room; Net.dl = dl;
    if (user && user.id){ try { Net.uid = String(await user.id()); } catch (e) {} }
  } catch (e) {}
  Net.ready = true;
})();
const cleanName = s => String(s == null ? '' : s).replace(/[<>&"']/g, '').slice(0, 14) || '?';

/* ================================================================ ranking global */
const RANK_TABS = [{ k: 'inf', n: '♾ Infinito', sub: 'Puntos del modo infinito', fmt: v => v + ' pts', dir: -1 }, { k: 't0', n: 'Cap. 1', sub: 'Mejor tiempo del capítulo 1', fmt: v => fmtTime1(v), dir: 1 }, { k: 't1', n: 'Cap. 2', sub: 'Mejor tiempo del capítulo 2', fmt: v => fmtTime1(v), dir: 1 }, { k: 't2', n: 'Cap. 3', sub: 'Mejor tiempo del capítulo 3', fmt: v => fmtTime1(v), dir: 1 }];
const Social = {
  tab: 0, local: store.get('planeo5.rank', {}),
  /* guarda tu marca: siempre en local y, si hay base de datos, en el ranking global (un documento por persona) */
  async submit(kind, val, extra){
    const tab = RANK_TABS.find(t => t.k === kind); if (!tab || !(val > 0)) return;
    const prev = this.local[kind];
    if (prev === undefined || (tab.dir < 0 ? val > prev : val < prev)){ this.local[kind] = val; store.set('planeo5.rank', this.local); }
    try {
      await Net.init; if (!Net.db || !Net.uid) return;
      const ref = Net.db.doc('rank/' + Net.uid), snap = await ref.get(), cur = snap.exists ? snap.data() : {};
      const best = cur[kind];
      const upd = { name: cleanName(playerName()), ts: Date.now() };
      if (best === undefined || (tab.dir < 0 ? val > best : val < best)){ upd[kind] = Math.round(val * 10) / 10; if (extra && extra.cycle) upd.cycle = extra.cycle; }
      if (snap.exists) await ref.update(upd); else await ref.set(upd);
    } catch (e) { /* sin permiso de escritura: se queda el ranking local */ }
  },
  async openRank(){
    showScreen('rank'); const tabs = $('rankTabs'); tabs.innerHTML = '';
    RANK_TABS.forEach((t, i) => { const b = document.createElement('button'); b.className = 'tab' + (i === this.tab ? ' on' : ''); b.textContent = t.n; b.onclick = () => { this.tab = i; this.openRank(); }; tabs.appendChild(b); });
    const t = RANK_TABS[this.tab], box = $('rankList'); $('rankSub').textContent = t.sub;
    box.innerHTML = '<div class="empty">Cargando…</div>';
    await Net.init;
    const mine = this.local[t.k];
    if (!Net.db){
      box.innerHTML = `<div class="empty">El ranking global funciona en el enlace publicado del juego (con la base de datos activada).<br>Aquí tienes tu mejor marca:</div>` + (mine !== undefined ? `<div class="rk you"><em>★</em><b class="nm">${esc(cleanName(playerName()))}</b><span>${t.fmt(mine)}</span></div>` : '<div class="empty">Aún no tienes marca.</div>');
      return;
    }
    let timer = setTimeout(() => { box.innerHTML = '<div class="empty">No se pudo cargar el ranking. Inténtalo más tarde.</div>'; }, 10000);
    try {
      const snap = await Net.db.collection('rank').get(); clearTimeout(timer);
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => typeof r[t.k] === 'number' && r[t.k] > 0);
      rows.sort((a, b) => t.dir < 0 ? b[t.k] - a[t.k] : a[t.k] - b[t.k]);
      box.innerHTML = rows.length ? rows.slice(0, 10).map((r, i) => `<div class="rk ${r.id === Net.uid ? 'you' : ''}"><em>${i + 1}</em><b class="nm">${esc(cleanName(r.name))}</b><span>${t.fmt(r[t.k])}${r.cycle && t.k === 'inf' ? ' · ciclo ' + (r.cycle | 0) : ''}</span></div>`).join('')
        : '<div class="empty">Todavía no hay marcas aquí. ¡Sé el primero!</div>';
      if (!Net.uid) box.innerHTML += '<div class="empty">Inicia sesión en claude.ai para aparecer en el ranking.</div>';
    } catch (e) { clearTimeout(timer); box.innerHTML = '<div class="empty">No se pudo cargar el ranking.</div>'; }
  },
  afterEnd(time){ if (Race.active) Race.finish(time); }
};
$('btnRank').onclick = () => { Sound.init(); Sound.sfx('ui'); Social.openRank(); };
screens.rank = $('screen-rank'); screens.race = $('screen-race');

/* ================================================================ carrera en vivo (sala con presencia) */
const Race = {
  room: null, code: '', lvl: 0, active: false, goSeen: 0, timer: 0, myDone: 0, rivals: new Map(), unsub: null, off: null,
  err(m){ toast(m); },
  async join(code){
    await Net.init;
    if (!Net.room || !Net.room.join){ this.err('La carrera en vivo solo funciona en el enlace publicado del juego'); return; }
    code = String(code || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8); if (code.length < 3){ this.err('El código debe tener al menos 3 letras'); return; }
    this.leave();
    try { this.room = await Net.room.join('planeo-' + code); } catch (e) { this.err('No se pudo entrar a la sala'); return; }
    this.code = code; this.goSeen = Date.now() - 2000; this.myDone = 0;   // ignora arranques antiguos
    this.unsub = this.room.onPeers(ch => this.onPeers(ch));
    await this.sendPresence(true);
    $('raceLobby').classList.add('hidden'); $('raceRoom').classList.remove('hidden'); $('roomCode').textContent = code.toUpperCase(); this.renderRoom();
  },
  async create(){ const al = 'abcdefghjkmnpqrstuvwxyz23456789'; let c = ''; for (let i = 0; i < 5; i++) c += al[Math.floor(Math.random() * al.length)]; $('inRoom').value = c.toUpperCase(); await this.join(c); },
  leave(){
    if (this.unsub){ try { this.unsub(); } catch (e) {} this.unsub = null; }
    if (this.room){ try { this.room.leave(); } catch (e) {} this.room = null; }
    this.rivals.clear(); this.active = false; clearInterval(this.timer); this.timer = 0;
    $('raceLobby').classList.remove('hidden'); $('raceRoom').classList.add('hidden');
  },
  stop(){ clearInterval(this.timer); this.timer = 0; this.active = false; this.rivals.clear(); if (this.room) this.leave(); G.race = false; },
  sendPresence(force, go){
    if (!this.room) return Promise.resolve();
    const p = { n: cleanName(playerName()), lvl: this.lvl, P: this.active ? Math.round(G.P * 10) / 10 : 0, x: this.active ? Math.round(G.x * 100) / 100 : 1, d: this.myDone || 0 };
    if (go) p.go = go;
    return this.room.presence(p).catch(() => {});
  },
  peerList(){ return this.room ? this.room.peers().filter(p => !p.isMe) : []; },
  onPeers(){
    if (!this.room) return;
    const peers = this.peerList();
    for (const p of peers){
      const pr = p.presence || {};
      if (typeof pr.go === 'number' && pr.go > this.goSeen){ this.goSeen = pr.go; this.begin(clamp(pr.lvl | 0, 0, 2)); }
      if (this.active){
        let r = this.rivals.get(p.peer);
        if (!r){ const idx = this.rivals.size; r = { live: true, name: cleanName(pr.n), color: GHOST_COLORS[idx % GHOST_COLORS.length], time: 9999, Ps: [0, 0], Xs: [1, 1], P: 0, x: 1, tP: 0, tx: 1, seen: false, d: 0 }; this.rivals.set(p.peer, r); G.ghosts.push(r); buildMarkers(); }
        r.name = cleanName(pr.n); const nP = +pr.P || 0; if (nP > 0){ if (!r.seen){ r.seen = true; r.P = nP; r.x = +pr.x || 1; } r.tP = nP; r.tx = clamp(+pr.x || 1, 0, 2); } r.d = +pr.d || 0; if (r.d) r.time = r.d;
      }
    }
    if (!$('raceRoom').classList.contains('hidden')) this.renderRoom();
    if (screens.end && !screens.end.classList.contains('hidden') && G.race) this.renderRanking();
  },
  renderRoom(){
    const tabs = $('raceTabs'); tabs.innerHTML = '';
    LEVELS.forEach((lv, i) => { const b = document.createElement('button'); b.className = 'tab' + (i === this.lvl ? ' on' : ''); b.textContent = lv.short; b.onclick = () => { this.lvl = i; this.renderRoom(); this.sendPresence(); }; tabs.appendChild(b); });
    const peers = this.peerList();
    $('racePeers').innerHTML = `<div class="gh"><i style="background:#fff"></i><b>${esc(cleanName(playerName()))} (tú)</b><span>listo</span></div>` +
      (peers.length ? peers.map((p, i) => `<div class="gh"><i style="background:${GHOST_COLORS[i % GHOST_COLORS.length]}"></i><b>${esc(cleanName((p.presence || {}).n))}</b><span>en la sala</span></div>`).join('') : '<div class="empty">Esperando a tus amigos… Pásales el código de sala.</div>');
  },
  async start(){ if (!this.room) return; const go = Date.now(); this.goSeen = go; await this.sendPresence(true, go); this.begin(this.lvl); },
  async begin(lvl){
    this.lvl = lvl; this.rivals.clear(); this.myDone = 0; this.active = false;
    await startLevel('multi', lvl, false);   // el nivel es el mismo para todos (misma semilla)
    G.ghosts = []; G.race = true; this.active = true;
    for (const p of this.peerList()){ const pr = p.presence || {}, r = { live: true, name: cleanName(pr.n), color: GHOST_COLORS[this.rivals.size % GHOST_COLORS.length], time: 9999, Ps: [0, 0], Xs: [1, 1], P: 0, x: 1, tP: 0, tx: 1, seen: false, d: 0 }; this.rivals.set(p.peer, r); G.ghosts.push(r); }
    buildMarkers(); toast('¡Carrera en vivo! Sala ' + this.code.toUpperCase());
    clearInterval(this.timer); this.timer = setInterval(() => { if (G.state === 'playing' || G.state === 'countdown') this.sendPresence(); }, 220);
  },
  finish(time){ this.myDone = Math.round(time * 10) / 10; this.sendPresence(); this.renderRanking(); },
  renderRanking(){
    const rows = [{ name: cleanName(playerName()) + ' (tú)', time: this.myDone || 0, you: true }];
    this.rivals.forEach(r => rows.push({ name: r.name, time: r.d || 0 }));
    rows.sort((a, b) => (a.time || 1e9) - (b.time || 1e9));
    $('endRank').innerHTML = '<h3 style="margin:6px 0">Carrera · sala ' + esc(this.code.toUpperCase()) + '</h3>' + rows.map((r, i) => `<div class="rk ${r.you ? 'you' : ''}"><em>${i + 1}</em><b class="nm">${esc(r.name)}</b><span>${r.time ? fmtTime1(r.time) : 'corriendo…'}</span></div>`).join('');
  }
};
$('btnRace').onclick = () => { Sound.init(); Sound.startMusic(); Sound.sfx('ui'); showScreen('race'); if (!Net.room && Net.ready) $('raceSub').textContent = 'La carrera en vivo solo funciona en el enlace publicado del juego (necesita conexión con la sala).'; };
$('btnRoomMake').onclick = () => Race.create();
$('btnRoomJoin').onclick = () => Race.join($('inRoom').value);
$('btnRaceGo').onclick = () => Race.start();
$('btnRaceLeave').onclick = () => Race.leave();
$('btnRoomCopy').onclick = async () => toast((await copyText(Race.code.toUpperCase())) ? 'Código copiado: pásaselo a tus amigos' : 'No se pudo copiar');
document.querySelectorAll('#screen-race .back').forEach(b => b.addEventListener('click', () => Race.leave()));
$('btnAgain').onclick = () => { if (Race.active && Race.room){ Race.won = false; Race.start(); } else restartLevel(); };
$('btnRestart').onclick = () => { if (Race.active && Race.room){ Race.won = false; Race.start(); } else restartLevel(); };

/* ================================================================ modo foto */
const Photo = {
  q: { yaw: 0.55, pitch: 0.28, dist: 9 }, drag: null, shot: null,
  enter(){
    if (G.state !== 'paused' || !G3.ok){ toast('El modo foto necesita el render 3D'); return; }
    showScreen(null); el.hud.classList.add('hidden'); $('photoBar').classList.remove('hidden'); this.q = { yaw: 0.55, pitch: 0.28, dist: 9 }; window.__photo = this.q; G.photo = true;
  },
  exit(){ window.__photo = null; G.photo = false; $('photoBar').classList.add('hidden'); $('photoPrev').classList.add('hidden'); el.hud.classList.remove('hidden'); showScreen('pause'); },
  snap(){
    try {
      g3Frame(0.0001);   // dibuja un fotograma y lo copia en el mismo instante (si no, el navegador vacía el lienzo WebGL)
      const w = glCv.width, h = glCv.height, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.drawImage(glCv, 0, 0, w, h); x.drawImage(canvas, 0, 0, w, h);
      const pad = Math.round(h * 0.03), fs = Math.round(h * 0.028); x.font = `700 ${fs}px sans-serif`; x.textBaseline = 'bottom'; x.fillStyle = 'rgba(255,255,255,.95)'; x.strokeStyle = 'rgba(20,24,70,.6)'; x.lineWidth = fs * 0.25;
      const txt = 'Planeo · ' + cleanName(playerName()) + ' · ' + new Date().toLocaleDateString(); x.strokeText(txt, pad, h - pad); x.fillText(txt, pad, h - pad);
      c.toBlob(b => { if (!b) return; this.shot = b; const url = URL.createObjectURL(b); $('photoImg').src = url; $('photoPrev').classList.remove('hidden'); ST.photos = (ST.photos || 0) + 1; achCheck(); statsSave(); this.save(); }, 'image/png');
    } catch (e) { toast('No se pudo tomar la foto'); }
  },
  async save(){
    if (!this.shot) return; const name = 'planeo-foto-' + Date.now() + '.png';
    try { await Net.init; if (Net.dl){ await Net.dl.save({ filename: name, data: this.shot }); return; } } catch (e) { if (e && e.code === 'declined') return; }
    const a = document.createElement('a'); a.href = $('photoImg').src; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
};
$('btnPhoto').onclick = () => Photo.enter();
$('phExit').onclick = () => Photo.exit();
$('phShot').onclick = () => Photo.snap();
$('phSave').onclick = () => Photo.save();
$('phClose').onclick = () => $('photoPrev').classList.add('hidden');
$('phZoomIn').onclick = () => { Photo.q.dist = clamp(Photo.q.dist - 1.8, 3.5, 30); };
$('phZoomOut').onclick = () => { Photo.q.dist = clamp(Photo.q.dist + 1.8, 3.5, 30); };
canvas.addEventListener('pointerdown', e => { if (!window.__photo) return; Photo.drag = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} });
canvas.addEventListener('pointermove', e => { const d = Photo.drag; if (!d || !window.__photo || d.id !== e.pointerId) return; const q = window.__photo; q.yaw -= (e.clientX - d.x) * 0.008; q.pitch = clamp(q.pitch + (e.clientY - d.y) * 0.006, -0.25, 1.25); d.x = e.clientX; d.y = e.clientY; });
canvas.addEventListener('pointerup', () => { Photo.drag = null; }); canvas.addEventListener('pointercancel', () => { Photo.drag = null; });
canvas.addEventListener('wheel', e => { if (!window.__photo) return; window.__photo.dist = clamp(window.__photo.dist + e.deltaY * 0.01, 3.5, 30); e.preventDefault(); }, { passive: false });
document.addEventListener('keydown', e => { if (window.__photo && e.key === 'Escape'){ Photo.exit(); e.stopImmediatePropagation(); } }, true);

/* ================================================================ controles por inclinación */
const Tilt = {
  on: store.get('planeo5.tilt', false), base: null, lastMove: 0, listening: false,
  label(){ $('btnTilt').textContent = '📱 Inclinar: ' + (this.on ? 'sí' : 'no'); G.tilt = this.on; },
  lateral(e){
    const ang = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
    if (ang === 90) return e.beta; if (ang === 270 || ang === -90) return -e.beta; return e.gamma;
  },
  handler(e){
    if (!Tilt.on || e.gamma == null) return;
    const v = Tilt.lateral(e); if (v == null) return;
    if (Tilt.base === null || G.state === 'countdown') Tilt.base = v;   // el punto neutro es como sostienes el móvil al empezar
    const d = v - Tilt.base, now = performance.now();
    if (G.state !== 'playing') return;
    if (Math.abs(d) > 14 && now - Tilt.lastMove > 380){ move(d > 0 ? 1 : -1); Tilt.lastMove = now; }
    else if (Math.abs(d) < 7) Tilt.lastMove = now - 380;
  },
  async toggle(){
    if (!this.on){
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){ const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted'){ toast('No diste permiso para el sensor de inclinación'); return; } }
      } catch (e) { toast('No se pudo activar la inclinación'); return; }
      if (!('DeviceOrientationEvent' in window)){ toast('Este dispositivo no tiene sensor de inclinación'); return; }
      this.on = true; this.base = null; if (!this.listening){ window.addEventListener('deviceorientation', this.handler); this.listening = true; }
      toast('Inclina el móvil para cambiar de carril · toca para saltar');
    } else this.on = false;
    store.set('planeo5.tilt', this.on); this.label();
  }
};
$('btnTilt').onclick = () => Tilt.toggle();
if (Tilt.on && 'DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function'){ window.addEventListener('deviceorientation', Tilt.handler); Tilt.listening = true; } else if (Tilt.on) Tilt.on = false;
Tilt.label();
