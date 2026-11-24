'use strict';
// ===== Núcleo: canvas, utilidades, entrada (joystick + 2 botones), sonido y música =====
const W = 960, H = 540, T = 48;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
cv.width = W; cv.height = H;
ctx.imageSmoothingEnabled = false;
function fit() {
  let s = Math.min(innerWidth / W, innerHeight / H);
  if (s >= 2) s = Math.floor(s);
  cv.style.width = Math.round(W * s) + 'px';
  cv.style.height = Math.round(H * s) + 'px';
}
addEventListener('resize', fit); fit();

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
const sign = v => v > 0 ? 1 : v < 0 ? -1 : 0;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function mkRng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) >>> 0; }

// ----- Ajustes guardados -----
const SETTINGS = { music: 7, sfx: 8, touch: true };
try { const o = JSON.parse(localStorage.getItem('mike_ajustes') || '{}'); for (const k in SETTINGS) if (k in o) SETTINGS[k] = o[k]; } catch (e) { }
function saveSettings() { try { localStorage.setItem('mike_ajustes', JSON.stringify(SETTINGS)); } catch (e) { } applyTouchVisibility(); AUDIO.setVol(); }
function applyTouchVisibility() { const t = document.getElementById('touch'); if (t) t.style.display = SETTINGS.touch ? 'flex' : 'none'; }

// ----- Entrada: teclado, joystick y dos botones (ACTUAR / ATACAR) -----
const keys = {}, pressed = {};
const JOY = { x: 0, y: 0, active: false, dirs: {} };
const PTR = { x: 0, y: 0, hit: false };
const K = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  atk: ['KeyJ', 'KeyX', 'Space'], act: ['KeyE', 'KeyK'],
  ok: ['Enter', 'Space', 'KeyJ', 'KeyE', 'KeyZ', 'KeyX', 'KeyK']
};
K.talk = K.act;
const isDown = (...c) => c.flat().some(k => keys[k]);
const wasPressed = (...c) => c.flat().some(k => pressed[k]);
function getMove() {
  if (JOY.active) { const l = Math.hypot(JOY.x, JOY.y), k = Math.min(1, (l - .12) / .75); return [JOY.x / l * k, JOY.y / l * k]; }
  let ix = (isDown(K.right) ? 1 : 0) - (isDown(K.left) ? 1 : 0), iy = (isDown(K.down) ? 1 : 0) - (isDown(K.up) ? 1 : 0);
  const l = Math.hypot(ix, iy); if (l > 0) { ix /= l; iy /= l; } return [ix, iy];
}
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (!e.repeat) pressed[e.code] = true;
  keys[e.code] = true;
  AUDIO.unlock();
  if (e.code === 'KeyM' && !e.repeat) { SETTINGS.music = SETTINGS.music ? 0 : 7; SETTINGS.sfx = SETTINGS.sfx ? 0 : 8; saveSettings(); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; JOY.x = JOY.y = 0; JOY.active = false; });
cv.addEventListener('pointerdown', e => {
  window.focus(); AUDIO.unlock();
  const r = cv.getBoundingClientRect(); PTR.x = (e.clientX - r.left) * W / r.width; PTR.y = (e.clientY - r.top) * H / r.height; PTR.hit = true;
});
function navEdge() {
  const d = { ArrowLeft: JOY.x < -.6, ArrowRight: JOY.x > .6, ArrowUp: JOY.y < -.6, ArrowDown: JOY.y > .6 };
  for (const k in d) { if (d[k] && !JOY.dirs[k]) pressed[k] = true; JOY.dirs[k] = d[k]; }
}
(function setupTouch() {
  const joy = document.getElementById('joy'), knob = document.getElementById('knob');
  if (joy) {
    let pid = null;
    const set = e => {
      const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2 - 20;
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), k = d > R ? R / d : 1; dx *= k; dy *= k;
      knob.style.transform = `translate(${dx}px,${dy}px)`; JOY.x = dx / R; JOY.y = dy / R; JOY.active = Math.hypot(JOY.x, JOY.y) > .14; navEdge();
    };
    joy.addEventListener('pointerdown', e => { e.preventDefault(); pid = e.pointerId; try { joy.setPointerCapture(pid); } catch (x) { } AUDIO.unlock(); set(e); });
    joy.addEventListener('pointermove', e => { if (e.pointerId === pid) set(e); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; JOY.x = JOY.y = 0; JOY.active = false; JOY.dirs = {}; knob.style.transform = ''; };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
  }
  document.querySelectorAll('#touch [data-k]').forEach(b => {
    const code = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); AUDIO.unlock(); keys[code] = true; pressed[code] = true; b.classList.add('on'); });
    const up = e => { e.preventDefault(); keys[code] = false; b.classList.remove('on'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
  });
  const mb = document.getElementById('btnMenu'); if (mb) mb.addEventListener('pointerdown', e => { e.preventDefault(); AUDIO.unlock(); pressed['Escape'] = true; });
  applyTouchVisibility();
})();

