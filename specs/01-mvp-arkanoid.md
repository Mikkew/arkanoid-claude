# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-09-28
> **Objective:** Construir un MVP jugable de Arkanoid en HTML/CSS/JS vanilla, con un nivel fijo, paleta controlada por teclado y mouse, sistema de vidas, puntaje y pantallas de inicio, pausa, derrota y victoria.

---

## Scope

**In:**

- `index.html` con `<canvas>` responsivo, cargando `assets/spritesheet.js` y el nuevo `game.js`.
- `style.css` para centrar el canvas y mantener proporción al redimensionar la ventana.
- `game.js` con toda la lógica: estado, input, física, colisiones, render, loop, sonido.
- Un único nivel fijo: grid de bloques de 8 columnas x 5 filas, usando los sprites de color existentes en `assets/spritesheet.js` (`SPRITES.blocks`).
- Control de paleta por teclado (flechas izquierda/derecha o A/D) y por mouse (`mousemove` sobre el canvas) simultáneamente.
- Rebote de la bola en la paleta con ángulo variable según el punto de impacto (golpear cerca del borde desvía más).
- Rebote de la bola en paredes izquierda, derecha y superior (reflexión simple).
- Sistema de 3 vidas: la bola cae debajo de la paleta → pierde una vida y se reinicia la posición de bola/paleta. A la 3ra pérdida, game over.
- Puntaje: cada bloque roto suma 10 puntos fijos, sin importar color.
- Sonido: reproducir `assets/sounds/ball-bounce.mp3` en cada rebote (pared o paleta) y `assets/sounds/break-sound.mp3` al romper un bloque.
- Pantallas de estado, todas superpuestas al canvas sin recargar la página: inicio (start), pausa, game over (con reinicio), victoria (con reinicio).
- Pausa/reanudar con tecla `P` o `Escape` durante la partida.
- Reinicio de partida desde game over o victoria (tecla `R` o botón en pantalla) sin recargar la página.

**Out of scope (for future specs):**

- Múltiples niveles o progresión de niveles.
- Power-ups.
- Persistencia de highscore (localStorage u otro medio).
- Controles táctiles / soporte mobile.
- Bloques indestructibles o que requieran más de un golpe.
- Puntaje variable por color de bloque.
- Aceleración de la bola durante la partida.

---

## Data model

```js
// Estado global del juego (en memoria, sin persistencia)
const state = {
  status: 'start', // 'start' | 'playing' | 'paused' | 'gameover' | 'victory'
  score: 0,
  lives: 3,
  paddle: { x: 0, y: 0, w: 100, h: 14 },
  ball: { x: 0, y: 0, vx: 0, vy: 0, r: 8, speed: 300 /* px/s, magnitud constante */ },
  blocks: [/* { x, y, w, h, color, alive: true } */],
};
```

Convenciones:

- Coordenadas: origen arriba-izquierda, en un sistema lógico fijo de **480x640** px (ancho x alto). El canvas escala este sistema lógico al tamaño real de ventana vía CSS/transform, manteniendo la proporción (letterbox si no calza).
- Velocidades en píxeles/segundo, actualizadas con delta time (`requestAnimationFrame`).
- Colores de bloque: se usan los 7 colores ya definidos en `SPRITES.blocks` (`gray, red, yellow, cyan, magenta, hotpink, green`), repartidos entre las 5 filas del grid (una asignación fija de color por fila, sin repetir colores adyacentes; el orden exacto se define en la implementación y no es funcionalmente relevante).
- Ningún bloque es indestructible: todos, incluido `gray`, se rompen en 1 golpe.

---

## Implementation plan

1. Crear `index.html` con `<canvas>` lógico 480x640, `<link>` a `style.css`, y `<script>` cargando `assets/spritesheet.js` y `game.js` en ese orden. Test manual: abrir `index.html`, canvas negro visible, sin errores en consola.
2. Crear `style.css`: centra el canvas en la ventana, lo escala manteniendo proporción 480:640 al redimensionar (usando CSS o un listener de `resize` en JS). Test manual: redimensionar ventana, el canvas se reescala sin deformarse.
3. En `game.js`, definir `state`, constantes de layout (tamaño lógico, grid de bloques, paleta y bola iniciales) y dibujar la pantalla de inicio ("Presiona para empezar") sobre canvas vacío. Test manual: recargar, ver pantalla de inicio.
4. Implementar input de paleta: listeners de teclado (flechas/A-D) y mouse (`mousemove`), actualizando `state.paddle.x` clamped a los bordes del canvas lógico. Renderizar paleta y bola estáticas usando `drawSprite`. Test manual: mover paleta con teclado y mouse.
5. Implementar el loop principal (`requestAnimationFrame` con delta time), iniciado al presionar una tecla o click en la pantalla de inicio. Mover la bola, rebotar en paredes izquierda/derecha/superior, rebotar en la paleta con ángulo según punto de impacto (manteniendo `state.ball.speed` constante). Test manual: la bola rebota en paredes y paleta indefinidamente.
6. Renderizar el grid de bloques (8x5) con `drawSprite`, detectar colisión bola-bloque, marcar bloque como `alive: false` al impactar, sumar 10 puntos, reproducir `break-sound.mp3`, y reproducir `ball-bounce.mp3` en cada rebote de pared/paleta. Test manual: romper bloques suma puntaje visible y reproduce sonidos.
7. Implementar pérdida de vida: si `ball.y` supera el borde inferior, decrementar `state.lives`, reiniciar posición de bola y paleta. Si `lives` llega a 0, cambiar `state.status = 'gameover'` y mostrar pantalla con puntaje final. Test manual: dejar caer la bola 3 veces, ver pantalla de game over con el puntaje correcto.
8. Implementar condición de victoria: cuando no quedan bloques `alive`, cambiar `state.status = 'victory'` y mostrar pantalla con puntaje final. Test manual: romper todos los bloques, ver pantalla de victoria.
9. Implementar pausa (`P`/`Escape` alterna `'playing'` ↔ `'paused'`, deteniendo el loop de física y mostrando overlay "Pausa") y reinicio (`R` o botón en pantallas de game over/victoria, que resetea `state` a los valores iniciales y vuelve a `'start'` o `'playing'`). Test manual: pausar y reanudar sin perder el estado; reiniciar desde game over/victoria vuelve a jugar sin recargar la página.

