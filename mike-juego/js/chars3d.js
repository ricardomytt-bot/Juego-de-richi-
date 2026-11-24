'use strict';
// ===== Personajes y criaturas 3D hechos de bloques (chibi, estilo Minecraft Dungeons) =====
function CB() {
  const g = new THREE.Group(), parts = {}, mats = [];
  const mt = (c, o) => { const m = new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})); mats.push(m); return m; };
  const bx = (p, w, h, d, c, x, y, z, cast = true) => { const m = new THREE.Mesh(geoBox(w, h, d), c && c.isMaterial ? c : mt(c)); m.position.set(x, y, z); m.castShadow = cast; p.add(m); return m; };
  const pv = (p, x, y, z) => { const q = new THREE.Group(); q.position.set(x, y, z); p.add(q); return q; };
  const tm = canvas => { const m = new THREE.MeshLambertMaterial({ map: cTex(canvas) }); mats.push(m); return m; };
  return { g, parts, mats, mt, bx, pv, tm };
}
// ---------- caras pintadas (32x32) ----------
function faceCanvas(o) {
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  R(0, 0, 32, 32, o.skin || '#f8d0b0'); if (o.paint) o.paint(R, g);
  const ey = o.ey || 14, ex = o.ex || 8, E = o.eyes || 'cute', look = o.look || 0;
  const eye = (cx) => {
    if (E === 'cute' || E === 'angry') { R(cx - 4, ey - 5, 8, 10, '#1a1020'); R(cx - 3, ey - 4, 6, 8, '#fff'); R(cx - 2 + look, ey - 3, 4, 6, o.iris || '#2a2a3a'); R(cx - 1 + look, ey - 2, 2, 4, '#0a0a14'); R(cx - 1 + look, ey - 3, 2, 2, '#fff'); }
    else if (E === 'dog') { R(cx - 5, ey - 6, 10, 12, '#1a1020'); R(cx - 4, ey - 5, 8, 10, '#fff'); R(cx - 2 + look, ey - 2, 4, 5, '#1a1020'); R(cx - 2 + look, ey - 3, 2, 2, '#fff'); }
    else if (E === 'closed') { R(cx - 4, ey, 8, 2, '#1a1020'); R(cx - 3, ey + 2, 6, 1, '#1a1020'); R(cx - 4, ey - 1, 1, 1, '#1a1020'); R(cx + 3, ey - 1, 1, 1, '#1a1020'); }
    else if (E === 'red') { R(cx - 5, ey - 5, 10, 10, '#1a1020'); R(cx - 3, ey - 3, 6, 6, '#ff2020'); R(cx - 1, ey - 1, 2, 2, '#fff'); }
    else if (E === 'cat') { R(cx - 4, ey - 6, 8, 12, '#1a1020'); R(cx - 3, ey - 5, 6, 10, o.iris || '#e8f0a0'); R(cx - 1, ey - 5, 2, 10, '#1a1020'); R(cx - 3, ey - 5, 2, 2, '#fff'); }
    else if (E === 'big') { R(cx - 5, ey - 6, 10, 12, '#1a1020'); R(cx - 4, ey - 5, 8, 10, '#fff'); R(cx - 3, ey - 3, 6, 7, o.iris || '#20a060'); R(cx - 2, ey - 2, 4, 5, '#0a1a10'); R(cx - 3, ey - 4, 3, 3, '#fff'); R(cx + 1, ey + 1, 2, 2, '#fff'); }
  };
  if (E !== 'visor') { eye(16 - ex); eye(16 + ex); }
  if (E === 'angry' || o.brow === 'angry') { R(16 - ex - 5, ey - 8, 4, 2, '#1a1020'); R(16 - ex - 1, ey - 7, 4, 2, '#1a1020'); R(16 + ex + 1, ey - 8, 4, 2, '#1a1020'); R(16 + ex - 3, ey - 7, 4, 2, '#1a1020'); }
  else if (o.brow) { R(16 - ex - 4, ey - 8, 8, 2, o.brow); R(16 + ex - 4, ey - 8, 8, 2, o.brow); }
  const M = o.mouth || 'smile';
  if (M === 'smile') { R(13, 24, 6, 1, '#1a1020'); R(12, 23, 1, 1, '#1a1020'); R(19, 23, 1, 1, '#1a1020'); }
  else if (M === 'grin') { R(10, 22, 12, 6, '#1a1020'); R(11, 22, 10, 2, '#fff'); R(12, 26, 8, 2, '#d03a4a'); }
  else if (M === 'open') { R(13, 22, 6, 5, '#1a1020'); R(14, 25, 4, 2, '#d03a4a'); }
  else if (M === 'teeth') { R(8, 21, 16, 7, '#1a1020'); R(9, 22, 14, 3, '#fff'); for (let i = 0; i < 7; i++) R(10 + i * 2, 22, 1, 3, '#1a1020'); }
  else if (M === 'flat') R(13, 24, 6, 1, '#1a1020'); else if (M === 'cat') { R(15, 22, 2, 1, '#e07080'); R(14, 23, 1, 1, '#1a1020'); R(17, 23, 1, 1, '#1a1020'); R(13, 24, 2, 1, '#1a1020'); R(17, 24, 2, 1, '#1a1020'); }
  else if (M === 'tiny') { R(14, 24, 4, 1, '#1a1020'); }
  if (o.blush) { R(4, 19, 5, 3, 'rgba(255,110,140,.55)'); R(23, 19, 5, 3, 'rgba(255,110,140,.55)'); }
  if (o.after) o.after(R, g); return c;
}
function chestCanvas(draw) { const c = document.createElement('canvas'); c.width = c.height = 24; const g = c.getContext('2d'); draw((x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }, g); return c; }
function headBox(B, size, skin, face, y) {
  const sk = B.mt(skin), fm = B.tm(face), m = new THREE.Mesh(geoBox(size, size, size), [sk, sk, sk, sk, fm, sk]); m.position.set(0, y == null ? size / 2 : y, 0); m.castShadow = true; return m;
}
function hairBlock(B, head, type, col, s = 1) {
  const m = B.mt(col), b = (w, h, d, x, y, z) => B.bx(head, w, h, d, m, x, y + .5, z);
  if (type === 'short') { b(1.06, .24, 1.06, 0, .56, 0); b(1.06, .6, .22, 0, .22, -.44); b(.12, .42, .72, .47, .32, -.06); b(.12, .42, .72, -.47, .32, -.06); b(1.0, .16, .16, 0, .5, .46); }
  else if (type === 'spiky') { b(1.06, .24, 1.06, 0, .56, 0); b(1.06, .7, .22, 0, .2, -.44); [[-.38, -.3], [0, -.35], [.38, -.3], [-.2, .15], [.2, .15], [-.4, .3], [.4, .3]].forEach(([x, z], i) => b(.3, .5 + (i % 2) * .22, .3, x, .88 + (i % 2) * .1, z)); b(.28, .3, .1, -.35, .38, .5); b(.28, .24, .1, .1, .4, .5); }
  else if (type === 'bangs') { b(1.1, .3, 1.1, 0, .58, 0); b(1.1, .8, .24, 0, .15, -.44); b(1.1, .26, .18, 0, .4, .48); b(.14, .6, .6, .52, .3, 0); b(.14, .6, .6, -.52, .3, 0); b(.26, .34, .12, -.38, .22, .5); b(.26, .26, .12, .4, .28, .5); }
  else if (type === 'swoosh') { b(1.1, .3, 1.1, 0, .56, 0); b(1.1, .5, .22, 0, .22, -.44); b(.5, .26, .3, -.36, .5, .38); b(.2, .78, .7, .5, .3, -.04); b(.8, .16, .16, -.1, .46, .48); }
  else if (type === 'hood') { b(1.18, .3, 1.18, 0, .6, -.02); b(1.18, 1.1, .3, 0, .1, -.5); b(.18, .9, .86, .6, .12, -.1); b(.18, .9, .86, -.6, .12, -.1); b(.98, .24, .2, 0, .5, .5); }
  else if (type === 'curly') { for (let i = 0; i < 9; i++) b(.34, .3, .34, ((i % 3) - 1) * .36, .62 + (i % 2) * .08, (Math.floor(i / 3) - 1) * .36); b(1.04, .5, .2, 0, .24, -.44); }
  else if (type === 'long') { b(1.1, .26, 1.1, 0, .56, 0); b(1.1, 1.0, .22, 0, 0, -.46); b(.14, .9, .6, .52, .1, -.08); b(.14, .9, .6, -.52, .1, -.08); b(1.0, .16, .14, 0, .5, .48); }
}
function humanoid(o) {
  const B = CB(), { g, parts, mt, bx, pv } = B, sk = o.skin || '#f8d0b0';
  parts.legL = pv(g, -.2, .62, 0); parts.legR = pv(g, .2, .62, 0);
  for (const L of [parts.legL, parts.legR]) { bx(L, .34, .62, .36, o.legSkin ? sk : o.pants, 0, -.31, 0); bx(L, .36, .16, .46, o.shoes || '#3a2a2a', 0, -.56, .04); }
  const sh = mt(o.shirt), bodyMats = [sh, sh, sh, mt(o.pants), o.chest ? B.tm(o.chest) : sh, sh];
  parts.body = new THREE.Mesh(geoBox(.8, .84, .46), bodyMats); parts.body.position.set(0, 1.04, 0); parts.body.castShadow = true; g.add(parts.body);
  if (o.belt) bx(g, .84, .12, .5, o.belt, 0, .66, 0);
  parts.armL = pv(g, -.56, 1.38, 0); parts.armR = pv(g, .56, 1.38, 0);
  for (const A of [parts.armL, parts.armR]) { if (o.sleeveShort) { bx(A, .3, .4, .32, o.sleeve || o.shirt, 0, -.2, 0); bx(A, .26, .4, .28, sk, 0, -.6, 0); } else { bx(A, .28, .78, .3, o.sleeve || o.shirt, 0, -.39, 0); } bx(A, .26, .2, .28, o.hand || sk, 0, -.86, 0); }
  parts.head = pv(g, 0, 1.46, 0);
  const head = headBox(B, 1.0, sk, faceCanvas(o.face || {}), .5); parts.head.add(head); parts.headMesh = head;
  if (o.hair) hairBlock(B, parts.head, o.hair.type, o.hair.color);
  if (o.ears) for (const sx of [-1, 1]) bx(parts.head, .14, .3, .26, o.ears, sx * .57, .46, 0);
  if (o.extras) o.extras(B, parts);
  g.scale.setScalar(o.scale || .72); return B;
}
function dogBiped(o) {
  const B = CB(), { g, parts, mt, bx, pv } = B, f = o.fur;
  parts.legL = pv(g, -.22, .5, 0); parts.legR = pv(g, .22, .5, 0);
  for (const L of [parts.legL, parts.legR]) { bx(L, .36, .5, .38, f, 0, -.25, 0); bx(L, .4, .14, .5, o.fur2, 0, -.45, .05); }
  if (o.cape) bx(g, .92, 1.1, .08, o.cape, 0, 1.0, -.32);
  parts.body = bx(g, .86, .8, .52, f, 0, .9, 0); if (o.belly) bx(g, .5, .5, .06, o.belly, 0, .88, .28, false); if (o.mark) { bx(g, .12, .34, .06, o.mark, 0, .92, .3, false); }
  parts.armL = pv(g, -.58, 1.24, 0); parts.armR = pv(g, .58, 1.24, 0);
  for (const A of [parts.armL, parts.armR]) { bx(A, .3, .66, .32, f, 0, -.33, 0); bx(A, .34, .24, .36, o.fur2, 0, -.7, 0); }
  parts.head = pv(g, 0, 1.3, 0); const head = headBox(B, 1.1, f, faceCanvas(o.face), .55); parts.head.add(head); parts.headMesh = head;
  for (const sx of [-1, 1]) { const e = bx(parts.head, .36, .78, .5, o.ear || f, sx * .68, .5, -.05); e.rotation.z = sx * .22; }
  bx(parts.head, .26, .34, .26, f, 0, 1.2, 0); bx(parts.head, .3, .2, .2, '#1a1020', 0, .42, .62, false);
  bx(g, .22, .22, .55, f, 0, .8, -.5);
  if (o.extras) o.extras(B, parts);
  g.scale.setScalar(o.scale || .7); return B;
}
function catBiped(o) {
  const B = CB(), { g, parts, mt, bx, pv } = B, f = o.fur;
  parts.legL = pv(g, -.18, .62, 0); parts.legR = pv(g, .18, .62, 0);
  for (const L of [parts.legL, parts.legR]) { bx(L, .26, .62, .28, f, 0, -.31, 0); bx(L, .3, .14, .38, o.paw || f, 0, -.56, .05); }
  const sh = mt(f); parts.body = new THREE.Mesh(geoBox(.66, .84, .4), [sh, sh, sh, sh, B.tm(chestCanvas((R) => { R(0, 0, 24, 24, o.fur); R(7, 2, 10, 20, o.chest || '#e8f8ff'); })), sh]); parts.body.position.set(0, 1.04, 0); parts.body.castShadow = true; g.add(parts.body);
  if (o.collar) bx(g, .7, .12, .44, o.collar, 0, 1.46, 0);
  parts.armL = pv(g, -.46, 1.38, 0); parts.armR = pv(g, .46, 1.38, 0);
  for (const A of [parts.armL, parts.armR]) { bx(A, .22, .78, .24, f, 0, -.39, 0); bx(A, .24, .2, .26, o.paw || f, 0, -.86, 0); }
  parts.head = pv(g, 0, 1.46, 0); const head = headBox(B, 1.0, f, faceCanvas(o.face), .5); parts.head.add(head); parts.headMesh = head;
  for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(.3, .62, 4), mt(f)); ear.position.set(sx * .34, 1.2, 0); ear.rotation.y = Math.PI / 4; ear.castShadow = true; parts.head.add(ear); const inn = new THREE.Mesh(new THREE.ConeGeometry(.16, .4, 4), mt(o.earIn || '#f0a8b0')); inn.position.set(sx * .34, 1.12, .08); inn.rotation.y = Math.PI / 4; parts.head.add(inn); }
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) bx(parts.head, .4, .03, .03, '#f4f4f4', sx * .62, .3 - i * .1, .5, false);
  parts.tail = pv(g, 0, .82, -.26); bx(parts.tail, .16, .16, .5, f, 0, 0, -.25); bx(parts.tail, .16, .5, .16, f, 0, .25, -.5); bx(parts.tail, .16, .16, .16, o.paw || f, 0, .55, -.5);
  if (o.extras) o.extras(B, parts);
  g.scale.setScalar(o.scale || .72); return B;
}
// ---------- diseño de cada personaje ----------
const CHAR_DEF = {
  mike: () => dogBiped({ fur: '#ffc800', fur2: '#ff9a00', ear: '#f0b400', cape: '#1a9a8a', mark: '#d09000', face: { skin: '#ffc800', eyes: 'dog', ey: 12, ex: 7, mouth: 'open', paint: R => { R(11, 18, 10, 10, '#ffe480'); R(13, 18, 6, 4, '#1a1020'); R(12, 17, 8, 1, '#1a1020'); } }, extras: (B, p) => { const sw = new THREE.Group(); sw.position.set(0, -.74, .1); B.bx(sw, .1, .1, .22, '#6b3a1a', 0, 0, 0, false); B.bx(sw, .34, .08, .08, '#666', 0, 0, .14, false); const bl = B.bx(sw, .1, .08, 1.1, new THREE.MeshLambertMaterial({ color: 0x3fe0f5, emissive: 0x2ab8d8, emissiveIntensity: .8 }), 0, 0, .74, false); p.sword = sw; sw.rotation.x = -1.1; p.armR.add(sw); } }),
  exe: () => dogBiped({ fur: '#f2c230', fur2: '#c89a20', ear: '#d6a820', cape: '#c01830', belly: '#fff', face: { skin: '#f2c230', eyes: 'red', ey: 12, ex: 7, mouth: 'teeth', paint: R => { R(2, 4, 8, 2, '#1a1020'); R(22, 4, 8, 2, '#1a1020'); } }, scale: .8, extras: (B, p) => { B.bx(p.armR, .34, .3, .36, '#f4f4f4', 0, -.4, 0); B.bx(p.legL, .4, .22, .42, '#f4f4f4', 0, -.2, 0); B.bx(B.g, .9, .14, .56, '#d02040', 0, 1.3, 0); } }),
  willy: () => {
    const B = CB(), { g, parts, bx, pv } = B, f = '#3c3f50';
    bx(g, .78, .68, 1.2, f, 0, .88, 0); bx(g, .7, .12, 1.1, '#2a2d3a', 0, .55, 0);
    parts.legs = [[-.26, -.42], [.26, -.42], [-.26, .42], [.26, .42]].map(([x, z]) => { const l = pv(g, x, .58, z); bx(l, .26, .58, .28, f, 0, -.29, 0); bx(l, .3, .1, .34, '#2a2d3a', 0, -.54, .03); return l; });
    parts.head = pv(g, 0, 1.28, .62); const head = headBox(B, .84, f, faceCanvas({ skin: f, eyes: 'dog', ey: 12, ex: 7, mouth: 'tiny', paint: (R) => { R(9, 21, 14, 8, '#2a2d3a'); R(12, 19, 8, 5, '#111118'); R(14, 20, 3, 2, '#fff'); } }), .42); parts.head.add(head);
    for (const sx of [-1, 1]) { const e = bx(parts.head, .24, .52, .14, '#2a2d3a', sx * .32, .98, -.04); e.rotation.z = -sx * .2; }
    bx(parts.head, .12, .26, .12, f, .0, .98, -.06); parts.tail = pv(g, 0, 1.0, -.62); bx(parts.tail, .14, .6, .14, f, 0, .3, 0);
    bx(g, .7, .1, .1, '#c02030', 0, 1.2, .46, false);
    g.scale.setScalar(.8); return B;
  },
  ambrosio: () => humanoid({ skin: '#e08a5a', shirt: '#ddc000', sleeve: '#ddc000', sleeveShort: true, pants: '#2a3a5c', shoes: '#5a3a2a', hair: { type: 'swoosh', color: '#14101a' }, ears: '#b06840', face: { skin: '#e08a5a', eyes: 'cute', look: 2, mouth: 'smile', brow: null, blush: false }, chest: chestCanvas((R) => { R(0, 0, 24, 24, '#ddc000'); R(6, 8, 12, 9, '#fff'); R(6, 8, 12, 1, '#c8a800'); R(7, 9, 5, 3, '#ddc000'); R(12, 9, 5, 3, '#ddc000'); }), extras: (B) => { B.bx(B.g, .5, .5, .22, '#6a4a2a', .62, .8, .1); B.bx(B.g, .08, .9, .06, '#4a3a1a', 0, 1.0, .25, false); } }),
  trolino: () => humanoid({ skin: '#f8d0a8', shirt: '#e89018', pants: '#3aa8e8', shoes: '#f8d0a8', legSkin: true, hair: { type: 'bangs', color: '#101018' }, face: { eyes: 'angry', iris: '#2090e0', mouth: 'flat', skin: '#f8d0a8' }, chest: chestCanvas((R) => { R(0, 0, 24, 24, '#e89018'); R(8, 0, 8, 24, '#f8d0a8'); R(0, 18, 24, 3, '#d82020'); }), extras: (B, p) => { B.bx(p.head, .36, .22, .3, '#f0c020', .26, 1.12, .0); B.bx(p.head, .2, .16, .2, '#ff4a4a', .26, 1.26, 0, false); } }),
  timba: () => humanoid({ skin: '#f8d0b0', shirt: '#e03030', pants: '#2850d8', shoes: '#8a6a4a', hair: { type: 'spiky', color: '#2a7af0' }, face: { eyes: 'cute', mouth: 'open', iris: '#101018' }, chest: chestCanvas((R) => { R(0, 0, 24, 24, '#e03030'); for (const [x, y] of [[4, 4], [14, 9], [8, 15], [18, 18], [3, 20]]) R(x, y, 3, 3, '#40c040'); }), extras: (B, p) => { B.bx(p.head, 1.02, .16, .12, '#1a1a2a', 0, .94, .5); B.bx(p.head, .3, .18, .14, '#4a4a5a', -.28, .94, .52, false); B.bx(p.head, .3, .18, .14, '#4a4a5a', .28, .94, .52, false); } }),
  esparta: () => humanoid({ skin: '#f0d8c0', shirt: '#2a88d0', pants: '#4a4a55', shoes: '#40a8e8', hair: { type: 'hood', color: '#2a88d0' }, face: { eyes: 'closed', mouth: 'tiny', skin: '#f0d8c0' }, chest: chestCanvas((R) => { R(0, 0, 24, 24, '#2a88d0'); R(5, 3, 14, 18, '#fff'); R(8, 6, 8, 2, '#20d8e8'); R(8, 8, 2, 3, '#20d8e8'); R(8, 11, 8, 2, '#20d8e8'); R(14, 13, 2, 3, '#20d8e8'); R(8, 16, 8, 2, '#20d8e8'); }), extras: (B, p) => { B.bx(p.head, 1.04, .26, .16, '#7a4a2a', 0, .78, .48); } }),
  raptor: () => humanoid({ skin: '#f8d0b0', shirt: '#d82828', pants: '#2a5a9a', shoes: '#d82828', hair: { type: 'hood', color: '#d82828' }, face: { eyes: 'big', iris: '#30c030', mouth: 'open', ey: 14 }, chest: chestCanvas((R) => { R(0, 0, 24, 24, '#d82828'); R(10, 0, 4, 24, '#fff'); }), extras: (B, p) => { for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), B.mt('#4a4a3a')); m.position.set(sx * .3, 1.12, .05); p.head.add(m); const e = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), new THREE.MeshBasicMaterial({ color: 0x40e040 })); e.position.set(sx * .3, 1.18, .16); p.head.add(e); } B.bx(p.head, 1.0, .2, .14, '#7a4a2a', 0, .8, .5); B.bx(p.armR, .5, .06, .4, '#f0f0ff', 0, -.9, .25); } }),
  rius: () => humanoid({ skin: '#fff0dc', shirt: '#f4a820', pants: '#555566', shoes: '#333344', face: { eyes: 'angry', iris: '#d82020', mouth: null, brow: null }, chest: chestCanvas((R) => { R(0, 0, 24, 24, '#f4a820'); R(7, 0, 10, 24, '#fff0dc'); for (const y of [5, 11, 17]) { R(0, y, 5, 2, '#7a4a10'); R(19, y, 5, 2, '#7a4a10'); } }), extras: (B, p) => { for (const [x, z, h] of [[-.28, 0, .3], [0, .08, .42], [.28, 0, .3]]) B.bx(p.head, .3, h, .5, '#d82020', x, 1.06 + h / 2 - .1, z); B.bx(p.head, .34, .22, .42, '#ff8c10', 0, .38, .6, false); B.bx(p.head, .14, .22, .14, '#d82020', 0, .14, .56, false); const sw = B.bx(p.armR, .16, 1.3, .16, new THREE.MeshLambertMaterial({ color: 0x58b8ff, emissive: 0x2080c0, emissiveIntensity: .4 }), 0, -.9, .3, false); sw.rotation.x = -.4; B.bx(p.armR, .5, .1, .12, '#666', 0, -.94, .2, false); } }),
  mayo: () => humanoid({ skin: '#dcd6e0', shirt: '#ffffff', pants: '#c8c0d0', shoes: '#555566', hand: '#dcd6e0', face: { eyes: 'visor', skin: '#dcd6e0', paint: R => { R(2, 8, 28, 12, '#1a1428'); R(2, 9, 28, 10, '#5a4a80'); R(7, 10, 5, 8, '#20c8e8'); R(20, 10, 5, 8, '#20c8e8'); R(8, 11, 2, 3, '#fff'); R(21, 11, 2, 3, '#fff'); R(8, 22, 16, 6, '#1a1020'); R(9, 23, 14, 3, '#fff'); R(5, 3, 8, 2, '#1a1020'); R(19, 3, 8, 2, '#1a1020'); } }, chest: chestCanvas((R) => { R(0, 0, 24, 24, '#fff'); R(10, 0, 4, 14, '#4a3a5a'); R(0, 0, 4, 24, '#e8e8f0'); }), extras: (B, p) => { for (const sx of [-1, 1]) { const h = B.bx(p.head, .24, .5, .5, '#4a3a68', sx * .6, .5, 0); } B.bx(p.head, .08, .3, .08, '#9a9aa8', 0, 1.15, 0); B.bx(p.head, .16, .12, .16, '#ff4a4a', 0, 1.34, 0, false); } }),
  invictor: () => humanoid({ skin: '#f8d8c0', shirt: '#2a2a34', pants: '#d82828', shoes: '#3a3a44', hair: null, face: { eyes: 'big', iris: '#20b878', mouth: 'grin', blush: true, ey: 14 }, belt: '#ffc030', chest: chestCanvas((R) => { R(0, 0, 24, 24, '#2a2a34'); R(2, 2, 20, 3, '#3a3a46'); R(10, 12, 4, 4, '#ffc030'); R(2, 18, 20, 3, '#ffc030'); R(11, 2, 2, 8, '#d82828'); }), extras: (B, p) => {
    B.bx(p.head, 1.12, .5, 1.12, '#2e2e3a', 0, .88, 0); B.bx(p.head, 1.12, .96, .22, '#2e2e3a', 0, .42, -.46); B.bx(p.head, .16, .8, .62, '#2e2e3a', .56, .34, -.02); B.bx(p.head, .16, .8, .62, '#2e2e3a', -.56, .34, -.02);
    B.bx(p.head, .24, .56, 1.2, '#e02a2a', 0, 1.34, -.04); B.bx(p.head, .24, .22, .5, '#e02a2a', 0, 1.68, -.3);
    for (const sx of [-1, 1]) { B.bx(p.head, .3, .5, .16, '#c0652a', sx * .38, .56, .52); B.bx(p.head, .2, .34, .14, '#a8501e', sx * .5, .26, .5, false); }
    B.bx(B.g, .94, .42, .74, '#d82828', 0, .74, 0); B.bx(B.g, 1.0, 1.3, .08, '#c01c1c', 0, 1.0, -.32); for (const sx of [-1, 1]) B.bx(p['arm' + (sx < 0 ? 'L' : 'R')], .3, .16, .34, '#ffc030', 0, -.6, 0, false); for (const sx of [-1, 1]) B.bx(B.g, .12, .1, .1, '#ffc030', sx * .26, 1.48, .26, false);
  } }),
  aquela: () => catBiped({ fur: '#2ab8e0', paw: '#2ab8e0', chest: '#e8f8ff', earIn: '#1c3a9a', face: { skin: '#2ab8e0', eyes: 'big', iris: '#f4f4f4', mouth: 'cat', paint: R => { R(8, 18, 16, 12, '#e8f8ff'); R(6, 6, 4, 2, '#1c3a9a'); R(22, 6, 4, 2, '#1c3a9a'); } } }),
  acenix: () => catBiped({ fur: '#a4a9b6', paw: '#e6e8ee', chest: '#e6e8ee', collar: '#d82020', earIn: '#f0a8b0', face: { skin: '#a4a9b6', eyes: 'big', iris: '#d8e890', ey: 13, ex: 8, mouth: 'cat', blush: true, paint: R => { R(7, 17, 18, 13, '#e6e8ee'); R(14, 3, 4, 5, '#8a8f9e'); R(9, 5, 3, 3, '#8a8f9e'); R(20, 5, 3, 3, '#8a8f9e'); } }, extras: (B, p) => { B.bx(p.armR, .56, .06, .56, '#f4f4f8', 0, -.92, .32, false); B.bx(p.armR, .46, .26, .46, '#5a3018', 0, -.76, .32, false); B.bx(p.armR, .5, .12, .5, '#c8a080', 0, -.66, .32, false); B.bx(p.armR, .4, .2, .4, '#7a4222', 0, -.52, .32, false); B.bx(p.armR, .3, .12, .3, '#f4f0e8', 0, -.4, .32, false); const ch = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 5), B.mt('#d82020')); ch.position.set(0, -.3, .32); p.armR.add(ch); } }),
};
function citizenSpec(seed) {
  const q = mkRng(seed * 977 + 13), P = a => a[Math.floor(q() * a.length)];
  const skin = P(['#f8d0b0', '#e0a070', '#c68a5a', '#f0c8a0', '#8a5a3a']), hair = P(['#2a1a10', '#101018', '#7a4a2a', '#d8b040', '#c04a2a', '#6a6a7a']);
  return { skin, shirt: P(['#e04a4a', '#4a8ae0', '#58b848', '#e8a020', '#a050d0', '#30b8b8', '#e86aa0']), pants: P(['#2a3a5c', '#4a4a55', '#6a4a2a', '#2a5a3a']), shoes: '#3a2a2a', hair: { type: P(['short', 'bangs', 'curly', 'long', 'spiky']), color: hair }, face: { skin, eyes: 'cute', mouth: P(['smile', 'open', 'tiny']), blush: q() < .4, iris: P(['#2a2a3a', '#2060c0', '#208040']) }, scale: .66 + q() * .1 };
}
function makeChar(id, seed) {
  let B; if (id.startsWith('citizen')) B = humanoid(citizenSpec(parseInt(id.slice(7)) || seed || 1)); else B = (CHAR_DEF[id] || CHAR_DEF.mike)();
  B.id = id; B.flashOn = false; B.redOn = false; B.walk = 0; B.talkT = 0;
  return B;
}
function setFlash(B, on, red) {
  if (B.flashOn === on && B.redOn === !!red) return; B.flashOn = on; B.redOn = !!red;
  for (const m of B.mats) { if (!m.emissive) continue; if (on) { m.emissive.setHex(0xffffff); m.emissiveIntensity = .75; } else if (red) { m.emissive.setHex(0xff1030); m.emissiveIntensity = .38; } else { m.emissive.setHex(0x000000); m.emissiveIntensity = 1; } }
}
// animación de caminar/atacar/hablar (t: tiempo, sp: 0..1 velocidad)
function animChar(B, t, sp, o = {}) {
  const p = B.parts, s = Math.sin(t * 11) * sp * .9;
  if (p.legs) { p.legs[0].rotation.x = s; p.legs[3].rotation.x = s; p.legs[1].rotation.x = -s; p.legs[2].rotation.x = -s; if (p.tail) p.tail.rotation.y = Math.sin(t * 8) * .5; }
  if (p.legL) { p.legL.rotation.x = s; p.legR.rotation.x = -s; }
  if (p.armL) { p.armL.rotation.x = -s * .9 + (o.armUp ? -2.6 : 0) * 0; p.armR.rotation.x = s * .9; }
  if (o.atk != null && p.armR) { const k = o.atk; p.armR.rotation.x = -2.4 + k * 3.6; p.armR.rotation.z = -.2 + k * .2; if (p.sword) p.sword.rotation.x = -1.5 + k * 1.2; }
  else if (p.sword) p.sword.rotation.x = -1.1;
  if (p.armR && o.wave) p.armR.rotation.z = -2.2 + Math.sin(t * 9) * .4;
  const bob = sp > .05 ? Math.abs(Math.sin(t * 11)) * .09 : Math.sin(t * 2.2) * .02; B.g.position.y = (o.lift || 0) + bob;
  if (p.head) { p.head.rotation.x = o.talk ? Math.sin(t * 14) * .07 : 0; p.head.rotation.y = o.look || 0; }
  if (p.tail && !p.legs) p.tail.rotation.y = Math.sin(t * 6) * .4;
}
