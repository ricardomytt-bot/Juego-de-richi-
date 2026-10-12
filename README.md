# Lichilón y los Departamentos

Historia: el Patrón y la Patrona, dueños de los departamentos, subieron la renta. Los tres hermanos
(Lichilón, Julián Chón y Sofi Lofi) tienen que derrotarlos para ganar su depa gratis.

Juego de plataformas para el navegador, ambientado en Mérida, Yucatán. Abre `index.html` para jugar.

- Menú principal: Comenzar el juego, Ver personajes, Logros y Ajustes (volumen de música y efectos,
  velocidad del texto, sacudida de pantalla, botones en pantalla). Los ajustes se guardan en el navegador.
- Al empezar eliges personaje y luego el nivel, organizado por estados de México (Mundo 1: Yucatán).
- Nivel 1: Calle 60 (jefe: el Patrón). Nivel 2: Paseo de Montejo al atardecer (jefa: la Patrona).
  Nivel 3: De visita a la playa, en Progreso, con el Muelle Fiscal al fondo (jefe: el Playero, que se robó la llave).
- Nivel 4: Chichén Itzá (Kukulkán baja de la pirámide y se come la llave). Kukulkán está al fondo, no se le puede tocar: tira 3 fuegos y solo uno (el verde) es el bueno: hay que atacarlo para devolvérselo. Tiene 14 de vida y su rayo es el doble de grande y rápido.
- Los niveles se abren uno por uno: el 2 al pasar el 1, y el 3 al pasar el 2.
- Jefes: el Patrón embiste y lanza recibos; la Patrona lanza chanclas, salta y tira bombas (círculo rojo = explosión, quita 2 vidas; si la pateas se la devuelves); el Playero lanza cocos, embiste con la tabla (te empuja) y salta haciendo salir pinchos de coral (quitan 2 vidas).
- Los huecos del piso muestran el fondo (la calle o el mar), no negro.
- Teclado: flechas/A-D mover, espacio/W saltar, Z atacar, X poder, P o Esc pausa, M sonido.
- Control (Switch, Xbox, PS): palanca o cruceta, A/B saltar, Y atacar, X poder, + pausa.
- Celular/tableta: 5 botones táctiles (gira el celular en horizontal).
- Power-ups: hielo, botas de resorte (15 s) y escudo amarillo (absorbe un golpe).
- Kit Kats: 3 = 1 vida (máximo 5). Al perder una vida te quedas donde estás; sin vidas, vuelves al inicio del nivel.
- Logros: hay 3 personajes secretos que aparecen bloqueados (todavía no están hechos).
- Dibujos de caricatura moderna: colores planos, contorno delgado, cabezotas con ojotes, formas unidas y pelo de una sola pieza (efecto de película antigua opcional en Ajustes).
- Si no se oye nada: Ajustes > Sonido compatible = Sí (usa archivos de audio generados con código).
- Antes de cada nivel hay una cinemática con diálogos del personaje y del jefe, con voces inventadas (piiitos por letra, como en Animal Crossing). Se puede saltar con SALTAR.
- Monedas: los jefes sueltan monedas (5, 8, 10 y 15) y los logros dan monedas de premio. Se guardan en el celular y se gastan en la TIENDA del menú principal (bola eléctrica, escudo dorado, imán de Kit Kats, corazón extra, cristal de hielo y doble salto).
- Logros: 8 logros difíciles con premio en monedas.
- Perfiles: hasta 4 partidas guardadas (menú PERFIL) con todos tus datos; los ajustes son compartidos.
- Los escarabajos ahora son mariquitas rojas. Sin mariposas ni luciérnagas; fondos más claros y limpios.
- Personaje nuevo: Mamá (se desbloquea al derrotar a Kukulkán). Ataca con un súper puño (¡PAM!) con el mismo daño que una patada.
- MODO_PRUEBA (en index.html): mientras es true todos los niveles están abiertos; en la versión final se cambia a false.


