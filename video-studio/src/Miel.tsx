import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  Easing,
  random,
} from 'remotion';
import brian from '../public/voces/brian.json';
import harry from '../public/voces/harry.json';
import daniel from '../public/voces/daniel.json';
import eric from '../public/voces/eric.json';

export type Palabra = {t: string; s: number; e: number};
export type Voz = {
  voz: string;
  duracion: number;
  palabras: Palabra[];
  segmentos: {texto: string; inicio: number}[];
};
const VOCES: Record<string, Voz> = {brian, harry, daniel, eric} as any;

export const FPS = 30;
export const FONT = 'Inter, "Noto Color Emoji", sans-serif';
export const C = {
  miel: '#FFB300',
  ambar: '#FF8F00',
  marron: '#3E2723',
  crema: '#FFF8E1',
  verde: '#2ECC71',
  rojo: '#FF4D4D',
};

export const sp = (
  f: number,
  delay = 0,
  cfg: {damping?: number; stiffness?: number; mass?: number} = {damping: 11, stiffness: 150, mass: 0.6},
) => spring({frame: Math.max(0, f - delay), fps: FPS, config: cfg});

/* ───────────── piezas básicas ───────────── */

export const At: React.FC<{x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  x = 540,
  y = 960,
  children,
  style,
}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', ...style}}>{children}</div>
);

