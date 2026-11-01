/* 10 · CINEMÁTICAS EN 3D (versión de prueba): escenas con personajes 3D, cámara en movimiento, música, y voces por personaje.
   Usa los mismos guiones que el juego (CINE en 08-cine.js) y el mismo motor 3D (Three.js + modelos de 05b/05c/05e). */
'use strict';
/* ------------------------------------------------------------------ utilidades 3D */
const C3 = { ok: false, T: 0, t: 0, i: 0, shots: null, key: null, txt: '', chars: 0, talkT: -9, scenes: {}, cur: null, curKey: '', flash: 0, camPos: new THREE.Vector3(), camLook: new THREE.Vector3(), speaker: '' };
const T3 = (geo, color, p, s, r, o) => pt(geo, color, p, s, r, o);
const E3 = (geo, color, p, s, r) => pt(geo, color, p, s, r, { e: true });
const dark = g => { g.traverse(o => { if (o.isMesh){ o.material = new THREE.MeshBasicMaterial({ color: 0x0c0e26 }); } if (o.isSprite) o.visible = false; }); return g; };
const matBasic = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: op !== undefined, opacity: op === undefined ? 1 : op, depthWrite: op === undefined });
function lerpAng(a, b, k){ return a + (b - a) * k; }

/* figura de ardilla de cuerpo entero, mirando a +z. mood: happy | worry | angry | sad | surprise */
function buildFigure(sk){
  const FUR = hexN(sk.fur), FURD = hexN(sk.furD), BELLY = hexN(sk.belly), CLOTH = hexN(sk.cloth), HAT = hexN(sk.hat), SC = hexN(sk.scarf), old = !!sk.old, acc = sk.acc;
  const g = new THREE.Group(), U = { sk, old };
  g.add(build([T3(GEO.sph(), CLOTH, [0, 1.05, 0], [1.55, 1.75, 1.3]), T3(GEO.sph(), BELLY, [0, 1.0, 0.42], [0.95, 1.25, 0.55]), T3(GEO.sph(), FURD, [-0.42, 0.14, 0.38], [0.58, 0.3, 0.85]), T3(GEO.sph(), FURD, [0.42, 0.14, 0.38], [0.58, 0.3, 0.85]),
    T3(GEO.tor(), SC, [0, 1.95, 0.05], [1.35, 1.35, 1.35], [Math.PI / 2, 0, 0])], { center: false, outline: 1.04 }));
  if (!old) g.add(build([T3(GEO.box(), SC, [0.5, 1.7, 0.7], [0.3, 0.1, 1.0], [0.5, 0.3, 0.4])], { center: false, outline: 1.1 }));
  const arm = sg => { const a = new THREE.Group(); a.add(build([T3(GEO.cyl(), CLOTH, [0, -0.45, 0], [0.34, 0.95, 0.34]), T3(GEO.sph(), FUR, [0, -0.98, 0.05], [0.44, 0.44, 0.44])], { center: false, outline: 1.08 })); a.position.set(sg * 0.85, 1.75, 0.1); a.rotation.z = sg * 0.18; return a; };
  U.armL = arm(-1); U.armR = arm(1); g.add(U.armL, U.armR);
  // cabeza
  const head = new THREE.Group(); head.position.set(0, 2.78, 0.1);
  head.add(build([T3(GEO.sph(), FUR, [0, 0, 0], [2.0, 1.85, 1.85]), T3(GEO.sph(), BELLY, [0, -0.38, 0.62], [1.15, 0.85, 0.75]), T3(GEO.sph(), 0x3b2312, [0, -0.17, 0.98], [0.2, 0.15, 0.14]), T3(GEO.sph(), 0xff9a9a, [-0.72, -0.35, 0.6], [0.3, 0.2, 0.15]), T3(GEO.sph(), 0xff9a9a, [0.72, -0.35, 0.6], [0.3, 0.2, 0.15]),
    T3(GEO.cone(), FUR, [-0.8, 1.05, 0], [0.6, 0.95, 0.45], [0, 0, 0.3]), T3(GEO.cone(), FUR, [0.8, 1.05, 0], [0.6, 0.95, 0.45], [0, 0, -0.3]), T3(GEO.cone(), 0xf2b98a, [-0.8, 1.0, 0.1], [0.3, 0.6, 0.2], [0, 0, 0.3]), T3(GEO.cone(), 0xf2b98a, [0.8, 1.0, 0.1], [0.3, 0.6, 0.2], [0, 0, -0.3])], { center: false, outline: 1.04 }));
  const eyeMk = sx => { const e = new THREE.Group(); e.add(build([T3(GEO.sph(), 0xffffff, [0, 0, 0], [0.5, 0.58, 0.3]), T3(GEO.sph(), 0x2a1a10, [0, -0.02, 0.1], [0.28, 0.32, 0.2]), E3(GEO.sph(), 0xffffff, [-0.07, 0.08, 0.22], [0.1, 0.1, 0.08])], { center: false, outline: 0 })); e.position.set(sx * 0.46, 0.12, 0.88); return e; };
  U.eyeL = eyeMk(-1); U.eyeR = eyeMk(1); head.add(U.eyeL, U.eyeR);
  const brow = sx => { const b = new THREE.Mesh(GEO.box(), matBasic(old ? 0xffffff : FURD === 0 ? 0 : 0x4a2c14)); b.scale.set(old ? 0.7 : 0.55, 0.12, 0.1); b.position.set(sx * 0.46, 0.58, 0.92); return b; };
  U.browL = brow(-1); U.browR = brow(1); head.add(U.browL, U.browR);
  const mouth = new THREE.Mesh(GEO.sph(), matBasic(0x7a2a1a)); mouth.scale.set(0.42, 0.06, 0.1); mouth.position.set(0, -0.58, 0.95); head.add(mouth); U.mouth = mouth;
  // accesorios
  const acp = [];
  if (acc === 'goggles' || acc === 'welder' || acc === 'captain'){
    acp.push(T3(GEO.sph(), HAT, [0, 0.42, -0.02], [2.08, acc === 'captain' ? 1.25 : 1.1, 1.95]));
    if (acc === 'captain'){ acp.push(T3(GEO.cyl(), 0x10183e, [0, 0.12, 0.7], [2.1, 0.12, 1.2]), T3(GEO.box(), 0xffd23f, [0, 0.25, 0.05], [2.06, 0.18, 1.98]), E3(GEO.sph(), 0xffd23f, [0, 0.62, 0.95], [0.34, 0.34, 0.14])); }
    else acp.push(T3(GEO.cyl(), acc === 'welder' ? 0xff9a3a : 0x2b2b3a, [0, 0.2, 0], [2.02, 0.2, 1.92]));
    if (acc === 'goggles') acp.push(T3(GEO.sph(), 0x9fe7ff, [-0.45, 0.78, 0.7], [0.62, 0.62, 0.4]), T3(GEO.sph(), 0x9fe7ff, [0.45, 0.78, 0.7], [0.62, 0.62, 0.4]), T3(GEO.tor(), 0x2b2b3a, [-0.45, 0.78, 0.84], [0.66, 0.66, 0.66]), T3(GEO.tor(), 0x2b2b3a, [0.45, 0.78, 0.84], [0.66, 0.66, 0.66]));
    if (acc === 'welder') acp.push(T3(GEO.tor(), 0xc9c6d4, [-0.4, 1.05, 0.5], [0.7, 0.7, 0.7], [0.5, 0, 0]), T3(GEO.tor(), 0xc9c6d4, [0.4, 1.05, 0.5], [0.7, 0.7, 0.7], [0.5, 0, 0]), T3(GEO.sph(), 0x2a3a4a, [-0.4, 1.05, 0.55], [0.46, 0.46, 0.14]), T3(GEO.sph(), 0x2a3a4a, [0.4, 1.05, 0.55], [0.46, 0.46, 0.14]));
  } else if (acc === 'bow'){
    acp.push(T3(GEO.cone(), HAT, [0.95, 1.18, 0.1], [0.7, 0.9, 0.3], [0, 0, -1.2]), T3(GEO.cone(), HAT, [0.35, 1.25, 0.1], [0.7, 0.9, 0.3], [0, 0, 1.2]), T3(GEO.sph(), HAT, [0.65, 1.2, 0.1], [0.4, 0.4, 0.35]),
      T3(GEO.sph(), 0x9fe7ff, [-0.35, 0.85, 0.7], [0.5, 0.5, 0.36]), T3(GEO.sph(), 0x9fe7ff, [0.0, 0.88, 0.72], [0.5, 0.5, 0.36]));
  } else {   // glasses (abuelo)
    acp.push(T3(GEO.sph(), HAT, [0, 0.62, -0.02], [2.15, 0.85, 2.0]), T3(GEO.tor(), 0x6b6b78, [-0.46, 0.12, 0.98], [0.78, 0.78, 0.78]), T3(GEO.tor(), 0x6b6b78, [0.46, 0.12, 0.98], [0.78, 0.78, 0.78]), T3(GEO.box(), 0x6b6b78, [0, 0.12, 1.0], [0.3, 0.07, 0.07]),
      T3(GEO.sph(), 0xffffff, [-0.28, -0.52, 0.92], [0.55, 0.24, 0.3], [0, 0, 0.2]), T3(GEO.sph(), 0xffffff, [0.28, -0.52, 0.92], [0.55, 0.24, 0.3], [0, 0, -0.2]));
  }
  head.add(build(acp, { center: false, outline: 1.05 })); U.head = head; g.add(head);
  // cola
  const tail = new THREE.Group(); tail.add(build([T3(GEO.sph(), FURD, [0, 1.0, -0.7], [1.2, 1.5, 1.0]), T3(GEO.sph(), FUR, [0.15, 2.0, -1.15], [1.3, 1.7, 1.15]), T3(GEO.sph(), FURD, [0.4, 3.0, -1.05], [1.15, 1.45, 1.0]), T3(GEO.sph(), BELLY, [0.55, 3.8, -0.9], [0.9, 0.9, 0.8])], { center: false, outline: 1.04 }));
  U.tail = tail; g.add(tail);
  g.userData = U; return g;
}
function animFigure(g, t, speak, mood, look){
  const U = g.userData, blink = ((t + (U.old ? 1.1 : 0)) % 3.5) < 0.12, mv = speak;
  U.head.position.y = 2.78 + Math.sin(t * 2 + (U.old ? 1 : 0)) * 0.05 + (speak > 0.3 ? Math.sin(t * 22) * 0.025 : 0); U.head.rotation.y = lerpAng(U.head.rotation.y, look || 0, 0.06); U.head.rotation.z = mood === 'worry' ? 0.12 : mood === 'sad' ? -0.1 : Math.sin(t * 1.3) * 0.03;
  for (const e of [U.eyeL, U.eyeR]) e.scale.y = blink || mood === 'happy2' ? 0.12 : mood === 'surprise' ? 1.25 : 1;
  const bz = { happy: 0.12, worry: -0.35, angry: 0.5, sad: -0.45, surprise: 0.05 }[mood || 'happy'] || 0.1; U.browL.rotation.z = -bz; U.browR.rotation.z = bz; U.browL.position.y = U.browR.position.y = 0.58 + (mood === 'surprise' ? 0.12 : 0);
  U.mouth.scale.y = mood === 'surprise' ? 0.2 : 0.06 + mv * 0.2 * Math.abs(Math.sin(t * 26)); U.mouth.scale.x = mood === 'happy' ? 0.55 : 0.42;
  U.tail.rotation.z = Math.sin(t * 1.8) * 0.08; U.tail.rotation.x = Math.sin(t * 1.3) * 0.03;
  const wave = mood === 'happy' && speak > 0.2 ? 1 : 0; U.armR.rotation.z = lerpAng(U.armR.rotation.z, wave ? 2.5 + Math.sin(t * 10) * 0.3 : 0.18, 0.12); U.armL.rotation.z = lerpAng(U.armL.rotation.z, mood === 'worry' ? -0.9 : -0.18, 0.1);
  g.position.y = 0; g.rotation.y = lerpAng(g.rotation.y, (U.baseRot || 0) + (speak > 0.2 ? 0.05 * Math.sin(t * 3) : 0), 0.08);
}

