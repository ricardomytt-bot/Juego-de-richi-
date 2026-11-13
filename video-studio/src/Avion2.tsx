import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {At, C, Emo, FONT, FPS, T, sp} from './Miel';
import {Chip, Def, P, Video} from './Kit';
import {
  BLUE,
  City,
  CITY,
  CARD,
  Dot,
  E8,
  E9,
  GREEN,
  Globe,
  INK,
  LONLAX,
  Line,
  MEXMAD,
  NBOSIN,
  NYCLON,
  Narrator,
  Plane,
  RED,
  SC,
  TITLE,
  V,
  gc,
  prog,
  proj,
  straight,
  toD,
} from './Avion';

/* ───────────── piezas con movimiento ───────────── */

type Cam = (f: number) => {s: number; X: number; Y: number};
const along = (pts: [number, number][], p: number) => pts[Math.min(pts.length - 1, Math.max(0, Math.floor(p * (pts.length - 1))))];

const Map2: React.FC<{children: React.ReactNode; y?: number; cam?: Cam; sway?: number; intro?: [number, number]}> = ({children, y = 775, cam, sway = 1.2, intro}) => {
  const f = useCurrentFrame();
  const c = cam ? cam(f) : {s: 1, X: 900, Y: 570};
  const e = sp(f, intro ? intro[0] : 0, {damping: 14, stiffness: 120, mass: 0.8});
  const ik = intro ? interpolate(f, intro, [2.6, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1;
  const io = intro ? interpolate(f, [intro[0], intro[0] + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const rot = Math.sin(f * 0.05) * sway;
  const tx = Math.sin(f * 0.037) * 10 * sway;
  const ty = Math.cos(f * 0.045) * 7 * sway;
  return (
    <At y={y} style={{opacity: io, transform: `translate(-50%,-50%) translate(${tx}px,${ty}px) rotate(${rot}deg) scale(${(intro ? ik : e) })`}}>
      <div style={{width: 960, height: 609, border: `9px solid ${INK}`, borderRadius: 26, overflow: 'hidden', position: 'relative', background: '#cfe8f7', boxShadow: '10px 12px 0 rgba(0,0,0,.2)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 960, height: 609, transformOrigin: `${c.X * SC}px ${c.Y * SC}px`, transform: `scale(${c.s})`}}>
          <Img src={staticFile('avion/mapa.png')} style={{width: 960, height: 609, position: 'absolute', left: 0, top: 0}} />
          <svg width={960} height={609} viewBox="0 0 1800 1143" style={{position: 'absolute', left: 0, top: 0}}>
            {children}
          </svg>
        </div>
      </div>
    </At>
  );
};

const Ants: React.FC<{pts: [number, number][]; p: number; f: number; color?: string}> = ({pts, p, f, color = '#444'}) => (
  <path d={toD(pts)} pathLength={1} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeDasharray="0.02 0.016" strokeDashoffset={-f * 0.0016} opacity={p > 0 ? 1 : 0} />
);

const Trail: React.FC<{pts: [number, number][]; p: number; len?: number}> = ({pts, p, len = 0.22}) => (
  <path d={toD(pts)} pathLength={1} fill="none" stroke="#fff" strokeWidth={20} strokeLinecap="round" strokeDasharray={`${Math.min(len, p)} 2`} strokeDashoffset={-Math.max(0, p - len)} opacity={0.9} />
);

const Cloud: React.FC<{x: number; y: number; s: number; o?: number}> = ({x, y, s, o = 0.95}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <ellipse cx={0} cy={0} rx={90} ry={34} fill="#fff" />
    <circle cx={-34} cy={-20} r={38} fill="#fff" />
    <circle cx={22} cy={-30} r={46} fill="#fff" />
    <circle cx={64} cy={-6} r={30} fill="#fff" />
  </g>
);

/* ───────────── escena 1: personaje en el avión ───────────── */

const speakingAt = (f: number) => {
  const t = f / FPS;
  return V.palabras.some((w) => t >= w.s - 0.02 && t <= w.e + 0.04);
};

const PlaneBig: React.FC<{f: number}> = ({f}) => {
  const speaking = speakingAt(f);
  const open = speaking && Math.floor(f / 3) % 2 === 0;
  const wave = speaking ? Math.sin(f * 0.5) * 12 : Math.sin(f * 0.1) * 4;
  return (
    <svg width={900} height={360} viewBox="0 0 900 360" style={{overflow: 'visible'}}>
      <defs>
        <clipPath id="win">
          <circle cx={560} cy={150} r={64} />
        </clipPath>
      </defs>
      {/* ala trasera y cola */}
      <path d="M120 150 L60 40 L150 40 L230 150 Z" fill="#E53935" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      {/* fuselaje */}
      <path d="M80 150 Q80 90 190 90 H700 Q860 90 860 170 Q860 240 700 240 H190 Q80 240 80 170 Z" fill="#fff" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <path d="M100 195 H840" stroke="#1E88E5" strokeWidth={22} strokeLinecap="round" />
      {/* ala */}
      <path d="M380 215 L300 330 L430 330 L520 215 Z" fill="#CFD8DC" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <ellipse cx={420} cy={300} rx={44} ry={20} fill="#90A4AE" stroke={INK} strokeWidth={8} />
      {/* ventanillas */}
      {[250, 320, 390, 460, 650, 730].map((x) => (
        <circle key={x} cx={x} cy={150} r={20} fill="#BBDEFB" stroke={INK} strokeWidth={6} />
      ))}
      {/* ventana del personaje */}
      <circle cx={560} cy={150} r={72} fill="#BBDEFB" stroke={INK} strokeWidth={9} />
      <g clipPath="url(#win)">
        <rect x={480} y={80} width={160} height={140} fill="#DFF3FF" />
        <path d="M485 230 Q560 170 635 230 Z" fill="#40C4FF" stroke={INK} strokeWidth={5} />
        <circle cx={560} cy={146} r={38} fill="#fff" stroke={INK} strokeWidth={6} />
        <path d="M526 134 Q560 98 594 134 Z" fill={C.miel} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={546} cy={150} r={4.5} fill={INK} />
        <circle cx={574} cy={150} r={4.5} fill={INK} />
        {open ? <ellipse cx={560} cy={168} rx={10} ry={8} fill={INK} /> : <path d="M549 166 Q560 174 571 166" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />}
        <line x1={600} y1={190} x2={632} y2={150 + wave} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      </g>
      {/* nariz */}
      <path d="M840 120 Q900 150 840 190" fill="none" stroke={INK} strokeWidth={0} />
    </svg>
  );
};

const N1: React.FC<P> = () => {
  const f = useCurrentFrame();
  const flyIn = sp(f, 0, {damping: 14, stiffness: 90, mass: 1});
  const planeOut = interpolate(f, [78, 112], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const planeScale = interpolate(f, [78, 112], [1, 0.28], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const showQ2 = f >= 72;
  const p = prog(f, 112, 132 + 40);
  const camMap: Cam = (ff) => ({s: interpolate(ff, [112, 175], [1.5, 1.15], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), X: along(MEXMAD, prog(ff, 112, 175))[0], Y: along(MEXMAD, prog(ff, 112, 175))[1]});
  return (
    <>
      {/* nubes con parallax */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: planeOut}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 1300 - ((f * (5 + i * 2) + i * 330) % 1700);
          return <Cloud key={i} x={x} y={620 + i * 140} s={0.9 + (i % 3) * 0.4} o={0.55 + (i % 2) * 0.35} />;
        })}
      </svg>
      {/* avión con el personaje */}
      <At y={880 + Math.sin(f * 0.07) * 14} x={540} style={{opacity: planeOut, transform: `translate(-50%,-50%) translate(${(1 - flyIn) * -700}px,0) rotate(${-4 + Math.sin(f * 0.05) * 2}deg) scale(${planeScale * 1.18})`}}>
        <PlaneBig f={f} />
      </At>
      {/* textos */}
      {!showQ2 ? (
        <At y={400}>
          <T size={74} delay={4} color={TITLE}>¿Y SI TE DIGO QUE</T>
          <T size={86} delay={9} color={RED}>LOS AVIONES…</T>
        </At>
      ) : (
        <At y={400}>
          <T size={74} delay={72} color={TITLE}>¿POR QUÉ SE VEN</T>
          <T size={100} delay={76} color={RED}>CURVOS?</T>
        </At>
      )}
      {/* el mapa aparece al alejar el zoom */}
      {f >= 70 && (
        <Map2 y={870} intro={[70, 118]} cam={camMap} sway={1.8}>
          <Ants pts={straight('MEX', 'MAD')} p={prog(f, 118, 140)} f={f} />
          <Line pts={MEXMAD} p={p} color={RED} w={16} />
          <Dot c="MEX" />
          <Dot c="MAD" />
          <Plane pts={MEXMAD} p={p} />
        </Map2>
      )}
    </>
  );
};

/* ───────────── escenas con mapa en movimiento ───────────── */

const N2: React.FC<P> = () => {
  const f = useCurrentFrame();
  const ps = prog(f, 10, 40);
  const pc = prog(f, 36, 112);
  const cam: Cam = (ff) => {
    const q = prog(ff, 36, 112);
    const [X, Y] = along(MEXMAD, q);
    return {s: interpolate(ff, [0, 30, 112], [1.1, 1.7, 1.55], {extrapolateRight: 'clamp'}), X, Y};
  };
  return (
    <>
      <At y={330}>
        <T size={76} delay={0} color={TITLE}>CDMX → MADRID</T>
      </At>
      <Map2 cam={cam} sway={1.4}>
        <Ants pts={straight('MEX', 'MAD')} p={ps} f={f} />
        <Line pts={MEXMAD} p={pc} color={RED} w={17} />
        <Trail pts={MEXMAD} p={pc} />
        <Dot c="MEX" dx={-10} />
        <Dot c="MAD" />
        <Plane pts={MEXMAD} p={pc} size={130} />
      </Map2>
      <At x={600} y={1150} style={{opacity: f > 20 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <div style={{display: 'flex', gap: 18, alignItems: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 34, color: INK, whiteSpace: 'nowrap'}}>
          <span style={{background: '#fff', border: `6px solid ${INK}`, borderRadius: 18, padding: '4px 16px'}}>- - - LÍNEA DEL MAPA</span>
          <span style={{background: '#fff', border: `6px solid ${RED}`, borderRadius: 18, padding: '4px 16px', color: RED}}>— RUTA REAL</span>
        </div>
      </At>
    </>
  );
};

const N3: React.FC<P> = () => {
  const f = useCurrentFrame();
  const pan = Math.sin(f * 0.05) * 60;
  return (
    <>
      <At y={340}>
        <T size={80} delay={0} color={TITLE}>¿POR QUÉ?</T>
      </At>
      <At x={310} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14, {damping: 9, stiffness: 140, mass: 0.8})})`}}>
        <Globe R={165} lon0={-60 + f * 1.2} lat0={20} arc={MEXMAD} p={prog(f, 30, 90)} plane />
      </At>
      <At x={540} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30) * (1 + Math.sin(f * 0.25) * 0.08)})`}}>
        <T size={120} color={RED}>≠</T>
      </At>
      <At x={790} y={800} style={{transform: `translate(-50%,-50%) scale(${sp(f, 42, {damping: 9, stiffness: 140, mass: 0.8})}) rotate(${4 + Math.sin(f * 0.1) * 3}deg)`}}>
        <div style={{width: 290, height: 184, border: `8px solid ${INK}`, borderRadius: 16, overflow: 'hidden', position: 'relative'}}>
          <Img src={staticFile('avion/mapa.png')} style={{width: 420, height: 267, position: 'absolute', left: -60 + pan, top: -40}} />
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

const N4: React.FC<P> = () => {
  const f = useCurrentFrame();
  const p = prog(f, 24, 100);
  return (
    <>
      <At y={330}>
        <T size={66} delay={0} color={TITLE}>CÍRCULO MÁXIMO</T>
      </At>
      <At y={730} style={{transform: `translate(-50%,-50%) scale(${sp(f, 6, {damping: 10, stiffness: 140, mass: 0.8})})`}}>
        <Globe R={350} lon0={-60 + f * 0.9} lat0={32} arc={MEXMAD} p={p} plane />
      </At>
      <At x={600} y={1170} style={{opacity: f > 60 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 60, {damping: 7, stiffness: 190, mass: 0.6})})`}}>
        <Chip bg="#fff" size={44}>EL ARCO MÁS CORTO</Chip>
      </At>
    </>
  );
};

const N5: React.FC<P> = () => {
  const f = useCurrentFrame();
  const ps = prog(f, 8, 36);
  const pc = prog(f, 30, 118);
  const [gx, gy] = proj(-49, 62.4);
  const cam: Cam = (ff) => {
    const [X, Y] = along(LONLAX, prog(ff, 30, 118));
    return {s: interpolate(ff, [0, 30, 118], [1.1, 1.55, 1.7], {extrapolateRight: 'clamp'}), X, Y};
  };
  return (
    <>
      <At y={330}>
        <T size={70} delay={0} color={TITLE}>LONDRES → LA</T>
      </At>
      <Map2 cam={cam} sway={1.3}>
        <Ants pts={straight('LON', 'LAX')} p={ps} f={f} />
        <Line pts={LONLAX} p={pc} color={RED} w={17} />
        <Trail pts={LONLAX} p={pc} />
        <Dot c="LON" dx={70} dy={-50} />
        <Dot c="LAX" dx={120} dy={72} />
        <Plane pts={LONLAX} p={pc} size={130} />
        {pc > 0.45 && (
          <g transform={`translate(${gx} ${gy - 90}) scale(${sp(f, 76, {damping: 7, stiffness: 190, mass: 0.6})})`}>
            <rect x={-270} y={-48} width={540} height={84} rx={22} fill={C.miel} stroke={INK} strokeWidth={8} />
            <text textAnchor="middle" y={12} fontFamily={FONT} fontWeight={900} fontSize={44} fill={INK}>CASI GROENLANDIA</text>
          </g>
        )}
      </Map2>
    </>
  );
};

const N6: React.FC<P> = () => {
  const f = useCurrentFrame();
  const loop = (a: number, spd: number) => ((f * spd + a) % 1);
  const cam: Cam = (ff) => ({s: interpolate(ff, [0, 160], [1.05, 1.35], {extrapolateRight: 'clamp'}), X: 900, Y: interpolate(ff, [0, 160], [790, 560], {extrapolateRight: 'clamp'})});
  return (
    <>
      <At y={330}>
        <T size={62} delay={0} color={TITLE}>MÁS LEJOS DEL ECUADOR</T>
        <T size={78} delay={4} color={RED}>MÁS CURVA</T>
      </At>
      <Map2 cam={cam} sway={1.1} y={775}>
        <line x1={0} x2={1800} y1={763.7} y2={763.7} stroke={BLUE} strokeWidth={8} strokeDasharray="30 22" opacity={0.9} />
        <text x={50} y={742} fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fff" stroke={INK} strokeWidth={11} paintOrder="stroke">ECUADOR</text>
        <Line pts={NBOSIN} p={prog(f, 12, 40)} color={GREEN} w={17} />
        <Line pts={NYCLON} p={prog(f, 30, 76)} color={RED} w={17} />
        <Line pts={LONLAX} p={prog(f, 46, 100)} color={RED} w={17} />
        <Plane pts={NBOSIN} p={loop(0.0, 0.012)} size={100} />
        <Plane pts={NYCLON} p={loop(0.3, 0.014)} size={100} />
        <Plane pts={LONLAX} p={loop(0.6, 0.01)} size={100} />
      </Map2>
      <At x={530} y={1160} style={{opacity: f > 20 ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 20)})`}}>
        <div style={{display: 'flex', gap: 14, fontFamily: FONT, fontWeight: 900, fontSize: 32, color: INK, whiteSpace: 'nowrap'}}>
          <span style={{background: '#fff', border: `6px solid ${GREEN}`, borderRadius: 18, padding: '4px 14px', color: GREEN}}>CERCA: CASI RECTA</span>
          <span style={{background: '#fff', border: `6px solid ${RED}`, borderRadius: 18, padding: '4px 14px', color: RED}}>LEJOS: CURVA</span>
        </div>
      </At>
      <At x={930} y={1160} style={{opacity: f > 60 ? 1 : 0, transform: `translate(-50%,-50%) translateY(${Math.sin(f * 0.3) * 8}px) scale(${sp(f, 60)})`}}>
        <Emo c="⬆️" size={100} />
      </At>
    </>
  );
};

const N7: React.FC<P> = () => {
  const f = useCurrentFrame();
  const p = prog(f, 8, 92);
  const wig = MEXMAD.map(([x, y], i): [number, number] => [x, y + Math.sin(i * 0.28) * 30 * Math.sin((i / MEXMAD.length) * Math.PI)]);
  const cam: Cam = (ff) => {
    const [X, Y] = along(wig, prog(ff, 8, 92));
    return {s: 1.5, X, Y};
  };
  return (
    <>
      <At y={330}>
        <T size={66} delay={0} color={TITLE}>LA RUTA REAL</T>
        <T size={66} delay={4} color={BLUE}>SE AJUSTA</T>
      </At>
      <Map2 cam={cam} sway={1.6} y={775}>
        <Ants pts={MEXMAD} p={prog(f, 2, 20)} f={f} />
        <Line pts={wig} p={p} color={RED} w={17} />
        <Trail pts={wig} p={p} />
        <Plane pts={wig} p={p} size={130} />
        {[0, 1, 2, 3, 4].map((i) => {
          const x = ((f * 11 + i * 440) % 2400) - 300;
          return <path key={i} d={`M${x} ${260 + i * 150} q60 -40 120 0 t120 0 t120 0`} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.85} />;
        })}
      </Map2>
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

/* ───────────── línea de tiempo ───────────── */

const PAPER: [string, string] = ['#FBF7EE', '#E9DFC8'];
const SKY: [string, string] = ['#BFE6FF', '#5DB8F2'];
const FLAT = (c: number): any => [[0, 1, 540, 800], [999, c, 540, 800]];

const DEFS: Def[] = [
  {id: 'hook', key: null, bg: SKY, C: N1, cam: FLAT(1), fx: [{f: 'plane', at: 0, v: 0.55}, {f: 'swoosh_in', at: 0, v: 0.45}, {f: 'pop2', at: 8, v: 0.5}, {f: 'riser', at: 62, v: 0.4}, {f: 'swoosh_out', at: 80, v: 0.55}, {f: 'boom', at: 112, v: 0.55}, {f: 'plane', at: 130, v: 0.45}]},
  {id: 'mex', key: 'mira', bg: PAPER, C: N2, cam: FLAT(1), fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'plane', at: 40, v: 0.55}, {f: 'ding2', at: 112, v: 0.35}]},
  {id: 'porque', key: 'por', bg: PAPER, C: N3, cam: FLAT(1), fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 14, v: 0.55}, {f: 'hit', at: 30, v: 0.6}, {f: 'pop2', at: 42, v: 0.55}, {f: 'riser', at: 52, v: 0.3}]},
  {id: 'circulo', key: 'en', bg: PAPER, C: N4, cam: FLAT(1), fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'riser', at: 6, v: 0.35}, {f: 'ding2', at: 98, v: 0.5}, {f: 'sparkle', at: 102, v: 0.4}]},
  {id: 'lon', key: 'aplanarla', off: -2, bg: PAPER, C: N5, cam: FLAT(1), fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'plane', at: 34, v: 0.55}, {f: 'boom', at: 76, v: 0.7}, {f: 'sparkle', at: 82, v: 0.4}]},
  {id: 'lat', key: 'cuanto', bg: PAPER, C: N6, cam: FLAT(1), fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 62, v: 0.55}, {f: 'plane', at: 70, v: 0.4}]},
  {id: 'viento', key: 'ademas', bg: PAPER, C: N7, cam: FLAT(1), fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'whoosh_up', at: 6, v: 0.5}, {f: 'plane', at: 10, v: 0.5}, {f: 'pop2', at: 24, v: 0.5}, {f: 'pop2', at: 30, v: 0.5}]},
  {id: 'conclusion', key: 'entonces', bg: ['#2E7D32', '#0A260C'], C: E8, cam: [[0, 1, 540, 800], [44, 1.0, 540, 900], [56, 1.14, 540, 960], [999, 1.18, 540, 960]], shakeAt: [44], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'riser', at: 20, v: 0.35}, {f: 'boom', at: 44, v: 0.7}, {f: 'ding2', at: 48, v: 0.55}, {f: 'pop2', at: 92, v: 0.55}, {f: 'sparkle', at: 96, v: 0.4}]},
  {id: 'cta', key: 'sigueme', bg: ['#4A148C', '#12052E'], C: E9, cam: FLAT(1.08), fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 30, v: 0.4}]},
];

export const Avion2: React.FC = () => <Video defs={DEFS} v={V} audio="voces/avion_eric.mp3" overlay={<Narrator hideUntil={4.5} />} />;
export const avion2Frames = () => Math.ceil((V.duracion + 0.9) * FPS);
