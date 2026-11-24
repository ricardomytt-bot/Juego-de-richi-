# Mike y las Estrellas Oscuras — Piloto

Juego 2D **visto desde arriba** (estilo Zelda) con combate en tiempo real, jefes, cinemáticas y sprites cuadrados.

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
1. **Cinemática de apertura**: las siete estrellas, Exe con el poder de las estrellas oscuras y los amigos corrompidos.
2. **Tutorial en la casa de Mike**: aprende a moverte y a atacar, con un muñeco de práctica, Willy Perro, Aquela y Ambrosio con la carta de Timba. Entra al portal para continuar.
3. **Nivel 1: Valle del Sueño**: un bosque de noche con estanque, hongos que brillan y enemigos. Recolecta **3 diamantes** para abrir la puerta del jefe. Uno está al aire libre, otro en el claro del norte y otro escondido tras unos muros agrietados que hay que romper a golpes.
4. **Jefe: Timba corrupto**: lanza almohadas, salta y aplasta (avisa con un círculo rojo en el suelo) y hace llover ovejas. Cuando se duerme, recibe el doble de daño.
5. **Cinemática de rescate** con recompensa (la Almohada de Estrella, +2 corazones) y **final con gancho**.

## Gráficos y sonido
Texturas de pasto, caminos y agua animada, árboles y rocas con sombra, la casa de Mike, iluminación nocturna con luz alrededor de Mike y de los diamantes, luciérnagas, viñeta, minimapa que se va descubriendo y música con bajo, arpegios, acordes largos, melodía y batería distinta para cada zona y para el jefe, y sonido ambiente (pájaros de día, grillos de noche).

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
