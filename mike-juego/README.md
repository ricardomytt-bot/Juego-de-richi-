# Mike y las Estrellas Oscuras — Piloto

Juego 2D **visto desde arriba** (estilo Zelda) con exploración, laberintos, llaves, combate en tiempo real, jefes y cinemáticas con retratos.

## Cómo jugar
Abre `mike-juego/index.html` en el navegador (Chrome, Edge o Firefox). No necesita instalar nada.

Solo hay **un joystick y dos botones**:

| Control | Acción |
|---|---|
| Joystick en pantalla, flechas o `W` `A` `S` `D` | Moverte |
| Botón **ACTUAR** (`E` o `K`) | Hablar con los personajes y avanzar los diálogos |
| Botón **ATACAR** (`J`, `X` o `Espacio`) | Usar el arma equipada hacia donde miras |
| Botón **ARMA** (`Q`, o `1`-`4`) | Cambiar de arma: Dagas (corta, rápida), Martillo (pesada), Arco (larga) y Cetro Estelar (especial, se gana derrotando enemigos) |
| Botón 🍫 (`R`) | Chocolate: restaura toda la vida, se recarga cada 30 s |
| Botón ☰ o `Esc` | Abrir el menú de pausa |

En el menú puedes ajustar la música y los efectos, ocultar los botones en pantalla, poner pantalla completa y saltar las cinemáticas.

## Qué incluye el piloto
Gráficos **3D con cámara inclinada** (estilo Minecraft Dungeons, three.js) con personajes de bloques y retratos pixelados en los diálogos. Cada personaje tiene su **voz** (como Undertale/Deltarune) y puedes **elegir tus respuestas**: las conversaciones cambian y la amistad afecta lo que dicen después.
1. **Nivel 1: La Ciudad de Diamanti.** El juego empieza en la calle de Mike (vive con Trolino y Willy Perro). Ambrosio te pide repartir **7 cartas** a Timba, Rius, Mayo, Esparta, Raptor, Invictor (¡juguetón y feliz!) y Acenix. Al terminar se abre la estación.
2. **El tren:** Exe aparece, posee a tus amigos con las estrellas oscuras y lanza **slimes corrompidos** en oleadas.
3. **Nivel 2: Valle del Sueño**, mapa de 120 x 84 con tres laberintos, llaves de bronce/plata/oro y tres diamantes que abren la puerta del jefe.
4. **Jefe: Timba corrupto**, recompensa y final con gancho (siguen Acenix y los demás como jefes).

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
