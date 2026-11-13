import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../public/voces/avion3_eric.json';
import {At, C, Emo, FONT, FPS, Palabra, T, sp, Voz} from './Miel';
import {Def, Logo, Neon, P, Video} from './Kit';

const V = data as any as Voz;
const CYAN = '#00E5FF';
const PINK = '#FF2E93';
const LIME = '#B6FF3B';
const GOLD = '#FFC107';

/* ───────────── geometría ───────────── */

const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const unmerc = (y: number) => (Math.atan(Math.sinh(y)) * 180) / Math.PI;
const proj = (lon: number, lat: number): [number, number] => [4.65 * lon + 831.7, 763.7 - 262.7 * merc(lat)];
const LON = {lon: -0.1, lat: 51.5};
const LAX = {lon: -118.2, lat: 34.05};

const gcLL = (a: {lon: number; lat: number}, b: {lon: number; lat: number}, n = 160): [number, number][] => {
  const v = (lat: number, lon: number) => {
    const la = (lat * Math.PI) / 180;
    const lo = (lon * Math.PI) / 180;
    return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  };
  const p = v(a.lat, a.lon);
  const q = v(b.lat, b.lon);
  const d = Math.acos(p[0] * q[0] + p[1] * q[1] + p[2] * q[2]);
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const k1 = Math.sin((1 - t) * d) / Math.sin(d);
    const k2 = Math.sin(t * d) / Math.sin(d);
    const x = [k1 * p[0] + k2 * q[0], k1 * p[1] + k2 * q[1], k1 * p[2] + k2 * q[2]];
    out.push([(Math.atan2(x[1], x[0]) * 180) / Math.PI, (Math.atan2(x[2], Math.hypot(x[0], x[1])) * 180) / Math.PI]);
  }
  return out;
};
// "línea recta del mapa" = recta en proyección Mercator (rumbo constante)
const rhumbLL = (a: {lon: number; lat: number}, b: {lon: number; lat: number}, n = 160): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    return [a.lon + (b.lon - a.lon) * t, unmerc(merc(a.lat) + (merc(b.lat) - merc(a.lat)) * t)] as [number, number];
  });

const GC = gcLL(LON, LAX);
const RH = rhumbLL(LON, LAX);
const flat = (pts: [number, number][]) => pts.map(([lo, la]) => proj(lo, la));
const GCF = flat(GC);
const RHF = flat(RH);
const toD = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lin = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
const KM_RH = 9733;
const KM_GC = 8756;

/* ───────────── globo 3D con la textura nocturna ───────────── */

type Tex = {data: Uint8ClampedArray; w: number; h: number};
const CACHE: {p?: Promise<Tex>} = {};
const loadTex = (): Promise<Tex> => {
  if (CACHE.p) return CACHE.p;
  CACHE.p = new Promise((res, rej) => {
    const img = new window.Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      res({data: d.data, w: c.width, h: c.height});
    };
    img.onerror = rej;
    img.src = staticFile('avion/night.png');
  });
  return CACHE.p;
};

