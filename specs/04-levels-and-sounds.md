# SPEC 04 — Cinco niveles, selector de nivel en pausa y reglas de sonido

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-09-30
> **Objective:** Ampliar a 5 niveles con layout distinto y bola cada vez más rápida, permitir saltar a cualquier nivel desde la pausa, y ajustar el audio para que paleta y bordes suenen `bounce` y todo golpe a bloque suene solo `break`.

---

## Scope

**In:**

Niveles (amplía SPEC 03, ya implementada: 3 → 5 niveles y paleta fija):

- Array `LEVELS` en `game.js` con 5 niveles. Cada nivel define `grid` (matriz de códigos de bloque) y `ballSpeed`. La paleta no cambia: `PADDLE_W` fijo en 100.
- `ballSpeed` por nivel: 300, 330, 360, 390, 420 px/s.
- Nivel actual en `state.level` (1 a 5). Puntaje y vidas se conservan entre niveles.
- Layouts (8 columnas; `.` = vacío, `R` red, `Y` yellow, `G` green, `C` cyan, `M` magenta, `X` = `gray` de 2 golpes):
  - Nivel 1 (5 filas, igual al grid actual de SPEC 01, sin `X`):
    ```
    RRRRRRRR
    YYYYYYYY
    GGGGGGGG
    CCCCCCCC
    MMMMMMMM
    ```
  - Nivel 2 (5 filas):
    ```
    XXXXXXXX
    RYGCCGYR
    .MM..MM.
    RYGCCGYR
    ........
    ```
  - Nivel 3 (6 filas):
    ```
    X..XX..X
    XRXYYXRX
    GXCXXCXG
    MMX..XMM
    XRYGGYRX
    ..XXXX..
    ```
  - Nivel 4 (6 filas):
    ```
    XRXXXXRX
    YGCMMCGY
    X.XXXX.X
    MCGYYGCM
    .XRXXRX.
    ..XXXX..
    ```
  - Nivel 5 (7 filas):
    ```
    XXXXXXXX
    XRYGGYRX
    XCMXXMCX
    XGXRRXGX
    XMCXXCMX
    XYRGGRYX
    ..XXXX..
    ```
- Bloque `X` (`gray`): 2 golpes. Primer golpe: la bola rebota, el bloque sigue vivo y cambia a color `red` (sprite `block_red`). Segundo golpe: se rompe como cualquier bloque.
- Puntaje: 10 puntos solo en el golpe que destruye el bloque. El golpe que daña no suma.
- Explosión (SPEC 02) solo al destruir el bloque, con los frames del color que tiene en ese momento (`red` para un `X` dañado).
- Nuevo status `'levelcomplete'`: sin bloques vivos ni explosiones activas, si `state.level < LEVELS.length` pasa a `'levelcomplete'`; si es el último nivel pasa a `'victory'` (flujo de SPEC 02).
- Pantalla "Nivel completado" superpuesta al canvas, con puntaje actual y botón/tecla para continuar (`Enter` o click en botón, mismo estilo que `RESTART_BUTTON`).
- Al continuar (y al saltar de nivel, ver abajo) se ejecuta `loadLevel(n)`: `state.level = n`, bloques del nivel, `ball.speed` del nivel, bola y paleta reposicionadas, `state.explosions` vacío y status `'start'`. Puntaje y vidas no cambian.
- HUD: "Nivel N/5".
- Reinicio tras game over o victoria (`R` o botón): nivel 1 con puntaje y vidas reiniciados.
- Perder una vida no cambia de nivel ni restaura bloques (SPEC 01).

Selector de nivel en pausa:

- Estando en `'paused'` (activada con `P` o `Escape`, SPEC 01), el overlay muestra 5 botones "1" a "5" y las teclas `1`–`5` hacen lo mismo. Estilo de los botones como `RESTART_BUTTON`; el nivel actual se ve resaltado.
- Los 5 niveles están siempre disponibles. Sin desbloqueo ni persistencia.
- Elegir un nivel (incluido el actual) ejecuta `loadLevel(n)`: bloques frescos del nivel, status `'start'`, puntaje y vidas conservados.
- Las teclas `1`–`5` solo actúan en `'paused'`; durante `'playing'`, `'start'`, `'levelcomplete'`, `'gameover'` y `'victory'` se ignoran.