export const T: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({children, delay = 0, size = 110, color = '#fff', style}) => {
  const f = useCurrentFrame();
  const s = sp(f, delay);
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 0.98,
        textAlign: 'center',
        color,
        textTransform: 'uppercase',
        transform: `scale(${s}) rotate(${(1 - s) * -10}deg)`,
        opacity: Math.min(1, s * 2.5),
        WebkitTextStroke: `${size * 0.07}px ${C.marron}`,
        paintOrder: 'stroke fill',
        textShadow: `0 ${size * 0.06}px 0 ${C.marron}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Badge: React.FC<{n: string; x: number; y: number; delay?: number}> = ({n, x, y, delay = 0}) => {
  const f = useCurrentFrame();
  const s = sp(f, delay, {damping: 8, stiffness: 160, mass: 0.6});
  return (
    <At x={x} y={y} style={{transform: `translate(-50%,-50%) scale(${s}) rotate(${(1 - s) * 90}deg)`}}>
      <div
        style={{
          width: 190,
          height: 190,
          borderRadius: 95,
          background: C.miel,
          border: `10px solid ${C.marron}`,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 130,
          color: C.marron,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {n}
      </div>
    </At>
  );
};

export const Emo: React.FC<{c: string; size: number}> = ({c, size}) => (
  <div style={{fontSize: size, lineHeight: 1, fontFamily: FONT}}>{c}</div>
);

const hexPts = (r: number) =>
  [0, 1, 2, 3, 4, 5].map((k) => `${Math.cos(((30 + 60 * k) * Math.PI) / 180) * r},${Math.sin(((30 + 60 * k) * Math.PI) / 180) * r}`).join(' ');

const HexBg: React.FC<{dx: number; dy: number}> = ({dx, dy}) => {
  const w = 103.92;
  const h = 180;
  const pts = hexPts(58);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <pattern id="hx" width={w} height={h} patternUnits="userSpaceOnUse" patternTransform={`translate(${dx},${dy})`}>
          {[
            [0, 0],
            [w, 0],
            [0, h],
            [w, h],
            [w / 2, h / 2],
          ].map(([x, y], i) => (
            <polygon key={i} points={pts} transform={`translate(${x},${y})`} fill="none" stroke="#fff" strokeOpacity={0.16} strokeWidth={4} />
          ))}
        </pattern>
      </defs>
      <rect width={1080} height={1920} fill="url(#hx)" />
    </svg>
  );
};

const Rays: React.FC<{color?: string; opacity?: number; y?: number; speed?: number}> = ({
  color = '#fff',
  opacity = 0.22,
  y = 1000,
  speed = 0.6,
}) => {
  const f = useCurrentFrame();
  return (
    <At y={y}>
      <div
        style={{
          width: 2200,
          height: 2200,
          borderRadius: 1100,
          opacity,
          background: `repeating-conic-gradient(from ${f * speed}deg, ${color} 0deg 12deg, transparent 12deg 30deg)`,
          WebkitMaskImage: 'radial-gradient(circle, #000 18%, transparent 62%)',
          maskImage: 'radial-gradient(circle, #000 18%, transparent 62%)',
        }}
      />
    </At>
  );
};

const Jar: React.FC<{w?: number; fill?: number; crystals?: number; lid?: number; label?: string}> = ({
  w = 360,
  fill = 0.86,
  crystals = 0,
  lid = 0,
  label = 'MIEL',
}) => {
  const top = 246 - 176 * fill;
  const n = Math.round(crystals * 26);
  return (
    <svg width={w} height={w * 1.3} viewBox="0 0 200 260" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id="hon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFCB3D" />
          <stop offset="1" stopColor="#E67300" />
        </linearGradient>
        <clipPath id="jc">
          <path d="M62 44 H138 V58 Q172 70 172 108 V218 Q172 246 144 246 H56 Q28 246 28 218 V108 Q28 70 62 58 Z" />
        </clipPath>
      </defs>
      <path d="M62 44 H138 V58 Q172 70 172 108 V218 Q172 246 144 246 H56 Q28 246 28 218 V108 Q28 70 62 58 Z" fill="#FFF3C4" fillOpacity={0.35} />
      <g clipPath="url(#jc)">
        <rect x={20} y={top} width={160} height={260} fill="url(#hon)" />
        <ellipse cx={100} cy={top} rx={74} ry={7} fill="#FFD966" />
        {Array.from({length: n}).map((_, i) => {
          const cx = 40 + random(`cx${i}`) * 120;
          const cy = top + 14 + random(`cy${i}`) * (246 - top - 24);
          const sz = 5 + random(`sz${i}`) * 8;
          return <polygon key={i} points={`${cx},${cy - sz} ${cx + sz * 0.8},${cy} ${cx},${cy + sz} ${cx - sz * 0.8},${cy}`} fill="#FFF8DC" fillOpacity={0.9} stroke="#FFE08A" strokeWidth={1} />;
        })}
      </g>
      <path d="M62 44 H138 V58 Q172 70 172 108 V218 Q172 246 144 246 H56 Q28 246 28 218 V108 Q28 70 62 58 Z" fill="none" stroke={C.marron} strokeWidth={6} />
      <rect x={42} y={78} width={9} height={110} rx={4.5} fill="#fff" fillOpacity={0.5} />
      <rect x={48} y={134} width={104} height={68} rx={12} fill={C.crema} stroke={C.marron} strokeWidth={5} />
      <text x={100} y={178} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.marron}>
        {label}
      </text>
      <g transform={`translate(0,${-lid})`}>
        <rect x={55} y={8} width={90} height={36} rx={9} fill="#8D6E63" stroke={C.marron} strokeWidth={6} />
        <rect x={63} y={15} width={74} height={8} rx={4} fill="#BCAAA4" />
      </g>
    </svg>
  );
};

const Bee: React.FC<{size?: number; flap: number}> = ({size = 200, flap}) => {
  const wing = Math.sin(flap * 1.6) * 28;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
      <ellipse cx={78} cy={64} rx={30} ry={46} fill="#E3F2FD" fillOpacity={0.85} stroke={C.marron} strokeWidth={4} transform={`rotate(${-30 + wing} 90 100)`} />
      <ellipse cx={112} cy={60} rx={30} ry={46} fill="#E3F2FD" fillOpacity={0.85} stroke={C.marron} strokeWidth={4} transform={`rotate(${30 - wing} 100 100)`} />
      <clipPath id="bb">
        <ellipse cx={100} cy={116} rx={62} ry={48} />
      </clipPath>
      <ellipse cx={100} cy={116} rx={62} ry={48} fill="#FFD21F" />
      <g clipPath="url(#bb)" fill={C.marron}>
        <rect x={72} y={60} width={16} height={110} />
        <rect x={104} y={60} width={16} height={110} />
        <rect x={136} y={60} width={16} height={110} />
      </g>
      <ellipse cx={100} cy={116} rx={62} ry={48} fill="none" stroke={C.marron} strokeWidth={6} />
      <polygon points="162,116 188,110 162,128" fill={C.marron} />
      <circle cx={52} cy={104} r={13} fill="#fff" stroke={C.marron} strokeWidth={4} />
      <circle cx={49} cy={104} r={5} fill={C.marron} />
      <path d="M44 130 Q58 142 70 128" stroke={C.marron} strokeWidth={5} fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Bact: React.FC<{size?: number; dead?: number; wob?: number}> = ({size = 150, dead = 0, wob = 0}) => {
  const body = interpolateColors(dead, [0, 1], ['#7CE04A', '#9AA08F']);
  const sc = 1 - dead * 0.4;
  return (
    <svg width={size} height={size} viewBox="-70 -70 140 140" style={{overflow: 'visible', transform: `scale(${sc}, ${1 - dead * 0.2}) rotate(${wob}deg)`}}>
      {Array.from({length: 10}).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * 44} y1={Math.sin(a) * 44} x2={Math.cos(a) * 62} y2={Math.sin(a) * 62} stroke={C.marron} strokeWidth={6} strokeLinecap="round" />;
      })}
      <circle r={46} fill={body} stroke={C.marron} strokeWidth={6} />
      {dead < 0.5 ? (
        <>
          <circle cx={-16} cy={-8} r={10} fill="#fff" stroke={C.marron} strokeWidth={3} />
          <circle cx={16} cy={-8} r={10} fill="#fff" stroke={C.marron} strokeWidth={3} />
          <circle cx={-14} cy={-6} r={4.5} fill={C.marron} />
          <circle cx={18} cy={-6} r={4.5} fill={C.marron} />
          <path d="M-18 16 Q0 34 18 16" stroke={C.marron} strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-26 -16 L-8 2 M-8 -16 L-26 2 M8 -16 L26 2 M26 -16 L8 2" stroke={C.marron} strokeWidth={6} strokeLinecap="round" />
          <path d="M-16 22 H16" stroke={C.marron} strokeWidth={6} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};

export const Sparkle: React.FC<{size: number; rot: number; color?: string}> = ({size, rot, color = '#fff'}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{transform: `rotate(${rot}deg)`}}>
    <path d="M0 -48 Q4 -4 48 0 Q4 4 0 48 Q-4 4 -48 0 Q-4 -4 0 -48Z" fill={color} stroke={C.marron} strokeWidth={4} />
  </svg>
);

/* ───────────── marco de escena ───────────── */

const Scene: React.FC<{bg: [string, string]; children: React.ReactNode; dx?: number; dy?: number}> = ({bg, children, dx = 1, dy = 1}) => {
  const f = useCurrentFrame();
  const enter = sp(f, 0, {damping: 15, stiffness: 220, mass: 0.5});
  const zoom = (0.88 + 0.12 * enter) * (1 + f * 0.0014);
  const flash = interpolate(f, [0, 6], [0.85, 0], {extrapolateRight: 'clamp'});
  const shake = Math.max(0, 1 - f / 9) * 14;
  return (
    <AbsoluteFill style={{background: `linear-gradient(165deg, ${bg[0]}, ${bg[1]})`, overflow: 'hidden'}}>
      <HexBg dx={f * 1.2 * dx} dy={f * 0.9 * dy} />
      <AbsoluteFill style={{transform: `translate(${Math.sin(f * 2.2) * shake}px, ${Math.cos(f * 2.9) * shake}px) scale(${zoom})`}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

/* ───────────── escenas ───────────── */

const S1: React.FC = () => {
  const f = useCurrentFrame();
  const j = sp(f, 0, {damping: 9, stiffness: 110, mass: 0.9});
  return (
    <>
      <Rays y={1080} />
      <At y={420}>
        <T size={116} delay={2}>¿La miel</T>
        <T size={116} delay={7} color={C.miel}>nunca se echa</T>
        <T size={116} delay={12}>a perder?</T>
      </At>
      <At y={1090} style={{transform: `translate(-50%,-50%) scale(${j}) rotate(${(1 - j) * 200 + Math.sin(f * 0.22) * 4}deg)`}}>
        <Jar w={540} />
      </At>
      <At x={850} y={820} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.3) * 12}deg) scale(${sp(f, 14)})`}}>
        <Emo c="🤔" size={190} />
      </At>
    </>
  );
};

