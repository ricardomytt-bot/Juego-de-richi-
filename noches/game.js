'use strict';
// ================= NOCHES DE RICHI =================
const PW = 320, PH = 240, SH = 180;
const CAM_PLACES = ['Patio', 'Cocina', 'Comedor', 'Sala', 'Pasillo', 'Bano', 'Ventana'];
const CAM_NAMES = ['PATIO', 'COCINA', 'COMEDOR', 'SALA', 'PASILLO', 'BAÑO', 'VENTANA'];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FAST = /fast/.test(location.search);
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const G = { scene: null, keys: {}, t: 0, started: false };
const { R, E, EO } = Art;

let save = { night: 1, won: false };
try { Object.assign(save, JSON.parse(localStorage.getItem('richi_save') || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem('richi_save', JSON.stringify(save)); } catch (e) {} };

function resize(w, h) { if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; ctx.imageSmoothingEnabled = false; } fit(); }
function fit() { const s = Math.min(innerWidth / canvas.width, innerHeight / canvas.height); canvas.style.width = Math.floor(canvas.width * s) + 'px'; canvas.style.height = Math.floor(canvas.height * s) + 'px'; }
addEventListener('resize', fit);
function setScene(s, ...a) { G.scene = s; resize(s.w || PW, s.h || PH); if (s.enter) s.enter(...a); }

// ---------- esquemas de control ----------
const SCHEMES = {
  story: { doorL: ['KeyA'], doorR: ['KeyD'], lightL: ['KeyQ'], lightR: ['KeyE'], cam: ['KeyW', 'Space', 'ArrowUp'], blanket: ['KeyS', 'ArrowDown'], prev: ['KeyZ', 'ArrowLeft'], next: ['KeyX', 'ArrowRight'], lab: { doorL: 'A', doorR: 'D', lightL: 'Q', lightR: 'E', cam: 'W', blanket: 'S' } },
  p1: { doorL: ['KeyA'], doorR: ['KeyD'], lightL: ['KeyQ'], lightR: ['KeyE'], cam: ['KeyW'], blanket: ['KeyS'], prev: ['KeyZ'], next: ['KeyX'], lab: { doorL: 'A', doorR: 'D', lightL: 'Q', lightR: 'E', cam: 'W', blanket: 'S' } },
  p2: { doorL: ['KeyJ'], doorR: ['KeyL'], lightL: ['KeyU'], lightR: ['KeyO'], cam: ['KeyI'], blanket: ['KeyK'], prev: ['KeyN'], next: ['KeyM'], lab: { doorL: 'J', doorR: 'L', lightL: 'U', lightR: 'O', cam: 'I', blanket: 'K' } },
};
const MSCHEMES = {
  p1: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyF', ability: 'KeyG', labA: 'F', labB: 'G', labM: 'WASD' },
  p2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', attack: 'Enter', ability: 'Period', labA: 'ENTER', labB: '.', labM: 'FLECHAS' },
};
const held = codes => codes.some(c => G.keys[c]);

// ---------- datos de las noches ----------
const LEVELS = [
  { chancla: 4 }, { chancla: 6, cuchara: 5 }, { chancla: 8, cuchara: 7, tamal: 5 },
  { chancla: 9, cuchara: 8, tamal: 7, sombra: 5 }, { chancla: 11, cuchara: 10, tamal: 9, sombra: 8 },
  { chancla: 20, cuchara: 20, tamal: 18, sombra: 17 },
];
const ROUTES = {
  chancla: ['Patio', 'Cocina', 'Comedor', 'Pasillo', 'PIzq'],
  cuchara: ['Bano', 'Sala', 'PDer'],
  tamal: ['Comedor', 'Sala', 'Pasillo', 'Ventana'],
};
const CALLS = [
  ['¡Hola Richi! Soy tu primo Memo, grabando este mensaje.', 'De noche pasan cosas raras en la casa. Cada monstruo tiene su REGLA.', 'CHANCLA CHANCLA CHANCLA viene por la puerta de la IZQUIERDA.', 'Alúmbrala con la luz (Q) y, si está ahí, ¡cierra la puerta (A)! Pero gasta energía.', 'Revisa las cámaras con W o ESPACIO. ¡Nos vemos a las 6!'],
  ['Buen trabajo, Richi. Esta noche viene CUCHARA por la DERECHA.', 'La puerta cerrada NO la espanta... ¡la luz derecha (E) sí!', 'Y ojo: mientras miras las cámaras no puedes mover puertas ni luces.'],
  ['Cuidado con TAMAL TAMAL TAMALITO: solo avanza cuando NO lo miras.', 'Si oyes golpecitos en la ventana, revisa la cámara 7 hasta que se aleje.'],
  ['Esta noche aparece SOMBRA al pie de tu cama.', 'Cuando oigas el pitido, mantén S para taparte con la cobija unos 3 segundos.', 'Y si se acaba la energía... sale DON APAGÓN. No lo dejes.'],
  ['Es la noche 5. Todos están furiosos.', 'Cuida la batería y escucha bien los sonidos. ¡Tú puedes, Richi!'],
  [],
];

