import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../public/voces/gta_eric.json';
import {At, Badge, C, Captions, Emo, FONT, FPS, Sparkle, T, norm, sp, Voz} from './Miel';
import {SceneV, Kf, counter} from './Venus';

const VOCES: Record<string, Voz> = {gta_eric: data as any};
type P = {dur: number; m: Record<string, number>};
type Fx = {f: string; at: number; v?: number};

const PINK = '#FF2E93';
const CYAN = '#00E5FF';
const ORANGE = '#FF9100';

/* Zonas seguras: título y=300-560, visual y=600-1150, subtítulos y>=1240 */

const Logo: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible'}}>
    <polygon points="0,-92 80,-46 80,46 0,92 -80,46 -80,-46" fill="#FFB300" stroke={C.marron} strokeWidth={9} strokeLinejoin="round" />
    <polygon points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={5} />
    <text y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={C.marron}>?</text>
  </svg>
);

const Palm: React.FC<{h: number; sway?: number}> = ({h, sway = 0}) => (
  <svg width={h * 0.6} height={h} viewBox="0 0 120 200" style={{overflow: 'visible'}}>
    <path d="M60 200 Q66 120 58 60" stroke="#1A0033" strokeWidth={9} fill="none" strokeLinecap="round" />
    <g transform={`rotate(${sway} 58 60)`} fill="#1A0033">
      {[-70, -40, -10, 20, 50, 80].map((a, i) => (
        <path key={i} d="M58 60 Q80 30 112 48 Q84 40 58 66 Z" transform={`rotate(${a} 58 60) scale(${i % 2 ? 1 : 0.9})`} transformOrigin="58 60" />
      ))}
    </g>
  </svg>
);

const Sunset: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200">
    <defs>
      <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE082" />
        <stop offset="0.5" stopColor={ORANGE} />
        <stop offset="1" stopColor={PINK} />
      </linearGradient>
      <clipPath id="sc"><circle r={90} /></clipPath>
    </defs>
    <circle r={90} fill="url(#sun)" />
    <g clipPath="url(#sc)" fill="#1A0033">
      {[18, 38, 56, 72].map((y, i) => (
        <rect key={i} x={-100} y={y} width={200} height={3 + i * 2.2} />
      ))}
    </g>
  </svg>
);

