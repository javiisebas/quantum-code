# El anfitrión también quiere jugar (4 móviles, ninguna tele)

> Estado: **parcialmente implementado** (rama `feat/host-also-plays`). Hecho: el punto 1
> (`manifest.needsSharedScreen` + etiqueta en el catálogo) y el grupo 3 («Yo también juego» en
> Spyfall, Impostor, Hombres Lobo y El Camaleón — el host reclama asiento real y su dispositivo
> proyecta SU carta en local, con la sala a un toque en la TopBar). Pendiente: grupo 1 (separar
> motor y vista en La Bomba/Chispas) y la decisión de producto del grupo 2 (por ahora Sintonía y
> Código Secreto se declaran «Necesita pantalla», que es la salida honesta que este doc admite).
> Verificado contra el código real, no supuesto.

## El escenario que hoy no existe

La app asume dos clases de dispositivo: **una pantalla compartida** (la tele/portátil que hace de
anfitrión) y **N móviles**. Pero el caso normal en un bar o en un sofá es: _cuatro personas, cuatro
móviles, y ninguna tele_. Hoy quien enseña el QR queda condenado a mirar cómo juegan los demás.

## Por qué no hay UNA solución: la pantalla compartida no significa lo mismo en cada juego

El motor del juego (temporizadores, publicación de estado) **corre en el dispositivo anfitrión**, y en
un móvil una pestaña en segundo plano se suspende. Así que "abre otra pestaña y únete" no vale: el
anfitrión tiene que seguir en primer plano. La pregunta real es entonces _¿qué pierde el grupo si la
pantalla del anfitrión deja de verse?_ — y la respuesta cambia por juego:

### Grupo 1 — la pantalla del host es REDUNDANTE (La Bomba, Chispas)

`bomba/Player.tsx` ya muestra la categoría, quién tiene la bomba y el botón «¡Pasar!»; el móvil se
basta solo. La pantalla del host no aporta información que el jugador no tenga ya.

**Solución:** el anfitrión reclama un asiento como uno más y su dispositivo muestra la **vista de
jugador**. El tablero sigue montado como **motor** (sus efectos y temporizadores corren igual), pero
sin público. Requiere separar el motor de su vista — hoy `BombaBoard` es las dos cosas a la vez.

### Grupo 2 — la pantalla del host es un INSTRUMENTO del juego (Sintonía, Código Secreto)

En Sintonía el **dial vive en `Host.tsx`** (`RangeInput`), no en el móvil: es el mando que el grupo
mueve entre todos. En Código Secreto la pantalla ES el tablero de 25 palabras. Aquí la pantalla del
anfitrión no se puede esconder.

Y hay una contradicción de fondo: si el móvil del anfitrión es a la vez la pantalla que todos miran
**y** su carta privada (el objetivo del psíquico, el mapa del espía), el secreto deja de serlo.

**Solución:** o el juego se rediseña para que el instrumento viva en los móviles (p. ej. cada uno mueve
su dial y se toma la mediana), o se admite que **necesita una pantalla aparte** y se dice.

### Grupo 3 — no hay tablero (Spyfall, Impostor, Hombres Lobo, El Camaleón)

Tras repartir, la pantalla del anfitrión solo enseña el QR y «Nueva ronda». No hay nada que mirar.

**Solución (la más fácil y la de más valor):** el anfitrión reclama asiento y su dispositivo muestra
**su propia carta**; «Nueva ronda» y «Compartir» se van a la `TopBar`. No hace falta backend nuevo.

## Lo que hay que construir

1. **`manifest.needsSharedScreen: boolean`** — y el catálogo lo dice antes de que elijas
   («Solo móviles» / «Necesita una pantalla aparte»). Que la app te deje empezar una partida que no
   puedes jugar con los dispositivos que tienes es el fallo de verdad.
2. **«Yo también juego» en el lobby** — reclama asiento + nombre para el dispositivo anfitrión, que
   aparece en el roster con su distintivo. Solo se ofrece donde es coherente (grupos 1 y 3).
3. **Separar motor y vista** en los juegos en vivo, para que el grupo 1 pueda esconder el tablero sin
   parar el juego.
4. **Sintonía y Código Secreto**: decidir producto — rediseñar el instrumento hacia los móviles, o
   marcarlos como «necesita pantalla aparte» y parar ahí.

Empezar por el 1 y el 3: el 1 evita la frustración a coste casi cero, y el 3 desbloquea la mitad del
catálogo (4 de 8 juegos) para el escenario de solo-móviles.
