/* 05h · extras de mundo: obstáculos saltables, cofre secreto, portal, ciclo de día y noche, clima dinámico y luciérnagas */
'use strict';
const TOD_PERIOD = 210;   // segundos que dura un día completo
PICK_SET.add('chest'); PICK_SET.add('portal');
PLATE_COL.hurdle = [255, 110, 110]; PLATE_COL.logbar = [255, 190, 90];

/* ------------------------------------------------------------------ modelos */
function initExtras(){
  const T = (geo, color, p, s, r, o) => pt(geo, color, p, s, r, o);
  const E = (geo, color, p, s, r) => pt(geo, color, p, s, r, { e: true });
  const glowM = (geo, color, op) => mesh(geo, color, op, true);

  /* valla baja del cielo: dos postes y una barra a rayas; hay que saltarla (o esquivarla) */
  MK.hurdle = { make(){
    const parts = [
      T(GEO.cyl(), 0xf4f0ff, [-1.0, -0.15, 0], [0.26, 1.5, 0.26]), T(GEO.cyl(), 0xf4f0ff, [1.0, -0.15, 0], [0.26, 1.5, 0.26]),
      T(GEO.sph(), 0xffd23f, [-1.0, 0.68, 0], [0.42, 0.42, 0.42]), T(GEO.sph(), 0xffd23f, [1.0, 0.68, 0], [0.42, 0.42, 0.42])
    ];
    for (let i = 0; i < 6; i++) parts.push(T(GEO.rbox(), i % 2 ? 0xffffff : 0xff4f5e, [-0.88 + i * 0.352, 0.34, 0], [0.36, 0.34, 0.3]));
    parts.push(E(GEO.box(), 0xff8a8a, [0, 0.78, 0], [2.1, 0.05, 0.05]));
    const g = build(parts, { outline: 1.05 });
    const halo = glowM(new THREE.CircleGeometry(1.5, 20), 0xff6a7a, 0.22); halo.position.set(0, 0.35, -0.2); g.add(halo);
    g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.position.y += Math.sin(t * 3 + ob.v * 6) * 0.06; } };

  /* tronco del suelo */
  MK.logbar = { ground: true, make(){
    const parts = [
      T(GEO.cyl(), 0x9a6a3c, [0, 0.42, 0], [0.8, 2.2, 0.8], [0, 0, Math.PI / 2]),
      T(GEO.cyl(), 0xe8c48a, [-1.12, 0.42, 0], [0.7, 0.06, 0.7], [0, 0, Math.PI / 2]), T(GEO.cyl(), 0xe8c48a, [1.12, 0.42, 0], [0.7, 0.06, 0.7], [0, 0, Math.PI / 2]),
      T(GEO.cyl(), 0x6e4524, [-0.5, 0.42, 0.38], [0.14, 0.62, 0.14], [0, 0, Math.PI / 2]), T(GEO.cyl(), 0x6e4524, [0.6, 0.42, 0.38], [0.14, 0.62, 0.14], [0, 0, Math.PI / 2]),
      T(GEO.sph(), 0xff4f5e, [0, 0.9, 0], [0.4, 0.22, 0.4]), T(GEO.sph(), 0xff4f5e, [-0.7, 0.86, 0], [0.34, 0.2, 0.34]), T(GEO.sph(), 0xff4f5e, [0.7, 0.86, 0], [0.34, 0.2, 0.34])
    ];
    const g = build(parts, { outline: 1.05 }); g.userData.hy = 0; return g; } };

  /* cofre secreto sobre un islote */
  MK.chest = { make(){
    const parts = [
      T(GEO.cone(), 0x8a6a4a, [0, -0.85, 0], [2.0, 1.5, 2.0], [Math.PI, 0, 0]),
      T(GEO.cyl(), 0x7bdc65, [0, -0.08, 0], [2.1, 0.22, 2.1]),
      T(GEO.rbox(), 0xa8632e, [0, 0.38, 0], [1.15, 0.62, 0.8]), T(GEO.cyl(), 0xb8733a, [0, 0.69, 0], [0.78, 1.15, 0.78], [0, 0, Math.PI / 2]),
      T(GEO.rbox(), 0xffd23f, [0, 0.4, 0.4], [1.2, 0.16, 0.06]), T(GEO.rbox(), 0xffd23f, [0, 0.4, -0.4], [1.2, 0.16, 0.06]),
      T(GEO.rbox(), 0xffd23f, [0, 0.38, 0.42], [0.2, 0.34, 0.08]), E(GEO.sph(), 0xfff3a0, [0, 0.48, 0.47], [0.1, 0.1, 0.06])
    ];
    const g = build(parts, { outline: 1.05 }); const gl = glowSprite(0xffe36b, 6.5, 0.55); gl.position.y = 0.6; g.add(gl);
    g.userData.gl = gl; g.userData.hy = 0; return g; },
    anim(g, ob, t){ g.rotation.y = Math.sin(t * 1.2 + ob.P) * 0.35; g.position.y += Math.sin(t * 2.6 + ob.P) * 0.15; g.userData.gl.material.opacity = 0.4 + 0.25 * Math.sin(t * 5); } };

  /* portal de atajo */
  MK.portal = { make(){
    const ring = build([T(GEO.tor(), 0xb48cff, [0, 0, 0], [3.0, 3.0, 3.0]), T(GEO.tor(), 0x7be0ff, [0, 0, 0], [2.4, 2.4, 2.4])], { center: false, outline: 0 });
    const disc = glowM(new THREE.CircleGeometry(1.35, 24), 0x8a6aff, 0.35); const disc2 = glowM(new THREE.CircleGeometry(0.9, 20), 0xbffaff, 0.4);
    const g = new THREE.Group(); g.add(ring, disc, disc2, glowSprite(0xa88cff, 7, 0.55));
    const sparks = []; for (let i = 0; i < 6; i++){ const s = glowSprite(i % 2 ? 0x7be0ff : 0xffffff, 0.5, 0.9); g.add(s); sparks.push(s); }
    g.userData = { ring, disc, disc2, sparks, hy: 0 }; g.position.y = 0; return g; },
    anim(g, ob, t){ const u = g.userData; u.ring.rotation.z = t * 1.4; u.disc.rotation.z = -t * 2.2; u.disc2.rotation.z = t * 3; const k = 1 + 0.06 * Math.sin(t * 5); u.disc.scale.setScalar(k);
      u.sparks.forEach((s, i) => { const a = t * 2.2 + i * 1.047, r = 1.5 + 0.1 * Math.sin(t * 6 + i); s.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.1); s.material.opacity = 0.5 + 0.4 * Math.sin(t * 7 + i * 2); }); } };
}