const Neon: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties}> = ({children, size, color = PINK, style}) => (
  <div
    style={{
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      color: '#fff',
      lineHeight: 1,
      textAlign: 'center',
      whiteSpace: 'nowrap',
      textShadow: `0 0 ${size * 0.08}px ${color}, 0 0 ${size * 0.22}px ${color}, 0 0 ${size * 0.5}px ${color}`,
      WebkitTextStroke: `${size * 0.03}px ${color}`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Chip: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({children, bg = '#fff', color = C.marron, size = 54}) => (
  <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color, background: bg, border: `8px solid ${C.marron}`, borderRadius: 26, padding: '8px 28px', whiteSpace: 'nowrap'}}>{children}</div>
);

const Person: React.FC<{color: string; size: number; flip?: boolean}> = ({color, size, flip}) => (
  <svg width={size} height={size * 1.15} viewBox="-60 -70 120 140" style={{transform: flip ? 'scaleX(-1)' : undefined}}>
    <circle cx={0} cy={-34} r={26} fill={color} stroke={C.marron} strokeWidth={6} />
    <path d="M-52 66 Q-52 0 0 0 Q52 0 52 66 Z" fill={color} stroke={C.marron} strokeWidth={6} />
    <path d="M-24 -48 Q0 -76 26 -44" fill="none" stroke={C.marron} strokeWidth={6} strokeLinecap="round" />
    <circle cx={-9} cy={-34} r={4} fill={C.marron} />
    <circle cx={10} cy={-34} r={4} fill={C.marron} />
    <path d="M-9 -20 Q0 -13 10 -20" fill="none" stroke={C.marron} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

/* ───────────── escenas ───────────── */

const G1: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <>
      <At y={330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(${Math.sin(f * 0.2) * 4}deg)`}}>
        <Logo size={180} />
      </At>
      <At y={500}>
        <T size={70} delay={4}>¿Y SI TE DIGO QUE…?</T>
      </At>
      <At y={880} style={{transform: `translate(-50%,-50%) scale(${1 + Math.sin(f * 0.15) * 0.02})`}}>
        <Sunset size={620} />
      </At>
      <At x={170} y={930} style={{transform: `translate(-50%,-50%) scale(${sp(f, 8)})`}}>
        <Palm h={420} sway={Math.sin(f * 0.1) * 3} />
      </At>
      <At x={920} y={960} style={{transform: `translate(-50%,-50%) scale(${sp(f, 11)})`}}>
        <Palm h={360} sway={-Math.sin(f * 0.1) * 3} />
      </At>
      <At y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Neon size={210} color={PINK}>GTA 6</Neon>
      </At>
      <At y={1060} style={{transform: `translate(-50%,-50%) scale(${sp(f, 34, {damping: 7, stiffness: 190, mass: 0.6})}) rotate(-4deg)`}}>
        <Chip bg={C.miel} size={78}>19 DE NOVIEMBRE</Chip>
      </At>
    </>
  );
};

const G2: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const years = counter(f, (m.hace ?? 60) - 6, (m.hace ?? 60) + 26, 13);
  return (
    <>
      <At y={350} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <T size={110} color={CYAN}>¿POR QUÉ?</T>
      </At>
      <At x={270} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 20)}) rotate(-5deg)`}}>
        <div style={{background: '#1A0033', border: `10px solid ${CYAN}`, borderRadius: 30, padding: '16px 30px', textAlign: 'center'}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: CYAN}}>GTA 5</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 110, color: '#fff'}}>2013</div>
        </div>
      </At>
      <At x={810} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 34)}) rotate(5deg)`}}>
        <div style={{background: '#1A0033', border: `10px solid ${PINK}`, borderRadius: 30, padding: '16px 30px', textAlign: 'center'}}>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: PINK}}>GTA 6</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 110, color: '#fff'}}>2026</div>
        </div>
      </At>
      <At y={1060} style={{transform: `translate(-50%,-50%) scale(${sp(f, (m.hace ?? 60) - 6, {damping: 8, stiffness: 170, mass: 0.6})})`}}>
        <T size={120} color={C.miel}>{years} AÑOS</T>
      </At>
    </>
  );
};

const G3: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const sw = m.si ?? 100;
  const moved = f >= sw;
  const slam = sp(f, sw, {damping: 7, stiffness: 190, mass: 0.6});
  return (
    <>
      <At y={350}>
        <T size={96} delay={0}>¡CAMBIO</T>
        <T size={96} delay={4} color={PINK}>DE FECHA!</T>
      </At>
      <At x={330} y={830} style={{transform: `translate(-50%,-50%) scale(${sp(f, 18)}) rotate(-4deg)`, opacity: moved ? 0.55 : 1}}>
        <div style={{width: 400, background: '#fff', border: `10px solid ${C.marron}`, borderRadius: 32, overflow: 'hidden', position: 'relative'}}>
          <div style={{background: '#546E7A', color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 54, textAlign: 'center', padding: '8px 0'}}>MAYO</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 130, color: C.marron, textAlign: 'center', lineHeight: 1.2}}>26</div>
          {moved && <div style={{position: 'absolute', left: -10, right: -10, top: '50%', height: 18, background: C.rojo, transform: 'rotate(-14deg)'}} />}
        </div>
      </At>
      <At x={560} y={830} style={{opacity: moved ? 1 : 0.0, transform: `translate(-50%,-50%) scale(${slam})`}}>
        <Emo c="➡️" size={110} />
      </At>
      <At x={790} y={830} style={{opacity: moved ? 1 : 0, transform: `translate(-50%,-50%) scale(${slam}) rotate(4deg)`}}>
        <div style={{width: 400, background: '#fff', border: `10px solid ${C.marron}`, borderRadius: 32, overflow: 'hidden'}}>
          <div style={{background: PINK, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 48, textAlign: 'center', padding: '8px 0'}}>NOVIEMBRE</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 130, color: C.marron, textAlign: 'center', lineHeight: 1.2}}>19</div>
        </div>
      </At>
    </>
  );
};

const G4: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const so = m.solo ?? 100;
  return (
    <>
      <At y={350}>
        <T size={96} delay={0}>¿Y EN PC?</T>
      </At>
      <At x={330} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14)})`}}>
        <div style={{textAlign: 'center'}}>
          <Emo c="🖥️" size={230} />
          <div style={{marginTop: 8}}>
            <Chip bg={C.rojo} color="#fff" size={46}>SIN FECHA</Chip>
          </div>
        </div>
      </At>
      <At x={790} y={700} style={{transform: `translate(-50%,-50%) scale(${sp(f, so)}) rotate(-3deg)`, opacity: f >= so - 2 ? 1 : 0}}>
        <Chip bg="#1E88E5" color="#fff" size={52}>✅ PS5</Chip>
      </At>
      <At x={790} y={850} style={{transform: `translate(-50%,-50%) scale(${sp(f, so + 10)}) rotate(3deg)`, opacity: f >= so + 8 ? 1 : 0}}>
        <Chip bg="#43A047" color="#fff" size={36}>✅ XBOX SERIES</Chip>
      </At>
      <At x={330} y={1020} style={{transform: `translate(-50%,-50%) scale(${sp(f, 40)})`, opacity: f >= 38 ? 1 : 0}}>
        <T size={150} color={C.rojo}>✖</T>
      </At>
    </>
  );
};

