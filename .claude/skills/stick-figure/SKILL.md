---
name: stick-figure
description: Estilo visual "muñequito de palitos" para los videos del canal: fondo de papel crema, líneas negras gruesas, personaje que mueve la boca al hablar, mapas y gráficos que se dibujan solos, cámara con zoom que sigue la acción y mucho movimiento. Úsalo junto con /y-si-te-digo-que cuando pidan videos con muñequitos, mapas o explicaciones dibujadas.
---

# /stick-figure

Estilo para videos verticales de `video-studio/` (referencia completa: `src/Avion2.tsx`, que usa `Kit.tsx`, `Miel.tsx` y `Venus.tsx`). Responde al usuario en español, corto y con emojis.

## Look
- Fondo **papel crema** (`#FBF7EE → #E9DFC8`); para apertura o cierre se permiten fondos de color (cielo, verde, morado).
- Líneas **negras gruesas** (`#1B1B1B`), esquinas redondeadas, sombra dura desplazada.
- **Personaje de palitos**: cabeza blanca, ojos de punto, **gorra amarilla** (`#FFB300`), brazos y piernas de línea. **La boca se abre y cierra solo mientras suena una palabra** (usa los tiempos del `.json` de la voz). Parpadea y se balancea.
- Títulos grandes con borde oscuro; **nunca texto blanco sobre fondo crema** (usa azul `#1E3A8A`, rojo `#E53935`, verde). Acentos: miel, rojo, azul, verde.
- Fichas/etiquetas (chips) blancas con borde oscuro para datos clave.

## Movimiento (nada se queda estático)
- **Apertura**: el personaje asomado a la ventanilla de un avión que entra volando (nubes con parallax), título "¿Y si te digo que…?"; luego **zoom out** (el avión se hace pequeño y aparece el mapa/escenario con zoom) y el personaje queda como narrador pequeño abajo a la izquierda.
- Mapas y gráficos: **líneas que se dibujan solas**, línea punteada "que avanza" (marching ants), avioncito que recorre la ruta con **estela**, cámara que **sigue al avión** con zoom, el mapa con un balanceo suave (rotación/desplazamiento).
- Globos o esquemas que giran, contadores que suben, golpes de zoom y *shake* en los momentos clave, textos que entran con rebote.
- Cada cambio de escena lleva un efecto de sonido (whoosh) y cada golpe, uno de impacto. **Nunca** uses sonido de pizarrón/lápiz al dibujar líneas.
- Si el usuario dice que el estilo aburre, cambia de estilo por completo (ver `/y-si-te-digo-que`, lecciones).

## Reglas técnicas
- Zonas seguras: título y=300–560, visual y=600–1150, subtítulos desde y=1240; nada importante a la derecha bajo y=1000.
- Si el usuario aporta un mapa o imagen: calibra la proyección con ciudades conocidas (comprueba con puntos de prueba antes de dibujar rutas), amplía la imagen con Lanczos y avisa si la resolución es baja o si parece de banco de imágenes (derechos).
- Rutas de avión: calcula **círculos máximos** reales (interpolación esférica), no curvas a ojo. Evita rutas que crucen el borde del mapa.
- Colores y fuentes: `Inter` y `Noto Color Emoji` (disponibles en el entorno).
- Prueba con `--scale=0.5`, revisa fotogramas y corrige antes del render final.
