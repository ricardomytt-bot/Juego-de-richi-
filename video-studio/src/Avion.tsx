import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../public/voces/avion_eric.json';
import {At, C, Emo, FONT, FPS, Sparkle, T, sp, Voz} from './Miel';
import {Chip, Def, Logo, P, Video} from './Kit';

export const V = data as any as Voz;
export const INK = '#1B1B1B';
export const GREEN = '#00A86B';
export const RED = '#E53935';
export const BLUE = '#1E88E5';
export const TITLE = '#1E3A8A';

/* ───────────── geometría ───────────── */

export const SC = 960 / 1800; // escala del mapa en pantalla
export const CARD = {x: 60, y: 465};
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
export const proj = (lon: number, lat: number): [number, number] => [4.65 * lon + 831.7, 763.7 - 262.7 * merc(lat)];
export const scr = (lon: number, lat: number): [number, number] => {
  const [x, y] = proj(lon, lat);
  return [CARD.x + x * SC, CARD.y + y * SC];
};

export const CITY = {
  MEX: {n: 'CDMX', lon: -99.1, lat: 19.4},
  MAD: {n: 'MADRID', lon: -3.7, lat: 40.4},
  LON: {n: 'LONDRES', lon: -0.1, lat: 51.5},
  LAX: {n: 'LOS ÁNGELES', lon: -118.2, lat: 34.05},
  NYC: {n: 'N. YORK', lon: -74, lat: 40.7},
  SIN: {n: 'SINGAPUR', lon: 103.8, lat: 1.3},
  NBO: {n: 'NAIROBI', lon: 36.8, lat: -1.3},
};
export type City = keyof typeof CITY;

export const gc = (a: City, b: City, n = 120): [number, number][] => {
  const A = CITY[a];
  const B = CITY[b];
  const v = (lat: number, lon: number) => {
    const la = (lat * Math.PI) / 180;
    const lo = (lon * Math.PI) / 180;
    return [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  };
  const p = v(A.lat, A.lon);
  const q = v(B.lat, B.lon);
  const d = Math.acos(Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2])));
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const k1 = Math.sin((1 - t) * d) / Math.sin(d);
    const k2 = Math.sin(t * d) / Math.sin(d);
    const x = [k1 * p[0] + k2 * q[0], k1 * p[1] + k2 * q[1], k1 * p[2] + k2 * q[2]];
    out.push(proj((Math.atan2(x[1], x[0]) * 180) / Math.PI, (Math.atan2(x[2], Math.hypot(x[0], x[1])) * 180) / Math.PI));
  }
  return out;
};
export const straight = (a: City, b: City): [number, number][] => [proj(CITY[a].lon, CITY[a].lat), proj(CITY[b].lon, CITY[b].lat)];
export const toD = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
export const prog = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

export const Line: React.FC<{pts: [number, number][]; p: number; color: string; w?: number; dash?: boolean}> = ({pts, p, color, w = 12, dash}) => (
  <path d={toD(pts)} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash ? '0.018 0.014' : 1} strokeDashoffset={dash ? 0 : 1 - p} opacity={dash ? (p > 0 ? 1 : 0) : 1} style={dash ? {clipPath: undefined} : undefined} />
);

export const Plane: React.FC<{pts: [number, number][]; p: number; size?: number}> = ({pts, p, size = 110}) => {
  const i = Math.min(pts.length - 2, Math.max(0, Math.floor(p * (pts.length - 1))));
  const a = pts[i];
  const b = pts[i + 1];
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return (
    <g transform={`translate(${a[0]} ${a[1]}) rotate(${ang + 45})`}>
      <text fontSize={size} textAnchor="middle" dominantBaseline="central" fontFamily={FONT}>✈️</text>
    </g>
  );
};

export const Dot: React.FC<{c: City; s?: number; label?: boolean; dy?: number; dx?: number}> = ({c, s = 1, label = true, dy = -52, dx = 0}) => {
  const [x, y] = proj(CITY[c].lon, CITY[c].lat);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={17} fill="#fff" stroke={INK} strokeWidth={7} />
      <circle r={7} fill={RED} />
      {label && (
        <text x={dx} y={dy} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={50} fill="#fff" stroke={INK} strokeWidth={11} paintOrder="stroke">
          {CITY[c].n}
        </text>
      )}
    </g>
  );
};

