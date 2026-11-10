// Render 3D (Three.js) del mismo juego: usa el estado de la partida y lo dibuja en 3D con aspecto de baja resolución
const Render3D = (() => {
  const T = typeof THREE !== 'undefined' ? THREE : null;
  const W3 = 640, H3 = 360, WALLH = 1.05;
  let ren = null, scene = null, cam = null, ok = false, built = null, cv = null;
  const MM = {}, cm = c => MM[c] || (MM[c] = new T.MeshLambertMaterial({ color: c }));
  const BM = {}, bm = c => BM[c] || (BM[c] = new T.MeshBasicMaterial({ color: c }));
  let BOXG, SPHG, CYLG, CONG;

  function init() {
    if (ok) return true; if (!T) return false;
    try {
      cv = document.getElementById('gl'); if (!cv) return false;
      ren = new T.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' });
      ren.setPixelRatio(1); ren.setSize(W3, H3, false); if ('useLegacyLights' in ren) ren.useLegacyLights = true;
      scene = new T.Scene(); cam = new T.PerspectiveCamera(46, W3 / H3, 0.1, 90);
      BOXG = new T.BoxGeometry(1, 1, 1); SPHG = new T.SphereGeometry(1, 12, 9); CYLG = new T.CylinderGeometry(1, 1, 1, 12); CONG = new T.ConeGeometry(1, 1, 12);
      ok = true;
    } catch (e) { ok = false; }
    return ok;
  }
  const box = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new T.Mesh(BOXG, typeof c === 'string' ? cm(c) : c); m.scale.set(w, h, d); m.position.set(x, y, z); return m; };
  const sph = (r, c, x = 0, y = 0, z = 0, sy = 1) => { const m = new T.Mesh(SPHG, typeof c === 'string' ? cm(c) : c); m.scale.set(r, r * sy, r); m.position.set(x, y, z); return m; };
  const CYLC = {};
  const cyl = (rt, rb, h, c, x = 0, y = 0, z = 0) => { const k = rt + '_' + rb; const geo = rt === rb ? CYLG : (CYLC[k] || (CYLC[k] = new T.CylinderGeometry(rt, rb, 1, 12))); const m = new T.Mesh(geo, typeof c === 'string' ? cm(c) : c); if (rt === rb) m.scale.set(rt, h, rt); else m.scale.set(1, h, 1); m.position.set(x, y, z); return m; };
  const cone = (r, h, c, x = 0, y = 0, z = 0) => { const m = new T.Mesh(CONG, typeof c === 'string' ? cm(c) : c); m.scale.set(r, h, r); m.position.set(x, y, z); return m; };

  // ---------------- objetos de la casa ----------------
  function makeObj(o) {
    const g = new T.Group(); let upd = null; const w = o.w || 1, h = o.h || 1;
    const key = o.type === 'deco' ? 'd_' + o.kind : o.type;
    switch (key) {
      case 'chest': { const lid = box(.88, .22, .62, '#b87a3c', 0, .58, 0); const lock = box(.14, .16, .05, '#ffd23f', 0, .46, .32); g.add(box(.82, .46, .58, '#8a5a2a', 0, .23, 0), lid, box(.12, .5, .64, '#4a3010', 0, .25, 0), lock); upd = o => { lid.rotation.x = o.opened ? -1.15 : 0; lid.position.set(0, o.opened ? .7 : .58, o.opened ? -.34 : 0); lock.visible = !o.opened; }; break; }
      case 'wardrobe': { const dl = box(.42, 1.3, .06, '#92603a', -.22, .78, .37), dr = box(.42, 1.3, .06, '#92603a', .22, .78, .37); g.add(box(.9, 1.55, .7, '#6a4020', 0, .78, 0), dl, dr, box(.06, .2, .08, '#ffd23f', -.05, .78, .42), box(.06, .2, .08, '#ffd23f', .05, .78, .42)); upd = o => { dl.rotation.y = o.opened ? -1.6 : 0; dr.rotation.y = o.opened ? 1.6 : 0; dl.position.x = o.opened ? -.5 : -.22; dr.position.x = o.opened ? .5 : .22; }; break; }
      case 'fridge': { const door = box(.84, 1.4, .08, '#f4fcff', 0, .86, .42); g.add(box(.88, 1.6, .8, '#dce8f0', 0, .82, 0), door, box(.06, .5, .08, '#8a9aa8', .32, 1.0, .5), box(.14, .14, .04, '#e04a6a', -.2, 1.0, .47)); upd = o => { door.rotation.y = o.opened ? -1.2 : 0; door.position.x = o.opened ? -.42 : 0; door.position.z = o.opened ? .8 : .42; }; break; }
      case 'safe': case 'vault': { const gold = key === 'safe'; const dr = box(.78, 1.0, .1, gold ? '#a88830' : '#9a9ab4', 0, .62, .4); g.add(box(.9, 1.2, .8, gold ? '#c8a040' : '#6a6a80', 0, .62, 0), dr, sph(.22, gold ? '#f0d070' : '#c0c0d8', 0, .62, .5, .5)); upd = o => { dr.rotation.y = o.opened ? -1.7 : 0; dr.position.set(o.opened ? -.42 : 0, .62, o.opened ? .82 : .4); }; break; }
      case 'mechbox': { const lid = box(.84, .2, .62, '#5a5a72', 0, .74, 0), gear = cyl(.2, .2, .08, '#c0c0d8', 0, .46, .31); gear.rotation.x = Math.PI / 2; g.add(box(.84, .6, .62, '#6a6a82', 0, .3, 0), lid, gear); upd = (o, t) => { lid.rotation.x = o.opened ? -1.1 : 0; lid.position.set(0, o.opened ? .85 : .74, o.opened ? -.34 : 0); gear.visible = !o.opened; if (!o.opened) gear.rotation.y = t * 0.8; }; break; }
      case 'crate': { const lid = box(.9, .12, .66, '#9a7038', 0, .82, 0); g.add(box(.86, .76, .62, '#b8884c', 0, .38, 0), lid, box(.1, .8, .66, '#7a5a2c', 0, .4, 0), box(.9, .1, .66, '#7a5a2c', 0, .38, 0)); upd = o => { lid.rotation.z = o.opened ? .5 : 0; lid.position.set(o.opened ? .3 : 0, o.opened ? .95 : .82, 0); }; break; }
      case 'microwave': { g.add(box(.9, .8, .6, '#5a3a20', 0, .4, 0)); const body = box(.8, .42, .5, '#c8c8d8', 0, .98, 0), door = box(.52, .34, .04, '#2a3a4a', -.1, .98, .27), lamp = box(.5, .3, .02, '#ffe890', -.1, .98, .255); g.add(body, door, lamp, box(.1, .1, .03, '#e04040', .3, 1.05, .26)); upd = (o, t) => { door.rotation.y = o.opened ? -1.5 : 0; door.position.set(o.opened ? -.4 : -.1, .98, o.opened ? .42 : .27); lamp.visible = !!o.opened; lamp.material = bm(o.cooking ? ((t * 6 | 0) % 2 ? '#ff9a3a' : '#ffd23f') : (o.food ? '#e08a3a' : '#fff6c0')); }; break; }
      case 'recharge': { const pad = box(.9, .1, .9, '#3a3a4c', 0, .05, 0), glow = box(.7, .04, .7, bm('#3ae07a'), 0, .12, 0), bolt = box(.14, .5, .14, bm('#ffd23f'), 0, .4, 0); g.add(pad, glow, bolt); upd = (o, t) => { const on = !S3().blackout; glow.material = bm(on ? (S3().p.charging && (t * 8 | 0) % 2 ? '#ffd23f' : '#3ae07a') : '#2a2a30'); bolt.visible = on; bolt.position.y = .45 + Math.sin(t * 3) * .06; }; break; }
      case 'table': g.add(box(.96, .1, .9, '#b88450', 0, .8, 0), box(.1, .8, .1, '#7a5030', -.4, .4, -.35), box(.1, .8, .1, '#7a5030', .4, .4, -.35), box(.1, .8, .1, '#7a5030', -.4, .4, .35), box(.1, .8, .1, '#7a5030', .4, .4, .35), box(.3, .08, .2, '#9a9ab4', -.2, .89, 0), box(.16, .16, .16, '#e04040', .22, .94, .1)); break;
      case 'computer': { const scr = box(.5, .36, .04, bm('#46f09a'), 0, 1.0, 0); g.add(box(.9, .7, .6, '#4a4a60', 0, .35, 0), box(.6, .46, .08, '#2a2a38', 0, 1.0, -.04), scr); upd = (o, t) => { scr.material = bm(S3().blackout ? ((t * 3 | 0) % 2 ? '#ff5050' : '#501818') : '#46f09a'); }; break; }
      case 'exit': { const sh = box(.98, 1.7, .22, '#7a7a8a', 0, .85, 0), kp = box(.26, .36, .08, '#18181e', .6, 1.0, .1), led = box(.16, .08, .02, bm('#e04040'), .6, 1.12, .15); g.add(box(1.2, 1.9, .34, '#4a4a60', 0, .95, 0), sh, kp, led, box(.4, .4, .06, bm('#3a3a4a'), 0, 1.0, .13)); upd = o => { sh.visible = !o.shutter; led.material = bm(o.escape ? '#3ae07a' : (o.powered ? '#ffd23f' : '#e04040')); }; break; }
      case 'stairs': { for (let i = 0; i < 5; i++) g.add(box(.9, .12 + i * .13, .18, o.to === 1 ? '#8a7aa0' : '#5a4a70', 0, (.12 + i * .13) / 2, o.to === 1 ? .36 - i * .18 : -.36 + i * .18)); g.add(box(.2, .2, .2, bm('#ffd23f'), 0, 1.0 + Math.sin(0) * 0, 0)); upd = (o, t) => { g.children[5].position.y = 1.0 + Math.sin(t * 3) * .08; }; break; }
      case 'gap': { g.add(box(w, .02, h, '#05030a', 0, .04, 0)); for (const [dx, dz, sw, sd] of [[0, -h / 2, w, .12], [0, h / 2, w, .12], [-w / 2, 0, .12, h], [w / 2, 0, .12, h]]) g.add(box(sw, .08, sd, '#2a1a10', dx, .04, dz)); const br = new T.Group(); for (let i = 0; i < w * 4; i++) br.add(box(.2, .06, h - .3, '#c8935a', -w / 2 + .15 + i * .25, .1, 0)); br.add(box(w - .1, .08, .12, '#3a2210', 0, .1, -h / 2 + .25), box(w - .1, .08, .12, '#3a2210', 0, .1, h / 2 - .25)); g.add(br); upd = o => { br.visible = !!o.bridged; }; break; }
      case 'fusebox': { const l1 = box(.1, .1, .02, bm('#e04040'), 0, 1.15, .14); g.add(box(.6, .9, .25, '#5a5a70', 0, .85, 0), box(.5, .7, .04, '#3a3a50', 0, .85, .12), l1); upd = o => { l1.material = bm(o.powered ? '#3ae07a' : '#e04040'); }; break; }
      case 'd_sofa': g.add(box(w - .1, .45, .8, '#3a62b0', 0, .25, 0), box(w - .1, .6, .22, '#2a4a90', 0, .6, -.32), box(.2, .6, .8, '#2a4a90', -w / 2 + .1, .35, 0), box(.2, .6, .8, '#2a4a90', w / 2 - .1, .35, 0)); break;
      case 'd_table': g.add(box(w - .1, .1, h - .15, '#b88450', 0, .8, 0)); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(.1, .8, .1, '#7a5030', sx * (w / 2 - .2), .4, sz * (h / 2 - .2))); if (w > 1) g.add(sph(.12, '#e04040', w / 2 - .5, .95, 0, 0.7)); break;
      case 'd_desk': g.add(box(w - .1, .1, .8, '#7a5030', 0, .75, 0), box(.1, .75, .7, '#5a3a20', -w / 2 + .15, .38, 0), box(.1, .75, .7, '#5a3a20', w / 2 - .15, .38, 0), box(.3, .04, .4, '#f4ecd8', -.3, .81, 0)); break;
      case 'd_shelf': g.add(box(w - .1, 1.5, .5, '#6a4020', 0, .75, 0)); for (let r = 0; r < 3; r++) for (let k = 0; k < w * 3; k++) g.add(box(.2, .3, .3, ['#e04040', '#4a8aff', '#ffd23f', '#3ae07a', '#c060e0'][(k + r) % 5], -w / 2 + .3 + k * .32, .35 + r * .45, .08)); break;
      case 'd_bed': g.add(box(w - .1, .4, h - .1, '#7a5030', 0, .2, 0), box(w - .3, .22, h - .3, '#f0e8f8', 0, .5, 0), box(.7, .2, .5, '#fff', -w / 4, .7, -h / 2 + .45), box(.7, .2, .5, '#fff', w / 4, .7, -h / 2 + .45), box(w - .3, .26, h / 2, '#4a88d0', 0, .62, h / 4)); break;
      case 'd_car': { g.add(box(w - .2, .6, h - .3, '#d04848', 0, .5, 0), box(w * .45, .5, h - .5, '#9ac4e0', -.1, 1.0, 0)); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const wh = cyl(.28, .28, .22, '#1a1a22', sx * (w / 2 - .7), .28, sz * (h / 2 - .1)); wh.rotation.x = Math.PI / 2; g.add(wh); } g.add(box(.12, .18, .3, bm('#ffe890'), w / 2 - .1, .6, -h / 4), box(.12, .18, .3, bm('#ffe890'), w / 2 - .1, .6, h / 4)); break; }
      case 'd_plant': g.add(cyl(.28, .22, .4, '#c8643a', 0, .2, 0), sph(.4, '#38c060', 0, .75, 0, 1.1), sph(.25, '#2aa04a', .22, .55, .1), sph(.22, '#2aa04a', -.2, .6, -.1)); break;
      case 'd_lamp': g.add(cyl(.05, .05, 1.1, '#6a5a4a', 0, .55, 0), cyl(.3, .18, .35, bm('#ffd878'), 0, 1.2, 0), cyl(.2, .2, .04, '#3a2a1a', 0, .02, 0)); break;
      case 'd_stove': g.add(box(.9, .8, .8, '#9a9ab0', 0, .4, 0), box(.7, .04, .6, '#2a2a38', 0, .82, 0), box(.5, .3, .04, '#3a3a4a', 0, .35, .4)); break;
      case 'd_boxes': g.add(box(.8, .55, .7, '#d09a52', 0, .28, 0), box(.55, .4, .5, '#e0aa62', .05, .75, 0), box(.1, .56, .72, '#f0d08a', 0, .28, 0)); break;
      case 'd_tv': g.add(box(w - .1, .8, .12, '#3a3a50', 0, 1.0, -.2), box(w - .3, .6, .02, bm('#3a78c8'), 0, 1.0, -.13), box(w - .3, .5, .5, '#5a3a20', 0, .25, -.1)); break;
      default: g.add(box(.6, .6, .6, '#888', 0, .3, 0));
    }
    g.position.set(o.x + w / 2, 0, o.y + h / 2); g.userData.upd = upd; return g;
  }
  let _S = null; const S3 = () => _S;

  // ---------------- personajes ----------------
  function hatMesh(id, style, top) {
    const g = new T.Group();
    switch (id) {
      case 'explorer': g.add(cyl(.5, .5, .05, '#d8b060', 0, 0, 0), cyl(.3, .32, .22, '#c8a050', 0, .12, 0)); break;
      case 'helmet': g.add(sph(.4, '#ffd23f', 0, -.04, 0, .8), box(.06, .2, .3, '#e8a010', 0, .26, 0)); break;
      case 'band': g.add(cyl(.38, .38, .08, '#ff4a4a', 0, -.1, 0)); break;
      case 'cross': g.add(cyl(.36, .36, .1, '#fff', 0, -.08, 0), box(.05, .16, .02, '#e03030', 0, 0, .34), box(.16, .05, .02, '#e03030', 0, 0, .34)); break;
      case 'mask': g.add(box(.6, .22, .4, '#3a3a58', 0, -.5, .06)); break;
      case 'cam': g.add(box(.3, .2, .16, '#555', 0, -.95, .3), sph(.07, '#6ac8ff', 0, -.95, .4)); break;
      case 'chef': g.add(cyl(.26, .28, .38, '#fff', 0, .12, 0), sph(.36, '#fff', 0, .38, 0, .7)); break;
      case 'cap': g.add(sph(.4, '#3a9a3a', 0, -.06, 0, .6), box(.5, .04, .3, '#2a6a2a', 0, -.12, .4)); break;
      case 'keys': g.add(sph(.06, '#ffd23f', .3, -1.05, .2), sph(.05, '#c8c8d8', .36, -1.1, .2)); break;
      case 'goggles': g.add(cyl(.12, .12, .1, '#4af0ff', -.14, -.1, .34), cyl(.12, .12, .1, '#4af0ff', .14, -.1, .34), box(.7, .05, .6, '#3a3a58', 0, -.12, 0)); g.children[0].rotation.x = g.children[1].rotation.x = Math.PI / 2; break;
    }
    return g;
  }
  function makePerson(cls, style) {
    const pal = Spr.PAL[cls % Spr.PAL.length], hat = CLASSES[cls].hat, g = new T.Group(), sk = pal.skin, hr = pal.hair, sh = pal.shirt;
    const limb = (x, y, w, h, c, sphere) => { const pv = new T.Group(); pv.position.set(x, y, 0); const m = sphere ? cyl(w, w, h, c, 0, -h / 2, 0) : box(w, h, w, c, 0, -h / 2, 0); pv.add(m); return pv; };
    let head;
    const lArm = limb(-.32, .86, style === 'A' ? .07 : .13, .42, sh), rArm = limb(.32, .86, style === 'A' ? .07 : .13, .42, sh), lLeg = limb(-.12, .42, style === 'A' ? .08 : .14, .42, '#33406a'), rLeg = limb(.12, .42, style === 'A' ? .08 : .14, .42, '#33406a');
    if (style === 'A') {
      g.add(cyl(.22, .27, .5, sh, 0, .62, 0)); head = new T.Group(); head.position.set(0, 1.12, 0);
      head.add(sph(.4, hr, 0, .02, -.04, .95), sph(.34, sk, 0, -.04, .08), sph(.05, '#1a1020', -.14, -.02, .38), sph(.05, '#1a1020', .14, -.02, .38), sph(.045, '#ff9a9a', -.24, -.12, .3, .5), sph(.045, '#ff9a9a', .24, -.12, .3, .5));
      if (pal.style === 'pony') head.add(sph(.14, hr, .38, -.05, -.18, 1.6)); if (pal.style === 'bun') head.add(sph(.15, hr, 0, .42, -.05)); if (pal.style === 'pig') head.add(sph(.13, hr, -.4, -.15, 0, 1.5), sph(.13, hr, .4, -.15, 0, 1.5)); if (pal.style === 'spiky') head.add(cone(.12, .3, hr, 0, .45, 0), cone(.1, .24, hr, -.2, .38, 0), cone(.1, .24, hr, .2, .38, 0)); if (pal.style === 'long') head.add(sph(.4, hr, 0, -.3, -.16, 1.3));
      g.add(sph(.1, '#3a2850', -.12, .05, .06, .6), sph(.1, '#3a2850', .12, .05, .06, .6));
    } else {
      g.add(box(.52, .52, .3, sh, 0, .66, 0)); head = new T.Group(); head.position.set(0, 1.2, 0);
      head.add(box(.6, .5, .5, sk, 0, 0, 0), box(.66, .24, .56, hr, 0, .24, -.02), box(.66, .5, .12, hr, 0, 0, -.24), box(.1, .3, .52, hr, -.3, 0, 0), box(.1, .3, .52, hr, .3, 0, 0), box(.07, .12, .02, '#1a1020', -.14, -.02, .26), box(.07, .12, .02, '#1a1020', .14, -.02, .26));
      if (pal.style === 'pony') head.add(box(.12, .4, .12, hr, .34, -.1, -.2)); if (pal.style === 'bun') head.add(box(.2, .2, .2, hr, 0, .42, 0)); if (pal.style === 'pig') head.add(box(.12, .32, .12, hr, -.38, -.1, 0), box(.12, .32, .12, hr, .38, -.1, 0)); if (pal.style === 'spiky') head.add(box(.1, .24, .1, hr, -.2, .42, 0), box(.1, .3, .1, hr, 0, .45, 0), box(.1, .24, .1, hr, .2, .42, 0)); if (pal.style === 'long') head.add(box(.6, .5, .1, hr, 0, -.2, -.28));
      g.add(box(.16, .1, .24, '#201428', -.12, .05, .04), box(.16, .1, .24, '#201428', .12, .05, .04));
    }
    head.add(hatMesh(hat, style, .5).translateY(style === 'A' ? .38 : .28)); g.add(head, lArm, rArm, lLeg, rLeg);
    const root = new T.Group(); root.add(g); root.scale.setScalar(style === 'A' ? 0.95 : 0.9);
    const shadow = new T.Mesh(new T.CircleGeometry(.4, 14), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: .32 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; root.add(shadow);
    return { g: root, lArm, rArm, lLeg, rLeg, head };
  }
  function makeDoll(style) {
    const g = new T.Group(), porc = '#fff0e6', hair = '#5a3a80', metal = '#9a9ab4', dress = '#8a2478';
    const mk = (x, y) => { const pv = new T.Group(); pv.position.set(x, y, 0); return pv; };
    const lArm = mk(-.62, 1.25), rArm = mk(.62, 1.25), lLeg = mk(-.2, .62), rLeg = mk(.2, .62);
    lArm.add(box(.12, .7, .12, metal, 0, -.35, 0), sph(.17, '#b8b8d0', 0, 0, 0), sph(.12, porc, 0, -.76, 0)); rArm.add(box(.12, .7, .12, metal, 0, -.35, 0), sph(.17, '#b8b8d0', 0, 0, 0), sph(.12, porc, 0, -.76, 0));
    lLeg.add(box(.12, .55, .12, '#5a5a74', 0, -.28, 0), box(.26, .14, .34, '#d02a6a', 0, -.58, .05)); rLeg.add(box(.12, .55, .12, '#5a5a74', 0, -.28, 0), box(.26, .14, .34, '#d02a6a', 0, -.58, .05));
    const eyes = new T.Group(), eL = sph(.11, bm('#c02a3a'), -.2, 0, .5), eR = sph(.11, bm('#c02a3a'), .2, 0, .5); eyes.add(eL, eR);
    const head = new T.Group(); head.position.set(0, 1.78, 0);
    head.add(sph(.62, hair, 0, .05, -.05), sph(.52, porc, 0, -.04, .1), eyes, sph(.07, '#ff9ab0', -.34, -.2, .42, .5), sph(.07, '#ff9ab0', .34, -.2, .42, .5), box(.34, .04, .03, '#6a2030', 0, -.28, .55), sph(.2, hair, -.62, -.1, 0, 1.5), sph(.2, hair, .62, -.1, 0, 1.5), sph(.2, '#e02a70', -.3, .6, 0, .7), sph(.2, '#e02a70', .3, .6, 0, .7), sph(.1, '#a01a50', 0, .6, 0));
    g.add(cone(.7, 1.0, dress, 0, .78, 0), cyl(.3, .36, .5, dress, 0, 1.15, 0), cone(.36, .55, '#f6ecf6', 0, .82, .2), cyl(.12, .12, .1, '#c8c8dc', 0, 1.42, 0), lArm, rArm, lLeg, rLeg, head);
    const key = new T.Group(); key.position.set(0, 1.3, -.4); key.add(box(.08, .6, .08, '#c8c8dc'), sph(.16, '#d8d8ec', -.2, .3, 0, .5), sph(.16, '#d8d8ec', .2, .3, 0, .5)); g.add(key);
    const aura = new T.Mesh(new T.CircleGeometry(.9, 18), new T.MeshBasicMaterial({ color: 0xff2846, transparent: true, opacity: .3 })); aura.rotation.x = -Math.PI / 2; aura.position.y = .04; g.add(aura);
    const shadow = new T.Mesh(new T.CircleGeometry(.6, 14), new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: .35 })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .03; g.add(shadow);
    const stars = new T.Group(); for (let i = 0; i < 4; i++) stars.add(box(.1, .1, .1, bm('#ffd23f'))); stars.position.y = 2.8; g.add(stars);
    const root = new T.Group(); root.add(g); root.scale.setScalar(style === 'A' ? 1.0 : 0.82);
    return { g: root, inner: g, lArm, rArm, lLeg, rLeg, head, eL, eR, aura, stars };
  }
  function makeGhost() {
    const g = new T.Group(), m = new T.MeshBasicMaterial({ color: 0xdfe6ff, transparent: true, opacity: .6, depthWrite: false });
    g.add(cone(.42, 1.0, m, 0, .6, 0), sph(.34, m, 0, 1.1, 0), sph(.07, bm('#15102a'), -.12, 1.14, .3), sph(.07, bm('#15102a'), .12, 1.14, .3), sph(.05, bm('#ff4a6a'), -.12, 1.16, .34), sph(.05, bm('#ff4a6a'), .12, 1.16, .34), sph(.08, bm('#15102a'), 0, .96, .32, 1.4), box(.22, .1, .1, m, -.42, .8, 0), box(.22, .1, .1, m, .42, .8, 0));
    g.userData.mat = m; return g;
  }
  function makePlaced(q) {
    const g = new T.Group();
    switch (q.type) {
      case 'petardo': g.add(box(.3, .15, .2, '#ff8a3a', 0, .1, 0), box(.04, .15, .04, bm('#ffd23f'), 0, .25, 0)); break;
      case 'trampa': { const r = new T.Mesh(new T.TorusGeometry(.3, .05, 6, 14), cm('#c8a060')); r.rotation.x = Math.PI / 2; r.position.y = .06; g.add(r, box(.12, .06, .12, '#e8d098', 0, .06, 0)); break; }
      case 'mancha': { const m = new T.Mesh(new T.CircleGeometry(.45, 14), new T.MeshBasicMaterial({ color: 0x0a0800, transparent: true, opacity: .85 })); m.rotation.x = -Math.PI / 2; m.position.y = .05; g.add(m); break; }
      case 'barricada': g.add(box(.95, .3, .2, '#b07a44', 0, .25, .15), box(.95, .3, .2, '#9a6a38', 0, .6, -.1), box(.95, .3, .2, '#b07a44', 0, .95, .1), box(.12, 1.2, .5, '#6a4020', -.35, .6, 0), box(.12, 1.2, .5, '#6a4020', .35, .6, 0)); break;
      case 'torreta': g.add(box(.5, .25, .5, '#e0505a', 0, .13, 0), cyl(.1, .1, .5, '#7a7a90', 0, .45, 0), box(.1, .1, .4, '#ffd23f', 0, .7, .15)); break;
    }
    return g;
  }

  // ---------------- construir la escena de una partida ----------------
  let amb, dirL, pL, spot, player, doll, ghosts = [], ring, lureM = null, lureKey = '', placed = new Map(), lastF = -1;
  const WCOL = { '.': '#8a6ab8', k: '#58b8a8', g: '#8a98b8', r: '#c8587a' };
  function clear() { if (!scene) return; while (scene.children.length) scene.remove(scene.children[0]); placed = new Map(); lureM = null; lureKey = ''; ghosts = []; }
  function build(S) {
    _S = S; clear(); built = { S, floors: [], doors: [], objs: [] };
    scene.background = new T.Color(0x0a0618); scene.fog = new T.Fog(0x140a28, 16, 40);
    amb = new T.AmbientLight(0xb89ad8, 1.05); dirL = new T.DirectionalLight(0xffe2b8, 0.8); dirL.position.set(-6, 14, 8); pL = new T.PointLight(0xffd8a0, 0.9, 10, 1.4);
    spot = new T.SpotLight(0xfff4cc, 0, 15, 0.6, 0.4, 1); scene.add(amb, dirL, pL, spot, spot.target);
    // geometría de pared con la cara de arriba más oscura
    const wg = new T.BoxGeometry(1, 1, 1), n = wg.attributes.normal, col = new Float32Array(n.count * 3);
    for (let i = 0; i < n.count; i++) { const top = n.getY(i) > 0.5, v = top ? 0.55 : 1; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v; }
    wg.setAttribute('color', new T.BufferAttribute(col, 3));
    for (let f = 0; f < 2; f++) {
      const F = S.W.f[f], grp = new T.Group();
      const tex = new T.CanvasTexture(Spr.floorCanvas(F, true)); tex.magFilter = T.NearestFilter; tex.minFilter = T.NearestFilter; if ('colorSpace' in tex) tex.colorSpace = T.SRGBColorSpace;
      const plane = new T.Mesh(new T.PlaneGeometry(MW, MH), new T.MeshLambertMaterial({ map: tex })); plane.rotation.x = -Math.PI / 2; plane.position.set(MW / 2, 0, MH / 2); grp.add(plane);
      const walls = []; for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) if (F.g[j][i] === '#') walls.push([i, j]);
      const im = new T.InstancedMesh(wg, new T.MeshLambertMaterial({ vertexColors: true }), walls.length), mtx = new T.Matrix4(), cc = new T.Color();
      walls.forEach(([i, j], k) => { let t = '.'; for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const c = (F.g[j + dy] || [])[i + dx]; if (c && WCOL[c]) { t = c; break; } } mtx.makeScale(1, WALLH, 1); mtx.setPosition(i + 0.5, WALLH / 2, j + 0.5); im.setMatrixAt(k, mtx); im.setColorAt(k, cc.set(WCOL[t])); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; grp.add(im);
      for (const o of F.objs) {
        if (o.type === 'door') { const dg = new T.Group(); dg.add(box(1, WALLH, 1, '#7a5232', 0, WALLH / 2, 0), box(.34, .34, 1.06, bm(KEY_COLORS[o.id]), 0, .9, 0), box(1.02, .08, 1.02, '#3a2412', 0, 1.2, 0)); dg.position.set(o.x + .5, 0, o.y + .5); grp.add(dg); built.doors.push({ g: dg, o }); }
        else { const m = makeObj(o); grp.add(m); built.objs.push({ o, g: m, upd: m.userData.upd }); }
      }
      scene.add(grp); built.floors.push(grp);
    }
    player = makePerson(CFG.cls, CFG.style); scene.add(player.g); doll = makeDoll(CFG.style); scene.add(doll.g);
    for (let i = 0; i < 3; i++) { const gh = makeGhost(); gh.visible = false; scene.add(gh); ghosts.push(gh); }
    ring = new T.Mesh(new T.RingGeometry(0.92, 1, 40), new T.MeshBasicMaterial({ color: 0xff3c3c, transparent: true, opacity: .8, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .08; ring.visible = false; scene.add(ring);
    cam.position.set(S.p.x / 16, 10.4, S.p.y / 16 + 4.6); lastF = S.p.f; built.style = CFG.style; built.cls = CFG.cls;
  }

  function draw(S) {
    if (!init()) return; if (!built || built.S !== S || built.style !== CFG.style || built.cls !== CFG.cls) build(S); _S = S;
    const p = S.p, e = S.e, t = G.t, px = p.x / 16, pz = p.y / 16;
    built.floors.forEach((fg, i) => { fg.visible = i === p.f; });
    for (const d of built.doors) d.g.visible = !d.o.removed && d.o.f === p.f;
    for (const ob of built.objs) if (ob.o.f === p.f && ob.upd) ob.upd(ob.o, t);
    // jugador
    const P = player; P.g.visible = !p.escaped; P.g.position.set(px, p.boost > 0 ? .1 : 0, pz);
    const fa = Math.atan2(Math.cos(p.ang), Math.sin(p.ang)); let da = fa - P.g.rotation.y; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; P.g.rotation.y += da * 0.35;
    const sw = p.moving ? Math.sin(p.anim * 1.2) * 0.8 : 0; P.lLeg.rotation.x = sw; P.rLeg.rotation.x = -sw; P.lArm.rotation.x = -sw * .8; P.rArm.rotation.x = sw * .8; P.g.position.y += p.moving ? Math.abs(Math.sin(p.anim * 1.2)) * .06 : 0;
    P.g.rotation.x = p.dead ? -1.4 : 0; P.g.children[0].visible = true;
    // muñeca
    const D = doll; D.g.visible = e.f === p.f;
    if (D.g.visible) {
      D.g.position.set(e.x / 16, 0, e.y / 16); const ef = Math.atan2(e.fx, e.fy); let d2 = ef - D.g.rotation.y; while (d2 > Math.PI) d2 -= 2 * Math.PI; while (d2 < -Math.PI) d2 += 2 * Math.PI; D.g.rotation.y += d2 * 0.3;
      const mv = e.path.length && e.stun <= 0 && e.state !== 'eat', s2 = mv ? Math.sin(e.anim * 8) * 0.7 : 0; D.lLeg.rotation.x = s2; D.rLeg.rotation.x = -s2; D.lArm.rotation.x = -s2 * .6; D.rArm.rotation.x = s2 * .6;
      const stunned = e.stun > 0 || e.state === 'eat', angry = e.state === 'chase' || e.state === 'grab';
      D.eL.material = D.eR.material = bm(stunned ? '#ff4a4a' : angry ? '#ff2a2a' : '#c02a3a'); D.inner.position.y = mv ? 0 : Math.sin(t * 2.5) * .04; D.inner.rotation.z = stunned ? Math.sin(t * 8) * .12 : 0; D.head.rotation.z = stunned ? .3 : 0;
      D.aura.visible = angry; D.aura.scale.setScalar(1 + Math.sin(t * 10) * .08); D.stars.visible = stunned; D.stars.rotation.y = t * 5; D.stars.children.forEach((c, i) => c.position.set(Math.cos(i * 1.57) * .5, Math.sin(t * 6 + i) * .08, Math.sin(i * 1.57) * .5));
      D.inner.scale.setScalar(e.blind > 0 ? .9 : 1);
    }
    // fantasmas
    ghosts.forEach((gm, i) => { const gh = S.ghosts[i]; gm.visible = !!gh && gh.f === p.f; if (gm.visible) { gm.position.set(gh.x / 16, 0.3 + Math.sin(t * 3 + gh.ph) * .15, gh.y / 16); gm.rotation.y = Math.atan2(px - gm.position.x, pz - gm.position.z); gm.userData.mat.opacity = .62 * gh.a; } });
    // radar
    ring.visible = e.f === p.f && e.ring > 0; if (ring.visible) { const r = e.ring / 1.2 * S.df.radarR / 16; ring.position.set(e.x / 16, .08, e.y / 16); ring.scale.set(r, r, r); ring.material.opacity = Math.max(0, 1 - e.ring / 1.2) * .9; }
    // objetos colocados
    const seen = new Set();
    for (const q of S.placed) { if (q.f !== p.f) continue; seen.add(q); let m = placed.get(q); if (!m) { m = makePlaced(q); m.position.set(q.type === 'barricada' ? q.tx + .5 : q.x / 16, 0, q.type === 'barricada' ? q.ty + .5 : q.y / 16); scene.add(m); placed.set(q, m); } if (q.type === 'torreta' && q.fire > 0) m.rotation.y += .5; }
    for (const [q, m] of placed) if (!seen.has(q)) { scene.remove(m); placed.delete(q); }
    // señuelo
    const L = S.lure && S.lure.f === p.f ? S.lure : null, lk = L ? L.type : '';
    if (lk !== lureKey) { if (lureM) scene.remove(lureM); lureM = null; lureKey = lk; if (L) { lureM = new T.Group(); if (L.type === 'pizza') lureM.add(cyl(.3, .3, .06, '#e0a040', 0, .06, 0), cyl(.25, .25, .07, '#d04030', 0, .08, 0)); else lureM.add(box(.5, .35, .4, '#b05ac0', 0, .2, 0), sph(.08, bm('#ffd23f'), 0, .5, 0)); scene.add(lureM); } }
    if (lureM) lureM.position.set(L.x / 16, 0, L.y / 16);
    // luces
    const bo = S.blackout; amb.intensity += ((bo ? 0.28 : 1.0) - amb.intensity) * 0.1; dirL.intensity = bo ? 0.12 : 0.55; pL.intensity = bo ? 1.5 : 0.9; pL.distance = bo ? 6 : 10;
    pL.position.set(px, 2.4, pz + .4); if (S.flick > 0) amb.intensity *= .55;
    if (p.beam > 0) { spot.intensity = 4.5 * Math.min(1, p.beam / 0.4); spot.position.set(px, 1.1, pz); spot.target.position.set(px + Math.cos(p.ang) * 6, 0, pz + Math.sin(p.ang) * 6); } else spot.intensity = 0;
    // cámara (tercera persona desde arriba)
    const tgt = p.dead && e.f === p.f ? { x: e.x / 16, z: e.y / 16 } : { x: px, z: pz }, off = { x: 0, y: 10.4, z: 4.6 };
    if (lastF !== p.f) { lastF = p.f; cam.position.set(tgt.x + off.x, off.y, tgt.z + off.z); }
    cam.position.x += (tgt.x + off.x - cam.position.x) * 0.14; cam.position.y += (off.y - cam.position.y) * 0.14; cam.position.z += (tgt.z + off.z - cam.position.z) * 0.14;
    const sh = S.shake > 0 ? S.shake * 0.25 : 0; const cx = cam.position.x + (Math.random() - .5) * sh, cz = cam.position.z + (Math.random() - .5) * sh;
    const sp = cam.position.clone(); cam.position.set(cx, cam.position.y, cz); cam.lookAt(cam.position.x - off.x, 0.4, cam.position.z - off.z); ren.render(scene, cam); cam.position.copy(sp);
  }

  // ---------------- fondo 3D del menú: la casa embrujada de noche ----------------
  let ms = null;
  function buildMenu() {
    const sc = new T.Scene(); sc.background = new T.Color(0x0a0618); sc.fog = new T.Fog(0x160c2a, 14, 64);
    const amb = new T.AmbientLight(0x4a3a7a, 1.15), moon = new T.DirectionalLight(0x9ab4ff, 0.95); moon.position.set(-14, 18, -20);
    const w1 = new T.PointLight(0xffb85a, 1.5, 15, 1.4), w2 = new T.PointLight(0xffb85a, 1.3, 13, 1.4), lampL = new T.PointLight(0xffd890, 1.0, 9, 1.5);
    w1.position.set(-2.4, 1.8, 4.2); w2.position.set(2.4, 4.4, 4.2); lampL.position.set(6.2, 2.6, 7.4); sc.add(amb, moon, w1, w2, lampL);
    const gnd = new T.Mesh(new T.CircleGeometry(80, 32), cm('#1e1536')); gnd.rotation.x = -Math.PI / 2; sc.add(gnd);
    const path = box(2.2, .04, 12, '#3a2c52', 0, .02, 8); sc.add(path);
    // casa
    const house = new T.Group();
    house.add(box(9, 5.6, 6.4, '#3e2e62', 0, 2.8, 0), box(9.4, .3, 6.8, '#2a1e46', 0, 5.7, 0), box(9.2, .25, 6.6, '#2a1e46', 0, 2.9, 0));
    const roof = cone(6.9, 3.6, '#2a1a48', 0, 7.6, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(6.9, 3.6, 5.0); house.add(roof);
    house.add(box(1.1, 3, 1.1, '#2a1e46', 2.8, 8.3, -1.2), box(1.6, 2.7, .25, '#3a2412', 0, 1.35, 3.25), box(.16, .16, .1, bm('#ffd23f'), .5, 1.3, 3.4), box(2.6, .2, 1.4, '#2a1e46', 0, 2.7, 3.8), box(.2, 2.7, .2, '#5a4a7a', -1.1, 1.35, 4.3), box(.2, 2.7, .2, '#5a4a7a', 1.1, 1.35, 4.3));
    const wins = [];
    for (const [x, y] of [[-2.8, 1.8], [2.8, 1.8], [-2.8, 4.2], [2.8, 4.2]]) { const wm = bm('#ffc860'); const win = box(1.4, 1.6, .12, wm, x, y, 3.23); house.add(win, box(1.5, .1, .16, '#1a1030', x, y, 3.25), box(.1, 1.7, .16, '#1a1030', x, y, 3.25), box(1.6, .12, .3, '#2a1e46', x, y - .9, 3.3)); wins.push(wm); }
    const dh = new T.Group(); dh.add(sph(.28, '#14081e', 2.8, 4.1, 3.12), sph(.1, bm('#ff2a2a'), 2.7, 4.16, 3.36), sph(.1, bm('#ff2a2a'), 2.9, 4.16, 3.36), sph(.18, bm('#d02a6a'), 2.55, 4.5, 3.1, .7), sph(.18, bm('#d02a6a'), 3.05, 4.5, 3.1, .7)); house.add(dh);
    sc.add(house);
    // luna y estrellas
    const moonM = sph(4, bm('#fff4c8'), -28, 21, -48); sc.add(moonM, sph(7.5, new T.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: .13, depthWrite: false }), -28, 21, -48));
    const sp = new Float32Array(900); for (let i = 0; i < 300; i++) { const a = Math.random() * 6.283, b = Math.random() * 1.2 + 0.12, r = 85; sp[i * 3] = Math.cos(a) * Math.cos(b) * r; sp[i * 3 + 1] = Math.sin(b) * r; sp[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r - 10; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); const stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.9, sizeAttenuation: false })); sc.add(stars);
    // árboles secos, cerca y tumbas
    const tree = (x, z, k) => { const g = new T.Group(); g.add(cyl(.28 * k, .42 * k, 5 * k, '#120a1c', 0, 2.5 * k, 0)); for (let i = 0; i < 5; i++) { const br = cyl(.07 * k, .14 * k, 2.4 * k, '#120a1c', 0, 0, 0); br.position.set(Math.cos(i * 1.4) * .6 * k, (2.6 + i * .55) * k, Math.sin(i * 1.4) * .6 * k); br.rotation.z = (i % 2 ? 1 : -1) * 0.9; br.rotation.y = i * 1.3; g.add(br); } g.position.set(x, 0, z); sc.add(g); };
    tree(-11, 3, 1.3); tree(12, 1, 1.5); tree(-7, -6, 1.1); tree(8, -7, 1.2); tree(-17, 10, 1.4); tree(18, 9, 1.3); tree(-4, 13, 1);
    for (let i = 0; i < 16; i++) { sc.add(box(.14, 1.1, .14, '#2a1e46', -9 + i * 1.2, .55, 11)); } sc.add(box(19, .1, .1, '#2a1e46', 0, .95, 11), box(19, .1, .1, '#2a1e46', 0, .45, 11));
    [[8.5, 6], [10.2, 7.6], [11.6, 5.4], [-9, 7]].forEach(([x, z], i) => { sc.add(box(.8, 1.1, .2, '#4a4068', x, .55, z), cyl(.4, .4, .2, '#4a4068', x, 1.1, z)); const cr = box(.12, .5, .12, '#2a2044', x, 1.5, z); sc.add(cr); });
    // lámpara del camino
    sc.add(cyl(.07, .07, 2.6, '#2a2040', 6.2, 1.3, 7.4), sph(.28, bm('#ffe08a'), 6.2, 2.7, 7.4));
    // murciélagos
    const bats = []; for (let i = 0; i < 7; i++) { const g = new T.Group(), wl = box(.5, .04, .22, '#05020c', -.28, 0, 0), wr = box(.5, .04, .22, '#05020c', .28, 0, 0); g.add(sph(.1, '#05020c'), wl, wr); g.userData = { wl, wr, r: 6 + Math.random() * 8, h: 6 + Math.random() * 6, sp: .4 + Math.random() * .5, ph: Math.random() * 6 }; sc.add(g); bats.push(g); }
    // personajes en el jardín
    const cam2 = new T.PerspectiveCamera(48, W3 / H3, 0.1, 140);
    ms = { sc, cam: cam2, w1, w2, lampL, wins, bats, dh, avatar: null, doll: null, cls: -1, style: '', house };
    return ms;
  }
  function drawMenu(t) {
    if (!init()) return false; if (!ms) buildMenu();
    if (ms.cls !== CFG.cls || ms.style !== CFG.style) {
      if (ms.avatar) ms.sc.remove(ms.avatar.g); if (ms.doll) ms.sc.remove(ms.doll.g);
      ms.avatar = makePerson(CFG.cls, CFG.style); ms.avatar.g.position.set(-2.6, 0, 7.4); ms.avatar.g.scale.multiplyScalar(1.5); ms.avatar.g.rotation.y = 0.5; ms.sc.add(ms.avatar.g);
      ms.doll = makeDoll(CFG.style); ms.doll.g.position.set(3.6, 0, 6.2); ms.doll.g.scale.multiplyScalar(1.15); ms.doll.g.rotation.y = -0.4; ms.sc.add(ms.doll.g); ms.doll.aura.visible = false; ms.doll.stars.visible = false;
      ms.cls = CFG.cls; ms.style = CFG.style;
    }
    const f = (k) => (Math.sin(t * 7 + k * 5) > -0.75 || Math.random() < 0.25) ? 1 : 0.25;
    ms.wins.forEach((m, i) => m.color.set(i === 3 ? '#a07a40' : (f(i) > 0.5 ? '#ffc860' : '#6a4a20'))); ms.w1.intensity = 1.2 + f(1) * .6; ms.w2.intensity = 1.0 + f(2) * .5; ms.lampL.intensity = .9 + Math.sin(t * 11) * .1;
    ms.bats.forEach(b => { const d = b.userData, a = t * d.sp + d.ph; b.position.set(Math.cos(a) * d.r, d.h + Math.sin(a * 2) * 1.2, Math.sin(a) * d.r - 2); b.rotation.y = -a + Math.PI / 2; const fl = Math.sin(t * 14 + d.ph) * .7; d.wl.rotation.z = fl; d.wr.rotation.z = -fl; });
    const D = ms.doll; if (D) { D.head.rotation.y = Math.sin(t * .8) * .5; D.head.rotation.z = Math.sin(t * 1.3) * .06; D.inner.position.y = Math.sin(t * 2.2) * .04; D.lArm.rotation.x = Math.sin(t * 1.5) * .15; D.rArm.rotation.x = -Math.sin(t * 1.5) * .15; D.g.rotation.y = -0.4 + Math.sin(t * .4) * .25; }
    const A = ms.avatar; if (A) { A.g.position.y = Math.abs(Math.sin(t * 3)) * .06; A.lArm.rotation.x = Math.sin(t * 2.4) * .3; A.rArm.rotation.x = -Math.sin(t * 2.4) * .3; A.g.rotation.y = 0.5 + Math.sin(t * .7) * .3; }
    const ang = Math.sin(t * 0.12) * 0.5; ms.cam.position.set(Math.sin(ang) * 15, 3.3 + Math.sin(t * 0.2) * 0.4, Math.cos(ang) * 15 + 1.5); ms.cam.lookAt(0, 2.5, 3.2);
    ren.render(ms.sc, ms.cam); return true;
  }
  const project = (x, y, h = 0.5) => { const v = new T.Vector3(x / 16, h, y / 16).project(cam); return [(v.x * 0.5 + 0.5) * 320, (-v.y * 0.5 + 0.5) * 180]; };
  const show = on => { const c = document.getElementById('gl'); if (c) c.style.display = on ? 'block' : 'none'; };
  return { init, draw, drawMenu, project, show, get ok() { return ok || (T && init()); } };
})();
