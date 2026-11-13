import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import data from '../public/voces/banana_eric.json';
import {At, Badge, C, Emo, FONT, FPS, Sparkle, T, sp, Voz} from './Miel';
import {counter} from './Venus';
import {Chip, Def, Logo, Neon, P, Video} from './Kit';

const V = data as any as Voz;
const GREEN = '#76FF03';
const YEL = '#FFEB3B';

const Trefoil: React.FC<{size: number; glow?: number}> = ({size, glow = 0}) => {
  const polar = (r: number, a: number) => `${Math.cos((a * Math.PI) / 180) * r},${Math.sin((a * Math.PI) / 180) * r}`;
  const blade = (a: number) => `M${polar(26, a - 30)} L${polar(88, a - 30)} A88 88 0 0 1 ${polar(88, a + 30)} L${polar(26, a + 30)} A26 26 0 0 0 ${polar(26, a - 30)} Z`;
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${20 + glow * 30}px ${GREEN})`}}>
      <circle r={96} fill={YEL} stroke={C.marron} strokeWidth={8} />
      {[90, 210, 330].map((a) => (
        <path key={a} d={blade(a)} fill="#222" />
      ))}
      <circle r={14} fill="#222" />
    </svg>
  );
};

const Tile: React.FC<{num: string; sym: string; name: string; color: string; size?: number; glow?: boolean; symScale?: number}> = ({num, sym, name, color, size = 330, glow, symScale = 0.5}) => (
  <div style={{width: size, height: size, background: '#fff', border: `12px solid ${color}`, borderRadius: 36, position: 'relative', boxShadow: glow ? `0 0 60px ${color}` : 'none', textAlign: 'center'}}>
    <div style={{position: 'absolute', left: 22, top: 14, fontFamily: FONT, fontWeight: 900, fontSize: size * 0.15, color: C.marron}}>{num}</div>
    <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size * symScale, color: C.marron, lineHeight: 1.05, marginTop: size * (0.62 - symScale) * 0.55}}>{sym}</div>
    <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size * 0.13, color: C.marron}}>{name}</div>
  </div>
);

/* ───────────── escenas ───────────── */

const A1: React.FC<P> = () => {
  const f = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.3);
  return (
    <>
      <At y={320} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <Logo size={170} />
      </At>
      <At y={490}>
        <T size={70} delay={4}>¿Y SI TE DIGO QUE…?</T>
      </At>
      <At y={830} style={{transform: `translate(-50%,-50%) scale(${sp(f, 8, {damping: 8, stiffness: 140, mass: 0.8})}) rotate(${Math.sin(f * 0.2) * 5}deg)`}}>
        <Emo c="🍌" size={420} />
      </At>
      <At x={790} y={640} style={{transform: `translate(-50%,-50%) scale(${sp(f, 20, {damping: 7, stiffness: 190, mass: 0.6}) * (1 + pulse * 0.08)})`}}>
        <Trefoil size={230} glow={pulse} />
      </At>
      <At y={1110} style={{transform: `translate(-50%,-50%) scale(${sp(f, 34, {damping: 7, stiffness: 190, mass: 0.6})}) rotate(-3deg)`}}>
        <Chip bg={GREEN} size={56}>¡RADIACTIVOS!</Chip>
      </At>
    </>
  );
};

const A2: React.FC<P> = () => {
  const f = useCurrentFrame();
  const k = sp(f, 4, {damping: 9, stiffness: 140, mass: 0.7});
  const k40 = sp(f, 70, {damping: 7, stiffness: 170, mass: 0.7});
  return (
    <>
      <At y={350}>
        <T size={96} delay={0}>POTASIO</T>
      </At>
      <At x={380} y={830} style={{transform: `translate(-50%,-50%) scale(${k}) rotate(${(1 - k) * -20}deg)`}}>
        <Tile num="19" sym="K" name="POTASIO" color="#FFB300" size={380} />
      </At>
      <At x={790} y={830} style={{transform: `translate(-50%,-50%) scale(${k40})`, opacity: f >= 68 ? 1 : 0}}>
        <Tile num="19" sym="K-40" name="RADIACTIVO" color={GREEN} size={320} glow symScale={0.3} />
      </At>
      <At x={790} y={640} style={{opacity: f >= 76 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 76)})`}}>
        <Trefoil size={110} />
      </At>
      <At y={1110} style={{opacity: f >= 40 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 40)})`}}>
        <Chip bg="#fff" size={46}>UNA PARTE MÍNIMA</Chip>
      </At>
    </>
  );
};

const A3: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const nada = m.nada ?? 80;
  const needle = -78 + Math.sin(f * 0.6) * (f > nada ? 0.6 : 3);
  return (
    <>
      <At y={350} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <T size={92} color={C.rojo}>¿PELIGROSO?</T>
      </At>
      <At y={840} style={{transform: `translate(-50%,-50%) scale(${sp(f, 10)})`}}>
        <svg width={760} height={470} viewBox="-190 -190 380 235" style={{overflow: 'visible'}}>
          <defs>
            <linearGradient id="gg" x1="0" x2="1">
              <stop offset="0" stopColor="#00E676" />
              <stop offset="0.5" stopColor="#FFEB3B" />
              <stop offset="1" stopColor="#FF1744" />
            </linearGradient>
          </defs>
          <path d="M-170 0 A170 170 0 0 1 170 0" fill="none" stroke="url(#gg)" strokeWidth={42} strokeLinecap="round" />
          <path d="M-170 0 A170 170 0 0 1 170 0" fill="none" stroke={C.marron} strokeWidth={4} transform="scale(1.13)" strokeOpacity={0.0} />
          <g transform={`rotate(${needle})`}>
            <line x1={0} y1={0} x2={0} y2={-150} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
            <circle r={22} fill="#fff" stroke={C.marron} strokeWidth={8} />
          </g>
        </svg>
      </At>
      <At y={1090} style={{transform: `translate(-50%,-50%) scale(${sp(f, nada)})`, opacity: f >= nada - 2 ? 1 : 0}}>
        <Chip bg={C.verde} color="#fff" size={52}>DOSIS MINÚSCULA ≈ 0.1 µSv</Chip>
      </At>
    </>
  );
};

const A4: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const ac = m.acumula ?? 100;
  return (
    <>
      <At y={350}>
        <T size={82} delay={0}>TU CUERPO</T>
        <T size={96} delay={4} color={C.miel}>LO REGULA</T>
      </At>
      {[0, 1, 2].map((i) => (
        <At key={i} x={250 + i * 280} y={720} style={{transform: `translate(-50%,-50%) scale(${sp(f, 24 + i * 16)}) rotate(${Math.sin(f * 0.2 + i) * 8}deg)`}}>
          <Emo c="🍌" size={190} />
        </At>
      ))}
      <At y={980}>
        <div style={{width: 760, height: 90, borderRadius: 45, border: `10px solid ${C.marron}`, background: 'rgba(255,255,255,.18)', overflow: 'hidden'}}>
          <div style={{width: '55%', height: '100%', background: 'linear-gradient(90deg,#FFEB3B,#FF9100)'}} />
        </div>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 42, color: '#fff', textAlign: 'center', marginTop: 12}}>POTASIO EN TU CUERPO</div>
      </At>
      <At x={860} y={980} style={{opacity: f >= ac ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, ac, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Emo c="🔒" size={130} />
      </At>
      <At y={1140} style={{opacity: f >= ac ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, ac)})`}}>
        <Chip bg={C.verde} color="#fff" size={50}>NO SE ACUMULA</Chip>
      </At>
    </>
  );
};

