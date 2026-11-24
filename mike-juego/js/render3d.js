'use strict';
// ===== Motor 3D (three.js): mundo de bloques con cámara angulada estilo Minecraft Dungeons =====
const GL = { ok: false, r: null, scene: null, cam: null, root: null, lvlGroup: null, objs: new Map(), dyn: [], cx: 0, cz: 0, dist: 15, tdist: 15, t: 0, lvlRef: null, visible: null, trainX: 0, shakeX: 0, shakeZ: 0 };
const V3 = typeof THREE !== 'undefined';
function initGL() {
  try {
    if (!V3) return; const canvas = document.getElementById('gl'); if (!canvas) return;
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(1); r.setSize(Math.round(W * .6667), Math.round(H * .6667), false); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .92; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
    GL.r = r; GL.scene = new THREE.Scene(); GL.cam = new THREE.PerspectiveCamera(38, W / H, .1, 220);
    GL.root = new THREE.Group(); GL.scene.add(GL.root);
    GL.amb = new THREE.AmbientLight(0xffffff, 1); GL.hemi = new THREE.HemisphereLight(0xbfe0ff, 0x4a6a3a, .5);
    GL.sun = new THREE.DirectionalLight(0xffffff, 2); GL.sun.castShadow = true; GL.sun.shadow.mapSize.set(2048, 2048);
    const sc = GL.sun.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90; GL.sun.shadow.bias = -.0007; GL.sun.shadow.normalBias = .05;
    GL.plight = new THREE.PointLight(0xffe0b0, 0, 14, 1.6); GL.blight = new THREE.PointLight(0xff3060, 0, 30, 1.4);
    GL.scene.add(GL.amb, GL.hemi, GL.sun, GL.sun.target, GL.plight, GL.blight);
    GL.ok = true; fit();
  } catch (e) { console.warn('3D no disponible, uso el modo 2D', e); GL.ok = false; }
}

// ---------- utilidades de materiales y geometrías ----------
const GEO = {};
const geoBox = (w, h, d) => { const k = 'b' + w + ',' + h + ',' + d; return GEO[k] || (GEO[k] = new THREE.BoxGeometry(w, h, d)); };
const MATS = {};
function lam(c, o) { const k = c + (o ? JSON.stringify(o) : ''); return MATS[k] || (MATS[k] = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}))); }
function cTex(canvas, rep) {
  const t = new THREE.CanvasTexture(canvas); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t;
}
const TEXCACHE = {};
function tx(canvas) { const k = canvas.__id || (canvas.__id = 'c' + Math.random()); return TEXCACHE[k] || (TEXCACHE[k] = cTex(canvas)); }
function mesh(geo, mat, x, y, z, cast = true, recv = false) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; return m; }
function inst(parent, geo, mat, items, cast, recv) {
  if (!items.length) return null;
  const m = new THREE.InstancedMesh(geo, mat, items.length), d = new THREE.Object3D();
  items.forEach((p, i) => { d.position.set(p.x, p.y, p.z); d.scale.set(p.sx || 1, p.sy || 1, p.sz || 1); d.rotation.set(0, p.ry || 0, 0); d.updateMatrix(); m.setMatrixAt(i, d.matrix); if (p.color) m.setColorAt(i, p.color); });
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = !!cast; m.receiveShadow = !!recv; m.frustumCulled = false; parent.add(m); return m;
}
function noiseCanvas(w, h, base, cols, seed, p) { return mk(w, h, g => noise(g, base, cols, seed, p, 0, 0, w, h)); }
function labelCanvas(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 40; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 256, 40); g.strokeStyle = '#1a1020'; g.lineWidth = 4; g.strokeRect(2, 2, 252, 36);
  g.fillStyle = fg; g.font = 'bold 20px "Courier New",monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 22); return c;
}