## Versión 3.2
- Menos trabas: los sonidos y la música del modo compatible se fabrican en un hilo aparte (Worker) y se precargan; el fondo y el terreno se preparan por partes; la calidad automática no baja durante los primeros segundos de un nivel.
- Kukulkán más difícil (3 fuegos, solo uno bueno; más vida; rayo doble). Pequeño pulido gráfico (sombras en cielo y suelo).

## Versión 3.3
- Botones de mover (◀ ▶) un poco más grandes.
- Los logros ya no dan monedas solos: se **reclaman** en LOGROS (botón RECLAMAR; en el menú aparece un globito rojo con los pendientes).
- Economía rebalanceada: jefes dan 10/15/20/30 monedas; logros 25–50 (suman 295). Las habilidades cuestan 40–90 (suman 360).
- La TIENDA ahora es **HABILIDADES**: Imán (40), Capa planeadora (50), Zapatos veloces (50), Dash (60, botón DASH / Shift), Savia vital (70, corazón azul extra por nivel), Doble salto (90). Lo que se compró de la tienda anterior (bola eléctrica, escudo, corazón, hielo) se devuelve en monedas.

## Versión 3.4 — Mundo 2: Baja California (nivel 5: La Bufadora)
- Historia: los hermanos viajan a Baja California, pero el Patrón compró todos los hoteles y no quiere hospedarlos. Hay que vencer a su gente para conseguir cuarto y monedas.
- Selector de mundos (flechas ◀ ▶ en la pantalla de niveles). Mundo 2 se desbloquea al pasar Chichén Itzá (en modo prueba está todo abierto). Próximos niveles: Los Cabos, Frontera de Tijuana y un nivel icónico.
- Nivel 5 "La Bufadora" (Ensenada): tema basado en una foto real de La Bufadora (cielo nublado, mar oscuro, acantilados de roca negra, tierra rojiza, muro de piedra con borde rojo y blanco, gaviotas), hotel al final y jefe **El Chalán** (10 de vida) con tres ataques: lluvia de rocas (con sombra que avisa dónde caen), escupitajo de vapor y géiseres de La Bufadora. El vapor de los géiseres **quema**: pierdes una vida cada 10 s durante 30 s, y solo se quita tomando la **gota de agua fresca** que aparece en la arena.
- Cinemáticas con música nueva "de suspenso" (grave, muy bajita, pocas notas). La música del nivel también es nueva.

## Versión 3.5 — El Chalán albañil y 3 enemigos de Baja California
- El Chalán ahora es un albañil (casco amarillo, chaleco naranja, cubeta y cuchara). Mismos ataques.
- Enemigos nuevos (nivel La Bufadora): **Cangrejo de la lata** (se esconde en su lata y embiste; solo se le puede pegar cuando queda mareado), **Erizo de mar** (con espinas: no se le puede saltar encima, solo se vence con ataque; se infla si te acercas) y **Gaviota ladrona** (se lanza en picada y te roba los Kit Kats que llevas; si la golpeas antes de que escape, los suelta).

## Versión 3.6 — Nuevo Lichilón (dibujo de Ricardo)
- Lichilón ahora es el dibujo hecho a mano por Ricardo, digitalizado y coloreado (líneas azules de marcador, pelo amarillo, camisa verde, pantalón azul, tenis blancos). Se usa en todas partes: juego, menú, selección de personaje, cinemáticas y el retrato del marcador.
- Está cortado en partes (cabeza, torso, brazos y piernas) que se mueven para caminar, saltar y atacar. Las imágenes van incrustadas en `index.html` (como PNG en base64).

## Versión 3.7 — Lichilón en vector (ultra nítido)
- El dibujo de Ricardo se vectorizó: ya no son imágenes, son formas (se ve nítido a cualquier tamaño y pesa menos). Contorno negro delgado, colores planos, pupilas con brillo y piernas con tubos y zapatos, como los demás personajes.

## Versión 3.8
- Lichilón volvió a su aspecto de antes del dibujo. El dibujo de Ricardo (vectorizado) sigue guardado en el código y se reactiva poniendo `LICHI.listo: true`.