const S2: React.FC = () => {
  const f = useCurrentFrame();
  const tri = (cx: number, base: number, wd: number, ht: number, d: number) => {
    const s = sp(f, d, {damping: 12, stiffness: 120, mass: 0.8});
    return (
      <g transform={`translate(0,${(1 - s) * 500})`}>
        <polygon points={`${cx - wd / 2},${base} ${cx},${base - ht} ${cx + wd / 2},${base}`} fill="#E0A94A" stroke={C.marron} strokeWidth={8} strokeLinejoin="round" />
        <polygon points={`${cx},${base - ht} ${cx + wd / 2},${base} ${cx + 8},${base}`} fill="#B97F26" />
      </g>
    );
  };
  return (
    <>
      <Rays color="#FFF59D" y={620} opacity={0.3} />
      <At y={640} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0)})`}}>
        <div style={{width: 380, height: 380, borderRadius: 190, background: '#FFD54F', border: `12px solid ${C.marron}`}} />
      </At>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {tri(220, 1390, 520, 380, 6)}
        {tri(860, 1390, 560, 420, 10)}
        {tri(540, 1390, 760, 560, 2)}
        <rect x={0} y={1390} width={1080} height={200} fill="#C98A2C" stroke={C.marron} strokeWidth={8} />
      </svg>
      <At y={380}>
        <T size={270} delay={1} color={C.verde}>¡SÍ!</T>
      </At>
      <At y={1050}>
        <T size={92} delay={14}>La prueba está</T>
        <T size={140} delay={18} color={C.miel}>EN EGIPTO</T>
      </At>
    </>
  );
};

const S3: React.FC = () => {
  const f = useCurrentFrame();
  const open = interpolate(f, [8, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const n = Math.round(interpolate(f, [4, 60], [0, 3000], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  return (
    <>
      <At y={380}>
        <T size={72} delay={0}>Hace más de</T>
        <T size={170} delay={3} color={C.miel}>
          {n.toLocaleString('es-MX')}
        </T>
        <T size={90} delay={6}>AÑOS</T>
      </At>
      <At y={1080}>
        <div style={{width: 740, height: 760, position: 'relative'}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: '370px 370px 24px 24px', background: '#2B1B14', border: `14px solid #8D7B68`}} />
          <div style={{position: 'absolute', inset: 14, borderRadius: '350px 350px 10px 10px', background: 'radial-gradient(circle at 50% 60%, #FFB300 0%, #6D3A0B 70%)', opacity: open}} />
          {[0, 1, 2].map((i) => {
            const s = sp(f, 22 + i * 5, {damping: 8, stiffness: 160, mass: 0.6});
            const xs = [190, 370, 550];
            return (
              <div key={i} style={{position: 'absolute', left: xs[i] - 90, top: i === 1 ? 330 : 400, transform: `scale(${s})`}}>
                <Jar w={180} fill={0.8} />
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 14, top: 14, bottom: 14, width: `${(1 - open) * 50}%`, background: '#8D7B68', borderRight: '8px solid #5D4A3A', borderRadius: '350px 0 0 10px'}} />
          <div style={{position: 'absolute', right: 14, top: 14, bottom: 14, width: `${(1 - open) * 50}%`, background: '#8D7B68', borderLeft: '8px solid #5D4A3A', borderRadius: '0 350px 10px 0'}} />
        </div>
      </At>
    </>
  );
};