type Focus = {a: number; b: number; s0: number; s1: number; lon: number; lat: number};
const MapCard: React.FC<{children: React.ReactNode; delay?: number; y?: number; focus?: Focus}> = ({children, delay = 0, y = 770, focus}) => {
  const f = useCurrentFrame();
  const s = sp(f, delay, {damping: 12, stiffness: 150, mass: 0.7});
  const fz = focus ? interpolate(f, [focus.a, focus.b], [focus.s0, focus.s1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)}) : 1;
  const [fx, fy] = focus ? proj(focus.lon, focus.lat) : [900, 570];
  return (
    <At y={y} style={{transform: `translate(-50%,-50%) scale(${s}) rotate(${(1 - s) * -5}deg)`}}>
      <div style={{width: 960, height: 609, border: `9px solid ${INK}`, borderRadius: 26, overflow: 'hidden', position: 'relative', background: '#cfe8f7', boxShadow: '10px 12px 0 rgba(0,0,0,.2)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 960, height: 609, transformOrigin: `${fx * SC}px ${fy * SC}px`, transform: `scale(${fz})`}}>
          <Img src={staticFile('avion/mapa.png')} style={{width: 960, height: 609, position: 'absolute', left: 0, top: 0}} />
          <svg width={960} height={609} viewBox="0 0 1800 1143" style={{position: 'absolute', left: 0, top: 0}}>
            {children}
          </svg>
        </div>
      </div>
    </At>
  );
};

/* ───────────── personaje ───────────── */

export const Narrator: React.FC<{hideUntil?: number}> = ({hideUntil = 0}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (f / FPS < hideUntil) return null;
  const speaking = V.palabras.some((w) => t >= w.s - 0.02 && t <= w.e + 0.04);
  const open = speaking && Math.floor(f / 3) % 2 === 0;
  const bob = Math.sin(f * 0.18) * 3;
  const wave = speaking ? Math.sin(f * 0.5) * 16 : Math.sin(f * 0.1) * 5;
  const blink = f % 96 > 92;
  return (
    <div style={{position: 'absolute', left: 14, top: 1098 + bob, width: 110, height: 140, filter: 'drop-shadow(0 0 3px #fff) drop-shadow(0 0 2px #fff)'}}>
      <svg width={108} height={140} viewBox="0 0 100 130" style={{overflow: 'visible'}}>
        <g stroke={INK} strokeWidth={5.5} strokeLinecap="round" fill="none">
          <line x1={50} y1={48} x2={50} y2={88} />
          <line x1={50} y1={88} x2={36} y2={122} />
          <line x1={50} y1={88} x2={64} y2={122} />
          <line x1={50} y1={60} x2={26} y2={80} />
          <line x1={50} y1={58} x2={78} y2={40 + wave} />
          <circle cx={50} cy={28} r={21} fill="#fff" />
        </g>
        <path d="M32 20 Q50 0 68 20 Z" fill={C.miel} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        {blink ? (
          <>
            <line x1={40} y1={28} x2={46} y2={28} stroke={INK} strokeWidth={3} strokeLinecap="round" />
            <line x1={54} y1={28} x2={60} y2={28} stroke={INK} strokeWidth={3} strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={43} cy={28} r={3} fill={INK} />
            <circle cx={57} cy={28} r={3} fill={INK} />
          </>
        )}
        {open ? <ellipse cx={50} cy={39} rx={7} ry={5.5} fill={INK} /> : <path d="M43 38 Q50 43 57 38" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />}
      </svg>
    </div>
  );
};

/* ───────────── globo ───────────── */

export const Globe: React.FC<{R: number; lon0: number; lat0: number; arc: [number, number][]; p: number; plane?: boolean}> = ({R, lon0, lat0, arc, p, plane}) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const pr = (lon: number, lat: number) => {
    const l = rad(lon - lon0);
    const ph = rad(lat);
    const p0 = rad(lat0);
    const vis = Math.sin(p0) * Math.sin(ph) + Math.cos(p0) * Math.cos(ph) * Math.cos(l) > 0.02;
    return {x: R * Math.cos(ph) * Math.sin(l), y: -R * (Math.cos(p0) * Math.sin(ph) - Math.sin(p0) * Math.cos(ph) * Math.cos(l)), vis};
  };
  const polyline = (pts: [number, number][]) => {
    let d = '';
    let pen = false;
    pts.forEach(([lo, la]) => {
      const q = pr(lo, la);
      if (q.vis) {
        d += `${pen ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)} `;
        pen = true;
      } else pen = false;
    });
    return d;
  };
  const lines: string[] = [];
  for (let lo = -180; lo < 180; lo += 30) lines.push(polyline(Array.from({length: 73}, (_, i) => [lo, -90 + i * 2.5] as [number, number])));
  for (let la = -60; la <= 60; la += 30) lines.push(polyline(Array.from({length: 145}, (_, i) => [-180 + i * 2.5, la] as [number, number])));
  const n = Math.max(2, Math.floor(p * (arc.length - 1)));
  const arcLL: [number, number][] = arc.slice(0, n + 1).map(([x, y]) => [(x - 831.7) / 4.65, (Math.atan(Math.sinh((763.7 - y) / 262.7)) * 180) / Math.PI]);
  return (
    <svg width={R * 2 + 40} height={R * 2 + 40} viewBox={`${-R - 20} ${-R - 20} ${R * 2 + 40} ${R * 2 + 40}`} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="gl" cx="38%" cy="32%" r="80%">
          <stop offset="0" stopColor="#E3F2FD" />
          <stop offset="1" stopColor="#64B5F6" />
        </radialGradient>
      </defs>
      <circle r={R} fill="url(#gl)" stroke={INK} strokeWidth={9} />
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={INK} strokeOpacity={0.28} strokeWidth={3} />
      ))}
      <path d={polyline(arcLL)} fill="none" stroke={RED} strokeWidth={13} strokeLinecap="round" />
      {plane && (() => {
        const e = arcLL[arcLL.length - 1];
        const q = pr(e[0], e[1]);
        return q.vis ? <text x={q.x} y={q.y} fontSize={90} textAnchor="middle" dominantBaseline="central" fontFamily={FONT}>✈️</text> : null;
      })()}
      {(['MEX', 'MAD'] as City[]).map((c) => {
        const q = pr(CITY[c].lon, CITY[c].lat);
        return q.vis ? (
          <g key={c} transform={`translate(${q.x} ${q.y})`}>
            <circle r={17} fill="#fff" stroke={INK} strokeWidth={7} />
            <circle r={7} fill={RED} />
          </g>
        ) : null;
      })}
    </svg>
  );
};

