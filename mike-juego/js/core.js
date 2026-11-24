'use strict';
// ===== Núcleo: canvas, utilidades, entrada, sonido y música =====
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

// ----- Entrada -----
const keys = {}, pressed = {};
const K = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  atk: ['KeyJ', 'KeyX', 'Space'], dash: ['ShiftLeft', 'ShiftRight', 'KeyL', 'KeyC', 'KeyK'],
  talk: ['KeyE'], ok: ['Enter', 'Space', 'KeyJ', 'KeyE', 'KeyZ', 'KeyX']
};
const isDown = (...c) => c.flat().some(k => keys[k]);
const wasPressed = (...c) => c.flat().some(k => pressed[k]);
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (!e.repeat) pressed[e.code] = true;
  keys[e.code] = true;
  AUDIO.unlock();
  if (e.code === 'KeyM' && !e.repeat) AUDIO.setMute(!AUDIO.mute);
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.querySelectorAll('#touch button').forEach(b => {
  const code = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); AUDIO.unlock(); keys[code] = true; pressed[code] = true; });
  const up = e => { e.preventDefault(); keys[code] = false; };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
});

// ----- Audio -----
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const AUDIO = {
  c: null, master: null, mus: null, mute: false, noiseBuf: null,
  unlock() {
    if (!this.c) {
      try {
        this.c = new (window.AudioContext || window.webkitAudioContext)();
        const comp = this.c.createDynamicsCompressor(); comp.connect(this.c.destination);
        this.master = this.c.createGain(); this.master.gain.value = this.mute ? 0 : .9; this.master.connect(comp);
        this.mus = this.c.createGain(); this.mus.gain.value = .55; this.mus.connect(this.master);
        const n = this.c.sampleRate, b = this.c.createBuffer(1, n, n), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = b;
      } catch (e) { this.c = null; }
    }
    if (this.c && this.c.state === 'suspended') this.c.resume();
  },
  setMute(m) { this.mute = m; if (this.master) this.master.gain.value = m ? 0 : .9; },
  toneAt(t, f, d, type = 'square', v = .05, slide = 0, bus) {
    if (!this.c) return;
    const o = this.c.createOscillator(), g = this.c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(bus || this.master); o.start(t); o.stop(t + d + .03);
  },
  tone(f, d, type, v, slide, delay = 0) { if (this.c && !this.mute) this.toneAt(this.c.currentTime + delay, f, d, type, v, slide); },
  noiseAt(t, d, v, hp = 1000, bus) {
    if (!this.c) return;
    const s = this.c.createBufferSource(); s.buffer = this.noiseBuf;
    const fl = this.c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = hp;
    const g = this.c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(bus || this.master); s.start(t, Math.random() * .5); s.stop(t + d + .02);
  },
  noise(d, v, hp) { if (this.c && !this.mute) this.noiseAt(this.c.currentTime, d, v, hp); }
};
const sfx = {
  swing() { AUDIO.tone(480, .11, 'sawtooth', .035, -320); AUDIO.noise(.08, .05, 3000); },
  hit() { AUDIO.tone(170, .12, 'square', .07, -100); AUDIO.noise(.1, .08, 1500); },
  hurt() { AUDIO.tone(240, .28, 'sawtooth', .08, -170); AUDIO.noise(.18, .06, 600); },
  dia() { [659, 880, 1175, 1568].forEach((f, i) => AUDIO.tone(f, .16, 'square', .045, 0, i * .07)); AUDIO.tone(2093, .5, 'sine', .03, 0, .3); },
  heal() { [523, 659, 784, 1046].forEach((f, i) => AUDIO.tone(f, .14, 'triangle', .07, 0, i * .08)); },
  bark() { AUDIO.tone(320, .09, 'square', .05, -140); AUDIO.tone(270, .11, 'square', .05, -140, .11); },
  dash() { AUDIO.tone(760, .15, 'triangle', .06, -500); AUDIO.noise(.12, .05, 2500); },
  blip() { AUDIO.tone(rnd(430, 580), .035, 'square', .018); },
  boss() { AUDIO.tone(110, .5, 'sawtooth', .07, -50); AUDIO.tone(82, .6, 'sawtooth', .07, -30, .15); },
  slam() { AUDIO.tone(95, .35, 'square', .1, -55); AUDIO.noise(.3, .12, 200); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => AUDIO.tone(f, .22, 'square', .05, 0, i * .12)); },
  door() { AUDIO.tone(110, .4, 'triangle', .09, 60); AUDIO.noise(.35, .06, 300); },
  step() { AUDIO.noise(.04, .015, 1200); },
  pop() { AUDIO.tone(500, .08, 'sine', .06, 500); }
};

