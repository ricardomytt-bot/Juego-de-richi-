/* =====================================================================
   PLANEO · la ardilla planeadora  (v2)
   01 · núcleo: utilidades, niveles, temas, canvas, proyección, almacenamiento
   ===================================================================== */
'use strict';
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function hash2(a,b){let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
const rgb = (c, a) => a === undefined ? `rgb(${c[0]|0},${c[1]|0},${c[2]|0})` : `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const mix = (a, b, t) => [lerp(a[0],b[0],t), lerp(a[1],b[1],t), lerp(a[2],b[2],t)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = s => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
const fmtTime1 = s => fmtTime(s) + '.' + Math.floor((s % 1) * 10);
function shade(hex, amt){
  if (hex[0] !== '#') return hex;
  const n = parseInt(hex.slice(1), 16), r = clamp((n >> 16) + amt, 0, 255), g = clamp(((n >> 8) & 255) + amt, 0, 255), b = clamp((n & 255) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
}
function hex2rgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

/* ---------------------------------------------------------------- constantes */
const LANES = 3, MID = 1;   // 3 carriles; el del centro es el 1
const VIEW = 190;              // distancia de dibujo (m)
const Z0 = 26;                 // factor de perspectiva
const GHOST_COLORS = ['#4aa3ff', '#7bdc65', '#c78bff', '#ffd23f', '#ff8fb5', '#38d6c2'];
const FONT = "'Fredoka','Nunito',ui-rounded,'SF Pro Rounded','Segoe UI',system-ui,sans-serif";

/* temas visuales de cada nivel */
const THEMES = {
  dawn: {
    sky: [
      { a: 1.0, top: [14, 22, 66], bot: [78, 78, 156] }, { a: 0.8, top: [44, 58, 126], bot: [236, 146, 156] },
      { a: 0.58, top: [96, 136, 216], bot: [255, 204, 154] }, { a: 0.32, top: [86, 166, 248], bot: [212, 234, 255] },
      { a: 0.0, top: [72, 178, 255], bot: [228, 247, 255] }],
    land: ['#78c47a', '#8fd07e', '#6cbb77', '#a4d77f', '#e3d489', '#c8bb7a', '#74b8a8', '#9bcf6f'],
    grass: [128, 207, 116], sea: ['#f4f6ff', '#ece6fb', '#ffe1e6', '#dfe9ff', '#fff0dc'],
    tint: null, grade: ['rgba(255,206,160,.30)', 'rgba(70,110,255,.22)'], rail: [120, 215, 255], amb: 'sparkle', sun: [255, 245, 200], sunWarm: [255, 150, 100], hasSun: true, stars: 0.62, leaf: '#3f9d5a'
  },
  storm: {
    sky: [
      { a: 1.0, top: [18, 20, 44], bot: [62, 66, 104] }, { a: 0.8, top: [36, 42, 74], bot: [96, 104, 140] },
      { a: 0.55, top: [64, 74, 106], bot: [132, 144, 172] }, { a: 0.3, top: [84, 98, 128], bot: [156, 170, 194] },
      { a: 0.0, top: [98, 114, 142], bot: [178, 192, 210] }],
    land: ['#4f8f66', '#5c9e6e', '#447f5c', '#6aa870', '#7e9b62', '#5d8c7d', '#3f7a64', '#6f9e72'],
    grass: [84, 150, 96], sea: ['#d3d9e8', '#bfc8de', '#e1e5f0', '#aeb9d2', '#c9cfe0'],
    tint: [30, 44, 80, 0.14], grade: ['rgba(150,170,255,.22)', 'rgba(40,60,130,.30)'], rail: [140, 170, 255], amb: 'rain', sun: [220, 230, 255], sunWarm: [200, 210, 240], hasSun: false, stars: 0.9, lightning: true, leaf: '#3b7f58'
  },
  dusk: {
    sky: [
      { a: 1.0, top: [38, 26, 84], bot: [120, 70, 140] }, { a: 0.8, top: [92, 52, 128], bot: [255, 120, 110] },
      { a: 0.58, top: [140, 80, 130], bot: [255, 170, 90] }, { a: 0.32, top: [120, 100, 170], bot: [255, 190, 120] },
      { a: 0.0, top: [96, 96, 168], bot: [255, 208, 154] }],
    land: ['#a1a35a', '#c09a52', '#8f9a4f', '#b7864a', '#7a8f58', '#c4a65f', '#9a7e4a', '#b3a860'],
    grass: [156, 172, 86], sea: ['#ffd9c2', '#ffc3b8', '#ffe6cf', '#e9b6d4', '#ffcfa3'],
    tint: [255, 140, 70, 0.07], grade: ['rgba(255,150,170,.32)', 'rgba(90,60,170,.26)'], rail: [255, 160, 205], amb: 'leaves', sun: [255, 220, 160], sunWarm: [255, 120, 70], hasSun: true, stars: 0.7, leaf: '#c9792f'
  }
};

/* niveles de la historia (también sirven para infinito y multijugador) */
const LEVELS = [
  { id: 0, seed: 111, theme: 'dawn',  name: 'Amanecer sobre las nubes', short: 'Amanecer',  boss: 'crow',  bossName: 'Capitán Grajo',   skyLen: 1700, groundLen: 550, spd0: 19, spd1: 33, diff0: 0.20, span: 0.60 },
  { id: 1, seed: 222, theme: 'storm', name: 'Tormenta de verano',       short: 'Tormenta',  boss: 'storm', bossName: 'Nubarrón Trueno', skyLen: 1700, groundLen: 550, spd0: 21, spd1: 36, diff0: 0.40, span: 0.60 },
  { id: 2, seed: 333, theme: 'dusk',  name: 'Bosque dorado',            short: 'Atardecer', boss: 'owl',   bossName: 'Don Búho',        skyLen: 1700, groundLen: 550, spd0: 23, spd1: 39, diff0: 0.60, span: 0.60 }
];
const LEVEL_SEEDS = LEVELS.map(l => l.seed);
const START_ALT = 1800;


/* compatibilidad: roundRect no existe en navegadores antiguos (iOS < 16) */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r){
    r = Math.min(Array.isArray(r) ? r[0] : (r || 0), w / 2, h / 2);
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
  };
}

/* ---------------------------------------------------------------- canvas */
const canvas = $('c'), ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1, laneW = 100, yH = 0, sY = 0, cx = 0, vignette = null;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  laneW = Math.min(W / 3.6, H * 0.3);
  yH = H * 0.4; sY = H * 0.8; cx = W / 2;
  vignette = document.createElement('canvas'); vignette.width = Math.max(2, Math.round(W / 4)); vignette.height = Math.max(2, Math.round(H / 4));
  const v = vignette.getContext('2d'), g = v.createRadialGradient(vignette.width / 2, vignette.height * 0.5, Math.min(vignette.width, vignette.height) * 0.35, vignette.width / 2, vignette.height * 0.5, Math.hypot(vignette.width, vignette.height) * 0.55);
  g.addColorStop(0, 'rgba(10,10,40,0)'); g.addColorStop(1, 'rgba(10,10,40,.42)'); v.fillStyle = g; v.fillRect(0, 0, vignette.width, vignette.height);
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

/* ---------------------------------------------------------------- nivel activo (se rellena en 03-level.js) */
let LV = null, L_SKY = 1700, L_GROUND = 550, L = 2250, CALM_A = 1500, CALM_B = 1790, CHECKPOINTS = [], THEME = THEMES.dawn;
function altFrac(P){ return clamp(1 - P / L_SKY, 0, 1); }
function dropOf(P){ return 520 * Math.pow(altFrac(P), 0.75); }
