# Diseño: juego multijugador de supervivencia (nombre por definir)

Estado: planificación. El código actual de `noches/` es un prototipo anterior (modo historia) y será reemplazado.

## Idea general
- **Solo multijugador.** Salas con código, de 1 a 8 jugadores: 1 animatrónico + hasta 7 sobrevivientes.
  El animatrónico puede ser un jugador o un bot (IA).
- Vista **desde arriba** (estilo Undertale), pixel art estilo Tung Tung Tung Sahur World, movimiento con **joystick en pantalla**.
- Cada mapa es una casa/edificio abandonado de **2 pisos**.
- Una partida dura **6 minutos** (reloj de 10 PM a 6 AM).
- Antes de cada partida: **votación de mapa** y **animatrónico al azar**.
- **Modo aventura:** pasar los 10 mapas (escapar de cada uno). El nivel 10 es más largo, con el jefe.

## Cómo termina
- Sobrevives hasta las 6 AM, o **escapas** por la puerta de salida (necesita un código).
- Gana primero el que sale. La partida termina cuando **no queda nadie en la casa** (escaparon o murieron).
- Quien muere pasa a **espectador**.

## Interfaz
- Sobrevivientes: 3 botones — **USAR**, **LINTERNA**, **OBJETO**.
  USAR abre armarios/cofres, usa la mesa de crafteo, recarga la linterna, abre puertas, etc.
- Animatrónico: 2 botones — **ATACAR** y **RADAR** (círculo + pitidos si hay gente cerca).
- El animatrónico ve **menos** que los sobrevivientes.
- Si te atrapa, te quita vida; puedes soltarte tocando muchas veces el botón que aparece al centro.
- Barra de vida y barra de energía de linterna.

## Linterna
3 usos. Aturde al animatrónico 3 s. Recarga completa en ~10 s en la estación de recarga (estacionamiento en el mapa 1).

## Cadena de escape
Llaves en cofres y armarios → cada llave abre otra puerta → llave de la **bóveda** → código → puerta de **salida**.

## Apagón (últimos 2 minutos)
Se va la luz. Hay que ir a una habitación del piso 2 que nunca tiene llave, resolver un acertijo muy sencillo en la computadora y esperar 3 s.

## Materiales
**Básicos (6):** Chatarra, Cuerda, Pilas, Tela, Madera, Papel aluminio.
**Raros:** Lente, Circuito, Aceite.

## Crafteo
Cuadrícula **3×3**. Se colocan los materiales en **cualquier casilla** (sin orden) y sale el objeto.
Regla: **si un objeto no se puede craftear, es exclusivo de una clase. Si no es exclusivo, cualquiera lo craftea.**

### Objetos crafteables (todos)
| Objeto | Materiales | Efecto |
|---|---|---|
| Taser | 1 Circuito + 2 Pilas + 1 Chatarra | Aturde 4 s, 2 cargas, corto alcance |
| Brujitas (petardos de feria) | 1 Aluminio + 1 Tela + 1 Chatarra (salen 3) | Al pisarlas aturden 2 s y su siguiente ataque hace 50% menos daño por 5 s |
| Máscara | 2 Tela + 1 Cuerda | Inmunidad 10 s (no te reconoce) |
| Barricada | 3 Madera + 1 Chatarra | Bloquea una puerta; el animatrónico tarda 6 s en romperla |
| Trampa de cuerda | 2 Cuerda + 1 Madera | Frena 4 s |
| Caja de música | 1 Circuito + 1 Pilas + 1 Madera | Atrae al animatrónico 8 s en zona amplia |
| Mancha de aceite | 1 Aceite + 1 Tela | Resbala y aturde 3 s |
| Linterna turbo | 2 Pilas + 1 Chatarra | +1 uso de linterna |