// --- Secuenciador de música (bajo, arpegio, melodía y batería) ---
const SONGS = {
  title: {
    bpm: 78, lead: 'triangle', arp: 'sine', drums: 0, leadVol: .07,
    chords: [[43, [0, 4, 7]], [40, [0, 3, 7]], [36, [0, 4, 7]], [38, [0, 4, 7]]],
    melody: [
      74, null, null, null, 71, null, null, null, 67, null, null, null, 71, null, 74, null,
      72, null, null, null, 71, null, null, null, 67, null, null, null, 64, null, null, null,
      72, null, null, null, 76, null, null, null, 79, null, null, null, 76, null, 72, null,
      74, null, null, null, 78, null, 74, null, 71, null, null, null, null, null, null, null]
  },
  day: {
    bpm: 128, lead: 'square', arp: 'triangle', drums: 2, leadVol: .045,
    chords: [[48, [0, 4, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]], [43, [0, 4, 7]]],
    melody: [
      72, null, 76, null, 79, null, 76, null, 72, null, 76, null, 79, 79, 76, null,
      69, null, 72, null, 76, null, 72, null, 69, null, 72, null, 76, 76, 72, null,
      65, null, 69, null, 72, null, 69, null, 65, null, 69, 72, 77, null, 72, null,
      67, null, 71, null, 74, null, 71, null, 67, 71, 74, 77, 79, null, null, null]
  },
  dream: {
    bpm: 96, lead: 'triangle', arp: 'sine', drums: 1, leadVol: .06,
    chords: [[45, [0, 3, 7, 10]], [41, [0, 4, 7, 11]], [48, [0, 4, 7, 11]], [43, [0, 4, 7, 10]]],
    melody: [
      76, null, null, null, 72, null, null, null, 74, null, null, null, 76, null, null, null,
      77, null, null, null, 76, null, 72, null, 69, null, null, null, null, null, null, null,
      79, null, null, null, 76, null, 72, null, 76, null, null, null, 74, null, 72, null,
      71, null, 74, null, 79, null, null, null, 76, null, null, null, null, null, null, null]
  },
  boss: {
    bpm: 150, lead: 'sawtooth', arp: 'square', drums: 3, leadVol: .04,
    chords: [[38, [0, 3, 7]], [34, [0, 4, 7]], [36, [0, 4, 7]], [33, [0, 4, 7]]],
    melody: [
      74, null, 74, 77, null, 74, null, 72, 74, null, 77, null, 81, null, 79, 77,
      70, null, 70, 74, null, 70, null, 69, 70, null, 74, null, 77, null, 76, 74,
      72, null, 72, 76, null, 72, null, 70, 72, null, 76, null, 79, null, 77, 76,
      69, null, 73, null, 76, null, 81, null, 80, null, 76, null, 73, null, 69, null]
  }
};
const SEQ = { name: 'none', song: null, step: 0, next: 0 };
function setMusic(n) { if (n === SEQ.name) return; SEQ.name = n; SEQ.song = SONGS[n] || null; SEQ.step = 0; SEQ.next = 0; }
function playStep(sg, step, t) {
  const A = AUDIO, bar = Math.floor(step / 16) % 4, s = step % 16, ch = sg.chords[bar], root = ch[0], iv = ch[1];
  const bus = A.mus, sd = 60 / sg.bpm / 4;
  // bajo
  if (sg.drums >= 2) { if (s % 4 === 0 || s === 6 || s === 14) A.toneAt(t, mtof(root - 12 + (s === 6 || s === 14 ? 12 : 0)), sd * 3, 'triangle', .13, 0, bus); }
  else if (s % 8 === 0) A.toneAt(t, mtof(root - 12), sd * 7, 'triangle', .12, 0, bus);
  // arpegio
  const arpStep = sg.drums >= 2 ? 1 : 2;
  if (s % arpStep === 0) { const n = iv[(s / arpStep) % iv.length]; A.toneAt(t, mtof(root + 12 + n), sd * 1.6, sg.arp, .03, 0, bus); }
  // melodía
  const m = sg.melody[step % 64];
  if (m != null) { A.toneAt(t, mtof(m), sd * 2.6, sg.lead, sg.leadVol, 0, bus); if (sg.drums === 0 || sg.lead === 'triangle') A.toneAt(t, mtof(m + .12), sd * 2.6, 'sine', sg.leadVol * .5, 0, bus); }
  // batería
  if (sg.drums >= 1) {
    if (s === 0 || (sg.drums >= 2 && s === 8) || (sg.drums >= 3 && (s === 6 || s === 14))) { A.toneAt(t, 140, .13, 'sine', .22, -100, bus); }
    if (sg.drums >= 2 && (s === 4 || s === 12)) { A.noiseAt(t, .12, .09, 1500, bus); A.toneAt(t, 190, .08, 'triangle', .05, -60, bus); }
    if (sg.drums === 1 && s === 8) A.noiseAt(t, .09, .035, 3000, bus);
    if ((sg.drums >= 2 && s % 2 === 0) || (sg.drums === 3 && s % 2 === 1) || (sg.drums === 1 && s % 4 === 2)) A.noiseAt(t, .03, sg.drums === 3 ? .03 : .022, 8000, bus);
  }
}
function musicTick() {
  const A = AUDIO; if (!A.c || A.mute || !SEQ.song) return;
  const c = A.c; if (SEQ.next < c.currentTime) SEQ.next = c.currentTime + .06;
  const sd = 60 / SEQ.song.bpm / 4;
  while (SEQ.next < c.currentTime + .18) { playStep(SEQ.song, SEQ.step, SEQ.next); SEQ.next += sd; SEQ.step++; }
}
setInterval(musicTick, 40);
function updateMusic() { }

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