const GlobeCanvas: React.FC<{R: number; lon0: number; lat0: number}> = ({R, lon0, lat0}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<Tex | null>(null);
  const [handle] = useState(() => delayRender('night texture'));
  useEffect(() => {
    let alive = true;
    loadTex().then((t) => {
      if (alive) setTex(t);
      continueRender(handle);
    });
    return () => {
      alive = false;
    };
  }, [handle]);
  const S = Math.round(R * 2);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!tex || !cv) return;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(S, S);
    const out = img.data;
    const lat0r = (lat0 * Math.PI) / 180;
    const sl = Math.sin(lat0r);
    const cl = Math.cos(lat0r);
    const {data: td, w: W, h: H} = tex;
    for (let py = 0; py < S; py++) {
      const y = -(py + 0.5 - R) / R;
      for (let px = 0; px < S; px++) {
        const x = (px + 0.5 - R) / R;
        const r2 = x * x + y * y;
        const idx = (py * S + px) * 4;
        if (r2 >= 1) continue;
        const z = Math.sqrt(1 - r2);
        const phi = Math.asin(y * cl + z * sl);
        let lon = lon0 + (Math.atan2(x, z * cl - y * sl) * 180) / Math.PI;
        lon = ((((lon + 178.9) % 360) + 360) % 360) - 178.9;
        const tx = 4.65 * lon + 831.7;
        const ty = 763.7 - 262.7 * Math.log(Math.tan(Math.PI / 4 + phi / 2));
        let r = 4;
        let g = 12;
        let b = 30;
        if (ty >= 0 && ty < H - 1 && tx >= 0 && tx < W - 1) {
          const ix = tx | 0;
          const iy = ty | 0;
          const fx = tx - ix;
          const fy = ty - iy;
          const i00 = (iy * W + ix) * 4;
          const i10 = i00 + 4;
          const i01 = i00 + W * 4;
          const i11 = i01 + 4;
          const w00 = (1 - fx) * (1 - fy);
          const w10 = fx * (1 - fy);
          const w01 = (1 - fx) * fy;
          const w11 = fx * fy;
          r = td[i00] * w00 + td[i10] * w10 + td[i01] * w01 + td[i11] * w11;
          g = td[i00 + 1] * w00 + td[i10 + 1] * w10 + td[i01 + 1] * w01 + td[i11 + 1] * w11;
          b = td[i00 + 2] * w00 + td[i10 + 2] * w10 + td[i01 + 2] * w01 + td[i11 + 2] * w11;
        }
        const ndl = x * -0.3 + y * 0.45 + z * 0.84;
        const sh = 0.5 + 0.75 * Math.max(0, ndl);
        const rim = Math.pow(1 - z, 3);
        out[idx] = Math.min(255, r * sh * 1.45 + rim * 10);
        out[idx + 1] = Math.min(255, g * sh * 1.45 + rim * 170);
        out[idx + 2] = Math.min(255, b * sh * 1.4 + rim * 255);
        out[idx + 3] = r2 > 0.985 ? Math.round(255 * (1 - r2) / 0.015) : 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [tex, S, lon0, lat0, R]);
  return <canvas ref={ref} width={S} height={S} style={{width: S, height: S, display: 'block'}} />;
};

const orth = (lon: number, lat: number, lon0: number, lat0: number, R: number) => {
  const l = ((lon - lon0) * Math.PI) / 180;
  const ph = (lat * Math.PI) / 180;
  const p0 = (lat0 * Math.PI) / 180;
  const c = Math.sin(p0) * Math.sin(ph) + Math.cos(p0) * Math.cos(ph) * Math.cos(l);
  return {x: R * Math.cos(ph) * Math.sin(l), y: -R * (Math.cos(p0) * Math.sin(ph) - Math.sin(p0) * Math.cos(ph) * Math.cos(l)), vis: c > 0.02, c};
};

const path3d = (pts: [number, number][], upTo: number, lon0: number, lat0: number, R: number) => {
  let d = '';
  let pen = false;
  const n = Math.max(1, Math.floor(upTo * (pts.length - 1)));
  for (let i = 0; i <= n; i++) {
    const q = orth(pts[i][0], pts[i][1], lon0, lat0, R);
    if (q.vis) {
      d += `${pen ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)} `;
      pen = true;
    } else pen = false;
  }
  return d;
};