const S4: React.FC = () => {
  const f = useCurrentFrame();
  const j = sp(f, 0, {damping: 9, stiffness: 120, mass: 0.8});
  const ck = interpolate(f, [14, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cs = sp(f, 12, {damping: 8, stiffness: 160, mass: 0.6});
  return (
    <>
      <Rays y={1100} />
      <At y={420}>
        <T size={112} delay={1}>¡Todavía</T>
        <T size={112} delay={5}>era</T>
        <T size={128} delay={9} color={C.verde}>COMESTIBLE!</T>
      </At>
      <At y={1120} style={{transform: `translate(-50%,-50%) scale(${j}) rotate(${Math.sin(f * 0.2) * 3}deg)`}}>
        <Jar w={500} />
      </At>
      <At x={810} y={900} style={{transform: `translate(-50%,-50%) scale(${cs})`}}>
        <svg width={250} height={250} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={46} fill={C.verde} stroke={C.marron} strokeWidth={6} />
          <path d="M26 52 L43 68 L75 34" stroke="#fff" strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={100} strokeDashoffset={100 * (1 - ck)} />
        </svg>
      </At>
      {[0, 1, 2, 3].map((i) => {
        const a = f * 0.08 + (i * Math.PI) / 2;
        return (
          <At key={i} x={540 + Math.cos(a) * 400} y={1100 + Math.sin(a) * 300} style={{transform: `translate(-50%,-50%) scale(${sp(f, 16 + i * 3)})`}}>
            <Sparkle size={90} rot={f * 4} color="#FFF59D" />
          </At>
        );
      })}
    </>
  );
};

const S5: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <At y={900} style={{transform: `translate(-50%,-50%) rotate(${f * 1.2}deg)`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 1300, color: '#fff', opacity: 0.1, lineHeight: 1}}>?</div>
      </At>
      <At y={620}>
        <T size={170} delay={0}>¿CÓMO?</T>
        <T size={120} delay={5} color={C.miel}>ES POSIBLE</T>
      </At>
      <At y={1120} style={{transform: `translate(-50%,-50%) translate(${Math.sin(f * 0.25) * 140}px, ${Math.cos(f * 0.3) * 60}px) rotate(${Math.sin(f * 0.25) * 18}deg) scale(${sp(f, 8)})`}}>
        <Emo c="🔍" size={380} />
      </At>
    </>
  );
};

