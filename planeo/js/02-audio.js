/* 02 · audio generativo: música por ambientes + efectos (WebAudio, sin archivos) */
'use strict';
const MOODS = {
  menu:  { prog: [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]], step: 0.5,  perc: 0, bass: false, lead: 'sine',     leadP: 0.65, pad: 0.07 },
  dawn:  { prog: [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]], step: 0.38, perc: 1, bass: true,  lead: 'sine',     leadP: 0.75, pad: 0.06 },
  storm: { prog: [[57, 60, 64], [52, 55, 59], [53, 57, 60], [52, 56, 59]], step: 0.34, perc: 1, bass: true,  lead: 'triangle', leadP: 0.7,  pad: 0.07 },
  dusk:  { prog: [[53, 57, 60], [50, 53, 57], [55, 59, 62], [48, 52, 55]], step: 0.4,  perc: 1, bass: true,  lead: 'sine',     leadP: 0.75, pad: 0.065 },
  boss:  { prog: [[57, 60, 64], [56, 59, 62], [53, 57, 60], [52, 56, 59]], step: 0.2,  perc: 2, bass: true,  lead: 'sawtooth', leadP: 0.55, pad: 0.05, spb: 16 },
  story: { prog: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], step: 0.62, perc: 0, bass: false, lead: 'sine',     leadP: 0.5,  pad: 0.08 },
  sad:   { prog: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 55, 59]], step: 0.7,  perc: 0, bass: false, lead: 'sine',     leadP: 0.4,  pad: 0.08 },
  happy: { prog: [[60, 64, 67], [65, 69, 72], [55, 59, 62], [60, 64, 67]], step: 0.3,  perc: 1, bass: true,  lead: 'triangle', leadP: 0.85, pad: 0.06 }
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const Sound = {
  ctx: null, master: null, muted: store.get('planeo2.muted', false), on: false, timer: null, nextT: 0, step: 0, noiseBuf: null,
  mood: 'menu', moodName: 'menu', intensity: 0,
  init(){
    if (this.ctx){ if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.7;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.master.connect(comp); comp.connect(c.destination);
      this.dly = c.createDelay(1); this.dly.delayTime.value = 0.42;
      const fb = c.createGain(); fb.gain.value = 0.36; const wet = c.createGain(); wet.gain.value = 0.42;
      this.dly.connect(fb); fb.connect(this.dly); this.dly.connect(wet); wet.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = 0.55; this.mus.connect(this.master); this.mus.connect(this.dly);
      const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setMuted(m){ this.muted = m; store.set('planeo2.muted', m); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05); },
  tone(f, t0, dur, type, vol, dest){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  setMood(name){
    if (this.moodName === name) return;
    this.moodName = name; this.step = 0;
    if (this.ctx) this.nextT = Math.max(this.nextT, this.ctx.currentTime + 0.1);
  },
  startMusic(){
    if (!this.ctx || this.on) return; this.on = true; this.nextT = this.ctx.currentTime + 0.15; this.step = 0;
    this.timer = setInterval(() => this.sched(), 120);
  },
  stopMusic(){ this.on = false; clearInterval(this.timer); },
  sched(){
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const M = MOODS[this.moodName] || MOODS.menu, pent = [0, 2, 4, 7, 9], spb = M.spb || 8;
    const perc = M.perc ? M.perc + (this.intensity > 0.75 && M.perc < 2 ? 1 : 0) : 0;
    while (this.nextT < c.currentTime + 0.5){
      const bar = Math.floor(this.step / spb) % M.prog.length, ch = M.prog[bar], t = this.nextT, st = this.step;
      if (st % spb === 0){
        ch.forEach(m => {
          const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
          o.type = 'triangle'; o.frequency.value = mtof(m); lp.type = 'lowpass'; lp.frequency.value = 760;
          const L = M.step * spb;
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(M.pad, t + L * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + L * 1.05);
          o.connect(lp); lp.connect(g); g.connect(this.mus); o.start(t); o.stop(t + L * 1.1);
        });
      }
      if (M.bass && st % 4 === 0) this.tone(mtof(ch[0] - 24), t, M.step * 3.2, 'sine', 0.2, this.master);
      if (perc >= 1){
        if (st % 4 === 0){ // bombo suave
          const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
          g.gain.setValueAtTime(0.26, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.22);
        }
        if (st % 2 === 1) this.noise(t, 0.05, 7500, 0.035);
        if (perc >= 2 && st % 8 === 4) this.noise(t, 0.12, 1900, 0.09);
      }
      if (Math.random() < M.leadP + this.intensity * 0.1){
        const pool = Math.random() < 0.55 ? ch.map(m => m + 12) : pent.map(p => 72 + p);
        const m = pool[Math.floor(Math.random() * pool.length)] + (Math.random() < 0.2 ? 12 : 0);
        this.tone(mtof(m), t, M.step * 3, M.lead, M.lead === 'sawtooth' ? 0.018 : 0.05, this.mus);
      }
      this.nextT += M.step; this.step++;
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