const G5: React.FC<P> = ({m}) => {
  const f = useCurrentFrame();
  const es = m.estado ?? 110;
  return (
    <>
      <At y={350}>
        <T size={86} delay={0}>LUCIA</T>
        <T size={70} delay={4} color={PINK}>&amp; JASON</T>
      </At>
      <At x={360} y={820} style={{transform: `translate(-50%,-50%) scale(${sp(f, 10)}) translateY(${Math.sin(f * 0.15) * 8}px)`}}>
        <Person color={PINK} size={300} />
      </At>
      <At x={720} y={820} style={{transform: `translate(-50%,-50%) scale(${sp(f, 18)}) translateY(${Math.sin(f * 0.15 + 1) * 8}px)`}}>
        <Person color={CYAN} size={300} flip />
      </At>
      <At x={540} y={640} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)}) rotate(${Math.sin(f * 0.3) * 8}deg)`}}>
        <Emo c="💖" size={110} />
      </At>
      <At y={1040} style={{transform: `translate(-50%,-50%) scale(${sp(f, 40)})`}}>
        <Chip bg={C.miel} size={46}>ESTILO BONNIE Y CLYDE</Chip>
      </At>
      <At y={1140} style={{opacity: f >= es ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, es, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Chip bg={PINK} color="#fff" size={54}>🌴 LEONIDA (FICTICIO)</Chip>
      </At>
    </>
  );
};

const G6: React.FC<P> = () => {
  const f = useCurrentFrame();
  const ck = interpolate(f, [30, 48], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <At y={350} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <T size={100} color="#fff">¿VALE LA</T>
        <T size={120} color={C.miel}>ESPERA?</T>
      </At>
      <At y={860} style={{transform: `translate(-50%,-50%) scale(${sp(f, 24, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <svg width={380} height={380} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={46} fill={C.verde} stroke={C.marron} strokeWidth={5} />
          <path d="M26 52 L43 68 L75 34" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={100} strokeDashoffset={100 * (1 - ck)} />
        </svg>
      </At>
      <At y={1110} style={{transform: `translate(-50%,-50%) scale(${sp(f, 50)})`}}>
        <Chip bg={C.miel} size={50}>19 NOV · PS5 · XBOX</Chip>
      </At>
    </>
  );
};

const G7: React.FC<P> = () => {
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

/* ───────────── línea de tiempo ───────────── */

type Def = {id: string; key: string | null; bg: [string, string]; C: React.FC<P>; cam: Kf[]; marks?: Record<string, string>; shakeAt?: number[]; fx: Fx[]};
const DEFS: Def[] = [
  {id: 'hook', key: null, bg: ['#3B0A5E', '#12002A'], C: G1, cam: [[0, 1, 540, 850], [30, 1.0, 540, 850], [50, 1.14, 540, 800], [999, 1.18, 540, 800]], shakeAt: [14, 34], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'boom', at: 14, v: 0.75}, {f: 'hit', at: 34, v: 0.7}]},
  {id: 'porque', key: 'pero', bg: ['#0A2A5E', '#050B24'], C: G2, marks: {hace: 'hace'}, cam: [[0, 1, 540, 700], [30, 1.0, 540, 800], [60, 1.12, 540, 900], [999, 1.18, 540, 1000]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.55}, {f: 'hit', at: 20, v: 0.6}, {f: 'hit', at: 34, v: 0.6}, {f: 'ticks', at: 80, v: 0.5}]},
  {id: 'mayo', key: 'pero', bg: ['#B71C1C', '#2B0707'], C: G3, marks: {si: 'si'}, cam: [[0, 1, 540, 830], [40, 1.0, 540, 830], [999, 1.12, 540, 830]], shakeAt: [], fx: [{f: 'whoosh_up', at: 0, v: 0.55}, {f: 'boom', at: 3, v: 0.5}, {f: 'pop2', at: 18, v: 0.5}, {f: 'riser', at: 70, v: 0.4}]},
  {id: 'pc', key: 'todavia', bg: ['#00695C', '#00201B'], C: G4, marks: {solo: 'solo'}, cam: [[0, 1, 540, 800], [40, 1.0, 540, 800], [60, 1.1, 540, 800], [999, 1.12, 540, 800]], shakeAt: [40], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 14, v: 0.55}, {f: 'hit', at: 40, v: 0.75}, {f: 'bloop', at: 44, v: 0.5}, {f: 'ding2', at: 90, v: 0.45}]},
  {id: 'historia', key: 'historia', bg: ['#6A1B9A', '#220A38'], C: G5, marks: {estado: 'estado'}, cam: [[0, 1, 540, 820], [40, 1.0, 540, 820], [100, 1.1, 540, 900], [999, 1.16, 540, 1000]], shakeAt: [], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 10, v: 0.55}, {f: 'pop2', at: 18, v: 0.55}, {f: 'sparkle', at: 30, v: 0.45}, {f: 'hit', at: 40, v: 0.5}]},
  {id: 'conclusion', key: 'entonces', bg: ['#2E7D32', '#0A260C'], C: G6, cam: [[0, 1, 540, 800], [24, 1.0, 540, 860], [50, 1.14, 540, 860], [999, 1.18, 540, 860]], shakeAt: [24], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'riser', at: 6, v: 0.35}, {f: 'ding2', at: 28, v: 0.6}, {f: 'sparkle', at: 40, v: 0.45}]},
  {id: 'cta', key: 'sigueme', bg: ['#4A148C', '#12052E'], C: G7, cam: [[0, 1.0, 540, 800], [999, 1.08, 540, 800]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 30, v: 0.4}]},
];