const S6: React.FC = () => {
  const f = useCurrentFrame();
  const dead = interpolate(f, [40, 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <Badge n="1" x={170} y={340} />
      <At x={640} y={340}>
        <T size={96} delay={3} style={{textAlign: 'left'}}>Casi sin</T>
        <T size={150} delay={8} color="#7FD6FF" style={{textAlign: 'left'}}>AGUA</T>
      </At>
      {[0, 1, 2, 3, 4].map((i) => {
        const t = (f * 0.012 + i * 0.2) % 1;
        const x = 250 + i * 145;
        return (
          <At key={i} x={x} y={1000 - t * 700 + 100} style={{transform: `translate(-50%,-50%) scale(${1 - t * 0.5})`, opacity: 1 - t * 0.8}}>
            <Emo c="💧" size={150} />
          </At>
        );
      })}
      <At x={540} y={1140}>
        <div style={{display: 'flex', gap: 30, alignItems: 'flex-end'}}>
          {[0, 1, 2].map((i) => (
            <Bact key={i} size={i === 1 ? 250 : 190} dead={dead} wob={Math.sin(f * 0.4 + i) * 10 * (1 - dead)} />
          ))}
        </div>
      </At>
      <At y={1330} style={{opacity: dead, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * dead})`}}>
        <T size={70} delay={0} color={C.rojo}>BACTERIAS FUERA ☠️</T>
      </At>
    </>
  );
};

const S7: React.FC = () => {
  const f = useCurrentFrame();
  const m = sp(f, 10, {damping: 10, stiffness: 90, mass: 1});
  const pos = interpolate(m, [0, 1], [7 / 14, 4 / 14]);
  const flee = interpolate(f, [40, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <Badge n="2" x={170} y={340} />
      <At x={650} y={340}>
        <T size={96} delay={3} style={{textAlign: 'left'}}>Es</T>
        <T size={150} delay={8} color="#B9F6CA" style={{textAlign: 'left'}}>ÁCIDA</T>
      </At>
      <At y={820}>
        <div style={{position: 'relative', width: 880, height: 70, borderRadius: 35, border: `8px solid ${C.marron}`, background: 'linear-gradient(90deg,#FF1744,#FF9100,#FFEA00,#00E676,#00B0FF,#651FFF)'}}>
          <div style={{position: 'absolute', left: `${pos * 100}%`, top: -78, transform: 'translateX(-50%)'}}>
            <Emo c="🍯" size={120} />
          </div>
          <div style={{position: 'absolute', left: 0, top: 84, fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff'}}>ÁCIDO</div>
          <div style={{position: 'absolute', right: 0, top: 84, fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff'}}>BASE</div>
        </div>
      </At>
      <At y={1020} style={{opacity: sp(f, 30)}}>
        <T size={84} delay={30}>pH ≈ 4</T>
      </At>
      <At x={540 + flee * 700} y={1270} style={{transform: `translate(-50%,-50%) rotate(${flee * 360}deg)`}}>
        <Bact size={230} dead={flee > 0.2 ? 1 : 0} />
      </At>
    </>
  );
};

const S8: React.FC = () => {
  const f = useCurrentFrame();
  const bx = 540 + Math.sin(f * 0.14) * 300;
  const by = 760 + Math.sin(f * 0.28) * 110;
  const sh = sp(f, 14, {damping: 9, stiffness: 130, mass: 0.7});
  return (
    <>
      <Badge n="3" x={170} y={340} />
      <At x={650} y={340}>
        <T size={76} delay={3} style={{textAlign: 'left'}}>Enzima de</T>
        <T size={100} delay={8} color={C.miel} style={{textAlign: 'left'}}>LAS ABEJAS</T>
      </At>
      <At x={bx} y={by} style={{transform: `translate(-50%,-50%) scaleX(${Math.cos(f * 0.14) > 0 ? 1 : -1})`}}>
        <Bee size={230} flap={f} />
      </At>
      <At y={1090} style={{transform: `translate(-50%,-50%) scale(${sh})`}}>
        <svg width={420} height={480} viewBox="0 0 100 115">
          <path d="M50 4 L92 18 V58 Q92 92 50 111 Q8 92 8 58 V18 Z" fill="#40C4FF" stroke={C.marron} strokeWidth={5} strokeLinejoin="round" />
          <path d="M50 14 L82 25 V58 Q82 84 50 100 Z" fill="#00B0FF" />
          <path d="M50 34 V78 M28 56 H72" stroke="#fff" strokeWidth={13} strokeLinecap="round" />
        </svg>
      </At>
      {[0, 1].map((i) => {
        const t = ((f * 0.025 + i * 0.5) % 1);
        const x = i === 0 ? 120 + t * 230 : 960 - t * 230;
        return (
          <At key={i} x={x} y={1120 - Math.sin(t * Math.PI) * 120}>
            <Bact size={150} dead={t > 0.85 ? 1 : 0} />
          </At>
        );
      })}
      <At y={1380} style={{transform: `translate(-50%,-50%) scale(${sp(f, 24)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: C.marron, background: '#fff', border: `8px solid ${C.marron}`, borderRadius: 24, padding: '8px 30px', whiteSpace: 'nowrap'}}>ANTISÉPTICO NATURAL</div>
      </At>
    </>
  );
};

const S9: React.FC = () => {
  const f = useCurrentFrame();
  const inf = 1 + Math.sin(f * 0.25) * 0.08;
  return (
    <>
      <Rays y={960} />
      <At y={380}>
        <T size={118} delay={0}>¿Nunca</T>
        <T size={136} delay={5} color="#fff">CADUCA?</T>
      </At>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const t = (f * 0.02 + i / 6) % 1;
        return (
          <At key={i} x={-100 + t * 1280} y={720 + (i % 3) * 330 + Math.sin(f * 0.2 + i) * 40} style={{transform: `translate(-50%,-50%) rotate(${f * 6 * (i % 2 ? 1 : -1)}deg)`}}>
            <Emo c="📅" size={150} />
          </At>
        );
      })}
      <At y={1030} style={{transform: `translate(-50%,-50%) scale(${sp(f, 6) * inf})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 720, color: C.miel, lineHeight: 1, WebkitTextStroke: `34px ${C.marron}`, paintOrder: 'stroke fill'}}>∞</div>
      </At>
    </>
  );
};

const S10: React.FC = () => {
  const f = useCurrentFrame();
  const ck = interpolate(f, [8, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cs = sp(f, 4, {damping: 8, stiffness: 150, mass: 0.7});
  return (
    <>
      <Rays color="#fff" y={1000} opacity={0.28} />
      {Array.from({length: 46}).map((_, i) => {
        const x = random(`x${i}`) * 1080;
        const v = 6 + random(`v${i}`) * 9;
        const y = ((f * v + random(`y${i}`) * 2200) % 2300) - 200;
        const col = ['#FFB300', '#FF4D4D', '#40C4FF', '#fff', '#B388FF'][i % 5];
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 22, height: 38, background: col, transform: `rotate(${f * 8 + i * 40}deg)`, borderRadius: 4}} />;
      })}
      <At y={340}>
        <T size={150} delay={0} color="#fff">¡SÍ ES</T>
        <T size={190} delay={4} color={C.miel}>VERDAD!</T>
      </At>
      <At y={1080} style={{transform: `translate(-50%,-50%) scale(${cs})`}}>
        <svg width={560} height={560} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={46} fill={C.verde} stroke={C.marron} strokeWidth={5} />
          <path d="M26 52 L43 68 L75 34" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={100} strokeDashoffset={100 * (1 - ck)} />
        </svg>
      </At>
    </>
  );
};

const S11: React.FC = () => {
  const f = useCurrentFrame();
  const lid = interpolate(sp(f, 6, {damping: 7, stiffness: 120, mass: 0.7}), [0, 1], [320, 0]);
  return (
    <>
      <At y={330}>
        <T size={104} delay={0}>GUÁRDALA</T>
        <T size={104} delay={5} color={C.miel}>BIEN CERRADA</T>
      </At>
      <At y={1030}>
        <Jar w={460} lid={lid} />
      </At>
      <At x={840} y={900} style={{transform: `translate(-50%,-50%) scale(${sp(f, 18)})`}}>
        <Emo c="🔒" size={200} />
      </At>
      {[0, 1, 2].map((i) => {
        const t = (f * 0.03 + i * 0.33) % 1;
        const x = [200, 880, 120][i];
        return (
          <At key={i} x={x + (t > 0.7 ? (i === 1 ? 1 : -1) * (t - 0.7) * 400 : 0)} y={700 + t * 420} style={{opacity: t > 0.8 ? 1 - (t - 0.8) * 5 : 1}}>
            <Emo c="💧" size={110} />
          </At>
        );
      })}
      <At y={1365} style={{opacity: sp(f, 40), transform: `translate(-50%,-50%) scale(${sp(f, 40)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 54, color: '#fff', background: C.rojo, border: `8px solid ${C.marron}`, borderRadius: 24, padding: '8px 28px', whiteSpace: 'nowrap'}}>CON HUMEDAD SE FERMENTA 🫧</div>
      </At>
    </>
  );
};

