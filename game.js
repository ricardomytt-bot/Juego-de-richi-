/* RICHI WORLD — un homenaje 3D tipo Super Mario Odyssey. Three.js, sin build. */
(() => {
'use strict';
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
const $ = id => document.getElementById(id);

/* ---------------------------------------------------------------- audio */
let AC;
function tone(f0, f1, dur, type = 'square', vol = 0.08, delay = 0) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* sin audio */ }
}
const SFX = {
  jump: () => tone(300, 640, 0.14),
  jump3: () => { tone(300, 900, 0.2); tone(500, 1100, 0.2, 'square', 0.05, 0.08); },
  coin: () => { tone(988, 988, 0.07, 'square', 0.06); tone(1319, 1319, 0.25, 'square', 0.06, 0.07); },
  hat: () => tone(500, 900, 0.12, 'triangle', 0.1),
  capture: () => { tone(300, 1000, 0.25, 'sawtooth', 0.07); tone(600, 1400, 0.2, 'triangle', 0.08, 0.15); },
  stomp: () => tone(260, 70, 0.18, 'square', 0.1),
  hurt: () => tone(400, 80, 0.4, 'sawtooth', 0.1),
  pound: () => tone(180, 40, 0.3, 'sawtooth', 0.14),
  flag: () => { tone(660, 660, 0.1); tone(880, 880, 0.2, 'square', 0.08, 0.1); },
  moon: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, f, 0.3, 'triangle', 0.1, i * 0.1)),
};

/* ---------------------------------------------------------------- escena */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
{
  const c = document.createElement('canvas'); c.width = 2; c.height = 256;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3c9bff'); g.addColorStop(0.55, '#9fd8ff'); g.addColorStop(1, '#e8f6ff');
  x.fillStyle = g; x.fillRect(0, 0, 2, 256);
  scene.background = new THREE.CanvasTexture(c);
  scene.fog = new THREE.Fog(0xcfeaff, 110, 520);
}
scene.add(new THREE.HemisphereLight(0xdff2ff, 0x7a9a5a, 0.85));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 160 });
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const toonGrad = (() => {
  const t = new THREE.DataTexture(new Uint8Array([105, 175, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const matCache = {};
const lam = c => matCache[c] || (matCache[c] = new THREE.MeshToonMaterial({ color: c, gradientMap: toonGrad }));
const olMat = new THREE.MeshBasicMaterial({ color: 0x1b0d10, side: THREE.BackSide });
let OL = false; // contorno de dibujo animado para personajes
function mesh(geo, mat, x = 0, y = 0, z = 0, parent, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow;
  if (OL) { const o = new THREE.Mesh(geo, olMat); o.scale.setScalar(1.09); m.add(o); }
  if (parent) parent.add(m); return m;
}
// Texturas procedurales (claras, se tiñen con el color del material)
const texBase = {};
function baseTex(kind) {
  if (texBase[kind]) return texBase[kind];
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128);
  const sp = (n, col, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = col; x.fillRect(rnd(128), rnd(128), w, h); } };
  if (kind === 'grass') { sp(60, 'rgba(0,80,0,.13)', 16, 10); sp(90, 'rgba(255,255,200,.35)', 2, 8); sp(50, 'rgba(0,90,0,.2)', 2, 7); }
  else if (kind === 'dirt') { sp(70, 'rgba(60,30,0,.14)', 12, 7); sp(40, 'rgba(255,230,190,.3)', 5, 4); x.fillStyle = 'rgba(60,30,0,.18)'; x.fillRect(0, 60, 128, 3); }
  else if (kind === 'brick') { x.fillStyle = 'rgba(70,60,40,.35)'; for (let r = 0; r < 4; r++) { x.fillRect(0, r * 32, 128, 3); for (let k = 0; k < 2; k++) x.fillRect(((r % 2) * 32 + k * 64) % 128, r * 32, 3, 32); } sp(30, 'rgba(0,0,0,.06)', 10, 8); }
  else if (kind === 'check') { x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64); x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, 0, 128, 4); x.fillRect(0, 0, 4, 128); }
  else if (kind === 'asphalt') { sp(220, 'rgba(0,0,0,.16)', 3, 3); sp(120, 'rgba(255,255,255,.14)', 2, 2); }
  else if (kind === 'sidewalk') { sp(60, 'rgba(0,0,0,.06)', 8, 6); x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, 0, 128, 3); x.fillRect(0, 0, 3, 128); x.fillRect(0, 64, 128, 2); x.fillRect(64, 0, 2, 128); }
  else if (kind === 'roof') { sp(160, 'rgba(0,0,0,.12)', 6, 5); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, 0, 128, 6); x.fillRect(0, 0, 6, 128); }
  else if (kind === 'facade') {
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(0, 118, 128, 10);
    for (let cx = 0; cx < 2; cx++) for (let cy = 0; cy < 3; cy++) {
      const lit = Math.random() < 0.28; x.fillStyle = lit ? '#fff1b0' : 'rgba(25,38,62,.88)'; x.fillRect(12 + cx * 60, 8 + cy * 38, 40, 28);
      x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(12 + cx * 60, 8 + cy * 38, 40, 3);
    }
  }
  else if (kind === 'crate') {
    x.fillStyle = '#e0a02a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#ffd24d'; x.fillRect(10, 10, 108, 108);
    x.fillStyle = '#b87a10'; x.beginPath(); x.arc(64, 64, 30, 0, TAU); x.fill(); x.fillStyle = '#fff3a0'; x.beginPath(); x.arc(64, 64, 22, 0, TAU); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (texBase[kind] = t);
}
function texMat(kind, color, rx, ry) {
  const t = baseTex(kind).clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
  return new THREE.MeshToonMaterial({ color, map: t, gradientMap: toonGrad });
}

/* ---------------------------------------------------------------- mundo */
const solids = [];
function addBox(cx, cz, w, d, top, h, opt = {}) {
  const sc = opt.side ?? 0x9a6a44, tc = opt.top ?? 0x62d25a;
  const sk = opt.sideTex ?? (sc === 0x9a6a44 ? 'dirt' : 'brick'), tk = opt.topTex ?? (tc === 0x62d25a || tc === 0x6edc5f ? 'grass' : 'check');
  const U = opt.unit ?? 4, mx = v => Math.max(1, v / U);
  const sx = texMat(sk, sc, mx(d), mx(h)), sz = texMat(sk, sc, mx(w), mx(h));
  const topM = texMat(tk, tc, mx(w), mx(d));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sx, sx, topM, sz, sz, sz]);
  m.position.set(cx, top - h / 2, cz); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  const b = { mesh: m, w, d, h, min: new V3(cx - w / 2, top - h, cz - d / 2), max: new V3(cx + w / 2, top, cz + d / 2), delta: new V3() };
  solids.push(b); return b;
}
const movers = [];
function addMover(box, fn) { movers.push({ box, fn, prev: new V3(...fn(0)) }); }
function updateMovers(t) {
  for (const m of movers) {
    const [cx, top, cz] = m.fn(t), b = m.box;
    b.delta.set(cx - m.prev.x, top - m.prev.y, cz - m.prev.z); m.prev.set(cx, top, cz);
    b.min.set(cx - b.w / 2, top - b.h, cz - b.d / 2); b.max.set(cx + b.w / 2, top, cz + b.d / 2);
    b.mesh.position.set(cx, top - b.h / 2, cz);
  }
}