/* ------------------------------------------------------------------ cielo y luz por hora del día (TOD de 08-cine.js) */
function setTod(name, flash){
  const k = TOD[name] || TOD.dawn, rgb3 = (c, f) => [c[0] / 255 * (f || 1), c[1] / 255 * (f || 1), c[2] / 255 * (f || 1)];
  const fl = clamp(flash || 0, 0, 1), top = mix(k.top, [235, 240, 255], fl * 0.7), bot = mix(k.bot, [235, 240, 255], fl * 0.7);
  SK.mat.uniforms.uTop.value.setRGB(...rgb3(top)); SK.mat.uniforms.uBot.value.setRGB(...rgb3(bot));
  const sunDir = new THREE.Vector3(0.5, name === 'dusk' ? 0.12 : 0.42, -0.8).normalize(); SK.mat.uniforms.uSunDir.value.copy(sunDir);
  SK.mat.uniforms.uSunAmt.value = k.sun ? 1 : 0; SK.mat.uniforms.uSunCol.value.setRGB(...rgb3(k.sun || [255, 255, 255])); SK.mat.uniforms.uStars.value = k.stars || 0; SK.mat.uniforms.uTime.value = C3.T;
  S3.fog.color.setRGB(...rgb3(bot)); S3.fog.near = 40; S3.fog.far = 330;
  const night = name === 'night', storm = name === 'storm';
  LT.hemi.color.setRGB(...rgb3(mix(top, [255, 255, 255], night ? 0.15 : 0.5))); LT.hemi.groundColor.setRGB(...rgb3(mix(bot, [60, 70, 90], 0.4), 0.7)); LT.hemi.intensity = night ? 0.34 : storm ? 0.4 : 0.52;
  LT.sun.color.setRGB(...rgb3(night ? [150, 170, 255] : name === 'dusk' ? [255, 190, 130] : [255, 245, 225])); LT.sun.intensity = night ? 0.34 : storm ? 0.3 : 0.55; LT.sun.position.set(-20 + sunDir.x * 20, 40, 30); LT.sun.target.position.set(0, 0, 0);
  C3.moon.visible = !!k.moon; C3.moonGlow.visible = !!k.moon;
}

