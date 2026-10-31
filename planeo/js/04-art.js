/* 04 · arte: todos los sprites dibujados con Canvas (sin imágenes) */
'use strict';
const TAU = 6.2832;
function circ(c, x, y, r){ c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function ell(c, x, y, rx, ry, rot){ c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, TAU); c.fill(); }
function glow(c, x, y, r, col){ const g = c.createRadialGradient(x, y, r * 0.05, x, y, r); g.addColorStop(0, col.replace('A', '.75')); g.addColorStop(0.45, col.replace('A', '.22')); g.addColorStop(1, col.replace('A', '0')); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }

/* ------------------------------------------------------------ obstáculos del cielo */
function cloudShape(c, w, shade, col, sh, outline){
  const bl = [[-0.32, 0.04, 0.2], [-0.12, -0.1, 0.27], [0.15, -0.07, 0.25], [0.34, 0.05, 0.19], [0, 0.07, 0.24]];
  if (outline){
    c.fillStyle = outline;
    for (const b of bl){ circ(c, b[0] * w, b[1] * w + sh, b[2] * w + Math.max(1.2, w * 0.012)); }
    ell(c, 0, 0.1 * w + sh, 0.5 * w + 1.5, 0.14 * w + 1.5);
  }
  c.fillStyle = shade;
  for (const b of bl) circ(c, b[0] * w, b[1] * w + sh, b[2] * w);
  ell(c, 0, 0.1 * w + sh, 0.5 * w, 0.14 * w);
  c.fillStyle = col;
  for (const b of bl) circ(c, b[0] * w, b[1] * w, b[2] * w);
  ell(c, 0, 0.09 * w, 0.48 * w, 0.12 * w);
  // brillo superior
  c.fillStyle = 'rgba(255,255,255,.55)';
  circ(c, -0.14 * w, -0.17 * w, 0.1 * w); circ(c, 0.14 * w, -0.13 * w, 0.08 * w);
}
function drawCloud(c, x, y, w, storm, t, seed){
  c.save(); c.translate(x, y);
  if (storm){
    cloudShape(c, w, '#454c68', '#7a829e', w * 0.05, 'rgba(30,34,60,.55)');
    const ew = w * 0.07;
    c.fillStyle = '#fff'; ell(c, -w * 0.14, -0.02 * w, ew, ew * 1.25); ell(c, w * 0.14, -0.02 * w, ew, ew * 1.25);
    c.fillStyle = '#222'; circ(c, -w * 0.13, 0, ew * 0.5); circ(c, w * 0.15, 0, ew * 0.5);
    c.strokeStyle = '#2a2e44'; c.lineWidth = Math.max(2, w * 0.035); c.lineCap = 'round';
    c.beginPath(); c.moveTo(-w * 0.24, -w * 0.12); c.lineTo(-w * 0.06, -w * 0.06); c.moveTo(w * 0.24, -w * 0.12); c.lineTo(w * 0.06, -w * 0.06); c.stroke();
    if (Math.sin(t * 6 + seed * 9) > 0.8){
      c.fillStyle = '#ffe94d'; c.beginPath(); c.moveTo(-w * 0.03, w * 0.13); c.lineTo(w * 0.07, w * 0.13); c.lineTo(0, w * 0.28); c.lineTo(w * 0.06, w * 0.28); c.lineTo(-w * 0.06, w * 0.46); c.lineTo(-w * 0.02, w * 0.3); c.lineTo(-w * 0.08, w * 0.3); c.closePath(); c.fill();
    }
  } else cloudShape(c, w, '#c9d6ef', '#ffffff', w * 0.045, 'rgba(120,150,205,.38)');
  c.restore();
}
function drawBird(c, x, y, w, t, seed){
  c.save(); c.translate(x, y);
  const f = Math.sin(t * 16 + seed * 20) * 0.7;
  c.fillStyle = '#3571c9';
  c.save(); c.translate(-w * 0.28, -w * 0.02); c.rotate(-0.4 + f); ell(c, -w * 0.2, 0, w * 0.3, w * 0.1); c.restore();
  c.save(); c.translate(w * 0.28, -w * 0.02); c.rotate(0.4 - f); ell(c, w * 0.2, 0, w * 0.3, w * 0.1); c.restore();
  c.fillStyle = '#5aa5ff'; ell(c, 0, 0, w * 0.3, w * 0.28);
  c.fillStyle = 'rgba(255,255,255,.25)'; ell(c, -w * 0.08, -w * 0.12, w * 0.14, w * 0.07, -0.4);
  c.fillStyle = '#eaf3ff'; ell(c, 0, w * 0.1, w * 0.2, w * 0.16);
  c.fillStyle = '#fff'; circ(c, -w * 0.11, -w * 0.06, w * 0.08); circ(c, w * 0.11, -w * 0.06, w * 0.08);
  c.fillStyle = '#1d2240'; circ(c, -w * 0.1, -w * 0.05, w * 0.038); circ(c, w * 0.1, -w * 0.05, w * 0.038);
  c.strokeStyle = '#1d2240'; c.lineWidth = Math.max(1.5, w * 0.03); c.lineCap = 'round';
  c.beginPath(); c.moveTo(-w * 0.2, -w * 0.15); c.lineTo(-w * 0.04, -w * 0.1); c.moveTo(w * 0.2, -w * 0.15); c.lineTo(w * 0.04, -w * 0.1); c.stroke();
  c.fillStyle = '#ffa63d'; c.beginPath(); c.moveTo(-w * 0.06, 0); c.lineTo(w * 0.06, 0); c.lineTo(0, w * 0.12); c.closePath(); c.fill();
  c.restore();
}
function drawHog(c, x, y, w, t, seed){
  c.save(); c.translate(x, y);
  const wob = Math.sin(t * 10 + seed * 20) * w * 0.02;
  c.fillStyle = '#5a3d2b';
  for (let i = 0; i < 15; i++){
    const a = Math.PI + (i / 14) * Math.PI, r = w * 0.34;
    c.beginPath(); c.moveTo(Math.cos(a - 0.17) * r, Math.sin(a - 0.17) * r * 1.05); c.lineTo(Math.cos(a) * (r + w * 0.12), Math.sin(a) * (r + w * 0.13)); c.lineTo(Math.cos(a + 0.17) * r, Math.sin(a + 0.17) * r * 1.05); c.fill();
  }
  ell(c, 0, -w * 0.02, w * 0.36, w * 0.3);
  c.fillStyle = '#e8c9a0'; ell(c, 0, w * 0.06, w * 0.21, w * 0.2);
  c.fillStyle = '#fff'; circ(c, -w * 0.085, 0, w * 0.055); circ(c, w * 0.085, 0, w * 0.055);
  c.fillStyle = '#1d2240'; circ(c, -w * 0.08, 0, w * 0.027); circ(c, w * 0.08, 0, w * 0.027);
  c.fillStyle = '#3b2a22'; circ(c, 0, w * 0.1, w * 0.035);
  c.strokeStyle = '#3b2a22'; c.lineWidth = Math.max(1.5, w * 0.025); c.beginPath(); c.moveTo(-w * 0.15, -w * 0.07); c.lineTo(-w * 0.04, -w * 0.045); c.moveTo(w * 0.15, -w * 0.07); c.lineTo(w * 0.04, -w * 0.045); c.stroke();
  c.fillStyle = '#d9b48a'; ell(c, -w * 0.14 + wob, w * 0.26, w * 0.07, w * 0.04); ell(c, w * 0.14 - wob, w * 0.26, w * 0.07, w * 0.04);
  c.restore();
}
function drawTree(c, x, y, w, v, leaf){
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(20,40,20,.25)'; ell(c, 0, 0, w * 0.42, w * 0.09);
  c.fillStyle = '#7a5235'; c.fillRect(-w * 0.07, -w * 0.5, w * 0.14, w * 0.5);
  c.fillStyle = '#5a3a24'; c.fillRect(0, -w * 0.5, w * 0.07, w * 0.5);
  let g1 = v > 0.5 ? ['#3f9d5a', '#4fb36a', '#68c97c'] : ['#4b9e4a', '#62b659', '#82cf70'];
  if (leaf && leaf[0] === '#'){ g1 = [shade(leaf, -26), leaf, shade(leaf, 34)]; }
  const lay = [[0, -0.62, 0.42, 0], [-0.02, -0.92, 0.34, 1], [0.01, -1.18, 0.24, 2]];
  for (const l of lay){
    c.fillStyle = 'rgba(0,40,10,.28)'; circ(c, l[0] * w, l[1] * w + w * 0.03, l[2] * w + 1);
    c.fillStyle = g1[l[3]]; circ(c, l[0] * w, l[1] * w, l[2] * w);
    c.fillStyle = 'rgba(255,255,255,.14)'; circ(c, l[0] * w - l[2] * w * 0.3, l[1] * w - l[2] * w * 0.3, l[2] * w * 0.5);
  }
  c.restore();
}
function drawBush(c, x, y, w){
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(20,40,20,.25)'; ell(c, 0, 0, w * 0.4, w * 0.07);
  c.fillStyle = '#3f9d5a'; circ(c, -w * 0.22, -w * 0.16, w * 0.2); circ(c, w * 0.2, -w * 0.15, w * 0.21);
  c.fillStyle = '#58b96c'; circ(c, 0, -w * 0.24, w * 0.26);
  c.fillStyle = 'rgba(255,255,255,.15)'; circ(c, -w * 0.07, -w * 0.31, w * 0.12);
  c.fillStyle = '#ff6b8a'; for (const p of [[-0.12, -0.28], [0.14, -0.2], [0.02, -0.38], [-0.26, -0.12]]) circ(c, p[0] * w, p[1] * w, w * 0.035);
  c.restore();
}
function drawRock(c, x, y, w){
  c.save(); c.translate(x, y); c.fillStyle = '#9aa3b5'; ell(c, 0, -w * 0.1, w * 0.3, w * 0.2);
  c.fillStyle = '#b9c1d1'; ell(c, -w * 0.07, -w * 0.15, w * 0.17, w * 0.1); c.restore();
}
function drawFlower(c, x, y, w, v){
  c.save(); c.translate(x, y);
  c.strokeStyle = '#3f9d5a'; c.lineWidth = Math.max(1, w * 0.06); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -w * 0.5); c.stroke();
  const cols = ['#ff7aa8', '#ffd23f', '#ffffff', '#b58cff']; c.fillStyle = cols[Math.floor(v * 4) % 4];
  for (let i = 0; i < 5; i++){ const a = i * 1.2566; circ(c, Math.cos(a) * w * 0.14, -w * 0.5 + Math.sin(a) * w * 0.14, w * 0.11); }
  c.fillStyle = '#fff3a0'; circ(c, 0, -w * 0.5, w * 0.09); c.restore();
}
function drawTuft(c, x, y, w){
  c.save(); c.translate(x, y); c.strokeStyle = 'rgba(40,120,50,.8)'; c.lineWidth = Math.max(1, w * 0.07); c.lineCap = 'round';
  for (let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(i * w * 0.08, 0); c.lineTo(i * w * 0.2, -w * 0.4 + Math.abs(i) * w * 0.07); c.stroke(); }
  c.restore();
}
function drawAcorn(c, x, y, w, kind, t, seed){
  c.save(); c.translate(x, y + Math.sin(t * 4 + seed * 7) * w * 0.05);
  const sx = 0.55 + 0.45 * Math.abs(Math.cos(t * 3 + seed * 5));
  if (kind === 'heart'){
    glow(c, 0, 0, w * 0.8, 'rgba(255,120,170,A)');
    c.scale(1 + 0.08 * Math.sin(t * 6), 1 + 0.08 * Math.sin(t * 6));
    c.fillStyle = '#ff4f86'; c.beginPath(); c.moveTo(0, w * 0.32); c.bezierCurveTo(-w * 0.55, -w * 0.05, -w * 0.3, -w * 0.45, 0, -w * 0.18); c.bezierCurveTo(w * 0.3, -w * 0.45, w * 0.55, -w * 0.05, 0, w * 0.32); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, -w * 0.17, -w * 0.12, w * 0.08, w * 0.05, -0.6);
  } else {
    const gold = kind === 'gold', k = gold ? 1.25 : 1;
    if (gold) glow(c, 0, 0, w * 0.85, 'rgba(255,225,90,A)');
    c.scale(sx, 1);
    c.fillStyle = gold ? '#ffd23f' : '#c98a4b'; ell(c, 0, w * 0.05, w * 0.22 * k, w * 0.27 * k);
    c.fillStyle = gold ? '#e9a800' : '#7a4a2a'; ell(c, 0, -w * 0.15 * k, w * 0.25 * k, w * 0.12 * k);
    c.fillRect(-w * 0.02, -w * 0.33 * k, w * 0.04, w * 0.1);
    c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, -w * 0.08, w * 0.02, w * 0.04, w * 0.09);
  }
  c.restore();
}