function buildWorld() {
  // Isla principal
  addBox(0, 0, 70, 70, 0, 14, { top: 0x6edc5f, side: 0x9a6a44 });
  // Escalera hacia la plataforma B (monedas incluidas)
  for (let i = 0; i < 12; i++) addBox(13 + i * 2, 0, 2, 6, 0.5 * (i + 1), 10, { top: 0xe6dcc4, side: 0xcfc4a8, topTex: 'brick' });
  addBox(43, 0, 14, 14, 6, 3, { top: 0xffc94d, side: 0xc98b2b, topTex: 'brick', sideTex: 'brick' });
  // Recorrido flotante hacia la luna 3
  addBox(43, 11, 4, 4, 6.6, 1.2, { top: 0xff8ad1, side: 0xb04f8a });
  addBox(43, 17, 4, 4, 7.4, 1.2, { top: 0xff8ad1, side: 0xb04f8a });
  const m1 = addBox(50, 24, 5, 5, 8.2, 1.2, { top: 0x7ad7ff, side: 0x3a8fb8 });
  addMover(m1, t => [50 + Math.sin(t * 0.9) * 9, 8.2, 24]);
  addBox(60, 29, 4, 4, 9, 1.2, { top: 0xff8ad1, side: 0xb04f8a });
  addBox(60, 35, 4, 4, 9.8, 1.2, { top: 0xff8ad1, side: 0xb04f8a });
  addBox(58, 42, 9, 9, 11, 2, { top: 0xffc94d, side: 0xc98b2b });
  // Torre en espiral (luna 2)
  const TX = -22, TZ = -22;
  addBox(TX, TZ, 4, 4, 22, 24, { top: 0xf0e8d4, side: 0xcfc4a8, topTex: 'brick' });
  for (let i = 0; i < 9; i++) {
    const a = i * 0.96 + 0.3;
    addBox(TX + Math.cos(a) * 4, TZ + Math.sin(a) * 4, 3.5, 3.5, 2.2 * (i + 1), 1, { top: 0xb78cff, side: 0x6c4ab5 });
  }
  // Montículo y pilar del salto largo (luna 5)
  addBox(-10, 27, 6, 6, 3, 4, { top: 0xff9a4d, side: 0xb55a1f });
  addBox(-10, 43, 6, 6, 3, 15, { top: 0xff9a4d, side: 0xb55a1f });
  // Rocas decorativas con colisión
  [[18, -14, 3, 2], [-14, 12, 2.4, 1.6], [24, 14, 2, 1.2], [-4, -14, 2.2, 1.4]].forEach(([x, z, s, h]) =>
    addBox(x, z, s, s, h, 1.5, { top: 0xb8b8b8, side: 0x8e8e8e }));
  // Árboles
  [[-28, 12], [-30, -6], [24, -24], [26, 22], [-6, -30], [14, -30], [30, -12], [-18, 28], [8, 30], [-2, -22], [-30, 26]].forEach(([x, z]) => {
    addBox(x, z, 0.9, 0.9, 2.8, 2.8, { top: 0x7a4a26, side: 0x7a4a26 });
    const c = [0x2fae4a, 0x3fc85c][(x + z) & 1 ? 0 : 1];
    mesh(new THREE.SphereGeometry(2.1, 14, 10), lam(c), x, 4.3, z, scene).receiveShadow = true;
    mesh(new THREE.SphereGeometry(1.5, 14, 10), lam(c + 0x101010), x + 0.5, 5.7, z - 0.3, scene);
  });
  // Flores
  const fg = new THREE.SphereGeometry(0.16, 6, 5);
  for (let i = 0; i < 90; i++) {
    const x = rnd(-33, 33), z = rnd(-33, 33);
    if (Math.abs(z) < 4 && x > 10) continue;
    mesh(fg, lam([0xff5a8a, 0xffe14a, 0xffffff, 0x9a7aff][i % 4]), x, 0.16, z, scene, false);
  }
  // Agua con ondas y espuma en la orilla
  const wc = document.createElement('canvas'); wc.width = wc.height = 128; const wx = wc.getContext('2d');
  wx.fillStyle = '#fff'; wx.fillRect(0, 0, 128, 128); wx.strokeStyle = 'rgba(40,140,200,.35)'; wx.lineWidth = 4;
  for (let i = 0; i < 6; i++) { wx.beginPath(); for (let k = 0; k <= 128; k += 8) wx.lineTo(k, 12 + i * 21 + Math.sin(k / 12 + i) * 5); wx.stroke(); }
  const wt = new THREE.CanvasTexture(wc); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(90, 90); wt.colorSpace = THREE.SRGBColorSpace;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshBasicMaterial({ color: 0x35c4ee, map: wt, transparent: true, opacity: 0.92 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -8; scene.add(water); world.water = water; world.waterTex = wt;
  [[76, 0.7], [84, 0.35]].forEach(([s, o]) => { const f = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: o, depthWrite: false })); f.rotation.x = -Math.PI / 2; f.position.y = -7.93; scene.add(f); });
  // Montañas lejanas, islas flotantes y sol
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU + rnd(0.2), r = rnd(300, 380), hgt = rnd(60, 150);
    if (Math.sin(a) * r > 40) continue;
    const mt = new THREE.Mesh(new THREE.ConeGeometry(rnd(45, 85), hgt, 6), new THREE.MeshLambertMaterial({ color: [0x6fb7a8, 0x7ac27a, 0x8aa9d6][i % 3] }));
    mt.position.set(Math.cos(a) * r, hgt / 2 - 12, Math.sin(a) * r); scene.add(mt);
  }
  for (let i = 0; i < 7; i++) {
    const a = rnd(TAU), r = rnd(90, 170), g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(9, 9, 3, 12), lam(0x6edc5f), 0, 0, 0, g, false); mesh(new THREE.ConeGeometry(9, 12, 10).rotateX(Math.PI), lam(0x9a6a44), 0, -7.5, 0, g, false);
    g.position.set(Math.cos(a) * r, rnd(20, 50), Math.sin(a) * r); g.userData.ph = rnd(TAU); scene.add(g); world.floaters.push(g);
  }
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshBasicMaterial({ color: 0xfff6c0, fog: false })); sunDisc.position.set(250, 190, -380); sunDisc.lookAt(0, 0, 0); scene.add(sunDisc);
  // Cajas de monedas
  [[7, -5], [9.5, -5], [-8, -7], [-20, 9], [3, 16], [40, -3], [46, 3], [-14, -24], [20, -9]].forEach(([x, z]) => addCrate(x, z, x > 36 ? 6 : 0));
  // Palmeras
  [[-32, -20], [32, 30], [32, -30], [-32, 32], [20, 33]].forEach(([x, z]) => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.2, 8), lam(0xb98a52), i * 0.22, 0.6 + i * 1.1, 0, g, false).rotation.z = -0.1 * i;
    for (let k = 0; k < 6; k++) { const l = mesh(new THREE.ConeGeometry(0.5, 3.2, 4), lam(0x2fb85a), 0, 6, 0, g, false); l.rotation.z = Math.PI / 2 - 0.4; l.rotation.y = k / 6 * TAU; l.position.set(Math.cos(k / 6 * TAU) * 1.5 + 0.9, 5.8, -Math.sin(k / 6 * TAU) * 1.5); l.rotation.set(0, k / 6 * TAU, -1.2); }
    g.position.set(x, 0, z); scene.add(g);
  });
  // Arbustos y flores altas
  for (let i = 0; i < 26; i++) { const x = rnd(-33, 33), z = rnd(-33, 33); if (Math.abs(z) < 5 && x > 8) continue; mesh(new THREE.SphereGeometry(rnd(0.5, 0.9), 8, 6), lam(0x35b84e), x, 0.35, z, scene, false); }
  for (let i = 0; i < 36; i++) { const x = rnd(-33, 33), z = rnd(-33, 33); if (Math.abs(z) < 5 && x > 8) continue; const c = [0xff5a8a, 0xffe14a, 0xb07aff][i % 3];
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 5), lam(0x2a9a3a), x, 0.45, z, scene, false); mesh(new THREE.SphereGeometry(0.25, 8, 6), lam(c), x, 1, z, scene, false); }
  // Nubes
  for (let i = 0; i < 16; i++) {
    const g = new THREE.Group(), n = 3 + (i % 3);
    for (let k = 0; k < n; k++) mesh(new THREE.SphereGeometry(rnd(2.5, 4.5), 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), k * 3.4, rnd(-0.5, 0.8), rnd(-1, 1), g, false);
    g.position.set(rnd(-170, 170), rnd(28, 55), rnd(-170, 170) + (i % 2 ? 300 : 0)); g.userData.s = rnd(0.5, 1.5); scene.add(g); world.clouds.push(g);
  }
  // Cartel de bienvenida
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = '#8a5a2b'; x.fillRect(0, 0, 512, 256);
  x.strokeStyle = '#5a3716'; x.lineWidth = 14; x.strokeRect(7, 7, 498, 242);
  x.fillStyle = '#ffd400'; x.font = 'bold 66px sans-serif'; x.textAlign = 'center';
  x.fillText('RICHI WORLD', 256, 120); x.fillStyle = '#fff'; x.font = 'bold 34px sans-serif'; x.fillText('¡Bienvenido, Richi!', 256, 185);
  mesh(new THREE.BoxGeometry(0.4, 3, 0.4), lam(0x5a3716), 0, 1.5, -10, scene);
  mesh(new THREE.PlaneGeometry(5, 2.5), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) }), 0, 3.3, -9.75, scene);
  addBox(0, -10, 0.5, 0.5, 3, 3, { top: 0x5a3716, side: 0x5a3716 });
}
const world = { clouds: [], water: null, waterTex: null, floaters: [] };
const crates = [];
function addCrate(x, z, top = 0) {
  const mk = (c) => texMat('crate', c, 1, 1);
  const m = mk(0xffffff), g = new THREE.BoxGeometry(1.4, 1.4, 1.4), mm = new THREE.Mesh(g, m); mm.castShadow = true; mm.receiveShadow = true;
  mm.position.set(x, top + 0.7, z); scene.add(mm);
  const o = new THREE.Mesh(g, olMat); o.scale.setScalar(1.06); mm.add(o);
  const b = { mesh: mm, w: 1.4, d: 1.4, h: 1.4, min: new V3(x - 0.7, top, z - 0.7), max: new V3(x + 0.7, top + 1.4, z + 0.7), delta: new V3() };
  const c = { b, x, z, y: top, alive: true }; b.crate = c; solids.push(b); crates.push(c);
}
function breakCrate(c) {
  if (!c.alive) return; c.alive = false;
  scene.remove(c.b.mesh); solids.splice(solids.indexOf(c.b), 1);
  burst(new V3(c.x, c.y + 0.8, c.z), 0xffc94d, 16, 4, 6); SFX.stomp();
  for (let i = 0; i < 5; i++) addCoin(c.x + rnd(-0.9, 0.9), c.y + 1.1 + rnd(0, 0.8), c.z + rnd(-0.9, 0.9));
}