const S12: React.FC = () => {
  const f = useCurrentFrame();
  const cr = interpolate(f, [8, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <At y={330}>
        <T size={108} delay={0}>¿Se puso dura?</T>
        <T size={150} delay={6} color={C.verde}>¡ES NORMAL!</T>
      </At>
      <At y={1020} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.2) * 3}deg)`}}>
        <Jar w={480} crystals={cr} />
      </At>
      <At y={1380} style={{transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 70, color: C.marron, background: '#fff', border: `8px solid ${C.marron}`, borderRadius: 24, padding: '8px 32px'}}>CRISTALIZACIÓN</div>
      </At>
      <At x={870} y={780} style={{transform: `translate(-50%,-50%) scale(${sp(f, 26)}) rotate(${Math.sin(f * 0.3) * 10}deg)`}}>
        <Emo c="👍" size={170} />
      </At>
    </>
  );
};

const S13: React.FC = () => {
  const f = useCurrentFrame();
  const b = 1 + Math.sin(f * 0.35) * 0.06;
  return (
    <>
      <Rays y={960} opacity={0.3} />
      <At y={480}>
        <T size={170} delay={0} color="#fff">SÍGUEME</T>
        <T size={84} delay={6} color={C.miel}>PARA MÁS DATOS</T>
        <T size={84} delay={9} color={C.miel}>CURIOSOS</T>
      </At>
      <At y={930} style={{transform: `translate(-50%,-50%) scale(${sp(f, 10) * b})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 110, color: '#fff', background: C.rojo, border: `12px solid ${C.marron}`, borderRadius: 100, padding: '20px 70px'}}>+ SEGUIR</div>
      </At>
      <At y={1235} style={{transform: `translate(-50%,-50%) scale(${sp(f, 6)}) rotate(${Math.sin(f * 0.2) * 5}deg)`}}>
        <Jar w={270} />
      </At>
      <At x={850} y={1220} style={{transform: `translate(-50%,-50%) rotate(${Math.sin(f * 0.5) * 18}deg) scale(${sp(f, 16)})`}}>
        <Emo c="🔔" size={150} />
      </At>
    </>
  );
};