// =====================================================
//  SIMULACIÓN DE LA NOCHE (guardia)
// =====================================================
class Night {
  constructor(o) {
    this.mode = o.mode; this.n = o.n || 1; this.scheme = o.scheme; this.camCount = o.camCount || 7;
    this.hourSec = o.hourSec; this.duration = this.hourSec * 6; this.t = 0;
    this.power = 100; this.door = { L: false, R: false }; this.dpos = { L: 0, R: 0 };
    this.light = { L: false, R: false }; this.cam = false; this.camIdx = this.mode === 'vs' ? 3 : 0; this.under = false;
    this.held = { lightL: false, lightR: false, blanket: false }; this.mouseHold = null;
    this.mons = []; this.powerOut = false; this.outT = 0; this.outDelay = 0; this.flash = 0;
    this.camBlind = 0; this.blackout = 0; this.caught = null; this.won = false; this.extra = 0; this.tapT = 0; this.flick = 0; this.msg = ''; this.msgT = 0;
    if (this.mode === 'story') {
      const lv = o.levels;
      for (const id of ['chancla', 'cuchara', 'tamal']) if (lv[id]) this.mons.push({ id, level: lv[id], stage: 0, place: ROUTES[id][0], tick: rand(3, 6), state: 'roam', att: 0, kt: 0, stare: 0, scare: 0 });
      if (lv.sombra) this.sombra = { level: lv.sombra, state: 'idle', tick: rand(8, 14), att: 0, hold: 0 };
    }
  }
  get hour() { return Math.min(5, Math.floor(this.t / this.hourSec)); }
  get canAct() { return !this.powerOut && !this.under; }
  get camPlace() { return CAM_PLACES[this.camIdx]; }
  say(m) { this.msg = m; this.msgT = 2.5; }
  toggleDoor(s) { if (!this.canAct || this.cam) return; this.door[s] = !this.door[s]; this.door[s] ? Sfx.door() : Sfx.doorOpen(); }
  toggleCam() { if (!this.canAct) return; this.cam = !this.cam; this.flash = 0.3; Sfx.cam(); }
  selectCam(i) { if (i < 0 || i >= this.camCount) return; this.camIdx = i; this.flash = 0.2; Sfx.camSwitch(); }
  stepCam(d) { if (!this.cam) return; this.selectCam((this.camIdx + d + this.camCount) % this.camCount); }
  keydown(code) {
    const s = this.scheme;
    if (s.doorL.includes(code)) this.toggleDoor('L'); else if (s.doorR.includes(code)) this.toggleDoor('R');
    else if (s.cam.includes(code)) this.toggleCam();
    else if (s.prev.includes(code)) this.stepCam(-1); else if (s.next.includes(code)) this.stepCam(1);
    else if (/^Digit[1-7]$/.test(code) && this.mode === 'story' && this.cam) this.selectCam(+code[5] - 1);
  }
  buttons() {
    const lab = this.scheme.lab;
    const defs = [['doorL', 'PUERTA', 'IZQ', this.door.L, '#e0382f'], ['lightL', 'LUZ', 'IZQ', this.light.L, '#ffd23f'], ['cam', 'CAMARA', '', this.cam, '#3ae07a'], ['blanket', 'COBIJA', '', this.under, '#a070e0'], ['lightR', 'LUZ', 'DER', this.light.R, '#ffd23f'], ['doorR', 'PUERTA', 'DER', this.door.R, '#e0382f']];
    return defs.map((d, i) => ({ id: d[0], label: d[1], sub: d[2], on: d[3], col: d[4], key: lab[d[0]], x: 6 + i * 52, y: 205, w: 48, h: 32 }));
  }
  pointerDown(x, y) {
    if (this.cam && !this.under) { for (let i = 0; i < this.camCount; i++) { const bx = 60 + i * (this.camCount === 7 ? 29 : 34), by = 160; if (x >= bx && x < bx + 26 && y >= by && y < by + 15) { this.selectCam(i); return true; } } }
    for (const b of this.buttons()) if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) {
      if (b.id === 'doorL') this.toggleDoor('L'); else if (b.id === 'doorR') this.toggleDoor('R'); else if (b.id === 'cam') this.toggleCam(); else this.mouseHold = b.id;
      return true;
    }
    return false;
  }
  pointerUp() { this.mouseHold = null; }
  catchBy(id) { if (!this.caught && !this.won) this.caught = id; }
  watching(place) { return this.cam && !this.under && !this.powerOut && this.camPlace === place; }

  update(dt) {
    if (this.caught || this.won) return;
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.msgT -= dt; this.flick -= dt;
    this.camBlind = Math.max(0, this.camBlind - dt); this.blackout = Math.max(0, this.blackout - dt);
    const s = this.scheme, mh = this.mouseHold;
    const hold = { lightL: this.held.lightL || mh === 'lightL', lightR: this.held.lightR || mh === 'lightR', blanket: this.held.blanket || mh === 'blanket' };
    const was = this.under;
    this.under = hold.blanket && !this.powerOut;
    if (this.under && !was) { this.cam = false; Sfx.blanket(); }
    const lightsOk = this.canAct && !this.cam && this.blackout <= 0;
    const nl = lightsOk && hold.lightL, nr = lightsOk && hold.lightR;
    if ((nl && !this.light.L) || (nr && !this.light.R)) Sfx.light();
    this.light.L = nl; this.light.R = nr;
    if (this.powerOut) { this.door.L = this.door.R = false; this.cam = false; }
    this.dpos.L += clamp((this.door.L ? 1 : 0) - this.dpos.L, -dt * 6, dt * 6);
    this.dpos.R += clamp((this.door.R ? 1 : 0) - this.dpos.R, -dt * 6, dt * 6);
    if (this.cam && this.camBlind <= 0 && Math.random() < dt * 0.4) this.flick = 0.1;
    // energía
    if (!this.powerOut) {
      const use = 0.095 + 0.16 * (this.door.L + this.door.R) + 0.09 * (this.light.L + this.light.R) + 0.1 * this.cam + this.extra;
      this.power = Math.max(0, this.power - use * dt * (this.mode === 'vs' ? 1.1 : 1));
      if (this.power <= 0) { this.powerOut = true; this.outT = 0; this.outDelay = rand(9, 15); Sfx.power(); Sfx.droneLevel(0.02); if (this.mode === 'story') setTimeout(() => Sfx.musicBox(), 1200); }
    } else { this.outT += dt; if (this.mode === 'story' && this.outT > this.outDelay) this.catchBy('apagon'); }
    this.extra = 0;
    if (this.mode === 'story' && !this.powerOut) this.updateStory(dt, hold);
    if (this.t >= this.duration) { this.won = true; }
  }

  updateStory(dt, hold) {
    for (const m of this.mons) {
      const route = ROUTES[m.id], last = route.length - 1, lv = m.level;
      if (m.id === 'chancla') {
        if (m.state === 'roam') { m.tick -= dt; if (m.tick <= 0) { m.tick = rand(3.6, 5.2); if (Math.random() * 20 < lv) { m.stage++; m.place = route[m.stage]; Sfx.step(); if (m.stage === last) { m.state = 'door'; m.att = Math.max(2.8, 5.4 - lv * 0.12); } } } }
        else if (m.state === 'door') { if (this.door.L) { m.state = 'knock'; m.kt = 1.2; Sfx.knock(); } else { m.att -= dt; if (m.att <= 0) this.catchBy('chancla'); } }
        else if (m.state === 'knock') { m.kt -= dt; if (m.kt <= 0) { m.stage = 1; m.place = route[1]; m.state = 'roam'; m.tick = rand(5, 8); } }
      } else if (m.id === 'cuchara') {
        if (m.state === 'roam') { m.tick -= dt; if (m.tick <= 0) { m.tick = rand(4, 6); if (Math.random() * 20 < lv) { m.stage++; m.place = route[m.stage]; Sfx.step(); if (m.stage === last) { m.state = 'door'; m.att = Math.max(3.2, 6 - lv * 0.1); m.scare = 0; } } } }
        else if (m.state === 'door') {
          if (this.light.R) { m.scare += dt; if (m.scare >= 0.7) { m.stage = 0; m.place = route[0]; m.state = 'roam'; m.tick = rand(6, 9); Sfx.flee(); } } else m.scare = Math.max(0, m.scare - dt * 0.5);
          if (this.door.R) this.extra += 0.28; else { m.att -= dt; if (m.att <= 0) this.catchBy('cuchara'); }
        }
      } else if (m.id === 'tamal') {
        const obs = this.watching(m.place);
        if (obs) { m.stare += dt; if (m.stare >= 2.8 && m.stage > 0) { m.stage--; m.place = route[m.stage]; m.stare = 0; Sfx.hiss(); } }
        else {
          m.stare = Math.max(0, m.stare - dt);
          m.tick -= dt; if (m.tick <= 0) { m.tick = rand(3.4, 5); if (m.stage < last && Math.random() * 20 < lv) { m.stage++; m.place = route[m.stage]; if (m.stage === last) m.att = Math.max(3.4, 6 - lv * 0.1); else Sfx.step(); } }
          if (m.stage === last) { m.att -= dt; this.tapT -= dt; if (this.tapT <= 0) { this.tapT = 1.3; Sfx.tap(); } if (m.att <= 0) this.catchBy('tamal'); }
        }
      }
    }
    const sb = this.sombra;
    if (sb) {
      if (sb.state === 'idle') { sb.tick -= dt; if (sb.tick <= 0) { sb.tick = rand(6.5, 9); if (Math.random() * 20 < sb.level) { sb.state = 'active'; sb.att = Math.max(4.2, 5.8 - sb.level * 0.05); sb.hold = 0; sb.t0 = sb.att; Sfx.warn(); } } }
      else { if (this.under) sb.hold += dt; else sb.hold = Math.max(0, sb.hold - dt * 0.4); if (sb.hold >= 2.6) { sb.state = 'idle'; sb.tick = rand(9, 14); Sfx.flee(); } else { sb.att -= dt; if (sb.att <= 0) this.catchBy('sombra'); } }
    }
  }

  // ---------- dibujo ----------
  render(g, ox = 0, oy = 0) {
    g.save(); g.translate(ox, oy); g.beginPath(); g.rect(0, 0, PW, PH); g.clip();
    g.imageSmoothingEnabled = false;
    if (this.cam && !this.under && !this.powerOut) this.renderCam(g); else this.renderOffice(g);
    this.renderHud(g);
    g.restore();
  }
  monAt(place) { return this.mons.filter(m => m.place === place && !m.hidden); }
  renderOffice(g) {
    g.drawImage(Art.office, 0, 0);
    const t = G.t;
    for (const side of ['L', 'R']) {
      const d = side === 'L' ? Art.DOORL : Art.DOORR, place = side === 'L' ? 'PIzq' : 'PDer';
      const lit = this.light[side] && !this.powerOut, here = this.monAt(place);
      g.drawImage(lit ? Art.hallLit : Art.hallDark, d.x, Art.DOORY);
      if (here.length) {
        g.save(); g.beginPath(); g.rect(d.x, Art.DOORY, d.w, Art.DOORH); g.clip();
        if (lit) for (const m of here) g.drawImage(Art.mon(m.id, false), d.x + 1, Art.DOORY + 14, 58, 87);
        else if (!this.powerOut && (t * 2 % 3) > 0.5) { R(g, d.x + 22, Art.DOORY + 60, 3, 2, '#ffe9a0'); R(g, d.x + 34, Art.DOORY + 60, 3, 2, '#ffe9a0'); }
        g.restore();
      }
      Art.drawDoorPanel(g, d, this.dpos[side]);
    }
    // ojos en la ventana (Tamal)
    if (this.mons.some(m => m.id === 'tamal' && m.stage === 3 && m.place === 'Ventana') && !this.powerOut) { const b = ((t * 3) | 0) % 5 !== 0; if (b) { R(g, 150, 68, 3, 3, '#ffe9a0'); R(g, 166, 68, 3, 3, '#ffe9a0'); } }
    // Sombra al pie de la cama
    const sb = this.sombra;
    if (sb && sb.state === 'active' && !this.powerOut) {
      const rise = clamp((sb.t0 - sb.att) / 1.4, 0, 1) * (this.under ? 0.5 : 1);
      g.save(); g.beginPath(); g.rect(0, 0, 320, 150); g.clip();
      g.globalAlpha = 0.9; g.drawImage(Art.mon('sombra', false), 112, 200 - 120 * rise + Math.sin(t * 6) * 2, 96, 144); g.globalAlpha = 1; g.restore();
      g.drawImage(Art.office, 0, 146, 320, 34, 0, 146, 320, 34);
    }
    // iluminación nocturna
    g.fillStyle = 'rgba(8,6,32,0.42)'; g.fillRect(0, 0, 320, SH);
    g.fillStyle = 'rgba(0,0,10,0.22)'; g.fillRect(0, 0, 320, 14); g.fillRect(0, SH - 14, 320, 14); g.fillRect(0, 0, 10, SH); g.fillRect(310, 0, 10, SH);
    if (this.hour >= 4) { g.fillStyle = 'rgba(255,150,80,' + (0.04 * (this.hour - 3)) + ')'; g.fillRect(0, 0, 320, SH); }
    if (this.under) { g.fillStyle = '#1c1240'; g.fillRect(0, 0, 320, SH); for (let y = 0; y < SH; y += 12) { g.fillStyle = (y / 12) % 2 ? '#241a52' : '#2a2060'; g.fillRect(0, y, 320, 6); } Txt.draw(g, 'ESCONDIDO BAJO LA COBIJA...', 160, 80, { s: 1, align: 'c', color: '#c9a6ff' }); if (sb && sb.state === 'active') { const p = clamp(sb.hold / 2.6, 0, 1); R(g, 110, 96, 100, 6, '#0c0818'); R(g, 111, 97, Math.round(98 * p), 4, '#a070e0'); } }
    else if (sb && sb.state === 'active' && (t * 4 % 2) > 1) { g.fillStyle = 'rgba(120,60,200,0.18)'; g.fillRect(0, 0, 320, SH); }
    if (this.powerOut) {
      g.fillStyle = 'rgba(0,0,0,0.93)'; g.fillRect(0, 0, 320, SH);
      const k = clamp(this.outT / this.outDelay, 0, 1), fl = (t * 7 | 0) % 3 !== 0, r = 3 + k * 6;
      if (this.mode === 'story' && fl) { E(g, 150 - k * 6, 90, r, r + 1, '#ffd23f'); E(g, 170 + k * 6, 90, r, r + 1, '#ffd23f'); }
      Txt.draw(g, 'SIN ENERGIA', 160, 150, { s: 1, align: 'c', color: '#802020' });
    } else if (this.blackout > 0) {
      g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(0, 0, 320, SH); Txt.draw(g, 'APAGON!', 160, 90, { s: 2, align: 'c', color: '#ffd23f' });
    }
    if (this.msgT > 0 && this.msg) Txt.draw(g, this.msg, 160, 20, { align: 'c', color: '#fff', shadow: '#000' });
    if (this.flash > 0) { g.fillStyle = 'rgba(255,255,255,' + this.flash * 0.6 + ')'; g.fillRect(0, 0, 320, SH); }
  }
  renderCam(g) {
    const t = G.t, place = this.camPlace;
    if (this.camBlind > 0) { g.fillStyle = '#334'; g.fillRect(0, 0, 320, SH); this.noise(g, 600); Txt.draw(g, 'VAPOR - SIN SEÑAL', 160, 80, { s: 1, align: 'c', color: '#fff', shadow: '#000' }); }
    else {
      g.drawImage(Art.CAMS[this.camIdx], 0, 0);
      const here = this.monAt(place), pos = [150, 80, 232, 116, 196];
      g.save();
      if (place === 'Ventana') { g.beginPath(); g.rect(106, 56, 108, 78); g.clip(); }
      here.forEach((m, i) => { const sc = place === 'Ventana' ? 1.6 : 2; const x = pos[i % 5] + Math.sin(t * 2 + i) * 1.5; Art.mon(m.id, false) && g.drawImage(Art.mon(m.id, false), x - 16 * sc, (place === 'Ventana' ? 134 : 172) - 48 * sc + Math.sin(t * 4 + i) * 1, 32 * sc, 48 * sc); });
      g.restore();
      g.fillStyle = 'rgba(10,60,40,0.30)'; g.fillRect(0, 0, 320, SH);
      this.noise(g, 50 + (this.flick > 0 ? 400 : 0));
    }
    g.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < SH; y += 2) g.fillRect(0, y, 320, 1);
    R(g, 4, 4, 140, 14, 'rgba(0,0,0,0.6)'); Txt.draw(g, 'CAM ' + (this.camIdx + 1) + ' - ' + CAM_NAMES[this.camIdx], 8, 8, { color: '#9fffb8' });
    if ((t * 2 | 0) % 2 === 0) E(g, 302, 10, 4, 4, '#e03030'); Txt.draw(g, 'REC', 294, 7, { color: '#fff', align: 'r', s: 1 });
    for (const m of this.mons) if (m.id === 'tamal' && m.stare > 0.05 && place === m.place) { R(g, 100, 22, 120, 14, 'rgba(0,0,0,0.6)'); Txt.draw(g, 'LO ESTAS MIRANDO...', 160, 26, { align: 'c', color: '#ffd23f' }); R(g, 110, 31, 100, 3, '#222'); R(g, 110, 31, Math.round(100 * clamp(m.stare / 2.8, 0, 1)), 3, '#ffd23f'); }
    if (this.mode === 'story' && this.camPlace !== 'Ventana') for (const m of this.mons) if (m.id === 'tamal' && m.stage === 3) { if ((t * 3 | 0) % 2) Txt.draw(g, '! VENTANA !', 160, 150, { align: 'c', color: '#ff6060', shadow: '#000' }); break; }
    // botones de cámara
    const cw = this.camCount === 7 ? 29 : 34;
    for (let i = 0; i < this.camCount; i++) { const x = 60 + i * cw, sel = i === this.camIdx; R(g, x, 160, 26, 15, sel ? '#3ae07a' : 'rgba(10,20,15,0.85)'); R(g, x, 160, 26, 1, '#3ae07a'); R(g, x, 174, 26, 1, '#3ae07a'); R(g, x, 160, 1, 15, '#3ae07a'); R(g, x + 25, 160, 1, 15, '#3ae07a'); Txt.draw(g, String(i + 1), x + 13, 164, { align: 'c', color: sel ? '#06210f' : '#9fffb8' }); }
    if (this.flash > 0) { this.noise(g, 900); }
  }
  noise(g, n) { for (let i = 0; i < n; i++) { const v = (Math.random() * 255) | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.35)'; g.fillRect((Math.random() * 320) | 0, (Math.random() * SH) | 0, 2 + (Math.random() * 6 | 0), 1); } }
  renderHud(g) {
    R(g, 0, SH, 320, 60, '#120e26'); R(g, 0, SH, 320, 2, '#4a3a8a'); R(g, 0, SH + 2, 320, 1, '#08051a');
    // energía
    const p = this.power, col = p > 50 ? '#3ae07a' : p > 20 ? '#ffd23f' : '#e03030';
    Txt.draw(g, 'ENERGIA ' + Math.ceil(p) + '%', 6, SH + 8, { color: col });
    for (let i = 0; i < 10; i++) R(g, 6 + i * 9, SH + 18, 8, 6, p > i * 10 ? col : '#2a2248');
    const use = 1 + this.door.L + this.door.R + this.light.L + this.light.R + (this.cam ? 1 : 0);
    Txt.draw(g, 'USO', 104, SH + 8, { color: '#9a8fd0' }); for (let i = 0; i < 5; i++) R(g, 104 + i * 6, SH + 18, 5, 6, i < use ? (use > 3 ? '#e03030' : '#ffd23f') : '#2a2248');
    const hrs = ['12', '1', '2', '3', '4', '5']; Txt.draw(g, hrs[this.hour] + ' AM', 314, SH + 7, { s: 2, align: 'r', color: '#fff' });
    Txt.draw(g, this.mode === 'story' ? 'NOCHE ' + this.n : 'GUARDIA', 314, SH + 25, { align: 'r', color: '#9a8fd0' });
    R(g, 0, SH, Math.round(320 * this.t / this.duration), 2, '#ffd23f');
    for (const b of this.buttons()) {
      const dis = this.powerOut; R(g, b.x, b.y, b.w, b.h, '#000'); R(g, b.x + 1, b.y + 1, b.w - 2, b.h - 2, b.on ? b.col : (dis ? '#1a1630' : '#2a2250'));
      R(g, b.x + 1, b.y + 1, b.w - 2, 1, b.on ? '#fff' : '#4a3e86');
      const tc = b.on ? '#1a0f1f' : (dis ? '#4a4070' : '#d8d0ff');
      Txt.draw(g, b.label, b.x + b.w / 2, b.y + 5, { align: 'c', color: tc }); if (b.sub) Txt.draw(g, b.sub, b.x + b.w / 2, b.y + 14, { align: 'c', color: tc });
      Txt.draw(g, '[' + b.key + ']', b.x + b.w / 2, b.y + 23, { align: 'c', color: b.on ? '#1a0f1f' : '#8a7fe0' });
    }
  }
}