const PlaneSvg: React.FC<{color: string; size?: number}> = ({color, size = 64}) => (
  <svg width={size} height={size} viewBox="-48 -48 96 96" style={{overflow: 'visible'}}>
    <path d="M0 -42 L9 -12 L42 8 L42 19 L9 9 L6 32 L17 40 L17 46 L0 42 L-17 46 L-17 40 L-6 32 L-9 9 L-42 19 L-42 8 L-9 -12 Z" fill={color} stroke="#fff" strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

const GlowDefs: React.FC = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="9" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

type GlobeProps = {
  R: number;
  lon0: number;
  lat0: number;
  y?: number;
  pRh?: number;
  pGc?: number;
  ring?: boolean;
  equator?: boolean;
  pulse?: [number, number] | null;
  labels?: boolean;
  fx?: number;
};

const GlobeScene: React.FC<GlobeProps> = ({R, lon0, lat0, y = 800, pRh = 0, pGc = 0, ring, equator, pulse, labels = true}) => {
  const f = useCurrentFrame();
  const size = R * 2 + 120;
  const endGC = orth(GC[Math.max(1, Math.floor(pGc * (GC.length - 1)))][0], GC[Math.max(1, Math.floor(pGc * (GC.length - 1)))][1], lon0, lat0, R);
  const dotLon = orth(LON.lon, LON.lat, lon0, lat0, R);
  const dotLax = orth(LAX.lon, LAX.lat, lon0, lat0, R);
  const ringPts: [number, number][] = Array.from({length: 241}, (_, i) => {
    const t = (i / 240) * Math.PI * 2;
    // gran círculo que pasa por LON y LAX
    const a = [Math.cos((LON.lat * Math.PI) / 180) * Math.cos((LON.lon * Math.PI) / 180), Math.cos((LON.lat * Math.PI) / 180) * Math.sin((LON.lon * Math.PI) / 180), Math.sin((LON.lat * Math.PI) / 180)];
    const b = [Math.cos((LAX.lat * Math.PI) / 180) * Math.cos((LAX.lon * Math.PI) / 180), Math.cos((LAX.lat * Math.PI) / 180) * Math.sin((LAX.lon * Math.PI) / 180), Math.sin((LAX.lat * Math.PI) / 180)];
    const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const u = [b[0] - dot * a[0], b[1] - dot * a[1], b[2] - dot * a[2]];
    const ul = Math.hypot(u[0], u[1], u[2]);
    const w = [u[0] / ul, u[1] / ul, u[2] / ul];
    const x = [Math.cos(t) * a[0] + Math.sin(t) * w[0], Math.cos(t) * a[1] + Math.sin(t) * w[1], Math.cos(t) * a[2] + Math.sin(t) * w[2]];
    return [(Math.atan2(x[1], x[0]) * 180) / Math.PI, (Math.atan2(x[2], Math.hypot(x[0], x[1])) * 180) / Math.PI];
  });
  const eq: [number, number][] = Array.from({length: 181}, (_, i) => [-180 + i * 2, 0]);
  const planeAng = (() => {
    const i = Math.max(1, Math.floor(pGc * (GC.length - 1)));
    const a = orth(GC[i - 1][0], GC[i - 1][1], lon0, lat0, R);
    const b = orth(GC[i][0], GC[i][1], lon0, lat0, R);
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
  })();
  return (
    <At y={y}>
      <div style={{position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'absolute', width: R * 2.5, height: R * 2.5, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.0) 46%, rgba(0,229,255,0.26) 62%, rgba(0,229,255,0) 80%)'}} />
        <GlobeCanvas R={R} lon0={lon0} lat0={lat0} />
        <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <GlowDefs />
          {equator && <path d={path3d(eq, 1, lon0, lat0, R)} fill="none" stroke={LIME} strokeWidth={6} strokeDasharray="16 14" opacity={0.95} />}
          {ring && (
            <>
              <path d={path3d(ringPts, 1, lon0, lat0, R)} fill="none" stroke={CYAN} strokeWidth={5} strokeOpacity={0.55} />
            </>
          )}
          {pRh > 0 && <path d={path3d(RH, pRh, lon0, lat0, R)} fill="none" stroke={PINK} strokeWidth={11} strokeLinecap="round" filter="url(#glow)" />}
          {pGc > 0 && <path d={path3d(GC, pGc, lon0, lat0, R)} fill="none" stroke={CYAN} strokeWidth={11} strokeLinecap="round" filter="url(#glow)" />}
          {[dotLon, dotLax].map((q, i) =>
            q.vis ? (
              <g key={i} transform={`translate(${q.x} ${q.y})`}>
                <circle r={11 + ((f * 0.5 + i * 8) % 16)} fill="none" stroke="#fff" strokeOpacity={1 - ((f * 0.5 + i * 8) % 16) / 16} strokeWidth={4} />
                <circle r={11} fill="#fff" stroke={CYAN} strokeWidth={5} />
                {labels && (
                  <text y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill="#fff" stroke="#031024" strokeWidth={10} paintOrder="stroke">
                    {i === 0 ? 'LONDRES' : 'LOS ÁNGELES'}
                  </text>
                )}
              </g>
            ) : null,
          )}
          {pulse && (() => {
            const q = orth(pulse[0], pulse[1], lon0, lat0, R);
            return q.vis ? (
              <g transform={`translate(${q.x} ${q.y})`}>
                <circle r={16 + ((f * 0.9) % 40)} fill="none" stroke={GOLD} strokeOpacity={1 - ((f * 0.9) % 40) / 40} strokeWidth={6} />
                <circle r={13} fill={GOLD} stroke="#fff" strokeWidth={4} />
              </g>
            ) : null;
          })()}
          {pGc > 0 && pGc < 1 && endGC.vis && (
            <g transform={`translate(${endGC.x} ${endGC.y}) rotate(${planeAng})`}>
              <g filter="url(#glow)">
                <PlaneSvg color={CYAN} size={70} />
              </g>
            </g>
          )}
        </svg>
      </div>
    </At>
  );
};

/* ───────────── mapa plano nocturno ───────────── */

const SC = 960 / 1800;
const FlatMap: React.FC<{children: React.ReactNode; y?: number; s?: number; fx?: number; fy?: number; sway?: number}> = ({children, y = 770, s = 1, fx = 900, fy = 570, sway = 1}) => {
  const f = useCurrentFrame();
  const e = sp(f, 0, {damping: 14, stiffness: 120, mass: 0.8});
  return (
    <At y={y} style={{transform: `translate(-50%,-50%) translate(${Math.sin(f * 0.04) * 8 * sway}px,${Math.cos(f * 0.05) * 6 * sway}px) rotate(${Math.sin(f * 0.035) * 0.9 * sway}deg) scale(${e})`}}>
      <div style={{width: 960, height: 609, borderRadius: 22, overflow: 'hidden', position: 'relative', background: '#04101f', border: `3px solid ${CYAN}`, boxShadow: `0 0 50px rgba(0,229,255,.35), inset 0 0 60px rgba(0,229,255,.12)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 960, height: 609, transformOrigin: `${fx * SC}px ${fy * SC}px`, transform: `scale(${s})`}}>
          <Img src={staticFile('avion/night.png')} style={{width: 960, height: 609, position: 'absolute', left: 0, top: 0}} />
          <svg width={960} height={609} viewBox="0 0 1800 1143" style={{position: 'absolute', left: 0, top: 0}}>
            <GlowDefs />
            {children}
          </svg>
        </div>
      </div>
    </At>
  );
};

const alongF = (pts: [number, number][], p: number): [number, number, number] => {
  const i = Math.max(1, Math.min(pts.length - 1, Math.floor(p * (pts.length - 1))));
  const a = pts[i - 1];
  const b = pts[i];
  return [b[0], b[1], (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90];
};

const Glass: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({children, color = CYAN, size = 44}) => (
  <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color: '#fff', background: 'rgba(6,14,36,.78)', border: `4px solid ${color}`, boxShadow: `0 0 26px ${color}99`, borderRadius: 22, padding: '8px 26px', whiteSpace: 'nowrap', textShadow: `0 0 14px ${color}`}}>{children}</div>
);

/* ───────────── subtítulos neón ───────────── */

const CapNeon: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const chunks = React.useMemo(() => {
    const out: Palabra[][] = [];
    let cur: Palabra[] = [];
    V.palabras.forEach((w) => {
      cur.push(w);
      if (/[,.?!:]$/.test(w.t) || cur.length >= 4) {
        out.push(cur);
        cur = [];
      }
    });
    if (cur.length) out.push(cur);
    return out;
  }, []);
  const ci = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  if (ci < 0) return null;
  const chunk = chunks[ci];
  const pop = sp(f, Math.round((chunk[0].s - 0.05) * FPS), {damping: 14, stiffness: 280, mass: 0.4});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1250, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '2px 30px', transform: `scale(${0.82 + 0.18 * pop})`}}>
      {chunk.map((w, i) => {
        const on = t >= w.s - 0.02 && t <= w.e + 0.1;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 90,
              textTransform: 'uppercase',
              color: on ? CYAN : '#fff',
              WebkitTextStroke: '9px #031024',
              paintOrder: 'stroke fill',
              textShadow: on ? `0 0 28px ${CYAN}, 0 0 60px ${CYAN}88` : '0 6px 0 #031024',
              display: 'inline-block',
              transform: on ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

/* ───────────── escenas ───────────── */

const S1: React.FC<P> = () => {
  const f = useCurrentFrame();
  const lon0 = interpolate(f, [0, 125], [-170, -50], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const lat0 = interpolate(f, [0, 125], [-5, 38], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const R = interpolate(f, [0, 125], [250, 400], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <>
      <GlobeScene R={R} lon0={lon0} lat0={lat0} y={840} pRh={0} pGc={lin(f, 70, 125)} labels={f > 90} />
      <At y={330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 9, stiffness: 190, mass: 0.6})}) rotate(${(1 - sp(f, 0)) * -6}deg)`}}>
        <Neon size={70} color={CYAN}>¿Y SI TE DIGO QUE…?</Neon>
      </At>
      <At y={490}>
        <T size={62} delay={30} color="#fff">EL CAMINO MÁS CORTO</T>
        <T size={84} delay={38} color={PINK}>ES UNA CURVA</T>
      </At>
    </>
  );
};

const S2: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const t0 = 30;
  const Tc = 189;
  const Tp = Tc * (KM_RH / KM_GC);
  const pc = lin(f, t0, t0 + Tc);
  const pp = lin(f, t0, t0 + Tp);
  const dCyan = Math.round(KM_GC * pc);
  const dPink = Math.round(KM_RH * pp);
  const [px, py, pa] = alongF(RHF, pp);
  const [cx, cy, ca] = alongF(GCF, pc);
  const nine = m.nueve ?? 107;
  const eight = m.ocho ?? 203;
  const less = m.menos ?? 285;
  const cyanDone = f >= t0 + Tc;
  const pinkDone = f >= t0 + Tp;
  const slam = sp(f, less, {damping: 6, stiffness: 200, mass: 0.6});
  const shake = f >= less && f < less + 12 ? Math.sin(f * 3) * 8 * (1 - (f - less) / 12) : 0;
  return (
    <>
      <At y={330} style={{transform: `translate(-50%,-50%) translateX(${shake}px) scale(${sp(f, 0)})`}}>
        <Neon size={58} color={CYAN}>LONDRES → LOS ÁNGELES</Neon>
      </At>
      <FlatMap y={790} s={ease(f, 0, 200) * 0.1 + 1} fx={560} fy={560}>
        <path d={toD(RHF)} fill="none" stroke={PINK} strokeWidth={9} strokeDasharray="22 16" opacity={0.55} />
        <path d={toD(GCF)} fill="none" stroke={CYAN} strokeWidth={9} strokeDasharray="22 16" opacity={0.45} />
        <path d={toD(RHF)} pathLength={1} fill="none" stroke={PINK} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${pp} 2`} filter="url(#glow)" />
        <path d={toD(GCF)} pathLength={1} fill="none" stroke={CYAN} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${pc} 2`} filter="url(#glow)" />
        {[GCF[0], GCF[GCF.length - 1]].map((p, i) => (
          <g key={i} transform={`translate(${p[0]} ${p[1]})`}>
            <circle r={26} fill="none" stroke="#fff" strokeOpacity={0.8} strokeWidth={5} />
            <circle r={13} fill="#fff" />
            <text y={-46} x={i ? 60 : 70} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={50} fill="#fff" stroke="#031024" strokeWidth={11} paintOrder="stroke">
              {i ? 'LOS ÁNGELES' : 'LONDRES'}
            </text>
          </g>
        ))}
        {!pinkDone && (
          <g transform={`translate(${px} ${py}) rotate(${pa}) scale(1.5)`} filter="url(#glow)">
            <PlaneSvg color={PINK} size={64} />
          </g>
        )}
        {!cyanDone && (
          <g transform={`translate(${cx} ${cy}) rotate(${ca}) scale(1.5)`} filter="url(#glow)">
            <PlaneSvg color={CYAN} size={64} />
          </g>
        )}
      </FlatMap>
      {/* marcadores de distancia */}
      <At x={400} y={1130} style={{transform: `translate(-50%,-50%) scale(${sp(f, 18)})`}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, width: 700}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: PINK, textShadow: `0 0 16px ${PINK}`, transform: `scale(${f >= nine && f < nine + 20 ? 1.08 : 1})`}}>
            <span>RECTA DEL MAPA</span>
            <span style={{color: '#fff'}}>{dPink.toLocaleString('en-US')} km</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 40, color: CYAN, textShadow: `0 0 16px ${CYAN}`, transform: `scale(${f >= eight && f < eight + 20 ? 1.08 : 1})`}}>
            <span>RUTA CURVA</span>
            <span style={{color: '#fff'}}>{dCyan.toLocaleString('en-US')} km</span>
          </div>
        </div>
      </At>
      <At x={770} y={640} style={{opacity: cyanDone ? 1 : 0, transform: `translate(-50%,-50%) rotate(-5deg) scale(${sp(f, t0 + Tc, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Glass color={CYAN} size={40}>🏁 GANA LA CURVA</Glass>
      </At>
      <At y={560} style={{opacity: f >= less ? 1 : 0, transform: `translate(-50%,-50%) translateX(${shake}px) scale(${slam}) rotate(${(1 - slam) * 8}deg)`}}>
        <Neon size={150} color={LIME}>−977 KM</Neon>
      </At>
    </>
  );
};

const S3: React.FC<P> = () => {
  const f = useCurrentFrame();
  const lon0 = interpolate(f, [0, 189], [-35, -85], {extrapolateRight: 'clamp'});
  const lat0 = interpolate(f, [0, 189], [30, 52], {extrapolateRight: 'clamp'});
  return (
    <>
      <At y={330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 7, stiffness: 200, mass: 0.6})}) rotate(${Math.sin(f * 2) * (f < 20 ? 3 : 0)}deg)`}}>
        <Neon size={110} color={GOLD}>¿TRAMPA?</Neon>
      </At>
      <At y={470} style={{opacity: f > 30 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 30)})`}}>
        <T size={84} color="#fff">ES GEOMETRÍA</T>
      </At>
      <GlobeScene R={350} lon0={lon0} lat0={lat0} y={850} pRh={lin(f, 20, 110)} pGc={lin(f, 40, 120)} labels />
      <At x={250} y={1130} style={{opacity: f > 80 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 80)})`}}>
        <Glass color={PINK} size={34}>LA “RECTA” DEL MAPA</Glass>
      </At>
      <At x={730} y={1130} style={{opacity: f > 100 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 100)})`}}>
        <Glass color={CYAN} size={34}>LA RUTA REAL</Glass>
      </At>
    </>
  );
};

const S4: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const lon0 = interpolate(f, [0, 183], [-50, -75], {extrapolateRight: 'clamp'});
  const lat0 = interpolate(f, [0, 183], [48, 36], {extrapolateRight: 'clamp'});
  const arco = m.arco ?? 50;
  return (
    <>
      <At y={330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0)})`}}>
        <Neon size={78} color={CYAN}>CÍRCULO MÁXIMO</Neon>
      </At>
      <GlobeScene R={375} lon0={lon0} lat0={lat0} y={830} pGc={1} pRh={0} ring labels />
      <At y={1130} style={{opacity: f > arco ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, arco, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Glass color={CYAN} size={42}>EL ARCO MÁS CORTO</Glass>
      </At>
      <At x={800} y={560} style={{opacity: f > 100 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 100)}) rotate(${Math.sin(f * 0.2) * 8}deg)`}}>
        <Emo c="🧵" size={120} />
      </At>
    </>
  );
};

const S5: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const lon0 = interpolate(f, [0, 153], [-60, -50], {extrapolateRight: 'clamp'});
  const lat0 = interpolate(f, [0, 60, 153], [40, 62, 66], {extrapolateRight: 'clamp'});
  const R = interpolate(f, [0, 60], [350, 400], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const gr = m.groen ?? 60;
  return (
    <>
      <At y={330}>
        <T size={72} delay={0} color="#fff">LATITUD MÁXIMA</T>
        <Neon size={110} color={GOLD} style={{marginTop: 10}}>{`${Math.round(interpolate(f, [0, 80], [51, 62], {extrapolateRight: 'clamp'}))}° N`}</Neon>
      </At>
      <GlobeScene R={R} lon0={lon0} lat0={lat0} y={850} pGc={1} pRh={lin(f, 0, 30)} equator pulse={[-49, 62.4]} labels={false} />
      <At x={540} y={1130} style={{opacity: f > gr ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, gr, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Glass color={GOLD} size={46}>CASI GROENLANDIA</Glass>
      </At>
      <At x={170} y={600} style={{opacity: f > 90 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 90)})`}}>
        <Glass color={LIME} size={32}>ECUADOR</Glass>
      </At>
    </>
  );
};