/* ───────────── escenas ───────────── */

export const MEXMAD = gc('MEX', 'MAD');
export const LONLAX = gc('LON', 'LAX');
export const NYCLON = gc('NYC', 'LON');
export const MADNYC = gc('MAD', 'NYC');
export const NBOSIN = gc('NBO', 'SIN');

const E1: React.FC<P> = () => {
  const f = useCurrentFrame();
  const p = prog(f, 26, 100);
  return (
    <>
      <At y={270} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <Logo size={140} />
      </At>
      <At y={405}>
        <T size={64} delay={3} color={TITLE}>¿Y SI TE DIGO QUE…?</T>
      </At>
      <MapCard delay={10} y={800} focus={{a: 60, b: 110, s0: 1, s1: 1.2, lon: -51, lat: 36}}>
        <Line pts={straight('MEX', 'MAD')} p={prog(f, 30, 60)} color="#555" w={10} />
        <Line pts={MEXMAD} p={p} color={RED} w={16} />
        <Dot c="MEX" />
        <Dot c="MAD" />
        <Plane pts={MEXMAD} p={p} />
      </MapCard>
      <At x={600} y={1165} style={{transform: `translate(-50%,-50%) scale(${sp(f, 60, {damping: 7, stiffness: 190, mass: 0.6})}) rotate(-2deg)`}}>
        <Chip bg={C.miel} size={42}>EN LÍNEA RECTA… ¿O NO?</Chip>
      </At>
    </>
  );
};