/* ------------------------------------------------------------------ ciclo de día y noche */
const NIGHT_TOP = [8, 12, 38], NIGHT_BOT = [38, 46, 98], TWI = [255, 138, 96];
function todState(){
  if (window.__noTod) return { night: 0, tw: 0 };
  const d = 0.5 + 0.5 * Math.cos(G.tod * 6.2832);               // 1 = mediodía, 0 = medianoche
  const night = smooth(clamp((0.5 - d) / 0.3, 0, 1));            // 0 de día → 1 de noche
  const tw = Math.sin(clamp((0.5 - d) / 0.5, 0, 1) * 3.1416);    // atardecer / amanecer: franja cálida
  return { night, tw: tw * (night > 0.02 ? 1 : 0.7) * (1 - night * 0.4) };
}
function todSky(sky, TD){
  if (TD.night <= 0.001 && TD.tw <= 0.001) return sky;
  let top = mix(sky.top, NIGHT_TOP, TD.night * 0.86), bot = mix(sky.bot, NIGHT_BOT, TD.night * 0.8);
  bot = mix(bot, TWI, clamp(TD.tw * 0.5, 0, 0.55)); top = mix(top, [120, 70, 130], clamp(TD.tw * 0.25, 0, 0.3));
  return { top, bot };
}
function todIcon(){ const n = todState().night; return n > 0.6 ? '🌙 ' : n > 0.25 ? '🌆 ' : '☀️ '; }

