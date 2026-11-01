/* 05g · ESTILOS DE MODELOS 3D (rehechos desde cero)
   A · "Peluche": formas gorditas y suaves, colores caramelo, contorno de tinta grueso, sombreado suave.
   B · "Papercraft low-poly": facetas planas, colores vivos y limpios, sin contorno, sombreado duro.
   Cada estilo cambia las geometrías base (suaves o facetadas), la paleta, el sombreado y rehace los modelos principales. */
'use strict';
const STYLE = { id: 'A', base: null, col: null };

function setModelStyle(id, first){
  const A = id === 'A';
  if (!STYLE.base) STYLE.base = { GEO: Object.assign({}, GEO), plane: buildPlaneModel, fig: typeof buildFigure === 'function' ? buildFigure : null };
  for (const k in STYLE.base.GEO) GEO[k] = STYLE.base.GEO[k];
  STYLE.id = id; window.__postOff = !A;
  const K = 'st' + id, LPK = k => gcache(K + k, null);
  const flat = g => { g.userData.flat = true; return g; };
  const hexg = (r, h, s) => flat(new THREE.CylinderGeometry(r, r, h, s));
  if (A){
    GEO.rbox = () => gcache('A_rbox', () => roundedBox(0.3, 6)); GEO.rboxS = GEO.rbox;
    GEO.sph = () => gcache('A_sph', () => smoothG(new THREE.SphereGeometry(0.5, 24, 16)));
    STYLE.col = c => { const h = {}; c.getHSL(h); c.setHSL(h.h, Math.min(1, h.s * 0.95 + 0.04), Math.min(0.93, h.l * 0.86 + 0.14)); };
    LT.grad.image.data.set([135, 188, 240, 255]); MAT.outl.color.set(0x2a1840); MAT.outl.visible = true;
  } else {
    GEO.sph = () => gcache('B_sph', () => flat(new THREE.IcosahedronGeometry(0.5, 1)));
    GEO.sphL = () => gcache('B_sphL', () => flat(new THREE.IcosahedronGeometry(0.5, 0)));
    GEO.ico = GEO.sph; GEO.ico0 = GEO.sphL; GEO.dod = GEO.sphL;
    GEO.cyl = () => gcache('B_cyl', () => hexg(0.5, 1, 7));
    GEO.cone = () => gcache('B_cone', () => flat(new THREE.ConeGeometry(0.5, 1, 6)));
    GEO.rbox = () => gcache('B_rbox', () => flat(new THREE.BoxGeometry(1, 1, 1))); GEO.rboxS = GEO.rbox; GEO.box = GEO.rbox;
    GEO.tor = () => gcache('B_tor', () => flat(new THREE.TorusGeometry(0.5, 0.12, 5, 9)));
    GEO.circ = () => gcache('B_circ', () => new THREE.CircleGeometry(0.5, 9));
    STYLE.col = c => { const h = {}; c.getHSL(h); c.setHSL(h.h, Math.min(1, h.s * 1.18 + 0.05), Math.min(0.9, Math.max(0.08, h.l * 0.96 + 0.02))); };
    LT.grad.image.data.set([80, 80, 235, 235]); MAT.outl.visible = false;
  }
  LT.grad.needsUpdate = true;
  _bc.clear();   // la caché de geometrías fusionadas depende de las geometrías base
  if (first){ buildPools(); } else { initModels(); initModelsPlus(); }
  initBossModels();
  styleModels(A); styleBosses(A);
  buildPlaneModel = A ? planeA : planeB;
  if (typeof buildFigure === 'function') buildFigure = STYLE.base.fig;   // la figura de las cinemáticas usa las geometrías ya cambiadas
}

