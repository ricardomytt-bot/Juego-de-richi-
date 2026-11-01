/* 05d · sincroniza el mundo del juego (obstáculos, enemigos, objetos, decorado, fantasmas) con la escena 3D */
'use strict';
let PLATES = null, plateN = 0, GH3 = [];
const PLATE_COL = { crystal: [90, 220, 255], thunderbox: [255, 220, 60], crate: [255, 150, 50], spikerock: [255, 80, 80], bee: [255, 205, 40], slime: [200, 90, 255],
  comet: [255, 90, 40], boulder: [230, 140, 70], bat: [220, 70, 170], bunny: [255, 150, 190], drone: [70, 255, 200], mole: [210, 150, 90], gate: [255, 230, 60] };
function elevJS(zAbs, lat, hK){
  const a = Math.abs(lat), amp = smooth(clamp((a - 2.6) / 3.2, 0, 1)); if (amp <= 0 || hK <= 0) return 0;
  const n = 0.5 + 0.28 * Math.sin(zAbs * 0.019 + lat * 0.8) + 0.22 * Math.sin(zAbs * 0.047 - lat * 1.7 + 1.3);
  return amp * n * HILLH * hK;
}
function platesInit(){
  if (PLATES) return; PLATES = [];
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  for (let i = 0; i < 40; i++){ const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); m.renderOrder = 3; m.frustumCulled = false; m.visible = false; S3.add(m); PLATES.push(m); }
  const lg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); PLATES.line = [];
  for (let i = 0; i < 40; i++){ const m = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.renderOrder = 4; m.frustumCulled = false; m.visible = false; S3.add(m); PLATES.line.push(m); }
}
function usePlate(x, z, w, len, col, op){
  if (plateN >= PLATES.length) return;
  const m = PLATES[plateN], l = PLATES.line[plateN]; plateN++;
  m.visible = l.visible = true; m.position.set(x, 0.06, z); m.scale.set(w, 1, len); m.material.color.setRGB(col[0] / 255, col[1] / 255, col[2] / 255); m.material.opacity = op;
  l.position.set(x, 0.07, z); l.scale.set(w, 1, 0.22); l.material.opacity = Math.min(0.9, op * 1.6);
}
function plates_end(){ for (let i = plateN; i < PLATES.length; i++) PLATES[i].visible = PLATES.line[i].visible = false; }

function ghostsSync(P, t){
  for (let i = 0; i < G.ghosts.length; i++){
    const gh = G.ghosts[i]; let e = GH3[i];
    if (!e || e.name !== gh.name){ if (e){ S3.remove(e.root); }
      const root = new THREE.Group(), pl = buildPlaneModel(new THREE.Color(gh.color).getHex(), true), c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
      x.font = '700 34px sans-serif'; x.textAlign = 'center'; x.lineWidth = 7; x.strokeStyle = 'rgba(20,30,70,.8)'; x.fillStyle = '#fff'; x.strokeText(gh.name, 128, 42); x.fillText(gh.name, 128, 42);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); sp.scale.set(4.2, 1.05, 1); sp.position.y = 2.8; root.add(pl, sp); S3.add(root); e = GH3[i] = { root, pl, name: gh.name }; }
    const s = ghostAt(gh, G.state === 'countdown' ? 0 : G.t);
    if (!s){ e.root.visible = false; continue; }
    const z = s.P - P; e.root.visible = z > -6 && z < 190; e.root.position.set(wxOf(s.x), PLAY_Y, -s.P); e.pl.userData.prop.rotation.z = t * 40;
  }
  for (let i = G.ghosts.length; i < GH3.length; i++) if (GH3[i]) GH3[i].root.visible = false;
}