const S6: React.FC<P> = () => {
  const f = useCurrentFrame();
  const p = lin(f, 6, 100);
  const wig = GCF.map(([x, y], i): [number, number] => [x, y + Math.sin(i * 0.3) * 24 * Math.sin((i / GCF.length) * Math.PI)]);
  const [wx, wy, wa] = alongF(wig, p);
  return (
    <>
      <At y={330}>
        <T size={66} delay={0} color="#fff">LA RUTA REAL</T>
        <Neon size={78} color={CYAN} style={{marginTop: 8}}>SE AJUSTA</Neon>
      </At>
      <FlatMap y={790} s={1.25} fx={520} fy={520} sway={1.6}>
        <path d={toD(GCF)} fill="none" stroke={CYAN} strokeWidth={8} strokeDasharray="20 16" opacity={0.4} />
        <path d={toD(wig)} pathLength={1} fill="none" stroke={LIME} strokeWidth={13} strokeLinecap="round" strokeDasharray={`${p} 2`} filter="url(#glow)" />
        {Array.from({length: 16}).map((_, i) => {
          const sx = ((f * (9 + (i % 4) * 3) + i * 170) % 2200) - 200;
          const sy = 200 + (i * 53) % 700;
          return <line key={i} x1={sx} y1={sy} x2={sx + 90 + (i % 3) * 40} y2={sy - 8} stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.5} />;
        })}
        <g transform={`translate(${wx} ${wy}) rotate(${wa}) scale(1.5)`} filter="url(#glow)">
          <PlaneSvg color={LIME} size={64} />
        </g>
      </FlatMap>
      <At x={540} y={1130} style={{opacity: f > 20 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <div style={{display: 'flex', gap: 22}}>
          <Glass color={CYAN} size={34}>💨 VIENTO</Glass>
          <Glass color={GOLD} size={34}>⛈️ CLIMA</Glass>
          <Glass color={PINK} size={34}>🚧 ESPACIO</Glass>
        </div>
      </At>
    </>
  );
};

const S7: React.FC<P> = () => {
  const f = useCurrentFrame();
  const no = f >= 52;
  const flash = f >= 52 && f < 58;
  return (
    <>
      <At y={330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 190, mass: 0.6})}) translateX(${no ? 0 : Math.sin(f * 2.2) * 5}px)`}}>
        <Neon size={62} color={GOLD}>¿SE DESVÍA TU AVIÓN?</Neon>
      </At>
      <At y={560} style={{opacity: no ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 52, {damping: 6, stiffness: 220, mass: 0.6})})`}}>
        <Neon size={190} color={LIME}>NO.</Neon>
      </At>
      <At y={900} style={{transform: `translate(-50%,-50%) scale(${sp(f, 80, {damping: 10, stiffness: 120, mass: 0.8})})`, opacity: f > 78 ? 1 : 0}}>
        <div style={{perspective: 900}}>
          <div style={{width: 900, height: 572, transform: `rotateX(58deg) rotateZ(${-8 + Math.sin(f * 0.05) * 4}deg)`, borderRadius: 18, overflow: 'hidden', border: `3px solid ${PINK}`, boxShadow: `0 0 50px ${PINK}88`, position: 'relative'}}>
            <Img src={staticFile('avion/night.png')} style={{width: 900, height: 572, position: 'absolute', left: -((f * 2) % 140), top: 0}} />
            <svg width={900} height={572} viewBox="0 0 1800 1143" style={{position: 'absolute', left: 0, top: 0}}>
              <GlowDefs />
              <path d={toD(RHF)} fill="none" stroke={PINK} strokeWidth={14} filter="url(#glow)" />
              <path d={toD(GCF)} fill="none" stroke={CYAN} strokeWidth={14} filter="url(#glow)" />
            </svg>
          </div>
        </div>
      </At>
      <At y={1130} style={{opacity: f > 110 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 110, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Glass color={PINK} size={44}>TU MAPA ES EL QUE ENGAÑA</Glass>
      </At>
      {flash && <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.35}} />}
    </>
  );
};

