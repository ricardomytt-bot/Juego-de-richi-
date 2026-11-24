# Mike y las Estrellas Oscuras — Piloto

Juego 2D **visto desde arriba** (estilo Zelda) con exploración, laberintos, llaves, combate en tiempo real, jefes y cinemáticas con retratos.

## Cómo jugar
Abre `mike-juego/index.html` en el navegador (Chrome, Edge o Firefox). No necesita instalar nada.

Solo hay **un joystick y dos botones**:

| Control | Acción |
|---|---|
| Joystick en pantalla, flechas o `W` `A` `S` `D` | Moverte |
| Botón **ACTUAR** (`E` o `K`) | Hablar con los personajes y avanzar los diálogos |
| Botón **ATACAR** (`J`, `X` o `Espacio`) | Usar la espada hacia donde miras |
| Botón ☰ o `Esc` | Abrir el menú de pausa |

En el menú puedes ajustar la música y los efectos, ocultar los botones en pantalla, poner pantalla completa y saltar las cinemáticas.

## Qué incluye el piloto
1. **Cinemática de apertura** con retratos grandes pixelados de cada personaje, cámara que se acerca, aurora, las siete estrellas y Exe con el poder de las estrellas oscuras. Los personajes corruptos se ven con efecto glitch rojo.
2. **Tutorial en la casa de Mike** con un **jardín-laberinto** donde está la **llave de bronce**, una puerta de bronce y el portal al Valle del Sueño.
3. **Nivel 1: Valle del Sueño**, un mapa enorme de 120 x 84 casillas con:
   - **Tres laberintos** (ruinas del oeste, pantano de setos y cámara de oro) y un bosque abierto muy grande.
   - **Tres puertas con llave** (bronce, plata y oro) y **tres diamantes** que abren la puerta del jefe.
   - Corazones escondidos en los callejones sin salida, antorchas, enemigos y un **mapa completo** en el menú de pausa que se va descubriendo.
4. **Jefe: Timba corrupto** con ataques avisados en el suelo, fase 2 y siestas en las que recibe el doble de daño.
5. **Cinemática de rescate**, recompensa (la Almohada de Estrella, +2 corazones) y **final con gancho**.

Cada nivel se **verifica automáticamente**: el juego comprueba que se pueda llegar a todas las llaves, puertas, diamantes y al jefe.

## Gráficos y sonido
Texturas pintadas con píxeles de 2 px (pasto, caminos, muros de ladrillo y agua animada), árboles y rocas con sombra, la casa de Mike, iluminación nocturna con luz alrededor de Mike y de los diamantes, luciérnagas, viñeta, minimapa que se va descubriendo y música con flauta, guitarra, campanas, cuerdas y batería con reverberación, una pieza distinta para el título, las cinemáticas tranquilas y oscuras, el tutorial, el Valle del Sueño y el jefe, además de sonido ambiente y muchos efectos.

## Archivos
- `js/core.js`: entrada, sonido y música.
- `js/levels.js`: mapas de los niveles.
- `js/game.js`: movimiento, combate, enemigos y jefe.
- `js/render.js`: dibujo, texturas, luces e interfaz.
- `js/menu.js`: menú de título, pausa, opciones y controles.
- `js/story.js`: cinemáticas, diálogos y arranque.
- `assets/`: sprites de los personajes.

## Atajos para probar
Añade esto al final de la dirección: `?lvl=0` (tutorial), `?lvl=1` (Valle del Sueño), `?boss` (directo al jefe) o `?end` (final).
