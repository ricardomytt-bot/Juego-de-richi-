import React from 'react';
import {Composition} from 'remotion';
import {Miel, Voz} from './Miel';
import {Venus, venusFrames} from './Venus';
import {BuenFin, buenFinFrames} from './BuenFin';
import {Gta, gtaFrames} from './Gta';
import {Banana, bananaFrames} from './Banana';
import {Nintendo, nintendoFrames} from './Nintendo';
import {Avion, avionFrames} from './Avion';
import {Avion2, avion2Frames} from './Avion2';
import brian from '../public/voces/brian.json';
import harry from '../public/voces/harry.json';
import daniel from '../public/voces/daniel.json';
import eric from '../public/voces/eric.json';

const voces: Record<string, Voz> = {brian, harry, daniel, eric} as any;

export const Root: React.FC = () => (
  <>
    {Object.entries(voces).map(([id, v]) => (
      <Composition
        key={id}
        id={`miel-${id}`}
        component={Miel}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={Math.ceil((v.duracion + 0.9) * 30)}
        defaultProps={{id}}
      />
    ))}
    <Composition id="venus-eric" component={Venus} width={1080} height={1920} fps={30} durationInFrames={venusFrames('venus_eric')} defaultProps={{id: 'venus_eric'}} />
    <Composition id="buenfin-jessica" component={BuenFin} width={1080} height={1920} fps={30} durationInFrames={buenFinFrames('buenfin_jessica')} defaultProps={{id: 'buenfin_jessica'}} />
    <Composition id="gta-eric" component={Gta} width={1080} height={1920} fps={30} durationInFrames={gtaFrames('gta_eric')} defaultProps={{id: 'gta_eric'}} />
    <Composition id="banana-eric" component={Banana} width={1080} height={1920} fps={30} durationInFrames={bananaFrames()} />
    <Composition id="nintendo-eric" component={Nintendo} width={1080} height={1920} fps={30} durationInFrames={nintendoFrames()} />
    <Composition id="avion-eric" component={Avion} width={1080} height={1920} fps={30} durationInFrames={avionFrames()} />
    <Composition id="avion2-eric" component={Avion2} width={1080} height={1920} fps={30} durationInFrames={avion2Frames()} />
  </>
);
