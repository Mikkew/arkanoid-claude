# SPEC 03 — Múltiples niveles con dificultad progresiva

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-28
> **Objective:** Agregar 3 niveles con layouts de bloques distintos, bola más rápida y paleta más chica por nivel, y bloques `gray` de 2 golpes, con pantalla "Nivel completado" entre niveles y victoria final tras el último.

---

## Scope

**In:**

- Array `LEVELS` en `game.js` con 3 niveles. Cada nivel define: `grid` (matriz de códigos de bloque), `ballSpeed` y `paddleW`.
- Nivel actual en `state.level` (1 a 3). Puntaje y vidas se conservan entre niveles.
- Valores por nivel:
  - Nivel 1: `ballSpeed` 300, `paddleW` 100.
  - Nivel 2: `ballSpeed` 340, `paddleW` 88.
  - Nivel 3: `ballSpeed` 380, `paddleW` 76.
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
- Bloque `X` (`gray`): 2 golpes. Primer golpe: rebota la bola, el bloque sigue vivo y cambia a color `red` (sprite `block_red`). Segundo golpe: se rompe como cualquier bloque.
- Puntaje: 10 puntos solo en el golpe que destruye el bloque. El golpe que daña no suma.
- Explosión (SPEC 02) solo al destruir el bloque, con los frames del color que tiene en ese momento (`red` para un `X` dañado).
- Nuevo status `'levelcomplete'`: al no quedar bloques vivos ni explosiones activas, si `state.level < LEVELS.length` pasa a `'levelcomplete'`; si es el último nivel pasa a `'victory'` (flujo actual de SPEC 02).
- Pantalla "Nivel completado" superpuesta al canvas, con puntaje actual y botón/tecla para continuar (tecla `Enter` o click en botón, mismo estilo que `RESTART_BUTTON`).
- Al continuar: `state.level += 1`, se cargan los bloques, `ball.speed` y `paddle.w` del nuevo nivel, se reposicionan bola y paleta, se limpia `state.explosions` y el status vuelve a `'start'` (bola sobre la paleta, espera gesto para lanzar, como al iniciar).
- HUD: agregar "Nivel N/3" al HUD existente.
- Reinicio tras game over o victoria (`R` o botón): vuelve al nivel 1 con puntaje y vidas reiniciados.
- Perder una vida no cambia de nivel ni restaura bloques (comportamiento de SPEC 01).
- Cambios en `game.js` únicamente.

**Out of scope (for future specs):**

- Sonidos nuevos o cambios de audio (SPEC 04 aparte). El código de audio actual no se toca.
- Persistencia de nivel alcanzado o highscore.
- Selector de nivel o menú de niveles.
- Bloques indestructibles, bloques de 3+ golpes o más de un tipo de bloque multigolpe.
- Power-ups.
- Sprite de daño nuevo o cambios en `assets/spritesheet-breakout.png` / `assets/spritesheet.js`.
- Editor de niveles o carga de niveles desde archivo externo.
- Bonus de puntaje por completar nivel.
- Archivo `levels.js` separado.

---

## Data model

```js
// Definición estática de niveles (game.js)
const LEVELS = [
  { grid: ['RRRRRRRR', /* ... */], ballSpeed: 300, paddleW: 100 },
  { grid: [/* ... */], ballSpeed: 340, paddleW: 88 },
  { grid: [/* ... */], ballSpeed: 380, paddleW: 76 },
];

// Cambios en state (en memoria, sin persistencia)
state.level = 1; // 1..LEVELS.length
state.status;    // se agrega 'levelcomplete' a: 'start' | 'playing' | 'paused' | 'gameover' | 'victory'
// Cada bloque agrega hp:
// { x, y, w, h, color, alive: true, hp: 1 | 2 }
```

Convenciones:

