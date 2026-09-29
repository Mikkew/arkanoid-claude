# SPEC 02 — Animación de destrucción de bloques

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-09-28
> **Objective:** Reproducir una animación de explosión de 4 frames (150 ms) en la posición de cada bloque roto, usando `EXPLOSION_FRAMES` de `assets/spritesheet.js`, sin alterar colisión ni puntaje.

---

## Scope

**In:**

- Al romper un bloque de cualquier color (`gray|red|yellow|cyan|magenta|hotpink|green`), dibujar su animación de explosión ya existente en el atlas (`EXPLOSION_FRAMES[color]`, 4 frames, sprites de `assets/spritesheet-breakout.png`) en la posición del bloque, con duración total `EXPLOSION_DURATION` (150 ms).
- Dibujar los frames con `drawFrame` de `assets/spritesheet.js`. Sin lógica nueva de slicing ni sprites nuevos.
- El bloque roto sigue marcándose `alive: false` al instante: colisión y puntaje (10) se resuelven en el golpe, como en SPEC 01. La animación es solo visual.
- Victoria diferida: al romper el último bloque, `state.status` pasa a `'victory'` solo cuando termina la animación de ese bloque. Mientras tanto la partida sigue en `'playing'`.
- Varias explosiones pueden correr en paralelo (una entrada por bloque roto, sin cola ni límite).
- Esta spec solo trata la animación visual: no agrega, quita ni modifica ningún sonido.
- La animación avanza con delta time del loop, por lo que se congela en pausa y continúa al reanudar.
- Reiniciar partida limpia las animaciones en curso.
- Cambios en `game.js` únicamente.

**Out of scope (for future specs):**

- Partículas, screen shake u otros efectos.
- Texto flotante de puntaje al romper.
- Animación distinta por color más allá de los frames que ya define el atlas.
- Sprites o frames nuevos en el atlas.
- Animación de derrota (game over) o de pérdida de vida.
- Cualquier cambio de audio (agregar, quitar o modificar sonidos). El código de sonido de SPEC 01 no se toca.

---

## Data model

```js
// Nueva propiedad en state (en memoria, sin persistencia)
state.explosions = [/* { x, y, w, h, color, elapsed } */];
// x, y, w, h: copiados del bloque roto
// color: color del bloque (clave de EXPLOSION_FRAMES)
// elapsed: ms acumulados desde el golpe, 0 → EXPLOSION_DURATION
```

Convenciones:

- Frame actual = `Math.min(3, Math.floor(elapsed / EXPLOSION_DURATION * 4))`.
- Una explosión se elimina de `state.explosions` cuando `elapsed >= EXPLOSION_DURATION`.
- `elapsed` se incrementa con `dt` en ms; `updateBall` y el loop actual trabajan en segundos, convertir explícitamente.
- Todos los colores generan entrada en `state.explosions`, incluido `gray` (usa `EXPLOSION_FRAMES.gray` del atlas).

---

## Implementation plan

1. Agregar `explosions: []` a `state` y limpiarlo en `resetState`. Test manual: recargar, sin errores en consola; reiniciar partida no rompe nada.
2. Al romper un bloque (en `updateBall`, junto a `b.alive = false`), agregar la entrada `{ x, y, w, h, color, elapsed: 0 }` a `state.explosions`. Test manual: romper un bloque, `state.explosions` tiene 1 entrada (inspeccionar en consola).
3. Crear `updateExplosions(dt)`: suma `dt` a cada `elapsed` y filtra las terminadas. Llamarla desde el loop mientras `status === 'playing'` (o `victory` pendiente, ver paso 5). Test manual: la entrada desaparece ~150 ms después del golpe; en pausa no avanza.
4. Dibujar explosiones en `render` con `drawFrame(ctx, EXPLOSION_FRAMES[color][frameIndex], x, y, w, h)`, después de los bloques y antes de paleta/bola. Test manual: al romper un bloque de cualquier color, incluido `gray`, se ve la secuencia de 4 frames del atlas en su posición.
5. Diferir victoria: al romper el último bloque no cambiar a `'victory'` si aún hay explosiones activas; cambiarlo cuando `state.explosions` quede vacío y no queden bloques `alive`. Test manual: romper el último bloque (cualquier color), se ve la explosión completa y luego aparece la pantalla de victoria.