// ----- Audio -----
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const AUDIO = {
  c: null, master: null, mus: null, sfxBus: null, noiseBuf: null,
  unlock() {
    if (!this.c) {
      try {
        this.c = new (window.AudioContext || window.webkitAudioContext)();
        const comp = this.c.createDynamicsCompressor(); comp.connect(this.c.destination);
        this.master = this.c.createGain(); this.master.gain.value = .9; this.master.connect(comp);
        this.mus = this.c.createGain(); this.mus.connect(this.master);
        this.sfxBus = this.c.createGain(); this.sfxBus.connect(this.master);
        const n = this.c.sampleRate, b = this.c.createBuffer(1, n, n), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = b; this.setVol();
      } catch (e) { this.c = null; }
    }
    if (this.c && this.c.state === 'suspended') this.c.resume();
  },
  setVol() { if (!this.c) return; this.mus.gain.value = SETTINGS.music / 10 * .95; this.sfxBus.gain.value = SETTINGS.sfx / 10; },
  get mute() { return SETTINGS.music === 0 && SETTINGS.sfx === 0; },
  toneAt(t, f, d, type = 'square', v = .05, slide = 0, bus) {
    if (!this.c) return;
    const o = this.c.createOscillator(), g = this.c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(bus || this.sfxBus); o.start(t); o.stop(t + d + .03);
  },
  tone(f, d, type, v, slide, delay = 0) { if (this.c) this.toneAt(this.c.currentTime + delay, f, d, type, v, slide); },
  noiseAt(t, d, v, hp = 1000, bus) {
    if (!this.c) return;
    const s = this.c.createBufferSource(); s.buffer = this.noiseBuf;
    const fl = this.c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = hp;
    const g = this.c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(bus || this.sfxBus); s.start(t, Math.random() * .5); s.stop(t + d + .02);
  },
  noise(d, v, hp) { if (this.c) this.noiseAt(this.c.currentTime, d, v, hp); }
};
const sfx = {
  swing() { AUDIO.tone(480, .11, 'sawtooth', .035, -320); AUDIO.noise(.08, .05, 3000); },
  hit() { AUDIO.tone(170, .12, 'square', .07, -100); AUDIO.noise(.1, .08, 1500); },
  hurt() { AUDIO.tone(240, .28, 'sawtooth', .08, -170); AUDIO.noise(.18, .06, 600); },
  dia() { [659, 880, 1175, 1568].forEach((f, i) => AUDIO.tone(f, .16, 'square', .045, 0, i * .07)); AUDIO.tone(2093, .5, 'sine', .03, 0, .3); },
  heal() { [523, 659, 784, 1046].forEach((f, i) => AUDIO.tone(f, .14, 'triangle', .07, 0, i * .08)); },
  bark() { AUDIO.tone(320, .09, 'square', .05, -140); AUDIO.tone(270, .11, 'square', .05, -140, .11); },
  blip() { AUDIO.tone(rnd(430, 580), .035, 'square', .018); },
  boss() { AUDIO.tone(110, .5, 'sawtooth', .07, -50); AUDIO.tone(82, .6, 'sawtooth', .07, -30, .15); },
  slam() { AUDIO.tone(95, .35, 'square', .1, -55); AUDIO.noise(.3, .12, 200); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => AUDIO.tone(f, .22, 'square', .05, 0, i * .12)); },
  door() { AUDIO.tone(110, .4, 'triangle', .09, 60); AUDIO.noise(.35, .06, 300); },
  step() { AUDIO.noise(.04, .015, 1200); },
  pop() { AUDIO.tone(500, .08, 'sine', .06, 500); },
  move() { AUDIO.tone(620, .05, 'square', .03); },
  select() { AUDIO.tone(520, .07, 'square', .04); AUDIO.tone(780, .1, 'square', .04, 0, .06); },
  back() { AUDIO.tone(420, .08, 'square', .035, -120); },
  warn() { AUDIO.tone(880, .12, 'sine', .05, 120); },
  start() { [392, 523, 659, 784, 1046].forEach((f, i) => AUDIO.tone(f, .2, 'triangle', .06, 0, i * .09)); }
};