- Código de celda → bloque: `R`→`red`, `Y`→`yellow`, `G`→`green`, `C`→`cyan`, `M`→`magenta` con `hp: 1`; `X`→`gray` con `hp: 2`; `.`→ sin bloque.
- Tamaño de bloque, gap y `GRID_X`/`GRID_Y` no cambian. Filas por nivel = `grid.length`; 6 filas caben en el canvas 480x640 sin tocar la paleta.
- Al dañar un bloque `X`: `hp` pasa de 2 a 1 y `color` de `gray` a `red`. Al llegar `hp` a 0: `alive = false` (SPEC 01/02).
- `PADDLE_W` y `BALL_SPEED` pasan a ser valores por nivel (`LEVELS[state.level - 1].paddleW` / `.ballSpeed`); `resetPaddleAndBall` debe usar `state.paddle.w` en vez de la constante fija.
- `createBlocks` deja de usar `BLOCK_ROWS` / `ROW_COLORS` y lee el `grid` del nivel actual.

---

## Implementation plan

1. Agregar `LEVELS` (con los 3 layouts y valores de arriba), `state.level = 1` y `hp` por bloque. Refactorizar `createBlocks` para leer `LEVELS[state.level - 1].grid`; `resetState` fija `state.level = 1` y aplica `ballSpeed` y `paddleW` del nivel. Test manual: recargar, se ve el layout del nivel 1 idéntico al actual, sin errores en consola.
2. Ajustar `resetPaddleAndBall` para usar `state.paddle.w` y centrar la paleta con él. Test manual: con `state.level = 2` forzado desde consola y `resetState` equivalente, la paleta mide 88 y queda centrada.
3. Implementar el daño de 2 golpes en `updateBall`: si `b.hp > 1`, decrementar `hp`, cambiar `color` a `red`, rebotar y no sumar puntos ni crear explosión; si no, flujo actual (destruir, explosión, +10). Test manual: en un bloque `X`, primer golpe lo vuelve rojo y no suma; segundo lo rompe, suma 10 y explota en rojo.
4. Agregar HUD "Nivel N/3" en `drawHud`. Test manual: el nivel se ve en pantalla durante la partida.
5. Agregar status `'levelcomplete'` y su pantalla (`drawLevelCompleteScreen`), con botón y tecla `Enter`. Modificar la condición de fin del `frame`: sin bloques vivos ni explosiones → `'levelcomplete'` si hay nivel siguiente, `'victory'` si no. Test manual: romper todos los bloques del nivel 1, aparece "Nivel completado" tras la explosión.
6. Implementar `nextLevel()`: incrementa `state.level`, regenera bloques, aplica `ballSpeed`/`paddleW`, limpia `explosions`, reposiciona bola/paleta y pone status `'start'`; conservar `score` y `lives`. Conectar `Enter` y click del botón. Test manual: continuar carga nivel 2 con layout, velocidad y paleta correctos y puntaje/vidas intactos.
7. Ajustar `restartGame` para volver al nivel 1 con valores del nivel 1. Test manual: llegar a nivel 2, perder las 3 vidas, reiniciar con `R`, se ve nivel 1, paleta de 100, vidas 3, puntaje 0. Completar el nivel 3 muestra la victoria final.

---

## Acceptance criteria

- [X] `index.html` carga sin errores en la consola del navegador.
- [X] El nivel 1 tiene el mismo layout, velocidad (300) y paleta (100) que el juego de SPEC 01.
- [X] Los niveles 2 y 3 muestran los layouts definidos en Scope, con bola de 340 / 380 px/s y paleta de 88 / 76 px.
- [X] El HUD muestra "Nivel N/3" con el nivel correcto.
- [X] Un bloque `X` (gris) necesita 2 golpes; tras el primero se dibuja con el sprite `block_red`.
- [X] El primer golpe a un bloque `X` no suma puntos ni crea explosión; el segundo suma exactamente 10 y crea explosión con frames de `red`.
- [X] Al romper el último bloque de los niveles 1 y 2 aparece "Nivel completado" solo después de terminar la explosión.
- [X] "Nivel completado" muestra el puntaje actual y se continúa con `Enter` o click en el botón.
- [X] Al continuar, puntaje y vidas se conservan, los bloques son los del nuevo nivel y la bola espera sobre la paleta.
- [X] Al continuar no quedan explosiones residuales del nivel anterior.
- [X] Al romper el último bloque del nivel 3 aparece la pantalla de victoria final con el puntaje total.
- [X] Perder una vida no cambia de nivel ni restaura bloques rotos.
- [X] Reiniciar (`R` o botón) desde game over o victoria vuelve al nivel 1 con puntaje 0, vidas 3, paleta 100 y bola 300.
- [X] Pausa con `P` o `Escape` sigue funcionando en los 3 niveles.
- [X] Ningún archivo distinto de `game.js` cambia y `git diff` no toca `playSound` ni `sounds`.