### Objetos exclusivos de clase (no crafteables)
| Clase | Objeto |
|---|---|
| Explorador | Pistola de aluminio: abre el microondas (un uso) |
| Fotógrafo | Cámara de fotos: la foto aturde 5 s |
| Cazador | Pistola Nerf: dardo largo, aturde 2 s, munición limitada |
| Cocinero | Pizza (cocinada en el microondas): se lanza, el animatrónico va y se queda 7 s |
| Cerrajero | Ganzúa: salta una puerta con llave de la cadena |
| Médico | Jeringa de adrenalina: cura 40% (propuesta) |
| Corredor | Bebida energética: corre más rápido 5 s (propuesta) |
| Sigiloso | Bomba de humo: el animatrónico no ve 4 s (propuesta) |

| Ingeniero | Torreta de dardos: se coloca en el suelo y aturde al animatrónico 1.5 s cada 3 s durante 15 s |
| Electricista | Pulso EMP: apaga el radar del animatrónico 10 s y lo aturde 1 s |

## Las 10 clases
1 Explorador (empieza con 15 de aluminio) · 2 Ingeniero (craftea el doble de rápido; 3 Chatarra + 2 Pilas) · 3 Corredor (más velocidad, menos vida) · 4 Médico (cura a otros) · 5 Sigiloso (el radar casi no lo detecta si camina despacio) · 6 Fotógrafo (empieza con 1 Lente; su foto aturde 2 s más) · 7 Cocinero (empieza con 1 Comida; pizza dura 10 s) · 8 Cazador (Nerf con más munición) · 9 Cerrajero (empieza con 1 Ganzúa) · 10 Electricista (arregla la luz en 1.5 s, recarga la linterna al doble; empieza con 1 Circuito).

## Los 10 enemigos (juguetes que se transforman en robots grandes)
Casi iguales entre sí; cada uno cambia un solo detalle. Nivel N = juguete N.
1 Muñeca (base) · 2 Mono de platillos (los platillos avisan) · 3 Soldadito de plomo (más lento, ve más lejos) · 4 Payaso de resorte (salto corto) · 5 Osito de peluche (se aturde 1 s menos) · 6 Robot de cuerda (carga y corre más rápido a ratos) · 7 Conejo tambor (radar más grande) · 8 Caballito de madera (giro rápido) · 9 Patito de hule (ruidoso, rompe barricadas más rápido) · 10 **El Constructor** (gigante, jefe).

## Los 10 mapas
Todos con: estación de recarga, arreglo de luz, mesa de crafteo, cocina/microondas, bóveda, salida con código.
1 Casa Abandonada (recarga: estacionamiento; luz: cuarto del piso 2; salida: taller) · 2 Pizzería Cerrada · 3 Escuela Nocturna (casilleros para esconderse) · 4 Hospital Abandonado (casi sin luz) · 5 Mansión Vieja (pasadizos secretos) · 6 Centro Comercial (escaleras eléctricas) · 7 Hotel Playero (habitaciones numeradas) · 8 Teatro Antiguo (el escenario atrae) · 9 Fábrica de Juguetes (cintas que arrastran) · 10 Guarida del Constructor (larga, jefe).

## Red (opción A, gratis)
Salas con código. El navegador de quien crea la sala actúa como servidor de esa partida (conexión directa entre jugadores, WebRTC) con un servicio público gratuito para el encuentro inicial. Nadie tiene que crear ni pagar un servidor; el juego se publica una sola vez en GitHub Pages.
La lógica de la partida se escribirá separada de la red para poder moverla después a un servidor Node (opción B) si hace falta.

## Orden de construcción
1. Movimiento con joystick + mapa 1 de dos pisos.
2. Salas con código y partida en red, votación, animatrónico al azar.
3. Linterna, vida, forcejeo, radar del animatrónico.
4. Cadena de llaves, bóveda, código, salida.
5. Apagón y computadora.
6. Crafteo 3×3, clases y objetos.
7. Los otros mapas y enemigos, y el modo aventura.