const A5: React.FC<P> = () => {
  const f = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.3);
  return (
    <>
      <At y={350}>
        <T size={92} delay={0}>¡TÚ TAMBIÉN!</T>
      </At>
      <At y={830} style={{transform: `translate(-50%,-50%) scale(${sp(f, 6, {damping: 9, stiffness: 140, mass: 0.8})})`}}>
        <svg width={420} height={480} viewBox="-60 -70 120 140" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${24 + pulse * 28}px ${GREEN})`}}>
          <circle cx={0} cy={-34} r={26} fill="#FFCC80" stroke={C.marron} strokeWidth={4} />
          <path d="M-52 66 Q-52 0 0 0 Q52 0 52 66 Z" fill="#40C4FF" stroke={C.marron} strokeWidth={4} />
          <circle cx={-9} cy={-34} r={3.5} fill={C.marron} />
          <circle cx={10} cy={-34} r={3.5} fill={C.marron} />
          <path d="M-9 -22 Q0 -14 10 -22" fill="none" stroke={C.marron} strokeWidth={3.5} strokeLinecap="round" />
        </svg>
      </At>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = f * 0.05 + i * 1.25;
        return (
          <At key={i} x={540 + Math.cos(a) * 330} y={830 + Math.sin(a) * 260} style={{transform: 'translate(-50%,-50%)', opacity: 0.7 + 0.3 * Math.sin(f * 0.4 + i)}}>
            <div style={{width: 26, height: 26, borderRadius: 13, background: GREEN, boxShadow: `0 0 24px ${GREEN}`}} />
          </At>
        );
      })}
      <At x={800} y={600} style={{transform: `translate(-50%,-50%) scale(${sp(f, 24, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Trefoil size={150} glow={pulse} />
      </At>
      <At y={1110} style={{transform: `translate(-50%,-50%) scale(${sp(f, 40)})`}}>
        <Chip bg="#fff" size={46}>UN POQUITO RADIACTIVO</Chip>
      </At>
    </>
  );
};

const A6: React.FC<P> = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [20, 90], [160, 760], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <>
      <At y={350}>
        <T size={76} delay={0}>EL PLÁTANO COMO</T>
        <T size={100} delay={4} color={YEL}>MEDIDA</T>
      </At>
      <At y={860}>
        <svg width={900} height={200} viewBox="0 0 900 200">
          <rect x={20} y={70} width={860} height={70} rx={14} fill="#FFE082" stroke={C.marron} strokeWidth={8} />
          {Array.from({length: 15}).map((_, i) => (
            <line key={i} x1={50 + i * 58} y1={70} x2={50 + i * 58} y2={i % 2 ? 100 : 118} stroke={C.marron} strokeWidth={6} />
          ))}
        </svg>
      </At>
      <At x={x} y={780} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.25) * 8}deg)`}}>
        <Emo c="🍌" size={170} />
      </At>
      <At y={1060} style={{transform: `translate(-50%,-50%) scale(${sp(f, 60)})`, opacity: f >= 58 ? 1 : 0}}>
        <Chip bg="#fff" size={44}>APROXIMADA, NO PERFECTA</Chip>
      </At>
    </>
  );
};

const A7: React.FC<P> = () => {
  const f = useCurrentFrame();
  const calm = f >= 40;
  return (
    <>
      <At y={350} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(${calm ? 0 : Math.sin(f * 1.8) * 3}deg)`}}>
        <T size={110} color="#fff">¿TE ASUSTAS?</T>
      </At>
      <At y={830} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Emo c={calm ? '✅' : '❌'} size={300} />
      </At>
      <At y={1060} style={{opacity: calm ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 42)})`}}>
        <Chip bg={YEL} size={52}>COME TRANQUILO 🍌</Chip>
      </At>
    </>
  );
};

const A8: React.FC<P> = () => {
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
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, color: '#fff', background: C.rojo, border: `12px solid ${C.marron}`, borderRadius: 100, padding: '16px 56px', whiteSpace: 'nowrap'}}>+ SEGUIR</div>
      </At>
      <At x={260} y={1130} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.5) * 18}deg) scale(${sp(f, 22)})`}}>
        <Emo c="🔔" size={110} />
      </At>
      <At x={540} y={1140} style={{transform: `translate(-50%,-50%) scale(${sp(f, 26)}) translateY(${Math.sin(f * 0.3) * 8}px)`}}>
        <Emo c="🍌" size={110} />
      </At>
      <At x={820} y={1130} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)})`}}>
        <Sparkle size={100} rot={f * 3} color="#FFF59D" />
      </At>
    </>
  );
};

const DEFS: Def[] = [
  {id: 'hook', key: null, bg: ['#1B5E20', '#04140A'], C: A1, cam: [[0, 1, 540, 850], [30, 1.0, 540, 850], [55, 1.14, 600, 800], [999, 1.18, 600, 800]], shakeAt: [20, 34], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 8, v: 0.6}, {f: 'boom', at: 20, v: 0.7}, {f: 'hit', at: 34, v: 0.6}]},
  {id: 'potasio', key: 'tienen', off: -1, bg: ['#4A148C', '#14052B'], C: A2, cam: [[0, 1, 540, 830], [40, 1.0, 380, 830], [60, 1.15, 380, 830], [70, 1.0, 560, 830], [999, 1.12, 790, 830]], shakeAt: [70], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.55}, {f: 'riser', at: 44, v: 0.4}, {f: 'boom', at: 70, v: 0.7}, {f: 'sparkle', at: 76, v: 0.4}]},
  {id: 'peligroso', key: 'peligroso', off: -2, bg: ['#B71C1C', '#2B0707'], C: A3, marks: {nada: 'nada'}, markFx: {nada: [{f: 'ding2', at: 0, v: 0.55}, {f: 'sparkle', at: 4, v: 0.4}]}, cam: [[0, 1, 540, 840], [30, 1.0, 540, 840], [999, 1.14, 540, 900]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 4, v: 0.55}, {f: 'ticks', at: 20, v: 0.5}]},
  {id: 'acumula', key: 'aqui', off: -1, bg: ['#00695C', '#00201B'], C: A4, marks: {acumula: 'acumula'}, markFx: {acumula: [{f: 'hit', at: 0, v: 0.7}, {f: 'click', at: 4, v: 0.6}]}, cam: [[0, 1, 540, 700], [60, 1.0, 540, 850], [999, 1.14, 540, 1000]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 24, v: 0.5}, {f: 'pop2', at: 40, v: 0.5}, {f: 'pop2', at: 56, v: 0.5}]},
  {id: 'tu', key: 'hecho', off: -1, bg: ['#0D47A1', '#050F2E'], C: A5, cam: [[0, 1, 540, 830], [30, 1.0, 540, 830], [999, 1.2, 540, 830]], shakeAt: [24], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'riser', at: 6, v: 0.35}, {f: 'boom', at: 24, v: 0.65}, {f: 'sparkle', at: 30, v: 0.4}]},
  {id: 'medida', key: 'cientificos', off: -3, bg: ['#F57F17', '#5D2600'], C: A6, cam: [[0, 1, 540, 850], [20, 1.0, 160, 800], [90, 1.16, 760, 800], [999, 1.18, 760, 800]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'whoosh_up', at: 20, v: 0.45}, {f: 'ticks', at: 30, v: 0.4}, {f: 'pop2', at: 60, v: 0.55}]},
  {id: 'conclusion', key: 'entonces', bg: ['#2E7D32', '#0A260C'], C: A7, cam: [[0, 1, 540, 800], [40, 1.0, 540, 800], [54, 1.14, 540, 830], [999, 1.18, 540, 830]], shakeAt: [40], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'hit', at: 14, v: 0.6}, {f: 'ding2', at: 42, v: 0.6}, {f: 'sparkle', at: 48, v: 0.45}]},
  {id: 'cta', key: 'sigueme', bg: ['#4A148C', '#12052E'], C: A8, cam: [[0, 1.0, 540, 800], [999, 1.08, 540, 800]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 30, v: 0.4}]},
];

export const Banana: React.FC = () => <Video defs={DEFS} v={V} audio="voces/banana_eric.mp3" />;
export const bananaFrames = () => Math.ceil((V.duracion + 0.9) * FPS);