## Versión 3.9
- En el mundo 2 (La Bufadora) ya no salen escarabajos ni serpientes de Yucatán: solo los 3 enemigos nuevos (cangrejo de la lata, erizo de mar y gaviota ladrona).

## Rendimiento (3.9b)
- Las capas de fondo y el terreno solo guardan la franja donde realmente hay dibujo, así se pinta menos por cuadro. La imagen es idéntica (comparada píxel por píxel en los 5 niveles y 3 calidades). Con la CPU frenada 4x: nivel 1 calidad media pasó de ~22.7 a ~17.8 ms por cuadro; La Bufadora de ~17.8 a ~14.7 ms.

## Memoria (3.9c)
- Corrección para que el juego no se vaya poniendo lento con el tiempo (sobre todo en iPhone/Safari): cada vez que se tira un dibujo guardado (al cambiar de nivel o de calidad) ahora se libera su memoria al instante, en vez de esperar a que Safari la recoja. En una prueba de 20 cargas de nivel/calidad se crearon 5,753 dibujos guardados y todos los viejos se liberaron (antes se acumulaban).

## Audio sin acumulación (3.10)
- Los efectos de sonido del modo compatible (el del iPhone) ahora se juntan en un solo archivo y se tocan con 6 reproductores fijos. Antes cada sonido distinto abría 2 reproductores nuevos y, con los minutos, se juntaban decenas (probable causa de que el iPhone se fuera poniendo lento). En total quedan unos 9 reproductores <audio> sin importar cuánto se juegue.
- "Mostrar FPS" (Ajustes) ahora también muestra los minutos jugados y cuántos dibujos guardados hay, para detectar si algo crece con el tiempo.

## Versión 3.11
- Sofi Lofi cae más despacio (caída 0.7→0.55, velocidad máxima de caída 7.5→6).

## Versión 3.12
- Enemigos de Baja California más bonitos: gaviota redondita con ojotes (como la mariquita); erizo turquesa más grande con ojos enojados (al inflarse: puntas moradas y ojos verde-amarillo, modo venenoso); cangrejo ermitaño con una lata de atún como caparazón.

## Versión 3.13
- Los enemigos nuevos del mundo 2 (cangrejo, erizo, gaviota) son más chicos: ninguno es más grande que el jugador. Regla: los enemigos no son más grandes que el jugador salvo que se pida (los jefes son la excepción).

## Versión 3.14 — Niveles con relieve
- Los 5 niveles ya no son planos: lomas, escalones, muros de hasta 3 bloques, zanjas que se cruzan por arriba o por abajo, la gran pirámide de Chichén y terrazas en La Bufadora. Se avanza en una sola dirección. Las arenas de los jefes siguen planas.
- Nuevo bloque de piso alto (`h`) y ayudantes `colina`, `loma` y `valle` para armar niveles.

## Versión 3.15 — Mundo 1: niveles planos con techos y tinacos
- Los niveles 1 a 4 vuelven a ser planos (se quita el relieve de la 3.14 en el mundo 1; el mundo 2 no se tocó).
- Nuevo: **tinaco con vapor**. Al subirte, sube el agua y te lleva al techo plano de una casa (ciudad), palmeras (playa) o choza maya (Chichén). Hay uno a la mitad del nivel (opcional, con moneditas arriba) y uno antes del jefe.
- Antes del jefe: una casa/muro sólido (solo se pasa por el tinaco) y **escaleras para bajar** a la arena. Al despertar el jefe, una reja se cierra detrás de ti.
- En cada arena hay un tinaco con una casita para subirte.
- El terreno en caché se guarda desde más arriba (TER_Y 176) para incluir los techos.

## Versión 3.16 — Enemigos arriba, puentes de playa, arena sin edificio
- Enemigos y pinchos que antes quedaban debajo de los techos ahora nacen arriba, sobre el techo.
- Playa: las palmeras-techo ahora son mini puentes de madera (pilotes, pasamanos y losa de tablones como el Muelle Fiscal).
- Se quitó el edificio / muelle / pirámide / hotel del fondo de las arenas de los jefes: la pelea es solo en la arena.

