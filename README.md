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