// --- Secuenciador: bajo, arpegio, acordes largos, melodía y batería ---
const SONGS = {
  title: {
    bpm: 78, lead: 'triangle', arp: 'sine', drums: 0, leadVol: .07, pad: true,
    chords: [[43, [0, 4, 7]], [40, [0, 3, 7]], [36, [0, 4, 7]], [38, [0, 4, 7]]],
    melody: [
      74, null, null, null, 71, null, null, null, 67, null, null, null, 71, null, 74, null,
      72, null, null, null, 71, null, null, null, 67, null, null, null, 64, null, null, null,
      72, null, null, null, 76, null, null, null, 79, null, null, null, 76, null, 72, null,
      74, null, null, null, 78, null, 74, null, 71, null, null, null, null, null, null, null]
  },
  day: {
    bpm: 128, lead: 'square', arp: 'triangle', drums: 2, leadVol: .045, pad: false,
    chords: [[48, [0, 4, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]], [43, [0, 4, 7]]],
    melody: [
      72, null, 76, null, 79, null, 76, null, 72, null, 76, null, 79, 79, 76, null,
      69, null, 72, null, 76, null, 72, null, 69, null, 72, null, 76, 76, 72, null,
      65, null, 69, null, 72, null, 69, null, 65, null, 69, 72, 77, null, 72, null,
      67, null, 71, null, 74, null, 71, null, 67, 71, 74, 77, 79, null, null, null]
  },
  dream: {
    bpm: 96, lead: 'triangle', arp: 'sine', drums: 1, leadVol: .06, pad: true,
    chords: [[45, [0, 3, 7, 10]], [41, [0, 4, 7, 11]], [48, [0, 4, 7, 11]], [43, [0, 4, 7, 10]]],
    melody: [
      76, null, null, null, 72, null, null, null, 74, null, null, null, 76, null, null, null,
      77, null, null, null, 76, null, 72, null, 69, null, null, null, null, null, null, null,
      79, null, null, null, 76, null, 72, null, 76, null, null, null, 74, null, 72, null,
      71, null, 74, null, 79, null, null, null, 76, null, null, null, null, null, null, null]
  },
  boss: {
    bpm: 150, lead: 'sawtooth', arp: 'square', drums: 3, leadVol: .04, pad: false,
    chords: [[38, [0, 3, 7]], [34, [0, 4, 7]], [36, [0, 4, 7]], [33, [0, 4, 7]]],
    melody: [
      74, null, 74, 77, null, 74, null, 72, 74, null, 77, null, 81, null, 79, 77,
      70, null, 70, 74, null, 70, null, 69, 70, null, 74, null, 77, null, 76, 74,
      72, null, 72, 76, null, 72, null, 70, 72, null, 76, null, 79, null, 77, 76,
      69, null, 73, null, 76, null, 81, null, 80, null, 76, null, 73, null, 69, null]
  }
};
const SEQ = { name: 'none', song: null, step: 0, next: 0 };
const AMB = { mode: null, next: 0 };
function setMusic(n) { if (n === SEQ.name) return; SEQ.name = n; SEQ.song = SONGS[n] || null; SEQ.step = 0; SEQ.next = 0; }
function setAmbient(m) { AMB.mode = m; AMB.next = 0; }
function playStep(sg, step, t) {
  const A = AUDIO, bar = Math.floor(step / 16) % 4, s = step % 16, ch = sg.chords[bar], root = ch[0], iv = ch[1];
  const bus = A.mus, sd = 60 / sg.bpm / 4;
  if (sg.pad && s === 0) iv.forEach(n => A.toneAt(t, mtof(root + 12 + n), sd * 15, 'sine', .024, 0, bus));
  if (sg.drums >= 2) { if (s % 4 === 0 || s === 6 || s === 14) A.toneAt(t, mtof(root - 12 + (s === 6 || s === 14 ? 12 : 0)), sd * 3, 'triangle', .13, 0, bus); }
  else if (s % 8 === 0) A.toneAt(t, mtof(root - 12), sd * 7, 'triangle', .12, 0, bus);
  const arpStep = sg.drums >= 2 ? 1 : 2;
  if (s % arpStep === 0) { const n = iv[(s / arpStep) % iv.length]; A.toneAt(t, mtof(root + 12 + n), sd * 1.6, sg.arp, .03, 0, bus); }
  const m = sg.melody[step % 64];
  if (m != null) { A.toneAt(t, mtof(m), sd * 2.6, sg.lead, sg.leadVol, 0, bus); A.toneAt(t, mtof(m + .12), sd * 2.6, 'sine', sg.leadVol * .5, 0, bus); }
  if (sg.drums >= 1) {
    if (s === 0 || (sg.drums >= 2 && s === 8) || (sg.drums >= 3 && (s === 6 || s === 14))) A.toneAt(t, 140, .13, 'sine', .22, -100, bus);
    if (sg.drums >= 2 && (s === 4 || s === 12)) { A.noiseAt(t, .12, .09, 1500, bus); A.toneAt(t, 190, .08, 'triangle', .05, -60, bus); }
    if (sg.drums === 1 && s === 8) A.noiseAt(t, .09, .035, 3000, bus);
    if ((sg.drums >= 2 && s % 2 === 0) || (sg.drums === 3 && s % 2 === 1) || (sg.drums === 1 && s % 4 === 2)) A.noiseAt(t, .03, sg.drums === 3 ? .03 : .022, 8000, bus);
  }
}
function ambientTick() {
  const c = AUDIO.c; if (!c || !AMB.mode || c.currentTime < AMB.next) return;
  const t = c.currentTime + .02;
  if (AMB.mode === 'day') { const f = rnd(2400, 3400); for (let i = 0; i < 3; i++) AUDIO.toneAt(t + i * .09, f + i * 260, .07, 'sine', .012, 500, AUDIO.sfxBus); AMB.next = c.currentTime + rnd(1.4, 4); }
  else { for (let i = 0; i < 4; i++) AUDIO.toneAt(t + i * .06, 4300, .035, 'sine', .006, 0, AUDIO.sfxBus); AMB.next = c.currentTime + rnd(.9, 2.6); }
}
function musicTick() {
  const A = AUDIO; if (!A.c) return;
  const c = A.c; ambientTick();
  if (!SEQ.song) return;
  if (SEQ.next < c.currentTime) SEQ.next = c.currentTime + .06;
  const sd = 60 / SEQ.song.bpm / 4;
  while (SEQ.next < c.currentTime + .18) { playStep(SEQ.song, SEQ.step, SEQ.next); SEQ.next += sd; SEQ.step++; }
}
setInterval(musicTick, 40);

// ----- Texto -----
function txt(s, x, y, o = {}) {
  ctx.font = `bold ${o.size || 18}px "Courier New",monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'top';
  if (o.outline !== false) { ctx.lineWidth = o.lw || 4; ctx.strokeStyle = o.oc || '#0a0818'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y);
}
function wrap(s, maxW, size) {
  ctx.font = `bold ${size}px "Courier New",monospace`;
  const out = []; let line = '';
  for (const w of s.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line); return out;
}