/* ---------------------------------------------------------------- modelos */
const emblemTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.beginPath(); x.arc(32, 32, 30, 0, TAU); x.fill();
  x.fillStyle = '#e8262b'; x.font = 'bold 46px sans-serif'; x.textAlign = 'center'; x.fillText('R', 32, 48);
  return new THREE.CanvasTexture(c);
})();
function makeHat(eyes) {
  const _o = OL; OL = true;
  const g = new THREE.Group(), red = lam(0xe8262b);
  if (eyes) [-0.15, 0.15].forEach(x => { mesh(new THREE.SphereGeometry(0.11, 10, 8), lam(0xffffff), x, 0.2, 0.34, g, false).scale.set(1, 1.3, 0.6); mesh(new THREE.SphereGeometry(0.05, 8, 6), lam(0x111111), x, 0.2, 0.4, g, false); });
  mesh(new THREE.SphereGeometry(0.42, 16, 10, 0, TAU, 0, Math.PI / 2), red, 0, 0, 0, g).scale.y = 0.85;
  const visor = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 16, 1, false, -Math.PI / 2, Math.PI), lam(0xb81a1f), 0, 0.02, 0.12, g);
  visor.scale.z = 1.5;
  mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.05, 16), lam(0xb81a1f), 0, 0.01, 0, g);
  const em = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), new THREE.MeshBasicMaterial({ map: emblemTex }));
  em.position.set(0, 0.24, 0.37); em.rotation.x = -0.35; if (!eyes) g.add(em);
  OL = _o; return g;
}
function buildRichi() {
  const _o = OL; OL = true;
  const root = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group();
  pivot.position.y = 0.85; body.position.y = -0.85; root.add(pivot); pivot.add(body);
  const skin = lam(0xffc9a0), red = lam(0xe8262b), blue = lam(0x2a4bd7), brown = lam(0x4a2a12), white = lam(0xffffff);
  mesh(new THREE.BoxGeometry(0.72, 0.6, 0.46), blue, 0, 0.85, 0, body);
  mesh(new THREE.BoxGeometry(0.74, 0.28, 0.47), red, 0, 1.06, 0, body);
  mesh(new THREE.BoxGeometry(0.4, 0.34, 0.1), blue, 0, 0.98, 0.24, body);
  [-0.2, 0.2].forEach(x => mesh(new THREE.SphereGeometry(0.06, 8, 6), lam(0xffd400), x, 1.05, 0.31, body));
  const legs = [], arms = [];
  [-0.18, 0.18].forEach(x => {
    const l = new THREE.Group(); l.position.set(x, 0.58, 0); body.add(l);
    mesh(new THREE.BoxGeometry(0.3, 0.5, 0.34), blue, 0, -0.25, 0, l);
    mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), brown, 0, -0.5, 0.07, l);
    legs.push(l);
    const a = new THREE.Group(); a.position.set(x * 2.4, 1.12, 0); body.add(a);
    mesh(new THREE.BoxGeometry(0.22, 0.46, 0.24), red, 0, -0.2, 0, a);
    mesh(new THREE.SphereGeometry(0.21, 10, 8), white, 0, -0.52, 0, a);
    arms.push(a);
  });
  const head = new THREE.Group(); head.position.y = 1.5; body.add(head);
  mesh(new THREE.SphereGeometry(0.38, 16, 12), skin, 0, 0, 0, head);
  mesh(new THREE.SphereGeometry(0.12, 8, 6), skin, 0, -0.04, 0.38, head);
  mesh(new THREE.BoxGeometry(0.44, 0.09, 0.1), brown, 0, -0.14, 0.34, head);
  [-0.13, 0.13].forEach(x => {
    mesh(new THREE.SphereGeometry(0.075, 8, 6), white, x, 0.08, 0.32, head, false);
    mesh(new THREE.SphereGeometry(0.04, 8, 6), lam(0x111111), x, 0.08, 0.385, head, false);
  });
  mesh(new THREE.BoxGeometry(0.8, 0.22, 0.2), brown, 0, 0.02, -0.28, head);
  mesh(new THREE.SphereGeometry(0.385, 14, 8, 0, TAU, 0, Math.PI * 0.45), lam(0x4a2a12), 0, 0.01, -0.02, head);
  const hat = makeHat(); hat.position.set(0, 0.2, 0.0); hat.rotation.x = -0.05; head.add(hat);
  OL = _o; return { root, pivot, body, legs, arms, head, hat };
}
function buildGoomba() {
  const _o = OL; OL = true;
  const g = new THREE.Group();
  const head = mesh(new THREE.SphereGeometry(0.62, 16, 10), lam(0x8b5a2b), 0, 0.85, 0, g); head.scale.y = 0.85;
  mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.5, 12), lam(0xf4dcb0), 0, 0.3, 0, g);
  const feet = [-0.22, 0.22].map(x => { const f = mesh(new THREE.SphereGeometry(0.22, 8, 6), lam(0x3d2410), x, 0.12, 0.05, g); f.scale.set(1, 0.6, 1.4); return f; });
  [-0.2, 0.2].forEach(x => {
    mesh(new THREE.SphereGeometry(0.15, 8, 6), lam(0xffffff), x, 0.92, 0.45, g, false);
    mesh(new THREE.SphereGeometry(0.07, 8, 6), lam(0x111111), x, 0.92, 0.58, g, false);
    const b = mesh(new THREE.BoxGeometry(0.28, 0.07, 0.07), lam(0x2a1608), x, 1.12, 0.55, g, false); b.rotation.z = x > 0 ? 0.5 : -0.5;
  });
  mesh(new THREE.BoxGeometry(0.1, 0.14, 0.06), lam(0xffffff), -0.1, 0.62, 0.55, g, false);
  mesh(new THREE.BoxGeometry(0.1, 0.14, 0.06), lam(0xffffff), 0.1, 0.62, 0.55, g, false);
  OL = _o; return { root: g, feet };
}

/* ---------------------------------------------------------------- estado */
const G = { state: 'title', coins: 0, pcoins: 0, moons: 0, hearts: 3, defeated: 0, t: 0, endT: 0, deaths: 0 };
const MODES = {
  richi: { speed: 9, jump: 14, r: 0.45, h: 1.7 },
  gumbi: { speed: 12.5, jump: 19, r: 0.55, h: 1.25 },
};
const P = {
  pos: new V3(0, 0.07, 350), vel: new V3(), yaw: Math.PI, mode: 'richi', r: 0.45, h: 1.7,
  onGround: false, groundBox: null, coyote: 0, jumpBuf: 0, chain: 0, chainTimer: 0,
  crouching: false, longJump: false, jumpCut: false, pound: 0, poundT: 0, invuln: 0,
  flip: 0, squash: 0, anim: 0, cap: null,
};
let checkpoint = new V3(0, 0.07, 350);
const cam = { yaw: 0, pitch: 0.38, dist: 9, shake: 0, focus: new V3(0, 2, 4) };
const richi = buildRichi(); scene.add(richi.root);
const coins = [], moons = [], enemies = [], flags = [];

