# Richi World 🌙

Un homenaje 3D al estilo *Super Mario Odyssey*, hecho con Three.js (sin build ni instalación).

## Cómo jugar
Abre `index.html` en el navegador (Chrome/Edge/Firefox) y pulsa **JUGAR**.

| Control | Acción |
|---|---|
| `WASD` | Moverse |
| Ratón / flechas | Cámara |
| `Espacio` | Saltar (pulsa al aterrizar para encadenar doble y **triple salto**) |
| `C` / `Shift` | Agacharse · con `Espacio` = **salto largo** · en el aire = **aplastón** |
| `E` / clic | Lanzar la gorra: recoge monedas lejanas y **captura** Gumbis |
| `E` / `Q` | Soltar la captura |
| `R` | Volver al último checkpoint |

## Objetivo
Reúne las **5 Power Moons**: escalera al cielo, la torre en espiral, el recorrido de plataformas flotantes
(con una móvil), derrotar a todos los Gumbis, y un salto largo sobre el vacío.
Cada 10 monedas recuperas un corazón. Si caes al agua pierdes un corazón.

---

# 🌙 Noches de Richi (pixel art)

Un juego de supervivencia de terror en **pixel art**, inspirado en el juego que Richi inventó con sus primos de niño:
"Five Nights" en la vida real, pero con monstruos **brainrot originales** de nombre triple y reglas propias.

**Jugar:** abre `noches/index.html` en el navegador (sin instalar nada). Pantalla completa recomendada.

## Modo historia (5 noches + noche 6 imposible)
Sobrevive de las **12 AM a las 6 AM** en tu cuarto. Cada monstruo tiene su regla:

| Monstruo | Regla |
|---|---|
| **Chancla Chancla Chancla** | Viene por la puerta **izquierda**. Alúmbrala y cierra la puerta a tiempo. |
| **Cuchara Cuchara Cuchara** | Viene por la **derecha**. La puerta cerrada no la espanta: ¡la luz sí! |
| **Tamal Tamal Tamalito** | Solo avanza cuando **no lo miras** en cámara. Si llega a la ventana, mírala (cám. 7). |
| **Sombra Sombra Sombra** | Al oír el pitido, escóndete bajo la **cobija** unos 3 s. |
| **Don Apagón** | Sale si la **energía llega a 0%**. |

Mientras miras las cámaras no puedes mover puertas ni luces. Todo gasta energía.

| Control | Acción |
|---|---|
| `A` / `D` | Puerta izquierda / derecha |
| `Q` / `E` (mantener) | Luz izquierda / derecha |
| `W` o `Espacio` | Cámaras (`Z`/`X` o `1-7` cambian de cámara) |
| `S` (mantener) | Cobija |
| `Esc` | Pausa |
| Ratón | Todos los botones de abajo son clicables |

## Multijugador local (1 vs 1)
Un jugador es el **guardia** y el otro un **monstruo** (elige entre Chancla, Cuchara, Tamal o Apagón, cada uno con su habilidad).
Pantalla dividida; luego se **cambian los roles**. Gana quien aguante más tiempo como guardia.

- Jugador 1: guardia `A D Q E W S Z X` · monstruo `WASD` + `F` (atacar) + `G` (habilidad)
- Jugador 2: guardia `J L U O I K N M` · monstruo `Flechas` + `Enter` (atacar) + `.` (habilidad)

Añade `?fast` a la URL para partidas aceleradas (pruebas). El progreso del modo historia se guarda en el navegador.

---

# 🧸 Noche de Juguetes (en desarrollo)

Juego multijugador de supervivencia (diseño en `docs/DISENO.md`). Abre `juego/index.html`.

**Estado actual:** prototipo de una persona contra un bot, en el mapa 1 (casa de 2 pisos).
- 10 clases con ventajas y objetos propios, 3 dificultades y 2 estilos de arte (A redondo / B clásico), todo desde el menú.
- Cadena de 5 llaves y dos cajas con partes del código (bóveda y caja fuerte del ático), apagón con computadora, microondas, nevera y comida.
- Mesa de crafteo 3×3 (sin orden) con 8 recetas y libro de recetas; objetos: máscara, taser, brujitas, barricada, trampa, caja musical, mancha de aceite, pila turbo, pizza, cámara, Nerf, jeringa, bebida, bomba de humo, torreta, ración.
- Muñeca robot con radar, visión, trampas, señuelos y que rompe barricadas; se vuelve más agresiva con la noche.

Controles: `WASD` mover · `J` USAR · `K` LINTERNA · `L` OBJETO (mantén pulsado para cambiar de objeto, o `R`). En celular: joystick a la izquierda y 3 botones a la derecha.
Falta: salas con código en línea, votación de mapa, los otros 9 mapas y enemigos, y el modo aventura.