## Versión 3.17 — Arenas como antes
- Se restaura el fondo (edificio / muelle / pirámide / hotel) de la batalla del jefe y se quitan la casita y el tinaco de las arenas. Las cajas de las arenas vuelven a su lugar original.

## Versión 3.18 — Mundo 2: puente de piedra, plataformas que caen, puestos de comida y niveles más largos
- La Bufadora ahora es un nivel plano sobre un **puente de piedra** (piso y losas color piedra clara). Al fondo, abajo, una mini sección con gente mirando la bufadora desde un puente de piedra.
- Nueva **plataforma que se cae** (`caediza`): si te quedas encima mucho tiempo tiembla, se agrieta y se cae; después de unos segundos vuelve a aparecer. Hay dos secciones con ellas.
- **Puestos de comida** con techo de lámina en lugar de casas, con el mismo tinaco, techo y escaleras al jefe que en el mundo 1. Los enemigos y pinchos nacen arriba del techo.
- Todos los niveles (1 a 5) son unas 40 columnas más largos (ayudante `OFF` para desplazar columnas). Los fondos se calculan según el nivel más largo del tema.

## Versión 3.19 — Niveles el doble de largos con todas las mecánicas
- Los 5 niveles miden entre 416 y 438 columnas (antes ~200): unos 2–3 minutos cada uno.
- Todos los niveles tienen plataformas que se caen, tinacos con techos (casas, palmeras-puente, chozas, puestos de lámina) y escaleras al jefe. Yucatán ahora tiene 6 casas por nivel; La Bufadora tiene 5 puestos de comida y 4 secciones de plataformas.
- `tramos(s, mundo, variante)` arma 223 columnas con tramos llanos, casas con tinaco y secciones de plataformas que caen; usa los enemigos de cada mundo.
- Memoria: el piso en caché solo guarda los pedazos cercanos a la cámara (`mantenerTerreno`), así los niveles largos no gastan más memoria.

## Versión 3.20 — Enemigos especiales, hielo con cooldown, Cazador secreto
- Kukulkán: los dos power-ups de la arena están uno en cada extremo.
- Las plataformas que caen tiemblan antes y caen mucho más rápido (≈0.6 s en lugar de 1.3 s; caen con más aceleración).
- El poder de hielo tiene cooldown de 1.5 s entre disparos (se ve en el icono del marcador) y solo puede haber 2 bolas a la vez.
- Cada nivel agrega 1 o 2 enemigos extra al azar; 50 % de las veces son **especiales**: brillo de color y estrellita, 2 golpes de vida (serpientes: 5), más rápidos y valen más. Se pueden hacer daño con la bola eléctrica pero no mueren de un golpe.
- Logro nuevo "Cazador de élite" (10 enemigos especiales) → personaje secreto **Cazador**: sombrero y espada con tajo de largo alcance.

## Versión 3.21 — Nivel 6: Puerto de Los Cabos y El Pescador
- Nuevo tema `puerto`: muelle de madera, El Arco de Cabo San Lucas al fondo, barcos amarrados (veleros, yates, pangas), pilotes y boyas. Misma estructura de niveles largos (plataformas que caen, casetas con tinaco y techo de lámina, escaleras a la arena).
- Cinemática con la llave que se resbala y cae al mar (animación en la cinemática: tercer elemento `'llave'` de una línea).
- **El Pescador** (jefe, 8 de vida) con la tienda de buceo detrás: no se le puede hacer daño hasta que está mareado.
  - Te tira productos de su tienda (latas, salvavidas, pescados, botas, cajas, anclas): devuélveselos de una patada y se marea (3.8 s). Mientras está mareado, cada golpe le hace daño.
  - Moneda gigante que rueda y explota a los 3 s (explosión: -2 vidas en el radio; si te atropella: -1).
  - Embestida con aviso y caña de pescar: el anzuelo te engancha, te quita una vida y te jala hacia él.