/* ---- modelos nuevos ---- */
function styleModels(A){
  const V = (a, b) => A ? a : b, o = V(1.07, 0);
  const T = (g, c, p, s, r, e) => pt(g, c, p, s, r, { e: !!e });
  const tr = (geo, color, op, add) => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide }));
  const eye = (x, y, z, r, look) => [T(GEO.sph(), 0xffffff, [-x, y, z], [r, r * 1.12, r * 0.7]), T(GEO.sph(), 0xffffff, [x, y, z], [r, r * 1.12, r * 0.7]),
    T(V(GEO.sph(), GEO.box()), 0x1d1830, [-x + (look || 0), y - r * 0.05, z + r * 0.42], [r * 0.6, r * 0.7, r * 0.4]), T(V(GEO.sph(), GEO.box()), 0x1d1830, [x + (look || 0), y - r * 0.05, z + r * 0.42], [r * 0.6, r * 0.7, r * 0.4]),
    T(GEO.sphL(), 0xffffff, [-x - r * 0.18, y + r * 0.25, z + r * 0.62], [r * 0.24, r * 0.24, r * 0.16], [0, 0, 0], true), T(GEO.sphL(), 0xffffff, [x - r * 0.18, y + r * 0.25, z + r * 0.62], [r * 0.24, r * 0.24, r * 0.16], [0, 0, 0], true)];
  const brow = (x, y, z, w, a, c) => [T(GEO.box(), c || 0x1d1830, [-x, y, z], [w, w * 0.26, w * 0.26], [0, 0, -a]), T(GEO.box(), c || 0x1d1830, [x, y, z], [w, w * 0.26, w * 0.26], [0, 0, a])];
  const disc = (r, y, z, c) => T(GEO.cyl(), c, [0, y, z], [r * 2, 0.26, r * 2], [Math.PI / 2, 0, 0]);
  const G = (k, f) => gcache(K_ + k, f), K_ = 'sty' + (A ? 'A' : 'B');
  const gl = (c, s, op) => glowSprite(c, s, op);

  /* ---------- ABEJA: un círculo perfecto, con cara ---------- */
  MK.bee = { make(){
    const Y = V(0xffd84a, 0xffc61a), BR = V(0x7a4a3a, 0x3a2a24), R = 1.5;
    const p = [T(GEO.sph(), Y, [0, 0, 0], [R * 2, R * 2, R * 2]), disc(1.5 * 1.012, 0, -0.4, BR), disc(Math.sqrt(R * R - 1.0) * 1.03, 0, -1.0, BR),
      T(GEO.sph(), V(0xfff1c2, 0xffe9a0), [0, -0.5, 1.0], [1.9, 1.3, 1.0]), ...eye(0.56, 0.28, 1.2, 0.5), ...brow(0.56, 0.86, 1.28, 0.55, 0.5, BR),
      T(GEO.sph(), V(0xff9fb8, 0xff7a93), [-1.0, -0.15, 1.05], [0.46, 0.32, 0.22]), T(GEO.sph(), V(0xff9fb8, 0xff7a93), [1.0, -0.15, 1.05], [0.46, 0.32, 0.22]), T(GEO.box(), 0x8a2f3f, [0, -0.28, 1.46], [0.42, 0.12, 0.06]),
      T(GEO.cyl(), BR, [-0.5, 1.7, 0.1], [0.1, 0.9, 0.1], [0.28, 0, 0.5]), T(GEO.cyl(), BR, [0.5, 1.7, 0.1], [0.1, 0.9, 0.1], [0.28, 0, -0.5]), T(GEO.sph(), V(0xff7aa0, 0xff4f7a), [-0.82, 2.15, 0.25], [0.34, 0.34, 0.34]), T(GEO.sph(), V(0xff7aa0, 0xff4f7a), [0.82, 2.15, 0.25], [0.34, 0.34, 0.34]),
      T(GEO.cone(), BR, [0, -0.1, -1.75], [0.5, 0.8, 0.5], [-Math.PI / 2, 0, 0])];
    const g = build(p, { outline: o }), wg = G('beew', () => V(smoothG(new THREE.SphereGeometry(0.5, 18, 10)), flat2(new THREE.IcosahedronGeometry(0.5, 1))));
    const wing = (sx, big) => { const q = new THREE.Group(), m = tr(wg, big ? 0xcfeaff : 0xffd2ec, 0.85); m.scale.set(big ? 2.1 : 1.4, 0.07, big ? 1.4 : 0.95); m.position.x = sx * (big ? 1.05 : 0.7); q.add(m); q.position.set(sx * 0.7, 1.15, big ? 0.05 : -0.55); return q; };
    const W = [wing(-1, true), wing(1, true), wing(-1, false), wing(1, false)]; W.forEach(w => g.add(w)); g.userData.W = W; g.userData.hy = 1.5; g.add(gl(0xffd860, 5, 0.28)); return g; },
    anim(g, ob, t){ const f = Math.sin(t * 38 + ob.v * 9) * 0.55, W = g.userData.W; W[0].rotation.z = 0.3 + f; W[1].rotation.z = -0.3 - f; W[2].rotation.z = 0.18 + f * 0.8; W[3].rotation.z = -0.18 - f * 0.8; g.rotation.z = Math.sin(t * 5 + ob.v * 7) * 0.08; g.position.y += Math.sin(t * 6 + ob.v * 3) * 0.1; } };

  /* ---------- COMETA ---------- */
  MK.comet = { make(){
    const O = V(0xff9b4a, 0xff7a1f), core = build([T(GEO.sph(), O, [0, 0, 0], [2.3, 2.3, 2.3]), T(GEO.sph(), V(0xffd08a, 0xffc24a), [-0.5, 0.6, 0.55], [1.0, 0.8, 0.6]), ...eye(0.42, 0.18, 0.95, 0.46), ...brow(0.42, 0.62, 1.0, 0.55, 0.5, 0x5a1a10), T(GEO.box(), 0x5a1a10, [0, -0.5, 1.02], [0.7, 0.22, 0.06])], { center: false, outline: o });
    const crown = new THREE.Group(); for (let i = 0; i < 9; i++){ const a = i / 9 * Math.PI * 2; crown.add(build([T(GEO.cone(), V(0xffc83a, 0xffdc3a), [Math.cos(a) * 1.4, Math.sin(a) * 1.4, -0.2], [0.5, 1.0, 0.5], [0, 0, a - Math.PI / 2], true)], { center: false, outline: 0 })); }
    const tail = build([T(GEO.cone(), 0xff6a1a, [0, 0, -2.8], [1.9, 4.8, 1.9], [-Math.PI / 2, 0, 0], true), T(GEO.cone(), 0xffb02a, [0, 0, -2.4], [1.2, 3.6, 1.2], [-Math.PI / 2, 0, 0], true), T(GEO.cone(), 0xfff2b0, [0, 0, -1.9], [0.6, 2.4, 0.6], [-Math.PI / 2, 0, 0], true)], { center: false, outline: 0 });
    const g = new THREE.Group(); g.add(core, crown, tail, gl(0xff7a20, 8, 0.5)); const em = []; for (let i = 0; i < 5; i++){ const s = gl(i % 2 ? 0xffc040 : 0xff6a20, 1.3, 0.8); g.add(s); em.push(s); } g.userData = { core, crown, tail, embers: em, hy: 0 }; return g; },
    anim(g, ob, t){ const u = g.userData, f = Math.sin(t * 20 + ob.v * 4); u.tail.scale.set(1 + 0.1 * f, 1 + 0.1 * f, 1 + 0.18 * Math.sin(t * 26)); u.crown.rotation.z = t * 2.6; u.embers.forEach((s, i) => { const k = (t * 1.6 + i / 5) % 1; s.position.set(Math.sin(i * 7 + t * 4) * 0.9 * (1 - k), Math.cos(i * 5) * 0.8, -1.8 - k * 4.6); s.material.opacity = 0.9 * (1 - k); s.scale.setScalar(1.6 * (1 - k * 0.7)); }); } };

  /* ---------- MURCIÉLAGO ---------- */
  const wingShape = k => G('batw' + k, () => { const P = A ? [[0, 0.3], [0.6, 0.85], [1.4, 0.7], [1.75, 0.15], [1.45, -0.1], [1.3, -0.5], [0.9, -0.2], [0.6, -0.55], [0.2, -0.2], [0, -0.25]] : [[0, 0.3], [1.0, 0.9], [1.9, 0.3], [1.5, 0.05], [1.3, -0.55], [0.8, -0.15], [0.4, -0.5], [0, -0.2]]; const sh = new THREE.Shape(); P.forEach((q, i) => i ? sh.lineTo(q[0] * k, q[1]) : sh.moveTo(q[0] * k, q[1])); sh.closePath(); const ge = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false }); ge.translate(0, 0, -0.05); return ge; });
  MK.bat = { make(){
    const Pu = V(0x7b55d6, 0x6a3fc8), body = [T(GEO.sph(), Pu, [0, 0, 0], [1.5, 1.6, 1.4]), T(GEO.sph(), V(0xd4c0ff, 0xc9a8ff), [0, -0.25, 0.4], [0.9, 0.8, 0.6]), T(GEO.cone(), Pu, [-0.45, 0.95, 0], [0.55, 0.95, 0.4], [0, 0, 0.2]), T(GEO.cone(), Pu, [0.45, 0.95, 0], [0.55, 0.95, 0.4], [0, 0, -0.2]), T(GEO.cone(), 0xff9ac8, [-0.45, 0.85, 0.12], [0.3, 0.6, 0.2], [0, 0, 0.2]), T(GEO.cone(), 0xff9ac8, [0.45, 0.85, 0.12], [0.3, 0.6, 0.2], [0, 0, -0.2]),
      ...eye(0.32, 0.2, 0.62, 0.34), ...brow(0.32, 0.55, 0.7, 0.42, 0.5), T(GEO.cone(), 0xffffff, [-0.14, -0.3, 0.66], [0.1, 0.3, 0.1], [Math.PI, 0, 0]), T(GEO.cone(), 0xffffff, [0.14, -0.3, 0.66], [0.1, 0.3, 0.1], [Math.PI, 0, 0])];
    const g = build(body, { outline: o }), mk = k => { const q = new THREE.Group(); q.add(new THREE.Mesh(wingShape(k), new THREE.MeshToonMaterial({ color: V(0xa98aee, 0x9a6ae6), gradientMap: LT.grad, side: THREE.DoubleSide }))); q.position.set(k * 0.5, 0.05, 0); return q; };
    const pl = mk(-1), pr = mk(1); g.add(pl, pr); g.userData.pl = pl; g.userData.pr = pr; g.userData.hy = 1.0; g.add(gl(0xaa55ff, 4, 0.22)); return g; },
    anim(g, ob, t, gt){ const f = Math.sin(t * 15 + ob.v * 8) * 0.55; g.userData.pl.rotation.z = -f; g.userData.pr.rotation.z = f; const k = hopK(ob, gt); g.position.y += Math.sin(k * Math.PI) * 0.9; g.rotation.z = hopWarn(ob, gt) ? Math.sin(t * 40) * 0.14 : 0; } };

  /* ---------- DRON ---------- */
  MK.drone = { make(){
    const Tl = V(0x6fe0cf, 0x2fc9b4), p = [T(GEO.sph(), Tl, [0, 0, 0], [2.0, 1.8, 2.0]), T(GEO.sph(), V(0xffffff, 0xf4fffb), [0, 0.05, 0.7], [1.4, 1.4, 0.7]), T(GEO.cyl(), 0x2a3566, [-1.3, -0.1, 0], [0.45, 0.8, 0.45]), T(GEO.cyl(), 0x2a3566, [1.3, -0.1, 0], [0.45, 0.8, 0.45]),
      T(GEO.cone(), 0x78e6ff, [-1.3, -0.85, 0], [0.4, 0.6, 0.4], [Math.PI, 0, 0], true), T(GEO.cone(), 0x78e6ff, [1.3, -0.85, 0], [0.4, 0.6, 0.4], [Math.PI, 0, 0], true), T(GEO.cyl(), 0x2a3566, [0, 1.15, 0], [0.16, 0.5, 0.16]), T(GEO.sph(), 0xff4a4a, [0.8, 0.8, 0.3], [0.22, 0.22, 0.22], [0, 0, 0], true)];
    const g = build(p, { outline: o }), eye = new THREE.Group(), iris = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0xff6a2d })); iris.scale.set(0.9, 0.9, 0.4); const pup = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0x1d1830 })); pup.scale.set(0.42, 0.42, 0.3); pup.position.z = 0.12; eye.add(iris, pup); eye.position.set(0, 0.05, 1.0); g.add(eye);
    const rotor = build([T(GEO.box(), 0x2a3566, [0, 0, 0], [3.0, 0.08, 0.3]), T(GEO.box(), 0x2a3566, [0, 0, 0], [0.3, 0.08, 3.0])], { center: false, outline: 0 }); rotor.position.y = 1.5; g.add(rotor);
    const beam = tr(GEO.cone(), 0x60ffd0, 0.14, true); beam.rotation.x = -Math.PI / 2; beam.scale.set(2.8, 7, 2.8); beam.position.set(0, 0.05, 4.4); g.add(beam);
    g.userData = { eye, iris, rotor, beam, hy: 1.2 }; g.add(gl(0x60ffd0, 4, 0.22)); return g; },
    anim(g, ob, t, gt, cx){ const u = g.userData; u.rotor.rotation.y = t * 38; u.eye.position.x = clamp(cx.look, -1, 1) * 0.25; u.iris.material.color.setHex(ob.locked ? 0xff2d2d : 0xff6a2d); u.beam.material.color.setHex(ob.locked ? 0xff3030 : 0x60ffd0); u.beam.material.opacity = (ob.locked ? 0.26 : 0.13) + 0.05 * Math.sin(t * 8); g.position.y += Math.sin(t * 3 + ob.v * 6) * 0.1; g.rotation.z = Math.sin(t * 2 + ob.v * 4) * 0.06; } };

  /* ---------- BABA ---------- */
  MK.slime = { ground: true, make(){
    const Pk = V(0xc78bff, 0xb35cf0), inner = build([T(GEO.sph(), Pk, [0, 0, 0], [2.3, 1.9, 2.3]), T(GEO.sph(), V(0xe9c8ff, 0xd9a0ff), [-0.5, 0.35, 0.5], [0.8, 0.5, 0.5])], { center: false, outline: o });
    const shell = tr(GEO.sph(), V(0xdcb0ff, 0xcf9aff), 0.5); shell.scale.set(2.6, 2.2, 2.6);
    const face = build([...eye(0.5, 0.15, 1.0, 0.5), ...brow(0.5, 0.65, 1.1, 0.6, 0.5), T(GEO.box(), 0x4a1a66, [0, -0.35, 1.18], [0.8, 0.28, 0.08]), T(GEO.box(), 0xffffff, [-0.22, -0.26, 1.24], [0.16, 0.14, 0.04]), T(GEO.box(), 0xffffff, [0.22, -0.26, 1.24], [0.16, 0.14, 0.04])], { center: false, outline: 0 });
    const g = new THREE.Group(), bub = []; g.add(inner, shell, face); for (let i = 0; i < 5; i++){ const b = tr(GEO.sphL(), 0xffffff, 0.7); b.scale.setScalar(0.2); g.add(b); bub.push(b); } g.add(gl(0xc060ff, 5, 0.2)); g.userData = { inner, shell, face, bub, hy: 1.1 }; return g; },
    anim(g, ob, t){ const b = Math.sin(t * 6 + ob.v * 8), sq = 1 + 0.14 * b, u = g.userData; g.scale.set(1 / sq, sq, 1 / sq); g.position.y += Math.max(0, b) * 0.4; u.bub.forEach((m, i) => { const k = (t * 0.7 + i * 0.2 + ob.v) % 1; m.position.set(Math.sin(i * 2.1 + t) * 0.8, -0.6 + k * 1.7, Math.cos(i * 1.7) * 0.7); m.material.opacity = 0.75 * (1 - k); }); } };

  /* ---------- BOLA RODANTE ---------- */
  MK.boulder = { ground: true, make(){
    const rock = build([T(GEO.sph(), V(0xc8a070, 0xb8905a), [0, 0, 0], [2.6, 2.6, 2.6]), T(GEO.sph(), V(0xa88050, 0x9a7444), [0.6, 0.6, 0.6], [0.7, 0.7, 0.7]), T(GEO.sph(), V(0xa88050, 0x9a7444), [-0.8, -0.4, 0.8], [0.6, 0.6, 0.6]), T(GEO.sph(), V(0x6fbf5a, 0x5aa044), [-0.6, 1.2, 0.2], [1.0, 0.4, 1.0]), ...[0, 1, 2, 3, 4, 5].map(i => T(GEO.sph(), 0xf0e8d8, [Math.cos(i * 1.05) * 1.35, Math.sin(i * 1.05) * 1.35, 0], [0.48, 0.48, 0.48]))], { center: false, outline: o });
    const face = build([...eye(0.52, 0.1, 1.15, 0.55), ...brow(0.56, 0.68, 1.25, 0.8, 0.5, 0x4a2a14), T(GEO.box(), 0x3a1a0c, [0, -0.62, 1.2], [1.1, 0.46, 0.1]), ...[-0.3, 0, 0.3].map(x => T(GEO.box(), 0xffffff, [x, -0.46, 1.26], [0.2, 0.2, 0.05]))], { center: false, outline: 0 });
    const g = new THREE.Group(), dust = []; g.add(rock, face); for (let i = 0; i < 6; i++){ const d = gl(0xd8c098, 2.4, 0.4); d.material.blending = THREE.NormalBlending; g.add(d); dust.push(d); } g.userData = { rock, dust, hy: 1.3 }; return g; },
    anim(g, ob, t){ g.userData.rock.rotation.x = -t * 7 + ob.v * 6; g.position.y += Math.abs(Math.sin(t * 7 + ob.v)) * 0.12; g.userData.dust.forEach((d, i) => { const k = (t * 2.2 + i / 6) % 1; d.position.set((i - 2.5) * 0.5, -1.1 + k * 1.0, -1.6 - k * 3.2); d.material.opacity = 0.42 * (1 - k); d.scale.setScalar(1.3 + k * 2.4); }); } };

  /* ---------- CONEJO ---------- */
  MK.bunny = { ground: true, make(){
    const W = V(0xfffaf4, 0xf4f0ea), p = [T(GEO.sph(), W, [0, 0.95, 0], [1.9, 1.9, 1.7]), T(GEO.sph(), W, [0, 0.45, -0.85], [0.8, 0.8, 0.8]), T(GEO.sph(), V(0xffe0ea, 0xffd0e0), [0, 0.7, 0.5], [1.2, 1.1, 0.8]),
      T(GEO.sph(), W, [-0.5, 0.15, 0.4], [0.7, 0.4, 0.9]), T(GEO.sph(), W, [0.5, 0.15, 0.4], [0.7, 0.4, 0.9]), ...eye(0.38, 1.25, 0.78, 0.4), ...brow(0.38, 1.65, 0.86, 0.46, 0.5), T(GEO.sph(), 0xff7a9a, [0, 1.0, 0.92], [0.2, 0.15, 0.14]), T(GEO.box(), 0xffffff, [-0.08, 0.8, 0.92], [0.14, 0.2, 0.05]), T(GEO.box(), 0xffffff, [0.08, 0.8, 0.92], [0.14, 0.2, 0.05]),
      T(GEO.tor(), V(0xff6a8a, 0xe8344a), [0, 0.5, 0.05], [1.5, 1.5, 1.5], [Math.PI / 2, 0, 0])];
    for (let i = 0; i < 7; i++){ const a = i * 0.9; p.push(T(GEO.cone(), 0xd8dae6, [Math.sin(a) * 0.82, 0.5, Math.cos(a) * 0.82], [0.2, 0.42, 0.2], aim(Math.sin(a), 0.4, Math.cos(a)))); }
    const g = build(p, { outline: o }), ear = sx => { const q = new THREE.Group(); q.add(build([T(GEO.sph(), W, [0, 0.8, 0], [0.62, 1.8, 0.5]), T(GEO.sph(), 0xff9fb8, [0, 0.8, 0.13], [0.32, 1.4, 0.3])], { center: false, outline: o })); q.position.set(sx * 0.42, 1.65, 0); return q; };
    const el = ear(-1), er = ear(1); g.add(el, er); g.userData = { el, er, hy: 0.85 }; return g; },
    anim(g, ob, t, gt){ const k = hopK(ob, gt), hop = Math.sin(k * Math.PI); g.position.y += hop * 1.5; const sq = k > 0 ? 1.1 : 1 + 0.04 * Math.sin(t * 6 + ob.v * 3); g.scale.set(1 / sq, sq, 1 / sq); const fl = k > 0 ? -0.5 : Math.sin(t * 5 + ob.v) * 0.12; g.userData.el.rotation.z = 0.15 - fl; g.userData.er.rotation.z = -0.15 + fl; g.rotation.z = hopWarn(ob, gt) ? Math.sin(t * 40) * 0.1 : 0; } };

  /* ---------- BLOQUES ---------- */
  MK.crystal = { make(){
    const g = build(A ? [T(GEO.sph(), 0x7fd8ff, [0, 0.3, 0], [1.8, 2.8, 1.8]), T(GEO.sph(), 0xc2f0ff, [-0.4, 1.0, 0.5], [0.6, 1.0, 0.5]), T(GEO.sph(), 0x58b6f4, [-0.95, -0.2, 0.1], [1.1, 1.7, 1.1], [0, 0, 0.4]), T(GEO.sph(), 0x58b6f4, [0.95, -0.15, -0.1], [1.0, 1.6, 1.0], [0, 0, -0.4])]
      : [T(GEO.cone(), 0x6fd8ff, [0, 1.0, 0], [1.9, 2.0, 1.9]), T(GEO.cone(), 0x3aa8f0, [0, -0.6, 0], [1.9, 1.4, 1.9], [Math.PI, 0, 0]), T(GEO.cone(), 0x9fe8ff, [-1.0, 0.2, 0.2], [1.0, 1.7, 1.0], [0, 0, 0.45]), T(GEO.cone(), 0x4fb8f8, [1.0, 0.1, -0.1], [0.9, 1.5, 0.9], [0, 0, -0.45])], { outline: o });
    g.add(gl(0x6fe0ff, 4.4, 0.35)); return g; },
    anim(g, ob, t){ g.rotation.y = Math.sin(t * 0.8 + ob.v * 6) * 0.25; g.children[g.children.length - 1].material.opacity = 0.28 + 0.12 * Math.sin(t * 3 + ob.v * 9); } };
  MK.thunderbox = { make(){
    const bolt = G('bolt', () => { const sh = new THREE.Shape(); [[0.12, 0.5], [-0.3, -0.02], [-0.02, -0.02], [-0.14, -0.5], [0.3, 0.06], [0.02, 0.06]].forEach((q, i) => i ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1])); const ge = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }); ge.translate(0, 0, -0.06); return ge; });
    const g = build([T(GEO.rbox(), V(0x6a5fd0, 0x5a4fc0), [0, 0, 0], [2.1, 2.1, 2.1]), T(GEO.rbox(), V(0xa89cf4, 0x8d82e6), [0, 0.95, 0], [1.9, 0.4, 1.9]), pt(bolt, 0xffe94d, [0, 0, 1.08], [1.4, 1.4, 1], [0, 0, 0], { e: true }), pt(bolt, 0xffe94d, [0, 0, -1.08], [1.4, 1.4, 1], [0, Math.PI, 0], { e: true })], { outline: o });
    g.add(gl(0xffe055, 5, 0.4)); return g; },
    anim(g, ob, t){ g.children[g.children.length - 1].material.opacity = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 6 + ob.v * 9)); } };
  MK.crate = { ground: true, make(){
    const W = V(0xf0b45e, 0xe3a24d), D = V(0xc8803a, 0xb87430), p = [T(GEO.rbox(), W, [0, 0, 0], [2.1, 2.1, 2.1])];
    for (const y of [-0.5, 0.5]) p.push(T(GEO.rbox(), D, [0, y, 0], [2.18, 0.3, 2.18])); for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.push(T(GEO.rbox(), D, [sx * 0.95, 0, sz * 0.95], [0.36, 2.16, 0.36]));
    for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) p.push(T(GEO.box(), i % 2 ? 0xffffff : 0xff5a62, [-0.78 + i * 0.31, 0.92, sz * 1.0], [0.3, 0.3, 0.12]));
    p.push(T(GEO.sph(), 0xffdd33, [0, -0.1, 1.08], [0.7, 0.7, 0.16]), T(GEO.box(), 0x1d1830, [0, -0.04, 1.16], [0.12, 0.34, 0.05]), T(GEO.sphL(), 0x1d1830, [0, -0.3, 1.16], [0.12, 0.12, 0.05])); return build(p, { outline: o }); } };
  MK.spikerock = { ground: true, make(){
    const p = [T(GEO.sph(), V(0x9aa0cc, 0x8a90bc), [0, 0, 0], [2.3, 2.0, 2.3]), T(GEO.sph(), V(0xbcc2e8, 0xaab0d8), [-0.5, 0.5, 0.5], [1.0, 0.6, 0.7])];
    [[0, 1, 0.1], [0.75, 0.75, 0.3], [-0.75, 0.75, 0.3], [0.55, 0.6, -0.6], [-0.55, 0.6, -0.6], [0.25, 0.4, 0.9], [-0.3, 0.4, 0.9]].forEach(d => { const n = new THREE.Vector3(d[0], d[1], d[2]).normalize(); p.push(T(GEO.cone(), 0xf8faff, [n.x * 1.15, n.y * 1.0, n.z * 1.15], [0.55, 1.0, 0.55], aim(n.x, n.y, n.z)), T(GEO.sphL(), 0xff6a6a, [n.x * 1.55, n.y * 1.4, n.z * 1.55], [0.26, 0.26, 0.26])); });
    return build(p, { outline: o }); } };

  /* ---------- BELLOTAS ---------- */
  const acorn = gold => () => { const nutG = G('nut' + gold, () => { const pts = []; for (let i = 0; i <= 12; i++){ const a = i / 12 * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * 0.42 * (a > 1.6 ? 0.9 : 1), -Math.cos(a) * 0.5 - 0.02)); } return smoothG(new THREE.LatheGeometry(pts, A ? 20 : 7)); });
    const nut = new THREE.Mesh(nutG, new THREE.MeshToonMaterial({ color: gold ? 0xffd23f : V(0xd89a55, 0xc98a4b), gradientMap: LT.grad })); if (!A) nutG.userData.flat = true;
    const cap = build([T(GEO.sph(), gold ? 0xe9a800 : V(0x8a5a38, 0x7a4a2a), [0, 0.3, 0], [1.0, 0.62, 1.0]), T(GEO.cyl(), gold ? 0xe9a800 : 0x6a3c1c, [0, 0.66, 0], [0.12, 0.26, 0.12])], { center: false, outline: o });
    const g = new THREE.Group(); g.add(nut, cap); const k = gold ? 1.55 : 1.15; g.scale.setScalar(k); if (gold) g.add(gl(0xffe055, 2.8, 0.6)); g.userData.hy = 0; g.userData.k = k; return g; };
  MK.acorn = { make: acorn(false), anim(g, ob, t){ g.rotation.y = t * 2.5 + ob.P; g.position.y += Math.sin(t * 4 + ob.P) * 0.12; } };
  MK.gold = { make: acorn(true), anim(g, ob, t){ g.rotation.y = t * 2.5 + ob.P; g.position.y += Math.sin(t * 4 + ob.P) * 0.12; g.children[2].material.opacity = 0.45 + 0.2 * Math.sin(t * 6); } };

  /* ---------- DECORADO ---------- */
  const leaf = () => { const c = THEME.leaf && THEME.leaf[0] === '#' ? hexN(THEME.leaf) : 0x3f9d5a, m = k => { const r = (c >> 16) & 255, g_ = (c >> 8) & 255, b = c & 255, f = x => Math.max(0, Math.min(255, x + k)); return (f(r) << 16) | (f(g_) << 8) | f(b); }; return [m(-18), m(8), m(36)]; };
  MK.stree = { ground: true, make(){ const c = leaf(); return build(A ? [T(GEO.cyl(), 0x8a5a3a, [0, 1.0, 0], [0.62, 2.0, 0.62]), T(GEO.sph(), c[0], [0, 3.4, 0], [3.6, 3.2, 3.6]), T(GEO.sph(), c[1], [-0.5, 4.4, 0.3], [2.8, 2.5, 2.8]), T(GEO.sph(), c[2], [0.4, 5.3, 0], [1.9, 1.7, 1.9])]
      : [T(GEO.cyl(), 0x7a5235, [0, 0.9, 0], [0.6, 1.8, 0.6]), T(GEO.cone(), c[0], [0, 3.0, 0], [3.8, 2.8, 3.8]), T(GEO.cone(), c[1], [0, 4.5, 0], [3.0, 2.6, 3.0]), T(GEO.cone(), c[2], [0, 6.0, 0], [2.0, 2.4, 2.0])], { outline: V(1.045, 0) }); } };
  MK.srock = { ground: true, make(){ return build([T(GEO.sph(), V(0xaab2c8, 0x9aa3b5), [0, 0.3, 0], [2.6, 1.8, 2.3]), T(GEO.sph(), V(0xc8d0e0, 0xb9c1d1), [-0.5, 0.7, 0.3], [1.1, 0.8, 1.0])], { outline: V(1.06, 0) }); } };
  MK.puff = { make(){ const W = V(0xffffff, 0xffffff), S = V(0xdce6fb, 0xd2def4); return build([T(GEO.sph(), W, [0, 0, 0], [3.2, 2.4, 2.8]), T(GEO.sph(), W, [-1.7, -0.2, 0.2], [2.4, 1.9, 2.2]), T(GEO.sph(), W, [1.8, -0.1, 0], [2.6, 2.0, 2.3]), T(GEO.sph(), W, [0.1, 0.9, 0.1], [2.4, 2.1, 2.2]), T(GEO.sph(), S, [0, -0.8, 0], [4.6, 1.1, 2.7])], { outline: 0 }); } };
  MK.house = { ground: true, make(){ const wall = [0xfbe3b8, 0xfcecd0, 0xf8d8bc][Math.floor(Math.random() * 3)], roof = [0xf0645a, 0x5a8ce0, 0x9a6ae6][Math.floor(Math.random() * 3)];
    return build([T(GEO.rbox(), wall, [0, 1.15, 0], [3.5, 2.3, 3.1]), T(GEO.cone(), roof, [0, 3.2, 0], [5.2, 2.2, 4.6], [0, Math.PI / 4, 0]), T(GEO.rbox(), 0x7a5235, [1.1, 3.5, -0.4], [0.55, 1.1, 0.55]), T(GEO.rbox(), 0x7a4a2a, [0.6, 0.85, 1.55], [0.9, 1.6, 0.12]), T(GEO.box(), 0xffd86b, [-0.95, 1.4, 1.56], [0.9, 0.9, 0.1], [0, 0, 0], true)], { outline: V(1.04, 0) }); } };
  MK.balloon = { make(){ const cols = [[0xff6a5a, 0xffd23f], [0x4aa3ff, 0xffffff], [0x7bdc65, 0xffd23f], [0xc78bff, 0xffffff]][Math.floor(Math.random() * 4)], p = [];
    for (let i = 0; i < 8; i++) p.push(pt(G('bseg' + i, () => { const g_ = new THREE.SphereGeometry(0.5, A ? 10 : 8, A ? 12 : 8, i * Math.PI / 4, Math.PI / 4); if (!A) g_.userData.flat = true; else g_.userData.smooth = true; return g_; }), i % 2 ? cols[1] : cols[0], [0, 2.0, 0], [3.5, 4.2, 3.5]));
    p.push(T(GEO.rbox(), 0xb57a3a, [0, -1.4, 0], [1.0, 0.6, 1.0]), T(GEO.cyl(), 0x4a3a30, [-0.4, -0.6, 0.4], [0.06, 1.7, 0.06], [0.25, 0, 0.25]), T(GEO.cyl(), 0x4a3a30, [0.4, -0.6, 0.4], [0.06, 1.7, 0.06], [0.25, 0, -0.25]));
    return build(p, { outline: V(1.03, 0) }); }, anim(g, ob, t){ g.position.y += Math.sin(t * 1.1 + ob.v * 5) * 0.5; g.rotation.y = Math.sin(t * 0.6 + ob.v * 4) * 0.4; } };
  MK.islet = { make(){ return build([T(GEO.cone(), V(0xa890b8, 0x9a82ac), [0, -1.7, 0], [5.4, 3.8, 5.4], [Math.PI, 0, 0]), T(GEO.cyl(), 0x84e070, [0, 0.2, 0], [5.8, 0.7, 5.8]), T(GEO.rbox(), 0xfbe3b8, [-1.3, 1.1, 0.3], [1.2, 1.0, 1.1]), T(GEO.cone(), 0xf0645a, [-1.3, 1.95, 0.3], [1.7, 0.9, 1.7], [0, Math.PI / 4, 0]), T(GEO.cyl(), 0x7a5235, [1.4, 1.1, -0.2], [0.3, 1.3, 0.3]), T(GEO.sph(), 0x5ac07a, [1.4, 2.3, -0.2], [1.9, 1.7, 1.9])], { outline: V(1.025, 0) }); }, anim(g, ob, t){ g.position.y += Math.sin(t * 0.7 + ob.v * 8) * 0.4; } };
}
function flat2(g){ g.userData.flat = true; return g; }

