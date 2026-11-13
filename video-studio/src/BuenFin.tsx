import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import data from '../public/voces/buenfin_jessica.json';
import {At, Badge, C, Captions, Emo, FONT, FPS, Sparkle, T, norm, sp, Voz} from './Miel';
import {SceneV, Kf, counter} from './Venus';

const VOCES: Record<string, Voz> = {buenfin_jessica: data as any};
type P = {dur: number};
type Fx = {f: string; at: number; v?: number};

/* Zonas seguras: título y=300-560, visual y=600-1150, subtítulos y>=1240 (TikTok/YouTube tapan arriba y abajo) */

const Logo: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible'}}>
    <polygon points="0,-92 80,-46 80,46 0,92 -80,46 -80,-46" fill="#FFB300" stroke={C.marron} strokeWidth={9} strokeLinejoin="round" />
    <polygon points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={5} />
    <text y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={C.marron}>?</text>
  </svg>
);

const Tag: React.FC<{price: string; color?: string; w?: number; strike?: boolean}> = ({price, color = '#fff', w = 560, strike}) => (
  <div style={{position: 'relative', width: w, height: w * 0.5, background: '#FFF8E1', border: `10px solid ${C.marron}`, borderRadius: 36, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{position: 'absolute', left: 30, top: '50%', width: 34, height: 34, borderRadius: 17, background: '#12052E', border: `6px solid ${C.marron}`, transform: 'translateY(-50%)'}} />
    <span style={{fontFamily: FONT, fontWeight: 900, fontSize: w * 0.2, color, marginLeft: 40, textDecoration: strike ? 'line-through' : 'none', textDecorationThickness: 12}}>{price}</span>
  </div>
);

const fmt = (n: number) => '$' + n.toLocaleString('en-US');

/* ───────────── escenas ───────────── */

const B1: React.FC<P> = () => {
  const f = useCurrentFrame();
  const n = counter(f, 26, 56, 400) + 1000;
  const up = f > 26;
  return (
    <>
      <At y={330} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})}) rotate(${Math.sin(f * 0.2) * 4}deg)`}}>
        <Logo size={210} />
      </At>
      <At y={520}>
        <T size={80} delay={4}>¿Y SI TE DIGO</T>
        <T size={96} delay={8} color={C.miel}>QUE…?</T>
      </At>
      <At y={860} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14)}) rotate(${up ? Math.sin(f * 1.4) * 2 : 0}deg)`}}>
        <Tag price={fmt(n)} color={up ? C.rojo : C.marron} w={600} />
      </At>
      <At x={850} y={790} style={{transform: `translate(-50%,-50%) scale(${sp(f, 28)})`, opacity: up ? 1 : 0}}>
        <Emo c="📈" size={150} />
      </At>
      <At y={1090} style={{transform: `translate(-50%,-50%) scale(${sp(f, 40)})`}}>
        <T size={96} color={C.rojo}>¿MÁS CARO?</T>
      </At>
    </>
  );
};

const B2: React.FC<P> = () => {
  const f = useCurrentFrame();
  const s = sp(f, 2, {damping: 9, stiffness: 140, mass: 0.7});
  return (
    <>
      <At y={330}>
        <T size={104} delay={0}>OJO CON ESTO</T>
      </At>
      <At y={860} style={{transform: `translate(-50%,-50%) scale(${s}) rotate(${(1 - s) * -12}deg)`}}>
        <div style={{width: 640, background: '#fff', border: `12px solid ${C.marron}`, borderRadius: 40, overflow: 'hidden'}}>
          <div style={{background: C.rojo, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 68, textAlign: 'center', padding: '14px 0', borderBottom: `10px solid ${C.marron}`}}>NOVIEMBRE</div>
          <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 190, color: C.marron, textAlign: 'center', lineHeight: 1.15}}>13–17</div>
          <div style={{background: C.miel, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: C.marron, textAlign: 'center', padding: '10px 0', borderTop: `10px solid ${C.marron}`}}>EL BUEN FIN</div>
        </div>
      </At>
      <At x={870} y={640} style={{transform: `translate(-50%,-50%) scale(${sp(f, 14)}) rotate(${Math.sin(f * 0.4) * 12}deg)`}}>
        <Emo c="👀" size={150} />
      </At>
    </>
  );
};