/* ---------------------------------------------------------------- objetos */
const coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.09, 18).rotateX(Math.PI / 2);
const coinMat = new THREE.MeshLambertMaterial({ color: 0xffd400, emissive: 0x7a5a00 });
const pcoinMat = new THREE.MeshLambertMaterial({ color: 0xa24dff, emissive: 0x4a1a8a });
const pcoinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 6).rotateX(Math.PI / 2);
function addCoin(x, y, z, p = false) {
  const m = new THREE.Mesh(p ? pcoinGeo : coinGeo, p ? pcoinMat : coinMat); m.position.set(x, y, z); m.castShadow = true; scene.add(m);
  coins.push({ mesh: m, taken: false, ph: rnd(TAU), p });
}
const coinLine = (a, b, n) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1); addCoin(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)); } };
const MOON_NAMES = ['Escalera al cielo', 'La torre de Richi', 'Saltos flotantes', '¡Cazador de Gumbis!', 'Un salto muy largo', 'Escalera de incendios', 'La grúa de Richi', 'Tejados bajos'];
const TOTAL_MOONS = 8;
function addMoon(i, x, y, z, active = true) {
  const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: 0xffe14a, emissive: 0xc79a00 });
  const cres = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.3, 12, 28, Math.PI * 1.5), mat); cres.rotation.z = Math.PI * 0.75; g.add(cres);
  [-0.2, 0.2].forEach(dx => mesh(new THREE.SphereGeometry(0.07, 8, 6), lam(0x5a3b00), dx - 0.15, 0.1, 0.3, g, false));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 70, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.position.y = 35; g.add(beam);
  g.position.set(x, y, z); g.visible = active; scene.add(g);
  moons.push({ i, group: g, pos: new V3(x, y, z), taken: false, active });
}
function addFlag(x, y, z, tag) {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 8), lam(0xdddddd), 0, 1.6, 0, g);
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.85), new THREE.MeshLambertMaterial({ color: 0xe8262b, side: THREE.DoubleSide }));
  cloth.position.set(0.65, 2.7, 0); g.add(cloth);
  g.position.set(x, y, z); scene.add(g);
  flags.push({ g, cloth, pos: new V3(x, y, z), on: false, tag });
}
function addEnemy(x, z) {
  const m = buildGoomba(); scene.add(m.root);
  const e = { m, mesh: m.root, pos: new V3(x, groundHeightAt(x, z, 50), z), home: new V3(x, 0, z), alive: true, deadT: 0, face: rnd(TAU), wanderT: 0, wanderAng: 0, wanderOn: false, ph: rnd(TAU) };
  m.root.position.copy(e.pos); enemies.push(e);
}
function populate() {
  // Monedas
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; addCoin(Math.cos(a) * 6, 1, Math.sin(a) * 6 - 2); }
  coinLine([12, 1.6, 0], [34, 7, 0], 8);
  for (let i = 0; i < 9; i++) { const a = i * 0.96 + 0.3; addCoin(-22 + Math.cos(a) * 4, 2.2 * (i + 1) + 1.1, -22 + Math.sin(a) * 4); }
  coinLine([-22, 23.5, -22], [-22, 23.5, -22], 1);
  coinLine([43, 7.6, 8], [43, 8.4, 17], 4); coinLine([46, 9.5, 24], [56, 9.5, 24], 4);
  coinLine([60, 10.2, 29], [60, 11, 35], 3);
  coinLine([-10, 5, 27], [-10, 5, 43], 6);
  coinLine([-12, 1, -2], [-30, 1, 8], 6); coinLine([5, 1, 20], [25, 1, 28], 6); coinLine([-5, 1, -28], [15, 1, -28], 6);
  [[6, 1, -6], [-6, 1, -6], [0, 1, 12], [28, 1, -20]].forEach(c => addCoin(...c));
  // Monedas moradas (las de Richi): en lugares difíciles
  [[-27, 1.2, -17], [-22 + Math.cos(4.1) * 4, 2.2 * 5 + 1.4, -22 + Math.sin(4.1) * 4], [43, 8.2, 11], [62, 12.6, 44], [-10, 4.7, 36.5], [-3, 1.2, -13], [49, 7.4, -5], [30, 1.2, 30]].forEach(c => addCoin(c[0], c[1], c[2], true));
  // Lunas
  addMoon(0, 46, 7.9, 0);
  addMoon(1, -22, 24, -22);
  addMoon(2, 58, 12.9, 42);
  addMoon(3, 0, 2.2, -16, false);
  addMoon(4, -10, 4.9, 43);
  // Checkpoints
  addFlag(4, 0, 6, 'Isla'); addFlag(43, 6, -4.5, 'Plataforma'); addFlag(-17, 0, -14, 'Torre'); addFlag(-10, 3, 25.5, 'Montículo');
  // Enemigos
  [[10, 8], [-12, 10], [15, -15], [-5, -24], [24, 18], [-26, 4], [4, 22], [43, -3]].forEach(([x, z]) => addEnemy(x, z));
  G.totalEnemies = enemies.length;
}

/* ---------------------------------------------------------------- utilidades de colisión */
function overlap(p, r, h, s) {
  return p.x + r > s.min.x && p.x - r < s.max.x && p.z + r > s.min.z && p.z - r < s.max.z &&
    p.y < s.max.y - 0.001 && p.y + h > s.min.y + 0.001;
}
const STEP = 0.55;
function collideBody(b, dt) {
  const { pos, vel, r, h } = b;
  if (b.groundBox) pos.add(b.groundBox.delta);
  const hadGround = b.onGround;
  b.onGround = false; b.groundBox = null;
  for (const axis of ['x', 'z']) {
    pos[axis] += vel[axis] * dt;
    for (const s of solids) {
      if (!overlap(pos, r, h, s)) continue;
      if (hadGround && vel.y <= 0.01 && s.max.y - pos.y <= STEP && s.max.y - pos.y > 0) { pos.y = s.max.y; continue; }
      const c = (s.min[axis] + s.max[axis]) / 2;
      pos[axis] = pos[axis] < c ? s.min[axis] - r - 1e-3 : s.max[axis] + r + 1e-3;
      vel[axis] = 0;
    }
  }
  const prevY = pos.y;
  pos.y += vel.y * dt;
  for (const s of solids) {
    if (!overlap(pos, r, h, s)) continue;
    if (prevY >= s.max.y - 0.06) { pos.y = s.max.y; if (vel.y < 0) vel.y = 0; b.onGround = true; b.groundBox = s; }
    else if (prevY + h <= s.min.y + 0.06) { pos.y = s.min.y - h; if (vel.y > 0) vel.y = 0; }
    else if (s.max.y - pos.y < 1) { pos.y = s.max.y; b.onGround = true; b.groundBox = s; }
  }
}
function groundHeightAt(x, z, y, up = STEP) {
  let best = -Infinity;
  for (const s of solids) if (x >= s.min.x && x <= s.max.x && z >= s.min.z && z <= s.max.z && s.max.y <= y + up && s.max.y > best) best = s.max.y;
  return best;
}
function wallAt(x, z, y) {
  for (const s of solids) if (x > s.min.x - 0.45 && x < s.max.x + 0.45 && z > s.min.z - 0.45 && z < s.max.z + 0.45 && s.max.y > y + STEP && s.min.y < y + 1) return true;
  return false;
}
const AX = ['x', 'y', 'z'];
function rayHit(o, d, maxT) {
  let best = maxT;
  for (const s of solids) {
    let t0 = 0, t1 = best, ok = true;
    for (const a of AX) {
      const od = o[a], dd = d[a], mn = s.min[a], mx = s.max[a];
      if (Math.abs(dd) < 1e-8) { if (od < mn || od > mx) { ok = false; break; } }
      else {
        let a1 = (mn - od) / dd, a2 = (mx - od) / dd; if (a1 > a2) { const t = a1; a1 = a2; a2 = t; }
        if (a1 > t0) t0 = a1; if (a2 < t1) t1 = a2; if (t0 > t1) { ok = false; break; }
      }
    }
    if (ok && t0 > 0 && t0 < best) best = t0;
  }
  return best;
}

/* ---------------------------------------------------------------- partículas / UI */
const parts = [];
{
  const g = new THREE.BoxGeometry(0.16, 0.16, 0.16);
  for (let i = 0; i < 160; i++) {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff })); m.visible = false; scene.add(m);
    parts.push({ m, life: 0, vel: new V3() });
  }
}
function burst(pos, color, n, speed = 4, up = 4, size = 1) {
  let k = 0;
  for (const p of parts) {
    if (p.life > 0) continue;
    p.life = rnd(0.45, 0.9); p.m.visible = true; p.m.position.copy(pos); p.m.material.color.set(color); p.m.scale.setScalar(size);
    p.vel.set(rnd(-speed, speed), rnd(0.5, up), rnd(-speed, speed));
    if (++k >= n) break;
  }
}
function updateParts(dt) {
  for (const p of parts) {
    if (p.life <= 0) continue;
    p.life -= dt; p.vel.y -= 18 * dt; p.m.position.addScaledVector(p.vel, dt); p.m.scale.multiplyScalar(0.97);
    if (p.life <= 0) p.m.visible = false;
  }
}
let toastT = 0, bannerT = 0;
function toast(text, sec = 2.4) { const t = $('toast'); t.textContent = text; t.classList.add('show'); toastT = sec; }
function banner(text, sub, sec = 3) { const b = $('banner'); b.innerHTML = text + (sub ? `<small>${sub}</small>` : ''); b.classList.add('show'); bannerT = sec; }
function updateHUD() {
  for (let i = 0; i < 3; i++) $('seg' + i).setAttribute('fill', i < G.hearts ? '#3fd6ff' : '#2b3550');
  $('hp').textContent = G.hearts; $('gauge').classList.toggle('low', G.hearts === 1);
  $('coins').textContent = G.coins; $('pcoins').textContent = G.pcoins; $('moons').textContent = G.moons;
  $('captureTag').classList.toggle('hidden', P.mode === 'richi');
}