const E2: React.FC<P> = () => {
  const f = useCurrentFrame();
  const ps = prog(f, 14, 40);
  const pc = prog(f, 44, 105);
  return (
    <>
      <At y={330}>
        <T size={76} delay={0} color={TITLE}>CDMX → MADRID</T>
      </At>
      <MapCard y={770} focus={{a: 8, b: 60, s0: 1, s1: 1.55, lon: -51, lat: 36}}>
        <Line pts={straight('MEX', 'MAD')} p={ps} color="#444" w={11} dash />
        <Line pts={MEXMAD} p={pc} color={RED} w={17} />
        <Dot c="MEX" dx={-10} />
        <Dot c="MAD" />
        <Plane pts={MEXMAD} p={pc} />
      </MapCard>
      <At x={600} y={1150} style={{opacity: f > 20 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <div style={{display: 'flex', gap: 18, alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 34, color: INK, whiteSpace: 'nowrap'}}>
          <span style={{background: '#fff', border: `6px solid ${INK}`, borderRadius: 18, padding: '4px 16px'}}>- - - LÍNEA DEL MAPA</span>
          <span style={{background: '#fff', border: `6px solid ${RED}`, borderRadius: 18, padding: '4px 16px', color: RED}}>— RUTA REAL</span>
        </div>
      </At>
    </>
  );
};

const E3: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <>
      <At y={340}>
        <T size={80} delay={0} color={TITLE}>¿POR QUÉ?</T>
      </At>
      <At x={310} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14, {damping: 9, stiffness: 140, mass: 0.8})}) rotate(${Math.sin(f * 0.1) * 5}deg)`}}>
        <Emo c="🌍" size={330} />
      </At>
      <At x={540} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)})`}}>
        <T size={120} color={RED}>≠</T>
      </At>
      <At x={790} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 42, {damping: 9, stiffness: 140, mass: 0.8})}) rotate(4deg)`}}>
        <div style={{width: 290, height: 184, border: `8px solid ${INK}`, borderRadius: 16, overflow: 'hidden'}}>
          <Img src={staticFile('avion/mapa.png')} style={{width: 290, height: 184}} />
        </div>
      </At>
      <At x={310} y={1010} style={{opacity: f > 20 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <Chip bg={BLUE} color="#fff" size={44}>ESFERA</Chip>
      </At>
      <At x={790} y={1010} style={{opacity: f > 48 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 48)})`}}>
        <Chip bg={C.miel} size={44}>PLANO</Chip>
      </At>
    </>
  );
};