/* ------------------------------------------------------------ el avioncito con la ardilla (visto desde atrás) */
function drawPlane(c, u, bank, wingCol, t, alpha, dive, flash){
  c.save(); c.globalAlpha = alpha; c.rotate(bank * 0.5); c.scale(1 + Math.abs(bank) * 0.04, 1 - 0.1 * dive);
  const wing = wingCol || '#ff5a4a', wingD = shade(wing, -42), wingL = shade(wing, 40);
  // hélice
  c.save(); c.translate(0, -1.0 * u); c.rotate(t * 40);
  c.fillStyle = 'rgba(255,255,255,.24)'; circ(c, 0, 0, 0.95 * u);
  c.fillStyle = 'rgba(60,40,30,.45)'; c.fillRect(-0.95 * u, -0.05 * u, 1.9 * u, 0.1 * u);
  c.restore();
  c.fillStyle = wingD; ell(c, 0, -0.78 * u, 0.4 * u, 0.42 * u);
  // alas (con degradado)
  const wg = c.createLinearGradient(0, -0.65 * u, 0, 0.5 * u); wg.addColorStop(0, wingL); wg.addColorStop(0.5, wing); wg.addColorStop(1, wingD);
  c.fillStyle = wingD; c.beginPath(); c.moveTo(-2.55 * u, 0.12 * u); c.lineTo(-2.3 * u, -0.5 * u); c.lineTo(-0.3 * u, -0.6 * u); c.lineTo(0.3 * u, -0.6 * u); c.lineTo(2.3 * u, -0.5 * u); c.lineTo(2.55 * u, 0.12 * u); c.lineTo(0.3 * u, 0.5 * u); c.lineTo(-0.3 * u, 0.5 * u); c.closePath(); c.fill();
  c.fillStyle = wg; c.beginPath(); c.moveTo(-2.55 * u, 0); c.lineTo(-2.3 * u, -0.55 * u); c.lineTo(-0.3 * u, -0.65 * u); c.lineTo(0.3 * u, -0.65 * u); c.lineTo(2.3 * u, -0.55 * u); c.lineTo(2.55 * u, 0); c.lineTo(0.3 * u, 0.36 * u); c.lineTo(-0.3 * u, 0.36 * u); c.closePath(); c.fill();
  c.fillStyle = wingL; c.beginPath(); c.moveTo(-2.3 * u, -0.5 * u); c.lineTo(-0.3 * u, -0.6 * u); c.lineTo(-0.3 * u, -0.42 * u); c.lineTo(-2.2 * u, -0.3 * u); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2.3 * u, -0.5 * u); c.lineTo(0.3 * u, -0.6 * u); c.lineTo(0.3 * u, -0.42 * u); c.lineTo(2.2 * u, -0.3 * u); c.closePath(); c.fill();
  c.fillStyle = '#fff6e0';
  for (const sg of [-1, 1]){ c.beginPath(); c.moveTo(sg * 1.55 * u, -0.54 * u); c.lineTo(sg * 2.3 * u, -0.5 * u); c.lineTo(sg * 2.5 * u, 0.0); c.lineTo(sg * 1.7 * u, 0.0); c.closePath(); c.fill(); }
  // cola
  c.fillStyle = wingD; c.beginPath(); c.moveTo(-0.38 * u, 0.4 * u); c.lineTo(0.38 * u, 0.4 * u); c.lineTo(0.28 * u, 1.6 * u); c.lineTo(-0.28 * u, 1.6 * u); c.closePath(); c.fill();
  c.fillStyle = wing; c.beginPath(); c.moveTo(-1.2 * u, 1.65 * u); c.lineTo(-0.2 * u, 1.35 * u); c.lineTo(0.2 * u, 1.35 * u); c.lineTo(1.2 * u, 1.65 * u); c.lineTo(0.9 * u, 1.9 * u); c.lineTo(-0.9 * u, 1.9 * u); c.closePath(); c.fill();
  c.fillStyle = wingL; c.beginPath(); c.moveTo(-0.07 * u, 1.55 * u); c.lineTo(0.07 * u, 1.55 * u); c.lineTo(0.06 * u, 0.45 * u); c.lineTo(-0.06 * u, 0.45 * u); c.fill();
  // ardilla
  c.fillStyle = '#b8742f'; ell(c, 0, 0.55 * u, 0.5 * u, 0.55 * u);
  const fl = Math.sin(t * 9) * 0.25;
  c.fillStyle = '#fff3d6'; ell(c, 0, 0.14 * u, 0.5 * u, 0.2 * u);
  c.fillStyle = '#ffd23f';
  c.save(); c.translate(0.35 * u, 0.2 * u); c.rotate(0.9 + fl); c.fillRect(0, -0.08 * u, 0.95 * u, 0.2 * u); c.restore();
  c.save(); c.translate(-0.35 * u, 0.2 * u); c.rotate(Math.PI - 0.9 - fl); c.fillRect(0, -0.08 * u, 0.95 * u, 0.2 * u); c.restore();
  c.fillStyle = '#b8742f'; ell(c, -0.47 * u, -0.56 * u, 0.16 * u, 0.24 * u, -0.3); ell(c, 0.47 * u, -0.56 * u, 0.16 * u, 0.24 * u, 0.3);
  c.fillStyle = '#f2b98a'; ell(c, -0.47 * u, -0.54 * u, 0.07 * u, 0.13 * u, -0.3); ell(c, 0.47 * u, -0.54 * u, 0.07 * u, 0.13 * u, 0.3);
  c.fillStyle = '#d28a3e'; circ(c, 0, -0.2 * u, 0.58 * u);
  c.fillStyle = 'rgba(255,255,255,.13)'; ell(c, -0.18 * u, -0.38 * u, 0.28 * u, 0.2 * u, -0.5);
  c.fillStyle = '#6b4128'; c.beginPath(); c.arc(0, -0.28 * u, 0.6 * u, Math.PI * 1.02, Math.PI * 1.98); c.lineTo(0.55 * u, -0.22 * u); c.lineTo(-0.55 * u, -0.22 * u); c.closePath(); c.fill();
  c.fillStyle = '#82502f'; ell(c, -0.1 * u, -0.6 * u, 0.28 * u, 0.12 * u, -0.4);
  c.fillStyle = '#2b2b3a'; c.fillRect(-0.6 * u, -0.26 * u, 1.2 * u, 0.12 * u);
  c.fillStyle = '#9fe7ff'; c.beginPath(); c.arc(-0.3 * u, -0.5 * u, 0.2 * u, Math.PI, 0); c.arc(0.3 * u, -0.5 * u, 0.2 * u, Math.PI, 0); c.fill();
  c.fillStyle = 'rgba(255,255,255,.7)'; circ(c, -0.36 * u, -0.56 * u, 0.05 * u); circ(c, 0.24 * u, -0.56 * u, 0.05 * u);
  // cola esponjosa
  const tw = Math.sin(t * 3) * 0.12;
  c.save(); c.translate(0, 1.0 * u); c.rotate(tw);
  c.fillStyle = '#b8742f'; ell(c, 0, 0.55 * u, 0.5 * u, 0.85 * u);
  c.fillStyle = '#e9a45b'; ell(c, -0.06 * u, 0.5 * u, 0.32 * u, 0.62 * u);
  c.fillStyle = '#fff3d6'; ell(c, 0, 1.2 * u, 0.4 * u, 0.28 * u);
  c.strokeStyle = '#8a5522'; c.lineWidth = 0.08 * u; c.beginPath(); c.arc(0, 0.5 * u, 0.5 * u, 0.3, 0.9); c.stroke();
  c.restore();
  if (flash){ c.fillStyle = 'rgba(255,255,255,.55)'; circ(c, 0, 0.4 * u, 2.4 * u); }
  c.restore();
}