---

## Acceptance criteria

- [ ] `index.html` carga sin errores en la consola del navegador.
- [ ] La pantalla de inicio se muestra antes de que la bola se mueva.
- [ ] La paleta se mueve con flechas izquierda/derecha, con A/D, y con el mouse.
- [ ] La bola rebota correctamente en las paredes izquierda, derecha y superior.
- [ ] El ángulo de rebote en la paleta cambia según el punto de impacto.
- [ ] Romper un bloque suma exactamente 10 puntos y el bloque desaparece del canvas.
- [ ] Se reproduce `break-sound.mp3` al romper un bloque y `ball-bounce.mp3` en cada rebote de pared/paleta.
- [ ] Al caer la bola debajo de la paleta se pierde una vida y la bola/paleta se reinician de posición.
- [ ] Tras perder 3 vidas se muestra la pantalla de game over con el puntaje final.
- [ ] Al romper todos los bloques se muestra la pantalla de victoria con el puntaje final.
- [ ] `P` o `Escape` pausa y reanuda la partida sin perder el puntaje ni la posición de los bloques.
- [ ] Desde game over o victoria, reiniciar (tecla `R` o botón) vuelve a jugar una partida nueva sin recargar la página.
- [ ] El canvas se reescala manteniendo proporción al redimensionar la ventana.
- [ ] Cerrar y volver a abrir `index.html` no conserva puntaje ni progreso (sin persistencia, por diseño).

---

## Decisions

- **Sí:** control de paleta con teclado y mouse simultáneos. El usuario lo pidió explícitamente para máxima flexibilidad.
- **Sí:** un solo nivel fijo (8x5). Es lo mínimo para tener un MVP jugable; múltiples niveles quedan para otra spec.
- **Sí:** 3 vidas, clásico de Arkanoid, sencillo de implementar y entender.
- **Sí:** usar los sonidos ya presentes en `assets/sounds/` en vez de agregar nuevos assets.
- **No:** persistencia de highscore. Simplifica el MVP; se puede agregar después sin tocar la lógica core del juego.
- **Sí:** ángulo de rebote según punto de impacto en la paleta. Es el comportamiento esperado de Arkanoid/Breakout y da control real al jugador.
- **Sí:** las 4 pantallas de estado (inicio, pausa, game over, victoria). Sin ellas el juego no se siente "jugable" de forma completa.
- **Sí:** canvas responsivo con sistema de coordenadas lógico fijo (480x640) escalado a la ventana. Da buena experiencia sin complejizar la física (la lógica sigue en coordenadas fijas).
- **Sí:** un solo `game.js` con toda la lógica. Para el tamaño de este MVP, dividir en módulos es sobre-ingeniería.
- **No:** bloques indestructibles (`gray` incluido). Fuera de scope del MVP; se puede agregar como power-up/obstáculo en otra spec.
- **Sí:** puntaje fijo de 10 por bloque, sin variar por color. Evita definir una tabla de puntajes arbitraria en el MVP.
- **No:** aceleración de la bola durante la partida. Mantiene la física simple y predecible para el MVP.

---

## Risks

| Risk                                                                 | Mitigation                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Políticas de autoplay del navegador bloquean el audio antes de interacción del usuario | Los sonidos solo se reproducen dentro del loop de juego, que arranca tras un click/tecla del usuario (gesto válido para autoplay). |
| `assets/spritesheet.js` carga la imagen de forma asíncrona (`loadSpritesheet`) | El loop y el render de la pantalla de inicio esperan el callback de `loadSpritesheet` antes de dibujar sprites; mientras tanto se puede mostrar un canvas vacío o texto de carga. |

---

## What is **not** in this spec

- Múltiples niveles o progresión.
- Power-ups.
- Persistencia de highscore.
- Controles táctiles / mobile.
- Bloques indestructibles.
- Puntaje variable por color.
- Aceleración de la bola.

Cada uno de estos, si se implementa, va en su propia spec.