## Versión 3.22 — Efectos de sonido arreglados y nuevos
- Arreglo: en modo compatible (iPhone) los efectos se tocaban desde una "hoja de sonidos" con reproductores `<audio>` que en el iPhone no siempre quedaban listos, y se quedaban mudos. Ahora cada sonido fabricado se toca con WebAudio (buffers, un solo nodo ligero por sonido); si el audio no está activo, se usa un reproductor `<audio>` por sonido como respaldo. La hoja ya no se usa.
- Efectos nuevos: tajo de espada, puñetazo, embestida, dash, enemigo derrotado, enemigo especial derrotado, armadura del especial, golpe al jefe, jefe vencido, explosión, cuenta atrás de la moneda, mareo, enganche del anzuelo, crujido y derrumbe de plataformas, burbujas y "ding" del tinaco, chapuzón al caer al agua, aterrizaje.
- Cinemáticas: la música baja a 16 % (antes 35 %); solo suenan las voces de los personajes, el clic al avanzar y la llave que cae.

## Versión 3.23 — Nivel 7: Los Cabos bajo el agua y El Tiburón
- Primer nivel **acuático** (`acuatico: true`, tema `mar`): se nada (mantén el salto para subir, el agua frena y flotas), fondo marino con rocas y túneles (`techoCol`, `colina`), arrecife, algas, barco hundido, burbujas. 12 tramos generados con `tramosMar` (arrecife, túnel, cueva).
- Enemigos acuáticos: **dorado** (te persigue y muerde; la mordida te inmoviliza 1 s; 2 golpes), **mantarraya** (en el fondo; si la tocas pierdes un corazón; no se puede vencer) y **ajolote** (manda ondas con la cola; 3 golpes). También pueden salir como enemigos especiales extra.
- **El Tiburón** (4 de vida): solo se le puede dañar rompiendo el **diente dorado** que sale del suelo (uno entre 6). Ataques: explosiones de sangre por todo el mapa, grito (tirazo de viento que quita 2 vidas) y dientes que salen del suelo. La llave está entre sus dientes.
- Logro nuevo: "¡Al agua, patos!" (terminar el primer nivel acuático).
- Arreglos de rendimiento: el brillo de los enemigos especiales y del diente dorado ya no crea una imagen nueva en cada cuadro; las monedas solo se dibujan cuando están en pantalla y sin girarlas.

## Versión 3.24 — Ajustes de Los Cabos bajo el agua
- Nado más lento: velocidad horizontal 0.82 → 0.62, subida máxima 2.9 → 2.1, hundimiento máximo 2.0 → 1.4 y el dash en el agua es más corto.
- Ajolote rediseñado: cuerpo rosa claro, cabezota con sonrisa y mejillas, tres branquias como plumas, patitas y cola con aleta.
- El Tiburón ahora tiene 7 de vida (7 dientes dorados) y un ataque nuevo: **embestida** (avisa con una franja roja a la altura donde estás y cruza toda la arena; esquívala nadando arriba o abajo). Cuerpo completo del tiburón cuando embiste.

## Versión 3.25 — Botón de habilidad, Nado rápido y Álbum de stickers
- **Botón HABILIDAD** (táctil; en teclado Shift o L): usa la habilidad equipada. Sin ninguna equipada se ve gris con una ✖ y al tocarlo suena el sonido de error ("pam") con un aviso. Reemplaza al botón DASH.
- Habilidades con botón (se **equipan**, una a la vez, en HABILIDADES): **Dash** y la nueva **Nado rápido** (bajo el agua: 4 s de nado veloz y 6 s de recarga; en tierra suena el error). Las demás habilidades siguen activándose solas. Quien ya tenía el Dash lo lleva equipado.
- **Álbum de stickers** (menú → ÁLBUM): 14 stickers escondidos, 2 por nivel (los de tierra muy arriba sobre azoteas, los del agua pegados al techo del arrecife). Solo brillan cuando estás cerca. Logros "Coleccionista" (7) y "Álbum completo" (14).