// =====================================================
//  ESCENAS
// =====================================================
const kbd = {};  // utilidades de menú
function menuNav(items, sel, code) { if (code === 'ArrowUp' || code === 'KeyW') return (sel + items - 1) % items; if (code === 'ArrowDown' || code === 'KeyS') return (sel + 1) % items; return sel; }
function panel(g, x, y, w, h, fill = '#14102a', border = '#4a3a8a') { R(g, x, y, w, h, '#000'); R(g, x + 1, y + 1, w - 2, h - 2, border); R(g, x + 2, y + 2, w - 4, h - 4, fill); }
function drawMonster(g, id, x, yb, sc, bob = 0, scare = false) { g.drawImage(Art.mon(id, scare), Math.round(x - 16 * sc), Math.round(yb - 48 * sc + bob), 32 * sc, 48 * sc); }
function title(g, y) {
  const w = Math.sin(G.t * 2) * 2;
  Txt.draw(g, 'NOCHES', 160, y + w, { s: 5, align: 'c', color: '#ffd23f', outline: '#1a0f1f', shadow: '#c8501a' });
  Txt.draw(g, 'DE RICHI', 160, y + 40 - w, { s: 5, align: 'c', color: '#ff7ab8', outline: '#1a0f1f', shadow: '#a02060' });
}

