// Audio sintetizado (sin archivos): efectos + música chiptune
const Sfx = (() => {
  let ac = null, master = null, muted = false, musicTimer = null, droneNodes = null;
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