const B3: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const price = Math.round(interpolate(f, [40, 70], [1000, 1400], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}));
  const stick = sp(f, 100, {damping: 7, stiffness: 190, mass: 0.6});
  const final = f >= 110;
  return (
    <>
      <Badge n="1" x={170} y={340} />
      <At x={650} y={340}>
        <T size={84} delay={3} style={{textAlign: 'left'}}>DESCUENTO</T>
        <T size={110} delay={7} color={C.rojo} style={{textAlign: 'left'}}>FALSO</T>
      </At>
      <At y={820} style={{transform: `translate(-50%,-50%) scale(${sp(f, 10)})`}}>
        <Tag price={final ? fmt(980) : fmt(price)} color={final ? C.verde : price > 1000 ? C.rojo : C.marron} w={620} />
      </At>
      <At x={850} y={650} style={{transform: `translate(-50%,-50%) scale(${sp(f, 48)})`, opacity: f > 44 && f < 100 ? 1 : 0}}>
        <Emo c="⬆️" size={160} />
      </At>
      <At x={250} y={640} style={{transform: `translate(-50%,-50%) rotate(-14deg) scale(${stick})`, opacity: f >= 100 ? 1 : 0}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 98, color: '#fff', background: C.rojo, border: `10px solid ${C.marron}`, borderRadius: '50%', width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>-30%</div>
      </At>
      <At y={1090} style={{opacity: final ? 1 : 0, transform: `translate(-50%,-50%) scale(${sp(f, 116)})`}}>
        <T size={72} color={C.rojo}>¡SOLO AHORRAS $20!</T>
      </At>
      <At x={540} y={1185} style={{opacity: sp(f, 12)}}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: '#fff', background: 'rgba(0,0,0,.45)', borderRadius: 20, padding: '4px 18px'}}>EJEMPLO</div>
      </At>
    </>
  );
};

const B4: React.FC<P> = () => {
  const f = useCurrentFrame();
  return (
    <>
      <At y={780} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 7, stiffness: 190, mass: 0.6})}) rotate(${Math.sin(f * 0.6) * 5}deg)`}}>
        <T size={170} color="#fff">¡PERO</T>
        <T size={170} color={C.miel}>HAY MÁS!</T>
      </At>
      <At x={850} y={520} style={{transform: `translate(-50%,-50%) scale(${sp(f, 8)}) rotate(${Math.sin(f * 0.5) * 14}deg)`}}>
        <Emo c="👀" size={160} />
      </At>
    </>
  );
};

const B5: React.FC<P> = ({dur}) => {
  const f = useCurrentFrame();
  const flash = interpolate(f, [30, 33, 44], [0, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const b = sp(f, 70, {damping: 8, stiffness: 150, mass: 0.7});
  return (
    <>
      <Badge n="2" x={170} y={340} />
      <At x={650} y={340}>
        <T size={84} delay={3} style={{textAlign: 'left'}}>GUARDA</T>
        <T size={84} delay={7} color={C.miel} style={{textAlign: 'left'}}>LA PRUEBA</T>
      </At>
      <At x={360} y={850} style={{transform: `translate(-50%,-50%) scale(${sp(f, 8)})`}}>
        <div style={{width: 330, height: 560, borderRadius: 52, background: '#12052E', border: `12px solid ${C.marron}`, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 14, borderRadius: 36, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 22}}>
            <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 44, color: C.marron}}>OFERTA</div>
            <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.rojo}}>$980</div>
            <div style={{width: 200, height: 18, borderRadius: 9, background: '#90CAF9'}} />
            <div style={{width: 150, height: 18, borderRadius: 9, background: '#90CAF9'}} />
          </div>
          <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash}} />
        </div>
      </At>
      <At x={660} y={640} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)}) rotate(${Math.sin(f * 0.4) * 8}deg)`}}>
        <Emo c="📸" size={140} />
      </At>
      <At x={770} y={880} style={{transform: `translate(-50%,-50%) scale(${b}) rotate(${(1 - b) * 40}deg)`, opacity: f >= 70 ? 1 : 0}}>
        <div style={{width: 300, height: 300, borderRadius: 150, background: C.verde, border: `12px solid ${C.marron}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
          <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 118, color: '#fff', WebkitTextStroke: `8px ${C.marron}`, paintOrder: 'stroke fill', lineHeight: 1}}>20%</span>
          <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 36, color: '#fff', WebkitTextStroke: `5px ${C.marron}`, paintOrder: 'stroke fill'}}>MÍNIMO</span>
        </div>
      </At>
      <At x={770} y={1090} style={{opacity: sp(f, 90), transform: `translate(-50%,-50%) scale(${sp(f, 90)})`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 40, color: '#fff', background: C.marron, borderRadius: 20, padding: '6px 22px', whiteSpace: 'nowrap'}}>SEGÚN PROFECO</div>
      </At>
    </>
  );
};

const B6: React.FC<P> = () => {
  const f = useCurrentFrame();
  const s = sp(f, 8, {damping: 9, stiffness: 130, mass: 0.8});
  return (
    <>
      <Badge n="3" x={170} y={340} />
      <At x={650} y={340}>
        <T size={80} delay={3} style={{textAlign: 'left'}}>MESES SIN</T>
        <T size={92} delay={7} color={C.miel} style={{textAlign: 'left'}}>INTERESES</T>
      </At>
      <At y={780} style={{transform: `translate(-50%,-50%) scale(${s}) rotate(${(1 - s) * 30 + Math.sin(f * 0.15) * 3}deg)`}}>
        <div style={{width: 620, height: 390, borderRadius: 40, background: 'linear-gradient(135deg,#3949AB,#1A237E)', border: `12px solid ${C.marron}`, position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 60, height: 70, background: '#0D1245'}} />
          <div style={{position: 'absolute', left: 36, top: 170, width: 90, height: 66, borderRadius: 12, background: '#FFD54F', border: `6px solid ${C.marron}`}} />
          <div style={{position: 'absolute', left: 36, bottom: 30, fontFamily: FONT, fontWeight: 900, fontSize: 70, color: '#fff'}}>12 MSI</div>
        </div>
      </At>
      <At y={1060} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)})`}}>
        <T size={62} color="#fff">REVISA EL PRECIO TOTAL</T>
      </At>
      <At x={820} y={600} style={{transform: `translate(-50%,-50%) scale(${sp(f, 24)}) rotate(${Math.sin(f * 0.35) * 14}deg)`}}>
        <Emo c="🔍" size={150} />
      </At>
    </>
  );
};