/* ───────────── línea de tiempo ───────────── */

type Def = {id: string; key: string | null; off?: number; bg: [string, string]; C: React.FC};
const SFX: Record<string, {f: string; at: number; v: number}[]> = {
  hook: [{f: 'pop', at: 0, v: 0.7}, {f: 'whoosh_up', at: 2, v: 0.5}],
  egipto: [{f: 'whoosh_up', at: 0, v: 0.5}, {f: 'pop', at: 3, v: 0.5}],
  tumbas: [{f: 'whoosh_down', at: 0, v: 0.5}, {f: 'click', at: 9, v: 0.5}, {f: 'sparkle', at: 24, v: 0.45}],
  comestible: [{f: 'whoosh_up', at: 0, v: 0.5}, {f: 'ding', at: 12, v: 0.6}],
  pregunta: [{f: 'whoosh_down', at: 0, v: 0.5}, {f: 'pop', at: 6, v: 0.6}],
  agua: [{f: 'whoosh_up', at: 0, v: 0.5}, {f: 'bloop', at: 45, v: 0.6}],
  acida: [{f: 'whoosh_down', at: 0, v: 0.5}, {f: 'pop', at: 12, v: 0.6}, {f: 'bloop', at: 50, v: 0.6}],
  enzima: [{f: 'whoosh_up', at: 0, v: 0.5}, {f: 'pop', at: 15, v: 0.6}, {f: 'sparkle', at: 30, v: 0.4}],
  caduca: [{f: 'whoosh_down', at: 0, v: 0.5}, {f: 'pop', at: 7, v: 0.6}],
  verdad: [{f: 'whoosh_up', at: 0, v: 0.5}, {f: 'ding', at: 6, v: 0.7}, {f: 'sparkle', at: 14, v: 0.5}],
  cerrada: [{f: 'whoosh_down', at: 0, v: 0.5}, {f: 'click', at: 18, v: 0.8}],
  cristal: [{f: 'whoosh_up', at: 0, v: 0.5}, {f: 'sparkle', at: 10, v: 0.5}],
  cta: [{f: 'whoosh_up', at: 0, v: 0.5}, {f: 'pop', at: 10, v: 0.7}, {f: 'ding', at: 14, v: 0.5}],
};
const DEFS: Def[] = [
  {id: 'hook', key: null, bg: ['#FFB300', '#FF6F00'], C: S1},
  {id: 'egipto', key: 'si', bg: ['#FFE082', '#FF9800'], C: S2},
  {id: 'tumbas', key: 'arqueologos', bg: ['#4E342E', '#1B0F0A'], C: S3},
  {id: 'comestible', key: 'cuentan', off: -1, bg: ['#FFB300', '#FF6F00'], C: S4},
  {id: 'pregunta', key: 'como', bg: ['#7E57C2', '#311B92'], C: S5},
  {id: 'agua', key: 'primero', bg: ['#29B6F6', '#01579B'], C: S6},
  {id: 'acida', key: 'segundo', bg: ['#26A69A', '#004D40'], C: S7},
  {id: 'enzima', key: 'tercero', off: -1, bg: ['#5C6BC0', '#1A237E'], C: S8},
  {id: 'caduca', key: 'entonces', bg: ['#FF8F00', '#E65100'], C: S9},
  {id: 'verdad', key: 'si', bg: ['#43A047', '#1B5E20'], C: S10},
  {id: 'cerrada', key: 'solo', bg: ['#FFB300', '#FF6F00'], C: S11},
  {id: 'cristal', key: 'pone', off: -3, bg: ['#FFCA28', '#F57F17'], C: S12},
  {id: 'cta', key: 'sigueme', bg: ['#FF8F00', '#BF360C'], C: S13},
];

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ]/g, '');

