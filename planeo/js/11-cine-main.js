/* 11 · arranque de la página de cinemáticas 3D */
'use strict';
(function(){
  const $$ = id => document.getElementById(id);
  const ok = c3Init();
  if (!ok){ document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;inset:0;display:grid;place-items:center;background:#1b2250;color:#fff;font:600 18px sans-serif;padding:24px;text-align:center;z-index:99">Este dispositivo no admite WebGL, necesario para las cinemáticas 3D.</div>'); return; }
  window.addEventListener('resize', g3Resize);
  // todas las skins disponibles en la prueba
  SKINS.forEach(s => { SKIN_OWN[s.id] = true; });
  const sel = $$('selSkin'); sel.innerHTML = SKINS.map(s => `<option value="${s.id}">${s.name}</option>`).join(''); sel.value = SKIN_SEL; sel.onchange = () => selectSkin(sel.value);
  $$('inName').value = store.get('planeo2.name', ''); $$('inName').addEventListener('input', () => store.set('planeo2.name', $$('inName').value.trim().slice(0, 14)));
  const SEQ = [['intro', 'Introducción', 'El Pueblo Ardilla, los ladrones y el hangar del abuelo'], ['post0', 'Capítulo 1 · Capitán Grajo', 'El primer ladrón se rinde'], ['pre1', 'Capítulo 2 · La tormenta', 'Nubarrón Trueno aparece'], ['post1', 'Capítulo 2 · Nubarrón Trueno', 'El gigante que solo quería compañía'],
    ['pre2', 'Capítulo 3 · El bosque dorado', 'Los ojos de Don Búho'], ['post2', 'Capítulo 3 · Don Búho', 'La última bellota'], ['outro', 'Epílogo', 'La isla vuelve a brillar']];
  $$('seqs').innerHTML = SEQ.map((q, i) => `<button class="soft seq" style="width:100%" data-k="${q[0]}"><span class="n">${i + 1}</span><span><b>${q[1]}</b><small>${q[2]}</small></span></button>`).join('');
  const go = k => { Sound.init(); Sound.startMusic(); C3.queue = []; c3Start(k); };
  $$('seqs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) go(b.dataset.k); });
  $$('btnAll').onclick = () => { Sound.init(); Sound.startMusic(); C3.queue = SEQ.slice(1).map(q => q[0]); c3Start('intro'); };
  const adv = () => { Sound.init(); c3Advance(); };
  $$('dlgBox').addEventListener('click', adv); document.getElementById('g3').addEventListener('click', adv);
  document.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; if (!C3.playing) return; if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight'){ adv(); e.preventDefault(); } else if (e.key === 'Escape'){ C3.queue = []; c3End(); } });
  $$('btnSkipC').onclick = e => { e.stopPropagation(); C3.queue = []; c3End(); };
  $$('btnMuteC').onclick = e => { e.stopPropagation(); Sound.init(); Sound.setMuted(!Sound.muted); $$('btnMuteC').textContent = Sound.muted ? '🔇' : '🔊'; };
  requestAnimationFrame(c3Frame);
  window.__c3 = { C3, SCENES };
})();