const B7: React.FC<P> = () => {
  const f = useCurrentFrame();
  const rows = ['COMPARA PRECIOS', 'GUARDA PRUEBAS', 'NO COMPRES POR IMPULSO'];
  return (
    <>
      <At y={350} style={{transform: `translate(-50%,-50%) scale(${sp(f, 0, {damping: 8, stiffness: 150, mass: 0.7})})`}}>
        <T size={130} color="#fff">¿CONVIENE?</T>
      </At>
      <At y={540} style={{transform: `translate(-50%,-50%) scale(${sp(f, 16, {damping: 8, stiffness: 160, mass: 0.7})})`}}>
        <T size={110} color={C.miel}>SÍ, SI…</T>
      </At>
      {rows.map((r, i) => {
        const s = sp(f, 36 + i * 22, {damping: 10, stiffness: 160, mass: 0.6});
        return (
          <At key={i} y={720 + i * 140} style={{transform: `translate(-50%,-50%) scale(${s})`, opacity: Math.min(1, s * 2)}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 22, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.marron, background: '#fff', border: `8px solid ${C.marron}`, borderRadius: 28, padding: '12px 34px', whiteSpace: 'nowrap'}}>
              <span style={{fontSize: 56}}>✅</span>
              {r}
            </div>
          </At>
        );
      })}
    </>
  );
};

const B8: React.FC<P> = () => {
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
        <Emo c="✈️" size={110} />
      </At>
      <At x={820} y={1130} style={{transform: `translate(-50%,-50%) scale(${sp(f, 30)})`}}>
        <Sparkle size={100} rot={f * 3} color="#FFF59D" />
      </At>
    </>
  );
};

/* ───────────── línea de tiempo ───────────── */

