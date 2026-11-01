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
  // estrellas fugaces (solo en lo más alto, de noche)
  if (sa > 0.3){
    const k = Math.floor(G.tAnim / 4.1), ph = G.tAnim / 4.1 - k;
    if (ph < 0.16){ const q = ph / 0.16, x0 = hash2(k, 1) * W * 0.9, y0 = hash2(k, 2) * yH * 0.55, dx = 170 * q, dy = 70 * q;
      const sg = ctx.createLinearGradient(x0 + dx, y0 + dy, x0 + dx - 90, y0 + dy - 38); sg.addColorStop(0, `rgba(255,255,255,${1 - q * 0.6})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = sg; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0 + dx, y0 + dy); ctx.lineTo(x0 + dx - 90, y0 + dy - 38); ctx.stroke(); }
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
    for (let i = 0; i < 4; i++){
      const ang = 1.3 + i * 0.3 + Math.sin(G.tAnim * 0.25 + i) * 0.04;
      const rg = ctx.createLinearGradient(0, 0, Math.cos(ang) * H, Math.sin(ang) * H);
      rg.addColorStop(0, rgb(sc, 0.028)); rg.addColorStop(1, rgb(sc, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang - 0.035) * H * 1.3, Math.sin(ang - 0.035) * H * 1.3); ctx.lineTo(Math.cos(ang + 0.035) * H * 1.3, Math.sin(ang + 0.035) * H * 1.3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // destellos de lente hacia el centro
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 3; i++){ const fx = lerp(sx, cx, i * 0.28), fy = lerp(sy, H * 0.55, i * 0.28); ctx.fillStyle = rgb(sc, 0.05 * su + 0.02); circ(ctx, fx, fy, laneW * (0.18 + i * 0.14)); }
    ctx.restore();
  }
  // colinas lejanas y banco de nubes en el horizonte
  const hill = clamp((0.62 - a) / 0.5, 0, 1);
  const par = (G.x - MID) * 14;
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
    g.addColorStop(0, rgb(mix(sky.bot, [255, 255, 255], 0.12))); g.addColorStop(1, rgb(mix(sky.bot, [235, 240, 255], 0.42)));
    ctx.fillStyle = g; ctx.fillRect(0, yH, W, H - yH);
  } else {
    const BAND = 10, base = Math.floor(P / BAND), grass = THEME.grass; const segs = [];
    for (let i = Math.ceil(VIEW / BAND) + 1; i >= -3; i--){
      const idx = base + i;
      let z0 = idx * BAND - P, z1 = z0 + BAND; if (z1 <= -18) continue; z0 = Math.max(z0, -18);
      const y0 = yOf(z0), y1 = yOf(z1); if (Math.min(y0, y1) > H) continue;
      const s0 = 1 / (1 + z0 / Z0), s1 = 1 / (1 + z1 / Z0);
      const stripe = (idx & 1) ? 0.95 : 1.03;
      for (let j = -9; j <= 9; j++){
        const hv = hash2(idx * 7 + 3, j + 31), rc = THEME._lrgb[Math.floor(hv * THEME._lrgb.length)];
        const lake = hv > 0.93 && patch > 0.35 && Math.abs(j * 2) > 3;
        const m = lake ? [78, 150, 220] : mix(grass, rc, patch), tr = (Math.abs(j * 2) < 3 && patch < 0.7) ? 1.05 : 1;
        ctx.fillStyle = rgb([m[0] * stripe * tr, m[1] * stripe * tr, m[2] * stripe * tr]);
        const l0 = j * 2 - 1, l1 = j * 2 + 1.04;
        ctx.beginPath();
        ctx.moveTo(cx + l0 * laneW * s0, y0); ctx.lineTo(cx + l1 * laneW * s0, y0);
        ctx.lineTo(cx + l1 * laneW * s1, y1); ctx.lineTo(cx + l0 * laneW * s1, y1); ctx.closePath(); ctx.fill();
        if (patch > 0.3 && (hv * 7 | 0) % 2 === 0){   // surcos de cultivo
          for (const f of [0.3, 0.55, 0.8]){ const lf = lerp(l0, l1, f); segs.push(cx + lf * laneW * s0, y0, cx + lf * laneW * s1, y1); }
        }
      }
      if (segs.length){ ctx.strokeStyle = 'rgba(20,70,20,.10)'; ctx.lineWidth = Math.max(1, 2.2 * s0); ctx.beginPath(); for (let q = 0; q < segs.length; q += 4){ ctx.moveTo(segs[q], segs[q + 1]); ctx.lineTo(segs[q + 2], segs[q + 3]); } ctx.stroke(); segs.length = 0; }
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
}

const wisps = Array.from({ length: 9 }, () => ({ sx: Math.random() < 0.5 ? -1 : 1, k: 0.35 + Math.random() * 0.9, r: Math.random(), sp: 0.5 + Math.random() * 0.7 }));
const streaks = Array.from({ length: 38 }, () => ({ a: Math.random() * 6.283, r: Math.random(), sp: 0.6 + Math.random() * 0.8 }));
function drawStreaks(a, dt){
  const dv = diving() ? 1 : braking() ? 0.15 : 0.45;
  if (!(a > 0.02) && !diving()) return;
  const vx = cx, vy = yH + 10, maxR = Math.hypot(W, H);
  ctx.lineCap = 'round';
  const spf = (0.35 + G.vP / 22 * 0.9) * (diving() ? 2.2 : 1);
  if (a > 0.08){   // jirones suaves de nube que pasan junto al avión
    for (const w of wisps){
      w.r += dt * w.sp * spf * (0.12 + w.r * 1.4); if (w.r > 1){ w.r = 0.05; w.sx = Math.random() < 0.5 ? -1 : 1; w.k = 0.35 + Math.random() * 0.9; w.sp = 0.5 + Math.random() * 0.7; }
      const rr = w.r * Math.hypot(W, H) * 0.7, x = vx + w.sx * w.k * rr * 0.95, y = vy + rr * (0.35 + w.k * 0.25);
      ctx.fillStyle = `rgba(255,255,255,${0.13 * Math.sin(Math.PI * w.r)})`; ell(ctx, x, y, 30 + w.r * 260, 8 + w.r * 56);
    }
  }
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
  return { x: cx + (G.x - MID) * laneW, y: sY - h, h };
}
function airShadow(z, lat, w, drop){
  if (drop > 260) return;
  const gp = proj(z, lat, -drop);
  ctx.fillStyle = `rgba(20,40,30,${0.2 * (1 - drop / 300)})`; ell(ctx, gp.x, gp.y, w * 0.4, w * 0.07);
}


/* ------------------------------------------------------------ carriles MUY marcados: pista luminosa con rieles, rayas y flechas */
function planeQuad(l0, l1, z0, z1, fill){
  if (z1 <= -16) return; if (z0 < -16) z0 = -16;   // nunca dibujar detrás de la cámara (la perspectiva se invierte)
  const a = proj(z0, l0, 0), b = proj(z0, l1, 0), c = proj(z1, l1, 0), d = proj(z1, l0, 0);
  ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
}
function lanesAir(alpha){
  // CIELO: corrientes de aire luminosas (nada de asfalto): cintas de luz, estelas de viento y destellos
  const P = G.P, zN = -18, zF = VIEW, h = LANES / 2, rc = THEME.rail, t = G.tAnim;
  for (let i = 0; i < LANES; i++) planeQuad(i - MID - 0.5, i - MID + 0.5, zN, zF, rgb(i % 2 ? [40, 90, 235] : [255, 255, 255], (i % 2 ? 0.30 : 0.16) * alpha));
  // estelas de viento que corren por cada carril
  for (let i = 0; i < LANES; i++){
    for (let k = 0; k < 5; k++){
      const lat = i - MID + (k - 2) * 0.19, per = 34 + k * 9, sp = 0.8 + k * 0.12, off = (P * sp + hash2(i * 7 + k, 3) * per) % per;
      for (let q = 0; q < Math.ceil((zF - zN) / per) + 1; q++){
        const z0 = q * per - off + zN, len = 9 + hash2(i + k, q) * 10;
        planeQuad(lat - 0.012, lat + 0.012, z0, z0 + len, rgb([255, 255, 255], (0.30 + 0.2 * hash2(k, q)) * alpha));
      }
    }
  }
  // cintas de luz en los bordes (con contorno suave para que se vean sobre las nubes blancas)
  for (const sg of [-1, 1]){
    const b = sg * h;
    planeQuad(b - 0.16, b + 0.16, zN, zF, rgb(rc, 0.20 * alpha));
    planeQuad(b - 0.085, b + 0.085, zN, zF, rgb([30, 70, 180], 0.42 * alpha));
    planeQuad(b - 0.045, b + 0.045, zN, zF, rgb(mix(rc, [255, 255, 255], 0.6), 0.95 * alpha));
  }
  // separadores interiores: hilos de luz que parpadean
  for (let i = 1; i < LANES; i++){
    const b = i - MID - 0.5, per = 6, off = P % per;
    for (let k = 0; k < Math.ceil((zF - zN) / per) + 1; k++){ const z0 = k * per - off + zN; planeQuad(b - 0.045, b + 0.045, z0, z0 + 3.0, rgb(mix(rc, [255, 255, 255], 0.5), (0.8 + 0.2 * Math.sin(t * 5 + k)) * alpha)); }
  }
  // destellos que viajan por los bordes
  for (const sg of [-1, 1]){
    for (let k = 0; k < 16; k++){
      const z = ((k * 13 - P * 1.0) % 208 + 208) % 208 - 15, p = proj(z, sg * h, 0);
      ctx.fillStyle = `rgba(255,255,255,${(0.35 + 0.5 * Math.sin(t * 6 + k * 2)) * alpha})`; circ(ctx, p.x, p.y, Math.max(1, 6 * p.s));
    }
  }
}
function lanesRoad(alpha){
  // TIERRA: carretera con rieles, rayas, flechas y postes
  const P = G.P, zN = -18, zF = VIEW, h = LANES / 2;
  planeQuad(-h - 0.12, h + 0.12, zN, zF, `rgba(14,22,70,${0.34 * alpha})`);
  for (let i = 0; i < LANES; i++) planeQuad(i - MID - 0.5, i - MID + 0.5, zN, zF, i % 2 ? `rgba(120,170,255,${0.10 * alpha})` : `rgba(255,255,255,${0.16 * alpha})`);
  const off = P % 14; ctx.fillStyle = `rgba(255,255,255,${0.34 * alpha})`;
  for (let k = 0; k < Math.ceil((zF - zN) / 14) + 1; k++){
    const z0 = k * 14 - off + zN; if (z0 < -15) continue;
    for (let i = 0; i < LANES; i++){
      const l = i - MID, a = proj(z0, l - 0.17, 0), b = proj(z0 + 3.2, l, 0), c = proj(z0, l + 0.17, 0), d = proj(z0 + 1.2, l, 0);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
    }
  }
  for (const sg of [-1, 1]){
    const b = sg * h;
    planeQuad(b - 0.20, b + 0.20, zN, zF, `rgba(255,170,40,${0.28 * alpha})`);
    planeQuad(b - 0.075, b + 0.075, zN, zF, `rgba(255,196,64,${0.98 * alpha})`);
    planeQuad(b - 0.03, b + 0.03, zN, zF, `rgba(255,255,255,${0.98 * alpha})`);
  }
  const per = 8, doff = P % per;
  for (let i = 1; i < LANES; i++){
    const b = i - MID - 0.5;
    for (let k = 0; k < Math.ceil((zF - zN) / per) + 1; k++){ const z0 = k * per - doff + zN; planeQuad(b - 0.05, b + 0.05, z0, z0 + 4.2, `rgba(255,255,255,${0.95 * alpha})`); }
  }
  const pp = 22, poff = P % pp, t = G.tAnim;
  for (let k = 0; k < Math.ceil((zF - zN) / pp) + 1; k++){
    const z = k * pp - poff + zN; if (z < -15) continue;
    for (const sg of [-1, 1]){
      const b = proj(z, sg * (h + 0.16), 0), top = proj(z, sg * (h + 0.16), laneW * 0.3);
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * alpha})`; ctx.lineWidth = Math.max(1, 5 * b.s); ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(top.x, top.y); ctx.stroke();
      ctx.fillStyle = `rgba(255,${200 + 40 * Math.sin(t * 4 + k)},120,${0.95 * alpha})`; circ(ctx, top.x, top.y, Math.max(1.5, 8 * top.s));
    }
  }
}
/* mezcla suave entre el estilo "aire" (volando) y el "carretera" (ya en tierra) */
function drawLanes(){
  const air = clamp(dropOf(G.P) / 70, 0, 1);
  if (air > 0.01) lanesAir(air);
  if (air < 0.99) lanesRoad(1 - air);
}
/* placa de color en el carril de cada obstáculo: se ve exactamente en qué línea está */
const PLATE = { crystal: [90, 220, 255], thunderbox: [255, 220, 60], crate: [255, 150, 50], spikerock: [255, 80, 80], bee: [255, 205, 40], slime: [200, 90, 255],
  comet: [255, 90, 40], boulder: [230, 140, 70], bat: [220, 70, 170], bunny: [255, 150, 190], drone: [70, 255, 200], mole: [210, 150, 90], gate: [255, 230, 60] };