/* ------------------------------------------------------------------ escenas */
function addIsland(parent, o){
  o = o || {}; const g = new THREE.Group(), U = { acorns: [], wins: [] };
  const rock = [T3(GEO.cone(), 0x8d7a9d, [0, -6.5, 0], [17, 13, 17], [Math.PI, 0, 0], { f: true }), T3(GEO.cone(), 0x6e5d80, [-4.5, -9.5, 2], [6, 8, 6], [Math.PI, 0, 0.15], { f: true }), T3(GEO.cone(), 0x7a688c, [4.2, -8.4, -2.5], [5, 7, 5], [Math.PI, 0, -0.2], { f: true }), T3(GEO.cone(), 0x5e4e70, [0.5, -12, 0], [3.5, 5, 3.5], [Math.PI, 0, 0], { f: true }),
    T3(GEO.cyl(), 0x6aa04e, [0, 0.05, 0], [17.6, 0.7, 17.6]), T3(GEO.cyl(), 0x78d86b, [0, 0.6, 0], [17, 0.9, 17]), T3(GEO.cyl(), 0x8ae07a, [0, 1.0, 0], [14.5, 0.4, 14.5])];
  g.add(build(rock, { center: false, outline: 1.02 }));
  // casas con ventanas que se encienden
  [[-5.4, 1.2, 3.2, 0xf4dcae, 0xe0583f, 0.3], [-1.8, 1.2, 5.2, 0xf6e6c4, 0x4a79c9, -0.2], [2.8, 1.2, 4.3, 0xf2d1b0, 0xd9a43f, 0.15], [-6.2, 1.2, -1.8, 0xf6e6c4, 0x8a5ad6, 0.6]].forEach(h => {
    const hh = build([T3(GEO.box(), h[3], [0, 1.1, 0], [3.4, 2.2, 3.0]), T3(GEO.cone4(), h[4], [0, 3.0, 0], [4.9, 1.9, 4.5], [0, Math.PI / 4, 0], { f: true }), T3(GEO.box(), 0x7a5235, [1.0, 3.3, -0.4], [0.5, 1.0, 0.5]), T3(GEO.box(), 0x6a4020, [0.6, 0.8, 1.52], [0.8, 1.5, 0.08])], { center: false, outline: 1.04 });
    const w = new THREE.Mesh(GEO.box(), new THREE.MeshBasicMaterial({ color: 0xffd86b })); w.scale.set(0.9, 0.9, 0.08); w.position.set(-0.9, 1.3, 1.53); hh.add(w); U.wins.push(w);
    hh.position.set(h[1] * 0 + h[0], h[1] + 0.9, h[2]); hh.rotation.y = h[5]; hh.scale.setScalar(0.95); g.add(hh); });
  // gran árbol con las tres bellotas doradas
  const tree = build([T3(GEO.cyl(), 0x7a5235, [0, 2.6, 0], [1.3, 5.2, 1.3]), T3(GEO.ico(), 0x3f9d5a, [0, 6.0, 0], [8.4, 6.8, 8.4], [0, 0.3, 0], { f: true }), T3(GEO.ico(), 0x4fb36a, [-0.6, 8.4, 0.2], [6.2, 5.2, 6.2], [0, 0.9, 0], { f: true }), T3(GEO.ico(), 0x68c97c, [0.4, 10.3, 0], [4.0, 3.4, 4.0], [0, 0.5, 0], { f: true })], { center: false, outline: 1.025 });
  tree.position.set(5.5, 1.2, -1.5); g.add(tree);
  [[3.0, 4.6, 3.6], [7.4, 6.2, 3.2], [5.2, 9.0, 3.0]].forEach((a, i) => { const ac = MK.gold.make(); ac.scale.setScalar(1.7); ac.position.set(a[0], a[1], a[2] - 1.5 + 1.5); g.add(ac); U.acorns.push(ac); });
  // cascadas
  const wf = new THREE.Mesh(new THREE.BoxGeometry(1.3, 9, 0.5), new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.55 })); wf.position.set(-8.2, -3.2, 3.5); wf.rotation.z = 0.12; g.add(wf);
  const wf2 = wf.clone(); wf2.position.set(7.5, -2.5, 4.2); wf2.scale.y = 0.7; g.add(wf2);
  U.setGlow = (k) => { U.acorns.forEach((a, i) => { a.visible = k > 0.05; a.children.forEach(c => { if (c.isSprite) c.material.opacity = 0.6 * k + 0.08 * Math.sin(C3.T * 4 + i); }); }); U.wins.forEach(w => w.material.color.setRGB(1 * (0.2 + 0.8 * k), 0.84 * (0.2 + 0.8 * k), 0.42 * (0.2 + 0.8 * k))); if (U.light) U.light.intensity = 0.9 * k; };
  U.light = new THREE.PointLight(0xffd070, 0.9, 40, 1.6); U.light.position.set(5.5, 6, 4); g.add(U.light);
  parent.add(g); g.userData = U; return g;
}
function addClouds(parent, n, spread, y0, big){
  const arr = []; for (let i = 0; i < n; i++){ const c = MK.puff.make(); c.position.set((hash2(i, 3) - 0.5) * spread, y0 + (hash2(i, 5) - 0.5) * 18, (hash2(i, 7) - 0.5) * spread * 0.8 - 20); c.scale.setScalar((big ? 3 : 1.6) * (0.7 + hash2(i, 9))); parent.add(c); arr.push(c); } return arr;
}
function makeRain(parent){ const n = 260, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 6), 3)); const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.5 })); m.frustumCulled = false; parent.add(m);
  const seeds = Array.from({ length: n }, (_, i) => [hash2(i, 1), hash2(i, 2), hash2(i, 3)]);
  return { m, update(t){ const p = geo.attributes.position; for (let i = 0; i < n; i++){ const s = seeds[i], x = (s[0] - 0.5) * 70, z = (s[1] - 0.5) * 50 + 4, y = 22 - (((t * (26 + s[2] * 14) + s[2] * 60) % 36)); p.setXYZ(i * 2, x, y, z); p.setXYZ(i * 2 + 1, x - 0.4, y + 1.6, z); } p.needsUpdate = true; } }; }
