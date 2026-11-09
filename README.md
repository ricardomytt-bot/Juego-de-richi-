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

Juego de supervivencia (diseño en `docs/DISENO.md`). Abre `juego/index.html`. Se puede jugar en **3D** (Three.js, baja resolución) o en **2D** pixel art, y en dos estilos de personaje (A redondo, B clásico).

**Menú:** fondo 3D (casa embrujada) con JUGAR, MODO HISTORIA (mapas con imágenes de la casa y niveles; selección de clase, estilo y vista), MULTIJUGADOR (sala de espera con código y perfiles) y AJUSTES. Las salas funcionan entre pestañas del mismo navegador; entre dispositivos distintos falta el servicio de conexión.

**Estado actual:** prototipo de una persona contra un bot, en el mapa 1 (casa de 2 pisos).
- **No lineal y aleatorio:** las 5 llaves y los objetos cambian de lugar en cada partida, con rutas alternativas (cofres, mecanismos que piden engranaje, cajas que piden palanca). Se comprobó que las 300 partidas generadas se pueden completar.
- **Objetos para progresar:** engranaje (de aluminio), escalera (para cruzar el hueco del piso 2), fusible (para dar energía a la salida) y palanca. Salida: fusible + engranaje + código de 4 cifras en dos partes.
- **Enemigos:** la muñeca robot (radar, trampas, señuelos, rompe barricadas) y **fantasmas** que se acercan, te dan un susto y te dejan lento; la linterna y la cámara los disipan.
- **Adamantium y niveles:** 10 niveles; cada nivel superado da su número en adamantium (escapar) o la mitad (sobrevivir). Las clases cuestan 1 a 10 adamantium, de la peor a la mejor.
- Mesa de crafteo 3×3 con 11 recetas y más de 15 objetos usables.

Controles: `WASD` mover · `J` USAR · `K` LINTERNA · `L` OBJETO (mantén pulsado o `R` para cambiar de objeto). En celular: joystick y 3 botones.
Falta: salas con código en línea, votación de mapa y los otros 9 mapas y enemigos.