/* ---------------------------------------------------------------- gorra y captura */
const hat = { on: false, state: 0, pos: new V3(), dir: new V3(), dist: 0, t: 0, used: false, m: makeHat(true) };
hat.m.scale.setScalar(2.1); hat.m.visible = false; scene.add(hat.m);
function throwHat() {
  if (P.mode !== 'richi') { releaseCapture(); return; }
  if (hat.on || P.pound) return;
  hat.on = true; hat.state = 0; hat.dist = 0; hat.t = 0; hat.used = false;
  hat.pos.copy(P.pos).y += 1.6;
  hat.dir.set(Math.sin(P.yaw), 0, Math.cos(P.yaw));
  richi.hat.visible = false; hat.m.visible = true; SFX.hat();
}
function updateHat(dt) {
  if (!hat.on) return;
  hat.m.rotation.y += 24 * dt; hat.m.position.copy(hat.pos);
  if (hat.state === 0) { const s = 26 * dt; hat.pos.addScaledVector(hat.dir, s); hat.dist += s; if (hat.dist > 9) { hat.state = 1; hat.t = 0.14; } }
  else if (hat.state === 1) { hat.t -= dt; if (hat.t <= 0) hat.state = 2; }
  else {
    const target = tmpV.copy(P.pos); target.y += 1.5;
    const to = target.sub(hat.pos), d = to.length();
    if (d < 0.9) { hat.on = false; hat.m.visible = false; richi.hat.visible = P.mode === 'richi'; return; }
    hat.pos.addScaledVector(to.normalize(), Math.min(d, 34 * dt));
  }
  // Colisiones de la gorra
  for (const c of coins) if (!c.taken && c.mesh.position.distanceTo(hat.pos) < 1.4) collectCoin(c);
  for (const c of crates) if (c.alive && Math.hypot(c.x - hat.pos.x, c.z - hat.pos.z) < 1.4 && Math.abs(c.y + 0.7 - hat.pos.y) < 1.5) breakCrate(c);
  if (hat.state === 0 || hat.state === 1) for (const e of enemies) {
    if (!e.alive) continue;
    if (Math.hypot(e.pos.x - hat.pos.x, e.pos.z - hat.pos.z) < 1.2 && Math.abs(e.pos.y + 0.7 - hat.pos.y) < 1.6) { captureEnemy(e); return; }
  }
}
const tmpV = new V3();
function captureEnemy(e) {
  enemies.splice(enemies.indexOf(e), 1);
  P.mode = 'gumbi'; P.r = MODES.gumbi.r; P.h = MODES.gumbi.h; P.cap = e;
  hat.on = false; hat.m.visible = false; richi.root.visible = false;
  e.capHat = makeHat(); e.capHat.position.set(0, 1.45, 0); e.capHat.scale.setScalar(1.2); e.mesh.add(e.capHat);
  P.pos.x = e.pos.x; P.pos.z = e.pos.z; P.vel.set(0, 6, 0);
  burst(e.pos.clone().setY(e.pos.y + 1), 0xff4a4a, 18, 5, 5); SFX.capture();
  toast('¡Capturaste un Gumbi! Corre más y salta más alto — [E] para soltar', 3.5);
  updateHUD();
}
function releaseCapture(silent) {
  const e = P.cap; if (!e) return;
  P.mode = 'richi'; P.r = MODES.richi.r; P.h = MODES.richi.h; P.cap = null;
  richi.root.visible = true; richi.hat.visible = true;
  burst(P.pos.clone().setY(P.pos.y + 0.8), 0xffffff, 16, 4, 5);
  scene.remove(e.mesh); P.vel.y = silent ? 4 : 12; if (!silent) SFX.jump();
  registerDefeat(); updateHUD();
}

/* ---------------------------------------------------------------- recolectables */
function collectCoin(c) {
  c.taken = true; c.mesh.visible = false;
  if (c.p) { G.pcoins++; SFX.flag(); burst(c.mesh.position, 0xc07aff, 12, 3, 4, 0.9); toast(`Moneda de Richi ${G.pcoins}/12`, 1.6); updateHUD(); return; }
  G.coins++; SFX.coin();
  burst(c.mesh.position, 0xffe14a, 6, 2, 3, 0.7);
  if (G.coins % 10 === 0 && G.hearts < 3) { G.hearts++; toast('❤️ ¡Corazón recuperado!'); }
  updateHUD();
}
function collectMoon(m) {
  m.taken = true; m.group.visible = false; G.moons++; SFX.moon();
  burst(m.pos, 0xffe14a, 40, 7, 8, 1.4);
  banner('¡POWER MOON!', MOON_NAMES[m.i], 3.2); updateHUD();
  const fl = $('flash'); fl.style.transition = 'none'; fl.style.opacity = 0.85; requestAnimationFrame(() => { fl.style.transition = 'opacity 1.4s'; fl.style.opacity = 0; });
  if (G.moons >= TOTAL_MOONS) { G.state = 'ending'; G.endT = 4.5; }
}
function registerDefeat() {
  G.defeated++;
  if (G.defeated >= G.totalEnemies) {
    const m = moons.find(x => x.i === 3);
    if (m && !m.active) { m.active = true; m.group.visible = true; burst(m.pos, 0xffe14a, 30, 5, 6, 1.2); SFX.flag(); toast('✨ ¡Apareció una Power Moon en el centro de la isla!', 4); }
  }
}
function killEnemy(e, how) {
  if (!e.alive) return;
  e.alive = false; e.deadT = 0.7; e.mesh.scale.y = 0.18;
  burst(e.pos.clone().setY(e.pos.y + 0.4), 0xc58a50, 10, 3, 4);
  G.coins++; if (G.coins % 10 === 0 && G.hearts < 3) { G.hearts++; toast('❤️ ¡Corazón recuperado!'); }
  registerDefeat(); updateHUD();
}

/* ---------------------------------------------------------------- jugador */
const keys = new Set(), pressed = new Set();
const K = c => keys.has(c);
const mvTmp = new V3();
function hurt(from) {
  if (P.invuln > 0 || G.state === 'ending') return;
  P.invuln = 2; SFX.hurt(); cam.shake = 0.5;
  if (P.mode !== 'richi') { releaseCapture(); P.vel.y = 8; return; }
  G.hearts--;
  if (from) { const dx = P.pos.x - from.x, dz = P.pos.z - from.z, d = Math.hypot(dx, dz) || 1; P.vel.x = dx / d * 9; P.vel.z = dz / d * 9; }
  P.vel.y = 9; P.longJump = false; P.pound = 0;
  if (G.hearts <= 0) { G.hearts = 3; G.deaths++; toast('💀 ¡Te quedaste sin corazones! Vuelves al último checkpoint.', 3); respawn(); }
  updateHUD();
}
function respawn() {
  if (P.mode !== 'richi') releaseCapture(true);
  P.pos.copy(checkpoint); P.vel.set(0, 0, 0); P.invuln = 2; P.pound = 0; P.longJump = false; hat.on = false; hat.m.visible = false; richi.hat.visible = true;
  cam.focus.copy(P.pos);
}
function doJump() {
  const m = MODES[P.mode], moving = Math.hypot(P.vel.x, P.vel.z) > 2;
  P.coyote = 0; P.jumpBuf = 0; P.jumpCut = false; P.flip = 0; P.squash = -0.3;
  if (P.mode !== 'richi') { P.vel.y = m.jump; SFX.jump(); return; }
  if (P.crouching && moving) {
    P.vel.x = Math.sin(P.yaw) * 17; P.vel.z = Math.cos(P.yaw) * 17; P.vel.y = 12.5; P.longJump = true; P.chain = 0; SFX.jump3();
  } else if (P.crouching) {
    P.vel.y = 19; P.vel.x = -Math.sin(P.yaw) * 3; P.vel.z = -Math.cos(P.yaw) * 3; P.flip = 0.0001; P.flipDir = -1; P.chain = 0; SFX.jump3();
  } else {
    P.chain = (P.chainTimer > 0 && moving) ? (P.chain >= 3 ? 1 : P.chain + 1) : 1;
    P.vel.y = [14, 16.5, 21][P.chain - 1];
    if (P.chain === 3) { P.flip = 0.0001; P.flipDir = 1; SFX.jump3(); } else SFX.jump();
  }
}
function landed() {
  P.squash = 0.4; P.longJump = false; P.chainTimer = 0.25; P.jumpCut = false;
  burst(P.pos.clone().setY(P.pos.y + 0.1), 0xf1ead2, 5, 2, 1.5, 0.8);
  if (P.groundBox && P.groundBox.crate) { breakCrate(P.groundBox.crate); P.onGround = false; P.groundBox = null; P.vel.y = 10; }
  if (P.pound === 2) {
    for (const c of crates.slice()) if (c.alive && Math.hypot(c.x - P.pos.x, c.z - P.pos.z) < 3.4 && Math.abs(c.y - P.pos.y) < 2.5) breakCrate(c);
    P.pound = 0; cam.shake = 0.6; SFX.pound();
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; burst(P.pos.clone().add(new V3(Math.cos(a) * 1.5, 0.2, Math.sin(a) * 1.5)), 0xffffff, 1, 6, 1.5, 1.1); }
    for (const e of enemies.slice()) if (e.alive && Math.hypot(e.pos.x - P.pos.x, e.pos.z - P.pos.z) < 5 && Math.abs(e.pos.y - P.pos.y) < 2.5) killEnemy(e, 'pound');
    P.vel.y = 7;
  }
}
function updatePlayer(dt) {
  const m = MODES[P.mode];
  // Entrada → dirección relativa a la cámara
  const ix = (K('KeyD') ? 1 : 0) - (K('KeyA') ? 1 : 0), iz = (K('KeyW') ? 1 : 0) - (K('KeyS') ? 1 : 0);
  const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
  mvTmp.set(-sy * iz + cy * ix, 0, -cy * iz - sy * ix);
  if (mvTmp.lengthSq() > 1) mvTmp.normalize();
  const hasInput = mvTmp.lengthSq() > 0.01;
  const crouchKey = K('KeyC') || K('ShiftLeft') || K('ShiftRight');
  P.crouching = crouchKey && P.onGround && P.mode === 'richi' && !P.pound;

  // Aplastón
  if (P.mode === 'richi' && !P.onGround && !P.pound && (pressed.has('KeyC') || pressed.has('ShiftLeft') || pressed.has('ShiftRight')) && !P.longJumpLock) {
    P.pound = 1; P.poundT = 0.22; P.vel.set(0, 0, 0); P.flip = 0; SFX.hat();
  }
  if (P.pound === 1) { P.poundT -= dt; P.vel.set(0, 0, 0); if (P.poundT <= 0) { P.pound = 2; P.vel.y = -48; } }

  if (P.pound === 0) {
    const maxSp = P.crouching ? (hasInput ? 12 : 0) : m.speed; // agachado en movimiento = rodar
    if (P.longJump) {
      P.vel.x += mvTmp.x * 10 * dt; P.vel.z += mvTmp.z * 10 * dt;
    } else {
      const acc = P.onGround ? 75 : 30;
      let dx = mvTmp.x * maxSp - P.vel.x, dz = mvTmp.z * maxSp - P.vel.z;
      const len = Math.hypot(dx, dz), st = acc * dt;
      if (len > st) { dx *= st / len; dz *= st / len; }
      P.vel.x += dx; P.vel.z += dz;
    }
    const hs = Math.hypot(P.vel.x, P.vel.z);
    if (P.longJump && hs > 1) P.yaw += angDiff(P.yaw, Math.atan2(P.vel.x, P.vel.z)) * (1 - Math.exp(-8 * dt));
    else if (hasInput) P.yaw += angDiff(P.yaw, Math.atan2(mvTmp.x, mvTmp.z)) * (1 - Math.exp(-18 * dt));

    // Saltos
    if (pressed.has('Space')) P.jumpBuf = 0.14; else P.jumpBuf -= dt;
    if (P.jumpBuf > 0 && (P.onGround || P.coyote > 0)) doJump();
    else if (P.jumpBuf > 0 && !P.onGround && P.mode === 'richi' && hat.on && hat.state < 2 && !hat.used && P.pos.distanceTo(hat.pos) < 4.5) {
      // Salto sobre la gorra
      hat.used = true; hat.state = 1; hat.t = 0.35; P.vel.y = 15.5; P.jumpBuf = 0; P.longJump = false; P.jumpCut = true; P.flip = 0.0001; P.flipDir = 1;
      burst(hat.pos, 0xffffff, 10, 3, 3); SFX.jump3();
    }
    if (!K('Space') && P.vel.y > 6 && !P.jumpCut && !P.longJump && P.chain < 3 && P.mode === 'richi') { P.vel.y *= 0.55; P.jumpCut = true; }
  }
  // Gravedad
  if (P.pound !== 1) P.vel.y = Math.max(-55, P.vel.y - 38 * (P.vel.y < 0 ? 1.15 : 1) * dt);

  const was = P.onGround;
  collideBody(P, dt);
  P.coyote = P.onGround ? 0.1 : P.coyote - dt;
  P.chainTimer = Math.max(0, P.chainTimer - dt);
  if (P.onGround && !was) landed();
  if (P.onGround && P.pound === 1) P.pound = 0;
  P.invuln = Math.max(0, P.invuln - dt);

  // Caída al agua
  if (P.pos.y < -9) {
    burst(P.pos.clone().setY(-7.8), 0xbfe8ff, 24, 5, 8); SFX.stomp();
    if (P.mode !== 'richi') { releaseCapture(true); }
    G.hearts--; toast('💦 ¡Te caíste al agua!'); if (G.hearts <= 0) { G.hearts = 3; G.deaths++; }
    respawn(); updateHUD();
  }

  // Checkpoints
  for (const f of flags) if (!f.on && P.pos.distanceTo(f.pos) < 2.6) {
    f.on = true; f.cloth.material.color.set(0x38d95a); checkpoint = new V3(f.pos.x, f.pos.y + 0.05, f.pos.z + 1.2); SFX.flag(); toast(`🚩 Checkpoint: ${f.tag}`);
  }
  // Portales entre reinos
  G.portalCd = Math.max(0, (G.portalCd || 0) - dt);
  if (!G.portalCd) for (const pt of portals) if (Math.hypot(P.pos.x - pt.pos.x, P.pos.z - pt.pos.z) < 1.8 && Math.abs(P.pos.y - pt.pos.y) < 3) {
    P.pos.copy(pt.dest); P.vel.set(0, 0, 0); checkpoint = pt.dest.clone(); cam.focus.copy(P.pos); G.portalCd = 2; SFX.capture();
    burst(P.pos.clone().setY(P.pos.y + 1), 0x7ae8ff, 30, 5, 6); toast(pt.dest.z > 100 ? 'Reino: Ciudad Richi' : 'Reino: Isla de Richi', 2.5); break;
  }
  // Monedas y lunas
  const chest = tmpV.copy(P.pos); chest.y += P.h * 0.5;
  for (const c of coins) if (!c.taken && c.mesh.position.distanceTo(chest) < 1.3) collectCoin(c);
  for (const mo of moons) if (mo.active && !mo.taken && mo.pos.distanceTo(chest) < 1.9) collectMoon(mo);
}