const buildScenes = (v: Voz, total: number) => {
  const starts: number[] = [];
  let from = 0;
  DEFS.forEach((d, i) => {
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

/* ───────────── subtítulos ───────────── */

export const Captions: React.FC<{v: Voz; top?: number}> = ({v, top = 1500}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const chunks = React.useMemo(() => {
    const out: Palabra[][] = [];
    let cur: Palabra[] = [];
    v.palabras.forEach((w) => {
      cur.push(w);
      if (/[,.?!:]$/.test(w.t) || cur.length >= 4) {
        out.push(cur);
        cur = [];
      }
    });
    if (cur.length) out.push(cur);
    return out;
  }, [v]);
  let ci = chunks.findIndex((c, i) => t >= c[0].s - 0.05 && (i + 1 >= chunks.length || t < chunks[i + 1][0].s - 0.05));
  if (ci < 0) return null;
  const chunk = chunks[ci];
  const pop = sp(f, Math.round((chunk[0].s - 0.05) * FPS), {damping: 14, stiffness: 260, mass: 0.4});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0px 40px', transform: `scale(${0.85 + 0.15 * pop})`}}>
      {chunk.map((w, i) => {
        const on = t >= w.s - 0.02 && t <= w.e + 0.1;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 92,
              textTransform: 'uppercase',
              color: on ? C.miel : '#fff',
              WebkitTextStroke: `10px ${C.marron}`,
              paintOrder: 'stroke fill',
              transform: on ? 'scale(1.05)' : 'scale(1)',
              display: 'inline-block',
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

/* ───────────── video completo ───────────── */

export const Miel: React.FC<{id: string; etiqueta?: boolean; extras?: boolean}> = ({id, etiqueta = true, extras = false}) => {
  const f = useCurrentFrame();
  const v = VOCES[id];
  const total = Math.ceil((v.duracion + 0.9) * FPS);
  const scenes = React.useMemo(() => buildScenes(v, total), [v, total]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scenes.map(({d, from, dur}) => (
        <Sequence key={d.id} from={from} durationInFrames={Math.max(1, dur)} layout="none">
          <Sequence from={0} durationInFrames={Math.max(1, dur)}>
            <Scene bg={d.bg}>
              <d.C />
            </Scene>
          </Sequence>
          {extras &&
            (SFX[d.id] || []).map((e, k) => (
              <Sequence key={k} from={e.at} durationInFrames={45}>
                <Audio src={staticFile(`sfx/${e.f}.wav`)} volume={e.v} />
              </Sequence>
            ))}
        </Sequence>
      ))}
      <Captions v={v} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 14, width: `${(f / total) * 100}%`, background: C.miel}} />
      {etiqueta && (
        <div style={{position: 'absolute', right: 36, top: 56, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: '#fff', background: 'rgba(0,0,0,0.45)', borderRadius: 30, padding: '8px 26px'}}>
          VOZ: {id.toUpperCase()}
        </div>
      )}
      <Audio src={staticFile(`voces/${id}.mp3`)} />
      {extras && (
        <Audio
          src={staticFile('sfx/musica.wav')}
          volume={(fr) => 0.2 * Math.min(1, fr / 30) * Math.min(1, Math.max(0, (total - fr) / 60))}
        />
      )}
    </AbsoluteFill>
  );
};