function makeLeaves(parent){ const n = 70, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const m = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe8a33d, size: 0.42, sizeAttenuation: true })); m.frustumCulled = false; parent.add(m);
  return { m, update(t){ const p = geo.attributes.position; for (let i = 0; i < n; i++){ const s = hash2(i, 4), x = (hash2(i, 1) - 0.5) * 46 + Math.sin(t * 0.8 + i) * 1.6, y = 16 - ((t * (1.4 + s * 1.6) + s * 30) % 22), z = (hash2(i, 2) - 0.5) * 30 + 4; p.setXYZ(i, x, y, z); } p.needsUpdate = true; } }; }
function makeFireworks(parent){ const bursts = 6, per = 46, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bursts * per * 3), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(bursts * per * 3), 3));
  const m = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.4, map: LT.glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.frustumCulled = false; parent.add(m);
  return { m, update(t){ const p = geo.attributes.position, c = geo.attributes.color; for (let b = 0; b < bursts; b++){ const ph = (t * 0.55 + b * 0.37) % 1.9, id = Math.floor(t * 0.55 + b * 0.37 / 1.9 * 0), cx = (hash2(b, Math.floor((t * 0.55 + b * 0.37) / 1.9)) - 0.5) * 60, cy = 8 + hash2(b + 9, Math.floor((t * 0.55 + b * 0.37) / 1.9)) * 14, cz = -22 + b * 2;
    const hue = hash2(b + 3, Math.floor((t * 0.55 + b * 0.37) / 1.9)); const col = new THREE.Color().setHSL(hue, 1, 0.65);
    for (let i = 0; i < per; i++){ const a = i / per * Math.PI * 2, el = (hash2(i, b + 40) - 0.5) * 2.2, r = ph < 1.5 ? ph * 7.5 * (0.6 + hash2(i, b) * 0.5) : 0, k = ph < 1.5 ? 1 - ph / 1.5 : 0; p.setXYZ(b * per + i, cx + Math.cos(a) * Math.cos(el) * r, cy + Math.sin(el) * r + ph * ph * -1.4, cz + Math.sin(a) * Math.cos(el) * r * 0.4); c.setXYZ(b * per + i, col.r * k, col.g * k, col.b * k); } } p.needsUpdate = true; c.needsUpdate = true; } }; }

