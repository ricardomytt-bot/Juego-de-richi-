// Audio sintetizado (sin archivos): efectos + música chiptune
const Sfx = (() => {
  let ac = null, master = null, muted = false, musicTimer = null, droneNodes = null, hor = null;
  try { muted = localStorage.getItem('richi_mute') === '1'; } catch (e) {}
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination); } catch (e) { ac = null; }
  }
  function tone(f, d, type = 'square', v = 0.15, slide = 0, delay = 0) {
    if (!ac) return; const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(d, v = 0.2, freq = 1200, delay = 0, type = 'lowpass') {
    if (!ac) return; const t = ac.currentTime + delay;
    const n = Math.max(1, Math.floor(ac.sampleRate * d)), b = ac.createBuffer(1, n, ac.sampleRate), data = b.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = b;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const api = {
    init, get muted() { return muted; },
    toggleMute() { muted = !muted; try { localStorage.setItem('richi_mute', muted ? '1' : '0'); } catch (e) {} if (master) master.gain.value = muted ? 0 : 0.5; return muted; },
    pickup() { tone(660, 0.06, 'square', 0.1); tone(990, 0.06, 'square', 0.1, 0, 0.06); tone(1320, 0.1, 'square', 0.1, 0, 0.12); },
    chest() { noise(0.15, 0.3, 700); tone(180, 0.15, 'square', 0.1, 120); },
    flash() { noise(0.25, 0.35, 5000, 0, 'highpass'); tone(900, 0.2, 'square', 0.08, -600); },
    radar(v = 1) { tone(1100, 0.12, 'sine', 0.18 * v); tone(1100, 0.12, 'sine', 0.18 * v, 0, 0.2); },
    grab() { noise(0.3, 0.6, 600); tone(70, 0.4, 'sawtooth', 0.3, -30); },
    mash() { tone(500 + Math.random() * 300, 0.05, 'square', 0.1); },
    click() { tone(660, 0.06, 'square', 0.1); tone(990, 0.06, 'square', 0.08, 0, 0.05); },
    back() { tone(500, 0.07, 'square', 0.1); tone(330, 0.09, 'square', 0.1, 0, 0.06); },
    door() { noise(0.18, 0.5, 300); tone(90, 0.2, 'sawtooth', 0.2, -40); },
    doorOpen() { noise(0.12, 0.3, 500); tone(140, 0.15, 'sawtooth', 0.1, 60); },
    knock() { for (let i = 0; i < 3; i++) { noise(0.08, 0.7, 250, i * 0.2); tone(80, 0.08, 'sine', 0.4, -20, i * 0.2); } },
    step() { noise(0.1, 0.35, 220); tone(60, 0.1, 'sine', 0.3); },
    tap() { tone(1200, 0.03, 'square', 0.1); tone(900, 0.03, 'square', 0.08, 0, 0.12); },
    light() { tone(120, 0.05, 'sawtooth', 0.08); noise(0.05, 0.1, 3000, 0, 'highpass'); },
    cam() { tone(300, 0.05, 'square', 0.08); tone(600, 0.07, 'square', 0.08, 0, 0.04); },
    camSwitch() { noise(0.1, 0.3, 4000, 0, 'highpass'); tone(200, 0.08, 'square', 0.06); },
    blanket() { noise(0.25, 0.25, 600); },
    warn() { tone(880, 0.1, 'square', 0.12); tone(880, 0.1, 'square', 0.12, 0, 0.18); },
    hiss() { noise(0.4, 0.3, 5000, 0, 'highpass'); },
    flee() { tone(600, 0.3, 'sawtooth', 0.12, -450); noise(0.2, 0.2, 2000); },
    scare() { noise(1.2, 0.9, 6000, 0, 'highpass'); tone(110, 1.2, 'sawtooth', 0.4, 600); tone(55, 1.4, 'square', 0.3, 30); tone(880, 0.8, 'sawtooth', 0.2, -500, 0.05); },
    phone() { for (let i = 0; i < 4; i++) { tone(1400, 0.06, 'square', 0.09, 0, i * 0.12); tone(1100, 0.06, 'square', 0.09, 0, i * 0.12 + 0.06); } },
    blip() { tone(300 + Math.random() * 200, 0.03, 'square', 0.05); },
    bell() { [0, 4, 7, 12].forEach((s, i) => tone(N(72 + s), 0.9, 'triangle', 0.18, 0, i * 0.18)); },
    win() { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(N(72 + s), 0.4, 'square', 0.12, 0, i * 0.11)); },
    lose() { [7, 5, 3, 0].forEach((s, i) => tone(N(60 + s), 0.5, 'sawtooth', 0.15, 0, i * 0.3)); },
    power() { tone(300, 1.2, 'sawtooth', 0.25, -270); noise(0.8, 0.3, 400); },
    ability() { tone(200, 0.3, 'sawtooth', 0.15, 700); noise(0.3, 0.2, 3000); },
    hit() { noise(0.15, 0.5, 800); tone(100, 0.15, 'square', 0.2, -60); },
    // caja de música de Don Apagón
    musicBox() {
      const mel = [76, 74, 70, 74, 76, 74, 70, 74, 76, 79, 76, 74, 72, 70, 69, 70];
      mel.forEach((n, i) => tone(N(n), 0.5, 'triangle', 0.12, 0, i * 0.3));
    },

    // ======== MÚSICA DE TERROR (generativa) ========
    horrorStart() {
      if (!ac || hor) return;
      const t0 = ac.currentTime, out = ac.createGain(); out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime(1, t0 + 3);
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 5; comp.attack.value = 0.02; comp.release.value = 0.3; out.connect(comp); comp.connect(master);
      const irLen = Math.floor(ac.sampleRate * 3.4), ir = ac.createBuffer(2, irLen, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.8); }
      const conv = ac.createConvolver(); conv.buffer = ir; const rev = ac.createGain(); rev.gain.value = 0.6; conv.connect(rev); rev.connect(out);
      const wet = ac.createGain(); wet.gain.value = 1; wet.connect(conv);
      const nodes = [], timers = []; let tens = 0, tensT = 0, dead = false, bar = 0, step = 0;
      const later = (fn, a, b) => { const id = setTimeout(() => { if (!dead) { fn(); later(fn, a, b); } }, (a + Math.random() * (b - a)) * 1000); timers.push(id); };
      const note = (m, type, t, dur, vol, atk, dest, wetAmt = 0.4, detune = 0) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = N(m); o.detune.value = detune; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(dest); if (wetAmt) { const w = ac.createGain(); w.gain.value = wetAmt; g.connect(w); w.connect(wet); } o.start(t); o.stop(t + dur + 0.1); };
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200; f.Q.value = 5; const dg = ac.createGain(); dg.gain.value = 0.06;
      [[33, 'sawtooth'], [33.2, 'sawtooth'], [45, 'triangle'], [21, 'sine']].forEach(([m, ty]) => { const o = ac.createOscillator(); o.type = ty; o.frequency.value = m < 40 ? N(m + 12) / 2 : N(m); o.connect(f); o.start(); nodes.push(o); });
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.07; const lg = ac.createGain(); lg.gain.value = 130; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); nodes.push(lfo); f.connect(dg); dg.connect(out);
      const shg = ac.createGain(); shg.gain.value = 0; shg.connect(out); [1568, 1661, 2349].forEach(fr => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = fr; o.connect(shg); o.start(); nodes.push(o); });
      const wob = ac.createOscillator(); wob.frequency.value = 5.5; const wg = ac.createGain(); wg.gain.value = 0.012; wob.connect(wg); wg.connect(shg.gain); wob.start(); nodes.push(wob);
      // progresión en La menor: Am - F - Dm - E
      const prog = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]], roots = [33, 29, 26, 28];
      const padFilter = ac.createBiquadFilter(); padFilter.type = 'lowpass'; padFilter.frequency.value = 700; padFilter.Q.value = 1.2; padFilter.connect(out); const padSend = ac.createGain(); padSend.gain.value = 0.5; padFilter.connect(padSend); padSend.connect(wet);
      const chord = () => { const t = ac.currentTime, ch = prog[bar % 4], r = roots[bar % 4]; ch.forEach(m => { for (const d of [-7, 7]) note(m, 'sawtooth', t, 8.5, 0.018, 2.6, padFilter, 0, d); }); note(r, 'sine', t, 8, 0.1, 0.8, out, 0.1); note(r + 12, 'triangle', t, 7, 0.03, 1.5, out, 0.3); bar++; };
      timers.push(setTimeout(() => { if (!dead) { chord(); timers.push(setInterval(() => { if (!dead) chord(); }, 8000)); } }, 300));
      // caja de música: nana en menor con alguna nota falsa
      const phrases = [[76, 72, 74, 71, 72, 69, 71, 68], [69, 72, 76, 75, 76, 72, 69, 0], [81, 79, 76, 74, 72, 71, 69, 0], [72, 76, 79, 76, 77, 74, 71, 0]];
      const box = () => { const ph = phrases[Math.random() * phrases.length | 0], t = ac.currentTime + 0.05, sp = 0.5 + Math.random() * 0.1, wb = (Math.random() - 0.5) * 20; ph.forEach((m, i) => { if (!m) return; if (Math.random() < 0.1) m += 1; const tt = t + i * sp; note(m, 'triangle', tt, 1.6, 0.07, 0.005, out, 0.7, wb); note(m + 12, 'sine', tt, 1.1, 0.028, 0.005, out, 0.7, wb); note(m + 24, 'sine', tt, 0.5, 0.01, 0.003, out, 0.7, wb); }); };
      timers.push(setTimeout(() => { if (!dead) box(); }, 1800)); later(box, 12, 22);
      // arpegio nervioso (aparece con la tensión)
      const arp = [45, 52, 57, 60, 57, 52, 48, 55, 60, 64, 60, 55], shift = [0, -4, -7, -5];
      timers.push(setInterval(() => { if (dead || tensT < 0.28) return; const t = ac.currentTime, m = arp[step % arp.length] + shift[(bar + 3) % 4]; step++; const g = ac.createGain(), fl = ac.createBiquadFilter(), o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = N(m); fl.type = 'lowpass'; fl.frequency.setValueAtTime(500 + tensT * 2200, t); fl.frequency.exponentialRampToValueAtTime(180, t + 0.12); g.gain.setValueAtTime(0.016 + tensT * 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(fl); fl.connect(g); g.connect(out); const w = ac.createGain(); w.gain.value = 0.3; g.connect(w); w.connect(wet); o.start(t); o.stop(t + 0.16); }, 145));
      // tic-tac de reloj
      let tk = 0; timers.push(setInterval(() => { if (dead) return; tk++; const t = ac.currentTime, b = ac.createBufferSource(), len = Math.floor(ac.sampleRate * 0.03), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); b.buffer = buf; const hp = ac.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = tk % 2 ? 2800 : 2100; hp.Q.value = 3; const g = ac.createGain(); g.gain.value = 0.05 + tensT * 0.04; b.connect(hp); hp.connect(g); g.connect(out); b.start(t); }, 1000));
      // crujidos, golpes lejanos, susurros y rasguños
      const nz = (dur, fn) => { const n = ac.createBufferSource(), len = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; n.buffer = b; fn(n, ac.currentTime); n.start(ac.currentTime); };
      later(() => { const r = Math.random(); if (r < 0.3) nz(1.5, (n, t) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 9; bp.frequency.setValueAtTime(240, t); bp.frequency.exponentialRampToValueAtTime(900 + Math.random() * 500, t + 1.4); const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.15, t + 0.6); g.gain.linearRampToValueAtTime(0.0001, t + 1.5); n.connect(bp); bp.connect(g); g.connect(out); }); else if (r < 0.55) { noise(0.3, 0.3, 150); tone(48, 0.5, 'sine', 0.25, -16); } else if (r < 0.8) nz(2.4, (n, t) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.value = 2300; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.055, t + 1.1); g.gain.linearRampToValueAtTime(0.0001, t + 2.4); n.connect(bp); bp.connect(g); g.connect(out); g.connect(wet); }); else nz(0.9, (n, t) => { const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 14; bp.frequency.setValueAtTime(1200, t); bp.frequency.exponentialRampToValueAtTime(3600, t + 0.8); const g = ac.createGain(); g.gain.setValueAtTime(0.07, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); n.connect(bp); bp.connect(g); g.connect(out); g.connect(wet); }); }, 8, 18);
      // latido del corazón
      const beat = () => { if (dead) return; const t = ac.currentTime, v = 0.1 + tensT * 0.42; [[0, v], [0.2, v * 0.7]].forEach(([d, vv]) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(72, t + d); o.frequency.exponentialRampToValueAtTime(36, t + d + 0.18); g.gain.setValueAtTime(vv, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.22); o.connect(g); g.connect(out); o.start(t + d); o.stop(t + d + 0.25); }); timers.push(setTimeout(beat, 60000 / (46 + tensT * 100))); };
      timers.push(setTimeout(beat, 2200));
      timers.push(setInterval(() => { if (dead) return; tensT += (tens - tensT) * 0.12; f.frequency.value = 180 + tensT * 750; padFilter.frequency.value = 600 + tensT * 1200; dg.gain.value = 0.06 + tensT * 0.07; shg.gain.setTargetAtTime(Math.max(0, tensT - 0.5) * 0.05, ac.currentTime, 0.2); }, 100));
      hor = { out, nodes, timers, set(v) { tens = v; }, stop() { dead = true; timers.forEach(id => { clearTimeout(id); clearInterval(id); }); const t = ac.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 1.2); setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 1400); } };
    },
    horrorStop() { if (hor) { hor.stop(); hor = null; } },
    setTension(v) { if (hor) hor.set(Math.max(0, Math.min(1, v))); },
    // música de menú
    musicStart(kind) {
      api.musicStop(); if (!ac) return;
      let step = 0;
      const lead = [69, 0, 72, 0, 76, 0, 72, 0, 69, 0, 71, 0, 74, 0, 71, 0, 67, 0, 71, 0, 74, 0, 71, 0, 69, 72, 76, 72, 69, 0, 0, 0];
      const bass = [45, 45, 52, 45, 43, 43, 50, 43];
      const leadB = [57, 0, 60, 0, 64, 0, 60, 0, 57, 0, 59, 0, 62, 0, 59, 0];
      musicTimer = setInterval(() => {
        if (kind === 'menu') {
          const n = lead[step % lead.length]; if (n) tone(N(n), 0.16, 'square', 0.05);
          if (step % 4 === 0) tone(N(bass[(step / 4 | 0) % bass.length]), 0.3, 'triangle', 0.14);
          if (step % 8 === 4) noise(0.05, 0.12, 6000, 0, 'highpass');
        } else if (kind === 'vs') {
          const n = lead[(step * 3) % lead.length]; if (n) tone(N(n + 7), 0.1, 'square', 0.04);
          if (step % 2 === 0) tone(N(bass[(step / 2 | 0) % bass.length] - 5), 0.15, 'sawtooth', 0.07);
          if (step % 4 === 2) noise(0.04, 0.1, 7000, 0, 'highpass');
        } else if (kind === 'win') {
          const n = leadB[step % leadB.length]; if (n) tone(N(n + 12), 0.14, 'square', 0.05);
        }
        step++;
      }, kind === 'vs' ? 110 : 150);
    },
    musicStop() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; },
    // ambiente de noche (zumbido grave)
    droneStart() {
      api.droneStop(); if (!ac) return;
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 55; o2.type = 'sine'; o2.frequency.value = 82.6; g.gain.value = 0.045;
      l.frequency.value = 0.15; lg.gain.value = 0.02; l.connect(lg); lg.connect(g.gain);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(); o2.start(); l.start();
      droneNodes = [o, o2, l, g];
    },
    droneStop() { if (droneNodes) { try { droneNodes[3].gain.value = 0; droneNodes.slice(0, 3).forEach(n => n.stop()); } catch (e) {} droneNodes = null; } },
    droneLevel(v) { if (droneNodes) droneNodes[3].gain.value = v; }
  };
  return api;
})();