const E4: React.FC<P> = () => {
  const f = useCurrentFrame();
  const p = prog(f, 26, 80);
  return (
    <>
      <At y={330}>
        <T size={66} delay={0} color={TITLE}>CÍRCULO MÁXIMO</T>
      </At>
      <At y={730} style={{transform: `translate(-50%,-50%) scale(${sp(f, 6, {damping: 10, stiffness: 140, mass: 0.8})})`}}>
        <Globe R={350} lon0={-55 + f * 0.25} lat0={32} arc={MEXMAD} p={p} />
      </At>
      <At x={600} y={1170} style={{opacity: f > 60 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 60, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Chip bg="#fff" size={44}>EL ARCO MÁS CORTO</Chip>
      </At>
    </>
  );
};

const E5: React.FC<P> = () => {
  const f = useCurrentFrame();
  const ps = prog(f, 14, 40);
  const pc = prog(f, 44, 110);
  const [gx, gy] = proj(-49, 62.4);
  return (
    <>
      <At y={330}>
        <T size={70} delay={0} color={TITLE}>LONDRES → LA</T>
      </At>
      <MapCard y={770} focus={{a: 10, b: 60, s0: 1, s1: 1.45, lon: -60, lat: 52}}>
        <Line pts={straight('LON', 'LAX')} p={ps} color="#444" w={11} dash />
        <Line pts={LONLAX} p={pc} color={RED} w={17} />
        <Dot c="LON" dx={70} dy={-50} />
        <Dot c="LAX" dx={120} dy={72} />
        <Plane pts={LONLAX} p={pc} />
        {pc > 0.5 && (
          <g transform={`translate(${gx} ${gy - 80}) scale(${sp(f, 80, {damping: 7, stiffness: 190, mass: 0.6})})`}>
            <rect x={-270} y={-48} width={540} height={84} rx={22} fill={C.miel} stroke={INK} strokeWidth={8} />
            <text textAnchor="middle" y={12} fontFamily={FONT} fontWeight={900} fontSize={44} fill={INK}>CASI GROENLANDIA</text>
          </g>
        )}
      </MapCard>
    </>
  );
};

const E6: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <>
      <At y={330}>
        <T size={62} delay={0} color={TITLE}>MÁS LEJOS DEL ECUADOR</T>
        <T size={78} delay={4} color={RED}>MÁS CURVA</T>
      </At>
      <MapCard y={775}>
        <line x1={0} x2={1800} y1={763.7} y2={763.7} stroke={BLUE} strokeWidth={8} strokeDasharray="30 22" opacity={0.9} />
        <text x={50} y={742} fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fff" stroke={INK} strokeWidth={11} paintOrder="stroke">ECUADOR</text>
        <Line pts={NBOSIN} p={prog(f, 16, 52)} color={GREEN} w={17} />
        <Line pts={NYCLON} p={prog(f, 40, 90)} color={RED} w={17} />
        <Line pts={LONLAX} p={prog(f, 60, 110)} color={RED} w={17} />
        <Dot c="NBO" label={false} />
        <Dot c="SIN" label={false} />
        <Dot c="NYC" label={false} />
        <Dot c="LON" label={false} />
        <Dot c="LAX" label={false} />
      </MapCard>
      <At x={930} y={1160} style={{opacity: f > 60 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 60)})`}}>
        <Emo c="⬆️" size={110} />
      </At>
      <At x={530} y={1160} style={{opacity: f > 20 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <div style={{display: 'flex', gap: 14, fontFamily: FONT, fontWeight: 900, fontSize: 32, color: INK, whiteSpace: 'nowrap'}}>
          <span style={{background: '#fff', border: `6px solid ${GREEN}`, borderRadius: 18, padding: '4px 14px', color: GREEN}}>CERCA: CASI RECTA</span>
          <span style={{background: '#fff', border: `6px solid ${RED}`, borderRadius: 18, padding: '4px 14px', color: RED}}>LEJOS: CURVA</span>
        </div>
      </At>
    </>
  );
};

const E7: React.FC<P> = () => {
  const f = useCurrentFrame();
  const p = prog(f, 10, 90);
  const wig = MEXMAD.map(([x, y], i): [number, number] => [x, y + Math.sin(i * 0.28) * 30 * Math.sin((i / MEXMAD.length) * Math.PI)]);
  return (
    <>
      <At y={330}>
        <T size={66} delay={0} color={TITLE}>LA RUTA REAL</T>
        <T size={66} delay={4} color={BLUE}>SE AJUSTA</T>
      </At>
      <MapCard y={775} focus={{a: 0, b: 90, s0: 1, s1: 1.2, lon: -51, lat: 36}}>
        <Line pts={MEXMAD} p={prog(f, 4, 30)} color="#444" w={10} dash />
        <Line pts={wig} p={p} color={RED} w={17} />
        <Plane pts={wig} p={p} />
        {[0, 1, 2, 3].map((i) => {
          const x = ((f * 7 + i * 440) % 2200) - 200;
          return <path key={i} d={`M${x} ${300 + i * 150} q60 -40 120 0 t120 0 t120 0`} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.85} />;
        })}
      </MapCard>
      <At x={600} y={1150} style={{opacity: f > 24 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 24)})`}}>
        <div style={{display: 'flex', gap: 28, alignItems: 'center'}}>
          <Emo c="💨" size={90} />
          <Emo c="⛈️" size={90} />
          <Emo c="🚧" size={90} />
        </div>
      </At>
    </>
  );
};

export const E8: React.FC<P> = () => {
  const f = useCurrentFrame();
  const no = f >= 44;
  return (
    <>
      <At y={330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(${no ? 0 : Math.sin(f * 1.6) * 3}deg)`}}>
        <T size={92} color="#fff">¿SE DESVÍA?</T>
      </At>
      <At y={720} style={{transform: `translate(-50%,-50%) scale(${sp(f, 12, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Emo c={no ? '✅' : '❓'} size={230} />
      </At>
      <At y={960} style={{opacity: no ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 46, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <T size={92} color={GREEN}>NO</T>
      </At>
      <At x={610} y={1130} style={{opacity: f >= 90 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 92, {damping: 7, stiffness: 190, mass: 0.6})}) rotate(-2deg)`}}>
        <Chip bg={C.miel} size={40}>TU MAPA ES EL QUE ENGAÑA 🗺️</Chip>
      </At>
    </>
  );
};

export const E9: React.FC<P> = () => {
  const f = useCurrentFrame();
  const b = 1 + Math.sin(f * 0.35) * 0.05;
  return (
    <>
      <At y={370} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(${Math.sin(f * 0.15) * 4}deg)`}}>
        <Logo size={260} />
      </At>
      <At y={620}>
        <T size={140} delay={4}>SÍGUEME</T>
      </At>
      <At y={800}>
        <T size={76} delay={9} color={C.miel}>Y COMPÁRTELO</T>
      </At>
      <At y={990} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14) * b})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, color: '#fff', background: RED, border: `12px solid ${INK}`, borderRadius: 100, padding: '16px 56px', whiteSpace: 'nowrap'}}>+ SEGUIR</div>
      </At>
      <At x={400} y={1135} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.5) * 18}deg) scale(${sp(f, 22)})`}}>
        <Emo c="🔔" size={110} />
      </At>
      <At x={620} y={1140} style={{transform: `translate(-50%,-50%) scale(${sp(f, 26)}) translateY(${Math.sin(f * 0.3) * 8}px)`}}>
        <Emo c="✈️" size={110} />
      </At>
      <At x={830} y={1130} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)})`}}>
        <Sparkle size={100} rot={f * 3} color="#FFB300" />
      </At>
    </>
  );
};

