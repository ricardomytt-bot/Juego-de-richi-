/* 05b · render 3D con Three.js: mismo mundo y misma lógica, ahora con cámara en perspectiva real, modelos con volumen,
   luces, niebla, colinas y contorno de dibujo animado. Si WebGL no está disponible se usa el render 2D de 05-render.js.
   Convención: x = lateral (carril*LW), y = arriba, z = -P (el avión avanza hacia -z). Los enemigos miran hacia +z (hacia la cámara). */
'use strict';
const LW = 2.4, HILLH = 7.0, PLAY_Y = 1.2;
const wxOf = lane => (lane - MID) * LW;
const D3of = P => dropOf(P) * 0.2885;                       // profundidad del suelo bajo el plano de juego (unidades del mundo)
const G3 = { ok: false };
let R3 = null, S3 = null, CAM3 = null, glCv = null;
let MAT = {}, SK = {}, GR = {}, TRK = {}, PL = {}, LT = {};
const _v3 = () => (typeof THREE !== 'undefined' ? new THREE.Vector3() : null);

/* ---------------------------------------------------------------- geometría barata: partes fusionadas con color por vértice */
const _gc = {};
const gcache = (k, f) => _gc[k] || (_gc[k] = f());
/* caja de esquinas redondeadas (radio r respecto a una caja unidad): sirve para bloques, cajas y casas "blanditos" */
function roundedBox(r, seg){
  const g = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg), p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), inn = new THREE.Vector3(), d = new THREE.Vector3(), h = 0.5 - r;
  for (let i = 0; i < p.count; i++){
    v.fromBufferAttribute(p, i); inn.set(clamp(v.x, -h, h), clamp(v.y, -h, h), clamp(v.z, -h, h)); d.copy(v).sub(inn);
    if (d.lengthSq() > 1e-9){ d.normalize(); v.copy(inn).addScaledVector(d, r); n.setXYZ(i, d.x, d.y, d.z); } p.setXYZ(i, v.x, v.y, v.z);
  }
  g.userData.smooth = true; return g;
}
const smoothG = g => { g.userData.smooth = true; return g; };
const GEO = {
  box: () => gcache('box', () => new THREE.BoxGeometry(1, 1, 1)),
  rbox: () => gcache('rbox', () => roundedBox(0.2, 5)),
  rboxS: () => gcache('rboxS', () => roundedBox(0.34, 6)),
  sph: () => gcache('sph', () => smoothG(new THREE.SphereGeometry(0.5, 22, 15))),
  sphM: () => gcache('sphM', () => smoothG(new THREE.SphereGeometry(0.5, 13, 9))),
  sphL: () => gcache('sphl', () => smoothG(new THREE.SphereGeometry(0.5, 10, 7))),
  cyl: () => gcache('cyl', () => new THREE.CylinderGeometry(0.5, 0.5, 1, 20)),
  cone: () => gcache('cone', () => new THREE.ConeGeometry(0.5, 1, 20)),
  cone4: () => gcache('cone4', () => new THREE.ConeGeometry(0.5, 1, 4)),
  cone6: () => gcache('cone6', () => new THREE.ConeGeometry(0.5, 1, 6)),
  ico: () => gcache('ico', () => smoothG(new THREE.SphereGeometry(0.5, 22, 15))),      // antes "icosaedro" facetado: ahora esfera suave
  ico0: () => gcache('ico0', () => smoothG(new THREE.SphereGeometry(0.5, 13, 9))),
  oct: () => gcache('oct', () => new THREE.OctahedronGeometry(0.5, 0)),
  dod: () => gcache('dod', () => smoothG(new THREE.SphereGeometry(0.5, 18, 12))),
  tor: () => gcache('tor', () => new THREE.TorusGeometry(0.5, 0.12, 12, 32)),
  circ: () => gcache('circ', () => new THREE.CircleGeometry(0.5, 32))
};
/* parte: geometría unitaria + color + posición + tamaño + rotación; e = emisiva (sin sombreado), f = sombreado plano */
function pt(geo, color, p, s, r, o){ return { geo, color, p: p || [0, 0, 0], s: s || [1, 1, 1], r: r || [0, 0, 0], e: !!(o && o.e), f: !!(o && o.f) }; }
function mergeParts(parts){
  const pos = [], nor = [], col = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), nm = new THREE.Matrix3();
  for (const p of parts){
    let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    e.set(p.r[0], p.r[1], p.r[2]); q.setFromEuler(e); m.compose(new THREE.Vector3(p.p[0], p.p[1], p.p[2]), q, new THREE.Vector3(p.s[0], p.s[1], p.s[2]));
    g.applyMatrix4(m); if ((p.f || p.geo.userData.flat) && !p.geo.userData.smooth) g.computeVertexNormals();
    c.set(p.color); if (typeof STYLE !== 'undefined' && STYLE.col) STYLE.col(c);
    const pa = g.attributes.position.array, na = g.attributes.normal.array;
    for (let i = 0; i < pa.length; i++){ pos.push(pa[i]); nor.push(na[i]); }
    for (let i = 0; i < pa.length / 3; i++) col.push(c.r, c.g, c.b);
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.computeBoundingBox(); return out;
}
/* construye un modelo: parte iluminada + parte emisiva + contorno de dibujo animado (casco invertido) */
const _bc = new Map();
function partSig(parts){ let k = ''; for (const p of parts) k += p.geo.uuid + p.color + p.p.join(',') + p.s.join(',') + p.r.join(',') + (p.e ? 'e' : '') + (p.f ? 'f' : '') + ';'; return k; }
function build(parts, o){
  o = o || {}; const key = partSig(parts) + (o.center === false ? 'N' : 'C');
  let c = _bc.get(key);
  if (!c){   // la geometría fusionada se calcula una sola vez y se comparte entre todas las copias del modelo
    const lit = parts.filter(p => !p.e), em = parts.filter(p => p.e);
    const gl = lit.length ? mergeParts(lit) : null, ge = em.length ? mergeParts(em) : null;
    const box = new THREE.Box3(); if (gl) box.union(gl.boundingBox); if (ge) box.union(ge.boundingBox);
    const cy = (box.min.y + box.max.y) / 2, hy = (box.max.y - box.min.y) / 2;
    if (o.center !== false){ if (gl) gl.translate(0, -cy, 0); if (ge) ge.translate(0, -cy, 0); }
    c = { gl, ge, hy: o.center === false ? 0 : hy }; _bc.set(key, c);
  }
  const grp = new THREE.Group();
  if (c.gl){ grp.add(new THREE.Mesh(c.gl, MAT.toon)); if (o.outline !== 0){ const ol = new THREE.Mesh(c.gl, MAT.outl); ol.scale.setScalar(1 + ((o.outline || 1.055) - 1) * 1.55); grp.add(ol); } }
  if (c.ge) grp.add(new THREE.Mesh(c.ge, MAT.emit));
  grp.userData.hy = c.hy; return grp;
}
function glowSprite(color, size, opacity){
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: LT.glowTex, color, transparent: true, opacity: opacity === undefined ? 0.8 : opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.set(size, size, 1); return s;
}

