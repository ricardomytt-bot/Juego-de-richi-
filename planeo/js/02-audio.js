/* 02 · audio: música ELECTRÓNICA (sintetizadores, bajos con "pumping", batería electrónica, arpegios) y efectos.
   Todo se sintetiza con WebAudio; no hay instrumentos acústicos ni archivos de audio. */
'use strict';
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = n => { const m = /^([A-G])([#b]?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const CHORDS = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus: [0, 5, 7] };
const chordOf = (root, q) => { const r = midi(root); return CHORDS[q].map(i => r + i); };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
/* melodía: un símbolo = una corchea; '-' alarga la nota anterior, '.' silencio */
function parseMel(str){
  const tk = str.trim().split(/\s+/), out = tk.map(t => (t === '.' || t === '-') ? t : midi(t)), notes = [];
  for (let i = 0; i < out.length; i++){
    if (typeof out[i] !== 'number'){ notes.push(null); continue; }
    let len = 1; while (i + len < out.length && out[i + len] === '-') len++;
    notes.push({ m: out[i], len });
  }
  return notes;
}
const P16 = s => s.replace(/[^x.o]/g, '').split('').map(c => c === 'x' ? 1 : c === 'o' ? 2 : 0);   // patrón de 16 pulsos: x = golpe, o = acento/abierto

/* capas por compás: p=pad b=bajo d=batería a=arpegio l=melodía f=relleno/riser */
const SONGS = {
  /* AMANECER · synthwave luminoso, bajo a contratiempo con efecto de bombeo */
  dawn: { bpm: 112, lead: 'supersaw', leadCut: 3800, arpWave: 'square', arpOct: 24, arpPat: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 3], bassWave: 'saw', duck: 0.62,
    kick: P16('x...x...x...x...'), clap: P16('....x.......x...'), hat: P16('..x...x...x...x.'), ohat: P16('..x...x...x...x.'), bass: [null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null, 12, null],
    layers: ['pa', 'pab', 'pabd', 'pabdl', 'pabdl', 'pabdl', 'pabdl', 'pabdlf'],
    prog: [['C3','M7'],['G2','M'],['A2','m7'],['F2','M7'],['C3','M'],['G2','M'],['F2','M7'],['G2','M']],
    mel: 'E5 - G5 - E5 D5 C5 -   D5 - G5 - B5 - A5 G5   C6 - B5 - A5 - E5 -   F5 - A5 - G5 F5 E5 D5   G5 - C6 - E6 - D6 C6   B5 - D6 - B5 - G5 -   A5 - C6 - A5 G5 F5 -   G5 - A5 - B5 - D6 -' },
  /* TORMENTA · electro oscuro con bajo "reese" rugoso */
  storm: { bpm: 126, lead: 'supersaw', leadCut: 2400, arpWave: 'sawtooth', arpOct: 12, arpPat: [0, null, 2, null, 1, null, 2, 0, null, 2, null, 1, 0, null, 1, 2], bassWave: 'reese', duck: 0.7,
    kick: P16('x...x...x...x.x.'), clap: P16('....x.......x...'), hat: P16('x.x.x.x.x.x.x.x.'), ohat: P16('......x.......x.'), bass: [0, null, 0, 0, null, 0, null, 0, 0, null, 0, 0, null, 0, 12, null],
    layers: ['pa', 'pbda', 'pbda', 'pbdal', 'pbdal', 'pbdal', 'pbdal', 'pbdalf'],
    prog: [['A2','m'],['F2','M'],['C3','M'],['G2','M'],['A2','m'],['F2','M'],['G2','M'],['E2','M']],
    mel: 'A5 - C6 - E6 - D6 C6   A5 - C6 - F6 - E6 C6   G5 - C6 - E6 - G6 E6   D6 - B5 - D6 - G5 B5   A5 - C6 - E6 - A6 G6   F6 - E6 - C6 - A5 C6   B5 - D6 - G6 - F6 D6   E6 - G#5 - B5 - E6 -' },
  /* ATARDECER · chillwave cálido, pads anchos y campanas FM */
  dusk: { bpm: 98, lead: 'softsaw', leadCut: 1700, arpWave: 'fm', arpOct: 24, arpPat: [0, null, 1, null, 2, null, 1, null, 3, null, 2, null, 1, null, 0, null], bassWave: 'sub', duck: 0.5,
    kick: P16('x.......x.x.....'), clap: P16('....x.......x...'), hat: P16('x.x.x.x.x.x.x.x.'), ohat: P16('..............x.'), bass: [0, null, null, null, null, null, 0, null, null, null, 0, null, null, null, null, null],
    layers: ['pa', 'pab', 'pabd', 'pabdl', 'pabdl', 'pabdl', 'pabdl', 'pabdlf'],
    prog: [['F2','M7'],['C3','M'],['D3','m7'],['Bb2','M7'],['F2','M7'],['C3','M'],['Bb2','M7'],['C3','sus']],
    mel: 'A5 - - C6 - A5 G5 -   G5 - E5 - G5 - C6 -   F5 - A5 - D6 - C6 A5   D6 - - C6 - Bb5 A5 -   C6 - A5 - F5 - A5 C6   E6 - D6 - C6 - G5 -   D6 - C6 - Bb5 - A5 F5   G5 - A5 - Bb5 - C6 -' },
  /* JEFE · electro duro a 160 bpm, bajo reese y percusión rota */
  boss: { bpm: 160, lead: 'saw', leadCut: 3000, arpWave: 'sawtooth', arpOct: 12, arpPat: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 3, 2, 1, 2], bassWave: 'reese', duck: 0.75,
    kick: P16('x.....x...x.....'), clap: P16('....x.......x..x'), hat: P16('x.x.x.x.x.x.x.x.'), ohat: P16('.o.o.o.o.o.o.o.o'), bass: [0, null, 0, null, null, 0, null, 0, 0, null, 0, null, 12, null, 0, null],
    layers: ['pbda', 'pbdal', 'pbdal', 'pbdalf', 'pbdal', 'pbdal', 'pbdal', 'pbdalf'],
    prog: [['D3','m'],['Bb2','M'],['C3','M'],['A2','M'],['D3','m'],['Bb2','M'],['G2','m'],['A2','M']],
    mel: 'D5 D5 - F5 - A5 - G5   F5 F5 - A5 - D6 - C6   E5 E5 - G5 - C6 - Bb5   C#5 E5 - A5 - E6 - D6   D6 - A5 - F5 - A5 D6   Bb5 - D6 - F6 - D6 Bb5   G5 - Bb5 - D6 - C6 Bb5   A5 - C#6 - E6 - A6 -' },
  /* MENÚ · electrónica ambiental suave */
  menu: { bpm: 92, lead: 'fm', leadCut: 3000, arpWave: 'fm', arpOct: 24, arpPat: [0, null, 1, null, 2, null, 1, null, 0, null, 1, null, 2, null, 3, null], bassWave: 'sub', duck: 0.3,
    kick: P16('x.......x.......'), clap: P16('................'), hat: P16('..x...x...x...x.'), ohat: P16('................'), bass: [0, null, null, null, null, null, null, null, 0, null, null, null, null, null, null, null],
    layers: ['pa', 'pab', 'pabl', 'pabl', 'pabl', 'pabl', 'pabl', 'pabl'],
    prog: [['C3','M7'],['A2','m7'],['F2','M7'],['G2','sus'],['C3','M7'],['A2','m7'],['F2','M7'],['G2','M']],
    mel: 'E5 - - G5 - - C6 -   B5 - - A5 - - E5 -   F5 - - A5 - - C6 -   B5 - - G5 - - D5 -   E5 - G5 - E6 - D6 -   C6 - - B5 - - A5 -   A5 - G5 - F5 - E5 -   D5 - E5 - G5 - - -' },
  /* CINEMÁTICAS · pad cinematográfico con campanas FM */
  story: { bpm: 76, lead: 'fm', leadCut: 3000, arpWave: 'fm', arpOct: 24, arpPat: [0, null, null, null, 1, null, null, null, 2, null, null, null, 1, null, null, null], bassWave: 'sub', duck: 0.25,
    kick: P16('................'), clap: P16('................'), hat: P16('................'), ohat: P16('................'), bass: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    layers: ['pab', 'pabl', 'pabl', 'pabl', 'pabl', 'pabl', 'pabl', 'pabl'],
    prog: [['A2','m7'],['F2','M7'],['C3','M'],['G2','M'],['A2','m7'],['F2','M7'],['C3','M'],['G2','sus']],
    mel: 'E5 - - - A5 - - -   C6 - - - A5 - - -   G5 - - - E5 - - -   D5 - - - B5 - - -   E5 - - - A5 - C6 -   A5 - - - F5 - - -   G5 - - - E5 - G5 -   B5 - - - D6 - - -' },
  sad: { bpm: 64, lead: 'fm', leadCut: 2600, arpWave: 'fm', arpOct: 12, arpPat: [null, null, null, null, 0, null, null, null, null, null, null, null, 1, null, null, null], bassWave: 'sub', duck: 0.2,
    kick: P16('................'), clap: P16('................'), hat: P16('................'), ohat: P16('................'), bass: [0, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    layers: ['pb', 'pbl', 'pbl', 'pbl', 'pbl', 'pbl', 'pbl', 'pbl'],
    prog: [['A2','m7'],['D3','m7'],['F2','M7'],['E2','M']  ,['A2','m7'],['D3','m7'],['F2','M7'],['E2','M']],
    mel: 'E5 - - - C6 - - -   D6 - - - A5 - - -   C6 - - - A5 - F5 -   B5 - - - G#5 - - -   A5 - - - E6 - - -   D6 - - - F6 - - -   C6 - - - A5 - - -   B5 - - - G#5 - - -' },
  /* VICTORIA / JUEGO ALEGRE · chiptune futurista con ondas de pulso */
  happy: { bpm: 132, lead: 'pulse', leadCut: 6000, arpWave: 'pulse', arpOct: 24, arpPat: [0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 3], bassWave: 'tri', duck: 0.45,
    kick: P16('x...x...x...x...'), clap: P16('....x.......x...'), hat: P16('x.x.x.x.x.x.x.x.'), ohat: P16('..x...x...x...x.'), bass: [0, null, 0, null, 0, null, 12, null, 0, null, 0, null, 12, null, 0, null],
    layers: ['pbda', 'pbdal', 'pbdal', 'pbdal', 'pbdal', 'pbdal', 'pbdal', 'pbdalf'],
    prog: [['C3','M'],['F2','M'],['G2','M'],['C3','M'],['C3','M'],['F2','M'],['G2','M'],['C3','M']],
    mel: 'C6 - E6 - G6 - E6 C6   A5 - C6 - F6 - E6 C6   B5 - D6 - G6 - F6 D6   E6 - D6 - C6 - - -   G6 - E6 - C6 - E6 G6   F6 - A5 - C6 - F6 -   G6 - D6 - B5 - D6 G6   C6 - E6 - G6 - C7 -' }
};
for (const k in SONGS){ const S = SONGS[k]; S.melT = parseMel(S.mel); S.chords = S.prog.map(p => chordOf(p[0], p[1])); S.roots = S.prog.map(p => midi(p[0])); }

const Sound = {
  ctx: null, master: null, muted: store.get('planeo2.muted', false), musicOn: store.get('planeo3.music', true), on: false, timer: null, nextT: 0, tick: 0,
  noiseBuf: null, moodName: 'menu', intensity: 0,
  init(){
    if (this.ctx){ if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.setup(new AC());
    } catch (e) { this.ctx = null; }
  },
  setup(c){
    this.ctx = c;
    const mk = (v) => { const g = c.createGain(); g.gain.value = v; return g; };
    this.master = mk(this.muted ? 0 : 0.85);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.18;
    this.out = mk(0.5); this.master.connect(comp); comp.connect(this.out); this.out.connect(c.destination);   // el compresor de Chrome sube el volumen solo; 'out' lo deja en un nivel de música de fondo
    // buses de música
    this.busLead = mk(0.26); this.busPad = mk(0.2); this.busBass = mk(0.46); this.busArp = mk(0.2); this.busDrum = mk(0.46);
    // "sidechain": estos nodos se agachan con cada bombo (efecto de bombeo típico de la electrónica)
    this.scPad = mk(1); this.scBass = mk(1); this.scArp = mk(1); this.scLead = mk(1);
    this.scPad.connect(this.busPad); this.scBass.connect(this.busBass); this.scArp.connect(this.busArp); this.scLead.connect(this.busLead);
    for (const b of [this.busLead, this.busPad, this.busBass, this.busArp, this.busDrum]) b.connect(this.master);
    // reverb con respuesta sintética
    const sr = c.sampleRate, len = Math.floor(sr * 1.9), ir = c.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    this.verb = c.createConvolver(); this.verb.buffer = ir; this.verbIn = mk(1); this.verbOut = mk(0.5);
    this.verbIn.connect(this.verb); this.verb.connect(this.verbOut); this.verbOut.connect(this.master);
    // eco rítmico (corchea con puntillo)
    this.dly = c.createDelay(1); this.dly.delayTime.value = 0.32; const fb = mk(0.34), wet = mk(0.4);
    const dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 3200;
    this.dlyIn = mk(1); this.dlyIn.connect(this.dly); this.dly.connect(dlp); dlp.connect(fb); fb.connect(this.dly); dlp.connect(wet); wet.connect(this.master);
    // ruido, onda de pulso 25% y curva de saturación
    const nl = sr; this.noiseBuf = c.createBuffer(1, nl, sr); const nd = this.noiseBuf.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    const re = new Float32Array(48), im = new Float32Array(48); for (let n = 1; n < 48; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
    this.pulse = c.createPeriodicWave(re, im);
    const cur = new Float32Array(512); for (let i = 0; i < 512; i++){ const x = i / 256 - 1; cur[i] = Math.tanh(x * 2.4); } this.curve = cur;
  },
  setMuted(m){ this.muted = m; store.set('planeo2.muted', m); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05); },
  setMusic(on){ this.musicOn = on; store.set('planeo3.music', on); },
  tone(f, t0, dur, type, vol, dest){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  setMood(name){
    if (!SONGS[name]) name = 'menu';
    if (this.moodName === name) return;
    this.moodName = name; this.tick = 0;
    if (this.ctx){
      const t = this.ctx.currentTime;
      this.nextT = Math.max(this.nextT, t + 0.08); this.dly.delayTime.setTargetAtTime(60 / SONGS[name].bpm * 0.75, t, 0.05);
      if (this.musicOn && !this.muted) this.sweep(t, 0.7, 0.16);   // barrido de transición
    }
  },
  startMusic(){
    if (!this.ctx || this.on) return; this.on = true; this.nextT = this.ctx.currentTime + 0.12; this.tick = 0;
    this.timer = setInterval(() => this.pump(), 50);
  },
  stopMusic(){ this.on = false; clearInterval(this.timer); },
  pump(){
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const S = SONGS[this.moodName] || SONGS.menu, td = 60 / S.bpm / 4;
    while (this.nextT < c.currentTime + 0.2){
      if (this.musicOn) this.playTick(S, this.tick, this.nextT);
      this.nextT += td; this.tick++;
    }
  },

  /* ================= instrumentos (todos electrónicos) ================= */
  env(g, t, a, hold, r, vol){ g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r); },
  send(node, rev, dly){ const K = 0.3; rev *= K; dly *= K; if (rev) { const g = this.ctx.createGain(); g.gain.value = rev; node.connect(g); g.connect(this.verbIn); } if (dly) { const g = this.ctx.createGain(); g.gain.value = dly; node.connect(g); g.connect(this.dlyIn); } },
  /* supersaw: 3 sierras desafinadas con filtro que se abre (sonido de lead trance/synthwave) */
  supersaw(m, t, dur, vol, cut, dest, soft){
    const c = this.ctx, f = mtof(m), out = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.5;
    lp.frequency.setValueAtTime(cut * 0.35, t); lp.frequency.linearRampToValueAtTime(cut, t + 0.05); lp.frequency.exponentialRampToValueAtTime(Math.max(300, cut * 0.5), t + Math.max(0.12, dur));
    for (const dt of [-13, 0, 13]){ const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; if (soft){ const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 5; lfo.connect(lg); lg.connect(o.detune); lfo.start(t); lfo.stop(t + dur + 0.2); } o.connect(lp); o.start(t); o.stop(t + dur + 0.2); }
    lp.connect(out); this.env(out, t, 0.012, Math.max(0, dur - 0.02), 0.12, vol / 3);
    out.connect(dest || this.scLead); this.send(out, 0.22, 0.28);
  },
  /* lead de una sola onda (sierra o pulso) */
  mono(m, t, dur, vol, cut, wave, dest){
    const c = this.ctx, o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.Q.value = 3;
    if (wave === 'pulse') o.setPeriodicWave(this.pulse); else o.type = wave; o.frequency.value = mtof(m);
    lp.frequency.setValueAtTime(cut, t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, cut * 0.4), t + Math.max(0.1, dur));
    o.connect(lp); lp.connect(g); this.env(g, t, 0.006, Math.max(0, dur - 0.02), 0.08, vol); o.start(t); o.stop(t + dur + 0.15);
    g.connect(dest || this.scLead); this.send(g, 0.12, 0.22);
  },
  /* campana FM: portadora senoidal modulada (timbre de piano eléctrico / campana digital) */
  fmBell(m, t, vol, dur, dest){
    const c = this.ctx, f = mtof(m), car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain();
    car.frequency.value = f; mod.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.7);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
    g.connect(dest || this.scArp); this.send(g, 0.4, 0.25);
  },
  /* arpegiador: nota corta y brillante */
  arpNote(m, t, vol, wave, pan, dur){
    const c = this.ctx; if (wave === 'fm') return this.fmBell(m, t, vol * 1.25, dur * 1.6);
    const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), pn = c.createStereoPanner ? c.createStereoPanner() : null;
    if (wave === 'pulse') o.setPeriodicWave(this.pulse); else o.type = wave; o.frequency.value = mtof(m);
    lp.type = 'lowpass'; lp.Q.value = 4; lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    o.connect(lp); lp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
    if (pn){ pn.pan.value = pan; g.connect(pn); pn.connect(this.scArp); this.send(pn, 0.1, 0.2); } else { g.connect(this.scArp); this.send(g, 0.1, 0.2); }
  },
  /* pad: sierras desafinadas con filtro lento (colchón de sintetizador) */
  pad(notes, t, dur, vol){
    const c = this.ctx;
    notes.forEach(m => {
      const lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.Q.value = 0.8;
      lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.55); lp.frequency.linearRampToValueAtTime(700, t + dur);
      for (const dt of [-9, 9]){ const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m + 12); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.25); }
      lp.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.35, dur * 0.25)); g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
      g.connect(this.scPad); this.send(g, 0.35, 0);
    });
  },
  /* bajos */
  bass(m, t, dur, vol, kind){
    const c = this.ctx, f = mtof(m), out = c.createGain();
    if (kind === 'reese'){   // dos sierras desafinadas + saturación + filtro que se abre (bajo "rugoso")
      const lp = c.createBiquadFilter(), ws = c.createWaveShaper(); lp.type = 'lowpass'; lp.Q.value = 5; ws.curve = this.curve;
      lp.frequency.setValueAtTime(260, t); lp.frequency.linearRampToValueAtTime(1100, t + dur * 0.5); lp.frequency.linearRampToValueAtTime(260, t + dur);
      for (const dt of [-10, 10]){ const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); }
      const sub = c.createOscillator(); sub.type = 'sine'; sub.frequency.value = f; const sg = c.createGain(); sg.gain.value = 0.9; sub.connect(sg); sg.connect(out); sub.start(t); sub.stop(t + dur + 0.1);
      lp.connect(ws); const wg = c.createGain(); wg.gain.value = 0.32; ws.connect(wg); wg.connect(out);
    } else if (kind === 'saw'){
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6; lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(220, t + Math.min(dur, 0.18));
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); lp.connect(out); o.start(t); o.stop(t + dur + 0.1);
      const sub = c.createOscillator(); sub.type = 'sine'; sub.frequency.value = f; const sg = c.createGain(); sg.gain.value = 0.8; sub.connect(sg); sg.connect(out); sub.start(t); sub.stop(t + dur + 0.1);
    } else if (kind === 'tri'){
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(out); o.start(t); o.stop(t + dur + 0.05);
    } else {   // sub senoidal profundo
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(out); o.start(t); o.stop(t + dur + 0.05);
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.18; o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + dur + 0.05);
    }
    this.env(out, t, 0.008, Math.max(0, dur - 0.04), 0.06, vol); out.connect(this.scBass);
  },
  /* percusión electrónica */
  kick(t, vol){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(175, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.34); o.connect(g); g.connect(this.busDrum); o.start(t); o.stop(t + 0.36);
    this.noiseHit(t, 0.012, 3000, 'highpass', vol * 0.5, this.busDrum);
  },
  snare(t, vol){
    const c = this.ctx; this.noiseHit(t, 0.17, 2400, 'bandpass', vol, this.busDrum);
    const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.09);
    g.gain.setValueAtTime(vol * 0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o.connect(g); g.connect(this.busDrum); o.start(t); o.stop(t + 0.14);
  },
  clap(t, vol){ for (let i = 0; i < 3; i++) this.noiseHit(t + i * 0.011, i === 2 ? 0.2 : 0.02, 1600, 'bandpass', vol * (i === 2 ? 1 : 0.7), this.busDrum); },
  hat(t, vol, open, pan){
    const d = this.noiseHit(t, open ? 0.22 : 0.04, 8500, 'highpass', vol, this.busDrum, pan);
  },
  noiseHit(t, dur, freq, type, vol, dest, pan){
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = false; f.type = type; f.frequency.value = freq; f.Q.value = type === 'bandpass' ? 0.7 : 0.5;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g);
    if (pan && c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(dest); } else g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  crash(t, vol){ this.noiseHit(t, 1.1, 5200, 'highpass', vol, this.busDrum); },
  sweep(t, dur, vol){   // riser / barrido de ruido que sube
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = this.noiseBuf; f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7500, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    s.connect(f); f.connect(g); g.connect(this.busDrum); this.send(g, 0.3, 0); s.start(t, 0); s.stop(t + dur + 0.1);
  },
  tom(t, f0, vol){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + 0.18); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22); o.connect(g); g.connect(this.busDrum); o.start(t); o.stop(t + 0.25); },
  /* "pumping": todo lo que no es batería se agacha con cada bombo */
  duck(t, depth, rel){
    for (const g of [this.scPad, this.scBass, this.scArp, this.scLead]){
      const k = g === this.scLead ? depth * 0.35 : depth;
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(1 - k, t); g.gain.linearRampToValueAtTime(1, t + rel);
    }
  },

  /* ================= secuenciador: 16 pulsos por compás, 8 compases por vuelta ================= */
  playTick(S, tick, t){
    const pos = tick % 16, bar = Math.floor(tick / 16) % 8, td = 60 / S.bpm / 4, barDur = td * 16;
    let L = S.layers[bar]; const inten = this.intensity;
    if (inten > 0.7 && S.kick.some(Boolean)) L += 'da';
    const has = ch => L.includes(ch);
    const ch = S.chords[bar], root = S.roots[bar];
    // bombo y bombeo
    const kicking = has('d') && S.kick[pos];
    if (kicking){ this.kick(t, 0.9); this.duck(t, S.duck, td * 3.4); }
    // batería
    if (has('d')){
      if (S.clap[pos]) this.clap(t, 0.2); 
      if (S.hat[pos]) this.hat(t, 0.06 + (pos % 4 === 0 ? 0.02 : 0), false, pos % 8 < 4 ? -0.25 : 0.25);
      if (S.ohat[pos]) this.hat(t, 0.075, true, 0.3);
      if (pos === 0 && bar === 0) this.crash(t, 0.12);
    }
    if (has('f')){   // relleno: riser en el último compás y toms al final
      if (pos === 0) this.sweep(t, barDur, 0.2);
      if (pos === 12) this.tom(t, 220, 0.5); if (pos === 13) this.tom(t, 180, 0.5); if (pos === 14) this.tom(t, 150, 0.55); if (pos === 15) this.tom(t, 120, 0.6);
    }
    // pad
    if (pos === 0 && has('p')) this.pad(ch, t, barDur * 0.98, 0.2);
    // bajo
    if (has('b')){
      const off = S.bass[pos];
      if (off !== null && off !== undefined){
        let nextGap = 1; for (let k = 1; k < 16; k++){ const v = S.bass[(pos + k) % 16]; if (v !== null && v !== undefined) break; nextGap++; }
        const dur = Math.min(td * nextGap * 0.92, S.bassWave === 'sub' || S.bassWave === 'tri' ? td * 7 : td * 3.2);
        this.bass(root - 12 + off, t, dur, S.bassWave === 'reese' ? 0.55 : 0.6, S.bassWave);
      }
    }
    // arpegio
    if (has('a')){
      const di = S.arpPat[pos];
      if (di !== null && di !== undefined){ const n = ch[di % ch.length] + S.arpOct + (di >= ch.length ? 12 : 0); this.arpNote(n, t, S.arpWave === 'fm' ? 0.07 : 0.07, S.arpWave, ((pos >> 1) % 2 ? 0.35 : -0.35), td * (S.arpWave === 'sawtooth' ? 1.6 : 2.4)); }
    }
    // melodía
    if (has('l') && pos % 2 === 0){
      const n = S.melT[bar * 8 + pos / 2];
      if (n){
        const dur = n.len * td * 2 * 0.96;
        if (S.lead === 'supersaw' || S.lead === 'softsaw') this.supersaw(n.m, t, dur, 0.5, S.leadCut, null, S.lead === 'softsaw');
        else if (S.lead === 'fm') this.fmBell(n.m, t, 0.12, Math.max(0.9, dur * 1.4), this.scLead);
        else this.mono(n.m, t, dur, S.lead === 'pulse' ? 0.1 : 0.12, S.leadCut, S.lead === 'pulse' ? 'pulse' : 'sawtooth');
      }
    }
  },

  sfx(name, k){
    const c = this.ctx; if (!c || this.muted || c.state !== 'running') return; const t = c.currentTime;
    const pent = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    switch (name){
      case 'acorn': { const i = Math.min(k | 0, pent.length - 1); this.tone(660 * Math.pow(2, pent[i] / 12), t, 0.28, 'sine', 0.22); this.tone(1320 * Math.pow(2, pent[i] / 12), t, 0.12, 'triangle', 0.05); break; }
      case 'gold': [0, 4, 7, 12].forEach((n, i) => this.tone(740 * Math.pow(2, n / 12), t + i * 0.06, 0.35, 'triangle', 0.18)); break;
      case 'heart': [0, 7, 12].forEach((n, i) => this.tone(520 * Math.pow(2, n / 12), t + i * 0.09, 0.5, 'sine', 0.22)); break;
      case 'hit': this.tone(150, t, 0.35, 'sine', 0.5); this.tone(95, t, 0.5, 'triangle', 0.4); this.noise(t, 0.25, 900, 0.3); break;
      case 'dive': this.noise(t, 0.6, 1800, 0.18, 500); break;
      case 'brake': this.noise(t, 0.5, 600, 0.12, 1200); break;
      case 'cp': [0, 7, 12, 16].forEach((n, i) => this.tone(520 * Math.pow(2, n / 12), t + i * 0.1, 0.6, 'sine', 0.2)); break;
      case 'go': this.tone(880, t, 0.5, 'sine', 0.25); break;
      case 'tick': this.tone(520, t, 0.25, 'sine', 0.2); break;
      case 'fin': [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(440 * Math.pow(2, n / 12), t + i * 0.11, 0.8, 'triangle', 0.2)); break;
      case 'fall': { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.9);
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 1); break; }
      case 'move': this.noise(t, 0.07, 2400, 0.04); break;
      case 'ui': this.tone(660, t, 0.12, 'triangle', 0.14); this.tone(990, t + 0.05, 0.12, 'triangle', 0.1); break;
      case 'blip': { const f = 260 + (k || 0) * 90 + Math.random() * 40; this.tone(f, t, 0.07, 'square', 0.03); break; }
      case 'thunder': this.noise(t, 1.8, 260, 0.5, 70); this.tone(52, t, 1.4, 'sine', 0.4); break;
      case 'zap': this.noise(t, 0.3, 4200, 0.28, 900); this.tone(180, t, 0.25, 'sawtooth', 0.12); break;
      case 'warn': this.tone(880, t, 0.1, 'square', 0.06); this.tone(880, t + 0.16, 0.1, 'square', 0.06); break;
      case 'roar': { const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.9);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 1.05);
        this.noise(t, 0.8, 500, 0.12); break; }
      case 'gift': [0, 7, 12].forEach((n, i) => this.tone(880 * Math.pow(2, n / 12), t + i * 0.07, 0.3, 'sine', 0.1)); break;
      case 'throw': this.noise(t, 0.3, 900, 0.2, 2600); this.tone(520, t, 0.25, 'triangle', 0.14); break;
      case 'bossHurt': this.tone(240, t, 0.4, 'sawtooth', 0.12); this.tone(120, t, 0.5, 'sine', 0.35); this.noise(t, 0.3, 1200, 0.2); [0, 4, 7].forEach((n, i) => this.tone(700 * Math.pow(2, n / 12), t + 0.1 + i * 0.07, 0.3, 'triangle', 0.12)); break;
      case 'bossDie': [12, 9, 7, 4, 0, -5].forEach((n, i) => this.tone(520 * Math.pow(2, n / 12), t + i * 0.12, 0.5, 'triangle', 0.17)); this.noise(t, 1.2, 1500, 0.2, 200); break;
      case 'win': [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), t + i * 0.13, 0.9, 'triangle', 0.17)); break;
      case 'power': [0, 4, 7, 12, 16].forEach((n, i) => this.tone(600 * Math.pow(2, n / 12), t + i * 0.05, 0.3, 'triangle', 0.16)); this.noise(t, 0.3, 3000, 0.1); break;
      case 'pop': this.tone(900, t, 0.12, 'sine', 0.3); this.tone(420, t + 0.03, 0.2, 'triangle', 0.2); this.noise(t, 0.18, 3500, 0.18); break;
      case 'smash': this.tone(180, t, 0.2, 'sawtooth', 0.15); this.noise(t, 0.25, 1500, 0.3, 300); [0, 7, 12].forEach((n, i) => this.tone(700 * Math.pow(2, n / 12), t + 0.04 + i * 0.04, 0.2, 'square', 0.06)); break;
      case 'whoosh': this.noise(t, 0.7, 500, 0.2, 2200); break;
      case 'level': [0, 5, 9, 12].forEach((n, i) => this.tone(523 * Math.pow(2, n / 12), t + i * 0.1, 0.5, 'sine', 0.2)); break;
    }
  },
  noise(t, dur, freq, vol, freq2){
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.setValueAtTime(freq, t);
    if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  }
};