/* ---- avión + ardilla (visto desde atrás), rehecho para cada estilo ---- */
function planeBuilder(A){
  return function(skinOrColor, ghost, noPilot){
    const sk = typeof skinOrColor === 'object' ? skinOrColor : null, V = (a, b) => A ? a : b, o = ghost ? 0 : V(1.06, 0);
    const RED = sk ? hexN(sk.plane) : skinOrColor, DK = new THREE.Color(RED).multiplyScalar(0.7).getHex(), CREAM = hexN(sk ? sk.belly : '#fff3d6'), FUR = hexN(sk ? sk.fur : '#d28a3e'), FURD = hexN(sk ? sk.furD : '#b8742f'), BR = hexN(sk ? sk.hat : '#6b4128'), SC = hexN(sk ? sk.scarf : '#ffd23f'), acc = sk ? sk.acc : 'goggles';
    const T = (g, c, p, s, r, e) => pt(g, c, p, s, r, { e: !!e });
    const body = [T(GEO.sph(), RED, [0, 0, 0.2], [1.3, 1.3, 3.8]), T(GEO.sph(), DK, [0, 0, -1.7], [1.05, 1.05, 0.9]), T(GEO.rbox(), RED, [0, 0.3, -0.2], [4.6, 0.2, 1.5]), T(GEO.rbox(), CREAM, [1.95, 0.31, -0.2], [0.7, 0.22, 1.52]), T(GEO.rbox(), CREAM, [-1.95, 0.31, -0.2], [0.7, 0.22, 1.52]), T(GEO.rbox(), DK, [0, 0.18, -0.2], [4.64, 0.08, 1.46]),
      T(GEO.rbox(), RED, [0, 0.15, 1.85], [2.2, 0.14, 0.7]), T(GEO.rbox(), RED, [0, 0.7, 1.8], [0.14, 1.0, 0.75]),
      T(GEO.sphL(), 0xff5a5a, [-2.28, 0.32, -0.2], [0.26, 0.26, 0.26], [0, 0, 0], true), T(GEO.sphL(), 0x5aff8a, [2.28, 0.32, -0.2], [0.26, 0.26, 0.26], [0, 0, 0], true)];
    if (noPilot) body.push(T(GEO.rbox(), 0x3a2a3a, [0, 0.85, 0.3], [1.0, 0.55, 1.2]), T(GEO.rbox(), 0x6a4a52, [0, 1.15, 0.65], [0.9, 0.6, 0.3]));
    else {
      body.push(T(GEO.sph(), FURD, [0, 0.9, 0.3], [1.3, 1.2, 1.4]), T(GEO.sph(), FUR, [0, 1.7, 0.2], [1.55, 1.5, 1.5]),
        T(GEO.cone(), FUR, [-0.55, 2.4, 0.25], [0.5, 0.75, 0.4], [0, 0, 0.25]), T(GEO.cone(), FUR, [0.55, 2.4, 0.25], [0.5, 0.75, 0.4], [0, 0, -0.25]), T(GEO.sphL(), 0xf2b98a, [-0.55, 2.38, 0.0], [0.26, 0.4, 0.2]), T(GEO.sphL(), 0xf2b98a, [0.55, 2.38, 0.0], [0.26, 0.4, 0.2]),
        // cola esponjosa: una "S" de bolas que sube por detrás
        T(GEO.sph(), FURD, [0.3, 0.7, 1.15], [0.95, 0.95, 1.0]), T(GEO.sph(), FUR, [0.65, 1.2, 1.7], [1.2, 1.3, 1.3]), T(GEO.sph(), FURD, [0.9, 1.9, 2.1], [1.3, 1.5, 1.35]), T(GEO.sph(), CREAM, [0.85, 2.7, 2.15], [1.0, 1.0, 0.95]));
      if (acc === 'captain') body.push(T(GEO.sph(), BR, [0, 2.15, 0.15], [1.7, 1.0, 1.65]), T(GEO.cyl(), 0x10183e, [0, 1.95, -0.45], [1.7, 0.12, 0.9]), T(GEO.box(), 0xffd23f, [0, 2.05, 0.15], [1.72, 0.18, 1.66]));
      else if (acc === 'bow') body.push(T(GEO.sph(), FUR, [0, 2.3, 0.15], [1.5, 0.8, 1.5]), T(GEO.cone(), BR, [0.95, 2.7, 0.0], [0.8, 0.9, 0.35], [0, 0, -1.2]), T(GEO.cone(), BR, [0.3, 2.75, 0.0], [0.8, 0.9, 0.35], [0, 0, 1.2]), T(GEO.sph(), BR, [0.62, 2.65, 0.0], [0.4, 0.4, 0.35]));
      else if (acc === 'glasses') body.push(T(GEO.sph(), BR, [0, 2.3, 0.1], [1.65, 0.8, 1.6]), T(GEO.tor(), 0x6b6b78, [-0.35, 1.85, -0.7], [0.8, 0.8, 0.8]), T(GEO.tor(), 0x6b6b78, [0.35, 1.85, -0.7], [0.8, 0.8, 0.8]));
      else { body.push(T(GEO.sph(), BR, [0, 2.2, 0.12], [1.62, 1.05, 1.6]), T(GEO.cyl(), acc === 'welder' ? 0xff9a3a : 0x2b2b3a, [0, 2.0, 0.1], [1.6, 0.22, 1.56]));
        if (acc === 'goggles') body.push(T(GEO.sph(), 0xa8ecff, [-0.38, 2.5, -0.55], [0.6, 0.6, 0.4]), T(GEO.sph(), 0xa8ecff, [0.38, 2.5, -0.55], [0.6, 0.6, 0.4]), T(GEO.tor(), 0x2b2b3a, [-0.38, 2.5, -0.74], [0.68, 0.68, 0.68]), T(GEO.tor(), 0x2b2b3a, [0.38, 2.5, -0.74], [0.68, 0.68, 0.68])); }
    }
    const grp = build(body, { center: false, outline: o });
    const prop = build([T(GEO.box(), 0x5a3a24, [0, 0, 0], [2.4, 0.2, 0.08]), T(GEO.box(), 0x5a3a24, [0, 0, 0], [0.2, 2.4, 0.08]), T(GEO.sph(), 0xffd23f, [0, 0, -0.08], [0.42, 0.42, 0.42])], { center: false, outline: 0 }); prop.position.set(0, 0, -2.3); grp.add(prop);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.25, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })); disc.position.set(0, 0, -2.34); grp.add(disc);
    const scarf = build([T(GEO.box(), SC, [0, 0, 0.5], [0.3, 0.08, 1.1]), T(GEO.box(), SC, [0.3, 0, 0.4], [0.26, 0.08, 0.85])], { center: false, outline: 0 }); scarf.position.set(-0.1, 1.2, 0.5); if (!noPilot) grp.add(scarf);
    if (sk && sk.shine){ const g2 = glowSprite(0xffd860, 9, 0.35); g2.position.set(0, 1.0, 0.3); grp.add(g2); }
    if (ghost) grp.traverse(m => { if (m.material && m.isMesh){ m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.5; m.material.depthWrite = false; } });
    grp.userData.prop = prop; grp.userData.scarf = scarf; return grp;
  };
}
const planeA = planeBuilder(true), planeB = planeBuilder(false);