// ---------- construcción del nivel ----------
function glClearLevel() {
  if (GL.lvlGroup) { GL.scene.remove(GL.lvlGroup); GL.lvlGroup.traverse(o => { if (o.isInstancedMesh) o.dispose(); }); }
  for (const [k, o] of GL.objs) GL.root.remove(o.group); GL.objs.clear(); GL.dyn = []; GL.shotObjs = [];
}
function glBuildLevel(L) {
  if (!GL.ok) return; glClearLevel(); GL.lvlRef = L; GL.trainX = 0; GL.exeShow = 0; GL.blds = [];
  const g = new THREE.Group(); GL.lvlGroup = g; GL.scene.add(g);
  const dm = L.theme === 'dream', texs = TEXS[dm ? 'dream' : 'day'];
  // --- ambiente por tema
  const sc = GL.scene;
  if (dm) { sc.background = new THREE.Color(0x140e36); sc.fog = new THREE.Fog(0x241a58, 14, 46); GL.amb.color.set(0x8a7ad0); GL.amb.intensity = 1.05; GL.hemi.color.set(0x8a8aff); GL.hemi.groundColor.set(0x2a1a60); GL.hemi.intensity = .45; GL.sun.color.set(0xb4bcff); GL.sun.intensity = 1.5; GL.plight.intensity = 26; GL.plight.color.set(0xffe2b0); }
  else { sc.background = new THREE.Color(0x8fd3ff); sc.fog = new THREE.Fog(0xb4e2ff, 34, 100); GL.amb.color.set(0xffffff); GL.amb.intensity = 1.15; GL.hemi.color.set(0xbfe0ff); GL.hemi.groundColor.set(0x5a7a3a); GL.hemi.intensity = .5; GL.sun.color.set(0xfff0d4); GL.sun.intensity = 2.5; GL.plight.intensity = 0; }
  GL.blight.intensity = 0;
  // --- suelo (instanciado por tipo/variante)
  const floors = {}, add = (k, x, z) => (floors[k] || (floors[k] = [])).push({ x: x + .5, y: -.15, z: z + .5 });
  const trees = [], rocks = [], bushes = [], blocks = { W: [], R: [] }, flowers = [], mushes = [], waters = [];
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const c0 = L.g[y][x], c = c0 === 'P' ? ((L.pu && L.pu[x + ',' + y]) || '.') : c0, h = hash2(x, y);
    if (c === '~') { waters.push({ x: x + .5, y: -.2, z: y + .5 }); continue; }
    if (c === ',') add('path' + (h % 2), x, y); else if (c === 'a') add('arena' + ((x + y) % 2), x, y);
    else if ('TWCGHdXYZN'.includes(c)) add('dark' + (h % 2), x, y); else add('grass' + (h % 3), x, y);
    if (c === 'T') trees.push([x, y, h]); else if (c === 'R') rocks.push([x, y, h]); else if (c === 'b') bushes.push([x, y, h]);
    else if (c === 'f') flowers.push([x, y, h]); else if (c === 'm') mushes.push([x, y, h]);
    else if (c === 'W') blocks.W.push([x, y, h]);
  }
  const fgeo = geoBox(1, .3, 1);
  for (const k in floors) { const base = k.replace(/\d+$/, ''), v = parseInt(k.slice(base.length)); inst(g, fgeo, new THREE.MeshLambertMaterial({ map: tx(texs[base][v]) }), floors[k], false, true); }
  // agua
  GL.waterTex = cTex(texs.water[0]); GL.waterTex.wrapS = GL.waterTex.wrapT = THREE.RepeatWrapping;
  const wm = new THREE.MeshLambertMaterial({ map: GL.waterTex, transparent: true, opacity: .88 }); GL.waterMat = wm; GL.waterFrames = texs.water.map(c => cTex(c));
  inst(g, geoBox(1, .3, 1), wm, waters, false, true);
  // muros de piedra
  const wallMat = new THREE.MeshLambertMaterial({ map: tx(texs.wall) });
  inst(g, geoBox(1, 1.5, 1), wallMat, blocks.W.map(([x, y]) => ({ x: x + .5, y: .75, z: y + .5 })), true, true);
  // dinámicos: grietas, puertas, puerta de diamantes
  const crackMat = new THREE.MeshLambertMaterial({ map: tx(texs.crack) }), doorTex = DOORCANV.map(c => cTex(c));
  const gateMat = new THREE.MeshLambertMaterial({ map: tx(texs.gate), emissive: 0x2a8aff, emissiveIntensity: .35 });
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const c = L.g[y][x];
    if (c === 'C') { const m = mesh(geoBox(1, 1.5, 1), crackMat, x + .5, .75, y + .5, true, true); g.add(m); GL.dyn.push({ x, y, c, m }); }
    else if (c === 'G') { const m = mesh(geoBox(1, 1.5, 1), gateMat, x + .5, .75, y + .5, true, true); g.add(m); GL.dyn.push({ x, y, c, m, glow: true }); }
    else if (DOORKEY[c] !== undefined) { const m = mesh(geoBox(1, 1.5, 1), new THREE.MeshLambertMaterial({ map: doorTex[DOORKEY[c]] }), x + .5, .75, y + .5, true, true); g.add(m); GL.dyn.push({ x, y, c, m }); }
  }
  // árboles de bloques (tronco + 3 capas de hojas)
  const pal = dm ? [0x6a4ad8, 0xc64ea0, 0x3a78d8, 0x8a6af0] : [0x3aa04a, 0x2f8f3a, 0x4cb85a, 0x58c060];
  const tr = [], l1 = [], l2 = [], l3 = [], rnd3 = (h, k) => ((h >>> k) & 255) / 255;
  for (const [x, y, h] of trees) {
    const s = .85 + rnd3(h, 3) * .45, col = new THREE.Color(pal[h % pal.length]).multiplyScalar(.9 + rnd3(h, 11) * .2), jx = (rnd3(h, 5) - .5) * .25, jz = (rnd3(h, 9) - .5) * .25, ry = (h % 4) * Math.PI / 2;
    tr.push({ x: x + .5 + jx, y: .7 * s, z: y + .5 + jz, sy: s });
    l1.push({ x: x + .5 + jx, y: 1.55 * s, z: y + .5 + jz, sx: s, sy: s, sz: s, color: col, ry }); l2.push({ x: x + .5 + jx, y: 2.2 * s, z: y + .5 + jz, sx: s, sy: s, sz: s, color: col.clone().multiplyScalar(1.1), ry });
    l3.push({ x: x + .5 + jx, y: 2.75 * s, z: y + .5 + jz, sx: s, sy: s, sz: s, color: col.clone().multiplyScalar(1.2), ry });
  }
  const bark = new THREE.MeshLambertMaterial({ map: cTex(noiseCanvas(16, 16, '#6b4424', ['#8f5e32', '#4a2c14', '#5a3820'], 5, .5)) }), leaf = new THREE.MeshLambertMaterial({ map: cTex(leafCanvas()) });
  inst(g, geoBox(.4, 1.4, .4), bark, tr, true, true); inst(g, geoBox(1.7, .7, 1.7), leaf, l1, true, true); inst(g, geoBox(1.3, .7, 1.3), leaf, l2, true, true); inst(g, geoBox(.8, .6, .8), leaf, l3, true, true);
  // rocas y arbustos
  const rockPal = dm ? [0x7a7ab0, 0x6a6aa0] : [0x8a8a98, 0x7a7a88, 0x9a9aa8];
  inst(g, new THREE.DodecahedronGeometry(.55, 0), new THREE.MeshLambertMaterial({ flatShading: true, color: 0xffffff }), rocks.map(([x, y, h]) => ({ x: x + .5, y: .3, z: y + .5, sx: 1.1, sy: .8, sz: 1.0 + rnd3(h, 4) * .3, ry: h % 6, color: new THREE.Color(rockPal[h % rockPal.length]) })), true, true);
  inst(g, geoBox(.95, .75, .95), leaf, bushes.map(([x, y, h]) => ({ x: x + .5, y: .38, z: y + .5, sy: .9 + rnd3(h, 2) * .3, ry: h % 4, color: new THREE.Color(pal[(h >> 2) % pal.length]).multiplyScalar(1.05) })), true, true);
  // flores y hongos
  const fl = []; flowers.forEach(([x, y, h]) => { for (let k = 0; k < 3; k++) fl.push({ x: x + .2 + rnd3(h, k * 3) * .6, y: .18, z: y + .2 + rnd3(h, k * 3 + 1) * .6, color: new THREE.Color([0xff6a8a, 0xffe14a, 0xffffff, 0x9ad0ff, 0xc8bfff][(h >> k) % 5]) }); });
  inst(g, geoBox(.14, .22, .14), new THREE.MeshLambertMaterial({ color: 0xffffff }), fl, false, false);
  const mu = []; mushes.forEach(([x, y, h]) => mu.push({ x: x + .3 + rnd3(h, 2) * .4, y: .22, z: y + .3 + rnd3(h, 6) * .4, sy: .8 + rnd3(h, 8), color: new THREE.Color([0x6ad8ff, 0xff6ad0][h % 2]) }));
  inst(g, geoBox(.3, .3, .3), new THREE.MeshBasicMaterial({ color: 0xffffff }), mu, false, false);
  // matas de pasto y detalles del suelo
  if (!dm) { const tf = [], q = mkRng(91); for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const c = L.g[y][x]; if ((c === '.' || c === 'f') && q() < .5) { const hh = .16 + q() * .22; tf.push({ x: x + .1 + q() * .8, y: hh / 2, z: y + .1 + q() * .8, sy: hh / .2, color: new THREE.Color().setHSL(.27 + q() * .06, .6, .34 + q() * .12) }); } } inst(g, geoBox(.07, .2, .07), new THREE.MeshLambertMaterial({ color: 0xffffff }), tf, false, false); }
  glDeco(g, L);
  // edificios, antorchas, farolas, letreros
  for (const b of L.buildings) glBuilding(g, b, L);
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) if (L.g[y][x] === 'k') glLamp(g, x, y, L);
  for (const s of L.signs) glSign(g, s);
  if (L.train) glTrain(g, L);
  if (L.station) glStation(g, L);
  if (L.arena) { const a = L.arena; GL.arenaC = [(a.x0 + a.x1) / 2 / T, (a.y0 + a.y1) / 2 / T]; }
  GL.camInit = false;
}
function leafCanvas() { return mk(16, 16, g => { noise(g, '#ffffff', ['#e8e8e8', '#d0d0d0', '#f4f4f4', '#bcbcbc'], 77, .6, 0, 0, 16, 16); const q = mkRng(9); for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(Math.floor(q() * 14), Math.floor(q() * 14), 3, 2); } }); }
const DOORCANV = [0, 1, 2].map(k => mk(24, 24, g => {
  const col = ['#d08a4a', '#cfd6ee', '#ffd24a'][k];
  g.fillStyle = '#2a1a0e'; g.fillRect(0, 0, 24, 24); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#8a5a2e' : '#6a4220'; g.fillRect(1 + i * 6, 1, 5, 22); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(1 + i * 6, 1, 1, 22); }
  g.fillStyle = '#2a2230'; g.fillRect(1, 5, 22, 2); g.fillRect(1, 17, 22, 2); g.fillStyle = '#120a06'; g.beginPath(); g.arc(12, 12, 6, 0, 6.3); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(12, 12, 5, 0, 6.3); g.fill(); g.fillStyle = '#1a1020'; g.fillRect(11, 9, 2, 3); g.fillRect(11.5, 12, 1, 4);
}));
function glLamp(g, x, y, L) {
  const dm = L.theme === 'dream', m = new THREE.Group(); m.position.set(x + .5, 0, y + .5);
  m.add(mesh(geoBox(.18, 1.9, .18), lam(0x3a3a48), 0, .95, 0), mesh(geoBox(.5, .12, .5), lam(0x2a2a38), 0, 1.95, 0), mesh(geoBox(.34, .4, .34), new THREE.MeshBasicMaterial({ color: dm ? 0xffc060 : 0xfff0b0 }), 0, 2.15, 0, false), mesh(geoBox(.6, .1, .6), lam(0x2a2a38), 0, 2.42, 0));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: glowTex(dm ? '#ffb040' : '#fff0a0'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: dm ? .85 : .35 })); glow.position.set(0, 2.15, 0); glow.userData.billboard = true; m.add(glow);
  g.add(m); if (dm || L.theme === 'dream') GL.lamps = (GL.lamps || []).concat([m]);
}
const GLOWT = {};
function glowTex(col) { return GLOWT[col] || (GLOWT[col] = cTex(mk(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }))); }
function glSign(g, s) {
  const m = new THREE.Group(); m.position.set(s.x / T, 0, s.y / T);
  m.add(mesh(geoBox(.12, .9, .12), lam(0x6a4a2a), 0, .45, 0), mesh(geoBox(.8, .5, .1), lam(0xc9a15a), 0, 1.0, 0), mesh(geoBox(.6, .08, .12), lam(0x5a3a1a), 0, .92, .01, false)); g.add(m);
}
function glClouds(g) {
  const c = new THREE.Group(); GL.clouds = c; const mt = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .9, emissive: 0x888888 }), q = mkRng(4);
  for (let i = 0; i < 16; i++) { const cl = new THREE.Group(); const n = 3 + Math.floor(q() * 3); for (let k = 0; k < n; k++) cl.add(mesh(geoBox(3 + q() * 3, 1 + q(), 2 + q() * 2), mt, k * 2.2 - n, q() * .6, q() * 1.2, false)); cl.position.set(q() * 130, 14 + q() * 4, q() * 100); c.add(cl); }
  g.add(c);
}
function glBuilding(g, b, L) {
  const w = b.x1 - b.x0 + 1, d = b.y1 - b.y0 + 1, cx = (b.x0 + b.x1 + 1) / 2, cz = (b.y0 + b.y1 + 1) / 2, H = 2.6, grp = new THREE.Group(); grp.position.set(cx, 0, cz);
  const wallC = mk(48, 48, c => { c.fillStyle = b.color; c.fillRect(0, 0, 48, 48); for (let y = 0; y < 48; y += 8) { c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(0, y + 6, 48, 2); } });
  const wm = new THREE.MeshLambertMaterial({ map: tx(wallC), color: 0xffffff });
  grp.add(mesh(geoBox(w - .1, H, d - .1), wm, 0, H / 2, 0, true, true));
  // techo en pirámide
  const roof = new THREE.Mesh(new THREE.ConeGeometry(.5, 1, 4), new THREE.MeshLambertMaterial({ color: b.roof, flatShading: true })); roof.rotation.y = Math.PI / 4;
  roof.scale.set((w + .6) * 1.41, 1.8, (d + .6) * 1.41); roof.position.y = H + .9; roof.castShadow = true; grp.add(roof);
  grp.add(mesh(geoBox(w + .5, .18, d + .5), lam(0x2a1a10), 0, H, 0));
  // ventanas
  const fz = b.face === 'N' ? -1 : 1, win = new THREE.MeshLambertMaterial({ color: 0xbfe9ff, emissive: 0x3a5a7a, emissiveIntensity: .6 });
  for (const sx of [-1, 1]) { const wxp = sx * Math.max(1.4, w / 2 - 1.5); grp.add(mesh(geoBox(.9, .8, .12), lam(0x3a2410), wxp, 1.6, fz * (d / 2 - .05), false)); grp.add(mesh(geoBox(.74, .64, .14), win, wxp, 1.6, fz * (d / 2 - .03), false)); }
  grp.add(mesh(geoBox(.12, .8, d - .6), lam(0x3a2410), w / 2 - .05, 1.6, 0, false)); grp.add(mesh(geoBox(.1, .6, d - .8), win, w / 2 - .04, 1.6, 0, false)); grp.add(mesh(geoBox(.12, .8, d - .6), lam(0x3a2410), -w / 2 + .05, 1.6, 0, false)); grp.add(mesh(geoBox(.1, .6, d - .8), win, -w / 2 + .04, 1.6, 0, false));
  // puerta
  const dxl = b.dx + .5 - cx, doorM = lam(0x7a4e26); grp.add(mesh(geoBox(1.0, 1.7, .16), lam(0x1a0f08), dxl, .85, fz * (d / 2), false), mesh(geoBox(.84, 1.58, .2), doorM, dxl, .85, fz * (d / 2 + .02), false), mesh(geoBox(.14, .14, .24), lam(0xffd24a), dxl + .26, .85, fz * (d / 2 + .02), false));
  // cartel
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w, 6.4), Math.min(w, 6.4) * 40 / 256 * 1.0), new THREE.MeshBasicMaterial({ map: cTex(labelCanvas(b.label, '#2a1a30', '#ffe14a')), transparent: false }));
  sg.position.set(dxl, 2.05, fz * (d / 2 + .05)); if (fz < 0) sg.rotation.y = Math.PI; grp.add(sg);
  // detalles por casa
  if (b.id !== 'mike') { const ch = mesh(geoBox(.5, 1.2, .5), lam(0x8a5a4a), w / 4, H + 1.3, -d / 5); grp.add(ch); grp.add(mesh(geoBox(.6, .1, .6), lam(0x4a3a3a), w / 4, H + 1.95, -d / 5, false)); }
  for (const sx of [-1, 1]) { const wxp = sx * Math.max(1.4, w / 2 - 1.5); grp.add(mesh(geoBox(.95, .22, .28), lam(0x7a4a2a), wxp, 1.1, fz * (d / 2 + .1), false)); for (let i = 0; i < 4; i++) grp.add(mesh(geoBox(.14, .16, .14), lam([0xff6a8a, 0xffe14a, 0xffffff, 0xff9a3a][i]), wxp - .33 + i * .22, 1.28, fz * (d / 2 + .1), false)); }
  if (b.id === 'restaurant') { for (let i = 0; i < 8; i++) grp.add(mesh(geoBox(w / 8 - .02, .1, 1.3), lam(i % 2 ? 0xffffff : 0x2a8a5a), -w / 2 + (i + .5) * w / 8, 2.7, fz * (d / 2 + .6), false)); for (const sx of [-1, 1]) grp.add(mesh(geoBox(.1, 2.6, .1), lam(0x5a3a1a), sx * (w / 2 - .3), 1.3, fz * (d / 2 + 1.2), false)); }
  if (b.id === 'ambrosio') { grp.add(mesh(geoBox(.5, .7, .4), lam(0x2a6ad8), dxl + 1.4, .35, fz * (d / 2 + .5))); }
  if (b.id === 'rius') { for (const [hx, hz] of [[-w / 2 - 1, 0], [-w / 2 - 1, 1.1]]) grp.add(mesh(geoBox(.9, .7, .9), lam(0xe8c24a), hx, .35, hz + d / 2 - 1)); }
  if (b.id === 'mayo') grp.add(mesh(new THREE.CylinderGeometry(.7, .7, .16, 12), lam(0xffc04a), dxl, 3.7, fz * (d / 2 - .4)));
  if (b.id === 'esparta' || b.id === 'invictor') for (const sx of [-1, 1]) grp.add(mesh(new THREE.CylinderGeometry(.22, .26, H, 8), lam(0xf4f0e8), dxl + sx * 1.4, H / 2, fz * (d / 2 + .3)));
  if (b.id === 'invictor') grp.add(mesh(geoBox(.6, 1.6, .06), lam(0xc0282a), dxl - 2.4, 1.8, fz * (d / 2 + .1)));
  if (b.id === 'raptor') grp.add(mesh(geoBox(1.4, .5, .12), new THREE.MeshBasicMaterial({ color: 0xff4a6a }), dxl + 1.6, 3.0, fz * (d / 2 + .1), false));
  if (b.id === 'acenix') { grp.add(mesh(geoBox(w - .4, .22, 1.0), lam(0xff7ab0), 0, 2.3, fz * (d / 2 + .5), false)); }
  if (b.id === 'mike') { grp.add(mesh(geoBox(1.1, .8, 1.1), lam(0x9a6a3a), -w / 2 - 1.2, .4, 0), mesh(geoBox(1.2, .16, 1.2), lam(0x7a2a1a), -w / 2 - 1.2, .88, 0)); }
  grp.userData.b = b; g.add(grp); (GL.blds = GL.blds || []).push(grp);
}
function glTrain(g, L) {
  const t = L.train, len = t.x1 - t.x0 + 1, grp = new THREE.Group(); GL.trainGrp = grp; grp.position.set(t.x0, 0, (t.y0 + t.y1 + 1) / 2);
  const depth = t.y1 - t.y0 + 1;
  // vías
  const rails = new THREE.Group(); for (let x = -1; x < len + 6; x++) rails.add(mesh(geoBox(.4, .12, depth + .6), lam(0x4a3a2a), x + .5, .06, 0, false, true));
  rails.add(mesh(geoBox(len + 8, .1, .14), lam(0x9a9aa8), len / 2 + 2, .17, -depth / 3, false), mesh(geoBox(len + 8, .1, .14), lam(0x9a9aa8), len / 2 + 2, .17, depth / 3, false)); grp.add(rails);
  // vagones y locomotora
  const colors = [0x3a78d8, 0xe8c24a, 0x3a78d8, 0xcc3a3a]; const wag = new THREE.Group(); GL.trainBody = wag; grp.add(wag);
  for (let i = 0; i < 4; i++) {
    const x0 = 1 + i * 3.4, h = new THREE.Group(); h.position.set(x0 + 1.5, 0, 0);
    h.add(mesh(geoBox(3.1, 2.2, depth - 1.0), lam(colors[i]), 0, 1.5, 0, true, true), mesh(geoBox(3.2, .25, depth - .9), lam(0x2a2a38), 0, 2.6, 0));
    for (const wx of [-1, 0, 1]) h.add(mesh(geoBox(.7, .6, depth - .9), new THREE.MeshLambertMaterial({ color: 0xbfe9ff, emissive: 0x3a5a7a, emissiveIntensity: .7 }), wx, 1.8, 0, false));
    for (const wx of [-1.1, 1.1]) for (const wz of [-1, 1]) { const wh = mesh(new THREE.CylinderGeometry(.34, .34, .2, 10), lam(0x1a1a22), wx, .4, wz * (depth / 2 - .6)); wh.rotation.x = Math.PI / 2; h.add(wh); }
    wag.add(h);
  }
  const loc = new THREE.Group(); loc.position.set(len - 3, 0, 0);
  loc.add(mesh(geoBox(4.6, 2.0, depth - 1.0), lam(0x2a2a32), 0, 1.4, 0), mesh(geoBox(1.6, 1.4, depth - .8), lam(0xcc2a2a), -1.2, 3.0, 0), mesh(new THREE.CylinderGeometry(.4, .5, 1.6, 10), lam(0x1a1a22), 1.4, 3.0, 0), mesh(geoBox(.3, .5, depth - .8), lam(0xffd24a), 2.4, 1.0, 0), mesh(geoBox(.2, .4, .2), new THREE.MeshBasicMaterial({ color: 0xfff0a0 }), 2.35, 1.5, 0, false));
  for (const wx of [-1.6, 0, 1.6]) for (const wz of [-1, 1]) { const wh = mesh(new THREE.CylinderGeometry(.5, .5, .2, 10), lam(0x6a1a1a), wx, .5, wz * (depth / 2 - .6)); wh.rotation.x = Math.PI / 2; loc.add(wh); }
  wag.add(loc); g.add(grp);
}
function glStation(g, L) {
  const s = L.station, cx = (s.x0 + s.x1 + 1) / 2, cz = s.y0 + 4;
  for (const sx of [-7, 7]) { g.add(mesh(geoBox(.3, 3.4, .3), lam(0x4a3a2a), cx + sx, 1.7, s.y0 + .6)); g.add(mesh(geoBox(1.6, .8, .08), lam(0xc0392b), cx + sx, 3.0, s.y0 + .6, false)); }
  const clock = mesh(new THREE.CylinderGeometry(.6, .6, .15, 14), lam(0xf4f0e8), cx, 4.4, s.y0 + .6); clock.rotation.x = Math.PI / 2; g.add(clock);
  for (const bx of [-5, 5]) g.add(mesh(geoBox(1.8, .4, .6), lam(0x8a5a30), cx + bx, .45, s.y1 - 2), mesh(geoBox(1.8, .8, .12), lam(0x8a5a30), cx + bx, .9, s.y1 - 2.3));
}

