# 🐿️ Planeo — la ardilla planeadora (primera versión de prueba)

Una ardilla con gafas de aviador baja planeando en su avioncito desde el cielo hasta el suelo.
Esquiva nubes, nubarrones y pajaritos; al aterrizar, esquiva árboles, arbustos y erizos. 5 carriles, estilo *Subway Surfers* pero en el cielo.

HTML5 Canvas, sin dependencias ni instalación. Funciona en navegador de escritorio y móvil.

## Cómo jugar
Abre `planeo/index.html` (o publícalo con GitHub Pages para jugarlo desde el móvil).

| | Teclado | Móvil |
|---|---|---|
| Mover de carril | `←` `→` / `A` `D` | Tocar izquierda/derecha, o deslizar |
| **Picada** (más rápido, bellotas x2) | `↓` / `S` / `Espacio` | Deslizar hacia abajo |
| **Freno** (más tiempo para pensar) | `↑` / `W` | Deslizar hacia arriba |
| Pausa / Sonido | `Esc` o `P` / `M` | Botones arriba a la derecha |

- 🌰 Sigue el rastro de bellotas: te lleva al hueco libre. Las doradas valen 5 y suelen estar en zonas arriesgadas.
- ❤️ 3 vidas. Si las pierdes, vuelves al último punto de control 🚩 (sin empezar de cero).
- Partida de ~4 minutos: de 1800 m de altitud hasta la meta en tierra.

## Fantasmas (carrera "online" asíncrona)
Tu mejor partida se guarda como fantasma. Desde **👻 Fantasmas** o al terminar una partida puedes copiar un
enlace/código (~400-800 caracteres) y mandarlo por WhatsApp. Tus amigos lo abren (o lo pegan) y corren contra tu
sombra, viendo su nombre en pantalla y su posición en la barra de progreso. Se guarda hasta 5 fantasmas de amigos.
No necesita servidor: todo vive en el navegador (`localStorage`) y en el código compartido.

> Para fantasmas que se sincronicen solos (ranking global, "retos del día") haría falta un pequeño backend
> (por ejemplo Firebase). El formato de fantasma ya está listo para eso.

## Cómo está hecho
- `game.js`: nivel generado con semilla fija (determinista por *distancia*, no por tiempo), pseudo-3D con proyección
  en perspectiva, audio generativo con WebAudio (música suave + efectos), grabación/compresión de fantasmas.
- Ideas para siguientes versiones: más mundos/paletas (océano, noche), modo pantalla compartida, ranking online,
  skins para la ardilla, nivel diario.