function syncWorld(dt, P, D3, air){
  platesInit(); poolsBegin(); plateN = 0;
  const t = G.tAnim, gt = G.t, drop2 = dropOf(P), hK = clamp(1 - drop2 / 140, 0, 1), a = altFrac(P);
  const place = (ob, zAbs, type) => {
    const mk = MK[type]; if (!mk) return null;
    const key = (type === 'stree') ? 'stree' + (THEME === THEMES.dawn ? 'd' : THEME === THEMES.storm ? 's' : 'u') + (ob.v > 0.5 ? 1 : 0) : type;
    const g = acquire(key, mk.make);
    const lane = (type === 'gate' || ob.lat !== undefined) ? 0 : laneOf(ob, gt);
    g.position.set(ob.lat !== undefined ? ob.lat * LW : (type === 'gate' ? 0 : wxOf(lane)), 0, -zAbs);
    g.rotation.set(0, 0, 0);
    return { g, mk, lane };
  };
  const yAir = 1.15;
  const o = LV.objs;
  for (let i = lowerBound(o, P - 8); i < o.length && o[i].P < P + 200; i++){
    const ob = o[i]; if (ob.taken || ob.dead) continue;
    const r = place(ob, ob.P, ob.type); if (!r) continue; const { g, mk, lane } = r, z = ob.P - P;
    if (PICK_SET.has(ob.type)) g.position.y = yAir - 0.1; else if (mk.ground) g.position.y = -D3 + (g.userData.hy || 0); else g.position.y = yAir;
    if (mk.anim) mk.anim(g, ob, t, gt, { z, look: (G.x - lane) * 0.9 });
    // placa de color en el carril
    const col = PLATE_COL[ob.type]; if (col && z > -3 && z < 170){
      const fade = clamp((170 - z) / 60, 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * 7 + ob.P);
      if (ob.type === 'gate'){ const on = gateOn(ob, gt), fl = gateFlicker(ob, gt); usePlate(wxOf((ob.ga + ob.gb) / 2), -ob.P, (ob.gb - ob.ga + 1) * LW, 3.6, on ? [255, 230, 60] : fl ? [255, 150, 40] : [120, 220, 140], (on ? 0.55 : 0.3) * fade); }
      else if (ob.type === 'mole') usePlate(wxOf(ob.lane), -ob.P, LW, 3.6, z > 16 ? col : [255, 70, 50], (0.42 + 0.16 * pulse) * fade);
      else { if (ob.a !== undefined) usePlate(wxOf((ob.a + ob.b) / 2), -ob.P, (ob.b - ob.a + 1) * LW, 3.2, col, 0.1 * fade); usePlate(wxOf(lane), -ob.P, LW, 3.6, col, (0.44 + 0.16 * pulse) * fade); }
    }
  }
  for (const d of LV.dyn){
    if (d.dead) continue; const z = d.pe - P; if (z < -6 || z > 200) continue;
    const r = place(d, d.pe, d.type); if (!r) continue; const { g, mk, lane } = r;
    g.position.y = mk.ground ? -D3 + (g.userData.hy || 0) : yAir;
    if (mk.anim) mk.anim(g, d, t, gt, { z, look: (G.x - lane) * 0.9 });
    const col = PLATE_COL[d.type]; if (col && z > -3 && z < 170){ const fade = clamp((170 - z) / 60, 0, 1), pulse = 0.5 + 0.5 * Math.sin(t * 12 + d.P);
      usePlate(wxOf(lane), -d.pe, LW, 3.6, d.locked ? [255, 40, 40] : col, (0.46 + 0.18 * pulse) * fade); }
  }
  // decorado
  const sc = LV.scenery;
  for (let i = lowerBound(sc, P - 8); i < sc.length && sc[i].P < P + 210; i++){
    const ob = sc[i], z = ob.P - P, type = ob.type;
    if (type === 'puff'){ if (D3 < 20 && ob.h < 150) continue; if (ob.h < -D3 * 0.5 && a > 0.5) continue; }
    else if (type === 'islet'){ if (a <= 0.45) continue; } else if (type === 'flock'){ if (a <= 0.2) continue; } else if (type === 'balloon'){ if (a <= 0.1) continue; }
    else if ((type === 'house' || type === 'windmill') && drop2 >= 90) continue;
    else if ((type === 'flower' || type === 'tuft') && drop2 >= 120) continue;
    const mk = MK[type === 'stree' ? 'stree' : type]; if (!mk) continue;
    const r = place(ob, ob.P, type); if (!r) continue; const g = r.g;
    const e = elevJS(ob.P, ob.lat, hK);
    if (type === 'puff') { g.position.y = ob.h * 0.045 - 2; g.scale.setScalar(ob.sc * 1.5); }
    else if (type === 'islet') { g.position.y = 4 + ob.h * 0.06; g.scale.setScalar(ob.sc * 2.4); }
    else if (type === 'flock') { g.position.y = 6 + ob.h * 0.05; g.scale.setScalar(ob.sc * 1.2); }
    else if (type === 'balloon') { g.position.y = 4 + ob.h * 0.05; g.scale.setScalar(ob.sc * 1.5); }
    else { g.position.y = -D3 + e + (g.userData.hy || 0) * (ob.sc || 1); g.scale.setScalar(type === 'stree' ? ob.sc * 1.05 : type === 'house' || type === 'windmill' ? ob.sc * 1.2 : (ob.sc || 1)); }
    if (mk.anim) mk.anim(g, ob, t, gt, { z });
  }
  if (typeof groundPropsSync === 'function') groundPropsSync(P, D3, drop2, t);
  if (typeof syncBoss === 'function') syncBoss(dt, P, D3);
  poolsEnd(); plates_end(); ghostsSync(P, t);
}
const PICK_SET = new Set(['acorn', 'gold', 'heart', 'shield', 'star', 'magnet']);
