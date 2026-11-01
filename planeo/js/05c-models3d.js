/* 05c · modelos 3D de bloques, enemigos, objetos y decorado (todo con primitivas + contorno de dibujo animado)
   Los enemigos miran hacia +z (hacia la cámara). Cada modelo: make() crea un grupo; anim(g, ob, t, gt, ctx) lo anima. */
'use strict';
const MK = {};
const POOL = {};
function acquire(key, make){
  const p = POOL[key] || (POOL[key] = { all: [], n: 0 });
  let g = p.all[p.n]; if (!g){ g = make(); g.frustumCulled = false; S3.add(g); p.all.push(g); }
  p.n++; g.visible = true; return g;
}
function poolsBegin(){ for (const k in POOL) POOL[k].n = 0; }
function poolsEnd(){ for (const k in POOL){ const p = POOL[k]; for (let i = p.n; i < p.all.length; i++) p.all[i].visible = false; } }
function aim(dx, dy, dz){ const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize()); const e = new THREE.Euler().setFromQuaternion(q); return [e.x, e.y, e.z]; }
function extrude(pts, depth, bevel){ const sh = new THREE.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: !!bevel, bevelSize: bevel || 0, bevelThickness: bevel || 0, bevelSegments: 2 }); g.translate(0, 0, -depth / 2); return g; }
function mesh(geo, color, opacity, additive){ return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: opacity !== undefined && opacity < 1, opacity: opacity === undefined ? 1 : opacity, depthWrite: !(opacity < 1), blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending })); }
const TAU3 = Math.PI * 2;
const GC = (k, f) => gcache('c_' + k, f);   // geometrías compartidas entre todas las copias de un modelo