/* ---------------------------------------------------------------- texturas generadas con canvas 2D */
function canvasTex(w, h, draw, repeat){
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 4; return t;
}
function makeTextures(){
  LT.glowTex = canvasTex(64, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  // estelas de viento (corrientes de aire)
  LT.windTex = canvasTex(128, 256, (c, w, h) => { c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(0, 0, w, h); c.lineCap = 'round';
    for (let i = 0; i < 6; i++){ const x = 14 + i * 20 + (i % 2) * 5, y = (i * 83) % 200, l = 40 + (i * 37) % 70; const g = c.createLinearGradient(0, y, 0, y + l); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = g; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + l); c.stroke(); } });
  LT.arrowTex = canvasTex(128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(w / 2, 40); c.lineTo(w / 2 + 34, 110); c.lineTo(w / 2, 90); c.lineTo(w / 2 - 34, 110); c.closePath(); c.fill(); });
  LT.dashTex = canvasTex(32, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(8, 8, 16, 56); });
  LT.exTex = canvasTex(64, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '800 54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', w / 2, h / 2 + 3); });
  const grad = new THREE.DataTexture(new Uint8Array([105, 165, 235, 255]), 4, 1, THREE.RedFormat); grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true; LT.grad = grad;
}

/* ---------------------------------------------------------------- inicialización */
function g3Init(){
  if (typeof THREE === 'undefined') return false;
  try {
    THREE.ColorManagement.enabled = false;
    glCv = document.getElementById('g3');
    R3 = new THREE.WebGLRenderer({ canvas: glCv, antialias: true, alpha: false, powerPreference: 'high-performance' });
    R3.outputColorSpace = THREE.LinearSRGBColorSpace; R3.useLegacyLights = true; R3.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    S3 = new THREE.Scene(); S3.fog = new THREE.Fog(0xffffff, 60, 260);
    CAM3 = new THREE.PerspectiveCamera(62, 1, 0.3, 1400);
    makeTextures();
    MAT.toon = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: LT.grad });
    MAT.emit = new THREE.MeshBasicMaterial({ vertexColors: true });
    MAT.outl = new THREE.MeshBasicMaterial({ color: 0x10122f, side: THREE.BackSide });
    LT.hemi = new THREE.HemisphereLight(0xffffff, 0x88aa88, 0.9); S3.add(LT.hemi); S3.add(new THREE.AmbientLight(0xffffff, 0.12));
    LT.sun = new THREE.DirectionalLight(0xffffff, 1.0); LT.sun.position.set(-30, 60, 25); S3.add(LT.sun); S3.add(LT.sun.target);
    buildSky(); buildGround(); buildTrack(); if (typeof setModelStyle === 'function') setModelStyle(window.PLANEO_STYLE || 'A', true); else buildPools(); buildPlayer();
    postInit(); g3Resize(); return true;
  } catch (e){ console.warn('3D no disponible:', e); return false; }
}
function g3Resize(){
  if (!R3) return; if (typeof Q !== 'undefined' && Q.low) R3.setPixelRatio(1); R3.setSize(W, H, false); glCv.style.width = W + 'px'; glCv.style.height = H + 'px';
  CAM3.aspect = W / H; CAM3.fov = H > W ? 70 : 60; CAM3.updateProjectionMatrix();
}

