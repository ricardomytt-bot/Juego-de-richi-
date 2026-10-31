/* 05 · render: fondo, suelo en perspectiva, ambiente, escena completa */
'use strict';
function skyAt(a){
  const K = THEME.sky;
  for (let i = 0; i < K.length - 1; i++){
    const k0 = K[i], k1 = K[i + 1];
    if (a <= k0.a && a >= k1.a){ const t = (k0.a - a) / (k0.a - k1.a); return { top: mix(k0.top, k1.top, t), bot: mix(k0.bot, k1.bot, t) }; }
  }
  return K[0];
}
const STARS = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.4, p: Math.random() * 6 }));

/* ------------------------------------------------------------ partículas de ambiente (lluvia, hojas, polvo de luz) */
const AMB = {
  kind: 'sparkle', ps: [],
  init(kind){
    this.kind = kind; this.ps = [];
    const n = kind === 'rain' ? 110 : kind === 'leaves' ? 26 : 46;
    for (let i = 0; i < n; i++) this.ps.push(this.make(true));
  },
  make(any){
    const k = this.kind;
    if (k === 'rain') return { x: Math.random() * (W + 200) - 100, y: any ? Math.random() * H : -20, v: 900 + Math.random() * 500, l: 12 + Math.random() * 16 };
    if (k === 'leaves') return { x: Math.random() * W, y: any ? Math.random() * H : -20, v: 50 + Math.random() * 70, p: Math.random() * 6, r: 5 + Math.random() * 6, a: Math.random() * 6 };
    return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, v: -(8 + Math.random() * 20), p: Math.random() * 6, r: 1 + Math.random() * 2.2 };
  },
  update(dt){
    const k = this.kind;
    for (let i = 0; i < this.ps.length; i++){
      const p = this.ps[i];
      if (k === 'rain'){ p.y += p.v * dt; p.x -= 180 * dt; if (p.y > H + 30 || p.x < -120) Object.assign(p, this.make(false)); }
      else if (k === 'leaves'){ p.y += p.v * dt; p.x += Math.sin(G.tAnim * 1.3 + p.p) * 40 * dt - 10 * dt; p.a += dt * 2; if (p.y > H + 20) Object.assign(p, this.make(false)); }
      else { p.y += p.v * dt; p.x += Math.sin(G.tAnim + p.p) * 8 * dt; if (p.y < -10) Object.assign(p, this.make(false)); }
    }
  },
  draw(){
    const k = this.kind;
    if (k === 'rain'){
      ctx.strokeStyle = 'rgba(200,220,255,.38)'; ctx.lineWidth = 1.3; ctx.beginPath();
      for (const p of this.ps){ ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * 0.18, p.y - p.l); }
      ctx.stroke();
    } else if (k === 'leaves'){
      for (const p of this.ps){ ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = (p.p > 3 ? THEME.leaf : '#e8a33d'); ctx.globalAlpha = 0.85; ell(ctx, 0, 0, p.r, p.r * 0.55); ctx.restore(); }
      ctx.globalAlpha = 1;
    } else {
      for (const p of this.ps){ ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(G.tAnim * 1.6 + p.p)); ctx.fillStyle = '#fff6d0'; circ(ctx, p.x, p.y, p.r); }
      ctx.globalAlpha = 1;
    }
  }
};

