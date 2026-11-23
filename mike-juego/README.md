# Mike y las Estrellas Oscuras — Piloto

Juego 2D horizontal de aventura y combate en tiempo real (mezcla de Zelda y Hollow Knight), con sprites cuadrados y cinemáticas.

## Cómo jugar
Abre `mike-juego/index.html` en el navegador (Chrome, Edge o Firefox). No necesita instalar nada.

| Tecla | Acción |
|---|---|
| `←` `→` / `A` `D` | Moverte |
| `Espacio` / `Z` / `K` | Saltar (mantén para saltar más alto) |
| `J` / `X` | Atacar con la espada de diamante |
| `↑` + `J` | Atacar hacia arriba |
| `↓` + `J` en el aire | Golpe hacia abajo (rebota sobre enemigos y jefes) |
| `↓` + salto sobre una nube | Atravesarla hacia abajo |
| `Shift` / `L` | Esquive (se desbloquea al vencer a Timba) |
| `E` | Hablar con los personajes |
| `Enter` / `Espacio` | Avanzar diálogos |
| `Esc` | Saltar cinemática |
| `M` | Silenciar |

En celular aparecen botones en pantalla.

## Qué incluye el piloto
1. **Cinemática de apertura**: las siete estrellas, Exe con el poder de las estrellas oscuras y los amigos corrompidos.
2. **Tutorial en la casa de Mike**: movimiento, salto, ataque, Willy Perro, Aquela, Acenix (pastel que cura) y Ambrosio con la carta de Timba.
3. **Nivel 1: Valle del Sueño**: recolecta **3 diamantes** para abrir la puerta del jefe. Hay camas elásticas, nubes, enemigos y un diamante escondido detrás de bloques agrietados.
4. **Jefe: Timba corrupto**: almohadazos, saltos, lluvia de ovejas y siestas en las que recibe el doble de daño.
5. **Cinemática de rescate** con recompensa, y **final con gancho**: Exe anuncia a los seis guardianes que faltan.

## Archivos
- `js/core.js`: entrada, sonido y música.
- `js/levels.js`: mapas de los niveles.
- `js/game.js`: física, combate, enemigos y jefe.
- `js/render.js`: dibujo, texturas de bloques y pantallas.
- `js/story.js`: cinemáticas, diálogos y arranque.
- `assets/`: sprites de los personajes (idle y 4 cuadros de caminar).

## Atajos para probar
Añade esto al final de la dirección: `?lvl=0` (tutorial), `?lvl=1` (Valle del Sueño), `?boss` (directo al jefe) o `?end` (final).