/* ------------------------------------------------------------ personajes de frente (cinemáticas) */
function drawSquirrelFront(c, x, y, s, o){
  o = o || {}; const old = !!o.old, t = o.t || 0, mood = o.mood || 'happy', look = o.look || 0;
  const fur = old ? '#aaa49c' : '#d28a3e', furD = old ? '#86807a' : '#a8672b', cream = old ? '#f0ede7' : '#f8dcb2', cloth = old ? '#7c8fb9' : '#e0523f';
  const blink = ((t + (old ? 1.1 : 0)) % 3.4) < 0.13;
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  // cola
  c.save(); c.translate(1.15 * s, 0.7 * s); c.rotate(0.45 + Math.sin(t * 2) * 0.07);
  c.fillStyle = furD; ell(c, 0, 0, 0.8 * s, 1.65 * s); c.fillStyle = fur; ell(c, -0.08 * s, 0.05 * s, 0.55 * s, 1.35 * s);
  c.fillStyle = cream; ell(c, 0, -1.2 * s, 0.5 * s, 0.4 * s); c.restore();
  // cuerpo
  c.fillStyle = cloth; ell(c, 0, 1.75 * s, 1.0 * s, 0.9 * s);
  c.fillStyle = 'rgba(255,255,255,.14)'; ell(c, -0.3 * s, 1.5 * s, 0.4 * s, 0.35 * s, -0.4);
  if (old){ c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) circ(c, 0, 1.45 * s + i * 0.28 * s, 0.07 * s); }
  else { c.fillStyle = '#ffd23f'; ell(c, 0, 1.0 * s, 0.75 * s, 0.22 * s); c.save(); c.translate(0.45 * s, 1.1 * s); c.rotate(0.9 + Math.sin(t * 5) * 0.15); c.fillRect(0, -0.1 * s, 0.8 * s, 0.22 * s); c.restore(); }
  // orejas
  c.fillStyle = fur; ell(c, -0.72 * s, -0.78 * s, 0.26 * s, 0.4 * s, -0.35); ell(c, 0.72 * s, -0.78 * s, 0.26 * s, 0.4 * s, 0.35);
  c.fillStyle = '#f2b98a'; ell(c, -0.72 * s, -0.75 * s, 0.12 * s, 0.24 * s, -0.35); ell(c, 0.72 * s, -0.75 * s, 0.12 * s, 0.24 * s, 0.35);
  c.fillStyle = fur; ell(c, 0, 0, 1.0 * s, 0.95 * s);
  c.fillStyle = cream; ell(c, 0, 0.32 * s, 0.7 * s, 0.55 * s);
  c.fillStyle = 'rgba(255,255,255,.12)'; ell(c, -0.3 * s, -0.4 * s, 0.4 * s, 0.25 * s, -0.5);
  if (!old){
    // gorro de aviador con gafas
    c.fillStyle = '#6b4128'; c.beginPath(); c.arc(0, -0.1 * s, 1.0 * s, Math.PI * 1.04, Math.PI * 1.96); c.lineTo(0.95 * s, -0.22 * s); c.lineTo(-0.95 * s, -0.22 * s); c.closePath(); c.fill();
    c.fillStyle = '#82502f'; ell(c, -0.25 * s, -0.78 * s, 0.4 * s, 0.14 * s, -0.3);
    c.fillStyle = '#2b2b3a'; c.fillRect(-1.0 * s, -0.3 * s, 2.0 * s, 0.14 * s);
    c.fillStyle = '#9fe7ff'; circ(c, -0.4 * s, -0.55 * s, 0.27 * s); circ(c, 0.4 * s, -0.55 * s, 0.27 * s);
    c.strokeStyle = '#2b2b3a'; c.lineWidth = 0.07 * s; c.beginPath(); c.arc(-0.4 * s, -0.55 * s, 0.27 * s, 0, TAU); c.arc(0.4 * s, -0.55 * s, 0.27 * s, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.8)'; circ(c, -0.48 * s, -0.62 * s, 0.07 * s); circ(c, 0.32 * s, -0.62 * s, 0.07 * s);
  } else {
    c.fillStyle = '#fff'; ell(c, -0.45 * s, -0.5 * s, 0.34 * s, 0.1 * s, -0.2); ell(c, 0.45 * s, -0.5 * s, 0.34 * s, 0.1 * s, 0.2);
    ell(c, 0, -0.95 * s, 0.4 * s, 0.14 * s);
  }
  // ojos
  const ex = 0.37 * s, ey = 0.1 * s;
  if (blink || mood === 'happy2'){
    c.strokeStyle = '#3b2312'; c.lineWidth = 0.08 * s; c.lineCap = 'round'; c.beginPath(); c.arc(-ex, ey, 0.17 * s, 0.1, Math.PI - 0.1); c.arc(ex, ey, 0.17 * s, 0.1, Math.PI - 0.1); c.stroke();
  } else {
    const er = mood === 'surprise' ? 0.26 : 0.2;
    c.fillStyle = '#fff'; ell(c, -ex, ey, er * s, er * 1.15 * s); ell(c, ex, ey, er * s, er * 1.15 * s);
    c.fillStyle = '#2a1a10'; circ(c, -ex + look * 0.07 * s, ey + 0.02 * s, 0.11 * s); circ(c, ex + look * 0.07 * s, ey + 0.02 * s, 0.11 * s);
    c.fillStyle = '#fff'; circ(c, -ex + look * 0.07 * s - 0.04 * s, ey - 0.03 * s, 0.035 * s); circ(c, ex + look * 0.07 * s - 0.04 * s, ey - 0.03 * s, 0.035 * s);
  }
  if (old){ c.strokeStyle = '#6b6b78'; c.lineWidth = 0.06 * s; c.beginPath(); c.arc(-ex, ey, 0.28 * s, 0, TAU); c.arc(ex, ey, 0.28 * s, 0, TAU); c.moveTo(-ex + 0.28 * s, ey); c.lineTo(ex - 0.28 * s, ey); c.stroke(); }
  // cejas
  c.strokeStyle = old ? '#fff' : '#6b4128'; c.lineWidth = 0.09 * s; c.lineCap = 'round'; c.beginPath();
  const by = ey - 0.34 * s;
  if (mood === 'angry'){ c.moveTo(-ex - 0.2 * s, by - 0.05 * s); c.lineTo(-ex + 0.2 * s, by + 0.08 * s); c.moveTo(ex + 0.2 * s, by - 0.05 * s); c.lineTo(ex - 0.2 * s, by + 0.08 * s); }
  else if (mood === 'sad' || mood === 'worry'){ c.moveTo(-ex - 0.2 * s, by + 0.08 * s); c.lineTo(-ex + 0.2 * s, by - 0.05 * s); c.moveTo(ex + 0.2 * s, by + 0.08 * s); c.lineTo(ex - 0.2 * s, by - 0.05 * s); }
  else if (mood === 'surprise'){ c.moveTo(-ex - 0.18 * s, by - 0.1 * s); c.lineTo(-ex + 0.18 * s, by - 0.1 * s); c.moveTo(ex - 0.18 * s, by - 0.1 * s); c.lineTo(ex + 0.18 * s, by - 0.1 * s); }
  else { c.moveTo(-ex - 0.18 * s, by); c.quadraticCurveTo(-ex, by - 0.1 * s, -ex + 0.18 * s, by); c.moveTo(ex - 0.18 * s, by); c.quadraticCurveTo(ex, by - 0.1 * s, ex + 0.18 * s, by); }
  c.stroke();
  // nariz, boca, mejillas
  c.fillStyle = '#3b2312'; ell(c, 0, 0.36 * s, 0.1 * s, 0.07 * s);
  c.fillStyle = 'rgba(255,120,120,.35)'; circ(c, -0.6 * s, 0.38 * s, 0.14 * s); circ(c, 0.6 * s, 0.38 * s, 0.14 * s);
  c.strokeStyle = '#3b2312'; c.lineWidth = 0.065 * s; c.beginPath();
  if (mood === 'sad' || mood === 'worry'){ c.moveTo(-0.2 * s, 0.7 * s); c.quadraticCurveTo(0, 0.55 * s, 0.2 * s, 0.7 * s); }
  else if (mood === 'surprise'){ c.fillStyle = '#7a2a1a'; ell(c, 0, 0.66 * s, 0.13 * s, 0.17 * s); c.beginPath(); }
  else if (mood === 'angry'){ c.moveTo(-0.2 * s, 0.68 * s); c.lineTo(0.2 * s, 0.68 * s); }
  else { c.moveTo(-0.28 * s, 0.58 * s); c.quadraticCurveTo(0, 0.88 * s, 0.28 * s, 0.58 * s); }
  c.stroke();
  if (old){ c.fillStyle = '#fff'; ell(c, -0.2 * s, 0.5 * s, 0.26 * s, 0.13 * s, 0.2); ell(c, 0.2 * s, 0.5 * s, 0.26 * s, 0.13 * s, -0.2); }
  if (mood === 'sad' && o.tear){ c.fillStyle = 'rgba(120,190,255,.9)'; ell(c, -ex, ey + 0.4 * s + (t * 0.6 % 1) * 0.3 * s, 0.06 * s, 0.1 * s); }
  c.restore();
}

