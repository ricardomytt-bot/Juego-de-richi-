/* 02 · audio: música compuesta (melodía + bajo + acordes + batería) y efectos, todo sintetizado con WebAudio */
'use strict';
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = n => { const m = /^([A-G])([#b]?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const seq = str => str.trim().split(/\s+/).map(t => (t === '.' || t === '-') ? t : midi(t));   // un símbolo = una corchea; '-' alarga, '.' silencio
const chordOf = (root, q) => { const r = midi(root); return q === 'm' ? [r, r + 3, r + 7] : [r, r + 4, r + 7]; };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

/* 8 compases por canción; cada compás = 8 corcheas de melodía */
const SONGS = {
  // amanecer: luminosa y aventurera
  dawn: { bpm: 112, perc: 1, bass: 'half', arp: false, lead: 'pluck',
    prog: [['C3','M'],['G2','M'],['A2','m'],['F2','M'],['C3','M'],['G2','M'],['F2','M'],['G2','M']],
    mel: 'E5 - G5 - E5 D5 C5 -   D5 - G5 - B5 - A5 G5   C6 - B5 - A5 - E5 -   F5 - A5 - G5 F5 E5 D5   G5 - C6 - E6 - D6 C6   B5 - D6 - B5 - G5 -   A5 - C6 - A5 G5 F5 -   G5 - A5 - B5 - D6 -' },
  // tormenta: tensa y con empuje
  storm: { bpm: 124, perc: 1, bass: 'drive', arp: true, lead: 'pluck',
    prog: [['A2','m'],['F2','M'],['C3','M'],['G2','M'],['A2','m'],['F2','M'],['G2','M'],['E2','M']],
    mel: 'A5 - C6 - E6 - D6 C6   A5 - C6 - F6 - E6 C6   G5 - C6 - E6 - G6 E6   D6 - B5 - D6 - G5 B5   A5 - C6 - E6 - A6 G6   F6 - E6 - C6 - A5 C6   B5 - D6 - G6 - F6 D6   E6 - G#5 - B5 - E6 -' },
  // atardecer: cálida y tranquila
  dusk: { bpm: 100, perc: 1, bass: 'half', arp: true, lead: 'pluck',
    prog: [['F2','M'],['C3','M'],['D3','m'],['Bb2','M'],['F2','M'],['C3','M'],['Bb2','M'],['C3','M']],
    mel: 'A5 - - C6 - A5 G5 -   G5 - E5 - G5 - C6 -   F5 - A5 - D6 - C6 A5   D6 - - C6 - Bb5 A5 -   C6 - A5 - F5 - A5 C6   E6 - D6 - C6 - G5 -   D6 - C6 - Bb5 - A5 F5   G5 - A5 - Bb5 - C6 -' },
  // jefe: rápida y dramática
  boss: { bpm: 152, perc: 2, bass: 'drive', arp: true, lead: 'saw',
    prog: [['D3','m'],['Bb2','M'],['C3','M'],['A2','M'],['D3','m'],['Bb2','M'],['G2','m'],['A2','M']],
    mel: 'D5 D5 - F5 - A5 - G5   F5 F5 - A5 - D6 - C6   E5 E5 - G5 - C6 - Bb5   C#5 E5 - A5 - E6 - D6   D6 - A5 - F5 - A5 D6   Bb5 - D6 - F6 - D6 Bb5   G5 - Bb5 - D6 - C6 Bb5   A5 - C#6 - E6 - A6 -' },
  // menú: suave
  menu: { bpm: 96, perc: 0, bass: 'calm', arp: true, lead: 'pluck',
    prog: [['C3','M'],['A2','m'],['F2','M'],['G2','M'],['C3','M'],['A2','m'],['F2','M'],['G2','M']],
    mel: 'E5 - - G5 - - C6 -   B5 - - A5 - - E5 -   F5 - - A5 - - C6 -   B5 - - G5 - - D5 -   E5 - G5 - E6 - D6 -   C6 - - B5 - - A5 -   A5 - G5 - F5 - E5 -   D5 - E5 - G5 - - -' },
  // cinemáticas
  story: { bpm: 80, perc: 0, bass: 'calm', arp: false, lead: 'pluck',
    prog: [['A2','m'],['F2','M'],['C3','M'],['G2','M'],['A2','m'],['F2','M'],['C3','M'],['G2','M']],
    mel: 'E5 - - - A5 - - -   C6 - - - A5 - - -   G5 - - - E5 - - -   D5 - - - B5 - - -   E5 - - - A5 - C6 -   A5 - - - F5 - - -   G5 - - - E5 - G5 -   B5 - - - D6 - - -' },
  sad: { bpm: 66, perc: 0, bass: 'calm', arp: false, lead: 'pluck',
    prog: [['A2','m'],['D3','m'],['F2','M'],['E2','M'],['A2','m'],['D3','m'],['F2','M'],['E2','M']],
    mel: 'E5 - - - C6 - - -   D6 - - - A5 - - -   C6 - - - A5 - F5 -   B5 - - - G#5 - - -   A5 - - - E6 - - -   D6 - - - F6 - - -   C6 - - - A5 - - -   B5 - - - G#5 - - -' },
  happy: { bpm: 128, perc: 1, bass: 'half', arp: true, lead: 'pluck',
    prog: [['C3','M'],['F2','M'],['G2','M'],['C3','M'],['C3','M'],['F2','M'],['G2','M'],['C3','M']],
    mel: 'C6 - E6 - G6 - E6 C6   A5 - C6 - F6 - E6 C6   B5 - D6 - G6 - F6 D6   E6 - D6 - C6 - - -   G6 - E6 - C6 - E6 G6   F6 - A5 - C6 - F6 -   G6 - D6 - B5 - D6 G6   C6 - E6 - G6 - C7 -' }
};
for (const k in SONGS){ const S = SONGS[k]; S.melT = seq(S.mel); S.chords = S.prog.map(p => chordOf(p[0], p[1])); S.roots = S.prog.map(p => midi(p[0])); }

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
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.15;
    this.master.connect(comp); comp.connect(c.destination);
    // eco suave solo para melodía y arpegios (no para batería ni bajo)
    this.dly = c.createDelay(1); this.dly.delayTime.value = 0.3;
    const fb = c.createGain(); fb.gain.value = 0.26; const wet = c.createGain(); wet.gain.value = 0.3;
    this.dly.connect(fb); fb.connect(this.dly); this.dly.connect(wet); wet.connect(this.master);
    this.lead = c.createGain(); this.lead.gain.value = 1; this.lead.connect(this.master); this.lead.connect(this.dly);
    this.mus = c.createGain(); this.mus.gain.value = 1; this.mus.connect(this.master);
    const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },
  setMuted(m){ this.muted = m; store.set('planeo2.muted', m); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05); },
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
    if (this.ctx){ this.nextT = Math.max(this.nextT, this.ctx.currentTime + 0.08); this.dly.delayTime.setTargetAtTime(60 / SONGS[name].bpm * 0.75, this.ctx.currentTime, 0.05); }
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
  /* ----- instrumentos ----- */
  pluck(m, t, vol, dur, saw){
    const c = this.ctx, f = mtof(m), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (saw){
      const o = c.createOscillator(), lp = c.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur);
      o.connect(lp); lp.connect(g); o.start(t); o.stop(t + dur + 0.05);
    } else {
      const o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();   // timbre de marimba: fundamental + armónico corto
      o1.type = 'triangle'; o1.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 4;
      g2.gain.setValueAtTime(0.35, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.3);
      o1.connect(g); o2.connect(g2); g2.connect(g); o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur * 0.3 + 0.05);
    }
    g.connect(this.lead);
  },
  bassNote(m, t, dur, vol){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = mtof(m); lp.type = 'lowpass'; lp.frequency.value = 520;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(this.mus); o.start(t); o.stop(t + dur + 0.05);
  },
  padChord(notes, t, dur, vol){
    const c = this.ctx;
    notes.forEach(m => {
      const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = mtof(m + 12); lp.type = 'lowpass'; lp.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.12); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(this.mus); o.start(t); o.stop(t + dur + 0.05);
    });
  },
  kick(t, vol){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 0.25);
  },
  snare(t, vol){
    const c = this.ctx; this.noiseTo(t, 0.14, 2200, vol, null, this.mus);
    const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    g.gain.setValueAtTime(vol * 0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 0.12);
  },
  hat(t, vol){ this.noiseTo(t, 0.045, 9000, vol, null, this.mus); },
  noiseTo(t, dur, freq, vol, freq2, dest){
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(freq, t); if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.master); s.start(t); s.stop(t + dur + 0.02);
  },
  /* ----- secuenciador: 16 pulsos por compás, 8 compases por vuelta ----- */
  playTick(S, tick, t){
    const pos = tick % 16, bar = Math.floor(tick / 16) % 8, td = 60 / S.bpm / 4, barDur = td * 16;
    const ch = S.chords[bar], root = S.roots[bar];
    const inten = this.intensity;
    const perc = S.perc === 0 ? 0 : (S.perc === 1 && inten > 0.8 ? 2 : S.perc);
    // acordes largos de fondo
    if (pos === 0) this.padChord(ch, t, barDur * 0.98, S.perc ? 0.028 : 0.04);
    // bajo
    const bp = S.bass === 'drive' ? [0, 2, 4, 6, 8, 10, 12, 14] : S.bass === 'half' ? [0, 4, 8, 12] : [0, 8];
    if (bp.includes(pos)){
      const up = S.bass === 'drive' && (pos === 6 || pos === 14);
      this.bassNote(root + (up ? 12 : 0) - 12 + 12, t, td * (S.bass === 'calm' ? 7 : 1.8), S.bass === 'drive' ? 0.2 : 0.22);
    }
    // melodía (una nota nueva por corchea)
    if (pos % 2 === 0){
      const tok = S.melT[bar * 8 + pos / 2];
      if (typeof tok === 'number') this.pluck(tok, t, S.lead === 'saw' ? 0.04 : 0.1, S.lead === 'saw' ? td * 3 : td * 5.5, S.lead === 'saw');
    }
    // arpegio de acompañamiento (sube con la velocidad)
    if ((S.arp || inten > 0.55) && S.perc > 0 && pos % 2 === 1){
      const k = (pos >> 1) % 4, n = ch[[0, 1, 2, 1][k]] + 24;
      this.pluck(n, t, 0.03, td * 2.6, false);
    } else if (S.arp && S.perc === 0 && pos % 4 === 0){
      const n = ch[(pos >> 2) % 3] + 24; this.pluck(n, t, 0.035, td * 4, false);
    }
    // batería
    if (perc >= 1){
      const kicks = perc >= 2 ? [0, 6, 8, 14] : [0, 8];
      if (kicks.includes(pos)) this.kick(t, perc >= 2 ? 0.34 : 0.3);
      if (pos === 4 || pos === 12) this.snare(t, perc >= 2 ? 0.1 : 0.05);
      if (perc >= 2 ? pos % 2 === 0 : pos % 4 === 2) this.hat(t, perc >= 2 ? 0.05 : 0.035);
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