/* ---------------------------------------------------------------- cielo (cúpula con degradado, sol y estrellas) + cordillera */
function buildSky(){
  SK.mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0.5, 0.3, -0.8).normalize() }, uSunCol: { value: new THREE.Color() }, uStars: { value: 0 }, uSunAmt: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uTop, uBot, uSunDir, uSunCol; uniform float uStars, uSunAmt, uTime; varying vec3 vDir;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main(){ vec3 d = normalize(vDir); float t = clamp(d.y * 1.7 + 0.04, 0.0, 1.0);
        vec3 col = mix(uBot, uTop, pow(t, 0.75)); if (d.y < 0.0) col = uBot;
        float sd = max(dot(d, uSunDir), 0.0); col += uSunCol * (pow(sd, 700.0) * 1.6 + pow(sd, 16.0) * 0.30 + pow(sd, 3.0) * 0.07) * uSunAmt;
        vec3 sp = d * 220.0, cl = floor(sp), fr = fract(sp) - 0.5; float hs = h(cl); if (hs > 0.985 && d.y > 0.06) col += vec3(1.0) * uStars * smoothstep(0.34, 0.05, length(fr)) * (0.5 + 0.5 * sin(uTime * 2.0 + hs * 90.0));
        gl_FragColor = vec4(col, 1.0); }`
  });
  SK.dome = new THREE.Mesh(new THREE.SphereGeometry(900, 28, 18), SK.mat); SK.dome.renderOrder = -10; SK.dome.frustumCulled = false; S3.add(SK.dome);
  // cordillera lejana con cumbres nevadas (no recibe niebla: se tiñe a mano como en el render 2D)
  SK.mount = new THREE.Group(); SK.mmat = new THREE.MeshBasicMaterial({ color: 0x9aaad0, fog: false }); SK.smat = new THREE.MeshBasicMaterial({ color: 0xf6f9ff, fog: false });
  for (let i = 0; i < 26; i++){
    const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.07, r = 640 + (i % 4) * 30, hgt = 70 + ((i * 53) % 95), wd = 70 + ((i * 29) % 60);
    const m = new THREE.Mesh(new THREE.ConeGeometry(wd, hgt, 6 + (i % 2)), SK.mmat); m.position.set(Math.cos(a) * r, hgt / 2 - 14, Math.sin(a) * r); SK.mount.add(m);
    const sc = new THREE.Mesh(new THREE.ConeGeometry(wd * 0.36, hgt * 0.34, 6 + (i % 2)), SK.smat); sc.position.set(m.position.x, hgt * 0.83 - 14, m.position.z); SK.mount.add(sc);
  }
  SK.mount.traverse(o => { o.frustumCulled = false; }); S3.add(SK.mount);
}

/* ---------------------------------------------------------------- suelo: campos, lagos, colinas con nieve y mar de nubes (shader) */
const GLSL_NOISE = `float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }`;
function buildGround(){
  const LW_ = LW.toFixed(2), HH = HILLH.toFixed(1);
  GR.mat = new THREE.ShaderMaterial({
    fog: false, side: THREE.DoubleSide,
    uniforms: { uPatch: { value: 1 }, uCover: { value: 0 }, uHill: { value: 1 }, uGrass: { value: new THREE.Color() }, uLand: { value: Array.from({ length: 8 }, () => new THREE.Color()) }, uSea: { value: Array.from({ length: 5 }, () => new THREE.Color()) },
      uFogColor: { value: new THREE.Color() }, uFogNear: { value: 60 }, uFogFar: { value: 260 }, uTime: { value: 0 }, uSun: { value: new THREE.Vector3(-0.4, 0.8, 0.3).normalize() }, uSkyBot: { value: new THREE.Color() } },
    vertexShader: `uniform float uHill; varying vec3 vW; varying float vE;
      float elev(float lat, float z){ float a = abs(lat); float amp = smoothstep(0.0, 1.0, clamp((a - 2.6) / 3.2, 0.0, 1.0));
        float n = 0.5 + 0.28 * sin(z * 0.019 + lat * 0.8) + 0.22 * sin(z * 0.047 - lat * 1.7 + 1.3); return amp * n * ${HH} * uHill; }
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); float e = elev(w.x / ${LW_}, -w.z); w.y += e; vE = e; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uPatch, uCover, uTime; uniform vec3 uGrass, uFogColor, uSun, uSkyBot; uniform vec3 uLand[8]; uniform vec3 uSea[5]; uniform float uFogNear, uFogFar; varying vec3 vW; varying float vE;
      ${GLSL_NOISE}
      void main(){
        float lat = vW.x / ${LW_}, zA = -vW.z;
        // regiones de campo con bordes curvos: ruido deformado y colores mezclados con suavidad (nada de baldosas)
        vec2 q = vec2(vW.x, zA) * 0.0125; vec2 wp = vec2(fbm(q * 1.7 + 3.1), fbm(q * 1.7 + 9.4)); float rg = fbm(q + wp * 1.35);
        float rf = rg * 7.0; int i0 = int(floor(rf)); float fk = smoothstep(0.30, 0.70, fract(rf));
        vec3 c0 = uLand[int(mod(float(i0), 8.0))], c1 = uLand[int(mod(float(i0 + 1), 8.0))]; vec3 rc = mix(c0, c1, fk);
        float fine = fbm(vec2(vW.x, zA) * 0.17); float fine2 = vnoise(vec2(vW.x, zA) * 0.9);
        vec3 m = mix(uGrass, rc, uPatch); m *= 0.93 + 0.14 * fine + 0.05 * (fine2 - 0.5);
        float cropMask = smoothstep(0.55, 0.75, fbm(q * 2.3 + 17.0)) * step(0.3, uPatch);
        float rowsA = sin((vW.x * 0.8 + vW.z * 0.25) * 2.2) * 0.5 + 0.5; m = mix(m, m * (0.9 + 0.16 * rowsA), cropMask * 0.8);   // surcos de cultivo suaves
        float stripe = 1.0 + 0.025 * sin(zA * 0.31); float road = (abs(lat) < 1.6 && uPatch < 0.7) ? 1.05 : 1.0; float hv = rg;
        bool lake = false;
        if (lake){ m = vec3(0.30, 0.59, 0.86); float sp = sin(uTime * 1.6 + vW.x * 2.1 + vW.z * 1.7) * sin(uTime * 1.1 + vW.x * 1.3 - vW.z * 2.3); m += vec3(0.25) * smoothstep(0.55, 0.95, sp); }
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); if (n.y < 0.0) n = -n; float lit = 0.62 + 0.5 * max(dot(n, uSun), 0.0);
        float sn = clamp((vE / ${HH} - 0.5) * 3.0, 0.0, 1.0); m = mix(m, vec3(0.93, 0.95, 0.99), sn * 0.85);
        // río serpenteante
        float rz = zA; float rx = 70.0 * sin(rz * 0.0033 + 0.6) + 34.0 * sin(rz * 0.0105 + 2.0) + 20.0; float dr = abs(vW.x - rx);
        if (uPatch > 0.25){ float bank = smoothstep(26.0, 17.0, dr); m = mix(m, vec3(0.78, 0.7, 0.5), smoothstep(22.0, 15.0, dr) * 0.8); float water = smoothstep(14.5, 11.0, dr);
          vec3 wc = mix(vec3(0.27, 0.58, 0.88), vec3(0.45, 0.78, 0.97), smoothstep(0.0, 14.0, dr)); float fl = sin(uTime * 2.0 + vW.z * 0.5 + vW.x * 0.2) * 0.5 + 0.5; wc += vec3(0.14) * smoothstep(0.78, 1.0, fl);
          m = mix(m, wc, water); }
        vec3 col = m * stripe * road * lit;
        // mar de nubes
        if (uCover > 0.0){ float nz = fbm(vW.xz * 0.05 + vec2(uTime * 0.01, 0.0)); float c = smoothstep(0.40, 0.62, nz + uCover * 0.30 - 0.20);
          vec3 cc = uSea[int(floor(hash(floor(vW.xz * 0.05) ) * 5.0))]; float sh = 0.78 + 0.32 * fbm(vW.xz * 0.11 + 3.1); cc = mix(cc * 0.82, cc, sh);
          col = mix(col, cc, c * min(1.0, uCover * 1.15)); }
        float d = length(vW - cameraPosition); float f = smoothstep(uFogNear, uFogFar, d); col = mix(col, uFogColor, f);
        gl_FragColor = vec4(col, 1.0); }`
  });
  GR.mesh = new THREE.Mesh(new THREE.PlaneGeometry(520, 600, 96, 112).rotateX(-Math.PI / 2), GR.mat); GR.mesh.frustumCulled = false; S3.add(GR.mesh);
  GR.matFar = GR.mat.clone(); GR.matFar.uniforms = Object.assign({}, GR.mat.uniforms, { uHill: { value: 0 } });   // comparte todo menos el relieve
  GR.far = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 1, 1).rotateX(-Math.PI / 2), GR.matFar); GR.far.frustumCulled = false; S3.add(GR.far);
}

/* ---------------------------------------------------------------- pista: cintas de luz en el cielo / carretera en tierra */
function strip(w, len, mat, y){ const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len).rotateX(-Math.PI / 2), mat); m.position.y = y; m.renderOrder = 2; m.frustumCulled = false; return m; }
function tmat(tex, color, opacity, blend){ const m = new THREE.MeshBasicMaterial({ map: tex || null, color, transparent: true, opacity, depthWrite: false, blending: blend || THREE.NormalBlending, fog: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); return m; }
function buildTrack(){
  const LEN = 440, ZC = -LEN / 2 + 30;
  TRK.air = new THREE.Group(); TRK.road = new THREE.Group(); TRK.mats = { air: [], road: [] };
  const add = (grp, kind, mesh, m, base) => { mesh.position.z = ZC; grp.add(mesh); TRK.mats[kind].push({ m, base }); return mesh; };
  // --- aire
  TRK.windTexs = [];
  for (let i = 0; i < LANES; i++){
    const tex = LT.windTex.clone(); tex.needsUpdate = true; tex.repeat.set(1, LEN / 34); TRK.windTexs.push(tex);
    const baseCol = i % 2 ? 0x3a62ee : 0xffffff;
    const m1 = tmat(null, baseCol, 0.20); add(TRK.air, 'air', strip(LW, LEN, m1, 0.03), m1, 0.20).position.x = (i - MID) * LW;
    const m2 = tmat(tex, 0xffffff, 0.8); add(TRK.air, 'air', strip(LW * 0.9, LEN, m2, 0.05), m2, 0.8).position.x = (i - MID) * LW;
  }
  TRK.railMat = tmat(null, 0x78d7ff, 0.5, THREE.AdditiveBlending);
  TRK.dashTexs = [];
  for (const sg of [-1, 1]){
    const x = sg * LANES / 2 * LW;
    add(TRK.air, 'air', strip(0.7, LEN, TRK.railMat, 0.04), TRK.railMat, 0.5).position.x = x;
    const mc = tmat(null, 0xffffff, 0.95); add(TRK.air, 'air', strip(0.1, LEN, mc, 0.06), mc, 0.95).position.x = x;
  }
  for (let i = 1; i < LANES; i++){
    const tex = LT.dashTex.clone(); tex.needsUpdate = true; tex.repeat.set(1, LEN / 8); TRK.dashTexs.push(tex);
    const m = tmat(tex, 0xcfeaff, 0.95); add(TRK.air, 'air', strip(0.18, LEN, m, 0.06), m, 0.95).position.x = (i - MID - 0.5) * LW;
  }
  // --- carretera
  const base = tmat(null, 0x0e1646, 0.55); add(TRK.road, 'road', strip(LANES * LW + 0.6, LEN, base, 0.02), base, 0.55);
  TRK.arrowTexs = [];
  for (let i = 0; i < LANES; i++){
    const mA = tmat(null, i % 2 ? 0x78aaff : 0xffffff, i % 2 ? 0.12 : 0.16); add(TRK.road, 'road', strip(LW, LEN, mA, 0.03), mA, i % 2 ? 0.12 : 0.16).position.x = (i - MID) * LW;
    const tex = LT.arrowTex.clone(); tex.needsUpdate = true; tex.repeat.set(1, LEN / 14); TRK.arrowTexs.push(tex);
    const mT = tmat(tex, 0xffffff, 0.8); add(TRK.road, 'road', strip(LW * 0.9, LEN, mT, 0.05), mT, 0.8).position.x = (i - MID) * LW;
  }
  for (const sg of [-1, 1]){
    const x = sg * LANES / 2 * LW;
    const mg = tmat(null, 0xffaa28, 0.35); add(TRK.road, 'road', strip(0.9, LEN, mg, 0.03), mg, 0.35).position.x = x;
    const my = tmat(null, 0xffc440, 1); add(TRK.road, 'road', strip(0.34, LEN, my, 0.06), my, 1).position.x = x;
    const mw = tmat(null, 0xffffff, 1); add(TRK.road, 'road', strip(0.13, LEN, mw, 0.07), mw, 1).position.x = x;
  }
  TRK.rdash = [];
  for (let i = 1; i < LANES; i++){ const tex = LT.dashTex.clone(); tex.needsUpdate = true; tex.repeat.set(1, LEN / 8); TRK.rdash.push(tex); const m = tmat(tex, 0xffffff, 1); add(TRK.road, 'road', strip(0.22, LEN, m, 0.07), m, 1).position.x = (i - MID - 0.5) * LW; }
  // postes con luz junto a la carretera
  const postGeo = mergeParts([pt(GEO.cyl(), 0xffffff, [0, 0.7, 0], [0.12, 1.4, 0.12]), pt(GEO.sph(), 0xffd070, [0, 1.5, 0], [0.4, 0.4, 0.4], [0, 0, 0], { e: true })]);
  TRK.posts = new THREE.InstancedMesh(postGeo, new THREE.MeshBasicMaterial({ vertexColors: true }), 2 * 22); TRK.posts.frustumCulled = false; TRK.road.add(TRK.posts);
  S3.add(TRK.air); S3.add(TRK.road);
}
function updateTrack(P, air){
  TRK.air.visible = air > 0.01; TRK.road.visible = air < 0.99;
  const set = (list, k) => list.forEach(o => { o.m.opacity = o.base * k; });
  set(TRK.mats.air, air); set(TRK.mats.road, 1 - air);
  const rc = THEME.rail || [120, 215, 255]; TRK.railMat.color.setRGB(rc[0] / 255, rc[1] / 255, rc[2] / 255);
  TRK.air.position.z = TRK.road.position.z = -P;
  TRK.windTexs.forEach((t, i) => { t.offset.y = (P * (0.8 + (i % 3) * 0.12) / 34) % 1; });
  TRK.dashTexs.forEach(t => { t.offset.y = (P / 8) % 1; });
  TRK.arrowTexs.forEach(t => { t.offset.y = (P / 14) % 1; }); TRK.rdash.forEach(t => { t.offset.y = (P / 8) % 1; });
  if (TRK.road.visible){
    const m = new THREE.Matrix4(); let k = 0; const pp = 22, off = P % pp;
    for (let i = 0; i < 22; i++){ const zl = off + 30 - i * pp; for (const sg of [-1, 1]){ m.makeTranslation(sg * (LANES / 2 * LW + 0.7), 0, zl); TRK.posts.setMatrixAt(k++, m); } }
    TRK.posts.instanceMatrix.needsUpdate = true;
  }
}

/* ---------------------------------------------------------------- el avioncito con la ardilla (3D) */
const hexN = h => parseInt(String(h).replace('#', ''), 16);
function buildPlaneModel(skinOrColor, ghost, noPilot){
  const sk = typeof skinOrColor === 'object' ? skinOrColor : null;
  const RED = sk ? hexN(sk.plane) : skinOrColor, DK = new THREE.Color(RED).multiplyScalar(0.68).getHex(), CREAM = hexN(sk ? sk.belly : '#fff3d6');
  const FUR = hexN(sk ? sk.fur : '#d28a3e'), FURD = hexN(sk ? sk.furD : '#b8742f'), BR = hexN(sk ? sk.hat : '#6b4128'), SCARF = hexN(sk ? sk.scarf : '#ffd23f'), acc = sk ? sk.acc : 'goggles';
  const head = [
    pt(GEO.sph(), FURD, [0, 0.6, 0.15], [0.85, 0.85, 0.95]),                                 // cuerpo de la ardilla
    pt(GEO.sph(), FUR, [0, 1.18, 0.05], [0.92, 0.9, 0.9]),                                   // cabeza
    pt(GEO.cone(), FUR, [-0.38, 1.62, 0.12], [0.22, 0.4, 0.2], [0, 0, 0.3]), pt(GEO.cone(), FUR, [0.38, 1.62, 0.12], [0.22, 0.4, 0.2], [0, 0, -0.3])   // orejas
  ];
  if (acc === 'goggles' || acc === 'welder' || acc === 'captain'){
    head.push(pt(GEO.sph(), BR, [0, 1.38, 0.06], [0.98, acc === 'captain' ? 0.7 : 0.62, 0.98]));           // gorro
    if (acc === 'captain'){ head.push(pt(GEO.cyl(), 0x10183e, [0, 1.26, -0.3], [1.0, 0.07, 0.6]), pt(GEO.box(), 0xffd23f, [0, 1.3, 0.05], [1.02, 0.1, 1.02]), pt(GEO.sph(), 0xffd23f, [0, 1.52, -0.34], [0.2, 0.2, 0.1], [0, 0, 0], { e: true })); }
    else { head.push(pt(GEO.cyl(), acc === 'welder' ? 0xff9a3a : 0x2b2b3a, [0, 1.2, 0.05], [0.99, 0.12, 0.99])); }
    if (acc === 'goggles') head.push(pt(GEO.sph(), 0x9fe7ff, [-0.2, 1.56, -0.12], [0.3, 0.3, 0.3]), pt(GEO.sph(), 0x9fe7ff, [0.2, 1.56, -0.12], [0.3, 0.3, 0.3]));
    if (acc === 'welder') head.push(pt(GEO.tor(), 0xc9c6d4, [-0.2, 1.62, -0.18], [0.5, 0.5, 0.5], [0.5, 0, 0]), pt(GEO.tor(), 0xc9c6d4, [0.2, 1.62, -0.18], [0.5, 0.5, 0.5], [0.5, 0, 0]), pt(GEO.sph(), 0x2a3a4a, [-0.2, 1.62, -0.2], [0.26, 0.26, 0.1]), pt(GEO.sph(), 0x2a3a4a, [0.2, 1.62, -0.2], [0.26, 0.26, 0.1]));
  } else if (acc === 'bow'){
    head.push(pt(GEO.sph(), FUR, [0, 1.42, 0.06], [0.98, 0.5, 0.98]), pt(GEO.cone(), BR, [0.52, 1.72, -0.05], [0.4, 0.5, 0.2], [0, 0, -1.2]), pt(GEO.cone(), BR, [0.12, 1.78, -0.05], [0.4, 0.5, 0.2], [0, 0, 1.2]), pt(GEO.sph(), BR, [0.32, 1.72, -0.05], [0.22, 0.22, 0.2]),
      pt(GEO.sph(), 0x9fe7ff, [-0.2, 1.5, -0.14], [0.22, 0.22, 0.22]), pt(GEO.sph(), 0x9fe7ff, [0.0, 1.5, -0.14], [0.22, 0.22, 0.22]));
  } else {   // glasses (abuelo): boina y gafas redondas
    head.push(pt(GEO.sph(), BR, [0, 1.45, 0.02], [1.0, 0.5, 1.0]), pt(GEO.sph(), 0xffffff, [0, 1.12, -0.58], [0.6, 0.14, 0.2]), pt(GEO.tor(), 0x6b6b78, [-0.21, 1.22, -0.5], [0.42, 0.42, 0.42], [0, 0, 0]), pt(GEO.tor(), 0x6b6b78, [0.21, 1.22, -0.5], [0.42, 0.42, 0.42], [0, 0, 0]));
  }
  const parts = [
    pt(GEO.cyl(), RED, [0, 0, 0.1], [0.9, 3.2, 0.9], [Math.PI / 2, 0, 0]),                   // fuselaje
    pt(GEO.cone(), DK, [0, 0, -1.95], [0.9, 0.8, 0.9], [-Math.PI / 2, 0, 0]),               // morro
    pt(GEO.box(), RED, [0, 0.28, -0.15], [4.0, 0.14, 1.25]),                                 // ala
    pt(GEO.box(), CREAM, [1.75, 0.285, -0.15], [0.55, 0.15, 1.27]), pt(GEO.box(), CREAM, [-1.75, 0.285, -0.15], [0.55, 0.15, 1.27]),
    pt(GEO.box(), DK, [0, 0.2, -0.15], [4.02, 0.05, 1.22]),
    pt(GEO.box(), RED, [0, 0.12, 1.65], [1.8, 0.1, 0.6]), pt(GEO.box(), RED, [0, 0.58, 1.6], [0.1, 0.85, 0.65]),   // cola
    pt(GEO.box(), DK, [0, 0.12, 1.58], [0.14, 0.14, 1.1]),
    ...(noPilot ? [pt(GEO.rbox(), 0x3a2a3a, [0, 0.62, 0.25], [0.9, 0.5, 1.1]), pt(GEO.rbox(), 0x6a4a52, [0, 0.9, 0.55], [0.8, 0.5, 0.3]), pt(GEO.tor(), 0x2b2b3a, [0, 0.78, -0.55], [1.0, 1.0, 1.0], [Math.PI / 2, 0, 0])] : head),
    ...(noPilot ? [] : [pt(GEO.sph(), FURD, [0.28, 0.45, 0.85], [0.6, 0.6, 0.7]), pt(GEO.sph(), FUR, [0.52, 0.6, 1.2], [0.72, 0.78, 0.85]), pt(GEO.sph(), FURD, [0.78, 0.82, 1.5], [0.82, 0.9, 0.95]), pt(GEO.sph(), CREAM, [0.98, 1.0, 1.72], [0.6, 0.62, 0.62])]),   // cola esponjosa
    pt(GEO.sph(), 0xff5a5a, [-1.98, 0.3, -0.15], [0.2, 0.2, 0.2], [0, 0, 0], { e: true }), pt(GEO.sph(), 0x5aff8a, [1.98, 0.3, -0.15], [0.2, 0.2, 0.2], [0, 0, 0], { e: true })   // luces de navegación
  ];
  const grp = build(parts, { center: false, outline: ghost ? 0 : 1.04 });
  const prop = build([pt(GEO.box(), 0x5a3a24, [0, 0, 0], [2.1, 0.16, 0.06]), pt(GEO.box(), 0x5a3a24, [0, 0, 0], [0.16, 2.1, 0.06]), pt(GEO.sph(), 0xffd23f, [0, 0, -0.05], [0.28, 0.28, 0.28])], { center: false, outline: 0 });
  prop.position.set(0, 0, -2.35); grp.add(prop);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.05, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); disc.position.set(0, 0, -2.37); grp.add(disc);
  const scarf = build([pt(GEO.box(), SCARF, [0, 0, 0.45], [0.2, 0.06, 0.95]), pt(GEO.box(), SCARF, [0.22, 0, 0.35], [0.18, 0.06, 0.75])], { center: false, outline: 0 });
  scarf.position.set(-0.1, 0.9, 0.4); if (!noPilot) grp.add(scarf);
  if (sk && sk.shine){ const gl = glowSprite(0xffd860, 9, 0.35); gl.position.set(0, 0.7, 0.2); grp.add(gl); }
  if (ghost){ grp.traverse(o => { if (o.material && o.isMesh){ o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.5; o.material.depthWrite = false; } }); }
  grp.userData.prop = prop; grp.userData.scarf = scarf; return grp;
}
function buildPlayer(){
  PL.root = new THREE.Group(); PL.plane = buildPlaneModel(curSkin(), false); PL.root.add(PL.plane);
  PL.shield = new THREE.Mesh(new THREE.SphereGeometry(2.7, 20, 14), new THREE.MeshBasicMaterial({ color: 0x78d7ff, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })); PL.shield.position.set(0, 0.7, 0); PL.shield.visible = false; PL.root.add(PL.shield);
  PL.rings = []; for (let i = 0; i < 3; i++){ const r = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * 0.3, 0.07, 6, 36), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); r.position.set(0, 0.6, 0); r.visible = false; PL.root.add(r); PL.rings.push(r); }
  PL.mag = []; for (let i = 0; i < 3; i++){ const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 36), new THREE.MeshBasicMaterial({ color: 0xff7a7a, transparent: true, opacity: 0.6, depthWrite: false })); r.position.set(0, 0.6, 0); r.visible = false; PL.root.add(r); PL.mag.push(r); }
  PL.glow = glowSprite(0xffe36b, 9, 0.7); PL.glow.position.set(0, 0.6, 0); PL.glow.visible = false; PL.root.add(PL.glow);
  PL.shadow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x142a1e, transparent: true, opacity: 0.3, depthWrite: false })); PL.shadow.renderOrder = 1; S3.add(PL.shadow);
  PL.cx = 0; S3.add(PL.root);
}
function buildPools(){ if (typeof initModels === 'function') initModels(); if (typeof initModelsPlus === 'function') initModelsPlus(); if (typeof groundPropsInit === 'function') groundPropsInit(); }

/* ---------------------------------------------------------------- un fotograma: sincroniza el mundo y dibuja */
function g3Project(x, y, z){ const v = new THREE.Vector3(x, y, z).project(CAM3); return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H }; }
function g3Frame(dt){
  const P = G.P, a = altFrac(P), sky = skyAt(a), drop2 = dropOf(P), D3 = D3of(P), air = clamp(drop2 / 70, 0, 1), t = G.tAnim;
  const rgb3 = (c, k) => [c[0] / 255 * (k || 1), c[1] / 255 * (k || 1), c[2] / 255 * (k || 1)];
  // --- cielo, niebla y luces
  const top = rgb3(sky.top), bot = rgb3(sky.bot);
  SK.mat.uniforms.uTop.value.setRGB(...top); SK.mat.uniforms.uBot.value.setRGB(...bot);
  const su = clamp((0.88 - a) / 0.6, 0, 1), sunOn = THEME.hasSun && a < 0.9 && a > 0.03;
  const sdir = new THREE.Vector3(0.45, lerp(0.03, 0.55, smooth(su)), -0.85).normalize();
  SK.mat.uniforms.uSunDir.value.copy(sdir); const sc = mix(THEME.sunWarm, THEME.sun, su); SK.mat.uniforms.uSunCol.value.setRGB(...rgb3(sc)); SK.mat.uniforms.uSunAmt.value = sunOn ? 1 : 0;
  SK.mat.uniforms.uStars.value = clamp((a - THEME.stars) / 0.3, 0, 1); SK.mat.uniforms.uTime.value = t;
  S3.fog.color.setRGB(...bot); S3.fog.near = lerp(50, 80, air); S3.fog.far = lerp(235, 340, air);
  LT.hemi.color.setRGB(...rgb3(mix(sky.top, [255, 255, 255], 0.55))); LT.hemi.groundColor.setRGB(...rgb3(mix(THEME.grass, sky.bot, 0.35), 0.8)); LT.hemi.intensity = lerp(0.62, 0.55, air);
  LT.sun.color.setRGB(...rgb3(mix(sc, [255, 255, 255], 0.4))); LT.sun.intensity = THEME.hasSun ? lerp(0.62, 0.82, su) : 0.55;
  LT.sun.position.set(-sdir.x * 60 * -1, 40 + sdir.y * 60, 35).add(new THREE.Vector3(wxOf(G.x), 0, -P)); LT.sun.target.position.set(wxOf(G.x), 0, -P);
  // --- suelo
  const U = GR.mat.uniforms; U.uPatch.value = clamp(drop2 / 180, 0, 1); U.uCover.value = clamp((a - 0.55) / 0.25, 0, 1); U.uHill.value = clamp(1 - drop2 / 140, 0, 1); U.uTime.value = t;
  if (!THEME._lrgb) THEME._lrgb = THEME.land.map(hex2rgb);
  U.uGrass.value.setRGB(...rgb3(THEME.grass)); THEME._lrgb.forEach((c, i) => U.uLand.value[i].setRGB(...rgb3(c)));
  THEME.sea.forEach((h, i) => { const c = hex2rgb(h); U.uSea.value[i].setRGB(...rgb3(c)); });
  U.uFogColor.value.setRGB(...bot); U.uFogNear.value = S3.fog.near; U.uFogFar.value = S3.fog.far; U.uSun.value.set(-0.35, 0.85, 0.4).normalize();
  GR.mesh.position.set(0, -D3, Math.floor((-P - 240) / 4) * 4); GR.far.position.set(0, -D3 - 0.45, -P - 800);
  // --- cordillera
  const hill = clamp((0.62 - a) / 0.5, 0, 1); SK.mount.visible = hill > 0.02;
  SK.mmat.color.setRGB(...rgb3(mix(sky.bot, [150, 168, 212], 0.55))); SK.mmat.color.lerp(SK.mat.uniforms.uBot.value, 0.0);
  // --- pista
  updateTrack(P, air);
  // --- avión
  const px = wxOf(G.x), dv = diving() ? 1 : braking() ? -0.4 : 0;
  PL.cx += (px - PL.cx) * Math.min(1, dt * 9);
  PL.root.position.set(px, PLAY_Y - (G.fallT > 0 ? (1.6 - G.fallT) * 7 : 0), -P);
  const ascK = (LV.asc && P - LV.base < LV.asc) ? Math.max(0, 1 - (P - LV.base) / LV.asc) : 0;   // morro hacia arriba mientras sube
  PL.root.rotation.set(0.1 * dv + 0.34 * ascK + (G.fallT > 0 ? (1.6 - G.fallT) * 1.2 : 0), 0, -G.bank * 0.5 + (G.fallT > 0 ? (1.6 - G.fallT) * 3 : 0));
  PL.plane.userData.prop.rotation.z = t * 42; PL.plane.userData.scarf.rotation.y = Math.sin(t * 9) * 0.35; PL.plane.userData.scarf.rotation.x = Math.sin(t * 7) * 0.1;
  PL.root.visible = !(G.inv > 0 && Math.floor(t * 14) % 2 === 0 && G.fallT <= 0);
  PL.shield.visible = !!G.shield; if (G.shield){ PL.shield.material.opacity = 0.17 + 0.06 * Math.sin(t * 6); PL.shield.scale.setScalar(1 + 0.02 * Math.sin(t * 8)); }
  PL.rings.forEach((r, i) => { r.visible = G.starT > 0; if (r.visible){ r.material.color.setHSL(((t * 0.7) + i * 0.3) % 1, 0.95, 0.62); r.rotation.x = Math.PI / 2; r.scale.setScalar(1 + 0.08 * Math.sin(t * 9 + i)); } });
  PL.glow.visible = G.starT > 0; PL.mag.forEach((r, i) => { r.visible = G.magT > 0; if (r.visible){ const k = (t * 1.1 + i / 3) % 1; r.scale.setScalar(1.8 + k * 3.2); r.material.opacity = (1 - k) * 0.7; r.material.color.setHex(i % 2 ? 0x5aaaff : 0xff5a5a); r.rotation.x = Math.PI / 2; } });
  PL.shadow.visible = D3 < 40; PL.shadow.position.set(px, -D3 + 0.06, -P); const hh = PLAY_Y + D3; PL.shadow.scale.setScalar(clamp(1.7 - hh * 0.02, 0.6, 1.7)); PL.shadow.material.opacity = clamp(0.32 - hh * 0.006, 0.08, 0.32);
  // --- objetos, enemigos, decorado, jefe, fantasmas
  if (typeof syncWorld === 'function') syncWorld(dt, P, D3, air);
  // --- cámara
  const shx = G.shake > 0 ? (Math.random() - 0.5) * G.shake * 0.05 : 0, shy = G.shake > 0 ? (Math.random() - 0.5) * G.shake * 0.05 : 0;
  const cxp = PL.cx * 0.6 + shx, camY = PLAY_Y + 2.9 + shy, dive = diving() ? 1 : 0;
  CAM3.fov += ((H > W ? 70 : 60) + dive * 9 + (G.starT > 0 ? 4 : 0) - CAM3.fov) * Math.min(1, dt * 5); CAM3.updateProjectionMatrix();
  CAM3.position.set(cxp, camY, -P + 8.8); CAM3.lookAt(PL.cx * 0.55, PLAY_Y + 0.15 + ascK * 3.5, -P - 15); CAM3.rotateZ(-G.bank * 0.06);
  SK.dome.position.copy(CAM3.position); SK.mount.position.set(CAM3.position.x, CAM3.position.y - 8, CAM3.position.z);
  g3RenderScene();
  g3Overlay(dt, a);
}

/* ---------------------------------------------------------------- capa 2D encima del 3D: partículas, lluvia, destellos, viñeta */
let fb3 = null, fb3x = null, fb3on = false;
function g3Overlay(dt, a){
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  const blur = diving() || G.starT > 0;
  if (fb3 === null){ fb3 = document.createElement('canvas'); fb3x = fb3.getContext('2d'); }
  if (blur && fb3on){ ctx.save(); ctx.globalAlpha = 0.28; ctx.translate(cx, H * 0.45); ctx.scale(1.02, 1.02); ctx.translate(-cx, -H * 0.45); ctx.drawImage(fb3, 0, 0, W, H); ctx.restore(); }
  AMB.draw();
  for (const p of particles){ ctx.globalAlpha = clamp(p.life, 0, 1); ctx.fillStyle = p.color; if (p.confetti) ctx.fillRect(p.x, p.y, p.size, p.size * 0.5); else circ(ctx, p.x, p.y, p.size); }
  ctx.globalAlpha = 1;
  const mist = Math.max(0, 1 - Math.abs(a - 0.77) / 0.05) * 0.55; if (mist > 0){ ctx.fillStyle = `rgba(255,255,255,${mist})`; ctx.fillRect(0, 0, W, H); }
  if (THEME.tint){ ctx.fillStyle = rgb(THEME.tint, THEME.tint[3] * 0.8); ctx.fillRect(0, 0, W, H); }
  if (G.lightning > 0){ ctx.fillStyle = `rgba(235,240,255,${Math.min(0.75, G.lightning * 2.4)})`; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0.2){ ctx.fillStyle = `rgba(255,255,255,${(G.flash - 0.2) * 1.2})`; ctx.fillRect(0, 0, W, H); }
  if (G.inv > 0 && G.fallT <= 0 && G.slow > 0){ ctx.fillStyle = `rgba(255,80,80,${G.slow * 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (G.fade > 0){ ctx.fillStyle = `rgba(255,255,255,${clamp(G.fade, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  if (vignette) ctx.drawImage(vignette, 0, 0, W, H);
  if (blur){ if (fb3.width !== glCv.width || fb3.height !== glCv.height){ fb3.width = glCv.width; fb3.height = glCv.height; } fb3x.globalCompositeOperation = 'copy'; fb3x.drawImage(glCv, 0, 0); fb3on = true; } else fb3on = false;
}

/* cambia el aspecto del avión cuando eliges otra skin */
function skin3dRefresh(){ if (!PL || !PL.root || !PL.plane) return; PL.root.remove(PL.plane); PL.plane = buildPlaneModel(curSkin(), false); PL.root.add(PL.plane); }
window.__skinHook = skin3dRefresh;


/* ------------------------------------------------------------------ aspecto CARICATURA: contorno por detección de bordes en la profundidad + color vivo */
const POST = { ok: false, on: true };
function postInit(){
  try {
    const dt = new THREE.DepthTexture(2, 2); dt.type = THREE.UnsignedIntType;
    POST.rt = new THREE.WebGLRenderTarget(2, 2, { depthTexture: dt, samples: 4, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    POST.mat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tC: { value: null }, tD: { value: null }, uPx: { value: new THREE.Vector2(1, 1) }, uNear: { value: 0.3 }, uFar: { value: 1400 }, uSat: { value: 1.22 }, uEdge: { value: 1.3 }, uOut: { value: new THREE.Color(0x14183c) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `uniform sampler2D tC, tD; uniform vec2 uPx; uniform float uNear, uFar, uSat, uEdge; uniform vec3 uOut; varying vec2 vUv;
        float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
        void main(){
          vec3 c = texture2D(tC, vUv).rgb; vec2 o = uPx * uEdge;
          float d0 = lin(texture2D(tD, vUv).r), dl = lin(texture2D(tD, vUv - vec2(o.x, 0.0)).r), dr = lin(texture2D(tD, vUv + vec2(o.x, 0.0)).r), du = lin(texture2D(tD, vUv + vec2(0.0, o.y)).r), dd = lin(texture2D(tD, vUv - vec2(0.0, o.y)).r);
          float diff = abs(dl - d0) + abs(dr - d0) + abs(du - d0) + abs(dd - d0);
          float e = smoothstep(0.8, 1.6, diff / (d0 * 0.34 + 0.9));
          e *= 1.0 - smoothstep(70.0, 190.0, d0);                      // sin contorno en lo muy lejano
          float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, uSat);   // color más vivo
          c = (c - 0.5) * 1.07 + 0.5;                                    // algo más de contraste
          c = mix(c, uOut, e * 0.92);
          gl_FragColor = vec4(max(c, 0.0), 1.0);
        }`
    });
    POST.scene = new THREE.Scene(); POST.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), POST.mat)); POST.scene.children[0].frustumCulled = false; POST.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    POST.ok = true;
  } catch (e){ POST.ok = false; console.warn('post-proceso no disponible', e); }
}
function postSize(){ if (!POST.ok) return; const pr = R3.getPixelRatio(), w = Math.max(2, Math.floor(W * pr)), h = Math.max(2, Math.floor(H * pr)); if (POST.rt.width !== w || POST.rt.height !== h){ POST.rt.setSize(w, h); } POST.mat.uniforms.uPx.value.set(1 / w, 1 / h); POST.mat.uniforms.uEdge.value = Math.max(1, pr) * 1.15; POST.mat.uniforms.uNear.value = CAM3.near; POST.mat.uniforms.uFar.value = CAM3.far; }
function g3RenderScene(){
  if (POST.ok && POST.on && !window.__postOff && !(typeof Q !== 'undefined' && Q.low)){
    postSize(); R3.setRenderTarget(POST.rt); R3.render(S3, CAM3); R3.setRenderTarget(null);
    POST.mat.uniforms.tC.value = POST.rt.texture; POST.mat.uniforms.tD.value = POST.rt.depthTexture; R3.render(POST.scene, POST.cam);
  } else R3.render(S3, CAM3);
}