## Versión 3.26 — Stickers con lucecita y habilidades desbloqueadas (prueba)
- Los stickers escondidos ahora tienen una lucecita dorada tenue con una estrellita que se ve desde lejos; de cerca brillan más y se ve el emoji.
- `MODO_PRUEBA_HAB = true`: todas las habilidades están desbloqueadas solo para probarlas en esta versión (para quitarlo: ponerlo en false).

## Versión 3.27 — Scroll en los apartados
- Nuevo sistema genérico de zonas que se bajan (`obtenerScroll`, `rectsScroll`, `barraScroll`): barra lateral, deslizar con el dedo, rueda del ratón y flechas (la tarjeta elegida con el teclado siempre se ve). Un botón dentro de una zona con scroll solo actúa si tocas, no si deslizas.
- Se usa en **Habilidades** (la fila de abajo quedaba cortada), **Álbum** (hoy cabe completo; baja solo si crece) y se mantiene el de **Logros**. Perfil, Ajustes, Niveles y Personajes caben completos en pantalla.

## Versión 3.28 — Una sola habilidad a la vez
- Todas las habilidades (imán, capa, zapatos, savia, doble salto, dash y nado rápido) se **equipan** y solo una funciona a la vez (`activa(id)`); equipar otra reemplaza la anterior. Sin habilidad equipada no se activa ninguna.
- El botón HABILIDAD muestra el icono de la equipada; las que funcionan solas muestran un aviso al tocarlo.

## Versión 3.29 — Nivel 8: vuelo a Chiapas y El Piloto
- Nuevo nivel 8 (último del mundo 2): **todo el nivel es dentro del avión**, con un único fondo de cabina (la arena del jefe no tiene fondo propio: continúa el mismo) (ventanillas, compartimentos, asientos azules, alfombra del pasillo; los huecos dejan ver la bodega oscura). Largo, con caedizas, cocina del avión con elevador y escaleras a la cabina. Vuelo rumbo a **Chiapas**.
- Enemigos nuevos: **almohada saltarina** (brinca hacia ti y suelta un Kit Kat), **avión de papel** (planea, avisa y se lanza en picada) y **cafetera de vapor** (silba y suelta un chorro caliente hacia delante). También pueden salir como enemigos especiales.
- Jefe **El Piloto** (contratado por el Patrón): carritos de azafata que hay que saltar, gasolina con círculo rojo que explota y turbulencia (3 s sin poder moverte; cuando estira los brazos, salen pinchos donde hay maletas y carritos tirados, así que hay que moverse a un lugar libre).
- Todas las explosiones (bomba de la Patrona, moneda del Pescador, sangre del tiburón, gasolina) usan el círculo rojo de aviso del nivel acuático, con golpe circular.
- 2 stickers nuevos (álbum de 16, con 8 columnas). Mundos "Chiapas" y "Veracruz y Tabasco" anunciados.

## Versión 3.30 — Papá, skins de la familia y ajolote nuevo
- **Papá** (personaje nuevo): se desbloquea al derrotar a El Piloto. Ataca con un **frisbee** que va, golpea todo lo que toca, regresa y también golpea al volver (solo puede haber uno a la vez). Pelo oscuro corto, barba con canas y polo azul.
- Skins nuevos, en el mismo estilo de siempre, basados en la foto: **Lichilón** (lentes, pelo castaño, polo azul marino con velerito), **Julián Chón** (pelo oscuro, polo guinda con cuello azul marino), **Sofi Lofi** (pelo castaño con pecas, top de rayas azul y blanco, falda blanca) y **Mamá** (blusa coral, cadena dorada con cruz).
- **Ajolote** rehecho según la imagen: cuerpo rosa claro, cabeza redonda, ojos de puntitos, sonrisa ancha, tres branquias rojas por lado y aleta rosa fuerte.
- Nuevo logro "Piloto fuera de servicio". Las tarjetas de personajes se ajustaron para que quepan 7.