---

## Acceptance criteria

- [X] Al romper un bloque de cualquier color (`gray|red|yellow|cyan|magenta|hotpink|green`) se muestran los 4 frames de explosión del atlas en la posición del bloque.
- [X] La animación dura 150 ms (`EXPLOSION_DURATION`) ± un frame de render.
- [X] Los frames se dibujan con `drawFrame` y `EXPLOSION_FRAMES[color]`, sin slicing manual.
- [X] El bloque roto deja de colisionar y suma 10 puntos en el momento del golpe, no al terminar la animación.
- [X] La bola atraviesa la zona de una explosión en curso sin rebotar.
- [X] Dos o más bloques rotos en frames cercanos muestran sus explosiones simultáneamente, sin cortarse entre sí.
- [X] Ningún archivo ni línea de audio cambia respecto a SPEC 01 (`git diff` no toca `playSound` ni `sounds`).
- [X] Pausar durante una explosión la congela; al reanudar termina el tiempo restante.
- [X] Al romper el último bloque (cualquier color), la pantalla de victoria aparece solo tras terminar su explosión.
- [X] Reiniciar partida desde game over o victoria no deja explosiones residuales en pantalla.
- [X] Sin errores en la consola del navegador.
- [X] Puntaje, vidas, sonidos y pantallas de SPEC 01 siguen funcionando igual.

---

## Decisions

- **Sí:** animación puramente visual, colisión y puntaje instantáneos. Evita doble golpe y rebotes contra bloques "fantasma".
- **Sí:** victoria diferida hasta terminar la última explosión. Se ve el remate completo en vez de tapar el efecto con el overlay.
- **Sí:** duración `EXPLOSION_DURATION` (150 ms) ya definida en el atlas. Cero constantes nuevas.
- **Sí:** animación con delta time. Coherente con el loop de SPEC 01 y se congela sola en pausa.
- **Sí:** `state.explosions` como lista separada en vez de campos extra en cada bloque. Los bloques siguen siendo `alive: false` puros y el render de explosiones no depende de ellos.
- **Sí:** animar también `gray`, con `EXPLOSION_FRAMES.gray` del atlas (hoy apunta a los mismos frames que `red`). Sin caso especial en código; el usuario prefiere usar las animaciones que ya están en los assets. Descartado antes: `gray` sin animación.
- **Sí:** usar solo las animaciones de destrucción ya presentes en el atlas, sin crear sprites ni frames nuevos.
- **Sí:** explosiones en paralelo. Cada bloque roto tiene su propia entrada en `state.explosions`, independiente.
- **No:** audio en esta spec. El usuario quiere enfocarse solo en la animación.
- **No:** partículas, shake ni texto de puntaje. Fuera de scope, cada uno tiene su propia spec.

---

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Victoria diferida deja un estado intermedio (`playing` sin bloques vivos) donde la bola sigue activa y podría caer y quitar vida. | Aceptado: la ventana es ~150 ms. Si la bola cae en ese lapso, se aplica la lógica normal de vida; el criterio de victoria se evalúa solo si `lives > 0`. |
| `elapsed` en ms vs `dt` en segundos en el loop existente. | Convertir explícitamente en `updateExplosions` y cubrirlo en el test del paso 3. |

---

## What is **not** in this spec

- Partículas, screen shake, texto de puntaje.
- Animación por color distinta a la del atlas.
- Frames o sprites nuevos.
- Animación de game over o pérdida de vida.
- Cambios de audio.

Cada uno de estos, si se implementa, va en su propia spec.