/* ───────────── línea de tiempo ───────────── */

const PAPER: [string, string] = ['#FBF7EE', '#E9DFC8'];
const mid = (a: City, b: City): [number, number] => {
  const p = scr((CITY[a].lon + CITY[b].lon) / 2, (CITY[a].lat + CITY[b].lat) / 2 + 8);
  return p;
};
const [mx, my] = mid('MEX', 'MAD');
const [lx, ly] = scr(-60, 55);

const DEFS: Def[] = [
  {id: 'hook', key: null, bg: PAPER, C: E1, cam: [[0, 1, 540, 800], [999, 1.0, 540, 800]], shakeAt: [], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.55}, {f: 'plane', at: 40, v: 0.5}, {f: 'pop2', at: 62, v: 0.5}]},
  {id: 'mex', key: 'mira', bg: PAPER, C: E2, cam: [[0, 1, 540, 800], [999, 1.0, 540, 800]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'plane', at: 50, v: 0.5}, {f: 'ding2', at: 108, v: 0.35}]},
  {id: 'porque', key: 'por', bg: PAPER, C: E3, cam: [[0, 1, 540, 800], [30, 1.0, 540, 800], [48, 1.12, 700, 800], [999, 1.14, 700, 800]], shakeAt: [30], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 14, v: 0.55}, {f: 'hit', at: 30, v: 0.65}, {f: 'pop2', at: 42, v: 0.55}, {f: 'pop2', at: 48, v: 0.5}]},
  {id: 'circulo', key: 'en', bg: PAPER, C: E4, cam: [[0, 1, 540, 780], [30, 1.0, 540, 780], [999, 1.14, 540, 780]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'riser', at: 6, v: 0.35}, {f: 'ding2', at: 82, v: 0.5}, {f: 'sparkle', at: 86, v: 0.4}]},
  {id: 'lon', key: 'aplanarla', off: -2, bg: PAPER, C: E5, cam: [[0, 1, 540, 800], [999, 1.0, 540, 800]], shakeAt: [], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'plane', at: 50, v: 0.5}, {f: 'boom', at: 82, v: 0.7}, {f: 'sparkle', at: 88, v: 0.4}]},
  {id: 'lat', key: 'cuanto', bg: PAPER, C: E6, cam: [[0, 1, 540, 800], [999, 1.1, 540, 800]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 62, v: 0.55}]},
  {id: 'viento', key: 'ademas', bg: PAPER, C: E7, cam: [[0, 1, 540, 800], [999, 1.0, 540, 800]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'whoosh_up', at: 6, v: 0.5}, {f: 'plane', at: 12, v: 0.5}, {f: 'pop2', at: 24, v: 0.5}, {f: 'pop2', at: 30, v: 0.5}]},
  {id: 'conclusion', key: 'entonces', bg: ['#2E7D32', '#0A260C'], C: E8, cam: [[0, 1, 540, 800], [44, 1.0, 540, 900], [56, 1.14, 540, 960], [999, 1.18, 540, 960]], shakeAt: [44], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'riser', at: 20, v: 0.35}, {f: 'boom', at: 44, v: 0.7}, {f: 'ding2', at: 48, v: 0.55}, {f: 'pop2', at: 92, v: 0.55}, {f: 'sparkle', at: 96, v: 0.4}]},
  {id: 'cta', key: 'sigueme', bg: ['#4A148C', '#12052E'], C: E9, cam: [[0, 1.0, 540, 800], [999, 1.08, 540, 800]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 30, v: 0.4}]},
];

export const Avion: React.FC = () => <Video defs={DEFS} v={V} audio="voces/avion_eric.mp3" overlay={<Narrator />} />;
export const avionFrames = () => Math.ceil((V.duracion + 0.9) * FPS);