// ---------- MENÚ ----------
const Menu = {
  sel: 0, items: ['HISTORIA', 'MULTIJUGADOR', 'REGLAS', 'SONIDO'],
  enter() { this.sel = 0; if (G.started) Sfx.musicStart('menu'); Sfx.droneStop(); },
  update(dt) {},
  render(g) {
    g.drawImage(Art.menuBg, 0, 0); g.drawImage(Art.menuFront, 0, 0);
    const ids = ['chancla', 'cuchara', 'tamal', 'sombra', 'apagon'];
    ids.forEach((id, i) => drawMonster(g, id, 50 + i * 55 + (i > 1 ? 50 : 0), 244, 1.25, Math.sin(G.t * 3 + i * 1.3) * 3));
    title(g, 14);
    if (!G.started) { if ((G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'PULSA CUALQUIER TECLA', 160, 120, { s: 2, align: 'c', color: '#fff', outline: '#1a0f1f' }); Txt.draw(g, 'UN JUEGO DE MIEDO ENTRE PRIMOS', 160, 150, { align: 'c', color: '#c9a6ff', shadow: '#000' }); return; }
    panel(g, 84, 100, 152, 86, 'rgba(12,8,30,0.9)');
    this.items.forEach((it, i) => {
      const sel = i === this.sel, y = 108 + i * 15; let label = it; if (i === 3) label = 'SONIDO: ' + (Sfx.muted ? 'NO' : 'SI');
      Txt.draw(g, (sel ? '> ' : '  ') + label, 160, y, { align: 'c', s: 1, color: sel ? '#ffd23f' : '#d8d0ff', shadow: '#000' });
    });
    Txt.draw(g, 'FLECHAS + ENTER O CLIC', 160, 172, { align: 'c', color: '#8a7fe0' });
  },
  activate(i) {
    Sfx.click();
    if (i === 0) setScene(StorySelect); else if (i === 1) setScene(VsIntro); else if (i === 2) setScene(Rules, 0);
    else { Sfx.toggleMute(); }
  },
  keydown(c) {
    if (!G.started) return;
    const s = menuNav(this.items.length, this.sel, c); if (s !== this.sel) { this.sel = s; Sfx.blip(); }
    if (c === 'Enter' || c === 'Space') this.activate(this.sel);
  },
  pointer(x, y) { if (!G.started) return; for (let i = 0; i < this.items.length; i++) if (x > 84 && x < 236 && y >= 105 + i * 15 && y < 120 + i * 15) { this.sel = i; this.activate(i); } },
};

// ---------- HISTORIA: selector de noche ----------
const StorySelect = {
  sel: 0,
  enter() { this.sel = Math.min(save.night, 6) - 1; if (this.sel < 0) this.sel = 0; },
  render(g) {
    g.drawImage(Art.menuBg, 0, 0); R(g, 0, 0, 320, 240, 'rgba(0,0,0,0.55)');
    Txt.draw(g, 'MODO HISTORIA', 160, 14, { s: 2, align: 'c', color: '#ffd23f', shadow: '#000' });
    Txt.draw(g, 'ELIGE TU NOCHE', 160, 40, { align: 'c', color: '#c9a6ff' });
    for (let i = 0; i < 6; i++) {
      const x = 22 + (i % 3) * 98, y = 66 + ((i / 3) | 0) * 70, lock = i + 1 > save.night, sel = i === this.sel;
      panel(g, x, y, 88, 60, lock ? '#1a1830' : '#1c1646', sel ? '#ffd23f' : '#4a3a8a');
      Txt.draw(g, i === 5 ? 'NOCHE 6' : 'NOCHE ' + (i + 1), x + 44, y + 8, { align: 'c', color: lock ? '#5a5080' : '#fff' });
      if (lock) Txt.draw(g, 'BLOQUEADA', x + 44, y + 34, { align: 'c', color: '#5a5080' });
      else { const ids = Object.keys(LEVELS[i]); ids.forEach((id, k) => drawMonster(g, id, x + 44 - (ids.length - 1) * 9 + k * 18, y + 56, 0.5, 0)); }
      if (i === 5 && !lock) Txt.draw(g, 'IMPOSIBLE', x + 44, y + 22, { align: 'c', color: '#ff6060' });
    }
    Txt.draw(g, 'ENTER: JUGAR   ESC: VOLVER', 160, 222, { align: 'c', color: '#8a7fe0' });
  },
  keydown(c) {
    if (c === 'Escape') { Sfx.back(); return setScene(Menu); }
    let s = this.sel; if (c === 'ArrowLeft' || c === 'KeyA') s = (s + 5) % 6; if (c === 'ArrowRight' || c === 'KeyD') s = (s + 1) % 6; if (c === 'ArrowUp' || c === 'KeyW') s = (s + 3) % 6; if (c === 'ArrowDown' || c === 'KeyS') s = (s + 3) % 6;
    if (s !== this.sel) { this.sel = s; Sfx.blip(); }
    if (c === 'Enter' || c === 'Space') this.go(this.sel);
  },
  go(i) { if (i + 1 > save.night) { Sfx.back(); return; } Sfx.click(); if (i === 0 && !save.seenIntro) { setScene(Cutscene, INTRO, () => { save.seenIntro = true; persist(); setScene(NightIntro, 1); }); } else setScene(NightIntro, i + 1); },
  pointer(x, y) { for (let i = 0; i < 6; i++) { const bx = 22 + (i % 3) * 98, by = 66 + ((i / 3) | 0) * 70; if (x >= bx && x < bx + 88 && y >= by && y < by + 60) { this.sel = i; this.go(i); } } },
};

// ---------- CUTSCENE de texto ----------
const INTRO = ['Todo empezó una noche de luna llena en casa de Richi...', 'Los primos jugaban a ser guardias y los muñecos de la tele... cobraron vida.', 'Ahora los BRAINROTS salen cada noche, de las 12 a las 6 de la mañana.', 'Sobrevive 5 noches, Richi. Respeta las REGLAS DE LA CASA... o te atrapan.'];
const ENDING = ['Sonó el gallo. La quinta noche había terminado.', 'Los brainrots volvieron a la tele, cansados y un poco avergonzados.', 'Richi y sus primos se rieron toda la mañana... pero algo dice que mañana habrá más.', '¿Te atreves con la NOCHE 6?', 'FIN'];
const Cutscene = {
  enter(lines, done) { this.lines = lines; this.done = done; this.i = 0; this.c = 0; },
  update(dt) { const L = this.lines[this.i]; if (this.c < L.length) { this.c += dt * 32; if ((this.c | 0) % 3 === 0) Sfx.blip(); } },
  render(g) {
    R(g, 0, 0, 320, 240, '#07061a'); for (let i = 0; i < 40; i++) R(g, (i * 71) % 320, (i * 37) % 140, 1, 1, '#fff');
    E(g, 160, 80, 26, 26, '#fff6c8'); E(g, 170, 72, 22, 22, '#07061a'); E(g, 160, 80, 26, 26, '#fff6c8'); E(g, 172, 70, 21, 21, '#07061a');
    R(g, 100, 130, 120, 50, '#1c1634'); R(g, 140, 138, 20, 20, '#ffd23f'); R(g, 149, 138, 2, 20, '#c8901a'); R(g, 140, 147, 20, 2, '#c8901a');
    const L = this.lines[this.i], shown = L.slice(0, this.c | 0), lines = Txt.wrap(shown, 270);
    panel(g, 20, 168, 280, 56); lines.forEach((l, k) => Txt.draw(g, l, 32, 178 + k * 11, { color: '#fff' }));
    if (this.c >= L.length && (G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'ENTER >', 292, 214, { align: 'r', color: '#ffd23f' });
  },
  next() { if (this.c < this.lines[this.i].length) { this.c = 999; return; } Sfx.click(); if (++this.i >= this.lines.length) this.done(); else this.c = 0; },
  keydown(c) { if (c === 'Enter' || c === 'Space') this.next(); if (c === 'Escape') this.done(); },
  pointer() { this.next(); },
};

// ---------- tarjeta de noche ----------
const NightIntro = {
  enter(n) { this.n = n; this.t = 0; Sfx.musicStop(); Sfx.droneStop(); },
  update(dt) { this.t += dt; },
  render(g) {
    R(g, 0, 0, 320, 240, '#05040f');
    Txt.draw(g, 'NOCHE ' + this.n, 160, 26, { s: 4, align: 'c', color: '#fff', shadow: '#6a3fa8' });
    Txt.draw(g, '12:00 AM', 160, 66, { s: 2, align: 'c', color: '#ffd23f' });
    const lv = LEVELS[this.n - 1], ids = Object.keys(lv), news = ids.filter(id => !(this.n > 1 && LEVELS[this.n - 2][id]));
    if (this.n === 6) Txt.draw(g, 'ESTA NOCHE NO HAY LLAMADA. CORRE.', 160, 100, { align: 'c', color: '#ff6060' });
    else if (news.length) { Txt.draw(g, 'NUEVA REGLA', 160, 94, { align: 'c', color: '#ff7ab8' }); const id = news[0], mi = Art.MONS[id]; drawMonster(g, id, 54, 172, 2, Math.sin(G.t * 3) * 2); Txt.draw(g, mi.name, 100, 110, { color: mi.color }); Txt.wrap(mi.rule, 200).forEach((l, i) => Txt.draw(g, l, 100, 126 + i * 11, { color: '#d8d0ff' })); }
    else Txt.draw(g, 'LOS MONSTRUOS ESTAN MAS FUERTES.', 160, 100, { align: 'c', color: '#c9a6ff' });
    if (this.n === 4) { drawMonster(g, 'apagon', 54, 232, 1, 0); }
    if (this.t > 0.8 && (G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'ENTER PARA EMPEZAR', 160, 212, { align: 'c', color: '#ffd23f' });
  },
  start() { if (this.t < 0.6) return; Sfx.click(); setScene(Play, this.n); },
  keydown(c) { if (c === 'Enter' || c === 'Space') this.start(); if (c === 'Escape') setScene(StorySelect); },
  pointer() { this.start(); },
};

// ---------- JUEGO (historia) ----------
const Play = {
  enter(n) {
    this.n = n; this.night = new Night({ mode: 'story', n, levels: LEVELS[n - 1], hourSec: FAST ? 5 : 40, scheme: SCHEMES.story });
    this.call = CALLS[n - 1]; this.callI = -1; this.callT = 1.5; this.callOn = this.call.length > 0; this.paused = false; this.fade = 1; this.lastHour = 0;
    Sfx.musicStop(); Sfx.droneStart();
  },
  update(dt) {
    if (this.paused) return;
    this.fade = Math.max(0, this.fade - dt);
    const nt = this.night; nt.held.lightL = held(nt.scheme.lightL); nt.held.lightR = held(nt.scheme.lightR); nt.held.blanket = held(nt.scheme.blanket);
    nt.update(dt);
    if (nt.hour !== this.lastHour) { this.lastHour = nt.hour; Sfx.blip(); nt.say(['12', '1', '2', '3', '4', '5'][nt.hour] + ' AM'); }
    if (this.callOn) { this.callT -= dt; if (this.callT <= 0) { this.callI++; if (this.callI >= this.call.length) { this.callOn = false; } else { this.callT = 5.5; if (this.callI === 0) Sfx.phone(); } } }
    if (nt.caught) setScene(Jump, nt.caught, () => setScene(GameOver, nt.caught, this.n));
    else if (nt.won) setScene(Win, this.n, nt.power);
  },
  render(g) {
    this.night.render(g, 0, 0);
    if (this.callOn && this.callI >= 0) { panel(g, 4, 22, 312, 42, 'rgba(8,6,24,0.92)', '#3ae07a'); Txt.draw(g, 'MEMO (LLAMADA) - M: SILENCIAR', 10, 27, { color: '#3ae07a' }); Txt.wrap(this.call[this.callI], 296).forEach((l, i) => Txt.draw(g, l, 10, 39 + i * 10, { color: '#fff' })); }
    if (this.fade > 0) { g.fillStyle = 'rgba(0,0,0,' + this.fade + ')'; g.fillRect(0, 0, 320, 240); }
    if (this.paused) { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, 320, 240); Txt.draw(g, 'PAUSA', 160, 80, { s: 4, align: 'c', color: '#ffd23f' }); Txt.draw(g, 'ENTER: SEGUIR', 160, 130, { align: 'c', color: '#fff' }); Txt.draw(g, 'ESC: SALIR AL MENU', 160, 146, { align: 'c', color: '#c9a6ff' }); }
  },
  keydown(c) {
    if (this.paused) { if (c === 'Enter') this.paused = false; if (c === 'Escape') { Sfx.droneStop(); setScene(Menu); } return; }
    if (c === 'Escape') { this.paused = true; return; }
    if (c === 'KeyM') this.callOn = false;
    this.night.keydown(c);
  },
  pointer(x, y) { if (!this.paused) this.night.pointerDown(x, y); },
  pointerUp() { if (this.night) this.night.pointerUp(); },
};

// ---------- SUSTO ----------
const Jump = {
  enter(id, done) { this.id = id; this.done = done; this.t = 0; Sfx.droneStop(); Sfx.musicStop(); Sfx.scare(); this.w = G.vsWide ? 640 : PW; resize(this.w, PH); },
  update(dt) { this.t += dt; if (this.t > 1.7) { this.done(); } },
  render(g) {
    const W = canvas.width, k = Math.min(1, this.t * 6), sh = (Math.random() - 0.5) * 14;
    g.fillStyle = (this.t * 20 | 0) % 2 ? '#300' : '#000'; g.fillRect(0, 0, W, 240);
    const sc = 4 + k * 4; g.drawImage(Art.mon(this.id, true), Math.round(W / 2 - 16 * sc + sh), Math.round(250 - 48 * sc * (0.7 + 0.3 * k) + sh), 32 * sc, 48 * sc);
    if ((this.t * 30 | 0) % 3 === 0) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, W, 240); }
    for (let i = 0; i < 200; i++) { const v = (Math.random() * 255) | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.3)'; g.fillRect(Math.random() * W, Math.random() * 240, 3, 1); }
  },
  keydown() {}, pointer() {},
};

