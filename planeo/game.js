'use strict';
/* =====================================================================
   PLANEO · la ardilla planeadora
   Canvas 2D con pseudo-3D (perspectiva). Sin dependencias.
   El nivel es determinista (depende de la distancia recorrida, no del
   tiempo), así los fantasmas pueden compararse entre jugadores.
   ===================================================================== */
(() => {
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function hash2(a,b){let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
const rgb = (c, a) => a === undefined ? `rgb(${c[0]|0},${c[1]|0},${c[2]|0})` : `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const mix = (a, b, t) => [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];

/* ---------------------------------------------------------------- constantes */
const LANES = 5;
const L_SKY = 3600;            // metros de descenso por el cielo
const L_GROUND = 1000;         // metros ya en tierra
const L = L_SKY + L_GROUND;    // meta
const START_ALT = 1800;        // altitud mostrada al inicio
const VIEW = 170;              // distancia de dibujo
const Z0 = 26;                 // factor de perspectiva
const SEED = 7;                // nivel fijo (los fantasmas dependen de esto)
const CALM_A = L_SKY - 260, CALM_B = L_SKY + 110;  // zona tranquila de aterrizaje
const CHECKPOINTS = [L_SKY * 0.25, L_SKY * 0.5, L_SKY * 0.75, L_SKY + 120];
const GHOST_COLORS = ['#4aa3ff', '#7bdc65', '#c78bff', '#ffd23f', '#ff8fb5', '#38d6c2'];

/* ---------------------------------------------------------------- canvas */
const canvas = $('c'), ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1, laneW = 100, yH = 0, sY = 0, cx = 0;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  laneW = Math.min(W / 5.4, H * 0.2);
  yH = H * 0.4; sY = H * 0.8; cx = W / 2;
}
window.addEventListener('resize', resize);
resize();

/* proyección: z metros por delante, lat en carriles desde el centro, h píxeles de altura (a escala 1) */
function proj(z, lat, h){
  const s = 1 / (1 + z / Z0);
  return { s, x: cx + lat * laneW * s, y: yH + (sY - yH - h) * s };
}

/* ---------------------------------------------------------------- almacenamiento */
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};

/* ---------------------------------------------------------------- nivel */
let LEVEL = null;
function genLevel(seed){
  const rnd = mulberry32(seed);
  const R = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const objs = [], scenery = [];
  let P = 100, safe = 2, prevP = 30;
  while (P < L - 80){
    const d = P / L;
    const calm = P > CALM_A && P < CALM_B;
    const ground = P >= CALM_B;
    const gap = lerp(42, 27, d) + R(0, 6);
    let kind;
    if (calm) kind = 'trail';
    else {
      const r = rnd();
      if (ground) kind = r < 0.55 ? 'wall' : r < 0.82 ? 'mover' : 'trail';
      else kind = r < 0.55 ? 'wall' : (r < 0.8 && d > 0.08) ? 'mover' : 'trail';
    }
    let newSafe = safe;
    if (kind === 'wall'){
      newSafe = clamp(safe + R(-2, 2), 0, 4);
      const n = d < 0.25 ? R(1, 2) : d < 0.6 ? R(2, 3) : R(2, 4);
      const free = new Set([newSafe]);
      while (free.size < 5 - n) free.add(R(0, 4));
      for (let l = 0; l < LANES; l++){
        if (free.has(l)) continue;
        let type;
        if (ground) type = rnd() < 0.72 ? 'tree' : 'bush';
        else type = (d > 0.4 && rnd() < 0.3) ? 'storm' : 'cloud';
        objs.push({ type, P, lane: l, v: rnd(), sc: 0.95 + rnd() * 0.22 });
      }
    } else if (kind === 'mover'){
      const two = d > 0.3 && rnd() < 0.5;
      const mt = ground ? 'hog' : 'bird';
      const base = ground ? 3.4 : 2.3;
      let free;
      if (two){
        const combos = [[0, 2, 4], [0, 3, 2], [1, 3, 0]];
        const c = combos[R(0, 2)];
        for (let k = 0; k < 2; k++) objs.push({ type: mt, P, a: c[k], b: c[k] + 1, per: base + rnd() * 0.9, ph: rnd() * 6.28, v: rnd(), sc: 1 });
        free = c[2];
      } else {
        const w = (d > 0.2 && rnd() < 0.5) ? 2 : 1;
        const a0 = R(0, 4 - w);
        objs.push({ type: mt, P, a: a0, b: a0 + w, per: base + rnd() * 0.9, ph: rnd() * 6.28, v: rnd(), sc: 1 });
        let best = -1, bd = 99;
        for (let l = 0; l < LANES; l++){
          if (l >= a0 && l <= a0 + w) continue;
          if (Math.abs(l - safe) < bd){ bd = Math.abs(l - safe); best = l; }
        }
        free = best;
        // arbusto/nube extra en un carril libre, para variar
        if (d > 0.15 && rnd() < 0.5){
          const cand = []; for (let l = 0; l < LANES; l++) if (l !== free && (l < a0 || l > a0 + w)) cand.push(l);
          if (cand.length){ objs.push({ type: ground ? 'bush' : 'cloud', P, lane: cand[R(0, cand.length - 1)], v: rnd(), sc: 1 }); }
        }
        // bellota dorada arriesgada dentro de la zona del bicho
        if (rnd() < 0.55) objs.push({ type: 'gold', P: P - 11, lane: a0 + R(0, w), taken: false });
      }
      newSafe = free;
    } else {
      newSafe = clamp(safe + R(-2, 2), 0, 4);
    }
    // rastro de bellotas de la fila anterior a esta, guiando hacia el hueco libre
    if (kind === 'trail' || rnd() < 0.7){
      const from = prevP + 10, to = P - 9;
      const step = calm ? 5 : 6;
      const n = Math.max(0, Math.floor((to - from) / step));
      if (n > 1){
        const special = rnd();
        for (let i = 0; i < n; i++){
          const t = n === 1 ? 1 : i / (n - 1);
          const lane = Math.round(lerp(safe, newSafe, smooth(t)));
          let type = 'acorn';
          if (i === (n >> 1)){ if (special < 0.07 && !calm) type = 'heart'; else if (special < 0.17) type = 'gold'; }
          objs.push({ type, P: from + i * step, lane, taken: false });
        }
      }
    }
    safe = newSafe; prevP = P;
    P += gap;
  }
  objs.sort((a, b) => a.P - b.P);
  // decoración lateral (no colisiona)
  for (let p = 30; p < L + 160; p += R(13, 24)){
    const side = rnd() < 0.5 ? -1 : 1;
    const lat = side * (3.3 + rnd() * 5.5);
    if (p < L_SKY - 100 || rnd() < 0.18) scenery.push({ type: 'puff', P: p, lat, h: R(-40, 420), sc: 0.8 + rnd() * 1.2, v: rnd() });
    if (p > L_SKY - 100) scenery.push({ type: rnd() < 0.8 ? 'stree' : 'srock', P: p, lat: side * (3.2 + rnd() * 4.5), sc: 0.8 + rnd() * 0.7, v: rnd() });
  }
  scenery.sort((a, b) => a.P - b.P);
  return { objs, scenery };
}
function lowerBound(arr, p){
  let lo = 0, hi = arr.length;
  while (lo < hi){ const m = (lo + hi) >> 1; if (arr[m].P < p) lo = m + 1; else hi = m; }
  return lo;
}
function laneOf(o, t){
  if (o.a === undefined) return o.lane;
  return o.a + (o.b - o.a) * (0.5 + 0.5 * Math.sin(6.2832 * t / o.per + o.ph));
}

/* ---------------------------------------------------------------- audio */
const Sound = {
  ctx: null, master: null, muted: store.get('planeo.muted', false), on: false, timer: null, nextT: 0, step: 0, noiseBuf: null,
  init(){
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.7; this.master.connect(c.destination);
      this.dly = c.createDelay(1); this.dly.delayTime.value = 0.42;
      const fb = c.createGain(); fb.gain.value = 0.38; const wet = c.createGain(); wet.gain.value = 0.45;
      this.dly.connect(fb); fb.connect(this.dly); this.dly.connect(wet); wet.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = 0.5; this.mus.connect(this.master); this.mus.connect(this.dly);
      const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setMuted(m){ this.muted = m; store.set('planeo.muted', m); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05); },
  tone(f, t0, dur, type, vol, dest){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  startMusic(){
    if (!this.ctx || this.on) return; this.on = true; this.nextT = this.ctx.currentTime + 0.15; this.step = 0;
    this.timer = setInterval(() => this.sched(), 160);
  },
  stopMusic(){ this.on = false; clearInterval(this.timer); },
  sched(){
    const c = this.ctx; if (!c) return;
    const chords = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]];
    const pent = [0, 2, 4, 7, 9];
    while (this.nextT < c.currentTime + 0.5){
      const bar = Math.floor(this.step / 8) % 4, ch = chords[bar], t = this.nextT;
      if (this.step % 8 === 0){
        ch.forEach(m => {
          const f = 440 * Math.pow(2, (m - 69) / 12);
          const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
          o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 700;
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 1.2); g.gain.linearRampToValueAtTime(0.0001, t + 3.9);
          o.connect(lp); lp.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 4.1);
        });
      }
      if (Math.random() < 0.72){
        const pool = Math.random() < 0.6 ? ch.map(m => m + 12) : pent.map(p => 72 + p);
        const m = pool[Math.floor(Math.random() * pool.length)] + (Math.random() < 0.25 ? 12 : 0);
        this.tone(440 * Math.pow(2, (m - 69) / 12), t, 1.1, 'sine', 0.05, this.mus);
      }
      this.nextT += 0.42; this.step++;
    }
  },
  sfx(name, k){
    const c = this.ctx; if (!c || this.muted) return; const t = c.currentTime;
    const pent = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    if (name === 'acorn'){ const i = Math.min(k | 0, pent.length - 1); this.tone(660 * Math.pow(2, pent[i] / 12), t, 0.28, 'sine', 0.22); this.tone(1320 * Math.pow(2, pent[i] / 12), t, 0.12, 'triangle', 0.05); }
    else if (name === 'gold'){ [0, 4, 7, 12].forEach((n, i) => this.tone(740 * Math.pow(2, n / 12), t + i * 0.06, 0.35, 'triangle', 0.18)); }
    else if (name === 'heart'){ [0, 7, 12].forEach((n, i) => this.tone(520 * Math.pow(2, n / 12), t + i * 0.09, 0.5, 'sine', 0.22)); }
    else if (name === 'hit'){ this.tone(150, t, 0.35, 'sine', 0.5); this.tone(95, t, 0.5, 'triangle', 0.4); this.noise(t, 0.25, 900, 0.3); }
    else if (name === 'dive'){ this.noise(t, 0.6, 1800, 0.18, 500); }
    else if (name === 'brake'){ this.noise(t, 0.5, 600, 0.12, 1200); }
    else if (name === 'cp'){ [0, 7, 12, 16].forEach((n, i) => this.tone(520 * Math.pow(2, n / 12), t + i * 0.1, 0.6, 'sine', 0.2)); }
    else if (name === 'go'){ this.tone(880, t, 0.5, 'sine', 0.25); }
    else if (name === 'tick'){ this.tone(520, t, 0.25, 'sine', 0.2); }
    else if (name === 'fin'){ [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(440 * Math.pow(2, n / 12), t + i * 0.11, 0.8, 'triangle', 0.2)); }
    else if (name === 'fall'){ const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.9);
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 1); }
    else if (name === 'move'){ this.noise(t, 0.07, 2400, 0.04); }
  },
  noise(t, dur, freq, vol, freq2){
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.setValueAtTime(freq, t);
    if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  }
};

/* ---------------------------------------------------------------- fantasmas (guardar / compartir) */
function pushVar(a, n){ n = Math.max(0, Math.floor(n)); while (n >= 128){ a.push((n % 128) | 128); n = Math.floor(n / 128); } a.push(n); }
const zig = n => n >= 0 ? n * 2 : -n * 2 - 1, unzig = u => (u % 2) ? -(u + 1) / 2 : u / 2;
function b64e(bytes){ let s = ''; for (let i = 0; i < bytes.length; i += 0x2000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x2000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64d(str){ str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
async function pipeBytes(bytes, stream){
  const w = stream.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
async function encodeGhost(g){
  const a = [1];
  for (let i = 0; i < 4; i++) a.push((g.seed >>> (8 * i)) & 255);
  pushVar(a, Math.round(g.time * 100)); pushVar(a, g.acorns);
  const nm = new TextEncoder().encode(g.name.slice(0, 14)); a.push(nm.length); nm.forEach(b => a.push(b));
  pushVar(a, g.Ps.length);
  let prev = 0;
  for (let i = 0; i < g.Ps.length; i++){ pushVar(a, zig(g.Ps[i] - prev)); prev = g.Ps[i]; a.push(g.Xs[i]); }
  const raw = new Uint8Array(a);
  if (typeof CompressionStream !== 'undefined'){
    try { return 'z' + b64e(await pipeBytes(raw, new CompressionStream('deflate-raw'))); } catch (e) {}
  }
  return 'r' + b64e(raw);
}
async function decodeGhost(code){
  code = code.trim();
  const m = code.match(/#g=([A-Za-z0-9_\-]+)/); if (m) code = m[1];
  if (!/^[zr][A-Za-z0-9_\-]+$/.test(code)) throw new Error('Código no válido');
  let raw = b64d(code.slice(1));
  if (code[0] === 'z'){
    if (typeof DecompressionStream === 'undefined') throw new Error('Tu navegador no puede leer este código');
    raw = await pipeBytes(raw, new DecompressionStream('deflate-raw'));
  }
  let p = 0; const rv = () => { let n = 0, mul = 1, b; do { b = raw[p++]; n += (b & 127) * mul; mul *= 128; } while (b & 128); return n; };
  if (raw[p++] !== 1) throw new Error('Versión no compatible');
  let seed = 0; for (let i = 0; i < 4; i++) seed += raw[p++] * Math.pow(2, 8 * i);
  const time = rv() / 100, acorns = rv();
  const nl = raw[p++]; const name = new TextDecoder().decode(raw.subarray(p, p + nl)); p += nl;
  const n = rv(); if (n > 5000) throw new Error('Datos corruptos');
  const Ps = new Array(n), Xs = new Array(n); let prev = 0;
  for (let i = 0; i < n; i++){ prev += unzig(rv()); Ps[i] = prev; Xs[i] = raw[p++]; }
  if (p > raw.length) throw new Error('Datos corruptos');
  return { name: name || 'Fantasma', time, acorns, seed: seed >>> 0, Ps, Xs };
}
const Ghosts = {
  list: store.get('planeo.ghosts', []),   // [{id,name,time,acorns,code,mine}]
  save(){ store.set('planeo.ghosts', this.list.map(g => ({ id: g.id, name: g.name, time: g.time, acorns: g.acorns, code: g.code, mine: !!g.mine }))); },
  mine(){ return this.list.find(g => g.mine); },
  async add(code, mine){
    const d = await decodeGhost(code);
    if (d.seed !== SEED) throw new Error('Ese fantasma es de otro nivel');
    const norm = await encodeGhost(d);
    const dup = this.list.find(g => g.time === d.time && g.name === d.name && !!g.mine === !!mine);
    if (dup && !mine) throw new Error('Ya tienes ese fantasma');
    if (mine){ this.list = this.list.filter(g => !g.mine); }
    const g = { id: 'g' + Date.now() + Math.floor(Math.random() * 999), name: d.name, time: d.time, acorns: d.acorns, code: norm, mine: !!mine };
    this.list.push(g);
    if (this.list.filter(x => !x.mine).length > 5){ const i = this.list.findIndex(x => !x.mine); this.list.splice(i, 1); }
    this.save(); return g;
  },
  remove(id){ this.list = this.list.filter(g => g.id !== id); this.save(); },
  async runtime(){
    const out = [];
    for (let i = 0; i < this.list.length; i++){
      const g = this.list[i];
      try {
        const d = await decodeGhost(g.code);
        out.push({ name: g.mine ? 'Tu mejor' : g.name, time: d.time, mine: g.mine, color: g.mine ? '#ffffff' : GHOST_COLORS[i % GHOST_COLORS.length],
          Ps: Float32Array.from(d.Ps, v => v / 10), Xs: Float32Array.from(d.Xs, v => v / 8) });
      } catch (e) {}
    }
    return out;
  }
};
function ghostAt(g, t){
  const f = t / 0.25, i = Math.floor(f);
  if (i >= g.Ps.length - 1) return null;
  if (i < 0) return { P: g.Ps[0], x: g.Xs[0] };
  const k = f - i;
  return { P: lerp(g.Ps[i], g.Ps[i + 1], k), x: lerp(g.Xs[i], g.Xs[i + 1], k) };
}

/* ---------------------------------------------------------------- estado */
const G = {
  state: 'menu', t: 0, P: 0, vP: 0, x: 2, tgt: 2, bank: 0, hearts: 3, acorns: 0, score: 0, combo: 0, deaths: 0,
  inv: 0, slow: 0, diveT: 0, brakeT: 0, fallT: 0, cp: 20, shake: 0, cd: 0, cdShown: 4, flash: 0,
  recT: 0, Ps: [], Xs: [], ghosts: [], tAnim: 0, endT: 0, lastCpShown: -1, finishP: 0, hitFx: 0
};
const keys = { dive: false, brake: false };
const particles = [];
let streaks = [];
for (let i = 0; i < 34; i++) streaks.push({ a: Math.random() * 6.283, r: Math.random(), sp: 0.6 + Math.random() * 0.8 });

function diving(){ return keys.dive || G.diveT > 0; }
function braking(){ return !diving() && (keys.brake || G.brakeT > 0); }
function altFrac(P){ return clamp(1 - P / L_SKY, 0, 1); }
function dropOf(P){ return 520 * Math.pow(altFrac(P), 0.75); }

/* ---------------------------------------------------------------- HUD */
const el = {
  hud: $('hud'), hearts: $('hearts'), pfill: $('pfill'), markers: $('markers'), alt: $('stAlt'), acorns: $('stAcorns'), time: $('stTime'),
  banner: $('banner'), toast: $('toast')
};
let bannerTimer = 0, toastTimer = 0;
function banner(html, ms){
  el.banner.innerHTML = html; el.banner.classList.add('show');
  clearTimeout(bannerTimer); if (ms) bannerTimer = setTimeout(() => el.banner.classList.remove('show'), ms);
}
function toast(msg){
  el.toast.textContent = msg; el.toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2600);
}
const fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
let hudCache = {};
function setText(node, key, v){ if (hudCache[key] !== v){ hudCache[key] = v; node.textContent = v; } }
function updateHud(){
  let h = ''; for (let i = 0; i < 3; i++) h += i < G.hearts ? '❤️' : '🤍';
  setText(el.hearts, 'h', h);
  const inSky = G.P < L_SKY;
  setText(el.alt, 'alt', inSky ? '⛅ ' + Math.round(START_ALT * altFrac(G.P)) + ' m' : '🏁 meta a ' + Math.max(0, Math.round(L - G.P)) + ' m');
  setText(el.acorns, 'ac', '🌰 ' + G.acorns);
  setText(el.time, 'tm', '⏱ ' + fmtTime(G.t));
  el.pfill.style.width = (clamp(G.P / L, 0, 1) * 100).toFixed(1) + '%';
  const ms = el.markers.children;
  for (let i = 0; i < G.ghosts.length; i++){
    const g = G.ghosts[i], node = ms[i + 1]; if (!node) continue;
    const s = ghostAt(g, G.t);
    node.style.left = (s ? clamp(s.P / L, 0, 1) * 100 : 100) + '%';
  }
  if (ms[0]) ms[0].style.left = (clamp(G.P / L, 0, 1) * 100).toFixed(1) + '%';
}
function buildMarkers(){
  el.markers.innerHTML = '';
  const me = document.createElement('div'); me.className = 'mk me'; el.markers.appendChild(me);
  G.ghosts.forEach(g => { const n = document.createElement('div'); n.className = 'mk'; n.style.background = g.color; n.title = g.name; el.markers.appendChild(n); });
}

/* ---------------------------------------------------------------- flujo de juego */
const screens = { menu: $('screen-menu'), help: $('screen-help'), ghosts: $('screen-ghosts'), pause: $('screen-pause'), end: $('screen-end') };
function showScreen(name){ for (const k in screens) screens[k].classList.toggle('hidden', k !== name); }

async function startGame(){
  Sound.init(); Sound.startMusic();
  if (!LEVEL) LEVEL = genLevel(SEED);
  LEVEL.objs.forEach(o => { o.hit = false; if (o.taken !== undefined) o.taken = false; });
  G.ghosts = await Ghosts.runtime();
  Object.assign(G, { state: 'countdown', t: 0, P: 0, vP: 0, x: 2, tgt: 2, bank: 0, hearts: 3, acorns: 0, score: 0, combo: 0, deaths: 0,
    inv: 0, slow: 0, diveT: 0, brakeT: 0, fallT: 0, cp: 20, shake: 0, cd: 3.4, cdShown: 4, flash: 0, recT: 0, Ps: [], Xs: [], endT: 0, finishP: 0 });
  particles.length = 0; keys.dive = keys.brake = false;
  buildMarkers(); hudCache = {};
  showScreen(null); el.hud.classList.remove('hidden');
  banner('', 0); el.banner.classList.remove('show');
}
function goMenu(){
  G.state = 'menu'; showScreen('menu'); el.hud.classList.add('hidden'); el.banner.classList.remove('show'); refreshMenu();
}
function pauseGame(){
  if (G.state !== 'playing' && G.state !== 'countdown') return;
  G.prevState = G.state; G.state = 'paused'; showScreen('pause');
}
function resumeGame(){ if (G.state !== 'paused') return; G.state = G.prevState || 'playing'; showScreen(null); }

function move(dir){
  if (G.state !== 'playing' && G.state !== 'countdown') return;
  const n = clamp(G.tgt + dir, 0, LANES - 1);
  if (n !== G.tgt){ G.tgt = n; Sound.sfx('move'); }
}
function doDive(){ if (G.diveT <= 0 && !keys.dive) Sound.sfx('dive'); G.diveT = 1.3; G.brakeT = 0; }
function doBrake(){ if (G.brakeT <= 0 && !keys.brake) Sound.sfx('brake'); G.brakeT = 1.3; G.diveT = 0; }

function burst(x, y, color, n, spd, size){
  for (let i = 0; i < n; i++){
    const a = Math.random() * 6.283, v = (0.3 + Math.random()) * spd;
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.2, life: 0.5 + Math.random() * 0.5, max: 1, color, size: size * (0.6 + Math.random() * 0.8), g: 200 });
  }
}
function playerScreen(){
  const drop = dropOf(G.P);
  const h = (0.25 + 0.17 * clamp(drop / 80, 0, 1)) * laneW;
  return { x: cx + (G.x - 2) * laneW, y: sY - h, h };
}

function hurt(o){
  o.hit = true; G.hearts--; G.inv = 1.8; G.slow = 0.9; G.shake = 14; G.combo = 0; G.flash = 0.35;
  Sound.sfx('hit');
  const p = playerScreen();
  burst(p.x, p.y, o.type === 'bird' ? '#9cc7ff' : (o.type === 'storm' ? '#8a93ad' : '#ffffff'), 22, 260, 9);
  if (G.hearts <= 0){ G.fallT = 1.6; G.vP = 0; Sound.sfx('fall'); banner('¡Uy!<small>Volvemos al último punto de control</small>', 1500); }
}
function collect(o){
  o.taken = true;
  const p = playerScreen();
  if (o.type === 'heart'){
    if (G.hearts < 3){ G.hearts++; } else { G.acorns += 5; }
    Sound.sfx('heart'); burst(p.x, p.y, '#ff7aa8', 16, 200, 8); toast('¡Corazón!');
  } else {
    const val = (o.type === 'gold' ? 5 : 1) * (diving() ? 2 : 1);
    G.acorns += val; G.combo++;
    Sound.sfx(o.type === 'gold' ? 'gold' : 'acorn', G.combo - 1);
    burst(p.x, p.y, o.type === 'gold' ? '#ffe36b' : '#ffc27a', o.type === 'gold' ? 18 : 8, 170, 6);
    if (G.combo > 0 && G.combo % 10 === 0) toast('¡Racha de ' + G.combo + '!');
  }
}
function hitRadius(o){ return o.type === 'bird' ? 0.62 : o.type === 'hog' ? 0.6 : o.type === 'bush' ? 0.6 : 0.68; }

function finishGame(){
  G.state = 'finished'; G.endT = 0; G.finishP = G.P;
  Sound.sfx('fin'); G.flash = 0; banner('¡Meta! 🎉', 0);
  for (let i = 0; i < 80; i++) particles.push({ x: Math.random() * W, y: -10 - Math.random() * 120, vx: (Math.random() - 0.5) * 120, vy: 80 + Math.random() * 200, life: 3 + Math.random() * 2, max: 1,
    color: ['#ff7a59', '#ffd23f', '#7bdc65', '#4aa3ff', '#c78bff'][i % 5], size: 5 + Math.random() * 5, g: 40, confetti: true });
}

async function showEnd(){
  el.banner.classList.remove('show');
  const time = G.t, score = Math.round(G.acorns * 10 + Math.max(0, 330 - time) * 3 - G.deaths * 50);
  const prevBest = store.get('planeo.best', null);
  const rec = !prevBest || time < prevBest.time;
  const recScore = !prevBest || score > (prevBest.score || 0);
  const best = { time: rec ? time : prevBest.time, score: Math.max(score, prevBest ? prevBest.score || 0 : 0) };
  store.set('planeo.best', best);
  const name = (store.get('planeo.name', '') || 'Ardilla').slice(0, 14);
  let mine = Ghosts.mine();
  if (rec){
    try { mine = await Ghosts.add(await encodeGhost({ seed: SEED, time, acorns: G.acorns, name, Ps: G.Ps, Xs: G.Xs }), true); } catch (e) {}
  }
  G.lastCode = mine ? mine.code : null;
  $('endTitle').textContent = rec ? '¡Nuevo récord! 🏆' : '¡Aterrizaste! 🎉';
  $('endStats').innerHTML =
    `<div class="stat"><b>${fmtTime(time)}</b><span>TIEMPO</span></div>` +
    `<div class="stat"><b>${G.acorns} 🌰</b><span>BELLOTAS</span></div>` +
    `<div class="stat"><b>${score}${recScore ? ' ⭐' : ''}</b><span>PUNTOS</span></div>` +
    `<div class="stat"><b>${G.deaths}</b><span>CAÍDAS</span></div>`;
  const rows = [{ name: name + ' (tú)', time, you: true }];
  G.ghosts.forEach(g => rows.push({ name: g.name, time: g.time }));
  rows.sort((a, b) => a.time - b.time);
  $('endRank').innerHTML = rows.length > 1
    ? '<h3 style="margin:6px 0">Carrera</h3>' + rows.map((r, i) => `<div class="rk ${r.you ? 'you' : ''}"><em>${i + 1}</em><b>${esc(r.name)}</b><span>${fmtTime(r.time)}.${String(Math.floor((r.time % 1) * 10))}</span></div>`).join('')
    : '<p class="sub">Esta partida quedó guardada como tu fantasma. ¡Intenta superarla o mándasela a un amigo!</p>';
  showScreen('end'); el.hud.classList.add('hidden');
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------------------------------------------------------- actualización */
function update(dt){
  G.tAnim += dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40);
  if (G.flash > 0) G.flash = Math.max(0, G.flash - dt);
  // partículas
  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i]; p.life -= dt; if (p.life <= 0 || p.y > H + 40){ particles.splice(i, 1); continue; }
    p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  if (G.state === 'countdown'){
    G.x += (G.tgt - G.x) * Math.min(1, dt * 13); G.bank = lerp(G.bank, (G.tgt - G.x) * 0.9, Math.min(1, dt * 10));
    G.cd -= dt;
    const n = Math.ceil(G.cd);
    if (n !== G.cdShown && n >= 1 && n <= 3){ G.cdShown = n; banner(String(n) + '<small>¡prepárate para planear!</small>', 0); Sound.sfx('tick'); }
    if (G.cd <= 0){ G.state = 'playing'; banner('¡Planea!', 900); Sound.sfx('go'); }
    return;
  }
  if (G.state === 'finished'){
    G.endT += dt; G.vP += (6 - G.vP) * Math.min(1, dt * 2); G.P += G.vP * dt;
    G.x += (2 - G.x) * Math.min(1, dt * 3); G.bank *= 0.9;
    if (G.endT > 2.2 && !G.ending){ G.ending = true; showEnd().then(() => { G.ending = false; }); G.state = 'ended'; }
    return;
  }
  if (G.state !== 'playing') return;

  G.t += dt;
  G.inv = Math.max(0, G.inv - dt); G.slow = Math.max(0, G.slow - dt);
  G.diveT = Math.max(0, G.diveT - dt); G.brakeT = Math.max(0, G.brakeT - dt);
  const d = G.P / L;

  if (G.fallT > 0){
    G.fallT -= dt; G.vP = 0;
    if (G.fallT <= 0){
      G.P = G.cp; G.hearts = 3; G.inv = 3; G.deaths++; G.combo = 0; G.vP = 8; G.x = G.tgt = 2;
      LEVEL.objs.forEach(o => { if (o.P > G.cp - 2 && o.P < G.cp + 60) o.hit = false; });
      banner('¡Otra vez!', 900);
    }
  } else {
    const base = lerp(17, 23, d);
    let m = 1; if (diving()) m *= 1.45; else if (braking()) m *= 0.62; if (G.slow > 0) m *= 0.55;
    G.vP += (base * m - G.vP) * Math.min(1, dt * 2.5);
    const Pprev = G.P; G.P += G.vP * dt;
    // colisiones y recogidas
    const objs = LEVEL.objs;
    for (let i = lowerBound(objs, Pprev - 1.4); i < objs.length && objs[i].P <= G.P + 1.4; i++){
      const o = objs[i]; if (o.hit || o.taken) continue;
      const dx = Math.abs(laneOf(o, G.t) - G.x);
      if (o.type === 'acorn' || o.type === 'gold' || o.type === 'heart'){
        if (dx < 0.8) collect(o);
      } else if (dx < hitRadius(o) && G.inv <= 0) hurt(o);
    }
    // puntos de control
    for (const c of CHECKPOINTS) if (Pprev < c && G.P >= c && c > G.cp){ G.cp = c; banner('🚩 Punto de control', 1200); Sound.sfx('cp'); }
    if (G.P >= L) finishGame();
  }
  G.x += (G.tgt - G.x) * Math.min(1, dt * 13);
  G.bank = lerp(G.bank, (G.tgt - G.x) * 0.9, Math.min(1, dt * 10));
  // grabación del fantasma
  G.recT += dt;
  while (G.recT >= 0.25){ G.recT -= 0.25; G.Ps.push(Math.round(G.P * 10)); G.Xs.push(Math.round(clamp(G.x, 0, 4) * 8)); }
  updateHud();
}

/* ---------------------------------------------------------------- dibujo: fondo */
const SKY_KEYS = [
  { a: 1.0, top: [14, 22, 66], bot: [78, 78, 156] },
  { a: 0.8, top: [44, 58, 126], bot: [236, 146, 156] },
  { a: 0.58, top: [96, 136, 216], bot: [255, 204, 154] },
  { a: 0.32, top: [86, 166, 248], bot: [212, 234, 255] },
  { a: 0.0, top: [72, 178, 255], bot: [228, 247, 255] }
];
function skyAt(a){
  for (let i = 0; i < SKY_KEYS.length - 1; i++){
    const k0 = SKY_KEYS[i], k1 = SKY_KEYS[i + 1];
    if (a <= k0.a && a >= k1.a){ const t = (k0.a - a) / (k0.a - k1.a); return { top: mix(k0.top, k1.top, t), bot: mix(k0.bot, k1.bot, t) }; }
  }
  return SKY_KEYS[0];
}
const STARS = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.4, p: Math.random() * 6 }));
const LAND = ['#78c47a', '#8fd07e', '#6cbb77', '#a4d77f', '#e3d489', '#c8bb7a', '#74b8a8', '#9bcf6f'];
const SEA = ['#ffffff', '#f7f0ff', '#ffe9ee', '#eaf1ff', '#fff4e6'];

function drawBackground(a, sky){
  const g = ctx.createLinearGradient(0, 0, 0, yH + 4);
  g.addColorStop(0, rgb(sky.top)); g.addColorStop(1, rgb(sky.bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // estrellas
  const sa = clamp((a - 0.62) / 0.3, 0, 1);
  if (sa > 0){
    ctx.fillStyle = '#fff';
    for (const s of STARS){ ctx.globalAlpha = sa * (0.5 + 0.5 * Math.sin(G.tAnim * 1.5 + s.p)); ctx.beginPath(); ctx.arc(s.x * W, s.y * yH * 0.95, s.r, 0, 6.283); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // sol
  const su = clamp((0.88 - a) / 0.6, 0, 1);
  if (a < 0.9 && a > 0.05){
    const sx = cx + laneW * 3.2, sy = lerp(yH + 6, yH - H * 0.3, smooth(su));
    const sc = mix([255, 150, 100], [255, 245, 200], su);
    const gr = ctx.createRadialGradient(sx, sy, 4, sx, sy, laneW * 2.2);
    gr.addColorStop(0, rgb(sc, 0.95)); gr.addColorStop(0.2, rgb(sc, 0.35)); gr.addColorStop(1, rgb(sc, 0));
    ctx.fillStyle = gr; ctx.fillRect(sx - laneW * 2.3, sy - laneW * 2.3, laneW * 4.6, laneW * 4.6);
    ctx.fillStyle = rgb(mix(sc, [255, 255, 255], 0.5)); ctx.beginPath(); ctx.arc(sx, sy, Math.max(14, laneW * 0.28), 0, 6.283); ctx.fill();
  }
  // colinas / montañas lejanas
  const hill = clamp((0.62 - a) / 0.5, 0, 1);
  if (hill > 0){
    const par = (G.x - 2) * 14;
    for (let layer = 0; layer < 2; layer++){
      const amp = H * (layer ? 0.05 : 0.09) * hill, off = layer ? 1.7 : 0.4;
      const col = mix(sky.bot, layer ? [118, 178, 150] : [150, 170, 210], layer ? 0.55 : 0.4);
      ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.moveTo(0, yH + 3);
      for (let x = 0; x <= W + 8; x += 8){
        const xx = x - par * (layer ? 1.6 : 0.8);
        const y = yH - amp * (0.5 + 0.28 * Math.sin(xx * (layer ? 0.009 : 0.0045) + off) + 0.22 * Math.sin(xx * (layer ? 0.021 : 0.011) + off * 2.3));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, yH + 3); ctx.closePath(); ctx.fill();
    }
  }
}

function drawGround(a, sky){
  const drop = dropOf(G.P), P = G.P;
  const cover = clamp((a - 0.55) / 0.25, 0, 1);
  const patch = clamp(drop / 180, 0, 1);
  const k = sY - yH + drop;
  const yOf = z => yH + k / (1 + z / Z0);
  // base
  if (a > 0.8){
    const g = ctx.createLinearGradient(0, yH, 0, H);
    g.addColorStop(0, rgb(mix(sky.bot, [255, 255, 255], 0.35))); g.addColorStop(1, rgb(mix(sky.bot, [255, 255, 255], 0.75)));
    ctx.fillStyle = g; ctx.fillRect(0, yH, W, H - yH);
  } else {
    const BAND = 10, base = Math.floor(P / BAND);
    const grass = [128, 207, 116];
    for (let i = Math.ceil(VIEW / BAND) + 1; i >= -3; i--){
      const idx = base + i;
      let z0 = idx * BAND - P, z1 = z0 + BAND; if (z1 <= -18) continue; z0 = Math.max(z0, -18);
      const y0 = yOf(z0), y1 = yOf(z1), yt = Math.min(y0, y1), yb = Math.max(y0, y1);
      if (yt > H) continue;
      const s0 = 1 / (1 + z0 / Z0), s1 = 1 / (1 + z1 / Z0);
      const stripe = (idx & 1) ? 0.95 : 1.02;
      for (let j = -9; j <= 9; j++){
        const hv = hash2(idx * 7 + 3, j + 31), col = LAND[Math.floor(hv * LAND.length)];
        // color de parche con rayas suaves cerca del suelo
        let c = patch >= 1 ? col : null;
        const rc = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
        const m = mix(grass, rc, patch);
        c = rgb([m[0] * stripe, m[1] * stripe, m[2] * stripe]);
        ctx.fillStyle = c;
        const l0 = j * 2 - 1, l1 = j * 2 + 1.04;
        // trapecio en perspectiva
        ctx.beginPath();
        ctx.moveTo(cx + l0 * laneW * s0, y0); ctx.lineTo(cx + l1 * laneW * s0, y0);
        ctx.lineTo(cx + l1 * laneW * s1, y1); ctx.lineTo(cx + l0 * laneW * s1, y1); ctx.closePath(); ctx.fill();
      }
    }
  }
  // mar de nubes (se disuelve al bajar)
  if (cover > 0){
    const BAND = 12, base = Math.floor(P / BAND);
    for (let i = Math.ceil(VIEW / BAND) + 1; i >= 0; i--){
      const idx = base + i;
      const z0 = idx * BAND - P + BAND * 0.5; if (z0 <= 0.4) continue;
      const y = yOf(z0), s = 1 / (1 + z0 / Z0);
      if (y > H + 60) continue;
      for (let j = -9; j <= 9; j++){
        const hv = hash2(idx * 13 + 5, j + 77); if (hv > cover) continue;
        const col = SEA[Math.floor(hash2(idx, j * 3) * SEA.length)];
        const w = laneW * s * (2.4 + 1.6 * hash2(idx + 9, j)), ry = Math.max(3, (yOf(z0 - BAND * 0.5) - yOf(z0 + BAND * 0.5)) * 0.9 + 4);
        const px = cx + (j * 2 + (hash2(idx, j + 4) - 0.5) * 1.6) * laneW * s;
        ctx.fillStyle = col; ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.ellipse(px, y, w, ry, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(px - w * 0.15, y - ry * 0.25, w * 0.65, ry * 0.65, 0, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
  // bruma en el horizonte
  const fg = ctx.createLinearGradient(0, yH - 2, 0, yH + H * 0.16);
  fg.addColorStop(0, rgb(sky.bot, 1)); fg.addColorStop(1, rgb(sky.bot, 0));
  ctx.fillStyle = fg; ctx.fillRect(0, yH - 2, W, H * 0.16 + 2);
  // guías de carril (plano de juego)
  const gl = 0.10 + 0.2 * (1 - patch);
  ctx.strokeStyle = `rgba(255,255,255,${gl})`; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let l = -2.5; l <= 2.5; l += 1){
    const sFar = 1 / (1 + VIEW / Z0), sNear = 1.3;
    ctx.moveTo(cx + l * laneW * sFar, yH + (sY - yH) * sFar); ctx.lineTo(cx + l * laneW * sNear, yH + (sY - yH) * sNear);
  }
  ctx.stroke();
}

function drawStreaks(a, dt){
  const dv = diving() ? 1 : braking() ? 0.15 : 0.45;
  const sky = a > 0.02 ? 1 : 0;
  if (!sky && !diving()) return;
  const vx = cx, vy = yH + 10, maxR = Math.hypot(W, H);
  ctx.lineCap = 'round';
  for (const s of streaks){
    s.r += dt * s.sp * (0.35 + G.vP / 18 * 0.9) * (diving() ? 2.2 : 1) * (0.2 + s.r * 1.6);
    if (s.r > 1){ s.r = 0.03; s.a = Math.random() * 6.283; s.sp = 0.6 + Math.random() * 0.8; }
    const r0 = s.r * maxR * 0.75, r1 = r0 + (6 + s.r * 70) * (0.5 + dv);
    ctx.strokeStyle = `rgba(255,255,255,${(0.05 + 0.3 * s.r) * dv * (diving() ? 1 : 0.8)})`;
    ctx.lineWidth = 1 + s.r * 2.2;
    ctx.beginPath(); ctx.moveTo(vx + Math.cos(s.a) * r0, vy + Math.sin(s.a) * r0 * 0.8); ctx.lineTo(vx + Math.cos(s.a) * r1, vy + Math.sin(s.a) * r1 * 0.8); ctx.stroke();
  }
}

/* ---------------------------------------------------------------- sprites */
function cloudShape(c, w, shade, col, sh){
  const bl = [[-0.32, 0.04, 0.2], [-0.12, -0.1, 0.27], [0.15, -0.07, 0.25], [0.34, 0.05, 0.19], [0, 0.07, 0.24]];
  c.fillStyle = shade;
  for (const b of bl){ c.beginPath(); c.arc(b[0] * w, b[1] * w + sh, b[2] * w, 0, 6.283); c.fill(); }
  c.beginPath(); c.ellipse(0, 0.1 * w + sh, 0.5 * w, 0.14 * w, 0, 0, 6.283); c.fill();
  c.fillStyle = col;
  for (const b of bl){ c.beginPath(); c.arc(b[0] * w, b[1] * w, b[2] * w, 0, 6.283); c.fill(); }
  c.beginPath(); c.ellipse(0, 0.09 * w, 0.48 * w, 0.12 * w, 0, 0, 6.283); c.fill();
}
function drawCloud(c, x, y, w, storm, t, seed){
  c.save(); c.translate(x, y);
  if (storm){
    cloudShape(c, w, '#4b526d', '#7a829e', w * 0.05);
    // ojos enojados
    const ew = w * 0.07;
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-w * 0.14, -0.02 * w, ew, ew * 1.25, 0, 0, 6.283); c.ellipse(w * 0.14, -0.02 * w, ew, ew * 1.25, 0, 0, 6.283); c.fill();
    c.fillStyle = '#222'; c.beginPath(); c.arc(-w * 0.13, 0, ew * 0.5, 0, 6.283); c.arc(w * 0.15, 0, ew * 0.5, 0, 6.283); c.fill();
    c.strokeStyle = '#2a2e44'; c.lineWidth = Math.max(2, w * 0.035); c.lineCap = 'round';
    c.beginPath(); c.moveTo(-w * 0.24, -w * 0.12); c.lineTo(-w * 0.06, -w * 0.06); c.moveTo(w * 0.24, -w * 0.12); c.lineTo(w * 0.06, -w * 0.06); c.stroke();
    if (Math.sin(t * 6 + seed * 9) > 0.8){
      c.fillStyle = '#ffe94d'; c.beginPath(); c.moveTo(-w * 0.03, w * 0.13); c.lineTo(w * 0.07, w * 0.13); c.lineTo(0, w * 0.28); c.lineTo(w * 0.06, w * 0.28); c.lineTo(-w * 0.06, w * 0.46); c.lineTo(-w * 0.02, w * 0.3); c.lineTo(-w * 0.08, w * 0.3); c.closePath(); c.fill();
    }
  } else cloudShape(c, w, '#cdd9f0', '#ffffff', w * 0.045);
  c.restore();
}
function drawBird(c, x, y, w, t, seed){
  c.save(); c.translate(x, y);
  const f = Math.sin(t * 16 + seed * 20) * 0.7;
  c.fillStyle = '#3f86e0';
  c.save(); c.translate(-w * 0.28, -w * 0.02); c.rotate(-0.4 + f); c.beginPath(); c.ellipse(-w * 0.2, 0, w * 0.3, w * 0.1, 0, 0, 6.283); c.fill(); c.restore();
  c.save(); c.translate(w * 0.28, -w * 0.02); c.rotate(0.4 - f); c.beginPath(); c.ellipse(w * 0.2, 0, w * 0.3, w * 0.1, 0, 0, 6.283); c.fill(); c.restore();
  c.fillStyle = '#5aa5ff'; c.beginPath(); c.ellipse(0, 0, w * 0.3, w * 0.28, 0, 0, 6.283); c.fill();
  c.fillStyle = '#eaf3ff'; c.beginPath(); c.ellipse(0, w * 0.1, w * 0.2, w * 0.16, 0, 0, 6.283); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-w * 0.11, -w * 0.06, w * 0.08, 0, 6.283); c.arc(w * 0.11, -w * 0.06, w * 0.08, 0, 6.283); c.fill();
  c.fillStyle = '#1d2240'; c.beginPath(); c.arc(-w * 0.1, -w * 0.05, w * 0.038, 0, 6.283); c.arc(w * 0.1, -w * 0.05, w * 0.038, 0, 6.283); c.fill();
  c.strokeStyle = '#1d2240'; c.lineWidth = Math.max(1.5, w * 0.03); c.lineCap = 'round';
  c.beginPath(); c.moveTo(-w * 0.2, -w * 0.15); c.lineTo(-w * 0.04, -w * 0.1); c.moveTo(w * 0.2, -w * 0.15); c.lineTo(w * 0.04, -w * 0.1); c.stroke();
  c.fillStyle = '#ffa63d'; c.beginPath(); c.moveTo(-w * 0.06, w * 0.0); c.lineTo(w * 0.06, 0); c.lineTo(0, w * 0.12); c.closePath(); c.fill();
  c.restore();
}
function drawHog(c, x, y, w, t, seed){
  c.save(); c.translate(x, y);
  const wob = Math.sin(t * 10 + seed * 20) * w * 0.02;
  c.fillStyle = '#5a3d2b';
  for (let i = 0; i < 15; i++){
    const a = Math.PI + (i / 14) * Math.PI, r = w * 0.34;
    c.beginPath(); c.moveTo(Math.cos(a - 0.17) * r, Math.sin(a - 0.17) * r * 1.05); c.lineTo(Math.cos(a) * (r + w * 0.12), Math.sin(a) * (r + w * 0.13)); c.lineTo(Math.cos(a + 0.17) * r, Math.sin(a + 0.17) * r * 1.05); c.fill();
  }
  c.beginPath(); c.ellipse(0, -w * 0.02, w * 0.36, w * 0.3, 0, 0, 6.283); c.fill();
  c.fillStyle = '#e8c9a0'; c.beginPath(); c.ellipse(0, w * 0.06, w * 0.21, w * 0.2, 0, 0, 6.283); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-w * 0.085, 0, w * 0.055, 0, 6.283); c.arc(w * 0.085, 0, w * 0.055, 0, 6.283); c.fill();
  c.fillStyle = '#1d2240'; c.beginPath(); c.arc(-w * 0.08, 0, w * 0.027, 0, 6.283); c.arc(w * 0.08, 0, w * 0.027, 0, 6.283); c.fill();
  c.fillStyle = '#3b2a22'; c.beginPath(); c.arc(0, w * 0.1, w * 0.035, 0, 6.283); c.fill();
  c.strokeStyle = '#3b2a22'; c.lineWidth = Math.max(1.5, w * 0.025); c.beginPath(); c.moveTo(-w * 0.15, -w * 0.07); c.lineTo(-w * 0.04, -w * 0.045); c.moveTo(w * 0.15, -w * 0.07); c.lineTo(w * 0.04, -w * 0.045); c.stroke();
  c.fillStyle = '#d9b48a'; c.beginPath(); c.ellipse(-w * 0.14 + wob, w * 0.26, w * 0.07, w * 0.04, 0, 0, 6.283); c.ellipse(w * 0.14 - wob, w * 0.26, w * 0.07, w * 0.04, 0, 0, 6.283); c.fill();
  c.restore();
}
function drawTree(c, x, y, w, v){ // y = base en el suelo
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(30,60,30,.22)'; c.beginPath(); c.ellipse(0, 0, w * 0.4, w * 0.08, 0, 0, 6.283); c.fill();
  c.fillStyle = '#7a5235'; c.fillRect(-w * 0.07, -w * 0.5, w * 0.14, w * 0.5);
  c.fillStyle = '#5a3a24'; c.fillRect(w * 0.0, -w * 0.5, w * 0.07, w * 0.5);
  const g1 = v > 0.5 ? ['#3f9d5a', '#4fb36a', '#68c97c'] : ['#4b9e4a', '#62b659', '#82cf70'];
  const lay = [[0, -0.62, 0.42, 0], [-0.02, -0.92, 0.34, 1], [0.01, -1.18, 0.24, 2]];
  for (const l of lay){ c.fillStyle = g1[l[3]]; c.beginPath(); c.arc(l[0] * w, l[1] * w, l[2] * w, 0, 6.283); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(l[0] * w - l[2] * w * 0.3, l[1] * w - l[2] * w * 0.3, l[2] * w * 0.5, 0, 6.283); c.fill(); }
  c.restore();
}
function drawBush(c, x, y, w){
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(30,60,30,.22)'; c.beginPath(); c.ellipse(0, 0, w * 0.4, w * 0.07, 0, 0, 6.283); c.fill();
  c.fillStyle = '#3f9d5a'; c.beginPath(); c.arc(-w * 0.22, -w * 0.16, w * 0.2, 0, 6.283); c.arc(w * 0.2, -w * 0.15, w * 0.21, 0, 6.283); c.fill();
  c.fillStyle = '#58b96c'; c.beginPath(); c.arc(0, -w * 0.24, w * 0.26, 0, 6.283); c.fill();
  c.fillStyle = '#ff6b8a'; for (const p of [[-0.12, -0.28], [0.14, -0.2], [0.02, -0.38], [-0.26, -0.12]]){ c.beginPath(); c.arc(p[0] * w, p[1] * w, w * 0.035, 0, 6.283); c.fill(); }
  c.restore();
}
function drawRock(c, x, y, w){
  c.save(); c.translate(x, y); c.fillStyle = '#9aa3b5'; c.beginPath(); c.ellipse(0, -w * 0.1, w * 0.3, w * 0.2, 0, 0, 6.283); c.fill();
  c.fillStyle = '#b9c1d1'; c.beginPath(); c.ellipse(-w * 0.07, -w * 0.15, w * 0.17, w * 0.1, 0, 0, 6.283); c.fill(); c.restore();
}
function drawAcorn(c, x, y, w, kind, t, seed){
  c.save(); c.translate(x, y + Math.sin(t * 4 + seed * 7) * w * 0.05);
  const sx = 0.55 + 0.45 * Math.abs(Math.cos(t * 3 + seed * 5));
  if (kind === 'heart'){
    const gl = c.createRadialGradient(0, 0, 2, 0, 0, w * 0.7); gl.addColorStop(0, 'rgba(255,120,170,.6)'); gl.addColorStop(1, 'rgba(255,120,170,0)');
    c.fillStyle = gl; c.fillRect(-w, -w, w * 2, w * 2);
    c.scale(1 + 0.08 * Math.sin(t * 6), 1 + 0.08 * Math.sin(t * 6));
    c.fillStyle = '#ff4f86'; c.beginPath(); c.moveTo(0, w * 0.32); c.bezierCurveTo(-w * 0.55, -w * 0.05, -w * 0.3, -w * 0.45, 0, -w * 0.18); c.bezierCurveTo(w * 0.3, -w * 0.45, w * 0.55, -w * 0.05, 0, w * 0.32); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-w * 0.17, -w * 0.12, w * 0.08, w * 0.05, -0.6, 0, 6.283); c.fill();
  } else {
    const gold = kind === 'gold';
    if (gold){ const gl = c.createRadialGradient(0, 0, 2, 0, 0, w * 0.75); gl.addColorStop(0, 'rgba(255,230,100,.7)'); gl.addColorStop(1, 'rgba(255,230,100,0)'); c.fillStyle = gl; c.fillRect(-w, -w, w * 2, w * 2); }
    c.scale(sx, 1);
    c.fillStyle = gold ? '#ffd23f' : '#c98a4b'; c.beginPath(); c.ellipse(0, w * 0.05, w * 0.22 * (gold ? 1.25 : 1), w * 0.27 * (gold ? 1.25 : 1), 0, 0, 6.283); c.fill();
    c.fillStyle = gold ? '#e9a800' : '#7a4a2a'; c.beginPath(); c.ellipse(0, -w * 0.15 * (gold ? 1.25 : 1), w * 0.25 * (gold ? 1.25 : 1), w * 0.12 * (gold ? 1.25 : 1), 0, 0, 6.283); c.fill();
    c.fillRect(-w * 0.02, -w * 0.33 * (gold ? 1.25 : 1), w * 0.04, w * 0.1);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-w * 0.08, w * 0.02, w * 0.04, w * 0.09, 0, 0, 6.283); c.fill();
  }
  c.restore();
}

/* el avioncito con la ardilla (visto desde atrás) */
function drawPlane(c, u, bank, wingCol, t, alpha, dive, flash){
  c.save(); c.globalAlpha = alpha; c.rotate(bank * 0.5); c.scale(1 + Math.abs(bank) * 0.04, 1 - 0.1 * dive + 0.04 * (dive < 0 ? 1 : 0));
  const wing = wingCol || '#ff5a4a', wingD = shade(wing, -38), wingL = shade(wing, 36);
  // hélice (lejos)
  c.save(); c.translate(0, -1.0 * u); c.rotate(t * 40);
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(0, 0, 0.95 * u, 0, 6.283); c.fill();
  c.fillStyle = 'rgba(60,40,30,.45)'; c.fillRect(-0.95 * u, -0.05 * u, 1.9 * u, 0.1 * u);
  c.restore();
  // morro
  c.fillStyle = wingD; c.beginPath(); c.ellipse(0, -0.78 * u, 0.4 * u, 0.42 * u, 0, 0, 6.283); c.fill();
  // alas
  c.fillStyle = wingD; c.beginPath(); c.moveTo(-2.55 * u, 0.12 * u); c.lineTo(-2.3 * u, -0.5 * u); c.lineTo(-0.3 * u, -0.6 * u); c.lineTo(0.3 * u, -0.6 * u); c.lineTo(2.3 * u, -0.5 * u); c.lineTo(2.55 * u, 0.12 * u); c.lineTo(0.3 * u, 0.5 * u); c.lineTo(-0.3 * u, 0.5 * u); c.closePath(); c.fill();
  c.fillStyle = wing; c.beginPath(); c.moveTo(-2.55 * u, 0.0); c.lineTo(-2.3 * u, -0.55 * u); c.lineTo(-0.3 * u, -0.65 * u); c.lineTo(0.3 * u, -0.65 * u); c.lineTo(2.3 * u, -0.55 * u); c.lineTo(2.55 * u, 0.0); c.lineTo(0.3 * u, 0.36 * u); c.lineTo(-0.3 * u, 0.36 * u); c.closePath(); c.fill();
  c.fillStyle = wingL; c.beginPath(); c.moveTo(-2.3 * u, -0.5 * u); c.lineTo(-0.3 * u, -0.6 * u); c.lineTo(-0.3 * u, -0.42 * u); c.lineTo(-2.2 * u, -0.3 * u); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2.3 * u, -0.5 * u); c.lineTo(0.3 * u, -0.6 * u); c.lineTo(0.3 * u, -0.42 * u); c.lineTo(2.2 * u, -0.3 * u); c.closePath(); c.fill();
  c.fillStyle = '#fff6e0';
  for (const sgn of [-1, 1]){ c.beginPath(); c.moveTo(sgn * 1.55 * u, -0.54 * u); c.lineTo(sgn * 2.3 * u, -0.5 * u); c.lineTo(sgn * 2.5 * u, 0.0); c.lineTo(sgn * 1.7 * u, 0.0); c.closePath(); c.fill(); }
  // cola del avión
  c.fillStyle = wingD; c.beginPath(); c.moveTo(-0.38 * u, 0.4 * u); c.lineTo(0.38 * u, 0.4 * u); c.lineTo(0.28 * u, 1.6 * u); c.lineTo(-0.28 * u, 1.6 * u); c.closePath(); c.fill();
  c.fillStyle = wing; c.beginPath(); c.moveTo(-1.2 * u, 1.65 * u); c.lineTo(-0.2 * u, 1.35 * u); c.lineTo(0.2 * u, 1.35 * u); c.lineTo(1.2 * u, 1.65 * u); c.lineTo(0.9 * u, 1.9 * u); c.lineTo(-0.9 * u, 1.9 * u); c.closePath(); c.fill();
  c.fillStyle = wingL; c.beginPath(); c.moveTo(-0.07 * u, 1.55 * u); c.lineTo(0.07 * u, 1.55 * u); c.lineTo(0.06 * u, 0.45 * u); c.lineTo(-0.06 * u, 0.45 * u); c.fill();
  // ardilla: cuerpo + cabeza + gorro
  c.fillStyle = '#b8742f'; c.beginPath(); c.ellipse(0, 0.55 * u, 0.5 * u, 0.55 * u, 0, 0, 6.283); c.fill();
  // bufanda
  const fl = Math.sin(t * 9) * 0.25;
  c.fillStyle = '#fff3d6'; c.beginPath(); c.ellipse(0, 0.14 * u, 0.5 * u, 0.2 * u, 0, 0, 6.283); c.fill();
  c.fillStyle = '#ffd23f';
  c.save(); c.translate(0.35 * u, 0.2 * u); c.rotate(0.9 + fl); c.fillRect(0, -0.08 * u, 0.95 * u, 0.2 * u); c.restore();
  c.save(); c.translate(-0.35 * u, 0.2 * u); c.rotate(Math.PI - 0.9 - fl); c.fillRect(0, -0.08 * u, 0.95 * u, 0.2 * u); c.restore();
  // orejas
  c.fillStyle = '#b8742f';
  c.beginPath(); c.ellipse(-0.47 * u, -0.56 * u, 0.16 * u, 0.24 * u, -0.3, 0, 6.283); c.ellipse(0.47 * u, -0.56 * u, 0.16 * u, 0.24 * u, 0.3, 0, 6.283); c.fill();
  c.fillStyle = '#f2b98a'; c.beginPath(); c.ellipse(-0.47 * u, -0.54 * u, 0.07 * u, 0.13 * u, -0.3, 0, 6.283); c.ellipse(0.47 * u, -0.54 * u, 0.07 * u, 0.13 * u, 0.3, 0, 6.283); c.fill();
  // cabeza
  c.fillStyle = '#d28a3e'; c.beginPath(); c.arc(0, -0.2 * u, 0.58 * u, 0, 6.283); c.fill();
  // gorro de aviador
  c.fillStyle = '#6b4128'; c.beginPath(); c.arc(0, -0.28 * u, 0.6 * u, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(0.55 * u, -0.22 * u); c.lineTo(-0.55 * u, -0.22 * u); c.closePath(); c.fill();
  c.fillStyle = '#82502f'; c.beginPath(); c.ellipse(-0.1 * u, -0.6 * u, 0.28 * u, 0.12 * u, -0.4, 0, 6.283); c.fill();
  // correa de las gafas
  c.fillStyle = '#2b2b3a'; c.fillRect(-0.6 * u, -0.26 * u, 1.2 * u, 0.12 * u);
  c.fillStyle = '#9fe7ff'; c.beginPath(); c.arc(-0.3 * u, -0.5 * u, 0.2 * u, Math.PI, 0); c.arc(0.3 * u, -0.5 * u, 0.2 * u, Math.PI, 0); c.fill();
  // cola de ardilla (grande y esponjosa)
  const tw = Math.sin(t * 3) * 0.12;
  c.save(); c.translate(0, 1.0 * u); c.rotate(tw);
  c.fillStyle = '#b8742f'; c.beginPath(); c.ellipse(0, 0.55 * u, 0.5 * u, 0.85 * u, 0, 0, 6.283); c.fill();
  c.fillStyle = '#e9a45b'; c.beginPath(); c.ellipse(-0.06 * u, 0.5 * u, 0.32 * u, 0.62 * u, 0, 0, 6.283); c.fill();
  c.fillStyle = '#fff3d6'; c.beginPath(); c.ellipse(0, 1.2 * u, 0.4 * u, 0.28 * u, 0, 0, 6.283); c.fill();
  c.strokeStyle = '#8a5522'; c.lineWidth = 0.08 * u; c.beginPath(); c.arc(0, 0.5 * u, 0.5 * u, 0.3, 0.9); c.stroke();
  c.restore();
  if (flash){ c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(0, 0.4 * u, 2.4 * u, 0, 6.283); c.fill(); }
  c.restore();
}
function shade(hex, amt){
  if (hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16), r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}

/* ---------------------------------------------------------------- escena */
function drawScene(dt){
  const a = altFrac(G.P), sky = skyAt(a), drop = dropOf(G.P);
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  drawBackground(a, sky);
  drawGround(a, sky);
  drawStreaks(a, dt);

  // lista de dibujables, de lejos a cerca
  const items = [], P = G.P, t = G.tAnim, gt = G.t;
  const airH = 0.38 * laneW;
  const o = LEVEL.objs;
  for (let i = lowerBound(o, P - 6); i < o.length && o[i].P < P + VIEW; i++){
    const ob = o[i]; if (ob.taken) continue;
    if (ob.hit && (ob.type === 'bird' || ob.type === 'hog')) { /* sigue visible */ }
    items.push({ z: ob.P - P, ob, k: 0 });
  }
  const sc = LEVEL.scenery;
  for (let i = lowerBound(sc, P - 6); i < sc.length && sc[i].P < P + VIEW; i++) items.push({ z: sc[i].P - P, ob: sc[i], k: 1 });
  // fantasmas
  for (const g of G.ghosts){
    const s = ghostAt(g, G.state === 'countdown' ? 0 : G.t); if (!s) continue;
    const z = s.P - P; if (z > -4 && z < VIEW) items.push({ z, g, s, k: 2 });
  }
  // meta
  if (L - P < VIEW && L - P > -6) items.push({ z: L - P, k: 3 });
  items.sort((p, q) => q.z - p.z);

  const pl = playerScreen();
  let playerDone = false;
  const drawPlayer = () => {
    playerDone = true;
    // sombra
    const sh = sY + drop;
    if (sh < H + 30){
      const hh = pl.h + drop, al = clamp(0.28 - hh / 1400, 0.05, 0.28);
      ctx.fillStyle = `rgba(20,40,30,${al})`; ctx.beginPath(); ctx.ellipse(pl.x, sh + 2, laneW * (0.5 - clamp(hh / 1500, 0, 0.2)), laneW * 0.08, 0, 0, 6.283); ctx.fill();
    }
    const blink = G.inv > 0 && Math.floor(G.tAnim * 14) % 2 === 0;
    const u = laneW * 0.23;
    const dv = diving() ? 1 : braking() ? -0.4 : 0;
    ctx.save(); ctx.translate(pl.x, pl.y + (G.fallT > 0 ? (1.6 - G.fallT) * 160 : 0));
    if (G.fallT > 0) ctx.rotate((1.6 - G.fallT) * 3);
    drawPlane(ctx, u, G.bank, '#ff5a4a', t, blink ? 0.45 : 1, dv, G.flash > 0.2);
    ctx.restore();
  };

  for (const it of items){
    if (it.z < 0 && !playerDone) drawPlayer();
    const z = Math.max(it.z, -4);
    if (it.k === 3){ drawFinish(z, drop); continue; }
    const fog = clamp((VIEW - z) / 70, 0, 1) * clamp((z + 6) / 6, 0, 1);
    if (fog <= 0.01) continue;
    if (it.k === 2){
      const p = proj(z, it.s.x - 2, pl.h);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s);
      ctx.globalAlpha = fog * 0.55;
      drawPlane(ctx, laneW * 0.23, 0, it.g.color, t, 0.9, 0, false);
      ctx.globalAlpha = fog; ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.max(11, laneW * 0.16) + 'px system-ui,sans-serif'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(20,30,70,.6)'; ctx.lineWidth = 4; ctx.strokeText(it.g.name, 0, -laneW * 0.75); ctx.fillText(it.g.name, 0, -laneW * 0.75);
      ctx.restore(); continue;
    }
    const ob = it.ob;
    ctx.globalAlpha = fog;
    if (it.k === 1){
      if (ob.type === 'puff'){
        const p = proj(z, ob.lat, ob.h);
        if (ob.h < -drop * 0.5 && a > 0.5) { ctx.globalAlpha = 0; }
        drawCloud(ctx, p.x, p.y, laneW * 1.3 * ob.sc * p.s, false, t, ob.v);
      } else {
        const gp = proj(z, ob.lat, -drop);
        if (ob.type === 'stree') drawTree(ctx, gp.x, gp.y, laneW * 1.1 * ob.sc * gp.s, ob.v);
        else drawRock(ctx, gp.x, gp.y, laneW * 0.9 * ob.sc * gp.s);
      }
      ctx.globalAlpha = 1; continue;
    }
    const lane = laneOf(ob, gt), lat = lane - 2;
    switch (ob.type){
      case 'cloud': case 'storm': { const p = proj(z, lat, airH); drawCloud(ctx, p.x, p.y, laneW * 1.18 * ob.sc * p.s, ob.type === 'storm', t, ob.v); break; }
      case 'bird': { const p = proj(z, lat, airH); drawBird(ctx, p.x, p.y, laneW * 0.9 * p.s, t, ob.v); break; }
      case 'hog': { const p = proj(z, lat, -drop); drawHog(ctx, p.x, p.y - laneW * 0.18 * p.s, laneW * 0.95 * p.s, t, ob.v); break; }
      case 'tree': { const p = proj(z, lat, -drop); drawTree(ctx, p.x, p.y, laneW * 1.35 * ob.sc * p.s, ob.v); break; }
      case 'bush': { const p = proj(z, lat, -drop); drawBush(ctx, p.x, p.y, laneW * 1.0 * ob.sc * p.s); break; }
      case 'acorn': case 'gold': case 'heart': { const p = proj(z, lat, drop > 90 ? airH : airH * 0.85); drawAcorn(ctx, p.x, p.y, laneW * (ob.type === 'gold' ? 0.62 : 0.5) * p.s, ob.type, t, ob.P); break; }
    }
    ctx.globalAlpha = 1;
  }
  if (!playerDone) drawPlayer();

  // partículas
  for (const p of particles){
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;
    if (p.confetti){ ctx.fillRect(p.x, p.y, p.size, p.size * 0.5); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  // bruma al atravesar la capa de nubes
  const mist = Math.max(0, 1 - Math.abs(a - 0.77) / 0.05) * 0.55;
  if (mist > 0){ ctx.fillStyle = `rgba(255,255,255,${mist})`; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0.2){ ctx.fillStyle = `rgba(255,255,255,${(G.flash - 0.2) * 1.2})`; ctx.fillRect(0, 0, W, H); }
  if (G.inv > 0 && G.fallT <= 0 && G.hearts < 3 && G.slow > 0){ ctx.fillStyle = `rgba(255,80,80,${G.slow * 0.12})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

function drawFinish(z, drop){
  const p0 = proj(z, -3.2, -drop), p1 = proj(z, 3.2, -drop), s = p0.s;
  const top = p0.y - laneW * 2.2 * s;
  ctx.fillStyle = '#fff'; ctx.fillRect(p0.x - 6 * s, top, 12 * s, p0.y - top); ctx.fillRect(p1.x - 6 * s, top, 12 * s, p1.y - top);
  const bh = laneW * 0.55 * s, n = 12, bw = (p1.x - p0.x) / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++){ ctx.fillStyle = (i + j) & 1 ? '#27305c' : '#fff'; ctx.fillRect(p0.x + i * bw, top + j * bh / 2, bw + 1, bh / 2); }
  ctx.fillStyle = '#ff7a59'; ctx.font = '900 ' + Math.max(8, laneW * 0.3 * s) + 'px system-ui,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('META', cx, top + bh + laneW * 0.32 * s);
  // línea en el suelo
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(p0.x, p0.y - 3 * s, p1.x - p0.x, 6 * s);
}

/* ---------------------------------------------------------------- menú de fantasmas */
function refreshMenu(){
  const best = store.get('planeo.best', null);
  $('bestLine').textContent = best ? `Mejor tiempo ${fmtTime(best.time)}.${Math.floor((best.time % 1) * 10)} · Mejor puntaje ${best.score}` : 'Aún no has aterrizado. ¡Vamos!';
  const n = Ghosts.list.length; $('ghostCount').textContent = n ? '(' + n + ')' : '';
}
function renderGhostList(){
  const box = $('ghostList');
  if (!Ghosts.list.length){ box.innerHTML = '<div class="empty">Todavía no tienes fantasmas.<br>Termina una partida o pega el código de un amigo.</div>'; return; }
  box.innerHTML = Ghosts.list.map((g, i) => `<div class="gh"><i style="background:${g.mine ? '#fff' : GHOST_COLORS[i % GHOST_COLORS.length]}"></i><b>${g.mine ? 'Tu mejor · ' : ''}${esc(g.name)}</b><span>${fmtTime(g.time)}.${Math.floor((g.time % 1) * 10)}</span><button data-copy="${g.id}" title="Copiar enlace">📋</button><button data-del="${g.id}" title="Borrar">🗑️</button></div>`).join('');
}
async function copyText(txt){
  try { await navigator.clipboard.writeText(txt); return true; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
}
function shareLink(code){ return location.href.split('#')[0] + '#g=' + code; }

/* ---------------------------------------------------------------- entrada */
document.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  const k = e.key;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A'){ move(-1); e.preventDefault(); }
  else if (k === 'ArrowRight' || k === 'd' || k === 'D'){ move(1); e.preventDefault(); }
  else if (k === 'ArrowDown' || k === 's' || k === 'S' || k === ' '){ if (!keys.dive) Sound.sfx('dive'); keys.dive = true; e.preventDefault(); }
  else if (k === 'ArrowUp' || k === 'w' || k === 'W'){ if (!keys.brake) Sound.sfx('brake'); keys.brake = true; e.preventDefault(); }
  else if (k === 'Escape' || k === 'p' || k === 'P'){ G.state === 'paused' ? resumeGame() : pauseGame(); }
  else if (k === 'm' || k === 'M'){ toggleMute(); }
  else if (k === 'Enter' && G.state === 'menu'){ startGame(); }
});
document.addEventListener('keyup', e => {
  const k = e.key;
  if (k === 'ArrowDown' || k === 's' || k === 'S' || k === ' ') keys.dive = false;
  else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.brake = false;
});
let ptr = null;
canvas.addEventListener('pointerdown', e => { Sound.init(); ptr = { x: e.clientX, y: e.clientY, swiped: false, id: e.pointerId }; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
canvas.addEventListener('pointermove', e => {
  if (!ptr || ptr.id !== e.pointerId) return;
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y, T = 32;
  if (Math.abs(dx) > T && Math.abs(dx) >= Math.abs(dy)){ move(dx > 0 ? 1 : -1); ptr.x = e.clientX; ptr.y = e.clientY; ptr.swiped = true; }
  else if (Math.abs(dy) > T){ dy > 0 ? doDive() : doBrake(); ptr.x = e.clientX; ptr.y = e.clientY; ptr.swiped = true; }
});
const endPtr = e => {
  if (!ptr || ptr.id !== e.pointerId) return;
  if (!ptr.swiped && e.type === 'pointerup') move(e.clientX < W / 2 ? -1 : 1);
  ptr = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
window.addEventListener('blur', () => { pauseGame(); keys.dive = keys.brake = false; });
['gesturestart', 'dblclick'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));

function toggleMute(){ Sound.init(); Sound.setMuted(!Sound.muted); $('btnMute').textContent = Sound.muted ? '🔇' : '🔊'; }

/* botones */
$('btnPlay').onclick = () => { store.set('planeo.name', $('inName').value.trim().slice(0, 14)); startGame(); };
$('btnHelp').onclick = () => showScreen('help');
$('btnGhosts').onclick = () => { renderGhostList(); showScreen('ghosts'); };
document.querySelectorAll('.back').forEach(b => b.onclick = () => { showScreen('menu'); refreshMenu(); });
$('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame; $('btnMute').onclick = toggleMute;
$('btnRestart').onclick = startGame; $('btnQuit').onclick = goMenu;
$('btnAgain').onclick = startGame; $('btnEndMenu').onclick = goMenu;
$('btnShare').onclick = async () => {
  if (!G.lastCode){ toast('Aún no hay fantasma guardado'); return; }
  const ok = await copyText(shareLink(G.lastCode)); toast(ok ? 'Enlace copiado: pégalo en un chat' : 'No se pudo copiar');
};
$('btnCopyMine').onclick = async () => {
  const m = Ghosts.mine(); if (!m){ toast('Primero termina una partida'); return; }
  const ok = await copyText(shareLink(m.code)); toast(ok ? 'Enlace copiado' : 'No se pudo copiar');
};
$('btnAddCode').onclick = async () => {
  const v = $('inCode').value.trim(); if (!v) return;
  try { const g = await Ghosts.add(v, false); $('inCode').value = ''; renderGhostList(); toast('Fantasma de ' + g.name + ' añadido 👻'); }
  catch (e) { toast(e.message || 'Código no válido'); }
};
$('ghostList').addEventListener('click', async e => {
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.del){ Ghosts.remove(t.dataset.del); renderGhostList(); }
  else if (t.dataset.copy){ const g = Ghosts.list.find(x => x.id === t.dataset.copy); if (g){ const ok = await copyText(shareLink(g.code)); toast(ok ? 'Enlace copiado' : 'No se pudo copiar'); } }
});
$('inName').value = store.get('planeo.name', '');
$('btnMute').textContent = Sound.muted ? '🔇' : '🔊';

/* ---------------------------------------------------------------- bucle */
let last = performance.now();
function frame(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (LEVEL){
    if (G.state !== 'paused' && G.state !== 'menu') update(dt);
    else { G.tAnim += dt; if (G.state === 'menu'){ G.P = (G.tAnim * 40) % (L_SKY - 300); G.vP = 18; G.x = 2; G.bank = 0; } }
    drawScene(dt);
  } else {
    // fondo de menú: cielo animado
    G.tAnim += dt; G.P = 0;
    const sky = skyAt(1 - (G.tAnim * 0.02) % 1 * 0.9);
    drawBackground(1 - ((G.tAnim * 0.02) % 1) * 0.9, sky);
  }
  requestAnimationFrame(frame);
}
LEVEL = genLevel(SEED);
G.P = 0; G.ghosts = [];
refreshMenu();
requestAnimationFrame(frame);

// enlaces de fantasma (#g=...)
if (location.hash.startsWith('#g=')){
  decodeGhost(location.hash).then(async d => {
    const g = await Ghosts.add(location.hash, false);
    toast('Fantasma de ' + g.name + ' añadido 👻'); refreshMenu();
  }).catch(e => toast(e.message || 'Enlace de fantasma no válido')).finally(() => { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} });
}

// ganchos para pruebas
window.__planeo = { G, LEVEL: () => LEVEL, startGame, update, drawScene, Ghosts, encodeGhost, decodeGhost, constants: { L, L_SKY, SEED }, genLevel };
})();