function plateAt(lat, z, col, fade, pulse, w0){
  planeQuad(lat - 0.5, lat + 0.5, z - 1.8, z + 1.8, rgb(col, (0.46 + 0.16 * pulse) * fade));
  planeQuad(lat - 0.5, lat + 0.5, z - 0.16, z + 0.16, rgb([255, 255, 255], 0.8 * fade));
  planeQuad(lat - 0.5, lat + 0.5, z - 1.8, z - 1.55, rgb([255, 255, 255], 0.55 * fade)); planeQuad(lat - 0.5, lat + 0.5, z + 1.55, z + 1.8, rgb([255, 255, 255], 0.55 * fade));
}
function drawPlates(P, gt){
  const o = LV.objs;
  for (let i = lowerBound(o, P - 2); i < o.length && o[i].P < P + VIEW; i++){
    const ob = o[i], col = PLATE[ob.type]; if (!col || ob.dead) continue;
    const z = ob.P - P, fade = clamp((VIEW - z) / 60, 0, 1); if (fade <= 0.02) continue;
    const pulse = 0.5 + 0.5 * Math.sin(G.tAnim * 7 + ob.P);
    if (ob.type === 'gate'){
      const on = gateOn(ob, gt), fl = gateFlicker(ob, gt);
      planeQuad(ob.ga - 0.5, ob.gb + 0.5, z - 1.8, z + 1.8, rgb(on ? [255, 230, 60] : fl ? [255, 150, 40] : [120, 220, 140], (on ? 0.55 : 0.30) * fade));
      planeQuad(ob.ga - 0.5, ob.gb + 0.5, z - 0.16, z + 0.16, rgb([255, 255, 255], 0.8 * fade)); continue;
    }
    if (ob.type === 'mole'){ if (z > 16){ plateAt(ob.lane - MID, z, col, fade, pulse); } else plateAt(ob.lane - MID, z, [255, 70, 50], fade, pulse); continue; }
    const lat = laneOf(ob, gt) - MID;
    if (ob.a !== undefined) planeQuad(ob.a - MID - 0.5, ob.b - MID + 0.5, z - 1.4, z + 1.4, rgb(col, (ob.hop ? 0.10 : 0.13) * fade));
    plateAt(lat, z, col, fade, pulse);
  }
  for (const d of LV.dyn){
    if (d.dead) continue;
    const col = PLATE[d.type], z = d.pe - P, fade = clamp((VIEW - z) / 60, 0, 1); if (z < -2 || fade <= 0.02) continue;
    const pulse = 0.5 + 0.5 * Math.sin(G.tAnim * 12 + d.P);
    if (d.vr) planeQuad(laneOf(d, gt) - MID - 0.5, laneOf(d, gt) - MID + 0.5, z, Math.min(VIEW, z + 60), rgb(col, 0.10 * fade));   // pista por donde se lanzará
    plateAt(laneOf(d, gt) - MID, z, d.locked ? [255, 40, 40] : col, fade, pulse);
  }
}

