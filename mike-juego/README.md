# Mike y las Estrellas Oscuras — Piloto

Juego 2D **visto desde arriba** (estilo Zelda) con combate en tiempo real, jefes, cinemáticas y sprites cuadrados.

## Cómo jugar
Abre `mike-juego/index.html` en el navegador (Chrome, Edge o Firefox). No necesita instalar nada.

| Tecla | Acción |
|---|---|
| Flechas / `W` `A` `S` `D` | Moverte en 8 direcciones |
| `J` / `X` / `Espacio` | Atacar con la espada, hacia donde miras |
| `Shift` / `L` / `C` / `K` | Esquive (se desbloquea al vencer a Timba) |
| `E` | Hablar con los personajes |
| `Enter` / `Espacio` | Avanzar diálogos |
| `Esc` | Saltar cinemática |
| `M` | Silenciar |

En celular aparecen botones en pantalla.

## Qué incluye el piloto
1. **Cinemática de apertura**: las siete estrellas, Exe con el poder de las estrellas oscuras y los amigos corrompidos.
2. **Tutorial en la casa de Mike**: aprende a moverte y a atacar, con un muñeco de práctica, Willy Perro, Aquela, Acenix (su pastel te cura) y Ambrosio con la carta de Timba. Entra al portal para continuar.
3. **Nivel 1: Valle del Sueño**: un bosque de noche con estanque, hongos que brillan y enemigos. Recolecta **3 diamantes** para abrir la puerta del jefe. Uno está al aire libre, otro en el claro del norte y otro escondido tras unos muros agrietados que hay que romper a golpes.
4. **Jefe: Timba corrupto**: lanza almohadas, salta y aplasta (avisa con un círculo rojo en el suelo) y hace llover ovejas. Cuando se duerme, recibe el doble de daño.
5. **Cinemática de rescate** con recompensa y **final con gancho**.

## Gráficos y sonido
Texturas de pasto, caminos y agua animada, árboles y rocas con sombra, la casa de Mike, iluminación nocturna con luz alrededor de Mike y de los diamantes, luciérnagas, viñeta, minimapa que se va descubriendo y música con bajo, arpegios, melodía y batería distinta para cada zona y para el jefe.

## Archivos
- `js/core.js`: entrada, sonido y música.
- `js/levels.js`: mapas de los niveles.
- `js/game.js`: movimiento, combate, enemigos y jefe.
- `js/render.js`: dibujo, texturas, luces e interfaz.
- `js/story.js`: cinemáticas, diálogos y arranque.
- `assets/`: sprites de los personajes.

## Atajos para probar
Añade esto al final de la dirección: `?lvl=0` (tutorial), `?lvl=1` (Valle del Sueño), `?boss` (directo al jefe) o `?end` (final).
