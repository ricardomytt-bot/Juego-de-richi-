'use strict';
// ===== Sincroniza la lógica del juego (2D) con la escena 3D: entidades, cámara, efectos y textos proyectados =====
function faceTex(o) { return cTex(faceCanvas(o)); }
function makeSlime(corrupt) {
  const B = CB(), { g, mt, bx } = B, col = corrupt ? '#a03aff' : '#62d874', face = faceCanvas({ skin: col, eyes: corrupt ? 'red' : 'cute', ey: 12, ex: 7, mouth: corrupt ? 'teeth' : 'smile', iris: '#101018' });
  const sk = new THREE.MeshLambertMaterial({ color: col, emissive: corrupt ? 0x5a1a9a : 0x000000, emissiveIntensity: .5 }), fm = new THREE.MeshLambertMaterial({ map: cTex(face), emissive: corrupt ? 0x3a0a6a : 0x000000, emissiveIntensity: .4 });
  const body = new THREE.Mesh(geoBox(.9, .8, .9), [sk, sk, sk, sk, fm, sk]); body.position.y = .4; body.castShadow = true; g.add(body); B.mats.push(sk, fm);
  const core = bx(g, .5, .45, .5, corrupt ? '#5a1a9a' : '#3fa852', 0, .38, 0, false); core.scale.setScalar(.8); B.body = body; B.core = core;
  return B;
}
function makeFlyer(corrupt) {
  const B = CB(), { g, mt, bx, pv } = B, fm = new THREE.MeshLambertMaterial({ map: cTex(faceCanvas({ skin: '#4b2a7a', eyes: 'red', ey: 12, ex: 7, mouth: 'tiny' })), emissive: 0x2a0a4a, emissiveIntensity: .5 });
  const body = new THREE.Mesh(geoBox(.7, .7, .7), [mt('#4b2a7a'), mt('#4b2a7a'), mt('#4b2a7a'), mt('#4b2a7a'), fm, mt('#4b2a7a')]); body.castShadow = true; g.add(body);
  B.wl = pv(g, -.36, .1, 0); B.wr = pv(g, .36, .1, 0); bx(B.wl, .9, .06, .6, '#8a5acd', -.45, 0, 0); bx(B.wr, .9, .06, .6, '#8a5acd', .45, 0, 0); B.mats.push(fm); return B;
}
function makeDummy() {
  const B = CB(), { g, bx } = B, sack = faceCanvas({ skin: '#d9b46a', eyes: 'closed', mouth: 'flat', paint: R => { R(0, 24, 32, 8, '#7a5a2a'); }, after: R => { R(12, 6, 8, 2, '#ff8aff'); } });
  bx(g, .16, 1.3, .16, '#5a3a1a', 0, .65, 0); bx(g, 1.3, .16, .16, '#7a5a2a', 0, 1.0, 0); const h = headBox(B, .8, '#d9b46a', sack, 1.55); g.add(h); B.head = h; return B;
}
function makeDiamond() {
  const g = new THREE.Group(), m = new THREE.Mesh(new THREE.OctahedronGeometry(.42, 0), new THREE.MeshLambertMaterial({ color: 0x4fe6ff, emissive: 0x20b8e8, emissiveIntensity: .9, flatShading: true })); m.scale.set(.85, 1.3, .85); m.castShadow = true; g.add(m);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: glowTex('rgba(90,240,255,.9)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gl.userData.billboard = true; g.add(gl); return { group: g, spin: m };
}
function makeHeart() {
  const s = new THREE.Shape(); s.moveTo(0, -.32); s.bezierCurveTo(-.55, .08, -.42, .5, 0, .24); s.bezierCurveTo(.42, .5, .55, .08, 0, -.32);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .2, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 1 }), new THREE.MeshLambertMaterial({ color: 0xff3b5c, emissive: 0xc01030, emissiveIntensity: .6 })); m.castShadow = true;
  const g = new THREE.Group(); m.position.z = -.1; g.add(m); return { group: g, spin: g };
}
function makeKey(k) {
  const col = [0xe0a060, 0xdfe6ff, 0xffd24a][k], mt = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: .35 }), g = new THREE.Group(), pivot = new THREE.Group(); g.add(pivot);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .07, 6, 12), mt); ring.position.x = -.34; ring.castShadow = true; pivot.add(ring);
  pivot.add(mesh(geoBox(.62, .1, .1), mt, 0, 0, 0), mesh(geoBox(.1, .24, .1), mt, .22, -.15, 0), mesh(geoBox(.1, .18, .1), mt, .06, -.12, 0));
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: glowTex(['rgba(255,170,90,.9)', 'rgba(200,215,255,.9)', 'rgba(255,220,80,.9)'][k]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gl.userData.billboard = true; g.add(gl); return { group: g, spin: pivot };
}
function wrapOuter(B) { const g = new THREE.Group(); g.add(B.g); B.outer = g; B.group = g; return B; }
const OUTM = typeof THREE !== 'undefined' ? new THREE.MeshBasicMaterial({ color: 0x120a1e, side: THREE.BackSide }) : null;
function addOutline(g) {
  return;
  const list = []; g.traverse(m => { if (m.isMesh && m.geometry && m.geometry.type === 'BoxGeometry' && !m.userData.ol) list.push(m); });
  for (const m of list) { const p = m.geometry.parameters, o = new THREE.Mesh(m.geometry, OUTM); o.userData.ol = 1; o.scale.set(1 + .09 / p.width, 1 + .09 / p.height, 1 + .09 / p.depth); m.add(o); }
}
function makeCharObj(id, seed) { const B = makeChar(id, seed); if (B.g) addOutline(B.g); return wrapOuter(B); }