/* resplandor (bloom): reduce la imagen, se queda con lo más brillante y lo suma desenfocado */
let bloomCv = null, bloomCx = null;
const Q = { bloom: true };
function drawBloom(strength){
  const bw = Math.max(48, (W / 7) | 0), bh = Math.max(32, (H / 7) | 0);
  if (!bloomCv){ bloomCv = document.createElement('canvas'); bloomCx = bloomCv.getContext('2d'); }
  if (bloomCv.width !== bw || bloomCv.height !== bh){ bloomCv.width = bw; bloomCv.height = bh; }
  bloomCx.globalCompositeOperation = 'copy'; bloomCx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, bw, bh);
  bloomCx.globalCompositeOperation = 'source-over'; bloomCx.fillStyle = 'rgba(0,0,0,.8)'; bloomCx.fillRect(0, 0, bw, bh);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = strength; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(bloomCv, 0, 0, W, H); ctx.restore();
}
function drawScene(dt){
  const a = altFrac(G.P), sky = skyAt(a), drop = dropOf(G.P);
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
  drawBackground(a, sky);
  drawGround(a, sky);
  drawLanes();
  drawStreaks(a, dt);
  if (G.boss) bossGround(drop);

  const items = [], P = G.P, t = G.tAnim, gt = G.t;
  const airH = 0.38 * laneW;
  const o = LV.objs;
  for (let i = lowerBound(o, P - 6); i < o.length && o[i].P < P + VIEW; i++){
    const ob = o[i]; if (ob.taken || ob.dead) continue;
    items.push({ z: ob.P - P, ob, k: 0 });
  }
  for (const d of LV.dyn){ if (d.dead) continue; const z = d.pe - P; if (z > -4 && z < VIEW) items.push({ z, ob: d, k: 0 }); }
  const sc = LV.scenery;
  for (let i = lowerBound(sc, P - 6); i < sc.length && sc[i].P < P + VIEW; i++) items.push({ z: sc[i].P - P, ob: sc[i], k: 1 });
  for (const g of G.ghosts){
    const s = ghostAt(g, G.state === 'countdown' ? 0 : G.t); if (!s) continue;
    const z = s.P - P; if (z > -4 && z < VIEW) items.push({ z, g, s, k: 2 });
  }
  if (G.boss) bossItems(items, airH);
  drawPlates(P, gt);
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
    if (!G.noPlane){
      if (G.starT > 0){ for (let i = 0; i < 3; i++){ ctx.strokeStyle = `hsla(${(t * 260 + i * 90) % 360},95%,62%,.55)`; ctx.lineWidth = u * 0.3; ctx.beginPath(); ctx.arc(0, 0.3 * u, (2.7 + i * 0.35 + 0.15 * Math.sin(t * 9 + i)) * u, 0, TAU); ctx.stroke(); } glow(ctx, 0, 0.3 * u, u * 5.5, 'rgba(255,230,90,A)'); }
      if (G.magT > 0){ for (let i = 0; i < 3; i++){ const k = ((t * 1.1 + i / 3) % 1); ctx.strokeStyle = `rgba(${i % 2 ? '90,170,255' : '255,90,90'},${(1 - k) * 0.8})`; ctx.lineWidth = u * 0.18; ctx.beginPath(); ctx.arc(0, 0.3 * u, (1.8 + k * 5) * u, 0, TAU); ctx.stroke(); } }
      drawPlane(ctx, u, G.bank, '#ff5a4a', t, blink ? 0.45 : 1, dv, G.flash > 0.2);
      if (G.shield){
        const bg = ctx.createRadialGradient(-u * 0.9, -u * 1.1, u * 0.3, 0, 0.2 * u, u * 3.1); bg.addColorStop(0, 'rgba(255,255,255,.35)'); bg.addColorStop(0.7, 'rgba(110,200,255,.14)'); bg.addColorStop(1, 'rgba(70,160,255,.38)');
        ctx.fillStyle = bg; ctx.strokeStyle = `rgba(255,255,255,${0.7 + 0.2 * Math.sin(t * 6)})`; ctx.lineWidth = u * 0.14; ctx.beginPath(); ctx.arc(0, 0.2 * u, 3.0 * u, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = u * 0.22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0.2 * u, 2.5 * u, 3.6, 4.4); ctx.stroke();
      }
    }
    ctx.restore();
  };

  for (const it of items){
    if (it.z < 0 && !playerDone) drawPlayer();
    const z = Math.max(it.z, -4);
    if (it.k === 4){ it.fn(z); continue; }
    const fog = clamp((VIEW - z) / 70, 0, 1) * clamp((z + 6) / 6, 0, 1);
    if (fog <= 0.01) continue;
    if (it.k === 2){
      const p = proj(z, it.s.x - MID, pl.h);
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s);
      ctx.globalAlpha = fog * 0.55; drawPlane(ctx, laneW * 0.23, 0, it.g.color, t, 0.9, 0, false);
      ctx.globalAlpha = fog; ctx.fillStyle = '#fff'; ctx.font = '700 ' + Math.max(11, laneW * 0.16) + 'px ' + FONT; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(20,30,70,.6)'; ctx.lineWidth = 4; ctx.strokeText(it.g.name, 0, -laneW * 0.75); ctx.fillText(it.g.name, 0, -laneW * 0.75);
      ctx.restore(); continue;
    }
    const ob = it.ob;
    ctx.globalAlpha = fog;
    if (it.k === 1){
      if (ob.type === 'islet'){ const p = proj(z, ob.lat, ob.h); if (a > 0.45) drawIsland(p.x, p.y, laneW * 1.7 * ob.sc * p.s, { T: t + ob.v * 9, glow: 0 }); }
      else if (ob.type === 'balloon'){ const p = proj(z, ob.lat, ob.h); if (a > 0.1) drawBalloon(ctx, p.x, p.y, laneW * 1.3 * ob.sc * p.s, t, ob.v); }
      else if (ob.type === 'house' || ob.type === 'windmill'){ const gp = proj(z, ob.lat, -drop); if (drop < 90){ if (ob.type === 'house') drawHouse(ctx, gp.x, gp.y, laneW * 1.4 * ob.sc * gp.s, ob.v); else drawWindmill(ctx, gp.x, gp.y, laneW * 1.7 * ob.sc * gp.s, t, ob.v); } }
      else if (ob.type === 'flock'){ const p = proj(z, ob.lat, ob.h); if (a > 0.2) drawFlock(ctx, p.x, p.y, laneW * 0.9 * ob.sc * p.s, t, ob.v); }
      else if (ob.type === 'puff'){
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
    const lane = laneOf(ob, gt), lat = lane - MID;
    switch (ob.type){
      case 'crystal': { const p = proj(z, lat, airH); airShadow(z, lat, laneW * 0.9 * p.s, drop); drawCrystal(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v); break; }
      case 'thunderbox': { const p = proj(z, lat, airH); airShadow(z, lat, laneW * 0.9 * p.s, drop); drawThunderBox(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v); break; }
      case 'bee': { const p = proj(z, lat, airH); airShadow(z, lat, laneW * 0.7 * p.s, drop); drawBee(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v); break; }
      case 'slime': { const p = proj(z, lat, -drop); drawSlime(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v); break; }
      case 'crate': { const p = proj(z, lat, -drop); drawCrate(ctx, p.x, p.y, laneW * 1.0 * p.s); break; }
      case 'spikerock': { const p = proj(z, lat, -drop); drawSpikeRock(ctx, p.x, p.y, laneW * 1.0 * p.s); break; }
      case 'comet': { const p = proj(z, lat, airH); if (p.s > 0.2 && Math.random() < 0.7) particles.push({ x: p.x + (Math.random() - 0.5) * laneW * 0.3 * p.s, y: p.y - Math.random() * laneW * 0.3 * p.s, vx: (Math.random() - 0.5) * 70, vy: -30 - Math.random() * 80, life: 0.4, max: 1, color: Math.random() < 0.5 ? '#ffb02e' : '#ff6a2a', size: 1.5 + 3.5 * p.s, g: 0 }); drawComet(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v); break; }
      case 'bat': { const p = proj(z, lat, airH); airShadow(z, lat, laneW * 0.7 * p.s, drop); drawBat(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v, hopK(ob, gt), hopWarn(ob, gt)); break; }
      case 'drone': { const p = proj(z, lat, airH); airShadow(z, lat, laneW * 0.7 * p.s, drop); drawDrone(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v, clamp((G.x - lane) * 0.9, -1, 1), !!ob.locked); break; }
      case 'boulder': { const p = proj(z, lat, -drop); drawBoulder(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v); break; }
      case 'bunny': { const p = proj(z, lat, -drop); drawBunny(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v, hopK(ob, gt), hopWarn(ob, gt)); break; }
      case 'mole': { const p = proj(z, lat, -drop); drawMole(ctx, p.x, p.y, laneW * 1.0 * p.s, t, ob.v, clamp((18 - it.z) / 5, 0, 1)); break; }
      case 'gate': { const l = proj(z, ob.ga - MID - 0.5, -drop), r2 = proj(z, ob.gb - MID + 0.5, -drop); drawGate(ctx, l.x, r2.x, l.y, l.s, laneW, gateOn(ob, gt), gateFlicker(ob, gt), t, ob.v); break; }
      case 'shield': case 'star': case 'magnet': { const p = proj(z, lat, drop > 90 ? airH : airH * 0.9); drawPowerup(ctx, p.x, p.y, laneW * 0.8 * p.s, ob.type, t, ob.P); break; }
      case 'acorn': case 'gold': case 'heart': { const p = proj(z, lat, drop > 90 ? airH : airH * 0.85); drawAcorn(ctx, p.x, p.y, laneW * (ob.type === 'gold' ? 0.62 : 0.5) * p.s, ob.type, t, ob.P); break; }
    }
    ctx.globalAlpha = 1;
  }
  if (!playerDone) drawPlayer();
  if (G.boss) bossOverlay(pl);

  // bruma atmosférica: lo lejano se funde con el cielo
  const hz = ctx.createLinearGradient(0, yH - 6, 0, yH + H * 0.17); hz.addColorStop(0, rgb(sky.bot, 0.6)); hz.addColorStop(1, rgb(sky.bot, 0));
  ctx.fillStyle = hz; ctx.fillRect(0, yH - 6, W, H * 0.17 + 6);
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
  // gradación de color (luz cálida arriba, fría abajo) y resplandor
  if (THEME.grade){ const gg = ctx.createLinearGradient(0, 0, 0, H); gg.addColorStop(0, THEME.grade[0]); gg.addColorStop(1, THEME.grade[1]); ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (Q.bloom) drawBloom(0.42);
  if (THEME.tint){ ctx.fillStyle = rgb(THEME.tint, THEME.tint[3]); ctx.fillRect(0, 0, W, H); }
  if (G.lightning > 0){ ctx.fillStyle = `rgba(235,240,255,${Math.min(0.75, G.lightning * 2.4)})`; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0.2){ ctx.fillStyle = `rgba(255,255,255,${(G.flash - 0.2) * 1.2})`; ctx.fillRect(0, 0, W, H); }
  if (G.inv > 0 && G.fallT <= 0 && G.slow > 0){ ctx.fillStyle = `rgba(255,80,80,${G.slow * 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (G.fade > 0){ ctx.fillStyle = `rgba(255,255,255,${clamp(G.fade, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  if (vignette) ctx.drawImage(vignette, 0, 0, W, H);
  ctx.restore();
}
