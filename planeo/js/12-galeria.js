/* 12 · galería: todos los modelos 3D de cada estilo, girando, para compararlos */
'use strict';
const Story = { d: { done: [false, false, false], unlocked: 3, best: {} } }, particles = [], G = { up: 1, tAnim: 0, state: 'gal', P: 0, vP: 0, x: MID, shake: 0, fade: 0, hearts: 3, starT: 0, magT: 0 };
function playerName(){ return 'Nuki'; }
(function(){
  const $$ = id => document.getElementById(id);
  if (!g3Init()){ document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;inset:0;display:grid;place-items:center;background:#1b2250;padding:24px;text-align:center">Este dispositivo no admite WebGL.</div>'); return; }
  GR.mesh.visible = GR.far.visible = false; TRK.air.visible = TRK.road.visible = false; PL.root.visible = PL.shadow.visible = false; SK.mount.visible = false; window.__postOff = true;
  S3.fog.near = 400; S3.fog.far = 900; LT.hemi.intensity = 0.75; LT.sun.intensity = 0.75; LT.sun.position.set(-20, 40, 30);
  SK.mat.uniforms.uTop.value.setRGB(0.42, 0.62, 0.95); SK.mat.uniforms.uBot.value.setRGB(0.92, 0.95, 1.0); S3.fog.color.setRGB(0.92, 0.95, 1.0);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xcfe6ff })); floor.position.y = -0.02; S3.add(floor);
  const CATS = {
    'Enemigos': ['bee', 'comet', 'bat', 'drone', 'slime', 'boulder', 'bunny', 'mole', 'gate'], 'Bloques': ['crystal', 'thunderbox', 'crate', 'spikerock'], 'Objetos': ['acorn', 'gold', 'heart', 'shield', 'star', 'magnet'],
    'Jefes': ['crow', 'storm', 'owl'], 'Jugador': ['plane:nuki', 'plane:nuki_cielo', 'plane:nuki_rosa', 'plane:abuelo', 'plane:pipa', 'plane:chispa', 'plane:rama'], 'Personajes': ['fig:nuki', 'fig:abuelo', 'fig:pipa', 'fig:chispa', 'fig:rama'],
    'Decorado': ['stree', 'srock', 'house', 'windmill', 'balloon', 'islet', 'puff', 'flock', 'flower', 'tuft']
  };
  const NAMES = { bee: 'Abeja', comet: 'Cometa', bat: 'Murciélago', drone: 'Dron', slime: 'Baba', boulder: 'Bola rodante', bunny: 'Conejo', mole: 'Topo', gate: 'Valla', crystal: 'Cristal', thunderbox: 'Caja de tormenta', crate: 'Caja', spikerock: 'Roca', acorn: 'Bellota', gold: 'Bellota dorada', heart: 'Corazón', shield: 'Escudo', star: 'Estrella', magnet: 'Imán', crow: 'Capitán Grajo', storm: 'Nubarrón Trueno', owl: 'Don Búho', stree: 'Árbol', srock: 'Roca', house: 'Casa', windmill: 'Molino', balloon: 'Globo', islet: 'Islote', puff: 'Nube', flock: 'Bandada', flower: 'Flor', tuft: 'Hierba' };
  const DESC = { A: 'Estilo A · Peluche: formas gorditas y suaves, colores caramelo y contorno de tinta.', B: 'Estilo B · Papercraft low-poly: facetas planas, colores vivos, sin contorno.' };
  let style = 'A', cat = 'Enemigos', root = new THREE.Group(), items = [], yaw = 0, drag = null, auto = true, camDist = 30;
  S3.add(root);
  function label(txt){ const c = document.createElement('canvas'); c.width = 320; c.height = 72; const x = c.getContext('2d'); x.font = '700 38px Fredoka, sans-serif'; x.textAlign = 'center'; x.lineWidth = 8; x.strokeStyle = 'rgba(20,28,80,.85)'; x.fillStyle = '#fff'; x.strokeText(txt, 160, 50); x.fillText(txt, 160, 50);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, depthTest: false })); s.scale.set(6.4, 1.44, 1); s.renderOrder = 10; return s; }
  function make(id){
    if (id.startsWith('plane:')){ const sk = SKIN_BY[id.slice(6)]; return { g: buildPlaneModel(sk, false), name: sk.name, size: 6, plane: true }; }
    if (id.startsWith('fig:')){ const sk = SKIN_BY[id.slice(4)]; const g = buildFigure(sk); return { g, name: sk.name, size: 6.2, fig: sk }; }
    if (['crow', 'storm', 'owl'].includes(id)){ const g = BM[id](); return { g, name: NAMES[id], size: 7.5 }; }
    const mk = MK[id]; return { g: mk.make(), name: NAMES[id] || id, size: ['stree', 'house', 'windmill', 'balloon', 'islet', 'puff', 'flock'].includes(id) ? 6.8 : 5.0, mk };
  }
  function build3(){
    S3.remove(root); root = new THREE.Group(); S3.add(root); items = [];
    const ids = CATS[cat], cols = Math.min(ids.length, ids.length > 6 ? 5 : 4), gap = cat === 'Jefes' ? 11 : 7;
    ids.forEach((id, i) => {
      const r = make(id), g = r.g, box = new THREE.Box3().setFromObject(g), sz = new THREE.Vector3(); box.getSize(sz); const k = r.size / Math.max(sz.x, sz.y, sz.z, 0.01); g.scale.multiplyScalar(k);
      const b2 = new THREE.Box3().setFromObject(g), c = new THREE.Vector3(); b2.getCenter(c);
      const row = Math.floor(i / cols), col = i % cols, inRow = Math.min(cols, ids.length - row * cols), x = (col - (inRow - 1) / 2) * gap, z = -row * gap * 1.5;
      const wrap = new THREE.Group(); g.position.sub(c); wrap.add(g); const raise = (b2.max.y - b2.min.y) / 2 + (r.mk && r.mk.ground ? 0.2 : 1.6); wrap.position.set(x, raise, z); root.add(wrap);
      const lb = label(r.name); lb.position.set(x, 0.4, z + 3.2); root.add(lb); if (r.fig){ g.rotation.y = 0.3; }
      items.push({ wrap, g, r, base: g.position.clone(), baseS: g.scale.x, v: i * 0.37, y0: raise });
    });
    const rows = Math.ceil(ids.length / cols); root.userData = { rows, cols, gap }; camDist = Math.max(24, cols * gap * 0.62 + rows * 7);
    $$('desc').textContent = DESC[style];
  }
  function setStyle(id){ style = id; setModelStyle(id, false); build3(); ui(); }
  function ui(){ $$('styles').innerHTML = ['A', 'B'].map(s => `<button class="${s === style ? 'on' : ''}" data-s="${s}">Estilo ${s}${s === 'A' ? ' · Peluche' : ' · Low-poly'}</button>`).join(' '); $$('cats').innerHTML = Object.keys(CATS).map(c => `<button class="${c === cat ? 'on' : ''}" data-c="${c}">${c}</button>`).join(''); }
  document.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.s) setStyle(b.dataset.s); else if (b.dataset.c){ cat = b.dataset.c; build3(); ui(); } });
  const cv = $$('g3'); let dyaw = 0; cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y0: dyaw }; cv.setPointerCapture(e.pointerId); }); cv.addEventListener('pointermove', e => { if (drag) dyaw = drag.y0 + (e.clientX - drag.x) * 0.01; }); cv.addEventListener('pointerup', () => { drag = null; });
  window.addEventListener('resize', g3Resize);
  let last = performance.now(), T = 0;
  function loop(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; G.tAnim = T;
    for (const it of items){ const g = it.g; g.position.copy(it.base); g.scale.setScalar(it.baseS); const sway = Math.sin(T * 0.7 + it.v) * 0.6 + dyaw;
      if (it.r.fig){ g.rotation.y = sway * 0.8; animFigure(g, T + it.v, 0.0, 'happy', 0); }
      else if (it.r.plane){ g.userData.prop.rotation.z = T * 30; g.rotation.set(-0.1, 2.9 + sway * 0.6, 0); }
      else if (it.r.mk){ const ob = { v: it.v, P: 100 + it.v * 10, ga: 0, gb: 0, per: 2, ph: 0, locked: false, hop: true, seq: [0, 1, 2, 1], type: 'x' }; g.rotation.y = sway; if (it.r.mk.anim){ try { it.r.mk.anim(g, ob, T, T, { z: 10, look: Math.sin(T) * 0.5 }); } catch (e) {} } }
      else { g.rotation.y = sway; const u = g.userData; if (u.wl){ const f = Math.sin(T * 5) * 0.5; u.wl.rotation.z = 0.35 + f; u.wr.rotation.z = -0.35 - f; } if (u.bolts) u.bolts.forEach((b, i) => b.visible = Math.sin(T * 9 + i * 2) > -0.2); } }
    const rows = root.userData.rows || 1, gap = root.userData.gap || 8, cols = root.userData.cols || 4, asp = W / H, zc = ((cols * gap) / 2 + 5) / (0.466 * Math.min(asp, 2.2)) * 1.04, dist = zc;
    CAM3.fov = 50; CAM3.updateProjectionMatrix(); CAM3.position.set(0, 6 + rows * 3.6 + dist * 0.14, dist - (rows - 1) * gap * 0.35); CAM3.lookAt(0, 2.5, -(rows - 1) * gap * 0.75); SK.dome.position.copy(CAM3.position); SK.mat.uniforms.uTime.value = T; R3.render(S3, CAM3); requestAnimationFrame(loop);
  }
  ui(); build3(); window.__gal = { setStyle, get items(){ return items; } }; requestAnimationFrame(loop);
})();