/* ------------------------------------------------------------ fondo */
function drawBackground(a, sky){
  const g = ctx.createLinearGradient(0, 0, 0, yH + 4);
  g.addColorStop(0, rgb(sky.top)); g.addColorStop(1, rgb(sky.bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // estrellas
  const sa = clamp((a - THEME.stars) / 0.3, 0, 1);
  if (sa > 0){
    ctx.fillStyle = '#fff';
    for (const s of STARS){ ctx.globalAlpha = sa * (0.5 + 0.5 * Math.sin(G.tAnim * 1.5 + s.p)); circ(ctx, s.x * W, s.y * yH * 0.95, s.r); }
    ctx.globalAlpha = 1;
  }
  // sol, rayos de luz y destello
  if (THEME.hasSun && a < 0.9 && a > 0.05){
    const su = clamp((0.88 - a) / 0.6, 0, 1);
    const sx = cx + laneW * 3.2, sy = lerp(yH + 6, yH - H * 0.3, smooth(su));
    const sc = mix(THEME.sunWarm, THEME.sun, su);
    const gr = ctx.createRadialGradient(sx, sy, 4, sx, sy, laneW * 2.6);
    gr.addColorStop(0, rgb(sc, 0.95)); gr.addColorStop(0.2, rgb(sc, 0.35)); gr.addColorStop(1, rgb(sc, 0));
    ctx.fillStyle = gr; ctx.fillRect(sx - laneW * 2.7, sy - laneW * 2.7, laneW * 5.4, laneW * 5.4);
    ctx.fillStyle = rgb(mix(sc, [255, 255, 255], 0.5)); circ(ctx, sx, sy, Math.max(14, laneW * 0.28));
    // rayos
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(sx, sy);
    for (let i = 0; i < 6; i++){
      const ang = 1.2 + i * 0.28 + Math.sin(G.tAnim * 0.25 + i) * 0.04;
      const rg = ctx.createLinearGradient(0, 0, Math.cos(ang) * H, Math.sin(ang) * H);
      rg.addColorStop(0, rgb(sc, 0.10)); rg.addColorStop(1, rgb(sc, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang - 0.05) * H * 1.3, Math.sin(ang - 0.05) * H * 1.3); ctx.lineTo(Math.cos(ang + 0.05) * H * 1.3, Math.sin(ang + 0.05) * H * 1.3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // destellos de lente hacia el centro
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 3; i++){ const fx = lerp(sx, cx, i * 0.28), fy = lerp(sy, H * 0.55, i * 0.28); ctx.fillStyle = rgb(sc, 0.05 * su + 0.02); circ(ctx, fx, fy, laneW * (0.18 + i * 0.14)); }
    ctx.restore();
  }
  // colinas lejanas y banco de nubes en el horizonte
  const hill = clamp((0.62 - a) / 0.5, 0, 1);
  const par = (G.x - 2) * 14;
  if (hill > 0){
    for (let layer = 0; layer < 2; layer++){
      const amp = H * (layer ? 0.05 : 0.09) * hill, off = layer ? 1.7 : 0.4;
      const col = mix(sky.bot, layer ? [112, 172, 146] : [150, 170, 210], layer ? 0.55 : 0.4);
      ctx.fillStyle = rgb(THEME === THEMES.dusk ? mix(col, [120, 80, 130], 0.4) : col); ctx.beginPath(); ctx.moveTo(0, yH + 3);
      for (let x = 0; x <= W + 8; x += 8){
        const xx = x - par * (layer ? 1.6 : 0.8);
        ctx.lineTo(x, yH - amp * (0.5 + 0.28 * Math.sin(xx * (layer ? 0.009 : 0.0045) + off) + 0.22 * Math.sin(xx * (layer ? 0.021 : 0.011) + off * 2.3)));
      }
      ctx.lineTo(W, yH + 3); ctx.closePath(); ctx.fill();
    }
  }
  // banco de nubes lejanas
  const dark = THEME === THEMES.storm;
  ctx.fillStyle = dark ? rgb(mix(sky.bot, [40, 46, 72], 0.55), 0.55) : rgb(mix(sky.bot, [255, 255, 255], 0.5), 0.4);
  for (let i = -1; i < 9; i++){
    const bx = ((i * 190 - par * 0.5 - G.tAnim * 4) % (W + 380) + (W + 380)) % (W + 380) - 190, bw = 120 + hash2(i, 5) * 120;
    ell(ctx, bx, yH - 6 - hash2(i, 9) * 14, bw, 14 + hash2(i, 3) * 12);
  }
}

function drawGround(a, sky){
  const drop = dropOf(G.P), P = G.P;
  if (!THEME._lrgb) THEME._lrgb = THEME.land.map(hex2rgb);
  const cover = clamp((a - 0.55) / 0.25, 0, 1);
  const patch = clamp(drop / 180, 0, 1);
  const k = sY - yH + drop;
  const yOf = z => yH + k / (1 + z / Z0);
  if (a > 0.8){
    const g = ctx.createLinearGradient(0, yH, 0, H);
    g.addColorStop(0, rgb(mix(sky.bot, [255, 255, 255], 0.3))); g.addColorStop(1, rgb(mix(sky.bot, [255, 255, 255], 0.72)));
    ctx.fillStyle = g; ctx.fillRect(0, yH, W, H - yH);
  } else {
    const BAND = 10, base = Math.floor(P / BAND), grass = THEME.grass;
    for (let i = Math.ceil(VIEW / BAND) + 1; i >= -3; i--){
      const idx = base + i;
      let z0 = idx * BAND - P, z1 = z0 + BAND; if (z1 <= -18) continue; z0 = Math.max(z0, -18);
      const y0 = yOf(z0), y1 = yOf(z1); if (Math.min(y0, y1) > H) continue;
      const s0 = 1 / (1 + z0 / Z0), s1 = 1 / (1 + z1 / Z0);
      const stripe = (idx & 1) ? 0.95 : 1.03;
      for (let j = -9; j <= 9; j++){
        const hv = hash2(idx * 7 + 3, j + 31), rc = THEME._lrgb[Math.floor(hv * THEME._lrgb.length)];
        const m = mix(grass, rc, patch), tr = (Math.abs(j * 2) < 3 && patch < 0.7) ? 1.05 : 1;
        ctx.fillStyle = rgb([m[0] * stripe * tr, m[1] * stripe * tr, m[2] * stripe * tr]);
        const l0 = j * 2 - 1, l1 = j * 2 + 1.04;
        ctx.beginPath();
        ctx.moveTo(cx + l0 * laneW * s0, y0); ctx.lineTo(cx + l1 * laneW * s0, y0);
        ctx.lineTo(cx + l1 * laneW * s1, y1); ctx.lineTo(cx + l0 * laneW * s1, y1); ctx.closePath(); ctx.fill();
      }
    }
  }
  // mar de nubes (se disuelve al bajar)
  if (cover > 0){
    const BAND = 12, base = Math.floor(P / BAND), SEA = THEME.sea;
    for (let i = Math.ceil(VIEW / BAND) + 1; i >= 0; i--){
      const idx = base + i, z0 = idx * BAND - P + BAND * 0.5; if (z0 <= 0.4) continue;
      const y = yOf(z0), s = 1 / (1 + z0 / Z0); if (y > H + 60) continue;
      for (let j = -9; j <= 9; j++){
        if (hash2(idx * 13 + 5, j + 77) > cover) continue;
        const col = SEA[Math.floor(hash2(idx, j * 3) * SEA.length)];
        const w = laneW * s * (2.4 + 1.6 * hash2(idx + 9, j)), ry = Math.max(3, (yOf(z0 - BAND * 0.5) - yOf(z0 + BAND * 0.5)) * 0.9 + 4);
        const px = cx + (j * 2 + (hash2(idx, j + 4) - 0.5) * 1.6) * laneW * s;
        ctx.fillStyle = col; ctx.globalAlpha = 0.95; ell(ctx, px, y, w, ry);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(ctx, px - w * 0.15, y - ry * 0.25, w * 0.65, ry * 0.65);
        ctx.fillStyle = 'rgba(120,130,180,.12)'; ell(ctx, px + w * 0.1, y + ry * 0.45, w * 0.8, ry * 0.4);
        ctx.globalAlpha = 1;
      }
    }
  }
  // bruma en el horizonte
  const fg = ctx.createLinearGradient(0, yH - 2, 0, yH + H * 0.18);
  fg.addColorStop(0, rgb(sky.bot, 1)); fg.addColorStop(1, rgb(sky.bot, 0));
  ctx.fillStyle = fg; ctx.fillRect(0, yH - 2, W, H * 0.18 + 2);
  // guías de carril
  const gl = 0.10 + 0.2 * (1 - patch);
  ctx.strokeStyle = `rgba(255,255,255,${gl})`; ctx.lineWidth = 2; ctx.beginPath();
  for (let l = -2.5; l <= 2.5; l += 1){
    const sFar = 1 / (1 + VIEW / Z0), sNear = 1.3;
    ctx.moveTo(cx + l * laneW * sFar, yH + (sY - yH) * sFar); ctx.lineTo(cx + l * laneW * sNear, yH + (sY - yH) * sNear);
  }
  ctx.stroke();
}

const streaks = Array.from({ length: 38 }, () => ({ a: Math.random() * 6.283, r: Math.random(), sp: 0.6 + Math.random() * 0.8 }));
function drawStreaks(a, dt){
  const dv = diving() ? 1 : braking() ? 0.15 : 0.45;
  if (!(a > 0.02) && !diving()) return;
  const vx = cx, vy = yH + 10, maxR = Math.hypot(W, H);
  ctx.lineCap = 'round';
  const spf = (0.35 + G.vP / 22 * 0.9) * (diving() ? 2.2 : 1);
  for (const s of streaks){
    s.r += dt * s.sp * spf * (0.2 + s.r * 1.6);
    if (s.r > 1){ s.r = 0.03; s.a = Math.random() * 6.283; s.sp = 0.6 + Math.random() * 0.8; }
    const r0 = s.r * maxR * 0.75, r1 = r0 + (6 + s.r * 70) * (0.5 + dv);
    ctx.strokeStyle = `rgba(255,255,255,${(0.05 + 0.3 * s.r) * dv * (diving() ? 1 : 0.8)})`;
    ctx.lineWidth = 1 + s.r * 2.2;
    ctx.beginPath(); ctx.moveTo(vx + Math.cos(s.a) * r0, vy + Math.sin(s.a) * r0 * 0.8); ctx.lineTo(vx + Math.cos(s.a) * r1, vy + Math.sin(s.a) * r1 * 0.8); ctx.stroke();
  }
}

/* ------------------------------------------------------------ escena */
function playerScreen(){
  const drop = dropOf(G.P);
  const h = (0.25 + 0.17 * clamp(drop / 80, 0, 1)) * laneW;
  return { x: cx + (G.x - 2) * laneW, y: sY - h, h };
}
function airShadow(z, lat, w, drop){
  if (drop > 260) return;
  const gp = proj(z, lat, -drop);
  ctx.fillStyle = `rgba(20,40,30,${0.2 * (1 - drop / 300)})`; ell(ctx, gp.x, gp.y, w * 0.4, w * 0.07);
}

function drawScene(dt){
  const a = altFrac(G.P), sky = skyAt(a), drop = dropOf(G.P);
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  drawBackground(a, sky);
  drawGround(a, sky);
  drawStreaks(a, dt);
  if (G.boss) bossGround(drop);

  const items = [], P = G.P, t = G.tAnim, gt = G.t;
  const airH = 0.38 * laneW;
  const o = LV.objs;
  for (let i = lowerBound(o, P - 6); i < o.length && o[i].P < P + VIEW; i++){
    const ob = o[i]; if (ob.taken) continue;
    items.push({ z: ob.P - P, ob, k: 0 });
  }
  const sc = LV.scenery;
  for (let i = lowerBound(sc, P - 6); i < sc.length && sc[i].P < P + VIEW; i++) items.push({ z: sc[i].P - P, ob: sc[i], k: 1 });
  for (const g of G.ghosts){
    const s = ghostAt(g, G.state === 'countdown' ? 0 : G.t); if (!s) continue;
    const z = s.P - P; if (z > -4 && z < VIEW) items.push({ z, g, s, k: 2 });
  }
  if (G.boss) bossItems(items, airH);
  items.sort((p, q) => q.z - p.z);

  const pl = playerScreen();
  let playerDone = false;
  const drawPlayer = () => {
    playerDone = true;
    const sh = sY + drop;
    if (sh < H + 30){
      const hh = pl.h + drop, al = clamp(0.28 - hh / 1400, 0.05, 0.28);
      ctx.fillStyle = `rgba(20,40,30,${al})`; ell(ctx, pl.x, sh + 2, laneW * (0.5 - clamp(hh / 1500, 0, 0.2)), laneW * 0.08);
    }
    const blink = G.inv > 0 && Math.floor(G.tAnim * 14) % 2 === 0;
    const u = laneW * 0.23, dv = diving() ? 1 : braking() ? -0.4 : 0;
    ctx.save(); ctx.translate(pl.x, pl.y + (G.fallT > 0 ? (1.6 - G.fallT) * 160 : 0));
    if (G.fallT > 0) ctx.rotate((1.6 - G.fallT) * 3);
    // estela de las puntas de las alas
    if (G.fallT <= 0 && !G.noPlane){
      const sp = clamp(G.vP / 30, 0.3, 1.4);
      ctx.strokeStyle = `rgba(255,255,255,${0.16 + 0.12 * sp})`; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const sg of [-1, 1]){
        const gx = sg * 2.45 * u, gy = 0.0;
        const gl = ctx.createLinearGradient(gx, gy, gx - sg * 0.4 * u, gy - 2.6 * u * sp); gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = gl; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - sg * 0.4 * u, gy - 2.6 * u * sp); ctx.stroke();
      }
    }
    if (!G.noPlane) drawPlane(ctx, u, G.bank, '#ff5a4a', t, blink ? 0.45 : 1, dv, G.flash > 0.2);
    ctx.restore();
  };

  for (const it of items){
    if (it.z < 0 && !playerDone) drawPlayer();
    const z = Math.max(it.z, -4);
    if (it.k === 4){ it.fn(z); continue; }
    const fog = clamp((VIEW - z) / 70, 0, 1) * clamp((z + 6) / 6, 0, 1);
    if (fog <= 0.01) continue;
    if (it.k === 2){
      const p = proj(z, it.s.x - 2, pl.h);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s);
      ctx.globalAlpha = fog * 0.55; drawPlane(ctx, laneW * 0.23, 0, it.g.color, t, 0.9, 0, false);
      ctx.globalAlpha = fog; ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.max(11, laneW * 0.16) + 'px ' + FONT; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(20,30,70,.6)'; ctx.lineWidth = 4; ctx.strokeText(it.g.name, 0, -laneW * 0.75); ctx.fillText(it.g.name, 0, -laneW * 0.75);
      ctx.restore(); continue;
    }
    const ob = it.ob;
    ctx.globalAlpha = fog;
    if (it.k === 1){
      if (ob.type === 'puff'){
        const p = proj(z, ob.lat, ob.h);
        if (!(ob.h < -drop * 0.5 && a > 0.5) && !(drop < 150 && ob.h < 150)) drawCloud(ctx, p.x, p.y, laneW * 1.3 * ob.sc * p.s, false, t, ob.v);
      } else {
        const gp = proj(z, ob.lat, -drop);
        if (ob.type === 'stree') drawTree(ctx, gp.x, gp.y, laneW * 1.1 * ob.sc * gp.s, ob.v, THEME.leaf);
        else if (ob.type === 'srock') drawRock(ctx, gp.x, gp.y, laneW * 0.9 * ob.sc * gp.s);
        else if (ob.type === 'flower') { if (drop < 120) drawFlower(ctx, gp.x, gp.y, laneW * 0.5 * ob.sc * gp.s, ob.v); }
        else if (drop < 120) drawTuft(ctx, gp.x, gp.y, laneW * 0.5 * ob.sc * gp.s);
      }
      ctx.globalAlpha = 1; continue;
    }
    const lane = laneOf(ob, gt), lat = lane - 2;
    switch (ob.type){
      case 'cloud': case 'storm': { const p = proj(z, lat, airH); airShadow(z, lat, laneW * 1.1 * p.s, drop); drawCloud(ctx, p.x, p.y, laneW * 1.18 * ob.sc * p.s, ob.type === 'storm', t, ob.v); break; }
      case 'bird': { const p = proj(z, lat, airH); airShadow(z, lat, laneW * 0.7 * p.s, drop); drawBird(ctx, p.x, p.y, laneW * 0.9 * p.s, t, ob.v); break; }
      case 'hog': { const p = proj(z, lat, -drop); drawHog(ctx, p.x, p.y - laneW * 0.18 * p.s, laneW * 0.95 * p.s, t, ob.v); break; }
      case 'tree': { const p = proj(z, lat, -drop); drawTree(ctx, p.x, p.y, laneW * 1.35 * ob.sc * p.s, ob.v, THEME.leaf); break; }
      case 'bush': { const p = proj(z, lat, -drop); drawBush(ctx, p.x, p.y, laneW * 1.0 * ob.sc * p.s); break; }
      case 'acorn': case 'gold': case 'heart': { const p = proj(z, lat, drop > 90 ? airH : airH * 0.85); drawAcorn(ctx, p.x, p.y, laneW * (ob.type === 'gold' ? 0.62 : 0.5) * p.s, ob.type, t, ob.P); break; }
    }
    ctx.globalAlpha = 1;
  }
  if (!playerDone) drawPlayer();
  if (G.boss) bossOverlay(pl);

  // ambiente + partículas
  AMB.draw();
  for (const p of particles){
    ctx.globalAlpha = clamp(p.life, 0, 1); ctx.fillStyle = p.color;
    if (p.confetti) ctx.fillRect(p.x, p.y, p.size, p.size * 0.5); else circ(ctx, p.x, p.y, p.size);
  }
  ctx.globalAlpha = 1;
  // post-proceso: bruma de nubes, tinte de ambiente, relámpago y viñeta
  const mist = Math.max(0, 1 - Math.abs(a - 0.77) / 0.05) * 0.55;
  if (mist > 0){ ctx.fillStyle = `rgba(255,255,255,${mist})`; ctx.fillRect(0, 0, W, H); }
  if (THEME.tint){ ctx.fillStyle = rgb(THEME.tint, THEME.tint[3]); ctx.fillRect(0, 0, W, H); }
  if (G.lightning > 0){ ctx.fillStyle = `rgba(235,240,255,${Math.min(0.75, G.lightning * 2.4)})`; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0.2){ ctx.fillStyle = `rgba(255,255,255,${(G.flash - 0.2) * 1.2})`; ctx.fillRect(0, 0, W, H); }
  if (G.inv > 0 && G.fallT <= 0 && G.slow > 0){ ctx.fillStyle = `rgba(255,80,80,${G.slow * 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (G.fade > 0){ ctx.fillStyle = `rgba(255,255,255,${clamp(G.fade, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  if (vignette) ctx.drawImage(vignette, 0, 0, W, H);
  ctx.restore();
}
