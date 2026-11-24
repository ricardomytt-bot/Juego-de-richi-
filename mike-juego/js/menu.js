'use strict';
// ===== Menús: título, pausa, opciones, controles y créditos =====
const MENU = { open: true, page: 'main', prev: 'main', idx: 0, t: 0, rects: [] };
function openMenu(page) { MENU.open = true; MENU.page = page; MENU.prev = page; MENU.idx = 0; sfx.select(); }
function closeMenu() { MENU.open = false; sfx.back(); }
function gotoPage(p) { if (MENU.page === 'main' || MENU.page === 'pause') MENU.prev = MENU.page; MENU.page = p; MENU.idx = 0; sfx.select(); }
function backPage() { if (MENU.page === 'shop') closeMenu(); else if (MENU.page === 'options' || MENU.page === 'inv' || MENU.page === 'controls' || MENU.page === 'credits' || MENU.page === 'map') { MENU.page = MENU.prev; MENU.idx = 0; sfx.back(); } else if (MENU.page === 'pause') closeMenu(); }
function goFullscreen() { try { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); } catch (e) { } }
function menuItems() {
  switch (MENU.page) {
    case 'main': return [
      { t: 'JUGAR', go: () => startGame() }, { t: 'OPCIONES', go: () => gotoPage('options') },
      { t: 'CONTROLES', go: () => gotoPage('controls') }, { t: 'CRÉDITOS', go: () => gotoPage('credits') }];
    case 'pause': {
      const a = [{ t: 'CONTINUAR', go: () => closeMenu() }];
      if (S.lvl && !S.stage) a.push({ t: 'INVENTARIO', go: () => gotoPage('inv') }, { t: 'MAPA', go: () => gotoPage('map') });
      a.push({ t: 'OPCIONES', go: () => gotoPage('options') }, { t: 'CONTROLES', go: () => gotoPage('controls') });
      if (S.stage || S.dialog) a.push({ t: 'SALTAR ESCENA', go: () => { S.skip = true; MENU.open = false; } });
      a.push({ t: 'SALIR AL TÍTULO', go: () => location.reload() }); return a;
    }
    case 'shop': {
      const U = P.up, mapNext = [1, 2, 3, 4, 5, 6, 7, 8].find(i => !S.maps[i]);
      const it = (t, price, can, buy) => ({ t: t + (can ? '   ' + price + ' 🪙' : '   (agotado)'), go: () => { if (!can) { sfx.back(); return; } if (S.coins < price) { sfx.low(); showHint('No te alcanzan las monedas', 1.5); return; } S.coins -= price; buy(); sfx.key(); } });
      const list = [];
      if (mapNext) list.push(it('🗺️ Mapa: ' + ZNAME[mapNext], 20 + mapNext * 8, true, () => { S.maps[mapNext] = true; if (S.lvlId === mapNext && S.lvl.seen) S.lvl.seen.fill(1); }));
      list.push(it('🍫 Chocolate mejorado (+10% cura)', [40, 60, 80][U.choco] || 0, U.choco < 3, () => { U.choco++; P.chocoHeal = Math.min(1, P.chocoHeal + .1); }));
      list.push(it('⏱️ Chocolate rápido (recarga -6 s)', 80, U.fast < 1, () => { U.fast++; CHOCO_CD = Math.max(8, CHOCO_CD - 6); }));
      list.push(it('🧣 Bufanda térmica (-12% daño)', [60, 90][U.scarf] || 0, U.scarf < 2, () => { U.scarf++; P.defMul *= .88; }));
      list.push(it('👟 Botas veloces (+10% velocidad)', [50, 80][U.boots] || 0, U.boots < 2, () => { U.boots++; P.speedMul += .1; }));
      list.push(it('🗡️ Afilador (+12% daño)', [70, 100, 130][U.sharp] || 0, U.sharp < 3, () => { U.sharp++; P.dmgMul += .12; }));
      list.push({ t: 'SALIR', go: () => closeMenu() });
      return list;
    }
    case 'inv': return [...[0, 1, 2].map(i => { const w = WEAPONS[P.equip[i]]; return { t: (i + 1) + '   ' + w.icon + ' ' + w.name + '   (' + w.type + ')', go: () => cycleSlot(i), slot: i }; }), { t: 'VOLVER', go: backPage }];
    case 'options': return [
      { t: 'MÚSICA', slider: 'music' }, { t: 'EFECTOS', slider: 'sfx' },
      { t: 'BOTONES EN PANTALLA', toggle: 'touch' }, { t: 'PANTALLA COMPLETA', go: goFullscreen }, { t: 'VOLVER', go: backPage }];
    default: return [{ t: 'VOLVER', go: backPage }];
  }
}
function menuActivate(it) {
  if (it.slider) return;
  if (it.toggle) { SETTINGS[it.toggle] = !SETTINGS[it.toggle]; saveSettings(); sfx.select(); return; }
  if (it.go) { if (MENU.page !== 'main' || it.t !== 'JUGAR') sfx.select(); it.go(); }
}
function menuAdjust(it, d) {
  if (it.slider) { SETTINGS[it.slider] = clamp(SETTINGS[it.slider] + d, 0, 10); saveSettings(); sfx.move(); }
  else if (it.toggle) { SETTINGS[it.toggle] = !SETTINGS[it.toggle]; saveSettings(); sfx.move(); }
}
function updateMenu(dt) {
  MENU.t += dt;
  const items = menuItems(); if (MENU.idx >= items.length) MENU.idx = 0;
  if (wasPressed(K.up)) { MENU.idx = (MENU.idx + items.length - 1) % items.length; sfx.move(); }
  if (wasPressed(K.down)) { MENU.idx = (MENU.idx + 1) % items.length; sfx.move(); }
  const it = items[MENU.idx];
  if (wasPressed(K.left)) menuAdjust(it, -1);
  if (wasPressed(K.right)) menuAdjust(it, 1);
  if (wasPressed(K.ok)) menuActivate(it);
  else if (wasPressed('Escape') && MENU.page !== 'main') backPage();
  else if (wasPressed('KeyP') && MENU.page === 'pause') closeMenu();
  if (PTR.hit) {
    PTR.hit = false;
    for (let i = 0; i < MENU.rects.length; i++) {
      const r = MENU.rects[i]; if (!r || PTR.x < r.x || PTR.x > r.x + r.w || PTR.y < r.y || PTR.y > r.y + r.h) continue;
      MENU.idx = i; const t = items[i];
      if (t.slider) { const v = clamp(Math.round((PTR.x - r.bx) / r.bw * 10), 0, 10); SETTINGS[t.slider] = v; saveSettings(); sfx.move(); }
      else menuActivate(t);
      break;
    }
  }
}
function rrect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function menuPanel(x, y, w, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(34,26,78,.94)'); g.addColorStop(1, 'rgba(12,8,36,.96)');
  ctx.fillStyle = g; rrect(x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; rrect(x + 2, y + 2, w - 4, h - 4, 16); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,74,.55)'; ctx.lineWidth = 2; rrect(x + 9, y + 9, w - 18, h - 18, 12); ctx.stroke();
}
function drawPad(x, y, label, sub, col) {
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(x, y + 6, 40, 0, 6.3); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 40, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
  txt(label, x, y - 10, { size: 20, align: 'center', outline: false, color: '#1a1020' }); txt(sub, x, y + 12, { size: 12, align: 'center', outline: false, color: '#1a1020' });
}
function drawMenu() {
  if (!MENU.open) return;
  const title = S.mode === 'title' && MENU.page === 'main', items = menuItems(), t = MENU.t;
  MENU.rects = [];
  if (!title) { ctx.fillStyle = 'rgba(4,2,16,.62)'; ctx.fillRect(0, 0, W, H); }
  const heads = { shop: 'TIENDA DE TROLINO', inv: 'INVENTARIO', pause: 'PAUSA', options: 'OPCIONES', controls: 'CONTROLES', credits: 'CRÉDITOS', map: 'MAPA' };
  let px, py, pw, ph, y0, gap = 58;
  if (title) { pw = 380; ph = items.length * gap + 36; px = (W / 2) - pw / 2; py = 258 - Math.max(0, items.length - 4) * 46; y0 = py + 24; }
  else {
    const extra = MENU.page === 'controls' ? 250 : MENU.page === 'credits' ? 200 : MENU.page === 'map' ? 330 : MENU.page === 'inv' ? 190 : MENU.page === 'shop' ? 70 : 0;
    pw = MENU.page === 'options' ? 640 : MENU.page === 'map' ? 700 : 560; ph = 90 + items.length * gap + extra; px = (W / 2) - pw / 2; py = Math.max(24, 270 - ph / 2); y0 = py + 78 + extra;
    menuPanel(px, py, pw, ph);
    txt(heads[MENU.page] || '', (W / 2), py + 24, { size: 34, align: 'center', color: '#ffe14a', lw: 6 });
  }
  if (title) { ctx.fillStyle = 'rgba(8,6,30,.8)'; rrect(px, py, pw, ph, 16); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; rrect(px + 1.5, py + 1.5, pw - 3, ph - 3, 14); ctx.stroke(); }
  if (MENU.page === 'controls') {
    drawPad(W / 2 - 230, py + 130, 'ACTUAR', 'E · K', '#7df3ff'); drawPad(W / 2 + 230, py + 130, 'ATACAR', 'J · ESPACIO', '#ff8a9a');
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc((W / 2), py + 132, 46, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc((W / 2) + Math.sin(t * 2) * 14, py + 132 + Math.cos(t * 2) * 10, 22, 0, 6.3); ctx.fill();
    txt('JOYSTICK', (W / 2), py + 188, { size: 14, align: 'center', color: '#bcd', outline: false });
    txt('Flechas o WASD también te mueven', (W / 2), py + 214, { size: 16, align: 'center', outline: false });
    txt('ACTUAR: hablar con los personajes y avanzar los diálogos', (W / 2), py + 238, { size: 16, align: 'center', outline: false });
    txt('ATACAR: usa tu espada hacia donde miras', (W / 2), py + 262, { size: 16, align: 'center', outline: false });
  } else if (MENU.page === 'map' && MM && S.lvl) {
    const L = S.lvl, sc = Math.max(2, Math.floor(Math.min(640 / L.w, 300 / L.h))), mw = L.w * sc, mh = L.h * sc, mx = (W / 2) - mw / 2, my = py + 70;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8); ctx.drawImage(MM.c, mx, my, mw, mh);
    const sd = (x, y) => L.seen && L.seen[Math.floor(y / T) * L.w + Math.floor(x / T)];
    for (const e of S.ents) if (sd(e.x, e.y)) { if (e.type === 'dia') { ctx.fillStyle = '#7df3ff'; ctx.fillRect(mx + e.x / T * sc - 3, my + e.y / T * sc - 3, 7, 7); } else if (e.type === 'key') { ctx.fillStyle = ['#e0a060', '#dfe6ff', '#ffd24a'][e.k]; ctx.fillRect(mx + e.x / T * sc - 3, my + e.y / T * sc - 3, 7, 7); } }
    if (Math.floor(t * 3) % 2) { ctx.fillStyle = '#ff3b5c'; ctx.fillRect(mx + P.x / T * sc - 3, my + P.y / T * sc - 3, 7, 7); }
    txt('◆ diamante   ● llave   ■ tú (parpadea)   Explora para descubrir el mapa', (W / 2), my + mh + 12, { size: 13, align: 'center', color: '#bcd', outline: false });
  } else if (MENU.page === 'shop') {
    txt('Tus monedas: 🪙 ' + S.coins + '   ·   Restauración de Diamantia: ' + S.restored + '/7', W / 2, py + 72, { size: 17, align: 'center', color: '#ffe14a', outline: false });
  } else if (MENU.page === 'inv') {
    const sel = Math.min(MENU.idx, 2), w = WEAPONS[P.equip[sel]], dmg = Math.round(w.dmg * P.dmgMul * 20), tx0 = W / 2;
    txt('Elige tus 3 armas: pulsa una ranura para cambiarla por otra que tengas', tx0, py + 70, { size: 15, align: 'center', color: '#bcd', outline: false });
    txt(w.icon + ' ' + w.name + '  ·  ' + w.type, tx0, py + 98, { size: 22, align: 'center', color: '#ffe14a', outline: false });
    txt('Daño ' + dmg + '%   ·   Recarga ' + w.cd.toFixed(2) + ' s   ·   ' + (w.ranged ? 'A distancia' + (w.spread ? ' (x' + w.spread + ')' : '') + (w.pierce ? ' · atraviesa' : '') : 'Cuerpo a cuerpo' + (w.heavy ? ' · golpe pesado' : '')), tx0, py + 130, { size: 16, align: 'center', outline: false });
    const have = P.owned.map(id => (P.equip.includes(id) ? '[' + WEAPONS[id].name + ']' : WEAPONS[id].name)).join('  ·  ');
    txt('Tus armas: ' + have, tx0, py + 160, { size: 14, align: 'center', color: '#9ad0ff', outline: false });
    txt('Más armas: mini jefes, cofres, oleadas y parkour', tx0, py + 186, { size: 14, align: 'center', color: '#bcd', outline: false });
  } else if (MENU.page === 'credits') {
    const L = ['Mikecrack y las Estrellas Oscuras  ·  Piloto', 'Un juego de fans basado en', 'Las Perrerías de Mike, de Mikecrack.', 'Historia original, sprites y código', 'hechos con Claude Code.'];
    L.forEach((s, i) => txt(s, (W / 2), py + 78 + i * 28, { size: i === 0 ? 20 : 17, align: 'center', color: i === 0 ? '#ffe14a' : '#fff', outline: false }));
  }
  items.forEach((it, i) => {
    const y = y0 + i * gap, sel = i === MENU.idx, w = title ? 320 : pw - 120, x = (W / 2) - w / 2;
    ctx.fillStyle = sel ? 'rgba(255,225,74,.95)' : 'rgba(255,255,255,.08)'; rrect(x, y, w, 46, 12); ctx.fill();
    if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; rrect(x, y, w, 46, 12); ctx.stroke(); }
    const col = sel ? '#1a1020' : '#fff', bob = sel ? Math.sin(t * 8) * 3 : 0;
    if (sel) txt('▶', x + 14 + bob, y + 11, { size: 22, color: '#1a1020', outline: false });
    if (it.slider) {
      txt(it.t, x + 44, y + 12, { size: 20, color: col, outline: false });
      const bw = 190, bx = x + w - bw - 24, v = SETTINGS[it.slider];
      ctx.fillStyle = sel ? 'rgba(26,16,32,.35)' : 'rgba(255,255,255,.18)'; ctx.fillRect(bx, y + 17, bw, 12);
      ctx.fillStyle = sel ? '#1a1020' : '#ffe14a'; ctx.fillRect(bx, y + 17, bw * v / 10, 12);
      ctx.fillStyle = sel ? '#fff' : '#fff'; ctx.fillRect(bx + bw * v / 10 - 4, y + 11, 8, 24);
      txt(String(v), bx - 16, y + 12, { size: 20, align: 'right', color: col, outline: false });
      MENU.rects.push({ x, y, w, h: 46, bx, bw });
    } else if (it.toggle) {
      txt(it.t, x + 44, y + 12, { size: 20, color: col, outline: false });
      txt(SETTINGS[it.toggle] ? 'SÍ' : 'NO', x + w - 26, y + 12, { size: 20, align: 'right', color: SETTINGS[it.toggle] ? (sel ? '#0a6a2a' : '#7dff8a') : (sel ? '#8a1a1a' : '#ff8a8a'), outline: false });
      MENU.rects.push({ x, y, w, h: 46 });
    } else {
      txt(it.t, (W / 2), y + 12, { size: 22, align: 'center', color: col, outline: false });
      MENU.rects.push({ x, y, w, h: 46 });
    }
  });
  if (!title) txt('↑ ↓ elegir   ·   ACTUAR / ATACAR aceptar   ·   ESC volver', (W / 2), H - 30, { size: 14, align: 'center', color: '#bcd', outline: false });
  else txt('Joystick o flechas para elegir  ·  ACTUAR o ATACAR para aceptar', (W / 2), H - 28, { size: 14, align: 'center', color: '#bcd', lw: 3 });
}
