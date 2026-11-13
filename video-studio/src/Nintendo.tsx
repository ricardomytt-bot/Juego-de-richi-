import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import data from '../public/voces/nintendo_eric.json';
import {At, C, Emo, FONT, FPS, Sparkle, T, sp, Voz} from './Miel';
import {Chip, Def, Logo, Neon, P, Video} from './Kit';

const V = data as any as Voz;
const RED = '#E53935';
const CREAM = '#FFF3E0';

const Card: React.FC<{w?: number; kind: 'sun' | 'pine' | 'plum'}> = ({w = 230, kind}) => (
  <svg width={w} height={w * 1.55} viewBox="0 0 100 155" style={{overflow: 'visible'}}>
    <rect x={3} y={3} width={94} height={149} rx={10} fill={CREAM} stroke={C.marron} strokeWidth={5} />
    <rect x={10} y={10} width={80} height={135} rx={6} fill="none" stroke={RED} strokeWidth={2.5} />
    {kind === 'sun' && (
      <>
        <circle cx={50} cy={70} r={26} fill={RED} />
        <rect x={16} y={108} width={68} height={10} fill="#222" />
        <rect x={16} y={124} width={68} height={6} fill="#222" />
      </>
    )}
    {kind === 'pine' && (
      <>
        <path d="M50 28 L74 70 H26 Z M50 52 L80 100 H20 Z" fill="#2E7D32" stroke="#1B5E20" strokeWidth={2} />
        <rect x={46} y={100} width={8} height={26} fill="#5D4037" />
      </>
    )}
    {kind === 'plum' && (
      <>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={50} cy={48} rx={11} ry={16} fill="#F06292" stroke="#AD1457" strokeWidth={1.5} transform={`rotate(${a} 50 70) translate(0 -4)`} />
        ))}
        <circle cx={50} cy={70} r={8} fill="#FFEB3B" />
        <path d="M20 128 Q50 100 80 128" stroke="#5D4037" strokeWidth={5} fill="none" />
      </>
    )}
  </svg>
);

const Eiffel: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size * 1.6} viewBox="0 0 100 160" style={{overflow: 'visible'}}>
    <path d="M50 4 L58 60 L74 120 L84 154 H66 L60 126 H40 L34 154 H16 L26 120 L42 60 Z" fill="#8D6E63" stroke={C.marron} strokeWidth={4} strokeLinejoin="round" />
    <path d="M42 60 H58 M30 100 H70 M38 126 Q50 106 62 126" stroke={C.marron} strokeWidth={3} fill="none" />
  </svg>
);

/* ───────────── escenas ───────────── */

const N1: React.FC<P> = () => {
  const f = useCurrentFrame();
  const n = counter1(f);
  return (
    <>
      <At y={320} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <Logo size={170} />
      </At>
      <At y={490}>
        <T size={70} delay={4}>¿Y SI TE DIGO QUE…?</T>
      </At>
      <At x={300} y={860} style={{transform: `translate(-50%,-50%) scale(${sp(f, 10)}) rotate(${-14 + Math.sin(f * 0.1) * 2}deg)`}}>
        <Card kind="sun" w={240} />
      </At>
      <At x={540} y={830} style={{transform: `translate(-50%,-50%) scale(${sp(f, 16)}) rotate(0deg)`}}>
        <Card kind="pine" w={260} />
      </At>
      <At x={780} y={860} style={{transform: `translate(-50%,-50%) scale(${sp(f, 22)}) rotate(${14 - Math.sin(f * 0.1) * 2}deg)`}}>
        <Card kind="plum" w={240} />
      </At>
      <At y={1100} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Neon size={170} color={RED}>{n}</Neon>
      </At>
    </>
  );
};
const counter1 = (f: number) => Math.round(interpolate(f, [24, 54], [1800, 1889], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));