Audio (solo `bounce` y `break` existentes):

- La bola rebota contra pared lateral, techo o paleta → suena `bounce`.
- La bola golpea cualquier bloque → suena solo `break`, **sin** `bounce`. Aplica también al primer golpe de un bloque `X` (daña sin destruir) y al golpe que destruye.
- No se agregan sonidos ni archivos de audio. Sin control de volumen ni mute.
- Cambios en `game.js` únicamente.

**Out of scope (for future specs):**

- Sonidos nuevos (nivel completado, victoria, game over, vida perdida, golpe dañino) y cualquier asset de audio nuevo.
- Música de fondo, mute o control de volumen.
- Persistencia de nivel alcanzado, desbloqueo de niveles o highscore.
- Menú principal de niveles fuera de la pausa.
- Paleta variable por nivel.
- Bloques indestructibles, bloques de 3+ golpes o más de un tipo multigolpe.
- Power-ups.
- Sprite de daño nuevo o cambios en `assets/spritesheet-breakout.png` / `assets/spritesheet.js`.
- Editor de niveles o carga desde archivo externo; archivo `levels.js` separado.
- Bonus de puntaje por completar nivel.

---

## Data model

```js
// Definición estática de niveles (game.js)
const LEVELS = [
  { grid: ['RRRRRRRR', /* ... */], ballSpeed: 300 },
  { grid: [/* ... */], ballSpeed: 330 },
  { grid: [/* ... */], ballSpeed: 360 },
  { grid: [/* ... */], ballSpeed: 390 },
  { grid: [/* ... */], ballSpeed: 420 },
];

// Cambios en state (en memoria, sin persistencia)
state.level = 1; // 1..LEVELS.length
state.status;    // se agrega 'levelcomplete' a: 'start' | 'playing' | 'paused' | 'gameover' | 'victory'
// Cada bloque agrega hp:
// { x, y, w, h, color, alive: true, hp: 1 | 2 }
```

Convenciones:

- Código de celda → bloque: `R`→`red`, `Y`→`yellow`, `G`→`green`, `C`→`cyan`, `M`→`magenta` con `hp: 1`; `X`→`gray` con `hp: 2`; `.`→ sin bloque.
- Tamaño de bloque, gap y `GRID_X`/`GRID_Y` no cambian. Filas por nivel = `grid.length` (máx. 7: terminan en `GRID_Y + 7 * 24` = 228 px, lejos de `PADDLE_Y` = 600).
- Al dañar un bloque `X`: `hp` de 2 a 1 y `color` de `gray` a `red`. Con `hp` en 0: `alive = false` (SPEC 01/02).
- `BALL_SPEED` pasa a ser valor por nivel (`LEVELS[state.level - 1].ballSpeed`). `PADDLE_W` se mantiene como constante.
- `createBlocks` deja de usar `BLOCK_ROWS` / `ROW_COLORS` y lee el `grid` del nivel actual.
- Botones del selector: lista de 5 rects `{ n, x, y, w, h }` calculada en `game.js`, usada para dibujar y para detectar click en `'paused'`.
- Sonido: sin estructuras nuevas. `playSound` y el objeto `sounds` no cambian; solo cambia desde dónde se llama.

---

## Implementation plan