// ---------- GAME OVER ----------
const GameOver = {
  enter(id, n) { this.id = id; this.n = n; this.t = 0; Sfx.lose(); },
  update(dt) { this.t += dt; },
  render(g) {
    R(g, 0, 0, 320, 240, '#0a0204'); const mi = Art.MONS[this.id];
    Txt.draw(g, 'TE ATRAPO', 160, 18, { s: 3, align: 'c', color: '#e03030', shadow: '#300' });
    Txt.draw(g, mi.name, 160, 52, { align: 'c', color: mi.color });
    drawMonster(g, this.id, 160, 150, 2, Math.sin(G.t * 3) * 2);
    panel(g, 20, 156, 280, 44, '#14080c', '#802020'); Txt.draw(g, 'CONSEJO:', 28, 162, { color: '#ffd23f' }); Txt.wrap(mi.tip, 262).forEach((l, i) => Txt.draw(g, l, 28, 173 + i * 10, { color: '#fff' }));
    if (this.t > 0.5) { Txt.draw(g, 'ENTER: REINTENTAR', 160, 210, { align: 'c', color: '#ffd23f' }); Txt.draw(g, 'ESC: MENU', 160, 224, { align: 'c', color: '#c9a6ff' }); }
  },
  keydown(c) { if (this.t < 0.5) return; if (c === 'Enter' || c === 'Space') setScene(NightIntro, this.n); if (c === 'Escape') setScene(Menu); },
  pointer() { if (this.t > 0.5) setScene(NightIntro, this.n); },
};

// ---------- 6 AM ----------
const Win = {
  enter(n, power) {
    this.n = n; this.power = power; this.t = 0; Sfx.droneStop(); Sfx.bell(); setTimeout(() => Sfx.win(), 900);
    if (n >= save.night && n < 6) save.night = n + 1; if (n === 5) save.won = true; persist();
    this.conf = Array.from({ length: 50 }, () => ({ x: rand(0, 320), y: rand(-240, 0), v: rand(30, 80), c: ['#ffd23f', '#ff7ab8', '#3ae07a', '#3aa0ff'][(Math.random() * 4) | 0] }));
  },
  update(dt) { this.t += dt; for (const c of this.conf) { c.y += c.v * dt; if (c.y > 240) c.y = -5; } },
  render(g) {
    const bands = ['#2a2070', '#6a3fa8', '#c0507a', '#f08a5a', '#ffc070']; bands.forEach((c, i) => R(g, 0, i * 36, 320, 37, c));
    const up = clamp(this.t / 3, 0, 1); E(g, 160, 200 - up * 70, 34, 34, '#fff6a0'); E(g, 160, 200 - up * 70, 28, 28, '#ffe040');
    R(g, 0, 200, 320, 40, '#1c1634'); for (const c of this.conf) R(g, c.x, c.y, 3, 3, c.c);
    Txt.draw(g, '6:00 AM', 160, 20, { s: 5, align: 'c', color: '#fff', outline: '#1a0f1f', shadow: '#c8501a' });
    Txt.draw(g, 'SOBREVIVISTE LA NOCHE ' + this.n + '!', 160, 76, { s: 1, align: 'c', color: '#fff', shadow: '#000' });
    Txt.draw(g, 'ENERGIA RESTANTE: ' + Math.ceil(this.power) + '%', 160, 92, { align: 'c', color: '#3ae07a', shadow: '#000' });
    if (this.t > 1.5 && (G.t * 2 | 0) % 2 === 0) Txt.draw(g, this.n === 5 ? 'ENTER: EL FINAL' : this.n === 6 ? 'ENTER: MENU' : 'ENTER: SIGUIENTE NOCHE', 160, 216, { align: 'c', color: '#ffd23f', shadow: '#000' });
  },
  next() { if (this.t < 1.5) return; Sfx.click(); if (this.n === 5) setScene(Cutscene, ENDING, () => setScene(Menu)); else if (this.n === 6) setScene(Menu); else setScene(NightIntro, this.n + 1); },
  keydown(c) { if (c === 'Enter' || c === 'Space') this.next(); }, pointer() { this.next(); },
};