/* ---------------------------------------------------------------- enemigos */
function updateEnemies(dt, t) {
  for (const e of enemies) {
    if (!e.alive) { e.deadT -= dt; if (e.deadT <= 0) e.mesh.visible = false; continue; }
    const dx = P.pos.x - e.pos.x, dz = P.pos.z - e.pos.z, d = Math.hypot(dx, dz);
    const chase = d < 11 && Math.abs(P.pos.y - e.pos.y) < 4;
    let sp = 0, dirx = 0, dirz = 0;
    if (chase) { sp = 4.4; dirx = dx / d; dirz = dz / d; }
    else {
      e.wanderT -= dt;
      if (e.wanderT <= 0) { e.wanderT = rnd(1.2, 3); e.wanderAng = rnd(TAU); e.wanderOn = Math.random() < 0.7; }
      if (e.wanderOn) {
        sp = 1.6; dirx = Math.sin(e.wanderAng); dirz = Math.cos(e.wanderAng);
        const hx = e.home.x - e.pos.x, hz = e.home.z - e.pos.z;
        if (Math.hypot(hx, hz) > 8) { const hl = Math.hypot(hx, hz); dirx = hx / hl; dirz = hz / hl; }
      }
    }
    if (sp > 0) {
      const nx = e.pos.x + dirx * sp * dt, nz = e.pos.z + dirz * sp * dt, gh = groundHeightAt(nx, nz, e.pos.y);
      if (gh > -Infinity && !wallAt(nx, nz, e.pos.y)) { e.pos.set(nx, gh, nz); } else e.wanderT = 0;
      e.face += angDiff(e.face, Math.atan2(dirx, dirz)) * (1 - Math.exp(-10 * dt));
    }
    e.mesh.position.copy(e.pos); e.mesh.rotation.y = e.face;
    const w = Math.sin(t * (sp > 3 ? 14 : 8) + e.ph) * (sp > 0 ? 0.25 : 0);
    e.m.feet[0].position.z = 0.05 + w; e.m.feet[1].position.z = 0.05 - w;
    // contacto con el jugador
    if (d < 0.6 + P.r && P.pos.y < e.pos.y + 1.3 && P.pos.y + P.h > e.pos.y) {
      if (P.mode !== 'richi') { killEnemy(e, 'ram'); SFX.stomp(); }
      else if (P.vel.y < -1 && P.pos.y > e.pos.y + 0.7) { killEnemy(e, 'stomp'); P.vel.y = K('Space') ? 17 : 12; P.chain = 0; SFX.stomp(); }
      else hurt(e.pos);
    }
  }
}

/* ---------------------------------------------------------------- cámara y animación */
function updateCamera(dt) {
  const tgt = tmpV.copy(P.pos); tgt.y += P.mode === 'richi' ? 1.5 : 1.1;
  const kx = 1 - Math.exp(-16 * dt), ky = 1 - Math.exp(-7 * dt);
  cam.focus.x = lerp(cam.focus.x, tgt.x, kx); cam.focus.z = lerp(cam.focus.z, tgt.z, kx); cam.focus.y = lerp(cam.focus.y, tgt.y, ky);
  if (K('ArrowLeft')) cam.yaw += 2.2 * dt; if (K('ArrowRight')) cam.yaw -= 2.2 * dt;
  if (K('ArrowUp')) cam.pitch = clamp(cam.pitch - 1.4 * dt, -0.15, 1.3); if (K('ArrowDown')) cam.pitch = clamp(cam.pitch + 1.4 * dt, -0.15, 1.3);
  const cp = Math.cos(cam.pitch), dir = new V3(Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp);
  let dist = cam.dist + (P.mode === 'richi' ? 0 : -1);
  const hit = rayHit(cam.focus, dir, dist + 0.6); if (hit < dist + 0.6) dist = Math.max(1.6, hit - 0.6);
  camera.position.copy(cam.focus).addScaledVector(dir, dist);
  if (camera.position.y < -7) camera.position.y = -7;
  cam.shake = Math.max(0, cam.shake - dt * 2);
  if (cam.shake > 0) camera.position.add(new V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).multiplyScalar(cam.shake * 0.25));
  camera.lookAt(cam.focus);
}
function animatePlayer(dt, t) {
  const hs = Math.hypot(P.vel.x, P.vel.z);
  P.squash *= Math.exp(-10 * dt);
  const sq = P.squash;
  const node = P.mode === 'richi' ? richi.root : P.cap.mesh;
  node.position.copy(P.pos); node.rotation.y = P.yaw;
  node.scale.set(1 + sq * 0.3, 1 - sq * 0.35, 1 + sq * 0.3);
  if (P.mode === 'richi') {
    richi.root.visible = !(P.invuln > 0 && Math.floor(t * 20) % 2);
    P.anim += hs * dt * 1.5;
    const sw = P.onGround ? Math.sin(P.anim) * Math.min(1, hs / 6) * 0.9 : 0;
    const air = !P.onGround;
    richi.legs[0].rotation.x = air ? 0.7 : sw; richi.legs[1].rotation.x = air ? -0.4 : -sw;
    richi.arms[0].rotation.x = air ? -2.4 : -sw; richi.arms[1].rotation.x = air ? -2.4 : sw;
    richi.body.position.y = -0.85 + (P.crouching ? -0.3 : 0);
    richi.body.rotation.x = P.crouching ? 0.5 : (P.longJump ? 1.2 : P.pound ? 0.2 : 0);
    if (P.flip > 0) { P.flip += dt; richi.pivot.rotation.x = -(P.flip / 0.6) * TAU * (P.flipDir || 1); if (P.flip > 0.6) { P.flip = 0; richi.pivot.rotation.x = 0; } }
    else richi.pivot.rotation.x = (P.crouching && hs > 3) ? -t * 18 : 0;
    if (P.pound === 1) richi.pivot.rotation.x = -((0.22 - P.poundT) / 0.22) * TAU;
  } else {
    const e = P.cap, w = Math.sin(t * 16) * (P.onGround ? Math.min(1, hs / 5) * 0.3 : 0);
    e.m.feet[0].position.z = 0.05 + w; e.m.feet[1].position.z = 0.05 - w;
    e.mesh.visible = !(P.invuln > 0 && Math.floor(t * 20) % 2);
  }
}

