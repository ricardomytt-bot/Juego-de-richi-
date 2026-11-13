import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import venusEric from '../public/voces/venus_eric.json';
import {At, Badge, C, Captions, Emo, FONT, FPS, Sparkle, T, norm, sp, Voz} from './Miel';

const VOCES: Record<string, Voz> = {venus_eric: venusEric as any};

export type Kf = [number, number, number, number]; // frame, escala, origen x, origen y
type Spot = {x: number; y: number; r: number; from: number; to: number};
type Fx = {f: string; at: number; v?: number};

/* ───────────── elementos del espacio ───────────── */

const Stars: React.FC<{n?: number}> = ({n = 70}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: n}).map((_, i) => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f * 0.05 + i));
        const sz = 3 + random(`s${i}`) * 6;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: random(`x${i}`) * 1080,
              top: random(`y${i}`) * 1920,
              width: sz,
              height: sz,
              borderRadius: sz,
              background: '#fff',
              opacity: tw * (0.4 + random(`o${i}`) * 0.6),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Planet: React.FC<{size: number; dir?: number; speed?: number; colors?: [string, string, string]; shade?: boolean; spin?: number}> = ({
  size,
  dir = 1,
  speed = 1.6,
  colors = ['#FFE9A8', '#FFB74D', '#C2562B'],
  shade = true,
  spin,
}) => {
  const f = useCurrentFrame();
  const off = (spin !== undefined ? spin : f * speed * dir) % 600;
  const r = 100;
  const bands = [-70, -40, -10, 22, 52, 78];
  return (
    <svg width={size} height={size} viewBox="-110 -110 220 220" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id={`pg${colors[0]}`} cx="38%" cy="34%" r="80%">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="0.55" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[2]} />
        </radialGradient>
        <clipPath id="pc">
          <circle r={r} />
        </clipPath>
        <radialGradient id="atm" cx="50%" cy="50%" r="50%">
          <stop offset="0.8" stopColor={colors[1]} stopOpacity={0.55} />
          <stop offset="1" stopColor={colors[1]} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={r + 26} fill="url(#atm)" />
      <circle r={r} fill={`url(#pg${colors[0]})`} stroke={C.marron} strokeWidth={5} />
      <g clipPath="url(#pc)">
        {bands.map((y, i) => (
          <g key={i} transform={`translate(${((off * (0.6 + (i % 3) * 0.35)) % 240) - 120},0)`}>
            {[-240, 0, 240].map((o) => (
              <path
                key={o}
                d={`M${o - 130} ${y} q40 -22 80 0 t80 0 t80 0 t80 0 v16 q-40 20 -80 0 t-80 0 t-80 0 t-80 0 z`}
                fill="#fff"
                fillOpacity={0.2 + (i % 2) * 0.12}
              />
            ))}
          </g>
        ))}
        {shade && <circle r={r} cx={-0} fill="url(#sh)" />}
        <ellipse cx={-34} cy={-44} rx={28} ry={14} fill="#fff" fillOpacity={0.28} transform="rotate(-30 -34 -44)" />
      </g>
      <defs>
        <radialGradient id="sh" cx="30%" cy="30%" r="90%">
          <stop offset="0.45" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#1a0a05" stopOpacity={0.55} />
        </radialGradient>
      </defs>
    </svg>
  );
};

const Sun: React.FC<{size: number}> = ({size}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'relative', width: size, height: size}}>
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.45,
          borderRadius: '50%',
          background: `repeating-conic-gradient(from ${f * 0.8}deg, rgba(255,214,79,.55) 0deg 10deg, transparent 10deg 22deg)`,
          WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 68%)',
          maskImage: 'radial-gradient(circle, #000 30%, transparent 68%)',
        }}
      />
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 40% 38%, #FFF59D, #FFC107 60%, #FF8F00)', border: `8px solid ${C.marron}`}} />
    </div>
  );
};

/* ───────────── marco con cámara ───────────── */

