/* 05c2 · enemigos 3D mejorados: más detalle, brillos en los ojos, partes que se mueven y efectos de luz.
   Sustituyen a los modelos básicos de 05c-models3d.js (mismos nombres y mismo comportamiento de juego). */
'use strict';
function initModelsPlus(){
  const T = (geo, color, p, s, r, o) => pt(geo, color, p, s, r, o);
  const E = (geo, color, p, s, r) => pt(geo, color, p, s, r, { e: true });
  const eyePair = (x, y, z, r, pup, hl) => [
    T(GEO.sph(), 0xffffff, [-x, y, z], [r, r * 1.18, r * 0.62]), T(GEO.sph(), 0xffffff, [x, y, z], [r, r * 1.18, r * 0.62]),
    (pup === 'glow' ? E : T)(GEO.sph(), pup === 'glow' ? 0xff3a3a : 0x14162e, [-x, y - r * 0.05, z + r * 0.28], [r * 0.55, r * 0.62, r * 0.32]), (pup === 'glow' ? E : T)(GEO.sph(), pup === 'glow' ? 0xff3a3a : 0x14162e, [x, y - r * 0.05, z + r * 0.28], [r * 0.55, r * 0.62, r * 0.32]),
    E(GEO.sph(), 0xffffff, [-x - r * 0.18, y + r * 0.22, z + r * 0.46], [r * 0.2, r * 0.2, r * 0.12]), E(GEO.sph(), 0xffffff, [x - r * 0.18, y + r * 0.22, z + r * 0.46], [r * 0.2, r * 0.2, r * 0.12])];
  const brows = (x, y, z, w, ang, c) => [T(GEO.box(), c || 0x14162e, [-x, y, z], [w, w * 0.24, w * 0.24], [0, 0, -ang]), T(GEO.box(), c || 0x14162e, [x, y, z], [w, w * 0.24, w * 0.24], [0, 0, ang])];
  const GCe = (k, f) => gcache('p_' + k, f);
  const trans = (geo, color, op, add) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
  const shape = (pts, depth) => extrude(pts, depth);
  const CONE = GCe('cone', () => new THREE.ConeGeometry(0.5, 1, 14, 1, true));

  /* ================= ABEJORRO: un círculo redondo y simpático ================= */
  MK.bee = { make(){
    const GOLD = 0xffc93c, GOLD2 = 0xffe27a, BROWN = 0x6b3f2a;
    const parts = [
      T(GEO.sph(), GOLD, [0, 0, 0], [2.7, 2.7, 2.7]),                                    // cuerpo: gran círculo
      T(GEO.sph(), GOLD2, [-0.55, 0.62, 0.55], [1.2, 1.0, 0.9]),                          // brillo suave
      T(GEO.tor(), BROWN, [0, 0, -0.1], [2.55, 2.55, 2.55], [0, 0, 0]), T(GEO.tor(), BROWN, [0, 0, -0.62], [2.3, 2.3, 2.3], [0, 0, 0]),   // franjas: aros alrededor del cuerpo
      T(GEO.sph(), 0xfff3c4, [0, -0.35, 1.1], [1.7, 1.4, 0.9]),                           // barriguita clara
      ...eyePair(0.46, 0.34, 1.18, 0.5), T(GEO.sph(), 0xff9fb4, [-0.9, -0.22, 1.12], [0.42, 0.28, 0.2]), T(GEO.sph(), 0xff9fb4, [0.9, -0.22, 1.12], [0.42, 0.28, 0.2]),   // mejillas rosas
      ...brows(0.46, 0.82, 1.22, 0.5, 0.5, BROWN), T(GEO.box(), 0x8a2a2a, [0, -0.12, 1.3], [0.4, 0.1, 0.06]),
      T(GEO.cyl(), BROWN, [-0.38, 1.55, 0.2], [0.07, 0.8, 0.07], [0.25, 0, 0.42]), T(GEO.cyl(), BROWN, [0.38, 1.55, 0.2], [0.07, 0.8, 0.07], [0.25, 0, -0.42]), T(GEO.sph(), 0xff7a9a, [-0.62, 1.95, 0.3], [0.26, 0.26, 0.26]), T(GEO.sph(), 0xff7a9a, [0.62, 1.95, 0.3], [0.26, 0.26, 0.26]),
      T(GEO.sph(), BROWN, [0, -0.3, -1.45], [0.5, 0.5, 0.5]), T(GEO.cone(), BROWN, [0, -0.3, -1.9], [0.3, 0.55, 0.3], [-Math.PI / 2, 0, 0])   // colita y aguijón redondeado
    ];
    const g = build(parts, { outline: 1.045 });
    const wingGeo = GCe('beewing', () => smoothG(new THREE.SphereGeometry(0.5, 20, 12)));
    const wing = (sx, big) => { const p = new THREE.Group(), m = trans(wingGeo, big ? 0xcfeaff : 0xffd6ee, 0.82); m.scale.set(big ? 1.9 : 1.25, 0.07, big ? 1.35 : 0.9); m.position.x = sx * (big ? 0.95 : 0.65); p.add(m); p.position.set(sx * 0.7, 1.15, big ? 0.05 : -0.5); return p; };
    const W = [wing(-1, true), wing(1, true), wing(-1, false), wing(1, false)]; W.forEach(w => g.add(w)); g.userData.W = W;
    g.add(glowSprite(0xffd860, 4.6, 0.3)); g.userData.hy = 1.35; return g; },
    anim(g, ob, t){ const f = Math.sin(t * 38 + ob.v * 9) * 0.55, W = g.userData.W; W[0].rotation.z = 0.3 + f; W[1].rotation.z = -0.3 - f; W[2].rotation.z = 0.18 + f * 0.8; W[3].rotation.z = -0.18 - f * 0.8; g.rotation.z = Math.sin(t * 5 + ob.v * 7) * 0.08; g.position.y += Math.sin(t * 6 + ob.v * 3) * 0.1; } };

  /* ================= COMETA ================= */
  MK.comet = { make(){
    const spikes = []; for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4; spikes.push(E(GEO.cone(), i % 2 ? 0xffd24a : 0xff7a20, [Math.cos(a) * 0.95, Math.sin(a) * 0.95, -0.15], [0.45, 0.95, 0.45], [0, 0, a - Math.PI / 2]));}
    const core = build([T(GEO.ico(), 0xffa13a, [0, 0, 0], [2.0, 2.0, 2.0]), T(GEO.sph(), 0xffd26a, [-0.5, 0.6, 0.5], [0.9, 0.7, 0.6]), ...eyePair(0.32, 0.18, 0.72, 0.4, 'glow'), ...brows(0.3, 0.56, 0.78, 0.5, 0.5), T(GEO.box(), 0x5a0f08, [0, -0.32, 0.76], [0.6, 0.2, 0.06]), T(GEO.box(), 0xffffff, [-0.18, -0.24, 0.8], [0.12, 0.12, 0.04]), T(GEO.box(), 0xffffff, [0.18, -0.24, 0.8], [0.12, 0.12, 0.04])], { center: false, outline: 1.06 });
    const crown = build(spikes, { center: false, outline: 0 });
    const tail = build([E(GEO.cone(), 0xff7a1a, [0, 0, -2.6], [1.5, 4.6, 1.5], [-Math.PI / 2, 0, 0]), E(GEO.cone(), 0xffc23a, [0, 0, -2.2], [1.0, 3.6, 1.0], [-Math.PI / 2, 0, 0]), E(GEO.cone(), 0xfff4c0, [0, 0, -1.7], [0.55, 2.4, 0.55], [-Math.PI / 2, 0, 0]),
      E(GEO.cone(), 0xff9a2a, [-0.7, 0.3, -2.0], [0.6, 2.8, 0.6], [-Math.PI / 2, 0, 0.3]), E(GEO.cone(), 0xff9a2a, [0.7, 0.3, -2.0], [0.6, 2.8, 0.6], [-Math.PI / 2, 0, -0.3])], { center: false, outline: 0 });
    const g = new THREE.Group(); g.add(core, crown, tail, glowSprite(0xff7a20, 7, 0.6));
    g.userData = { core, crown, tail, embers: [], hy: 0 };
    for (let i = 0; i < 5; i++){ const s = glowSprite(i % 2 ? 0xffc040 : 0xff6a20, 1.3, 0.8); g.add(s); g.userData.embers.push(s); }
    return g; },
    anim(g, ob, t){ const u = g.userData, f = Math.sin(t * 20 + ob.v * 4); u.tail.scale.set(1 + 0.1 * f, 1 + 0.1 * f, 1 + 0.18 * Math.sin(t * 26)); u.crown.rotation.z = t * 2.6; u.core.rotation.z = Math.sin(t * 6) * 0.05;
      u.embers.forEach((s, i) => { const k = (t * 1.6 + i / 5) % 1; s.position.set(Math.sin(i * 7 + t * 4) * 0.9 * (1 - k), Math.cos(i * 5) * 0.8, -1.6 - k * 4.6); s.material.opacity = 0.9 * (1 - k); s.scale.setScalar(1.6 * (1 - k * 0.7)); }); } };

  /* ================= MURCIÉLAGO ================= */
  const batWing = (sg) => { const k = sg > 0 ? 1 : -1, P = [[0, 0.28], [0.8, 0.78], [1.5, 0.55], [1.28, 0.12], [1.22, -0.3], [0.9, -0.08], [0.7, -0.46], [0.4, -0.12], [0, -0.22]]; return GCe('batw' + k, () => shape(P.map(p => [p[0] * k, p[1]]), 0.06)); };
  MK.bat = { make(){
    const body = [T(GEO.sph(), 0x6a3fb8, [0, 0, 0], [1.05, 1.15, 0.95]), T(GEO.sph(), 0x8a5ad8, [0, 0.35, 0.1], [0.9, 0.7, 0.8]), T(GEO.sph(), 0xc9a8ff, [0, -0.22, 0.32], [0.62, 0.6, 0.42]),
      T(GEO.cone(), 0x6a3fb8, [-0.34, 0.8, 0], [0.38, 0.7, 0.24], [0, 0, 0.18]), T(GEO.cone(), 0x6a3fb8, [0.34, 0.8, 0], [0.38, 0.7, 0.24], [0, 0, -0.18]), T(GEO.cone(), 0xff9ac8, [-0.34, 0.74, 0.1], [0.2, 0.46, 0.1], [0, 0, 0.18]), T(GEO.cone(), 0xff9ac8, [0.34, 0.74, 0.1], [0.2, 0.46, 0.1], [0, 0, -0.18]),
      ...eyePair(0.22, 0.15, 0.46, 0.27, 'glow'), ...brows(0.22, 0.42, 0.5, 0.34, 0.55), T(GEO.sph(), 0x14162e, [0, -0.02, 0.52], [0.12, 0.09, 0.09]),
      T(GEO.cone(), 0xffffff, [-0.12, -0.2, 0.52], [0.08, 0.24, 0.08], [Math.PI, 0, 0]), T(GEO.cone(), 0xffffff, [0.12, -0.2, 0.52], [0.08, 0.24, 0.08], [Math.PI, 0, 0]),
      T(GEO.cone(), 0x6a3fb8, [-0.3, -0.72, 0], [0.16, 0.34, 0.16], [Math.PI, 0, 0]), T(GEO.cone(), 0x6a3fb8, [0.3, -0.72, 0], [0.16, 0.34, 0.16], [Math.PI, 0, 0])];
    const g = build(body, { outline: 1.06 });
    const mk = sg => { const p = new THREE.Group(), m = new THREE.Mesh(batWing(sg), new THREE.MeshToonMaterial({ color: 0xb48cf0, gradientMap: LT.grad, side: THREE.DoubleSide })); p.add(m);
      for (let i = 0; i < 3; i++){ const bone = new THREE.Mesh(GCe('bone', () => new THREE.BoxGeometry(1, 0.05, 0.05)), new THREE.MeshBasicMaterial({ color: 0x2a1060 })); bone.scale.x = 1.45 - i * 0.2; bone.position.set(sg * (0.72 - i * 0.1), 0.27 - i * 0.2, 0.0); bone.rotation.z = sg * (0.55 - i * 0.55) * -1; p.add(bone); }
      const claw = new THREE.Mesh(GEO.cone(), new THREE.MeshBasicMaterial({ color: 0xfff0e0 })); claw.scale.set(0.1, 0.3, 0.1); claw.position.set(sg * 1.45, 0.48, 0); claw.rotation.z = -sg * 0.9; p.add(claw); p.position.set(sg * 0.3, 0.1, 0); return p; };
    const pl = mk(-1), pr = mk(1); g.add(pl, pr); g.userData.pl = pl; g.userData.pr = pr; g.add(glowSprite(0xaa55ff, 3.6, 0.28)); g.userData.hy = 0.9; return g; },
    anim(g, ob, t, gt){ const f = Math.sin(t * 15 + ob.v * 8) * 0.55; g.userData.pl.rotation.z = -f; g.userData.pr.rotation.z = f; const k = hopK(ob, gt); g.position.y += Math.sin(k * Math.PI) * 0.9; g.rotation.z = hopWarn(ob, gt) ? Math.sin(t * 40) * 0.14 : 0; g.rotation.x = Math.sin(t * 15 + ob.v * 8) * 0.07; } };

  /* ================= DRON ================= */
  MK.drone = { make(){
    const parts = [T(GEO.sph(), 0x38bfae, [0, 0, 0], [1.5, 1.5, 1.5]), T(GEO.tor(), 0x1b7a74, [0, -0.05, 0], [1.5, 1.5, 1.5], [Math.PI / 2, 0, 0]), T(GEO.tor(), 0x9ff3e4, [0, 0.45, 0], [1.1, 1.1, 1.1], [Math.PI / 2, 0, 0]),
      T(GEO.sph(), 0xffffff, [0, 0.05, 0.55], [1.15, 1.15, 0.55]), T(GEO.cyl(), 0x2a3566, [-1.0, -0.15, 0], [0.34, 0.65, 0.34]), T(GEO.cyl(), 0x2a3566, [1.0, -0.15, 0], [0.34, 0.65, 0.34]), T(GEO.box(), 0x2a3566, [-0.55, -0.1, 0], [0.7, 0.14, 0.18]), T(GEO.box(), 0x2a3566, [0.55, -0.1, 0], [0.7, 0.14, 0.18]),
      E(GEO.cone(), 0x78e6ff, [-1.0, -0.78, 0], [0.34, 0.5, 0.34], [Math.PI, 0, 0]), E(GEO.cone(), 0x78e6ff, [1.0, -0.78, 0], [0.34, 0.5, 0.34], [Math.PI, 0, 0]),
      T(GEO.cyl(), 0x14162e, [0, 0.9, 0], [0.12, 0.6, 0.12]), T(GEO.box(), 0xff3b3b, [0.62, 0.62, 0.2], [0.14, 0.14, 0.14]), T(GEO.cyl(), 0x14162e, [-0.7, 0.85, -0.2], [0.07, 0.7, 0.07], [0, 0, 0.3]), T(GEO.sph(), 0x9ff3e4, [-0.9, 1.22, -0.2], [0.18, 0.18, 0.18])];
    for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3; parts.push(T(GEO.box(), 0x1b7a74, [Math.cos(a) * 0.75, Math.sin(a) * 0.75 - 0.05, 0.35 * Math.abs(Math.cos(a))], [0.12, 0.12, 0.1])); }
    const g = build(parts, { outline: 1.06 });
    const eye = new THREE.Group(), ring = new THREE.Mesh(GEO.tor(), new THREE.MeshBasicMaterial({ color: 0x14162e })); ring.scale.setScalar(0.82); const iris = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0xff6a2d })); iris.scale.set(0.55, 0.55, 0.3);
    const pup = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0x14162e })); pup.scale.set(0.26, 0.26, 0.2); pup.position.z = 0.1; const hl = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.scale.setScalar(0.1); hl.position.set(-0.1, 0.1, 0.2);
    eye.add(ring, iris, pup, hl); eye.position.set(0, 0.04, 0.82); g.add(eye);
    const rotor = build([T(GEO.box(), 0x2a3566, [0, 0, 0], [2.5, 0.06, 0.24]), T(GEO.box(), 0x2a3566, [0, 0, 0], [0.24, 0.06, 2.5])], { center: false, outline: 0 }); rotor.position.y = 1.2; g.add(rotor);
    const disc = trans(new THREE.CircleGeometry(1.3, 20).rotateX(-Math.PI / 2), 0xdff4ff, 0.14); disc.position.y = 1.2; g.add(disc);
    const beam = trans(CONE, 0x60ffd0, 0.16, true); beam.rotation.x = -Math.PI / 2; beam.scale.set(2.6, 7, 2.6); beam.position.set(0, 0.04, 4.2); g.add(beam);
    g.userData = { eye, iris, rotor, beam, hy: 1.0 }; g.add(glowSprite(0x60ffd0, 3.4, 0.24)); return g; },
    anim(g, ob, t, gt, cx){ const u = g.userData; u.rotor.rotation.y = t * 38; u.eye.position.x = clamp(cx.look, -1, 1) * 0.2; u.iris.material.color.setHex(ob.locked ? 0xff2d2d : 0xff6a2d); u.beam.material.color.setHex(ob.locked ? 0xff3030 : 0x60ffd0); u.beam.material.opacity = (ob.locked ? 0.26 : 0.13) + 0.05 * Math.sin(t * 8); g.position.y += Math.sin(t * 3 + ob.v * 6) * 0.1; g.rotation.z = Math.sin(t * 2 + ob.v * 4) * 0.06; } };

  /* ================= BABA ================= */
  MK.slime = { ground: true, make(){
    const inner = build([T(GEO.sph(), 0x8a2fd0, [0, 0, 0], [1.75, 1.45, 1.75]), T(GEO.sph(), 0xd89cff, [-0.4, -0.1, 0.3], [0.45, 0.45, 0.45]), T(GEO.sph(), 0xf0c8ff, [0.5, 0.15, -0.2], [0.3, 0.3, 0.3]), T(GEO.sph(), 0xe0b0ff, [0.2, -0.45, 0.5], [0.22, 0.22, 0.22])], { center: false, outline: 0 });
    const shell = trans(GCe('slimeshell', () => new THREE.SphereGeometry(0.5, 18, 14)), 0xc37cff, 0.55); shell.scale.set(2.2, 1.9, 2.2); shell.position.y = 0.05;
    const face = build([...eyePair(0.46, 0.22, 0.95, 0.44), ...brows(0.44, 0.7, 1.0, 0.6, 0.5), T(GEO.box(), 0x3a0f55, [0, -0.28, 1.02], [0.7, 0.26, 0.1]), T(GEO.box(), 0xffffff, [-0.2, -0.2, 1.08], [0.14, 0.12, 0.05]), T(GEO.box(), 0xffffff, [0.2, -0.2, 1.08], [0.14, 0.12, 0.05])], { center: false, outline: 0 });
    const drips = build([T(GEO.cone(), 0xb95af0, [-0.7, -0.95, 0.4], [0.28, 0.55, 0.28], [Math.PI, 0, 0]), T(GEO.cone(), 0xb95af0, [0.55, -0.98, 0.6], [0.22, 0.45, 0.22], [Math.PI, 0, 0]), T(GEO.cone(), 0xb95af0, [0.0, -1.0, -0.7], [0.3, 0.5, 0.3], [Math.PI, 0, 0])], { center: false, outline: 0 });
    const puddle = trans(new THREE.CircleGeometry(1.5, 20).rotateX(-Math.PI / 2), 0xa24ae8, 0.5); puddle.position.y = -1.0;
    const bub = []; const g = new THREE.Group(); g.add(inner, shell, face, drips, puddle);
    for (let i = 0; i < 5; i++){ const b = trans(GEO.sphL(), 0xffffff, 0.7); b.scale.setScalar(0.18 + 0.05 * (i % 3)); g.add(b); bub.push(b); }
    g.add(glowSprite(0xc060ff, 4, 0.22)); g.userData = { inner, shell, face, bub, hy: 1.0 }; return g; },
    anim(g, ob, t){ const b = Math.sin(t * 6 + ob.v * 8), sq = 1 + 0.13 * b, u = g.userData; g.scale.set(1 / sq, sq, 1 / sq); g.position.y += Math.max(0, b) * 0.4;
      u.bub.forEach((m, i) => { const k = (t * 0.7 + i * 0.2 + ob.v) % 1; m.position.set(Math.sin(i * 2.1 + t) * 0.7, -0.6 + k * 1.5, Math.cos(i * 1.7) * 0.6); m.material.opacity = 0.75 * (1 - k); }); u.shell.scale.set(2.2 + 0.08 * Math.sin(t * 9), 1.9 - 0.06 * Math.sin(t * 9), 2.2 + 0.08 * Math.sin(t * 9)); } };

  /* ================= BOLA RODANTE ================= */
  MK.boulder = { ground: true, make(){
    const parts = [T(GEO.sph(), 0xb08a5a, [0, 0, 0], [2.3, 2.3, 2.3]), T(GEO.sph(), 0x6b523c, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), T(GEO.sph(), 0x6b523c, [-0.6, -0.3, 0.7], [0.42, 0.42, 0.42]), T(GEO.sph(), 0x6b523c, [0.2, -0.7, 0.4], [0.36, 0.36, 0.36]),
      T(GEO.sph(), 0x5aa044, [-0.55, 0.85, 0.2], [0.8, 0.28, 0.8]), T(GEO.sph(), 0x5aa044, [0.7, 0.7, -0.4], [0.55, 0.22, 0.55]), T(GEO.box(), 0x3a281a, [0.15, 0.2, 1.02], [0.06, 0.8, 0.05], [0, 0, 0.4]), T(GEO.box(), 0x3a281a, [-0.5, -0.4, 0.9], [0.06, 0.6, 0.05], [0, 0, -0.5])];
    for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4; parts.push(T(GEO.sph(), 0xe6dccb, [Math.cos(a) * 1.18, Math.sin(a) * 1.18, 0], [0.44, 0.44, 0.44])); }
    const rock = build(parts, { center: false, outline: 1.05 });
    const face = build([...eyePair(0.44, 0.1, 0.95, 0.5, 'glow'), ...brows(0.46, 0.58, 1.05, 0.74, 0.5), T(GEO.box(), 0x2a180c, [0, -0.52, 1.02], [1.0, 0.4, 0.1]), ...[-0.3, 0, 0.3].map(x => T(GEO.box(), 0xffffff, [x, -0.39, 1.08], [0.17, 0.17, 0.05])), ...[-0.15, 0.15].map(x => T(GEO.box(), 0xffffff, [x, -0.66, 1.08], [0.15, 0.14, 0.05]))], { center: false, outline: 0 });
    const g = new THREE.Group(), dust = []; g.add(rock, face);
    for (let i = 0; i < 6; i++){ const d = glowSprite(0xd8c098, 2.2, 0.4); d.material.blending = THREE.NormalBlending; g.add(d); dust.push(d); }
    g.userData = { rock, dust, hy: 1.05 }; return g; },
    anim(g, ob, t){ g.userData.rock.rotation.x = -t * 7 + ob.v * 6; g.position.y += Math.abs(Math.sin(t * 7 + ob.v)) * 0.12; g.userData.dust.forEach((d, i) => { const k = (t * 2.2 + i / 6) % 1; d.position.set((i - 2.5) * 0.45, -0.9 + k * 0.9, -1.4 - k * 3.0); d.material.opacity = 0.42 * (1 - k); d.scale.setScalar(1.2 + k * 2.4); }); } };

  /* ================= CONEJO ================= */
  MK.bunny = { ground: true, make(){
    const parts = [T(GEO.sph(), 0xfff4ea, [0, 0.75, 0], [1.25, 1.5, 1.15]), T(GEO.sph(), 0xfff4ea, [-0.36, 0.12, 0.35], [0.46, 0.26, 0.64]), T(GEO.sph(), 0xfff4ea, [0.36, 0.12, 0.35], [0.46, 0.26, 0.64]),
      T(GEO.sph(), 0xfff4ea, [0, 0.55, -0.7], [0.62, 0.62, 0.62]), T(GEO.sph(), 0xe8d4c4, [-0.62, 1.0, 0.45], [0.3, 0.3, 0.3]), T(GEO.sph(), 0xe8d4c4, [0.62, 1.0, 0.45], [0.3, 0.3, 0.3]),
      ...eyePair(0.25, 1.1, 0.5, 0.26, 'glow'), ...brows(0.25, 1.38, 0.56, 0.36, 0.55), T(GEO.sph(), 0xff8aa6, [0, 0.95, 0.6], [0.15, 0.11, 0.1]), T(GEO.box(), 0xffffff, [-0.06, 0.78, 0.6], [0.11, 0.16, 0.04]), T(GEO.box(), 0xffffff, [0.06, 0.78, 0.6], [0.11, 0.16, 0.04]),
      T(GEO.tor(), 0xd63c4a, [0, 0.55, 0.0], [1.1, 1.1, 1.1], [Math.PI / 2, 0, 0]),
      T(GEO.sph(), 0xfff4ea, [-0.72, 0.5, 0.5], [0.34, 0.34, 0.34]), T(GEO.sph(), 0xfff4ea, [0.72, 0.5, 0.5], [0.34, 0.34, 0.34]),
      T(GEO.cone(), 0xfff8e8, [-0.82, 0.38, 0.75], [0.07, 0.24, 0.07], [Math.PI / 2, 0, 0]), T(GEO.cone(), 0xfff8e8, [-0.7, 0.38, 0.78], [0.07, 0.24, 0.07], [Math.PI / 2, 0, 0]), T(GEO.cone(), 0xfff8e8, [0.82, 0.38, 0.75], [0.07, 0.24, 0.07], [Math.PI / 2, 0, 0]), T(GEO.cone(), 0xfff8e8, [0.7, 0.38, 0.78], [0.07, 0.24, 0.07], [Math.PI / 2, 0, 0])];
    for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4; parts.push(T(GEO.cone(), 0xc9ccd8, [Math.sin(a) * 0.62, 0.55, Math.cos(a) * 0.62], [0.16, 0.36, 0.16], aim(Math.sin(a), 0.4, Math.cos(a)))); }
    const g = build(parts, { outline: 1.05 });
    const ear = sg => { const p = new THREE.Group(); p.add(build([T(GEO.cyl(), 0xfff4ea, [0, 0.55, 0], [0.34, 1.1, 0.24]), T(GEO.sph(), 0xfff4ea, [0, 1.1, 0], [0.34, 0.3, 0.24]), T(GEO.box(), 0xff9db8, [0, 0.55, 0.12], [0.14, 0.9, 0.05])], { center: false, outline: 1.05 })); p.position.set(sg * 0.3, 0.74, 0); return p; };
    const el = ear(-1), er = ear(1); g.add(el, er); g.userData = { el, er, hy: 0.8 }; return g; },
    anim(g, ob, t, gt){ const k = hopK(ob, gt), hop = Math.sin(k * Math.PI); g.position.y += hop * 1.5; const sq = k > 0 ? 1.1 : 1 + 0.04 * Math.sin(t * 6 + ob.v * 3); g.scale.set(1 / sq, sq, 1 / sq);
      const fl = k > 0 ? -0.5 : Math.sin(t * 5 + ob.v) * 0.12; g.userData.el.rotation.z = 0.15 - fl; g.userData.er.rotation.z = -0.15 + fl; g.rotation.z = hopWarn(ob, gt) ? Math.sin(t * 40) * 0.1 : 0; } };

  /* ================= TOPO ================= */
  MK.mole = { ground: true, make(){
    const mound = build([T(GEO.sph(), 0x8a6240, [0, 0, 0], [2.3, 1.05, 2.3]), T(GEO.sph(), 0x6d4a2c, [-0.7, 0.3, 0.3], [0.34, 0.22, 0.34]), T(GEO.sph(), 0x6d4a2c, [0.5, 0.4, -0.2], [0.4, 0.24, 0.4]), T(GEO.sph(), 0x6d4a2c, [0.8, 0.2, 0.6], [0.28, 0.2, 0.28]), T(GEO.tor(), 0x3f9d5a, [0, -0.3, 0], [2.6, 2.6, 2.6], [Math.PI / 2, 0, 0])], { center: false, outline: 1.05 });
    const mole = build([T(GEO.sph(), 0x6b4a3a, [0, 0.9, 0], [1.3, 1.45, 1.25]), T(GEO.sph(), 0xc99a85, [0, 0.72, 0.44], [0.85, 0.62, 0.58]), T(GEO.sph(), 0xff5f8c, [0, 0.74, 0.78], [0.22, 0.2, 0.2]), ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => T(GEO.cone(), 0xff8fb0, [Math.cos(i * 0.785) * 0.2, 0.74 + Math.sin(i * 0.785) * 0.2, 0.9], [0.06, 0.14, 0.06], [Math.PI / 2, 0, 0])),
      ...eyePair(0.3, 1.22, 0.5, 0.22), ...brows(0.3, 1.46, 0.58, 0.32, 0.55), T(GEO.sph(), 0xffd21f, [0, 1.66, 0], [1.35, 0.72, 1.35]), T(GEO.box(), 0x2a2a3a, [0, 1.52, 0.2], [1.45, 0.1, 1.0]), E(GEO.sph(), 0xfff6a8, [0, 1.8, 0.55], [0.34, 0.34, 0.3]),
      T(GEO.sph(), 0x6b4a3a, [-0.9, 0.7, 0.35], [0.5, 0.56, 0.45]), T(GEO.sph(), 0x6b4a3a, [0.9, 0.7, 0.35], [0.5, 0.56, 0.45]),
      ...[-1, 1].flatMap(sg => [0, 1, 2].map(i => T(GEO.cone(), 0xf4e8d8, [sg * (0.9 + i * 0.12), 1.1 - i * 0.04, 0.5], [0.15, 0.5, 0.15], [0.2, 0, -sg * (0.15 + i * 0.12)])))], { center: false, outline: 1.05 });
    const beam = trans(CONE, 0xfff0a0, 0.18, true); beam.rotation.x = -Math.PI / 2; beam.scale.set(2.4, 6, 2.4); beam.position.set(0, 1.8, 3.4); mole.add(beam);
    const g = new THREE.Group(), dirt = []; g.add(mound, mole);
    for (let i = 0; i < 7; i++){ const d = new THREE.Mesh(GEO.ico0(), new THREE.MeshBasicMaterial({ color: 0x7a5232 })); d.scale.setScalar(0.22 + 0.08 * (i % 3)); g.add(d); dirt.push(d); }
    g.userData = { mole, mound, dirt, beam, hy: 0.5 }; return g; },
    anim(g, ob, t, gt, cx){ const pop = clamp((18 - cx.z) / 5, 0, 1), u = g.userData; u.mole.visible = pop > 0.03; u.mole.position.y = -1.7 + pop * 1.8 + Math.sin(t * 9) * 0.04 * pop; u.mound.scale.y = 1 - pop * 0.35; u.beam.visible = pop > 0.4;
      u.dirt.forEach((d, i) => { const k = (t * 1.3 + i / 7) % 1, a = i * 1.1; d.visible = pop > 0.15 && pop < 0.999 || (pop >= 0.999 && k < 0.5); d.position.set(Math.cos(a) * (0.6 + k * 1.3), 0.4 + Math.sin(k * Math.PI) * 1.8 * pop, Math.sin(a) * (0.6 + k * 1.3)); d.rotation.set(t * 4 + i, t * 3, 0); }); } };

  /* ================= VALLA ELÉCTRICA ================= */
  MK.gate = { make(){
    const g = new THREE.Group();
    const pylon = () => { const parts = [T(GEO.cyl(), 0x7d89d4, [0, 0, 0], [0.8, 2.3, 0.8]), T(GEO.box(), 0xffdd33, [0, -0.7, 0], [0.88, 0.22, 0.88]), T(GEO.box(), 0x14162e, [0, -0.7, 0], [0.9, 0.08, 0.9]), T(GEO.box(), 0xffdd33, [0, -0.2, 0], [0.88, 0.22, 0.88]), T(GEO.box(), 0x14162e, [0, -0.2, 0], [0.9, 0.08, 0.9]), T(GEO.box(), 0xffdd33, [0, 0.3, 0], [0.88, 0.22, 0.88]), T(GEO.box(), 0x14162e, [0, 0.3, 0], [0.9, 0.08, 0.9]), T(GEO.sph(), 0xc8cdf5, [0, 1.25, 0], [0.7, 0.7, 0.7]), T(GEO.cyl(), 0x4a5290, [0, -1.2, 0], [1.2, 0.2, 1.2]), T(GEO.tor(), 0xffe055, [0, 1.25, 0], [0.9, 0.9, 0.9], [Math.PI / 2, 0, 0])]; return build(parts, { center: false, outline: 1.07 }); };
    const a = pylon(), b = pylon(); a.position.y = 1.15; b.position.y = 1.15; g.add(a, b);
    const orbA = mesh(GEO.sph(), 0xffee66); orbA.scale.setScalar(0.52); const orbB = orbA.clone(); orbA.position.y = 2.45; orbB.position.y = 2.45; g.add(orbA, orbB);
    const gA = glowSprite(0xffe055, 3.2, 0.5), gB = glowSprite(0xffe055, 3.2, 0.5); gA.position.y = gB.position.y = 2.45; g.add(gA, gB);
    const mkBeam = y => { const be = mesh(GEO.cyl(), 0xfff6a8, 0.9); be.rotation.z = Math.PI / 2; be.position.y = y; const ha = mesh(GEO.cyl(), 0xffd93a, 0.28, true); ha.rotation.z = Math.PI / 2; ha.position.y = y; g.add(be, ha); return [be, ha]; };
    const b1 = mkBeam(1.55), b2 = mkBeam(0.85);
    const mkLine = () => { const ln = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(18 * 3), 3)), new THREE.LineBasicMaterial({ color: 0xffffff })); ln.frustumCulled = false; g.add(ln); return ln; };
    const ln1 = mkLine(), ln2 = mkLine();
    const beacon = glowSprite(0xff4a3a, 2.4, 0.9); beacon.position.set(0, 3.1, 0); g.add(beacon);
    g.userData = { a, b, orbA, orbB, gA, gB, b1, b2, ln1, ln2, beacon, hy: 0 }; return g; },
    anim(g, ob, t, gt){ const u = g.userData, xl = wxOf(ob.ga - 0.5), xr = wxOf(ob.gb + 0.5), on = gateOn(ob, gt), fl = gateFlicker(ob, gt), len = xr - xl;
      u.a.position.x = xl; u.b.position.x = xr; u.orbA.position.x = u.gA.position.x = xl; u.orbB.position.x = u.gB.position.x = xr; u.beacon.position.x = (xl + xr) / 2;
      const live = on || (fl && Math.sin(t * 50) > 0), col = on ? 0xffee66 : fl ? 0xff9a3a : 0x6a7aa8;
      for (const o of [u.orbA, u.orbB]) o.material.color.setHex(col); for (const o of [u.gA, u.gB]){ o.material.color.setHex(col); o.material.opacity = on ? 0.55 : 0.25; }
      u.beacon.material.opacity = on ? 0.2 : 0.4 + 0.5 * Math.abs(Math.sin(t * 8)); u.beacon.material.color.setHex(on ? 0xffe055 : 0x55ff88);
      for (const [pair, ln, y] of [[u.b1, u.ln1, 1.55], [u.b2, u.ln2, 0.85]]){ pair[0].visible = pair[1].visible = ln.visible = live;
        if (live){ pair[0].scale.set(0.12 + 0.05 * Math.sin(t * 60 + y), len, 0.12); pair[0].position.x = (xl + xr) / 2; pair[1].scale.set(0.6, len, 0.6); pair[1].position.x = (xl + xr) / 2;
          const pos = ln.geometry.attributes.position; for (let i = 0; i < 18; i++){ const k = i / 17; pos.setXYZ(i, lerp(xl, xr, k), y + (i === 0 || i === 17 ? 0 : Math.sin(i * 7.7 + Math.floor(t * 30) * 3.1 + y * 5) * 0.32), 0.1); } pos.needsUpdate = true; } } } };
}