const N2: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <>
      <At y={350}>
        <T size={84} delay={0}>HANAFUDA</T>
        <T size={64} delay={4} color={C.miel}>CARTAS DE KIOTO</T>
      </At>
      <At x={330} y={820} style={{transform: `translate(-50%,-50%) scale(${sp(f, 8)}) rotate(${-8 + Math.sin(f * 0.12) * 2}deg)`}}>
        <Card kind="plum" w={250} />
      </At>
      <At x={560} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14)}) rotate(${6 - Math.sin(f * 0.12) * 2}deg)`}}>
        <Card kind="sun" w={250} />
      </At>
      <At x={850} y={840} style={{transform: `translate(-50%,-50%) scale(${sp(f, 70, {damping: 8, stiffness: 150, mass: 0.7})})`, opacity: f >= 68 ? 1 : 0}}>
        <Eiffel size={190} />
      </At>
      <At x={850} y={1060} style={{transform: `translate(-50%,-50%) scale(${sp(f, 78)})`, opacity: f >= 76 ? 1 : 0}}>
        <Chip bg="#fff" size={40}>1889 TAMBIÉN</Chip>
      </At>
      <At x={400} y={1060} style={{transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <Chip bg={RED} color="#fff" size={44}>JAPÓN · 1889</Chip>
      </At>
    </>
  );
};

const N3: React.FC<P> = () => {
  const f = useCurrentFrame();
  const q = sp(f, 70, {damping: 7, stiffness: 190, mass: 0.6});
  return (
    <>
      <At y={350}>
        <T size={82} delay={0}>CASI 100 AÑOS</T>
        <T size={96} delay={4} color={C.miel}>DESPUÉS…</T>
      </At>
      <At y={820} style={{transform: `translate(-50%,-50%) scale(${sp(f, 12, {damping: 8, stiffness: 140, mass: 0.8})}) rotate(${Math.sin(f * 0.2) * 6}deg)`}}>
        <Emo c="🧢" size={340} />
      </At>
      <At y={1100} style={{opacity: f >= 68 ? 1 : 0, transform: `translate(-50%,-50%) scale(${q})`}}>
        <Chip bg={RED} color="#fff" size={56}>¿SE LLAMABA MARIO?</Chip>
      </At>
    </>
  );
};

const N4: React.FC<P> = () => {
  const f = useCurrentFrame();
  const y = 780 - Math.abs(Math.sin(f * 0.16)) * 260;
  return (
    <>
      <At y={350} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <Neon size={150} color={RED}>JUMPMAN</Neon>
      </At>
      <At x={540} y={y} style={{transform: 'translate(-50%,-50%)'}}>
        <Emo c="🧢" size={240} />
      </At>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <rect x={160} y={960} width={760} height={34} rx={10} fill="#8D6E63" stroke={C.marron} strokeWidth={8} />
      </svg>
      <At y={1100} style={{transform: `translate(-50%,-50%) scale(${sp(f, 24)})`}}>
        <Chip bg="#fff" size={46}>EL HOMBRE QUE SALTA</Chip>
      </At>
    </>
  );
};

const N5: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <>
      <At y={350}>
        <T size={72} delay={0}>EL CASERO DE LA</T>
        <T size={96} delay={4} color={C.miel}>BODEGA</T>
      </At>
      <At x={330} y={810} style={{transform: `translate(-50%,-50%) scale(${sp(f, 8)})`}}>
        <Emo c="🏭" size={280} />
      </At>
      <At x={780} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(4deg)`}}>
        <div style={{width: 400, background: '#fff', border: `10px solid ${C.marron}`, borderRadius: 28, overflow: 'hidden'}}>
          <div style={{background: '#1565C0', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 36, padding: '8px 0', textAlign: 'center'}}>NOMBRE</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.marron, textAlign: 'center', padding: '24px 10px', lineHeight: 1.05}}>MARIO<br />SEGALE</div>
        </div>
      </At>
      <At y={1090} style={{opacity: f >= 60 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 62)})`}}>
        <Chip bg={RED} color="#fff" size={46}>DE AHÍ SALIÓ “MARIO”</Chip>
      </At>
    </>
  );
};

const N6: React.FC<P> = () => {
  const f = useCurrentFrame();
  const items = ['🃏', '🏭', '🧢', '🎮'];
  return (
    <>
      <At y={350} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <T size={96} color="#fff">DE CARTAS A</T>
        <T size={110} color={C.miel}>LEYENDA</T>
      </At>
      {items.map((e, i) => (
        <At key={i} x={190 + i * 233} y={820} style={{transform: `translate(-50%,-50%) scale(${sp(f, 16 + i * 14, {damping: 8, stiffness: 160, mass: 0.6})})`}}>
          <Emo c={e} size={150} />
        </At>
      ))}
      {[0, 1, 2].map((i) => (
        <At key={i} x={306 + i * 233} y={820} style={{opacity: f >= 24 + i * 14 ? 1 : 0}}>
          <Emo c="➡️" size={64} />
        </At>
      ))}
      <At y={1060} style={{transform: `translate(-50%,-50%) scale(${sp(f, 74)})`, opacity: f >= 72 ? 1 : 0}}>
        <Chip bg={C.miel} size={46}>137 AÑOS DESPUÉS</Chip>
      </At>
    </>
  );
};

const N7: React.FC<P> = () => {
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
        <Emo c="🎮" size={110} />
      </At>
      <At x={820} y={1130} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)})`}}>
        <Sparkle size={100} rot={f * 3} color="#FFF59D" />
      </At>
    </>
  );
};