## Versión 3.31 — Pelo más güero
- **Lichilón**: pelo rubio y nuevo peinado hacia atrás con las líneas del peine. **Sofi Lofi**: pelo más rubio (mismo peinado).

## Versión 3.32 — Chiapas, nivel 9: Cañón del Sumidero
- Empieza el mundo de **Chiapas**. Nivel 9: acantilados con selva y cascadas, el río verde abajo, orillas de roca con musgo, troncos que se caen y peñascos con elevador de troncos. Largo y con todas las mecánicas. Sin fondo aparte para la pelea: continúa el mismo.
- Tres enemigos nuevos (también como especiales): **mono araña** (cuelga de una liana, se deja caer si pasas debajo y te persigue a brincos), **cocodrilito** (abre la boca y se lanza a morder; luego se cansa) y **guacamaya** (vuela en ondas y suelta semillas).
- Jefe **El Lagarto Rey** (10 de vida): mordida lanzada (si se estrella contra la pared queda aturdido), lluvia de rocas, **coletazo** con círculo rojo de aviso (salta o aléjate) y salto aplastante.
- 2 stickers nuevos (álbum de 18, con 9 columnas).

## Versión 3.33 — Arreglos: sonido, frisbee, enemigos de Chiapas y nuevo Lagarto Rey
- **Sonido molesto del mundo 1 eliminado**: era el "siseo" de las serpientes (un ruido blanco que sonaba al azar y se oía como explosión).
- **Frisbee de Papá**: ahora es de corta distancia (un disco que gira frente a él, como el puño de Mamá pero un poco más ancho).
- **Chiapas, enemigos nuevos**: el mono se cambió por el **jaguar** (se agacha con los ojos rojos y da un salto largo sobre ti) y la guacamaya por el **nahual** (máscara de jade voladora que a ratos se hace fantasma: no la puedes golpear, pero tampoco te toca, y atraviesa paredes). El cocodrilito queda igual.
- **El Lagarto Rey rehecho**: ya no es un enemigo que camina. Está sentado en su trono al fondo (como el Tiburón y Kukulkán) y ataca con **cascadas de lodo** (3 de 6 columnas; ponte en una libre), un **rugido que hace aparecer 4 cocodrilitos** que hay que vencer, una **mordida gigante** (quita 2 vidas) y **lluvia de coronas**: las normales lastiman y hay una **morada** que debes romper de un golpe. Con 3 coronas moradas rotas, cae.

## Versión 3.34 — Sin sonido de "disparo de hielo" y Lagarto Rey con 10 coronas
- Quitado el sonido agudo "escaneo" (sonaba como un disparo de hielo cada vez que un cocodrilito, un nahual o una cafetera se preparaban). Ya no se usa en ningún lado.
- **El Lagarto Rey ahora tiene 10 coronas moradas** que romper (antes 3). Cuando le quedan 3, se enfurece: 4 cascadas de lodo en vez de 3 y más coronas.

## Versión 3.35 — El Lagarto Rey, al fondo y de frente
- El Lagarto Rey está ahora en el **centro** de la arena, sentado en su trono **mirando de frente**, y se dibuja **hasta el fondo**: solo el fondo del cañón queda detrás de él; el suelo, las cosas, los enemigos, los ataques y el jugador pasan por delante.

## Versión 3.36 — Mono lanzacocos, historia del avión y nivel 10: Tuxtla con El Parachico
- **Mono lanzacocos**: reemplaza al nahual (la cabeza flotante). Cuelga de su liana, **no se puede vencer** y te tira cocos; cada coco quita 1 vida **una sola vez** y desaparece (también al caer al piso).
- **Historia**: ahora hay una nota pegada a la llave ("vengan a buscarme a Chiapas — El Patrón"). El Piloto, contratado por el Patrón, pierde la pelea y el avión **se estrella en el Cañón del Sumidero**: al inicio del nivel 9 se ven los restos del avión, y el Lagarto Rey vigila que no salgas.
- **Nivel 10: Tuxtla Gutiérrez** (la plaza): adoquín terracota, montañas y catedral al fondo, marimbas, ceibas y flamboyanes. Sin fondo aparte para la pelea.
- **El Parachico** (8 de vida): solo se le hace daño cuando está **mareado**, y se marea si **devuelves las 3 bolas mágicas** de su capa (patéalas; cada una te quita 2 vidas si te pega). Ataques: **trompo** (gira cruzando la arena), **bolas mágicas**, **fueguitos** que caen en arco (esquívalos) y **zapateado** (salta y manda dos ondas por el suelo).
- 2 stickers nuevos (álbum de 20, con 10 columnas).

