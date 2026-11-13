import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, Captions, FONT, FPS, norm, Voz} from './Miel';
import {SceneV, Kf} from './Venus';

export type P = {dur: number; m: Record<string, number>};
export type Fx = {f: string; at: number; v?: number};
export type Def = {
  id: string;
  key: string | null;
  off?: number;
  bg: [string, string];
  C: React.FC<P>;
  cam: Kf[];
  marks?: Record<string, string>;
  markFx?: Record<string, Fx[]>;
  shakeAt?: number[];
  fx: Fx[];
};

export const Logo: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="-100 -100 200 200" style={{overflow: 'visible'}}>
    <polygon points="0,-92 80,-46 80,46 0,92 -80,46 -80,-46" fill="#FFB300" stroke={C.marron} strokeWidth={9} strokeLinejoin="round" />
    <polygon points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35" fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={5} />
    <text y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={C.marron}>?</text>
  </svg>
);

export const Chip: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({children, bg = '#fff', color = C.marron, size = 54}) => (
  <div style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color, background: bg, border: `8px solid ${C.marron}`, borderRadius: 26, padding: '8px 28px', whiteSpace: 'nowrap'}}>{children}</div>
);

export const Neon: React.FC<{children: React.ReactNode; size: number; color: string; style?: React.CSSProperties}> = ({children, size, color, style}) => (
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

export const buildScenes = (defs: Def[], v: Voz, total: number) => {
  const starts: number[] = [];
  const idxs: number[] = [];
  let from = 0;
  defs.forEach((d) => {
    if (d.key === null) {
      starts.push(0);
      idxs.push(0);
      return;
    }
    let idx = v.palabras.findIndex((w, k) => k >= from && norm(w.t) === d.key);
    if (idx < 0) idx = from;
    from = idx + 1;
    idx = Math.max(0, idx + (d.off || 0));
    idxs.push(idx);
    starts.push(Math.max(0, Math.round((v.palabras[idx].s - 0.06) * FPS)));
  });
  return defs.map((d, i) => {
    const m: Record<string, number> = {};
    Object.entries(d.marks || {}).forEach(([name, key]) => {
      const k = v.palabras.findIndex((w, j) => j >= idxs[i] && norm(w.t) === key);
      if (k >= 0) m[name] = Math.max(0, Math.round(v.palabras[k].s * FPS) - starts[i]);
    });
    return {d, from: starts[i], dur: (i + 1 < defs.length ? starts[i + 1] : total) - starts[i], m};
  });
};

export const Video: React.FC<{defs: Def[]; v: Voz; audio: string; overlay?: React.ReactNode}> = ({defs, v, audio, overlay}) => {
  const f = useCurrentFrame();
  const total = Math.ceil((v.duracion + 0.9) * FPS);
  const scenes = React.useMemo(() => buildScenes(defs, v, total), [defs, v, total]);
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
          {Object.entries(d.markFx || {}).flatMap(([name, list]) =>
            m[name] === undefined
              ? []
              : list.map((e, k) => (
                  <Sequence key={name + k} from={Math.max(0, m[name] + e.at)} durationInFrames={60}>
                    <Audio src={staticFile(`sfx/${e.f}.wav`)} volume={e.v ?? 0.5} />
                  </Sequence>
                )),
          )}
        </Sequence>
      ))}
      {overlay}
      <Captions v={v} top={1240} />
      <div style={{position: 'absolute', left: 0, top: 0, height: 14, width: `${(f / total) * 100}%`, background: C.miel}} />
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
