'use strict';
// ===== Núcleo: canvas, utilidades, entrada (joystick + 2 botones), sonido y música =====
let W = 960; const H = 540, T = 48;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
cv.width = W; cv.height = H;
ctx.imageSmoothingEnabled = false;
function fit() {
  const asp = innerWidth / innerHeight, nw = Math.max(720, Math.min(1300, Math.round(H * asp / 2) * 2));
  if (nw !== W) { W = nw; cv.width = W; try { if (GL.ok) { GL.r.setSize(Math.round(W * .6667), Math.round(H * .6667), false); GL.cam.aspect = W / H; GL.cam.updateProjectionMatrix(); } } catch (e) { } }
  const s = Math.min(innerWidth / W, innerHeight / H);
  const w = Math.round(W * s) + 'px', h = Math.round(H * s) + 'px', wr = document.getElementById('wrap'), gl = document.getElementById('gl');
  cv.style.width = w; cv.style.height = h;
  if (gl) { gl.style.width = w; gl.style.height = h; }
  if (wr) { wr.style.width = w; wr.style.height = h; }
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();

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
function applyTouchVisibility() { const t = document.getElementById('touch'); if (t) t.classList.toggle('off', !SETTINGS.touch); }

// ----- Entrada: teclado, joystick y dos botones (ACTUAR / ATACAR) -----
const keys = {}, pressed = {};
const JOY = { x: 0, y: 0, active: false, dirs: {} };
const PTR = { x: 0, y: 0, hit: false, tap: false, down: false, drag: false, ly: 0, sy0: 0, mv: 0 };
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
  const r = cv.getBoundingClientRect(); PTR.x = (e.clientX - r.left) * W / r.width; PTR.y = (e.clientY - r.top) * H / r.height; PTR.hit = true; PTR.down = true; PTR.drag = false; PTR.ly = PTR.y; PTR.sy0 = PTR.y; PTR.mv = 0;
});
cv.addEventListener('pointermove', e => { if (!PTR.down) return; const r = cv.getBoundingClientRect(), y = (e.clientY - r.top) * H / r.height; PTR.mv += y - PTR.ly; PTR.ly = y; if (Math.abs(y - PTR.sy0) > 12) PTR.drag = true; });
const ptrUp = e => { if (!PTR.down) return; PTR.down = false; const r = cv.getBoundingClientRect(); PTR.x = (e.clientX - r.left) * W / r.width; PTR.y = (e.clientY - r.top) * H / r.height; if (!PTR.drag) PTR.tap = true; };
cv.addEventListener('pointerup', ptrUp); cv.addEventListener('pointercancel', () => { PTR.down = false; });
cv.addEventListener('wheel', e => { if (typeof MENU !== 'undefined' && MENU.open) { MENU.scroll = (MENU.scroll || 0) + e.deltaY * .6; e.preventDefault(); } }, { passive: false });
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
        const lp = this.c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = .5; lp.connect(comp);
        this.master = this.c.createGain(); this.master.gain.value = .7; this.master.connect(lp);
        this.mus = this.c.createGain(); this.mus.connect(this.master);
        const len = Math.floor(this.c.sampleRate * 2.4), imp = this.c.createBuffer(2, len, this.c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = imp.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
        const cvb = this.c.createConvolver(); cvb.buffer = imp; this.revIn = this.c.createGain(); this.revIn.gain.value = .34; this.mus.connect(this.revIn); this.revIn.connect(cvb); cvb.connect(this.master);
        this.sfxBus = this.c.createGain(); this.sfxBus.connect(this.master);
        const n = this.c.sampleRate, b = this.c.createBuffer(1, n, n), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = b; this.setVol();
      } catch (e) { this.c = null; }
    }
    if (this.c && this.c.state === 'suspended') this.c.resume();
  },
  setVol() { if (!this.c) return; this.mus.gain.value = SETTINGS.music / 10 * .95; this.sfxBus.gain.value = SETTINGS.sfx / 10 * .6; },
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
// Voces de los personajes (blips por letra, como Undertale / Deltarune)
const VOICES = {
  mike: { f: 560, v: 90, type: 'triangle', len: .05, g: .05 }, willy: { f: 310, v: 40, type: 'square', len: .06, g: .04, gl: -90 },
  ambrosio: { f: 430, v: 130, type: 'square', len: .045, g: .035 }, trolino: { f: 150, v: 30, type: 'sawtooth', len: .06, g: .04 },
  timba: { f: 300, v: 30, type: 'triangle', len: .1, g: .16, gl: -60 }, rius: { f: 900, v: 220, type: 'square', len: .035, g: .03 },
  mayo: { f: 700, v: 0, type: 'square', len: .05, g: .03, steps: [500, 700, 900, 620] }, esparta: { f: 470, v: 45, type: 'sine', len: .085, g: .09, gl: 30 },
  raptor: { f: 640, v: 150, type: 'triangle', len: .035, g: .05 }, invictor: { f: 760, v: 150, type: 'triangle', len: .04, g: .075, gl: 120 },
  acenix: { f: 880, v: 40, type: 'sine', len: .09, g: .06, gl: 260 }, aquela: { f: 690, v: 60, type: 'sine', len: .06, g: .06 },
  exe: { f: 105, v: 15, type: 'sawtooth', len: .08, g: .05, det: 1.06 }, narr: null, default: { f: 400, v: 120, type: 'square', len: .04, g: .03 }
};
let voiceStep = 0;
const sfx = {
  voice(id, seed) {
    const v = id in VOICES ? VOICES[id] : VOICES.default; if (!v || !AUDIO.c) return;
    const f = v.steps ? v.steps[(voiceStep++) % v.steps.length] : v.f + (((seed || voiceStep++) * 9301 + 49297) % 233280 / 233280 * 2 - 1) * v.v;
    AUDIO.tone(f, v.len, v.type, v.g, v.gl || 0); if (v.det) AUDIO.tone(f * v.det, v.len, v.type, v.g * .7, v.gl || 0);
  },
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
  key() { [784, 988, 1319, 1568].forEach((f, i) => AUDIO.tone(f, .13, 'triangle', .06, 0, i * .06)); AUDIO.tone(2637, .4, 'sine', .03, 0, .25); },
  unlock() { AUDIO.tone(180, .08, 'square', .05); AUDIO.tone(140, .25, 'sawtooth', .05, -60, .08); AUDIO.noise(.3, .06, 400); },
  squish() { AUDIO.tone(220, .09, 'sine', .05, -120); AUDIO.noise(.05, .025, 500); },
  poof() { AUDIO.noise(.25, .09, 700); AUDIO.tone(300, .2, 'triangle', .05, -220); },
  whoosh() { AUDIO.noise(.22, .06, 1800); AUDIO.tone(400, .2, 'sine', .03, 600); },
  portal() { [262, 392, 523, 659, 784, 1046].forEach((f, i) => AUDIO.tone(f, .5, 'sine', .05, 0, i * .08)); AUDIO.noise(.6, .04, 3000); },
  flap() { AUDIO.noise(.05, .02, 2500); },
  low() { AUDIO.tone(330, .1, 'square', .04); AUDIO.tone(262, .14, 'square', .04, 0, .14); },
  start() { [392, 523, 659, 784, 1046].forEach((f, i) => AUDIO.tone(f, .2, 'triangle', .06, 0, i * .09)); }
};