## Versión 3.37 — Tuxtla según las fotos y plaza con kiosco para el jefe
- **Nivel 10 rehecho con las fotos**: casonas coloniales crema con adornos, ventanas arqueadas con marcos de madera, frontones y a veces una torrecita con domo; **farolas de fierro verde con globos blancos**, bancas y botes de herrería, jardineras con setos, **taxis amarillos**, letreros verdes "2a. PONIENTE", árboles grandes de sombra y **banderines de papel picado** colgados entre los árboles. Adoquín gris en el piso.
- **Tres kioscos** a lo largo del nivel (domo verde con cupulita, columnas blancas con encaje, base de piedra con escalones).
- **La arena del Parachico es la plaza del kiosco**: kiosco grande al centro con luces y banderines, farolas, bancas, botes y jardineras.

## Versión 3.38 — Parachico: solo una bola de otro color
- De las 3 bolas mágicas, **una es de otro color (azul brillante)**. Solo esa se devuelve de una patada y, al llegar al Parachico, lo marea. Las moradas se destruyen si las pateas (y siguen quitando 2 vidas si te pegan).

## Versión 3.39 — La música ahora suena en el iPhone
- En el modo compatible (iPhone), la música se tocaba con un reproductor `<audio>` que el iPhone a veces bloquea, aunque los efectos (WebAudio) sí sonaban. Ahora la música se toca **con WebAudio, igual que los efectos**. Si WebAudio no arranca, usa el reproductor de antes como respaldo.

## Versión 3.40 — Pantalla bien puesta y música + efectos más estables
- **Pantalla**: el tamaño del juego se calcula con lo que de verdad se ve en el celular (las barras de Safari cambian), se bloquea el scroll de la página y se reajusta al empezar cada nivel. Antes quedaba corrida hacia abajo.
- **Sonido**: compresor más suave (la música ya no "aplasta" los efectos), música un poco más baja, y si el iPhone interrumpe el sonido, se reactiva solo (también al volver a la app) y la música arranca otra vez.

## Versión 3.41 — Música nueva, sonido al salir de la app, bolas más lentas, historia con el Patrón y gráficos
- **Música nueva por completo**: más épica y activa (130–158 BPM): bajo de sierra con fuerza, batería (bombo, caja, hi-hats, toms y platillos), arpegios brillantes, cuerdas, metales y una melodía de sintetizador con vibrato. Sin marimba ni instrumentos "de bebé". Cada nivel tiene su propia canción (menú, calle, tarde, playa, Chichén, Bufadora, puerto, mar, aeropuerto, sumidero, Tuxtla, jefes y cinemáticas).
- **Salirse de la app no apaga el sonido**: ya no se corta al ir al inicio o abrir otra app (queda como app de audio en el Centro de control, con pausa/play). Solo se corta al cerrar la app.
- **Bolas del Parachico más lentas** (y los fueguitos un poco más lentos).
- **Historia con el Patrón**: la nota del Patrón aparece desde el nivel 7 ("vengan por mí a Chiapas"); en los niveles 8, 9 y 10 el Patrón habla por **videollamada** en las cinemáticas, y al terminar cada nivel hay pistas sobre él (Palenque será el siguiente destino).
- **Gráficos más realistas sin perder el estilo animado**: luz de arriba y sombra abajo en personajes, enemigos, jefes y adornos; volumen y grano en el piso; cara con luz, sombra y mejillas; brillo en el pelo; viñeta suave y luz de sol (fría bajo el agua y en el avión).
