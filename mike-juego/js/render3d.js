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
function roundBox(w, h, d, r) {
  const g = new THREE.BoxGeometry(w, h, d, 4, 4, 4), p = g.attributes.position, n = g.attributes.normal, hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, v = new THREE.Vector3(), c = new THREE.Vector3(), dr = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i)); c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z))); dr.copy(v).sub(c); const len = dr.length();
    if (len > 1e-6) { dr.divideScalar(len); v.copy(c).addScaledVector(dr, r); n.setXYZ(i, dr.x, dr.y, dr.z); p.setXYZ(i, v.x, v.y, v.z); }
  }
  return g;
}
const geoBox = (w, h, d) => { const k = 'b' + w + ',' + h + ',' + d; if (!GEO[k]) { const r = Math.min(.1, Math.min(w, h, d) * .38); GEO[k] = r < .02 ? new THREE.BoxGeometry(w, h, d) : roundBox(w, h, d, r); } return GEO[k]; };
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
  for (const [k, o] of GL.objs) GL.root.remove(o.group); GL.objs.clear(); GL.dyn = []; GL.shotObjs = []; GL.portals = []; GL.trainGrp = null; GL.trainBody = null; GL.clouds = null; GL.winMats = []; GL.crystals = [];
}
const THEME = {
  farm: { bg: 0xcfe8ff, fog: 0xdcefff, fr: [34, 100], amb: [0xfff4e0, 1.1], hemi: [0xdcefff, 0x8aa05a, .55], sun: [0xffe8b0, 2.3], plight: 0, floor: 0xf0ffd0, path: 0xf0d8a0, arena: 0xf4e4b8, wall: 0xf5e0b8, water: 0x9ad0ff, tree: [0x7ab84a, 0x9ccc4a, 0xd0dc5a, 0x6aa84a], ground: 0x9cbc62 },
  factory: { bg: 0x6a5a56, fog: 0x7a6258, fr: [26, 80], amb: [0xffe0c0, 1.0], hemi: [0xffd9b0, 0x4a3a34, .55], sun: [0xffc88a, 1.8], plight: 12, floor: 0xc8b8a8, path: 0x9a8a80, arena: 0xb8a090, wall: 0xd0a070, water: 0x6a9ac0, tree: [0x7a8a9a, 0x6a7a8a, 0x8a98a8, 0xb07a4a], ground: 0x6a625a },
  cloud: { bg: 0xdceaff, fog: 0xe8f1ff, fr: [34, 100], amb: [0xf0f6ff, 1.15], hemi: [0xf0f6ff, 0xb8c8e8, .6], sun: [0xfff6e0, 1.8], plight: 0, floor: 0xf2f6ff, path: 0xffffff, arena: 0xe4ecff, wall: 0xf8fbff, water: 0xbfe0ff, tree: [0xe8f4ff, 0xd0e4ff, 0xffffff, 0xcfe0ff], ground: 0xe6eeff },
  neon: { bg: 0x140828, fog: 0x1c0c3a, fr: [16, 56], amb: [0xb890ff, .95], hemi: [0xb890ff, 0x20104a, .5], sun: [0xff9ae0, 1.2], plight: 26, floor: 0x8a6ad8, path: 0x5a4aa8, arena: 0x7a5ac8, wall: 0x6a4aa8, water: 0x4ae8ff, tree: [0xff4ad0, 0x4affea, 0xffe24a, 0xb04aff], ground: 0x160a30 },
  colosseum: { bg: 0xf2d8a8, fog: 0xf6e0b8, fr: [34, 100], amb: [0xfff0d0, 1.1], hemi: [0xfff0d0, 0xb89a60, .55], sun: [0xffe4a0, 2.4], plight: 0, floor: 0xe8c890, path: 0xd8b078, arena: 0xe8c080, wall: 0xe8c898, water: 0x8ac0d0, tree: [0xa8b858, 0x88a048, 0xb8c860, 0x98a850], ground: 0xdcc088 },
  void: { bg: 0x0a0006, fog: 0x240012, fr: [14, 50], amb: [0xff6a8a, .9], hemi: [0xff6a8a, 0x2a0414, .5], sun: [0xff3a5a, 1.3], plight: 22, floor: 0x7a3a4a, path: 0x4a1a28, arena: 0x6a2a3a, wall: 0x5a1a2a, water: 0x2a0a3a, tree: [0x501020, 0x701838, 0x3a0c1c, 0x901c48], ground: 0x14040a }
};
function glThemeMood(L) {
  const th0 = THEME[L.theme]; if (th0) { const sc = GL.scene; sc.background = new THREE.Color(th0.bg); sc.fog = new THREE.Fog(th0.fog, th0.fr[0], th0.fr[1]); GL.amb.color.set(th0.amb[0]); GL.amb.intensity = th0.amb[1]; GL.hemi.color.set(th0.hemi[0]); GL.hemi.groundColor.set(th0.hemi[1]); GL.hemi.intensity = th0.hemi[2]; GL.sun.color.set(th0.sun[0]); GL.sun.intensity = th0.sun[1]; GL.plight.intensity = th0.plight; GL.plight.color.set(0xffe2b0); GL.snow = false; return; }
  const sc = GL.scene, th = L.theme; GL.snow = false;
  if (th === 'dream') { sc.background = new THREE.Color(0x1c1640); sc.fog = new THREE.Fog(0x2a2058, 16, 50); GL.amb.color.set(0x9a8ad8); GL.amb.intensity = 1.0; GL.hemi.color.set(0x9a9aff); GL.hemi.groundColor.set(0x2a1a60); GL.hemi.intensity = .45; GL.sun.color.set(0xc4ccff); GL.sun.intensity = 1.4; GL.plight.intensity = 22; GL.plight.color.set(0xffe2b0); }
  else if (th === 'sweet') { sc.background = new THREE.Color(0xf4cfe4); sc.fog = new THREE.Fog(0xf6d8ea, 30, 90); GL.amb.color.set(0xfff0f8); GL.amb.intensity = 1.1; GL.hemi.color.set(0xffd8f0); GL.hemi.groundColor.set(0xc08ad0); GL.hemi.intensity = .5; GL.sun.color.set(0xfff0d0); GL.sun.intensity = 2.1; GL.plight.intensity = 0; }
  else if (th === 'indoor') { sc.background = new THREE.Color(0x2a1e1c); sc.fog = new THREE.Fog(0x2a1e1c, 30, 60); GL.amb.color.set(0xffe2c0); GL.amb.intensity = 1.0; GL.hemi.color.set(0xffd9b0); GL.hemi.groundColor.set(0x6a4a32); GL.hemi.intensity = .7; GL.sun.color.set(0xffd9a0); GL.sun.intensity = 1.1; GL.plight.intensity = 28; GL.plight.color.set(0xffd9a0); }
  else { sc.background = new THREE.Color(0xc9d9ee); sc.fog = new THREE.Fog(0xd3deef, 32, 95); GL.amb.color.set(0xe6edff); GL.amb.intensity = 1.0; GL.hemi.color.set(0xdce8ff); GL.hemi.groundColor.set(0x667a66); GL.hemi.intensity = .55; GL.sun.color.set(0xffe4b4); GL.sun.intensity = 2.1; GL.plight.intensity = 0; GL.snow = true; }
}
function glBuildLevel(L) {
  if (!GL.ok) return; glClearLevel(); GL.lvlRef = L; GL.trainX = 0; GL.exeShow = 0; GL.blds = [];
  const g = new THREE.Group(); GL.lvlGroup = g; GL.scene.add(g);
  const dm = L.theme === 'dream', texs = TEXS[dm ? 'dream' : 'day'];
  // --- ambiente por tema
  const sc = GL.scene;
  if (dm) { sc.background = new THREE.Color(0x140e36); sc.fog = new THREE.Fog(0x241a58, 14, 46); GL.amb.color.set(0x8a7ad0); GL.amb.intensity = 1.05; GL.hemi.color.set(0x8a8aff); GL.hemi.groundColor.set(0x2a1a60); GL.hemi.intensity = .45; GL.sun.color.set(0xb4bcff); GL.sun.intensity = 1.5; GL.plight.intensity = 26; GL.plight.color.set(0xffe2b0); }
  else { sc.background = new THREE.Color(0x8fd3ff); sc.fog = new THREE.Fog(0xb4e2ff, 34, 100); GL.amb.color.set(0xffffff); GL.amb.intensity = 1.15; GL.hemi.color.set(0xbfe0ff); GL.hemi.groundColor.set(0x5a7a3a); GL.hemi.intensity = .5; GL.sun.color.set(0xfff0d4); GL.sun.intensity = 2.5; GL.plight.intensity = 0; }
  const TH = THEME[L.theme] || null, sw = L.theme === 'sweet'; if (sw) { sc.background = new THREE.Color(0xffc4e4); sc.fog = new THREE.Fog(0xffd6ee, 30, 90); GL.amb.color.set(0xfff0f8); GL.amb.intensity = 1.2; GL.hemi.color.set(0xffd0f0); GL.hemi.groundColor.set(0xc08ad0); GL.sun.color.set(0xfff4d0); GL.sun.intensity = 2.3; }
  glThemeMood(L); GL.blight.intensity = 0;
  // --- suelo (instanciado por tipo/variante)
  const floors = {}, add = (k, x, z) => (floors[k] || (floors[k] = [])).push({ x: x + .5, y: -.15, z: z + .5 });
  const stoneV = [], trees = [], rocks = [], bushes = [], blocks = { W: [], R: [] }, flowers = [], mushes = [], waters = [];
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const c0 = L.g[y][x], c = c0 === 'P' ? ((L.pu && L.pu[x + ',' + y]) || '.') : c0, h = hash2(x, y);
    if (c === 'v') { waters.push({ x: x + .5, y: -.2, z: y + .5 }); stoneV.push([x, y]); continue; }
    if (c === '~') { waters.push({ x: x + .5, y: -.2, z: y + .5 }); continue; }
    if (L.theme === 'indoor') { add(c === 'W' ? 'dark0' : 'arena' + ((x + y) % 2), x, y); if (c === 'W') blocks.W.push([x, y, h]); continue; }
    if (c === ',') add('path' + (h % 2), x, y); else if (c === 'a') add('arena' + ((x + y) % 2), x, y);
    else if ('TWCGHdXYZN'.includes(c)) add('dark' + (h % 2), x, y); else add('grass' + (h % 3), x, y);
    if (c === 'T') trees.push([x, y, h]); else if (c === 'R') rocks.push([x, y, h]); else if (c === 'b') bushes.push([x, y, h]);
    else if (c === 'f') flowers.push([x, y, h]); else if (c === 'm') mushes.push([x, y, h]);
    else if (c === 'W') blocks.W.push([x, y, h]);
  }
  const fgeo = new THREE.BoxGeometry(1, .3, 1);
  for (const k in floors) { const base = k.replace(/\d+$/, ''), v = parseInt(k.slice(base.length)); inst(g, fgeo, new THREE.MeshLambertMaterial({ map: tx(texs[base][v]), color: L.theme === 'indoor' ? (base === 'arena' ? 0xe2b57e : 0x6a5a50) : TH ? (base === 'path' ? TH.path : base === 'arena' ? TH.arena : TH.floor) : sw ? (base === 'path' ? 0xfff0d0 : base === 'arena' ? 0xffd8f0 : 0xffd0ec) : 0xffffff }), floors[k], false, true); }
  // agua
  GL.waterTex = cTex(texs.water[0]); GL.waterTex.wrapS = GL.waterTex.wrapT = THREE.RepeatWrapping;
  const wm = new THREE.MeshLambertMaterial({ map: GL.waterTex, transparent: true, opacity: .9, color: TH ? TH.water : sw ? 0xa86a44 : 0xffffff }); GL.waterMat = wm; GL.waterFrames = texs.water.map(c => cTex(c));
  inst(g, geoBox(1, .3, 1), wm, waters, false, true);
  // muros de piedra
  const ind = L.theme === 'indoor', wallMat = new THREE.MeshLambertMaterial({ map: tx(texs.wall), color: ind ? 0xf0dcc0 : TH ? TH.wall : sw ? 0xffe4f2 : 0xffffff });
  inst(g, ind ? geoBox(1, 2.6, 1) : geoBox(1, 1.5, 1), wallMat, blocks.W.map(([x, y]) => ({ x: x + .5, y: ind ? 1.3 : .75, z: y + .5 })), true, true);
  // dinámicos: grietas, puertas, puerta de diamantes
  const crackMat = new THREE.MeshLambertMaterial({ map: tx(texs.crack) }), doorTex = DOORCANV.map(c => cTex(c));
  const gateMat = new THREE.MeshLambertMaterial({ map: tx(texs.gate), emissive: 0x2a8aff, emissiveIntensity: .35 });
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const c = L.g[y][x];
    if (c === 'C') { const m = mesh(geoBox(1, 1.5, 1), crackMat, x + .5, .75, y + .5, true, true); g.add(m); GL.dyn.push({ x, y, c, m }); }
    else if (c === 'G') { const m = mesh(geoBox(1, 1.5, 1), gateMat, x + .5, .75, y + .5, true, true); g.add(m); GL.dyn.push({ x, y, c, m, glow: true }); }
    else if (DOORKEY[c] !== undefined) { const m = mesh(geoBox(1, 1.5, 1), new THREE.MeshLambertMaterial({ map: doorTex[DOORKEY[c]] }), x + .5, .75, y + .5, true, true); g.add(m); GL.dyn.push({ x, y, c, m }); }
  }
  { const sm = new THREE.MeshLambertMaterial({ color: 0xb8c0cc }); for (const [x, y] of stoneV) { const m = mesh(geoBox(.94, .34, .94), sm, x + .5, -.08, y + .5, true, true); g.add(m); GL.dyn.push({ x, y, c: 'v', m, keep: true }); } }
  if (L.theme === 'city') {
    const q3 = mkRng(77), buckets = [[], [], [], [], [], [], []], rub = [[], [], [], [], [], [], []];
    for (let n = 0; n < 380; n++) { const x = 4 + Math.floor(q3() * (L.w - 8)), y = 4 + Math.floor(q3() * (L.h - 8)), c = L.g[y][x]; if (c !== '.' && c !== ',' && c !== 'f' && c !== 'a') continue; const k = n % 7; buckets[k].push({ x: x + .5, y: .8, z: y + .5, sx: .7 + q3() * .6, sy: .8 + q3() * 1.4, sz: .7 + q3() * .6, ry: q3() * 6 }); rub[k].push({ x: x + .5 + (q3() - .5), y: .15, z: y + .5 + (q3() - .5), sx: .6 + q3() * .8, sy: .5 + q3(), sz: .6 + q3() * .8, ry: q3() * 6, color: new THREE.Color(0x3a2a36) }); }
    const cg = new THREE.ConeGeometry(.35, 1.6, 4), cm = new THREE.MeshLambertMaterial({ color: 0xd02a7a, emissive: 0x9a1a5a, emissiveIntensity: .8 }), rm = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (let k = 0; k < 7; k++) { const a = inst(g, cg, cm, buckets[k], true, false), r2 = inst(g, geoBox(.6, .5, .6), rm, rub[k], true, true); GL.crystals.push({ k: k + 1, ms: [a, r2].filter(Boolean) }); }
  }
  // bosque y suelo más allá del borde del mapa (para que no se vea vacío)
  if (L.theme !== 'indoor') {
    const Bd = 26; for (let y = -Bd; y < L.h + Bd; y++) for (let x = -Bd; x < L.w + Bd; x++) { if (x >= 0 && x < L.w && y >= 0 && y < L.h) continue; const h = hash2(x + 500, y + 500); if (h % 100 < 40) trees.push([x, y, h]); }
    const gc = THEME[L.theme] ? THEME[L.theme].ground : L.theme === 'dream' ? 0x2c1c66 : L.theme === 'sweet' ? 0xe8a8d0 : 0x86a47c, og = new THREE.Mesh(new THREE.PlaneGeometry(L.w + Bd * 2 + 60, L.h + Bd * 2 + 60), new THREE.MeshLambertMaterial({ color: gc })); og.rotation.x = -Math.PI / 2; og.position.set(L.w / 2, -.17, L.h / 2); og.receiveShadow = true; g.add(og);
  }
  // árboles de bloques (tronco + 3 capas de hojas)
  const pal = dm ? [0x6a4ad8, 0xc64ea0, 0x3a78d8, 0x8a6af0] : TH ? TH.tree : sw ? [0xff9ac8, 0xff7ab8, 0xffb8d8, 0xc8a0ff] : [0x3aa04a, 0x2f8f3a, 0x4cb85a, 0x58c060];
  const tr = [], l1 = [], l2 = [], l3 = [], rnd3 = (h, k) => ((h >>> k) & 255) / 255;
  for (const [x, y, h] of trees) {
    const s = .85 + rnd3(h, 3) * .45, col = new THREE.Color(pal[h % pal.length]).multiplyScalar(.9 + rnd3(h, 11) * .2), jx = (rnd3(h, 5) - .5) * .25, jz = (rnd3(h, 9) - .5) * .25, ry = (h % 4) * Math.PI / 2;
    tr.push({ x: x + .5 + jx, y: .7 * s, z: y + .5 + jz, sy: s });
    l1.push({ x: x + .5 + jx, y: 1.55 * s, z: y + .5 + jz, sx: s, sy: s, sz: s, color: col, ry }); l2.push({ x: x + .5 + jx, y: 2.2 * s, z: y + .5 + jz, sx: s, sy: s, sz: s, color: col.clone().multiplyScalar(1.1), ry });
    l3.push({ x: x + .5 + jx, y: 2.75 * s, z: y + .5 + jz, sx: s, sy: s, sz: s, color: L.theme === 'city' ? new THREE.Color(0xeef4ff) : col.clone().multiplyScalar(1.2), ry });
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
  if (L.theme === 'city') { const spn = [], q2 = mkRng(55); for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const c = L.g[y][x]; if ((c === '.' || c === 'f') && q2() < .13) spn.push({ x: x + .5 + (q2() - .5) * .3, y: .04, z: y + .5 + (q2() - .5) * .3, sx: .5 + q2() * .5, sz: .5 + q2() * .5, sy: 1, color: new THREE.Color(0xf2f6ff) }); } inst(g, geoBox(.9, .08, .9), new THREE.MeshLambertMaterial({ color: 0xffffff }), spn, false, true); }
  if (L.theme !== 'indoor' && !dm) { const tf = [], q = mkRng(91); for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) { const c = L.g[y][x]; if ((c === '.' || c === 'f') && q() < .5) { const hh = .16 + q() * .22; tf.push({ x: x + .1 + q() * .8, y: hh / 2, z: y + .1 + q() * .8, sy: hh / .2, color: new THREE.Color().setHSL(.27 + q() * .06, .6, .34 + q() * .12) }); } } inst(g, geoBox(.07, .2, .07), new THREE.MeshLambertMaterial({ color: 0xffffff }), tf, false, false); }
  glDeco(g, L); if (L.theme === 'indoor') glIndoor(g, L);
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
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: glowTex(dm ? '#ffb040' : '#ffd890'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: dm ? .85 : .75 })); glow.position.set(0, 2.15, 0); glow.userData.billboard = true; m.add(glow);
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
  const w = b.x1 - b.x0 + 1, d = b.y1 - b.y0 + 1, cx = (b.x0 + b.x1 + 1) / 2, cz = (b.y0 + b.y1 + 1) / 2, H = (b.id === 'house' && (b.zone || 0) % 3 === 0) ? 4.6 : 2.6, grp = new THREE.Group(); grp.position.set(cx, 0, cz);
  const fz = b.face === 'N' ? -1 : 1, wood = lam(0x6a4426), dwood = lam(0x3a2410), snowM = new THREE.MeshLambertMaterial({ color: 0xf4f8ff });
  const wallC = mk(48, 48, c => { c.fillStyle = b.color; c.fillRect(0, 0, 48, 48); for (let y = 0; y < 48; y += 6) { c.fillStyle = 'rgba(0,0,0,.09)'; c.fillRect(0, y + 5, 48, 1); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, y, 48, 1); } });
  const wm = new THREE.MeshLambertMaterial({ map: tx(wallC), color: 0xffffff });
  // cimiento de piedra, paredes y esquinas de madera
  grp.add(mesh(geoBox(w + .12, .4, d + .12), lam(0x8a8a96), 0, .2, 0, true, true));
  grp.add(mesh(geoBox(w - .1, H - .4, d - .1), wm, 0, .4 + (H - .4) / 2, 0, true, true));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) grp.add(mesh(geoBox(.24, H, .24), wood, sx * (w / 2 - .02), H / 2, sz * (d / 2 - .02)));
  grp.add(mesh(geoBox(w + .1, .16, d + .1), dwood, 0, H - .04, 0));
  // tejado (cambia de una casa a otra)
  const sty = b.id === 'mike' ? 0 : ((b.zone || 0) % 4), rise = 1.5, roofM = new THREE.MeshLambertMaterial({ color: b.roof }), roofG = new THREE.Group(); roofG.position.y = H; grp.add(roofG);
  const mkGable = (w2, d2) => {
    const g2 = new THREE.Group(), rs = Math.min(1.9, d2 * .42 + .3), ov = .5, run = w2 / 2 + ov, len = Math.hypot(run, rs), ang = Math.atan2(rs, run);
    for (const sx of [-1, 1]) {
      const r = mesh(geoBox(len, .24, d2 + .8), roofM, sx * run / 2, rs / 2 + .05, 0); r.rotation.z = -sx * ang; g2.add(r);
      const sl = len * .5, off = len * .25, sn = mesh(geoBox(sl, .1, d2 + .72), snowM, sx * run / 2 - sx * Math.cos(ang) * off + sx * Math.sin(ang) * .16, rs / 2 + .05 + Math.sin(ang) * off + Math.cos(ang) * .16, 0, false); sn.rotation.z = -sx * ang; g2.add(sn);
    }
    g2.add(mesh(geoBox(.34, .2, d2 + .85), lam(0x4a3a30), 0, rs + .12, 0), mesh(geoBox(.3, .1, d2 + .7), snowM, 0, rs + .27, 0, false));
    const sh = new THREE.Shape(); sh.moveTo(-d2 / 2 + .05, 0); sh.lineTo(d2 / 2 - .05, 0); sh.lineTo(0, rs - .02); sh.closePath(); const gg = new THREE.ExtrudeGeometry(sh, { depth: .2, bevelEnabled: false }); gg.rotateY(Math.PI / 2);
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(gg, wm); m.position.x = sx > 0 ? w2 / 2 - .22 : -w2 / 2 + .02; m.castShadow = true; g2.add(m); }
    return g2;
  };
  if (sty === 0) roofG.add(mkGable(w, d));
  else if (sty === 2) { const g3 = mkGable(d, w); g3.rotation.y = Math.PI / 2; roofG.add(g3); }
  else if (sty === 1) { const hr = Math.min(2.2, Math.min(w, d) * .5 + .4), pyr = new THREE.Mesh(new THREE.ConeGeometry(.5, 1, 4), roofM); pyr.rotation.y = Math.PI / 4; pyr.scale.set((w + .9) * 1.414, hr, (d + .9) * 1.414); pyr.position.y = hr / 2; pyr.castShadow = true; roofG.add(pyr);
    const sc2 = new THREE.Mesh(new THREE.ConeGeometry(.5, 1, 4), snowM); sc2.rotation.y = Math.PI / 4; sc2.scale.set((w + .9) * 1.414 * .45, hr * .45, (d + .9) * 1.414 * .45); sc2.position.y = hr * .78; roofG.add(sc2); }
  else { roofG.add(mesh(geoBox(w + .5, .3, d + .5), roofM, 0, .15, 0), mesh(geoBox(w + .3, .1, d + .3), snowM, 0, .35, 0, false)); for (const [px, pz, sw2, sd2] of [[0, -d / 2 - .1, w + .6, .2], [0, d / 2 + .1, w + .6, .2], [-w / 2 - .1, 0, .2, d + .4], [w / 2 + .1, 0, .2, d + .4]]) roofG.add(mesh(geoBox(sw2, .5, sd2), lam(0xdedede), px, .5, pz)); }
  // chimenea
  grp.add(mesh(geoBox(.6, 1.5, .6), lam(0x9a5a4a), w / 4, H + 1.2, -d / 5), mesh(geoBox(.74, .14, .74), snowM, w / 4, H + 2.0, -d / 5, false));
  // ventanas con marco, cruz, repisa y postigos
  const win = new THREE.MeshLambertMaterial({ color: 0xffe2a0, emissive: 0xffa84a, emissiveIntensity: .85 }); (GL.winMats = GL.winMats || []).push(win);
  const windowAt = (x, y, z, rotY) => { const gw = new THREE.Group(); gw.position.set(x, y, z); gw.rotation.y = rotY; gw.add(mesh(geoBox(1.1, 1.0, .14), wood, 0, 0, 0, false), mesh(geoBox(.86, .76, .16), win, 0, 0, .01, false), mesh(geoBox(.08, .76, .18), wood, 0, 0, .02, false), mesh(geoBox(.86, .08, .18), wood, 0, 0, .02, false), mesh(geoBox(1.3, .12, .3), lam(0x8a8a96), 0, -.58, .1, false), mesh(geoBox(.22, .9, .1), lam(0x3a6a8a), -.7, 0, .02, false), mesh(geoBox(.22, .9, .1), lam(0x3a6a8a), .7, 0, .02, false)); for (let i = 0; i < 4; i++) gw.add(mesh(geoBox(.14, .16, .14), lam([0xff6a8a, 0xffe14a, 0xffffff, 0xff9a3a][i]), -.33 + i * .22, -.44, .2, false)); grp.add(gw); };
  for (const sx of [-1, 1]) windowAt(sx * Math.max(1.5, w / 2 - 1.5), 1.75, fz * (d / 2 - .02), fz < 0 ? Math.PI : 0);
  if (H > 3) { for (const sx of [-1, 0, 1]) windowAt(sx * Math.max(1.4, w / 2 - 1.4), 3.7, fz * (d / 2 - .02), fz < 0 ? Math.PI : 0); grp.add(mesh(geoBox(w + .3, .12, .6), lam(0x8a8a96), 0, 2.7, fz * (d / 2 + .15), false)); }
  for (const sz of [-1, 1]) { windowAt(w / 2 - .02, 1.75, sz * (d / 5), Math.PI / 2); windowAt(-w / 2 + .02, 1.75, sz * (d / 5), -Math.PI / 2); }
  // puerta con marco, escalón, techito, farol y corona navideña
  const dxl = b.dx + .5 - cx, dz0 = fz * (d / 2);
  grp.add(mesh(geoBox(1.4, 1.9, .18), wood, dxl, 1.35, dz0 + fz * .02, false), mesh(geoBox(1.0, 1.7, .22), lam(0x7a4e26), dxl, 1.25, dz0 + fz * .04, false), mesh(geoBox(.12, .12, .26), lam(0xffd24a), dxl + .3, 1.2, dz0 + fz * .06, false));
  grp.add(mesh(geoBox(1.9, .22, .9), lam(0x9a9aa6), dxl, .11, dz0 + fz * .55), mesh(geoBox(1.9, .08, .9), snowM, dxl, .26, dz0 + fz * .55, false));
  grp.add(mesh(geoBox(1.9, .14, .9), roofM, dxl, 2.35, dz0 + fz * .45), mesh(geoBox(1.9, .08, .9), snowM, dxl, 2.46, dz0 + fz * .45, false));
  for (const sx of [-1, 1]) grp.add(mesh(geoBox(.1, 1.1, .1), wood, dxl + sx * .88, 1.8, dz0 + fz * .85, false));
  grp.add(mesh(geoBox(.16, .24, .16), new THREE.MeshBasicMaterial({ color: 0xffd890 }), dxl + 1.2, 1.9, dz0 + fz * .1, false));
  const wr = new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 6, 12), new THREE.MeshLambertMaterial({ color: 0x2f8f4a })); wr.position.set(dxl, 1.7, dz0 + fz * .16); wr.rotation.y = fz < 0 ? Math.PI : 0; grp.add(wr); grp.add(mesh(geoBox(.14, .12, .06), new THREE.MeshBasicMaterial({ color: 0xff3a3a }), dxl, 1.5, dz0 + fz * .18, false));
  // luces de colores en el alero
  for (let i = 0; i < Math.floor(w * 1.6); i++) grp.add(mesh(geoBox(.12, .12, .12), new THREE.MeshBasicMaterial({ color: [0xff5a5a, 0xffd24a, 0x5acaff, 0x7aff8a][i % 4] }), -w / 2 + .3 + i * (w - .6) / Math.max(1, Math.floor(w * 1.6) - 1), H - .2, fz * (d / 2 + .1), false));
  // cartel
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w, 6.4), Math.min(w, 6.4) * 40 / 256), new THREE.MeshBasicMaterial({ map: cTex(labelCanvas(b.label, '#2a1a30', '#ffe14a')) }));
  sg.position.set(dxl, 2.85, fz * (d / 2 + .06)); if (fz < 0) sg.rotation.y = Math.PI; sg.scale.setScalar(.8); grp.add(sg);
  // detalles por casa
  if (b.id === 'ambrosio') { grp.add(mesh(geoBox(.5, .7, .4), lam(0x2a6ad8), dxl + 1.7, .35, fz * (d / 2 + .5))); }
  if (b.id === 'rius') { for (const [hx, hz] of [[-w / 2 - 1, 0], [-w / 2 - 1, 1.1]]) grp.add(mesh(geoBox(.9, .7, .9), lam(0xe8c24a), hx, .35, hz + d / 2 - 1)); }
  if (b.id === 'mayo') grp.add(mesh(new THREE.CylinderGeometry(.7, .7, .16, 12), lam(0xffc04a), dxl, 3.9, fz * (d / 2 - .4)));
  if (b.id === 'invictor') for (const sx of [-1, 1]) grp.add(mesh(new THREE.CylinderGeometry(.22, .26, H, 8), lam(0xf4f0e8), dxl + sx * 1.5, H / 2, fz * (d / 2 + .6)));
  if (b.id === 'raptor') grp.add(mesh(geoBox(1.4, .5, .12), new THREE.MeshBasicMaterial({ color: 0xff4a6a }), dxl + 1.9, 3.2, fz * (d / 2 + .1), false));
  if (b.id === 'acenix') { grp.add(mesh(geoBox(w - .4, .22, 1.0), lam(0xff7ab0), 0, 2.2, fz * (d / 2 + .6), false)); }
  if (b.id === 'restaurant') { for (let i = 0; i < 8; i++) grp.add(mesh(geoBox(w / 8 - .02, .1, 1.3), lam(i % 2 ? 0xffffff : 0x2a8a5a), -w / 2 + (i + .5) * w / 8, 2.75, fz * (d / 2 + .7), false)); }
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
    else if (d.k === 'portal') {
      const col = d.lock === 'boss' ? 0xff9ad0 : 0x7df3ff, ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, .14, 8, 28), new THREE.MeshBasicMaterial({ color: col })); ring.position.y = 1.5; ring.rotation.x = -Math.PI / 2 + .0; ring.userData.spin = 1;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide })); disc.position.y = 1.5; disc.rotation.x = -Math.PI / 2;
      const base = mesh(new THREE.CylinderGeometry(1.5, 1.7, .3, 14), lam(0x3a3a58), 0, .15, 0); const glow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: glowTex(d.lock === 'boss' ? '#ff9ad0' : '#7df3ff'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .6 })); glow.position.y = 1.6; glow.userData.billboard = true;
      m.add(base, ring, disc, glow); m.userData.portal = d; (GL.portals = GL.portals || []).push(m);
    }
    else if (d.k === 'xtree') { m.add(mesh(geoBox(.5, .6, .5), lam(0x6b4424), 0, .3, 0)); for (let i = 0; i < 4; i++) m.add(mesh(geoBox(2.6 - i * .6, .7, 2.6 - i * .6), lam(i % 2 ? 0x2f8f4a : 0x3aa05a), 0, 1.0 + i * .6, 0)); m.add(mesh(geoBox(.34, .34, .34), new THREE.MeshBasicMaterial({ color: 0xffe14a }), 0, 3.6, 0, false)); for (let i = 0; i < 12; i++) { const a = i * 2.4, rr = 1.1 - (i % 4) * .22; m.add(mesh(geoBox(.18, .18, .18), new THREE.MeshBasicMaterial({ color: [0xff4a4a, 0xffd24a, 0x4aaaff, 0xff8aff][i % 4] }), Math.cos(a) * rr, 1.0 + (i % 4) * .6, Math.sin(a) * rr, false)); } }
    else if (d.k === 'bed') { m.add(mesh(geoBox(1.5, .4, 2.2), lam(0x8a5a30), 0, .3, 0), mesh(geoBox(1.4, .3, 1.6), lam(d.c || 0xe85a5a), 0, .62, .25), mesh(geoBox(1.3, .22, .5), lam(0xfffaf0), 0, .72, -.8), mesh(geoBox(1.5, .9, .14), lam(0x6a4220), 0, .7, -1.1)); }
    else if (d.k === 'shelf') { m.add(mesh(geoBox(1.8, 2.0, .5), lam(0x7a4a28), 0, 1.0, 0)); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) m.add(mesh(geoBox(.3, .4, .3), lam([0xe85a5a, 0x4a8ae8, 0xe8c24a, 0x58b858][(i + j) % 4]), -.6 + j * .4, .45 + i * .62, .1, false)); }
    else if (d.k === 'rug') m.add(mesh(geoBox(d.w || 3, .04, d.h || 2), lam(d.c || 0xb84a5a), 0, .17, 0, false));
    else if (d.k === 'tableR') { m.add(mesh(new THREE.CylinderGeometry(.9, .9, .12, 14), lam(0xc89a5a), 0, .95, 0), mesh(geoBox(.2, .95, .2), lam(0x6a4220), 0, .48, 0)); for (const sx of [-1.2, 1.2]) m.add(mesh(geoBox(.5, .5, .5), lam(0x8a5a30), sx, .25, 0)); }
    else if (d.k === 'plant') m.add(mesh(geoBox(.5, .5, .5), lam(0xb85a3a), 0, .25, 0), mesh(geoBox(.7, .7, .7), lam(0x3a9a4a), 0, .85, 0));
    else if (d.k === 'stove') m.add(mesh(geoBox(1.4, 1.1, .9), lam(0x4a4a58), 0, .55, 0), mesh(geoBox(1.0, .5, .1), new THREE.MeshBasicMaterial({ color: 0xff9a3a }), 0, .6, .46, false));
    else if (d.k === 'counter') m.add(mesh(geoBox(1.0, 1.0, .9), lam(0x8a5a30), 0, .5, 0), mesh(geoBox(1.06, .12, .96), lam(0xe8d8b8), 0, 1.04, 0));
    else if (d.k === 'cake') { m.add(mesh(geoBox(.7, .3, .7), lam(0xfff4e0), 0, 1.25, 0), mesh(geoBox(.5, .25, .5), lam(0xff9ac8), 0, 1.5, 0), mesh(geoBox(.16, .16, .16), lam(0xff3040), 0, 1.72, 0)); }
    else if (d.k === 'mailboxes') { m.add(mesh(geoBox(1.3, 1.8, .4), lam(0x4a5a7a), 0, .9, 0)); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m.add(mesh(geoBox(.34, .4, .1), lam([0xe8c24a, 0xe85a5a, 0x58b8e8][(i + j) % 3]), -.4 + j * .4, .4 + i * .5, .22, false)); }
    else if (d.k === 'parcel') m.add(mesh(geoBox(.8, .6, .7), lam(0xc8a06a), 0, .3, 0), mesh(geoBox(.84, .1, .12), lam(0xe85a5a), 0, .62, 0, false));
    else if (d.k === 'oven') m.add(mesh(geoBox(1.5, 1.5, .9), lam(0x6a3a2a), 0, .75, 0), mesh(geoBox(.9, .5, .1), new THREE.MeshBasicMaterial({ color: 0xff7a1a }), 0, .8, .46, false), mesh(geoBox(.4, .7, .4), lam(0x3a2a24), .4, 1.8, 0));
    else if (d.k === 'cushion') m.add(mesh(geoBox(.8, .24, .8), lam(d.c || 0xffffff), 0, .2, 0, false));
    else if (d.k === 'tv') m.add(mesh(geoBox(1.5, .9, .2), lam(0x1a1a24), 0, 1.0, 0), mesh(geoBox(1.3, .72, .22), new THREE.MeshBasicMaterial({ color: 0x4ab8ff }), 0, 1.0, .02, false), mesh(geoBox(1.6, .5, .5), lam(0x3a3a48), 0, .25, 0));
    else if (d.k === 'sofa') m.add(mesh(geoBox(1.8, .5, .8), lam(0xb85a5a), 0, .3, 0), mesh(geoBox(1.8, .8, .22), lam(0xa84a4a), 0, .7, -.3), mesh(geoBox(.22, .6, .8), lam(0xa84a4a), -.9, .5, 0), mesh(geoBox(.22, .6, .8), lam(0xa84a4a), .9, .5, 0));
    else if (d.k === 'poster') m.add(mesh(geoBox(.9, 1.2, .08), lam(d.c || 0xff4a6a), 0, 1.6, .02, false), mesh(geoBox(.7, .9, .1), lam(0xffffff), 0, 1.6, .04, false));
    else if (d.k === 'column') m.add(mesh(new THREE.CylinderGeometry(.34, .4, 2.4, 10), lam(0xf4f0e8), 0, 1.2, 0), mesh(geoBox(1, .2, 1), lam(0xe0d8c8), 0, 2.4, 0), mesh(geoBox(.9, .2, .9), lam(0xe0d8c8), 0, .1, 0));
    else if (d.k === 'hay') m.add(mesh(geoBox(.9, .7, .9), lam(0xe8c050), 0, .35, 0), mesh(geoBox(.94, .08, .94), lam(0xc89a30), 0, .5, 0, false));
    else if (d.k === 'crate') m.add(mesh(geoBox(.8, .7, .8), lam(0xc8a06a), 0, .35, 0), mesh(geoBox(.84, .1, .84), lam(0x8a6a3a), 0, .62, 0, false));
    else if (d.k === 'fireplace') { m.add(mesh(geoBox(1.8, 1.6, .7), lam(0x8a6a60), 0, .8, 0), mesh(geoBox(.9, .8, .1), new THREE.MeshBasicMaterial({ color: 0x1a0a06 }), 0, .55, .36, false), mesh(geoBox(.5, .4, .1), new THREE.MeshBasicMaterial({ color: 0xff8a2a }), 0, .5, .38, false), mesh(geoBox(2.0, .14, .8), lam(0x5a3a2a), 0, 1.65, 0)); }
    else if (d.k === 'piano') m.add(mesh(geoBox(1.8, .9, .8), lam(0x1a1a22), 0, .55, 0), mesh(geoBox(1.7, .1, .4), lam(0xf4f4f0), 0, .98, .2, false), mesh(geoBox(1.8, .5, .12), lam(0x1a1a22), 0, 1.3, -.34));
    else if (d.k === 'desk') m.add(mesh(geoBox(1.8, .12, .8), lam(0x8a5a30), 0, .9, 0), mesh(geoBox(.16, .9, .7), lam(0x6a4220), -.8, .45, 0), mesh(geoBox(.16, .9, .7), lam(0x6a4220), .8, .45, 0), mesh(geoBox(.5, .5, .06), lam(0xe8e8f0), 0, 1.3, -.2, false));
    else if (d.k === 'aquarium') m.add(mesh(geoBox(1.7, .5, .6), lam(0x5a3a2a), 0, .25, 0), mesh(geoBox(1.5, .8, .5), new THREE.MeshLambertMaterial({ color: 0x4ac8e8, transparent: true, opacity: .75 }), 0, .9, 0, false), mesh(geoBox(.2, .3, .1), lam(0xff9a3a), .2, .9, 0, false));
    else if (d.k === 'bonebed') m.add(mesh(geoBox(.9, .22, .7), lam(0x8a5a3a), 0, .12, 0, false), mesh(geoBox(.5, .1, .1), lam(0xf4f0e8), 0, .3, 0, false));
    else if (d.k === 'window') m.add(mesh(geoBox(1.4, 1.2, .1), new THREE.MeshLambertMaterial({ color: 0xcfe8ff, emissive: 0x9ac8ff, emissiveIntensity: .8 }), 0, 1.6, .02, false));
    else if (d.k === 'mail') m.add(mesh(geoBox(.1, .7, .1), dwood, 0, .35, 0), mesh(geoBox(.4, .3, .3), lam(0x2a6ad8), 0, .8, 0));
    else if (d.k === 'tree2') { const cols = [0xff8ab0, 0xffb0c8, 0xffa0d0]; m.add(mesh(geoBox(.34, 1.3, .34), lam(0x6b4424), 0, .65, 0)); for (const [x, y, z, w] of [[0, 1.6, 0, 1.4], [-.4, 1.4, .2, 1.0], [.4, 1.5, -.2, 1.0], [0, 2.1, 0, .9]]) m.add(mesh(geoBox(w, .7, w), lam(cols[(d.x + d.y) % 3]), x, y, z)); }
    g.add(m);
  }
}