1. Agregar `LEVELS` (5 layouts y velocidades), `state.level = 1` y `hp` por bloque. Refactorizar `createBlocks` para leer `LEVELS[state.level - 1].grid`; `resetState` fija `state.level = 1` y aplica el `ballSpeed` del nivel. Test manual: recargar, nivel 1 idéntico al actual, sin errores en consola.
2. Corregir audio en `updateBall`: quitar `playSound('bounce')` de la rama de colisión con bloque; en esa rama sonar `break` en cualquier golpe (daña o destruye). Mantener `bounce` en paredes, techo y paleta. Test manual: pared/techo/paleta → `bounce`; cualquier bloque → solo `break`, nunca ambos.
3. Implementar daño de 2 golpes en `updateBall`: si `b.hp > 1`, decrementar `hp`, cambiar `color` a `red`, rebotar, sin puntos ni explosión; si no, flujo actual (destruir, explosión, +10). Test manual: primer golpe a `X` lo vuelve rojo, suena `break`, no suma; segundo lo rompe, suma 10 y explota en rojo.
4. Agregar "Nivel N/5" en `drawHud`. Test manual: el nivel se ve durante la partida.
5. Crear `loadLevel(n)` (nivel, bloques, `ball.speed`, reposicionar bola y paleta, limpiar `explosions`, status `'start'`; sin tocar `score` ni `lives`). Agregar status `'levelcomplete'` con `drawLevelCompleteScreen`, `Enter` y botón; modificar la condición de fin del `frame` (`'levelcomplete'` si hay nivel siguiente, `'victory'` si no). Test manual: romper todos los bloques del nivel 1 muestra "Nivel completado" tras la explosión; continuar carga el nivel 2 con layout y velocidad correctos y puntaje/vidas intactos.
6. Ajustar `restartGame` para volver al nivel 1 con sus valores. Test manual: llegar a nivel 2, perder las 3 vidas, reiniciar con `R`: nivel 1, vidas 3, puntaje 0. Completar el nivel 5 muestra la victoria final.
7. Selector en pausa: dibujar los 5 botones en el overlay de `'paused'`, manejar click y teclas `1`–`5` solo en `'paused'`, llamando `loadLevel(n)`. Test manual: pausar, pulsar `4`, queda el nivel 4 en `'start'` con puntaje/vidas previos; teclas `1`–`5` fuera de pausa no hacen nada.
8. Regresión completa. Test manual: jugar los 5 niveles seguidos, saltar con el selector entre niveles, pausar/reanudar con `P` y `Escape`, perder vidas, reiniciar; sin errores en consola.

---

## Acceptance criteria

- [X] `index.html` carga sin errores en la consola del navegador.
- [X] El nivel 1 tiene el mismo layout, velocidad (300) y paleta (100) que el juego de SPEC 01.
- [X] Los niveles 2 a 5 muestran los layouts definidos en Scope, con bola de 330 / 360 / 390 / 420 px/s y paleta de 100 px.
- [X] El HUD muestra "Nivel N/5" con el nivel correcto.
- [X] Un bloque `X` necesita 2 golpes; tras el primero se dibuja con el sprite `block_red`.
- [X] El primer golpe a un bloque `X` no suma puntos ni crea explosión; el segundo suma exactamente 10 y crea explosión con frames de `red`.
- [X] Al romper el último bloque de los niveles 1 a 4 aparece "Nivel completado" solo después de terminar la explosión.
- [X] "Nivel completado" muestra el puntaje actual y se continúa con `Enter` o click en el botón.
- [X] Al continuar, puntaje y vidas se conservan, los bloques son los del nuevo nivel y la bola espera sobre la paleta.
- [X] Al continuar o saltar de nivel no quedan explosiones residuales.
- [X] Al romper el último bloque del nivel 5 aparece la pantalla de victoria final con el puntaje total.
- [X] Perder una vida no cambia de nivel ni restaura bloques rotos.
- [X] Reiniciar (`R` o botón) desde game over o victoria vuelve al nivel 1 con puntaje 0, vidas 3 y bola 300.
- [X] En pausa se ven 5 botones de nivel y el actual está resaltado.
- [X] En pausa, click en un botón o tecla `1`–`5` carga ese nivel en status `'start'` con puntaje y vidas conservados.
- [X] Las teclas `1`–`5` no hacen nada fuera de `'paused'`.
- [X] Rebote contra pared lateral, techo o paleta reproduce `bounce` y no `break`.
- [X] Cualquier golpe a un bloque (dañino o destructivo) reproduce solo `break`, nunca `bounce`.
- [X] No hay archivos de audio nuevos, control de volumen ni mute.
- [X] Pausa con `P` o `Escape` sigue funcionando en los 5 niveles.
- [X] Ningún archivo distinto de `game.js` cambia y `git diff` no modifica `sounds` ni `playSound`.

