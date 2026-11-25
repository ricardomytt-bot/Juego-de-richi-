'use strict';
// ===== Menús: título, pausa, opciones, controles y créditos =====
const MENU = { open: true, page: 'main', prev: 'main', idx: 0, t: 0, rects: [] };
function openMenu(page) { MENU.scroll = 0; MENU.open = true; MENU.page = page; MENU.prev = page; MENU.idx = 0; sfx.select(); }
function closeMenu() { MENU.open = false; sfx.back(); }
function gotoPage(p) { MENU.scroll = 0; if (MENU.page === 'main' || MENU.page === 'pause') MENU.prev = MENU.page; MENU.page = p; MENU.idx = 0; sfx.select(); }
function backPage() { MENU.scroll = 0; if (MENU.page === 'shop') closeMenu(); else if (MENU.page === 'options' || MENU.page === 'inv' || MENU.page === 'guide' || MENU.page === 'controls' || MENU.page === 'credits' || MENU.page === 'map') { MENU.page = MENU.prev; MENU.idx = 0; sfx.back(); } else if (MENU.page === 'pause') closeMenu(); }
function goFullscreen() { try { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); } catch (e) { } }
function menuItems() {
  switch (MENU.page) {
    case 'main': return [
      { t: 'JUGAR', go: () => startGame() }, { t: 'OPCIONES', go: () => gotoPage('options') },
      { t: 'CONTROLES', go: () => gotoPage('controls') }, { t: 'CRÉDITOS', go: () => gotoPage('credits') }];
    case 'pause': {
      const a = [{ t: 'CONTINUAR', go: () => closeMenu() }];
      if (S.lvl && !S.stage) a.push({ t: 'INVENTARIO', go: () => gotoPage('inv') }, { t: 'MAPA', go: () => gotoPage('map') }, { t: 'GUÍA DEL JUEGO', go: () => gotoPage('guide') });
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
    case 'guide': return [{ t: 'VOLVER', go: backPage }];
    case 'inv': return [...[0, 1, 2].map(i => { const w = WEAPONS[P.equip[i]]; return { t: (i + 1) + '   ' + w.icon + ' ' + w.name + '   (' + w.type + ')', go: () => cycleSlot(i), slot: i }; }), { t: '🛡️ ARMADURA   ' + (P.armor ? ARMORS[P.armor].icon + ' ' + ARMORS[P.armor].name : 'Ninguna'), go: cycleArmor, armorSlot: true }, { t: 'VOLVER', go: backPage }];
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
  if (wasPressed(K.up)) { MENU.idx = (MENU.idx + items.length - 1) % items.length; sfx.move(); MENU.follow = true; }
  if (wasPressed(K.down)) { MENU.idx = (MENU.idx + 1) % items.length; sfx.move(); MENU.follow = true; }
  if (isDown('PageDown')) MENU.scroll = (MENU.scroll || 0) + 14; if (isDown('PageUp')) MENU.scroll = (MENU.scroll || 0) - 14;
  const it = items[MENU.idx];
  if (wasPressed(K.left)) menuAdjust(it, -1);
  if (wasPressed(K.right)) menuAdjust(it, 1);
  if (wasPressed(K.ok)) menuActivate(it);
  else if (wasPressed('Escape') && MENU.page !== 'main') backPage();
  else if (wasPressed('KeyP') && MENU.page === 'pause') closeMenu();
  const panelMode = !(S.mode === 'title' && MENU.page === 'main');
  if (panelMode) {
    if (PTR.down && PTR.drag) MENU.scroll = (MENU.scroll || 0) - PTR.mv; PTR.mv = 0;
    if (PTR.tap) {
      PTR.tap = false; const bk = MENU.backRect, bd = MENU.body;
      if (bk && PTR.x >= bk.x && PTR.x <= bk.x + bk.w && PTR.y >= bk.y && PTR.y <= bk.y + bk.h) { sfx.back(); if (MENU.page === 'pause') closeMenu(); else backPage(); return; }
      if (bd && PTR.x >= bd.x && PTR.x <= bd.x + bd.w && PTR.y >= bd.y && PTR.y <= bd.y + bd.h) for (let i = 0; i < MENU.rects.length; i++) {
        const r = MENU.rects[i]; if (!r || PTR.x < r.x || PTR.x > r.x + r.w || PTR.y < r.y || PTR.y > r.y + r.h) continue;
        MENU.idx = i; const t = items[i];
        if (t.slider) { const v = clamp(Math.round((PTR.x - r.bx) / r.bw * 10), 0, 10); SETTINGS[t.slider] = v; saveSettings(); sfx.move(); } else menuActivate(t);
        break;
      }
    }
  } else if (PTR.hit) {
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
  if (!title) return drawMenuPanel();
  MENU.rects = [];
  if (!title) { ctx.fillStyle = 'rgba(4,2,16,.62)'; ctx.fillRect(0, 0, W, H); }
  const heads = { guide: 'GUÍA DEL JUEGO', shop: 'TIENDA DE AMBROSIO', inv: 'INVENTARIO', pause: 'PAUSA', options: 'OPCIONES', controls: 'CONTROLES', credits: 'CRÉDITOS', map: 'MAPA' };
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

// ---------- Menú nuevo: panel con desplazamiento, tarjetas y guía ----------
function fitTxt(s, w, size) { ctx.font = 'bold ' + size + 'px "Courier New",monospace'; if (ctx.measureText(s).width <= w) return s; while (s.length > 1 && ctx.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; }
function guideSections() {
  const wr = [];
  for (const id in WEAPONS) { const w = WEAPONS[id]; wr.push([w.icon + ' ' + w.name, w.type, Math.round(w.dmg * 20) + '%', w.cd.toFixed(2) + ' s', w.ranged ? 'A distancia' + (w.spread ? ' x' + w.spread : '') + (w.pierce ? ' · atraviesa' : '') : 'Cuerpo a cuerpo' + (w.heavy ? ' · pesado' : '')]); }
  const zr = [['🏙️', 'Diamantia', 'Ciudad base · tienda · fogatas', '—']]; for (let i = 1; i <= 8; i++) { const d = ZDEF[i]; zr.push([String(i), d.name, 'Laberintos · oleadas · parkour', d.boss]); }
  const br = Object.keys(BOSS_DATA).map(k => { const D = BOSS_DATA[k], m = BOSS_MUL[k] || [1, 1]; return [D.foe, 'x' + m[0] + ' vida', 'vel x' + m[1], D.tip.replace(/^¡?cuando /, 'Cuando ').slice(0, 60)]; });
  return [
    { title: '⚔️ ARMAS (3 equipadas a la vez) · ★ legendarias en dorado', cols: ['Arma', 'Tipo', 'Daño', 'Recarga', 'Función'], w: [.24, .13, .1, .12, .41], rows: wr },
    { title: '★ LEGENDARIAS (Coliseo Romano)', cols: ['Arma', 'Daño', 'Recarga', 'Dónde'], w: [.3, .14, .16, .4], rows: [['💎 Espada de Diamante', '44%', '0,13 s', 'Gladiador Slime (mini jefe)'], ['🔨 Mazo Devastador', '280%', '2,6 s', 'Cámara de Oleadas'], ['🌀 Rayo Kamekame', '240%', '30 s', 'Parkour del Coliseo']] },
    { title: '🛡️ ARMADURAS (cuerpo completo)', cols: ['Armadura', 'Efecto', 'Dónde'], w: [.3, .42, .28], rows: [['🧥 Cuero', '-10% daño recibido', 'Parkour, Valle del Sueño'], ['🔗 Cota de malla', '-20% daño recibido', 'Cofre, Pastelandia'], ['⛓️ Hierro', '-32% daño recibido', 'Oleadas, Fábrica de Pizza'], ['🥷 Kit de Samurái ★', '-55% daño · +12% daño · +8% vel.', 'Robot Otaku, Ciudad Neón']] },
    { title: '🗺️ ZONAS', cols: ['#', 'Zona', 'Qué hay', 'Jefe'], w: [.07, .3, .38, .25], rows: zr },
    { title: '👑 JEFES', cols: ['Jefe', 'Vida', 'Velocidad', 'Punto débil'], w: [.2, .16, .16, .48], rows: br },
    { title: '🎒 OBJETOS Y MEJORAS', cols: ['Objeto', 'Efecto', 'Dónde'], w: [.28, .4, .32], rows: [['🍫 Chocolate', 'Cura ' + Math.round(P.chocoHeal * 100) + '%, recarga ' + CHOCO_CD + ' s', 'Siempre (tecla R)'], ['💎 Diamantes', 'Abren la puerta del jefe', '3 por zona'], ['🗝️ Llaves', 'Abren puertas de colores', 'Laberintos'], ['💖 Corazones', '+20% de vida', 'Suelo y enemigos'], ['🪙 Monedas', 'Se gastan en la tienda', 'Enemigos y cofres'], ['🛌 Almohada', '+25% daño', 'Jefe Timba'], ['🧁 Muffin Dorado', 'Chocolate más rápido', 'Jefe Acenix'], ['🌡️ Termo', 'Chocolate +10%', 'Jefe Rius'], ['⚡ Circuito', '+12% velocidad', 'Jefe Mayo'], ['☁️ Bufanda', '-15% daño recibido', 'Jefe Esparta'], ['🥷 Máscara', '+15% daño', 'Jefe Raptor'], ['🪖 Casco', '-15% daño recibido', 'Jefe Invictor']] },
    { title: '🛒 TIENDA DE AMBROSIO', cols: ['Producto', 'Precio', 'Efecto'], w: [.4, .22, .38], rows: [['🗺️ Mapa de zona', '28-84 🪙', 'Revela la zona'], ['🍫 Chocolate mejorado', '40/60/80', '+10% de cura'], ['⏱️ Chocolate rápido', '80', 'Recarga -6 s'], ['🧣 Bufanda térmica', '60/90', '-12% daño recibido'], ['👟 Botas veloces', '50/80', '+10% velocidad'], ['🗡️ Afilador', '70/100/130', '+12% daño']] },
    { title: '🧑‍🤝‍🧑 PERSONAJES', cols: ['Personaje', 'Rol', 'Personalidad'], w: [.24, .26, .5], rows: [['🐶 Mike', 'Héroe', 'Valiente y amante del chocolate'], ['🐕 Willy Perro', 'Mascota', 'Leal; sus ladridos se "traducen"'], ['📮 Ambrosio', 'Cartero y todo oficio', 'Como Larry: tiene todos los trabajos'], ['🐱 Aquela', 'Guía', 'Tranquila, da pistas'], ['🧢 Trolino', 'Compañero', 'Orgulloso, buen amigo'], ['😴 Timba', 'Jefe 1', 'Dormilón'], ['🐱 Acenix', 'Jefe 2', 'Gato gris hornero'], ['🐔 Rius', 'Jefe 3', 'Bromista'], ['🤖 Mayo', 'Jefe 4', 'Robot pizzero'], ['🌥️ Esparta', 'Jefe 5', 'Juguetón y calmado'], ['🎌 Raptor', 'Jefe 6', 'Fan del anime'], ['🏺 Invictor', 'Jefe 7', 'Feliz y juguetón'], ['😈 Exe', 'Jefe final', 'Mike Maligno']] },
    { title: '🔥 FOGATAS', cols: ['Qué hacen'], w: [1], rows: [['ACTUAR junto a una: restauras vida y chocolate, fijas tu punto de control y guardas la partida.'], ['Si mueres, reapareces en la última fogata (aunque sea en otra zona).']] }
  ];
}
function drawTable(x, y, w, sec) {
  let h = 0; ctx.fillStyle = 'rgba(255,225,74,.16)'; rrect(x, y, w, 32, 8); ctx.fill(); txt(sec.title, x + 12, y + 7, { size: 16, color: '#ffe14a', outline: false }); h += 38;
  const xs = []; let cx = x; for (const f of sec.w) { xs.push([cx, f * w]); cx += f * w; }
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x, y + h, w, 26); sec.cols.forEach((c, i) => txt(fitTxt(c, xs[i][1] - 10, 13), xs[i][0] + 8, y + h + 5, { size: 13, color: '#9ad0ff', outline: false })); h += 28;
  sec.rows.forEach((r, ri) => { if (ri % 2) { ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, y + h, w, 28); } r.forEach((c, i) => txt(fitTxt(c, xs[i][1] - 10, 14), xs[i][0] + 8, y + h + 5, { size: 14, outline: false })); h += 28; });
  return h + 14;
}
function menuExtra(w) {
  const page = MENU.page;
  if (page === 'pause') return { h: 46, draw: (x, y) => { txt('🪙 ' + S.coins + '    ·    Restauración de Diamantia: ' + S.restored + '/7    ·    ' + (S.lvl ? ['Diamantia', 'Valle del Sueño', 'Pastelandia', 'Granja', 'Fábrica', 'Nubes', 'Neón', 'Coliseo', 'Código'][S.lvlId] || 'Interior' : ''), x + w / 2, y + 8, { size: 16, align: 'center', color: '#ffe14a', outline: false }); } };
  if (page === 'shop') return { h: 60, draw: (x, y) => { txt('Tus monedas: 🪙 ' + S.coins, x + w / 2, y + 6, { size: 20, align: 'center', color: '#ffe14a', outline: false }); txt('Ambrosio: "¡Tengo todos los trabajos... y todas las mercancías!"', x + w / 2, y + 34, { size: 14, align: 'center', color: '#bcd', outline: false }); } };
  if (page === 'inv') return { h: 200, draw: (x, y) => {
    if (MENU.idx === 3) { const A = P.armor ? ARMORS[P.armor] : null, cx0 = x + w / 2; txt('Pulsa para cambiar de armadura (cuerpo completo)', cx0, y + 2, { size: 15, align: 'center', color: '#bcd', outline: false }); txt(A ? A.icon + ' ' + A.name : 'Sin armadura', cx0, y + 38, { size: 24, align: 'center', color: A && A.legend ? '#ff9a4a' : '#ffe14a', outline: false }); txt(A ? A.note : 'Consigue armaduras en cofres, oleadas y mini jefes', cx0, y + 78, { size: 16, align: 'center', outline: false }); txt('Armaduras: ' + (P.armors.length ? P.armors.map(id => ARMORS[id].name).join('  ·  ') : 'ninguna todavía'), cx0, y + 118, { size: 14, align: 'center', color: '#9ad0ff', outline: false }); return; }
    const sel = Math.min(MENU.idx, 2), wp = WEAPONS[P.equip[sel]], dmg = Math.round(wp.dmg * P.dmgMul * 20), cx = x + w / 2;
    txt('Pulsa una ranura para cambiarla por otra arma que tengas', cx, y + 2, { size: 15, align: 'center', color: '#bcd', outline: false });
    txt(wp.icon + ' ' + wp.name + '  ·  ' + wp.type, cx, y + 32, { size: 24, align: 'center', color: '#ffe14a', outline: false });
    txt('Daño ' + dmg + '%   ·   Recarga ' + wp.cd.toFixed(2) + ' s   ·   ' + (wp.ranged ? 'A distancia' + (wp.spread ? ' (x' + wp.spread + ')' : '') + (wp.pierce ? ' · atraviesa' : '') : 'Cuerpo a cuerpo' + (wp.heavy ? ' · golpe pesado' : '')), cx, y + 68, { size: 16, align: 'center', outline: false });
    let chx = x; let chy = y + 108; P.owned.forEach(id => { const t = WEAPONS[id].icon + ' ' + WEAPONS[id].name, tw = (t.length * 9.2) + 24; if (chx + tw > x + w) { chx = x; chy += 38; } ctx.fillStyle = P.equip.includes(id) ? 'rgba(255,225,74,.85)' : 'rgba(255,255,255,.12)'; rrect(chx, chy, tw, 30, 15); ctx.fill(); txt(t, chx + tw / 2, chy + 7, { size: 14, align: 'center', color: P.equip.includes(id) ? '#1a1020' : '#fff', outline: false }); chx += tw + 8; });
  } };
  if (page === 'map' && MM && S.lvl) { const L = S.lvl, sc = Math.max(2, Math.floor(Math.min(w / L.w, 300 / L.h))), mw = L.w * sc, mh = L.h * sc; return { h: mh + 50, draw: (x, y) => {
    const mx = x + (w - mw) / 2, my = y; ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(mx - 4, my - 4, mw + 8, mh + 8); ctx.drawImage(MM.c, mx, my, mw, mh);
    const sd = (ex, ey) => L.seen && L.seen[Math.floor(ey / T) * L.w + Math.floor(ex / T)];
    for (const e of S.ents) if (sd(e.x, e.y)) { if (e.type === 'dia') { ctx.fillStyle = '#7df3ff'; ctx.fillRect(mx + e.x / T * sc - 3, my + e.y / T * sc - 3, 7, 7); } else if (e.type === 'key') { ctx.fillStyle = ['#e0a060', '#dfe6ff', '#ffd24a'][e.k]; ctx.fillRect(mx + e.x / T * sc - 3, my + e.y / T * sc - 3, 7, 7); } else if (e.type === 'bonfire') { ctx.fillStyle = '#ff9a2a'; ctx.fillRect(mx + e.x / T * sc - 3, my + e.y / T * sc - 3, 7, 7); } }
    if (Math.floor(MENU.t * 3) % 2) { ctx.fillStyle = '#ff3b5c'; ctx.fillRect(mx + P.x / T * sc - 3, my + P.y / T * sc - 3, 7, 7); }
    txt('◆ diamante   ● llave   ■ fogata   ■ tú (parpadea)', x + w / 2, my + mh + 12, { size: 13, align: 'center', color: '#bcd', outline: false }); } }; }
  if (page === 'controls') return { h: 280, draw: (x, y) => { const cx = x + w / 2;
    drawPad(cx - 250, y + 54, 'ACTUAR', 'E · K', '#7df3ff'); drawPad(cx + 250, y + 54, 'ATACAR', 'J · ESPACIO', '#ff8a9a');
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.arc(cx, y + 56, 46, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + Math.sin(MENU.t * 2) * 14, y + 56 + Math.cos(MENU.t * 2) * 10, 22, 0, 6.3); ctx.fill();
    ['Joystick, flechas o WASD: moverte', 'ACTUAR (E): hablar, abrir cofres, descansar en fogatas', 'ATACAR (J / Espacio): usar el arma equipada', 'Q o 1-3: cambiar de arma  ·  R: chocolate  ·  I: inventario', 'Menú ☰ o Esc: pausa  ·  PageUp/PageDown o arrastrar: desplazar'].forEach((s, i) => txt(s, cx, y + 130 + i * 28, { size: 16, align: 'center', outline: false })); } };
  if (page === 'credits') return { h: 170, draw: (x, y) => { ['Mikecrack y las Estrellas Oscuras  ·  Piloto', 'Un juego de fans basado en', 'Las Perrerías de Mike, de Mikecrack.', 'Historia original, sprites y código', 'hechos con Claude Code.'].forEach((s, i) => txt(s, x + w / 2, y + 8 + i * 30, { size: i === 0 ? 20 : 17, align: 'center', color: i === 0 ? '#ffe14a' : '#fff', outline: false })); } };
  if (page === 'guide') { const secs = guideSections(); let tot = 0; for (const s of secs) tot += 38 + 28 + s.rows.length * 28 + 14; return { h: tot, last: true, draw: (x, y) => { let yy = y; for (const s of secs) yy += drawTable(x, yy, w, s); } }; }
  return null;
}
function drawMenuPanel() {
  const items = menuItems(), t = MENU.t; MENU.rects = [];
  const bgg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .7); bgg.addColorStop(0, 'rgba(24,16,56,.82)'); bgg.addColorStop(1, 'rgba(4,2,14,.94)'); ctx.fillStyle = bgg; ctx.fillRect(0, 0, W, H);
  const pw = Math.min(W - 24, 860), ph = H - 20, px = (W - pw) / 2, py = 10;
  menuPanel(px, py, pw, ph);
  const heads = { pause: 'PAUSA', options: 'OPCIONES', controls: 'CONTROLES', credits: 'CRÉDITOS', map: 'MAPA', inv: 'INVENTARIO', shop: 'TIENDA DE AMBROSIO', guide: 'GUÍA DEL JUEGO' }, icons = { pause: '⏸️', options: '⚙️', controls: '🎮', credits: '⭐', map: '🗺️', inv: '🎒', shop: '🛒', guide: '📖' };
  ctx.fillStyle = 'rgba(255,225,74,.12)'; rrect(px + 16, py + 14, pw - 32, 50, 14); ctx.fill();
  txt((icons[MENU.page] || '') + ' ' + (heads[MENU.page] || ''), px + 34, py + 24, { size: 28, color: '#ffe14a', lw: 6 });
  const bk = { x: px + pw - 168, y: py + 21, w: 136, h: 36 }; MENU.backRect = bk; ctx.fillStyle = 'rgba(255,90,110,.9)'; rrect(bk.x, bk.y, bk.w, bk.h, 18); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rrect(bk.x, bk.y, bk.w, bk.h, 18); ctx.stroke(); txt(MENU.page === 'pause' ? '✕ CERRAR' : '← VOLVER', bk.x + bk.w / 2, bk.y + 8, { size: 17, align: 'center', outline: false });
  const bx = px + 26, by = py + 80, bw = pw - 52, bh = ph - 80 - 38; MENU.body = { x: bx, y: by, w: bw, h: bh };
  const ex = menuExtra(bw), exH = ex ? ex.h + 12 : 0, rowH = 58, itemsH = items.length * rowH, itemsFirst = !!(ex && ex.last), total = exH + itemsH + 6;
  const exY = itemsFirst ? itemsH : 0, itY = itemsFirst ? 0 : exH;
  const maxS = Math.max(0, total - bh);
  if (MENU.follow) { MENU.follow = false; const ry = itY + MENU.idx * rowH; if (ry < (MENU.scroll || 0)) MENU.scroll = ry - 6; else if (ry + 52 > (MENU.scroll || 0) + bh) MENU.scroll = ry + 58 - bh; }
  MENU.scroll = clamp(MENU.scroll || 0, 0, maxS); const sc = MENU.scroll;
  ctx.save(); ctx.beginPath(); ctx.rect(bx - 6, by, bw + 12, bh); ctx.clip(); ctx.translate(bx, by - sc);
  if (ex) ex.draw(0, exY);
  items.forEach((it, i) => {
    const y = itY + i * rowH, sel = i === MENU.idx, w = bw - 16, x = 0, rect = { x: bx, y: by + y - sc, w, h: 50 };
    const g = ctx.createLinearGradient(0, y, 0, y + 50); if (sel) { g.addColorStop(0, '#ffe98a'); g.addColorStop(1, '#f4c430'); } else { g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,.05)'); }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(x + 2, y + 4, w, 50, 14); ctx.fill(); ctx.fillStyle = g; rrect(x, y, w, 50, 14); ctx.fill(); ctx.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,.28)'; ctx.lineWidth = sel ? 3 : 2; rrect(x, y, w, 50, 14); ctx.stroke();
    const col = sel ? '#1a1020' : '#fff', bob = sel ? Math.sin(t * 8) * 3 : 0;
    if (sel) txt('▶', x + 14 + bob, y + 12, { size: 22, color: '#1a1020', outline: false });
    if (it.slider) {
      txt(it.t, x + 46, y + 14, { size: 20, color: col, outline: false });
      const sbw = Math.min(260, w * .4), sbx = x + w - sbw - 70, v = SETTINGS[it.slider];
      ctx.fillStyle = sel ? 'rgba(26,16,32,.35)' : 'rgba(255,255,255,.2)'; rrect(sbx, y + 19, sbw, 12, 6); ctx.fill(); ctx.fillStyle = sel ? '#1a1020' : '#ffe14a'; rrect(sbx, y + 19, Math.max(6, sbw * v / 10), 12, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(sbx + sbw * v / 10 - 4, y + 12, 8, 26);
      txt(String(v), sbx + sbw + 28, y + 14, { size: 20, align: 'center', color: col, outline: false });
      rect.bx = bx + sbx; rect.bw = sbw;
    } else if (it.toggle) {
      txt(it.t, x + 46, y + 14, { size: 20, color: col, outline: false });
      txt(SETTINGS[it.toggle] ? 'SÍ' : 'NO', x + w - 30, y + 14, { size: 20, align: 'right', color: SETTINGS[it.toggle] ? (sel ? '#0a6a2a' : '#7dff8a') : (sel ? '#8a1a1a' : '#ff8a8a'), outline: false });
    } else txt(fitTxt(it.t, w - 90, 21), x + w / 2, y + 14, { size: 21, align: 'center', color: col, outline: false });
    MENU.rects.push(rect);
  });
  ctx.restore();
  if (maxS > 0) {
    const tx0 = px + pw - 18, th = Math.max(40, bh * bh / total), ty = by + (bh - th) * (sc / maxS);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; rrect(tx0, by, 8, bh, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,225,74,.9)'; rrect(tx0, ty, 8, th, 4); ctx.fill();
    if (sc < maxS - 4) txt('▼ desliza para ver más', px + pw / 2, by + bh - 4, { size: 13, align: 'center', color: '#ffe14a', lw: 4 });
    if (sc > 4) txt('▲', px + pw / 2, by - 12, { size: 13, align: 'center', color: '#ffe14a', lw: 4 });
  }
  txt('↑ ↓ elegir  ·  ACTUAR / ATACAR aceptar  ·  arrastra o rueda para desplazar  ·  ESC volver', W / 2, py + ph - 26, { size: 13, align: 'center', color: '#bcd', outline: false });
}
