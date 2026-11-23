'use strict';
// ===== Núcleo: canvas, utilidades, entrada, sonido =====
const W = 640, H = 360, T = 32;
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
const aabb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);
const sign = v => v > 0 ? 1 : v < 0 ? -1 : 0;

// ----- Entrada -----
const keys = {}, pressed = {};
const K = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ', 'KeyK'], atk: ['KeyJ', 'KeyX'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyL', 'KeyC'],
  talk: ['KeyE'], ok: ['Enter', 'Space', 'KeyJ', 'KeyE', 'KeyZ', 'KeyX', 'KeyK']
};
const isDown = (...c) => c.flat().some(k => keys[k]);
const wasPressed = (...c) => c.flat().some(k => pressed[k]);
addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (!e.repeat) pressed[e.code] = true;
  keys[e.code] = true;
  AUDIO.unlock();
  if (e.code === 'KeyM' && !e.repeat) { AUDIO.mute = !AUDIO.mute; }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.querySelectorAll('#touch button').forEach(b => {
  const code = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); AUDIO.unlock(); keys[code] = true; pressed[code] = true; });
  const up = e => { e.preventDefault(); keys[code] = false; };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
});
addEventListener('pointerdown', () => { AUDIO.unlock(); pressed['Enter'] = pressed['Enter'] || (S && (S.mode === 'title') ); });

// ----- Sonido (WebAudio) -----
const AUDIO = {
  c: null, mute: false, musicVol: 0.025,
  unlock() {
    if (!this.c) { try { this.c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
    if (this.c && this.c.state === 'suspended') this.c.resume();
  },
  tone(f, d, type = 'square', v = .05, slide = 0, delay = 0) {
    if (!this.c || this.mute) return;
    const t = this.c.currentTime + delay;
    const o = this.c.createOscillator(), g = this.c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.c.destination); o.start(t); o.stop(t + d + .02);
  }
};
const sfx = {
  jump() { AUDIO.tone(280, .13, 'square', .04, 380); },
  swing() { AUDIO.tone(520, .09, 'sawtooth', .03, -300); },
  hit() { AUDIO.tone(160, .1, 'square', .06, -90); AUDIO.tone(90, .08, 'triangle', .06, -30, .02); },
  hurt() { AUDIO.tone(220, .25, 'sawtooth', .07, -160); },
  dia() { [660, 880, 1320].forEach((f, i) => AUDIO.tone(f, .12, 'square', .045, 0, i * .07)); },
  heal() { [523, 659, 784, 1046].forEach((f, i) => AUDIO.tone(f, .12, 'triangle', .06, 0, i * .08)); },
  boing() { AUDIO.tone(180, .3, 'sine', .08, 500); },
  bark() { AUDIO.tone(300, .08, 'square', .05, -120); AUDIO.tone(260, .1, 'square', .05, -120, .1); },
  dash() { AUDIO.tone(700, .14, 'triangle', .05, -450); },
  blip() { AUDIO.tone(rnd(420, 560), .035, 'square', .02); },
  boss() { AUDIO.tone(110, .5, 'sawtooth', .07, -50); AUDIO.tone(82, .6, 'sawtooth', .07, -30, .15); },
  slam() { AUDIO.tone(90, .3, 'square', .09, -50); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => AUDIO.tone(f, .2, 'square', .05, 0, i * .12)); },
  door() { AUDIO.tone(120, .3, 'triangle', .08, 60); }
};
// música muy simple por tema
const MUSIC = {
  day: { bpm: 150, bass: [0, -1, 5, -1, 7, -1, 5, -1], lead: [12, 16, 19, 16, 14, 17, 21, 17], root: 261.6, type: 'square' },
  dream: { bpm: 100, bass: [0, -1, -1, -1, 3, -1, -1, -1], lead: [12, 15, 19, 15, 10, 14, 17, 14], root: 196, type: 'triangle' },
  boss: { bpm: 170, bass: [0, 0, 3, 0, 5, 5, 3, 0], lead: [12, 15, 12, 17, 15, 12, 19, 17], root: 220, type: 'sawtooth' },
  title: { bpm: 90, bass: [0, -1, -1, -1, 5, -1, -1, -1], lead: [12, 19, 16, 19, 14, 21, 17, 21], root: 196, type: 'triangle' },
  none: null
};
let musicName = 'none', musicStep = 0, musicTimer = 0;
function setMusic(n) { if (n !== musicName) { musicName = n; musicStep = 0; musicTimer = 0; } }
function updateMusic(dt) {
  const m = MUSIC[musicName]; if (!m || !AUDIO.c || AUDIO.mute) return;
  musicTimer -= dt;
  if (musicTimer <= 0) {
    musicTimer += 60 / m.bpm / 2;
    const i = musicStep++ % 8, st = n => m.root * Math.pow(2, n / 12);
    if (m.bass[i] >= 0) AUDIO.tone(st(m.bass[i]) / 2, .25, 'triangle', AUDIO.musicVol * 1.6);
    AUDIO.tone(st(m.lead[i]), .18, m.type, AUDIO.musicVol * (i % 2 ? .6 : 1));
  }
}

// ----- Texto -----
function txt(s, x, y, o = {}) {
  ctx.font = `bold ${o.size || 14}px "Courier New",monospace`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'top';
  if (o.outline !== false) { ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.oc || '#0a0818'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
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