---

## Decisions

- **Sí:** 3 niveles. Suficiente para mostrar progresión sin diseñar decenas de layouts.
- **Sí:** niveles como array `LEVELS` dentro de `game.js`. Mantiene la decisión de SPEC 01 de un solo archivo.
- **No:** archivo `levels.js` separado. Sobre-ingeniería para 3 niveles.
- **Sí:** subir velocidad de bola y achicar paleta por nivel. Dificultad progresiva barata, sin lógica nueva.
- **Sí:** bloques `gray` de 2 golpes. Reusa el color `gray` que SPEC 01 dejó rompible en 1 golpe; ahora `gray` pasa a ser multigolpe (cambia lo definido en SPEC 01, ya implementada).
- **Sí:** el bloque dañado pasa a sprite `red`. El atlas no tiene sprite de daño; reusar un color existente evita assets nuevos. Descartado: tinte/alpha sobre el sprite (render extra) y omitir los 2 golpes.
- **Sí:** 10 puntos solo por el golpe que destruye. Regla ya conocida, sin tabla nueva. Descartado: bonus por nivel completado.
- **Sí:** puntaje y vidas se conservan entre niveles. Es la progresión clásica de Arkanoid. Descartado: reiniciar vidas por nivel.
- **Sí:** pantalla "Nivel completado" con continuar explícito. Da respiro y evita lanzar la bola sin aviso. Descartado: salto directo al siguiente nivel.
- **Sí:** status `'start'` tras continuar. Reusa el estado que ya deja la bola sobre la paleta esperando gesto.
- **Sí:** reinicio siempre a nivel 1. Consistente con el reinicio total de SPEC 01. Descartado: repetir el nivel donde se perdió.
- **Sí:** layouts definidos en la spec. Evita improvisar diseño durante la implementación; se pueden ajustar editando la spec antes de aprobarla.
- **No:** sonidos en esta spec. Niveles y sonidos son features distintas; los sonidos van en SPEC 04.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Bola rápida (380 px/s) con `dt` de hasta 0.05 s recorre ~19 px por frame y puede atravesar bloques de 20 px de alto. | Aceptado: el loop ya limita `dt` a 0.05 s y 380 px/s sigue por debajo de la altura del bloque. Se verifica en el test manual del nivel 3. |
| Paleta de 76 px hace más difícil el control de ángulo de rebote. | Es la dificultad buscada; el cálculo de ángulo usa `paddle.w` y escala solo. |
| Bloque `X` dañado queda `red` y un golpe simultáneo o repetido podría contarse doble. | La colisión resuelve un bloque por frame (SPEC 01) y `hp` se decrementa una vez por golpe. |
| Layout con 6 filas (nivel 3) se acerca a la paleta. | Bloques terminan en `GRID_Y + 6 * 24` = 204 px, lejos de `PADDLE_Y` (600). Sin riesgo. |

---

## What is **not** in this spec

- Sonidos nuevos o cambios de audio.
- Persistencia de nivel o highscore.
- Selector de nivel.
- Bloques indestructibles o de 3+ golpes.
- Power-ups.
- Sprites nuevos o cambios en el atlas.
- Editor o carga externa de niveles.
- Bonus de puntaje por nivel.

Cada uno de estos, si se implementa, va en su propia spec.