/* ---- jefes rehechos ---- */
function styleBosses(A){
  const V = (a, b) => A ? a : b, o = V(1.05, 0), T = (g, c, p, s, r, e) => pt(g, c, p, s, r, { e: !!e });
  const eyes = (x, y, z, r, iris) => [T(GEO.sph(), 0xffffff, [-x, y, z], [r, r * 1.1, r * 0.7]), T(GEO.sph(), 0xffffff, [x, y, z], [r, r * 1.1, r * 0.7]), T(GEO.sph(), iris || 0x1d1830, [-x, y - r * 0.05, z + r * 0.4], [r * 0.62, r * 0.7, r * 0.4], [0, 0, 0], !!iris), T(GEO.sph(), iris || 0x1d1830, [x, y - r * 0.05, z + r * 0.4], [r * 0.62, r * 0.7, r * 0.4], [0, 0, 0], !!iris), T(GEO.sphL(), 0xffffff, [-x - r * 0.2, y + r * 0.28, z + r * 0.62], [r * 0.24, r * 0.24, r * 0.16], [0, 0, 0], true), T(GEO.sphL(), 0xffffff, [x - r * 0.2, y + r * 0.28, z + r * 0.62], [r * 0.24, r * 0.24, r * 0.16], [0, 0, 0], true)];
  const brows = (x, y, z, w, a, c) => [T(GEO.box(), c || 0x1d1830, [-x, y, z], [w, w * 0.24, w * 0.24], [0, 0, -a]), T(GEO.box(), c || 0x1d1830, [x, y, z], [w, w * 0.24, w * 0.24], [0, 0, a])];
  const wings = (col, w, h, d, ox, oy) => { const mk = sg => { const p = new THREE.Group(); p.add(build([T(GEO.sph(), col, [sg * w * 0.5, 0, 0], [w, h, d])], { center: false, outline: o })); p.position.set(sg * ox, oy, 0); return p; }; return [mk(-1), mk(1)]; };
  BM.crow = () => {
    const N = V(0x4a5cc0, 0x3a4cb0), p = [T(GEO.sph(), N, [0, 0, 0], [4.2, 4.4, 3.8]), T(GEO.sph(), V(0x7a8ce0, 0x6a7cd0), [0, -0.6, 1.3], [2.8, 3.0, 1.6]), T(GEO.sph(), N, [0, 3.0, 0.3], [3.4, 3.2, 3.1]),
      T(GEO.cyl(), 0x191a3a, [0, 4.3, 0.3], [4.2, 0.4, 3.9]), T(GEO.sph(), 0x191a3a, [0, 4.9, 0.3], [2.8, 1.7, 2.6]), T(GEO.box(), 0xffcf4d, [0, 4.35, 0.3], [4.0, 0.3, 3.7]), T(GEO.sph(), 0xffffff, [0, 5.0, 1.35], [0.55, 0.55, 0.3]),
      ...eyes(0.9, 3.15, 1.35, 0.8, 0xe53b3b), T(GEO.cyl(), 0x0b0b14, [-0.9, 3.15, 1.7], [0.95, 0.12, 0.95], [Math.PI / 2, 0, 0]), T(GEO.box(), 0x0b0b14, [0, 3.45, 1.6], [3.6, 0.1, 0.1], [0, 0, 0.3]), ...brows(0.9, 3.95, 1.6, 1.0, 0.55),
      T(GEO.cone(), 0xffa63d, [0, 2.5, 2.2], [1.1, 1.8, 1.1], [Math.PI / 2, 0, 0]), T(GEO.cone(), 0xe0841a, [0, 2.15, 2.1], [1.0, 1.1, 0.8], [Math.PI / 2, 0, 0]),
      T(GEO.rbox(), 0xffa63d, [-0.7, -2.5, 0.5], [1.0, 0.25, 1.4]), T(GEO.rbox(), 0xffa63d, [0.7, -2.5, 0.5], [1.0, 0.25, 1.4])];
    const g = build(p, { outline: o }), [wl, wr] = wings(0x2b3680, 4.2, 0.7, 2.6, 1.8, 0.4); g.add(wl, wr); g.userData.wl = wl; g.userData.wr = wr; g.userData.flap = 5; return g; };
  BM.storm = () => {
    const M = V(0x7a7aa8, 0x6a6a98), p = [T(GEO.sph(), M, [0, 0, 0], [6.2, 4.6, 4.6]), T(GEO.sph(), V(0x6a6a98, 0x5a5a88), [-3.2, -0.4, 0], [4.0, 3.2, 3.4]), T(GEO.sph(), V(0x6a6a98, 0x5a5a88), [3.2, -0.4, 0], [4.0, 3.2, 3.4]), T(GEO.sph(), V(0x8a8ab8, 0x7a7aa8), [-1.6, 2.0, -0.2], [3.6, 3.0, 3.2]), T(GEO.sph(), V(0x8a8ab8, 0x7a7aa8), [1.8, 1.9, -0.2], [3.7, 2.9, 3.2]),
      T(GEO.sph(), 0x4a4a78, [0, -2.1, 0], [8.0, 1.9, 3.6]), T(GEO.cyl(), 0xffcf4d, [0, 3.9, 0.3], [3.3, 0.8, 2.6]),
      ...[-1.3, -0.65, 0, 0.65, 1.3].map((x, i) => T(GEO.cone(), 0xffcf4d, [x * 1.15, 4.8 + (i % 2 ? 0 : 0.45), 0.3], [0.8, 1.6 + (i % 2 ? 0 : 0.8), 0.8])), T(GEO.sph(), 0xe53b3b, [0, 4.0, 1.6], [0.5, 0.5, 0.3], [0, 0, 0], true),
      ...eyes(1.4, 0.75, 2.1, 1.25, 0xffdc3d), ...brows(1.4, 2.0, 2.3, 1.8, 0.5), T(GEO.box(), 0x1b1e33, [0, -0.95, 2.3], [1.8, 0.75, 0.2]), T(GEO.box(), 0xffffff, [-0.5, -0.8, 2.42], [0.32, 0.32, 0.06]), T(GEO.box(), 0xffffff, [0.5, -0.8, 2.42], [0.32, 0.32, 0.06])];
    const g = build(p, { outline: o }), bolt = gcache('stbossbolt', () => { const sh = new THREE.Shape(); [[0.12, 0.5], [-0.3, -0.02], [-0.02, -0.02], [-0.14, -0.5], [0.3, 0.06], [0.02, 0.06]].forEach((q, i) => i ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1])); const ge = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }); ge.translate(0, 0, -0.06); return ge; });
    const bl = new THREE.Mesh(bolt, new THREE.MeshBasicMaterial({ color: 0xffe94d })), br = bl.clone(); bl.position.set(-5, 0.3, 1); br.position.set(5, 0.3, 1); bl.scale.setScalar(3.2); br.scale.setScalar(3.2); g.add(bl, br); g.userData.bolts = [bl, br]; g.userData.flap = 0; return g; };
  BM.owl = () => {
    const Br = V(0xb07a50, 0x9a6a40), p = [T(GEO.sph(), Br, [0, 0, 0], [4.0, 4.8, 3.6]), T(GEO.sph(), V(0xf0d4a8, 0xe8c898), [0, -0.4, 1.1], [2.8, 3.6, 1.7]), T(GEO.sph(), Br, [0, 3.2, 0.2], [3.9, 3.4, 3.4]),
      T(GEO.cone(), Br, [-1.4, 5.0, 0.2], [1.0, 1.7, 0.8], [0, 0, 0.25]), T(GEO.cone(), Br, [1.4, 5.0, 0.2], [1.0, 1.7, 0.8], [0, 0, -0.25]),
      T(GEO.sph(), 0xfff4e0, [-1.1, 3.2, 1.3], [2.2, 2.2, 0.9]), T(GEO.sph(), 0xfff4e0, [1.1, 3.2, 1.3], [2.2, 2.2, 0.9]), T(GEO.sph(), 0xffd23f, [-1.1, 3.2, 1.8], [1.5, 1.5, 0.6], [0, 0, 0], true), T(GEO.sph(), 0xffd23f, [1.1, 3.2, 1.8], [1.5, 1.5, 0.6], [0, 0, 0], true), T(GEO.sph(), 0x1d1830, [-1.1, 3.15, 2.2], [0.75, 0.75, 0.35]), T(GEO.sph(), 0x1d1830, [1.1, 3.15, 2.2], [0.75, 0.75, 0.35]), T(GEO.sphL(), 0xffffff, [-1.3, 3.4, 2.4], [0.24, 0.24, 0.12], [0, 0, 0], true), T(GEO.sphL(), 0xffffff, [0.9, 3.4, 2.4], [0.24, 0.24, 0.12], [0, 0, 0], true),
      T(GEO.tor(), 0xd6a93a, [-1.1, 3.2, 2.0], [2.2, 2.2, 2.2]), T(GEO.tor(), 0xd6a93a, [1.1, 3.2, 2.0], [2.2, 2.2, 2.2]), ...brows(1.1, 4.7, 2.0, 1.7, 0.55, 0x6b4229),
      T(GEO.cone(), 0xff9f3a, [0, 2.45, 2.25], [0.7, 1.1, 0.7], [Math.PI / 2, 0, Math.PI]), T(GEO.tor(), 0xe0504a, [0, 1.65, 0.2], [3.3, 3.3, 3.3], [Math.PI / 2, 0, 0]),
      T(GEO.rbox(), 0xffa63d, [-0.9, -2.6, 0.6], [1.1, 0.25, 1.5]), T(GEO.rbox(), 0xffa63d, [0.9, -2.6, 0.6], [1.1, 0.25, 1.5])];
    const g = build(p, { outline: o }), [wl, wr] = wings(V(0x8a5a38, 0x7a4a2a), 1.7, 4.2, 1.8, 1.9, 0); g.add(wl, wr); g.userData.wl = wl; g.userData.wr = wr; g.userData.flap = 3; return g; };
  BM.shot = { crow: () => build([T(GEO.sph(), 0x2b3680, [0, 0, 0], [0.9, 0.5, 2.2]), T(GEO.sph(), 0xff4a4a, [0, 0.1, -0.7], [0.5, 0.3, 0.7], [0, 0, 0], true)], { outline: o }),
    storm: () => build([T(GEO.sph(), 0xfff6a8, [0, 0, 0], [1.6, 1.6, 1.6], [0, 0, 0], true), T(GEO.sphL(), 0xffdc3d, [0, 0, 0], [2.2, 2.2, 2.2], [0, 0.4, 0.4], true)], { outline: 0 }),
    owl: () => build([T(GEO.sph(), 0xb07a50, [0, 0, 0], [1.5, 1.5, 1.5]), T(GEO.tor(), 0xd6a93a, [0, 0, 0], [1.8, 1.8, 1.8]), T(GEO.sphL(), 0x6b4229, [0, 0, 0.2], [0.9, 0.9, 0.9])], { outline: o }) };
}