/* jefes (de frente). o.sil dibuja solo silueta; o.mood: angry | hurt | sad | happy */
function drawCrow(c, x, y, s, t, o){
  o = o || {}; const sil = o.sil, K = col => sil ? '#0c0e26' : col, mood = o.mood || 'angry';
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  const fl = Math.sin(t * (o.flap || 5)) * 0.55;
  c.fillStyle = K('#1d2145');
  c.save(); c.translate(-1.0 * s, 0.1 * s); c.rotate(-0.5 + fl); ell(c, -0.8 * s, 0, 1.0 * s, 0.45 * s); c.restore();
  c.save(); c.translate(1.0 * s, 0.1 * s); c.rotate(0.5 - fl); ell(c, 0.8 * s, 0, 1.0 * s, 0.45 * s); c.restore();
  c.fillStyle = K('#2b3060'); ell(c, 0, 0.3 * s, 1.0 * s, 1.15 * s);
  c.fillStyle = K('#4a5190'); ell(c, 0, 0.55 * s, 0.6 * s, 0.8 * s);
  c.fillStyle = K('#ffa63d'); ell(c, -0.35 * s, 1.5 * s, 0.22 * s, 0.1 * s); ell(c, 0.35 * s, 1.5 * s, 0.22 * s, 0.1 * s);
  c.fillStyle = K('#343a70'); circ(c, 0, -0.9 * s, 0.78 * s);
  c.fillStyle = sil ? '#0c0e26' : 'rgba(255,255,255,.1)'; ell(c, -0.25 * s, -1.2 * s, 0.35 * s, 0.2 * s, -0.5);
  // sombrero de capitán
  c.fillStyle = K('#14152e'); c.beginPath(); c.moveTo(-1.15 * s, -1.28 * s); c.quadraticCurveTo(0, -2.35 * s, 1.15 * s, -1.28 * s); c.lineTo(0.7 * s, -1.1 * s); c.lineTo(-0.7 * s, -1.1 * s); c.closePath(); c.fill();
  c.strokeStyle = K('#ffcf4d'); c.lineWidth = 0.09 * s; c.beginPath(); c.moveTo(-1.1 * s, -1.28 * s); c.quadraticCurveTo(0, -2.3 * s, 1.1 * s, -1.28 * s); c.stroke();
  c.fillStyle = K('#fff'); circ(c, 0, -1.62 * s, 0.13 * s);
  // ojos
  if (mood === 'hurt'){
    c.strokeStyle = K('#fff'); c.lineWidth = 0.08 * s; c.beginPath(); c.moveTo(-0.5 * s, -1.05 * s); c.lineTo(-0.2 * s, -0.8 * s); c.moveTo(-0.2 * s, -1.05 * s); c.lineTo(-0.5 * s, -0.8 * s); c.moveTo(0.5 * s, -1.05 * s); c.lineTo(0.2 * s, -0.8 * s); c.moveTo(0.2 * s, -1.05 * s); c.lineTo(0.5 * s, -0.8 * s); c.stroke();
  } else {
    c.fillStyle = K('#fff'); circ(c, -0.34 * s, -0.95 * s, 0.22 * s); circ(c, 0.34 * s, -0.95 * s, 0.22 * s);
    c.fillStyle = K(mood === 'angry' ? '#e53b3b' : '#222'); circ(c, -0.32 * s, -0.93 * s, 0.1 * s); circ(c, 0.36 * s, -0.93 * s, 0.1 * s);
    c.fillStyle = K('#0b0b14'); circ(c, -0.34 * s, -0.95 * s, 0.24 * s * 0); // parche en ojo izq
    c.fillStyle = K('#0b0b14'); circ(c, -0.34 * s, -0.95 * s, 0.25 * s); c.strokeStyle = K('#0b0b14'); c.lineWidth = 0.06 * s; c.beginPath(); c.moveTo(-0.8 * s, -1.2 * s); c.lineTo(0.7 * s, -0.8 * s); c.stroke();
    c.strokeStyle = K('#0b0b14'); c.lineWidth = 0.1 * s; c.beginPath();
    if (mood === 'sad'){ c.moveTo(0.12 * s, -1.3 * s); c.lineTo(0.56 * s, -1.2 * s); } else { c.moveTo(0.12 * s, -1.22 * s); c.lineTo(0.56 * s, -1.3 * s); } c.stroke();
  }
  // pico
  c.fillStyle = K('#ffa63d'); c.beginPath(); c.moveTo(-0.28 * s, -0.7 * s); c.lineTo(0.28 * s, -0.7 * s); c.lineTo(0, -0.1 * s); c.closePath(); c.fill();
  c.fillStyle = K('#e0841a'); c.beginPath(); c.moveTo(-0.28 * s, -0.7 * s); c.lineTo(0.28 * s, -0.7 * s); c.lineTo(0, -0.5 * s); c.closePath(); c.fill();
  c.restore();
}
function drawStormKing(c, x, y, s, t, o){
  o = o || {}; const sil = o.sil, mood = o.mood || 'angry';
  c.save(); c.translate(x, y);
  cloudShape(c, 3.6 * s, sil ? '#0c0e26' : '#363c58', sil ? '#0c0e26' : '#6b7391', 0.15 * s, sil ? null : 'rgba(20,24,46,.6)');
  const K = col => sil ? '#0c0e26' : col;
  // corona
  c.fillStyle = K('#ffcf4d'); c.beginPath(); c.moveTo(-0.7 * s, -0.7 * s); c.lineTo(-0.75 * s, -1.35 * s); c.lineTo(-0.35 * s, -1.05 * s); c.lineTo(0, -1.5 * s); c.lineTo(0.35 * s, -1.05 * s); c.lineTo(0.75 * s, -1.35 * s); c.lineTo(0.7 * s, -0.7 * s); c.closePath(); c.fill();
  c.fillStyle = K('#e53b3b'); circ(c, 0, -0.95 * s, 0.1 * s); c.fillStyle = K('#4aa3ff'); circ(c, -0.4 * s, -0.9 * s, 0.07 * s); circ(c, 0.4 * s, -0.9 * s, 0.07 * s);
  // cara
  if (!sil){
    c.fillStyle = '#fff'; ell(c, -0.5 * s, -0.1 * s, 0.26 * s, 0.32 * s); ell(c, 0.5 * s, -0.1 * s, 0.26 * s, 0.32 * s);
    c.fillStyle = mood === 'angry' ? '#ffdc3d' : '#222'; circ(c, -0.46 * s, -0.06 * s, 0.13 * s); circ(c, 0.54 * s, -0.06 * s, 0.13 * s);
    c.strokeStyle = '#1b1e33'; c.lineWidth = 0.1 * s; c.lineCap = 'round'; c.beginPath();
    if (mood === 'angry'){ c.moveTo(-0.85 * s, -0.5 * s); c.lineTo(-0.2 * s, -0.25 * s); c.moveTo(0.85 * s, -0.5 * s); c.lineTo(0.2 * s, -0.25 * s); }
    else if (mood === 'happy'){ c.moveTo(-0.8 * s, -0.5 * s); c.quadraticCurveTo(-0.5 * s, -0.68 * s, -0.2 * s, -0.5 * s); c.moveTo(0.8 * s, -0.5 * s); c.quadraticCurveTo(0.5 * s, -0.68 * s, 0.2 * s, -0.5 * s); }
    else { c.moveTo(-0.85 * s, -0.25 * s); c.lineTo(-0.2 * s, -0.5 * s); c.moveTo(0.85 * s, -0.25 * s); c.lineTo(0.2 * s, -0.5 * s); }
    c.stroke();
    c.fillStyle = '#1b1e33';
    if (mood === 'angry'){ c.beginPath(); c.moveTo(-0.45 * s, 0.45 * s); c.quadraticCurveTo(0, 0.2 * s, 0.45 * s, 0.45 * s); c.quadraticCurveTo(0, 0.95 * s, -0.45 * s, 0.45 * s); c.fill();
      c.fillStyle = '#fff'; c.fillRect(-0.3 * s, 0.4 * s, 0.14 * s, 0.14 * s); c.fillRect(0.16 * s, 0.4 * s, 0.14 * s, 0.14 * s); }
    else if (mood === 'happy'){ c.strokeStyle = '#1b1e33'; c.lineWidth = 0.09 * s; c.beginPath(); c.moveTo(-0.45 * s, 0.35 * s); c.quadraticCurveTo(0, 0.85 * s, 0.45 * s, 0.35 * s); c.stroke(); }
    else { c.strokeStyle = '#1b1e33'; c.lineWidth = 0.09 * s; c.beginPath(); c.moveTo(-0.4 * s, 0.6 * s); c.quadraticCurveTo(0, 0.25 * s, 0.4 * s, 0.6 * s); c.stroke(); }
    if (mood === 'sad' || mood === 'hurt'){ c.fillStyle = 'rgba(120,190,255,.9)'; const k = (t * 0.8) % 1; ell(c, -0.5 * s, 0.3 * s + k * 0.9 * s, 0.07 * s, 0.13 * s); ell(c, 0.55 * s, 0.3 * s + ((k + 0.5) % 1) * 0.9 * s, 0.07 * s, 0.13 * s); }
    // rayos laterales
    if (mood === 'angry' && Math.sin(t * 9) > 0){ c.fillStyle = '#ffe94d'; for (const sg of [-1, 1]){ c.save(); c.translate(sg * 1.9 * s, 0.2 * s); c.rotate(sg * 0.3); c.beginPath(); c.moveTo(-0.15 * s, -0.5 * s); c.lineTo(0.2 * s, -0.5 * s); c.lineTo(0.02 * s, -0.05 * s); c.lineTo(0.26 * s, -0.05 * s); c.lineTo(-0.2 * s, 0.7 * s); c.lineTo(-0.06 * s, 0.1 * s); c.lineTo(-0.28 * s, 0.1 * s); c.closePath(); c.fill(); c.restore(); } }
  }
  c.restore();
}
function drawOwl(c, x, y, s, t, o){
  o = o || {}; const sil = o.sil, K = col => sil ? '#0c0e26' : col, mood = o.mood || 'angry';
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  const fl = o.flap ? Math.sin(t * o.flap) * 0.5 : 0;
  c.fillStyle = K('#6b4229');
  c.save(); c.translate(-1.05 * s, 0.3 * s); c.rotate(0.25 - fl); ell(c, -0.2 * s, 0.3 * s, 0.55 * s, 1.2 * s); c.restore();
  c.save(); c.translate(1.05 * s, 0.3 * s); c.rotate(-0.25 + fl); ell(c, 0.2 * s, 0.3 * s, 0.55 * s, 1.2 * s); c.restore();
  c.fillStyle = K('#8a5a3a'); ell(c, 0, 0.55 * s, 1.15 * s, 1.4 * s);
  c.fillStyle = K('#e0c19a'); ell(c, 0, 0.75 * s, 0.8 * s, 1.0 * s);
  if (!sil){ c.strokeStyle = '#b08a60'; c.lineWidth = 0.05 * s; for (let r = 0; r < 4; r++) for (let q = -1; q <= 1; q++){ c.beginPath(); c.arc(q * 0.4 * s + (r % 2) * 0.2 * s, 0.35 * s + r * 0.3 * s, 0.17 * s, 0.2, Math.PI - 0.2); c.stroke(); } }
  c.fillStyle = K('#8a5a3a'); circ(c, 0, -1.0 * s, 1.0 * s);
  c.beginPath(); c.moveTo(-0.9 * s, -1.4 * s); c.lineTo(-0.7 * s, -2.0 * s); c.lineTo(-0.3 * s, -1.75 * s); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(0.9 * s, -1.4 * s); c.lineTo(0.7 * s, -2.0 * s); c.lineTo(0.3 * s, -1.75 * s); c.closePath(); c.fill();
  c.fillStyle = K('#f1dcc0'); circ(c, -0.42 * s, -0.95 * s, 0.52 * s); circ(c, 0.42 * s, -0.95 * s, 0.52 * s);
  if (mood === 'happy' || mood === 'hurt'){
    c.strokeStyle = K('#3a2412'); c.lineWidth = 0.1 * s; c.lineCap = 'round'; c.beginPath();
    if (mood === 'happy'){ c.arc(-0.42 * s, -0.9 * s, 0.22 * s, Math.PI, 0); c.moveTo(0.64 * s, -0.9 * s); c.arc(0.42 * s, -0.9 * s, 0.22 * s, Math.PI, 0); }
    else { c.moveTo(-0.6 * s, -1.05 * s); c.lineTo(-0.25 * s, -0.78 * s); c.moveTo(-0.25 * s, -1.05 * s); c.lineTo(-0.6 * s, -0.78 * s); c.moveTo(0.6 * s, -1.05 * s); c.lineTo(0.25 * s, -0.78 * s); c.moveTo(0.25 * s, -1.05 * s); c.lineTo(0.6 * s, -0.78 * s); }
    c.stroke();
  } else {
    c.fillStyle = K('#ffd23f'); circ(c, -0.42 * s, -0.95 * s, 0.34 * s); circ(c, 0.42 * s, -0.95 * s, 0.34 * s);
    c.fillStyle = K('#1b1b2a'); circ(c, -0.42 * s, -0.93 * s, 0.17 * s); circ(c, 0.42 * s, -0.93 * s, 0.17 * s);
    c.fillStyle = K('#fff'); circ(c, -0.48 * s, -1.0 * s, 0.05 * s); circ(c, 0.36 * s, -1.0 * s, 0.05 * s);
    c.strokeStyle = K('#8a5a3a'); c.lineWidth = 0.13 * s; c.lineCap = 'round'; c.beginPath();
    if (mood === 'angry'){ c.moveTo(-0.9 * s, -1.5 * s); c.lineTo(-0.1 * s, -1.2 * s); c.moveTo(0.9 * s, -1.5 * s); c.lineTo(0.1 * s, -1.2 * s); }
    else { c.moveTo(-0.9 * s, -1.2 * s); c.lineTo(-0.1 * s, -1.5 * s); c.moveTo(0.9 * s, -1.2 * s); c.lineTo(0.1 * s, -1.5 * s); }
    c.stroke();
    if (mood === 'sad'){ c.fillStyle = 'rgba(120,190,255,.9)'; ell(c, -0.5 * s, -0.5 * s + ((t * 0.7) % 1) * 0.5 * s, 0.06 * s, 0.1 * s); }
  }
  if (!sil){ c.strokeStyle = '#d6a93a'; c.lineWidth = 0.07 * s; c.beginPath(); c.arc(-0.42 * s, -0.95 * s, 0.4 * s, 0, TAU); c.arc(0.42 * s, -0.95 * s, 0.4 * s, 0, TAU); c.moveTo(-0.02 * s, -0.95 * s); c.lineTo(0.02 * s, -0.95 * s); c.stroke(); }
  c.fillStyle = K('#ff9f3a'); c.beginPath(); c.moveTo(-0.14 * s, -0.7 * s); c.lineTo(0.14 * s, -0.7 * s); c.lineTo(0, -0.38 * s); c.closePath(); c.fill();
  c.fillStyle = K('#d8483c'); ell(c, 0, -0.1 * s, 0.95 * s, 0.17 * s);
  c.fillStyle = K('#ffa63d'); ell(c, -0.45 * s, 1.95 * s, 0.3 * s, 0.1 * s); ell(c, 0.45 * s, 1.95 * s, 0.3 * s, 0.1 * s);
  c.restore();
}
function drawBossSprite(type, c, x, y, s, t, o){
  if (type === 'crow') drawCrow(c, x, y, s, t, o); else if (type === 'storm') drawStormKing(c, x, y, s, t, o); else drawOwl(c, x, y, s, t, o);
}