// --- Instrumentos sintetizados ---
function ens() { return AUDIO.c; }
const INST = {
  pluck(t, f, d, v, bus) { const c = ens(), o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(Math.min(f * 8, 9000), t); fl.frequency.exponentialRampToValueAtTime(Math.max(f * 1.4, 200), t + d); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + d + .05); },
  flute(t, f, d, v, bus) {
    const c = ens(), o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2; lfo.frequency.value = 5.2; lg.gain.value = f * .007; lfo.connect(lg); lg.connect(o.frequency);
    const g2 = c.createGain(); g2.gain.value = .22; o2.connect(g2); g2.connect(g);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.07, d * .4)); g.gain.setValueAtTime(v * .85, t + d * .7); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(bus); [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + d + .05); });
  },
  bell(t, f, d, v, bus) { const c = ens(); [[1, 1], [2.01, .38], [3.02, .16], [4.2, .07]].forEach(([m, a]) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * m; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v * a, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d * (1.4 - m * .1)); o.connect(g); g.connect(bus); o.start(t); o.stop(t + d * 1.5 + .05); }); },
  pad(t, f, d, v, bus) {
    const c = ens(), g = c.createGain(), fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = Math.min(f * 3.2, 2600);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.7, d * .35)); g.gain.setValueAtTime(v, t + d * .65); g.gain.linearRampToValueAtTime(.0001, t + d);
    [-7, 7].forEach(det => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(fl); o.start(t); o.stop(t + d + .05); }); fl.connect(g); g.connect(bus);
  },
  strings(t, f, d, v, bus) { INST.pad(t, f, d, v * .9, bus); },
  bass(t, f, d, v, bus) { const c = ens(), o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f / 2; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); o2.connect(g); g.connect(bus); o.start(t); o2.start(t); o.stop(t + d + .05); o2.stop(t + d + .05); },
  brass(t, f, d, v, bus) { const c = ens(), o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 1.6, t); fl.frequency.linearRampToValueAtTime(f * 5, t + .08); fl.frequency.exponentialRampToValueAtTime(f * 2.2, t + d); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .03); g.gain.setValueAtTime(v * .8, t + d * .6); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + d + .05); },
  kick(t, v, bus) { AUDIO.toneAt(t, 150, .16, 'sine', v, -110, bus); },
  snare(t, v, bus) { AUDIO.noiseAt(t, .13, v, 1600, bus); AUDIO.toneAt(t, 200, .09, 'triangle', v * .5, -80, bus); },
  hat(t, v, bus) { AUDIO.noiseAt(t, .03, v, 8000, bus); },
  tom(t, f, v, bus) { AUDIO.toneAt(t, f, .2, 'sine', v, -f * .5, bus); }
};
const CHORDS = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10] };
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteMidi(s) { const m = /^([A-G])([#b]?)(\d)$/.exec(s); if (!m) return null; return 12 * (parseInt(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
function parseMelody(str, bars) {
  const toks = str.replace(/\|/g, ' ').trim().split(/\s+/), steps = new Array(bars * 16).fill(null);
  let last = -1;
  toks.forEach((t, i) => { const s = i * 2; if (t === '-') { if (last >= 0) steps[last].len += 2; } else if (t === '.') { last = -1; } else { const m = noteMidi(t); if (m != null) { steps[s] = { m, len: 2 }; last = s; } } });
  return steps;
}
const SONGS = {
  title: {
    bpm: 84, lead: 'flute', leadVol: .1, pad: 'strings', padVol: .03, bass: 'pluck', arp: 'pluck', arpVol: .02, perc: 'none',
    chords: [[38, 'M'], [45, 'M'], [47, 'm'], [43, 'M'], [38, 'M'], [45, 'M'], [43, 'M'], [45, 'M']],
    melody: 'D5 - F#5 - A5 - G5 F#5 | E5 - A5 - C#6 - B5 A5 | D5 - F#5 - B5 - A5 F#5 | G5 - B5 - D6 - B5 A5 | F#5 - A5 - D6 - C#6 B5 | A5 - E5 - C#5 - E5 A5 | B5 - D6 - G6 - F#6 D6 | C#6 - E6 - A5 - . .'
  },
  story: {
    bpm: 72, lead: 'flute', leadVol: .085, pad: 'pad', padVol: .028, bass: 'bass', arp: 'pluck', arpVol: .022, perc: 'none',
    chords: [[41, 'M'], [38, 'm'], [46, 'M'], [48, 'M'], [41, 'M'], [38, 'm'], [46, 'M'], [48, '7']],
    melody: 'A5 - C6 - F6 - E6 C6 | D6 - F6 - A6 - G6 F6 | D6 - F6 - Bb5 - D6 F6 | C6 - E6 - G6 - E6 C6 | A5 - C6 - A5 - F5 . | A5 - D6 - F6 - D6 A5 | G5 - Bb5 - D6 - C6 Bb5 | A5 - G5 - E5 - . .'
  },
  day: {
    bpm: 112, lead: 'pluck', leadVol: .085, pad: 'strings', padVol: .014, bass: 'pluck', arp: null, perc: 'folk',
    chords: [[43, 'M'], [40, 'm'], [48, 'M'], [50, 'M'], [43, 'M'], [40, 'm'], [48, 'M'], [50, 'M']],
    melody: 'G5 B5 D6 B5 G5 B5 D6 . | E5 G5 B5 G5 E5 G5 B5 . | C6 B5 A5 G5 E5 G5 C6 . | D6 C6 B5 A5 F#5 A5 D6 . | B5 - D6 - G6 - D6 B5 | G5 - B5 - E6 - D6 B5 | E6 - D6 - C6 - B5 G5 | A5 - F#5 - A5 D6 - -'
  },
  dream: {
    bpm: 88, lead: 'bell', leadVol: .09, pad: 'pad', padVol: .03, bass: 'bass', arp: 'bell', arpVol: .022, perc: 'soft',
    chords: [[45, 'm7'], [41, 'M7'], [48, 'M7'], [43, '7'], [45, 'm7'], [41, 'M7'], [48, 'M7'], [43, '7']],
    melody: 'E6 - . C6 - . A5 . | F6 - . C6 - . A5 . | G6 - . E6 - . C6 . | D6 - . B5 - . G5 . | C6 - E6 - A6 - E6 C6 | A5 - C6 - F6 - C6 A5 | E6 - G6 - C7 - G6 E6 | D6 - B5 - G5 - B5 D6'
  },
  city: {
    bpm: 104, lead: 'pluck', leadVol: .09, harm: 'flute', harmVol: .03, pad: 'strings', padVol: .016, bass: 'pluck', arp: 'bell', arpVol: .012, perc: 'folk',
    chords: [[43, 'M'], [40, 'm'], [48, 'M'], [50, 'M'], [43, 'M'], [40, 'm'], [45, 'm'], [50, '7'], [48, 'M'], [43, 'M'], [45, 'm'], [50, 'M'], [48, 'M'], [50, 'M'], [43, 'M'], [43, 'M']],
    melody: 'G5 - B5 D6 - B5 G5 - | E5 - G5 B5 - G5 E5 - | C6 - B5 A5 G5 - E5 G5 | F#5 A5 D6 - C6 A5 F#5 - | G5 - B5 D6 - G6 D6 B5 | E6 - D6 B5 G5 - B5 D6 | C6 - E6 A5 - C6 E6 - | D6 - C6 B5 A5 - F#5 . | E6 - D6 C6 E6 - G6 - | D6 - B5 G5 B5 - D6 - | C6 - E6 - A6 - E6 C6 | D6 - F#6 - A6 - F#6 D6 | E6 G6 E6 C6 E6 G6 C7 - | D6 F#6 D6 A5 D6 F#6 A6 - | B5 - D6 G6 - F#6 E6 D6 | G6 - . . G5 B5 D6 .'
  },
  chase: {
    bpm: 138, lead: 'brass', leadVol: .07, harm: 'pluck', harmVol: .03, pad: 'strings', padVol: .016, bass: 'rock', arp: 'pluck', arpVol: .02, perc: 'rock',
    chords: [[45, 'm'], [41, 'M'], [48, 'M'], [43, 'M'], [45, 'm'], [41, 'M'], [43, 'M'], [40, '7']],
    melody: 'A5 - A5 C6 E6 - C6 A5 | F5 - A5 C6 F6 - C6 A5 | E5 - G5 C6 E6 - C6 G5 | D5 - G5 B5 D6 - B5 G5 | A5 C6 E6 A6 - E6 C6 A5 | A5 C6 F6 A6 - F6 C6 A5 | B5 D6 G6 B6 - G6 D6 B5 | G#5 B5 E6 - G#6 - E6 .'
  },
  boss: {
    bpm: 150, lead: 'brass', leadVol: .075, pad: 'strings', padVol: .016, bass: 'rock', arp: null, perc: 'rock',
    chords: [[40, 'm'], [48, 'M'], [50, 'M'], [47, '7'], [40, 'm'], [48, 'M'], [50, 'M'], [47, '7']],
    melody: 'E5 E5 G5 E5 B5 E5 A5 G5 | C5 C5 E5 C5 G5 C5 F5 E5 | D5 D5 F#5 D5 A5 D5 G5 F#5 | B4 B4 D#5 B4 F#5 B4 A5 F#5 | B5 - A5 G5 E5 - G5 B5 | G5 - F5 E5 C5 - E5 G5 | A5 - G5 F#5 D5 - F#5 A5 | D#6 - B5 F#5 B5 - . .'
  },
  dark: {
    bpm: 66, lead: 'bell', leadVol: .06, pad: 'pad', padVol: .036, bass: 'bass', arp: 'bell', arpVol: .014, perc: 'dark',
    chords: [[36, 'm'], [44, 'M'], [41, 'm'], [43, '7'], [36, 'm'], [44, 'M'], [41, 'm'], [43, '7']],
    melody: 'G5 - . . Eb5 - . . | Ab5 - . . C6 - . . | F5 - . . Ab5 - . . | B5 - . . D6 - Bb5 . | G5 - Eb5 - C5 - . . | Ab5 - C6 - Eb6 - . . | F5 - Ab5 - C6 - Ab5 . | B5 - D6 - G6 - . .'
  }
};
for (const k in SONGS) { const s = SONGS[k]; s.bars = s.chords.length; s.notes = parseMelody(s.melody, s.bars); }
const SEQ = { name: 'none', song: null, step: 0, next: 0 };
const AMB = { mode: null, next: 0 };
function setMusic(n) { if (n === SEQ.name) return; SEQ.name = n; SEQ.song = SONGS[n] || null; SEQ.step = 0; SEQ.next = 0; }
function setAmbient(m) { AMB.mode = m; AMB.next = 0; }
function playStep(sg, step, t) {
  const A = AUDIO, bus = A.mus, sd = 60 / sg.bpm / 4, bar = Math.floor(step / 16) % sg.bars, s = step % 16, ch = sg.chords[bar], root = ch[0], iv = CHORDS[ch[1]];
  const n = sg.notes[step % (sg.bars * 16)];
  if (sg.pad && s === 0) iv.forEach(x => INST[sg.pad](t, mtof(root + 12 + x), sd * 15.6, sg.padVol, bus));
  if (sg.bass === 'pluck') { if (s === 0 || s === 8) INST.pluck(t, mtof(root + (s === 8 ? 7 : 0)), sd * 6, .12, bus); else if (s === 12) INST.pluck(t, mtof(root + 12), sd * 3, .06, bus); }
  else if (sg.bass === 'bass') { if (s === 0) INST.bass(t, mtof(root), sd * 12, .14, bus); if (s === 8) INST.bass(t, mtof(root + 7), sd * 6, .08, bus); }
  else if (sg.bass === 'rock') { if (s % 2 === 0) INST.bass(t, mtof(root + ((s % 8 === 6) ? 12 : 0)), sd * 1.8, .15, bus); }
  if (sg.arp && s % 2 === 0) INST[sg.arp](t, mtof(root + 24 + iv[(s / 2) % iv.length]), sd * 7, sg.arpVol, bus);
  if (n) { INST[sg.lead](t, mtof(n.m), sd * n.len * .96, sg.leadVol, bus); if (sg.harm) INST[sg.harm](t + .012, mtof(n.m - 12), sd * n.len * .9, sg.harmVol, bus); }
  switch (sg.perc) {
    case 'folk': if (s === 0 || s === 8) INST.kick(t, .18, bus); if (s === 4 || s === 12) A.noiseAt(t, .06, .05, 2600, bus); if (s % 2 === 0) INST.hat(t, .012, bus); break;
    case 'soft': if (s === 0) INST.kick(t, .1, bus); if (s === 8) A.noiseAt(t, .1, .02, 4000, bus); if (s % 4 === 2) INST.hat(t, .008, bus); break;
    case 'rock':
      if (s === 0 || s === 6 || s === 8 || s === 14) INST.kick(t, .24, bus); if (s === 4 || s === 12) INST.snare(t, .1, bus);
      if (s % 2 === 0) INST.hat(t, .025, bus); if (bar % 4 === 3 && s >= 12) INST.tom(t, 150 - (s - 12) * 20, .1, bus); break;
    case 'dark': if (s === 0 || s === 3) INST.kick(t, .22, bus); if (s === 8) A.noiseAt(t, .5, .012, 600, bus); break;
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
  while (SEQ.next < c.currentTime + .2) { playStep(SEQ.song, SEQ.step, SEQ.next); SEQ.next += sd; SEQ.step++; }
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
