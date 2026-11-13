# video-studio

Proyecto [Remotion](https://www.remotion.dev) para los videos verticales (1080×1920, 30 fps) del canal **¿Y si te digo que…?**.
Lo usan los comandos `/y-si-te-digo-que` y `/stick-figure` (carpeta `.claude/skills/`).

## Estructura

| Ruta | Qué es |
|---|---|
| `src/Miel.tsx` | Piezas base: `T` (texto con borde), `At`, `Badge`, `Emo`, `Captions` (subtítulos por palabra) |
| `src/Venus.tsx` | `SceneV`: fondo, cámara con zoom/shake, foco |
| `src/Kit.tsx` | `Video` (arma escenas desde los tiempos de la voz), `Chip`, `Logo`, `Def` |
| `src/Avion.tsx`, `src/Avion2.tsx` | Estilo muñequito de palitos + mapa (Avion2 = versión con más movimiento) |
| `src/Banana.tsx`, `Nintendo.tsx`, `Gta.tsx`, `BuenFin.tsx` | Otros videos de ejemplo |
| `public/voces/` | Voces ya generadas (`.mp3` + `.json` con tiempos por palabra) |
| `public/sfx/` | Efectos de sonido (se regeneran con `tools/audio*.py`) |
| `tools/voz.py` | Genera voz con ElevenLabs. Guiones en `tools/guiones/` |

## Uso

```bash
cd video-studio
npm install
# voz (la API key se guarda con la ventana segura de la sesión, nunca en el chat)
python3 tools/voz.py mi_video cjVigY5qzO86Huf0OWal tools/guiones/mi_guion.json eleven_flash_v2_5 1.1
# efectos de sonido (una vez)
python3 tools/audio.py && python3 tools/audio2.py && python3 tools/audio3.py && python3 tools/audio4.py
# vista previa rápida y render final
npx remotion render src/index.ts <id-composicion> out/video.mp4 --scale=0.5
npx remotion render src/index.ts <id-composicion> out/video.mp4
```

En las sesiones en la nube agrega `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
Para registrar un video nuevo: crea su componente en `src/` y añade un `<Composition>` en `src/Root.tsx`.

> `node_modules/` y `out/` no se suben. El mapa de `public/avion/mapa.png` es una imagen aportada por el usuario: revisa que tengas permiso para publicarla.