/* cada escena: build() crea sus objetos una vez; show(shot) la prepara; update(t, shot, dt) la anima y mueve la cámara */
const SCENES = {
  island: { build(root){ const o = { isl: addIsland(root), clouds: addClouds(root, 12, 150, -6, true) }; return o; },
    show(o, s){ o.isl.userData.setGlow(s.glow === undefined ? 1 : s.glow); },
    update(o, s, t){ const gl = s.glow === undefined ? 1 : s.glow; o.isl.userData.setGlow(gl); const sink = s.sink ? Math.min(1, t / 9) : 0; o.isl.position.y = Math.sin(C3.T * 0.7) * 0.4 - sink * 4; o.isl.rotation.z = -sink * 0.06; o.isl.rotation.y = 0.35 + Math.sin(C3.T * 0.2) * 0.04;
      const k = smooth(Math.min(1, t / 10)); camTo(lerp(-8, 5, k), lerp(5, 9, k), lerp(40, 31, k), 0, lerp(-5, -3, k) - sink * 2, 0); } },
  thieves: { build(root){ const o = { isl: addIsland(root), clouds: addClouds(root, 8, 120, -10, true), thieves: [] };
      ['crow', 'storm', 'owl'].forEach((t, i) => { const m = dark(BM[t]()); m.scale.setScalar(0.45); const a = MK.gold.make(); a.scale.setScalar(2.2); const grp = new THREE.Group(); grp.add(m); a.position.set(0, -3.6, 0.5); grp.add(a); root.add(grp); o.thieves.push({ grp, a }); }); return o; },
    show(o, s){ },
    update(o, s, t){ o.isl.userData.setGlow(Math.max(0, 1 - t / 3)); o.isl.position.set(-14, Math.sin(C3.T * 0.7) * 0.4 - Math.min(1, t / 6) * 1.8, 0); o.isl.rotation.y = 0.5; o.isl.rotation.z = -0.05 * Math.min(1, t / 3);
      o.thieves.forEach((th, i) => { const k = t * 0.9; th.grp.position.set(2 + i * 6 + k * 2.2, 5 + i * 2.2 + k * 0.5 + Math.sin(C3.T * 2 + i) * 0.4, 6 - i * 3 - k * 0.8); th.grp.rotation.y = 0.35; const f = Math.sin(C3.T * 8 + i) * 0.5; const m = th.grp.children[0]; if (m.userData.wl){ m.userData.wl.rotation.z = 0.35 + f; m.userData.wr.rotation.z = -0.35 - f; } });
      camTo(-2 + t * 0.4, 8, 34, 4 + t * 0.8, 6, 0); } },
  hangar: { build(root, ctx){ const o = {}; const h = new THREE.Group(); root.add(h); o.h = h;
      h.add(build([T3(GEO.box(), 0x5a3d28, [0, -0.5, 0], [60, 1, 40]), ...Array.from({ length: 12 }, (_, i) => T3(GEO.box(), i % 2 ? 0x4e3322 : 0x63452d, [-27.5 + i * 5, 0.02, 0], [4.9, 0.1, 40])), T3(GEO.box(), 0x6b4a33, [0, 14, -14], [60, 30, 1]), T3(GEO.box(), 0x6b4a33, [-26, 14, 0], [1, 30, 40]), T3(GEO.box(), 0x6b4a33, [26, 14, 0], [1, 30, 40]), T3(GEO.box(), 0x4a3220, [0, 29, 0], [60, 1, 40]),
        ...[-18, -6, 6, 18].map(x => T3(GEO.box(), 0x3d2918, [x, 22, 0], [1.2, 1.2, 40])), ...[-20, 20].map(x => T3(GEO.box(), 0x3d2918, [x, 14, -13], [1.5, 30, 1.5]))], { center: false, outline: 0 }));
      // ventanal con vista al cielo
      const frame = build([T3(GEO.box(), 0x2a1b12, [0, 16.8, -12.7], [23, 0.9, 0.6]), T3(GEO.box(), 0x2a1b12, [0, 5.2, -12.7], [23, 0.9, 0.6]), T3(GEO.box(), 0x2a1b12, [-11.1, 11, -12.7], [0.9, 12, 0.6]), T3(GEO.box(), 0x2a1b12, [11.1, 11, -12.7], [0.9, 12, 0.6]), T3(GEO.box(), 0x2a1b12, [0, 11, -12.7], [0.6, 12, 0.5]), T3(GEO.box(), 0x2a1b12, [0, 11, -12.7], [23, 0.6, 0.5])], { center: false, outline: 0 }); h.add(frame);
      const skyTex = canvasTex(256, 128, (c, w, hh) => { const g = c.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#6a9be0'); g.addColorStop(1, '#ffd6a8'); c.fillStyle = g; c.fillRect(0, 0, w, hh); c.fillStyle = 'rgba(255,255,255,.9)'; [[40, 40, 22], [120, 70, 28], [200, 36, 20], [170, 90, 18]].forEach(q => { c.beginPath(); c.arc(q[0], q[1], q[2], 0, 7); c.arc(q[0] + q[2] * 0.8, q[1] + 4, q[2] * 0.8, 0, 7); c.arc(q[0] - q[2] * 0.8, q[1] + 5, q[2] * 0.7, 0, 7); c.fill(); }); });
      skyTex.wrapS = THREE.RepeatWrapping; const win = new THREE.Mesh(new THREE.PlaneGeometry(21, 11), new THREE.MeshBasicMaterial({ map: skyTex })); win.position.set(0, 11, -13.0); h.add(win); o.skyTex = skyTex;
      // lámparas, estante y herramientas
      [-12, 12].forEach(x => { const l = glowSprite(0xffd070, 10, 0.55); l.position.set(x, 17, -2); h.add(l); const pl = new THREE.PointLight(0xffc880, 0.55, 40, 1.6); pl.position.set(x, 16, 2); h.add(pl); h.add(build([T3(GEO.cyl(), 0x2a2a3a, [x, 21, -2], [0.12, 8, 0.12]), T3(GEO.cone(), 0xc9a24a, [x, 17.2, -2], [2.0, 1.6, 2.0], [Math.PI, 0, 0])], { center: false, outline: 1.05 })); });
      h.add(build([T3(GEO.box(), 0x4a3220, [-20, 5, -11], [8, 0.4, 3]), T3(GEO.box(), 0x4a3220, [-20, 9, -11], [8, 0.4, 3]), T3(GEO.box(), 0xc9483a, [-22, 6.2, -11], [2, 2, 2]), T3(GEO.cyl(), 0x7d89d4, [-19, 6.1, -11], [1.2, 1.8, 1.2]), T3(GEO.box(), 0xffd23f, [-21, 10.2, -11], [2.4, 1.8, 2]), T3(GEO.box(), 0x3f9bff, [-17.8, 10.2, -11], [1.6, 1.6, 1.6]),
        T3(GEO.cyl(), 0x8a5a2a, [18, 1.2, -9], [3, 2.4, 3]), T3(GEO.cyl(), 0x8a5a2a, [21.5, 1.2, -8], [2.6, 2.4, 2.6]), T3(GEO.box(), 0xd9a43f, [16, 1.5, -6], [3, 3, 3])], { center: false, outline: 1.04 }));
      // el avioncito del hangar
      o.plane = buildPlaneModel(curSkin(), false); o.plane.scale.setScalar(2.1); o.plane.position.set(0, 3.2, -3); o.plane.rotation.y = 0; h.add(o.plane); o.shadow = new THREE.Mesh(new THREE.CircleGeometry(6, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); o.shadow.position.set(0, 0.06, -3); h.add(o.shadow);
      o.nuki = buildFigure(curSkin()); o.nuki.scale.setScalar(2.4); o.nuki.position.set(-8.5, 0, 4); o.nuki.userData.baseRot = 0.45; h.add(o.nuki);
      o.abu = buildFigure(SKIN_BY.abuelo); o.abu.scale.setScalar(2.35); o.abu.position.set(8.5, 0, 4); o.abu.userData.baseRot = -0.45; h.add(o.abu); return o; },
    show(o, s){ o.nuki.parent.remove(o.nuki); o.nuki = buildFigure(curSkin()); o.nuki.scale.setScalar(2.4); o.nuki.position.set(-8.5, 0, 4); o.nuki.userData.baseRot = 0.45; o.h.add(o.nuki); o.plane.parent.remove(o.plane); o.plane = buildPlaneModel(curSkin(), false); o.plane.scale.setScalar(2.1); o.plane.position.set(0, 3.2, -3); o.h.add(o.plane); },
    update(o, s, t, dt, speak){ const sp = s.who === 'Nuki' ? 'n' : s.who === 'Abuelo' ? 'a' : ''; animFigure(o.nuki, C3.T, sp === 'n' ? speak : 0, sp === 'n' ? s.mood : 'happy', 0.5); animFigure(o.abu, C3.T + 1, sp === 'a' ? speak : 0, sp === 'a' ? s.mood : 'happy', -0.5);
      o.plane.userData.prop.rotation.z = C3.T * 6; o.plane.userData.scarf.rotation.y = Math.sin(C3.T * 3) * 0.3; o.plane.position.y = 3.2 + Math.sin(C3.T * 1.1) * 0.12; o.skyTex.offset.x = (C3.T * 0.01) % 1;
      const fx = sp === 'n' ? -3.2 : sp === 'a' ? 3.2 : 0, k = smooth(Math.min(1, t / 8)); camTo(fx * 0.8 + Math.sin(C3.T * 0.3) * 0.8, lerp(9, 7.5, k), lerp(30, 24.5, k), fx * 0.5, 5.6, 0); } },
  takeoff: { build(root){ const o = { isl: addIsland(root), clouds: addClouds(root, 14, 200, -10, true), plane: buildPlaneModel(curSkin(), false), streaks: [] }; o.plane.scale.setScalar(1.6); root.add(o.plane);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(120 * 6), 3)); o.sl = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })); o.sl.frustumCulled = false; root.add(o.sl); return o; },
    show(o){ o.plane.parent.remove(o.plane); o.plane = buildPlaneModel(curSkin(), false); o.plane.scale.setScalar(1.6); o.sl.parent.add(o.plane); },
    update(o, s, t){ const k = smooth(Math.min(1, t / 4.5)); o.isl.userData.setGlow(0.3); o.isl.position.set(-3 - k * 10, 10 - k * 4 + Math.sin(C3.T * 0.7) * 0.3, -22 - k * 40); o.isl.rotation.y = 0.6;
      o.plane.position.set(Math.sin(C3.T * 1.3) * 0.8, 6 - k * 5 - 2, 6 - k * 20); o.plane.rotation.x = -0.15 - k * 0.45; o.plane.rotation.z = Math.sin(C3.T * 1.3) * 0.15; o.plane.userData.prop.rotation.z = C3.T * 40;
      const p = o.sl.geometry.attributes.position; for (let i = 0; i < 120; i++){ const x = (hash2(i, 1) - 0.5) * 60, y = (hash2(i, 2) - 0.5) * 30 + 6, z = -10 - ((hash2(i, 3) * 80 + C3.T * 90 * (0.4 + k)) % 80); p.setXYZ(i * 2, x, y, z); p.setXYZ(i * 2 + 1, x, y, z - 3 - 4 * k); } p.needsUpdate = true;
      camTo(o.plane.position.x * 0.5, o.plane.position.y + 2.4, o.plane.position.z + 11, o.plane.position.x * 0.5, o.plane.position.y - 0.2, o.plane.position.z - 14); } },
  stormIntro: { build(root){ const o = { clouds: addClouds(root, 16, 150, -4, true), plane: buildPlaneModel(curSkin(), false), king: BM.storm(), rain: makeRain(root) }; o.king.scale.setScalar(1.7); o.king.position.set(0, 12, -34); root.add(o.king); o.plane.scale.setScalar(1.4); root.add(o.plane); return o; },
    show(o){ o.plane.parent.remove(o.plane); o.plane = buildPlaneModel(curSkin(), false); o.plane.scale.setScalar(1.4); o.king.parent.add(o.plane); },
    update(o, s, t){ o.rain.update(C3.T); const sil = t < 1.2; o.king.visible = true; o.king.position.y = 12 + Math.sin(C3.T * 1.2) * 0.8; o.king.position.z = -42 + smooth(Math.min(1, t / 6)) * 14; o.king.userData.bolts.forEach((b, i) => b.visible = Math.sin(C3.T * 9 + i * 2) > -0.2);
      o.plane.position.set(Math.sin(C3.T * 1.1) * 1.2, 3.1 + Math.sin(C3.T * 1.7) * 0.3, 4); o.plane.rotation.z = Math.sin(C3.T * 1.1) * 0.2; o.plane.userData.prop.rotation.z = C3.T * 40;
      if (Math.sin(C3.T * 1.3) > 0.97 || (t % 4.3) < 0.12) C3.flash = 0.8; camTo(Math.sin(C3.T * 0.4) * 2, 5.5, 15, 0, 5, -20); } },
  forestIntro: { build(root){ const o = { leaves: makeLeaves(root), plane: buildPlaneModel(curSkin(), false), trees: [] };
      for (let i = 0; i < 70; i++){ const t = MK.stree.make(); const x = (i % 2 ? 1 : -1) * (12 + hash2(i, 1) * 50), z = -hash2(i, 2) * 120 - 6; t.position.set(x, 0, z); t.scale.setScalar(2.2 + hash2(i, 3) * 2.2); root.add(t); o.trees.push(t); t.traverse(c => { if (c.isMesh){ c.material = c.material === MAT.outl ? c.material : new THREE.MeshBasicMaterial({ color: 0x3a2347 }); } }); }
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4a2b4c })); ground.position.y = -0.1; root.add(ground);
      o.eyes = [-1, 1].map(sg => { const e = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0xffd23f })); e.scale.set(1.1, 1.5, 0.5); e.position.set(sg * 2.3 + 12, 11, -30); root.add(e); return e; });
      o.plane.scale.setScalar(0.9); root.add(o.plane); return o; },
    show(o){ o.plane.parent.remove(o.plane); o.plane = buildPlaneModel(curSkin(), false); o.plane.scale.setScalar(0.9); o.eyes[0].parent.add(o.plane); },
    update(o, s, t){ o.leaves.update(C3.T); const bl = (C3.T % 4) < 0.15 ? 0.1 : 1, a = Math.min(1, t / 2); o.eyes.forEach(e => { e.scale.y = 1.5 * bl; e.material.opacity = a; e.visible = a > 0.05; });
      o.plane.position.set(-2 + Math.sin(C3.T * 1.1) * 0.8, 5.0 + Math.sin(C3.T * 1.6) * 0.3, 2); o.plane.rotation.z = Math.sin(C3.T * 1.1) * 0.18; o.plane.rotation.y = -0.3; o.plane.userData.prop.rotation.z = C3.T * 40;
      camTo(Math.sin(C3.T * 0.3) * 2, 5.5, 16, 3, 6, -20); } },
  bossTalk: { build(root){ const o = { clouds: addClouds(root, 10, 140, -8, true), bosses: {}, plane: buildPlaneModel(curSkin(), false), gift: null, tears: [] };
      ['crow', 'storm', 'owl'].forEach(t => { const m = BM[t](); m.scale.setScalar(t === 'storm' ? 1.5 : 1.7); m.position.set(0, 9.5, -8); m.visible = false; root.add(m); o.bosses[t] = m; });
      o.plane.scale.setScalar(1.35); root.add(o.plane); o.gift = MK.gold.make(); o.gift.scale.setScalar(2.4); root.add(o.gift);
      for (let i = 0; i < 6; i++){ const d = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0x78beff, transparent: true, opacity: 0.85 })); d.scale.set(0.25, 0.4, 0.25); root.add(d); o.tears.push(d); }
      o.rain = makeRain(root); return o; },
    show(o, s){ for (const k in o.bosses) o.bosses[k].visible = k === s.boss; o.plane.parent.remove(o.plane); o.plane = buildPlaneModel(curSkin(), false); o.plane.scale.setScalar(1.35); o.gift.parent.add(o.plane); o.rain.m.visible = !!s.rain; },
    update(o, s, t, dt, speak){ const b = o.bosses[s.boss]; b.visible = true; const sadish = s.bm === 'sad', hurt = s.bm === 'hurt', happy = s.bm === 'happy', flee = s.flee ? smooth(Math.min(1, t / 3)) : 0;
      b.position.set(flee * 40, 9.5 + Math.sin(C3.T * 1.6) * 0.6 + flee * 8, -8 - flee * 20); b.rotation.set(sadish ? 0.18 : 0, 0, hurt ? Math.sin(C3.T * 30) * 0.06 : happy ? Math.sin(C3.T * 3) * 0.08 : 0); b.scale.setScalar((s.boss === 'storm' ? 1.5 : 1.7) * (1 - flee * 0.5) * (speak > 0.2 && s.who !== 'Nuki' ? 1 + Math.sin(C3.T * 24) * 0.012 : 1));
      if (b.userData.wl){ const f = Math.sin(C3.T * (s.boss === 'crow' ? 5 : 3)) * 0.5 * (sadish ? 0.35 : 1); b.userData.wl.rotation.z = 0.35 + f; b.userData.wr.rotation.z = -0.35 - f; }
      if (b.userData.bolts) b.userData.bolts.forEach((x, i) => x.visible = !sadish && !happy && Math.sin(C3.T * 9 + i * 2) > -0.2);
      o.tears.forEach((d, i) => { d.visible = sadish; const k = (C3.T * 0.9 + i / 6) % 1, sx = i % 2 ? 1 : -1; d.position.set(b.position.x + sx * (1.2 + (i % 3) * 0.7), b.position.y - 0.6 - k * 4.5, b.position.z + 4); d.material.opacity = 0.9 * (1 - k); });
      o.gift.visible = !!s.gift; o.gift.position.set(5.6, 5.4 + Math.sin(C3.T * 2) * 0.3, 2); o.gift.rotation.y = C3.T * 2.2;
      o.plane.position.set(Math.sin(C3.T) * 0.6, 1.6, 8); o.plane.rotation.z = Math.sin(C3.T) * 0.1; o.plane.rotation.x = 0.1; o.plane.userData.prop.rotation.z = C3.T * 40; if (s.who === 'Nuki' && speak > 0.2) o.plane.position.y += Math.abs(Math.sin(C3.T * 20)) * 0.1;
      if (s.rain) o.rain.update(C3.T); const tr = s.who === 'Nuki' ? 0 : 1; camTo(Math.sin(C3.T * 0.3) * 1.4, lerp(4.5, 6, tr), lerp(18, 22, tr), 0, lerp(2.5, 7.5, tr), -4); } },
  ending: { build(root){ const o = { isl: addIsland(root), clouds: addClouds(root, 12, 180, -12, true), fw: makeFireworks(root), lights: [] };
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 300).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x1c2b3a })); ground.position.set(0, -60, -60); root.add(ground);
      for (let i = 0; i < 80; i++){ const gl = glowSprite(0xffe078, 3.2, 0.7); gl.position.set((hash2(i, 1) - 0.5) * 220, -59.5, -hash2(i, 2) * 140); root.add(gl); o.lights.push(gl); }
      o.ground = ground; return o; },
    show(o){ },
    update(o, s, t){ const k = smooth(Math.min(1, t / 6)); o.isl.userData.setGlow(1); o.isl.position.set(0, lerp(-14, 2, k) + Math.sin(C3.T * 0.7) * 0.4, -10); o.isl.rotation.y = 0.35 + Math.sin(C3.T * 0.2) * 0.05; o.fw.update(C3.T); o.lights.forEach((l, i) => { l.material.opacity = k * (0.5 + 0.4 * Math.sin(C3.T * 2 + i)); });
      camTo(lerp(-4, 3, k), lerp(4, 10, k), 40, 0, lerp(-3, 3, k), -10); } }
};
function camTo(px, py, pz, lx, ly, lz){ C3.camPos.set(px, py, pz); C3.camLook.set(lx, ly, lz); }