const DEFS: Def[] = [
  {id: 'hook', key: null, bg: ['#B71C1C', '#2B0707'], C: N1, cam: [[0, 1, 540, 850], [30, 1.0, 540, 850], [56, 1.12, 540, 1000], [999, 1.16, 540, 1000]], shakeAt: [30], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 10, v: 0.5}, {f: 'pop2', at: 16, v: 0.5}, {f: 'pop2', at: 22, v: 0.5}, {f: 'ticks', at: 24, v: 0.5}, {f: 'boom', at: 54, v: 0.7}]},
  {id: 'cartas', key: 'japonesas', off: -2, bg: ['#3E2723', '#150B09'], C: N2, cam: [[0, 1, 540, 820], [40, 1.0, 440, 820], [66, 1.14, 440, 820], [76, 1.0, 700, 840], [999, 1.14, 850, 840]], shakeAt: [70], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 8, v: 0.5}, {f: 'pop2', at: 14, v: 0.5}, {f: 'riser', at: 52, v: 0.35}, {f: 'hit', at: 70, v: 0.7}]},
  {id: 'mario', key: 'casi', bg: ['#6A1B9A', '#220A38'], C: N3, cam: [[0, 1, 540, 850], [60, 1.0, 540, 850], [72, 1.16, 540, 900], [999, 1.2, 540, 900]], shakeAt: [70], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 12, v: 0.55}, {f: 'riser', at: 50, v: 0.4}, {f: 'boom', at: 70, v: 0.7}]},
  {id: 'jumpman', key: 'principio', off: -1, bg: ['#1565C0', '#08204A'], C: N4, cam: [[0, 1, 540, 820], [999, 1.14, 540, 820]], shakeAt: [], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.55}, {f: 'whoosh_up', at: 20, v: 0.4}, {f: 'bloop', at: 40, v: 0.4}]},
  {id: 'casero', key: 'su', bg: ['#00695C', '#00201B'], C: N5, cam: [[0, 1, 540, 820], [30, 1.0, 780, 800], [60, 1.14, 780, 800], [999, 1.18, 700, 900]], shakeAt: [30, 62], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 8, v: 0.5}, {f: 'hit', at: 30, v: 0.65}, {f: 'kaching', at: 62, v: 0.5}]},
  {id: 'conclusion', key: 'sea', off: -1, bg: ['#2E7D32', '#0A260C'], C: N6, cam: [[0, 1, 540, 800], [999, 1.14, 540, 860]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 16, v: 0.5}, {f: 'pop2', at: 30, v: 0.5}, {f: 'pop2', at: 44, v: 0.5}, {f: 'pop2', at: 58, v: 0.5}, {f: 'ding2', at: 74, v: 0.5}]},
  {id: 'cta', key: 'sigueme', bg: ['#4A148C', '#12052E'], C: N7, cam: [[0, 1.0, 540, 800], [999, 1.08, 540, 800]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 30, v: 0.4}]},
];

export const Nintendo: React.FC = () => <Video defs={DEFS} v={V} audio="voces/nintendo_eric.mp3" />;
export const nintendoFrames = () => Math.ceil((V.duracion + 0.9) * FPS);