/* ---------------------------------------------------------------- bucle */
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 1 / 20);
  if (G.state !== 'paused') G.t += dt;
  const t = G.t;
  if (G.state === 'play' || G.state === 'ending') {
    updateMovers(t);
    const steps = 2;
    for (let i = 0; i < steps; i++) { updatePlayer(dt / steps); }
    updateHat(dt); updateEnemies(dt, t);
    if (pressed.has('KeyE')) throwHat();
    if (pressed.has('KeyQ') && P.mode !== 'richi') releaseCapture();
    if (pressed.has('KeyR')) respawn();
    updateParts(dt); animatePlayer(dt, t);
    if (G.state === 'ending') {
      G.endT -= dt; cam.yaw += dt * 0.5;
      if (G.endT <= 0) { G.state = 'win'; document.exitPointerLock?.(); $('winStats').textContent = `🪙 ${G.coins} monedas · 👾 ${G.defeated} Gumbis derrotados · 💀 ${G.deaths} derrotas`; $('win').classList.remove('hidden'); }
    }
    updateCamera(dt);
  } else if (G.state === 'title') {
    updateMovers(t); cam.yaw += dt * 0.12; cam.focus.set(0, 9, CZ + 20); cam.pitch = 0.22;
    const cp = Math.cos(cam.pitch);
    camera.position.set(Math.sin(cam.yaw) * cp * 24 * 0 + Math.sin(cam.yaw * 2) * 6, 9 + Math.sin(cam.pitch) * 24, CZ + 20 + Math.cos(cam.pitch) * 24);
    camera.lookAt(cam.focus); animatePlayer(dt, t);
  }
  // Animaciones ambientales
  for (const c of coins) if (!c.taken) { c.mesh.rotation.y = t * 3 + c.ph; }
  for (const m of moons) if (m.active && !m.taken) { m.group.rotation.y = t * 1.6; m.group.position.y = m.pos.y + Math.sin(t * 2) * 0.2; }
  for (const f of flags) f.cloth.scale.x = 1 + Math.sin(t * 5 + f.pos.x) * 0.08;
  for (const c of world.clouds) { c.position.x += c.userData.s * dt; if (c.position.x > 190) c.position.x = -190; }
  world.water.position.y = -8 + Math.sin(t) * 0.12; world.waterTex.offset.set(t * 0.012, t * 0.008);
  for (const f of world.floaters) f.position.y += Math.sin(t + f.userData.ph) * 0.01;
  camera.fov = lerp(camera.fov, 60 + Math.min(10, Math.hypot(P.vel.x, P.vel.z) * 0.55), 1 - Math.exp(-4 * dt)); camera.updateProjectionMatrix();
  sun.position.set(P.pos.x + 35, P.pos.y + 55, P.pos.z + 22); sun.target.position.copy(P.pos);
  if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('show');
  if (bannerT > 0 && (bannerT -= dt) <= 0) $('banner').classList.remove('show');
  pressed.clear();
  renderer.render(scene, camera);
}