const buildScenes = (v: Voz, total: number) => {
  const starts: number[] = [];
  const idxs: number[] = [];
  let from = 0;
  DEFS.forEach((d) => {
    if (d.key === null) {
      starts.push(0);
      idxs.push(0);
      return;
    }
    let idx = v.palabras.findIndex((w, k) => k >= from && norm(w.t) === d.key);
    if (idx < 0) idx = from;
    from = idx + 1;
    idxs.push(idx);
    starts.push(Math.max(0, Math.round((v.palabras[idx].s - 0.06) * FPS)));
  });
  return DEFS.map((d, i) => {
    const m: Record<string, number> = {};
    Object.entries(d.marks || {}).forEach(([name, key]) => {
      const k = v.palabras.findIndex((w, j) => j >= idxs[i] && norm(w.t) === key);
      if (k >= 0) m[name] = Math.max(0, Math.round(v.palabras[k].s * FPS) - starts[i]);
    });
    return {d, from: starts[i], dur: (i + 1 < DEFS.length ? starts[i + 1] : total) - starts[i], m};
  });
};

export const Gta: React.FC<{id: string}> = ({id}) => {
  const f = useCurrentFrame();
  const v = VOCES[id];
  const total = Math.ceil((v.duracion + 0.9) * FPS);
  const scenes = React.useMemo(() => buildScenes(v, total), [v, total]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scenes.map(({d, from, dur, m}) => (
        <Sequence key={d.id} from={from} durationInFrames={Math.max(1, dur)} layout="none">
          <Sequence from={0} durationInFrames={Math.max(1, dur)}>
            <SceneV bg={d.bg} cam={d.cam} shakeAt={d.shakeAt}>
              <d.C dur={dur} m={m} />
            </SceneV>
          </Sequence>
          {d.fx.map((e, k) => (
            <Sequence key={k} from={e.at} durationInFrames={60}>
              <Audio src={staticFile(`sfx/${e.f}.wav`)} volume={e.v ?? 0.5} />
            </Sequence>
          ))}
          {m.si !== undefined && (
            <Sequence from={m.si} durationInFrames={60}>
              <Audio src={staticFile('sfx/boom.wav')} volume={0.65} />
            </Sequence>
          )}
        </Sequence>
      ))}
      <Captions v={v} top={1240} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 14, width: `${(f / total) * 100}%`, background: C.miel}} />
      <Audio src={staticFile(`voces/${id}.mp3`)} />
    </AbsoluteFill>
  );
};

export const gtaFrames = (id: string) => Math.ceil((VOCES[id].duracion + 0.9) * FPS);
