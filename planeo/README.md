# 🐿️ Planeo — la ardilla planeadora (v2)

Nuki, una ardilla con gafas de aviador, baja planeando en su avioncito desde el Pueblo Ardilla (flotando en las nubes)
hasta el suelo para recuperar las tres Bellotas Doradas. **3 carriles** muy marcados (pista luminosa con rieles, rayas y flechas), estilo *Subway Surfers*, pero en el cielo.

HTML5 Canvas, sin dependencias ni instalación. Funciona en navegador de escritorio y móvil.

## Modos
- **📖 Historia**: 3 capítulos (Amanecer, Tormenta, Atardecer) con cinemáticas ilustradas, música y diálogos. Cada nivel termina con un mini jefe.
- **♾️ Infinito**: los 3 mundos en bucle, cada vez más rápido y difícil, con jefe al final de cada nivel. Sin checkpoints: 3 vidas y se acabó. Récord de puntos.
- **👻 Multijugador**: corre contra fantasmas de tus amigos (carrera asíncrona). Cada nivel tiene sus fantasmas; se comparten con un código.

## Controles
| | Teclado | Móvil |
|---|---|---|
| Mover de carril | `←` `→` / `A` `D` | Tocar izquierda/derecha, o deslizar |
| **Picada** (más rápido, bellotas x2) | `↓` / `S` / `Espacio` | Deslizar hacia abajo |
| **Freno** | `↑` / `W` | Deslizar hacia arriba |
| Pausa / Sonido | `Esc` o `P` / `M` | Botones arriba a la derecha |
| Cinemáticas | `Espacio`/`Enter` o clic para avanzar, `Esc` para saltar | Tocar / botón "Saltar" |

## Ritmo
Cada nivel dura ~2 minutos: ~1:30 de descenso y ~20-30 s de jefe. La velocidad sube a lo largo del nivel
(19 → 33 m/s en el primero, hasta 39 en el tercero) y los obstáculos se vuelven más densos: muros que dejan un solo hueco,
slaloms, abejorros y babas que cruzan de carril.

## Bloques, enemigos y power-ups
Todos ocupan un carril, tienen contorno grueso y una **placa de color en el suelo** que marca en qué línea están.

**Bloques (quietos):** 🧊 cristal de hielo · ⚡ caja de tormenta (cielo) · 📦 caja con franja de peligro · 🪨 roca con pinchos (tierra)

**Enemigos (10, cada uno se mueve distinto):**
| | Cielo | Tierra |
|---|---|---|
| Cruza de carril | 🐝 abejorro | 🟣 baba |
| Se lanza hacia ti | ☄️ cometa | 🪨 bola rodante |
| Salta de carril en carril | 🦇 murciélago | 🐰 conejo gruñón |
| Te sigue y se fija | 👁 dron vigía | — |
| Sale de la tierra al acercarte | — | 🦫 topo emboscador |
| Parpadea (cruzar cuando se apaga) | ⚡ valla eléctrica | ⚡ valla eléctrica |

**Power-ups:** 🛡 escudo (aguanta un golpe) · ⭐ estrella (6 s invencible, revienta enemigos) · 🧲 imán (atrae las bellotas)

## Carriles
En el cielo son **corrientes de aire luminosas** (cintas de luz y estelas de viento); al aterrizar se convierten en carretera.

## Música
Cada ambiente tiene su propia canción compuesta (melodía, bajo, acordes y batería): amanecer, tormenta, atardecer, jefe, menú y cinemáticas.
Se puede apagar solo la música con el botón 🎵 (los efectos siguen).

## Jefes
Un aviso rojo en el suelo indica por dónde viene el golpe (disparos, muros con huecos, rayos). Tras cada ataque aparece
una **bellota dorada grande**: recógela y se la devuelves al jefe. Cuando se le acaban los corazones, ¡victoria!

## Cómo está hecho (`planeo/js/`)
`01-core` utilidades y temas · `02-audio` canciones y efectos sintetizados · `03-level` niveles deterministas ·
`04-art` todos los sprites en Canvas · `05-render` pseudo-3D, ambiente, post-proceso · `06-ghost` fantasmas y códigos ·
`07-boss` jefes · `08-cine` cinemáticas · `09-main` modos, HUD y entrada.

> Fantasmas "en línea de verdad" (ranking global) necesitarían un pequeño backend; el formato de fantasma ya está listo.