export const SceneV: React.FC<{bg: [string, string]; stars?: boolean; cam: Kf[]; spot?: Spot; shakeAt?: number[]; children: React.ReactNode}> = ({
  bg,
  stars = true,
  cam,
  spot,
  shakeAt = [],
  children,
}) => {
  const f = useCurrentFrame();
  const fs = cam.map((k) => k[0]);
  const ez = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
  const s = interpolate(f, fs, cam.map((k) => k[1]), ez);
  const ox = interpolate(f, fs, cam.map((k) => k[2]), ez);
  const oy = interpolate(f, fs, cam.map((k) => k[3]), ez);
  const enter = sp(f, 0, {damping: 16, stiffness: 240, mass: 0.5});
  const flash = interpolate(f, [0, 5], [0.7, 0], {extrapolateRight: 'clamp'});
  const shake = shakeAt.reduce((a, t) => a + (f >= t ? Math.max(0, 1 - (f - t) / 10) * 16 : 0), 0);
  const so = spot ? interpolate(f, [spot.from, spot.from + 8, spot.to - 6, spot.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  return (
    <AbsoluteFill style={{background: `linear-gradient(170deg, ${bg[0]}, ${bg[1]})`, overflow: 'hidden'}}>
      {stars && <Stars />}
      <AbsoluteFill
        style={{
          transformOrigin: `${ox}px ${oy}px`,
          transform: `translate(${Math.sin(f * 2.3) * shake}px, ${Math.cos(f * 3.1) * shake}px) scale(${s * (0.94 + 0.06 * enter)})`,
        }}
      >
        {children}
      </AbsoluteFill>
      {spot && <AbsoluteFill style={{opacity: so, background: `radial-gradient(circle at ${spot.x}px ${spot.y}px, transparent ${spot.r}px, rgba(0,0,0,.72) ${spot.r + 260}px)`}} />}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

export const counter = (f: number, a: number, b: number, to: number) =>
  Math.round(interpolate(f, [a, b], [0, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));

/* ───────────── escenas ───────────── */

type P = {dur: number};

const V1: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const p = sp(f, 0, {damping: 12, stiffness: 90, mass: 1});
  return (
    <>
      <At y={380}>
        <T size={118} delay={2}>¿Un día más</T>
        <T size={118} delay={6} color={C.miel}>largo que</T>
        <T size={118} delay={10}>un año?</T>
      </At>
      <At y={1090} style={{transform: `translate(-50%,-50%) scale(${p})`}}>
        <Planet size={640} />
      </At>
      <At x={820} y={760} style={{transform: `translate(-50%,-50%) scale(${sp(f, 16)}) rotate(${Math.sin(f * 0.3) * 10}deg)`}}>
        <Emo c="🤔" size={170} />
      </At>
    </>
  );
};

const V2: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const e = sp(f, 0, {damping: 8, stiffness: 160, mass: 0.6});
  return (
    <>
      <At y={400} style={{transform: `translate(-50%,-50%) scale(${e})`}}>
        <T size={190} color={C.verde}>¡ES REAL!</T>
      </At>
      <At y={1110} style={{transform: `translate(-50%,-50%) scale(${1 + Math.sin(f * 0.2) * 0.02})`}}>
        <Planet size={760} />
      </At>
      {[0, 1, 2].map((i) => (
        <At key={i} x={[190, 880, 800][i]} y={[760, 880, 1480][i]} style={{transform: `translate(-50%,-50%) scale(${sp(f, 6 + i * 3)})`}}>
          <Sparkle size={90} rot={f * 3} color="#FFF59D" />
        </At>
      ))}
    </>
  );
};

const V3: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const R = 300;
  const prog = interpolate(f, [8, Math.max(40, dur - 14)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const a = -Math.PI / 2 + prog * Math.PI * 2;
  const days = Math.round(prog * 225);
  return (
    <>
      <At y={330}>
        <T size={70} delay={0}>1 AÑO =</T>
        <T size={92} delay={4} color={C.miel}>1 VUELTA AL SOL</T>
      </At>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={540} cy={900} r={R} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={6} strokeDasharray="4 22" strokeLinecap="round" />
        <path d={`M540 ${900 - R} A${R} ${R} 0 ${prog > 0.5 ? 1 : 0} 1 ${540 + R * Math.cos(a)} ${900 + R * Math.sin(a)}`} fill="none" stroke={C.miel} strokeWidth={12} strokeLinecap="round" />
      </svg>
      <At y={900}>
        <Sun size={170} />
      </At>
      <At x={540 + R * Math.cos(a)} y={900 + R * Math.sin(a)}>
        <Planet size={170} />
      </At>
      <At y={1290} style={{transform: `translate(-50%,-50%) scale(${sp(f, 10)})`}}>
        <T size={130} color="#fff">{days} DÍAS</T>
      </At>
    </>
  );
};

const V4: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const n = counter(f, 6, 40, 243);
  return (
    <>
      <At y={330}>
        <T size={70} delay={0}>1 vuelta sobre</T>
        <T size={92} delay={4} color={C.miel}>sí mismo =</T>
      </At>
      <At y={900}>
        <Planet size={640} speed={2.4} />
      </At>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d="M220 900 A320 320 0 1 1 860 900" fill="none" stroke={C.miel} strokeWidth={14} strokeLinecap="round" strokeDasharray="30 24" transform={`rotate(${f * 3} 540 900)`} strokeOpacity={0.9} />
      </svg>
      <At y={1310} style={{transform: `translate(-50%,-50%) scale(${sp(f, 10, {damping: 8, stiffness: 170, mass: 0.6})})`}}>
        <T size={150} color="#fff">{n} DÍAS</T>
      </At>
    </>
  );
};

const V5: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const a = sp(f, 6, {damping: 12, stiffness: 100, mass: 0.9});
  const b = sp(f, 24, {damping: 12, stiffness: 100, mass: 0.9});
  const w = 820;
  const bar = (y: number, frac: number, color: string, label: string, val: string) => (
    <div style={{position: 'absolute', left: 130, top: y, width: w}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', WebkitTextStroke: `8px ${C.marron}`, paintOrder: 'stroke fill', marginBottom: 12}}>{label}</div>
      <div style={{width: w, height: 130, borderRadius: 30, border: `10px solid ${C.marron}`, background: 'rgba(255,255,255,.12)', overflow: 'hidden'}}>
        <div style={{width: `${frac * 100}%`, height: '100%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 24}}>
          <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 80, color: C.marron}}>{val}</span>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <At y={350}>
        <T size={128} delay={0}>¡Su día</T>
        <T size={128} delay={4} color={C.rojo}>dura más!</T>
      </At>
      {bar(640, (225 / 243) * a, '#FFB74D', 'SU AÑO 🌞', '225')}
      {bar(960, b, '#FF5252', 'SU DÍA 🔄', '243')}
      <At x={880} y={1330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 34)}) rotate(${Math.sin(f * 0.4) * 10}deg)`}}>
        <Emo c="🤯" size={230} />
      </At>
    </>
  );
};

const V6: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const g = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const jit = f > 30 && f < 46 ? Math.sin(f * 7) * 8 : 0;
  return (
    <>
      <At y={330} style={{transform: `translate(calc(-50% + ${jit}px),-50%)`}}>
        <T size={64} delay={0}>Y todavía hay más:</T>
        <T size={150} delay={5} color={C.miel}>AL REVÉS</T>
      </At>
      <At x={310} y={1110} style={{transform: `translate(-50%,-50%) scale(${sp(f, 18)})`}}>
        <Planet size={300} dir={1} speed={2} colors={['#B3E5FC', '#29B6F6', '#0D47A1']} />
      </At>
      <At x={310} y={1340}>
        <T size={56} delay={20}>TIERRA ↻</T>
      </At>
      <At x={740} y={1040} style={{transform: `translate(-50%,-50%) scale(${sp(f, 8)})`}}>
        <Planet size={500} dir={-1} speed={2.4} />
      </At>
      <At x={740} y={1340}>
        <T size={62} delay={26} color={C.miel}>VENUS ↺</T>
      </At>
    </>
  );
};

const V7: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const sunX = interpolate(f, [4, dur], [150, 600], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const sunY = interpolate(f, [4, dur], [1380, 760], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  return (
    <>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#311B92 0%,#E65100 70%,#FFB300 100%)'}} />
      <Stars n={30} />
      <At x={sunX} y={sunY}>
        <Sun size={300} />
      </At>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d="M0 1380 Q200 1320 380 1370 T760 1360 T1080 1340 V1920 H0 Z" fill="#2B1B3D" stroke={C.marron} strokeWidth={8} />
      </svg>
      <At y={330}>
        <T size={100} delay={0}>EL SOL SALE</T>
        <T size={128} delay={5} color={C.miel}>POR EL OESTE</T>
      </At>
      <At x={170} y={1250} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', background: C.rojo, border: `8px solid ${C.marron}`, borderRadius: 20, padding: '4px 24px', whiteSpace: 'nowrap'}}>← OESTE</div>
      </At>
      <At x={910} y={1250} style={{transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff', background: '#546E7A', border: `8px solid ${C.marron}`, borderRadius: 20, padding: '4px 24px', whiteSpace: 'nowrap'}}>ESTE →</div>
      </At>
    </>
  );
};

const V8: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const temp = counter(f, 6, 48, 465);
  const fill = interpolate(f, [6, 48], [0.08, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.5);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 60%, rgba(255,61,0,${0.3 + 0.25 * pulse}), transparent 70%)`}} />
      <At y={330}>
        <T size={72} delay={0}>EL MÁS CALIENTE</T>
        <T size={190} delay={4} color="#FF5252">{temp}°C</T>
      </At>
      <At x={400} y={960}>
        <div style={{position: 'relative', width: 170, height: 620, borderRadius: 95, border: `12px solid ${C.marron}`, background: '#fff', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: 'linear-gradient(0deg,#FF1744,#FF9100)'}} />
        </div>
      </At>
      <At x={400} y={1280}>
        <div style={{width: 240, height: 240, borderRadius: 120, background: '#FF1744', border: `12px solid ${C.marron}`}} />
      </At>
      <At x={770} y={980} style={{transform: `translate(-50%,-50%) scale(${1 + pulse * 0.12}) rotate(${Math.sin(f * 0.6) * 8}deg)`}}>
        <Emo c="🔥" size={330} />
      </At>
      <At x={770} y={1290} style={{transform: `translate(-50%,-50%) scale(${sp(f, 52)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 44, color: C.marron, background: '#fff', border: `8px solid ${C.marron}`, borderRadius: 22, padding: '6px 20px', whiteSpace: 'nowrap'}}>¡MÁS QUE MERCURIO!</div>
      </At>
    </>
  );
};

const V9: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const b = 1 + Math.sin(f * 0.35) * 0.05;
  return (
    <>
      <At y={430} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(${Math.sin(f * 0.15) * 4}deg)`}}>
        <svg width={420} height={420} viewBox="-100 -100 200 200">
          <polygon points="0,-92 80,-46 80,46 0,92 -80,46 -80,-46" fill="#FFB300" stroke={C.marron} strokeWidth={9} strokeLinejoin="round" />
          <polygon points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={5} />
          <text y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={C.marron}>?</text>
        </svg>
      </At>
      <At y={780}>
        <T size={84} delay={6}>¿Y SI TE DIGO</T>
        <T size={110} delay={10} color={C.miel}>QUE…?</T>
      </At>
      <At y={1130} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14) * b})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 100, color: '#fff', background: C.rojo, border: `12px solid ${C.marron}`, borderRadius: 100, padding: '18px 64px', whiteSpace: 'nowrap'}}>+ SEGUIR</div>
      </At>
      <At x={820} y={1130 + 0} style={{display: 'none'}}>
        <div />
      </At>
      <At x={850} y={1330} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.5) * 18}deg) scale(${sp(f, 20)})`}}>
        <Emo c="🔔" size={140} />
      </At>
    </>
  );
};

/* ───────────── línea de tiempo ───────────── */

type Def = {id: string; key: string | null; off?: number; bg: [string, string]; stars?: boolean; C: React.FC<P>; cam: Kf[]; spot?: Spot; shakeAt?: number[]; fx: Fx[]};
const DEFS: Def[] = [
  {id: 'hook', key: null, bg: ['#1A0B4B', '#050212'], C: V1, cam: [[0, 1, 540, 1090], [40, 1.12, 540, 1090], [999, 1.2, 540, 1090]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 12, v: 0.6}, {f: 'riser', at: 20, v: 0.35}]},
  {id: 'real', key: 'pues', bg: ['#311B92', '#0D0630'], C: V2, cam: [[0, 1.0, 540, 1100], [6, 1.16, 540, 1100], [26, 1.04, 540, 1100], [999, 1.08, 540, 1100]], shakeAt: [6], fx: [{f: 'boom', at: 4, v: 0.75}, {f: 'sparkle', at: 10, v: 0.45}]},
  {id: 'ano', key: 'un', bg: ['#0F1B4D', '#050A24'], C: V3, cam: [[0, 1, 540, 1000], [30, 1.0, 540, 1000], [90, 1.15, 540, 1000], [999, 1.15, 540, 1000]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'ticks', at: 10, v: 0.55}, {f: 'ding2', at: 80, v: 0.4}]},
  {id: 'dia', key: 'pero', bg: ['#2A0F4E', '#0A0420'], C: V4, cam: [[0, 1, 540, 900], [16, 1.0, 540, 900], [60, 1.2, 540, 1100], [999, 1.24, 540, 1310]], spot: {x: 540, y: 1310, r: 260, from: 50, to: 400}, fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'ticks', at: 6, v: 0.5}, {f: 'riser', at: 30, v: 0.4}, {f: 'hit', at: 52, v: 0.7}]},
  {id: 'comparar', key: 'su', bg: ['#4A148C', '#12052E'], C: V5, cam: [[0, 1, 540, 900], [20, 1.0, 540, 900], [36, 1.14, 540, 1000], [999, 1.16, 540, 1000]], shakeAt: [34], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'swoosh_fast', at: 6, v: 0.4}, {f: 'swoosh_fast', at: 24, v: 0.5}, {f: 'boom', at: 36, v: 0.8}, {f: 'pop2', at: 36, v: 0.6}]},
  {id: 'reves', key: 'todavia', off: -1, bg: ['#1B0A3C', '#05020F'], C: V6, cam: [[0, 1, 540, 1100], [24, 1.0, 540, 1100], [999, 1.16, 740, 1050]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'rewind', at: 8, v: 0.55}, {f: 'glitch', at: 30, v: 0.5}]},
  {id: 'oeste', key: 'por', bg: ['#311B92', '#E65100'], stars: false, C: V7, cam: [[0, 1, 540, 1380], [20, 1.0, 540, 1380], [999, 1.14, 540, 1000]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'sunrise', at: 6, v: 0.45}, {f: 'pop2', at: 16, v: 0.5}]},
  {id: 'calor', key: 'aun', off: -1, bg: ['#3E0A0A', '#120202'], stars: false, C: V8, cam: [[0, 1, 540, 1000], [10, 1.0, 540, 1000], [50, 1.12, 540, 700], [999, 1.14, 540, 700]], shakeAt: [48], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'heat', at: 4, v: 0.6}, {f: 'boom', at: 48, v: 0.75}, {f: 'ding2', at: 52, v: 0.35}]},
  {id: 'cierre', key: 'quien', bg: ['#1A0B4B', '#050212'], C: V9, cam: [[0, 1.0, 540, 900], [999, 1.08, 540, 900]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 4, v: 0.7}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 20, v: 0.4}]},
];

const buildScenes = (v: Voz, total: number) => {
  const starts: number[] = [];
  let from = 0;
  DEFS.forEach((d) => {
    if (d.key === null) {
      starts.push(0);
      return;
    }
    let idx = v.palabras.findIndex((w, k) => k >= from && norm(w.t) === d.key);
    if (idx < 0) idx = from;
    from = idx + 1;
    idx = Math.max(0, idx + (d.off || 0));
    starts.push(Math.max(0, Math.round((v.palabras[idx].s - 0.06) * FPS)));
  });
  return DEFS.map((d, i) => ({d, from: starts[i], dur: (i + 1 < DEFS.length ? starts[i + 1] : total) - starts[i]}));
};

export const Venus: React.FC<{id: string}> = ({id}) => {
  const f = useCurrentFrame();
  const v = VOCES[id];
  const total = Math.ceil((v.duracion + 0.9) * FPS);
  const scenes = React.useMemo(() => buildScenes(v, total), [v, total]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scenes.map(({d, from, dur}) => (
        <Sequence key={d.id} from={from} durationInFrames={Math.max(1, dur)} layout="none">
          <Sequence from={0} durationInFrames={Math.max(1, dur)}>
            <SceneV bg={d.bg} stars={d.stars !== false} cam={d.cam} spot={d.spot} shakeAt={d.shakeAt}>
              <d.C dur={dur} />
            </SceneV>
          </Sequence>
          {d.fx.map((e, k) => (
            <Sequence key={k} from={e.at} durationInFrames={60}>
              <Audio src={staticFile(`sfx/${e.f}.wav`)} volume={e.v ?? 0.5} />
            </Sequence>
          ))}
        </Sequence>
      ))}
      <Captions v={v} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 14, width: `${(f / total) * 100}%`, background: C.miel}} />
      <Audio src={staticFile(`voces/${id}.mp3`)} />
    </AbsoluteFill>
  );
};

export const venusFrames = (id: string) => Math.ceil((VOCES[id].duracion + 0.9) * FPS);