/* proyectiles y regalos de los jefes */
function drawBossShot(type, c, x, y, w, t, seed){
  c.save(); c.translate(x, y);
  glow(c, 0, 0, w * 1.0, 'rgba(255,70,60,A)');
  if (type === 'crow'){
    c.rotate(t * 8 + seed * 5); c.fillStyle = '#1d2145'; ell(c, 0, 0, w * 0.2, w * 0.5);
    c.fillStyle = '#4a5190'; ell(c, 0, -w * 0.05, w * 0.08, w * 0.4); c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, w * 0.04); c.beginPath(); c.moveTo(0, -w * 0.45); c.lineTo(0, w * 0.45); c.stroke();
  } else if (type === 'storm'){
    c.fillStyle = '#fff6a8'; circ(c, 0, 0, w * 0.34); c.fillStyle = '#ffdc3d'; circ(c, 0, 0, w * 0.22);
    c.strokeStyle = '#ffe94d'; c.lineWidth = Math.max(1.5, w * 0.06); c.lineCap = 'round';
    for (let i = 0; i < 6; i++){ const a = i * 1.047 + t * 6; c.beginPath(); c.moveTo(Math.cos(a) * w * 0.34, Math.sin(a) * w * 0.34); c.lineTo(Math.cos(a + 0.2) * w * 0.55, Math.sin(a + 0.2) * w * 0.55); c.stroke(); }
  } else {
    c.rotate(t * 6 + seed * 3); c.fillStyle = '#8a5a3a'; circ(c, 0, 0, w * 0.34); c.fillStyle = '#6b4229'; circ(c, 0, 0, w * 0.2);
    c.fillStyle = '#d6a93a'; for (let i = 0; i < 3; i++){ const a = i * 2.09; ell(c, Math.cos(a) * w * 0.28, Math.sin(a) * w * 0.28, w * 0.12, w * 0.06, a); }
  }
  c.restore();
}
function drawGift(c, x, y, w, t){
  c.save(); c.translate(x, y);
  glow(c, 0, 0, w * 1.5, 'rgba(255,225,90,A)');
  c.strokeStyle = `rgba(255,240,150,${0.6 - ((t * 1.6) % 1) * 0.5})`; c.lineWidth = Math.max(2, w * 0.05); c.beginPath(); c.arc(0, 0, w * (0.5 + ((t * 1.6) % 1) * 0.7), 0, TAU); c.stroke();
  drawAcorn(c, 0, 0, w * 1.1, 'gold', t, 0.3);
  c.restore();
}