// ---------- decoración de la ciudad ----------
function glDeco(g, L) {
  const wood = lam(0x8a5a30), dwood = lam(0x5a3a1a), stone = lam(0xb8b8c4), grp = [];
  for (const d of L.deco) {
    const m = new THREE.Group(); m.position.set(d.x + .5, 0, d.y + .5); const rot = (d.rot || 0) * Math.PI / 2; m.rotation.y = rot;
    if (d.k === 'bench') m.add(mesh(geoBox(1.1, .12, .42), wood, 0, .5, 0), mesh(geoBox(1.1, .4, .08), wood, 0, .8, -.2), mesh(geoBox(.1, .5, .4), dwood, -.45, .25, 0), mesh(geoBox(.1, .5, .4), dwood, .45, .25, 0));
    else if (d.k === 'rim') m.add(mesh(geoBox(1, .5, 1), stone, 0, .25, 0, true, true));
    else if (d.k === 'statue') { m.add(mesh(geoBox(.9, .6, .9), stone, 0, .3, 0), mesh(geoBox(.5, 1.3, .5), lam(0xe8e8ee), 0, 1.25, 0), mesh(geoBox(.62, .62, .62), lam(0xf4f4fa), 0, 2.2, 0), mesh(geoBox(.7, .2, .7), lam(0xffd24a), 0, 2.6, 0)); }
    else if (d.k === 'stall') { const c = d.c || '#e84a4a'; m.add(mesh(geoBox(1.9, .9, .9), wood, 0, .45, .2), mesh(geoBox(.1, 2, .1), dwood, -.9, 1, -.35), mesh(geoBox(.1, 2, .1), dwood, .9, 1, -.35), mesh(geoBox(2.2, .14, 1.5), lam(c), 0, 2.05, .05)); for (let i = 0; i < 4; i++) m.add(mesh(geoBox(.3, .06, 1.5), lam(0xffffff), -.75 + i * .5, 2.13, .05, false)); for (let i = 0; i < 4; i++) m.add(mesh(geoBox(.22, .22, .22), lam([0xff4a4a, 0xffd24a, 0x58c058, 0xff9a3a][i]), -.6 + i * .4, 1.0, .2, false)); }
    else if (d.k === 'table') { const c = d.c || '#e84a4a'; m.add(mesh(geoBox(.12, 1.1, .12), dwood, 0, .55, 0), mesh(geoBox(1.0, .1, 1.0), lam(0xfff4dc), 0, 1.0, 0), mesh(new THREE.ConeGeometry(.85, .5, 8), lam(c), 0, 2.1, 0), mesh(geoBox(.08, 1.2, .08), lam(0xdddddd), 0, 1.6, 0, false)); for (const sx of [-1, 1]) m.add(mesh(geoBox(.34, .4, .34), wood, sx * .8, .2, 0)); }
    else if (d.k === 'gazebo') { for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) m.add(mesh(geoBox(.2, 2.2, .2), lam(0xf4f0e8), sx * .8, 1.1, sz * .8)); m.add(mesh(new THREE.ConeGeometry(1.5, 1.0, 4), lam(0x3a8a5a), 0, 2.7, 0), mesh(geoBox(1.9, .14, 1.9), lam(0xf4f0e8), 0, 2.2, 0)); m.children[m.children.length - 1].castShadow = true; m.children[m.children.length - 2].rotation.y = Math.PI / 4; }
    else if (d.k === 'mail') m.add(mesh(geoBox(.1, .7, .1), dwood, 0, .35, 0), mesh(geoBox(.4, .3, .3), lam(0x2a6ad8), 0, .8, 0));
    else if (d.k === 'tree2') { const cols = [0xff8ab0, 0xffb0c8, 0xffa0d0]; m.add(mesh(geoBox(.34, 1.3, .34), lam(0x6b4424), 0, .65, 0)); for (const [x, y, z, w] of [[0, 1.6, 0, 1.4], [-.4, 1.4, .2, 1.0], [.4, 1.5, -.2, 1.0], [0, 2.1, 0, .9]]) m.add(mesh(geoBox(w, .7, w), lam(cols[(d.x + d.y) % 3]), x, y, z)); }
    g.add(m);
  }
}