/* ---------------------------------------------------------------- entrada */
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft'].includes(e.code)) e.preventDefault();
  if (!e.repeat) { keys.add(e.code); pressed.add(e.code); }
  if (e.code === 'KeyH') $('help').classList.toggle('hidden');
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
let locked = false;
document.addEventListener('pointerlockchange', () => {
  const was = locked; locked = document.pointerLockElement === canvas;
  if (was && !locked && G.state === 'play') { G.state = 'paused'; $('pause').classList.remove('hidden'); }
});
addEventListener('mousemove', e => {
  if (G.state !== 'play' && G.state !== 'ending') return;
  if (locked || e.buttons & 2) { cam.yaw -= e.movementX * 0.0035; cam.pitch = clamp(cam.pitch + e.movementY * 0.003, -0.15, 1.3); }
});
canvas.addEventListener('mousedown', e => {
  if (G.state === 'play') { if (!locked && e.button === 0) { canvas.requestPointerLock?.(); } if (e.button === 0) pressed.add('KeyE'); }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
$('pause').addEventListener('click', () => { G.state = 'play'; $('pause').classList.add('hidden'); canvas.requestPointerLock?.(); clock.getDelta(); });
function start() {
  $('title').classList.add('hidden'); $('hud').classList.remove('hidden'); $('help').classList.remove('hidden');
  G.state = 'play'; cam.yaw = 0; cam.pitch = 0.38; cam.focus.copy(P.pos).setY(2);
  updateHUD(); canvas.requestPointerLock?.();
  toast('¡Encuentra las 8 Power Moons! 🌙', 3.5);
  tone(440, 880, 0.2, 'triangle', 0.08);
  setInterval(() => { if (G.state === 'play' && musicOn) musicTick(); }, 190);
}
// Música de fondo (melodía alegre en bucle)
let musicOn = true, musicStep = 0;
const mf = n => 440 * Math.pow(2, (n - 69) / 12);
const MEL = [72, 0, 76, 0, 79, 76, 0, 74, 72, 0, 76, 0, 81, 79, 0, 0, 74, 0, 77, 0, 81, 77, 0, 76, 74, 0, 72, 0, 71, 0, 67, 0];
const BAS = [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 60, 0, 55, 0, 52, 0, 50, 0, 57, 0, 53, 0, 57, 0, 55, 0, 59, 0, 55, 0, 50, 0];
function musicTick() {
  const i = musicStep++ % 32;
  if (MEL[i]) tone(mf(MEL[i]), mf(MEL[i]) * 0.998, 0.2, 'triangle', 0.05);
  if (BAS[i]) tone(mf(BAS[i]), mf(BAS[i]) * 0.998, 0.22, 'square', 0.022);
}
addEventListener('keydown', e => { if (e.code === 'KeyM') { musicOn = !musicOn; toast(musicOn ? 'Música activada' : 'Música desactivada', 1.2); } });
$('play').addEventListener('click', start);
$('again').addEventListener('click', () => location.reload());

/* ---------------------------------------------------------------- Ciudad Richi (segundo reino) */
const CX = 0, CZ = 300;
function addSolidMesh(g, cx, cz, w, d, top, h) {
  g.position.set(cx, top - h / 2, cz); scene.add(g);
  const b = { mesh: g, w, d, h, min: new V3(cx - w / 2, top - h, cz - d / 2), max: new V3(cx + w / 2, top, cz + d / 2), delta: new V3() };
  solids.push(b); return b;
}
function billboardTex(title, sub, bg, fg, w = 256, h = 360) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineWidth = 10; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = fg; x.textAlign = 'center'; x.font = `bold ${Math.floor(w / 5.2)}px sans-serif`;
  title.split(' ').forEach((wd, i, a) => x.fillText(wd, w / 2, h * 0.42 + (i - (a.length - 1) / 2) * w / 4.6));
  x.font = `bold ${Math.floor(w / 11)}px sans-serif`; x.fillText(sub, w / 2, h - 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeTaxi() {
  const _o = OL; OL = true; const g = new THREE.Group();
  mesh(new THREE.BoxGeometry(2.2, 0.9, 4.6), lam(0xffc400), 0, -0.35, 0, g);
  mesh(new THREE.BoxGeometry(1.9, 0.7, 2.4), lam(0xffd84d), 0, 0.45, -0.2, g);
  mesh(new THREE.BoxGeometry(1.96, 0.42, 2.0), lam(0x1d2a3a), 0, 0.5, -0.2, g, false);
  mesh(new THREE.BoxGeometry(0.7, 0.25, 0.35), lam(0xffffff), 0, 0.93, -0.2, g, false);
  [[-1.1, 1.5], [1.1, 1.5], [-1.1, -1.5], [1.1, -1.5]].forEach(([x, z]) => mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12).rotateZ(Math.PI / 2), lam(0x1a1a1a), x, -0.4, z, g, false));
  [-0.7, 0.7].forEach(x => mesh(new THREE.SphereGeometry(0.2, 8, 6), lam(0xfff6b0), x, -0.25, 2.3, g, false));
  OL = _o; return g;
}
function makeHydrant() {
  const _o = OL; OL = true; const g = new THREE.Group(), red = lam(0xc8321e);
  mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.7, 12), red, 0, -0.1, 0, g);
  mesh(new THREE.SphereGeometry(0.28, 12, 8), red, 0, 0.25, 0, g);
  mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 12), lam(0x8a2210), 0, 0.02, 0, g);
  [-1, 1].forEach(s => mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8).rotateZ(Math.PI / 2), lam(0xb82a18), 0, 0.05, 0, g, false));
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 10).rotateX(Math.PI / 2), lam(0xcfcfcf), 0, 0.05, 0.3, g, false);
  OL = _o; return g;
}
function addPortal(x, y, z, dest, label, color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.22, 10, 32), new THREE.MeshBasicMaterial({ color })));
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })); g.add(disc);
  g.position.set(x, y + 2.1, z); scene.add(g);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const cx = c.getContext('2d');
  cx.fillStyle = '#fff'; cx.font = 'bold 40px sans-serif'; cx.textAlign = 'center'; cx.fillText(label, 128, 44);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })); sp.scale.set(4, 1, 1); sp.position.y = 2.7; g.add(sp);
  portals.push({ g, pos: new V3(x, y, z), dest });
}
const portals = [];
function buildCity() {
  const ROWS = [-63, -21, 21, 63];
  // Suelo, calle, aceras
  addBox(CX, CZ, 360, 360, 0, 6, { top: 0x9fa2ad, side: 0x6d707a, topTex: 'sidewalk', sideTex: 'brick', unit: 6 });
  addBox(CX, CZ, 30, 172, 0.06, 0.3, { top: 0x4b4e57, side: 0x4b4e57, topTex: 'asphalt', sideTex: 'asphalt', unit: 12 });
  [-23.5, 23.5].forEach(x => addBox(CX + x, CZ, 17, 172, 0.4, 0.6, { top: 0xd2cfc6, side: 0xaaa79e, topTex: 'sidewalk', sideTex: 'sidewalk', unit: 5 }));
  // Marcas viales
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2d24a }), whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let z = -80; z < 80; z += 8) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4), lineMat); m.rotation.x = -Math.PI / 2; m.position.set(CX, 0.1, CZ + z); scene.add(m); }
  [-48, 8, 44].forEach(z => { for (let x = -13; x <= 13; x += 2.2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 6), whiteMat); m.rotation.x = -Math.PI / 2; m.position.set(CX + x, 0.1, CZ + z); scene.add(m); } });
  // Edificios
  const colL = [0xd8cbb8, 0xc9b9a6, 0xbfb3a8, 0xcfc2b0], colR = [0xb9c3cf, 0xd2c6b4, 0xc8bcae, 0xaeb8c6];
  const hL = [46, 30, 38, 54], hR = [58, 70, 10, 42];
  ROWS.forEach((r, i) => {
    addBox(CX - 47, CZ + r, 30, 40, hL[i], hL[i], { top: 0x5a5d66, topTex: 'roof', side: colL[i], sideTex: 'facade', unit: 8 });
    addBox(CX + 47, CZ + r, 30, 40, hR[i], hR[i], { top: 0x5a5d66, topTex: 'roof', side: colR[i], sideTex: 'facade', unit: 8 });
  });
  // Carteles de marcas inventadas
  const bb = (tex, w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); };
  bb(billboardTex('GORRAS CHUY', 'las mejores', '#8a2fc9', '#ffe14a'), 14, 20, CX - 31.9, 24, CZ - 63, Math.PI / 2);
  bb(billboardTex('RICHI COLA', 'bien fría', '#d6242b', '#fff'), 12, 17, CX - 31.9, 24, CZ + 21, Math.PI / 2);
  bb(billboardTex('PIZZA LUNA', 'abierto 24h', '#ffc400', '#a3170f'), 14, 20, CX + 31.9, 30, CZ - 63, -Math.PI / 2);
  bb(billboardTex('TEATRO LUNA', 'hoy función', '#a3170f', '#fff', 128, 480), 5, 30, CX + 31.9, 30, CZ - 21, -Math.PI / 2);
  bb(billboardTex('NOTICIAS 24', 'en vivo', '#1b6fd6', '#fff'), 12, 17, CX + 31.9, 24, CZ + 63, -Math.PI / 2);
  // Escalera de incendios (luna 5) en la fachada del edificio de 30 m
  for (let i = 0; i < 12; i++) addBox(CX - 30.5, CZ - 21 + (i % 2 ? 3.5 : -3.5), 3, 4, 2.4 * (i + 1), 0.6, { top: 0x7a808c, side: 0x4a4f5a, topTex: 'check', sideTex: 'check' });
  // Grúa en espiral en medio de la calle (luna 6)
  addBox(CX, CZ - 10, 4, 4, 28, 28, { top: 0xf0e8d4, side: 0xcfc4a8, topTex: 'brick' });
  for (let i = 0; i < 12; i++) { const a = i * 0.96 + 0.3; addBox(CX + Math.cos(a) * 4, CZ - 10 + Math.sin(a) * 4, 3.5, 3.5, 2.2 * (i + 1), 1, { top: 0xff8a3d, side: 0xb55a1f, topTex: 'check' }); }
  // Escaleras al techo bajo (luna 7)
  for (let i = 0; i < 5; i++) addBox(CX + 30, CZ + 15 + i * 3, 3, 3, 2 + 1.9 * i, 2, { top: 0x4aa8d6, side: 0x2a6f95, topTex: 'check' });
  // Taxis aparcados y uno en movimiento (también se puede pisar)
  [[12, 30], [12, -5], [12, -32], [12, 50]].forEach(([x, z]) => addSolidMesh(makeTaxi(), CX + x, CZ + z, 2.2, 4.6, 1.66, 1.6));
  const tx = addSolidMesh(makeTaxi(), CX - 8, CZ, 2.2, 4.6, 1.66, 1.6); tx.mesh.rotation.y = 0;
  addMover(tx, t => [CX - 8, 1.66, CZ + Math.sin(t * 0.35) * 40]);
  // Hidrantes, farolas, semáforos
  for (let i = 0; i < 8; i++) { const z = -70 + i * 20, s = i % 2 ? 1 : -1; addSolidMesh(makeHydrant(), CX + s * 17, CZ + z, 0.7, 0.7, 1.3, 0.9); }
  for (let i = 0; i < 9; i++) {
    const z = -80 + i * 20, s = i % 2 ? 1 : -1, g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.1, 0.14, 7, 8), lam(0x1f5a46), 0, 3.5, 0, g, false);
    mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), lam(0x1f5a46), -s * 1.1, 7, 0, g, false);
    mesh(new THREE.SphereGeometry(0.34, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }), -s * 2.1, 6.85, 0, g, false);
    g.position.set(CX + s * 15.6, 0.4, CZ + z); scene.add(g);
  }
  // Skyline lejano
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * TAU + rnd(0.2), r = rnd(110, 175), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x) < 70 && Math.abs(z) < 100) continue;
    const w = rnd(24, 40), hh = rnd(70, 170), c = [0xa7b3c6, 0xbdb3a6, 0x9fb0be][i % 3];
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, w), [0, 1, 2, 3, 4, 5].map(k => k === 2 ? lam(0x5a5d66) : texMat('facade', c, w / 8, hh / 8)));
    m.position.set(CX + x, hh / 2, CZ + z); scene.add(m);
  }
  // Monedas, cajas, enemigos, lunas, checkpoints, portales
  coinLine([0, 1, CZ + 44], [0, 1, CZ - 50], 18);
  coinLine([-22, 1.7, CZ + 40], [-22, 1.7, CZ - 40], 10); coinLine([22, 1.7, CZ + 40], [22, 1.7, CZ - 40], 10);
  [[2, 40], [4, 40], [8, 30], [18, 5], [-20, -10], [10, -30], [20, -42]].forEach(([x, z]) => addCrate(CX + x, CZ + z, Math.abs(x) < 15 ? 0.06 : 0.4));
  [[-5, 30], [6, 10], [-8, -5], [8, -25], [0, -45]].forEach(([x, z]) => addEnemy(CX + x, CZ + z));
  [[CX - 30.5, 2.4 * 6 + 1.4, CZ - 17.5], [CX + Math.cos(6.06) * 4, 2.2 * 7 + 1.5, CZ - 10 + Math.sin(6.06) * 4], [CX + 47, 11.6, CZ + 27], [CX + 8, 1.2, CZ - 56]].forEach(c => addCoin(c[0], c[1], c[2], true));
  addMoon(5, CX - 47, 31.6, CZ - 21); addMoon(6, CX, 29.6, CZ - 10); addMoon(7, CX + 47, 11.6, CZ + 21);
  addFlag(CX + 18, 0.4, CZ + 44, 'Ciudad'); addFlag(CX + 18, 0.4, CZ - 35, 'Avenida');
  addPortal(CX, 0.06, CZ - 66, new V3(-6, 0.05, 10), 'ISLA', 0x44e0ff);
  addPortal(-6, 0, 6, new V3(CX, 0.07, CZ - 54), 'CIUDAD', 0xff7ad8);
  G.totalEnemies = enemies.length;
}

/* ---------------------------------------------------------------- arranque */
buildWorld(); populate(); buildCity();
richi.root.position.copy(P.pos);
window.RICHI = { G, P, cam, solids, enemies, moons, coins, keys, pressed, start, hat };
frame();
})();