const S8: React.FC<P> = () => {
  const f = useCurrentFrame();
  const b = 1 + Math.sin(f * 0.35) * 0.05;
  return (
    <>
      <At y={400} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(${Math.sin(f * 0.15) * 4}deg)`}}>
        <div style={{filter: `drop-shadow(0 0 30px ${CYAN})`}}>
          <Logo size={270} />
        </div>
      </At>
      <At y={660}>
        <Neon size={130} color={PINK}>SÍGUEME</Neon>
      </At>
      <At y={820}>
        <T size={76} delay={9} color={CYAN}>Y COMPÁRTELO</T>
      </At>
      <At y={990} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14) * b})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 80, color: '#fff', background: PINK, border: '6px solid #fff', borderRadius: 100, padding: '14px 56px', boxShadow: `0 0 40px ${PINK}`, whiteSpace: 'nowrap'}}>+ SEGUIR</div>
      </At>
      <At x={330} y={1140} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.5) * 18}deg) scale(${sp(f, 22)})`}}>
        <Emo c="🔔" size={100} />
      </At>
      <At x={560} y={1140} style={{transform: `translate(-50%,-50%) scale(${sp(f, 26)}) rotate(${f * 4}deg)`}}>
        <PlaneSvg color={CYAN} size={90} />
      </At>
    </>
  );
};