/* ------------------------------------------------------------------ clima dinámico + luciérnagas (capa 2D) */
const FX = {
  kind: 'clear', amt: 0, target: 0, timer: 25, flakes: [], flies: [],
  pick(){
    const th = THEME === THEMES.storm ? 'storm' : THEME === THEMES.dusk ? 'dusk' : 'dawn';
    const opts = th === 'storm' ? ['fog', 'clear', 'snow'] : th === 'dusk' ? ['clear', 'fog', 'snow', 'rain'] : ['clear', 'fog', 'rain', 'snow'];
    return opts[Math.floor(Math.random() * opts.length)];
  },
  set(kind){
    if (kind === this.kind) return;
    this.kind = kind; this.target = kind === 'clear' ? 0 : 1;
    if (kind !== 'clear' && typeof toast === 'function') toast({ rain: '🌧 Empieza a llover', snow: '❄ ¡Está nevando!', fog: '🌫 Llega la niebla' }[kind]);
    if (kind === 'clear' && typeof toast === 'function') toast('🌤 Se despeja el cielo');
    this.flakes.length = 0;
  },
  tick(dt){
    const playing = G.state === 'playing' || G.state === 'countdown';
    if (playing && !window.__noWeather){
      this.timer -= dt;
      if (this.timer <= 0){ this.timer = 28 + Math.random() * 30; this.set(this.kind === 'clear' ? this.pick() : 'clear'); if (this.kind === 'clear' && Math.random() < 0.3) this.set(this.pick()); }
    } else if (!playing){ this.kind = 'clear'; this.target = 0; }
    this.amt += (this.target - this.amt) * Math.min(1, dt * 0.7);
    if (this.amt < 0.003 && this.target === 0) this.amt = 0;
  },
  fog(f){ if (this.kind === 'fog' || this.amt > 0.01 && this.kind === 'fog'){ const k = this.amt; f.near *= 1 - 0.7 * k; f.far *= 1 - 0.55 * k; } },
  dim(){ return 1 - (this.kind === 'rain' ? 0.22 : this.kind === 'fog' ? 0.1 : this.kind === 'snow' ? 0.06 : 0) * this.amt; },
  draw(dt, a){
    this.tick(dt);
    const TD = todState(), c = ctx;
    // niebla: velo blanco
    if (this.kind === 'fog' && this.amt > 0.01){ c.fillStyle = `rgba(225,232,245,${0.2 * this.amt})`; c.fillRect(0, 0, W, H); }
    if (this.kind === 'rain' && this.amt > 0.02){
      const n = Math.floor(90 * this.amt); c.strokeStyle = `rgba(200,220,255,${0.5 * this.amt})`; c.lineWidth = 1.4; c.beginPath();
      for (let i = 0; i < n; i++){ const s = i * 97.13, x = ((s * 7.7 + G.tAnim * 160) % (W + 160)) - 80, y = ((s * 13.3 + G.tAnim * 1400) % (H + 60)) - 30; c.moveTo(x, y); c.lineTo(x - 7, y + 24); }
      c.stroke();
    }
    if (this.kind === 'snow' && this.amt > 0.02){
      while (this.flakes.length < 90) this.flakes.push({ x: Math.random() * W, y: Math.random() * H, v: 40 + Math.random() * 60, r: 1.4 + Math.random() * 2.6, p: Math.random() * 6 });
      c.fillStyle = `rgba(255,255,255,${0.9 * this.amt})`;
      for (const f of this.flakes){ f.y += f.v * dt; f.x += Math.sin(G.tAnim * 1.4 + f.p) * 24 * dt - 12 * dt; if (f.y > H + 6){ f.y = -6; f.x = Math.random() * W; } if (f.x < -6) f.x = W + 6; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 6.283); c.fill(); }
    }
    // luciérnagas de noche (solo cerca del suelo)
    const fl = TD.night * clamp((0.5 - a) / 0.3, 0, 1);
    if (fl > 0.1){
      while (this.flies.length < 34) this.flies.push({ x: Math.random(), y: 0.45 + Math.random() * 0.5, p: Math.random() * 6, s: 0.05 + Math.random() * 0.1 });
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const f of this.flies){
        f.p += dt * f.s * 6; const x = (f.x + Math.sin(f.p * 0.7) * 0.03) * W, y = (f.y + Math.cos(f.p) * 0.025) * H, k = (0.5 + 0.5 * Math.sin(G.tAnim * 2.4 + f.p * 3)) * fl;
        const g = c.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, `rgba(255,245,140,${0.9 * k})`); g.addColorStop(1, 'rgba(255,245,140,0)'); c.fillStyle = g; c.fillRect(x - 12, y - 12, 24, 24);
      }
      c.restore();
    }
    if (G.portalFx > 0){ G.portalFx = Math.max(0, G.portalFx - dt); const k = G.portalFx / 0.8; c.fillStyle = `rgba(170,140,255,${0.5 * k})`; c.fillRect(0, 0, W, H); }
  }
};