---

## Decisions

- **Sí:** una sola spec para niveles y sonido. El usuario pidió trabajarlos en conjunto; modifica lo implementado en SPEC 03 (3 niveles, paleta decreciente) y evita una SPEC de audio aparte. Cambia lo definido en SPEC 03.
- **Sí:** 5 niveles, layouts 1–3 heredados de SPEC 03 y 4–5 propuestos aquí. Los de 4–5 son propuesta del redactor; ajustables en `Draft`.
- **Sí:** solo la bola acelera (300 → 420, +30 por nivel); paleta fija en 100. Pedido explícito del usuario. Descartado: paleta decreciente de SPEC 03.
- **Sí:** selector de nivel en la pausa con los 5 niveles siempre disponibles. Objetivo: poder probar y saltar sin jugar todo. Descartado: desbloqueo por progreso (requiere persistencia, no sirve para probar).
- **Sí:** saltar de nivel conserva puntaje y vidas y deja status `'start'`. Reusa exactamente `loadLevel` del flujo normal; sin camino de código extra. Descartado: reiniciar puntaje.
- **Sí:** botones 1–5 en el overlay más teclas `1`–`5`. Click y teclado, mismo estilo que `RESTART_BUTTON`.
- **Sí:** `bounce` en paleta/bordes y solo `break` en bloques. Regla explícita del usuario; cambia el comportamiento de SPEC 01 (bloques sonaban ambos).
- **Sí:** el primer golpe a `X` suena `break`. El usuario pidió que todo contacto con bloque suene destrucción.
- **Sí:** sonidos por defecto; sin assets nuevos. Descartado: los 5 `.mp3` del borrador anterior de SPEC 04 (nivel completado, victoria, game over, vida perdida, golpe dañino).
- **No:** control de volumen ni mute. El usuario lo descartó.
- **Sí:** niveles como array dentro de `game.js`. Mantiene la decisión de SPEC 01 de un solo archivo. Descartado: `levels.js`.
- **Sí:** 10 puntos solo por el golpe que destruye; sin bonus por nivel.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Bola a 420 px/s con `dt` máximo 0.05 s recorre 21 px por frame, más que la altura de bloque (20 px): posible atravesar un bloque en un frame lento. | A 60 fps son ~7 px/frame. Verificar en el test manual del nivel 5; si ocurre, abrir spec aparte para sub-pasos de colisión. |
| Saltar de nivel desde pausa en medio de una explosión o con bola en vuelo deja estado sucio. | `loadLevel` limpia `explosions`, reposiciona bola y paleta y fija `'start'`. Cubierto en el paso 7. |
| Teclas `1`–`5` colisionan con otros atajos o actúan fuera de pausa. | Se manejan solo con `status === 'paused'`. Criterio de aceptación explícito. |
| `game.js` ya implementa SPEC 03 (3 niveles, `paddleW` por nivel, `levelcomplete`, `hp`). | Pasos 1, 4, 5 y 6 son ajustes sobre lo existente: ampliar `LEVELS`, quitar `paddleW` por nivel, reusar `levelcomplete`/`hp` sin duplicar. Revisar `game.js` antes de cada paso. |
| Quitar `bounce` de bloques cambia la sensación respecto a SPEC 01. | Es pedido explícito; se verifica en el paso 2. |

---

## What is **not** in this spec

- Sonidos o assets de audio nuevos.
- Música, mute o volumen.
- Persistencia de nivel, desbloqueo o highscore.
- Menú de niveles fuera de la pausa.
- Paleta variable por nivel.
- Bloques indestructibles o de 3+ golpes.
- Power-ups.
- Sprites nuevos o cambios en el atlas.
- Editor o carga externa de niveles.
- Bonus de puntaje por nivel.

Cada uno de estos, si se implementa, va en su propia spec.