// ---------- REGLAS ----------
const Rules = {
  page: 0, pages: 8,
  enter(p) { this.page = p || 0; },
  render(g) {
    g.drawImage(Art.menuBg, 0, 0); R(g, 0, 0, 320, 240, 'rgba(0,0,0,0.7)');
    Txt.draw(g, 'REGLAS DE LA CASA', 160, 10, { s: 2, align: 'c', color: '#ffd23f', shadow: '#000' });
    const p = this.page; panel(g, 10, 34, 300, 176);
    const txt = (arr, y0) => arr.forEach((l, i) => { const w = Txt.wrap(l, 280); w.forEach((ww, k) => { Txt.draw(g, ww, 20, y0, { color: '#fff' }); y0 += 10; }); y0 += 4; });
    if (p === 0) { Txt.draw(g, 'LO BASICO', 20, 42, { color: '#ff7ab8' }); txt(['SOBREVIVE DE 12 AM A 6 AM CUIDANDO TU CUARTO.', 'PUERTAS (A / D): CIERRALAS PARA BLOQUEAR, PERO GASTAN ENERGIA.', 'LUCES (Q / E): MANTEN PARA VER QUIEN ESTA EN LA PUERTA.', 'CAMARAS (W O ESPACIO): CAMBIA CON Z X O NUMEROS 1-7.', 'COBIJA (S): MANTEN PARA ESCONDERTE.'], 56); }
    else if (p === 1) { Txt.draw(g, 'ENERGIA Y CAMARAS', 20, 42, { color: '#ff7ab8' }); txt(['MIENTRAS MIRAS LAS CAMARAS NO PUEDES MOVER PUERTAS NI LUCES.', 'TODO GASTA ENERGIA: PUERTAS CERRADAS, LUCES Y CAMARAS.', 'SI LA ENERGIA LLEGA A 0%, SE ABREN LAS PUERTAS Y SALE DON APAGON.', 'ESC PAUSA EL JUEGO. M SILENCIA LA LLAMADA DE MEMO.'], 56); }
    else if (p >= 2 && p <= 6) { const id = ['chancla', 'cuchara', 'tamal', 'sombra', 'apagon'][p - 2], mi = Art.MONS[id]; drawMonster(g, id, 56, 150, 2.4, Math.sin(G.t * 3) * 2); Txt.draw(g, mi.name, 100, 46, { color: mi.color }); Txt.wrap(mi.rule, 200).forEach((l, i) => Txt.draw(g, l, 100, 66 + i * 11, { color: '#fff' })); Txt.draw(g, 'CONSEJO:', 100, 136, { color: '#ffd23f' }); Txt.wrap(mi.tip, 200).forEach((l, i) => Txt.draw(g, l, 100, 148 + i * 11, { color: '#d8d0ff' })); }
    else { Txt.draw(g, 'MULTIJUGADOR (1 VS 1)', 20, 42, { color: '#ff7ab8' }); txt(['UN JUGADOR ES EL GUARDIA Y EL OTRO ES UN MONSTRUO. LUEGO CAMBIAN.', 'EL MONSTRUO RECORRE LA CASA Y VA A UNA PUERTA. AHI PULSA ATAQUE.', 'SI LA PUERTA ESTA ABIERTA CUANDO TERMINA SU ATAQUE, GANA.', 'SI EL GUARDIA CIERRA A TIEMPO, EL MONSTRUO QUEDA ATURDIDO.', 'GANA QUIEN AGUANTE MAS TIEMPO COMO GUARDIA.'], 56); }
    Txt.draw(g, 'PAGINA ' + (p + 1) + '/' + this.pages, 160, 216, { align: 'c', color: '#8a7fe0' }); Txt.draw(g, '< >  ESC: VOLVER', 160, 228, { align: 'c', color: '#8a7fe0' });
  },
  keydown(c) {
    if (c === 'Escape') { Sfx.back(); setScene(Menu); }
    if (c === 'ArrowRight' || c === 'KeyD' || c === 'Enter') { this.page = (this.page + 1) % this.pages; Sfx.blip(); }
    if (c === 'ArrowLeft' || c === 'KeyA') { this.page = (this.page + this.pages - 1) % this.pages; Sfx.blip(); }
  },
  pointer(x) { if (x > 160) this.keydown('ArrowRight'); else this.keydown('ArrowLeft'); },
};

// =====================================================
//  MULTIJUGADOR LOCAL: GUARDIA VS MONSTRUO
// =====================================================
const NODES = {
  Patio: { c: 0, r: 0, n: 'PATIO' }, Cocina: { c: 1, r: 0, n: 'COCINA' }, Bano: { c: 3, r: 0, n: 'BAÑO' },
  Comedor: { c: 1, r: 1, n: 'COMEDOR' }, Sala: { c: 2, r: 1, n: 'SALA' }, Pasillo: { c: 1, r: 2, n: 'PASILLO' },
  PIzq: { c: 0, r: 2, n: 'PUERTA IZQ' }, PDer: { c: 3, r: 2, n: 'PUERTA DER' },
};
const EDGES = [['Patio', 'Cocina'], ['Cocina', 'Comedor'], ['Comedor', 'Sala'], ['Comedor', 'Pasillo'], ['Sala', 'Pasillo'], ['Sala', 'Bano'], ['Bano', 'PDer'], ['Sala', 'PDer'], ['Pasillo', 'PIzq'], ['Patio', 'PIzq']];
const nbrs = p => EDGES.filter(e => e.includes(p)).map(e => e[0] === p ? e[1] : e[0]);
const npos = p => ({ x: 44 + NODES[p].c * 77, y: 56 + NODES[p].r * 50 });
const VCHARS = {
  chancla: { move: 1.0, ab: 'CHANCLAZO', abd: 'SALTA 2 NODOS HACIA LA PUERTA MAS CERCANA', cd: 16 },
  cuchara: { move: 1.2, ab: 'SIGILO', abd: 'INVISIBLE EN CAMARAS POR 6 SEGUNDOS', cd: 14 },
  tamal: { move: 1.3, ab: 'VAPOR', abd: 'LAS CAMARAS DEL GUARDIA SE CAEN 6 SEGUNDOS', cd: 15 },
  apagon: { move: 1.5, ab: 'APAGON', abd: 'SIN LUCES 6 SEGUNDOS Y -8% DE ENERGIA', cd: 18 },
};
const VIDS = Object.keys(VCHARS);
function pathToDoor(from) { // BFS al nodo de puerta más cercano
  const q = [[from]], seen = new Set([from]);
  while (q.length) { const p = q.shift(), cur = p[p.length - 1]; if (cur === 'PIzq' || cur === 'PDer') return p; for (const n of nbrs(cur)) if (!seen.has(n)) { seen.add(n); q.push([...p, n]); } }
  return [from];
}

const VsIntro = {
  w: 640, h: PH,
  enter() { G.vsWide = true; Vs.reset(); Sfx.musicStart('vs'); },
  render(g) {
    R(g, 0, 0, 640, 240, '#0b0a20'); g.drawImage(Art.menuBg, 0, 0, 320, 240, 160, 0, 320, 240); R(g, 0, 0, 640, 240, 'rgba(0,0,0,0.55)');
    Txt.draw(g, 'MULTIJUGADOR LOCAL', 320, 10, { s: 3, align: 'c', color: '#ffd23f', outline: '#1a0f1f' });
    Txt.draw(g, 'GUARDIA  VS  MONSTRUO', 320, 40, { s: 2, align: 'c', color: '#ff7ab8', shadow: '#000' });
    panel(g, 20, 64, 290, 130, 'rgba(12,8,30,0.9)'); panel(g, 330, 64, 290, 130, 'rgba(12,8,30,0.9)');
    Txt.draw(g, 'GUARDIA (RICHI)', 30, 72, { color: '#3ae07a' });
    ['SOBREVIVE HASTA LAS 6 AM.', 'PUERTAS, LUCES, CAMARAS Y COBIJA', 'COMO EN EL MODO HISTORIA.', 'AL MONSTRUO LO VES EN CAMARAS', 'O CON LA LUZ EN LA PUERTA.', 'SI MIRAS SU CUARTO EN CAMARA,', 'SE MUEVE MAS LENTO.'].forEach((l, i) => Txt.draw(g, l, 30, 88 + i * 12, { color: '#fff' }));
    Txt.draw(g, 'MONSTRUO', 340, 72, { color: '#e0382f' });
    ['RECORRE LA CASA HASTA UNA PUERTA', 'Y ATACA. EL ATAQUE SUENA: SI LA', 'PUERTA SIGUE ABIERTA, ATRAPAS.', 'SI EL GUARDIA CIERRA, TE ATURDES.', 'USA TU HABILIDAD ESPECIAL.', 'GANA QUIEN AGUANTE MAS COMO', 'GUARDIA. SE CAMBIAN DE ROL.'].forEach((l, i) => Txt.draw(g, l, 340, 88 + i * 12, { color: '#fff' }));
    Txt.draw(g, 'JUGADOR 1: A D Q E W S Z X  |  MONSTRUO: WASD F G', 320, 204, { align: 'c', color: '#c9a6ff' });
    Txt.draw(g, 'JUGADOR 2: J L U O I K N M  |  MONSTRUO: FLECHAS ENTER .', 320, 216, { align: 'c', color: '#c9a6ff' });
    if ((G.t * 2 | 0) % 2 === 0) Txt.draw(g, 'ENTER: EMPEZAR   ESC: VOLVER', 320, 228, { align: 'c', color: '#ffd23f' });
  },
  keydown(c) { if (c === 'Enter') { Sfx.click(); setScene(Vs, 'pick'); } if (c === 'Escape') { Sfx.back(); G.vsWide = false; setScene(Menu); } },
  pointer() { Sfx.click(); setScene(Vs, 'pick'); },
};