function initModels(){
  const BOLT = extrude([[0.12, 0.5], [-0.3, -0.02], [-0.02, -0.02], [-0.14, -0.5], [0.3, 0.06], [0.02, 0.06]], 0.12);
  const HEART = (() => { const sh = new THREE.Shape(); sh.moveTo(0, -0.5); sh.bezierCurveTo(-0.7, 0.05, -0.45, 0.6, 0, 0.28); sh.bezierCurveTo(0.45, 0.6, 0.7, 0.05, 0, -0.5); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 }); g.translate(0, 0, -0.11); return g; })();
  const STAR = (() => { const pts = []; for (let i = 0; i < 10; i++){ const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.2 : 0.52; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } return extrude(pts, 0.2, 0.05); })();
  const BATW = extrude([[0, 0.25], [0.7, 0.72], [1.3, 0.5], [1.12, 0.1], [1.08, -0.28], [0.78, -0.06], [0.62, -0.42], [0.36, -0.1], [0, -0.2]], 0.07);
  const BATWL = extrude([[0, 0.25], [-0.7, 0.72], [-1.3, 0.5], [-1.12, 0.1], [-1.08, -0.28], [-0.78, -0.06], [-0.62, -0.42], [-0.36, -0.1], [0, -0.2]], 0.07);
  const LATHE = new THREE.LatheGeometry([new THREE.Vector2(0.001, -0.55), new THREE.Vector2(0.2, -0.5), new THREE.Vector2(0.36, -0.3), new THREE.Vector2(0.4, -0.05), new THREE.Vector2(0.34, 0.2), new THREE.Vector2(0.001, 0.24)], 12);
  const TRI = new THREE.CylinderGeometry(0.5, 0.5, 1, 3), FRUST = new THREE.CylinderGeometry(0.3, 0.5, 1, 10);
  const eyes = (x, y, z, r, ps) => [pt(GEO.sph(), 0xffffff, [-x, y, z], [r, r * 1.15, r * 0.6]), pt(GEO.sph(), 0xffffff, [x, y, z], [r, r * 1.15, r * 0.6]), pt(GEO.sph(), 0x14162e, [-x + (ps || 0), y - r * 0.05, z + r * 0.26], [r * 0.5, r * 0.55, r * 0.3]), pt(GEO.sph(), 0x14162e, [x + (ps || 0), y - r * 0.05, z + r * 0.26], [r * 0.5, r * 0.55, r * 0.3])];
  const brows = (x, y, z, w, ang, c) => [pt(GEO.box(), c || 0x14162e, [-x, y, z], [w, w * 0.2, w * 0.2], [0, 0, -ang]), pt(GEO.box(), c || 0x14162e, [x, y, z], [w, w * 0.2, w * 0.2], [0, 0, ang])];

  /* ============ bloques ============ */
  MK.crystal = { make(){   // gema redondeada, tipo gota de hielo
    const g = build([pt(GEO.sph(), 0x6fd0ff, [0, 0.2, 0], [1.7, 2.6, 1.7]), pt(GEO.sph(), 0xa8e8ff, [-0.45, 0.8, 0.5], [0.55, 0.9, 0.5]), pt(GEO.sph(), 0x4aa8f0, [-0.85, -0.25, 0.1], [1.0, 1.6, 1.0], [0, 0, 0.35]), pt(GEO.sph(), 0x4aa8f0, [0.85, -0.2, -0.1], [0.95, 1.5, 0.95], [0, 0, -0.35]),
      pt(GEO.sph(), 0xe6ffff, [0.1, 1.55, 0.2], [0.45, 0.45, 0.45], [0, 0, 0], { e: true })], { outline: 1.05 });
    g.add(glowSprite(0x6fe0ff, 4.2, 0.35)); return g; },
    anim(g, ob, t){ g.rotation.y = Math.sin(t * 0.8 + ob.v * 6) * 0.25; g.children[g.children.length - 1].material.opacity = 0.28 + 0.12 * Math.sin(t * 3 + ob.v * 9); } };
  MK.thunderbox = { make(){
    const parts = [pt(GEO.rbox(), 0x5a4fc0, [0, 0, 0], [2.0, 2.0, 2.0]), pt(GEO.rbox(), 0x8d82e6, [0, 0.93, 0], [1.8, 0.35, 1.8])];
    parts.push(pt(BOLT, 0xffe94d, [0, 0, 1.02], [1.3, 1.3, 1], [0, 0, 0], { e: true }), pt(BOLT, 0xffe94d, [0, 0, -1.02], [1.3, 1.3, 1], [0, Math.PI, 0], { e: true }));
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(pt(GEO.sph(), 0xd9d4ff, [sx * 0.8, sy * 0.8, 1.0], [0.24, 0.24, 0.24]));
    const g = build(parts, { outline: 1.05 }); g.add(glowSprite(0xffe055, 5, 0.4)); return g; },
    anim(g, ob, t){ g.children[g.children.length - 1].material.opacity = 0.25 + 0.2 * (0.5 + 0.5 * Math.sin(t * 6 + ob.v * 9)); } };
  MK.crate = { ground: true, make(){   // caja de madera blandita
    const parts = [pt(GEO.rbox(), 0xe3a24d, [0, 0, 0], [2.0, 2.0, 2.0])];
    for (const y of [-0.45, 0.45]) parts.push(pt(GEO.rbox(), 0xb87430, [0, y, 0], [2.08, 0.26, 2.08]));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(pt(GEO.rbox(), 0xb87430, [sx * 0.9, 0, sz * 0.9], [0.34, 2.06, 0.34]));
    for (let i = 0; i < 6; i++) for (const sz of [-1, 1]) parts.push(pt(GEO.rbox(), i % 2 ? 0xffffff : 0xf0545a, [-0.75 + i * 0.3, 0.86, sz * 0.98], [0.3, 0.3, 0.12]));
    parts.push(pt(GEO.sph(), 0xffdd33, [0, -0.15, 1.04], [0.62, 0.62, 0.14]), pt(GEO.rbox(), 0x14162e, [0, -0.1, 1.1], [0.1, 0.3, 0.05]), pt(GEO.sph(), 0x14162e, [0, -0.34, 1.1], [0.1, 0.1, 0.05]));
    return build(parts, { outline: 1.04 }); } };
  MK.spikerock = { ground: true, make(){   // roca redonda con pinchos gorditos de punta redonda
    const parts = [pt(GEO.sph(), 0x8a90bc, [0, 0, 0], [2.2, 1.9, 2.2]), pt(GEO.sph(), 0xaab0d8, [-0.5, 0.5, 0.5], [0.9, 0.6, 0.6])];
    const dirs = [[0, 1, 0.1], [0.75, 0.75, 0.3], [-0.75, 0.75, 0.3], [0.55, 0.6, -0.6], [-0.55, 0.6, -0.6], [0.25, 0.4, 0.9], [-0.3, 0.4, 0.9], [0, 0.35, -1]];
    dirs.forEach(d => { const n = new THREE.Vector3(d[0], d[1], d[2]).normalize(), r = aim(n.x, n.y, n.z); parts.push(pt(GEO.cone(), 0xf4f6ff, [n.x * 1.1, n.y * 0.95 + 0.0, n.z * 1.1], [0.5, 0.95, 0.5], r), pt(GEO.sph(), 0xff6a6a, [n.x * 1.45, n.y * 1.3, n.z * 1.45], [0.22, 0.22, 0.22])); });
    return build(parts, { outline: 1.05 }); } };

  /* ============ enemigos del cielo ============ */
  MK.bee = { make(){
    const body = [pt(GEO.sph(), 0xffd21f, [0, 0, 0], [1.35, 1.3, 1.35]), pt(GEO.tor(), 0x1b1830, [0, 0.18, 0], [1.3, 1.3, 1.3], [Math.PI / 2, 0, 0]), pt(GEO.tor(), 0x1b1830, [0, -0.28, 0], [1.2, 1.2, 1.2], [Math.PI / 2, 0, 0]),
      ...eyes(0.27, 0.16, 0.56, 0.36), ...brows(0.27, 0.46, 0.62, 0.42, 0.45), pt(GEO.cone(), 0xe8a800, [0, -0.12, -0.78], [0.3, 0.55, 0.3], [-Math.PI / 2, 0, 0]),
      pt(GEO.box(), 0x7a1a1a, [0, -0.15, 0.64], [0.3, 0.12, 0.08]),
      pt(GEO.cyl(), 0x14162e, [-0.2, 0.78, 0.1], [0.06, 0.5, 0.06], [0, 0, 0.35]), pt(GEO.cyl(), 0x14162e, [0.2, 0.78, 0.1], [0.06, 0.5, 0.06], [0, 0, -0.35]), pt(GEO.sph(), 0xff4a4a, [-0.3, 1.03, 0.1], [0.16, 0.16, 0.16]), pt(GEO.sph(), 0xff4a4a, [0.3, 1.03, 0.1], [0.16, 0.16, 0.16])];
    const g = build(body, { outline: 1.06 }); const wl = mesh(GEO.sph(), 0xdff4ff, 0.8); wl.scale.set(1.2, 0.08, 0.6); const wr = wl.clone(); const pl = new THREE.Group(), pr = new THREE.Group();
    wl.position.x = -0.62; wr.position.x = 0.62; pl.add(wl); pr.add(wr); pl.position.set(-0.4, 0.6, -0.1); pr.position.set(0.4, 0.6, -0.1); g.add(pl, pr); g.userData.wl = pl; g.userData.wr = pr; g.add(glowSprite(0xffcc30, 3.4, 0.28)); return g; },
    anim(g, ob, t){ const f = Math.sin(t * 38 + ob.v * 9) * 0.55; g.userData.wl.rotation.z = 0.5 + f; g.userData.wr.rotation.z = -0.5 - f; g.rotation.z = Math.sin(t * 5 + ob.v * 7) * 0.08; } };
  MK.comet = { make(){
    const parts = [pt(GEO.ico(), 0xffa028, [0, 0, 0], [1.5, 1.5, 1.5], [0, 0, 0], { e: true }), pt(GEO.ico(), 0xff6a20, [0, 0, -0.1], [1.7, 1.7, 1.7], [0, 0, 0], { e: true }),
      pt(GEO.cone(), 0xff8a2a, [0, 0, -2.1], [1.2, 3.6, 1.2], [-Math.PI / 2, 0, 0], { e: true }), pt(GEO.cone(), 0xffc040, [-0.6, 0.1, -1.6], [0.6, 2.4, 0.6], [-Math.PI / 2, 0, 0.25], { e: true }), pt(GEO.cone(), 0xffc040, [0.6, 0.1, -1.6], [0.6, 2.4, 0.6], [-Math.PI / 2, 0, -0.25], { e: true }),
      ...eyes(0.3, 0.15, 0.7, 0.4), ...brows(0.3, 0.52, 0.76, 0.46, 0.5), pt(GEO.box(), 0x5a0f08, [0, -0.3, 0.76], [0.5, 0.18, 0.06])];
    const eg = build(parts.slice(0, 5), { outline: 0, center: false }); const fg = build(parts.slice(5), { outline: 1.0, center: false });
    const g = new THREE.Group(); g.add(eg, fg); g.add(glowSprite(0xff7a20, 6, 0.55)); g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.children[0].scale.set(1 + 0.08 * Math.sin(t * 18 + ob.v * 4), 1 + 0.08 * Math.sin(t * 18 + ob.v * 4), 1 + 0.12 * Math.sin(t * 22)); } };
  MK.bat = { make(){
    const body = [pt(GEO.sph(), 0x4a2086, [0, 0, 0], [1.05, 1.15, 0.95]), pt(GEO.sph(), 0xc9a8ff, [0, -0.2, 0.3], [0.6, 0.6, 0.4]), pt(GEO.cone(), 0x4a2086, [-0.32, 0.72, 0], [0.32, 0.55, 0.2], [0, 0, 0.15]), pt(GEO.cone(), 0x4a2086, [0.32, 0.72, 0], [0.32, 0.55, 0.2], [0, 0, -0.15]),
      pt(GEO.sph(), 0xff4a5a, [-0.2, 0.12, 0.42], [0.25, 0.3, 0.16], [0, 0, 0], { e: true }), pt(GEO.sph(), 0xff4a5a, [0.2, 0.12, 0.42], [0.25, 0.3, 0.16], [0, 0, 0], { e: true }),
      ...brows(0.22, 0.38, 0.46, 0.32, 0.5), pt(GEO.cone(), 0xffffff, [-0.12, -0.18, 0.48], [0.08, 0.2, 0.08], [Math.PI, 0, 0]), pt(GEO.cone(), 0xffffff, [0.12, -0.18, 0.48], [0.08, 0.2, 0.08], [Math.PI, 0, 0])];
    const g = build(body, { outline: 1.06 });
    const mk = geo => { const p = new THREE.Group(), m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: 0x7d3ed0, gradientMap: LT.grad, side: THREE.DoubleSide })); p.add(m); return p; };
    const pl = mk(BATWL), pr = mk(BATW); pl.position.set(-0.3, 0.1, 0); pr.position.set(0.3, 0.1, 0); g.add(pl, pr); g.userData.pl = pl; g.userData.pr = pr; g.add(glowSprite(0xaa55ff, 3.4, 0.25)); return g; },
    anim(g, ob, t, gt){ const f = Math.sin(t * 15 + ob.v * 8) * 0.5; g.userData.pl.rotation.z = -f; g.userData.pr.rotation.z = f; const k = hopK(ob, gt); g.position.y += Math.sin(k * Math.PI) * 0.9; g.rotation.z = (hopWarn(ob, gt) ? Math.sin(t * 40) * 0.12 : 0); } };
  MK.drone = { make(){
    const parts = [pt(GEO.sph(), 0x38bfae, [0, 0, 0], [1.4, 1.4, 1.4]), pt(GEO.tor(), 0x1b7a74, [0, -0.05, 0], [1.4, 1.4, 1.4], [Math.PI / 2, 0, 0]),
      pt(GEO.sph(), 0xffffff, [0, 0.05, 0.52], [1.0, 1.0, 0.5]), pt(GEO.cyl(), 0x2a3566, [-0.95, -0.15, 0], [0.3, 0.6, 0.3]), pt(GEO.cyl(), 0x2a3566, [0.95, -0.15, 0], [0.3, 0.6, 0.3]),
      pt(GEO.sph(), 0x78e6ff, [-0.95, -0.5, 0], [0.26, 0.4, 0.26], [0, 0, 0], { e: true }), pt(GEO.sph(), 0x78e6ff, [0.95, -0.5, 0], [0.26, 0.4, 0.26], [0, 0, 0], { e: true }),
      pt(GEO.cyl(), 0x14162e, [0, 0.85, 0], [0.12, 0.5, 0.12])];
    const g = build(parts, { outline: 1.06 });
    const eye = new THREE.Group(); const iris = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0xff6a2d })); iris.scale.set(0.6, 0.6, 0.3); const pup = new THREE.Mesh(GEO.sph(), new THREE.MeshBasicMaterial({ color: 0x14162e })); pup.scale.set(0.28, 0.28, 0.2); pup.position.z = 0.1; eye.add(iris, pup); eye.position.set(0, 0, 0.78); g.add(eye); g.userData.iris = iris;
    const rotor = build([pt(GEO.box(), 0x2a3566, [0, 0, 0], [2.3, 0.06, 0.22])], { center: false, outline: 0 }); rotor.position.y = 1.15; g.add(rotor);
    const lamp = mesh(GEO.sph(), 0xff3b3b); lamp.scale.setScalar(0.2); lamp.position.set(0.55, 0.62, 0.3); g.add(lamp);
    g.userData.eye = eye; g.userData.rotor = rotor; g.userData.lamp = lamp; g.add(glowSprite(0x60ffd0, 3.2, 0.22)); return g; },
    anim(g, ob, t, gt, cx){ g.userData.rotor.rotation.y = t * 38; g.userData.eye.position.x = clamp(cx.look, -1, 1) * 0.22; g.userData.iris.material.color.setHex(ob.locked ? 0xff2d2d : 0xff6a2d);
      g.userData.lamp.visible = Math.floor(t * (ob.locked ? 10 : 4)) % 2 === 0; g.position.y += Math.sin(t * 3 + ob.v * 6) * 0.1; } };
  MK.gate = { make(){
    const g = new THREE.Group();
    const pylon = () => build([pt(GEO.cyl(), 0x7d89d4, [0, 0, 0], [0.8, 2.3, 0.8]), pt(FRUST, 0x9aa6e0, [0, 0, 0], [0.8, 2.3, 0.8]), pt(GEO.box(), 0xffdd33, [0, -0.45, 0], [0.86, 0.2, 0.86]), pt(GEO.box(), 0x14162e, [0, -0.45, 0], [0.88, 0.07, 0.88]), pt(GEO.sph(), 0xc8cdf5, [0, 1.25, 0], [0.62, 0.62, 0.62])], { center: false, outline: 1.07 });
    const a = pylon(), b = pylon(); a.position.y = 1.15; b.position.y = 1.15; g.add(a, b);
    const orbA = mesh(GEO.sph(), 0xffee66); orbA.scale.setScalar(0.5); const orbB = orbA.clone(); orbA.position.y = 2.45; orbB.position.y = 2.45; g.add(orbA, orbB);
    const beam = mesh(GEO.cyl(), 0xfff6a8, 0.9); beam.rotation.z = Math.PI / 2; beam.position.y = 1.5; g.add(beam);
    const halo = mesh(GEO.cyl(), 0xffd93a, 0.28, true); halo.rotation.z = Math.PI / 2; halo.position.y = 1.5; g.add(halo);
    const ln = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(16 * 3), 3)), new THREE.LineBasicMaterial({ color: 0xffffff })); ln.frustumCulled = false; g.add(ln);
    g.userData = { a, b, orbA, orbB, beam, halo, ln, hy: 0 }; return g; },
    anim(g, ob, t, gt){ const u = g.userData, xl = wxOf(ob.ga - 0.5), xr = wxOf(ob.gb + 0.5), on = gateOn(ob, gt), fl = gateFlicker(ob, gt), len = xr - xl;
      u.a.position.x = xl; u.b.position.x = xr; u.orbA.position.x = xl; u.orbB.position.x = xr;
      const live = on || (fl && Math.sin(t * 50) > 0); u.beam.visible = u.halo.visible = u.ln.visible = live;
      for (const o of [u.orbA, u.orbB]) o.material.color.setHex(on ? 0xffee66 : fl ? 0xff9a3a : 0x6a7aa8);
      if (live){ u.beam.scale.set(0.14 + 0.05 * Math.sin(t * 60), len, 0.14); u.beam.position.x = (xl + xr) / 2; u.halo.scale.set(0.6, len, 0.6); u.halo.position.x = (xl + xr) / 2;
        const pos = u.ln.geometry.attributes.position; for (let i = 0; i < 16; i++){ const k = i / 15; pos.setXYZ(i, lerp(xl, xr, k), 1.5 + (i === 0 || i === 15 ? 0 : Math.sin(i * 7.7 + Math.floor(t * 30) * 3.1) * 0.35), 0.1); } pos.needsUpdate = true; } } };

  /* ============ enemigos de tierra ============ */
  MK.slime = { ground: true, make(){
    const parts = [pt(GEO.sph(), 0xb95af0, [0, 0, 0], [1.95, 1.65, 1.95]), pt(GEO.sph(), 0xffffff, [-0.5, 0.45, 0.62], [0.32, 0.16, 0.2], [0, 0, 0], { e: true }), ...eyes(0.4, 0.12, 0.8, 0.5, 0.0), ...brows(0.38, 0.55, 0.88, 0.55, 0.5),
      pt(GEO.box(), 0x3a0f55, [0, -0.35, 0.9], [0.55, 0.22, 0.1]), pt(GEO.box(), 0xffffff, [-0.12, -0.28, 0.96], [0.1, 0.1, 0.05]), pt(GEO.box(), 0xffffff, [0.12, -0.28, 0.96], [0.1, 0.1, 0.05])];
    const g = build(parts, { outline: 1.05 }); return g; },
    anim(g, ob, t){ const b = Math.sin(t * 6 + ob.v * 8), sq = 1 + 0.12 * b; g.scale.set(1 / sq, sq, 1 / sq); g.position.y += Math.max(0, b) * 0.35; } };
  MK.boulder = { ground: true, make(){
    const g = new THREE.Group();
    const rock = build([pt(GEO.ico(), 0x98744f, [0, 0, 0], [2.0, 2.0, 2.0], [0, 0, 0], { f: true }), pt(GEO.sph(), 0x6b523c, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), pt(GEO.sph(), 0x6b523c, [-0.6, -0.3, 0.7], [0.4, 0.4, 0.4]), pt(GEO.sph(), 0x6b523c, [0.2, -0.7, 0.4], [0.35, 0.35, 0.35])], { center: false, outline: 1.05 });
    const face = build([...eyes(0.42, 0.1, 0.92, 0.5), ...brows(0.46, 0.55, 1.02, 0.7, 0.45), pt(GEO.box(), 0x3b2412, [0, -0.5, 1.0], [0.9, 0.38, 0.1]), pt(GEO.box(), 0xffffff, [-0.28, -0.37, 1.06], [0.16, 0.16, 0.05]), pt(GEO.box(), 0xffffff, [0, -0.37, 1.06], [0.16, 0.16, 0.05]), pt(GEO.box(), 0xffffff, [0.28, -0.37, 1.06], [0.16, 0.16, 0.05])], { center: false, outline: 0 });
    g.add(rock, face); g.userData = { rock, hy: 1.0 }; return g; },
    anim(g, ob, t){ g.userData.rock.rotation.x = -t * 7 + ob.v * 6; } };
  MK.bunny = { ground: true, make(){
    const parts = [pt(GEO.sph(), 0xfff4ea, [0, 0.75, 0], [1.25, 1.5, 1.15]), pt(GEO.sph(), 0xfff4ea, [-0.34, 0.12, 0.35], [0.42, 0.24, 0.6]), pt(GEO.sph(), 0xfff4ea, [0.34, 0.12, 0.35], [0.42, 0.24, 0.6]),
      pt(GEO.cyl(), 0xfff4ea, [-0.3, 1.9, 0], [0.34, 1.1, 0.24], [0, 0, 0.12]), pt(GEO.cyl(), 0xfff4ea, [0.3, 1.9, 0], [0.34, 1.1, 0.24], [0, 0, -0.12]), pt(GEO.sph(), 0xfff4ea, [-0.38, 2.45, 0], [0.34, 0.3, 0.24]), pt(GEO.sph(), 0xfff4ea, [0.38, 2.45, 0], [0.34, 0.3, 0.24]),
      pt(GEO.box(), 0xff9db8, [-0.31, 1.9, 0.12], [0.14, 0.9, 0.05], [0, 0, 0.12]), pt(GEO.box(), 0xff9db8, [0.31, 1.9, 0.12], [0.14, 0.9, 0.05], [0, 0, -0.12]),
      pt(GEO.sph(), 0xe32e3a, [-0.24, 1.1, 0.5], [0.22, 0.26, 0.14], [0, 0, 0], { e: true }), pt(GEO.sph(), 0xe32e3a, [0.24, 1.1, 0.5], [0.22, 0.26, 0.14], [0, 0, 0], { e: true }),
      ...brows(0.24, 1.36, 0.55, 0.34, 0.5), pt(GEO.sph(), 0xff8aa6, [0, 0.95, 0.58], [0.14, 0.1, 0.1]), pt(GEO.box(), 0xffffff, [-0.06, 0.8, 0.58], [0.1, 0.14, 0.04]), pt(GEO.box(), 0xffffff, [0.06, 0.8, 0.58], [0.1, 0.14, 0.04]),
      pt(GEO.tor(), 0xd63c4a, [0, 0.55, 0.0], [1.1, 1.1, 1.1], [Math.PI / 2, 0, 0])];
    for (let i = 0; i < 8; i++){ const a = i * TAU3 / 8; parts.push(pt(GEO.cone(), 0xc9ccd8, [Math.sin(a) * 0.62, 0.55, Math.cos(a) * 0.62], [0.16, 0.34, 0.16], aim(Math.sin(a), 0.4, Math.cos(a)))); }
    return build(parts, { outline: 1.05 }); },
    anim(g, ob, t, gt){ const k = hopK(ob, gt), hop = Math.sin(k * Math.PI); g.position.y += hop * 1.5; const sq = k > 0 ? 1.1 : 1 + 0.04 * Math.sin(t * 6 + ob.v * 3); g.scale.set(1 / sq, sq, 1 / sq); if (hopWarn(ob, gt)) g.rotation.z = Math.sin(t * 40) * 0.1; else g.rotation.z = 0; } };
  MK.mole = { ground: true, make(){
    const g = new THREE.Group();
    const mound = build([pt(GEO.sph(), 0x8a6240, [0, 0, 0], [2.1, 1.0, 2.1]), pt(GEO.sph(), 0x6d4a2c, [-0.55, 0.3, 0.3], [0.3, 0.2, 0.3]), pt(GEO.sph(), 0x6d4a2c, [0.4, 0.38, -0.2], [0.35, 0.22, 0.35]), pt(GEO.sph(), 0x6d4a2c, [0.7, 0.2, 0.5], [0.25, 0.18, 0.25])], { center: false, outline: 1.05 });
    const mole = build([pt(GEO.sph(), 0x6b4a3a, [0, 0.9, 0], [1.25, 1.4, 1.2]), pt(GEO.sph(), 0xc99a85, [0, 0.75, 0.42], [0.8, 0.6, 0.55]), pt(GEO.sph(), 0xff5f8c, [0, 0.75, 0.74], [0.2, 0.2, 0.2]),
      pt(GEO.sph(), 0xffffff, [-0.28, 1.2, 0.5], [0.2, 0.2, 0.14]), pt(GEO.sph(), 0xffffff, [0.28, 1.2, 0.5], [0.2, 0.2, 0.14]), pt(GEO.sph(), 0x14162e, [-0.28, 1.2, 0.58], [0.1, 0.1, 0.08]), pt(GEO.sph(), 0x14162e, [0.28, 1.2, 0.58], [0.1, 0.1, 0.08]),
      ...brows(0.3, 1.42, 0.55, 0.3, 0.5), pt(GEO.sph(), 0xffd21f, [0, 1.62, 0], [1.3, 0.7, 1.3]), pt(GEO.sph(), 0xfff6a8, [0, 1.75, 0.5], [0.3, 0.3, 0.3], [0, 0, 0], { e: true }),
      pt(GEO.sph(), 0x6b4a3a, [-0.85, 0.7, 0.3], [0.45, 0.5, 0.4]), pt(GEO.sph(), 0x6b4a3a, [0.85, 0.7, 0.3], [0.45, 0.5, 0.4]),
      pt(GEO.cone(), 0xf4e8d8, [-0.95, 1.05, 0.45], [0.14, 0.4, 0.14], [0, 0, 0.2]), pt(GEO.cone(), 0xf4e8d8, [-0.8, 1.05, 0.5], [0.14, 0.4, 0.14], [0, 0, -0.1]), pt(GEO.cone(), 0xf4e8d8, [0.95, 1.05, 0.45], [0.14, 0.4, 0.14], [0, 0, -0.2]), pt(GEO.cone(), 0xf4e8d8, [0.8, 1.05, 0.5], [0.14, 0.4, 0.14], [0, 0, 0.1])], { center: false, outline: 1.05 });
    const bang = mesh(GEO.circ(), 0xffffff, 0.9); bang.scale.setScalar(0.01);
    g.add(mole, mound); g.userData = { mole, mound, hy: 0.45 }; return g; },
    anim(g, ob, t, gt, cx){ const pop = clamp((18 - cx.z) / 5, 0, 1), m = g.userData.mole; m.visible = pop > 0.03; m.position.y = -1.6 + pop * 1.7 + Math.sin(t * 9) * 0.03 * pop; g.userData.mound.scale.y = 1 - pop * 0.35; } };

  /* ============ objetos que se recogen ============ */
  const acornMake = gold => () => {
    const nut = new THREE.Mesh(LATHE, new THREE.MeshToonMaterial({ color: gold ? 0xffd23f : 0xc98a4b, gradientMap: LT.grad }));
    const cap = build([pt(GEO.sph(), gold ? 0xe9a800 : 0x7a4a2a, [0, 0.26, 0], [0.95, 0.55, 0.95]), pt(GEO.cyl(), gold ? 0xe9a800 : 0x6a3c1c, [0, 0.58, 0], [0.1, 0.22, 0.1])], { center: false, outline: 1.06 });
    const g = new THREE.Group(); g.add(nut, cap); const k = gold ? 1.55 : 1.1; g.scale.setScalar(k); if (gold) g.add(glowSprite(0xffe055, 2.8, 0.6)); g.userData.hy = 0; g.userData.k = k; return g; };
  MK.acorn = { make: acornMake(false), anim(g, ob, t){ g.rotation.y = t * 2.5 + ob.P; g.position.y += Math.sin(t * 4 + ob.P) * 0.12; } };
  MK.gold = { make: acornMake(true), anim(g, ob, t){ g.rotation.y = t * 2.5 + ob.P; g.position.y += Math.sin(t * 4 + ob.P) * 0.12; g.children[2].material.opacity = 0.45 + 0.2 * Math.sin(t * 6); } };
  MK.heart = { make(){ const g = new THREE.Group(); g.add(new THREE.Mesh(HEART, new THREE.MeshToonMaterial({ color: 0xff4f86, gradientMap: LT.grad })), glowSprite(0xff6aa0, 3.2, 0.5)); g.scale.setScalar(1.5); g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.rotation.y = t * 2.2; const s = 1.5 * (1 + 0.08 * Math.sin(t * 6)); g.scale.setScalar(s); g.position.y += Math.sin(t * 4 + ob.P) * 0.12; } };
  MK.shield = { make(){ const g = new THREE.Group(); g.add(mesh(GC('shs', () => new THREE.SphereGeometry(0.85, 16, 12)), 0x78d7ff, 0.5), new THREE.Mesh(GC('sht', () => new THREE.TorusGeometry(0.85, 0.05, 6, 24)), new THREE.MeshBasicMaterial({ color: 0xffffff })), glowSprite(0x78d7ff, 3.6, 0.5));
      const em = new THREE.Mesh(GC('shem', () => extrude([[0, 0.45], [0.38, 0.3], [0.32, -0.1], [0, -0.45], [-0.32, -0.1], [-0.38, 0.3]], 0.12, 0.03)), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(em); g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.rotation.y = t * 1.8; g.position.y += Math.sin(t * 4 + ob.P) * 0.12; } };
  MK.star = { make(){ const g = new THREE.Group(); g.add(new THREE.Mesh(STAR, new THREE.MeshToonMaterial({ color: 0xffd21f, gradientMap: LT.grad })), glowSprite(0xffe36b, 4.2, 0.65)); g.scale.setScalar(2.0); g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.rotation.y = t * 2.6; g.rotation.z = Math.sin(t * 2) * 0.2; g.position.y += Math.sin(t * 4 + ob.P) * 0.15; } };
  MK.magnet = { make(){ const g = new THREE.Group(); const arc = new THREE.Mesh(GC('mgarc', () => new THREE.TorusGeometry(0.5, 0.2, 10, 20, Math.PI)), new THREE.MeshToonMaterial({ color: 0xe8343a, gradientMap: LT.grad })); arc.position.y = 0.1;
      const t1 = new THREE.Mesh(GC('mgbox', () => new THREE.BoxGeometry(0.4, 0.34, 0.4)), new THREE.MeshToonMaterial({ color: 0xf2f4ff, gradientMap: LT.grad })); t1.position.set(-0.5, -0.12, 0); const t2 = t1.clone(); t2.position.x = 0.5; g.add(arc, t1, t2, glowSprite(0xff7a7a, 3.6, 0.5)); g.scale.setScalar(1.5); g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.rotation.y = t * 2.0; g.position.y += Math.sin(t * 4 + ob.P) * 0.12; } };

  /* ============ decorado ============ */
  const leafCols = () => { const c = THEME.leaf && THEME.leaf[0] === '#' ? THEME.leaf : '#3f9d5a'; const n = parseInt(c.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255, sh = k => ((clamp(r + k, 0, 255) << 16) | (clamp(gg + k, 0, 255) << 8) | clamp(b + k, 0, 255)); return [sh(-28), sh(0), sh(34)]; };
  MK.stree = { ground: true, make(){ const c = leafCols(); return build([pt(GEO.cyl(), 0x7a5235, [0, 0.9, 0], [0.5, 1.8, 0.5]), pt(GEO.ico0(), c[0], [0, 2.3, 0], [3.0, 2.6, 3.0], [0, 0.3, 0], { f: true }), pt(GEO.ico0(), c[1], [0, 3.6, 0], [2.4, 2.2, 2.4], [0, 0.9, 0], { f: true }), pt(GEO.ico0(), c[2], [0, 4.7, 0], [1.6, 1.6, 1.6], [0, 0.5, 0], { f: true })], { outline: 1.035 }); } };
  MK.srock = { ground: true, make(){ return build([pt(GEO.ico(), 0x9aa3b5, [0, 0, 0], [2.2, 1.4, 2.0], [0, 0.4, 0], { f: true }), pt(GEO.ico(), 0xb9c1d1, [-0.5, 0.35, 0.3], [0.9, 0.6, 0.8], [0, 0, 0], { f: true })], { outline: 1.05 }); } };
  MK.flower = { ground: true, make(){ const cols = [0xff7aa8, 0xffd23f, 0xffffff, 0xb58cff]; const col = cols[Math.floor(Math.random() * 4)]; const parts = [pt(GEO.cyl(), 0x3f9d5a, [0, 0.45, 0], [0.07, 0.9, 0.07])]; for (let i = 0; i < 5; i++){ const a = i * TAU3 / 5; parts.push(pt(GEO.sphL(), col, [Math.cos(a) * 0.22, 0.95, Math.sin(a) * 0.22], [0.26, 0.26, 0.26])); } parts.push(pt(GEO.sphL(), 0xfff3a0, [0, 0.98, 0], [0.22, 0.22, 0.22])); return build(parts, { outline: 0 }); } };
  MK.tuft = { ground: true, make(){ const parts = []; for (let i = -2; i <= 2; i++) parts.push(pt(GEO.cone(), 0x3a9a4a, [i * 0.1, 0.35, 0], [0.12, 0.7 - Math.abs(i) * 0.1, 0.12], [0, 0, -i * 0.18])); return build(parts, { outline: 0 }); } };
  MK.puff = { make(){ const parts = [pt(GEO.sphM(), 0xffffff, [0, 0, 0], [3, 2.2, 2.6]), pt(GEO.sphM(), 0xffffff, [-1.5, -0.2, 0.2], [2.2, 1.7, 2.0]), pt(GEO.sphM(), 0xffffff, [1.6, -0.1, 0], [2.4, 1.8, 2.1]), pt(GEO.sphM(), 0xffffff, [0.2, 0.8, 0.1], [2.2, 1.9, 2.0]), pt(GEO.sphM(), 0xd6e0f5, [0, -0.7, 0], [4.2, 1.0, 2.6])]; return build(parts, { outline: 0 }); } };
  MK.balloon = { make(){
    const parts = [], cols = [[0xff5a4a, 0xffd23f], [0x4aa3ff, 0xffffff], [0x7bdc65, 0xffd23f], [0xc78bff, 0xffffff]][Math.floor(Math.random() * 4)];
    for (let i = 0; i < 8; i++) parts.push(pt(GC('balseg' + i, () => new THREE.SphereGeometry(0.5, 8, 10, i * Math.PI / 4, Math.PI / 4)), i % 2 ? cols[1] : cols[0], [0, 1.9, 0], [3.4, 4.0, 3.4]));
    parts.push(pt(GEO.box(), 0xb57a3a, [0, -1.3, 0], [0.9, 0.55, 0.9]), pt(GEO.cyl(), 0x4a3a30, [-0.4, -0.55, 0.4], [0.05, 1.6, 0.05], [0.25, 0, 0.25]), pt(GEO.cyl(), 0x4a3a30, [0.4, -0.55, 0.4], [0.05, 1.6, 0.05], [0.25, 0, -0.25]), pt(GEO.cyl(), 0x4a3a30, [-0.4, -0.55, -0.4], [0.05, 1.6, 0.05], [-0.25, 0, 0.25]), pt(GEO.cyl(), 0x4a3a30, [0.4, -0.55, -0.4], [0.05, 1.6, 0.05], [-0.25, 0, -0.25]),
      pt(GEO.cone(), 0xffa030, [0, -0.7, 0], [0.4, 0.7, 0.4], [Math.PI, 0, 0], { e: true }));
    return build(parts, { outline: 1.03 }); },
    anim(g, ob, t){ g.position.y += Math.sin(t * 1.1 + ob.v * 5) * 0.5; g.rotation.y = Math.sin(t * 0.6 + ob.v * 4) * 0.4; } };
  MK.islet = { make(){
    const parts = [pt(GEO.cone(), 0x8d7a9d, [0, -1.6, 0], [5.0, 3.6, 5.0], [Math.PI, 0, 0], { f: true }), pt(GEO.cyl(), 0x78d86b, [0, 0.12, 0], [5.4, 0.4, 5.4]), pt(GEO.cyl(), 0x66c55f, [0, 0.4, 0], [5.0, 0.3, 5.0]),
      pt(GEO.box(), 0xf4dcae, [-1.2, 0.95, 0.3], [1.1, 0.9, 1.0]), pt(GEO.cone4(), 0xe0583f, [-1.2, 1.75, 0.3], [1.5, 0.8, 1.5], [0, Math.PI / 4, 0]), pt(GEO.cyl(), 0x7a5235, [1.3, 1.0, -0.2], [0.3, 1.2, 0.3]), pt(GEO.ico(), 0x4fb36a, [1.3, 2.0, -0.2], [1.8, 1.6, 1.8], [0, 0, 0], { f: true })];
    return build(parts, { outline: 1.025 }); },
    anim(g, ob, t){ g.position.y += Math.sin(t * 0.7 + ob.v * 8) * 0.4; } };
  MK.flock = { make(){
    const g = new THREE.Group(); g.userData.birds = [];
    for (let i = 0; i < 7; i++){ const row = Math.ceil(i / 2), sg = i % 2 ? 1 : -1, b = new THREE.Group(); const mat = new THREE.MeshBasicMaterial({ color: 0x28325a, side: THREE.DoubleSide });
      const wg = GC('flockw', () => new THREE.PlaneGeometry(1.1, 0.35)), w1 = new THREE.Mesh(wg, mat), w2 = new THREE.Mesh(wg, mat); w1.position.x = -0.55; w2.position.x = 0.55; const p1 = new THREE.Group(), p2 = new THREE.Group(); p1.add(w1); p2.add(w2); b.add(p1, p2); b.position.set(sg * row * 1.8, 0, row * 1.3); g.add(b); g.userData.birds.push([p1, p2]); }
    g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.userData.birds.forEach((b, i) => { const f = Math.sin(t * 7 + i * 1.7 + ob.v * 6) * 0.6; b[0].rotation.z = f; b[1].rotation.z = -f; }); } };
  MK.house = { ground: true, make(){ const wall = [0xf4dcae, 0xf6e6c4, 0xf2d1b0][Math.floor(Math.random() * 3)], roof = [0xe0583f, 0x4a79c9, 0x8a5ad6][Math.floor(Math.random() * 3)];
    return build([pt(GEO.rbox(), wall, [0, 1.1, 0], [3.4, 2.2, 3.0]), pt(GEO.cone4(), roof, [0, 3.0, 0], [4.9, 1.9, 4.5], [0, Math.PI / 4, 0]), pt(GEO.box(), 0x7a5235, [1.0, 3.3, -0.4], [0.5, 1.0, 0.5]), pt(GEO.box(), 0x7a5235, [0.6, 0.8, 1.52], [0.8, 1.5, 0.08]), pt(GEO.box(), 0xffd86b, [-0.9, 1.3, 1.52], [0.8, 0.8, 0.08], [0, 0, 0], { e: true })], { outline: 1.03 }); } };
  MK.windmill = { ground: true, make(){ const g = new THREE.Group();
    const tower = build([pt(FRUST, 0xf2ead8, [0, 2.4, 0], [2.4, 4.8, 2.4]), pt(GEO.cone(), 0xd9533f, [0, 5.4, 0], [2.6, 1.6, 2.6])], { center: false, outline: 1.03 });
    const blades = build([0, 1, 2, 3].flatMap(i => [pt(GEO.box(), 0xffffff, [Math.cos(i * Math.PI / 2) * 1.7, Math.sin(i * Math.PI / 2) * 1.7, 0], [i % 2 ? 0.7 : 3.2, i % 2 ? 3.2 : 0.7, 0.1])]), { center: false, outline: 1.04 }); blades.position.set(0, 4.7, 1.3);
    g.add(tower, blades); g.userData = { blades, hy: 0 }; return g; },
    anim(g, ob, t){ g.userData.blades.rotation.z = t * 0.9 + ob.v * 6; } };
}