type Def = {id: string; key: string | null; bg: [string, string]; C: React.FC<P>; cam: Kf[]; shakeAt?: number[]; fx: Fx[]};
const DEFS: Def[] = [
  {id: 'hook', key: null, bg: ['#B71C1C', '#2B0707'], C: B1, cam: [[0, 1, 540, 800], [40, 1.0, 540, 800], [60, 1.14, 540, 860], [999, 1.18, 540, 860]], shakeAt: [26], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ticks', at: 26, v: 0.5}, {f: 'boom', at: 40, v: 0.7}]},
  {id: 'fechas', key: 'del', bg: ['#1565C0', '#0A1F4D'], C: B2, cam: [[0, 1, 540, 860], [8, 1.16, 540, 860], [30, 1.05, 540, 860], [999, 1.08, 540, 860]], shakeAt: [6], fx: [{f: 'hit', at: 2, v: 0.7}, {f: 'swoosh_in', at: 0, v: 0.45}, {f: 'pop2', at: 14, v: 0.5}]},
  {id: 'uno', key: 'uno', bg: ['#6A1B9A', '#220A38'], C: B3, cam: [[0, 1, 540, 820], [40, 1.0, 540, 820], [75, 1.1, 540, 820], [105, 1.0, 540, 820], [120, 1.2, 400, 800], [999, 1.24, 400, 800]], shakeAt: [100], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'ticks', at: 40, v: 0.55}, {f: 'riser', at: 70, v: 0.4}, {f: 'hit', at: 100, v: 0.8}, {f: 'bloop', at: 112, v: 0.5}]},
  {id: 'pero', key: 'pero', bg: ['#FF6F00', '#B71C1C'], C: B4, cam: [[0, 1.0, 540, 780], [6, 1.2, 540, 780], [999, 1.25, 540, 780]], shakeAt: [4], fx: [{f: 'whoosh_up', at: 0, v: 0.6}, {f: 'boom', at: 3, v: 0.6}]},
  {id: 'dos', key: 'dos', bg: ['#00897B', '#00241F'], C: B5, cam: [[0, 1, 540, 850], [28, 1.0, 360, 850], [34, 1.15, 360, 850], [60, 1.0, 540, 850], [74, 1.18, 770, 880], [999, 1.2, 770, 880]], shakeAt: [70], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'shutter', at: 30, v: 0.8}, {f: 'riser', at: 52, v: 0.4}, {f: 'kaching', at: 70, v: 0.6}, {f: 'hit', at: 70, v: 0.5}]},
  {id: 'tres', key: 'tres', bg: ['#283593', '#090C30'], C: B6, cam: [[0, 1, 540, 780], [30, 1.0, 540, 780], [60, 1.14, 540, 900], [999, 1.18, 540, 900]], fx: [{f: 'swoosh_out', at: 0, v: 0.5}, {f: 'pop2', at: 10, v: 0.55}, {f: 'pop2', at: 32, v: 0.5}, {f: 'sparkle', at: 40, v: 0.35}]},
  {id: 'conclusion', key: 'entonces', bg: ['#2E7D32', '#0A260C'], C: B7, cam: [[0, 1, 540, 700], [999, 1.1, 540, 800]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 38, v: 0.55}, {f: 'pop2', at: 60, v: 0.55}, {f: 'pop2', at: 82, v: 0.55}, {f: 'ding2', at: 100, v: 0.5}]},
  {id: 'cta', key: 'sigueme', bg: ['#4A148C', '#12052E'], C: B8, cam: [[0, 1.0, 540, 800], [999, 1.08, 540, 800]], fx: [{f: 'swoosh_in', at: 0, v: 0.5}, {f: 'pop2', at: 6, v: 0.6}, {f: 'ding2', at: 14, v: 0.5}, {f: 'sparkle', at: 30, v: 0.4}]},
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
    starts.push(Math.max(0, Math.round((v.palabras[idx].s - 0.06) * FPS)));
  });
  return DEFS.map((d, i) => ({d, from: starts[i], dur: (i + 1 < DEFS.length ? starts[i + 1] : total) - starts[i]}));
};

export const BuenFin: React.FC<{id: string}> = ({id}) => {
  const f = useCurrentFrame();
  const v = VOCES[id];
  const total = Math.ceil((v.duracion + 0.9) * FPS);
  const scenes = React.useMemo(() => buildScenes(v, total), [v, total]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {scenes.map(({d, from, dur}) => (
        <Sequence key={d.id} from={from} durationInFrames={Math.max(1, dur)} layout="none">
          <Sequence from={0} durationInFrames={Math.max(1, dur)}>
            <SceneV bg={d.bg} cam={d.cam} shakeAt={d.shakeAt}>
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
      <Captions v={v} top={1240} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 14, width: `${(f / total) * 100}%`, background: C.miel}} />
      <Audio src={staticFile(`voces/${id}.mp3`)} />
    </AbsoluteFill>
  );
};

export const buenFinFrames = (id: string) => Math.ceil((VOCES[id].duracion + 0.9) * FPS);