const Vs = {
  w: 640, h: PH,
  reset() { this.round = 0; this.times = [0, 0]; this.powers = [0, 0]; this.surv = [false, false]; },
  get guardP() { return this.round === 0 ? 0 : 1; }, get monP() { return 1 - this.guardP; },
  enter(phase) { this.phase = phase || 'pick'; if (this.phase === 'pick') { this.pick = 0; } G.vsWide = true; },
  startRound() {
    const gp = this.guardP;
    this.night = new Night({ mode: 'vs', scheme: gp === 0 ? SCHEMES.p1 : SCHEMES.p2, hourSec: FAST ? 3 : 25, camCount: 6 });
    this.mon = { id: VIDS[this.pick], place: 'Patio', cd: 2, stun: 0, atk: null, abCd: 8, prev: 'Patio', hidden: false, sneak: 0, seen: false };
    this.night.mons = [this.mon]; this.phase = 'play'; this.lastHour = 0; this.fade = 1; this.over = null; Sfx.droneStart(); Sfx.musicStop();
  },
  update(dt) {
    if (this.phase !== 'play' || this.paused) return;
    this.fade = Math.max(0, this.fade - dt);
    const nt = this.night, m = this.mon, ch = VCHARS[m.id], gs = nt.scheme;
    nt.held.lightL = held(gs.lightL); nt.held.lightR = held(gs.lightR); nt.held.blanket = held(gs.blanket);
    nt.update(dt);
    if (nt.hour !== this.lastHour) { this.lastHour = nt.hour; Sfx.blip(); }
    m.cd -= dt; m.stun -= dt; m.abCd -= dt; m.sneak -= dt; m.hidden = m.sneak > 0; m.seen = nt.watching(m.place) && !m.hidden;
    if (m.atk) {
      const side = m.atk.side;
      if (nt.door[side] && !nt.powerOut) { m.atk = null; m.stun = 3.2; m.place = m.prev; m.cd = 1; Sfx.hit(); nt.say('¡PUERTA CERRADA A TIEMPO!'); }
      else { m.atk.t -= dt; if (m.atk.t <= 0) { m.atk = null; nt.catchBy(m.id); } }
    }
    if (nt.caught) { this.finish(false, nt.caught); }
    else if (nt.won) { this.finish(true); }
  },
  finish(surv, id) {
    const gp = this.guardP; this.times[gp] = this.night.t; this.powers[gp] = this.night.power; this.surv[gp] = surv; Sfx.droneStop();
    if (surv) { this.phase = 'over'; this.over = { surv: true }; Sfx.bell(); }
    else setScene(Jump, id, () => { G.vsWide = true; setScene(Vs, 'roundEnd'); Vs.over = { surv: false, id }; });
  },
  tryMove(dir) {
    const m = this.mon, nt = this.night; if (m.cd > 0 || m.stun > 0 || m.atk) return;
    const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir], from = npos(m.place); let best = null, bs = 0.35;
    for (const n of nbrs(m.place)) { const p = npos(n), dx = p.x - from.x, dy = p.y - from.y, l = Math.hypot(dx, dy), s = (dx * v[0] + dy * v[1]) / l; if (s > bs) { bs = s; best = n; } }
    if (best) { m.prev = m.place; m.place = best; m.cd = VCHARS[m.id].move * (nt.watching(m.place) ? 1.7 : 1); if (best === 'PIzq' || best === 'PDer') Sfx.step(); else if (nt.watching(best)) Sfx.blip(); }
  },
  keydown(c) {
    if (this.phase === 'pick') {
      const ms = MSCHEMES[this.monP === 0 ? 'p1' : 'p2'];
      if (c === ms.left) { this.pick = (this.pick + VIDS.length - 1) % VIDS.length; Sfx.blip(); } else if (c === ms.right) { this.pick = (this.pick + 1) % VIDS.length; Sfx.blip(); }
      else if (c === ms.attack || c === 'Enter') { Sfx.click(); this.startRound(); }
      if (c === 'Escape') { Sfx.back(); setScene(VsIntro); }
      return;
    }
    if (this.phase === 'roundEnd' || this.phase === 'over') { if (c === 'Enter') this.nextRound(); return; }
    if (this.phase === 'final') { if (c === 'Enter') { this.reset(); setScene(Vs, 'pick'); } if (c === 'Escape') { G.vsWide = false; setScene(Menu); } return; }
    if (this.phase !== 'play') return;
    if (this.paused) { if (c === 'Enter') this.paused = false; if (c === 'Escape') { Sfx.droneStop(); G.vsWide = false; setScene(Menu); } return; }
    if (c === 'Escape') { this.paused = true; return; }
    this.night.keydown(c);
    const ms = MSCHEMES[this.monP === 0 ? 'p1' : 'p2'], m = this.mon, nt = this.night;
    for (const d of ['up', 'down', 'left', 'right']) if (c === ms[d]) this.tryMove(d);
    if (c === ms.attack && m.cd <= 0 && m.stun <= 0 && !m.atk && (m.place === 'PIzq' || m.place === 'PDer')) {
      const side = m.place === 'PIzq' ? 'L' : 'R';
      if (nt.door[side] && !nt.powerOut) { m.stun = 2; Sfx.hit(); nt.say('¡PUERTA CERRADA!'); }
      else { m.atk = { side, t: 1.6 }; Sfx.knock(); }
    }
    if (c === ms.ability && m.abCd <= 0 && m.stun <= 0 && !m.atk) {
      const ch = VCHARS[m.id]; m.abCd = ch.cd; Sfx.ability();
      if (m.id === 'chancla') { const p = pathToDoor(m.place); const dest = p[Math.min(2, p.length - 1)]; m.prev = m.place; m.place = dest; m.cd = 1; if (dest === 'PIzq' || dest === 'PDer') Sfx.step(); }
      else if (m.id === 'cuchara') m.sneak = 6;
      else if (m.id === 'tamal') { nt.camBlind = 6; nt.cam && nt.say('¡VAPOR!'); }
      else if (m.id === 'apagon') { nt.blackout = 6; nt.power = Math.max(0.5, nt.power - 8); }
    }
  },
  pointer(x, y) { if (this.phase === 'play' && !this.paused) { const gx = this.guardP === 0 ? 0 : 320; this.night.pointerDown(x - gx, y); } else if (this.phase === 'roundEnd' || this.phase === 'over') this.nextRound(); },
  pointerUp() { if (this.night) this.night.pointerUp(); },
  nextRound() {
    Sfx.click(); if (this.round === 0) { this.round = 1; this.phase = 'pick'; this.pick = 0; this.night = null; setScene(Vs, 'pick'); }
    else { this.phase = 'final'; Sfx.musicStart('win'); }
  },
  render(g) {
    R(g, 0, 0, 640, 240, '#0b0a20');
    if (this.phase === 'pick') return this.renderPick(g);
    if (this.phase === 'final') return this.renderFinal(g);
    const gp = this.guardP, gx = gp === 0 ? 0 : 320, mx = gp === 0 ? 320 : 0;
    if (this.night) { this.night.render(g, gx, 0); this.renderMonPane(g, mx); }
    R(g, 318, 0, 4, 240, '#000');
    Txt.draw(g, 'J' + (gp + 1) + ' GUARDIA', gx + 160, 2, { align: 'c', color: '#3ae07a', shadow: '#000' });
    Txt.draw(g, 'J' + (this.monP + 1) + ' MONSTRUO', mx + 160, 2, { align: 'c', color: '#e0382f', shadow: '#000' });
    if (this.fade > 0) { g.fillStyle = 'rgba(0,0,0,' + this.fade + ')'; g.fillRect(0, 0, 640, 240); }
    if (this.phase === 'roundEnd' || this.phase === 'over') this.renderRoundEnd(g);
    if (this.paused) { g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, 640, 240); Txt.draw(g, 'PAUSA', 320, 90, { s: 4, align: 'c', color: '#ffd23f' }); Txt.draw(g, 'ENTER: SEGUIR   ESC: SALIR', 320, 140, { align: 'c', color: '#fff' }); }
  },
  renderMonPane(g, ox) {
    const m = this.mon, nt = this.night, ch = VCHARS[m.id], ms = MSCHEMES[this.monP === 0 ? 'p1' : 'p2'];
    g.save(); g.translate(ox, 0); g.beginPath(); g.rect(0, 0, 320, 240); g.clip();
    R(g, 0, 0, 320, 240, '#14102a'); R(g, 0, 0, 320, SH, '#1c1838');
    for (let y = 0; y < SH; y += 8) R(g, 0, y, 320, 1, '#201c40');
    for (const [a, b] of EDGES) { const p = npos(a), q = npos(b); Art.L(g, p.x, p.y, q.x, q.y, '#3a3070', 2); }
    for (const id in NODES) {
      const p = npos(id), here = id === m.place, gw = nt.watching(id);
      const near = !m.atk && m.stun <= 0 && nbrs(m.place).includes(id);
      R(g, p.x - 33, p.y - 14, 66, 28, '#000'); R(g, p.x - 32, p.y - 13, 64, 26, gw ? '#e0a020' : here ? '#e0382f' : near ? '#6a5ad0' : '#3a3070'); R(g, p.x - 30, p.y - 11, 60, 22, here ? '#4a1018' : '#241e4e');
      Txt.draw(g, NODES[id].n, p.x, p.y + 3, { align: 'c', color: gw ? '#ffd23f' : '#c9c0ff' });
      if (gw) Txt.draw(g, 'OJO', p.x, p.y - 10, { align: 'c', color: '#ffd23f' });
    }
    const hp = npos(m.place); g.drawImage(Art.mon(m.id, !!m.atk), hp.x - 12, hp.y - 52 + Math.sin(G.t * 6), 24, 36);
    if (m.atk) { Txt.draw(g, 'ATACANDO ' + Math.ceil(m.atk.t * 10) / 10, hp.x, hp.y - 62, { align: 'c', color: '#ff6060', shadow: '#000' }); }
    // guardia (cuarto)
    R(g, 168, 134, 62, 36, '#000'); R(g, 169, 135, 60, 34, '#3a6a3a'); R(g, 171, 137, 56, 30, '#1a3a22'); Txt.draw(g, 'CUARTO', 199, 143, { align: 'c', color: '#9fffb8' }); Txt.draw(g, 'DE RICHI', 199, 154, { align: 'c', color: '#9fffb8' });
    R(g, 162, 136, 4, 32, nt.door.L ? '#e03030' : '#2a6a2a'); R(g, 232, 136, 4, 32, nt.door.R ? '#e03030' : '#2a6a2a');
    if (nt.cam) Txt.draw(g, 'GUARDIA EN CAMARAS', 199, 172, { align: 'c', color: '#ffd23f' });
    // HUD monstruo
    R(g, 0, SH, 320, 60, '#120e26'); R(g, 0, SH, 320, 2, '#8a2a2a');
    Txt.draw(g, Art.MONS[m.id].short, 6, SH + 7, { color: Art.MONS[m.id].color });
    Txt.draw(g, 'ENERGIA GUARDIA ' + Math.ceil(nt.power) + '%', 314, SH + 7, { align: 'r', color: nt.power > 25 ? '#3ae07a' : '#e03030' });
    const bar = (x, y, w, label, v, col) => { Txt.draw(g, label, x, y, { color: '#d8d0ff' }); R(g, x, y + 10, w, 6, '#2a2248'); R(g, x, y + 10, Math.round(w * clamp(v, 0, 1)), 6, col); };
    bar(6, SH + 22, 90, ms.labM + ' MOVER', 1 - Math.max(0, m.cd) / (ch.move * 1.7), '#6a5ad0');
    bar(106, SH + 22, 100, '[' + ms.labA + '] ATACAR', (m.place === 'PIzq' || m.place === 'PDer') && m.stun <= 0 && !m.atk ? 1 : 0, '#e0382f');
    bar(216, SH + 22, 98, '[' + ms.labB + '] ' + ch.ab, 1 - Math.max(0, m.abCd) / ch.cd, '#ffd23f');
    const status = m.stun > 0 ? 'ATURDIDO ' + Math.ceil(m.stun) : m.hidden ? 'INVISIBLE ' + Math.ceil(m.sneak) : m.seen ? 'TE ESTAN VIENDO!' : (m.place === 'PIzq' || m.place === 'PDer') ? 'LLEGASTE A LA PUERTA!' : 'VE HACIA UNA PUERTA';
    Txt.draw(g, status, 160, SH + 47, { align: 'c', color: m.stun > 0 ? '#ff6060' : m.seen ? '#ffd23f' : '#9a8fd0' });
    g.restore();
  },
  renderPick(g) {
    g.drawImage(Art.menuBg, 0, 0, 320, 240, 160, 0, 320, 240); R(g, 0, 0, 640, 240, 'rgba(0,0,0,0.6)');
    const mp = this.monP, gp = this.guardP, ms = MSCHEMES[mp === 0 ? 'p1' : 'p2'];
    Txt.draw(g, 'RONDA ' + (this.round + 1) + ' DE 2', 320, 8, { s: 2, align: 'c', color: '#ffd23f', shadow: '#000' });
    Txt.draw(g, 'JUGADOR ' + (gp + 1) + ' ES EL GUARDIA', 320, 32, { align: 'c', color: '#3ae07a' });
    Txt.draw(g, 'JUGADOR ' + (mp + 1) + ': ELIGE TU MONSTRUO (' + (mp === 0 ? 'A D' : 'FLECHAS') + ' + ' + ms.labA + ')', 320, 46, { align: 'c', color: '#ff7ab8' });
    VIDS.forEach((id, i) => {
      const x = 80 + i * 160, sel = i === this.pick, mi = Art.MONS[id], ch = VCHARS[id];
      panel(g, x - 66, 64, 132, 150, sel ? '#2a1c58' : '#14102a', sel ? '#ffd23f' : '#4a3a8a');
      drawMonster(g, id, x, 130, 1.6, sel ? Math.sin(G.t * 5) * 3 : 0);
      Txt.draw(g, mi.short, x, 72, { align: 'c', color: mi.color });
      Txt.draw(g, ch.ab, x, 140, { align: 'c', color: '#ffd23f' }); Txt.wrap(ch.abd, 120).forEach((l, k) => Txt.draw(g, l, x, 153 + k * 10, { align: 'c', color: '#d8d0ff' }));
      Txt.draw(g, 'VELOCIDAD ' + (ch.move < 1.1 ? 'ALTA' : ch.move < 1.4 ? 'MEDIA' : 'BAJA'), x, 192, { align: 'c', color: '#9a8fd0' });
    });
    Txt.draw(g, 'ESC: VOLVER', 320, 226, { align: 'c', color: '#8a7fe0' });
  },
  renderRoundEnd(g) {
    g.fillStyle = 'rgba(0,0,0,0.82)'; g.fillRect(0, 0, 640, 240); const gp = this.guardP, o = this.over || {};
    if (o.surv) { Txt.draw(g, '6:00 AM', 320, 40, { s: 4, align: 'c', color: '#ffd23f', shadow: '#c8501a' }); Txt.draw(g, 'EL GUARDIA (JUGADOR ' + (gp + 1) + ') SOBREVIVIO', 320, 90, { s: 1, align: 'c', color: '#3ae07a' }); }
    else { Txt.draw(g, 'ATRAPADO!', 320, 40, { s: 4, align: 'c', color: '#e03030', shadow: '#300' }); Txt.draw(g, 'EL MONSTRUO (JUGADOR ' + (this.monP + 1) + ') GANA LA RONDA', 320, 90, { align: 'c', color: '#ff7ab8' }); }
    Txt.draw(g, 'TIEMPO COMO GUARDIA: ' + fmtTime(this.times[gp]) + (o.surv ? '  ENERGIA: ' + Math.ceil(this.powers[gp]) + '%' : ''), 320, 112, { align: 'c', color: '#fff' });
    if ((G.t * 2 | 0) % 2 === 0) Txt.draw(g, this.round === 0 ? 'ENTER: SIGUIENTE RONDA (CAMBIO DE ROLES)' : 'ENTER: VER RESULTADO FINAL', 320, 200, { align: 'c', color: '#ffd23f' });
  },
  renderFinal(g) {
    g.drawImage(Art.menuBg, 0, 0, 320, 240, 160, 0, 320, 240); R(g, 0, 0, 640, 240, 'rgba(0,0,0,0.6)');
    const [a, b] = this.times, sa = this.surv[0], sb = this.surv[1];
    let w = -1; if (sa && !sb) w = 0; else if (sb && !sa) w = 1; else if (a !== b && !(sa && sb)) w = a > b ? 0 : 1; else if (sa && sb) w = this.powers[0] === this.powers[1] ? -1 : this.powers[0] > this.powers[1] ? 0 : 1;
    Txt.draw(g, w < 0 ? 'EMPATE!' : 'GANA EL JUGADOR ' + (w + 1) + '!', 320, 14, { s: 4, align: 'c', color: '#ffd23f', outline: '#1a0f1f', shadow: '#c8501a' });
    [0, 1].forEach(p => { const x = 40 + p * 300; panel(g, x, 70, 260, 90, w === p ? '#2a1c58' : '#14102a', w === p ? '#ffd23f' : '#4a3a8a'); Txt.draw(g, 'JUGADOR ' + (p + 1), x + 130, 80, { align: 'c', s: 2, color: '#fff' }); Txt.draw(g, 'COMO GUARDIA:', x + 130, 106, { align: 'c', color: '#c9a6ff' }); Txt.draw(g, this.surv[p] ? 'SOBREVIVIO (' + Math.ceil(this.powers[p]) + '% ENERGIA)' : 'ATRAPADO A LAS ' + fmtTime(this.times[p]), x + 130, 120, { align: 'c', color: this.surv[p] ? '#3ae07a' : '#ff6060' }); });
    Txt.draw(g, 'ENTER: REVANCHA   ESC: MENU', 320, 200, { align: 'c', color: '#ffd23f' });
  },
};
function fmtTime(t) { const nt = Vs.night, hs = nt ? nt.hourSec : 25, h = Math.floor(t / hs), m = Math.floor((t % hs) / hs * 60); return (h === 0 ? 12 : h) + ':' + String(m).padStart(2, '0') + ' AM'; }