/* ───────────── línea de tiempo ───────────── */

const NIGHT: [string, string] = ['#0A1B3D', '#030816'];
const FLAT: any = [[0, 1, 540, 800], [999, 1, 540, 800]];
const DEFS: Def[] = [
  {id: 'hook', key: null, bg: NIGHT, C: S1, cam: FLAT, shakeAt: [30], fx: [{f: 'riser', at: 0, v: 0.45}, {f: 'swoosh_in', at: 0, v: 0.5}, {f: 'bass', at: 30, v: 0.7}, {f: 'pop2', at: 38, v: 0.5}, {f: 'ping', at: 90, v: 0.45}]},
  {id: 'carrera', key: 'mira', bg: NIGHT, C: S2, cam: FLAT, marks: {nueve: 'nueve', ocho: 'ocho', menos: 'menos'}, markFx: {nueve: [{f: 'pop2', at: 0, v: 0.5}], ocho: [{f: 'pop2', at: 0, v: 0.5}], menos: [{f: 'bass', at: 0, v: 0.85}, {f: 'ping', at: 2, v: 0.55}]}, shakeAt: [], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'plane', at: 30, v: 0.55}, {f: 'ticks', at: 40, v: 0.4}, {f: 'ticks', at: 110, v: 0.35}, {f: 'ping', at: 219, v: 0.6}, {f: 'ding2', at: 240, v: 0.4}]},
  {id: 'trampa', key: 'trampa', bg: NIGHT, C: S3, cam: FLAT, shakeAt: [0], fx: [{f: 'glitch', at: 0, v: 0.5}, {f: 'bass', at: 0, v: 0.7}, {f: 'swoosh_in', at: 28, v: 0.45}, {f: 'plane', at: 40, v: 0.5}, {f: 'pop2', at: 80, v: 0.5}, {f: 'pop2', at: 100, v: 0.5}]},
  {id: 'circulo', key: 'en', bg: NIGHT, C: S4, cam: FLAT, marks: {arco: 'arco'}, markFx: {arco: [{f: 'ping', at: 0, v: 0.55}]}, fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'riser', at: 8, v: 0.35}, {f: 'pop2', at: 100, v: 0.5}, {f: 'sparkle', at: 104, v: 0.4}]},
  {id: 'groen', key: 'por', bg: NIGHT, C: S5, cam: FLAT, marks: {groen: 'groenlandia'}, markFx: {groen: [{f: 'bass', at: 0, v: 0.7}, {f: 'ping', at: 2, v: 0.5}]}, fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'ticks', at: 10, v: 0.4}, {f: 'pop2', at: 90, v: 0.5}]},
  {id: 'viento', key: 'viento', bg: NIGHT, C: S6, cam: FLAT, fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'whoosh_up', at: 4, v: 0.5}, {f: 'plane', at: 10, v: 0.45}, {f: 'pop2', at: 22, v: 0.5}]},
  {id: 'conclusion', key: 'entonces', bg: NIGHT, C: S7, cam: FLAT, shakeAt: [52], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'riser', at: 20, v: 0.4}, {f: 'bass', at: 52, v: 0.9}, {f: 'boom', at: 52, v: 0.5}, {f: 'swoosh_in', at: 78, v: 0.5}, {f: 'pop2', at: 110, v: 0.55}, {f: 'glitch', at: 112, v: 0.35}]},
  {id: 'cta', key: 'sigueme', bg: ['#2A0A4A', '#0B0220'], C: S8, cam: FLAT, fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 30, v: 0.4}]},
];
// 'viento' va con "Y" delante: se ancla una palabra antes
DEFS[5].off = -1;

export const Avion3: React.FC = () => <Video defs={DEFS} v={V} audio="voces/avion3_eric.mp3" captions={<CapNeon />} />;
export const avion3Frames = () => Math.ceil((V.duracion + 0.9) * FPS);
