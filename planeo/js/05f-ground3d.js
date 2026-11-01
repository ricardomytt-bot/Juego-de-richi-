/* 05f · el suelo en 3D visto desde el cielo: bosques, aldeas, granjas, lagos y molinos instanciados.
   Los objetos crecen con la altitud para que se lean como un mundo en miniatura. Se generan por celdas, de forma determinista. */
'use strict';
const GP = { ok: false };
const CELL = 30, GP_NX = 21, GP_NZ = 13;
function hash3(a, b, c){ let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function biome(x, z){   // valor suave 0..1 que agrupa bosques / aldeas / campos
  return 0.5 + 0.30 * Math.sin(x * 0.0123 + 1.7 + Math.sin(z * 0.0049) * 1.6) + 0.22 * Math.sin(z * 0.0071 + x * 0.0042 + 0.4) + 0.12 * Math.sin(x * 0.034 - z * 0.025);
}
function riverX(z){ return 70 * Math.sin(z * 0.0033 + 0.6) + 34 * Math.sin(z * 0.0105 + 2.0) + 20; }

function gpMerge(parts){ return mergeParts(parts); }
function gpInst(geo, mat, n, outline){
  const m = new THREE.InstancedMesh(geo, mat, n); m.count = 0; m.frustumCulled = false; S3.add(m);
  let o = null; if (outline){ o = new THREE.InstancedMesh(geo, MAT.outl, n); o.count = 0; o.frustumCulled = false; S3.add(o); }
  return { m, o, n, k: 0 };
}
function groundPropsInit(){
  if (GP.ok || typeof THREE === 'undefined') return;
  const T = (g, c, p, s, r, f) => pt(g, c, p, s, r, { f });
  const CYL6 = gcache('gp_cyl6', () => new THREE.CylinderGeometry(0.5, 0.5, 1, 6)), CON7 = gcache('gp_con7', () => new THREE.ConeGeometry(0.5, 1, 7)), ICO0 = gcache('gp_lowsph', () => smoothG(new THREE.SphereGeometry(0.5, 8, 5)));
  // árbol redondo y pino (se tiñen con el color del mundo mediante instanceColor)
  const round = gpMerge([T(CYL6, 0x7a5235, [0, 0.9, 0], [0.5, 1.8, 0.5]), T(ICO0, 0xffffff, [0, 2.3, 0], [3.0, 2.6, 3.0], [0, 0.3, 0], true), T(ICO0, 0xe8ffe8, [0, 3.6, 0], [2.4, 2.2, 2.4], [0, 0.9, 0], true), T(ICO0, 0xd0ffd8, [0, 4.7, 0], [1.6, 1.6, 1.6], [0, 0.5, 0], true)]);
  const pine = gpMerge([T(CYL6, 0x6a4a30, [0, 0.8, 0], [0.45, 1.6, 0.45]), T(CON7, 0xffffff, [0, 2.5, 0], [3.0, 2.6, 3.0], [0, 0.3, 0], true), T(CON7, 0xeeffee, [0, 4.0, 0], [2.4, 2.4, 2.4], [0, 0.9, 0], true), T(CON7, 0xd8ffe0, [0, 5.4, 0], [1.6, 2.2, 1.6], [0, 0.5, 0], true)]);
  const houseGeo = (wall, roof) => gpMerge([T(GEO.box(), wall, [0, 1.1, 0], [3.4, 2.2, 3.0]), T(GEO.cone4(), roof, [0, 3.0, 0], [4.9, 1.9, 4.5], [0, Math.PI / 4, 0], true), T(GEO.box(), 0x7a5235, [1.0, 3.3, -0.4], [0.5, 1.0, 0.5]), T(GEO.box(), 0x6a4020, [0.6, 0.8, 1.52], [0.8, 1.5, 0.08]), pt(GEO.box(), 0xffd86b, [-0.9, 1.3, 1.52], [0.8, 0.8, 0.08], [0, 0, 0], { e: true })]);
  const barn = gpMerge([T(GEO.box(), 0xc9483a, [0, 1.5, 0], [4.6, 3.0, 5.6]), T(GEO.cone4(), 0x6a4a3a, [0, 4.0, 0], [6.4, 2.0, 7.4], [0, Math.PI / 4, 0], true), T(GEO.box(), 0xffffff, [0, 1.4, 2.82], [2.2, 2.4, 0.08]), T(GEO.box(), 0x8a2a20, [0, 1.4, 2.86], [0.18, 2.4, 0.06])]);
  const silo = gpMerge([T(CYL6, 0xd9dde8, [0, 2.4, 0], [1.9, 4.8, 1.9]), T(ICO0, 0x9aa3b8, [0, 4.9, 0], [1.9, 1.3, 1.9])]);
  const wm = gpMerge([T(CON7, 0xf2ead8, [0, 2.6, 0], [2.4, 5.2, 2.4], [0, 0, 0], true), T(CON7, 0xd9533f, [0, 5.7, 0], [2.7, 1.7, 2.7])]);
  const blades = gpMerge([0, 1, 2, 3].map(i => T(GEO.box(), 0xffffff, [Math.cos(i * Math.PI / 2) * 1.7, Math.sin(i * Math.PI / 2) * 1.7, 0], [i % 2 ? 0.7 : 3.4, i % 2 ? 3.4 : 0.7, 0.1])));
  const rock = gpMerge([T(ICO0, 0xaab2c4, [0, 0.4, 0], [2.4, 1.6, 2.2], [0, 0.4, 0], true), T(ICO0, 0xc4cada, [-0.5, 0.7, 0.4], [1.0, 0.7, 0.9], [0, 0, 0], true)]);
  const hay = gpMerge([T(CYL6, 0xe8c85a, [0, 0.7, 0], [1.4, 1.4, 1.4], [Math.PI / 2, 0, 0]), T(CYL6, 0xf0d878, [0, 0.7, 0.6], [1.0, 0.05, 1.0], [Math.PI / 2, 0, 0])]);
  const tree = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: LT.grad });
  GP.round = gpInst(round, tree, 1400, false); GP.pine = gpInst(pine, tree, 1400, false);
  GP.h1 = gpInst(houseGeo(0xf4dcae, 0xe0583f), MAT.toon, 400, true); GP.h2 = gpInst(houseGeo(0xf6e6c4, 0x4a79c9), MAT.toon, 400, true); GP.h3 = gpInst(houseGeo(0xf2d1b0, 0x8a5ad6), MAT.toon, 400, true);
  GP.barn = gpInst(barn, MAT.toon, 120, true); GP.silo = gpInst(silo, MAT.toon, 120, true); GP.wm = gpInst(wm, MAT.toon, 80, true); GP.blades = gpInst(blades, MAT.toon, 80, true);
  GP.rock = gpInst(rock, MAT.toon, 300, false); GP.hay = gpInst(hay, MAT.toon, 300, false);
  // lagos: discos planos con brillo
  GP.lakeMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uFogColor: { value: new THREE.Color() }, uFogNear: { value: 60 }, uFogFar: { value: 260 }, uDeep: { value: new THREE.Color(0x2f78c8) }, uShallow: { value: new THREE.Color(0x6cc0f0) } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime; uniform vec3 uFogColor, uDeep, uShallow; uniform float uFogNear, uFogFar; varying vec2 vUv; varying vec3 vW;
      void main(){ vec2 p = vUv - 0.5; float r = length(p) * 2.0; if (r > 1.0) discard; vec3 c = mix(uDeep, uShallow, smoothstep(0.0, 1.0, r));
        float sp = sin(uTime * 1.5 + vW.x * 0.6 + vW.z * 0.5) * sin(uTime * 1.1 + vW.x * 0.4 - vW.z * 0.7); c += vec3(0.28) * smoothstep(0.55, 0.95, sp);
        c = mix(c, vec3(0.93, 0.97, 1.0), smoothstep(0.86, 1.0, r) * 0.7);
        float d = length(vW - cameraPosition); c = mix(c, uFogColor, smoothstep(uFogNear, uFogFar, d)); gl_FragColor = vec4(c, 0.96 * smoothstep(1.0, 0.93, r)); }`
  });
  const lg = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2); lg.setAttribute('uv', new THREE.Float32BufferAttribute(Array.from({ length: lg.attributes.position.count * 2 }, (_, i) => 0), 2));
  { const pos = lg.attributes.position, uv = lg.attributes.uv; for (let i = 0; i < pos.count; i++){ uv.setXY(i, pos.getX(i) + 0.5, pos.getZ(i) + 0.5); } }
  GP.lake = new THREE.InstancedMesh(lg, GP.lakeMat, 60); GP.lake.count = 0; GP.lake.frustumCulled = false; GP.lake.renderOrder = 1; S3.add(GP.lake);
  GP.ok = true;
}
const _gm = typeof THREE !== 'undefined' ? { m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() } : null;
function gpPush(it, x, y, z, sc, ry, col){
  if (it.k >= it.n) return; const g = _gm;
  g.e.set(0, ry || 0, 0); g.q.setFromEuler(g.e); g.p.set(x, y, z); g.s.set(sc, sc, sc); g.m.compose(g.p, g.q, g.s);
  it.m.setMatrixAt(it.k, g.m); if (it.o) it.o.setMatrixAt(it.k, g.m);
  if (col !== undefined){ g.c.setHex(col); it.m.setColorAt(it.k, g.c); }
  it.k++;
}
function groundPropsSync(P, D3, drop2, t){
  if (!GP.ok) return;
  const all = [GP.round, GP.pine, GP.h1, GP.h2, GP.h3, GP.barn, GP.silo, GP.wm, GP.blades, GP.rock, GP.hay];
  all.forEach(i => { i.k = 0; }); let lk = 0;
  // los objetos del suelo solo se ven con calma si estamos bastante altos; crecen con la altitud
  const sK = 1 + Math.min(D3, 220) * 0.021, hK = clamp(1 - drop2 / 140, 0, 1);
  const camX = wxOf(G.x), cz0 = Math.floor((-P - 40) / CELL), cx0 = Math.floor((camX - CELL * GP_NX / 2) / CELL);
  const leaf = THEME.leaf && THEME.leaf[0] === '#' ? hex2rgb(THEME.leaf) : [63, 157, 90];
  const treeCols = [0, 1, 2, 3].map(i => { const k = [0.85, 1.0, 1.12, 0.95][i]; return ((clamp(leaf[0] * k, 0, 255) << 16) | (clamp(leaf[1] * k, 0, 255) << 8) | clamp(leaf[2] * k, 0, 255)); });
  const jy = (zAbs, lat) => -D3 + elevJS(zAbs, lat, hK);
  for (let iz = cz0 - GP_NZ; iz <= cz0 + 2; iz++){
    for (let ix = cx0; ix < cx0 + GP_NX; ix++){
      const cxw = (ix + 0.5) * CELL, czw = (iz + 0.5) * CELL;      // centro de la celda (mundo): z negativo = delante
      const zAbs = -czw; if (zAbs < P - 40 || zAbs > P + CELL * GP_NZ + 40) continue;
      if (Math.abs(cxw) < 10 + CELL * 0.35) continue;               // sin nada sobre la pista
      const rx = riverX(zAbs); if (Math.abs(cxw - rx) < 26) continue; // el río
      const b = biome(cxw, zAbs), r0 = hash3(ix, iz, 1), r1 = hash3(ix, iz, 2), r2 = hash3(ix, iz, 3);
      const lat = cxw / LW;
      if (b > 0.60){                                                  // BOSQUE
        const dens = (typeof Q !== 'undefined' && Q.low ? 0.5 : 1) * (Math.abs(zAbs - P) > 190 ? 0.55 : 1); const n = Math.max(2, Math.round((4 + Math.floor(r0 * 5)) * dens)), pineF = b > 0.74 || hash3(ix, iz, 9) > 0.62;
        for (let k = 0; k < n; k++){
          const ox = (hash3(ix, iz, 20 + k) - 0.5) * CELL * 0.94, oz = (hash3(ix, iz, 40 + k) - 0.5) * CELL * 0.94, x = cxw + ox, zl = czw + oz;
          if (Math.abs(x) < 10 || Math.abs(x - riverX(-zl)) < 14) continue;
          const sc = (0.75 + hash3(ix, iz, 60 + k) * 0.7) * sK, y = jy(-zl, x / LW);
          gpPush(pineF || hash3(ix, iz, 80 + k) > 0.55 ? GP.pine : GP.round, x, y, zl, sc, hash3(ix, iz, 100 + k) * 6.28, treeCols[Math.floor(hash3(ix, iz, 120 + k) * 4)]);
        }
        if (r1 > 0.8) gpPush(GP.rock, cxw + 6, jy(zAbs, lat), czw - 5, 1.2 * sK, r2 * 6);
      } else if (b > 0.31 && b < 0.43 && r0 > 0.25){                  // ALDEA
        const n = 3 + Math.floor(r1 * 4);
        for (let k = 0; k < n; k++){
          const a = k / n * 6.28 + r2 * 3, rad = 5 + hash3(ix, iz, 30 + k) * 6, x = cxw + Math.cos(a) * rad, zl = czw + Math.sin(a) * rad, y = jy(-zl, x / LW), ry = -a + 1.57 + (hash3(ix, iz, 50 + k) - 0.5) * 0.4;
          gpPush([GP.h1, GP.h2, GP.h3][Math.floor(hash3(ix, iz, 70 + k) * 3)], x, y, zl, 1.05 * sK, ry);
        }
        if (r2 > 0.6){ const y = jy(zAbs, lat); gpPush(GP.wm, cxw + 11, y, czw, 1.1 * sK, 0); const bl = GP.blades; if (bl.k < bl.n){ const g = _gm; g.e.set(0, 0, t * 0.9 + r1 * 6); g.q.setFromEuler(g.e); g.p.set(cxw + 11, y + 4.7 * 1.1 * sK, czw + 1.3 * 1.1 * sK); g.s.set(1.1 * sK, 1.1 * sK, 1.1 * sK); g.m.compose(g.p, g.q, g.s); bl.m.setMatrixAt(bl.k, g.m); bl.o.setMatrixAt(bl.k, g.m); bl.k++; } }
        if (r0 > 0.7){ gpPush(GP.round, cxw - 11, jy(zAbs, (cxw - 11) / LW), czw + 3, 0.9 * sK, 0, treeCols[1]); }
      } else if (b >= 0.43 && b <= 0.60 && r0 > 0.55){                // GRANJA
        const y = jy(zAbs, lat); gpPush(GP.barn, cxw, y, czw, 1.0 * sK, Math.floor(r1 * 4) * 1.57);
        gpPush(GP.silo, cxw + 5.5 * sK, y, czw - 2, 1.0 * sK, 0);
        for (let k = 0; k < 3; k++) gpPush(GP.hay, cxw - 8 + k * 3.2, jy(zAbs, (cxw - 8 + k * 3.2) / LW), czw + 7, 1.0 * sK, k);
      } else if (b < 0.22 && r0 > 0.45 && lk < GP.lake.count + 60){  // LAGO
        const rad = (11 + r1 * 10) * (0.9 + 0.04 * sK); const m = _gm.m; _gm.p.set(cxw, -D3 + elevJS(zAbs, lat, hK) + 0.1, czw); _gm.q.identity(); _gm.s.set(rad * 2, 1, rad * 1.5); m.compose(_gm.p, _gm.q, _gm.s); if (lk < 60) GP.lake.setMatrixAt(lk++, m);
      } else if (r0 > 0.82){ gpPush(GP.rock, cxw + (r1 - 0.5) * 14, jy(zAbs, lat), czw + (r2 - 0.5) * 14, (0.8 + r1) * sK, r2 * 6); }
    }
  }
  for (const it of all){ it.m.count = it.k; it.m.instanceMatrix.needsUpdate = true; if (it.m.instanceColor) it.m.instanceColor.needsUpdate = true; if (it.o){ it.o.count = it.k; it.o.instanceMatrix.needsUpdate = true; } }
  GP.lake.count = lk; GP.lake.instanceMatrix.needsUpdate = true;
  GP.lakeMat.uniforms.uTime.value = t; GP.lakeMat.uniforms.uFogColor.value.copy(S3.fog.color); GP.lakeMat.uniforms.uFogNear.value = S3.fog.near; GP.lakeMat.uniforms.uFogFar.value = S3.fog.far;
  const show = true; for (const it of all){ it.m.visible = show; if (it.o) it.o.visible = show; }
}