// =====================================================
//  ENTRADA Y BUCLE
// =====================================================
function toLocal(e) { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height]; }
function firstInput() { if (!G.started) { G.started = true; Sfx.init(); if (G.scene === Menu) Sfx.musicStart('menu'); return true; } Sfx.init(); return false; }
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  if (e.repeat) return; G.keys[e.code] = true; const first = firstInput();
  if (first && G.scene === Menu) return;
  G.scene.keydown && G.scene.keydown(e.code);
});
addEventListener('keyup', e => { G.keys[e.code] = false; });
addEventListener('blur', () => { G.keys = {}; if (G.scene && G.scene.pointerUp) G.scene.pointerUp(); });
canvas.addEventListener('pointerdown', e => { const first = firstInput(); if (first && G.scene === Menu) return; const [x, y] = toLocal(e); G.scene.pointer && G.scene.pointer(x, y); e.preventDefault(); });
addEventListener('pointerup', () => { G.scene.pointerUp && G.scene.pointerUp(); });

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; G.t += dt;
  const s = G.scene; if (s.update) s.update(dt);
  ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  s.render(ctx);
  requestAnimationFrame(loop);
}
window.__G = G; window.__scenes = { Menu, Play, Vs, VsIntro, Jump, GameOver, Win, Rules, StorySelect, NightIntro, Cutscene }; window.__setScene = setScene; window.__save = save;
setScene(Menu);
requestAnimationFrame(loop);
