/* 06 · fantasmas: grabación, compresión, código para compartir */
'use strict';
function pushVar(a, n){ n = Math.max(0, Math.floor(n)); while (n >= 128){ a.push((n % 128) | 128); n = Math.floor(n / 128); } a.push(n); }
const zig = n => n >= 0 ? n * 2 : -n * 2 - 1, unzig = u => (u % 2) ? -(u + 1) / 2 : u / 2;
function b64e(bytes){ let s = ''; for (let i = 0; i < bytes.length; i += 0x2000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x2000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64d(str){ str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const s = atob(str), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
async function pipeBytes(bytes, stream){
  const w = stream.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}
async function encodeGhost(g){
  const a = [2];
  for (let i = 0; i < 4; i++) a.push((g.seed >>> (8 * i)) & 255);
  pushVar(a, Math.round(g.time * 100)); pushVar(a, g.acorns);
  const nm = new TextEncoder().encode(g.name.slice(0, 14)); a.push(nm.length); nm.forEach(b => a.push(b));
  pushVar(a, g.Ps.length);
  let prev = 0;
  for (let i = 0; i < g.Ps.length; i++){ pushVar(a, zig(g.Ps[i] - prev)); prev = g.Ps[i]; a.push(g.Xs[i]); }
  const raw = new Uint8Array(a);
  if (typeof CompressionStream !== 'undefined'){
    try { return 'z' + b64e(await pipeBytes(raw, new CompressionStream('deflate-raw'))); } catch (e) {}
  }
  return 'r' + b64e(raw);
}
async function decodeGhost(code){
  code = code.trim();
  const m = code.match(/#g=([A-Za-z0-9_\-]+)/); if (m) code = m[1];
  if (!/^[zr][A-Za-z0-9_\-]+$/.test(code)) throw new Error('Código no válido');
  let raw = b64d(code.slice(1));
  if (code[0] === 'z'){
    if (typeof DecompressionStream === 'undefined') throw new Error('Tu navegador no puede leer este código');
    raw = await pipeBytes(raw, new DecompressionStream('deflate-raw'));
  }
  let p = 0; const rv = () => { let n = 0, mul = 1, b; do { b = raw[p++]; n += (b & 127) * mul; mul *= 128; } while (b & 128); return n; };
  if (raw[p++] !== 2) throw new Error('Ese fantasma es de una versión anterior');
  let seed = 0; for (let i = 0; i < 4; i++) seed += raw[p++] * Math.pow(2, 8 * i);
  const time = rv() / 100, acorns = rv();
  const nl = raw[p++]; const name = new TextDecoder().decode(raw.subarray(p, p + nl)); p += nl;
  const n = rv(); if (n > 5000) throw new Error('Datos corruptos');
  const Ps = new Array(n), Xs = new Array(n); let prev = 0;
  for (let i = 0; i < n; i++){ prev += unzig(rv()); Ps[i] = prev; Xs[i] = raw[p++]; }
  if (p > raw.length) throw new Error('Datos corruptos');
  return { name: name || 'Fantasma', time, acorns, seed: seed >>> 0, Ps, Xs };
}
const Ghosts = {
  list: store.get('planeo2.ghosts', []).filter(g => LEVEL_SEEDS.includes(g.seed)),   // [{id,seed,name,time,acorns,code,mine}]
  save(){ store.set('planeo2.ghosts', this.list.map(g => ({ id: g.id, seed: g.seed, name: g.name, time: g.time, acorns: g.acorns, code: g.code, mine: !!g.mine }))); },
  forSeed(seed){ return this.list.filter(g => g.seed === seed); },
  mine(seed){ return this.list.find(g => g.mine && g.seed === seed); },
  async add(code, mine){
    const d = await decodeGhost(code);
    if (!LEVEL_SEEDS.includes(d.seed)) throw new Error('Ese fantasma es de otro nivel');
    const norm = await encodeGhost(d);
    const dup = this.list.find(g => g.seed === d.seed && g.time === d.time && g.name === d.name && !!g.mine === !!mine);
    if (dup && !mine) throw new Error('Ya tienes ese fantasma');
    if (mine) this.list = this.list.filter(g => !(g.mine && g.seed === d.seed));
    const g = { id: 'g' + Date.now() + Math.floor(Math.random() * 999), seed: d.seed, name: d.name, time: d.time, acorns: d.acorns, code: norm, mine: !!mine };
    this.list.push(g);
    const others = this.list.filter(x => !x.mine && x.seed === d.seed);
    if (others.length > 5){ const i = this.list.findIndex(x => !x.mine && x.seed === d.seed); this.list.splice(i, 1); }
    this.save(); return g;
  },
  remove(id){ this.list = this.list.filter(g => g.id !== id); this.save(); },
  async runtime(seed){
    const out = [], mine = this.forSeed(seed);
    for (let i = 0; i < mine.length; i++){
      const g = mine[i];
      try {
        const d = await decodeGhost(g.code);
        out.push({ name: g.mine ? 'Tu mejor' : g.name, time: d.time, mine: g.mine, color: g.mine ? '#ffffff' : GHOST_COLORS[i % GHOST_COLORS.length],
          Ps: Float32Array.from(d.Ps, v => v / 10), Xs: Float32Array.from(d.Xs, v => v / 8) });
      } catch (e) {}
    }
    return out;
  }
};
function ghostAt(g, t){
  const f = t / 0.25, i = Math.floor(f);
  if (i >= g.Ps.length - 1) return null;
  if (i < 0) return { P: g.Ps[0], x: g.Xs[0] };
  const k = f - i;
  return { P: lerp(g.Ps[i], g.Ps[i + 1], k), x: lerp(g.Xs[i], g.Xs[i + 1], k) };
}
