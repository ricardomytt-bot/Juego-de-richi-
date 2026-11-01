/* 05e · jefes en 3D: modelos, proyectiles, avisos en el suelo, rayos y bellotas doradas */
'use strict';
const BM = {}, BX = { ex: [], exN: 0 };
function bEyes(x, y, z, r, pupil){ return [pt(GEO.sph(), 0xffffff, [-x, y, z], [r, r * 1.15, r * 0.6]), pt(GEO.sph(), 0xffffff, [x, y, z], [r, r * 1.15, r * 0.6]), pt(GEO.sph(), pupil || 0x14162e, [-x, y - r * 0.05, z + r * 0.27], [r * 0.5, r * 0.55, r * 0.3], [0, 0, 0], { e: pupil !== undefined }), pt(GEO.sph(), pupil || 0x14162e, [x, y - r * 0.05, z + r * 0.27], [r * 0.5, r * 0.55, r * 0.3], [0, 0, 0], { e: pupil !== undefined })]; }
function bBrows(x, y, z, w, ang, c){ return [pt(GEO.box(), c || 0x14162e, [-x, y, z], [w, w * 0.22, w * 0.22], [0, 0, -ang]), pt(GEO.box(), c || 0x14162e, [x, y, z], [w, w * 0.22, w * 0.22], [0, 0, ang])]; }
function wingPair(color, w, h, d, ox, oy){
  const mk = sg => { const p = new THREE.Group(), m = build([pt(GEO.sph(), color, [sg * w * 0.5, 0, 0], [w, h, d])], { center: false, outline: 1.05 }); p.add(m); p.position.set(sg * ox, oy, 0); return p; };
  return [mk(-1), mk(1)];
}
function initBossModels(){
  BM.crow = () => {
    const parts = [pt(GEO.sph(), 0x2b3060, [0, 0, 0], [3.8, 4.2, 3.4]), pt(GEO.sph(), 0x4a5190, [0, -0.5, 1.2], [2.4, 3.0, 1.2]), pt(GEO.sph(), 0x343a70, [0, 2.8, 0.3], [2.8, 2.7, 2.5]),
      pt(GEO.cyl(), 0x14152e, [0, 4.0, 0.2], [3.9, 0.35, 3.5]), pt(GEO.cone(), 0x14152e, [0, 4.7, 0.2], [2.6, 1.6, 2.4]), pt(GEO.tor(), 0xffcf4d, [0, 4.15, 0.2], [3.4, 3.4, 3.4], [Math.PI / 2, 0, 0]), pt(GEO.sph(), 0xffffff, [0, 4.9, 1.2], [0.4, 0.4, 0.2]),
      pt(GEO.cone(), 0xffa63d, [0, 2.45, 1.95], [0.95, 1.7, 0.95], [Math.PI / 2, 0, 0]), pt(GEO.cone(), 0xe0841a, [0, 2.2, 1.9], [0.9, 1.0, 0.7], [Math.PI / 2, 0, 0]),
      ...bEyes(0.78, 3.0, 1.32, 0.72, 0xe53b3b), pt(GEO.cyl(), 0x0b0b14, [-0.78, 3.0, 1.55], [0.85, 0.12, 0.85], [Math.PI / 2, 0, 0]), pt(GEO.box(), 0x0b0b14, [0, 3.2, 1.45], [3.2, 0.08, 0.1], [0, 0, 0.3]),
      ...bBrows(0.78, 3.75, 1.5, 0.95, 0.55), pt(GEO.box(), 0xffa63d, [-0.6, -2.3, 0.4], [0.9, 0.2, 1.3]), pt(GEO.box(), 0xffa63d, [0.6, -2.3, 0.4], [0.9, 0.2, 1.3]),
      pt(GEO.box(), 0x1d2145, [0, -1.4, -2.0], [1.6, 0.3, 2.0], [0.35, 0, 0])];
    const g = build(parts, { outline: 1.04 }); const [wl, wr] = wingPair(0x1d2145, 3.8, 0.55, 2.2, 1.6, 0.4); g.add(wl, wr); g.userData.wl = wl; g.userData.wr = wr; g.userData.flap = 5; return g; };
  BM.storm = () => {
    const parts = [pt(GEO.sph(), 0x6b7391, [0, 0, 0], [5.6, 4.2, 4.2]), pt(GEO.sph(), 0x5a6280, [-3.0, -0.4, 0], [3.6, 3.0, 3.2]), pt(GEO.sph(), 0x5a6280, [3.0, -0.4, 0], [3.6, 3.0, 3.2]), pt(GEO.sph(), 0x7a829e, [-1.5, 1.9, -0.2], [3.3, 2.8, 3.0]), pt(GEO.sph(), 0x7a829e, [1.7, 1.8, -0.2], [3.4, 2.7, 3.0]),
      pt(GEO.sph(), 0x454c68, [0, -2.0, 0], [7.4, 1.8, 3.4]), pt(GEO.cyl(), 0xffcf4d, [0, 3.7, 0.3], [3.0, 0.7, 2.4]),
      ...[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => pt(GEO.cone(), 0xffcf4d, [x * 1.1, 4.5 + (i % 2 ? 0 : 0.4), 0.3], [0.7, 1.5 + (i % 2 ? 0 : 0.7), 0.7])), pt(GEO.sph(), 0xe53b3b, [0, 3.8, 1.55], [0.45, 0.45, 0.3], [0, 0, 0], { e: true }),
      ...bEyes(1.35, 0.7, 2.0, 1.2, 0xffdc3d), ...bBrows(1.35, 1.9, 2.15, 1.7, 0.5), pt(GEO.box(), 0x1b1e33, [0, -0.9, 2.2], [1.7, 0.7, 0.2]), pt(GEO.box(), 0xffffff, [-0.5, -0.75, 2.32], [0.3, 0.3, 0.06]), pt(GEO.box(), 0xffffff, [0.5, -0.75, 2.32], [0.3, 0.3, 0.06])];
    const g = build(parts, { outline: 1.035 });
    const bolt = gcache('c_bossbolt', () => extrude([[0.12, 0.5], [-0.3, -0.02], [-0.02, -0.02], [-0.14, -0.5], [0.3, 0.06], [0.02, 0.06]], 0.12));
    const bl = new THREE.Mesh(bolt, new THREE.MeshBasicMaterial({ color: 0xffe94d })), br = bl.clone(); bl.position.set(-4.6, 0.3, 1); br.position.set(4.6, 0.3, 1); bl.scale.setScalar(3); br.scale.setScalar(3); g.add(bl, br); g.userData.bolts = [bl, br]; g.userData.flap = 0; return g; };
  BM.owl = () => {
    const parts = [pt(GEO.sph(), 0x8a5a3a, [0, 0, 0], [3.6, 4.4, 3.2]), pt(GEO.sph(), 0xe0c19a, [0, -0.3, 1.0], [2.5, 3.3, 1.5]), pt(GEO.sph(), 0x8a5a3a, [0, 3.1, 0.2], [3.4, 3.1, 3.0]),
      pt(GEO.cone(), 0x8a5a3a, [-1.2, 4.7, 0.2], [0.9, 1.4, 0.7], [0, 0, 0.25]), pt(GEO.cone(), 0x8a5a3a, [1.2, 4.7, 0.2], [0.9, 1.4, 0.7], [0, 0, -0.25]),
      pt(GEO.sph(), 0xf1dcc0, [-1.0, 3.1, 1.2], [2.0, 2.0, 0.8]), pt(GEO.sph(), 0xf1dcc0, [1.0, 3.1, 1.2], [2.0, 2.0, 0.8]),
      pt(GEO.sph(), 0xffd23f, [-1.0, 3.1, 1.6], [1.3, 1.3, 0.5], [0, 0, 0], { e: true }), pt(GEO.sph(), 0xffd23f, [1.0, 3.1, 1.6], [1.3, 1.3, 0.5], [0, 0, 0], { e: true }), pt(GEO.sph(), 0x14162e, [-1.0, 3.05, 1.9], [0.62, 0.62, 0.3]), pt(GEO.sph(), 0x14162e, [1.0, 3.05, 1.9], [0.62, 0.62, 0.3]),
      pt(GEO.tor(), 0xd6a93a, [-1.0, 3.1, 1.85], [1.9, 1.9, 1.9]), pt(GEO.tor(), 0xd6a93a, [1.0, 3.1, 1.85], [1.9, 1.9, 1.9]),
      ...bBrows(1.0, 4.35, 1.85, 1.5, 0.55, 0x6b4229), pt(GEO.cone(), 0xff9f3a, [0, 2.45, 2.0], [0.6, 1.0, 0.6], [Math.PI / 2, 0, Math.PI]), pt(GEO.tor(), 0xd8483c, [0, 1.65, 0.2], [3.0, 3.0, 3.0], [Math.PI / 2, 0, 0]),
      pt(GEO.box(), 0xffa63d, [-0.8, -2.3, 0.6], [1.0, 0.2, 1.3]), pt(GEO.box(), 0xffa63d, [0.8, -2.3, 0.6], [1.0, 0.2, 1.3])];
    const g = build(parts, { outline: 1.04 }); const [wl, wr] = wingPair(0x6b4229, 1.5, 3.8, 1.6, 1.7, 0); g.add(wl, wr); g.userData.wl = wl; g.userData.wr = wr; g.userData.flap = 3; return g; };
  BM.shot = { crow: () => build([pt(GEO.sph(), 0x1d2145, [0, 0, 0], [0.7, 0.3, 2.0]), pt(GEO.sph(), 0xff4a4a, [0, 0.05, -0.6], [0.4, 0.2, 0.6], [0, 0, 0], { e: true })], { outline: 1.08 }),
    storm: () => build([pt(GEO.sph(), 0xfff6a8, [0, 0, 0], [1.4, 1.4, 1.4], [0, 0, 0], { e: true }), pt(GEO.oct(), 0xffdc3d, [0, 0, 0], [1.9, 1.9, 1.9], [0, 0.4, 0.4], { e: true })], { outline: 0 }),
    owl: () => build([pt(GEO.sph(), 0x8a5a3a, [0, 0, 0], [1.3, 1.3, 1.3]), pt(GEO.sph(), 0x6b4229, [0, 0, 0.1], [0.9, 0.9, 0.9]), pt(GEO.tor(), 0xd6a93a, [0, 0, 0], [1.6, 1.6, 1.6])], { outline: 1.08 }) };
  BM.gift = () => { const g = new THREE.Group(); const acorn = MK.gold.make(); acorn.scale.setScalar(1.9); g.add(acorn); const ring = new THREE.Mesh(gcache('c_ring', () => new THREE.TorusGeometry(1.5, 0.07, 6, 30)), new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0.8, depthWrite: false })); ring.rotation.x = Math.PI / 2; g.add(ring); g.userData.ring = ring; g.userData.hy = 0; return g; };
  BM.strike = () => { const g = new THREE.Group(); const a = new THREE.Mesh(gcache('c_sa', () => new THREE.BoxGeometry(1.5, 60, 1.5)), new THREE.MeshBasicMaterial({ color: 0xffd93a, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })), b = new THREE.Mesh(gcache('c_sb', () => new THREE.BoxGeometry(0.3, 60, 0.3)), new THREE.MeshBasicMaterial({ color: 0xfffbd0 })); a.position.y = b.position.y = 30; g.add(a, b); return g; };
  BM.excl = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: LT.exTex, transparent: true, depthWrite: false, fog: false })); s.scale.set(2.2, 2.2, 1); return s; };
}
function syncBoss(dt, P, D3){
  if (!G.boss){ return; }
  if (!BM.crow) initBossModels();
  const B = G.boss, t = G.tAnim, bzAbs = P + B.bz;
  // --- jefe
  const g = acquire('boss_' + B.type, BM[B.type]); const bob = Math.sin(t * 2) * 0.35;
  const bk = window.__bossK || 1; g.position.set(wxOf(B.bx), (3.8 + bob) * (0.55 + 0.45 * bk), -bzAbs); g.rotation.set(0, 0, 0); g.scale.setScalar(1.35 * bk);
  if (g.userData.wl){ const f = Math.sin(t * g.userData.flap) * 0.55; g.userData.wl.rotation.z = 0.35 + f; g.userData.wr.rotation.z = -0.35 - f; }
  if (g.userData.bolts) g.userData.bolts.forEach((b, i) => { b.visible = Math.sin(t * 9 + i * 2) > -0.2 && B.state === 'fight'; });
  if (B.state === 'dying'){ g.rotation.z = B.dieT * 4; g.position.y -= B.dieT * B.dieT * 2.2; g.scale.setScalar(1.35 * bk * clamp(1 - B.dieT / 2.4, 0.05, 1)); }
  if (B.hurt > 0) g.visible = Math.floor(t * 20) % 2 === 0;
  // --- avisos rojos en el suelo, signos de exclamación y rayos
  BX.exN = 0; const pulse = 0.5 + 0.5 * Math.sin(t * 16);
  for (const w of B.warns){
    if (w.delay > 0 || w.lane === null) continue;
    const col = w.kind === 'strike' ? [255, 210, 40] : [255, 60, 60];
    usePlate(wxOf(w.lane), -(P + BOSS_Z * 0.5 - 6), LW * 0.96, BOSS_Z + 14, col, 0.2 + 0.18 * pulse);
    const ex = acquire('excl', BM.excl); ex.position.set(wxOf(w.lane), 2.4 + pulse * 0.4, -(P + 11)); ex.material.opacity = 0.6 + 0.4 * pulse;
  }
  for (const h of B.haz){ usePlate(wxOf(h.lane), -(P + 4), LW, 12, [255, 240, 120], 0.55); const s = acquire('strike', BM.strike); s.position.set(wxOf(h.lane), -D3, -(P + 4)); s.scale.x = s.scale.z = 1 + 0.4 * Math.sin(t * 40); }
  // --- proyectiles y regalos
  for (const pr of B.projs){ const s = acquire('shot_' + B.type, BM.shot[B.type]); s.position.set(wxOf(pr.lane), 1.4, -(P + pr.z)); s.rotation.set(0, 0, B.type === 'owl' ? t * 6 : 0); if (B.type === 'storm'){ s.rotation.y = t * 8; } if (!s.userData.halo){ s.userData.halo = glowSprite(0xff4040, 4.2, 0.55); s.add(s.userData.halo); } }
  for (const gf of B.gifts){ const s = acquire('gift', BM.gift); s.position.set(wxOf(gf.lane), 1.5 + Math.sin(t * 4) * 0.2, -(P + gf.z)); s.rotation.y = t * 2.5; s.userData.ring.scale.setScalar(0.8 + 0.4 * ((t * 1.6) % 1)); s.userData.ring.material.opacity = 0.8 - 0.6 * ((t * 1.6) % 1); }
  for (const th of B.thrown){ const k = th.t / th.dur, e = k * k * (3 - 2 * k), s = acquire('thrown', MK.gold.make); const px = wxOf(G.x), bx = wxOf(B.bx);
    s.position.set(lerp(px, bx, e), lerp(PLAY_Y, 3.8, e) + Math.sin(k * Math.PI) * 2.2, lerp(-P, -bzAbs, e)); s.scale.setScalar(2.2 * lerp(1, 0.6, k)); s.rotation.y = t * 8; }
}

/* precalienta: crea una vez cada modelo y compila los shaders durante el menú, para evitar tirones al aparecer por primera vez */
function g3Warm(){
  try {
    if (!BM.crow) initBossModels();
    poolsBegin();
    for (const k in MK){ const g = acquire(k, MK[k].make); g.position.set(0, 0, -30); }
    for (const t of ['crow', 'storm', 'owl']){ const g = acquire('boss_' + t, BM[t]); g.position.set(0, 0, -40); const s = acquire('shot_' + t, BM.shot[t]); s.position.set(0, 0, -30); }
    for (const k of ['gift', 'strike', 'excl']){ const g = acquire(k, BM[k]); g.position.set(0, 0, -30); }
    platesInit(); PLATES[0].visible = PLATES.line[0].visible = true;
    CAM3.position.set(0, 4, 8); CAM3.lookAt(0, 1, -30);
    R3.compile(S3, CAM3); R3.render(S3, CAM3);
    poolsEnd(); PLATES[0].visible = PLATES.line[0].visible = false;
  } catch (e){ console.warn('warm', e); }
}
