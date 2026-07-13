# Notas de seguridad — el modelo de sala

> Estado tras la auditoría del 2026-07-13 (rama `feat/arcade-platform`). Los tres agujeros reales
> están cerrados y fijados con tests. Queda **una** decisión abierta, documentada abajo con su
> razonamiento para que no haya que rederivarla.

## El modelo (lo que hay que no romper)

Es un modelo de **capacidades**, no de sesiones:

- **`hostToken`** — se acuña una sola vez, al crear la sala, y solo lo recibe quien la creó. Autoriza:
  publicar estado, leer el input de todos los asientos, escribir el estado privado de un asiento, y
  **destruir la sala**.
- **`seatToken`** — se acuña al reclamar asiento, y solo lo recibe ese dispositivo. Autoriza: enviar
  el input de _ese_ asiento y leer _su_ porción sellada.
- Los tokens viajan **en cabeceras**, nunca en la URL (no acaban en logs ni en el `Referer`).
- Los juegos de secreto por asiento **proyectan** el payload (`projectForSeat`): el servidor nunca
  manda a un móvil el trozo de otro.

Conocer el código de sala te permite **unirte**. No te permite nada más.

## Cerrado (con tests en `src/app/api/room/[game]/route.test.ts`)

1. **CRÍTICO — `POST` devolvía la baraja completa a cualquiera que supiera el código.**
   `GET /api/join/<code>` → sabes el juego → `POST /api/room/spyfall {code, payload:<válido>}`. Como
   la sala ya existía, `writeRoomIfAbsent` devolvía `created:false` **y el payload almacenado**, que
   la ruta reenviaba tal cual: para los cuatro juegos de roles ocultos eso es _toda la baraja_ (el rol
   de cada asiento y quién es el espía/impostor/lobo). Sin token de host ni de asiento. El `GET`
   proyectaba con cuidado; el `POST` era una puerta lateral que se lo saltaba entero.
   **Ahora:** un juego con `projectForSeat` nunca devuelve el payload almacenado a quien no creó la sala.

2. **ALTO — `DELETE` no tenía autorización ninguna.** Era la única mutación sin token (todas sus
   hermanas sí lo exigen), y borra la sala _y libera el código_: cualquiera con el código podía cargarse
   una partida en curso y luego **okupar el código liberado** para otro juego.
   **Ahora:** `DELETE` es host-autoritativo. El token se propaga por los tres flujos que liberan sala
   ("Nueva ronda", el release al terminar de Código Secreto, y "Nueva partida"), lo que obligó a
   persistirlo en dos hosts que no lo hacían, y a adoptar el re-acuñado cuando una sala caducada se
   recrea. Un token viejo degrada con gracia: la sala vieja simplemente agota su TTL.

3. **MEDIO — se podía reclamar asiento en una sala inexistente.** `POST /seat` acuñaba y **guardaba**
   un token para cualquier código de 6 dígitos → escrituras arbitrarias en Redis (DoS de coste/espacio).
   **Ahora:** reclamar exige que la sala exista. Un móvil legítimo siempre tiene un código vivo.

## Abierto — decisión razonada: **no** hay rate limiting en `GET /api/join/<code>`

Es un oráculo 200-vs-404 sin autenticar sobre un espacio de 900.000 códigos con TTL de 7 días. Un solo
host a unos miles de req/s lo barre en minutos y cosecha todas las salas vivas y su juego.

**Por qué no lo hemos puesto:**

- Con (1), (2) y (3) cerrados, lo que queda de un barrido es **griefing, no robo de datos**. Ya no se
  puede leer un secreto ni destruir una sala solo con el código.
- El limitador por IP ingenuo es un **tiro en el pie**: una fiesta real son ~20 móviles detrás del NAT
  de una casa, o sea **una sola IP pública**. Un cubo estrecho estrangularía a los jugadores de verdad.
- No podemos ejercitar un cambio en el camino caliente en local (CI es el único gate), y meterlo a
  ciegas es más arriesgado que la amenaza que mitiga.

**Si se quiere poner, el diseño proporcionado y sin dependencias nuevas es:**

Un contador Redis (`INCR` + `EXPIRE`) por IP que **solo incrementa en un 404**. Un jugador legítimo casi
siempre acierta un código vivo (→ 200); un barredor falla casi siempre (→ 404). Umbral generoso (~100
fallos / 10 min) y **fail-open** ante cualquier error del store: si el limitador se cae, la app sigue
funcionando. Eso estrangula un barrido de origen único muy por debajo del TTL del código sin tocar el
tráfico legítimo.

## Pendiente de revisar (preexistente, fuera del alcance de hoy)

**Código Secreto es `secrecy: 'shared'`** y devuelve su tablero completo (`roles` + `words`)
públicamente por código, por diseño: los espías leen el mismo mapa. Si el mapa de colores debiera ser
**solo para los espías** y no para cualquiera que tenga el código, ese `GET` es una fuga aparte, anterior
a este refactor. Es una decisión de producto: hoy el código _es_ la credencial de espía.