/* ------------------------------------------------------------------ control de la cinemática */
function c3Init(){
  if (!g3Init()) return false;
  GR.mesh.visible = GR.far.visible = false; TRK.air.visible = TRK.road.visible = false; PL.root.visible = PL.shadow.visible = false; SK.mount.visible = false;
  S3.add(new THREE.AmbientLight(0xffffff, 0.05));
  initBossModels();
  C3.moon = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f1e6, fog: false })); C3.moon.position.set(46, 58, -150); S3.add(C3.moon);
  C3.moonGlow = glowSprite(0xd2e1ff, 70, 0.55); C3.moonGlow.position.copy(C3.moon.position); S3.add(C3.moonGlow);
  C3.root = new THREE.Group(); S3.add(C3.root); CAM3.fov = 55; CAM3.far = 1400; CAM3.updateProjectionMatrix();
  c3Scene('island'); C3.menuBg = { o: C3.cur.o, update: SCENES.island.update };
  return true;
}
function c3Scene(key){
  if (C3.curKey === key) return; if (C3.cur){ C3.cur.grp.visible = false; }
  let sc = C3.scenes[key]; if (!sc){ const grp = new THREE.Group(); C3.root.add(grp); const def = SCENES[key]; sc = C3.scenes[key] = { def, grp, o: def.build(grp) }; }
  sc.grp.visible = true; C3.cur = sc; C3.curKey = key;
}
function c3Start(key){
  const shots = CINE[key]; if (!shots) return; C3.key = key; C3.shots = shots; C3.i = 0; C3.playing = true; document.getElementById('screen-menu').classList.add('hidden'); document.getElementById('dlg').classList.remove('hidden');
  Sound.init(); Sound.startMusic(); c3Enter();
}
function c3Enter(){
  const s = C3.shots[C3.i]; C3.t = 0; C3.chars = 0; C3.txt = cineTxt(s); c3Scene(s.sc); C3.cur.def.show && C3.cur.def.show(C3.cur.o, s); if (s.m) Sound.setMood(s.m);
  const nm = cineWho(s), sp = SPEAKERS[s.who] || SPEAKERS.Narrador; const tag = document.getElementById('dlgName'); tag.textContent = nm; tag.style.background = sp.col; document.getElementById('dlgPortraitWrap').style.display = s.who === 'Narrador' ? 'none' : 'block';
  document.getElementById('dlgText').textContent = ''; document.getElementById('dlgNext').style.opacity = 0; document.getElementById('fin').classList.toggle('show', !!s.fin); document.getElementById('dlgCount').textContent = (C3.i + 1) + ' / ' + C3.shots.length;
  c3Portrait(s);
}
function c3Portrait(s){ const cv = document.getElementById('dlgPortrait'), c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); if (s.who === 'Narrador') return; const old = ctx; /* reutiliza drawPortrait sobre su propio canvas */ const sv = window.ctx; try { drawPortraitTo(c, s.who, s.mood, cv.width / 2, cv.height / 2, cv.width / 2 - 4, C3.T); } catch (e) {} }
function drawPortraitTo(c, who, mood, px, py, R, T){
  c.save(); c.beginPath(); c.arc(px, py, R, 0, TAU); c.clip();
  const g = c.createLinearGradient(0, py - R, 0, py + R); g.addColorStop(0, '#ffe9c9'); g.addColorStop(1, '#f5b98a'); c.fillStyle = who === 'Nubarrón Trueno' ? '#aab3c9' : who === 'Capitán Grajo' ? '#9aa6d8' : who === 'Don Búho' ? '#f1d3a6' : g; c.fillRect(px - R, py - R, R * 2, R * 2);
  if (who === 'Nuki') drawSquirrelFront(c, px, py + R * 0.05, R * 0.58, { t: T, mood: mood || 'happy' }); else if (who === 'Abuelo') drawSquirrelFront(c, px, py + R * 0.05, R * 0.58, { t: T, old: true, mood: mood || 'happy' });
  else if (who === 'Capitán Grajo') drawCrow(c, px, py + R * 0.5, R * 0.5, T, { mood: mood === 'angry' ? 'angry' : 'sad', flap: 0 }); else if (who === 'Nubarrón Trueno') drawStormKing(c, px, py + R * 0.1, R * 0.34, T, { mood: mood === 'happy' ? 'happy' : mood === 'angry' ? 'angry' : 'sad' });
  else if (who === 'Don Búho') drawOwl(c, px, py + R * 0.55, R * 0.5, T, { mood: mood === 'happy' ? 'happy' : mood === 'angry' ? 'angry' : 'sad' });
  c.restore(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(px, py, R, 0, TAU); c.stroke();
}
function c3Advance(){
  if (!C3.playing) return; if (C3.chars < C3.txt.length){ C3.chars = C3.txt.length; document.getElementById('dlgText').textContent = C3.txt; document.getElementById('dlgNext').style.opacity = 1; return; }
  if (C3.i >= C3.shots.length - 1){ c3End(); return; } C3.i++; Sound.sfx('ui'); c3Enter();
}
function c3End(){ C3.playing = false; document.getElementById('dlg').classList.add('hidden'); document.getElementById('fin').classList.remove('show'); document.getElementById('screen-menu').classList.remove('hidden'); c3Scene('island'); Sound.setMood('menu'); if (C3.queue && C3.queue.length){ const k = C3.queue.shift(); setTimeout(() => c3Start(k), 200); } }
let _last = performance.now();
function c3Frame(now){
  const dt = Math.min(0.05, (now - _last) / 1000); _last = now; C3.T += dt; G.tAnim = C3.T;
  if (C3.playing){
    const s = C3.shots[C3.i]; C3.t += dt;
    const before = Math.floor(C3.chars); C3.chars = Math.min(C3.txt.length, C3.chars + dt * (s.who === 'Narrador' ? 34 : 30)); const now2 = Math.floor(C3.chars);
    if (now2 > before){ const ch = C3.txt[now2 - 1]; if (ch !== ' ' && /[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(ch) && now2 % (s.who === 'Narrador' ? 3 : 2) === 0){ Sound.voice(s.who, ch, now2); C3.talkT = C3.T; } document.getElementById('dlgText').textContent = C3.txt.slice(0, now2); if (now2 >= C3.txt.length) document.getElementById('dlgNext').style.opacity = 1; }
    const speak = clamp(1 - (C3.T - C3.talkT) / 0.14, 0, 1) * (C3.chars < C3.txt.length ? 1 : 0);
    setTod(s.tod || 'dawn', C3.flash); C3.flash = Math.max(0, C3.flash - dt * 2.6);
    C3.cur.def.update(C3.cur.o, s, C3.t, dt, speak);
    const k = 1 - Math.pow(0.0008, dt); CAM3.position.lerp(C3.camPos, C3.t < 0.05 ? 1 : k); C3.lookCur = C3.lookCur || C3.camLook.clone(); C3.lookCur.lerp(C3.camLook, C3.t < 0.05 ? 1 : k); CAM3.lookAt(C3.lookCur);
    SK.dome.position.copy(CAM3.position); C3.moon.position.set(CAM3.position.x + 46, 58, CAM3.position.z - 150); C3.moonGlow.position.copy(C3.moon.position);
    if (C3.t < 0.5 || (s.who !== 'Narrador' && Math.floor(C3.T * 6) !== C3._pf)){ C3._pf = Math.floor(C3.T * 6); c3Portrait(s); }
    const fade = clamp(1 - C3.t / 0.5, 0, 1); document.getElementById('veil').style.opacity = fade;
  } else { setTod('dawn', 0); if (C3.menuBg){ C3.menuBg.update(C3.menuBg.o, { glow: 1 }, 2 + C3.T * 0.15); } CAM3.position.lerp(C3.camPos, 0.05); CAM3.lookAt(C3.camLook); SK.dome.position.copy(CAM3.position); C3.moon.position.set(CAM3.position.x + 46, 58, CAM3.position.z - 150); C3.moonGlow.position.copy(C3.moon.position); }
  g3RenderScene(); requestAnimationFrame(c3Frame);
}


/* ------------------------------------------------------------------ uso dentro del juego (reutiliza el sistema de cinemáticas de 08-cine.js) */
function c3Ready(){
  if (C3.ready) return true; if (typeof G3 === 'undefined' || !G3.ok) return false;
  try {
    if (!BM.crow) initBossModels();
    C3.moon = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: 0xf4f1e6, fog: false })); C3.moon.position.set(46, 58, -150); C3.moon.visible = false; S3.add(C3.moon);
    C3.moonGlow = glowSprite(0xd2e1ff, 70, 0.55); C3.moonGlow.position.copy(C3.moon.position); C3.moonGlow.visible = false; S3.add(C3.moonGlow);
    C3.root = new THREE.Group(); S3.add(C3.root); C3.ready = true; return true;
  } catch (e){ console.warn('cinemáticas 3D no disponibles', e); return false; }
}
/* al empezar una cinemática se oculta el mundo del juego; al terminar se restaura tal como estaba */
function c3Hide(){
  C3.saved = []; const keep = new Set([SK.dome, C3.root, C3.moon, C3.moonGlow]);
  for (const o of S3.children){ if (keep.has(o) || o.isLight) continue; C3.saved.push([o, o.visible]); o.visible = false; }
  C3.on = true; C3.curKey = ''; C3.lookCur = null; C3.lastShot = -1;
}
function c3Restore(){
  if (!C3.on) return; for (const [o, v] of C3.saved || []) o.visible = v; C3.saved = []; C3.on = false;
  if (C3.cur) C3.cur.grp.visible = false; C3.curKey = ''; C3.moon.visible = false; C3.moonGlow.visible = false; CAM3.fov = H > W ? 70 : 60; CAM3.updateProjectionMatrix();
}
/* dibuja el fondo 3D de la toma actual (el cuadro de diálogo lo sigue pintando drawCine en 2D) */
function c3Render(s, shotIdx, t, T, talkT, chars, txtLen, dt){
  C3.T = T; if (C3.lastShot !== shotIdx){ C3.lastShot = shotIdx; c3Scene(s.sc); C3.cur.def.show && C3.cur.def.show(C3.cur.o, s); C3.t0shot = t; C3.lookCur = null; }
  const speak = clamp(1 - (T - talkT) / 0.14, 0, 1) * (chars < txtLen ? 1 : 0);
  setTod(s.tod || 'dawn', C3.flash); C3.flash = Math.max(0, C3.flash - dt * 2.6);
  C3.cur.def.update(C3.cur.o, s, t, dt, speak);
  const k = 1 - Math.pow(0.0008, dt), snap = t < 0.05 || !C3.lookCur;
  CAM3.position.lerp(C3.camPos, snap ? 1 : k); if (!C3.lookCur) C3.lookCur = C3.camLook.clone(); C3.lookCur.lerp(C3.camLook, snap ? 1 : k); CAM3.lookAt(C3.lookCur);
  CAM3.fov = 55; CAM3.updateProjectionMatrix();
  SK.dome.position.copy(CAM3.position); C3.moon.position.set(CAM3.position.x + 46, 58, CAM3.position.z - 150); C3.moonGlow.position.copy(C3.moon.position);
  g3RenderScene();
}