function glIndoor(g, L) {
  const wood = lam(0x6a4426), dw = lam(0x3a2410), win = new THREE.MeshLambertMaterial({ color: 0xffe9b8, emissive: 0xffc070, emissiveIntensity: .9 });
  g.add(mesh(geoBox(13, .28, .14), dw, 7.5, .5, .62, false));
  for (const x of [4.5, 10.5]) { g.add(mesh(geoBox(1.7, 1.5, .16), wood, x, 1.6, .56, false), mesh(geoBox(1.4, 1.2, .18), win, x, 1.6, .58, false), mesh(geoBox(.1, 1.2, .2), wood, x, 1.6, .6, false), mesh(geoBox(1.4, .1, .2), wood, x, 1.6, .6, false)); for (const sx of [-1, 1]) g.add(mesh(geoBox(.3, 1.6, .12), lam(0xb83a3a), x + sx * 1.0, 1.6, .6, false)); }
  g.add(mesh(geoBox(1.1, .8, .1), wood, 7.5, 1.8, .58, false), mesh(geoBox(.9, .6, .12), lam(0x6ab0d8), 7.5, 1.8, .6, false));
  for (let i = 0; i < 26; i++) g.add(mesh(geoBox(.14, .14, .14), new THREE.MeshBasicMaterial({ color: [0xff5a5a, 0xffd24a, 0x5acaff, 0x7aff8a][i % 4] }), 1.6 + i * .5, 2.45 - Math.abs(Math.sin(i * .6)) * .18, .62, false));
  for (const sx of [1.5, 13.5]) for (const sz of [1.5, 8.5]) if (sz === 8.5 && false) continue;
  const tree = new THREE.Group(); tree.position.set(12.4, 0, 7.0); tree.scale.setScalar(.55); tree.add(mesh(geoBox(.5, .6, .5), lam(0x6b4424), 0, .3, 0)); for (let i = 0; i < 4; i++) tree.add(mesh(geoBox(2.6 - i * .6, .7, 2.6 - i * .6), lam(i % 2 ? 0x2f8f4a : 0x3aa05a), 0, 1.0 + i * .6, 0)); tree.add(mesh(geoBox(.34, .34, .34), new THREE.MeshBasicMaterial({ color: 0xffe14a }), 0, 3.6, 0, false)); for (let i = 0; i < 10; i++) { const a = i * 2.4, rr = 1.0 - (i % 4) * .22; tree.add(mesh(geoBox(.2, .2, .2), new THREE.MeshBasicMaterial({ color: [0xff4a4a, 0xffd24a, 0x4aaaff, 0xff8aff][i % 4] }), Math.cos(a) * rr, 1.0 + (i % 4) * .6, Math.sin(a) * rr, false)); } g.add(tree);
}