const PCOL = {};
function pcol(s) { if (PCOL[s]) return PCOL[s]; const c = new THREE.Color(s); return PCOL[s] = [c.r, c.g, c.b]; }
function glGet(key, build) { let o = GL.objs.get(key); if (!o) { o = build(); GL.root.add(o.group || o.outer); GL.objs.set(key, o); } o.seen = true; return o; }
function yawTo(cur, target, k) { let d = target - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return cur + d * k; }

function glSync(dt) {
  const t = S.t, L = S.lvl; GL.t = t; S.dtv = S.dtv || dt;
  for (const o of GL.objs.values()) o.seen = false;
  const gp = (o, x, y, z) => { const grp = o.outer || o.group; grp.position.set(x / T, y, z / T); return grp; };
  // ---- entidades
  for (const e of S.ents) {
    if (e.hidden) continue;
    switch (e.type) {
      case 'slime': {
        const o = glGet(e, () => wrapOuter(makeSlime(e.corrupt)));
        const hop = e.hopT > 0 ? Math.sin(clamp(e.hopT / .35, 0, 1) * Math.PI) : 0, born = e.born > 0 ? (e.born -= dt, 1 - e.born / .4) : 1;
        o.outer.position.set(e.x / T, hop * .7, e.y / T); const sc0 = e.sc || 1; o.outer.scale.set(sc0 * born * (1 - hop * .14), sc0 * born * (1 + hop * .22), sc0 * born * (1 - hop * .14)); o.body.scale.y = 1;
        o.outer.rotation.y = yawTo(o.outer.rotation.y, Math.atan2(P.x - e.x, P.y - e.y), .1); setFlash(o, e.flash > 0);
        if (e.corrupt) o.body.material[0].emissiveIntensity = .5 + Math.sin(t * 12) * .3; break;
      }
      case 'flyer': {
        const o = glGet(e, () => wrapOuter(makeFlyer(e.corrupt)));
        o.outer.position.set(e.x / T, 1.5 + Math.sin(t * 5 + e.x) * .12, e.y / T); o.outer.rotation.y = yawTo(o.outer.rotation.y, Math.atan2(P.x - e.x, P.y - e.y), .1);
        const w = Math.sin(t * 22 + e.x) * .8; o.wl.rotation.z = w; o.wr.rotation.z = -w; setFlash(o, e.flash > 0); break;
      }
      case 'dummy': { const o = glGet(e, () => wrapOuter(makeDummy())); o.outer.position.set(e.x / T, 0, e.y / T); o.outer.rotation.z = e.hit > 0 ? Math.sin(e.hit * 60) * .15 : 0; setFlash(o, e.hit > 0); break; }
      case 'bonfire': { const o = glGet(e, () => { const g = new THREE.Group(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; g.add(mesh(geoBox(.34, .3, .34), lam(0x7a7a88), Math.cos(a) * .62, .15, Math.sin(a) * .62)); } for (let i = 0; i < 3; i++) { const lg = mesh(geoBox(.18, .18, 1.0), lam(0x5a3a1a), 0, .28, 0); lg.rotation.y = i * 1.05; lg.rotation.z = .25; g.add(lg); } const fl = new THREE.Group(); fl.add(mesh(geoBox(.5, .6, .5), new THREE.MeshBasicMaterial({ color: 0xff7a1a }), 0, .65, 0, false), mesh(geoBox(.32, .6, .32), new THREE.MeshBasicMaterial({ color: 0xffd24a }), 0, .95, 0, false), mesh(geoBox(.16, .4, .16), new THREE.MeshBasicMaterial({ color: 0xfff6c0 }), 0, 1.25, 0, false)); g.add(fl); const gl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: glowTex('#ffb04a'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .75 })); gl.position.y = 1.0; gl.userData.billboard = true; g.add(gl); return { group: g, fl, gl }; }); gp(o, e.x, 0, e.y); o.fl.scale.set(1 + Math.sin(t * 13 + e.t) * .08, 1 + Math.sin(t * 9 + e.t * 2) * .16, 1); o.gl.material.opacity = .6 + Math.sin(t * 7 + e.t) * .12 + (e.near ? .15 : 0); break; }
      case 'coin': { const o = glGet(e, () => { const g = new THREE.Group(), cn = mesh(new THREE.CylinderGeometry(.22, .22, .06, 10), new THREE.MeshLambertMaterial({ color: 0xffd24a, emissive: 0x9a6a00, emissiveIntensity: .6 }), 0, 0, 0, false); cn.rotation.x = Math.PI / 2; g.add(cn); return { group: g, cn }; }); gp(o, e.x, .5 + Math.sin(t * 5 + e.t * 3) * .08, e.y); o.cn.parent.rotation.y = t * 5; break; }
      case 'chest': { const o = glGet(e, () => { const g = new THREE.Group(), lid = new THREE.Group(); lid.position.set(0, .6, -.35); g.add(mesh(geoBox(1.1, .6, .8), lam(0x8a5a2a), 0, .3, 0), mesh(geoBox(1.14, .14, .84), lam(0xffd24a), 0, .56, 0, false)); lid.add(mesh(geoBox(1.1, .3, .8), lam(0x9a6a32), 0, .15, .35), mesh(geoBox(.16, .22, .1), lam(0xffd24a), 0, .1, .78, false)); g.add(lid); const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: glowTex('#ffe14a'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .6 })); gl.position.y = 1; gl.userData.billboard = true; g.add(gl); return { group: g, lid, gl }; }); gp(o, e.x, e.opened ? 0 : Math.sin(t * 3) * .05, e.y); o.lid.rotation.x = e.opened ? -1.3 : 0; o.gl.visible = !e.opened || e.t < 1; break; }
      case 'dia': { const o = glGet(e, makeDiamond); gp(o, e.x, .8 + Math.sin(t * 3 + e.t) * .12, e.y); o.spin.rotation.y = t * 2; break; }
      case 'heart': { const o = glGet(e, makeHeart); gp(o, e.x, .8 + Math.sin(t * 3 + e.t) * .1, e.y); o.spin.rotation.y = t * 2.4; break; }
      case 'key': { const o = glGet(e, () => makeKey(e.k)); gp(o, e.x, .85 + Math.sin(t * 3 + e.t) * .12, e.y); o.spin.rotation.y = t * 2.2; break; }
      case 'npc': case 'citizen': case 'exe3d': {
        const id = e.type === 'exe3d' ? 'exe' : e.id, o = glGet(e, () => { const B = makeCharObj(id); if (e.type === 'exe3d') B.g.scale.multiplyScalar(2.6); return B; });
        const sp = Math.hypot(e.vx || 0, e.vy || 0) > 12 ? 1 : 0, ex = e.type === 'exe3d' ? (e.lift != null ? e.lift : 3) : 0;
        o.outer.position.set(e.x / T, ex + (e.type === 'exe3d' ? Math.sin(t * 1.5) * .25 : 0), e.y / T); o.outer.rotation.y = yawTo(o.outer.rotation.y, e.face || 0, .15);
        const spk = S.dialog && S.dialog.who === id; if (S.cineAuto && S.dialog && !spk && e.tag) { const w = S.dialog.who, s0 = w === 'mike' ? P : S.ents.find(q => q.id === w); if (s0) e.face = Math.atan2(s0.x - e.x, s0.y - e.y); } if (spk && S.dialog.shown < S.dialog.text.length) o.outer.position.y += Math.abs(Math.sin(t * 11)) * .1; animChar(o, t + (e.seed || 0), sp, { talk: spk, wave: e.wave || (spk && Math.sin(t * 2.2) > .55) });
        setFlash(o, false, e.corrupt); if (e.corrupt) o.outer.position.x += (Math.random() - .5) * .05; break;
      }
    }
  }
  // ---- Willy
  const w = S.willy; if (w) { const o = glGet('willy', () => makeCharObj('willy')); o.outer.position.set(w.x / T, 0, w.y / T); const mv = Math.hypot(w.vx, w.vy); if (mv > 20) o.outer.rotation.y = yawTo(o.outer.rotation.y, Math.atan2(w.vx, w.vy), .2); animChar(o, t * 1.3, mv > 25 ? 1 : 0); }
  // ---- jefe
  const b = S.boss; if (b && !b.dead) {
    const o = glGet('boss', () => { const B = makeCharObj(b.kind || 'timba'); B.g.scale.multiplyScalar(b.kind === 'acenix' ? 1.35 : b.kind === 'exe' ? 1.75 : 1.5); B.faceNorm = B.parts.headMesh.material[4].map; const sk = { timba: '#f8d0b0', acenix: '#a4a9b6', rius: '#fff0dc', mayo: '#dcd6e0', esparta: '#f0d8c0', raptor: '#f8d0b0', invictor: '#f8d8c0', exe: '#ffc800' }[b.kind || 'timba']; B.faceRed = cTex(faceCanvas({ skin: sk, eyes: 'red', mouth: b.kind === 'acenix' ? 'cat' : 'teeth', iris: '#101018' })); B.faceZ = cTex(faceCanvas({ skin: sk, eyes: 'closed', mouth: b.kind === 'acenix' ? 'cat' : 'tiny' })); return B; });
    const lift = (b.lift || 0) / T * 1.4; o.outer.position.set(b.x / T, lift, b.y / T);
    const sleep = b.state === 'sleep', red = b.state !== 'saved', fm = o.parts.headMesh.material[4], want = sleep ? o.faceZ : (red ? o.faceRed : o.faceNorm); if (fm.map !== want) { fm.map = want; fm.needsUpdate = true; }
    o.outer.rotation.y = yawTo(o.outer.rotation.y, b.face > 0 ? Math.PI / 2 : -Math.PI / 2 + (Math.abs(P.x - b.x) < 30 ? 0 : 0), .1); if (b.state !== 'sleep' && b.state !== 'idle') o.outer.rotation.y = yawTo(o.outer.rotation.y, Math.atan2(P.x - b.x, P.y - b.y), .12);
    o.outer.scale.y = (b.state === 'slam' && b.lift === 0 && b.t > .77) ? .88 : 1; animChar(o, t, Math.hypot(b.vx, b.vy) > 10 ? .8 : 0, { talk: S.dialog && S.dialog.who === (b.kind || 'timba') }); setFlash(o, b.flash > 0);
    o.outer.rotation.z = sleep ? Math.sin(t * 2) * .05 : 0;
  }
  // ---- disparos del jugador
  GL.shotObjs = GL.shotObjs || []; let si = 0;
  for (const q of S.shots) {
    let o = GL.shotObjs[si]; if (!o) { o = new THREE.Group(); o.add(mesh(geoBox(.12, .12, .8), new THREE.MeshBasicMaterial({ color: 0xfff0b0 }), 0, 0, 0, false), mesh(geoBox(.3, .3, .3), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0, .5, false)); GL.lvlGroup.add(o); GL.shotObjs.push(o); }
    o.visible = true; o.scale.setScalar(q.beam ? 4.5 : 1); o.position.set(q.x / T, q.z / T, q.y / T); o.rotation.y = Math.atan2(q.vx, q.vy); o.children[0].material.color.set(q.beam ? 0x4ab8ff : q.star ? 0xffe14a : 0xfff0b0); o.children[1].material.color.set(q.beam ? 0xffffff : 0xffffff); o.rotation.z = q.star ? t * 12 : 0; si++;
  }
  for (; si < GL.shotObjs.length; si++) GL.shotObjs[si].visible = false;
  // ---- proyectiles y avisos
  for (const q of S.proj) {
    if (q.type === 'pillow') { const o = glGet(q, () => { const g = new THREE.Group(), K = q.kind || 'timba'; const em = c => lam(c, { emissive: c, emissiveIntensity: .35 }); if (K === 'acenix') g.add(mesh(geoBox(.5, .34, .5), lam(0x7a4222), 0, 0, 0), mesh(geoBox(.56, .2, .56), lam(0xff9ac8, { emissive: 0x552233 }), 0, .26, 0), mesh(geoBox(.16, .16, .16), lam(0xff3040), 0, .44, 0)); else if (K === 'rius') g.add(mesh(geoBox(.42, .54, .42), lam(0xfff4d8), 0, 0, 0), mesh(geoBox(.3, .2, .3), em(0xffd24a), 0, .1, 0)); else if (K === 'mayo') g.add(mesh(new THREE.CylinderGeometry(.5, .5, .12, 10), lam(0xffb04a), 0, 0, 0), mesh(geoBox(.2, .1, .2), lam(0xe83a3a), .1, .08, .05), mesh(geoBox(.2, .1, .2), lam(0xe83a3a), -.12, .08, -.08)); else if (K === 'esparta') g.add(mesh(geoBox(.56, .56, .56), lam(0xffffff, { emissive: 0x9ab8e8, emissiveIntensity: .3 }), 0, 0, 0)); else if (K === 'raptor') { g.add(mesh(geoBox(.7, .06, .16), em(0x3a3a4a), 0, 0, 0), mesh(geoBox(.16, .06, .7), em(0x3a3a4a), 0, 0, 0)); } else if (K === 'invictor') g.add(mesh(geoBox(.12, .12, 1.1), em(0xe8d8a0), 0, 0, 0), mesh(geoBox(.22, .22, .3), em(0xc0c0d0), 0, 0, .6)); else if (K === 'exe') g.add(mesh(geoBox(.5, .5, .5), new THREE.MeshBasicMaterial({ color: 0xff2060 }), 0, 0, 0), mesh(geoBox(.3, .3, .3), new THREE.MeshBasicMaterial({ color: 0x120018 }), 0, 0, 0)); else g.add(mesh(geoBox(.7, .4, .5), lam(0xffffff, { emissive: 0x444466 }), 0, 0, 0), mesh(geoBox(.72, .12, .52), lam(0x9ad0ff), 0, 0, 0)); return { group: g }; }); gp(o, q.x, q.z / T * 1.1 + .4, q.y); o.group.rotation.set(q.rot, q.rot * .7, 0); }
    else if (q.type === 'ring') { const o = glGet(q, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.92, 1, 40), new THREE.MeshBasicMaterial({ color: 0xe0d0ff, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; const g = new THREE.Group(); g.add(m); return { group: g, m }; }); gp(o, q.x, .08, q.y); o.group.scale.setScalar(q.r / T); o.m.material.opacity = clamp(1 - q.r / q.max, 0, 1); }
  }
  for (const wn of S.warns) {
    const o = glGet(wn, () => {
      const g = new THREE.Group(), fl = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color: 0xff2846, transparent: true, opacity: .4, depthWrite: false })), rg = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffe0e0, transparent: true, depthWrite: false })), inn = new THREE.Mesh(new THREE.RingGeometry(.96, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
      for (const m of [fl, rg, inn]) { m.rotation.x = -Math.PI / 2; g.add(m); } const sheep = new THREE.Group(); sheep.add(mesh(geoBox(.9, .7, .9), lam(0xffffff), 0, 0, 0), mesh(geoBox(.4, .4, .4), lam(0x1a1020), 0, .1, .6)); sheep.visible = false; g.add(sheep); return { group: g, fl, inn, sheep };
    });
    const p = wn.t / wn.dur; gp(o, wn.x, .06, wn.y); o.group.scale.set(wn.r / T, 1, wn.r / T); o.fl.material.opacity = .25 + .3 * Math.abs(Math.sin(t * 12)); o.inn.scale.setScalar(p);
    if (wn.kind === 'sheep') { const left = wn.dur - wn.t; o.sheep.visible = left < .4; o.sheep.scale.set(T / wn.r * .9, 1, T / wn.r * .9); o.sheep.position.y = left * 18; }
  }
  // ---- jugador
  const pl = glGet('player', () => { const B = makeCharObj('mike'); const sl = new THREE.Mesh(new THREE.RingGeometry(.9, 2.0, 20, 1, -.85, 1.7), new THREE.MeshBasicMaterial({ color: 0x9ff4ff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); sl.rotation.x = -Math.PI / 2; sl.position.y = .9; B.slash = sl; GL.root.add(sl); return B; });
  if (!P.dead) {
    pl.outer.visible = !(P.inv > 0 && Math.floor(P.inv * 18) % 2 === 0); pl.outer.position.set(P.x / T, 0, P.y / T);
    const aim = P.atk > 0 ? Math.atan2(P.adx, P.ady) : Math.atan2(P.dx, P.dy); pl.outer.rotation.y = yawTo(pl.outer.rotation.y, aim, P.atk > 0 ? .5 : .28);
    if (pl.parts.wm) { const cw = curW(), mk2 = cw.model || (cw.ranged ? 'bow' : cw.heavy ? 'hammer' : 'dagger'); for (const k2 in pl.parts.wm) pl.parts.wm[k2].visible = k2 === mk2; pl.parts.wm.dagger.scale.setScalar(cw.msc || .6); pl.parts.wm.hammer.scale.setScalar(cw.msc || 1); if (cw.id === 'diamondsword') pl.parts.wm.dagger.children.forEach(c => { if (c.material && c.material.emissive) c.material.color.set(0x7df3ff); }); }
    if (!pl.armorKits) pl.armorKits = buildArmorKits(pl.parts); for (const id in pl.armorKits) pl.armorKits[id].visible = P.armor === id;
    const k = P.atk > 0 && !curW().ranged ? 1 - P.atk / (P.atkMax || .26) : null; if (S.cineAuto && S.dialog && S.dialog.who !== 'mike' && !P.moving) { const s0 = S.ents.find(q => q.id === S.dialog.who); if (s0) { P.dx = (s0.x - P.x) / 100; P.dy = (s0.y - P.y) / 100; } } if (S.dialog && S.dialog.who === 'mike' && S.dialog.shown < S.dialog.text.length) pl.outer.position.y += Math.abs(Math.sin(t * 11)) * .1;
    animChar(pl, P.anim * 1.25, P.moving ? 1 : 0, { atk: k, talk: S.dialog && S.dialog.who === 'mike', wave: S.dialog && S.dialog.who === 'mike' && Math.sin(t * 2.2) > .6 });
    pl.slash.position.set(P.x / T, .9, P.y / T); pl.slash.rotation.z = Math.atan2(-P.ady, P.adx); pl.slash.material.opacity = k != null ? Math.sin(clamp(k, 0, 1) * Math.PI) * .75 : 0; pl.slash.visible = k != null;
  } else { pl.outer.visible = false; pl.slash.visible = false; }
  for (const [key, o] of GL.objs) if (!o.seen && key !== 'player') { GL.root.remove(o.group || o.outer); GL.objs.delete(key); }
  // ---- tiles dinámicos (puertas abiertas, grietas rotas)
  for (let i = GL.dyn.length - 1; i >= 0; i--) { const d = GL.dyn[i]; if (d.keep) d.m.visible = L.get(d.x, d.y) === d.c; else if (L.get(d.x, d.y) !== d.c) { GL.lvlGroup.remove(d.m); GL.dyn.splice(i, 1); } else if (d.glow) d.m.material.emissiveIntensity = .35 + .25 * Math.sin(t * 4) + (S.dia >= L.diaNeed ? .4 : 0); }
  glParticles();
}
// ---------- partículas ----------
function glParticles() {
  if (!GL.pts) {
    const N = 700, geo = new THREE.BufferGeometry(); GL.pPos = new Float32Array(N * 3); GL.pCol = new Float32Array(N * 3); geo.setAttribute('position', new THREE.BufferAttribute(GL.pPos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(GL.pCol, 3));
    GL.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .22, vertexColors: true, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending })); GL.pts.frustumCulled = false; GL.scene.add(GL.pts); GL.pN = N;
  }
  const n = Math.min(S.particles.length, GL.pN);
  for (let i = 0; i < n; i++) { const p = S.particles[i], c = pcol(p.color), f = clamp(p.life / p.max, 0, 1); GL.pPos[i * 3] = p.x / T; GL.pPos[i * 3 + 1] = .5 + (1 - f) * 1.2; GL.pPos[i * 3 + 2] = p.y / T; GL.pCol[i * 3] = c[0] * f; GL.pCol[i * 3 + 1] = c[1] * f; GL.pCol[i * 3 + 2] = c[2] * f; }
  for (let i = n; i < GL.pN; i++) { GL.pPos[i * 3 + 1] = -50; }
  GL.pts.geometry.attributes.position.needsUpdate = true; GL.pts.geometry.attributes.color.needsUpdate = true;
}
// ---------- cámara, luces y dibujo ----------
function glCamera(dt) {
  const L = S.lvl, c = GL.cam; let tx, tz, td = L.theme === 'indoor' ? 9.5 : 13.5;
  if (S.camShot) { tx = S.camShot.x; tz = S.camShot.z; td = S.camShot.dist || 14; }
  else if (S.cineAuto && S.dialog && !S.camShot) { const w = S.dialog.who, sp = w === 'mike' ? P : S.ents.find(e => e.id === w && !e.hidden); if (sp) { tx = (sp.x * 2 + P.x) / 3 / T; tz = sp.y / T - 1.1; td = L.theme === 'indoor' ? 5.8 : 7.8; } else { tx = P.x / T; tz = P.y / T - .6; td = 9; } }
  else if (S.bossLock && GL.arenaC) { const bb = S.boss; tx = (P.x / T * 2 + (bb ? bb.x / T : GL.arenaC[0])) / 3; tz = (P.y / T * 2 + (bb ? bb.y / T : GL.arenaC[1])) / 3 - .3; td = 17; }
  else { tx = P.x / T + P.dx * 1.4; tz = P.y / T + P.dy * .9 - .5; }
  const k = 1 - Math.exp(-dt * (GL.camInit ? 4.5 : 100)); GL.camInit = true;
  GL.cx = lerp(GL.cx, tx, k); GL.cz = lerp(GL.cz, tz, k); GL.dist = lerp(GL.dist, td, 1 - Math.exp(-dt * 2));
  const pitch = 1.06, sh = S.shake > 0 ? S.shake * .22 : 0;
  c.position.set(GL.cx + (sh ? rnd(-sh, sh) : 0), GL.dist * Math.sin(pitch), GL.cz + GL.dist * Math.cos(pitch) + (sh ? rnd(-sh, sh) : 0)); c.lookAt(GL.cx, 0, GL.cz);
  const sx = GL.cx, sz = GL.cz; GL.sun.position.set(sx + 14, 26, sz + 10); GL.sun.target.position.set(sx, 0, sz); GL.sun.target.updateMatrixWorld();
  GL.plight.position.set(P.x / T, 2.4, P.y / T);
  if (S.bossLock && GL.arenaC) { GL.blight.position.set(GL.arenaC[0], 5, GL.arenaC[1]); GL.blight.intensity = 0; } else GL.blight.intensity = 0;
}
function buildArmorKits(p) {
  const kits = {}, mk = (c, em) => new THREE.MeshLambertMaterial({ color: c, emissive: em || 0x000000, emissiveIntensity: em ? .4 : 0 }), add = (par, g, w, h, d, c, x, y, z, em) => { const m = new THREE.Mesh(geoBox(w, h, d), mk(c, em)); m.position.set(x, y, z); m.castShadow = true; g.add(m); par.add(g); return m; };
  const cfg = { leather: [0x8a5a2a, 0x6a4220, 0], chain: [0xa8b0bc, 0x7a8290, 0], iron: [0xd0d4de, 0x8a90a0, 0], samurai: [0x20202a, 0xc0282a, 0xffc030] };
  for (const id in cfg) {
    const [c1, c2, c3] = cfg[id], root = new THREE.Group(); root.visible = false; const gs = [];
    const part = (par, w, h, d, c, x, y, z, em) => { const g = new THREE.Group(); add(par, g, w, h, d, c, x, y, z, em); gs.push(g); };
    part(p.body, .96, .72, .64, c1, 0, 0, 0); part(p.body, .98, .12, .66, c2, 0, -.22, 0);
    for (const L2 of [p.legL, p.legR]) { part(L2, .44, .3, .46, c1, 0, -.12, 0); part(L2, .46, .16, .5, c2, 0, -.42, .03); }
    for (const A of [p.armL, p.armR]) { part(A, .46, .28, .46, c1, 0, -.04, 0); part(A, .4, .22, .4, c2, 0, -.5, 0); }
    part(p.head, 1.2, .46, 1.2, c1, 0, 1.02, 0); part(p.head, 1.22, .1, 1.22, c2, 0, .82, 0);
    if (id === 'iron' || id === 'chain') part(p.head, .3, .5, .12, c2, 0, .5, .62);
    if (id === 'samurai') { part(p.head, .16, .56, .16, c3, -.4, 1.5, 0); part(p.head, .16, .56, .16, c3, .4, 1.5, 0); part(p.head, .5, .16, .3, c2, 0, 1.3, .35, c2); for (const sx of [-.45, 0, .45]) part(p.body, .3, .46, .66, c2, sx, -.5, 0); part(p.body, .5, .3, .1, c3, 0, .1, .35, c3); part(p.head, .9, .3, .14, c1, 0, .12, .6); }
    for (const g of gs) root.add(g); kits[id] = { _gs: gs, set visible(v) { for (const g of gs) g.visible = v; } };
  }
  return kits;
}
function glFrame(dt) {
  if (!GL.ok || !S.lvl) return;
  if (GL.lvlRef !== S.lvl) glBuildLevel(S.lvl);
  glSync(dt); glCamera(dt);
  // edificios que tapan a Mike se 'abren' (vista en corte)
  if (GL.blds) for (const gr of GL.blds) { const b = gr.userData.b, px = P.x / T, pz = P.y / T, occ = px > b.x0 - 2.5 && px < b.x1 + 3.5 && pz < b.y1 + 1.2 && pz > b.y0 - 9; gr.scale.y = lerp(gr.scale.y, occ ? .4 : 1, 1 - Math.exp(-S.dtv * 8)); const hide = occ || gr.scale.y < .95; for (const c of gr.children) if (c.position.y >= 2.5) c.visible = !hide; }
  if (GL.portals) for (const pm of GL.portals) { const d = pm.userData.portal; pm.visible = !d.lock || lockOK(d.lock); pm.children[1].rotation.z += dt * 1.5; pm.children[1].position.y = 1.5 + Math.sin(S.t * 2) * .08; }
  if (GL.snow) {
    if (!GL.snowPts) { const N = 240, geo = new THREE.BufferGeometry(), arr = new Float32Array(N * 3); for (let i = 0; i < N; i++) { arr[i * 3] = rnd(-16, 16); arr[i * 3 + 1] = rnd(0, 13); arr[i * 3 + 2] = rnd(-14, 14); } geo.setAttribute('position', new THREE.BufferAttribute(arr, 3)); GL.snowPts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: .17, transparent: true, opacity: .85, depthWrite: false })); GL.snowPts.frustumCulled = false; GL.scene.add(GL.snowPts); }
    const a = GL.snowPts.geometry.attributes.position.array; for (let i = 0; i < a.length / 3; i++) { a[i * 3 + 1] -= dt * (.9 + (i % 5) * .18); a[i * 3] += Math.sin(S.t * .8 + i) * dt * .35; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 13; }
    GL.snowPts.geometry.attributes.position.needsUpdate = true; GL.snowPts.position.set(GL.cx, 0, GL.cz); GL.snowPts.visible = true;
  } else if (GL.snowPts) GL.snowPts.visible = false;
  if (S.lvl.theme === 'city') {
    const td = !!(S.flags && S.flags.trainDone), cf = td ? Math.max(0, 1 - S.restored / 7) : 0;
    for (const cr of GL.crystals || []) for (const m of cr.ms) m.visible = td && S.restored < cr.k;
    for (const w of GL.winMats || []) w.emissiveIntensity = .85 * (1 - .9 * cf);
    if (cf > 0) { const k = cf * .88, mx = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k); GL.scene.background.copy(mx(0xc9d9ee, 0x3a1230)); GL.scene.fog.color.copy(mx(0xd3deef, 0x4a1636)); GL.amb.color.copy(mx(0xe6edff, 0xff8aa8)); GL.amb.intensity = 1.0 - .15 * k; GL.hemi.color.copy(mx(0xdce8ff, 0xff6a8a)); GL.sun.color.copy(mx(0xffe4b4, 0xff6a8a)); GL.sun.intensity = 2.1 - .8 * k; if (GL.snowPts) GL.snowPts.material.color.copy(mx(0xffffff, 0x806070)); }
  }
  // animaciones ambientales
  if (GL.waterFrames) { GL.waterMat.map = GL.waterFrames[Math.floor(Math.max(0, S.t) * 2.2) % 3]; }
  if (GL.clouds) { GL.clouds.children.forEach(c => { c.position.x += dt * .9; if (c.position.x > 140) c.position.x = -20; }); }
  if (GL.trainGrp) { GL.trainGrp.position.x = S.lvl.train.x0 + GL.trainX; GL.trainGrp.position.y = GL.trainShake ? Math.sin(S.t * 40) * .03 : 0; }
  GL.scene.traverse(o => { if (o.userData.billboard) o.quaternion.copy(GL.cam.quaternion); });
  GL.r.render(GL.scene, GL.cam);
}
const _v = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
function toScreen(x, y, z) { _v.set(x, y, z).project(GL.cam); return { x: (_v.x * .5 + .5) * W, y: (-_v.y * .5 + .5) * H, vis: _v.z < 1 }; }
// ---------- textos y marcas sobre el mundo 3D (se dibujan en el lienzo 2D) ----------
function drawOverlay3D() {
  const L = S.lvl, t = S.t;
  // nombres, avisos de misión y botón ACTUAR
  for (const e of S.ents) {
    if ((e.type !== 'npc' && e.type !== 'citizen') || e.hidden) continue;
    const sp = toScreen(e.x / T, 2.3, e.y / T); if (!sp.vis || sp.x < -50 || sp.x > W + 50) continue;
    const near = S.nearNpc === e;
    if (near) { txt(NAMES[e.id] || 'Vecino', sp.x, sp.y - 30, { size: 17, align: 'center', color: '#ffe14a' }); ctx.fillStyle = '#fff'; rrect(sp.x - 13, sp.y - 8, 26, 26, 6); ctx.fill(); ctx.fillStyle = '#1a1020'; rrect(sp.x - 11, sp.y - 6, 22, 22, 5); ctx.fill(); txt('E', sp.x, sp.y - 4, { size: 17, align: 'center', outline: false }); }
    else if (npcNeedsLetter(e)) { const by = Math.sin(t * 4) * 4; txt('!', sp.x, sp.y - 18 + by, { size: 28, align: 'center', color: '#ffe14a', lw: 5 }); }
  }
  for (const e of S.ents) if (e.mini && !e.dead && !e.hidden) { const sp = toScreen(e.x / T, 3.4, e.y / T); if (!sp.vis) continue; txt(e.name || 'Mini jefe', sp.x, sp.y - 30, { size: 15, align: 'center', color: '#ffb0ff' }); ctx.fillStyle = '#1a1020'; ctx.fillRect(sp.x - 42, sp.y - 8, 84, 10); ctx.fillStyle = '#c26aff'; ctx.fillRect(sp.x - 40, sp.y - 6, 80 * Math.max(0, e.hp / e.max), 6); }
  for (const e of S.ents) if (e.type === 'bonfire' && e.near && !S.dialog) { const sp = toScreen(e.x / T, 1.9, e.y / T); if (sp.vis) txt('ACTUAR: descansar', sp.x, sp.y - 20, { size: 16, align: 'center', color: '#ffb04a' }); }
  // carteles cercanos
  let ns = null, bd = 4; for (const s of L.signs) { const d = dist(P.x / T, P.y / T, s.x / T, s.y / T); if (d < bd) { bd = d; ns = s; } }
  if (ns) { const sp = toScreen(ns.x / T, 1.9, ns.y / T); ctx.font = 'bold 17px "Courier New"'; const tw = ctx.measureText(ns.text).width + 28; ctx.fillStyle = 'rgba(10,8,30,.9)'; rrect(sp.x - tw / 2, sp.y - 34, tw, 38, 8); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; rrect(sp.x - tw / 2, sp.y - 34, tw, 38, 8); ctx.stroke(); txt(ns.text, sp.x, sp.y - 24, { size: 17, align: 'center', outline: false }); }
  // números / avisos flotantes
  for (const f of S.floaters) { const sp = toScreen(f.x / T, 1.8 + f.t * 1.2, f.y / T); ctx.globalAlpha = clamp(1.3 - f.t, 0, 1); txt(f.text, sp.x, sp.y, { size: 19, color: f.color, align: 'center' }); }
  ctx.globalAlpha = 1;
  // flecha de objetivo
  const tg = typeof questTarget === 'function' ? questTarget() : null;
  if (tg && !S.busy && !S.dialog) {
    const wx = (tg.x != null ? tg.x : 0) / T, wz = (tg.y != null ? tg.y : 0) / T, sp = toScreen(wx, 2.6, wz);
    if (sp.vis && sp.x > 40 && sp.x < W - 40 && sp.y > 60 && sp.y < H - 60) { const by = Math.sin(t * 5) * 6; ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sp.x, sp.y + by + 8); ctx.lineTo(sp.x - 14, sp.y + by - 16); ctx.lineTo(sp.x + 14, sp.y + by - 16); ctx.closePath(); ctx.stroke(); ctx.fill(); }
    else { const cx = W / 2, cy = H / 2, dx = (sp.vis ? sp.x : (wx - P.x / T > 0 ? W * 2 : -W)) - cx, dy = (sp.vis ? sp.y : cy + (wz - P.y / T) * 20) - cy, a = Math.atan2(dy, dx), r = Math.min((W / 2 - 60) / Math.abs(Math.cos(a) || .001), (H / 2 - 90) / Math.abs(Math.sin(a) || .001)); const ax = cx + Math.cos(a) * r, ay = cy + Math.sin(a) * r; ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -14); ctx.lineTo(-4, 0); ctx.lineTo(-10, 14); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); }
  }
}
